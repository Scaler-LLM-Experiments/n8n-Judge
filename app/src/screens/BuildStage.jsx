import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { CheckCircle, XCircle, ArrowRight, Play, Sparkle, CircleNotch, DotsSixVertical, EnvelopeSimpleOpen, BracketsCurly, ArrowsSplit, PaperPlaneTilt } from '@phosphor-icons/react';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { Button } from '../design-system/Button.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { Confetti } from '../components/Confetti.jsx';
import { N8nEditor } from '../n8n/N8nEditor.jsx';
import { validateGraph } from '../engine/validateGraph.js';
import { simulateAll } from '../engine/simulate.js';

const STEP_ICON = { email: EnvelopeSimpleOpen, trigger: EnvelopeSimpleOpen, classify: Sparkle, parse: BracketsCurly, switch: ArrowsSplit, action: PaperPlaneTilt, dead: XCircle };

// Build stage as a storytelling board. The first stage opens with a spotlight on
// the + (canvas already visible, everything else dimmed). Iris (one traveling
// mascot) narrates: a wrong pick is placed then Iris travels to it and floats a
// draggable MCQ before it's removed; a correct node is set up in the centred NDV;
// clearing a whole stage brings Iris centre-stage with confetti before the next.
function sequenceProbe(meta) {
  return {
    prompt: `Hold on — after ${meta.sourceLabel}, this isn’t the next step. Why did you put it here?`,
    options: [
      { text: 'It felt like the next logical step', correct: false, misconception: 'flow-sequence', response: `Not quite — right after ${meta.sourceLabel} the flow needs ${meta.expectedLabel || 'a different node'}. This one belongs elsewhere.` },
      { text: `I thought ${meta.expectedLabel || 'something else'} came later`, correct: false, misconception: 'flow-sequence', response: `Actually ${meta.expectedLabel || 'that step'} comes right here — the order matters so each node gets the data it expects.` },
      { text: 'Added it by mistake', correct: true, response: 'No worries — taking it back out.' },
    ],
  };
}

