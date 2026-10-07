from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ReviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(min_length=1, max_length=20000)
    language: str = Field("python", max_length=40)
    want_rewrite: bool = False


class ReviewResponse(BaseModel):
    review: str
    language: str
    mocked: bool = False


class RoadmapRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    idea: str = Field(min_length=3, max_length=4000)
    stack_preference: str | None = Field(None, max_length=200)


class RoadmapResponse(BaseModel):
    roadmap: str
    mocked: bool = False
