from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

class ValidatedFields(BaseModel):
    @model_validator(mode="before")
    @classmethod
    def validate_required_and_times(cls, data):
        if isinstance(data, dict):
            required = {"title", "active", "type", "due_at", "priority", "status", "task_type", "metadata"}
            if any(k in data and data[k] is None for k in required):
                raise ValueError("Required fields cannot be null.")
        return data

    @model_validator(mode="after")
    def chronological(self):
        start, end = getattr(self, "scheduled_start", None), getattr(self, "scheduled_end", None)
        for value in (start, end, getattr(self, "due_at", None)):
            if value is not None and value.tzinfo is None:
                raise ValueError("Include a timezone offset with date/time values.")
        if start and end and end <= start:
            raise ValueError("End must be after start.")
        return self


# ---------------- Courses ----------------
class CourseIn(ValidatedFields):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=160)
    code: str | None = Field(None, max_length=40)
    difficulty: str | None = Field(None, pattern=r"^(easy|medium|hard)$")
    color: str | None = Field(None, max_length=16)
    active: bool = True


class CourseUpdate(ValidatedFields):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(None, min_length=1, max_length=160)
    code: str | None = None
    difficulty: str | None = Field(None, pattern=r"^(easy|medium|hard)$")
    color: str | None = None
    active: bool | None = None


class CourseOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    code: str | None = None
    difficulty: str | None = None
    color: str | None = None
    active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


# ---------------- Deadlines ----------------
DEADLINE_TYPE = r"^(exam|assignment|quiz|project|interview)$"


class DeadlineIn(ValidatedFields):
    model_config = ConfigDict(extra="forbid")
    course_id: str | None = None
    title: str = Field(min_length=1, max_length=200)
    type: str = Field(pattern=DEADLINE_TYPE)
    due_at: datetime
    priority: int = Field(3, ge=1, le=5)
    notes: str | None = None


class DeadlineUpdate(ValidatedFields):
    model_config = ConfigDict(extra="forbid")
    course_id: str | None = None
    title: str | None = None
    type: str | None = Field(None, pattern=DEADLINE_TYPE)
    due_at: datetime | None = None
    priority: int | None = Field(None, ge=1, le=5)
    notes: str | None = None
    status: str | None = Field(None, pattern=r"^(pending|completed|missed|cancelled)$")


class DeadlineOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    course_id: str | None = None
    title: str
    type: str
    due_at: datetime
    priority: int
    notes: str | None = None
    status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


# ---------------- Tasks ----------------
TASK_TYPE = r"^(study|cp|revision|quiz|project|focus|rest)$"
TASK_STATUS = r"^(pending|in_progress|completed|skipped|rescheduled)$"


class TaskIn(ValidatedFields):
    model_config = ConfigDict(extra="forbid")
    course_id: str | None = None
    deadline_id: str | None = None
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    task_type: str = Field("study", pattern=TASK_TYPE)
    topic: str | None = None
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    estimated_minutes: int | None = Field(None, ge=0, le=1440)
    priority: int = Field(3, ge=1, le=5)
    metadata: dict = Field(default_factory=dict)


class TaskUpdate(ValidatedFields):
    model_config = ConfigDict(extra="forbid")
    course_id: str | None = None
    deadline_id: str | None = None
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    task_type: str | None = Field(None, pattern=TASK_TYPE)
    topic: str | None = None
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    estimated_minutes: int | None = Field(None, ge=0, le=1440)
    actual_minutes: int | None = Field(None, ge=0, le=1440)
    priority: int | None = Field(None, ge=1, le=5)
    status: str | None = Field(None, pattern=TASK_STATUS)
    metadata: dict | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    course_id: str | None = None
    deadline_id: str | None = None
    title: str
    description: str | None = None
    task_type: str
    topic: str | None = None
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    estimated_minutes: int | None = None
    actual_minutes: int | None = None
    priority: int
    status: str
    completion_note: str | None = None
    skip_reason: str | None = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TaskComplete(BaseModel):
    completion_note: str | None = None
    actual_minutes: int | None = Field(None, ge=0, le=1440)


class TaskSkip(BaseModel):
    skip_reason: str | None = None


class TaskReschedule(ValidatedFields):
    scheduled_start: datetime
    scheduled_end: datetime | None = None


class GeneratePlanRequest(BaseModel):
    """Options for the daily/weekly planner."""
    date: datetime | None = None       # defaults to 'today' in the user's tz
    replace_existing: bool = False
