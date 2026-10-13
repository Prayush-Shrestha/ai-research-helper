"""Research-note request/response schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PageOut


class NoteCreateIn(BaseModel):
    title: str = Field(default="Untitled note", max_length=200)
    content: str = Field(default="", max_length=50_000)
    document_id: str | None = Field(default=None, max_length=36)


class NoteUpdateIn(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    content: str | None = Field(default=None, max_length=50_000)


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    content: str
    document_id: str | None
    document_title: str | None = None
    created_at: datetime
    updated_at: datetime


class NoteListOut(PageOut):
    items: list[NoteOut]
