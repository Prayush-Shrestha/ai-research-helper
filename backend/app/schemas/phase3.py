"""Phase 3 request/response schemas: collections, knowledge graph,
activity/audit logs, research comparison."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PageOut


# ------------------------------------------------------------------
# Research collections
# ------------------------------------------------------------------

class CollectionBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)


class CollectionCreateIn(CollectionBase):
    pass


class CollectionUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)


class CollectionOut(CollectionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: str
    document_count: int = 0
    created_at: datetime
    updated_at: datetime


class CollectionDetailOut(CollectionOut):
    documents: list["CollectionDocumentOut"] = Field(default_factory=list)


class CollectionDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    collection_id: str
    document_id: str
    document_title: str
    document_file_type: str
    document_page_count: int | None = None
    added_at: datetime


class CollectionDocumentAddIn(BaseModel):
    document_id: str


class CollectionListOut(PageOut):
    items: list[CollectionOut]


# ------------------------------------------------------------------
# Knowledge graph entities
# ------------------------------------------------------------------

ENTITY_TYPE_EXAMPLES = (
    "person", "organization", "technology", "research_topic",
    "scientific_concept", "dataset", "method", "keyword",
)


class KnowledgeEntityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    entity_type: str
    description: str | None = None
    source_document_id: str | None = None
    source_chunk_id: str | None = None
    source_page_number: int | None = None
    source_text_snippet: str | None = None
    source_document_title: str | None = None
    confidence: float
    is_inferred: bool
    created_at: datetime
    updated_at: datetime
    relationship_count: int = 0


class KnowledgeEntityListOut(PageOut):
    items: list[KnowledgeEntityOut]


class KnowledgeEntityFilter(BaseModel):
    entity_type: str | None = None
    source_document_id: str | None = None
    search: str | None = Field(default=None, max_length=200)
    inferred_only: bool | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=200)


# ------------------------------------------------------------------
# Knowledge graph relationships
# ------------------------------------------------------------------

class KnowledgeRelationshipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_entity_id: str
    target_entity_id: str
    source_entity_name: str
    target_entity_name: str
    relationship_type: str
    description: str | None = None
    source_document_id: str | None = None
    source_chunk_id: str | None = None
    source_page_number: int | None = None
    source_text_snippet: str | None = None
    source_document_title: str | None = None
    confidence: float
    is_inferred: bool
    created_at: datetime
    updated_at: datetime


class KnowledgeRelationshipListOut(PageOut):
    items: list[KnowledgeRelationshipOut]


class KnowledgeGraphOut(BaseModel):
    """Full graph payload for visualization."""

    nodes: list[KnowledgeEntityOut] = Field(default_factory=list)
    edges: list[KnowledgeRelationshipOut] = Field(default_factory=list)


# ------------------------------------------------------------------
# Activity logs
# ------------------------------------------------------------------

class ActivityLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    action: str
    entity_type: str | None = None
    entity_id: str | None = None
    metadata: str | None = None
    ip_address: str | None = None
    created_at: datetime


class ActivityLogListOut(PageOut):
    items: list[ActivityLogOut]


class ActivityLogFilter(BaseModel):
    action: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=200)


# ------------------------------------------------------------------
# Audit logs (admin only)
# ------------------------------------------------------------------

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    admin_user_id: str
    admin_email: str
    target_user_id: str | None = None
    target_user_email: str | None = None
    action: str
    description: str | None = None
    metadata: str | None = None
    ip_address: str | None = None
    created_at: datetime


class AuditLogListOut(PageOut):
    items: list[AuditLogOut]


# ------------------------------------------------------------------
# Research comparison
# ------------------------------------------------------------------

class ComparisonSection(BaseModel):
    """One section of a document comparison (e.g. objectives, methodology)."""

    title: str
    content: str
    citations: list[str] = Field(default_factory=list)


class DocumentComparisonOut(BaseModel):
    """Comparison result for two or more documents."""

    document_ids: list[str]
    document_titles: list[str]
    sections: list[ComparisonSection] = Field(default_factory=list)
    similarities: list[str] = Field(default_factory=list)
    differences: list[str] = Field(default_factory=list)
    research_gaps: list[str] = Field(default_factory=list)
    model: str
    provider: str
    tokens_estimate: int | None = None
    created_at: datetime


class CompareDocumentsIn(BaseModel):
    document_ids: list[str] = Field(min_length=2, max_length=10)


# ------------------------------------------------------------------
# Enhanced admin: user status
# ------------------------------------------------------------------

class UserStatusUpdateIn(BaseModel):
    is_active: bool


# ------------------------------------------------------------------
# Admin analytics
# ------------------------------------------------------------------

class AdminAnalyticsOut(BaseModel):
    total_users: int
    active_users: int
    new_users_30d: int
    total_documents: int
    documents_uploaded_30d: int
    processing_success_count: int
    processing_failure_count: int
    ai_requests_30d: int
    avg_processing_latency_ms: float | None = None
    error_rate_percent: float | None = None


# ------------------------------------------------------------------
# System health
# ------------------------------------------------------------------

class SystemHealthOut(BaseModel):
    status: str
    database: str
    vector_store: str
    embedding_provider: str
    llm_provider: str
    uptime_seconds: float | None = None


# Rebuild forward references
CollectionDetailOut.model_rebuild()
KnowledgeGraphOut.model_rebuild()
