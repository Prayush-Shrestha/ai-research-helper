"""AI usage tracking model — per-user AI request cost control."""

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
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


AI_USAGE_OPERATIONS = ("embedding", "llm")


class AIUsage(Base):
    """One recorded AI operation (embedding or LLM call) for a user."""

    __tablename__ = "ai_usage"
    __table_args__ = (
        CheckConstraint(
            "operation_type IN ('embedding', 'llm')",
            name="ck_ai_usage_operation_type",
        ),
        Index("ix_ai_usage_owner_id", "owner_id"),
        Index("ix_ai_usage_created_at", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: uuid.uuid4().hex
    )
    owner_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    operation_type: Mapped[str] = mapped_column(String(30), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    tokens_estimate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost_estimate_usd: Mapped[float | None] = mapped_column(
        Numeric(10, 6), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    owner: Mapped["User"] = relationship(back_populates="ai_usage")

    def __repr__(self) -> str:  # pragma: no cover
        return f"AIUsage(id={self.id!r}, op={self.operation_type!r}, provider={self.provider!r})"
