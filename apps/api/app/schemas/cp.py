from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CPPreferencesIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    morning_time: str = Field("10:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    evening_time: str = Field("20:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    problems_per_session: int = Field(2, ge=1, le=10)
    min_rating: int = Field(800, ge=0, le=4000)
    max_rating: int = Field(1200, ge=0, le=4000)
    preferred_tags: list[str] = Field(default_factory=list)
    weak_tags: list[str] = Field(default_factory=list)
    notifications_enabled: bool = True
    contest_reminders_enabled: bool = True


class CPPreferencesOut(CPPreferencesIn):
    model_config = ConfigDict(extra="ignore")
    id: str | None = None


class CPRecommendationOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    recommendation_date: str | None = None
    session: str
    contest_id: int | None = None
    problem_contest_id: int | None = None
    problem_index: str | None = None
    problem_name: str | None = None
    problem_rating: int | None = None
    tags: list[str] = Field(default_factory=list)
    problem_url: str | None = None
    status: str
    source_reason: str | None = None
    created_at: datetime | None = None


class CPRecommendationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str = Field(pattern=r"^(suggested|started|attempted|solved|skipped)$")


class CPProfileOut(BaseModel):
    """Public Codeforces profile summary (fetched from CF API in Phase 3)."""
    handle: str
    rating: int | None = None
    max_rating: int | None = None
    rank: str | None = None
    solved_count: int | None = None
    synced_at: datetime | None = None
