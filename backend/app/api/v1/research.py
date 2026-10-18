"""Research topic suggestion and RAG conversation routes."""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_db,
    get_settings_dep,
    require_same_origin,
)
from app.core.config import Settings
from app.models.document import Document as DocModel
from app.models.user import User
from app.schemas.common import MessageOut
from app.schemas.research import (
    AIUsageOut,
    AskIn,
    AskOut,
    ConversationCreateIn,
    ConversationDetailOut,
    ConversationListOut,
    ConversationOut,
    ConversationMessageOut,
    CitationOut,
    IndexingStatusOut,
    RenameConversationIn,
    ReindexIn,
    SuggestTopicsIn,
    SuggestTopicsOut,
)
from app.services import rag as rag_service_mod
from app.services import research_service

router = APIRouter(dependencies=[Depends(require_same_origin)])

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Topic suggestion (existing)
# ------------------------------------------------------------------


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


# ------------------------------------------------------------------
# RAG conversation endpoints
# ------------------------------------------------------------------


@router.post(
    "/conversations",
    response_model=ConversationOut,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
    payload: ConversationCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> ConversationOut:
    """Start a new research conversation."""
    rag = rag_service_mod.create_rag_service(settings)
    conv = rag._conv.create_conversation(
        db,
        user,
        title=payload.title,
        document_ids=payload.document_ids or [],
    )
    return ConversationOut(
        id=conv.id,
        title=conv.title,
        document_ids=_json_loads(conv.document_ids),
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=0,
    )


@router.get(
    "/conversations",
    response_model=ConversationListOut,
)
def list_conversations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> ConversationListOut:
    """List the current user's conversations."""
    rag = rag_service_mod.create_rag_service(settings)
    convs = rag._conv.list_conversations(db, user)
    return ConversationListOut(
        conversations=[
            ConversationOut(
                id=c.id,
                title=c.title,
                document_ids=_json_loads(c.document_ids),
                created_at=c.created_at,
                updated_at=c.updated_at,
                message_count=len(c.messages),
            )
            for c in convs
        ]
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailOut,
)
def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> ConversationDetailOut:
    """Get a conversation and its messages."""
    rag = rag_service_mod.create_rag_service(settings)
    conv = rag._conv.get_conversation(db, user, conversation_id)
    if conv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )
    messages = rag._conv.get_conversation_messages(db, user, conversation_id)
    if messages is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )
    return ConversationDetailOut(
        id=conv.id,
        title=conv.title,
        document_ids=_json_loads(conv.document_ids),
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=len(messages),
        messages=[
            ConversationMessageOut(
                id=m.id,
                role=m.role,
                content=m.content,
                citations=_json_loads(m.citations),
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


@router.patch(
    "/conversations/{conversation_id}",
    response_model=ConversationOut,
)
def rename_conversation(
    conversation_id: str,
    payload: RenameConversationIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> ConversationOut:
    """Rename a conversation."""
    rag = rag_service_mod.create_rag_service(settings)
    conv = rag._conv.rename_conversation(db, user, conversation_id, payload.title)
    if conv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )
    return ConversationOut(
        id=conv.id,
        title=conv.title,
        document_ids=_json_loads(conv.document_ids),
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=len(conv.messages),
    )


@router.delete(
    "/conversations/{conversation_id}",
    response_model=MessageOut,
)
def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> MessageOut:
    """Delete a conversation and its messages."""
    rag = rag_service_mod.create_rag_service(settings)
    ok = rag._conv.delete_conversation(db, user, conversation_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )
    return MessageOut(detail="Conversation deleted.")


@router.post(
    "/ask",
    response_model=AskOut,
)
def ask_question(
    payload: AskIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> AskOut:
    """Ask a question about your documents (RAG)."""
    rag = rag_service_mod.create_rag_service(settings)
    try:
        result, conv_id = rag.ask(
            db,
            user,
            question=payload.question,
            conversation_id=payload.conversation_id,
            document_ids=payload.document_ids,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        )
    return AskOut(
        conversation_id=conv_id,
        answer=result.answer,
        citations=[
            CitationOut(
                chunk_id=c.chunk_id,
                document_id=c.document_id,
                document_title=c.document_title,
                page_number=c.page_number,
                text_snippet=c.text_snippet,
                similarity=c.similarity,
            )
            for c in result.citations
        ],
        model=result.model,
        provider=result.provider,
        insufficient_evidence=result.insufficient_evidence,
        tokens_estimate=result.tokens_estimate,
    )


# ------------------------------------------------------------------
# Document indexing endpoints
# ------------------------------------------------------------------


@router.get(
    "/documents/{document_id}/indexing-status",
    response_model=IndexingStatusOut,
)
def get_indexing_status(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> IndexingStatusOut:
    """Check the indexing status of a document."""
    rag = rag_service_mod.create_rag_service(settings)
    status = rag.get_indexing_status(db, document_id, user)
    if status is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    doc = db.get(DocModel, document_id)
    return IndexingStatusOut(
        document_id=document_id,
        indexing_status=status,
        indexing_error=doc.indexing_error if doc else None,
        embedding_model=doc.embedding_model if doc else None,
    )


@router.post(
    "/documents/{document_id}/reindex",
    response_model=MessageOut,
    status_code=status.HTTP_202_ACCEPTED,
)
def reindex_document(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> MessageOut:
    """Reprocess a document's chunks and embeddings."""
    doc = db.get(DocModel, document_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    if not user.is_admin and doc.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reindex this document.",
        )
    rag = rag_service_mod.create_rag_service(settings)
    try:
        rag.reindex_document(db, doc, user)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Reindex failed for document %s", document_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reindexing failed: {exc}",
        )
    return MessageOut(detail="Document reindexing started.")


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------


def _json_loads(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return []
