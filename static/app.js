'use strict';

/* SkillSprint India dashboard: every dataset, score, and estimate comes from Flask. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let campaignData = {
  channelProfile: {}, keywords: [], competitors: [],
  videos: [], calendar: [], videoScript: [], troubleshooting: []
};
let activeBlueprint = null;
let latestAnalysis = null;
let seoTimer = null;
let growthTimer = null;
let seoRequestId = 0;
let growthRequestId = 0;
let activateTab = () => {};

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}
function wordCount(text) {
  const clean = String(text || '').trim();
  return clean ? clean.split(/\s+/).length : 0;
}

function normalizeCampaignData(raw) {
  return {
    channelProfile: raw.channel_profile || {},
    keywords: (raw.keywords || []).map(item => ({
      id: item.id,
      keyword: item.keyword,
      intent: item.search_intent,
      monthlyVolume: item.monthly_volume,
      competition: item.competition,
      format: item.recommended_format,
      subscriberHook: item.subscriber_hook
    })),
    competitors: (raw.competitors || []).map(item => ({
      channel: item.channel,
      niche: item.niche,
      titleFormula: item.title_formula || item.titleFormula,
      thumbnailStyle: item.thumbnail_style || item.thumbnailStyle,
      seoStrengths: item.seo_strengths || item.seoStrengths,
      gap: item.gap
    })),
    videos: (raw.video_blueprints || []).map(item => ({
      ...item,
      videoId: item.video_id || item.id,
      primaryKeyword: item.target_keyword || item.primary_keyword,
      titleVariants: item.title_variants || [],
      thumbnailBadge: item.thumbnail_badge || 'FOR STUDENTS'
    })),
    calendar: (raw.promotion_calendar || []).map(item => ({
      day: item.day,
      platform: item.platform,
      content: item.content,
      action: item.action,
      kpi: item.target_kpi
    })),
    videoScript: raw.video_script || [],
    troubleshooting: raw.troubleshooting || []
  };
}

async function postJSON(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

async function loadCampaignData() {
  const status = $('#datasetStatus');
  try {
    const response = await fetch('/api/campaign-data', {
      headers: { 'Accept': 'application/json' }, cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Campaign API returned ${response.status}`);
    const raw = await response.json();
    if (!Array.isArray(raw.keywords) || !Array.isArray(raw.video_blueprints) || !Array.isArray(raw.promotion_calendar)) {
      throw new Error('Campaign API dataset is missing required arrays.');
    }
    campaignData = normalizeCampaignData(raw);
    status.textContent = `Flask API connected · ${campaignData.keywords.length} keywords · ` +
      `${campaignData.calendar.length}-day plan · ${campaignData.videos.length} blueprints`;
    $('#dataSourceBadge').textContent = 'FLASK API CONNECTED';
    $('.offline-pill').innerHTML = '<span class="status-dot"></span> Flask API online';
    return true;
  } catch (error) {
    status.textContent = `API unavailable · Start the app with python app.py · ${error.message}`;
    $('#dataSourceBadge').textContent = 'API NOT CONNECTED';
    $('.offline-pill').innerHTML = '<span class="status-dot"></span> API offline';
    $('#copyStatus').textContent = 'Could not load campaign data. Start Flask with python app.py and refresh.';
    return false;
  }
}

/* ---------------------------------------------------------------- TAB 1 -- */
function scorePresentation(data) {
  const score = Number(data.score) || 0;
  $('#seoScore').textContent = score;
  $('#scoreRing').style.setProperty('--score', `${score}%`);
  $('#scoreRing').setAttribute('aria-label', `SEO score ${score} percent`);
  $('#scoreLabel').textContent = score >= 85 ? 'Strong setup' : score >= 65 ? 'Good start' : 'Needs tuning';
  $('#scoreHeadline').textContent = score >= 85 ? 'Strong publishing package' : score >= 65 ? 'A few quick improvements' : 'Tighten the viewer match';
  $('#scoreAdvice').textContent = score >= 85
    ? 'The Flask API generated a complete package. Check that it matches the final edit.'
    : 'Review the failed checklist items, then compare the package with the actual lesson.';
  $('#scoreChecks').innerHTML = (data.checks || []).map(check =>
    `<div class="score-check ${check.passed ? '' : 'fail'}"><span class="check-icon" aria-hidden="true">${check.passed ? '✓' : '○'}</span><span>${escapeHTML(check.label)}</span></div>`
  ).join('');
}

