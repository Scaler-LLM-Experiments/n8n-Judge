import React, { useMemo } from 'react';

// Self-contained confetti burst — square pieces (on-brand, zero-radius), no deps.
// Renders a fixed number of pieces that fall + drift + spin, then fade. Mount it
// to fire once (e.g. on a stage-clear moment); unmount to stop.
const COLORS = ['#0055FF', '#22C55E', '#ED7700', '#7C3AED', '#EC4899', '#0E9488'];

export function Confetti({ count = 90 }) {
  const pieces = useMemo(
    () => Array.from({ length: count }, (_, i) => {
      const left = Math.random() * 100;
      const size = 6 + Math.random() * 7;
      const delay = Math.random() * 0.5;
      const dur = 1.3 + Math.random() * 1.4;
      const drift = (Math.random() * 2 - 1) * 140;
      const spin = 360 + Math.random() * 720;
      const color = COLORS[i % COLORS.length];
      return { left, size, delay, dur, drift, spin, color, tall: Math.random() > 0.5 };
    }),
    [count]
  );

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 5 }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: -20,
            left: `${p.left}%`,
            width: p.size,
            height: p.tall ? p.size * 1.8 : p.size,
            background: p.color,
            opacity: 0,
            animation: `confetti-fall ${p.dur}s cubic-bezier(0.3,0.6,0.5,1) ${p.delay}s forwards`,
            ['--drift']: `${p.drift}px`,
            ['--spin']: `${p.spin}deg`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate(var(--drift), 82vh) rotate(var(--spin)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
