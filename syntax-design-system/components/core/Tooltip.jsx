import React from 'react';

/**
 * Tooltip — a small hover/focus hint anchored to its child. Sharp corners,
 * dark navy surface, fades in after a short delay. Positioned inline (no
 * portal) relative to a wrapping span, so it inherits the anchor's stacking.
 * Wrap a single interactive element as the child.
 */
export function Tooltip({ content, placement = 'top', delay = 120, style, children, ...rest }) {
  React.useEffect(() => {
    if (document.getElementById('sbs-motion-kf')) return;
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
  }, []);
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef(null);
  const show = () => { timer.current = setTimeout(() => setOpen(true), delay); };
  const hide = () => { clearTimeout(timer.current); setOpen(false); };

  const pos = {
    top:    { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
    left:   { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 8 },
    right:  { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8 },
  };

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      {...rest}
    >
      {children}
      {open && content ? (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 'var(--z-tooltip, 2000)',
            ...pos[placement],
            padding: '6px 10px',
            background: 'var(--surface-overlay)',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-md)',
            pointerEvents: 'none',
            animation: 'sbs-fade-in 120ms var(--ease-standard,ease)',
            ...style,
          }}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
