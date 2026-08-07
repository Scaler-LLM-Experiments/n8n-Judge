// Editor-only descriptor for n8n's Google Sheets v4.7 action node.
// Credentials, remote discovery, schema mapping, API calls, binary data, and tool execution stay inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This credential selector is locked. The simulation never creates, reads, tests, refreshes, signs, or applies Google credentials.';
const lockedLookupNote =
  'The native Google list search is preserved as metadata but disabled. List mode remains empty; URL, ID, and name values remain inert authoring values.';
const lockedSchemaNote =
  'Google Sheet columns normally load from the selected sheet. The schema list remains empty and editable mapping rows are inert authoring data only.';

const driveFileUrlRegex =
  'https:\\/\\/(?:drive|docs)\\.google\\.com(?:\\/.*|)\\/d\\/([0-9a-zA-Z\\-_]+)(?:\\/.*|)';
const sheetUrlRegex =
  'https:\\/\\/docs\\.google\\.com\\/spreadsheets\\/d\\/[0-9a-zA-Z\\-_]+.*\\#gid=([0-9]+)';
const driveFileIdRegex = '[a-zA-Z0-9\\-_]{2,}';
const sheetIdRegex = '((gid=)?[0-9]{1,})';

const resourceOptions = [
  { label: 'Document', value: 'spreadsheet' },
  { label: 'Sheet Within Document', value: 'sheet' },
];

const sheetOperations = [
  { label: 'Append or Update Row', value: 'appendOrUpdate', description: 'Append a new row or update an existing one (upsert)', action: 'Append or update row in sheet' },
  { label: 'Append Row', value: 'append', description: 'Create a new row in a sheet', action: 'Append row in sheet' },
  { label: 'Clear', value: 'clear', description: 'Delete all the contents or a part of a sheet', action: 'Clear sheet' },
  { label: 'Create', value: 'create', description: 'Create a new sheet', action: 'Create sheet' },
  { label: 'Delete', value: 'remove', description: 'Permanently delete a sheet', action: 'Delete sheet' },
  { label: 'Delete Rows or Columns', value: 'delete', description: 'Delete columns or rows from a sheet', action: 'Delete rows or columns from sheet' },
  { label: 'Get Row(s)', value: 'read', description: 'Retrieve one or more rows from a sheet', action: 'Get row(s) in sheet' },
  { label: 'Update Row', value: 'update', description: 'Update an existing row in a sheet', action: 'Update row in sheet' },
];

const spreadsheetOperations = [
  { label: 'Create', value: 'create', description: 'Create a spreadsheet', action: 'Create spreadsheet' },
  { label: 'Delete', value: 'deleteSpreadsheet', description: 'Delete a spreadsheet', action: 'Delete spreadsheet' },
];

const mappingModeOptions = [
  { label: 'Map Each Column Manually', value: 'defineBelow', description: 'Set the value for each column' },
  { label: 'Map Automatically', value: 'autoMapInputData', description: 'Look for incoming data that matches the columns in Google Sheets' },
];

const cellFormatOptions = [
  { label: 'Let Google Sheets format', value: 'USER_ENTERED', description: 'Cells are styled as if you typed the values into Google Sheets directly' },
  { label: 'Let n8n format', value: 'RAW', description: 'Cells have the same types as the input data' },
];

const handlingExtraDataOptions = [
  { label: 'Insert in New Column(s)', value: 'insertInNewColumn', description: 'Create a new column for extra data' },
  { label: 'Ignore Them', value: 'ignoreIt', description: 'Ignore extra data' },
  { label: 'Error', value: 'error', description: 'Throw an error' },
];

const regionOptions = [
  ['Global (multi-region) - global', 'global'],
  ['EU (multi-region) - eu', 'eu'],
  ['US (multi-region) - us', 'us'],
  ['Africa (Johannesburg) - africa-south1', 'africa-south1'],
  ['Asia Pacific (Changhua County) - asia-east1', 'asia-east1'],
  ['Asia Pacific (Hong Kong) - asia-east2', 'asia-east2'],
  ['Asia Pacific (Tokyo) - asia-northeast1', 'asia-northeast1'],
  ['Asia Pacific (Osaka) - asia-northeast2', 'asia-northeast2'],
  ['Asia Pacific (Seoul) - asia-northeast3', 'asia-northeast3'],
  ['Asia Pacific (Mumbai) - asia-south1', 'asia-south1'],
  ['Asia Pacific (Delhi) - asia-south2', 'asia-south2'],
  ['Asia Pacific (Jurong West) - asia-southeast1', 'asia-southeast1'],
  ['Asia Pacific (Jakarta) - asia-southeast2', 'asia-southeast2'],
  ['Asia Pacific (Sydney) - australia-southeast1', 'australia-southeast1'],
  ['Asia Pacific (Melbourne) - australia-southeast2', 'australia-southeast2'],
  ['Europe (Warsaw) - europe-central2', 'europe-central2'],
  ['Europe (Hamina) - europe-north1', 'europe-north1'],
  ['Europe (Madrid) - europe-southwest1', 'europe-southwest1'],
  ["Europe (St. Ghislain) - europe-west1", 'europe-west1'],
  ['Europe (Berlin) - europe-west10', 'europe-west10'],
  ['Europe (Turin) - europe-west12', 'europe-west12'],
  ['Europe (London) - europe-west2', 'europe-west2'],
  ['Europe (Frankfurt) - europe-west3', 'europe-west3'],
  ['Europe (Eemshaven) - europe-west4', 'europe-west4'],
  ['Europe (Zurich) - europe-west6', 'europe-west6'],
  ['Europe (Milan) - europe-west8', 'europe-west8'],
  ['Europe (Paris) - europe-west9', 'europe-west9'],
  ['Middle East (Doha) - me-central1', 'me-central1'],
  ['Middle East (Dammam) - me-central2', 'me-central2'],
  ['Middle East (Tel Aviv) - me-west1', 'me-west1'],
  ['Americas (Montréal) - northamerica-northeast1', 'northamerica-northeast1'],
  ['Americas (Toronto) - northamerica-northeast2', 'northamerica-northeast2'],
  ['Americas (Queretaro) - northamerica-south1', 'northamerica-south1'],
  ['Americas (Osasco) - southamerica-east1', 'southamerica-east1'],
  ['Americas (Santiago) - southamerica-west1', 'southamerica-west1'],
  ['Americas (Council Bluffs) - us-central1', 'us-central1'],
  ['Americas (Moncks Corner) - us-east1', 'us-east1'],
  ['Americas (Ashburn) - us-east4', 'us-east4'],
  ['Americas (Columbus) - us-east5', 'us-east5'],
  ['Americas (Dallas) - us-south1', 'us-south1'],
  ['Americas (The Dalles) - us-west1', 'us-west1'],
  ['Americas (Los Angeles) - us-west2', 'us-west2'],
  ['Americas (Salt Lake City) - us-west3', 'us-west3'],
  ['Americas (Las Vegas) - us-west4', 'us-west4'],
].map(([label, value]) => ({ label, value }));

