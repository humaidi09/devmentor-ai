from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ...core.security import AuthUser
from ...core.store import Store
from ...core.timeutils import utc_now
from ..deps import get_current_user, get_store

router = APIRouter(prefix="/api/focus", tags=["focus"])


class FocusStart(BaseModel):
    task_id: str | None = None


class FocusStop(BaseModel):
    session_id: str
    notes: str | None = None


@router.post("/start")
def start_focus(
    body: FocusStart | None = None,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    body = body or FocusStart()
    session = store.insert("study_sessions", {
        "user_id": user.id,
        "task_id": body.task_id,
        "started_at": utc_now().isoformat(),
        "focus_mode": True,
    })
    if body.task_id:
        store.update("tasks", [("id", "eq", body.task_id), ("user_id", "eq", user.id)],
                     {"status": "in_progress"})
    return session


@router.post("/stop")
def stop_focus(
    body: FocusStop,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    session = store.select("study_sessions",
                           filters=[("id", "eq", body.session_id), ("user_id", "eq", user.id)],
                           single=True)
    if not session:
        raise HTTPException(404, "Focus session not found.")
    ended = utc_now()
    try:
        started = datetime.fromisoformat(session["started_at"])
        duration = max(0, int((ended - started).total_seconds() // 60))
    except (KeyError, ValueError):
        duration = 0
    rows = store.update("study_sessions",
                        [("id", "eq", body.session_id), ("user_id", "eq", user.id)],
                        {"ended_at": ended.isoformat(), "duration_minutes": duration,
                         "notes": body.notes})
    return rows[0] if rows else session
