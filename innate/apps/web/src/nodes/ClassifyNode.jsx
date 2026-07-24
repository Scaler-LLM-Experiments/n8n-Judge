import React from 'react';
import { Handle, Position } from 'reactflow';
import { Brain } from '@phosphor-icons/react';
import { NodeCard, handleStyle } from './NodeCard.jsx';
import { categoryMeta } from './nodeIcons.js';

const MODEL = categoryMeta.model;

// AI Agent-style cluster node: main flow enters left / exits right, and a
// language model plugs into the labelled port underneath (n8n's ai_languageModel
// connection).
export function ClassifyNode({ data, type, selected }) {
  return (
    <div style={{ position: 'relative' }}>
      <NodeCard type={type} label={data.label} selected={selected} sim={data.sim} seen={data.seen} width={220}>
        <Handle type="target" position={Position.Left} style={handleStyle} />
        <Handle type="source" position={Position.Right} style={handleStyle} />
      </NodeCard>

      {/* bottom sub-node port: Chat Model */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '100%',
          transform: 'translateX(-50%)',
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Handle
          type="target"
          id="ai_model"
          position={Position.Bottom}
          style={{
            ...handleStyle,
            position: 'relative',
            left: 0,
            top: 0,
            transform: 'none',
            borderColor: MODEL.color,
            borderStyle: 'dashed',
          }}
        />
        <div
          style={{
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            border: `1px dashed ${MODEL.color}`,
            borderRadius: 999,
            background: MODEL.tint,
            color: MODEL.color,
            fontSize: 10,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          <Brain size={11} weight="bold" /> Chat Model
        </div>
      </div>
    </div>
  );
}
