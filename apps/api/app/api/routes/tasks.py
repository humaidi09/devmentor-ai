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


def generate_for_day(store: Store, user: AuthUser, profile: dict, on_date, replace: bool = False) -> list[dict]:
    start, end = day_bounds_utc(profile.get("timezone"), on_date)
    existing = store.select("tasks", filters=[("user_id", "eq", user.id)])
    generated = [t for t in existing if (t.get("metadata") or {}).get("generated") and (
        (t.get("metadata") or {}).get("generated_date") == on_date.isoformat()
        or _in_utc_range(t.get("scheduled_start"), start, end))]
    if generated and not replace:
        return generated
    if replace:
        for task in generated:
            if task.get("status") in {"pending", "rescheduled"}:
                existing = [t for t in existing if t["id"] != task["id"]]
    plans = planner_service.build_daily_plan(
        profile=profile, deadlines=store.select("deadlines", filters=[("user_id", "eq", user.id)]),
        cp_prefs=store.select("cp_preferences", filters=[("user_id", "eq", user.id)], single=True),
        on_date=on_date, existing_tasks=existing)
    weak = iter(quiz_service.topics_below(analytics_service.topic_performance(store, user.id)))
    created = []
    for plan in plans:
        if plan["task_type"] == "study":
            topic = next(weak, None)
            if topic:
                plan.update(title=f"Revise: {topic}", topic=topic, task_type="revision")
        plan["metadata"].update(generated_date=on_date.isoformat(),
                                generation_key=f"{on_date}:{plan['scheduled_start']}:{plan['task_type']}")
        created.append(plan)
    return store.save_plan(user.id, on_date.isoformat(), start.isoformat(), end.isoformat(), created, replace)


@router.post("/generate-daily", response_model=Page[TaskOut])
def generate_daily(body: GeneratePlanRequest | None = None,
                   user: AuthUser = Depends(get_current_user), store: Store = Depends(get_store)):
    body = body or GeneratePlanRequest()
    profile = ensure_profile(store, user)
    day = to_user_tz(body.date, profile.get("timezone")).date() if body.date else user_now(profile.get("timezone")).date()
    rows = generate_for_day(store, user, profile, day, body.replace_existing)
    return {"items": rows, "limit": len(rows), "offset": 0, "count": len(rows)}


@router.post("/generate-weekly-plan", response_model=Page[TaskOut])
def generate_weekly_plan(body: GeneratePlanRequest | None = None,
                         user: AuthUser = Depends(get_current_user), store: Store = Depends(get_store)):
    from datetime import timedelta
    body = body or GeneratePlanRequest()
    profile = ensure_profile(store, user)
    start = to_user_tz(body.date, profile.get("timezone")).date() if body.date else user_now(profile.get("timezone")).date()
    rows = []
    for i in range(7):
        rows.extend(generate_for_day(store, user, profile, start + timedelta(days=i), body.replace_existing))
    return {"items": rows, "limit": len(rows), "offset": 0, "count": len(rows)}
