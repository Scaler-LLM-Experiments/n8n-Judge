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
import { Button } from '../design-system/Button.jsx';
import { Badge } from '../design-system/Badge.jsx';
import { Switch } from '../design-system/Switch.jsx';
import { Alert } from '../design-system/Alert.jsx';
import { validateGraph } from '../engine/validateGraph.js';
import { computeMissingReferenceNodes, countPendingNodes } from '../engine/xray.js';

let nodeIdCounter = 0;
function nextNodeId() {
  nodeIdCounter += 1;
  return `node-${nodeIdCounter}`;
}

function DashboardCanvas({ problem, onAllTestsPassed }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [xrayOn, setXrayOn] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const { screenToFlowPosition } = useReactFlow();

  const studentGraph = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ id: n.id, type: n.type })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })),
    }),
    [nodes, edges]
  );

  const pendingCount = useMemo(
    () => countPendingNodes(studentGraph, problem.referenceGraph),
    [studentGraph, problem.referenceGraph]
  );

  const ghostNodes = useMemo(() => {
    if (!xrayOn) return [];
    return computeMissingReferenceNodes(studentGraph, problem.referenceGraph).map((refNode) => ({
      id: `ghost-${refNode.id}`,
      type: 'ghost',
      position: refNode.position,
      data: { label: refNode.requiredLabel },
      draggable: false,
      selectable: false,
      connectable: false,
    }));
  }, [xrayOn, studentGraph, problem.referenceGraph]);

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
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode = {
        id: nextNodeId(),
        type: paletteNode.type,
        position,
        data: { label: paletteNode.label },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition]
  );

  const handleRun = () => {
    const result = validateGraph(studentGraph, problem);
    setRunResult(result);
    if (result.allPassed) onAllTestsPassed(result);
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <NodePalette problem={problem} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 12,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <Switch checked={xrayOn} onChange={setXrayOn} label="X-ray" />
          <Badge tone={pendingCount === 0 ? 'success' : 'neutral'}>{pendingCount} nodes pending</Badge>
          <div style={{ flex: 1 }} />
          <Button variant="primary" onClick={handleRun}>Run</Button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ReactFlow
            nodes={nodes.concat(ghostNodes)}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
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
