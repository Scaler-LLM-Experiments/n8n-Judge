// app/src/screens/ReportScreen.jsx
import React from 'react';
import { Card } from '../design-system/Card.jsx';
import { Alert } from '../design-system/Alert.jsx';
import { Badge } from '../design-system/Badge.jsx';

export function ReportScreen({ runResult, evalOutcome }) {
  const overallPassed = Boolean(runResult?.allPassed) && evalOutcome?.correctCount === evalOutcome?.total;

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ maxWidth: 640, width: '100%' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
          Report
        </div>
        <div style={{ marginBottom: 16 }}>
          <Badge tone={overallPassed ? 'success' : 'warning'} solid={overallPassed}>
            {overallPassed ? 'Solved' : 'Needs another look'}
          </Badge>
        </div>

        <h3 style={{ margin: '0 0 8px' }}>Test cases</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {runResult?.results.map((r) => (
            <Alert key={r.id} tone={r.passed ? 'success' : 'danger'} title={r.description}>
              {r.passed ? 'Passed' : r.reason}
            </Alert>
          ))}
        </div>

        <h3 style={{ margin: '0 0 8px' }}>Eval questions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {evalOutcome?.results.map((r) => (
            <Alert key={r.id} tone={r.correct ? 'success' : 'danger'} title={r.prompt}>
              {r.correct ? 'Correct' : 'Incorrect'}
            </Alert>
          ))}
        </div>

        <p style={{ marginTop: 24, fontSize: 14, color: 'var(--fg-2)' }}>
          {evalOutcome?.correctCount} / {evalOutcome?.total} eval questions correct.
        </p>
      </Card>
    </div>
  );
}
