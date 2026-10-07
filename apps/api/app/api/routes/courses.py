from fastapi import APIRouter, Depends, HTTPException

from ...core.security import AuthUser
from ...core.store import Store
from ...schemas.common import Message, Page
from ...schemas.tasks import CourseIn, CourseOut, CourseUpdate
from ..deps import Pagination, get_current_user, get_store, pagination

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("", response_model=Page[CourseOut])
def list_courses(
    pg: Pagination = Depends(pagination),
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    rows = store.select("courses", filters=[("user_id", "eq", user.id)], order="created_at", desc=True)
    return {"items": rows[pg.offset: pg.offset + pg.limit], "limit": pg.limit,
            "offset": pg.offset, "count": len(rows)}


@router.post("", response_model=CourseOut, status_code=201)
def create_course(
    body: CourseIn,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    return store.insert("courses", {**body.model_dump(), "user_id": user.id})


@router.patch("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: str,
    body: CourseUpdate,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    data = body.model_dump(exclude_unset=True)
    rows = store.update("courses", [("id", "eq", course_id), ("user_id", "eq", user.id)], data)
    if not rows:
        raise HTTPException(404, "Course not found.")
    return rows[0]


@router.delete("/{course_id}", response_model=Message)
def delete_course(
    course_id: str,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    store.delete("courses", [("id", "eq", course_id), ("user_id", "eq", user.id)])
    return Message(message="Course deleted.")
