from fastapi import APIRouter, Depends, HTTPException

from ...core.security import AuthUser
from ...core.store import Store
from ...schemas.common import Message, Page
from ...schemas.notifications import (
    NotificationOut,
    NotificationPreferences,
    PushSubscription,
)
from ...services import notification_service
from ..deps import Pagination, get_current_user, get_store, pagination
from .me import ensure_profile

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=Page[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    pg: Pagination = Depends(pagination),
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    rows = store.select("notifications", filters=[("user_id", "eq", user.id)],
                        order="created_at", desc=True)
    if unread_only:
        rows = [r for r in rows if r.get("status") != "read" and r.get("read_at") is None]
    return {"items": rows[pg.offset: pg.offset + pg.limit], "limit": pg.limit,
            "offset": pg.offset, "count": len(rows)}


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: str,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    row = notification_service.mark_read(store, user.id, notification_id)
    if not row:
        raise HTTPException(404, "Notification not found.")
    return row


@router.get("/preferences", response_model=NotificationPreferences)
def get_preferences(
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    prof = ensure_profile(store, user)
    stored = prof.get("notification_settings") or {}
    return NotificationPreferences(**stored)


@router.patch("/preferences", response_model=NotificationPreferences)
def set_preferences(
    body: NotificationPreferences,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    ensure_profile(store, user)
    store.update("profiles", [("id", "eq", user.id)], {"notification_settings": body.model_dump()})
    return body


@router.post("/subscribe", response_model=Message)
def subscribe(
    body: PushSubscription,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    prof = ensure_profile(store, user)
    tokens = list(prof.get("push_tokens") or [])
    if body.token not in tokens:
        tokens.append(body.token)
    store.update("profiles", [("id", "eq", user.id)], {"push_tokens": tokens})
    return Message(message="Subscribed to web push notifications.")