const operationWhen = (resource, operationKey, operations, uiExtra = {}, n8nExtra = {}) => ({
  showWhen: { resource: [resource], [operationKey]: Array.isArray(operations) ? operations : [operations], ...uiExtra },
  n8nShowWhen: { resource: [resource], operation: Array.isArray(operations) ? operations : [operations], ...n8nExtra },
});

const sheetWhen = (operation, uiExtra = {}, n8nExtra = {}) =>
  operationWhen('sheet', 'sheetOperation', operation, uiExtra, n8nExtra);

const documentLocator = (key, showWhen, n8nShowWhen) => ({
  key,
  n8nKey: 'documentId',
  label: 'Document',
  kind: 'resourceLocator',
  sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' },
  sourceDefault: { mode: 'list', value: '' },
  required: true,
  locked: true,
  dynamic: true,
  modes: ['list', 'url', 'id'],
  modeOptions: [
    { label: 'From List', value: 'list', kind: 'list', searchListMethod: 'spreadSheetsSearch', searchable: true },
    {
      label: 'By URL', value: 'url', kind: 'text',
      extractValue: { type: 'regex', regex: driveFileUrlRegex },
      validation: { type: 'regex', regex: driveFileUrlRegex, errorMessage: 'Not a valid Google Drive File URL' },
    },
    {
      label: 'By ID', value: 'id', kind: 'text',
      validation: { type: 'regex', regex: driveFileIdRegex, errorMessage: 'Not a valid Google Drive File ID' },
      url: '=https://docs.google.com/spreadsheets/d/{{$value}}/edit',
    },
  ],
  options: [],
  showWhen,
  n8nShowWhen,
  builderHint: {
    propertyHint:
      "Default to mode: 'list', which gives users the From-list picker. Use mode: 'id' only for a concrete supplied spreadsheet ID. Never invent a spreadsheet ID.",
  },
  simulationNote: lockedLookupNote,
});

const sheetLocator = {
  key: 'sheetName',
  n8nKey: 'sheetName',
  label: 'Sheet',
  kind: 'resourceLocator',
  sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' },
  sourceDefault: { mode: 'list', value: '' },
  required: true,
  locked: true,
  dynamic: true,
  loadOptionsDependsOn: ['documentId.value'],
  modes: ['list', 'url', 'id', 'name'],
  modeOptions: [
    { label: 'From List', value: 'list', kind: 'list', searchListMethod: 'sheetsSearch', searchable: false },
    {
      label: 'By URL', value: 'url', kind: 'text',
      extractValue: { type: 'regex', regex: sheetUrlRegex },
      validation: { type: 'regex', regex: sheetUrlRegex, errorMessage: 'Not a valid Sheet URL' },
    },
    { label: 'By ID', value: 'id', kind: 'text', validation: { type: 'regex', regex: sheetIdRegex, errorMessage: 'Not a valid Sheet ID' } },
    { label: 'By Name', value: 'name', kind: 'text', placeholder: 'Sheet1' },
  ],
  options: [],
  showWhen: { resource: ['sheet'], sheetOperation: ['append', 'appendOrUpdate', 'clear', 'delete', 'read', 'remove', 'update'] },
  n8nShowWhen: { resource: ['sheet'], operation: ['append', 'appendOrUpdate', 'clear', 'delete', 'read', 'remove', 'update'] },
  builderHint: {
    propertyHint:
      "Use mode: 'list' for a real numeric sheet ID. If only the sheet title is known, use mode: 'name'. Never put a title in list or id mode.",
  },
  simulationNote: lockedLookupNote,
};

const locationDefineFields = (prefix, includeFirstDataRow = true) => ({
  key: `${prefix}LocationDefine`,
  n8nKey: 'locationDefine',
  label: 'Data Location on Sheet',
  kind: 'fixedCollection',
  sourceKind: 'fixedCollection',
  value: { values: {} },
  required: false,
  collectionKey: 'values',
  collectionLabel: 'Values',
  multiple: false,
  addLabel: 'Select Range',
  fields: [
    { key: `${prefix}HeaderRow`, n8nKey: 'headerRow', label: 'Header Row', kind: 'number', value: 1, required: false, min: 1, description: "Index is relative to the set 'Range', first row index is 1", hint: 'Index of the row which contains the column names' },
    ...(includeFirstDataRow
      ? [{ key: `${prefix}FirstDataRow`, n8nKey: 'firstDataRow', label: 'First Data Row', kind: 'number', value: 2, required: false, min: 1, description: "Index is relative to the set 'Range', first row index is 1", hint: 'Index of first row which contains the actual data' }]
      : []),
  ],
});

