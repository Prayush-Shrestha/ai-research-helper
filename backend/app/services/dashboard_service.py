"""Dashboard statistics — every number is a live database query."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.note import ResearchNote
from app.models.user import User
from app.schemas.dashboard import DashboardCounts, DashboardOut
from app.schemas.document import DocumentOut
from app.services import notes_service


def get_dashboard(db: Session, owner: User) -> DashboardOut:
    total = (
        db.scalar(
            select(func.count())
            .select_from(Document)
            .where(Document.owner_id == owner.id)
        )
        or 0
    )
    pdf_count = (
        db.scalar(
            select(func.count())
            .select_from(Document)
            .where(Document.owner_id == owner.id, Document.file_type == "PDF")
        )
        or 0
    )
    docx_count = (
        db.scalar(
            select(func.count())
            .select_from(Document)
            .where(Document.owner_id == owner.id, Document.file_type == "DOCX")
        )
        or 0
    )
    notes_total = (
        db.scalar(
            select(func.count())
            .select_from(ResearchNote)
            .where(ResearchNote.owner_id == owner.id)
        )
        or 0
    )
    recent = list(
        db.scalars(
            select(Document)
            .where(Document.owner_id == owner.id)
            .order_by(Document.created_at.desc())
            .limit(5)
        ).all()
    )
    updated = list(
        db.scalars(
            select(Document)
            .where(Document.owner_id == owner.id)
            .order_by(Document.updated_at.desc())
            .limit(5)
        ).all()
    )
    recent_notes, _ = notes_service.list_notes(db, owner, page=1, page_size=5)
    return DashboardOut(
        counts=DashboardCounts(
            total_documents=total,
            pdf_count=pdf_count,
            docx_count=docx_count,
            total_notes=notes_total,
        ),
        recent_documents=[DocumentOut.model_validate(d) for d in recent],
        recently_updated=[DocumentOut.model_validate(d) for d in updated],
        recent_notes=recent_notes,
    )
