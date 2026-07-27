import React from 'react';

/**
 * Breadcrumb — a hierarchy trail. Pass `items` as { label, href?, onClick? }.
 * The last item is the current page (no link). Chevron separators, brand-blue
 * links.
 */
export function Breadcrumb({ items = [], style, ...rest }) {
  return (
    <nav aria-label="Breadcrumb" style={{ ...style }} {...rest}>
      <ol style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, margin: 0, padding: 0, listStyle: 'none', fontFamily: 'var(--font-body)', fontSize: 13 }}>
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {last ? (
                <span aria-current="page" style={{ color: 'var(--fg-1)', fontWeight: 600 }}>{it.label}</span>
              ) : (
                <a
                  href={it.href || '#'}
                  onClick={it.onClick ? (e) => { e.preventDefault(); it.onClick(e); } : undefined}
                  style={{ color: 'var(--fg-3)', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brand-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fg-3)'; }}
                >
                  {it.label}
                </a>
              )}
              {!last ? (
                <span style={{ display: 'inline-flex', color: 'var(--fg-4)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