const columnsMapper = (key, operation, mode) => {
  const needsMatch = mode === 'upsert' || mode === 'update';
  const builderHint = needsMatch
    ? "Pass the full resourceMapper object: { mappingMode, value, schema, matchingColumns }. matchingColumns is required and must contain sheet header names."
    : "Pass the full resourceMapper object: { mappingMode, value, schema }. Do not add matchingColumns to the append operation.";
  return {
    key,
    n8nKey: 'columns',
    label: 'Columns',
    kind: 'collection',
    sourceKind: 'resourceMapper',
    value: { [`${key}MappingMode`]: 'defineBelow' },
    sourceDefault: { mappingMode: 'defineBelow', value: null },
    required: true,
    noDataExpression: true,
    dynamicSchema: true,
    locked: true,
    loadOptionsDependsOn: ['sheetName.value'],
    resourceMapperConfig: {
      method: 'getMappingColumns', mode, fieldWords: { singular: 'column', plural: 'columns' },
      addAllFields: true, multiKeyMatch: false, ...(needsMatch ? { allowEmptyValues: true } : {}),
    },
    sourceVersionCondition: '@version >= 4.7',
    ...sheetWhen(operation),
    n8nHideWhen: { sheetName: [''] },
    fields: [
      {
        key: `${key}MappingMode`, n8nKey: 'mappingMode', label: 'Mapping Column Mode', kind: 'select', value: 'defineBelow', required: false,
        options: mappingModeOptions,
      },
      ...(needsMatch
        ? [{
            key: `${key}MatchingColumns`, n8nKey: 'matchingColumns', label: 'Column to match on', kind: 'multiSelect', value: [], required: true,
            options: [], locked: true, dynamic: true,
            description: 'The column to compare when finding the rows to update. Usually an ID.',
            simulationNote: lockedSchemaNote,
          }]
        : []),
      {
        key: `${key}Values`, n8nKey: 'value', label: mode === 'update' ? 'Values to Update' : 'Values to Send',
        kind: 'fixedCollection', value: { fields: [] }, required: false, multiple: true, dynamicSchema: true, locked: true,
        collectionKey: 'fields', collectionLabel: 'Column', addLabel: 'Add Column',
        showWhen: { [`${key}MappingMode`]: ['defineBelow'] }, n8nShowWhen: { mappingMode: ['defineBelow'] },
        fields: [
          { key: `${key}Column`, n8nKey: 'column', label: 'Column', kind: 'text', value: '', required: true, placeholder: 'Loaded from the selected sheet' },
          { key: `${key}Value`, n8nKey: 'value', label: 'Value', kind: 'text', value: '', required: false, expressionAllowed: true },
        ],
        simulationNote: lockedSchemaNote,
      },
      {
        key: `${key}Schema`, n8nKey: 'schema', label: 'Column Schema', kind: 'fixedCollection', value: { fields: [] }, required: false,
        multiple: true, dynamicSchema: true, locked: true, collectionKey: 'fields', collectionLabel: 'Column', addLabel: 'Add Schema Column',
        fields: [
          { key: `${key}SchemaId`, n8nKey: 'id', label: 'ID', kind: 'text', value: '', required: true },
          { key: `${key}SchemaDisplayName`, n8nKey: 'displayName', label: 'Display Name', kind: 'text', value: '', required: true },
          { key: `${key}SchemaRequired`, n8nKey: 'required', label: 'Required', kind: 'boolean', value: false, required: false },
          { key: `${key}SchemaDefaultMatch`, n8nKey: 'defaultMatch', label: 'Default Match', kind: 'boolean', value: false, required: false },
          { key: `${key}SchemaDisplay`, n8nKey: 'display', label: 'Display', kind: 'boolean', value: true, required: false },
          { key: `${key}SchemaType`, n8nKey: 'type', label: 'Type', kind: 'select', value: 'string', required: false, options: [{ label: 'String', value: 'string' }, { label: 'Number', value: 'number' }] },
          { key: `${key}SchemaCanMatch`, n8nKey: 'canBeUsedToMatch', label: 'Can Be Used to Match', kind: 'boolean', value: true, required: false },
        ],
        simulationNote: lockedSchemaNote,
      },
    ],
    builderHint: { propertyHint: builderHint },
    simulationNote: lockedSchemaNote,
  };
};

const appendLikeOptions = (key, operation, includeUseAppend) => ({
  key,
  n8nKey: 'options',
  label: 'Options',
  kind: 'collection',
  sourceKind: 'collection',
  value: {},
  required: false,
  addLabel: 'Add option',
  ...sheetWhen(operation),
  n8nHideWhen: { sheetName: [''] },
  fields: [
    { key: `${key}CellFormat`, n8nKey: 'cellFormat', label: 'Cell Format', kind: 'select', value: 'USER_ENTERED', required: false, options: cellFormatOptions, description: 'Determines how data should be interpreted' },
    locationDefineFields(key, operation !== 'append'),
    {
      key: `${key}HandlingExtraData`, n8nKey: 'handlingExtraData', label: 'Handling extra fields in input', kind: 'select',
      value: 'insertInNewColumn', required: false, options: handlingExtraDataOptions,
      showWhen: { [`${operation}Columns.${operation}ColumnsMappingMode`]: ['autoMapInputData'] }, n8nShowWhen: { '/columns.mappingMode': ['autoMapInputData'] },
      description: "What do to with fields that don't match any columns in the Google Sheet",
    },
    ...(includeUseAppend
      ? [{ key: `${key}UseAppend`, n8nKey: 'useAppend', label: 'Minimise API Calls', kind: 'boolean', value: false, required: false, hint: 'Use if your sheet has no gaps between rows or columns', description: 'Whether to use append instead of update(default), this is more efficient but in some cases data might be misaligned' }]
      : []),
  ],
});

