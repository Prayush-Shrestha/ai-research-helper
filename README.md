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

## Planned future phases

- OCR support for image-only PDFs (beyond the current `requires_ocr` honest reporting).
- Collections, history, and theme persisted server-side (currently localStorage).
- Password reset flow and "remember me" session extension.
