// Editor-only descriptor for @n8n/n8n-nodes-langchain Azure OpenAI Chat Model v1.
// Credentials, OAuth, expressions, model calls, proxying, tracing, and execution stay inert.

const languageModelOutput = {
  type: 'ai_languageModel',
  connector: 'ai_languageModel',
  label: 'Model',
  displayName: 'Model',
  required: true,
};

const apiKeyCredentialDefinition = {
  type: 'azureOpenAiApi',
  name: 'Azure Open AI',
  required: true,
  documentationSlug: 'azureopenai',
  sourcePath: 'packages/@n8n/nodes-langchain/credentials/AzureOpenAiApi.credentials.ts',
  fields: [
    {
      key: 'apiKey', n8nKey: 'apiKey', label: 'API Key', kind: 'text',
      sourceKind: 'string', value: '', required: true, password: true, locked: true,
    },
    {
      key: 'resourceName', n8nKey: 'resourceName', label: 'Resource Name', kind: 'text',
      sourceKind: 'string', value: '', required: true, locked: true,
    },
    {
      key: 'apiVersion', n8nKey: 'apiVersion', label: 'API Version', kind: 'text',
      sourceKind: 'string', value: '2025-03-01-preview', required: true, locked: true,
    },
    {
      key: 'endpoint', n8nKey: 'endpoint', label: 'Endpoint', kind: 'text',
      sourceKind: 'string', value: '', sourceDefault: undefined, required: false,
      locked: true, placeholder: 'https://westeurope.api.cognitive.microsoft.com',
    },
  ],
  authenticate: {
    type: 'generic', header: 'api-key', sourceTemplate: '={{$credentials.apiKey}}', inert: true,
  },
  simulationNote:
    'The API-key credential editor and authentication template are locked metadata and are never resolved or applied.',
};

const inheritedOAuth2Fields = [
  {
    key: 'useDynamicClientRegistration', n8nKey: 'useDynamicClientRegistration',
    label: 'Use Dynamic Client Registration', kind: 'hidden', sourceKind: 'hidden',
    value: false, required: false, hidden: true, locked: true, inheritedFrom: 'oAuth2Api',
  },
  {
    key: 'serverUrl', n8nKey: 'serverUrl', label: 'Server URL', kind: 'text',
    sourceKind: 'string', value: '', required: true, locked: true,
    showWhen: { useDynamicClientRegistration: [true] }, inheritedFrom: 'oAuth2Api',
  },
  {
    key: 'clientId', n8nKey: 'clientId', label: 'Client ID', kind: 'text',
    sourceKind: 'string', value: '', required: true, locked: true,
    showWhen: { useDynamicClientRegistration: [false] }, inheritedFrom: 'oAuth2Api',
  },
  {
    key: 'clientCredentialType', n8nKey: 'clientCredentialType', label: 'Authentication',
    kind: 'hidden', sourceKind: 'hidden', value: 'clientSecret', required: false,
    hidden: true, locked: true, inheritedFrom: 'oAuth2Api',
  },
  {
    key: 'clientSecret', n8nKey: 'clientSecret', label: 'Client Secret', kind: 'text',
    sourceKind: 'string', value: '', required: true, password: true, locked: true,
    showWhen: { useDynamicClientRegistration: [false] }, inheritedFrom: 'oAuth2Api',
  },
  {
    key: 'privateKey', n8nKey: 'privateKey', label: 'Private Key', kind: 'hidden',
    sourceKind: 'hidden', value: '', required: false, hidden: true, locked: true,
    inheritedFrom: 'oAuth2Api',
  },
  {
    key: 'certificate', n8nKey: 'certificate', label: 'Certificate', kind: 'hidden',
    sourceKind: 'hidden', value: '', required: false, hidden: true, locked: true,
    inheritedFrom: 'oAuth2Api',
  },
  {
    key: 'sendAdditionalBodyProperties', n8nKey: 'sendAdditionalBodyProperties',
    label: 'Send Additional Body Properties', kind: 'boolean', sourceKind: 'boolean',
    value: false, required: false, locked: true, inheritedFrom: 'oAuth2Api',
    showWhen: {
      grantType: ['clientCredentials'], authentication: ['body'],
      useDynamicClientRegistration: [false],
    },
  },
];