const oauthFields = [
  { key: 'oauthGrantType', n8nKey: 'grantType', label: 'Grant Type', kind: 'hidden', value: 'authorizationCode', required: false, inheritedFrom: 'googleOAuth2Api' },
  { key: 'oauthAuthUrl', n8nKey: 'authUrl', label: 'Authorization URL', kind: 'hidden', value: 'https://accounts.google.com/o/oauth2/v2/auth', required: false, inheritedFrom: 'googleOAuth2Api' },
  { key: 'oauthAccessTokenUrl', n8nKey: 'accessTokenUrl', label: 'Access Token URL', kind: 'hidden', value: 'https://oauth2.googleapis.com/token', required: false, inheritedFrom: 'googleOAuth2Api' },
  { key: 'oauthAuthQueryParameters', n8nKey: 'authQueryParameters', label: 'Auth URI Query Parameters', kind: 'hidden', value: 'access_type=offline&prompt=consent', required: false, inheritedFrom: 'googleOAuth2Api' },
  { key: 'oauthAuthentication', n8nKey: 'authentication', label: 'Authentication', kind: 'hidden', value: 'body', required: false, inheritedFrom: 'googleOAuth2Api' },
  { key: 'oauthCustomScopes', n8nKey: 'customScopes', label: 'Custom Scopes', kind: 'boolean', value: false, required: false, description: 'Define custom scopes' },
  { key: 'oauthCustomScopesNotice', n8nKey: 'customScopesNotice', label: 'The default scopes needed for the node to work are already set, If you change these the node may not function correctly.', kind: 'notice', value: '', required: false, showWhen: { oauthCustomScopes: [true] }, n8nShowWhen: { customScopes: [true] } },
  { key: 'oauthEnabledScopes', n8nKey: 'enabledScopes', label: 'Enabled Scopes', kind: 'text', value: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata', required: false, showWhen: { oauthCustomScopes: [true] }, n8nShowWhen: { customScopes: [true] }, description: 'Scopes that should be enabled' },
  { key: 'oauthScope', n8nKey: 'scope', label: 'Scope', kind: 'hidden', value: '={{$self["customScopes"] ? $self["enabledScopes"] : "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata"}}', required: false },
  { key: 'oauthHostedNotice', n8nKey: 'notice', label: 'Make sure you enabled the following APIs & Services in the Google Cloud Console: Google Drive API, Google Sheets API. More info.', kind: 'notice', value: '', required: false, sourceShowOnDeployment: 'hosted' },
];

const serviceAccountFields = [
  { key: 'serviceRegion', n8nKey: 'region', label: 'Region', kind: 'select', value: 'global', required: false, options: regionOptions, description: 'The region where the Google Cloud service is located. This applies only to specific nodes, like the Google Vertex Chat Model' },
  { key: 'serviceEmail', n8nKey: 'email', label: 'Service Account Email', kind: 'text', value: '', required: true, placeholder: 'name@email.com', description: 'The Google Service account similar to user-808@project.iam.gserviceaccount.com' },
  { key: 'servicePrivateKey', n8nKey: 'privateKey', label: 'Private Key', kind: 'textarea', value: '', required: true, password: true, rows: 4, placeholder: '-----BEGIN PRIVATE KEY-----\nXIYEvQIBADANBg<...>0IhA7TMoGYPQc=\n-----END PRIVATE KEY-----\n', description: 'Enter the private key located in the JSON file downloaded from Google Cloud Console' },
  { key: 'serviceImpersonate', n8nKey: 'inpersonate', label: 'Impersonate a User', kind: 'boolean', value: false, required: false },
  { key: 'serviceDelegatedEmail', n8nKey: 'delegatedEmail', label: 'Email', kind: 'text', value: '', required: false, showWhen: { serviceImpersonate: [true] }, n8nShowWhen: { inpersonate: [true] }, description: 'The email address of the user for which the application is requesting delegated access' },
  { key: 'serviceHttpNode', n8nKey: 'httpNode', label: 'Set up for use in HTTP Request node', kind: 'boolean', value: false, required: false },
  { key: 'serviceHttpWarning', n8nKey: 'httpWarning', label: "When using the HTTP Request node, you must specify the scopes you want to send. In other nodes, they're added automatically", kind: 'notice', value: '', required: false, showWhen: { serviceHttpNode: [true] }, n8nShowWhen: { httpNode: [true] } },
  { key: 'serviceScopes', n8nKey: 'scopes', label: 'Scope(s)', kind: 'text', value: '', required: false, showWhen: { serviceHttpNode: [true] }, n8nShowWhen: { httpNode: [true] }, description: 'You can find the scopes for services in the Google OAuth2 scopes documentation' },
];

const googleSheets = {
  type: 'google-sheets',
  n8nType: 'n8n-nodes-base.googleSheets',
  n8nVersion: 4.7,
  defaultVersion: 4.7,
  versionHistory: [1, 2, 3, 4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7],
  label: 'Google Sheets',
  defaultName: 'Google Sheets',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Read, update and write data to Google Sheets',
  category: 'action',
  // A Sheets node set to READ is a data source in the middle of a flow, not a
  // destination that ends one — `schedule → sheets(read) → filter → slack` is a
  // shape the docs advertise ("Scheduled sync"). The engine resolves a terminal
  // by category, so without this the Run walk returned `delivered` at the read
  // and the three nodes after it never narrated.
  //
  // Keyed on the CONFIGURED operation, and deliberately only on an explicit one:
  // the catalog default for `sheetOperation` is 'read', so falling back to
  // defaults would turn every unconfigured Sheets node into a passthrough and
  // break the cases that legitimately end a branch by appending a row.
  passthroughWhen: { sheetOperation: ['read'] },
  categories: ['Data & Storage', 'Productivity'],
  group: ['input', 'output'],
  defaults: { name: 'Google Sheets' },
  inputs: ['main'],
  outputs: ['main'],
  aiConnectorPorts: [],
  usableAsTool: true,
  icon: '/node-icons/google-sheets.svg',
  n8nIcon: 'file:googleSheets.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 60, height: 60 },
  iconAssetSha256: '292b172d5194ee1dfbf92e1037bb421e0b03528a6d0abbfe2536c98bc2cd8975',
  aliases: ['CSV', 'Sheet', 'Spreadsheet', 'GS'],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/',
  docsByResource: {
    sheet: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/sheet-operations/',
    spreadsheet: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/document-operations/',
  },
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/',
  builderHint: {
    searchHint: 'For workflow data storage, DataTable with upsert avoids duplicates. Use Google Sheets when spreadsheet collaboration is specifically needed.',
    relatedNodes: [{ nodeType: 'n8n-nodes-base.dataTable', relationHint: 'Prefer for workflow data storage with upsert' }],
    extraTypeDefOperations: ['sheet.append', 'sheet.appendOrUpdate', 'sheet.update'],
  },
  hints: [
    { message: "Use the 'Minimise API Calls' option for greater efficiency if your sheet is uniformly formatted without gaps between columns or rows", displayCondition: '={{$parameter["operation"] === "append" && !$parameter["options"]["useAppend"]}}', whenToDisplay: 'beforeExecution', location: 'outputPane' },
    { message: 'No columns found in Google Sheet. All rows will be appended', displayCondition: '={{ ["appendOrUpdate", "append"].includes($parameter["operation"]) && $parameter?.columns?.mappingMode === "defineBelow" && !$parameter?.columns?.schema?.length }}', whenToDisplay: 'beforeExecution', location: 'outputPane' },
    { type: 'info', message: 'Note on using an expression for Sheet: It will be evaluated only once, so all items will use the same sheet. It will be calculated using the first input item.', displayCondition: '={{ $rawParameter.sheetName?.startsWith("=") && $input.all().length > 1 }}', whenToDisplay: 'always', location: 'outputPane' },
    { type: 'info', message: 'Note on using an expression for Document: It will be evaluated only once, so all items will use the same document. It will be calculated using the first input item.', displayCondition: '={{ $rawParameter.documentId?.startsWith("=") && $input.all().length > 1 }}', whenToDisplay: 'always', location: 'outputPane' },
  ],
  genericResources: [
    { label: 'Love at first sight: Ricardo’s n8n journey', icon: '❤️', url: 'https://n8n.io/blog/love-at-first-sight-ricardos-n8n-journey/' },
    { label: 'Why business process automation with n8n can change your daily life', icon: '🧬', url: 'https://n8n.io/blog/why-business-process-automation-with-n8n-can-change-your-daily-life/' },
    { label: 'Automatically Adding Expense Receipts to Google Sheets with Telegram, Mindee, Twilio, and n8n', icon: '🧾', url: 'https://n8n.io/blog/automatically-adding-expense-receipts-to-google-sheets-with-telegram-mindee-twilio-and-n8n/' },
    { label: 'Supercharging your conference registration process with n8n', icon: '🎫', url: 'https://n8n.io/blog/supercharging-your-conference-registration-process-with-n8n/' },
    { label: 'Creating triggers for n8n workflows using polling', icon: '⏲', url: 'https://n8n.io/blog/creating-triggers-for-n8n-workflows-using-polling/' },
    { label: '6 e-commerce workflows to power up your Shopify s', icon: 'store', url: 'https://n8n.io/blog/no-code-ecommerce-workflow-automations/' },
    { label: 'Migrating Community Metrics to Orbit using n8n', icon: '📈', url: 'https://n8n.io/blog/migrating-community-metrics-to-orbit-using-n8n/' },
    { label: '15 Google apps you can combine and automate to increase productivity', icon: '💡', url: 'https://n8n.io/blog/automate-google-apps-for-productivity/' },
    { label: "Hey founders! Your business doesn't need you to operate", icon: ' 🖥️', url: 'https://n8n.io/blog/your-business-doesnt-need-you-to-operate/' },
    { label: 'How Honest Burgers Use Automation to Save $100k per year', icon: '🍔', url: 'https://n8n.io/blog/how-honest-burgers-use-automation-to-save-100k-per-year/' },
    { label: 'How a digital strategist uses n8n for online marketing', icon: '💻', url: 'https://n8n.io/blog/how-a-digital-strategist-uses-n8n-for-online-marketing/' },
    { label: 'Why this Product Manager loves workflow automation with n8n', icon: '🧠', url: 'https://n8n.io/blog/why-this-product-manager-loves-workflow-automation-with-n8n/' },
    { label: 'Sending Automated Congratulations with Google Sheets, Twilio, and n8n ', icon: '🙌', url: 'https://n8n.io/blog/sending-automated-congratulations-with-google-sheets-twilio-and-n8n/' },
    { label: 'How a Membership Development Manager automates his work and investments', icon: '📈', url: 'https://n8n.io/blog/how-a-membership-development-manager-automates-his-work-and-investments/' },
    { label: '7 no-code workflow automations for Amazon Web Services', url: 'https://n8n.io/blog/aws-workflow-automation/' },
  ],
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Google/Sheet/GoogleSheets.node.ts',
    currentNodePath: 'packages/nodes-base/nodes/Google/Sheet/v2/GoogleSheetsV2.node.ts',
    versionDescriptionPath: 'packages/nodes-base/nodes/Google/Sheet/v2/actions/versionDescription.ts',
    metadataPath: 'packages/nodes-base/nodes/Google/Sheet/GoogleSheets.node.json',
    actionRoot: 'packages/nodes-base/nodes/Google/Sheet/v2/actions',
    methodPaths: [
      'packages/nodes-base/nodes/Google/Sheet/v2/methods/credentialTest.ts',
      'packages/nodes-base/nodes/Google/Sheet/v2/methods/listSearch.ts',
      'packages/nodes-base/nodes/Google/Sheet/v2/methods/loadOptions.ts',
      'packages/nodes-base/nodes/Google/Sheet/v2/methods/resourceMapping.ts',
    ],
    credentialPaths: [
      'packages/nodes-base/credentials/GoogleSheetsOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/GoogleOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/OAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/GoogleApi.credentials.ts',
    ],
    iconPath: 'packages/nodes-base/nodes/Google/Sheet/googleSheets.svg',
  },
  credentialRequirements: [
    {
      type: 'googleSheetsOAuth2Api', name: 'Google Sheets OAuth2 API', required: true, inert: true,
      showWhen: { authentication: ['oAuth2'] }, extends: ['googleOAuth2Api', 'oAuth2Api'],
      documentationUrl: 'google/oauth-single-service', fields: oauthFields,
    },
    {
      type: 'googleApi', name: 'Google Service Account API', required: true, inert: true,
      showWhen: { authentication: ['serviceAccount'] }, testedBy: 'googleApiCredentialTest',
      documentationUrl: 'google/service-account', fields: serviceAccountFields,
    },
  ],
  credentialUiMetadata: [
    { key: 'googleSheetsOAuth2Credential', type: 'googleSheetsOAuth2Api', label: 'Google Sheets OAuth2 API', showWhen: { authentication: ['oAuth2'] }, extends: ['googleOAuth2Api', 'oAuth2Api'], fields: oauthFields, renderedInCredentialEditor: false, inert: true },
    { key: 'googleServiceAccountCredential', type: 'googleApi', label: 'Google Service Account API', showWhen: { authentication: ['serviceAccount'] }, testedBy: 'googleApiCredentialTest', fields: serviceAccountFields, renderedInCredentialEditor: false, inert: true },
  ],
  params: [
    {
      key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'select', sourceKind: 'options', value: 'oAuth2', required: false,
      options: [{ label: 'Service Account', value: 'serviceAccount' }, { label: 'OAuth2 (recommended)', value: 'oAuth2' }],
    },
    {
      key: 'googleSheetsOAuth2Credential', n8nKey: 'credentials.googleSheetsOAuth2Api', label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials',
      value: 'googleSheetsOAuth2Api', required: true, locked: true, dynamic: true, showWhen: { authentication: ['oAuth2'] },
      options: [{ label: 'Google Sheets OAuth2 API', value: 'googleSheetsOAuth2Api' }], simulationNote: lockedCredentialNote,
    },
    {
      key: 'googleServiceAccountCredential', n8nKey: 'credentials.googleApi', label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials',
      value: 'googleApi', required: true, locked: true, dynamic: true, showWhen: { authentication: ['serviceAccount'] },
      options: [{ label: 'Google Service Account API', value: 'googleApi' }], simulationNote: lockedCredentialNote,
    },
    { key: 'resource', n8nKey: 'resource', label: 'Resource', kind: 'select', sourceKind: 'options', value: 'sheet', required: false, noDataExpression: true, options: resourceOptions },
    { key: 'sheetOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'read', required: false, noDataExpression: true, showWhen: { resource: ['sheet'] }, options: sheetOperations },
    { key: 'spreadsheetOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'create', required: false, noDataExpression: true, showWhen: { resource: ['spreadsheet'] }, options: spreadsheetOperations },
    documentLocator('sheetDocumentId', { resource: ['sheet'] }, { resource: ['sheet'] }),
    sheetLocator,
    documentLocator('spreadsheetDeleteDocumentId', { resource: ['spreadsheet'], spreadsheetOperation: ['deleteSpreadsheet'] }, { resource: ['spreadsheet'], operation: ['deleteSpreadsheet'] }),

    columnsMapper('appendColumns', 'append', 'add'),
    appendLikeOptions('appendOptions', 'append', true),
    columnsMapper('appendOrUpdateColumns', 'appendOrUpdate', 'upsert'),
    appendLikeOptions('appendOrUpdateOptions', 'appendOrUpdate', true),
    columnsMapper('updateColumns', 'update', 'update'),
    appendLikeOptions('updateOptions', 'update', false),

    {
      key: 'clearType', n8nKey: 'clear', label: 'Clear', kind: 'select', sourceKind: 'options', value: 'wholeSheet', required: false,
      options: [{ label: 'Whole Sheet', value: 'wholeSheet' }, { label: 'Specific Rows', value: 'specificRows' }, { label: 'Specific Columns', value: 'specificColumns' }, { label: 'Specific Range', value: 'specificRange' }],
      description: 'What to clear', ...sheetWhen('clear'), n8nHideWhen: { sheetName: [''] },
    },
    { key: 'clearKeepFirstRow', n8nKey: 'keepFirstRow', label: 'Keep First Row', kind: 'boolean', value: false, required: false, ...sheetWhen('clear', { clearType: ['wholeSheet'] }, { clear: ['wholeSheet'] }), n8nHideWhen: { sheetName: [''] } },
    { key: 'clearStartRow', n8nKey: 'startIndex', label: 'Start Row Number', kind: 'number', value: 1, required: false, min: 1, description: 'The row number to delete from, The first row is 1', ...sheetWhen('clear', { clearType: ['specificRows'] }, { clear: ['specificRows'] }), n8nHideWhen: { sheetName: [''] } },
    { key: 'clearRowsToDelete', n8nKey: 'rowsToDelete', label: 'Number of Rows to Delete', kind: 'number', value: 1, required: false, min: 1, ...sheetWhen('clear', { clearType: ['specificRows'] }, { clear: ['specificRows'] }), n8nHideWhen: { sheetName: [''] } },
    { key: 'clearStartColumn', n8nKey: 'startIndex', label: 'Start Column', kind: 'text', value: 'A', required: false, description: 'The column to delete', ...sheetWhen('clear', { clearType: ['specificColumns'] }, { clear: ['specificColumns'] }), n8nHideWhen: { sheetName: [''] } },
    { key: 'clearColumnsToDelete', n8nKey: 'columnsToDelete', label: 'Number of Columns to Delete', kind: 'number', value: 1, required: false, min: 1, ...sheetWhen('clear', { clearType: ['specificColumns'] }, { clear: ['specificColumns'] }), n8nHideWhen: { sheetName: [''] } },
    { key: 'clearRange', n8nKey: 'range', label: 'Range', kind: 'text', value: 'A:F', required: true, description: 'The table range to read from or append data to. It can include a sheet name, for example "MySheet!A:F".', ...sheetWhen('clear', { clearType: ['specificRange'] }, { clear: ['specificRange'] }), n8nHideWhen: { sheetName: [''] } },

    { key: 'sheetCreateTitle', n8nKey: 'title', label: 'Title', kind: 'text', value: 'n8n-sheet', required: true, description: 'The name of the sheet', ...sheetWhen('create') },
    {
      key: 'sheetCreateOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add option', ...sheetWhen('create'),
      fields: [
        { key: 'sheetCreateHidden', n8nKey: 'hidden', label: 'Hidden', kind: 'boolean', value: false, required: false, description: "Whether the sheet is hidden in the UI, false if it's visible" },
        { key: 'sheetCreateRightToLeft', n8nKey: 'rightToLeft', label: 'Right To Left', kind: 'boolean', value: false, required: false, description: 'Whether the sheet is an RTL sheet instead of an LTR sheet' },
        { key: 'sheetCreateSheetId', n8nKey: 'sheetId', label: 'Sheet ID', kind: 'number', value: 0, required: false, description: 'The ID of the sheet. Must be non-negative. This field cannot be changed once set.' },
        { key: 'sheetCreateIndex', n8nKey: 'index', label: 'Sheet Index', kind: 'number', value: 0, required: false, description: 'The index of the sheet within the spreadsheet' },
        { key: 'sheetCreateTabColor', n8nKey: 'tabColor', label: 'Tab Color', kind: 'color', value: '0aa55c', required: false, description: 'The color of the tab in the UI' },
      ],
    },

    {
      key: 'deleteDimension', n8nKey: 'toDelete', label: 'To Delete', kind: 'select', sourceKind: 'options', value: 'rows', required: false,
      options: [{ label: 'Rows', value: 'rows', description: 'Rows to delete' }, { label: 'Columns', value: 'columns', description: 'Columns to delete' }],
      description: 'What to delete', ...sheetWhen('delete'), n8nHideWhen: { sheetName: [''] },
    },
    { key: 'deleteStartRow', n8nKey: 'startIndex', label: 'Start Row Number', kind: 'number', value: 2, required: false, min: 1, description: 'The row number to delete from, The first row is 2', ...sheetWhen('delete', { deleteDimension: ['rows'] }, { toDelete: ['rows'] }), n8nHideWhen: { sheetName: [''] } },
    { key: 'deleteRowCount', n8nKey: 'numberToDelete', label: 'Number of Rows to Delete', kind: 'number', value: 1, required: false, min: 1, ...sheetWhen('delete', { deleteDimension: ['rows'] }, { toDelete: ['rows'] }), n8nHideWhen: { sheetName: [''] } },
    { key: 'deleteStartColumn', n8nKey: 'startIndex', label: 'Start Column', kind: 'text', value: 'A', required: false, description: 'The column to delete', ...sheetWhen('delete', { deleteDimension: ['columns'] }, { toDelete: ['columns'] }), n8nHideWhen: { sheetName: [''] } },
    { key: 'deleteColumnCount', n8nKey: 'numberToDelete', label: 'Number of Columns to Delete', kind: 'number', value: 1, required: false, min: 1, ...sheetWhen('delete', { deleteDimension: ['columns'] }, { toDelete: ['columns'] }), n8nHideWhen: { sheetName: [''] } },

    {
      key: 'readFilters', n8nKey: 'filtersUI', label: 'Filters', kind: 'fixedCollection', sourceKind: 'fixedCollection', value: {}, required: false,
      multiple: true, collectionKey: 'values', collectionLabel: 'Filter', addLabel: 'Add Filter', ...sheetWhen('read'), n8nHideWhen: { sheetName: [''] },
      fields: [
        { key: 'readFilterColumn', n8nKey: 'lookupColumn', label: 'Column', kind: 'select', value: '', required: false, options: [], locked: true, dynamic: true, loadOptionsMethod: 'getSheetHeaderRowWithGeneratedColumnNames', loadOptionsDependsOn: ['sheetName.value'], description: 'Choose from the list, or specify an ID using an expression', simulationNote: lockedSchemaNote },
        { key: 'readFilterValue', n8nKey: 'lookupValue', label: 'Value', kind: 'text', value: '', required: false, hint: 'The column must have this value to be matched' },
      ],
    },
    {
      key: 'readCombineFilters', n8nKey: 'combineFilters', label: 'Combine Filters', kind: 'select', sourceKind: 'options', value: 'AND', required: false,
      options: [{ label: 'AND', value: 'AND', description: 'Only rows that meet all the conditions are selected' }, { label: 'OR', value: 'OR', description: 'Rows that meet at least one condition are selected' }],
      description: 'How to combine the conditions defined in Filters: AND requires all conditions to be true, OR requires at least one condition to be true',
      sourceVersionCondition: '@version >= 4.3', ...sheetWhen('read'), n8nHideWhen: { sheetName: [''] },
    },
    {
      key: 'readOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add option', ...sheetWhen('read'), n8nHideWhen: { sheetName: [''] },
      fields: [
        {
          key: 'readDataLocation', n8nKey: 'dataLocationOnSheet', label: 'Data Location on Sheet', kind: 'fixedCollection', sourceKind: 'fixedCollection',
          value: { values: { rangeDefinition: 'detectAutomatically' } }, required: false, collectionKey: 'values', collectionLabel: 'Values', multiple: false, addLabel: 'Select Range',
          fields: [
            {
              key: 'readRangeDefinition', n8nKey: 'rangeDefinition', label: 'Range Definition', kind: 'select', value: '', required: false,
              options: [
                { label: 'Detect Automatically', value: 'detectAutomatically', description: 'Automatically detect the data range' },
                { label: 'Specify Range (A1 Notation)', value: 'specifyRangeA1', description: 'Manually specify the data range' },
                { label: 'Specify Range (Rows)', value: 'specifyRange', description: 'Manually specify the data range' },
              ],
            },
            { key: 'readRowsUntil', n8nKey: 'readRowsUntil', label: 'Read Rows Until', kind: 'select', value: 'lastRowInSheet', required: false, options: [{ label: 'First Empty Row', value: 'firstEmptyRow' }, { label: 'Last Row In Sheet', value: 'lastRowInSheet' }], showWhen: { readRangeDefinition: ['detectAutomatically'] }, n8nShowWhen: { rangeDefinition: ['detectAutomatically'] } },
            { key: 'readHeaderRow', n8nKey: 'headerRow', label: 'Header Row', kind: 'number', value: 1, required: false, min: 1, description: "Index is relative to the set 'Range', first row index is 1", hint: 'Index of the row which contains the column names', showWhen: { readRangeDefinition: ['specifyRange'] }, n8nShowWhen: { rangeDefinition: ['specifyRange'] } },
            { key: 'readFirstDataRow', n8nKey: 'firstDataRow', label: 'First Data Row', kind: 'number', value: 2, required: false, min: 1, description: "Index is relative to the set 'Range', first row index is 1", hint: 'Index of first row which contains the actual data', showWhen: { readRangeDefinition: ['specifyRange'] }, n8nShowWhen: { rangeDefinition: ['specifyRange'] } },
            { key: 'readRange', n8nKey: 'range', label: 'Range', kind: 'text', value: '', required: false, placeholder: 'A:Z', description: 'The table range to read from or to append data to.', hint: 'You can specify both the rows and the columns, e.g. C4:E7', showWhen: { readRangeDefinition: ['specifyRangeA1'] }, n8nShowWhen: { rangeDefinition: ['specifyRangeA1'] } },
          ],
        },
        {
          key: 'readOutputFormatting', n8nKey: 'outputFormatting', label: 'Output Formatting', kind: 'fixedCollection', sourceKind: 'fixedCollection',
          value: { values: { general: 'UNFORMATTED_VALUE', date: 'FORMATTED_STRING' } }, required: false, collectionKey: 'values', collectionLabel: 'Values', multiple: false, addLabel: 'Add Formatting',
          fields: [
            {
              key: 'readGeneralFormatting', n8nKey: 'general', label: 'General Formatting', kind: 'select', value: '', required: false,
              options: [
                { label: 'Values (unformatted)', value: 'UNFORMATTED_VALUE', description: 'Numbers stay as numbers, but any currency signs or special formatting is lost' },
                { label: 'Values (formatted)', value: 'FORMATTED_VALUE', description: 'Numbers are turned to text, and displayed as in Google Sheets' },
                { label: 'Formulas', value: 'FORMULA' },
              ],
              description: 'Determines how values should be rendered in the output',
            },
            { key: 'readDateFormatting', n8nKey: 'date', label: 'Date Formatting', kind: 'select', value: '', required: false, options: [{ label: 'Formatted Text', value: 'FORMATTED_STRING', description: "As displayed in Google Sheets, e.g. '01/01/2022'" }, { label: 'Serial Number', value: 'SERIAL_NUMBER', description: 'A number representing the number of days since Dec 30, 1899' }] },
          ],
        },
        { key: 'readReturnFirstMatch', n8nKey: 'returnFirstMatch', label: 'Return only First Matching Row', kind: 'boolean', value: false, required: false, sourceVersionCondition: '@version >= 4.5', description: 'Whether to select the first row of the sheet or the first matching row (if filters are set)' },
      ],
    },

    { key: 'spreadsheetCreateTitle', n8nKey: 'title', label: 'Title', kind: 'text', value: '', required: false, description: 'The title of the spreadsheet', ...operationWhen('spreadsheet', 'spreadsheetOperation', 'create') },
    {
      key: 'spreadsheetCreateSheets', n8nKey: 'sheetsUi', label: 'Sheets', kind: 'fixedCollection', sourceKind: 'fixedCollection', value: {}, required: false,
      multiple: true, collectionKey: 'sheetValues', collectionLabel: 'Sheet', addLabel: 'Add Sheet', ...operationWhen('spreadsheet', 'spreadsheetOperation', 'create'),
      fields: [
        { key: 'spreadsheetCreateSheetTitle', n8nKey: 'title', label: 'Title', kind: 'text', value: '', required: false, description: 'Title of the property to create' },
        { key: 'spreadsheetCreateSheetHidden', n8nKey: 'hidden', label: 'Hidden', kind: 'boolean', value: false, required: false, description: 'Whether the Sheet should be hidden in the UI' },
      ],
    },
    {
      key: 'spreadsheetCreateOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add option', ...operationWhen('spreadsheet', 'spreadsheetOperation', 'create'),
      fields: [
        { key: 'spreadsheetLocale', n8nKey: 'locale', label: 'Locale', kind: 'text', value: '', required: false, placeholder: 'en_US', description: 'The locale of the spreadsheet using a language or language-country code, such as en, fil, or en_US' },
        {
          key: 'spreadsheetAutoRecalc', n8nKey: 'autoRecalc', label: 'Recalculation Interval', kind: 'select', value: '', required: false,
          options: [
            { label: 'Default', value: '', description: 'Default value' },
            { label: 'On Change', value: 'ON_CHANGE', description: 'Volatile functions are updated on every change' },
            { label: 'Minute', value: 'MINUTE', description: 'Volatile functions are updated on every change and every minute' },
            { label: 'Hour', value: 'HOUR', description: 'Volatile functions are updated on every change and hourly' },
          ],
          description: 'Cell recalculation interval options',
        },
      ],
    },
  ],
  resourceOperationParity: {
    sheet: { expected: ['appendOrUpdate', 'append', 'clear', 'create', 'remove', 'delete', 'read', 'update'], represented: sheetOperations.map(({ value }) => value), default: 'read' },
    spreadsheet: { expected: ['create', 'deleteSpreadsheet'], represented: spreadsheetOperations.map(({ value }) => value), default: 'create' },
  },
  operationCount: 10,
  lookupMetadata: {
    spreadSheetsSearch: { parameter: 'documentId', searchable: true, paginated: true, networkAccess: false },
    sheetsSearch: { parameter: 'sheetName', dependsOn: ['documentId.value'], searchable: false, networkAccess: false },
    getMappingColumns: { parameter: 'columns', dependsOn: ['documentId.value', 'sheetName.value', 'options.locationDefine.values.headerRow'], networkAccess: false },
    getSheetHeaderRowWithGeneratedColumnNames: { parameter: 'filtersUI.values.lookupColumn', dependsOn: ['sheetName.value'], networkAccess: false },
  },
  versionBranches: [
    { versions: [1, 2], implementation: 'GoogleSheetsV1', representedInCurrentParams: false },
    { versions: [3], implementation: 'GoogleSheetsV2 legacy explicit dataMode/fieldsUi', representedInCurrentParams: false },
    { versions: '4–4.6', implementation: 'GoogleSheetsV2 resourceMapper without allowEmptyValues on upsert/update', representedInCurrentParams: false },
    { versions: 4.7, implementation: 'GoogleSheetsV2 resourceMapper with allowEmptyValues on upsert/update', representedInCurrentParams: true },
    { versions: '< 4.3', n8nKey: 'combineFilters', default: 'OR', representedInCurrentParams: false },
    { versions: '>= 4.3', n8nKey: 'combineFilters', default: 'AND', representedInCurrentParams: true },
    { versions: '< 4.5', n8nKey: 'options.returnAllMatches', default: 'returnFirstMatch', representedInCurrentParams: false },
    { versions: '>= 4.5', n8nKey: 'options.returnFirstMatch', default: false, representedInCurrentParams: true },
  ],
  docsSummary: {
    operations: { sheet: sheetOperations.map(({ value }) => value), spreadsheet: spreadsheetOperations.map(({ value }) => value) },
    aiToolDocumented: true,
    credentialMethods: ['oAuth2', 'serviceAccount'],
    currentDocsDrift: ['The Sheet operation page still mentions the legacy Nothing mapping mode, while the v4.7 resourceMapper exposes only defineBelow and autoMapInputData.'],
  },
  platformGaps: [
    'The native node reuses operation, documentId, title, options, columns, startIndex, and numberToDelete across conditional branches. Unique UI keys keep the branches stable while n8nKey records each real parameter name.',
    'Native resourceMapper controls are normalized to supported collection, fixedCollection, select, and multiSelect controls. Their mappingMode, value, schema, and matchingColumns shape is preserved, but Google-backed schema discovery is disabled.',
    'Document, sheet, header-column, and mapping-schema lists normally call Google Drive or Sheets APIs. List modes and dynamic options remain locked and empty; URL, ID, and name modes remain authorable.',
    'n8n progressively hides operation fields while sheetName is empty. The local renderer cannot express a generic non-empty condition, so n8nHideWhen preserves the source rule as metadata while the resource/operation conditions remain active.',
    'Only the current v4.7 branches are rendered. Legacy v3 dataMode/fieldsUi controls, pre-4.7 resourceMapper behavior, and earlier read defaults are retained in versionBranches.',
    'The public Sheet operations page still documents the v3 Nothing mapping choice. The pinned v4.7 implementation and generic resourceMapper UI are the current authoring authority.',
    'Credential editors are metadata-only. OAuth consent, token refresh, service-account JWT signing, impersonation, and credential tests never run.',
    'usableAsTool is preserved, but tool conversion is capability metadata rather than a static ai_tool connector port or executable tool runtime.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials', sourceType: 'credentials', normalizedKind: 'locked select', reason: 'Credential discovery and editors are unavailable.' },
    { n8nKey: 'documentId/sheetName', sourceType: 'resourceLocator with remote listSearch', normalizedKind: 'resourceLocator', reason: 'List modes remain empty because Google lookups are disabled.' },
    { n8nKey: 'columns', sourceType: 'resourceMapper', normalizedKind: 'collection with fixedCollection mapping/schema rows', reason: 'The catalog has no native resourceMapper renderer and cannot load sheet columns.' },
    { n8nKey: 'filtersUI.values.lookupColumn', sourceType: 'options with loadOptionsMethod', normalizedKind: 'locked select', reason: 'Header-column discovery requires Google Sheets access.' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    credentialRefresh: false,
    authentication: false,
    oauthAuthorization: false,
    oauthRefresh: false,
    serviceAccountSigning: false,
    impersonation: false,
    documentLookup: false,
    sheetLookup: false,
    headerLookup: false,
    schemaLookup: false,
    apiRequests: false,
    networkAccess: false,
    documentCreate: false,
    documentDelete: false,
    sheetCreate: false,
    sheetDelete: false,
    sheetRead: false,
    sheetWrite: false,
    rowAppend: false,
    rowUpdate: false,
    rowDelete: false,
    columnDelete: false,
    clearData: false,
    expressionEvaluation: false,
    toolExecution: false,
    voice: false,
  },
  output: {
    'Full Name': 'Aarav Sharma',
    Email: 'aarav@example.com',
    Plan: 'Pro',
    'Referral Source': 'Google search',
    USD_INR_Rate: 83.21,
    updates: { updatedRows: 1 },
  },
};

export default googleSheets;
