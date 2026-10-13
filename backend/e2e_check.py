"""End-to-end check against a live backend (PostgreSQL + real HTTP).

Run:  .venv/Scripts/python.exe e2e_check.py  (backend dev server on :8000)
Exits non-zero with the step name on any failure.
"""

import io
import json
import time
import urllib.request
import urllib.error
from http.cookiejar import CookieJar
from urllib.request import build_opener, HTTPCookieProcessor

BASE = "http://127.0.0.1:8000"
RUN = str(int(time.time() * 1000))[-6:]
EMAIL_A = f"e2e-{RUN}@example.edu"
EMAIL_B = f"other-{RUN}@example.edu"


def make_pdf(text="Hello Lumina E2E"):
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
        out += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"
    xref_at = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_at}\n%%EOF\n"
    ).encode()
    return out


class Client:
    def __init__(self):
        self.opener = build_opener(HTTPCookieProcessor(CookieJar()))

    def call(self, method, path, body=None, files=None):
        if files:
            boundary = "e2eboundary42"
            parts = []
            for name, (filename, content, ctype) in files.items():
                parts.append(f"--{boundary}\r\n".encode())
                parts.append(
                    f'Content-Disposition: form-data; name="{name}"; '
                    f'filename="{filename}"\r\n'.encode()
                )
                parts.append(f"Content-Type: {ctype}\r\n\r\n".encode())
                parts.append(content + b"\r\n")
            parts.append(f"--{boundary}--\r\n".encode())
            data = b"".join(parts)
            headers = {"Content-Type": f"multipart/form-data; boundary={boundary}"}
        elif body is not None:
            data = json.dumps(body).encode()
            headers = {"Content-Type": "application/json"}
        else:
            data, headers = None, {}
        req = urllib.request.Request(
            BASE + path, data=data, headers=headers, method=method
        )
        try:
            with self.opener.open(req) as res:
                raw = res.read()
                return res.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as exc:
            raw = exc.read()
            try:
                return exc.code, json.loads(raw) if raw else None
            except ValueError:
                return exc.code, {"raw": raw[:200].decode("latin-1")}


def check(name, condition, extra=""):
    print(("PASS " if condition else "FAIL ") + name, extra)
    if not condition:
        raise SystemExit(f"E2E FAILED AT: {name} {extra}")


a = Client()
b = Client()

s, _ = a.call("GET", "/healthz")
check("healthz", s == 200)

s, me = a.call("POST", "/api/v1/auth/register", {
    "name": "E2E User", "email": EMAIL_A, "password": "password-123"})
check("register", s == 201, str(me))

s, me = a.call("GET", "/api/v1/auth/me")
check("session cookie set", s == 200 and me["email"] == EMAIL_A)

s, dup = a.call("POST", "/api/v1/auth/register", {
    "name": "Dup", "email": EMAIL_A, "password": "password-123"})
check("duplicate rejected", s == 409)

pdf = make_pdf()
boundary_body = pdf
s, doc = a.call("POST", "/api/v1/documents/upload", files={
    "file": ("e2e-paper.pdf", boundary_body, "application/pdf")})
check("upload pdf", s == 201, str((doc or {}).get("extraction_status")))
check("text extracted", "Hello Lumina E2E" in (doc.get("extracted_text") or ""))
doc_id = doc["id"]

s, listing = a.call("GET", "/api/v1/documents?sort=newest")
check("list", s == 200 and listing["total"] == 1)
check("list omits text", "extracted_text" not in listing["items"][0])

s, found = a.call(
    "GET", "/api/v1/documents?search=e2e")
check("search", s == 200 and found["total"] == 1)

s, renamed = a.call("PATCH", f"/api/v1/documents/{doc_id}",
                    {"title": "Renamed Paper"})
check("rename", s == 200 and renamed["title"] == "Renamed Paper")

s, note = a.call("POST", "/api/v1/notes",
                 {"title": "E2E note", "content": "Remember this.",
                  "document_id": doc_id})
check("create note", s == 201)
note_id = note["id"]

s, dash = a.call("GET", "/api/v1/dashboard")
check("dashboard counts", s == 200 and dash["counts"] == {
    "total_documents": 1, "pdf_count": 1, "docx_count": 0,
    "total_notes": 1}, str((dash or {}).get("counts")))

s, _ = b.call("POST", "/api/v1/auth/register", {
    "name": "Other", "email": EMAIL_B, "password": "password-123"})
check("second user", s == 201)
s, _ = b.call("GET", f"/api/v1/documents/{doc_id}")
check("cross-user doc hidden", s == 404)
s, _ = b.call("GET", f"/api/v1/notes/{note_id}")
check("cross-user note hidden", s == 404)
s, dash2 = b.call("GET", "/api/v1/dashboard")
check("cross-user dashboard empty",
      s == 200 and dash2["counts"]["total_documents"] == 0)

s, _ = a.call("DELETE", f"/api/v1/documents/{doc_id}")
check("delete doc", s == 200)
s, listing = a.call("GET", "/api/v1/documents")
check("doc gone", listing["total"] == 0)
s, dash = a.call("GET", "/api/v1/dashboard")
check("notes cascaded", dash["counts"]["total_notes"] == 0)

s, _ = a.call("POST", "/api/v1/auth/logout")
check("logout", s == 200)
s, _ = a.call("GET", "/api/v1/auth/me")
check("session ended", s == 401)

print("E2E ALL PASS")
