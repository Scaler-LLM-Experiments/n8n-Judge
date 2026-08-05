// Editor-only descriptor for the current LangChain OpenAI v2.3 action node.
// Credentials, remote locators, tools, files, media, polling, model calls, and
// every OpenAI API behavior remain inert in this authoring simulation.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This selector is locked. The simulation never creates, reads, tests, or applies OpenAI credentials.';
const lockedLocatorNote =
  'From List normally calls the OpenAI API. The list is intentionally locked and empty; ID authoring remains available.';

const option = (label, value, description) => ({
  label, value, ...(description ? { description } : {}),
});

const textField = (key, n8nKey, label, value = '', extra = {}) => ({
  key, n8nKey, label, kind: extra.rows ? 'textarea' : 'text', sourceKind: 'string',
  value, required: false, ...extra,
});

const jsonField = (key, n8nKey, label, value, extra = {}) => ({
  key, n8nKey, label, kind: 'textarea', sourceKind: 'json', value, required: false,
  rows: 5, editor: 'json', simulationNote: 'JSON is stored as inert authoring text and is never parsed.', ...extra,
});

const selectField = (key, n8nKey, label, value, options, extra = {}) => ({
  key, n8nKey, label, kind: 'select', sourceKind: 'options', value, required: false,
  options, ...extra,
});

const multiSelectField = (key, n8nKey, label, value, options, extra = {}) => ({
  key, n8nKey, label, kind: 'multiSelect', sourceKind: 'multiOptions', value,
  required: false, options, ...extra,
});

const booleanField = (key, n8nKey, label, value, extra = {}) => ({
  key, n8nKey, label, kind: 'boolean', value, required: false, ...extra,
});

const numberField = (key, n8nKey, label, value, extra = {}) => ({
  key, n8nKey, label, kind: 'number', value, required: false, ...extra,
});

const collectionField = (key, n8nKey, label, fields, value = {}, extra = {}) => ({
  key, n8nKey, label, kind: 'collection', sourceKind: 'collection', value,
  required: false, addLabel: 'Add Option', fields, ...extra,
});

const fixedCollectionField = (key, n8nKey, label, fields, value, extra = {}) => ({
  key, n8nKey, label, kind: 'fixedCollection', sourceKind: 'fixedCollection',
  value, sourceDefault: value, required: false, fields, ...extra,
});

const resourceLocator = (key, searchListMethod, defaultValue = '') => ({
  key, n8nKey: key.endsWith('FileId') ? 'fileId' : 'modelId', label: key.endsWith('FileId') ? 'File' : 'Model',
  kind: 'resourceLocator', sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: defaultValue },
  sourceDefault: { mode: 'list', value: defaultValue }, required: true,
  locked: true, dynamic: true, modes: ['list', 'id'], options: [],
  modeOptions: [
    { label: 'From List', value: 'list', kind: 'list', searchable: true, searchListMethod },
    {
      label: 'ID', value: 'id', kind: 'text',
      placeholder: key.endsWith('FileId') ? 'e.g. file-1234567890' : 'e.g. gpt-4',
      ...(key.endsWith('FileId') ? {
        validation: [{ type: 'regex', regex: 'file-[a-zA-Z0-9]', errorMessage: 'Not a valid File ID' }],
      } : {}),
    },
  ],
  simulationNote: lockedLocatorNote,
});

const scope = (resource, operation, fields) => {
  const operations = Array.isArray(operation) ? operation : [operation];
  const operationKey = `${resource}Operation`;
  return fields.map((field) => ({
    ...field,
    showWhen: { resource: [resource], [operationKey]: operations, ...(field.showWhen ?? {}) },
    n8nShowWhen: { resource: [resource], operation: operations, ...(field.n8nShowWhen ?? {}) },
  }));
};

const metadataField = () => jsonField(
  'metadata', 'metadata', 'Metadata', '{}',
  {
    description:
      'Set of 16 key-value pairs that can be attached to an object. Keys have a maximum length of 64 characters and values have a maximum length of 512 characters.',
  },
);

const audioOperations = [
  { label: 'Generate Audio', value: 'generate', action: 'Generate audio', description: 'Creates audio from a text prompt' },
  { label: 'Transcribe a Recording', value: 'transcribe', action: 'Transcribe a recording', description: 'Transcribes audio into text' },
  { label: 'Translate a Recording', value: 'translate', action: 'Translate a recording', description: 'Translates audio into text in English' },
];

const conversationOperations = [
  { label: 'Create', value: 'create', action: 'Create a conversation', description: 'Create a conversation' },
  { label: 'Get', value: 'get', action: 'Get a conversation', description: 'Get a conversation' },
  { label: 'Remove', value: 'remove', action: 'Remove a conversation', description: 'Remove a conversation' },
  { label: 'Update', value: 'update', action: 'Update a conversation', description: 'Update a conversation' },
];

const fileOperations = [
  { label: 'Delete a File', value: 'deleteFile', action: 'Delete a file', description: 'Delete a file from the server' },
  { label: 'List Files', value: 'list', action: 'List files', description: "Returns a list of files that belong to the user's organization" },
  { label: 'Upload a File', value: 'upload', action: 'Upload a file', description: 'Upload a file that can be used across various endpoints' },
];

const imageOperations = [
  { label: 'Analyze Image', value: 'analyze', action: 'Analyze image', description: 'Take in images and answer questions about them' },
  { label: 'Generate an Image', value: 'generate', action: 'Generate an image', description: 'Creates an image from a text prompt' },
  { label: 'Edit Image', value: 'edit', action: 'Edit image', description: 'Edit an image' },
];

const textOperations = [
  { label: 'Message a Model', value: 'response', action: 'Message a model', description: 'Generate a model response with GPT 3, 4, 5, etc. using Responses API' },
  { label: 'Classify Text for Violations', value: 'classify', action: 'Classify text for violations', description: 'Check whether content complies with usage policies' },
];

const videoOperations = [
  { label: 'Generate', value: 'generate', action: 'Generate a video', description: 'Creates a video from a text prompt' },
];

const roles = [
  option('User', 'user', 'Send a message as a user and get a response from the model'),
  option('Assistant', 'assistant', 'Tell the model to adopt a specific tone or personality'),
  option('System', 'system', "Usually used to set the model's behavior or context for the next user message"),
];

