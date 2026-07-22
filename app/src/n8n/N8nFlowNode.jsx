import React from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, Warning } from '@phosphor-icons/react';
import { N8nNodeView, variantOf } from './N8nNodeView.jsx';
import { categoryMeta } from '../nodes/nodeIcons.js';
import { useEditor } from './EditorContext.js';

const portStyle = { width: 12, height: 12, background: 'var(--surface-0)', border: '2px solid #9AA2AE' };

// Sub-node ports shown under an AI/cluster root node (n8n convention).
const AI_PORTS = [
  { id: 'chatModel', label: 'Chat Model', required: true },
  { id: 'memory', label: 'Memory', required: false },
  { id: 'tool', label: 'Tool', required: false },
];

// Switch fans out to one labelled output per category.
const SWITCH_BRANCHES = [
  { id: 'bug_report', label: 'Bug Report' },
  { id: 'feature_request', label: 'Feature Request' },
  { id: 'urgent_complaint', label: 'Urgent Complaint' },
];

export function N8nFlowNode({ id, type, data, selected }) {
  const { openPicker, openNdv } = useEditor();
  const variant = variantOf(type);
  const isTrigger = variant === 'trigger';
  const isAi = variant === 'ai';
  const isSwitch = type === 'switch';

  return (
    <div style={{ position: 'relative' }} onClick={() => openNdv(id)}>
      {!isTrigger ? <Handle type="target" position={Position.Left} style={portStyle} /> : null}
      {!isSwitch ? <Handle type="source" position={Position.Right} style={portStyle} /> : null}

      <N8nNodeView type={type} label={data.label} selected={selected} hidePorts hideAiChip />

      {/* unconfigured warning (n8n shows a red triangle) */}
      {!data.configured ? (
        <div title="This node needs setting up" style={{ position: 'absolute', right: 8, bottom: 30, zIndex: 4, background: 'var(--surface-0)', borderRadius: 4, lineHeight: 0 }}>
          <Warning size={20} weight="fill" color="var(--status-danger)" />
        </div>
      ) : null}

      {/* Switch: three labelled branch outputs, each with a + to add & connect a reply */}
      {isSwitch ? (
        <div style={{ position: 'absolute', left: '100%', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, paddingLeft: 10 }}>
          {SWITCH_BRANCHES.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
              <Handle type="source" id={b.id} position={Position.Right} style={{ ...portStyle, position: 'relative', left: 0, top: 0, transform: 'none' }} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--fg-2)', whiteSpace: 'nowrap' }}>{b.label}</span>
              <button type="button" title={`Add reply for ${b.label}`} onClick={(e) => { e.stopPropagation(); openPicker({ sourceId: id, branch: b.id, branchIndex: i }); }} style={plusBtn({ position: 'relative', right: 'auto', top: 'auto' })}>
                <Plus size={14} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* output + : add & connect the next node */
        <button type="button" title="Add next node" onClick={(e) => { e.stopPropagation(); openPicker({ sourceId: id }); }} style={plusBtn({ right: -46, top: 'calc(50% - 13px)' })}>
          <Plus size={15} weight="bold" />
        </button>
      )}

      {/* AI cluster: Chat Model* / Memory / Tool sub-node ports, well below the label */}
      {isAi ? (
        <div style={{ position: 'absolute', top: 'calc(100% + 26px)', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 20 }}>
          {AI_PORTS.map((p) => {
            const active = p.id === 'chatModel';
            const color = active ? categoryMeta.model.color : '#9AA2AE';
            return (
              <div key={p.id} style={{ width: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ position: 'relative', width: 13, height: 13, transform: 'rotate(45deg)', border: `2px solid ${color}`, background: 'var(--surface-0)' }}>
                  {active ? <Handle type="target" id="ai_model" position={Position.Top} style={{ width: 15, height: 15, top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-45deg)', background: 'transparent', border: 'none' }} /> : null}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--fg-2)', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {p.label}{p.required ? <span style={{ color: 'var(--status-danger)' }}> *</span> : null}
                </span>
                <button
                  type="button"
                  title={active ? 'Attach a Chat Model' : `${p.label} — optional`}
                  onClick={(e) => { e.stopPropagation(); if (active) openPicker({ sourceId: id, modelSlot: true }); }}
                  style={{ width: 24, height: 24, borderRadius: 5, border: `1.5px solid ${active ? categoryMeta.model.color : 'var(--border-strong)'}`, background: 'var(--surface-0)', color: active ? categoryMeta.model.color : 'var(--fg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: active ? 'pointer' : 'default', opacity: active ? 1 : 0.5 }}
                >
                  <Plus size={13} weight="bold" />
                </button>
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
