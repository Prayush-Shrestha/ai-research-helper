"""Versioned API router (/api/v1/...)."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import admin, admin_extensions, activity, auth, collections, dashboard, documents, knowledge_graph, notes, research, research_comparison

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(admin_extensions.router, prefix="/admin", tags=["admin-ext"])
api_router.include_router(activity.router, prefix="/activity", tags=["activity"])
api_router.include_router(collections.router, prefix="/collections", tags=["collections"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(knowledge_graph.router, prefix="/knowledge", tags=["knowledge-graph"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(research.router, prefix="/research", tags=["research"])
api_router.include_router(research_comparison.router, prefix="/research", tags=["research-comparison"])
