"""Admin console routes — requires the admin role on top of session auth."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_db,
    get_settings_dep,
    require_admin,
    require_same_origin,
)
from app.core.config import Settings
from app.models.user import ADMIN_ROLE, USER_ROLE, User
from app.schemas.admin import (
    AdminStatsOut,
    AdminUserDetailOut,
    AdminUserOut,
    RoleUpdateIn,
)
from app.schemas.common import MessageOut
from app.services import admin_service

router = APIRouter(
    dependencies=[Depends(require_same_origin), Depends(require_admin)]
)


@router.get("/stats", response_model=AdminStatsOut)
def read_stats(db: Session = Depends(get_db)) -> AdminStatsOut:
    return admin_service.site_stats(db)


@router.get("/users", response_model=list[AdminUserOut])
def read_users(
    search: str | None = Query(default=None, max_length=120),
    db: Session = Depends(get_db),
) -> list[AdminUserOut]:
    return admin_service.list_users(db, search)


@router.get("/users/{user_id}", response_model=AdminUserDetailOut)
def read_user(
    user_id: str, db: Session = Depends(get_db)
) -> AdminUserDetailOut:
    detail = admin_service.get_user_detail(db, user_id)
    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
        )
    return detail


@router.patch("/users/{user_id}/role", response_model=AdminUserOut)
def update_role(
    user_id: str,
    payload: RoleUpdateIn,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user),
) -> AdminUserOut:
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
        )
    if target.id == admin.id and payload.role != ADMIN_ROLE:
        # Locking yourself out of the console by accident helps nobody.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own admin role.",
        )
    if payload.role not in (USER_ROLE, ADMIN_ROLE):  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'user' or 'admin'.",
        )
    updated = admin_service.set_role(db, target, payload.role)
    return admin_service.row_for(db, updated)


@router.delete("/users/{user_id}", response_model=MessageOut)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
    admin: User = Depends(get_current_user),
) -> MessageOut:
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
        )
    if target.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account from the console.",
        )
    admin_service.delete_user_account(db, target, settings)
    return MessageOut(detail=f"Deleted {target.email}.")
