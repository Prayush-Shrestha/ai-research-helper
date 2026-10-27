# Lumina — AI Research & Knowledge Assistant (Phase 1: Core Research Assistant)

Lumina (built from the "ResearchOS" Phase 1 specification) is a personal research
workspace for students: manage academic documents, extract their text, organize
materials, keep research notes, and prepare everything for future AI-powered
question answering (Phase 2: RAG).

> Brand note: the product UI is branded **Lumina**. API titles, docs, and this
> README use the Lumina name; the underlying Phase 1 plan was authored as
> "ResearchOS".

## Main features

- Real authentication (register / login / logout / me) with Argon2 password
  hashes and HttpOnly cookie sessions — no tokens in localStorage.
- PDF (pypdf) and DOCX (python-docx) upload with validation (extension,
  15 MB cap, magic-byte signatures), safe UUID storage, and real text
  extraction with honest statuses (`completed`, `requires_ocr`, `failed`, …).
- Document library: server-side search, file-type filter, sorting,
  pagination, rename, download, delete, retry-extraction. Ownership enforced
  on every endpoint.
- Personal research notes in PostgreSQL (per-document and standalone),
  with explicit save states.
- Dashboard with live database counts and recent items.
- Frontend: Next.js 16 App Router + TypeScript + Tailwind 4, typed API
  client, loading/error/empty/success states everywhere. No mock fallbacks.

## Technology stack

| Layer    | Choice                                              |
| -------- | --------------------------------------------------- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend  | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, Uvicorn |
| Database | PostgreSQL 16 (primary); throwaway SQLite file for tests only |
| Auth     | Argon2id hashes, JWT in HttpOnly `SameSite=Lax` cookie, slowapi rate limits |
| Files    | pypdf, python-docx, python-multipart, local disk storage service |
| Tests    | pytest (33 tests) + `backend/e2e_check.py` live end-to-end script |

## Project architecture

```
researchos/
  frontend/                 # Next.js App Router (port 3002)
    src/app/                # routes: /, /login, /register, /dashboard,
                            #   /documents, /documents/[id], /assistant,
                            #   /collections, /notes, /history, /insights,
                            #   /knowledge, /publish, /toolkit, /roadmap,
                            #   /guide, /settings
    src/components/         # layout, documents, dashboard, assistant, ui, …
    src/context/            # AuthContext (cookie session), ThemeContext
    src/hooks/              # useDocuments, useNotes, useCollections,
                            #   useHistory, useAuth, useTheme
    src/lib/                # api.ts — the ONLY backend client; research.ts
                            #   (local extractive helpers); student.ts; utils.ts
    src/types/              # User, ResearchDocument, ResearchNote, …
  backend/                  # FastAPI service (port 8000)
    app/main.py             # app factory, CORS, cookie auth, rate-limit wiring
    app/core/               # config (env), security (argon2 + JWT)
    app/db/                 # engine/session, Base
    app/models/             # User, Document, ResearchNote
    app/schemas/            # Pydantic request/response models
    app/api/                # dependencies (session user, origin check)
    app/api/v1/             # auth, documents, notes, dashboard routers
    app/services/           # auth/document/notes/dashboard logic, storage,
                            #   extraction, upload validation
    app/tests/              # pytest suite (isolated SQLite file, no creds)
    alembic/                # migrations (0001_initial)
    e2e_check.py            # live end-to-end script (needs dev server + PG)
    storage/                # uploaded files (gitignored, created on demand)
  docker-compose.yml        # PostgreSQL 16 for local development
```

Route handlers stay thin; business logic lives in `services/`. The storage
layer is a small `StorageService` protocol so object storage can replace
local disk in a later phase without touching routes.

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- Docker Desktop (for PostgreSQL), or a local PostgreSQL 16 server

## Environment setup

