// Editor-only descriptor for n8n's Zoom v1 action node.
// Credentials, timezone loading, meeting operations, API calls, and tool execution remain inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This credential selector is locked. The simulation never creates, reads, tests, refreshes, or applies Zoom credentials.';
const lockedTimezoneNote =
  'The native timezone list is generated from moment-timezone at runtime. Options remain locked and empty in this inert descriptor; an explicit timezone ID can still be authored as an expression.';

const meetingOperations = [
  { label: 'Create', value: 'create', description: 'Create a meeting', action: 'Create a meeting' },
  { label: 'Delete', value: 'delete', description: 'Delete a meeting', action: 'Delete a meeting' },
  { label: 'Get', value: 'get', description: 'Retrieve a meeting', action: 'Get a meeting' },
  { label: 'Get Many', value: 'getAll', description: 'Retrieve many meetings', action: 'Get many meetings' },
  { label: 'Update', value: 'update', description: 'Update a meeting', action: 'Update a meeting' },
];

const audioOptions = [
  { label: 'Both Telephony and VoiP', value: 'both' },
  { label: 'Telephony', value: 'telephony' },
  { label: 'VOIP', value: 'voip' },
];

const autoRecordingOptions = [
  { label: 'Record on Local', value: 'local' },
  { label: 'Record on Cloud', value: 'cloud' },
  { label: 'Disabled', value: 'none' },
];

const createRegistrationTypeOptions = [
  { label: 'Attendees register once and can attend any of the occurrences', value: 1 },
  { label: 'Attendees need to register for every occurrence', value: 2 },
  { label: 'Attendees register once and can choose one or more occurrences to attend', value: 3 },
];

const updateRegistrationTypeOptions = [
  { label: 'Attendees Register Once and Can Attend Any of the Occurrences', value: 1 },
  { label: 'Attendees Need to Register for Every Occurrence', value: 2 },
  { label: 'Attendees Register Once and Can Choose One or More Occurrences to Attend', value: 3 },
];

const meetingTypeOptions = [
  { label: 'Instant Meeting', value: 1 },
  { label: 'Scheduled Meeting', value: 2 },
  { label: 'Recurring Meeting with No Fixed Time', value: 3 },
  { label: 'Recurring Meeting with Fixed Time', value: 8 },
];

const operationWhen = (operations, uiExtra = {}, n8nExtra = {}) => ({
  showWhen: {
    resource: ['meeting'],
    meetingOperation: Array.isArray(operations) ? operations : [operations],
    ...uiExtra,
  },
  n8nShowWhen: {
    resource: ['meeting'],
    operation: Array.isArray(operations) ? operations : [operations],
    ...n8nExtra,
  },
});

