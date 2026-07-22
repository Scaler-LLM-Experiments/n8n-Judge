import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, Play, EnvelopeSimpleOpen, Sparkle, BracketsCurly, ArrowsSplit, PaperPlaneTilt } from '@phosphor-icons/react';
import { TopBar } from '../components/TopBar.jsx';
import { Button } from '../design-system/Button.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { N8nEditor } from '../n8n/N8nEditor.jsx';
import { validateGraph } from '../engine/validateGraph.js';
import { simulateAll } from '../engine/simulate.js';

const STEP_ICON = { email: EnvelopeSimpleOpen, trigger: EnvelopeSimpleOpen, classify: Sparkle, parse: BracketsCurly, switch: ArrowsSplit, action: PaperPlaneTilt, dead: XCircle };

// The Build stage: the n8n editor, driven through the problem's 3 build phases.
// Each phase's picker is scoped to that phase; completing a phase (all its node
// types placed) triggers a mascot-narrated overlay that lifts into the next.
export function BuildStage({ problem, onDecision, onComplete }) {
  const phases = problem.buildPhases;
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [overlay, setOverlay] = useState(null); // { coach, step, done }
  const [complete, setComplete] = useState(false);
  const advancing = useRef(false);
  const timer = useRef(null);

  const recordFieldDecision = useCallback((d) => { if (onDecision) onDecision(d); }, [onDecision]);
  const [probe, setProbe] = useState(null); // { type, data }
  const [nudge, setNudge] = useState(null); // string

  const handleWrongPick = useCallback((type) => {
    const p = problem.nodeProbes?.[type];
    if (p) {
      setProbe({ type, data: p });
    } else {
      const label = problem.nodePalette.find((n) => n.type === type)?.label || 'That node';
      setNudge(`${label} doesn’t belong in this step. Take another look.`);
      if (onDecision) onDecision({ id: `nodePick:${type}`, kind: 'nodePick', correct: false, firstTry: false });
      setTimeout(() => setNudge(null), 2600);
    }
  }, [problem, onDecision]);

  const answerProbe = (opt) => {
    if (onDecision) onDecision({ id: `nodePick:${probe.type}`, kind: 'nodePick', label: probe.data.prompt, correct: !!opt.correct, firstTry: false, misconception: opt.misconception });
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const [run, setRun] = useState(null); // { cases, success, val }
  const graphRef = useRef({ nodes: [], edges: [] });

  const phase = phases[phaseIndex];
  const handleGraph = useCallback((nodes, edges) => {
    setPlaced(nodes.map((n) => n.type));
    graphRef.current = {
      nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })),
    };
  }, []);

  const startRun = () => {
    const g = graphRef.current;
    const { cases, success } = simulateAll(g, problem);
    const val = validateGraph(g, problem);
    setRun({ cases, success, val });
  };

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
        <N8nEditor
          pickable={phase?.pickable || []}
          correctTypes={(phase?.nodeTypes || []).filter((t) => t !== 'chat-gemini')}
          onWrongPick={handleWrongPick}
          onGraphChange={handleGraph}
          nodeSetup={problem.nodeSetup}
          onDecision={recordFieldDecision}
        />

        {/* Iris parked bottom-left while building */}
        {!overlay ? (
          <div style={{ position: 'absolute', left: 24, bottom: 24, width: 72, height: 72, zIndex: 30, pointerEvents: 'none' }}>
            <MascotPlayer clip="idle" once={false} onceDone={() => {}} />
          </div>
        ) : null}

        {/* phase-transition overlay */}
        {overlay ? <PhaseOverlay overlay={overlay} total={phases.length} /> : null}

        {/* wrong-pick probe (plausible confusers) */}
        {probe ? <ProbeDialog data={probe.data} onAnswer={answerProbe} onClose={() => setProbe(null)} /> : null}

        {/* light nudge (obvious mis-picks) */}
        {nudge ? (
          <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 55, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', color: 'var(--status-danger)', padding: '9px 14px', fontSize: 13, fontWeight: 600, boxShadow: '0 6px 20px rgba(1,24,69,0.12)' }}>
            <XCircle size={16} weight="fill" /> {nudge}
          </div>
        ) : null}

        {/* run bar once built */}
        {complete && !overlay && !run ? (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 35, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface-0)', borderTop: '1px solid var(--border-strong)' }}>
            <span style={{ fontSize: 13.5, color: 'var(--fg-2)' }}>Flow built — run it on the sample emails.</span>
            <Button variant="primary" icon={<Play size={15} weight="fill" />} onClick={startRun}>Run</Button>
          </div>
        ) : null}

        {/* run simulation */}
        {run ? <RunPanel result={run} onContinue={() => onComplete(run.val)} onClose={() => setRun(null)} /> : null}
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

