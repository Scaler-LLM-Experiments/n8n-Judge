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

  describe('a native control must never shadow a graded one', () => {
    const params = [{ key: 'url' }, { key: 'method' }, { key: 'authentication' }];

    it('drops the native param an authored field already asks for', () => {
      // The bug: the rule was all-or-nothing, so a case authoring ONE field whose key
      // happened to be native got the whole native surface, including a free-text `url`
      // box beside the graded `url` select. A learner typed into the native box, which no
      // select option can match, and the case could not be completed.
      const shown = compatibleCatalogParams(params, [{ key: 'url' }]);
      expect(shown.map((p) => p.key)).toEqual(['method', 'authentication']);
    });

    it('keeps the rest of the native surface as context', () => {
      // Dropping everything was the other half of the old rule, and it cost the learner
      // the picture of what the node really looks like in n8n.
      expect(compatibleCatalogParams(params, [{ key: 'url' }])).toHaveLength(2);
    });

    it('honours nativeKey, for a field authored under a different name', () => {
      // `httpMethod` does not collide with `method`, so without this the native Method
      // control renders at its GET default, which on one case is also the answer.
      const shown = compatibleCatalogParams(params, [{ key: 'httpMethod', nativeKey: 'method' }]);
      expect(shown.map((p) => p.key)).toEqual(['url', 'authentication']);
    });

    it('leaves the native surface alone when a node grades nothing', () => {
      expect(compatibleCatalogParams(params, [])).toBe(params);
    });

    it('lets a locked row claim its native param, matched by label', () => {
      // Found by looking at the panel: "Method (locked) GET" sat directly above a LIVE
      // native Method select. Two controls for one parameter, one of them editable, is the
      // same defect the low-stock aggregate node hit.
      const withLabels = [
        { key: 'url' },
        { key: 'method', label: 'Method' },
        { key: 'authentication', label: 'Authentication' },
      ];
      const shown = compatibleCatalogParams(withLabels, [{ key: 'url' }], [
        { label: 'Method', value: 'GET' },
        { label: 'Authentication', value: 'None' },
      ]);
      expect(shown).toEqual([]);
    });

    it('matches a locked row against the param key as well as its label', () => {
      const shown = compatibleCatalogParams([{ key: 'responseFormat' }], [], [{ label: 'responseFormat', value: 'JSON' }]);
      expect(shown).toEqual([]);
    });

    it('ignores a locked row that names nothing native', () => {
      const params = [{ key: 'url', label: 'URL' }];
      expect(compatibleCatalogParams(params, [], [{ label: 'Send Body', value: 'Off' }])).toEqual(params);
    });

    it('survives a field with no key', () => {
      expect(compatibleCatalogParams(params, [{ label: 'orphan' }]).map((p) => p.key)).toEqual([
        'url',
        'method',
        'authentication',
      ]);
    });
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

  it('renders Text Classifier outputs from category rows and fallback', () => {
    const categories = { categories: [{ category: 'Bug' }, { category: 'Feature' }] };
    expect(resolveNodePorts(NODE_CATALOG['text-classifier'], { categories }).outputs.map((port) => port.label)).toEqual(['Bug', 'Feature']);
    expect(resolveNodePorts(NODE_CATALOG['text-classifier'], {
      categories,
      options: { fallback: 'other' },
    }).outputs.map((port) => port.label)).toEqual(['Bug', 'Feature', 'Other']);
    expect(resolveNodePorts(NODE_CATALOG['text-classifier'], {}).outputs).toEqual([]);
  });

  it('renders Sentiment Analysis outputs from comma-separated labels', () => {
    expect(resolveNodePorts(NODE_CATALOG['sentiment-analysis'], {}).outputs.map((port) => port.label)).toEqual(['Positive', 'Neutral', 'Negative']);
    expect(resolveNodePorts(NODE_CATALOG['sentiment-analysis'], {
      options: { categories: ' Happy, Sad, ' },
    }).outputs.map((port) => port.label)).toEqual(['Happy', 'Sad', '']);
  });

  it('renders LangChain Code ports from configured connection rows', () => {
    const ports = resolveNodePorts(NODE_CATALOG['langchain-code'], {
      inputs: { input: [
        { inputType: 'main', maxConnections: -1, maxConnectionsRequired: false },
        { inputType: 'ai_languageModel', maxConnections: 2, maxConnectionsRequired: true },
      ] },
      outputs: { output: [{ outputType: 'ai_tool' }, { outputType: 'main' }] },
    });
    expect(ports.inputs).toEqual([
      { type: 'main', label: '', displayName: '', required: false },
      { type: 'ai_languageModel', label: 'Language Model', displayName: 'Language Model', required: true, maxConnections: 2 },
    ]);
    expect(ports.outputs.map(({ type, label }) => ({ type, label }))).toEqual([
      { type: 'ai_tool', label: 'Tool' },
      { type: 'main', label: '' },
    ]);
  });

  it('renders Summarization Chain connector variants', () => {
    expect(resolveNodePorts(NODE_CATALOG['summarization-chain'], {}).inputs.map((port) => port.type)).toEqual(['main', 'ai_languageModel']);
    expect(resolveNodePorts(NODE_CATALOG['summarization-chain'], { operationMode: 'documentLoader' }).inputs.map((port) => port.type)).toEqual(['main', 'ai_languageModel', 'ai_document']);
    expect(resolveNodePorts(NODE_CATALOG['summarization-chain'], {
      operationMode: 'nodeInputJson',
      chunkingMode: 'advanced',
    }).inputs.map((port) => port.type)).toEqual(['main', 'ai_languageModel', 'ai_textSplitter']);
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