function renderMetadata(data) {
  latestAnalysis = data;
  $('#generatedTitle').textContent = data.optimized_title || '';
  $('#generatedTitleCount').textContent = `${(data.optimized_title || '').length} chars`;
  $('#generatedDescription').textContent = data.description || '';
  $('#descriptionCount').textContent = `${data.description_word_count || wordCount(data.description)} words`;
  $('#generatedChapters').innerHTML = (data.chapters || []).map(item => {
    const match = String(item).match(/^(\d{2}:\d{2})\s+(.*)$/);
    return match
      ? `<li><time>${escapeHTML(match[1])}</time>${escapeHTML(match[2])}</li>`
      : `<li>${escapeHTML(item)}</li>`;
  }).join('');
  $('#generatedFilename').textContent = data.raw_filename || 'video.mp4';
  $('#generatedTags').innerHTML = (data.tags || []).map(tag => `<span class="tag-chip">${escapeHTML(tag)}</span>`).join('');
  scorePresentation(data);
}

async function requestSeoAnalysis() {
  const requestId = ++seoRequestId;
  const keyword = ($('#primaryKeyword').value || '').trim();
  const title = ($('#videoTitle').value || '').trim();
  const niche = $('#videoCategory').value || 'Career skills';
  $('#titleLength').textContent = `${title.length} / 60`;
  $('#titleLength').classList.toggle('over-limit', title.length > 60);
  if (!keyword || !title) return null;

  const button = $('#analyzeButton');
  button.disabled = true;
  button.textContent = 'Calling Flask API…';
  try {
    const result = await postJSON('/api/analyze-seo', {
      title,
      keyword,
      niche,
      blueprint_id: activeBlueprint ? activeBlueprint.videoId : null
    });
    if (requestId !== seoRequestId) return null;
    renderMetadata(result);
    $('#copyStatus').textContent = `SEO package generated by POST /api/analyze-seo · ${result.description_word_count} words.`;
    return result;
  } catch (error) {
    if (requestId === seoRequestId) $('#copyStatus').textContent = `SEO API error: ${error.message}`;
    return null;
  } finally {
    if (requestId === seoRequestId) {
      button.disabled = false;
      button.textContent = 'Analyze & generate';
    }
  }
}

function scheduleSeoAnalysis() {
  window.clearTimeout(seoTimer);
  seoTimer = window.setTimeout(requestSeoAnalysis, 250);
}

function loadBlueprints() {
  $('#blueprintSelect').innerHTML = '<option value="">Choose a blueprint (optional)</option>' +
    campaignData.videos.map(video =>
      `<option value="${escapeHTML(video.videoId)}">${escapeHTML(video.format)} — ${escapeHTML(video.title)}</option>`
    ).join('');
}

function applyBlueprint(video) {
  activeBlueprint = video;
  $('#blueprintSelect').value = video.videoId;
  $('#primaryKeyword').value = video.primaryKeyword;
  $('#videoTitle').value = video.title;
  $('#videoCategory').value = video.category || 'Career skills';
  $('#thumbnailTitle').value = video.title;
  $('#hookText').value = video.thumbnail_text || 'SHOW REAL PROOF';
  $('#subBadge').value = video.thumbnailBadge;
  updateThumbnail();
  requestSeoAnalysis();
}

function loadSelectedBlueprint(id) {
  const video = campaignData.videos.find(item => item.videoId === id);
  if (video) applyBlueprint(video);
  else activeBlueprint = null;
}