```powershell
# 1. Database (from the repo root)
docker compose up -d

# 2. Backend env
Copy-Item backend\.env.example backend\.env
# Edit backend\.env: set a long random SECRET_KEY (required).
# DATABASE_URL default: postgresql+psycopg://researchos:researchos@localhost:5432/researchos

# 3. Frontend env (already correct by default)
# frontend/.env.local -> NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Backend env vars (`backend/.env`): `DATABASE_URL`, `SECRET_KEY`,
`FRONTEND_ORIGIN`, `ENV` (development/production), `BACKEND_HOST`,
`BACKEND_PORT`, `UPLOAD_DIRECTORY`, `MAX_UPLOAD_SIZE_MB`,
`SESSION_COOKIE_NAME`, `SESSION_EXPIRE_DAYS`, `COOKIE_SECURE`
(auto-true in production), `AUTH_RATE_LIMIT` (default `10/minute`).

## Backend installation

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Frontend installation

```powershell
cd frontend
npm install
```

## Database migrations

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
# fresh database, documented path (no autocreate in production code):
python -m alembic upgrade head
# create a new migration after model changes:
# python -m alembic revision --autogenerate -m "describe change"
```

## How to run the application locally

Two terminals (PowerShell):

```powershell
# Terminal 1 — backend (from backend/)
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```powershell
# Terminal 2 — frontend (from frontend/)
npm run dev
```

Open http://localhost:3002. Register an account, upload a PDF or DOCX,
open it to read extracted text, add a note, watch the dashboard count it.

If port 5432 is taken (another Postgres), either stop the other container
or map ours elsewhere, e.g. `docker run ... -p 5433:5432 ...`, and point
`DATABASE_URL` at `:5433`.

## API documentation

With `ENV=development`, interactive docs live at:

- Swagger UI: http://localhost:8000/docs
- Health: http://localhost:8000/healthz

All data routes sit under `/api/v1` (auth, documents, notes, dashboard).

## How to run tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest app/tests -q          # 33 tests, isolated SQLite file
python ..\..\backend\e2e_check.py      # needs: dev server on :8000 + PostgreSQL
```

Frontend checks (from `frontend/`):

```powershell
npx tsc --noEmit
npx eslint src/lib/api.ts src/context/AuthContext.tsx src/hooks/useDocuments.ts src/hooks/useNotes.ts
npm run build
```

Tests never need production credentials. The pytest suite uses a throwaway
SQLite file per test module because the models avoid Postgres-only column
types; every query path is identical on PostgreSQL.

## Current Phase 1 limitations

- No OCR: image-only PDFs report `requires_ocr` honestly instead of text.
- Collections, history, and theme live in browser localStorage (single-user
  device data); documents, notes, and accounts live in PostgreSQL.
- No toast system; feedback is inline (alerts, save states, progress bars).
- Upload library has no grid-view toggle (list-first layout by design).
- Session "remember me" is fixed-length (7 days); no password reset flow yet.
- `backend/e2e_check.py` targets `127.0.0.1:8000` and default PG credentials.

## Phase 2: RAG (implemented)

Lumina now includes a Retrieval-Augmented Generation (RAG) research assistant:

- **Document chunking**: Extracted text is split into overlapping chunks with page-level metadata where available.
- **Embeddings**: Configurable provider (local simhash for offline/dev, OpenAI, or Ollama). Vectors are stored alongside document chunks.
- **Vector search**: PostgreSQL with pgvector is preferred; a JSON-based in-Python fallback works on SQLite and as a safe fallback.
- **Grounded Q&A**: Answers are generated strictly from retrieved document chunks, with verifiable source citations (document title + page number when available).
- **Conversations**: Persistent chat sessions with per-conversation document scoping, message history, rename, and delete.
- **Cost control**: Request timeouts, rate limits, per-user AI usage tracking, and configurable model selection.

### RAG environment variables

Add to `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBEDDING_PROVIDER` | `local` | `local`, `openai`, or `ollama` |
| `EMBEDDING_MODEL` | `local-simhash-v1` | Embedding model name |
| `LLM_PROVIDER` | `local` | `local`, `openai`, or `ollama` |
| `LLM_MODEL` | `local-extractive-v1` | LLM model name |
| `OPENAI_API_KEY` | *(unset)* | Required when using `openai` provider |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible API base URL |
| `RAG_CHUNK_SIZE` | `1000` | Characters per chunk |
| `RAG_CHUNK_OVERLAP` | `200` | Overlap between chunks |
| `RAG_TOP_K` | `5` | Chunks retrieved per question |
| `RAG_SIMILARITY_THRESHOLD` | `0.30` | Minimum similarity to include a chunk |
| `RAG_MAX_QUESTION_CHARS` | `2000` | Max question length |
| `RAG_MAX_CONTEXT_CHARS` | `6000` | Max context chars sent to LLM |
| `RAG_RATE_LIMIT` | `30/minute` | Rate limit for ask endpoint |
| `RAG_REQUEST_TIMEOUT` | `60` | Upstream request timeout (seconds) |
| `RAG_TRACK_USAGE` | `true` | Track per-user AI usage |

