"""Research topic suggestion routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db, require_same_origin
from app.models.user import User
from app.schemas.research import SuggestTopicsIn, SuggestTopicsOut
from app.services import research_service

router = APIRouter(dependencies=[Depends(require_same_origin)])


@router.post(
    "/suggest-topics",
    response_model=SuggestTopicsOut,
    status_code=status.HTTP_200_OK,
)
def suggest_research_topics(
    payload: SuggestTopicsIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SuggestTopicsOut:
    """Suggest research topics from a free-form description.

    Any signed-in user can use this. The response flags which topic is the
    best fit based on keywords from your description.
    """
    return research_service.suggest_topics(payload.description)
