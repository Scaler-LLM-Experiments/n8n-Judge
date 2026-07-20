import React from 'react';
import { Handle, Position } from 'reactflow';
import { NodeCard, handleStyle } from './NodeCard.jsx';

export function TriggerNode({ data, type, selected }) {
  return (
    <NodeCard type={type} label={data.label} selected={selected}>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </NodeCard>
  );
}
