"""Import every model here so Base.metadata covers the whole schema."""

from app.models.ai_usage import AIUsage  # noqa: F401
from app.models.conversation import ResearchConversation, ResearchMessage  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.document_chunk import DocumentChunk  # noqa: F401
from app.models.note import ResearchNote  # noqa: F401
from app.models.phase3 import (  # noqa: F401
    ActivityLog,
    AuditLog,
    CollectionDocument,
    KnowledgeEntity,
    KnowledgeRelationship,
    ResearchCollection,
)
from app.models.user import User  # noqa: F401
