"""Shared Pydantic building blocks (pagination, messages)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class MessageOut(BaseModel):
    detail: str


class PageOut(BaseModel):
    """Envelope for every paginated list endpoint."""

    model_config = ConfigDict(from_attributes=True)

    total: int
    page: int
    page_size: int
