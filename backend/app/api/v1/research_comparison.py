"""Research comparison API route — compare two or more documents."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_db,
    get_settings_dep,
    require_same_origin,
)
from app.core.config import Settings
from app.models.document import Document
from app.models.user import User
from app.schemas.phase3 import (
    CompareDocumentsIn,
    DocumentComparisonOut,
)
from app.services import research_comparison_service as comp_service

router = APIRouter(dependencies=[Depends(require_same_origin)])


@router.post("/compare", response_model=DocumentComparisonOut)
def compare_documents(
    payload: CompareDocumentsIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> DocumentComparisonOut:
    """Compare two or more documents across objectives, methodology,
    findings, datasets, limitations, similarities, differences, and gaps.

    Every conclusion is grounded in the selected documents with citations.
    """
    # Validate that all documents exist and are owned by the user.
    if len(payload.document_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 documents are required for comparison.",
        )
    if len(payload.document_ids) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 documents can be compared at once.",
        )

    for doc_id in payload.document_ids:
        doc = db.get(Document, doc_id)
        if doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {doc_id} not found.",
            )
        if not user.is_admin and doc.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not authorized to access document {doc_id}.",
            )

    comparison = comp_service.create_comparison_service(settings).compare_documents(
        db, user, document_ids=payload.document_ids
    )
    return comparison
