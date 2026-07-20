import React from 'react';

export function GhostNode({ data }) {
  return (
    <div
      style={{
        minWidth: 160,
        padding: 12,
        border: '1px dashed var(--border-strong)',
        color: 'var(--fg-2)',
        background: 'transparent',
        fontSize: 12,
        textAlign: 'center',
      }}
    >
      {data.label}
    </div>
  );
}
