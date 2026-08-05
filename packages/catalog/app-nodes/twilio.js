// Editor-only descriptor for n8n's current Twilio v1 action node.
// Credentials, SMS, MMS, WhatsApp, calls, TwiML processing, and all Twilio API
// behavior remain inert in this authoring simulation.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This selector is locked. The simulation never creates, reads, tests, or applies Twilio credentials.';

const smsOperations = [
  {
    label: 'Send',
    value: 'send',
    description: 'Send SMS/MMS/WhatsApp message',
    action: 'Send an SMS/MMS/WhatsApp message',
  },
];

const callOperations = [
  { label: 'Make', value: 'make', action: 'Make a call' },
];

const twilio = {
  type: 'twilio',
  n8nType: 'n8n-nodes-base.twilio',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'Twilio',
  defaultName: 'Twilio',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Send SMS and WhatsApp messages or make phone calls',
  category: 'action',
  categories: ['Communication', 'Development'],
  group: ['transform'],
  defaults: { name: 'Twilio' },
  inputs: ['main'],
  outputs: ['main'],
  usableAsTool: true,
  icon: '/node-icons/twilio.svg',
  n8nIcon: 'file:twilio.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 65, height: 65, viewBox: '0 0 65 65' },
  iconAssetSha256: 'e18033507e088912da790f33136f40312d707fcbbb2817469473e78725cfa8d2',
  sourceIconAssetSha256: '2a62025bbef139ae1f5185e85d1bb869aa049df47c03f0cae2a98afd15754450',
  aliases: ['SMS', 'Phone', 'Voice'],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.twilio/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/twilio/',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Twilio/Twilio.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Twilio/Twilio.node.json',
    credentialPath: 'packages/nodes-base/credentials/TwilioApi.credentials.ts',
    transportPath: 'packages/nodes-base/nodes/Twilio/GenericFunctions.ts',
    iconPath: 'packages/nodes-base/nodes/Twilio/twilio.svg',
  },
  resources: [
    { value: 'call', defaultOperation: 'make', operations: ['make'] },
    { value: 'sms', defaultOperation: 'send', operations: ['send'] },
  ],
  credentialRequirements: [
    {
      type: 'twilioApi',
      name: 'Twilio API',
      required: true,
      inert: true,
      documentationUrl: 'twilio',
      authenticate: {
        type: 'basicAuth',
        inert: true,
        username:
          '={{ $credentials.authType === "apiKey" ? $credentials.apiKeySid : $credentials.accountSid }}',
        password:
          '={{ $credentials.authType === "apiKey" ? $credentials.apiKeySecret : $credentials.authToken }}',
      },
      testRequest: {
        url: '=https://api.twilio.com/2010-04-01/Accounts/{{$credentials.accountSid}}.json',
        inert: true,
      },
      fields: [
        {
          key: 'authType', n8nKey: 'authType', label: 'Auth Type', kind: 'select', sourceKind: 'options',
          value: 'authToken', required: false,
          options: [
            { label: 'Auth Token', value: 'authToken' },
            { label: 'API Key', value: 'apiKey' },
          ],
        },
        {
          key: 'accountSid', n8nKey: 'accountSid', label: 'Account SID', kind: 'text', sourceKind: 'string',
          value: '', required: false,
        },
        {
          key: 'authToken', n8nKey: 'authToken', label: 'Auth Token', kind: 'text', sourceKind: 'string',
          value: '', required: false, password: true, showWhen: { authType: ['authToken'] },
          n8nShowWhen: { authType: ['authToken'] },
        },
        {
          key: 'apiKeySid', n8nKey: 'apiKeySid', label: 'API Key SID', kind: 'text', sourceKind: 'string',
          value: '', required: false, password: true, showWhen: { authType: ['apiKey'] },
          n8nShowWhen: { authType: ['apiKey'] },
        },
        {
          key: 'apiKeySecret', n8nKey: 'apiKeySecret', label: 'API Key Secret', kind: 'text', sourceKind: 'string',
          value: '', required: false, password: true, showWhen: { authType: ['apiKey'] },
          n8nShowWhen: { authType: ['apiKey'] },
        },
      ],
    },
  ],
  credentialUiMetadata: [
    {
      key: 'twilioApiCredential',
      type: 'twilioApi',
      name: 'Twilio API',
      sourcePath: 'packages/nodes-base/credentials/TwilioApi.credentials.ts',
      renderedInCredentialEditor: false,
      inert: true,
    },
  ],
  params: [
    {
      key: 'twilioApiCredential', n8nKey: 'credentials.twilioApi',
      label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials',
      value: 'twilioApi', required: true, locked: true, dynamic: true,
      options: [{ label: 'Twilio API', value: 'twilioApi' }],
      simulationNote: lockedCredentialNote,
    },
    {
      key: 'resource', n8nKey: 'resource', label: 'Resource', kind: 'select', sourceKind: 'options',
      value: 'sms', required: false, noDataExpression: true,
      options: [
        { label: 'Call', value: 'call' },
        { label: 'SMS', value: 'sms' },
      ],
    },
    {
      key: 'smsOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options',
      value: 'send', required: false, noDataExpression: true,
      options: smsOperations, showWhen: { resource: ['sms'] },
      n8nShowWhen: { resource: ['sms'] },
    },
    {
      key: 'callOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options',
      value: 'make', required: false, noDataExpression: true,
      options: callOperations, showWhen: { resource: ['call'] },
      n8nShowWhen: { resource: ['call'] },
    },
    {
      key: 'smsFrom', n8nKey: 'from', label: 'From', kind: 'text', sourceKind: 'string',
      value: '', required: true, placeholder: '+14155238886',
      description: 'The number from which to send the message',
      showWhen: { resource: ['sms'], smsOperation: ['send'] },
      n8nShowWhen: { resource: ['sms', 'call'], operation: ['send', 'make'] },
    },
    {
      key: 'smsTo', n8nKey: 'to', label: 'To', kind: 'text', sourceKind: 'string',
      value: '', required: true, placeholder: '+14155238886',
      description: 'The number to which to send the message',
      showWhen: { resource: ['sms'], smsOperation: ['send'] },
      n8nShowWhen: { resource: ['sms', 'call'], operation: ['send', 'make'] },
    },
    {
      key: 'callFrom', n8nKey: 'from', label: 'From', kind: 'text', sourceKind: 'string',
      value: '', required: true, placeholder: '+14155238886',
      description: 'The number from which to send the message',
      showWhen: { resource: ['call'], callOperation: ['make'] },
      n8nShowWhen: { resource: ['sms', 'call'], operation: ['send', 'make'] },
    },
    {
      key: 'callTo', n8nKey: 'to', label: 'To', kind: 'text', sourceKind: 'string',
      value: '', required: true, placeholder: '+14155238886',
      description: 'The number to which to send the message',
      showWhen: { resource: ['call'], callOperation: ['make'] },
      n8nShowWhen: { resource: ['sms', 'call'], operation: ['send', 'make'] },
    },
    {
      key: 'smsToWhatsapp', n8nKey: 'toWhatsapp', label: 'To Whatsapp', kind: 'boolean',
      value: false, required: false, description: 'Whether the message should be sent to WhatsApp',
      showWhen: { resource: ['sms'], smsOperation: ['send'] },
      n8nShowWhen: { resource: ['sms'], operation: ['send'] },
    },
    {
      key: 'smsMessage', n8nKey: 'message', label: 'Message', kind: 'text', sourceKind: 'string',
      value: '', required: true, description: 'The message to send',
      showWhen: { resource: ['sms'], smsOperation: ['send'] },
      n8nShowWhen: { resource: ['sms'], operation: ['send'] },
    },
    {
      key: 'callTwiml', n8nKey: 'twiml', label: 'Use TwiML', kind: 'boolean',
      value: false, required: false,
      description: 'Whether to use the Twilio Markup Language in the message',
      documentationUrl: 'https://www.twilio.com/docs/voice/twiml',
      showWhen: { resource: ['call'], callOperation: ['make'] },
      n8nShowWhen: { resource: ['call'], operation: ['make'] },
    },
    {
      key: 'callMessage', n8nKey: 'message', label: 'Message', kind: 'text', sourceKind: 'string',
      value: '', required: true,
      showWhen: { resource: ['call'], callOperation: ['make'] },
      n8nShowWhen: { resource: ['call'], operation: ['make'] },
    },
    {
      key: 'options', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Field',
      fields: [
        {
          key: 'statusCallback', n8nKey: 'statusCallback', label: 'Status Callback', kind: 'text', sourceKind: 'string',
          value: '', required: false,
          description: 'Status Callbacks allow you to receive events related to Twilio REST resources including Rooms, Recordings and Compositions',
        },
      ],
    },
  ],
  resourceOperationParity: {
    call: { expected: ['make'], represented: callOperations.map(({ value }) => value), default: 'make' },
    sms: { expected: ['send'], represented: smsOperations.map(({ value }) => value), default: 'send' },
  },
  operationCount: 2,
  docsSummary: {
    sourceOfTruth: 'Pinned implementation; official n8n node and credential docs confirm the current operations and authentication modes.',
    documentedOperations: ['sms.send', 'call.make'],
    documentedAuthenticationMethods: ['authToken', 'apiKey'],
    aiToolDocumented: true,
  },
  platformGaps: [
    'The native node reuses operation and message across conditional branches. Unique UI keys keep both operation and message branches stable while n8nKey retains the real parameter names.',
    'From and To are shared by SMS Send and Call Make. Resource-scoped UI copies preserve effective visibility, while each copy retains the native combined condition as n8nShowWhen.',
    'The source Options collection is unconditional and remains visible for either selected resource and operation.',
    'The credential selector and both Basic Auth credential branches are metadata only. No SID, token, key, or secret is resolved, tested, or attached to a request.',
    'The source marks Twilio usableAsTool. This is capability metadata only; the catalog does not add a static AI Tool port or executable tool runtime.',
    'TwiML stays inert authoring text. It is never parsed, escaped, rendered, spoken, or sent.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'credentials.twilioApi', sourceType: 'credentials', normalizedKind: 'locked select',
      reason: 'Credential discovery and credential-editor workflows are unavailable.',
    },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    authentication: false,
    basicAuthResolution: false,
    apiRequests: false,
    networkAccess: false,
    smsSending: false,
    mmsSending: false,
    whatsappSending: false,
    callCreation: false,
    twimlParsing: false,
    xmlEscaping: false,
    textToSpeech: false,
    statusCallbacks: false,
    voice: false,
  },
  output: {},
};

export default twilio;
