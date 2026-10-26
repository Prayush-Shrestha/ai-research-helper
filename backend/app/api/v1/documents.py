"""Document routes: upload, list, read, rename, delete, download, text, retry."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_db,
    get_settings_dep,
    require_same_origin,
)
from app.core.config import Settings
from app.models.user import User
from app.schemas.common import MessageOut
from app.schemas.document import (
    DocumentDetailOut,
    DocumentListOut,
    DocumentOut,
    DocumentTextOut,
    RenameDocumentIn,
)
from app.services import document_service
from app.services import activity_service

router = APIRouter(dependencies=[Depends(require_same_origin)])

MAX_PAGE_SIZE = 100


def _not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail="Document not found."
    )


@router.post(
    "/upload", response_model=DocumentDetailOut, status_code=status.HTTP_201_CREATED
)
async def upload_document(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> DocumentDetailOut:
    filename = file.filename or "upload"
    # Stream to memory in chunks while enforcing the size cap (never trust
    # Content-Length alone, never hold more than the limit plus one byte).
    limit = settings.max_upload_bytes
    chunks: list[bytes] = []
    seen = 0
    head = b""
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        seen += len(chunk)
        if seen > limit + 1:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File is too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB:g} MB.",
            )
        if not head:
            head = chunk[:8]
        chunks.append(chunk)
    body = b"".join(chunks)

    import io

    document, error = document_service.create_document_from_upload(
        db,
        user,
        filename=filename,
        content_type=file.content_type,
        stream=io.BytesIO(body),
        size_bytes=len(body),
        head=head,
        settings=settings,
    )
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Upload rejected.",
        )
    activity_service.record(
        db,
        user=user,
        action="document_uploaded",
        entity_type="document",
        entity_id=document.id,
        metadata={
            "title": document.title,
            "file_type": document.file_type,
            "file_size": document.file_size,
        },
    )
    return document


@router.get("", response_model=DocumentListOut)
def list_documents(
    search: str | None = Query(default=None, max_length=200),
    file_type: str | None = Query(default=None, pattern="^(PDF|DOCX)$"),
    sort: str = Query(default="newest", pattern="^(newest|oldest|name)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=MAX_PAGE_SIZE),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentListOut:
    items, total = document_service.list_documents(
        db,
        user,
        search=search,
        file_type=file_type,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return DocumentListOut(total=total, page=page, page_size=page_size, items=items)


@router.get("/{document_id}", response_model=DocumentDetailOut)
def get_document(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentDetailOut:
    document = document_service.get_document(db, user, document_id)
    if document is None:
        raise _not_found()
    return document


@router.patch("/{document_id}", response_model=DocumentDetailOut)
def rename_document(
    document_id: str,
    payload: RenameDocumentIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentDetailOut:
    document = document_service.get_document(db, user, document_id)
    if document is None:
        raise _not_found()
    return document_service.rename_document(db, document, payload.title)


@router.delete("/{document_id}", response_model=MessageOut)
def delete_document(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> MessageOut:
    document = document_service.get_document(db, user, document_id)
    if document is None:
        raise _not_found()
    document_service.delete_document(db, document, settings)
    return MessageOut(detail="Document deleted.")


@router.get("/{document_id}/text", response_model=DocumentTextOut)
def get_document_text(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentTextOut:
    document = document_service.get_document(db, user, document_id)
    if document is None:
        raise _not_found()
    return document


@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> FileResponse:
    document = document_service.get_document(db, user, document_id)
    if document is None:
        raise _not_found()
    # The storage path itself is never exposed, only the original filename
    # as a download hint. FileResponse streams from disk.
    from app.services.file_storage import LocalFileStorage

    path = LocalFileStorage(settings.UPLOAD_DIRECTORY)._resolve(
        document.storage_key
    )
    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="The stored file is missing.",
        )
    media_type = (
        "application/pdf"
        if document.file_type == "PDF"
        else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    safe_name = "".join(
        c if c.isalnum() or c in (" ", ".", "_", "-") else "_"
        for c in document.original_filename
    ).strip() or "document"
    return FileResponse(
        path=str(path), media_type=media_type, filename=safe_name
    )


@router.post("/{document_id}/retry-extraction", response_model=DocumentDetailOut)
def retry_extraction(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dep),
) -> DocumentDetailOut:
    document = document_service.get_document(db, user, document_id)
    if document is None:
        raise _not_found()
    return document_service.retry_extraction(db, document, settings)
