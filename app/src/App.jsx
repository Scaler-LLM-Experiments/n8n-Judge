// app/src/App.jsx
import React, { useState } from 'react';
import { emailTriage } from './data/problems/emailTriage.js';
import { ProblemStatementScreen } from './screens/ProblemStatementScreen.jsx';
import { DashboardScreen } from './screens/DashboardScreen.jsx';
import { EvalScreen } from './screens/EvalScreen.jsx';
import { ReportScreen } from './screens/ReportScreen.jsx';

const SCREEN = {
  STATEMENT: 'statement',
  DASHBOARD: 'dashboard',
  EVAL: 'eval',
  REPORT: 'report',
};

export default function App() {
  const [screen, setScreen] = useState(SCREEN.STATEMENT);
  const [runResult, setRunResult] = useState(null);
  const [evalOutcome, setEvalOutcome] = useState(null);

  return (
    <div style={{ height: '100vh' }}>
      {screen === SCREEN.STATEMENT ? (
        <ProblemStatementScreen problem={emailTriage} onStart={() => setScreen(SCREEN.DASHBOARD)} />
      ) : null}

      {screen === SCREEN.DASHBOARD ? (
        <DashboardScreen
          problem={emailTriage}
          onAllTestsPassed={(result) => {
            setRunResult(result);
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
        <ReportScreen problem={emailTriage} runResult={runResult} evalOutcome={evalOutcome} />
      ) : null}
    </div>
  );
}
