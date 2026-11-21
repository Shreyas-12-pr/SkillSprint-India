# resources/ — Audit reports & full-site reports

## Files

- `site-audit-v<major>.<minor>.md` — Full-site audit report (methodology, HTTP-layer
  checks, API behavior, browser walkthrough of the 5 tabs, findings, recommendations).
  The latest version is the most recent file (highest version number).
- `fullsite-v<major>.<minor>.md` — Full-site report (about the project, purpose,
  main features, how it helps, tech stack and technologies).
- `audit.mjs` — Reusable audit tool (see "Re-running" below).
- `README.md` — This file.

## Versioning

- Reports are named `v<major>.<minor>` (e.g., `site-audit-v1.3.md`).
- `audit.mjs` computes the next version from the report files already in this
  folder and **appends new files**. Old versions are never deleted or
  overwritten — every run adds a new version with the latest check results.
- The current version is the highest one present (e.g., if `site-audit-v1.3.md`
  is the newest file, v1.3 is the latest).

## Re-running / updating after project changes

When the site, backend, or data is updated:

```bat
node resources/audit.mjs
```

Run from the project root (`SkillSprint-YouTube-Marketing-Engine/`). It will:

1. Ensure the Flask server is running (starts `python app.py` on
   `http://127.0.0.1:5000` if it is not already up).
2. Re-run the full audit — HTTP layer checks, API behavior checks (including
   documented error cases), and a browser walkthrough of all 5 tabs
   (console/network report + DOM state + interactions).
3. Append the next versioned audit and fullsite reports to `resources/`.

If the browser-automation skill is not in its default location, set the
`BROWSER_MJS` environment variable to point at its `browser.mjs`.

## What the reports contain

- `site-audit-*` — methodology, every check performed and its observed result,
  findings (pass/needs attention/minor observations) and recommendations.
- `fullsite-*` — about/purpose/main features/how it helps/tech stack/technologies
  of the SkillSprint India YouTube Marketing Engine, generated from the live
  dataset (`campaign-data.json`) and the audit run.
