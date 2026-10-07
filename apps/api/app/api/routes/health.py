from fastapi import APIRouter

from ...core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    s = get_settings()
    return {
        "status": "ok",
        "version": "0.1.0",
        "demo_mode": s.effective_demo_mode,
        "supabase_configured": s.supabase_configured,
        "gemini_configured": s.gemini_configured,
    }
