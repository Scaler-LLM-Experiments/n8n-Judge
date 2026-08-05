// Editor-only descriptor for n8n's Google Drive Trigger v1 node. Credentials,
// remote searches, polling, Drive API calls, expressions, and execution stay inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This selector is locked. The simulation never reads, creates, tests, refreshes, signs, or applies Google credentials.';
const lockedLocatorNote =
  'List search is locked and empty. URL and ID modes remain authorable without contacting Google Drive.';
const fileUrlRegex =
  'https:\\/\\/(?:drive|docs)\\.google\\.com(?:\\/.*|)\\/d\\/([0-9a-zA-Z\\-_]+)(?:\\/.*|)';
const folderUrlRegex =
  'https:\\/\\/drive\\.google\\.com(?:\\/.*|)\\/folders\\/([0-9a-zA-Z\\-_]+)(?:\\/.*|)';

const pollModeOptions = [
  { label: 'Every Minute', value: 'everyMinute' },
  { label: 'Every Hour', value: 'everyHour' },
  { label: 'Every Day', value: 'everyDay' },
  { label: 'Every Week', value: 'everyWeek' },
  { label: 'Every Month', value: 'everyMonth' },
  { label: 'Every X', value: 'everyX' },
  { label: 'Custom', value: 'custom' },
];

const pollTimes = {
  key: 'pollTimes', n8nKey: 'pollTimes', label: 'Poll Times', kind: 'fixedCollection',
  sourceKind: 'fixedCollection:commonPollingParameters', value: { item: [{ mode: 'everyMinute' }] },
  sourceDefault: { item: [{ mode: 'everyMinute' }] }, required: false, collectionKey: 'item',
  collectionLabel: 'Item', multiple: true, addLabel: 'Add Poll Time',
  description: 'Time at which polling should occur',
  fields: [
    { key: 'mode', n8nKey: 'mode', label: 'Mode', kind: 'select', value: 'everyDay', required: false, options: pollModeOptions, description: 'How often to trigger.' },
    { key: 'hour', n8nKey: 'hour', label: 'Hour', kind: 'number', value: 14, required: false, min: 0, max: 23, showWhen: { mode: ['everyDay', 'everyWeek', 'everyMonth'] }, n8nHideWhen: { mode: ['custom', 'everyHour', 'everyMinute', 'everyX'] }, description: 'The hour of the day to trigger (24h format)' },
    { key: 'minute', n8nKey: 'minute', label: 'Minute', kind: 'number', value: 0, required: false, min: 0, max: 59, showWhen: { mode: ['everyHour', 'everyDay', 'everyWeek', 'everyMonth'] }, n8nHideWhen: { mode: ['custom', 'everyMinute', 'everyX'] }, description: 'The minute past the hour to trigger (0-59)' },
    { key: 'dayOfMonth', n8nKey: 'dayOfMonth', label: 'Day of Month', kind: 'number', value: 1, required: false, min: 1, max: 31, showWhen: { mode: ['everyMonth'] }, description: 'The day of the month to trigger' },
    {
      key: 'weekday', n8nKey: 'weekday', label: 'Weekday', kind: 'select', value: '1', required: false,
      showWhen: { mode: ['everyWeek'] }, description: 'The weekday to trigger',
      options: [
        { label: 'Monday', value: '1' }, { label: 'Tuesday', value: '2' },
        { label: 'Wednesday', value: '3' }, { label: 'Thursday', value: '4' },
        { label: 'Friday', value: '5' }, { label: 'Saturday', value: '6' },
        { label: 'Sunday', value: '0' },
      ],
    },
    {
      key: 'cronExpression', n8nKey: 'cronExpression', label: 'Cron Expression', kind: 'text',
      value: '* * * * * *', required: false, showWhen: { mode: ['custom'] },
      description: 'Use custom cron expression. Values and ranges as follows:<ul><li>Seconds: 0-59</li><li>Minutes: 0 - 59</li><li>Hours: 0 - 23</li><li>Day of Month: 1 - 31</li><li>Months: 0 - 11 (Jan - Dec)</li><li>Day of Week: 0 - 6 (Sun - Sat)</li></ul>',
      simulationNote: 'The cron expression remains text and is never parsed or scheduled.',
    },
    { key: 'value', n8nKey: 'value', label: 'Value', kind: 'number', value: 2, required: false, min: 0, max: 1000, showWhen: { mode: ['everyX'] }, description: 'All how many X minutes/hours it should trigger' },
    {
      key: 'unit', n8nKey: 'unit', label: 'Unit', kind: 'select', value: 'hours', required: false,
      showWhen: { mode: ['everyX'] }, description: 'If it should trigger all X minutes or hours',
      options: [{ label: 'Minutes', value: 'minutes' }, { label: 'Hours', value: 'hours' }],
    },
  ],
  simulationNote: 'Poll times are editable metadata only. No timer, cron job, or API poll is created.',
};

