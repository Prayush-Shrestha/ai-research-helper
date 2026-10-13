"""Document model — one row per uploaded research file."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.note import ResearchNote
    from app.models.user import User


FILE_TYPES = ("PDF", "DOCX")
EXTRACTION_STATUSES = ("pending", "processing", "completed", "failed", "requires_ocr")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint(
            "file_type IN ('PDF', 'DOCX')", name="ck_documents_file_type"
        ),
        CheckConstraint(
            "extraction_status IN "
            "('pending', 'processing', 'completed', 'failed', 'requires_ocr')",
            name="ck_documents_extraction_status",
        ),
        Index("ix_documents_owner_created", "owner_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: uuid.uuid4().hex
    )
    owner_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    # Internal storage key (random filename). Never exposed to clients and
    # never derived from user input, so path traversal is impossible.
    storage_key: Mapped[str] = mapped_column(
        String(128), unique=True, nullable=False
    )
    # Extracted plain text kept for reading now and RAG indexing later.
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    extraction_status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )
    extraction_error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    owner: Mapped["User"] = relationship(back_populates="documents")
    # Deleting a document deletes its notes; the service also deletes the file.
    notes: Mapped[list["ResearchNote"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )
