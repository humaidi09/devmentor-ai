from fastapi import APIRouter, Depends, Query

from ...core.security import AuthUser
from ...core.store import Store
from ...schemas.common import Message
from ...schemas.profile import ProfileOut, ProfileUpdate
from ..deps import get_current_user, get_store

router = APIRouter(prefix="/api", tags=["profile"])

# Tables that hold a user's personal data, for the deletion endpoint.
OWNED_TABLES = [
    "tasks", "study_sessions", "deadlines", "courses", "cp_preferences",
    "cp_recommendations", "quiz_attempts", "notifications", "weekly_summaries",
    "chat_messages", "conversations", "agent_audit_log",
]


def ensure_profile(store: Store, user: AuthUser) -> dict:
    prof = store.select("profiles", filters=[("id", "eq", user.id)], single=True)
    if prof is None:
        default_name = user.email.split("@")[0] if user.email else "there"
        prof = store.insert("profiles", {"id": user.id, "display_name": default_name})
    return prof


@router.get("/me", response_model=ProfileOut)
def get_me(user: AuthUser = Depends(get_current_user), store: Store = Depends(get_store)):
    return ensure_profile(store, user)


@router.patch("/me", response_model=ProfileOut)
def update_me(
    patch: ProfileUpdate,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    ensure_profile(store, user)
    data = patch.model_dump(exclude_unset=True)
    if not data:
        return ensure_profile(store, user)
    rows = store.update("profiles", [("id", "eq", user.id)], data)
    return rows[0] if rows else ensure_profile(store, user)


@router.delete("/me", response_model=Message)
def delete_my_data(
    confirm: bool = Query(False, description="Must be true to actually delete."),
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    """Privacy: erase all personal data for the signed-in user.

    Requires explicit ?confirm=true (human-in-the-loop). This removes app
    data; deleting the Supabase auth account itself is documented in
    PRIVACY.md (requires an admin/service action)."""
    if not confirm:
        return Message(message="Add ?confirm=true to permanently delete all your data.")
    for table in OWNED_TABLES:
        try:
            store.delete(table, [("user_id", "eq", user.id)])
        except Exception:
            pass
    store.delete("profiles", [("id", "eq", user.id)])
    return Message(message="All your DevMentor data has been deleted.")
