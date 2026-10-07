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


def build_daily_plan(
    *,
    profile: dict,
    deadlines: list[dict],
    cp_prefs: dict | None,
    on_date: date,
    now: datetime | None = None,
) -> list[dict]:
    """Return a list of task payloads for `on_date` (local). Does not persist.

    Guarantees:
    - total study minutes never exceed the day's available minutes
    - CP sessions are added at the user's preferred times when enabled
    - a short rest is added on heavy days
    """
    now = now or datetime.now(timezone.utc)
    tz = profile.get("timezone", "UTC")
    weekday = WEEKDAY_KEYS[on_date.weekday()]
    slots = (profile.get("available_schedule") or {}).get(weekday, [])
    plans: list[dict] = []

    # ---- CP sessions (time-anchored, short) ----
    if cp_prefs and cp_prefs.get("notifications_enabled", True):
        per = int(cp_prefs.get("problems_per_session", 2))
        est = per * 20
        for session, hhmm in (("morning", cp_prefs.get("morning_time", "10:00")),
                              ("evening", cp_prefs.get("evening_time", "20:00"))):
            start = combine_local_to_utc(on_date, hhmm, tz)
            plans.append({
                "title": f"Codeforces: {per} problems ({session})",
                "description": f"Rating {cp_prefs.get('min_rating', 800)}–{cp_prefs.get('max_rating', 1200)}",
                "task_type": "cp",
                "topic": (cp_prefs.get("preferred_tags") or ["mixed"])[0],
                "scheduled_start": start.isoformat(),
                "scheduled_end": (start + timedelta(minutes=est)).isoformat(),
                "estimated_minutes": est,
                "priority": 3,
                "metadata": {"generated": True, "session": session},
            })

    # ---- Study items from nearest deadlines, then active courses ----
    upcoming = sorted(
        [d for d in deadlines if d.get("status") == "pending"],
        key=lambda d: deadline_urgency(datetime.fromisoformat(d["due_at"]), now),
        reverse=True,
    )

    available_minutes = sum(_slot_minutes(s) for s in slots)
    used = 0
    item_idx = 0

    for slot in slots:
        slot_start = combine_local_to_utc(on_date, slot.get("start", "09:00"), tz)
        remaining = _slot_minutes(slot)
        cursor = slot_start
        while remaining >= 30 and used < available_minutes:
            block = min(90, remaining)
            if upcoming and item_idx < len(upcoming):
                d = upcoming[item_idx % len(upcoming)]
                title = f"Prepare: {d['title']}"
                topic = d.get("title")
                deadline_id = d.get("id")
                priority = max(3, int(d.get("priority", 3)))
            else:
                title = "Focused study block"
                topic = "review"
                deadline_id = None
                priority = 3
            plans.append({
                "title": title,
                "description": "Auto-generated study block",
                "task_type": "study",
                "topic": topic,
                "deadline_id": deadline_id,
                "scheduled_start": cursor.isoformat(),
                "scheduled_end": (cursor + timedelta(minutes=block)).isoformat(),
                "estimated_minutes": block,
                "priority": priority,
                "metadata": {"generated": True},
            })
            used += block
            cursor += timedelta(minutes=block + 10)  # 10-min break
            remaining -= block + 10
            item_idx += 1

    # ---- Rest suggestion on heavy days ----
    if used >= 180:
        plans.append({
            "title": "Rest / short walk",
            "description": "You've scheduled a lot today — take a real break.",
            "task_type": "rest",
            "topic": "wellbeing",
            "estimated_minutes": 20,
            "priority": 1,
            "metadata": {"generated": True},
        })

    return plans


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
        days = (5 - start_dt.weekday()) % 7 or 1  # next Saturday
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
