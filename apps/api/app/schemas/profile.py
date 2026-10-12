from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

LANG = r"^(en|bn|bilingual)$"
LEVEL = r"^(beginner|intermediate|advanced)$"
HHMM = r"^([01]\d|2[0-3]):[0-5]\d$"


class ScheduleSlot(BaseModel):
    model_config = ConfigDict(extra="forbid")
    start: str = Field(pattern=HHMM)
    end: str = Field(pattern=HHMM)

    @model_validator(mode="after")
    def chronological(self):
        if self.end <= self.start:
            raise ValueError("A schedule slot must end after it starts.")
        return self


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
    available_schedule: dict[str, list[ScheduleSlot]] | None = None
    interests: list[str] | None = None
    goals: list[str] | None = None
    codeforces_handle: str | None = Field(None, max_length=64)
    quiet_hours_start: str | None = Field(None, pattern=HHMM)
    quiet_hours_end: str | None = Field(None, pattern=HHMM)
    onboarding_completed: bool | None = None


    @model_validator(mode="before")
    @classmethod
    def reject_null_required(cls, value):
        required = {"preferred_language", "timezone", "current_level", "weekly_study_goal_minutes",
                    "available_schedule", "interests", "goals", "onboarding_completed"}
        if isinstance(value, dict) and any(k in value and value[k] is None for k in required):
            raise ValueError("Required profile fields cannot be null.")
        return value

    @field_validator("timezone")
    @classmethod
    def timezone_exists(cls, value):
        if value is not None:
            try:
                ZoneInfo(value)
            except (ZoneInfoNotFoundError, ValueError):
                raise ValueError("Use a valid IANA timezone.")
        return value

    @field_validator("available_schedule")
    @classmethod
    def schedule_valid(cls, value):
        if value is None:
            return value
        if set(value) - {"mon", "tue", "wed", "thu", "fri", "sat", "sun"}:
            raise ValueError("Unknown weekday.")
        for slots in value.values():
            ordered = sorted(slots, key=lambda slot: slot.start)
            if any(a.end > b.start for a, b in zip(ordered, ordered[1:])):
                raise ValueError("Schedule slots cannot overlap.")
        return value
