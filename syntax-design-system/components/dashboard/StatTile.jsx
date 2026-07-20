import React from 'react';

/**
 * StatTile — a dashboard metric tile. Uppercase label, large Plus Jakarta
 * numeral, optional sub + delta. Zero radius, hairline border.
 */
export function StatTile({ label, value, sub, delta, deltaDir = 'up', align = 'left', style, ...rest }) {
  const deltaColor = deltaDir === 'down' ? 'var(--status-danger)' : 'var(--status-success)';
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        padding: 16, background: 'var(--surface-0)',
        border: '1px solid var(--border-subtle)', borderRadius: 0,
        textAlign: align, ...style,
      }}
      {...rest}
    >
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 26, lineHeight: 1.05, color: 'var(--fg-1)' }}>{value}</span>
      {sub ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-3)' }}>{sub}</span> : null}
      {delta ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: deltaColor }}>{deltaDir === 'down' ? '↓' : '↑'} {delta}</span> : null}
    </div>
  );
}
