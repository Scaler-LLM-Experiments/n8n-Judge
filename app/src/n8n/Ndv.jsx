import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X, LockSimple, CaretDown, Check, CheckCircle, XCircle, ArrowSquareOut, Lightning } from '@phosphor-icons/react';
import { nodeIcons, nodeIconColor, metaOf } from '../nodes/nodeIcons.js';
import { variantOf } from './N8nNodeView.jsx';
import { Switch } from '../design-system/Switch.jsx';

// Bottom node-detail drawer. INPUT | Parameters/Settings | OUTPUT.
// When the node has a `setup`, the Parameters tab becomes a section-gated,
// click-to-learn task: candidate fields are clickable (right & wrong), each
// reveals a "why", and picking the correct one confirms the section. Every
// section decision is graded. "Complete setup" unlocks when all sections pass.
export function Ndv({ node, setup, inputData, inputLabel, onChangeParam, onDecision, onComplete, onClose }) {
  const [tab, setTab] = useState('params');
  const [settings, setSettings] = useState({ onError: 'Stop Workflow', retry: false, retryCount: '3', wait: '1000', notes: '', displayNote: false });
  const [sectionState, setSectionState] = useState({}); // { [sectionId]: { picked, passed, attempts } }
  const meta = metaOf(node.nodeType);
  const Icon = nodeIcons[node.nodeType];
  const iconColor = nodeIconColor[node.nodeType] || meta.color;
  const setS = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const rootRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(rootRef.current, { yPercent: 100 }, { yPercent: 0, duration: 0.34, ease: 'power3.out' });
  }, []);
  const requestClose = () => gsap.to(rootRef.current, { yPercent: 100, duration: 0.26, ease: 'power2.in', onComplete: onClose });

  const sections = setup?.sections || [];
  const allPassed = sections.length === 0 || sections.every((s) => sectionState[s.id]?.passed);

  const pickCandidate = (section, cand) => {
    setSectionState((prev) => {
      const st = prev[section.id] || { attempts: 0, passed: false };
      if (st.passed) return prev;
      const next = { ...st, picked: cand.value };
      if (cand.correct) {
        next.passed = true;
        if (onDecision) onDecision({ id: `${node.nodeType}:${section.id}`, kind: 'field', label: section.prompt, correct: true, firstTry: (st.attempts || 0) === 0 });
      } else {
        next.attempts = (st.attempts || 0) + 1;
      }
      return { ...prev, [section.id]: next };
    });
  };

  const complete = () => {
    if (onComplete) onComplete();
    requestClose();
  };

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
        <Pane label="Input">
          {inputData ? (
            <>
              {inputLabel ? <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>from <strong style={{ color: 'var(--fg-2)' }}>{inputLabel}</strong></div> : null}
              <JsonFields data={inputData} />
            </>
          ) : (
            <Empty icon={<Lightning size={22} color="var(--fg-3)" />} title="No input data" text="Connect a node before this one to see its data here." />
          )}
        </Pane>

        {/* CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <Tab active={tab === 'params'} onClick={() => setTab('params')}>Parameters</Tab>
            <Tab active={tab === 'settings'} onClick={() => setTab('settings')}>Settings</Tab>
            <button type="button" disabled={!allPassed} onClick={complete} style={{ marginLeft: 'auto', margin: '8px 0 8px auto', display: 'flex', alignItems: 'center', gap: 6, background: allPassed ? 'var(--brand-primary)' : 'var(--n-200)', color: allPassed ? '#fff' : 'var(--fg-3)', border: 'none', padding: '7px 13px', fontSize: 12.5, fontWeight: 600, cursor: allPassed ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)' }}>
              <Check size={14} weight="bold" /> Complete setup
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {tab === 'settings' ? (
              <SettingsTab settings={settings} setS={setS} />
            ) : sections.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {sections.map((section) => (
                  <SectionTask key={section.id} section={section} state={sectionState[section.id]} onPick={(c) => pickCandidate(section, c)} />
                ))}
                {!allPassed ? <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Answer each section correctly to complete setup.</div> : null}
              </div>
            ) : (
              <PlainParams node={node} onChangeParam={onChangeParam} />
            )}
          </div>
        </div>

        {/* OUTPUT */}
        <Pane label="Output">
          {node.output ? <JsonView data={node.output} /> : <Empty icon={<Lightning size={22} color="var(--fg-3)" />} title="No output data" text="Run this step to see its output." />}
        </Pane>
      </div>
    </div>
  );
}

