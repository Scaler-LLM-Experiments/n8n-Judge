import { describe, it, expect } from 'vitest';
import { inputRows, inputPaths, displayValue } from './inputFields.js';

describe('the INPUT pane shows the fields a decision turns on', () => {
  // This is weather-commute-ping's real HTTP Request sample. Before this module the pane
  // rendered `current` as the literal text "[object Object]", so the temperature and the
  // weather code (the only two facts the node's graded decision uses) were invisible,
  // while latitude and longitude, which nothing uses, were the only readable rows.
  const forecast = {
    latitude: 12.97,
    longitude: 77.59,
    current: { time: '2026-08-12T09:00', temperature_2m: 24, weather_code: 0, precipitation: 0 },
  };

  it('exposes a nested leaf with the path an expression would use', () => {
    const paths = inputPaths(forecast);
    expect(paths).toContain('current.temperature_2m');
    expect(paths).toContain('current.weather_code');
    expect(paths).toContain('current.precipitation');
  });

  it('never renders the string "[object Object]"', () => {
    for (const row of inputRows(forecast)) expect(row.value).not.toContain('[object Object]');
  });

  it('shows the real value beside each leaf', () => {
    const rows = inputRows(forecast);
    const temp = rows.find((r) => r.path === 'current.temperature_2m');
    expect(temp).toMatchObject({ label: 'temperature_2m', value: '24', kind: 'leaf', depth: 1 });
  });

  it('keeps the parent as a group row, so the indentation has a header', () => {
    const current = inputRows(forecast).find((r) => r.path === 'current');
    expect(current).toMatchObject({ kind: 'group', value: '4 fields', depth: 0 });
  });

  it('leaves flat data exactly as it was', () => {
    // Three of six cases have flat samples only, and they must not change.
    const rows = inputRows({ from: 'a@b.com', subject: 'Hello' });
    expect(rows).toEqual([
      { path: 'from', label: 'from', value: 'a@b.com', kind: 'leaf', depth: 0 },
      { path: 'subject', label: 'subject', value: 'Hello', kind: 'leaf', depth: 0 },
    ]);
  });
});

describe('arrays are summarised, not enumerated', () => {
  // low-stock-morning-post's aggregate node. Its Slack answer is `{{ $json.low_stock }}`,
  // so the ARRAY path has to be offered, and `String(v)` used to render the whole thing
  // as "[object Object],[object Object],[object Object]".
  const aggregated = {
    low_stock: [
      { bean: 'Ethiopia Guji', location: 'Kalyani Nagar', kg_on_hand: 1.2 },
      { bean: 'Brazil Cerrado', location: 'Roastery', kg_on_hand: 18 },
      { bean: 'Decaf Colombia', location: 'Baner', kg_on_hand: 0 },
    ],
  };

  it('offers the array itself, since that is often the answer', () => {
    expect(inputPaths(aggregated)).toContain('low_stock');
  });

  it('says how many rows it holds instead of printing them', () => {
    const group = inputRows(aggregated).find((r) => r.path === 'low_stock');
    expect(group).toMatchObject({ kind: 'group', value: '3 items' });
  });

  it('shows one row\'s shape, pathed with [0], rather than all three', () => {
    const paths = inputPaths(aggregated);
    expect(paths).toContain('low_stock[0].bean');
    // Not thirty rows of the same three keys.
    expect(paths.filter((p) => p.startsWith('low_stock['))).toHaveLength(3);
    expect(paths).not.toContain('low_stock[1].bean');
  });

  it('handles an array of primitives', () => {
    expect(inputPaths({ tags: ['a', 'b'] })).toEqual(['tags', 'tags[0]']);
  });

  it('handles an empty array without inventing a row', () => {
    const rows = inputRows({ nothing: [] });
    expect(rows).toEqual([{ path: 'nothing', label: 'nothing', value: '0 items', kind: 'group', depth: 0 }]);
  });
});

describe('value formatting', () => {
  it('keeps a string as itself and does not quote it', () => {
    expect(displayValue('clear skies')).toBe('clear skies');
  });

  it('keeps zero visible, since 0 is a real weather code and a real stock level', () => {
    // `value || ''` would have hidden both. weather_code 0 means a clear sky and
    // kg_on_hand 0 means the café has run out.
    expect(displayValue(0)).toBe('0');
    expect(displayValue(false)).toBe('false');
  });

  it('renders null and undefined without crashing', () => {
    expect(displayValue(null)).toBe('null');
    expect(displayValue(undefined)).toBe('');
  });
});

describe('depth is bounded', () => {
  it('stops expanding past three levels and shows the shape instead', () => {
    const deep = { a: { b: { c: { d: { e: 1 } } } } };
    const paths = inputPaths(deep);
    expect(paths).toContain('a.b.c');
    // `a.b.c.d` is reported as a shape rather than expanded into `a.b.c.d.e`.
    expect(paths).not.toContain('a.b.c.d.e');
  });
});