function metadataText(data = latestAnalysis) {
  if (!data) return 'No SEO metadata is available. Connect to the Flask API and analyze a video brief.';
  return `SKILLSPRINT INDIA — VIDEO SEO METADATA\nSEO checklist score: ${data.score}/100 (heuristic, not a ranking prediction)\n\nTITLE\n${data.optimized_title}\n\nDESCRIPTION (${data.description_word_count || wordCount(data.description)} words)\n${data.description}\n\nCHAPTERS\n${(data.chapters || []).join('\n')}\n\nRAW FILE NAME\n${data.raw_filename}\n\nTAGS\n${(data.tags || []).join(', ')}`;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  area.style.left = '-9999px';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('Copy was blocked. Select and copy the displayed metadata manually.');
  return true;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------------------------------------------------------------- TAB 2 -- */
function updateThumbnail() {
  const raw = ($('#hookText').value || '').trim().split(/\s+/).filter(Boolean);
  const words = raw.slice(0, 3);
  const visibleText = words.join(' ').toUpperCase() || 'SHOW REAL PROOF';
  const badge = ($('#subBadge').value || 'FOR BEGINNERS').trim().slice(0, 28).toUpperCase();
  const count = raw.length;
  $('#hookWordCount').textContent = count === 3
    ? '3 words · ready'
    : count > 3 ? `${count} words · preview trims to 3` : `${count} words · add ${3 - count}`;
  $('#hookWordCount').classList.toggle('over-limit', count !== 3);

  const lines = visibleText.split(' ');
  const breakAt = Math.ceil(lines.length / 2);
  $('#thumbHeadline').innerHTML =
    `${escapeHTML(lines.slice(0, breakAt).join(' '))}<br><span class="accent-word">${escapeHTML(lines.slice(breakAt).join(' '))}</span>`;
  $('#thumbBadge').textContent = badge || 'FOR BEGINNERS';
  $('#feedTitle').textContent = $('#thumbnailTitle').value || $('#videoTitle').value;
  $('#feedHook').textContent = visibleText;

  const checks = $$('.thumbnail-check');
  const checked = checks.filter(check => check.checked).length;
  $('#checkStatus').textContent =
    `${checked} of ${checks.length} checks complete${checked === checks.length ? ' · ready to export' : ''}`;
  $('#checkStatus').style.color = checked === checks.length ? 'var(--mint)' : 'var(--blue)';
  $('#thumbCanvas').setAttribute('aria-label', `Thumbnail mockup: ${visibleText}, badge ${badge || 'for beginners'}`);
}

/* ---------------------------------------------------------------- TAB 3 -- */
function renderKeywords() {
  const search = ($('#keywordSearch').value || '').trim().toLowerCase();
  const competition = $('#competitionFilter').value || 'all';
  const rows = campaignData.keywords.filter(item => {
    const matchesSearch = !search ||
      `${item.keyword} ${item.intent} ${item.format} ${item.subscriberHook}`.toLowerCase().includes(search);
    return matchesSearch && (competition === 'all' || item.competition === competition);
  });
  $('#keywordRows').innerHTML = rows.length ? rows.map(item =>
    `<tr><td><span class="mini-pill">${escapeHTML(item.id)}</span> <strong>${escapeHTML(item.keyword)}</strong></td>` +
    `<td>${Number(item.monthlyVolume || 0).toLocaleString('en-IN')}</td>` +
    `<td>${escapeHTML(item.intent)}</td>` +
    `<td><span class="competition-pill competition-${escapeHTML(String(item.competition).toLowerCase())}">${escapeHTML(item.competition)}</span></td>` +
    `<td>${escapeHTML(item.format)}</td><td>${escapeHTML(item.subscriberHook)}</td></tr>`
  ).join('') : '<tr><td colspan="6" class="empty-row">No matching keywords. Try another search.</td></tr>';
  $('#keywordResultCount').textContent = `${rows.length} of ${campaignData.keywords.length} keywords`;
}

function renderCompetitors() {
  $('#competitorRows').innerHTML = campaignData.competitors.map(item =>
    `<tr><td><strong>${escapeHTML(item.channel)}</strong><br><span class="muted-text">${escapeHTML(item.niche)}</span></td>` +
    `<td>${escapeHTML(item.titleFormula)}</td><td>${escapeHTML(item.thumbnailStyle)}</td>` +
    `<td>${escapeHTML(item.seoStrengths)}</td><td>${escapeHTML(item.gap)}</td></tr>`
  ).join('');
}

function renderResearchStats() {
  const high = campaignData.keywords.filter(item => String(item.competition).toLowerCase() === 'high').length;
  $('#researchStats').innerHTML =
    `<div class="research-stat"><strong>${campaignData.keywords.length}</strong><span>target search phrases</span></div>` +
    `<div class="research-stat"><strong>${campaignData.videos.length}</strong><span>ready-to-publish blueprints</span></div>` +
    `<div class="research-stat"><strong>${high}</strong><span>high-competition topics to differentiate</span></div>`;
}

function renderBlueprintCards() {
  $('#blueprintCards').innerHTML = campaignData.videos.map(video =>
    `<article class="blueprint-tile" data-video-id="${escapeHTML(video.videoId)}" tabindex="0" role="button" ` +
    `aria-label="Load blueprint ${escapeHTML(video.title)}">` +
    `<div class="blueprint-tile-top"><span class="mini-pill">${escapeHTML(video.videoId.toUpperCase())}</span>` +
    `<span class="mini-pill">${escapeHTML(video.format)}</span></div>` +
    `<h4>${escapeHTML(video.title)}</h4>` +
    `<p class="blueprint-keyword">Target: <b>${escapeHTML(video.primaryKeyword)}</b></p>` +
    `<div class="blueprint-thumb"><span class="blueprint-badge">${escapeHTML(video.thumbnailBadge)}</span>` +
    `<strong>${escapeHTML(video.thumbnail_text)}</strong></div>` +
    `<p class="blueprint-opener">SEO opener: “${escapeHTML(video.description_first_25_words || '')}”</p>` +
    `<p class="blueprint-meta">${(video.chapters || []).length} chapters · ${(video.tags || []).length} tags · ${escapeHTML(video.category)}</p>` +
    `<p class="blueprint-open">Open in SEO Generator →</p></article>`
  ).join('');

  $$('.blueprint-tile').forEach(tile => {
    const open = () => {
      const video = campaignData.videos.find(item => item.videoId === tile.dataset.videoId);
      if (!video) return;
      activateTab(document.getElementById('tab-seo'), true);
      applyBlueprint(video);
      $('#copyStatus').textContent = `Blueprint ${video.videoId.toUpperCase()} loaded from campaign-data.json.`;
    };
    tile.addEventListener('click', open);
    tile.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
    });
  });
}

