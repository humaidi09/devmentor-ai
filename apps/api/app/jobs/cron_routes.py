"""Idempotent internal cron endpoints, secured by CRON_SECRET.

Designed to be called by GitHub Actions (free tier) since free hosts can't
run an always-on worker. All handlers are safe to run repeatedly.

  POST /internal/cron/daily-planning     — build today's tasks + CP recs
  POST /internal/cron/send-notifications — deliver due notifications
  POST /internal/cron/weekly-summary     — Sunday evening summaries
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Header, HTTPException

from ..core.config import get_settings
from ..core.database import get_service_client
from ..core.logging import get_logger
from ..core.security import DEMO_USER_ID
from ..core.store import SupabaseStore, Store, get_memory_store
from ..core.timeutils import (
    combine_local_to_utc,
    day_bounds_utc,
    to_user_tz,
    user_now,
    utc_now,
    week_start,
)
from ..services import cp_service, notification_service, planner_service

logger = get_logger(__name__)
router = APIRouter(prefix="/internal/cron", tags=["cron"])


def _authorize(secret: str | None) -> None:
    settings = get_settings()
    if not secret or secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Invalid cron secret.")


def _cron_store_and_users() -> tuple[Store, list[str]]:
    """Service-role store across all users, or demo store for the demo user."""
    client = get_service_client()
    if client is None:
        return get_memory_store(), [DEMO_USER_ID]
    store = SupabaseStore(client)
    user_ids = [p["id"] for p in store.select("profiles") if p.get("id")]
    return store, user_ids


def _in_utc_range(iso: str | None, start, end) -> bool:
    if not iso:
        return False
    try:
        d = datetime.fromisoformat(iso)
    except ValueError:
        return False
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return start <= d < end


@router.post("/daily-planning")
def daily_planning(x_cron_secret: str | None = Header(default=None)):
    _authorize(x_cron_secret)
    store, user_ids = _cron_store_and_users()
    report = {"users": 0, "tasks_created": 0, "cp_recs": 0, "notifications": 0}

    for uid in user_ids:
        profile = store.select("profiles", filters=[("id", "eq", uid)], single=True)
        if not profile:
            continue
        report["users"] += 1
        tz = profile.get("timezone")
        today = user_now(tz).date()
        start_utc, end_utc = day_bounds_utc(tz, today)

        today_tasks = [t for t in store.select("tasks", filters=[("user_id", "eq", uid)])
                       if _in_utc_range(t.get("scheduled_start"), start_utc, end_utc)]
        pending = [t for t in today_tasks if t.get("status") == "pending"]

        if len(pending) < 2:
            deadlines = store.select("deadlines", filters=[("user_id", "eq", uid)])
            cp_prefs = store.select("cp_preferences", filters=[("user_id", "eq", uid)], single=True)
            for p in planner_service.build_daily_plan(
                profile=profile, deadlines=deadlines, cp_prefs=cp_prefs, on_date=today
            ):
                store.insert("tasks", {**p, "user_id": uid, "status": "pending"})
                report["tasks_created"] += 1

        cp_prefs = store.select("cp_preferences", filters=[("user_id", "eq", uid)], single=True)
        if cp_prefs and cp_prefs.get("notifications_enabled", True):
            existing = [r for r in store.select("cp_recommendations", filters=[("user_id", "eq", uid)])
                        if r.get("recommendation_date") == today.isoformat()]
            if not existing:
                recs = cp_service.generate_recommendations(
                    store, uid, profile.get("codeforces_handle"), cp_prefs
                )
                report["cp_recs"] += len(recs)
                for session, hhmm in (("morning", cp_prefs.get("morning_time", "10:00")),
                                      ("evening", cp_prefs.get("evening_time", "20:00"))):
                    notification_service.create_notification(
                        store, user_id=uid, type=f"cp_{session}",
                        title=f"{session.capitalize()} Codeforces session",
                        body="Your problems for this session are ready.",
                        scheduled_at=combine_local_to_utc(today, hhmm, tz),
                        metadata={"session": session},
                    )
                    report["notifications"] += 1

        # Contest reminders (real data only; no-op in demo mode / on API error).
        if cp_prefs and cp_prefs.get("contest_reminders_enabled", True):
            for rem in cp_service.contest_reminders(int(utc_now().timestamp())):
                already = any(
                    n.get("type") == "contest_reminder"
                    and int((n.get("metadata") or {}).get("contest_id") or -1) == int(rem["contest_id"] or -1)
                    for n in store.select("notifications", filters=[("user_id", "eq", uid)])
                )
                if already:
                    continue
                notification_service.create_notification(
                    store, user_id=uid, type="contest_reminder",
                    title=rem["title"], body=rem["body"],
                    scheduled_at=datetime.fromtimestamp(rem["start_time_seconds"] - 1800, tz=timezone.utc),
                    metadata={"contest_id": rem["contest_id"]},
                )
                report["notifications"] += 1

        # One daily summary per local day.
        has_summary = any(
            n.get("type") == "daily_summary"
            and n.get("created_at")
            and to_user_tz(datetime.fromisoformat(n["created_at"]), tz).date() == today
            for n in store.select("notifications", filters=[("user_id", "eq", uid)])
        )
        if not has_summary:
            notification_service.create_notification(
                store, user_id=uid, type="daily_summary",
                title="Your plan for today is ready",
                body=f"{len(pending)} task(s) pending today.",
            )
            report["notifications"] += 1

    return report


@router.post("/send-notifications")
def send_notifications(x_cron_secret: str | None = Header(default=None)):
    _authorize(x_cron_secret)
    store, user_ids = _cron_store_and_users()
    now = utc_now()
    sent = 0
    for uid in user_ids:
        profile = store.select("profiles", filters=[("id", "eq", uid)], single=True) or {}
        tz = profile.get("timezone")
        max_per_day = int((profile.get("notification_settings") or {}).get("max_per_day", 6))
        for n in store.select("notifications", filters=[("user_id", "eq", uid)]):
            if n.get("status") not in {"pending", "scheduled"}:
                continue
            sched = n.get("scheduled_at")
            if sched:
                try:
                    sched_dt = datetime.fromisoformat(sched)
                    if sched_dt.tzinfo is None:
                        sched_dt = sched_dt.replace(tzinfo=timezone.utc)
                    if sched_dt > now:
                        continue
                except ValueError:
                    pass
            updated = notification_service.deliver(store, n, tz_name=tz, max_per_day=max_per_day)
            if updated.get("status") == "sent":
                sent += 1
    return {"delivered": sent}


@router.post("/weekly-summary")
def weekly_summary(x_cron_secret: str | None = Header(default=None)):
    _authorize(x_cron_secret)
    from ..services import analytics_service

    store, user_ids = _cron_store_and_users()
    created = 0
    for uid in user_ids:
        profile = store.select("profiles", filters=[("id", "eq", uid)], single=True)
        if not profile:
            continue
        tz = profile.get("timezone")
        last_week_start = week_start(user_now(tz).date() - timedelta(days=7))
        metrics = analytics_service.weekly_metrics(store, uid, tz, last_week_start)

        existing = [s for s in store.select("weekly_summaries", filters=[("user_id", "eq", uid)])
                    if s.get("week_start") == last_week_start.isoformat()]
        insights = _build_insights(metrics)
        if existing:
            store.update("weekly_summaries",
                         [("id", "eq", existing[0]["id"]), ("user_id", "eq", uid)],
                         {"metrics": metrics, "insights": insights})
        else:
            store.insert("weekly_summaries", {
                "user_id": uid, "week_start": last_week_start.isoformat(),
                "metrics": metrics, "insights": insights,
            })
            created += 1
            # Notify once, only when the summary is first created for the week.
            notification_service.create_notification(
                store, user_id=uid, type="weekly_summary",
                title="Your weekly review is ready",
                body=f"Completed {metrics['tasks']['completed']}/{metrics['tasks']['planned']} tasks last week.",
            )
    return {"summaries_created": created}


def _build_insights(metrics: dict) -> dict:
    rate = metrics["tasks"]["completion_rate"]
    if rate >= 0.8:
        tone = "Great consistency last week — consider a small step up in difficulty."
    elif rate >= 0.5:
        tone = "Solid effort. Protect your top two time slots to finish more."
    else:
        tone = "Last week was tough. Let's reduce scope and rebuild momentum — no pressure."
    return {"headline": tone, "completion_rate": rate}
