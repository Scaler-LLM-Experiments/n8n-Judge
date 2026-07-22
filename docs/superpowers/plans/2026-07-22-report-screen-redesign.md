# Report Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Report screen (`ReportScreen.jsx`) as a mascot-led, misconceptions-first report with an expandable decision drill-down, reusing the `NodeReplay` component and `builtGraph` data already introduced by the Stress Testing redesign.

**Architecture:** `ReportScreen` keeps its existing `Card`-wrapped, single-column layout but reorders and restructures its sections: a mascot verdict header replaces the plain badge/score headline; misconceptions move to the top as expandable cards; a derived "what to try next" line is computed from existing `countsByKind` data; a new expandable "Every decision" drill-down (grouped by kind, sourced from `grading.decisions` directly) replaces the old flat "Eval questions" list, with `stress`-kind rows reusing `NodeReplay` against the learner's `graph` (already threaded through `App.jsx` state by the Stress Testing redesign). Test cases stay as-is.

**Tech Stack:** React 18, `@phosphor-icons/react`, existing design-system primitives (`Card`, `Alert`, `Badge`), Vite, Vitest, `playwright-core` (dev-only, visual verification).

## Global Constraints

- **Zero `border-radius`** anywhere except explicitly circular elements — square-cornered, per `syntax-design-system/SKILL.md`. (`Card`/`Alert`/`Badge` already enforce this internally; new markup in this plan must too.)
- Use CSS custom properties from `colors_and_type.css`, not raw hex, except where copying the existing dotted-grid canvas pattern (already established by the Stress Testing redesign) — not needed in this plan since no new canvas visuals are introduced here.
- Only pure engine/data logic gets unit tests (`app/CLAUDE.md`) — React components are verified visually via the `shoot-*.mjs` Playwright scripts, not component unit tests.
- `dissection`/`field`/`nodePick` decisions do **not** get `chosenLabel`/`correctLabel` fields in this plan — only `stress`-kind decisions carry them (added by the prior Stress Testing redesign). Drill-down rows for other kinds show label + correct/incorrect only.
- `evalOutcome` prop stays on `ReportScreen`'s signature for backward compatibility but is not read by the new code — the drill-down reads `grading.decisions` directly instead.
- All commands run from `app/` (i.e. `/Users/gaurichakravarti/Desktop/Scaler prod/n8n/app`) unless stated otherwise.

---

## Task 1: Thread the built graph into `ReportScreen`

