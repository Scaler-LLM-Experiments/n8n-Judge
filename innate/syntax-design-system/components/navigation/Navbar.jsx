import React from 'react';

const Caret = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" style={{ marginLeft: 2 }}><path d="m6 9 6 6 6-6" /></svg>
);

/**
 * Navbar — the brand's top app chrome. 60px tall, white, 1px bottom rule,
 * sharp corners. Left logo, center nav links (hover → brand blue), right
 * actions slot. Pass `links` as { label, href, onClick, active, caret }.
 */
export function Navbar({ logo, links = [], actions, sticky = false, style, ...rest }) {
  return (
    <nav
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
        height: 60, padding: '0 24px', background: 'var(--surface-0)',
        borderBottom: '1px solid var(--border-muted)',
        position: sticky ? 'sticky' : undefined, top: sticky ? 0 : undefined, zIndex: sticky ? 'var(--z-sticky, 1100)' : undefined,
        fontFamily: 'var(--font-body)', ...style,
      }}
      {...rest}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, minWidth: 0 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', flex: 'none' }}>
          {logo != null ? logo : <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 600, fontSize: 21, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>SCALER</span>}
        </span>
        {links.length ? (
          <ul style={{ display: 'flex', gap: 2, listStyle: 'none', margin: 0, padding: 0 }}>
            {links.map((l, i) => {
              const Tag = l.href ? 'a' : 'button';
              return (
                <li key={i} style={{ display: 'flex' }}>
                  <Tag
                    href={l.href}
                    onClick={l.onClick}
                    type={l.href ? undefined : 'button'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '8px 14px', border: 0, background: 'transparent', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap',
                      color: l.active ? 'var(--brand-primary)' : 'var(--fg-1)',
                      transition: 'color 120ms var(--ease-standard,ease)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brand-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = l.active ? 'var(--brand-primary)' : 'var(--fg-1)'; }}
                  >
                    {l.label}{l.caret ? <Caret /> : null}
                  </Tag>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {actions != null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 'none' }}>{actions}</div>
      ) : null}
    </nav>
  );
}
