// app/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { fetchProblemList, fetchProblem, slugFromUrl } from './data/problemsApi.js';
import { AsyncGate } from './components/AsyncGate.jsx';
import { GradingLoader } from './components/GradingLoader.jsx';
import { createSession } from './lib/grader.js';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { DissectionScreen } from './screens/DissectionScreen.jsx';
import { BuildStage } from './screens/BuildStage.jsx';
import { EvalScreen } from './screens/EvalScreen.jsx';
import { ReportScreen } from './screens/ReportScreen.jsx';
import { PlaygroundScreen } from './screens/PlaygroundScreen.jsx';
import { createStore, recordDecision } from '@judge/engine/grading.js';
import { RunPanel } from './screens/BuildStage.jsx';
import { simulateAll } from '@judge/engine/simulate.js';
import { validateGraph } from '@judge/engine/validateGraph.js';
import { scoreEval } from '@judge/engine/evalScore.js';

const SCREEN = {
  STATEMENT: 'statement',
  DASHBOARD: 'dashboard',
  EVAL: 'eval',
  REPORT: 'report',
};

// A finished reference flow, used by the dev demo routes so the Stress Testing
// and Report screens have a real graph to replay sample cases against.
const DEMO_GRAPH = {
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

// Dev routes need a problem too, and problems are now fetched. Resolve
// `?problem=<slug>` against the database, falling back to the first published
// challenge when the URL doesn't name one.
function DevProblem({ children }) {
  const load = useCallback(async () => {
    const slug = slugFromUrl();
    if (slug) return fetchProblem(slug);
    const list = await fetchProblemList();
    if (!list.length) throw new Error('No published challenges. Run `npm run db:seed`.');
    return fetchProblem(list[0].slug);
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <AsyncGate load={load} label="Loading challenge…">
        {(problem) => children(problem)}
      </AsyncGate>
    </div>
  );
}

export default function App() {
  const hash = typeof window === 'undefined' ? '' : window.location.hash;

  if (hash === '#playground') {
    return <div style={{ height: '100vh' }}><PlaygroundScreen /></div>;
  }
  if (hash.startsWith('#build')) {
    return <DevProblem>{(problem) => <BuildPreview problem={problem} />}</DevProblem>;
  }
  if (hash.startsWith('#run-story')) {
    return <DevProblem>{(problem) => <BuildPreview problem={problem} devAutoRun />}</DevProblem>;
  }
  if (hash.startsWith('#eval-demo')) {
    return <DevProblem>{(problem) => <EvalScreen problem={problem} graph={DEMO_GRAPH} onSubmit={() => {}} onDecision={() => {}} />}</DevProblem>;
  }
  if (hash === '#run-demo') {
    return (
      <DevProblem>
        {(problem) => {
          const g = DEMO_GRAPH;
          const result = { ...simulateAll(g, problem), val: validateGraph(g, problem) };
          return (
            <div style={{ height: '100%', position: 'relative', background: '#E9ECF2' }}>
              <RunPanel result={result} onContinue={() => {}} onClose={() => {}} />
            </div>
          );
        }}
      </DevProblem>
    );
  }
  if (hash === '#report-demo') {
    return (
      <DevProblem>
        {(problem) => {
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
          const g = DEMO_GRAPH;
          const runResult = validateGraph(g, problem);
          const evalOutcome = scoreEval({ 'general-question-gap': 1, 'why-fixed-path': 0 }, problem.evalQuestions);
          return <ReportScreen problem={problem} grading={s} runResult={runResult} evalOutcome={evalOutcome} graph={g} />;
        }}
      </DevProblem>
    );
  }
  return <Landing />;
}

// Home → pick a problem → run its full journey. The home cards carry only
// card-level fields, so selecting one fetches that problem's full data before
// the journey mounts. Selecting remounts MainApp fresh.
function Landing() {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <div style={{ height: '100vh' }}>
        <AsyncGate
          load={() => fetchProblem(selected.slug ?? selected.id)}
          deps={[selected.slug ?? selected.id]}
          label={`Loading ${selected.title}…`}
        >
          {(problem) => <MainApp key={problem.id} problem={problem} />}
        </AsyncGate>
      </div>
    );
  }

  return (
    <AsyncGate load={fetchProblemList} label="Loading challenges…">
      {(problems) => <HomeScreen problems={problems} onSelect={setSelected} />}
    </AsyncGate>
  );
}

