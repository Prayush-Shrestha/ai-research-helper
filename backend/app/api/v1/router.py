"""Versioned API router (/api/v1/...)."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import admin, auth, dashboard, documents, notes, research

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(research.router, prefix="/research", tags=["research"])
