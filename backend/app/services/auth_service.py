"""Authentication business logic (registration, login, sessions)."""

from __future__ import annotations

from fastapi import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import (
    create_session_token,
    hash_password,
    verify_password,
)
from app.models.user import ADMIN_ROLE, User
from app.schemas.auth import RegisterIn


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalars(
        select(User).where(User.email == email.strip().lower())
    ).first()


def register_user(
    db: Session, payload: RegisterIn, settings: Settings | None = None
) -> User | None:
    """Create the account, or return None when the email is taken."""
    email = payload.email.strip().lower()
    if get_user_by_email(db, email) is not None:
        return None
    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
    )
    if settings is not None:
        ensure_admin_role(user, settings)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def ensure_admin_role(user: User, settings: Settings) -> bool:
    """Promote allowlisted emails to admin. Returns True when promoted."""
    if user.role != ADMIN_ROLE and user.email.lower() in settings.admin_emails:
        user.role = ADMIN_ROLE
        return True
    return False


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None or not verify_password(user.password_hash, password):
        return None
    return user


def set_session_cookie(response: Response, user: User, settings: Settings) -> str:
    token = create_session_token(user.id, settings.SECRET_KEY, settings.SESSION_EXPIRE_DAYS)
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.SESSION_EXPIRE_DAYS * 24 * 3600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )
    return token


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        secure=settings.cookie_secure,
        samesite="lax",
    )
