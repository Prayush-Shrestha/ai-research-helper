"""Extended admin routes: account status, analytics, audit logs, settings."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_db,
    get_settings_dep,
    require_admin,
    require_same_origin,
)
from app.core.config import Settings
from app.models.document import Document
from app.models.phase3 import ActivityLog, AuditLog
from app.models.user import ADMIN_ROLE, USER_ROLE, User
from app.schemas.admin import AdminStatsOut
from app.schemas.phase3 import (
    AdminAnalyticsOut,
    AuditLogListOut,
    AuditLogOut,
    SystemHealthOut,
    UserStatusUpdateIn,
)
from app.services import audit_service

router = APIRouter(
    dependencies=[Depends(require_same_origin), Depends(require_admin)]
)

# ------------------------------------------------------------------
# Account status (disable/reactivate)
# ------------------------------------------------------------------


@router.get("/users/{user_id}/status")
def get_user_status(
    user_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Get a user's account status (role, active/inactive)."""
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
        )
    return {
        "id": target.id,
        "email": target.email,
        "role": target.role,
        "is_active": target.is_active,
        "created_at": target.created_at,
        "last_login_at": target.last_login_at,
    }


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: UserStatusUpdateIn,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Disable or reactivate a user account.

    Flips the real `is_active` column on the users table. Disabled accounts
    cannot log in and are rejected on every authenticated request
    (get_current_user checks is_active). The change is recorded in the
    audit log so there is an append-only trace of who disabled/reactivated
    which account and when.
    """
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
        )
    if target.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own account status.",
        )

    previous = target.is_active
    target.is_active = bool(payload.is_active)
    db.add(target)
    db.commit()
    db.refresh(target)

    # Record the audit event.
    action = "account_reactivated" if payload.is_active else "account_disabled"
    audit_service.record(
        db,
        admin_user=admin,
        target_user=target,
        action=action,
        description=(
            f"Account {target.email} {'reactivated' if payload.is_active else 'disabled'} "
            f"by administrator {admin.email}."
        ),
        metadata={
            "previous_is_active": previous,
            "new_is_active": payload.is_active,
        },
    )

    return {
        "id": target.id,
        "email": target.email,
        "role": target.role,
        "is_active": target.is_active,
        "detail": f"Account {'reactivated' if payload.is_active else 'disabled'}.",
    }


# ------------------------------------------------------------------
# Admin analytics (PostgreSQL-compatible: no julianday)
# ------------------------------------------------------------------


@router.get("/analytics", response_model=AdminAnalyticsOut)
def read_admin_analytics(
    db: Session = Depends(get_db),
) -> AdminAnalyticsOut:
    """System-level analytics for administrators.

    Every number is a live database query. Uses database-agnostic SQL
    (func.now() style) so it works on PostgreSQL and SQLite alike.
    """
    from app.models.ai_usage import AIUsage

    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    active_users = db.scalar(
        select(func.count()).select_from(User).where(User.is_active == True)  # noqa: E712
    ) or 0
    new_users_30d = db.scalar(
        select(func.count()).select_from(User).where(User.created_at >= thirty_days_ago)
    ) or 0
    total_documents = db.scalar(select(func.count()).select_from(Document)) or 0
    docs_uploaded_30d = db.scalar(
        select(func.count()).select_from(Document).where(Document.created_at >= thirty_days_ago)
    ) or 0

    processing_success = db.scalar(
        select(func.count()).select_from(Document).where(
            Document.extraction_status == "completed",
            Document.indexing_status == "completed",
        )
    ) or 0
    processing_failure = db.scalar(
        select(func.count()).select_from(Document).where(
            Document.extraction_status == "failed",
        )
    ) or 0

    ai_requests_30d = db.scalar(
        select(func.count()).select_from(AIUsage).where(AIUsage.created_at >= thirty_days_ago)
    ) or 0

    # Average processing latency (rough estimate from doc timestamps).
    # PostgreSQL: EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000
    # SQLite:     (julianday(updated_at) - julianday(created_at)) * 86400000
    # Use database-agnostic SQLAlchemy func to stay portable.
    bind = db.get_bind()
    if bind.dialect.name == "postgresql":
        latency_expr = (
            func.extract("epoch", Document.updated_at - Document.created_at) * 1000
        )
    else:
        latency_expr = (
            (func.julianday(Document.updated_at) - func.julianday(Document.created_at))
            * 86400000
        )

    avg_latency = db.scalar(
        select(func.avg(latency_expr)).select_from(Document).where(
            Document.indexing_status == "completed",
        )
    )

    return AdminAnalyticsOut(
        total_users=total_users,
        active_users=active_users,
        new_users_30d=new_users_30d,
        total_documents=total_documents,
        documents_uploaded_30d=docs_uploaded_30d,
        processing_success_count=processing_success,
        processing_failure_count=processing_failure,
        ai_requests_30d=ai_requests_30d,
        avg_processing_latency_ms=round(float(avg_latency), 2) if avg_latency else None,
        error_rate_percent=(
            round(processing_failure / max(total_documents, 1) * 100, 2)
            if total_documents > 0 else 0.0
        ),
    )


# ------------------------------------------------------------------
# Audit logs
# ------------------------------------------------------------------


@router.get("/audit", response_model=AuditLogListOut)
def read_audit_logs(
    admin_user_id: str | None = Query(default=None, max_length=36),
    target_user_id: str | None = Query(default=None, max_length=36),
    action: str | None = Query(default=None, max_length=60),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> AuditLogListOut:
    """List audit logs (admin only)."""
    items, total = audit_service.list_audit_logs(
        db,
        admin_user_id=admin_user_id,
        target_user_id=target_user_id,
        action=action,
        page=page,
        page_size=page_size,
    )
    # Enrich with emails.
    user_ids = {it.admin_user_id for it in items}
    user_ids.update({it.target_user_id for it in items if it.target_user_id})
    user_rows = list(
        db.scalars(select(User).where(User.id.in_(user_ids))).all()
    ) if user_ids else []
    email_map = {u.id: u.email for u in user_rows}

    return AuditLogListOut(
        total=total,
        page=page,
        page_size=page_size,
        items=[
            AuditLogOut(
                id=it.id,
                admin_user_id=it.admin_user_id,
                admin_email=email_map.get(it.admin_user_id, "Unknown"),
                target_user_id=it.target_user_id,
                target_user_email=(
                    email_map.get(it.target_user_id) if it.target_user_id else None
                ),
                action=it.action,
                description=it.description,
                metadata=it.log_metadata,
                ip_address=it.ip_address,
                created_at=it.created_at,
            )
            for it in items
        ],
    )


# ------------------------------------------------------------------
# System health
# ------------------------------------------------------------------


@router.get("/health", response_model=SystemHealthOut)
def read_system_health(
    settings: Settings = Depends(get_settings_dep),
    db: Session = Depends(get_db),
) -> SystemHealthOut:
    """System health information for the admin console."""
    # Check database connectivity.
    db_status = "ok"
    try:
        db.execute(select(func.count()).select_from(User))
    except Exception as exc:  # noqa: BLE001
        db_status = f"error: {exc}"

    # Vector store provider.
    from app.services.vector_store import create_vector_store

    vs = create_vector_store(settings)

    return SystemHealthOut(
        status="ok" if db_status == "ok" else "degraded",
        database=db_status,
        vector_store=vs.provider_name(),
        embedding_provider=settings.EMBEDDING_PROVIDER,
        llm_provider=settings.LLM_PROVIDER,
    )
