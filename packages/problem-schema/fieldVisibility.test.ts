import { describe, it, expect } from 'vitest';
import { isFieldVisible, visibleFields, pruneHidden } from './fieldVisibility.ts';

const plain = { key: 'mode' };
const child = { key: 'label', showWhen: { mode: ['separate'] } };
const twoConds = { key: 'deep', showWhen: { mode: ['separate'], advanced: [true] } };

describe('isFieldVisible', () => {
  it('shows a field with no condition', () => {
    expect(isFieldVisible(plain, {})).toBe(true);
  });

  it('hides a conditional field until its parent matches', () => {
    expect(isFieldVisible(child, {})).toBe(false);
    expect(isFieldVisible(child, { mode: 'none' })).toBe(false);
    expect(isFieldVisible(child, { mode: 'separate' })).toBe(true);
  });

  it('requires every named key to match (AND across keys)', () => {
    expect(isFieldVisible(twoConds, { mode: 'separate' })).toBe(false);
    expect(isFieldVisible(twoConds, { mode: 'separate', advanced: true })).toBe(true);
  });

  it('accepts any of a key’s listed values (OR within a key)', () => {
    const f = { key: 'x', showWhen: { mode: ['a', 'b'] } };
    expect(isFieldVisible(f, { mode: 'b' })).toBe(true);
    expect(isFieldVisible(f, { mode: 'c' })).toBe(false);
  });

  it('matches any selected multi-option value', () => {
    const f = { key: 'x', showWhen: { events: ['message', 'file_share'] } };
    expect(isFieldVisible(f, { events: ['reaction_added', 'message'] })).toBe(true);
    expect(isFieldVisible(f, { events: ['reaction_added'] })).toBe(false);
  });

  it('supports n8n negative conditions for hidden or undefined toggles', () => {
    const f = { key: 'channel', showWhen: { watchAll: { not: true } } };
    expect(isFieldVisible(f, {})).toBe(true);
    expect(isFieldVisible(f, { watchAll: false })).toBe(true);
    expect(isFieldVisible(f, { watchAll: true })).toBe(false);
  });

  it('supports n8n hide conditions', () => {
    const f = { key: 'tools', hideWhen: { hideTools: ['hide'] } };
    expect(isFieldVisible(f, { hideTools: 'show' })).toBe(true);
    expect(isFieldVisible(f, { hideTools: 'hide' })).toBe(false);
  });

  // A checkbox hands back a real boolean and a number input often a string, so
  // matching has to be loose or an authored `true`/`3` would never fire.
  it('matches loosely across types', () => {
    expect(isFieldVisible({ key: 'x', showWhen: { n: [3] } }, { n: '3' })).toBe(true);
    expect(isFieldVisible({ key: 'x', showWhen: { b: [true] } }, { b: true })).toBe(true);
  });
});

describe('visibleFields', () => {
  it('filters to what is displayed', () => {
    expect(visibleFields([plain, child], {}).map((f) => f.key)).toEqual(['mode']);
    expect(visibleFields([plain, child], { mode: 'separate' }).map((f) => f.key)).toEqual(['mode', 'label']);
  });

  it('preserves authored order', () => {
    const out = visibleFields([child, plain], { mode: 'separate' }).map((f) => f.key);
    expect(out).toEqual(['label', 'mode']);
  });

  it('tolerates a missing field list', () => {
    expect(visibleFields(undefined as never, {})).toEqual([]);
  });
});

describe('pruneHidden', () => {
  it('drops the value of a field that is no longer shown', () => {
    const out = pruneHidden([plain, child], { mode: 'none', label: 'Unrouted' });
    expect(out).toEqual({ mode: 'none' });
  });

  it('keeps the value while the field is still shown', () => {
    const values = { mode: 'separate', label: 'Unrouted' };
    expect(pruneHidden([plain, child], values)).toEqual(values);
  });

  it('drops a value hidden by hideWhen', () => {
    expect(pruneHidden([{ key: 'tools', hideWhen: { hideTools: ['hide'] } }], {
      hideTools: 'hide',
      tools: 'connected',
    })).toEqual({ hideTools: 'hide' });
  });

  it('never drops an unconditional field', () => {
    expect(pruneHidden([plain], { mode: 'none' })).toEqual({ mode: 'none' });
  });

  it('returns the same object when nothing changed, so React can bail out', () => {
    const values = { mode: 'separate', label: 'x' };
    expect(pruneHidden([plain, child], values)).toBe(values);
  });
});
