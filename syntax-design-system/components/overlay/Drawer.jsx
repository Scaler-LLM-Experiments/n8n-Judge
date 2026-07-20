import React from 'react';

/**
 * Drawer — an edge-anchored panel that slides in over a scrim. Good for filters,
 * details, secondary forms and nav on small screens. Controlled via `open` +
 * `onClose`; closes on backdrop click and Escape.
 */
export function Drawer({ open, onClose, side = 'right', width = 380, title, children, footer, style, ...rest }) {
  const [entered, setEntered] = React.useState(false);
  React.useEffect(() => {
    if (open) { const t = requestAnimationFrame(() => setEntered(true)); return () => cancelAnimationFrame(t); }
    setEntered(false);
  }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const isH = side === 'left' || side === 'right';
  const hidden = side === 'right' ? 'translateX(100%)' : side === 'left' ? 'translateX(-100%)' : side === 'top' ? 'translateY(-100%)' : 'translateY(100%)';

  const anchor = isH
    ? { top: 0, bottom: 0, [side]: 0, width, maxWidth: '92vw', height: '100%' }
    : { left: 0, right: 0, [side]: 0, height: width, maxHeight: '92vh', width: '100%' };

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-drawer, 1600)', background: 'rgba(1,24,69,0.45)', animation: 'sbs-fade-in 160ms var(--ease-standard,ease)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'absolute',
          ...anchor,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-0)',
          borderLeft: side === 'right' ? '1px solid var(--border-subtle)' : undefined,
          borderRight: side === 'left' ? '1px solid var(--border-subtle)' : undefined,
          borderTop: side === 'bottom' ? '1px solid var(--border-subtle)' : undefined,
          borderBottom: side === 'top' ? '1px solid var(--border-subtle)' : undefined,
          boxShadow: 'var(--shadow-lg)',
          transform: entered ? 'none' : hidden,
          transition: 'transform 240ms var(--ease-entrance,ease)',
          fontFamily: 'var(--font-body)',
          ...style,
        }}
        {...rest}
      >
        {(title || onClose) ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-headline)', fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>{title}</div>
            {onClose ? (
              <button type="button" aria-label="Close" onClick={onClose} style={{ flex: 'none', background: 'transparent', border: 0, padding: 4, margin: -4, cursor: 'pointer', color: 'var(--fg-3)', borderRadius: 0, lineHeight: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            ) : null}
          </div>
        ) : null}
        <div style={{ flex: 1, padding: 22, overflowY: 'auto', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)' }}>{children}</div>
        {footer ? <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: '1px solid var(--border-subtle)' }}>{footer}</div> : null}
      </div>
    </div>
  );
}
