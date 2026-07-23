# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Judge" is a standalone, **frontend-only** React prototype where a learner builds an n8n-style AI-agent workflow instead of writing code, runs it against sample cases, then answers concept-check questions. There is **no backend, auth, or persistence** — the whole thing is a single-session state machine in the browser.

It is **multi-problem**: a home page lists challenges, and each launches its own journey — **Home → Understand → Build → Stress Testing → Result**. Two problems ship (`email-triage`, `lead-triage`); adding more is a data-only task (see "Problem-as-data" below).

The app lives in [app/](app/). The repo root also holds source material copied into the app: [syntax-design-system/](syntax-design-system/) and [iris-mascot-kit/](iris-mascot-kit/) (the Lottie mascot, "Iris"). [class_08_building_agents_n8n_zapier.py](class_08_building_agents_n8n_zapier.py) is the course the first problem is grounded in.

## Commands

All app commands run from [app/](app/), not the repo root:

```bash
cd app
npm install
npm run dev       # Vite dev server (localhost:5173)
npm run build     # production build to app/dist
npm run test      # vitest run (all unit tests, one-shot)
```

- Single test file: `npx vitest run src/engine/validateGraph.test.js`
- Watch mode: `npx vitest` (omit `run`)
- Only the pure engine/data logic is unit-tested (`*.test.js` colocated in `src/engine/` and `src/data/problems/*/`). React components are not tested.

**Visual verification** (there is no Playwright MCP): `app/scripts/shoot-*.mjs` drive **system Chrome** via `playwright-core` (`channel: 'chrome'`, headless) against the dev server, screenshotting the dev hash routes below.

**Dev routes** (isolate a screen; all honor `?problem=<id>`): `#build`, `#run-story` (auto-runs a finished flow), `#eval-demo`, `#report-demo`, `#run-demo`, `#playground`.

## Architecture

### Entry & routing — [app/src/App.jsx](app/src/App.jsx)
`resolveProblem()` reads `?problem=<id>` (default `email-triage`). The default route renders `Landing` (home ⇄ journey); `MainApp` is the real four-screen state machine (`STATEMENT → DASHBOARD → EVAL → REPORT`); `BuildPreview` is the same journey minus the intro, used by dev routes. A grading store is threaded through every screen via a `record` callback.

### Problem-as-data + registry (the key pattern)
Everything specific to a challenge lives in **one plain data object** — `app/src/data/problems/<id>/index.js` — threaded through the app as the `problem` prop. Register it in [app/src/data/problems/index.js](app/src/data/problems/index.js) (`problems` map, `getProblem`, `resolveProblem`, `defaultProblem`, `problemList`). To add or change a challenge you edit data, **not** the engine or UI — see [docs/adding-a-problem.md](docs/adding-a-problem.md) for the full field reference.

Key fields: `branches` (Switch outputs), `flow` (sequence rules: `start`/`next`/`branchNext`/`modelNext`), `flowSummary` (Stress-Testing strip), `buildPhases` (guided build sub-stages), `nodeSetup` (per-node NDV: `credential` + disabled `locked[]` + editable `fields[]` whose `options` carry `{value,label,correct,why}`), `nodeProbes` (misconception MCQs), `sampleCases` (Run inputs; `branch:null` = intentional fall-through), `dissection`, `testCases`, `evalQuestions`, and optional `simulation` (run-narration overrides).

**What's generic vs. coupled:** all of the above is data-only, *provided the problem reuses the canonical node vocabulary* in [app/src/n8n/catalog.js](app/src/n8n/catalog.js) — a trigger, an **AI node** (category `ai`, needs a Chat Model), an optional parse, a **switch** with branches, and **action** replies. A genuinely different node vocabulary/topology requires editing `catalog.js` and the walk in `engine/simulate.js` — the one remaining coupling.

