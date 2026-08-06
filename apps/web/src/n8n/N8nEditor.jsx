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
import { AiModelEdge, AiModelEdgeStyles } from './AiModelEdge.jsx';
import { NodePickerDrawer } from './NodePickerDrawer.jsx';
import { Ndv } from './Ndv.jsx';
import { variantOf } from './N8nNodeView.jsx';
import { NODE_CATALOG } from '@judge/catalog/catalog.js';
import { useTraceContext } from '../lib/TraceContext.jsx';
import { asRules } from '@judge/problem-schema';
import { branchesForPorts, resolveNodePorts } from './catalogFields.js';

const nodeTypes = Object.fromEntries(Object.keys(NODE_CATALOG).map((t) => [t, N8nFlowNode]));
// Custom type: seamless flowing dash (see AiModelEdge.jsx). Do not use RF's
// `animated: true` on these — that animation stutters on short stems.
const edgeTypes = { aiModel: AiModelEdge };

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#94A3B8' },
  style: { stroke: '#94A3B8', strokeWidth: 1.75 },
};

/** Chat Model → AI root. Shared by seed + place so both paths look the same. */
function aiModelEdge(id, source, target) {
  return {
    id,
    source,
    sourceHandle: 'ai_out',
    target,
    targetHandle: 'ai_model',
    type: 'aiModel',
    // Explicitly off: our edge paints its own seamless dash animation.
    animated: false,
    // No closed arrow — this is a sub-node stem, not a main-flow wire.
    markerEnd: undefined,
  };
}

let idc = 0;
const nextId = () => `n${(idc += 1)}`;

// Build editor node/edge state from a problem's referenceGraph (used to seed a
// finished flow, e.g. the #run-story preview).
// Seeding serves two callers with opposite needs, so `configured` is taken from the
// graph when it says, and assumed only when it doesn't:
//
//   - the dev routes seed `problem.referenceGraph`, a FINISHED flow whose nodes carry
//     no `data` — everything on it is meant to be set up, hence the default;
//   - a resumed learner seeds their own half-built canvas, where `data.configured` is
//     what they had actually done. Defaulting that to true marked every restored node
//     as set up and let them walk past configuration they never did, skipping the
//     field decisions that carry a quarter of the marks.
function seedNodes(ig, nodeSetup) {
  if (!ig) return [];
  return ig.nodes.map((n) => {
    const entry = NODE_CATALOG[n.type] || {};
    return {
      id: n.id,
      type: n.type,
      position: n.position,
      data: {
        nodeType: n.type,
        label: entry.label,
        params: entry.params,
        catalogParams: entry.source ? entry.params : [],
        // The learner's own answers, when the graph carries them. A resumed node
        // used to come back `configured` but empty, so opening it showed a node
        // that claimed to be set up over blank inputs — reported as a bug, and it
        // read as one. The dev routes seed `referenceGraph`, which carries no
        // `data`, so they still get empty and everything is assumed configured.
        values: n.data?.values ?? {},
        settings: n.data?.settings ?? {},
        configured: n.data ? !!n.data.configured : true,
        wrong: n.data ? !!n.data.wrong : false,
        output: sampleOutputFor(n.type, entry, nodeSetup),
      },
    };
  });
}

/**
 * What this node hands downstream, for the NDV's INPUT pane and the "Insert field…"
 * dropdown built from its keys.
 *
 * The catalog's `output` is ONE sample per type, shared by every case — so a form
 * trigger showed whichever case was authored last. ops-request-desk's learner opened
 * the extractor and was offered `Full Name` / `Email` / `Plan` / `Referral Source`
 * from trial-signup-desk, on the exact screen where they have to write an expression
 * against *this* form's three questions. Every option in that dropdown was wrong, so
 * the field could not be answered from the pane at all.
 *
 * A case may therefore author `nodeSetup[type].sampleOutput` and own what its own
 * nodes emit. The catalog stays the fallback, so nothing that does not author one
 * changes. It survives `toPublicProblem()` because that spreads unknown setup keys
 * (only `fields` and `settings` are rebuilt).
 */
