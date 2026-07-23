import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X, LockSimple, CaretDown, CheckCircle, XCircle, Lightning, Sparkle, Lock, CircleNotch } from '@phosphor-icons/react';
import { NodeIcon, metaOf } from '../nodes/nodeIcons.js';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';

// Shown once per session: the first time a node verifies, Iris spotlights the
// close button so the learner learns that closing a green NDV finishes the node.
let ndvVignetteSeen = false;

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
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const runTimer = useRef(null);
  const meta = metaOf(node.nodeType);

  const fields = setup?.fields || [];
  const [values, setValues] = useState({});
  const [results, setResults] = useState(null); // { [key]: 'correct' | 'wrong' }
  const [feedback, setFeedback] = useState(null); // { key, verdict, why }
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [inputLoaded, setInputLoaded] = useState(false);
  const [showVignette, setShowVignette] = useState(false);
  const attempts = useRef(0);
  const vigTimer = useRef(null);

  useEffect(() => {
    gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.24, ease: 'power2.out' });
    gsap.fromTo(panelRef.current, { scale: 0.96, y: 14, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.34, ease: 'power3.out' });
    return () => { clearTimeout(runTimer.current); clearTimeout(vigTimer.current); };
  }, []);
  const requestClose = () => {
    clearTimeout(vigTimer.current);
    gsap.to(panelRef.current, { scale: 0.97, y: 10, opacity: 0, duration: 0.22, ease: 'power2.in' });
    gsap.to(rootRef.current, { opacity: 0, duration: 0.24, ease: 'power2.in', onComplete: onClose });
  };

  const noVerify = fields.length === 0; // node has only fixed settings → nothing to verify
  const optionFor = (field, value) => field.options.find((o) => o.value === value);
  const allChosen = fields.length > 0 && fields.every((f) => values[f.key]);
  const allCorrect = results && fields.length > 0 && fields.every((f) => results[f.key] === 'correct');
  const running = phase === 'running';
  const isComplete = noVerify || phase === 'done';

  const setValue = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setResults(null);
    setFeedback(null);
    if (phase !== 'idle') setPhase('idle');
  };

  // dragging an input field chip onto a parameter picks the matching option
  const dropField = (field, droppedKey) => {
    const opt = field.options.find((o) => o.value === droppedKey);
    if (opt) setValue(field.key, opt.value);
  };

  // pull the node's test input into the Input panel (optional; also happens on Verify)
  const loadInput = () => setInputLoaded(true);

  // "Verify setup" runs the node like a real execution: the parameters strip shows
  // a running bar, then the output loads on the right (all-correct) or stays empty.
  const verify = () => {
    if (running) return;
    setInputLoaded(true);
    setPhase('running');
    setResults(null);
    setFeedback(null);
    runTimer.current = setTimeout(() => {
      const next = {};
      const firstTry = attempts.current === 0;
      fields.forEach((f) => {
        const opt = optionFor(f, values[f.key]);
        next[f.key] = opt?.correct ? 'correct' : 'wrong';
        if (onDecision) onDecision({ id: `${node.nodeType}:${f.key}`, kind: 'field', label: f.label, correct: !!opt?.correct, firstTry });
      });
      attempts.current += 1;
      setResults(next);
      const ok = fields.length > 0 && fields.every((f) => next[f.key] === 'correct');
      if (ok) {
        setPhase('done');
        // let the learner take in the output first, then Iris nudges them to close
        if (!ndvVignetteSeen) { ndvVignetteSeen = true; vigTimer.current = setTimeout(() => setShowVignette(true), 2600); }
      } else {
        setPhase('idle');
        const firstWrong = fields.find((f) => next[f.key] === 'wrong');
        if (firstWrong) setFeedback({ key: firstWrong.key, verdict: 'wrong', why: optionFor(firstWrong, values[firstWrong.key])?.why });
      }
    }, 2000);
  };

  const explain = (field, verdict) => {
    const why = (verdict === 'correct' ? field.options.find((o) => o.correct) : optionFor(field, values[field.key]))?.why;
    setFeedback((f) => (f && f.key === field.key ? null : { key: field.key, verdict, why }));
  };

  // stream the input in once it's loaded, and the output in on success
  useEffect(() => {
    if (inputLoaded && inputRef.current) gsap.fromTo(inputRef.current, { clipPath: 'inset(0 0 100% 0)', opacity: 0 }, { clipPath: 'inset(0 0 0% 0)', opacity: 1, duration: 0.5, ease: 'power2.out' });
  }, [inputLoaded]);
  useEffect(() => {
    if (phase === 'done' && outputRef.current) gsap.fromTo(outputRef.current, { clipPath: 'inset(0 0 100% 0)', opacity: 0 }, { clipPath: 'inset(0 0 0% 0)', opacity: 1, duration: 0.55, ease: 'power2.out' });
  }, [phase]);

  const finishAndClose = () => { if (isComplete && onComplete) onComplete(); requestClose(); };

  return (
    <div ref={rootRef} onMouseDown={(e) => { if (e.target === e.currentTarget) finishAndClose(); }} style={{ position: 'absolute', inset: 0, zIndex: 45, background: 'rgba(6,20,50,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2vh 1.5vw' }}>
    <div ref={panelRef} style={{ position: 'relative', width: '95%', height: '95%', maxWidth: 1480, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', boxShadow: '0 30px 80px rgba(1,24,69,0.35)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ width: 28, height: 28, background: meta.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <NodeIcon type={node.nodeType} size={16} />
        </span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{node.label}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: showVignette ? 60 : 'auto' }}>
          <button type="button" aria-label="Close setup" onClick={finishAndClose} style={{ background: showVignette ? 'var(--surface-0)' : 'none', border: 'none', cursor: 'pointer', color: showVignette ? 'var(--brand-primary)' : 'var(--fg-2)', display: 'flex', padding: 4 }}><X size={18} /></button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.25fr 1fr', minHeight: 0 }}>
        <Pane label="Input">
          {noVerify ? (
            inputData ? (
              <>
                {inputLabel ? <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>from <strong style={{ color: 'var(--fg-2)' }}>{inputLabel}</strong></div> : null}
                <JsonFields data={inputData} />
              </>
            ) : <Empty icon={<Lightning size={22} color="var(--fg-3)" />} title="No input data" text="This node starts the flow." />
          ) : !inputData ? (
            <Empty icon={<Lightning size={22} color="var(--fg-3)" />} title="No input" text="This node starts the flow — it has no upstream data. Verify the setup to see what it produces." />
          ) : !inputLoaded ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', gap: 12, color: 'var(--fg-3)' }}>
              <Lightning size={22} color="var(--fg-3)" />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Test data appears here</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, maxWidth: 210 }}>Load a sample to preview what flows in — or just hit Verify setup and it loads automatically.</div>
              <button type="button" onClick={loadInput} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, background: 'var(--surface-0)', border: '1px solid var(--brand-primary)', color: 'var(--brand-primary)', padding: '7px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <Lightning size={13} weight="fill" /> Load test data
              </button>
            </div>
          ) : (
            <div ref={inputRef}>
              {inputLabel ? <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 6 }}>from <strong style={{ color: 'var(--fg-2)' }}>{inputLabel}</strong></div> : null}
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>Drag a field onto its parameter, or pick it in the dropdown.</div>
              <JsonFields data={inputData} draggable />
            </div>
          )}
        </Pane>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', flex: 'none' }}>
            <Tab active={tab === 'params'} onClick={() => setTab('params')}>Parameters</Tab>
            <span title="Nothing to change here for this task" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '11px 0', fontSize: 12.5, fontWeight: 600, color: 'var(--fg-3)', opacity: 0.55, cursor: 'not-allowed' }}>
              <Lock size={11} weight="fill" /> Settings
            </span>
            <div style={{ marginLeft: 'auto', margin: '8px 0 8px auto' }}>
              {noVerify ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-success)', fontSize: 12.5, fontWeight: 700 }}>
                  <CheckCircle size={16} weight="fill" /> Nothing to set up — close to finish
                </span>
              ) : phase === 'done' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-success)', fontSize: 12.5, fontWeight: 700 }}>
                  <CheckCircle size={16} weight="fill" /> Setup complete
                </span>
              ) : running ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-primary)', fontSize: 12.5, fontWeight: 700 }}>
                  <CircleNotch size={15} weight="bold" className="spin" /> Running…
                </span>
              ) : (
                <button type="button" disabled={!allChosen} onClick={verify} style={ctaStyle(allChosen ? 'var(--brand-primary)' : 'var(--n-200)', !allChosen)}>
                  <Sparkle size={14} weight="fill" /> Verify setup
                </button>
              )}
            </div>
          </div>
          {running ? <RunningStrip /> : null}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 32px' }}>
            <FieldForm
              setup={setup}
              fields={fields}
              values={values}
              results={results}
              feedback={feedback}
              optionFor={optionFor}
              onChange={setValue}
              onDrop={dropField}
              onExplain={explain}
              allCorrect={allCorrect}
            />
          </div>
        </div>

        <Pane label="Output">
          {running ? (
            <RunOverlay label="Producing output…" inline />
          ) : phase === 'done' && node.output ? (
            <div ref={outputRef}><JsonView data={node.output} /></div>
          ) : noVerify && node.output ? (
            <JsonView data={node.output} />
          ) : results && !allCorrect ? (
            <Empty icon={<XCircle size={22} color="var(--status-danger)" />} title="No output" text="A field isn’t right yet — fix the highlighted one and Verify setup again." />
          ) : (
            <Empty icon={<Lightning size={22} color="var(--fg-3)" />} title="No output yet" text="Verify the setup to run this node and see what it produces." />
          )}
        </Pane>
      </div>

      {showVignette && phase === 'done' ? (
        <CloseVignette onDismiss={() => setShowVignette(false)} />
      ) : null}
    </div>
    </div>
  );
}

