from datetime import date

from fastapi import APIRouter, Depends

from ...core.security import AuthUser
from ...core.store import Store
from ...core.timeutils import user_now, week_start
from ...services import analytics_service
from ..deps import get_current_user, get_store
from .me import ensure_profile

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/weekly")
def weekly(
    week: str | None = None,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    profile = ensure_profile(store, user)
    tz = profile.get("timezone")
    start = date.fromisoformat(week) if week else week_start(user_now(tz).date())
    return analytics_service.weekly_metrics(store, user.id, tz, start)


@router.get("/topics")
def topics(
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    return {"items": analytics_service.topic_performance(store, user.id)}
