from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

LANG = r"^(en|bn|bilingual)$"
LEVEL = r"^(beginner|intermediate|advanced)$"
HHMM = r"^([01]\d|2[0-3]):[0-5]\d$"


class ProfileOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    display_name: str | None = None
    preferred_language: str = "en"
    timezone: str = "Asia/Dhaka"
    current_level: str = "beginner"
    weekly_study_goal_minutes: int = 600
    available_schedule: dict = Field(default_factory=dict)
    interests: list = Field(default_factory=list)
    goals: list = Field(default_factory=list)
    codeforces_handle: str | None = None
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None
    onboarding_completed: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    display_name: str | None = Field(None, max_length=120)
    preferred_language: str | None = Field(None, pattern=LANG)
    timezone: str | None = None
    current_level: str | None = Field(None, pattern=LEVEL)
    weekly_study_goal_minutes: int | None = Field(None, ge=0, le=10080)
    available_schedule: dict | None = None
    interests: list | None = None
    goals: list | None = None
    codeforces_handle: str | None = Field(None, max_length=64)
    quiet_hours_start: str | None = Field(None, pattern=HHMM)
    quiet_hours_end: str | None = Field(None, pattern=HHMM)
    onboarding_completed: bool | None = None
