from fastapi import APIRouter, Depends, Request, HTTPException

from ...agent import orchestrator
from ...core.ratelimit import limiter
from ...core.security import AuthUser
from ...core.store import Store
from ...schemas.chat import ChatRequest, ChatResponse
from ..deps import get_current_user, get_store

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
def chat(
    request: Request,
    body: ChatRequest,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    return orchestrator.handle_chat(
        store, user,
        message=body.message,
        conversation_id=body.conversation_id,
        language=body.language,
    )


@router.get("/conversations")
def conversations(user: AuthUser = Depends(get_current_user), store: Store = Depends(get_store)):
    return store.select("conversations", filters=[("user_id", "eq", user.id)], order="updated_at", desc=True, limit=50)


@router.get("/conversations/{conversation_id}/messages")
def messages(conversation_id: str, user: AuthUser = Depends(get_current_user), store: Store = Depends(get_store)):
    if not store.select("conversations", filters=[("id", "eq", conversation_id), ("user_id", "eq", user.id)], single=True):
        raise HTTPException(404, "Conversation not found.")
    rows = store.select("chat_messages", filters=[("conversation_id", "eq", conversation_id), ("user_id", "eq", user.id)],
                        order="created_at", desc=True, limit=200)
    return [{"role": row["role"], "content": row["content"], "intent": row.get("intent"),
             **{k: v for k, v in (row.get("metadata") or {}).items() if k in {"mocked", "links", "suggested_actions", "actions_taken"}}}
            for row in reversed(rows)]
