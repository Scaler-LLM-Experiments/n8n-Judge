// Editor-only descriptor for @n8n/n8n-nodes-langchain's Qdrant Vector Store v1.3.
// Credentials, collection discovery, JSON, vector operations, expressions, and execution stay inert.

const embeddingInput = {
  type: 'ai_embedding', connector: 'ai_embedding', label: 'Embedding', displayName: 'Embedding',
  required: true, maxConnections: 1,
};
const rerankerInput = {
  type: 'ai_reranker', connector: 'ai_reranker', label: 'Reranker', displayName: 'Reranker',
  required: true, maxConnections: 1,
};
const mainInput = { type: 'main', label: '', displayName: '' };
const documentInput = {
  type: 'ai_document', connector: 'ai_document', label: 'Document', displayName: 'Document',
  required: true, maxConnections: 1,
};
const mainOutput = { type: 'main', label: '', displayName: '' };
const vectorStoreOutput = {
  type: 'ai_vectorStore', connector: 'ai_vectorStore', label: 'Vector Store',
  displayName: 'Vector Store', required: true,
};
const toolOutput = {
  type: 'ai_tool', connector: 'ai_tool', label: 'Tool', displayName: 'Tool', required: true,
};

const operationModeOptions = [
  {
    label: 'Get Many', value: 'load',
    description: 'Get many ranked documents from vector store for query',
    action: 'Get ranked documents from vector store',
  },
  {
    label: 'Insert Documents', value: 'insert',
    description: 'Insert documents into vector store', action: 'Add documents to vector store',
  },
  {
    label: 'Retrieve Documents (As Vector Store for Chain/Tool)', value: 'retrieve',
    description: 'Retrieve documents from vector store to be used as vector store with AI nodes',
    action: 'Retrieve documents for Chain/Tool as Vector Store',
    outputConnectionType: 'ai_vectorStore',
  },
  {
    label: 'Retrieve Documents (As Tool for AI Agent)', value: 'retrieve-as-tool',
    description: 'Retrieve documents from vector store to be used as tool with AI nodes',
    action: 'Retrieve documents for AI Agent as Tool', outputConnectionType: 'ai_tool',
  },
];

const credentialDefinition = {
  type: 'qdrantApi',
  name: 'Qdrant API',
  required: true,
  documentationUrl: 'https://docs.n8n.io/integrations/builtin/credentials/qdrant/',
  sourcePath: 'packages/@n8n/nodes-langchain/credentials/QdrantApi.credentials.ts',
  fields: [
    {
      key: 'apiKey', n8nKey: 'apiKey', label: 'API Key', kind: 'text', value: '',
      required: false, password: true, locked: true,
    },
    {
      key: 'qdrantUrl', n8nKey: 'qdrantUrl', label: 'Qdrant URL', kind: 'text', value: '',
      required: true, locked: true,
    },
  ],
  authenticate: {
    type: 'generic', header: 'api-key', sourceTemplate: '={{$credentials.apiKey}}', inert: true,
  },
  test: {
    baseURL: '={{$credentials.qdrantUrl}}', url: '/collections', inert: true,
  },
  simulationNote:
    'Credential fields and authentication/test templates are locked metadata and are never resolved or sent.',
};

const contentPayloadKeyField = {
  key: 'contentPayloadKey',
  n8nKey: 'options.contentPayloadKey',
  sourceN8nKey: 'contentPayloadKey',
  label: 'Content Payload Key',
  kind: 'text',
  sourceKind: 'string',
  value: 'content',
  required: false,
  description: 'The key to use for the content payload in Qdrant. Default is "content".',
};

const metadataPayloadKeyField = {
  key: 'metadataPayloadKey',
  n8nKey: 'options.metadataPayloadKey',
  sourceN8nKey: 'metadataPayloadKey',
  label: 'Metadata Payload Key',
  kind: 'text',
  sourceKind: 'string',
  value: 'metadata',
  required: false,
  description: 'The key to use for the metadata payload in Qdrant. Default is "metadata".',
};

const searchFilterField = {
  key: 'searchFilterJson',
  n8nKey: 'options.searchFilterJson',
  sourceN8nKey: 'searchFilterJson',
  label: 'Search Filter',
  kind: 'textarea',
  sourceKind: 'json',
  value:
    '{\n  "should": [\n    {\n      "key": "metadata.batch",\n      "match": {\n        "value": 12345\n      }\n    }\n  ]\n}',
  required: false,
  rows: 5,
  editor: 'json',
  validateType: 'object',
  description:
    'Filter pageContent or metadata using this <a href="https://qdrant.tech/documentation/concepts/filtering/" target="_blank">filtering syntax</a>',
  simulationNote: 'Filter JSON is stored without parsing or applying it.',
};

