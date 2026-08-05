// Editor-only descriptor for @n8n/n8n-nodes-langchain Ollama Model v1.
// Credentials, remote models, expressions, APIs, language-model calls, and execution stay inert.

const languageModelOutput = {
  type: 'ai_languageModel',
  connector: 'ai_languageModel',
  label: 'Model',
  displayName: 'Model',
  required: true,
};

const credentialDefinition = {
  type: 'ollamaApi',
  name: 'Ollama',
  required: true,
  documentationUrl: 'ollama',
  sourcePath: 'packages/@n8n/nodes-langchain/credentials/OllamaApi.credentials.ts',
  renderedInCredentialEditor: false,
  locked: true,
  inert: true,
  fields: [
    {
      key: 'baseUrl',
      n8nKey: 'baseUrl',
      sourceN8nKey: 'baseUrl',
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
      sourceN8nKey: 'apiKey',
      label: 'API Key',
      kind: 'text',
      sourceKind: 'string:password',
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
    headers: { Authorization: '=Bearer {{$credentials.apiKey}}' },
    inert: true,
  },
  test: {
    request: {
      baseURL: '={{ $credentials.baseUrl }}',
      url: '/api/tags',
      method: 'GET',
    },
    inert: true,
  },
  simulationNote:
    'The complete Ollama credential editor and its authentication/test templates are locked metadata and are never resolved or sent.',
};

const ollamaOptionFields = [
  {
    key: 'think', n8nKey: 'options.think', sourceN8nKey: 'think',
    label: 'Enable Thinking', kind: 'boolean', sourceKind: 'boolean', value: true,
    required: false,
    description:
      "Whether to enable (default) thinking mode for supported models. When enabled, the model's thinking process is separated from the output. When disabled, the model outputs content directly (only for supported models).",
  },
  {
    key: 'temperature', n8nKey: 'options.temperature', sourceN8nKey: 'temperature',
    label: 'Sampling Temperature', kind: 'number', sourceKind: 'number', value: 0.7,
    required: false, min: 0, max: 1, minValue: 0, maxValue: 1, precision: 1,
    description:
      'Controls the randomness of the generated text. Lower values make the output more focused and deterministic, while higher values make it more diverse and random.',
  },
  {
    key: 'topK', n8nKey: 'options.topK', sourceN8nKey: 'topK',
    label: 'Top K', kind: 'number', sourceKind: 'number', value: -1,
    required: false, min: -1, max: 100, minValue: -1, maxValue: 100, precision: 1,
    description:
      'Limits the number of highest probability vocabulary tokens to consider at each step. A higher value increases diversity but may reduce coherence. Set to -1 to disable.',
  },
  {
    key: 'topP', n8nKey: 'options.topP', sourceN8nKey: 'topP',
    label: 'Top P', kind: 'number', sourceKind: 'number', value: 1,
    required: false, min: 0, max: 1, minValue: 0, maxValue: 1, precision: 1,
    description:
      'Chooses from the smallest possible set of tokens whose cumulative probability exceeds the probability top_p. Helps generate more human-like text by reducing repetitions.',
  },
  {
    key: 'frequencyPenalty', n8nKey: 'options.frequencyPenalty', sourceN8nKey: 'frequencyPenalty',
    label: 'Frequency Penalty', kind: 'number', sourceKind: 'number', value: 0,
    required: false, min: 0, minValue: 0,
    description:
      'Adjusts the penalty for tokens that have already appeared in the generated text. Higher values discourage repetition.',
  },
  {
    key: 'keepAlive', n8nKey: 'options.keepAlive', sourceN8nKey: 'keepAlive',
    label: 'Keep Alive', kind: 'text', sourceKind: 'string', value: '5m',
    required: false,
    description:
      'Specifies the duration to keep the loaded model in memory after use. Useful for frequently used models. Format: 1h30m (1 hour 30 minutes).',
  },
  {
    key: 'lowVram', n8nKey: 'options.lowVram', sourceN8nKey: 'lowVram',
    label: 'Low VRAM Mode', kind: 'boolean', sourceKind: 'boolean', value: false,
    required: false,
    description:
      'Whether to Activate low VRAM mode, which reduces memory usage at the cost of slower generation speed. Useful for GPUs with limited memory.',
  },
  {
    key: 'mainGpu', n8nKey: 'options.mainGpu', sourceN8nKey: 'mainGpu',
    label: 'Main GPU ID', kind: 'number', sourceKind: 'number', value: 0,
    required: false,
    description:
      'Specifies the ID of the GPU to use for the main computation. Only change this if you have multiple GPUs.',
  },
  {
    key: 'numBatch', n8nKey: 'options.numBatch', sourceN8nKey: 'numBatch',
    label: 'Context Batch Size', kind: 'number', sourceKind: 'number', value: 512,
    required: false,
    description:
      'Sets the batch size for prompt processing. Larger batch sizes may improve generation speed but increase memory usage.',
  },
  {
    key: 'numCtx', n8nKey: 'options.numCtx', sourceN8nKey: 'numCtx',
    label: 'Context Length', kind: 'number', sourceKind: 'number', value: 2048,
    required: false,
    description:
      'The maximum number of tokens to use as context for generating the next token. Smaller values reduce memory usage, while larger values provide more context to the model.',
  },
  {
    key: 'numGpu', n8nKey: 'options.numGpu', sourceN8nKey: 'numGpu',
    label: 'Number of GPUs', kind: 'number', sourceKind: 'number', value: -1,
    required: false,
    description:
      'Specifies the number of GPUs to use for parallel processing. Set to -1 for auto-detection.',
  },
  {
    key: 'numPredict', n8nKey: 'options.numPredict', sourceN8nKey: 'numPredict',
    label: 'Max Tokens to Generate', kind: 'number', sourceKind: 'number', value: -1,
    required: false,
    description:
      'The maximum number of tokens to generate. Set to -1 for no limit. Be cautious when setting this to a large value, as it can lead to very long outputs.',
  },
  {
    key: 'numThread', n8nKey: 'options.numThread', sourceN8nKey: 'numThread',
    label: 'Number of CPU Threads', kind: 'number', sourceKind: 'number', value: 0,
    required: false,
    description:
      'Specifies the number of CPU threads to use for processing. Set to 0 for auto-detection.',
  },
  {
    key: 'penalizeNewline', n8nKey: 'options.penalizeNewline', sourceN8nKey: 'penalizeNewline',
    label: 'Penalize Newlines', kind: 'boolean', sourceKind: 'boolean', value: true,
    required: false,
    description:
      'Whether the model will be less likely to generate newline characters, encouraging longer continuous sequences of text',
  },
  {
    key: 'presencePenalty', n8nKey: 'options.presencePenalty', sourceN8nKey: 'presencePenalty',
    label: 'Presence Penalty', kind: 'number', sourceKind: 'number', value: 0,
    required: false,
    description:
      'Adjusts the penalty for tokens based on their presence in the generated text so far. Positive values penalize tokens that have already appeared, encouraging diversity.',
  },
  {
    key: 'repeatPenalty', n8nKey: 'options.repeatPenalty', sourceN8nKey: 'repeatPenalty',
    label: 'Repetition Penalty', kind: 'number', sourceKind: 'number', value: 1,
    required: false,
    description:
      'Adjusts the penalty factor for repeated tokens. Higher values more strongly discourage repetition. Set to 1.0 to disable repetition penalty.',
  },
  {
    key: 'useMLock', n8nKey: 'options.useMLock', sourceN8nKey: 'useMLock',
    label: 'Use Memory Locking', kind: 'boolean', sourceKind: 'boolean', value: false,
    required: false,
    description:
      'Whether to lock the model in memory to prevent swapping. This can improve performance but requires sufficient available memory.',
  },
  {
    key: 'useMMap', n8nKey: 'options.useMMap', sourceN8nKey: 'useMMap',
    label: 'Use Memory Mapping', kind: 'boolean', sourceKind: 'boolean', value: true,
    required: false,
    description:
      'Whether to use memory mapping for loading the model. This can reduce memory usage but may impact performance. Recommended to keep enabled.',
  },
  {
    key: 'vocabOnly', n8nKey: 'options.vocabOnly', sourceN8nKey: 'vocabOnly',
    label: 'Load Vocabulary Only', kind: 'boolean', sourceKind: 'boolean', value: false,
    required: false,
    description:
      'Whether to only load the model vocabulary without the weights. Useful for quickly testing tokenization.',
  },
  {
    key: 'format', n8nKey: 'options.format', sourceN8nKey: 'format',
    label: 'Output Format', kind: 'select', sourceKind: 'options', value: 'default',
    required: false,
    options: [
      { label: 'Default', value: 'default' },
      { label: 'JSON', value: 'json' },
    ],
    description: 'Specifies the format of the API response',
  },
];

const ollamaModel = {
  type: 'ollama-model',
  n8nType: '@n8n/n8n-nodes-langchain.lmOllama',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  sourceVersionDeclaration: 1,
  label: 'Ollama Model',
  defaultName: 'Ollama Model',
  subtitle: '',
  description: 'Language Model Ollama',
  details:
    'Choose an Ollama model and author local text-completion controls for a Language Model sub-node. This catalog entry never resolves credentials, lists models, or invokes Ollama.',
  clusterRole: 'sub',
  category: 'core',
  libraryCategory: 'ai',
  categories: ['AI'],
  subcategory: 'Language Models',
  subcategories: ['Language Models', 'Root Nodes', 'Text Completion Models'],
  codexSubcategories: {
    AI: ['Language Models', 'Root Nodes'],
    'Language Models': ['Text Completion Models'],
  },
  group: ['transform'],
  inputs: [],
  outputs: [languageModelOutput],
  outputNames: ['Model'],
  aiConnectorPorts: [languageModelOutput],
  builderHint: { outputs: { ai_languageModel: { required: true } } },
  usableAsTool: false,
  icon: '/node-icons/ollama-model.svg',
  n8nIcon: 'file:ollama.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 241.333, height: 341.333, viewBox: '0 0 181 256' },
  iconAssetSha256: '4365d3b95114d501a70b73be0b7c16e424a1279dc174ae37b2c95b652ae41225',
  aliases: [],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmollama/',
  requestDefaults: {
    ignoreHttpStatusErrors: true,
    baseURL: '={{ $credentials.baseUrl.replace(new RegExp("/$"), "") }}',
    inert: true,
    simulationNote:
      'The credential URL and RegExp expression are retained as text and are never evaluated or used for a request.',
  },
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/llms/LMOllama/LmOllama.node.ts',
    sharedDescriptionPath:
      'packages/@n8n/nodes-langchain/nodes/llms/LMOllama/description.ts',
    credentialPath: credentialDefinition.sourcePath,
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    iconPath:
      'packages/@n8n/nodes-langchain/nodes/llms/LMOllama/ollama.svg',
    directDescriptionImports: [
      {
        module: '@n8n/ai-utilities',
        names: ['getConnectionHintNoticeField'],
        contributions: ['AI Chain or AI Agent connection notice'],
      },
      {
        module: './description',
        names: ['ollamaDescription', 'ollamaModel', 'ollamaOptions'],
        contributions: ['credential/request defaults', 'model picker', '20-field options collection'],
      },
    ],
    sharedDescriptionExports: [
      {
        name: 'ollamaDescription',
        consumedByCurrentProperties: true,
        contribution: 'credentials and request defaults',
      },
      {
        name: 'ollamaModel',
        consumedByCurrentProperties: true,
        contribution: 'required remote model picker',
      },
      {
        name: 'ollamaOptions',
        consumedByCurrentProperties: true,
        contribution: 'current 20-field options collection',
      },
    ],
    dynamicOptionDefinitions: [
      {
        source: 'ollamaModel routing.loadOptions',
        request: { method: 'GET', url: '/api/tags' },
        response: {
          rootProperty: 'models',
          mapping: {
            label: '={{$responseItem.name}}',
            value: '={{$responseItem.name}}',
          },
          sortBy: 'name',
        },
      },
    ],
    runtimeImportsExcluded: [
      { module: '@langchain/ollama', names: ['Ollama', 'OllamaInput'] },
      {
        module: '@n8n/ai-utilities',
        names: ['makeN8nLlmFailedAttemptHandler', 'N8nLlmTracing'],
      },
    ],
  },
  defaults: { name: 'Ollama Model' },
  credentials: [
    {
      name: 'ollamaApi',
      type: 'ollamaApi',
      displayName: 'Ollama',
      required: true,
      locked: true,
      inert: true,
      sourcePath: credentialDefinition.sourcePath,
    },
  ],
  credentialRequirements: [
    {
      type: 'ollamaApi',
      name: 'Ollama',
      required: true,
      locked: true,
      inert: true,
    },
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
        locked: true,
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
      dynamicOptions: {
        source: 'credentialStore',
        credentialType: 'ollamaApi',
        locked: true,
        inert: true,
      },
      options: [{ label: 'Ollama', value: 'ollamaApi' }],
      simulationNote:
        'The credential selector is locked. It never creates, reads, tests, or applies Ollama credentials.',
    },
    {
      key: 'chainConnectionNotice',
      n8nKey: 'notice',
      sourceN8nKey: 'notice',
      label:
        "This node must be connected to an AI chain. <a data-action='openSelectiveNodeCreator' data-action-parameter-creatorview='AI'>Insert one</a>",
      kind: 'notice',
      sourceKind: 'notice',
      value: '',
      required: false,
      containerClass: 'ndv-connection-hint-notice',
      connectionHint: {
        requestedConnectionTypes: ['ai_chain', 'ai_agent'],
        groupedConnection: '',
        targetLocales: ['AI Chain', 'AI Agent'],
        renderedTargetLocale: 'AI Chain',
        action: 'openSelectiveNodeCreator',
        creatorView: 'AI',
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
      sourceDefault: 'llama3.2',
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
        locked: true,
        inert: true,
      },
      routing: { send: { type: 'body', property: 'model', inert: true } },
      simulationNote:
        'Remote model options are locked and empty; the required native llama3.2 default is retained as text and is never resolved or invoked.',
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
      description: 'Additional options to add',
      fields: ollamaOptionFields,
    },
  ],
  authoringParity: {
    currentVersion: 1,
    resourceCount: 0,
    operationCount: 0,
    topLevelFieldCount: 4,
    recursiveFieldCount: 24,
    sourceVisibleFieldCount: 23,
    credentialSelectorCount: 1,
    credentialEditorFieldCount: 2,
    totalAuthoringFieldCount: 26,
    dynamicFieldCount: 2,
    currentDirectOptionFieldCount: 20,
    modelDefault: 'llama3.2',
    optionFields: [
      'think', 'temperature', 'topK', 'topP', 'frequencyPenalty', 'keepAlive', 'lowVram',
      'mainGpu', 'numBatch', 'numCtx', 'numGpu', 'numPredict', 'numThread',
      'penalizeNewline', 'presencePenalty', 'repeatPenalty', 'useMLock', 'useMMap',
      'vocabOnly', 'format',
    ],
  },
  portParity: {
    inputCount: 0,
    outputCount: 1,
    inputs: [],
    outputs: ['Model'],
    outputConnectionTypes: ['ai_languageModel'],
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
  excludedDormantAuthoring: [],
  dormantExportAudit: {
    sourceModule: 'packages/@n8n/nodes-langchain/nodes/llms/LMOllama/description.ts',
    exportedDescriptions: ['ollamaDescription', 'ollamaModel', 'ollamaOptions'],
    importedByCurrentNode: ['ollamaDescription', 'ollamaModel', 'ollamaOptions'],
    consumedByCurrentNode: ['ollamaDescription', 'ollamaModel', 'ollamaOptions'],
    dormantImports: [],
    dormantExports: [],
    note:
      'All shared exports are live on Ollama Model; ollamaOptions is omitted only by the separate Embeddings Ollama consumer.',
  },
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
      sourceType: 'getConnectionHintNoticeField(ai_chain, ai_agent)',
      normalizedKind: 'notice with inert grouped connection-action metadata',
    },
  ],
  platformGaps: [
    'The credential selector and complete two-field Ollama credential editor/authentication/test are locked and never contact Ollama.',
    'Model discovery never requests /api/tags; the locked options list remains empty while retaining the required native llama3.2 default.',
    'Credential, request-default, authentication, routing, and response expressions are stored without evaluation.',
    'All 20 current Ollama options are authoring metadata only; none changes thinking, sampling, memory, GPU, CPU, or response formatting.',
    'Ollama construction, optional bearer headers, tracing, failure handling, model invocation, and language-model output never run.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'credentials.ollamaApi', sourceType: 'credentials',
      normalizedKind: 'locked select',
    },
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
    responseMapping: false,
    responseSorting: false,
    customHeaders: false,
    thinking: false,
    sampling: false,
    memoryConfiguration: false,
    gpuConfiguration: false,
    cpuConfiguration: false,
    responseFormatting: false,
    modelInvocation: false,
    languageModelOutput: false,
    tracing: false,
    failureHandling: false,
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

export default ollamaModel;