### Running RAG

1. Add RAG env vars to `backend/.env` (see table above).
2. Run `python -m alembic upgrade head` to create the RAG tables.
3. Restart the backend: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`.
4. Open http://localhost:3002/assistant, select papers, and ask questions.

### Database migrations

Phase 2 adds these tables via Alembic migration `0004_rag_core`:

- `document_chunks` — chunked text with embeddings per document
- `research_conversations` — persistent chat sessions
- `research_messages` — messages with citations
- `ai_usage` — per-user AI request tracking

Plus new columns on `documents`: `indexing_status`, `indexing_error`, `embedding_model`.

To apply: `python -m alembic upgrade head`

## Phase 3: Advanced AI Research Intelligence, Knowledge Graph, Admin Dashboard & Production Readiness

Lumina Phase 3 extends the existing RAG assistant with a full knowledge graph,
server-side research collections, separate user/admin experiences, activity and
audit logging, research comparison, and production-readiness improvements.

### New database tables (migration `0006_phase3_core`)

| Table | Purpose |
|-------|---------|
| `research_collections` | User-owned document collections/projects |
| `collection_documents` | Join table: documents in collections |
| `knowledge_entities` | Extracted entities (people, orgs, technologies, concepts, ...) with source traceability |
| `knowledge_relationships` | Edges between entities with confidence and source references |
| `activity_logs` | Per-user activity history (upload, process, note, collection, query, ...) |
| `audit_logs` | Security-sensitive admin actions (role changes, disable/reactivate, ...) |

Apply with: `python -m alembic upgrade head`

### New backend API endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/v1/collections` | GET/POST | List/create research collections | Session |
| `/api/v1/collections/{id}` | GET/PATCH/DELETE | Get, rename, delete a collection | Session + ownership |
| `/api/v1/collections/{id}/documents` | POST/DELETE | Add/remove document from collection | Session + ownership |
| `/api/v1/knowledge/graph` | GET | Full knowledge graph (nodes + edges) | Session |
| `/api/v1/knowledge/entities` | GET | List knowledge entities with filters | Session |
| `/api/v1/knowledge/relationships` | GET | List knowledge relationships | Session |
| `/api/v1/knowledge/documents/{id}/reprocess` | POST | Re-extract entities/relationships for a document | Session + ownership |
| `/api/v1/activity` | GET | User activity history (paginated) | Session |
| `/api/v1/research/compare` | POST | Compare 2-10 documents with citations | Session + ownership |
| `/api/v1/admin/analytics` | GET | System-level analytics | Admin |
| `/api/v1/admin/audit` | GET | Audit log (admin only) | Admin |
| `/api/v1/admin/health` | GET | System health | Admin |
| `/api/v1/admin/users/{id}/status` | PATCH | Disable/reactivate account | Admin |

### New frontend routes

| Route | Description |
|-------|-------------|
| `/knowledge` | Interactive knowledge graph with zoom/pan, search, entity filters, node inspection |
| `/compare` | Research comparison: select 2+ documents, compare objectives/methodology/findings/etc. |
| `/collections` | Server-side research collections (replaces localStorage) |
| `/insights` | Personal research analytics (activity history, document counts, trends) |
| `/admin/analytics` | System analytics for administrators |
| `/admin/activity` | Audit log for administrators |
| `/admin/settings` | System health and configuration |

### Admin setup

The initial administrator is created via the `ADMIN_EMAILS` environment variable:

1. Set `ADMIN_EMAILS` in `backend/.env` to a comma-separated list of email addresses.
2. Those accounts are automatically promoted to `admin` on registration and on login.
3. There is no public admin registration endpoint — only existing admins can create new admin accounts via `/api/v1/admin/register`.

