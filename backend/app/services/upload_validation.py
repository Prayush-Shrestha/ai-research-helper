"""Upload validation shared by the route and the test-suite.

Checks, in order: extension allowlist, size limit, magic-byte signature.
MIME type is treated as a hint only — the signature is what matters.
"""

from __future__ import annotations

from dataclasses import dataclass

ALLOWED_EXTENSIONS = {".pdf": "PDF", ".docx": "DOCX"}

PDF_MAGIC = b"%PDF"
DOCX_MAGIC = b"PK\x03\x04"


@dataclass
class ValidationResult:
    ok: bool
    error: str | None = None
    file_type: str | None = None


def validate_upload(filename: str, size_bytes: int, head: bytes, max_bytes: int) -> ValidationResult:
    if not filename or "." not in filename:
        return ValidationResult(ok=False, error="Only PDF or DOCX files are supported.")
    ext = "." + filename.rsplit(".", 1)[-1].lower()
    file_type = ALLOWED_EXTENSIONS.get(ext)
    if file_type is None:
        return ValidationResult(ok=False, error="Only PDF or DOCX files are supported.")
    if size_bytes <= 0:
        return ValidationResult(ok=False, error="This file appears to be empty.")
    if size_bytes > max_bytes:
        limit_mb = max_bytes / (1024 * 1024)
        return ValidationResult(
            ok=False,
            error=f"File is too large. Maximum size is {limit_mb:g} MB.",
        )
    expected = PDF_MAGIC if file_type == "PDF" else DOCX_MAGIC
    if not head.startswith(expected):
        return ValidationResult(
            ok=False,
            error=f"This file does not look like a real {file_type} document.",
        )
    return ValidationResult(ok=True, file_type=file_type)
