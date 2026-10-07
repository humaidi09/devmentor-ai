from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str = Field(min_length=1, max_length=8000)
    conversation_id: str | None = None
    language: str | None = Field(None, pattern=r"^(en|bn|bilingual)$")


class SuggestedAction(BaseModel):
    label: str
    kind: str          # e.g. "create_task", "generate_plan", "cp_recommend"
    payload: dict = Field(default_factory=dict)


class ChatLink(BaseModel):
    label: str
    url: str


class ChatResponse(BaseModel):
    answer: str
    intent: str
    conversation_id: str | None = None
    actions_taken: list[str] = Field(default_factory=list)
    suggested_actions: list[SuggestedAction] = Field(default_factory=list)
    links: list[ChatLink] = Field(default_factory=list)
    mocked: bool = False
