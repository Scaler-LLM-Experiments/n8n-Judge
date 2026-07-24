import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus } from '@phosphor-icons/react';
import { EditorContext } from './EditorContext.js';
import { N8nFlowNode } from './N8nFlowNode.jsx';
import { NodePickerDrawer } from './NodePickerDrawer.jsx';
import { Ndv } from './Ndv.jsx';
import { variantOf } from './N8nNodeView.jsx';
import { NODE_CATALOG } from './catalog.js';

const nodeTypes = Object.fromEntries(Object.keys(NODE_CATALOG).map((t) => [t, N8nFlowNode]));

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#94A3B8' },
  style: { stroke: '#94A3B8', strokeWidth: 1.75 },
};

let idc = 0;
const nextId = () => `n${(idc += 1)}`;

// Build editor node/edge state from a problem's referenceGraph (used to seed a
// finished flow, e.g. the #run-story preview).
function seedNodes(ig) {
  if (!ig) return [];
  return ig.nodes.map((n) => {
    const entry = NODE_CATALOG[n.type] || {};
    return { id: n.id, type: n.type, position: n.position, data: { nodeType: n.type, label: entry.label, params: entry.params, values: {}, configured: true, wrong: false, output: entry.output } };
  });
}
function seedEdges(ig) {
  if (!ig) return [];
  return ig.edges.map((e, i) => {
    const base = { id: `seed-e${i}`, source: e.source, target: e.target };
    if (e.targetHandle === 'ai_model') return { ...base, targetHandle: 'ai_model', type: 'smoothstep', animated: true, style: { stroke: '#0E9488', strokeWidth: 1.75, strokeDasharray: '6 4' } };
    if (e.branch) return { ...base, sourceHandle: e.branch };
    return base;
  });
}

// Which node types may validly follow the current add-context, per the problem's
// canonical flow. Anything else is a sequence mistake.
function expectedNext(ctx, nodes, flow) {
  if (!flow) return null; // no flow rules → accept anything
  if (ctx.modelSlot) return flow.modelNext || [];
  if (ctx.branch) return flow.branchNext || [];
  if (ctx.triggerSlot || !ctx.sourceId) return flow.start || [];
  const src = nodes.find((n) => n.id === ctx.sourceId);
  return (src && flow.next?.[src.type]) || [];
}

