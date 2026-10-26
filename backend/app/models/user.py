"""User model — one row per registered account."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.ai_usage import AIUsage
    from app.models.conversation import ResearchConversation
    from app.models.document import Document
    from app.models.document_chunk import DocumentChunk
    from app.models.note import ResearchNote
    from app.models.phase3 import ResearchCollection


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


ADMIN_ROLE = "admin"
USER_ROLE = "user"


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            f"role IN ('{USER_ROLE}', '{ADMIN_ROLE}')", name="ck_users_role"
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: uuid.uuid4().hex
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(320), unique=True, index=True, nullable=False
    )
    # Argon2 hash. Plaintext passwords are never stored anywhere.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    # "user" by default; "admin" unlocks the /api/v1/admin console.
    role: Mapped[str] = mapped_column(
        String(10), nullable=False, default=USER_ROLE, server_default=USER_ROLE
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )
    # When they last signed in — admin console shows this so you can tell
    # who's been active and who's gone quiet. Nullable because older
    # accounts (created before this column existed) never logged in after it.
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Deleting a user removes their documents, notes, and (via the document
    # service) their stored files.
    documents: Mapped[list["Document"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    notes: Mapped[list["ResearchNote"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    conversations: Mapped[list["ResearchConversation"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    ai_usage: Mapped[list["AIUsage"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    collections: Mapped[list["ResearchCollection"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover - never logs secrets
        return f"User(id={self.id!r}, email={self.email!r})"

    @property
    def is_admin(self) -> bool:
        return self.role == ADMIN_ROLE