const azureEntraOwnFields = [
  {
    key: 'grantType', n8nKey: 'grantType', label: 'Grant Type', kind: 'hidden',
    sourceKind: 'hidden', value: 'authorizationCode', required: false, hidden: true, locked: true,
  },
  {
    key: 'resourceName', n8nKey: 'resourceName', label: 'Resource Name', kind: 'text',
    sourceKind: 'string', value: '', required: true, locked: true,
  },
  {
    key: 'apiVersion', n8nKey: 'apiVersion', label: 'API Version', kind: 'text',
    sourceKind: 'string', value: '2025-03-01-preview', required: true, locked: true,
  },
  {
    key: 'endpoint', n8nKey: 'endpoint', label: 'Endpoint', kind: 'text',
    sourceKind: 'string', value: '', sourceDefault: undefined, required: false,
    locked: true, placeholder: 'https://westeurope.api.cognitive.microsoft.com',
  },
  {
    key: 'tenantId', n8nKey: 'tenantId', label: 'Tenant ID', kind: 'text',
    sourceKind: 'string', value: 'common', required: false, locked: true,
    placeholder: 'e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx or common',
    description:
      'Enter your Azure Tenant ID (Directory ID) or keep "common" for multi-tenant apps. Using a specific Tenant ID is generally recommended and required for certain authentication flows.',
  },
  {
    key: 'authUrl', n8nKey: 'authUrl', label: 'Authorization URL', kind: 'hidden',
    sourceKind: 'hidden', value: '=https://login.microsoftonline.com/{{$self["tenantId"]}}/oauth2/authorize',
    required: false, hidden: true, locked: true, expressionAllowed: true,
  },
  {
    key: 'accessTokenUrl', n8nKey: 'accessTokenUrl', label: 'Access Token URL', kind: 'hidden',
    sourceKind: 'hidden', value: '=https://login.microsoftonline.com/{{$self["tenantId"]}}/oauth2/token',
    required: false, hidden: true, locked: true, expressionAllowed: true,
  },
  {
    key: 'additionalBodyProperties', n8nKey: 'additionalBodyProperties',
    label: 'Additional Body Properties', kind: 'hidden', sourceKind: 'hidden',
    value: '{"grant_type": "client_credentials", "resource": "https://cognitiveservices.azure.com/"}',
    required: false, hidden: true, locked: true,
  },
  {
    key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'hidden',
    sourceKind: 'hidden', value: 'body', required: false, hidden: true, locked: true,
  },
  {
    key: 'customScopes', n8nKey: 'customScopes', label: 'Custom Scopes', kind: 'boolean',
    sourceKind: 'boolean', value: false, required: false, locked: true,
    description:
      'Define custom scopes. You might need this if the default scopes are not sufficient or if you want to minimize permissions. Ensure you include "openid" and "offline_access".',
  },
  {
    key: 'authQueryParameters', n8nKey: 'authQueryParameters',
    label: 'Auth URI Query Parameters', kind: 'hidden', sourceKind: 'hidden',
    value: '', required: false, hidden: true, locked: true, placeholder: '',
    description:
      'For some services additional query parameters have to be set which can be defined here',
  },
  {
    key: 'enabledScopes', n8nKey: 'enabledScopes', label: 'Enabled Scopes', kind: 'text',
    sourceKind: 'string', value: 'openid offline_access', required: false, locked: true,
    showWhen: { customScopes: [true] }, placeholder: 'openid offline_access',
    description: 'Space-separated list of scopes to request.',
  },
  {
    key: 'scope', n8nKey: 'scope', label: 'Scope', kind: 'hidden', sourceKind: 'hidden',
    value: '={{ $self.customScopes ? $self.enabledScopes : "openid offline_access"}}',
    required: false, hidden: true, locked: true, expressionAllowed: true,
  },
];

