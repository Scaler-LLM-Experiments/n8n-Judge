import React from 'react';
import { CaretDown, CaretUp, Lightning, Plus, Trash } from '@phosphor-icons/react';
import { isFieldVisible } from '@judge/problem-schema';
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

/** A key `$json.x` can address directly — anything else needs brackets. */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * The expression a dragged INPUT field — or the "Insert field…" picker — should
 * produce.
 *
 * Dot notation only works for keys that are valid JS identifiers. This used to
 * emit it unconditionally, so a form field called "What do you need?" produced
 * `{{ $json.What do you need? }}`: invalid in real n8n, and never equal to the
 * authored `{{ $json["What do you need?"] }}`. The learner had no way forward —
 * the picker is the discoverable path, and every answer it wrote was wrong.
 *
 * Field names with spaces are the norm the moment a case uses a form trigger,
 * because the key IS the question the form asked.
 */
export function expressionFor(inputKey) {
  const path = PLAIN_IDENTIFIER.test(inputKey)
    ? `.${inputKey}`
    : `[${JSON.stringify(inputKey)}]`;
  return `{{ $json${path} }}`;
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
    if (verdict === 'correct') return field.options.find((o) => o.correct)?.why ?? field.whyCorrect;
    const chosen = field.options.find((o) => o.value === value);
    // An option the learner really picked: its own `why`, or the field's. Either may be
    // absent on the client, because `toPublicProblem()` strips every explanation and the
    // real one comes back from `/check`. Undefined is the honest answer there, and the
    // caller prefers the server's text anyway.
    if (chosen) return chosen.why ?? field.whyWrong;
    // A value matching NO option is different, and is the reported bug. It happens when
    // something outside this control wrote to the field: a native catalog input rendered
    // beside the graded one, a restored trace, a stale value from a field that changed
    // shape. Iris arrived, said NOT QUITE and showed an empty bubble, which reads as the
    // app breaking rather than as an answer being wrong.
    return (
      field.whyWrong ??
      'That is not one of the choices this field offers. Open the dropdown and pick from the list.'
    );
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

const copy = (value) => {
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, copy(child)]));
  return value;
};

export const initialFixedCollectionRow = (field) => Object.fromEntries((field.fields ?? [])
  .filter((child) => !field.hideOptionalFields || child.required || child.showEvenWhenOptional)
  .map((child) => [child.key, copy(child.value)]));

export const fieldIsVisible = isFieldVisible;

// n8n reuses native names inside conditional fixed collections. The catalog
// keeps unique UI keys, so expose the currently visible sibling under its native
// name while evaluating dependent fields.
export const visibilityValuesForFields = (fields = [], values = {}) => {
  const counts = fields.reduce((result, field) => ({
    ...result,
    [field.n8nKey]: (result[field.n8nKey] ?? 0) + 1,
  }), {});
  const duplicateNativeKeys = new Set(Object.entries(counts)
    .filter(([key, count]) => key && count > 1)
    .map(([key]) => key));
  if (!duplicateNativeKeys.size) return values;

  const scoped = { ...values };
  for (const key of duplicateNativeKeys) delete scoped[key];
  for (const field of fields) {
    if (!duplicateNativeKeys.has(field.n8nKey) || !Object.hasOwn(values, field.key)) continue;
    if (fieldIsVisible(field, values)) scoped[field.n8nKey] = values[field.key];
  }
  return scoped;
};

export const pruneInvisibleValues = (fields = [], values = {}, rootValues = {}) => {
  const scoped = visibilityValuesForFields(fields, { ...rootValues, ...values });
  const byKey = new Map(fields.map((field) => [field.key, field]));
  return Object.fromEntries(Object.entries(values).filter(([key]) => {
    const field = byKey.get(key);
    return !field || (!field.showWhen && !field.hideWhen) || fieldIsVisible(field, scoped);
  }));
};

const nestedLabel = (field) => (
  <div style={{ fontSize: 11.5, fontWeight: 650, color: 'var(--fg-1)', marginBottom: 5 }}>
    {field.label}{field.required ? ' *' : ''}
  </div>
);

const nestedHelp = (field) => field.hint || field.description ? (
  <div style={{ marginTop: 5, fontSize: 10.5, lineHeight: 1.45, color: 'var(--fg-3)' }}>{field.hint || field.description}</div>
) : null;

