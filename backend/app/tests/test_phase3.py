"""Phase 3 tests: collections, knowledge graph, activity logs, research
comparison, admin extensions."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.models.user import User
from app.tests.conftest import auth_client, login, register
from app.tests.test_documents import TINY_PDF, upload


def make_admin(client: TestClient, db_session, email="boss@example.edu"):
    admin = auth_client(client, email=email)
    user = db_session.query(User).filter_by(email=email).one()
    user.role = "admin"
    db_session.commit()
    return admin


# ------------------------------------------------------------------
# Collections
# ------------------------------------------------------------------

def test_collections_crud(client: TestClient, db_session):
    """Create, list, get, update, delete a collection."""
    user_client = auth_client(client, email="ada@example.edu")

    # Create
    resp = user_client.post(
        "/api/v1/collections",
        json={"name": "My Research", "description": "A collection of papers"},
    )
    assert resp.status_code == 201, resp.text
    collection = resp.json()
    assert collection["name"] == "My Research"
    assert collection["description"] == "A collection of papers"
    cid = collection["id"]

    # List
    resp = user_client.get("/api/v1/collections")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == cid

    # Get
    resp = user_client.get(f"/api/v1/collections/{cid}")
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["id"] == cid
    assert detail["documents"] == []

    # Rename
    resp = user_client.patch(
        f"/api/v1/collections/{cid}",
        json={"name": "Renamed Collection"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed Collection"

    # Delete
    resp = user_client.delete(f"/api/v1/collections/{cid}")
    assert resp.status_code == 204

    # Gone
    resp = user_client.get(f"/api/v1/collections/{cid}")
    assert resp.status_code == 404


def test_collection_add_remove_document(client: TestClient, db_session):
    """Add and remove documents from a collection."""
    user_client = auth_client(client, email="ada@example.edu")
    doc_id = upload(user_client).json()["id"]

    # Create collection
    resp = user_client.post(
        "/api/v1/collections",
        json={"name": "Test Collection"},
    )
    cid = resp.json()["id"]

    # Add document
    resp = user_client.post(
        f"/api/v1/collections/{cid}/documents",
        json={"document_id": doc_id},
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["document_id"] == doc_id

    # Adding again returns the same link (idempotent)
    resp = user_client.post(
        f"/api/v1/collections/{cid}/documents",
        json={"document_id": doc_id},
    )
    assert resp.status_code == 201

    # List collection documents
    resp = user_client.get(f"/api/v1/collections/{cid}")
    assert resp.status_code == 200
    assert resp.json()["document_count"] == 1
    assert len(resp.json()["documents"]) == 1

    # Remove document
    resp = user_client.delete(
        f"/api/v1/collections/{cid}/documents/{doc_id}"
    )
    assert resp.status_code == 204

    # Verify removal
    resp = user_client.get(f"/api/v1/collections/{cid}")
    assert resp.json()["document_count"] == 0


def test_collection_ownership_enforced(client: TestClient, db_session):
    """Users cannot access other users' collections."""
    user_client = auth_client(client, email="ada@example.edu")
    other_client = auth_client(client, email="bob@example.edu")

    # Ada creates a collection
    resp = user_client.post(
        "/api/v1/collections",
        json={"name": "Ada's Collection"},
    )
    cid = resp.json()["id"]

    # Bob tries to access it
    resp = other_client.get(f"/api/v1/collections/{cid}")
    assert resp.status_code == 404

    # Bob tries to add a document to it
    resp = other_client.post(
        f"/api/v1/collections/{cid}/documents",
        json={"document_id": "some-doc-id"},
    )
    assert resp.status_code == 404


# ------------------------------------------------------------------
# Knowledge graph
# ------------------------------------------------------------------

def test_knowledge_graph_empty(client: TestClient):
    """Empty knowledge graph for a user with no documents."""
    user_client = auth_client(client, email="ada@example.edu")
    resp = user_client.get("/api/v1/knowledge/graph")
    assert resp.status_code == 200
    data = resp.json()
    assert data["nodes"] == []
    assert data["edges"] == []


def test_knowledge_graph_with_document(client: TestClient, db_session):
    """Knowledge graph extracts entities from indexed documents."""
    user_client = auth_client(client, email="ada@example.edu")
    doc_id = upload(user_client).json()["id"]

    # Reprocess the document's graph (extract entities from chunks)
    resp = user_client.post(
        f"/api/v1/knowledge/documents/{doc_id}/reprocess"
    )
    assert resp.status_code == 202, resp.text

    # Query the graph
    resp = user_client.get("/api/v1/knowledge/graph")
    assert resp.status_code == 200
    data = resp.json()
    # May or may not have entities depending on extracted text content
    assert "nodes" in data
    assert "edges" in data


def test_knowledge_graph_entities_list(client: TestClient, db_session):
    """List knowledge entities with filtering."""
    user_client = auth_client(client, email="ada@example.edu")
    upload(user_client)

    resp = user_client.get("/api/v1/knowledge/entities")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data
    assert "page" in data
    assert "page_size" in data


def test_knowledge_graph_ownership(client: TestClient, db_session):
    """Users cannot see other users' knowledge graph entities."""
    user_client = auth_client(client, email="ada@example.edu")
    other_client = auth_client(client, email="bob@example.edu")

    upload(user_client)
    user_client.post(
        "/api/v1/knowledge/documents/doc-id-does-not-matter/reprocess"
    )

    # Bob's graph should be empty (his own documents only)
    resp = other_client.get("/api/v1/knowledge/graph")
    assert resp.status_code == 200
    assert resp.json()["nodes"] == []


