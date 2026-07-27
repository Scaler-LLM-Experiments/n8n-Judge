import React from 'react';

/**
 * List — a vertical stack of item rows. Hairline separators, optional leading
 * glyph / trailing node, sharp corners. Each item:
 * { id, primary, secondary, leading, trailing, meta, href, onClick, selected, disabled }.
 * Pass `render` on an item to take over its body entirely.
 */
export function List({ items = [], size = 'md', bordered = true, divided = true, style, ...rest }) {
  const pad = size === 'sm' ? '10px 14px' : '14px 16px';
  return (
    <div
      role="list"
      style={{
        display: 'flex', flexDirection: 'column',
        border: bordered ? '1px solid var(--border-subtle)' : 'none',
        background: bordered ? 'var(--surface-0)' : 'transparent',
        ...style,
      }}
      {...rest}
    >
      {items.map((it, i) => {
        const clickable = !it.disabled && (it.onClick || it.href);
        const Tag = it.href ? 'a' : 'div';
        return (
          <Tag
            key={it.id != null ? it.id : i}
            role="listitem"
            href={it.href}
            onClick={it.disabled ? undefined : it.onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: pad, textDecoration: 'none', color: 'inherit',
              borderTop: divided && i > 0 ? '1px solid var(--border-subtle)' : 'none',
              borderLeft: it.selected ? '2px solid var(--brand-primary)' : '2px solid transparent',
              background: it.selected ? 'var(--brand-blue-50)' : 'transparent',
              cursor: clickable ? 'pointer' : 'default',
              opacity: it.disabled ? 0.5 : 1,
              transition: 'background 100ms var(--ease-standard,ease)',
            }}
            onMouseEnter={(e) => { if (clickable && !it.selected) e.currentTarget.style.background = 'var(--surface-1)'; }}
            onMouseLeave={(e) => { if (!it.selected) e.currentTarget.style.background = 'transparent'; }}
          >
            {it.render ? it.render(it, i) : (
              <>
                {it.leading != null ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', color: 'var(--fg-3)' }}>{it.leading}</span>
                ) : null}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: size === 'sm' ? 13 : 14, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.4 }}>{it.primary}</span>
                  {it.secondary != null ? (
                    <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: size === 'sm' ? 12 : 13, color: 'var(--fg-3)', lineHeight: 1.45, marginTop: 2 }}>{it.secondary}</span>
                  ) : null}
                </span>
                {it.meta != null ? (
                  <span style={{ flex: 'none', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-4)', whiteSpace: 'nowrap' }}>{it.meta}</span>
                ) : null}
                {it.trailing != null ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', flex: 'none', color: 'var(--fg-3)' }}>{it.trailing}</span>
                ) : null}
              </>
            )}
          </Tag>
        );
      })}
    </div>
  );
}
