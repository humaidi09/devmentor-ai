"""Shared schema types."""
from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """Standard paginated list response."""
    items: list[T]
    limit: int
    offset: int
    count: int


class Message(BaseModel):
    message: str
