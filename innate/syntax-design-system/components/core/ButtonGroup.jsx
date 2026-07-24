import React from 'react';

/**
 * ButtonGroup — a segmented row of choices with collapsed shared borders.
 * Single-select via `value` + `onChange`. Pass `items` as { value, label,
 * icon? }. Sharp corners; the selected segment fills brand blue.
 */
export function ButtonGroup({ items = [], value, onChange, size = 'md', disabled = false, style, ...rest }) {
  const heights = { sm: 32, md: 36, lg: 44 };
  const fonts = { sm: 13, md: 14, lg: 15 };
  const h = heights[size] || heights.md;
  return (
    <div style={{ display: 'inline-flex', border: '1px solid var(--border-strong)', ...style }} role="group" {...rest}>
      {items.map((it, i) => {
        const selected = value === it.value;
        return (
          <button
            key={it.value}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={(e) => onChange && onChange(it.value, e)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: h,
              padding: '0 16px',
              border: 0,
              borderLeft: i === 0 ? 0 : '1px solid var(--border-strong)',
              borderRadius: 0,
              background: selected ? 'var(--brand-primary)' : 'var(--surface-0)',
              color: selected ? 'var(--fg-on-brand)' : 'var(--fg-2)',
              fontFamily: 'var(--font-body)',
              fontSize: fonts[size] || 14,
              fontWeight: 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'background 120ms var(--ease-standard,ease), color 120ms var(--ease-standard,ease)',
              whiteSpace: 'nowrap',
            }}
          >
            {it.icon ? <span style={{ display: 'inline-flex', flex: 'none' }}>{it.icon}</span> : null}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
