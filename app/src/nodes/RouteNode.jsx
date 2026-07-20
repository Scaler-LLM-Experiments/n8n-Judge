import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '../design-system/Card.jsx';

const BRANCHES = [
  { id: 'bug_report', label: 'Bug Report', top: '25%' },
  { id: 'feature_request', label: 'Feature Request', top: '50%' },
  { id: 'urgent_complaint', label: 'Urgent Complaint', top: '75%' },
];

export function RouteNode({ data }) {
  return (
    <Card tone="soft" padding={12} style={{ minWidth: 180, minHeight: 100, position: 'relative' }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)' }}>Branch</div>
      <div style={{ fontWeight: 600 }}>{data.label}</div>
      {BRANCHES.map((branch) => (
        <React.Fragment key={branch.id}>
          <Handle type="source" position={Position.Right} id={branch.id} style={{ top: branch.top }} />
          <div
            style={{
              position: 'absolute',
              right: 8,
              top: branch.top,
              fontSize: 10,
              transform: 'translateY(-50%)',
              color: 'var(--fg-2)',
            }}
          >
            {branch.label}
          </div>
        </React.Fragment>
      ))}
    </Card>
  );
}