**Files:**
- Modify: `app/src/App.jsx:154` (the real `MainApp` flow's `<ReportScreen>` usage)
- Modify: `app/src/App.jsx:58-77` (the `#report-demo` hash-route block)

**Interfaces:**
- Consumes: `builtGraph` state in `App.jsx`'s `MainApp` (already exists, added by the Stress Testing redesign's Task 3 — holds the learner's final `{ nodes, edges }`).
- Produces: `ReportScreen` receives a new `graph` prop, in both the real app flow and the `#report-demo` demo route. Consumed by Task 2.

- [ ] **Step 1: Pass `graph` in the real app flow**

In `app/src/App.jsx`, line 154 currently reads:

```jsx
      {screen === SCREEN.REPORT ? (
        <ReportScreen problem={emailTriage} grading={grading} dissection={dissection} runResult={runResult} evalOutcome={evalOutcome} />
      ) : null}
```

Change it to:

```jsx
      {screen === SCREEN.REPORT ? (
        <ReportScreen problem={emailTriage} grading={grading} dissection={dissection} runResult={runResult} evalOutcome={evalOutcome} graph={builtGraph} />
      ) : null}
```

- [ ] **Step 2: Pass `graph` and realistic decision data in the `#report-demo` route**

In `app/src/App.jsx`, the `#report-demo` block (lines 58-77) currently reads:

```jsx
  if (typeof window !== 'undefined' && window.location.hash === '#report-demo') {
    let s = createStore();
    [
      { id: 'dissection:trigger', kind: 'dissection', correct: true, firstTry: true },
      { id: 'dissection:classify', kind: 'dissection', correct: true, firstTry: false },
      { id: 'classify:classify-brain', kind: 'field', correct: true, firstTry: false },
      { id: 'classify:classify-text', kind: 'field', correct: true, firstTry: true },
      { id: 'switch:switch-field', kind: 'field', correct: true, firstTry: true },
      { id: 'nodePick:chat-trigger', kind: 'nodePick', correct: false, firstTry: false, misconception: 'chat-trigger-is-email' },
      { id: 'stress:general-question-gap', kind: 'stress', correct: true, firstTry: true },
      { id: 'stress:why-fixed-path', kind: 'stress', correct: false, firstTry: true },
    ].forEach((d) => { s = recordDecision(s, d); });
    const g = {
      nodes: [{ id: 't', type: 'trigger' }, { id: 'c', type: 'classify' }, { id: 'm', type: 'chat-gemini' }, { id: 'p', type: 'parse' }, { id: 's', type: 'switch' }, { id: 'ab', type: 'action' }, { id: 'af', type: 'action' }, { id: 'au', type: 'action' }],
      edges: [{ source: 'm', target: 'c', targetHandle: 'ai_model' }, { source: 't', target: 'c' }, { source: 'c', target: 'p' }, { source: 'p', target: 's' }, { source: 's', target: 'ab', sourceHandle: 'bug_report' }, { source: 's', target: 'af', sourceHandle: 'feature_request' }, { source: 's', target: 'au', sourceHandle: 'urgent_complaint' }],
    };
    const runResult = validateGraph(g, emailTriage);
    const evalOutcome = scoreEval({ 'general-question-gap': 1, 'why-fixed-path': 0 }, emailTriage.evalQuestions);
    return <div style={{ height: '100vh' }}><ReportScreen problem={emailTriage} grading={s} runResult={runResult} evalOutcome={evalOutcome} /></div>;
  }
```

Change the two `stress:*` decision entries to include `chosenLabel`/`correctLabel` (so the drill-down has realistic data to show), and pass `graph={g}` to `ReportScreen`:

```jsx
  if (typeof window !== 'undefined' && window.location.hash === '#report-demo') {
    let s = createStore();
    [
      { id: 'dissection:trigger', kind: 'dissection', correct: true, firstTry: true },
      { id: 'dissection:classify', kind: 'dissection', correct: true, firstTry: false },
      { id: 'classify:classify-brain', kind: 'field', correct: true, firstTry: false },
      { id: 'classify:classify-text', kind: 'field', correct: true, firstTry: true },
      { id: 'switch:switch-field', kind: 'field', correct: true, firstTry: true },
      { id: 'nodePick:chat-trigger', kind: 'nodePick', correct: false, firstTry: false, misconception: 'chat-trigger-is-email' },
      { id: 'stress:general-question-gap', kind: 'stress', correct: true, firstTry: true, chosenLabel: "It doesn't match any of the 3 defined paths, so nothing sends", correctLabel: "It doesn't match any of the 3 defined paths, so nothing sends" },
      { id: 'stress:why-fixed-path', kind: 'stress', correct: false, firstTry: true, chosenLabel: 'Because n8n does not support branching logic', correctLabel: 'Because the structure is fixed and predictable — the AI only does one classification step, it doesn\'t choose which tools to call' },
    ].forEach((d) => { s = recordDecision(s, d); });
    const g = {
      nodes: [{ id: 't', type: 'trigger' }, { id: 'c', type: 'classify' }, { id: 'm', type: 'chat-gemini' }, { id: 'p', type: 'parse' }, { id: 's', type: 'switch' }, { id: 'ab', type: 'action' }, { id: 'af', type: 'action' }, { id: 'au', type: 'action' }],
      edges: [{ source: 'm', target: 'c', targetHandle: 'ai_model' }, { source: 't', target: 'c' }, { source: 'c', target: 'p' }, { source: 'p', target: 's' }, { source: 's', target: 'ab', sourceHandle: 'bug_report' }, { source: 's', target: 'af', sourceHandle: 'feature_request' }, { source: 's', target: 'au', sourceHandle: 'urgent_complaint' }],
    };
    const runResult = validateGraph(g, emailTriage);
    const evalOutcome = scoreEval({ 'general-question-gap': 1, 'why-fixed-path': 0 }, emailTriage.evalQuestions);
    return <div style={{ height: '100vh' }}><ReportScreen problem={emailTriage} grading={s} runResult={runResult} evalOutcome={evalOutcome} graph={g} /></div>;
  }
```

Note: the demo's second stress decision (`why-fixed-path`) is marked `correct: false` with `chosenLabel` deliberately different from `correctLabel`, and the first (`general-question-gap`) is marked `correct: true` with matching labels — this gives Task 3's visual verification one of each state to check.

- [ ] **Step 2: Run the test suite**

Run: `npm test`
Expected: all suites pass (this task only changes prop plumbing in `App.jsx`; no engine files touched).

- [ ] **Step 3: Commit**

```bash
git add app/src/App.jsx
git commit -m "Thread built graph into ReportScreen and enrich #report-demo decision data"
```

---

## Task 2: Rewrite `ReportScreen` with mascot header, misconceptions-first ordering, next-step recommendation, and decision drill-down

**Files:**
- Modify: `app/src/screens/ReportScreen.jsx` (full rewrite)

**Interfaces:**
- Consumes:
  - `understandingScore(grading)`, `countsByKind(grading)`, `misconceptionsHit(grading)` from `app/src/engine/grading.js` (existing, unchanged).
  - `simulateCase(graph, sampleCase)` from `app/src/engine/simulate.js` (existing, unchanged).
  - `NodeReplay({ steps, label })` from `app/src/components/NodeReplay.jsx` (existing, unchanged).
  - `MascotPlayer({ clip, once, onceDone })` from `app/src/mascot/MascotPlayer.jsx` (existing, unchanged).
  - `Card({ tone, interactive, padding, children, style, ...rest })`, `Alert({ tone, title, children, style })`, `Badge({ tone, children })` from `app/src/design-system/` (existing, unchanged).
  - `grading.decisions` — the array of recorded decision objects (existing shape: `{ id, kind, label, correct, firstTry, misconception?, chosenLabel?, correctLabel? }`, per `grading.js`'s doc comment).
  - `graph` prop from Task 1.
- Produces: `ReportScreen({ problem, grading, dissection, runResult, evalOutcome, graph })` — same public signature as today plus the new `graph` prop (`evalOutcome` and `dissection` remain accepted but unread by the new logic, for backward compatibility with the props `App.jsx` already passes).

- [ ] **Step 1: Replace the full contents of `ReportScreen.jsx`**

The current file (91 lines) shows a plain `Badge`, a big score number, misconceptions third, then flat test-case and eval-question lists. Replace its entire contents with:

```jsx
import React, { useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { Card } from '../design-system/Card.jsx';
import { Alert } from '../design-system/Alert.jsx';
import { Badge } from '../design-system/Badge.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { NodeReplay } from '../components/NodeReplay.jsx';
import { understandingScore, countsByKind, misconceptionsHit } from '../engine/grading.js';
import { simulateCase } from '../engine/simulate.js';

const KIND_LABEL = { dissection: 'Problem dissection', field: 'Node configuration', nodePick: 'Node choices', stress: 'Stress testing' };
const KIND_ORDER = ['dissection', 'field', 'nodePick', 'stress'];

const NEXT_STEP_BY_KIND = {
  dissection: 'Re-read the problem statement and dissection questions — the core shape of the flow is worth another look.',
  field: 'Revisit node field configuration when building — double-check what each field should point at.',
  nodePick: 'Look again at which nodes fit each step — a few picks suggest some node types are still fuzzy.',
  stress: 'Replay the Stress Testing scenarios again to nail down how the flow behaves at the edges.',
};

function verdictFor(score) {
  if (score == null) return null;
  if (score >= 80) return { clip: 'celebrate', message: 'Nice work — you really get this.' };
  if (score >= 50) return { clip: 'idle', message: 'Good foundation — a couple of gaps to close.' };
  return { clip: 'nervous', message: "Let's go back over a few things." };
}

// Finds the kind with the lowest first-try-correct ratio; returns its canned
// suggestion, or null if every kind is at 100% (or there's nothing to grade).
function nextStepFor(counts) {
  let worstKind = null;
  let worstRatio = Infinity;
  KIND_ORDER.forEach((kind) => {
    const c = counts[kind];
    if (!c || c.total === 0) return;
    const ratio = c.firstTryCorrect / c.total;
    if (ratio < worstRatio) {
      worstRatio = ratio;
      worstKind = kind;
    }
  });
  if (worstKind === null || worstRatio >= 1) return null;
  return NEXT_STEP_BY_KIND[worstKind];
}

// decision.id for stress decisions is `stress:${evalQuestionId}` (set by
// EvalScreen.jsx's pick()). Resolve that back to the question's caseId, then
// to the sampleCases entry simulateCase needs.
function findSampleCase(problem, decisionId) {
  const qId = decisionId.replace(/^stress:/, '');
  const q = problem.evalQuestions?.find((eq) => eq.id === qId);
  if (!q?.caseId) return null;
  return problem.sampleCases?.find((c) => c.id === q.caseId) || null;
}

export function ReportScreen({ problem, grading, dissection, runResult, evalOutcome, graph }) {
  const [showStatement, setShowStatement] = useState(false);

  const score = grading ? understandingScore(grading) : null;
  const counts = grading ? countsByKind(grading) : {};
  const misconceptions = grading ? misconceptionsHit(grading) : [];
  const verdict = verdictFor(score);
  const nextStep = grading ? nextStepFor(counts) : null;
  const decisions = grading?.decisions || [];
  const kindsPresent = KIND_ORDER.filter((k) => decisions.some((d) => d.kind === k));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar activeStage="report" onShowProblemStatement={() => setShowStatement(true)} />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: 24 }}>
        <Card style={{ maxWidth: 640, width: '100%' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
            Result
          </div>

          {verdict ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, flex: 'none' }}>
                <MascotPlayer clip={verdict.clip} once={false} onceDone={() => {}} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 2 }}>{verdict.message}</div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>{score}% understanding, first try</div>
              </div>
            </div>
          ) : null}

          {misconceptions.length ? (
            <>
              <h3 style={{ margin: '0 0 8px' }}>Worth revisiting</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {misconceptions.map((m) => (
                  <MisconceptionCard key={m} id={m} label={problem.misconceptionLabels?.[m] || m} decisions={decisions} />
                ))}
              </div>
            </>
          ) : null}

          {nextStep ? (
            <>
              <h3 style={{ margin: '0 0 8px' }}>What to try next</h3>
              <Alert tone="info" style={{ marginBottom: 24 }}>{nextStep}</Alert>
            </>
          ) : null}

          {kindsPresent.length ? (
            <>
              <h3 style={{ margin: '0 0 8px' }}>Every decision</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {kindsPresent.map((kind) => (
                  <div key={kind}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-2)', marginBottom: 8 }}>{KIND_LABEL[kind]}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {decisions.filter((d) => d.kind === kind).map((d) => (
                        <DecisionRow key={d.id} decision={d} problem={problem} graph={graph} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <h3 style={{ margin: '0 0 8px' }}>Test cases</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {runResult?.results?.map((r) => (
              <Alert key={r.id} tone={r.passed ? 'success' : 'danger'} title={r.description}>
                {r.passed ? 'Passed' : r.reason}
              </Alert>
            ))}
          </div>
        </Card>
      </div>
      {showStatement && problem ? <ProblemStatementPanel problem={problem} onClose={() => setShowStatement(false)} /> : null}
    </div>
  );
}

function MisconceptionCard({ id, label, decisions }) {
  const [open, setOpen] = useState(false);
  const hits = decisions.filter((d) => d.misconception === id);
  return (
    <Card interactive padding={13} onClick={() => setOpen((o) => !o)} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>{label}</span>
        {open ? <CaretUp size={14} color="var(--fg-3)" /> : <CaretDown size={14} color="var(--fg-3)" />}
      </div>
      {open ? (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {hits.map((d) => (
            <div key={d.id} style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>{d.label}</div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function DecisionRow({ decision, problem, graph }) {
  const [open, setOpen] = useState(false);
  const sampleCase = decision.kind === 'stress' ? findSampleCase(problem, decision.id) : null;
  const replaySteps = open && sampleCase && graph ? simulateCase(graph, sampleCase).steps : null;

  return (
    <Card interactive padding={13} onClick={() => setOpen((o) => !o)} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--fg-1)' }}>{decision.label}</span>
        <Badge tone={decision.correct ? 'success' : 'danger'}>{decision.correct ? 'Correct' : 'Incorrect'}</Badge>
        {open ? <CaretUp size={14} color="var(--fg-3)" /> : <CaretDown size={14} color="var(--fg-3)" />}
      </div>
      {open ? (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {decision.chosenLabel != null ? (
            <div style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>
              <div>You picked: <strong style={{ color: 'var(--fg-1)' }}>{decision.chosenLabel}</strong></div>
              <div>Correct answer: <strong style={{ color: 'var(--fg-1)' }}>{decision.correctLabel}</strong></div>
            </div>
          ) : null}
          {replaySteps ? <NodeReplay steps={replaySteps} label="Replaying this scenario, on your graph" /> : null}
        </div>
      ) : null}
    </Card>
  );
}
```

Notes on behavior baked into this rewrite:
- `verdictFor`/`nextStepFor` are pure functions of already-existing `grading.js` outputs — no new engine code, no new data shapes.
- `misconceptions`/`nextStep`/`kindsPresent` sections all independently guard on having content — a `grading` with zero decisions renders none of them, same graceful-empty behavior as the original file's `score == null` guard.
- `DecisionRow`'s `replaySteps` is only computed when `open` is true, so `simulateCase` never runs for collapsed rows (cheap by default, matches `EvalScreen.jsx`'s existing lazy-eval pattern for the same function).
- Rows for `why-fixed-path`-style stress decisions (no `caseId` on the question) get `sampleCase === null`, so `replaySteps` stays `null` and no `NodeReplay` renders — just the chosen/correct label pair, per the spec's explicit choice not to repeat the `ConceptFlow` fallback here.

- [ ] **Step 2: Run the test suite**

Run: `npm test`
Expected: all existing suites pass (`ReportScreen.jsx` has no colocated test file — consistent with "React components are not tested").

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/ReportScreen.jsx
git commit -m "Rebuild Report screen with mascot verdict, misconceptions-first ordering, and decision drill-down"
```

---

## Task 3: Extend the visual verification script and confirm both states

**Files:**
- Modify: `app/scripts/shoot-report.mjs`

**Interfaces:**
- Consumes: the `#report-demo` route from Task 1 (now passing `graph` and richer `stress` decision data), `ReportScreen.jsx` from Task 2.
- Produces: updated screenshots under `/tmp/judge-shots/` proving the redesign renders and expands correctly.

- [ ] **Step 1: Replace `shoot-report.mjs` with an expand-and-capture sequence**

The current script (7 lines) takes one full-page screenshot of the collapsed state. Replace its contents with:

```js
import { chromium } from 'playwright-core';
const OUT = '/tmp/judge-shots';
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1440, height: 980 } });

await p.goto('http://localhost:5173/#report-demo', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.screenshot({ path: `${OUT}/rep1-collapsed.png`, fullPage: true });

// Expand the misconception card ("Treated a chat trigger as an email trigger").
await p.getByText('Treated a chat trigger as an email trigger', { exact: false }).click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/rep2-misconception-open.png`, fullPage: true });

