import React, { useEffect, useState } from 'react';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';

// Shown while the server works out the report.
//
// Grading is server-authoritative now, so there is a real wait between
// finishing Stress Testing and seeing a score. An empty screen during that
// wait reads as a hang, so Iris holds the moment and narrates what is being
// looked at — which doubles as a summary of what was actually graded.

const BEATS = [
  'Replaying everything you did…',
  'Checking how you dissected the problem…',
  'Looking at the flow you built…',
  'Reading how you set each node up…',
  'Weighing your edge-case answers…',
  'Writing up what you understood…',
];

export function GradingLoader({ label }) {
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    // Cycles rather than sitting on one line, so a slower grade still looks
    // like progress instead of a stall.
    const t = setInterval(() => setBeat((b) => (b + 1) % BEATS.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        height: '100%',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        background: 'var(--surface-0)',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ width: 108, height: 108 }}>
        <MascotPlayer clip="thinking" once={false} onceDone={() => {}} />
      </div>

      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--brand-primary)',
          fontWeight: 700,
        }}
      >
        Marking your work
      </div>

      <div
        aria-live="polite"
        style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 600, color: 'var(--fg-1)', maxWidth: 460, lineHeight: 1.3 }}
      >
        {label ?? BEATS[beat]}
      </div>

      {/* An indeterminate bar: the server does not report progress, and a fake
          percentage would be a lie the learner can time. */}
      <div style={{ width: 220, height: 3, background: 'var(--surface-2)', overflow: 'hidden', position: 'relative' }}>
        <div className="grading-sweep" style={{ position: 'absolute', inset: 0, width: '40%', background: 'var(--brand-primary)' }} />
      </div>

      <style>{`
        @keyframes grading-sweep-kf {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        .grading-sweep { animation: grading-sweep-kf 1.35s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
