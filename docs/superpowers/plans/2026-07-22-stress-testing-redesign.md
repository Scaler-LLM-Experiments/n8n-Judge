# Stress Testing Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Stress Testing screen (`EvalScreen.jsx`) so each eval question is answered one at a time, mascot-narrated, with a node-based visual — a live replay of that scenario running through the learner's own built graph, or a static node-flow diagram for conceptual questions.

**Architecture:** `EvalScreen` becomes a single-question quiz view modeled on `DissectionScreen`'s `QuizBody` (centered column, lettered options, GSAP entrance, `MascotPlayer` reacting). A new `NodeReplay` component reveals `simulateCase()` steps on a timer inside the same dotted-grid canvas style already used elsewhere. The learner's built graph is threaded from `BuildStage` through `App.jsx` into `EvalScreen` so the replay runs against real data, not a canned example. Questions without a matching sample case fall back to the existing `ConceptFlow` diagram.

**Tech Stack:** React 18, `gsap` (already a dependency), `@phosphor-icons/react`, Vite, Vitest, `playwright-core` (dev-only, for the project's existing visual-verification scripts).

## Global Constraints

- **Zero `border-radius`** anywhere — square-cornered, per `syntax-design-system/SKILL.md`.
- Primary blue is `#0055FF`, referenced as `var(--brand-primary)`. Use CSS custom properties from `colors_and_type.css`, not raw hex.
- Hairline **1px** borders; **no decorative gradients**.
- Plus Jakarta Sans for UI text (`var(--font-body)`); Clash Grotesk (`var(--font-headline)`) reserved for headline-scale type only.
- Only pure engine/data logic gets unit tests (colocated `*.test.js` in `src/engine/` and `src/data/problems/`) — React components are not unit-tested in this codebase. Screens are verified visually via the Playwright `shoot-*.mjs` scripts in `app/scripts/`, run against the Vite dev server. Follow this existing convention rather than inventing component tests.
- Single-attempt grading per eval question (`firstTry: true` always) — no retry loop, unlike `DissectionScreen`'s lock-until-correct quiz.
- All commands in tasks below run from `app/` (i.e. `/Users/gaurichakravarti/Desktop/Scaler prod/n8n/app`) unless stated otherwise.

---

## Task 1: Add `caseId` to the eval question data

**Files:**
- Modify: `app/src/data/problems/emailTriage.js:446-459`

**Interfaces:**
- Produces: `emailTriage.evalQuestions[0].caseId === 'question'` — a new optional string field on eval question entries, referencing `sampleCases[].id`. Consumed by Task 4 (`EvalScreen`) to decide replay-vs-fallback per question.

- [ ] **Step 1: Add the `caseId` field**

In `app/src/data/problems/emailTriage.js`, the `general-question-gap` entry currently reads (lines 446-459):

```js
    {
      id: 'general-question-gap',
      prompt:
        "A customer email arrives that's just a general question, with no bug/feature/complaint keywords. What happens in this flow?",
      options: [
        'It gets logged as a Feature Request by default',
        "It doesn't match any of the 3 defined paths, so nothing sends",
        'The flow throws an error and stops',
        'It is automatically escalated as Urgent Complaint',
      ],
      correctIndex: 1,
      explanation:
        'Your Switch only has 3 branches — Bug Report, Feature Request, Urgent Complaint. A plain question matches none of them, so it silently falls through and no reply is ever sent. Real automations need a default/catch-all branch for exactly this.',
    },
```

Change it to (only the second line is new — `caseId: 'question',`):

```js
    {
      id: 'general-question-gap',
      caseId: 'question',
      prompt:
        "A customer email arrives that's just a general question, with no bug/feature/complaint keywords. What happens in this flow?",
      options: [
        'It gets logged as a Feature Request by default',
        "It doesn't match any of the 3 defined paths, so nothing sends",
        'The flow throws an error and stops',
        'It is automatically escalated as Urgent Complaint',
      ],
      correctIndex: 1,
      explanation:
        'Your Switch only has 3 branches — Bug Report, Feature Request, Urgent Complaint. A plain question matches none of them, so it silently falls through and no reply is ever sent. Real automations need a default/catch-all branch for exactly this.',
    },
```

Leave the `why-fixed-path` entry (right after it) untouched — it has no matching sample case, so the absence of `caseId` is what tells `EvalScreen` to use the `ConceptFlow` fallback.

- [ ] **Step 2: Verify the sample case it references exists**

Run: `grep -n "id: 'question'" "app/src/data/problems/emailTriage.js"`
Expected output includes: `{ id: 'question', from: 'curious@acme.io', subject: 'What are your business hours?', category: 'QUESTION', urgency: 'LOW', branch: null, reply: null },`

This confirms `caseId: 'question'` resolves to a real `sampleCases` entry.

- [ ] **Step 3: Run the existing test suite to confirm nothing broke**

Run: `npm test`
Expected: all existing suites pass (this is a pure data addition; no test currently asserts on `evalQuestions` shape, so none should fail).

- [ ] **Step 4: Commit**

```bash
git add app/src/data/problems/emailTriage.js
git commit -m "Add caseId to general-question-gap eval question"
```

---

## Task 2: Build the `NodeReplay` component

**Files:**
- Create: `app/src/components/NodeReplay.jsx`

**Interfaces:**
- Consumes: `steps` — the array returned by `simulateCase(graph, sampleCase).steps` from `app/src/engine/simulate.js` (each step: `{ nodeId?, edgeId?, iconType, status: 'ok'|'dead'|'done', text }`, per `simulate.js:9-70`).
- Produces: `NodeReplay({ steps, label })` — a React component with no other exports. Consumed by Task 4 (`EvalScreen.jsx`).

This component is a **new, self-contained** step-revealer rather than an extraction from `BuildStage.jsx`'s `RunPanel` (which orchestrates *multiple* cases in sequence — `RunPanel`'s reveal timer is entangled with its case-switching logic in `BuildStage.jsx:373-390`, and `NodeReplay` only ever needs to reveal steps for **one** case). Pulling shared logic out of `RunPanel` would touch working, already-shipped code in `BuildStage.jsx` for a one-line win; a small parallel component is lower risk and easier to reason about in isolation. The visual language (icon map, dotted-grid canvas, step fade-in) is intentionally copied to match `RunPanel`'s look.

