# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Orientation

**Read [STATUS.md](STATUS.md) first** — it is the single source of truth for what's built,
what's next, and known issues. Keep it updated as work lands; do not start a new handoff
doc. [README.md](README.md) covers commands and layout. This file covers architecture,
conventions, and the things that will bite you.

"n8n Judge" is a simulator that teaches non-technical Scaler learners to build AI-agent
workflows in n8n **and grades them while they do it**. Per challenge the learner walks
**Home → Understand → Build → Stress Testing → Result**. Three challenges ship:
`email-triage`, `lead-triage` (routing) and `meeting-notes` (linear).

The repo root **is** the monorepo — `apps/web` plus nine `@judge/*` packages. It was
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
npm run typecheck  # tsc --noEmit over packages/
```

Single test file: `npx vitest run packages/engine/simulate.test.js`. Watch: `npx vitest`.

**The app needs Postgres and a signed-in user to do anything.** Problems are served from
the DB, and the journey is behind auth:

```bash
cp .env.example .env   # set AUTH_SECRET (openssl rand -base64 32); POSTGRES_PORT if 5432 is taken
npm run db:up          # local Postgres via docker-compose.yml
npm run db:migrate      # apply committed migrations
npm run db:seed        # programs, batches, and the three problems as v1 PUBLISHED
```

Then sign up at `/signup` with a seeded invite code — `AIML-DEMO`, `DSML-DEMO` or
`SE-DEMO`. Admin is a manual promotion:
`UPDATE "User" SET role='ADMIN' WHERE email='…';`

Other db scripts: `db:down`, `db:migrate:dev` (new migration from schema changes),
`db:generate`, `db:studio`.

**`npm run smoke` is not optional after touching components.** There are no component
tests, so a render-time bug passes both `npm test` and `next build`. Smoke drives system
Chrome via `playwright-core`; on macOS pass
`SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.

**Dev hash routes** (isolate one screen, all honor `?problem=<id>`): `#build`,
`#run-story`, `#eval-demo`, `#report-demo`, `#run-demo`, `#playground`. They run **without
a session**, so grading falls back to "unverified" rather than a server verdict — see
*Server-authoritative grading* below.

## Architecture

### Entry — the app mounts client-only
[apps/web/app/page.tsx](apps/web/app/page.tsx) → `JudgeClient` → `next/dynamic(…, { ssr: false })`
around [src/App.jsx](apps/web/src/App.jsx). The whole journey (reactflow canvas, GSAP
mascot, hash routing) is browser-only. `App.jsx` dispatches the dev hash routes, then
renders `Landing` (home ⇄ journey); `MainApp` is the four-screen state machine
(`STATEMENT → DASHBOARD → EVAL → REPORT`); `BuildPreview` is the same journey minus the
intro. `MainApp` creates a **Session** on mount and threads `sessionId` plus a `record`
callback through every screen — the first is how answers get graded, the second is the
local grading store.

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
`misconceptionLabels`, optional `simulation`.

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
2. **`POST /api/sessions`** creates an attempt pinned to a `ProblemVersion`;
   **`POST /api/sessions/[id]/check`** grades one answer via
   [`checkAnswer()`](packages/problem-schema/answerCheck.ts) — one function for all five
   kinds (`dissection | field | setting | probe | stress`) — **and records it as a
   `TraceEvent`**. The recording *is* the security property: a side-effect-free check
   endpoint is a free oracle, so guessing is allowed and scores like guessing, because
   `firstTry` is what Understanding is built on. An unknown id records
   `suspicious_check` and 400s. `seq` is server-assigned; the response carries only the
   verdict, the `why` for the chosen option, and (on a correct dissection pick) `unlocks`
   — the misconception code stays server-side.
3. **[src/lib/grader.js](apps/web/src/lib/grader.js)** is the only client entry point.
   `checkAnswer(sessionId, …)` returns `null` when there is no session (dev routes) or on
   a network failure, and callers must treat `null` as *unverified* — never as wrong.

[src/server/problemVersions.ts](apps/web/src/server/problemVersions.ts) caches
`ProblemVersion` rows in memory **with no invalidation**, which is sound only because a
version is immutable by construction: publishing creates a new row and moves a pointer. If
versions ever become editable in place, this breaks silently.