export function BuildStage({ problem, onDecision, onComplete, devAutoRun }) {
  const phases = problem.buildPhases;

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [stage, setStage] = useState(devAutoRun ? 'preview' : 'building'); // preview | building | clearing | complete | running
  const [showSpotlight, setShowSpotlight] = useState(!devAutoRun);
  const [nodesState, setNodesState] = useState([]); // { id, type, configured, wrong }
  const [probe, setProbe] = useState(null); // { type, nodeId, data, anchor }
  const [nudge, setNudge] = useState(null);
  const [clearInfo, setClearInfo] = useState(null);
  const [run, setRun] = useState(null); // { cases, success, val }
  const [runPos, setRunPos] = useState({ ci: 0, si: 0 }); // current case/step
  const [runFinished, setRunFinished] = useState(false);
  const [showProblem, setShowProblem] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [irisSay, setIrisSay] = useState(null); // chat bubble to the right of parked Iris

  const editorRef = useRef(null);
  const canvasRef = useRef(null);
  const noteRef = useRef(null);
  const graphRef = useRef({ nodes: [], edges: [] });
  const advancing = useRef(false);
  const nudgeTimer = useRef(null);
  const sayTimer = useRef(null);
  const runTimers = useRef([]);

  const phase = phases[phaseIndex];

  // ---- traveling mascot ---------------------------------------------------
  const mascotRef = useRef(null);
  const [mascotClip, setMascotClip] = useState('idle');
  const [mascotVisible, setMascotVisible] = useState(false);

  const box = () => canvasRef.current?.getBoundingClientRect() || { width: 1200, height: 700 };
  const moveTo = useCallback((x, y, size, duration = 0.7) => {
    if (mascotRef.current) gsap.to(mascotRef.current, { left: x, top: y, width: size, height: size, duration, ease: 'power3.inOut' });
  }, []);
  const parkCorner = useCallback(() => {
    const b = box();
    setMascotClip('idle'); setMascotVisible(true);
    moveTo(24, b.height - 96, 68);
  }, [moveTo]);
  const rectOf = (nodeId) => {
    const c = canvasRef.current;
    const el = c?.querySelector(`.react-flow__node[data-id="${nodeId}"]`);
    if (!c || !el) return null;
    const cr = c.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { left: r.left - cr.left, top: r.top - cr.top, width: r.width, height: r.height, cw: cr.width, ch: cr.height };
  };

  // canvas fades in on mount
  useLayoutEffect(() => {
    if (canvasRef.current) gsap.fromTo(canvasRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
  }, []);

  // ---- graph plumbing -----------------------------------------------------
  const handleGraph = useCallback((nodes, edges) => {
    setNodesState(nodes.map((n) => ({ id: n.id, type: n.type, configured: !!n.data.configured, wrong: !!n.data.wrong })));
    graphRef.current = {
      nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })),
    };
  }, []);

  const flashNudge = (msg) => { clearTimeout(nudgeTimer.current); setNudge(msg); nudgeTimer.current = setTimeout(() => setNudge(null), 3200); };
  const saysIris = (msg) => { clearTimeout(sayTimer.current); setIrisSay(msg); sayTimer.current = setTimeout(() => setIrisSay(null), 4200); };

  const dismissSpotlight = () => { setShowSpotlight((s) => { if (s) parkCorner(); return false; }); };

  const handleRedo = () => {
    clearTimeout(nudgeTimer.current); clearTimeout(sayTimer.current); runTimers.current.forEach(clearTimeout); runTimers.current = [];
    advancing.current = false;
    setProbe(null); setNudge(null); setIrisSay(null); setClearInfo(null); setRun(null); setRunFinished(false);
    setNodesState([]); setPhaseIndex(0); setStage('building'); setShowSpotlight(true); setMascotVisible(false);
    setEditorKey((k) => k + 1); // remount the editor → empty canvas
  };

  const handleWrongPick = useCallback((type, nodeId, meta) => {
    setIrisSay(null);
    const authored = problem.nodeProbes[type];
    setProbe({ type, nodeId, data: authored || sequenceProbe(meta || {}), anchor: null });
  }, [problem]);

  const handlePlaceCorrect = useCallback(() => {
    setIrisSay('Nice pick! Now click the glowing node to set it up.');
    clearTimeout(sayTimer.current);
    sayTimer.current = setTimeout(() => setIrisSay(null), 4200);
  }, []);

  // once a probed node is on screen (and any auto-focus has settled), travel Iris
  // to it and anchor the widget beside it
  useEffect(() => {
    if (!probe || probe.anchor) return;
    const t = setTimeout(() => {
      const r = rectOf(probe.nodeId);
      setMascotClip('confused'); setMascotVisible(true);
      if (r) {
        moveTo(Math.max(8, r.left - 76), Math.max(8, r.top - 4), 68);
        const ax = Math.min(Math.max(8, r.left + r.width + 20), r.cw - 392);
        const ay = Math.min(Math.max(16, r.top - 12), r.ch - 360);
        setProbe((p) => (p ? { ...p, anchor: { x: ax, y: ay } } : p));
      } else {
        const b = box();
        setProbe((p) => (p ? { ...p, anchor: { x: b.width / 2 - 190, y: 120 } } : p));
      }
    }, 620);
    return () => clearTimeout(t);
  }, [probe, moveTo]);

  const answerProbe = (opt) => {
    if (onDecision) onDecision({ id: `nodePick:${probe.type}`, kind: 'nodePick', label: probe.data.prompt, correct: !!opt.correct, firstTry: false, misconception: opt.misconception });
  };
  const closeProbe = () => {
    if (probe?.nodeId && editorRef.current) editorRef.current.removeNode(probe.nodeId);
    setProbe(null);
    parkCorner();
  };

  // ---- stage lifecycle ----------------------------------------------------
  // detect a cleared phase (all its node types placed & every set-up node configured)
  useEffect(() => {
    if (stage !== 'building' || advancing.current || probe) return;
    const placedSet = new Set(nodesState.filter((n) => !n.wrong).map((n) => n.type));
    const allPlaced = phase.nodeTypes.every((t) => placedSet.has(t));
    const needConfig = nodesState.filter((n) => !n.wrong && phase.nodeTypes.includes(n.type) && (problem.nodeSetup?.[n.type]?.fields?.length > 0));
    const allConfigured = needConfig.length === 0 || needConfig.every((n) => n.configured);

    // a Switch phase isn't done until every branch is wired to a configured reply
    let branchesOk = true;
    if (phase.nodeTypes.includes('switch')) {
      const g = graphRef.current;
      const sw = g.nodes.find((n) => n.type === 'switch');
      branchesOk = !!sw && (problem.branches || []).every(({ id }) => {
        const e = g.edges.find((ed) => ed.source === sw.id && ed.sourceHandle === id);
        const target = e && g.nodes.find((n) => n.id === e.target);
        return target && target.type === 'action' && target.data?.configured;
      });
    }
    if (!allPlaced || !allConfigured || !branchesOk) return;

    advancing.current = true;
    setMascotVisible(false); // the clear overlay carries its own celebratory Iris
    setClearInfo({ cleared: phase.label, next: phaseIndex < phases.length - 1 ? phases[phaseIndex + 1] : null });
    setStage('clearing');
  }, [nodesState, stage, phase, phaseIndex, phases, probe]);

  const continueFromClear = () => {
    setMascotVisible(false);
    if (clearInfo?.next) {
      setPhaseIndex((i) => i + 1);
      setClearInfo(null);
      setStage('building');
      setTimeout(parkCorner, 60);
      advancing.current = false;
    } else {
      setClearInfo(null);
      setStage('complete');
      advancing.current = false;
    }
  };

  const startRun = () => {
    const g = graphRef.current;
    const { cases, success } = simulateAll(g, problem);
    const val = validateGraph(g, problem);
    setMascotVisible(false); setIrisSay(null);
    editorRef.current?.fitAll?.();
    setRun({ cases, success, val });
    setRunPos({ ci: 0, si: 0 });
    setRunFinished(false);
    setStage('running');
  };

  const stopRun = () => {
    runTimers.current.forEach(clearTimeout); runTimers.current = [];
    setRun(null); setRunFinished(false); setStage('complete');
  };

  // drive the run: step through every case's steps on a timeline
  useEffect(() => {
    if (!run) return;
    runTimers.current.forEach(clearTimeout); runTimers.current = [];
    const seq = [];
    run.cases.forEach((res, ci) => res.steps.forEach((_, si) => seq.push({ ci, si })));
    let t = 900; let prevCi = 0;
    seq.forEach((f, idx) => {
      if (idx > 0) t += f.ci !== prevCi ? 2400 : 2000; // ~2s per node so it's readable
      prevCi = f.ci;
      runTimers.current.push(setTimeout(() => setRunPos(f), t));
    });
    runTimers.current.push(setTimeout(() => setRunFinished(true), t + 1800));
    return () => { runTimers.current.forEach(clearTimeout); runTimers.current = []; };
  }, [run]);

  // the node the current step runs on (falls back to the trigger for the intro step)
  const triggerId = graphRef.current.nodes.find((n) => n.type === 'trigger')?.id || null;
  const activeStep = run && stage === 'running' ? run.cases[runPos.ci]?.steps?.[runPos.si] : null;
  const activeNodeId = run && stage === 'running' && !runFinished ? (activeStep?.nodeId || triggerId) : null;

  // travel the sticky note to the left of the active node
  useEffect(() => {
    if (!activeNodeId || !noteRef.current) return;
    const t = setTimeout(() => {
      const r = rectOf(activeNodeId);
      if (!r || !noteRef.current) return;
      const w = 224;
      let x = r.left - w - 20;
      if (x < 12) x = Math.min(r.left + r.width + 20, r.cw - w - 12);
      const y = Math.min(Math.max(12, r.top + r.height / 2 - 48), r.ch - 130);
      gsap.to(noteRef.current, { left: x, top: y, duration: 0.5, ease: 'power3.inOut' });
    }, 30);
    return () => clearTimeout(t);
  }, [activeNodeId]);

  useEffect(() => () => { clearTimeout(nudgeTimer.current); clearTimeout(sayTimer.current); runTimers.current.forEach(clearTimeout); }, []);

  // dev preview: seed the finished flow and auto-run it (#run-story)
  useEffect(() => {
    if (!devAutoRun) return;
    const t = setTimeout(() => startRun(), 800);
    return () => clearTimeout(t);
  }, [devAutoRun]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-0)' }}>
      <TopBar
        activeStage="dashboard"
        onProblemDoc={() => setShowProblem(true)}
        onAskAI={() => flashNudge('Ask Iris is coming soon ✨')}
        onRedo={handleRedo}
      />

      <div ref={canvasRef} onPointerDownCapture={dismissSpotlight} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <N8nEditor
          key={editorKey}
          ref={editorRef}
          pickable={phase?.pickable || []}
          flow={problem.flow}
          branches={problem.branches}
          initialGraph={devAutoRun ? problem.referenceGraph : undefined}
          runActiveId={activeNodeId}
          onWrongPick={handleWrongPick}
          onPlaceCorrect={handlePlaceCorrect}
          onGraphChange={handleGraph}
          nodeSetup={problem.nodeSetup}
          onDecision={onDecision}
        />

        {/* traveling Iris */}
        <div ref={mascotRef} style={{ position: 'absolute', left: 24, top: 400, width: 68, height: 68, zIndex: 30, pointerEvents: 'none', opacity: mascotVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <MascotPlayer clip={mascotClip} once={false} onceDone={() => {}} />
          </div>
        </div>

        {/* Iris "talking" — chat bubble to the right of the parked mascot */}
        {irisSay && mascotVisible && !probe ? (
          <div className="fade-in" style={{ position: 'absolute', left: 100, bottom: 40, maxWidth: 260, zIndex: 31, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', borderLeft: '3px solid var(--brand-primary)', boxShadow: '0 10px 26px rgba(1,24,69,0.16)', padding: '10px 13px' }}>
            <span style={{ position: 'absolute', left: -8, bottom: 16, width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '8px solid var(--surface-0)' }} />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.5 }}>{irisSay}</div>
          </div>
        ) : null}

        {/* first-stage spotlight on the + */}
        {showSpotlight && phaseIndex === 0 && nodesState.length === 0 ? <SpotlightIntro /> : null}

        {/* wrong-pick floating MCQ */}
        {probe && probe.anchor ? <FloatingProbe probe={probe} onAnswer={answerProbe} onClose={closeProbe} /> : null}

        {/* light nudge */}
        {nudge ? (
          <div className="fade-in" style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 55, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', color: 'var(--fg-1)', padding: '9px 14px', fontSize: 13, fontWeight: 600, boxShadow: '0 6px 20px rgba(1,24,69,0.12)' }}>
            <Sparkle size={15} weight="fill" color="var(--brand-primary)" /> {nudge}
          </div>
        ) : null}

        {/* centre-stage clear moment (with confetti) */}
        {stage === 'clearing' && clearInfo ? <StageClearOverlay info={clearInfo} onContinue={continueFromClear} /> : null}

        {/* run bar */}
        {stage === 'complete' ? (
          <div className="fade-in" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 35, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface-0)', borderTop: '1px solid var(--border-strong)' }}>
            <span style={{ fontSize: 13.5, color: 'var(--fg-2)' }}>Your agent is built — run it on the sample emails.</span>
            <Button variant="primary" icon={<Play size={15} weight="fill" />} onClick={startRun}>Run</Button>
          </div>
        ) : null}

        {/* run: numbered stepper (top) + traveling sticky note over the live canvas */}
        {run ? (
          <>
            <RunStepper run={run} runPos={runPos} finished={runFinished} onStop={stopRun} />
            {activeStep && !runFinished ? (
              <div ref={noteRef} className="fade-in" style={{ position: 'absolute', left: 40, top: 300, width: 224, zIndex: 44, pointerEvents: 'none' }}>
                <RunNote step={activeStep} caseInfo={run.cases[runPos.ci].case} />
              </div>
            ) : null}
            {runFinished && run.success ? <RunCelebration onContinue={() => onComplete(run.val)} /> : null}
            {runFinished && !run.success ? (
              <div className="fade-in" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '14px 16px', background: 'var(--surface-0)', borderTop: '1px solid var(--border-strong)' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>Some emails never reached a reply. Head back and finish wiring the flow.</span>
                <Button variant="outline" size="sm" onClick={stopRun}>Back to editing</Button>
              </div>
            ) : null}
          </>
        ) : null}

        {showProblem ? <ProblemStatementPanel problem={problem} side onClose={() => setShowProblem(false)} /> : null}
      </div>

      <style>{`
        @keyframes irispulse { 0%,100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.14); opacity: 1; } }
        @keyframes pulsering { 0% { box-shadow: 0 0 0 0 rgba(0,85,255,0.45); } 70% { box-shadow: 0 0 0 10px rgba(0,85,255,0); } 100% { box-shadow: 0 0 0 0 rgba(0,85,255,0); } }
        @keyframes fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes runstep { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes runglow { 0%,100% { box-shadow: 0 0 0 3px rgba(0,85,255,0.4), 0 0 18px rgba(0,85,255,0.35); } 50% { box-shadow: 0 0 0 5px rgba(0,85,255,0.18), 0 0 30px rgba(0,85,255,0.55); } }
        @keyframes pulseerror { 0% { box-shadow: 0 0 0 0 rgba(225,29,42,0.5); } 70% { box-shadow: 0 0 0 11px rgba(225,29,42,0); } 100% { box-shadow: 0 0 0 0 rgba(225,29,42,0); } }
        .run-glow { animation: runglow 0.85s ease-in-out infinite; }
        .pulse-error { animation: pulseerror 1.4s ease-out infinite; }
        .pulse-ring { animation: pulsering 1.8s ease-out infinite; }
        .pulse-plus { animation: pulsering 1.5s ease-out infinite; }
        .pulse-field { animation: pulsering 2s ease-out infinite; }
        .fade-in { animation: fadein 0.3s ease-out; }
        .run-step { animation: runstep 0.32s ease-out; }
        .spin { animation: spin 0.9s linear infinite; }
      `}</style>
    </div>
  );
}

