"""RAG question-answering service.

Retrieves relevant authorized chunks, generates a grounded answer with
citations, and persists the conversation turn. Treats document text as
untrusted — never passes it into the system prompt.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import cast

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.ai_usage import AIUsage
from app.models.document import Document
from app.models.document import Document as DocModel
from app.models.document_chunk import DocumentChunk
from app.models.user import User
from app.services import conversation as conversation_service_mod
from app.services import embedding as embedding_service_mod
from app.services import indexing as indexing_mod
from app.services import vector_store as vs_mod
from app.services.conversation import ConversationService
from app.services.embedding import EmbeddingService
from app.services.indexing import IndexingService
from app.services.llm import DEFAULT_SYSTEM_PROMPT, LLMResult, LLMService, LLMServiceConfig
from app.services.vector_store import VectorStore
from app.schemas.research import (
    CitationOut,
    KeyPoint,
    KnowledgeNode,
    KnowledgeOut,
    SummarizeOut,
)

logger = logging.getLogger(__name__)


class RAGService:
    def __init__(
        self,
        settings: Settings,
        emb_service: EmbeddingService,
        llm_service: LLMService,
        vector_store: VectorStore,
        indexing_service: IndexingService,
        conversation_service: ConversationService,
    ) -> None:
        self._settings = settings
        self._emb = emb_service
        self._llm = llm_service
        self._vs = vector_store
        self._indexing = indexing_service
        self._conv = conversation_service

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def ask(
        self,
        db: Session,
        owner: User,
        *,
        question: str,
        conversation_id: str | None = None,
        document_ids: list[str] | None = None,
    ) -> tuple[LLMResult, str]:
        """Ask a question. Returns (result, conversation_id)."""
        question = question.strip()
        if not question:
            raise ValueError("Question is empty.")
        if len(question) > self._settings.RAG_MAX_QUESTION_CHARS:
            raise ValueError(
                f"Question too long (max {self._settings.RAG_MAX_QUESTION_CHARS} characters)."
            )

        # Resolve conversation.
        if conversation_id:
            conv = self._conv.get_conversation(db, owner, conversation_id)
            if conv is None:
                raise ValueError("Conversation not found.")
            if document_ids is None:
                try:
                    document_ids = json.loads(conv.document_ids or "[]")
                except json.JSONDecodeError:
                    document_ids = []
        else:
            conv = self._conv.create_conversation(
                db,
                owner,
                title=question[:60],
                document_ids=document_ids or [],
            )
            conversation_id = conv.id

        # Authorize document_ids: user can only scope to their own documents
        # (admin can use any).
        if document_ids:
            document_ids = self._authorized_document_ids(db, owner, document_ids)

        # Embed the question (truly async → run in event loop).
        try:
            query_vector = self._embed_question(question)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Question embedding failed")
            raise RuntimeError(f"Failed to embed question: {exc}") from exc

        # Retrieve chunks (vector store methods are sync-in-nature).
        top_k = min(self._settings.RAG_TOP_K, 10)
        threshold = self._settings.RAG_SIMILARITY_THRESHOLD
        raw_results = self._vs.similarity_search(
            db,
            query_vector=query_vector,
            document_ids=document_ids if document_ids else None,
            owner_id=owner.id,
            top_k=top_k,
            threshold=threshold,
        )

        # Build chunk dicts for the LLM.
        chunks = self._build_chunks(db, raw_results)

        # Generate answer (truly async provider → run in event loop).
        try:
            result = self._generate_answer(
                question=question, chunks=chunks
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("LLM answer generation failed")
            raise RuntimeError(f"Failed to generate answer: {exc}") from exc

        # Persist conversation turns.
        citations_serializable = [
            {
                "chunk_id": c.chunk_id,
                "document_id": c.document_id,
                "document_title": c.document_title,
                "page_number": c.page_number,
                "text_snippet": c.text_snippet,
                "similarity": c.similarity,
            }
            for c in result.citations
        ]

        self._conv.add_message(
            db, conv, role="user", content=question
        )
        self._conv.add_message(
            db,
            conv,
            role="assistant",
            content=result.answer,
            citations=citations_serializable,
        )

        # Track AI usage.
        if self._settings.RAG_TRACK_USAGE:
            self._track_usage(
                db,
                owner,
                operation_type="llm",
                provider=result.provider,
                model=result.model,
                tokens_estimate=result.tokens_estimate,
            )

        return result, conversation_id

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _authorized_document_ids(
        self, db: Session, owner: User, document_ids: list[str]
    ) -> list[str]:
        from app.models.document import Document as DocModel

        stmt = select(DocModel.id).where(DocModel.id.in_(document_ids))
        if not owner.is_admin:
            stmt = stmt.where(DocModel.owner_id == owner.id)
        rows = db.execute(stmt).all()
        return [row[0] for row in rows]

    def _embed_question(self, text: str) -> list[float]:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        vectors = loop.run_until_complete(self._emb.embed_texts([text]))
        return vectors[0]

    def _build_chunks(
        self,
        db: Session,
        raw_results: list[tuple[str, float, str | None, int | None]],
    ) -> list[dict]:
        # raw_results: (chunk_id, similarity, text, page_number)
        # We need document_id + document_title for each chunk.
        chunk_ids = [r[0] for r in raw_results]
        if not chunk_ids:
            return []

        from app.models.document import Document as DocModel

        rows = db.execute(
            select(
                DocumentChunk.id,
                DocumentChunk.document_id,
                DocModel.title,
            ).join(DocModel, DocModel.id == DocumentChunk.document_id)
            .where(DocumentChunk.id.in_(chunk_ids))
        ).all()
        meta_by_id = {row[0]: (row[1], row[2]) for row in rows}

        chunks: list[dict] = []
        for chunk_id, sim, text, page_number in raw_results:
            doc_id, title = meta_by_id.get(chunk_id, ("", "Unknown document"))
            chunks.append(
                {
                    "id": chunk_id,
                    "document_id": doc_id,
                    "document_title": title,
                    "page_number": page_number,
                    "text": text or "",
                    "similarity": sim,
                }
            )
        return chunks

    def _generate_answer(
        self,
        *,
        question: str,
        chunks: list[dict],
    ) -> LLMResult:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(
            self._llm.generate_answer(
                question=question,
                chunks=chunks,
                system_prompt=DEFAULT_SYSTEM_PROMPT,
            )
        )

    def _track_usage(
        self,
        db: Session,
        owner: User,
        *,
        operation_type: str,
        provider: str,
        model: str,
        tokens_estimate: int | None,
    ) -> None:
        usage = AIUsage(
            owner_id=owner.id,
            operation_type=operation_type,
            provider=provider,
            model=model,
            tokens_estimate=tokens_estimate,
        )
        db.add(usage)
        db.commit()

    # Indexing delegation ------------------------------------------------

    def get_indexing_status(
        self, db: Session, document_id: str, owner: User
    ) -> str | None:
        doc = db.query(Document).filter(Document.id == document_id)
        if not owner.is_admin:
            doc = doc.filter(Document.owner_id == owner.id)
        doc = doc.first()
        if doc is None:
            return None
        return doc.indexing_status

    def reindex_document(
        self, db: Session, document: Document, owner: User
    ):
        return indexing_mod.IndexingService(
            settings=self._settings,
            emb_service=self._emb,
            vector_store=self._vs,
        ).index_document(db, document, owner)

    # ------------------------------------------------------------------
    # Summarization
    # ------------------------------------------------------------------

    def summarize_document(
        self,
        db: Session,
        owner: User,
        *,
        document_ids: list[str] | None = None,
    ) -> SummarizeOut:
        """Generate a summary, key points, and study questions for documents."""
        from app.models.document_chunk import DocumentChunk

        # Resolve document IDs (owner-filtered).
        if document_ids:
            document_ids = self._authorized_document_ids(db, owner, document_ids)
        else:
            stmt = select(DocModel.id).where(DocModel.owner_id == owner.id)
            rows = db.execute(stmt).all()
            document_ids = [row[0] for row in rows]

        if not document_ids:
            return SummarizeOut(
                summary="No documents found to summarize.",
                key_points=[],
                study_questions=[],
                model=self._llm.model_name(),
                provider=self._settings.LLM_PROVIDER,
                citations=[],
            )

        # Fetch completed chunks for the documents.
        stmt = (
            select(DocumentChunk, DocModel.title)
            .join(DocModel, DocModel.id == DocumentChunk.document_id)
            .where(
                DocumentChunk.document_id.in_(document_ids),
                DocumentChunk.chunk_status == "completed",
            )
        )
        rows = list(db.execute(stmt).all())
        if not rows:
            return SummarizeOut(
                summary="No indexed chunks found for these documents.",
                key_points=[],
                study_questions=[],
                model=self._llm.model_name(),
                provider=self._settings.LLM_PROVIDER,
                citations=[],
            )

        chunks = []
        for chunk, title in rows:
            chunks.append(
                {
                    "id": chunk.id,
                    "document_id": chunk.document_id,
                    "document_title": title,
                    "page_number": chunk.page_number,
                    "text": chunk.text,
                    "similarity": 1.0,
                }
            )

        # Generate a structured summary via the LLM.
        summary_prompt = (
            "You are a research assistant. Summarize the following document excerpts. "
            "Provide exactly three sections:\n"
            "1. SUMMARY: a concise 2-4 sentence summary.\n"
            "2. KEY POINTS: 3-5 bullet points, each starting with '-'.\n"
            "3. STUDY QUESTIONS: 3 bullet questions, each starting with '-'.\n"
            "Use ONLY the provided excerpts. Do not invent facts."
        )

        try:
            result = self._llm.generate_answer(
                question="Summarize these documents.",
                chunks=chunks[:20],
                system_prompt=summary_prompt,
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Summarization failed")
            raise RuntimeError(f"Failed to summarize: {exc}") from exc

        answer = result.answer
        summary = answer
        key_points: list[KeyPoint] = []
        study_questions: list[str] = []

        current_section = None
        for line in answer.split("\n"):
            stripped = line.strip()
            upper = stripped.upper()
            if upper.startswith("SUMMARY:"):
                current_section = "summary"
                summary = stripped[len("SUMMARY:"):].strip()
            elif upper.startswith("KEY POINTS:"):
                current_section = "key_points"
            elif upper.startswith("STUDY QUESTIONS:"):
                current_section = "study_questions"
            elif current_section == "key_points" and stripped.startswith("-"):
                key_points.append(
                    KeyPoint(point=stripped[1:].strip(), page_number=None)
                )
            elif current_section == "study_questions" and stripped.startswith("-"):
                study_questions.append(stripped[1:].strip())

        citations = [
            CitationOut(
                chunk_id=c.get("chunk_id", ""),
                document_id=c.get("document_id", ""),
                document_title=c.get("document_title", "Unknown document"),
                page_number=c.get("page_number"),
                text_snippet=c.get("text", "")[:200],
                similarity=c.get("similarity", 0.0),
            )
            for c in chunks[:5]
        ]

        return SummarizeOut(
            summary=summary,
            key_points=key_points,
            study_questions=study_questions,
            model=result.model,
            provider=result.provider,
            citations=citations,
        )

    # ------------------------------------------------------------------
    # Knowledge graph
    # ------------------------------------------------------------------

    def build_knowledge_graph(
        self,
        db: Session,
        owner: User,
    ) -> KnowledgeOut:
        """Build a simple topic-clustering knowledge graph from documents."""
        import re

        stmt = select(DocModel.id, DocModel.title, DocModel.extracted_text)
        if not owner.is_admin:
            stmt = stmt.where(DocModel.owner_id == owner.id)
        rows = list(db.execute(stmt).all())

        if not rows:
            return KnowledgeOut(nodes=[], edges=[])

        def terms(text: str | None) -> set[str]:
            if not text:
                return set()
            return set(re.findall(r"[a-z0-9]{4,}", text.lower()))

        doc_terms = [(doc_id, title, terms(text)) for doc_id, title, text in rows]

        nodes = [
            KnowledgeNode(
                id=doc_id,
                label=title or "Untitled",
                size=len(term_set),
                document_ids=[doc_id],
            )
            for doc_id, title, term_set in doc_terms
        ]

        edges = []
        for i in range(len(doc_terms)):
            for j in range(i + 1, len(doc_terms)):
                id_i, _, terms_i = doc_terms[i]
                id_j, _, terms_j = doc_terms[j]
                if not terms_i or not terms_j:
                    continue
                overlap = len(terms_i & terms_j)
                union = len(terms_i | terms_j)
                if union == 0:
                    continue
                weight = overlap / union
                if weight > 0.15:
                    edges.append(
                        KnowledgeEdge(
                            source=id_i, target=id_j, weight=round(weight, 2)
                        )
                    )

        return KnowledgeOut(nodes=nodes, edges=edges)


def create_rag_service(
    settings: Settings,
) -> RAGService:
    emb_service = embedding_service_mod.EmbeddingService(
        embedding_service_mod.EmbeddingServiceConfig(
            provider=settings.EMBEDDING_PROVIDER,
            model=settings.EMBEDDING_MODEL,
            api_key=settings.openai_api_key,
            base_url=settings.OPENAI_BASE_URL,
            timeout=settings.RAG_REQUEST_TIMEOUT,
        )
    )
    llm_service = LLMService(
        LLMServiceConfig(
            provider=settings.LLM_PROVIDER,
            model=settings.LLM_MODEL,
            api_key=settings.openai_api_key,
            base_url=settings.OPENAI_BASE_URL,
            timeout=settings.RAG_REQUEST_TIMEOUT,
        )
    )
    vector_store = vs_mod.create_vector_store(settings)
    indexing_service = indexing_mod.IndexingService(
        settings=settings,
        emb_service=emb_service,
        vector_store=vector_store,
    )
    conversation_service = conversation_service_mod.create_conversation_service()
    return RAGService(
        settings=settings,
        emb_service=emb_service,
        llm_service=llm_service,
        vector_store=vector_store,
        indexing_service=indexing_service,
        conversation_service=conversation_service,
    )
