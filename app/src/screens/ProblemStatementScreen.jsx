import React from 'react';
import { Card } from '../design-system/Card.jsx';
import { Button } from '../design-system/Button.jsx';
import { TopBar } from '../components/TopBar.jsx';

export function ProblemStatementScreen({ problem, onStart }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar activeStage="statement" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Card style={{ maxWidth: 560 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
            Problem
          </div>
          <h1 style={{ margin: '0 0 16px' }}>{problem.title}</h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--fg-1)' }}>{problem.statement}</p>
          <div style={{ marginTop: 24 }}>
            <Button variant="primary" size="lg" onClick={onStart}>Start</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
