import React from 'react';
import { Handle, Position } from 'reactflow';
import { NodeCard, handleStyle } from './NodeCard.jsx';

export function ActionNode({ data, type, selected }) {
  return (
    <NodeCard type={type} label={data.label} selected={selected} sim={data.sim} seen={data.seen}>
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </NodeCard>
  );
}