const audioGenerateParams = scope('audio', 'generate', [
  selectField('audioGenerateModel', 'model', 'Model', 'tts-1', [option('TTS-1', 'tts-1'), option('TTS-1-HD', 'tts-1-hd')]),
  textField('audioGenerateInput', 'input', 'Text Input', '', {
    rows: 2, placeholder: 'e.g. The quick brown fox jumped over the lazy dog',
    description: 'The text to generate audio for. The maximum length is 4096 characters.',
  }),
  selectField('audioGenerateVoice', 'voice', 'Voice', 'alloy', [
    option('Alloy', 'alloy'), option('Echo', 'echo'), option('Fable', 'fable'),
    option('Nova', 'nova'), option('Onyx', 'onyx'), option('Shimmer', 'shimmer'),
  ], { description: 'The voice to use when generating the audio' }),
  collectionField('audioGenerateOptions', 'options', 'Options', [
    selectField('responseFormat', 'response_format', 'Response Format', 'mp3', [
      option('MP3', 'mp3'), option('OPUS', 'opus'), option('AAC', 'aac'), option('FLAC', 'flac'),
    ]),
    numberField('speed', 'speed', 'Audio Speed', 1, { min: 0.25, max: 4, precision: 1 }),
    textField('binaryPropertyOutput', 'binaryPropertyOutput', 'Put Output in Field', 'data', {
      hint: 'The name of the output field to put the binary file data in',
    }),
  ]),
]);

const audioTranscribeParams = scope('audio', 'transcribe', [
  textField('audioTranscribeBinaryPropertyName', 'binaryPropertyName', 'Input Data Field Name', 'data', {
    placeholder: 'e.g. data', hint: 'The name of the input field containing the binary file data to be processed',
    description: 'Name of the binary property containing audio in flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm format',
  }),
  collectionField('audioTranscribeOptions', 'options', 'Options', [
    textField('language', 'language', 'Language of the Audio File', '', {
      description: 'The ISO-639-1 language of the input audio; providing it can improve accuracy and latency.',
    }),
    numberField('temperature', 'temperature', 'Output Randomness (Temperature)', 0, { min: 0, max: 1, precision: 1 }),
  ]),
]);

const audioTranslateParams = scope('audio', 'translate', [
  textField('audioTranslateBinaryPropertyName', 'binaryPropertyName', 'Input Data Field Name', 'data', {
    placeholder: 'e.g. data', hint: 'The name of the input field containing the binary file data to be processed',
    description: 'Name of the binary property containing audio in flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm format',
  }),
  collectionField('audioTranslateOptions', 'options', 'Options', [
    numberField('temperature', 'temperature', 'Output Randomness (Temperature)', 0, { min: 0, max: 1, precision: 1 }),
  ]),
]);

const conversationCreateParams = scope('conversation', 'create', [
  fixedCollectionField('conversationCreateMessages', 'messages', 'Messages', [
    selectField('role', 'role', 'Role', 'user', roles, {
      description: "Role in shaping the model's response and how it should interact with the user",
    }),
    textField('content', 'content', 'Prompt', '', {
      rows: 2, placeholder: 'e.g. Hello, how can you help me?', description: 'The content of the message to be send',
    }),
  ], { values: [{ type: 'text' }] }, {
    multiple: true, sortable: true, collectionKey: 'values', collectionLabel: 'Message', addLabel: 'Add Message',
  }),
  collectionField('conversationCreateOptions', 'options', 'Options', [metadataField()]),
]);

const conversationIdParam = (operation, action) => scope('conversation', operation, [
  textField(`conversation${action}Id`, 'conversationId', 'Conversation ID', '', {
    required: true, placeholder: 'conv_1234567890',
    description: `The ID of the conversation to ${action.toLowerCase()}`,
  }),
]);

const conversationUpdateParams = scope('conversation', 'update', [
  textField('conversationUpdateId', 'conversationId', 'Conversation ID', '', {
    required: true, placeholder: 'conv_1234567890', description: 'The ID of the conversation to update',
  }),
  { ...metadataField(), required: true },
]);

const filePurposeOptions = [
  option('Assistants', 'assistants'), option('Fine-Tune', 'fine-tune'), option('Vision', 'vision'), option('User Data', 'user_data'),
];

const fileParams = [
  ...scope('file', 'deleteFile', [{
    ...resourceLocator('fileDeleteFileId', 'fileSearch'),
    n8nKey: 'fileId',
  }]),
  ...scope('file', 'list', [
    collectionField('fileListOptions', 'options', 'Options', [
      selectField('purpose', 'purpose', 'Purpose', 'any', [option('Any [Default]', 'any'), ...filePurposeOptions], {
        description: 'Only return files with the given purpose',
      }),
    ]),
  ]),
  ...scope('file', 'upload', [
    textField('fileUploadBinaryPropertyName', 'binaryPropertyName', 'Input Data Field Name', 'data', {
      placeholder: 'e.g. data', hint: 'The name of the input field containing the binary file data to be processed',
      description: 'Name of the binary property containing the file. Individual files can be up to 512 MB or 2 million tokens for Assistants.',
    }),
    collectionField('fileUploadOptions', 'options', 'Options', [
      selectField('purpose', 'purpose', 'Purpose', 'user_data', filePurposeOptions, {
        description: "The intended purpose of the uploaded file; Fine-Tune only supports .jsonl files",
      }),
    ]),
  ]),
];

const imageAnalyzeParams = scope('image', 'analyze', [
  resourceLocator('imageAnalyzeModelId', 'imageModelSearch'),
  textField('imageAnalyzeText', 'text', 'Text Input', "What's in this image?", {
    rows: 2, placeholder: "e.g. What's in this image?",
  }),
  selectField('imageAnalyzeInputType', 'inputType', 'Input Type', 'url', [option('Image URL(s)', 'url'), option('Binary File(s)', 'base64')]),
  textField('imageAnalyzeUrls', 'imageUrls', 'URL(s)', '', {
    placeholder: 'e.g. https://example.com/image.jpeg',
    description: 'URL(s) of the images to analyze, separated by commas',
    showWhen: { imageAnalyzeInputType: ['url'] }, n8nShowWhen: { inputType: ['url'] },
  }),
  textField('imageAnalyzeBinaryPropertyName', 'binaryPropertyName', 'Input Data Field Name', 'data', {
    placeholder: 'e.g. data', hint: 'The name of the input field containing the binary file data to be processed',
    description: 'Name of the binary property containing the image(s)',
    showWhen: { imageAnalyzeInputType: ['base64'] }, n8nShowWhen: { inputType: ['base64'] },
  }),
  booleanField('imageAnalyzeSimplify', 'simplify', 'Simplify Output', true, { description: 'Whether to simplify the response or not' }),
  collectionField('imageAnalyzeOptions', 'options', 'Options', [
    selectField('detail', 'detail', 'Detail', 'auto', [
      option('Auto', 'auto', 'Let the model choose based on image size'),
      option('Low', 'low', 'Return faster responses and consume fewer tokens'),
      option('High', 'high', 'Return more detailed responses and consume more tokens'),
    ]),
    numberField('maxTokens', 'maxTokens', 'Length of Description (Max Tokens)', 300, {
      min: 1, description: 'Fewer tokens result in a shorter, less detailed image description',
    }),
  ]),
]);

