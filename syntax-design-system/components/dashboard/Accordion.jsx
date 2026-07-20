import React from 'react';

/**
 * Accordion — a sharp-cornered disclosure list. Each item { id, title, meta,
 * content }. Open header fills brand blue (the product's module pattern);
 * locked items are disabled and greyed. Uncontrolled by default; pass
 * `openId` + `onOpenChange` to control. Single-open.
 */
export function Accordion({ items = [], defaultOpenId = null, openId, onOpenChange, style, ...rest }) {
  const [internal, setInternal] = React.useState(defaultOpenId);
  const current = openId !== undefined ? openId : internal;
  const setOpen = (id) => {
    const next = current === id ? null : id;
    if (onOpenChange) onOpenChange(next);
    if (openId === undefined) setInternal(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...style }} {...rest}>
      {items.map((it) => {
        const isOpen = current === it.id && !it.locked;
        return (
          <div key={it.id}>
            <div
              onClick={() => !it.locked && setOpen(it.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, height: 56, padding: '0 18px',
                background: isOpen ? 'var(--brand-primary)' : it.locked ? 'var(--surface-1)' : 'var(--surface-2)',
                color: isOpen ? '#fff' : it.locked ? 'var(--fg-4)' : 'var(--fg-1)',
                cursor: it.locked ? 'not-allowed' : 'pointer', borderRadius: 0,
                transition: 'background 120ms var(--ease-standard,ease)',
              }}
            >
              <span style={{ display: 'inline-flex', transition: 'transform 180ms var(--ease-standard,ease)', transform: isOpen ? 'rotate(90deg)' : 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </span>
              <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 500, fontSize: 17, letterSpacing: '-0.01em' }}>{it.title}</span>
              <span style={{ flex: 1 }} />
              {it.meta ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{it.meta}</span> : null}
            </div>
            {isOpen ? <div style={{ padding: '8px 4px' }}>{it.content}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
