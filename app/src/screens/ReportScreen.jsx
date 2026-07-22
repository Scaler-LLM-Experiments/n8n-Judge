import React, { useState } from 'react';
import { Card } from '../design-system/Card.jsx';
import { Alert } from '../design-system/Alert.jsx';
import { Badge } from '../design-system/Badge.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { understandingScore, countsByKind, misconceptionsHit } from '../engine/grading.js';

const KIND_LABEL = { dissection: 'Problem dissection', field: 'Node configuration', nodePick: 'Node choices', stress: 'Stress testing' };

export function ReportScreen({ problem, grading, dissection, runResult, evalOutcome }) {
  const [showStatement, setShowStatement] = useState(false);
  const overallPassed = Boolean(runResult?.allPassed) && evalOutcome?.correctCount === evalOutcome?.total;

  const score = grading ? understandingScore(grading) : null;
  const counts = grading ? countsByKind(grading) : {};
  const misconceptions = grading ? misconceptionsHit(grading).map((m) => problem.misconceptionLabels?.[m] || m) : [];
  const scoreColor = score == null ? 'var(--fg-3)' : score >= 80 ? 'var(--status-success)' : score >= 50 ? 'var(--accent-orange, #ED7700)' : 'var(--status-danger)';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar activeStage="report" onShowProblemStatement={() => setShowStatement(true)} />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: 24 }}>
        <Card style={{ maxWidth: 640, width: '100%' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
            Result
          </div>
          <div style={{ marginBottom: 20 }}>
            <Badge tone={overallPassed ? 'success' : 'warning'} solid={overallPassed}>
              {overallPassed ? 'Solved' : 'Needs another look'}
            </Badge>
          </div>

          {/* Understanding score */}
          {score != null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 18, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: 44, fontWeight: 600, color: scoreColor, lineHeight: 1 }}>{score}<span style={{ fontSize: 20 }}>%</span></div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>understanding</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12.5, color: 'var(--fg-2)', marginBottom: 2 }}>First-try correct, by area:</div>
                {Object.entries(counts).map(([kind, c]) => (
                  <div key={kind} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ color: 'var(--fg-1)' }}>{KIND_LABEL[kind] || kind}</span>
                    <span style={{ color: 'var(--fg-2)', fontWeight: 600 }}>{c.firstTryCorrect}/{c.total}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Misconceptions surfaced */}
          {misconceptions.length ? (
            <>
              <h3 style={{ margin: '0 0 8px' }}>Worth revisiting</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {misconceptions.map((m) => (
                  <Alert key={m} tone="warning" title={m} />
                ))}
              </div>
            </>
          ) : null}

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
