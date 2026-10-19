"""Vector store for RAG document chunks.

Supports two backends:
- ``pgvector`` (PostgreSQL only) — native cosine similarity with an index.
- ``json`` fallback — stores embeddings as JSON text and computes cosine
  similarity in Python. Used with SQLite in tests and as a safe fallback.

The store never exposes raw document text in logs and enforces that queries
are always filtered by owner_id / authorized document IDs before returning
content.
"""

from __future__ import annotations

import json
import logging
import math
from typing import Protocol

import sqlalchemy as sa
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings

logger = logging.getLogger(__name__)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine similarity between two vectors (both assumed non-empty)."""
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a)) or 1.0
    norm_b = math.sqrt(sum(x * x for x in b)) or 1.0
    return dot / (norm_a * norm_b)


def _parse_vector(vector_text: str | None) -> list[float] | None:
    """Parse a JSON-stored embedding vector back into a list of floats."""
    if not vector_text:
        return None
    try:
        return [float(x) for x in json.loads(vector_text)]
    except (ValueError, TypeError):
        return None


class VectorStore:
    """Abstract interface for storing and searching chunk embeddings."""

    async def upsert_chunks(
        self,
        db: Session,
        chunks: list[tuple[str, str, list[float]]],
    ) -> None:
        """Store or update chunk embeddings.

        Each item is (chunk_id, embedding_vector_json, embedding_vector).
        """
        raise NotImplementedError

    async def similarity_search(
        self,
        db: Session,
        *,
        query_vector: list[float],
        document_ids: list[str] | None = None,
        owner_id: str | None = None,
        top_k: int = 5,
        threshold: float = 0.0,
    ) -> list[tuple[str, float, str | None, int | None]]:
        """Return (chunk_id, similarity, text, page_number) for top matches.

        Results are always filtered to chunks the caller is authorized to
        see (via document_ids and/or owner_id).
        """
        raise NotImplementedError

    async def delete_chunks_for_document(
        self, db: Session, document_id: str
    ) -> None:
        """Remove all chunk embeddings for a document."""
        raise NotImplementedError

    def provider_name(self) -> str:
        raise NotImplementedError


class JsonVectorStore(VectorStore):
    """JSON-text fallback store.

    Embeddings are stored as JSON text in the ``embedding_vector`` column.
    Similarity is computed in Python after loading all candidate chunks.
    Suitable for SQLite (tests) and as a safe production fallback.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def upsert_chunks(
        self,
        db: Session,
        chunks: list[tuple[str, str, list[float]]],
    ) -> None:
        from app.models.document_chunk import DocumentChunk

        for chunk_id, vector_json, _vector in chunks:
            chunk = db.get(DocumentChunk, chunk_id)
            if chunk is None:
                continue
            chunk.embedding_vector = vector_json
            db.add(chunk)
        db.commit()

    async def similarity_search(
        self,
        db: Session,
        *,
        query_vector: list[float],
        document_ids: list[str] | None = None,
        owner_id: str | None = None,
        top_k: int = 5,
        threshold: float = 0.0,
    ) -> list[tuple[str, float, str | None, int | None]]:
        from app.models.document_chunk import DocumentChunk

        stmt = select(
            DocumentChunk.id,
            DocumentChunk.embedding_vector,
            DocumentChunk.text,
            DocumentChunk.page_number,
        ).where(DocumentChunk.chunk_status == "completed")

        if document_ids is not None:
            stmt = stmt.where(DocumentChunk.document_id.in_(document_ids))
        if owner_id is not None:
            stmt = stmt.where(DocumentChunk.owner_id == owner_id)

        rows = list(db.execute(stmt).all())
        scored: list[tuple[str, float, str | None, int | None]] = []
        for chunk_id, vector_json, text, page_number in rows:
            vector = _parse_vector(vector_json)
            if vector is None:
                continue
            sim = _cosine_similarity(query_vector, vector)
            if sim < threshold:
                continue
            scored.append((chunk_id, sim, text, page_number))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    async def delete_chunks_for_document(
        self, db: Session, document_id: str
    ) -> None:
        from app.models.document_chunk import DocumentChunk

        db.execute(
            sa.delete(DocumentChunk).where(
                DocumentChunk.document_id == document_id
            )
        )
        db.commit()

    def provider_name(self) -> str:
        return "json"