const imageGenerateParams = scope('image', 'generate', [
  {
    ...resourceLocator('imageGenerateModelId', 'imageGenerateModelSearch', 'gpt-image-1-mini'),
    sourceVersionShowWhen: { '@version': [{ _cnd: { gte: 2.2 } }] },
  },
  textField('imageGeneratePrompt', 'prompt', 'Prompt', '', {
    rows: 2, placeholder: 'e.g. A cute cat eating a dinosaur',
    description: 'A text description of the desired images; limits vary by model.',
  }),
  collectionField('imageGenerateOptions', 'options', 'Options', [
    numberField('n', 'n', 'Number of Images', 1, {
      min: 1, max: 10, description: 'Number of images to generate',
      showWhen: { imageGenerateModelId: ['dall-e-2'] }, n8nShowWhen: { '/modelId': ['dall-e-2'] },
    }),
    selectField('dalleQuality', 'dalleQuality', 'Quality', 'standard', [option('HD', 'hd'), option('Standard', 'standard')], {
      showWhen: { imageGenerateModelId: ['dall-e-3'] }, n8nShowWhen: { '/modelId': ['dall-e-3'] },
    }),
    selectField('quality', 'quality', 'Quality', 'medium', [option('High', 'high'), option('Medium', 'medium'), option('Low', 'low')], {
      showWhen: { imageGenerateModelId: { includes: 'gpt-image' } }, n8nShowWhen: { '/modelId': [{ _cnd: { includes: 'gpt-image' } }] },
    }),
    selectField('dalle2Size', 'size', 'Resolution', '1024x1024', [option('256x256', '256x256'), option('512x512', '512x512'), option('1024x1024', '1024x1024')], {
      showWhen: { imageGenerateModelId: ['dall-e-2'] }, n8nShowWhen: { '/modelId': ['dall-e-2'] },
    }),
    selectField('dalle3Size', 'size', 'Resolution', '1024x1024', [option('1024x1024', '1024x1024'), option('1792x1024', '1792x1024'), option('1024x1792', '1024x1792')], {
      showWhen: { imageGenerateModelId: ['dall-e-3'] }, n8nShowWhen: { '/modelId': ['dall-e-3'] },
    }),
    selectField('gptImageSize', 'size', 'Resolution', '1024x1024', [option('1024x1024', '1024x1024'), option('1024x1536', '1024x1536'), option('1536x1024', '1536x1024')], {
      showWhen: { imageGenerateModelId: { includes: 'gpt-image' } }, n8nShowWhen: { '/modelId': [{ _cnd: { includes: 'gpt-image' } }] },
    }),
    selectField('style', 'style', 'Style', 'vivid', [
      option('Natural', 'natural', 'Produce more natural looking images'),
      option('Vivid', 'vivid', 'Lean towards hyper-real and dramatic images'),
    ], { showWhen: { imageGenerateModelId: ['dall-e-3'] }, n8nShowWhen: { '/modelId': ['dall-e-3'] } }),
    booleanField('returnImageUrls', 'returnImageUrls', 'Respond with Image URL(s)', false, {
      description: 'Whether to return image URLs instead of binary files',
      hideWhen: { imageGenerateModelId: { includes: 'gpt-image' } },
      n8nHideWhen: { '/modelId': [{ _cnd: { includes: 'gpt-image' } }] },
    }),
    textField('binaryPropertyOutput', 'binaryPropertyOutput', 'Put Output in Field', 'data', {
      hint: 'The name of the output field to put the binary file data in',
      showWhen: { returnImageUrls: [false] }, n8nShowWhen: { returnImageUrls: [false] },
    }),
  ], {}, { sourceVersionShowWhen: { '@version': [{ _cnd: { gte: 2.2 } }] } }),
]);

