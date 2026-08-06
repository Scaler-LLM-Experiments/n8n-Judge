// Editor-only descriptor for Oracle Database Vector Store v1.3.
// Credentials, expressions, database access, vector operations, and execution remain inert.

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

const privilegeOptions = [
  { label: 'SYSASM', value: 32768, valueSource: 'oracledb.SYSASM' },
  { label: 'SYSBACKUP', value: 131072, valueSource: 'oracledb.SYSBACKUP' },
  { label: 'SYSDBA', value: 2, valueSource: 'oracledb.SYSDBA' },
  { label: 'SYSDG', value: 262144, valueSource: 'oracledb.SYSDG' },
  { label: 'SYSKM', value: 524288, valueSource: 'oracledb.SYSKM' },
  { label: 'SYSOPER', value: 4, valueSource: 'oracledb.SYSOPER' },
  { label: 'SYSPRELIM', value: 8, valueSource: 'oracledb.SYSPRELIM' },
  { label: 'SYSRAC', value: 1048576, valueSource: 'oracledb.SYSRAC' },
];

const credentialFields = [
  { key: 'user', n8nKey: 'user', label: 'User', kind: 'text', value: '', required: false, locked: true },
  { key: 'password', n8nKey: 'password', label: 'Password', kind: 'text', value: '', required: false, password: true, locked: true },
  {
    key: 'connectionString', n8nKey: 'connectionString', label: 'Connection String', kind: 'text',
    value: 'localhost/orcl', required: false, locked: true,
    description: 'The Oracle database instance to connect to',
  },
  {
    key: 'privilege', n8nKey: 'privilege', label: 'Privilege', kind: 'select', value: '',
    sourceDefault: undefined, required: false, locked: true, options: privilegeOptions,
    description: 'The privilege to use when connecting to the database',
  },
  {
    key: 'useThickMode', n8nKey: 'useThickMode', label: 'Use Optional Oracle Client Libraries',
    kind: 'boolean', value: false, required: false, locked: true,
    sourceDisplayOptions: { showOnDeployment: 'hosted' }, deploymentCondition: 'hosted',
    description: 'Define type of connection with database',
  },
  {
    key: 'useSSL', n8nKey: 'useSSL', label: 'Use SSL', kind: 'boolean', value: false,
    required: false, locked: true, showWhen: { useThickMode: [false] },
    description: 'SSL connection with database',
  },
  {
    key: 'walletPassword', n8nKey: 'walletPassword', label: 'Wallet Password', kind: 'text',
    value: '', required: false, password: true, locked: true,
    showWhen: { useThickMode: [false], useSSL: [true] },
    description: 'The password to decrypt the Privacy Enhanced Mail (PEM)-encoded private certificate, if it is encrypted',
  },
  {
    key: 'walletContent', n8nKey: 'walletContent', label: 'Wallet Content', kind: 'text',
    value: '', required: false, locked: true,
    showWhen: { useThickMode: [false], useSSL: [true] },
    description: 'The security credentials required to establish a mutual TLS (mTLS) connection to Oracle Database',
  },
  {
    key: 'sslServerCertDN', n8nKey: 'sslServerCertDN', label: 'Distinguished Name', kind: 'text',
    value: '', required: false, locked: true,
    showWhen: { useThickMode: [false], useSSL: [true] },
    description: 'The distinguished name (DN) that should be matched with the certificate DN',
  },
  {
    key: 'sslServerDNMatch', n8nKey: 'sslServerDNMatch', label: 'Match Distinguished Name',
    kind: 'boolean', value: true, required: false, locked: true,
    showWhen: { useThickMode: [false], useSSL: [true] },
    description: 'Whether the server certificate DN should be matched in addition to the regular certificate verification that is performed',
  },
  {
    key: 'sslAllowWeakDNMatch', n8nKey: 'sslAllowWeakDNMatch',
    label: 'Allow Weak Distinguished Name Match', kind: 'boolean', value: false,
    required: false, locked: true, showWhen: { useThickMode: [false], useSSL: [true] },
    description: 'Whether the secure DN matching behavior which checks both the listener and server certificates has to be performed',
  },
  {
    key: 'poolMin', n8nKey: 'poolMin', label: 'Pool Min', kind: 'number', value: 0,
    required: false, locked: true,
    description: 'The number of connections established to the database when a pool is created',
  },
  {
    key: 'poolMax', n8nKey: 'poolMax', label: 'Pool Max', kind: 'number', value: 4,
    required: false, locked: true,
    description: 'The maximum number of connections to which a connection pool can grow',
  },
  {
    key: 'poolIncrement', n8nKey: 'poolIncrement', label: 'Pool Increment', kind: 'number',
    value: 1, required: false, locked: true,
    description: 'The number of connections that are opened whenever a connection request exceeds the number of currently open connections',
  },
  {
    key: 'maxLifetimeSession', n8nKey: 'maxLifetimeSession',
    label: 'Pool Maximum Session Life Time', kind: 'number', value: 0,
    required: false, locked: true,
    description: 'The number of seconds that a pooled connection can exist in a pool after first being created',
  },
  {
    key: 'poolTimeout', n8nKey: 'poolTimeout', label: 'Pool Connection Idle Timeout',
    kind: 'number', value: 60, required: false, locked: true,
    description: 'The number of seconds after which idle connections (unused in the pool) may be terminated',
  },
  {
    key: 'connectionClass', n8nKey: 'connectionClass', label: 'Connection Class Name',
    kind: 'text', value: '', required: false, locked: true,
    description: 'DRCP/PRCP Connection Class',
  },
  {
    key: 'connectTimeout', n8nKey: 'connectTimeout', label: 'Connection Timeout',
    kind: 'number', value: 0, required: false, locked: true,
    showWhen: { useThickMode: [false] },
    description: 'The timeout duration in seconds for an application to establish an Oracle Net connection',
  },
  {
    key: 'transportConnectTimeout', n8nKey: 'transportConnectTimeout',
    label: 'Transport Connection Timeout', kind: 'number', value: 20,
    required: false, locked: true, showWhen: { useThickMode: [false] },
    description: 'The maximum number of seconds to wait to establish a connection to the database host',
  },
  {
    key: 'expireTime', n8nKey: 'expireTime', label: 'Keepalive Probe Interval',
    kind: 'number', value: 0, required: false, locked: true, min: 0,
    showWhen: { useThickMode: [false] },
    description: 'The number of minutes between the sending of keepalive probes',
  },
];

