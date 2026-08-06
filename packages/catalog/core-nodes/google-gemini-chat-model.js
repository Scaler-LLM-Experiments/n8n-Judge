// Editor-only descriptor for @n8n/n8n-nodes-langchain Google Gemini Chat Model v1.1.
// Credentials, remote model discovery, expressions, safety execution, and model calls stay inert.

const languageModelOutput = {
  type: 'ai_languageModel',
  connector: 'ai_languageModel',
  label: 'Model',
  displayName: 'Model',
  required: true,
};

const harmCategoryOptions = [
  {
    label: 'HARM_CATEGORY_HARASSMENT', value: 'HARM_CATEGORY_HARASSMENT',
    description: 'Harassment content',
  },
  {
    label: 'HARM_CATEGORY_HATE_SPEECH', value: 'HARM_CATEGORY_HATE_SPEECH',
    description: 'Hate speech and content',
  },
  {
    label: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', value: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    description: 'Sexually explicit content',
  },
  {
    label: 'HARM_CATEGORY_DANGEROUS_CONTENT', value: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    description: 'Dangerous content',
  },
];

const harmThresholdOptions = [
  {
    label: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED', value: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
    description: 'Threshold is unspecified',
  },
  {
    label: 'BLOCK_LOW_AND_ABOVE', value: 'BLOCK_LOW_AND_ABOVE',
    description: 'Content with NEGLIGIBLE will be allowed',
  },
  {
    label: 'BLOCK_MEDIUM_AND_ABOVE', value: 'BLOCK_MEDIUM_AND_ABOVE',
    description: 'Content with NEGLIGIBLE and LOW will be allowed',
  },
  {
    label: 'BLOCK_ONLY_HIGH', value: 'BLOCK_ONLY_HIGH',
    description: 'Content with NEGLIGIBLE, LOW, and MEDIUM will be allowed',
  },
  {
    label: 'BLOCK_NONE', value: 'BLOCK_NONE',
    description: 'All content will be allowed',
  },
];

const credentialDefinition = {
  type: 'googlePalmApi',
  name: 'Google Gemini(PaLM) Api',
  required: true,
  documentationSlug: 'google',
  sourcePath: 'packages/@n8n/nodes-langchain/credentials/GooglePalmApi.credentials.ts',
  fields: [
    {
      key: 'host', n8nKey: 'host', label: 'Host', kind: 'text', sourceKind: 'string',
      value: 'https://generativelanguage.googleapis.com', required: true, locked: true,
    },
    {
      key: 'apiKey', n8nKey: 'apiKey', label: 'API Key', kind: 'text', sourceKind: 'string',
      value: '', required: true, password: true, locked: true,
    },
  ],
  authenticate: {
    type: 'generic', query: { key: '={{$credentials.apiKey}}' }, inert: true,
  },
  test: {
    baseURL: '={{$credentials.host}}/v1beta/models', inert: true,
  },
  simulationNote:
    'The complete Google Gemini credential editor and its query authentication/test templates are locked metadata and never resolve or run.',
};

