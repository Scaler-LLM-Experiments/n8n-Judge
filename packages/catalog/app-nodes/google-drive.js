// Editor-only descriptor for n8n's Google Drive v3 action node. Remote lists,
// OAuth, service-account signing, file transfer, and every Drive API mutation
// remain inert in this authoring simulation.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'Credential discovery and editing are intentionally unavailable. This simulation never reads, creates, tests, refreshes, or applies Google credentials.';
const lockedLocatorNote =
  'The picker retains n8n list, URL, and ID modes, but list search is intentionally inert and no Google Drive data is requested.';

const resourceOptions = [
  { label: 'File', value: 'file' },
  { label: 'File/Folder', value: 'fileFolder' },
  { label: 'Folder', value: 'folder' },
  { label: 'Shared Drive', value: 'drive' },
];

const driveOperationOptions = [
  { label: 'Create', value: 'create', description: 'Create a shared drive', action: 'Create shared drive' },
  { label: 'Delete', value: 'deleteDrive', description: 'Permanently delete a shared drive', action: 'Delete shared drive' },
  { label: 'Get', value: 'get', description: 'Get a shared drive', action: 'Get shared drive' },
  { label: 'Get Many', value: 'list', description: 'Get the list of shared drives', action: 'Get many shared drives' },
  { label: 'Update', value: 'update', description: 'Update a shared drive', action: 'Update shared drive' },
];

const fileOperationOptions = [
  { label: 'Copy', value: 'copy', description: 'Create a copy of an existing file', action: 'Copy file' },
  { label: 'Create From Text', value: 'createFromText', description: 'Create a file from a provided text', action: 'Create file from text' },
  { label: 'Delete', value: 'deleteFile', description: 'Permanently delete a file', action: 'Delete a file' },
  { label: 'Download', value: 'download', description: 'Download a file', action: 'Download file' },
  { label: 'Move', value: 'move', description: 'Move a file to another folder', action: 'Move file' },
  { label: 'Share', value: 'share', description: 'Add sharing permissions to a file', action: 'Share file' },
  { label: 'Update', value: 'update', description: 'Update a file', action: 'Update file' },
  { label: 'Upload', value: 'upload', description: 'Upload an existing file to Google Drive', action: 'Upload file' },
];

const fileFolderOperationOptions = [
  { label: 'Search', value: 'search', description: 'Search or list files and folders', action: 'Search files and folders' },
];

const folderOperationOptions = [
  { label: 'Create', value: 'create', description: 'Create a folder', action: 'Create folder' },
  { label: 'Delete', value: 'deleteFolder', description: 'Permanently delete a folder', action: 'Delete folder' },
  { label: 'Share', value: 'share', description: 'Add sharing permissions to a folder', action: 'Share folder' },
];

const fileTypeOptions = [
  { label: 'All', value: '*', description: 'Return all file types' },
  { label: '3rd Party Shortcut', value: 'application/vnd.google-apps.drive-sdk' },
  { label: 'Audio', value: 'application/vnd.google-apps.audio' },
  { label: 'Folder', value: 'application/vnd.google-apps.folder' },
  { label: 'Google Apps Scripts', value: 'application/vnd.google-apps.script' },
  { label: 'Google Docs', value: 'application/vnd.google-apps.document' },
  { label: 'Google Drawing', value: 'application/vnd.google-apps.drawing' },
  { label: 'Google Forms', value: 'application/vnd.google-apps.form' },
  { label: 'Google Fusion Tables', value: 'application/vnd.google-apps.fusiontable' },
  { label: 'Google My Maps', value: 'application/vnd.google-apps.map' },
  { label: 'Google Sheets', value: 'application/vnd.google-apps.spreadsheet' },
  { label: 'Google Sites', value: 'application/vnd.google-apps.sites' },
  { label: 'Google Slides', value: 'application/vnd.google-apps.presentation' },
  { label: 'Photo', value: 'application/vnd.google-apps.photo' },
  { label: 'Unknown', value: 'application/vnd.google-apps.unknown' },
  { label: 'Video', value: 'application/vnd.google-apps.video' },
];

const returnFieldOptions = [
  { label: '[All]', value: '*', description: 'All fields' },
  { label: 'explicitlyTrashed', value: 'explicitlyTrashed' },
  { label: 'exportLinks', value: 'exportLinks' },
  { label: 'hasThumbnail', value: 'hasThumbnail' },
  { label: 'iconLink', value: 'iconLink' },
  { label: 'ID', value: 'id' },
  { label: 'Kind', value: 'kind' },
  { label: 'mimeType', value: 'mimeType' },
  { label: 'Name', value: 'name' },
  { label: 'Permissions', value: 'permissions' },
  { label: 'Shared', value: 'shared' },
  { label: 'Spaces', value: 'spaces' },
  { label: 'Starred', value: 'starred' },
  { label: 'thumbnailLink', value: 'thumbnailLink' },
  { label: 'Trashed', value: 'trashed' },
  { label: 'Version', value: 'version' },
  { label: 'webViewLink', value: 'webViewLink' },
];

const searchReturnFieldOptions = returnFieldOptions.map((option, index) =>
  index === 0 ? { ...option, label: '*' } : option,
);

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
  ['Europe (St. Ghislain) - europe-west1', 'europe-west1'],
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

const fileUrlRegex = 'https:\\/\\/(?:drive|docs)\\.google\\.com(?:\\/.*|)\\/d\\/([0-9a-zA-Z\\-_]+)(?:\\/.*|)';
const folderUrlRegex = 'https:\\/\\/drive\\.google\\.com(?:\\/.*|)\\/folders\\/([0-9a-zA-Z\\-_]+)(?:\\/.*|)';
const idRegex = '[a-zA-Z0-9\\-_]{2,}';

const operationWhen = (resource, operation, operationKey) => ({
  showWhen: { resource: [resource], [operationKey]: [operation] },
  n8nShowWhen: { resource: [resource], operation: [operation] },
});

