// app/src/App.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { fetchProblemList, fetchProblem, slugFromUrl } from './data/problemsApi.js';
import { AsyncGate } from './components/AsyncGate.jsx';
import { GradingLoader } from './components/GradingLoader.jsx';
import { createSession, fetchReport } from './lib/grader.js';
import { useTrace } from './lib/useTrace.js';
import { TraceProvider } from './lib/TraceContext.jsx';
import { VoiceProvider } from './lib/VoiceContext.jsx';
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
// Shape-accurate stand-in for POST /api/sessions/[id]/report, used by the
// #report-demo dev route only. Mirrors the real response exactly so the route is
// a faithful preview of the Result screen.
const DEMO_SERVER_REPORT = {
  total: 74,
  band: 'solid',
  definition:
    'You reached the right answer nearly everywhere, but needed a second try on several decisions. The understanding is there; the details are still settling.',
  phases: [
    { key: 'understand', label: 'Understand', weight: 30, earned: 26, score: 87 },
    { key: 'build', label: 'Build', weight: 50, earned: 34.5, score: 69 },
    { key: 'stress', label: 'Stress Testing', weight: 20, earned: 13.3, score: 67 },
  ],
  report: {
    scoreDefinition: 'A 74 means you knew the shape of this workflow and hesitated on the details.',
    areaBreakdown: [],
    misconceptions: [],
    strengths: [
      'You picked the Gmail Trigger and the Switch correctly on the first attempt — the overall shape of the flow was clear to you before you started building.',
      'You set the Chat Model temperature to 0 straight away, which shows you understood that triage has to be repeatable.',
    ],
    focusAreas: [
      'The Text Classifier needed three attempts. The pattern suggests you were choosing between options rather than reading what each one points at.',
      'You turned on Always Output Data on the Switch, which sends a blank reply instead of leaving an unmatched email visibly unanswered.',
    ],
    nextSteps: [
      'Run Meeting Notes Summarizer next — it is a shorter, linear flow and will let you practise node configuration without a router in the way.',
      'Before that, reopen the Text Classifier in this challenge and read what the Text field is pointing at.',
      'Then come back to Email Triage and aim to configure every node on the first verify.',
    ],
    narrative:
      'You built a working triage flow and understood why it needs a router. Most of the marks you lost were in configuration rather than structure, which is the easier gap to close. Spend a little time on what each field actually references, then try a second challenge.',
    insufficientEvidence: [],
  },
};

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

  // startsWith, not equality: `#playground?problem=lead-triage` fell through to
  // Landing, so the route silently ignored the problem you asked for.
  if (hash.startsWith('#playground')) {
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
  if (hash.startsWith('#run-demo')) {
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
  // startsWith, not equality: `#report-demo?problem=lead-triage` silently fell
  // through to Landing before, so smoke's three report-demo checks were all
  // rendering email-triage.
  if (hash.startsWith('#report-demo')) {
    return (
      <DevProblem>
        {(problem) => {
          let s = createStore();
          [
            { id: 'dissection:trigger', kind: 'dissection', label: 'Which node should start this flow?', correct: true, firstTry: true },
            { id: 'dissection:classify', kind: 'dissection', label: 'What decides which reply an email gets?', correct: true, firstTry: false },
            { id: 'classify:classify-brain', kind: 'field', label: 'Classify with AI — Chat Model', correct: true, firstTry: false },
            { id: 'classify:classify-text', kind: 'field', label: 'Classify with AI — Text to classify', correct: true, firstTry: true },
            { id: 'switch:switch-field', kind: 'field', label: 'Switch — Route on', correct: true, firstTry: true },
            { id: 'nodePick:chat-trigger', kind: 'nodePick', label: 'Placed a Chat Trigger to receive email', correct: false, firstTry: false, misconception: 'chat-trigger-is-email' },
            { id: 'stress:general-question-gap', kind: 'stress', label: 'What happens to an email that matches no branch?', correct: true, firstTry: true, correctLabel: 'It is left unanswered — visibly, so you can fix it' },
            { id: 'stress:why-fixed-path', kind: 'stress', label: 'Why does the same email always take the same path?', correct: false, firstTry: true, correctLabel: 'Because temperature 0 makes the model deterministic' },
          ].forEach((d) => { s = recordDecision(s, d); });
          const g = DEMO_GRAPH;
          const runResult = validateGraph(g, problem);
          const evalOutcome = scoreEval({ 'general-question-gap': 1, 'why-fixed-path': 0 }, problem.evalQuestions);
          // A representative server payload, so this route exercises the marks
          // total, the phase breakdown and Claude's three written sections. The
          // live route needs a session and an API key; without a fixture here
          // those branches would render nowhere and smoke could not catch a
          // break in them.
          return (
            <ReportScreen
              problem={problem}
              grading={s}
              runResult={runResult}
              evalOutcome={evalOutcome}
              graph={g}
              serverReport={DEMO_SERVER_REPORT}
            />
          );
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
// One Session per attempt. It pins the ProblemVersion the learner is graded
// against and gives the answer-check endpoint somewhere to record every attempt.
// Screens render while this is in flight — a slow round trip should not hold up
// the opening screen.
//
// The dev routes use this too, deliberately. Without a session every check
// returns "could not verify", because the browser holds no answers to grade
// against — so #build could not verify a single field, and every screenshot
// taken from it was of a broken grader.
function useSession(problemId) {
  const [sessionId, setSessionId] = useState(null);
  useEffect(() => {
    let cancelled = false;
    createSession(problemId)
      .then((s) => { if (!cancelled) setSessionId(s.sessionId); })
      .catch((err) => console.error('[session] could not start:', err));
    return () => { cancelled = true; };
  }, [problemId]);
  return sessionId;
}

function BuildPreview({ problem, devAutoRun }) {
  const [screen, setScreen] = useState('build');
  const [grading, setGrading] = useState(() => createStore());
  const [runResult, setRunResult] = useState(null);
  const [builtGraph, setBuiltGraph] = useState(null);
  const [evalOutcome, setEvalOutcome] = useState(null);
  const sessionId = useSession(problem.id);
  const trace = useTrace(sessionId);
  const record = (d) => setGrading((s) => recordDecision(s, d));

  const screenEl =
    screen === 'eval' ? (
      <EvalScreen problem={problem} sessionId={sessionId} graph={builtGraph} onDecision={record} onSubmit={(o) => { setEvalOutcome(o); setScreen('report'); }} />
    ) : screen === 'report' ? (
      <ReportScreen problem={problem} grading={grading} runResult={runResult} evalOutcome={evalOutcome} graph={builtGraph} />
    ) : (
      <BuildStage
        problem={problem}
        sessionId={sessionId}
        devAutoRun={devAutoRun}
        onDecision={record}
        onComplete={(r) => { if (r) { setRunResult(r.validation); setBuiltGraph(r.graph); } setScreen('eval'); }}
      />
    );

  return (
    <TraceProvider trace={trace} sessionId={sessionId}>
      <VoiceProvider>{screenEl}</VoiceProvider>
    </TraceProvider>
  );
}

function MainApp({ problem }) {
  const [screen, setScreen] = useState(SCREEN.STATEMENT);
  const [dissection, setDissection] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [builtGraph, setBuiltGraph] = useState(null);
  const [evalOutcome, setEvalOutcome] = useState(null);
  const [grading, setGrading] = useState(() => createStore());
  const [gradingReport, setGradingReport] = useState(false);
  const [serverReport, setServerReport] = useState(null);
  const record = (d) => setGrading((s) => recordDecision(s, d));
  const sessionId = useSession(problem.id);
  const trace = useTrace(sessionId);

  // One place for screen changes, so a new screen cannot be added without being
  // traced. The admin timeline's "who is stuck where" is built from these.
  //
  // The current screen is read from a ref rather than inside a setState updater:
  // React calls updaters twice in development strict mode, which would report
  // every transition twice.
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const goTo = useCallback((to) => {
    const from = screenRef.current;
    if (from !== to) trace('screen_transition', { from, to });
    setScreen(to);
  }, [trace]);

  return (
    <TraceProvider trace={trace} sessionId={sessionId}>
    <VoiceProvider>
    <div style={{ height: '100vh' }}>
      {screen === SCREEN.STATEMENT ? (
        <DissectionScreen
          problem={problem}
          sessionId={sessionId}
          onDecision={record}
          onComplete={(result) => {
            setDissection(result);
            goTo(SCREEN.DASHBOARD);
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
            goTo(SCREEN.EVAL);
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
            // snapping to a score — the score is replayed from this session's
            // recorded decisions and the narrative is a Claude call, so this
            // wait is real work, not a staged delay.
            setGradingReport(true);
            goTo(SCREEN.REPORT);
            trace('session_complete', {});
            fetchReport(sessionId)
              .then((r) => setServerReport(r))
              .finally(() => setGradingReport(false));
          }}
        />
      ) : null}

      {screen === SCREEN.REPORT && gradingReport ? <GradingLoader /> : null}

      {screen === SCREEN.REPORT && !gradingReport ? (
        <ReportScreen problem={problem} grading={grading} dissection={dissection} runResult={runResult} evalOutcome={evalOutcome} graph={builtGraph} serverReport={serverReport} />
      ) : null}
    </div>
    </VoiceProvider>
    </TraceProvider>
  );
}
