// Editor-only descriptor for @n8n/n8n-nodes-langchain MultiQuery Retriever v1.
// Expressions, retrieval, model calls, logging, and execution stay inert.

const modelInput = {
  type: 'ai_languageModel',
  connector: 'ai_languageModel',
  label: 'Model',
  displayName: 'Model',
  maxConnections: 1,
  required: true,
};

const retrieverInput = {
  type: 'ai_retriever',
  connector: 'ai_retriever',
  label: 'Retriever',
  displayName: 'Retriever',
  maxConnections: 1,
  required: true,
};

const retrieverOutput = {
  type: 'ai_retriever',
  connector: 'ai_retriever',
  label: 'Retriever',
  displayName: 'Retriever',
  maxConnections: 1,
};

const multiQueryRetriever = {
  type: 'multi-query-retriever',
  n8nType: '@n8n/n8n-nodes-langchain.retrieverMultiQuery',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  sourceVersionDeclaration: 1,
  label: 'MultiQuery Retriever',
  defaultName: 'MultiQuery Retriever',
  subtitle: '',
  description:
    'Automates prompt tuning, generates diverse queries and expands document pool for enhanced retrieval.',
  details:
    'Configure how many query variants a connected model would generate for a connected retriever. This catalog entry never reads a model or retriever, generates queries, or retrieves documents.',
  clusterRole: 'sub',
  category: 'core',
  libraryCategory: 'ai',
  categories: ['AI'],
  subcategory: 'Retrievers',
  subcategories: ['Retrievers'],
  codexSubcategories: { AI: ['Retrievers'] },
  group: ['transform'],
  inputs: [modelInput, retrieverInput],
  outputs: [retrieverOutput],
  outputNames: ['Retriever'],
  portVariants: [
    {
      showWhen: {},
      inputs: [modelInput, retrieverInput],
      outputs: [retrieverOutput],
    },
  ],
  dynamicInputMetadata: {
    enabled: false,
    declarativeOnly: true,
    inputs: [modelInput, retrieverInput],
  },
  dynamicOutputMetadata: {
    enabled: false,
    declarativeOnly: true,
    outputs: [retrieverOutput],
  },
  aiConnectorPorts: [
    { id: 'model', direction: 'input', ...modelInput },
    { id: 'baseRetriever', direction: 'input', ...retrieverInput },
    { id: 'retriever', direction: 'output', ...retrieverOutput },
  ],
  builderHint: {
    inputs: {
      ai_languageModel: { required: true },
      ai_retriever: { required: true },
    },
  },
  usableAsTool: false,
  icon: '/node-icons/multi-query-retriever.svg',
  n8nIcon: 'node:multiquery-retriever',
  iconMode: 'currentColor',
  iconColor: 'black',
  iconHex: '#000000',
  iconAssetType: 'svg',
  iconAssetSize: { width: 24, height: 24, viewBox: '0 0 24 24' },
  iconAssetSha256: 'c8f00420feff29c4c8bb0006cbec1914866989cf8682ac1c91a49f0b40025487',
  aliases: [],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.retrievermultiquery/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/retrievers/RetrieverMultiQuery/RetrieverMultiQuery.node.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/multiquery-retriever.svg',
    iconRegistrationPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/node-icons.ts',
    iconNamePath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/node-icon-names.ts',
    defaultVersionResolution:
      'The source declares the scalar version 1 and has no separate version wrapper or defaultVersion property.',
    versionWrapperAudit: {
      present: false,
      implementation: 'Single INodeType description on RetrieverMultiQuery',
    },
    activeImportedFieldCollections: [],
    helperGeneratedFields: [],
    directDescriptionImports: [],
    directPortImports: [
      {
        module: 'n8n-workflow',
        names: ['NodeConnectionTypes'],
        contributions: [
          'required capped AI Language Model input',
          'required capped AI Retriever input',
          'capped AI Retriever output',
        ],
      },
    ],
    runtimeImportsExcluded: [
      {
        module: '@langchain/core/language_models/base',
        names: ['BaseLanguageModel'],
        typeOnly: true,
      },
      {
        module: '@langchain/core/retrievers',
        names: ['BaseRetriever'],
        typeOnly: true,
      },
      {
        module: '@langchain/classic/retrievers/multi_query',
        names: ['MultiQueryRetriever'],
      },
      { module: '@n8n/ai-utilities', names: ['logWrapper'] },
    ],
    runtimeMethodsExcluded: ['supplyData', 'getInputConnectionData', 'MultiQueryRetriever.fromLLM'],
    plannedFieldAudit: {
      parserKey: {
        liveDescriptorPresent: false,
        evidence: 'The source contains only a TODO to add parserKey support.',
      },
    },
  },
  defaults: { name: 'MultiQuery Retriever' },
  credentials: [],
  credentialRequirements: [],
  credentialUiMetadata: [],
  methods: {},
  params: [
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
      description: 'Additional options to add',
      fields: [
        {
          key: 'queryCount',
          n8nKey: 'options.queryCount',
          sourceN8nKey: 'queryCount',
          label: 'Query Count',
          kind: 'number',
          sourceKind: 'number:min=1',
          value: 3,
          sourceDefault: 3,
          required: false,
          min: 1,
          minValue: 1,
          typeOptions: { minValue: 1 },
          expressionAllowed: true,
          description: 'Number of different versions of the given question to generate',
          simulationNote:
            'The query count and expression syntax are stored without evaluation, validation, or query generation.',
        },
      ],
      simulationNote:
        'Retriever options are authoring metadata only and never instantiate or configure a retriever.',
    },
  ],
  authoringParity: {
    currentVersion: 1,
    resourceCount: 0,
    operationCount: 0,
    topLevelFieldCount: 1,
    recursiveFieldCount: 2,
    sourceVisibleFieldCount: 2,
    credentialSelectorCount: 0,
    credentialEditorFieldCount: 0,
    totalAuthoringFieldCount: 2,
    dynamicFieldCount: 0,
    helperGeneratedFieldCount: 0,
    inlineCurrentFieldCount: 2,
    currentFieldKeys: ['options', 'options.queryCount'],
    collectionOptionFields: ['queryCount'],
  },
  portParity: {
    inputCount: 2,
    outputCount: 1,
    inputs: ['Model', 'Retriever'],
    outputs: ['Retriever'],
    inputConnectionTypes: ['ai_languageModel', 'ai_retriever'],
    outputConnectionTypes: ['ai_retriever'],
    requiredInputs: ['ai_languageModel', 'ai_retriever'],
    inputCaps: [
      { type: 'ai_languageModel', maxConnections: 1 },
      { type: 'ai_retriever', maxConnections: 1 },
    ],
    outputCaps: [{ type: 'ai_retriever', maxConnections: 1 }],
    outputRequired: false,
  },
  dynamicAuthoringMetadata: {
    loadOptionsMethods: [],
    listSearchMethods: [],
    credentialSelectors: [],
    lockedFields: [],
    remoteDynamicFields: [],
  },
  excludedVersionConditions: [],
  excludedHistoricalAuthoring: [],
  excludedDormantAuthoring: [],
  rendererNormalizations: [
    {
      n8nKey: 'options',
      sourceType: 'collection',
      normalizedKind: 'collection retaining the live Query Count option',
    },
    {
      n8nKey: 'options.queryCount',
      sourceBehavior: 'typeOptions.minValue=1',
      normalizedBehavior: 'number retaining minValue and typeOptions metadata',
    },
  ],
  platformGaps: [
    'Connected language-model and retriever ports remain declarative; no connection data is read.',
    'Query Count and expression syntax are stored without evaluation or minimum-value validation.',
    'No prompts or query variants are generated, no retriever is constructed, and no documents are retrieved or deduplicated.',
    'Debug logging and response wrapping never run.',
  ],
  unsupportedVisibleTypes: [],
  simulation: {
    configurationOnly: true,
    credentialCreation: false,
    credentialAccess: false,
    credentialTesting: false,
    authentication: false,
    dynamicLookups: false,
    expressionResolution: false,
    inputConnectionAccess: false,
    languageModelAccess: false,
    baseRetrieverAccess: false,
    queryCountValidation: false,
    promptGeneration: false,
    queryGeneration: false,
    retrieverCreation: false,
    retrieverInvocation: false,
    documentRetrieval: false,
    documentDeduplication: false,
    debugLogging: false,
    logWrapping: false,
    workflowExecution: false,
    supplyData: false,
    networkAccess: false,
    apiCalls: false,
    webhooks: false,
    polling: false,
    voice: false,
  },
  output: {},
};

export default multiQueryRetriever;
