"""Tests for document chunking service."""

from __future__ import annotations

from app.services.chunking import DocumentChunk, chunk_document, normalize_text


def test_normalize_text_collapses_whitespace():
    assert normalize_text("hello   world") == "hello world"
    assert normalize_text("a\n\n\nb") == "a\n\nb"
    assert normalize_text("  leading  ") == "leading"


def test_normalize_text_empty():
    assert normalize_text("") == ""
    assert normalize_text("   ") == ""


def test_chunk_document_empty_text():
    chunks = chunk_document("doc-1", "user-1", "Title", "PDF", None)
    assert chunks == []


def test_chunk_document_small_text_single_chunk():
    text = "This is a short document."
    chunks = chunk_document("doc-1", "user-1", "Title", "PDF", text, chunk_size=1000, overlap=200)
    assert len(chunks) == 1
    assert chunks[0].text == text
    assert chunks[0].chunk_index == 0
    assert chunks[0].document_id == "doc-1"
    assert chunks[0].owner_id == "user-1"
    assert chunks[0].document_title == "Title"
    assert chunks[0].file_type == "PDF"


def test_chunk_document_large_text_multiple_chunks():
    text = "word " * 500  # ~3000 chars
    chunks = chunk_document("doc-1", "user-1", "Title", "PDF", text, chunk_size=500, overlap=100)
    assert len(chunks) > 1
    assert all(c.document_id == "doc-1" for c in chunks)
    assert all(c.owner_id == "user-1" for c in chunks)
    assert [c.chunk_index for c in chunks] == list(range(len(chunks)))


def test_chunk_document_preserves_page_markers():
    text = "--- Page 1 ---\nPage one content here.\n--- Page 2 ---\nPage two content here."
    chunks = chunk_document("doc-1", "user-1", "Title", "PDF", text, chunk_size=1000, overlap=0)
    page_numbers = {c.page_number for c in chunks if c.page_number is not None}
    assert 1 in page_numbers or 2 in page_numbers


def test_chunk_document_metadata():
    chunks = chunk_document(
        "doc-1", "user-1", "My Title", "PDF", "Some text here.",
        metadata={"source": "upload"},
    )
    assert chunks[0].metadata == {"source": "upload"}


def test_chunk_document_to_dict():
    chunks = chunk_document("doc-1", "user-1", "Title", "PDF", "Some text.")
    d = chunks[0].to_dict()
    assert d["document_id"] == "doc-1"
    assert d["owner_id"] == "user-1"
    assert d["document_title"] == "Title"
    assert d["file_type"] == "PDF"
    assert d["chunk_index"] == 0
    assert d["text"] == "Some text."
