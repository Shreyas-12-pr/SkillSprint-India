# SkillSprint India YouTube Marketing Engine — Full-site report

**Version:** v1.3
**Generated:** 21 November 2026 at 14:39:39 GMT+5:30
**Project:** SkillSprint India YouTube Marketing Engine

---

## 1. About

SkillSprint India YouTube Marketing Engine is a complete, runnable, single-day college project: a **Flask REST API** plus a **5-tab interactive dashboard** for a YouTube marketing case study on *SkillSprint India*, an educational channel for Indian college students.

**Topic:** YouTube Marketing Strategy to Improve Video Visibility, Increase Subscribers, and Promote Educational Content Using Video SEO and Engaging Thumbnails.

Everything runs locally. No API keys, no database, no YouTube account, and no internet connection are required after `pip install`.

## 2. Purpose

The engine is a **local practice environment** for the full YouTube marketing loop for Indian college students:

1. **Discoverability** — generate ready-to-paste video metadata (optimized title, exactly-200-word description, chapters, tags, raw `.mp4` file name) with a transparent SEO checklist (verified: score 100/100 on the default brief).
2. **Click appeal** — design a 3-word-rule thumbnail with a title-complementary feed-card preview and a mobile-readability checklist (verified: 3 words · ready, 3/4 checks).
3. **Promotion** — plan a 7-day launch sequence across YouTube Long-Form, Community Tab, YouTube Shorts, LinkedIn, and WhatsApp student communities (verified: 7 calendar rows).
4. **Retention & growth** — demo a 5-minute educational script with a 30-second retention hook and value-first subscriber CTA (8 script sections), and model subscriber growth from scenario assumptions (verified: sliders 60000 / 5.5 / 3.2 / 0.8 → 3,300 views).

All outputs are clearly labelled as planning estimates; nothing claims measured YouTube performance.

## 3. Main features (verified in this audit)

### Tab 01 — SEO Analyzer
- Live SEO score (up to 100) from a 7-point checklist: keyword in title, title length (30–60 chars), keyword in the first 25 description words, chapters (≥3), tags (≥5), etc.
- Generated metadata: optimized title (≤60 chars), exactly 200-word keyword-led description, timestamped chapters, up to 15 tags, raw file name.
- Blueprint loading: 4 ready-to-publish blueprints preloaded from `campaign-data.json` (one click loads into Tab 01).
- Actions: Copy metadata + Export strategy report (.txt).

### Tab 02 — Thumbnail Lab
- 16:9 × 1280×720 live canvas with three high-contrast themes: Sprint Navy, Skill Mint, Campus Sunrise (verified switching: `theme-sprint` → `theme-mint` → `theme-sunrise` with updated feed gradients).
- 3-word hook rule with ready/over-limit indicator; badge; title + thumbnail synergy note; YouTube Home feed-card preview (verified live updates).
- Mobile-readability checklist (4 items; the 4th starts unchecked).

### Tab 03 — Research & Blueprints
- Keyword bank: 10 educational keywords with volume, competition, format, subscriber hook (["10 target search phrases","4 ready-to-publish blueprints","6 high-competition topics to differentiate"]).
- 4 ready-to-publish video SEO blueprints: v1: How to Make a Resume for Students, v2: Python Roadmap for Beginners: Start Coding in 2026, v3: Canva vs Google Slides: Best for College Projects?, v4: 7 Resume Mistakes Indian Students Should Avoid.
- Competitor benchmarking matrix: 4 entries (Apna College, CodeWithHarry, WsCube Tech, Physics Wallah) — qualitative, no private analytics.

### Tab 04 — Campaign Plan & Script
- 7-day promotion calendar across 5 channels: YouTube Long-Form, Community Tab, YouTube Shorts, LinkedIn, WhatsApp student communities — with Day + Platform + Content + Promotion action + Target KPI columns.
- Word-for-word 5-minute educational script: 0:00-0:30 High-retention hook · 0:30-1:00 Module 1: Set up the document · 1:00-1:55 Module 2: Write a short profile · 1:55-2:55 Module 3: Turn a project into evidence · 2:55-3:40 Module 4: Add education and skills · 3:40-4:00 Module 5: Final scan and export · 4:00-4:30 Value-first subscriber CTA · 4:30-5:00 End-screen loop to playlist — includes a 30-second retention hook, value-first subscriber CTA, and end-screen note.
- Analytics decision (playbook) table: CTR · Average view duration · Impressions · Subscribers per view.

### Tab 05 — Growth Simulator
- Live sliders: monthly impressions (5k–200k, default 60,000), thumbnail CTR (1–12%, default 5.5%), average view duration (0.5–8 min, default 3.2), subscriber rate per view (0.1–3%, default 0.8%).
- Outputs: projected monthly views, watch hours, new subscribers, and a live diagnosis ("where to optimize next": 3 items).
- Model shown on the page: views = impressions × CTR; watch hours = views × AVD ÷ 60; subscribers = views × sub_rate.

