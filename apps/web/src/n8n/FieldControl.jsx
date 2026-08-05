import React from 'react';
import { CaretDown, Lightning } from '@phosphor-icons/react';
import { Switch } from '../design-system/Switch.jsx';

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

/**
 * Does this field carry the data needed to grade it at all?
 *
 * In the browser it usually does not. `toPublicProblem` strips `correct`, `why`,
 * `accepts`, `whyCorrect` and `whyWrong` at the API boundary, so the client
 * holds option text and nothing else. Grading against that returns "wrong" for
 * every answer including the right one — which is exactly the bug this guards:
 * the same answer read as correct when the server verdict arrived and as WRONG
 * whenever it did not.
 *
 * Absence is detected with `in` rather than truthiness, because `correct: false`
 * is a legitimate answer for a boolean and must count as data being present.
 */
function hasAnswerData(field) {
  const kind = field.kind ?? 'select';
  if (kind === 'select') return (field.options ?? []).some((o) => 'correct' in o);
  return 'correct' in field || Array.isArray(field.accepts);
}

/**
 * A resourceLocator's answer is the RESOURCE, not the route taken to it.
 *
 * n8n stores `{ __rl: true, mode, value }` — the thing chosen plus how it was
 * chosen. We grade only `value`, deliberately: picking the right mailbox off a
 * list and pasting its ID are the same answer to the same question, and marking
 * one wrong would be testing familiarity with the picker rather than
 * understanding of the flow. The mode is still real, still stored, and still
 * visible in the trace, so it can be reported on later without changing grading.
 *
 * Exported because `answerCheck.ts` must unwrap identically — the two are kept
 * in sync deliberately and there are tests on both sides.
 */
export function resourceValue(v) {
  return v && typeof v === 'object' && '__rl' in v ? v.value : v;
}

/** An empty resourceLocator, in n8n's shape. */
export function emptyResource(field) {
  return { __rl: true, mode: (field.modes ?? ['list'])[0], value: '' };
}

/**
 * @returns {boolean|null} true/false, or **null when it cannot be judged here**.
 *   null is not "wrong" — callers must not paint it red, must not record it as a
 *   decision, and should defer to the server.
 */
export function isCorrectValue(field, value) {
  if (!hasAnswerData(field)) return null;

  if (field.kind === 'select' || !field.kind) {
    return Boolean(field.options?.find((o) => o.value === value)?.correct);
  }
  if (field.kind === 'boolean') return Boolean(value) === Boolean(field.correct);
  if (field.kind === 'number') return Number(value) === Number(field.correct);
  if (field.kind === 'resourceLocator') {
    const picked = resourceValue(value);
    if (Array.isArray(field.accepts)) return field.accepts.some((a) => String(a) === String(picked ?? ''));
    return String(field.correct) === String(picked ?? '');
  }
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

/**
 * The explanation for the answer a learner actually gave.
 *
 * Select fields carry a `why` per option; typed fields carry one whyCorrect
 * and one whyWrong. Reading only `option.why` left typed fields with an empty
 * Iris bubble — the mascot appeared, said "NOT QUITE", and then had nothing to
 * say, which is worse than not appearing.
 */
export function whyForField(field, value, verdict) {
  if (field.options) {
    const chosen = field.options.find((o) => o.value === value);
    return verdict === 'correct' ? field.options.find((o) => o.correct)?.why : chosen?.why;
  }
  return verdict === 'correct' ? field.whyCorrect : field.whyWrong;
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

export function FieldControl({ field, value, border, bg, onChange, shuffledOptions, inputKeys = [] }) {
  const kind = field.kind ?? 'select';

  if (kind === 'boolean') {
    return (
      <Switch
        checked={Boolean(value)}
        aria-label={field.label}
        borderColor={border}
        onChange={(next) => onChange(field.key, next)}
      />
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
        onChange={(e) => {
          if (e.target.value === '') return onChange(field.key, '');
          // Clamp: typing into a number input bypasses min/max, and marking
          // someone wrong for a value the field should not have accepted is
          // the field's fault, not theirs.
          let n = Number(e.target.value);
          if (typeof field.min === 'number') n = Math.max(field.min, n);
          if (typeof field.max === 'number') n = Math.min(field.max, n);
          onChange(field.key, n);
        }}
        style={baseInput(border, bg)}
      />
    );
  }

  if (kind === 'resourceLocator') {
    // n8n's "which record?" control: a mode selector, then a value control whose
    // shape depends on the mode. From List gives you a picker; By ID and By URL
    // are free text. The point of showing all three is that they answer the same
    // question — real n8n uses this everywhere you name a mailbox, sheet, channel
    // or document, and the mode is why it looks different every time.
    const modes = field.modes ?? ['list', 'id'];
    const current = value && typeof value === 'object' && '__rl' in value ? value : emptyResource(field);
    const set = (patch) => onChange(field.key, { __rl: true, mode: current.mode, value: current.value, ...patch });
    const LABEL = { list: 'From List', id: 'By ID', url: 'By URL' };
    const PLACEHOLDER = { id: 'Paste the ID', url: 'https://…' };

    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          aria-label={`How to choose ${field.label}`}
          value={current.mode}
          onChange={(e) => set({ mode: e.target.value, value: '' })}
          style={{ ...baseInput(border, bg), width: 'auto', flex: 'none', minWidth: 108, appearance: 'none', paddingRight: 22, cursor: 'pointer' }}
        >
          {modes.map((m) => (
            <option key={m} value={m}>{LABEL[m] ?? m}</option>
          ))}
        </select>

        {current.mode === 'list' ? (
          <select
            aria-label={field.label}
            value={current.value ?? ''}
            onChange={(e) => set({ value: e.target.value })}
            style={{ ...baseInput(border, bg), appearance: 'none', paddingRight: 30, cursor: 'pointer', color: current.value ? 'var(--fg-1)' : 'var(--fg-3)' }}
          >
            <option value="" disabled>Choose…</option>
            {(shuffledOptions ?? []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            aria-label={field.label}
            value={current.value ?? ''}
            placeholder={PLACEHOLDER[current.mode] ?? ''}
            spellCheck={false}
            onChange={(e) => set({ value: e.target.value })}
            style={baseInput(border, bg)}
          />
        )}
      </div>
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
        {isExpr && inputKeys.length > 0 ? (
          // Drag-and-drop is the interaction n8n teaches, but a learner who
          // has never seen n8n does not know it is possible. The picker makes
          // the same action discoverable; both write the same expression.
          <select
            aria-label={`Insert an input field into ${field.label}`}
            value=""
            onChange={(e) => { if (e.target.value) onChange(field.key, expressionFor(e.target.value)); }}
            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: '1px solid var(--border-strong)', background: 'var(--surface-1)', fontSize: 10.5, fontFamily: 'var(--font-body)', color: 'var(--fg-2)', padding: '3px 4px', cursor: 'pointer', maxWidth: 118 }}
          >
            <option value="">Insert field…</option>
            {inputKeys.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        ) : null}
        {isExpr && inputKeys.length === 0 && String(value ?? '').includes('{{') ? (
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
