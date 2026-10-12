"""Learning Planner module.

Pure, testable scheduling logic:
- prioritize_tasks / deadline_urgency: ordering by deadline + priority
- recovery_options: compassionate choices when a task is missed
- build_daily_plan: realistic day plan from availability + deadlines + CP
  settings, never exceeding the user's available minutes.

The route layer persists whatever these functions return.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from ..core.timeutils import combine_local_to_utc, parse_hhmm

WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

# Compassionate recovery choices offered when a task is missed (never shaming).
RECOVERY_OPTIONS = [
    {"action": "move_tomorrow", "label": "Move to tomorrow"},
    {"action": "move_weekend", "label": "Move to the weekend"},
    {"action": "reduce_scope", "label": "Reduce scope (shorter version)"},
    {"action": "skip", "label": "Skip this one"},
]


def recovery_options() -> list[dict]:
    return [dict(o) for o in RECOVERY_OPTIONS]


def deadline_urgency(due_at: datetime, now: datetime) -> float:
    """Higher = more urgent. Overdue items score highest."""
    if due_at.tzinfo is None:
        due_at = due_at.replace(tzinfo=timezone.utc)
    hours_left = (due_at - now).total_seconds() / 3600.0
    if hours_left <= 0:
        return 1000.0
    return 1000.0 / (hours_left + 1.0)


def prioritize_tasks(tasks: list[dict], now: datetime | None = None) -> list[dict]:
    """Order tasks: by explicit priority (desc), then earliest scheduled_start."""
    now = now or datetime.now(timezone.utc)

    def key(t: dict):
        start = t.get("scheduled_start")
        try:
            start_dt = datetime.fromisoformat(start) if start else now + timedelta(days=365)
        except (TypeError, ValueError):
            start_dt = now + timedelta(days=365)
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
        return (-int(t.get("priority", 3)), start_dt)

    return sorted(tasks, key=key)


def revision_tasks_for_weak_topics(
    weak_topics: list[str], *, max_items: int = 2, minutes: int = 30
) -> list[dict]:
    """Extra practice tasks for topics the learner is weak in.

    Returned unscheduled (no fixed time) so they never overload the day —
    the user slots them in where they like.
    """
    out: list[dict] = []
    for topic in weak_topics[:max_items]:
        out.append({
            "title": f"Revise: {topic}",
            "description": "Extra practice for a topic you found tricky.",
            "task_type": "revision",
            "topic": topic,
            "estimated_minutes": minutes,
            "priority": 3,
            "metadata": {"generated": True, "reason": "weak_topic"},
        })
    return out


def _slot_minutes(slot: dict) -> int:
    s, e = parse_hhmm(slot.get("start")), parse_hhmm(slot.get("end"))
    if not s or not e:
        return 0
    mins = (e.hour * 60 + e.minute) - (s.hour * 60 + s.minute)
    return max(0, mins)


def build_daily_plan(*, profile: dict, deadlines: list[dict], cp_prefs: dict | None,
                     on_date: date, now: datetime | None = None,
                     existing_tasks: list[dict] | None = None) -> list[dict]:
    """Place non-overlapping CP/study blocks inside the user's available slots."""
    now = now or datetime.now(timezone.utc)
    tz = profile.get("timezone", "UTC")
    slots = (profile.get("available_schedule") or {}).get(WEEKDAY_KEYS[on_date.weekday()], [])
    free = sorted((combine_local_to_utc(on_date, s["start"], tz),
                   combine_local_to_utc(on_date, s["end"], tz)) for s in slots)
    plans: list[dict] = []

    def reserve(start, end):
        nonlocal free
        remaining = []
        for lo, hi in free:
            if end <= lo or start >= hi:
                remaining.append((lo, hi))
            else:
                if lo < start: remaining.append((lo, start))
                if end < hi: remaining.append((end, hi))
        free = remaining

    for task in existing_tasks or []:
        if task.get("scheduled_start") and task.get("status") != "skipped":
            start = datetime.fromisoformat(task["scheduled_start"])
            end = datetime.fromisoformat(task["scheduled_end"]) if task.get("scheduled_end") else start + timedelta(minutes=task.get("estimated_minutes") or 30)
            if start.tzinfo is None: start = start.replace(tzinfo=timezone.utc)
            if end.tzinfo is None: end = end.replace(tzinfo=timezone.utc)
            reserve(start, end)

    if cp_prefs and cp_prefs.get("notifications_enabled", True):
        per = int(cp_prefs.get("problems_per_session", 2))
        duration = timedelta(minutes=per * 20)
        for session, hhmm in (("morning", cp_prefs.get("morning_time", "10:00")),
                              ("evening", cp_prefs.get("evening_time", "20:00"))):
            preferred = combine_local_to_utc(on_date, hhmm, tz)
            candidates = [max(lo, preferred) for lo, hi in free if max(lo, preferred) + duration <= hi]
            if not candidates:
                candidates = [lo for lo, hi in free if lo + duration <= hi]
            if not candidates:
                continue
            start = candidates[0]
            end = start + duration
            plans.append({"title": f"Codeforces: {per} problems ({session})", "task_type": "cp",
                          "topic": (cp_prefs.get("preferred_tags") or ["mixed"])[0],
                          "scheduled_start": start.isoformat(), "scheduled_end": end.isoformat(),
                          "estimated_minutes": per * 20, "priority": 3,
                          "metadata": {"generated": True, "session": session}})
            reserve(start, end + timedelta(minutes=10))

    upcoming = sorted([d for d in deadlines if d.get("status") == "pending"],
                      key=lambda d: deadline_urgency(datetime.fromisoformat(d["due_at"]), now), reverse=True)
    index = 0
    for lo, hi in free:
        cursor = lo
        while (hi - cursor).total_seconds() >= 1800:
            minutes = min(90, int((hi - cursor).total_seconds() // 60))
            deadline = upcoming[index] if index < len(upcoming) else None
            end = cursor + timedelta(minutes=minutes)
            plans.append({"title": f"Prepare: {deadline['title']}" if deadline else "Focused study block",
                          "task_type": "study", "topic": deadline["title"] if deadline else "review",
                          "deadline_id": deadline.get("id") if deadline else None,
                          "scheduled_start": cursor.isoformat(), "scheduled_end": end.isoformat(),
                          "estimated_minutes": minutes, "priority": max(3, int(deadline.get("priority", 3))) if deadline else 3,
                          "metadata": {"generated": True}})
            cursor = end + timedelta(minutes=10)
            index += 1
    return sorted(plans, key=lambda task: task["scheduled_start"])


def apply_recovery(task: dict, action: str, now: datetime | None = None) -> dict:
    """Return a patch dict implementing a missed-task recovery choice."""
    now = now or datetime.now(timezone.utc)
    start = task.get("scheduled_start")
    try:
        start_dt = datetime.fromisoformat(start) if start else now
    except (TypeError, ValueError):
        start_dt = now
    if start_dt.tzinfo is None:
        start_dt = start_dt.replace(tzinfo=timezone.utc)

    if action == "move_tomorrow":
        delta = timedelta(days=1)
        return _shift(task, start_dt, delta, status="rescheduled")
    if action == "move_weekend":
        days = (5 - start_dt.weekday()) % 7 or 7  # next Saturday
        return _shift(task, start_dt, timedelta(days=days), status="rescheduled")
    if action == "reduce_scope":
        est = task.get("estimated_minutes") or 60
        return {"estimated_minutes": max(15, est // 2), "status": "pending",
                "metadata": {**(task.get("metadata") or {}), "scope_reduced": True}}
    if action == "skip":
        return {"status": "skipped", "skip_reason": "User chose to skip during recovery."}
    raise ValueError(f"Unknown recovery action: {action}")


def _shift(task: dict, start_dt: datetime, delta: timedelta, *, status: str) -> dict:
    patch = {"scheduled_start": (start_dt + delta).isoformat(), "status": status}
    end = task.get("scheduled_end")
    if end:
        try:
            end_dt = datetime.fromisoformat(end)
            if end_dt.tzinfo is None:
                end_dt = end_dt.replace(tzinfo=timezone.utc)
            patch["scheduled_end"] = (end_dt + delta).isoformat()
        except (TypeError, ValueError):
            pass
    return patch