const imageEditParams = scope('image', 'edit', [
  {
    ...resourceLocator('imageEditModelId', 'imageGenerateModelSearch', 'gpt-image-1'),
    sourceVersionShowWhen: { '@version': [{ _cnd: { gte: 2.3 } }] },
  },
  textField('imageEditPrompt', 'prompt', 'Prompt', '', {
    required: true, rows: 2, placeholder: 'A beautiful sunset over mountains',
    description: 'A text description of the desired edits; limits vary by model.',
  }),
  fixedCollectionField('imageEditImages', 'images', 'Images', [
    textField('binaryPropertyName', 'binaryPropertyName', 'Binary Field Name', 'data', {
      placeholder: 'e.g. data', description: 'The name of the binary field containing the image data',
    }),
  ], { values: [{ binaryPropertyName: 'data' }] }, {
    multiple: true, collectionKey: 'values', collectionLabel: 'Image', addLabel: 'Add Image',
    description: 'Add up to 16 png, webp, or jpg binary images under 50 MB each.',
    showWhen: { imageEditModelId: { includes: 'gpt-image' } },
    n8nShowWhen: { '/modelId': [{ _cnd: { includes: 'gpt-image' } }] },
  }),
  textField('imageEditBinaryPropertyName', 'binaryPropertyName', 'Binary Field Name', 'data', {
    placeholder: 'e.g. data', hint: 'The name of the input field containing the binary file data to be processed',
    description: 'Name of a square PNG binary image under 4 MB.',
    showWhen: { imageEditModelId: { includes: 'dall-e' } },
    n8nShowWhen: { '/modelId': [{ _cnd: { includes: 'dall-e' } }] },
  }),
  numberField('imageEditN', 'n', 'Number of Images', 1, {
    min: 1, max: 10, description: 'The number of images to generate. Must be between 1 and 10.',
  }),
  selectField('imageEditSize', 'size', 'Size', '1024x1024', [
    option('256x256', '256x256'), option('512x512', '512x512'), option('1024x1024', '1024x1024'),
    option('1024x1536 (Portrait)', '1024x1536'), option('1536x1024 (Landscape)', '1536x1024'), option('Auto', 'auto'),
  ], { description: 'The size of the generated images' }),
  selectField('imageEditQuality', 'quality', 'Quality', 'auto', [
    option('Auto', 'auto'), option('High', 'high'), option('Medium', 'medium'), option('Low', 'low'), option('Standard', 'standard'),
  ], {
    description: 'The quality of the generated image',
    showWhen: { imageEditModelId: { includes: 'gpt-image' } },
    n8nShowWhen: { '/modelId': [{ _cnd: { includes: 'gpt-image' } }] },
  }),
  selectField('imageEditResponseFormat', 'responseFormat', 'Response Format', 'url', [option('URL', 'url'), option('Base64 JSON', 'b64_json')], {
    description: 'Generated image format; URLs are valid for 60 minutes.',
    showWhen: { imageEditModelId: { includes: 'dall-e' } }, n8nShowWhen: { '/modelId': [{ _cnd: { includes: 'dall-e' } }] },
  }),
  selectField('imageEditOutputFormat', 'outputFormat', 'Output Format', 'png', [option('PNG', 'png'), option('JPEG', 'jpeg'), option('WebP', 'webp')], {
    description: 'The generated image format for GPT Image models.',
    showWhen: { imageEditModelId: { includes: 'gpt-image' } }, n8nShowWhen: { '/modelId': [{ _cnd: { includes: 'gpt-image' } }] },
  }),
  numberField('imageEditOutputCompression', 'outputCompression', 'Output Compression', 100, {
    min: 0, max: 100, description: 'Compression level for JPEG or WebP output.',
    showWhen: { imageEditModelId: { includes: 'gpt-image' }, imageEditOutputFormat: ['webp', 'jpeg'] },
    n8nShowWhen: { '/modelId': [{ _cnd: { includes: 'gpt-image' } }], outputFormat: ['webp', 'jpeg'] },
  }),
  collectionField('imageEditOptions', 'options', 'Options', [
    textField('user', 'user', 'User', '', {
      placeholder: 'user-12345', description: 'A unique end-user identifier that can help OpenAI monitor abuse',
    }),
    selectField('background', 'background', 'Background', 'auto', [option('Auto', 'auto'), option('Transparent', 'transparent'), option('Opaque', 'opaque')], {
      description: 'Background transparency for GPT Image models.',
      showWhen: { imageEditModelId: { includes: 'gpt-image' } }, n8nShowWhen: { '/modelId': [{ _cnd: { includes: 'gpt-image' } }] },
    }),
    selectField('inputFidelity', 'inputFidelity', 'Input Fidelity', 'low', [option('Low', 'low'), option('High', 'high')], {
      description: 'How much effort the model applies to matching input-image style and features.',
      showWhen: { imageEditModelId: { includes: 'gpt-image' } }, n8nShowWhen: { '/modelId': [{ _cnd: { includes: 'gpt-image' } }] },
    }),
    textField('imageMask', 'imageMask', 'Image Mask', 'data', {
      hint: 'The name of the input field containing the binary file data to be processed',
      description: 'Binary PNG mask whose transparent areas indicate where the first image should be edited.',
    }),
  ], {}, { sourceVersionShowWhen: { '@version': [{ _cnd: { gte: 2.3 } }] } }),
]);

const textClassifyParams = scope('text', 'classify', [
  textField('textClassifyInput', 'input', 'Text Input', '', {
    rows: 2, placeholder: 'e.g. Sample text goes here', description: 'The text to classify for moderation-policy violations',
  }),
  booleanField('textClassifySimplify', 'simplify', 'Simplify Output', false, {
    description: 'Whether to return a simplified response instead of the raw data',
  }),
]);

const responseMessageFields = [
  selectField('type', 'type', 'Type', 'text', [option('Text', 'text'), option('Image', 'image'), option('File', 'file')]),
  selectField('role', 'role', 'Role', 'user', roles, {
    description: "Role in shaping the model's response and how it should interact with the user",
  }),
  textField('content', 'content', 'Prompt', '', {
    rows: 2, placeholder: 'e.g. Hello, how can you help me?', description: 'The content of the message to be send',
    showWhen: { type: ['text'] }, n8nShowWhen: { type: ['text'] },
  }),
  selectField('imageType', 'imageType', 'Image Type', 'url', [option('Image URL', 'url'), option('File ID', 'fileId'), option('File Data', 'base64')], {
    showWhen: { type: ['image'] }, n8nShowWhen: { type: ['image'] },
  }),
  textField('imageUrl', 'imageUrl', 'Image URL', '', {
    placeholder: 'e.g. https://example.com/image.jpeg', description: 'URL of the image to be sent',
    showWhen: { type: ['image'], imageType: ['url'] }, n8nShowWhen: { type: ['image'], imageType: ['url'] },
  }),
  textField('imageBinaryPropertyName', 'binaryPropertyName', 'Image Data', 'data', {
    placeholder: 'e.g. data', hint: 'The name of the input field containing the binary file data to be processed',
    description: 'Name of the binary property containing the image(s)',
    showWhen: { type: ['image'], imageType: ['base64'] }, n8nShowWhen: { type: ['image'], imageType: ['base64'] },
  }),
  textField('imageFileId', 'fileId', 'File ID', '', {
    description: 'ID of the image file to be sent',
    showWhen: { type: ['image'], imageType: ['fileId'] }, n8nShowWhen: { type: ['image'], imageType: ['fileId'] },
  }),
  selectField('imageDetail', 'imageDetail', 'Detail', 'auto', [option('Auto', 'auto'), option('Low', 'low'), option('High', 'high')], {
    description: 'The detail level of the image sent to the model',
    showWhen: { type: ['image'] }, n8nShowWhen: { type: ['image'] },
  }),
  selectField('fileType', 'fileType', 'File Type', 'url', [option('File URL', 'url'), option('File ID', 'fileId'), option('File Data', 'base64')], {
    showWhen: { type: ['file'] }, n8nShowWhen: { type: ['file'] },
  }),
  textField('fileUrl', 'fileUrl', 'File URL', '', {
    placeholder: 'e.g. https://example.com/file.pdf', description: 'URL or base64-encoded file to send',
    showWhen: { type: ['file'], fileType: ['url'] }, n8nShowWhen: { type: ['file'], fileType: ['url'] },
  }),
  textField('fileFileId', 'fileId', 'File ID', '', {
    description: 'ID of the file to be sent',
    showWhen: { type: ['file'], fileType: ['fileId'] }, n8nShowWhen: { type: ['file'], fileType: ['fileId'] },
  }),
  textField('fileBinaryPropertyName', 'binaryPropertyName', 'File Data', 'data', {
    placeholder: 'e.g. data', hint: 'The name of the input field containing the binary file data to be processed',
    description: 'Name of the binary property containing the file',
    showWhen: { type: ['file'], fileType: ['base64'] }, n8nShowWhen: { type: ['file'], fileType: ['base64'] },
  }),
  textField('fileName', 'fileName', 'File Name', '', {
    required: true, showWhen: { type: ['file'], fileType: ['base64'] }, n8nShowWhen: { type: ['file'], fileType: ['base64'] },
  }),
];

