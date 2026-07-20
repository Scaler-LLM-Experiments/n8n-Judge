import React, { useState } from 'react';
import { Card } from '../design-system/Card.jsx';
import { Alert } from '../design-system/Alert.jsx';
import { Badge } from '../design-system/Badge.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';

export function ReportScreen({ problem, runResult, evalOutcome }) {
  const [showStatement, setShowStatement] = useState(false);
  const overallPassed = Boolean(runResult?.allPassed) && evalOutcome?.correctCount === evalOutcome?.total;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar activeStage="report" onShowProblemStatement={() => setShowStatement(true)} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Card style={{ maxWidth: 640, width: '100%' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
            Result
          </div>
          <div style={{ marginBottom: 16 }}>
            <Badge tone={overallPassed ? 'success' : 'warning'} solid={overallPassed}>
              {overallPassed ? 'Solved' : 'Needs another look'}
            </Badge>
          </div>

          <h3 style={{ margin: '0 0 8px' }}>Test cases</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {runResult?.results?.map((r) => (
              <Alert key={r.id} tone={r.passed ? 'success' : 'danger'} title={r.description}>
                {r.passed ? 'Passed' : r.reason}
              </Alert>
            ))}
          </div>

          <h3 style={{ margin: '0 0 8px' }}>Eval questions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {evalOutcome?.results?.map((r) => (
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
      {showStatement && problem ? <ProblemStatementPanel problem={problem} onClose={() => setShowStatement(false)} /> : null}
    </div>
  );
}
