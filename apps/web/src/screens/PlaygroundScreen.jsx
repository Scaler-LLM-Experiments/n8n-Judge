import React from 'react';
import { TopBar } from '../components/TopBar.jsx';
import { N8nEditor } from '../n8n/N8nEditor.jsx';

// Standalone view to exercise the n8n component kit in isolation:
// blank canvas → "Add first step" → node picker drawer → node with "Set me up"
// → click node → bottom NDV (Input · Parameters · Output) with drag-to-map.
export function PlaygroundScreen() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar activeStage="dashboard" />
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <N8nEditor />
      </div>
    </div>
  );
}
