from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuizGenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    topic: str = Field(min_length=1, max_length=60)
    count: int = Field(3, ge=1, le=10)
    seed: int | None = None


class QuizQuestionOut(BaseModel):
    """A question sent to the client — deliberately WITHOUT the answer."""
    id: str
    topic: str
    question: str
    options: list[str]


class QuizAttemptIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    topic: str = Field(min_length=1, max_length=60)
    question_id: str
    answer_index: int = Field(ge=0, le=10)


class QuizAttemptOut(BaseModel):
    correct: bool
    correct_index: int
    explanation: str | None = None
    score: float


class QuizAttemptRow(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    topic: str | None = None
    question: str | None = None
    correct: bool | None = None
    score: float | None = None
    created_at: datetime | None = None
