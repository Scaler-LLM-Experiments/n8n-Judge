# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Orientation

**Read [STATUS.md](STATUS.md) first** — it is the single source of truth for what's built,
what's next, and known issues. Keep it updated as work lands; do not start a new handoff
doc. [README.md](README.md) covers commands and layout. This file covers architecture,
conventions, and the things that will bite you.

"n8n Judge" is a simulator that teaches non-technical Scaler learners to build AI-agent
workflows in n8n **and grades them while they do it**. Per challenge the learner walks
**Home → Understand → Build → Stress Testing → Result**. Four challenges ship:
`email-triage`, `lead-triage` (routing), `meeting-notes` (linear) and `order-desk`
(21 nodes, 8 routes, two AI nodes — the hard one).

The repo root **is** the monorepo — `apps/web` plus ten `@judge/*` packages. It was
restructured on 2026-07-27; anything referring to an `innate/` folder or an `app/` Vite
prototype is out of date, and both are gone.

## Commands

Node 20+, everything from the repo root.

```bash
npm install
npm run dev        # Next.js dev → http://localhost:3000
npm run build      # production build
npm test           # vitest — packages/** and apps/web/src/**/*.test.*
npm run smoke      # full-journey runtime check (needs dev running)
npm run typecheck  # BOTH halves: typecheck:packages (root tsconfig) + typecheck:web
```

**`npm run typecheck` only recently covered the web app.** The root tsconfig *excludes*
`apps`, so for a while an app-level type error was invisible to every check safe to run
during development — `next build` was the only thing that caught it, and it cannot run
while `next dev` is running. One such error went straight to a failed production build.
Both halves now run; don't drop one.

Single test file: `npx vitest run packages/engine/simulate.test.js`. Watch: `npx vitest`.

**The app needs Postgres and a signed-in user to do anything.** Problems are served from
the DB, and the journey is behind auth:

```bash
cp .env.example .env   # set AUTH_SECRET (openssl rand -base64 32); POSTGRES_PORT if 5432 is taken
npm run db:up          # local Postgres via docker-compose.yml
npm run db:migrate      # apply committed migrations
npm run db:seed        # programs, batches, and the four problems as v1 PUBLISHED
npm run db:seed:rubric # the grading rubric as RubricVersion v1 — see below, not optional
```

Then sign up at `/signup` with a seeded invite code — `AIML-DEMO`, `DSML-DEMO` or
`SE-DEMO`. The **first** admin is a manual promotion
(`UPDATE "User" SET role='ADMIN' WHERE email='…';`); after that, `/admin` → Admins grants
by email.

**`db:seed:rubric` is load-bearing, not decoration.** With no `RubricVersion` row the
Result screen still shows a score but `POST /api/sessions/[id]/report` cannot persist a
`GradingReport`, so admin analytics has nothing to average. The route logs exactly this.

