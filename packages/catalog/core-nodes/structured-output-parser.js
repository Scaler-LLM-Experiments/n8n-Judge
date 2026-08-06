// Editor-only descriptor for @n8n/n8n-nodes-langchain Structured Output Parser v1.3.
// Expressions, schema parsing, model calls, output parsing, retries, and execution stay inert.

const NAIVE_FIX_PROMPT = `Instructions:
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
  maxConnections: 1,
  required: true,
};

const outputParserOutput = {
  type: 'ai_outputParser',
  connector: 'ai_outputParser',
  label: 'Output Parser',
  displayName: 'Output Parser',
  required: true,
};

const structuredOutputParser = {
  type: 'structured-output-parser',
  n8nType: '@n8n/n8n-nodes-langchain.outputParserStructured',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1.3,
  defaultVersion: 1.3,
  versionHistory: [1, 1.1, 1.2, 1.3],
  sourceVersionDeclaration: [1, 1.1, 1.2, 1.3],
  label: 'Structured Output Parser',
  defaultName: 'Structured Output Parser',
  subtitle: '',
  description: 'Return data in a defined JSON format',
  details:
    'Configure a JSON example or JSON Schema and optional model-assisted retry metadata. This catalog entry never parses JSON, generates a schema, invokes a model, or fixes output.',
  clusterRole: 'sub',
  category: 'core',
  libraryCategory: 'ai',
  categories: ['AI'],
  subcategory: 'Output Parsers',
  subcategories: ['Output Parsers'],
  codexSubcategories: { AI: ['Output Parsers'] },
  group: ['transform'],
  inputs: [],
  outputs: [outputParserOutput],
  outputNames: ['Output Parser'],
  portVariants: [
    {
      showWhen: { autoFix: [false] },
      inputs: [],
      outputs: [outputParserOutput],
    },
    {
      showWhen: { autoFix: [true] },
      inputs: [languageModelInput],
      outputs: [outputParserOutput],
    },
  ],
  inputsExpression: `={{
			((parameters) => {
				if (parameters?.autoFix) {
					return [
						{ displayName: 'Model', maxConnections: 1, type: "ai_languageModel", required: true }
					];
				}

				return [];
			})($parameter)
		}}`,
  dynamicPorts: true,
  dynamicInputMetadata: {
    enabled: true,
    declarativeOnly: true,
    sourceExpression: 'inputs',
    parameterDependencies: ['autoFix'],
    defaultParameters: { autoFix: false },
    variants: [
      { condition: { autoFix: [false] }, inputs: [] },
      { condition: { autoFix: [true] }, inputs: [languageModelInput] },
    ],
  },
  dynamicOutputMetadata: {
    enabled: false,
    declarativeOnly: true,
    outputs: [outputParserOutput],
  },
  aiConnectorPorts: [
    {
      ...languageModelInput,
      id: 'model',
      direction: 'input',
      showWhen: { autoFix: [true] },
    },
    { ...outputParserOutput, id: 'outputParser', direction: 'output' },
  ],
  builderHint: {
    searchHint:
      'Output data is wrapped in an "output" key, e.g. { "output": { "state": "California", "cities": ["San Francisco"] } }',
    inputs: {
      ai_languageModel: {
        required: true,
        displayOptions: { show: { autoFix: [true] } },
      },
    },
    outputs: { ai_outputParser: { required: true } },
  },
  usableAsTool: false,
  credentials: [],
  credentialRequirements: [],
  credentialUiMetadata: [],
  icon: '/node-icons/structured-output-parser.svg',
  n8nIcon: 'node:structured-output-parser',
  iconMode: 'currentColor',
  iconColor: 'black',
  iconHex: '#000000',
  iconAssetType: 'svg',
  iconAssetSize: { width: 24, height: 24, viewBox: '0 0 24 24' },
  iconAssetSha256: '61983248ee9e7e77cd43ca0afae1a3e9e4fb3676bb44073b5584fb3650004528',
  aliases: ['json', 'zod'],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparserstructured/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/output_parser/OutputParserStructured/OutputParserStructured.node.ts',
    promptPath:
      'packages/@n8n/nodes-langchain/nodes/output_parser/OutputParserStructured/prompt.ts',
    descriptionHelpersPath: 'packages/@n8n/nodes-langchain/utils/descriptions.ts',
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    schemaParsingPath: 'packages/@n8n/nodes-langchain/utils/schemaParsing.ts',
    structuredParserPath:
      'packages/@n8n/nodes-langchain/utils/output_parsers/N8nStructuredOutputParser.ts',
    fixingParserPath:
      'packages/@n8n/nodes-langchain/utils/output_parsers/N8nOutputFixingParser.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/structured-output-parser.svg',
    iconRegistryPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/node-icons.ts',
    iconNameRegistryPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/node-icon-names.ts',
    directDescriptionImports: [
      {
        module: '@utils/descriptions',
        names: [
          'buildJsonSchemaExampleNotice',
          'inputSchemaField',
          'jsonSchemaExampleField',
          'schemaTypeField',
        ],
        contributions: [
          'Schema Type',
          'JSON Example',
          'required-properties notice',
          'Input Schema',
        ],
      },
      {
        module: '@n8n/ai-utilities',
        names: ['getConnectionHintNoticeField'],
        arguments: ['ai_chain', 'ai_agent'],
        contributions: ['AI Chain or AI Agent connection notice'],
      },
      { module: './prompt', names: ['NAIVE_FIX_PROMPT'], contributions: ['Custom Prompt default'] },
    ],
    helperFieldAudit: [
      {
        name: 'getConnectionHintNoticeField',
        activeAtVersion: 1.3,
        sourceCondition: 'always',
      },
      {
        name: 'schemaTypeField',
        activeAtVersion: 1.3,
        sourceCondition: '@version >= 1.2',
      },
      {
        name: 'jsonSchemaExampleField',
        activeAtVersion: 1.3,
        sourceCondition: 'schemaType=fromJson',
      },
      {
        name: 'buildJsonSchemaExampleNotice',
        activeAtVersion: 1.3,
        sourceCondition: '@version >= 1.3 and schemaType=fromJson',
      },
      {
        name: 'inputSchemaField',
        activeAtVersion: 1.3,
        sourceCondition: 'schemaType=manual',
      },
    ],
    runtimeImportsExcluded: [
      { module: '@langchain/core/language_models/base', names: ['BaseLanguageModel'] },
      { module: '@langchain/core/prompts', names: ['PromptTemplate'] },
      { module: 'n8n-workflow', names: ['jsonParse', 'NodeOperationError'] },
      {
        module: '@utils/output_parsers/N8nOutputParser',
        names: ['N8nOutputFixingParser', 'N8nStructuredOutputParser'],
      },
      {
        module: '@utils/schemaParsing',
        names: ['convertJsonSchemaToZod', 'generateSchemaFromExample'],
      },
    ],
    runtimeFunctionsExcluded: ['supplyData'],
  },
  defaults: { name: 'Structured Output Parser' },
  methods: {},
  params: [
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
      simulationNote: 'The connection action is retained as inert authoring metadata.',
    },
    {
      key: 'schemaType',
      n8nKey: 'schemaType',
      sourceN8nKey: 'schemaType',
      label: 'Schema Type',
      kind: 'select',
      sourceKind: 'options',
      value: 'fromJson',
      required: false,
      noDataExpression: true,
      expressionAllowed: false,
      description: 'How to specify the schema for the function',
      sourceVersionCondition: '@version >= 1.2',
      sourceDisplayOptions: { show: { '@version': [{ _cnd: { gte: 1.2 } }] } },
      options: [
        {
          label: 'Generate From JSON Example',
          value: 'fromJson',
          description: 'Generate a schema from an example JSON object',
        },
        {
          label: 'Define using JSON Schema',
          value: 'manual',
          description: 'Define the JSON schema manually',
        },
      ],
    },
    {
      key: 'jsonSchemaExample',
      n8nKey: 'jsonSchemaExample',
      sourceN8nKey: 'jsonSchemaExample',
      label: 'JSON Example',
      kind: 'textarea',
      sourceKind: 'json',
      editor: 'json',
      rows: 10,
      value: `{
	"state": "California",
	"cities": ["Los Angeles", "San Francisco", "San Diego"]
}`,
      required: false,
      noDataExpression: true,
      expressionAllowed: false,
      validateType: 'object',
      showWhen: { schemaType: ['fromJson'] },
      n8nShowWhen: { schemaType: ['fromJson'] },
      description: 'Example JSON object to use to generate the schema',
      simulationNote: 'JSON is stored as text and is never parsed or used to generate a schema.',
    },
    {
      key: 'jsonRequiredNotice',
      n8nKey: 'notice',
      sourceN8nKey: 'notice',
      label:
        "All properties will be required. To make them optional, use the 'JSON Schema' schema type instead",
      kind: 'notice',
      sourceKind: 'notice',
      value: '',
      required: false,
      showWhen: { schemaType: ['fromJson'] },
      n8nShowWhen: {
        '@version': [{ _cnd: { gte: 1.3 } }],
        schemaType: ['fromJson'],
      },
      sourceVersionCondition: '@version >= 1.3',
      sourceDisplayOptions: {
        show: {
          '@version': [{ _cnd: { gte: 1.3 } }],
          schemaType: ['fromJson'],
        },
      },
    },
    {
      key: 'inputSchema',
      n8nKey: 'inputSchema',
      sourceN8nKey: 'inputSchema',
      label: 'Input Schema',
      kind: 'textarea',
      sourceKind: 'json',
      editor: 'json',
      rows: 10,
      value: `{
	"type": "object",
	"properties": {
		"state": {
			"type": "string"
		},
		"cities": {
			"type": "array",
			"items": {
				"type": "string"
			}
		}
	}
}`,
      required: false,
      noDataExpression: false,
      expressionAllowed: true,
      validateType: 'object',
      showWhen: { schemaType: ['manual'] },
      n8nShowWhen: { schemaType: ['manual'] },
      description: 'Schema to use for the function',
      hint:
        'Use <a target="_blank" href="https://json-schema.org/">JSON Schema</a> format (<a target="_blank" href="https://json-schema.org/learn/miscellaneous-examples.html">examples</a>). $refs syntax is currently not supported.',
      simulationNote: 'Schema and expression text are stored without parsing or evaluation.',
    },
    {
      key: 'autoFix',
      n8nKey: 'autoFix',
      sourceN8nKey: 'autoFix',
      label: 'Auto-Fix Format',
      kind: 'boolean',
      sourceKind: 'boolean',
      value: false,
      required: false,
      description:
        'Whether to automatically fix the output when it is not in the correct format. Will cause another LLM call.',
      simulationNote:
        'The toggle changes only declarative port visibility; no output is checked or model called.',
    },
    {
      key: 'customizeRetryPrompt',
      n8nKey: 'customizeRetryPrompt',
      sourceN8nKey: 'customizeRetryPrompt',
      label: 'Customize Retry Prompt',
      kind: 'boolean',
      sourceKind: 'boolean',
      value: false,
      required: false,
      showWhen: { autoFix: [true] },
      n8nShowWhen: { autoFix: [true] },
      description:
        'Whether to customize the prompt used for retrying the output parsing. If disabled, a default prompt will be used.',
    },
    {
      key: 'prompt',
      n8nKey: 'prompt',
      sourceN8nKey: 'prompt',
      label: 'Custom Prompt',
      kind: 'textarea',
      sourceKind: 'string:rows=10',
      value: NAIVE_FIX_PROMPT,
      required: false,
      rows: 10,
      expressionAllowed: true,
      showWhen: { autoFix: [true], customizeRetryPrompt: [true] },
      n8nShowWhen: { autoFix: [true], customizeRetryPrompt: [true] },
      hint: 'Should include "{error}", "{instructions}", and "{completion}" placeholders',
      description:
        'Prompt template used for fixing the output. Uses placeholders: "{instructions}" for parsing rules, "{completion}" for the failed attempt, and "{error}" for the validation error message.',
      simulationNote: 'Prompt and expression text are stored and never evaluated or sent to a model.',
    },
  ],
  hints: [
    {
      message:
        'Fields that use $refs might have the wrong type, since this syntax is not currently supported',
      type: 'warning',
      location: 'outputPane',
      whenToDisplay: 'afterExecution',
      displayCondition:
        '={{ $parameter["schemaType"] === "manual" && $parameter["inputSchema"]?.includes("$ref") }}',
      inert: true,
      simulationNote: 'The display condition remains inert expression metadata.',
    },
  ],
  authoringParity: {
    currentVersion: 1.3,
    defaultVersion: 1.3,
    resourceCount: 0,
    operationCount: 0,
    topLevelFieldCount: 8,
    recursiveFieldCount: 8,
    sourceVisibleFieldCount: 8,
    credentialSelectorCount: 0,
    credentialEditorFieldCount: 0,
    totalAuthoringFieldCount: 8,
    dynamicFieldCount: 0,
    helperGeneratedFieldCount: 5,
    inlineCurrentFieldCount: 3,
    duplicateNativeKeys: {
      notice: ['connectionNotice', 'jsonRequiredNotice'],
    },
    currentSourceFieldKeys: [
      'notice',
      'schemaType',
      'jsonSchemaExample',
      'notice',
      'inputSchema',
      'autoFix',
      'customizeRetryPrompt',
      'prompt',
    ],
  },
  portParity: {
    variantCount: 2,
    defaultAutoFix: false,
    inputCount: 0,
    outputCount: 1,
    defaultInputs: [],
    defaultOutputs: ['Output Parser'],
    inputConnectionTypes: [],
    outputConnectionTypes: ['ai_outputParser'],
    autoFixInputs: ['Model'],
    autoFixInputConnectionTypes: ['ai_languageModel'],
    inputCaps: [{ type: 'ai_languageModel', maxConnections: 1 }],
    outputCaps: [{ type: 'ai_outputParser', maxConnections: null, sourceCap: 'unspecified' }],
  },
  dynamicAuthoringMetadata: {
    loadOptionsMethods: [],
    listSearchMethods: [],
    resourceLocatorMethods: [],
    credentialSelectors: [],
    lockedFields: [],
    remoteDynamicFields: [],
    dynamicParameterFields: [],
    dynamicPortParameters: ['autoFix'],
  },
  excludedHistoricalAuthoring: [
    {
      n8nKey: 'jsonSchema',
      sourceVersionCondition: '@version <= 1.1',
      label: 'JSON Schema',
      sourceKind: 'json',
      sourceDefault: `{
  "type": "object",
  "properties": {
    "state": {
      "type": "string"
    },
    "cities": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}`,
      required: true,
      rows: 10,
      description: 'JSON Schema to structure and validate the output against',
      reason:
        'Current v1.3 uses Schema Type with conditional JSON Example and Input Schema controls.',
    },
  ],
  excludedDormantAuthoring: [],
  versionBehaviorMetadata: [
    {
      versions: [1, 1.1],
      behavior: 'The legacy JSON Schema field is used directly.',
      includedInCurrentSurface: false,
    },
    {
      versions: [1.2],
      behavior:
        'Schema Type, JSON Example, and Input Schema are available; generated example properties are not forcibly required.',
      includedInCurrentSurface: false,
    },
    {
      versions: [1.3],
      behavior:
        'Generated example properties are required, the required-properties notice is visible, and the parser requires the output wrapper.',
      includedInCurrentSurface: true,
    },
  ],
  rendererNormalizations: [
    {
      n8nKeys: ['jsonSchemaExample', 'inputSchema'],
      sourceType: 'json:rows=10',
      normalizedKind: 'textarea with JSON editor metadata',
      reason: 'The catalog has no dedicated JSON kind.',
    },
    {
      n8nKey: 'prompt',
      sourceType: 'string:rows=10',
      normalizedKind: 'textarea',
      reason: 'The catalog represents multiline n8n strings with its textarea kind.',
    },
    {
      n8nKey: 'notice',
      sourceType: 'two current notice descriptors sharing one native key',
      normalizedKind:
        'connection and JSON-required notices use unique catalog keys retaining n8nKey notice',
    },
    {
      sourceBehavior: 'dynamic inputs expression depending on autoFix',
      normalizedBehavior: 'two declarative port variants plus retained inert source expression text',
    },
    {
      sourceBehavior: '@version display conditions',
      normalizedBehavior: 'resolved for v1.3 and retained as sourceVersionCondition metadata',
    },
  ],
  platformGaps: [
    'JSON controls are inert text editors; JSON parsing, example-derived schema generation, and JSON Schema validation never run.',
    'The output-pane $refs warning and its expression condition are retained as inert metadata and never evaluate after execution.',
    'Auto-Fix changes declarative port visibility only; it never loads or invokes the connected model or retries parsing.',
    'The custom prompt and its placeholders remain authoring text and are never validated, templated, or evaluated.',
    'No Zod schema, structured parser, fixing parser, output wrapper, parsed value, or workflow data is created.',
    'The ai_outputParser output preserves its source connection type and unspecified cap but never supplies a parser object.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'jsonSchemaExample',
      sourceType: 'json',
      normalizedKind: 'textarea',
    },
    {
      n8nKey: 'inputSchema',
      sourceType: 'json',
      normalizedKind: 'textarea',
    },
    {
      n8nKey: 'notice',
      sourceType: 'generated connection-hint notice',
      normalizedKind: 'notice',
    },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    dynamicLookups: false,
    expressionResolution: false,
    portExpressionEvaluation: false,
    inputItemAccess: false,
    jsonParsing: false,
    schemaGeneration: false,
    schemaParsing: false,
    schemaValidation: false,
    zodSchemaCreation: false,
    outputParserCreation: false,
    outputParsing: false,
    modelAccess: false,
    modelCalls: false,
    promptTemplating: false,
    promptValidation: false,
    retryHandling: false,
    autoFixExecution: false,
    outputEmission: false,
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

export default structuredOutputParser;
