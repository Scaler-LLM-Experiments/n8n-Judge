import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { CheckCircle, XCircle, ArrowRight, Play, Sparkle, CircleNotch, DotsSixVertical, EnvelopeSimpleOpen, BracketsCurly, ArrowsSplit, PaperPlaneTilt, ArrowUUpLeft } from '@phosphor-icons/react';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { Button } from '../design-system/Button.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { Confetti } from '../components/Confetti.jsx';
import { N8nEditor } from '../n8n/N8nEditor.jsx';
import { validateGraph } from '@judge/engine/validateGraph.js';
import { simulateAll, roleOf } from '@judge/engine/simulate.js';
import { allBranchesWired } from '@judge/engine/branchReach.js';
import { checkAnswer } from '../lib/grader.js';
import { traceableGraph } from '../lib/traceGraph.js';
import { useTraceContext } from '../lib/TraceContext.jsx';
import { useVoiceActions } from '../lib/VoiceContext.jsx';

/** What a learner calls this node, for a spoken line. */
function nodeLabel(type) {
  return String(type ?? '').replace(/[-_]/g, ' ');
}

const STEP_ICON = { email: EnvelopeSimpleOpen, trigger: EnvelopeSimpleOpen, classify: Sparkle, parse: BracketsCurly, switch: ArrowsSplit, action: PaperPlaneTilt, dead: XCircle };

// Build stage as a storytelling board. The first stage opens with a spotlight on
// the + (canvas already visible, everything else dimmed). Iris (one traveling
// mascot) narrates: a wrong pick is placed then Iris travels to it and floats a
// draggable MCQ before it's removed; a correct node is set up in the centred NDV;
// clearing a whole stage brings Iris centre-stage with confetti before the next.
// Fired when a node is placed out of order. This probe is generated in code
// rather than authored per problem, so validateProblem() never sees it — it
// has to hold the same three rules by hand: never name the node that should go
// here (`meta.expectedLabel` is deliberately unused), no escape hatch, and a
// correct answer that teaches why order matters rather than what the order is.
//
// The misconception underneath is always the same one: thinking a node can
// reach for data from anywhere in the flow, rather than only what the node
// immediately before it hands over. Both wrong options record `flow-sequence`.
// The probe for a SEQUENCE mistake — a node that could be right somewhere but not
// here. Unlike the authored `nodeProbes`, which are keyed by node type and so differ
// every time, this one is generated, and for a long time it was a single hardcoded
// question: put three nodes in the wrong order over a sitting and you were asked the
// identical thing, word for word, three times.
//
// Four framings of the same rule, rotated per mistake. All four teach "a node only
// gets what the one before it hands over", because that IS the rule being broken; what
// changes is the angle it is approached from, which is what keeps a learner reading
// the options instead of recognising the shape and clicking.
const SEQUENCE_PROBES = [
  (source) => ({
    prompt: `Hold on. This can’t go straight after ${source}. What does a node actually receive when the flow reaches it?`,
    options: [
      {
        text: 'Only what the node immediately before it passes on',
        correct: true,
        response: `Right. So look at what ${source} actually hands over, and ask whether this node can do its job with just that. If something it needs hasn’t been produced yet, it can’t run here.`,
      },
      {
        text: 'Anything produced anywhere earlier in the flow',
        correct: false,
        misconception: 'flow-sequence',
        response: `No. Each node is handed the output of the one directly before it. Work out what ${source} produces, and what this node needs before it can start.`,
      },
      {
        text: 'The original input, unchanged, at every step',
        correct: false,
        misconception: 'flow-sequence',
        response: `Each step transforms what it receives and passes the new version on, so what leaves ${source} isn’t what arrived. What shape is the data in by the time it gets here?`,
      },
    ],
  }),
  (source) => ({
    prompt: `This one can’t sit here yet. What has to be true before a node is able to run?`,
    options: [
      {
        text: 'Everything it needs already exists in what it was handed',
        correct: true,
        response: `Exactly. This node needs something ${source} hasn’t produced, so there’s nothing for it to work with. Something has to make that data first.`,
      },
      {
        text: 'It only needs to be connected to something',
        correct: false,
        misconception: 'flow-sequence',
        response: `A wire isn’t enough. A node runs on the data it receives, and right now ${source} isn’t handing over what this one needs.`,
      },
      {
        text: 'It can fetch whatever it is missing itself',
        correct: false,
        misconception: 'flow-sequence',
        response: `Nodes don’t reach backwards for data. Each one works with what arrives, so what ${source} passes on has to be enough.`,
      },
    ],
  }),
  (source) => ({
    prompt: `Say you ran the flow exactly as it is now. What would happen when it got to this node?`,
    options: [
      {
        text: 'It would be handed data it can’t do its job with',
        correct: true,
        response: `That’s it. ${source} passes on something this node can’t use, so putting it here breaks the run rather than doing nothing.`,
      },
      {
        text: 'It would wait until the data it needs shows up',
        correct: false,
        misconception: 'flow-sequence',
        response: `Nothing waits. Each node runs when the flow reaches it, with whatever ${source} handed over.`,
      },
      {
        text: 'It would skip itself and let the flow carry on',
        correct: false,
        misconception: 'flow-sequence',
        response: `Nodes don’t opt out. It will run, on the wrong input, which is why the order matters.`,
      },
    ],
  }),
  (source) => ({
    prompt: `Not here. What decides where a node is allowed to sit in a flow?`,
    options: [
      {
        text: 'What the node before it produces',
        correct: true,
        response: `Yes. The question is always what ${source} hands over, and whether this node can work with exactly that.`,
      },
      {
        text: 'How the node itself is configured',
        correct: false,
        misconception: 'flow-sequence',
        response: `Settings can’t conjure up missing data. However you configure this one, it still only gets what ${source} passes on.`,
      },
      {
        text: 'The order you placed the nodes on the canvas in',
        correct: false,
        misconception: 'flow-sequence',
        response: `Placement order doesn’t matter, the wiring does. Follow the connection from ${source} and ask what arrives here.`,
      },
    ],
  }),
];

