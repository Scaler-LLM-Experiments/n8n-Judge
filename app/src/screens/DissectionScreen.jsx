import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, ArrowClockwise, Lightning } from '@phosphor-icons/react';
import { Card } from '../design-system/Card.jsx';
import { Button } from '../design-system/Button.jsx';
import { RadioGroup } from '../design-system/RadioGroup.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { nodeIcons, nodeIconColor, categoryMeta, typeCategory } from '../nodes/nodeIcons.js';

// The "Understand" stage: dissect the problem into decisions. Each question must
// be answered correctly (with retry + explanation) before moving on; correct
// answers unlock the nodes the learner will build with.
export function DissectionScreen({ problem, onComplete }) {
  const questions = problem.dissection;
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState(undefined);
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(() => questions.map(() => 0));
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'unlocked'

  const q = questions[index];
  const isCorrect = checked && Number(choice) === q.correctIndex;

  const unlockedTypes = [...new Set(questions.flatMap((x) => x.unlocks))];

  const check = () => {
    setChecked(true);
    if (Number(choice) !== q.correctIndex) {
      setAttempts((a) => a.map((v, i) => (i === index ? v + 1 : v)));
    }
  };

  const retry = () => {
    setChecked(false);
    setChoice(undefined);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setChoice(undefined);
      setChecked(false);
    } else {
      setPhase('unlocked');
    }
  };

  const finish = () => {
    onComplete({ attempts, unlockedTypes });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar activeStage="statement" />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* problem statement, always in view */}
          <Card tone="blue" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-primary)', fontWeight: 700, marginBottom: 6 }}>
              The problem
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{problem.title}</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-1)' }}>{problem.statement}</div>
          </Card>

          {phase === 'quiz' ? (
            <Card style={{ padding: 22 }}>
              {/* progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                {questions.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < index ? 'var(--status-success)' : i === index ? 'var(--brand-primary)' : 'var(--n-200)' }} />
                ))}
              </div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 8 }}>
                Dissect · Question {index + 1} of {questions.length}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, lineHeight: 1.4 }}>{q.prompt}</div>

              <RadioGroup
                name={q.id}
                value={choice}
                onChange={(v) => !checked && setChoice(v)}
                options={q.options.map((o, i) => ({ value: String(i), label: o }))}
              />

              {checked ? (
                <div style={{ marginTop: 16, display: 'flex', gap: 10, padding: '13px 15px', border: `1px solid ${isCorrect ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`, background: isCorrect ? 'var(--status-success-bg)' : 'var(--status-danger-bg)' }}>
                  {isCorrect ? <CheckCircle size={18} weight="fill" color="var(--status-success)" style={{ flex: 'none', marginTop: 1 }} /> : <XCircle size={18} weight="fill" color="var(--status-danger)" style={{ flex: 'none', marginTop: 1 }} />}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? 'var(--status-success)' : 'var(--status-danger)', marginBottom: 3 }}>
                      {isCorrect ? 'Correct' : 'Not quite — try again'}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>{q.explanation}</div>
                    {isCorrect && q.unlocks.length ? (
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fg-2)' }}>Unlocked:</span>
                        {q.unlocks.map((t) => (
                          <NodeChip key={t} type={t} label={labelFor(problem, t)} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                {!checked ? (
                  <Button variant="primary" disabled={choice === undefined} onClick={check}>Check answer</Button>
                ) : isCorrect ? (
                  <Button variant="primary" iconRight={<ArrowRight size={15} />} onClick={next}>
                    {index + 1 < questions.length ? 'Next question' : 'See your toolkit'}
                  </Button>
                ) : (
                  <Button variant="outline" icon={<ArrowClockwise size={15} />} onClick={retry}>Try again</Button>
                )}
              </div>
            </Card>
          ) : (
            <Card style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Lightning size={18} weight="fill" color="var(--brand-primary)" />
                <div style={{ fontSize: 16, fontWeight: 700 }}>Your toolkit is ready</div>
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--fg-2)', marginBottom: 16 }}>
                You reasoned out every piece of this workflow. These are the nodes you unlocked — you’ll assemble them in the builder. Watch out: the palette also mixes in a few tools you <em>won’t</em> need.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
                {unlockedTypes.map((t) => (
                  <NodeChip key={t} type={t} label={labelFor(problem, t)} big />
                ))}
              </div>
              <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={finish}>Start building</Button>
            </Card>
          )}
        </div>
      </div>
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
