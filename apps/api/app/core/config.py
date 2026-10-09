"""Application settings loaded from environment variables.

Everything is optional: with no secrets set the API runs in DEMO_MODE
with a stubbed user and an in-memory data store.
"""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- App ---
    app_name: str = "DevMentor AI API"
    environment: str = "development"
    log_level: str = "INFO"
    demo_mode: bool = True
    api_cors_origins: str = "http://localhost:3000"
    # Any origin matching this regex is also allowed (covers all Vercel
    # production + preview deployments without listing each one).
    api_cors_origin_regex: str = r"https://.*\.vercel\.app"
    cron_secret: str = "change-me"

    # --- Supabase ---
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_jwt_secret: str | None = None

    # --- Gemini ---
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"

    # --- Email (Resend) ---
    resend_api_key: str | None = None
    email_from: str = "DevMentor AI <onboarding@resend.dev>"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.api_cors_origins.split(",") if o.strip()]

    @property
    def supabase_configured(self) -> bool:
        """True when the backend can talk to a real Supabase project."""
        return bool(
            self.supabase_url
            and self.supabase_anon_key
            and self.supabase_service_role_key
            and self.supabase_jwt_secret
        )

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def effective_demo_mode(self) -> bool:
        """Demo mode is on if explicitly set, or if Supabase isn't configured."""
        return self.demo_mode or not self.supabase_configured


@lru_cache
def get_settings() -> Settings:
    return Settings()
