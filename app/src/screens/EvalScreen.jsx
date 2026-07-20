// app/src/screens/EvalScreen.jsx
import React, { useState } from 'react';
import { Card } from '../design-system/Card.jsx';
import { Button } from '../design-system/Button.jsx';
import { RadioGroup } from '../design-system/RadioGroup.jsx';
import { scoreEval } from '../engine/evalScore.js';

export function EvalScreen({ problem, onSubmit }) {
  const [answers, setAnswers] = useState({});

  const allAnswered = problem.evalQuestions.every((q) => answers[q.id] !== undefined);

  const handleSubmit = () => {
    const numericAnswers = {};
    for (const q of problem.evalQuestions) {
      numericAnswers[q.id] = Number(answers[q.id]);
    }
    onSubmit(scoreEval(numericAnswers, problem.evalQuestions));
  };

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ maxWidth: 640, width: '100%' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 16 }}>
          Eval
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {problem.evalQuestions.map((q) => (
            <div key={q.id}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{q.prompt}</div>
              <RadioGroup
                name={q.id}
                value={answers[q.id]}
                onChange={(value) => setAnswers((a) => ({ ...a, [q.id]: value }))}
                options={q.options.map((option, index) => ({ value: String(index), label: option }))}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <Button variant="primary" disabled={!allAnswered} onClick={handleSubmit}>Submit</Button>
        </div>
      </Card>
    </div>
  );
}
