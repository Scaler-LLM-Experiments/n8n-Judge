// Editor-only descriptor for deprecated Auto-fixing Output Parser v1.
// Expressions, parsing, model calls, retries, APIs, and execution stay inert.

const retryPrompt = `Instructions:
--------------
{instructions}
--------------
Completion:
--------------
{completion}
--------------

Above, the Completion did not satisfy the constraints given in the Instructions.
Error:
--------------
{error}
--------------

Please try again. Please only respond with an answer that satisfies the constraints laid out in the Instructions:`;

const languageModelInput = {
  type: 'ai_languageModel',
  connector: 'ai_languageModel',
  label: 'Model',
  displayName: 'Model',
  required: true,
  maxConnections: 1,
};

const outputParserInput = {
  type: 'ai_outputParser',
  connector: 'ai_outputParser',
  label: 'Output Parser',
  displayName: 'Output Parser',
  required: true,
  maxConnections: 1,
};

const outputParserOutput = {
  type: 'ai_outputParser',
  connector: 'ai_outputParser',
  label: 'Output Parser',
  displayName: 'Output Parser',
  required: true,
};

const autoFixingOutputParser = {
  type: 'auto-fixing-output-parser',
  n8nType: '@n8n/n8n-nodes-langchain.outputParserAutofixing',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  sourceVersionDeclaration: 1,
  versionConditions: [],
  label: 'Auto-fixing Output Parser',
  defaultName: 'Auto-fixing Output Parser',
  subtitle: '',
  description: 'Deprecated, use structured output parser',
  details:
    'Wrap an output parser with an editable retry prompt for malformed model output. This deprecated catalog entry never parses text, calls a model, or retries a completion.',
  deprecated: true,
  clusterRole: 'sub',
  category: 'core',
  libraryCategory: 'ai',
  categories: ['AI'],
  subcategory: 'Output Parsers',
  subcategories: ['Output Parsers'],
  subcategoryMap: { AI: ['Output Parsers'] },
  group: ['transform'],
  inputs: [languageModelInput, outputParserInput],
  outputs: [outputParserOutput],
  outputNames: ['Output Parser'],
  aiConnectorPorts: [languageModelInput, outputParserInput, outputParserOutput],
  builderHint: {
    inputs: {
      ai_languageModel: { required: true },
      ai_outputParser: { required: true },
    },
  },
  usableAsTool: false,
  icon: '/node-icons/auto-fixing-output-parser.svg',
  n8nIcon: 'fa:tools',
  iconColor: 'black',
  iconHex: '#000000',
  iconMode: 'currentColor',
  iconAssetType: 'svg',
  iconAssetSize: { width: 24, height: 24, viewBox: '0 0 24 24' },
  iconAssetSha256: '0be43b9ffccbd5f7a830f15ef29d661786f5379d7d4ecd0d608e2e4d8ae932d5',
  aliases: [],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparserautofixing/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/output_parser/OutputParserAutofixing/OutputParserAutofixing.node.ts',
    promptPath:
      'packages/@n8n/nodes-langchain/nodes/output_parser/OutputParserAutofixing/prompt.ts',
    outputParserPath:
      'packages/@n8n/nodes-langchain/utils/output_parsers/N8nOutputParser.ts',
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    iconMappingPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/icons.ts',
    iconVirtualImport: '~icons/lucide/wrench',
    iconPackage: '@iconify-json/lucide@1.2.114',
    iconPackageLockPath: 'pnpm-lock.yaml',
    directDescriptionImports: [
      {
        module: '@n8n/ai-utilities',
        names: ['getConnectionHintNoticeField'],
        arguments: ['ai_chain', 'ai_agent'],
        contributions: ['AI Chain or AI Agent connection notice'],
      },
      {
        module: './prompt',
        names: ['NAIVE_FIX_PROMPT'],
        contributions: ['Options > Retry Prompt default'],
      },
    ],
    versionWrappers: [],
    credentialDefinitions: [],
    dynamicOptionDefinitions: [],
    runtimeImportsExcluded: [
      {
        module: '@langchain/core/language_models/base',
        names: ['BaseLanguageModel'],
        typeOnly: true,
      },
      { module: '@langchain/core/prompts', names: ['PromptTemplate'] },
      {
        module: '@utils/output_parsers/N8nOutputParser',
        names: ['N8nOutputFixingParser', 'N8nStructuredOutputParser'],
      },
      { module: 'n8n-workflow', names: ['NodeOperationError'] },
    ],
    runtimeFunctionsExcluded: ['supplyData'],
  },
  defaults: { name: 'Auto-fixing Output Parser' },
  credentials: [],
  credentialRequirements: [],
  credentialUiMetadata: [],
  methods: {},
  params: [
    {
      key: 'info',
      n8nKey: 'info',
      sourceN8nKey: 'info',
      label:
        'This node wraps another output parser. If the first one fails it calls an LLM to fix the format',
      kind: 'notice',
      sourceKind: 'notice',
      value: '',
      required: false,
    },
    {
      key: 'connectionNotice',
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
          key: 'prompt',
          n8nKey: 'options.prompt',
          sourceN8nKey: 'prompt',
          label: 'Retry Prompt',
          kind: 'textarea',
          sourceKind: 'string:rows=10',
          value: retryPrompt,
          required: false,
          rows: 10,
          expressionAllowed: true,
          hint: 'Should include "{error}", "{instructions}", and "{completion}" placeholders',
          description:
            'Prompt template used for fixing the output. Uses placeholders: "{instructions}" for parsing rules, "{completion}" for the failed attempt, and "{error}" for the validation error message.',
          simulationNote:
            'The retry prompt and expression syntax are stored without placeholder validation, template construction, parsing, model calls, or retries.',
        },
      ],
    },
  ],
  authoringParity: {
    sourcePath:
      'packages/@n8n/nodes-langchain/nodes/output_parser/OutputParserAutofixing/OutputParserAutofixing.node.ts',
    currentVersion: 1,
    defaultVersion: 1,
    sourceVersionDeclarationKind: 'number',
    resourceCount: 0,
    operationCount: 0,
    topLevelFieldCount: 3,
    recursiveFieldCount: 4,
    sourceVisibleFieldCount: 4,
    credentialSelectorCount: 0,
    credentialEditorFieldCount: 0,
    totalAuthoringFieldCount: 4,
    dynamicFieldCount: 0,
    optionCollectionFieldCount: 1,
    selectableOptionCount: 0,
    currentSourceFieldKeys: ['info', 'notice', 'options', 'options.prompt'],
  },
  portParity: {
    inputCount: 2,
    outputCount: 1,
    inputs: ['Model', 'Output Parser'],
    inputConnectionTypes: ['ai_languageModel', 'ai_outputParser'],
    inputCaps: [
      { type: 'ai_languageModel', maxConnections: 1, required: true },
      { type: 'ai_outputParser', maxConnections: 1, required: true },
    ],
    outputs: ['Output Parser'],
    outputConnectionTypes: ['ai_outputParser'],
    outputCaps: [{ type: 'ai_outputParser', maxConnections: null, sourceCap: 'unspecified' }],
  },
  dynamicAuthoringMetadata: {
    loadOptionsMethods: [],
    listSearchMethods: [],
    credentialSelectors: [],
    lockedFields: [],
    remoteDynamicFields: [],
  },
  excludedHistoricalAuthoring: [],
  excludedDormantAuthoring: [],
  rendererNormalizations: [
    {
      n8nKey: 'notice',
      sourceType: 'getConnectionHintNoticeField([ai_chain, ai_agent])',
      normalizedKind: 'notice with inert AI creator action metadata',
    },
    {
      n8nKey: 'options.prompt',
      sourceType: 'string with rows=10',
      normalizedKind: 'textarea retaining the exact imported prompt default',
    },
    {
      n8nKey: 'icon',
      sourceType: 'fa:tools',
      normalizedKind: 'pinned Lucide wrench SVG via the n8n design-system icon registry',
    },
  ],
  platformGaps: [
    'The two required capped AI inputs and output-parser connector are declarative ports only and never read connected data.',
    'The retry prompt is editable inert text; required placeholder checks and PromptTemplate construction never run.',
    'No parser wraps another parser, validates output, handles exceptions, invokes a language model, or retries a completion.',
    'Connection actions, expressions, APIs, webhooks, polling, workflow execution, and voice behavior remain inert.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'notice',
      sourceType: 'generated connection-hint notice',
      normalizedKind: 'notice',
    },
  ],
  simulation: {
    configurationOnly: true,
    credentialCreation: false,
    credentialAccess: false,
    credentialTesting: false,
    authentication: false,
    dynamicLookups: false,
    expressionResolution: false,
    inputConnectionAccess: false,
    promptValidation: false,
    promptTemplateConstruction: false,
    parsing: false,
    parserWrapping: false,
    exceptionHandling: false,
    modelInvocation: false,
    retryInvocation: false,
    outputParserSupply: false,
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

export default autoFixingOutputParser;