**Still client-side, deliberately:** the final score tally. A learner can fabricate the
grading store and reach a fake Report; that closes when the M3 worker tallies its own
recorded decisions. When adding a graded surface, route it through `/check` — do not
reintroduce a local answer comparison.

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
| `@judge/engine` | Pure, unit-tested `(studentGraph, problem)` logic: `validateGraph` (gates the Run), `simulateCase`/`simulateAll`, `scoreEval`, `grading`, `asWorkflow`/`inferBranches`, `hasConnection` |
| `@judge/workflow` | The canonical n8n workflow model (TS) + React Flow ⇄ n8n conversion |
| `@judge/catalog` | `NODE_CATALOG` — node vocabulary, params, sample I/O |
| `@judge/problems` | The three challenges as data + registry + tests (seed source) |
| `@judge/problem-schema` | zod `Problem` schema, `validateProblem()`, `toPublicProblem()`, `checkAnswer()` |
| `@judge/trace` | `TraceEvent` contract — decision, screen/phase transition, ndv_open, graph_mutation, run_result, ask_ai_turn |
| `@judge/queue` | Queue interface + pg-boss driver + SQS stub |
| `@judge/llm` | Claude client + grading / authoring / ask-ai prompt builders |
| `@judge/db` | Prisma 6.x schema + migration + client singleton |

`grading` is **pure functions**, not a Zustand store — the UI holds one store in React
state and appends. `recordDecision` keeps the *earliest* decision per id, so re-answering
never inflates the first-try signal that Understanding is scored on.

### Auth
Split across two files because middleware runs on the edge runtime and cannot load Prisma:
[auth.config.ts](apps/web/auth.config.ts) is the edge-safe half (JWT session, callbacks,
session claims `id`/`role`/`batchId`) and [auth.ts](apps/web/auth.ts) adds the
Prisma-backed Credentials provider. [middleware.ts](apps/web/middleware.ts) matches only
`/`, `/login`, `/signup`, `/api/problems/*` — **`/api/sessions/*` is guarded inside the
route handlers**, which also check that the session belongs to the caller. Keep both
halves in sync when adding a claim.

### Screens — [apps/web/src/screens/](apps/web/src/screens/)
- `HomeScreen` — challenge cards from `problemList`.
- `DissectionScreen` (Understand) — Iris-narrated node-pick quiz.
- **`BuildStage` (Build) — the most complex file.** A storytelling board: one traveling
  Iris mascot (GSAP), a spotlight intro on the first `+`, guided `buildPhases`, wrong-pick
  handling (node placed with a red pulse, Iris travels to it, a draggable floating MCQ
  probes, then it's removed), the NDV as a centered modal, and the Run animation
  (test-case stepper, traveling sticky note ~2s/node, active node highlighted while the
  rest dim, all-pass confetti). Phase completion requires every phase node-type placed
  **and** configured — and for a router phase, all `branches` wired to configured replies.
- `EvalScreen` (Stress Testing) — read-only `flowSummary` strip + `evalQuestions`. Options
  are shuffled per (tab session, question key) and carry `originalIndex`, because
  `scoreEval` grades against the authored `correctIndex`.
- `ReportScreen` (Result) — Understanding score, per-area breakdown, misconceptions.

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
- `FieldControl` — `select | text | number | boolean | expression`. Its `isCorrectValue`
  logic is mirrored server-side in `answerCheck.ts`; **keep the two in sync** (there are
  tests on both sides).
- `NodePickerDrawer` — the node library drawer.

### Ask-AI
[app/api/ask-ai/route.ts](apps/web/app/api/ask-ai/route.ts) streams Claude on the cheap
tier, scoped to problem/screen/phase/node. It is **deliberately unhelpful about answers** —
asked "which node?", it teaches the concept and asks a guiding question. Intended. Without
`ANTHROPIC_API_KEY` it returns 503 and the UI degrades gracefully.

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
once found it there in 25/25 fields and 13/13 dissection items.

## Deployment

Railway builds from the root [Dockerfile](Dockerfile), so the service **Root Directory
must be the repo root**. It runs `npm ci --include=dev` (lifecycle hooks run
`prisma generate` and sync the dotLottie wasm into `public/`), builds `@judge/web`, and
starts `next start -p ${PORT:-3000}`. Health check `/`. Needs `DATABASE_URL`,
`AUTH_SECRET` and `ANTHROPIC_API_KEY`. Env template: [.env.example](.env.example).
See STATUS.md for the current deployment state, which needs attention.

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
- Full list of known issues lives in [STATUS.md](STATUS.md).

## Reference docs

[STATUS.md](STATUS.md) · [docs/understanding.md](docs/understanding.md) (intent + locked
decisions) · [docs/plan-production-platform.md](docs/plan-production-platform.md) ·
[docs/plan-m1.5-fidelity-and-assessment.md](docs/plan-m1.5-fidelity-and-assessment.md) ·
[docs/adding-a-problem.md](docs/adding-a-problem.md) ·
[docs/research/](docs/research/) (how real n8n works — the basis for M1.5) ·
[docs/n8n-reference/](docs/n8n-reference/) · [docs/reference/](docs/reference/)
