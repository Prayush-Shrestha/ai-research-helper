"""Research-note routes (per-document and personal collection)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_db,
    require_same_origin,
)
from app.models.user import User
from app.schemas.common import MessageOut
from app.schemas.note import NoteCreateIn, NoteListOut, NoteOut, NoteUpdateIn
from app.services import document_service, notes_service

router = APIRouter(dependencies=[Depends(require_same_origin)])

MAX_PAGE_SIZE = 100


@router.get("", response_model=NoteListOut)
def list_my_notes(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=MAX_PAGE_SIZE),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteListOut:
    items, total = notes_service.list_notes(db, user, page=page, page_size=page_size)
    return NoteListOut(total=total, page=page, page_size=page_size, items=items)


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteOut:
    note, error = notes_service.create_note(db, user, payload)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error or "Document not found.",
        )
    title = None
    if note.document_id:
        document = document_service.get_document(db, user, note.document_id)
        title = document.title if document else None
    out = NoteOut.model_validate(note)
    out.document_title = title
    return out


@router.get("/documents/{document_id}/notes", response_model=list[NoteOut])
def list_document_notes(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NoteOut]:
    document = document_service.get_document(db, user, document_id)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found."
        )
    return notes_service.list_document_notes(db, user, document)


@router.post(
    "/documents/{document_id}/notes",
    response_model=NoteOut,
    status_code=status.HTTP_201_CREATED,
)
def create_document_note(
    document_id: str,
    payload: NoteCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteOut:
    document = document_service.get_document(db, user, document_id)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found."
        )
    payload = payload.model_copy(update={"document_id": document.id})
    note, error = notes_service.create_note(db, user, payload)
    if note is None:  # pragma: no cover - document was just verified above
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error or "Document not found.",
        )
    out = NoteOut.model_validate(note)
    out.document_title = document.title
    return out


@router.get("/{note_id}", response_model=NoteOut)
def get_note(
    note_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteOut:
    note = notes_service.get_note(db, user, note_id)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found."
        )
    out = NoteOut.model_validate(note)
    if note.document_id:
        document = document_service.get_document(db, user, note.document_id)
        out.document_title = document.title if document else None
    return out


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(    note_id: str,
    payload: NoteUpdateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteOut:
    note = notes_service.get_note(db, user, note_id)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found."
        )
    updated = notes_service.update_note(db, note, payload)
    out = NoteOut.model_validate(updated)
    if updated.document_id:
        document = document_service.get_document(db, user, updated.document_id)
        out.document_title = document.title if document else None
    return out


@router.delete("/{note_id}", response_model=MessageOut)
def delete_note(
    note_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    note = notes_service.get_note(db, user, note_id)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found."
        )
    notes_service.delete_note(db, note)
    return MessageOut(detail="Note deleted.")
