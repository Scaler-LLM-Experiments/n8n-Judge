// Editor-only descriptor for the standalone Google Gemini v1.2 action node.
// Model lookup, credentials, tool execution, file transfer, generation, and all
// Gemini API behavior remain inert in this authoring simulation.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This selector is locked. The simulation never creates, reads, tests, or applies Google Gemini credentials.';
const lockedModelNote =
  'From List normally searches the live Gemini model catalog. The list is intentionally locked and empty; ID authoring remains available.';

const audioOperations = [
  { label: 'Analyze Audio', value: 'analyze', action: 'Analyze audio', description: 'Take in audio and answer questions about it' },
  { label: 'Transcribe a Recording', value: 'transcribe', action: 'Transcribe a recording', description: 'Transcribes audio into the text' },
];

const documentOperations = [
  { label: 'Analyze Document', value: 'analyze', action: 'Analyze document', description: 'Take in documents and answer questions about them' },
];

const fileOperations = [
  { label: 'Upload Media File', value: 'upload', action: 'Upload a media file', description: 'Upload a file to the Google Gemini API for later use' },
];

const fileSearchOperations = [
  {
    label: 'Create File Search Store', value: 'createStore', action: 'Create a File Search store',
    description: 'Create a new File Search store for RAG (Retrieval Augmented Generation)',
  },
  { label: 'Delete File Search Store', value: 'deleteStore', action: 'Delete a File Search store', description: 'Delete a File Search store' },
  { label: 'List File Search Stores', value: 'listStores', action: 'List all File Search stores', description: 'List all File Search stores owned by the user' },
  {
    label: 'Upload to File Search Store', value: 'uploadToStore', action: 'Upload a file to a File Search store',
    description: 'Upload a file to a File Search store for RAG (Retrieval Augmented Generation)',
  },
];

const imageOperations = [
  { label: 'Analyze Image', value: 'analyze', action: 'Analyze an image', description: 'Take in images and answer questions about them' },
  { label: 'Generate an Image', value: 'generate', action: 'Generate an image', description: 'Creates an image from a text prompt' },
  { label: 'Edit Image', value: 'edit', action: 'Edit an image', description: 'Upload one or more images and apply edits based on a prompt' },
];

const textOperations = [
  { label: 'Message a Model', value: 'message', action: 'Message a model', description: 'Create a completion with Google Gemini model' },
];

const videoOperations = [
  { label: 'Analyze Video', value: 'analyze', action: 'Analyze video', description: 'Take in videos and answer questions about them' },
  { label: 'Generate a Video', value: 'generate', action: 'Generate a video', description: 'Creates a video from a text prompt' },
  { label: 'Download Video', value: 'download', action: 'Download a video', description: 'Download a generated video from the Google Gemini API using a URL' },
];

