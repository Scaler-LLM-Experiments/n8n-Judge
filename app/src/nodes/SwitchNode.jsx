import React from 'react';
import { Handle, Position } from 'reactflow';
import { NodeCard, handleStyle } from './NodeCard.jsx';

const BRANCHES = [
  { id: 'bug_report', label: 'Bug Report' },
  { id: 'feature_request', label: 'Feature Request' },
  { id: 'urgent_complaint', label: 'Urgent Complaint' },
];

export function SwitchNode({ data, type, selected }) {
  return (
    <NodeCard type={type} label={data.label} selected={selected} width={220}>
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BRANCHES.map((branch, i) => (
          <div
            key={branch.id}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 6,
              fontSize: 11,
              color: 'var(--fg-2)',
              paddingRight: 4,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: 'var(--surface-1)',
                border: '1px solid var(--border-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--fg-3)',
              }}
            >
              {i}
            </span>
            {branch.label}
            <Handle
              type="source"
              position={Position.Right}
              id={branch.id}
              style={{ ...handleStyle, position: 'absolute', right: -18, top: '50%' }}
            />
          </div>
        ))}
      </div>
    </NodeCard>
  );
}
