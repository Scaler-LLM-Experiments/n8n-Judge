import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { CheckCircle, XCircle, Lightning } from '@phosphor-icons/react';
import { nodeTypes } from '../nodes/nodeTypes.js';
import { NodePalette } from '../components/NodePalette.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { NodeDetailView } from '../components/NodeDetailView.jsx';
import { JudgeMascot } from '../mascot/JudgeMascot.jsx';
import { validateGraph } from '../engine/validateGraph.js';
import { checkDrop, currentBuildStepIndex } from '../engine/checkDrop.js';

let nodeIdCounter = 0;
function nextNodeId() {
  nodeIdCounter += 1;
  return `node-${nodeIdCounter}`;
}

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#94A3B8' },
  style: { stroke: '#94A3B8', strokeWidth: 1.75 },
};

function DashboardCanvas({ problem, onAllTestsPassed }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [runResult, setRunResult] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showStatement, setShowStatement] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [dropPreview, setDropPreview] = useState(null); // {x,y} canvas-local
  const [rejectedAt, setRejectedAt] = useState(null); // {x,y} canvas-local
  const canvasRef = useRef(null);
  const rejectTimer = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const studentGraph = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ id: n.id, type: n.type })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })),
    }),
    [nodes, edges]
  );

  const stepIndex = currentBuildStepIndex(studentGraph, problem);
  const step = problem.buildSteps[stepIndex];

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
      const result = checkDrop(studentGraph, paletteNode, problem);

      setReaction({ anchor, clip: result.mascotClip, title: result.title, message: result.message, tone: result.allowed ? 'correct' : 'wrong' });

      if (!result.allowed) {
        const p = localPoint(event);
        setRejectedAt(p);
        clearTimeout(rejectTimer.current);
        rejectTimer.current = setTimeout(() => setRejectedAt(null), 1300);
        return;
      }

      const position = screenToFlowPosition(anchor);
      const newNode = { id: nextNodeId(), type: paletteNode.type, position, data: { label: paletteNode.label } };
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, studentGraph, problem]
  );

  const handleRun = () => {
    const result = validateGraph(studentGraph, problem);
    setRunResult(result);
    if (result.allPassed) onAllTestsPassed(result);
  };

  const handleReset = () => {
    setNodes([]);
    setEdges([]);
    setRunResult(null);
    setSelectedNode(null);
    setReaction(null);
  };

  const passCount = runResult ? runResult.results.filter((r) => r.passed).length : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-0)' }}>
      <TopBar activeStage="dashboard" onShowProblemStatement={() => setShowStatement(true)} onReset={handleReset} onRun={handleRun} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <NodePalette problem={problem} />

        {/* Canvas — visually recessed vs the white side panels */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#E9ECF2' }}>
          <div ref={canvasRef} style={{ flex: 1, minHeight: 0, position: 'relative' }} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            {/* build-step hint */}
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--surface-0)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 2px 8px rgba(1,24,69,0.08)',
                padding: '7px 12px',
                fontSize: 12.5,
              }}
            >
              <Lightning size={15} weight="fill" color="var(--brand-primary)" />
              <span style={{ fontWeight: 700, color: 'var(--fg-1)' }}>Step {stepIndex + 1} of {problem.buildSteps.length}</span>
              <span style={{ color: 'var(--fg-2)' }}>{step.label}</span>
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNode(node)}
              onPaneClick={() => setSelectedNode(null)}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              proOptions={{ hideAttribution: true }}
              fitView
            >
              <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="#C4CAD4" />
              <Controls showInteractive={false} />
            </ReactFlow>

            {/* drop-location indicator */}
            {dropPreview ? (
              <div
                style={{
                  position: 'absolute',
                  left: dropPreview.x - 105,
                  top: dropPreview.y - 30,
                  width: 210,
                  height: 60,
                  border: '2px dashed var(--brand-primary)',
                  background: 'var(--brand-blue-50)',
                  borderRadius: 10,
                  pointerEvents: 'none',
                  zIndex: 15,
                  opacity: 0.9,
                }}
              />
            ) : null}

            {/* rejected-drop flash */}
            {rejectedAt ? (
              <div
                style={{
                  position: 'absolute',
                  left: rejectedAt.x - 105,
                  top: rejectedAt.y - 30,
                  width: 210,
                  height: 60,
                  border: '2px dashed var(--status-danger)',
                  background: 'var(--status-danger-bg)',
                  borderRadius: 10,
                  pointerEvents: 'none',
                  zIndex: 15,
                }}
              />
            ) : null}
          </div>

          {/* run results strip */}
          {runResult ? (
            <div style={{ borderTop: '1px solid var(--border-strong)', background: 'var(--surface-0)', padding: '10px 14px', maxHeight: 210, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: runResult.allPassed ? 'var(--status-success)' : 'var(--fg-1)' }}>
                  {runResult.allPassed ? 'All checks passed' : `${passCount} of ${runResult.results.length} checks passed`}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {runResult.results.map((r) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                    {r.passed ? (
                      <CheckCircle size={16} weight="fill" color="var(--status-success)" style={{ flex: 'none', marginTop: 1 }} />
                    ) : (
                      <XCircle size={16} weight="fill" color="var(--status-danger)" style={{ flex: 'none', marginTop: 1 }} />
                    )}
                    <span style={{ color: 'var(--fg-1)' }}>
                      {r.description}
                      {!r.passed ? <span style={{ color: 'var(--fg-3)' }}> — {r.reason}</span> : null}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {selectedNode ? (
          <NodeDetailView node={selectedNode} studentGraph={studentGraph} onClose={() => setSelectedNode(null)} />
        ) : null}
      </div>

      {showStatement ? <ProblemStatementPanel problem={problem} onClose={() => setShowStatement(false)} /> : null}
      <JudgeMascot reaction={reaction} onReactionDone={() => setReaction(null)} />
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
