# n8n Judge

A **simulator** that teaches non-technical Scaler learners to build AI-agent workflows in
n8n — and grades them while they do it. Real n8n overwhelms them and can't be
instrumented for grading, so this recreates the experience with hand-holding from a
mascot ("Iris").

Each challenge runs a four-screen journey:

| Screen | What happens |
|---|---|
| **Understand** | MCQs that make the learner dissect the problem. Wrong answers get a hint, never the answer. |
| **Build** | Place and configure nodes on a simulated n8n canvas, then Run against sample cases. |
| **Stress Testing** | Edge-case questions about the flow they actually built. |
| **Result** | Score, per-area breakdown, and the misconceptions they hit. |

Three challenges ship today: `email-triage`, `lead-triage` (both routing) and
`meeting-notes` (linear, no router).

---

## Run it

Node 20+.

```bash
npm install
npm run dev        # → http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the build |
| `npm test` | Vitest — engine, schema and problem-data unit tests |
| `npm run smoke` | Loads every screen of every problem in headless Chrome, fails on any runtime error |
| `npm run typecheck` | `tsc --noEmit` over `packages/` |

Single test file: `npx vitest run packages/engine/simulate.test.js`

**Run `npm run smoke` after touching any component.** There are no component tests, so a
bug that only appears when a screen renders will pass both `npm test` and `next build` —
this has already happened once.

**Live Ask-AI** needs a key: `cp .env.example .env`, set `ANTHROPIC_API_KEY`, restart.
Without one the route returns 503 and the UI shows a graceful fallback.

### Database

Postgres runs in Docker via [docker-compose.yml](docker-compose.yml). Prisma and pg-boss
share it.

```bash
cp .env.example .env   # then edit POSTGRES_PORT if 5432 is taken on your machine
npm run db:up          # start Postgres
npm run db:migrate     # apply committed migrations
```

| Command | What it does |
|---|---|
| `npm run db:up` / `db:down` | Start / stop the local Postgres |
| `npm run db:migrate` | Apply committed migrations (`migrate deploy`) |
| `npm run db:migrate:dev` | Create a new migration from schema changes |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:studio` | Prisma Studio |

`POSTGRES_PORT` exists because 5432 is frequently occupied by a native Postgres or
another project's container. Set it in `.env` and keep `DATABASE_URL`'s port in sync —
compose reads the same file.

```bash
npm run db:seed        # programs, batches, and the three problems as v1 PUBLISHED
```

### Signing in

The journey is behind auth. Seeded batch invite codes: **`AIML-DEMO`**, **`DSML-DEMO`**,
**`SE-DEMO`** — sign up at `/signup` with one of them. Set a real `AUTH_SECRET` in `.env`
(`openssl rand -base64 32`); the template ships a placeholder.

To make yourself an admin:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

### Dev routes

Hash routes that isolate a single screen. All honor `?problem=<id>`:

`#build` · `#run-story` (auto-runs a finished flow) · `#eval-demo` · `#report-demo` ·
`#run-demo` · `#playground`

---

## Layout

```
apps/web/            Next.js App Router app — the product
  app/               routes: page.tsx, layout.tsx, api/ask-ai/route.ts
  src/               the UI (screens, n8n editor, components)
  scripts/           smoke.mjs + shoot-*.mjs screenshot drivers
packages/
  engine/            pure logic: validateGraph, simulate, grading, evalScore
  catalog/           NODE_CATALOG — the node vocabulary
  problems/          the three challenges as data + registry + tests
  problem-schema/    zod Problem schema + validateProblem()
  trace/             TraceEvent contract
  queue/             queue interface + pg-boss driver + SQS stub
  llm/               Claude client + grading / authoring / ask-ai prompts
  db/                Prisma schema, migration, client singleton
docs/                plans, research, reference material
design-source/       the design system and mascot kits the app was built from
```

---

## Where to look next

- **[STATUS.md](STATUS.md)** — what's built, what's next, known issues. Start here.
- **[CLAUDE.md](CLAUDE.md)** — architecture in depth, conventions, gotchas.
- **[docs/understanding.md](docs/understanding.md)** — project intent and locked decisions.
- **[docs/adding-a-problem.md](docs/adding-a-problem.md)** — add a challenge as data.

## Deploying

Railway builds from the root [Dockerfile](Dockerfile), so the service **Root Directory
must be the repo root**. Set `ANTHROPIC_API_KEY` (and `DATABASE_URL` once M1 lands).
Health check is `/`; Railway injects `PORT`.