/* ---------------------------------------------------------------- TAB 4 -- */
function renderCalendar() {
  const uniquePlatforms = [...new Set(campaignData.calendar.map(item => item.platform))];
  const select = $('#platformFilter');
  const previous = select.value;
  select.innerHTML = '<option value="all">All channels</option>' +
    uniquePlatforms.map(platform => `<option value="${escapeHTML(platform)}">${escapeHTML(platform)}</option>`).join('');
  if (uniquePlatforms.includes(previous)) select.value = previous;
  const activeFilter = select.value;
  const rows = campaignData.calendar.filter(item => activeFilter === 'all' || item.platform === activeFilter);
  $('#calendarRows').innerHTML = rows.map(item =>
    `<tr><td><strong>Day ${String(item.day).padStart(2, '0')}</strong></td>` +
    `<td><span class="platform-pill">${escapeHTML(item.platform)}</span></td>` +
    `<td>${escapeHTML(item.content)}</td><td>${escapeHTML(item.action)}</td><td>${escapeHTML(item.kpi)}</td></tr>`
  ).join('');
  $('#calendarSummary').innerHTML =
    `<div class="calendar-kpi"><strong>${campaignData.calendar.length}</strong><span>planned campaign days</span></div>` +
    `<div class="calendar-kpi"><strong>${new Set(uniquePlatforms).size}</strong><span>promotion channels</span></div>` +
    `<div class="calendar-kpi"><strong>${campaignData.videos.length}</strong><span>ready-to-publish blueprints</span></div>` +
    `<div class="calendar-kpi"><strong>${rows.length}</strong><span>actions in current view</span></div>`;
}

function renderScript() {
  $('#scriptSections').innerHTML = campaignData.videoScript.map(section =>
    `<article class="script-section"><div class="script-time"><strong>${escapeHTML(section.time)}</strong>${escapeHTML(section.label)}</div>` +
    `<div><p class="script-copy">“${escapeHTML(section.text)}”</p>` +
    `<p class="field-hint"><b>Visual:</b> ${escapeHTML(section.visual)}</p></div></article>`
  ).join('');
}

