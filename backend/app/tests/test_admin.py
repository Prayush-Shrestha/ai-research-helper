"""Admin console tests: role guard, stats, user management, allowlist."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.models.user import User
from app.tests.conftest import auth_client, login, register
from app.tests.test_documents import TINY_PDF, upload


def make_admin(
    client: TestClient, db_session, email="boss@example.edu"
) -> TestClient:
    """Register + log in, then flip the role straight in the test DB."""
    admin = auth_client(client, email=email)
    user = db_session.query(User).filter_by(email=email).one()
    user.role = "admin"
    db_session.commit()
    return admin


def test_non_admin_is_forbidden(client: TestClient):
    user_client = auth_client(client, email="ada@example.edu")
    assert user_client.get("/api/v1/admin/stats").status_code == 403
    assert user_client.get("/api/v1/admin/users").status_code == 403


def test_anonymous_is_unauthorized(client: TestClient):
    assert client.get("/api/v1/admin/stats").status_code == 401
    assert client.get("/api/v1/admin/users").status_code == 401


def test_admin_stats_and_users(client: TestClient, db_session):
    admin = make_admin(client, db_session)
    auth_client(client, email="ada@example.edu")

    stats = admin.get("/api/v1/admin/stats").json()
    assert stats["total_users"] == 2
    assert stats["admin_count"] == 1
    assert stats["total_documents"] == 0

    users = admin.get("/api/v1/admin/users").json()
    assert {u["email"] for u in users} == {"boss@example.edu", "ada@example.edu"}
    assert all("document_count" in u for u in users)

    found = admin.get("/api/v1/admin/users", params={"search": "ada@example"}).json()
    assert [u["email"] for u in found] == ["ada@example.edu"]

    detail = admin.get(f"/api/v1/admin/users/{found[0]['id']}").json()
    assert detail["email"] == "ada@example.edu"
    assert detail["recent_documents"] == []
    assert admin.get("/api/v1/admin/users/nope").status_code == 404


def test_role_changes_and_self_protection(client: TestClient, db_session):
    admin = make_admin(client, db_session)
    auth_client(client, email="ada@example.edu")
    ada = db_session.query(User).filter_by(email="ada@example.edu").one()
    boss = db_session.query(User).filter_by(email="boss@example.edu").one()

    promoted = admin.patch(f"/api/v1/admin/users/{ada.id}/role", json={"role": "admin"})
    assert promoted.status_code == 200
    assert promoted.json()["role"] == "admin"

    # Cannot remove your own admin role.
    own = admin.patch(f"/api/v1/admin/users/{boss.id}/role", json={"role": "user"})
    assert own.status_code == 400

    assert admin.patch("/api/v1/admin/users/nope/role", json={"role": "admin"}).status_code == 404
    assert (
        admin.patch(f"/api/v1/admin/users/{ada.id}/role", json={"role": "owner"}).status_code
        == 422
    )


def test_delete_user_and_self_protection(client: TestClient, db_session):
    admin = make_admin(client, db_session)
    auth_client(client, email="ada@example.edu")
    ada = db_session.query(User).filter_by(email="ada@example.edu").one()
    boss = db_session.query(User).filter_by(email="boss@example.edu").one()

    assert admin.delete(f"/api/v1/admin/users/{ada.id}").status_code == 200
    assert admin.get(f"/api/v1/admin/users/{ada.id}").status_code == 404

    # Cannot delete yourself.
    assert admin.delete(f"/api/v1/admin/users/{boss.id}").status_code == 400
    assert admin.delete("/api/v1/admin/users/nope").status_code == 404


def test_admin_allowlist_promotes_on_register(client: TestClient, monkeypatch):
    monkeypatch.setattr(get_settings(), "ADMIN_EMAILS", "Boss@Example.edu ")
    body = register(client, name="Boss", email="boss@example.edu")
    assert body["role"] == "admin"
    me = login(client, email="boss@example.edu")
    assert me["role"] == "admin"


def test_admin_allowlist_promotes_on_login(client: TestClient, monkeypatch):
    auth_client(client, email="ada@example.edu")
    monkeypatch.setattr(get_settings(), "ADMIN_EMAILS", "ada@example.edu")
    me = login(client, email="ada@example.edu")
    assert me["role"] == "admin"


# --- admin cross-user access -----------------------------------------------


def _seed_admin_and_user(client: TestClient, db_session):
    """Register a regular user and an admin; return (admin, user_client, ada)."""
    user_client = auth_client(client, email="ada@example.edu")
    ada = db_session.query(User).filter_by(email="ada@example.edu").one()
    admin = make_admin(client, db_session, email="boss@example.edu")
    return admin, user_client, ada


def test_admin_cannot_read_another_users_document(client: TestClient, db_session):
    """Privacy: admins cannot read another user's document content."""
    admin, user_client, _ada = _seed_admin_and_user(client, db_session)
    doc_id = upload(user_client).json()["id"]

    # Admin may NOT fetch another user's document (owner-only content).
    got = admin.get(f"/api/v1/documents/{doc_id}")
    assert got.status_code == 404, got.text

    # Admin's own document list does not include the other user's document.
    listing = admin.get("/api/v1/documents").json()
    assert listing["total"] == 0 or not any(
        d["id"] == doc_id for d in listing["items"]
    )