## 4. How it helps

- **Find the right videos:** the SEO checklist + keyword bank push discoverable content into YouTube Search results.
- **Raise click-through:** the thumbnail lab pairs a simple 3-word hook with a complementary title — the two signals that drive CTR in the YouTube Home feed.
- **Run a real promotion cadence:** the 7-day calendar covers Long-Form, Community, Shorts, LinkedIn, and WhatsApp student groups — the channels where students find content.
- **Measure what to change next:** the growth simulator turns assumptions into projected views/watch hours/subscribers with diagnosis items, so students learn to iterate instead of guessing.
- **Learning by doing:** everything is offline and free — no YouTube account needed; outputs are templates to adapt, not fabricated claims.

## 5. Tech stack

| Layer | Technology |
|---|---|
| Backend | Python 3.14.4 — `app.py` (Flask 3.1.3 REST API) |
| Frontend | HTML5 (`templates/index.html`), CSS3 (`static/style.css`), Vanilla JavaScript (`static/app.js` — fetch + small `$`/`$$` helpers) — no frameworks |
| Data | `campaign-data.json` — "All volumes, CTR targets, and growth assumptions are directional planning estimates for a hypothetical Indian student au" |
| Dev tooling | `package.json` npm scripts (`npm install`, `npm run dev`, `npm start`, `npm test`, `npm run setup`), `requirements.txt` (Flask>=3.0,<4.0) |
| Runtime | Flask dev server — `python app.py` → http://127.0.0.1:5000 (port configurable per README) |
| Verification tooling | Headless Chromium via patchright/Playwright — `resources/audit.mjs` |

## 6. Technologies

- Python 3.14.4 (runtime/backend)
- Flask 3.1.3 (web framework; REST API)
- HTML5, CSS3, Vanilla JavaScript (ES2020+; frontend)
- Jinja2 (Flask templating for `templates/index.html`)
- `fetch` browser API (frontend networking)
- JSON (dataset format — `campaign-data.json`)
- npm (dev scripts wrapper; `package.json`)
- Headless Chromium via patchright/Playwright (audit/QA driver)

## 7. Dataset summary (`campaign-data.json`)

- Channel: SkillSprint India — niche: Beginner-friendly practical digital, coding, and career skills for Indian college students.
- Target persona: Riya, the first-gen college achiever (18-24 primary audience, India (with a focus on tier-2 and tier-3 cities))
- Keywords: 10 — kw-01 — "how to make a resume for freshers" (competition: High, volume: 2400, format: Google Docs screen tutorial) · kw-02 — "resume for college students" (competition: High, volume: 1900, format: Template walkthrough / resume teardown) · kw-03 — "python roadmap for beginners" (competition: High, volume: 3200, format: Beginner roadmap with weekly milestones) · kw-04 — "python projects for beginners" (competition: Medium, volume: 2800, format: Build-along project tutorial) · kw-05 — "excel for beginners full course" (competition: High, volume: 4100, format: Modular beginner series with exercises) · kw-06 — "canva vs google slides for students" (competition: Low, volume: 1500, format: Side-by-side comparison and decision guide) · kw-07 — "linkedin profile for freshers" (competition: Medium, volume: 1700, format: Profile audit / step-by-step setup) · kw-08 — "digital marketing course for beginners" (competition: High, volume: 2600, format: Beginner roadmap + mini-campaign) · kw-09 — "ai tools for students" (competition: High, volume: 3900, format: Responsible-use tool comparison) · kw-10 — "github tutorial for beginners" (competition: Medium, volume: 2200, format: Screen tutorial using a small project)
- Blueprints: 4 — v1: How to Make a Resume for Students · v2: Python Roadmap for Beginners: Start Coding in 2026 · v3: Canva vs Google Slides: Best for College Projects? · v4: 7 Resume Mistakes Indian Students Should Avoid
- Promotion calendar: 7 days
- Video script: 8 sections
- Troubleshooting/playbook rows: 4 — CTR · Average view duration · Impressions · Subscribers per view

## 8. Files

- `app.py` — Flask backend + REST APIs (`/api/health`, `/api/campaign-data`, `POST /api/analyze-seo`, `POST /api/simulate-growth`)
- `campaign-data.json` — the entire campaign dataset
- `templates/index.html` — the responsive 5-tab dashboard
- `static/app.js` — frontend logic for all 5 tabs
- `static/style.css` — responsive styling + thumbnail themes
- `resources/` — audit reports + reusable audit tool

## 9. Version history

- v1.3 — full-site report (21 November 2026 at 14:39:39 GMT+5:30).
- v1.0 — earlier version preserved in resources/
- v1.1 — earlier version preserved in resources/
- v1.2 — earlier version preserved in resources/

---

Generated by `resources/audit.mjs`. Old versions are preserved; run the tool again after any project change to append the next version.
