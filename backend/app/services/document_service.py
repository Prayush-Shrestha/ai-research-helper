"""Document business logic: upload, extraction, rename, delete, download."""

from __future__ import annotations

import logging
from typing import BinaryIO

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.document import Document
from app.models.user import User
from app.services import extraction
from app.services.file_storage import LocalFileStorage
from app.services.upload_validation import validate_upload

logger = logging.getLogger(__name__)


def _storage(settings: Settings) -> LocalFileStorage:
    return LocalFileStorage(settings.UPLOAD_DIRECTORY)


def get_document(db: Session, requester: User, document_id: str) -> Document | None:
    """Fetch one document.

    Admins may read any document; everyone else only their own (no IDOR).
    """
    stmt = select(Document).where(Document.id == document_id)
    if not requester.is_admin:
        stmt = stmt.where(Document.owner_id == requester.id)
    return db.scalars(stmt).first()


def list_documents(
    db: Session,
    requester: User,
    *,
    search: str | None = None,
    file_type: str | None = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Document], int]:
    stmt = select(Document)
    if not requester.is_admin:
        stmt = stmt.where(Document.owner_id == requester.id)
    if file_type in ("PDF", "DOCX"):
        stmt = stmt.where(Document.file_type == file_type)
    if search and search.strip():
        like = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Document.title.ilike(like),
                Document.original_filename.ilike(like),
            )
        )
    total = db.scalar(
        select(func.count()).select_from(stmt.subquery())
    ) or 0
    if sort == "oldest":
        stmt = stmt.order_by(Document.created_at.asc())
    elif sort == "name":
        stmt = stmt.order_by(Document.title.asc())
    else:
        stmt = stmt.order_by(Document.created_at.desc())
    items = list(
        db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    )
    return items, total


def _run_extraction(document: Document, storage: LocalFileStorage) -> None:
    """Extract text from the stored file into the document row (in place)."""
    document.extraction_status = "processing"
    try:
        with storage.open(document.storage_key) as handle:
            import tempfile

            # Extractors want a real file path; copy to a temp file whose
            # name carries the right extension, then remove it.
            suffix = ".pdf" if document.file_type == "PDF" else ".docx"
            with tempfile.NamedTemporaryFile(
                suffix=suffix, delete=False
            ) as tmp:
                tmp_path = tmp.name
                for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                    tmp.write(chunk)
        try:
            if document.file_type == "PDF":
                result = extraction.extract_pdf_text(tmp_path)
            else:
                result = extraction.extract_docx_text(tmp_path)
        finally:
            import os

            os.unlink(tmp_path)
    except OSError as exc:
        logger.warning("extraction I/O failure for document %s", document.id)
        document.extraction_status = "failed"
        document.extraction_error = f"Could not read the stored file: {exc}"
        return

    document.extraction_status = result.status
    document.extraction_error = result.error
    document.extracted_text = result.text
    if result.page_count is not None:
        document.page_count = result.page_count


def create_document_from_upload(
    db: Session,
    owner: User,
    *,
    filename: str,
    content_type: str | None,
    stream: BinaryIO,
    size_bytes: int,
    head: bytes,
    settings: Settings,
) -> tuple[Document | None, str | None]:
    """Validate, store, extract, and persist. Returns (document, error).

    On any failure after the file lands on disk, the file is removed and
    nothing is committed — no orphaned files or rows.
    """
    checked = validate_upload(filename, size_bytes, head, settings.max_upload_bytes)
    if not checked.ok or checked.file_type is None:
        return None, checked.error or "Upload rejected."

    storage = _storage(settings)
    # Rewind: validation only peeked at the first bytes.
    stream.seek(0)
    storage_key = storage.save(stream, ".pdf" if checked.file_type == "PDF" else ".docx")

    title = filename.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    title = title.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").strip() or title
    document = Document(
        owner_id=owner.id,
        title=title[:300],
        original_filename=filename[-255:],
        file_type=checked.file_type,
        file_size=size_bytes,
        storage_key=storage_key,
        extraction_status="pending",
    )
    try:
        db.add(document)
        db.flush()  # assign the id before extraction logging below
        _run_extraction(document, storage)
        db.commit()
        db.refresh(document)
    except Exception:
        db.rollback()
        storage.delete(storage_key)
        logger.exception("upload persistence failed for user %s", owner.id)
        return None, "Upload failed. Please try again."
    _ = content_type  # MIME type is a hint only; the signature decided.
    return document, None


def rename_document(db: Session, document: Document, title: str) -> Document:
    document.title = title.strip()[:300]
    db.commit()
    db.refresh(document)
    return document


def delete_document(db: Session, document: Document, settings: Settings) -> None:
    """Delete the row (notes cascade) and the stored file."""
    storage = _storage(settings)
    key = document.storage_key
    db.delete(document)
    db.commit()
    storage.delete(key)


def retry_extraction(db: Session, document: Document, settings: Settings) -> Document:
    _run_extraction(document, _storage(settings))
    db.commit()
    db.refresh(document)
    return document
