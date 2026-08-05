// Editor-only descriptor for n8n's Microsoft OneDrive v1.1 action node.
// OAuth, app-only token exchange, target resolution, Graph requests, searches,
// binary transfer, and every mutation remain inert in this simulation.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This selector is locked. The simulation never creates, reads, tests, refreshes, or applies Microsoft credentials.';

const graphCloudOptions = [
  { label: 'Global (https://graph.microsoft.com)', value: 'https://graph.microsoft.com' },
  { label: 'US Government (https://graph.microsoft.us)', value: 'https://graph.microsoft.us' },
  { label: 'US Government DOD (https://dod-graph.microsoft.us)', value: 'https://dod-graph.microsoft.us' },
  { label: 'China (https://microsoftgraph.chinacloudapi.cn)', value: 'https://microsoftgraph.chinacloudapi.cn' },
];

const microsoftOAuthCommonFields = [
  { key: 'useDynamicClientRegistration', label: 'Use Dynamic Client Registration', kind: 'hidden', value: false, required: false, sourceOrigin: 'oAuth2Api' },
  { key: 'grantType', label: 'Grant Type', kind: 'hidden', value: 'authorizationCode', required: false },
  { key: 'clientId', label: 'Client ID', kind: 'text', value: '', required: true, sourceOrigin: 'oAuth2Api' },
  {
    key: 'clientCredentialType', label: 'Authentication', kind: 'select', value: 'clientSecret', required: false,
    options: [
      { label: 'Client Secret', value: 'clientSecret' },
      { label: 'Certificate', value: 'certificate' },
    ],
    description: 'How n8n authenticates to Microsoft Entra when exchanging and refreshing tokens.',
  },
  {
    key: 'clientSecret', label: 'Client Secret', kind: 'text', value: '', required: true, password: true,
    showWhen: { clientCredentialType: ['clientSecret'] },
  },
  {
    key: 'privateKey', label: 'Private Key', kind: 'textarea', sourceKind: 'string', value: '', required: true,
    password: true, rows: 4, showWhen: { clientCredentialType: ['certificate'] },
    description: 'PEM-encoded RSA private key paired with the certificate uploaded to the Entra app registration.',
  },
  {
    key: 'certificate', label: 'Certificate', kind: 'textarea', sourceKind: 'string', value: '', required: true,
    password: true, rows: 4, showWhen: { clientCredentialType: ['certificate'] },
    description: 'PEM-encoded public certificate registered on the Entra app registration.',
  },
  {
    key: 'authUrl', label: 'Authorization URL', kind: 'text', value: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', required: false,
  },
  {
    key: 'accessTokenUrl', label: 'Access Token URL', kind: 'text', value: 'https://login.microsoftonline.com/common/oauth2/v2.0/token', required: false,
  },
  { key: 'authQueryParameters', label: 'Auth URI Query Parameters', kind: 'hidden', value: 'response_mode=query&prompt=select_account', required: false },
  { key: 'authentication', label: 'Authentication', kind: 'hidden', value: 'body', required: false },
  {
    key: 'graphApiBaseUrl', label: 'Microsoft Graph API Base URL', kind: 'select', value: 'https://graph.microsoft.com', required: false,
    options: graphCloudOptions, description: 'Select the endpoint for your Microsoft cloud environment.',
  },
];

const oneDriveOAuthFields = [
  ...microsoftOAuthCommonFields,
  { key: 'customScopes', label: 'Custom Scopes', kind: 'boolean', value: false, required: false, description: 'Define custom scopes' },
  {
    key: 'customScopesNotice',
    label: 'The default scopes needed for the node to work are already set, If you change these the node may not function correctly.',
    kind: 'notice', value: '', required: false, showWhen: { customScopes: [true] },
  },
  {
    key: 'enabledScopes', label: 'Enabled Scopes', kind: 'text',
    value: 'openid offline_access Files.ReadWrite.All', required: false, showWhen: { customScopes: [true] },
    description: 'Scopes that should be enabled',
  },
  {
    key: 'scope', label: 'Scope', kind: 'hidden',
    value: '={{$self["customScopes"] ? $self["enabledScopes"] : "openid offline_access Files.ReadWrite.All"}}', required: false,
  },
];

const genericMicrosoftOAuthFields = [
  ...microsoftOAuthCommonFields,
  { key: 'scope', label: 'Scope', kind: 'text', value: '', required: false, sourceOrigin: 'oAuth2Api' },
];