const folderEventOptions = [
  { label: 'File Created', value: 'fileCreated', description: 'When a file is created in the watched folder' },
  { label: 'File Updated', value: 'fileUpdated', description: 'When a file is updated in the watched folder' },
  { label: 'Folder Created', value: 'folderCreated', description: 'When a folder is created in the watched folder' },
  { label: 'Folder Updated', value: 'folderUpdated', description: 'When a folder is updated in the watched folder' },
  { label: 'Watch Folder Updated', value: 'watchFolderUpdated', description: 'When the watched folder itself is modified' },
];

const fileTypeOptions = [
  { label: '[All]', value: 'all' },
  { label: 'Audio', value: 'application/vnd.google-apps.audio' },
  { label: 'Google Docs', value: 'application/vnd.google-apps.document' },
  { label: 'Google Drawings', value: 'application/vnd.google-apps.drawing' },
  { label: 'Google Slides', value: 'application/vnd.google-apps.presentation' },
  { label: 'Google Spreadsheets', value: 'application/vnd.google-apps.spreadsheet' },
  { label: 'Photos and Images', value: 'application/vnd.google-apps.photo' },
  { label: 'Videos', value: 'application/vnd.google-apps.video' },
];

const credentialRequirements = [
  { type: 'googleApi', name: 'Google Service Account API', required: true, showWhen: { authentication: ['serviceAccount'] }, inert: true },
  { type: 'googleDriveOAuth2Api', name: 'Google Drive OAuth2 API', required: true, showWhen: { authentication: ['oAuth2'] }, extends: ['googleOAuth2Api', 'oAuth2Api'], inert: true },
];