Example `backend/.env`:
```
ADMIN_EMAILS=researcher@university.edu
```

### Security

- All administrative endpoints require the `admin` role (validated server-side).
- Admin frontend routes are server-side protected; the UI never exposes admin features to non-admins.
- Account disable/reactivate is audited in the `audit_logs` table.
- Activity logs record only metadata — never document contents, passwords, or session tokens.
- Pydantic v2 validation returns `422` for invalid request bodies.

### Commands

```powershell
# Backend (from backend/)
.\.venv\Scripts\Activate.ps1
python -m alembic upgrade head          # Apply Phase 3 migrations
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Frontend (from frontend/)
npm run dev                              # Port 3002

# Tests (from backend/)
python -m pytest app/tests -q           # All 85 tests

# TypeScript check (from frontend/)
npx tsc --noEmit

# Production build (from frontend/)
npm run build
```

# Lumina — AI Research & Knowledge Assistant (Phases 1–4)

Lumina (built from the "ResearchOS" specification) is a personal research
workspace for students: manage academic documents, extract their text, organize
materials, keep research notes, and run AI-powered question answering over your
uploaded papers.

> Brand note: the product UI is branded **Lumina**. API titles, docs, and this
> README use the Lumina name; the underlying plan was authored as "ResearchOS".

## Main features

- Real authentication (register / login / logout / me) with Argon2 password
  hashes and HttpOnly cookie sessions — no tokens in localStorage.
- Account enable/disable (`is_active`) enforced server-side: disabled accounts
  cannot log in and are rejected on every authenticated request. Admins manage
  this via the admin console; every disable/reactivate is audited.
- PDF (pypdf) and DOCX (python-docx) upload with validation (extension,
  15 MB cap, magic-byte signatures), safe UUID storage, and real text
  extraction with honest statuses (`completed`, `requires_ocr`, `failed`, …).
- **Auto-indexing**: uploaded documents are automatically chunked, embedded,
  and stored in the vector store for RAG. Indexing status is tracked per
  document and can be retried via `/documents/{id}/reindex`.
- Document library: server-side search, file-type filter, sorting,
  pagination, rename, download, delete, retry-extraction. Ownership enforced
  on every endpoint. Admins see metadata (not content) via `/admin/documents`.
- Personal research notes in PostgreSQL (per-document and standalone),
  with explicit save states. Note bodies are owner-only; admins see metadata
  (not content) via `/admin/notes`.
- Dashboard with live database counts and recent items.
- RAG research assistant: grounded question answering with source citations,
  persistent conversations, document summarization, knowledge graph, and
  research comparison. Local (offline) embedding + LLM providers work with no
  API keys; OpenAI and Ollama providers are configurable.
- Admin console: user management, account status (disable/reactivate),
  site statistics, system analytics, audit logs, and health checks.
  All admin endpoints require the `admin` role, enforced server-side.
- Frontend: Next.js 16 App Router + React 19, TypeScript + Tailwind CSS 4,
  typed API client, loading/error/empty/success states. No mock fallbacks.

## Technology stack

| Layer    | Choice                                              |
| -------- | --------------------------------------------------- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend  | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, Uvicorn |
| Database | PostgreSQL 16 + pgvector (primary); throwaway SQLite file for tests only |
| Auth     | Argon2id hashes, JWT in HttpOnly `SameSite=Lax` cookie, slowapi rate limits |
| Files    | pypdf, python-docx, python-multipart, local disk storage service |
| Tests    | pytest (89 tests) + `backend/e2e_check.py` live end-to-end script |
| Docker   | Multi-stage Dockerfiles for backend + frontend; Compose with pgvector |

## Project architecture

