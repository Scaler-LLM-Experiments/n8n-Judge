import React from 'react';

function injectKf() {
  if (typeof document === 'undefined' || document.getElementById('sbs-motion-kf')) return;
  const el = document.createElement('style');
  el.id = 'sbs-motion-kf';
  el.textContent = `
    @keyframes sbs-spin { to { transform: rotate(360deg); } }
    @keyframes sbs-shimmer { 0% { background-position: -160% 0; } 100% { background-position: 160% 0; } }
    @keyframes sbs-indeterminate { 0% { left: -40%; width: 40%; } 50% { width: 55%; } 100% { left: 100%; width: 40%; } }
    @keyframes sbs-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes sbs-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes sbs-scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
  `;
  document.head.appendChild(el);
}

/**
 * Modal — a focused, interruptive dialog. Fixed scrim + centered sharp-cornered
 * panel with optional title, body and footer. Closes on backdrop click and
 * Escape (both opt-out-able). Controlled via `open` + `onClose`.
 */
export function Modal({ open, onClose, title, children, footer, size = 'md', closeOnBackdrop = true, closeOnEsc = true, style, ...rest }) {
  React.useEffect(() => { injectKf(); }, []);
  React.useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;
  const widths = { sm: 400, md: 520, lg: 720 };

  return (
    <div
      onMouseDown={(e) => { if (closeOnBackdrop && e.target === e.currentTarget && onClose) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal, 1700)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(1,24,69,0.45)',
        animation: 'sbs-fade-in 160ms var(--ease-standard,ease)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: widths[size] || widths.md,
          maxWidth: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-0)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'sbs-scale-in 200ms var(--ease-entrance,ease)',
          fontFamily: 'var(--font-body)',
          ...style,
        }}
        {...rest}
      >
        {(title || onClose) ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {title ? <div style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>{title}</div> : null}
            </div>
            {onClose ? (
              <button type="button" aria-label="Close" onClick={onClose} style={{ flex: 'none', background: 'transparent', border: 0, padding: 4, margin: -4, cursor: 'pointer', color: 'var(--fg-3)', borderRadius: 0, lineHeight: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            ) : null}
          </div>
        ) : null}
        <div style={{ padding: 24, overflowY: 'auto', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)' }}>{children}</div>
        {footer ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border-subtle)' }}>{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
