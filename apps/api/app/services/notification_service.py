"""Notification creation + delivery.

Delivery honours the user's timezone, quiet hours, and a daily frequency
cap. In-app always works. Email (Resend) and web push (FCM) are sent only
when configured; otherwise the attempt is logged and the row is marked so
nothing is silently faked.
"""
from __future__ import annotations

from datetime import datetime

import httpx

from ..core.config import get_settings
from ..core.logging import get_logger
from ..core.store import Store
from ..core.timeutils import in_quiet_hours, to_user_tz, utc_now

logger = get_logger(__name__)

# Notifications that should bypass quiet hours / caps (none are "critical"
# in the MVP, but contest-start could be later).
BYPASS_TYPES: set[str] = set()


def create_notification(
    store: Store,
    *,
    user_id: str,
    type: str,
    title: str,
    body: str | None = None,
    channel: str = "in_app",
    scheduled_at: datetime | None = None,
    metadata: dict | None = None,
) -> dict:
    status = "scheduled" if scheduled_at else "sent"
    sent_at = None if scheduled_at else utc_now().isoformat()
    return store.insert(
        "notifications",
        {
            "user_id": user_id,
            "type": type,
            "title": title,
            "body": body,
            "channel": channel,
            "scheduled_at": scheduled_at.isoformat() if scheduled_at else None,
            "sent_at": sent_at,
            "status": status,
            "metadata": metadata or {},
        },
    )


def _count_sent_today(store: Store, user_id: str, tz_name: str | None) -> int:
    rows = store.select("notifications", filters=[("user_id", "eq", user_id)])
    today = to_user_tz(utc_now(), tz_name).date()
    n = 0
    for r in rows:
        sent = r.get("sent_at")
        if sent and r.get("status") in {"sent", "read"}:
            try:
                if to_user_tz(datetime.fromisoformat(sent), tz_name).date() == today:
                    n += 1
            except ValueError:
                continue
    return n


def deliver(store: Store, notification: dict, *, tz_name: str | None, max_per_day: int = 6) -> dict:
    """Deliver one due notification idempotently. Returns the updated row."""
    nid = notification["id"]
    if notification.get("status") in {"sent", "read", "cancelled"}:
        return notification

    now_local = to_user_tz(utc_now(), tz_name)
    ntype = notification.get("type", "")

    if ntype not in BYPASS_TYPES:
        prof = store.select("profiles", filters=[("id", "eq", notification["user_id"])], single=True) or {}
        if in_quiet_hours(now_local, prof.get("quiet_hours_start"), prof.get("quiet_hours_end")):
            return notification  # try again after quiet hours
        if _count_sent_today(store, notification["user_id"], tz_name) >= max_per_day:
            logger.info("Daily notification cap reached for user %s", notification["user_id"])
            return notification

    channel = notification.get("channel", "in_app")
    ok = True
    if channel == "email":
        ok = _send_email(notification)
    elif channel == "push":
        ok = _send_push(notification)
    # in_app needs no external delivery.

    patch = {
        "status": "sent" if ok else "failed",
        "sent_at": utc_now().isoformat() if ok else None,
    }
    updated = store.update("notifications", [("id", "eq", nid)], patch)
    return updated[0] if updated else {**notification, **patch}


def _send_email(notification: dict) -> bool:
    settings = get_settings()
    to = (notification.get("metadata") or {}).get("email")
    if not settings.resend_api_key or not to:
        logger.info("Email not configured; would send '%s' to %s", notification.get("title"), to)
        return False
    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.email_from,
                "to": [to],
                "subject": notification.get("title", "DevMentor AI"),
                "text": notification.get("body", ""),
            },
            timeout=10.0,
        )
        resp.raise_for_status()
        return True
    except Exception as exc:  # pragma: no cover
        logger.warning("Resend email failed: %s", exc)
        return False


def _send_push(notification: dict) -> bool:
    settings = get_settings()
    token = (notification.get("metadata") or {}).get("push_token")
    if not getattr(settings, "fcm_server_key", None) or not token:
        logger.info("Push not configured; would push '%s'", notification.get("title"))
        return False
    return False  # Full FCM wiring is a Phase 2+ enhancement.


def mark_read(store: Store, user_id: str, notification_id: str) -> dict | None:
    rows = store.update(
        "notifications",
        [("id", "eq", notification_id), ("user_id", "eq", user_id)],
        {"status": "read", "read_at": utc_now().isoformat()},
    )
    return rows[0] if rows else None