const builtInToolsFields = [
  collectionField('webSearch', 'webSearch', 'Web Search', [
    selectField('searchContextSize', 'searchContextSize', 'Search Context Size', 'medium', [option('Low', 'low'), option('Medium', 'medium'), option('High', 'high')], {
      description: 'High-level guidance for the context-window space allocated to search',
    }),
    textField('allowedDomains', 'allowedDomains', 'Web Search Allowed Domains', '', {
      placeholder: 'e.g. google.com, wikipedia.org', description: 'Comma-separated allowlist of domains to search',
    }),
    textField('country', 'country', 'Country', '', { placeholder: 'e.g. US, GB' }),
    textField('city', 'city', 'City', '', { placeholder: 'e.g. New York, London' }),
    textField('region', 'region', 'Region', '', { placeholder: 'e.g. New York, London' }),
  ], { searchContextSize: 'medium' }),
  collectionField('fileSearch', 'fileSearch', 'File Search', [
    jsonField('vectorStoreIds', 'vectorStoreIds', 'Vector Store IDs', '[]', {
      required: true, description: 'Vector store IDs managed through the OpenAI Dashboard',
    }),
    jsonField('filters', 'filters', 'Filters', '{}'),
    numberField('maxResults', 'maxResults', 'Max Results', 1, { min: 1, max: 50 }),
  ], { vectorStoreIds: '[]' }),
  booleanField('codeInterpreter', 'codeInterpreter', 'Code Interpreter', true, {
    description: 'Whether to allow the model to execute code in a sandboxed environment',
  }),
];

const textResponseOptions = [
  textField('conversationId', 'conversationId', 'Conversation ID', '', {
    description: 'Conversation to which input and output items are automatically added.',
  }),
  multiSelectField('include', 'include', 'Include Additional Data', [], [
    option('Code Interpreter Call Outputs', 'code_interpreter_call.outputs'),
    option('Computer Call Output Image URL', 'computer_call_output.output.image_url'),
    option('File Search Call Results', 'file_search_call.results'),
    option('Message Input Image URL', 'message.input_image.image_url'),
    option('Message Output Text Logprobs', 'message.output_text.logprobs'),
    option('Reasoning Encrypted Content', 'reasoning.encrypted_content'),
    option('Web Search Tool Call Sources', 'web_search_call.action.sources'),
  ], { description: 'Additional output data to include in the model response' }),
  textField('instructions', 'instructions', 'Instructions', '', { rows: 2, description: 'Instructions for the model to follow' }),
  numberField('maxTokens', 'maxTokens', 'Maximum Number of Tokens', 16, { max: 32768, description: 'Maximum number of tokens to generate' }),
  numberField('maxToolsIterations', 'maxToolsIterations', 'Max Tool Calls Iterations', 15, {
    description: 'Maximum tool iteration cycles before stopping; 0 means no limit.',
  }),
  numberField('maxToolCalls', 'maxToolCalls', 'Max Built-in Tool Calls', 15, {
    description: 'Maximum total calls to built-in tools processed in a response.',
  }),
  metadataField(),
  booleanField('parallelToolCalls', 'parallelToolCalls', 'Parallel Tool Calls', false, {
    description: 'Whether the model can call multiple tools at once',
  }),
  textField('previousResponseId', 'previousResponseId', 'Previous Response ID', '', {
    description: 'Previous response to continue from; cannot be combined with Conversation ID.',
  }),
  fixedCollectionField('promptConfig', 'promptConfig', 'Prompt', [
    textField('promptId', 'promptId', 'Prompt ID', '', { description: 'Unique identifier of the reusable prompt template' }),
    textField('version', 'version', 'Version', '', { description: 'Optional prompt-template version' }),
    jsonField('variables', 'variables', 'Variables', '{}', { description: 'Variables substituted into the prompt template' }),
  ], { promptOptions: [{ promptId: '' }] }, {
    collectionKey: 'promptOptions', collectionLabel: 'Prompt',
    description: 'Configure a reusable prompt template from the OpenAI Dashboard.',
  }),
  textField('promptCacheKey', 'promptCacheKey', 'Prompt Cache Key', '', {
    description: 'Used by OpenAI to improve cache hit rates for similar requests',
  }),
  fixedCollectionField('reasoning', 'reasoning', 'Reasoning', [
    selectField('effort', 'effort', 'Effort', 'medium', [option('Low', 'low'), option('Medium', 'medium'), option('High', 'high')]),
    selectField('summary', 'summary', 'Summary', 'auto', [option('None', 'none'), option('Auto', 'auto'), option('Concise', 'concise'), option('Detailed', 'detailed')], {
      description: "Summary of the model's reasoning for debugging and review",
    }),
  ], { reasoningOptions: [{ effort: 'medium', summary: 'none' }] }, {
    collectionKey: 'reasoningOptions', collectionLabel: 'Reasoning',
  }),
  textField('safetyIdentifier', 'safetyIdentifier', 'Safety Identifier', '', {
    description: 'Stable identifier used to help detect users violating OpenAI usage policies.',
  }),
  selectField('serviceTier', 'serviceTier', 'Service Tier', 'auto', [option('Auto', 'auto'), option('Flex', 'flex'), option('Default', 'default'), option('Priority', 'priority')], {
    description: 'The service tier to use for the request',
  }),
  booleanField('store', 'store', 'Store', true, { description: 'Whether to store the response for later retrieval via API' }),
  fixedCollectionField('textFormat', 'textFormat', 'Output Format', [
    selectField('type', 'type', 'Type', '', [option('Text', 'text'), option('JSON Schema (recommended)', 'json_schema'), option('JSON Object', 'json_object')]),
    selectField('verbosity', 'verbosity', 'Verbosity', 'medium', [option('Low', 'low'), option('Medium', 'medium'), option('High', 'high')]),
    textField('name', 'name', 'Name', 'my_schema', {
      description: 'Schema name using letters, numbers, underscores, or dashes, up to 64 characters.',
      showWhen: { type: ['json_schema'] }, n8nShowWhen: { type: ['json_schema'] },
    }),
    {
      key: 'requiredNotice', n8nKey: 'requiredNotice',
      label: 'All properties in the schema must be set to "required", when using "strict" mode.',
      kind: 'notice', value: '', required: false,
      showWhen: { strict: [true] }, n8nShowWhen: { strict: [true] },
    },
    jsonField('schema', 'schema', 'Schema', '{\n  "type": "object",\n  "properties": {\n    "message": { "type": "string" }\n  },\n  "additionalProperties": false,\n  "required": ["message"]\n}', {
      description: 'The JSON schema of the response format',
      showWhen: { type: ['json_schema'] }, n8nShowWhen: { type: ['json_schema'] },
    }),
    textField('description', 'description', 'Description', '', {
      description: 'The description of the response format',
      showWhen: { type: ['json_schema'] }, n8nShowWhen: { type: ['json_schema'] },
    }),
    booleanField('strict', 'strict', 'Strict', false, {
      description: 'Whether responses must always match the JSON schema',
      showWhen: { type: ['json_schema'] }, n8nShowWhen: { type: ['json_schema'] },
    }),
  ], { textOptions: [{ type: 'text' }] }, {
    collectionKey: 'textOptions', collectionLabel: 'Text',
  }),
  numberField('topLogprobs', 'topLogprobs', 'Top Logprobs', 0, { min: 0, max: 20, description: 'Number of likely tokens and log probabilities returned at each position' }),
  numberField('temperature', 'temperature', 'Output Randomness (Temperature)', 1, { min: 0, max: 2, precision: 1, description: 'Sampling temperature between 0 and 2' }),
  numberField('topP', 'topP', 'Output Randomness (Top P)', 1, { min: 0, max: 1, precision: 1, description: 'Nucleus-sampling probability mass' }),
  booleanField('truncation', 'truncation', 'Truncation', false, { description: "Whether to truncate input to the model's context window" }),
  fixedCollectionField('backgroundMode', 'backgroundMode', 'Background Mode', [
    booleanField('enabled', 'enabled', 'Background Mode', false, { description: 'Whether to run the model in background mode' }),
    numberField('timeout', 'timeout', 'Timeout', 300, { min: 0, max: 3600, description: 'Background-mode timeout in seconds; 0 is infinite.' }),
  ], { values: [{ backgroundMode: true }] }, { collectionKey: 'values', collectionLabel: 'Bakground' }),
];