const credentialDefinition = {
  type: 'oracleDBApi', name: 'Oracle Database Credentials API', required: true,
  testedBy: 'oracleDBConnectionTest', documentationSlug: 'oracledb',
  sourcePath: 'packages/nodes-base/credentials/OracleDBApi.credentials.ts',
  fields: credentialFields,
  simulationNote: 'Credential fields are locked metadata and are never created, read, tested, or applied.',
};

const distanceStrategyField = {
  key: 'distanceStrategy', n8nKey: 'options.distanceStrategy', sourceN8nKey: 'distanceStrategy',
  label: 'Distance Strategy', kind: 'select', sourceKind: 'options', value: 'COSINE',
  required: false, description: 'The method to calculate the distance between two vectors',
  options: [
    { label: 'Cosine', value: 'COSINE' },
    { label: 'Inner Product', value: 'DOT' },
    { label: 'Euclidean', value: 'EUCLIDEAN' },
    { label: 'Manhattan', value: 'MANHATTAN' },
    { label: 'Euclidean Squared', value: 'EUCLIDEAN_SQUARED' },
    { label: 'Hamming', value: 'HAMMING' },
  ],
};

const metadataFilterField = {
  key: 'metadata', n8nKey: 'options.metadata', sourceN8nKey: 'metadata',
  label: 'Metadata Filter', kind: 'fixedCollection', sourceKind: 'fixedCollection',
  value: {}, sourceDefault: {}, required: false, multiple: true,
  collectionKey: 'metadataValues', collectionLabel: 'Fields to Set',
  addLabel: 'Add filter field', placeholder: 'Add filter field',
  description: 'Metadata to filter the document by',
  fields: [
    {
      key: 'name', n8nKey: 'options.metadata.metadataValues.name', sourceN8nKey: 'name',
      label: 'Name', kind: 'text', value: '', required: true,
    },
    {
      key: 'value', n8nKey: 'options.metadata.metadataValues.value', sourceN8nKey: 'value',
      label: 'Value', kind: 'text', value: '', required: false,
    },
  ],
};

