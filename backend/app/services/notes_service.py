"""Research-note business logic (ownership enforced on both sides)."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.document import Document
from app.models.note import ResearchNote
from app.models.user import User
from app.schemas.note import NoteCreateIn, NoteOut, NoteUpdateIn


def _to_out(note: ResearchNote, document_title: str | None = None) -> NoteOut:
    return NoteOut(
        id=note.id,
        title=note.title,
        content=note.content,
        document_id=note.document_id,
        document_title=document_title,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


def get_note(db: Session, requester: User, note_id: str) -> ResearchNote | None:
    """Fetch one note. Owner-only — no admin content bypass."""
    stmt = select(ResearchNote).where(
        ResearchNote.id == note_id, ResearchNote.owner_id == requester.id
    )
    return db.scalars(stmt).first()


def _resolve_document(
    db: Session, requester: User, document_id: str | None
) -> tuple[Document | None, str | None]:
    if document_id is None:
        return None, None
    stmt = select(Document).where(
        Document.id == document_id, Document.owner_id == requester.id
    )
    document = db.scalars(stmt).first()
    if document is None:
        return None, "Document not found."
    return document, None


def create_note(
    db: Session, owner: User, payload: NoteCreateIn
) -> tuple[ResearchNote | None, str | None]:
    document, error = _resolve_document(db, owner, payload.document_id)
    if error:
        return None, error
    note = ResearchNote(
        owner_id=owner.id,
        document_id=document.id if document else None,
        title=(payload.title or "").strip() or "Untitled note",
        content=payload.content or "",
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note, None


def update_note(db: Session, note: ResearchNote, payload: NoteUpdateIn) -> ResearchNote:
    if payload.title is not None:
        note.title = payload.title.strip() or note.title
    if payload.content is not None:
        note.content = payload.content
    db.commit()
    db.refresh(note)
    return note


def delete_note(db: Session, note: ResearchNote) -> None:
    db.delete(note)
    db.commit()


def list_notes(
    db: Session, requester: User, *, page: int = 1, page_size: int = 20
) -> tuple[list[NoteOut], int]:
    base = (
        select(ResearchNote, Document.title)
        .outerjoin(Document, Document.id == ResearchNote.document_id)
        .where(ResearchNote.owner_id == requester.id)
    )
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.execute(
        base.order_by(ResearchNote.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return [_to_out(note, doc_title) for note, doc_title in rows], total


def list_document_notes(db: Session, requester: User, document: Document) -> list[NoteOut]:
    stmt = select(ResearchNote).where(
        ResearchNote.document_id == document.id,
        ResearchNote.owner_id == requester.id,
    )
    notes = list(
        db.scalars(
            stmt.order_by(ResearchNote.updated_at.desc()).options(
                joinedload(ResearchNote.document)
            )
        ).all()
    )
    return [_to_out(note, document.title) for note in notes]
