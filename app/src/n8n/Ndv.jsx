import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X, LockSimple, CaretDown, CheckCircle, XCircle, Lightning, Sparkle, Lock } from '@phosphor-icons/react';
import { nodeIcons, nodeIconColor, metaOf } from '../nodes/nodeIcons.js';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';

// Bottom node-detail drawer. INPUT | Parameters/Settings | OUTPUT.
// The Parameters tab is real field configuration: fixed context fields are shown
// disabled, and only the field the learner must set is highlighted (blue, pulsing)
// as an editable select. "Verify setup" marks it green or red; clicking the field
// brings Iris close with a chat bubble explaining it. All green → "Complete setup".
// The Settings tab is locked — nothing there matters for this problem.
export function Ndv({ node, setup, inputData, inputLabel, onDecision, onComplete, onClose }) {
  const [tab, setTab] = useState('params');
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const meta = metaOf(node.nodeType);
  const Icon = nodeIcons[node.nodeType];
  const iconColor = nodeIconColor[node.nodeType] || meta.color;

  const fields = setup?.fields || [];
  const [values, setValues] = useState({});
  const [results, setResults] = useState(null); // { [key]: 'correct' | 'wrong' }
  const [feedback, setFeedback] = useState(null); // { key, verdict, why }
  const attempts = useRef(0);

  useEffect(() => {
    gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.24, ease: 'power2.out' });
    gsap.fromTo(panelRef.current, { scale: 0.96, y: 14, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.34, ease: 'power3.out' });
  }, []);
  const requestClose = () => {
    gsap.to(panelRef.current, { scale: 0.97, y: 10, opacity: 0, duration: 0.22, ease: 'power2.in' });
    gsap.to(rootRef.current, { opacity: 0, duration: 0.24, ease: 'power2.in', onComplete: onClose });
  };

  const noVerify = fields.length === 0; // node has only fixed settings → nothing to verify
  const optionFor = (field, value) => field.options.find((o) => o.value === value);
  const allChosen = fields.length > 0 && fields.every((f) => values[f.key]);
  const allCorrect = results && fields.every((f) => results[f.key] === 'correct');

  const setValue = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setResults(null);
    setFeedback(null);
  };

  const verify = () => {
    const next = {};
    const firstTry = attempts.current === 0;
    fields.forEach((f) => {
      const opt = optionFor(f, values[f.key]);
      next[f.key] = opt?.correct ? 'correct' : 'wrong';
      if (onDecision) onDecision({ id: `${node.nodeType}:${f.key}`, kind: 'field', label: f.label, correct: !!opt?.correct, firstTry });
    });
    attempts.current += 1;
    setResults(next);
    // auto-open Iris on the first wrong field so feedback feels immediate
    const firstWrong = fields.find((f) => next[f.key] === 'wrong');
    if (firstWrong) setFeedback({ key: firstWrong.key, verdict: 'wrong', why: optionFor(firstWrong, values[firstWrong.key])?.why });
    else setFeedback(null);
  };

  const explain = (field, verdict) => {
    const why = (verdict === 'correct' ? field.options.find((o) => o.correct) : optionFor(field, values[field.key]))?.why;
    setFeedback((f) => (f && f.key === field.key ? null : { key: field.key, verdict, why }));
  };

  const done = allCorrect || noVerify; // ready to finish — closing the drawer completes the node
  const finishAndClose = () => { if (done && onComplete) onComplete(); requestClose(); };

  return (
    <div ref={rootRef} onMouseDown={(e) => { if (e.target === e.currentTarget) finishAndClose(); }} style={{ position: 'absolute', inset: 0, zIndex: 45, background: 'rgba(6,20,50,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3vh 2vw' }}>
    <div ref={panelRef} style={{ width: '86%', height: '86%', maxWidth: 1180, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', boxShadow: '0 30px 80px rgba(1,24,69,0.35)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ width: 28, height: 28, background: meta.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {Icon ? <Icon size={16} color={iconColor} /> : null}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{node.label}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button type="button" aria-label="Close setup" onClick={finishAndClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', display: 'flex' }}><X size={18} /></button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.25fr 1fr', minHeight: 0 }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <Tab active={tab === 'params'} onClick={() => setTab('params')}>Parameters</Tab>
            <span title="Nothing to change here for this task" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '11px 0', fontSize: 12.5, fontWeight: 600, color: 'var(--fg-3)', opacity: 0.55, cursor: 'not-allowed' }}>
              <Lock size={11} weight="fill" /> Settings
            </span>
            <div style={{ marginLeft: 'auto', margin: '8px 0 8px auto' }}>
              {done ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-success)', fontSize: 12.5, fontWeight: 700 }}>
                  <CheckCircle size={16} weight="fill" /> All set — close to finish
                </span>
              ) : (
                <button type="button" disabled={!allChosen} onClick={verify} style={ctaStyle(allChosen ? 'var(--brand-primary)' : 'var(--n-200)', !allChosen)}>
                  <Sparkle size={14} weight="fill" /> Verify setup
                </button>
              )}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <FieldForm
              setup={setup}
              fields={fields}
              values={values}
              results={results}
              feedback={feedback}
              optionFor={optionFor}
              onChange={setValue}
              onExplain={explain}
              allCorrect={allCorrect}
            />
          </div>
        </div>

        <Pane label="Output">
          {node.output ? <JsonView data={node.output} /> : <Empty icon={<Lightning size={22} color="var(--fg-3)" />} title="No output data" text="Run this step to see its output." />}
        </Pane>
      </div>
    </div>
    </div>
  );
}

