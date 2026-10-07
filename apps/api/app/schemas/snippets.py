from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SnippetIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=160)
    description: str | None = None
    language: str = Field(min_length=1, max_length=40)
    category: str = Field(min_length=1, max_length=60)
    code: str = Field(min_length=1)
    notes: str | None = None
    tags: list[str] = Field(default_factory=list)
    visibility: str = Field("private", pattern=r"^(public|private)$")


class SnippetUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(None, min_length=1, max_length=160)
    description: str | None = None
    language: str | None = None
    category: str | None = None
    code: str | None = None
    notes: str | None = None
    tags: list[str] | None = None
    visibility: str | None = Field(None, pattern=r"^(public|private)$")


class SnippetOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    owner_id: str | None = None
    visibility: str
    title: str
    description: str | None = None
    language: str
    category: str
    code: str
    notes: str | None = None
    tags: list[str] = Field(default_factory=list)
    usage_count: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None
    is_owner: bool = False
