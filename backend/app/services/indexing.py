"""Document indexing service — ties chunking, embeddings, and vector store
together for RAG ingestion.

Handles:
- Splitting extracted text into chunks (with page numbers when available).
- Generating embeddings per chunk.
- Storing embeddings in the vector store.
- Tracking indexing_status on the Document model (pending → processing →
  completed | failed).
- Safe retry: re-indexing a document replaces its chunks (no duplicates).
- Never claims a document is indexed when indexing failed.
"""

from __future__ import annotations

import json
import logging
from typing import Protocol

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.user import User
from app.services import chunking, embedding as embedding_service, vector_store as vs
from app.services.chunking import DocumentChunk as ChunkData

logger = logging.getLogger(__name__)


class IndexingServiceProtocol(Protocol):
    async def index_document(
        self,
        db: Session,
        document: Document,
        owner: User,
    ) -> Document:
        ...

    async def reindex_document(
        self,
        db: Session,
        document: Document,
        owner: User,
    ) -> Document:
        ...

    def get_indexing_status(self, db: Session, document_id: str) -> str | None:
        ...


class IndexingService:
    def __init__(
        self,
        settings: Settings,
        emb_service: embedding_service.EmbeddingService,
        vector_store: vs.VectorStore,
    ) -> None:
        self._settings = settings
        self._emb = emb_service
        self._vs = vector_store

    async def index_document(
        self,
        db: Session,
        document: Document,
        owner: User,
    ) -> Document:
        """Index a document's extracted text into chunks + embeddings.

        Idempotent: re-indexing replaces existing chunks for the document.
        """
        # Reset status to processing at the start.
        document.indexing_status = "processing"
        document.indexing_error = None
        db.add(document)
        db.commit()

        text = document.extracted_text
        if not text or not text.strip():
            document.indexing_status = "failed"
            document.indexing_error = "No extractable text to index."
            db.add(document)
            db.commit()
            logger.warning(
                "Document %s has no text; marking indexing failed.",
                document.id,
            )
            return document

        # Chunk the text.
        try:
            chunks = chunking.chunk_document(
                document_id=document.id,
                owner_id=owner.id,
                document_title=document.title,
                file_type=document.file_type,
                text=text,
                chunk_size=self._settings.RAG_CHUNK_SIZE,
                overlap=self._settings.RAG_CHUNK_OVERLAP,
                metadata={
                    "file_type": document.file_type,
                    "file_size": document.file_size,
                },
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Chunking failed for document %s", document.id)
            document.indexing_status = "failed"
            document.indexing_error = f"Chunking failed: {exc}"
            db.add(document)
            db.commit()
            return document

        if not chunks:
            document.indexing_status = "failed"
            document.indexing_error = "Document produced no indexable chunks."
            db.add(document)
            db.commit()
            return document

        # Delete any existing chunks for this document (safe re-index).
        await self._vs.delete_chunks_for_document(db, document.id)

        # Persist chunk rows first (so we have chunk IDs).
        chunk_rows: list[DocumentChunk] = []
        for ch in chunks:
            row = DocumentChunk(
                document_id=document.id,
                owner_id=owner.id,
                chunk_index=ch.chunk_index,
                text=ch.text,
                page_number=ch.page_number,
                start_char=ch.start_char,
                end_char=ch.end_char,
                embedding_model=self._settings.EMBEDDING_MODEL,
                chunk_status="pending",
            )
            db.add(row)
            chunk_rows.append(row)
        db.commit()
        for row in chunk_rows:
            db.refresh(row)

        # Generate embeddings in batches.
        texts = [c.text for c in chunks]
        try:
            vectors = await self._emb.embed_texts(texts)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Embedding failed for document %s", document.id)
            # Mark chunks as failed but keep rows for debugging.
            for row in chunk_rows:
                row.chunk_status = "failed"
                row.chunk_error = str(exc)
            db.add_all(chunk_rows)
            db.commit()
            document.indexing_status = "failed"
            document.indexing_error = f"Embedding failed: {exc}"
            db.add(document)
            db.commit()
            return document

        # Upsert embeddings into the vector store.
        upsert_items: list[tuple[str, str, list[float]]] = []
        for row, chunk, vector in zip(chunk_rows, chunks, vectors):
            vector_json = json.dumps(vector)
            upsert_items.append((row.id, vector_json, vector))
            row.embedding_vector = vector_json
            row.chunk_status = "completed"
        try:
            await self._vs.upsert_chunks(db, upsert_items)
            db.add_all(chunk_rows)
            db.commit()
        except Exception as exc:  # noqa: BLE001
            logger.exception("Vector store upsert failed for document %s", document.id)
            for row in chunk_rows:
                row.chunk_status = "failed"
                row.chunk_error = str(exc)
            db.add_all(chunk_rows)
            db.commit()
            document.indexing_status = "failed"
            document.indexing_error = f"Vector store failed: {exc}"
            db.add(document)
            db.commit()
            return document

        # Mark document indexing completed.
        document.indexing_status = "completed"
        document.indexing_error = None
        document.embedding_model = self._settings.EMBEDDING_MODEL
        db.add(document)
        db.commit()
        db.refresh(document)

        logger.info(
            "Indexed document %s: %d chunks, model=%s",
            document.id,
            len(chunks),
            self._settings.EMBEDDING_MODEL,
        )
        return document

    async def reindex_document(
        self,
        db: Session,
        document: Document,
        owner: User,
    ) -> Document:
        """Alias for index_document — always replaces chunks."""
        return await self.index_document(db, document, owner)

    def get_indexing_status(self, db: Session, document_id: str) -> str | None:
        doc = db.get(Document, document_id)
        if doc is None:
            return None
        return doc.indexing_status


def create_indexing_service(
    settings: Settings,
) -> IndexingService:
    emb_service = embedding_service.EmbeddingService(
        embedding_service.EmbeddingServiceConfig(
            provider=settings.EMBEDDING_PROVIDER,
            model=settings.EMBEDDING_MODEL,
            api_key=settings.openai_api_key,
            base_url=settings.OPENAI_BASE_URL,
            timeout=settings.RAG_REQUEST_TIMEOUT,
        )
    )
    vector_store = vs.create_vector_store(settings)
    return IndexingService(
        settings=settings,
        emb_service=emb_service,
        vector_store=vector_store,
    )
