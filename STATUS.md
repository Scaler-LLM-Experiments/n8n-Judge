# Status

**The single source of truth for what's built and what's next.** Update this file as work
lands — don't start a new handoff doc.

Last updated: 2026-07-27 · Branch: `sudhanva/nextjs`

---

## Where we are

The frontend-only Vite prototype has been ported into a Next.js full-stack monorepo.
**M0 is complete**, plus three things beyond it. Nothing from M1 onward has started.

Verified on a clean install: **63/63 unit tests**, `npm ci` in sync, `next build` clean,
smoke green.

---

## Done

### M0 — Foundations
- npm-workspaces monorepo; engine, catalog and problems extracted into `packages/`.
- `edgeMatches` deduped into one shared module.
- **Prisma data model** — 13 tables, 7 enums, initial migration committed. Not yet run
  against a live database.
- `problem-schema` (zod + `validateProblem()`), `trace` (TraceEvent contract),
  `queue` (interface + pg-boss driver + SQS stub), `llm` (Claude client + prompt builders).
- Next.js app renders the whole ported journey.

### Beyond M0
- **Topology generalised.** `engine/simulate.js` resolves each node's role from catalog
  metadata (`category`, `needsModel`, `branches`) instead of hard-coding
  `trigger → ai → parse → switch → action`. This overrode the plan's risk-#1 deferral.
  `validateProblem()` now enforces only generic structure — start at a trigger, finish at
  an action; model and routing rules apply only when those roles are used.
- **Third problem: `meeting-notes`** — linear, no router. Exists to prove the above; that
  shape could not run before.
- **Real Ask-AI** — streaming `/api/ask-ai` (Claude), scoped to problem/screen/phase/node,
  prompted never to leak answers, graceful 503 without a key.
- **Smoke test** — loads every screen of every problem, fails on any runtime error.
- **Repo restructured** (2026-07-27) — the monorepo moved from `innate/` to the repo root
  and both dead Vite prototypes were deleted. Railway's Root Directory must now be the
  repo root, not `innate`.

---

## Next

### M1 — Auth + problems from the DB ⬅ **current**

1. ~~Provision Postgres, wire `DATABASE_URL`, run the migration.~~ **Done** — local
   Postgres via [docker-compose.yml](docker-compose.yml) (`npm run db:up`), migration
   `0001_init` applied, all 14 tables live. A **hosted** Postgres is still needed for
   deploys; the Railway MCP is not authenticated, so someone has to run `railway login`
   and add a Postgres service.
2. Auth.js Credentials — email + password, bcrypt/argon2, roles LEARNER/ADMIN.
3. Signup with batch invite codes; Programs (SE / AIML / DSML) as DB rows.
4. `GET /api/problems`, `GET /api/problems/[slug]`; seed the three problems as v1 PUBLISHED.
5. Switch the journey off the client-side registry import.

### M1.5 — n8n fidelity + real assessment
Full plan: **[docs/plan-m1.5-fidelity-and-assessment.md](docs/plan-m1.5-fidelity-and-assessment.md)**

Judge currently cannot fail a learner. An audit of the three shipped problems found the
correct option at index 0 in **25/25** NDV fields and **13/13** dissection items, every
wrong-pick probe shipping a free `correct: true` escape, and probe copy that names the
right node outright. Separately, the editor is not faithful to how n8n actually works
(no cluster-node Agent, no typed AI connectors, Settings tab disabled, 2×3-dropdown
config on every node).

Sits before M2 deliberately: M2 builds the trace pipeline and M3 replays it to grade, and
both are shaped by what a session can contain.

### M2 — Persistence + tracing
Session + event APIs (batched, idempotent on `sessionId,seq`), a client outbound event
queue, resume-on-reload, and a read-only admin session timeline. `record()` in `App.jsx`
is the hook point; run results and graph mutations must also be traced.

### M3 — Queue + grading + ratings
Worker service replays trace → engine → re-validates against the **pinned**
ProblemVersion → digest → Claude → `GradingReport`. SSE to the Report screen with a
polling fallback (**spike SSE through Railway's proxy early**). Seed the rubric and add
the 1–5 rating prompt.

### M4 — Admin analytics
Dashboard, per-problem funnel, learner search → session map, rubric editor with versions
and re-grade, ratings view.

### M5 — Authoring pipeline
`draft-with-ai` → hybrid form/JSON editor with `validateProblem()` and live
`BuildPreview` → versioned publish → assign. Then ship more problems through it.

### M6 — Voice / mascot (flag-gated, parallel)
Per [docs/mascot-system-porting-guide.md](docs/mascot-system-porting-guide.md). Nothing
exists yet; the mic button is decorative.

### M7 — AWS/SQS swap (deferred)
Implement `sqsDriver`, flip `QUEUE_DRIVER`.

---

## Locked decisions

Do not re-litigate these.

| Decision | Value |
|---|---|
| Approach | **Port, don't rewrite.** Existing `.jsx` moved in untouched; all new code is TypeScript. |
| Models | Sonnet for grading and authoring, Haiku for Ask-AI. Set via `JUDGE_*_MODEL`. |
| Auth | Email + password self-signup as a throwaway interim; federate to Scaler SSO later. |
| Queue | SQS-shaped abstraction, pg-boss driver now, separate worker service. |
| DB | Postgres + **Prisma 6.x** (pinned — Prisma 7's config/adapter model is too new). |
| Topology | **Data, not code.** Overrides the original plan's deferral. |
| Grading | **Server-authoritative** — the worker replays trace events through the same engine. Never trust a client score. |
| Versioning | A `Session` pins its `ProblemVersion`; republishing never changes a running session's basis. |
| LMS | Parked. |

---

## Known issues

1. **No component tests.** `npm test` covers engine, schema and problem data only. Always
   run `npm run smoke` after touching components.
2. **Smoke has a coverage hole.** Journey-start clicks the *first* "Try this judge" button
   regardless of `?problem=`, so the `lead-triage` and `meeting-notes` Understand screens
   have never actually been tested. Worth fixing before M1.5 starts.
3. **`lead-triage` is a structural clone of `email-triage`** — identical node types, field
   keys, branch count, phase ids. M1.5 §D1 replaces it.
4. **Beware `replace_all` edits in `.jsx`.** A past `ReferenceError` came from replacing
   every `<TopBar activeStage="statement" />`, including inside inner components with no
   `problem` prop. Check enclosing function scope.
5. **Next.js can pollute the root `tsconfig.json`** if `next dev` runs from the monorepo
   root — it injects `jsx`/`plugins`/`.next/types`, which belong in `apps/web/tsconfig.json`.
   Revert if it appears in a diff.
6. **A stray `package-lock.json` sits one level above the repo**, which makes Next infer
   the wrong workspace root. Harmless in dev; can affect output file tracing on build.
7. **`#run-story` shows a leftover "General question" case label** for `meeting-notes` —
   cosmetic, dev route only.
8. **Ask-AI is deliberately unhelpful about answers.** Asked "which node?", it teaches the
   concept and asks a guiding question. Intended.
