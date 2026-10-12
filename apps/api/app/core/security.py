"""Authentication: verify Supabase-issued JWTs (HS256) and model the caller.

In demo mode we skip verification and return a fixed demo user so the
whole API is usable locally with no credentials.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx
import jwt
from fastapi import HTTPException, status

from .config import get_settings

logger = logging.getLogger("devmentor.auth")

# Stable UUID used for the stubbed demo user across the app.
DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"


@dataclass
class AuthUser:
    id: str
    email: str | None = None
    access_token: str | None = None
    is_demo: bool = False


def demo_user() -> AuthUser:
    return AuthUser(id=DEMO_USER_ID, email="demo@devmentor.ai", is_demo=True)


def decode_token(token: str) -> AuthUser:
    """Verify a Supabase access token and return the authenticated user."""
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is not configured on the server.",
        )
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token has expired.")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid authentication token.")

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token is missing a subject.")
    return AuthUser(id=sub, email=payload.get("email"), access_token=token)


def verify_supabase_token(token: str) -> AuthUser:
    """Validate a token by asking Supabase's auth server directly.

    Works regardless of how the project signs user JWTs (legacy HS256 or the
    newer asymmetric signing keys), so it is immune to a mismatched/absent
    SUPABASE_JWT_SECRET.
    """
    settings = get_settings()
    base = (settings.supabase_url or "").strip().rstrip("/")
    anon = (settings.supabase_anon_key or "").strip()
    if not (base and anon):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Auth is not configured.")
    try:
        resp = httpx.get(
            f"{base}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": anon},
            timeout=10.0,
        )
    except Exception as exc:  # pragma: no cover - network error
        logger.warning("Supabase auth check could not reach %s: %r", base, exc)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Auth service unreachable.")
    if resp.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid authentication token.")
    data = resp.json()
    uid = data.get("id")
    if not uid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token is missing a user id.")
    return AuthUser(id=uid, email=data.get("email"), access_token=token)


def resolve_supabase_user(token: str) -> AuthUser:
    """Fast local HS256 check first (legacy projects); if that fails, fall back
    to asking Supabase to validate (covers asymmetric signing / wrong secret)."""
    settings = get_settings()
    if settings.supabase_jwt_secret:
        try:
            return decode_token(token)
        except HTTPException:
            pass
    return verify_supabase_token(token)
