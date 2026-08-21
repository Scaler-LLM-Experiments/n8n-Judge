// app/src/App.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { fetchProblemList, fetchProblem, slugFromUrl, writeSlugToUrl } from './data/problemsApi.js';
import { AsyncGate } from './components/AsyncGate.jsx';
import { GradingLoader } from './components/GradingLoader.jsx';
import { useExperienceRating } from './lib/useExperienceRating.js';
import { createSession, fetchReport, fetchResumable } from './lib/grader.js';
import { useTrace } from './lib/useTrace.js';
import { TraceProvider } from './lib/TraceContext.jsx';
import { VoiceProvider, useVoiceActions } from './lib/VoiceContext.jsx';
import { AskIrisProvider } from './lib/AskIrisContext.jsx';
import { VoiceoverIndicator } from './components/VoiceoverIndicator.jsx';
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

// How long the grading loader stays up at minimum. The score itself is usually
// back in well under a second, so this is not a wait for the server — it is the
// window in which the rating question is on screen and answerable. Learners were
// not answering it on the Result screen; they have their marks by then.
const RATING_WINDOW_MS = 10000;

// The most the loader will hold PAST that window for someone who is mid-sentence
// in the comment box. It is a cap, not a target: without one, the hold was keyed
// on focus and focus never ends by itself, so the loader could sit there for as
// long as the tab was open. Nothing is lost when it expires — the same widget,
// holding the same words, continues on the Result screen.
const RATING_GRACE_MS = 20000;

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

  // Ask Iris is opened from TopBar and from a click on the journey mascot; the
  // provider has to wrap every screen that mounts either of those.
  let body = <Landing />;

  // startsWith, not equality: `#playground?problem=lead-triage` fell through to
  // Landing, so the route silently ignored the problem you asked for.
  if (hash.startsWith('#playground')) {
    body = <div style={{ height: '100vh' }}><PlaygroundScreen /></div>;
  } else if (hash.startsWith('#build')) {
    body = <DevProblem>{(problem) => <BuildPreview problem={problem} />}</DevProblem>;
  } else if (hash.startsWith('#run-story')) {
    body = <DevProblem>{(problem) => <BuildPreview problem={problem} devAutoRun />}</DevProblem>;
  } else if (hash.startsWith('#eval-demo')) {
    body = <DevProblem>{(problem) => <EvalScreen problem={problem} onSubmit={() => {}} onDecision={() => {}} />}</DevProblem>;
  } else if (hash.startsWith('#run-demo')) {
    body = (
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
  } else if (hash.startsWith('#loader-demo')) {
    // The grading loader WITH the rating widget in it, which is otherwise only
    // reachable by finishing a whole journey. It is the screen where the rating is
    // actually answered, so it needs to be inspectable on its own — the same reason
    // every other screen has a dev route.
    body = (
      <DevProblem>
        {(problem) => <LoaderDemo problem={problem} />}
      </DevProblem>
    );
  } else if (hash.startsWith('#report-demo')) {
    // startsWith, not equality: `#report-demo?problem=lead-triage` silently fell
    // through to Landing before, so smoke's three report-demo checks were all
    // rendering email-triage.
    body = (
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
          // A representative server payload, so this route exercises the marks
          // total, the phase breakdown and Claude's three written sections. The
          // live route needs a session and an API key; without a fixture here
          // those branches would render nowhere and smoke could not catch a
          // break in them.
          return (
            <ReportScreen
              problem={problem}
              grading={s}
              serverReport={DEMO_SERVER_REPORT}
              // Handlers so the sticky action bar renders here too — it is the
              // screen's own furniture and a review of this route should show it.
              // Catalogue navigation belongs to Landing, which this route bypasses,
              // so "next" is a stand-in label and both it and "home" simply leave
              // the dev route.
              nextProblem={{ id: 'next', title: 'the next challenge' }}
              onRedo={() => window.location.reload()}
              onNext={() => { window.location.hash = ''; }}
              onHome={() => { window.location.hash = ''; }}
            />
          );
        }}
      </DevProblem>
    );
  }

  return <AskIrisProvider>{body}</AskIrisProvider>;
}

