# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Judge" is a standalone, frontend-only React prototype of a node-based workflow **assessment** tool. A learner is given an automation problem (an n8n-style "Email Triage" flow), builds the workflow by dragging nodes onto a React Flow canvas and wiring them, runs it against sample cases, then answers concept-check questions. There is **no backend, auth, or persistence** — the whole thing is a single-session state machine in the browser.

The actual app lives in [app/](app/). The repo root also holds source material that was copied into the app: [syntax-design-system/](syntax-design-system/) (the "Syntax by Scaler" design system) and [iris-mascot-kit/](iris-mascot-kit/) (the Lottie mascot). [class_08_building_agents_n8n_zapier.py](class_08_building_agents_n8n_zapier.py) is the course curriculum the one problem is grounded in.

## Commands

All commands run from the [app/](app/) directory (not the repo root):

```bash
cd app
npm install
npm run dev       # Vite dev server
npm run build     # production build to app/dist
npm run test      # vitest run (all unit tests, one-shot)
```

Run a single test file: `npx vitest run src/engine/validateGraph.test.js`
Watch mode: `npx vitest` (omit `run`).

Only the pure engine/data logic is unit-tested (`*.test.js` colocated in `src/engine/` and `src/data/problems/`). React components are not tested.

## Architecture

### Screen state machine
[app/src/App.jsx](app/src/App.jsx) is the entire router: a `useState` cycles through four screens — `STATEMENT → DASHBOARD → EVAL → REPORT`. Each screen is a component in [app/src/screens/](app/src/screens/) and receives the problem plus callbacks that advance the machine and pass forward `runResult` / `evalOutcome`. The Dashboard only advances to Eval once the built graph passes all test cases.

### Problem-as-data (the key pattern)
Everything specific to a challenge lives in **one plain data object** — [app/src/data/problems/emailTriage.js](app/src/data/problems/emailTriage.js) — and is threaded through the whole app as the `problem` prop. To add or change a challenge you edit this object, not the engine or UI. It defines:
- `nodePalette` — the draggable nodes, each tagged with a `category` and an `isDistractor` flag (distractors are wrong-answer nodes that must never *break* validation, only be rejected on drop).
- `referenceGraph` — the canonical correct solution (nodes + edges).
- `testCases` — **structural** checks only (required node types, required edges, branch handles). No data execution. Consumed by `validateGraph`.
- `buildSteps` — an ordered, gated build sequence; the palette only unlocks the current step's `categories`.
- `connectionGuide` — the wiring checklist shown after all nodes are placed. Reuses the same edge-match shape as `testCases`.
- `sampleCases` — emails the Run simulation streams through the graph; `branch` is the Switch handle each should take (`null` = matches nothing, an intentional gap).
- `evalQuestions` — MCQs with `correctIndex` + `explanation`.

### Engine (pure functions, all unit-tested) — [app/src/engine/](app/src/engine/)
These take `(studentGraph, problem)` and are the assessment brain. `studentGraph` is a normalized `{ nodes, edges }` derived from React Flow state (see `studentGraph` useMemo in DashboardScreen).
- `validateGraph.js` — runs `testCases` against the built graph; returns `{ allPassed, results }`. This gates progression to Eval.
- `checkDrop.js` — decides if a node may be dropped given the current build step (right category? not out-of-step? distractor?) and computes `isStepComplete` (a node counts only once it's been placed **and** opened — `data.seen`).
- `connections.js` — which `connectionGuide` links are wired yet, for the checklist UI.
- `simulate.js` — walks each `sampleCase` through the learner's *actual* wiring and emits a narrative step list, surfacing gaps (no model connected, unwired branch, unmatched category) as dead-ends rather than pass/fail. `success` = every categorized email was delivered.
- `evalScore.js` — scores `evalQuestions` answers.

Note: `validateGraph.js` and `connections.js` each carry a near-identical `edgeMatches` helper matching edges by `sourceType`/`sourceCategory`/`targetType`/`branch` (→ `sourceHandle`)/`targetHandle`. Keep them in sync when changing edge-match semantics.

### Canvas — [app/src/screens/DashboardScreen.jsx](app/src/screens/DashboardScreen.jsx)
The most complex file. Uses `reactflow` v11 with custom node components registered in [app/src/nodes/nodeTypes.js](app/src/nodes/nodeTypes.js) (note several palette types map to the same shared component). Handles drag-drop placement, the step-gated palette, the AI-model sub-node connection (the dashed `ai_model` target handle on Classify — a distinct edge style), the Run simulation animation (timed frames decorating nodes/edges), the mascot coach, and the guided [Tour](app/src/components/Tour.jsx). Mascot lives in [app/src/mascot/](app/src/mascot/) (Lottie via `@lottiefiles/dotlottie-react`).

## Design system conventions (non-negotiable)

Styling follows `syntax-design-system/SKILL.md`. When writing any UI:
- **Zero `border-radius`** anywhere — everything is square-cornered.
- Primary blue is `#0055FF`, referenced as `var(--brand-primary)`. Use the CSS custom properties from `colors_and_type.css` (`--surface-*`, `--fg-*`, `--border-*`, `--status-*`), not raw hex, for new UI.
- Hairline **1px** borders on cards; **no decorative gradients**.
- Plus Jakarta Sans for UI text; Clash Grotesk is reserved for headline-scale type only.

Styles are inline-style-heavy in components, reading from these CSS variables. Reusable primitives (`Button`, `Card`, `Badge`, `Alert`, `RadioGroup`, `Switch`) live in [app/src/design-system/](app/src/design-system/) and were copied from the root `syntax-design-system/`.

## Reference docs

[docs/superpowers/](docs/superpowers/) holds the design spec and implementation plan this prototype was built from — useful when extending the app to understand the intended scope and the "one problem, structural-checks-only, no backend" constraints.
