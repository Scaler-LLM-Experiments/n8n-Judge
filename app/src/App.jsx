// app/src/App.jsx
import React, { useState } from 'react';
import { emailTriage } from './data/problems/emailTriage.js';
import { DissectionScreen } from './screens/DissectionScreen.jsx';
import { BuildStage } from './screens/BuildStage.jsx';
import { EvalScreen } from './screens/EvalScreen.jsx';
import { ReportScreen } from './screens/ReportScreen.jsx';
import { PlaygroundScreen } from './screens/PlaygroundScreen.jsx';
import { createStore, recordDecision } from './engine/grading.js';

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