**Important:** `BuildStage.jsx:220-232` defines `@keyframes runstep` and `.run-step` inside a `<style>` tag that only exists in the DOM while `BuildStage` is mounted. By the time the learner reaches Stress Testing, `BuildStage` has unmounted and that `<style>` tag is gone. `NodeReplay` must define its **own** `<style>` block for the fade-in animation — do not assume `.run-step` is available globally.

- [ ] **Step 1: Create the component file**

```jsx
// app/src/components/NodeReplay.jsx
import React, { useEffect, useRef, useState } from 'react';
import { EnvelopeSimpleOpen, Sparkle, BracketsCurly, ArrowsSplit, PaperPlaneTilt, XCircle } from '@phosphor-icons/react';

const STEP_ICON = {
  email: EnvelopeSimpleOpen,
  trigger: EnvelopeSimpleOpen,
  classify: Sparkle,
  parse: BracketsCurly,
  switch: ArrowsSplit,
  action: PaperPlaneTilt,
  dead: XCircle,
};

// Reveals `steps` (from engine/simulate.js's simulateCase) one at a time on a
// timer, inside the same dotted-grid canvas style used elsewhere in the app.
// Self-contained: does not depend on any styling BuildStage.jsx injects.
export function NodeReplay({ steps, label }) {
  const [revealed, setRevealed] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    setRevealed(0);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    steps.forEach((_, i) => {
      timers.current.push(setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), 300 + i * 420));
    });
    return () => timers.current.forEach(clearTimeout);
  }, [steps]);

  return (
    <div
      style={{
        width: '100%',
        border: '1px solid var(--border-strong)',
        background: '#E9ECF2',
        backgroundImage: 'radial-gradient(#C4CAD4 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        padding: 18,
        textAlign: 'left',
        minHeight: 120,
      }}
    >
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand-primary)' }} />
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {steps.slice(0, revealed).map((s, i) => {
          const Icon = STEP_ICON[s.iconType] || Sparkle;
          const color = s.status === 'dead' ? 'var(--status-danger)' : s.status === 'done' ? 'var(--brand-primary)' : 'var(--fg-2)';
          return (
            <div key={i} className="node-replay-step" style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: 'var(--fg-1)' }}>
              <Icon size={16} weight="fill" color={color} style={{ flex: 'none', marginTop: 1 }} />
              <span>{s.text}</span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes node-replay-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .node-replay-step { animation: node-replay-fadein 0.32s ease-out; }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Sanity-check imports resolve**

Run: `node -e "require('fs').readFileSync('app/src/components/NodeReplay.jsx','utf8').includes('export function NodeReplay') || process.exit(1)"`
Expected: no output, exit code 0 (the string is present).

This isn't a real test (the file is JSX, not directly requireable) — it's a quick guard against a typo in the export name before the next task tries to import it. The real verification happens visually in Task 5.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/NodeReplay.jsx
git commit -m "Add NodeReplay component for live case-replay visuals"
```