function resourceLocator({
  key,
  n8nKey,
  label,
  description,
  type,
  required = true,
  showWhen,
  n8nShowWhen,
}) {
  const isFile = type === 'file';
  const isSharedDrive = type === 'sharedDrive';
  const isDrive = type === 'drive';
  const sourceDefault = isDrive
    ? { mode: 'list', value: 'My Drive' }
    : type === 'folder'
      ? { mode: 'list', value: 'root', cachedResultName: '/ (Root folder)' }
      : { mode: 'list', value: '' };
  const listMethod = isFile
    ? 'fileSearch'
    : isSharedDrive
      ? 'driveSearch'
      : isDrive
        ? 'driveSearchWithDefault'
        : type === 'folder'
          ? 'folderSearchWithDefault'
          : 'folderSearch';
  const listLabel = isFile ? 'File' : isSharedDrive || isDrive ? 'Drive' : 'Folder';
  const urlPlaceholder = isFile
    ? 'e.g. https://drive.google.com/file/d/1anGBg0b5re2VtF2bKu201_a-Vnz5BHq9Y4r-yBDAj5A/edit'
    : isSharedDrive
      ? 'e.g. https://drive.google.com/drive/u/1/folders/0AIjtcbwnjtcbwn9PVA'
      : isDrive
        ? 'https://drive.google.com/drive/folders/0AaaaaAAAAAAAaa'
        : 'e.g. https://drive.google.com/drive/folders/1Tx9WHbA3wBpPB4C_HcoZDH9WZFWYxAMU';
  const idPlaceholder = isSharedDrive
    ? 'e.g. 0AMXTKI5ZSiM7Uk9PVA'
    : 'e.g. 1anGBg0b5re2VtF2bKu201_a-Vnz5BHq9Y4r-yBDAj5A';
  const entity = isFile ? 'File' : isSharedDrive || isDrive ? 'Drive' : 'Folder';

  return {
    key,
    n8nKey,
    label,
    kind: 'resourceLocator',
    sourceKind: 'resourceLocator',
    value: { __rl: true, ...sourceDefault },
    sourceDefault,
    required,
    locked: true,
    dynamic: true,
    modes: ['list', 'url', 'id'],
    modeOptions: [
      {
        label: listLabel,
        value: 'list',
        kind: 'list',
        placeholder: isSharedDrive ? 'Select a shared drive...' : `Select a ${listLabel.toLowerCase()}...`,
        searchable: true,
        searchListMethod: listMethod,
      },
      {
        label: 'Link',
        value: 'url',
        kind: 'text',
        placeholder: urlPlaceholder,
        extractValue: { type: 'regex', regex: isFile ? fileUrlRegex : folderUrlRegex },
        validation: { type: 'regex', regex: isFile ? fileUrlRegex : folderUrlRegex, errorMessage: `Not a valid Google Drive ${entity} URL` },
      },
      {
        label: 'ID',
        value: 'id',
        kind: 'text',
        placeholder: idPlaceholder,
        ...(isDrive ? { hint: 'The ID of the shared drive' } : {}),
        validation: { type: 'regex', regex: idRegex, errorMessage: `Not a valid Google Drive ${entity} ID` },
        url: isFile
          ? '=https://drive.google.com/file/d/{{$value}}/view'
          : '=https://drive.google.com/drive/folders/{{$value}}',
      },
    ],
    options: [],
    showWhen,
    n8nShowWhen,
    description,
    simulationNote: lockedLocatorNote,
  };
}

const nestedCollection = (key, n8nKey, label, fields, description) => ({
  key,
  n8nKey,
  label,
  kind: 'collection',
  sourceKind: 'collection',
  value: {},
  required: false,
  addLabel: 'Add Field',
  fields,
  ...(description ? { description } : {}),
});

const optionCollection = (key, label, fields, show) => ({
  key,
  n8nKey: 'options',
  label,
  kind: 'collection',
  sourceKind: 'collection',
  value: {},
  required: false,
  addLabel: label === 'Filter' ? 'Add Filter' : 'Add Option',
  ...show,
  fields,
});

const restrictionsFields = () => [
  {
    key: 'adminManagedRestrictions', label: 'Admin Managed Restrictions', kind: 'boolean', value: false, required: false,
    description: 'Whether the options to copy, print, or download files inside this shared drive should be disabled for readers and commenters. When true, this overrides the similarly named field for every file in the shared drive.',
  },
  {
    key: 'copyRequiresWriterPermission', label: 'Copy Requires Writer Permission', kind: 'boolean', value: false, required: false,
    description: 'Whether the options to copy, print, or download files inside this shared drive should be disabled for readers and commenters. When true, this overrides the similarly named field for every file in the shared drive.',
  },
  {
    key: 'domainUsersOnly', label: 'Domain Users Only', kind: 'boolean', value: false, required: false,
    description: 'Whether access to this shared drive and its items is restricted to users of the domain to which the drive belongs. Other sharing policies may override this restriction.',
  },
  {
    key: 'driveMembersOnly', label: 'Drive Members Only', kind: 'boolean', value: false, required: false,
    description: 'Whether access to items inside this shared drive is restricted to its members',
  },
];

const capabilityNames = [
  ['Can Add Children', 'canAddChildren', 'add children to folders in'],
  ['Can Change Copy Requires Writer Permission Restriction', 'canChangeCopyRequiresWriterPermissionRestriction', 'change the copyRequiresWriterPermission restriction of'],
  ['Can Change Domain Users Only Restriction', 'canChangeDomainUsersOnlyRestriction', 'change the domainUsersOnly restriction of'],
  ['Can Change Drive Background', 'canChangeDriveBackground', 'change the background of'],
  ['Can Change Drive Members Only Restriction', 'canChangeDriveMembersOnlyRestriction', 'change the driveMembersOnly restriction of'],
  ['Can Comment', 'canComment', 'comment on files in'],
  ['Can Copy', 'canCopy', 'copy files in'],
  ['Can Delete Children', 'canDeleteChildren', 'delete children from folders in'],
  ['Can Delete Drive', 'canDeleteDrive', 'delete'],
  ['Can Download', 'canDownload', 'download files in'],
  ['Can Edit', 'canEdit', 'edit files in'],
  ['Can List Children', 'canListChildren', 'list the children of folders in'],
  ['Can Manage Members', 'canManageMembers', 'add or remove members, or change their role, in'],
  ['Can Read Revisions', 'canReadRevisions', 'read the revisions resource of files in'],
  ['Can Rename', 'canRename', 'rename files or folders in'],
  ['Can Rename Drive', 'canRenameDrive', 'rename'],
  ['Can Share', 'canShare', 'share files or folders in'],
  ['Can Trash Children', 'canTrashChildren', 'trash children from folders in'],
];

