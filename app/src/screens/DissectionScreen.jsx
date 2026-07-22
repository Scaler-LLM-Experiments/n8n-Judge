import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { CheckCircle, XCircle, ArrowRight, ArrowClockwise, CaretRight, Note } from '@phosphor-icons/react';
import { Button } from '../design-system/Button.jsx';
import { RadioGroup } from '../design-system/RadioGroup.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ConceptFlow } from '../components/ConceptFlow.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { N8nNodeView } from '../n8n/N8nNodeView.jsx';
import { nodeIcons, nodeIconColor, categoryMeta, typeCategory } from '../nodes/nodeIcons.js';

const LEARNER_NAME = 'Aarav'; // placeholder for the prototype
const COLUMN = 640;

export function DissectionScreen({ problem, onComplete }) {
  const questions = problem.dissection;
  const [phase, setPhase] = useState('intro');
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState(undefined);
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(() => questions.map(() => 0));
  const [answered, setAnswered] = useState(() => questions.map(() => false));
  const [mascotClip, setMascotClip] = useState('idle');
  const [panelOpen, setPanelOpen] = useState(true);
  const advanceTimer = useRef(null);

  const q = questions[index];
  const displayType = q?.unlocks[0];
  const isCorrect = checked && Number(choice) === q.correctIndex;
  const unlockedTypes = [...new Set(questions.flatMap((x) => x.unlocks))];

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const check = () => {
    const correct = Number(choice) === q.correctIndex;
    setChecked(true);
    setMascotClip(correct ? 'correct' : 'shake-no');
    if (!correct) {
      setAttempts((a) => a.map((v, i) => (i === index ? v + 1 : v)));
      return;
    }
    setAnswered((a) => a.map((v, i) => (i === index ? true : v)));
    advanceTimer.current = setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex(index + 1);
        setChoice(undefined);
        setChecked(false);
        setMascotClip('idle');
      } else {
        setPhase('done');
      }
    }, 1500);
  };

  const retry = () => {
    setChecked(false);
    setChoice(undefined);
    setMascotClip('idle');
  };

  if (phase === 'intro') return <Intro problem={problem} onContinue={() => setPhase('quiz')} />;
  if (phase === 'done') return <Done problem={problem} unlockedTypes={unlockedTypes} onFinish={() => onComplete({ attempts, unlockedTypes })} />;

  // ---------- QUIZ ----------
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F5F6F8' }}>
      <TopBar activeStage="statement" />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 24px 48px' }}>
        {/* stage + mascot */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'var(--surface-0)', border: '1px solid var(--border-subtle)', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand-primary)', marginBottom: 10 }}>
          Stage 1 · Dissect the problem
        </div>
        <div style={{ width: 76, height: 76, marginBottom: 6 }}>
          <MascotPlayer clip={mascotClip} once={mascotClip !== 'idle'} onceDone={() => {}} />
        </div>

        <QuizBody
          q={q}
          index={index}
          total={questions.length}
          answered={answered}
          choice={choice}
          checked={checked}
          isCorrect={isCorrect}
          displayType={displayType}
          displayLabel={labelForType(problem, displayType)}
          onChoose={(v) => !isCorrect && setChoice(v)}
          onCheck={check}
          onRetry={retry}
        />
      </div>

      <SidePanel problem={problem} open={panelOpen} onToggle={() => setPanelOpen((o) => !o)} />
    </div>
  );
}