---

## Task 3: Thread the built graph from Build Node into Stress Testing

**Files:**
- Modify: `app/src/screens/BuildStage.jsx:217`
- Modify: `app/src/App.jsx:81-129` (the `MainApp` function)

**Interfaces:**
- Consumes: `graphRef.current` (already exists in `BuildStage.jsx:44,81-85` — the normalized `{ nodes, edges }` graph kept in sync by `handleGraph`).
- Produces: `EvalScreen` receives a new `graph` prop — the learner's final built `{ nodes, edges }` — in addition to its existing `problem`/`onDecision`/`onSubmit` props. Consumed by Task 4.

Today `BuildStage`'s `onComplete` only forwards the `validateGraph` result (`run.val`), discarding the actual graph once Build Node finishes. This task changes the shape of what `onComplete` passes so `App.jsx` can hold onto both pieces separately.

- [ ] **Step 1: Change what `BuildStage` passes to `onComplete`**

In `app/src/screens/BuildStage.jsx`, line 217 currently reads:

```jsx
        {run ? <RunPanel result={run} onContinue={() => onComplete(run.val)} onClose={() => { setRun(null); setStage('complete'); }} /> : null}
```

Change the `onContinue` handler to pass both the validation result and the graph:

```jsx
        {run ? <RunPanel result={run} onContinue={() => onComplete({ validation: run.val, graph: graphRef.current })} onClose={() => { setRun(null); setStage('complete'); }} /> : null}
```

- [ ] **Step 2: Update `App.jsx`'s `MainApp` to store both and forward the graph**

In `app/src/App.jsx`, the `MainApp` function (lines 81-129) currently has:

```jsx
function MainApp() {
  const [screen, setScreen] = useState(SCREEN.STATEMENT);
  const [dissection, setDissection] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [evalOutcome, setEvalOutcome] = useState(null);
  const [grading, setGrading] = useState(() => createStore());
  const record = (d) => setGrading((s) => recordDecision(s, d));

  return (
    <div style={{ height: '100vh' }}>
      {screen === SCREEN.STATEMENT ? (
        <DissectionScreen
          problem={emailTriage}
          onDecision={record}
          onComplete={(result) => {
            setDissection(result);
            setScreen(SCREEN.DASHBOARD);
          }}
        />
      ) : null}

      {screen === SCREEN.DASHBOARD ? (
        <BuildStage
          problem={emailTriage}
          onDecision={record}
          onComplete={(result) => {
            if (result) setRunResult(result);
            setScreen(SCREEN.EVAL);
          }}
        />
      ) : null}

      {screen === SCREEN.EVAL ? (
        <EvalScreen
          problem={emailTriage}
          onDecision={record}
          onSubmit={(outcome) => {
            setEvalOutcome(outcome);
            setScreen(SCREEN.REPORT);
          }}
        />
      ) : null}

      {screen === SCREEN.REPORT ? (
        <ReportScreen problem={emailTriage} grading={grading} dissection={dissection} runResult={runResult} evalOutcome={evalOutcome} />
      ) : null}
    </div>
  );
}
```

Replace it with:

```jsx
function MainApp() {
  const [screen, setScreen] = useState(SCREEN.STATEMENT);
  const [dissection, setDissection] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [builtGraph, setBuiltGraph] = useState(null);
  const [evalOutcome, setEvalOutcome] = useState(null);
  const [grading, setGrading] = useState(() => createStore());
  const record = (d) => setGrading((s) => recordDecision(s, d));

  return (
    <div style={{ height: '100vh' }}>
      {screen === SCREEN.STATEMENT ? (
        <DissectionScreen
          problem={emailTriage}
          onDecision={record}
          onComplete={(result) => {
            setDissection(result);
            setScreen(SCREEN.DASHBOARD);
          }}
        />
      ) : null}

      {screen === SCREEN.DASHBOARD ? (
        <BuildStage
          problem={emailTriage}
          onDecision={record}
          onComplete={(result) => {
            if (result) {
              setRunResult(result.validation);
              setBuiltGraph(result.graph);
            }
            setScreen(SCREEN.EVAL);
          }}
        />
      ) : null}

      {screen === SCREEN.EVAL ? (
        <EvalScreen
          problem={emailTriage}
          graph={builtGraph}
          onDecision={record}
          onSubmit={(outcome) => {
            setEvalOutcome(outcome);
            setScreen(SCREEN.REPORT);
          }}
        />
      ) : null}

      {screen === SCREEN.REPORT ? (
        <ReportScreen problem={emailTriage} grading={grading} dissection={dissection} runResult={runResult} evalOutcome={evalOutcome} />
      ) : null}
    </div>
  );
}
```

