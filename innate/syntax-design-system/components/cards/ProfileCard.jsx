import React from 'react';

/**
 * ProfileCard — a people-led card (mentor, alum, testimonial). Portrait-forward
 * so landing pages feel human. Square photo, then name, role, company, and an
 * optional quote. Zero radius, hairline border. `layout` switches portrait
 * placement: "top" (stacked) or "side" (photo left).
 */
export function ProfileCard({
  photo,
  name,
  role,
  company,
  quote,
  stat,
  layout = 'top',
  style,
  ...rest
}) {
  const side = layout === 'side';
  return (
    <div
      style={{
        display: side ? 'grid' : 'flex',
        gridTemplateColumns: side ? '128px 1fr' : undefined,
        flexDirection: side ? undefined : 'column',
        background: 'var(--surface-0)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 0,
        overflow: 'hidden',
        ...style,
      }}
      {...rest}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: side ? '1 / 1' : '4 / 5', overflow: 'hidden', background: 'var(--surface-2)' }}>
        <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {quote ? (
          <p style={{ fontFamily: 'var(--font-headline)', fontSize: side ? 16 : 18, fontWeight: 500, lineHeight: 1.35, letterSpacing: '-0.01em', color: 'var(--fg-1)', margin: '0 0 6px' }}>
            “{quote}”
          </p>
        ) : null}
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--fg-1)' }}>{name}</span>
        {(role || company) ? (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-3)' }}>
            {role}{role && company ? ' · ' : ''}{company}
          </span>
        ) : null}
        {stat ? (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--brand-primary)', marginTop: 4 }}>{stat}</span>
        ) : null}
      </div>
    </div>
  );
}
