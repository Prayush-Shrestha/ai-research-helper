"""Shared route dependencies: DB sessions, auth, and origin checks."""

from __future__ import annotations

from collections.abc import Iterator

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import decode_session_token
from app.db.session import SessionLocal
from app.models.user import User


def get_settings_dep() -> Settings:
    return get_settings()


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    request: Request,
    settings: Settings = Depends(get_settings_dep),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the user from the HttpOnly session cookie (401 otherwise)."""
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )
    user_id = decode_session_token(token, settings.SECRET_KEY)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please sign in again.",
        )
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )
    return user


async def require_same_origin(
    request: Request, settings: Settings = Depends(get_settings_dep)
) -> None:
    """Cheap CSRF backstop for cookie auth: when the browser sends an
    Origin header on a mutation, it must be our own frontend origin."""
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    origin = request.headers.get("origin")
    if origin is None:
        return
    allowed = {settings.FRONTEND_ORIGIN.rstrip("/")}
    if origin.rstrip("/") not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-origin request refused.",
        )
