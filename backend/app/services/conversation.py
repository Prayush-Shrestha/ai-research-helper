"""Conversation service — persistent RAG chat sessions.

Ownership is enforced on every operation: a user can only see, modify,
or delete their own conversations and messages.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Protocol

from sqlalchemy.orm import Session

from app.models.conversation import ResearchConversation, ResearchMessage
from app.models.user import User

logger = logging.getLogger(__name__)


class ConversationServiceProtocol(Protocol):
    def create_conversation(
        self,
        db: Session,
        owner: User,
        *,
        title: str | None = None,
        document_ids: list[str] | None = None,
    ) -> ResearchConversation:
        ...

    def list_conversations(
        self,
        db: Session,
        owner: User,
    ) -> list[ResearchConversation]:
        ...

    def get_conversation(
        self,
        db: Session,
        owner: User,
        conversation_id: str,
    ) -> ResearchConversation | None:
        ...

    def get_conversation_messages(
        self,
        db: Session,
        owner: User,
        conversation_id: str,
    ) -> list[ResearchMessage] | None:
        ...

    def rename_conversation(
        self,
        db: Session,
        owner: User,
        conversation_id: str,
        new_title: str,
    ) -> ResearchConversation | None:
        ...

    def delete_conversation(
        self,
        db: Session,
        owner: User,
        conversation_id: str,
    ) -> bool:
        ...

    def update_document_scope(
        self,
        db: Session,
        owner: User,
        conversation_id: str,
        document_ids: list[str],
    ) -> ResearchConversation | None:
        ...

    def add_message(
        self,
        db: Session,
        conversation: ResearchConversation,
        *,
        role: str,
        content: str,
        citations: list[dict] | None = None,
    ) -> ResearchMessage:
        ...


class ConversationService:
    def create_conversation(
        self,
        db: Session,
        owner: User,
        *,
        title: str | None = None,
        document_ids: list[str] | None = None,
    ) -> ResearchConversation:
        conv = ResearchConversation(
            owner_id=owner.id,
            title=title or "New conversation",
            document_ids=json.dumps(document_ids or []),
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    def list_conversations(
        self,
        db: Session,
        owner: User,
    ) -> list[ResearchConversation]:
        return list(
            db.query(ResearchConversation)
            .filter(ResearchConversation.owner_id == owner.id)
            .order_by(ResearchConversation.updated_at.desc())
            .all()
        )

    def get_conversation(
        self,
        db: Session,
        owner: User,
        conversation_id: str,
    ) -> ResearchConversation | None:
        return (
            db.query(ResearchConversation)
            .filter(
                ResearchConversation.id == conversation_id,
                ResearchConversation.owner_id == owner.id,
            )
            .first()
        )

    def get_conversation_messages(
        self,
        db: Session,
        owner: User,
        conversation_id: str,
    ) -> list[ResearchMessage] | None:
        # Verify ownership first.
        conv = self.get_conversation(db, owner, conversation_id)
        if conv is None:
            return None
        return list(
            db.query(ResearchMessage)
            .filter(ResearchMessage.conversation_id == conversation_id)
            .order_by(ResearchMessage.created_at.asc())
            .all()
        )

    def rename_conversation(
        self,
        db: Session,
        owner: User,
        conversation_id: str,
        new_title: str,
    ) -> ResearchConversation | None:
        conv = self.get_conversation(db, owner, conversation_id)
        if conv is None:
            return None
        conv.title = new_title.strip()[:200] or conv.title
        conv.updated_at = datetime.now(timezone.utc)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    def delete_conversation(
        self,
        db: Session,
        owner: User,
        conversation_id: str,
    ) -> bool:
        conv = self.get_conversation(db, owner, conversation_id)
        if conv is None:
            return False
        db.delete(conv)
        db.commit()
        return True

    def update_document_scope(
        self,
        db: Session,
        owner: User,
        conversation_id: str,
        document_ids: list[str],
    ) -> ResearchConversation | None:
        conv = self.get_conversation(db, owner, conversation_id)
        if conv is None:
            return None
        conv.document_ids = json.dumps(document_ids)
        conv.updated_at = datetime.now(timezone.utc)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    def add_message(
        self,
        db: Session,
        conversation: ResearchConversation,
        *,
        role: str,
        content: str,
        citations: list[dict] | None = None,
    ) -> ResearchMessage:
        msg = ResearchMessage(
            conversation_id=conversation.id,
            role=role,
            content=content,
            citations=json.dumps(citations or []),
        )
        db.add(msg)
        # Touch conversation updated_at.
        conversation.updated_at = datetime.now(timezone.utc)
        db.add(conversation)
        db.commit()
        db.refresh(msg)
        return msg


def create_conversation_service() -> ConversationService:
    return ConversationService()
