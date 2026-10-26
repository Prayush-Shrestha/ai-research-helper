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
    AdminDocumentWithOwner,
    AdminNoteWithOwner,
    AdminRegisterIn,
    AdminStatsOut,
    AdminUserDetailOut,
    AdminUserOut,
    RoleUpdateIn,
)
from app.schemas.common import MessageOut
from app.services import admin_service
from app.services import audit_service

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


@router.post("/register", response_model=AdminUserOut, status_code=status.HTTP_201_CREATED)
def admin_register(
    payload: AdminRegisterIn,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings_dep),
) -> AdminUserOut:
    """Admin creates another account (user or admin)."""
    created = admin_service.admin_register_user(db, admin, payload, settings)
    if created is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    return admin_service.row_for(db, created)


@router.get("/documents", response_model=list[AdminDocumentWithOwner])
def read_all_documents(db: Session = Depends(get_db)) -> list[AdminDocumentWithOwner]:
    """Every document on the site, with the account that owns each one."""
    return admin_service.list_all_documents_with_owners(db)


@router.get("/notes", response_model=list[AdminNoteWithOwner])
def read_all_notes(db: Session = Depends(get_db)) -> list[AdminNoteWithOwner]:
    """Every note on the site, with the account that owns each one."""
    return admin_service.list_all_notes_with_owners(db)


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
    previous_role = target.role
    updated = admin_service.set_role(db, target, payload.role)
    audit_service.record(
        db,
        admin_user=admin,
        target_user=target,
        action="role_changed",
        description=f"Role changed from {previous_role} to {payload.role} for {target.email}.",
        metadata={"previous_role": previous_role, "new_role": payload.role},
    )
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
