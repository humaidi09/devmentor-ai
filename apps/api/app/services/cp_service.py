"""Competitive Programming Coach module.

Wraps the Codeforces client to:
- read a public profile summary
- generate morning/evening problem recommendations within the user's
  rating band, excluding solved + already-recommended problems
- track status updates

When Codeforces is unreachable or the user has no handle, and the app is
in demo mode, a small set of *real, well-known public problems* is used so
the feature is demonstrable. Nothing fabricates submission results.
"""
from __future__ import annotations

from datetime import date

from ..core.config import get_settings
from ..core.logging import get_logger
from ..core.store import Store
from .codeforces_client import (
    CodeforcesError,
    contest_reminder_payloads,
    filter_problems,
    get_codeforces_client,
    solved_problem_keys,
)

logger = get_logger(__name__)

# Real, classic beginner-friendly public problems for demo mode only.
DEMO_PROBLEMS = [
    {"contestId": 4, "index": "A", "name": "Watermelon", "rating": 800, "tags": ["brute force", "math"]},
    {"contestId": 71, "index": "A", "name": "Way Too Long Words", "rating": 800, "tags": ["strings"]},
    {"contestId": 158, "index": "A", "name": "Next Round", "rating": 800, "tags": ["implementation"]},
    {"contestId": 231, "index": "A", "name": "Team", "rating": 800, "tags": ["brute force", "greedy"]},
    {"contestId": 282, "index": "A", "name": "Bit++", "rating": 800, "tags": ["implementation"]},
    {"contestId": 50, "index": "A", "name": "Domino piling", "rating": 800, "tags": ["greedy", "math"]},
    {"contestId": 118, "index": "A", "name": "String Task", "rating": 1000, "tags": ["implementation", "strings"]},
    {"contestId": 266, "index": "A", "name": "Stones on the Table", "rating": 800, "tags": ["implementation"]},
    {"contestId": 339, "index": "A", "name": "Helpful Maths", "rating": 800, "tags": ["greedy", "sortings"]},
    {"contestId": 160, "index": "A", "name": "Twins", "rating": 900, "tags": ["greedy", "sortings"]},
]


def _url(contest_id: int, index: str) -> str:
    return f"https://codeforces.com/contest/{contest_id}/problem/{index}"


def get_profile(store: Store, user_id: str, handle: str | None) -> dict:
    settings = get_settings()
    if not handle:
        return {"handle": None, "rating": None, "max_rating": None, "rank": None,
                "solved_count": None, "synced_at": None}
    if settings.effective_demo_mode:
        # Don't fabricate a real person's live stats offline.
        return {"handle": handle, "rating": None, "max_rating": None, "rank": None,
                "solved_count": None, "synced_at": None}
    try:
        info = get_codeforces_client().user_info(handle)
        return {
            "handle": handle,
            "rating": info.get("rating"),
            "max_rating": info.get("maxRating"),
            "rank": info.get("rank"),
            "solved_count": None,
            "synced_at": None,
        }
    except CodeforcesError as exc:
        logger.info("CF profile fetch failed: %s", exc)
        return {"handle": handle, "rating": None, "max_rating": None, "rank": None,
                "solved_count": None, "synced_at": None, "error": "Codeforces unavailable"}


def generate_recommendations(store: Store, user_id: str, handle: str | None, prefs: dict) -> list[dict]:
    settings = get_settings()
    today = date.today().isoformat()
    per = int(prefs.get("problems_per_session", 2))
    sessions = ["morning", "evening"]
    needed = per * len(sessions)

    # Idempotent: clear today's still-suggested recs before regenerating.
    for r in store.select("cp_recommendations", filters=[("user_id", "eq", user_id)]):
        if r.get("recommendation_date") == today and r.get("status") == "suggested":
            store.delete("cp_recommendations", [("id", "eq", r["id"]), ("user_id", "eq", user_id)])

    already = {
        f"{r.get('problem_contest_id')}-{r.get('problem_index')}"
        for r in store.select("cp_recommendations", filters=[("user_id", "eq", user_id)])
    }

    chosen: list[dict]
    source = "demo"
    if handle and not settings.effective_demo_mode:
        try:
            solved = solved_problem_keys(get_codeforces_client().user_status(handle))
            problems = get_codeforces_client().problemset()
            chosen = filter_problems(
                problems,
                min_rating=int(prefs.get("min_rating", 800)),
                max_rating=int(prefs.get("max_rating", 1200)),
                solved_keys=solved,
                preferred_tags=(prefs.get("preferred_tags") or []) + (prefs.get("weak_tags") or []),
                exclude_keys=already,
                limit=needed,
            )
            source = "codeforces"
        except CodeforcesError as exc:
            logger.info("CF recommend failed, falling back: %s", exc)
            chosen = _demo_pick(prefs, already, needed)
    else:
        chosen = _demo_pick(prefs, already, needed)

    created: list[dict] = []
    for i, p in enumerate(chosen):
        session = sessions[0] if i < per else sessions[1]
        reason = (
            "Matches your rating band and preferred/weak topics."
            if source == "codeforces"
            else "Demo problem within your rating band (connect a handle + real keys for live picks)."
        )
        created.append(store.insert("cp_recommendations", {
            "user_id": user_id,
            "recommendation_date": today,
            "session": session,
            "problem_contest_id": p.get("contestId"),
            "problem_index": p.get("index"),
            "problem_name": p.get("name"),
            "problem_rating": p.get("rating"),
            "tags": p.get("tags", []),
            "problem_url": _url(p["contestId"], p["index"]),
            "status": "suggested",
            "source_reason": reason,
        }))
    return created


def _demo_pick(prefs: dict, exclude: set[str], needed: int) -> list[dict]:
    lo, hi = int(prefs.get("min_rating", 800)), int(prefs.get("max_rating", 1200))
    pool = [
        p for p in DEMO_PROBLEMS
        if lo <= p["rating"] <= hi and f"{p['contestId']}-{p['index']}" not in exclude
    ]
    return pool[:needed]


def upcoming_contests() -> list[dict]:
    settings = get_settings()
    if settings.effective_demo_mode:
        return []
    try:
        contests = get_codeforces_client().upcoming_contests()
        return [
            {"id": c.get("id"), "name": c.get("name"),
             "start_time_seconds": c.get("startTimeSeconds"),
             "duration_seconds": c.get("durationSeconds")}
            for c in contests[:10]
        ]
    except CodeforcesError:
        return []


def contest_reminders(now_epoch: int, *, window_seconds: int = 3600) -> list[dict]:
    """Reminder payloads for contests starting within the window.

    Returns [] in demo mode or on API error — never fabricates a contest.
    """
    settings = get_settings()
    if settings.effective_demo_mode:
        return []
    try:
        raw = get_codeforces_client().upcoming_contests()
    except CodeforcesError as exc:
        logger.info("Contest reminder fetch failed: %s", exc)
        return []
    return contest_reminder_payloads(raw, now_epoch, window_seconds=window_seconds)
