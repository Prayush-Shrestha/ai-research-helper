"""Admin console business logic — every number is a live database query."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.document import Document
from app.models.note import ResearchNote
from app.models.user import ADMIN_ROLE, User
from app.schemas.admin import (
    AdminDocumentWithOwner,
    AdminNoteWithOwner,
    AdminStatsOut,
    AdminUserDetailOut,
    AdminUserOut,
)
from app.services.file_storage import LocalFileStorage


def _counts(db: Session, user_id: str) -> tuple[int, int, int]:
    docs = (
        db.scalar(
            select(func.count()).select_from(Document).where(
                Document.owner_id == user_id
            )
        )
        or 0
    )
    notes = (
        db.scalar(
            select(func.count()).select_from(ResearchNote).where(
                ResearchNote.owner_id == user_id
            )
        )
        or 0
    )
    storage = (
        db.scalar(
            select(func.coalesce(func.sum(Document.file_size), 0)).where(
                Document.owner_id == user_id
            )
        )
        or 0
    )
    return docs, notes, int(storage)


def row_for(db: Session, user: User) -> AdminUserOut:
    """One user row with live counts (used after role changes)."""
    docs, notes, storage = _counts(db, user.id)
    return AdminUserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        document_count=docs,
        note_count=notes,
        storage_bytes=storage,
    )


def list_users(db: Session, search: str | None = None) -> list[AdminUserOut]:
    stmt = select(User).order_by(User.created_at.desc())
    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            func.lower(User.email).like(q) | func.lower(User.name).like(q)
        )
    rows: list[AdminUserOut] = []
    for user in db.scalars(stmt).all():
        docs, notes, storage = _counts(db, user.id)
        rows.append(
            AdminUserOut(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                created_at=user.created_at,
                last_login_at=user.last_login_at,
                document_count=docs,
                note_count=notes,
                storage_bytes=storage,
            )
        )
    return rows


def get_user_detail(db: Session, user_id: str) -> AdminUserDetailOut | None:
    user = db.get(User, user_id)
    if user is None:
        return None
    docs, notes, storage = _counts(db, user.id)
    recent = list(
        db.scalars(
            select(Document)
            .where(Document.owner_id == user.id)
            .order_by(Document.created_at.desc())
            .limit(10)
        ).all()
    )
    return AdminUserDetailOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        document_count=docs,
        note_count=notes,
        storage_bytes=storage,
        recent_documents=[AdminDocumentOut.model_validate(d) for d in recent],
    )


def site_stats(db: Session) -> AdminStatsOut:
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    admin_count = (
        db.scalar(
            select(func.count()).select_from(User).where(User.role == ADMIN_ROLE)
        )
        or 0
    )
    total_documents = db.scalar(select(func.count()).select_from(Document)) or 0
    total_notes = db.scalar(select(func.count()).select_from(ResearchNote)) or 0
    total_storage = (
        db.scalar(select(func.coalesce(func.sum(Document.file_size), 0))) or 0
    )
    return AdminStatsOut(
        total_users=total_users,
        admin_count=admin_count,
        total_documents=total_documents,
        total_notes=total_notes,
        total_storage_bytes=int(total_storage),
    )


def list_all_documents_with_owners(db: Session) -> list[AdminDocumentWithOwner]:
    """Every document on the site, joined to its owner (admin only)."""
    rows = list(
        db.execute(
            select(Document, User.name, User.email)
            .join(User, User.id == Document.owner_id)
            .order_by(Document.created_at.desc())
        ).all()
    )
    return [
        AdminDocumentWithOwner(
            id=d.id,
            title=d.title,
            file_type=d.file_type,
            file_size=d.file_size,
            page_count=d.page_count,
            extraction_status=d.extraction_status,
            created_at=d.created_at,
            owner_id=d.owner_id,
            owner_name=owner_name,
            owner_email=owner_email,
        )
        for d, owner_name, owner_email in rows
    ]


def list_all_notes_with_owners(db: Session) -> list[AdminNoteWithOwner]:
    """Every note on the site, joined to its owner and document (admin only)."""
    rows = list(
        db.execute(
            select(ResearchNote, User.name, User.email, Document.title)
            .join(User, User.id == ResearchNote.owner_id)
            .outerjoin(Document, Document.id == ResearchNote.document_id)
            .order_by(ResearchNote.updated_at.desc())
        ).all()
    )
    return [
        AdminNoteWithOwner(
            id=n.id,
            title=n.title,
            content=n.content,
            document_id=n.document_id,
            document_title=doc_title,
            created_at=n.created_at,
            updated_at=n.updated_at,
            owner_id=n.owner_id,
            owner_name=owner_name,
            owner_email=owner_email,
        )
        for n, owner_name, owner_email, doc_title in rows
    ]


def set_role(db: Session, target: User, role: str) -> User:
    target.role = role
    db.commit()
    db.refresh(target)
    return target


def delete_user_account(db: Session, target: User, settings: Settings) -> None:
    """Remove the account: stored files first, then the row (cascades rest)."""
    storage = LocalFileStorage(settings.UPLOAD_DIRECTORY)
    keys = list(
        db.scalars(
            select(Document.storage_key).where(Document.owner_id == target.id)
        ).all()
    )
    db.delete(target)
    db.commit()
    for key in keys:
        storage.delete(key)