`npm run db:seed:demo` fabricates ~60 demo learners with generated traces replayed through
the real engine, so the admin dashboard has consistent numbers before real cohorts exist.
It **refuses to run against a non-local database** unless `ALLOW_REMOTE=1`; `-- --clear`
removes them (they're marked by the `demo.judge.local` email domain).

Other db scripts: `db:down`, `db:migrate:dev` (new migration from schema changes),
`db:generate`, `db:studio`.

`npm run voice:generate` renders Iris's narration **on this machine**, and
`npm run voice:sync` uploads it. Neither the app nor a dry run ever polls the bucket — see
*Voice* below, and read it before touching anything under `voice*`.

**`npm run smoke` is not optional after touching components.** There are no component
tests, so a render-time bug passes both `npm test` and `next build`. Smoke drives system
Chrome via `playwright-core`; on macOS pass
`SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.

**Dev hash routes** (isolate one screen, all honor `?problem=<id>`, all matched with
`startsWith` — equality silently dropped the `?problem=`): `#build`, `#run-story`,
`#eval-demo`, `#report-demo`, `#run-demo`, `#playground`.

`#build` and `#run-story` go through `BuildPreview`, which **does** create a real session
via the shared `useSession` hook — deliberately. Without one, every check returns "could
not verify" (the browser holds no answers), so `#build` could not verify a single field and
every screenshot taken from it was of a broken grader. `#eval-demo`, `#report-demo` and
`#run-demo` render a screen directly with no session, so grading there is unverified by
design — see *Server-authoritative grading* below.

## Architecture

### Entry — the app mounts client-only
[apps/web/app/page.tsx](apps/web/app/page.tsx) → `JudgeClient` → `next/dynamic(…, { ssr: false })`
around [src/App.jsx](apps/web/src/App.jsx). The whole journey (reactflow canvas, GSAP
mascot, hash routing) is browser-only. `App.jsx` dispatches the dev hash routes, then
renders `Landing` (home ⇄ journey); `MainApp` is the four-screen state machine
(`STATEMENT → DASHBOARD → EVAL → REPORT`); `BuildPreview` is the same journey minus the
intro. Both create a **Session** via `useSession` and wrap their screens in a
`TraceProvider`, threading three things: `sessionId` (how answers get graded), a `record`
callback (the local grading store, now only used for in-journey UI), and `trace` (the
outbound event queue). Screen changes go through one `goTo()` so a new screen cannot be
added without being traced — the admin timeline's "who is stuck where" is built from those
events.

### Port, don't rewrite
Prototype `.jsx` moved in untouched. **All new code is TypeScript.** Workspace packages
ship raw sources and are listed in `transpilePackages` in
[next.config.mjs](apps/web/next.config.mjs) — add a new `@judge/*` package there.
(`@judge/workflow` is absent from that list and still bundles fine under Next 15.5, since
workspace symlinks resolve outside `node_modules`. If a build ever fails on raw TS from a
package, this is the first thing to check.) `serverExternalPackages` keeps `pg-boss` and
the Prisma client out of the bundle.

### Problem-as-data + registry (the key pattern)
Everything specific to a challenge is **one plain data object** in
`packages/problems/<id>/index.js`, registered in
[packages/problems/index.js](packages/problems/index.js) and threaded through the app as
the `problem` prop. To add or change a challenge you edit data, **not** the engine or UI —
see [docs/adding-a-problem.md](docs/adding-a-problem.md).

Key fields: `branches`, `flow` (`start`/`next`/`branchNext`/`modelNext` — the last two
optional), `flowSummary`, `buildPhases`, `nodeSetup` (per-node NDV: `credential` +
disabled `locked[]` + editable `fields[]` whose `options` carry `{value,label,correct,why}`,
plus graded `settings[]`), `nodeProbes`, `sampleCases` (`branch:null` = intentional
fall-through), `dissection`, `nodePalette`, `referenceGraph`, `testCases`, `evalQuestions`,
`misconceptionLabels`, optional `simulation`, optional `voice` (per-problem and per-node
narration overrides), and optional `difficulty` (`easy|moderate|difficult`) +
`difficultyNote` — surfaced by `/api/problems` and shown on the Home cards. Note the
rubric's `problemComplexity()` still derives ordering from the content, so `difficulty` is
label copy, not the thing that sorts the catalogue.

**Field kinds have outgrown `select`.** `FieldControl` and `answerCheck.ts` now cover
`select | text | number | boolean | expression | resourceLocator | ruleList |
assignmentList`. The last three are n8n's structurally-different parameter shapes:

- **`resourceLocator`** is n8n's "which record?" control (`{ __rl: true, mode, value }`).
  Only `value` is graded — the resource, not the lookup mode used to reach it. The
  `resourceValue()` helper exists on both sides and must stay in sync.
- **`ruleList`** (Switch `rules`) and **`assignmentList`** (Edit Fields) are repeatable
  groups the learner *builds*, so the node's shape becomes a consequence of its
  configuration — add a rule, get an output. One algorithm serves both
  ([packages/problem-schema/ruleList.ts](packages/problem-schema/ruleList.ts)); the UI is
  [RuleListControl.jsx](apps/web/src/n8n/RuleListControl.jsx). The authored answer lives in
  `expect.rules` / `expect.assignments`, not in `correct`.
- **A rule list is always exactly three scored items** — `count`, `categories`,
  `conditions` — whatever the learner builds, because a variable-length answer has no
  option count to decay against and per-rule scoring would make the denominator move
  between attempts. Their check ids are `<type>:<fieldKey>#<aspect>`, all open-ended
  (100/50/0). Downstream code still only ever sees the authored branches, because a phase
  cannot complete until the list verifies green.

**`packages/problems` is the seed source, not the served source.** The web app does not
import `@judge/problems` at all — [src/data/problemsApi.js](apps/web/src/data/problemsApi.js)
fetches `/api/problems` and `/api/problems/[slug]`, and `AsyncGate` supplies the
loading/error states. There is deliberately no fallback to the in-repo registry: a silent
fallback would serve content the server won't grade against.

> **Editing a problem file changes nothing in the app until you `npm run db:seed`.** This
> bites every content change.

### Server-authoritative grading (read this before touching any graded surface)
`GET /api/problems/[slug]` used to return `ProblemVersion.data` verbatim — ~25KB, of which
~24KB was answer material readable in devtools. The fix was the projection, not the
storage, and it has three parts:

1. **[`toPublicProblem()`](packages/problem-schema/publicProjection.ts)** strips every
   marker of correctness at the API boundary — `correct`, `correctIndex`, `correctType`,
   `explanation`, `wrongHint`, `unlocks`, `isDistractor`, per-option `why`.
   `KNOWN_REMAINING_LEAKS` (`referenceGraph`, `testCases`, `flow`, `sampleCases`) is the
   pinned list of what still ships, **with a test asserting the list**; those four can only
   go once the Run itself moves server-side (M3), because the client cannot simulate
   without expected outcomes.
2. **`POST /api/sessions`** creates an attempt pinned to a `ProblemVersion` (and reuses the
   one in progress rather than opening a new row per page load);
   **`POST /api/sessions/[id]/check`** grades one answer via
   [`checkAnswer()`](packages/problem-schema/answerCheck.ts) — one function for all six
   kinds (`dissection | field | setting | probe | stress | placement`) — **and records it as
   a `TraceEvent`**. The recording *is* the security property: a side-effect-free check
   endpoint is a free oracle, so guessing is allowed and scores like guessing, because
   `firstTry` is what Understanding is built on. An unknown id records
   `suspicious_check` and 400s. `seq` is server-assigned; the response carries only the
   verdict, the `why` for the chosen option, and (on a correct dissection pick) `unlocks`
   — the misconception code stays server-side.
3. **[src/lib/grader.js](apps/web/src/lib/grader.js)** is the only client entry point, and
   **[src/lib/verdict.js](apps/web/src/lib/verdict.js)** (`resolveServerVerdict`) is the one
   place that turns a response into a verdict. It returns **three** states, because
   `correct: null` — "the check did not complete" — is a real answer the UI must show as
   such. Both guesses have shipped and both were bugs: the NDV guessing *wrong* produced
   the "same answer, different verdict" report, and Understand/Stress Testing guessing
   *correct* turned every option green, unlocking progress nobody earned. An unverified pick
   is also **not recorded as a decision** — that was writing answers the learner never gave
   into the grading store. Only a *verified correct* answer returns `unlocks`.

[src/server/problemVersions.ts](apps/web/src/server/problemVersions.ts) caches
`ProblemVersion` rows in memory **with no invalidation**, which is sound only because a
version is immutable by construction. That is enforced by
[packages/db/publishProblem.mjs](packages/db/publishProblem.mjs), which **appends**:
identical content is a no-op, changed content mints the next version, publishes it, archives
its predecessor and moves `currentPublishedVersionId`. Old rows are never touched (seeding
used to rewrite v1's `data` in place — that silently changed what "correct" meant under
anyone mid-attempt). Content comparison is key-sorted, because `jsonb` does not preserve key
order and a plain `JSON.stringify` compare made every re-seed look like a change.

**The score is server-authoritative too, now.**
`POST /api/sessions/[id]/report` is the Result screen's only source: it replays this
session's own `TraceEvent` rows through `attemptsFromTrace()` → `scoreSession()`, so the
browser's grading store is **not consulted** and a fabricated store can no longer reach a
fake Report. Two halves, deliberately split — the **number** is engine arithmetic (auditable,
reproducible, cheap to re-run when rubric weights change) and the **words** are Claude
(positives, negatives, next steps). Consequences worth knowing:

- The score is persisted **before** Claude is called, one `GradingReport` row per session,
  upserted not appended — reloading the Result screen would otherwise double-count that
  learner in every average.
- No `ANTHROPIC_API_KEY` is a normal state: the route returns the score with
  `report: null, reason: 'llm_unconfigured'` and the screen omits the written sections. A
  missing narrative must never cost a learner their score.
- Reaching the report marks the session `COMPLETED`, which is what stops "reuse the session
  in progress" from handing a learner their previous attempt forever.
- Recorded decision keys and rubric item ids are **not** the same strings
  (`setting:classify:onError` vs `classify:settings.onError`); the translation lives in one
  place, `rubricItemId()`.

When adding a graded surface, route it through `/check` — do not reintroduce a local answer
comparison.

### The trace pipeline (M2) — how anything gets recorded
Everything the journey observes flows through one path, and the invariants are not
negotiable because the grading worker replays this data.

- **[src/lib/traceQueue.js](apps/web/src/lib/traceQueue.js)** — an outbound queue that sits
  between the screens and the network. Three rules: **never throw at the caller** (a dropped
  request must not break the Build stage; the worst outcome is a gap in the admin timeline),
  **never renumber** (each event gets a `clientSeq` once, for life), and **never grow without
  limit** (500 pending max). Consecutive failures back off exponentially to ~2 minutes — a
  batch the server will never accept was retried every 2s forever, and because each attempt
  takes a per-session database lock, the trace route **starved answer checking on the same
  session**. That is how a missing migration turned into learners seeing no verdicts.
- **[src/lib/useTrace.js](apps/web/src/lib/useTrace.js)** — creates the queue *before* the
  session exists (starting a session is a round trip; anything the learner does in that
  window would otherwise be lost) and mirrors unsent events into `sessionStorage` so a reload
  doesn't silently drop them.
- **[src/lib/TraceContext.jsx](apps/web/src/lib/TraceContext.jsx)** — `useTraceContext()`,
  because the Ask-AI drawer lives inside `TopBar` and the NDV is three levels deep. The
  default is a **no-op, not an error**: dev routes and tests must keep working.
- **`POST /api/sessions/[id]/events`** — batch ingest, idempotent on `(sessionId, clientSeq)`,
  validated by `clientTraceBatchSchema`. `seq` is allocated **here**, never by the client.
  `CLIENT_FORBIDDEN_TYPES` in [packages/trace/events.ts](packages/trace/events.ts) blocks the
  client from posting `decision` events at all — those are server-written by `/check`, and a
  learner who could forge them could forge their own grade.

**Both `/check` and `/events` write to one table with a unique `(sessionId, seq)`, and both
serialise on `pg_advisory_xact_lock(hashtext(sessionId))` inside the transaction.** Do not
add a third writer without taking the same lock. The NDV verifies every field of a node in
one `Promise.all`, so concurrent checks are the normal case, not an edge case — read-`MAX`-
then-insert produced duplicate `seq`, a 500, and a client that turned that 500 into a wrong
answer. The **attempt count** lives inside the same lock too: unsynchronised, every
concurrent check of one id counted zero priors and all claimed `firstTry`.

### Scoring — the rubric ([packages/engine/rubric.ts](packages/engine/rubric.ts))
Replaced "share of decisions correct on the first try", which had two defects: every decision
weighed the same (email-triage's 13 dropdowns outweighed its 6 node placements), and clicking
through a 3-option field until it went green cost nothing.

- **Attempt decay is tied to the option count.** On an N-option question the Nth attempt is
  forced by elimination, so it earns **zero**. 4 options → 100/66/33/0; 3 → 100/50/0;
  open-ended (expression, number, placement) → 100/50/0. Answering everything by elimination
  now scores 0%.
- **Weights** 30 dissection / 25 placement / 25 config / 20 edge-case. The even build split is
  deliberate — otherwise config carries 13/19ths of the Build score purely because the problem
  has more dropdowns.
- The **denominator is every decision the problem requires**, enumerated from problem data, so
  an abandoned session cannot look like a short perfect one. Empty buckets redistribute their
  weight rather than capping the maximum.
- **Probes are deliberately unscored** — the wrong placement already paid via decay, and
  scoring the probe would charge one mistake twice.
- `scoreBand()` gives the plain-English meaning of the number; `problemComplexity()` orders
  the catalogue easiest-first so "practise more" can name a real next challenge without an
  authored `difficulty` field to keep in sync.
- The grading prompt ([packages/llm/gradingPrompt.ts](packages/llm/gradingPrompt.ts)) **cannot
  emit a score** — the schema doesn't allow it. It's seeded as `RubricVersion` v1; editing the
  prompt and re-seeding appends v2, because a `GradingReport` points at the exact version that
  produced it.

### Admin — [/admin](apps/web/app/admin/page.tsx)
`AdminDashboard.jsx` (Overview · Cases · Completion · Learners · Admins) over
`/api/admin/analytics`, `/api/admin/learners/[id]/sessions` and `/api/admin/sessions/[id]`
(a read-only timeline of one attempt). Every number is computed in
[src/server/analytics.ts](apps/web/src/server/analytics.ts), **aggregated in SQL** — 60 demo
learners already produce ~6k trace events, so "fetch then count in JavaScript" would stop
working quietly and early. Nothing is derived in the browser, so no panel can disagree with
the database.

**The funnel is computed from `screen_transition` events, not `Session.currentScreen`** —
`currentScreen` is only written when a session completes, so trusting it reports every
unfinished learner as stuck on the first screen, which is exactly the number the funnel
exists to get right.

Admin routes each call their own `requireAdmin()` (401/403); the middleware matcher covers
`/admin/:path*` but authorisation is per-route. Granting admin by email writes an
`AdminAllowlist` row **and** promotes the account if it exists, so an email added before
signup is promoted when they sign up — "ask them to sign up first, then tell me again" is a
step everyone forgets.

### Canonical workflow model — `@judge/workflow`
The engine reasons in **real n8n's shape**, not React Flow's. Connections are keyed by
**source node name**; `main` is an array-per-output (so **a branch is an output index**,
not a handle string); sub-nodes attach over typed `ai_*` connectors (`ai_languageModel`,
`ai_memory`, `ai_tool`, `ai_outputParser`, …) rather than the grey main wire.

The editor still hands over a flat React Flow graph and problems are still *authored* that
way, so [`asWorkflow()`](packages/engine/asWorkflow.js) normalises at the boundary and
anything already canonical passes through. [`hasConnection()`](packages/engine/connectionMatches.js)
replaced the old `edgeMatches` — authored requirements keep the readable vocabulary
(`branch: 'bug_report'`, `targetHandle: 'ai_model'`) and the translation to output index /
connector name happens there. Basis: [docs/research/n8n-core-architecture.md](docs/research/n8n-core-architecture.md).

### Topology is data, not code
[packages/engine/simulate.js](packages/engine/simulate.js) resolves each node's role from
**catalog metadata** (`category`, `needsModel`, `branches`) → `trigger | ai | router |
action | passthrough` and walks the graph generically. Linear flows, routers whose
branches pass through several nodes, multiple actions, and alternative node *types* all
work as pure data. `validateProblem()` enforces only generic structure. Node **settings**
also feed the simulation — `onError` and `alwaysOutputData` change what a Run narrates.

**Still coupled:** a genuinely new *node type* needs an entry in
[packages/catalog/catalog.js](packages/catalog/catalog.js) plus a `nodeIcons.js` mapping.
That's by design.

### Packages
| Package | What |
|---|---|
| `@judge/engine` | Pure, unit-tested `(studentGraph, problem)` logic: `validateGraph` (gates the Run), `simulateCase`/`simulateAll`, `scoreEval`, `grading`, `asWorkflow`/`inferBranches`, `hasConnection`, `branchReach` (does every branch reach a reply), and the **rubric** (`scoreSession`, `attemptsFromTrace`, `phaseBreakdown`, `scoreBand`, `problemComplexity`, `enumerateItems`) |
| `@judge/workflow` | The canonical n8n workflow model (TS) + React Flow ⇄ n8n conversion |
| `@judge/catalog` | `NODE_CATALOG` — node vocabulary, params, sample I/O |
| `@judge/problems` | The four challenges as data + registry + tests (seed source). **Registry order is the catalogue order** — `order-desk` is deliberately last |
| `@judge/problem-schema` | zod `Problem` schema, `validateProblem()`, `toPublicProblem()`, `checkAnswer()`, `ruleList.ts` (rule/assignment lists) |
| `@judge/trace` | `TraceEvent` contract + `ingest.ts` — decision, screen/phase transition, ndv_open, graph_mutation, run_result, ask_ai_turn; `CLIENT_FORBIDDEN_TYPES` |
| `@judge/queue` | Queue interface + pg-boss driver + SQS stub |
| `@judge/llm` | Claude client + grading / authoring / ask-ai prompt builders |
| `@judge/db` | Prisma 6.x schema + migrations + client singleton + `publishProblem.mjs` and the seed scripts |
| `@judge/voice-scripts` | **Generated, committed.** One clip table per problem (`id → {text, file}`) + `VALID_CLIP_FILES`. The contract the generator, the server and the browser all read — see *Voice* |

`grading` is **pure functions**, not a Zustand store — the UI holds one store in React
state and appends. `recordDecision` keeps the *earliest* decision per id, so re-answering
never inflates the first-try signal that Understanding is scored on.

### Auth
Split across two files because middleware runs on the edge runtime and cannot load Prisma:
[auth.config.ts](apps/web/auth.config.ts) is the edge-safe half (JWT session, callbacks,
session claims `id`/`role`/`batchId`) and [auth.ts](apps/web/auth.ts) adds the
Prisma-backed Credentials provider. [middleware.ts](apps/web/middleware.ts) matches only
`/`, `/login`, `/signup`, `/admin/:path*`, `/api/problems/*` — **`/api/sessions/*` and
`/api/admin/*` are guarded inside the route handlers**, which also check that the session
belongs to the caller (writing into someone else's session would let one learner forge
another's trace, which is the input grading replays). Keep both halves in sync when adding a
claim.

### Screens — [apps/web/src/screens/](apps/web/src/screens/)
- `HomeScreen` — challenge cards from `problemList`.
- `DissectionScreen` (Understand) — Iris-narrated node-pick quiz.
- **`BuildStage` (Build) — the most complex file.** A storytelling board: one traveling
  Iris mascot (GSAP), a spotlight intro on the first `+`, guided `buildPhases`, wrong-pick
  handling (node placed with a red pulse, Iris travels to it, a draggable floating MCQ
  probes, then it's removed), the NDV as a centered modal, and the Run animation
  (test-case stepper, traveling sticky note ~2s/node, active node highlighted while the
  rest dim, all-pass confetti). Phase completion requires every phase node-type placed
  **and** configured — and for a router phase, every `branch` reaching a configured reply.
  That last check is [`branchReach.js`](packages/engine/branchReach.js), not an inline
  comparison: it resolves a terminal by catalog **category** (Slack, Notion, Calendar and
  Docs all end a run) and **walks through passthrough nodes** to find it. The old inline
  rule (`target.type === 'action'` on the immediate target) made "topology is data" false
  exactly where a learner would notice — a correct flow whose branch formats then sends, or
  replies on Slack, could pass its Run and still refuse to advance the phase.
- `EvalScreen` (Stress Testing) — read-only `flowSummary` strip + `evalQuestions`. Options
  are shuffled per (tab session, question key) and carry `originalIndex`, because
  `scoreEval` grades against the authored `correctIndex`.
- `ReportScreen` (Result) — renders what `POST /api/sessions/[id]/report` returns: total
  marks, the per-phase breakdown (Understand / Build / Stress Testing), then Claude's
  positives, negatives and next steps. It does **not** compute the score.
- `AdminDashboard` — see *Admin* above.

### n8n editor layer — [apps/web/src/n8n/](apps/web/src/n8n/)
Built from scratch (not n8n's assets), on `reactflow` v11.
- `N8nEditor` — `forwardRef` exposing `removeNode`/`fitAll`; `initialGraph` seeds a
  finished flow; a `displayNodes` memo injects per-node cue flags (`needsSetup`,
  `awaitingNext`, `hasModel`, `openBranches`, `running`, `dimmed`). `EditorContext`
  provides `openPicker`/`openNdv`/`branches`.
- `N8nFlowNode` / `N8nNodeView` — the **AI node is identified by `variantOf === 'ai'`** and
  **router branches come from `problem.branches`** via context. Neither is hardcoded.
- `Ndv` — INPUT | Parameters/Settings | OUTPUT. A node is configured in **two ordered
  stages**: Parameters must verify green before the Settings tab unlocks, and setup needs
  **both**. Verify calls the server per field/setting; per-field Iris explanations come
  from the response. Touching a setting must not reset the parameter stage (that was a
  real bug).
- `SettingsForm` + [nodeSettings.js](apps/web/src/n8n/nodeSettings.js) — `SETTINGS_SPEC` is
  shared across node types, matching n8n. Only what the problem grades
  (`nodeSetup[type].settings`) is editable; the rest render at real n8n defaults but
  locked.
- `FieldControl` — every field kind (see *Problem-as-data* above). Its `isCorrectValue` and
  `resourceValue` logic is mirrored server-side in `answerCheck.ts`; **keep the two in
  sync** (there are tests on both sides). `RuleListControl` handles `ruleList` /
  `assignmentList`.
- `NodePickerDrawer` — the node library drawer.

### Ask-AI
[app/api/ask-ai/route.ts](apps/web/app/api/ask-ai/route.ts) streams Claude on the cheap
tier, scoped to problem/screen/phase/node. It is **deliberately unhelpful about answers** —
asked "which node?", it teaches the concept and asks a guiding question. Intended. Without
`ANTHROPIC_API_KEY` it returns 503 and the UI degrades gracefully.

### Voice — Iris speaks (Deepgram Aura)
**Rendered on a laptop, uploaded once, served as files. Nothing renders at runtime and
nothing polls storage.** That is not a preference — the previous pipeline got Scaler's S3
credentials flagged after ~1500 calls in a short window, and was calling the TTS vendor during
learner sessions. Design: [docs/superpowers/specs/2026-07-30-voice-clip-pipeline-design.md](docs/superpowers/specs/2026-07-30-voice-clip-pipeline-design.md).

```bash
npm run voice:generate -- --dry-run   # what would change; spends and calls nothing
npm run voice:generate                # write the tables, render what is missing, locally
npm run voice:sync                    # upload to the bucket
```

- **The phrase book is the source, the table is the contract.**
  [voiceLines.js](apps/web/src/lib/voiceLines.js) holds every line, keyed by *moment*, with
  the writing rules in its header — they are the feature: short plain sentences, no em
  dashes, calm not cheerleading, **never reveal an answer the learner has not given**, and
  **do not read the screen**. `[bracketed]` text is an **authoring note only** — it was an ElevenLabs v3 audio
  tag, and Deepgram would read it aloud, so `captionFor` strips it and the generator
  renders exactly the caption. Audio and on-screen text are provably the same words. Per-problem overrides come from `problem.voice`.
  The generator turns that into [`@judge/voice-scripts`](packages/voice-scripts/) — one
  committed JSON table per problem, `id → { text, file }`. **Generated; never hand-edit.**
- **A clip's name has two halves and they work differently.** The **id**
  (`verify-pass--classify--classify-with-ai--v0`) is derived at runtime by the browser and
  identifies a *moment*. The **file** (`shared/verify-pass--a1b2c3d4.mp3`) identifies a
  *sentence* and is only ever **looked up**, never rebuilt. Deriving the file on both sides
  is exactly what broke before: the browser asked for names the generator had never
  written, so nearly every Build-stage line missed storage and fell into a live render.
  Many ids point at one file — that is the saving. **500 ids across four problems resolve
  to 307 recordings.**
- **The fingerprint is what makes `immutable` safe.** Clips are served with a one-year
  cache, so a stable name would leave a reworded line playing old audio in every learner's
  browser with no way to clear it. Rewording changes the hash, so it is simply a new URL.
  It also gives the route a free ETag and removes any need for a staleness manifest.
- **`shared/` holds lines no problem authored** — the decision is `clipScope` in
  voiceLines.js, the one place that judgement is made — so a line every problem says is
  rendered once, not once per problem.
- **The serving route cannot do three things**
  ([clip route](apps/web/app/api/voice/clip/[...path]/route.ts)): it cannot render (no
  vendor client exists in it); it cannot ask storage for a file that is not in a committed
  table, so a stray URL costs nothing; and it cannot ask twice, because
  [voiceCache.ts](apps/web/src/server/voiceCache.ts) keeps one copy per container on local
  disk and **collapses concurrent misses into a single fetch**. S3 reads are bounded by
  distinct clips played — a few hundred per container, then zero at any cohort size.
- **The browser gets its table with the problem**, in `GET /api/problems/[slug]` as
  `voiceClips` — already authenticated, no new endpoint. A line with no entry plays as a
  caption and makes **no request at all**.
- **[VoiceContext.jsx](apps/web/src/lib/VoiceContext.jsx) splits actions from state, and
  that split is not cosmetic.** `amplitude` updates every animation frame to drive the
  glow; with one context value every consumer re-rendered 60×/s and any effect depending on
  `voice` re-ran every frame — prefetch → state → new context → prefetch, the loop that
  took out the Understand screen. `useVoiceActions()` is memoised once and is safe in a
  dependency array; `useVoice()` adds the animating state. Both default to no-ops.
- Client rules in [voice.js](apps/web/src/lib/voice.js), all load-bearing: never throw at
  the caller; notify the mascot *first*, even when muted; **one line at a time, newest
  wins** (no queue — a line describes a moment that has passed, so being cut off is
  correct); tear down the Web Audio graph on every finish or a long session accumulates
  dead graphs until audio stops.
- `GET /api/voice/diagnostics` answers "why is narration not playing" **without a single
  storage call**, reporting config plus how many clips this container has served.

**Regenerate after** editing any line, changing a problem's nodes/questions/phases, or
changing `DEEPGRAM_TTS_MODEL` — an Aura model *is* the voice (`aura-2-helena-en` names a
speaker), so it is in every fingerprint and changing it re-renders the whole library. `renderedWith` in each table records what
produced it.


### Legacy inside apps/web/src
`nodes/*.jsx` (`ActionNode`, `ChatModelNode`, `ClassifyNode`, `ProcessNode`, `TriggerNode`,
`SwitchNode`, `NodeCard`, `nodeTypes.js`) have no importers — the live canvas is the
`n8n/` layer. **Exception:** `nodes/nodeIcons.js` is live and imported by eight files.

## Design conventions

Follows `design-source/syntax-design-system/SKILL.md`, styled inline via CSS custom
properties (`--brand-primary` `#0055FF`, `--surface-*`, `--fg-*`, `--border-*`,
`--status-*` — never raw hex). Zero `border-radius` on app chrome; 1px hairline borders;
no decorative gradients; Plus Jakarta Sans for UI, Clash Grotesk for headlines.
**Exception:** n8n node *bodies* (`N8nNodeView`) use rounded corners for n8n fidelity.
Primitives live in [apps/web/src/design-system/](apps/web/src/design-system/).

The user reviews this product **by looking at it** — screenshot after UI changes rather
than only asserting the code is right. `apps/web/scripts/shoot-*.mjs` drive system Chrome.

## Assessment conventions

Judge is a grader, so authoring mistakes are correctness bugs. `validateProblem()` lints
them and will reject:

- escape-hatch option text ("Added it by mistake") and probes with fewer than 3 options;
- a wrong option with no misconception code — it would never reach the report.

Probe copy follows three rules: **never name the correct node**, every option is a real
position someone would hold, and the correct answer describes what the *wrong* node
actually does. Probe selections are rendered neutral, not green/red — the placement is
already known to be wrong. Never park the correct option at index 0 as a habit; an audit
once found it there in 25/25 fields and 13/13 dissection items
(`apps/web/scripts/verify-option-balance.mjs` checks this).

**`nodeSetup` is keyed by node TYPE, not by node instance.** Using the same type twice in
one problem gives both instances the same NDV and grades one decision that may only make
sense for one of them, so a large problem should use each type once unless the same
configuration is genuinely right everywhere (`order-desk` repeats `action` because "send
the customer a reply" really is the same setup four times, and gives each other job its own
type).

## Deployment

Railway builds from the root [Dockerfile](Dockerfile), so the service **Root Directory
must be the repo root**. It runs `npm ci --include=dev` (lifecycle hooks run
`prisma generate` and sync the dotLottie wasm into `public/`), builds `@judge/web`, and
starts [scripts/start-production.sh](scripts/start-production.sh). Health check
`/api/health` (returns `{status, db}`). Needs `DATABASE_URL`, `AUTH_SECRET` and
`ANTHROPIC_API_KEY`; voice additionally needs `FEATURE_VOICE`, `ELEVENLABS_*` and (for the
`s3` backend) `AUDIO_S3_*`. Env template: [.env.example](.env.example) — its *Pre-rendered
voice clips* comments still describe the old content-addressed scheme; the live design is
slug paths plus a manifest (see *Voice*). The service deploys from
**`sudhanva/nextjs`, not `main`** — a push deploys, so a type error reaches production.

**`start-production.sh` runs `prisma migrate deploy` before serving, and that is not
optional.** A schema change and the code that needs it arrive in the same deploy, so they
have to be applied in the same step. A deploy without it shipped code needing a column the
database lacked: every trace batch 500'd, the client retried every 2s taking a per-session
lock each time, answer checking contended behind those failing transactions and timed out,
and the client — getting no verdict — fell back to calling every answer correct. Migrations
run at **start**, not during the build, because the build has no database.

Also remembered from Railway: **a variable name with a trailing newline is invisible in the
dashboard.** `ANTHROPIC_API_KEY` was stored as `'ANTHROPIC_API_KEY\n'`, so `process.env`
could not see it while the UI showed it as present. Catch it with
`railway variables --json` and print `repr()` of the keys.

## Gotchas

- **Never run `npm run build` while `next dev` is running.** They share `.next` and it
  corrupts the running server. Symptoms are alarming and misleading — every route 500s,
  smoke fails on all 19 screens, API calls return HTML. Kill dev, `rm -rf apps/web/.next`,
  restart.
- **Editing `packages/problems/*` does nothing until `npm run db:seed`.**
- **Beware `replace_all` edits in `.jsx`** — check enclosing function scope. A past
  `ReferenceError` came from replacing every `<TopBar activeStage="statement" />`,
  including inside inner components with no `problem` prop.
- **Next.js pollutes the root `tsconfig.json`** if `next dev` runs from the monorepo root.
  Revert it if it shows up in a diff.
- **Smoke has a coverage hole** — journey-start clicks the *first* "Try this judge" button
  regardless of `?problem=`, so `lead-triage` and `meeting-notes` Understand screens are
  untested.
- **Any new writer to `TraceEvent` must take the per-session advisory lock.** See *The trace
  pipeline*; skipping it reproduces the worst bug this project has had.
- **A missing `RubricVersion` silently stops scores being persisted** — run
  `npm run db:seed:rubric`. The Result screen still looks fine, so the symptom appears as
  empty admin analytics.
- **A stray `package-lock.json` one level above the repo** makes Next infer the wrong
  workspace root. Harmless in dev; can affect output file tracing on build.
- Full list of known issues lives in [STATUS.md](STATUS.md).

## Reference docs

**[docs/n8n-reference/00-how-n8n-actually-works.md](docs/n8n-reference/00-how-n8n-actually-works.md)
— read this before touching `@judge/workflow`, `@judge/catalog`, `simulate.js` or the NDV.** It
is n8n's real behaviour read out of n8n's own source (v2.33.0): the connection model, the node
contract, parameters and `typeVersion`, the NDV and the exact Settings tab, the execution and
error model, expressions, cluster nodes, and a per-node behaviour catalogue — plus a section
comparing all of it to Judge's model.

[STATUS.md](STATUS.md) · [docs/understanding.md](docs/understanding.md) (intent + locked
decisions) · [docs/plan-production-platform.md](docs/plan-production-platform.md) ·
[docs/plan-m1.5-fidelity-and-assessment.md](docs/plan-m1.5-fidelity-and-assessment.md) ·
[docs/adding-a-problem.md](docs/adding-a-problem.md) ·
[docs/research/](docs/research/) (how real n8n works from the docs — the basis for M1.5) ·
[docs/n8n-reference/](docs/n8n-reference/) · [docs/reference/](docs/reference/)