const unsupportedToolModels = [
  'gpt-3.5-turbo-16k-0613', 'dall-e-3', 'text-embedding-3-large', 'dall-e-2', 'whisper-1',
  'tts-1-hd-1106', 'tts-1-hd', 'gpt-4-0314', 'text-embedding-3-small', 'gpt-4-32k-0314',
  'gpt-3.5-turbo-0301', 'gpt-4-vision-preview', 'gpt-3.5-turbo-16k',
  'gpt-3.5-turbo-instruct-0914', 'tts-1', 'davinci-002', 'gpt-3.5-turbo-instruct',
  'babbage-002', 'tts-1-1106', 'text-embedding-ada-002',
];

const textResponseParams = scope('text', 'response', [
  resourceLocator('textResponseModelId', 'modelSearch'),
  fixedCollectionField('textResponseMessages', 'responses', 'Messages', responseMessageFields, { values: [{ type: 'text' }] }, {
    multiple: true, sortable: true, collectionKey: 'values', collectionLabel: 'Message', addLabel: 'Add Message',
  }),
  booleanField('textResponseSimplify', 'simplify', 'Simplify Output', true, {
    description: 'Whether to return a simplified response instead of the raw data',
  }),
  {
    key: 'textResponseHideTools', n8nKey: 'hideTools', label: 'Hide Tools', kind: 'hidden', value: 'hide', required: false,
    showWhen: { textResponseModelId: unsupportedToolModels }, n8nShowWhen: { modelId: unsupportedToolModels },
  },
  {
    key: 'textResponseToolsNotice', n8nKey: 'noticeTools',
    label: 'Connect your own custom n8n tools to this node on the canvas', kind: 'notice', value: '', required: false,
    hideWhen: { textResponseHideTools: ['hide'] }, n8nHideWhen: { hideTools: ['hide'] },
  },
  collectionField('textResponseBuiltInTools', 'builtInTools', 'Built-in Tools', builtInToolsFields, {}, { addLabel: 'Add Built-in Tool' }),
  collectionField('textResponseOptions', 'options', 'Options', textResponseOptions),
]);

const videoGenerateParams = scope('video', 'generate', [
  resourceLocator('videoGenerateModelId', 'videoModelSearch'),
  textField('videoGeneratePrompt', 'prompt', 'Prompt', 'A video of a cat playing with a ball', {
    required: true, rows: 2, description: 'The prompt to generate a video from',
  }),
  numberField('videoGenerateSeconds', 'seconds', 'Seconds', 4, { required: true, description: 'Clip duration in seconds' }),
  selectField('videoGenerateSize', 'size', 'Size', '1280x720', [
    option('720x1280', '720x1280'), option('1280x720', '1280x720'),
    option('1024x1792', '1024x1792'), option('1792x1024', '1792x1024'),
  ], { description: 'Output resolution; the 1024x1792 and 1792x1024 sizes require Sora 2 Pro.' }),
  collectionField('videoGenerateOptions', 'options', 'Options', [
    textField('binaryPropertyNameReference', 'binaryPropertyNameReference', 'Reference', 'data', {
      placeholder: 'e.g. data', description: 'Optional image reference that guides generation',
    }),
    numberField('waitTime', 'waitTime', 'Wait Timeout', 300, { min: 5, max: 7200, description: 'Time to wait for video generation in seconds' }),
    textField('fileName', 'fileName', 'Output Field Name', 'data', { hint: 'The name of the output field to put the binary file data in' }),
  ]),
]);

