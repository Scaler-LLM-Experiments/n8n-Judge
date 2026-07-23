import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle, XCircle } from '@phosphor-icons/react';
import gsap from 'gsap';
import { Button } from '../design-system/Button.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { NodeFlowRow } from '../components/NodeFlowRow.jsx';
import { NodeReplay } from '../components/NodeReplay.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { simulateCase } from '../engine/simulate.js';
import { scoreEval } from '../engine/evalScore.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COLUMN = 620;

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

export function EvalScreen({ problem, graph, onDecision, onSubmit }) {
  const questions = problem.evalQuestions;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState({});
  const [mascotClip, setMascotClip] = useState('idle');
  const [showStatement, setShowStatement] = useState(false);
  const quizRef = useRef(null);

  const q = questions[index];
  const answered = picked !== null;
  const isCorrect = answered && picked === q.correctIndex;

  const sampleCase = q.caseId ? problem.sampleCases.find((c) => c.id === q.caseId) : null;
  const replaySteps = answered && sampleCase && graph ? simulateCase(graph, sampleCase).steps : null;

  // staggered entrance — same pattern as DissectionScreen's QuizBody: head,
  // then options, then the canvas, each easing in in turn on every question.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-q="head"]', { y: 22, opacity: 0, duration: 0.5, ease: 'power3.out' });
      gsap.from('[data-q="opt"]', { y: 16, opacity: 0, duration: 0.45, stagger: 0.07, delay: 0.12, ease: 'power2.out' });
      gsap.from('[data-q="canvas"]', { y: 18, opacity: 0, duration: 0.5, delay: 0.24, ease: 'power2.out' });
    }, quizRef);
    return () => ctx.revert();
  }, [index]);

  const pick = (i) => {
    if (answered) return;
    const correct = i === q.correctIndex;
    setPicked(i);
    setMascotClip(correct ? 'correct' : 'shake-no');
    setAnswers((a) => ({ ...a, [q.id]: i }));
    if (onDecision) {
      onDecision({
        id: `stress:${q.id}`,
        kind: 'stress',
        label: q.prompt,
        correct,
        firstTry: true,
        chosenLabel: q.options[i],
        correctLabel: q.options[q.correctIndex],
      });
    }
  };

  const advance = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      setMascotClip('idle');
    } else {
      onSubmit(scoreEval(answers, questions));
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar activeStage="eval" onShowProblemStatement={() => setShowStatement(true)} />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: answered ? '72px 24px 110px' : '72px 24px 72px' }}>
        <div key={index} ref={quizRef} style={{ width: '100%', maxWidth: COLUMN, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div data-q="head">
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 10 }}>
              Question {index + 1} of {questions.length}
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 18, lineHeight: 1.35, maxWidth: 560 }}>{q.prompt}</div>
          </div>

          <div data-q="canvas" style={{ width: '100%', marginBottom: 22, border: '1px solid var(--border-strong)', background: '#E9ECF2', backgroundImage: 'radial-gradient(#C4CAD4 1px, transparent 1px)', backgroundSize: '16px 16px', padding: '18px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 4 }}>
              {sampleCase ? 'Your build' : 'The fixed path'}
            </div>
            <NodeFlowRow items={sampleCase ? BASE_PATH : REFERENCE_PATH} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            {q.options.map((opt, i) => {
              const state = picked === i ? (isCorrect ? 'correct' : 'wrong') : 'idle';
              const dim = answered && picked !== i;
              return (
                <div key={i} data-q="opt">
                  <OptionRow letter={LETTERS[i]} label={opt} state={state} dim={dim} disabled={answered} onClick={() => pick(i)} />
                </div>
              );
            })}
          </div>

          {answered ? (
            <div style={{ width: '100%', marginTop: 18, display: 'flex', gap: 10, textAlign: 'left', padding: '13px 15px', border: `1px solid ${isCorrect ? 'var(--brand-blue-100)' : 'var(--status-danger-border)'}`, background: isCorrect ? 'var(--brand-blue-50)' : 'var(--status-danger-bg)' }}>
              {isCorrect ? <CheckCircle size={18} weight="fill" color="var(--brand-primary)" style={{ flex: 'none', marginTop: 1 }} /> : <XCircle size={18} weight="fill" color="var(--status-danger)" style={{ flex: 'none', marginTop: 1 }} />}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? 'var(--brand-primary)' : 'var(--status-danger)', marginBottom: 3 }}>
                  {isCorrect ? 'Correct' : `Not quite — the answer is "${q.options[q.correctIndex]}"`}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>{q.explanation}</div>
              </div>
            </div>
          ) : null}

          {answered && replaySteps ? (
            <div style={{ width: '100%', marginTop: 22 }}>
              <NodeReplay steps={replaySteps} label="Replaying your build — this exact case, on your graph" />
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

      <div style={{ position: 'fixed', left: 28, bottom: answered ? 96 : 24, width: 84, height: 84, zIndex: 50, pointerEvents: 'none', transition: 'bottom 0.2s ease' }}>
        <MascotPlayer clip={mascotClip} once={mascotClip !== 'idle'} onceDone={() => {}} />
      </div>

      {showStatement && problem ? <ProblemStatementPanel problem={problem} onClose={() => setShowStatement(false)} /> : null}
    </div>
  );
}

function OptionRow({ letter, label, state, dim, disabled, onClick }) {
  const border = state === 'correct' ? 'var(--brand-primary)' : state === 'wrong' ? 'var(--status-danger)' : 'var(--border-subtle)';
  const bg = state === 'correct' ? 'var(--brand-blue-50)' : state === 'wrong' ? 'var(--status-danger-bg)' : 'var(--surface-0)';
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
    </button>
  );
}