const oracleDatabaseVectorStore = {
  type: 'oracle-database-vector-store',
  n8nType: '@n8n/n8n-nodes-langchain.vectorStoreOracleDBVector',
  packageName: '@n8n/n8n-nodes-langchain',
  n8nVersion: 1.3,
  defaultVersion: 1.3,
  versionHistory: [1, 1.1, 1.2, 1.3],
  label: 'Oracle Database Vector Store',
  defaultName: 'Oracle Database Vector Store',
  subtitle: '',
  description: 'Work with your data in OracleDB vector support',
  details: 'Author insert, search, vector-store retrieval, or agent-tool retrieval against an Oracle Database vector table. No database or vector operation runs here.',
  category: 'core', libraryCategory: 'ai', categories: ['AI'], subcategory: 'Vector Stores',
  subcategories: ['Vector Stores', 'Tools', 'Root Nodes', 'Other Vector Stores', 'Other Tools'],
  codexSubcategories: {
    AI: ['Vector Stores', 'Tools', 'Root Nodes'],
    'Vector Stores': ['Other Vector Stores'], Tools: ['Other Tools'],
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
  inputsExpression: '={{createVectorStoreNode dynamic inputs: Embedding; optional Reranker; Main for load/insert; Document for insert}}',
  outputsExpression: '={{createVectorStoreNode dynamic outputs: Main for load/insert; Vector Store for retrieve; Tool for retrieve-as-tool}}',
  dynamicInputMetadata: {
    enabled: true, declarativeOnly: true, modeParameter: 'mode', rerankerParameter: 'useReranker',
    rerankerModes: ['load', 'retrieve', 'retrieve-as-tool'], mainInputModes: ['insert', 'load'],
    documentInputModes: ['insert'], exactOrder: ['Embedding', 'Reranker', 'Main', 'Document'],
  },
  dynamicOutputMetadata: {
    enabled: true, declarativeOnly: true, modeParameter: 'mode',
    outputsByMode: { load: [mainOutput], insert: [mainOutput], retrieve: [vectorStoreOutput], 'retrieve-as-tool': [toolOutput] },
  },
  aiConnectorPorts: [
    { id: 'embedding', type: 'ai_embedding', connector: 'ai_embedding', label: 'Embedding', maxConnections: 1, required: true },
    { id: 'reranker', type: 'ai_reranker', connector: 'ai_reranker', label: 'Reranker', maxConnections: 1, required: true, showWhen: { mode: ['load', 'retrieve', 'retrieve-as-tool'], useReranker: [true] } },
    { id: 'document', type: 'ai_document', connector: 'ai_document', label: 'Document', maxConnections: 1, required: true, showWhen: { mode: ['insert'] } },
  ],
  builderHint: {
    searchHint: "Pick mode by where data flows: `insert` upserts documents into the store on the main flow; `load` runs a one-shot similarity search on the main flow; `retrieve-as-tool` is the canonical RAG mode — plug into an AI Agent's `subnodes.tools`; `retrieve` exposes the store as a subnode for another node's `subnodes.vectorStore`; `update` updates a single document by ID.",
    inputs: {
      ai_embedding: { required: true },
      ai_document: { required: true, displayOptions: { show: { mode: ['insert'] } } },
      ai_reranker: { required: true, displayOptions: { show: { mode: ['load', 'retrieve', 'retrieve-as-tool'], useReranker: [true] } } },
    },
    outputs: {
      main: { displayOptions: { show: { mode: ['insert', 'load', 'update'] } } },
      ai_vectorStore: { required: true, displayOptions: { show: { mode: ['retrieve'] } } },
      ai_tool: { required: true, displayOptions: { show: { mode: ['retrieve-as-tool'] } } },
    },
  },
  usableAsTool: false,
  icon: '/node-icons/oracle-database-vector-store.svg',
  n8nIcon: 'file:../../shared/icons/oracle.svg', iconMode: 'image', iconAssetType: 'svg',
  iconAssetSize: { width: 800, height: 800, viewBox: '0 0 24 24' },
  iconAssetSha256: '3fc5cf6ed1a75625b484e417117e8a95524807bd4a277afdc12d8ae8435d27c3',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreoracledb/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/@n8n/nodes-langchain/nodes/vector_store/VectorStoreOracleDB/VectorStoreOracleDB.node.ts',
    factoryPath: 'packages/@n8n/ai-utilities/src/utils/vector-store/createVectorStoreNode/createVectorStoreNode.ts',
    factoryUtilsPath: 'packages/@n8n/ai-utilities/src/utils/vector-store/createVectorStoreNode/utils.ts',
    factoryConstantsPath: 'packages/@n8n/ai-utilities/src/utils/vector-store/createVectorStoreNode/constants.ts',
    sharedFieldsPath: 'packages/@n8n/ai-utilities/src/utils/shared-fields.ts',
    credentialPath: credentialDefinition.sourcePath,
    credentialTestPath: 'packages/nodes-base/nodes/Oracle/Sql/methods/credentialTest.ts',
    transportPath: 'packages/nodes-base/nodes/Oracle/Sql/transport/index.ts',
    packagePath: 'packages/@n8n/nodes-langchain/package.json',
    iconPath: 'packages/@n8n/nodes-langchain/nodes/shared/icons/oracle.svg',
    directDescriptionImports: [
      { module: '@n8n/ai-utilities', names: ['createVectorStoreNode', 'metadataFilterField'] },
      { module: '@oracle/langchain-oracledb', names: ['DistanceStrategy'] },
    ],
    runtimeImportsExcluded: [
      { module: '@oracle/langchain-oracledb', names: ['OracleVS'] },
      { module: 'n8n-nodes-base/dist/nodes/Oracle/Sql/transport', names: ['configureOracleDB'] },
      { module: 'oracledb', names: ['Pool', 'Connection'] },
    ],
  },
  defaults: { name: 'Oracle Database Vector Store' },
  credentials: [{ name: 'oracleDBApi', type: 'oracleDBApi', displayName: 'Oracle Database Credentials API', required: true, testedBy: 'oracleDBConnectionTest', locked: true, sourcePath: credentialDefinition.sourcePath }],
  credentialRequirements: [{ type: 'oracleDBApi', name: 'Oracle Database Credentials API', required: true, testedBy: 'oracleDBConnectionTest', locked: true }],
  credentialUiMetadata: [credentialDefinition],
  params: [
    {
      key: 'oracleCredential', n8nKey: 'credentials.oracleDBApi', sourceN8nKey: 'credentials',
      label: 'Credentials', kind: 'select', sourceKind: 'credentials', value: 'oracleDBApi',
      required: true, locked: true, testedBy: 'oracleDBConnectionTest',
      dynamicOptions: { source: 'credentialStore', credentialType: 'oracleDBApi', inert: true },
      options: [{ label: 'Oracle Database Credentials API', value: 'oracleDBApi' }],
      simulationNote: 'The locked selector never creates, reads, tests, or applies Oracle credentials.',
    },
    {
      key: 'ragStarterCallout', n8nKey: 'ragStarterCallout', sourceN8nKey: 'ragStarterCallout',
      label: 'Tip: Get a feel for vector stores in n8n with our', kind: 'notice', sourceKind: 'callout',
      value: '', required: false,
      calloutAction: { label: 'RAG starter template', type: 'openSampleWorkflowTemplate', templateId: 'rag-starter-template', inert: true },
    },
    { key: 'mode', n8nKey: 'mode', sourceN8nKey: 'mode', label: 'Operation Mode', kind: 'select', sourceKind: 'options', value: 'retrieve', required: false, noDataExpression: true, options: operationModeOptions },
    {
      key: 'retrieverConnectionNotice', n8nKey: 'notice', sourceN8nKey: 'notice',
      label: "This node must be connected to a vector store retriever. <a data-action='openSelectiveNodeCreator' data-action-parameter-connectiontype='ai_retriever'>Insert one</a>",
      kind: 'notice', sourceKind: 'notice', value: '', required: false,
      showWhen: { mode: ['retrieve'] }, n8nShowWhen: { mode: ['retrieve'] },
      containerClass: 'ndv-connection-hint-notice',
    },
    {
      key: 'toolDescription', n8nKey: 'toolDescription', sourceN8nKey: 'toolDescription',
      label: 'Description', kind: 'textarea', sourceKind: 'string:rows=2', value: '',
      required: true, rows: 2, expressionAllowed: true,
      description: 'Explain to the LLM what this tool does, a good, specific description would allow LLMs to produce expected results much more often',
      placeholder: 'e.g. Work with your data in OracleDB vector support',
      showWhen: { mode: ['retrieve-as-tool'] }, n8nShowWhen: { mode: ['retrieve-as-tool'] },
      simulationNote: 'Description text and expression syntax are stored without evaluation.',
    },
    {
      key: 'tableName', n8nKey: 'tableName', sourceN8nKey: 'tableName', label: 'Table Name',
      kind: 'text', sourceKind: 'string', value: 'n8n_vectors', required: false,
      description: 'The table name to store the vectors in. If table does not exist, it will be created.',
      simulationNote: 'The table name is stored only; no table is inspected or created.',
    },
    {
      key: 'embeddingBatchSize', n8nKey: 'embeddingBatchSize', sourceN8nKey: 'embeddingBatchSize',
      label: 'Embedding Batch Size', kind: 'number', sourceKind: 'number', value: 200,
      required: false, description: 'Number of documents to embed in a single batch',
      showWhen: { mode: ['insert'] }, n8nShowWhen: { mode: ['insert'] },
      sourceVersionCondition: '@version >= 1.1',
      sourceDisplayOptions: { show: { mode: ['insert'], '@version': [{ _cnd: { gte: 1.1 } }] } },
    },
    {
      key: 'insertOptions', n8nKey: 'options', sourceN8nKey: 'options', label: 'Options',
      kind: 'collection', sourceKind: 'collection', value: {}, sourceDefault: {}, required: false,
      addLabel: 'Add Option', fields: [], showWhen: { mode: ['insert'] }, n8nShowWhen: { mode: ['insert'] },
    },
    {
      key: 'prompt', n8nKey: 'prompt', sourceN8nKey: 'prompt', label: 'Prompt',
      kind: 'expression', sourceKind: 'string', value: '', required: true, expressionAllowed: true,
      description: 'Search prompt to retrieve matching documents from the vector store using similarity-based ranking',
      showWhen: { mode: ['load'] }, n8nShowWhen: { mode: ['load'] },
      simulationNote: 'Prompt text and expression syntax are stored without evaluation.',
    },
    { key: 'topK', n8nKey: 'topK', sourceN8nKey: 'topK', label: 'Limit', kind: 'number', sourceKind: 'number', value: 4, required: false, description: 'Number of top results to fetch from vector store', showWhen: { mode: ['load', 'retrieve-as-tool'] }, n8nShowWhen: { mode: ['load', 'retrieve-as-tool'] } },
    { key: 'includeDocumentMetadata', n8nKey: 'includeDocumentMetadata', sourceN8nKey: 'includeDocumentMetadata', label: 'Include Metadata', kind: 'boolean', sourceKind: 'boolean', value: true, required: false, description: 'Whether or not to include document metadata', showWhen: { mode: ['load', 'retrieve-as-tool'] }, n8nShowWhen: { mode: ['load', 'retrieve-as-tool'] } },
    { key: 'useReranker', n8nKey: 'useReranker', sourceN8nKey: 'useReranker', label: 'Rerank Results', kind: 'boolean', sourceKind: 'boolean', value: false, required: false, description: 'Whether or not to rerank results', showWhen: { mode: ['load', 'retrieve', 'retrieve-as-tool'] }, n8nShowWhen: { mode: ['load', 'retrieve', 'retrieve-as-tool'] } },
    {
      key: 'loadAndToolOptions', n8nKey: 'options', sourceN8nKey: 'options', label: 'Options',
      kind: 'collection', sourceKind: 'collection', value: {}, sourceDefault: {}, required: false,
      addLabel: 'Add Option', fields: [distanceStrategyField, metadataFilterField],
      showWhen: { mode: ['load', 'retrieve-as-tool'] }, n8nShowWhen: { mode: ['load', 'retrieve-as-tool'] },
    },
    {
      key: 'retrieveOptions', n8nKey: 'options', sourceN8nKey: 'options', label: 'Options',
      kind: 'collection', sourceKind: 'collection', value: {}, sourceDefault: {}, required: false,
      addLabel: 'Add Option', fields: [distanceStrategyField, metadataFilterField],
      showWhen: { mode: ['retrieve'] }, n8nShowWhen: { mode: ['retrieve'] },
    },
  ],
  authoringParity: {
    currentVersion: 1.3, resourceCount: 0, operationCount: 4,
    recursiveFieldCount: 22, sourceVisibleFieldCount: 21, credentialSelectorCount: 1,
    credentialEditorFieldCount: 20, totalAuthoringFieldCount: 42,
    operationModes: ['load', 'insert', 'retrieve', 'retrieve-as-tool'],
    distanceStrategyCount: 6, metadataFilterFieldCount: 2,
    providerSharedFields: ['tableName'], insertFields: ['options'],
    loadFields: ['options.distanceStrategy', 'options.metadata'],
    retrieveFields: ['options.distanceStrategy', 'options.metadata'],
  },
  portParity: {
    variantCount: 7, defaultMode: 'retrieve', defaultInputs: ['Embedding'],
    defaultOutputs: ['Vector Store'], modesWithOptionalReranker: ['load', 'retrieve', 'retrieve-as-tool'],
    insertInputs: ['Embedding', 'Main', 'Document'], loadInputs: ['Embedding', 'Main'],
    retrieveInputs: ['Embedding'], retrieveAsToolInputs: ['Embedding'],
    outputsByMode: { load: ['Main'], insert: ['Main'], retrieve: ['Vector Store'], 'retrieve-as-tool': ['Tool'] },
  },
  dynamicAuthoringMetadata: {
    listSearchMethods: [], credentialSelectors: ['oracleCredential'],
    lockedFields: ['oracleCredential'], remoteDynamicFields: ['oracleCredential'],
  },
  excludedHistoricalAuthoring: [
    { n8nKey: 'toolName', sourceVersionCondition: '@version <= 1.2', reason: 'v1.3 uses the node name as the tool name.' },
  ],
  excludedDormantAuthoring: [
    { mode: 'update', reason: 'Oracle Database Vector Store does not enable update in meta.operationModes.' },
    { n8nKey: 'id', sourceCondition: { mode: ['update'] }, reason: 'The update mode is not enabled.' },
  ],
  rendererNormalizations: [
    { n8nKey: 'ragStarterCallout', sourceType: 'callout', normalizedKind: 'notice with calloutAction metadata' },
    { n8nKey: 'credentials.oracleDBApi', sourceType: 'required credential selector', normalizedKind: 'locked select' },
    { n8nKey: 'toolDescription', sourceType: 'string:rows=2', normalizedKind: 'textarea' },
    { n8nKey: 'prompt', sourceType: 'expression-capable string', normalizedKind: 'expression' },
    { n8nKey: 'credentials.oracleDBApi.privilege', sourceDefault: 'undefined', normalizedDefault: '' },
  ],
  platformGaps: [
    'The RAG starter and retriever insertion actions are retained as inert metadata.',
    'The locked credential selector cannot open the external 20-field Oracle credential editor or run oracleDBConnectionTest.',
    'Mode-dependent ports are declarative and never load embeddings, documents, rerankers, vector stores, or tools.',
    'Credential deployment conditions are retained as metadata; no deployment environment is inspected.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'ragStarterCallout', sourceType: 'callout', normalizedKind: 'notice' },
    { n8nKey: 'credentials.oracleDBApi', sourceType: 'credentials', normalizedKind: 'locked select' },
    { n8nKey: 'toolDescription', sourceType: 'string with rows=2', normalizedKind: 'textarea' },
  ],
  simulation: {
    configurationOnly: true, credentialCreation: false, credentialAccess: false,
    credentialTesting: false, deploymentInspection: false, expressionResolution: false,
    databaseAccess: false, poolCreation: false, tableCreation: false, vectorStoreClient: false,
    documentEmbedding: false, documentInsertion: false, similaritySearch: false,
    metadataFiltering: false, reranking: false, toolCreation: false, workflowExecution: false,
    supplyData: false, networkAccess: false, webhooks: false, polling: false, voice: false,
  },
  output: {},
};

export default oracleDatabaseVectorStore;
