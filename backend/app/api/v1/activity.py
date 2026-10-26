"""Activity log API routes — per-user activity history."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db, require_same_origin
from app.models.user import User
from app.schemas.phase3 import ActivityLogFilter, ActivityLogListOut, ActivityLogOut
from app.services import activity_service

router = APIRouter(dependencies=[Depends(require_same_origin)])


@router.get("", response_model=ActivityLogListOut)
def list_my_activity(
    action: str | None = Query(default=None, max_length=60),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ActivityLogListOut:
    """List the current user's activity history."""
    filter = ActivityLogFilter(
        action=action, page=page, page_size=page_size
    )
    items, total = activity_service.list_activity_logs(
        db, user, action=filter.action, page=filter.page, page_size=filter.page_size
    )
    return ActivityLogListOut(
        total=total,
        page=page,
        page_size=page_size,
        items=[
            ActivityLogOut(
                id=log.id,
                user_id=log.user_id,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                metadata=log.log_metadata,
                ip_address=log.ip_address,
                created_at=log.created_at,
            )
            for log in items
        ],
    )