### The journey screens — [app/src/screens/](app/src/screens/)
- `HomeScreen` — challenge cards from `problemList`.
- `DissectionScreen` (Understand) — Iris-narrated node-pick quiz that drops nodes onto a canvas.
- **`BuildStage` (Build) — the most complex file.** A "storytelling board": one traveling Iris mascot (GSAP), a spotlight intro on the first `+`, guided `buildPhases`, wrong-pick handling (node is placed with a red pulse, Iris travels to it, a **draggable floating MCQ** probes, then it's removed), the **NDV** opened as a centered modal, and the **Run animation** (numbered test-case stepper below the nav; a traveling sticky note narrating each step ~2s/node; the active node highlighted while the rest dim; an all-pass confetti celebration). Phase completion requires all phase node-types placed **and** configured, and for the Switch phase, **all `branches` wired to configured replies**.
- `EvalScreen` (Stress Testing) — a read-only `flowSummary` strip + `evalQuestions`, one at a time.
- `ReportScreen` (Result) — an Understanding score (first-try-correct), per-area breakdown, surfaced misconceptions.

### n8n editor layer — [app/src/n8n/](app/src/n8n/)
Built from scratch (not n8n's assets), on `reactflow` v11.
- `N8nEditor` — `forwardRef` exposing an imperative handle (`removeNode`, `fitAll`); `initialGraph` seeds a finished flow (used by `#run-story`); a `displayNodes` memo injects per-node cue flags (`needsSetup`, `awaitingNext`, `hasModel`, `openBranches`, `running`, `dimmed`) that drive pulses/highlights. `EditorContext` provides `openPicker`/`openNdv`/`branches`.
- `N8nFlowNode` / `N8nNodeView` — the flow node + its pure visual (`variantOf(type)` classifies trigger/ai/model/action; props `pulse`/`running`/`errorPulse`). The **AI node is identified by `variantOf === 'ai'`** and **Switch branches come from `problem.branches`** via context — neither is hardcoded.
- `Ndv` — the node-detail modal: real **field editing** (highlighted required fields + disabled `locked` context fields), a **Verify** step marking each field green/red, per-field Iris chat-bubble explanations; closing = completing once all green (no separate "Complete" button). It is **not** an MCQ.
- `catalog.js` (node library), `NodePickerDrawer`.

### Engine (pure functions, unit-tested) — [app/src/engine/](app/src/engine/)
Take `(studentGraph, problem)`. `validateGraph` (structural test cases; gates the Run), `checkDrop`, `connections`, `simulate` (walks each `sampleCase` through the actual wiring → narrative steps carrying `nodeId`s; narration is templated, with `problem.simulation` overriding `DEFAULT_NARRATION`), `evalScore`, `grading` (`createStore`/`recordDecision`/`understandingScore`/`countsByKind`/`misconceptionsHit`). `validateGraph.js` and `connections.js` each carry a near-identical `edgeMatches` helper — keep them in sync.

### Legacy — do not edit for the current flow
A pre-rewrite dashboard still sits in the tree but is unused: `screens/DashboardScreen.jsx`, `screens/ProblemStatementScreen.jsx`, and the hand-rolled node components in `app/src/nodes/*.jsx` (`ActionNode`, `ChatModelNode`, `ClassifyNode`, `ProcessNode`, `TriggerNode`, `SwitchNode`, `NodeCard`, `nodeTypes.js`). The live canvas is the `n8n/` layer. **Exception:** `nodes/nodeIcons.js` (icons/colors/`typeCategory`) is live and shared.

## Design system conventions

Follows `syntax-design-system/SKILL.md`, styled inline via CSS custom properties (`--brand-primary` `#0055FF`, `--surface-*`, `--fg-*`, `--border-*`, `--status-*` — not raw hex). Zero `border-radius` on app chrome; 1px hairline borders; no decorative gradients; Plus Jakarta Sans for UI, Clash Grotesk for headlines. **Exception:** the n8n node *bodies* (`N8nNodeView`) intentionally use rounded corners for n8n fidelity. Reusable primitives (`Button`, `Card`, `Badge`, `Alert`, `RadioGroup`, `Switch`) live in [app/src/design-system/](app/src/design-system/).

## Deployment

Deployed on Railway via a **root [Dockerfile](Dockerfile)** (the repo root is not the app root): it builds `app/` and serves the bundle with `vite preview` bound to `$PORT` (`preview.allowedHosts` is set in `app/vite.config.js`). Keep the Railway service **Root Directory at the repo root** so the Dockerfile is used. `app/railway.json` is a Nixpacks fallback for when Root Directory is set to `app`.

## Reference docs

[docs/adding-a-problem.md](docs/adding-a-problem.md) — how to add a challenge as data. [docs/](docs/) also holds the original design/spec material.
