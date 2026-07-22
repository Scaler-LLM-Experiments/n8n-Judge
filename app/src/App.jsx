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
import { scoreEval } from './engine/evalScore.js';

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
  return <MainApp />;
}

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
        <ReportScreen problem={emailTriage} grading={grading} dissection={dissection} runResult={runResult} evalOutcome={evalOutcome} graph={builtGraph} />
      ) : null}
    </div>
  );
}
