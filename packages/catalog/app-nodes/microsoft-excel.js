// Editor-only descriptor for n8n's Microsoft Excel (OneDrive) v2.2 action node.
// Credentials, Graph lookups, workbook sessions, API calls, and every mutation remain inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This credential selector is locked. The simulation never creates, reads, tests, refreshes, signs, or applies Microsoft credentials.';
const lockedLookupNote =
  'The native Microsoft Graph lookup is preserved as metadata but disabled. List mode remains empty; supplied IDs remain inert authoring values.';
const lockedColumnNote =
  'Excel normally loads columns from the selected table or sheet. Dynamic options remain empty and inert in this simulation.';

const graphCloudOptions = [
  { label: 'Global (https://graph.microsoft.com)', value: 'https://graph.microsoft.com' },
  { label: 'US Government (https://graph.microsoft.us)', value: 'https://graph.microsoft.us' },
  { label: 'US Government DOD (https://dod-graph.microsoft.us)', value: 'https://dod-graph.microsoft.us' },
  { label: 'China (https://microsoftgraph.chinacloudapi.cn)', value: 'https://microsoftgraph.chinacloudapi.cn' },
];

const microsoftOAuthCommonFields = [
  { key: 'useDynamicClientRegistration', n8nKey: 'useDynamicClientRegistration', label: 'Use Dynamic Client Registration', kind: 'hidden', value: false, required: false, sourceOrigin: 'oAuth2Api' },
  { key: 'grantType', n8nKey: 'grantType', label: 'Grant Type', kind: 'hidden', value: 'authorizationCode', required: false },
  { key: 'clientId', n8nKey: 'clientId', label: 'Client ID', kind: 'text', value: '', required: true, sourceOrigin: 'oAuth2Api' },
  {
    key: 'clientCredentialType', n8nKey: 'clientCredentialType', label: 'Authentication', kind: 'select', value: 'clientSecret', required: false,
    options: [{ label: 'Client Secret', value: 'clientSecret' }, { label: 'Certificate', value: 'certificate' }],
    description: 'How n8n authenticates to Microsoft Entra when exchanging and refreshing tokens.',
  },
  { key: 'clientSecret', n8nKey: 'clientSecret', label: 'Client Secret', kind: 'text', value: '', required: true, password: true, showWhen: { clientCredentialType: ['clientSecret'] } },
  {
    key: 'privateKey', n8nKey: 'privateKey', label: 'Private Key', kind: 'textarea', sourceKind: 'string', value: '', required: true,
    password: true, rows: 4, showWhen: { clientCredentialType: ['certificate'] },
    description: 'PEM-encoded RSA private key paired with the certificate uploaded to the Entra app registration.',
  },
  {
    key: 'certificate', n8nKey: 'certificate', label: 'Certificate', kind: 'textarea', sourceKind: 'string', value: '', required: true,
    password: true, rows: 4, showWhen: { clientCredentialType: ['certificate'] },
    description: 'PEM-encoded public certificate registered on the Entra app registration.',
  },
  { key: 'authUrl', n8nKey: 'authUrl', label: 'Authorization URL', kind: 'text', value: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', required: false },
  { key: 'accessTokenUrl', n8nKey: 'accessTokenUrl', label: 'Access Token URL', kind: 'text', value: 'https://login.microsoftonline.com/common/oauth2/v2.0/token', required: false },
  { key: 'authQueryParameters', n8nKey: 'authQueryParameters', label: 'Auth URI Query Parameters', kind: 'hidden', value: 'response_mode=query&prompt=select_account', required: false },
  { key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'hidden', value: 'body', required: false },
  {
    key: 'graphApiBaseUrl', n8nKey: 'graphApiBaseUrl', label: 'Microsoft Graph API Base URL', kind: 'select',
    value: 'https://graph.microsoft.com', required: false, options: graphCloudOptions,
    description: 'Select the endpoint for your Microsoft cloud environment.',
  },
];

const excelOAuthFields = [
  ...microsoftOAuthCommonFields,
  { key: 'customScopes', n8nKey: 'customScopes', label: 'Custom Scopes', kind: 'boolean', value: false, required: false, description: 'Define custom scopes' },
  {
    key: 'customScopesNotice', n8nKey: 'customScopesNotice',
    label: 'The default scopes needed for the node to work are already set, If you change these the node may not function correctly.',
    kind: 'notice', value: '', required: false, showWhen: { customScopes: [true] },
  },
  {
    key: 'enabledScopes', n8nKey: 'enabledScopes', label: 'Enabled Scopes', kind: 'text',
    value: 'openid offline_access Files.ReadWrite', required: false, showWhen: { customScopes: [true] },
    description: 'Scopes that should be enabled',
  },
  {
    key: 'scope', n8nKey: 'scope', label: 'Scope', kind: 'hidden',
    value: '={{$self["customScopes"] ? $self["enabledScopes"] : "openid offline_access Files.ReadWrite"}}', required: false,
  },
];

const genericMicrosoftOAuthFields = [
  ...microsoftOAuthCommonFields,
  { key: 'scope', n8nKey: 'scope', label: 'Scope', kind: 'text', value: '', required: false, sourceOrigin: 'oAuth2Api' },
];

const servicePrincipalFields = [
  { key: 'accessToken', n8nKey: 'accessToken', label: 'Access Token', kind: 'hidden', value: '', required: false, expirable: true },
  {
    key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'select', value: 'clientSecret', required: false,
    options: [{ label: 'Client Secret', value: 'clientSecret' }, { label: 'Certificate', value: 'certificate' }],
  },
  {
    key: 'setupNotice', n8nKey: 'setupNotice',
    label: 'App-only access uses application permissions that an admin must consent to on the app registration. The connection test reads the organization via Microsoft Graph, so the app needs Organization.Read.All (or Directory.Read.All) for the test to pass.',
    kind: 'notice', value: '', required: false,
  },
  {
    key: 'tenantId', n8nKey: 'tenantId', label: 'Directory (Tenant) ID', kind: 'text', value: '', required: true,
    description: 'The Directory (tenant) ID from your app registration overview in the Microsoft Entra admin center',
  },
  {
    key: 'clientId', n8nKey: 'clientId', label: 'Application (Client) ID', kind: 'text', value: '', required: true,
    description: 'The Application (client) ID from your app registration overview',
  },
  {
    key: 'clientSecret', n8nKey: 'clientSecret', label: 'Client Secret', kind: 'text', value: '', required: true,
    password: true, showWhen: { authentication: ['clientSecret'] }, description: 'A client secret created under Certificates & secrets',
  },
  {
    key: 'privateKey', n8nKey: 'privateKey', label: 'Private Key', kind: 'textarea', sourceKind: 'string', value: '', required: true,
    password: true, showWhen: { authentication: ['certificate'] },
    description: 'The PEM-encoded RSA private key matching the certificate uploaded to the app registration. Line breaks may be flattened.',
  },
  {
    key: 'certificate', n8nKey: 'certificate', label: 'Certificate', kind: 'textarea', sourceKind: 'string', value: '', required: true,
    rows: 4, showWhen: { authentication: ['certificate'] },
    description: 'The PEM-encoded public certificate uploaded under Certificates & secrets on the app registration',
  },
  {
    key: 'graphApiBaseUrl', n8nKey: 'graphApiBaseUrl', label: 'Microsoft Graph API Base URL', kind: 'select',
    value: 'https://graph.microsoft.com', required: false, options: graphCloudOptions,
    description: 'Select the endpoint for your Microsoft cloud environment.',
  },
];

const resourceOptions = [
  { label: 'Table', value: 'table', description: 'Represents an Excel table' },
  { label: 'Workbook', value: 'workbook', description: 'A workbook is the top level object which contains one or more worksheets' },
  { label: 'Sheet', value: 'worksheet', description: 'A sheet is a grid of cells which can contain data, tables, charts, etc' },
];

const tableOperations = [
  { label: 'Append', value: 'append', description: 'Add rows to the end of the table', action: 'Append rows to table' },
  { label: 'Convert to Range', value: 'convertToRange', description: 'Convert a table to a range', action: 'Convert to range' },
  { label: 'Create', value: 'addTable', description: 'Add a table based on range', action: 'Create a table' },
  { label: 'Delete', value: 'deleteTable', description: 'Delete a table', action: 'Delete a table' },
  { label: 'Get Columns', value: 'getColumns', description: 'Retrieve a list of table columns', action: 'Get columns' },
  { label: 'Get Rows', value: 'getRows', description: 'Retrieve a list of table rows', action: 'Get rows' },
  { label: 'Lookup', value: 'lookup', description: 'Look for rows that match a given value in a column', action: 'Lookup a column' },
];

const workbookOperations = [
  { label: 'Add Sheet', value: 'addWorksheet', description: 'Add a new sheet to the workbook', action: 'Add a sheet to a workbook' },
  { label: 'Delete', value: 'deleteWorkbook', description: 'Delete workbook', action: 'Delete workbook' },
  { label: 'Get Many', value: 'getAll', description: 'Get workbooks', action: 'Get workbooks' },
];

const worksheetOperations = [
  { label: 'Append', value: 'append', description: 'Append data to sheet', action: 'Append data to sheet' },
  { label: 'Append or Update', value: 'upsert', description: 'Append a new row or update the current one if it already exists (upsert)', action: 'Append or update a sheet' },
  { label: 'Clear', value: 'clear', description: 'Clear sheet', action: 'Clear sheet' },
  { label: 'Delete', value: 'deleteWorksheet', description: 'Delete sheet', action: 'Delete sheet' },
  { label: 'Get Many', value: 'getAll', description: 'Get a list of sheets', action: 'Get sheets' },
  { label: 'Get Rows', value: 'readRows', description: 'Retrieve a list of sheet rows', action: 'Get rows from sheet' },
  { label: 'Update', value: 'update', description: 'Update rows of a sheet or sheet range', action: 'Update sheet' },
];

const operationKeys = { table: 'tableOperation', workbook: 'workbookOperation', worksheet: 'worksheetOperation' };
const operationWhen = (resource, operations, uiExtra = {}, n8nExtra = {}) => ({
  showWhen: {
    resource: [resource],
    [operationKeys[resource]]: Array.isArray(operations) ? operations : [operations],
    ...uiExtra,
  },
  n8nShowWhen: {
    resource: [resource],
    operation: Array.isArray(operations) ? operations : [operations],
    ...n8nExtra,
  },
});

const workbookLocator = (prefix, resource, operations) => ({
  key: `${prefix}Workbook`, n8nKey: 'workbook', label: 'Workbook', kind: 'resourceLocator', sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
  locked: true, dynamic: true, modes: ['list', 'id'], modeOptions: [
    { label: 'From List', value: 'list', kind: 'list', searchListMethod: 'searchWorkbooks', searchable: true },
    {
      label: 'By ID', value: 'id', kind: 'text',
      validation: { type: 'regex', regex: '[a-zA-Z0-9]{2,}', errorMessage: 'Not a valid Workbook ID' },
    },
  ], options: [], ...operationWhen(resource, operations), simulationNote: lockedLookupNote,
});

const worksheetLocator = (prefix, resource, operations) => ({
  key: `${prefix}Worksheet`, n8nKey: 'worksheet', label: 'Sheet', kind: 'resourceLocator', sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
  locked: true, dynamic: true, loadOptionsDependsOn: ['workbook.value'], modes: ['list', 'id'], modeOptions: [
    { label: 'From List', value: 'list', kind: 'list', searchListMethod: 'getWorksheetsList', searchable: false },
    {
      label: 'By ID', value: 'id', kind: 'text',
      validation: { type: 'regex', regex: '{[a-zA-Z0-9\\-_]{2,}}', errorMessage: 'Not a valid Sheet ID' },
    },
  ], options: [], ...operationWhen(resource, operations), simulationNote: lockedLookupNote,
});

const tableLocator = (prefix, operations) => ({
  key: `${prefix}Table`, n8nKey: 'table', label: 'Table', kind: 'resourceLocator', sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
  locked: true, dynamic: true, loadOptionsDependsOn: ['workbook.value', 'worksheet.value'], modes: ['list', 'id'], modeOptions: [
    { label: 'From List', value: 'list', kind: 'list', searchListMethod: 'getWorksheetTables', searchable: false },
    {
      label: 'By ID', value: 'id', kind: 'text',
      validation: { type: 'regex', regex: '{[a-zA-Z0-9\\-_]{2,}}', errorMessage: 'Not a valid Table ID' },
    },
  ], options: [], ...operationWhen('table', operations), simulationNote: lockedLookupNote,
});

const rawDataOptionFields = (prefix, includeFields = false, includeUpdateAll = false) => [
  {
    key: `${prefix}RawData`, n8nKey: 'rawData', label: 'RAW Data', kind: 'boolean', value: false, sourceDefault: 0, required: false,
    description: 'Whether the data should be returned RAW instead of parsed into keys according to their header',
  },
  {
    key: `${prefix}DataProperty`, n8nKey: 'dataProperty', label: 'Data Property', kind: 'text', value: 'data', required: true,
    showWhen: { [`${prefix}RawData`]: [true] }, n8nShowWhen: { rawData: [true] },
    description: 'The name of the property into which to write the RAW data',
  },
  ...(includeFields ? [{
    key: `${prefix}Fields`, n8nKey: 'fields', label: 'Fields', kind: 'text', value: '', required: false,
    showWhen: { [`${prefix}RawData`]: [true] }, n8nShowWhen: { rawData: [true] },
    description: 'Fields the response will containt. Multiple can be added separated by ,.',
  }] : []),
  ...(includeUpdateAll ? [{
    key: `${prefix}UpdateAll`, n8nKey: 'updateAll', label: 'Update All Matches', kind: 'boolean', value: false, required: false,
    description: 'Whether to update all matching rows or just the first match',
  }] : []),
];

const dataModeOptions = [
  { label: 'Auto-Map Input Data to Columns', value: 'autoMap', description: 'Use when node input properties match destination column names' },
  { label: 'Map Each Column Below', value: 'define', description: 'Set the value for each destination column' },
  { label: 'Raw', value: 'raw', description: 'Send raw data as JSON' },
];

const valuesToSend = (prefix, resource, operations, method, dependsOn, requiresDataPath = false) => ({
  key: `${prefix}FieldsUi`, n8nKey: 'fieldsUi', label: 'Values to Send', kind: 'fixedCollection', sourceKind: 'fixedCollection',
  value: {}, required: false, multiple: true, collectionKey: 'values', collectionLabel: 'Field', addLabel: 'Add Field',
  ...operationWhen(resource, operations, { [`${prefix}DataMode`]: ['define'] }, { dataMode: ['define'] }),
  fields: [
    {
      key: `${prefix}Column`, n8nKey: 'column', label: 'Column', kind: 'select', sourceKind: 'options', value: '', required: false,
      options: [], locked: true, dynamic: true, loadOptionsMethod: method, loadOptionsDependsOn: dependsOn,
      description: 'Choose from the list, or specify an ID using an expression', simulationNote: lockedColumnNote,
    },
    {
      key: `${prefix}FieldValue`, n8nKey: 'fieldValue', label: 'Value', kind: 'text', value: '', required: false,
      ...(requiresDataPath ? { requiresDataPath: 'single' } : {}),
    },
  ],
});

const returnManyFields = (prefix, resource, operations) => [
  {
    key: `${prefix}ReturnAll`, n8nKey: 'returnAll', label: 'Return All', kind: 'boolean', value: false, required: false,
    description: 'Whether to return all results or only up to a given limit', ...operationWhen(resource, operations),
  },
  {
    key: `${prefix}Limit`, n8nKey: 'limit', label: 'Limit', kind: 'number', value: 100, required: false, min: 1, max: 500,
    description: 'Max number of results to return',
    ...operationWhen(resource, operations, { [`${prefix}ReturnAll`]: [false] }, { returnAll: [false] }),
  },
];

const microsoftExcel = {
  type: 'microsoft-excel',
  n8nType: 'n8n-nodes-base.microsoftExcel',
  n8nVersion: 2.2,
  defaultVersion: 2.2,
  sourceDefaultVersion: 'highest declared version',
  versionHistory: [1, 2, 2.1, 2.2],
  label: 'Microsoft Excel (OneDrive)',
  defaultName: 'Microsoft Excel (OneDrive)',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Consume the Microsoft Excel API for workbooks stored in OneDrive',
  category: 'action',
  categories: ['Data & Storage', 'Productivity'],
  group: ['input'],
  defaults: { name: 'Microsoft Excel (OneDrive)' },
  inputs: ['main'],
  outputs: ['main'],
  aiConnectorPorts: [],
  usableAsTool: true,
  icon: '/node-icons/microsoft-excel.svg',
  n8nIcon: 'file:excel.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 60, height: 60 },
  iconAssetSha256: '5191ceb85929ba24e1065cb3be57ece9cf253958b8c05a2e3402cbf8cf331a45',
  sourceIconAssetSha256: '5191ceb85929ba24e1065cb3be57ece9cf253958b8c05a2e3402cbf8cf331a45',
  aliases: ['_Excel', 'Excel', 'Sheet', 'CSV', 'Spreadsheet', 'OneDrive'],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.microsoftexcel/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/microsoft/',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Microsoft/Excel/MicrosoftExcel.node.ts',
    currentNodePath: 'packages/nodes-base/nodes/Microsoft/Excel/v2/MicrosoftExcelV2.node.ts',
    versionDescriptionPath: 'packages/nodes-base/nodes/Microsoft/Excel/v2/actions/versionDescription.ts',
    metadataPath: 'packages/nodes-base/nodes/Microsoft/Excel/MicrosoftExcel.node.json',
    actionRoot: 'packages/nodes-base/nodes/Microsoft/Excel/v2/actions',
    targetDescriptionPath: 'packages/nodes-base/nodes/Microsoft/Excel/v2/descriptions/TargetDescription.ts',
    methodPaths: [
      'packages/nodes-base/nodes/Microsoft/Excel/v2/methods/listSearch.ts',
      'packages/nodes-base/nodes/Microsoft/Excel/v2/methods/loadOptions.ts',
    ],
    credentialPaths: [
      'packages/nodes-base/credentials/MicrosoftExcelOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/MicrosoftOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/MicrosoftEntraServicePrincipalApi.credentials.ts',
      'packages/nodes-base/credentials/OAuth2Api.credentials.ts',
    ],
    iconPath: 'packages/nodes-base/nodes/Microsoft/Excel/excel.svg',
    excludedSiblingPath: 'packages/nodes-base/nodes/Microsoft/Excel/MicrosoftExcelSharePoint.node.ts',
  },
  resources: [
    { value: 'table', defaultOperation: 'append', operations: tableOperations.map(({ value }) => value) },
    { value: 'workbook', defaultOperation: 'getAll', operations: workbookOperations.map(({ value }) => value) },
    { value: 'worksheet', defaultOperation: 'getAll', operations: worksheetOperations.map(({ value }) => value) },
  ],
  credentialRequirements: [
    {
      type: 'microsoftExcelOAuth2Api', name: 'Microsoft Excel OAuth2 API', required: true, inert: true,
      showWhen: { authentication: ['microsoftExcelOAuth2Api'] }, extends: ['microsoftOAuth2Api', 'oAuth2Api'],
      documentationUrl: 'microsoft', defaultScopes: ['openid', 'offline_access', 'Files.ReadWrite'], fields: excelOAuthFields,
    },
    {
      type: 'microsoftOAuth2Api', name: 'Microsoft OAuth2 API', required: true, inert: true,
      showWhen: { authentication: ['microsoftOAuth2Api'] }, extends: ['oAuth2Api'], documentationUrl: 'microsoft',
      fields: genericMicrosoftOAuthFields,
    },
    {
      type: 'microsoftEntraServicePrincipalApi', name: 'Microsoft Entra Service Principal', required: true, inert: true,
      showWhen: { authentication: ['microsoftEntraServicePrincipalApi'] }, documentationUrl: 'microsoftentra',
      testedBy: 'GET {{$credentials.graphApiBaseUrl || "https://graph.microsoft.com"}}/v1.0/organization', fields: servicePrincipalFields,
    },
  ],
  credentialUiMetadata: [
    { key: 'excelOAuthCredential', type: 'microsoftExcelOAuth2Api', label: 'Microsoft Excel OAuth2 API', showWhen: { authentication: ['microsoftExcelOAuth2Api'] }, extends: ['microsoftOAuth2Api', 'oAuth2Api'], fields: excelOAuthFields, renderedInCredentialEditor: false, inert: true },
    { key: 'microsoftGraphOAuthCredential', type: 'microsoftOAuth2Api', label: 'Microsoft OAuth2 API', showWhen: { authentication: ['microsoftOAuth2Api'] }, extends: ['oAuth2Api'], fields: genericMicrosoftOAuthFields, renderedInCredentialEditor: false, inert: true },
    { key: 'entraServicePrincipalCredential', type: 'microsoftEntraServicePrincipalApi', label: 'Microsoft Entra Service Principal', showWhen: { authentication: ['microsoftEntraServicePrincipalApi'] }, fields: servicePrincipalFields, renderedInCredentialEditor: false, inert: true },
  ],
  params: [
    {
      key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'select', sourceKind: 'options',
      value: 'microsoftExcelOAuth2Api', required: false, noDataExpression: true,
      options: [
        { label: 'Excel OAuth2', value: 'microsoftExcelOAuth2Api' },
        {
          label: 'Microsoft OAuth2 (Graph)', value: 'microsoftOAuth2Api',
          description: 'Generic Microsoft Graph credential. Enable the scopes this node needs, such as Files.ReadWrite or Files.ReadWrite.All.',
        },
        {
          label: 'Microsoft Entra Service Principal (App-Only)', value: 'microsoftEntraServicePrincipalApi',
          description: 'App-only access via a Microsoft Entra app registration. Choose which user or drive to act on under "Access As".',
        },
      ],
    },
    {
      key: 'excelOAuthCredential', n8nKey: 'credentials.microsoftExcelOAuth2Api', label: 'Credential to connect with',
      kind: 'select', sourceKind: 'credentials', value: 'microsoftExcelOAuth2Api', required: true, locked: true, dynamic: true,
      showWhen: { authentication: ['microsoftExcelOAuth2Api'] }, options: [{ label: 'Microsoft Excel OAuth2 API', value: 'microsoftExcelOAuth2Api' }],
      simulationNote: lockedCredentialNote,
    },
    {
      key: 'microsoftGraphOAuthCredential', n8nKey: 'credentials.microsoftOAuth2Api', label: 'Credential to connect with',
      kind: 'select', sourceKind: 'credentials', value: 'microsoftOAuth2Api', required: true, locked: true, dynamic: true,
      showWhen: { authentication: ['microsoftOAuth2Api'] }, options: [{ label: 'Microsoft OAuth2 API', value: 'microsoftOAuth2Api' }],
      simulationNote: lockedCredentialNote,
    },
    {
      key: 'entraServicePrincipalCredential', n8nKey: 'credentials.microsoftEntraServicePrincipalApi', label: 'Credential to connect with',
      kind: 'select', sourceKind: 'credentials', value: 'microsoftEntraServicePrincipalApi', required: true, locked: true, dynamic: true,
      showWhen: { authentication: ['microsoftEntraServicePrincipalApi'] }, options: [{ label: 'Microsoft Entra Service Principal', value: 'microsoftEntraServicePrincipalApi' }],
      simulationNote: lockedCredentialNote,
    },
    {
      key: 'resourceTarget', n8nKey: 'resourceTarget', label: 'Access As', kind: 'select', sourceKind: 'options',
      value: 'user', required: false, noDataExpression: true,
      options: [
        { label: 'User', value: 'user', description: "Act on a user's drive (by UPN or user ID)" },
        { label: 'Drive', value: 'drive', description: 'Act on a specific drive (by drive ID, e.g. a SharePoint document library)' },
      ],
      description: 'Which drive the Service Principal should act on (app-only has no personal drive)',
      showWhen: { authentication: ['microsoftEntraServicePrincipalApi'] },
    },
    {
      key: 'userTarget', n8nKey: 'userTarget', label: 'User', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'id', value: '' }, sourceDefault: { mode: 'id', value: '' }, required: true,
      modes: ['id'], modeOptions: [{
        label: 'By ID', value: 'id', kind: 'text', placeholder: 'e.g. jane@contoso.com or a user object ID',
        hint: 'The user principal name (UPN) or object ID of the user whose drive holds the workbooks',
      }], options: [],
      description: "The user whose drive the Service Principal should act on. Evaluated per input item — an expression can target a different user for each item. Operations that write all rows in one request (append, update, upsert) use the first item's target.",
      showWhen: { authentication: ['microsoftEntraServicePrincipalApi'], resourceTarget: ['user'] },
      n8nShowWhen: { authentication: ['microsoftEntraServicePrincipalApi'], resourceTarget: ['user'] },
    },
    {
      key: 'driveTarget', n8nKey: 'driveTarget', label: 'Drive', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'id', value: '' }, sourceDefault: { mode: 'id', value: '' }, required: true,
      modes: ['id'], modeOptions: [{
        label: 'By ID', value: 'id', kind: 'text', placeholder: 'e.g. b!abc123...',
        hint: "The drive's own ID (looks like `b!…`), not a file or folder ID. Get it from `GET /users/{upn}/drive` (the `id` field).",
      }], options: [],
      description: "The drive the Service Principal should act on. Evaluated per input item — an expression can target a different drive for each item. Operations that write all rows in one request (append, update, upsert) use the first item's target.",
      showWhen: { authentication: ['microsoftEntraServicePrincipalApi'], resourceTarget: ['drive'] },
      n8nShowWhen: { authentication: ['microsoftEntraServicePrincipalApi'], resourceTarget: ['drive'] },
    },
    {
      key: 'cloudWorkbookNotice', n8nKey: 'notice',
      label: 'This node works with workbooks stored in OneDrive on the Microsoft 365 cloud platform. Use the Extract from File and Convert to File nodes to directly manipulate spreadsheet files (.xls, .csv, etc).',
      kind: 'notice', value: '', required: false,
      sourceLabelHtml: 'This node works with workbooks stored in OneDrive on the Microsoft 365 cloud platform. Use the \'Extract from File\' and \'Convert to File\' nodes to directly manipulate spreadsheet files (.xls, .csv, etc). <a href="https://n8n.io/workflows/890-read-in-an-excel-spreadsheet-file/" target="_blank">More info</a>.',
    },
    { key: 'resource', n8nKey: 'resource', label: 'Resource', kind: 'select', sourceKind: 'options', value: 'workbook', required: false, noDataExpression: true, options: resourceOptions },
    { key: 'tableOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'append', required: false, noDataExpression: true, showWhen: { resource: ['table'] }, options: tableOperations },
    { key: 'workbookOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'getAll', required: false, noDataExpression: true, showWhen: { resource: ['workbook'] }, options: workbookOperations },
    { key: 'worksheetOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'getAll', required: false, noDataExpression: true, showWhen: { resource: ['worksheet'] }, options: worksheetOperations },

    workbookLocator('tableAppend', 'table', 'append'),
    worksheetLocator('tableAppend', 'table', 'append'),
    tableLocator('tableAppend', 'append'),
    {
      key: 'tableAppendDataMode', n8nKey: 'dataMode', label: 'Data Mode', kind: 'select', sourceKind: 'options', value: 'define', required: false,
      options: dataModeOptions, ...operationWhen('table', 'append'),
    },
    {
      key: 'tableAppendData', n8nKey: 'data', label: 'Data', kind: 'textarea', sourceKind: 'json', value: '', required: true, rows: 5,
      placeholder: 'e.g. [["Sara","1/2/2006","Berlin"],["George","5/3/2010","Paris"]]',
      description: 'Raw values for the specified range as array of string arrays in JSON format',
      ...operationWhen('table', 'append', { tableAppendDataMode: ['raw'] }, { dataMode: ['raw'] }),
    },
    valuesToSend('tableAppend', 'table', 'append', 'getTableColumns', ['table.value', 'worksheet.value', 'workbook.value'], true),
    {
      key: 'tableAppendOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection', value: {}, required: false,
      addLabel: 'Add option', ...operationWhen('table', 'append'),
      fields: [
        {
          key: 'tableAppendOptionsIndex', n8nKey: 'index', label: 'Index', kind: 'number', value: 0, required: false, min: 0,
          description: 'Specifies the relative position of the new row. If not defined, the addition happens at the end. Any row below the inserted row will be shifted downwards. First row index is 0.',
        },
        ...rawDataOptionFields('tableAppendOptions'),
      ],
    },

    workbookLocator('tableCreate', 'table', 'addTable'),
    worksheetLocator('tableCreate', 'table', 'addTable'),
    {
      key: 'tableCreateSelectRange', n8nKey: 'selectRange', label: 'Select Range', kind: 'select', sourceKind: 'options', value: 'auto', required: false,
      options: [
        { label: 'Automatically', value: 'auto', description: 'The whole used range on the selected sheet will be converted into a table' },
        { label: 'Manually', value: 'manual', description: 'Select a range that will be converted into a table' },
      ], ...operationWhen('table', 'addTable'),
    },
    {
      key: 'tableCreateRange', n8nKey: 'range', label: 'Range', kind: 'text', value: '', required: false, placeholder: 'A1:B2',
      description: 'The range of cells that will be converted to a table',
      ...operationWhen('table', 'addTable', { tableCreateSelectRange: ['manual'] }, { selectRange: ['manual'] }),
    },
    {
      key: 'tableCreateHasHeaders', n8nKey: 'hasHeaders', label: 'Has Headers', kind: 'boolean', value: true, required: false,
      description: 'Whether the range has column labels. When this property set to false Excel will automatically generate header shifting the data down by one row.',
      ...operationWhen('table', 'addTable'),
    },

    workbookLocator('tableConvertToRange', 'table', 'convertToRange'),
    worksheetLocator('tableConvertToRange', 'table', 'convertToRange'),
    tableLocator('tableConvertToRange', 'convertToRange'),
    workbookLocator('tableDelete', 'table', 'deleteTable'),
    worksheetLocator('tableDelete', 'table', 'deleteTable'),
    tableLocator('tableDelete', 'deleteTable'),

    workbookLocator('tableGetColumns', 'table', 'getColumns'),
    worksheetLocator('tableGetColumns', 'table', 'getColumns'),
    tableLocator('tableGetColumns', 'getColumns'),
    ...returnManyFields('tableGetColumns', 'table', 'getColumns'),
    {
      key: 'tableGetColumnsRawData', n8nKey: 'rawData', label: 'RAW Data', kind: 'boolean', value: false, required: false,
      description: 'Whether the data should be returned RAW instead of parsed into keys according to their header', ...operationWhen('table', 'getColumns'),
    },
    {
      key: 'tableGetColumnsDataProperty', n8nKey: 'dataProperty', label: 'Data Property', kind: 'text', value: 'data', required: false,
      description: 'The name of the property into which to write the RAW data',
      ...operationWhen('table', 'getColumns', { tableGetColumnsRawData: [true] }, { rawData: [true] }),
    },
    {
      key: 'tableGetColumnsFilters', n8nKey: 'filters', label: 'Filters', kind: 'collection', sourceKind: 'collection', value: {}, required: false,
      addLabel: 'Add Filter', ...operationWhen('table', 'getColumns', { tableGetColumnsRawData: [true] }, { rawData: [true] }),
      fields: [{ key: 'tableGetColumnsFilterFields', n8nKey: 'fields', label: 'Fields', kind: 'text', value: '', required: false, description: 'A comma-separated list of the fields to include in the response' }],
    },

    workbookLocator('tableGetRows', 'table', 'getRows'),
    worksheetLocator('tableGetRows', 'table', 'getRows'),
    tableLocator('tableGetRows', 'getRows'),
    ...returnManyFields('tableGetRows', 'table', 'getRows'),
    {
      key: 'tableGetRowsRawData', n8nKey: 'rawData', label: 'RAW Data', kind: 'boolean', value: false, required: false,
      description: 'Whether the data should be returned RAW instead of parsed into keys according to their header', ...operationWhen('table', 'getRows'),
    },
    {
      key: 'tableGetRowsDataProperty', n8nKey: 'dataProperty', label: 'Data Property', kind: 'text', value: 'data', required: false,
      description: 'The name of the property into which to write the RAW data',
      ...operationWhen('table', 'getRows', { tableGetRowsRawData: [true] }, { rawData: [true] }),
    },
    {
      key: 'tableGetRowsFilters', n8nKey: 'filters', label: 'Filters', kind: 'collection', sourceKind: 'collection', value: {}, required: false,
      addLabel: 'Add Filter', ...operationWhen('table', 'getRows'),
      fields: [
        {
          key: 'tableGetRowsFilterFields', n8nKey: 'fields', label: 'Fields', kind: 'text', value: '', required: false,
          description: 'A comma-separated list of the fields to include in the response',
          showWhen: { tableGetRowsRawData: [true] }, n8nShowWhen: { '/rawData': [true] },
        },
        {
          key: 'tableGetRowsFilterColumns', n8nKey: 'column', label: 'Column Names or IDs', kind: 'multiSelect', sourceKind: 'multiOptions',
          value: [], required: false, options: [], locked: true, dynamic: true,
          loadOptionsMethod: 'getTableColumns', loadOptionsDependsOn: ['table.value', 'worksheet.value', 'workbook.value'],
          description: 'Choose from the list, or specify IDs using an expression.',
          showWhen: { tableGetRowsRawData: [false] }, n8nShowWhen: { '/rawData': [false] }, simulationNote: lockedColumnNote,
        },
      ],
    },

    workbookLocator('tableLookup', 'table', 'lookup'),
    worksheetLocator('tableLookup', 'table', 'lookup'),
    tableLocator('tableLookup', 'lookup'),
    {
      key: 'tableLookupColumn', n8nKey: 'lookupColumn', label: 'Lookup Column', kind: 'text', value: '', required: true, placeholder: 'Email',
      description: 'The name of the column in which to look for value', ...operationWhen('table', 'lookup'),
    },
    {
      key: 'tableLookupValue', n8nKey: 'lookupValue', label: 'Lookup Value', kind: 'text', value: '', required: true, placeholder: 'frank@example.com',
      description: 'The value to look for in column', ...operationWhen('table', 'lookup'),
    },
    {
      key: 'tableLookupOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection', value: {}, required: false,
      addLabel: 'Add option', ...operationWhen('table', 'lookup'), fields: [{
        key: 'tableLookupReturnAllMatches', n8nKey: 'returnAllMatches', label: 'Return All Matches', kind: 'boolean', value: false, required: false,
        description: 'By default only the first result gets returned. If options gets set all found matches get returned.',
      }],
    },

    workbookLocator('workbookAddSheet', 'workbook', 'addWorksheet'),
    {
      key: 'workbookAddSheetOptions', n8nKey: 'additionalFields', label: 'Options', kind: 'collection', sourceKind: 'collection', value: {}, required: false,
      addLabel: 'Add option', ...operationWhen('workbook', 'addWorksheet'), fields: [{
        key: 'workbookAddSheetName', n8nKey: 'name', label: 'Name', kind: 'text', value: '', required: false,
        description: 'The name of the sheet to be added. The name should be unique. If not specified, Excel will determine the name of the new worksheet.',
      }],
    },
    workbookLocator('workbookDelete', 'workbook', 'deleteWorkbook'),
    ...returnManyFields('workbookGetAll', 'workbook', 'getAll'),
    {
      key: 'workbookGetAllFilters', n8nKey: 'filters', label: 'Filters', kind: 'collection', sourceKind: 'collection', value: {}, required: false,
      addLabel: 'Add Filter', ...operationWhen('workbook', 'getAll'), fields: [{
        key: 'workbookGetAllFilterFields', n8nKey: 'fields', label: 'Fields', kind: 'text', value: '', required: false,
        description: 'A comma-separated list of the fields to include in the response',
      }],
    },

    workbookLocator('worksheetAppend', 'worksheet', 'append'),
    worksheetLocator('worksheetAppend', 'worksheet', 'append'),
    {
      key: 'worksheetAppendDataMode', n8nKey: 'dataMode', label: 'Data Mode', kind: 'select', sourceKind: 'options', value: 'define', required: false,
      options: dataModeOptions, ...operationWhen('worksheet', 'append'),
    },
    {
      key: 'worksheetAppendData', n8nKey: 'data', label: 'Data', kind: 'textarea', sourceKind: 'json', value: '', required: true, rows: 5,
      placeholder: 'e.g. [["Sara","1/2/2006","Berlin"],["George","5/3/2010","Paris"]]',
      description: 'Raw values for the specified range as array of string arrays in JSON format',
      ...operationWhen('worksheet', 'append', { worksheetAppendDataMode: ['raw'] }, { dataMode: ['raw'] }),
    },
    valuesToSend('worksheetAppend', 'worksheet', 'append', 'getWorksheetColumnRow', ['worksheet.value']),
    {
      key: 'worksheetAppendOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection', value: {}, required: false,
      addLabel: 'Add option', ...operationWhen('worksheet', 'append'), fields: rawDataOptionFields('worksheetAppendOptions'),
    },

    workbookLocator('worksheetClear', 'worksheet', 'clear'),
    worksheetLocator('worksheetClear', 'worksheet', 'clear'),
    {
      key: 'worksheetClearApplyTo', n8nKey: 'applyTo', label: 'Apply To', kind: 'select', sourceKind: 'options', value: 'All', required: false,
      options: [
        { label: 'All', value: 'All', description: 'Clear data in cells and remove all formatting' },
        { label: 'Formats', value: 'Formats', description: 'Clear formatting(e.g. font size, color) of cells' },
        { label: 'Contents', value: 'Contents', description: 'Clear data contained in cells' },
      ], ...operationWhen('worksheet', 'clear'),
    },
    { key: 'worksheetClearUseRange', n8nKey: 'useRange', label: 'Select a Range', kind: 'boolean', value: false, required: false, ...operationWhen('worksheet', 'clear') },
    {
      key: 'worksheetClearRange', n8nKey: 'range', label: 'Range', kind: 'text', value: '', required: false, placeholder: 'e.g. A1:B2',
      description: 'The sheet range that would be cleared, specified using a A1-style notation', hint: 'Leave blank for entire worksheet',
      ...operationWhen('worksheet', 'clear', { worksheetClearUseRange: [true] }, { useRange: [true] }),
    },

    workbookLocator('worksheetDelete', 'worksheet', 'deleteWorksheet'),
    worksheetLocator('worksheetDelete', 'worksheet', 'deleteWorksheet'),
    workbookLocator('worksheetGetAll', 'worksheet', 'getAll'),
    ...returnManyFields('worksheetGetAll', 'worksheet', 'getAll'),
    {
      key: 'worksheetGetAllFilters', n8nKey: 'filters', label: 'Filters', kind: 'collection', sourceKind: 'collection', value: {}, required: false,
      addLabel: 'Add Filter', ...operationWhen('worksheet', 'getAll'), fields: [{
        key: 'worksheetGetAllFilterFields', n8nKey: 'fields', label: 'Fields', kind: 'text', value: '', required: false,
        description: 'A comma-separated list of the fields to include in the response',
      }],
    },

    workbookLocator('worksheetReadRows', 'worksheet', 'readRows'),
    worksheetLocator('worksheetReadRows', 'worksheet', 'readRows'),
    { key: 'worksheetReadRowsUseRange', n8nKey: 'useRange', label: 'Select a Range', kind: 'boolean', value: false, required: false, ...operationWhen('worksheet', 'readRows') },
    {
      key: 'worksheetReadRowsRange', n8nKey: 'range', label: 'Range', kind: 'text', value: '', required: false, placeholder: 'e.g. A1:B2',
      description: 'The sheet range to read the data from specified using a A1-style notation, has to be specific e.g A1:B5, generic ranges like A:B are not supported',
      hint: 'Leave blank to return entire sheet', ...operationWhen('worksheet', 'readRows', { worksheetReadRowsUseRange: [true] }, { useRange: [true] }),
    },
    {
      key: 'worksheetReadRowsKeyRow', n8nKey: 'keyRow', label: 'Header Row', kind: 'number', value: 0, required: false, min: 0,
      hint: 'Index of the row which contains the column names', description: "Relative to selected 'Range', first row index is 0",
      ...operationWhen('worksheet', 'readRows', { worksheetReadRowsUseRange: [true] }, { useRange: [true] }),
    },
    {
      key: 'worksheetReadRowsDataStartRow', n8nKey: 'dataStartRow', label: 'First Data Row', kind: 'number', value: 1, required: false, min: 0,
      hint: 'Index of first row which contains the actual data', description: "Relative to selected 'Range', first row index is 0",
      ...operationWhen('worksheet', 'readRows', { worksheetReadRowsUseRange: [true] }, { useRange: [true] }),
    },
    {
      key: 'worksheetReadRowsOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection', value: {}, required: false,
      addLabel: 'Add option', ...operationWhen('worksheet', 'readRows'), fields: rawDataOptionFields('worksheetReadRowsOptions', true),
    },

    workbookLocator('worksheetUpdate', 'worksheet', 'update'),
    worksheetLocator('worksheetUpdate', 'worksheet', 'update'),
    { key: 'worksheetUpdateUseRange', n8nKey: 'useRange', label: 'Select a Range', kind: 'boolean', value: false, required: false, ...operationWhen('worksheet', 'update') },
    {
      key: 'worksheetUpdateMappedRange', n8nKey: 'range', label: 'Range', kind: 'text', value: '', required: false, placeholder: 'e.g. A1:B2',
      description: 'The sheet range to read the data from specified using a A1-style notation, has to be specific e.g A1:B5, generic ranges like A:B are not supported. Leave blank to use whole used range in the sheet.',
      hint: 'First row must contain column names',
      ...operationWhen('worksheet', 'update', { worksheetUpdateDataMode: ['autoMap', 'define'], worksheetUpdateUseRange: [true] }, { dataMode: ['autoMap', 'define'], useRange: [true] }),
    },
    {
      key: 'worksheetUpdateRawRange', n8nKey: 'range', label: 'Range', kind: 'text', value: '', required: false, placeholder: 'e.g. A1:B2',
      description: 'The sheet range to read the data from specified using a A1-style notation', hint: 'Leave blank for entire worksheet',
      ...operationWhen('worksheet', 'update', { worksheetUpdateDataMode: ['raw'], worksheetUpdateUseRange: [true] }, { dataMode: ['raw'], useRange: [true] }),
    },
    {
      key: 'worksheetUpdateDataMode', n8nKey: 'dataMode', label: 'Data Mode', kind: 'select', sourceKind: 'options', value: 'define', required: false,
      options: [
        dataModeOptions[0], dataModeOptions[1],
        { label: 'Raw', value: 'raw', description: 'Send raw data as JSON, the whole selected range would be updated with the new values' },
      ], ...operationWhen('worksheet', 'update'),
    },
    {
      key: 'worksheetUpdateData', n8nKey: 'data', label: 'Data', kind: 'textarea', sourceKind: 'json', value: '', required: true, rows: 5,
      placeholder: 'e.g. [["Sara","1/2/2006","Berlin"],["George","5/3/2010","Paris"]]',
      description: 'Raw values for the specified range as array of string arrays in JSON format. Should match the specified range: one array item for each row.',
      ...operationWhen('worksheet', 'update', { worksheetUpdateDataMode: ['raw'] }, { dataMode: ['raw'] }),
    },
    {
      key: 'worksheetUpdateColumnToMatchOn', n8nKey: 'columnToMatchOn', label: 'Column to match on', kind: 'select', sourceKind: 'options',
      value: '', required: false, options: [], locked: true, dynamic: true,
      loadOptionsMethod: 'getWorksheetColumnRow', loadOptionsDependsOn: ['worksheet.value', 'workbook.value', 'range'],
      description: 'Choose from the list, or specify an ID using an expression', hint: "Used to find the correct row to update. Doesn't get changed.",
      ...operationWhen('worksheet', 'update', { worksheetUpdateDataMode: ['autoMap', 'define'] }, { dataMode: ['autoMap', 'define'] }), simulationNote: lockedColumnNote,
    },
    {
      key: 'worksheetUpdateValueToMatchOn', n8nKey: 'valueToMatchOn', label: 'Value of Column to Match On', kind: 'text', value: '', required: false,
      ...operationWhen('worksheet', 'update', { worksheetUpdateDataMode: ['define'] }, { dataMode: ['define'] }),
    },
    valuesToSend('worksheetUpdate', 'worksheet', 'update', 'getWorksheetColumnRowSkipColumnToMatchOn', ['columnToMatchOn', 'range']),
    {
      key: 'worksheetUpdateOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection', value: {}, required: false,
      addLabel: 'Add option', ...operationWhen('worksheet', 'update'),
      fields: [
        ...rawDataOptionFields('worksheetUpdateOptions', true),
        {
          key: 'worksheetUpdateOptionsUpdateAll', n8nKey: 'updateAll', label: 'Update All Matches', kind: 'boolean', value: false, required: false,
          description: 'Whether to update all matching rows or just the first match',
          showWhen: { worksheetUpdateDataMode: ['autoMap', 'define'] }, n8nHideWhen: { '/dataMode': ['raw'] },
        },
      ],
    },

    workbookLocator('worksheetUpsert', 'worksheet', 'upsert'),
    worksheetLocator('worksheetUpsert', 'worksheet', 'upsert'),
    { key: 'worksheetUpsertUseRange', n8nKey: 'useRange', label: 'Select a Range', kind: 'boolean', value: false, required: false, ...operationWhen('worksheet', 'upsert') },
    {
      key: 'worksheetUpsertRange', n8nKey: 'range', label: 'Range', kind: 'text', value: '', required: false, placeholder: 'e.g. A1:B2',
      description: 'The sheet range to read the data from specified using a A1-style notation, has to be specific e.g A1:B5, generic ranges like A:B are not supported. Leave blank to use whole used range in the sheet.',
      hint: 'First row must contain column names',
      ...operationWhen('worksheet', 'upsert', { worksheetUpsertDataMode: ['autoMap', 'define'], worksheetUpsertUseRange: [true] }, { dataMode: ['autoMap', 'define'], useRange: [true] }),
    },
    {
      key: 'worksheetUpsertDataMode', n8nKey: 'dataMode', label: 'Data Mode', kind: 'select', sourceKind: 'options', value: 'define', required: false,
      options: [dataModeOptions[0], dataModeOptions[1]], ...operationWhen('worksheet', 'upsert'),
    },
    {
      key: 'worksheetUpsertColumnToMatchOn', n8nKey: 'columnToMatchOn', label: 'Column to match on', kind: 'select', sourceKind: 'options',
      value: '', required: false, options: [], locked: true, dynamic: true,
      loadOptionsMethod: 'getWorksheetColumnRow', loadOptionsDependsOn: ['worksheet.value', 'workbook.value', 'range'],
      description: 'Choose from the list, or specify an ID using an expression', hint: "Used to find the correct row to update. Doesn't get changed.",
      ...operationWhen('worksheet', 'upsert', { worksheetUpsertDataMode: ['autoMap', 'define'] }, { dataMode: ['autoMap', 'define'] }), simulationNote: lockedColumnNote,
    },
    {
      key: 'worksheetUpsertValueToMatchOn', n8nKey: 'valueToMatchOn', label: 'Value of Column to Match On', kind: 'text', value: '', required: false,
      ...operationWhen('worksheet', 'upsert', { worksheetUpsertDataMode: ['define'] }, { dataMode: ['define'] }),
    },
    valuesToSend('worksheetUpsert', 'worksheet', 'upsert', 'getWorksheetColumnRowSkipColumnToMatchOn', ['columnToMatchOn', 'range']),
    {
      key: 'worksheetUpsertOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection', value: {}, required: false,
      addLabel: 'Add option', ...operationWhen('worksheet', 'upsert'), fields: [
        {
          key: 'worksheetUpsertOptionsAppendAfterSelectedRange', n8nKey: 'appendAfterSelectedRange', label: 'Append After Selected Range',
          kind: 'boolean', value: false, required: false, description: 'Whether to append data after the selected range or used range',
          showWhen: { worksheetUpsertDataMode: ['autoMap', 'define'], worksheetUpsertUseRange: [true] },
          n8nShowWhen: { '/dataMode': ['autoMap', 'define'], '/useRange': [true] },
        },
        ...rawDataOptionFields('worksheetUpsertOptions'),
        {
          key: 'worksheetUpsertOptionsUpdateAll', n8nKey: 'updateAll', label: 'Update All Matches', kind: 'boolean', value: false, required: false,
          description: 'Whether to update all matching rows or just the first match',
        },
      ],
    },
  ],
  resourceOperationParity: {
    table: { expected: ['append', 'convertToRange', 'addTable', 'deleteTable', 'getColumns', 'getRows', 'lookup'], represented: tableOperations.map(({ value }) => value), default: 'append' },
    workbook: { expected: ['addWorksheet', 'deleteWorkbook', 'getAll'], represented: workbookOperations.map(({ value }) => value), default: 'getAll' },
    worksheet: { expected: ['append', 'upsert', 'clear', 'deleteWorksheet', 'getAll', 'readRows', 'update'], represented: worksheetOperations.map(({ value }) => value), default: 'getAll' },
  },
  operationCount: 17,
  lookupMetadata: {
    searchWorkbooks: { parameter: 'workbook', searchable: true, paginated: true, disabledForAuthentication: ['microsoftEntraServicePrincipalApi'], networkAccess: false },
    getWorksheetsList: { parameter: 'worksheet', dependsOn: ['workbook.value'], networkAccess: false },
    getWorksheetTables: { parameter: 'table', dependsOn: ['workbook.value', 'worksheet.value'], networkAccess: false },
    getTableColumns: { parameters: ['fieldsUi.values.column', 'filters.column'], dependsOn: ['workbook.value', 'worksheet.value', 'table.value'], networkAccess: false },
    getWorksheetColumnRow: { parameters: ['fieldsUi.values.column', 'columnToMatchOn'], dependsOn: ['workbook.value', 'worksheet.value', 'range'], networkAccess: false },
    getWorksheetColumnRowSkipColumnToMatchOn: { parameter: 'fieldsUi.values.column', dependsOn: ['columnToMatchOn', 'range'], networkAccess: false },
  },
  versionBranches: [
    { versions: 1, implementation: 'MicrosoftExcelV1', representedInCurrentParams: false },
    { versions: [2, 2.1, 2.2], implementation: 'MicrosoftExcelV2', representedInCurrentParams: true },
  ],
  docsSummary: {
    operationsListed: {
      table: ['append', 'getColumns', 'getRows', 'lookup'],
      workbook: ['addWorksheet', 'getAll'],
      worksheet: ['getAll', 'readRows'],
    },
    sourceOnlyOperations: ['table.convertToRange', 'table.addTable', 'table.deleteTable', 'workbook.deleteWorkbook', 'worksheet.append', 'worksheet.upsert', 'worksheet.clear', 'worksheet.deleteWorksheet', 'worksheet.update'],
    aiToolDocumented: true,
    credentialMethods: ['microsoftExcelOAuth2Api', 'microsoftOAuth2Api', 'microsoftEntraServicePrincipalApi'],
    cloudSupport: ['Global', 'US Government', 'US Government DOD', 'China'],
  },
  platformGaps: [
    'The native node reuses operation, workbook, worksheet, table, dataMode, data, fieldsUi, options, returnAll, limit, filters, rawData, dataProperty, range, useRange, columnToMatchOn, and valueToMatchOn across conditional branches. Unique UI keys keep every branch stable while n8nKey records the real parameter name.',
    'Workbook, sheet, table, and column discovery normally call Microsoft Graph. Resource-locator list modes and dynamic column options remain locked and empty; manually supplied IDs remain authorable.',
    'The workbook list search is unavailable with the Service Principal credential in source. This limitation is retained in lookupMetadata; no search method runs in the simulation for any credential.',
    'Native json editors are normalized to supported textarea controls. Their string defaults and JSON-array examples are preserved, but input parsing never runs.',
    'Source boolean fields with numeric default 0 are normalized to false for the local renderer and retain sourceDefault: 0.',
    'Credential editors are metadata-only. OAuth consent, refresh, certificate signing, app-only token exchange, credential tests, secret access, and sovereign-cloud requests never run.',
    'The public node page currently lists only 8 of the 17 pinned v2.2 operations. The pinned implementation is the parity authority for the 9 additional authoring operations.',
    'Only the OneDrive-backed Microsoft Excel action node is represented. The SharePoint-specific alternate node, triggers, v1 controls, router, transport, workbook-session handling, and runtime are excluded.',
    'usableAsTool is preserved as capability metadata; no tool connector or executable AI-tool runtime is exposed.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials', sourceType: 'credentials', normalizedKind: 'locked select', reason: 'Credential discovery and credential editors are unavailable.' },
    { n8nKey: 'workbook, worksheet, table', sourceType: 'resourceLocator with remote listSearch', normalizedKind: 'resourceLocator', reason: 'List modes remain empty because Microsoft Graph lookups are disabled.' },
    { n8nKey: 'fieldsUi.values.column, filters.column, columnToMatchOn', sourceType: 'options/multiOptions with loadOptionsMethod', normalizedKind: 'locked select/multiSelect', reason: 'Column discovery requires Microsoft Graph and workbook data.' },
    { n8nKey: 'data', sourceType: 'json', normalizedKind: 'textarea', reason: 'The catalog renderer has no JSON editor control.' },
    { n8nKey: 'privateKey, certificate', sourceType: 'multiline credential string', normalizedKind: 'textarea', reason: 'Credential material is schema metadata only and is never read or submitted.' },
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
    certificateSigning: false,
    servicePrincipalTokenExchange: false,
    targetResolution: false,
    workbookLookup: false,
    worksheetLookup: false,
    tableLookup: false,
    columnLookup: false,
    workbookSession: false,
    apiRequests: false,
    networkAccess: false,
    workbookRead: false,
    workbookWrite: false,
    worksheetRead: false,
    worksheetWrite: false,
    tableRead: false,
    tableWrite: false,
    rowRead: false,
    rowWrite: false,
    expressionEvaluation: false,
    toolExecution: false,
    voice: false,
  },
  output: {},
};

export default microsoftExcel;
