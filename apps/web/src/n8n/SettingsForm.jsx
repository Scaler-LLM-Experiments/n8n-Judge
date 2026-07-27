import React from 'react';
import { CheckCircle, XCircle, WarningCircle, LockSimple } from '@phosphor-icons/react';
import { SETTINGS_SPEC, isActive } from './nodeSettings.js';
import { IrisBubble } from './IrisBubble.jsx';

// The Settings tab. Renders the full real n8n set every time, so the learner
// always sees the true shape of a node; the problem decides which entries are
// graded. Graded rows are highlighted the same way required parameters are.

function Row({ spec, value, onChange, graded, verdict, why, disabled, onExplain, showBubble }) {
  const border = verdict === 'correct' ? 'var(--status-success)' : verdict === 'wrong' ? 'var(--status-danger)' : graded ? 'var(--brand-primary)' : 'var(--border-strong)';

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', opacity: disabled ? 0.45 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-1)', display: 'flex', alignItems: 'center', gap: 7 }}>
            {spec.label}
            {graded ? (
              <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--brand-primary)', background: 'var(--brand-blue-50, rgba(0,85,255,0.08))', padding: '2px 6px' }}>
                Set this
              </span>
            ) : (
              <LockSimple size={11} weight="fill" color="var(--fg-3)" />
            )}
          </div>
          {spec.hint ? <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 3, lineHeight: 1.45 }}>{spec.hint}</div> : null}
          {spec.warn ? (
            <div style={{ fontSize: 11.5, color: 'var(--status-warning, #B54708)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <WarningCircle size={12} weight="fill" /> {spec.warn}
            </div>
          ) : null}
        </div>

        <div style={{ flex: 'none' }}>
          {spec.kind === 'boolean' ? (
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(value)}
              aria-label={spec.label}
              disabled={disabled}
              onClick={() => onChange(spec.key, !value)}
              style={{
                width: 38,
                height: 21,
                padding: 2,
                border: `1.5px solid ${border}`,
                background: value ? 'var(--brand-primary)' : 'var(--surface-2)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: value ? 'flex-end' : 'flex-start',
                alignItems: 'center',
              }}
            >
              <span style={{ width: 15, height: 15, background: value ? '#fff' : 'var(--fg-3)', display: 'block' }} />
            </button>
          ) : null}

          {spec.kind === 'select' ? (
            <select
              value={value ?? spec.default}
              disabled={disabled}
              aria-label={spec.label}
              onChange={(e) => onChange(spec.key, e.target.value)}
              style={{ border: `1.5px solid ${border}`, background: 'var(--surface-0)', padding: '7px 10px', fontSize: 12, fontFamily: 'var(--font-body)', minWidth: 220 }}
            >
              {spec.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : null}

          {spec.kind === 'number' ? (
            <input
              type="number"
              value={value ?? spec.default}
              min={spec.min}
              max={spec.max}
              step={spec.step ?? 1}
              disabled={disabled}
              aria-label={spec.label}
              onChange={(e) => onChange(spec.key, Number(e.target.value))}
              style={{ border: `1.5px solid ${border}`, background: 'var(--surface-0)', padding: '7px 10px', fontSize: 12, fontFamily: 'var(--font-body)', width: 110 }}
            />
          ) : null}

          {spec.kind === 'text' ? (
            <input
              type="text"
              value={value ?? ''}
              placeholder={spec.placeholder}
              disabled={disabled}
              aria-label={spec.label}
              onChange={(e) => onChange(spec.key, e.target.value)}
              style={{ border: `1.5px solid ${border}`, background: 'var(--surface-0)', padding: '7px 10px', fontSize: 12, fontFamily: 'var(--font-body)', width: 260 }}
            />
          ) : null}
        </div>
      </div>

      {verdict ? (
        <button
          type="button"
          onClick={() => onExplain?.(spec.key, verdict, why)}
          style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: verdict === 'correct' ? 'var(--status-success)' : 'var(--status-danger)' }}
        >
          {verdict === 'correct' ? <CheckCircle size={14} weight="fill" /> : <XCircle size={14} weight="fill" />}
          {verdict === 'correct' ? 'Correct — ask Iris why' : 'Not right — ask Iris why'}
        </button>
      ) : null}
      {showBubble && why ? <IrisBubble tone={verdict}>{why}</IrisBubble> : null}
    </div>
  );
}

export function SettingsForm({ values, graded = [], results, onChange, onExplain, feedback }) {
  const gradedKeys = new Set(graded.map((g) => g.key));
  const byKey = Object.fromEntries((results ?? []).map((r) => [r.key, r]));

  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--fg-3)', lineHeight: 1.55, marginBottom: 10 }}>
        Every n8n node carries these. Only the ones this task turns on are editable —
        the rest are shown so you know the shape of a node, and locked so they
        can’t distract you.
      </div>

      {SETTINGS_SPEC.map((spec) => {
        const isGraded = gradedKeys.has(spec.key);
        // A dependent field (Max Tries) is editable only when its parent is
        // graded AND switched on — mirroring how n8n reveals it.
        const parentGraded = spec.dependsOn ? gradedKeys.has(spec.dependsOn) : false;
        const editable = (isGraded || parentGraded) && isActive(spec, values);
        const r = byKey[spec.key];
        return (
          <Row
            key={spec.key}
            spec={spec}
            value={values[spec.key]}
            onChange={onChange}
            graded={isGraded}
            verdict={r ? (r.correct ? 'correct' : 'wrong') : null}
            why={r?.why}
            disabled={!editable}
            onExplain={onExplain}
            showBubble={feedback?.key === `settings.${spec.key}`}
          />
        );
      })}

      <div style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 12, opacity: 0.7 }}>
        Scaler node · v1
      </div>
    </div>
  );
}