function sequenceProbe(meta, variant = 0) {
  const source = meta.sourceLabel || 'the previous node';
  const build = SEQUENCE_PROBES[((variant % SEQUENCE_PROBES.length) + SEQUENCE_PROBES.length) % SEQUENCE_PROBES.length];
  return build(source);
}

// `initialGraph` seeds the canvas: the finished reference flow for the #run-story
// dev route, or a resumed learner's own half-built graph replayed from the trace.
export function BuildStage({ problem, onDecision, onComplete, devAutoRun, sessionId, initialGraph, resumePhaseId }) {
  const { trace } = useTraceContext();
  const voice = useVoiceActions();
  const phases = problem.buildPhases;

  // The phase they had reached, from the last `phase_transition` in their trace.
  //
  // Starting at 0 regardless — which is what this did — is not a small
  // inaccuracy: the canvas is restored too, so the phase-cleared effect below
  // immediately fires for a phase whose nodes are already placed and configured,
  // and the learner clicks through a celebration for every phase they had
  // already earned before reaching the one they were actually on.
  //
  // An unknown id (a phase renamed since they started) falls back to 0 rather
  // than to a guess.
  const [phaseIndex, setPhaseIndex] = useState(() => {
    if (!resumePhaseId) return 0;
    const at = phases.findIndex((p) => p.id === resumePhaseId);
    return at === -1 ? 0 : at;
  });
  const [stage, setStage] = useState(devAutoRun ? 'preview' : 'building'); // preview | building | clearing | complete | running
  // The spotlight teaches the first `+` on an EMPTY canvas, and it is a full-screen
  // overlay. Showing it to a learner whose nodes have just been restored points at
  // nothing and swallows their first click on the canvas — so it goes if they are
  // resuming past phase one OR arriving with a graph.
  const [showSpotlight, setShowSpotlight] = useState(
    !devAutoRun && !resumePhaseId && !initialGraph?.nodes?.length
  );
  const [nodesState, setNodesState] = useState([]); // { id, type, configured, wrong }
  const [probe, setProbe] = useState(null); // { type, nodeId, data, anchor }
  // The probe's explanation is server-graded now (`nodeProbes[type].options[].response`
  // is stripped from the payload) — resolved async after a pick, with the
  // locally-generated `sequenceProbe` text as fallback (the server has never
  // heard of that one; it's authored in code, not in problem data).
  const [probeWhy, setProbeWhy] = useState(null);
  const [probeResolving, setProbeResolving] = useState(false);
  const [nudge, setNudge] = useState(null);
  const [clearInfo, setClearInfo] = useState(null);
  const [run, setRun] = useState(null); // { cases, success, val }
  const [runPos, setRunPos] = useState({ ci: 0, si: 0 }); // current case/step
  const [runFinished, setRunFinished] = useState(false);
  // Which side of the active node the traveling sticky note sits on. The note
  // prefers the node's left, but flips to the right when there isn't room
  // (e.g. the trigger sits at the canvas's left edge) — the speech-bubble
  // pointer has to flip with it, or it ends up aimed at empty canvas instead
  // of the node it's narrating.
  const [noteSide, setNoteSide] = useState('left');
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
  // How many generated sequence probes this learner has already been shown, so the
  // next one asks a different question. A ref, not state: nothing re-renders on it.
  const sequenceProbeSeen = useRef(0);

  const box = () => canvasRef.current?.getBoundingClientRect() || { width: 1200, height: 700 };
  const moveTo = useCallback((x, y, size, duration = 0.7) => {
    if (mascotRef.current) gsap.to(mascotRef.current, { left: x, top: y, width: size, height: size, duration, ease: 'power3.inOut' });
  }, []);
  const parkCorner = useCallback(() => {
    const b = box();
    setMascotClip('idle'); setMascotVisible(true);
    // Hard into the left corner. She was pushed to x=96 to clear React Flow's zoom
    // buttons; those now live bottom-right (see N8nEditor), so the corner is hers.
    moveTo(20, b.height - 96, 68);
  }, [moveTo]);
  const rectOf = (nodeId) => {
    const c = canvasRef.current;
    const el = c?.querySelector(`.react-flow__node[data-id="${nodeId}"]`);
    if (!c || !el) return null;
    const cr = c.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { left: r.left - cr.left, top: r.top - cr.top, width: r.width, height: r.height, cw: cr.width, ch: cr.height };
  };

  /**
   * Notice when the learner has gone quiet, and offer help.
   *
   * Armed at 60s of no interaction, then re-armed at 180s, so it offers twice at
   * most in a long silence rather than nagging every minute. Any pointer event or
   * keypress resets it, and it is disabled while a probe, a run or a phase
   * transition is on screen: those are moments where the learner is meant to be
   * reading, and interrupting them would be the opposite of helpful.
   */
  const idleRef = useRef({ timer: null, count: 0 });
  useEffect(() => {
    const busy = stage !== 'building' || Boolean(probe) || Boolean(clearInfo);
    const state = idleRef.current;
    const clear = () => {
      clearTimeout(state.timer);
      state.timer = null;
    };
    if (busy) {
      clear();
      return undefined;
    }

    const arm = () => {
      clear();
      // First offer after a minute; if they are still quiet, once more at three.
      const delay = state.count === 0 ? 60000 : 180000;
      if (state.count > 1) return;
      state.timer = setTimeout(() => {
        state.count += 1;
        voice.play('idle_nudge');
        arm();
      }, delay);
    };

    const reset = () => {
      // Any sign of life restarts the clock, and forgives the earlier silence.
      state.count = 0;
      arm();
    };

    arm();
    const events = ['pointerdown', 'keydown', 'wheel'];
    for (const e of events) window.addEventListener(e, reset, { passive: true });
    return () => {
      clear();
      for (const e of events) window.removeEventListener(e, reset);
    };
  }, [stage, probe, clearInfo, voice]);

  // Iris introduces the canvas, then each phase as it starts. Guarded by a ref
  // per moment key so React's development double-render does not repeat a line.
  const spokenRef = useRef({});
  const sayOnce = useCallback((key, moment, vars) => {
    if (spokenRef.current[key]) return;
    spokenRef.current[key] = true;
    voice.play(moment, vars);
  }, [voice]);

  useEffect(() => {
    if (stage !== 'building') return;
    sayOnce('build_start', 'build_start');
  }, [stage, sayOnce]);

  useEffect(() => {
    if (stage !== 'building' || !phase) return;
    // The phase label is read out, so a new phase announces itself by name rather
    // than with a generic "next part".
    // `key` is the phase id, so a problem can author `phase_intro:<phase>` the same
    // way it authors `phase_complete:<phase>` — and so the clip the generator wrote
    // is the clip this asks for.
    sayOnce(`phase:${phase.id}`, 'phase_intro', { key: phase.id, phase: phase.label });
  }, [stage, phase, sayOnce]);

  // canvas fades in on mount
  useLayoutEffect(() => {
    if (canvasRef.current) gsap.fromTo(canvasRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
  }, []);

  // ---- graph plumbing -----------------------------------------------------
  const handleGraph = useCallback((nodes, edges) => {
    setNodesState(nodes.map((n) => ({ id: n.id, type: n.type, configured: !!n.data.configured, wrong: !!n.data.wrong })));
    const next = {
      nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })),
    };

    // Report the shape change, not every React re-render. The canvas is what an
    // admin replays to see how someone built their flow, so the op and the full
    // post-change snapshot both matter — but a graph that did not change is noise.
    const before = graphRef.current;
    if (before) {
      const grew = next.nodes.length > before.nodes.length;
      const shrank = next.nodes.length < before.nodes.length;
      const wired = next.edges.length > before.edges.length;
      const unwired = next.edges.length < before.edges.length;
      const op = grew ? 'add_node' : shrank ? 'remove_node' : wired ? 'connect' : unwired ? 'disconnect' : null;
      if (op) {
        const added = next.nodes.find((n) => !before.nodes.some((b) => b.id === n.id));
        trace('graph_mutation', {
          op,
          ...(added ? { nodeType: added.type } : {}),
          // Built from the EDITOR's nodes, not from `next`. `next` has already
          // dropped `position`, and mapping the traced payload off it recorded
          // `position: undefined` on every node — which the resume endpoint then
          // refused, so a learner got their screen back with an empty canvas.
          // See traceGraph.js.
          graph: traceableGraph(nodes, edges),
        });
      }
    }

    graphRef.current = next;
  }, [trace]);

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

  // Every placement is recorded, right or wrong — this is the Build score's only
  // data source. Before this, a correct pick recorded nothing at all and only
  // wrong picks appeared (via the probe), so "chose the right node" was
  // ungraded. Fire-and-forget: the UI already knows the verdict, the round trip
  // exists so the SERVER has the attempt on record.
  const recordPlacement = useCallback((slotType, placedType) => {
    if (!slotType) return;
    checkAnswer(sessionId, 'placement', slotType, placedType);
  }, [sessionId]);

  const handleWrongPick = useCallback((type, nodeId, meta) => {
    setIrisSay(null);
    setProbeWhy(null);
    setProbeResolving(false);
    // Charged to the slot the learner was trying to fill, not to the node they
    // wrongly reached for — that slot is the scored item.
    recordPlacement(meta?.expectedTypes?.[0], type);
    trace('probe_shown', { nodeType: type });
    const authored = problem.nodeProbes[type];
    // Keyed by the wrong node's type so the line rotates per node rather than being
    // one sentence for every mistake in the session.
    voice.play('node_wrong', { key: type, scope: `wrong:${type}` });
    // Only the generated sequence probe needs a rotation counter: the authored ones
    // differ from each other already, because they are keyed by node type.
    const data = authored || sequenceProbe(meta || {}, sequenceProbeSeen.current);
    if (!authored) sequenceProbeSeen.current += 1;
    setProbe({ type, nodeId, data, anchor: null });
  }, [problem, recordPlacement, voice]);

  const handlePlaceCorrect = useCallback((type) => {
    recordPlacement(type, type);
    setIrisSay('Nice pick! Now click the glowing node to set it up.');
    clearTimeout(sayTimer.current);
    sayTimer.current = setTimeout(() => setIrisSay(null), 4200);
    // `key` selects a per-node line from `problem.voice` when the author wrote
    // one ("node_placed:switch"), and `node` fills the label into the default.
    // A generic "now set it up" cannot know that this node is the one deciding
    // where an email goes; the author can.
    voice.play('node_placed', { key: type, node: problem.nodeSetup?.[type]?.label ?? nodeLabel(type), scope: `place:${type}` });
  }, [recordPlacement, voice, problem]);

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

  // `answer` is the option's TEXT, never an index — options are shuffled per
  // session, so the server has to match on what was actually shown. Capture
  // type/prompt as locals rather than reading `probe` again inside `.then`:
  // the probe can already be closed (nulled) by the time this resolves.
  const answerProbe = (opt) => {
    const type = probe.type;
    const prompt = probe.data.prompt;
    setProbeResolving(true);
    checkAnswer(sessionId, 'probe', type, opt.text).then((server) => {
      const correct = server ? server.correct : !!opt.correct;
      const firstTry = server ? server.firstTry : false;
      if (onDecision) onDecision({ id: `nodePick:${type}`, kind: 'nodePick', label: prompt, correct, firstTry, misconception: opt.misconception });
      // Fall back to the locally-authored response only when the server had
      // nothing to say (no session, or a code-generated sequenceProbe that
      // isn't in `problem.nodeProbes` for it to grade).
      setProbeWhy(server ? server.why : opt.response);
      setProbeResolving(false);
      // Spoken once the verdict is settled, and only when it IS settled: a check
      // that could not complete returns `correct: null`, and reacting to that would
      // be Iris telling the learner they were wrong when nobody graded them.
      if (correct === true) voice.play('probe_correct', { key: type, scope: `probe:${type}` });
      else if (correct === false) voice.play('probe_wrong', { key: type, scope: `probe:${type}` });
    });
  };
  const closeProbe = () => {
    if (probe?.nodeId && editorRef.current) editorRef.current.removeNode(probe.nodeId);
    setProbe(null);
    setProbeWhy(null);
    setProbeResolving(false);
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

    // A routing phase isn't done until every branch reaches a configured reply.
    // The walk lives in the engine (`allBranchesWired`) because it has to agree
    // with the simulator's: a branch may pass through configured passthrough nodes,
    // and a reply is anything the catalog calls an action — Slack and Notion end a
    // run as surely as Send Reply. Asserting `type === 'action'` on the immediate
    // target here made correct flows unable to finish the stage.
    const branchesOk = phase.nodeTypes.includes('switch')
      ? allBranchesWired(graphRef.current, problem)
      : true;
    if (!allPlaced || !allConfigured || !branchesOk) return;

    advancing.current = true;
    setMascotVisible(false); // the clear overlay carries its own celebratory Iris
    setClearInfo({ cleared: phase.label, next: phaseIndex < phases.length - 1 ? phases[phaseIndex + 1] : null });
    // Finishing a stage is the one thing a learner has actually earned, so this
    // is where the energy goes. The last phase gets its own line, because "one
    // more piece in place" is wrong when there are no more pieces.
    const isLast = phaseIndex >= phases.length - 1;
    voice.play(isLast ? 'build_complete' : 'phase_complete', { key: phase.id, scope: `phase:${phase.id}` });
    setStage('clearing');
  }, [nodesState, stage, phase, phaseIndex, phases, probe, voice]);

  const continueFromClear = () => {
    voice.stop(); // moving to the next phase; the celebration is over
    setMascotVisible(false);
    if (clearInfo?.next) {
      trace('phase_transition', { phaseId: clearInfo.next.id, label: clearInfo.next.label });
      setPhaseIndex((i) => i + 1);
      setClearInfo(null);
      setStage('building');
      setTimeout(parkCorner, 60);
      advancing.current = false;
    } else {
      // The last phase's button says "Run it", so it runs. It used to drop the
      // learner onto a bottom bar carrying a SECOND "Run" button: they pressed
      // the thing labelled "Run it" and nothing ran.
      setClearInfo(null);
      advancing.current = false;
      startRun();
    }
  };

  const startRun = () => {
    const g = graphRef.current;
    const { cases, success } = simulateAll(g, problem);
    const val = validateGraph(g, problem);
    // Iris STAYS on screen through the run. She narrates it — one `run_case` line
    // per email as it enters the flow, then the verdict — and a voice with no
    // mascot anywhere on the page reads as a bug. She used to be hidden here,
    // which was easy to miss while the run was gated behind a "Run" bar; now that
    // finishing the build runs straight away, the whole animation played with the
    // corner empty. Parked, not traveling: the sticky note is the thing that
    // follows the nodes.
    setIrisSay(null);
    parkCorner();
    editorRef.current?.fitAll?.();
    voice.play('run_start', { scope: 'run' });
    // The run animation is a couple of seconds of lead time, and only two things
    // can be said at the end of it.
    voice.setUpcoming([
      { moment: 'run_pass', vars: {} },
      { moment: 'run_fail', vars: {} },
      { moment: 'stress_start', vars: {} },
    ]);
    setRun({ cases, success, val });
    setRunPos({ ci: 0, si: 0 });
    setRunFinished(false);
    setStage('running');
  };

  const stopRun = () => {
    runTimers.current.forEach(clearTimeout); runTimers.current = [];
    setRun(null); setRunFinished(false); setStage('complete');
  };

  // Skip the ANIMATION, not the result. The run is ~2s per node so a learner who
  // already knows what they built should not have to sit through it, but they
  // still have to be told what happened: this lands on exactly the finished state
  // the timeline was going to reach (celebration, or the fix-the-wiring bar) and
  // speaks the same verdict, because the timers that would have spoken it are
  // being cancelled here.
  const skipRun = () => {
    if (!run || runFinished) return;
    runTimers.current.forEach(clearTimeout); runTimers.current = [];
    const lastCi = Math.max(0, run.cases.length - 1);
    setRunPos({ ci: lastCi, si: Math.max(0, (run.cases[lastCi]?.steps?.length ?? 1) - 1) });
    setRunFinished(true);
    voice.play(run.success ? 'run_pass' : 'run_fail', { scope: 'run' });
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
      // Say what THIS email is as it enters the flow. A run is four emails going
      // through in sequence and, without this, all a learner sees is a sticky note
      // moving: the cases are indistinguishable from each other. The line describes
      // the email and never where it ends up, because watching it land is the point.
      if (idx === 0 || f.ci !== prevCi) {
        const sample = problem.sampleCases?.[f.ci];
        if (sample?.id) {
          const at = t;
          runTimers.current.push(
            setTimeout(() => voice.play('run_case', { key: sample.id, scope: `run:${sample.id}` }), at)
          );
        }
      }
      prevCi = f.ci;
      runTimers.current.push(setTimeout(() => setRunPos(f), t));
    });
    runTimers.current.push(setTimeout(() => {
      setRunFinished(true);
      // Spoken only once the run has actually finished animating, so the verdict
      // does not arrive while cases are still visibly running.
      // `run.success`, NOT `success`: the bare identifier does not exist in this
      // scope (it is a local inside `startRun`), so this line threw inside the
      // timeout and the verdict was never spoken at all. `setRunFinished` above
      // had already run, so the screen looked correct and only the audio was
      // missing — which is why it read as "run_pass is never wired up".
      voice.play(run.success ? 'run_pass' : 'run_fail', { scope: 'run' });
    }, t + 1800));
    return () => { runTimers.current.forEach(clearTimeout); runTimers.current = []; };
  }, [run]);

  // the node the current step runs on (falls back to the trigger for the intro step).
  // Resolved via the catalog role, not a literal type string — a trigger's node
  // TYPE varies by problem (email-triage's is literally "trigger", but
  // meeting-notes' is "webhook"), so `n.type === 'trigger'` silently matched
  // nothing outside email-triage and left the intro step with no active node:
  // the sticky note froze at its unset default position and nothing on the
  // canvas highlighted for that whole step.
  const triggerId = graphRef.current.nodes.find((n) => roleOf(n.type) === 'trigger')?.id || null;
  const activeStep = run && stage === 'running' ? run.cases[runPos.ci]?.steps?.[runPos.si] : null;
  const activeNodeId = run && stage === 'running' && !runFinished ? (activeStep?.nodeId || triggerId) : null;

  // travel the sticky note to the left of the active node (or the right, if
  // there isn't room — see `noteSide` above)
  useEffect(() => {
    if (!activeNodeId || !noteRef.current) return;
    const t = setTimeout(() => {
      const r = rectOf(activeNodeId);
      if (!r || !noteRef.current) return;
      const w = 224;
      let x = r.left - w - 20;
      let side = 'left';
      if (x < 12) {
        x = Math.min(r.left + r.width + 20, r.cw - w - 12);
        side = 'right';
      }
      const y = Math.min(Math.max(12, r.top + r.height / 2 - 48), r.ch - 130);
      setNoteSide(side);
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
        problem={problem}
        currentPhase={phase?.label || phase?.id}
        onProblemDoc={() => setShowProblem(true)}
        onRedo={handleRedo}
      />

      <div ref={canvasRef} onPointerDownCapture={dismissSpotlight} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <N8nEditor
          key={editorKey}
          ref={editorRef}
          pickable={phase?.pickable || []}
          flow={problem.flow}
          branches={problem.branches}
          initialGraph={devAutoRun ? problem.referenceGraph : initialGraph}
          runActiveId={activeNodeId}
          onWrongPick={handleWrongPick}
          onPlaceCorrect={handlePlaceCorrect}
          onGraphChange={handleGraph}
          nodeSetup={problem.nodeSetup}
          onDecision={onDecision}
          sessionId={sessionId}
        />

        {/* traveling Iris */}
        <div ref={mascotRef} style={{ position: 'absolute', left: 24, top: 400, width: 68, height: 68, zIndex: 30, pointerEvents: 'none', opacity: mascotVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
          {/* No glow here. "Iris is speaking" is one screen-level indicator now
              (VoiceoverIndicator, mounted once in App), blooming from this corner.
              A second glow inside the mascot's own 68px box read as a border. */}
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
        {probe && probe.anchor ? (
          <FloatingProbe probe={probe} onAnswer={answerProbe} onClose={closeProbe} resolvedWhy={probeWhy} resolving={probeResolving} />
        ) : null}

        {/* light nudge */}
        {nudge ? (
          <div className="fade-in" style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 55, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', color: 'var(--fg-1)', padding: '9px 14px', fontSize: 13, fontWeight: 600, boxShadow: '0 6px 20px rgba(1,24,69,0.12)' }}>
            <Sparkle size={15} weight="fill" color="var(--brand-primary)" /> {nudge}
          </div>
        ) : null}

        {/* centre-stage clear moment (with confetti) */}
        {stage === 'clearing' && clearInfo ? <StageClearOverlay info={clearInfo} onContinue={continueFromClear} /> : null}

        {/* Run-again bar. Only reachable by stopping a run or coming back from a
            failed one — finishing the build now runs straight away, so this is no
            longer a gate between "built" and "running". Copy stays problem-neutral:
            "sample emails" was wrong for meeting-notes and order-desk. */}
        {stage === 'complete' ? (
          <div className="fade-in" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 35, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface-0)', borderTop: '1px solid var(--border-strong)' }}>
            <span style={{ fontSize: 13.5, color: 'var(--fg-2)' }}>Your agent is on the canvas. Run it on the sample cases whenever you’re ready.</span>
            <Button variant="primary" icon={<Play size={15} weight="fill" />} onClick={startRun}>Run again</Button>
          </div>
        ) : null}

        {/* run: numbered stepper (top) + traveling sticky note over the live canvas */}
        {run ? (
          <>
            <RunStepper run={run} runPos={runPos} finished={runFinished} onStop={stopRun} />
            {activeStep && !runFinished ? (
              <div ref={noteRef} className="fade-in" style={{ position: 'absolute', left: 40, top: 300, width: 224, zIndex: 44, pointerEvents: 'none' }}>
                <RunNote step={activeStep} caseInfo={run.cases[runPos.ci].case} side={noteSide} />
              </div>
            ) : null}
            {/* Secondary, bottom centre, and deliberately not a bar: the run has the
                canvas and the stepper already. Skips the waiting, never the verdict. */}
            {!runFinished ? (
              <div className="fade-in" style={{ position: 'absolute', left: '50%', bottom: 22, transform: 'translateX(-50%)', zIndex: 46 }}>
                <Button variant="outline" size="sm" iconRight={<ArrowRight size={14} />} onClick={skipRun}>Skip the run</Button>
              </div>
            ) : null}
            {runFinished && run.success ? <RunCelebration onContinue={() => { trace('run_result', { graph: { nodes: (graphRef.current?.nodes ?? []).map((n) => ({ id: n.id, type: n.type })), edges: graphRef.current?.edges ?? [] }, validation: { allPassed: !!run.val?.allPassed, ...run.val } }); onComplete({ validation: run.val, graph: graphRef.current }); }} /> : null}
            {runFinished && !run.success ? (
              <div className="fade-in" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '14px 16px', background: 'var(--surface-0)', borderTop: '1px solid var(--border-strong)' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>Some emails never reached a reply. Head back and finish wiring the flow.</span>
                <Button variant="outline" size="sm" onClick={stopRun}>Back to editing</Button>
              </div>
            ) : null}
          </>
        ) : null}

        {showProblem ? <ProblemStatementPanel problem={problem} sticky onClose={() => setShowProblem(false)} /> : null}
      </div>

      <style>{`
        @keyframes irispulse { 0%,100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.14); opacity: 1; } }
        @keyframes pulsering { 0% { box-shadow: 0 0 0 0 rgba(0,85,255,0.38), 0 0 9px 1px rgba(0,85,255,0.22); } 70% { box-shadow: 0 0 0 11px rgba(0,85,255,0), 0 0 9px 1px rgba(0,85,255,0); } 100% { box-shadow: 0 0 0 0 rgba(0,85,255,0), 0 0 9px 1px rgba(0,85,255,0); } }
        @keyframes fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes runstep { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes runglow { 0%,100% { box-shadow: 0 0 0 3px rgba(0,85,255,0.4), 0 0 18px rgba(0,85,255,0.35); } 50% { box-shadow: 0 0 0 5px rgba(0,85,255,0.18), 0 0 30px rgba(0,85,255,0.55); } }
        @keyframes pulseerror { 0% { box-shadow: 0 0 0 0 rgba(225,29,42,0.5); } 70% { box-shadow: 0 0 0 11px rgba(225,29,42,0); } 100% { box-shadow: 0 0 0 0 rgba(225,29,42,0); } }
        .run-glow { animation: runglow 0.85s ease-in-out infinite; }
        .pulse-error { animation: pulseerror 1.4s ease-out infinite; }
        .pulse-ring { animation: pulsering 1.9s ease-out infinite; }
        .pulse-plus { animation: pulsering 1.7s ease-out infinite; }
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
function FloatingProbe({ probe, onAnswer, onClose, resolvedWhy, resolving }) {
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
  // Shuffled: probe answers were never at index 0 and almost always at
  // index 1, so "always pick the second" beat 16 of 18 probes.
  // Server-balanced order — see the note in DissectionScreen. The browser cannot
  // see which probe option is correct, so shuffling here was randomising blind.
  const options = data.options ?? [];
  const chosen = picked !== null ? options[picked] : null;

  return (
    // Short, with the question scrolling inside it, so "Got it" is always on screen.
    // The panel floats over the canvas at an anchor that can already be well down the
    // page, so its own height is the thing that has to give: the prompt, three options
    // and the explanation together are taller than a laptop window, and the button
    // used to sit below all of it — the learner had to scroll a floating panel to find
    // the only way to close it. 440px keeps the whole widget inside a short viewport
    // even when anchored low, and the body scrolls under a pinned footer.
    <div ref={ref} style={{ position: 'absolute', left: pos.x, top: pos.y, width: 380, maxWidth: 'calc(100% - 24px)', maxHeight: 'min(58vh, 440px)', display: 'flex', flexDirection: 'column', zIndex: 56, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', boxShadow: '0 24px 60px rgba(1,24,69,0.28), 0 4px 12px rgba(1,24,69,0.12)' }}>
      <div onPointerDown={onGripDown} onPointerMove={onGripMove} onPointerUp={onGripUp} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: '1px solid var(--border-subtle)', cursor: 'grab', touchAction: 'none', background: 'var(--surface-1)' }}>
        <DotsSixVertical size={16} weight="bold" color="var(--fg-3)" />
        <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', marginLeft: 'auto' }}>{type.replace(/-/g, ' ')}</span>
      </div>

      <span style={{ position: 'absolute', left: -9, top: 46, width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '9px solid var(--border-strong)' }} />
      <span style={{ position: 'absolute', left: -8, top: 46, width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '9px solid var(--surface-0)' }} />

      <div style={{ padding: '14px 16px 16px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brand-primary)', background: 'var(--brand-blue-50, rgba(0,85,255,0.08))', padding: '4px 10px' }}>Iris asks</span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: 'var(--fg-1)', marginBottom: 14 }}>{data.prompt}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Deliberately NOT scored green/red. This probe fires because the
              node is wrong — that is already settled, and the node comes off
              the canvas whichever option is chosen. Colouring the accurate
              answer green read as "you were right", and then the node
              vanished. The selection is neutral; the explanation carries the
              meaning. Right/wrong is still recorded for the report. */}
          {options.map((opt, i) => {
            const isPicked = picked === i;
            const tone = isPicked ? 'var(--brand-primary)' : 'var(--border-subtle)';
            return (
              <button key={i} type="button" onClick={() => pick(opt, i)} disabled={picked !== null && !isPicked}
                style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '11px 12px', border: `1px solid ${tone}`, background: isPicked ? 'var(--brand-blue-50, rgba(0,85,255,0.08))' : 'var(--surface-0)', cursor: picked === null ? 'pointer' : 'default', fontFamily: 'var(--font-body)', opacity: picked !== null && !isPicked ? 0.5 : 1 }}>
                <span style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', border: `1.5px solid ${isPicked ? tone : 'var(--border-strong)'}`, background: isPicked ? 'var(--brand-primary)' : 'transparent', color: isPicked ? '#fff' : 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.4 }}>{opt.text}</span>
              </button>
            );
          })}
        </div>

        {chosen ? (
          <div className="fade-in">
            <div style={{ marginTop: 13, padding: '11px 13px', background: 'var(--surface-1)', borderLeft: '3px solid var(--brand-primary)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
              {/* The server's explanation for the chosen option wins once it
                  resolves; `chosen.response` is only a legitimate fallback,
                  never a first read — for an authored probe it no longer
                  exists in the payload at all, so a request in flight shows a
                  neutral placeholder rather than nothing was verified. */}
              {resolvedWhy ?? (resolving ? 'Checking…' : chosen.response)}
            </div>
            {/* Say the outcome plainly. The node is leaving either way, and
                leaving that implicit is what made the panel confusing. */}
            <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--fg-3)' }}>
              <ArrowUUpLeft size={13} weight="bold" />
              Taking it back off the canvas — pick again when you’re ready.
            </div>
          </div>
        ) : null}

      </div>

      {/* Outside the scrolling area, full width: the one action this panel has. */}
      <div style={{ flex: 'none', padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-0)' }}>
        <Button variant="primary" disabled={picked === null} onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>Got it</Button>
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
// `side` is which side of the node the note itself sits on ('left' is the
// common case; 'right' when the node has no room to its left, e.g. the
// trigger at the canvas edge — see the placement effect in BuildStage). The
// tail must point back at the node, so it renders on the opposite edge from
// `side` rather than always on the right.
function RunNote({ step, caseInfo, side = 'left' }) {
  const dead = step.status === 'dead';
  const accent = dead ? 'var(--status-danger)' : step.status === 'done' ? 'var(--status-success)' : 'var(--brand-primary)';
  const tailOnRight = side === 'left';
  return (
    <div style={{ position: 'relative', background: '#FEF7E0', border: '1px solid #E7D699', borderLeft: `3px solid ${accent}`, boxShadow: '0 14px 32px rgba(1,24,69,0.2)', padding: '11px 13px' }}>
      {tailOnRight ? (
        <span style={{ position: 'absolute', right: -8, top: 24, width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '8px solid #FEF7E0' }} />
      ) : (
        <span style={{ position: 'absolute', left: -8, top: 24, width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '8px solid #FEF7E0' }} />
      )}
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
