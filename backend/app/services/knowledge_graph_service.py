"""Knowledge graph service: entity extraction, relationship extraction,
and graph queries with full source traceability.

Entity extraction uses lightweight, dependency-free NLP:
- Capitalized multi-word phrases (people, organizations, technologies)
- Domain keywords from research text
- Co-occurrence analysis within chunks

Every entity and relationship retains a reference to its source document
and, where available, the relevant text chunk and page number. Confidence
scores and an is_inferred flag distinguish observed facts from inferences.
"""

from __future__ import annotations

import json
import logging
import re
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.phase3 import KnowledgeEntity, KnowledgeRelationship
from app.models.user import User
from app.schemas.phase3 import KnowledgeEntityFilter, KnowledgeGraphOut
from app.services import activity_service

logger = logging.getLogger(__name__)

ENTITY_TYPES = (
    "person", "organization", "technology", "research_topic",
    "scientific_concept", "dataset", "method", "keyword",
)

RELATIONSHIP_TYPES = (
    "related_to", "mentions", "references", "uses_method",
    "uses_dataset", "part_of", "contradicts", "supports",
)

# Stop words to filter out from keyword extraction.
_STOP_WORDS = {
    "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "as", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "can", "this", "that", "these", "those",
    "a", "an", "it", "its", "they", "them", "their", "we", "our", "you",
    "your", "i", "he", "she", "his", "her", "not", "no", "yes", "if", "then",
    "else", "when", "where", "why", "how", "all", "each", "every", "some",
    "any", "many", "much", "more", "most", "other", "such", "only", "own",
    "same", "so", "than", "too", "very", "just", "also", "now", "here",
    "there", "one", "two", "three", "first", "last", "new", "old", "good",
    "bad", "big", "small", "large", "little", "high", "low", "long", "short",
    "study", "paper", "research", "article", "journal", "conference",
    "abstract", "introduction", "conclusion", "section", "chapter",
    "figure", "table", "page", "et", "al",
}

# Minimum token length for keywords.
_MIN_KEYWORD_LEN = 5


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _extract_entities_from_text(
    text: str,
    document_id: str | None,
    chunk_id: str | None,
    page_number: int | None,
    owner_id: str,
) -> list[dict[str, Any]]:
    """Extract candidate entities from a single chunk of text.

    Uses a combination of:
    1. Capitalized multi-word phrases (likely people, organizations,
       technologies, proper nouns).
    2. Significant keywords (noun-like terms of 5+ chars that aren't
       stop words).
    """
    if not text or not text.strip():
        return []

    entities: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()

    # --- 1. Capitalized multi-word phrases (proper nouns) ---
    # Match sequences of 2-4 capitalized words, optionally with
    # internal hyphens or apostrophes.
    cap_phrase_re = re.compile(
        r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b"
    )
    for match in cap_phrase_re.finditer(text):
        phrase = match.group(1).strip()
        # Skip common false positives at sentence starts.
        if phrase.lower() in _STOP_WORDS:
            continue
        key = (phrase.lower(), "organization")
        if key in seen:
            continue
        seen.add(key)
        entities.append(
            {
                "name": phrase,
                "entity_type": "organization",
                "description": None,
                "source_document_id": document_id,
                "source_chunk_id": chunk_id,
                "source_page_number": page_number,
                "source_text_snippet": _snippet(text, match.start(), match.end()),
                "confidence": 0.65,
                "is_inferred": False,
                "owner_id": owner_id,
            }
        )

    # --- 2. Significant keywords (potential concepts, technologies,
    #     methods, datasets) ---
    # Extract word-ish tokens of 5+ chars, lowercase, filter stop words.
    token_re = re.compile(r"\b[a-zA-Z][a-zA-Z0-9\-]{4,}\b")
    token_counts: dict[str, int] = defaultdict(int)
    for match in token_re.finditer(text.lower()):
        token = match.group(0)
        if token in _STOP_WORDS:
            continue
        token_counts[token] += 1

    # Only keep tokens that appear at least once (significant terms).
    for token, count in token_counts.items():
        # Skip if this token is part of an already-captured phrase.
        if any(token in phrase.lower() for phrase, _ in seen):
            continue
        key = (token, "research_topic")
        if key in seen:
            continue
        seen.add(key)
        confidence = min(0.55 + 0.05 * min(count, 5), 0.85)
        entities.append(
            {
                "name": token,
                "entity_type": "research_topic",
                "description": None,
                "source_document_id": document_id,
                "source_chunk_id": chunk_id,
                "source_page_number": page_number,
                "source_text_snippet": _snippet(text, match.start(), match.end()) if False else None,
                "confidence": confidence,
                "is_inferred": True,
                "owner_id": owner_id,
            }
        )

    return entities


