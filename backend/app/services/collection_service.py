"""Research collection business logic (server-side, ownership enforced)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.phase3 import CollectionDocument, ResearchCollection
from app.models.user import User
from app.schemas.phase3 import (
    CollectionCreateIn,
    CollectionDocumentAddIn,
    CollectionUpdateIn,
)
from app.services import activity_service


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def list_collections(
    db: Session,
    owner: User,
    *,
    search: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[ResearchCollection], int]:
    """List collections owned by the user, with optional name search."""
    stmt = select(ResearchCollection).where(
        ResearchCollection.owner_id == owner.id
    )
    if search and search.strip():
        like = f"%{search.strip()}%"
        stmt = stmt.where(ResearchCollection.name.ilike(like))
    total = db.scalar(
        select(func.count()).select_from(stmt.subquery())
    ) or 0
    items = list(
        db.scalars(
            stmt.order_by(ResearchCollection.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )
    return items, total


def get_collection(
    db: Session, owner: User, collection_id: str
) -> ResearchCollection | None:
    """Fetch one collection, only if owned by the user (no admin bypass)."""
    stmt = select(ResearchCollection).where(
        ResearchCollection.id == collection_id,
        ResearchCollection.owner_id == owner.id,
    )
    return db.scalars(stmt).first()


def create_collection(
    db: Session, owner: User, payload: CollectionCreateIn
) -> ResearchCollection:
    """Create a new collection for the user."""
    collection = ResearchCollection(
        owner_id=owner.id,
        name=payload.name.strip(),
        description=(payload.description or "").strip() or None,
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)

    activity_service.record(
        db,
        user=owner,
        action="collection_created",
        entity_type="collection",
        entity_id=collection.id,
        metadata={"name": collection.name},
    )
    return collection


def rename_collection(
    db: Session,
    collection: ResearchCollection,
    payload: CollectionUpdateIn,
) -> ResearchCollection:
    """Rename a collection (owner or admin only)."""
    if payload.name is not None:
        collection.name = payload.name.strip()
    if payload.description is not None:
        collection.description = (
            payload.description.strip() or None
        )
    collection.updated_at = _utcnow()
    db.add(collection)
    db.commit()
    db.refresh(collection)

    activity_service.record(
        db,
        user=collection.owner,
        action="collection_renamed",
        entity_type="collection",
        entity_id=collection.id,
        metadata={"name": collection.name},
    )
    return collection


def delete_collection(db: Session, collection: ResearchCollection) -> None:
    """Delete a collection and its document links (documents are untouched)."""
    owner = collection.owner
    activity_service.record(
        db,
        user=owner,
        action="collection_deleted",
        entity_type="collection",
        entity_id=collection.id,
        metadata={"name": collection.name},
    )
    db.delete(collection)
    db.commit()


def list_collection_documents(
    db: Session,
    owner: User,
    collection: ResearchCollection,
) -> list[CollectionDocument]:
    """List documents in a collection (owner or admin only)."""
    stmt = (
        select(CollectionDocument)
        .where(CollectionDocument.collection_id == collection.id)
        .order_by(CollectionDocument.added_at.desc())
    )
    return list(db.scalars(stmt).all())


def add_document_to_collection(
    db: Session,
    owner: User,
    collection: ResearchCollection,
    payload: CollectionDocumentAddIn,
) -> CollectionDocument | None:
    """Add a document to a collection. Returns None if already present or
    document not found/owned."""
    from app.services import document_service

    doc = document_service.get_document(db, owner, payload.document_id)
    if doc is None:
        return None

    # Check if already present.
    existing = db.scalars(
        select(CollectionDocument).where(
            CollectionDocument.collection_id == collection.id,
            CollectionDocument.document_id == doc.id,
        )
    ).first()
    if existing is not None:
        return existing

    link = CollectionDocument(
        collection_id=collection.id,
        document_id=doc.id,
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    activity_service.record(
        db,
        user=owner,
        action="document_added_to_collection",
        entity_type="collection",
        entity_id=collection.id,
        metadata={"document_id": doc.id, "document_title": doc.title},
    )
    return link


def remove_document_from_collection(
    db: Session,
    owner: User,
    collection: ResearchCollection,
    document_id: str,
) -> bool:
    """Remove a document from a collection. Returns True if removed."""
    link = db.scalars(
        select(CollectionDocument).where(
            CollectionDocument.collection_id == collection.id,
            CollectionDocument.document_id == document_id,
        )
    ).first()
    if link is None:
        return False

    doc = db.get(Document, document_id)
    doc_title = doc.title if doc else document_id

    db.delete(link)
    db.commit()

    activity_service.record(
        db,
        user=owner,
        action="document_removed_from_collection",
        entity_type="collection",
        entity_id=collection.id,
        metadata={"document_id": document_id, "document_title": doc_title},
    )
    return True


def get_collections_for_document(
    db: Session, owner: User, document_id: str
) -> list[ResearchCollection]:
    """List collections containing a document (owned by user)."""
    stmt = (
        select(ResearchCollection)
        .join(CollectionDocument, CollectionDocument.collection_id == ResearchCollection.id)
        .where(
            CollectionDocument.document_id == document_id,
            ResearchCollection.owner_id == owner.id,
        )
    )
    return list(db.scalars(stmt).all())


def collection_document_count(db: Session, collection_id: str) -> int:
    """Count documents in a collection."""
    return db.scalar(
        select(func.count()).select_from(CollectionDocument).where(
            CollectionDocument.collection_id == collection_id
        )
    ) or 0
