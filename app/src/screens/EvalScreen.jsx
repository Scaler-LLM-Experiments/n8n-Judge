import React, { useState } from 'react';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { Card } from '../design-system/Card.jsx';
import { Button } from '../design-system/Button.jsx';
import { RadioGroup } from '../design-system/RadioGroup.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { scoreEval } from '../engine/evalScore.js';

export function EvalScreen({ problem, onSubmit, onDecision }) {
  const [answers, setAnswers] = useState({});
  const [showStatement, setShowStatement] = useState(false);

  const allAnswered = problem.evalQuestions.every((q) => answers[q.id] !== undefined);

  const handleSubmit = () => {
    const numericAnswers = {};
    for (const q of problem.evalQuestions) {
      numericAnswers[q.id] = Number(answers[q.id]);
      if (onDecision) onDecision({ id: `stress:${q.id}`, kind: 'stress', label: q.prompt, correct: Number(answers[q.id]) === q.correctIndex, firstTry: true });
    }
    onSubmit(scoreEval(numericAnswers, problem.evalQuestions));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar activeStage="eval" onShowProblemStatement={() => setShowStatement(true)} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Card style={{ maxWidth: 640, width: '100%' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 16 }}>
            Stress Testing
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: -8, marginBottom: 20 }}>
            You built the flow — now let’s check you understand how it behaves. Pick an answer to see why.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {problem.evalQuestions.map((q, qi) => {
              const answered = answers[q.id] !== undefined;
              const correct = Number(answers[q.id]) === q.correctIndex;
              return (
                <div key={q.id}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                    {qi + 1}. {q.prompt}
                  </div>
                  <RadioGroup
                    name={q.id}
                    value={answers[q.id]}
                    onChange={(value) => setAnswers((a) => ({ ...a, [q.id]: value }))}
                    options={q.options.map((option, index) => ({ value: String(index), label: option }))}
                  />
                  {answered ? (
                    <div
                      style={{
                        marginTop: 12,
                        display: 'flex',
                        gap: 9,
                        padding: '11px 13px',
                        border: `1px solid ${correct ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
                        background: correct ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                      }}
                    >
                      {correct ? (
                        <CheckCircle size={17} weight="fill" color="var(--status-success)" style={{ flex: 'none', marginTop: 1 }} />
                      ) : (
                        <XCircle size={17} weight="fill" color="var(--status-danger)" style={{ flex: 'none', marginTop: 1 }} />
                      )}
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: correct ? 'var(--status-success)' : 'var(--status-danger)', marginBottom: 3 }}>
                          {correct ? 'Correct' : `Not quite — the answer is “${q.options[q.correctIndex]}”`}
                        </div>
                        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{q.explanation}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 24 }}>
            <Button variant="primary" disabled={!allAnswered} onClick={handleSubmit}>Submit</Button>
          </div>
        </Card>
      </div>
      {showStatement ? <ProblemStatementPanel problem={problem} onClose={() => setShowStatement(false)} /> : null}
    </div>
  );
}