def _snippet(text: str, start: int, end: int, radius: int = 80) -> str:
    """Return a text snippet around a span, for source traceability."""
    s = max(0, start - radius)
    e = min(len(text), end + radius)
    snippet = text[s:e].replace("\n", " ").strip()
    return snippet[:200]


def _dedupe_entities(
    entities: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Dedupe entities by (name, entity_type, source_document_id).
    Keep the one with highest confidence."""
    best: dict[tuple[str, str, str | None], dict[str, Any]] = {}
    for ent in entities:
        key = (ent["name"].lower(), ent["entity_type"], ent["source_document_id"])
        existing = best.get(key)
        if existing is None or ent["confidence"] > existing["confidence"]:
            best[key] = ent
    return list(best.values())


def extract_entities_from_document(
    db: Session,
    owner: User,
    document: Document,
) -> list[KnowledgeEntity]:
    """Extract entities from a document's indexed chunks.

    Creates or updates KnowledgeEntity rows. Returns the entities that
    were created or updated.
    """
    # Fetch completed chunks for the document.
    chunks = list(
        db.scalars(
            select(DocumentChunk)
            .where(
                DocumentChunk.document_id == document.id,
                DocumentChunk.chunk_status == "completed",
            )
            .order_by(DocumentChunk.chunk_index.asc())
        ).all()
    )

    if not chunks:
        return []

    raw_entities: list[dict[str, Any]] = []
    for chunk in chunks:
        raw_entities.extend(
            _extract_entities_from_text(
                text=chunk.text,
                document_id=document.id,
                chunk_id=chunk.id,
                page_number=chunk.page_number,
                owner_id=owner.id,
            )
        )

    deduped = _dedupe_entities(raw_entities)

    created: list[KnowledgeEntity] = []
    for ent in deduped:
        # Try to find an existing entity with same name/type/document.
        existing = db.scalars(
            select(KnowledgeEntity).where(
                KnowledgeEntity.owner_id == owner.id,
                func.lower(KnowledgeEntity.name) == ent["name"].lower(),
                KnowledgeEntity.entity_type == ent["entity_type"],
                KnowledgeEntity.source_document_id == document.id,
            )
        ).first()
        if existing is not None:
            # Update snippet/confidence if new evidence is stronger.
            if ent["confidence"] > existing.confidence:
                existing.confidence = ent["confidence"]
                existing.source_chunk_id = ent["source_chunk_id"]
                existing.source_page_number = ent["source_page_number"]
                existing.source_text_snippet = ent["source_text_snippet"]
                existing.updated_at = _utcnow()
                db.add(existing)
                created.append(existing)
            continue

        entity = KnowledgeEntity(**ent)
        db.add(entity)
        db.flush()
        db.refresh(entity)
        created.append(entity)

    db.commit()
    return created


def extract_relationships_for_document(
    db: Session,
    owner: User,
    document: Document,
) -> list[KnowledgeRelationship]:
    """Extract relationships between entities found in the same document.

    For each pair of entities appearing in the same chunk, create a
    'mentions' or 'related_to' relationship. Also creates
    'document_mentions_entity' style relationships via entity document links
    (handled implicitly by source_document_id on entities).
    """
    # Get entities for this document.
    entities = list(
        db.scalars(
            select(KnowledgeEntity).where(
                KnowledgeEntity.owner_id == owner.id,
                KnowledgeEntity.source_document_id == document.id,
            )
        ).all()
    )

    if len(entities) < 2:
        return []

    created: list[KnowledgeRelationship] = []
    seen_edges: set[tuple[str, str, str]] = set()

    # Co-occurrence: entities in the same chunk are related.
    chunks = list(
        db.scalars(
            select(DocumentChunk)
            .where(
                DocumentChunk.document_id == document.id,
                DocumentChunk.chunk_status == "completed",
            )
        ).all()
    )

    for chunk in chunks:
        chunk_entities = [
            e for e in entities
            if e.source_chunk_id == chunk.id
        ]
        for i in range(len(chunk_entities)):
            for j in range(i + 1, len(chunk_entities)):
                e1, e2 = chunk_entities[i], chunk_entities[j]
                # Canonical edge: source < target by id to avoid duplicates.
                src, tgt = (e1, e2) if e1.id < e2.id else (e2, e1)
                edge_key = (src.id, tgt.id, "related_to")
                if edge_key in seen_edges:
                    continue
                seen_edges.add(edge_key)

                existing = db.scalars(
                    select(KnowledgeRelationship).where(
                        KnowledgeRelationship.owner_id == owner.id,
                        KnowledgeRelationship.source_entity_id == src.id,
                        KnowledgeRelationship.target_entity_id == tgt.id,
                        KnowledgeRelationship.relationship_type == "related_to",
                    )
                ).first()
                if existing is not None:
                    continue

                rel = KnowledgeRelationship(
                    owner_id=owner.id,
                    source_entity_id=src.id,
                    target_entity_id=tgt.id,
                    relationship_type="related_to",
                    description=(
                        f"Co-occurs in '{document.title}' "
                        f"(chunk {chunk.chunk_index})"
                    ),
                    confidence=0.5,
                    is_inferred=True,
                    source_document_id=document.id,
                    source_chunk_id=chunk.id,
                    source_page_number=chunk.page_number,
                    source_text_snippet=_snippet(chunk.text, 0, 120),
                )
                db.add(rel)
                db.flush()
                db.refresh(rel)
                created.append(rel)

    db.commit()
    return created


def build_graph_for_user(
    db: Session,
    owner: User,
    *,
    entity_type: str | None = None,
    source_document_id: str | None = None,
    search: str | None = None,
    min_confidence: float = 0.0,
    include_inferred: bool = True,
    max_nodes: int = 200,
    max_edges: int = 400,
) -> KnowledgeGraphOut:
    """Build the knowledge graph for a user.

    Returns nodes (entities) and edges (relationships) with full
    source traceability.
    """
    # ---- Nodes ----
    stmt = select(KnowledgeEntity).where(
        KnowledgeEntity.owner_id == owner.id,
        KnowledgeEntity.confidence >= min_confidence,
    )
    if entity_type:
        stmt = stmt.where(KnowledgeEntity.entity_type == entity_type)
    if source_document_id:
        stmt = stmt.where(
            KnowledgeEntity.source_document_id == source_document_id
        )
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                KnowledgeEntity.name.ilike(like),
                KnowledgeEntity.description.ilike(like),
            )
        )
    if not include_inferred:
        stmt = stmt.where(KnowledgeEntity.is_inferred == False)  # noqa: E712

    nodes = list(
        db.scalars(
            stmt.options(
                joinedload(KnowledgeEntity.source_document)
            )
            .order_by(KnowledgeEntity.confidence.desc())
            .limit(max_nodes)
        ).all()
    )

    node_ids = [n.id for n in nodes]

    # ---- Edges ----
    edges: list[KnowledgeRelationship] = []
    if node_ids:
        estmt = select(KnowledgeRelationship).where(
            KnowledgeRelationship.owner_id == owner.id,
            KnowledgeRelationship.source_entity_id.in_(node_ids),
            KnowledgeRelationship.target_entity_id.in_(node_ids),
            KnowledgeRelationship.confidence >= min_confidence,
        )
        if not include_inferred:
            estmt = estmt.where(
                KnowledgeRelationship.is_inferred == False  # noqa: E712
            )
        edges = list(
            db.scalars(
                estmt.options(
                    joinedload(KnowledgeRelationship.source_entity),
                    joinedload(KnowledgeRelationship.target_entity),
                )
                .order_by(KnowledgeRelationship.confidence.desc())
                .limit(max_edges)
            ).all()
        )

    # Build response with source document titles.
    node_responses: list[dict[str, Any]] = []
    for n in nodes:
        rel_count = len(n.relationships_as_source) + len(
            n.relationships_as_target
        )
        node_responses.append(
            {
                "id": n.id,
                "name": n.name,
                "entity_type": n.entity_type,
                "description": n.description,
                "source_document_id": n.source_document_id,
                "source_chunk_id": n.source_chunk_id,
                "source_page_number": n.source_page_number,
                "source_text_snippet": n.source_text_snippet,
                "source_document_title": (
                    n.source_document.title if n.source_document else None
                ),
                "confidence": n.confidence,
                "is_inferred": n.is_inferred,
                "created_at": n.created_at,
                "updated_at": n.updated_at,
                "relationship_count": rel_count,
            }
        )

    edge_responses: list[dict[str, Any]] = []
    for e in edges:
        edge_responses.append(
            {
                "id": e.id,
                "source_entity_id": e.source_entity_id,
                "target_entity_id": e.target_entity_id,
                "source_entity_name": e.source_entity.name,
                "target_entity_name": e.target_entity.name,
                "relationship_type": e.relationship_type,
                "description": e.description,
                "source_document_id": e.source_document_id,
                "source_chunk_id": e.source_chunk_id,
                "source_page_number": e.source_page_number,
                "source_text_snippet": e.source_text_snippet,
                "source_document_title": (
                    e.source_document.title if e.source_document else None
                ),
                "confidence": e.confidence,
                "is_inferred": e.is_inferred,
                "created_at": e.created_at,
                "updated_at": e.updated_at,
            }
        )

    return KnowledgeGraphOut(
        nodes=[KnowledgeEntityOut(**nr) for nr in node_responses],
        edges=[KnowledgeRelationshipOut(**er) for er in edge_responses],
    )


def list_entities(
    db: Session,
    owner: User,
    *,
    filter: KnowledgeEntityFilter,
) -> tuple[list[KnowledgeEntity], int]:
    """List entities with filtering and pagination."""
    stmt = select(KnowledgeEntity).where(KnowledgeEntity.owner_id == owner.id)

    if filter.entity_type:
        stmt = stmt.where(KnowledgeEntity.entity_type == filter.entity_type)
    if filter.source_document_id:
        stmt = stmt.where(
            KnowledgeEntity.source_document_id == filter.source_document_id
        )
    if filter.search:
        like = f"%{filter.search.strip()}%"
        stmt = stmt.where(
            or_(
                KnowledgeEntity.name.ilike(like),
                KnowledgeEntity.description.ilike(like),
            )
        )
    if filter.inferred_only is not None:
        stmt = stmt.where(KnowledgeEntity.is_inferred == filter.inferred_only)

    total = db.scalar(
        select(func.count()).select_from(stmt.subquery())
    ) or 0

    items = list(
        db.scalars(
            stmt.options(
                joinedload(KnowledgeEntity.source_document)
            )
            .order_by(KnowledgeEntity.confidence.desc(), KnowledgeEntity.created_at.desc())
            .offset((filter.page - 1) * filter.page_size)
            .limit(filter.page_size)
        ).all()
    )
    return items, total


def delete_entities_for_document(
    db: Session,
    owner: User,
    document_id: str,
) -> int:
    """Remove all entities and relationships tied to a document.

    Returns the number of entities deleted. Call this when a document is
    deleted to avoid dangling graph references.
    """
    # First delete relationships whose source or target entity belongs
    # to a deleted-document entity, then delete those entities.
    entity_ids = [
        row[0]
        for row in db.execute(
            select(KnowledgeEntity.id).where(
                KnowledgeEntity.owner_id == owner.id,
                KnowledgeEntity.source_document_id == document_id,
            )
        ).all()
    ]

    deleted_relationships = 0
    if entity_ids:
        deleted_relationships = db.execute(
            select(func.count()).select_from(KnowledgeRelationship).where(
                KnowledgeRelationship.owner_id == owner.id,
                (
                    KnowledgeRelationship.source_entity_id.in_(entity_ids)
                    | KnowledgeRelationship.target_entity_id.in_(entity_ids)
                ),
            )
        ).scalar() or 0
        db.execute(
            KnowledgeRelationship.__table__.delete().where(
                KnowledgeRelationship.owner_id == owner.id,
                (
                    KnowledgeRelationship.source_entity_id.in_(entity_ids)
                    | KnowledgeRelationship.target_entity_id.in_(entity_ids)
                ),
            )
        )

    deleted_entities = db.execute(
        KnowledgeEntity.__table__.delete().where(
            KnowledgeEntity.owner_id == owner.id,
            KnowledgeEntity.source_document_id == document_id,
        )
    ).rowcount or 0

    db.commit()
    logger.info(
        "Deleted %d entities and %d relationships for document %s",
        deleted_entities, deleted_relationships, document_id,
    )
    return deleted_entities


def reprocess_document_graph(
    db: Session,
    owner: User,
    document: Document,
) -> dict[str, int]:
    """Re-extract entities and relationships for a document.

    Deletes existing graph data for the document, then re-extracts from
    its indexed chunks. Returns counts.
    """
    deleted = delete_entities_for_document(db, owner, document.id)
    entities = extract_entities_from_document(db, owner, document)
    relationships = extract_relationships_for_document(db, owner, document)
    return {
        "entities_deleted": deleted,
        "entities_created": len(entities),
        "relationships_created": len(relationships),
    }
