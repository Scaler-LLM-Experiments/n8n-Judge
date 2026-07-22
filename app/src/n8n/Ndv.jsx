import React, { useState } from 'react';
import { X, LockSimple, CaretDown, ArrowRight } from '@phosphor-icons/react';
import { nodeIcons, nodeIconColor, metaOf } from '../nodes/nodeIcons.js';

// Bottom node-detail drawer: Input JSON (left) → Parameters (centre) → Output
// JSON (right). Fields from Input can be dragged into "mappable" parameters,
// producing an {{ $json.field }} expression — the core n8n data-flow gesture.
export function Ndv({ node, inputData, onChangeParam, onClose }) {
  const meta = metaOf(node.nodeType);
  const Icon = nodeIcons[node.nodeType];
  const iconColor = nodeIconColor[node.nodeType] || meta.color;

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '52%', background: 'var(--surface-0)', borderTop: '1px solid var(--border-strong)', boxShadow: '0 -12px 32px rgba(1,24,69,0.12)', zIndex: 45, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ width: 30, height: 30, borderRadius: 7, background: meta.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {Icon ? <Icon size={17} color={iconColor} /> : null}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{node.label}</span>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: meta.color, fontWeight: 700 }}>{meta.label}</span>
        <button type="button" onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', display: 'flex' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', minHeight: 0 }}>
        <Pane title="Input">
          {inputData ? <DraggableJson data={inputData} /> : <Empty text="No input yet — connect a node before this one." />}
        </Pane>

        <Pane title="Parameters" mid>
          <ParamList node={node} onChangeParam={onChangeParam} />
        </Pane>

        <Pane title="Output">
          {node.output ? <JsonView data={node.output} /> : <Empty text="Run to see output." />}
        </Pane>
      </div>
    </div>
  );
}

function Pane({ title, mid, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, borderLeft: mid ? '1px solid var(--border-subtle)' : 'none', borderRight: mid ? '1px solid var(--border-subtle)' : 'none' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-3)', fontWeight: 700, padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>{title}</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>{children}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ fontSize: 12.5, color: 'var(--fg-3)', lineHeight: 1.5 }}>{text}</div>;
}

// Input fields, each draggable into a mappable parameter.
function DraggableJson({ data }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>Drag a field into a parameter →</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(data).map(([k, v]) => (
          <div
            key={k}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/n8n-field', k)}
            style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '7px 9px', border: '1px solid var(--border-subtle)', background: 'var(--surface-0)', cursor: 'grab' }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono, monospace)' }}>{k}</span>
            <span style={{ fontSize: 11.5, color: 'var(--fg-3)', fontFamily: 'var(--font-mono, monospace)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function JsonView({ data }) {
  return (
    <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.5, fontFamily: 'var(--font-mono, monospace)', color: 'var(--fg-1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ParamList({ node, onChangeParam }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {node.params.map((p) => (
        <ParamField key={p.key} param={p} value={node.values[p.key]} onChange={(v) => onChangeParam(node.id, p.key, v)} />
      ))}
    </div>
  );
}

function ParamField({ param, value, onChange }) {
  const [drop, setDrop] = useState(false);
  const val = value !== undefined ? value : param.value;

  if (param.locked) {
    return (
      <div>
        <Label>{param.label}</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', padding: '8px 10px', fontSize: 12.5, color: 'var(--fg-2)' }}>
          <LockSimple size={13} weight="fill" color="var(--status-success)" /> {val}
        </div>
      </div>
    );
  }

  const mappable = param.mappable;
  const onDrop = (e) => {
    e.preventDefault();
    setDrop(false);
    const field = e.dataTransfer.getData('text/n8n-field');
    if (field) onChange(`={{ $json.${field} }}`);
  };

  const base = { width: '100%', boxSizing: 'border-box', border: `1px solid ${drop ? 'var(--brand-primary)' : 'var(--border-subtle)'}`, background: drop ? 'var(--brand-blue-50)' : 'var(--surface-0)', padding: '8px 10px', fontSize: 12.5, color: 'var(--fg-1)', fontFamily: val.startsWith('=') ? 'var(--font-mono, monospace)' : 'var(--font-body)', outline: 'none' };

  return (
    <div>
      <Label>{param.label}{mappable ? <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}> · drop a field</span> : null}</Label>
      {param.kind === 'textarea' ? (
        <textarea value={val} onChange={(e) => onChange(e.target.value)} rows={3} style={{ ...base, resize: 'vertical', lineHeight: 1.5 }} />
      ) : param.kind === 'select' ? (
        <div style={{ position: 'relative' }}>
          <input value={val} onChange={(e) => onChange(e.target.value)} style={{ ...base, paddingRight: 26 }} />
          <CaretDown size={13} color="var(--fg-3)" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      ) : (
        <input
          value={val}
          placeholder={param.placeholder}
          onChange={(e) => onChange(e.target.value)}
          onDragOver={mappable ? (e) => { e.preventDefault(); setDrop(true); } : undefined}
          onDragLeave={mappable ? () => setDrop(false) : undefined}
          onDrop={mappable ? onDrop : undefined}
          style={base}
        />
      )}
    </div>
  );
}

function Label({ children }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg-1)', marginBottom: 5 }}>{children}</label>;
}