const capabilityFields = () => capabilityNames.map(([label, key, ability]) => ({
  key,
  label,
  kind: 'boolean',
  value: false,
  required: false,
  description: `Whether the current user can ${ability} this shared drive`,
}));

const updateCommonFields = () => [
  {
    key: 'appPropertiesUi', label: 'APP Properties', kind: 'fixedCollection', value: {}, required: false,
    multiple: true, collectionKey: 'appPropertyValues', collectionLabel: 'APP Property', addLabel: 'Add Property',
    description: 'A collection of arbitrary key-value pairs which are private to the requesting app',
    fields: [
      { key: 'key', label: 'Key', kind: 'text', value: '', required: false, description: 'Name of the key to add' },
      { key: 'value', label: 'Value', kind: 'text', value: '', required: false, description: 'Value to set for the key' },
    ],
  },
  {
    key: 'propertiesUi', label: 'Properties', kind: 'fixedCollection', value: {}, required: false,
    multiple: true, collectionKey: 'propertyValues', collectionLabel: 'Property', addLabel: 'Add Property',
    description: 'A collection of arbitrary key-value pairs which are visible to all apps',
    fields: [
      { key: 'key', label: 'Key', kind: 'text', value: '', required: false, description: 'Name of the key to add' },
      { key: 'value', label: 'Value', kind: 'text', value: '', required: false, description: 'Value to set for the key' },
    ],
  },
  {
    key: 'keepRevisionForever', label: 'Keep Revision Forever', kind: 'boolean', value: false, required: false,
    description: "Whether to set the 'keepForever' field in the new head revision. This applies only to binary files. At most 200 revisions can be kept forever.",
  },
  {
    key: 'ocrLanguage', label: 'OCR Language', kind: 'text', value: '', required: false, placeholder: 'e.g. en',
    description: 'A language hint for OCR processing during image import (ISO 639-1 code)',
  },
  {
    key: 'useContentAsIndexableText', label: 'Use Content As Indexable Text', kind: 'boolean', value: false, required: false,
    description: 'Whether to use the uploaded content as indexable text',
  },
];

const permissionField = (key, show) => ({
  key,
  n8nKey: 'permissionsUi',
  label: 'Permissions',
  kind: 'fixedCollection',
  sourceKind: 'fixedCollection',
  value: {},
  required: false,
  multiple: false,
  collectionKey: 'permissionsValues',
  collectionLabel: 'Permission',
  addLabel: 'Add Permission',
  ...show,
  fields: [
    {
      key: 'role', label: 'Role', kind: 'select', value: '', required: false,
      description: 'Defines what users can do with the file or folder',
      options: [
        { label: 'Commenter', value: 'commenter' }, { label: 'File Organizer', value: 'fileOrganizer' },
        { label: 'Organizer', value: 'organizer' }, { label: 'Owner', value: 'owner' },
        { label: 'Reader', value: 'reader' }, { label: 'Writer', value: 'writer' },
      ],
    },
    {
      key: 'type', label: 'Type', kind: 'select', value: '', required: false,
      options: [
        { label: 'User', value: 'user' }, { label: 'Group', value: 'group' },
        { label: 'Domain', value: 'domain' }, { label: 'Anyone', value: 'anyone' },
      ],
      description: 'The scope of the permission. A user permission applies to a specific user, while a domain permission applies to everyone in a domain.',
    },
    {
      key: 'emailAddress', label: 'Email Address', kind: 'text', value: '', required: false,
      placeholder: '“e.g. name@mail.com', showWhen: { type: ['user', 'group'] },
      description: 'The email address of the user or group to which this permission refers',
    },
    {
      key: 'domain', label: 'Domain', kind: 'text', value: '', required: false,
      placeholder: 'e.g. mycompany.com', showWhen: { type: ['domain'] },
      description: 'The domain to which this permission refers',
    },
    {
      key: 'allowFileDiscovery', label: 'Allow File Discovery', kind: 'boolean', value: false, required: false,
      showWhen: { type: ['domain', 'anyone'] }, description: 'Whether to allow the file to be discovered through search',
    },
  ],
});

const shareOptionsField = (key, show) => optionCollection(key, 'Options', [
  {
    key: 'emailMessage', label: 'Email Message', kind: 'textarea', sourceKind: 'string', value: '', required: false, rows: 2,
    description: 'A plain text custom message to include in the notification email',
  },
  {
    key: 'moveToNewOwnersRoot', label: 'Move To New Owners Root', kind: 'boolean', value: false, required: false,
    description: "This takes effect only when transferring an item outside a shared drive. When true, the item moves to the new owner's My Drive root and all prior parents are removed.",
  },
  {
    key: 'sendNotificationEmail', label: 'Send Notification Email', kind: 'boolean', value: false, required: false,
    description: 'Whether to send a notification email when sharing to users or groups',
  },
  {
    key: 'transferOwnership', label: 'Transfer Ownership', kind: 'boolean', value: false, required: false,
    description: 'Whether to transfer ownership to the specified user and downgrade the current owner to a writer',
  },
  {
    key: 'useDomainAdminAccess', label: 'Use Domain Admin Access', kind: 'boolean', value: false, required: false,
    description: 'Whether to perform the operation as domain administrator and receive automatic access to a shared drive in the administered domain',
  },
], show);

