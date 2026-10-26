"""Research collection API routes — server-side, ownership enforced."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_db,
    require_same_origin,
)
from app.models.user import User
from app.schemas.phase3 import (
    CollectionCreateIn,
    CollectionDocumentAddIn,
    CollectionDocumentOut,
    CollectionDetailOut,
    CollectionListOut,
    CollectionOut,
    CollectionUpdateIn,
)
from app.services import collection_service

router = APIRouter(dependencies=[Depends(require_same_origin)])


@router.get("", response_model=CollectionListOut)
def list_my_collections(
    search: str | None = Query(default=None, max_length=200),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CollectionListOut:
    """List the current user's research collections."""
    items, total = collection_service.list_collections(
        db, user, search=search, page=page, page_size=page_size
    )
    out_items = []
    for c in items:
        count = collection_service.collection_document_count(db, c.id)
        out_items.append(
            CollectionOut(
                id=c.id,
                owner_id=c.owner_id,
                name=c.name,
                description=c.description,
                document_count=count,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
        )
    return CollectionListOut(total=total, page=page, page_size=page_size, items=out_items)


@router.post("", response_model=CollectionOut, status_code=status.HTTP_201_CREATED)
def create_collection(
    payload: CollectionCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CollectionOut:
    """Create a new research collection."""
    collection = collection_service.create_collection(db, user, payload)
    return CollectionOut(
        id=collection.id,
        owner_id=collection.owner_id,
        name=collection.name,
        description=collection.description,
        document_count=0,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
    )


@router.get("/{collection_id}", response_model=CollectionDetailOut)
def get_collection(
    collection_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CollectionDetailOut:
    """Get one collection with its documents."""
    collection = collection_service.get_collection(db, user, collection_id)
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found."
        )
    links = collection_service.list_collection_documents(db, user, collection)
    doc_items = []
    for link in links:
        doc = link.document
        doc_items.append(
            CollectionDocumentOut(
                id=link.id,
                collection_id=link.collection_id,
                document_id=link.document_id,
                document_title=doc.title,
                document_file_type=doc.file_type,
                document_page_count=doc.page_count,
                added_at=link.added_at,
            )
        )
    count = collection_service.collection_document_count(db, collection.id)
    return CollectionDetailOut(
        id=collection.id,
        owner_id=collection.owner_id,
        name=collection.name,
        description=collection.description,
        document_count=count,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
        documents=doc_items,
    )


@router.patch("/{collection_id}", response_model=CollectionOut)
def update_collection(
    collection_id: str,
    payload: CollectionUpdateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CollectionOut:
    """Rename or update a collection description."""
    collection = collection_service.get_collection(db, user, collection_id)
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found."
        )
    updated = collection_service.rename_collection(db, collection, payload)
    count = collection_service.collection_document_count(db, updated.id)
    return CollectionOut(
        id=updated.id,
        owner_id=updated.owner_id,
        name=updated.name,
        description=updated.description,
        document_count=count,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    collection_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a collection (documents are not deleted)."""
    collection = collection_service.get_collection(db, user, collection_id)
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found."
        )
    collection_service.delete_collection(db, collection)
    return None


@router.post(
    "/{collection_id}/documents",
    response_model=CollectionDocumentOut,
    status_code=status.HTTP_201_CREATED,
)
def add_document_to_collection(
    collection_id: str,
    payload: CollectionDocumentAddIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CollectionDocumentOut:
    """Add a document to a collection."""
    collection = collection_service.get_collection(db, user, collection_id)
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found."
        )
    link = collection_service.add_document_to_collection(db, user, collection, payload)
    if link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or already in collection.",
        )
    doc = link.document
    return CollectionDocumentOut(
        id=link.id,
        collection_id=link.collection_id,
        document_id=link.document_id,
        document_title=doc.title,
        document_file_type=doc.file_type,
        document_page_count=doc.page_count,
        added_at=link.added_at,
    )


@router.delete(
    "/{collection_id}/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_document_from_collection(
    collection_id: str,
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a document from a collection."""
    collection = collection_service.get_collection(db, user, collection_id)
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found."
        )
    removed = collection_service.remove_document_from_collection(
        db, user, collection, document_id
    )
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found in collection.",
        )
    return None