Note: `ReportScreen` still receives `runResult` (now `result.validation` instead of the old bare `result`) — same shape as before (`validateGraph`'s return value), so `ReportScreen.jsx` needs no changes.

- [ ] **Step 3: Run the test suite**

Run: `npm test`
Expected: all existing suites pass (this task only changes prop plumbing in two React components; no engine files touched).

- [ ] **Step 4: Commit**

```bash
git add app/src/screens/BuildStage.jsx app/src/App.jsx
git commit -m "Thread the built graph from BuildStage into EvalScreen via App state"
```

---

## Task 4: Rewrite `EvalScreen` as a one-question-at-a-time, mascot-narrated quiz

**Files:**
- Modify: `app/src/screens/EvalScreen.jsx` (full rewrite)

**Interfaces:**
- Consumes:
  - `NodeReplay({ steps, label })` from Task 2.
  - `ConceptFlow({ direction, size })` from `app/src/components/ConceptFlow.jsx` (existing, unchanged — accepts `direction: 'row'|'column'` and `size: 'sm'|'md'`).
  - `MascotPlayer({ clip, once, onceDone })` from `app/src/mascot/MascotPlayer.jsx` (existing, unchanged).
  - `simulateCase(graph, sampleCase)` from `app/src/engine/simulate.js` (existing, unchanged) — returns `{ steps, delivered }`.
  - `scoreEval(answers, evalQuestions)` from `app/src/engine/evalScore.js` (existing, unchanged).
  - `graph` prop from Task 3 (the learner's built `{ nodes, edges }`, or `null` if not yet built — guard accordingly).
  - `problem.evalQuestions[].caseId` from Task 1.
- Produces: `EvalScreen({ problem, graph, onDecision, onSubmit })` — same public signature as today plus the new `graph` prop. `onDecision` now receives `chosenLabel`/`correctLabel` fields in addition to the existing `id`/`kind`/`label`/`correct`/`firstTry` fields (inert extra data — `grading.js`'s `recordDecision` stores whatever object it's given, so no changes needed there).

- [ ] **Step 1: Replace the full contents of `EvalScreen.jsx`**

The current file (`app/src/screens/EvalScreen.jsx`, 88 lines) renders both questions on one page inside a `Card`, using `RadioGroup`. Replace its entire contents with:

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle, XCircle } from '@phosphor-icons/react';
import gsap from 'gsap';
import { Button } from '../design-system/Button.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { ConceptFlow } from '../components/ConceptFlow.jsx';
import { NodeReplay } from '../components/NodeReplay.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { simulateCase } from '../engine/simulate.js';
import { scoreEval } from '../engine/evalScore.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COLUMN = 620;

export function EvalScreen({ problem, graph, onDecision, onSubmit }) {
  const questions = problem.evalQuestions;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState({});
  const [mascotClip, setMascotClip] = useState('idle');
  const [showStatement, setShowStatement] = useState(false);
  const quizRef = useRef(null);

  const q = questions[index];
  const answered = picked !== null;
  const isCorrect = answered && picked === q.correctIndex;

  const sampleCase = q.caseId ? problem.sampleCases.find((c) => c.id === q.caseId) : null;
  const replaySteps = answered && sampleCase && graph ? simulateCase(graph, sampleCase).steps : null;

  useEffect(() => {
    if (quizRef.current) gsap.fromTo(quizRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
  }, [index]);

  const pick = (i) => {
    if (answered) return;
    const correct = i === q.correctIndex;
    setPicked(i);
    setMascotClip(correct ? 'correct' : 'shake-no');
    setAnswers((a) => ({ ...a, [q.id]: i }));
    if (onDecision) {
      onDecision({
        id: `stress:${q.id}`,
        kind: 'stress',
        label: q.prompt,
        correct,
        firstTry: true,
        chosenLabel: q.options[i],
        correctLabel: q.options[q.correctIndex],
      });
    }
  };

  const advance = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      setMascotClip('idle');
    } else {
      onSubmit(scoreEval(answers, questions));
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar activeStage="eval" onShowProblemStatement={() => setShowStatement(true)} />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '72px 24px 72px' }}>
        <div key={index} ref={quizRef} style={{ width: '100%', maxWidth: COLUMN, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 10 }}>
            Question {index + 1} of {questions.length}
          </div>
          <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 22, lineHeight: 1.35, maxWidth: 560 }}>{q.prompt}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            {q.options.map((opt, i) => {
              const state = picked === i ? (isCorrect ? 'correct' : 'wrong') : 'idle';
              const dim = answered && picked !== i;
              return (
                <OptionRow key={i} letter={LETTERS[i]} label={opt} state={state} dim={dim} disabled={answered} onClick={() => pick(i)} />
              );
            })}
          </div>

          {answered ? (
            <div style={{ width: '100%', marginTop: 18, display: 'flex', gap: 10, textAlign: 'left', padding: '13px 15px', border: `1px solid ${isCorrect ? 'var(--brand-blue-100)' : 'var(--status-danger-border)'}`, background: isCorrect ? 'var(--brand-blue-50)' : 'var(--status-danger-bg)' }}>
              {isCorrect ? <CheckCircle size={18} weight="fill" color="var(--brand-primary)" style={{ flex: 'none', marginTop: 1 }} /> : <XCircle size={18} weight="fill" color="var(--status-danger)" style={{ flex: 'none', marginTop: 1 }} />}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? 'var(--brand-primary)' : 'var(--status-danger)', marginBottom: 3 }}>
                  {isCorrect ? 'Correct' : `Not quite — the answer is "${q.options[q.correctIndex]}"`}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>{q.explanation}</div>
              </div>
            </div>
          ) : null}

          {answered ? (
            <div style={{ width: '100%', marginTop: 22 }}>
              {replaySteps ? (
                <NodeReplay steps={replaySteps} label="Replaying your build — this exact case, on your graph" />
              ) : (
                <div style={{ border: '1px solid var(--border-strong)', background: '#E9ECF2', backgroundImage: 'radial-gradient(#C4CAD4 1px, transparent 1px)', backgroundSize: '16px 16px', padding: '22px 18px' }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 12 }}>
                    The shape of it
                  </div>
                  <ConceptFlow direction="row" size="sm" />
                </div>
              )}
            </div>
          ) : null}

          {answered ? (
            <div style={{ marginTop: 26 }}>
              <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={advance}>
                {index + 1 < questions.length ? 'Continue' : 'See Report'}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ position: 'fixed', left: 28, bottom: 24, width: 84, height: 84, zIndex: 50, pointerEvents: 'none' }}>
        <MascotPlayer clip={mascotClip} once={mascotClip !== 'idle'} onceDone={() => {}} />
      </div>

      {showStatement && problem ? <ProblemStatementPanel problem={problem} onClose={() => setShowStatement(false)} /> : null}
    </div>
  );
}

