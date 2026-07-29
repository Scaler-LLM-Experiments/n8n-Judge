import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, Warning, Wrench, Trash } from '@phosphor-icons/react';
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

export function N8nFlowNode({ id, type, data, selected }) {
  const { openPicker, openNdv, branches, removeNode } = useEditor();
  // The node's OWN outputs when it has a rule list (derived from what the learner
  // built), otherwise the problem's declared branches.
  const SWITCH_BRANCHES = data.branches ?? branches ?? [];
  const [hover, setHover] = useState(false);
  const [warnHover, setWarnHover] = useState(false);
  const variant = variantOf(type);
  const isTrigger = variant === 'trigger';
  const isAi = variant === 'ai';
  const isModel = variant === 'model';
  const isSwitch = type === 'switch';
  const needsSetup = data.needsSetup;

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
          {!isTrigger ? <Handle type="target" position={Position.Left} style={portStyle} /> : null}
          {!isSwitch ? <Handle type="source" position={Position.Right} style={portStyle} /> : null}
        </>
      )}

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

      {/* Delete. n8n lets you remove any node; without it a misplaced node was
          permanent, and the only recovery was starting the phase again.
          Safe for grading: the placement was recorded when it happened and
          `recordDecision` keeps the EARLIEST decision per id, so deleting and
          re-placing cannot walk back a wrong first attempt. Hidden on a wrong
          pick (Iris removes those herself once she has probed it) and while the
          flow is running. */}
      {hover && !data.wrong && !data.running ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); removeNode?.(id); }}
          title={`Delete ${data.label}`}
          aria-label={`Delete ${data.label}`}
          style={{ position: 'absolute', top: -10, right: -10, zIndex: 7, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)', border: '1px solid var(--border-strong)', color: 'var(--fg-2)', cursor: 'pointer', boxShadow: '0 2px 6px rgba(1,24,69,0.14)', padding: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--status-danger)'; e.currentTarget.style.borderColor = 'var(--status-danger)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fg-2)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
        >
          <Trash size={13} weight="regular" />
        </button>
      ) : null}

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

      {/* Switch: labelled branch outputs. The + to add a reply appears only once the
          Switch itself is set up, so the learner configures before wiring replies. */}
      {isSwitch ? (
        <div style={{ position: 'absolute', left: '100%', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, paddingLeft: 10 }}>
          {SWITCH_BRANCHES.map((b, i) => (
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
          ports — shown for fidelity, not interactive in this problem. */}
      {isAi ? (
        <div style={{ position: 'absolute', top: 'calc(100% + 26px)', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 20 }}>
          {AI_PORTS.map((p) => {
            const active = p.id === 'chatModel';
            const needsModel = active && !data.hasModel;
            const color = active ? categoryMeta.model.color : '#9AA2AE';
            return (
              <div key={p.id} style={{ width: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: active ? 1 : 0.5 }}>
                <span style={{ position: 'relative', width: 13, height: 13, transform: 'rotate(45deg)', border: `2px solid ${color}`, background: 'var(--surface-0)' }}>
                  {/* Bottom, not Top: the model sits BELOW this diamond, so the wire
                      has to enter from underneath. Anchored at the top it left and
                      re-entered from above, which is half of why the link looked
                      like spaghetti. */}
                  {active ? <Handle type="target" id="ai_model" position={Position.Bottom} style={{ width: 15, height: 15, top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-45deg)', background: 'transparent', border: 'none' }} /> : null}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--fg-2)', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {p.label}{p.required ? <span style={{ color: 'var(--status-danger)' }}> *</span> : null}
                </span>
                {active && !needsModel ? null : (
                  <button
                    type="button"
                    className={needsModel ? 'pulse-plus' : undefined}
                    title={active ? `Attach a Chat Model — ${p.why}` : `${p.label} — ${p.why}`}
                    onClick={(e) => { e.stopPropagation(); if (active) openPicker({ sourceId: id, modelSlot: true }); }}
                    style={{ width: needsModel ? 28 : 24, height: needsModel ? 28 : 24, borderRadius: 5, border: `${needsModel ? 2 : 1.5}px solid ${active ? categoryMeta.model.color : 'var(--border-strong)'}`, background: needsModel ? categoryMeta.model.tint : 'var(--surface-0)', color: active ? categoryMeta.model.color : 'var(--fg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: active ? 'pointer' : 'default' }}
                  >
                    <Plus size={active ? 15 : 13} weight="bold" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
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
