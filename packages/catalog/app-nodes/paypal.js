// Editor-only descriptor for n8n's PayPal v1 action node.
// Credentials, OAuth token exchange, payout reads, payout writes, and all network activity stay inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This credential selector is locked. The simulation never creates, reads, tests, encodes, exchanges, or applies PayPal credentials.';

const payoutOperations = [
  { label: 'Create', value: 'create', description: 'Create a batch payout', action: 'Create a payout' },
  { label: 'Get', value: 'get', description: 'Show batch payout details', action: 'Get a payout' },
];

const payoutItemOperations = [
  { label: 'Cancel', value: 'cancel', description: 'Cancels an unclaimed payout item', action: 'Cancel a payout item' },
  { label: 'Get', value: 'get', description: 'Show payout item details', action: 'Get a payout item' },
];

const recipientTypeOptions = [
  { label: 'Phone', value: 'phone', description: 'The unencrypted phone number' },
  { label: 'Email', value: 'email', description: 'The unencrypted email' },
  { label: 'PayPal ID', value: 'paypalId', description: 'The encrypted PayPal account number' },
];

const currencyOptions = [
  { label: 'Australian Dollar', value: 'AUD' },
  { label: 'Brazilian Real', value: 'BRL' },
  { label: 'Canadian Dollar', value: 'CAD' },
  { label: 'Czech Koruna', value: 'CZK' },
  { label: 'Danish Krone', value: 'DKK' },
  { label: 'Euro', value: 'EUR' },
  { label: 'United States Dollar', value: 'USD' },
];

const operationWhen = (resource, operationKey, operations, uiExtra = {}, n8nExtra = {}) => ({
  showWhen: {
    resource: [resource],
    [operationKey]: Array.isArray(operations) ? operations : [operations],
    ...uiExtra,
  },
  n8nShowWhen: {
    resource: [resource],
    operation: Array.isArray(operations) ? operations : [operations],
    ...n8nExtra,
  },
});

const payPalCredentialFields = [
  { key: 'clientId', n8nKey: 'clientId', label: 'Client ID', kind: 'text', value: '', required: false },
  { key: 'secret', n8nKey: 'secret', label: 'Secret', kind: 'text', value: '', required: false, password: true },
  {
    key: 'env', n8nKey: 'env', label: 'Environment', kind: 'select', sourceKind: 'options', value: 'live', required: false,
    options: [{ label: 'Sandbox', value: 'sanbox' }, { label: 'Live', value: 'live' }],
  },
];

