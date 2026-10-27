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
    """A note plus its owner — admin only. Note bodies are owner-only;
    admins see metadata (title, ownership, timestamps) but not content."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
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


class AdminRegisterIn(BaseModel):
    """Admin-created account. Only an existing admin may use this."""
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(max_length=320)
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(pattern="^(user|admin)$", default="user")