export function RunPanel({ result, onContinue, onClose }) {
  const { cases, success } = result;
  const [ci, setCi] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [finished, setFinished] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    const frames = [];
    cases.forEach((res, i) => {
      frames.push({ type: 'case', i });
      res.steps.forEach((_, si) => frames.push({ type: 'step', si }));
    });
    frames.push({ type: 'end' });
    let t = 300;
    frames.forEach((f) => {
      timers.current.push(setTimeout(() => {
        if (f.type === 'case') { setCi(f.i); setRevealed(0); }
        else if (f.type === 'step') setRevealed((r) => r + 1);
        else setFinished(true);
      }, t));
      t += f.type === 'case' ? 520 : f.type === 'end' ? 0 : 820;
    });
    return () => timers.current.forEach(clearTimeout);
  }, [cases]);

  const active = cases[ci];

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '52%', zIndex: 55, background: 'var(--surface-0)', borderTop: '1px solid var(--border-strong)', boxShadow: '0 -14px 40px rgba(1,24,69,0.16)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>Running your automation</span>
        <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
          {cases.map((res, i) => {
            const shown = finished || i < ci || (i === ci && revealed > 0);
            const isActive = i === ci && !finished;
            return (
              <span key={res.case.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '3px 8px', border: '1px solid var(--border-subtle)', background: isActive ? 'var(--brand-blue-50)' : 'var(--surface-1)', color: 'var(--fg-2)', fontWeight: isActive ? 700 : 500 }}>
                {shown && (finished || i < ci) ? (res.delivered ? <CheckCircle size={12} weight="fill" color="var(--brand-primary)" /> : <XCircle size={12} weight="fill" color={res.case.branch ? 'var(--status-danger)' : 'var(--fg-3)'} />) : null}
                {res.case.reply || 'General question'}
              </span>
            );
          })}
        </div>
        {finished ? (
          success ? <Button variant="primary" size="sm" iconRight={<ArrowRight size={14} />} onClick={onContinue}>Move to Stress Testing</Button>
                  : <Button variant="outline" size="sm" onClick={onClose}>Back to editing</Button>
        ) : <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--fg-3)', fontSize: 12, cursor: 'pointer' }}>Stop</button>}
      </div>

      <div style={{ padding: '12px 16px', overflowY: 'auto' }}>
        {finished ? (
          <div style={{ fontSize: 13, fontWeight: 600, color: success ? 'var(--brand-primary)' : 'var(--fg-1)', marginBottom: 10 }}>
            {success ? 'Every categorised email reached the right reply. The general question intentionally goes unanswered — notice that gap.' : 'Some emails didn’t reach a reply. Close and finish wiring the flow.'}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--fg-2)', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: 'var(--fg-1)' }}>Email {ci + 1}:</span> {active?.case.subject}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {(active?.steps || []).slice(0, finished ? undefined : Math.max(1, revealed)).map((s, i) => {
            const Icon = STEP_ICON[s.iconType] || Sparkle;
            const color = s.status === 'dead' ? 'var(--status-danger)' : s.status === 'done' ? 'var(--brand-primary)' : 'var(--fg-2)';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: 'var(--fg-1)' }}>
                <Icon size={16} weight="fill" color={color} style={{ flex: 'none', marginTop: 1 }} />
                <span>{s.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProbeDialog({ data, onAnswer, onClose }) {
  const [picked, setPicked] = useState(null);
  const pick = (opt, i) => {
    if (picked !== null) return;
    setPicked(i);
    onAnswer(opt);
  };
  const chosen = picked !== null ? data.options[picked] : null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(1,24,69,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 460, maxWidth: '100%', background: 'var(--surface-0)', border: '1px solid var(--border-strong)', boxShadow: '0 24px 60px rgba(1,24,69,0.3)' }}>
        <div style={{ display: 'flex', gap: 12, padding: '18px 18px 12px' }}>
          <div style={{ width: 52, height: 52, flex: 'none' }}>
            <MascotPlayer clip="shake-no" once={false} onceDone={() => {}} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, alignSelf: 'center' }}>{data.prompt}</div>
        </div>
        <div style={{ padding: '0 18px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.options.map((opt, i) => {
            const isPicked = picked === i;
            const tone = isPicked ? (opt.correct ? 'var(--brand-primary)' : 'var(--status-danger)') : 'var(--border-subtle)';
            return (
              <button key={i} type="button" onClick={() => pick(opt, i)} disabled={picked !== null && !isPicked}
                style={{ textAlign: 'left', padding: '10px 12px', border: `1px solid ${tone}`, background: isPicked ? (opt.correct ? 'var(--brand-blue-50)' : 'var(--status-danger-bg)') : 'var(--surface-0)', fontSize: 13, fontWeight: 500, color: 'var(--fg-1)', cursor: picked === null ? 'pointer' : 'default', fontFamily: 'var(--font-body)', opacity: picked !== null && !isPicked ? 0.5 : 1 }}>
                {opt.text}
              </button>
            );
          })}
        </div>
        {chosen ? (
          <div style={{ margin: '0 18px 14px', padding: '11px 13px', background: 'var(--surface-1)', borderLeft: `3px solid ${chosen.correct ? 'var(--brand-primary)' : 'var(--status-danger)'}`, fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>
            {chosen.response}
          </div>
        ) : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 18px 16px' }}>
          <Button variant="primary" size="sm" disabled={picked === null} onClick={onClose}>Got it</Button>
        </div>
      </div>
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
