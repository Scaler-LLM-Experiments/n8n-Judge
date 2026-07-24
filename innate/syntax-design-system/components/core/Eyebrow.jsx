import React from 'react';

/**
 * Eyebrow — the tracked label that sits above a headline.
 * Plus Jakarta 14px / 500, 0.12em tracking, brand blue by default. Always ALL CAPS.
 */
export function Eyebrow({ tone = 'brand', children, style, ...rest }) {
  const color = tone === 'muted' ? 'var(--fg-3)' : tone === 'inverse' ? 'rgba(255,255,255,0.7)' : 'var(--brand-primary)';
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        lineHeight: '20px',
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
