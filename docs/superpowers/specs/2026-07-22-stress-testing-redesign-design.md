# Stress Testing screen redesign

## Context

The Judge prototype's four stages — Understand (`DissectionScreen`), Build Node (`BuildStage`), Stress Testing (`EvalScreen`), Result (`ReportScreen`) — are meant to feel like one continuous, mascot-guided experience. Understand and Build Node deliver on that: Iris reacts, GSAP eases each transition, and every question is staged one at a time against a live visual (a node view, or an animated run of the learner's own graph).

Stress Testing does not. `EvalScreen` is a static, Card-wrapped form: both `evalQuestions` are shown at once, answered via plain `RadioGroup`s, with no mascot, no motion, and no visual tied to the question. It was confirmed live in-browser (full run-through: Understand 5/5 → Build Node fully wired and verified → Stress Testing submitted 2/2 → Result 100%) that this screen is exactly as flat as the source suggested.

This spec covers rebuilding Stress Testing to match the rest of the app's interaction language, with node-based visuals driving each question rather than a plain text form. The Report screen redesign is a separate, follow-on spec that will consume the richer decision data this one introduces.

## Goal

Rebuild `EvalScreen` so each eval question is presented one at a time, mascot-narrated, with a **node-based visual** in place of plain text — either a live replay of that question's scenario running through the learner's own built graph, or (when no scenario applies) a static node-flow diagram illustrating the concept in question.

## Screen flow

No separate greet/intro phase — Stress Testing is reached straight from Build Node's "Move to Stress Testing" action, so context is already established. The screen is a single quiz view structured like `DissectionScreen`'s `QuizBody`:

