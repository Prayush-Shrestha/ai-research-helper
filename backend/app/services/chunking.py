"""Document chunking for RAG indexing.

Splits extracted document text into overlapping chunks while preserving
page boundaries, document metadata, and chunk order. Deterministic: the same
document always produces the same chunks, so re-indexing is safe and
duplicate-free.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Marker left by the Phase 1 PDF extractor: ``--- Page N ---``.
_PAGE_MARKER = re.compile(r"^--- Page (\d+) ---\s*$", re.MULTILINE)


@dataclass
class DocumentChunk:
    """One chunk of a document ready for embedding."""

    document_id: str
    owner_id: str
    document_title: str
    file_type: str
    chunk_index: int
    text: str
    page_number: int | None = None
    start_char: int | None = None
    end_char: int | None = None
    metadata: dict | None = None

    def to_dict(self) -> dict:
        return {
            "document_id": self.document_id,
            "owner_id": self.owner_id,
            "document_title": self.document_title,
            "file_type": self.file_type,
            "chunk_index": self.chunk_index,
            "text": self.text,
            "page_number": self.page_number,
            "start_char": self.start_char,
            "end_char": self.end_char,
            "metadata": self.metadata or {},
        }


def normalize_text(text: str) -> str:
    """Normalize whitespace without destroying paragraph structure.

    - Collapses runs of spaces/tabs to a single space within a line.
    - Strips trailing whitespace per line.
    - Keeps paragraph breaks (blank lines) intact.
    - Removes leading/trailing blank lines.
    """
    if not text:
        return ""
    lines = []
    for line in text.split("\n"):
        lines.append(re.sub(r"[ \t]+", " ", line).strip())
    # Collapse 3+ blank lines into a single paragraph break.
    cleaned = "\n".join(lines)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def _split_into_pages(text: str) -> list[tuple[int | None, str]]:
    """Split text into (page_number, page_text) pairs.

    The Phase 1 extractor inserts ``--- Page N ---`` markers between pages.
    Text before the first marker is treated as page 1 (or None if no markers
    exist at all, meaning we cannot infer pages).
    """
    if not text.strip():
        return []

    # Find all page markers.
    markers = list(_PAGE_MARKER.finditer(text))
    if not markers:
        # No page markers — treat whole text as a single page-less block.
        return [(None, text)]

    pages: list[tuple[int | None, str]] = []
    prev_end = 0
    for i, match in enumerate(markers):
        page_num = int(match.group(1))
        start = match.end()
        # End of this page is the start of the next marker, or end of text.
        end = markers[i + 1].start() if i + 1 < len(markers) else len(text)
        page_text = text[start:end].strip()
        if page_text:
            pages.append((page_num, page_text))
        prev_end = end

    # Text before the first marker (front matter).
    front = text[: markers[0].start()].strip()
    if front:
        pages.insert(0, (None, front))

    return pages


def _chunk_text(
    text: str, chunk_size: int, overlap: int
) -> list[tuple[str, int, int]]:
    """Split a single page's text into overlapping chunks.

    Returns list of (chunk_text, start_char, end_char) relative to the page.
    Splits on sentence boundaries where possible to keep chunks readable.
    """
    if not text:
        return []

    if len(text) <= chunk_size:
        return [(text, 0, len(text))]

    chunks: list[tuple[str, int, int]] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)

        # If we're not at the end, try to break on a sentence boundary.
        if end < text_len:
            # Look for the last sentence-ending punctuation within a window.
            window = text[start:end]
            sentence_end = max(
                window.rfind(". "),
                window.rfind("! "),
                window.rfind("? "),
                window.rfind(".\n"),
                window.rfind("!\n"),
                window.rfind("?\n"),
            )
            if sentence_end != -1:
                end = start + sentence_end + 2  # include the punctuation + space
                if end > text_len:
                    end = text_len

        chunk_text = text[start:end].strip()
        if chunk_text:
            chunks.append((chunk_text, start, end))

        if end >= text_len:
            break

        # Next start backs off by overlap, but never before current start+1.
        next_start = end - overlap
        if next_start <= start:
            next_start = start + 1
        start = next_start

    return chunks


def chunk_document(
    document_id: str,
    owner_id: str,
    document_title: str,
    file_type: str,
    text: str | None,
    *,
    chunk_size: int = 1000,
    overlap: int = 200,
    metadata: dict | None = None,
) -> list[DocumentChunk]:
    """Split a document's extracted text into ordered, overlapping chunks.

    Returns an empty list for empty/None text (caller should mark the
    document as requiring OCR or failed, not as completed with zero chunks).
    """
    if not text or not text.strip():
        logger.warning(
            "Document %s has no extractable text; producing zero chunks.",
            document_id,
        )
        return []

    clean = normalize_text(text)
    pages = _split_into_pages(clean)

    chunks: list[DocumentChunk] = []
    global_index = 0
    char_offset = 0

    for page_number, page_text in pages:
        page_chunks = _chunk_text(page_text, chunk_size, overlap)
        for chunk_text, start_char, end_char in page_chunks:
            chunks.append(
                DocumentChunk(
                    document_id=document_id,
                    owner_id=owner_id,
                    document_title=document_title,
                    file_type=file_type,
                    chunk_index=global_index,
                    text=chunk_text,
                    page_number=page_number,
                    start_char=char_offset + start_char,
                    end_char=char_offset + end_char,
                    metadata=metadata,
                )
            )
            global_index += 1
        # Advance char offset by the length of this page's text + separator.
        char_offset += len(page_text) + 2  # +2 for the "\n\n" between pages

    if not chunks:
        logger.warning(
            "Document %s produced zero chunks after splitting.", document_id
        )

    return chunks
