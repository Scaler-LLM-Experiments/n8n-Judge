// Editor-only descriptor for @n8n/n8n-nodes-langchain Summarization Chain v2.1.
// Documents, models, prompts, expressions, batching, delays, and execution stay inert.

const DEFAULT_PROMPT_TEMPLATE = `Write a concise summary of the following:


"{text}"


CONCISE SUMMARY:`;

const REFINE_PROMPT_TEMPLATE = `Your job is to produce a final summary
We have provided an existing summary up to a certain point: "{existing_answer}"
We have the opportunity to refine the existing summary
(only if needed) with some more context below.
------------
"{text}"
------------

Given the new context, refine the original summary
If the context isn't useful, return the original summary.

REFINED SUMMARY:`;

const mainInput = { type: 'main', label: '', displayName: '' };
const modelInput = {
  type: 'ai_languageModel',
  connector: 'ai_languageModel',
  label: 'Model',
  displayName: 'Model',
  maxConnections: 1,
  required: true,
};
const documentInput = {
  type: 'ai_document',
  connector: 'ai_document',
  label: 'Document',
  displayName: 'Document',
  maxConnections: 1,
  required: true,
};
const textSplitterInput = {
  type: 'ai_textSplitter',
  connector: 'ai_textSplitter',
  label: 'Text Splitter',
  displayName: 'Text Splitter',
  maxConnections: 1,
  required: false,
};

const operationModeOptions = [
  {
    label: 'Use Node Input (JSON)',
    value: 'nodeInputJson',
    description: 'Summarize the JSON data coming into this node from the previous one',
  },
  {
    label: 'Use Node Input (Binary)',
    value: 'nodeInputBinary',
    description: 'Summarize the binary data coming into this node from the previous one',
  },
  {
    label: 'Use Document Loader',
    value: 'documentLoader',
    description: 'Use a loader sub-node with more configuration options',
  },
];

const summarizationMethodOptions = [
  {
    label: 'Map Reduce (Recommended)',
    value: 'map_reduce',
    description:
      'Summarize each document (or chunk) individually, then summarize those summaries',
  },
  {
    label: 'Refine',
    value: 'refine',
    description:
      'Summarize the first document (or chunk). Then update that summary based on the next document (or chunk), and repeat.',
  },
  {
    label: 'Stuff',
    value: 'stuff',
    description: 'Pass all documents (or chunks) at once. Ideal for small datasets.',
  },
];

