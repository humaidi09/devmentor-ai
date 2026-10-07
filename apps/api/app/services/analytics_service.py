"""Analytics & Reflection module: dashboard data, streaks, weekly summary,
topic performance. Pure helpers are separated so they can be unit-tested."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from ..core.store import Store
from ..core.timeutils import day_bounds_utc, to_user_tz, user_now, utc_now, week_start


# ---------------- pure helpers ----------------
def compute_streak(completed_dates: set[date], today: date) -> int:
    """Consecutive days ending today (or yesterday) with >=1 completion."""
    streak = 0
    cursor = today
    if today not in completed_dates and (today - timedelta(days=1)) in completed_dates:
        cursor = today - timedelta(days=1)  # today not done yet, keep yesterday's streak alive
    while cursor in completed_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def summarize_tasks(tasks: list[dict]) -> dict:
    total = len(tasks)
    completed = sum(1 for t in tasks if t.get("status") == "completed")
    skipped = sum(1 for t in tasks if t.get("status") == "skipped")
    return {
        "planned": total,
        "completed": completed,
        "skipped": skipped,
        "completion_rate": round(completed / total, 2) if total else 0.0,
    }


# ---------------- store-backed ----------------
def _tasks_in_range(store: Store, user_id: str, start_utc: datetime, end_utc: datetime) -> list[dict]:
    rows = store.select("tasks", filters=[("user_id", "eq", user_id)])
    out = []
    for t in rows:
        s = t.get("scheduled_start")
        if not s:
            continue
        try:
            sdt = datetime.fromisoformat(s)
        except ValueError:
            continue
        if sdt.tzinfo is None:
            sdt = sdt.replace(tzinfo=timezone.utc)
        if start_utc <= sdt < end_utc:
            out.append(t)
    return out


def _completed_dates(store: Store, user_id: str, tz: str | None) -> set[date]:
    rows = store.select("tasks", filters=[("user_id", "eq", user_id), ("status", "eq", "completed")])
    dates: set[date] = set()
    for t in rows:
        ts = t.get("updated_at") or t.get("scheduled_start")
        if not ts:
            continue
        try:
            dates.add(to_user_tz(datetime.fromisoformat(ts), tz).date())
        except ValueError:
            continue
    return dates


def dashboard(store: Store, user_id: str, tz: str | None) -> dict:
    now_local = user_now(tz)
    today = now_local.date()
    today_start, today_end = day_bounds_utc(tz, today)
    week_start_date = week_start(today)
    week_start_utc, _ = day_bounds_utc(tz, week_start_date)

    today_tasks = _tasks_in_range(store, user_id, today_start, today_end)
    today_tasks.sort(key=lambda t: t.get("scheduled_start") or "")

    # Upcoming deadlines (next 14 days, pending)
    deadlines = store.select("deadlines", filters=[("user_id", "eq", user_id), ("status", "eq", "pending")])
    horizon = utc_now() + timedelta(days=14)
    upcoming = []
    for d in deadlines:
        try:
            due = datetime.fromisoformat(d["due_at"])
        except (KeyError, ValueError):
            continue
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        if utc_now() <= due <= horizon:
            upcoming.append(d)
    upcoming.sort(key=lambda d: d["due_at"])

    # Study minutes (completed tasks' actual_minutes, else estimated)
    def minutes_of(t: dict) -> int:
        return int(t.get("actual_minutes") or t.get("estimated_minutes") or 0)

    week_tasks = _tasks_in_range(
        store, user_id, week_start_utc, day_bounds_utc(tz, today)[1]
    )
    study_today = sum(minutes_of(t) for t in today_tasks if t.get("status") == "completed")
    study_week = sum(minutes_of(t) for t in week_tasks if t.get("status") == "completed")

    cp_today = [t for t in today_tasks if t.get("task_type") == "cp"]
    cp_done = sum(1 for t in cp_today if t.get("status") == "completed")

    streak = compute_streak(_completed_dates(store, user_id, tz), today)

    prof = store.select("profiles", filters=[("id", "eq", user_id)], single=True) or {}
    cp_prefs = store.select("cp_preferences", filters=[("user_id", "eq", user_id)], single=True) or {}
    weak = (cp_prefs.get("weak_tags") or [])[:4]

    rec_snippet = store.search_snippets(user_id=user_id, limit=1)

    return {
        "today": today.isoformat(),
        "timezone": tz,
        "tasks": today_tasks,
        "task_summary": summarize_tasks(today_tasks),
        "upcoming_deadlines": upcoming[:5],
        "study_minutes_today": study_today,
        "study_minutes_week": study_week,
        "weekly_goal_minutes": int(prof.get("weekly_study_goal_minutes") or 0),
        "cp_progress": {"planned": len(cp_today), "completed": cp_done},
        "streak_days": streak,
        "weak_areas": weak,
        "recommended_snippet": rec_snippet[0] if rec_snippet else None,
    }


def weekly_metrics(store: Store, user_id: str, tz: str | None, start: date) -> dict:
    start_utc, _ = day_bounds_utc(tz, start)
    _, end_utc = day_bounds_utc(tz, start + timedelta(days=6))
    tasks = _tasks_in_range(store, user_id, start_utc, end_utc)
    summary = summarize_tasks(tasks)

    by_day: dict[str, int] = {}
    for t in tasks:
        if t.get("status") != "completed":
            continue
        try:
            d = to_user_tz(datetime.fromisoformat(t["scheduled_start"]), tz).date().isoformat()
        except (KeyError, ValueError):
            continue
        by_day[d] = by_day.get(d, 0) + int(t.get("actual_minutes") or t.get("estimated_minutes") or 0)

    cp = [t for t in tasks if t.get("task_type") == "cp"]
    return {
        "week_start": start.isoformat(),
        "tasks": summary,
        "study_minutes_by_day": by_day,
        "study_minutes_total": sum(by_day.values()),
        "cp": {"planned": len(cp), "completed": sum(1 for t in cp if t.get("status") == "completed")},
    }


def topic_performance(store: Store, user_id: str) -> list[dict]:
    """Accuracy per topic from quiz_attempts; feeds weak-topic detection."""
    rows = store.select("quiz_attempts", filters=[("user_id", "eq", user_id)])
    agg: dict[str, dict] = {}
    for r in rows:
        topic = r.get("topic") or "general"
        a = agg.setdefault(topic, {"topic": topic, "attempts": 0, "correct": 0})
        a["attempts"] += 1
        if r.get("correct"):
            a["correct"] += 1
    out = []
    for a in agg.values():
        a["accuracy"] = round(a["correct"] / a["attempts"], 2) if a["attempts"] else 0.0
        out.append(a)
    out.sort(key=lambda x: x["accuracy"])
    return out
