// app/src/App.jsx
import React, { useState } from 'react';
import { resolveProblem, problemList } from './data/problems/index.js';
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

export default function App() {
  const problem = resolveProblem();
  if (typeof window !== 'undefined' && window.location.hash === '#playground') {
    return <div style={{ height: '100vh' }}><PlaygroundScreen /></div>;
  }
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#build')) {
    return <div style={{ height: '100vh' }}><BuildPreview problem={problem} /></div>;
  }
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#run-story')) {
    return <div style={{ height: '100vh' }}><BuildPreview problem={problem} devAutoRun /></div>;
  }
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#eval-demo')) {
    return <div style={{ height: '100vh' }}><EvalScreen problem={problem} graph={DEMO_GRAPH} onSubmit={() => {}} onDecision={() => {}} /></div>;
  }
  if (typeof window !== 'undefined' && window.location.hash === '#run-demo') {
    const g = DEMO_GRAPH;
    const result = { ...simulateAll(g, problem), val: validateGraph(g, problem) };
    return (
      <div style={{ height: '100vh', position: 'relative', background: '#E9ECF2' }}>
        <RunPanel result={result} onContinue={() => {}} onClose={() => {}} />
      </div>
    );
  }
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
    const g = DEMO_GRAPH;
    const runResult = validateGraph(g, problem);
    const evalOutcome = scoreEval({ 'general-question-gap': 1, 'why-fixed-path': 0 }, problem.evalQuestions);
    return <div style={{ height: '100vh' }}><ReportScreen problem={problem} grading={s} runResult={runResult} evalOutcome={evalOutcome} graph={g} /></div>;
  }
  return <Landing />;
}

// Home → pick a problem → run its full journey. Selecting remounts MainApp fresh.
function Landing() {
  const [selected, setSelected] = useState(null);
  if (selected) return <MainApp key={selected.id} problem={selected} />;
  return <HomeScreen problems={problemList} onSelect={setSelected} />;
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
  const record = (d) => setGrading((s) => recordDecision(s, d));

  return (
    <div style={{ height: '100vh' }}>
      {screen === SCREEN.STATEMENT ? (
        <DissectionScreen
          problem={problem}
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
          graph={builtGraph}
          onDecision={record}
          onSubmit={(outcome) => {
            setEvalOutcome(outcome);
            setScreen(SCREEN.REPORT);
          }}
        />
      ) : null}

      {screen === SCREEN.REPORT ? (
        <ReportScreen problem={problem} grading={grading} dissection={dissection} runResult={runResult} evalOutcome={evalOutcome} graph={builtGraph} />
      ) : null}
    </div>
  );
}
