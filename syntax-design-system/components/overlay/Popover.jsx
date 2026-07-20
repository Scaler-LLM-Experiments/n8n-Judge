import React from 'react';

/**
 * Popover — anchored floating content for interactive UI (filters, forms,
 * info-with-links) — unlike Tooltip, which is hover-only text. Self-managed:
 * renders a `trigger`, toggles on click, closes on outside-click and Escape.
 * Positioned inline relative to a wrapping span.
 */
export function Popover({ trigger, children, placement = 'bottom-start', width = 260, style, ...rest }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const [v, h] = placement.split('-');
  const pos = {
    top: { bottom: '100%', marginBottom: 8 },
    bottom: { top: '100%', marginTop: 8 },
    start: { left: 0 },
    end: { right: 0 },
  };

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }} {...rest}>
      <span onClick={() => setOpen((o) => !o)} style={{ display: 'inline-flex', cursor: 'pointer' }}>{trigger}</span>
      {open ? (
        <div
          role="dialog"
          style={{
            position: 'absolute',
            zIndex: 'var(--z-dropdown, 1000)',
            ...(pos[v] || pos.bottom),
            ...(pos[h] || pos.start),
            width,
            background: 'var(--surface-0)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            padding: 16,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--fg-2)',
            animation: 'sbs-fade-up 160ms var(--ease-standard,ease)',
            ...style,
          }}
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      ) : null}
    </span>
  );
}
