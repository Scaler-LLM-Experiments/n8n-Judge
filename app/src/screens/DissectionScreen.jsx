import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, ArrowClockwise, Lightning, Question } from '@phosphor-icons/react';
import { Card } from '../design-system/Card.jsx';
import { Button } from '../design-system/Button.jsx';
import { RadioGroup } from '../design-system/RadioGroup.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ConceptFlow } from '../components/ConceptFlow.jsx';
import { ProblemNote } from '../components/ProblemNote.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { nodeIcons, nodeIconColor, categoryMeta, typeCategory, CHIP_BG } from '../nodes/nodeIcons.js';

const LEARNER_NAME = 'Aarav'; // placeholder for the prototype

export function DissectionScreen({ problem, onComplete }) {
  const questions = problem.dissection;
  const [phase, setPhase] = useState('intro'); // intro | quiz | done
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState(undefined);
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(() => questions.map(() => 0));
  const [answered, setAnswered] = useState(() => questions.map(() => false));
  const [mascotClip, setMascotClip] = useState('idle');
  const [showNote, setShowNote] = useState(true);
  const advanceTimer = useRef(null);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const q = questions[index];
  const isCorrect = checked && Number(choice) === q.correctIndex;
  const slots = questions.map((x) => ({ id: x.id, types: x.unlocks }));
  const unlockedTypes = [...new Set(questions.flatMap((x) => x.unlocks))];

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
    }, 1400);
  };

  const retry = () => {
    setChecked(false);
    setChoice(undefined);
    setMascotClip('idle');
  };

  // ---------- INTRO ----------
  if (phase === 'intro') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TopBar activeStage="statement" />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, marginBottom: 12 }}>
            <MascotPlayer clip="hello" once={false} onceDone={() => {}} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 44, fontWeight: 600, margin: '0 0 14px' }}>Hey {LEARNER_NAME},</h1>
          <p style={{ fontSize: 18, lineHeight: 1.5, color: 'var(--fg-2)', maxWidth: 620, margin: '0 0 28px' }}>
            You’re about to automate a messy support inbox. We’ll figure out the plan together first — then build it, one node at a time.
          </p>

          <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
            {[
              { n: '5', label: 'concepts to\ndissect' },
              { n: '6', label: 'nodes to\nwire up' },
              { n: '~10', label: 'minutes to\nfinish' },
            ].map((s, i) => (
              <div key={i} style={{ width: 170, padding: '20px 10px', borderLeft: i ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: 40, fontWeight: 600, color: 'var(--brand-primary)', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 8, whiteSpace: 'pre-line' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 10, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700 }}>
            Here’s the shape of it
          </div>
          <div style={{ marginBottom: 32, maxWidth: '100%', overflowX: 'auto', padding: '4px 2px' }}>
            <ConceptFlow />
          </div>

          <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={() => setPhase('quiz')}>Let’s get started</Button>
        </div>
      </div>
    );
  }

  // ---------- DONE ----------
  if (phase === 'done') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TopBar activeStage="statement" />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Card style={{ maxWidth: 640, width: '100%', padding: 26, textAlign: 'center' }}>
            <div style={{ width: 84, height: 84, margin: '0 auto 6px' }}>
              <MascotPlayer clip="celebrate" once={false} onceDone={() => {}} />
            </div>
            <h2 style={{ margin: '0 0 8px' }}>Your toolkit is ready</h2>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-2)', marginBottom: 20 }}>
              You reasoned out every piece of the plan. These are the nodes you unlocked — you’ll assemble them next. Heads up: the builder also mixes in a few tools you <em>won’t</em> need.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
              {unlockedTypes.map((t) => (
                <NodeChip key={t} type={t} label={labelFor(problem, t)} big />
              ))}
            </div>
            <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={() => onComplete({ attempts, unlockedTypes })}>Start building</Button>
          </Card>
        </div>
      </div>
    );
  }

  // ---------- QUIZ ----------
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F5F6F8' }}>
      <TopBar activeStage="statement" />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 24px 40px' }}>
        {/* mascot top-center */}
        <div style={{ width: 84, height: 84, marginBottom: 4 }}>
          <MascotPlayer clip={mascotClip} once={mascotClip !== 'idle'} onceDone={() => {}} />
        </div>

        {/* the plan taking shape */}
        <PlanCanvas problem={problem} slots={slots} answered={answered} activeIndex={index} />

        {/* question */}
        <Card style={{ maxWidth: 680, width: '100%', padding: 22, marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            {questions.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: answered[i] ? 'var(--status-success)' : i === index ? 'var(--brand-primary)' : 'var(--n-200)' }} />
            ))}
          </div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 8 }}>
            Dissect · Question {index + 1} of {questions.length}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, lineHeight: 1.4 }}>{q.prompt}</div>

          <RadioGroup
            name={q.id}
            value={choice}
            onChange={(v) => !isCorrect && setChoice(v)}
            options={q.options.map((o, i) => ({ value: String(i), label: o }))}
          />

          {checked ? (
            <div style={{ marginTop: 16, display: 'flex', gap: 10, padding: '13px 15px', border: `1px solid ${isCorrect ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`, background: isCorrect ? 'var(--status-success-bg)' : 'var(--status-danger-bg)' }}>
              {isCorrect ? <CheckCircle size={18} weight="fill" color="var(--status-success)" style={{ flex: 'none', marginTop: 1 }} /> : <XCircle size={18} weight="fill" color="var(--status-danger)" style={{ flex: 'none', marginTop: 1 }} />}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? 'var(--status-success)' : 'var(--status-danger)', marginBottom: 3 }}>
                  {isCorrect ? 'Correct — adding it to your plan…' : 'Not quite — here’s a hint'}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>{q.explanation}</div>
              </div>
            </div>
          ) : null}

          {!isCorrect ? (
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              {!checked ? (
                <Button variant="primary" disabled={choice === undefined} onClick={check}>Check answer</Button>
              ) : (
                <Button variant="outline" icon={<ArrowClockwise size={15} />} onClick={retry}>Try another answer</Button>
              )}
            </div>
          ) : null}
        </Card>
      </div>

      {showNote ? (
        <ProblemNote problem={problem} onHide={() => setShowNote(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          style={{ position: 'fixed', left: 20, bottom: 20, zIndex: 70, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', boxShadow: '0 6px 18px rgba(1,24,69,0.14)', padding: '8px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--fg-1)' }}
        >
          <Question size={15} color="var(--brand-primary)" /> Show the problem
        </button>
      )}
    </div>
  );
}

function PlanCanvas({ problem, slots, answered, activeIndex }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 900,
        border: '1px solid var(--border-strong)',
        background: '#E9ECF2',
        backgroundImage: 'radial-gradient(#C4CAD4 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        padding: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
      }}
    >
      {slots.map((slot, i) => (
        <React.Fragment key={slot.id}>
          <PlanSlot problem={problem} slot={slot} state={answered[i] ? 'done' : i === activeIndex ? 'active' : 'pending'} />
          {i < slots.length - 1 ? (
            <ArrowRight size={16} weight="bold" color={answered[i] ? 'var(--status-success)' : 'var(--fg-3)'} style={{ flex: 'none' }} />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function PlanSlot({ problem, slot, state }) {
  const primary = slot.types[0];
  const extra = slot.types[1];
  if (state !== 'done') {
    return (
      <div
        style={{
          width: 128,
          flex: 'none',
          height: 64,
          border: `1.5px dashed ${state === 'active' ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
          background: state === 'active' ? 'var(--brand-blue-50)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: state === 'active' ? 'var(--brand-primary)' : 'var(--fg-3)',
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        ?
      </div>
    );
  }
  const meta = categoryMeta[typeCategory[primary]];
  const Icon = nodeIcons[primary];
  const color = nodeIconColor[primary] || meta.color;
  return (
    <div style={{ width: 128, flex: 'none', position: 'relative' }}>
      <div style={{ background: 'var(--surface-0)', border: `1px solid ${meta.color}`, boxShadow: '0 1px 2px rgba(1,24,69,0.06)', borderRadius: 8, padding: '9px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 26, height: 26, flex: 'none', borderRadius: 6, background: CHIP_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {Icon ? <Icon size={15} color={color} /> : null}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.2 }}>{labelFor(problem, primary)}</div>
        </div>
        {extra ? (
          <div style={{ marginTop: 6, fontSize: 9.5, fontWeight: 700, color: categoryMeta[typeCategory[extra]].color, display: 'flex', alignItems: 'center', gap: 3 }}>
            + {labelFor(problem, extra)}
          </div>
        ) : null}
      </div>
      <span style={{ position: 'absolute', top: -8, right: -6, background: 'var(--status-success)', color: '#fff', borderRadius: 999, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle size={13} weight="fill" />
      </span>
    </div>
  );
}

function NodeChip({ type, label, big }) {
  const meta = categoryMeta[typeCategory[type]] || categoryMeta.core;
  const Icon = nodeIcons[type];
  const color = nodeIconColor[type] || meta.color;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: big ? '7px 12px' : '4px 9px', border: '1px solid var(--border-subtle)', background: 'var(--surface-0)', fontSize: big ? 13 : 12, fontWeight: 600, color: 'var(--fg-1)' }}>
      {Icon ? <Icon size={big ? 16 : 14} color={color} /> : null}
      {label}
    </span>
  );
}

function labelFor(problem, type) {
  return problem.nodePalette.find((n) => n.type === type)?.label || type;
}
