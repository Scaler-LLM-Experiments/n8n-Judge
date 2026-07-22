import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowRight, ArrowClockwise, XCircle, CheckCircle, Microphone } from '@phosphor-icons/react';
import { Button } from '../design-system/Button.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ConceptFlow } from '../components/ConceptFlow.jsx';
import { ProblemNote } from '../components/ProblemNote.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { N8nNodeView } from '../n8n/N8nNodeView.jsx';

const LEARNER_NAME = 'Aarav';
const COLUMN = 620;

export function DissectionScreen({ problem, onComplete }) {
  const questions = problem.dissection;
  const [phase, setPhase] = useState('greet'); // greet | problem | quiz | done
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null); // option index
  const [attempts, setAttempts] = useState(() => questions.map(() => 0));
  const [showNote, setShowNote] = useState(true);
  const [mascotClip, setMascotClip] = useState('hello');
  const advanceTimer = useRef(null);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const q = questions[index];
  const pickedOption = picked !== null ? q.options[picked] : null;
  const isCorrect = pickedOption ? pickedOption.type === q.correctType : false;
  const unlockedTypes = [...new Set(questions.flatMap((x) => x.unlocks))];

  const pick = (i) => {
    if (picked !== null && isCorrect) return; // locked after correct
    const opt = q.options[i];
    const correct = opt.type === q.correctType;
    setPicked(i);
    setMascotClip(correct ? 'correct' : 'shake-no');
    if (!correct) {
      setAttempts((a) => a.map((v, k) => (k === index ? v + 1 : v)));
      return;
    }
    advanceTimer.current = setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex(index + 1);
        setPicked(null);
        setMascotClip('idle');
      } else {
        setPhase('done');
      }
    }, 1600);
  };

  const retry = () => {
    setPicked(null);
    setMascotClip('idle');
  };

  if (phase === 'greet') {
    return <Greet onContinue={() => { setPhase('problem'); }} />;
  }
  if (phase === 'problem') {
    return <ProblemBeat problem={problem} onContinue={() => { setPhase('quiz'); setMascotClip('idle'); }} />;
  }
  if (phase === 'done') {
    return <Done problem={problem} unlockedTypes={unlockedTypes} onFinish={() => onComplete({ attempts, unlockedTypes })} />;
  }

  // ---------- QUIZ ----------
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F5F6F8' }}>
      <TopBar activeStage="statement" />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 24px 56px' }}>
        <TopMascot clip={mascotClip} />
        <QuizBody
          key={index}
          q={q}
          index={index}
          total={questions.length}
          picked={picked}
          isCorrect={isCorrect}
          onPick={pick}
          onRetry={retry}
        />
      </div>

      {showNote ? (
        <ProblemNote problem={problem} onHide={() => setShowNote(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          style={{ position: 'fixed', left: 20, bottom: 20, zIndex: 70, display: 'flex', alignItems: 'center', gap: 6, background: '#FEFAE7', border: '1px solid #E8DFA8', boxShadow: '0 6px 18px rgba(1,24,69,0.14)', padding: '8px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', color: '#8A7B2E' }}
        >
          Show the problem
        </button>
      )}
    </div>
  );
}

// mascot that drops in from above, sits centred over the question
function TopMascot({ clip }) {
  const ref = useRef(null);
  useEffect(() => {
    gsap.from(ref.current, { y: -160, opacity: 0, duration: 0.7, ease: 'power3.out' });
  }, []);
  return (
    <div ref={ref} style={{ width: 78, height: 78, marginBottom: 10 }}>
      <MascotPlayer clip={clip} once={clip !== 'idle'} onceDone={() => {}} />
    </div>
  );
}

function QuizBody({ q, index, total, picked, isCorrect, onPick, onRetry }) {
  const nodeRef = useRef(null);
  const pickedOption = picked !== null ? q.options[picked] : null;
  const answered = picked !== null;

  useEffect(() => {
    if (answered && nodeRef.current) gsap.fromTo(nodeRef.current, { scale: 0.8, y: 8 }, { scale: 1, y: 0, duration: 0.5, ease: 'back.out(2)' });
  }, [picked]);

  return (
    <div style={{ width: '100%', maxWidth: COLUMN, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 10 }}>
        Question {index + 1} of {total}
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 22, lineHeight: 1.35, maxWidth: 560 }}>{q.prompt}</div>

      {/* option boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
        {q.options.map((opt, i) => {
          const state = picked === i ? (isCorrect ? 'correct' : 'wrong') : 'idle';
          const dim = answered && isCorrect && picked !== i;
          return (
            <OptionBox key={i} option={opt} state={state} dim={dim} disabled={answered && isCorrect} onClick={() => onPick(i)} />
          );
        })}
      </div>

      {/* dialogue */}
      {answered ? (
        <div style={{ width: '100%', marginTop: 16, display: 'flex', gap: 10, textAlign: 'left', padding: '13px 15px', border: `1px solid ${isCorrect ? 'var(--brand-blue-100)' : 'var(--status-danger-border)'}`, background: isCorrect ? 'var(--brand-blue-50)' : 'var(--status-danger-bg)' }}>
          {isCorrect ? <CheckCircle size={18} weight="fill" color="var(--brand-primary)" style={{ flex: 'none', marginTop: 1 }} /> : <XCircle size={18} weight="fill" color="var(--status-danger)" style={{ flex: 'none', marginTop: 1 }} />}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? 'var(--brand-primary)' : 'var(--status-danger)', marginBottom: 3 }}>
              {isCorrect ? `Right — ${pickedOption.label} it is` : `Not ${pickedOption.label}`}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>{q.explanation}</div>
          </div>
        </div>
      ) : null}

      {answered && !isCorrect ? (
        <div style={{ marginTop: 16 }}>
          <Button variant="outline" icon={<ArrowClockwise size={15} />} onClick={onRetry}>Try another</Button>
        </div>
      ) : null}

      {/* center node canvas */}
      <div style={{ width: '100%', marginTop: 22, border: '1px solid var(--border-strong)', background: '#E9ECF2', backgroundImage: 'radial-gradient(#C4CAD4 1px, transparent 1px)', backgroundSize: '16px 16px', padding: '30px 18px 34px', display: 'flex', justifyContent: 'center', minHeight: 150, alignItems: 'center' }}>
        {answered ? (
          <div ref={nodeRef}>
            <N8nNodeView type={pickedOption.type} label={pickedOption.label} tag={isCorrect ? 'correct' : 'wrong'} />
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>Pick an option — it drops in here as a node.</div>
        )}
      </div>
    </div>
  );
}

