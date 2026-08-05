// Editor-only descriptor for @n8n/n8n-nodes-langchain Embeddings Ollama v1.
// Credentials, remote models, expressions, APIs, embeddings, and execution stay inert.

const embeddingsOutput = {
  type: 'ai_embedding',
  connector: 'ai_embedding',
  label: 'Embeddings',
  displayName: 'Embeddings',
  required: true,
};

const credentialDefinition = {
  type: 'ollamaApi',
  name: 'Ollama',
  required: true,
  documentationSlug: 'ollama',
  sourcePath: 'packages/@n8n/nodes-langchain/credentials/OllamaApi.credentials.ts',
  fields: [
    {
      key: 'baseUrl',
      n8nKey: 'baseUrl',
      label: 'Base URL',
      kind: 'text',
      sourceKind: 'string',
      value: 'http://localhost:11434',
      required: true,
      locked: true,
    },
    {
      key: 'apiKey',
      n8nKey: 'apiKey',
      label: 'API Key',
      kind: 'text',
      sourceKind: 'string',
      value: '',
      required: false,
      password: true,
      locked: true,
      hint:
        'When using Ollama behind a proxy with authentication (such as Open WebUI), provide the Bearer token/API key here. This is not required for the default Ollama installation',
    },
  ],
  authenticate: {
    type: 'generic',
    header: 'Authorization',
    sourceTemplate: '=Bearer {{$credentials.apiKey}}',
    inert: true,
  },
  test: {
    baseURL: '={{ $credentials.baseUrl }}',
    url: '/api/tags',
    method: 'GET',
    inert: true,
  },
  simulationNote:
    'The complete Ollama credential editor and its authentication/test templates are locked metadata and are never resolved or sent.',
};

