<p align="center">
  <a href="https://github.com/Shreyas-12-pr/SkillSprint-India">
    <img src="https://img.shields.io/badge/SkillSprint-India-0B1F3A?style=for-the-badge&logo=youtube&logoColor=white&labelColor=0B1F3A&color=2F66F6" alt="SkillSprint India"/>
  </a>
  <br/>
  <a href="https://github.com/Shreyas-12-pr/SkillSprint-India/commits/main">
    <img src="https://img.shields.io/github/last-commit/Shreyas-12-pr/SkillSprint-India?style=flat-square&color=20A68A" alt="Last commit"/>
  </a>
  <a href="https://github.com/Shreyas-12-pr/SkillSprint-India/issues">
    <img src="https://img.shields.io/github/issues/Shreyas-12-pr/SkillSprint-India?style=flat-square&color=FFB800" alt="Issues"/>
  </a>
  <a href="https://github.com/Shreyas-12-pr/SkillSprint-India/forks">
    <img src="https://img.shields.io/github/forks/Shreyas-12-pr/SkillSprint-India?style=flat-square&color=FFB800" alt="Forks"/>
  </a>
  <a href="https://github.com/Shreyas-12-pr/SkillSprint-India/stargazers">
    <img src="https://img.shields.io/github/stars/Shreyas-12-pr/SkillSprint-India?style=flat-square&color=FFB800" alt="Stars"/>
  </a>
  <a href="https://github.com/Shreyas-12-pr/SkillSprint-India/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Shreyas-12-pr/SkillSprint-India?style=flat-square&color=0B1F3A" alt="License"/>
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Python-3.10+-0B1F3A?style=flat-square&logo=python&logoColor=white" alt="Python"/>
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Flask-3.x-0B1F3A?style=flat-square&logo=flask&logoColor=white" alt="Flask"/>
  </a>
</p>

<h1 align="center">SkillSprint India — YouTube Marketing Engine</h1>

