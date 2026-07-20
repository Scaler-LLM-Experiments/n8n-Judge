import React from 'react';
import { Card } from '../design-system/Card.jsx';
import { Badge } from '../design-system/Badge.jsx';

export function NodePalette({ problem }) {
  const onDragStart = (event, paletteNode) => {
    event.dataTransfer.setData('application/judge-node', JSON.stringify(paletteNode));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{ width: 220, overflowY: 'auto', borderRight: '1px solid var(--border-subtle)', padding: 12 }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
        Nodes
      </div>
      {problem.nodePalette.map((paletteNode) => (
        <Card
          key={paletteNode.type}
          padding={10}
          interactive
          draggable
          onDragStart={(event) => onDragStart(event, paletteNode)}
          style={{ marginBottom: 8, cursor: 'grab' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{paletteNode.label}</span>
            {paletteNode.isDistractor ? <Badge tone="neutral">extra</Badge> : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