const qdrantVectorStore = {
  type: 'qdrant-vector-store',
  n8nType: '@n8n/n8n-nodes-langchain.vectorStoreQdrant',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1.3,
  defaultVersion: 1.3,
  versionHistory: [1, 1.1, 1.2, 1.3],
  label: 'Qdrant Vector Store',
  defaultName: 'Qdrant Vector Store',
  subtitle: '',
  description: 'Work with your data in a Qdrant collection',
  details:
    'Author document insertion, similarity search, vector-store retrieval, or agent-tool retrieval against a Qdrant collection. This catalog entry never connects to Qdrant or processes vectors.',
  category: 'core',
  libraryCategory: 'ai',
  categories: ['AI'],
  subcategory: 'Vector Stores',
  subcategories: ['Vector Stores', 'Tools', 'Root Nodes', 'Other Vector Stores', 'Other Tools'],
  codexSubcategories: {
    AI: ['Vector Stores', 'Tools', 'Root Nodes'],
    'Vector Stores': ['Other Vector Stores'],
    Tools: ['Other Tools'],
  },
  group: ['transform'],
  inputs: [embeddingInput],
  outputs: [vectorStoreOutput],
  portVariants: [
    {
      showWhen: { mode: ['load'], useReranker: [false] },
      inputs: [embeddingInput, mainInput], outputs: [mainOutput],
    },
    {
      showWhen: { mode: ['load'], useReranker: [true] },
      inputs: [embeddingInput, rerankerInput, mainInput], outputs: [mainOutput],
    },
    {
      showWhen: { mode: ['insert'] },
      inputs: [embeddingInput, mainInput, documentInput], outputs: [mainOutput],
    },
    {
      showWhen: { mode: ['retrieve'], useReranker: [false] },
      inputs: [embeddingInput], outputs: [vectorStoreOutput],
    },
    {
      showWhen: { mode: ['retrieve'], useReranker: [true] },
      inputs: [embeddingInput, rerankerInput], outputs: [vectorStoreOutput],
    },
    {
      showWhen: { mode: ['retrieve-as-tool'], useReranker: [false] },
      inputs: [embeddingInput], outputs: [toolOutput],
    },
    {
      showWhen: { mode: ['retrieve-as-tool'], useReranker: [true] },
      inputs: [embeddingInput, rerankerInput], outputs: [toolOutput],
    },
  ],
  inputsExpression:
    '={{((parameters) => { const mode = parameters?.mode; const useReranker = parameters?.useReranker; const inputs = [{ displayName: "Embedding", type: "ai_embedding", required: true, maxConnections: 1 }]; if (["load", "retrieve", "retrieve-as-tool"].includes(mode) && useReranker) inputs.push({ displayName: "Reranker", type: "ai_reranker", required: true, maxConnections: 1 }); if (mode === "retrieve-as-tool") return inputs; if (["insert", "load", "update"].includes(mode)) inputs.push({ displayName: "", type: "main" }); if (mode === "insert") inputs.push({ displayName: "Document", type: "ai_document", required: true, maxConnections: 1 }); return inputs; })($parameter)}}',
  outputsExpression:
    '={{((parameters) => { const mode = parameters?.mode ?? "retrieve"; if (mode === "retrieve-as-tool") return [{ displayName: "Tool", type: "ai_tool" }]; if (mode === "retrieve") return [{ displayName: "Vector Store", type: "ai_vectorStore" }]; return [{ displayName: "", type: "main" }]; })($parameter)}}',
  dynamicInputMetadata: {
    enabled: true, declarativeOnly: true, modeParameter: 'mode', rerankerParameter: 'useReranker',
    baseInput: embeddingInput, rerankerModes: ['load', 'retrieve', 'retrieve-as-tool'],
    mainInputModes: ['insert', 'load'], documentInputModes: ['insert'],
    exactOrder: ['Embedding', 'Reranker', 'Main', 'Document'],
  },
  dynamicOutputMetadata: {
    enabled: true, declarativeOnly: true, modeParameter: 'mode',
    outputsByMode: {
      load: [mainOutput], insert: [mainOutput], retrieve: [vectorStoreOutput],
      'retrieve-as-tool': [toolOutput],
    },
  },
  aiConnectorPorts: [
    {
      id: 'embedding', type: 'ai_embedding', connector: 'ai_embedding', label: 'Embedding',
      maxConnections: 1, required: true,
    },
    {
      id: 'reranker', type: 'ai_reranker', connector: 'ai_reranker', label: 'Reranker',
      maxConnections: 1, required: true,
      showWhen: { mode: ['load', 'retrieve', 'retrieve-as-tool'], useReranker: [true] },
    },
    {
      id: 'document', type: 'ai_document', connector: 'ai_document', label: 'Document',
      maxConnections: 1, required: true, showWhen: { mode: ['insert'] },
    },
  ],
  builderHint: {
    searchHint:
      "Pick mode by where data flows: `insert` adds documents on the main flow; `load` runs a one-shot similarity search; `retrieve-as-tool` plugs into an AI Agent's tools; `retrieve` exposes the store to another AI node.",
    inputs: {
      ai_embedding: { required: true },
      ai_document: { required: true, displayOptions: { show: { mode: ['insert'] } } },
      ai_reranker: {
        required: true,
        displayOptions: {
          show: { mode: ['load', 'retrieve', 'retrieve-as-tool'], useReranker: [true] },
        },
      },
    },
    outputs: {
      main: { displayOptions: { show: { mode: ['insert', 'load'] } } },
      ai_vectorStore: { required: true, displayOptions: { show: { mode: ['retrieve'] } } },
      ai_tool: { required: true, displayOptions: { show: { mode: ['retrieve-as-tool'] } } },
    },
  },
  usableAsTool: false,
  icon: '/node-icons/qdrant-vector-store.svg',
  n8nIcon: 'file:qdrant.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 346.42, height: 400, viewBox: '0 0 346.42 400' },
  iconAssetSha256: '0b6590d088f7d8244f0b3b65df41f7cde83e7d949e3f53f6e34987b31ef9284f',
  aliases: [],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreqdrant/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/vector_store/VectorStoreQdrant/VectorStoreQdrant.node.ts',
    factoryPath:
      'packages/@n8n/ai-utilities/src/utils/vector-store/createVectorStoreNode/createVectorStoreNode.ts',
    factoryUtilsPath:
      'packages/@n8n/ai-utilities/src/utils/vector-store/createVectorStoreNode/utils.ts',
    factoryConstantsPath:
      'packages/@n8n/ai-utilities/src/utils/vector-store/createVectorStoreNode/constants.ts',
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    vectorDescriptionPath:
      'packages/@n8n/nodes-langchain/nodes/vector_store/shared/descriptions.ts',
    listSearchPath:
      'packages/@n8n/nodes-langchain/nodes/vector_store/shared/methods/listSearch.ts',
    qdrantUtilsPath:
      'packages/@n8n/nodes-langchain/nodes/vector_store/VectorStoreQdrant/Qdrant.utils.ts',
    credentialPath: credentialDefinition.sourcePath,
    packagePath: 'packages/@n8n/nodes-langchain/package.json',
    iconPath:
      'packages/@n8n/nodes-langchain/nodes/vector_store/VectorStoreQdrant/qdrant.svg',
    directDescriptionImports: [
      { module: '@n8n/ai-utilities', names: ['createVectorStoreNode'] },
      { module: '../shared/descriptions', names: ['qdrantCollectionRLC'] },
      { module: '../shared/methods/listSearch', names: ['qdrantCollectionsSearch'] },
    ],
    runtimeImportsExcluded: [
      { module: '@langchain/qdrant', names: ['QdrantVectorStore'] },
      { module: '@qdrant/js-client-rest', names: ['QdrantClient'] },
    ],
  },
  defaults: { name: 'Qdrant Vector Store' },
  credentials: [
    {
      name: 'qdrantApi', type: 'qdrantApi', displayName: 'Qdrant API', required: true,
      locked: true, sourcePath: credentialDefinition.sourcePath,
    },
  ],
  credentialRequirements: [
    { type: 'qdrantApi', name: 'Qdrant API', required: true, locked: true },
  ],
  credentialUiMetadata: [credentialDefinition],
  methods: {
    listSearch: {
      qdrantCollectionsSearch: {
        credentialType: 'qdrantApi',
        resultPath: 'response.collections[].name',
        resultMapping: { name: 'collection.name', value: 'collection.name' },
        inert: true,
      },
    },
  },
  params: [
    {
      key: 'qdrantCredential', n8nKey: 'credentials.qdrantApi', sourceN8nKey: 'credentials',
      label: 'Credentials', kind: 'select', sourceKind: 'credentials', value: 'qdrantApi',
      required: true, locked: true,
      dynamicOptions: { source: 'credentialStore', credentialType: 'qdrantApi', inert: true },
      options: [{ label: 'Qdrant API', value: 'qdrantApi' }],
      simulationNote:
        'The credential selector is locked. The simulation never creates, reads, tests, or applies Qdrant credentials.',
    },
    {
      key: 'ragStarterCallout', n8nKey: 'ragStarterCallout', sourceN8nKey: 'ragStarterCallout',
      label: 'Tip: Get a feel for vector stores in n8n with our', kind: 'notice',
      sourceKind: 'callout', value: '', required: false,
      calloutAction: {
        label: 'RAG starter template', type: 'openSampleWorkflowTemplate',
        templateId: 'rag-starter-template', inert: true,
      },
    },
    {
      key: 'mode', n8nKey: 'mode', sourceN8nKey: 'mode', label: 'Operation Mode',
      kind: 'select', sourceKind: 'options', value: 'retrieve', required: false,
      noDataExpression: true, options: operationModeOptions,
    },
    {
      key: 'retrieverConnectionNotice', n8nKey: 'notice', sourceN8nKey: 'notice',
      label:
        "This node must be connected to a vector store retriever. <a data-action='openSelectiveNodeCreator' data-action-parameter-connectiontype='ai_retriever'>Insert one</a>",
      kind: 'notice', sourceKind: 'notice', value: '', required: false,
      showWhen: { mode: ['retrieve'] }, n8nShowWhen: { mode: ['retrieve'] },
      containerClass: 'ndv-connection-hint-notice',
    },
    {
      key: 'toolDescription', n8nKey: 'toolDescription', sourceN8nKey: 'toolDescription',
      label: 'Description', kind: 'textarea', sourceKind: 'string:rows=2', value: '',
      required: true, rows: 2, expressionAllowed: true,
      placeholder: 'e.g. Work with your data in a Qdrant collection',
      description:
        'Explain to the LLM what this tool does, a good, specific description would allow LLMs to produce expected results much more often',
      showWhen: { mode: ['retrieve-as-tool'] }, n8nShowWhen: { mode: ['retrieve-as-tool'] },
      simulationNote: 'Description text and expression syntax are stored without evaluation.',
    },
    {
      key: 'qdrantCollection', n8nKey: 'qdrantCollection', sourceN8nKey: 'qdrantCollection',
      label: 'Qdrant Collection', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' },
      sourceDefault: { mode: 'list', value: '' }, required: true, locked: true,
      modes: ['list', 'id'],
      modeOptions: [
        {
          label: 'From List', value: 'list', sourceKind: 'list',
          searchListMethod: 'qdrantCollectionsSearch', options: [],
        },
        { label: 'ID', value: 'id', sourceKind: 'string' },
      ],
      dynamicOptions: {
        method: 'qdrantCollectionsSearch', credentialType: 'qdrantApi',
        resultPath: 'response.collections[].name', inert: true,
      },
      simulationNote:
        'Collection discovery is locked and empty because the simulation never reads credentials or contacts Qdrant.',
    },
    {
      key: 'embeddingBatchSize', n8nKey: 'embeddingBatchSize', sourceN8nKey: 'embeddingBatchSize',
      label: 'Embedding Batch Size', kind: 'number', sourceKind: 'number', value: 200,
      required: false, description: 'Number of documents to embed in a single batch',
      showWhen: { mode: ['insert'] }, n8nShowWhen: { mode: ['insert'] },
      sourceVersionCondition: '@version >= 1.1',
      sourceDisplayOptions: {
        show: { mode: ['insert'], '@version': [{ _cnd: { gte: 1.1 } }] },
      },
    },
    {
      key: 'insertOptions', n8nKey: 'options', sourceN8nKey: 'options', label: 'Options',
      kind: 'collection', sourceKind: 'collection', value: {}, sourceDefault: {},
      required: false, addLabel: 'Add Option', placeholder: 'Add Option',
      showWhen: { mode: ['insert'] }, n8nShowWhen: { mode: ['insert'] },
      fields: [
        {
          key: 'collectionConfig', n8nKey: 'options.collectionConfig',
          sourceN8nKey: 'collectionConfig', label: 'Collection Config', kind: 'textarea',
          sourceKind: 'json', value: '', required: false, editor: 'json',
          description:
            'JSON options for creating a collection. <a href="https://qdrant.tech/documentation/concepts/collections">Learn more</a>.',
          simulationNote: 'Collection configuration JSON is stored without parsing or creating a collection.',
        },
        contentPayloadKeyField,
        metadataPayloadKeyField,
      ],
    },
    {
      key: 'prompt', n8nKey: 'prompt', sourceN8nKey: 'prompt', label: 'Prompt',
      kind: 'expression', sourceKind: 'string', value: '', required: true,
      expressionAllowed: true,
      description:
        'Search prompt to retrieve matching documents from the vector store using similarity-based ranking',
      showWhen: { mode: ['load'] }, n8nShowWhen: { mode: ['load'] },
      simulationNote: 'Prompt text and expression syntax are stored without evaluation.',
    },
    {
      key: 'topK', n8nKey: 'topK', sourceN8nKey: 'topK', label: 'Limit',
      kind: 'number', sourceKind: 'number', value: 4, required: false,
      description: 'Number of top results to fetch from vector store',
      showWhen: { mode: ['load', 'retrieve-as-tool'] },
      n8nShowWhen: { mode: ['load', 'retrieve-as-tool'] },
    },
    {
      key: 'includeDocumentMetadata', n8nKey: 'includeDocumentMetadata',
      sourceN8nKey: 'includeDocumentMetadata', label: 'Include Metadata', kind: 'boolean',
      sourceKind: 'boolean', value: true, required: false,
      description: 'Whether or not to include document metadata',
      showWhen: { mode: ['load', 'retrieve-as-tool'] },
      n8nShowWhen: { mode: ['load', 'retrieve-as-tool'] },
    },
    {
      key: 'useReranker', n8nKey: 'useReranker', sourceN8nKey: 'useReranker',
      label: 'Rerank Results', kind: 'boolean', sourceKind: 'boolean', value: false,
      required: false, description: 'Whether or not to rerank results',
      showWhen: { mode: ['load', 'retrieve', 'retrieve-as-tool'] },
      n8nShowWhen: { mode: ['load', 'retrieve', 'retrieve-as-tool'] },
    },
    {
      key: 'loadAndToolOptions', n8nKey: 'options', sourceN8nKey: 'options', label: 'Options',
      kind: 'collection', sourceKind: 'collection', value: {}, sourceDefault: {},
      required: false, addLabel: 'Add Option', placeholder: 'Add Option',
      fields: [searchFilterField, contentPayloadKeyField, metadataPayloadKeyField],
      showWhen: { mode: ['load', 'retrieve-as-tool'] },
      n8nShowWhen: { mode: ['load', 'retrieve-as-tool'] },
    },
    {
      key: 'retrieveOptions', n8nKey: 'options', sourceN8nKey: 'options', label: 'Options',
      kind: 'collection', sourceKind: 'collection', value: {}, sourceDefault: {},
      required: false, addLabel: 'Add Option', placeholder: 'Add Option',
      fields: [searchFilterField, contentPayloadKeyField, metadataPayloadKeyField],
      showWhen: { mode: ['retrieve'] }, n8nShowWhen: { mode: ['retrieve'] },
    },
  ],
  authoringParity: {
    currentVersion: 1.3,
    resourceCount: 0,
    operationCount: 4,
    recursiveFieldCount: 23,
    sourceVisibleFieldCount: 22,
    credentialSelectorCount: 1,
    credentialEditorFieldCount: 2,
    totalAuthoringFieldCount: 25,
    dynamicResourceLocatorCount: 1,
    operationModes: ['load', 'insert', 'retrieve', 'retrieve-as-tool'],
    providerSharedFields: ['qdrantCollection'],
    insertFields: [
      'embeddingBatchSize', 'options.collectionConfig', 'options.contentPayloadKey',
      'options.metadataPayloadKey',
    ],
    loadFields: [
      'prompt', 'topK', 'includeDocumentMetadata', 'useReranker', 'options.searchFilterJson',
      'options.contentPayloadKey', 'options.metadataPayloadKey',
    ],
    retrieveFields: [
      'useReranker', 'options.searchFilterJson', 'options.contentPayloadKey',
      'options.metadataPayloadKey',
    ],
    retrieveAsToolFields: [
      'toolDescription', 'topK', 'includeDocumentMetadata', 'useReranker',
      'options.searchFilterJson', 'options.contentPayloadKey', 'options.metadataPayloadKey',
    ],
  },
  portParity: {
    variantCount: 7,
    defaultMode: 'retrieve',
    defaultInputs: ['Embedding'],
    defaultOutputs: ['Vector Store'],
    modesWithOptionalReranker: ['load', 'retrieve', 'retrieve-as-tool'],
    insertInputs: ['Embedding', 'Main', 'Document'],
    loadInputs: ['Embedding', 'Main'],
    retrieveInputs: ['Embedding'],
    retrieveAsToolInputs: ['Embedding'],
    outputsByMode: {
      load: ['Main'], insert: ['Main'], retrieve: ['Vector Store'],
      'retrieve-as-tool': ['Tool'],
    },
  },
  dynamicAuthoringMetadata: {
    listSearchMethods: ['qdrantCollectionsSearch'],
    credentialSelectors: ['qdrantCredential'],
    lockedFields: ['qdrantCredential', 'qdrantCollection'],
    remoteDynamicFields: ['qdrantCredential', 'qdrantCollection'],
  },
  excludedHistoricalAuthoring: [
    {
      n8nKey: 'toolName', sourceVersionCondition: '@version <= 1.2',
      reason: 'v1.3 uses the node name as the tool name and exposes only toolDescription.',
    },
  ],
  excludedDormantAuthoring: [
    { mode: 'update', reason: 'Qdrant does not enable update in meta.operationModes.' },
    {
      n8nKey: 'id', sourceCondition: { mode: ['update'] },
      reason: 'The update operation mode is not enabled for Qdrant.',
    },
  ],
  rendererNormalizations: [
    {
      n8nKey: 'ragStarterCallout', sourceType: 'callout',
      normalizedKind: 'notice with calloutAction metadata',
    },
    {
      n8nKey: 'credentials.qdrantApi', sourceType: 'required credential selector',
      normalizedKind: 'locked select',
    },
    {
      n8nKey: 'qdrantCollection', sourceType: 'resourceLocator with listSearch',
      normalizedKind: 'locked resourceLocator with empty list and manual ID mode metadata',
    },
    { n8nKey: 'toolDescription', sourceType: 'string:rows=2', normalizedKind: 'textarea' },
    { n8nKey: 'prompt', sourceType: 'expression-capable string', normalizedKind: 'expression' },
    { n8nKey: 'options.collectionConfig', sourceType: 'json', normalizedKind: 'textarea' },
    { n8nKey: 'options.searchFilterJson', sourceType: 'json', normalizedKind: 'textarea' },
  ],
  platformGaps: [
    'The RAG starter callout action and vector-store-retriever notice retain their exact action metadata but are inert in the catalog renderer.',
    'Credential selection, credential editing/testing, and Qdrant collection discovery are locked and never contact Qdrant.',
    'JSON values and expression syntax are stored without evaluation or parsing.',
    'All mode-dependent ports are declarative and never load embeddings, documents, rerankers, vector stores, or tools.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'ragStarterCallout', sourceType: 'callout', normalizedKind: 'notice' },
    {
      n8nKey: 'credentials.qdrantApi', sourceType: 'credentials', normalizedKind: 'locked select',
    },
    {
      n8nKey: 'qdrantCollection', sourceType: 'resourceLocator with remote listSearch',
      normalizedKind: 'locked resourceLocator',
    },
    {
      n8nKey: 'toolDescription', sourceType: 'string with rows=2', normalizedKind: 'textarea',
    },
    { n8nKey: 'options.collectionConfig', sourceType: 'json', normalizedKind: 'textarea' },
    { n8nKey: 'options.searchFilterJson', sourceType: 'json', normalizedKind: 'textarea' },
  ],
  simulation: {
    configurationOnly: true,
    credentialCreation: false,
    credentialAccess: false,
    credentialTesting: false,
    authentication: false,
    dynamicLookups: false,
    expressionResolution: false,
    jsonParsing: false,
    vectorStoreClient: false,
    collectionListing: false,
    collectionCreation: false,
    documentEmbedding: false,
    documentInsertion: false,
    similaritySearch: false,
    metadataFiltering: false,
    reranking: false,
    toolCreation: false,
    workflowExecution: false,
    supplyData: false,
    networkAccess: false,
    webhooks: false,
    polling: false,
    voice: false,
  },
  output: {},
};

export default qdrantVectorStore;
