import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X, LockSimple, CaretDown, Check, ArrowSquareOut, Lightning } from '@phosphor-icons/react';
import { nodeIcons, nodeIconColor, metaOf } from '../nodes/nodeIcons.js';
import { variantOf } from './N8nNodeView.jsx';
import { Switch } from '../design-system/Switch.jsx';

// Bottom node-detail drawer. Full-width header, then INPUT | (Parameters/Settings
// tabs) | OUTPUT. Fields from INPUT drag into mappable params → {{ $json.field }}.
// Settings trimmed to what teaches: On Error, Retry On Fail, Notes.
export function Ndv({ node, inputData, inputLabel, onChangeParam, onClose }) {
  const [tab, setTab] = useState('params');
  const [settings, setSettings] = useState({ onError: 'Stop Workflow', retry: false, retryCount: '3', wait: '1000', notes: '', displayNote: false });
  const meta = metaOf(node.nodeType);
  const Icon = nodeIcons[node.nodeType];
  const iconColor = nodeIconColor[node.nodeType] || meta.color;
  const isTrigger = variantOf(node.nodeType) === 'trigger';
  const setS = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const rootRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(rootRef.current, { yPercent: 100 }, { yPercent: 0, duration: 0.34, ease: 'power3.out' });
  }, []);
  const requestClose = () => gsap.to(rootRef.current, { yPercent: 100, duration: 0.26, ease: 'power2.in', onComplete: onClose });

  return (
    <div ref={rootRef} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '78%', background: 'var(--surface-0)', borderTop: '1px solid var(--border-strong)', boxShadow: '0 -14px 40px rgba(1,24,69,0.16)', zIndex: 45, display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ width: 28, height: 28, borderRadius: 7, background: meta.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {Icon ? <Icon size={16} color={iconColor} /> : null}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{node.label}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--fg-3)' }}>Docs <ArrowSquareOut size={13} /></span>
          <button type="button" onClick={requestClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', display: 'flex' }}><X size={18} /></button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.25fr 1fr', minHeight: 0 }}>
        {/* INPUT */}
        <Pane label="Input" side>
          {inputData ? (
            <>
              {inputLabel ? <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>from <strong style={{ color: 'var(--fg-2)' }}>{inputLabel}</strong> · drag a field →</div> : null}
              <DraggableJson data={inputData} />
            </>
          ) : (
            <Empty icon={<Lightning size={22} color="var(--fg-3)" />} title="No input data" text="Connect a node before this one to see its data here." />
          )}
        </Pane>

        {/* CENTER: tabs + content */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <Tab active={tab === 'params'} onClick={() => setTab('params')}>Parameters</Tab>
            <Tab active={tab === 'settings'} onClick={() => setTab('settings')}>Settings</Tab>
            <button type="button" onClick={requestClose} style={{ marginLeft: 'auto', margin: '8px 0 8px auto', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--brand-primary)', color: '#fff', border: 'none', padding: '7px 13px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <Check size={14} weight="bold" /> Complete setup
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {tab === 'params' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {node.params.map((p) => <ParamField key={p.key} param={p} value={node.values[p.key]} onChange={(v) => onChangeParam(node.id, p.key, v)} />)}
                {node.params.length === 0 ? <div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>This node has no parameters to configure.</div> : null}
              </div>
            ) : (
              <SettingsTab settings={settings} setS={setS} />
            )}
          </div>
        </div>

        {/* OUTPUT */}
        <Pane label="Output" side>
          {node.output ? <JsonView data={node.output} /> : <Empty icon={<Lightning size={22} color="var(--fg-3)" />} title="No output data" text="Run this step to see its output." />}
        </Pane>
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{ padding: '11px 0', fontSize: 12.5, fontWeight: 600, color: active ? 'var(--fg-1)' : 'var(--fg-3)', borderBottom: `2px solid ${active ? 'var(--brand-primary)' : 'transparent'}`, marginBottom: -1, background: 'none', border: 'none', borderBottomStyle: 'solid', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
      {children}
    </button>
  );
}

function Pane({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-3)', fontWeight: 700, padding: '12px 14px' }}>{label}</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 14px' }}>{children}</div>
    </div>
  );
}

function Empty({ icon, title, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', gap: 6, color: 'var(--fg-3)' }}>
      {icon}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>{title}</div>
      <div style={{ fontSize: 12, lineHeight: 1.5, maxWidth: 200 }}>{text}</div>
    </div>
  );
}

