import React from 'react';
import { Plus, Trash, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { asRules, emptyRule } from '@judge/problem-schema';

// The Switch's routing rules — n8n's `fixedCollection` of `filter`s, which is a
// repeatable, sortable group rather than a single field.
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

export function RuleListControl({ field, value, border, onChange }) {
  const rules = asRules(value);
  const set = (next) => onChange(field.key, { values: next });

  const patch = (i, key, v) => set(rules.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const add = () => set([...rules, emptyRule()]);
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
          No branches yet. Every branch you add becomes an output on this node — that’s
          how the Switch gets its shape.
        </div>
      ) : null}

      {rules.map((rule, i) => (
        <div key={i} style={{ border: `1px solid ${border}`, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--surface-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-3)', flex: 'none' }}>
              Output {i + 1}
            </span>
            <Pick
              label="Branch name"
              value={rule.outputKey}
              options={field.branchOptions}
              onChange={(v) => patch(i, 'outputKey', v)}
              border="var(--border-strong)"
            />
            <IconBtn title="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
              <ArrowUp size={12} weight="bold" />
            </IconBtn>
            <IconBtn title="Move down" disabled={i === rules.length - 1} onClick={() => move(i, 1)}>
              <ArrowDown size={12} weight="bold" />
            </IconBtn>
            <IconBtn title={`Remove output ${i + 1}`} onClick={() => remove(i)}>
              <Trash size={12} />
            </IconBtn>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--fg-3)', flex: 'none' }}>Send here when</span>
            <Pick label="Field" value={rule.left} options={field.leftOptions} onChange={(v) => patch(i, 'left', v)} border="var(--border-strong)" flex={1.4} />
            <Pick label="Operator" value={rule.operator} options={field.operatorOptions} onChange={(v) => patch(i, 'operator', v)} border="var(--border-strong)" />
            <Pick label="Value" value={rule.right} options={field.rightOptions} onChange={(v) => patch(i, 'right', v)} border="var(--border-strong)" flex={1.2} />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1px dashed var(--brand-primary)', color: 'var(--brand-primary)', padding: '7px 11px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer' }}
      >
        <Plus size={13} weight="bold" /> {field.addLabel ?? 'Add Routing Rule'}
      </button>
    </div>
  );
}
