// Editor-only descriptor for @n8n/n8n-nodes-langchain's Weaviate Vector Store v1.3.
// Credentials, lookups, JSON, expressions, vector operations, and execution remain inert.

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

const credentialFields = [
  {
    key: 'connection_type', n8nKey: 'connection_type', label: 'Connection Type',
    kind: 'select', value: 'weaviate_cloud', required: false, locked: true,
    options: [
      { label: 'Weaviate Cloud', value: 'weaviate_cloud' },
      { label: 'Custom Connection', value: 'custom_connection' },
    ],
    description:
      'Choose whether to connect to a Weaviate Cloud instance or a custom Weaviate instance.',
  },
  {
    key: 'weaviate_cloud_endpoint', n8nKey: 'weaviate_cloud_endpoint',
    label: 'Weaviate Cloud Endpoint', kind: 'text', value: '', required: true, locked: true,
    placeholder: 'https://your-cluster.weaviate.cloud',
    showWhen: { connection_type: ['weaviate_cloud'] },
    description: 'The Endpoint of a Weaviate Cloud instance.',
  },
  {
    key: 'weaviate_api_key', n8nKey: 'weaviate_api_key', label: 'Weaviate Api Key',
    kind: 'text', value: '', required: false, password: true, locked: true,
    description: 'The API key for the Weaviate instance.',
  },
  {
    key: 'custom_connection_http_host', n8nKey: 'custom_connection_http_host',
    label: 'Custom Connection HTTP Host', kind: 'text', value: 'weaviate',
    required: true, locked: true, showWhen: { connection_type: ['custom_connection'] },
    description: 'The host of your Weaviate instance.',
  },
  {
    key: 'custom_connection_http_port', n8nKey: 'custom_connection_http_port',
    label: 'Custom Connection HTTP Port', kind: 'number', value: 8080,
    required: true, locked: true, showWhen: { connection_type: ['custom_connection'] },
    description: 'The port of your Weaviate instance.',
  },
  {
    key: 'custom_connection_http_secure', n8nKey: 'custom_connection_http_secure',
    label: 'Custom Connection HTTP Secure', kind: 'boolean', value: false,
    required: true, locked: true, showWhen: { connection_type: ['custom_connection'] },
    description: 'Whether to use a secure connection for HTTP.',
  },
  {
    key: 'custom_connection_grpc_host', n8nKey: 'custom_connection_grpc_host',
    label: 'Custom Connection gRPC Host', kind: 'text', value: 'weaviate',
    required: true, locked: true, showWhen: { connection_type: ['custom_connection'] },
    description: 'The gRPC host of your Weaviate instance.',
  },
  {
    key: 'custom_connection_grpc_port', n8nKey: 'custom_connection_grpc_port',
    label: 'Custom Connection gRPC Port', kind: 'number', value: 50051,
    required: true, locked: true, showWhen: { connection_type: ['custom_connection'] },
    description: 'The gRPC port of your Weaviate instance.',
  },
  {
    key: 'custom_connection_grpc_secure', n8nKey: 'custom_connection_grpc_secure',
    label: 'Custom Connection gRPC Secure', kind: 'boolean', value: false,
    required: true, locked: true, showWhen: { connection_type: ['custom_connection'] },
    description: 'Whether to use a secure connection for gRPC.',
  },
];

const credentialDefinition = {
  type: 'weaviateApi',
  name: 'Weaviate Credentials',
  required: true,
  documentationUrl: 'https://docs.n8n.io/integrations/builtin/credentials/weaviate/',
  sourcePath: 'packages/@n8n/nodes-langchain/credentials/WeaviateApi.credentials.ts',
  fields: credentialFields,
  test: {
    baseURL:
      '={{$credentials.weaviate_cloud_endpoint?$credentials.weaviate_cloud_endpoint.startsWith("http://") || $credentials.weaviate_cloud_endpoint.startsWith("https://")?$credentials.weaviate_cloud_endpoint:"https://" + $credentials.weaviate_cloud_endpoint:($credentials.custom_connection_http_secure ? "https" : "http") + "://" + $credentials.custom_connection_http_host + ":" + $credentials.custom_connection_http_port }}',
    url: '/v1/nodes',
    disableFollowRedirect: false,
    headers: {
      Authorization:
        '={{$if($credentials.weaviate_api_key, "Bearer " + $credentials.weaviate_api_key, undefined)}}',
    },
    inert: true,
  },
  simulationNote:
    'Credential fields and test expressions are locked metadata and are never resolved or sent.',
};

