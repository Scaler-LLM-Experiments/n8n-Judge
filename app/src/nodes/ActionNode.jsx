import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '../design-system/Card.jsx';

export function ActionNode({ data }) {
  return (
    <Card tone="default" padding={12} style={{ minWidth: 160 }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)' }}>Action</div>
      <div style={{ fontWeight: 600 }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </Card>
  );
}
