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

---

## Giving the problem a voice

Iris narrates the journey, and by default she uses the shared phrase book in
[apps/web/src/lib/voiceLines.js](../apps/web/src/lib/voiceLines.js). That works with
no work from you: a problem with no `voice` block still speaks.

The defaults are the floor, though, not the target. A shared line cannot know what
your flow is FOR, so it has to say "now open it and set it up". An authored one can
say what the node actually decides:

```js
voice: {
  'node_placed:switch': ['[calm] This is where the kinds of email split apart.'],
  'answer_wrong:trigger': ['[thoughtful] Would {answer} start on its own? Nobody is pressing anything.'],
  phase_complete: ['[excited] That is the routing done.'],
}
```

Keys are `moment` or `moment:key`, resolved most-specific-first. The `key` is a
question id for the answer moments, a node type for the node moments, and a phase
id for `phase_complete`. Moments are listed in `LINES`.

**The rules, which `validateProblem()` checks:**

- **No em dashes.** They do not read aloud.
- **Under about 22 words**, which is roughly seven seconds spoken. Longer and the
  line is still talking after the moment it described has passed.
- **Never reveal an answer the learner has not given.** Naming what they just chose
  is good (`{answer}`, `{node}`); naming the answer to a question still open is not.
  Anything that plays before a decision must give nothing away.
- **Do not read the screen.** If the words are already on the page, saying them
  competes with reading instead of adding to it.
- **Open with a delivery tag** (`[warm]`, `[calm]`, `[thoughtful]`, `[excited]`).
  These are ElevenLabs v3 direction and are not spoken.

Variables must come from a **closed set** — a node label, an option label — because
every possible line is pre-rendered ahead of time
([voiceCatalogue.js](../apps/web/src/lib/voiceCatalogue.js)). A variable that could
hold anything cannot be pre-rendered, so it would be slow on every play.

After authoring, render the clips:

```bash
DRY_RUN=1 npm run voice:generate -- your-problem   # what it would cost, spends nothing
npm run voice:generate -- your-problem
```