- Centered column, max-width ~620px.
- Kicker: "Question X of N".
- Prompt (existing `q.prompt` copy, unchanged).
- Lettered option list (A, B, C, D) — plain text options, no icon chip (unlike Understand's node-type options, these are full sentences).
- Node-based visual panel below the options (see "Node-based visual" section).
- Iris mascot parked bottom-left, reacting to each pick (`correct` / `shake-no` clips), same positioning as `DissectionScreen`.

## Answering behavior

This is assessment, not teaching — unlike Understand's lock-until-correct loop, Stress Testing stays **single-attempt per question**:

1. Learner picks an option.
2. Mascot reacts immediately (`correct` or `shake-no`).
3. An explanation panel appears immediately below the options, in the existing tone/copy pattern from `EvalScreen` today: "Correct" or `Not quite — the answer is "<correct label>"`, followed by the question's `explanation` text.
4. The node-based visual reveals/animates once the explanation appears.
5. An explicit **Continue** button appears once the visual has finished revealing (not an auto-advance timer — explanation and visual read-time varies per question, and forcing a timed advance would rush the moment this redesign is meant to add weight to).
6. On the last question, the Continue button instead reads **"See Report"** and advances to `SCREEN.REPORT`.

No retry loop: whatever is picked first is graded (`firstTry: true` always, same as today), and the learner cannot change their answer once picked — consistent with current `EvalScreen` behavior of one submission per question.

## Node-based visual

This is the core upgrade. Two modes, chosen per-question by a new optional data field:

### Mode A — Live replay (self-referential)

When a question maps to one of `problem.sampleCases` (matched via a new `caseId` field on the `evalQuestions` entry — see "Data model changes"), the visual panel shows that exact case animating through **the learner's own built graph**, reusing the step-reveal logic already built for `RunPanel` in `BuildStage.jsx` (extracted into a shared, smaller component — see "Component reuse").

Concretely, for `general-question-gap` (mapped to the `question` sample case, `branch: null`): the panel replays the case — trigger fires, Classify reads it as `QUESTION · LOW`, Parse Result runs, then the Switch step is shown as a dead end ("Switch: 'QUESTION' matches none of the 3 branches — this email goes unanswered") — using `simulateCase(studentGraph, sampleCase)` from `engine/simulate.js` against the graph the learner actually built, not a canned example. This ties the question directly to their own work, not a generic illustration.

Visual container: reuses the existing dotted-grid canvas style from `DissectionScreen`'s `QuizBody` (`background-image: radial-gradient(...)`), with a small "Replaying your build" label and a live pulse indicator while steps reveal.

### Mode B — Conceptual fallback (static diagram)

When a question has no matching `sampleCase` — e.g. `why-fixed-path`, which is a design-reasoning question, not a behavior-of-the-graph question — the panel instead shows the existing `ConceptFlow` component (already used in `DissectionScreen`'s `ProblemBeat` as "the shape of it"): a static horizontal node-icon flow (Trigger → Classify → Parse → Switch → Action) illustrating the fixed path being asked about. This is a deliberate, thematically-apt reuse: the question is literally "why is the path fixed," and the diagram shows the fixed path.

No third fallback is needed for this problem set (`emailTriage` has exactly 2 eval questions, one of each mode), but the pattern generalizes: any future eval question either references a case or falls back to the concept diagram.

## Data model changes

`app/src/data/problems/emailTriage.js` — `evalQuestions` entries gain an optional field:

```js
{
  id: 'general-question-gap',
  caseId: 'question', // NEW — matches sampleCases[].id; omit for conceptual questions
  prompt: '...',
  options: [...],
  correctIndex: 1,
  explanation: '...',
}
```

`why-fixed-path` gets no `caseId` (falls back to Mode B).

## Component reuse

- **Step-reveal logic**: `RunPanel`'s timed-reveal `useEffect` (frames array + `setTimeout` cascade, `STEP_ICON` map) in `BuildStage.jsx` is extracted into a small shared function/hook (e.g. `useStepReveal(steps)`) usable by both `RunPanel` and the new Stress Testing visual, rather than duplicated. This is a targeted refactor — `RunPanel` currently inlines this logic for its own multi-case sequencing; the new component only ever replays one case at a time, so the extracted piece is the single-case reveal timer, not the multi-case orchestration.
- **`ConceptFlow`**: used as-is, no changes needed (already accepts a `direction` prop).
- **`simulateCase`**: used as-is from `engine/simulate.js`.
- **Mascot**: `MascotPlayer`, positioned and driven the same way as `DissectionScreen`.

## Data plumbing (App.jsx / BuildStage handoff)

Today, `BuildStage`'s `onComplete` callback only forwards `run.val` (the `validateGraph` result) to `App.jsx`, which stores it as `runResult`. The learner's actual graph (`studentGraph`) is discarded once Build Node finishes.

For Mode A replay to work, `EvalScreen` needs access to that graph to call `simulateCase(studentGraph, sampleCase)` for whichever question is active. Change:

- `BuildStage`'s `onComplete` passes the full `studentGraph` alongside the existing validation result (or `App.jsx` captures it separately in a new `builtGraph` state) via `onComplete({ validation: run.val, graph: studentGraph })`.
- `App.jsx` stores `builtGraph` in state and passes it as a new `graph` prop to `EvalScreen`.
- `EvalScreen` calls `simulateCase(graph, sampleCase)` per Mode-A question, where `sampleCase` is looked up from `problem.sampleCases` by the question's `caseId`.

This is additive — `runResult`/`validateGraph` usage elsewhere (the Report screen's test-case list) is unaffected.

## Decision data (forward-compat for the Report redesign)

The recorded decision for each eval question is extended with two new fields, so the (separate, upcoming) Report redesign can show "you picked X, the correct answer was Y" without re-deriving it:

```js
onDecision({
  id: `stress:${q.id}`,
  kind: 'stress',
  label: q.prompt,
  correct: pickedIndex === q.correctIndex,
  firstTry: true,
  chosenLabel: q.options[pickedIndex],   // NEW
  correctLabel: q.options[q.correctIndex], // NEW
});
```

`grading.js`'s `recordDecision`/`understandingScore`/`countsByKind` functions are unaffected — they don't inspect the shape beyond `kind`/`correct`/`firstTry`/`misconception`, so extra fields are inert until the Report redesign starts reading them.

## Out of scope

- The Report screen itself (misconceptions-first narrative, decision drill-down, next-step recommendation, replay-of-the-build) — separate spec, sequenced after this one per prior discussion.
- Adding more eval questions to `emailTriage` — only the 2 existing questions are in scope; the `caseId` pattern just needs to support them correctly.
- Changing `validateGraph`/test-case logic — untouched.
