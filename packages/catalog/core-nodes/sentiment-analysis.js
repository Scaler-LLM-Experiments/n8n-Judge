// Editor-only descriptor for @n8n/n8n-nodes-langchain Sentiment Analysis v1.1.
// Expressions, model calls, parsing, routing, batching, delays, and execution stay inert.

const DEFAULT_CATEGORIES = 'Positive, Neutral, Negative';
const DEFAULT_SYSTEM_PROMPT_TEMPLATE =
  'You are highly intelligent and accurate sentiment analyzer. Analyze the sentiment of the provided text. Categorize it into one of the following: {categories}. Use the provided formatting instructions. Only output the JSON.';

const mainInput = { type: 'main', label: '', displayName: '' };
const modelInput = {
  type: 'ai_languageModel',
  connector: 'ai_languageModel',
  label: 'Model',
  displayName: 'Model',
  maxConnections: 1,
  required: true,
};

const sentimentAnalysis = {
  type: 'sentiment-analysis',
  n8nType: '@n8n/n8n-nodes-langchain.sentimentAnalysis',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1.1,
  defaultVersion: 1.1,
  versionHistory: [1, 1.1],
  label: 'Sentiment Analysis',
  defaultName: 'Sentiment Analysis',
  subtitle: '',
  description: 'Analyze the sentiment of your text',
  details:
    'Author text, sentiment categories, prompt behavior, detailed-result preferences, and batching, with one output per comma-separated category. This entry never analyzes or routes text.',
  // Cluster node: the editor resolves the Chat Model port and the picker group from
  // this. See the authoring skill, "adding a catalog type".
  category: 'ai',
  needsModel: true,
  libraryCategory: 'ai',
  categories: ['AI'],
  subcategory: 'Chains',
  subcategories: ['Chains', 'Root Nodes'],
  group: ['transform'],
  inputs: [mainInput, modelInput],
  outputs: [
    { type: 'main', label: 'Positive', displayName: 'Positive', index: 0 },
    { type: 'main', label: 'Neutral', displayName: 'Neutral', index: 1 },
    { type: 'main', label: 'Negative', displayName: 'Negative', index: 2 },
  ],
  outputsExpression:
    '={{(${configuredOutputs})($parameter, "Positive, Neutral, Negative")}}',
  dynamicOutputs: {
    enabled: true,
    declarativeOnly: true,
    strategy: 'comma-separated-labels',
    sourceMethod: 'configuredOutputs',
    sourceExpression:
      '={{(${configuredOutputs})($parameter, "Positive, Neutral, Negative")}}',
    parameterPath: 'options.categories',
    defaultValue: DEFAULT_CATEGORIES,
    delimiter: ',',
    trimLabels: true,
    filterEmptyLabels: false,
    preserveOrder: true,
    preserveDuplicates: true,
    outputType: 'main',
    exactSourceBehavior:
      'Reads options.categories or the default string, splits on every comma, trims each result, and creates one main output per result without filtering blank or duplicate labels.',
  },
  portMetadata: {
    inputs: [mainInput, modelInput],
    outputsFrom: 'options.categories',
    defaultOutputLabels: ['Positive', 'Neutral', 'Negative'],
    outputLabelTransform: ['split on comma', 'trim each label'],
  },
  builderHint: {
    inputs: {
      ai_languageModel: { required: true },
    },
  },
  credentials: [],
  usableAsTool: false,
  icon: '/node-icons/sentiment-analysis.svg',
  n8nIcon: 'node:sentiment-analysis',
  iconColor: 'black',
  iconHex: '#000000',
  iconMode: 'currentColor',
  iconAssetType: 'svg',
  iconAssetSize: { width: 24, height: 24, viewBox: '0 0 24 24' },
  iconAssetSha256: '0024b8f9a2233adced37ba912599ca106d0b643ce7ea8134cc25d390a0e1da50',
  aliases: [],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.sentimentanalysis/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/chains/SentimentAnalysis/SentimentAnalysis.node.ts',
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    parserInputPath: 'packages/@n8n/nodes-langchain/utils/output_parsers/parserInput.ts',
    tracingPath: 'packages/@n8n/nodes-langchain/utils/tracing.ts',
    outputSchemaPath:
      'packages/@n8n/nodes-langchain/nodes/chains/SentimentAnalysis/__schema__/v1.1.0/output.json',
    packagePath: 'packages/@n8n/nodes-langchain/package.json',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/sentiment-analysis.svg',
    directDescriptionImports: [
      {
        module: '@n8n/ai-utilities',
        names: ['getBatchingOptionFields'],
      },
    ],
    authoringValueDeclarations: [
      'DEFAULT_SYSTEM_PROMPT_TEMPLATE',
      'DEFAULT_CATEGORIES',
      'configuredOutputs',
    ],
    runtimeImportsExcluded: [
      {
        module: '@langchain/core/prompts',
        names: ['SystemMessagePromptTemplate', 'ChatPromptTemplate'],
      },
      { module: '@langchain/core/messages', names: ['HumanMessage'] },
      {
        module: '@langchain/classic/output_parsers',
        names: ['OutputFixingParser', 'StructuredOutputParser'],
      },
      { module: '@n8n/utils/sleep', names: ['sleep'] },
      { module: 'n8n-workflow', names: ['NodeOperationError'] },
      { module: 'zod', names: ['z'] },
      { module: '@utils/output_parsers/parserInput', names: ['toParserInputText'] },
      { module: '@utils/tracing', names: ['getTracingConfig'] },
    ],
  },
  defaults: { name: 'Sentiment Analysis' },
  params: [
    {
      key: 'inputText',
      n8nKey: 'inputText',
      sourceN8nKey: 'inputText',
      label: 'Text to Analyze',
      kind: 'textarea',
      sourceKind: 'string:rows=2',
      value: '',
      required: true,
      rows: 2,
      expressionAllowed: true,
      description: 'Use an expression to reference data in previous nodes or enter static text',
      simulationNote: 'Text and expression syntax are stored without being read or evaluated.',
    },
    {
      key: 'detailedResultsNotice',
      n8nKey: 'detailedResultsNotice',
      sourceN8nKey: 'detailedResultsNotice',
      label:
        'Sentiment scores are LLM-generated estimates, not statistically rigorous measurements. They may be inconsistent across runs and should be used as rough indicators only.',
      kind: 'notice',
      sourceKind: 'notice',
      value: '',
      required: false,
      showWhen: { 'options.includeDetailedResults': [true] },
      n8nShowWhen: { '/options.includeDetailedResults': [true] },
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
          key: 'categories',
          n8nKey: 'options.categories',
          sourceN8nKey: 'categories',
          label: 'Sentiment Categories',
          kind: 'textarea',
          sourceKind: 'string:rows=2',
          value: DEFAULT_CATEGORIES,
          required: false,
          rows: 2,
          noDataExpression: true,
          description: 'A comma-separated list of categories to analyze',
          simulationNote:
            'The string only controls represented output labels; no category is validated or analyzed.',
        },
        {
          key: 'systemPromptTemplate',
          n8nKey: 'options.systemPromptTemplate',
          sourceN8nKey: 'systemPromptTemplate',
          label: 'System Prompt Template',
          kind: 'textarea',
          sourceKind: 'string:rows=6',
          value: DEFAULT_SYSTEM_PROMPT_TEMPLATE,
          required: false,
          rows: 6,
          expressionAllowed: true,
          description: 'String to use directly as the system prompt template',
          simulationNote: 'The template is stored only and is never formatted or sent to a model.',
        },
        {
          key: 'includeDetailedResults',
          n8nKey: 'options.includeDetailedResults',
          sourceN8nKey: 'includeDetailedResults',
          label: 'Include Detailed Results',
          kind: 'boolean',
          sourceKind: 'boolean',
          value: false,
          required: false,
          description:
            'Whether to include sentiment strength and confidence scores in the output',
          simulationNote: 'No strength or confidence score is generated.',
        },
        {
          key: 'enableAutoFixing',
          n8nKey: 'options.enableAutoFixing',
          sourceN8nKey: 'enableAutoFixing',
          label: 'Enable Auto-Fixing',
          kind: 'boolean',
          sourceKind: 'boolean',
          value: true,
          required: false,
          description:
            'Whether to enable auto-fixing (may trigger an additional LLM call if output is broken)',
          simulationNote: 'No parser or additional model call is created.',
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
          sourceVersionCondition: '@version >= 1.1',
          sourceDisplayOptions: { show: { '@version': [{ _cnd: { gte: 1.1 } }] } },
          description: 'Batch processing options for rate limiting',
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
    currentVersion: 1.1,
    resourceCount: 0,
    operationCount: 0,
    recursiveFieldCount: 10,
    expectedTopLevelN8nKeys: ['inputText', 'detailedResultsNotice', 'options'],
    representedTopLevelN8nKeys: ['inputText', 'detailedResultsNotice', 'options'],
    optionFields: [
      'categories',
      'systemPromptTemplate',
      'includeDetailedResults',
      'enableAutoFixing',
      'batching',
    ],
    batchingFields: ['batchSize', 'delayBetweenBatches'],
    defaultCategories: ['Positive', 'Neutral', 'Negative'],
  },
  outputParity: {
    categoryPath: 'options.categories',
    defaultCategoryString: DEFAULT_CATEGORIES,
    defaultLabels: ['Positive', 'Neutral', 'Negative'],
    outputType: 'main',
    order: 'comma-separated source order',
    trimWhitespace: true,
    filtersEmptyLabels: false,
    preservesDuplicateLabels: true,
    emptyStringOutputLabels: [''],
    runtimeDifference:
      'Execution filters blank categories before classification, while the authoring configuredOutputs helper does not filter them when creating ports.',
  },
  outputSchema: {
    type: 'object',
    description:
      "The input item's original fields passed through unchanged, plus the added sentimentAnalysis object",
    required: ['sentimentAnalysis'],
    properties: {
      sentimentAnalysis: {
        type: 'object',
        required: ['category'],
        properties: {
          category: {
            type: 'string',
            description: 'The detected sentiment category, e.g. Positive/Neutral/Negative',
          },
          strength: {
            type: 'number',
            description: 'Present only when detailed results are enabled',
          },
          confidence: {
            type: 'number',
            description: 'Present only when detailed results are enabled',
          },
        },
      },
    },
    additionalProperties: true,
    version: 1,
    declarativeOnly: true,
  },
  dynamicAuthoringMetadata: {
    outputLabelsFromCategories: true,
    loadOptionsMethods: [],
    resourceLocatorMethods: [],
    resourceMapperMethods: [],
    credentialSelectors: [],
    lockedFields: [],
    hasRemoteDynamicFields: false,
  },
  historicalExclusions: [
    {
      n8nKey: 'options.batching',
      versions: [1],
      reason: 'Batch Processing was added in v1.1 and only the current v1.1 surface is exposed.',
    },
  ],
  rendererNormalizations: [
    {
      n8nKeys: ['inputText', 'options.categories'],
      sourceType: 'string:rows=2',
      normalizedKind: 'textarea',
      reason: 'The catalog represents two-row n8n string inputs with its textarea kind.',
    },
    {
      n8nKeys: ['options.systemPromptTemplate'],
      sourceType: 'string:rows=6',
      normalizedKind: 'textarea',
      reason: 'The catalog represents six-row n8n string inputs with its textarea kind.',
    },
    {
      sourceBehavior: 'detailed-results notice conditioned on /options.includeDetailedResults',
      normalizedBehavior:
        'The simulator uses the nested showWhen key options.includeDetailedResults and retains the exact n8nShowWhen path.',
    },
    {
      sourceBehavior: 'configuredOutputs function over a comma-separated string',
      normalizedBehavior:
        'Three default output objects are renderable immediately; arbitrary category strings remain declarative dynamicOutputs metadata for the shared resolver.',
    },
    {
      sourceBehavior: '@version >= 1.1 display condition on batching',
      normalizedBehavior:
        'Resolved into the current pane and retained as sourceVersionCondition metadata.',
    },
  ],
  unsupportedVisibleTypes: [
    {
      n8nKeys: ['inputText', 'options.categories'],
      sourceType: 'string with rows=2',
      normalizedKind: 'textarea',
    },
    {
      n8nKey: 'options.systemPromptTemplate',
      sourceType: 'string with rows=6',
      normalizedKind: 'textarea',
    },
  ],
  platformGaps: [
    'Expression syntax and prompt placeholders are stored as inert text and never evaluated.',
    'The required Model port cannot load or invoke a language model.',
    'Detailed scores, auto-fixing, structured parsing, routing, batching, and delays are configuration-only.',
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    dynamicLookups: false,
    expressionResolution: false,
    inputReads: false,
    categoryValidation: false,
    promptFormatting: false,
    modelAccess: false,
    modelCalls: false,
    outputParsing: false,
    autoFixing: false,
    sentimentAnalysis: false,
    scoreGeneration: false,
    itemRouting: false,
    batchProcessing: false,
    delays: false,
    sleeps: false,
    workflowExecution: false,
    networkAccess: false,
    apiCalls: false,
    webhooks: false,
    polling: false,
    voice: false,
  },
  output: {},
};

export default sentimentAnalysis;
