import React from 'react';

/**
 * Stat — a big numeric callout. The number is Plus Jakarta Sans (NOT Clash),
 * shown large and specific (e.g. "13×", "189"). Label sits beneath, muted.
 */
export function Stat({ value, label, size = 80, align = 'left', tone = 'default', style, ...rest }) {
  const color = tone === 'brand' ? 'var(--brand-primary)' : tone === 'inverse' ? 'var(--fg-inverse)' : 'var(--fg-1)';
  const labelColor = tone === 'inverse' ? 'rgba(255,255,255,0.7)' : 'var(--fg-3)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: align, ...style }} {...rest}>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color,
        }}
      >
        {value}
      </span>
      {label ? (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 500,
            color: labelColor,
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