<p align="center">
  <b>A complete, runnable, single-day college project:</b> a <b>Flask REST API</b> plus a <b>5-tab interactive dashboard</b> for a YouTube marketing case study on <b>SkillSprint India</b>, an educational channel for Indian college students.<br/>
  <b>Topic:</b> YouTube Marketing Strategy to Improve Video Visibility, Increase Subscribers, and Promote Educational Content Using Video SEO and Engaging Thumbnails.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stack-Flask%20%7C%20HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-0B1F3A?style=for-the-badge" alt="Stack"/>
  <img src="https://img.shields.io/badge/Mode-Local%20only%20%7C%20No%20API%20keys%20%7C%20No%20database-20A68A?style=for-the-badge" alt="Mode"/>
  <img src="https://img.shields.io/badge/Build-College%20Project%20%7C%20Single-day%20deployment-FFB800?style=for-the-badge" alt="Build"/>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [System Requirements](#system-requirements)
- [Quick Start](#quick-start)
  - [Option A: Python venv (recommended)](#option-a-python-venv-recommended)
  - [Option B: npm wrapper scripts](#option-b-npm-wrapper-scripts)
- [Using the Dashboard](#using-the-dashboard)
- [API Reference](#api-reference)
- [Campaign Data Schema](#campaign-data-schema)
- [Two-Minute Classroom Demo Script](#two-minute-classroom-demo-script)
- [Growth Simulator Math](#growth-simulator-math)
- [Extending & Customizing](#extending--customizing)
- [Troubleshooting](#troubleshooting)
- [Project Status & Roadmap](#project-status--roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Disclaimer](#disclaimer)
- [Acknowledgements](#acknowledgements)

---

## Overview

**SkillSprint India — YouTube Marketing Engine** is an offline-first, single-file Flask backend paired with a responsive five-tab frontend. It helps students and educators plan, optimize, simulate, and launch YouTube educational content without needing a YouTube account, API keys, a database, or an internet connection after installation.

Everything is driven by `campaign-data.json`, a complete campaign dataset containing:

- Channel profile, persona, and brand color palette
- 10 high-intent student search keywords with volume, competition, and format
- 4 ready-to-publish video SEO blueprints (title, thumbnail, chapters, tags, 200-word description)
- 7-day multi-channel promotion calendar (YouTube Long-Form, Community Tab, Shorts, LinkedIn, WhatsApp)
- Word-for-word 5-minute flagship video script
- Analytics troubleshooting / decision table
- Competitor benchmarking matrix

---

## Problem Statement

Indian college students need practical, job-relevant digital and career skills, but good lessons are scattered across disconnected tutorials. SkillSprint India addresses three friction points in one local tool:

| Friction | How the engine fixes it |
|---|---|
| **Discoverability** | Keyword-led SEO analyzer scores titles, descriptions, chapters, and tags on a transparent 100-point checklist. |
| **Click appeal** | 16:9 thumbnail lab with three-word-hook rule, mobile-readability checklist, and live YouTube Home-feed preview. |
| **Growth planning** | Scenario-based growth simulator projects views, watch hours, and subscribers from your own CTR / AVD assumptions. |

---

## Key Features

- **Tab 1 — Live Video SEO & Metadata Generator:** Enter a keyword, title, and niche; the Flask API returns an optimized title, exactly-200-word keyword-led description, timestamped chapters, raw file name, up to 15 tags, and a 7-check SEO score out of 100. One-click copy metadata or export a `.txt` strategy report.
- **Tab 2 — High-CTR Thumbnail & Feed Preview Lab:** Build a three-word hook thumbnail preview locked to 16:9, choose from Sprint Navy / Skill Mint / Campus Sunrise themes, verify title–thumbnail synergy at feed size, and run a mobile-readability checklist.
- **Tab 3 — Keyword Research & Video Blueprints:** Search 10 education keywords by intent, volume, competition, and format; open any of 4 ready-to-publish blueprint cards with one click directly into Tab 1.
- **Tab 4 — 7-Day Campaign Plan & Video Script:** Execution calendar across YouTube Long-Form, Community Tab, Shorts, LinkedIn, and WhatsApp student communities, plus a word-for-word 5-minute flagship script with a 30-second retention hook and value-first subscriber CTA.
- **Tab 5 — YouTube Analytics & Growth Simulator:** Drag sliders for impressions, CTR, average view duration, and subscriber rate; the Flask API returns projected monthly views, watch hours, new subscribers, and a live diagnosis table with exact next tests.
- **Zero secrets:** No API keys, no OAuth, no database, no network calls to YouTube. Runs 100% locally.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | **Flask 3.x** (Python) | REST API + HTML templating |
| Frontend | **HTML5 + CSS3 + Vanilla JS** | Responsive 5-tab single-page dashboard |
| Data | **campaign-data.json** | Full campaign dataset (JSON, no DB) |
| Styling | Custom CSS (CSS variables, dark-mode, print, reduced-motion) | Brand-aligned, accessible UI |
| Scripting | Vanilla JavaScript (`fetch`) | Connects all tabs to Flask endpoints |

---

## Repository Structure

```
SkillSprint-India/
├── app.py                      # Flask backend + REST APIs (SEO, campaign-data, growth)
├── campaign-data.json          # Entire campaign dataset (keywords, blueprints, calendar, script)
├── requirements.txt            # Python dependency: Flask
├── package.json                # Optional npm wrapper scripts (no Node packages downloaded)
├── README.md                   # This file
├── LICENSE                     # Project license
├── .gitignore                  # Git ignore rules
├── static/
│   ├── app.js                  # Frontend logic for all 5 tabs (fetch → Flask APIs)
│   └── style.css               # Responsive styling + 3 thumbnail themes
└── templates/
    └── index.html              # The 5-tab dashboard (Flask Jinja2 template)
```

---

## System Requirements

- **Python 3.10+** (with `pip`)
- **Flask 3.x** (installed via `requirements.txt`)
- A modern browser: Chrome, Edge, Firefox, or Safari
- ~50 MB disk space; no internet needed after `pip install`

---

## Quick Start

### Option A: Python venv (recommended)

Open a terminal **inside** the `SkillSprint-India/` folder (the one containing `app.py`):

```bash
# Windows (PowerShell / CMD)
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

If `python` is not recognized on Windows, use `py` instead:

```bat
py -m venv .venv
.venv\Scripts\activate
py -m pip install -r requirements.txt
py app.py
```

Expected terminal output:

```
  SkillSprint India - YouTube Marketing Engine
  Dashboard : http://127.0.0.1:5000
  APIs      : /api/campaign-data, /api/analyze-seo, /api/simulate-growth
```

Open **http://127.0.0.1:5000** in your browser. Press `Ctrl+C` in the terminal to stop the server.

> Port 5000 busy? Change the last line of `app.py` to `app.run(host="127.0.0.1", port=5001, debug=False)` and open `http://127.0.0.1:5001`.

### Option B: npm wrapper scripts

`package.json` wraps the Python commands, so no Node packages are downloaded:

```bash
npm install      # installs Python requirements via postinstall
npm run dev      # starts the Flask server (same as python app.py)
npm start        # alias for npm run dev
npm test         # checks app.py syntax (py_compile)
npm run setup    # installs only the Python requirements
```

Then open **http://127.0.0.1:5000**.

---

## Using the Dashboard

1. **Start the server** (`python app.py`) and open `http://127.0.0.1:5000`.
2. **Tab 1 — SEO Analyzer:** Choose a blueprint or type your own keyword/title/niche. Click **Analyze & generate**. Review the 100-point score ring, copy-ready metadata, and export the strategy report.
3. **Tab 2 — Thumbnail Lab:** Type up to 3 hook words, set the sub-badge and title, pick a theme, and confirm the mobile-readability checklist. Preview how the title + thumbnail appear together in a YouTube Home-feed card.
4. **Tab 3 — Research:** Search the keyword bank and view the competitor benchmarking matrix. Click any blueprint card to load it into Tab 1.
5. **Tab 4 — Campaign Plan:** Browse the 7-day promotion calendar by platform and read the word-for-word 5-minute script. Click **Copy script** to paste it into your recorder.
6. **Tab 5 — Growth Simulator:** Adjust impressions, CTR, average view duration, and subscriber rate. Watch projected views, watch hours, and new subscribers update live, plus a diagnosis of where to optimize next.

All figures are clearly labelled **planning estimates**, not measured YouTube analytics. Validate real numbers in YouTube Studio before reporting performance.

---

## API Reference

Base URL: `http://127.0.0.1:5000` (local only)

### `GET /` — Dashboard
Serves the 5-tab single-page interface (`templates/index.html`).

### `GET /api/health`
Health check.

**Response:**
```json
{ "status": "ok", "service": "SkillSprint India Marketing API" }
```

### `GET /api/campaign-data`
Returns the full `campaign-data.json` dataset as JSON. Used by Tabs 3 and 4.

### `POST /api/analyze-seo`
Scores a video brief and returns a copy-ready upload package.

**Request body:**
```json
{
  "title": "How to Make a Resume for Students",
  "keyword": "how to make a resume for students",
  "niche": "Career skills",
  "blueprint_id": "v1"
}
```
Aliases accepted: `title`/`video_title`, `keyword`/`target_keyword`/`primary_keyword`, `niche`/`category`.

**Response:**
```json
{
  "keyword": "how to make a resume for students",
  "title": "How to Make a Resume for Students",
  "niche": "Career skills",
  "draft_title": "How to Make a Resume for Students",
  "optimized_title": "How to Make a Resume for Students | Step-by-Step",
  "description": "...exactly 200 words, keyword in first 25...",
  "description_word_count": 200,
  "chapters": ["00:00 ...", "00:30 ..."],
  "tags": ["resume for students", "...", "#SkillSprintIndia"],
  "raw_filename": "how-to-make-a-resume-for-students-step-by-step.mp4",
  "score": 85,
  "score_percent": "85%",
  "checks": [
    { "label": "...", "passed": true, "points": 25 },
    ...
  ],
  "blueprint_id": "v1",
  "message": "Generated by the local Flask API. The score is a transparent checklist, not a YouTube ranking prediction."
}
```

The score is the sum of passed checks (max 100):
- Keyword in draft title — 25 pts
- Optimized title 30–60 chars — 20 pts
- Title communicates a task/outcome — 10 pts
- Keyword is 3+ words — 10 pts
- Keyword in first 25 description words — 15 pts
- At least 3 timestamped chapters — 10 pts
- At least 5 relevant tags — 10 pts

### `POST /api/simulate-growth`
Projects monthly reach from your assumptions.

**Request body:**
```json
{
  "impressions": 60000,
  "ctr": 5.5,
  "sub_rate": 0.8,
  "avd": 3.2
}
```
Aliases: `ctr`/`ctr_percent`; `sub_rate`/`conversion_rate`/`conversion_rate_percent`; `avd`/`average_view_duration_minutes` (default 3.2).

**Response:**
```json
{
  "inputs": { "impressions": 60000, "ctr": 5.5, "sub_rate": 0.8, "average_view_duration_minutes": 3.2 },
  "projected_views": 3300,
  "projected_monthly_views": 3300,
  "watch_hours": 176.0,
  "new_subscribers": 26,
  "note": "Scenario estimates only; real YouTube results vary by audience and traffic source."
}
```

### Example cURL calls

```bash
# Health
curl http://127.0.0.1:5000/api/health

# Campaign data
curl http://127.0.0.1:5000/api/campaign-data

# Analyze SEO
curl -X POST http://127.0.0.1:5000/api/analyze-seo \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"How to Make a Resume for Students\",\"keyword\":\"how to make a resume for students\",\"niche\":\"Career skills\"}"

# Simulate growth
curl -X POST http://127.0.0.1:5000/api/simulate-growth \
  -H "Content-Type: application/json" \
  -d "{\"impressions\":60000,\"ctr\":5.5,\"sub_rate\":0.8,\"avd\":3.2}"
```

---

## Campaign Data Schema

`campaign-data.json` contains these top-level keys:

| Key | Contents |
|---|---|
| `dataset_note` | Disclaimer that all volumes/CTR/growth figures are directional planning estimates |
| `channel_profile` | Name, niche, target audience persona, value proposition, brand color palette |
| `keywords` | 10 items: id, keyword, search intent, monthly volume, competition, format, subscriber hook |
| `competitors` | 4 channels: Apna College, CodeWithHarry, WsCube Tech, Physics Wallah — title formula, thumbnail read, SEO strength, gap |
| `video_blueprints` | 4 items (v1–v4): format, category, target keyword, title, variants, thumbnail text/badge, description, chapters, tags |
| `promotion_calendar` | 7-day plan: day, platform, content, action, target KPI |
| `video_script` | 6 sections (0:00–5:00): time, label, script text, visual direction |
| `troubleshooting` | Metric → target → diagnosis → fix decision table |

Brand palette (used in CSS and thumbnails):

| Color | Hex | Use |
|---|---|---|
| Navy | `#0B1F3A` | Primary brand / headers |
| Electric Blue | `#2F66F6` | Links, accents, active states |
| Campus Yellow | `#FFB800` | Badges, highlights, warnings |
| Skill Mint | `#20A68A` | Success, online status, CTAs |
| Off-white | `#F5F7FA` | Backgrounds, soft surfaces |
| White | `#FFFFFF` | Cards, surfaces |

---

## Two-Minute Classroom Demo Script

**Before you start:** terminal running `python app.py`, Chrome at `http://127.0.0.1:5000`.

**0:00–0:15 — Introduce the problem.**  
*"Sir/Ma'am, SkillSprint India teaches coding and career skills to Indian college students, but good lessons were not being found. Today I'll demo a tool that fixes three things: video SEO, thumbnail click-through, and subscriber growth — all running on a local Flask API."*

**0:15–0:45 — Tab 1, SEO Generator.**  
Click **Analyze & generate**. Point at the score ring. *"I enter the keyword, title, and niche. The Flask endpoint returns a real-time visibility score out of 100 based on seven transparent checks — keyword in title, title length, keyword in the first 25 description words, chapters, and tags."* Scroll to the generated description. *"Notice the 200-word description starts with the primary keyword, with chapters, tags, and a clean raw file name — ready to paste into YouTube."* Click **Copy metadata** and **Export strategy report (.txt)**. Show the downloaded file.

**0:45–1:05 — Tab 2, Thumbnail Lab.**  
Type three words, for example `BUILD A RESUME`. *"The three-word rule keeps it readable on mobile; the live canvas is locked to 16:9 and previews the YouTube Home feed card. Title and thumbnail must add different information."* Click the Mint and Sunrise themes.

**1:05–1:25 — Tab 3, Research & Blueprints.**  
Search `resume` in the keyword table. *"Ten high-intent keywords with volume, competition, format, and a subscriber hook."* Click a blueprint card. *"One click loads a complete SEO package into Tab 1 — that's the Video Blueprint Database."*

**1:25–1:45 — Tab 4, Campaign Plan & Script.**  
*"A 7-day multi-channel calendar: long-form, Community Tab, Shorts, LinkedIn, and WhatsApp student groups — plus the word-for-word 5-minute script with a 30-second retention hook and a value-first subscriber CTA."* Click **Copy script**.

**1:45–2:00 — Tab 5, Growth Simulator.**  
Drag the CTR slider from 5.5% to 9%. *"Every slider calls the Flask simulation endpoint live: projected views, watch hours, and new subscribers update instantly, with a diagnosis table telling me what to fix next. This closes the loop from strategy to measurement."*

**Close:** *"So the project covers discoverability, click appeal, promotion, and retention — with every number clearly labelled as a planning estimate."*

---

## Growth Simulator Math

The simulator uses plain arithmetic, clearly labelled as scenario estimates:

- **Projected views** = impressions × (CTR ÷ 100)
- **Watch hours** = views × average view duration (minutes) ÷ 60
- **New subscribers** = views × (subscriber rate ÷ 100)

Diagnosis rules (live as you drag):
- CTR < 4% → test a simpler three-word hook and a more specific outcome title
- AVD < 2 min → show the finished result in the first 10 seconds and shorten the intro
- Sub rate < 0.5% → state the channel promise after delivering value and recommend a related lesson

---

## Extending & Customizing

- **Add a keyword:** append an object to the `keywords` array in `campaign-data.json` (id, keyword, search_intent, monthly_volume, competition, recommended_format, subscriber_hook), then refresh.
- **Add a blueprint:** append to `video_blueprints` with `video_id`, `category`, `target_keyword`, `title`, `thumbnail_text`, `thumbnail_badge`, `description`, `chapters`, `tags`.
- **Add a promotion day:** append to `promotion_calendar` with `day`, `platform`, `content`, `action`, `target_kpi`.
- **Change brand colors:** edit the `:root` variables in `static/style.css` (navy, blue, mint, saffron).
- **Add an API endpoint:** add a new route in `app.py` following the existing `jsonify` pattern; all data reads from `campaign-data.json` beside the file.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `python` not recognized (Windows) | Use `py` instead of `python`, or install Python from python.org and check "Add to PATH" |
| Port 5000 already in use | Change `app.run(...)` port to `5001` in `app.py` and open `http://127.0.0.1:5001` |
| Dashboard shows "API offline" | Make sure `python app.py` is running, then refresh the page |
| `pip install` fails | Upgrade pip: `python -m pip install --upgrade pip`, then retry `pip install -r requirements.txt` |
| SEO score is 0 | Enter both keyword and title; ensure keyword is 3+ words and title is 30–60 chars |
| Copy button does nothing | On non-HTTPS pages the fallback textarea copy is used; select and copy manually if blocked |

---

## Project Status & Roadmap

- **Current:** v1.0 — Flask backend + 5-tab dashboard + full campaign dataset, runs fully offline
- **Planned:** YouTube Studio OAuth integration (optional), CSV export of keyword bank, A/B thumbnail variant comparison, scheduled-publish calendar export, dark theme toggle persisted to localStorage

Contributions, issues, and feature requests are welcome. See [Contributing](#contributing).

---

## Contributing

1. Fork the repository: `https://github.com/Shreyas-12-pr/SkillSprint-India/fork`
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add: ..."`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request against `main`

Please keep commit messages conventional (`feat:`, `fix:`, `docs:`, `chore:`) and update `README.md` when you change behavior.

---

## License

This project is licensed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

## Disclaimer

All search volumes, CTR targets, growth assumptions, competitor observations, and projected figures in this project are **directional planning estimates for a hypothetical Indian student audience**. They are **not live-verified YouTube numbers** and are not affiliated with, endorsed by, or connected to YouTube/Google. Validate all figures with YouTube Studio / Research before presenting any figure as measured data. The SEO score is a transparent internal checklist, not a YouTube ranking prediction.

---

## Acknowledgements

- **Channel case study:** SkillSprint India — practical digital, coding, and career skills for Indian college students
- **Built with:** Flask, HTML5, CSS3, Vanilla JavaScript
- **Inspiration:** Indian education creators including Apna College, CodeWithHarry, WsCube Tech, and Physics Wallah (public-facing benchmarking only; no private analytics used)

---

<p align="center">
  <b>Made with ❤️ for Indian college students and educators.</b><br/>
  <a href="https://github.com/Shreyas-12-pr/SkillSprint-India">View on GitHub</a> ·
  <a href="https://github.com/Shreyas-12-pr/SkillSprint-India/issues">Report a bug</a> ·
  <a href="https://github.com/Shreyas-12-pr/SkillSprint-India/pulls">Submit a PR</a>
</p>