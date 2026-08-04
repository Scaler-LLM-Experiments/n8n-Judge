import React, { useMemo } from 'react';

// Self-contained confetti burst — square pieces (on-brand, zero-radius), no deps.
// Mount to fire once (stage-clear / run-pass); unmount to stop.
//
// Fall distance uses `top` percentages (relative to the host box), not translateY %.
// Percentages in transform are relative to the *element*, so a 10px flake at 110%
// only moves 11px — that is why pieces used to die mid-panel. `top: 105%` is of
// the overlay, so every flake reaches (and clears) the bottom edge.
const COLORS = [
  '#0055FF',
  '#3B82F6',
  '#22C55E',
  '#ED7700',
  '#F59E0B',
  '#7C3AED',
  '#EC4899',
  '#0E9488',
  '#EF4444',
];

export function Confetti({ count = 110 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const left = Math.random() * 100;
        // Two waves: dense first burst, then a lighter trailing rain.
        const wave = i < count * 0.65 ? 0 : 1;
        const size = 5 + Math.random() * 9;
        const delay = wave * 0.35 + Math.random() * (wave ? 0.7 : 0.45);
        const dur = 2.2 + Math.random() * 1.5;
        const drift = (Math.random() * 2 - 1) * (90 + Math.random() * 110);
        const spin = (Math.random() > 0.5 ? 1 : -1) * (280 + Math.random() * 640);
        const color = COLORS[i % COLORS.length];
        const kind = Math.random();
        const tall = kind > 0.55;
        const thin = kind < 0.22;
        return { left, size, delay, dur, drift, spin, color, tall, thin };
      }),
    [count],
  );

  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 5 }}
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: '-8%',
            left: `${p.left}%`,
            width: p.thin ? Math.max(3, p.size * 0.35) : p.size,
            height: p.tall ? p.size * 2.1 : p.thin ? p.size * 1.4 : p.size,
            background: p.color,
            opacity: 0,
            willChange: 'transform, top, opacity',
            animation: `confetti-fall ${p.dur}s cubic-bezier(0.22, 0.61, 0.36, 1) ${p.delay}s forwards`,
            ['--drift']: `${p.drift}px`,
            ['--spin']: `${p.spin}deg`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            top: -8%;
            transform: translateX(0) rotate(0deg);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          /* Stay solid until past the bottom so the fall reads all the way down */
          82% {
            opacity: 1;
          }
          100% {
            top: 108%;
            transform: translateX(var(--drift)) rotate(var(--spin));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
