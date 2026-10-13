"""Dashboard response schemas — every number comes from a DB query."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.schemas.document import DocumentOut
from app.schemas.note import NoteOut


class DashboardCounts(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_documents: int
    pdf_count: int
    docx_count: int
    total_notes: int


class DashboardOut(BaseModel):
    counts: DashboardCounts
    recent_documents: list[DocumentOut]
    recently_updated: list[DocumentOut]
    recent_notes: list[NoteOut]