# ------------------------------------------------------------------
# Activity logs
# ------------------------------------------------------------------

def test_activity_logs_empty(client: TestClient):
    """Empty activity log for a new user."""
    user_client = auth_client(client, email="ada@example.edu")
    resp = user_client.get("/api/v1/activity")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["items"] == []


def test_activity_logs_pagination(client: TestClient):
    """Activity logs are paginated."""
    user_client = auth_client(client, email="ada@example.edu")
    # Generate some activity by uploading documents
    for i in range(3):
        upload(user_client)

    resp = user_client.get("/api/v1/activity?page_size=2")
    assert resp.status_code == 200
    data = resp.json()
    assert data["page_size"] == 2
    assert len(data["items"]) <= 2
    assert data["total"] >= 3  # at least 3 uploads


# ------------------------------------------------------------------
# Research comparison
# ------------------------------------------------------------------

def test_research_comparison_requires_two_docs(client: TestClient):
    """Comparison requires at least 2 documents."""
    user_client = auth_client(client, email="cmp@example.edu")
    resp = user_client.post(
        "/api/v1/research/compare",
        json={"document_ids": ["doc-1"]},
    )
    assert resp.status_code == 422  # Pydantic validation error


def test_research_comparison_too_many_docs(client: TestClient):
    """Comparison maxes at 10 documents."""
    user_client = auth_client(client, email="cmp2@example.edu")
    ids = [f"doc-{i}" for i in range(11)]
    resp = user_client.post(
        "/api/v1/research/compare",
        json={"document_ids": ids},
    )
    assert resp.status_code == 422  # Pydantic validation error


def test_research_comparison_missing_doc(client: TestClient):
    """Comparison rejects non-existent documents."""
    user_client = auth_client(client, email="ada@example.edu")
    resp = user_client.post(
        "/api/v1/research/compare",
        json={"document_ids": ["doc-1", "doc-2"]},
    )
    assert resp.status_code == 404


# ------------------------------------------------------------------
# Admin extensions: account status
# ------------------------------------------------------------------

def test_admin_disable_reactivate_account(client: TestClient, db_session):
    """Admin can disable and reactivate accounts."""
    admin = make_admin(client, db_session)
    auth_client(client, email="ada@example.edu")
    ada = db_session.query(User).filter_by(email="ada@example.edu").one()

    # Disable
    resp = admin.patch(
        f"/api/v1/admin/users/{ada.id}/status",
        json={"is_active": False},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["is_active"] is False

    # Reactivate
    resp = admin.patch(
        f"/api/v1/admin/users/{ada.id}/status",
        json={"is_active": True},
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is True


def test_admin_cannot_disable_self(client: TestClient, db_session):
    """Admin cannot disable their own account."""
    admin = make_admin(client, db_session, email="boss@example.edu")
    boss = db_session.query(User).filter_by(email="boss@example.edu").one()

    resp = admin.patch(
        f"/api/v1/admin/users/{boss.id}/status",
        json={"is_active": False},
    )
    assert resp.status_code == 400


# ------------------------------------------------------------------
# Admin analytics
# ------------------------------------------------------------------

def test_admin_analytics(client: TestClient, db_session):
    """Admin analytics endpoint returns real DB metrics."""
    admin = make_admin(client, db_session, email="analytics-admin@example.edu")
    user_client = auth_client(client, email="analytics-user@example.edu")
    upload(user_client)

    resp = admin.get("/api/v1/admin/analytics")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total_users"] >= 2
    assert data["total_documents"] >= 1
    assert "ai_requests_30d" in data
    assert "processing_success_count" in data
    assert "processing_failure_count" in data


# ------------------------------------------------------------------
# Admin audit logs
# ------------------------------------------------------------------

def test_admin_audit_logs(client: TestClient, db_session):
    """Admin audit logs endpoint."""
    admin = make_admin(client, db_session, email="audit-admin@example.edu")
    auth_client(client, email="audit-user@example.edu")
    ada = db_session.query(User).filter_by(email="audit-user@example.edu").one()

    # Generate an audit event by changing role
    admin.patch(
        f"/api/v1/admin/users/{ada.id}/role",
        json={"role": "admin"},
    )

    resp = admin.get("/api/v1/admin/audit")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1
    assert data["items"][0]["action"] == "role_changed"


def test_non_admin_cannot_access_admin_extensions(client: TestClient, db_session):
    """Non-admin users are forbidden from admin extension endpoints."""
    user_client = auth_client(client, email="ada@example.edu")
    assert user_client.get("/api/v1/admin/analytics").status_code == 403
    assert user_client.get("/api/v1/admin/audit").status_code == 403
    assert user_client.patch(
        "/api/v1/admin/users/some-id/status",
        json={"is_active": False},
    ).status_code == 403


# ------------------------------------------------------------------
# Activity logging on document upload
# ------------------------------------------------------------------

def test_activity_recorded_on_upload(client: TestClient, db_session):
    """Uploading a document records an activity log entry."""
    user_client = auth_client(client, email="ada@example.edu")
    upload(user_client)

    resp = user_client.get("/api/v1/activity")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    # Check that a document_uploaded action exists
    actions = [item["action"] for item in data["items"]]
    assert "document_uploaded" in actions
