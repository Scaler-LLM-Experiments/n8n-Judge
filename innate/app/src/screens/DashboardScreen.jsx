import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  EnvelopeSimpleOpen,
  Sparkle,
  BracketsCurly,
  ArrowsSplit,
  PaperPlaneTilt,
  XCircle,
  CheckCircle,
  Circle,
  Lightning,
  ArrowRight,
  GitBranch,
} from '@phosphor-icons/react';
import { nodeTypes } from '../nodes/nodeTypes.js';
import { NodePalette } from '../components/NodePalette.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { NodeDetailView } from '../components/NodeDetailView.jsx';
import { Tour } from '../components/Tour.jsx';
import { JudgeMascot } from '../mascot/JudgeMascot.jsx';
import { Button } from '../design-system/Button.jsx';
import { validateGraph } from '../engine/validateGraph.js';
import { checkDrop, isStepComplete } from '../engine/checkDrop.js';
import { simulateAll } from '../engine/simulate.js';
import { connectionStatus } from '../engine/connections.js';

const labelForType = (problem, type) => problem.nodePalette.find((n) => n.type === type)?.label || type;
const requiredTypesForStep = (problem, step) =>
  problem.nodePalette.filter((n) => !n.isDistractor && step.categories.includes(n.category)).map((n) => n.type);

let nodeIdCounter = 0;
const nextNodeId = () => `node-${(nodeIdCounter += 1)}`;

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#94A3B8' },
  style: { stroke: '#94A3B8', strokeWidth: 1.75 },
};

const STEP_ICON = {
  email: EnvelopeSimpleOpen,
  trigger: EnvelopeSimpleOpen,
  classify: Sparkle,
  parse: BracketsCurly,
  switch: ArrowsSplit,
  action: PaperPlaneTilt,
  dead: XCircle,
};

const CANVAS_TOUR = [
  { selector: '[data-tour="active-step"]', eyebrow: 'Building a workflow', title: 'Work one step at a time', body: 'The palette is split into steps. Only the current step is unlocked — drag its nodes onto the canvas. The next step opens once this one is done.' },
  { selector: '[data-tour="canvas"]', title: 'Wire the nodes together', body: 'Drag from a node’s right dot to the next node’s left dot. The dashed port under Classify with AI is where a language model plugs in — n8n is about configuration and connections, not just placing boxes.' },
  { selector: '[data-tour="run"]', title: 'Run it on real emails', body: 'Hit Run and watch four sample emails flow through your automation, node by node — you’ll see exactly where each one ends up.' },
];

const NDV_TOUR = [
  { selector: '[data-tour="ndv"]', eyebrow: 'Every node has a brain', title: 'Configure the node', body: 'This is the node’s detail view. Real n8n work happens here — set the model, the routing rules, the reply text. Tweak the values, not just the wires.' },
];