// Small spinner used in the output panel while a node "runs" (right side loads).
function RunOverlay({ label, inline }) {
  return (
    <div style={{ position: inline ? 'relative' : 'absolute', inset: inline ? undefined : 0, height: inline ? '100%' : undefined, background: inline ? 'transparent' : 'rgba(255,255,255,0.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 3, pointerEvents: 'none' }}>
      <CircleNotch size={26} weight="bold" color="var(--brand-primary)" className="spin" />
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>{label}</div>
    </div>
  );
}

// Thin non-blocking strip across the top of the parameters panel while running —
// the fields stay visible underneath; an indeterminate bar sweeps left-to-right.
function RunningStrip() {
  return (
    <div style={{ position: 'relative', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 32, background: 'var(--brand-blue-50, rgba(0,85,255,0.06))', borderBottom: '1px solid var(--brand-blue-100, rgba(0,85,255,0.18))', overflow: 'hidden' }}>
      <style>{`@keyframes ndvsweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(320%); } }`}</style>
      <div style={{ position: 'absolute', top: 0, left: 0, height: 2, width: '30%', background: 'var(--brand-primary)', animation: 'ndvsweep 1.1s ease-in-out infinite' }} />
      <CircleNotch size={14} weight="bold" color="var(--brand-primary)" className="spin" />
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)' }}>Running this step — verifying the setup…</span>
    </div>
  );
}

// First-run guided cue, shown a couple of seconds AFTER the output lands: dim the
// panel and let Iris confirm it's safe to close. No stroke around the ✕ — just
// the message pointing to it.
function CloseVignette({ onDismiss }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }); }, []);
  return (
    <div ref={ref} onClick={onDismiss} style={{ position: 'absolute', inset: 0, zIndex: 55, background: 'rgba(6,20,50,0.5)', cursor: 'pointer' }}>
      <div style={{ position: 'absolute', top: 58, right: 16, width: 300, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 52, height: 52, flex: 'none' }}>
          <MascotPlayer clip="celebrate" once={false} onceDone={() => {}} />
        </div>
        <div style={{ position: 'relative', flex: 1, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', borderTop: '3px solid var(--status-success)', boxShadow: '0 12px 30px rgba(1,24,69,0.22)', padding: '11px 13px' }}>
          <span style={{ position: 'absolute', top: -9, right: 14, width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '8px solid var(--status-success)' }} />
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-success)', marginBottom: 3 }}>This step is verified</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-1)' }}>Its output looks right — you can safely close this with the ✕ up here and keep building.</div>
        </div>
      </div>
    </div>
  );
}

