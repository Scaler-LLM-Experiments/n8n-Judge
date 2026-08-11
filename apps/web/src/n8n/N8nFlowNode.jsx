import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, Warning, Wrench } from '@phosphor-icons/react';
import { N8nNodeView, variantOf } from './N8nNodeView.jsx';
import { categoryMeta } from '../nodes/nodeIcons.js';
import { AI_SUB_NODE_PORTS } from '@judge/catalog';
import { useEditor } from './EditorContext.js';

const portStyle = { width: 12, height: 12, background: 'var(--surface-0)', border: '2px solid #9AA2AE' };

// n8n AI cluster sub-node ports, from the catalog rather than hardcoded here —
// they carry the real connector name and n8n's own `maxConnections`, which is not
// uniform (one model, one memory, unlimited tools). Only Chat Model is wired up
// in these problems; the others are shown inert, and now say why on hover
// instead of being silently greyed out.
const AI_PORTS = AI_SUB_NODE_PORTS;

const normalizePorts = (ports = []) => (ports ?? []).map((port) =>
  (typeof port === 'string' ? { type: port } : port)
);

export function N8nFlowNode({ id, type, data, selected }) {
  const { openPicker, openNdv, branches } = useEditor();
  // The node's OWN outputs when it has a rule list (derived from what the learner
  // built), otherwise the problem's declared branches.
  const ROUTER_BRANCHES = data.branches ?? branches ?? [];
  const [hover, setHover] = useState(false);
  const [warnHover, setWarnHover] = useState(false);
  const variant = variantOf(type);
  const isTrigger = variant === 'trigger';
  const isAi = variant === 'ai';
  const isModel = variant === 'model';
  const needsSetup = data.needsSetup;
  const inputs = normalizePorts(data.inputs ?? (isTrigger || isModel ? [] : ['main']));
  const outputs = normalizePorts(data.outputs ?? (isModel ? [] : ['main']));
  const mainInputs = inputs.filter((port) => port.type === 'main');
  const mainOutputs = outputs.filter((port) => port.type === 'main');
  const isRouter = Boolean(data.router);
  const auxiliaryInputs = inputs.filter((port) => port.type !== 'main');
  const auxiliaryOutputs = outputs.filter((port) => port.type !== 'main');

  return (
    <div style={{ position: 'relative', opacity: data.dimmed ? 0.3 : 1, transition: 'opacity 0.35s ease' }} onClick={() => openNdv(id)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {/* A SUB-NODE has no main ports at all. In n8n a Chat Model declares
          `inputs: []` and `outputs: [ai_languageModel]` — it is never handed items
          and never passes any on, so it cannot sit in the data flow. It had a left
          target and a right source like any other node, which is why its wire left
          the right-hand side and looped back around: a noodle where n8n draws a
          short vertical link from the model UP into the root node's diamond.
          See docs/n8n-reference/00-how-n8n-actually-works.md §10. */}
      {isModel ? (
        <Handle type="source" id="ai_out" position={Position.Top} style={{ ...portStyle, width: 10, height: 10, border: `2px solid ${categoryMeta.model.color}` }} />
      ) : (
        <>
          <MainPorts ports={mainInputs} direction="input" />
          {!isRouter ? <MainPorts ports={mainOutputs} direction="output" /> : null}
        </>
      )}

      {auxiliaryOutputs.length ? <AuxiliaryPorts ports={auxiliaryOutputs} direction="output" /> : null}
      {!isAi && auxiliaryInputs.length ? <AuxiliaryPorts ports={auxiliaryInputs} direction="input" /> : null}

      <N8nNodeView type={type} label={data.label} selected={selected || (hover && needsSetup)} pulse={needsSetup} running={data.running} errorPulse={data.wrong} hidePorts hideAiChip />

      {/* Always shown while the node needs setting up. It used to appear only
          on hover, which meant the one cue naming WHAT to do was invisible
          until you happened to point at the right node. */}
      {needsSetup ? (
        <button
          type="button"
          /* Clickable, not decorative. It sits ABOVE the node body, so with
             `pointerEvents: none` a click there hit the canvas and did nothing —
             the one cue telling you what to do next was the only thing you
             couldn't act on. */
          onClick={(e) => { e.stopPropagation(); openNdv(id); }}
          title="Open this node and set it up"
          style={{ position: 'absolute', left: '50%', top: -30, transform: 'translateX(-50%)', zIndex: 6, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', background: 'var(--brand-primary)', color: '#fff', border: '1px solid var(--brand-primary)', padding: '3px 8px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', boxShadow: '0 4px 12px rgba(1,24,69,0.14)', cursor: 'pointer' }}
        >
          <Wrench size={12} weight="fill" /> Set me up
        </button>
      ) : null}

      {/* No delete affordance, deliberately (removed 2026-08-11). A node the
          learner should not have placed is not theirs to quietly remove: a wrong
          pick is taken away by Iris herself, after she has probed it, and that
          probe is the teaching. Everything else on the canvas is something the
          phase asked for, so deleting it only loses work. `removeNode` still
          exists on the editor's ref — that is how BuildStage clears a wrong pick. */}

      {/* unconfigured warning (n8n shows a red triangle). The tooltip names the
          CAUSE rather than restating the icon — n8n does the same, listing the
          parameters that are still missing. */}
      {!data.configured ? (
        <div
          onMouseEnter={() => setWarnHover(true)}
          onMouseLeave={() => setWarnHover(false)}
          style={{ position: 'absolute', right: 8, bottom: 30, zIndex: 4, background: 'var(--surface-0)', borderRadius: 4, lineHeight: 0 }}
        >
          <Warning size={20} weight="fill" color="var(--status-danger)" />
          {warnHover ? (
            <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', right: -6, zIndex: 8, width: 178, background: 'var(--fg-1)', color: 'var(--surface-0)', padding: '7px 9px', fontSize: 11, fontWeight: 500, lineHeight: 1.4, textAlign: 'left', whiteSpace: 'normal', boxShadow: '0 6px 18px rgba(1,24,69,0.22)', pointerEvents: 'none' }}>
              {isModel
                ? 'This model isn’t set up yet. Open it to choose the model and its settings.'
                : 'Parameters aren’t set yet. Open this node and fill in the highlighted fields.'}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Routers: labelled outputs. The + appears only once the node is set up. */}
      {isRouter ? (
        <div style={{ position: 'absolute', left: '100%', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, paddingLeft: 10 }}>
          {ROUTER_BRANCHES.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
              <Handle type="source" id={b.id} position={Position.Right} style={{ ...portStyle, position: 'relative', left: 0, top: 0, transform: 'none' }} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--fg-2)', whiteSpace: 'nowrap' }}>{b.label}</span>
              {data.configured && data.openBranches?.includes(b.id) ? (
                <button type="button" className="pulse-plus" title={`Add reply for ${b.label}`} onClick={(e) => { e.stopPropagation(); openPicker({ sourceId: id, branch: b.id, branchIndex: i }); }} style={plusBtn({ position: 'relative', right: 'auto', top: 'auto' })}>
                  <Plus size={14} weight="bold" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        /* output + : appears only once this node is fully set up and the flow has a
           next step to add — no dangling "+" on unconfigured or terminal nodes */
        data.awaitingNext ? (
          <button type="button" className="pulse-plus" title="Add next node" onClick={(e) => { e.stopPropagation(); openPicker({ sourceId: id }); }} style={plusBtn({ right: -46, top: 'calc(50% - 13px)' })}>
            <Plus size={15} weight="bold" />
          </button>
        ) : null
      )}

      {/* AI cluster: Chat Model (required, active) plus greyed-out Memory / Tool
          ports — shown for fidelity, not interactive in this problem.

          Stack order is deliberate so the model wire never runs through text:

            [Chat Model *]   ← chip sits ABOVE the diamond (off the wire path)
                 ◆           ← port the model attaches to
                 |           ← dashed edge only in this clear vertical channel
                [+] / model

          Putting the label under the diamond (or beside it in a wide pill) either
          buried the dashes or looked like a floating badge. The chip above matches
          the static N8nNodeView sub-port cue and leaves the stem clean. */}
      {isAi ? (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 22 }}>
          {AI_PORTS.map((p) => {
            const active = p.id === 'chatModel';
            const needsModel = active && !data.hasModel;
            const color = active ? categoryMeta.model.color : '#9AA2AE';
            const tint = active ? categoryMeta.model.tint : 'var(--surface-0)';
            return (
              <div key={p.id} style={{ width: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, opacity: active ? 1 : 0.5 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: `1px solid ${color}`,
                    background: tint,
                    color,
                    fontSize: 10,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                    marginBottom: 6,
                  }}
                >
                  {p.label}{p.required ? <span style={{ color: 'var(--status-danger)' }}>*</span> : null}
                </span>
                {/* Short stem into the diamond — solid, not the RF edge, so the
                    chip above never shares paint with the dashed model wire. */}
                <span style={{ width: 1.5, height: 10, background: color, opacity: 0.85, borderRadius: 1 }} />
                <span style={{ position: 'relative', width: 13, height: 13, flex: 'none', transform: 'rotate(45deg)', border: `2px solid ${color}`, background: 'var(--surface-0)' }}>
                  {/* Bottom, not Top: the model sits BELOW this diamond, so the wire
                      has to enter from underneath. Anchored at the top it left and
                      re-entered from above, which is half of why the link looked
                      like spaghetti. */}
                  {active ? <Handle type="target" id="ai_model" position={Position.Bottom} style={{ width: 15, height: 15, top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-45deg)', background: 'transparent', border: 'none' }} /> : null}
                </span>
                {active && !needsModel ? null : (
                  <>
                    {/* Empty-slot stem so the + reads as “plug in under here”
                        without borrowing the real model edge. */}
                    <span
                      style={{
                        width: 0,
                        height: 18,
                        marginTop: 2,
                        borderLeft: `1.5px dashed ${color}`,
                        opacity: 0.9,
                      }}
                    />
                    <button
                      type="button"
                      className={needsModel ? 'pulse-plus' : undefined}
                      title={active ? `Attach a Chat Model — ${p.why}` : `${p.label} — ${p.why}`}
                      onClick={(e) => { e.stopPropagation(); if (active) openPicker({ sourceId: id, modelSlot: true }); }}
                      style={{ width: needsModel ? 28 : 24, height: needsModel ? 28 : 24, borderRadius: 5, border: `${needsModel ? 2 : 1.5}px solid ${active ? categoryMeta.model.color : 'var(--border-strong)'}`, background: needsModel ? categoryMeta.model.tint : 'var(--surface-0)', color: active ? categoryMeta.model.color : 'var(--fg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: active ? 'pointer' : 'default' }}
                    >
                      <Plus size={active ? 15 : 13} weight="bold" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function MainPorts({ ports, direction }) {
  if (!ports.length) return null;
  if (ports.length === 1 && !ports[0].label) {
    return <Handle type={direction === 'input' ? 'target' : 'source'} position={direction === 'input' ? Position.Left : Position.Right} style={portStyle} />;
  }

  const input = direction === 'input';
  return (
    <div style={{ position: 'absolute', [input ? 'right' : 'left']: '100%', top: 0, height: 88, padding: input ? '0 10px 0 0' : '0 0 0 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, boxSizing: 'border-box' }}>
      {ports.map((port, i) => (
        <div key={`${direction}-${port.label ?? i}`} style={{ display: 'flex', flexDirection: input ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: input ? 'flex-end' : 'flex-start', gap: 7, position: 'relative', whiteSpace: 'nowrap' }}>
          <Handle type={input ? 'target' : 'source'} id={`${direction}_${i}`} position={input ? Position.Left : Position.Right} style={{ ...portStyle, position: 'relative', left: 0, right: 0, top: 0, transform: 'none', flexShrink: 0 }} />
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--fg-2)' }}>{port.label ?? `${input ? 'Input' : 'Output'} ${i + 1}`}</span>
        </div>
      ))}
    </div>
  );
}

function AuxiliaryPorts({ ports, direction }) {
  const output = direction === 'output';
  return (
    <div style={{ position: 'absolute', left: '50%', [output ? 'bottom' : 'top']: 'calc(100% + 12px)', transform: 'translateX(-50%)', display: 'flex', gap: 18, zIndex: 3 }}>
      {ports.map((port, i) => (
        <div key={`${port.type}-${i}`} style={{ display: 'flex', flexDirection: output ? 'column-reverse' : 'column', alignItems: 'center', gap: 5, color: 'var(--fg-2)', fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
          <span>{port.label ?? port.type}</span>
          <span style={{ position: 'relative', width: 11, height: 11, transform: 'rotate(45deg)', border: `2px solid ${categoryMeta.model.color}`, background: 'var(--surface-0)' }}>
            <Handle type={output ? 'source' : 'target'} id={`aux_${direction}_${i}`} position={output ? Position.Top : Position.Bottom} style={{ width: 14, height: 14, top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-45deg)', background: 'transparent', border: 'none' }} />
          </span>
        </div>
      ))}
    </div>
  );
}

function plusBtn(pos) {
  return {
    position: 'absolute',
    ...pos,
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: 'var(--surface-0)',
    border: '1.5px solid var(--brand-primary)',
    color: 'var(--brand-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(1,24,69,0.14)',
    zIndex: 5,
  };
}
