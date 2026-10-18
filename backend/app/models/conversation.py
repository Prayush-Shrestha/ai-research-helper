"""Research conversation and message models for persistent RAG chat."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


MESSAGE_ROLES = ("user", "assistant")


class ResearchConversation(Base):
    """A persistent chat session between a user and the RAG assistant."""

    __tablename__ = "research_conversations"
    __table_args__ = (
        Index("ix_research_conversations_owner_id", "owner_id"),
        Index("ix_research_conversations_updated_at", "updated_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: uuid.uuid4().hex
    )
    owner_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    # Document IDs in scope for this conversation (JSON array of strings).
    document_ids: Mapped[str] = mapped_column(
        Text, nullable=False, server_default="[]"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    owner: Mapped["User"] = relationship(back_populates="conversations")
    messages: Mapped[list["ResearchMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"ResearchConversation(id={self.id!r}, title={self.title!r})"


class ResearchMessage(Base):
    """One message within a research conversation."""

    __tablename__ = "research_messages"
    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'assistant')",
            name="ck_research_messages_role",
        ),
        Index("ix_research_messages_conversation_id", "conversation_id"),
        Index("ix_research_messages_created_at", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: uuid.uuid4().hex
    )
    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("research_conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # Citations used by assistant messages (JSON array of citation dicts).
    citations: Mapped[str] = mapped_column(
        Text, nullable=False, server_default="[]"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    conversation: Mapped["ResearchConversation"] = relationship(
        back_populates="messages"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"ResearchMessage(id={self.id!r}, role={self.role!r})"
