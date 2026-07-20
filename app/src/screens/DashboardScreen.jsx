import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from '../nodes/nodeTypes.js';
import { NodePalette } from '../components/NodePalette.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { NodePropertyPanel } from '../components/NodePropertyPanel.jsx';
import { JudgeMascot } from '../mascot/JudgeMascot.jsx';
import { Alert } from '../design-system/Alert.jsx';
import { validateGraph } from '../engine/validateGraph.js';
import { checkDrop } from '../engine/checkDrop.js';

let nodeIdCounter = 0;
function nextNodeId() {
  nodeIdCounter += 1;
  return `node-${nodeIdCounter}`;
}

function DashboardCanvas({ problem, onAllTestsPassed }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [runResult, setRunResult] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showStatement, setShowStatement] = useState(false);
  const [reaction, setReaction] = useState(null);
  const { screenToFlowPosition } = useReactFlow();

  const studentGraph = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ id: n.id, type: n.type })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })),
    }),
    [nodes, edges]
  );

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData('application/judge-node');
      if (!raw) return;
      const paletteNode = JSON.parse(raw);
      const anchor = { x: event.clientX, y: event.clientY };
      const result = checkDrop(studentGraph, paletteNode, problem);

      setReaction({
        anchor,
        clip: result.mascotClip,
        message: result.message,
        tone: result.allowed ? 'correct' : 'wrong',
      });

      if (!result.allowed) return;

      const position = screenToFlowPosition(anchor);
      const newNode = {
        id: nextNodeId(),
        type: paletteNode.type,
        position,
        data: { label: paletteNode.label },
      };
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
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar
        activeStage="dashboard"
        onShowProblemStatement={() => setShowStatement(true)}
        onReset={handleReset}
        onRun={handleRun}
      />
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <NodePalette problem={problem} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={(_, node) => setSelectedNode(node)}
              onPaneClick={() => setSelectedNode(null)}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
          {runResult ? (
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {runResult.results.map((r) => (
                <Alert key={r.id} tone={r.passed ? 'success' : 'danger'} title={r.description}>
                  {r.passed ? 'Passed' : r.reason}
                </Alert>
              ))}
            </div>
          ) : null}
          <JudgeMascot reaction={reaction} onReactionDone={() => setReaction(null)} />
        </div>
        {selectedNode ? (
          <NodePropertyPanel node={selectedNode} problem={problem} onClose={() => setSelectedNode(null)} />
        ) : null}
      </div>
      {showStatement ? <ProblemStatementPanel problem={problem} onClose={() => setShowStatement(false)} /> : null}
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