const summarizationChain = {
  type: 'summarization-chain',
  n8nType: '@n8n/n8n-nodes-langchain.chainSummarization',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 2.1,
  defaultVersion: 2.1,
  versionHistory: [1, 2, 2.1],
  currentVersionClassVersions: [2, 2.1],
  label: 'Summarization Chain',
  defaultName: 'Summarization Chain',
  subtitle: '',
  description: 'Transforms text into a concise summary',
  details:
    'Configure JSON, binary, or document-loader input; chunking; summarization prompts; and batch settings. This catalog entry never loads documents, calls a model, or produces a summary.',
  category: 'core',
  libraryCategory: 'ai',
  categories: ['AI'],
  subcategory: 'Chains',
  subcategories: ['Chains', 'Root Nodes'],
  group: ['transform'],
  inputs: [mainInput, modelInput],
  outputs: [{ type: 'main' }],
  portVariants: [
    {
      showWhen: { operationMode: ['documentLoader'] },
      inputs: [mainInput, modelInput, documentInput],
      outputs: [{ type: 'main' }],
    },
    {
      showWhen: {
        operationMode: ['nodeInputJson', 'nodeInputBinary'],
        chunkingMode: ['advanced'],
      },
      inputs: [mainInput, modelInput, textSplitterInput],
      outputs: [{ type: 'main' }],
    },
  ],
  inputsExpression:
    '={{ ((parameter) => { ${getInputs.toString()}; return getInputs(parameter) })($parameter) }}',
  dynamicPorts: true,
  dynamicInputMetadata: {
    enabled: true,
    declarativeOnly: true,
    sourceMethod: 'getInputs',
    parameterDependencies: ['operationMode', 'chunkingMode'],
    defaults: { operationMode: 'nodeInputJson', chunkingMode: 'simple' },
    baseInputs: ['main', 'Model'],
    documentLoaderBehavior: {
      condition: { operationMode: ['documentLoader'] },
      appendedInput: 'Document',
      returnsBeforeChunkingCheck: true,
    },
    advancedChunkingBehavior: {
      condition: {
        operationMode: ['nodeInputJson', 'nodeInputBinary'],
        chunkingMode: ['advanced'],
      },
      appendedInput: 'Text Splitter',
    },
    maxConnections: {
      ai_languageModel: 1,
      ai_document: 1,
      ai_textSplitter: 1,
    },
  },
  aiConnectorPorts: [
    modelInput,
    { ...documentInput, showWhen: { operationMode: ['documentLoader'] } },
    {
      ...textSplitterInput,
      showWhen: {
        operationMode: ['nodeInputJson', 'nodeInputBinary'],
        chunkingMode: ['advanced'],
      },
    },
  ],
  builderHint: {
    inputs: {
      ai_languageModel: { required: true },
      ai_document: {
        required: true,
        displayOptions: { show: { operationMode: ['documentLoader'] } },
      },
      ai_textSplitter: {
        required: false,
        displayOptions: { show: { chunkingMode: ['advanced'] } },
      },
    },
  },
  credentials: [],
  usableAsTool: false,
  icon: '/node-icons/summarization-chain.svg',
  n8nIcon: 'node:summarization-chain',
  iconColor: 'black',
  iconHex: '#000000',
  iconMode: 'currentColor',
  iconAssetType: 'svg',
  iconAssetSize: { width: 24, height: 24, viewBox: '0 0 24 24' },
  iconAssetSha256: 'cf6f772be3fd64125492c43bddbad0e157472605d198ea9e1069939e916282c2',
  aliases: ['LangChain'],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainsummarization/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainSummarization/ChainSummarization.node.ts',
    currentVersionPath:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainSummarization/V2/ChainSummarizationV2.node.ts',
    legacyVersionPath:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainSummarization/V1/ChainSummarizationV1.node.ts',
    promptPath:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainSummarization/prompt.ts',
    helperPath:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainSummarization/helpers.ts',
    processItemPath:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainSummarization/V2/processItem.ts',
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    outputSchemaPath:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainSummarization/__schema__/v2.1.0/output.json',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/summarization-chain.svg',
    directDescriptionImports: [
      {
        module: '@n8n/ai-utilities',
        names: ['getBatchingOptionFields', 'getTemplateNoticeField'],
      },
      {
        module: '../prompt',
        names: ['REFINE_PROMPT_TEMPLATE', 'DEFAULT_PROMPT_TEMPLATE'],
      },
    ],
    runtimeImportsExcluded: [
      { module: '@n8n/utils/sleep', names: ['sleep'] },
      { module: './processItem', names: ['processItem'] },
    ],
  },
  defaults: { name: 'Summarization Chain', color: '#909298' },
  params: [
    {
      key: 'templateNotice',
      n8nKey: 'notice',
      sourceN8nKey: 'notice',
      label:
        'Save time with an <a href="/templates/1951" target="_blank">example</a> of how this node works',
      kind: 'notice',
      sourceKind: 'notice',
      value: '',
      required: false,
      templateId: 1951,
      templatePath: '/templates/1951',
    },
    {
      key: 'operationMode',
      n8nKey: 'operationMode',
      sourceN8nKey: 'operationMode',
      label: 'Data to Summarize',
      kind: 'select',
      sourceKind: 'options',
      value: 'nodeInputJson',
      required: false,
      noDataExpression: true,
      description: 'How to pass data into the summarization chain',
      options: operationModeOptions,
    },
    {
      key: 'chunkingMode',
      n8nKey: 'chunkingMode',
      sourceN8nKey: 'chunkingMode',
      label: 'Chunking Strategy',
      kind: 'select',
      sourceKind: 'options',
      value: 'simple',
      required: false,
      noDataExpression: true,
      description: 'Chunk splitting strategy',
      options: [
        { label: 'Simple (Define Below)', value: 'simple' },
        {
          label: 'Advanced',
          value: 'advanced',
          description: 'Use a splitter sub-node with more configuration options',
        },
      ],
      showWhen: { operationMode: ['nodeInputJson', 'nodeInputBinary'] },
      n8nShowWhen: { '/operationMode': ['nodeInputJson', 'nodeInputBinary'] },
    },
    {
      key: 'chunkSize',
      n8nKey: 'chunkSize',
      sourceN8nKey: 'chunkSize',
      label: 'Characters Per Chunk',
      kind: 'number',
      sourceKind: 'number',
      value: 1000,
      required: false,
      description:
        'Controls the max size (in terms of number of characters) of the final document chunk',
      showWhen: { chunkingMode: ['simple'] },
      n8nShowWhen: { '/chunkingMode': ['simple'] },
    },
    {
      key: 'chunkOverlap',
      n8nKey: 'chunkOverlap',
      sourceN8nKey: 'chunkOverlap',
      label: 'Chunk Overlap (Characters)',
      kind: 'number',
      sourceKind: 'number',
      value: 200,
      required: false,
      description: 'Specifies how much characters overlap there should be between chunks',
      showWhen: { chunkingMode: ['simple'] },
      n8nShowWhen: { '/chunkingMode': ['simple'] },
    },
    {
      key: 'options',
      n8nKey: 'options',
      sourceN8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      sourceKind: 'collection',
      value: {},
      sourceDefault: {},
      required: false,
      addLabel: 'Add Option',
      placeholder: 'Add Option',
      fields: [
        {
          key: 'binaryDataKey',
          n8nKey: 'options.binaryDataKey',
          sourceN8nKey: 'binaryDataKey',
          label: 'Input Data Field Name',
          kind: 'text',
          sourceKind: 'string',
          value: 'data',
          required: false,
          description:
            'The name of the field in the agent or chain’s input that contains the binary file to be processed',
          showWhen: { operationMode: ['nodeInputBinary'] },
          n8nShowWhen: { '/operationMode': ['nodeInputBinary'] },
          simulationNote: 'The field name is stored only; binary input is never read.',
        },
        {
          key: 'summarizationMethodAndPrompts',
          n8nKey: 'options.summarizationMethodAndPrompts',
          sourceN8nKey: 'summarizationMethodAndPrompts',
          label: 'Summarization Method and Prompts',
          kind: 'fixedCollection',
          sourceKind: 'fixedCollection',
          value: {
            values: {
              summarizationMethod: 'map_reduce',
              prompt: DEFAULT_PROMPT_TEMPLATE,
              combineMapPrompt: DEFAULT_PROMPT_TEMPLATE,
            },
          },
          sourceDefault: {
            values: {
              summarizationMethod: 'map_reduce',
              prompt: DEFAULT_PROMPT_TEMPLATE,
              combineMapPrompt: DEFAULT_PROMPT_TEMPLATE,
            },
          },
          required: false,
          addLabel: 'Add Option',
          placeholder: 'Add Option',
          collectionKey: 'values',
          collectionLabel: 'Values',
          multiple: false,
          fields: [
            {
              key: 'summarizationMethod',
              n8nKey: 'options.summarizationMethodAndPrompts.values.summarizationMethod',
              sourceN8nKey: 'summarizationMethod',
              label: 'Summarization Method',
              kind: 'select',
              sourceKind: 'options',
              value: 'map_reduce',
              required: false,
              description: 'The type of summarization to run',
              options: summarizationMethodOptions,
            },
            {
              key: 'individualSummaryPrompt',
              n8nKey: 'options.summarizationMethodAndPrompts.values.combineMapPrompt',
              sourceN8nKey: 'combineMapPrompt',
              label: 'Individual Summary Prompt',
              kind: 'textarea',
              sourceKind: 'string:rows=9',
              value: DEFAULT_PROMPT_TEMPLATE,
              required: false,
              rows: 9,
              hint: 'The prompt to summarize an individual document (or chunk)',
              showWhen: { summarizationMethod: ['map_reduce'] },
              n8nHideWhen: {
                '/options.summarizationMethodAndPrompts.values.summarizationMethod': [
                  'stuff',
                  'refine',
                ],
              },
              expressionAllowed: true,
              simulationNote: 'The prompt is stored only and is never evaluated or sent.',
            },
            {
              key: 'finalCombinePrompt',
              n8nKey: 'options.summarizationMethodAndPrompts.values.prompt',
              sourceN8nKey: 'prompt',
              label: 'Final Prompt to Combine',
              kind: 'textarea',
              sourceKind: 'string:rows=9',
              value: DEFAULT_PROMPT_TEMPLATE,
              required: false,
              rows: 9,
              hint: 'The prompt to combine individual summaries',
              showWhen: { summarizationMethod: ['map_reduce'] },
              n8nHideWhen: {
                '/options.summarizationMethodAndPrompts.values.summarizationMethod': [
                  'stuff',
                  'refine',
                ],
              },
              expressionAllowed: true,
              simulationNote: 'The prompt is stored only and is never evaluated or sent.',
            },
            {
              key: 'stuffPrompt',
              n8nKey: 'options.summarizationMethodAndPrompts.values.prompt',
              sourceN8nKey: 'prompt',
              label: 'Prompt',
              kind: 'textarea',
              sourceKind: 'string:rows=9',
              value: DEFAULT_PROMPT_TEMPLATE,
              required: false,
              rows: 9,
              showWhen: { summarizationMethod: ['stuff'] },
              n8nHideWhen: {
                '/options.summarizationMethodAndPrompts.values.summarizationMethod': [
                  'refine',
                  'map_reduce',
                ],
              },
              expressionAllowed: true,
              simulationNote: 'The prompt is stored only and is never evaluated or sent.',
            },
            {
              key: 'refinePrompt',
              n8nKey: 'options.summarizationMethodAndPrompts.values.refinePrompt',
              sourceN8nKey: 'refinePrompt',
              label: 'Subsequent (Refine) Prompt',
              kind: 'textarea',
              sourceKind: 'string:rows=9',
              value: REFINE_PROMPT_TEMPLATE,
              required: false,
              rows: 9,
              hint: 'The prompt to refine the summary based on the next document (or chunk)',
              showWhen: { summarizationMethod: ['refine'] },
              n8nHideWhen: {
                '/options.summarizationMethodAndPrompts.values.summarizationMethod': [
                  'stuff',
                  'map_reduce',
                ],
              },
              expressionAllowed: true,
              simulationNote: 'The prompt is stored only and is never evaluated or sent.',
            },
            {
              key: 'refineQuestionPrompt',
              n8nKey: 'options.summarizationMethodAndPrompts.values.refineQuestionPrompt',
              sourceN8nKey: 'refineQuestionPrompt',
              label: 'Initial Prompt',
              kind: 'textarea',
              sourceKind: 'string:rows=9',
              value: DEFAULT_PROMPT_TEMPLATE,
              required: false,
              rows: 9,
              hint: 'The prompt for the first document (or chunk)',
              showWhen: { summarizationMethod: ['refine'] },
              n8nHideWhen: {
                '/options.summarizationMethodAndPrompts.values.summarizationMethod': [
                  'stuff',
                  'map_reduce',
                ],
              },
              expressionAllowed: true,
              simulationNote: 'The prompt is stored only and is never evaluated or sent.',
            },
          ],
          simulationNote:
            'Method and prompt configuration is retained without constructing or invoking a chain.',
        },
        {
          key: 'batching',
          n8nKey: 'options.batching',
          sourceN8nKey: 'batching',
          label: 'Batch Processing',
          kind: 'collection',
          sourceKind: 'collection',
          value: {},
          sourceDefault: {},
          required: false,
          addLabel: 'Add Batch Processing Option',
          placeholder: 'Add Batch Processing Option',
          description: 'Batch processing options for rate limiting',
          sourceVersionCondition: '@version >= 2.1',
          sourceDisplayOptions: { show: { '@version': [{ _cnd: { gte: 2.1 } }] } },
          fields: [
            {
              key: 'batchSize',
              n8nKey: 'options.batching.batchSize',
              sourceN8nKey: 'batchSize',
              label: 'Batch Size',
              kind: 'number',
              sourceKind: 'number',
              value: 5,
              required: false,
              description:
                'How many items to process in parallel. This is useful for rate limiting, but might impact the log output ordering.',
            },
            {
              key: 'delayBetweenBatches',
              n8nKey: 'options.batching.delayBetweenBatches',
              sourceN8nKey: 'delayBetweenBatches',
              label: 'Delay Between Batches',
              kind: 'number',
              sourceKind: 'number',
              value: 0,
              required: false,
              unit: 'milliseconds',
              description: 'Delay in milliseconds between batches. This is useful for rate limiting.',
            },
          ],
          simulationNote:
            'Batch settings are stored only; items are never grouped, processed, or delayed.',
        },
      ],
    },
  ],
  authoringParity: {
    currentVersion: 2.1,
    resourceCount: 0,
    operationCount: 0,
    recursiveFieldCount: 17,
    expectedTopLevelN8nKeys: [
      'notice',
      'operationMode',
      'chunkingMode',
      'chunkSize',
      'chunkOverlap',
      'options',
    ],
    representedTopLevelN8nKeys: [
      'notice',
      'operationMode',
      'chunkingMode',
      'chunkSize',
      'chunkOverlap',
      'options',
    ],
    operationModeValues: ['nodeInputJson', 'nodeInputBinary', 'documentLoader'],
    operationModeDefault: 'nodeInputJson',
    chunkingModeValues: ['simple', 'advanced'],
    chunkingModeDefault: 'simple',
    summarizationMethodValues: ['map_reduce', 'refine', 'stuff'],
    summarizationMethodDefault: 'map_reduce',
    promptFieldCount: 5,
    options: ['binaryDataKey', 'summarizationMethodAndPrompts', 'batching'],
    dynamicInputShapeCount: 3,
  },
  outputSchema: {
    type: 'object',
    required: ['output'],
    properties: {
      output: {
        type: 'object',
        required: ['output_text'],
        properties: {
          output_text: {
            type: 'string',
            description: 'The summary text',
          },
        },
      },
    },
    version: 1,
    declarativeOnly: true,
  },
  dynamicAuthoringMetadata: {
    loadOptionsMethods: [],
    resourceLocatorMethods: [],
    resourceMapperMethods: [],
    credentialSelectors: [],
    lockedFields: [],
    hasDynamicFields: false,
  },
  historicalExclusions: [
    {
      versions: [1],
      sourcePath:
        'packages/@n8n/nodes-langchain/nodes/chains/ChainSummarization/V1/ChainSummarizationV1.node.ts',
      fields: ['type', 'options.combineMapPrompt', 'options.prompt'],
      reason:
        'The v1 document-loader-only port shape and top-level Type/options prompt layout are replaced by the v2.1 input, chunking, and nested prompt surface.',
    },
    {
      versions: [2],
      field: 'options.batching',
      reason: 'Batch Processing is gated to v2.1 and is included only because v2.1 is current.',
    },
  ],
  rendererNormalizations: [
    {
      sourceType: 'string:rows=9',
      normalizedKind: 'textarea',
      keys: [
        'individualSummaryPrompt',
        'finalCombinePrompt',
        'stuffPrompt',
        'refinePrompt',
        'refineQuestionPrompt',
      ],
      reason: 'The catalog represents nine-row n8n string inputs with its textarea kind.',
    },
    {
      sourceNames: ['prompt'],
      normalizedKeys: ['finalCombinePrompt', 'stuffPrompt'],
      reason:
        'The two conditionally exclusive native prompt declarations use unique catalog keys while n8nKey preserves their shared persisted name.',
    },
    {
      sourceType: 'fixedCollection with one Values group',
      normalizedKind: 'fixedCollection',
      key: 'summarizationMethodAndPrompts',
      reason:
        'The Values wrapper is flattened into fields while collectionKey, collectionLabel, and defaults preserve the native structure.',
    },
    {
      sourceBehavior: 'displayOptions.hide using an absolute nested parameter path',
      normalizedBehavior:
        'Positive local showWhen conditions drive the simulator; n8nHideWhen retains the exact source conditions.',
    },
    {
      sourceBehavior: '@version >= 2.1 display condition on batching',
      normalizedBehavior:
        'Resolved into the current pane and retained as sourceVersionCondition metadata.',
    },
  ],
  unsupportedVisibleTypes: [
    {
      n8nKeys: [
        'options.summarizationMethodAndPrompts.values.combineMapPrompt',
        'options.summarizationMethodAndPrompts.values.prompt',
        'options.summarizationMethodAndPrompts.values.refinePrompt',
        'options.summarizationMethodAndPrompts.values.refineQuestionPrompt',
      ],
      sourceType: 'string with rows=9',
      normalizedKind: 'textarea',
    },
  ],
  platformGaps: [
    'The template notice and HTML descriptions are inert text; they do not navigate or create nodes.',
    'Dynamic connector shapes are represented declaratively and cannot validate or invoke connected sub-nodes.',
    'Prompts and expressions are retained as text and are never evaluated or sent to a language model.',
    'Binary and JSON input names are authoring metadata only; the simulation never reads input items.',
    'Batch settings never group work or sleep, and output schema metadata never produces output.',
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    dynamicLookups: false,
    schemaLoading: false,
    expressionResolution: false,
    inputReads: false,
    binaryReads: false,
    documentLoading: false,
    textSplitting: false,
    promptEvaluation: false,
    modelAccess: false,
    modelCalls: false,
    chainConstruction: false,
    summarization: false,
    batchProcessing: false,
    delays: false,
    sleeps: false,
    execution: false,
    networkAccess: false,
    apiCalls: false,
    webhooks: false,
    polling: false,
    voice: false,
  },
  output: {},
};

export default summarizationChain;
