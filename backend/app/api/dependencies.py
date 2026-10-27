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
    """Resolve the user from the HttpOnly session cookie (401 otherwise).

    Disabled accounts (is_active=false) are rejected with 401 so a disabled
    user cannot make any authenticated request even if they hold a cookie.
    """
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
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled. Contact an administrator.",
        )
    return user


async def require_admin(
    user: User = Depends(get_current_user),
) -> User:
    """Same session auth as everywhere else, plus the admin role (403)."""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return user


async def require_same_origin(
    request: Request, settings: Settings = Depends(get_settings_dep)
) -> None:
    """CSRF backstop for cookie auth.

    On non-safe methods, when the browser sends an Origin header it must be
    our own frontend origin. Requests with no Origin header on non-safe
    methods are rejected (a browser same-origin request always sends Origin;
    only cross-site / non-browser callers omit it).
    """
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    origin = request.headers.get("origin")
    if origin is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-origin request refused.",
        )
    allowed = {settings.FRONTEND_ORIGIN.rstrip("/")}
    if origin.rstrip("/") not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-origin request refused.",
        )