function renderPlaybook() {
  const rows = campaignData.troubleshooting.length ? campaignData.troubleshooting : [
    { metric: 'CTR', target: 'Working target 4–7% by source', diagnosis: 'The title or thumbnail promise is unclear, dense, or mismatched.', fix: 'Test a simpler thumbnail and move the viewer outcome earlier in the title.' },
    { metric: 'Average view duration', target: 'At least 40% of video length', diagnosis: 'Long intro, weak pacing, or unexplained steps.', fix: 'Show the result early and revise the largest retention dip.' },
    { metric: 'Impressions', target: 'Validate the topic and audience match', diagnosis: 'The topic may be narrow or sample size may be small.', fix: 'Use Studio Research and publish connected topics with accurate metadata.' },
    { metric: 'Subscribers per view', target: 'Working range 0.5–1.0%', diagnosis: 'The video solves one task but gives little reason to return.', fix: 'State the channel promise, pin a useful resource, and recommend a next lesson.' }
  ];
  $('#playbookRows').innerHTML = rows.map(row =>
    `<tr><td><strong>${escapeHTML(row.metric)}</strong></td><td>${escapeHTML(row.target)}</td>` +
    `<td>${escapeHTML(row.diagnosis)}</td><td>${escapeHTML(row.fix)}</td></tr>`
  ).join('');
}

/* ---------------------------------------------------------------- TAB 5 -- */
function scheduleGrowthSimulation() {
  window.clearTimeout(growthTimer);
  growthTimer = window.setTimeout(updateSimulator, 180);
}

async function updateSimulator() {
  const requestId = ++growthRequestId;
  const impressions = Number($('#impressionsSlider').value);
  const ctr = Number($('#ctrSlider').value);
  const avd = Number($('#avdSlider').value);
  const subRate = Number($('#conversionSlider').value);
  const nf = new Intl.NumberFormat('en-IN');
  $('#impressionsValue').textContent = nf.format(impressions);
  $('#ctrValue').textContent = `${ctr.toFixed(1)}%`;
  $('#avdValue').textContent = `${avd.toFixed(1)} min`;
  $('#conversionValue').textContent = `${subRate.toFixed(1)}%`;

  try {
    const result = await postJSON('/api/simulate-growth', {
      impressions,
      ctr,
      sub_rate: subRate,
      avd
    });
    if (requestId !== growthRequestId) return;
    $('#projectedViews').textContent = nf.format(result.projected_views);
    $('#projectedHours').textContent = Number(result.watch_hours).toLocaleString('en-IN', { maximumFractionDigits: 1 });
    $('#projectedSubs').textContent = nf.format(result.new_subscribers);

    const diagnosis = [
      ctr < 4
        ? ['CTR is below the pilot range.', 'Test a simpler three-word hook and a more specific outcome title.']
        : ['Click appeal is in the working range.', 'Compare Search and Home/Suggested separately before changing packaging.'],
      avd < 2
        ? ['Viewing time is short for a five-minute lesson.', 'Show the finished result in the first 10 seconds and shorten the intro.']
        : ['Average view duration is promising for this scenario.', 'Inspect retention dips and tighten the slowest module.'],
      subRate < 0.5
        ? ['Subscriber rate is below the test range.', 'Add a clear channel promise after delivering value and recommend a related lesson.']
        : ['Subscriber rate is in the test range.', 'Keep the next-video promise specific to the same student audience.']
    ];
    $('#liveDiagnosis').innerHTML = diagnosis.map(item =>
      `<div class="diagnosis-item"><span class="diagnosis-icon" aria-hidden="true">↗</span>` +
      `<span><b>${escapeHTML(item[0])}</b> ${escapeHTML(item[1])}</span></div>`
    ).join('');
  } catch (error) {
    if (requestId === growthRequestId) $('#liveDiagnosis').textContent = `Growth API error: ${error.message}`;
  }
}

/* ----------------------------------------------------------------- TABS -- */
function setupTabs() {
  const buttons = $$('.tab-button');
  function activate(button, focus = false) {
    buttons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      panel.hidden = !selected;
      panel.classList.toggle('active', selected);
    });
    if (focus) button.focus();
  }
  activateTab = activate;

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => activate(button));
    button.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      activate(buttons[next], true);
    });
  });
}

