"""DocumentChunk model — one embedded chunk of a research document."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.document import Document
    from app.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


CHUNK_STATUSES = ("pending", "processing", "completed", "failed")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    __table_args__ = (
        CheckConstraint(
            "chunk_status IN ('pending', 'processing', 'completed', 'failed')",
            name="ck_document_chunks_chunk_status",
        ),
        Index("ix_document_chunks_document_id", "document_id"),
        Index("ix_document_chunks_owner_id", "owner_id"),
        Index("ix_document_chunks_chunk_status", "chunk_status"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: uuid.uuid4().hex
    )
    document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    owner_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_char: Mapped[int | None] = mapped_column(Integer, nullable=True)
    end_char: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # JSON-serialized embedding vector (cross-database compatible).
    # On PostgreSQL + pgvector this can be migrated to vector type later.
    embedding_vector: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    chunk_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default="pending"
    )
    chunk_error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    document: Mapped["Document"] = relationship(back_populates="chunks")
    owner: Mapped["User"] = relationship(back_populates="chunks")

    def __repr__(self) -> str:  # pragma: no cover
        return f"DocumentChunk(id={self.id!r}, document_id={self.document_id!r}, chunk_index={self.chunk_index})"
