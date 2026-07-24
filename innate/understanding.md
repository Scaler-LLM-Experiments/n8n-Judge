# understanding.md — n8n Judge production build

> My working understanding of the project, the plan, the current state of the code,
> and the decisions we've locked in. This is the shared reference we build against.
> Owner authored the plan (`docs/plan-production-platform.md`); I execute it as a
> production build. If anything here is wrong, correct it and we re-align.

---

## 1. What we're building (and why)

**Scaler** teaches non-technical AI/ML & DSML learners to build AI agents. Part of the
curriculum is building agents in **n8n** (node-based automation software). The problem:
dropping a non-tech learner straight into real n8n overwhelms them — too many options, no
hand-holding — and grading real n8n inside the LMS is expensive (it's just an iframe /
container you can't instrument or coach inside).

**n8n Judge** is a **simulator** that teaches *and* grades at the same time. It does not
mimic all of n8n — it teaches the mental model so learners can later use the real tool.
A learner works one problem statement through a guided journey:

1. **Understand (Dissect)** — MCQs that make them reason about *why* each node exists
   ("what should the trigger be? how should these emails be classified?").
2. **Build** — place and configure nodes on a simulated n8n canvas, hand-held by the
   **Iris** mascot, with wrong-pick probes and per-node config (NDV). An **Ask AI** helper
   is available throughout.
3. **Stress Testing** — edge-case MCQs against the flow they built.
4. **Result** — an AI reviews the *entire interaction* (wrong picks, retries, where they
   struggled) and produces a graded report.

The prototype (frontend-only Vite/React) proved the concept and got stakeholder go-ahead.
This build turns it into a **production platform** in **Next.js** (frontend + backend owned
together).

## 2. Scope of the production build

In scope (from the owner's brief + the plan):

- **Auth + batches**: learners sign up / log in; problems assigned per **Program**
  (Software Engineering / AI-ML / DSML) and/or batch.
- **Session persistence + full interaction tracing**: every action a learner takes,
  where they are, how many attempts — all traced and resumable.
- **Async LLM grading**: a **separate backend worker** with an **SQS-shaped queue** does
  scoring/grading off the request path and returns the report to the app.
- **Admin tool**: analytics (problems solved, completion rate, attempts, avg rating),
  per-learner **session map** ("which learner is stuck where"), so staff can call a
  learner and debug live.
- **Rating & review**: collected while the report generates; flows into admin.
- **Editable scoring rubric**: a system-prompt-style rubric, generalized across problems,
  editable from an admin panel (copy/paste/edit).
- **AI-assisted problem-ingestion / authoring pipeline**: author pastes a statement +
  picks a program → Claude drafts the full problem (nodes, connectors, scripts, MCQs,
  grading) → editor + validation + live preview → publish → assign. Minimal dev bandwidth
  to add new problems.
- **Voice/mascot (Iris)**: added per the provided porting guide
  (`docs/mascot-system-porting-guide.md`, Deepgram-based). Feature-flagged workstream.

**Parked**: LMS integration (the dev team handles it later).

## 3. Locked decisions (this session)

- **Work location**: continue the M0 build from the `sudhanva-nextjs` /
  `claude/n8n-judge-simulator-kzu2yn` line, but do it **on branch `claude/init-jniws3`
  inside a new `innate/` folder** — a self-contained snapshot of everything done so far
  that we keep building in, so progress is easy to track. Do **not** push to
  `sudhanva-nextjs`.
- **Plan authorship**: the owner authored the plan. I execute it as a *production* build,
  and I'll raise pushback where production-readiness demands it.
- **LLM models** (via the Claude API): **Sonnet** for grading, and **Sonnet for authoring
  too** (authoring doesn't need a heavier model — Sonnet is good enough). Ask-AI can run on
  a cheap tier. Model IDs live in config/env so they're swappable — no model choice blocks
  M0. *(Flag: confirm the Ask-AI tier — Sonnet vs Haiku — when we wire M3.)*
- **Auth (interim)**: simple **email + password** with **self-signup** (learner creates an
  account, sets a password, logs back in). This password is a **throwaway** — Scaler
  learners already have identities we will **federate to "Login with Scaler" (SSO)** after
  testing. Build create-account + login now; leave SSO for later.
- **New problems**: ship **2–3 new problems** to battle-test the authoring pipeline.

## 4. Biggest delta from the written plan — topology is NOT hard-coded

The plan (risk #1) *deferred* generalizing the engine: it kept the hard-coded
`trigger → ai → parse → switch → action` walk and mitigated with a "canonical-topology"
assertion in `validateProblem()` + a hard prompt constraint.

**New direction for this production build: generalize it.** Topology must be **data, not
code**. Problems of arbitrary shape — multi-node, RAG, IF-based, multi-agent,
human-in-the-loop (the 20 patterns in `docs/research/n8n-ai-nodes-and-patterns.md`) — must
run purely as authored data. That means retiring the three coupling points identified in
the codebase inventory:

1. `packages/engine/simulate.js` — the hard-coded `if/else if` walk over
   `classify | parse | switch | action`.
2. `apps/web/src/n8n/N8nEditor.jsx` `expectedNext()` — the structurally hardwired
   modelSlot / branch / triggerSlot / linear-next logic.
3. The `variantOf(type) === 'ai'` check that decides which node gets a Chat-Model port.

Generalizing this is **part of this build**, not a later project. It also means the
`flow` schema (currently forces `branchNext`/`modelNext`) and the authoring validator need
to describe topology generically (per-node input/output ports + connection rules) rather
than assume the canonical five-role chain. Target: align the graph model with **real n8n
JSON** (connections keyed by source node, `main: [[...]]` arrays-per-output, typed
`ai_languageModel`/`ai_tool`/`ai_memory` sub-node connectors) per
`docs/research/n8n-core-architecture.md`, so authored problems could round-trip toward real
n8n later.

## 5. Current state of the code (verified, not assumed)

`innate/` is a self-contained npm-workspaces monorepo. `npm install` + `npm test` clean:
**55 tests pass**. What exists:

**Done (M0a + most of M0b):**
- `packages/engine` — ported prototype engine (validateGraph, simulate, grading, connections,
  checkDrop, evalScore) with tests; `edgeMatches` extracted to one shared module (the
  plan's dedup refactor — done).
- `packages/catalog` — the 14-node vocabulary (`NODE_CATALOG`).
- `packages/problems` — `email-triage` + `lead-triage` as data (dir normalized to kebab-case).
- `packages/problem-schema` — full **zod** `problemSchema` + `Problem` type +
  `validateProblem()` + tests; also `decisionSchema`.
- `packages/trace` — full trace-event contract (`decision`, `screen_transition`,
  `phase_transition`, `ndv_open`, `graph_mutation`, `probe_shown`, `run_result`,
  `ask_ai_turn`, `session_complete`), `(sessionId, seq)` idempotency, batch schema.
- `packages/queue` — `Queue` interface + `pgBossDriver` + `sqsDriver` (stub), driver-swappable.
- `packages/llm` — Claude client + grading / authoring / ask-ai prompt builders.
- `apps/web` — Next.js App Router app mounting the ported prototype client-side
  (`judge-client.tsx`, SSR off); static assets synced into `public/`.

**Not done yet (the M0 → M6 remainder):**
- **Prisma** — no `prisma/schema.prisma` yet. This is the main remaining M0 piece.
- Auth (Auth.js credentials), signup/invite codes, programs/batches — M1.
- Session/TraceEvent API routes, client outbound queue, resume-on-reload — M2.
- Worker service, pg-boss wiring, `grade_session` → Claude, SSE report stream, rubric
  seed, rating — M3.
- Admin analytics + session map + rubric editor — M4.
- Authoring pipeline (draft-with-ai + editor + preview + publish/assign) + 2–3 new
  problems — M5.
- Voice/mascot — M6 (flag-gated, parallel).
- **Engine topology generalization** (§4) — woven through M0/M5 rather than deferred.

**Note:** `innate/CLAUDE.md` is still the *prototype-era* file (describes the frontend-only
Vite app). It should be updated to the monorepo reality as the structure settles.

## 6. Architecture invariants to preserve

- **Port, don't rewrite**: existing `.jsx` screens/engine/editor move in untouched as
  `'use client'`; all new code is **TypeScript**.
- **One engine, both sides**: worker and client import the exact same `packages/engine` +
  `packages/catalog`, so a server-replayed score is deterministic and matches the client.
- **Trace is the source of truth**: grading replays `decision` events server-side; it does
  **not** trust a client-sent score. The prototype gap (run results + graph mutations never
  hit the grading store) is closed by the trace schema carrying them.
- **Versioning**: a `Session` pins the `ProblemVersion` it started on; republishing a
  problem never changes a running/finished session's grading basis.
- **First-try is the graded signal**, not eventual correctness (from `grading.js`).

## 7. Immediate next steps (M0 completion)

1. Add `prisma/schema.prisma` with the core tables (Program, Batch, User, Problem,
   ProblemVersion, ProblemAssignment, Session, TraceEvent, Rubric, RubricVersion,
   GradingReport, Rating, VoiceClip, Tour) + first migration; wire a Prisma client package.
2. Begin the **topology generalization** design (§4) so the problem-schema and engine stop
   assuming the canonical chain before we seed DB problems in M1.
3. Confirm `apps/web` runs end-to-end (dev server + a shoot script) as the ported journey.
4. Keep `npm test` green at every step; add CI (vitest + `next build`) — none exists today.

*(Await owner's go-ahead on sequencing before deep implementation.)*
