# Adding a problem

Every challenge is **one plain data object**. The screens, engine, grading, and
mascot flow are generic — they read the object passed as the `problem` prop.
To add a challenge you create a folder and register it; you do **not** touch the
engine or components (as long as you reuse the canonical node shape — see limits).

## 1. Create the folder

```
app/src/data/problems/<your-id>/index.js        # export const <yourId> = { … }
app/src/data/problems/<your-id>/index.test.js    # optional spec (copy emailTriage's)
```

Use `app/src/data/problems/emailTriage/index.js` as the reference — copy it and
edit the values.

## 2. Register it

Add it to `app/src/data/problems/index.js`:

```js
import { yourProblem } from './your-id/index.js';
export const problems = {
  [emailTriage.id]: emailTriage,
  [yourProblem.id]: yourProblem,
};
```

Select it at runtime with `?problem=<your-id>` in the URL (e.g. `#build?problem=your-id`).
Without a param the `defaultProblem` (email-triage) loads.

## 3. The problem object — fields

| Field | What it drives |
|---|---|
| `id`, `title`, `statement` | Identity + the problem-statement panel |
| `dissection[]` | Understand-stage quiz (node-pick questions → drop onto canvas) |
| `nodePalette[]` | Draggable nodes; `isDistractor` marks wrong-answer nodes |
| `referenceGraph` | Canonical correct solution (also seeds the `#run-story` preview) |
| `branches[]` | The Switch's labelled outputs `{ id, label }` — ports, completion check, run |
| `flow` | Sequence rules: `start`, `next` (per source type), `branchNext`, `modelNext` |
| `flowSummary` | Read-only `{ steps:[{type,label}], caption }` shown atop Stress Testing |
| `buildPhases[]` | Guided build stages: `{ id, label, coach, nodeTypes, pickable }` |
| `nodeSetup{}` | Per-node NDV config: `credential`, `locked[]` (disabled), `fields[]` (editable selects with `options` → each `{ value, label, correct, why }`) |
| `nodeProbes{}` | Misconception MCQs fired when a wrong node is placed |
| `misconceptionLabels{}` | Human labels for misconception codes surfaced in the report |
| `sampleCases[]` | Emails the Run streams through (`branch` = the Switch handle each takes; `null` = intentional fall-through) |
| `simulation` *(optional)* | Overrides the run's narration lines (see `DEFAULT_NARRATION` in `engine/simulate.js`) |
| `testCases[]` | Structural checks `validateGraph` runs at the end |
| `evalQuestions[]` | Stress-testing MCQs `{ prompt, options, correctIndex, explanation }` |

## 4. What's generic vs. what has limits

**Generic (data-only):** every field above. Change any copy, node choice, field,
probe, branch, sample email, or question and the whole flow adapts.

**Reuses the canonical node vocabulary.** The build sequence and run walk are keyed
to the shared role types in `n8n/catalog.js`: a **trigger**, an **AI** node
(category `ai`, e.g. `classify`) that needs a Chat Model, an optional **parse**,
a **switch** with branches, and **action** replies. A new problem that reuses
these types (with different prompts/fields/branches) works with **zero engine
changes**.

**Needs engine work:** a genuinely different *shape* — new node types not in the
catalog, or a topology that isn't trigger → AI → parse → switch → actions —
requires adding to `n8n/catalog.js` and generalizing the walk in
`engine/simulate.js`. That's the one remaining coupling.

## 5. Verify

```
cd app
npm run test          # engine + data specs
npm run build
```

Preview routes (dev): `#build`, `#run-story` (auto-runs the finished flow),
`#eval-demo`, `#report-demo` — all honor `?problem=<id>`.
