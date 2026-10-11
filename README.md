# AI Research & Knowledge Assistant

A Next.js frontend for keeping research papers in one place. Upload stuff, read it properly, find it again later. That's the whole idea for now.

This is the month-1 build, so it's the boring-but-important parts: login, dashboard, document library, upload, reader, settings. The AI Q&A side isn't real yet — those pages are just placeholders showing where it'll go.

There's also a guide inside the app at `/guide` if you'd rather read there than here.

## How this thing actually works

Stack is pretty standard: Next.js 16 with the App Router, React 19, TypeScript, Tailwind 4. Dev server runs on port 3002.

```
npm run dev  ->  next dev -p 3002
```

Rough layout of the code:

- `src/app/` — one folder per page. The `(app)` group shares the header + login check.
- `src/context/AuthContext.tsx` — keeps track of who's logged in, login/register/logout functions.
- `src/hooks/useDocuments.ts` — loads the doc list, handles search/filter/sort, upload, rename, delete.
- `src/lib/api.ts` — the only file that talks to the backend. If endpoints change, this is the one place to fix.
- `src/lib/auth.ts` — just stores the JWT in localStorage (`ara_token`). Planning to move to cookies later.
- `src/lib/mock.ts` — fake backend for dev. Clearly separated so we can rip it out later.
- `src/components/` — header, dashboard bits, document rows/cards, assistant UI, small shared pieces.

Auth in plain words: you register or log in, the server hands back a token, we stash it in localStorage and stick it on every request as `Authorization: Bearer ...`. If the token's bad (401) you get bounced to `/login`. The `(app)/layout.tsx` file does that redirect check for all the protected pages.

Documents in plain words: list comes from `GET /documents`. Search/filter/sort happens in the browser for now — easy to switch to server search later without changing the UI. Upload goes to `POST /documents/upload` as form data (uses XHR so we can show a progress bar). Clicking a doc hits `GET /documents/:id` and shows the extracted text. Rename is PATCH, delete is DELETE. Nothing fancy.

About the mock mode: if there's no backend running (which is most of the time right now), and `NEXT_PUBLIC_USE_MOCK=true` in `.env.local`, the app just uses fake data stored in your browser. 8 sample papers, a demo user. Enough to click through everything. Set it to `"false"` if you want to force real API calls and see actual errors.

`.env.local` looks like this:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=true
```

Pages:

- `/` — landing page
- `/login`, `/register` — auth
- `/dashboard` — overview, recent docs
- `/documents` — the library (search, filter, upload)
- `/documents/[id]` — reader + rename/delete
- `/assistant`, `/knowledge`, `/insights` — previews, not functional yet
- `/guide` — the in-app manual, worth a look if you're new
- `/settings` — profile bits, sign out, reset demo data

## If you're opening this for the first time

You don't need anything except node + npm. No backend, no database.

1. Get it running.

```
npm install
npm run dev
```

Open http://localhost:3002. Leave the env file alone, mock mode is on by default.

2. Make an account. Click ENTER WORKSPACE, fill in name / email / password (6 chars min). In demo mode any email works. You'll end up on the dashboard.

3. Have a look at the dashboard. Big number is your doc count, below that the 5 latest uploads. OPEN LIBRARY goes to your files, ASK RESEARCH goes to the assistant preview.

4. Upload something. Go to Research Library, press UPLOAD DOCUMENT +, pick a PDF or DOCX. You'll see it go Extracting → Indexing → Indexed. New doc pops to the top.

5. Try finding it. Search box matches titles/filenames, FILTER does ALL/PDF/DOCX, SORT does recent/oldest/A–Z.

6. Open a document. Click a row. You get the metadata on top (pages, size, status, date) and the text below. RENAME edits inline, DOWNLOAD prints, DELETE asks first and there's no undo.

7. Poke the rest. `/assistant` takes a question and shows a canned answer (real stuff comes month 2). `/settings` lets you change display name, sign out, or RESET the demo library. The full walkthrough with screenshots-equivalent lives at `/guide` in the app.

To wipe the demo and start clean: devtools → Application → Local Storage → clear, or Settings → RESET. Mock stuff lives under `ara_mock_docs`, `ara_mock_user`, `ara_token`.

## Checks I run

```
npx tsc --noEmit
npm run build
npm run dev
```

Both pass clean at the time of writing. All routes return 200 in dev.

## When something looks broken

- "Unable to reach the server" — expected without a backend, mock mode should catch it. Double check `NEXT_PUBLIC_USE_MOCK=true`.
- Kicked to `/login` out of nowhere — token expired or got cleared. Log in again.
- Library empty — you either haven't uploaded yet or wiped storage. Upload one file.
- Port already in use — dev uses 3002, kill the old process or change `-p` in package.json.
