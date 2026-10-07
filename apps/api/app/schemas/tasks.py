from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# ---------------- Courses ----------------
class CourseIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=160)
    code: str | None = Field(None, max_length=40)
    difficulty: str | None = Field(None, pattern=r"^(easy|medium|hard)$")
    color: str | None = Field(None, max_length=16)
    active: bool = True


class CourseUpdate(BaseModel):
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


class DeadlineIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    course_id: str | None = None
    title: str = Field(min_length=1, max_length=200)
    type: str = Field(pattern=DEADLINE_TYPE)
    due_at: datetime
    priority: int = Field(3, ge=1, le=5)
    notes: str | None = None


class DeadlineUpdate(BaseModel):
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


class TaskIn(BaseModel):
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


class TaskUpdate(BaseModel):
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


class TaskReschedule(BaseModel):
    scheduled_start: datetime
    scheduled_end: datetime | None = None


class GeneratePlanRequest(BaseModel):
    """Options for the daily/weekly planner."""
    date: datetime | None = None       # defaults to 'today' in the user's tz
    replace_existing: bool = False
