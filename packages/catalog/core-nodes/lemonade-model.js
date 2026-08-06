// Editor-only descriptor for @n8n/n8n-nodes-langchain Lemonade Model v1.
// Credentials, remote models, expressions, APIs, text completion, and execution stay inert.

import lemonadeChatModel from './lemonade-chat-model.js';

// LmLemonade and LmChatLemonade consume the same pinned shared authoring exports.
const credentialDefinition = lemonadeChatModel.credentialUiMetadata[0];
const sharedCredentials = lemonadeChatModel.credentials;
const sharedCredentialRequirements = lemonadeChatModel.credentialRequirements;
const sharedMethods = lemonadeChatModel.methods;
const sharedParams = lemonadeChatModel.params;

const languageModelOutput = {
  type: 'ai_languageModel',
  connector: 'ai_languageModel',
  label: 'Model',
  displayName: 'Model',
  required: true,
};

const lemonadeModel = {
  type: 'lemonade-model',
  n8nType: '@n8n/n8n-nodes-langchain.lmLemonade',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  sourceVersionDeclaration: 1,
  label: 'Lemonade Model',
  defaultName: 'Lemonade Model',
  subtitle: '',
  description: 'Language Model Lemonade',
  details:
    'Choose a model managed by a Lemonade server and author text-completion controls for a Language Model sub-node. This catalog entry never resolves credentials, discovers models, or generates text.',
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
  icon: '/node-icons/lemonade-model.svg',
  n8nIcon: 'file:lemonade.svg',
  activeIconSource: { asset: 'file:lemonade.svg' },
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 32, height: 32, viewBox: '0 0 32 32' },
  iconAssetSha256: 'bfa64b2b3f31977515f1380285a461d82abb54c0ec1a251b9358bd1000514b71',
  aliases: ['lemonade', 'lemonade completion', 'local completion model'],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmlemonade/',
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
      'packages/@n8n/nodes-langchain/nodes/llms/LMLemonade/LmLemonade.node.ts',
    sharedDescriptionPath:
      'packages/@n8n/nodes-langchain/nodes/llms/LMLemonade/description.ts',
    credentialPath: credentialDefinition.sourcePath,
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    iconPath:
      'packages/@n8n/nodes-langchain/nodes/llms/LMLemonade/lemonade.svg',
    reusedDescriptorMetadataPath:
      'packages/catalog/core-nodes/lemonade-chat-model.js',
    directDescriptionImports: [
      {
        module: '@n8n/ai-utilities',
        names: ['getConnectionHintNoticeField'],
        contributions: ['AI Chain or AI Agent connection notice'],
      },
      {
        module: './description',
        names: ['lemonadeDescription', 'lemonadeModel', 'lemonadeOptions'],
        contributions: [
          'credential requirement and request defaults',
          'required remote model selector',
          'six-field completion options collection',
        ],
      },
    ],
    activeImportedFieldCollections: [
      {
        name: 'lemonadeDescription',
        current: true,
        contributions: ['credentials', 'requestDefaults'],
      },
      { name: 'lemonadeModel', current: true, contributions: ['model'] },
      { name: 'lemonadeOptions', current: true, contributions: ['options'] },
    ],
    dynamicOptionDefinitions: [
      {
        source: 'lemonadeModel loadOptions routing',
        request: { method: 'GET', url: '/models' },
        response: {
          rootProperty: 'data',
          mapping: {
            label: '={{$responseItem.id}}',
            value: '={{$responseItem.id}}',
          },
          sortBy: 'name',
        },
      },
    ],
    runtimeImportsExcluded: [
      { module: '@langchain/openai', names: ['OpenAI'] },
      {
        module: '@n8n/ai-utilities',
        names: ['makeN8nLlmFailedAttemptHandler', 'N8nLlmTracing'],
      },
      {
        module: '../../../credentials/LemonadeApi.credentials',
        names: ['LemonadeApiCredentialsType'],
        typeOnly: true,
      },
    ],
    runtimePreprocessingExcluded: [
      {
        input: 'options.stop',
        behavior: 'split by comma, trim entries, and remove empty sequences',
      },
      {
        input: 'credentials.apiKey',
        behavior: 'use lemonade-placeholder-key when absent and add Authorization only when present',
      },
      {
        input: 'options.maxTokens',
        behavior: 'forward only when greater than zero',
      },
    ],
  },
  defaults: { name: 'Lemonade Model' },
  credentials: sharedCredentials,
  credentialRequirements: sharedCredentialRequirements,
  credentialUiMetadata: [credentialDefinition],
  methods: sharedMethods,
  params: sharedParams,
  authoringParity: {
    currentVersion: 1,
    resourceCount: 0,
    operationCount: 0,
    topLevelFieldCount: 4,
    recursiveFieldCount: 10,
    sourceVisibleFieldCount: 9,
    credentialSelectorCount: 1,
    credentialEditorFieldCount: 2,
    totalAuthoringFieldCount: 12,
    dynamicFieldCount: 2,
    directOptionFieldCount: 6,
    modelDefault: '',
    modelRequired: true,
    topLevelFields: ['credentials.lemonadeApi', 'notice', 'model', 'options'],
    optionFields: [
      'temperature',
      'topP',
      'frequencyPenalty',
      'presencePenalty',
      'maxTokens',
      'stop',
    ],
    expectedSourceN8nKeys: ['notice', 'model', 'options'],
    representedSourceN8nKeys: ['notice', 'model', 'options'],
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
    credentialSelectors: ['lemonadeCredential'],
    dynamicModelFields: ['model'],
    lockedFields: ['lemonadeCredential', 'model'],
    remoteDynamicFields: ['lemonadeCredential', 'model'],
  },
  excludedHistoricalAuthoring: [],
  excludedDormantAuthoring: [],
  excludedVersionConditions: [],
  rendererNormalizations: [
    {
      n8nKey: 'credentials.lemonadeApi',
      sourceType: 'required credential selector',
      normalizedKind: 'locked select',
    },
    {
      n8nKey: 'model',
      sourceType: 'required options with routing loadOptions',
      normalizedKind: 'locked empty select retaining native empty default and routing metadata',
    },
    {
      n8nKey: 'notice',
      sourceType: 'getConnectionHintNoticeField(ai_chain, ai_agent)',
      normalizedKind: 'notice with inert grouped AI creator metadata',
    },
  ],
  platformGaps: [
    'The AI Chain or AI Agent connection hint retains its grouped AI creator action metadata but is inert in the catalog renderer.',
    'The required credential selector and complete two-field Lemonade credential editor are locked and inert.',
    'Conditional bearer authentication and the credential test never read or transmit credentials.',
    'Model discovery never requests /models; the required locked options list remains empty.',
    'Credential, request-default, routing, and response expressions are stored without evaluation.',
    'Stop-sequence parsing, placeholder-key substitution, custom-header construction, max-token normalization, OpenAI construction, tracing, retries, model invocation, and text generation never run.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'credentials.lemonadeApi',
      sourceType: 'credentials',
      normalizedKind: 'locked select',
    },
    {
      n8nKey: 'notice',
      sourceType: 'generated connection-hint notice',
      normalizedKind: 'notice',
    },
    {
      n8nKey: 'model',
      sourceType: 'options with routing loadOptions',
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
    responseMapping: false,
    responseSorting: false,
    expressionResolution: false,
    requestDefaultsApplication: false,
    customHeaders: false,
    stopSequenceParsing: false,
    placeholderKeySubstitution: false,
    maxTokenNormalization: false,
    modelInvocation: false,
    textGeneration: false,
    languageModelOutput: false,
    tracing: false,
    retryHandling: false,
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

export default lemonadeModel;
