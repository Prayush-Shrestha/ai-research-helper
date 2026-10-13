"""Document request/response schemas.

The list endpoint never returns full extracted text; fetch one document
(GET) or its text (GET /text) for that.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PageOut


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    original_filename: str
    file_type: str
    file_size: int
    page_count: int | None
    extraction_status: str
    extraction_error: str | None
    created_at: datetime
    updated_at: datetime


class DocumentDetailOut(DocumentOut):
    extracted_text: str | None


class DocumentTextOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    extraction_status: str
    extracted_text: str | None


class DocumentListOut(PageOut):
    items: list[DocumentOut]


class RenameDocumentIn(BaseModel):
    title: str = Field(min_length=1, max_length=300)