```
researchos/
  frontend/                 # Next.js App Router (port 3002)
    src/app/                # routes: /, /login, /register, /dashboard,
                            #   /documents, /documents/[id], /assistant,
                            #   /collections, /notes, /history, /insights,
                            #   /knowledge, /publish, /toolkit, /roadmap,
                            #   /guide, /settings, /admin, /admin/…
    src/components/         # layout, documents, dashboard, assistant, ui, …
    src/context/            # AuthContext (cookie session), ThemeContext
    src/hooks/              # useDocuments, useNotes, useCollections,
                            #   useHistory, useAuth, useTheme
    src/lib/                # api.ts — the ONLY backend client; research.ts
                            #   (local extractive helpers); student.ts; utils.ts
    src/types/              # User, ResearchDocument, ResearchNote, …
    Dockerfile              # multi-stage, standalone output, non-root user
  backend/                  # FastAPI service (port 8000)
    app/main.py             # app factory, CORS, cookie auth, rate-limit wiring
    app/core/               # config (env), security (argon2 + JWT)
    app/db/                 # engine/session, Base
    app/models/             # User, Document, ResearchNote, … (+ is_active)
    app/schemas/            # Pydantic request/response models
    app/api/                # dependencies (session user, origin/CSRF check)
    app/api/v1/             # auth, documents, notes, dashboard, research,
                            #   admin, admin_extensions, …
    app/services/           # auth/document/notes/dashboard/RAG/indexing/…
                            #   logic, storage, extraction, validation
    app/tests/              # pytest suite (isolated SQLite file, no creds)
    alembic/                # migrations (0001…0007, incl. 0007_is_active)
    Dockerfile              # multi-stage, non-root user, alembic upgrade
    e2e_check.py            # live end-to-end script (needs dev server + PG)
    storage/                # uploaded files (gitignored, created on demand)
  docker-compose.yml        # Postgres 16 + pgvector, backend, frontend
  .env.example              # root placeholder values
  backend/.env.example      # backend placeholder values
  frontend/.env.example     # frontend placeholder values
```

Route handlers stay thin; business logic lives in `services/`. The storage
layer is a small `StorageService` protocol so object storage can replace
local disk in a later phase without touching routes.

## Privacy policy (admin vs. user)

- **Users** own their documents, notes, conversations, and collections.
  No user can read another user's content (document text, note bodies,
  conversation messages).
- **Admins** see metadata and aggregate visibility only: document titles,
  file types, sizes, statuses, and owners (via `/admin/documents`); note
  titles, ownership, and timestamps (via `/admin/notes`, **without** note
  content); user counts and storage stats. Admins cannot read or download
  another user's document text, note body, or conversation.
- Admins can disable/reactivate accounts (`is_active`) and manage roles.
  Every administrative action is recorded in the append-only `audit_logs`
  table.

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- Docker Desktop (for PostgreSQL + Compose), or a local PostgreSQL 16 server

## Environment setup

```powershell
# 1. Database (from the repo root)
docker compose up -d

# 2. Backend env
Copy-Item backend\.env.example backend\.env
# Edit backend\.env: set a long random SECRET_KEY (required).
# DATABASE_URL default: postgresql+psycopg://researchos:researchos@localhost:5432/researchos
# For Compose, the backend service overrides DATABASE_URL to point at the
# postgres service container.

# 3. Frontend env (already correct by default)
# frontend/.env.local -> NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Backend env vars (`backend/.env`): `DATABASE_URL`, `SECRET_KEY`,
`FRONTEND_ORIGIN`, `ENV` (development/production), `BACKEND_HOST`,
`BACKEND_PORT`, `UPLOAD_DIRECTORY`, `MAX_UPLOAD_SIZE_MB`,
`SESSION_COOKIE_NAME`, `SESSION_EXPIRE_DAYS`, `COOKIE_SECURE`
(auto-true in production), `AUTH_RATE_LIMIT` (default `10/minute`).

## Backend installation

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Frontend installation

```powershell
cd frontend
npm install
```

## Database migrations

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
# fresh database, documented path (no autocreate in production code):
python -m alembic upgrade head
# create a new migration after model changes:
# python -m alembic revision --autogenerate -m "describe change"
```

## How to run the application locally

Two terminals (PowerShell):

```powershell
# Terminal 1 — backend (from backend/)
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```powershell
# Terminal 2 — frontend (from frontend/)
npm run dev
```

Or with Docker Compose (from the repo root):

```powershell
docker compose up -d
```

Open http://localhost:3002. Register an account, upload a PDF or DOCX,
open it to read extracted text, add a note, watch the dashboard count it.
Ask questions about your documents at http://localhost:3002/assistant.

If port 5432 is taken (another Postgres), either stop the other container
or map ours elsewhere, e.g. `docker run ... -p 5433:5432 ...`, and point
`DATABASE_URL` at `:5433`.

## API documentation

With `ENV=development`, interactive docs live at:

- Swagger UI: http://localhost:8000/docs
- Health: http://localhost:8000/healthz

All data routes sit under `/api/v1` (auth, documents, notes, dashboard,
research, admin, admin extensions).

## How to run tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest app/tests -q          # 89 tests, isolated SQLite file
python ..\..\backend\e2e_check.py      # needs: dev server on :8000 + PostgreSQL
```

