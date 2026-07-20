// app/src/App.jsx
import React from 'react';
import { Card } from './design-system/Card.jsx';

export default function App() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
          Judge
        </div>
        <h1 style={{ margin: 0 }}>Scaffold ready</h1>
      </Card>
    </div>
  );
}