function sampleOutputFor(type, entry, nodeSetup) {
  return nodeSetup?.[type]?.sampleOutput ?? entry.output;
}
function seedEdges(ig) {
  if (!ig) return [];
  return ig.edges.map((e, i) => {
    const base = { id: `seed-e${i}`, source: e.source, target: e.target };
    if (e.targetHandle === 'ai_model') return aiModelEdge(`seed-e${i}`, e.source, e.target);
    if (e.branch) return { ...base, sourceHandle: e.branch };
    return base;
  });
}

/**
 * A node's labelled outputs, derived from the rule list the learner built.
 *
 * Returns null when this node has no rule-list parameter, or has one that is
 * still empty — the caller then falls back to the problem's declared branches, so
 * problems that do not use a rule list behave exactly as before.
 *
 * The branch ID is the authored option VALUE, so a wire survives renaming the
 * label, and it matches what `referenceGraph` edges and `problem.branches` use.
 */
function branchesFromRules(setup, values) {
  const field = (setup?.fields ?? []).find((f) => f.kind === 'ruleList');
  if (!field) return null;
  const rules = asRules(values?.[field.key]);
  const named = rules.filter((r) => String(r.outputKey ?? '').trim());
  if (!named.length) return null;
  return named.map((r) => {
    const opt = (field.branchOptions ?? []).find((o) => o.value === r.outputKey);
    return { id: r.outputKey, label: opt?.label ?? r.outputKey };
  });
}

/**
 * What a branch exit accepts.
 *
 * `flow.branchNext` may be either shape:
 *   ['action']                                  every exit accepts the same thing
 *   { log: ['google-sheets'], email: [...] }    each exit accepts its own
 *
 * The array form is all there was, and it can only ask "is this a destination at
 * all?" — so on a problem whose exits end at DIFFERENT node types, dropping the
 * spreadsheet on the escalation exit was accepted, because a spreadsheet is a
 * legal destination somewhere. The mistake surfaced much later, as a failing Run,
 * after the phase had already gone green.
 *
 * The map form makes the exit itself the question. Kept optional: a problem whose
 * exits genuinely share a destination type still writes an array.
 */
export function branchNextFor(flow, branchId) {
  const bn = flow?.branchNext;
  if (!bn) return [];
  if (Array.isArray(bn)) return bn;
  return bn[branchId] ?? [];
}

/** Does this problem scope its exits individually? */
export function hasPerBranchNext(flow) {
  return Boolean(flow?.branchNext) && !Array.isArray(flow.branchNext);
}

/**
 * Every type that is a legal destination on SOME exit — used to tell "you reached
 * for something that is not a destination" from "right destination, wrong exit".
 * Those are different mistakes and deserve different questions.
 */
export function allBranchTargets(flow) {
  const bn = flow?.branchNext;
  if (!bn) return [];
  return Array.isArray(bn) ? bn : [...new Set(Object.values(bn).flat())];
}

// Which node types may validly follow the current add-context, per the problem's
// canonical flow. Anything else is a sequence mistake.
function expectedNext(ctx, nodes, flow) {
  if (!flow) return null; // no flow rules → accept anything
  if (ctx.modelSlot) return flow.modelNext || [];
  if (ctx.branch) return branchNextFor(flow, ctx.branch);
  if (ctx.triggerSlot || !ctx.sourceId) return flow.start || [];
  const src = nodes.find((n) => n.id === ctx.sourceId);
  return (src && flow.next?.[src.type]) || [];
}

