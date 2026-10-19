"""Enable pgvector and convert embedding_vector to native vector type.

On PostgreSQL this:
  1. Creates the pgvector extension (if available).
  2. Converts document_chunks.embedding_vector from TEXT to vector(384).
  3. Adds an HNSW index for cosine similarity search.

On SQLite (tests) this is a no-op since pgvector is unavailable.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0005_pgvector"
down_revision = "0004_rag_core"
branch_labels = None
depends_on = None

VECTOR_DIM = 384  # matches EMBEDDING_DIMENSION in app/services/embedding.py


def _is_postgresql() -> bool:
    bind = op.get_bind()
    return bind.dialect.name == "postgresql"


def upgrade() -> None:
    if not _is_postgresql():
        return

    # Enable the pgvector extension.
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Convert the embedding_vector column to native vector type.
    # Using USING to cast existing JSON text to vector.
    op.execute(
        f"""
        ALTER TABLE document_chunks
        ALTER COLUMN embedding_vector
        TYPE vector({VECTOR_DIM})
        USING embedding_vector::vector
        """
    )

    # Add an HNSW index for cosine similarity search.
    op.create_index(
        "ix_document_chunks_embedding_vector_hnsw",
        "document_chunks",
        ["embedding_vector"],
        postgresql_using="hnsw",
        postgresql_opcast={"embedding_vector": "vector_cosine_ops"},
    )


def downgrade() -> None:
    if not _is_postgresql():
        return

    op.drop_index(
        "ix_document_chunks_embedding_vector_hnsw",
        table_name="document_chunks",
        postgresql_using="hnsw",
    )

    op.execute(
        f"""
        ALTER TABLE document_chunks
        ALTER COLUMN embedding_vector
        TYPE text
        USING embedding_vector::text
        """
    )

    op.execute("DROP EXTENSION IF EXISTS vector")