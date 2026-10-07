from fastapi import APIRouter, Depends, HTTPException, Query

from ...core.security import AuthUser
from ...core.store import Store
from ...schemas.common import Message, Page
from ...schemas.snippets import SnippetIn, SnippetOut, SnippetUpdate
from ..deps import Pagination, get_current_user, get_store, pagination

router = APIRouter(prefix="/api/snippets", tags=["snippets"])


def _decorate(row: dict, user_id: str) -> dict:
    return {**row, "is_owner": row.get("owner_id") == user_id}


@router.get("", response_model=Page[SnippetOut])
def search_snippets(
    q: str | None = Query(None, description="Full-text query"),
    language: str | None = None,
    category: str | None = None,
    tags: list[str] | None = Query(None),
    visibility: str | None = Query(None, pattern=r"^(public|private)$"),
    pg: Pagination = Depends(pagination),
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    rows = store.search_snippets(
        user_id=user.id, q=q, language=language, category=category,
        tags=tags, visibility=visibility, limit=pg.limit, offset=pg.offset,
    )
    items = [_decorate(r, user.id) for r in rows]
    return {"items": items, "limit": pg.limit, "offset": pg.offset, "count": len(items)}


@router.get("/{snippet_id}", response_model=SnippetOut)
def get_snippet(
    snippet_id: str,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    row = store.select("snippets", filters=[("id", "eq", snippet_id)], single=True)
    if not row or (row.get("visibility") != "public" and row.get("owner_id") != user.id):
        raise HTTPException(404, "Snippet not found.")
    return _decorate(row, user.id)


@router.post("", response_model=SnippetOut, status_code=201)
def create_snippet(
    body: SnippetIn,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    row = store.insert("snippets", {**body.model_dump(), "owner_id": user.id})
    return _decorate(row, user.id)


@router.patch("/{snippet_id}", response_model=SnippetOut)
def update_snippet(
    snippet_id: str,
    body: SnippetUpdate,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    data = body.model_dump(exclude_unset=True)
    rows = store.update("snippets", [("id", "eq", snippet_id), ("owner_id", "eq", user.id)], data)
    if not rows:
        raise HTTPException(404, "Snippet not found or not yours to edit.")
    return _decorate(rows[0], user.id)


@router.delete("/{snippet_id}", response_model=Message)
def delete_snippet(
    snippet_id: str,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    store.delete("snippets", [("id", "eq", snippet_id), ("owner_id", "eq", user.id)])
    return Message(message="Snippet deleted.")


@router.post("/{snippet_id}/copy-event", response_model=Message)
def copy_event(
    snippet_id: str,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    """Record a copy for analytics. Only your own snippets' counters update
    (built-in public snippets are read-only under RLS)."""
    row = store.select("snippets", filters=[("id", "eq", snippet_id)], single=True)
    if not row:
        raise HTTPException(404, "Snippet not found.")
    if row.get("owner_id") == user.id:
        store.update("snippets", [("id", "eq", snippet_id), ("owner_id", "eq", user.id)],
                     {"usage_count": int(row.get("usage_count", 0)) + 1})
    return Message(message="Copy recorded.")