const payPal = {
  type: 'paypal',
  n8nType: 'n8n-nodes-base.payPal',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'PayPal',
  defaultName: 'PayPal',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Consume PayPal API',
  category: 'action',
  categories: ['Finance & Accounting', 'Sales'],
  group: ['output'],
  defaults: { name: 'PayPal' },
  inputs: ['main'],
  outputs: ['main'],
  aiConnectorPorts: [],
  usableAsTool: false,
  icon: '/node-icons/paypal.svg',
  n8nIcon: 'file:paypal.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 60, height: 60 },
  iconAssetSha256: 'e32fcd8f9e278e3d113c2ce49215c05fa7947283dca483788ecbcce44468917d',
  sourceIconAssetSha256: 'e32fcd8f9e278e3d113c2ce49215c05fa7947283dca483788ecbcce44468917d',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.paypal/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/paypal/',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/PayPal/PayPal.node.ts',
    descriptionPath: 'packages/nodes-base/nodes/PayPal/PaymentDescription.ts',
    interfacePath: 'packages/nodes-base/nodes/PayPal/PaymentInteface.ts',
    metadataPath: 'packages/nodes-base/nodes/PayPal/PayPal.node.json',
    credentialPath: 'packages/nodes-base/credentials/PayPalApi.credentials.ts',
    helperPath: 'packages/nodes-base/nodes/PayPal/GenericFunctions.ts',
    iconPath: 'packages/nodes-base/nodes/PayPal/paypal.svg',
    excludedTriggerPath: 'packages/nodes-base/nodes/PayPal/PayPalTrigger.node.ts',
  },
  resources: [
    { value: 'payout', defaultOperation: 'create', operations: payoutOperations.map(({ value }) => value) },
    { value: 'payoutItem', defaultOperation: 'get', operations: payoutItemOperations.map(({ value }) => value) },
  ],
  credentialRequirements: [
    {
      type: 'payPalApi', name: 'PayPal API', required: true, inert: true, testedBy: 'payPalApiTest',
      documentationUrl: 'paypal', authentication: 'OAuth 2.0 client credentials', fields: payPalCredentialFields,
      credentialTest: {
        method: 'POST',
        sandboxBaseUrl: 'https://api-m.sandbox.paypal.com',
        liveBaseUrl: 'https://api-m.paypal.com',
        path: '/v1/oauth2/token',
        grantType: 'client_credentials',
        clientAuthentication: 'Basic base64(clientId:secret)',
        inert: true,
      },
    },
  ],
  credentialUiMetadata: [
    {
      key: 'payPalApiCredential', type: 'payPalApi', label: 'PayPal API', testedBy: 'payPalApiTest',
      fields: payPalCredentialFields, renderedInCredentialEditor: false, inert: true,
    },
  ],
  params: [
    {
      key: 'payPalApiCredential', n8nKey: 'credentials.payPalApi', label: 'Credential to connect with',
      kind: 'select', sourceKind: 'credentials', value: 'payPalApi', required: true, locked: true, dynamic: true,
      options: [{ label: 'PayPal API', value: 'payPalApi' }], simulationNote: lockedCredentialNote,
    },
    {
      key: 'resource', n8nKey: 'resource', label: 'Resource', kind: 'select', sourceKind: 'options', value: 'payout', required: false,
      noDataExpression: true, options: [{ label: 'Payout', value: 'payout' }, { label: 'Payout Item', value: 'payoutItem' }],
    },
    {
      key: 'payoutOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'create', required: false,
      noDataExpression: true, showWhen: { resource: ['payout'] }, options: payoutOperations,
    },
    {
      key: 'payoutItemOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'get', required: false,
      noDataExpression: true, showWhen: { resource: ['payoutItem'] }, options: payoutItemOperations,
    },
    {
      key: 'payoutCreateSenderBatchId', n8nKey: 'senderBatchId', label: 'Sender Batch ID', kind: 'text', value: '', required: true,
      description: 'A sender-specified ID number. Tracks the payout in an accounting system.',
      ...operationWhen('payout', 'payoutOperation', 'create'),
    },
    {
      key: 'payoutCreateJsonParameters', n8nKey: 'jsonParameters', label: 'JSON Parameters', kind: 'boolean', value: false, required: false,
      ...operationWhen('payout', 'payoutOperation', 'create'),
    },
    {
      key: 'payoutCreateItemsUi', n8nKey: 'itemsUi', label: 'Items', kind: 'fixedCollection', sourceKind: 'fixedCollection',
      value: {}, required: false, multiple: true, collectionKey: 'itemsValues', collectionLabel: 'Item', addLabel: 'Add Item',
      ...operationWhen('payout', 'payoutOperation', 'create', { payoutCreateJsonParameters: [false] }, { jsonParameters: [false] }),
      fields: [
        {
          key: 'payoutCreateRecipientType', n8nKey: 'recipientType', label: 'Recipient Type', kind: 'select', sourceKind: 'options',
          value: 'email', required: false, options: recipientTypeOptions,
          description: 'The ID type that identifies the recipient of the payment',
        },
        {
          key: 'payoutCreateReceiverValue', n8nKey: 'receiverValue', label: 'Receiver Value', kind: 'text', value: '', required: true,
          description: 'The receiver of the payment. Corresponds to the recipient_type value in the request. Max length: 127 characters.',
        },
        {
          key: 'payoutCreateCurrency', n8nKey: 'currency', label: 'Currency', kind: 'select', sourceKind: 'options',
          value: 'USD', required: false, options: currencyOptions,
        },
        {
          key: 'payoutCreateAmount', n8nKey: 'amount', label: 'Amount', kind: 'text', value: '', required: true,
          description: 'The value, which might be',
        },
        {
          key: 'payoutCreateItemNote', n8nKey: 'note', label: 'Note', kind: 'text', value: '', required: false,
          description: 'The sender-specified note for notifications. Supports up to 4000 ASCII characters and 1000 non-ASCII characters.',
        },
        {
          key: 'payoutCreateSenderItemId', n8nKey: 'senderItemId', label: 'Sender Item ID', kind: 'text', value: '', required: false,
          description: 'The sender-specified ID number. Tracks the payout in an accounting system.',
        },
        {
          key: 'payoutCreateRecipientWallet', n8nKey: 'recipientWallet', label: 'Recipient Wallet', kind: 'select', sourceKind: 'options',
          value: 'paypal', required: false,
          options: [
            { label: 'PayPal', value: 'paypal', description: 'PayPal Wallet' },
            { label: 'Venmo', value: 'venmo', description: 'Venmo Wallet' },
          ],
        },
      ],
    },
    {
      key: 'payoutCreateItemsJson', n8nKey: 'itemsJson', label: 'Items', kind: 'textarea', sourceKind: 'json', value: '', required: false,
      rows: 8, alwaysOpenEditWindow: true, description: 'An array of individual payout items',
      ...operationWhen('payout', 'payoutOperation', 'create', { payoutCreateJsonParameters: [true] }, { jsonParameters: [true] }),
    },
    {
      key: 'payoutCreateAdditionalFields', n8nKey: 'additionalFields', label: 'Additional Fields', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Field', ...operationWhen('payout', 'payoutOperation', 'create'),
      fields: [
        {
          key: 'payoutCreateEmailSubject', n8nKey: 'emailSubject', label: 'Email Subject', kind: 'text', value: '', required: false,
          description: 'The subject line for the email that PayPal sends when payment for a payout item completes. The subject line is the same for all recipients. Max length: 255 characters.',
        },
        {
          key: 'payoutCreateEmailMessage', n8nKey: 'emailMessage', label: 'Email Message', kind: 'text', value: '', required: false,
          description: 'The email message that PayPal sends when the payout item completes. The message is the same for all recipients.',
        },
        {
          key: 'payoutCreateBatchNote', n8nKey: 'note', label: 'Note', kind: 'text', value: '', required: false,
          description: 'The payouts and item-level notes are concatenated in the email. Max length: 1000 characters.',
        },
      ],
    },
    {
      key: 'payoutGetBatchId', n8nKey: 'payoutBatchId', label: 'Payout Batch ID', kind: 'text', value: '', required: true,
      description: 'The ID of the payout for which to show details', ...operationWhen('payout', 'payoutOperation', 'get'),
    },
    {
      key: 'payoutGetReturnAll', n8nKey: 'returnAll', label: 'Return All', kind: 'boolean', value: false, required: false,
      description: 'Whether to return all results or only up to a given limit', ...operationWhen('payout', 'payoutOperation', 'get'),
    },
    {
      key: 'payoutGetLimit', n8nKey: 'limit', label: 'Limit', kind: 'number', value: 100, required: false, min: 1, max: 1000,
      description: 'Max number of results to return',
      ...operationWhen('payout', 'payoutOperation', 'get', { payoutGetReturnAll: [false] }, { returnAll: [false] }),
    },
    {
      key: 'payoutItemGetId', n8nKey: 'payoutItemId', label: 'Payout Item ID', kind: 'text', value: '', required: true,
      description: 'The ID of the payout item for which to show details', ...operationWhen('payoutItem', 'payoutItemOperation', 'get'),
    },
    {
      key: 'payoutItemCancelId', n8nKey: 'payoutItemId', label: 'Payout Item ID', kind: 'text', value: '', required: true,
      description: 'The ID of the payout item to cancel', ...operationWhen('payoutItem', 'payoutItemOperation', 'cancel'),
    },
  ],
  resourceOperationParity: {
    payout: { expected: ['create', 'get'], represented: payoutOperations.map(({ value }) => value), default: 'create' },
    payoutItem: { expected: ['cancel', 'get'], represented: payoutItemOperations.map(({ value }) => value), default: 'get' },
  },
  operationCount: 4,
  versionBranches: [{ versions: 1, implementation: 'PayPal', representedInCurrentParams: true }],
  docsSummary: {
    operations: { payout: payoutOperations.map(({ value }) => value), payoutItem: payoutItemOperations.map(({ value }) => value) },
    currentDocsParity: true,
    authentication: 'API client and secret',
    environmentsDocumented: ['Live', 'Sandbox'],
    aiToolDocumented: false,
  },
  platformGaps: [
    'The native node reuses operation and payoutItemId across conditional branches. Unique UI keys keep each branch stable while n8nKey preserves the real parameter name.',
    'The native itemsJson JSON editor is normalized to a supported textarea. Its empty-string default and always-open editor metadata are preserved, but JSON validation never runs.',
    'The PayPal credential source labels its sandbox option “Sandbox” but stores the literal value “sanbox”. That pinned value is preserved exactly for saved-configuration parity; the official credential guide documents the environment as Sandbox.',
    'Credential editing and payPalApiTest are metadata-only. Client ID and secret access, Basic-header encoding, OAuth token exchange, and connection testing never run.',
    'Payout creation, batch lookup, pagination, payout-item lookup, cancellation, response shaping, error handling, and all PayPal API requests are unavailable.',
    'The sibling PayPal Trigger node is excluded. This descriptor represents only the action node and exposes no trigger or webhook runtime.',
    'The pinned action node does not declare usableAsTool, so usableAsTool is false and no AI-tool connector or runtime is exposed.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials.payPalApi', sourceType: 'credentials', normalizedKind: 'locked select', reason: 'Credential discovery and credential editors are unavailable.' },
    { n8nKey: 'itemsJson', sourceType: 'json', normalizedKind: 'textarea', reason: 'The catalog renderer has no native JSON editor control.' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    credentialEncoding: false,
    authentication: false,
    tokenExchange: false,
    apiRequests: false,
    networkAccess: false,
    payoutCreate: false,
    payoutRead: false,
    payoutPagination: false,
    payoutItemRead: false,
    payoutItemCancel: false,
    jsonValidation: false,
    expressionEvaluation: false,
    toolExecution: false,
    voice: false,
  },
  output: {},
};

export default payPal;
