"""Audit logging service — security-sensitive admin actions.

Append-only log for role changes, account disabling/reactivation,
admin logins, and other administrative actions. Restricted to authorized
administrators.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.phase3 import AuditLog
from app.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def record(
    db: Session,
    *,
    admin_user: User,
    action: str,
    target_user: User | None = None,
    description: str | None = None,
    metadata: dict[str, Any] | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    commit: bool = True,
) -> AuditLog:
    """Record one audit log entry."""
    import json

    log = AuditLog(
        admin_user_id=admin_user.id,
        target_user_id=target_user.id if target_user else None,
        action=action,
        description=description,
        log_metadata=json.dumps(metadata) if metadata else None,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log)
    if commit:
        db.commit()
        db.refresh(log)
    return log


def list_audit_logs(
    db: Session,
    *,
    admin_user_id: str | None = None,
    target_user_id: str | None = None,
    action: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[AuditLog], int]:
    """List audit logs with optional filters, paginated."""
    from sqlalchemy import func, select

    stmt = select(AuditLog)
    if admin_user_id:
        stmt = stmt.where(AuditLog.admin_user_id == admin_user_id)
    if target_user_id:
        stmt = stmt.where(AuditLog.target_user_id == target_user_id)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    total = db.scalar(
        select(func.count()).select_from(stmt.subquery())
    ) or 0
    items = list(
        db.scalars(
            stmt.order_by(AuditLog.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )
    return items, total