function ctaStyle(bg, disabled) {
  return { display: 'flex', alignItems: 'center', gap: 6, background: bg, color: disabled ? 'var(--fg-3)' : '#fff', border: 'none', padding: '7px 13px', fontSize: 12.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' };
}

function FieldForm({ setup, fields, values, results, feedback, optionFor, onChange, onExplain, allCorrect }) {
  const locked = setup?.locked || [];
  const [hoveredKey, setHoveredKey] = useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {setup?.credential ? (
        <div>
          <Label>Credential to connect with</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--status-success-border)', background: 'var(--status-success-bg)', padding: '8px 10px', fontSize: 12.5, color: 'var(--status-success)', fontWeight: 600 }}>
            <LockSimple size={13} weight="fill" /> {setup.credential} — Connected
          </div>
        </div>
      ) : null}

      {/* fixed context fields — shown, but disabled (not part of the task) */}
      {locked.map((lf, i) => (
        <div key={`lf-${i}`} style={{ opacity: 0.6 }}>
          <Label>{lf.label} <Lock size={10} weight="fill" style={{ verticalAlign: 'middle', marginLeft: 2 }} /></Label>
          {lf.kind === 'textarea' ? (
            <textarea value={lf.value} disabled rows={2} style={disabledInput} />
          ) : (
            <input value={lf.value} disabled style={disabledInput} />
          )}
        </div>
      ))}

      {/* the field(s) the learner must set */}
      {fields.map((f) => {
        const value = values[f.key] || '';
        const verdict = results?.[f.key];
        const border = verdict === 'correct' ? 'var(--status-success)' : verdict === 'wrong' ? 'var(--status-danger)' : 'var(--brand-primary)';
        const bg = verdict === 'correct' ? 'var(--status-success-bg)' : verdict === 'wrong' ? 'var(--status-danger-bg)' : 'var(--brand-blue-50, rgba(0,85,255,0.05))';
        const showBubble = feedback?.key === f.key;
        return (
          <div key={f.key} onMouseEnter={() => setHoveredKey(f.key)} onMouseLeave={() => setHoveredKey((k) => (k === f.key ? null : k))}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <Label style={{ margin: 0 }}>{f.label}</Label>
              {!verdict && hoveredKey === f.key ? (
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--brand-primary)', border: '1px solid var(--brand-primary)', padding: '1px 6px' }}>Set me up</span>
              ) : null}
            </div>
            {f.subtitle ? <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 7, lineHeight: 1.45 }}>{f.subtitle}</div> : null}
            <div className={!verdict ? 'pulse-field' : undefined} style={{ position: 'relative' }}>
              <select
                value={value}
                onChange={(e) => onChange(f.key, e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', appearance: 'none', border: `1.5px solid ${border}`, background: bg, padding: '9px 30px 9px 11px', fontSize: 12.5, fontFamily: 'var(--font-body)', color: value ? 'var(--fg-1)' : 'var(--fg-3)', cursor: 'pointer' }}
              >
                <option value="" disabled>Select a field…</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <CaretDown size={13} color="var(--fg-3)" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
            {verdict ? (
              <button type="button" onClick={() => onExplain(f, verdict)} style={{ marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: verdict === 'correct' ? 'var(--status-success)' : 'var(--status-danger)' }}>
                {verdict === 'correct' ? <CheckCircle size={15} weight="fill" /> : <XCircle size={15} weight="fill" />}
                {verdict === 'correct' ? 'Correct — ask Iris why' : 'Not right — ask Iris why'}
              </button>
            ) : null}
            {showBubble ? <IrisBubble tone={feedback.verdict}>{feedback.why}</IrisBubble> : null}
          </div>
        );
      })}

      {!results && fields.length > 0 ? (
        <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Set the highlighted field, then hit <strong style={{ color: 'var(--fg-2)' }}>Verify setup</strong>.</div>
      ) : null}
    </div>
  );
}

// Iris travels in from the left with a square speech bubble (tail toward Iris).
function IrisBubble({ tone, children }) {
  const ref = useRef(null);
  const correct = tone === 'correct';
  const c = correct ? 'var(--status-success)' : 'var(--status-danger)';
  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { x: -26, opacity: 0 }, { x: 0, opacity: 1, duration: 0.38, ease: 'back.out(1.4)' });
  }, []);
  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 11 }}>
      <div style={{ width: 46, height: 46, flex: 'none' }}>
        <MascotPlayer clip={correct ? 'correct' : 'shake-no'} once={false} onceDone={() => {}} />
      </div>
      <div style={{ position: 'relative', flex: 1, maxWidth: 300, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', borderLeft: `3px solid ${c}`, boxShadow: '0 10px 26px rgba(1,24,69,0.14)', padding: '10px 12px' }}>
        <span style={{ position: 'absolute', left: -7, top: 15, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '7px solid var(--border-strong)' }} />
        <span style={{ position: 'absolute', left: -6, top: 15, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '7px solid var(--surface-0)' }} />
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: c, marginBottom: 3 }}>{correct ? 'Nailed it' : 'Not quite'}</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-1)' }}>{children}</div>
      </div>
    </div>
  );
}

const disabledInput = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', padding: '8px 10px', fontSize: 12.5, fontFamily: 'var(--font-body)', color: 'var(--fg-3)', resize: 'none', cursor: 'not-allowed' };

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

function Label({ children, style }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg-1)', marginBottom: 5, ...style }}>{children}</label>;
}
