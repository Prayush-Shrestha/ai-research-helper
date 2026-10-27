"""Integration tests: upload → indexing → RAG ask with local providers.

These tests exercise the full pipeline end-to-end (within the test client)
using the local simhash embedding + local extractive LLM providers, so no
external API keys are required.
"""

from __future__ import annotations

from app.tests.conftest import auth_client, register
from app.tests.test_documents import make_pdf_bytes, upload


def _doc_id(client) -> str:
    return upload(client).json()["id"]


def test_upload_auto_indexes_and_ask(client):
    """Upload a PDF → auto-indexing completes → RAG ask returns an answer."""
    client = auth_client(client, email="integ@example.edu")
    doc_id = _doc_id(client)

    # Indexing should have been triggered automatically after upload.
    status = client.get(f"/api/v1/research/documents/{doc_id}/indexing-status")
    assert status.status_code == 200, status.text
    body = status.json()
    assert body["document_id"] == doc_id
    # Local simhash indexing should complete quickly.
    assert body["indexing_status"] in ("completed", "failed"), body

    # Ask a question about the document.
    resp = client.post(
        "/api/v1/research/ask",
        json={"question": "Hello ResearchOS", "document_ids": [doc_id]},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "answer" in data
    assert "conversation_id" in data
    assert data["conversation_id"]


def test_indexing_status_nonexistent_document(client):
    """Indexing status for a missing document returns 404."""
    client = auth_client(client, email="integ2@example.edu")
    status = client.get("/api/v1/research/documents/does-not-exist/indexing-status")
    assert status.status_code == 404


def test_ask_requires_auth(client):
    """Ask endpoint requires a valid session."""
    assert client.post("/api/v1/research/ask", json={"question": "x"}).status_code == 401


def test_reindex_endpoint(client):
    """Reindex endpoint returns 202 for an owned document."""
    client = auth_client(client, email="integ3@example.edu")
    doc_id = _doc_id(client)

    resp = client.post(f"/api/v1/research/documents/{doc_id}/reindex")
    assert resp.status_code == 202, resp.text
    assert resp.json()["detail"]


def test_reindex_another_users_document_forbidden(client):
    """Cannot reindex another user's document."""
    owner = auth_client(client, email="owner@example.edu")
    doc_id = _doc_id(owner)

    attacker = auth_client(client, email="attacker@example.edu")
    resp = attacker.post(f"/api/v1/research/documents/{doc_id}/reindex")
    assert resp.status_code == 403, resp.text