// Home → pick a problem → run its full journey. The home cards carry only
// card-level fields, so selecting one fetches that problem's full data before
// the journey mounts. Selecting remounts MainApp fresh.
function Landing() {
  // A challenge is linkable: `/?problem=<slug>` opens it instead of Home, so one
  // can be sent to a learner ("try this one"). Read once, at mount, because from
  // then on the address bar is written from state rather than the other way round
  // — except on Back/Forward, handled below.
  //
  // A slug that names nothing published is NOT trusted here: `fetchProblem` 404s
  // and the catalogue effect below sends them to Home.
  const [selected, setSelected] = useState(() => {
    const slug = slugFromUrl();
    return slug ? { slug, id: slug, title: null } : null;
  });
  // A URL-opened challenge is normally a refresh or a shared deep link. Check
  // for this learner's saved attempt before deciding whether it is a fresh run.
  const [openMode, setOpenMode] = useState(() => (slugFromUrl() ? 'auto' : 'fresh'));
  // Bumped by "Redo this challenge", and part of MainApp's key: a redo has to be a
  // FRESH attempt, and everything that makes an attempt — the session, the local
  // grading store, which screen you are on — lives in MainApp's state. Remounting
  // is the honest way to reset all of it at once. The server cooperates: reaching
  // the Result marked the old session COMPLETED, so the next POST /api/sessions
  // opens a new row instead of handing back the finished one.
  const [attempt, setAttempt] = useState(0);
  // The catalogue, remembered when the learner leaves Home, so the Result screen
  // can name the next challenge. A ref, not state: it is read in a handler and
  // nothing re-renders when it changes.
  const catalogue = useRef(null);
  // The attempt already open. Its card on Home swaps Start for Start over /
  // Resume; there is no banner above the grid any more. Fetched once on Home
  // rather than passed down from anywhere: it is a property of the learner, not
  // of the catalogue.
  const [resume, setResume] = useState(null);
  // Set only when the learner takes the offer, so a normal "start this challenge"
  // never restores a stale screen or canvas.
  const [resuming, setResuming] = useState(null);

  useEffect(() => {
    if (selected) return undefined;
    let cancelled = false;
    fetchResumable()
      .then((r) => { if (!cancelled) setResume(r); })
      // Home can still show the catalogue if the optional continue card fails.
      .catch(() => { if (!cancelled) setResume(null); });
    return () => { cancelled = true; };
    // Re-asked whenever the learner comes back to Home, because by then the answer
    // has usually changed.
  }, [selected]);

  // Everything that opens or closes a challenge goes through here, so the address
  // bar cannot drift out of step with the screen. `silent` is for a change that
  // came FROM the URL (Back/Forward): writing it again would push a duplicate
  // entry and make the button stop working.
  const open = useCallback((p, { silent = false, resume: resumePayload = null } = {}) => {
    setResuming(resumePayload);
    setOpenMode(p ? (resumePayload ? 'resume' : 'fresh') : 'fresh');
    setSelected(p);
    if (!silent) writeSlugToUrl(p ? (p.slug ?? p.id) : null);
  }, []);

  // Back and Forward now mean something, because the URL finally says which
  // challenge is open. The URL is the source of truth on a pop — re-read it
  // rather than keeping a second history of our own.
  useEffect(() => {
    const onPop = () => {
      const slug = slugFromUrl();
      setResuming(null);
      setOpenMode(slug ? 'auto' : 'fresh');
      setSelected((cur) => {
        if (slug === (cur ? cur.slug ?? cur.id : null)) return cur;
        if (!slug) return null;
        return (catalogue.current || []).find((p) => (p.slug ?? p.id) === slug)
          ?? { slug, id: slug, title: null };
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // A deep link skips Home, so the catalogue was never loaded — and the Result
  // screen reads it to name the next challenge. Fetch it in the background and
  // upgrade `selected` to the real card, which also gives the loader a title to
  // show. Same slug, so nothing reloads.
  //
  // If the list does not contain the slug, the link is wrong (a typo, or a
  // challenge that has since been removed) and this returns them to Home with the
  // param stripped. That is not a silent fallback to different content — there is
  // no content to serve, and the catalogue is proof rather than a guess.
  useEffect(() => {
    if (!selected || catalogue.current) return undefined;
    const slug = selected.slug ?? selected.id;
    let cancelled = false;
    fetchProblemList()
      .then((list) => {
        if (cancelled) return;
        catalogue.current = list;
        const entry = list.find((p) => (p.slug ?? p.id) === slug);
        if (entry) setSelected(entry);
        else open(null);
      })
      // Home is not on screen, so a failed list costs only the "next challenge"
      // button. The journey itself loads from its own request.
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selected, open]);

  if (selected) {
    const slug = selected.slug ?? selected.id;
    const list = catalogue.current || [];
    const here = list.findIndex((p) => (p.slug ?? p.id) === slug);
    // Registry order is the catalogue order, so "next" is simply the next card.
    // Null on the last challenge (and when the list was never loaded, e.g. a
    // deep link), which hides the button rather than looping the learner back to
    // the first one as if it were new.
    const nextProblem = here >= 0 && here < list.length - 1 ? list[here + 1] : null;
    return (
      <div style={{ height: '100vh' }}>
        <AsyncGate
          load={async () => {
            const [problem, autoResume] = await Promise.all([
              fetchProblem(slug),
              openMode === 'auto' ? fetchResumable(slug) : Promise.resolve(null),
            ]);
            return { problem, autoResume };
          }}
          deps={[slug, openMode]}
          // A deep link knows the slug but not the title until the catalogue
          // lands, and "Loading undefined…" is worse than saying nothing.
          label={selected.title ? `Loading ${selected.title}…` : 'Loading challenge…'}
        >
          {({ problem, autoResume }) => {
            const resumePayload = openMode === 'auto' ? autoResume : resuming;
            const matchingResume = resumePayload?.slug === (problem.slug ?? problem.id)
              ? resumePayload
              : null;
            return (
              <MainApp
                key={`${problem.id}:${attempt}:${openMode}:${matchingResume?.sessionId ?? ''}`}
                problem={problem}
                nextProblem={nextProblem}
                // Only honoured when this problem IS the resumed one, so picking a
                // different challenge from the grid can never inherit its state.
                resume={matchingResume}
                restart={openMode === 'fresh'}
                onRedo={() => { setResuming(null); setOpenMode('fresh'); setAttempt((n) => n + 1); }}
                onNext={nextProblem ? () => { setAttempt(0); open(nextProblem); } : undefined}
                onHome={() => { setAttempt(0); open(null); }}
              />
            );
          }}
        </AsyncGate>
      </div>
    );
  }

  return (
    <AsyncGate load={fetchProblemList} label="Loading challenges…">
      {(problems) => (
        <HomeScreen
          problems={problems}
          resume={resume}
          onSelect={(p) => { catalogue.current = problems; open(p); }}
          onResume={(r) => {
            catalogue.current = problems;
            // Match the catalogue entry so the journey gets the same object shape a
            // card click produces; fall back to the resume payload itself, which
            // carries the slug and title the loader needs.
            const entry = problems.find((p) => (p.slug ?? p.id) === r.slug)
              ?? { slug: r.slug, id: r.slug, title: r.title };
            open(entry, { resume: r });
          }}
          onRestart={(r) => {
            if (!window.confirm('Start a new attempt? Your current attempt will stay in history as abandoned.')) return;
            catalogue.current = problems;
            const entry = problems.find((p) => (p.slug ?? p.id) === r.slug) ?? r;
            open(entry);
          }}
        />
      )}
    </AsyncGate>
  );
}

// The loader as the journey shows it, for the #loader-demo route.
//
// It creates a REAL session, for the same reason #build does: `saveFeedback` only
// POSTs when there is one, so a session-less demo exercises localStorage and
// nothing else — it would look identical whether or not the backend write worked.
function LoaderDemo({ problem }) {
  const sessionId = useSession(problem.id);
  const experience = useExperienceRating({ sessionId, problemId: problem.id });
  return <GradingLoader experience={experience.props} />;
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
function useSession(problemId, { restart = false } = {}) {
  const [sessionId, setSessionId] = useState(null);
  const request = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const key = `${problemId}:${restart}`;
    if (request.current?.key !== key) {
      request.current = { key, promise: createSession(problemId, { restart }) };
    }
    request.current.promise
      .then((s) => { if (!cancelled) setSessionId(s.sessionId); })
      .catch((err) => console.error('[session] could not start:', err));
    return () => { cancelled = true; };
  }, [problemId, restart]);
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
      <EvalScreen problem={problem} sessionId={sessionId} onDecision={record} onSubmit={(o) => { setEvalOutcome(o); setScreen('report'); }} />
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
      <VoiceProvider problem={problem}>
        {screenEl}
        <VoiceoverIndicator />
      </VoiceProvider>
    </TraceProvider>
  );
}

// Which screens it is honest to drop a learner back onto.
//
// `report` is excluded: the session is still IN_PROGRESS, so nothing has been graded
// yet and landing there would fetch a report for an unfinished attempt. The other
// three are safe, including Build — the canvas is restored from the trace, and
// re-verifying a field the learner already got right cannot cost them marks, because
// `attemptsFromTrace` keeps the LOWEST attempt that was correct.
const RESUMABLE_SCREENS = new Set([SCREEN.STATEMENT, SCREEN.DASHBOARD, SCREEN.EVAL]);

function MainApp({ problem, nextProblem, resume, restart = false, onRedo, onNext, onHome }) {
  const [screen, setScreen] = useState(
    resume && RESUMABLE_SCREENS.has(resume.screen) ? resume.screen : SCREEN.STATEMENT
  );
  const [dissection, setDissection] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [builtGraph, setBuiltGraph] = useState(null);
  const [evalOutcome, setEvalOutcome] = useState(null);
  const [grading, setGrading] = useState(() => createStore());
  // The loader is no longer just a wait — it is where the rating gets asked for,
  // because almost nobody answers it on the Result screen: by then they have their
  // score and they are done. So the loader stays up for a beat even when the score
  // is already in hand, and it does NOT close while they are still typing.
  const [gradingReport, setGradingReport] = useState(false);
  const [scoreReady, setScoreReady] = useState(false);
  const [minHeld, setMinHeld] = useState(false);
  // The end of the mid-sentence grace period. Set by the same timer that opens the
  // window, so both live in one place and neither depends on an effect firing.
  const [graceOver, setGraceOver] = useState(false);
  const [serverReport, setServerReport] = useState(null);
  const record = (d) => setGrading((s) => recordDecision(s, d));
  const sessionId = useSession(problem.id, { restart });
  // One rating, collected in the loader and (only if still unanswered) on the
  // report. Shared state, so a star clicked during the wait is already theirs.
  const experience = useExperienceRating({ sessionId, problemId: problem.id });

  // Three conditions before the report paints: the score has arrived, the rating
  // window has elapsed, and they are not mid-sentence in the comment box. The last
  // one is BOUNDED by `graceOver`, which is the bug this had: `writing` ends on
  // blur, and a focused box that is never clicked out of never blurs, so the
  // loader waited for a comment that might never come. The cap makes the hold a
  // courtesy rather than a gate.
  const showLoader =
    gradingReport && (!scoreReady || !minHeld || (experience.writing && !graceOver));
  // Whether the report asks for the rating, decided ONCE as the loader closes and
  // then held for the life of the screen. It has to be a latch: read live, the
  // widget would unmount the moment they press Send, taking the "your feedback is
  // saved" confirmation with it and reading as a crash. Null means not decided
  // yet, which is only the render the report first paints on.
  const [askOnReport, setAskOnReport] = useState(null);
  const askExperience = askOnReport ?? !experience.complete;
  useEffect(() => {
    if (screen === SCREEN.REPORT && !showLoader && askOnReport === null) {
      setAskOnReport(!experience.complete);
    }
  }, [screen, showLoader, askOnReport, experience.complete]);
  const trace = useTrace(sessionId);

  // One place for screen changes, so a new screen cannot be added without being
  // traced. The admin timeline's "who is stuck where" is built from these.
  //
  // The current screen is read from a ref rather than inside a setState updater:
  // React calls updaters twice in development strict mode, which would report
  // every transition twice.
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const voice = useVoiceActions();
  const goTo = useCallback((to) => {
    const from = screenRef.current;
    if (from !== to) {
      trace('screen_transition', { from, to });
      // Cut whatever Iris was saying. It was about the screen being left, so
      // finishing it would narrate something the learner can no longer see, and
      // delay the line that belongs to where they actually are.
      voice.stop();
    }
    setScreen(to);
  }, [trace, voice]);

  return (
    <TraceProvider trace={trace} sessionId={sessionId}>
    <VoiceProvider problem={problem}>
    <div style={{ height: '100vh' }}>
      {screen === SCREEN.STATEMENT ? (
        <DissectionScreen
          problem={problem}
          sessionId={sessionId}
          // Their own answers, replayed from the trace: the quiz rejoins at the
          // first unanswered question instead of asking all of them again.
          resume={
            resume
              ? { answered: resume.answered?.dissection ?? [], unlockedTypes: resume.unlockedTypes ?? [] }
              : null
          }
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
          // The canvas they left behind, from the last `graph_mutation` in the
          // trace. Undefined on a fresh start, which is the normal case.
          initialGraph={resume?.graph ?? undefined}
          // …and the phase they were on when they left. Without it the restored
          // canvas re-clears every earlier phase in turn.
          resumePhaseId={resume?.phaseId ?? undefined}
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
          // Stress questions already on record, so a reload mid-quiz picks up at
          // the next one rather than the first.
          resume={resume ? { answered: resume.answered?.stress ?? [] } : null}
          onDecision={record}
          onSubmit={(outcome) => {
            setEvalOutcome(outcome);
            // Hold on a loader while the report is put together, rather than
            // snapping to a score — the score is replayed from this session's
            // recorded decisions and the narrative is a Claude call, so this
            // wait is real work, not a staged delay.
            setGradingReport(true);
            setScoreReady(false);
            setMinHeld(false);
            setGraceOver(false);
            // Long enough to read the question and click a star. Deliberate: the
            // score is usually back in milliseconds, and closing on arrival is
            // what made this moment unusable for anything else.
            setTimeout(() => setMinHeld(true), RATING_WINDOW_MS);
            // The outer bound on the whole loader, whatever the learner is doing.
            setTimeout(() => setGraceOver(true), RATING_WINDOW_MS + RATING_GRACE_MS);
            goTo(SCREEN.REPORT);
            trace('session_complete', {});
            // Two asks, on purpose. The first skips Claude and returns the marks in
            // milliseconds, which drops the loader and paints the report. The second
            // fetches the written half and fills it in when it lands, about thirteen
            // seconds later — the learner reads their score during that wait instead
            // of watching a spinner. If the score-only call fails, the full one still
            // runs and the screen just waits, as it used to.
            fetchReport(sessionId, { narrative: false })
              .then((score) => {
                if (score) {
                  setServerReport(score);
                  setScoreReady(true);
                }
              })
              .finally(() => {
                fetchReport(sessionId)
                  .then((full) => { if (full) setServerReport(full); })
                  .finally(() => setScoreReady(true));
              });
          }}
        />
      ) : null}

      {screen === SCREEN.REPORT && showLoader ? (
        <GradingLoader experience={experience.props} />
      ) : null}

      {screen === SCREEN.REPORT && !showLoader ? (
        <ReportScreen
          problem={problem}
          grading={grading}
          serverReport={serverReport}
          // The n8n workflow download is fetched per session and gated on the
          // server-replayed score, so the screen needs the session to ask for it.
          sessionId={sessionId}
          nextProblem={nextProblem}
          // Only drop the widget once the comment has been SENT. A star alone leaves
          // the question of why unanswered, and the loader closes on a timer that is
          // shorter than a sentence — so the report carries the same state on, stars
          // filled and any draft still in the box, and asks for the words.
          experience={askExperience ? experience.props : null}
          onRedo={onRedo}
          onNext={onNext}
          onHome={onHome}
        />
      ) : null}
    </div>
    {/* One instance for the whole journey. It is position:fixed and pointer-events:
        none, so it belongs to the voice scope rather than to any single screen. */}
    <VoiceoverIndicator />
    </VoiceProvider>
    </TraceProvider>
  );
}