const embeddingsOllama = {
  type: 'embeddings-ollama',
  n8nType: '@n8n/n8n-nodes-langchain.embeddingsOllama',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'Embeddings Ollama',
  defaultName: 'Embeddings Ollama',
  subtitle: '',
  description: 'Use Ollama Embeddings',
  details:
    'Choose an embedding model discovered from an Ollama server and expose an Embeddings sub-node output. This catalog entry never reads credentials, lists models, or invokes Ollama.',
  clusterRole: 'sub',
  category: 'core',
  libraryCategory: 'ai',
  categories: ['AI'],
  subcategory: 'Embeddings',
  subcategories: ['Embeddings'],
  codexSubcategories: { AI: ['Embeddings'] },
  group: ['transform'],
  inputs: [],
  outputs: [embeddingsOutput],
  outputNames: ['Embeddings'],
  aiConnectorPorts: [embeddingsOutput],
  builderHint: { outputs: { ai_embedding: { required: true } } },
  requestDefaults: {
    ignoreHttpStatusErrors: true,
    baseURL: '={{ $credentials.baseUrl.replace(new RegExp("/$"), "") }}',
    inert: true,
    simulationNote:
      'The credential expression is retained as text and is never evaluated or used for a request.',
  },
  usableAsTool: false,
  icon: '/node-icons/embeddings-ollama.svg',
  n8nIcon: 'file:ollama.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 241.333, height: 341.333, viewBox: '0 0 181 256' },
  iconAssetSha256: '4365d3b95114d501a70b73be0b7c16e424a1279dc174ae37b2c95b652ae41225',
  aliases: [],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.embeddingsollama/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/embeddings/EmbeddingsOllama/EmbeddingsOllama.node.ts',
    sharedDescriptionPath:
      'packages/@n8n/nodes-langchain/nodes/llms/LMOllama/description.ts',
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    credentialPath: credentialDefinition.sourcePath,
    packagePath: 'packages/@n8n/nodes-langchain/package.json',
    iconPath:
      'packages/@n8n/nodes-langchain/nodes/embeddings/EmbeddingsOllama/ollama.svg',
    directDescriptionImports: [
      { module: '@n8n/ai-utilities', names: ['getConnectionHintNoticeField'] },
      {
        module: '../../llms/LMOllama/description',
        names: ['ollamaDescription', 'ollamaModel'],
      },
    ],
    runtimeImportsExcluded: [
      { module: '@langchain/ollama', names: ['OllamaEmbeddings'] },
      { module: '@n8n/ai-utilities', names: ['logWrapper'] },
    ],
  },
  defaults: { name: 'Embeddings Ollama' },
  credentials: [
    {
      name: 'ollamaApi',
      type: 'ollamaApi',
      displayName: 'Ollama',
      required: true,
      locked: true,
      sourcePath: credentialDefinition.sourcePath,
    },
  ],
  credentialRequirements: [
    { type: 'ollamaApi', name: 'Ollama', required: true, locked: true },
  ],
  credentialUiMetadata: [credentialDefinition],
  methods: {
    loadOptions: {
      model: {
        credentialType: 'ollamaApi',
        request: { method: 'GET', url: '/api/tags' },
        response: {
          rootProperty: 'models',
          mapping: {
            label: '={{$responseItem.name}}',
            value: '={{$responseItem.name}}',
          },
          sortBy: 'name',
        },
        inert: true,
      },
    },
  },
  params: [
    {
      key: 'ollamaCredential',
      n8nKey: 'credentials.ollamaApi',
      sourceN8nKey: 'credentials',
      label: 'Credentials',
      kind: 'select',
      sourceKind: 'credentials',
      value: 'ollamaApi',
      required: true,
      locked: true,
      dynamicOptions: { source: 'credentialStore', credentialType: 'ollamaApi', inert: true },
      options: [{ label: 'Ollama', value: 'ollamaApi' }],
      simulationNote:
        'The credential selector is locked. The simulation never creates, reads, tests, or applies Ollama credentials.',
    },
    {
      key: 'vectorStoreConnectionNotice',
      n8nKey: 'notice',
      sourceN8nKey: 'notice',
      label:
        "This node must be connected to a vector store. <a data-action='openSelectiveNodeCreator' data-action-parameter-connectiontype='ai_vectorStore'>Insert one</a>",
      kind: 'notice',
      sourceKind: 'notice',
      value: '',
      required: false,
      containerClass: 'ndv-connection-hint-notice',
      connectionHint: {
        targetConnectionType: 'ai_vectorStore',
        targetLocale: 'Vector Store',
        action: 'openSelectiveNodeCreator',
        inert: true,
      },
    },
    {
      key: 'model',
      n8nKey: 'model',
      sourceN8nKey: 'model',
      label: 'Model',
      kind: 'select',
      sourceKind: 'options:loadOptions',
      value: 'llama3.2',
      required: true,
      locked: true,
      dynamic: true,
      options: [],
      description:
        'The model which will generate the completion. To download models, visit <a href="https://ollama.ai/library">Ollama Models Library</a>.',
      dynamicOptions: {
        credentialType: 'ollamaApi',
        request: { method: 'GET', url: '/api/tags' },
        responseRoot: 'models',
        mapLabel: 'name',
        mapValue: 'name',
        sortBy: 'name',
        inert: true,
      },
      routing: { send: { type: 'body', property: 'model', inert: true } },
      simulationNote:
        'Remote model options are locked and empty; the stored default is never resolved or invoked.',
    },
  ],
  authoringParity: {
    currentVersion: 1,
    resourceCount: 0,
    operationCount: 0,
    topLevelFieldCount: 3,
    recursiveFieldCount: 3,
    sourceVisibleFieldCount: 2,
    credentialSelectorCount: 1,
    credentialEditorFieldCount: 2,
    totalAuthoringFieldCount: 5,
    dynamicFieldCount: 2,
    modelDefault: 'llama3.2',
    expectedSourceN8nKeys: ['notice', 'model'],
    representedSourceN8nKeys: ['notice', 'model'],
  },
  portParity: {
    inputCount: 0,
    outputCount: 1,
    inputs: [],
    outputs: ['Embeddings'],
    outputConnectionTypes: ['ai_embedding'],
  },
  dynamicAuthoringMetadata: {
    loadOptionsMethods: ['model'],
    resourceLocatorMethods: [],
    credentialSelectors: ['ollamaCredential'],
    dynamicModelFields: ['model'],
    lockedFields: ['ollamaCredential', 'model'],
    remoteDynamicFields: ['ollamaCredential', 'model'],
  },
  excludedHistoricalAuthoring: [],
  excludedDormantAuthoring: [
    {
      sourceExport: 'ollamaOptions',
      reason: 'The shared Ollama options collection is not imported by EmbeddingsOllama.',
    },
  ],
  rendererNormalizations: [
    {
      n8nKey: 'credentials.ollamaApi',
      sourceType: 'required credential selector',
      normalizedKind: 'locked select',
    },
    {
      n8nKey: 'model',
      sourceType: 'required options with routing loadOptions',
      normalizedKind: 'locked empty select retaining native default and routing metadata',
    },
    {
      n8nKey: 'notice',
      sourceType: 'getConnectionHintNoticeField([ai_vectorStore])',
      normalizedKind: 'notice with inert connectionHint metadata',
    },
  ],
  platformGaps: [
    'The vector-store insertion hint retains its exact action metadata but is inert in the catalog renderer.',
    'The credential selector and complete two-field Ollama credential editor/authentication/test are locked and never contact Ollama.',
    'Model discovery never requests /api/tags; the locked options list remains empty while retaining the native llama3.2 default.',
    'Credential, request-default, routing, and response expressions are stored without evaluation.',
    'OllamaEmbeddings construction, optional bearer headers, model invocation, embedding generation, and logging never run.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials.ollamaApi', sourceType: 'credentials', normalizedKind: 'locked select' },
    {
      n8nKey: 'notice', sourceType: 'generated connection-hint notice',
      normalizedKind: 'notice',
    },
    {
      n8nKey: 'model', sourceType: 'options with routing loadOptions',
      normalizedKind: 'locked select',
    },
  ],
  simulation: {
    configurationOnly: true,
    credentialCreation: false,
    credentialAccess: false,
    credentialTesting: false,
    authentication: false,
    dynamicLookups: false,
    modelListing: false,
    expressionResolution: false,
    requestDefaultsApplication: false,
    modelInvocation: false,
    embeddingGeneration: false,
    customHeaders: false,
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

export default embeddingsOllama;