// Canvas stays visible; everything dims except a spotlight over the + . A big
// Iris + heading + description sit below it.
function SpotlightIntro() {
  const ref = useRef(null);
  const stack = useRef(null);
  useLayoutEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    if (stack.current) gsap.fromTo(stack.current.children, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out', delay: 0.15 });
  }, []);
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, zIndex: 38, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 50%, rgba(20,30,55,0) 120px, rgba(20,30,55,0.10) 260px, rgba(20,30,55,0.26) 100%)' }}>
      <div ref={stack} style={{ position: 'absolute', left: '50%', top: '13%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', maxWidth: 440 }}>
        <div style={{ width: 84, height: 84 }}>
          <MascotPlayer clip="presenting" once={false} onceDone={() => {}} />
        </div>
        <div style={{ fontFamily: 'var(--font-headline)', fontSize: 26, fontWeight: 600, color: 'var(--fg-1)', textShadow: '0 1px 10px rgba(255,255,255,0.7)' }}>Let’s build your agent</div>
        <div style={{ fontSize: 14, color: 'var(--fg-1)', fontWeight: 500, lineHeight: 1.55, textShadow: '0 1px 8px rgba(255,255,255,0.7)' }}>Click the glowing <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>+</span> below to get started.</div>
      </div>
    </div>
  );
}

