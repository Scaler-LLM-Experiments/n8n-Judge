import { describe, expect, it } from 'vitest';
import { defaultsForParams, mergeCatalogFields } from './catalogFields.js';

describe('catalog-backed node setup', () => {
  it('copies defaults so editing one node cannot mutate the catalog', () => {
    const params = [{ key: 'options', value: { enabled: false, rows: [{ name: '' }] } }];
    const defaults = defaultsForParams(params);
    defaults.options.rows[0].name = 'changed';
    expect(params[0].value.rows[0].name).toBe('');
  });

  it('overlays case grading while retaining ungraded real fields', () => {
    const fields = mergeCatalogFields(
      [
        { key: 'mode', kind: 'select', value: 'all', description: 'Real help' },
        { key: 'limit', kind: 'number', value: 1 },
      ],
      [{ key: 'mode', label: 'Mode for this case', options: [{ value: 'all', label: 'All', correct: true, why: 'Right' }] }]
    );
    expect(fields[0]).toMatchObject({ key: 'mode', kind: 'select', graded: true, description: 'Real help', label: 'Mode for this case' });
    expect(fields[1]).toMatchObject({ key: 'limit', graded: false });
  });

  it('keeps case-only teaching fields for existing screens', () => {
    expect(mergeCatalogFields([], [{ key: 'decision', label: 'Decision' }])).toEqual([
      { key: 'decision', label: 'Decision', graded: true },
    ]);
  });
});