Frontend checks (from `frontend/`):

```powershell
npx tsc --noEmit
npm run build
```

Tests never need production credentials. The pytest suite uses a throwaway
SQLite file per test module because the models avoid Postgres-only column
types; every query path is identical on PostgreSQL.

## Phase 2: RAG (implemented)

Lumina now includes a Retrieval-Augmented Generation (RAG) research assistant:

- **Document chunking**: Extracted text is split into overlapping chunks with page-level metadata where available.
- **Embeddings**: Configurable provider (local simhash for offline/dev, OpenAI, or Ollama). Vectors are stored alongside document chunks.
- **Vector search**: PostgreSQL with pgvector is preferred; a JSON-based in-Python fallback works on SQLite and as a safe fallback.
- **Grounded Q&A**: Answers are generated strictly from retrieved document chunks, with verifiable source citations (document title + page number when available).
- **Conversations**: Persistent chat sessions with per-conversation document scoping, message history, rename, and delete.
- **Cost control**: Request timeouts, rate limits, per-user AI usage tracking, and configurable model selection.
- **Auto-indexing**: Uploaded documents are automatically indexed for RAG after text extraction completes.

### RAG environment variables

Add to `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBEDDING_PROVIDER` | `local` | `local`, `openai`, or `ollama` |
| `EMBEDDING_MODEL` | `local-simhash-v1` | Embedding model name |
| `LLM_PROVIDER` | `local` | `local`, `openai`, or `ollama` |
| `LLM_MODEL` | `local-extractive-v1` | LLM model name |
| `OPENAI_API_KEY` | *(unset)* | Required when using `openai` provider |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible API base URL |
| `RAG_CHUNK_SIZE` | `1000` | Characters per chunk |
| `RAG_CHUNK_OVERLAP` | `200` | Overlap between chunks |
| `RAG_TOP_K` | `5` | Chunks retrieved per question |
| `RAG_SIMILARITY_THRESHOLD` | `0.30` | Minimum similarity to include a chunk |
| `RAG_MAX_QUESTION_CHARS` | `2000` | Max question length |
| `RAG_MAX_CONTEXT_CHARS` | `6000` | Max context chars sent to LLM |
| `RAG_RATE_LIMIT` | `30/minute` | Rate limit for ask endpoint |
| `RAG_REQUEST_TIMEOUT` | `60` | Upstream request timeout (seconds) |
| `RAG_TRACK_USAGE` | `true` | Track per-user AI usage |

### Running RAG