function StageClearOverlay({ info, onContinue }) {
  const ref = useRef(null);
  const stack = useRef(null);
  useLayoutEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    if (stack.current) gsap.fromTo(stack.current.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.1, ease: 'power3.out', delay: 0.12 });
  }, []);
  const last = !info.next;
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, zIndex: 58, background: 'rgba(233,236,242,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32, overflow: 'hidden' }}>
      <Confetti />
      <div ref={stack} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: 400, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', boxShadow: '0 24px 70px rgba(1,24,69,0.22)', padding: '30px 34px' }}>
        <div style={{ position: 'relative', width: 104, height: 104 }}>
          <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,85,255,0.22), rgba(0,85,255,0) 70%)', animation: 'irispulse 1.8s ease-in-out infinite' }} />
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <MascotPlayer clip="celebrate" once={false} onceDone={() => {}} />
          </div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--status-success)' }}>
          <CheckCircle size={15} weight="fill" /> {info.cleared} — done
        </div>
        <div style={{ fontFamily: 'var(--font-headline)', fontSize: 21, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.35 }}>
          {last ? 'Your agent is complete.' : info.next.coach}
        </div>
        <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={onContinue} style={{ marginTop: 2 }}>
          {last ? 'Run it' : 'Keep building'}
        </Button>
      </div>
    </div>
  );
}