// Preview wrapper for the #build / #run-story routes: build → eval → report,
// so the "Move to Stress Testing" CTA actually advances.
function BuildPreview({ problem, devAutoRun }) {
  const [screen, setScreen] = useState('build');
  const [grading, setGrading] = useState(() => createStore());
  const [runResult, setRunResult] = useState(null);
  const [builtGraph, setBuiltGraph] = useState(null);
  const [evalOutcome, setEvalOutcome] = useState(null);
  const record = (d) => setGrading((s) => recordDecision(s, d));

  if (screen === 'eval') {
    return <EvalScreen problem={problem} graph={builtGraph} onDecision={record} onSubmit={(o) => { setEvalOutcome(o); setScreen('report'); }} />;
  }
  if (screen === 'report') {
    return <ReportScreen problem={problem} grading={grading} runResult={runResult} evalOutcome={evalOutcome} graph={builtGraph} />;
  }
  return (
    <BuildStage
      problem={problem}
      devAutoRun={devAutoRun}
      onDecision={record}
      onComplete={(r) => { if (r) { setRunResult(r.validation); setBuiltGraph(r.graph); } setScreen('eval'); }}
    />
  );
}

function MainApp({ problem }) {
  const [screen, setScreen] = useState(SCREEN.STATEMENT);
  const [dissection, setDissection] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [builtGraph, setBuiltGraph] = useState(null);
  const [evalOutcome, setEvalOutcome] = useState(null);
  const [grading, setGrading] = useState(() => createStore());
  const [sessionId, setSessionId] = useState(null);
  const [gradingReport, setGradingReport] = useState(false);
  const record = (d) => setGrading((s) => recordDecision(s, d));

  // One Session per attempt, created up front. It pins the ProblemVersion the
  // learner is being graded against and gives the answer-check endpoint
  // somewhere to record every attempt. Screens still render while this is in
  // flight — a slow round trip should not hold up the opening screen — and a
  // failure leaves sessionId null, which the check client treats as
  // "unverified" rather than guessing a verdict.
  useEffect(() => {
    let cancelled = false;
    createSession(problem.id)
      .then((s) => { if (!cancelled) setSessionId(s.sessionId); })
      .catch((err) => console.error('[session] could not start:', err));
    return () => { cancelled = true; };
  }, [problem.id]);

  return (
    <div style={{ height: '100vh' }}>
      {screen === SCREEN.STATEMENT ? (
        <DissectionScreen
          problem={problem}
          sessionId={sessionId}
          onDecision={record}
          onComplete={(result) => {
            setDissection(result);
            setScreen(SCREEN.DASHBOARD);
          }}
        />
      ) : null}

      {screen === SCREEN.DASHBOARD ? (
        <BuildStage
          problem={problem}
          sessionId={sessionId}
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
          problem={problem}
          sessionId={sessionId}
          graph={builtGraph}
          onDecision={record}
          onSubmit={(outcome) => {
            setEvalOutcome(outcome);
            // Hold on a loader while the report is put together, rather than
            // snapping to a score — grading is server-side work now.
            setGradingReport(true);
            setScreen(SCREEN.REPORT);
            setTimeout(() => setGradingReport(false), 2600);
          }}
        />
      ) : null}

      {screen === SCREEN.REPORT && gradingReport ? <GradingLoader /> : null}

      {screen === SCREEN.REPORT && !gradingReport ? (
        <ReportScreen problem={problem} grading={grading} dissection={dissection} runResult={runResult} evalOutcome={evalOutcome} graph={builtGraph} />
      ) : null}
    </div>
  );
}