function DashboardCanvas({ problem, onAllTestsPassed }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showStatement, setShowStatement] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [dropPreview, setDropPreview] = useState(null);
  const [rejectedAt, setRejectedAt] = useState(null);
  const [sim, setSim] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [tour, setTour] = useState(CANVAS_TOUR);
  const ndvTouredRef = useRef(false);
  const canvasRef = useRef(null);
  const rejectTimer = useRef(null);
  const simTimers = useRef([]);
  const { screenToFlowPosition } = useReactFlow();

  const studentGraph = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })),
    }),
    [nodes, edges]
  );

  const step = problem.buildSteps[stepIndex];
  const running = Boolean(sim && sim.running);
  const stepComplete = step ? isStepComplete(studentGraph, problem, stepIndex) : false;
  const isLastStep = stepIndex === problem.buildSteps.length - 1;

  const advanceStep = () => {
    setStepIndex((i) => Math.min(i + 1, problem.buildSteps.length));
    setSelectedNode(null);
  };

  const allPlaced = stepIndex >= problem.buildSteps.length;
  const connections = useMemo(() => (allPlaced ? connectionStatus(studentGraph, problem) : []), [allPlaced, studentGraph, problem]);
  const connectionsLeft = connections.filter((c) => !c.done).length;

  // Persistent coaching line, driven by exactly where the learner is.
  const coach = useMemo(() => {
    if (running) return null;
    if (allPlaced) {
      if (connectionsLeft > 0) return `Now connect the nodes — ${connectionsLeft} link${connectionsLeft > 1 ? 's' : ''} to go. Drag from a node's right dot to the next node's left dot.`;
      return 'Everything is wired up. Hit Run to watch it work on real emails.';
    }
    const s = problem.buildSteps[stepIndex];
    const placed = new Set(studentGraph.nodes.map((n) => n.type));
    const req = requiredTypesForStep(problem, s);
    const missing = req.filter((t) => !placed.has(t));
    if (missing.length) return `Step ${stepIndex + 1}: drag the “${labelForType(problem, missing[0])}” node onto the canvas.`;
    const unseen = req.filter((t) => !studentGraph.nodes.some((n) => n.type === t && n.data && n.data.seen));
    if (unseen.length) return `Click the “${labelForType(problem, unseen[0])}” node to open and set it up.`;
    return `Step ${stepIndex + 1} is set up — open any node and hit “${isLastStep ? 'Done' : `Move to Step ${stepIndex + 2}`}”.`;
  }, [running, allPlaced, connectionsLeft, stepIndex, studentGraph, problem, isLastStep]);

  useEffect(() => () => simTimers.current.forEach(clearTimeout), []);

  const clearSim = () => {
    simTimers.current.forEach(clearTimeout);
    simTimers.current = [];
  };

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((connection) => {
    const isModel = connection.targetHandle === 'ai_model';
    const edge = isModel
      ? { ...connection, type: 'smoothstep', animated: true, style: { stroke: '#0E9488', strokeWidth: 1.75, strokeDasharray: '6 4' } }
      : connection;
    setEdges((eds) => addEdge(edge, eds));
  }, []);

  const localPoint = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropPreview(localPoint(event));
  }, []);
  const onDragLeave = useCallback(() => setDropPreview(null), []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDropPreview(null);
      const raw = event.dataTransfer.getData('application/judge-node');
      if (!raw) return;
      const paletteNode = JSON.parse(raw);
      const anchor = { x: event.clientX, y: event.clientY };
      const result = checkDrop(studentGraph, paletteNode, problem, stepIndex);
      setReaction({ anchor, clip: result.mascotClip, title: result.title, message: result.message, tone: result.allowed ? 'correct' : 'wrong' });

      if (!result.allowed) {
        const p = localPoint(event);
        setRejectedAt(p);
        clearTimeout(rejectTimer.current);
        rejectTimer.current = setTimeout(() => setRejectedAt(null), 1300);
        return;
      }
      const position = screenToFlowPosition(anchor);
      setNodes((nds) => nds.concat({ id: nextNodeId(), type: paletteNode.type, position, data: { label: paletteNode.label, params: {} } }));
    },
    [screenToFlowPosition, studentGraph, problem, stepIndex]
  );

  const handleParamChange = (nodeId, label, value) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, params: { ...(n.data.params || {}), [label]: value } } } : n)));
    setSelectedNode((sel) => (sel && sel.id === nodeId ? { ...sel, data: { ...sel.data, params: { ...(sel.data.params || {}), [label]: value } } } : sel));
  };

  const handleSelect = (node) => {
    setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, seen: true } } : n)));
    setSelectedNode({ ...node, data: { ...node.data, seen: true } });
    if (!ndvTouredRef.current) {
      ndvTouredRef.current = true;
      setTimeout(() => setTour(NDV_TOUR), 300);
    }
  };

  const handleRun = () => {
    clearSim();
    setSelectedNode(null);
    const { cases, success } = simulateAll(studentGraph, problem);

    const frames = [];
    cases.forEach((res, ci) => {
      frames.push({ kind: 'case', ci });
      res.steps.forEach((s) => frames.push({ kind: 'step', ci, step: s }));
    });
    frames.push({ kind: 'end', success });

    setSim({ running: true, cases, caseIndex: 0, activeNodeId: null, activeEdgeId: null, visited: [], stepInCase: 0, finished: false, success });

    let t = 450;
    frames.forEach((f) => {
      simTimers.current.push(setTimeout(() => applyFrame(f), t));
      t += f.kind === 'case' ? 550 : f.kind === 'end' ? 0 : 900;
    });
  };

  const applyFrame = (f) => {
    setSim((prev) => {
      if (!prev) return prev;
      if (f.kind === 'case') return { ...prev, caseIndex: f.ci, activeNodeId: null, activeEdgeId: null, visited: [], stepInCase: 0 };
      if (f.kind === 'step') {
        const visited = f.step.nodeId ? [...new Set([...prev.visited, f.step.nodeId])] : prev.visited;
        return { ...prev, activeNodeId: f.step.nodeId || null, activeEdgeId: f.step.edgeId || null, visited, stepInCase: prev.stepInCase + 1 };
      }
      if (f.kind === 'end') return { ...prev, activeNodeId: null, activeEdgeId: null, finished: true, success: f.success };
      return prev;
    });
  };

  const handleReset = () => {
    clearSim();
    setNodes([]);
    setEdges([]);
    setSim(null);
    setSelectedNode(null);
    setReaction(null);
    setStepIndex(0);
  };

  const closeSim = () => {
    clearSim();
    setSim(null);
  };

  // decorate nodes/edges during simulation
  const flowNodes = useMemo(() => {
    if (!running) return nodes;
    return nodes.map((n) => ({
      ...n,
      data: { ...n.data, sim: n.id === sim.activeNodeId ? 'active' : sim.visited.includes(n.id) ? 'done' : 'dim' },
    }));
  }, [nodes, running, sim]);

  const flowEdges = useMemo(() => {
    if (!running) return edges;
    return edges.map((e) => {
      if (e.id === sim.activeEdgeId) {
        return { ...e, animated: true, style: { ...e.style, stroke: '#0055FF', strokeWidth: 3 } };
      }
      return { ...e, style: { ...e.style, opacity: 0.4 } };
    });
  }, [edges, running, sim]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-0)' }}>
      <TopBar activeStage="dashboard" onShowProblemStatement={() => setShowStatement(true)} onReset={handleReset} onRun={handleRun} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <NodePalette problem={problem} currentStepIndex={stepIndex} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#E9ECF2' }}>
          <div ref={canvasRef} data-tour="canvas" style={{ flex: 1, minHeight: 0, position: 'relative' }} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            {!running && step ? (
              <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 20, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-0)', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(1,24,69,0.08)', padding: '7px 12px', fontSize: 12.5 }}>
                <Lightning size={15} weight="fill" color="var(--brand-primary)" />
                <span style={{ fontWeight: 700, color: 'var(--fg-1)' }}>Step {stepIndex + 1} of {problem.buildSteps.length}</span>
                <span style={{ color: 'var(--fg-2)' }}>{step.label}</span>
              </div>
            ) : null}

            {/* connection checklist — appears once every node is placed */}
            {!running && allPlaced ? (
              <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 20, width: 268, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', boxShadow: '0 6px 20px rgba(1,24,69,0.12)' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GitBranch size={15} weight="fill" color="var(--brand-primary)" />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)' }}>Connect the nodes</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: connectionsLeft ? 'var(--fg-3)' : 'var(--status-success)', fontWeight: 700 }}>
                    {connections.length - connectionsLeft}/{connections.length}
                  </span>
                </div>
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 240, overflowY: 'auto' }}>
                  {connections.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: c.done ? 'var(--fg-3)' : 'var(--fg-1)' }}>
                      {c.done ? (
                        <CheckCircle size={15} weight="fill" color="var(--status-success)" style={{ flex: 'none', marginTop: 1 }} />
                      ) : (
                        <Circle size={15} color="var(--border-strong)" style={{ flex: 'none', marginTop: 1 }} />
                      )}
                      <span style={{ textDecoration: c.done ? 'line-through' : 'none' }}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => handleSelect(node)}
              onPaneClick={() => setSelectedNode(null)}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={!running}
              fitView
            >
              <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="#C4CAD4" />
              <Controls showInteractive={false} />
            </ReactFlow>

            {dropPreview && !running ? (
              <div style={{ position: 'absolute', left: dropPreview.x - 105, top: dropPreview.y - 30, width: 210, height: 60, border: '2px dashed var(--brand-primary)', background: 'var(--brand-blue-50)', borderRadius: 10, pointerEvents: 'none', zIndex: 15, opacity: 0.9 }} />
            ) : null}
            {rejectedAt && !running ? (
              <div style={{ position: 'absolute', left: rejectedAt.x - 105, top: rejectedAt.y - 30, width: 210, height: 60, border: '2px dashed var(--status-danger)', background: 'var(--status-danger-bg)', borderRadius: 10, pointerEvents: 'none', zIndex: 15 }} />
            ) : null}
          </div>

          {sim ? <SimulationPanel sim={sim} problem={problem} onClose={closeSim} onContinue={() => onAllTestsPassed(validateGraph(studentGraph, problem))} /> : null}
        </div>

        {selectedNode && !running ? (
          <NodeDetailView
            node={selectedNode}
            studentGraph={studentGraph}
            onChange={handleParamChange}
            onClose={() => setSelectedNode(null)}
            canAdvance={stepComplete}
            advanceLabel={isLastStep ? 'Done — wire it up & Run' : `Move to Step ${stepIndex + 2}`}
            onAdvance={advanceStep}
          />
        ) : null}
      </div>

      {showStatement ? <ProblemStatementPanel problem={problem} onClose={() => setShowStatement(false)} /> : null}
      {tour ? <Tour steps={tour} onClose={() => setTour(null)} /> : null}
      <JudgeMascot reaction={reaction} onReactionDone={() => setReaction(null)} coach={coach} />
    </div>
  );
}

