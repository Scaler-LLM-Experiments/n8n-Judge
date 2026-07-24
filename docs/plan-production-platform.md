# n8n Judge — Production Platform Plan (Next.js full-stack)

## 1. Context

"Judge" is a frontend-only Vite+React prototype (in `app/`) that simulates the n8n editor to teach non-tech Scaler learners (AI/ML & DSML batches) to build AI-agent workflows: **Understand → Build → Stress Testing → Result**. Problems are pure data objects; two exist (`email-triage`, `lead-triage`). Stakeholders approved productionizing it. This plan turns it into a full platform: auth + batches, session persistence & full interaction tracing, async LLM grading (queue + worker), admin analytics with per-learner session maps, rating/review, an editable scoring rubric, an AI-assisted problem-ingestion pipeline, and the Iris voice/mascot system (per the provided porting guide). LMS integration is explicitly parked.

Three research subagents (run on Sonnet per Prachi's credit constraint) produced: a full codebase inventory, an n8n core-architecture report, and an n8n node-catalog/AI-nodes/problem-patterns report. Their full texts will be committed as `docs/research/*.md` in the first implementation commit (content is in this session's transcript).

## 2. Locked decisions (agreed with Prachi)

1. **Port, don't rewrite**: existing screens/engine/n8n-editor move into one Next.js (App Router) app as `'use client'` components, `.jsx` untouched; all NEW code in **TypeScript** (`allowJs`).
2. **Railway now, AWS later**: queue is an **SQS-shaped abstraction** — `pg-boss` (Postgres) driver today, `sqsDriver` later; **separate worker service** (same repo, second Railway service). Load target: 200–400 concurrent learners (grading bursts are naturally rate-limited; cap worker LLM concurrency at 10–20).
3. **Postgres + Prisma**; **Auth.js Credentials** (email+password, bcrypt/argon2, roles LEARNER/ADMIN) — chosen over hand-rolled cookies because "Login with Scaler" SSO is a stated future need.
4. **Batch invite codes at signup**; batches belong to a Program (SE / AIML / DSML, DB rows not enums); problems assigned to programs and/or batches.
5. **Claude API** for grading, authoring drafts, and Ask-AI chat.
6. **AI-assisted authoring**: paste statement + program → Claude drafts full problem JSON (schema-constrained, streamed) → hybrid form/JSON editor + `validateProblem()` + live preview (reuse `BuildPreview`) → versioned publish → assign.
7. **Voice/mascot included in this build**, per `mascotsystemportingguide.md` (Deepgram Aura-2, pre-rendered clips in S3, moment-based voiceStore, pure mascot state machine, name-splicing, NUX tours) — its own feature-flagged workstream.
8. Defaults chosen for design open-questions: server re-derives scores **at grading time only** (no per-Run server round-trip; acceptable trust level for a learning tool); **each retry = a new Session row** (analytics dedupe by user+problem); **Ask-AI transcripts persisted** (Prachi wants everything traceable).

## 3. Repo structure (npm workspaces monorepo, restructure in-place on branch `claude/n8n-judge-simulator-kzu2yn`)

```
packages/
  engine/          # ported app/src/engine/*.js + tests, unchanged logic; typed barrel index.ts
  catalog/         # ported app/src/n8n/catalog.js (node vocabulary) — shared client+worker
  problem-schema/  # NEW TS: Problem types (zod), validateProblem(), JSON Schema for Claude structured output
  trace/           # NEW TS: TraceEvent discriminated union + zod schema for batch ingest
  queue/           # NEW TS: Queue interface; pgBossDriver now, sqsDriver stub
  llm/             # NEW TS: Claude client + grading/authoring/ask-ai prompt builders (shared web+worker)
apps/
  web/             # Next.js App Router: (learner) route group, admin/ route group, api/
                   #   ported screens/design-system/n8n/mascot under src/components as client components
  worker/          # plain Node (tsx) entrypoint: registers job handlers, boots queue consumer
prisma/            # schema.prisma + migrations (pg-boss owns its own `pgboss` schema — never migrated by Prisma)
docs/research/     # the 3 research reports committed as markdown
Dockerfile         # multi-target: web + worker; railway config points 2 services at the 2 targets
app/               # old Vite app: kept as read-only reference during port, deleted at the end
```

Key invariant: **worker and client import the exact same `packages/engine` + `packages/catalog`**, so server-derived scores replay deterministically. Extract the duplicated `edgeMatches` helper (validateGraph.js / connections.js) into one shared function during the move. Normalize `emailTriage` dir → `email-triage`.

## 4. Data model (Prisma — full schema in design; key tables)