const googleGemini = {
  type: 'google-gemini',
  n8nType: '@n8n/n8n-nodes-langchain.googleGemini',
  n8nVersion: 1.2,
  defaultVersion: 1.2,
  versionHistory: [1, 1.1, 1.2],
  label: 'Google Gemini',
  defaultName: 'Google Gemini',
  subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
  description: 'Message Gemini, analyze documents and audio, generate images and video, and search files',
  category: 'action',
  categories: ['AI'],
  subcategories: ['Agents', 'Miscellaneous', 'Root Nodes'],
  group: ['transform'],
  defaults: { name: 'Google Gemini' },
  inputs: ['main'],
  outputs: ['main'],
  portVariants: [
    {
      showWhen: { resource: ['text'], textOperation: ['message'] },
      n8nShowWhen: { resource: ['text'], operation: ['message'] },
      inputs: [
        { type: 'main' },
        { type: 'ai_tool', label: 'Tools', required: false },
      ],
      outputs: [{ type: 'main' }],
    },
  ],
  dynamicInputMetadata: {
    sourceExpression:
      "={{ (() => { const resource = $parameter.resource; const operation = $parameter.operation; if (resource === 'text' && operation === 'message') return [{ type: 'main' }, { type: 'ai_tool', displayName: 'Tools' }]; return ['main']; })() }}",
    defaultInputs: [{ type: 'main' }],
    textMessageInputs: [
      { type: 'main' },
      { type: 'ai_tool', displayName: 'Tools' },
    ],
  },
  usableAsTool: true,
  toolConnector: 'ai_tool',
  icon: '/node-icons/google-gemini.svg',
  n8nIcon: 'file:gemini.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 64, height: 64, viewBox: '0 0 64 64' },
  iconAssetSha256: 'ecfddf1e3e667076e24d18cec9bde2d14d9f9833ed8caefba7543d10cfe6963e',
  aliases: ['LangChain', 'video', 'document', 'audio', 'transcribe', 'assistant'],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.googlegemini/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/googleai/',
  source: {
    commit: sourceCommit,
    path: 'packages/@n8n/nodes-langchain/nodes/vendors/GoogleGemini/GoogleGemini.node.ts',
    versionPath: 'packages/@n8n/nodes-langchain/nodes/vendors/GoogleGemini/actions/versionDescription.ts',
    commonDescriptionPath: 'packages/@n8n/nodes-langchain/nodes/vendors/GoogleGemini/actions/descriptions.ts',
    actionRoot: 'packages/@n8n/nodes-langchain/nodes/vendors/GoogleGemini/actions',
    methodPath: 'packages/@n8n/nodes-langchain/nodes/vendors/GoogleGemini/methods/listSearch.ts',
    credentialPath: 'packages/@n8n/nodes-langchain/credentials/GooglePalmApi.credentials.ts',
    iconPath: 'packages/@n8n/nodes-langchain/nodes/vendors/GoogleGemini/gemini.svg',
    parameterPaths: [
      'actions/audio/analyze.operation.ts',
      'actions/audio/transcribe.operation.ts',
      'actions/document/analyze.operation.ts',
      'actions/file/upload.operation.ts',
      'actions/fileSearch/createStore.operation.ts',
      'actions/fileSearch/deleteStore.operation.ts',
      'actions/fileSearch/listStores.operation.ts',
      'actions/fileSearch/uploadToStore.operation.ts',
      'actions/image/analyze.operation.ts',
      'actions/image/edit.operation.ts',
      'actions/image/generate.operation.ts',
      'actions/text/message.operation.ts',
      'actions/video/analyze.operation.ts',
      'actions/video/download.operation.ts',
      'actions/video/generate.operation.ts',
    ],
  },
  resources: [
    { value: 'audio', defaultOperation: 'transcribe', operations: ['analyze', 'transcribe'] },
    { value: 'document', defaultOperation: 'analyze', operations: ['analyze'] },
    { value: 'fileSearch', defaultOperation: 'createStore', operations: ['createStore', 'deleteStore', 'listStores', 'uploadToStore'] },
    { value: 'image', defaultOperation: 'generate', operations: ['analyze', 'generate', 'edit'] },
    { value: 'file', defaultOperation: 'upload', operations: ['upload'] },
    { value: 'text', defaultOperation: 'message', operations: ['message'] },
    { value: 'video', defaultOperation: 'generate', operations: ['analyze', 'generate', 'download'] },
  ],
  credentialRequirements: [
    {
      type: 'googlePalmApi',
      name: 'Google Gemini(PaLM) Api',
      required: true,
      inert: true,
      documentationUrl: 'google',
      authenticate: { type: 'queryString', parameter: 'key', source: 'apiKey', inert: true },
      testRequest: { baseURL: '={{$credentials.host}}/v1beta/models', inert: true },
      fields: [
        {
          key: 'host', n8nKey: 'host', label: 'Host', kind: 'text', sourceKind: 'string',
          value: 'https://generativelanguage.googleapis.com', required: true,
        },
        {
          key: 'apiKey', n8nKey: 'apiKey', label: 'API Key', kind: 'text', sourceKind: 'string',
          value: '', required: true, password: true,
        },
      ],
    },
  ],
  credentialUiMetadata: [
    {
      key: 'googlePalmApiCredential', type: 'googlePalmApi', name: 'Google Gemini(PaLM) Api',
      sourcePath: 'packages/@n8n/nodes-langchain/credentials/GooglePalmApi.credentials.ts',
      renderedInCredentialEditor: false, inert: true,
    },
  ],
  params: [
    {
      key: 'googlePalmApiCredential', n8nKey: 'credentials.googlePalmApi',
      label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials',
      value: 'googlePalmApi', required: true, locked: true, dynamic: true,
      options: [{ label: 'Google Gemini(PaLM) Api', value: 'googlePalmApi' }],
      simulationNote: lockedCredentialNote,
    },
    {
      key: 'resource', n8nKey: 'resource', label: 'Resource', kind: 'select', sourceKind: 'options',
      value: 'text', required: false, noDataExpression: true,
      options: [
        { label: 'Audio', value: 'audio' },
        { label: 'Document', value: 'document' },
        { label: 'File Search', value: 'fileSearch' },
        { label: 'Image', value: 'image' },
        { label: 'Media File', value: 'file' },
        { label: 'Text', value: 'text' },
        { label: 'Video', value: 'video' },
      ],
    },
    {
      key: 'audioOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options',
      value: 'transcribe', required: false, noDataExpression: true, showWhen: { resource: ['audio'] }, options: audioOperations,
    },
    {
      key: 'documentOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options',
      value: 'analyze', required: false, noDataExpression: true, showWhen: { resource: ['document'] }, options: documentOperations,
    },
    {
      key: 'fileSearchOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options',
      value: 'createStore', required: false, noDataExpression: true, showWhen: { resource: ['fileSearch'] }, options: fileSearchOperations,
    },
    {
      key: 'imageOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options',
      value: 'generate', required: false, noDataExpression: true, showWhen: { resource: ['image'] }, options: imageOperations,
    },
    {
      key: 'fileOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options',
      value: 'upload', required: false, noDataExpression: true, showWhen: { resource: ['file'] }, options: fileOperations,
    },
    {
      key: 'textOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options',
      value: 'message', required: false, noDataExpression: true, showWhen: { resource: ['text'] }, options: textOperations,
    },
    {
      key: 'videoOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options',
      value: 'generate', required: false, noDataExpression: true, showWhen: { resource: ['video'] }, options: videoOperations,
    },
    {
      key: 'audioAnalyzeModelId', n8nKey: 'modelId', label: 'Model', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
      locked: true, dynamic: true, loadOptionsDependsOn: ['operation', 'resource'], modes: ['list', 'id'],
      modeOptions: [
        { label: 'From List', value: 'list', kind: 'list', searchable: true, searchListMethod: 'audioModelSearch' },
        { label: 'ID', value: 'id', kind: 'text', placeholder: 'e.g. models/gemini-2.5-flash' },
      ], options: [], showWhen: { resource: ['audio'], audioOperation: ['analyze'] },
      n8nShowWhen: { resource: ['audio'], operation: ['analyze'] }, simulationNote: lockedModelNote,
    },
    {
      key: 'audioAnalyzeText', n8nKey: 'text', label: 'Text Input', kind: 'textarea', sourceKind: 'string',
      value: "What's in this audio?", required: false, rows: 2, placeholder: "e.g. What's in this audio?",
      showWhen: { resource: ['audio'], audioOperation: ['analyze'] }, n8nShowWhen: { resource: ['audio'], operation: ['analyze'] },
    },
    {
      key: 'audioAnalyzeInputType', n8nKey: 'inputType', label: 'Input Type', kind: 'select', sourceKind: 'options',
      value: 'url', required: false, options: [
        { label: 'Audio URL(s)', value: 'url' }, { label: 'Binary File(s)', value: 'binary' },
      ], showWhen: { resource: ['audio'], audioOperation: ['analyze'] }, n8nShowWhen: { resource: ['audio'], operation: ['analyze'] },
    },
    {
      key: 'audioAnalyzeUrls', n8nKey: 'audioUrls', label: 'URL(s)', kind: 'text', value: '', required: false,
      placeholder: 'e.g. https://example.com/audio.mp3',
      description: 'URL(s) of the audio(s) to analyze, multiple URLs can be added separated by comma',
      showWhen: { resource: ['audio'], audioOperation: ['analyze'], audioAnalyzeInputType: ['url'] },
      n8nShowWhen: { resource: ['audio'], operation: ['analyze'], inputType: ['url'] },
    },
    {
      key: 'audioAnalyzeBinaryPropertyName', n8nKey: 'binaryPropertyName', label: 'Input Data Field Name(s)',
      kind: 'text', value: 'data', required: false, placeholder: 'e.g. data',
      hint: 'The name of the input field containing the binary file data to be processed',
      description: 'Name of the binary field(s) which contains the audio(s), seperate multiple field names with commas',
      showWhen: { resource: ['audio'], audioOperation: ['analyze'], audioAnalyzeInputType: ['binary'] },
      n8nShowWhen: { resource: ['audio'], operation: ['analyze'], inputType: ['binary'] },
    },
    {
      key: 'audioAnalyzeSimplify', n8nKey: 'simplify', label: 'Simplify Output', kind: 'boolean', value: true, required: false,
      description: 'Whether to simplify the response or not', showWhen: { resource: ['audio'], audioOperation: ['analyze'] },
      n8nShowWhen: { resource: ['audio'], operation: ['analyze'] },
    },
    {
      key: 'audioAnalyzeOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Option', showWhen: { resource: ['audio'], audioOperation: ['analyze'] },
      n8nShowWhen: { resource: ['audio'], operation: ['analyze'] }, fields: [
        {
          key: 'maxOutputTokens', label: 'Length of Description (Max Tokens)', kind: 'number', value: 300, required: false, min: 1,
          description: 'Fewer tokens will result in shorter, less detailed audio description',
        },
      ],
    },

    {
      key: 'audioTranscribeModelId', n8nKey: 'modelId', label: 'Model', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
      locked: true, dynamic: true, loadOptionsDependsOn: ['operation', 'resource'], modes: ['list', 'id'],
      modeOptions: [
        { label: 'From List', value: 'list', kind: 'list', searchable: true, searchListMethod: 'audioModelSearch' },
        { label: 'ID', value: 'id', kind: 'text', placeholder: 'e.g. models/gemini-2.5-flash' },
      ], options: [], showWhen: { resource: ['audio'], audioOperation: ['transcribe'] },
      n8nShowWhen: { resource: ['audio'], operation: ['transcribe'] }, simulationNote: lockedModelNote,
    },
    {
      key: 'audioTranscribeInputType', n8nKey: 'inputType', label: 'Input Type', kind: 'select', sourceKind: 'options',
      value: 'url', required: false, options: [
        { label: 'Audio URL(s)', value: 'url' }, { label: 'Binary File(s)', value: 'binary' },
      ], showWhen: { resource: ['audio'], audioOperation: ['transcribe'] }, n8nShowWhen: { resource: ['audio'], operation: ['transcribe'] },
    },
    {
      key: 'audioTranscribeUrls', n8nKey: 'audioUrls', label: 'URL(s)', kind: 'text', value: '', required: false,
      placeholder: 'e.g. https://example.com/audio.mp3',
      description: 'URL(s) of the audio(s) to transcribe, multiple URLs can be added separated by comma',
      showWhen: { resource: ['audio'], audioOperation: ['transcribe'], audioTranscribeInputType: ['url'] },
      n8nShowWhen: { resource: ['audio'], operation: ['transcribe'], inputType: ['url'] },
    },
    {
      key: 'audioTranscribeBinaryPropertyName', n8nKey: 'binaryPropertyName', label: 'Input Data Field Name(s)',
      kind: 'text', value: 'data', required: false, placeholder: 'e.g. data',
      hint: 'The name of the input field containing the binary file data to be processed',
      description: 'Name of the binary field(s) which contains the audio(s), seperate multiple field names with commas',
      showWhen: { resource: ['audio'], audioOperation: ['transcribe'], audioTranscribeInputType: ['binary'] },
      n8nShowWhen: { resource: ['audio'], operation: ['transcribe'], inputType: ['binary'] },
    },
    {
      key: 'audioTranscribeSimplify', n8nKey: 'simplify', label: 'Simplify Output', kind: 'boolean', value: true, required: false,
      description: 'Whether to simplify the response or not', showWhen: { resource: ['audio'], audioOperation: ['transcribe'] },
      n8nShowWhen: { resource: ['audio'], operation: ['transcribe'] },
    },
    {
      key: 'audioTranscribeOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Option', showWhen: { resource: ['audio'], audioOperation: ['transcribe'] },
      n8nShowWhen: { resource: ['audio'], operation: ['transcribe'] }, fields: [
        {
          key: 'startTime', label: 'Start Time', kind: 'text', value: '', required: false, placeholder: 'e.g. 00:15',
          description: 'The start time of the audio in MM:SS or HH:MM:SS format',
        },
        {
          key: 'endTime', label: 'End Time', kind: 'text', value: '', required: false, placeholder: 'e.g. 02:15',
          description: 'The end time of the audio in MM:SS or HH:MM:SS format',
        },
      ],
    },

    {
      key: 'documentAnalyzeModelId', n8nKey: 'modelId', label: 'Model', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
      locked: true, dynamic: true, loadOptionsDependsOn: ['operation', 'resource'], modes: ['list', 'id'],
      modeOptions: [
        { label: 'From List', value: 'list', kind: 'list', searchable: true, searchListMethod: 'modelSearch' },
        { label: 'ID', value: 'id', kind: 'text', placeholder: 'e.g. models/gemini-2.5-flash' },
      ], options: [], showWhen: { resource: ['document'], documentOperation: ['analyze'] },
      n8nShowWhen: { resource: ['document'], operation: ['analyze'] }, simulationNote: lockedModelNote,
    },
    {
      key: 'documentAnalyzeText', n8nKey: 'text', label: 'Text Input', kind: 'textarea', sourceKind: 'string',
      value: "What's in this document?", required: false, rows: 2, placeholder: "e.g. What's in this document?",
      showWhen: { resource: ['document'], documentOperation: ['analyze'] }, n8nShowWhen: { resource: ['document'], operation: ['analyze'] },
    },
    {
      key: 'documentAnalyzeInputType', n8nKey: 'inputType', label: 'Input Type', kind: 'select', sourceKind: 'options',
      value: 'url', required: false, options: [
        { label: 'Document URL(s)', value: 'url' }, { label: 'Binary File(s)', value: 'binary' },
      ], showWhen: { resource: ['document'], documentOperation: ['analyze'] }, n8nShowWhen: { resource: ['document'], operation: ['analyze'] },
    },
    {
      key: 'documentAnalyzeUrls', n8nKey: 'documentUrls', label: 'URL(s)', kind: 'text', value: '', required: false,
      placeholder: 'e.g. https://example.com/document.pdf',
      description: 'URL(s) of the document(s) to analyze, multiple URLs can be added separated by comma',
      showWhen: { resource: ['document'], documentOperation: ['analyze'], documentAnalyzeInputType: ['url'] },
      n8nShowWhen: { resource: ['document'], operation: ['analyze'], inputType: ['url'] },
    },
    {
      key: 'documentAnalyzeBinaryPropertyName', n8nKey: 'binaryPropertyName', label: 'Input Data Field Name(s)',
      kind: 'text', value: 'data', required: false, placeholder: 'e.g. data',
      hint: 'The name of the input field containing the binary file data to be processed',
      description: 'Name of the binary field(s) which contains the document(s), seperate multiple field names with commas',
      showWhen: { resource: ['document'], documentOperation: ['analyze'], documentAnalyzeInputType: ['binary'] },
      n8nShowWhen: { resource: ['document'], operation: ['analyze'], inputType: ['binary'] },
    },
    {
      key: 'documentAnalyzeSimplify', n8nKey: 'simplify', label: 'Simplify Output', kind: 'boolean', value: true, required: false,
      description: 'Whether to simplify the response or not', showWhen: { resource: ['document'], documentOperation: ['analyze'] },
      n8nShowWhen: { resource: ['document'], operation: ['analyze'] },
    },
    {
      key: 'documentAnalyzeOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Option', showWhen: { resource: ['document'], documentOperation: ['analyze'] },
      n8nShowWhen: { resource: ['document'], operation: ['analyze'] }, fields: [
        {
          key: 'maxOutputTokens', label: 'Length of Description (Max Tokens)', kind: 'number', value: 300, required: false, min: 1,
          description: 'Fewer tokens will result in shorter, less detailed document description',
        },
      ],
    },

    {
      key: 'fileUploadInputType', n8nKey: 'inputType', label: 'Input Type', kind: 'select', sourceKind: 'options',
      value: 'url', required: false, options: [
        { label: 'File URL', value: 'url' }, { label: 'Binary File', value: 'binary' },
      ], showWhen: { resource: ['file'], fileOperation: ['upload'] }, n8nShowWhen: { resource: ['file'], operation: ['upload'] },
    },
    {
      key: 'fileUploadUrl', n8nKey: 'fileUrl', label: 'URL', kind: 'text', value: '', required: false,
      placeholder: 'e.g. https://example.com/file.pdf', description: 'URL of the file to upload',
      showWhen: { resource: ['file'], fileOperation: ['upload'], fileUploadInputType: ['url'] },
      n8nShowWhen: { resource: ['file'], operation: ['upload'], inputType: ['url'] },
    },
    {
      key: 'fileUploadBinaryPropertyName', n8nKey: 'binaryPropertyName', label: 'Input Data Field Name',
      kind: 'text', value: 'data', required: false, placeholder: 'e.g. data',
      hint: 'The name of the input field containing the binary file data to be processed',
      description: 'Name of the binary property which contains the file',
      showWhen: { resource: ['file'], fileOperation: ['upload'], fileUploadInputType: ['binary'] },
      n8nShowWhen: { resource: ['file'], operation: ['upload'], inputType: ['binary'] },
    },

    {
      key: 'fileSearchCreateDisplayName', n8nKey: 'displayName', label: 'Display Name', kind: 'text',
      value: '', required: true, placeholder: 'e.g. My File Search Store',
      description: 'A human-readable name for the File Search store',
      showWhen: { resource: ['fileSearch'], fileSearchOperation: ['createStore'] },
      n8nShowWhen: { resource: ['fileSearch'], operation: ['createStore'] },
    },
    {
      key: 'fileSearchDeleteStoreName', n8nKey: 'fileSearchStoreName', label: 'File Search Store Name', kind: 'text',
      value: '', required: true, placeholder: 'e.g. fileSearchStores/abc123',
      description: 'The full name of the File Search store to delete (format: fileSearchStores/...)',
      showWhen: { resource: ['fileSearch'], fileSearchOperation: ['deleteStore'] },
      n8nShowWhen: { resource: ['fileSearch'], operation: ['deleteStore'] },
    },
    {
      key: 'fileSearchDeleteForce', n8nKey: 'force', label: 'Force Delete', kind: 'boolean', value: false, required: false,
      description: 'Whether to delete related Documents and objects. If false, deletion will fail if the store contains any Documents.',
      showWhen: { resource: ['fileSearch'], fileSearchOperation: ['deleteStore'] },
      n8nShowWhen: { resource: ['fileSearch'], operation: ['deleteStore'] },
    },
    {
      key: 'fileSearchListPageSize', n8nKey: 'pageSize', label: 'Page Size', kind: 'number', value: 10, required: false,
      min: 1, max: 20, description: 'Maximum number of File Search stores to return per page (max 20)',
      showWhen: { resource: ['fileSearch'], fileSearchOperation: ['listStores'] },
      n8nShowWhen: { resource: ['fileSearch'], operation: ['listStores'] },
    },
    {
      key: 'fileSearchListPageToken', n8nKey: 'pageToken', label: 'Page Token', kind: 'text', value: '', required: false,
      description: 'Token from a previous page to retrieve the next page of results',
      showWhen: { resource: ['fileSearch'], fileSearchOperation: ['listStores'] },
      n8nShowWhen: { resource: ['fileSearch'], operation: ['listStores'] },
    },
    {
      key: 'fileSearchUploadStoreName', n8nKey: 'fileSearchStoreName', label: 'File Search Store Name', kind: 'text',
      value: '', required: true, placeholder: 'e.g. fileSearchStores/abc123',
      description: 'The full name of the File Search store to upload to (format: fileSearchStores/...)',
      showWhen: { resource: ['fileSearch'], fileSearchOperation: ['uploadToStore'] },
      n8nShowWhen: { resource: ['fileSearch'], operation: ['uploadToStore'] },
    },
    {
      key: 'fileSearchUploadDisplayName', n8nKey: 'displayName', label: 'File Display Name', kind: 'text',
      value: '', required: true, placeholder: 'e.g. My Document',
      description: 'A human-readable name for the file (will be visible in citations)',
      showWhen: { resource: ['fileSearch'], fileSearchOperation: ['uploadToStore'] },
      n8nShowWhen: { resource: ['fileSearch'], operation: ['uploadToStore'] },
    },
    {
      key: 'fileSearchUploadInputType', n8nKey: 'inputType', label: 'Input Type', kind: 'select', sourceKind: 'options',
      value: 'url', required: false, options: [
        { label: 'File URL', value: 'url' }, { label: 'Binary File', value: 'binary' },
      ], showWhen: { resource: ['fileSearch'], fileSearchOperation: ['uploadToStore'] },
      n8nShowWhen: { resource: ['fileSearch'], operation: ['uploadToStore'] },
    },
    {
      key: 'fileSearchUploadUrl', n8nKey: 'fileUrl', label: 'URL', kind: 'text', value: '', required: false,
      placeholder: 'e.g. https://example.com/file.pdf', description: 'URL of the file to upload',
      showWhen: { resource: ['fileSearch'], fileSearchOperation: ['uploadToStore'], fileSearchUploadInputType: ['url'] },
      n8nShowWhen: { resource: ['fileSearch'], operation: ['uploadToStore'], inputType: ['url'] },
    },
    {
      key: 'fileSearchUploadBinaryPropertyName', n8nKey: 'binaryPropertyName', label: 'Input Data Field Name',
      kind: 'text', value: 'data', required: false, placeholder: 'e.g. data',
      hint: 'The name of the input field containing the binary file data to be processed',
      description: 'Name of the binary property which contains the file',
      showWhen: { resource: ['fileSearch'], fileSearchOperation: ['uploadToStore'], fileSearchUploadInputType: ['binary'] },
      n8nShowWhen: { resource: ['fileSearch'], operation: ['uploadToStore'], inputType: ['binary'] },
    },

    {
      key: 'imageAnalyzeModelId', n8nKey: 'modelId', label: 'Model', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
      locked: true, dynamic: true, loadOptionsDependsOn: ['operation', 'resource'], modes: ['list', 'id'],
      modeOptions: [
        { label: 'From List', value: 'list', kind: 'list', searchable: true, searchListMethod: 'modelSearch' },
        { label: 'ID', value: 'id', kind: 'text', placeholder: 'e.g. models/gemini-2.5-flash' },
      ], options: [], showWhen: { resource: ['image'], imageOperation: ['analyze'] },
      n8nShowWhen: { resource: ['image'], operation: ['analyze'] }, simulationNote: lockedModelNote,
    },
    {
      key: 'imageAnalyzeText', n8nKey: 'text', label: 'Text Input', kind: 'textarea', sourceKind: 'string',
      value: "What's in this image?", required: false, rows: 2, placeholder: "e.g. What's in this image?",
      showWhen: { resource: ['image'], imageOperation: ['analyze'] }, n8nShowWhen: { resource: ['image'], operation: ['analyze'] },
    },
    {
      key: 'imageAnalyzeInputType', n8nKey: 'inputType', label: 'Input Type', kind: 'select', sourceKind: 'options',
      value: 'url', required: false, options: [
        { label: 'Image URL(s)', value: 'url' }, { label: 'Binary File(s)', value: 'binary' },
      ], showWhen: { resource: ['image'], imageOperation: ['analyze'] }, n8nShowWhen: { resource: ['image'], operation: ['analyze'] },
    },
    {
      key: 'imageAnalyzeUrls', n8nKey: 'imageUrls', label: 'URL(s)', kind: 'text', value: '', required: false,
      placeholder: 'e.g. https://example.com/image.png',
      description: 'URL(s) of the image(s) to analyze, multiple URLs can be added separated by comma',
      showWhen: { resource: ['image'], imageOperation: ['analyze'], imageAnalyzeInputType: ['url'] },
      n8nShowWhen: { resource: ['image'], operation: ['analyze'], inputType: ['url'] },
    },
    {
      key: 'imageAnalyzeBinaryPropertyName', n8nKey: 'binaryPropertyName', label: 'Input Data Field Name(s)',
      kind: 'text', value: 'data', required: false, placeholder: 'e.g. data',
      hint: 'The name of the input field containing the binary file data to be processed',
      description: 'Name of the binary field(s) which contains the image(s), separate multiple field names with commas',
      showWhen: { resource: ['image'], imageOperation: ['analyze'], imageAnalyzeInputType: ['binary'] },
      n8nShowWhen: { resource: ['image'], operation: ['analyze'], inputType: ['binary'] },
    },
    {
      key: 'imageAnalyzeSimplify', n8nKey: 'simplify', label: 'Simplify Output', kind: 'boolean', value: true, required: false,
      description: 'Whether to simplify the response or not', showWhen: { resource: ['image'], imageOperation: ['analyze'] },
      n8nShowWhen: { resource: ['image'], operation: ['analyze'] },
    },
    {
      key: 'imageAnalyzeOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Option', showWhen: { resource: ['image'], imageOperation: ['analyze'] },
      n8nShowWhen: { resource: ['image'], operation: ['analyze'] }, fields: [
        {
          key: 'maxOutputTokens', label: 'Length of Description (Max Tokens)', kind: 'number', value: 300, required: false, min: 1,
          description: 'Fewer tokens will result in shorter, less detailed image description',
        },
      ],
    },

    {
      key: 'imageEditModelId', n8nKey: 'modelId', label: 'Model', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
      locked: true, dynamic: true, loadOptionsDependsOn: ['operation', 'resource'], modes: ['list', 'id'],
      modeOptions: [
        { label: 'From List', value: 'list', kind: 'list', searchable: true, searchListMethod: 'imageEditModelSearch' },
        { label: 'ID', value: 'id', kind: 'text', placeholder: 'e.g. models/gemini-2.5-flash' },
      ], options: [], showWhen: { resource: ['image'], imageOperation: ['edit'] },
      n8nShowWhen: { resource: ['image'], operation: ['edit'] }, simulationNote: lockedModelNote,
    },
    {
      key: 'imageEditPrompt', n8nKey: 'prompt', label: 'Prompt', kind: 'textarea', sourceKind: 'string',
      value: '', required: false, rows: 2, placeholder: 'e.g. combine the first image with the second image',
      description: 'Instruction describing how to edit the image',
      showWhen: { resource: ['image'], imageOperation: ['edit'] }, n8nShowWhen: { resource: ['image'], operation: ['edit'] },
    },
    {
      key: 'imageEditImages', n8nKey: 'images', label: 'Images', kind: 'fixedCollection', sourceKind: 'fixedCollection',
      value: { values: [{ binaryPropertyName: 'data' }] }, sourceDefault: { values: [{ binaryPropertyName: 'data' }] },
      required: false, multiple: true, collectionKey: 'values', collectionLabel: 'Image', addLabel: 'Add Image',
      description: 'Add one or more binary fields to include images with your prompt',
      showWhen: { resource: ['image'], imageOperation: ['edit'] }, n8nShowWhen: { resource: ['image'], operation: ['edit'] },
      fields: [
        {
          key: 'binaryPropertyName', label: 'Binary Field Name', kind: 'text', value: 'data', required: false,
          placeholder: 'e.g. data', description: 'The name of the binary field containing the image data',
        },
      ],
    },
    {
      key: 'imageEditOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Option', showWhen: { resource: ['image'], imageOperation: ['edit'] },
      n8nShowWhen: { resource: ['image'], operation: ['edit'] }, fields: [
        {
          key: 'binaryPropertyOutput', label: 'Put Output in Field', kind: 'text', value: 'edited', required: false,
          hint: 'The name of the output field to put the binary file data in',
        },
      ],
    },

    {
      key: 'imageGenerateModelId', n8nKey: 'modelId', label: 'Model', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: 'models/gemini-3.1-flash-image-preview' },
      sourceDefault: { mode: 'list', value: 'models/gemini-3.1-flash-image-preview' }, required: true,
      locked: true, dynamic: true, loadOptionsDependsOn: ['operation', 'resource'], modes: ['list', 'id'],
      modeOptions: [
        { label: 'From List', value: 'list', kind: 'list', searchable: true, searchListMethod: 'imageGenerationModelSearch' },
        { label: 'ID', value: 'id', kind: 'text', placeholder: 'e.g. models/gemini-2.5-flash' },
      ], options: [], showWhen: { resource: ['image'], imageOperation: ['generate'] },
      n8nShowWhen: { resource: ['image'], operation: ['generate'], '@version': [{ _cnd: { gte: 1.2 } }] },
      sourceVersionShowWhen: { '@version': [{ _cnd: { gte: 1.2 } }] }, simulationNote: lockedModelNote,
    },
    {
      key: 'imageGeneratePrompt', n8nKey: 'prompt', label: 'Prompt', kind: 'textarea', sourceKind: 'string',
      value: '', required: false, rows: 2, placeholder: 'e.g. A cute cat eating a dinosaur',
      description: 'A text description of the desired image(s)',
      showWhen: { resource: ['image'], imageOperation: ['generate'] }, n8nShowWhen: { resource: ['image'], operation: ['generate'] },
    },
    {
      key: 'imageGenerateOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Option', showWhen: { resource: ['image'], imageOperation: ['generate'] },
      n8nShowWhen: { resource: ['image'], operation: ['generate'] }, fields: [
        {
          key: 'sampleCount', label: 'Number of Images', kind: 'number', value: 1, required: false, min: 1,
          showWhen: { imageGenerateModelId: { includes: 'imagen' } },
          description: 'Number of images to generate', n8nShowWhen: { '/modelId': [{ _cnd: { includes: 'imagen' } }] },
        },
        {
          key: 'binaryPropertyOutput', label: 'Put Output in Field', kind: 'text', value: 'data', required: false,
          hint: 'The name of the output field to put the binary file data in',
        },
      ],
    },

    {
      key: 'textMessageModelId', n8nKey: 'modelId', label: 'Model', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: 'models/gemini-3-flash-preview' },
      sourceDefault: { mode: 'list', value: 'models/gemini-3-flash-preview' }, required: true,
      locked: true, dynamic: true, loadOptionsDependsOn: ['operation', 'resource'], modes: ['list', 'id'],
      modeOptions: [
        { label: 'From List', value: 'list', kind: 'list', searchable: true, searchListMethod: 'modelSearch' },
        { label: 'ID', value: 'id', kind: 'text', placeholder: 'e.g. models/gemini-2.5-flash' },
      ], options: [], showWhen: { resource: ['text'], textOperation: ['message'] },
      n8nShowWhen: { resource: ['text'], operation: ['message'], '@version': [{ _cnd: { gte: 1.2 } }] },
      sourceVersionShowWhen: { '@version': [{ _cnd: { gte: 1.2 } }] }, simulationNote: lockedModelNote,
    },
    {
      key: 'textMessageMessages', n8nKey: 'messages', label: 'Messages', kind: 'fixedCollection', sourceKind: 'fixedCollection',
      value: { values: [{ content: '' }] }, sourceDefault: { values: [{ content: '' }] }, required: false,
      multiple: true, sortable: true, collectionKey: 'values', collectionLabel: 'Values', addLabel: 'Add Message',
      showWhen: { resource: ['text'], textOperation: ['message'] }, n8nShowWhen: { resource: ['text'], operation: ['message'] },
      fields: [
        {
          key: 'content', label: 'Prompt', kind: 'textarea', sourceKind: 'string', value: '', required: false, rows: 2,
          placeholder: 'e.g. Hello, how can you help me?', description: 'The content of the message to be send',
        },
        {
          key: 'role', label: 'Role', kind: 'select', sourceKind: 'options', value: 'user', required: false,
          description: "Role in shaping the model's response, it tells the model how it should behave and interact with the user",
          options: [
            { label: 'User', value: 'user', description: 'Send a message as a user and get a response from the model' },
            { label: 'Model', value: 'model', description: 'Tell the model to adopt a specific tone or personality' },
          ],
        },
      ],
    },
    {
      key: 'textMessageSimplify', n8nKey: 'simplify', label: 'Simplify Output', kind: 'boolean', value: true, required: false,
      description: 'Whether to return a simplified version of the response instead of the raw data',
      showWhen: { resource: ['text'], textOperation: ['message'] }, n8nShowWhen: { resource: ['text'], operation: ['message'] },
    },
    {
      key: 'textMessageJsonOutput', n8nKey: 'jsonOutput', label: 'Output Content as JSON', kind: 'boolean', value: false, required: false,
      description: 'Whether to attempt to return the response in JSON format',
      showWhen: { resource: ['text'], textOperation: ['message'] }, n8nShowWhen: { resource: ['text'], operation: ['message'] },
    },
    {
      key: 'textMessageBuiltInTools', n8nKey: 'builtInTools', label: 'Built-in Tools', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Built-in Tool', showWhen: { resource: ['text'], textOperation: ['message'] },
      n8nShowWhen: { resource: ['text'], operation: ['message'], '@version': [{ _cnd: { gte: 1.1 } }] },
      sourceVersionShowWhen: { '@version': [{ _cnd: { gte: 1.1 } }] }, fields: [
        {
          key: 'googleSearch', label: 'Google Search', kind: 'boolean', value: true, required: false,
          description: 'Whether to allow the model to search the web using Google Search to get real-time information',
        },
        {
          key: 'googleMaps', label: 'Google Maps', kind: 'collection', sourceKind: 'collection',
          value: { latitude: '', longitude: '' }, sourceDefault: { latitude: '', longitude: '' },
          required: false, addLabel: 'Add Option', fields: [
            {
              key: 'latitude', label: 'Latitude', kind: 'number', value: '', required: false, precision: 6,
              description: 'The latitude coordinate for location-based queries',
            },
            {
              key: 'longitude', label: 'Longitude', kind: 'number', value: '', required: false, precision: 6,
              description: 'The longitude coordinate for location-based queries',
            },
          ],
        },
        {
          key: 'urlContext', label: 'URL Context', kind: 'boolean', value: true, required: false,
          description: 'Whether to allow the model to read and analyze content from specific URLs',
        },
        {
          key: 'fileSearch', label: 'File Search', kind: 'collection', sourceKind: 'collection',
          value: { fileSearchStoreNames: '[]' }, sourceDefault: { fileSearchStoreNames: '[]' },
          required: false, addLabel: 'Add Option', fields: [
            {
              key: 'fileSearchStoreNames', label: 'File Search Store Names', kind: 'textarea', sourceKind: 'json',
              value: '[]', required: true, rows: 5, editor: 'json',
              description: 'The file search store names to use. File search stores are managed via Google AI Studio.',
              simulationNote: 'JSON is stored as inert authoring text and is never parsed.',
            },
            {
              key: 'metadataFilter', label: 'Metadata Filter', kind: 'text', value: '', required: false,
              placeholder: 'e.g. author="John Doe"',
              description: 'Use a metadata filter to search within a subset of documents. Example: author="Robert Graves".',
            },
          ],
        },
        {
          key: 'codeExecution', label: 'Code Execution', kind: 'boolean', value: true, required: false,
          description: 'Whether to allow the model to execute code it generates to produce a response. Supported only by certain models.',
        },
      ],
    },
    {
      key: 'textMessageOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Option', showWhen: { resource: ['text'], textOperation: ['message'] },
      n8nShowWhen: { resource: ['text'], operation: ['message'] }, fields: [
        {
          key: 'includeMergedResponse', label: 'Include Merged Response', kind: 'boolean', value: false, required: false,
          description: 'Whether to include a single output string merging all text parts of the response',
          sourceVersionShowWhen: { '@version': [{ _cnd: { gte: 1.1 } }] },
        },
        {
          key: 'systemMessage', label: 'System Message', kind: 'text', value: '', required: false,
          placeholder: 'e.g. You are a helpful assistant',
        },
        {
          key: 'frequencyPenalty', label: 'Frequency Penalty', kind: 'number', value: 0, required: false,
          min: -2, max: 2, precision: 1,
          description: "Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim",
        },
        {
          key: 'maxOutputTokens', label: 'Maximum Number of Tokens', kind: 'number', value: 16, required: false,
          min: 1, precision: 0, description: 'The maximum number of tokens to generate in the completion',
        },
        {
          key: 'candidateCount', label: 'Number of Completions', kind: 'number', value: 1, required: false,
          min: 1, max: 8, precision: 0, description: 'How many completions to generate for each prompt',
        },
        {
          key: 'presencePenalty', label: 'Presence Penalty', kind: 'number', value: 0, required: false,
          min: -2, max: 2, precision: 1,
          description: "Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics",
        },
        {
          key: 'temperature', label: 'Output Randomness (Temperature)', kind: 'number', value: 1, required: false,
          min: 0, max: 2, precision: 1,
          description: 'Controls the randomness of the output. Lower values make completions less random; near zero becomes deterministic and repetitive.',
        },
        {
          key: 'topP', label: 'Output Randomness (Top P)', kind: 'number', value: 1, required: false,
          min: 0, max: 1, precision: 1, description: 'The maximum cumulative probability of tokens to consider when sampling',
        },
        {
          key: 'topK', label: 'Output Randomness (Top K)', kind: 'number', value: 1, required: false,
          min: 1, precision: 0, description: 'The maximum number of tokens to consider when sampling',
        },
        {
          key: 'thinkingBudget', label: 'Thinking Budget', kind: 'number', value: -1, required: false,
          min: -1, precision: 0,
          description: 'Controls reasoning tokens for thinking models. Set to 0 to disable automatic thinking. Set to -1 for dynamic thinking (default).',
        },
        {
          key: 'maxToolsIterations', label: 'Max Tool Calls Iterations', kind: 'number', value: 15, required: false,
          min: 0, precision: 0,
          description: 'The maximum number of tool iteration cycles the LLM will run before stopping. One iteration can contain multiple tool calls. Set to 0 for no limit.',
        },
      ],
    },

    {
      key: 'videoAnalyzeModelId', n8nKey: 'modelId', label: 'Model', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
      locked: true, dynamic: true, loadOptionsDependsOn: ['operation', 'resource'], modes: ['list', 'id'],
      modeOptions: [
        { label: 'From List', value: 'list', kind: 'list', searchable: true, searchListMethod: 'modelSearch' },
        { label: 'ID', value: 'id', kind: 'text', placeholder: 'e.g. models/gemini-2.5-flash' },
      ], options: [], showWhen: { resource: ['video'], videoOperation: ['analyze'] },
      n8nShowWhen: { resource: ['video'], operation: ['analyze'] }, simulationNote: lockedModelNote,
    },
    {
      key: 'videoAnalyzeText', n8nKey: 'text', label: 'Text Input', kind: 'textarea', sourceKind: 'string',
      value: "What's in this video?", required: false, rows: 2, placeholder: "e.g. What's in this video?",
      showWhen: { resource: ['video'], videoOperation: ['analyze'] }, n8nShowWhen: { resource: ['video'], operation: ['analyze'] },
    },
    {
      key: 'videoAnalyzeInputType', n8nKey: 'inputType', label: 'Input Type', kind: 'select', sourceKind: 'options',
      value: 'url', required: false, options: [
        { label: 'Video URL(s)', value: 'url' }, { label: 'Binary File(s)', value: 'binary' },
      ], showWhen: { resource: ['video'], videoOperation: ['analyze'] }, n8nShowWhen: { resource: ['video'], operation: ['analyze'] },
    },
    {
      key: 'videoAnalyzeUrls', n8nKey: 'videoUrls', label: 'URL(s)', kind: 'text', value: '', required: false,
      placeholder: 'e.g. https://example.com/video.mp4',
      description: 'URL(s) of the video(s) to analyze, multiple URLs can be added separated by comma',
      showWhen: { resource: ['video'], videoOperation: ['analyze'], videoAnalyzeInputType: ['url'] },
      n8nShowWhen: { resource: ['video'], operation: ['analyze'], inputType: ['url'] },
    },
    {
      key: 'videoAnalyzeBinaryPropertyName', n8nKey: 'binaryPropertyName', label: 'Input Data Field Name(s)',
      kind: 'text', value: 'data', required: false, placeholder: 'e.g. data',
      hint: 'The name of the input field containing the binary file data to be processed',
      description: 'Name of the binary field(s) which contains the video(s), seperate multiple field names with commas',
      showWhen: { resource: ['video'], videoOperation: ['analyze'], videoAnalyzeInputType: ['binary'] },
      n8nShowWhen: { resource: ['video'], operation: ['analyze'], inputType: ['binary'] },
    },
    {
      key: 'videoAnalyzeSimplify', n8nKey: 'simplify', label: 'Simplify Output', kind: 'boolean', value: true, required: false,
      description: 'Whether to simplify the response or not', showWhen: { resource: ['video'], videoOperation: ['analyze'] },
      n8nShowWhen: { resource: ['video'], operation: ['analyze'] },
    },
    {
      key: 'videoAnalyzeOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Option', showWhen: { resource: ['video'], videoOperation: ['analyze'] },
      n8nShowWhen: { resource: ['video'], operation: ['analyze'] }, fields: [
        {
          key: 'maxOutputTokens', label: 'Length of Description (Max Tokens)', kind: 'number', value: 300, required: false, min: 1,
          description: 'Fewer tokens will result in shorter, less detailed video description',
        },
      ],
    },

    {
      key: 'videoDownloadUrl', n8nKey: 'url', label: 'URL', kind: 'text', value: '', required: false,
      placeholder: 'e.g. https://generativelanguage.googleapis.com/v1beta/files/abcdefg:download',
      description: 'The URL from Google Gemini API to download the video from',
      showWhen: { resource: ['video'], videoOperation: ['download'] }, n8nShowWhen: { resource: ['video'], operation: ['download'] },
    },
    {
      key: 'videoDownloadOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Option', showWhen: { resource: ['video'], videoOperation: ['download'] },
      n8nShowWhen: { resource: ['video'], operation: ['download'] }, fields: [
        {
          key: 'binaryPropertyOutput', label: 'Put Output in Field', kind: 'text', value: 'data', required: false,
          hint: 'The name of the output field to put the binary file data in',
        },
      ],
    },

    {
      key: 'videoGenerateModelId', n8nKey: 'modelId', label: 'Model', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
      locked: true, dynamic: true, loadOptionsDependsOn: ['operation', 'resource'], modes: ['list', 'id'],
      modeOptions: [
        { label: 'From List', value: 'list', kind: 'list', searchable: true, searchListMethod: 'videoGenerationModelSearch' },
        { label: 'ID', value: 'id', kind: 'text', placeholder: 'e.g. models/gemini-2.5-flash' },
      ], options: [], showWhen: { resource: ['video'], videoOperation: ['generate'] },
      n8nShowWhen: { resource: ['video'], operation: ['generate'] }, simulationNote: lockedModelNote,
    },
    {
      key: 'videoGeneratePrompt', n8nKey: 'prompt', label: 'Prompt', kind: 'textarea', sourceKind: 'string',
      value: '', required: false, rows: 2,
      placeholder: 'e.g. Panning wide shot of a calico kitten sleeping in the sunshine',
      description: 'A text description of the desired video',
      showWhen: { resource: ['video'], videoOperation: ['generate'] }, n8nShowWhen: { resource: ['video'], operation: ['generate'] },
    },
    {
      key: 'videoGenerateReturnAs', n8nKey: 'returnAs', label: 'Return As', kind: 'select', sourceKind: 'options',
      value: 'video', required: false, options: [
        { label: 'Video', value: 'video' }, { label: 'URL', value: 'url' },
      ],
      description: 'Whether to return the video as a binary file or a URL that can be used to download the video later',
      showWhen: { resource: ['video'], videoOperation: ['generate'] }, n8nShowWhen: { resource: ['video'], operation: ['generate'] },
    },
    {
      key: 'videoGenerateOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Option', showWhen: { resource: ['video'], videoOperation: ['generate'] },
      n8nShowWhen: { resource: ['video'], operation: ['generate'] }, fields: [
        {
          key: 'sampleCount', label: 'Number of Videos', kind: 'number', value: 1, required: false,
          min: 1, max: 4, description: 'How many videos to generate',
        },
        {
          key: 'durationSeconds', label: 'Duration (Seconds)', kind: 'number', value: 8, required: false,
          min: 5, max: 8, description: 'Length of the generated video in seconds. Supported only by certain models.',
        },
        {
          key: 'aspectRatio', label: 'Aspect Ratio', kind: 'select', sourceKind: 'options', value: '16:9', required: false,
          options: [
            { label: 'Widescreen (16:9)', value: '16:9', description: 'Most common aspect ratio for televisions and monitors' },
            { label: 'Portrait (9:16)', value: '9:16', description: 'Popular for short-form videos like YouTube Shorts' },
          ],
        },
        {
          key: 'personGeneration', label: 'Person Generation', kind: 'select', sourceKind: 'options', value: 'dont_allow', required: false,
          options: [
            { label: "Don't Allow", value: 'dont_allow', description: 'Prevent generation of people in the video' },
            { label: 'Allow Adult', value: 'allow_adult', description: 'Allow generation of adult people in the video' },
            { label: 'Allow All', value: 'allow_all', description: 'Allow generation of all people in the video' },
          ],
        },
        {
          key: 'binaryPropertyOutput', label: 'Put Output in Field', kind: 'text', value: 'data', required: false,
          hint: 'The name of the output field to put the binary file data in',
        },
      ],
    },
  ],
  platformGaps: [
    'Model From List normally calls one of five operation-aware listSearch methods. Those methods and dependencies are retained as metadata, but every model picker is locked and empty.',
    'The credential selector and Google Gemini(PaLM) credential schema are metadata only; the API key is never read, tested, or attached to a request.',
    'The native File Search Store Names JSON control is normalized to an inert textarea because the catalog has no validating JSON editor.',
    'The Text Message operation declares a dynamic AI Tool input. The exact source expression and a port variant are retained, but connected tools are never discovered or executed.',
    'The current descriptor intentionally omits the legacy v1-only Options > Code Execution field. At v1.2, Code Execution is exposed under Built-in Tools instead.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'credentials.googlePalmApi', sourceType: 'credentials', normalizedKind: 'locked select',
      reason: 'Credential discovery and credential-editor workflows are unavailable.',
    },
    {
      n8nKey: 'modelId', sourceType: 'resourceLocator with operation-aware remote listSearch',
      normalizedKind: 'resourceLocator', reason: 'List discovery is disabled; manual model ID authoring remains available.',
    },
    {
      n8nKey: 'builtInTools.fileSearch.fileSearchStoreNames', sourceType: 'json', normalizedKind: 'textarea',
      reason: 'The JSON source remains authoring text and is never parsed.',
    },
    {
      n8nKey: 'text, prompt, messages.values.content', sourceType: 'multiline string', normalizedKind: 'textarea',
      reason: 'The textarea preserves source row counts without interpreting content.',
    },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    authentication: false,
    modelDiscovery: false,
    toolDiscovery: false,
    toolExecution: false,
    jsonParsing: false,
    fileDownload: false,
    fileUpload: false,
    fileSearch: false,
    mediaAnalysis: false,
    transcription: false,
    imageGeneration: false,
    imageEditing: false,
    videoGeneration: false,
    apiCalls: false,
    networkAccess: false,
    voice: false,
  },
  output: {},
};

export default googleGemini;