const servicePrincipalFields = [
  { key: 'accessToken', label: 'Access Token', kind: 'hidden', value: '', required: false, expirable: true },
  {
    key: 'authentication', label: 'Authentication', kind: 'select', value: 'clientSecret', required: false,
    options: [
      { label: 'Client Secret', value: 'clientSecret' },
      { label: 'Certificate', value: 'certificate' },
    ],
  },
  {
    key: 'setupNotice',
    label: 'App-only access uses application permissions that an admin must consent to. The connection test reads the organization, so the app needs Organization.Read.All or Directory.Read.All.',
    kind: 'notice', value: '', required: false,
  },
  {
    key: 'tenantId', label: 'Directory (Tenant) ID', kind: 'text', value: '', required: true,
    description: 'The Directory (tenant) ID from the app registration overview in the Microsoft Entra admin center',
  },
  {
    key: 'clientId', label: 'Application (Client) ID', kind: 'text', value: '', required: true,
    description: 'The Application (client) ID from the app registration overview',
  },
  {
    key: 'clientSecret', label: 'Client Secret', kind: 'text', value: '', required: true, password: true,
    showWhen: { authentication: ['clientSecret'] }, description: 'A client secret created under Certificates & secrets',
  },
  {
    key: 'privateKey', label: 'Private Key', kind: 'textarea', sourceKind: 'string', value: '', required: true,
    password: true, rows: 4, showWhen: { authentication: ['certificate'] },
    description: 'The PEM-encoded RSA private key matching the certificate uploaded to the app registration.',
  },
  {
    key: 'certificate', label: 'Certificate', kind: 'textarea', sourceKind: 'string', value: '', required: true,
    rows: 4, showWhen: { authentication: ['certificate'] },
    description: 'The PEM-encoded public certificate uploaded under Certificates & secrets on the app registration',
  },
  {
    key: 'graphApiBaseUrl', label: 'Microsoft Graph API Base URL', kind: 'select', value: 'https://graph.microsoft.com', required: false,
    options: graphCloudOptions, description: 'Select the endpoint for your Microsoft cloud environment.',
  },
];

const fileOperations = [
  { label: 'Copy', value: 'copy', description: 'Copy a file', action: 'Copy a file' },
  { label: 'Delete', value: 'delete', description: 'Delete a file', action: 'Delete a file' },
  { label: 'Download', value: 'download', description: 'Download a file', action: 'Download a file' },
  { label: 'Get', value: 'get', description: 'Get a file', action: 'Get a file' },
  { label: 'Move', value: 'move', description: 'Move a file', action: 'Move a file' },
  { label: 'Rename', value: 'rename', description: 'Rename a file', action: 'Rename a file' },
  { label: 'Search', value: 'search', description: 'Search a file', action: 'Search a file' },
  { label: 'Share', value: 'share', description: 'Share a file', action: 'Share a file' },
  { label: 'Upload', value: 'upload', description: 'Upload a file up to 4MB in size', action: 'Upload a file' },
];

const folderOperations = [
  { label: 'Create', value: 'create', description: 'Create a folder', action: 'Create a folder' },
  { label: 'Delete', value: 'delete', description: 'Delete a folder', action: 'Delete a folder' },
  { label: 'Get Children', value: 'getChildren', description: 'Get items inside a folder', action: 'Get items in a folder' },
  { label: 'Move', value: 'move', description: 'Move a folder', action: 'Move a folder' },
  { label: 'Rename', value: 'rename', description: 'Rename a folder', action: 'Rename a folder' },
  { label: 'Search', value: 'search', description: 'Search a folder', action: 'Search a folder' },
  { label: 'Share', value: 'share', description: 'Share a folder', action: 'Share a folder' },
];

const shareTypeOptions = [
  { label: 'View', value: 'view' },
  { label: 'Edit', value: 'edit' },
  { label: 'Embed', value: 'embed' },
];

const shareScopeOptions = [
  { label: 'Anonymous', value: 'anonymous' },
  { label: 'Organization', value: 'organization' },
];

