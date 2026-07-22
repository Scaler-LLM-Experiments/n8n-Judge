import React from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, Gear } from '@phosphor-icons/react';
import { N8nNodeView } from './N8nNodeView.jsx';
import { variantOf } from './N8nNodeView.jsx';
import { categoryMeta } from '../nodes/nodeIcons.js';
import { useEditor } from './EditorContext.js';

const portStyle = { width: 12, height: 12, background: 'var(--surface-0)', border: '2px solid #9AA2AE' };

// A canvas node: the n8n visual, real react-flow handles, a "Set me up" tag when
// unconfigured, an output "+" to add-and-connect the next node, and (for AI
// nodes) a bottom "+" to attach a Chat Model.
export function N8nFlowNode({ id, type, data, selected }) {
  const { openPicker, openNdv } = useEditor();
  const variant = variantOf(type);
  const isTrigger = variant === 'trigger';
  const isAi = variant === 'ai';

  return (
    <div style={{ position: 'relative' }} onClick={() => openNdv(id)}>
      {!isTrigger ? <Handle type="target" position={Position.Left} style={portStyle} /> : null}
      <Handle type="source" position={Position.Right} style={portStyle} />
      {isAi ? <Handle type="target" id="ai_model" position={Position.Bottom} style={{ ...portStyle, borderColor: categoryMeta.model.color, borderStyle: 'dashed' }} /> : null}

      <N8nNodeView type={type} label={data.label} selected={selected} hidePorts />

      {/* Set me up tag */}
      {!data.configured ? (
        <div className="judge-pulse" style={{ position: 'absolute', top: -12, right: 4, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--brand-primary)', color: 'var(--fg-on-brand)', fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          <Gear size={11} weight="fill" /> Set me up
        </div>
      ) : null}

      {/* output + : add & connect the next node */}
      <button
        type="button"
        title="Add next node"
        onClick={(e) => { e.stopPropagation(); openPicker({ sourceId: id }); }}
        style={plusBtn({ right: -46, top: 'calc(50% - 13px)' })}
      >
        <Plus size={15} weight="bold" />
      </button>

      {/* AI: attach a chat model below */}
      {isAi ? (
        <button
          type="button"
          title="Attach a Chat Model"
          onClick={(e) => { e.stopPropagation(); openPicker({ sourceId: id, modelSlot: true }); }}
          style={{ ...plusBtn({ left: 'calc(50% - 13px)', top: 'calc(100% + 10px)' }), borderColor: categoryMeta.model.color, color: categoryMeta.model.color }}
        >
          <Plus size={15} weight="bold" />
        </button>
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
