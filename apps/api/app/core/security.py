"""Authentication: verify Supabase-issued JWTs (HS256) and model the caller.

In demo mode we skip verification and return a fixed demo user so the
whole API is usable locally with no credentials.
"""
from __future__ import annotations

from dataclasses import dataclass

import jwt
from fastapi import HTTPException, status

from .config import get_settings

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
