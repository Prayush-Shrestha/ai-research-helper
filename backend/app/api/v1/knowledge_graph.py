"""Knowledge graph API routes — entities, relationships, graph visualization."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_db,
    require_same_origin,
)
from app.models.document import Document
from app.models.user import User
from app.schemas.phase3 import (
    KnowledgeEntityFilter,
    KnowledgeEntityListOut,
    KnowledgeEntityOut,
    KnowledgeGraphOut,
    KnowledgeRelationshipListOut,
    KnowledgeRelationshipOut,
)
from app.services import knowledge_graph_service as kg_service

router = APIRouter(dependencies=[Depends(require_same_origin)])


@router.get("/graph", response_model=KnowledgeGraphOut)
def get_knowledge_graph(
    entity_type: str | None = Query(default=None, max_length=50),
    source_document_id: str | None = Query(default=None, max_length=36),
    search: str | None = Query(default=None, max_length=200),
    min_confidence: float = Query(default=0.0, ge=0.0, le=1.0),
    include_inferred: bool = Query(default=True),
    max_nodes: int = Query(default=200, ge=1, le=1000),
    max_edges: int = Query(default=400, ge=1, le=2000),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> KnowledgeGraphOut:
    """Build the knowledge graph for the current user.

    Returns nodes (entities) and edges (relationships) with full
    source traceability.
    """
    return kg_service.build_graph_for_user(
        db,
        user,
        entity_type=entity_type,
        source_document_id=source_document_id,
        search=search,
        min_confidence=min_confidence,
        include_inferred=include_inferred,
        max_nodes=max_nodes,
        max_edges=max_edges,
    )


@router.get("/entities", response_model=KnowledgeEntityListOut)
def list_entities(
    entity_type: str | None = Query(default=None, max_length=50),
    source_document_id: str | None = Query(default=None, max_length=36),
    search: str | None = Query(default=None, max_length=200),
    inferred_only: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> KnowledgeEntityListOut:
    """List knowledge entities with filtering and pagination."""
    filter = KnowledgeEntityFilter(
        entity_type=entity_type,
        source_document_id=source_document_id,
        search=search,
        inferred_only=inferred_only,
        page=page,
        page_size=page_size,
    )
    items, total = kg_service.list_entities(db, user, filter=filter)
    out_items = []
    for e in items:
        out_items.append(
            KnowledgeEntityOut(
                id=e.id,
                name=e.name,
                entity_type=e.entity_type,
                description=e.description,
                source_document_id=e.source_document_id,
                source_chunk_id=e.source_chunk_id,
                source_page_number=e.source_page_number,
                source_text_snippet=e.source_text_snippet,
                source_document_title=(
                    e.source_document.title if e.source_document else None
                ),
                confidence=e.confidence,
                is_inferred=e.is_inferred,
                created_at=e.created_at,
                updated_at=e.updated_at,
                relationship_count=len(e.relationships_as_source)
                + len(e.relationships_as_target),
            )
        )
    return KnowledgeEntityListOut(total=total, page=page, page_size=page_size, items=out_items)


@router.get("/relationships", response_model=KnowledgeRelationshipListOut)
def list_relationships(
    source_entity_id: str | None = Query(default=None, max_length=36),
    target_entity_id: str | None = Query(default=None, max_length=36),
    relationship_type: str | None = Query(default=None, max_length=50),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> KnowledgeRelationshipListOut:
    """List knowledge relationships with optional filtering."""
    from sqlalchemy import func, or_, select

    stmt = select(kg_service.KnowledgeRelationship).where(
        kg_service.KnowledgeRelationship.owner_id == user.id
    )
    if source_entity_id:
        stmt = stmt.where(
            kg_service.KnowledgeRelationship.source_entity_id == source_entity_id
        )
    if target_entity_id:
        stmt = stmt.where(
            kg_service.KnowledgeRelationship.target_entity_id == target_entity_id
        )
    if relationship_type:
        stmt = stmt.where(
            kg_service.KnowledgeRelationship.relationship_type == relationship_type
        )

    total = db.scalar(
        select(func.count()).select_from(stmt.subquery())
    ) or 0

    rows = list(
        db.scalars(
            stmt.options(
                # Load entities for names
            )
            .order_by(
                kg_service.KnowledgeRelationship.confidence.desc(),
                kg_service.KnowledgeRelationship.created_at.desc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )

    # Load entity names separately.
    entity_ids = set()
    for r in rows:
        entity_ids.add(r.source_entity_id)
        entity_ids.add(r.target_entity_id)
    entity_rows = list(
        db.scalars(
            select(kg_service.KnowledgeEntity).where(
                kg_service.KnowledgeEntity.id.in_(entity_ids)
            )
        ).all()
    )
    entity_map = {e.id: e.name for e in entity_rows}

    out_items = []
    for r in rows:
        out_items.append(
            KnowledgeRelationshipOut(
                id=r.id,
                source_entity_id=r.source_entity_id,
                target_entity_id=r.target_entity_id,
                source_entity_name=entity_map.get(r.source_entity_id, "Unknown"),
                target_entity_name=entity_map.get(r.target_entity_id, "Unknown"),
                relationship_type=r.relationship_type,
                description=r.description,
                source_document_id=r.source_document_id,
                source_chunk_id=r.source_chunk_id,
                source_page_number=r.source_page_number,
                source_text_snippet=r.source_text_snippet,
                source_document_title=None,
                confidence=r.confidence,
                is_inferred=r.is_inferred,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )
    return KnowledgeRelationshipListOut(total=total, page=page, page_size=page_size, items=out_items)


@router.post("/documents/{document_id}/reprocess", status_code=status.HTTP_202_ACCEPTED)
def reprocess_document_graph(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-extract entities and relationships for a document.

    Deletes existing graph data for the document, then re-extracts from
    its indexed chunks.
    """
    doc = db.get(Document, document_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found."
        )
    if not user.is_admin and doc.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reprocess this document.",
        )
    result = kg_service.reprocess_document_graph(db, user, doc)
    return {
        "detail": "Knowledge graph reprocessed.",
        "entities_deleted": result["entities_deleted"],
        "entities_created": result["entities_created"],
        "relationships_created": result["relationships_created"],
    }
