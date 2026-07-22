import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus } from '@phosphor-icons/react';
import { EditorContext } from './EditorContext.js';
import { N8nFlowNode } from './N8nFlowNode.jsx';
import { NodePickerDrawer } from './NodePickerDrawer.jsx';
import { Ndv } from './Ndv.jsx';
import { NODE_CATALOG } from './catalog.js';

const nodeTypes = Object.fromEntries(Object.keys(NODE_CATALOG).map((t) => [t, N8nFlowNode]));

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#94A3B8' },
  style: { stroke: '#94A3B8', strokeWidth: 1.75 },
};

let idc = 0;
const nextId = () => `n${(idc += 1)}`;

function EditorInner() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [picker, setPicker] = useState(null); // {sourceId, triggerSlot, modelSlot}
  const [ndvId, setNdvId] = useState(null);

  const onNodesChange = useCallback((c) => setNodes((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c) => setEdges((e) => applyEdgeChanges(c, e)), []);

  const openPicker = useCallback((ctx) => setPicker(ctx), []);
  const openNdv = useCallback((id) => {
    setNdvId(id);
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, configured: true } } : n)));
  }, []);

  const addNode = (catalogType) => {
    const entry = NODE_CATALOG[catalogType];
    const ctx = picker || {};
    const id = nextId();
    const source = ctx.sourceId ? nodes.find((n) => n.id === ctx.sourceId) : null;

    let position = { x: 220, y: 180 };
    if (source && ctx.modelSlot) position = { x: source.position.x + 15, y: source.position.y + 170 };
    else if (source) position = { x: source.position.x + 260, y: source.position.y };

    const node = {
      id,
      type: catalogType,
      position,
      data: { nodeType: catalogType, label: entry.label, params: entry.params, values: {}, configured: false, output: entry.output },
    };
    setNodes((ns) => ns.concat(node));

    if (source) {
      const edge = ctx.modelSlot
        ? { id: `e${id}`, source: id, target: source.id, targetHandle: 'ai_model', type: 'smoothstep', animated: true, style: { stroke: '#0E9488', strokeWidth: 1.75, strokeDasharray: '6 4' } }
        : { id: `e${id}`, source: source.id, target: id };
      setEdges((es) => es.concat(edge));
    }
    setPicker(null);
  };

  const updateParam = (id, key, value) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, values: { ...n.data.values, [key]: value } } } : n)));
  };

  const ndvNode = (() => {
    if (!ndvId) return null;
    const n = nodes.find((x) => x.id === ndvId);
    if (!n) return null;
    return { id: n.id, nodeType: n.data.nodeType, label: n.data.label, params: n.data.params, values: n.data.values, output: n.data.output };
  })();

  const ndvInput = (() => {
    if (!ndvId) return null;
    const inEdge = edges.find((e) => e.target === ndvId && e.targetHandle !== 'ai_model');
    if (!inEdge) return null;
    const src = nodes.find((n) => n.id === inEdge.source);
    return src?.data.output || null;
  })();

  const ctxValue = useMemo(() => ({ openPicker, openNdv }), [openPicker, openNdv]);

  return (
    <EditorContext.Provider value={ctxValue}>
      <div style={{ position: 'absolute', inset: 0, background: '#E9ECF2' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          proOptions={{ hideAttribution: true }}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="#C4CAD4" />
          <Controls showInteractive={false} />
        </ReactFlow>

        {nodes.length === 0 ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <button
              type="button"
              onClick={() => openPicker({ triggerSlot: true })}
              style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              <span style={{ width: 60, height: 60, borderRadius: 16, border: '2px dashed var(--brand-primary)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={26} weight="bold" />
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Add first step</span>
            </button>
          </div>
        ) : null}

        {picker ? <NodePickerDrawer context={picker} onPick={addNode} onClose={() => setPicker(null)} /> : null}
        {ndvNode ? <Ndv node={ndvNode} inputData={ndvInput} onChangeParam={updateParam} onClose={() => setNdvId(null)} /> : null}
      </div>
    </EditorContext.Provider>
  );
}

export function N8nEditor() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  );
}