1. Add RAG env vars to `backend/.env` (see table above).
2. Run `python -m alembic upgrade head` to create the RAG tables.
3. Restart the backend: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`.
4. Open http://localhost:3002/assistant, select papers, and ask questions.

### Database migrations

Phase 2 adds these tables via Alembic migration `0004_rag_core`:

- `document_chunks` — chunked text with embeddings per document
- `research_conversations` — persistent chat sessions
- `research_messages` — messages with citations
- `ai_usage` — per-user AI request tracking

Plus new columns on `documents`: `indexing_status`, `indexing_error`, `embedding_model`.

To apply: `python -m alembic upgrade head`

## Phase 3: Advanced AI Research Intelligence, Knowledge Graph, Admin Dashboard & Production Readiness

Lumina Phase 3 extends the existing RAG assistant with a full knowledge graph,
server-side research collections, separate user/admin experiences, activity and
audit logging, research comparison, and production-readiness improvements.

### New database tables (migration `0006_phase3_core`)

| Table | Purpose |
|-------|---------|
| `research_collections` | User-owned document collections/projects |
| `collection_documents` | Join table: documents in collections |
| `knowledge_entities` | Extracted entities (people, orgs, technologies, concepts, ...) with source traceability |
| `knowledge_relationships` | Edges between entities with confidence and source references |
| `activity_logs` | Per-user activity history (upload, process, note, collection, query, ...) |
| `audit_logs` | Security-sensitive admin actions (role changes, disable/reactivate, ...) |

Apply with: `python -m alembic upgrade head`

### New backend API endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/v1/collections` | GET/POST | List/create research collections | Session |
| `/api/v1/collections/{id}` | GET/PATCH/DELETE | Get, rename, delete a collection | Session + ownership |
| `/api/v1/collections/{id}/documents` | POST/DELETE | Add/remove document from collection | Session + ownership |
| `/api/v1/knowledge/graph` | GET | Full knowledge graph (nodes + edges) | Session |
| `/api/v1/knowledge/entities` | GET | List knowledge entities with filters | Session |
| `/api/v1/knowledge/relationships` | GET | List knowledge relationships | Session |
| `/api/v1/knowledge/documents/{id}/reprocess` | POST | Re-extract entities/relationships for a document | Session + ownership |
| `/api/v1/activity` | GET | User activity history (paginated) | Session |
| `/api/v1/research/compare` | POST | Compare 2-10 documents with citations | Session + ownership |
| `/api/v1/admin/analytics` | GET | System-level analytics | Admin |
| `/api/v1/admin/audit` | GET | Audit log (admin only) | Admin |
| `/api/v1/admin/health` | GET | System health | Admin |
| `/api/v1/admin/users/{id}/status` | PATCH | Disable/reactivate account (is_active) | Admin |

### New frontend routes

| Route | Description |
|-------|-------------|
| `/knowledge` | Interactive knowledge graph with zoom/pan, search, entity filters, node inspection |
| `/compare` | Research comparison: select 2+ documents, compare objectives/methodology/findings/etc. |
| `/collections` | Server-side research collections (replaces localStorage) |
| `/insights` | Personal research analytics (activity history, document counts, trends) |
| `/admin/analytics` | System analytics for administrators |
| `/admin/activity` | Audit log for administrators |
| `/admin/settings` | System health and configuration |

### Admin setup

The initial administrator is created via the `ADMIN_EMAILS` environment variable:

1. Set `ADMIN_EMAILS` in `backend/.env` to a comma-separated list of email addresses.
2. Those accounts are automatically promoted to `admin` on registration and on login.
3. There is no public admin registration endpoint — only existing admins can create new admin accounts via `/api/v1/admin/register`.

Example `backend/.env`:
```
ADMIN_EMAILS=researcher@university.edu
```

### Security

- All administrative endpoints require the `admin` role (validated server-side).
- Admin frontend routes are server-side protected; the UI never exposes admin features to non-admins.
- Account disable/reactivate is audited in the `audit_logs` table.
- Activity logs record only metadata — never document contents, passwords, or session tokens.
- Pydantic v2 validation returns `422` for invalid request bodies.
- CSRF backstop: non-safe HTTP methods require an `Origin` header matching `FRONTEND_ORIGIN`.
- Cookie auth: HttpOnly `SameSite=Lax`; `Secure` in production.

## Phase 4: Production Engineering & Final Implementation

Phase 4 hardens Lumina for production: real bug fixes, security hardening,
testing, Docker/deployment configuration, and documentation.

### Bugs fixed

- **RAG sync/async**: `rag.ask` now `await`s `VectorStore.similarity_search`; `summarize_document` and `research_comparison_service` now `await` the async LLM call (previously returned coroutines, breaking RAG entirely).
- **Knowledge graph**: added missing `KnowledgeEdge` import (crashed when edges existed).
- **Summarization citations**: fixed `chunk_id` → `id` key mismatch when building citations.
- **Admin privacy**: removed admin content bypasses — document text, note bodies, and conversations are owner-only. Admins see metadata only via `/admin/documents` and `/admin/notes` (no `content` / `extracted_text` exposed).
- **Account status**: added real `users.is_active` column (migration `0007`); disabled accounts cannot log in and are rejected on every authenticated request; admin disable/reactivate now actually flips `is_active`.
- **Analytics**: replaced SQLite-only `func.julianday` with database-agnostic SQL so analytics work on PostgreSQL.
- **CSRF hardening**: `require_same_origin` now rejects mutations with no `Origin` header (previously allowed them).
- **Conversations API shape**: frontend `getConversations()` now handles the backend's `{ conversations: [] }` envelope; assistant page reads `data.conversations`.
- **Types**: fixed self-referential `IndexingStatus` type in frontend `types/document.ts`.