function NestedControl({ field, value, border, onChange, inputKeys, rootValues }) {
  if (field.kind === 'notice') {
    return <div role="note" style={{ borderLeft: '3px solid var(--brand-primary)', background: 'var(--brand-blue-50, rgba(0,85,255,0.05))', padding: '8px 10px', fontSize: 11.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{field.label}</div>;
  }
  if (field.kind === 'collection') {
    return <CollectionControl field={field} value={value} border={border} bg="var(--surface-0)" onChange={onChange} inputKeys={inputKeys} rootValues={rootValues} />;
  }
  if (field.kind === 'fixedCollection') {
    return <FixedCollectionControl field={field} value={value} border={border} bg="var(--surface-0)" onChange={onChange} inputKeys={inputKeys} rootValues={rootValues} />;
  }
  return <FieldControl field={field} value={value} border={border} bg="var(--surface-0)" onChange={onChange} shuffledOptions={field.options ?? []} inputKeys={inputKeys} />;
}

/** n8n's Options → Add Field control. Members stay absent until explicitly added. */
export function CollectionControl({ field, value, border, bg, onChange, inputKeys = [], rootValues = {} }) {
  const current = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const scopedValues = visibilityValuesForFields(field.fields, { ...rootValues, ...current });
  const members = (field.fields ?? []).filter((child) => child.kind !== 'hidden' && fieldIsVisible(child, scopedValues));
  const active = members.filter((child) => Object.hasOwn(current, child.key));
  const available = members.filter((child) => !Object.hasOwn(current, child.key));
  const update = (key, next) => {
    if (field.locked) return;
    onChange(field.key, pruneInvisibleValues(field.fields, { ...current, [key]: next }, rootValues));
  };
  const remove = (key) => {
    if (field.locked) return;
    onChange(field.key, Object.fromEntries(Object.entries(current).filter(([name]) => name !== key)));
  };

  return (
    <div style={{ border: `1px solid ${border}`, background: bg, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {active.map((child) => (
        <div key={child.key} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {nestedLabel(child)}
              <NestedControl field={field.locked ? { ...child, locked: true } : child} value={current[child.key]} border={border} onChange={update} inputKeys={inputKeys} rootValues={scopedValues} />
              {nestedHelp(child)}
            </div>
            <button type="button" disabled={field.locked} aria-label={`Remove ${child.label}`} onClick={() => remove(child.key)} style={{ border: 'none', background: 'none', color: 'var(--fg-3)', cursor: field.locked ? 'not-allowed' : 'pointer', padding: 4 }}><Trash size={14} /></button>
          </div>
        </div>
      ))}
      {available.length ? (
        <select
          aria-label={field.addLabel || `Add ${field.label}`}
          disabled={field.locked}
          value=""
          onChange={(event) => {
            const child = members.find((candidate) => candidate.key === event.target.value);
            if (child) update(child.key, copy(child.value));
          }}
          style={{ ...baseInput(border, field.locked ? 'var(--surface-2)' : 'var(--surface-0)'), cursor: field.locked ? 'not-allowed' : 'pointer' }}
        >
          <option value="">{field.addLabel || 'Add Field'}</option>
          {available.map((child) => <option key={child.key} value={child.key}>{child.label}</option>)}
        </select>
      ) : null}
    </div>
  );
}

/** Repeatable fixedCollection rows, including per-row conditional fields. */
export function FixedCollectionControl({ field, value, border, bg, onChange, inputKeys = [], rootValues = {} }) {
  const itemKey = field.collectionKey || Object.keys(field.value ?? {})[0] || 'values';
  const current = value && typeof value === 'object' ? value : {};
  const rawRows = current[itemKey];
  const single = field.multiple === false;
  const rows = Array.isArray(rawRows) ? rawRows : single && rawRows && typeof rawRows === 'object' ? [rawRows] : [];
  const canAdd = (!single || rows.length === 0) && (!field.maxItems || rows.length < field.maxItems);
  const emptyRow = () => initialFixedCollectionRow(field);
  const setRows = (next) => {
    if (field.locked) return;
    onChange(field.key, { ...current, [itemKey]: single ? (next[0] ?? {}) : next });
  };
  const setCell = (index, key, next) => setRows(rows.map((row, rowIndex) => rowIndex === index
    ? pruneInvisibleValues(field.fields, { ...row, [key]: next }, rootValues)
    : row));
  const move = (index, offset) => {
    const target = index + offset;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {rows.map((row, index) => {
        const scopedValues = visibilityValuesForFields(field.fields, { ...rootValues, ...row });
        const visible = (field.fields ?? []).filter((child) => child.kind !== 'hidden' && fieldIsVisible(child, scopedValues));
        const active = visible.filter((child) => !field.hideOptionalFields || child.required || child.showEvenWhenOptional || Object.hasOwn(row, child.key));
        const available = visible.filter((child) => !active.includes(child));
        return (
        <div key={index} style={{ border: `1px solid ${border}`, background: bg, padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--fg-3)' }}>{field.collectionLabel || 'Item'} {index + 1}</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {field.sortable ? <button type="button" aria-label={`Move ${field.label} ${index + 1} up`} disabled={field.locked || index === 0} onClick={() => move(index, -1)} style={{ border: 'none', background: 'none', color: 'var(--fg-3)', cursor: field.locked || index === 0 ? 'not-allowed' : 'pointer', padding: 2 }}><CaretUp size={14} /></button> : null}
              {field.sortable ? <button type="button" aria-label={`Move ${field.label} ${index + 1} down`} disabled={field.locked || index === rows.length - 1} onClick={() => move(index, 1)} style={{ border: 'none', background: 'none', color: 'var(--fg-3)', cursor: field.locked || index === rows.length - 1 ? 'not-allowed' : 'pointer', padding: 2 }}><CaretDown size={14} /></button> : null}
              <button type="button" disabled={field.locked} aria-label={`Remove ${field.label} ${index + 1}`} onClick={() => setRows(rows.filter((_, rowIndex) => rowIndex !== index))} style={{ border: 'none', background: 'none', color: 'var(--fg-3)', cursor: field.locked ? 'not-allowed' : 'pointer', padding: 2 }}><Trash size={14} /></button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.map((child) => (
              <div key={child.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {nestedLabel(child)}
                    <NestedControl field={field.locked ? { ...child, locked: true } : child} value={row[child.key]} border={border} onChange={(_, next) => setCell(index, child.key, next)} inputKeys={inputKeys} rootValues={scopedValues} />
                  </div>
                  {field.hideOptionalFields && !child.required && !child.showEvenWhenOptional ? (
                    <button type="button" disabled={field.locked} aria-label={`Remove ${child.label}`} onClick={() => setRows(rows.map((item, rowIndex) => rowIndex === index ? Object.fromEntries(Object.entries(item).filter(([key]) => key !== child.key)) : item))} style={{ border: 'none', background: 'none', color: 'var(--fg-3)', cursor: field.locked ? 'not-allowed' : 'pointer', padding: 4 }}><Trash size={14} /></button>
                  ) : null}
                </div>
                {nestedHelp(child)}
              </div>
            ))}
            {available.length ? (
              <select aria-label={field.addOptionalFieldButtonText || 'Add Attributes'} disabled={field.locked} value="" onChange={(event) => {
                const child = available.find((candidate) => candidate.key === event.target.value);
                if (child) setCell(index, child.key, copy(child.value));
              }} style={{ ...baseInput(border, 'var(--surface-0)'), cursor: 'pointer' }}>
                <option value="">{field.addOptionalFieldButtonText || 'Add Attributes'}</option>
                {available.map((child) => <option key={child.key} value={child.key}>{child.label}</option>)}
              </select>
            ) : null}
          </div>
        </div>
        );
      })}
      <button type="button" disabled={field.locked || !canAdd} onClick={() => setRows(rows.concat(emptyRow()))} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: `1px solid ${border}`, background: 'var(--surface-0)', color: canAdd && !field.locked ? 'var(--brand-primary)' : 'var(--fg-3)', padding: '8px 10px', fontSize: 11.5, fontWeight: 700, cursor: canAdd && !field.locked ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)' }}>
        <Plus size={13} weight="bold" /> {field.addLabel || 'Add Item'}
      </button>
    </div>
  );
}

export function FieldControl({ field, value, border, bg, onChange, shuffledOptions, inputKeys = [] }) {
  const kind = field.kind ?? 'select';

  if (kind === 'button') {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <input aria-label={field.label} value={value ?? ''} readOnly={field.locked} maxLength={field.buttonConfig?.inputFieldMaxLength} placeholder={field.placeholder} onChange={(event) => onChange(field.key, event.target.value)} style={baseInput(border, field.locked ? 'var(--surface-2)' : bg)} />
        <button type="button" title="Simulated control — code generation is authored, not executed here" style={{ flex: 'none', border: 'none', background: 'var(--brand-primary)', color: '#fff', padding: '0 12px', fontSize: 11.5, fontWeight: 700, cursor: 'default', fontFamily: 'var(--font-body)' }}>{field.buttonConfig?.label || field.label}</button>
      </div>
    );
  }

  if (kind === 'boolean') {
    return (
      <Switch
        checked={Boolean(value)}
        aria-label={field.label}
        borderColor={border}
        disabled={field.locked}
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
        disabled={field.locked}
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
        style={{ ...baseInput(border, field.locked ? 'var(--surface-2)' : bg), cursor: field.locked ? 'not-allowed' : 'text' }}
      />
    );
  }

  if (kind === 'color') {
    const raw = String(value ?? '#000000');
    const swatch = /^#[0-9a-f]{6}/i.test(raw) ? raw.slice(0, 7) : '#000000';
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="color" aria-label={`${field.label} picker`} value={swatch} disabled={field.locked} onChange={(event) => onChange(field.key, `${event.target.value}${raw.length === 9 ? raw.slice(7) : ''}`)} style={{ width: 44, minHeight: 38, border: `1.5px solid ${border}`, background: field.locked ? 'var(--surface-2)' : bg, padding: 3 }} />
        <input aria-label={field.label} value={raw} readOnly={field.locked} onChange={(event) => onChange(field.key, event.target.value)} style={baseInput(border, field.locked ? 'var(--surface-2)' : bg)} />
      </div>
    );
  }

  if (kind === 'multiSelect') {
    return (
      <select
        multiple
        aria-label={field.label}
        disabled={field.locked}
        value={Array.isArray(value) ? value : []}
        onChange={(event) => onChange(field.key, Array.from(event.target.selectedOptions, (option) => option.value))}
        style={{ ...baseInput(border, field.locked ? 'var(--surface-2)' : bg), minHeight: 96, cursor: field.locked ? 'not-allowed' : 'pointer' }}
      >
        {(shuffledOptions ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
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
    const modeMeta = (mode) => (field.modeOptions ?? []).find((option) => option.value === mode);

    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          aria-label={`How to choose ${field.label}`}
          value={current.mode}
          disabled={field.locked}
          onChange={(e) => set({ mode: e.target.value, value: '' })}
          style={{ ...baseInput(border, field.locked ? 'var(--surface-2)' : bg), width: 'auto', flex: 'none', minWidth: 108, appearance: 'none', paddingRight: 22, cursor: field.locked ? 'not-allowed' : 'pointer' }}
        >
          {modes.map((m) => (
            <option key={m} value={m}>{modeMeta(m)?.label ?? LABEL[m] ?? m}</option>
          ))}
        </select>

        {current.mode === 'list' ? (
          <select
            aria-label={field.label}
            value={current.value ?? ''}
            disabled={field.locked}
            onChange={(e) => set({ value: e.target.value })}
            style={{ ...baseInput(border, field.locked ? 'var(--surface-2)' : bg), appearance: 'none', paddingRight: 30, cursor: field.locked ? 'not-allowed' : 'pointer', color: current.value ? 'var(--fg-1)' : 'var(--fg-3)' }}
          >
            <option value="" disabled>Choose…</option>
            {(shuffledOptions ?? []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.inputType ?? 'text'}
            aria-label={field.label}
            value={current.value ?? ''}
            readOnly={field.locked}
            placeholder={modeMeta(current.mode)?.placeholder ?? PLACEHOLDER[current.mode] ?? ''}
            spellCheck={false}
            onChange={(e) => set({ value: e.target.value })}
            style={baseInput(border, field.locked ? 'var(--surface-2)' : bg)}
          />
        )}
      </div>
    );
  }

  if (kind === 'text' || kind === 'textarea' || kind === 'expression' || kind === 'code') {
    const isExpr = kind === 'expression';
    const isEditor = kind === 'textarea' || kind === 'code' || Boolean(field.editor);
    const setRawPath = (key) => {
      if (!key) return;
      const next = field.dataPath === 'multiple' || field.requiresDataPath === 'multiple'
        ? [value, key].filter(Boolean).join(', ')
        : key;
      onChange(field.key, next);
    };
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
        {isEditor ? (
          <textarea
            aria-label={field.label}
            value={value ?? ''}
            readOnly={field.readOnly || field.locked}
            rows={8}
            placeholder={field.placeholder}
            spellCheck={false}
            onChange={(e) => onChange(field.key, e.target.value)}
            style={{ ...baseInput(border, field.readOnly || field.locked ? 'var(--surface-2)' : bg), minHeight: 150, resize: 'vertical', lineHeight: 1.5, fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)' }}
          />
        ) : (
          <input
            type={field.inputType ?? 'text'}
            aria-label={field.label}
            value={value ?? ''}
            readOnly={field.locked}
            placeholder={field.placeholder ?? (isExpr ? 'Drag a field from Input, or type {{ $json.… }}' : '')}
            spellCheck={false}
            onChange={(e) => onChange(field.key, e.target.value)}
            style={{
              ...baseInput(border, field.locked ? 'var(--surface-2)' : bg),
              paddingLeft: isExpr ? 30 : 11,
              fontFamily: isExpr ? 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)' : 'var(--font-body)',
            }}
          />
        )}
        {isExpr && inputKeys.length > 0 ? (
          // Drag-and-drop is the interaction n8n teaches, but a learner who
          // has never seen n8n does not know it is possible. The picker makes
          // the same action discoverable; both write the same expression.
          <select
            aria-label={`Insert an input field into ${field.label}`}
            value=""
            disabled={field.locked}
            onChange={(e) => { if (e.target.value) onChange(field.key, expressionFor(e.target.value)); }}
            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: '1px solid var(--border-strong)', background: 'var(--surface-1)', fontSize: 10.5, fontFamily: 'var(--font-body)', color: 'var(--fg-2)', padding: '3px 4px', cursor: 'pointer', maxWidth: 118 }}
          >
            <option value="">Insert field…</option>
            {inputKeys.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        ) : null}
        {!isExpr && (field.dataPath || field.requiresDataPath) && inputKeys.length > 0 ? (
          <select aria-label={`Insert an input field into ${field.label}`} value="" disabled={field.locked} onChange={(event) => setRawPath(event.target.value)} style={{ position: 'absolute', right: 6, top: 6, border: '1px solid var(--border-strong)', background: 'var(--surface-1)', fontSize: 10.5, fontFamily: 'var(--font-body)', color: 'var(--fg-2)', padding: '3px 4px', cursor: field.locked ? 'not-allowed' : 'pointer', maxWidth: 118 }}>
            <option value="">Insert field…</option>
            {inputKeys.map((key) => <option key={key} value={key}>{key}</option>)}
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

  // A few n8n option fields also accept an expression/custom identifier. A
  // native datalist preserves both parts without inventing another control.
  if (field.allowCustomValue || field.expressionAllowed) {
    const listId = `${field.key}-options`;
    return (
      <>
        <input
          aria-label={field.label}
          list={listId}
          value={value ?? ''}
          readOnly={field.locked}
          placeholder={field.placeholder ?? 'Choose or enter a value'}
          onChange={(event) => onChange(field.key, event.target.value)}
          style={baseInput(border, field.locked ? 'var(--surface-2)' : bg)}
        />
        <datalist id={listId}>
          {(shuffledOptions ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </datalist>
      </>
    );
  }

  // select — the original control
  return (
    <>
      <select
        aria-label={field.label}
        value={value ?? ''}
        disabled={field.locked}
        onChange={(e) => onChange(field.key, e.target.value)}
        style={{ ...baseInput(border, field.locked ? 'var(--surface-2)' : bg), appearance: 'none', paddingRight: 30, cursor: field.locked ? 'not-allowed' : 'pointer', color: value ? 'var(--fg-1)' : 'var(--fg-3)' }}
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