function QuizBody({ q, index, total, answered, choice, checked, isCorrect, displayType, displayLabel, onChoose, onCheck, onRetry }) {
  const qRef = useRef(null);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (qRef.current) gsap.fromTo(qRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
  }, [index]);

  useEffect(() => {
    if (isCorrect && nodeRef.current) gsap.fromTo(nodeRef.current, { scale: 0.82 }, { scale: 1, duration: 0.5, ease: 'back.out(2)' });
  }, [isCorrect]);

  return (
    <div style={{ width: '100%', maxWidth: COLUMN, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {/* progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        {answered.map((a, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: a ? 'var(--status-success)' : i === index ? 'var(--brand-primary)' : 'var(--n-200)' }} />
        ))}
      </div>

      <div ref={qRef}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 8 }}>
          Question {index + 1} of {total}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 18, lineHeight: 1.35 }}>{q.prompt}</div>

        <RadioGroup
          name={q.id}
          value={choice}
          onChange={onChoose}
          options={q.options.map((o, i) => ({ value: String(i), label: o }))}
        />

        {checked ? (
          <div style={{ marginTop: 16, display: 'flex', gap: 10, padding: '13px 15px', border: `1px solid ${isCorrect ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`, background: isCorrect ? 'var(--status-success-bg)' : 'var(--status-danger-bg)' }}>
            {isCorrect ? <CheckCircle size={18} weight="fill" color="var(--status-success)" style={{ flex: 'none', marginTop: 1 }} /> : <XCircle size={18} weight="fill" color="var(--status-danger)" style={{ flex: 'none', marginTop: 1 }} />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? 'var(--status-success)' : 'var(--status-danger)', marginBottom: 3 }}>
                {isCorrect ? 'Correct — added to your flow' : 'Not quite — here’s a hint'}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>{q.explanation}</div>
            </div>
          </div>
        ) : null}

        {!isCorrect ? (
          <div style={{ marginTop: 18 }}>
            {!checked ? (
              <Button variant="primary" disabled={choice === undefined} onClick={onCheck}>Check answer</Button>
            ) : (
              <Button variant="outline" icon={<ArrowClockwise size={15} />} onClick={onRetry}>Try another answer</Button>
            )}
          </div>
        ) : null}
      </div>

      {/* the single node box, below the question, same width */}
      <div style={{ marginTop: 22, border: '1px solid var(--border-strong)', background: '#E9ECF2', backgroundImage: 'radial-gradient(#C4CAD4 1px, transparent 1px)', backgroundSize: '16px 16px', padding: '30px 18px 34px', display: 'flex', justifyContent: 'center' }}>
        <div ref={nodeRef}>
          <N8nNodeView type={displayType} label={isCorrect ? displayLabel : 'Which node?'} placeholder={!isCorrect} tag={checked ? (isCorrect ? 'correct' : 'wrong') : null} />
        </div>
      </div>
    </div>
  );
}

function Intro({ problem, onContinue }) {
  const rootRef = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-a="mascot"]', { y: 34, opacity: 0, duration: 0.8, ease: 'power3.out' });
      gsap.from('[data-a="rise"]', { y: 18, opacity: 0, duration: 0.6, stagger: 0.14, delay: 0.35, ease: 'power2.out' });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar activeStage="statement" />
      <div ref={rootRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div data-a="mascot" style={{ width: 100, height: 100, marginBottom: 10 }}>
          <MascotPlayer clip="hello" once={false} onceDone={() => {}} />
        </div>
        <h1 data-a="rise" style={{ fontFamily: 'var(--font-headline)', fontSize: 42, fontWeight: 600, margin: '0 0 12px' }}>Hey {LEARNER_NAME},</h1>
        <p data-a="rise" style={{ fontSize: 18, lineHeight: 1.5, color: 'var(--fg-2)', maxWidth: 600, margin: '0 0 8px' }}>
          Today’s problem is <strong style={{ color: 'var(--fg-1)' }}>{problem.title}</strong>.
        </p>
        <p data-a="rise" style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: 600, margin: '0 0 30px' }}>{problem.statement}</p>

        <div data-a="rise" style={{ marginBottom: 34, maxWidth: '100%', overflowX: 'auto', padding: '6px 2px' }}>
          <ConceptFlow direction="row" />
        </div>

        <div data-a="rise">
          <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={onContinue}>Continue</Button>
        </div>
      </div>
    </div>
  );
}

function Done({ problem, unlockedTypes, onFinish }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar activeStage="statement" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div style={{ width: 92, height: 92, marginBottom: 8 }}>
          <MascotPlayer clip="celebrate" once={false} onceDone={() => {}} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-headline)', fontWeight: 600 }}>Your toolkit is ready</h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: 560, marginBottom: 22 }}>
          You reasoned out every piece of the plan. These are the nodes you unlocked — you’ll assemble them next. The builder also mixes in a few tools you <em>won’t</em> need.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center', marginBottom: 28 }}>
          {unlockedTypes.map((t) => (
            <N8nNodeView key={t} type={t} label={labelForType(problem, t)} size={68} />
          ))}
        </div>
        <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={onFinish}>Start building</Button>
      </div>
    </div>
  );
}

function SidePanel({ problem, open, onToggle }) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        style={{ position: 'fixed', right: 0, top: 120, zIndex: 60, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', borderRight: 'none', boxShadow: '-4px 4px 16px rgba(1,24,69,0.12)', padding: '10px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--fg-1)', writingMode: 'vertical-rl' }}
      >
        <Note size={15} weight="fill" color="var(--brand-primary)" /> The problem
      </button>
    );
  }
  return (
    <div style={{ position: 'fixed', right: 16, top: 116, width: 300, zIndex: 60, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', boxShadow: '0 12px 32px rgba(1,24,69,0.16)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <Note size={15} weight="fill" color="var(--brand-primary)" />
        <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fg-2)' }}>The problem</span>
        <button type="button" onClick={onToggle} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', display: 'flex' }}>
          <CaretRight size={16} />
        </button>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{problem.title}</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <ConceptFlow direction="column" size="sm" />
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--fg-2)', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>{problem.statement}</div>
      </div>
    </div>
  );
}

function labelForType(problem, type) {
  return problem.nodePalette.find((n) => n.type === type)?.label || type;
}
