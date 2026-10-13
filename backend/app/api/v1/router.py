"""Versioned API router (/api/v1/...)."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth, dashboard, documents, notes

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
