# Lumina Phase 4 — Implementation Plan

## Status: In progress

## Audit findings (verified by reading all source)

### Critical bugs (block correctness)
1. `backend/app/services/rag.py:117` — `rag.ask` calls `self._vs.similarity_search(...)` without `await` (it's async). Returns coroutine, breaks RAG entirely. Tests mask it with MagicMock.
2. `backend/app/services/rag.py:374` — `summarize_document` calls `self._llm.generate_answer(...)` without awaiting (async method).
3. `backend/app/services/research_comparison_service.py:283` — `compare_documents` calls `self._llm.generate_answer(...)` without awaiting.
4. `backend/app/services/rag.py:478` — `build_knowledge_graph` references `KnowledgeEdge` without importing it; fails only when edges exist.
5. `backend/app/services/rag.py:408` — `summarize_document` builds citations with `c.get("chunk_id")` but chunks use key `"id"`.
6. `backend/app/api/v1/research.py:111-133` — `list_conversations` returns `ConversationListOut` = `{ "conversations": [...] }` but frontend `getConversations()` typed as `Conversation[]` and assistant page does `setConversations(convs)` (expects array). Breaks assistant page on mount.
7. `backend/app/api/dependencies.py:75` — `require_same_origin` returns early when `origin is None`, allowing cross-origin cookie requests without Origin header.
8. `backend/app/api/v1/admin_extensions.py:165-168` — `read_admin_analytics` uses `func.julianday()` (SQLite-only) — breaks on PostgreSQL.
9. `backend/app/api/v1/admin_extensions.py:65-119` — `update_user_status` only writes audit log; does not actually disable auth. No `is_active` column.
10. Admin content bypasses: `document_service.get_document`, `notes_service.get_note`, `collection_service.get_collection`/`list_collection_documents` let admins read any user's private content. Privacy policy requires owner-only content.
11. Upload never auto-indexes: `document_service.create_document_from_upload` extracts text but never triggers indexing. Frontend claims "Document indexed" incorrectly.
12. `frontend/src/types/document.ts:25` — `indexing_status?: IndexingStatus` self-references a type that doesn't exist as a type.
13. `frontend/src/lib/api.ts:128` — `getDocumentText` typed as `ResearchDocument` though backend returns `DocumentTextOut` (smaller payload).

### Security / privacy (required)
- Admins must NOT automatically get unrestricted access to private document contents/conversations. Owner-only content; admins get metadata/aggregate visibility only.
- Add real `users.is_active` column; enforce in `get_current_user`/login; real disable/reactivate.

### Missing production readiness
- No Dockerfiles exist. `docker-compose.yml` only has Postgres (no backend/frontend services).
- No env validation, structured logging, or readiness endpoint beyond `/healthz`.

## Plan (grouped)

### CRITICAL (do first)
A. Backend: `users.is_active` migration + enforce in auth (get_current_user, login, register/admin status).
B. Backend: fix RAG sync/async bugs (rag.ask await similarity_search; summarize_document await generate_answer; comparison await generate_answer; import KnowledgeEdge; citation key chunk_id→id).
C. Backend: remove admin content bypasses (document_service, notes_service, collection_service); owner-only content policy; update affected tests.
D. Backend: fix admin_extensions (real is_active disable/reactivate; PostgreSQL-compatible analytics without julianday).
E. Backend: auto-index uploaded documents (call indexing after extraction completes).
F. Backend: fix `require_same_origin` to reject missing Origin on mutations.
G. Frontend: fix `getConversations` to return `{ conversations: [] }` shape / assistant page to handle it.
H. Frontend: fix `IndexingStatus` self-referential type + `getDocumentText` return type.
I. Tests: add integration tests (upload→index→ask, admin privacy, inactive-user denial, analytics, RAG summary/comparison). Update admin tests.

### HIGH
J. Docker: backend Dockerfile, frontend Dockerfile, docker-compose.yml with pgvector + healthchecks + persistent volumes.
K. Config: env validation at startup, structured logging, `/readyz` readiness endpoint.
L. Docs: update README for Phase 4, add deployment guide.
M. Run all tests, typecheck, builds; fix regressions.

### OPTIONAL
N. Non-root containers, security headers, CORS hardening details.

## Affected files
- backend/alembic/versions/0007_is_active.py (new)
- backend/app/models/user.py (add is_active)
- backend/app/api/dependencies.py (enforce is_active, origin check)
- backend/app/api/v1/auth.py (login enforce is_active)
- backend/app/api/v1/admin_extensions.py (real status, analytics)
- backend/app/services/document_service.py (remove admin bypass, auto-index)
- backend/app/services/notes_service.py (remove admin bypass)
- backend/app/services/collection_service.py (remove admin bypass)
- backend/app/services/rag.py (await bugs, import, citation key)
- backend/app/services/research_comparison_service.py (await bug)
- backend/app/api/v1/research.py (conversations shape)
- frontend/src/lib/api.ts (getConversations, getDocumentText types)
- frontend/src/app/(app)/assistant/page.tsx (conversations shape)
- frontend/src/types/document.ts (IndexingStatus type)
- backend/app/tests/test_admin.py (update for privacy policy)
- backend/app/tests/test_*.py (new integration tests)
- Dockerfile.backend, Dockerfile.frontend, docker-compose.yml (new)
- backend/.env.example, frontend/.env.example (update)
- README.md (update)
