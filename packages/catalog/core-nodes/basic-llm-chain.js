// Editor-only descriptor for @n8n/n8n-nodes-langchain Basic LLM Chain v1.9.
// Prompts, expressions, models, parsers, images, batching, and execution stay inert.

const mainInput = { type: 'main', label: '', displayName: '' };
const modelInput = {
  type: 'ai_languageModel',
  connector: 'ai_languageModel',
  label: 'Model',
  displayName: 'Model',
  maxConnections: 1,
  required: true,
};
const fallbackModelInput = {
  type: 'ai_languageModel',
  connector: 'ai_languageModel',
  label: 'Fallback Model',
  displayName: 'Fallback Model',
  maxConnections: 1,
  required: true,
};
const outputParserInput = {
  type: 'ai_outputParser',
  connector: 'ai_outputParser',
  label: 'Output Parser',
  displayName: 'Output Parser',
  maxConnections: 1,
  required: false,
};

const basicLlmChain = {
  type: 'basic-llm-chain',
  n8nType: '@n8n/n8n-nodes-langchain.chainLlm',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1.9,
  defaultVersion: 1.9,
  versionHistory: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9],
  label: 'Basic LLM Chain',
  defaultName: 'Basic LLM Chain',
  subtitle: '',
  description: 'A simple chain to prompt a large language model',
  details:
    'Author a prompt, optional chat messages, model fallback, output parser, and batch settings. This catalog entry never invokes any of them.',
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
      showWhen: { needsFallback: [true], hasOutputParser: [true] },
      inputs: [mainInput, modelInput, fallbackModelInput, outputParserInput],
      outputs: [{ type: 'main' }],
    },
    {
      showWhen: { needsFallback: [true] },
      inputs: [mainInput, modelInput, fallbackModelInput],
      outputs: [{ type: 'main' }],
    },
    {
      showWhen: { hasOutputParser: [true] },
      inputs: [mainInput, modelInput, outputParserInput],
      outputs: [{ type: 'main' }],
    },
  ],
  dynamicInputMetadata: {
    sourceTemplate:
      '={{ ((parameter) => { ${getInputs.toString()}; return getInputs(parameter) })($parameter) }}',
    parameters: ['needsFallback', 'hasOutputParser'],
    order: ['main', 'Model', 'Fallback Model', 'Output Parser'],
    defaultInputs: ['main', 'Model'],
    fallbackCondition: { needsFallback: [true] },
    parserCondition: { hasOutputParser: [true] },
    legacyParserBehavior:
      'When hasOutputParser is undefined (v1.3 or earlier), n8n adds the optional Output Parser input.',
    currentVersionBehavior:
      'At v1.9 the required Model input is always present; Fallback Model and Output Parser are added only by their respective toggles.',
    declarativeOnly: true,
  },
  aiConnectorPorts: [
    {
      id: 'model',
      type: 'ai_languageModel',
      connector: 'ai_languageModel',
      label: 'Model',
      maxConnections: 1,
      required: true,
    },
    {
      id: 'fallbackModel',
      type: 'ai_languageModel',
      connector: 'ai_languageModel',
      label: 'Fallback Model',
      maxConnections: 1,
      required: true,
      showWhen: { needsFallback: [true] },
    },
    {
      id: 'outputParser',
      type: 'ai_outputParser',
      connector: 'ai_outputParser',
      label: 'Output Parser',
      maxConnections: 1,
      required: false,
      showWhen: { hasOutputParser: [true] },
    },
  ],
  builderHint: {
    inputs: {
      ai_languageModel: { required: true },
      ai_outputParser: {
        required: false,
        displayOptions: { show: { hasOutputParser: [true] } },
      },
    },
  },
  credentials: [],
  usableAsTool: false,
  icon: '/node-icons/basic-llm-chain.svg',
  n8nIcon: 'node:basic-llm-chain',
  iconMode: 'currentColor',
  iconColor: 'black',
  iconHex: '#000000',
  iconAssetType: 'svg',
  iconAssetSize: { width: 24, height: 24, viewBox: '0 0 24 24' },
  iconAssetSha256: '2e8b8022837888929cd6a3a0242e8f4ecf1d4a2a351f11e23d8d01d4d406a4cf',
  aliases: ['LangChain'],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/@n8n/nodes-langchain/nodes/chains/ChainLLM/ChainLlm.node.ts',
    descriptionPath:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainLLM/methods/config.ts',
    sharedDescriptionPath: 'packages/@n8n/nodes-langchain/utils/descriptions.ts',
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    outputSchemaPath:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainLLM/__schema__/v1.9.0/output.json',
    parserOutputSchemaPath:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainLLM/__schema__/v1.9.0/output.with-parser.json',
    promptUtilityPath:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainLLM/methods/promptUtils.ts',
    responseFormatterPath:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainLLM/methods/responseFormatter.ts',
    processPath:
      'packages/@n8n/nodes-langchain/nodes/chains/ChainLLM/methods/processItem.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/basic-llm-chain.svg',
    directDescriptionImports: [
      {
        module: '@utils/descriptions',
        names: [
          'promptTypeOptions',
          'promptTypeOptionsDeprecated',
          'textFromGuardrailsNode',
          'textFromPreviousNode',
        ],
      },
      {
        module: '@n8n/ai-utilities',
        names: ['getBatchingOptionFields', 'getTemplateNoticeField'],
      },
    ],
    authoringValueImports: [
      {
        module: '@langchain/core/prompts',
        names: [
          'AIMessagePromptTemplate',
          'HumanMessagePromptTemplate',
          'SystemMessagePromptTemplate',
        ],
        contribution: 'Message role option values from lc_name()',
      },
      {
        module: 'n8n-workflow',
        names: ['NodeConnectionTypes'],
        contribution: 'Main, AI Language Model, and AI Output Parser connection types',
      },
    ],
  },
  defaults: { name: 'Basic LLM Chain' },
  params: [
    {
      key: 'templateNotice',
      n8nKey: 'notice',
      label:
        'Save time with an <a href="/templates/1978" target="_blank">example</a> of how this node works',
      kind: 'notice',
      sourceKind: 'notice',
      value: '',
      required: false,
      templateId: 1978,
    },
    {
      key: 'promptType',
      n8nKey: 'promptType',
      label: 'Source for Prompt (User Message)',
      kind: 'select',
      sourceKind: 'options',
      value: 'auto',
      required: false,
      sourceVersionCondition: '@version >= 1.8',
      options: [
        {
          label: 'Connected Chat Trigger Node',
          value: 'auto',
          description:
            "Looks for an input field called 'chatInput' that is coming from a directly connected Chat Trigger",
        },
        {
          label: 'Define below',
          value: 'define',
          description: 'Use an expression to reference data in previous nodes or enter static text',
        },
      ],
      builderHint: {
        propertyHint: "Use 'auto' when following a chat trigger, 'define' when custom prompt needed",
      },
    },
    {
      key: 'automaticPromptText',
      n8nKey: 'text',
      label: 'Prompt (User Message)',
      kind: 'expression',
      sourceKind: 'string:rows=2',
      value: '={{ $json.chatInput }}',
      required: true,
      rows: 2,
      readOnly: true,
      sourceDisabledWhen: { promptType: ['auto'] },
      showWhen: { promptType: ['auto'] },
      n8nShowWhen: { promptType: ['auto'], '@version': [{ _cnd: { gte: 1.5 } }] },
      sourceVersionCondition: '@version >= 1.5',
      simulationNote:
        'The default expression is displayed only; it is never evaluated and chatInput is never read.',
    },
    {
      key: 'definedPromptText',
      n8nKey: 'text',
      label: 'Prompt (User Message)',
      kind: 'textarea',
      sourceKind: 'string:rows=2',
      value: '',
      required: true,
      rows: 2,
      placeholder: 'e.g. Hello, how can you help me?',
      expressionAllowed: true,
      showWhen: { promptType: ['define'] },
      n8nShowWhen: { promptType: ['define'] },
      builderHint: {
        propertyHint:
          "Use expressions to include dynamic data from previous nodes (e.g., expr('{{ $json.input }}')). Static text prompts ignore incoming data.",
      },
      simulationNote: 'Prompt text and expression syntax are stored but never resolved or sent to a model.',
    },
    {
      key: 'hasOutputParser',
      n8nKey: 'hasOutputParser',
      label: 'Require Specific Output Format',
      kind: 'boolean',
      sourceKind: 'boolean',
      value: false,
      required: false,
      noDataExpression: true,
    },
    {
      key: 'needsFallback',
      n8nKey: 'needsFallback',
      label: 'Enable Fallback Model',
      kind: 'boolean',
      sourceKind: 'boolean',
      value: false,
      required: false,
      noDataExpression: true,
    },
    {
      key: 'messages',
      n8nKey: 'messages',
      label: 'Chat Messages (if Using a Chat Model)',
      kind: 'fixedCollection',
      sourceKind: 'fixedCollection',
      value: {},
      sourceDefault: {},
      required: false,
      collectionKey: 'messageValues',
      collectionLabel: 'Prompt',
      multiple: true,
      addLabel: 'Add prompt',
      placeholder: 'Add prompt',
      fields: [
        {
          key: 'messageRole',
          n8nKey: 'messages.messageValues.type',
          sourceN8nKey: 'type',
          label: 'Type Name or ID',
          kind: 'select',
          sourceKind: 'options',
          value: 'SystemMessagePromptTemplate',
          required: false,
          options: [
            { label: 'AI', value: 'AIMessagePromptTemplate' },
            { label: 'System', value: 'SystemMessagePromptTemplate' },
            { label: 'User', value: 'HumanMessagePromptTemplate' },
          ],
        },
        {
          key: 'messageContentType',
          n8nKey: 'messages.messageValues.messageType',
          sourceN8nKey: 'messageType',
          label: 'Message Type',
          kind: 'select',
          sourceKind: 'options',
          value: 'text',
          required: false,
          showWhen: { messageRole: ['HumanMessagePromptTemplate'] },
          n8nShowWhen: { type: ['HumanMessagePromptTemplate'] },
          options: [
            { label: 'Text', value: 'text', description: 'Simple text message' },
            {
              label: 'Image (Binary)',
              value: 'imageBinary',
              description: 'Process the binary input from the previous node',
            },
            {
              label: 'Image (URL)',
              value: 'imageUrl',
              description: 'Process the image from the specified URL',
            },
          ],
        },
        {
          key: 'binaryImageDataKey',
          n8nKey: 'messages.messageValues.binaryImageDataKey',
          sourceN8nKey: 'binaryImageDataKey',
          label: 'Image Data Field Name',
          kind: 'text',
          sourceKind: 'string',
          value: 'data',
          required: true,
          showWhen: { messageContentType: ['imageBinary'] },
          n8nShowWhen: { messageType: ['imageBinary'] },
          description:
            "The name of the field in the chain's input that contains the binary image file to be processed",
          simulationNote: 'The field name is stored only; binary data is never read or processed.',
        },
        {
          key: 'imageUrl',
          n8nKey: 'messages.messageValues.imageUrl',
          sourceN8nKey: 'imageUrl',
          label: 'Image URL',
          kind: 'text',
          sourceKind: 'string',
          value: '',
          required: true,
          showWhen: { messageContentType: ['imageUrl'] },
          n8nShowWhen: { messageType: ['imageUrl'] },
          description: 'URL to the image to be processed',
          simulationNote: 'The URL is stored only; it is never fetched.',
        },
        {
          key: 'imageDetail',
          n8nKey: 'messages.messageValues.imageDetail',
          sourceN8nKey: 'imageDetail',
          label: 'Image Details',
          kind: 'select',
          sourceKind: 'options',
          value: 'auto',
          required: false,
          showWhen: {
            messageRole: ['HumanMessagePromptTemplate'],
            messageContentType: ['imageBinary', 'imageUrl'],
          },
          n8nShowWhen: {
            type: ['HumanMessagePromptTemplate'],
            messageType: ['imageBinary', 'imageUrl'],
          },
          description:
            'Control how the model processes the image and generates its textual understanding',
          options: [
            {
              label: 'Auto',
              value: 'auto',
              description:
                'Model will use the auto setting which will look at the image input size and decide if it should use the low or high setting',
            },
            {
              label: 'Low',
              value: 'low',
              description:
                'The model will receive a low-res 512px x 512px version of the image, and represent the image with a budget of 65 tokens. This allows the API to return faster responses and consume fewer input tokens for use cases that do not require high detail.',
            },
            {
              label: 'High',
              value: 'high',
              description:
                'Allows the model to see the low res image and then creates detailed crops of input images as 512px squares based on the input image size. Each of the detailed crops uses twice the token budget (65 tokens) for a total of 129 tokens.',
            },
          ],
          simulationNote: 'This preference is stored only; no image or model is invoked.',
        },
        {
          key: 'message',
          n8nKey: 'messages.messageValues.message',
          sourceN8nKey: 'message',
          label: 'Message',
          kind: 'text',
          sourceKind: 'string',
          value: '',
          required: true,
          hideWhen: { messageContentType: ['imageBinary', 'imageUrl'] },
          n8nHideWhen: { messageType: ['imageBinary', 'imageUrl'] },
          simulationNote: 'Message text and expression syntax are stored but never evaluated.',
        },
      ],
    },
    {
      key: 'batching',
      n8nKey: 'batching',
      label: 'Batch Processing',
      kind: 'collection',
      sourceKind: 'collection',
      value: {},
      sourceDefault: {},
      required: false,
      addLabel: 'Add Batch Processing Option',
      placeholder: 'Add Batch Processing Option',
      description: 'Batch processing options for rate limiting',
      sourceVersionCondition: '@version >= 1.7',
      fields: [
        {
          key: 'batchSize',
          n8nKey: 'batching.batchSize',
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
          n8nKey: 'batching.delayBetweenBatches',
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
      simulationNote: 'Batch settings are stored only; items are never read, grouped, delayed, or processed.',
    },
    {
      key: 'outputParserNotice',
      n8nKey: 'notice',
      label:
        "Connect an <a data-action='openSelectiveNodeCreator' data-action-parameter-connectiontype='ai_outputParser'>output parser</a> on the canvas to specify the output format you require",
      kind: 'notice',
      sourceKind: 'notice',
      value: '',
      required: false,
      showWhen: { hasOutputParser: [true] },
      n8nShowWhen: { hasOutputParser: [true] },
      simulationNote: 'The link is represented as authoring metadata; no parser is created.',
    },
    {
      key: 'fallbackNotice',
      n8nKey: 'fallbackNotice',
      label:
        'Connect an additional language model on the canvas to use it as a fallback if the main model fails',
      kind: 'notice',
      sourceKind: 'notice',
      value: '',
      required: false,
      showWhen: { needsFallback: [true] },
      n8nShowWhen: { needsFallback: [true] },
      simulationNote: 'The notice is inert; no fallback model is created or invoked.',
    },
  ],
  parameterParity: {
    sourceTopLevelPropertyCountAtVersion1_9: 11,
    representedCurrentTopLevelPropertyCount: 10,
    recursiveFieldCount: 18,
    representedCurrentSourceNames: [
      'notice',
      'promptType',
      'text',
      'text',
      'hasOutputParser',
      'needsFallback',
      'messages',
      'batching',
      'notice',
      'fallbackNotice',
    ],
    messageFieldCount: 6,
    batchingFieldCount: 2,
    resourceCount: 0,
    operationCount: 0,
    dynamicInputShapeCount: 4,
  },
  outputSchemas: [
    {
      showWhen: { hasOutputParser: [false] },
      schema: {
        type: 'object',
        required: ['text'],
        properties: {
          text: {
            type: 'string',
            description:
              'The final response text — the key is `text` (this node has NO `output` key), a plain string',
          },
        },
        version: 1,
      },
    },
    {
      showWhen: { hasOutputParser: [true] },
      schema: {
        type: 'object',
        required: ['output'],
        properties: {
          output: {
            type: 'object',
            description:
              "A parsed JSON object matching the attached output parser's schema — NOT a JSON-encoded string, and its fields must NOT appear at the top level next to `output`",
            additionalProperties: true,
          },
        },
        version: 1,
      },
    },
  ],
  historicalExclusions: [
    {
      versions: [1, 1.1, 1.2, 1.3],
      field: 'prompt',
      reason: 'The three version-specific legacy Prompt fields are not part of the v1.9 authoring pane.',
    },
    {
      versions: [1.4, 1.5, 1.6, 1.7],
      field: 'promptType',
      reason:
        'The deprecated source selector, including Connected Guardrails Node, is replaced by the current v1.8+ selector.',
    },
  ],
  rendererNormalizations: [
    {
      sourceType: 'string:rows=2',
      normalizedKinds: ['expression', 'textarea'],
      keys: ['automaticPromptText', 'definedPromptText'],
      reason:
        'Automatic source expressions stay inert expression controls; the editable two-row source string uses the catalog textarea.',
    },
    {
      sourceNames: ['text', 'notice'],
      reason:
        'Repeated native parameter names use unique catalog keys while n8nKey preserves their exact persisted name.',
    },
    {
      sourceType: 'fixedCollection',
      normalizedKind: 'fixedCollection',
      key: 'messages',
      reason:
        'Nested conditions reference unique catalog row keys; n8nShowWhen and n8nHideWhen retain the exact source conditions.',
    },
  ],
  platformGaps: [
    'The current selector no longer offers guardrails, so the unreachable persisted-value compatibility field is excluded from the authoring surface.',
    'Output schemas are retained declaratively; the simulation produces no output items.',
  ],
  simulation: {
    configurationOnly: true,
    readsInputItems: false,
    readsBinaryData: false,
    resolvesExpressions: false,
    readsCredentials: false,
    dynamicLookups: false,
    networkAccess: false,
    fetchesImages: false,
    invokesModels: false,
    invokesFallbackModels: false,
    invokesOutputParsers: false,
    processesBatches: false,
    createsTimers: false,
    sleeps: false,
    executes: false,
    webhooks: false,
    polling: false,
    voice: false,
  },
  output: { text: 'The refund request is valid and should be prioritised.' },
};

export default basicLlmChain;
