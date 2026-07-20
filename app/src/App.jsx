// app/src/App.jsx
import React from 'react';
import { emailTriage } from './data/problems/emailTriage.js';
import { validateGraph } from './engine/validateGraph.js';
import { scoreEval } from './engine/evalScore.js';
import { ReportScreen } from './screens/ReportScreen.jsx';

const fixtureGraph = {
  nodes: [
    { id: 'n1', type: 'trigger' },
    { id: 'n2', type: 'classify' },
    { id: 'n3', type: 'parse' },
    { id: 'n4', type: 'route' },
    { id: 'n5', type: 'action' },
    { id: 'n6', type: 'action' },
    { id: 'n7', type: 'action' },
    { id: 'n8', type: 'complete' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2' },
    { id: 'e2', source: 'n2', target: 'n3' },
    { id: 'e3', source: 'n3', target: 'n4' },
    { id: 'e4', source: 'n4', target: 'n5', sourceHandle: 'bug_report' },
    { id: 'e5', source: 'n4', target: 'n6', sourceHandle: 'feature_request' },
    { id: 'e6', source: 'n4', target: 'n7', sourceHandle: 'urgent_complaint' },
    { id: 'e7', source: 'n5', target: 'n8' },
    { id: 'e8', source: 'n6', target: 'n8' },
    { id: 'e9', source: 'n7', target: 'n8' },
  ],
};

const fixtureAnswers = {};
emailTriage.evalQuestions.forEach((q) => { fixtureAnswers[q.id] = q.correctIndex; });

export default function App() {
  const runResult = validateGraph(fixtureGraph, emailTriage);
  const evalOutcome = scoreEval(fixtureAnswers, emailTriage.evalQuestions);
  return (
    <div style={{ height: '100vh' }}>
      <ReportScreen runResult={runResult} evalOutcome={evalOutcome} />
    </div>
  );
}
