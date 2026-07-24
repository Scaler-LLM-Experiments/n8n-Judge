import React from 'react';
import { Gear } from '@phosphor-icons/react';
import { nodeIcons, nodeIconColor, metaOf, CHIP_BG } from './nodeIcons.js';

// Node types that carry meaningful configuration the learner should open.
export const NEEDS_SETUP = new Set(['trigger', 'classify', 'chat-gemini', 'switch', 'action']);

// The shared visual for every canvas node: a colour-tinted icon chip, the node
// name, and a small category label. n8n-flavoured but on the Scaler palette.
export function NodeCard({ type, label, sublabel, selected, sim, seen, width = 210, children }) {
  const meta = metaOf(type);
  const Icon = nodeIcons[type];
  const iconColor = nodeIconColor[type] || meta.color;
  const showSetup = NEEDS_SETUP.has(type) && !seen && sim === undefined;

  const active = sim === 'active';
  const done = sim === 'done';
  const dimmed = sim === 'dim';

  let border = selected ? meta.color : 'var(--border-subtle)';
  let boxShadow = selected ? `0 0 0 3px ${meta.tint}, 0 8px 24px rgba(1,24,69,0.12)` : '0 1px 2px rgba(1,24,69,0.06)';
  if (active) {
    border = 'var(--brand-primary)';
    boxShadow = '0 0 0 4px var(--brand-blue-50), 0 10px 28px rgba(0,85,255,0.28)';
  } else if (done) {
    border = 'var(--status-success)';
    boxShadow = '0 1px 2px rgba(1,24,69,0.06)';
  }

  return (
    <div
      style={{
        position: 'relative',
        width,
        background: 'var(--surface-0)',
        border: `1px solid ${border}`,
        boxShadow,
        borderRadius: 10,
        padding: 12,
        opacity: dimmed ? 0.4 : 1,
        transform: active ? 'scale(1.04)' : 'none',
        transition: 'border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease, opacity 140ms ease',
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
      {showSetup ? (
        <div
          className="judge-pulse"
          style={{
            position: 'absolute',
            top: -11,
            right: -8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--brand-primary)',
            color: 'var(--fg-on-brand)',
            fontSize: 10.5,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          <Gear size={11} weight="fill" /> Set me up
        </div>
      ) : null}
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
