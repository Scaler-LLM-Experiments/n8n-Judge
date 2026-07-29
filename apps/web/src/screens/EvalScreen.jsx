import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle, XCircle, CircleNotch } from '@phosphor-icons/react';
import gsap from 'gsap';
import { Button } from '../design-system/Button.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { NodeFlowRow } from '../components/NodeFlowRow.jsx';
import { NodeReplay } from '../components/NodeReplay.jsx';
import { shuffledEvalOptions } from '../lib/shuffle.js';
import { useVoice } from '../lib/VoiceContext.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { simulateCase } from '@judge/engine/simulate.js';
import { scoreEval } from '@judge/engine/evalScore.js';
import { checkAnswer } from '../lib/grader.js';
import { resolveServerVerdict, UNVERIFIED_MESSAGE } from '../lib/verdict.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const GRID_WIDTH = 1040;

// The fixed reference path, shown as real connected nodes for questions with
// no matching sample case to replay (e.g. a design-reasoning question).
const REFERENCE_PATH = [
  { type: 'trigger', label: 'New Email' },
  { type: 'classify', label: 'Classify with AI' },
  { type: 'parse', label: 'Parse Result' },
  { type: 'switch', label: 'Switch' },
  { type: 'action', label: 'Send Reply' },
];

// The shared, pre-branch stretch of the build — shown as the question's own
// context before answering. It stops at Switch, before the case-specific
// outcome, so it grounds the question in the learner's real build without
// giving away the answer (the outcome only reveals via NodeReplay post-pick).
const BASE_PATH = REFERENCE_PATH.slice(0, 4);

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

export function EvalScreen({ problem, sessionId, graph, onDecision, onSubmit }) {
  const voice = useVoice();
  const said = useRef(false);
  useEffect(() => {
    if (said.current) return;
    said.current = true;
    voice.play('stress_start');
  }, [voice]);
  const questions = problem.evalQuestions;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [checking, setChecking] = useState(false); // request for `picked` in flight
  const [verdict, setVerdict] = useState(null); // settled { correct, why } for `picked`
  const [answers, setAnswers] = useState({});
  const [mascotClip, setMascotClip] = useState('idle');
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

  const sampleCase = q.caseId ? problem.sampleCases.find((c) => c.id === q.caseId) : null;
  const replaySteps = answered && sampleCase && graph ? simulateCase(graph, sampleCase).steps : null;

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
    setMascotClip(resolved.correct === true ? 'correct' : resolved.correct === false ? 'shake-no' : 'idle');
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
      setMascotClip('idle');
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
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', display: 'flex', justifyContent: 'center', padding: answered ? '56px 24px 130px' : '56px 24px 56px' }}>
        <div key={index} ref={quizRef} style={{ width: '100%', maxWidth: GRID_WIDTH }}>
          <div data-q="head" style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 10 }}>
              Question {index + 1} of {questions.length}
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.35, maxWidth: 640, margin: '0 auto' }}>{q.prompt}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
            {/* LEFT COLUMN: the node canvas, live replay, and (once answered) the explanation */}
            <div data-q="canvas">
              <div style={{ border: '1px solid var(--border-strong)', background: '#E9ECF2', backgroundImage: 'radial-gradient(#C4CAD4 1px, transparent 1px)', backgroundSize: '16px 16px', padding: '18px' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 4 }}>
                  {sampleCase ? 'Your build' : 'The fixed path'}
                </div>
                <NodeFlowRow items={sampleCase ? BASE_PATH : REFERENCE_PATH} />
              </div>

              {answered && replaySteps ? (
                <div style={{ marginTop: 16, border: `2px solid ${isCorrect ? 'var(--status-success)' : 'var(--status-danger)'}`, boxShadow: `0 0 0 3px ${isCorrect ? 'var(--status-success-bg)' : 'var(--status-danger-bg)'}` }}>
                  <div style={{ padding: '9px 15px', background: isCorrect ? 'var(--status-success)' : 'var(--status-danger)', color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isCorrect ? 'What actually happens — this is the answer' : 'Not what you picked — here’s what actually happens'}
                  </div>
                  <NodeReplay steps={replaySteps} label="Replaying your build — this exact case, on your graph" />
                </div>
              ) : null}

              {pending ? (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '13px 15px', border: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
                  <CircleNotch size={18} weight="bold" color="var(--fg-3)" className="spin" />
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Checking your answer…</div>
                </div>
              ) : null}

              {answered ? (
                <div style={{ marginTop: 16, display: 'flex', gap: 10, textAlign: 'left', padding: '13px 15px', border: `1px solid ${isCorrect ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`, background: isCorrect ? 'var(--status-success-bg)' : 'var(--status-danger-bg)' }}>
                  {isCorrect ? <CheckCircle size={18} weight="fill" color="var(--status-success)" style={{ flex: 'none', marginTop: 1 }} /> : <XCircle size={18} weight="fill" color="var(--status-danger)" style={{ flex: 'none', marginTop: 1 }} />}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? 'var(--status-success)' : 'var(--status-danger)', marginBottom: 3 }}>
                      {isCorrect ? 'Correct' : 'Not quite'}
                    </div>
                    {/* The server sends the same explanation regardless of which
                        option was picked — it never hands back the correct
                        option's text for a wrong pick, only the reasoning. */}
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>{verdict?.why ?? (isCorrect ? 'Nice — that tracks.' : 'Take a look at what actually happens below.')}</div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* RIGHT COLUMN: the question's options */}
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
          </div>
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

      <div style={{ position: 'fixed', left: 28, bottom: answered ? 96 : 24, width: 84, height: 84, zIndex: 50, pointerEvents: 'none', transition: 'bottom 0.2s ease' }}>
        <MascotPlayer clip={mascotClip} once={mascotClip !== 'idle'} onceDone={() => {}} />
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
