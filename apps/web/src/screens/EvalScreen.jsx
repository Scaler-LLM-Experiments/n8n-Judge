import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle, XCircle, CircleNotch } from '@phosphor-icons/react';
import gsap from 'gsap';
import { Button } from '../design-system/Button.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { NodeFlowRow } from '../components/NodeFlowRow.jsx';
import { shuffledEvalOptions } from '../lib/shuffle.js';
import { useVoiceActions } from '../lib/VoiceContext.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { useMascotAskClick } from '../lib/AskIrisContext.jsx';
import { NODE_CATALOG, isRouterEntry } from '@judge/catalog';
import { scoreEval } from '@judge/engine/evalScore.js';
import { checkAnswer } from '../lib/grader.js';
import { resolveServerVerdict, UNVERIFIED_MESSAGE } from '../lib/verdict.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
// One column now, so this is a reading width rather than the old two-column grid.
const COLUMN_WIDTH = 720;

// Last-resort path, only for a problem with no usable `referenceGraph`.
const FALLBACK_PATH = [
  { type: 'trigger', label: 'New Email' },
  { type: 'classify', label: 'Classify with AI' },
  { type: 'parse', label: 'Parse Result' },
  { type: 'switch', label: 'Switch' },
  { type: 'action', label: 'Send Reply' },
];

/**
 * The flow this question is about, read from THIS problem's reference graph.
 *
 * It used to be the constant above — email-triage's nodes, hardcoded — so every
 * other case asked its Stress Testing questions over a picture of a different
 * workflow. ops-request-desk showed "New Email · Classify with AI · Parse Result"
 * to a learner who had just built a form trigger and an Information Extractor,
 * on the screen that says "Your build".
 *
 * Walks the main wire from the trigger, ignoring `ai_model` attachments (a Chat
 * Model hangs off the side, it is not a step in the story) and taking the first
 * branch at a router, since the strip is one line.
 */
function mainPath(problem, catalog) {
  const graph = problem?.referenceGraph;
  if (!graph?.nodes?.length) return FALLBACK_PATH;
  const byId = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));
  const mainEdges = (graph.edges ?? []).filter((e) => e.targetHandle !== 'ai_model');
  const start =
    graph.nodes.find((n) => catalog[n.type]?.category === 'trigger') ?? graph.nodes[0];

  const path = [];
  const seen = new Set();
  let cur = start;
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    path.push({ type: cur.type, label: catalog[cur.type]?.label ?? cur.type });
    const next = mainEdges.find((e) => e.source === cur.id);
    cur = next ? byId[next.target] : null;
  }
  return path.length ? path : FALLBACK_PATH;
}

/**
 * The shared, pre-branch stretch — the question's context before answering. It
 * stops at the router, before the case-specific outcome, so it grounds the
 * question in the learner's real build without giving away the answer: the
 * outcome is described in the written verdict, not acted out on the canvas.
 */
function basePath(path, catalog) {
  const at = path.findIndex((n) => isRouterEntry(catalog[n.type] ?? {}));
  return at === -1 ? path.slice(0, -1) : path.slice(0, at + 1);
}

// Turn a checkAnswer() response into the verdict this screen renders. The
// local `q.correctIndex` / `q.explanation` fields are only a fallback for when
// the server can't be reached (no session yet, e.g. the #eval-demo dev
// route) — never a substitute once the server has actually answered, since
// those fields are being stripped from the payload the client is served.
function resolveVerdict(q, chosen, result) {
  // Same rule as Understand: the server is the only source of a verdict, and a
  // check that did not answer yields `correct: null`. This used to return
  // `correct: true`, so a failed check marked every answer right.
  if (result || q.correctIndex === undefined) return resolveServerVerdict(result);
  return { correct: !!chosen?.correct, why: q.explanation ?? null, verified: true };
}

// No `graph` prop any more: the only thing that needed the learner's built graph
// here was the post-answer NodeReplay, which is gone.
/**
 * `resume` is this learner's own progress from their trace:
 * `{ answered: string[] }` — the stress questions already on record. Absent on a
 * fresh start.
 */
