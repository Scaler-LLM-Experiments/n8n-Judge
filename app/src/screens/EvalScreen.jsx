import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, CaretRight } from '@phosphor-icons/react';
import { Card } from '../design-system/Card.jsx';
import { Button } from '../design-system/Button.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { scoreEval } from '../engine/evalScore.js';
import { nodeIcons, nodeIconColor, categoryMeta, typeCategory } from '../nodes/nodeIcons.js';

function FlowSummary({ steps, caption }) {
  return (
    <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', padding: '16px 18px' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-2)', fontWeight: 700, marginBottom: 12 }}>The agent you built</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        {steps.map((n, i) => {
          const Icon = nodeIcons[n.type];
          const cat = typeCategory[n.type] || 'core';
          const color = nodeIconColor[n.type] || categoryMeta[cat].color;
          return (
            <React.Fragment key={n.type}>
              {i > 0 ? <CaretRight size={14} color="var(--fg-3)" style={{ flex: 'none' }} /> : null}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', border: '1px solid var(--border-subtle)', background: 'var(--surface-0)' }}>
                <span style={{ width: 24, height: 24, flex: 'none', background: categoryMeta[cat].tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {Icon ? <Icon size={14} color={color} /> : null}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-1)', whiteSpace: 'nowrap' }}>{n.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {caption ? <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 10, lineHeight: 1.5 }}>{caption}</div> : null}
    </div>
  );
}

export function EvalScreen({ problem, onSubmit, onDecision }) {
  const questions = problem.evalQuestions;
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState({}); // { [id]: index }
  const [showStatement, setShowStatement] = useState(false);

  const q = questions[qi];
  const picked = answers[q.id];
  const answered = picked !== undefined;
  const correct = answered && picked === q.correctIndex;
  const isLast = qi === questions.length - 1;

  const pick = (i) => {
    if (answered) return;
    setAnswers((a) => ({ ...a, [q.id]: i }));
  };

  const next = () => {
    if (!isLast) { setQi((i) => i + 1); return; }
    // finish: grade + record
    const numeric = {};
    for (const question of questions) {
      numeric[question.id] = Number(answers[question.id]);
      if (onDecision) onDecision({ id: `stress:${question.id}`, kind: 'stress', label: question.prompt, correct: Number(answers[question.id]) === question.correctIndex, firstTry: true });
    }
    onSubmit(scoreEval(numeric, questions));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar activeStage="eval" onShowProblemStatement={() => setShowStatement(true)} />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 4 }}>Stress Testing</div>
            <div style={{ fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.5 }}>Your flow passed the run. Now let’s check you understand how it behaves.</div>
          </div>

          {problem.flowSummary ? <FlowSummary steps={problem.flowSummary.steps} caption={problem.flowSummary.caption} /> : null}

          <Card style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question {qi + 1} of {questions.length}</span>
              <div style={{ display: 'flex', gap: 5 }}>
                {questions.map((qq, i) => (
                  <span key={qq.id} style={{ width: 22, height: 6, background: i < qi || (i === qi && answered) ? 'var(--brand-primary)' : 'var(--n-200)' }} />
                ))}
              </div>
            </div>

            <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4, marginBottom: 16 }}>{q.prompt}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {q.options.map((option, i) => {
                const isChosen = picked === i;
                const isRight = i === q.correctIndex;
                const tone = !answered ? 'var(--border-subtle)' : isRight ? 'var(--status-success)' : isChosen ? 'var(--status-danger)' : 'var(--border-subtle)';
                const bg = !answered ? 'var(--surface-0)' : isRight ? 'var(--status-success-bg)' : isChosen ? 'var(--status-danger-bg)' : 'var(--surface-0)';
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pick(i)}
                    disabled={answered}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '12px 14px', border: `1px solid ${tone}`, background: bg, cursor: answered ? 'default' : 'pointer', fontFamily: 'var(--font-body)', opacity: answered && !isRight && !isChosen ? 0.55 : 1 }}
                  >
                    <span style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', border: `1.5px solid ${answered && (isRight || isChosen) ? tone : 'var(--border-strong)'}`, background: answered && (isRight || isChosen) ? tone : 'transparent', color: answered && (isRight || isChosen) ? '#fff' : 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                      {answered && isRight ? <CheckCircle size={15} weight="fill" /> : answered && isChosen ? <XCircle size={15} weight="fill" /> : String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.4 }}>{option}</span>
                  </button>
                );
              })}
            </div>

            {answered ? (
              <div className="fade-in" style={{ marginTop: 14, padding: '12px 14px', background: 'var(--surface-1)', borderLeft: `3px solid ${correct ? 'var(--status-success)' : 'var(--status-danger)'}` }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: correct ? 'var(--status-success)' : 'var(--status-danger)', marginBottom: 4 }}>
                  {correct ? 'Correct' : `Not quite — the answer is “${q.options[q.correctIndex]}”`}
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>{q.explanation}</div>
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <Button variant="primary" iconRight={<ArrowRight size={15} />} disabled={!answered} onClick={next}>
                {isLast ? 'See my results' : 'Next question'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
      {showStatement ? <ProblemStatementPanel problem={problem} side onClose={() => setShowStatement(false)} /> : null}
    </div>
  );
}
