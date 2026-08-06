// Editor-only descriptor for @n8n/n8n-nodes-langchain Information Extractor v1.2.
// Expressions, schema parsing, model calls, batching, delays, and execution remain inert.

const SYSTEM_PROMPT_TEMPLATE = `You are an expert extraction algorithm.
Only extract relevant information from the text.
If you do not know the value of an attribute asked to extract, you may omit the attribute's value.`;

const informationExtractor = {
  type: 'information-extractor',
  n8nType: '@n8n/n8n-nodes-langchain.informationExtractor',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1.2,
  defaultVersion: 1.2,
  versionHistory: [1, 1.1, 1.2],
  label: 'Information Extractor',
  defaultName: 'Information Extractor',
  subtitle: '',
  description: 'Extract information from text in a structured format',
  details:
    'Configure text, an extraction schema, optional system instructions, and batching metadata. This catalog entry never parses or extracts anything.',
  // An AI ROOT, not a plain core node. This drives three separate things and
  // 'core' broke all of them: `roleOf()` in simulate.js walks it as a
  // passthrough, `variantOf()` in the editor resolves it to 'action' so the
  // Chat Model port and its `+` never render (the only call site of
  // openPicker({modelSlot:true})), and NodePickerDrawer groups on the same map.
  // The result was a node that declares a required ai_languageModel input and
  // gives the learner no way to attach one.
  category: 'ai',
  // Its ai_languageModel input is `required: true`, so a run without a model
  // cannot work — this is what makes simulate.js narrate that instead of
  // silently walking past it.
  needsModel: true,
  libraryCategory: 'ai',
  categories: ['AI'],
  subcategory: 'Chains',
  subcategories: ['Chains', 'Root Nodes'],
  group: ['transform'],
  inputs: [
    { type: 'main', label: '', displayName: '' },
    {
      type: 'ai_languageModel',
      connector: 'ai_languageModel',
      label: 'Model',
      displayName: 'Model',
      maxConnections: 1,
      required: true,
    },
  ],
  outputs: [{ type: 'main' }],
  portVariants: [
    {
      inputs: [
        { type: 'main', label: '', displayName: '' },
        {
          type: 'ai_languageModel',
          connector: 'ai_languageModel',
          label: 'Model',
          displayName: 'Model',
          maxConnections: 1,
          required: true,
        },
      ],
      outputs: [{ type: 'main' }],
    },
  ],
  portMetadata: {
    static: true,
    requiredInputs: ['ai_languageModel'],
    maxConnections: { ai_languageModel: 1 },
    labels: { ai_languageModel: 'Model' },
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
  ],
  usableAsTool: false,
  credentials: [],
  builderHint: {
    inputs: {
      ai_languageModel: { required: true },
    },
  },
  icon: '/node-icons/information-extractor.svg',
  n8nIcon: 'node:information-extractor',
  iconMode: 'currentColor',
  iconColor: 'black',
  iconHex: '#000000',
  iconAssetType: 'svg',
  iconAssetSize: { width: 24, height: 24, viewBox: '0 0 24 24' },
  iconAssetSha256: 'c8e74d57787c8b155367921ccfb142c37417ebfd5d1e42f67f8a2537dec770da',
  aliases: ['NER', 'parse', 'parsing', 'JSON', 'data extraction', 'structured'],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.information-extractor/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/chains/InformationExtractor/InformationExtractor.node.ts',
    constantsPath:
      'packages/@n8n/nodes-langchain/nodes/chains/InformationExtractor/constants.ts',
    attributesHelperPath:
      'packages/@n8n/nodes-langchain/nodes/chains/InformationExtractor/helpers.ts',
    typesPath:
      'packages/@n8n/nodes-langchain/nodes/chains/InformationExtractor/types.ts',
    processItemPath:
      'packages/@n8n/nodes-langchain/nodes/chains/InformationExtractor/processItem.ts',
    sharedDescriptionPath: 'packages/@n8n/nodes-langchain/utils/descriptions.ts',
    sharedSchemaParsingPath: 'packages/@n8n/nodes-langchain/utils/schemaParsing.ts',
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    outputSchemaPath:
      'packages/@n8n/nodes-langchain/nodes/chains/InformationExtractor/__schema__/v1.2.0/output.json',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/information-extractor.svg',
    directDescriptionImports: [
      {
        module: '@utils/descriptions',
        names: [
          'buildJsonSchemaExampleNotice',
          'inputSchemaField',
          'jsonSchemaExampleField',
          'schemaTypeField',
        ],
      },
      { module: '@n8n/ai-utilities', names: ['getBatchingOptionFields'] },
      { module: './constants', names: ['SYSTEM_PROMPT_TEMPLATE'] },
    ],
    runtimeImportsExcluded: [
      { module: '@langchain/classic/output_parsers', names: ['OutputFixingParser', 'StructuredOutputParser'] },
      { module: '@n8n/utils/sleep', names: ['sleep'] },
      { module: '@utils/schemaParsing', names: ['convertJsonSchemaToZod', 'generateSchemaFromExample'] },
      { module: '@utils/output_parsers/langchainParserError', names: ['wrapLangChainParserError'] },
      { module: './helpers', names: ['makeZodSchemaFromAttributes'] },
      { module: './processItem', names: ['processItem'] },
    ],
  },
  defaults: { name: 'Information Extractor' },
  params: [
    {
      key: 'text',
      n8nKey: 'text',
      sourceN8nKey: 'text',
      label: 'Text',
      kind: 'textarea',
      sourceKind: 'string:rows=2',
      value: '',
      required: false,
      rows: 2,
      expressionAllowed: true,
      description: 'The text to extract information from',
      simulationNote: 'Text and expression syntax are stored without being read or resolved.',
    },
    {
      key: 'schemaType',
      n8nKey: 'schemaType',
      sourceN8nKey: 'schemaType',
      label: 'Schema Type',
      kind: 'select',
      sourceKind: 'options',
      value: 'fromAttributes',
      required: false,
      noDataExpression: true,
      description: 'How to specify the schema for the desired output',
      options: [
        {
          label: 'From Attribute Descriptions',
          value: 'fromAttributes',
          description: 'Extract specific attributes from the text based on types and descriptions',
        },
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
      validateType: 'object',
      showWhen: { schemaType: ['fromJson'] },
      n8nShowWhen: { schemaType: ['fromJson'] },
      description: 'Example JSON object to use to generate the schema',
      simulationNote: 'JSON is stored as text and is never parsed into a schema.',
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
      n8nShowWhen: { schemaType: ['fromJson'], '@version': [{ _cnd: { gte: 1.2 } }] },
      sourceVersionCondition: '@version >= 1.2',
      sourceDisplayOptions: {
        show: { schemaType: ['fromJson'], '@version': [{ _cnd: { gte: 1.2 } }] },
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
      simulationNote: 'Schema text and expression syntax are stored without parsing or evaluation.',
    },
    {
      key: 'attributes',
      n8nKey: 'attributes',
      sourceN8nKey: 'attributes',
      label: 'Attributes',
      kind: 'fixedCollection',
      sourceKind: 'fixedCollection',
      value: {},
      sourceDefault: {},
      required: false,
      collectionKey: 'attributes',
      collectionLabel: 'Attribute List',
      multiple: true,
      addLabel: 'Add Attribute',
      placeholder: 'Add Attribute',
      showWhen: { schemaType: ['fromAttributes'] },
      n8nShowWhen: { schemaType: ['fromAttributes'] },
      fields: [
        {
          key: 'attributeName',
          n8nKey: 'attributes.attributes.name',
          sourceN8nKey: 'name',
          label: 'Name',
          kind: 'text',
          sourceKind: 'string',
          value: '',
          required: true,
          placeholder: 'e.g. company_name',
          description: 'Attribute to extract',
          expressionAllowed: true,
        },
        {
          key: 'attributeType',
          n8nKey: 'attributes.attributes.type',
          sourceN8nKey: 'type',
          label: 'Type',
          kind: 'select',
          sourceKind: 'options',
          value: 'string',
          required: true,
          description: 'Data type of the attribute',
          options: [
            { label: 'Boolean', value: 'boolean' },
            { label: 'Date', value: 'date' },
            { label: 'Number', value: 'number' },
            { label: 'String', value: 'string' },
          ],
        },
        {
          key: 'attributeDescription',
          n8nKey: 'attributes.attributes.description',
          sourceN8nKey: 'description',
          label: 'Description',
          kind: 'text',
          sourceKind: 'string',
          value: '',
          required: true,
          placeholder: 'Add description for the attribute',
          description: 'Describe your attribute',
          expressionAllowed: true,
        },
        {
          key: 'attributeRequired',
          n8nKey: 'attributes.attributes.required',
          sourceN8nKey: 'required',
          label: 'Required',
          kind: 'boolean',
          sourceKind: 'boolean',
          value: false,
          required: true,
          description: 'Whether attribute is required',
        },
      ],
      simulationNote: 'Attribute definitions are stored only; no validator or extraction schema is built.',
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
          key: 'systemPromptTemplate',
          n8nKey: 'options.systemPromptTemplate',
          sourceN8nKey: 'systemPromptTemplate',
          label: 'System Prompt Template',
          kind: 'textarea',
          sourceKind: 'string:rows=6',
          value: SYSTEM_PROMPT_TEMPLATE,
          required: false,
          rows: 6,
          expressionAllowed: true,
          description: 'String to use directly as the system prompt template',
          simulationNote: 'The template is stored only and is never sent to a model.',
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
          description: 'Batch processing options for rate limiting',
          sourceVersionCondition: '@version >= 1.1',
          sourceDisplayOptions: { show: { '@version': [{ _cnd: { gte: 1.1 } }] } },
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
              description:
                'Delay in milliseconds between batches. This is useful for rate limiting.',
            },
          ],
          simulationNote: 'Batch settings are stored only; items are never grouped or delayed.',
        },
      ],
    },
  ],
  authoringParity: {
    currentVersion: 1.2,
    resourceCount: 0,
    operationCount: 0,
    recursiveFieldCount: 15,
    expectedTopLevelN8nKeys: [
      'text',
      'schemaType',
      'jsonSchemaExample',
      'notice',
      'inputSchema',
      'attributes',
      'options',
    ],
    representedTopLevelN8nKeys: [
      'text',
      'schemaType',
      'jsonSchemaExample',
      'notice',
      'inputSchema',
      'attributes',
      'options',
    ],
    schemaTypeValues: ['fromAttributes', 'fromJson', 'manual'],
    schemaTypeDefault: 'fromAttributes',
    attributeFieldCount: 4,
    options: ['systemPromptTemplate', 'batching'],
    batchingOptions: ['batchSize', 'delayBetweenBatches'],
  },
  dynamicAuthoringMetadata: {
    loadOptionsMethods: [],
    resourceLocatorMethods: [],
    resourceMapperMethods: [],
    credentialSelectors: [],
    lockedFields: [],
    hasDynamicFields: false,
  },
  excludedHistoricalAuthoring: [
    {
      versions: [1, 1.1],
      n8nKey: 'notice',
      reason:
        "The current v1.2 pane includes the JSON-example 'all properties required' notice; earlier versions did not.",
    },
  ],
  rendererNormalizations: [
    {
      n8nKeys: ['text'],
      sourceType: 'string:rows=2',
      normalizedKind: 'textarea',
      reason: 'The catalog represents multiline n8n string inputs with its textarea kind.',
    },
    {
      n8nKeys: ['jsonSchemaExample', 'inputSchema'],
      sourceType: 'json:rows=10',
      normalizedKind: 'textarea with JSON editor metadata',
      reason: 'The catalog has no dedicated JSON kind.',
    },
    {
      n8nKeys: ['options.systemPromptTemplate'],
      sourceType: 'string:rows=6',
      normalizedKind: 'textarea',
      reason: 'The catalog represents multiline n8n string inputs with its textarea kind.',
    },
    {
      sourceBehavior: '@version display conditions',
      normalizedBehavior: 'resolved for v1.2 and retained as sourceVersionCondition metadata',
    },
  ],
  platformGaps: [
    'The source JSON controls are represented by inert text editors; no JSON validation or schema generation runs.',
    'Expressions remain authoring text and are never evaluated.',
    'The required Model port preserves connection metadata but never loads or invokes a model.',
    'Batch settings are configurable metadata only; they never group items or create delays.',
    'The notice and hint retain upstream HTML strings, but the current catalog renderer presents them as inert text.',
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
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    dynamicLookups: false,
    schemaLoading: false,
    schemaGeneration: false,
    schemaParsing: false,
    expressionResolution: false,
    inputReads: false,
    binaryReads: false,
    promptEvaluation: false,
    attributeExtraction: false,
    modelAccess: false,
    modelCalls: false,
    outputParserAccess: false,
    batchProcessing: false,
    delays: false,
    workflowExecution: false,
    networkAccess: false,
    apiCalls: false,
    webhooks: false,
    polling: false,
    voice: false,
  },
  output: { output: {} },
  outputSchema: {
    type: 'object',
    required: ['output'],
    properties: {
      output: {
        type: 'object',
        description:
          "Object of extracted fields matching the node's configured attributes — a parsed object, never a JSON-encoded string",
        additionalProperties: true,
      },
    },
    version: 1,
  },
};

export default informationExtractor;
