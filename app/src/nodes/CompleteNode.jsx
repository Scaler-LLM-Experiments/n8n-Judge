import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '../design-system/Card.jsx';

export function CompleteNode({ data }) {
  return (
    <Card tone="deep" padding={12} style={{ minWidth: 140 }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ fontWeight: 600 }}>{data.label || 'Complete'}</div>
    </Card>
  );
}