const googleGeminiChatModel = {
  type: 'google-gemini-chat-model',
  n8nType: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1.1,
  defaultVersion: 1.1,
  versionHistory: [1, 1.1],
  sourceVersionDeclaration: [1, 1.1],
  label: 'Google Gemini Chat Model',
  defaultName: 'Google Gemini Chat Model',
  subtitle: '',
  description: 'Chat Model Google Gemini',
  details:
    'Choose a remotely discovered Gemini model and author generation and safety controls for a Language Model sub-node. This catalog entry never contacts Google or invokes a model.',
  clusterRole: 'sub',
  category: 'core',
  libraryCategory: 'ai',
  categories: ['AI'],
  subcategory: 'Language Models',
  subcategories: ['Language Models', 'Root Nodes', 'Chat Models (Recommended)'],
  codexSubcategories: {
    AI: ['Language Models', 'Root Nodes'],
    'Language Models': ['Chat Models (Recommended)'],
  },
  group: ['transform'],
  inputs: [],
  outputs: [languageModelOutput],
  outputNames: ['Model'],
  aiConnectorPorts: [languageModelOutput],
  builderHint: { outputs: { ai_languageModel: { required: true } } },
  requestDefaults: {
    ignoreHttpStatusErrors: true,
    baseURL: '={{ $credentials.host }}',
    inert: true,
    simulationNote: 'The credential expression is retained as text and never used for a request.',
  },
  usableAsTool: false,
  icon: '/node-icons/google-gemini-chat-model.svg',
  n8nIcon: 'file:google.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 48, height: 48, viewBox: '0 0 48 48' },
  iconAssetSha256: 'a15256a44b6f8e6f4a7c6b370dfd533c8305a3f10c1bbfba2759477a4e07c049',
  aliases: [],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatgooglegemini/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/llms/LmChatGoogleGemini/LmChatGoogleGemini.node.ts',
    additionalOptionsPath:
      'packages/@n8n/nodes-langchain/nodes/llms/gemini-common/additional-options.ts',
    safetyOptionsPath:
      'packages/@n8n/nodes-langchain/nodes/llms/gemini-common/safety-options.ts',
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    credentialPath: credentialDefinition.sourcePath,
    packagePath: 'packages/@n8n/nodes-langchain/package.json',
    iconPath:
      'packages/@n8n/nodes-langchain/nodes/llms/LmChatGoogleGemini/google.svg',
    inlineDescriptionFields: ['modelRLC'],
    directDescriptionImports: [
      {
        module: '../gemini-common/additional-options', names: ['getAdditionalOptions'],
        arguments: { supportsThinkingBudget: false },
      },
      { module: '@n8n/ai-utilities', names: ['getConnectionHintNoticeField'] },
      {
        module: '../gemini-common/safety-options',
        names: ['harmCategories', 'harmThresholds'],
        transitiveVia: 'getAdditionalOptions',
      },
    ],
    inlineRuntimeHelpersExcluded: ['errorDescriptionMapper'],
    runtimeImportsExcluded: [
      { module: '@langchain/google-genai', names: ['ChatGoogleGenerativeAI'] },
      { module: '@google/generative-ai', names: ['SafetySetting'], typeOnly: true },
      {
        module: '@n8n/ai-utilities',
        names: ['makeN8nLlmFailedAttemptHandler', 'N8nLlmTracing'],
      },
    ],
  },
  defaults: { name: 'Google Gemini Chat Model' },
  credentials: [
    {
      name: 'googlePalmApi', type: 'googlePalmApi',
      displayName: 'Google Gemini(PaLM) Api', required: true, locked: true,
      sourcePath: credentialDefinition.sourcePath,
    },
  ],
  credentialRequirements: [
    { type: 'googlePalmApi', name: 'Google Gemini(PaLM) Api', required: true, locked: true },
  ],
  credentialUiMetadata: [credentialDefinition],
  methods: {
    loadOptions: {
      modelName: {
        credentialType: 'googlePalmApi',
        request: { method: 'GET', url: '/v1beta/models' },
        response: {
          rootProperty: 'models',
          filterExpression:
            "={{ !$responseItem.name.includes('embedding') && !$responseItem.name.includes('imagen') }}",
          mapping: {
            label: '={{$responseItem.name}}',
            value: '={{$responseItem.name}}',
            description: '={{$responseItem.description}}',
          },
          sortBy: 'name',
        },
        inert: true,
      },
    },
  },
  params: [
    {
      key: 'googlePalmCredential', n8nKey: 'credentials.googlePalmApi',
      sourceN8nKey: 'credentials', label: 'Credentials', kind: 'select',
      sourceKind: 'credentials', value: 'googlePalmApi', required: true, locked: true,
      dynamicOptions: { source: 'credentialStore', credentialType: 'googlePalmApi', inert: true },
      options: [{ label: 'Google Gemini(PaLM) Api', value: 'googlePalmApi' }],
      simulationNote:
        'The credential selector is locked. It never creates, reads, tests, or applies Google credentials.',
    },
    {
      key: 'chainConnectionNotice', n8nKey: 'notice', sourceN8nKey: 'notice',
      label:
        "This node must be connected to an AI chain. <a data-action='openSelectiveNodeCreator' data-action-parameter-creatorview='AI'>Insert one</a>",
      kind: 'notice', sourceKind: 'notice', value: '', required: false,
      containerClass: 'ndv-connection-hint-notice',
      connectionHint: {
        requestedConnectionTypes: ['ai_chain', 'ai_agent'], groupedConnection: '',
        targetLocale: 'AI Chain', action: 'openSelectiveNodeCreator', creatorView: 'AI', inert: true,
      },
    },
    {
      key: 'modelName', n8nKey: 'modelName', sourceN8nKey: 'modelName', label: 'Model',
      kind: 'select', sourceKind: 'options:loadOptions',
      value: 'models/gemini-3-flash-preview', required: false, locked: true,
      dynamic: true, options: [],
      description:
        'The model which will generate the completion. <a href="https://developers.generativeai.google/api/rest/generativelanguage/models/list">Learn more</a>.',
      sourceVersionCondition: '@version >= 1.1',
      sourceDisplayOptions: { show: { '@version': [{ _cnd: { gte: 1.1 } }] } },
      builderHint: {
        propertyHint:
          'Default to the latest flagship Gemini (models/gemini-3.1-pro-preview). Use models/gemini-3.1-flash-lite for cost-efficient builds. Avoid Gemini 2.x, 1.x, and earlier.',
      },
      dynamicOptions: {
        credentialType: 'googlePalmApi',
        request: { method: 'GET', url: '/v1beta/models' },
        responseRoot: 'models',
        filter:
          "name excludes both 'embedding' and 'imagen'",
        filterExpression:
          "={{ !$responseItem.name.includes('embedding') && !$responseItem.name.includes('imagen') }}",
        mapLabel: 'name', mapValue: 'name', mapDescription: 'description', sortBy: 'name',
        inert: true,
      },
      routing: { send: { type: 'body', property: 'model', inert: true } },
      simulationNote:
        'Remote model options are locked and empty; the v1.1 default is never resolved or invoked.',
    },
    {
      key: 'options', n8nKey: 'options', sourceN8nKey: 'options', label: 'Options',
      kind: 'collection', sourceKind: 'collection', value: {}, sourceDefault: {},
      required: false, addLabel: 'Add Option', placeholder: 'Add Option',
      description: 'Additional options to add',
      fields: [
        {
          key: 'maxOutputTokens', n8nKey: 'options.maxOutputTokens',
          sourceN8nKey: 'maxOutputTokens', label: 'Maximum Number of Tokens',
          kind: 'number', sourceKind: 'number', value: 2048, required: false,
          description: 'The maximum number of tokens to generate in the completion',
        },
        {
          key: 'temperature', n8nKey: 'options.temperature', sourceN8nKey: 'temperature',
          label: 'Sampling Temperature', kind: 'number', sourceKind: 'number',
          value: 0.4, required: false, min: 0, max: 1, precision: 1,
          description:
            'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
        },
        {
          key: 'topK', n8nKey: 'options.topK', sourceN8nKey: 'topK', label: 'Top K',
          kind: 'number', sourceKind: 'number', value: 32, required: false,
          min: -1, max: 40, precision: 1,
          description: 'Used to remove "long tail" low probability responses. Defaults to -1, which disables it.',
        },
        {
          key: 'topP', n8nKey: 'options.topP', sourceN8nKey: 'topP', label: 'Top P',
          kind: 'number', sourceKind: 'number', value: 1, required: false,
          min: 0, max: 1, precision: 1,
          description:
            'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. We generally recommend altering this or temperature but not both.',
        },
        {
          key: 'safetySettings', n8nKey: 'options.safetySettings',
          sourceN8nKey: 'safetySettings', label: 'Safety Settings', kind: 'fixedCollection',
          sourceKind: 'fixedCollection',
          value: {
            values: {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
            },
          },
          sourceDefault: {
            values: {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
            },
          },
          required: false, multiple: true, collectionKey: 'values',
          collectionLabel: 'Values', addLabel: 'Add Option', placeholder: 'Add Option',
          fields: [
            {
              key: 'category', n8nKey: 'options.safetySettings.values.category',
              sourceN8nKey: 'category', label: 'Safety Category', kind: 'select',
              sourceKind: 'options', value: 'HARM_CATEGORY_UNSPECIFIED', required: false,
              description: 'The category of harmful content to block',
              options: harmCategoryOptions,
            },
            {
              key: 'threshold', n8nKey: 'options.safetySettings.values.threshold',
              sourceN8nKey: 'threshold', label: 'Safety Threshold', kind: 'select',
              sourceKind: 'options', value: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED', required: false,
              description: 'The threshold of harmful content to block',
              options: harmThresholdOptions,
            },
          ],
          simulationNote: 'Safety rows are stored without configuring or invoking a model.',
        },
      ],
    },
  ],
  authoringParity: {
    currentVersion: 1.1,
    resourceCount: 0,
    operationCount: 0,
    topLevelFieldCount: 4,
    recursiveFieldCount: 11,
    sourceVisibleFieldCount: 10,
    credentialSelectorCount: 1,
    credentialEditorFieldCount: 2,
    totalAuthoringFieldCount: 13,
    dynamicFieldCount: 2,
    modelDefault: 'models/gemini-3-flash-preview',
    optionFields: ['maxOutputTokens', 'temperature', 'topK', 'topP', 'safetySettings'],
    safetySettingFields: ['category', 'threshold'],
    harmCategoryOptionCount: 4,
    harmThresholdOptionCount: 5,
  },
  portParity: {
    inputCount: 0,
    outputCount: 1,
    inputs: [],
    outputs: ['Model'],
    outputConnectionTypes: ['ai_languageModel'],
  },
  dynamicAuthoringMetadata: {
    loadOptionsMethods: ['modelName'],
    resourceLocatorMethods: [],
    credentialSelectors: ['googlePalmCredential'],
    dynamicModelFields: ['modelName'],
    lockedFields: ['googlePalmCredential', 'modelName'],
    remoteDynamicFields: ['googlePalmCredential', 'modelName'],
  },
  excludedHistoricalAuthoring: [
    {
      n8nKey: 'modelName', sourceVersionCondition: '@version = 1',
      sourceDefault: 'models/gemini-2.5-flash',
      reason: 'The current/default v1.1 declaration replaces the v1 model default.',
    },
  ],
  excludedDormantAuthoring: [
    {
      n8nKey: 'options.thinkingBudget',
      sourceCondition: 'getAdditionalOptions({ supportsThinkingBudget: true })',
      reason: 'LmChatGoogleGemini calls the helper with supportsThinkingBudget false.',
    },
  ],
  rendererNormalizations: [
    {
      n8nKey: 'credentials.googlePalmApi', sourceType: 'required credential selector',
      normalizedKind: 'locked select',
    },
    {
      n8nKey: 'modelName', sourceType: 'options with routing loadOptions',
      normalizedKind: 'locked empty select retaining current default and routing metadata',
    },
    {
      n8nKey: 'notice', sourceType: 'getConnectionHintNoticeField([ai_chain, ai_agent])',
      normalizedKind: 'notice with inert grouped AI creator metadata',
    },
  ],
  platformGaps: [
    'The credential selector and complete two-field Google credential editor/authentication/test are locked and inert.',
    'Model discovery never requests /v1beta/models; filtering, response expressions, mapping, and sorting never run.',
    'The locked model list remains empty while retaining the current v1.1 default and builder hint.',
    'Safety settings are stored only; ChatGoogleGenerativeAI construction, tracing, retry handling, error mapping, and model invocation never run.',
    'The category child default is preserved verbatim even though that unspecified value is absent from the four source category options.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials.googlePalmApi', sourceType: 'credentials', normalizedKind: 'locked select' },
    { n8nKey: 'notice', sourceType: 'generated connection-hint notice', normalizedKind: 'notice' },
    {
      n8nKey: 'modelName', sourceType: 'options with routing loadOptions',
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
    responseFiltering: false,
    expressionResolution: false,
    safetyApplication: false,
    modelInvocation: false,
    languageModelOutput: false,
    tracing: false,
    retryHandling: false,
    errorMapping: false,
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

export default googleGeminiChatModel;