/* ----------------------------------------------------------------- INIT -- */
async function init() {
  setupTabs();
  const connected = await loadCampaignData();
  loadBlueprints();
  renderResearchStats();
  renderKeywords();
  renderCompetitors();
  renderBlueprintCards();
  renderCalendar();
  renderScript();
  renderPlaybook();
  updateThumbnail();
  if (connected) await Promise.all([requestSeoAnalysis(), updateSimulator()]);

  $('#seoForm').addEventListener('submit', async event => {
    event.preventDefault();
    const result = await requestSeoAnalysis();
    if (result) $('#copyStatus').textContent = `Analysis complete · ${result.score}% checklist score returned by Flask.`;
  });
  ['primaryKeyword', 'videoTitle'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      activeBlueprint = null;
      $('#blueprintSelect').value = '';
      scheduleSeoAnalysis();
    });
  });
  $('#videoCategory').addEventListener('change', () => {
    activeBlueprint = null;
    $('#blueprintSelect').value = '';
    scheduleSeoAnalysis();
  });
  $('#blueprintSelect').addEventListener('change', event => loadSelectedBlueprint(event.target.value));
  $('#resetSeo').addEventListener('click', () => {
    activeBlueprint = null;
    $('#blueprintSelect').value = '';
    $('#primaryKeyword').value = 'how to make a resume for students';
    $('#videoTitle').value = 'How to Make a Resume for Students';
    $('#videoCategory').value = 'Career skills';
    $('#thumbnailTitle').value = $('#videoTitle').value;
    updateThumbnail();
    requestSeoAnalysis();
  });
  $('#copyMetadata').addEventListener('click', async () => {
    try {
      const result = await requestSeoAnalysis();
      if (!result) throw new Error('Connect to the Flask API before copying metadata.');
      await copyText(metadataText(result));
      $('#copyStatus').textContent = 'Flask-generated metadata copied. Paste it into your upload draft.';
    } catch (error) { $('#copyStatus').textContent = error.message; }
  });
  $('#exportReport').addEventListener('click', async () => {
    const result = await requestSeoAnalysis();
    if (!result) { $('#copyStatus').textContent = 'Could not export: connect to the Flask API first.'; return; }
    const checks = (result.checks || []).map(check => `${check.passed ? '[PASS]' : '[TODO]'} ${check.label}`).join('\n');
    const report =
      `SKILLSPRINT INDIA — VIDEO SEO STRATEGY REPORT\nGenerated: ${new Date().toLocaleString()}\n\n` +
      `SEO CHECKLIST SCORE: ${result.score}/100 (not a YouTube ranking prediction)\n${checks}\n\n` +
      `${metadataText(result)}\n\n` +
      `CAMPAIGN NOTE\nSearch volumes and targets are planning estimates. Validate in YouTube Studio before reporting actual performance.`;
    downloadText((result.raw_filename || 'video.mp4').replace(/\.mp4$/, '') + '-strategy-report.txt', report);
    $('#copyStatus').textContent = 'Strategy report exported from the Flask API response.';
  });

  $('#hookText').addEventListener('input', updateThumbnail);
  $('#subBadge').addEventListener('input', updateThumbnail);
  $('#thumbnailTitle').addEventListener('input', updateThumbnail);
  $$('.theme-button').forEach(button => button.addEventListener('click', () => {
    $$('.theme-button').forEach(item => {
      item.classList.toggle('selected', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    $('#thumbCanvas').className = `thumb-canvas theme-${button.dataset.theme}`;
    $('#feedThumb').style.background = button.dataset.theme === 'mint'
      ? 'linear-gradient(135deg,#103c38,#21867a)'
      : button.dataset.theme === 'sunrise'
        ? 'linear-gradient(135deg,#351d4a,#b04456)'
        : 'linear-gradient(135deg,#0b1f3a,#174477)';
  }));
  $$('.thumbnail-check').forEach(check => check.addEventListener('change', updateThumbnail));

  $('#keywordSearch').addEventListener('input', renderKeywords);
  $('#competitionFilter').addEventListener('change', renderKeywords);
  $('#platformFilter').addEventListener('change', renderCalendar);
  ['impressionsSlider', 'ctrSlider', 'avdSlider', 'conversionSlider'].forEach(id => {
    document.getElementById(id).addEventListener('input', scheduleGrowthSimulation);
  });
  $('#copyScript').addEventListener('click', async () => {
    const text = campaignData.videoScript.map(section =>
      `[${section.time}] ${section.label}\n${section.text}\nVISUAL: ${section.visual}`
    ).join('\n\n');
    try {
      await copyText(text);
      $('#copyScript').textContent = 'Copied!';
      window.setTimeout(() => { $('#copyScript').textContent = 'Copy script'; }, 1500);
    } catch { $('#copyScript').textContent = 'Select script to copy'; }
  });
  $('#printButton').addEventListener('click', () => window.print());
}

document.addEventListener('DOMContentLoaded', init);
