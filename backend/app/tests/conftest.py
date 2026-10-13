"""Pytest bootstrap: isolated file-SQLite DB + overridden session factory.

Production uses PostgreSQL (see docker-compose.yml). The suite runs
against a throwaway SQLite file so it needs no credentials and leaves
no trace. Models deliberately avoid Postgres-only column types, so the
same code paths are exercised here.
"""

from __future__ import annotations

import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault(
    "SECRET_KEY", "test-secret-not-real-0123456789abcdef0123456789"
)
os.environ.setdefault("FRONTEND_ORIGIN", "http://testserver")
# Rate limiting stays configured in tests, just with a ceiling the suite
# itself will never hit (each test would otherwise share one 10/min bucket).
os.environ.setdefault("AUTH_RATE_LIMIT", "1000/minute")

from app.api import dependencies  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.main import create_app  # noqa: E402


@pytest.fixture()
def db_session(tmp_path_factory) -> Iterator:
    tmpdir = tmp_path_factory.mktemp("db")
    url = f"sqlite:///{tmpdir}/test.db"
    engine = create_engine(url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = factory()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(db_session) -> Iterator[TestClient]:
    def override_db():
        try:
            yield db_session
        finally:
            pass

    app = create_app()
    app.dependency_overrides[dependencies.get_db] = override_db
    with TestClient(app, base_url="http://testserver") as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def isolated_storage(tmp_path, monkeypatch):
    """Every test uploads into a throwaway directory (restored afterwards)."""
    monkeypatch.setattr(
        get_settings(), "UPLOAD_DIRECTORY", str(tmp_path / "uploads")
    )


def register(client: TestClient, name="Ada Lovelace", email="ada@example.edu"):
    response = client.post(
        "/api/v1/auth/register",
        json={"name": name, "email": email, "password": "correct-horse-99"},
    )
    assert response.status_code == 201, response.text
    return response.json()


def login(client: TestClient, email="ada@example.edu"):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "correct-horse-99"},
    )
    assert response.status_code == 200, response.text
    return response.json()


def auth_client(base: TestClient, email="ada@example.edu") -> TestClient:
    """A fresh client holding that user's session cookie."""
    register(base, email=email)
    fresh = TestClient(base.app, base_url="http://testserver")
    response = fresh.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "correct-horse-99"},
    )
    assert response.status_code == 200, response.text
    return fresh
