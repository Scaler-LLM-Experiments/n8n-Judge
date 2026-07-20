import React from 'react';

/**
 * Tabs — a horizontal tablist with a brand-blue active underline. Sharp
 * corners. Controlled via `value` + `onChange`. Pass `items` as
 * { value, label, icon?, count? }. Renders the bar only; render the active
 * panel yourself based on `value`.
 */
export function Tabs({ items = [], value, onChange, size = 'md', style, ...rest }) {
  const fonts = { sm: 13, md: 15 };
  const pads = { sm: '0 0 8px', md: '0 0 12px' };
  return (
    <div
      role="tablist"
      style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border-subtle)', ...style }}
      {...rest}
    >
      {items.map((it) => {
        const active = value === it.value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={(e) => onChange && onChange(it.value, e)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: pads[size] || pads.md,
              marginBottom: -1,
              border: 0,
              borderBottom: `2px solid ${active ? 'var(--brand-primary)' : 'transparent'}`,
              background: 'transparent',
              borderRadius: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: fonts[size] || 15,
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--brand-primary)' : 'var(--fg-3)',
              transition: 'color 120ms var(--ease-standard,ease), border-color 120ms var(--ease-standard,ease)',
              whiteSpace: 'nowrap',
            }}
          >
            {it.icon ? <span style={{ display: 'inline-flex', flex: 'none' }}>{it.icon}</span> : null}
            {it.label}
            {it.count != null ? (
              <span style={{ fontSize: 12, fontWeight: 600, padding: '1px 6px', background: active ? 'var(--brand-blue-100)' : 'var(--n-100)', color: active ? 'var(--brand-primary)' : 'var(--fg-3)' }}>{it.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
