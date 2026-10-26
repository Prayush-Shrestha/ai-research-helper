"""Research comparison service — compares two or more documents across
objectives, methodology, findings, datasets, limitations, and more.

Every comparison is grounded in the actual extracted text of the selected
documents and includes citations linking back to source documents.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.user import User
from app.schemas.phase3 import (
    CompareDocumentsIn,
    ComparisonSection,
    DocumentComparisonOut,
)
from app.services.embedding import EmbeddingService
from app.services.llm import DEFAULT_SYSTEM_PROMPT, LLMResult, LLMService, LLMServiceConfig
from app.services.vector_store import VectorStore

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _fetch_document_chunks(
    db: Session,
    owner: User,
    document_ids: list[str],
) -> list[dict]:
    """Fetch completed chunks for the given documents, owner-filtered."""
    from app.models.document import Document as DocModel

    # Authorize: user can only see their own documents (admin any).
    stmt = select(DocModel.id, DocModel.title).where(
        DocModel.id.in_(document_ids)
    )
    if not owner.is_admin:
        stmt = stmt.where(DocModel.owner_id == owner.id)
    doc_rows = list(db.execute(stmt).all())
    doc_map = {row[0]: row[1] for row in doc_rows}

    if not doc_map:
        return []

    chunk_stmt = select(
        DocumentChunk.id,
        DocumentChunk.document_id,
        DocumentChunk.text,
        DocumentChunk.page_number,
        DocumentChunk.chunk_index,
    ).where(
        DocumentChunk.document_id.in_(list(doc_map.keys())),
        DocumentChunk.chunk_status == "completed",
    )
    rows = list(db.execute(chunk_stmt).all())

    chunks = []
    for chunk_id, doc_id, text, page_number, chunk_index in rows:
        chunks.append(
            {
                "id": chunk_id,
                "document_id": doc_id,
                "document_title": doc_map.get(doc_id, "Unknown document"),
                "page_number": page_number,
                "chunk_index": chunk_index,
                "text": text,
                "similarity": 1.0,
            }
        )
    return chunks


def _build_comparison_prompt(
    question: str,
    chunks: list[dict],
    document_titles: list[str],
) -> str:
    """Build a structured comparison prompt for the LLM."""
    context_lines: list[str] = []
    citation_index = 0
    for chunk in chunks[:30]:  # limit context
        citation_index += 1
        title = chunk["document_title"]
        page = chunk["page_number"]
        page_str = f" (page {page})" if page is not None else ""
        context_lines.append(
            f"[Source {citation_index}] {title}{page_str}:\n"
            f"{chunk['text'][:700]}\n"
        )

    context = "\n".join(context_lines)

    return (
        f"Question: {question}\n\n"
        f"Relevant document excerpts:\n{context}\n\n"
        "Compare the documents across these dimensions:\n"
        "1. OBJECTIVES: What is each document trying to achieve?\n"
        "2. METHODOLOGY: What methods, datasets, and approaches are used?\n"
        "3. MAIN FINDINGS: What are the key results?\n"
        "4. DATASETS: What data sources are used?\n"
        "5. LIMITATIONS: What limitations are acknowledged?\n"
        "6. SIMILARITIES: What do the documents agree on?\n"
        "7. DIFFERENCES: Where do they disagree or differ?\n"
        "8. FUTURE RESEARCH: What future work is suggested?\n"
        "9. RESEARCH GAPS: What gaps are identified?\n\n"
        "Use ONLY the provided excerpts. Cite sources as [1], [2], etc.\n"
        "For each section, clearly indicate which document(s) the info comes from.\n"
        "If an excerpt doesn't contain enough info for a section, say so.\n"
        "Do not invent citations or page numbers.\n"
    )


def _parse_comparison_answer(
    answer: str,
    citations: list[dict],
) -> tuple[list[ComparisonSection], list[str], list[str], list[str]]:
    """Parse the LLM's structured comparison answer into sections,
    similarities, differences, and gaps."""
    sections: list[ComparisonSection] = []
    similarities: list[str] = []
    differences: list[str] = []
    gaps: list[str] = []

    current_section: ComparisonSection | None = None
    current_list: list[str] | None = None

    section_headers = {
        "objectives": "Objectives",
        "methodology": "Methodology",
        "main findings": "Main Findings",
        "datasets": "Datasets",
        "limitations": "Limitations",
        "similarities": None,  # goes to similarities list
        "differences": None,   # goes to differences list
        "future research": "Future Research",
        "research gaps": None,  # goes to gaps list
    }

    for line in answer.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        upper = stripped.upper()

        # Detect section headers.
        matched_header = None
        for key, label in section_headers.items():
            if upper.startswith(key.upper()):
                matched_header = key
                break

        if matched_header:
            # Save previous section.
            if current_section is not None:
                sections.append(current_section)
            if current_list is not None:
                # Lists are captured separately below.
                pass

            if matched_header == "similarities":
                current_section = None
                current_list = similarities
            elif matched_header == "differences":
                current_section = None
                current_list = differences
            elif matched_header == "research gaps":
                current_section = None
                current_list = gaps
            else:
                current_section = ComparisonSection(
                    title=section_headers[matched_header],
                    content="",
                    citations=[],
                )
                current_list = None
            continue

        # Bullet points within sections.
        if stripped.startswith("-") or stripped.startswith("•"):
            content = stripped[1:].strip()
            if current_section is not None:
                current_section.content += (
                    ("\n" if current_section.content else "") + content
                )
                # Extract citation numbers.
                for m in re.finditer(r"\[(\d+)\]", content):
                    idx = int(m.group(1)) - 1
                    if 0 <= idx < len(citations):
                        current_section.citations.append(
                            citations[idx].get("document_title", f"Source {idx + 1}")
                        )
            elif current_list is not None:
                current_list.append(content)
            continue

        # Continuation of current section content.
        if current_section is not None:
            current_section.content += (
                ("\n" if current_section.content else "") + stripped
            )

    # Save last section.
    if current_section is not None:
        sections.append(current_section)

    return sections, similarities, differences, gaps


class ResearchComparisonService:
    def __init__(
        self,
        llm_service: LLMService,
    ) -> None:
        self._llm = llm_service

    def compare_documents(
        self,
        db: Session,
        owner: User,
        *,
        document_ids: list[str],
    ) -> DocumentComparisonOut:
        """Generate a structured comparison of the selected documents."""
        if len(document_ids) < 2:
            raise ValueError("At least 2 documents are required for comparison.")

        chunks = _fetch_document_chunks(db, owner, document_ids)
        if not chunks:
            # Return an empty-but-valid comparison.
            doc_titles: list[str] = []
            from app.models.document import Document as DocModel

            stmt = select(DocModel.title).where(
                DocModel.id.in_(document_ids)
            )
            if not owner.is_admin:
                stmt = stmt.where(DocModel.owner_id == owner.id)
            rows = list(db.execute(stmt).all())
            doc_titles = [r[0] for r in rows]
            return DocumentComparisonOut(
                document_ids=document_ids,
                document_titles=doc_titles,
                sections=[
                    ComparisonSection(
                        title="No Content",
                        content=(
                            "No indexed text found for the selected documents. "
                            "Ensure they have been processed and indexed first."
                        ),
                        citations=[],
                    )
                ],
                model=self._llm.model_name(),
                provider=self._llm.provider_name(),
                created_at=_utcnow(),
            )

        doc_titles = list({c["document_title"] for c in chunks})
        document_titles_sorted = sorted(doc_titles)

        question = (
            f"Compare these {len(document_ids)} documents: "
            + ", ".join(document_titles_sorted)
        )

        system_prompt = _build_comparison_prompt(
            question, chunks, document_titles_sorted
        )

        try:
            result: LLMResult = self._llm.generate_answer(
                question=question,
                chunks=chunks,
                system_prompt=system_prompt,
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Document comparison failed")
            raise RuntimeError(f"Comparison generation failed: {exc}") from exc

        sections, similarities, differences, gaps = _parse_comparison_answer(
            result.answer, result.citations
        )

        # If no sections were parsed, put the whole answer in one section.
        if not sections:
            sections = [
                ComparisonSection(
                    title="Comparison",
                    content=result.answer,
                    citations=[
                        c.get("document_title", "Unknown")
                        for c in result.citations[:5]
                    ],
                )
            ]

        # Dedupe citation titles per section.
        for section in sections:
            seen: set[str] = set()
            section.citations = [c for c in section.citations if not (c in seen or seen.add(c))]

        return DocumentComparisonOut(
            document_ids=document_ids,
            document_titles=document_titles_sorted,
            sections=sections,
            similarities=similarities,
            differences=differences,
            research_gaps=gaps,
            model=result.model,
            provider=result.provider,
            tokens_estimate=result.tokens_estimate,
            created_at=_utcnow(),
        )


def create_comparison_service(
    settings,
) -> ResearchComparisonService:
    """Factory: build a ResearchComparisonService from settings."""
    llm_service = LLMService(
        LLMServiceConfig(
            provider=settings.LLM_PROVIDER,
            model=settings.LLM_MODEL,
            api_key=settings.openai_api_key,
            base_url=settings.OPENAI_BASE_URL,
            timeout=settings.RAG_REQUEST_TIMEOUT,
        )
    )
    return ResearchComparisonService(llm_service=llm_service)
