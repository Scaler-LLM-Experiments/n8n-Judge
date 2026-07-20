import React from 'react';
import { nodeIcons, nodeIconColor, metaOf, CHIP_BG } from './nodeIcons.js';

// The shared visual for every canvas node: a colour-tinted icon chip, the node
// name, and a small category label. n8n-flavoured but on the Scaler palette.
export function NodeCard({ type, label, sublabel, selected, width = 210, children }) {
  const meta = metaOf(type);
  const Icon = nodeIcons[type];
  const iconColor = nodeIconColor[type] || meta.color;
  return (
    <div
      style={{
        position: 'relative',
        width,
        background: 'var(--surface-0)',
        border: `1px solid ${selected ? meta.color : 'var(--border-subtle)'}`,
        boxShadow: selected
          ? `0 0 0 3px ${meta.tint}, 0 8px 24px rgba(1,24,69,0.12)`
          : '0 1px 2px rgba(1,24,69,0.06)',
        borderRadius: 10,
        padding: 12,
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div
          style={{
            width: 38,
            height: 38,
            flex: 'none',
            borderRadius: 9,
            background: CHIP_BG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {Icon ? <Icon size={20} color={iconColor} /> : null}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: meta.color,
              fontWeight: 700,
            }}
          >
            {sublabel || meta.label}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.25 }}>{label}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

export const handleStyle = {
  width: 11,
  height: 11,
  background: 'var(--surface-0)',
  border: '2px solid #B0B5BD',
};
