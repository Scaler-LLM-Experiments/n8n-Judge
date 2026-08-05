// Editor-only descriptor for n8n's TOTP v1 node. Credential secrets, hashing,
// clock access, token generation, and remaining-time calculation remain inert.

const operationOptions = [
  { label: 'Generate Secret', value: 'generateSecret', action: 'Generate secret' },
];

const algorithmOptions = [
  { label: 'SHA1', value: 'SHA1' },
  { label: 'SHA224', value: 'SHA224' },
  { label: 'SHA256', value: 'SHA256' },
  { label: 'SHA3-224', value: 'SHA3-224' },
  { label: 'SHA3-256', value: 'SHA3-256' },
  { label: 'SHA3-384', value: 'SHA3-384' },
  { label: 'SHA3-512', value: 'SHA3-512' },
  { label: 'SHA384', value: 'SHA384' },
  { label: 'SHA512', value: 'SHA512' },
];

const lockedCredentialNote =
  'This selector is locked. The simulation never reads, creates, tests, validates, or applies a TOTP credential.';

const totp = {
  type: 'totp',
  n8nType: 'n8n-nodes-base.totp',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'TOTP',
  defaultName: 'TOTP',
  subtitle: '={{ $parameter["operation"] }}',
  description: 'Generate a time-based one-time password',
  details:
    'Configure the hashing algorithm, token length, and validity period for a TOTP credential. This catalog entry only models authoring metadata.',
  category: 'core',
  categories: ['Core Nodes'],
  subcategory: 'Helpers',
  subcategories: ['Helpers'],
  group: ['transform'],
  inputs: ['main'],
  outputs: ['main'],
  usableAsTool: true,
  icon: '/node-icons/totp.svg',
  n8nIcon: 'node:totp',
  iconMode: 'currentColor',
  iconColor: 'black',
  aliases: ['2FA', 'MFA', 'authentication', 'Security', 'OTP', 'password', 'multi', 'factor'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.totp/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/totp/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Totp/Totp.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Totp/Totp.node.json',
    credentialPath: 'packages/nodes-base/credentials/TotpApi.credentials.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/totp.svg',
  },
  defaults: { name: 'TOTP' },
  credentialRequirements: [
    {
      type: 'totpApi',
      name: 'TOTP API',
      required: true,
      inert: true,
      fields: [
        {
          key: 'totpCredentialSecret',
          n8nKey: 'secret',
          label: 'Secret',
          kind: 'text',
          value: '',
          required: true,
          password: true,
          placeholder: 'e.g. BVDRSBXQB2ZEL5HE',
          description:
            'Secret key encoded in the QR code during setup. <a href="https://github.com/google/google-authenticator/wiki/Key-Uri-Format#secret">Learn more</a>.',
          simulationNote:
            'This field documents the credential shape only. No secret is entered, revealed, read, decoded, or used.',
        },
        {
          key: 'totpCredentialLabel',
          n8nKey: 'label',
          label: 'Label',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. GitHub:john-doe',
          description:
            'Identifier for the TOTP account, in the <code>issuer:username</code> format. <a href="https://github.com/google/google-authenticator/wiki/Key-Uri-Format#label">Learn more</a>.',
          simulationNote:
            'The label is credential-shape metadata only and is never split, URI-decoded, or validated.',
        },
      ],
    },
  ],
  params: [
    {
      key: 'totpCredential',
      n8nKey: 'credentials.totpApi',
      label: 'Credential to connect with',
      kind: 'select',
      sourceKind: 'credentials',
      value: 'totpApi',
      required: true,
      locked: true,
      options: [{ label: 'TOTP API', value: 'totpApi' }],
      simulationNote: lockedCredentialNote,
    },
    {
      key: 'operation',
      label: 'Operation',
      kind: 'select',
      value: 'generateSecret',
      required: false,
      noDataExpression: true,
      options: operationOptions,
    },
    {
      key: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { operation: ['generateSecret'] },
      fields: [
        {
          key: 'algorithm',
          label: 'Algorithm',
          kind: 'select',
          value: 'SHA1',
          required: false,
          options: algorithmOptions,
          description: 'HMAC hashing algorithm. Defaults to SHA1.',
          simulationNote:
            'The algorithm name remains metadata and never selects or invokes a hash function.',
        },
        {
          key: 'digits',
          label: 'Digits',
          kind: 'number',
          value: 6,
          required: false,
          description: 'Number of digits in the generated TOTP code. Defaults to 6 digits.',
          simulationNote: 'No token is generated, padded, truncated, or formatted.',
        },
        {
          key: 'period',
          label: 'Period',
          kind: 'number',
          value: 30,
          required: false,
          description:
            'How many seconds the generated TOTP code is valid for. Defaults to 30 seconds.',
          simulationNote:
            'The period is stored as a number but never compared with the system clock.',
        },
      ],
    },
  ],
  operationParity: {
    expected: ['generateSecret'],
    represented: operationOptions.map(({ value }) => value),
    default: 'generateSecret',
  },
  optionParity: {
    algorithm: {
      expected: [
        'SHA1',
        'SHA224',
        'SHA256',
        'SHA3-224',
        'SHA3-256',
        'SHA3-384',
        'SHA3-512',
        'SHA384',
        'SHA512',
      ],
      represented: algorithmOptions.map(({ value }) => value),
      default: 'SHA1',
    },
    digits: { default: 6, sourceConstraints: [] },
    period: { default: 30, unit: 'seconds', sourceConstraints: [] },
  },
  credentialParity: {
    type: 'totpApi',
    required: true,
    fields: ['secret', 'label'],
    secretRequired: true,
    labelRequiredBySourceSchema: false,
  },
  docsSummary: {
    purpose: 'TOTP normally generates a time-based one-time password using the current time.',
    credentialMethod: 'The credential uses a Base32 secret and an optional account label.',
    labelFormat:
      'A label can use issuer:username format; the pinned runtime rejects a non-empty label without a colon.',
    sourceDocsDifference:
      'The credential documentation lists Secret and Label as setup inputs, while the pinned credential schema marks only Secret as required.',
  },
  platformGaps: [
    'The credential selector is locked and its Secret and Label fields describe schema only; no credential material is available to the simulation.',
    'Algorithm, Digits, and Period retain the direct source defaults. The source defines no numeric minimum or maximum for Digits or Period, so none are invented.',
    'Issuer extraction, label validation, HMAC selection, current-time calculation, token generation, seconds-remaining calculation, and per-item output are never performed.',
  ],
  unsupportedVisibleTypes: [],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    secretAccess: false,
    decodesSecrets: false,
    validatesLabels: false,
    extractsIssuer: false,
    cryptography: false,
    hashing: false,
    readsSystemClock: false,
    generatesOtp: false,
    calculatesSecondsRemaining: false,
    mapsInputItems: false,
    workflowExecution: false,
    networkAccess: false,
    voice: false,
  },
  output: {},
};

export default totp;
