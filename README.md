# AURUMIUM — web

Referral-partner intelligence for lenders. Element 79.

## Run it (UI only — no database needed)

```bash
npm install
npm run dev        # http://localhost:3000 — full dashboard on sample data
```

The dashboard renders from `src/lib/sample-data.ts`, which is shaped exactly
like the API responses, so the UI works before Postgres exists.

## Wire the database (when ready)

```bash
cp .env.example .env.local   # set DATABASE_URL (+ ANTHROPIC_API_KEY for Auri)
npm run db:push              # Drizzle creates the tables
npm run db:views             # applies the rollup matview + pipeline view
npm run db:refresh           # refresh rollup after any import
```

API routes: /api/partners, /api/partners/[id], /api/metrics, /api/pipeline,
/api/config/dashboard, /api/assistant/chat (Auri).

## Layout

- `src/lib/metrics.ts` — THE metric catalog (UI + API + Auri all import this)
- `src/lib/score.ts` — partner score composite
- `src/lib/sample-data.ts` — sample dataset ("never a blank screen")
- `src/components/aurumium-app.tsx` — dashboard UI
- `src/db/` — Drizzle schema + client + rollup queries
- `src/app/api/` — route handlers
- `../ai/auri-system-prompt.md` — Auri's brain (versioned; changelog inside)
- `../db/schema.sql` — reference DDL; `drizzle/0000_views.sql` — analytics views
