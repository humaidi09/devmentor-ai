"""DevMentor AI — FastAPI application entrypoint.

Run locally:  uvicorn app.main:app --reload --port 8000
Interactive docs at /docs.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .api import errors
from .api.routes import (
    analytics,
    chat,
    courses,
    cp,
    dashboard,
    deadlines,
    dev_tools,
    focus,
    health,
    me,
    notifications,
    quiz,
    snippets,
    tasks,
)
from .core.config import get_settings
from .core.logging import configure_logging, get_logger
from .core.ratelimit import limiter
from .jobs import cron_routes

settings = get_settings()
configure_logging(settings.log_level)
logger = get_logger("devmentor")

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Autonomous CS learning, competitive-programming, and developer companion.",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Consistent error envelopes
errors.register_exception_handlers(app)

# CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
for router in (
    health.router,
    me.router,
    dashboard.router,
    courses.router,
    deadlines.router,
    tasks.router,
    snippets.router,
    notifications.router,
    quiz.router,
    cp.router,
    chat.router,
    dev_tools.router,
    focus.router,
    analytics.router,
    cron_routes.router,
):
    app.include_router(router)


@app.get("/", tags=["health"])
def root() -> dict:
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
        "demo_mode": settings.effective_demo_mode,
    }


@app.on_event("startup")
async def _startup() -> None:
    mode = "DEMO (in-memory, no secrets)" if settings.effective_demo_mode else "LIVE (Supabase)"
    logger.info("DevMentor AI API starting in %s mode", mode)
