"""Admin console tests: role guard, stats, user management, allowlist."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.models.user import User
from app.tests.conftest import auth_client, login, register


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