const entraCredentialDefinition = {
  type: 'azureEntraCognitiveServicesOAuth2Api',
  name: 'Azure Entra ID (Azure Active Directory) API',
  required: true,
  extends: ['oAuth2Api'],
  documentationSlug: 'azureentracognitiveservicesoauth2api',
  sourcePath:
    'packages/@n8n/nodes-langchain/credentials/AzureEntraCognitiveServicesOAuth2Api.credentials.ts',
  extendsSourcePath: 'packages/nodes-base/credentials/OAuth2Api.credentials.ts',
  ownFields: azureEntraOwnFields,
  inheritedFields: inheritedOAuth2Fields,
  fields: [...inheritedOAuth2Fields, ...azureEntraOwnFields],
  oauth: {
    grantType: 'authorizationCode',
    tokenCredentialAdapter:
      'packages/@n8n/nodes-langchain/nodes/llms/LmChatAzureOpenAi/credentials/N8nOAuth2TokenCredential.ts',
    azureScope: 'https://cognitiveservices.azure.com/.default',
    inert: true,
  },
  simulationNote:
    'The effective OAuth2 credential schema, authorization URLs, client credentials, scopes, and token flow are locked metadata and never execute.',
};

const azureOpenAiChatModel = {
  type: 'azure-openai-chat-model',
  n8nType: '@n8n/n8n-nodes-langchain.lmChatAzureOpenAi',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'Azure OpenAI Chat Model',
  defaultName: 'Azure OpenAI Chat Model',
  subtitle: '',
  description: 'For advanced usage with an AI chain',
  details:
    'Choose API-key or Azure Entra authentication, enter an Azure model deployment, and author completion controls for a Language Model sub-node. Nothing authenticates or invokes Azure OpenAI here.',
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
  usableAsTool: false,
  icon: '/node-icons/azure-openai-chat-model.svg',
  n8nIcon: 'file:azure.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 256, height: 242, viewBox: null },
  iconAssetSha256: '18cdc65cfa26fc9b74b49aa676f7751ac68096189369b765bb12b0cb4d354f54',
  aliases: [],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatazureopenai/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/llms/LmChatAzureOpenAi/LmChatAzureOpenAi.node.ts',
    propertiesPath:
      'packages/@n8n/nodes-langchain/nodes/llms/LmChatAzureOpenAi/properties.ts',
    typesPath:
      'packages/@n8n/nodes-langchain/nodes/llms/LmChatAzureOpenAi/types.ts',
    apiKeyHandlerPath:
      'packages/@n8n/nodes-langchain/nodes/llms/LmChatAzureOpenAi/credentials/api-key.ts',
    oauthHandlerPath:
      'packages/@n8n/nodes-langchain/nodes/llms/LmChatAzureOpenAi/credentials/oauth2.ts',
    oauthTokenCredentialPath:
      'packages/@n8n/nodes-langchain/nodes/llms/LmChatAzureOpenAi/credentials/N8nOAuth2TokenCredential.ts',
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    apiKeyCredentialPath: apiKeyCredentialDefinition.sourcePath,
    entraCredentialPath: entraCredentialDefinition.sourcePath,
    oauthBaseCredentialPath: entraCredentialDefinition.extendsSourcePath,
    packagePath: 'packages/@n8n/nodes-langchain/package.json',
    iconPath:
      'packages/@n8n/nodes-langchain/nodes/llms/LmChatAzureOpenAi/azure.svg',
    directDescriptionImports: [
      { module: './properties', names: ['properties'] },
      { module: './types', names: ['AuthenticationType'] },
      {
        module: '@n8n/ai-utilities',
        names: ['getConnectionHintNoticeField'],
        via: './properties',
      },
    ],
    runtimeImportsExcluded: [
      { module: '@langchain/openai', names: ['AzureChatOpenAI'] },
      {
        module: '@n8n/ai-utilities',
        names: ['getProxyAgent', 'makeN8nLlmFailedAttemptHandler', 'N8nLlmTracing'],
      },
      { module: './credentials/api-key', names: ['setupApiKeyAuthentication'] },
      { module: './credentials/oauth2', names: ['setupOAuth2Authentication'] },
      { module: 'n8n-workflow', names: ['NodeOperationError'] },
    ],
  },
  defaults: { name: 'Azure OpenAI Chat Model' },
  credentials: [
    {
      name: 'azureOpenAiApi', type: 'azureOpenAiApi', displayName: 'Azure Open AI',
      required: true, locked: true, showWhen: { authentication: ['azureOpenAiApi'] },
      sourcePath: apiKeyCredentialDefinition.sourcePath,
    },
    {
      name: 'azureEntraCognitiveServicesOAuth2Api',
      type: 'azureEntraCognitiveServicesOAuth2Api',
      displayName: 'Azure Entra ID (Azure Active Directory) API', required: true, locked: true,
      showWhen: { authentication: ['azureEntraCognitiveServicesOAuth2Api'] },
      sourcePath: entraCredentialDefinition.sourcePath,
    },
  ],
  credentialRequirements: [
    {
      type: 'azureOpenAiApi', name: 'Azure Open AI', required: true, locked: true,
      showWhen: { authentication: ['azureOpenAiApi'] },
    },
    {
      type: 'azureEntraCognitiveServicesOAuth2Api',
      name: 'Azure Entra ID (Azure Active Directory) API', required: true, locked: true,
      showWhen: { authentication: ['azureEntraCognitiveServicesOAuth2Api'] },
    },
  ],
  credentialUiMetadata: [apiKeyCredentialDefinition, entraCredentialDefinition],
  params: [
    {
      key: 'azureApiKeyCredential', n8nKey: 'credentials.azureOpenAiApi',
      sourceN8nKey: 'credentials', label: 'Credentials', kind: 'select',
      sourceKind: 'credentials', value: 'azureOpenAiApi', required: true, locked: true,
      showWhen: { authentication: ['azureOpenAiApi'] },
      n8nShowWhen: { authentication: ['azureOpenAiApi'] },
      dynamicOptions: { source: 'credentialStore', credentialType: 'azureOpenAiApi', inert: true },
      options: [{ label: 'Azure Open AI', value: 'azureOpenAiApi' }],
      simulationNote: 'The API-key credential selector is locked and never accesses credentials.',
    },
    {
      key: 'azureEntraCredential',
      n8nKey: 'credentials.azureEntraCognitiveServicesOAuth2Api',
      sourceN8nKey: 'credentials', label: 'Credentials', kind: 'select',
      sourceKind: 'credentials', value: 'azureEntraCognitiveServicesOAuth2Api',
      required: true, locked: true,
      showWhen: { authentication: ['azureEntraCognitiveServicesOAuth2Api'] },
      n8nShowWhen: { authentication: ['azureEntraCognitiveServicesOAuth2Api'] },
      dynamicOptions: {
        source: 'credentialStore', credentialType: 'azureEntraCognitiveServicesOAuth2Api',
        inert: true,
      },
      options: [
        {
          label: 'Azure Entra ID (Azure Active Directory) API',
          value: 'azureEntraCognitiveServicesOAuth2Api',
        },
      ],
      simulationNote: 'The Entra OAuth2 credential selector is locked and never starts OAuth.',
    },
    {
      key: 'authentication', n8nKey: 'authentication', sourceN8nKey: 'authentication',
      label: 'Authentication', kind: 'select', sourceKind: 'options', value: 'azureOpenAiApi',
      required: false,
      options: [
        { label: 'API Key', value: 'azureOpenAiApi' },
        {
          label: 'Azure Entra ID (OAuth2)',
          value: 'azureEntraCognitiveServicesOAuth2Api',
        },
      ],
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
      key: 'jsonResponseNotice', n8nKey: 'notice', sourceN8nKey: 'notice',
      label:
        'If using JSON response format, you must include word "json" in the prompt in your chain or agent. Also, make sure to select latest models released post November 2023.',
      kind: 'notice', sourceKind: 'notice', value: '', required: false,
      showWhen: { 'options.responseFormat': ['json_object'] },
      n8nShowWhen: { '/options.responseFormat': ['json_object'] },
    },
    {
      key: 'model', n8nKey: 'model', sourceN8nKey: 'model',
      label: 'Model (Deployment) Name', kind: 'expression', sourceKind: 'string', value: '',
      required: true, expressionAllowed: true,
      description: 'The name of the model(deployment) to use (e.g., gpt-4, gpt-35-turbo)',
      optionSource: 'freeform deployment name', remoteLookup: false,
      simulationNote:
        'The deployment name and expression syntax are stored without lookup, evaluation, or model access.',
    },
    {
      key: 'options', n8nKey: 'options', sourceN8nKey: 'options', label: 'Options',
      kind: 'collection', sourceKind: 'collection', value: {}, sourceDefault: {},
      required: false, addLabel: 'Add Option', placeholder: 'Add Option',
      description: 'Additional options to add',
      fields: [
        {
          key: 'frequencyPenalty', n8nKey: 'options.frequencyPenalty',
          sourceN8nKey: 'frequencyPenalty', label: 'Frequency Penalty', kind: 'number',
          sourceKind: 'number', value: 0, required: false, min: -2, max: 2, precision: 1,
          description:
            "Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim",
        },
        {
          key: 'maxTokens', n8nKey: 'options.maxTokens', sourceN8nKey: 'maxTokens',
          label: 'Maximum Number of Tokens', kind: 'number', sourceKind: 'number',
          value: -1, required: false, max: 128000,
          description:
            'The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 32,768). Use -1 for default.',
        },
        {
          key: 'responseFormat', n8nKey: 'options.responseFormat',
          sourceN8nKey: 'responseFormat', label: 'Response Format', kind: 'select',
          sourceKind: 'options', value: 'text', required: false,
          options: [
            { label: 'Text', value: 'text', description: 'Regular text response' },
            {
              label: 'JSON', value: 'json_object',
              description:
                'Enables JSON mode, which should guarantee the message the model generates is valid JSON',
            },
          ],
        },
        {
          key: 'presencePenalty', n8nKey: 'options.presencePenalty',
          sourceN8nKey: 'presencePenalty', label: 'Presence Penalty', kind: 'number',
          sourceKind: 'number', value: 0, required: false, min: -2, max: 2, precision: 1,
          description:
            "Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics",
        },
        {
          key: 'temperature', n8nKey: 'options.temperature', sourceN8nKey: 'temperature',
          label: 'Sampling Temperature', kind: 'number', sourceKind: 'number',
          value: 0.7, required: false, min: 0, max: 2, precision: 1,
          description:
            'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
        },
        {
          key: 'timeout', n8nKey: 'options.timeout', sourceN8nKey: 'timeout',
          label: 'Timeout (Ms)', kind: 'number', sourceKind: 'number', value: 60000,
          required: false,
          description: 'Maximum amount of time a request is allowed to take in milliseconds',
        },
        {
          key: 'maxRetries', n8nKey: 'options.maxRetries', sourceN8nKey: 'maxRetries',
          label: 'Max Retries', kind: 'number', sourceKind: 'number', value: 2,
          required: false, description: 'Maximum number of retries to attempt on failure',
        },
        {
          key: 'topP', n8nKey: 'options.topP', sourceN8nKey: 'topP', label: 'Top P',
          kind: 'number', sourceKind: 'number', value: 1, required: false,
          min: 0, max: 1, precision: 1,
          description:
            'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. We generally recommend altering this or temperature but not both.',
        },
      ],
    },
  ],
  authoringParity: {
    currentVersion: 1,
    resourceCount: 0,
    operationCount: 0,
    topLevelFieldCount: 7,
    recursiveFieldCount: 15,
    sourceVisibleFieldCount: 13,
    credentialSelectorCount: 2,
    apiKeyCredentialEditorFieldCount: 4,
    entraOwnCredentialFieldCount: 13,
    entraInheritedCredentialFieldCount: 8,
    entraEffectiveCredentialFieldCount: 21,
    credentialEditorFieldCount: 25,
    totalAuthoringFieldCount: 40,
    authenticationValues: ['azureOpenAiApi', 'azureEntraCognitiveServicesOAuth2Api'],
    deploymentSource: 'required freeform string',
    optionFields: [
      'frequencyPenalty', 'maxTokens', 'responseFormat', 'presencePenalty',
      'temperature', 'timeout', 'maxRetries', 'topP',
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
    loadOptionsMethods: [],
    resourceLocatorMethods: [],
    credentialSelectors: ['azureApiKeyCredential', 'azureEntraCredential'],
    dynamicModelFields: [],
    freeformDeploymentFields: ['model'],
    lockedFields: ['azureApiKeyCredential', 'azureEntraCredential'],
    remoteDynamicFields: ['azureApiKeyCredential', 'azureEntraCredential'],
  },
  excludedHistoricalAuthoring: [],
  excludedDormantAuthoring: [],
  rendererNormalizations: [
    {
      n8nKey: 'credentials.azureOpenAiApi', sourceType: 'conditional credential selector',
      normalizedKind: 'locked select',
    },
    {
      n8nKey: 'credentials.azureEntraCognitiveServicesOAuth2Api',
      sourceType: 'conditional OAuth2 credential selector', normalizedKind: 'locked select',
    },
    {
      n8nKey: 'notice', normalizedKeys: ['chainConnectionNotice', 'jsonResponseNotice'],
      reason: 'Two native notice fields share the same source name and use unique catalog keys.',
    },
    {
      n8nKey: 'model', sourceType: 'required expression-capable string',
      normalizedKind: 'expression',
    },
    {
      n8nKey: 'credentials.azureOpenAiApi.endpoint', sourceDefault: 'undefined',
      normalizedDefault: '',
    },
    {
      n8nKey: 'credentials.azureEntraCognitiveServicesOAuth2Api.endpoint',
      sourceDefault: 'undefined', normalizedDefault: '',
    },
  ],
  platformGaps: [
    'Both conditional credential selectors and the complete API-key and effective Entra OAuth2 credential schemas are locked and inert.',
    'OAuth authorization, client credential exchange, token refresh, scope resolution, and deployment-detail retrieval never run.',
    'The deployment name is a freeform string in the pinned source; no dynamic deployment or model lookup exists to lock.',
    'Credential and node expressions are stored without evaluation.',
    'AzureChatOpenAI construction, completions calls, proxy setup, tracing, retries, JSON formatting, logging, and error handling never run.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials.azureOpenAiApi', sourceType: 'credentials', normalizedKind: 'locked select' },
    {
      n8nKey: 'credentials.azureEntraCognitiveServicesOAuth2Api',
      sourceType: 'OAuth2 credentials', normalizedKind: 'locked select',
    },
    { n8nKey: 'notice', sourceType: 'generated connection-hint notice', normalizedKind: 'notice' },
  ],
  simulation: {
    configurationOnly: true,
    credentialCreation: false,
    credentialAccess: false,
    credentialTesting: false,
    authentication: false,
    oauthAuthorization: false,
    tokenExchange: false,
    tokenRefresh: false,
    dynamicLookups: false,
    modelListing: false,
    deploymentListing: false,
    expressionResolution: false,
    modelInvocation: false,
    languageModelOutput: false,
    proxyCreation: false,
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

export default azureOpenAiChatModel;
