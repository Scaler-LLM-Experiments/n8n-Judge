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

The repo root **is** the monorepo — `apps/web` plus eight `@judge/*` packages. It was
restructured on 2026-07-27; anything referring to an `innate/` folder or an `app/` Vite
prototype is out of date, and both are gone.

## Commands

Node 20+, everything from the repo root.

```bash
npm install
npm run dev        # Next.js dev → http://localhost:3000
npm run build      # production build
npm test           # vitest — engine/schema/problems
npm run smoke      # full-journey runtime check (needs dev running)
npm run typecheck  # tsc --noEmit over packages/
```

Single test file: `npx vitest run packages/engine/simulate.test.js`. Watch: `npx vitest`.

**`npm run smoke` is not optional after touching components.** There are no component
tests, so a render-time bug passes both `npm test` and `next build`. Smoke drives system
Chrome via `playwright-core`; on macOS pass
`SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.

**Dev hash routes** (isolate one screen, all honor `?problem=<id>`): `#build`,
`#run-story`, `#eval-demo`, `#report-demo`, `#run-demo`, `#playground`.

## Architecture

### Entry — the app mounts client-only
[apps/web/app/page.tsx](apps/web/app/page.tsx) → `JudgeClient` → `next/dynamic(…, { ssr: false })`
around [src/App.jsx](apps/web/src/App.jsx). The whole journey (reactflow canvas, GSAP
mascot, hash routing) is browser-only. `App.jsx` dispatches the dev hash routes, then
renders `Landing` (home ⇄ journey); `MainApp` is the four-screen state machine
(`STATEMENT → DASHBOARD → EVAL → REPORT`); `BuildPreview` is the same journey minus the
intro. A grading store is threaded through every screen via a `record` callback.

### Port, don't rewrite
Prototype `.jsx` moved in untouched. **All new code is TypeScript.** Workspace packages
ship raw sources and are listed in `transpilePackages` in
[next.config.mjs](apps/web/next.config.mjs) — a new `@judge/*` package must be added there.

### Problem-as-data + registry (the key pattern)
Everything specific to a challenge is **one plain data object** in
`packages/problems/<id>/index.js`, registered in
[packages/problems/index.js](packages/problems/index.js) and threaded through the app as
the `problem` prop. To add or change a challenge you edit data, **not** the engine or UI —
see [docs/adding-a-problem.md](docs/adding-a-problem.md).

Key fields: `branches`, `flow` (`start`/`next`/`branchNext`/`modelNext` — the last two
optional), `flowSummary`, `buildPhases`, `nodeSetup` (per-node NDV: `credential` +
disabled `locked[]` + editable `fields[]` whose `options` carry `{value,label,correct,why}`),
`nodeProbes`, `sampleCases` (`branch:null` = intentional fall-through), `dissection`,
`nodePalette`, `referenceGraph`, `testCases`, `evalQuestions`, `misconceptionLabels`,
optional `simulation`.

[src/data/problems/index.js](apps/web/src/data/problems/index.js) is a thin client shim
over `@judge/problems` adding `resolveProblem()` (reads `?problem=<id>`). Once problems
are served from the DB (M1) the journey fetches `/api/problems/<slug>` instead.

### Topology is data, not code
[packages/engine/simulate.js](packages/engine/simulate.js) resolves each node's role from
**catalog metadata** (`category`, `needsModel`, `branches`) → `trigger | ai | router |
action | passthrough` and walks the graph generically. Linear flows, routers whose
branches pass through several nodes, multiple actions, and alternative node *types* all
work as pure data. `validateProblem()` enforces only generic structure.

**Still coupled:** a genuinely new *node type* needs an entry in
[packages/catalog/catalog.js](packages/catalog/catalog.js) plus a `nodeIcons.js` mapping.
That's by design.

### Packages
| Package | What |
|---|---|
| `@judge/engine` | Pure, unit-tested `(studentGraph, problem)` logic: `validateGraph` (gates the Run), `simulateCase`/`simulateAll`, `scoreEval`, `grading`, shared `edgeMatches` |
| `@judge/catalog` | `NODE_CATALOG` — node vocabulary, params, sample I/O |
| `@judge/problems` | The three challenges as data + registry + tests |
| `@judge/problem-schema` | zod `Problem` schema + `validateProblem()` |
| `@judge/trace` | `TraceEvent` contract — decision, screen/phase transition, ndv_open, graph_mutation, run_result, ask_ai_turn |
| `@judge/queue` | Queue interface + pg-boss driver + SQS stub |
| `@judge/llm` | Claude client + grading / authoring / ask-ai prompt builders |
| `@judge/db` | Prisma 6.x schema (13 tables, 7 enums) + migration + client singleton |

`grading` is **pure functions**, not a Zustand store — the UI holds one store in React
state and appends. `recordDecision` keeps the *earliest* decision per id, so re-answering
never inflates the first-try signal that Understanding is scored on.

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
- `EvalScreen` (Stress Testing) — read-only `flowSummary` strip + `evalQuestions`.
- `ReportScreen` (Result) — Understanding score, per-area breakdown, misconceptions.

### n8n editor layer — [apps/web/src/n8n/](apps/web/src/n8n/)
Built from scratch (not n8n's assets), on `reactflow` v11.
- `N8nEditor` — `forwardRef` exposing `removeNode`/`fitAll`; `initialGraph` seeds a
  finished flow; a `displayNodes` memo injects per-node cue flags (`needsSetup`,
  `awaitingNext`, `hasModel`, `openBranches`, `running`, `dimmed`). `EditorContext`
  provides `openPicker`/`openNdv`/`branches`.
- `N8nFlowNode` / `N8nNodeView` — the **AI node is identified by `variantOf === 'ai'`** and
  **router branches come from `problem.branches`** via context. Neither is hardcoded.
- `Ndv` — field editing with a Verify step marking each field green/red and per-field Iris
  explanations. Closing completes it once all green. **The Settings tab is currently
  hard-disabled** — M1.5 §B5 enables it.
- `NodePickerDrawer` — the node library drawer.

### Ask-AI
[app/api/ask-ai/route.ts](apps/web/app/api/ask-ai/route.ts) streams Claude on the cheap
tier, scoped to problem/screen/phase/node. It is **deliberately unhelpful about answers** —
asked "which node?", it teaches the concept and asks a guiding question. Intended.

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

## Deployment

Railway builds from the root [Dockerfile](Dockerfile), so the service **Root Directory
must be the repo root**. It runs `npm ci --include=dev` (lifecycle hooks run
`prisma generate` and sync the dotLottie wasm into `public/`), builds `@judge/web`, and
starts `next start -p ${PORT:-3000}`. Health check `/`. Env template:
[.env.example](.env.example).

## Gotchas

- **Beware `replace_all` edits in `.jsx`** — check enclosing function scope. See STATUS.md.
- **Next.js pollutes the root `tsconfig.json`** if `next dev` runs from the monorepo root.
  Revert it if it shows up in a diff.
- Full list of known issues lives in [STATUS.md](STATUS.md).

## Reference docs

[STATUS.md](STATUS.md) · [docs/understanding.md](docs/understanding.md) (intent + locked
decisions) · [docs/plan-production-platform.md](docs/plan-production-platform.md) ·
[docs/plan-m1.5-fidelity-and-assessment.md](docs/plan-m1.5-fidelity-and-assessment.md) ·
[docs/adding-a-problem.md](docs/adding-a-problem.md) ·
[docs/research/](docs/research/) (how real n8n works — the basis for M1.5) ·
[docs/n8n-reference/](docs/n8n-reference/) · [docs/reference/](docs/reference/)