function OptionRow({ letter, label, state, dim, disabled, onClick }) {
  const border = state === 'correct' ? 'var(--brand-primary)' : state === 'wrong' ? 'var(--status-danger)' : 'var(--border-subtle)';
  const bg = state === 'correct' ? 'var(--brand-blue-50)' : state === 'wrong' ? 'var(--status-danger-bg)' : 'var(--surface-0)';
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 15px',
        border: `1px solid ${border}`,
        background: bg,
        cursor: disabled ? 'default' : 'pointer',
        opacity: dim ? 0.45 : 1,
        width: '100%',
        textAlign: 'left',
        fontFamily: 'var(--font-body)',
        transition: 'border-color 120ms ease, background 120ms ease, opacity 120ms ease',
      }}
    >
      <span style={{ width: 24, height: 24, flex: 'none', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--fg-2)' }}>
        {letter}
      </span>
      <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--fg-1)', flex: 1 }}>{label}</span>
    </button>
  );
}
```

Notes on behavior baked into this rewrite:
- `pick()` is a no-op once `answered` is true — this enforces single-attempt grading (no changing your answer).
- `advance()` reads `answers` state, which already contains the current question's pick by the time the Continue button is clickable (the button only renders after `pick()` has run and re-rendered), so `scoreEval(answers, questions)` on the last question has all answers present — no extra bookkeeping needed.
- The mascot resets to `'idle'` on advancing to a new question, and only shows a reaction clip once the new question is answered.
- `key={index}` on the inner wrapper forces the GSAP entrance to re-run on every question change, matching `DissectionScreen`'s `QuizBody` (`key={index}` at `DissectionScreen.jsx:83`).

- [ ] **Step 2: Run the test suite**

Run: `npm test`
Expected: all existing suites pass (`EvalScreen.jsx` has no colocated test file — consistent with "React components are not tested").

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/EvalScreen.jsx
git commit -m "Rebuild Stress Testing as one-question-at-a-time, mascot-narrated flow with node-based visuals"
```

---

## Task 5: Add a demo route and visually verify both question modes

**Files:**
- Modify: `app/src/App.jsx` (add a new hash-route block, mirroring the existing `#run-demo`/`#report-demo` pattern at lines 29-77)
- Create: `app/scripts/shoot-eval.mjs`

**Interfaces:**
- Consumes: `EvalScreen` from Task 4, the hardcoded graph shape already used by the existing `#run-demo` route (`App.jsx:30-50`).
- Produces: a `#eval-demo` route usable at `http://localhost:5173/#eval-demo` for manual/scripted verification, and a `shoot-eval.mjs` script producing screenshots under `/tmp/judge-shots/` — following the exact pattern of the existing `shoot-run.mjs` and `shoot-probe.mjs` scripts.

- [ ] **Step 1: Add the `#eval-demo` route to `App.jsx`**

In `app/src/App.jsx`, immediately before the final `return <MainApp />;` (currently line 78, right after the `#report-demo` block closes), insert:

```jsx
  if (typeof window !== 'undefined' && window.location.hash === '#eval-demo') {
    const g = {
      nodes: [
        { id: 't', type: 'trigger', data: { label: 'New Email' } },
        { id: 'c', type: 'classify', data: { label: 'Classify with AI' } },
        { id: 'm', type: 'chat-gemini', data: { label: 'Gemini Chat Model' } },
        { id: 'p', type: 'parse', data: { label: 'Parse Result' } },
        { id: 's', type: 'switch', data: { label: 'Switch' } },
        { id: 'ab', type: 'action', data: { label: 'Send Reply' } },
        { id: 'af', type: 'action', data: { label: 'Send Reply' } },
        { id: 'au', type: 'action', data: { label: 'Send Reply' } },
      ],
      edges: [
        { id: 'em', source: 'm', target: 'c', targetHandle: 'ai_model' },
        { id: 'e1', source: 't', target: 'c' },
        { id: 'e2', source: 'c', target: 'p' },
        { id: 'e3', source: 'p', target: 's' },
        { id: 'e4', source: 's', target: 'ab', sourceHandle: 'bug_report' },
        { id: 'e5', source: 's', target: 'af', sourceHandle: 'feature_request' },
        { id: 'e6', source: 's', target: 'au', sourceHandle: 'urgent_complaint' },
      ],
    };
    return <div style={{ height: '100vh' }}><EvalScreen problem={emailTriage} graph={g} onDecision={() => {}} onSubmit={() => {}} /></div>;
  }
```

This reuses the exact same graph object literal already defined inline in the `#run-demo` block a few lines above (`App.jsx:30-50`) — it's the fully-correct, passing graph, so both eval questions can be answered correctly and their visuals checked.

- [ ] **Step 2: Create the Playwright verification script**