const openai = {
  type: 'openai',
  n8nType: '@n8n/n8n-nodes-langchain.openAi',
  n8nVersion: 2.3,
  defaultVersion: 2.3,
  versionHistory: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2, 2.1, 2.2, 2.3],
  currentSchemaVersions: [2, 2.1, 2.2, 2.3],
  label: 'OpenAI',
  defaultName: 'OpenAI',
  subtitle: '={{prettifyOperation($parameter.resource, $parameter.operation)}}',
  description: 'Message an assistant or GPT, analyze images, generate audio, etc.',
  category: 'action',
  categories: ['AI'],
  subcategories: ['Agents', 'Miscellaneous', 'Root Nodes'],
  group: ['transform'],
  defaults: { name: 'OpenAI' },
  inputs: ['main'],
  outputs: ['main'],
  portVariants: [
    {
      showWhen: {
        resource: ['text'],
        textOperation: ['response'],
        textResponseModelId: { notIn: unsupportedToolModels },
      },
      n8nShowWhen: { resource: ['text'], operation: ['response'], hideTools: { not: 'hide' } },
      inputs: [{ type: 'main' }, { type: 'ai_tool', label: 'Tools', required: false }],
      outputs: [{ type: 'main' }],
    },
  ],
  dynamicInputMetadata: {
    sourceFunction: 'configureNodeInputs(resource, operation, hideTools, memory)',
    defaultInputs: [{ type: 'main' }],
    textResponseInputs: [{ type: 'main' }, { type: 'ai_tool', displayName: 'Tools' }],
    hideToolsBehavior: 'When hideTools is "hide", only the main input remains.',
    unsupportedToolModels,
  },
  usableAsTool: false,
  toolInputConnector: 'ai_tool',
  icon: '/node-icons/openai.svg',
  darkIcon: '/node-icons/openai.dark.svg',
  n8nIcon: { light: 'file:openAi.svg', dark: 'file:openAi.dark.svg' },
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 40, height: 40, viewBox: '0 0 40 40' },
  iconAssetSha256: '96e9112b9728cc88be247121c2a5896eeaf67b6ff8e43a45c69bcedf20f78814',
  darkIconAssetSha256: '824f4eaab106c5a805086427f07e1efe58c15c218d1920005a2b19597e9ebd2d',
  aliases: ['LangChain', 'ChatGPT', 'Sora', 'DallE', 'whisper', 'audio', 'transcribe', 'tts', 'assistant'],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/openai/',
  source: {
    commit: sourceCommit,
    path: 'packages/@n8n/nodes-langchain/nodes/vendors/OpenAi/OpenAi.node.ts',
    versionPath: 'packages/@n8n/nodes-langchain/nodes/vendors/OpenAi/v2/OpenAiV2.node.ts',
    commonDescriptionPath: 'packages/@n8n/nodes-langchain/nodes/vendors/OpenAi/v2/actions/descriptions.ts',
    inputDescriptionPath: 'packages/@n8n/nodes-langchain/nodes/vendors/OpenAi/helpers/description.ts',
    modelFilterPath: 'packages/@n8n/nodes-langchain/nodes/vendors/OpenAi/helpers/modelFiltering.ts',
    methodPath: 'packages/@n8n/nodes-langchain/nodes/vendors/OpenAi/methods/listSearch.ts',
    credentialPath: 'packages/nodes-base/credentials/OpenAiApi.credentials.ts',
    iconPaths: [
      'packages/@n8n/nodes-langchain/nodes/vendors/OpenAi/openAi.svg',
      'packages/@n8n/nodes-langchain/nodes/vendors/OpenAi/openAi.dark.svg',
    ],
    parameterPaths: [
      'v2/actions/audio/generate.operation.ts', 'v2/actions/audio/transcribe.operation.ts', 'v2/actions/audio/translate.operation.ts',
      'v2/actions/conversation/create.operation.ts', 'v2/actions/conversation/get.operation.ts',
      'v2/actions/conversation/remove.operation.ts', 'v2/actions/conversation/update.operation.ts',
      'v2/actions/file/deleteFile.operation.ts', 'v2/actions/file/list.operation.ts', 'v2/actions/file/upload.operation.ts',
      'v2/actions/image/analyze.operation.ts', 'v2/actions/image/edit.operation.ts', 'v2/actions/image/generate.operation.ts',
      'v2/actions/text/classify.operation.ts', 'v2/actions/text/response.operation.ts',
      'v2/actions/video/generate.operation.ts',
    ],
  },
  resources: [
    { value: 'text', defaultOperation: 'response', operations: ['response', 'classify'] },
    { value: 'image', defaultOperation: 'generate', operations: ['analyze', 'generate', 'edit'] },
    { value: 'audio', defaultOperation: 'generate', operations: ['generate', 'transcribe', 'translate'] },
    { value: 'file', defaultOperation: 'upload', operations: ['deleteFile', 'list', 'upload'] },
    { value: 'conversation', defaultOperation: 'create', operations: ['create', 'get', 'remove', 'update'] },
    { value: 'video', defaultOperation: 'generate', operations: ['generate'] },
  ],
  credentialRequirements: [
    {
      type: 'openAiApi', name: 'OpenAI', required: true, inert: true, documentationUrl: 'openai',
      authenticate: {
        type: 'header', inert: true,
        headers: { Authorization: 'Bearer {{$credentials.apiKey}}', 'OpenAI-Organization': '{{$credentials.organizationId}}' },
        optionalCustomHeader: { enabledBy: 'header', nameFrom: 'headerName', valueFrom: 'headerValue' },
      },
      testRequest: { baseURL: '={{$credentials?.url}}', url: '/models', inert: true },
      fields: [
        textField('apiKey', 'apiKey', 'API Key', '', { required: true, password: true }),
        textField('organizationId', 'organizationId', 'Organization ID (optional)', '', {
          hint: 'Only required if you belong to multiple organisations',
          description: "Selects which organization's subscription quota receives usage.",
        }),
        textField('url', 'url', 'Base URL', 'https://api.openai.com/v1', { description: 'Override the default base URL for the API' }),
        booleanField('header', 'header', 'Add Custom Header', false),
        textField('headerName', 'headerName', 'Header Name', '', {
          showWhen: { header: [true] }, password: false, ignoreCredentialExpressionResolveError: true,
        }),
        textField('headerValue', 'headerValue', 'Header Value', '', {
          showWhen: { header: [true] }, password: true, ignoreCredentialExpressionResolveError: true,
        }),
      ],
    },
  ],
  credentialUiMetadata: [
    {
      key: 'openAiApiCredential', type: 'openAiApi', name: 'OpenAI',
      sourcePath: 'packages/nodes-base/credentials/OpenAiApi.credentials.ts',
      renderedInCredentialEditor: false, inert: true,
    },
  ],
  params: [
    {
      key: 'openAiApiCredential', n8nKey: 'credentials.openAiApi', label: 'Credential to connect with',
      kind: 'select', sourceKind: 'credentials', value: 'openAiApi', required: true,
      locked: true, dynamic: true, options: [option('OpenAI', 'openAiApi')], simulationNote: lockedCredentialNote,
    },
    selectField('resource', 'resource', 'Resource', 'text', [
      option('Text', 'text'), option('Image', 'image'), option('Audio', 'audio'), option('File', 'file'),
      option('Conversation', 'conversation'), option('Video', 'video'),
    ], { noDataExpression: true }),
    selectField('textOperation', 'operation', 'Operation', 'response', textOperations, { noDataExpression: true, showWhen: { resource: ['text'] } }),
    selectField('imageOperation', 'operation', 'Operation', 'generate', imageOperations, { noDataExpression: true, showWhen: { resource: ['image'] } }),
    selectField('audioOperation', 'operation', 'Operation', 'generate', audioOperations, { noDataExpression: true, showWhen: { resource: ['audio'] } }),
    selectField('fileOperation', 'operation', 'Operation', 'upload', fileOperations, { noDataExpression: true, showWhen: { resource: ['file'] } }),
    selectField('conversationOperation', 'operation', 'Operation', 'create', conversationOperations, { noDataExpression: true, showWhen: { resource: ['conversation'] } }),
    selectField('videoOperation', 'operation', 'Operation', 'generate', videoOperations, { noDataExpression: true, showWhen: { resource: ['video'] } }),
    {
      key: 'audioFileSizeLimitNotice', n8nKey: 'fileSizeLimitNotice',
      label: 'OpenAI API limits the size of the audio file to 25 MB', kind: 'notice', value: ' ', required: false,
      showWhen: { resource: ['audio'], audioOperation: ['translate', 'transcribe'] },
      n8nShowWhen: { resource: ['audio'], operation: ['translate', 'transcribe'] },
    },
    ...audioGenerateParams,
    ...audioTranscribeParams,
    ...audioTranslateParams,
    ...conversationCreateParams,
    ...conversationIdParam('get', 'Get'),
    ...conversationIdParam('remove', 'Delete'),
    ...conversationUpdateParams,
    ...fileParams,
    ...imageAnalyzeParams,
    ...imageGenerateParams,
    ...imageEditParams,
    ...textClassifyParams,
    ...textResponseParams,
    ...videoGenerateParams,
  ],
  resourceOperationParity: {
    text: { expected: ['response', 'classify'], represented: textOperations.map(({ value }) => value), default: 'response' },
    image: { expected: ['analyze', 'generate', 'edit'], represented: imageOperations.map(({ value }) => value), default: 'generate' },
    audio: { expected: ['generate', 'transcribe', 'translate'], represented: audioOperations.map(({ value }) => value), default: 'generate' },
    file: { expected: ['deleteFile', 'list', 'upload'], represented: fileOperations.map(({ value }) => value), default: 'upload' },
    conversation: { expected: ['create', 'get', 'remove', 'update'], represented: conversationOperations.map(({ value }) => value), default: 'create' },
    video: { expected: ['generate'], represented: videoOperations.map(({ value }) => value), default: 'generate' },
  },
  operationCount: 16,
  lookupMetadata: {
    fileSearch: { parameter: 'fileId', endpoint: '/files', searchable: true, networkAccess: false },
    modelSearch: { parameter: 'modelId', endpoint: '/models', customBaseUrlAware: true, networkAccess: false },
    imageModelSearch: { parameter: 'modelId', endpoint: '/models', filter: 'vision-capable text models', networkAccess: false },
    imageGenerateModelSearch: { parameter: 'modelId', endpoint: '/models', filter: 'dall-e or gpt-image', networkAccess: false },
    videoModelSearch: { parameter: 'modelId', endpoint: '/models', filter: 'sora', networkAccess: false },
  },
  versionBranches: [
    { versions: '1 - 1.8', implementation: 'OpenAiV1', representedInCurrentParams: false, note: 'Legacy Assistant-era action schema is intentionally excluded.' },
    { versions: '2 - 2.1', implementation: 'OpenAiV2', representedInCurrentParams: false, note: 'Current catalog renders only the default v2.3 branch.' },
    { versions: '>= 2.2', n8nKey: 'image.generate.modelId', sourceKind: 'resourceLocator', representedInCurrentParams: true },
    { versions: '< 2.1', n8nKey: 'text.classify.options.useStableModel', representedInCurrentParams: false },
    { versions: '>= 2.3', n8nKey: 'image.edit.modelId', sourceKind: 'resourceLocator', representedInCurrentParams: true },
  ],
  docsSummary: {
    sourceOfTruth: 'Pinned implementation; official n8n node and operation docs are supplementary.',
    officialNodeDocs: true,
    officialCredentialDocs: true,
    aiToolDocumented: false,
  },
  platformGaps: [
    'The source reuses operation, modelId, options, binaryPropertyName, fileId, and many collection-field names across conditional branches. Unique UI keys keep branches stable while n8nKey retains every native parameter name.',
    'All From List modes retain their search method names but are locked and empty. The simulation never reads credentials or calls /models or /files.',
    'Native JSON controls are inert textareas. They are neither parsed nor validated.',
    'The source dynamically adds an AI Tool input for Text > Message a Model unless hideTools is set for a model without function calling. The port contract is metadata only; connected tools are never discovered or invoked.',
    'Built-in Web Search, File Search, Code Interpreter, background mode, and polling controls are authoring-only. They never browse, access vector stores, execute code, wait, or poll.',
    'The catalog renders the default v2.3 schema. Older v2 image selectors and the legacy v1 Assistant-era surface remain provenance only.',
    'The source does not declare usableAsTool; this node accepts optional AI tools for its Responses operation but cannot itself be attached as an AI Agent tool.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials.openAiApi', sourceType: 'credentials', normalizedKind: 'locked select', reason: 'Credential discovery and editors are unavailable.' },
    { n8nKey: 'modelId/fileId', sourceType: 'resourceLocator with remote listSearch', normalizedKind: 'resourceLocator', reason: 'Remote discovery is disabled; ID authoring remains available.' },
    { n8nKey: 'metadata/filters/vectorStoreIds/variables/schema', sourceType: 'json', normalizedKind: 'textarea', reason: 'JSON remains inert authoring text.' },
    { n8nKey: 'responses/messages/images/promptConfig/reasoning/textFormat/backgroundMode', sourceType: 'fixedCollection', normalizedKind: 'fixedCollection', reason: 'Nested authoring is preserved without request construction.' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    authentication: false,
    customHeaderApplication: false,
    modelDiscovery: false,
    fileDiscovery: false,
    toolDiscovery: false,
    toolExecution: false,
    builtInWebSearch: false,
    builtInFileSearch: false,
    codeExecution: false,
    jsonParsing: false,
    apiRequests: false,
    networkAccess: false,
    binaryAccess: false,
    fileUpload: false,
    fileDownload: false,
    transcription: false,
    translation: false,
    audioGeneration: false,
    imageAnalysis: false,
    imageGeneration: false,
    imageEditing: false,
    videoGeneration: false,
    conversationMutation: false,
    backgroundPolling: false,
    waiting: false,
    voice: false,
  },
  output: {},
};

export default openai;
