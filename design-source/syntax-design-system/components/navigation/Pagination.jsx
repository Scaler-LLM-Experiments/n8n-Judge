import React from 'react';

/**
 * Pagination — page-through control with square number cells and prev/next.
 * Collapses long ranges with an ellipsis. Controlled via `page` (1-based) +
 * `onChange`.
 */
export function Pagination({ page = 1, pageCount = 1, onChange, siblings = 1, style, ...rest }) {
  const go = (p) => { if (p >= 1 && p <= pageCount && p !== page && onChange) onChange(p); };

  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  let pages;
  if (pageCount <= 5 + siblings * 2) {
    pages = range(1, pageCount);
  } else {
    const left = Math.max(2, page - siblings);
    const right = Math.min(pageCount - 1, page + siblings);
    pages = [1];
    if (left > 2) pages.push('…');
    pages.push(...range(left, right));
    if (right < pageCount - 1) pages.push('…');
    pages.push(pageCount);
  }

  const cell = (extra) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 34, height: 34, padding: '0 8px', border: '1px solid var(--border-subtle)',
    background: 'var(--surface-0)', color: 'var(--fg-2)', borderRadius: 0,
    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    transition: 'background 120ms var(--ease-standard,ease), border-color 120ms var(--ease-standard,ease)',
    ...extra,
  });

  const Arrow = ({ dir, disabled }) => (
    <button type="button" aria-label={dir === 'prev' ? 'Previous page' : 'Next page'} disabled={disabled}
      onClick={() => go(dir === 'prev' ? page - 1 : page + 1)}
      style={cell({ color: disabled ? 'var(--fg-4)' : 'var(--fg-2)', cursor: disabled ? 'not-allowed' : 'pointer' })}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 'prev' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
      </svg>
    </button>
  );

  return (
    <nav aria-label="Pagination" style={{ display: 'inline-flex', gap: 6, ...style }} {...rest}>
      <Arrow dir="prev" disabled={page <= 1} />
      {pages.map((p, i) => p === '…' ? (
        <span key={'e' + i} style={cell({ border: '0', cursor: 'default', color: 'var(--fg-4)' })}>…</span>
      ) : (
        <button key={p} type="button" aria-current={p === page ? 'page' : undefined} onClick={() => go(p)}
          style={cell(p === page
            ? { background: 'var(--brand-primary)', borderColor: 'var(--brand-primary)', color: 'var(--fg-on-brand)', fontWeight: 600 }
            : null)}>
          {p}
        </button>
      ))}
      <Arrow dir="next" disabled={page >= pageCount} />
    </nav>
  );
}