// Expand the correct stress decision row — should show chosen/correct labels
// plus a live NodeReplay panel (this question has a caseId).
await p.getByText("It doesn't match any of the 3 defined paths", { exact: false }).first().click();
await p.waitForTimeout(3000); // let NodeReplay's timed steps reveal
await p.screenshot({ path: `${OUT}/rep3-stress-decision-open.png`, fullPage: true });

await b.close();
console.log('done');
```

- [ ] **Step 2: Start the dev server**

Run (in the background, from `app/`): `npm run dev`
Expected: `VITE vX.X.X ready` with a local URL. If port 5173 is taken, note the actual port and use it for this verification run only (the committed script stays hardcoded to 5173, matching the project's established convention from the Stress Testing redesign's `shoot-eval.mjs`).

- [ ] **Step 3: Run the script and inspect the screenshots**

Run: `mkdir -p /tmp/judge-shots && node scripts/shoot-report.mjs`
Expected: prints `done`, and three PNGs exist:

Run: `ls -la /tmp/judge-shots/rep1-collapsed.png /tmp/judge-shots/rep2-misconception-open.png /tmp/judge-shots/rep3-stress-decision-open.png`
Expected: all three files listed with non-zero size.

Open each and confirm:
- `rep1-collapsed.png`: mascot + verdict message at top (score is 62% given the demo's 5-of-8 first-try-correct decisions — `idle` clip, "Good foundation" message), "Worth revisiting" with one collapsed misconception card, "What to try next" alert, "Every decision" grouped by kind with collapsed rows each showing a Correct/Incorrect badge, then "Test cases" unchanged at the bottom.
- `rep2-misconception-open.png`: the misconception card expanded, showing the `nodePick:chat-trigger` decision's label underneath.
- `rep3-stress-decision-open.png`: the `stress:general-question-gap` row expanded, showing "You picked: ..." / "Correct answer: ..." and a live `NodeReplay` panel with revealed steps ending at the Switch dead-end.

If anything doesn't match, fix `ReportScreen.jsx` (from Task 2) and re-run until it does — this screenshot check is this task's acceptance test, per the project's convention of visual verification over component unit tests.

- [ ] **Step 4: Stop the dev server and run the full test suite once more**

Run: `npm test`
Expected: all suites still pass (final regression guard — this plan touched no engine files across all three tasks).

- [ ] **Step 5: Commit**

```bash
git add app/scripts/shoot-report.mjs
git commit -m "Extend shoot-report.mjs to verify misconception and decision drill-down expansion"
```