const sharedOptionFields = [
  {
    key: 'tenant', n8nKey: 'options.tenant', sourceN8nKey: 'tenant', label: 'Tenant Name',
    kind: 'text', sourceKind: 'string', value: '', required: false, validateType: 'string',
    description: 'Tenant Name. Collection must have been created with tenant support enabled.',
  },
  {
    key: 'textKey', n8nKey: 'options.textKey', sourceN8nKey: 'textKey', label: 'Text Key',
    kind: 'text', sourceKind: 'string', value: 'text', required: false, validateType: 'string',
    description: 'The key in the document that contains the embedded text',
  },
  {
    key: 'skip_init_checks', n8nKey: 'options.skip_init_checks', sourceN8nKey: 'skip_init_checks',
    label: 'Skip Init Checks', kind: 'boolean', sourceKind: 'boolean', value: false,
    required: false, validateType: 'boolean',
    description: 'Whether to skip init checks while instantiating the client',
  },
  {
    key: 'timeout_init', n8nKey: 'options.timeout_init', sourceN8nKey: 'timeout_init',
    label: 'Init Timeout', kind: 'number', sourceKind: 'number', value: 2,
    required: false, validateType: 'number',
    description: 'Number of timeout seconds for initial checks',
  },
  {
    key: 'timeout_insert', n8nKey: 'options.timeout_insert', sourceN8nKey: 'timeout_insert',
    label: 'Insert Timeout', kind: 'number', sourceKind: 'number', value: 90,
    required: false, validateType: 'number',
    description: 'Number of timeout seconds for inserts',
  },
  {
    key: 'timeout_query', n8nKey: 'options.timeout_query', sourceN8nKey: 'timeout_query',
    label: 'Query Timeout', kind: 'number', sourceKind: 'number', value: 30,
    required: false, validateType: 'number',
    description: 'Number of timeout seconds for queries',
  },
  {
    key: 'proxy_grpc', n8nKey: 'options.proxy_grpc', sourceN8nKey: 'proxy_grpc',
    label: 'GRPC Proxy', kind: 'text', sourceKind: 'string', value: '',
    required: false, validateType: 'string', description: 'Proxy to use for GRPC',
  },
];

const clearStoreField = {
  key: 'clearStore', n8nKey: 'options.clearStore', sourceN8nKey: 'clearStore',
  label: 'Clear Data', kind: 'boolean', sourceKind: 'boolean', value: false, required: false,
  description: 'Whether to clear the Collection/Tenant before inserting new data',
  simulationNote: 'The collection or tenant is never cleared or modified.',
};

const retrieveSpecificOptionFields = [
  {
    key: 'searchFilterJson', n8nKey: 'options.searchFilterJson',
    sourceN8nKey: 'searchFilterJson', label: 'Search Filters', kind: 'textarea',
    sourceKind: 'json',
    value:
      '{\n  "OR": [\n    {\n        "path": ["pdf_info_Author"],\n        "operator": "Equal",\n        "valueString": "Elis"\n    },\n    {\n        "path": ["pdf_info_Author"],\n        "operator": "Equal",\n        "valueString": "Pinnacle"\n    }    \n  ]\n}',
    required: false, rows: 5, editor: 'json', validateType: 'object',
    description:
      'Filter pageContent or metadata using this <a href="https://weaviate.io/" target="_blank">filtering syntax</a>',
    simulationNote: 'Filter JSON is stored without parsing or applying it.',
  },
  {
    key: 'metadataKeys', n8nKey: 'options.metadataKeys', sourceN8nKey: 'metadataKeys',
    label: 'Metadata Keys', kind: 'text', sourceKind: 'string', value: 'source,page',
    required: false, validateType: 'string',
    description: 'Select the metadata to retrieve along the content',
  },
  {
    key: 'hybridQuery', n8nKey: 'options.hybridQuery', sourceN8nKey: 'hybridQuery',
    label: 'Hybrid: Query Text', kind: 'text', sourceKind: 'string', value: '',
    required: false, validateType: 'string',
    description: 'Provide a query text to combine vector search with a keyword/text search',
  },
  {
    key: 'hybridExplainScore', n8nKey: 'options.hybridExplainScore',
    sourceN8nKey: 'hybridExplainScore', label: 'Hybrid: Explain Score', kind: 'boolean',
    sourceKind: 'boolean', value: false, required: false, validateType: 'boolean',
    description: 'Whether to show the score fused between hybrid and vector search explanation',
  },
  {
    key: 'fusionType', n8nKey: 'options.fusionType', sourceN8nKey: 'fusionType',
    label: 'Hybrid: Fusion Type', kind: 'select', sourceKind: 'options',
    value: 'RelativeScore', required: false,
    options: [
      { label: 'Relative Score', value: 'RelativeScore' },
      { label: 'Ranked', value: 'Ranked' },
    ],
    description: 'Select the fusion type for combining vector and keyword search results',
  },
  {
    key: 'autoCutLimit', n8nKey: 'options.autoCutLimit', sourceN8nKey: 'autoCutLimit',
    label: 'Hybrid: Auto Cut Limit', kind: 'number', sourceKind: 'number', value: '',
    sourceDefault: undefined, required: false, validateType: 'number',
    description: 'Limit result groups by detecting sudden jumps in score',
  },
  {
    key: 'alpha', n8nKey: 'options.alpha', sourceN8nKey: 'alpha', label: 'Hybrid: Alpha',
    kind: 'number', sourceKind: 'number', value: 0.5, required: false,
    validateType: 'number',
    description:
      'Change the relative weights of the keyword and vector components. 1.0 = pure vector, 0.0 = pure keyword.',
  },
  {
    key: 'queryProperties', n8nKey: 'options.queryProperties',
    sourceN8nKey: 'queryProperties', label: 'Hybrid: Query Properties', kind: 'text',
    sourceKind: 'string', value: '', required: false, validateType: 'string',
    description:
      'Comma-separated list of properties to include in the query with optionally weighted values, e.g., "question^2,answer"',
  },
  {
    key: 'maxVectorDistance', n8nKey: 'options.maxVectorDistance',
    sourceN8nKey: 'maxVectorDistance', label: 'Hybrid: Max Vector Distance', kind: 'number',
    sourceKind: 'number', value: '', sourceDefault: undefined, required: false,
    validateType: 'number',
    description: 'Set the maximum allowable distance for the vector search component',
  },
];