class PgVectorStore(VectorStore):
    """pgvector-backed store (PostgreSQL only).

    Requires the pgvector extension enabled on the database and the
    ``embedding_vector`` column migrated to ``vector`` type. Falls back to
    JSON in-Python search if the column isn't a vector type yet.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _is_vector_column(self, db: Session) -> bool:
        """Check whether embedding_vector is already a native vector column."""
        bind = db.get_bind()
        if bind.dialect.name != "postgresql":
            return False
        result = db.execute(
            sa.text(
                "SELECT data_type FROM information_schema.columns "
                "WHERE table_name='document_chunks' "
                "AND column_name='embedding_vector'"
            )
        )
        row = result.fetchone()
        return row is not None and row[0] == "user-defined"

    async def upsert_chunks(
        self,
        db: Session,
        chunks: list[tuple[str, str, list[float]]],
    ) -> None:
        if self._is_vector_column(db):
            # Store vectors natively; pgvector auto-casts text like '[0.1,0.2]' to vector.
            from app.models.document_chunk import DocumentChunk

            for chunk_id, vector_json, _vector in chunks:
                chunk = db.get(DocumentChunk, chunk_id)
                if chunk is None:
                    continue
                chunk.embedding_vector = vector_json
                db.add(chunk)
            db.commit()
        else:
            await JsonVectorStore(self._settings).upsert_chunks(db, chunks)

    async def similarity_search(
        self,
        db: Session,
        *,
        query_vector: list[float],
        document_ids: list[str] | None = None,
        owner_id: str | None = None,
        top_k: int = 5,
        threshold: float = 0.0,
    ) -> list[tuple[str, float, str | None, int | None]]:
        if self._is_vector_column(db):
            return await self._similarity_search_pgvector(
                db,
                query_vector=query_vector,
                document_ids=document_ids,
                owner_id=owner_id,
                top_k=top_k,
                threshold=threshold,
            )
        return await JsonVectorStore(self._settings).similarity_search(
            db,
            query_vector=query_vector,
            document_ids=document_ids,
            owner_id=owner_id,
            top_k=top_k,
            threshold=threshold,
        )

    async def _similarity_search_pgvector(
        self,
        db: Session,
        *,
        query_vector: list[float],
        document_ids: list[str] | None = None,
        owner_id: str | None = None,
        top_k: int = 5,
        threshold: float = 0.0,
    ) -> list[tuple[str, str | None, int | None]]:
        from app.models.document_chunk import DocumentChunk

        # query_vector as a pgvector literal: '[0.1,0.2,...]'
        q = "[" + ",".join(str(v) for v in query_vector) + "]"

        conditions = ["chunk_status = 'completed'"]
        params: dict = {"query": q, "top_k": top_k, "threshold": threshold}

        if document_ids is not None:
            conditions.append("document_id = ANY(:doc_ids)")
            params["doc_ids"] = document_ids
        if owner_id is not None:
            conditions.append("owner_id = :owner_id")
            params["owner_id"] = owner_id

        where_clause = " AND ".join(conditions)

        sql = f"""
            SELECT id,
                   1 - (embedding_vector <=> :query::vector) AS similarity,
                   text,
                   page_number
            FROM document_chunks
            WHERE {where_clause}
              AND 1 - (embedding_vector <=> :query::vector) >= :threshold
            ORDER BY embedding_vector <=> :query::vector
            LIMIT :top_k
        """

        rows = db.execute(sa.text(sql), params).fetchall()
        return [
            (row[0], float(row[1]), row[2], row[3]) for row in rows
        ]

    async def delete_chunks_for_document(
        self, db: Session, document_id: str
    ) -> None:
        if self._is_vector_column(db):
            from app.models.document_chunk import DocumentChunk

            db.execute(
                sa.delete(DocumentChunk).where(
                    DocumentChunk.document_id == document_id
                )
            )
            db.commit()
        else:
            await JsonVectorStore(self._settings).delete_chunks_for_document(
                db, document_id
            )

    def provider_name(self) -> str:
        return "pgvector"


def create_vector_store(settings: Settings) -> VectorStore:
    """Factory: prefer pgvector when available on PostgreSQL, else JSON."""
    db_url = settings.DATABASE_URL
    if "postgresql" in db_url:
        try:
            import pgvector  # noqa: F401

            return PgVectorStore(settings)
        except ImportError:
            logger.warning(
                "pgvector not installed; falling back to JSON vector store. "
                "Install pgvector for native vector search."
            )
    return JsonVectorStore(settings)
