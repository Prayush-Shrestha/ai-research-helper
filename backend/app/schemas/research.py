"""Research topic suggestion and RAG conversation schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# ------------------------------------------------------------------
# Topic suggestion (existing)
# ------------------------------------------------------------------

class SuggestTopicsIn(BaseModel):
    """User describes what they want to research."""

    description: str = Field(
        min_length=10,
        max_length=2000,
        description="What you're interested in researching.",
    )


class TopicSuggestion(BaseModel):
    """One suggested research topic."""

    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=500)
    why_it_fits: str = Field(..., max_length=300)
    suggested_approach: str = Field(..., max_length=300)
    is_best: bool = False


class SuggestTopicsOut(BaseModel):
    """Response with suggested topics and a best pick."""

    topics: list[TopicSuggestion]
    best_topic_index: int | None = None
    note: str | None = None


# ------------------------------------------------------------------
# RAG conversation schemas
# ------------------------------------------------------------------

class CitationOut(BaseModel):
    """A source citation referenced by an answer."""

    model_config = ConfigDict(from_attributes=True)

    chunk_id: str
    document_id: str
    document_title: str
    page_number: int | None = None
    text_snippet: str
    similarity: float


class ConversationMessageOut(BaseModel):
    """One message in a conversation."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str
    citations: list[CitationOut] = Field(default_factory=list)
    created_at: datetime


class ConversationOut(BaseModel):
    """A research conversation summary."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    document_ids: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ConversationDetailOut(ConversationOut):
    """A conversation with its full message history."""

    messages: list[ConversationMessageOut] = Field(default_factory=list)


class ConversationCreateIn(BaseModel):
    """Create a new research conversation."""

    title: str | None = Field(default=None, max_length=200)
    document_ids: list[str] = Field(default_factory=list)


class RenameConversationIn(BaseModel):
    """Rename a conversation."""

    title: str = Field(..., min_length=1, max_length=200)


class AskIn(BaseModel):
    """Ask a question about your documents."""

    question: str = Field(..., min_length=1, max_length=2000)
    conversation_id: str | None = None
    document_ids: list[str] | None = None


class AskOut(BaseModel):
    """Answer to a RAG question, with citations."""

    conversation_id: str
    answer: str
    citations: list[CitationOut] = Field(default_factory=list)
    model: str
    provider: str
    insufficient_evidence: bool = False
    tokens_estimate: int | None = None


class IndexingStatusOut(BaseModel):
    """Document indexing status."""

    document_id: str
    indexing_status: str
    indexing_error: str | None = None
    embedding_model: str | None = None


class ReindexIn(BaseModel):
    """Reindex a document's chunks and embeddings."""

    document_id: str


class AIUsageOut(BaseModel):
    """One recorded AI usage entry."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    operation_type: str
    provider: str
    model: str
    tokens_estimate: int | None = None
    cost_estimate_usd: float | None = None
    created_at: datetime


class ConversationListOut(BaseModel):
    """List of conversation summaries."""

    conversations: list[ConversationOut]


# ------------------------------------------------------------------
# Summarization schemas
# ------------------------------------------------------------------


class KeyPoint(BaseModel):
    """One key point extracted from a document."""

    point: str
    page_number: int | None = None


class SummarizeIn(BaseModel):
    """Request to summarize documents."""

    document_ids: list[str] = Field(default_factory=list)


class SummarizeOut(BaseModel):
    """Summary, key points, and study questions for documents."""

    summary: str
    key_points: list[KeyPoint] = Field(default_factory=list)
    study_questions: list[str] = Field(default_factory=list)
    model: str
    provider: str
    citations: list[CitationOut] = Field(default_factory=list)


# ------------------------------------------------------------------
# Knowledge graph schemas
# ------------------------------------------------------------------


class KnowledgeNode(BaseModel):
    """One node in the knowledge graph (a document)."""

    id: str
    label: str
    size: int
    document_ids: list[str] = Field(default_factory=list)


class KnowledgeEdge(BaseModel):
    """One edge between two documents sharing topics."""

    source: str
    target: str
    weight: float


class KnowledgeOut(BaseModel):
    """Knowledge graph: nodes and edges."""

    nodes: list[KnowledgeNode] = Field(default_factory=list)
    edges: list[KnowledgeEdge] = Field(default_factory=list)
