import React from 'react';
import { CaretDown, Lightning } from '@phosphor-icons/react';

// Parameter controls, one per n8n field type.
//
// Every configurable field used to be a 3-option dropdown — 25 of them across
// three problems, all the same shape. Real n8n renders a mix, and the mix is
// part of what is being taught: an expression field is a different skill from
// picking an option, and a toggle is a different decision again.
//
// `kind` mirrors n8n's parameter types:
//   select      options dropdown          (the original, still the default)
//   text        free text
//   number      numeric, with bounds
//   boolean     on/off toggle
//   expression  text in {{ }} mode — the drag-a-field-from-INPUT interaction
//
// Grading: `select` matches on option.correct; everything else compares the
// typed value against the field's `correct`, normalised.

export function isCorrectValue(field, value) {
  if (field.kind === 'select' || !field.kind) {
    return Boolean(field.options?.find((o) => o.value === value)?.correct);
  }
  if (field.kind === 'boolean') return Boolean(value) === Boolean(field.correct);
  if (field.kind === 'number') return Number(value) === Number(field.correct);
  // Text and expressions: ignore surrounding whitespace and, for expressions,
  // the spacing inside the braces — `{{$json.body}}` and `{{ $json.body }}`
  // are the same answer and it would be cruel to mark one wrong.
  const norm = (v) => String(v ?? '').trim().replace(/\{\{\s*/g, '{{ ').replace(/\s*\}\}/g, ' }}');
  if (Array.isArray(field.accepts)) return field.accepts.some((a) => norm(a) === norm(value));
  return norm(field.correct) === norm(value);
}

/** The expression a dragged INPUT field should produce. */
export function expressionFor(inputKey) {
  return `{{ $json.${inputKey} }}`;
}

const baseInput = (border, bg) => ({
  width: '100%',
  boxSizing: 'border-box',
  border: `1.5px solid ${border}`,
  background: bg,
  padding: '9px 11px',
  fontSize: 12.5,
  fontFamily: 'var(--font-body)',
  color: 'var(--fg-1)',
});

export function FieldControl({ field, value, border, bg, onChange, shuffledOptions }) {
  const kind = field.kind ?? 'select';

  if (kind === 'boolean') {
    const on = Boolean(value);
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={field.label}
        onClick={() => onChange(field.key, !on)}
        style={{ width: 40, height: 22, padding: 2, border: `1.5px solid ${border}`, background: on ? 'var(--brand-primary)' : 'var(--surface-2)', cursor: 'pointer', display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', alignItems: 'center' }}
      >
        <span style={{ width: 16, height: 16, background: on ? '#fff' : 'var(--fg-3)', display: 'block' }} />
      </button>
    );
  }

  if (kind === 'number') {
    return (
      <input
        type="number"
        aria-label={field.label}
        value={value ?? ''}
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        placeholder={field.placeholder}
        onChange={(e) => onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
        style={baseInput(border, bg)}
      />
    );
  }

  if (kind === 'text' || kind === 'expression') {
    const isExpr = kind === 'expression';
    return (
      <div style={{ position: 'relative' }}>
        {isExpr ? (
          // n8n marks a field in expression mode with an fx chip. Kept as a
          // label rather than a toggle: in this simulator the field is always
          // an expression, and a dead toggle would teach the wrong thing.
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 10.5, fontWeight: 800, fontStyle: 'italic', color: 'var(--brand-primary)', pointerEvents: 'none' }}>
            fx
          </span>
        ) : null}
        <input
          aria-label={field.label}
          value={value ?? ''}
          placeholder={field.placeholder ?? (isExpr ? 'Drag a field from Input, or type {{ $json.… }}' : '')}
          spellCheck={false}
          onChange={(e) => onChange(field.key, e.target.value)}
          style={{
            ...baseInput(border, bg),
            paddingLeft: isExpr ? 30 : 11,
            fontFamily: isExpr ? 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)' : 'var(--font-body)',
          }}
        />
        {isExpr && String(value ?? '').includes('{{') ? (
          <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: 'var(--fg-3)', pointerEvents: 'none' }}>
            <Lightning size={11} weight="fill" /> live
          </span>
        ) : null}
      </div>
    );
  }

  // select — the original control
  return (
    <>
      <select
        aria-label={field.label}
        value={value ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        style={{ ...baseInput(border, bg), appearance: 'none', paddingRight: 30, cursor: 'pointer', color: value ? 'var(--fg-1)' : 'var(--fg-3)' }}
      >
        <option value="" disabled>
          Select a field…
        </option>
        {shuffledOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <CaretDown size={13} color="var(--fg-3)" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </>
  );
}