// Light-themed, draggable floating MCQ; a chat-bubble tail points at Iris.
function FloatingProbe({ probe, onAnswer, onClose }) {
  const { data, type } = probe;
  const ref = useRef(null);
  const [pos, setPos] = useState(probe.anchor);
  const drag = useRef(null);
  const [picked, setPicked] = useState(null);

  useLayoutEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { scale: 0.9, opacity: 0, y: 8 }, { scale: 1, opacity: 1, y: 0, duration: 0.34, ease: 'back.out(1.4)' });
  }, []);

  const onGripDown = (e) => {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onGripMove = (e) => {
    if (!drag.current) return;
    setPos({ x: drag.current.ox + (e.clientX - drag.current.sx), y: drag.current.oy + (e.clientY - drag.current.sy) });
  };
  const onGripUp = (e) => { drag.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ } };

  const pick = (opt, i) => { if (picked !== null) return; setPicked(i); onAnswer(opt); };
  const chosen = picked !== null ? data.options[picked] : null;

  return (
    <div ref={ref} style={{ position: 'absolute', left: pos.x, top: pos.y, width: 380, maxWidth: 'calc(100% - 24px)', zIndex: 56, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', boxShadow: '0 24px 60px rgba(1,24,69,0.28), 0 4px 12px rgba(1,24,69,0.12)' }}>
      <div onPointerDown={onGripDown} onPointerMove={onGripMove} onPointerUp={onGripUp} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: '1px solid var(--border-subtle)', cursor: 'grab', touchAction: 'none', background: 'var(--surface-1)' }}>
        <DotsSixVertical size={16} weight="bold" color="var(--fg-3)" />
        <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', marginLeft: 'auto' }}>{type.replace(/-/g, ' ')}</span>
      </div>

      <span style={{ position: 'absolute', left: -9, top: 46, width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '9px solid var(--border-strong)' }} />
      <span style={{ position: 'absolute', left: -8, top: 46, width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '9px solid var(--surface-0)' }} />

      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brand-primary)', background: 'var(--brand-blue-50, rgba(0,85,255,0.08))', padding: '4px 10px' }}>Iris asks</span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: 'var(--fg-1)', marginBottom: 14 }}>{data.prompt}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.options.map((opt, i) => {
            const isPicked = picked === i;
            const tone = isPicked ? (opt.correct ? 'var(--status-success)' : 'var(--status-danger)') : 'var(--border-subtle)';
            const letterBg = isPicked ? (opt.correct ? 'var(--status-success)' : 'var(--status-danger)') : 'transparent';
            const letterColor = isPicked ? '#fff' : 'var(--fg-2)';
            return (
              <button key={i} type="button" onClick={() => pick(opt, i)} disabled={picked !== null && !isPicked}
                style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '11px 12px', border: `1px solid ${tone}`, background: isPicked ? (opt.correct ? 'var(--status-success-bg)' : 'var(--status-danger-bg)') : 'var(--surface-0)', cursor: picked === null ? 'pointer' : 'default', fontFamily: 'var(--font-body)', opacity: picked !== null && !isPicked ? 0.5 : 1 }}>
                <span style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', border: `1.5px solid ${isPicked ? tone : 'var(--border-strong)'}`, background: letterBg, color: letterColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.4 }}>{opt.text}</span>
              </button>
            );
          })}
        </div>

        {chosen ? (
          <div className="fade-in" style={{ marginTop: 13, padding: '11px 13px', background: 'var(--surface-1)', borderLeft: `3px solid ${chosen.correct ? 'var(--status-success)' : 'var(--status-danger)'}`, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{chosen.response}</div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <Button variant="primary" size="sm" disabled={picked === null} onClick={onClose}>Got it</Button>
        </div>
      </div>
    </div>
  );
}

const RUN_TYPE = { email: 'trigger', trigger: 'trigger', classify: 'classify', parse: 'parse', switch: 'switch', action: 'action' };

// Celebration when every test case passes — confetti + Iris, then on to stage 3.
function RunCelebration({ onContinue }) {
  const ref = useRef(null);
  const stack = useRef(null);
  useLayoutEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    if (stack.current) gsap.fromTo(stack.current.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.1, ease: 'power3.out', delay: 0.12 });
  }, []);
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, zIndex: 58, background: 'rgba(233,236,242,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32, overflow: 'hidden' }}>
      <Confetti count={120} />
      <div ref={stack} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: 440, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', boxShadow: '0 24px 70px rgba(1,24,69,0.22)', padding: '30px 36px' }}>
        <div style={{ position: 'relative', width: 108, height: 108 }}>
          <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,85,255,0.22), rgba(0,85,255,0) 70%)', animation: 'irispulse 1.8s ease-in-out infinite' }} />
          <div style={{ position: 'relative', width: '100%', height: '100%' }}><MascotPlayer clip="celebrate" once={false} onceDone={() => {}} /></div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--status-success)' }}>
          <CheckCircle size={15} weight="fill" /> All test cases passed
        </div>
        <div style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.35 }}>Your agent handled every email correctly.</div>
        <div style={{ fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.5 }}>Now let’s stress-test how well you understand what it does.</div>
        <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={onContinue} style={{ marginTop: 2 }}>Move to Stress Testing</Button>
      </div>
    </div>
  );
}