const settingsFields = (prefix, update = false) => [
  {
    key: `${prefix}Audio`, n8nKey: 'audio', label: 'Audio', kind: 'select', sourceKind: 'options', value: 'both', required: false,
    options: audioOptions, description: 'Determine how participants can join audio portion of the meeting',
  },
  {
    key: `${prefix}AlternativeHosts`, n8nKey: 'alternativeHosts', label: 'Alternative Hosts', kind: 'text', value: '', required: false,
    description: 'Alternative hosts email IDs',
  },
  {
    key: `${prefix}AutoRecording`, n8nKey: 'autoRecording', label: 'Auto Recording', kind: 'select', sourceKind: 'options',
    value: 'none', required: false, options: autoRecordingOptions,
  },
  { key: `${prefix}CnMeeting`, n8nKey: 'cnMeeting', label: 'Host Meeting in China', kind: 'boolean', value: false, required: false },
  { key: `${prefix}InMeeting`, n8nKey: 'inMeeting', label: 'Host Meeting in India', kind: 'boolean', value: false, required: false },
  {
    key: `${prefix}HostVideo`, n8nKey: 'hostVideo', label: 'Host Video', kind: 'boolean', value: false, required: false,
    description: 'Whether to start a video when host joins the meeting',
  },
  {
    key: `${prefix}JoinBeforeHost`, n8nKey: 'joinBeforeHost', label: 'Join Before Host', kind: 'boolean', value: false, required: false,
    description: 'Whether to allow participants to join the meeting before host starts it',
  },
  {
    key: `${prefix}MuteUponEntry`, n8nKey: 'muteUponEntry', label: 'Muting Upon Entry', kind: 'boolean', value: false, required: false,
    description: 'Whether to mute participants upon entry',
  },
  {
    key: `${prefix}ParticipantVideo`, n8nKey: 'participantVideo', label: 'Participant Video', kind: 'boolean', value: false, required: false,
    description: 'Whether to start a video when participant joins the meeting',
  },
  {
    key: `${prefix}RegistrationType`, n8nKey: 'registrationType', label: 'Registration Type', kind: 'select', sourceKind: 'options',
    value: 1, required: false, options: update ? updateRegistrationTypeOptions : createRegistrationTypeOptions,
    description: 'Registration type. Used for recurring meetings with fixed time only.',
  },
  {
    key: `${prefix}Watermark`, n8nKey: 'watermark', label: 'Watermark', kind: 'boolean', value: false, required: false,
    description: update ? 'Whether to add watermark when viewing a shared screen' : 'Whether to add a watermark when viewing a shared screen',
  },
];

const timezoneField = (prefix) => ({
  key: `${prefix}TimeZone`, n8nKey: 'timeZone', label: 'Timezone Name or ID', kind: 'select', sourceKind: 'options',
  value: '', required: false, options: [], locked: true, dynamic: true, loadOptionsMethod: 'getTimezones',
  description: 'Time zone used in the response. The default is the time zone of the calendar. Choose from the list, or specify an ID using an expression.',
  simulationNote: lockedTimezoneNote,
});

const zoomAccessTokenFields = [
  {
    key: 'notice', n8nKey: 'notice',
    label: 'On 1 June, 2023 Zoom will remove JWT App support. You will have to connect to Zoom using the Oauth2 auth method. More details (zoom.us)',
    kind: 'notice', value: '', required: false,
    sourceLabelHtml: 'On 1 June, 2023 Zoom will remove JWT App support. You will have to connect to Zoom using the Oauth2 auth method. <a target="_blank" href="https://marketplace.zoom.us/docs/guides/build/jwt-app/jwt-faq/">More details (zoom.us)</a>',
  },
  { key: 'accessToken', n8nKey: 'accessToken', label: 'JWT Token', kind: 'text', sourceKind: 'string', value: '', required: false, password: true },
];

const zoomOAuthFields = [
  { key: 'useDynamicClientRegistration', n8nKey: 'useDynamicClientRegistration', label: 'Use Dynamic Client Registration', kind: 'hidden', value: false, required: false, sourceOrigin: 'oAuth2Api' },
  { key: 'grantType', n8nKey: 'grantType', label: 'Grant Type', kind: 'hidden', value: 'authorizationCode', required: false },
  { key: 'clientId', n8nKey: 'clientId', label: 'Client ID', kind: 'text', value: '', required: true, sourceOrigin: 'oAuth2Api' },
  { key: 'clientCredentialType', n8nKey: 'clientCredentialType', label: 'Authentication', kind: 'hidden', value: 'clientSecret', required: false, sourceOrigin: 'oAuth2Api' },
  { key: 'clientSecret', n8nKey: 'clientSecret', label: 'Client Secret', kind: 'text', value: '', required: true, password: true, sourceOrigin: 'oAuth2Api' },
  { key: 'privateKey', n8nKey: 'privateKey', label: 'Private Key', kind: 'hidden', value: '', required: false, sourceOrigin: 'oAuth2Api' },
  { key: 'certificate', n8nKey: 'certificate', label: 'Certificate', kind: 'hidden', value: '', required: false, sourceOrigin: 'oAuth2Api' },
  { key: 'authUrl', n8nKey: 'authUrl', label: 'Authorization URL', kind: 'hidden', value: 'https://zoom.us/oauth/authorize', required: false },
  { key: 'accessTokenUrl', n8nKey: 'accessTokenUrl', label: 'Access Token URL', kind: 'hidden', value: 'https://zoom.us/oauth/token', required: false },
  { key: 'scope', n8nKey: 'scope', label: 'Scope', kind: 'hidden', value: '', required: false },
  { key: 'authQueryParameters', n8nKey: 'authQueryParameters', label: 'Auth URI Query Parameters', kind: 'hidden', value: '', required: false },
  { key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'hidden', value: 'header', required: false },
];

