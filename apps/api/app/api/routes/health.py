from fastapi import APIRouter, HTTPException

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


@router.get("/ready")
def ready() -> dict:
    """Database readiness; liveness at /health intentionally stays cheap."""
    s = get_settings()
    if s.effective_demo_mode:
        return {"status": "ready", "storage": "memory"}
    if not s.supabase_configured:
        raise HTTPException(503, "Live database configuration is incomplete.")
    from ...core.database import get_service_client
    try:
        client = get_service_client()
        client.table("profiles").select("id").limit(1).execute()
    except Exception:
        raise HTTPException(503, "Database is not ready. Check configuration and migrations.") from None
    return {"status": "ready", "storage": "supabase", "ai_configured": s.gemini_configured}
