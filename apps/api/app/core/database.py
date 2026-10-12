"""Supabase client factories.

- get_service_client(): bypasses RLS. Used ONLY by cron/admin code.
- get_user_client(token): scoped to the user's JWT so Postgres RLS
  policies apply to every query. Used for all per-request access.
"""
from __future__ import annotations

from fastapi import HTTPException
from functools import lru_cache
from typing import Any

from .config import get_settings
from .logging import get_logger

logger = get_logger(__name__)

try:  # supabase-py is optional at import time (not needed in demo mode)
    from supabase import Client, create_client
except Exception:  # pragma: no cover - only hit when dependency missing
    Client = Any  # type: ignore
    create_client = None  # type: ignore


@lru_cache
def get_service_client() -> "Client | None":
    settings = get_settings()
    if settings.effective_demo_mode:
        return None
    if not settings.supabase_configured or create_client is None:
        raise HTTPException(503, "Live database configuration is incomplete.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)  # type: ignore[arg-type]


def get_user_client(access_token: str | None) -> "Client | None":
    """A Supabase client whose PostgREST requests carry the user's JWT,
    so Row Level Security is enforced by the database."""
    settings = get_settings()
    if not (settings.supabase_url and settings.supabase_anon_key) or create_client is None:
        raise HTTPException(503, "Live database configuration is incomplete.")
    client = create_client(settings.supabase_url, settings.supabase_anon_key)  # type: ignore[arg-type]
    if not access_token:
        raise HTTPException(401, "Sign in to access your data.")
    client.postgrest.auth(access_token)
    return client