const microsoftOneDrive = {
  type: 'microsoft-onedrive',
  n8nType: 'n8n-nodes-base.microsoftOneDrive',
  n8nVersion: 1.1,
  defaultVersion: 1.1,
  sourceDefaultVersion: 'highest declared version',
  versionHistory: [1, 1.1],
  label: 'Microsoft OneDrive',
  defaultName: 'Microsoft OneDrive',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Consume Microsoft OneDrive API',
  category: 'action',
  categories: ['Data & Storage'],
  group: ['input'],
  defaults: { name: 'Microsoft OneDrive' },
  inputs: ['main'],
  outputs: ['main'],
  usableAsTool: true,
  toolConnector: 'ai_tool',
  icon: '/node-icons/microsoft-onedrive.svg',
  n8nIcon: 'file:oneDrive.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 81, height: 81, viewBox: '0 0 81 81' },
  iconAssetSha256: 'ca11f9bae54b9b9a43e27afc09c2192d43f6ad34a9b1dbe422a3bd4bbb5f17bc',
  sourceIconAssetSha256: 'e4a9f983ff7d981a9782dcfd1264c3a2fafa55d62e74c379341499f4321a9d6c',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.microsoftonedrive/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/microsoft/',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Microsoft/OneDrive/MicrosoftOneDrive.node.ts',
    fileDescriptionPath: 'packages/nodes-base/nodes/Microsoft/OneDrive/FileDescription.ts',
    folderDescriptionPath: 'packages/nodes-base/nodes/Microsoft/OneDrive/FolderDescription.ts',
    targetDescriptionPath: 'packages/nodes-base/nodes/Microsoft/OneDrive/descriptions/TargetDescription.ts',
    metadataPath: 'packages/nodes-base/nodes/Microsoft/OneDrive/MicrosoftOneDrive.node.json',
    credentialPaths: [
      'packages/nodes-base/credentials/MicrosoftOneDriveOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/MicrosoftOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/MicrosoftEntraServicePrincipalApi.credentials.ts',
      'packages/nodes-base/credentials/OAuth2Api.credentials.ts',
    ],
    iconPath: 'packages/nodes-base/nodes/Microsoft/OneDrive/oneDrive.svg',
  },
  resources: [
    { value: 'file', defaultOperation: 'upload', operations: ['copy', 'delete', 'download', 'get', 'move', 'rename', 'search', 'share', 'upload'] },
    { value: 'folder', defaultOperation: 'getChildren', operations: ['create', 'delete', 'getChildren', 'move', 'rename', 'search', 'share'] },
  ],
  credentialRequirements: [
    {
      type: 'microsoftOneDriveOAuth2Api', name: 'Microsoft Drive OAuth2 API', required: true, inert: true,
      showWhen: { authentication: ['microsoftOneDriveOAuth2Api'] }, extends: ['microsoftOAuth2Api', 'oAuth2Api'],
      documentationUrl: 'microsoft', fields: oneDriveOAuthFields,
    },
    {
      type: 'microsoftOAuth2Api', name: 'Microsoft OAuth2 API', required: true, inert: true,
      showWhen: { authentication: ['microsoftOAuth2Api'] }, extends: ['oAuth2Api'],
      documentationUrl: 'microsoft', fields: genericMicrosoftOAuthFields,
    },
    {
      type: 'microsoftEntraServicePrincipalApi', name: 'Microsoft Entra Service Principal', required: true, inert: true,
      showWhen: { authentication: ['microsoftEntraServicePrincipalApi'] },
      documentationUrl: 'microsoftentra', fields: servicePrincipalFields,
    },
  ],
  params: [
    {
      key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'select', sourceKind: 'options',
      value: 'microsoftOneDriveOAuth2Api', required: false, noDataExpression: true,
      options: [
        { label: 'OneDrive OAuth2', value: 'microsoftOneDriveOAuth2Api' },
        {
          label: 'Microsoft OAuth2 (Graph)', value: 'microsoftOAuth2Api',
          description: 'Generic Microsoft Graph credential. Enable the scopes this node needs, such as Files.ReadWrite.All.',
        },
        {
          label: 'Microsoft Entra Service Principal (App-Only)', value: 'microsoftEntraServicePrincipalApi',
          description: 'App-only access via a Microsoft Entra app registration. Choose which user or drive to act on under “Access As”.',
        },
      ],
    },
    {
      key: 'oneDriveOAuthCredential', n8nKey: 'credentials.microsoftOneDriveOAuth2Api',
      label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials', value: 'microsoftOneDriveOAuth2Api',
      required: true, locked: true, dynamic: true, showWhen: { authentication: ['microsoftOneDriveOAuth2Api'] },
      options: [{ label: 'Microsoft Drive OAuth2 API', value: 'microsoftOneDriveOAuth2Api' }], simulationNote: lockedCredentialNote,
    },
    {
      key: 'microsoftGraphOAuthCredential', n8nKey: 'credentials.microsoftOAuth2Api',
      label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials', value: 'microsoftOAuth2Api',
      required: true, locked: true, dynamic: true, showWhen: { authentication: ['microsoftOAuth2Api'] },
      options: [{ label: 'Microsoft OAuth2 API', value: 'microsoftOAuth2Api' }], simulationNote: lockedCredentialNote,
    },
    {
      key: 'entraServicePrincipalCredential', n8nKey: 'credentials.microsoftEntraServicePrincipalApi',
      label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials', value: 'microsoftEntraServicePrincipalApi',
      required: true, locked: true, dynamic: true, showWhen: { authentication: ['microsoftEntraServicePrincipalApi'] },
      options: [{ label: 'Microsoft Entra Service Principal', value: 'microsoftEntraServicePrincipalApi' }], simulationNote: lockedCredentialNote,
    },
    {
      key: 'resourceTarget', n8nKey: 'resourceTarget', label: 'Access As', kind: 'select', sourceKind: 'options',
      value: 'user', required: false, noDataExpression: true,
      options: [
        { label: 'User', value: 'user', description: "Act on a user's OneDrive (by UPN or user ID)" },
        { label: 'Drive', value: 'drive', description: 'Act on a specific drive (by drive ID)' },
      ],
      description: 'Which drive the Service Principal should act on (app-only has no personal drive)',
      showWhen: { authentication: ['microsoftEntraServicePrincipalApi'] },
    },
    {
      key: 'userTarget', n8nKey: 'userTarget', label: 'User', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'id', value: '' }, sourceDefault: { mode: 'id', value: '' }, required: true,
      modes: ['id'], modeOptions: [
        {
          label: 'By ID', value: 'id', kind: 'text', placeholder: 'e.g. jane@contoso.com or a user object ID',
          hint: 'The user principal name (UPN) or object ID of the user whose OneDrive to use',
        },
      ], options: [],
      description: 'The user whose OneDrive the Service Principal should act on. Evaluated per input item, so an expression can target a different user for each item.',
      showWhen: { authentication: ['microsoftEntraServicePrincipalApi'], resourceTarget: ['user'] },
      n8nShowWhen: { authentication: ['microsoftEntraServicePrincipalApi'], resourceTarget: ['user'] },
    },
    {
      key: 'driveTarget', n8nKey: 'driveTarget', label: 'Drive', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'id', value: '' }, sourceDefault: { mode: 'id', value: '' }, required: true,
      modes: ['id'], modeOptions: [
        {
          label: 'By ID', value: 'id', kind: 'text', placeholder: 'e.g. b!abc123...',
          hint: "The drive's own ID (looks like `b!…`), not a file or folder ID. Get it from GET /users/{upn}/drive.",
        },
      ], options: [],
      description: 'The drive the Service Principal should act on. Evaluated per input item, so an expression can target a different drive for each item.',
      showWhen: { authentication: ['microsoftEntraServicePrincipalApi'], resourceTarget: ['drive'] },
      n8nShowWhen: { authentication: ['microsoftEntraServicePrincipalApi'], resourceTarget: ['drive'] },
    },
    {
      key: 'resource', n8nKey: 'resource', label: 'Resource', kind: 'select', sourceKind: 'options',
      value: 'file', required: false, noDataExpression: true,
      options: [
        { label: 'File', value: 'file' },
        { label: 'Folder', value: 'folder' },
      ],
    },
    {
      key: 'fileOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options',
      value: 'upload', required: false, noDataExpression: true, showWhen: { resource: ['file'] }, options: fileOperations,
    },
    {
      key: 'folderOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options',
      value: 'getChildren', required: false, noDataExpression: true, showWhen: { resource: ['folder'] }, options: folderOperations,
    },

    {
      key: 'fileCopyFileId', n8nKey: 'fileId', label: 'File ID', kind: 'text', value: '', required: false,
      showWhen: { resource: ['file'], fileOperation: ['copy'] }, n8nShowWhen: { resource: ['file'], operation: ['copy'] },
    },
    {
      key: 'fileCopyAdditionalFields', n8nKey: 'additionalFields', label: 'Additional Fields',
      kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Field',
      showWhen: { resource: ['file'], fileOperation: ['copy'] }, n8nShowWhen: { resource: ['file'], operation: ['copy'] },
      fields: [
        {
          key: 'name', label: 'Name', kind: 'text', value: '', required: false,
          description: "The new name for the copy. If this isn't provided, the same name will be used as the original.",
        },
      ],
    },
    {
      key: 'fileCopyParentReference', n8nKey: 'parentReference', label: 'Parent Reference',
      kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Parent Reference',
      description: 'Reference to the parent item the copy will be created in',
      showWhen: { resource: ['file'], fileOperation: ['copy'] }, n8nShowWhen: { resource: ['file'], operation: ['copy'] },
      fields: [
        { key: 'driveId', label: 'Drive ID', kind: 'text', value: '', required: false, description: 'Identifier of the drive instance that contains the item' },
        { key: 'driveType', label: 'Drive Type', kind: 'text', value: '', required: false, description: 'Identifies the type of drive' },
        { key: 'id', label: 'ID', kind: 'text', value: '', required: false, description: 'Identifier of the item in the drive' },
        { key: 'listId', label: 'List ID', kind: 'text', value: '', required: false, description: 'Identifier of the list' },
        { key: 'name', label: 'Name', kind: 'text', value: '', required: false, description: 'The name of the item being referenced' },
        { key: 'path', label: 'Path', kind: 'text', value: '', required: false, description: 'Path that can be used to navigate to the item' },
        { key: 'shareId', label: 'Share ID', kind: 'text', value: '', required: false, description: 'Identifier for a shared resource that can be accessed via the Shares API' },
        { key: 'siteId', label: 'Site ID', kind: 'text', value: '', required: false, description: 'Identifier of the site' },
      ],
    },
    {
      key: 'fileDeleteFileId', n8nKey: 'fileId', label: 'File ID', kind: 'text', value: '', required: false,
      description: 'Field ID', showWhen: { resource: ['file'], fileOperation: ['delete'] },
      n8nShowWhen: { resource: ['file'], operation: ['delete'] },
    },
    {
      key: 'fileDownloadFileId', n8nKey: 'fileId', label: 'File ID', kind: 'text', value: '', required: false,
      showWhen: { resource: ['file'], fileOperation: ['download'] }, n8nShowWhen: { resource: ['file'], operation: ['download'] },
    },
    {
      key: 'fileDownloadBinaryPropertyName', n8nKey: 'binaryPropertyName', label: 'Put Output File in Field',
      kind: 'text', value: 'data', required: true, hint: 'The name of the output binary field to put the file in',
      showWhen: { resource: ['file'], fileOperation: ['download'] }, n8nShowWhen: { resource: ['file'], operation: ['download'] },
    },
    {
      key: 'fileGetFileId', n8nKey: 'fileId', label: 'File ID', kind: 'text', value: '', required: false,
      description: 'Field ID', showWhen: { resource: ['file'], fileOperation: ['get'] },
      n8nShowWhen: { resource: ['file'], operation: ['get'] },
    },
    {
      key: 'fileMoveFileId', n8nKey: 'fileId', label: 'File ID', kind: 'text', value: '', required: true,
      description: 'ID of the file to move', showWhen: { resource: ['file'], fileOperation: ['move'] },
      n8nShowWhen: { resource: ['file'], operation: ['move'] },
    },
    {
      key: 'fileMoveDestinationFolderId', n8nKey: 'destinationFolderId', label: 'Destination Folder ID',
      kind: 'text', value: '', required: false, placeholder: 'root',
      description: "ID of the destination folder to move the item into. Use `root` for the drive's top-level folder.",
      showWhen: { resource: ['file'], fileOperation: ['move'] }, n8nShowWhen: { resource: ['file'], operation: ['move'] },
    },
    {
      key: 'fileMoveAdditionalFields', n8nKey: 'additionalFields', label: 'Additional Fields',
      kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Field',
      showWhen: { resource: ['file'], fileOperation: ['move'] }, n8nShowWhen: { resource: ['file'], operation: ['move'] },
      fields: [
        { key: 'name', label: 'New Name', kind: 'text', value: '', required: false, description: 'A new name for the file. If omitted, the existing name is kept.' },
      ],
    },
    {
      key: 'fileRenameItemId', n8nKey: 'itemId', label: 'Item ID', kind: 'text', value: '', required: false,
      description: 'ID of the file', showWhen: { resource: ['file'], fileOperation: ['rename'] },
      n8nShowWhen: { resource: ['file'], operation: ['rename'] },
    },
    {
      key: 'fileRenameNewName', n8nKey: 'newName', label: 'New Name', kind: 'text', value: '', required: false,
      description: 'New name for file', showWhen: { resource: ['file'], fileOperation: ['rename'] },
      n8nShowWhen: { resource: ['file'], operation: ['rename'] },
    },
    {
      key: 'fileSearchUnsupportedNotice', n8nKey: 'searchUnsupportedNotice',
      label: 'Search is not available with the Service Principal credential. App-only Microsoft Graph cannot search a drive — use File: Get, or switch to an OAuth2 credential.',
      kind: 'notice', value: '', required: false,
      showWhen: { resource: ['file'], fileOperation: ['search'], authentication: ['microsoftEntraServicePrincipalApi'] },
      n8nShowWhen: { resource: ['file'], operation: ['search'], authentication: ['microsoftEntraServicePrincipalApi'] },
    },
    {
      key: 'fileSearchQuery', n8nKey: 'query', label: 'Query', kind: 'text', value: '', required: false,
      description: 'The query text used to search for items. Values may be matched across filename, metadata, and file content.',
      showWhen: {
        resource: ['file'], fileOperation: ['search'],
        authentication: ['microsoftOneDriveOAuth2Api', 'microsoftOAuth2Api'],
      },
      n8nShowWhen: { resource: ['file'], operation: ['search'] },
      n8nHideWhen: { authentication: ['microsoftEntraServicePrincipalApi'] },
    },
    {
      key: 'fileShareServicePrincipalNotice', n8nKey: 'shareServicePrincipalNotice',
      label: 'With the Service Principal credential, creating a sharing link uses application permissions and may require additional tenant or admin configuration to succeed.',
      kind: 'notice', value: '', required: false,
      showWhen: { resource: ['file'], fileOperation: ['share'], authentication: ['microsoftEntraServicePrincipalApi'] },
      n8nShowWhen: { resource: ['file'], operation: ['share'], authentication: ['microsoftEntraServicePrincipalApi'] },
    },
    {
      key: 'fileShareFileId', n8nKey: 'fileId', label: 'File ID', kind: 'text', value: '', required: false,
      showWhen: { resource: ['file'], fileOperation: ['share'] }, n8nShowWhen: { resource: ['file'], operation: ['share'] },
    },
    {
      key: 'fileShareType', n8nKey: 'type', label: 'Type', kind: 'select', sourceKind: 'options',
      value: '', required: false, options: shareTypeOptions, description: 'The type of sharing link to create',
      showWhen: { resource: ['file'], fileOperation: ['share'] }, n8nShowWhen: { resource: ['file'], operation: ['share'] },
    },
    {
      key: 'fileShareScope', n8nKey: 'scope', label: 'Scope', kind: 'select', sourceKind: 'options',
      value: '', required: false, options: shareScopeOptions, description: 'The type of sharing link to create',
      showWhen: { resource: ['file'], fileOperation: ['share'] }, n8nShowWhen: { resource: ['file'], operation: ['share'] },
    },
    {
      key: 'fileUploadFileName', n8nKey: 'fileName', label: 'File Name', kind: 'text', value: '', required: false,
      description: 'The name the file should be saved as', showWhen: { resource: ['file'], fileOperation: ['upload'] },
      n8nShowWhen: { resource: ['file'], operation: ['upload'] },
    },
    {
      key: 'fileUploadParentId', n8nKey: 'parentId', label: 'Parent ID', kind: 'text', value: '', required: true,
      placeholder: 'root', description: "ID of the parent folder that will contain the file. Use `root` for the drive's top-level folder.",
      showWhen: { resource: ['file'], fileOperation: ['upload'] }, n8nShowWhen: { resource: ['file'], operation: ['upload'] },
    },
    {
      key: 'fileUploadBinaryData', n8nKey: 'binaryData', label: 'Binary File', kind: 'boolean', value: false, required: true,
      description: 'Whether the data to upload should be taken from binary field',
      showWhen: { resource: ['file'], fileOperation: ['upload'] }, n8nShowWhen: { resource: ['file'], operation: ['upload'] },
    },
    {
      key: 'fileUploadFileContent', n8nKey: 'fileContent', label: 'File Content', kind: 'text', value: '', required: true,
      placeholder: '', description: 'The text content of the file',
      showWhen: { resource: ['file'], fileOperation: ['upload'], fileUploadBinaryData: [false] },
      n8nShowWhen: { resource: ['file'], operation: ['upload'], binaryData: [false] },
    },
    {
      key: 'fileUploadBinaryPropertyName', n8nKey: 'binaryPropertyName', label: 'Input Binary Field',
      kind: 'text', value: 'data', required: true, placeholder: '',
      hint: 'The name of the input binary field containing the file to be written',
      showWhen: { resource: ['file'], fileOperation: ['upload'], fileUploadBinaryData: [true] },
      n8nShowWhen: { resource: ['file'], operation: ['upload'], binaryData: [true] },
    },

    {
      key: 'folderCreateName', n8nKey: 'name', label: 'Name', kind: 'text', value: '', required: true,
      placeholder: '/Pictures/2021', description: 'The name or path of the folder',
      showWhen: { resource: ['folder'], folderOperation: ['create'] }, n8nShowWhen: { resource: ['folder'], operation: ['create'] },
    },
    {
      key: 'folderCreateOptions', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Field',
      showWhen: { resource: ['folder'], folderOperation: ['create'] }, n8nShowWhen: { resource: ['folder'], operation: ['create'] },
      fields: [
        {
          key: 'parentFolderId', label: 'Parent Folder ID', kind: 'text', value: '', required: false,
          description: 'ID of the folder you want to crate the new folder in',
        },
      ],
    },
    {
      key: 'folderDeleteGetChildrenId', n8nKey: 'folderId', label: 'Folder ID', kind: 'text', value: '', required: true,
      description: 'The ID of the folder. Use `root` for the top-level folder.',
      hint: 'Use `root` for the top-level folder of the drive',
      showWhen: { resource: ['folder'], folderOperation: ['delete', 'getChildren'] },
      n8nShowWhen: { resource: ['folder'], operation: ['delete', 'getChildren'] },
    },
    {
      key: 'folderMoveFolderId', n8nKey: 'folderId', label: 'Folder ID', kind: 'text', value: '', required: true,
      description: 'ID of the folder to move', showWhen: { resource: ['folder'], folderOperation: ['move'] },
      n8nShowWhen: { resource: ['folder'], operation: ['move'] },
    },
    {
      key: 'folderMoveDestinationFolderId', n8nKey: 'destinationFolderId', label: 'Destination Folder ID',
      kind: 'text', value: '', required: false, placeholder: 'root',
      description: "ID of the destination folder to move the item into. Use `root` for the drive's top-level folder.",
      showWhen: { resource: ['folder'], folderOperation: ['move'] }, n8nShowWhen: { resource: ['folder'], operation: ['move'] },
    },
    {
      key: 'folderMoveAdditionalFields', n8nKey: 'additionalFields', label: 'Additional Fields',
      kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Field',
      showWhen: { resource: ['folder'], folderOperation: ['move'] }, n8nShowWhen: { resource: ['folder'], operation: ['move'] },
      fields: [
        { key: 'name', label: 'New Name', kind: 'text', value: '', required: false, description: 'A new name for the folder. If omitted, the existing name is kept.' },
      ],
    },
    {
      key: 'folderRenameItemId', n8nKey: 'itemId', label: 'Item ID', kind: 'text', value: '', required: false,
      description: 'ID of the folder', showWhen: { resource: ['folder'], folderOperation: ['rename'] },
      n8nShowWhen: { resource: ['folder'], operation: ['rename'] },
    },
    {
      key: 'folderRenameNewName', n8nKey: 'newName', label: 'New Name', kind: 'text', value: '', required: false,
      description: 'New name for folder', showWhen: { resource: ['folder'], folderOperation: ['rename'] },
      n8nShowWhen: { resource: ['folder'], operation: ['rename'] },
    },
    {
      key: 'folderSearchUnsupportedNotice', n8nKey: 'searchUnsupportedNotice',
      label: 'Search is not available with the Service Principal credential. App-only Microsoft Graph cannot search a drive — use Folder: Get Children, or switch to an OAuth2 credential.',
      kind: 'notice', value: '', required: false,
      showWhen: { resource: ['folder'], folderOperation: ['search'], authentication: ['microsoftEntraServicePrincipalApi'] },
      n8nShowWhen: { resource: ['folder'], operation: ['search'], authentication: ['microsoftEntraServicePrincipalApi'] },
    },
    {
      key: 'folderSearchQuery', n8nKey: 'query', label: 'Query', kind: 'text', value: '', required: false,
      description: 'The query text used to search for items. Values may be matched across filename, metadata, and file content.',
      showWhen: {
        resource: ['folder'], folderOperation: ['search'],
        authentication: ['microsoftOneDriveOAuth2Api', 'microsoftOAuth2Api'],
      },
      n8nShowWhen: { resource: ['folder'], operation: ['search'] },
      n8nHideWhen: { authentication: ['microsoftEntraServicePrincipalApi'] },
    },
    {
      key: 'folderShareServicePrincipalNotice', n8nKey: 'shareServicePrincipalNotice',
      label: 'With the Service Principal credential, creating a sharing link uses application permissions and may require additional tenant or admin configuration to succeed.',
      kind: 'notice', value: '', required: false,
      showWhen: { resource: ['folder'], folderOperation: ['share'], authentication: ['microsoftEntraServicePrincipalApi'] },
      n8nShowWhen: { resource: ['folder'], operation: ['share'], authentication: ['microsoftEntraServicePrincipalApi'] },
    },
    {
      key: 'folderShareFolderId', n8nKey: 'folderId', label: 'Folder ID', kind: 'text', value: '', required: false,
      description: 'File ID', showWhen: { resource: ['folder'], folderOperation: ['share'] },
      n8nShowWhen: { resource: ['folder'], operation: ['share'] },
    },
    {
      key: 'folderShareType', n8nKey: 'type', label: 'Type', kind: 'select', sourceKind: 'options',
      value: '', required: false, options: shareTypeOptions, description: 'The type of sharing link to create',
      showWhen: { resource: ['folder'], folderOperation: ['share'] }, n8nShowWhen: { resource: ['folder'], operation: ['share'] },
    },
    {
      key: 'folderShareScope', n8nKey: 'scope', label: 'Scope', kind: 'select', sourceKind: 'options',
      value: '', required: false, options: shareScopeOptions, description: 'The type of sharing link to create',
      showWhen: { resource: ['folder'], folderOperation: ['share'] }, n8nShowWhen: { resource: ['folder'], operation: ['share'] },
    },
  ],
  docsSummary: {
    operationDrift:
      'The live node page omits File Move and Folder Move, while both are present in the pinned v1.1 source and therefore included here.',
    servicePrincipalSearch:
      'Pinned source disables File Search and Folder Search for app-only credentials and shows operation-specific notices.',
    appOnlyTargeting:
      'Service Principal authentication requires Access As plus a User or Drive ID because app-only Microsoft Graph has no /me drive.',
  },
  platformGaps: [
    'All three credential selectors and their resolved credential schemas are metadata only; OAuth authorization, refresh, certificate signing, app-only token exchange, credential tests, and secret access are unavailable.',
    'The Service Principal User and Drive resource locators intentionally have ID mode only, matching source; no directory or drive lookup is performed.',
    'Source hide conditions on app-only Search queries are normalized to positive OAuth-only showWhen rules while retaining n8nShowWhen and n8nHideWhen.',
    'File and folder transfer fields are authoring controls only; binary buffers, presigned download URLs, target-drive resolution, file-name validation, and Graph requests never run.',
    'The live official node page has not yet listed the pinned source File Move and Folder Move operations.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'credentials', sourceType: 'credentials', normalizedKind: 'locked select',
      reason: 'Credential discovery and credential-editor workflows are unavailable.',
    },
    {
      n8nKey: 'userTarget, driveTarget', sourceType: 'resourceLocator with ID mode only',
      normalizedKind: 'resourceLocator', reason: 'The source intentionally offers no remote list mode for app-only target selection.',
    },
    {
      n8nKey: 'privateKey, certificate', sourceType: 'multiline password string', normalizedKind: 'textarea',
      reason: 'Credential material is represented as locked schema metadata and is never read or submitted.',
    },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    credentialRefresh: false,
    authentication: false,
    oauthAuthorization: false,
    certificateSigning: false,
    servicePrincipalTokenExchange: false,
    targetResolution: false,
    directoryLookup: false,
    driveLookup: false,
    search: false,
    fileRead: false,
    fileWrite: false,
    binaryRead: false,
    binaryWrite: false,
    fileTransfer: false,
    apiCalls: false,
    networkAccess: false,
    voice: false,
  },
  output: {},
};

export default microsoftOneDrive;
