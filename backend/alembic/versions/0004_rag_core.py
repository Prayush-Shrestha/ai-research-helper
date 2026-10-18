"""Phase 2 RAG: document chunks, conversations, messages, usage tracking.

Adds:
- document_chunks: chunked text with embeddings per document
- research_conversations / research_messages: persistent chat sessions
- ai_usage: per-user AI request tracking for cost control

Also adds indexing_status / indexing_error / embedding_model to documents so
extraction (Phase 1) and indexing (Phase 2) are tracked separately.

embedding_vector is stored as JSON text for cross-database compatibility
(SQLite in tests, PostgreSQL in production). When pgvector is available on
PostgreSQL, a follow-up migration can convert this column to vector type and
add an index — see README.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0004_rag_core"
down_revision = "0003_last_login_at"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---------- documents: add indexing tracking ----------
    with op.batch_alter_table("documents") as batch:
        batch.add_column(
            sa.Column(
                "indexing_status",
                sa.String(20),
                nullable=False,
                server_default="pending",
            )
        )
        batch.add_column(sa.Column("indexing_error", sa.String(500), nullable=True))
        batch.add_column(
            sa.Column("embedding_model", sa.String(100), nullable=True)
        )
        batch.create_check_constraint(
            "ck_documents_indexing_status",
            "indexing_status IN ('pending', 'processing', 'completed', 'failed')",
        )

    # ---------- document_chunks ----------
    op.create_table(
        "document_chunks",
        sa.Column(
            "id",
            sa.String(36),
            nullable=False,
        ),
        sa.Column(
            "document_id",
            sa.String(36),
            nullable=False,
        ),
        sa.Column(
            "owner_id",
            sa.String(36),
            nullable=False,
        ),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("start_char", sa.Integer(), nullable=True),
        sa.Column("end_char", sa.Integer(), nullable=True),
        # JSON-serialized embedding vector (cross-database compatible).
        # On PostgreSQL + pgvector this can be migrated to vector type later.
        sa.Column("embedding_vector", sa.Text(), nullable=True),
        sa.Column("embedding_model", sa.String(100), nullable=True),
        sa.Column(
            "chunk_status",
            sa.String(20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("chunk_error", sa.String(500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["document_id"], ["documents.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        "ix_document_chunks_document_id", "document_chunks", ["document_id"]
    )
    op.create_index(
        "ix_document_chunks_owner_id", "document_chunks", ["owner_id"]
    )
    op.create_index(
        "ix_document_chunks_chunk_status",
        "document_chunks",
        ["chunk_status"],
    )

    # ---------- research_conversations ----------
    op.create_table(
        "research_conversations",
        sa.Column(
            "id",
            sa.String(36),
            nullable=False,
        ),
        sa.Column(
            "owner_id",
            sa.String(36),
            nullable=False,
        ),
        sa.Column("title", sa.String(200), nullable=False),
        # Document IDs in scope for this conversation (JSON array of strings).
        sa.Column("document_ids", sa.Text(), nullable=False, server_default="[]"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        "ix_research_conversations_owner_id",
        "research_conversations",
        ["owner_id"],
    )
    op.create_index(
        "ix_research_conversations_updated_at",
        "research_conversations",
        ["updated_at"],
    )

    # ---------- research_messages ----------
    op.create_table(
        "research_messages",
        sa.Column(
            "id",
            sa.String(36),
            nullable=False,
        ),
        sa.Column(
            "conversation_id",
            sa.String(36),
            nullable=False,
        ),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        # Citations used by assistant messages (JSON array).
        sa.Column("citations", sa.Text(), nullable=False, server_default="[]"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["research_conversations.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_check_constraint(
        "ck_research_messages_role",
        "research_messages",
        "role IN ('user', 'assistant')",
    )
    op.create_index(
        "ix_research_messages_conversation_id",
        "research_messages",
        ["conversation_id"],
    )
    op.create_index(
        "ix_research_messages_created_at",
        "research_messages",
        ["created_at"],
    )

    # ---------- ai_usage ----------
    op.create_table(
        "ai_usage",
        sa.Column(
            "id",
            sa.String(36),
            nullable=False,
        ),
        sa.Column(
            "owner_id",
            sa.String(36),
            nullable=False,
        ),
        sa.Column("operation_type", sa.String(30), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("tokens_estimate", sa.Integer(), nullable=True),
        sa.Column("cost_estimate_usd", sa.Numeric(10, 6), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], ondelete="CASCADE"
        ),
    )
    op.create_check_constraint(
        "ck_ai_usage_operation_type",
        "ai_usage",
        "operation_type IN ('embedding', 'llm')",
    )
    op.create_index("ix_ai_usage_owner_id", "ai_usage", ["owner_id"])
    op.create_index("ix_ai_usage_created_at", "ai_usage", ["created_at"])


def downgrade() -> None:
    op.drop_table("ai_usage")
    op.drop_table("research_messages")
    op.drop_table("research_conversations")
    op.drop_table("document_chunks")
    with op.batch_alter_table("documents") as batch:
        batch.drop_constraint(
            "ck_documents_indexing_status", type_="check"
        )
        batch.drop_column("embedding_model")
        batch.drop_column("indexing_error")
        batch.drop_column("indexing_status")
