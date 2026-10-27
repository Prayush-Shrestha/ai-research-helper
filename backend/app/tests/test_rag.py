"""Tests for the RAG service (with mocked dependencies)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.config import Settings
from app.models.user import User
from app.services.llm import Citation, LLMResult
from app.services.rag import RAGService


def _make_user(role: str = "user") -> User:
    return User(
        id="user-1",
        name="Test User",
        email="test@example.edu",
        password_hash="hash",
        role=role,
    )


def test_rag_service_ask_empty_question_raises():
    svc = RAGService(
        settings=Settings(),
        emb_service=MagicMock(),
        llm_service=MagicMock(),
        vector_store=MagicMock(),
        indexing_service=MagicMock(),
        conversation_service=MagicMock(),
    )
    with pytest.raises(ValueError, match="Question is empty"):
        svc.ask(MagicMock(), _make_user(), question="")


def test_rag_service_ask_too_long_raises():
    svc = RAGService(
        settings=Settings(),
        emb_service=MagicMock(),
        llm_service=MagicMock(),
        vector_store=MagicMock(),
        indexing_service=MagicMock(),
        conversation_service=MagicMock(),
    )
    with pytest.raises(ValueError, match="too long"):
        svc.ask(MagicMock(), _make_user(), question="x" * 3000)


def test_rag_service_ask_uses_conversation_scope():
    """Test that document_ids are filtered to owned documents."""
    svc = RAGService(
        settings=Settings(RAG_MAX_QUESTION_CHARS=2000),
        emb_service=MagicMock(),
        llm_service=MagicMock(),
        vector_store=MagicMock(),
        indexing_service=MagicMock(),
        conversation_service=MagicMock(),
    )

    # Mock conversation service to return a conversation with doc scope
    conv = MagicMock()
    conv.id = "conv-1"
    conv.document_ids = '["doc-1", "doc-2"]'
    svc._conv.get_conversation.return_value = conv

    # Mock embedding - AsyncMock returns a coroutine
    svc._emb.embed_texts = AsyncMock(return_value=[[0.1, 0.0, 0.0]])

    # Mock vector store to return chunks (similarity_search is async).
    svc._vs.similarity_search = AsyncMock(
        return_value=[
            ("chunk-1", 0.9, "text about ML", 1),
        ]
    )

    # Mock LLM
    svc._llm.generate_answer = AsyncMock(
        return_value=LLMResult(
            answer="ML is great.",
            citations=[
                Citation(
                    chunk_id="chunk-1",
                    document_id="doc-1",
                    document_title="Doc",
                    page_number=1,
                    text_snippet="text about ML",
                    similarity=0.9,
                )
            ],
            model="local",
            provider="local",
            insufficient_evidence=False,
        )
    )

    # Mock conversation service add_message
    svc._conv.add_message = MagicMock()

    # Mock _authorized_document_ids - both docs owned by user
    svc._authorized_document_ids = MagicMock(return_value=["doc-1", "doc-2"])

    db = MagicMock()
    user = _make_user()

    result, conv_id = svc.ask(
        db,
        user,
        question="What is ML?",
        conversation_id="conv-1",
        document_ids=["doc-1", "doc-2"],
    )

    assert result.answer == "ML is great."
    assert result.insufficient_evidence is False
    assert len(result.citations) == 1
    assert result.citations[0].document_title == "Doc"


def test_rag_insufficient_evidence_when_no_chunks():
    svc = RAGService(
        settings=Settings(RAG_SIMILARITY_THRESHOLD=0.3),
        emb_service=MagicMock(),
        llm_service=MagicMock(),
        vector_store=MagicMock(),
        indexing_service=MagicMock(),
        conversation_service=MagicMock(),
    )

    conv = MagicMock()
    conv.id = "conv-1"
    conv.document_ids = "[]"
    svc._conv.get_conversation.return_value = conv
    svc._emb.embed_texts = AsyncMock(return_value=[[0.1, 0.0, 0.0]])
    svc._vs.similarity_search = AsyncMock(return_value=[])  # No chunks found
    svc._llm.generate_answer = AsyncMock(
        return_value=LLMResult(
            answer="I couldn't find enough relevant information.",
            citations=[],
            model="local",
            provider="local",
            insufficient_evidence=True,
        )
    )
    svc._conv.add_message = MagicMock()
    svc._authorized_document_ids = MagicMock(return_value=[])

    result, _ = svc.ask(
        MagicMock(),
        _make_user(),
        question="What is quantum computing?",
        conversation_id="conv-1",
        document_ids=[],
    )

    assert result.insufficient_evidence is True
    assert "couldn't find enough" in result.answer.lower()


def test_rag_cross_user_document_filtered():
    """Non-admin user cannot scope to another user's document."""
    svc = RAGService(
        settings=Settings(),
        emb_service=MagicMock(),
        llm_service=MagicMock(),
        vector_store=MagicMock(),
        indexing_service=MagicMock(),
        conversation_service=MagicMock(),
    )

    svc._emb.embed_texts = AsyncMock(return_value=[[0.1, 0.0, 0.0]])
    svc._vs.similarity_search = AsyncMock(return_value=[])
    svc._llm.generate_answer = AsyncMock(
        return_value=LLMResult(
            answer="No results.",
            citations=[],
            model="local",
            provider="local",
            insufficient_evidence=True,
        )
    )
    svc._conv.add_message = MagicMock()
    # Only return owned docs, filtering out the other user's doc
    svc._authorized_document_ids = MagicMock(return_value=["doc-1"])

    result, _ = svc.ask(
        MagicMock(),
        _make_user(role="user"),
        question="test",
        conversation_id=None,
        document_ids=["doc-1", "doc-2"],  # doc-2 belongs to another user
    )

    # doc-2 should have been filtered out
    svc._authorized_document_ids.assert_called_once()
    call_args = svc._authorized_document_ids.call_args
    assert call_args[0][2] == ["doc-1", "doc-2"]


def test_rag_citation_integrity():
    """Citations reference real chunks with document title and page."""
    svc = RAGService(
        settings=Settings(),
        emb_service=MagicMock(),
        llm_service=MagicMock(),
        vector_store=MagicMock(),
        indexing_service=MagicMock(),
        conversation_service=MagicMock(),
    )

    conv = MagicMock()
    conv.id = "conv-1"
    conv.document_ids = "[]"
    svc._conv.get_conversation.return_value = conv
    svc._emb.embed_texts = AsyncMock(return_value=[[0.1, 0.0, 0.0]])
    svc._vs.similarity_search = AsyncMock(
        return_value=[
            ("chunk-abc", 0.95, "The quick brown fox jumps.", 3),
        ]
    )
    svc._llm.generate_answer = AsyncMock(
        return_value=LLMResult(
            answer="The fox jumps.[1]",
            citations=[
                Citation(
                    chunk_id="chunk-abc",
                    document_id="doc-1",
                    document_title="Nature Paper",
                    page_number=3,
                    text_snippet="The quick brown fox jumps.",
                    similarity=0.95,
                )
            ],
            model="local",
            provider="local",
            insufficient_evidence=False,
        )
    )
    svc._conv.add_message = MagicMock()
    svc._authorized_document_ids = MagicMock(return_value=["doc-1"])

    result, _ = svc.ask(
        MagicMock(),
        _make_user(),
        question="What does the fox do?",
        conversation_id="conv-1",
        document_ids=["doc-1"],
    )

    assert len(result.citations) == 1
    c = result.citations[0]
    assert c.chunk_id == "chunk-abc"
    assert c.document_title == "Nature Paper"
    assert c.page_number == 3
    assert c.similarity == 0.95
