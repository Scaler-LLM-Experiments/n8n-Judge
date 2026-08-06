import { describe, expect, it } from 'vitest';
import { branchesForPorts, compatibleCatalogParams, defaultsForParams, mergeCatalogFields, resolveNodePorts } from './catalogFields.js';
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

  it('does not mix legacy teaching keys with a contradictory native schema', () => {
    const params = [{ key: 'sheetOperation' }, { key: 'appendColumns' }];
    expect(compatibleCatalogParams(params, [{ key: 'operation' }, { key: 'columns' }])).toEqual([]);
    expect(compatibleCatalogParams(params, [{ key: 'sheetOperation' }])).toBe(params);
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

  it('renders Switch outputs from expression counts and named rules', () => {
    expect(resolveNodePorts(NODE_CATALOG.switch, { mode: 'expression', numberOutputs: 3 }).outputs.map((port) => port.label)).toEqual(['0', '1', '2']);
    expect(resolveNodePorts(NODE_CATALOG.switch, {
      mode: 'rules',
      rules: { values: [{ outputKey: 'Paid' }, { outputKey: '' }] },
      options: { fallbackOutput: 'extra', renameFallbackOutput: 'Other' },
    }).outputs.map((port) => port.label)).toEqual(['Paid', '1', 'Other']);
  });

  it('uses real multi-output labels with case branch ids', () => {
    expect(branchesForPorts(NODE_CATALOG.if, resolveNodePorts(NODE_CATALOG.if), [
      { id: 'matched', label: 'Matched' },
      { id: 'unmatched', label: 'Unmatched' },
    ])).toEqual([
      { id: 'matched', label: 'True' },
      { id: 'unmatched', label: 'False' },
    ]);
  });

  it('keeps real single-output nodes and variants linear', () => {
    expect(branchesForPorts(NODE_CATALOG.filter, resolveNodePorts(NODE_CATALOG.filter))).toBeNull();
    expect(branchesForPorts(NODE_CATALOG.guardrails, resolveNodePorts(NODE_CATALOG.guardrails, { operation: 'sanitize' }))).toBeNull();
  });

  it('renders one Webhook output per selected HTTP method', () => {
    expect(resolveNodePorts(NODE_CATALOG.webhook, {}).outputs.map((port) => port.label)).toEqual(['GET']);
    expect(resolveNodePorts(NODE_CATALOG.webhook, {
      multipleMethods: true,
      multipleHttpMethods: ['DELETE', 'POST', 'PUT'],
    }).outputs.map((port) => port.label)).toEqual(['DELETE', 'POST', 'PUT']);
  });

  it('resolves nested AI connector conditions', () => {
    expect(resolveNodePorts(NODE_CATALOG.chat, { options: { memoryConnection: true } }).inputs.map((port) => port.type)).toEqual(['main', 'ai_memory']);
    expect(resolveNodePorts(NODE_CATALOG['chat-trigger'], {
      mode: 'hostedChat',
      options: { loadPreviousSession: 'memory' },
    }).inputs.map((port) => port.type)).toEqual(['ai_memory']);
  });

  it('adds the Guardrails model connector only for model-backed checks', () => {
    expect(resolveNodePorts(NODE_CATALOG.guardrails, {
      guardrails: { jailbreakGuardrail: true },
    }).inputs.map((port) => port.type ?? port)).toEqual(['main', 'ai_languageModel']);
    expect(resolveNodePorts(NODE_CATALOG.guardrails, {
      guardrails: { keywordList: 'blocked' },
    }).inputs).toEqual(['main']);
  });

  it('adds Google Gemini tools only for Text Message', () => {
    expect(resolveNodePorts(NODE_CATALOG['google-gemini'], {
      resource: 'text',
      textOperation: 'message',
    }).inputs.map((port) => port.type ?? port)).toEqual(['main', 'ai_tool']);
    expect(resolveNodePorts(NODE_CATALOG['google-gemini'], {
      resource: 'image',
      imageOperation: 'generate',
    }).inputs).toEqual(['main']);
  });

  it('adds OpenAI tools only for supported Text Response models', () => {
    expect(resolveNodePorts(NODE_CATALOG.openai, {
      resource: 'text',
      textOperation: 'response',
      textResponseModelId: { __rl: true, mode: 'id', value: 'gpt-4.1-mini' },
    }).inputs.map((port) => port.type ?? port)).toEqual(['main', 'ai_tool']);
    expect(resolveNodePorts(NODE_CATALOG.openai, {
      resource: 'text',
      textOperation: 'response',
      textResponseModelId: { __rl: true, mode: 'id', value: 'dall-e-3' },
    }).inputs).toEqual(['main']);
  });
});
