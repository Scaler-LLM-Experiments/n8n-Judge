import React from 'react';
import { Plus, Trash, ArrowUp, ArrowDown, CheckCircle, XCircle } from '@phosphor-icons/react';
import { asListItems, emptyListItem, LIST_SPECS, aspectRowLabel } from '@judge/problem-schema';
import { IrisBubble } from './IrisBubble.jsx';
import { valuesFor } from './valuesFor.js';

// n8n's repeatable-group parameters: the Switch's routing `rules` (a
// fixedCollection of filters) and Edit Fields' `assignments` (name → value).
// Both are lists you add entries to, not single fields, so they share one control.
//
// Each rule names a branch and states what that branch tests. Adding one adds an
// OUTPUT to the node on the canvas, which is the whole point: in real n8n a
// node's shape is a consequence of how it is configured, and Judge used to hide
// that by hardcoding the branches in problem data.
//
// The condition is built from dropdowns rather than free text. Real n8n gives you
// an expression and a full operator list; here the vocabulary is authored, so the
// question stays "what should this branch test?" instead of "can you type an
// expression from memory?". The expression field on the AI node already teaches
// the typing skill.
//
// Reordering is up/down buttons, not drag: it is keyboard-reachable, and order
// genuinely matters in n8n (the first matching output wins), so it should be a
// deliberate action rather than something you can do by accident.

const cell = (border) => ({
  border: `1px solid ${border}`,
  background: 'var(--surface-0)',
  padding: '7px 9px',
  fontSize: 12,
  fontFamily: 'var(--font-body)',
  color: 'var(--fg-1)',
  minWidth: 0,
});

