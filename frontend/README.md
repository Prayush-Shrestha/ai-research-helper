# Lumina frontend

Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS 4.

This is the UI half of the monorepo. See the **root README.md** for the full
picture (backend, database, how to run everything).

## Quick start

```powershell
npm install
npm run dev      # http://localhost:3002
```

Needs the backend on http://localhost:8000 (see root README).
Configure via `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Notes for developers

- `src/lib/api.ts` is the ONLY file that talks to the backend. Endpoint or
  shape changes go there.
- Auth is cookie-based (HttpOnly session). Never store tokens in
  localStorage; session state comes from `GET /auth/me` (AuthContext).
- No mock data fallbacks: failed API calls surface real errors.
- `src/lib/research.ts` holds local extractive helpers (previews only).
- Collections/history/theme are device-local (localStorage); documents,
  notes, and accounts are server data in PostgreSQL.

## Checks

```powershell
npx tsc --noEmit
npm run build
```
