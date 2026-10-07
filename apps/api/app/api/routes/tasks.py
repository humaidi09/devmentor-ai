from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, HTTPException

from ...core.security import AuthUser
from ...core.store import Store
from ...core.timeutils import day_bounds_utc, to_user_tz, user_now
from ...schemas.common import Message, Page
from ...schemas.tasks import (
    GeneratePlanRequest,
    TaskComplete,
    TaskIn,
    TaskOut,
    TaskReschedule,
    TaskSkip,
    TaskUpdate,
)
from ...services import analytics_service, planner_service, quiz_service
from ..deps import Pagination, get_current_user, get_store, pagination
from .me import ensure_profile

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _dt_iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


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


@router.get("", response_model=Page[TaskOut])
def list_tasks(
    status: str | None = None,
    task_type: str | None = None,
    pg: Pagination = Depends(pagination),
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    filters = [("user_id", "eq", user.id)]
    if status:
        filters.append(("status", "eq", status))
    if task_type:
        filters.append(("task_type", "eq", task_type))
    rows = store.select("tasks", filters=filters, order="scheduled_start")
    return {"items": rows[pg.offset: pg.offset + pg.limit], "limit": pg.limit,
            "offset": pg.offset, "count": len(rows)}


@router.post("", response_model=TaskOut, status_code=201)
def create_task(
    body: TaskIn,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    payload = body.model_dump()
    payload["scheduled_start"] = _dt_iso(body.scheduled_start)
    payload["scheduled_end"] = _dt_iso(body.scheduled_end)
    return store.insert("tasks", {**payload, "user_id": user.id, "status": "pending"})


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: str,
    body: TaskUpdate,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    data = body.model_dump(exclude_unset=True)
    for k in ("scheduled_start", "scheduled_end"):
        if k in data and isinstance(data[k], datetime):
            data[k] = data[k].isoformat()
    rows = store.update("tasks", [("id", "eq", task_id), ("user_id", "eq", user.id)], data)
    if not rows:
        raise HTTPException(404, "Task not found.")
    return rows[0]


@router.delete("/{task_id}", response_model=Message)
def delete_task(
    task_id: str,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    store.delete("tasks", [("id", "eq", task_id), ("user_id", "eq", user.id)])
    return Message(message="Task deleted.")


def _get_task(store: Store, user: AuthUser, task_id: str) -> dict:
    task = store.select("tasks", filters=[("id", "eq", task_id), ("user_id", "eq", user.id)], single=True)
    if not task:
        raise HTTPException(404, "Task not found.")
    return task


@router.post("/{task_id}/complete", response_model=TaskOut)
def complete_task(
    task_id: str,
    body: TaskComplete | None = None,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    _get_task(store, user, task_id)
    body = body or TaskComplete()
    patch = {"status": "completed"}
    if body.completion_note is not None:
        patch["completion_note"] = body.completion_note
    if body.actual_minutes is not None:
        patch["actual_minutes"] = body.actual_minutes
    return store.update("tasks", [("id", "eq", task_id), ("user_id", "eq", user.id)], patch)[0]


@router.post("/{task_id}/skip", response_model=TaskOut)
def skip_task(
    task_id: str,
    body: TaskSkip | None = None,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    _get_task(store, user, task_id)
    body = body or TaskSkip()
    patch = {"status": "skipped", "skip_reason": body.skip_reason}
    return store.update("tasks", [("id", "eq", task_id), ("user_id", "eq", user.id)], patch)[0]


@router.post("/{task_id}/reschedule", response_model=TaskOut)
def reschedule_task(
    task_id: str,
    body: TaskReschedule,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    _get_task(store, user, task_id)
    patch = {
        "scheduled_start": body.scheduled_start.isoformat(),
        "scheduled_end": _dt_iso(body.scheduled_end),
        "status": "pending",
    }
    return store.update("tasks", [("id", "eq", task_id), ("user_id", "eq", user.id)], patch)[0]


@router.get("/recovery-options")
def recovery_options():
    """Compassionate choices shown when a task is missed."""
    return {"options": planner_service.recovery_options()}


@router.post("/{task_id}/recover", response_model=TaskOut)
def recover_task(
    task_id: str,
    action: str = Body(..., embed=True),
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    task = _get_task(store, user, task_id)
    try:
        patch = planner_service.apply_recovery(task, action)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    return store.update("tasks", [("id", "eq", task_id), ("user_id", "eq", user.id)], patch)[0]


def _persist_plan(store: Store, user: AuthUser, plans: list[dict]) -> list[dict]:
    created = []
    for p in plans:
        created.append(store.insert("tasks", {**p, "user_id": user.id, "status": "pending"}))
    return created


@router.post("/generate-daily", response_model=Page[TaskOut])
def generate_daily(
    body: GeneratePlanRequest | None = None,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    body = body or GeneratePlanRequest()
    profile = ensure_profile(store, user)
    tz = profile.get("timezone")
    on_date = to_user_tz(body.date, tz).date() if body.date else user_now(tz).date()

    if body.replace_existing:
        start_utc, end_utc = day_bounds_utc(tz, on_date)
        for t in store.select("tasks", filters=[("user_id", "eq", user.id)]):
            if (t.get("metadata") or {}).get("generated") and _in_utc_range(
                t.get("scheduled_start"), start_utc, end_utc
            ):
                store.delete("tasks", [("id", "eq", t["id"]), ("user_id", "eq", user.id)])

    deadlines = store.select("deadlines", filters=[("user_id", "eq", user.id)])
    cp_prefs = store.select("cp_preferences", filters=[("user_id", "eq", user.id)], single=True)
    plans = planner_service.build_daily_plan(
        profile=profile, deadlines=deadlines, cp_prefs=cp_prefs, on_date=on_date
    )
    # Add a little extra practice for weak topics (from quiz history).
    perf = analytics_service.topic_performance(store, user.id)
    weak = quiz_service.topics_below(perf)
    plans.extend(planner_service.revision_tasks_for_weak_topics(weak))
    created = _persist_plan(store, user, plans)
    return {"items": created, "limit": len(created), "offset": 0, "count": len(created)}


@router.post("/generate-weekly-plan", response_model=Page[TaskOut])
def generate_weekly_plan(
    body: GeneratePlanRequest | None = None,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    body = body or GeneratePlanRequest()
    profile = ensure_profile(store, user)
    tz = profile.get("timezone")
    start = to_user_tz(body.date, tz).date() if body.date else user_now(tz).date()
    deadlines = store.select("deadlines", filters=[("user_id", "eq", user.id)])
    cp_prefs = store.select("cp_preferences", filters=[("user_id", "eq", user.id)], single=True)

    from datetime import timedelta

    all_created: list[dict] = []
    for i in range(7):
        on_date = start + timedelta(days=i)
        plans = planner_service.build_daily_plan(
            profile=profile, deadlines=deadlines, cp_prefs=cp_prefs, on_date=on_date
        )
        all_created.extend(_persist_plan(store, user, plans))
    return {"items": all_created, "limit": len(all_created), "offset": 0, "count": len(all_created)}