function OptionBox({ option, state, dim, disabled, onClick }) {
  const [hover, setHover] = useState(false);
  const border = state === 'correct' ? 'var(--brand-primary)' : state === 'wrong' ? 'var(--status-danger)' : hover ? 'var(--fg-3)' : 'var(--border-subtle)';
  const bg = state === 'correct' ? 'var(--brand-blue-50)' : state === 'wrong' ? 'var(--status-danger-bg)' : 'var(--surface-0)';
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        border: `1px solid ${border}`,
        background: bg,
        cursor: disabled ? 'default' : 'pointer',
        opacity: dim ? 0.45 : 1,
        textAlign: 'left',
        fontFamily: 'var(--font-body)',
        transition: 'border-color 120ms ease, background 120ms ease, opacity 120ms ease',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)', flex: 1 }}>{option.label}</span>
    </button>
  );
}

function Greet({ onContinue }) {
  const root = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-a="m"]', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out' });
      gsap.from('[data-a="r"]', { y: 16, opacity: 0, duration: 0.6, stagger: 0.14, delay: 0.3, ease: 'power2.out' });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar activeStage="statement" />
      <div ref={root} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div data-a="m" style={{ width: 108, height: 108, marginBottom: 14 }}>
          <MascotPlayer clip="hello" once={false} onceDone={() => {}} />
        </div>
        <h1 data-a="r" style={{ fontFamily: 'var(--font-headline)', fontSize: 40, fontWeight: 600, margin: '0 0 14px' }}>I’m Iris, your AI mentor.</h1>
        <p data-a="r" style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--fg-2)', maxWidth: 560, margin: '0 0 10px' }}>
          I’ll walk you through today’s problem, step by step, and make sure you really understand it before you build anything.
        </p>
        <div data-a="r" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', fontSize: 12.5, color: 'var(--fg-2)', marginBottom: 30 }}>
          <Microphone size={15} color="var(--brand-primary)" weight="fill" /> A voice-guided experience — voice coming in a later build.
        </div>
        <div data-a="r">
          <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={onContinue}>Continue</Button>
        </div>
      </div>
    </div>
  );
}

function ProblemBeat({ problem, onContinue }) {
  const root = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      // mascot swoops down to the bottom-left corner
      gsap.from('[data-a="mascot"]', { x: () => window.innerWidth / 2 - 90, y: () => -(window.innerHeight - 320), opacity: 0.4, duration: 0.9, ease: 'power3.inOut' });
      gsap.from('[data-a="r"]', { y: 20, opacity: 0, duration: 0.6, stagger: 0.12, delay: 0.35, ease: 'power2.out' });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={root} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar activeStage="statement" />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', textAlign: 'center' }}>
        <div data-a="r" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 14 }}>
          Today’s problem
        </div>
        <h1 data-a="r" style={{ fontFamily: 'var(--font-headline)', fontSize: 52, fontWeight: 600, margin: '0 0 20px', lineHeight: 1.05, maxWidth: 820 }}>
          {problem.title}
        </h1>
        <p data-a="r" style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: 640, margin: '0 0 30px' }}>{problem.statement}</p>

        <div data-a="r" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', padding: '26px 28px', marginBottom: 32, maxWidth: '100%', overflowX: 'auto' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 16 }}>The shape of it</div>
          <ConceptFlow direction="row" />
        </div>

        <div data-a="r">
          <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={onContinue}>Let’s dissect it</Button>
        </div>
      </div>

      {/* mascot resting bottom-left */}
      <div data-a="mascot" style={{ position: 'fixed', left: 28, bottom: 24, width: 84, height: 84, zIndex: 50 }}>
        <MascotPlayer clip="presenting" once={false} onceDone={() => {}} />
      </div>
    </div>
  );
}

function Done({ problem, unlockedTypes, onFinish }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar activeStage="statement" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div style={{ width: 96, height: 96, marginBottom: 8 }}>
          <MascotPlayer clip="celebrate" once={false} onceDone={() => {}} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-headline)', fontWeight: 600 }}>Nice — you’ve got the plan.</h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: 560, marginBottom: 26 }}>
          You reasoned out every node this workflow needs. Here’s your toolkit — you’ll wire it up next. Heads up: the builder mixes in a few tools you <em>won’t</em> need.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', marginBottom: 30 }}>
          {unlockedTypes.map((t) => (
            <N8nNodeView key={t} type={t} label={labelForType(problem, t)} size={64} />
          ))}
        </div>
        <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={onFinish}>Start building</Button>
      </div>
    </div>
  );
}

function labelForType(problem, type) {
  return problem.nodePalette.find((n) => n.type === type)?.label || type;
}
