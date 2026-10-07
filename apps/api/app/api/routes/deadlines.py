from fastapi import APIRouter, Depends, HTTPException

from ...core.security import AuthUser
from ...core.store import Store
from ...schemas.common import Message, Page
from ...schemas.tasks import DeadlineIn, DeadlineOut, DeadlineUpdate
from ..deps import Pagination, get_current_user, get_store, pagination

router = APIRouter(prefix="/api/deadlines", tags=["deadlines"])


@router.get("", response_model=Page[DeadlineOut])
def list_deadlines(
    pg: Pagination = Depends(pagination),
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    rows = store.select("deadlines", filters=[("user_id", "eq", user.id)], order="due_at")
    return {"items": rows[pg.offset: pg.offset + pg.limit], "limit": pg.limit,
            "offset": pg.offset, "count": len(rows)}


@router.post("", response_model=DeadlineOut, status_code=201)
def create_deadline(
    body: DeadlineIn,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    payload = body.model_dump()
    payload["due_at"] = body.due_at.isoformat()
    return store.insert("deadlines", {**payload, "user_id": user.id})


@router.patch("/{deadline_id}", response_model=DeadlineOut)
def update_deadline(
    deadline_id: str,
    body: DeadlineUpdate,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    data = body.model_dump(exclude_unset=True)
    if "due_at" in data and data["due_at"] is not None:
        data["due_at"] = body.due_at.isoformat()
    rows = store.update("deadlines", [("id", "eq", deadline_id), ("user_id", "eq", user.id)], data)
    if not rows:
        raise HTTPException(404, "Deadline not found.")
    return rows[0]


@router.delete("/{deadline_id}", response_model=Message)
def delete_deadline(
    deadline_id: str,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    store.delete("deadlines", [("id", "eq", deadline_id), ("user_id", "eq", user.id)])
    return Message(message="Deadline deleted.")