export function EvalScreen({ problem, sessionId, onDecision, onSubmit, resume }) {
  const voice = useVoiceActions();
  const said = useRef(false);
  useEffect(() => {
    if (said.current) return;
    said.current = true;
    voice.play('stress_start');
  }, [voice]);
  const questions = problem.evalQuestions;
  // Rejoin at the first question with no answer on record. One answer per
  // question is all this screen takes, so anything answered is behind them —
  // asking again would be a second attempt at something already graded.
  const [index, setIndex] = useState(() => {
    const answered = new Set(resume?.answered ?? []);
    if (!answered.size) return 0;
    const at = questions.findIndex((q) => !answered.has(q.id));
    // Every question answered and still here means they left on the last verdict
    // rather than pressing "See Report": show it again instead of an empty screen.
    return at === -1 ? Math.max(questions.length - 1, 0) : at;
  });
  const [picked, setPicked] = useState(null);
  const [checking, setChecking] = useState(false); // request for `picked` in flight
  const [verdict, setVerdict] = useState(null); // settled { correct, why } for `picked`
  const [answers, setAnswers] = useState({});
  const [mascotBaseClip, setMascotBaseClip] = useState('idle');
  const {
    clip: mascotClip,
    once: mascotOnce,
    onMascotClick,
    onMascotKeyDown,
    onReactDone: onMascotReactDone,
  } = useMascotAskClick(mascotBaseClip);
  const [showStatement, setShowStatement] = useState(false);
  const quizRef = useRef(null);

  const q = questions[index];
  // Displayed options are shuffled; each carries its authored position so
  // grading (which compares against q.correctIndex) is unaffected. `picked` is
  // a position in THIS array, never the authored index.
  const opts = useMemo(() => shuffledEvalOptions(q, `stress:${q.id}`), [q]);
  // "answered" = settled (verdict landed); "pending" = picked but awaiting the
  // server. Only `answered` reveals the replay/explanation and unlocks Continue.
  const pending = picked !== null && checking;
  const answered = picked !== null && !checking && verdict !== null;
  const isCorrect = verdict?.correct ?? false;

  // Still resolved, because it decides whether the strip shows the learner's own
  // build or the fixed reference path. It no longer drives a replay.
  const sampleCase = q.caseId ? problem.sampleCases.find((c) => c.id === q.caseId) : null;

  // This problem's own flow, not a constant. Memoised on the graph, since it walks it.
  const shownPath = useMemo(() => mainPath(problem, NODE_CATALOG), [problem]);
  const shownBasePath = useMemo(() => basePath(shownPath, NODE_CATALOG), [shownPath]);

  // staggered entrance — same pattern as DissectionScreen's QuizBody: head,
  // then options, then the canvas, each easing in in turn on every question.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-q="head"]', { y: 22, opacity: 0, duration: 0.5, ease: 'power3.out' });
      gsap.from('[data-q="opt"]', { y: 16, opacity: 0, duration: 0.45, stagger: 0.07, delay: 0.12, ease: 'power2.out' });
      gsap.from('[data-q="canvas"]', { x: -18, opacity: 0, duration: 0.5, delay: 0.12, ease: 'power2.out' });
    }, quizRef);
    return () => ctx.revert();
  }, [index]);

  const pick = async (i) => {
    if (checking) return; // one in-flight check at a time
    // `answered` only blocks once a real verdict landed — a failed check must not
    // strand the learner on a question they can never answer.
    if (answered && verdict?.correct !== null) return;
    const chosen = opts[i];
    setPicked(i); // select immediately — the verdict settles asynchronously
    setVerdict(null);
    // Store the authored index right away — scoreEval grades against
    // q.correctIndex, and this mapping doesn't depend on the server round trip.
    setAnswers((a) => ({ ...a, [q.id]: chosen?.originalIndex ?? -1 }));
    setChecking(true);
    // The server is sent the option TEXT, not an index — display order is
    // shuffled per session, so an index would mean nothing to it.
    const result = await checkAnswer(sessionId, 'stress', q.id, chosen?.label);
    const resolved = resolveVerdict(q, chosen, result);
    setChecking(false);
    setVerdict(resolved);
    setMascotBaseClip(resolved.correct === true ? 'correct' : resolved.correct === false ? 'shake-no' : 'idle');
    // Stress Testing used to go silent after `stress_start`, so the one section that
    // is entirely about judgement gave no spoken reaction to any answer. Keyed by
    // question, so re-answering rotates the wording rather than repeating it. Nothing
    // is said when the check did not complete (`correct: null`) — see verdict.js.
    if (resolved.correct === true) voice.play('stress_correct', { key: q.id, scope: `stress:${q.id}` });
    else if (resolved.correct === false) voice.play('stress_wrong', { key: q.id, scope: `stress:${q.id}` });
    if (onDecision && resolved.correct !== null) {
      onDecision({
        id: `stress:${q.id}`,
        kind: 'stress',
        label: q.prompt,
        correct: resolved.correct,
        firstTry: result?.firstTry ?? true,
        chosenLabel: chosen?.label,
        correctLabel: q.options?.[q.correctIndex],
      });
    }
  };

  const advance = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      setVerdict(null);
      setMascotBaseClip('idle');
    } else {
      onSubmit(scoreEval(answers, questions));
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar activeStage="eval" problem={problem} onShowProblemStatement={() => setShowStatement(true)} />
      {/* spinner for the "checking your answer" state while awaiting the server */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }
      `}</style>
      {/* One column, in reading order: what this section is for, which question
          you are on, the question, the flow it is about, the options, then the
          verdict. The node strip used to sit in a left column BESIDE the options,
          which made the question and the flow it refers to compete for the same
          glance. */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: answered ? '40px 24px 130px' : '40px 24px 56px' }}>
        {/* Outside the per-question container on purpose: this describes the
            SECTION, so it must not re-animate on every question. */}
        {/* Just the section name. The explanation underneath it said what the whole
            screen already demonstrates, and pushed the actual question below the fold
            on a laptop. Secondary colour, not brand blue: this is a label, and blue is
            the colour of things you click. */}
        <div style={{ width: '100%', maxWidth: COLUMN_WIDTH, textAlign: 'center', marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid var(--border-subtle)' }}>
          {/* A medium title, not an eyebrow: it names the section a learner has just
              arrived at, so it should read at title weight. Secondary colour keeps it
              from competing with the question, which is the thing to actually read. */}
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: 20, fontWeight: 600, color: 'var(--fg-2)' }}>
            Stress Testing
          </div>
        </div>

        <div key={index} ref={quizRef} style={{ width: '100%', maxWidth: COLUMN_WIDTH }}>
          <div data-q="head" style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 10 }}>
              Question {index + 1} of {questions.length}
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.35, maxWidth: 640, margin: '0 auto' }}>{q.prompt}</div>
          </div>

          {/* The flow the question is about, directly under it */}
          <div data-q="canvas" style={{ border: '1px solid var(--border-strong)', background: '#E9ECF2', backgroundImage: 'radial-gradient(#C4CAD4 1px, transparent 1px)', backgroundSize: '16px 16px', padding: '18px', marginBottom: 22 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 4 }}>
              {sampleCase ? 'Your build' : 'The fixed path'}
            </div>
            <NodeFlowRow items={sampleCase ? shownBasePath : shownPath} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {opts.map((opt, i) => {
              const state = picked === i ? (pending ? 'pending' : isCorrect ? 'correct' : 'wrong') : 'idle';
              const dim = answered && picked !== i;
              return (
                <div key={opt.originalIndex} data-q="opt">
                  <OptionRow letter={LETTERS[i]} label={opt.label} state={state} dim={dim} disabled={pending || answered} onClick={() => pick(i)} />
                </div>
              );
            })}
          </div>

          {pending ? (
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', border: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
              <CircleNotch size={18} weight="bold" color="var(--fg-3)" className="spin" />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Checking your answer…</div>
            </div>
          ) : null}

          {answered ? (
            <div style={{ marginTop: 18, display: 'flex', gap: 10, padding: '13px 15px', border: `1px solid ${isCorrect ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`, background: isCorrect ? 'var(--status-success-bg)' : 'var(--status-danger-bg)' }}>
              {isCorrect ? <CheckCircle size={18} weight="fill" color="var(--status-success)" style={{ flex: 'none', marginTop: 1 }} /> : <XCircle size={18} weight="fill" color="var(--status-danger)" style={{ flex: 'none', marginTop: 1 }} />}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? 'var(--status-success)' : 'var(--status-danger)', marginBottom: 3 }}>
                  {isCorrect ? 'Correct' : 'Not quite'}
                </div>
                {/* The server sends the same explanation regardless of which
                    option was picked — it never hands back the correct
                    option's text for a wrong pick, only the reasoning. */}
                <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>{verdict?.why ?? (isCorrect ? 'That tracks.' : 'Read the explanation and think about where that case ends up.')}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Fixed footer for the advance action — never gets pushed off-screen by
          a tall question (node canvas + explanation + full replay reveal). */}
      {answered ? (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40, display: 'flex', justifyContent: 'center', padding: '16px 24px', background: 'var(--surface-0)', borderTop: '1px solid var(--border-subtle)' }}>
          <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={advance}>
            {index + 1 < questions.length ? 'Continue' : 'See Report'}
          </Button>
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        title="Ask Iris"
        onClick={onMascotClick}
        onKeyDown={onMascotKeyDown}
        style={{ position: 'fixed', left: 28, bottom: answered ? 96 : 24, width: 118, height: 118, zIndex: 50, pointerEvents: 'auto', cursor: 'pointer', transition: 'bottom 0.2s ease' }}
      >
        <MascotPlayer clip={mascotClip} once={mascotOnce || mascotBaseClip !== 'idle'} onceDone={onMascotReactDone} />
      </div>

      {showStatement && problem ? <ProblemStatementPanel problem={problem} onClose={() => setShowStatement(false)} /> : null}
    </div>
  );
}

function OptionRow({ letter, label, state, dim, disabled, onClick }) {
  // 'pending' = picked, awaiting the server — neutral (not yet green/red), but
  // visibly selected so the click doesn't feel dropped.
  const border = state === 'correct' ? 'var(--status-success)' : state === 'wrong' ? 'var(--status-danger)' : state === 'pending' ? 'var(--fg-3)' : 'var(--border-subtle)';
  const bg = state === 'correct' ? 'var(--status-success-bg)' : state === 'wrong' ? 'var(--status-danger-bg)' : state === 'pending' ? 'var(--surface-1)' : 'var(--surface-0)';
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
      {state === 'pending' ? <CircleNotch size={15} weight="bold" color="var(--fg-3)" className="spin" /> : null}
    </button>
  );
}