const googleDriveTrigger = {
  type: 'google-drive-trigger',
  n8nType: 'n8n-nodes-base.googleDriveTrigger',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'Google Drive Trigger',
  defaultName: 'Google Drive Trigger',
  subtitle: '={{$parameter["event"]}}',
  description: 'Starts the workflow when Google Drive events occur',
  category: 'trigger',
  categories: ['Data & Storage'],
  group: ['trigger'],
  defaults: { name: 'Google Drive Trigger' },
  inputs: [],
  outputs: ['main'],
  polling: true,
  icon: '/node-icons/google-drive.svg',
  n8nIcon: 'file:googleDrive.svg',
  iconMode: 'image',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.googledrivetrigger/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/',
  genericResources: [
    { label: '7 no-code workflow automations for Amazon Web Services', url: 'https://n8n.io/blog/aws-workflow-automation/' },
  ],
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Google/Drive/GoogleDriveTrigger.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Google/Drive/GoogleDriveTrigger.node.json',
    constantsPath: 'packages/nodes-base/nodes/Google/constants.ts',
    helperPath: 'packages/nodes-base/nodes/Google/Drive/v1/GenericFunctions.ts',
    searchPath: 'packages/nodes-base/nodes/Google/Drive/v2/methods/listSearch.ts',
    pollingParameterPath: 'packages/core/src/nodes-loader/constants.ts',
    pollingInjectionPath: 'packages/core/src/nodes-loader/directory-loader.ts',
    cronOptionsPath: 'packages/workflow/src/node-helpers.ts',
    credentialPaths: [
      'packages/nodes-base/credentials/GoogleApi.credentials.ts',
      'packages/nodes-base/credentials/GoogleDriveOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/GoogleOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/OAuth2Api.credentials.ts',
    ],
    iconPath: 'packages/nodes-base/nodes/Google/Drive/googleDrive.svg',
  },
  credentialRequirements,
  params: [
    {
      key: 'authentication', n8nKey: 'authentication', label: 'Credential Type', kind: 'select',
      sourceKind: 'options', value: 'oAuth2', required: false,
      options: [
        { label: 'OAuth2 (recommended)', value: 'oAuth2' },
        { label: 'Service Account', value: 'serviceAccount' },
      ],
    },
    ...credentialRequirements.map(({ type, name, showWhen }) => ({
      key: `${type}Credential`, n8nKey: `credentials.${type}`, label: 'Credential to connect with',
      kind: 'select', sourceKind: 'credentials', value: type, required: true, locked: true,
      dynamic: true, options: [{ label: name, value: type }], showWhen,
      simulationNote: lockedCredentialNote,
    })),
    pollTimes,
    {
      key: 'triggerOn', n8nKey: 'triggerOn', label: 'Trigger On', kind: 'select', sourceKind: 'options',
      value: '', required: true,
      options: [
        { label: 'Changes to a Specific File', value: 'specificFile' },
        { label: 'Changes Involving a Specific Folder', value: 'specificFolder' },
      ],
    },
    {
      key: 'fileToWatch', n8nKey: 'fileToWatch', label: 'File', kind: 'resourceLocator',
      sourceKind: 'resourceLocator', value: { __rl: true, mode: 'list', value: '' },
      sourceDefault: { mode: 'list', value: '' }, required: true, locked: true, dynamic: true,
      modes: ['list', 'url', 'id'], options: [], showWhen: { triggerOn: ['specificFile'] },
      modeOptions: [
        { label: 'File', value: 'list', kind: 'list', placeholder: 'Select a file...', searchListMethod: 'fileSearch', searchable: true },
        {
          label: 'Link', value: 'url', kind: 'text', placeholder: 'https://drive.google.com/file/d/1wroCSfK-hupQIYf_xzeoUEzOhvfTFH2P/edit',
          extractValue: { type: 'regex', regex: fileUrlRegex },
          validation: { type: 'regex', regex: fileUrlRegex, errorMessage: 'Not a valid Google Drive File URL' },
        },
        {
          label: 'ID', value: 'id', kind: 'text', placeholder: '1anGBg0b5re2VtF2bKu201_a-Vnz5BHq9Y4r-yBDAj5A',
          validation: { type: 'regex', regex: '[a-zA-Z0-9\\-_]{2,}', errorMessage: 'Not a valid Google Drive File ID' },
          url: '=https://drive.google.com/file/d/{{$value}}/view',
        },
      ],
      simulationNote: lockedLocatorNote,
    },
    {
      key: 'specificFileEvent', n8nKey: 'event', label: 'Watch For', kind: 'select', sourceKind: 'options',
      value: 'fileUpdated', required: true, showWhen: { triggerOn: ['specificFile'] },
      options: [{ label: 'File Updated', value: 'fileUpdated' }],
      description: 'When to trigger this node',
    },
    {
      key: 'folderToWatch', n8nKey: 'folderToWatch', label: 'Folder', kind: 'resourceLocator',
      sourceKind: 'resourceLocator', value: { __rl: true, mode: 'list', value: '' },
      sourceDefault: { mode: 'list', value: '' }, required: true, locked: true, dynamic: true,
      modes: ['list', 'url', 'id'], options: [], showWhen: { triggerOn: ['specificFolder'] },
      modeOptions: [
        { label: 'Folder', value: 'list', kind: 'list', placeholder: 'Select a folder...', searchListMethod: 'folderSearch', searchable: true },
        {
          label: 'Link', value: 'url', kind: 'text', placeholder: 'https://drive.google.com/drive/folders/1Tx9WHbA3wBpPB4C_HcoZDH9WZFWYxAMU',
          extractValue: { type: 'regex', regex: folderUrlRegex },
          validation: { type: 'regex', regex: folderUrlRegex, errorMessage: 'Not a valid Google Drive Folder URL' },
        },
        {
          label: 'ID', value: 'id', kind: 'text', placeholder: '1anGBg0b5re2VtF2bKu201_a-Vnz5BHq9Y4r-yBDAj5A',
          validation: { type: 'regex', regex: '[a-zA-Z0-9\\-_]{2,}', errorMessage: 'Not a valid Google Drive Folder ID' },
          url: '=https://drive.google.com/drive/folders/{{$value}}',
        },
      ],
      simulationNote: lockedLocatorNote,
    },
    {
      key: 'specificFolderEvent', n8nKey: 'event', label: 'Watch For', kind: 'select', sourceKind: 'options',
      value: '', required: true, showWhen: { triggerOn: ['specificFolder'] },
      options: folderEventOptions,
    },
    {
      key: 'subfolderNotice', n8nKey: 'asas', label: "Changes within subfolders won't trigger this node",
      kind: 'notice', value: '', required: false,
      showWhen: { triggerOn: ['specificFolder'] }, hideWhen: { specificFolderEvent: ['watchFolderUpdated'] },
      n8nShowWhen: { triggerOn: ['specificFolder'] }, n8nHideWhen: { event: ['watchFolderUpdated'] },
    },
    {
      key: 'options', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add option',
      showWhen: { triggerOn: ['specificFolder'], specificFolderEvent: ['fileCreated', 'fileUpdated'] },
      n8nShowWhen: { event: ['fileCreated', 'fileUpdated'] }, n8nHideWhen: { triggerOn: ['specificFile'] },
      fields: [
        {
          key: 'fileType', n8nKey: 'fileType', label: 'File Type', kind: 'select', sourceKind: 'options',
          value: 'all', required: false, options: fileTypeOptions,
          description: 'Triggers only when the file is this type',
        },
      ],
    },
  ],
  sourceCoverage: {
    liveTriggerModes: ['specificFile', 'specificFolder'],
    liveEvents: ['fileUpdated', ...folderEventOptions.map(({ value }) => value)],
    liveOptions: ['fileType'],
    locatorSearchMethods: ['fileSearch', 'folderSearch'],
    loaderInjectedControls: ['pollTimes'],
    excludedDormant: ['anyFileFolder', 'driveToWatch', 'getDrives'],
  },
  platformGaps: [
    'n8n injects Poll Times when the node package loads; the catalog expands the same control explicitly.',
    'File and folder list searches are retained as locked metadata; URL and ID modes remain editable.',
    'The commented anyFileFolder mode, its Drive To Watch loader, and its dormant event branch are intentionally excluded.',
    'The two source event controls share the n8n key event; the simulator gives each conditional branch a unique UI key.',
  ],
  unsupportedControls: [
    { n8nKey: 'pollTimes', sourceType: 'loader-injected polling schedule', behavior: 'editable but inert' },
    { n8nKey: 'fileToWatch', sourceType: 'resourceLocator list search', behavior: 'list locked; URL and ID editable' },
    { n8nKey: 'folderToWatch', sourceType: 'resourceLocator list search', behavior: 'list locked; URL and ID editable' },
    { n8nKey: 'credentials.*', sourceType: 'credential selector', behavior: 'locked/inert' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    apiCalls: false,
    polling: false,
    webhookRegistration: false,
    network: false,
    runtime: false,
    expressionExecution: false,
    voice: false,
  },
  output: {},
};

export default googleDriveTrigger;
