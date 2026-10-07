"""Shared FastAPI dependencies: auth, store, pagination."""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, Query, status

from ..core.config import get_settings
from ..core.security import AuthUser, decode_token, demo_user
from ..core.store import Store, get_store_for_user


async def get_current_user(authorization: str | None = Header(default=None)) -> AuthUser:
    """Resolve the caller from a Supabase bearer token.

    In demo mode (no Supabase configured) we return a fixed demo user so
    the API is usable without credentials. A real, verifiable token is
    always honoured when the JWT secret is set.
    """
    settings = get_settings()
    token: str | None = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    if token and settings.supabase_jwt_secret:
        return decode_token(token)
    if settings.effective_demo_mode:
        return demo_user()
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid Authorization header.",
    )


def get_store(user: AuthUser = Depends(get_current_user)) -> Store:
    return get_store_for_user(user)


@dataclass
class Pagination:
    limit: int
    offset: int


def pagination(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Pagination:
    return Pagination(limit=limit, offset=offset)