// Numbered test-case stepper shown below the nav during a run.
function RunStepper({ run, runPos, finished, onStop }) {
  const cases = run.cases;
  const reply = finished ? null : (cases[runPos.ci].case.reply || 'General question');
  return (
    <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-0)', border: '1px solid var(--border-strong)', boxShadow: '0 6px 20px rgba(1,24,69,0.12)', padding: '8px 14px' }}>
        {cases.map((res, i) => {
          const done = finished || i < runPos.ci;
          const active = !finished && i === runPos.ci;
          const bg = active ? 'var(--brand-primary)' : done ? (res.delivered ? 'var(--status-success)' : 'var(--status-danger)') : 'var(--n-200)';
          const color = active || done ? '#fff' : 'var(--fg-3)';
          return (
            <React.Fragment key={i}>
              {i > 0 ? <div style={{ width: 22, height: 2, background: 'var(--border-subtle)' }} /> : null}
              <span title={`Test case ${i + 1}`} style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: bg, color, boxShadow: active ? '0 0 0 4px var(--brand-blue-50)' : 'none', transition: 'background 0.3s ease' }}>
                {done ? (res.delivered ? <CheckCircle size={15} weight="fill" /> : <XCircle size={15} weight="fill" />) : i + 1}
              </span>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)' }}>
        {finished ? 'Run complete' : <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><CircleNotch size={14} weight="bold" color="var(--brand-primary)" className="spin" /> Test case {runPos.ci + 1} · {reply} running…</span>}
        {!finished ? <button type="button" onClick={onStop} style={{ background: 'none', border: 'none', color: 'var(--fg-3)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Stop</button> : null}
      </div>
    </div>
  );
}

// Sticky note that travels beside the running node, narrating what's happening.
function RunNote({ step, caseInfo }) {
  const dead = step.status === 'dead';
  const accent = dead ? 'var(--status-danger)' : step.status === 'done' ? 'var(--status-success)' : 'var(--brand-primary)';
  return (
    <div style={{ position: 'relative', background: '#FEF7E0', border: '1px solid #E7D699', borderLeft: `3px solid ${accent}`, boxShadow: '0 14px 32px rgba(1,24,69,0.2)', padding: '11px 13px' }}>
      <span style={{ position: 'absolute', right: -8, top: 24, width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '8px solid #FEF7E0' }} />
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: accent, marginBottom: 4 }}>{caseInfo.reply || 'General question'}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-1)' }}>{step.text}</div>
    </div>
  );
}

