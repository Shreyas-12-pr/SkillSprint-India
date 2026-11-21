"""SkillSprint India - YouTube Marketing Engine (Flask backend).

Run locally:
    pip install -r requirements.txt
    python app.py

Then open http://127.0.0.1:5000 in a browser.

All campaign content is read from campaign-data.json beside this file. The
endpoints below are deliberately simple, dependency-free, and classroom-safe:
no API keys, no network calls, and no YouTube account is required.
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, render_template, request, send_file

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "campaign-data.json"
app = Flask(__name__)


# ---------------------------------------------------------------------------
# Data access
# ---------------------------------------------------------------------------
def load_campaign_data() -> dict[str, Any]:
    """Load and validate the JSON file on every request so edits are live."""
    with DATA_PATH.open("r", encoding="utf-8") as source:
        data = json.load(source)
    required = ("channel_profile", "keywords", "video_blueprints", "promotion_calendar")
    missing = [key for key in required if key not in data]
    if missing:
        raise ValueError("Campaign dataset is missing: " + ", ".join(missing))
    return data


# ---------------------------------------------------------------------------
# Small helpers used by the SEO generator
# ---------------------------------------------------------------------------
def _title_case(value: str) -> str:
    return " ".join(word[:1].upper() + word[1:] for word in value.split())


def _slug(value: str) -> str:
    """Turn a title into a safe raw video file name."""
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return (slug[:72].rstrip("-") or "video") + ".mp4"


def _optimized_title(keyword: str, draft_title: str) -> str:
    """Keep a strong draft, or build a keyword-led title under 60 characters."""
    keyword = keyword.strip()
    draft = draft_title.strip()
    if not keyword:
        return draft[:60].rstrip()

    if keyword.casefold() in draft.casefold():
        candidate = draft
    else:
        lower = draft.casefold()
        if any(term in lower for term in ("mistake", "avoid", "fix", "problem")):
            suffix = " | Mistakes to Avoid"
        elif any(term in lower for term in ("step", "tutorial", "walkthrough", "build", "make", "how to")):
            suffix = " | Step-by-Step"
        else:
            suffix = " | Beginner Guide"
        candidate = f"{_title_case(keyword)}{suffix}"

    if len(candidate) <= 60:
        return candidate
    shorter = f"{_title_case(keyword)} | Guide"
    return shorter if len(shorter) <= 60 else _title_case(keyword)[:60].rstrip(" -|:;,")


def _fallback_chapters(niche: str) -> list[str]:
    """Return a tiered chapter list matched to the content niche."""
    sets: dict[str, list[str]] = {
        "Career skills": [
            "00:00 Outcome and finished example",
            "00:30 Set up the task",
            "01:15 Build the first section",
            "02:10 Demonstrate the key skill",
            "03:10 Review and improve the result",
            "04:15 Common mistakes",
            "05:00 Recap and next lesson",
        ],
        "Coding": [
            "00:00 What you will build",
            "00:35 Set up your environment",
            "01:20 Learn the core concept",
            "02:25 Build a small example",
            "03:35 Test and debug",
            "04:35 Save and share your work",
            "05:10 Next steps",
        ],
        "Digital tools": [
            "00:00 The task and finished result",
            "00:35 Choose your starting point",
            "01:25 Build the first draft",
            "02:30 Improve the design or workflow",
            "03:40 Check collaboration and export",
            "04:35 Common mistakes",
            "05:10 Recap and next step",
        ],
        "Study skills": [
            "00:00 The learning outcome",
            "00:35 Prepare your study session",
            "01:20 Break the task into steps",
            "02:25 Practise with an example",
            "03:35 Review what worked",
            "04:25 Choose your next action",
        ],
    }
    return sets.get(niche, sets["Career skills"])


def _description_fillers() -> dict[int, str]:
    return {
        1: "Today.",
        2: "Practise independently.",
        3: "Practise one step.",
        4: "Practise one step today.",
        5: "Practise each step carefully today.",
        6: "Practise each useful step carefully today.",
        7: "Use these steps in your next project.",
        8: "Use the steps in your next college project.",
        9: "Use these practical steps in your next college project.",
        10: "Use these practical steps in your next class project today.",
    }


def _build_description(keyword: str, title: str, niche: str, blueprint: dict[str, Any] | None) -> str:
    """Return a natural, exactly 200-word description with the keyword first."""
    if blueprint:
        saved = str(blueprint.get("description", "")).strip()
        if len(saved.split()) == 200 and keyword.casefold() in " ".join(saved.split()[:25]).casefold():
            return saved

    primary = keyword.strip() or "practical digital skills for students"
    safe_title = title.strip() or "this beginner-friendly lesson"
    opening = (
        f"{primary} is the focus of this practical {niche.lower()} lesson from SkillSprint India. "
        "This video is made for Indian college students and beginners who want a clear result without unnecessary jargon. "
        "We explain the goal, show the process on screen, and break the task into manageable actions. "
        "You will see what to prepare, how to complete the main steps, and how to check your result before using it in a class project, portfolio, internship search, or first job application. "
        "Follow along with your own example and pause whenever you need time to practise. "
        "Use accurate details from your experience and do not copy sample claims that are not true for you. "
        f"This lesson, titled {safe_title}, includes clear chapter markers and a focused learning outcome. "
        "Subscribe to SkillSprint India for practical digital, coding, and career lessons for Indian students. "
        "Comment with one question or the next skill you want us to teach. "
    )
    words = opening.split()
    extras = [
        "Chapters below make the lesson easy to revisit.",
        "Save this video and practise the steps with a small example.",
        "Check your final result before sharing it with classmates.",
        "Use the workflow again on a different real task.",
        "Learning grows when you pause, test, and improve.",
        "Keep your work truthful, simple, and easy to understand.",
        "Choose a next step that fits your own learning goal.",
        "Review the result once more before submitting your work.",
        "Keep notes so you can repeat the process independently.",
        "Share the finished result only when it is ready.",
        "Make one improvement, then test it with a fresh example.",
    ]
    for sentence in extras:
        piece = sentence.split()
        if len(words) + len(piece) <= 200:
            words.extend(piece)
        if len(words) == 200:
            break

    while len(words) < 200:
        remaining = 200 - len(words)
        filler = _description_fillers().get(remaining)
        if filler:
            words.extend(filler.split())
            break
        piece = "Use these steps on your next project.".split()
        if len(words) + len(piece) <= 200:
            words.extend(piece)
        else:
            if filler:
                words.extend(filler.split())
            break

    # Absolute guarantee: exactly 200 words for any keyword/title length.
    padding = ["Review.", "Practise.", "Improve.", "Repeat."]
    index = 0
    while len(words) < 200:
        words.append(padding[index % len(padding)])
        index += 1
    return " ".join(words[:200])


def _build_tags(keyword: str, niche: str, blueprint: dict[str, Any] | None) -> list[str]:
    if blueprint and blueprint.get("tags"):
        return list(blueprint["tags"])[:15]
    tokens = [part for part in re.split(r"[^a-z0-9]+", keyword.lower()) if len(part) > 2]
    candidates = [
        keyword,
        f"{keyword} tutorial",
        f"{niche} for beginners",
        "college students India",
        "SkillSprint India",
        "beginner tutorial",
        *tokens,
        "student skills India",
        "learn practical skills",
        "#StudentSkills",
        "#CareerTips",
        "#SkillSprintIndia",
    ]
    result: list[str] = []
    seen: set[str] = set()
    for tag in candidates:
        clean = tag.strip()
        if clean and clean.casefold() not in seen:
            result.append(clean)
            seen.add(clean.casefold())
    return result[:15]


def _find_blueprint(data: dict[str, Any], body: dict[str, Any], keyword: str) -> dict[str, Any] | None:
    blueprint_id = str(body.get("blueprint_id", body.get("video_id", ""))).strip()
    blueprints = data.get("video_blueprints", [])
    if blueprint_id:
        for blueprint in blueprints:
            if str(blueprint.get("video_id", blueprint.get("id", ""))) == blueprint_id:
                return blueprint
    for blueprint in blueprints:
        target = str(blueprint.get("target_keyword", blueprint.get("primary_keyword", "")))
        if target.casefold() == keyword.casefold():
            return blueprint
    return None


def _seo_checks(keyword: str, draft_title: str, title: str, description: str,
                chapters: list[str], tags: list[str]) -> list[dict[str, Any]]:
    first_25 = " ".join(description.split()[:25]).casefold()
    checks = [
        {"label": "Primary keyword appears in your draft title", "passed": bool(keyword and keyword.casefold() in draft_title.casefold()), "points": 25},
        {"label": "Optimized title is 30-60 characters", "passed": 30 <= len(title) <= 60, "points": 20},
        {"label": "Title communicates a task or learning outcome", "passed": bool(re.search(r"how to|step|build|make|learn|guide|roadmap|avoid|vs|tutorial|resume|python|canva", title, re.I)), "points": 10},
        {"label": "Target keyword is specific (3+ words)", "passed": len(keyword.split()) >= 3, "points": 10},
        {"label": "Keyword appears in the first 25 description words", "passed": bool(keyword and keyword.casefold() in first_25), "points": 15},
        {"label": "At least three timestamped chapters", "passed": len(chapters) >= 3, "points": 10},
        {"label": "At least five relevant tags", "passed": len(tags) >= 5, "points": 10},
    ]
    return checks


# ---------------------------------------------------------------------------
# Pages and API routes
# ---------------------------------------------------------------------------
@app.get("/")
def dashboard():
    """Serve the single-page dashboard."""
    return render_template("index.html")


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "SkillSprint India Marketing API"})


@app.get("/api/campaign-data")
def campaign_data():
    """Return the complete campaign dataset as JSON."""
    try:
        load_campaign_data()  # Validate before serving the raw file.
        return send_file(DATA_PATH, mimetype="application/json", conditional=True)
    except FileNotFoundError:
        return jsonify({"error": "campaign-data.json was not found beside app.py"}), 500
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError) as error:
        return jsonify({"error": f"Campaign dataset is invalid: {error}"}), 500


@app.post("/api/analyze-seo")
def analyze_seo():
    """Score a video brief and return a ready-to-publish SEO package.

    Request JSON (spec fields, with aliases):
        title   (str)  draft video title          alias: video_title
        keyword (str)  primary target keyword     alias: target_keyword, primary_keyword
        niche   (str)  content category           alias: category
        blueprint_id (str, optional)
    """
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Send a JSON object with title, keyword, and niche."}), 400

    keyword = str(body.get("keyword", body.get("target_keyword", body.get("primary_keyword", "")))).strip()[:120]
    title = str(body.get("title", body.get("video_title", ""))).strip()[:180]
    niche = str(body.get("niche", body.get("category", "Career skills"))).strip()[:60] or "Career skills"
    if not keyword:
        return jsonify({"error": "keyword is required."}), 400
    if not title:
        return jsonify({"error": "title is required."}), 400

    try:
        data = load_campaign_data()
    except (OSError, json.JSONDecodeError, ValueError) as error:
        return jsonify({"error": f"Could not load campaign data: {error}"}), 500

    blueprint = _find_blueprint(data, body, keyword)
    optimized_title = _optimized_title(keyword, title)
    chapters = list(blueprint.get("chapters", [])) if blueprint and blueprint.get("chapters") else _fallback_chapters(niche)
    tags = _build_tags(keyword, niche, blueprint)
    description = _build_description(keyword, optimized_title, niche, blueprint)
    checks = _seo_checks(keyword, title, optimized_title, description, chapters, tags)
    score = sum(check["points"] for check in checks if check["passed"])

    return jsonify({
        "keyword": keyword,
        "title": title,
        "niche": niche,
        "draft_title": title,
        "optimized_title": optimized_title,
        "description": description,
        "description_word_count": len(description.split()),
        "chapters": chapters,
        "tags": tags,
        "raw_filename": _slug(optimized_title),
        "score": score,
        "score_percent": f"{score}%",
        "checks": checks,
        "blueprint_id": blueprint.get("video_id", blueprint.get("id")) if blueprint else None,
        "message": "Generated by the local Flask API. The score is a transparent checklist, not a YouTube ranking prediction.",
    })


@app.post("/api/simulate-growth")
def simulate_growth():
    """Project monthly reach from user-supplied assumptions.

    Request JSON (spec fields, with aliases):
        impressions (number)  monthly impressions
        ctr         (number)  click-through rate %      alias: ctr_percent
        sub_rate    (number)  subscriber conversion %   alias: conversion_rate, conversion_rate_percent
        avd         (number)  average view duration in minutes (optional, default 3.2)
    """
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Send a JSON object with impressions, ctr, and sub_rate."}), 400

    def number(name: str, value: Any) -> float:
        if value is None:
            raise ValueError(f"{name} is required.")
        if isinstance(value, bool):
            raise ValueError(f"{name} must be a number.")
        try:
            parsed = float(value)
        except (TypeError, ValueError):
            raise ValueError(f"{name} must be a number.") from None
        if not math.isfinite(parsed):
            raise ValueError(f"{name} must be finite.")
        return parsed

    try:
        impressions = number("impressions", body.get("impressions"))
        ctr = number("ctr", body.get("ctr", body.get("ctr_percent")))
        sub_rate = number("sub_rate", body.get("sub_rate", body.get("conversion_rate", body.get("conversion_rate_percent"))))
        avd = number("avd", body.get("avd", body.get("average_view_duration_minutes", 3.2)))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if impressions < 0:
        return jsonify({"error": "impressions must be zero or greater."}), 400
    if not 0 <= ctr <= 100:
        return jsonify({"error": "ctr must be a percentage from 0 to 100."}), 400
    if not 0 <= sub_rate <= 100:
        return jsonify({"error": "sub_rate must be a percentage from 0 to 100."}), 400
    if avd < 0:
        return jsonify({"error": "avd must be zero or greater."}), 400

    views = round(impressions * ctr / 100)
    watch_hours = round(views * avd / 60, 1)
    subscribers = round(views * sub_rate / 100)
    return jsonify({
        "inputs": {
            "impressions": round(impressions),
            "ctr": ctr,
            "sub_rate": sub_rate,
            "average_view_duration_minutes": avd,
        },
        "projected_views": views,
        "projected_monthly_views": views,
        "watch_hours": watch_hours,
        "new_subscribers": subscribers,
        "note": "Scenario estimates only; real YouTube results vary by audience and traffic source.",
    })


@app.errorhandler(404)
def not_found(_error):
    if request.path.startswith("/api/"):
        return jsonify({"error": "API endpoint not found."}), 404
    return "Page not found", 404


if __name__ == "__main__":
    print("\n  SkillSprint India - YouTube Marketing Engine")
    print("  Dashboard : http://127.0.0.1:5000")
    print("  APIs      : /api/campaign-data, /api/analyze-seo, /api/simulate-growth\n")
    app.run(host="127.0.0.1", port=5000, debug=False)