const weaviateVectorStore = {
  type: 'weaviate-vector-store',
  n8nType: '@n8n/n8n-nodes-langchain.vectorStoreWeaviate',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1.3,
  defaultVersion: 1.3,
  versionHistory: [1, 1.1, 1.2, 1.3],
  label: 'Weaviate Vector Store',
  defaultName: 'Weaviate Vector Store',
  subtitle: '',
  description: 'Work with your data in a Weaviate Cluster',
  details:
    'Author document insertion, similarity or hybrid search, vector-store retrieval, or agent-tool retrieval against a Weaviate collection. No Weaviate connection or vector operation runs here.',
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
    { showWhen: { mode: ['load'], useReranker: [false] }, inputs: [embeddingInput, mainInput], outputs: [mainOutput] },
    { showWhen: { mode: ['load'], useReranker: [true] }, inputs: [embeddingInput, rerankerInput, mainInput], outputs: [mainOutput] },
    { showWhen: { mode: ['insert'] }, inputs: [embeddingInput, mainInput, documentInput], outputs: [mainOutput] },
    { showWhen: { mode: ['retrieve'], useReranker: [false] }, inputs: [embeddingInput], outputs: [vectorStoreOutput] },
    { showWhen: { mode: ['retrieve'], useReranker: [true] }, inputs: [embeddingInput, rerankerInput], outputs: [vectorStoreOutput] },
    { showWhen: { mode: ['retrieve-as-tool'], useReranker: [false] }, inputs: [embeddingInput], outputs: [toolOutput] },
    { showWhen: { mode: ['retrieve-as-tool'], useReranker: [true] }, inputs: [embeddingInput, rerankerInput], outputs: [toolOutput] },
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
    outputsByMode: { load: [mainOutput], insert: [mainOutput], retrieve: [vectorStoreOutput], 'retrieve-as-tool': [toolOutput] },
  },
  aiConnectorPorts: [
    { id: 'embedding', type: 'ai_embedding', connector: 'ai_embedding', label: 'Embedding', maxConnections: 1, required: true },
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
      "Pick mode by where data flows: `insert` adds documents on the main flow; `load` runs a one-shot search; `retrieve-as-tool` plugs into an AI Agent's tools; `retrieve` exposes the store to another AI node.",
    inputs: {
      ai_embedding: { required: true },
      ai_document: { required: true, displayOptions: { show: { mode: ['insert'] } } },
      ai_reranker: { required: true, displayOptions: { show: { mode: ['load', 'retrieve', 'retrieve-as-tool'], useReranker: [true] } } },
    },
    outputs: {
      main: { displayOptions: { show: { mode: ['insert', 'load'] } } },
      ai_vectorStore: { required: true, displayOptions: { show: { mode: ['retrieve'] } } },
      ai_tool: { required: true, displayOptions: { show: { mode: ['retrieve-as-tool'] } } },
    },
  },
  usableAsTool: false,
  icon: '/node-icons/weaviate-vector-store.svg',
  n8nIcon: 'file:weaviate.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 256, height: 296, viewBox: '0 0 256 296' },
  iconAssetSha256: '9aaee06c69663d892483d064232e449cec0ce2156e69a30579c6a31a2339c966',
  aliases: [],
  docs:
    'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreweaviate/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/vector_store/VectorStoreWeaviate/VectorStoreWeaviate.node.ts',
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
    weaviateUtilsPath:
      'packages/@n8n/nodes-langchain/nodes/vector_store/VectorStoreWeaviate/Weaviate.utils.ts',
    credentialPath: credentialDefinition.sourcePath,
    packagePath: 'packages/@n8n/nodes-langchain/package.json',
    iconPath:
      'packages/@n8n/nodes-langchain/nodes/vector_store/VectorStoreWeaviate/weaviate.svg',
    directDescriptionImports: [
      { module: '@n8n/ai-utilities', names: ['createVectorStoreNode'] },
      { module: '../shared/descriptions', names: ['weaviateCollectionRLC'] },
      { module: '../shared/methods/listSearch', names: ['weaviateCollectionsSearch'] },
    ],
    runtimeImportsExcluded: [
      { module: '@langchain/weaviate', names: ['WeaviateStore'] },
      { module: 'weaviate-client', names: ['WeaviateClient', 'Filters'] },
    ],
  },
  defaults: { name: 'Weaviate Vector Store' },
  credentials: [
    {
      name: 'weaviateApi', type: 'weaviateApi', displayName: 'Weaviate Credentials',
      required: true, locked: true, sourcePath: credentialDefinition.sourcePath,
    },
  ],
  credentialRequirements: [
    { type: 'weaviateApi', name: 'Weaviate Credentials', required: true, locked: true },
  ],
  credentialUiMetadata: [credentialDefinition],
  methods: {
    listSearch: {
      weaviateCollectionsSearch: {
        credentialType: 'weaviateApi',
        resultPath: 'collections[].name',
        resultMapping: { name: 'collection.name', value: 'collection.name' },
        inert: true,
      },
    },
  },
  params: [
    {
      key: 'weaviateCredential', n8nKey: 'credentials.weaviateApi', sourceN8nKey: 'credentials',
      label: 'Credentials', kind: 'select', sourceKind: 'credentials', value: 'weaviateApi',
      required: true, locked: true,
      dynamicOptions: { source: 'credentialStore', credentialType: 'weaviateApi', inert: true },
      options: [{ label: 'Weaviate Credentials', value: 'weaviateApi' }],
      simulationNote:
        'The credential selector is locked. The simulation never creates, reads, tests, or applies Weaviate credentials.',
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
      placeholder: 'e.g. Work with your data in a Weaviate Cluster',
      description:
        'Explain to the LLM what this tool does, a good, specific description would allow LLMs to produce expected results much more often',
      showWhen: { mode: ['retrieve-as-tool'] }, n8nShowWhen: { mode: ['retrieve-as-tool'] },
      simulationNote: 'Description text and expression syntax are stored without evaluation.',
    },
    {
      key: 'weaviateCollection', n8nKey: 'weaviateCollection',
      sourceN8nKey: 'weaviateCollection', label: 'Weaviate Collection',
      kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' },
      sourceDefault: { mode: 'list', value: '' }, required: true, locked: true,
      modes: ['list', 'id'],
      modeOptions: [
        {
          label: 'From List', value: 'list', sourceKind: 'list',
          searchListMethod: 'weaviateCollectionsSearch', options: [],
        },
        { label: 'ID', value: 'id', sourceKind: 'string' },
      ],
      dynamicOptions: {
        method: 'weaviateCollectionsSearch', credentialType: 'weaviateApi',
        resultPath: 'collections[].name', inert: true,
      },
      simulationNote:
        'Collection discovery is locked and empty because the simulation never reads credentials or contacts Weaviate.',
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
      fields: [...sharedOptionFields, clearStoreField],
      showWhen: { mode: ['insert'] }, n8nShowWhen: { mode: ['insert'] },
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
      fields: [...retrieveSpecificOptionFields, ...sharedOptionFields],
      showWhen: { mode: ['load', 'retrieve-as-tool'] },
      n8nShowWhen: { mode: ['load', 'retrieve-as-tool'] },
    },
    {
      key: 'retrieveOptions', n8nKey: 'options', sourceN8nKey: 'options', label: 'Options',
      kind: 'collection', sourceKind: 'collection', value: {}, sourceDefault: {},
      required: false, addLabel: 'Add Option', placeholder: 'Add Option',
      fields: [...retrieveSpecificOptionFields, ...sharedOptionFields],
      showWhen: { mode: ['retrieve'] }, n8nShowWhen: { mode: ['retrieve'] },
    },
  ],
  authoringParity: {
    currentVersion: 1.3,
    resourceCount: 0,
    operationCount: 4,
    recursiveFieldCount: 54,
    sourceVisibleFieldCount: 53,
    credentialSelectorCount: 1,
    credentialEditorFieldCount: 9,
    totalAuthoringFieldCount: 63,
    dynamicResourceLocatorCount: 1,
    operationModes: ['load', 'insert', 'retrieve', 'retrieve-as-tool'],
    providerSharedFields: ['weaviateCollection'],
    sharedOptionFields: [
      'tenant', 'textKey', 'skip_init_checks', 'timeout_init', 'timeout_insert',
      'timeout_query', 'proxy_grpc',
    ],
    insertOnlyOptionFields: ['clearStore'],
    retrieveSpecificOptionFields: [
      'searchFilterJson', 'metadataKeys', 'hybridQuery', 'hybridExplainScore', 'fusionType',
      'autoCutLimit', 'alpha', 'queryProperties', 'maxVectorDistance',
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
    outputsByMode: { load: ['Main'], insert: ['Main'], retrieve: ['Vector Store'], 'retrieve-as-tool': ['Tool'] },
  },
  dynamicAuthoringMetadata: {
    listSearchMethods: ['weaviateCollectionsSearch'],
    credentialSelectors: ['weaviateCredential'],
    lockedFields: ['weaviateCredential', 'weaviateCollection'],
    remoteDynamicFields: ['weaviateCredential', 'weaviateCollection'],
  },
  excludedHistoricalAuthoring: [
    {
      n8nKey: 'toolName', sourceVersionCondition: '@version <= 1.2',
      reason: 'v1.3 uses the node name as the tool name and exposes only toolDescription.',
    },
  ],
  excludedDormantAuthoring: [
    { mode: 'update', reason: 'Weaviate does not enable update in meta.operationModes.' },
    {
      n8nKey: 'id', sourceCondition: { mode: ['update'] },
      reason: 'The update operation mode is not enabled for Weaviate.',
    },
  ],
  rendererNormalizations: [
    { n8nKey: 'ragStarterCallout', sourceType: 'callout', normalizedKind: 'notice with calloutAction metadata' },
    { n8nKey: 'credentials.weaviateApi', sourceType: 'required credential selector', normalizedKind: 'locked select' },
    { n8nKey: 'weaviateCollection', sourceType: 'resourceLocator with listSearch', normalizedKind: 'locked resourceLocator with empty list and manual ID mode metadata' },
    { n8nKey: 'toolDescription', sourceType: 'string:rows=2', normalizedKind: 'textarea' },
    { n8nKey: 'prompt', sourceType: 'expression-capable string', normalizedKind: 'expression' },
    { n8nKey: 'options.searchFilterJson', sourceType: 'json', normalizedKind: 'textarea' },
    { n8nKey: 'options.autoCutLimit', sourceDefault: 'undefined', normalizedDefault: '' },
    { n8nKey: 'options.maxVectorDistance', sourceDefault: 'undefined', normalizedDefault: '' },
  ],
  platformGaps: [
    'The RAG starter callout action and vector-store-retriever notice retain their exact action metadata but are inert in the catalog renderer.',
    'Credential selection, the nine-field credential editor/test, and collection discovery are locked and never contact Weaviate.',
    'Filter JSON and expression syntax are stored without evaluation or parsing.',
    'All mode-dependent ports are declarative and never load embeddings, documents, rerankers, vector stores, or tools.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'ragStarterCallout', sourceType: 'callout', normalizedKind: 'notice' },
    { n8nKey: 'credentials.weaviateApi', sourceType: 'credentials', normalizedKind: 'locked select' },
    { n8nKey: 'weaviateCollection', sourceType: 'resourceLocator with remote listSearch', normalizedKind: 'locked resourceLocator' },
    { n8nKey: 'toolDescription', sourceType: 'string with rows=2', normalizedKind: 'textarea' },
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
    collectionClearing: false,
    tenantClearing: false,
    documentEmbedding: false,
    documentInsertion: false,
    similaritySearch: false,
    hybridSearch: false,
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

export default weaviateVectorStore;