export function RunPanel({ result, onActiveStep, onContinue, onClose }) {
  const { cases, success } = result;
  const [ci, setCi] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [finished, setFinished] = useState(false);
  const timers = useRef([]);
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    if (rootRef.current) gsap.fromTo(rootRef.current, { yPercent: 100 }, { yPercent: 0, duration: 0.36, ease: 'power3.out' });
  }, []);

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
      t += f.type === 'case' ? 560 : f.type === 'end' ? 0 : 780;
    });
    return () => timers.current.forEach(clearTimeout);
  }, [cases]);

  const active = cases[ci];

  // light up the node the current step is running on
  useEffect(() => {
    if (!onActiveStep) return;
    if (finished) { onActiveStep(null); return; }
    const s = (active?.steps || [])[Math.max(0, revealed - 1)];
    onActiveStep(s ? (RUN_TYPE[s.iconType] || null) : null);
  }, [ci, revealed, finished, active, onActiveStep]);

  return (
    <div ref={rootRef} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '42%', zIndex: 55, background: 'var(--surface-0)', borderTop: '1px solid var(--border-strong)', boxShadow: '0 -14px 40px rgba(1,24,69,0.16)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700 }}>
          {!finished ? <CircleNotch size={16} weight="bold" color="var(--brand-primary)" className="spin" /> : <CheckCircle size={16} weight="fill" color={success ? 'var(--status-success)' : 'var(--fg-3)'} />}
          Running your automation
        </span>
        <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
          {cases.map((res, i) => {
            const shown = finished || i < ci || (i === ci && revealed > 0);
            const isActive = i === ci && !finished;
            return (
              <span key={res.case.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '3px 8px', border: `1px solid ${isActive ? 'var(--brand-primary)' : 'var(--border-subtle)'}`, background: isActive ? 'var(--brand-blue-50)' : 'var(--surface-1)', color: 'var(--fg-2)', fontWeight: isActive ? 700 : 500, transition: 'background 0.2s, border-color 0.2s' }}>
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
          <div className="fade-in" style={{ fontSize: 13, fontWeight: 600, color: success ? 'var(--brand-primary)' : 'var(--fg-1)', marginBottom: 10 }}>
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
              <div key={`${ci}-${i}`} className="run-step" style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: 'var(--fg-1)' }}>
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
