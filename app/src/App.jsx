// app/src/App.jsx
import React, { useState } from 'react';
import { emailTriage } from './data/problems/emailTriage.js';
import { DissectionScreen } from './screens/DissectionScreen.jsx';
import { BuildStage } from './screens/BuildStage.jsx';
import { EvalScreen } from './screens/EvalScreen.jsx';
import { ReportScreen } from './screens/ReportScreen.jsx';
import { PlaygroundScreen } from './screens/PlaygroundScreen.jsx';
import { createStore, recordDecision } from './engine/grading.js';
import { RunPanel } from './screens/BuildStage.jsx';
import { simulateAll } from './engine/simulate.js';
import { validateGraph } from './engine/validateGraph.js';

const SCREEN = {
  STATEMENT: 'statement',
  DASHBOARD: 'dashboard',
  EVAL: 'eval',
  REPORT: 'report',
};

export default function App() {
  if (typeof window !== 'undefined' && window.location.hash === '#playground') {
    return <div style={{ height: '100vh' }}><PlaygroundScreen /></div>;
  }
  if (typeof window !== 'undefined' && window.location.hash === '#build') {
    return <div style={{ height: '100vh' }}><BuildStage problem={emailTriage} onComplete={() => {}} /></div>;
  }
  if (typeof window !== 'undefined' && window.location.hash === '#run-demo') {
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
    const result = { ...simulateAll(g, emailTriage), val: validateGraph(g, emailTriage) };
    return (
      <div style={{ height: '100vh', position: 'relative', background: '#E9ECF2' }}>
        <RunPanel result={result} onContinue={() => {}} onClose={() => {}} />
      </div>
    );
  }
  return <MainApp />;
}

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
          onSubmit={(outcome) => {
            setEvalOutcome(outcome);
            setScreen(SCREEN.REPORT);
          }}
        />
      ) : null}

      {screen === SCREEN.REPORT ? (
        <ReportScreen problem={emailTriage} dissection={dissection} runResult={runResult} evalOutcome={evalOutcome} />
      ) : null}
    </div>
  );
}
