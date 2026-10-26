"""Activity logging service — records per-user activity history.

Only metadata is stored: action type, entity type/id, optional JSON
metadata, IP address, and user agent. Never document contents, passwords,
or session tokens.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.phase3 import ActivityLog
from app.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def record(
    db: Session,
    *,
    user: User,
    action: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
    metadata: dict[str, Any] | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    commit: bool = True,
) -> ActivityLog:
    """Record one activity log entry. Safe to call repeatedly."""
    import json

    log = ActivityLog(
        user_id=user.id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        log_metadata=json.dumps(metadata) if metadata else None,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log)
    if commit:
        db.commit()
        db.refresh(log)
    return log


def list_activity_logs(
    db: Session,
    user: User,
    *,
    action: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[ActivityLog], int]:
    """List activity logs for a user, paginated."""
    from sqlalchemy import func, select

    stmt = select(ActivityLog).where(ActivityLog.user_id == user.id)
    if action:
        stmt = stmt.where(ActivityLog.action == action)
    total = db.scalar(
        select(func.count()).select_from(stmt.subquery())
    ) or 0
    items = list(
        db.scalars(
            stmt.order_by(ActivityLog.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )
    return items, total