const EditorInner = forwardRef(function EditorInner({ pickable, onGraphChange, nodeSetup, onDecision, flow, branches, runActiveId, initialGraph, onWrongPick, onPlaceCorrect }, ref) {
  const [nodes, setNodes] = useState(() => seedNodes(initialGraph));
  const [edges, setEdges] = useState(() => seedEdges(initialGraph));
  const [picker, setPicker] = useState(null); // {sourceId, triggerSlot, modelSlot, branch, branchIndex}
  const [ndvId, setNdvId] = useState(null);
  const rf = useReactFlow();

  useEffect(() => {
    if (onGraphChange) onGraphChange(nodes, edges);
  }, [nodes, edges, onGraphChange]);

  const onNodesChange = useCallback((c) => setNodes((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c) => setEdges((e) => applyEdgeChanges(c, e)), []);

  const openPicker = useCallback((ctx) => setPicker(ctx), []);
  const openNdv = useCallback((id) => setNdvId(id), []);
  const completeNode = useCallback((id) => setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, configured: true } } : n))), []);

  const removeNode = useCallback((id) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
    setNdvId((cur) => (cur === id ? null : cur));
  }, []);

  useImperativeHandle(ref, () => ({ removeNode, fitAll: () => { try { rf.fitView({ padding: 0.22, duration: 450 }); } catch { /* noop */ } } }), [removeNode, rf]);

  const addNode = (catalogType) => {
    const ctx = picker || {};
    const expected = expectedNext(ctx, nodes, flow);
    const isWrong = expected ? !expected.includes(catalogType) : false;

    const entry = NODE_CATALOG[catalogType];
    const id = nextId();
    const source = ctx.sourceId ? nodes.find((n) => n.id === ctx.sourceId) : null;

    let position = { x: 220, y: 180 };
    if (source && ctx.modelSlot) position = { x: source.position.x + 40, y: source.position.y + 200 };
    else if (source && ctx.branch) position = { x: source.position.x + 380, y: source.position.y + (ctx.branchIndex - 1) * 150 };
    else if (source) position = { x: source.position.x + 340, y: source.position.y };

    const node = {
      id,
      type: catalogType,
      position,
      data: { nodeType: catalogType, label: entry.label, params: entry.params, values: {}, configured: false, wrong: isWrong, output: entry.output },
    };
    setNodes((ns) => ns.concat(node));

    if (source) {
      let edge;
      if (ctx.modelSlot) {
        edge = { id: `e${id}`, source: id, target: source.id, targetHandle: 'ai_model', type: 'smoothstep', animated: true, style: { stroke: '#0E9488', strokeWidth: 1.75, strokeDasharray: '6 4' } };
      } else if (ctx.branch) {
        edge = { id: `e${id}`, source: source.id, sourceHandle: ctx.branch, target: id };
      } else {
        edge = { id: `e${id}`, source: source.id, target: id };
      }
      setEdges((es) => es.concat(edge));
    }
    setPicker(null);

    // gently pan/zoom to the freshly added node so the learner follows the flow
    const cx = position.x + (catalogType === 'classify' ? 108 : 45);
    const cy = position.y + 45;
    setTimeout(() => { try { rf.setCenter(cx, cy, { zoom: 1.3, duration: 500 }); } catch { /* noop */ } }, 40);

    if (isWrong) {
      const expectedLabel = (expected || []).map((t) => NODE_CATALOG[t]?.label).filter(Boolean).join(' or ');
      const sourceLabel = ctx.modelSlot ? `${source ? source.data.label : 'this node'}’s Chat Model port`
        : ctx.branch ? 'a Switch branch'
        : source ? source.data.label : 'the start of the flow';
      if (onWrongPick) onWrongPick(catalogType, id, { sourceLabel, expectedLabel });
    } else if (onPlaceCorrect) {
      onPlaceCorrect(catalogType, id);
    }
  };

  // Inject cue flags so each node can pulse exactly the control the learner should
  // touch next: its own body (needs setup), its output + (ready for the next step),
  // the Chat Model + (AI node missing a model), or a Switch branch + (unwired).
  const branchIds = (branches || []).map((b) => b.id);
  // when a run is active, also light the Chat Model wired to the running Classify
  const activeModelId = useMemo(() => {
    if (!runActiveId) return null;
    const an = nodes.find((n) => n.id === runActiveId);
    if (!an || variantOf(an.type) !== 'ai') return null;
    return edges.find((e) => e.target === an.id && e.targetHandle === 'ai_model')?.source || null;
  }, [runActiveId, nodes, edges]);

  const displayNodes = useMemo(
    () => nodes.map((n) => {
      const type = n.type;
      const isAi = variantOf(type) === 'ai';
      const hasEditable = (nodeSetup?.[type]?.fields?.length || 0) > 0;
      const hasMainOut = edges.some((e) => e.source === n.id && !e.sourceHandle && e.targetHandle !== 'ai_model');
      const hasModel = isAi ? edges.some((e) => e.target === n.id && e.targetHandle === 'ai_model') : undefined;
      const flowNext = flow?.next?.[type] || [];
      const needsSetup = !n.data.configured && !n.data.wrong && hasEditable;
      const modelReady = isAi ? hasModel : true;
      const awaitingNext = !n.data.wrong && flowNext.length > 0 && !hasMainOut && modelReady && (hasEditable ? n.data.configured : true);
      const openBranches = type === 'switch'
        ? branchIds.filter((b) => !edges.some((e) => e.source === n.id && e.sourceHandle === b))
        : undefined;
      const running = !!runActiveId && (n.id === runActiveId || n.id === activeModelId);
      const dimmed = !!runActiveId && !running;
      return { ...n, data: { ...n.data, hasModel, needsSetup, awaitingNext, openBranches, running, dimmed } };
    }),
    [nodes, edges, flow, nodeSetup, runActiveId, activeModelId]
  );

  const ndvNode = (() => {
    if (!ndvId) return null;
    const n = nodes.find((x) => x.id === ndvId);
    if (!n) return null;
    return { id: n.id, nodeType: n.data.nodeType, label: n.data.label, params: n.data.params, values: n.data.values, output: n.data.output };
  })();

  const ndvIn = (() => {
    if (!ndvId) return { data: null, label: null };
    const inEdge = edges.find((e) => e.target === ndvId && e.targetHandle !== 'ai_model');
    if (!inEdge) return { data: null, label: null };
    const src = nodes.find((n) => n.id === inEdge.source);
    return { data: src?.data.output || null, label: src?.data.label || null };
  })();

  const ctxValue = useMemo(() => ({ openPicker, openNdv, branches: branches || [] }), [openPicker, openNdv, branches]);

  return (
    <EditorContext.Provider value={ctxValue}>
      <div style={{ position: 'absolute', inset: 0, background: '#E9ECF2' }}>
        <ReactFlow
          nodes={displayNodes}
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
              <span className="pulse-ring" style={{ width: 60, height: 60, border: '2px dashed var(--brand-primary)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={26} weight="bold" />
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Add first step</span>
            </button>
          </div>
        ) : null}

        {picker ? <NodePickerDrawer context={picker} options={pickable} onPick={addNode} onClose={() => setPicker(null)} /> : null}
        {ndvNode ? (
          <Ndv
            key={ndvNode.id}
            node={ndvNode}
            setup={nodeSetup ? nodeSetup[ndvNode.nodeType] : undefined}
            inputData={ndvIn.data}
            inputLabel={ndvIn.label}
            onDecision={onDecision}
            onComplete={() => completeNode(ndvNode.id)}
            onClose={() => setNdvId(null)}
          />
        ) : null}
      </div>
    </EditorContext.Provider>
  );
});

export const N8nEditor = forwardRef(function N8nEditor(props, ref) {
  return (
    <ReactFlowProvider>
      <EditorInner ref={ref} {...props} />
    </ReactFlowProvider>
  );
});

export default N8nEditor;
