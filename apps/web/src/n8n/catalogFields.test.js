import { describe, expect, it } from 'vitest';
import { defaultsForParams, mergeCatalogFields, resolveNodePorts } from './catalogFields.js';
import { NODE_CATALOG } from '@judge/catalog/catalog.js';

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

  it('resolves dynamic ports from authored values and catalog defaults', () => {
    const entry = {
      inputs: ['main'],
      outputs: ['main'],
      params: [{ key: 'operation', value: 'split' }],
      portVariants: [{ showWhen: { operation: ['split'] }, outputs: [{ type: 'main', label: 'A' }, { type: 'main', label: 'B' }] }],
    };
    expect(resolveNodePorts(entry, {}).outputs).toHaveLength(2);
    expect(resolveNodePorts(entry, { operation: 'pass' }).outputs).toEqual(['main']);
  });

  it('resolves a bounded dynamic input count for nodes such as Merge', () => {
    const entry = {
      params: [{ key: 'mode', value: 'append' }, { key: 'appendInputs', value: 2 }],
      inputs: [{ type: 'main', label: 'Input 1' }, { type: 'main', label: 'Input 2' }],
      dynamicInputs: {
        enabled: true, min: 2, max: 4, defaultCount: 2, type: 'main', modeParameter: 'mode',
        countParameterByMode: { append: 'appendInputs' }, labels: ['Input 1', 'Input 2', 'Input 3', 'Input 4'],
      },
    };
    expect(resolveNodePorts(entry, { appendInputs: 3 }).inputs.map((port) => port.label)).toEqual(['Input 1', 'Input 2', 'Input 3']);
    expect(resolveNodePorts(entry, { appendInputs: 99 }).inputs).toHaveLength(4);
  });

  it('renders Merge input ports from the active mode branch', () => {
    expect(resolveNodePorts(NODE_CATALOG.merge, { mode: 'combine', combineBy: 'combineByPosition', positionNumberInputs: 4 }).inputs).toHaveLength(4);
    expect(resolveNodePorts(NODE_CATALOG.merge, { mode: 'combine', combineBy: 'combineAll', positionNumberInputs: 8 }).inputs).toHaveLength(2);
  });
});
