"""Document lifecycle tests: upload, validation, CRUD, download, isolation."""

from __future__ import annotations

import io
import os

from docx import Document as DocxDocument

from app.core.config import get_settings
from app.services.upload_validation import validate_upload
from app.tests.conftest import auth_client, register

def make_pdf_bytes(text: str = "Hello ResearchOS") -> bytes:
    """Build a minimal but fully valid one-page PDF (correct xref)."""
    stream = f"BT /F1 24 Tf 100 700 Td ({text}) Tj ET\n".encode("latin-1")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"endstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = b"%PDF-1.4\n"
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n".encode("ascii") + body + b"\nendobj\n"
    xref_at = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode("ascii")
    out += b"0000000000 65535 f \n"
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode("ascii")
    out += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_at}\n%%EOF\n"
    ).encode("ascii")
    return out


TINY_PDF = make_pdf_bytes()


def make_docx_bytes(text: str = "Machine learning changes everything.") -> bytes:
    document = DocxDocument()
    document.add_paragraph(text)
    table = document.add_table(rows=1, cols=2)
    table.cell(0, 0).text = "method"
    table.cell(0, 1).text = "result"
    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


def stored_files() -> list[str]:
    updir = get_settings().UPLOAD_DIRECTORY
    return sorted(os.listdir(updir)) if os.path.isdir(updir) else []


def upload(client, filename="paper.pdf", content=TINY_PDF, ctype="application/pdf"):
    return client.post(
        "/api/v1/documents/upload",
        files={"file": (filename, content, ctype)},
    )


# --- validation unit tests (no HTTP needed) -------------------------------


def test_validation_rejects_bad_extension():
    result = validate_upload("notes.txt", 100, b"hello", 15 * 1024 * 1024)
    assert not result.ok


def test_validation_rejects_oversize():
    big = b"%PDF" + b"x" * (15 * 1024 * 1024)
    result = validate_upload("big.pdf", len(big), big[:8], 15 * 1024 * 1024)
    assert not result.ok and "large" in (result.error or "")


def test_validation_rejects_wrong_magic():
    result = validate_upload("fake.pdf", 100, b"not-a-pdf!", 15 * 1024 * 1024)
    assert not result.ok


def test_validation_rejects_empty():
    result = validate_upload("empty.pdf", 0, b"", 15 * 1024 * 1024)
    assert not result.ok


# --- upload API ------------------------------------------------------------


def test_upload_pdf_extracts_text(client):
    register(client)
    response = upload(client)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["file_type"] == "PDF"
    assert body["extraction_status"] == "completed"
    assert "Hello ResearchOS" in (body["extracted_text"] or "")
    assert body["page_count"] == 1
    assert stored_files() != []
    # List responses never include the full text.
    listing = client.get("/api/v1/documents").json()
    assert "extracted_text" not in listing["items"][0]


def test_upload_docx_extracts_text_and_tables(client):
    register(client)
    content = make_docx_bytes()
    response = upload(client, "thesis.docx", content,
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["file_type"] == "DOCX"
    assert body["extraction_status"] == "completed"
    assert "Machine learning" in (body["extracted_text"] or "")
    assert "method | result" in (body["extracted_text"] or "")


def test_upload_scanned_pdf_needs_ocr(client):
    from pypdf import PdfWriter

    register(client)
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buffer = io.BytesIO()
    writer.write(buffer)
    response = upload(client, "scan.pdf", buffer.getvalue())
    assert response.status_code == 201, response.text
    assert response.json()["extraction_status"] == "requires_ocr"


def test_upload_rejects_unsupported_type(client):
    register(client)
    response = upload(client, "notes.txt", b"just text", "text/plain")
    assert response.status_code == 400
    assert stored_files() == []  # no orphaned file left behind


def test_upload_rejects_corrupt_pdf(client):
    # Valid magic bytes but garbage body: upload is accepted (metadata
    # preserved so the user can retry/remove) but extraction fails honestly.
    register(client)
    response = upload(client, "broken.pdf", b"%PDF definitely not a pdf")
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["extraction_status"] == "failed"
    assert body["extraction_error"]
    assert stored_files() != []


def test_upload_rejects_wrong_magic_bytes(client):
    register(client)
    response = upload(client, "fake.pdf", b"not-a-pdf-at-all")
    assert response.status_code == 400
    assert stored_files() == []


def test_upload_requires_auth(client):
    assert upload(client).status_code == 401


# --- list / search / filter / sort / pagination ----------------------------


def _seed(client):
    upload(client, "b-paper.pdf", TINY_PDF)
    upload(client, "a-thesis.docx", make_docx_bytes(),
           "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    upload(client, "c-notes.pdf", TINY_PDF)


def test_list_search_filter_sort(client):
    register(client)
    _seed(client)
    assert client.get("/api/v1/documents").json()["total"] == 3
    pdf_only = client.get("/api/v1/documents", params={"file_type": "PDF"}).json()
    assert pdf_only["total"] == 2
    found = client.get("/api/v1/documents", params={"search": "thesis"}).json()
    assert found["total"] == 1
    by_name = client.get("/api/v1/documents", params={"sort": "name"}).json()
    titles = [d["title"] for d in by_name["items"]]
    assert titles == sorted(titles)
    page = client.get("/api/v1/documents", params={"page": 1, "page_size": 2}).json()
    assert page["total"] == 3 and len(page["items"]) == 2
    assert page["page"] == 1 and page["page_size"] == 2


# --- detail / rename / download / text / retry / delete --------------------


def test_detail_rename_text_download_delete(client):
    register(client)
    doc_id = upload(client).json()["id"]

    detail = client.get(f"/api/v1/documents/{doc_id}")
    assert detail.status_code == 200
    assert detail.json()["original_filename"] == "paper.pdf"

    renamed = client.patch(f"/api/v1/documents/{doc_id}", json={"title": "New Title"})
    assert renamed.status_code == 200
    assert renamed.json()["title"] == "New Title"

    text = client.get(f"/api/v1/documents/{doc_id}/text").json()
    assert "Hello ResearchOS" in (text["extracted_text"] or "")

    download = client.get(f"/api/v1/documents/{doc_id}/download")
    assert download.status_code == 200
    assert download.content == TINY_PDF
    assert "attachment" in download.headers["content-disposition"]

    assert client.delete(f"/api/v1/documents/{doc_id}").status_code == 200
    assert client.get(f"/api/v1/documents/{doc_id}").status_code == 404
    assert stored_files() == []  # stored file removed with the row


def test_retry_extraction_endpoint(client):
    register(client)
    doc_id = upload(client).json()["id"]
    response = client.post(f"/api/v1/documents/{doc_id}/retry-extraction")
    assert response.status_code == 200
    assert response.json()["extraction_status"] == "completed"


# --- cross-user isolation ---------------------------------------------------


def test_users_cannot_touch_each_others_documents(client):
    register(client, email="ada@example.edu")
    doc_id = upload(client).json()["id"]
    other = auth_client(client, email="grace@example.edu")

    assert other.get(f"/api/v1/documents/{doc_id}").status_code == 404
    assert other.patch(f"/api/v1/documents/{doc_id}", json={"title": "x"}).status_code == 404
    assert other.delete(f"/api/v1/documents/{doc_id}").status_code == 404
    assert other.get(f"/api/v1/documents/{doc_id}/download").status_code == 404
    assert other.get(f"/api/v1/documents/{doc_id}/text").status_code == 404
    assert other.get("/api/v1/documents").json()["total"] == 0
