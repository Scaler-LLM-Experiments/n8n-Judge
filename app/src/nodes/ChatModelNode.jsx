import React from 'react';
import { Handle, Position } from 'reactflow';
import { NodeCard, handleStyle } from './NodeCard.jsx';
import { categoryMeta } from './nodeIcons.js';

const MODEL = categoryMeta.model;

// Language-model sub-node. Its single output plugs UP into an AI node's Chat
// Model port, so its only handle is a source on top.
export function ChatModelNode({ data, type, selected }) {
  return (
    <NodeCard type={type} label={data.label} selected={selected} width={190}>
      <Handle
        type="source"
        position={Position.Top}
        style={{ ...handleStyle, borderColor: MODEL.color, borderStyle: 'dashed' }}
      />
    </NodeCard>
  );
}
