// Editor-only descriptor for n8n's Google Calendar Trigger v1 node. OAuth,
// calendar search, polling, API requests, expressions, and execution stay inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This selector is locked. The simulation never reads, creates, tests, refreshes, or applies Google Calendar credentials.';
const lockedCalendarNote =
  'Calendar search is locked and empty. ID mode remains authorable without contacting Google.';

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

const triggerOptions = [
  { label: 'Event Cancelled', value: 'eventCancelled' },
  { label: 'Event Created', value: 'eventCreated' },
  { label: 'Event Ended', value: 'eventEnded' },
  { label: 'Event Started', value: 'eventStarted' },
  { label: 'Event Updated', value: 'eventUpdated' },
];

const credentialRequirements = [
  {
    type: 'googleCalendarOAuth2Api', name: 'Google Calendar OAuth2 API', required: true,
    extends: ['googleOAuth2Api', 'oAuth2Api'], inert: true,
  },
];

const googleCalendarTrigger = {
  type: 'google-calendar-trigger',
  n8nType: 'n8n-nodes-base.googleCalendarTrigger',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'Google Calendar Trigger',
  defaultName: 'Google Calendar Trigger',
  subtitle: '={{$parameter["triggerOn"]}}',
  description: 'Starts the workflow when Google Calendar events occur',
  category: 'trigger',
  categories: ['Productivity'],
  group: ['trigger'],
  defaults: { name: 'Google Calendar Trigger' },
  inputs: [],
  outputs: ['main'],
  polling: true,
  icon: '/node-icons/google-calendar.svg',
  n8nIcon: 'file:googleCalendar.svg',
  iconMode: 'image',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.googlecalendartrigger/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Google/Calendar/GoogleCalendarTrigger.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Google/Calendar/GoogleCalendarTrigger.node.json',
    helperPath: 'packages/nodes-base/nodes/Google/Calendar/GenericFunctions.ts',
    testPath: 'packages/nodes-base/nodes/Google/Calendar/test/GoogleCalendarTrigger.node.test.ts',
    pollingParameterPath: 'packages/core/src/nodes-loader/constants.ts',
    pollingInjectionPath: 'packages/core/src/nodes-loader/directory-loader.ts',
    cronOptionsPath: 'packages/workflow/src/node-helpers.ts',
    credentialPaths: [
      'packages/nodes-base/credentials/GoogleCalendarOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/GoogleOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/OAuth2Api.credentials.ts',
    ],
    iconPath: 'packages/nodes-base/nodes/Google/Calendar/googleCalendar.svg',
  },
  credentialRequirements,
  params: [
    {
      key: 'googleCalendarCredential', n8nKey: 'credentials.googleCalendarOAuth2Api',
      label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials',
      value: 'googleCalendarOAuth2Api', sourceDefault: '', required: true, locked: true,
      dynamic: true, options: [{ label: 'Google Calendar OAuth2 API', value: 'googleCalendarOAuth2Api' }],
      simulationNote: lockedCredentialNote,
    },
    pollTimes,
    {
      key: 'calendarId', n8nKey: 'calendarId', label: 'Calendar', kind: 'resourceLocator',
      sourceKind: 'resourceLocator', value: { __rl: true, mode: 'list', value: '' },
      sourceDefault: { mode: 'list', value: '' }, required: true, locked: true, dynamic: true,
      modes: ['list', 'id'], options: [],
      modeOptions: [
        { label: 'Calendar', value: 'list', kind: 'list', placeholder: 'Select a Calendar...', searchListMethod: 'getCalendars', searchable: true },
        {
          label: 'ID', value: 'id', kind: 'text', placeholder: 'name@google.com',
          validation: { type: 'regex', regex: '(^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*(?:[ \\t]+)*$)', errorMessage: 'Not a valid Google Calendar ID' },
          extractValue: { type: 'regex', regex: '(^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*)' },
        },
      ],
      description: 'Google Calendar to operate on', simulationNote: lockedCalendarNote,
    },
    {
      key: 'triggerOn', n8nKey: 'triggerOn', label: 'Trigger On', kind: 'select', sourceKind: 'options',
      value: '', required: true, options: triggerOptions,
    },
    {
      key: 'options', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add option',
      fields: [
        {
          key: 'matchTerm', n8nKey: 'matchTerm', label: 'Match Term', kind: 'text', value: '', required: false,
          description: 'Free text search terms to filter events that match these terms in any field, except for extended properties',
        },
      ],
    },
  ],
  sourceCoverage: {
    liveEvents: triggerOptions.map(({ value }) => value),
    liveOptions: ['matchTerm'],
    locatorSearchMethods: ['getCalendars'],
    loaderInjectedControls: ['pollTimes'],
  },
  platformGaps: [
    'n8n injects Poll Times when the node package loads; the catalog expands the same control explicitly.',
    'Calendar list search is retained as locked metadata; ID mode remains editable.',
    'Manual execution, date filtering, workflow static data, and the no-results runtime error are not simulated.',
  ],
  unsupportedControls: [
    { n8nKey: 'pollTimes', sourceType: 'loader-injected polling schedule', behavior: 'editable but inert' },
    { n8nKey: 'calendarId', sourceType: 'resourceLocator list search', behavior: 'list locked; ID editable' },
    { n8nKey: 'credentials.googleCalendarOAuth2Api', sourceType: 'credential selector', behavior: 'locked/inert' },
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

export default googleCalendarTrigger;