const googleDrive = {
  type: 'google-drive',
  n8nType: 'n8n-nodes-base.googleDrive',
  n8nVersion: 3,
  defaultVersion: 3,
  versionHistory: [1, 2, 3],
  label: 'Google Drive',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Access data on Google Drive',
  details: 'Create, find, move, share, update, upload, download, and delete Google Drive files, folders, and shared drives.',
  category: 'action',
  categories: ['Data & Storage'],
  group: ['input'],
  inputs: ['main'],
  outputs: ['main'],
  usableAsTool: true,
  toolConnector: 'ai_tool',
  icon: '/node-icons/google-drive.svg',
  n8nIcon: 'file:googleDrive.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 81, height: 73 },
  iconAssetSha256: 'a6a362d55180f7b6d7a60558770cd8d499bdfaa1799ab481bd369d41d0543075',
  sourceIconAssetSha256: 'f12f3a186006bbc28d59c8902d393efde9292e738f6404ad969ac134315f3d8b',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledrive/',
  docsByResource: {
    file: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledrive/file-operations/',
    fileFolder: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledrive/file-folder-operations/',
    folder: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledrive/folder-operations/',
    drive: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledrive/shared-drive-operations/',
  },
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Google/Drive/GoogleDrive.node.ts',
    versionPath: 'packages/nodes-base/nodes/Google/Drive/v2/actions/versionDescription.ts',
    metadataPath: 'packages/nodes-base/nodes/Google/Drive/GoogleDrive.node.json',
    commonDescriptionPath: 'packages/nodes-base/nodes/Google/Drive/v2/actions/common.descriptions.ts',
    actionRoot: 'packages/nodes-base/nodes/Google/Drive/v2/actions',
    credentialPaths: [
      'packages/nodes-base/credentials/GoogleDriveOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/GoogleOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/OAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/GoogleApi.credentials.ts',
    ],
    iconPath: 'packages/nodes-base/nodes/Google/Drive/googleDrive.svg',
  },
  defaults: { name: 'Google Drive' },
  resources: [
    { value: 'file', defaultOperation: 'upload', operations: fileOperationOptions.map(({ value }) => value) },
    { value: 'fileFolder', defaultOperation: 'search', operations: fileFolderOperationOptions.map(({ value }) => value) },
    { value: 'folder', defaultOperation: 'create', operations: folderOperationOptions.map(({ value }) => value) },
    { value: 'drive', defaultOperation: 'create', operations: driveOperationOptions.map(({ value }) => value) },
  ],
  credentialRequirements: [
    {
      type: 'googleDriveOAuth2Api', name: 'Google Drive OAuth2 API', required: true, inert: true,
      showWhen: { authentication: ['oAuth2'] }, extends: ['googleOAuth2Api', 'oAuth2Api'],
      documentationUrl: 'google/oauth-single-service',
      fields: [
        { key: 'oauthCustomScopes', n8nKey: 'customScopes', label: 'Custom Scopes', kind: 'boolean', value: false, required: false, description: 'Define custom scopes' },
        {
          key: 'oauthCustomScopesNotice', n8nKey: 'customScopesNotice',
          label: 'The default scopes needed for the node to work are already set, If you change these the node may not function correctly.',
          kind: 'notice', value: '', required: false, showWhen: { oauthCustomScopes: [true] }, n8nShowWhen: { customScopes: [true] },
        },
        {
          key: 'oauthEnabledScopes', n8nKey: 'enabledScopes', label: 'Enabled Scopes', kind: 'text',
          value: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.photos.readonly',
          required: false, showWhen: { oauthCustomScopes: [true] }, n8nShowWhen: { customScopes: [true] }, description: 'Scopes that should be enabled',
        },
        {
          key: 'oauthScope', n8nKey: 'scope', label: 'Scope', kind: 'hidden',
          value: '={{$self["customScopes"] ? $self["enabledScopes"] : "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.photos.readonly"}}',
          required: false,
        },
        {
          key: 'oauthHostedNotice', n8nKey: 'notice',
          label: 'Make sure that you have enabled the Google Drive API in the Google Cloud Console. More info.',
          kind: 'notice', value: '', required: false, sourceShowOnDeployment: 'hosted',
        },
      ],
    },
    {
      type: 'googleApi', name: 'Google Service Account API', required: true, inert: true,
      showWhen: { authentication: ['serviceAccount'] }, documentationUrl: 'google/service-account',
      fields: [
        {
          key: 'serviceRegion', n8nKey: 'region', label: 'Region', kind: 'select', value: 'global', required: false,
          options: regionOptions,
          description: 'The region where the Google Cloud service is located. This applies only to specific nodes, like the Google Vertex Chat Model',
        },
        {
          key: 'serviceEmail', n8nKey: 'email', label: 'Service Account Email', kind: 'text', value: '', required: true,
          placeholder: 'name@email.com', description: 'The Google Service account similar to user-808@project.iam.gserviceaccount.com',
        },
        {
          key: 'servicePrivateKey', n8nKey: 'privateKey', label: 'Private Key', kind: 'textarea', value: '', required: true,
          password: true, rows: 4, placeholder: '-----BEGIN PRIVATE KEY-----\nXIYEvQIBADANBg<...>0IhA7TMoGYPQc=\n-----END PRIVATE KEY-----\n',
          description: 'Enter the private key located in the JSON file downloaded from Google Cloud Console',
        },
        { key: 'serviceImpersonate', n8nKey: 'inpersonate', label: 'Impersonate a User', kind: 'boolean', value: false, required: false },
        {
          key: 'serviceDelegatedEmail', n8nKey: 'delegatedEmail', label: 'Email', kind: 'text', value: '', required: false,
          showWhen: { serviceImpersonate: [true] }, n8nShowWhen: { inpersonate: [true] },
          description: 'The email address of the user for which the application is requesting delegated access',
        },
        { key: 'serviceHttpNode', n8nKey: 'httpNode', label: 'Set up for use in HTTP Request node', kind: 'boolean', value: false, required: false },
        {
          key: 'serviceHttpWarning', n8nKey: 'httpWarning',
          label: "When using the HTTP Request node, you must specify the scopes you want to send. In other nodes, they're added automatically",
          kind: 'notice', value: '', required: false, showWhen: { serviceHttpNode: [true] }, n8nShowWhen: { httpNode: [true] },
        },
        {
          key: 'serviceScopes', n8nKey: 'scopes', label: 'Scope(s)', kind: 'text', value: '', required: false,
          showWhen: { serviceHttpNode: [true] }, n8nShowWhen: { httpNode: [true] },
          description: 'OAuth scopes for services, separated by commas, spaces, or line breaks',
        },
      ],
    },
  ],
  params: [
    {
      key: 'authentication', label: 'Authentication', kind: 'select', value: 'oAuth2', required: false,
      options: [
        { label: 'OAuth2 (recommended)', value: 'oAuth2' },
        { label: 'Service Account', value: 'serviceAccount' },
      ],
    },
    {
      key: 'googleDriveOAuth2Credential', n8nKey: 'credentials.googleDriveOAuth2Api',
      label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials', value: 'googleDriveOAuth2Api',
      required: true, locked: true, dynamic: true, showWhen: { authentication: ['oAuth2'] },
      options: [{ label: 'Google Drive OAuth2 API', value: 'googleDriveOAuth2Api' }], simulationNote: lockedCredentialNote,
    },
    {
      key: 'googleServiceAccountCredential', n8nKey: 'credentials.googleApi',
      label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials', value: 'googleApi',
      required: true, locked: true, dynamic: true, showWhen: { authentication: ['serviceAccount'] },
      options: [{ label: 'Google Service Account API', value: 'googleApi' }], simulationNote: lockedCredentialNote,
    },
    {
      key: 'resource', label: 'Resource', kind: 'select', value: 'file', required: false,
      noDataExpression: true, options: resourceOptions,
    },
    {
      key: 'driveOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', value: 'create', required: false,
      noDataExpression: true, showWhen: { resource: ['drive'] }, options: driveOperationOptions,
    },
    {
      key: 'fileOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', value: 'upload', required: false,
      noDataExpression: true, showWhen: { resource: ['file'] }, options: fileOperationOptions,
    },
    {
      key: 'fileFolderOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', value: 'search', required: false,
      noDataExpression: true, showWhen: { resource: ['fileFolder'] }, options: fileFolderOperationOptions,
    },
    {
      key: 'folderOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', value: 'create', required: false,
      noDataExpression: true, showWhen: { resource: ['folder'] }, options: folderOperationOptions,
    },
    {
      key: 'driveCreateName', n8nKey: 'name', label: 'Name', kind: 'text', value: '', required: false,
      placeholder: 'e.g. New Shared Drive', description: 'The name of the shared drive to create',
      ...operationWhen('drive', 'create', 'driveOperation'),
    },
    optionCollection('driveCreateOptions', 'Options', [
      nestedCollection('capabilities', 'capabilities', 'Capabilities', capabilityFields()),
      {
        key: 'colorRgb', label: 'Color RGB', kind: 'color', value: '', required: false,
        description: 'The color of this shared drive as an RGB hex string',
      },
      {
        key: 'hidden', label: 'Hidden', kind: 'boolean', value: false, required: false,
        description: 'Whether the shared drive is hidden from default view',
      },
      nestedCollection('restrictions', 'restrictions', 'Restrictions', restrictionsFields()),
    ], operationWhen('drive', 'create', 'driveOperation')),
    resourceLocator({
      key: 'driveDeleteDriveId', n8nKey: 'driveId', label: 'Shared Drive', type: 'sharedDrive',
      description: 'The shared drive to delete', ...operationWhen('drive', 'deleteDrive', 'driveOperation'),
    }),
    resourceLocator({
      key: 'driveGetDriveId', n8nKey: 'driveId', label: 'Shared Drive', type: 'sharedDrive',
      description: 'The shared drive to get', ...operationWhen('drive', 'get', 'driveOperation'),
    }),
    optionCollection('driveGetOptions', 'Options', [
      {
        key: 'useDomainAdminAccess', label: 'Use Domain Admin Access', kind: 'boolean', value: false, required: false,
        description: 'Whether to issue the request as a domain administrator; when true, an administrator receives access to a shared drive in their domain',
      },
    ], operationWhen('drive', 'get', 'driveOperation')),
    {
      key: 'driveListReturnAll', n8nKey: 'returnAll', label: 'Return All', kind: 'boolean', value: false, required: false,
      description: 'Whether to return all results or only up to a given limit',
      ...operationWhen('drive', 'list', 'driveOperation'),
    },
    {
      key: 'driveListLimit', n8nKey: 'limit', label: 'Limit', kind: 'number', value: 100, required: false,
      min: 1, max: 200,
      showWhen: { resource: ['drive'], driveOperation: ['list'], driveListReturnAll: [false] },
      n8nShowWhen: { resource: ['drive'], operation: ['list'], returnAll: [false] },
      description: 'Max number of results to return',
    },
    optionCollection('driveListOptions', 'Options', [
      {
        key: 'q', label: 'Query', kind: 'text', value: '', required: false,
        description: 'Query string for searching shared drives. See the Google Drive “Search for shared drives” guide for supported syntax.',
      },
      {
        key: 'useDomainAdminAccess', label: 'Use Domain Admin Access', kind: 'boolean', value: false, required: false,
        description: 'Whether to issue the request as a domain administrator; when true, an administrator receives access to a shared drive in their domain',
      },
    ], operationWhen('drive', 'list', 'driveOperation')),
    resourceLocator({
      key: 'driveUpdateDriveId', n8nKey: 'driveId', label: 'Shared Drive', type: 'sharedDrive',
      description: 'The shared drive to update', ...operationWhen('drive', 'update', 'driveOperation'),
    }),
    optionCollection('driveUpdateOptions', 'Update Fields', [
      {
        key: 'colorRgb', label: 'Color RGB', kind: 'color', value: '', required: false,
        description: 'The color of this shared drive as an RGB hex string',
      },
      {
        key: 'name', label: 'Name', kind: 'text', value: '', required: false,
        description: 'The updated name of the shared drive',
      },
      nestedCollection('restrictions', 'restrictions', 'Restrictions', restrictionsFields()),
    ], operationWhen('drive', 'update', 'driveOperation')),

    resourceLocator({
      key: 'fileCopyFileId', n8nKey: 'fileId', label: 'File', type: 'file',
      description: 'The file to copy', ...operationWhen('file', 'copy', 'fileOperation'),
    }),
    {
      key: 'fileCopyName', n8nKey: 'name', label: 'File Name', kind: 'text', value: '', required: false,
      placeholder: 'e.g. My File',
      description: 'The name of the new file. If not set, “Copy of {original file name}” will be used.',
      ...operationWhen('file', 'copy', 'fileOperation'),
    },
    {
      key: 'fileCopySameFolder', n8nKey: 'sameFolder', label: 'Copy In The Same Folder', kind: 'boolean', value: true, required: false,
      description: 'Whether to copy the file in the same folder as the original file',
      ...operationWhen('file', 'copy', 'fileOperation'),
    },
    resourceLocator({
      key: 'fileCopyDriveId', n8nKey: 'driveId', label: 'Parent Drive', type: 'drive',
      description: 'The drive where to save the copied file',
      showWhen: { resource: ['file'], fileOperation: ['copy'], fileCopySameFolder: [false] },
      n8nShowWhen: { resource: ['file'], operation: ['copy'], sameFolder: [false] },
    }),
    resourceLocator({
      key: 'fileCopyFolderId', n8nKey: 'folderId', label: 'Parent Folder', type: 'folder',
      description: 'The folder where to save the copied file',
      showWhen: { resource: ['file'], fileOperation: ['copy'], fileCopySameFolder: [false] },
      n8nShowWhen: { resource: ['file'], operation: ['copy'], sameFolder: [false] },
    }),
    optionCollection('fileCopyOptions', 'Options', [
      {
        key: 'copyRequiresWriterPermission', label: 'Copy Requires Writer Permission', kind: 'boolean', value: false, required: false,
        description: 'Whether the options to copy, print, or download this file should be disabled for readers and commenters',
      },
      { key: 'description', label: 'Description', kind: 'text', value: '', required: false, description: 'A short description of the file' },
    ], operationWhen('file', 'copy', 'fileOperation')),

    {
      key: 'fileCreateTextContent', n8nKey: 'content', label: 'File Content', kind: 'textarea', sourceKind: 'string',
      value: '', required: false, rows: 2, description: 'The text to create the file with',
      ...operationWhen('file', 'createFromText', 'fileOperation'),
    },
    {
      key: 'fileCreateTextName', n8nKey: 'name', label: 'File Name', kind: 'text', value: '', required: false,
      placeholder: 'e.g. My New File', description: "The name of the file to create. If not specified, 'Untitled' will be used.",
      ...operationWhen('file', 'createFromText', 'fileOperation'),
    },
    resourceLocator({
      key: 'fileCreateTextDriveId', n8nKey: 'driveId', label: 'Parent Drive', type: 'drive', required: false,
      description: 'The drive where to create the new file', ...operationWhen('file', 'createFromText', 'fileOperation'),
    }),
    resourceLocator({
      key: 'fileCreateTextFolderId', n8nKey: 'folderId', label: 'Parent Folder', type: 'folder', required: false,
      description: 'The folder where to create the new file', ...operationWhen('file', 'createFromText', 'fileOperation'),
    }),
    optionCollection('fileCreateTextOptions', 'Options', [
      ...updateCommonFields(),
      {
        key: 'convertToGoogleDocument', label: 'Convert to Google Document', kind: 'boolean', value: false, required: false,
        description: 'Whether to create a Google Document instead of the default .txt format',
        hint: 'Google Docs API has to be enabled in the Google API Console.',
      },
    ], operationWhen('file', 'createFromText', 'fileOperation')),

    resourceLocator({
      key: 'fileDeleteFileId', n8nKey: 'fileId', label: 'File', type: 'file',
      description: 'The file to delete', ...operationWhen('file', 'deleteFile', 'fileOperation'),
    }),
    optionCollection('fileDeleteOptions', 'Options', [
      {
        key: 'deletePermanently', label: 'Delete Permanently', kind: 'boolean', value: false, required: false,
        description: 'Whether to delete the file immediately. If false, the file will be moved to the trash.',
      },
    ], operationWhen('file', 'deleteFile', 'fileOperation')),

    resourceLocator({
      key: 'fileDownloadFileId', n8nKey: 'fileId', label: 'File', type: 'file',
      description: 'The file to download', ...operationWhen('file', 'download', 'fileOperation'),
    }),
    optionCollection('fileDownloadOptions', 'Options', [
      {
        key: 'binaryPropertyName', label: 'Put Output File in Field', kind: 'text', value: 'data', required: false,
        placeholder: 'e.g. data', description: 'Use this field name in following nodes to use the binary file data',
        hint: 'The name of the output binary field to put the file in',
      },
      {
        key: 'googleFileConversion', label: 'Google File Conversion', kind: 'fixedCollection', sourceKind: 'fixedCollection',
        value: {}, required: false, multiple: false, collectionKey: 'conversion', collectionLabel: 'Conversion', addLabel: 'Add Conversion',
        fields: [
          {
            key: 'docsToFormat', label: 'Google Docs', kind: 'select', value: 'text/html', required: false,
            description: 'Format used to export when downloading Google Docs files',
            options: [
              { label: 'HTML', value: 'text/html' },
              { label: 'Markdown (md)', value: 'text/markdown' },
              { label: 'MS Word Document', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
              { label: 'Open Office Document', value: 'application/vnd.oasis.opendocument.text' },
              { label: 'PDF', value: 'application/pdf' },
              { label: 'Rich Text (rtf)', value: 'application/rtf' },
              { label: 'Text (txt)', value: 'text/plain' },
            ],
          },
          {
            key: 'drawingsToFormat', label: 'Google Drawings', kind: 'select', value: 'image/jpeg', required: false,
            description: 'Format used to export when downloading Google Drawings files',
            options: [
              { label: 'JPEG', value: 'image/jpeg' }, { label: 'PDF', value: 'application/pdf' },
              { label: 'PNG', value: 'image/png' }, { label: 'SVG', value: 'image/svg+xml' },
            ],
          },
          {
            key: 'slidesToFormat', label: 'Google Slides', kind: 'select',
            value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', required: false,
            description: 'Format used to export when downloading Google Slides files',
            options: [
              { label: 'MS PowerPoint', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
              { label: 'OpenOffice Presentation', value: 'application/vnd.oasis.opendocument.presentation' },
              { label: 'PDF', value: 'application/pdf' },
            ],
          },
          {
            key: 'sheetsToFormat', label: 'Google Sheets', kind: 'select', value: 'text/csv', required: false,
            description: 'Format used to export when downloading Google Sheets files',
            options: [
              { label: 'CSV', value: 'text/csv' },
              { label: 'MS Excel', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
              { label: 'Open Office Sheet', value: 'application/vnd.oasis.opendocument.spreadsheet' },
              { label: 'PDF', value: 'application/pdf' },
            ],
          },
        ],
      },
      { key: 'fileName', label: 'File Name', kind: 'text', value: '', required: false, description: 'File name. Ex: data.pdf.' },
    ], operationWhen('file', 'download', 'fileOperation')),

    resourceLocator({
      key: 'fileMoveFileId', n8nKey: 'fileId', label: 'File', type: 'file',
      description: 'The file to move', ...operationWhen('file', 'move', 'fileOperation'),
    }),
    resourceLocator({
      key: 'fileMoveDriveId', n8nKey: 'driveId', label: 'Parent Drive', type: 'drive',
      description: 'The drive where to move the file', ...operationWhen('file', 'move', 'fileOperation'),
    }),
    resourceLocator({
      key: 'fileMoveFolderId', n8nKey: 'folderId', label: 'Parent Folder', type: 'folder',
      description: 'The folder where to move the file', ...operationWhen('file', 'move', 'fileOperation'),
    }),

    resourceLocator({
      key: 'fileShareFileId', n8nKey: 'fileId', label: 'File', type: 'file',
      description: 'The file to share', ...operationWhen('file', 'share', 'fileOperation'),
    }),
    permissionField('fileSharePermissions', operationWhen('file', 'share', 'fileOperation')),
    shareOptionsField('fileShareOptions', operationWhen('file', 'share', 'fileOperation')),

    resourceLocator({
      key: 'fileUpdateFileId', n8nKey: 'fileId', label: 'File to Update', type: 'file',
      description: 'The file to update', ...operationWhen('file', 'update', 'fileOperation'),
    }),
    {
      key: 'fileUpdateChangeContent', n8nKey: 'changeFileContent', label: 'Change File Content',
      kind: 'boolean', value: false, required: false,
      description: 'Whether to send new binary data to update the file',
      ...operationWhen('file', 'update', 'fileOperation'),
    },
    {
      key: 'fileUpdateInputDataFieldName', n8nKey: 'inputDataFieldName', label: 'Input Data Field Name',
      kind: 'text', value: 'data', required: false, placeholder: 'e.g. data',
      hint: 'The name of the input field containing the binary file data to update the file',
      description: 'Find the input field containing the binary data in the Input panel on the left, in the Binary tab',
      showWhen: { resource: ['file'], fileOperation: ['update'], fileUpdateChangeContent: [true] },
      n8nShowWhen: { resource: ['file'], operation: ['update'], changeFileContent: [true] },
    },
    {
      key: 'fileUpdateNewName', n8nKey: 'newUpdatedFileName', label: 'New Updated File Name',
      kind: 'text', value: '', required: false, placeholder: 'e.g. My New File',
      description: 'If not specified, the file name will not be changed',
      ...operationWhen('file', 'update', 'fileOperation'),
    },
    optionCollection('fileUpdateOptions', 'Options', [
      ...updateCommonFields(),
      {
        key: 'trashed', label: 'Move to Trash', kind: 'boolean', value: false, required: false,
        description: 'Whether to move a file to the trash. Only the owner may trash a file.',
      },
      {
        key: 'fields', label: 'Return Fields', kind: 'multiSelect', value: [], required: false,
        options: returnFieldOptions, description: 'The fields to return',
      },
    ], operationWhen('file', 'update', 'fileOperation')),

    {
      key: 'fileUploadInputDataFieldName', n8nKey: 'inputDataFieldName', label: 'Input Data Field Name',
      kind: 'text', value: 'data', required: true, placeholder: '“e.g. data',
      hint: 'The name of the input field containing the binary file data to update the file',
      description: 'Find the input field containing the binary data in the Input panel on the left, in the Binary tab',
      ...operationWhen('file', 'upload', 'fileOperation'),
    },
    {
      key: 'fileUploadName', n8nKey: 'name', label: 'File Name', kind: 'text', value: '', required: false,
      placeholder: 'e.g. My New File', description: 'If not specified, the original file name will be used',
      ...operationWhen('file', 'upload', 'fileOperation'),
    },
    resourceLocator({
      key: 'fileUploadDriveId', n8nKey: 'driveId', label: 'Parent Drive', type: 'drive',
      description: 'The drive where to upload the file', ...operationWhen('file', 'upload', 'fileOperation'),
    }),
    resourceLocator({
      key: 'fileUploadFolderId', n8nKey: 'folderId', label: 'Parent Folder', type: 'folder',
      description: 'The folder where to upload the file', ...operationWhen('file', 'upload', 'fileOperation'),
    }),
    optionCollection('fileUploadOptions', 'Options', [
      ...updateCommonFields(),
      {
        key: 'simplifyOutput', label: 'Simplify Output', kind: 'boolean', value: true, required: false,
        description: 'Whether to return a simplified version of the response instead of all fields',
      },
    ], operationWhen('file', 'upload', 'fileOperation')),

    {
      key: 'fileFolderSearchMethod', n8nKey: 'searchMethod', label: 'Search Method', kind: 'select', value: 'name', required: false,
      options: [
        { label: 'Search File/Folder Name', value: 'name' },
        { label: 'Advanced Search', value: 'query' },
      ],
      description: 'Whether to search for the file/folder name or use a query string',
      ...operationWhen('fileFolder', 'search', 'fileFolderOperation'),
    },
    {
      key: 'fileFolderSearchNameQuery', n8nKey: 'queryString', label: 'Search Query', kind: 'text', value: '', required: false,
      placeholder: 'e.g. My File / My Folder',
      description: 'The file or folder name to search for. This also returns items whose names partially match the search term.',
      showWhen: { resource: ['fileFolder'], fileFolderOperation: ['search'], fileFolderSearchMethod: ['name'] },
      n8nShowWhen: { resource: ['fileFolder'], operation: ['search'], searchMethod: ['name'] },
    },
    {
      key: 'fileFolderSearchAdvancedQuery', n8nKey: 'queryString', label: 'Query String', kind: 'text', value: '', required: false,
      placeholder: "e.g. not name contains 'hello'",
      description: 'Use Google Drive query-string syntax to search for a specific set of files or folders.',
      showWhen: { resource: ['fileFolder'], fileFolderOperation: ['search'], fileFolderSearchMethod: ['query'] },
      n8nShowWhen: { resource: ['fileFolder'], operation: ['search'], searchMethod: ['query'] },
    },
    {
      key: 'fileFolderSearchReturnAll', n8nKey: 'returnAll', label: 'Return All', kind: 'boolean', value: false, required: false,
      description: 'Whether to return all results or only up to a given limit',
      ...operationWhen('fileFolder', 'search', 'fileFolderOperation'),
    },
    {
      key: 'fileFolderSearchLimit', n8nKey: 'limit', label: 'Limit', kind: 'number', value: 50, required: false, min: 1,
      description: 'Max number of results to return',
      showWhen: { resource: ['fileFolder'], fileFolderOperation: ['search'], fileFolderSearchReturnAll: [false] },
      n8nShowWhen: { resource: ['fileFolder'], operation: ['search'], returnAll: [false] },
    },
    optionCollection('fileFolderSearchFilter', 'Filter', [
      resourceLocator({
        key: 'driveId', n8nKey: 'driveId', label: 'Drive', type: 'drive', required: false,
        description: 'The drive to search in. By default, the personal “My Drive” is used.',
      }),
      resourceLocator({
        key: 'folderId', n8nKey: 'folderId', label: 'Folder', type: 'folder', required: false,
        description: 'The folder to search in. By default, the drive root is used. A non-root folder includes only its direct children.',
      }),
      {
        key: 'whatToSearch', label: 'What to Search', kind: 'select', value: 'all', required: false,
        options: [
          { label: 'Files and Folders', value: 'all' },
          { label: 'Files', value: 'files' },
          { label: 'Folders', value: 'folders' },
        ],
      },
      {
        key: 'allFileTypes', n8nKey: 'fileTypes', label: 'File Types', kind: 'multiSelect', value: [], required: false,
        showWhen: { whatToSearch: ['all'] }, options: fileTypeOptions,
        description: 'Return only items corresponding to the selected MIME types',
      },
      {
        key: 'filesOnlyFileTypes', n8nKey: 'fileTypes', label: 'File Types', kind: 'multiSelect', value: [], required: false,
        showWhen: { whatToSearch: ['files'] }, options: fileTypeOptions.filter(({ label }) => label !== 'Folder'),
        description: 'Return only items corresponding to the selected MIME types',
      },
      {
        key: 'includeTrashed', label: 'Include Trashed Items', kind: 'boolean', value: false, required: false,
        description: "Whether to also return items in the Drive's bin",
      },
    ], operationWhen('fileFolder', 'search', 'fileFolderOperation')),
    optionCollection('fileFolderSearchOptions', 'Options', [
      {
        key: 'fields', label: 'Fields', kind: 'multiSelect', value: [], required: false,
        options: searchReturnFieldOptions, description: 'The fields to return',
      },
    ], operationWhen('fileFolder', 'search', 'fileFolderOperation')),

    {
      key: 'folderCreateName', n8nKey: 'name', label: 'Folder Name', kind: 'text', value: '', required: false,
      placeholder: 'e.g. New Folder', description: "The name of the new folder. If not set, 'Untitled' will be used.",
      ...operationWhen('folder', 'create', 'folderOperation'),
    },
    resourceLocator({
      key: 'folderCreateDriveId', n8nKey: 'driveId', label: 'Parent Drive', type: 'drive',
      description: 'The drive where to create the new folder', ...operationWhen('folder', 'create', 'folderOperation'),
    }),
    resourceLocator({
      key: 'folderCreateFolderId', n8nKey: 'folderId', label: 'Parent Folder', type: 'folder',
      description: 'The parent folder where to create the new folder', ...operationWhen('folder', 'create', 'folderOperation'),
    }),
    optionCollection('folderCreateOptions', 'Options', [
      {
        key: 'simplifyOutput', label: 'Simplify Output', kind: 'boolean', value: true, required: false,
        description: 'Whether to return a simplified version of the response instead of all fields',
      },
      {
        key: 'folderColorRgb', label: 'Folder Color', kind: 'color', value: '', required: false,
        description: 'The folder color as an RGB hex string. If unsupported, Google Drive uses the closest palette color.',
      },
    ], operationWhen('folder', 'create', 'folderOperation')),

    resourceLocator({
      key: 'folderDeleteFolderId', n8nKey: 'folderNoRootId', label: 'Folder', type: 'folderNoRoot',
      description: 'The folder to delete', ...operationWhen('folder', 'deleteFolder', 'folderOperation'),
    }),
    optionCollection('folderDeleteOptions', 'Options', [
      {
        key: 'deletePermanently', label: 'Delete Permanently', kind: 'boolean', value: false, required: false,
        description: 'Whether to delete the folder immediately. If false, the folder will be moved to the trash.',
      },
    ], operationWhen('folder', 'deleteFolder', 'folderOperation')),

    resourceLocator({
      key: 'folderShareFolderId', n8nKey: 'folderNoRootId', label: 'Folder', type: 'folderNoRoot',
      description: 'The folder to share', ...operationWhen('folder', 'share', 'folderOperation'),
    }),
    permissionField('folderSharePermissions', operationWhen('folder', 'share', 'folderOperation')),
    shareOptionsField('folderShareOptions', operationWhen('folder', 'share', 'folderOperation')),
  ],
  platformGaps: [
    'All Google Drive resourceLocator list modes normally call fileSearch, folderSearch, folderSearchWithDefault, driveSearch, or driveSearchWithDefault. The catalog keeps those method names but leaves every remote list locked and empty.',
    'The credential selector and both credential-editor schemas are metadata only; OAuth authorization, refresh, service-account JWT signing, impersonation, scope checks, and credential testing are unavailable.',
    'The renderer has no native multiline string control, so two-row source strings are normalized to textarea while retaining sourceKind.',
    'n8n repeats native keys such as operation, options, queryString, fileTypes, driveId, and folderId under mutually exclusive display conditions. The catalog gives each top-level surface a unique UI key and retains n8nKey and n8nShowWhen for lossless mapping.',
    'The node declares usableAsTool, but this catalog models only its ordinary main input/output authoring surface and records the AI tool connector as metadata.',
    'The pinned source metadata has no codex aliases, subcategories, or secondary resource links; the catalog does not invent them.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'credentials', sourceType: 'credentials', normalizedKind: 'locked select',
      reason: 'Credential discovery and credential-editor workflows are unavailable.',
    },
    {
      n8nKey: 'fileId, folderId, folderNoRootId, driveId', sourceType: 'resourceLocator with remote listSearch',
      normalizedKind: 'resourceLocator', reason: 'URL and ID authoring remain available, but remote list discovery is disabled.',
    },
    {
      n8nKey: 'content, options.emailMessage', sourceType: 'multiline string', normalizedKind: 'textarea',
      reason: 'The catalog textarea preserves the source row count without interpreting the text.',
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
    serviceAccountSigning: false,
    impersonation: false,
    scopeValidation: false,
    resourceDiscovery: false,
    fileSearch: false,
    folderSearch: false,
    driveSearch: false,
    queryExecution: false,
    binaryRead: false,
    binaryWrite: false,
    fileTransfer: false,
    apiCalls: false,
    networkAccess: false,
    create: false,
    read: false,
    update: false,
    delete: false,
    share: false,
    voice: false,
  },
  output: {},
};

export default googleDrive;
