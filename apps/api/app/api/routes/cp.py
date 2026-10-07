from fastapi import APIRouter, Depends, HTTPException, Request

from ...core.ratelimit import limiter
from ...core.security import AuthUser
from ...core.store import Store
from ...schemas.common import Page
from ...schemas.cp import (
    CPPreferencesIn,
    CPPreferencesOut,
    CPProfileOut,
    CPRecommendationOut,
    CPRecommendationUpdate,
)
from ...services import cp_service
from ..deps import Pagination, get_current_user, get_store, pagination
from .me import ensure_profile

router = APIRouter(prefix="/api/cp", tags=["competitive-programming"])


def _get_prefs(store: Store, user: AuthUser) -> dict:
    prefs = store.select("cp_preferences", filters=[("user_id", "eq", user.id)], single=True)
    if prefs is None:
        prefs = store.insert("cp_preferences", {**CPPreferencesIn().model_dump(), "user_id": user.id})
    return prefs


@router.get("/preferences", response_model=CPPreferencesOut)
def get_preferences(user: AuthUser = Depends(get_current_user), store: Store = Depends(get_store)):
    return _get_prefs(store, user)


@router.post("/preferences", response_model=CPPreferencesOut)
def upsert_preferences(
    body: CPPreferencesIn,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    existing = store.select("cp_preferences", filters=[("user_id", "eq", user.id)], single=True)
    if existing:
        rows = store.update("cp_preferences", [("user_id", "eq", user.id)], body.model_dump())
        return rows[0]
    return store.insert("cp_preferences", {**body.model_dump(), "user_id": user.id})


@router.get("/profile", response_model=CPProfileOut)
def cp_profile(user: AuthUser = Depends(get_current_user), store: Store = Depends(get_store)):
    prof = ensure_profile(store, user)
    return cp_service.get_profile(store, user.id, prof.get("codeforces_handle"))


@router.post("/sync")
@limiter.limit("10/minute")
def cp_sync(request: Request, user: AuthUser = Depends(get_current_user), store: Store = Depends(get_store)):
    prof = ensure_profile(store, user)
    handle = prof.get("codeforces_handle")
    if not handle:
        raise HTTPException(400, "Add a Codeforces handle to your profile first.")
    summary = cp_service.get_profile(store, user.id, handle)
    return {"synced": "error" not in summary, "profile": summary}


@router.get("/recommendations", response_model=Page[CPRecommendationOut])
def list_recommendations(
    pg: Pagination = Depends(pagination),
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    rows = store.select("cp_recommendations", filters=[("user_id", "eq", user.id)],
                        order="created_at", desc=True)
    return {"items": rows[pg.offset: pg.offset + pg.limit], "limit": pg.limit,
            "offset": pg.offset, "count": len(rows)}


@router.post("/recommendations/generate", response_model=Page[CPRecommendationOut])
@limiter.limit("10/minute")
def generate_recommendations(
    request: Request,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    prof = ensure_profile(store, user)
    prefs = _get_prefs(store, user)
    created = cp_service.generate_recommendations(store, user.id, prof.get("codeforces_handle"), prefs)
    return {"items": created, "limit": len(created), "offset": 0, "count": len(created)}


@router.patch("/recommendations/{rec_id}", response_model=CPRecommendationOut)
def update_recommendation(
    rec_id: str,
    body: CPRecommendationUpdate,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    rows = store.update("cp_recommendations",
                        [("id", "eq", rec_id), ("user_id", "eq", user.id)],
                        {"status": body.status})
    if not rows:
        raise HTTPException(404, "Recommendation not found.")
    return rows[0]


@router.get("/contests")
def contests():
    return {"items": cp_service.upcoming_contests()}
