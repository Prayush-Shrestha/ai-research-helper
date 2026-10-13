"""Authentication routes: register, login, logout, current user, profile."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_db,
    get_settings_dep,
    require_same_origin,
)
from app.core.config import Settings, get_settings
from app.models.user import User
from app.schemas.auth import LoginIn, RegisterIn, UpdateProfileIn, UserOut
from app.schemas.common import MessageOut
from app.services import auth_service

router = APIRouter(dependencies=[Depends(require_same_origin)])
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/register", response_model=UserOut, status_code=status.HTTP_201_CREATED
)
@limiter.limit(lambda: get_settings().AUTH_RATE_LIMIT)
def register(
    request: Request,
    payload: RegisterIn,
    response: Response,
    settings: Settings = Depends(get_settings_dep),
    db: Session = Depends(get_db),
) -> User:
    user = auth_service.register_user(db, payload)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    # Log the new account straight in (cookie set, same as login).
    auth_service.set_session_cookie(response, user, settings)
    return user


@router.post("/login", response_model=UserOut)
@limiter.limit(lambda: get_settings().AUTH_RATE_LIMIT)
def login(
    request: Request,
    payload: LoginIn,
    response: Response,
    settings: Settings = Depends(get_settings_dep),
    db: Session = Depends(get_db),
) -> User:
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    if user is None:
        # Deliberately vague: same message whether the email or password
        # was wrong, so accounts can't be enumerated here.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    auth_service.set_session_cookie(response, user, settings)
    return user


@router.post("/logout", response_model=MessageOut)
def logout(
    response: Response,
    settings: Settings = Depends(get_settings_dep),
    _user: User = Depends(get_current_user),
) -> MessageOut:
    auth_service.clear_session_cookie(response, settings)
    return MessageOut(detail="Signed out.")


@router.get("/me", response_model=UserOut)
def read_me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: UpdateProfileIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    user.name = payload.name.strip()
    db.commit()
    db.refresh(user)
    return user
