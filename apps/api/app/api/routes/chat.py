from fastapi import APIRouter, Depends, Request

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
