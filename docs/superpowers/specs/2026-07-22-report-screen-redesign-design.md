# Report screen redesign

## Context

This follows the Stress Testing redesign (`docs/superpowers/specs/2026-07-22-stress-testing-redesign-design.md`, implemented). That spec deliberately deferred the Report screen (`ReportScreen.jsx`) as a separate piece of work, sequenced second so it could consume the richer decision data (`chosenLabel`/`correctLabel` on `stress`-kind decisions) and the graph-threading (`builtGraph` state in `App.jsx`) the first spec introduced.

`ReportScreen.jsx` today is a plain scorecard: a "Solved"/"Needs another look" badge, a giant understanding-percentage number with a per-area breakdown, a "Worth revisiting" misconceptions list, a flat "Test cases" pass/fail list, and a flat "Eval questions" pass/fail list with a raw correct-count footer. No mascot, no motion, no drill-down — the same flatness the Stress Testing screen had before its redesign.

## Goal

Rebuild `ReportScreen.jsx` as a mascot-led, misconceptions-first report with an expandable decision drill-down — reusing the `NodeReplay` component and `builtGraph` data already introduced by the Stress Testing redesign, rather than building new replay infrastructure.

## Screen structure (top to bottom)

1. **Mascot-led verdict header.** `MascotPlayer` (clip keyed to score band — see below) plus a one-line verdict message, replacing today's plain "Solved"/"Needs another look" `Badge`. The understanding score is still shown but demoted to a secondary stat next to the message, not the current 44px headline number.

   Score bands (using `understandingScore(grading)`, unchanged from `grading.js`):
   - `>= 80`: mascot clip `celebrate`, message "Nice work — you really get this."
   - `>= 50`: mascot clip `idle`, message "Good foundation — a couple of gaps to close."
   - `< 50`: mascot clip `nervous`, message "Let's go back over a few things."
   - `grading` has no decisions (`score == null`, existing guard): no mascot header, same as no-score fallback today.

2. **"Worth revisiting" (misconceptions).** Moved to the top of the body (was third section, now first substantive section after the header). Same source data (`misconceptionsHit(grading)` mapped through `problem.misconceptionLabels`), restyled as expandable `Alert`-style cards — clicking one reveals which decision(s) triggered it (the `nodePick`-kind decision(s) in the grading store whose `misconception` field matches), collapsed by default.

3. **"What to try next."** One derived recommendation line, computed client-side (no new data needed): find the `kind` in `countsByKind(grading)` with the lowest `firstTryCorrect / total` ratio (ties broken by the order `kind` first appears in `store.decisions`). Map that `kind` to a canned suggestion string:

   ```js
   const NEXT_STEP_BY_KIND = {
     dissection: 'Re-read the problem statement and dissection questions — the core shape of the flow is worth another look.',
     field: 'Revisit node field configuration when building — double-check what each field should point at.',
     nodePick: 'Look again at which nodes fit each step — a few picks suggest some node types are still fuzzy.',
     stress: 'Replay the Stress Testing scenarios again to nail down how the flow behaves at the edges.',
   };
   ```

   If every kind is at 100% (or there are no decisions), this section doesn't render.

4. **Decision drill-down.** Replaces today's flat "Eval questions" section entirely (its content becomes the `stress`-kind rows here — no duplication). One expandable list, **grouped by `kind`** (`dissection`, `field`, `nodePick`, `stress`, in that order, skipping empty groups), sourced directly from `grading.decisions` rather than the separately-shaped `runResult`/`evalOutcome` props.

   Each row: `label` (the decision's prompt text) + a correct/incorrect badge, collapsed by default. Expanding a row reveals:
   - **`stress`-kind rows** (the only kind carrying `chosenLabel`/`correctLabel`, added by the Stress Testing redesign): "You picked: `<chosenLabel>`" / "Correct answer: `<correctLabel>`", **plus the live `NodeReplay` panel** for that question's scenario — reusing the exact same lookup `EvalScreen.jsx` already does (`q.caseId` → `problem.sampleCases.find(...)` → `simulateCase(graph, sampleCase).steps`), against the `builtGraph` `App.jsx` already holds in state. Rows whose question has no matching case (i.e. `why-fixed-path`) show just the label + correct/incorrect, no replay panel, no `ConceptFlow` fallback — the concept diagram is Stress Testing's teaching moment, not something the Report needs to repeat.
   - **`dissection`/`field`/`nodePick` rows**: just the label + correct/incorrect (no chosen/correct label breakdown — those decision shapes were not extended to carry it, and doing so is explicitly out of scope, see below).

5. **Test cases.** Unchanged — still the existing flat pass/fail list sourced from `runResult.results` (structural checks on the graph, not learner decisions, so they don't belong in the drill-down).

## Data plumbing

`ReportScreen` needs the learner's built graph to power the `NodeReplay` panels in step 4. `App.jsx` already holds this in `builtGraph` state (added by the Stress Testing redesign's Task 3) — it's simply not currently passed to `<ReportScreen>`. Add a `graph` prop:

```jsx
<ReportScreen problem={emailTriage} grading={grading} dissection={dissection} runResult={runResult} evalOutcome={evalOutcome} graph={builtGraph} />
```

`evalOutcome` remains a prop (still used nowhere new — it was already redundant with `grading`'s `stress`-kind decisions before this redesign, and remains unused by the new drill-down, which reads `grading.decisions` directly instead). No other component's props change.

## Explicitly out of scope

- Extending `chosenLabel`/`correctLabel` tracking to `dissection`/`field`/`nodePick` decisions (would require changes to `DissectionScreen.jsx` and `BuildStage.jsx`, well beyond a report-screen redesign).
- Any change to `Test cases` rendering or `validateGraph` logic.
- A `ConceptFlow` fallback in the drill-down for non-replayable questions (per step 4, deliberately omitted — the Report isn't re-teaching the concept, just showing what was asked).
- Multi-problem "next problem" recommendations — `emailTriage` is the only problem in this prototype; "next step" means a concept to revisit, not a different problem (consistent with the Stress Testing spec's same finding).
