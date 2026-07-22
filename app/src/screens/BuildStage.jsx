import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, ArrowRight, Play } from '@phosphor-icons/react';
import { TopBar } from '../components/TopBar.jsx';
import { Button } from '../design-system/Button.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { N8nEditor } from '../n8n/N8nEditor.jsx';

// The Build stage: the n8n editor, driven through the problem's 3 build phases.
// Each phase's picker is scoped to that phase; completing a phase (all its node
// types placed) triggers a mascot-narrated overlay that lifts into the next.
export function BuildStage({ problem, onComplete }) {
  const phases = problem.buildPhases;
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [overlay, setOverlay] = useState(null); // { coach, step, done }
  const [complete, setComplete] = useState(false);
  const advancing = useRef(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const phase = phases[phaseIndex];
  const handleGraph = useCallback((nodes) => setPlaced(nodes.map((n) => n.type)), []);

  useEffect(() => {
    if (advancing.current || complete) return;
    const set = new Set(placed);
    const done = phase.nodeTypes.every((t) => set.has(t));
    if (!done) return;
    advancing.current = true;
    if (phaseIndex < phases.length - 1) {
      const next = phases[phaseIndex + 1];
      setOverlay({ coach: next.coach, step: phaseIndex + 2 });
      timer.current = setTimeout(() => {
        setOverlay(null);
        setPhaseIndex((i) => i + 1);
        advancing.current = false;
      }, 2900);
    } else {
      setOverlay({ coach: 'Your flow is built. Run it to watch it handle real emails.', done: true });
      timer.current = setTimeout(() => {
        setOverlay(null);
        setComplete(true);
        advancing.current = false;
      }, 2600);
    }
  }, [placed, phase, phaseIndex, phases, complete]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-0)' }}>
      <TopBar activeStage="dashboard" />
      <SubStageBar phases={phases} phaseIndex={phaseIndex} complete={complete} />

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <N8nEditor pickable={phase?.pickable || []} onGraphChange={handleGraph} />

        {/* Iris parked bottom-left while building */}
        {!overlay ? (
          <div style={{ position: 'absolute', left: 24, bottom: 24, width: 72, height: 72, zIndex: 30, pointerEvents: 'none' }}>
            <MascotPlayer clip="idle" once={false} onceDone={() => {}} />
          </div>
        ) : null}

        {/* phase-transition overlay */}
        {overlay ? <PhaseOverlay overlay={overlay} total={phases.length} /> : null}

        {/* run bar once built */}
        {complete && !overlay ? (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 35, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface-0)', borderTop: '1px solid var(--border-strong)' }}>
            <span style={{ fontSize: 13.5, color: 'var(--fg-2)' }}>Flow built — run it on the sample emails.</span>
            <Button variant="primary" iconRight={<ArrowRight size={15} />} icon={<Play size={15} weight="fill" />} onClick={onComplete}>
              Run &amp; continue
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SubStageBar({ phases, phaseIndex, complete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
      {phases.map((p, i) => {
        const done = complete || i < phaseIndex;
        const active = !complete && i === phaseIndex;
        return (
          <React.Fragment key={p.id}>
            {i > 0 ? <div style={{ width: 24, height: 1, background: 'var(--border-subtle)' }} /> : null}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: active || done ? 'var(--fg-1)' : 'var(--fg-3)' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: done || active ? 'var(--brand-primary)' : 'var(--n-200)', color: done || active ? 'var(--fg-on-brand)' : 'var(--fg-3)' }}>
                {done ? <CheckCircle size={12} weight="fill" /> : i + 1}
              </span>
              {p.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PhaseOverlay({ overlay, total }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    }
  }, []);
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(1,24,69,0.84)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center', padding: 32 }}>
      <div style={{ width: 104, height: 104 }}>
        <MascotPlayer clip={overlay.done ? 'celebrate' : 'nod-yes'} once={false} onceDone={() => {}} />
      </div>
      {overlay.step ? (
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
          Step {overlay.step} of {total}
        </div>
      ) : null}
      <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', maxWidth: 560, lineHeight: 1.4 }}>{overlay.coach}</div>
    </div>
  );
}
