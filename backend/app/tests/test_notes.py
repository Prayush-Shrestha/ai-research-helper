"""Research-note tests: CRUD, document scoping, cross-user isolation."""

from __future__ import annotations

from app.tests.conftest import auth_client, register
from app.tests.test_documents import TINY_PDF, upload


def _doc_id(client) -> str:
    return upload(client).json()["id"]


def test_create_and_list_standalone_note(client):
    register(client)
    created = client.post(
        "/api/v1/notes", json={"title": "Idea", "content": "Try diffusion models."}
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["title"] == "Idea" and body["document_id"] is None
    listing = client.get("/api/v1/notes").json()
    assert listing["total"] == 1
    assert listing["items"][0]["content"] == "Try diffusion models."


def test_document_scoped_notes(client):
    register(client)
    doc_id = _doc_id(client)
    created = client.post(
        f"/api/v1/notes/documents/{doc_id}/notes",
        json={"title": "On page 1", "content": "Key claim here."},
    )
    assert created.status_code == 201, created.text
    assert created.json()["document_title"] is not None
    scoped = client.get(f"/api/v1/notes/documents/{doc_id}/notes").json()
    assert len(scoped) == 1
    assert scoped[0]["content"] == "Key claim here."


def test_note_for_missing_document_rejected(client):
    register(client)
    response = client.post(
        "/api/v1/notes", json={"title": "x", "content": "y", "document_id": "nope"}
    )
    assert response.status_code == 404


def test_update_and_delete_note(client):
    register(client)
    note_id = client.post(
        "/api/v1/notes", json={"title": "Draft", "content": "v1"}
    ).json()["id"]
    updated = client.patch(f"/api/v1/notes/{note_id}", json={"content": "v2"})
    assert updated.status_code == 200
    assert updated.json()["content"] == "v2"
    assert "created_at" in updated.json() and "updated_at" in updated.json()
    assert client.delete(f"/api/v1/notes/{note_id}").status_code == 200
    assert client.get("/api/v1/notes").json()["total"] == 0


def test_notes_are_private(client):
    register(client, email="ada@example.edu")
    doc_id = _doc_id(client)
    note_id = client.post(
        f"/api/v1/notes/documents/{doc_id}/notes",
        json={"title": "Secret", "content": "mine"},
    ).json()["id"]
    other = auth_client(client, email="grace@example.edu")
    assert other.get(f"/api/v1/notes/{note_id}").status_code == 404
    assert other.patch(f"/api/v1/notes/{note_id}", json={"content": "x"}).status_code == 404
    assert other.delete(f"/api/v1/notes/{note_id}").status_code == 404
    assert other.get(f"/api/v1/notes/documents/{doc_id}/notes").status_code == 404
    assert other.post("/api/v1/notes", json={"title": "t", "content": "c", "document_id": doc_id}).status_code == 404


def test_notes_require_auth(client):
    assert client.get("/api/v1/notes").status_code == 401
    assert client.post("/api/v1/notes", json={"content": "x"}).status_code == 401