### Auto-indexing

Uploaded documents are now automatically indexed for RAG after text extraction
completes. Indexing status (`pending` → `processing` → `completed`/`failed`)
is exposed via `GET /research/documents/{id}/indexing-status` and can be
retried via `POST /research/documents/{id}/reindex`. Indexing failures do not
fail the upload.

### Docker & production configuration

- `backend/Dockerfile` — multi-stage Python image, non-root user, runs `alembic upgrade head` then uvicorn.
- `frontend/Dockerfile` — multi-stage Node image, Next.js standalone output, non-root user.
- `docker-compose.yml` — PostgreSQL 16 + pgvector, backend, frontend; healthchecks, persistent volumes (`lumina-pgdata`, `lumina-uploads`).
- `.env.example` files updated with placeholder values and documentation.
- `/healthz` health endpoint; `/api/v1/admin/health` admin system health endpoint.

### Tests added

- `is_active` enforcement: new users active by default; disabled users cannot log in; disabled users get 401 on authenticated requests; admin can disable/reactivate accounts.
- Admin privacy: admins cannot read/download another user's document or note; admins cannot create notes on another user's document; admins see metadata-only via `/admin/documents` and `/admin/notes`.
- RAG tests fixed to mock async `similarity_search` properly with `AsyncMock`.

### Commands

```powershell
# Backend (from backend/)
.\.venv\Scripts\Activate.ps1
python -m alembic upgrade head          # Apply all migrations incl. 0007_is_active
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Frontend (from frontend/)
npm run dev                              # Port 3002

# Tests (from backend/)
python -m pytest app/tests -q           # All 89 tests

# TypeScript check (from frontend/)
npx tsc --noEmit

# Production build (from frontend/)
npm run build

# Docker (from repo root)
docker compose up -d
```

## Known limitations

- No OCR: image-only PDFs report `requires_ocr` honestly instead of text.
- Local simhash embedding/LLM providers are deterministic but not semantically meaningful; use OpenAI or Ollama providers for real semantic search and answers.
- External OpenAI/Ollama integrations cannot be verified without credentials; `OPENAI_API_KEY` must be set via environment (never hardcoded).
- Upload extraction and indexing run synchronously in the request; large documents may block briefly. No background job system (Redis/Celery) is configured.
- Deployment target not selected; Docker Compose is provided for local integration testing. Manual deployment instructions are in the deployment section below.
- `backend/e2e_check.py` targets `127.0.0.1:8000` and default PG credentials.

## Deployment guide

Lumina is designed to run on any platform that supports Docker:

1. **Frontend hosting**: Build the Next.js app (`npm run build`) and deploy to any Node.js hosting platform (Vercel, Railway, Fly.io, etc.). Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL.
2. **Backend hosting**: Deploy the FastAPI container to any container platform (Railway, Fly.io, AWS ECS, etc.). Set `ENV=production`, `COOKIE_SECURE=true`, `SECRET_KEY`, `DATABASE_URL`, `FRONTEND_ORIGIN`, and `ADMIN_EMAILS`.
3. **Database**: Use managed PostgreSQL 16 with pgvector (e.g., AWS RDS with pgvector, Timescale, or self-hosted). Run `alembic upgrade head` before starting the backend.
4. **File storage**: Uploaded files are stored locally under `UPLOAD_DIRECTORY`. For multi-node deployments, use a shared filesystem or replace `LocalFileStorage` with an object-storage backend implementing the `StorageService` protocol.
5. **HTTPS**: Terminate TLS at your load balancer or ingress. Set `COOKIE_SECURE=true` so session cookies are only sent over HTTPS.

Do not commit `.env` files, `SECRET_KEY`, database credentials, or API keys.

## Planned future phases

- OCR support for image-only PDFs (beyond the current `requires_ocr` honest reporting).
- Password reset flow and "remember me" session extension.
- Background job system for large document indexing (if workload justifies it).

