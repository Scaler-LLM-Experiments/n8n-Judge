# HANDOFF — n8n Judge production build

Everything below describes work on branch **`claude/init-jniws3`**, inside the
**`innate/`** folder. All work is committed and pushed. Read this first, then
`understanding.md` (project intent + locked decisions) and
`docs/plan-production-platform.md` (the full plan).

---

## 1. What this project is

"n8n Judge" is a **simulator** that teaches non-technical Scaler learners (AI/ML &
DSML batches) to build AI-agent workflows in n8n, **and grades them at the same
time**. Real n8n overwhelms them and can't be instrumented for grading; this
simulates the experience with hand-holding.

Journey per challenge: **Understand → Build → Stress Testing → Result**
- **Understand** — MCQs that make the learner dissect the problem ("what should the
  trigger be?"). Wrong answers get a hint, never the answer.
- **Build** — place + configure nodes on a simulated n8n canvas, guided by the Iris
  mascot. Wrong node drops trigger misconception probes. Then Run against sample cases.
- **Stress Testing** — edge-case MCQs about the flow they built.
- **Result** — score + per-area breakdown + misconceptions surfaced.

The prototype (frontend-only Vite/React) is being productionized into a **Next.js
full-stack platform**: auth + batches, session persistence + full tracing, async LLM
grading via a queue + worker, admin analytics, editable rubric, AI-assisted problem
authoring, and voice. **LMS integration is parked.**

---

## 2. Where things live

```
innate/                      ← ALL new work happens here (npm workspaces monorepo)
  apps/web/                  Next.js App Router app (the live product)
    app/                     routes — page.tsx, layout.tsx, api/ask-ai/route.ts
    src/                     the ported prototype (screens, n8n editor, components)
    scripts/smoke.mjs        full-journey smoke test
  packages/
    engine/                  pure logic: validateGraph, simulate, grading, evalScore
    catalog/                 NODE_CATALOG — the node vocabulary
    problems/                the 3 challenges as data + registry + tests
    problem-schema/          zod Problem schema + validateProblem()
    trace/                   TraceEvent contract (zod)
    queue/                   Queue interface + pgBoss driver + sqs stub
    llm/                     Claude client + grading/authoring/ask-ai prompts
    db/                      Prisma schema + migration + client singleton
  Dockerfile, railway.json   deploy config (Railway Root Directory = `innate`)
  understanding.md           project intent, locked decisions
  HOW-TO-TEST.md             how to run and what to click
  app/                       ⚠️ OLD Vite prototype — dead reference, safe to delete
```

⚠️ **Footgun:** the old prototype also sits at the **repo root** `app/` and at
`innate/app/`. Both run on **port 5173** via Vite. The real app is `innate/` → **port
3000** via Next.js. Nothing depends on either old copy; both are excluded from the
Docker build. **Recommend deleting them** (was offered, not yet approved).

---

## 3. Locked decisions (do not re-litigate)

| Decision | Value |
|---|---|
| Approach | **Port, don't rewrite** — existing `.jsx` moves in as `'use client'`, untouched. All NEW code is TypeScript. |
| Models | **Sonnet** for grading AND authoring; **Haiku** for Ask-AI. Set via `JUDGE_*_MODEL` env. |
| Auth | Email + password self-signup as a **throwaway interim**. Federate to "Login with Scaler" SSO later. |
| Queue | SQS-shaped abstraction; **pg-boss** driver now, `sqsDriver` later. Separate worker service. |
| DB | Postgres + **Prisma 6.x** (pinned — Prisma 7's config/adapter model is too new). |
| Topology | **Generalized — NOT hard-coded.** See §5. This overrides the original plan's risk-#1 deferral. |
| Grading | Server-authoritative: worker replays trace events through the same engine. Never trust a client score. |
| Versioning | A `Session` pins its `ProblemVersion`; republishing never changes a running session's basis. |

---

## 4. What is DONE ✅

**M0 — Foundations (complete)**
- npm-workspaces monorepo; engine + catalog + problems moved into `packages/`.
- `edgeMatches` deduped into one shared module.
- **Prisma data model** — 13 tables, 7 enums, initial migration SQL committed:
  Program, Batch, User, Problem, ProblemVersion, ProblemAssignment, Session,
  TraceEvent (append-only, unique on `sessionId,seq`), Rubric, RubricVersion,
  GradingReport (token + cost tracking), Rating, VoiceClip, Tour.
- `problem-schema` — zod schema + `validateProblem()`.
- `trace` — full TraceEvent contract.
- `queue` — interface + pg-boss driver + sqs stub.
- `llm` — Claude client + grading / authoring / ask-ai prompt builders.
- Next.js app renders the entire ported journey.

**Beyond M0, also done**
- **Topology generalization** (see §5).
- **Third problem: `meeting-notes`** — production-quality, **linear** (no router).
- **Real Ask-AI** — streaming `/api/ask-ai` route (Claude), scoped to problem/screen/
  phase/node, prompted never to leak answers, graceful 503 fallback with no API key.
- **Legacy cleanup** — deleted the dead prototype path (`DashboardScreen`,
  `ProblemStatementScreen`, `NodePalette`, `engine/checkDrop`, `engine/connections`)
  and the legacy fields (`buildSteps`, `connectionGuide`, `testCaseSummary`).
  "What Run will check" now derives from `testCases[].description`.
- **Fixed:** `ConceptFlow` hardcoded the email-triage story, so every problem showed
  the wrong diagram. Now derived from each problem's `flowSummary` + `branches`.
- **Railway deploy config** — Dockerfile + railway.json, `npm ci` verified in sync.
- **Smoke test** (`npm run smoke`) — loads every screen of every problem, fails on any
  runtime error. **Currently: all 15 journey screens clean.**

**Verification status:** 63 unit tests pass · `next build` clean · `npm ci` in sync ·
smoke test green.

---

## 5. The one big deviation from the written plan

`docs/plan-production-platform.md` lists as **risk #1** that `simulate.js` hard-codes
the walk `trigger → ai → parse → switch → action`, and *defers* generalizing it.

**The owner overrode this: topology must be data, not code.** It is now done:

- `engine/simulate.js` resolves each node's role from **catalog metadata**
  (`category`, `needsModel`, `branches`) → `trigger | ai | router | action |
  passthrough`, and walks generically. Router branches continue the walk, so a branch
  can pass through several nodes before reaching an action.
- `flow.branchNext` / `flow.modelNext` are now **optional**; `branches` may be empty.
- `validateProblem()` no longer enforces a canonical chain — only generic structure
  (must start at a trigger, finish at an action). Model/routing rules apply **only**
  when those roles are actually used.

`meeting-notes` (webhook → AI summarize → Google Docs, **no switch**) exists
specifically to prove this — that shape could not run before.

**Still coupled:** adding a genuinely new *node type* still requires a `catalog.js`
entry + a `nodeIcons.js` mapping. That's by design (it's the vocabulary), but the
plan's longer-term goal is aligning the graph model with **real n8n JSON**
(connections keyed by source node, `main: [[...]]` arrays-per-output, typed
`ai_languageModel` connectors) — see `docs/research/n8n-core-architecture.md`.

---

## 6. What is PENDING ⏳

Nothing below is started. Milestones from the plan, in order:

**M1 — Auth + catalog from DB**
- Auth.js Credentials (email + password, bcrypt/argon2, roles LEARNER/ADMIN).
- Signup with **batch invite codes**; Programs (SE / AIML / DSML) as DB rows.
- Serve problems from the DB (`GET /api/problems`, `/api/problems/[slug]`), seeding
  the 3 existing problems as v1 PUBLISHED. Replaces the client-side registry import.
- ⚠️ Needs a running Postgres + `DATABASE_URL`; run the committed migration.

**M2 — Persistence + tracing**
- `POST /api/sessions`, `GET/PATCH /api/sessions/[id]`,
  `POST /api/sessions/[id]/events` (batched, idempotent on `sessionId,seq`).
- Client outbound event queue (zustand, flush ~2–3s + on transition + beforeunload).
- Resume-on-reload: rehydrate screen, grading store (replay decisions), graph snapshot.
- Read-only admin session timeline ("who's stuck where").
- Note: `record()` in `App.jsx` is the hook point — it already produces clean
  `Decision` objects. Run results + graph mutations must ALSO be traced (the
  prototype never recorded them — that's the gap the trace schema closes).

**M3 — Queue + grading + ratings**
- Worker service (`apps/worker`, plain Node + tsx), pg-boss, `grade_session` job.
- Worker replays trace → engine → rebuilds graph → re-runs validate + simulate against
  the **pinned** ProblemVersion → compact digest (never raw-dump events) → Claude
  structured output → `GradingReport`.
- SSE stream to the Report screen (`/api/sessions/[id]/grade/stream`) + polling
  fallback. **Spike SSE through Railway's proxy early** — known risk.
- Seed the default rubric (4 weighted areas: Dissection 25%, Construction 30%, Node
  Config 25%, Edge-Case Reasoning 20%; first-try is the primary signal).
- Rating prompt (1–5 + text) while the report generates.

**M4 — Admin analytics** — dashboard, per-problem funnel, learner search → session map
(event timeline + graph replay), rubric editor + versions + re-grade, ratings view.

**M5 — Authoring pipeline** — `draft-with-ai` (streaming, schema-constrained Claude) →
hybrid form/JSON editor + `validateProblem()` + live `BuildPreview` → versioned publish
→ assign. Then ship 2–3 more problems through it.

**M6 — Voice/mascot** (flag-gated, parallel) — per `docs/mascot-system-porting-guide.md`
(Deepgram Aura-2, pre-rendered S3 clips, moment-based voiceStore, name-splicing, NUX
tours). Nothing exists yet; the mic button is decorative.

**M7 — AWS/SQS swap** (deferred) — implement `sqsDriver`, flip `QUEUE_DRIVER`.

---

## 7. Known issues / gotchas

1. **The old prototypes still exist** (repo root `app/`, and `innate/app/`). Both are
   dead. Deleting them is recommended and was offered but not approved.
2. **No component tests.** `npm test` covers engine/schema/problems only. A bug that
   only manifests when a screen renders will pass tests *and* `next build` — this
   already happened once (a `ReferenceError` on the Understand screen). **Always run
   `npm run smoke` after touching components.**
3. **Beware `replace_all` edits in `.jsx`.** The above bug came from replacing every
   `<TopBar activeStage="statement" />`, including inside inner components that don't
   receive a `problem` prop. Check enclosing function scope.
4. **Next.js can pollute the root `tsconfig.json`** if `next dev` is ever run from the
   monorepo root — it injects `jsx`/`plugins`/`.next/types`. That belongs in
   `apps/web/tsconfig.json`. Revert if it appears in a diff.
5. `#run-story` shows a leftover "General question" case label for meeting-notes —
   cosmetic, dev route only.
6. **Ask-AI is deliberately unhelpful about answers.** If asked "which node?", it
   teaches the concept and asks a guiding question instead. That is intended.

---

## 8. How to run

```bash
cd innate
npm install
npm run dev        # → http://localhost:3000
npm test           # 63 unit tests
npm run smoke      # full-journey runtime check (needs dev running)
npm run build      # production build
```

**Live Ask-AI:** `cp .env.example .env`, set `ANTHROPIC_API_KEY`, restart.

**Railway:** connect repo → **Settings → Root Directory: `innate`** (critical — this
selects the right Dockerfile) → add `ANTHROPIC_API_KEY` (and `DATABASE_URL` once M1
lands) → deploy. Health check `/`. Railway injects `PORT`.

**Confirm you're on the Next.js app, not the prototype:**
```bash
curl -sI http://localhost:3000/ | grep -i x-powered-by   # → X-Powered-By: Next.js
```

---

## 9. Commits on this branch (newest first)

```
a7f54c6  Fix ReferenceError on the Understand screen; add a full-journey smoke test
50998da  Document how to verify you're running the Next.js app, not the prototype
9bc781a  Add root dev/build/start scripts so testing is one command
0530735  Add HOW-TO-TEST.md — local run, Railway deploy, and what to click
c55f124  Upgrade existing problems to the new bar; remove the dead prototype path
d6141a1  Wire real Claude-backed Ask-AI, replacing the canned prototype reply
12e0e28  Add Meeting Notes Summarizer — a linear (non-routing) problem
6ac5d9c  Generalize workflow topology: metadata-driven engine, no hard-coded chain
fefd5a3  Add Railway deploy config for the Next.js monorepo app
0d14203  Add Prisma data model (@judge/db) — completes M0's DB foundation
c8ab1dc  Set up innate/ as self-contained continuation of the M0 monorepo build
bc4fa77  Document components/ dir, Zustand grading store, and npm start in CLAUDE.md
```

**Recommended next step:** M1 (auth + serve problems from DB). It needs a Postgres
instance first — on Railway, add a Postgres service and wire `DATABASE_URL`, then run
`npm run migrate:deploy --workspace @judge/db`.
