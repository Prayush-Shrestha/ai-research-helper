"""Phase 3 models: collections, knowledge graph entities/relationships,
activity logs, and audit logs."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Float,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.document import Document
    from app.models.document_chunk import DocumentChunk
    from app.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ResearchCollection(Base):
    """A user-owned collection/project of research documents."""

    __tablename__ = "research_collections"
    __table_args__ = (
        Index("ix_research_collections_updated_at", "updated_at"),
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
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    owner: Mapped["User"] = relationship(back_populates="collections")
    documents: Mapped[list["CollectionDocument"]] = relationship(
        back_populates="collection", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"ResearchCollection(id={self.id!r}, name={self.name!r})"


class CollectionDocument(Base):
    """Join table: a document inside a research collection."""

    __tablename__ = "collection_documents"
    __table_args__ = (
        Index("ix_collection_documents_collection_id", "collection_id"),
        Index("ix_collection_documents_document_id", "document_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: uuid.uuid4().hex
    )
    collection_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("research_collections.id", ondelete="CASCADE"),
        nullable=False,
    )
    document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    collection: Mapped["ResearchCollection"] = relationship(
        back_populates="documents"
    )
    document: Mapped["Document"] = relationship()

    def __repr__(self) -> str:  # pragma: no cover
        return f"CollectionDocument(collection_id={self.collection_id!r}, document_id={self.document_id!r})"


class KnowledgeEntity(Base):
    """An extracted entity (person, organization, technology, concept, ...)
    with traceability back to its source document/chunk/page."""

    __tablename__ = "knowledge_entities"
    __table_args__ = (
        Index("ix_knowledge_entities_entity_type", "entity_type"),
        Index("ix_knowledge_entities_source_document", "source_document_id"),
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
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Source traceability
    source_document_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_chunk_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("document_chunks.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_text_snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.5, server_default="0.5"
    )
    is_inferred: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    owner: Mapped["User"] = relationship()
    source_document: Mapped["Document | None"] = relationship(
        foreign_keys=[source_document_id]
    )
    source_chunk: Mapped["DocumentChunk | None"] = relationship(
        foreign_keys=[source_chunk_id]
    )
    relationships_as_source: Mapped[list["KnowledgeRelationship"]] = relationship(
        back_populates="source_entity",
        foreign_keys="KnowledgeRelationship.source_entity_id",
        cascade="all, delete-orphan",
    )
    relationships_as_target: Mapped[list["KnowledgeRelationship"]] = relationship(
        back_populates="target_entity",
        foreign_keys="KnowledgeRelationship.target_entity_id",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"KnowledgeEntity(id={self.id!r}, name={self.name!r}, type={self.entity_type!r})"


class KnowledgeRelationship(Base):
    """A relationship between two knowledge entities, with confidence and
    source traceability."""

    __tablename__ = "knowledge_relationships"
    __table_args__ = (
        Index("ix_knowledge_relationships_source_entity", "source_entity_id"),
        Index("ix_knowledge_relationships_target_entity", "target_entity_id"),
        Index("ix_knowledge_relationships_source_document", "source_document_id"),
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
    source_entity_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("knowledge_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_entity_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("knowledge_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    relationship_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.5, server_default="0.5"
    )
    is_inferred: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    # Source traceability for the relationship itself
    source_document_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_chunk_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("document_chunks.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_text_snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    owner: Mapped["User"] = relationship()
    source_entity: Mapped["KnowledgeEntity"] = relationship(
        foreign_keys=[source_entity_id],
        back_populates="relationships_as_source",
    )
    target_entity: Mapped["KnowledgeEntity"] = relationship(
        foreign_keys=[target_entity_id],
        back_populates="relationships_as_target",
    )
    source_document: Mapped["Document | None"] = relationship(
        foreign_keys=[source_document_id]
    )
    source_chunk: Mapped["DocumentChunk | None"] = relationship(
        foreign_keys=[source_chunk_id]
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"KnowledgeRelationship(id={self.id!r}, "
            f"type={self.relationship_type!r}, confidence={self.confidence})"
        )


class ActivityLog(Base):
    """Per-user activity history. Only metadata is stored — never document
    contents, passwords, or session tokens."""

    __tablename__ = "activity_logs"
    __table_args__ = (
        Index("ix_activity_logs_action", "action"),
        Index("ix_activity_logs_created_at", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: uuid.uuid4().hex
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    action: Mapped[str] = mapped_column(String(60), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    log_metadata: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    user: Mapped["User"] = relationship()

    def __repr__(self) -> str:  # pragma: no cover
        return f"ActivityLog(id={self.id!r}, action={self.action!r}, user_id={self.user_id!r})"


class AuditLog(Base):
    """Security-sensitive administrative actions. Append-only; restricted
    to authorized administrators."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: uuid.uuid4().hex
    )
    admin_user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    target_user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    action: Mapped[str] = mapped_column(String(60), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    log_metadata: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    admin_user: Mapped["User"] = relationship(
        foreign_keys=[admin_user_id]
    )
    target_user: Mapped["User | None"] = relationship(
        foreign_keys=[target_user_id]
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"AuditLog(id={self.id!r}, action={self.action!r}, admin_id={self.admin_user_id!r})"