- `Program`, `Batch` (programId, `inviteCode` unique), `User` (email unique, passwordHash, role, batchId?).
- `Problem` (slug, currentPublishedVersionId) / `ProblemVersion` (monotonic `version`, `status` DRAFT|PUBLISHED|ARCHIVED, `data` JSONB = the whole problem object validated by `validateProblem()` before write, `authoredBy`, `draftPrompt`) / `ProblemAssignment` (problemId + exactly one of programId/batchId, app-enforced).
- `Session` (userId, problemId, **problemVersionId pinned at start**, status, `currentScreen`, `currentPhase`, `builtGraphSnapshot` JSONB denormalized for resume/admin, startedAt/completedAt) — one row per attempt; `@@index([status, currentScreen])` for "who's stuck where".
- `TraceEvent` (BigInt autoincrement id, sessionId, **client-assigned `seq`**, `type` ∈ decision | screen_transition | ndv_open | graph_mutation | run_result | probe | ask_ai_turn | rating_shown…, `payload` JSONB, clientTs, receivedAt; `@@unique([sessionId, seq])` = idempotent batch re-send). Append-only; closes the prototype gap where run results/graph bypass the grading store, and keeps ALL attempts (client dedup keeps first-try; server keeps everything).
- `Rubric` (problemId nullable = generalized default) / `RubricVersion` (`systemPrompt` text, monotonic version) — reports FK the exact `rubricVersionId` used (auditable; re-grade = new report row).
- `GradingReport` (sessionId, rubricVersionId, status QUEUED→…, jobId, understandingScore column + `reportJson` JSONB, token counts + cost estimate, error).
- `Rating` (sessionId, userId, stars 1–5, text).
- `VoiceClip` (momentKey, userId? null=generic, s3Key, status) + `Tour` completion per user.

## 5. API surface (App Router route handlers; `/api/admin/*` + `/admin/*` role-gated in middleware)

