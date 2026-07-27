import React from 'react';

/**
 * Avatar — a square (never round) identity mark. Renders an image when `src`
 * is given, otherwise initials on a brand-blue tile. Optional presence dot.
 */
export function Avatar({ src, name = '', size = 40, presence = null, style, ...rest }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const presenceColor = {
    online: 'var(--status-success)',
    away: 'var(--status-warning)',
    busy: 'var(--status-danger)',
  }[presence];

  return (
    <span style={{ position: 'relative', display: 'inline-flex', flex: 'none', ...style }} {...rest}>
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: size, height: size, objectFit: 'cover', borderRadius: 0, display: 'block' }}
        />
      ) : (
        <span
          style={{
            width: size,
            height: size,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--brand-primary)',
            color: 'var(--fg-on-brand)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: Math.round(size * 0.36),
            letterSpacing: '0.02em',
            borderRadius: 0,
          }}
        >
          {initials || '—'}
        </span>
      )}
      {presenceColor ? (
        <span
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: Math.max(8, Math.round(size * 0.22)),
            height: Math.max(8, Math.round(size * 0.22)),
            background: presenceColor,
            border: '2px solid var(--surface-0)',
          }}
        />
      ) : null}
    </span>
  );
}
