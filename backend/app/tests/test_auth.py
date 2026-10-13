"""Authentication flow tests (register / login / logout / me / guards)."""

from __future__ import annotations

from app.tests.conftest import login, register


def test_register_success(client):
    user = register(client)
    assert user["email"] == "ada@example.edu"
    assert user["name"] == "Ada Lovelace"
    assert "password" not in user and "password_hash" not in user
    # Registration signs the user in immediately (session cookie set).
    assert "ros_session" in client.cookies


def test_register_duplicate_email_rejected(client):
    register(client)
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Other", "email": "ada@example.edu", "password": "another-pass-1"},
    )
    assert response.status_code == 409


def test_register_validation(client):
    bad_password = client.post(
        "/api/v1/auth/register",
        json={"name": "A", "email": "a@example.edu", "password": "short"},
    )
    assert bad_password.status_code == 422
    bad_email = client.post(
        "/api/v1/auth/register",
        json={"name": "A", "email": "not-an-email", "password": "long-enough-1"},
    )
    assert bad_email.status_code == 422


def test_login_success_and_me(client):
    register(client)
    client.cookies.clear()
    login(client)
    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "ada@example.edu"


def test_login_wrong_password_rejected(client):
    register(client)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "ada@example.edu", "password": "wrong-password-0"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password."


def test_login_unknown_email_same_message(client):
    # Same message as a wrong password: no account enumeration here.
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.edu", "password": "whatever-pass-1"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password."


def test_protected_endpoint_requires_session(client):
    assert client.get("/api/v1/auth/me").status_code == 401
    assert client.get("/api/v1/documents").status_code == 401


def test_logout_clears_session(client):
    register(client)
    assert client.get("/api/v1/auth/me").status_code == 200
    assert client.post("/api/v1/auth/logout").status_code == 200
    client.cookies.clear()  # TestClient keeps the cleared jar honestly empty
    assert client.get("/api/v1/auth/me").status_code == 401