- **Auth**: `POST /api/auth/signup` (email+password+inviteCode → batch), login/logout/me via Auth.js.
- **Problems**: `GET /api/problems` (filtered by caller's batch/program), `GET /api/problems/[slug]` (published version data — replaces the client-side registry import).
- **Sessions**: `POST /api/sessions` (create, pin version) · `GET /api/sessions/[id]` (resume payload: currentScreen/Phase, graph snapshot, decision events) · `PATCH /api/sessions/[id]` (screen/phase transitions — lightweight, near-real-time admin view) · `POST /api/sessions/[id]/events` (batched trace ingest, idempotent on (sessionId,seq)) · `POST/GET /api/sessions/[id]/grade` (enqueue idempotently via singletonKey / poll) · `GET /api/sessions/[id]/grade/stream` (**SSE**, Postgres LISTEN/NOTIFY from worker; polling fallback kept; spike-test SSE through Railway's proxy early) · `POST /api/sessions/[id]/rating`.
- **Ask-AI**: `POST /api/ask-ai` — streaming Claude chat scoped to current problem/node context; turns persisted as `ask_ai_turn` trace events.
- **Voice**: `GET /api/voice/narration?moment=` — serves clip from S3 (local dir in dev), `X-Voice-Text` header per guide; 404 → client text-only fallback.
- **Admin**: problems CRUD + `versions` + `publish` (atomic transaction) + `draft-with-ai` (streaming) + `assign`; batches/programs CRUD (invite codes); users list + per-user sessions; rubrics CRUD + versions + re-grade action; `analytics/overview`, `analytics/problems/[id]` (funnel from currentScreen/Phase distribution + event aggregates), `sessions/[id]` (full session map: ordered events + graph replay).

## 6. Queue & worker

`packages/queue` interface: `enqueue(jobType, payload, {idempotencyKey, retryLimit})`, `registerHandler`, `start()`, `getStatus()`. pg-boss driver maps idempotencyKey→`singletonKey`, retryLimit/backoff native; `NonRetryableError` class distinguishes validation failures from transient Claude 5xx. SQS driver later = `SendMessage` with dedup id (FIFO), long-poll consumer — handlers unchanged, `QUEUE_DRIVER` env flips it.

Job types: `grade_session {sessionId}` · `render_voice_clips {momentKeys[]}` · `render_name_clips {userId, name}` (fire-and-forget on signup) · `render_phase_intros {problemId, versionId}` (authoring-publish hook — per-problem phase-intro voice clips).

## 7. LLM grading flow

Worker `grade_session`: fetch ordered TraceEvents → replay `decision` events through `packages/engine` `createStore/recordDecision` (server-authoritative score) → rebuild final graph, re-run `validateGraph`+`simulateAll` against the **pinned** ProblemVersion → build a compact chronological digest (durations per screen, retries per phase, wrong-pick→corrected sequences; summarize, never raw-dump events — bounded prompt tokens) → resolve rubric (per-problem published override else default, current version) → Claude structured output (zod-defined tool):

```ts
{ understandingScore, areaBreakdown: [{area, score, summary}], misconceptions: [{code, label, explanation, evidence}], strengths: [], narrative, recommendedNextSteps? }
```

Stored in `GradingReport`; SSE notifies the Report screen. Client-computed score renders instantly as preview while the real report streams in. Guardrails: worker `teamConcurrency` 10–20, hard timeout, retryLimit 3 w/ backoff, per-report token/cost tracking surfaced in admin, skip re-call if identical session+rubricVersion report exists.

**Default rubric (seed, admin-editable plain text):** four weighted areas — Problem Dissection 25%, Workflow Construction 30%, Node Configuration 25%, Edge-Case Reasoning 20%; first-try is the primary signal (retry success = max 50% credit); every misconception code must appear with belief/why-wrong/habit-to-fix; calm interviewer tone, simple English, no idioms; 3–4 sentence summary + strengths + focus areas + suggested next challenge; never invent events; sparse trace ⇒ "insufficient evidence". (Full text drafted — seed verbatim.)

## 8. Authoring / ingestion pipeline

- `draft-with-ai` (admin-only, **synchronous streaming**, no job needed): prompt = problem-schema JSON Schema + both existing problems as few-shot exemplars + `packages/catalog` vocabulary constraint + the misconception bank from research (for probe/eval authoring) + **hard topology constraint** (trigger → ai(+model) → parse → switch → actions) until `simulate.js` is generalized.
- Editor: left = structured form for error-prone fields (dissection, nodeSetup options w/ exactly-one-correct + why, nodeProbes, evalQuestions) with inline validation; raw-JSON tab for structural fields (referenceGraph, flow, branches, buildPhases, sampleCases); right = live preview reusing `BuildPreview` fed the in-memory draft.
- `validateProblem()` (generalized from `data/problems/*/index.test.js`): exactly-one-correct per field/probe, correctIndex in range, palette covers required types + ≥1 distractor, buildPhases cover topology, branch ids consistent across sampleCases/flow.branchNext, all node types exist in catalog, positions numeric, **canonical-topology assertion** (risk #1 from design). Gates every draft save and publish.
- Versioning: drafts mutate the DRAFT row (copy-on-write from published); publish is one transaction (PUBLISHED + archive previous + update pointer). **Sessions never see republishes** (pinned version).

## 9. Session persistence & tracing (client side)

Server-authoritative, optimistic local-first: UI state stays instant in-memory; every gradable interaction also appends to a zustand-backed outbound queue with client `seq`, flushed every ~2–3s + on screen transition + beforeunload; idempotent re-send. On mount: create or `GET` session → rehydrate `screen` from `currentScreen`, grading store by replaying decision events, graph from snapshot, runResult from last run_result event. Repeated flush failure ⇒ "syncing…" badge, keep accumulating (full offline out of scope). `record()` callback stays synchronous — the queue write is the only addition.

## 10. Admin panel (`/admin`)

Dashboard (problems solved, completion rate, attempts, avg rating, LLM cost); per-problem funnel (stage/case drop-off); learner search by email → sessions list → **session map** (event timeline + graph replay + current stuck point); rubric editor (textarea + versions + re-grade); problem authoring (§8); batches/programs + invite codes; ratings view (average + per-learner).

## 11. Voice/mascot workstream (feature-flagged, parallel after M0)

Per the porting guide, adapted: mascot pure state machine + dotLottie player ported near-verbatim (`MOMENT_REACTIONS` remapped to Judge moments: dissection_correct, wrong_pick, probe_answered, ndv_verified, phase_complete, run_pass/fail, report_ready…); voiceStore with X-Voice-Text captions, RMS amplitude pulse, autoplay consent gate, text-only fallback, prefetch; Next.js narration route (§5) + S3 clip layout + manifest exactly as guide; clip generator as a Node script (Deepgram Aura-2, local-dir-first → --s3); name clips via `render_name_clips` on signup (WAV/linear16 splicing per guide); NUX tours generalize BuildStage's spotlight (tourStore + [data-tour] + persisted completion). Kill switches: mascot / machine / narration / tours. Carry the guide's gotcha list (v1 manifest, local WASM, AudioContext unlock, StrictMode double-play, WAV param assert, bottom-anchored travel).

## 12. Milestones (each demoable)

- **M0 Foundations**: workspaces skeleton; move engine/catalog into packages (tests passing); `problem-schema` types + `validateProblem()`; Prisma schema + migration; Next.js app scaffold with full prototype ported and running on in-memory problems. *(Hardest structural risk retired first.)*
- **M1 Auth + catalog**: signup w/ invite codes, login; problems served from DB (seed both problems as v1 PUBLISHED); journey plays exactly as before behind auth.
- **M2 Persistence + tracing**: Session/TraceEvent, batch ingest, resume-on-reload; read-only admin session timeline (early "who's stuck where").
- **M3 Queue + grading + ratings**: worker service, pg-boss, `grade_session` → Claude, SSE report stream, rubric seeded, rating prompt while report generates.
- **M4 Admin analytics + rubric editor**: funnels, drill-downs, rubric versions + re-grade.
- **M5 Authoring pipeline**: draft-with-ai, hybrid editor + BuildPreview, publish/assign. Ship 2–3 new problems from the research pattern list (e.g. ticket triage, review classifier, sentiment router) to battle-test it.
- **M6 Voice/mascot** (parallel from M0, flag-gated): clips, narration route, name splice, tours.
- **M7 AWS/SQS swap** (deferred): implement sqsDriver, flip env, drop pgboss schema.
- **Ask-AI real chat**: small, ship inside M3 (same Claude client, streaming route, drawer already exists).

## 13. Research digests (commit full reports to docs/research/)

- **Codebase**: schema/coupling/grading-store inventory as summarized in §3–§9; legacy fields buildSteps/connectionGuide/testCaseSummary dropped from new schema; Ask-AI is a canned shell; no voice code exists.
- **n8n core** (`n8n-core-architecture.md`): workflow JSON (connections keyed by source node name, `main: [[...]]` array-per-output — IF 2, Switch N) — v2 target for graph format so problems can round-trip with real n8n JSON; NDV 3-pane + Execute step; items model + `{{ $json.x }}` expressions (drag-to-map = highest-leverage teaching interaction); Publish/version model (not the old active toggle); executions + dirty nodes; credentials tested-on-save; flow-control node facts (Switch fallback none/extra/output-0, Merge modes, auto-iteration).
- **n8n catalog/AI** (`n8n-ai-nodes-and-patterns.md`): 4 catalog categories; cluster-node model (root + `ai_languageModel`/`ai_memory`/`ai_tool`/`ai_outputParser` connectors — our `ai_model` handle generalizes to this in catalog v2); AI Agent params + Agent-vs-Chain; Text Classifier's "When No Clear Match: Other-branch/discard" maps to our `branch:null`; **20 problem patterns** across SE/AIML/DSML with node chains + difficulty; **misconception bank** (missing chat model, unparsed LLM output into Switch, IF-vs-Switch, silent fallback drop, temperature≠0, hardcoding vs expressions, test-vs-prod webhook URL, Agent/Chain conflation…) feeding probes and the authoring prompt.

## 14. Verification

- `packages/engine` tests pass unchanged after the move; `validateProblem()` unit-tested against both seed problems + mutation cases (borrow validateGraph.test.js's approach).
- Playwright shoot scripts re-pointed at the Next.js dev server; add a signup→journey→report E2E happy path.
- Seed script: programs, a batch + invite code, demo learners with synthetic traces → exercises admin analytics and session map without real cohorts.
- M3: SSE-through-Railway spike; grading job load test (burst 50 jobs, verify concurrency cap + queue drain); token/cost numbers visible in admin.
- Voice dev harness page (guide §9.9) + `voice/diagnostics`-style endpoint.
- CI: GitHub Actions running vitest + `next build` (none exists today).

## 15. Critical files

Port sources: `app/src/App.jsx` (state machine → rehydration), `app/src/engine/grading.js` + `simulate.js`, `app/src/n8n/catalog.js`, `app/src/data/problems/emailTriage/index.{js,test.js}`, `app/src/screens/BuildStage.jsx`, `app/src/n8n/{N8nEditor,Ndv}.jsx`, `app/scripts/shoot-*.mjs`. New keystones: `prisma/schema.prisma`, `packages/problem-schema/*`, `packages/queue/*`, `packages/trace/events.ts`, `apps/worker/src/jobs/gradeSession.ts`, `apps/web/app/api/sessions/[id]/events/route.ts`, `mascotsystemportingguide.md` (uploaded; copy into docs/).

## 16. Known risks

1. `simulate.js` hardcoded walk vs AI-drafted topologies → mitigated by topology assertion in `validateProblem()` + hard prompt constraint (generalizing the walk is a later, separate project fed by the n8n research).
2. Client-trusted run events (no per-Run server check) — accepted for a learning tool; revisit if this ever gates certification.
3. TraceEvent write volume + pg-boss on one Railway Postgres — load-test at M2/M3; split DBs if contention.
4. SSE buffering on Railway proxy — spike early, polling fallback exists.
5. Learner free-text reaching grading prompts (prompt injection) — digest builder whitelists fields; learner text is quoted/delimited.
