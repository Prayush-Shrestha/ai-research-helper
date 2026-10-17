"""Admin console schemas — user rows with live counts, site stats."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    created_at: datetime
    last_login_at: datetime | None = None
    document_count: int = 0
    note_count: int = 0
    storage_bytes: int = 0


class AdminUserDetailOut(AdminUserOut):
    recent_documents: list["AdminDocumentOut"] = Field(default_factory=list)


class AdminDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    file_type: str
    file_size: int
    page_count: int | None = None
    extraction_status: str
    created_at: datetime


class AdminDocumentWithOwner(AdminDocumentOut):
    """A document plus the account that owns it — admin only."""
    owner_id: str
    owner_name: str
    owner_email: str


class AdminNoteWithOwner(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    content: str
    document_id: str | None = None
    document_title: str | None = None
    created_at: datetime
    updated_at: datetime
    owner_id: str
    owner_name: str
    owner_email: str


class AdminStatsOut(BaseModel):
    total_users: int = 0
    admin_count: int = 0
    total_documents: int = 0
    total_notes: int = 0
    total_storage_bytes: int = 0


class RoleUpdateIn(BaseModel):
    role: str = Field(pattern="^(user|admin)$")
