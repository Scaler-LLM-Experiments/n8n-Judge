import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '../design-system/Card.jsx';
import { nodeIcons } from './nodeIcons.js';

export function ActionNode({ data, type }) {
  const Icon = nodeIcons[type];
  return (
    <Card tone="default" padding={12} style={{ minWidth: 170 }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon ? <Icon size={18} color="var(--fg-2)" /> : null}
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)' }}>Action</div>
          <div style={{ fontWeight: 600 }}>{data.label}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </Card>
  );
}