```js
// app/scripts/shoot-eval.mjs
import { chromium } from 'playwright-core';
const OUT = '/tmp/judge-shots';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:5173/#eval-demo', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/e1-question1.png` });

// Q1 has a matching sample case ('question') — answering it should trigger
// the live NodeReplay panel, ending on the Switch dead-end step.
await page.getByText("It doesn't match any of the 3 defined paths", { exact: false }).click();
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/e2-question1-answered.png` });

await page.getByText('Continue', { exact: false }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/e3-question2.png` });

// Q2 ('why-fixed-path') has no caseId — answering it should show the
// ConceptFlow diagram instead of a replay.
await page.getByText('Because the structure is fixed and predictable', { exact: false }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/e4-question2-answered.png` });

await browser.close();
console.log('done');
```

- [ ] **Step 3: Start the dev server**

Run (in the background, from `app/`): `npm run dev`
Expected: `VITE vX.X.X ready` with a local URL on port 5173. If 5173 is already taken, note the port Vite actually picked and use it in the next step instead.

- [ ] **Step 4: Run the verification script**

Run: `mkdir -p /tmp/judge-shots && node scripts/shoot-eval.mjs`
Expected: prints `done`, and four PNG files exist:

Run: `ls -la /tmp/judge-shots/e1-question1.png /tmp/judge-shots/e2-question1-answered.png /tmp/judge-shots/e3-question2.png /tmp/judge-shots/e4-question2-answered.png`
Expected: all four files listed with non-zero size.

- [ ] **Step 5: Visually inspect the screenshots**

Open each PNG and confirm:
- `e1-question1.png`: Question 1 of 2, four lettered options, no visual panel yet (unanswered).
- `e2-question1-answered.png`: the correct option highlighted, an explanation panel, and the `NodeReplay` panel showing revealed steps ending at "Switch: 'QUESTION' matches none of the 3 branches — this email goes unanswered." with a red dead-end icon.
- `e3-question2.png`: Question 2 of 2, unanswered.
- `e4-question2-answered.png`: the correct option highlighted, an explanation panel, and the `ConceptFlow` diagram (Trigger → Classify → Parse → Switch → Action icons with hand-drawn arrows) instead of a replay panel.

If any of these don't match, fix `EvalScreen.jsx` or `NodeReplay.jsx` before proceeding — this is the task's actual acceptance check, since these are unit-untested React components per this project's convention.

- [ ] **Step 6: Commit**

```bash
git add app/src/App.jsx app/scripts/shoot-eval.mjs
git commit -m "Add #eval-demo route and shoot-eval.mjs for Stress Testing visual verification"
```

---

## Task 6: Full end-to-end regression pass

**Files:** none (verification-only task)

- [ ] **Step 1: Run the full engine test suite**

Run: `npm test`
Expected: all suites pass, e.g. `validateGraph.test.js`, `checkDrop.test.js`, `connections.test.js` (if present), `simulate.test.js`, `evalScore.test.js`, `grading.test.js`, `emailTriage.test.js` — none of these were touched by this plan, so this is a regression guard, not new coverage.

- [ ] **Step 2: Manual click-through of the full app**

With the dev server running (`npm run dev` from `app/`), open `http://localhost:5173/` and walk through the full flow by hand:
1. Understand: answer all 5 dissection questions correctly.
2. Build Node: wire the full graph (trigger → classify + chat model → parse → switch → 3× send reply, each configured per `nodeSetup` in `emailTriage.js`) and click Run — confirm all 4 sample cases pass and "Move to Stress Testing" appears.
3. Stress Testing: confirm it now shows one question at a time, with the mascot reacting and the node-based visual (live replay for Q1, concept diagram for Q2) — this is the redesigned screen.
4. Result: confirm the Report screen still renders correctly with the same 100% understanding score and passing test cases as before (this screen was not changed by this plan).

Expected: no console errors, no visual regressions in Understand/Build Node/Result (untouched by this plan), and Stress Testing matches the new one-question-at-a-time design.

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: builds successfully with no errors (catches any stray import/typo across the changed files that dev mode might tolerate via HMR but a fresh build won't).

- [ ] **Step 4: Final commit (if any cleanup was needed)**

If steps 1-3 required fixes, commit them now with a message describing what was fixed. If everything passed clean, no commit needed for this task.