def test_admin_cannot_download_another_users_document(client: TestClient, db_session):
    """Privacy: admins cannot download another user's document file."""
    admin, user_client, _ada = _seed_admin_and_user(client, db_session)
    doc_id = upload(user_client).json()["id"]

    dl = admin.get(f"/api/v1/documents/{doc_id}/download")
    assert dl.status_code == 404, dl.text


def test_admin_cannot_read_another_users_note(client: TestClient, db_session):
    """Privacy: admins cannot read another user's note content."""
    admin, user_client, _ada = _seed_admin_and_user(client, db_session)
    doc_id = upload(user_client).json()["id"]
    note_id = user_client.post(
        f"/api/v1/notes/documents/{doc_id}/notes",
        json={"title": "Secret", "content": "mine"},
    ).json()["id"]

    # Admin may NOT fetch another user's note (owner-only content).
    got = admin.get(f"/api/v1/notes/{note_id}")
    assert got.status_code == 404, got.text


def test_admin_cannot_create_note_on_another_users_document(
    client: TestClient, db_session
):
    """Privacy: admins cannot create notes on another user's document."""
    admin, user_client, _ada = _seed_admin_and_user(client, db_session)
    doc_id = upload(user_client).json()["id"]

    created = admin.post(
        f"/api/v1/notes/documents/{doc_id}/notes",
        json={"title": "Admin note", "content": "observed by admin"},
    )
    assert created.status_code == 404, created.text


# --- admin full-site visibility (metadata only, no content) ----------------


def test_admin_sees_document_metadata_with_owners(client: TestClient, db_session):
    """Admin sees document metadata (not extracted text) via /admin/documents."""
    admin, user_client, _ada = _seed_admin_and_user(client, db_session)
    doc_id = upload(user_client).json()["id"]

    docs = admin.get("/api/v1/admin/documents").json()
    assert len(docs) >= 1
    found = next(d for d in docs if d["id"] == doc_id)
    assert found["owner_email"] == "ada@example.edu"
    assert found["owner_name"] == "Ada Lovelace"
    # Metadata only — no extracted text exposed to admins.
    assert "extracted_text" not in found


def test_admin_sees_note_metadata_without_content(client: TestClient, db_session):
    """Admin sees note metadata (not body content) via /admin/notes."""
    admin, user_client, _ada = _seed_admin_and_user(client, db_session)
    doc_id = upload(user_client).json()["id"]
    note_id = user_client.post(
        f"/api/v1/notes/documents/{doc_id}/notes",
        json={"title": "Secret", "content": "mine"},
    ).json()["id"]

    notes = admin.get("/api/v1/admin/notes").json()
    assert len(notes) >= 1
    found = next(n for n in notes if n["id"] == note_id)
    assert found["owner_email"] == "ada@example.edu"
    assert found["title"] == "Secret"
    # Note body is owner-only; admins do not see content.
    assert "content" not in found


def test_non_admin_cannot_see_admin_document_list(client: TestClient, db_session):
    user_client = auth_client(client, email="ada@example.edu")
    assert user_client.get("/api/v1/admin/documents").status_code == 403
    assert user_client.get("/api/v1/admin/notes").status_code == 403
