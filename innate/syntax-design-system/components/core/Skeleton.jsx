import React from 'react';

/**
 * Skeleton — a loading placeholder block with a subtle cool shimmer. Zero
 * radius (matches the brand). Use to preserve layout while content loads.
 * `variant="text"` renders a shorter line; pass explicit width/height for
 * blocks, avatars (square) and thumbnails.
 */
export function Skeleton({ width, height, variant = 'block', style, ...rest }) {
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

  const dims = variant === 'text'
    ? { width: width || '70%', height: height || 12 }
    : { width: width || '100%', height: height || 64 };

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        ...dims,
        borderRadius: 0,
        background: 'linear-gradient(90deg, var(--n-150) 25%, var(--n-200) 37%, var(--n-150) 63%)',
        backgroundSize: '300% 100%',
        animation: 'sbs-shimmer 1.4s var(--ease-soft,ease) infinite',
        ...style,
      }}
      {...rest}
    />
  );
}