function SimulationPanel({ sim, problem, onClose, onContinue }) {
  const active = sim.cases[sim.caseIndex];

  return (
    <div style={{ borderTop: '1px solid var(--border-strong)', background: 'var(--surface-0)', maxHeight: 260, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>Running your automation</span>
        <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
          {sim.cases.map((res, i) => {
            const done = sim.finished || i < sim.caseIndex;
            const isActive = i === sim.caseIndex && !sim.finished;
            const good = res.delivered || (!res.case.branch && (done || isActive)); // question case: dead-end is expected
            return (
              <span key={res.case.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '3px 8px', border: '1px solid var(--border-subtle)', background: isActive ? 'var(--brand-blue-50)' : 'var(--surface-1)', color: 'var(--fg-2)', fontWeight: isActive ? 700 : 500 }}>
                {done ? (res.delivered ? <CheckCircle size={12} weight="fill" color="var(--status-success)" /> : <XCircle size={12} weight="fill" color={res.case.branch ? 'var(--status-danger)' : 'var(--fg-3)'} />) : null}
                {res.case.reply || 'General question'}
              </span>
            );
          })}
        </div>
        {sim.finished ? (
          sim.success ? (
            <Button variant="primary" size="sm" iconRight={<ArrowRight size={14} />} onClick={onContinue}>Continue to Stress Testing</Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>Back to editing</Button>
          )
        ) : (
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--fg-3)', fontSize: 12, cursor: 'pointer' }}>Stop</button>
        )}
      </div>

      <div style={{ padding: '12px 16px', overflowY: 'auto' }}>
        {sim.finished ? (
          <div style={{ fontSize: 13, fontWeight: 600, color: sim.success ? 'var(--status-success)' : 'var(--fg-1)', marginBottom: 10 }}>
            {sim.success
              ? 'Every categorised email reached the right reply. The general question intentionally goes unanswered — notice that gap.'
              : 'Some emails didn’t reach a reply. Check the highlighted nodes and finish wiring the flow.'}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--fg-2)', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: 'var(--fg-1)' }}>Email {sim.caseIndex + 1}:</span> {active?.case.subject}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {(active?.steps || []).slice(0, sim.finished ? undefined : Math.max(1, sim.stepInCase)).map((s, i) => {
            const Icon = STEP_ICON[s.iconType] || Sparkle;
            const color = s.status === 'dead' ? 'var(--status-danger)' : s.status === 'done' ? 'var(--status-success)' : 'var(--fg-2)';
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

export function DashboardScreen({ problem, onAllTestsPassed }) {
  return (
    <ReactFlowProvider>
      <DashboardCanvas problem={problem} onAllTestsPassed={onAllTestsPassed} />
    </ReactFlowProvider>
  );
}
