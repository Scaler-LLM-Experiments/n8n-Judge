import React from 'react';

/** One-time keyframes injection for the system's motion utilities. */
function useSbsKeyframes() {
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
}

/**
 * Spinner — indeterminate loading. A square ring (zero radius, brand rule) with
 * a brand-blue rotating edge. Use only when duration is unknown; prefer
 * Skeleton or Progress when you can show structure or completion.
 */
export function Spinner({ size = 20, color = 'var(--brand-primary)', thickness = 2, label = 'Loading', style, ...rest }) {
  useSbsKeyframes();
  return (
    <span
      role="status"
      aria-label={label}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        boxSizing: 'border-box',
        border: `${thickness}px solid var(--n-200)`,
        borderTopColor: color,
        borderRightColor: color,
        animation: 'sbs-spin 700ms linear infinite',
        ...style,
      }}
      {...rest}
    />
  );
}