function Pick({ label, value, options, onChange, border, flex = 1 }) {
  return (
    <select
      aria-label={label}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...cell(border), flex, appearance: 'none', cursor: 'pointer', color: value ? 'var(--fg-1)' : 'var(--fg-3)' }}
    >
      <option value="" disabled>{label}</option>
      {(options ?? []).map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function TextEntry({ label, value, onChange, border, flex = 1 }) {
  return <input aria-label={label} value={value ?? ''} placeholder={label} onChange={(event) => onChange(event.target.value)} style={{ ...cell(border), flex }} />;
}

function IconBtn({ title, onClick, disabled, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 24,
        height: 24,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-0)',
        border: '1px solid var(--border-strong)',
        color: disabled ? 'var(--n-200, #C9CED6)' : 'var(--fg-2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

/**
 * `rowVerdicts` is the graded answer, attributed to the row it belongs to:
 * `{ [aspect]: { items: boolean[], missing: number } }`, straight from the check
 * response. Absent until Verify runs, and absent on the dev routes, where there
 * is no session to grade against.
 *
 * Why it exists: the three aspects of a list used to report as three messages
 * stacked underneath it, so a five-branch Switch with one bad condition said
 * "What each branch tests — not right" and left the learner to work out which of
 * the five. The verdict is still ONE scored item per aspect (see ruleList.ts —
 * per-row scoring would make the denominator move); only the message moved.
 */
export function RuleListControl({ field, value, border, onChange, rowVerdicts, feedback, onExplainAspect }) {
  const kind = field.kind;
  const spec = LIST_SPECS[kind];
  const isRules = kind === 'ruleList';
  const rules = asListItems(kind, value);
  // Which aspects have a verdict per row at all. `count` never does.
  const rowAspects = rowVerdicts ? Object.keys(rowVerdicts).filter((a) => aspectRowLabel(kind, a)) : [];
  // Store under n8n's own key for this kind: `values` for Switch rules,
  // `assignments` for Edit Fields.
  const set = (next) => onChange(field.key, { [spec.itemsKey]: next });

  const patch = (i, key, v) => set(rules.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const add = () => set([...rules, emptyListItem(kind)]);
  const remove = (i) => set(rules.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= rules.length) return;
    const next = [...rules];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rules.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--fg-3)', border: '1px dashed var(--border-strong)', padding: '12px 11px', lineHeight: 1.5 }}>
          {isRules
            ? 'No branches yet. Every branch you add becomes an output on this node — that’s how the Switch gets its shape.'
            : 'No fields yet. Each one you add becomes a clean value the nodes after this can use.'}
        </div>
      ) : null}

      {rules.map((rule, i) => {
        // This row's own verdict, aspect by aspect. `undefined` means the row was
        // added after the last Verify — the list is longer than the graded answer
        // — and an unjudged row must not be coloured either way.
        const failed = rowAspects.filter((a) => rowVerdicts[a].items[i] === false);
        const judged = rowAspects.length > 0 && rowAspects.every((a) => typeof rowVerdicts[a].items[i] === 'boolean');
        const rowState = !judged ? null : failed.length ? 'wrong' : 'correct';
        const rowBorder =
          rowState === 'wrong' ? 'var(--status-danger)' : rowState === 'correct' ? 'var(--status-success)' : border;
        return (
        <div key={i} style={{ border: `1px solid ${rowBorder}`, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--surface-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-3)', flex: 'none' }}>
              {isRules ? `Output ${i + 1}` : `Field ${i + 1}`}
            </span>
            {isRules || field.nameOptions?.length ? (
              <Pick label={isRules ? 'Branch name' : 'Field name'} value={rule[spec.keyOf]} options={isRules ? field.branchOptions : field.nameOptions} onChange={(v) => patch(i, spec.keyOf, v)} border="var(--border-strong)" />
            ) : (
              <TextEntry label="Field name" value={rule[spec.keyOf]} onChange={(v) => patch(i, spec.keyOf, v)} border="var(--border-strong)" />
            )}
            <IconBtn title="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
              <ArrowUp size={12} weight="bold" />
            </IconBtn>
            <IconBtn title="Move down" disabled={i === rules.length - 1} onClick={() => move(i, 1)}>
              <ArrowDown size={12} weight="bold" />
            </IconBtn>
            <IconBtn title={isRules ? `Remove output ${i + 1}` : `Remove field ${i + 1}`} onClick={() => remove(i)}>
              <Trash size={12} />
            </IconBtn>
          </div>

          {isRules ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--fg-3)', flex: 'none' }}>Send here when</span>
              <Pick label="Field" value={rule.left} options={field.leftOptions} onChange={(v) => patch(i, 'left', v)} border="var(--border-strong)" flex={1.4} />
              <Pick label="Operator" value={rule.operator} options={field.operatorOptions} onChange={(v) => patch(i, 'operator', v)} border="var(--border-strong)" />
              <Pick label="Value" value={rule.right} options={field.rightOptions} onChange={(v) => patch(i, 'right', v)} border="var(--border-strong)" flex={1.2} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--fg-3)', flex: 'none' }}>Set it to</span>
              {field.valueOptions?.length ? (
                <Pick label="Value" value={rule.value} options={valuesFor(field.valueOptions, rule[spec.keyOf])} onChange={(v) => patch(i, 'value', v)} border="var(--border-strong)" flex={2} />
              ) : (
                <TextEntry label="Value" value={rule.value} onChange={(v) => patch(i, 'value', v)} border="var(--border-strong)" flex={2} />
              )}
            </div>
          )}

          {/* The verdict for THIS row, which is the whole point of the change: one
              message per branch, on the branch, instead of three list-wide lines
              the learner has to map back onto five rows themselves. */}
          {rowState === 'correct' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--status-success)' }}>
              <CheckCircle size={14} weight="fill" /> This one’s right
            </span>
          ) : null}
          {failed.map((aspect) => {
            // Keyed by row as well as aspect, so two rows failing the same aspect
            // each open their own explanation rather than one bubble jumping.
            const key = `${field.key}#${aspect}@${i}`;
            return (
              <div key={aspect}>
                <button
                  type="button"
                  onClick={() => onExplainAspect?.(key, 'wrong')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2, color: 'var(--status-danger)' }}
                >
                  <XCircle size={14} weight="fill" /> {aspectRowLabel(kind, aspect)} — not right, ask Iris why
                </button>
                {feedback?.key === key && feedback.why ? <IrisBubble tone="wrong">{feedback.why}</IrisBubble> : null}
              </div>
            );
          })}
        </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1px dashed var(--brand-primary)', color: 'var(--brand-primary)', padding: '7px 11px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer' }}
      >
        <Plus size={13} weight="bold" /> {field.addLabel ?? (isRules ? 'Add Routing Rule' : 'Add Field')}
      </button>
    </div>
  );
}