function DraggableJson({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Object.entries(data).map(([k, v]) => (
        <div key={k} draggable onDragStart={(e) => e.dataTransfer.setData('text/n8n-field', k)} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '7px 9px', border: '1px solid var(--border-subtle)', background: 'var(--surface-0)', cursor: 'grab' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono, monospace)' }}>{k}</span>
          <span style={{ fontSize: 11.5, color: 'var(--fg-3)', fontFamily: 'var(--font-mono, monospace)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

function JsonView({ data }) {
  return <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.5, fontFamily: 'var(--font-mono, monospace)', color: 'var(--fg-1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(data, null, 2)}</pre>;
}

function Label({ children }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg-1)', marginBottom: 5 }}>{children}</label>;
}

function ParamField({ param, value, onChange }) {
  const [drop, setDrop] = useState(false);
  const val = value !== undefined ? value : param.value;

  if (param.locked) {
    return (
      <div>
        <Label>{param.label}</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--status-success-border)', background: 'var(--status-success-bg)', padding: '8px 10px', fontSize: 12.5, color: 'var(--status-success)', fontWeight: 600 }}>
          <LockSimple size={13} weight="fill" /> Scaler API — Connected
        </div>
      </div>
    );
  }

  const isExpr = String(val).startsWith('=');
  const base = { width: '100%', boxSizing: 'border-box', border: `1px solid ${drop ? 'var(--brand-primary)' : 'var(--border-subtle)'}`, background: drop ? 'var(--brand-blue-50)' : 'var(--surface-0)', padding: '8px 10px', fontSize: 12.5, color: 'var(--fg-1)', fontFamily: isExpr ? 'var(--font-mono, monospace)' : 'var(--font-body)', outline: 'none' };

  const dropProps = param.mappable ? {
    onDragOver: (e) => { e.preventDefault(); setDrop(true); },
    onDragLeave: () => setDrop(false),
    onDrop: (e) => { e.preventDefault(); setDrop(false); const f = e.dataTransfer.getData('text/n8n-field'); if (f) onChange(`={{ $json.${f} }}`); },
  } : {};

  return (
    <div>
      <Label>
        {param.label}
        {param.mappable ? <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, fontStyle: 'italic', color: 'var(--brand-primary)', border: '1px solid var(--brand-blue-100)', padding: '0 4px' }}>fx</span> : null}
      </Label>
      {param.kind === 'textarea' ? (
        <textarea value={val} onChange={(e) => onChange(e.target.value)} rows={3} style={{ ...base, resize: 'vertical', lineHeight: 1.5 }} {...dropProps} />
      ) : param.kind === 'select' ? (
        <div style={{ position: 'relative' }}>
          <input value={val} onChange={(e) => onChange(e.target.value)} style={{ ...base, paddingRight: 26 }} />
          <CaretDown size={13} color="var(--fg-3)" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      ) : (
        <input value={val} placeholder={param.placeholder} onChange={(e) => onChange(e.target.value)} style={base} {...dropProps} />
      )}
    </div>
  );
}

function SettingsTab({ settings, setS }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <Label>On Error</Label>
        <div style={{ position: 'relative' }}>
          <select value={settings.onError} onChange={(e) => setS('onError', e.target.value)} style={{ width: '100%', appearance: 'none', border: '1px solid var(--border-subtle)', background: 'var(--surface-0)', padding: '8px 26px 8px 10px', fontSize: 12.5, fontFamily: 'var(--font-body)', color: 'var(--fg-1)' }}>
            <option>Stop Workflow</option>
            <option>Continue</option>
            <option>Continue (using error output)</option>
          </select>
          <CaretDown size={13} color="var(--fg-3)" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 5 }}>What the workflow does if this node fails.</div>
      </div>

      <div>
        <Switch checked={settings.retry} onChange={(v) => setS('retry', v)} label="Retry On Fail" />
        {settings.retry ? (
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <Label>Max Tries</Label>
              <input value={settings.retryCount} onChange={(e) => setS('retryCount', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--border-subtle)', padding: '7px 9px', fontSize: 12.5, fontFamily: 'var(--font-body)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Wait (ms)</Label>
              <input value={settings.wait} onChange={(e) => setS('wait', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--border-subtle)', padding: '7px 9px', fontSize: 12.5, fontFamily: 'var(--font-body)' }} />
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <Label>Notes</Label>
        <textarea value={settings.notes} onChange={(e) => setS('notes', e.target.value)} rows={3} placeholder="Leave a note on this node…" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--border-subtle)', padding: '8px 10px', fontSize: 12.5, fontFamily: 'var(--font-body)', resize: 'vertical', lineHeight: 1.5 }} />
      </div>

      <Switch checked={settings.displayNote} onChange={(v) => setS('displayNote', v)} label="Display note in flow" />
    </div>
  );
}