const EditorInner = forwardRef(function EditorInner({ pickable, onGraphChange, nodeSetup, onDecision, flow, branches, runActiveId, initialGraph, onWrongPick, onPlaceCorrect, sessionId }, ref) {
  const [nodes, setNodes] = useState(() => seedNodes(initialGraph, nodeSetup));
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
  const { trace } = useTraceContext();
  // Which nodes a learner opens, and how often, is how an admin sees where the
  // configuration step actually costs them time.
  const openNdv = useCallback(
    (id) => {
      setNdvId(id);
      const node = nodes.find((n) => n.id === id);
      if (node) trace('ndv_open', { nodeType: node.type });
    },
    [nodes, trace]
  );
  // Node-level settings are stored ON the node, not left in the NDV's local
  // state. The simulation reads them, so a wrong On Error has to survive the
  // modal closing — otherwise the tab grades a decision that never has a
  // consequence.
  const completeNode = useCallback(
    (id, settings, values) =>
      setNodes((ns) =>
        ns.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, configured: true, settings: settings ?? n.data.settings, values: values ?? n.data.values } }
            : n
        )
      ),
    []
  );

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
    // Sit the model directly UNDER the Chat Model diamond so the ai_languageModel
    // link is a straight drop rather than a dogleg. The AI body is 216 wide and
    // the three sub-node ports (76 each, 20 gap) are centred on it, which puts the
    // Chat Model diamond ~12px right of the body's left edge; the model body is 88
    // wide, so its left edge lands at 12 - 44 = -32.
    if (source && ctx.modelSlot) position = { x: source.position.x - 32, y: source.position.y + 200 };
    else if (source && ctx.branch) position = { x: source.position.x + 380, y: source.position.y + (ctx.branchIndex - 1) * 150 };
    else if (source) position = { x: source.position.x + 340, y: source.position.y };

    const node = {
      id,
      type: catalogType,
      position,
      data: { nodeType: catalogType, label: entry.label, params: entry.params, catalogParams: entry.source ? entry.params : [], values: {}, configured: false, wrong: isWrong, output: sampleOutputFor(catalogType, entry, nodeSetup) },
    };
    setNodes((ns) => ns.concat(node));

    if (source) {
      let edge;
      if (ctx.modelSlot) {
        // Model is the source (ai_out on top), AI root is the target (ai_model diamond).
        edge = aiModelEdge(`e${id}`, id, source.id);
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
      // "Right destination, wrong exit" is a DIFFERENT mistake from "that is not a
      // destination at all", and the sequence probe — which asks what has to be true
      // before a node can run — is the wrong question for it. The learner did not get
      // the ordering wrong; they got the routing wrong.
      const wrongBranch = Boolean(ctx.branch) && allBranchTargets(flow).includes(catalogType);
      const branchLabel = ctx.branch
        ? (branches || []).find((b) => b.id === ctx.branch)?.label ?? ctx.branch
        : null;
      const sourceLabel = ctx.modelSlot ? `${source ? source.data.label : 'this node'}’s Chat Model port`
        : ctx.branch ? `the ${branchLabel} way out`
        : source ? source.data.label : 'the start of the flow';
      // `expectedTypes` goes through raw as well as prettified: the caller
      // records the attempt against the SLOT the learner was filling, so a
      // wrong pick costs the node it was standing in for.
      if (onWrongPick) onWrongPick(catalogType, id, { sourceLabel, expectedLabel, expectedTypes: expected || [], wrongBranch, branchLabel });
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
      const ports = resolveNodePorts(NODE_CATALOG[type], n.data.values);
      const isAi = variantOf(type) === 'ai';
      const hasEditable = (nodeSetup?.[type]?.fields?.length || 0) > 0;
      const hasMainOut = edges.some((e) => e.source === n.id && e.targetHandle !== 'ai_model');
      const hasModel = isAi ? edges.some((e) => e.target === n.id && e.targetHandle === 'ai_model') : undefined;
      const flowNext = flow?.next?.[type] || [];
      const needsSetup = !n.data.configured && !n.data.wrong && hasEditable;
      const modelReady = isAi ? hasModel : true;
      const awaitingNext = !n.data.wrong && flowNext.length > 0 && !hasMainOut && modelReady && (hasEditable ? n.data.configured : true);
      // OUTPUTS FROM CONFIGURATION. In n8n a Switch's outputs are a function of
      // its rules — add a rule, get an output — and Judge used to hardcode them
      // from problem data, so a learner never saw a node change shape. Where a
      // node has a rule-list parameter, its branches come from what the learner
      // actually built; everything else still falls back to the problem's
      // declared branches (that is the whole existing behaviour, untouched).
      //
      // Safe for everything downstream: setup must verify green before the phase
      // completes, and green means the rules match what was authored — so by the
      // time validateGraph or the Run reads branches, these ARE the problem's.
      const caseBranches = branchesFromRules(nodeSetup?.[type], n.data.values);
      const hasCaseRuleList = nodeSetup?.[type]?.fields?.some((field) => field.kind === 'ruleList');
      const catalogBranches = branchesForPorts(NODE_CATALOG[type], ports, branches);
      const isRouter = Boolean(catalogBranches);
      const nodeBranches = caseBranches ?? (hasCaseRuleList ? branches : catalogBranches) ?? branches ?? [];
      const nodeBranchIds = nodeBranches.map((b) => b.id);
      const openBranches = nodeBranchIds.length
        ? nodeBranchIds.filter((b) => !edges.some((e) => e.source === n.id && e.sourceHandle === b))
        : undefined;
      const running = !!runActiveId && (n.id === runActiveId || n.id === activeModelId);
      const dimmed = !!runActiveId && !running;
      return { ...n, data: { ...n.data, ...ports, hasModel, needsSetup, awaitingNext, openBranches, branches: nodeBranches, router: isRouter, running, dimmed } };
    }),
    [nodes, edges, flow, nodeSetup, runActiveId, activeModelId]
  );

  const ndvNode = (() => {
    if (!ndvId) return null;
    const n = nodes.find((x) => x.id === ndvId);
    if (!n) return null;
    // `values` and `settings` are what the learner had already entered — the NDV
    // opens on them so a reopened (or resumed) node is not blank.
    return { id: n.id, nodeType: n.data.nodeType, label: n.data.label, params: n.data.params, catalogParams: n.data.catalogParams, values: n.data.values, settings: n.data.settings, output: n.data.output };
  })();

  const ndvIn = (() => {
    if (!ndvId) return { data: null, label: null };
    const inEdge = edges.find((e) => e.target === ndvId && e.targetHandle !== 'ai_model');
    if (!inEdge) return { data: null, label: null };
    const src = nodes.find((n) => n.id === inEdge.source);
    return { data: src?.data.output || null, label: src?.data.label || null };
  })();

  const ctxValue = useMemo(() => ({ openPicker, openNdv, removeNode, branches: branches || [] }), [openPicker, openNdv, removeNode, branches]);

  return (
    <EditorContext.Provider value={ctxValue}>
      <div style={{ position: 'absolute', inset: 0, background: '#E9ECF2' }}>
        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          proOptions={{ hideAttribution: true }}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="#C4CAD4" />
          {/* Bottom RIGHT, so the bottom-left corner belongs to Iris. She parks
              there and travels from there; the zoom buttons drew on top of her. */}
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
        <AiModelEdgeStyles />

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

        {/* The drawer is a MENU, and the menu is not the answer key.
            Everywhere else those are already separate — a phase's `pickable` offers
            plausible wrong nodes while `flow.next` decides which is right, which is what
            gives Iris something to probe. The Chat Model slot had no equivalent, so its
            drawer listed exactly the correct model and the "which brain?" decision was a
            one-item menu. `flow.modelOptions` is that menu; it falls back to `modelNext`,
            so a problem that does not author one is unchanged. Correctness still comes
            from `expectedNext()`, which reads `modelNext` either way. */}
        {picker ? (
          <NodePickerDrawer
            context={picker}
            options={picker.modelSlot ? (flow?.modelOptions ?? flow?.modelNext ?? []) : pickable}
            onPick={addNode}
            onClose={() => setPicker(null)}
          />
        ) : null}
        {ndvNode ? (
          <Ndv
            key={ndvNode.id}
            node={ndvNode}
            setup={nodeSetup ? nodeSetup[ndvNode.nodeType] : undefined}
            inputData={ndvIn.data}
            inputLabel={ndvIn.label}
            onDecision={onDecision}
            /* Server-authoritative grading: the NDV asks the API for each verdict. */
            sessionId={sessionId}
            onComplete={(settings, values) => completeNode(ndvNode.id, settings, values)}
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