function SectionTask({ section, state = {}, onPick }) {
  return (
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)', marginBottom: 10 }}>{section.prompt}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {section.candidates.map((c) => {
          const picked = state.picked === c.value;
          const showCorrect = state.passed && c.correct;
          const showWrong = picked && !c.correct && !state.passed;
          const border = showCorrect ? 'var(--brand-primary)' : showWrong ? 'var(--status-danger)' : 'var(--border-subtle)';
          const bg = showCorrect ? 'var(--brand-blue-50)' : showWrong ? 'var(--status-danger-bg)' : 'var(--surface-0)';
          return (
            <div key={c.value}>
              <button
                type="button"
                onClick={() => onPick(c)}
                disabled={state.passed}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 11px', border: `1px solid ${border}`, background: bg, cursor: state.passed ? 'default' : 'pointer', fontFamily: 'var(--font-body)' }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-1)', fontFamily: section.kind === 'field' ? 'var(--font-mono, monospace)' : 'var(--font-body)' }}>
                  {c.label || c.value}
                </span>
                {showCorrect ? <CheckCircle size={16} weight="fill" color="var(--brand-primary)" style={{ marginLeft: 'auto' }} /> : null}
                {showWrong ? <XCircle size={16} weight="fill" color="var(--status-danger)" style={{ marginLeft: 'auto' }} /> : null}
              </button>
              {picked ? (
                <div style={{ fontSize: 12, lineHeight: 1.5, color: showWrong ? 'var(--status-danger)' : 'var(--fg-2)', padding: '6px 4px 2px 11px' }}>{c.why}</div>
              ) : null}
            </div>
          );
        })}
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

function JsonFields({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Object.entries(data).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '7px 9px', border: '1px solid var(--border-subtle)', background: 'var(--surface-0)' }}>
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

function PlainParams({ node, onChangeParam }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {node.params.map((p) => {
        const val = node.values[p.key] !== undefined ? node.values[p.key] : p.value;
        if (p.locked) {
          return (
            <div key={p.key}>
              <Label>{p.label}</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--status-success-border)', background: 'var(--status-success-bg)', padding: '8px 10px', fontSize: 12.5, color: 'var(--status-success)', fontWeight: 600 }}>
                <LockSimple size={13} weight="fill" /> Scaler API — Connected
              </div>
            </div>
          );
        }
        return (
          <div key={p.key}>
            <Label>{p.label}</Label>
            {p.kind === 'textarea' ? (
              <textarea value={val} onChange={(e) => onChangeParam(node.id, p.key, e.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--border-subtle)', padding: '8px 10px', fontSize: 12.5, fontFamily: 'var(--font-body)', resize: 'vertical', lineHeight: 1.5 }} />
            ) : (
              <div style={{ position: 'relative' }}>
                <input value={val} onChange={(e) => onChangeParam(node.id, p.key, e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--border-subtle)', padding: '8px 10px', fontSize: 12.5, fontFamily: 'var(--font-body)' }} />
                {p.kind === 'select' ? <CaretDown size={13} color="var(--fg-3)" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} /> : null}
              </div>
            )}
          </div>
        );
      })}
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
            <div style={{ flex: 1 }}><Label>Max Tries</Label><input value={settings.retryCount} onChange={(e) => setS('retryCount', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--border-subtle)', padding: '7px 9px', fontSize: 12.5, fontFamily: 'var(--font-body)' }} /></div>
            <div style={{ flex: 1 }}><Label>Wait (ms)</Label><input value={settings.wait} onChange={(e) => setS('wait', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--border-subtle)', padding: '7px 9px', fontSize: 12.5, fontFamily: 'var(--font-body)' }} /></div>
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
