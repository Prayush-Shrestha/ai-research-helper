"""Phase 3: Knowledge graph, collections, activity/audit logs.

Adds:
- research_collections: user-owned document collections/projects
- collection_documents: join table (collection <-> document)
- knowledge_entities: extracted entities (people, orgs, technologies,
  concepts, methods, datasets, ...) with source document/chunk references
- knowledge_relationships: edges between entities with confidence + source
- activity_logs: per-user activity history (upload, process, delete, note,
  collection, query, summary, graph update, settings)
- audit_logs: security-sensitive admin actions (role change, disable,
  reactivate, admin login, admin action)

All new tables preserve existing data. No existing columns are modified.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0006_phase3_core"
down_revision = "0005_pgvector"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---------------------------------------------------------------
    # research_collections
    # ---------------------------------------------------------------
    op.create_table(
        "research_collections",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("owner_id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_research_collections_updated_at",
        "research_collections",
        ["updated_at"],
    )
    op.create_check_constraint(
        "ck_research_collections_name_len",
        "research_collections",
        "length(name) > 0 AND length(name) <= 200",
    )

    # ---------------------------------------------------------------
    # collection_documents (join table)
    # ---------------------------------------------------------------
    op.create_table(
        "collection_documents",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("collection_id", sa.String(36), nullable=False),
        sa.Column("document_id", sa.String(36), nullable=False),
        sa.Column("added_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["collection_id"], ["research_collections.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["document_id"], ["documents.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "collection_id", "document_id", name="uq_collection_document"
        ),
    )
    op.create_index(
        "ix_collection_documents_collection_id",
        "collection_documents",
        ["collection_id"],
    )
    op.create_index(
        "ix_collection_documents_document_id",
        "collection_documents",
        ["document_id"],
    )

    # ---------------------------------------------------------------
    # knowledge_entities
    # ---------------------------------------------------------------
    ENTITY_TYPES = (
        "person", "organization", "technology", "research_topic",
        "scientific_concept", "dataset", "method", "keyword",
    )
    type_list = ", ".join(f"'{t}'" for t in ENTITY_TYPES)
    op.create_table(
        "knowledge_entities",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("owner_id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(300), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        # Source traceability
        sa.Column("source_document_id", sa.String(36), nullable=True),
        sa.Column("source_chunk_id", sa.String(36), nullable=True),
        sa.Column("source_page_number", sa.Integer(), nullable=True),
        sa.Column("source_text_snippet", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column("is_inferred", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["source_document_id"], ["documents.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["source_chunk_id"], ["document_chunks.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_knowledge_entities_entity_type", "knowledge_entities", ["entity_type"]
    )
    op.create_index(
        "ix_knowledge_entities_source_document",
        "knowledge_entities",
        ["source_document_id"],
    )
    op.create_check_constraint(
        f"ck_knowledge_entities_entity_type",
        "knowledge_entities",
        f"entity_type IN ({type_list})",
    )
    op.create_check_constraint(
        "ck_knowledge_entities_confidence_range",
        "knowledge_entities",
        "confidence >= 0.0 AND confidence <= 1.0",
    )
    # Avoid duplicate entities per user (same name + type + source doc).
    op.create_index(
        "uq_knowledge_entities_name_type_doc",
        "knowledge_entities",
        ["owner_id", "name", "entity_type", "source_document_id"],
        unique=True,
        postgresql_where=sa.text("source_document_id IS NOT NULL"),
    )
    op.create_index(
        "uq_knowledge_entities_name_type_standalone",
        "knowledge_entities",
        ["owner_id", "name", "entity_type", "source_document_id"],
        unique=True,
        postgresql_where=sa.text("source_document_id IS NULL"),
    )

    # ---------------------------------------------------------------
    # knowledge_relationships
    # ---------------------------------------------------------------
    RELATIONSHIP_TYPES = (
        "related_to", "mentions", "references", "uses_method",
        "uses_dataset", "part_of", "contradicts", "supports",
    )
    rel_list = ", ".join(f"'{t}'" for t in RELATIONSHIP_TYPES)
    op.create_table(
        "knowledge_relationships",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("owner_id", sa.String(36), nullable=False),
        sa.Column("source_entity_id", sa.String(36), nullable=False),
        sa.Column("target_entity_id", sa.String(36), nullable=False),
        sa.Column("relationship_type", sa.String(50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column("is_inferred", sa.Boolean(), nullable=False, server_default="false"),
        # Source traceability for the relationship
        sa.Column("source_document_id", sa.String(36), nullable=True),
        sa.Column("source_chunk_id", sa.String(36), nullable=True),
        sa.Column("source_page_number", sa.Integer(), nullable=True),
        sa.Column("source_text_snippet", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["source_entity_id"], ["knowledge_entities.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["target_entity_id"], ["knowledge_entities.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["source_document_id"], ["documents.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["source_chunk_id"], ["document_chunks.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_knowledge_relationships_source_entity",
        "knowledge_relationships",
        ["source_entity_id"],
    )
    op.create_index(
        "ix_knowledge_relationships_target_entity",
        "knowledge_relationships",
        ["target_entity_id"],
    )
    op.create_index(
        "ix_knowledge_relationships_source_document",
        "knowledge_relationships",
        ["source_document_id"],
    )
    op.create_check_constraint(
        f"ck_knowledge_relationships_type",
        "knowledge_relationships",
        f"relationship_type IN ({rel_list})",
    )
    op.create_check_constraint(
        "ck_knowledge_relationships_confidence_range",
        "knowledge_relationships",
        "confidence >= 0.0 AND confidence <= 1.0",
    )
    op.create_check_constraint(
        "ck_knowledge_relationships_no_self_loop",
        "knowledge_relationships",
        "source_entity_id <> target_entity_id",
    )
    # Avoid duplicate edges.
    op.create_index(
        "uq_knowledge_relationships_edge",
        "knowledge_relationships",
        ["owner_id", "source_entity_id", "target_entity_id", "relationship_type"],
        unique=True,
    )

    # ---------------------------------------------------------------
    # activity_logs
    # ---------------------------------------------------------------
    ACTIVITY_ACTIONS = (
        "document_uploaded", "document_processed", "document_deleted",
        "note_created", "note_updated", "note_deleted",
        "collection_created", "collection_renamed", "collection_deleted",
        "document_added_to_collection", "document_removed_from_collection",
        "ai_query_submitted", "summary_generated",
        "knowledge_graph_updated", "account_settings_changed",
        "account_disabled", "account_reactivated",
    )
    act_list = ", ".join(f"'{a}'" for a in ACTIVITY_ACTIONS)
    op.create_table(
        "activity_logs",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("action", sa.String(60), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=True),
        sa.Column("entity_id", sa.String(36), nullable=True),
        sa.Column("log_metadata", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_activity_logs_action", "activity_logs", ["action"]
    )
    op.create_index(
        "ix_activity_logs_created_at", "activity_logs", ["created_at"]
    )
    op.create_check_constraint(
        f"ck_activity_logs_action",
        "activity_logs",
        f"action IN ({act_list})",
    )

    # ---------------------------------------------------------------
    # audit_logs
    # ---------------------------------------------------------------
    AUDIT_ACTIONS = (
        "admin_login", "role_changed", "account_disabled",
        "account_reactivated", "account_deleted", "admin_action",
        "security_failure",
    )
    aud_list = ", ".join(f"'{a}'" for a in AUDIT_ACTIONS)
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("admin_user_id", sa.String(36), nullable=False),
        sa.Column("target_user_id", sa.String(36), nullable=True),
        sa.Column("action", sa.String(60), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("log_metadata", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["admin_user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["target_user_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_audit_logs_action", "audit_logs", ["action"]
    )
    op.create_index(
        "ix_audit_logs_created_at", "audit_logs", ["created_at"]
    )
    op.create_check_constraint(
        f"ck_audit_logs_action",
        "audit_logs",
        f"action IN ({aud_list})",
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("activity_logs")
    op.drop_table("knowledge_relationships")
    op.drop_table("knowledge_entities")
    op.drop_table("collection_documents")
    op.drop_table("research_collections")