const zoom = {
  type: 'zoom',
  n8nType: 'n8n-nodes-base.zoom',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'Zoom',
  defaultName: 'Zoom',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Consume Zoom API',
  category: 'action',
  categories: ['Communication'],
  group: ['input'],
  defaults: { name: 'Zoom' },
  inputs: ['main'],
  outputs: ['main'],
  aiConnectorPorts: [],
  usableAsTool: true,
  icon: '/node-icons/zoom.svg',
  n8nIcon: 'file:zoom.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { viewBox: '0 0 65 65' },
  iconAssetSha256: '00d196a62f0562618b5503fdc5de0977b12c53877855d6bca34f3d9c34d18944',
  sourceIconAssetSha256: '00d196a62f0562618b5503fdc5de0977b12c53877855d6bca34f3d9c34d18944',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.zoom/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/zoom/',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Zoom/Zoom.node.ts',
    meetingDescriptionPath: 'packages/nodes-base/nodes/Zoom/MeetingDescription.ts',
    metadataPath: 'packages/nodes-base/nodes/Zoom/Zoom.node.json',
    helperPath: 'packages/nodes-base/nodes/Zoom/GenericFunctions.ts',
    credentialPaths: [
      'packages/nodes-base/credentials/ZoomApi.credentials.ts',
      'packages/nodes-base/credentials/ZoomOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/OAuth2Api.credentials.ts',
    ],
    iconPath: 'packages/nodes-base/nodes/Zoom/zoom.svg',
    dormantDescriptionPaths: [
      'packages/nodes-base/nodes/Zoom/MeetingRegistrantDescription.ts',
      'packages/nodes-base/nodes/Zoom/WebinarDescription.ts',
    ],
  },
  resources: [{ value: 'meeting', defaultOperation: 'create', operations: meetingOperations.map(({ value }) => value) }],
  credentialRequirements: [
    {
      type: 'zoomApi', name: 'Zoom API', required: true, inert: true, showWhen: { authentication: ['accessToken'] },
      documentationUrl: 'zoom', fields: zoomAccessTokenFields,
      authenticationMetadata: { type: 'generic', header: 'Authorization: Bearer {{$credentials.accessToken}}', inert: true },
      testRequest: { method: 'GET', baseURL: 'https://api.zoom.us/v2', path: '/users/me', inert: true },
    },
    {
      type: 'zoomOAuth2Api', name: 'Zoom OAuth2 API', required: true, inert: true, showWhen: { authentication: ['oAuth2'] },
      documentationUrl: 'zoom', extends: ['oAuth2Api'], fields: zoomOAuthFields,
    },
  ],
  credentialUiMetadata: [
    { key: 'zoomAccessTokenCredential', type: 'zoomApi', label: 'Zoom API', showWhen: { authentication: ['accessToken'] }, fields: zoomAccessTokenFields, renderedInCredentialEditor: false, inert: true },
    { key: 'zoomOAuthCredential', type: 'zoomOAuth2Api', label: 'Zoom OAuth2 API', showWhen: { authentication: ['oAuth2'] }, extends: ['oAuth2Api'], fields: zoomOAuthFields, renderedInCredentialEditor: false, inert: true },
  ],
  params: [
    {
      key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'select', sourceKind: 'options',
      value: 'accessToken', required: false, options: [{ label: 'Access Token', value: 'accessToken' }, { label: 'OAuth2', value: 'oAuth2' }],
    },
    {
      key: 'zoomAccessTokenCredential', n8nKey: 'credentials.zoomApi', label: 'Credential to connect with',
      kind: 'select', sourceKind: 'credentials', value: 'zoomApi', required: true, locked: true, dynamic: true,
      showWhen: { authentication: ['accessToken'] }, options: [{ label: 'Zoom API', value: 'zoomApi' }], simulationNote: lockedCredentialNote,
    },
    {
      key: 'zoomOAuthCredential', n8nKey: 'credentials.zoomOAuth2Api', label: 'Credential to connect with',
      kind: 'select', sourceKind: 'credentials', value: 'zoomOAuth2Api', required: true, locked: true, dynamic: true,
      showWhen: { authentication: ['oAuth2'] }, options: [{ label: 'Zoom OAuth2 API', value: 'zoomOAuth2Api' }], simulationNote: lockedCredentialNote,
    },
    {
      key: 'resource', n8nKey: 'resource', label: 'Resource', kind: 'select', sourceKind: 'options', value: 'meeting', required: false,
      noDataExpression: true, options: [{ label: 'Meeting', value: 'meeting' }],
    },
    {
      key: 'meetingOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'create', required: false,
      noDataExpression: true, showWhen: { resource: ['meeting'] }, options: meetingOperations,
    },
    {
      key: 'meetingCreateTopic', n8nKey: 'topic', label: 'Topic', kind: 'text', value: '', required: false,
      description: 'Topic of the meeting', ...operationWhen('create'),
    },
    {
      key: 'meetingCreateAdditionalFields', n8nKey: 'additionalFields', label: 'Additional Fields', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Field', ...operationWhen('create'),
      fields: [
        { key: 'meetingCreateAgenda', n8nKey: 'agenda', label: 'Agenda', kind: 'text', value: '', required: false, description: 'Meeting agenda' },
        { key: 'meetingCreateDuration', n8nKey: 'duration', label: 'Duration', kind: 'number', value: 0, required: false, min: 0, description: 'Meeting duration (minutes)' },
        { key: 'meetingCreatePassword', n8nKey: 'password', label: 'Password', kind: 'text', value: '', required: false, password: true, description: 'Password to join the meeting with maximum 10 characters' },
        { key: 'meetingCreateScheduleFor', n8nKey: 'scheduleFor', label: 'Schedule For', kind: 'text', value: '', required: false, description: 'Schedule meeting for someone else from your account, provide their email ID' },
        {
          key: 'meetingCreateSettings', n8nKey: 'settings', label: 'Settings', kind: 'collection', sourceKind: 'collection',
          value: {}, required: false, addLabel: 'Add Setting', fields: settingsFields('meetingCreateSettings'),
        },
        {
          key: 'meetingCreateStartTime', n8nKey: 'startTime', label: 'Start Time', kind: 'text', sourceKind: 'dateTime', value: '', required: false,
          inputType: 'datetime-local', description: 'Start time should be used only for scheduled or recurring meetings with fixed time',
        },
        timezoneField('meetingCreate'),
        {
          key: 'meetingCreateType', n8nKey: 'type', label: 'Type', kind: 'select', sourceKind: 'options', value: 2, required: false,
          options: meetingTypeOptions, description: 'Meeting type',
        },
      ],
    },
    {
      key: 'meetingGetId', n8nKey: 'meetingId', label: 'ID', kind: 'text', value: '', required: true,
      description: 'Meeting ID', ...operationWhen('get'),
    },
    {
      key: 'meetingGetAdditionalFields', n8nKey: 'additionalFields', label: 'Additional Fields', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Field', ...operationWhen('get'), fields: [
        { key: 'meetingGetOccurrenceId', n8nKey: 'occurrenceId', label: 'Occurrence ID', kind: 'text', value: '', required: false, description: 'To view meeting details of a particular occurrence of the recurring meeting' },
        { key: 'meetingGetShowPreviousOccurrences', n8nKey: 'showPreviousOccurrences', label: 'Show Previous Occurrences', kind: 'boolean', value: false, required: false, description: 'Whether to view meeting details of all previous occurrences of the recurring meeting' },
      ],
    },
    {
      key: 'meetingGetAllReturnAll', n8nKey: 'returnAll', label: 'Return All', kind: 'boolean', value: false, required: false,
      description: 'Whether to return all results or only up to a given limit', ...operationWhen('getAll'),
    },
    {
      key: 'meetingGetAllLimit', n8nKey: 'limit', label: 'Limit', kind: 'number', value: 30, required: false, min: 1, max: 300,
      description: 'Max number of results to return',
      ...operationWhen('getAll', { meetingGetAllReturnAll: [false] }, { returnAll: [false] }),
    },
    {
      key: 'meetingGetAllFilters', n8nKey: 'filters', label: 'Filters', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Filter', ...operationWhen('getAll'), fields: [{
        key: 'meetingGetAllFilterType', n8nKey: 'type', label: 'Type', kind: 'select', sourceKind: 'options', value: 'live', required: false,
        options: [
          { label: 'Scheduled', value: 'scheduled', description: 'This includes all valid past meetings, live meetings and upcoming scheduled meetings' },
          { label: 'Live', value: 'live', description: 'All ongoing meetings' },
          { label: 'Upcoming', value: 'upcoming', description: 'All upcoming meetings including live meetings' },
        ], description: 'Meeting type',
      }],
    },
    {
      key: 'meetingDeleteId', n8nKey: 'meetingId', label: 'ID', kind: 'text', value: '', required: true,
      description: 'Meeting ID', ...operationWhen('delete'),
    },
    {
      key: 'meetingDeleteAdditionalFields', n8nKey: 'additionalFields', label: 'Additional Fields', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Field', ...operationWhen('delete'), fields: [
        { key: 'meetingDeleteOccurrenceId', n8nKey: 'occurrenceId', label: 'Occurrence ID', kind: 'text', value: '', required: false, description: 'Meeting occurrence ID' },
        { key: 'meetingDeleteScheduleReminder', n8nKey: 'scheduleForReminder', label: 'Schedule Reminder', kind: 'boolean', value: false, required: false, description: 'Whether to notify hosts and alternative hosts about meeting cancellation via email' },
      ],
    },
    {
      key: 'meetingUpdateId', n8nKey: 'meetingId', label: 'ID', kind: 'text', value: '', required: true,
      description: 'Meeting ID', ...operationWhen('update'),
    },
    {
      key: 'meetingUpdateFields', n8nKey: 'updateFields', label: 'Update Fields', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add Field', ...operationWhen('update'), fields: [
        { key: 'meetingUpdateAgenda', n8nKey: 'agenda', label: 'Agenda', kind: 'text', value: '', required: false, description: 'Meeting agenda' },
        { key: 'meetingUpdateDuration', n8nKey: 'duration', label: 'Duration', kind: 'number', value: 0, required: false, min: 0, description: 'Meeting duration (minutes)' },
        { key: 'meetingUpdatePassword', n8nKey: 'password', label: 'Password', kind: 'text', value: '', required: false, password: true, description: 'Password to join the meeting with maximum 10 characters' },
        { key: 'meetingUpdateScheduleFor', n8nKey: 'scheduleFor', label: 'Schedule For', kind: 'text', value: '', required: false, description: 'Schedule meeting for someone else from your account, provide their email ID' },
        {
          key: 'meetingUpdateSettings', n8nKey: 'settings', label: 'Settings', kind: 'collection', sourceKind: 'collection',
          value: {}, required: false, addLabel: 'Add Setting', fields: settingsFields('meetingUpdateSettings', true),
        },
        {
          key: 'meetingUpdateStartTime', n8nKey: 'startTime', label: 'Start Time', kind: 'text', sourceKind: 'dateTime', value: '', required: false,
          inputType: 'datetime-local', description: 'Start time should be used only for scheduled or recurring meetings with fixed time',
        },
        timezoneField('meetingUpdate'),
        { key: 'meetingUpdateTopic', n8nKey: 'topic', label: 'Topic', kind: 'text', value: '', required: false, description: 'Meeting topic' },
        {
          key: 'meetingUpdateType', n8nKey: 'type', label: 'Type', kind: 'select', sourceKind: 'options', value: 2, required: false,
          options: meetingTypeOptions, description: 'Meeting type',
        },
      ],
    },
  ],
  resourceOperationParity: {
    meeting: { expected: ['create', 'delete', 'get', 'getAll', 'update'], represented: meetingOperations.map(({ value }) => value), default: 'create' },
  },
  operationCount: 5,
  lookupMetadata: {
    getTimezones: { parameters: ['additionalFields.timeZone', 'updateFields.timeZone'], provider: 'moment-timezone.tz.names()', networkAccess: false, runtimeExecution: false },
  },
  versionBranches: [{ versions: 1, implementation: 'Zoom', representedInCurrentParams: true }],
  docsSummary: {
    operations: { meeting: meetingOperations.map(({ value }) => value) },
    currentDocsParity: true,
    aiToolDocumented: true,
    credentialMethods: ['accessToken', 'oAuth2'],
    oauthScopesDocumented: ['meeting:read', 'meeting:write'],
    accessTokenStatus: 'Zoom removed JWT access-token support in June 2023; source still exposes the legacy credential.',
  },
  platformGaps: [
    'The native node reuses meetingId, additionalFields, type, and every nested meeting setting across conditional branches. Unique UI keys keep branches stable while n8nKey records the real parameter name.',
    'Native dateTime controls are normalized to supported text controls with datetime-local input metadata. Date parsing, moment-timezone conversion, and n8n workflow-timezone fallback never run.',
    'Timezone options normally load locally from moment-timezone. The runtime method is preserved as lookup metadata, while the inert select remains locked and empty.',
    'Credential editors are metadata-only. JWT bearer attachment, OAuth authorization and refresh, secret access, credential tests, and request authentication never run.',
    'The source still offers a legacy Zoom API JWT token credential even though Zoom and the official n8n credential guide state that JWT support was removed in June 2023.',
    'Meeting creation, retrieval, listing, pagination, rate-limit sleeps, updates, deletion, response shaping, and all Zoom API requests are unavailable.',
    'Meeting Registrant and Webinar description modules are present in the source tree but commented out of the node resource list and execution path. They are not part of the live action authoring surface.',
    'usableAsTool is preserved as capability metadata; no AI-tool connector or executable tool runtime is exposed.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials.zoomApi, credentials.zoomOAuth2Api', sourceType: 'credentials', normalizedKind: 'locked select', reason: 'Credential discovery and credential editors are unavailable.' },
    { n8nKey: 'additionalFields.startTime, updateFields.startTime', sourceType: 'dateTime', normalizedKind: 'text with datetime-local metadata', reason: 'The catalog renderer has no native dateTime control.' },
    { n8nKey: 'additionalFields.timeZone, updateFields.timeZone', sourceType: 'options with loadOptionsMethod', normalizedKind: 'locked select', reason: 'Runtime moment-timezone option generation is disabled.' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    credentialRefresh: false,
    authentication: false,
    jwtAuthentication: false,
    oauthAuthorization: false,
    oauthRefresh: false,
    timezoneLookup: false,
    dateConversion: false,
    apiRequests: false,
    networkAccess: false,
    meetingCreate: false,
    meetingRead: false,
    meetingList: false,
    meetingUpdate: false,
    meetingDelete: false,
    pagination: false,
    rateLimitSleep: false,
    expressionEvaluation: false,
    toolExecution: false,
    voice: false,
  },
  output: {},
};

export default zoom;