function ctaStyle(bg, disabled) {
  return { display: 'flex', alignItems: 'center', gap: 6, background: bg, color: disabled ? 'var(--fg-3)' : '#fff', border: 'none', padding: '7px 13px', fontSize: 12.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' };
}

function FieldForm({ setup, fields, values, results, feedback, optionFor, onChange, onDrop, onExplain, allCorrect }) {
  const locked = setup?.locked || [];
  const [hoveredKey, setHoveredKey] = useState(null);
  const [dropKey, setDropKey] = useState(null);
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
            <div
              className={!verdict && dropKey !== f.key ? 'pulse-field' : undefined}
              onDragOver={(e) => { e.preventDefault(); if (dropKey !== f.key) setDropKey(f.key); }}
              onDragLeave={() => setDropKey((k) => (k === f.key ? null : k))}
              onDrop={(e) => { e.preventDefault(); const key = e.dataTransfer.getData('application/x-ndv-field'); setDropKey(null); if (key && onDrop) onDrop(f, key); }}
              style={{ position: 'relative', outline: dropKey === f.key ? '2px dashed var(--brand-primary)' : 'none', outlineOffset: 2 }}
            >
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

function JsonFields({ data, draggable }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Object.entries(data).map(([k, v]) => (
        <div
          key={k}
          draggable={draggable || undefined}
          onDragStart={draggable ? (e) => { e.dataTransfer.setData('application/x-ndv-field', k); e.dataTransfer.effectAllowed = 'copy'; } : undefined}
          title={draggable ? 'Drag onto its parameter' : undefined}
          style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '7px 9px', border: `1px solid ${draggable ? 'var(--brand-blue-100, rgba(0,85,255,0.25))' : 'var(--border-subtle)'}`, background: 'var(--surface-0)', cursor: draggable ? 'grab' : 'default' }}
        >
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
