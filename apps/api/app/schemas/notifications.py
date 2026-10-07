from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NotificationOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    type: str
    title: str
    body: str | None = None
    channel: str
    scheduled_at: datetime | None = None
    sent_at: datetime | None = None
    read_at: datetime | None = None
    status: str
    metadata: dict = Field(default_factory=dict)
    created_at: datetime | None = None


class NotificationPreferences(BaseModel):
    """Stored inside profiles.metadata-style settings; validated here."""
    model_config = ConfigDict(extra="forbid")
    in_app_enabled: bool = True
    email_enabled: bool = False
    push_enabled: bool = False
    quiet_hours_start: str | None = Field(None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    quiet_hours_end: str | None = Field(None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    daily_summary: bool = True
    weekly_summary: bool = True
    cp_reminders: bool = True
    max_per_day: int = Field(6, ge=1, le=20)


class PushSubscription(BaseModel):
    model_config = ConfigDict(extra="forbid")
    token: str
    platform: str = "web"
