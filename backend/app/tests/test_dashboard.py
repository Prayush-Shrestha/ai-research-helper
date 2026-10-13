"""Dashboard tests: real counts, empty accounts, per-user isolation."""

from __future__ import annotations

from app.tests.conftest import auth_client, register
from app.tests.test_documents import make_docx_bytes, upload


def test_empty_dashboard(client):
    register(client)
    body = client.get("/api/v1/dashboard").json()
    assert body["counts"] == {
        "total_documents": 0,
        "pdf_count": 0,
        "docx_count": 0,
        "total_notes": 0,
    }
    assert body["recent_documents"] == []
    assert body["recently_updated"] == []
    assert body["recent_notes"] == []


def test_dashboard_reflects_real_data(client):
    register(client)
    upload(client, "one.pdf")
    upload(client, "two.docx", make_docx_bytes(),
           "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    client.post("/api/v1/notes", json={"title": "n", "content": "c"})
    body = client.get("/api/v1/dashboard").json()
    assert body["counts"]["total_documents"] == 2
    assert body["counts"]["pdf_count"] == 1
    assert body["counts"]["docx_count"] == 1
    assert body["counts"]["total_notes"] == 1
    assert len(body["recent_documents"]) == 2
    assert len(body["recently_updated"]) == 2
    assert len(body["recent_notes"]) == 1


def test_dashboard_is_per_user(client):
    register(client, email="ada@example.edu")
    upload(client, "mine.pdf")
    other = auth_client(client, email="grace@example.edu")
    body = other.get("/api/v1/dashboard").json()
    assert body["counts"]["total_documents"] == 0
    assert body["recent_documents"] == []


def test_dashboard_requires_auth(client):
    assert client.get("/api/v1/dashboard").status_code == 401
