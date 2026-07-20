import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '../design-system/Card.jsx';

export function TriggerNode({ data }) {
  return (
    <Card tone="blue" padding={12} style={{ minWidth: 160 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--brand-primary)' }}>Trigger</div>
      <div style={{ fontWeight: 600 }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </Card>
  );
}
