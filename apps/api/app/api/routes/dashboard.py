from fastapi import APIRouter, Depends

from ...core.security import AuthUser
from ...core.store import Store
from ...services import analytics_service
from ..deps import get_current_user, get_store
from .me import ensure_profile

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
def get_dashboard(
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    profile = ensure_profile(store, user)
    return analytics_service.dashboard(store, user.id, profile.get("timezone"))
