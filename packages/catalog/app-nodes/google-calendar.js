// Editor-only descriptor for n8n's Google Calendar v1.3 action node.
// OAuth, list searches, option loading, date/expression evaluation, Calendar API
// calls, event mutations, conference creation, and AI-tool execution remain inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This credential selector is locked. The simulation never creates, reads, tests, refreshes, or applies Google Calendar credentials.';
const lockedCalendarNote =
  'n8n normally searches the authenticated Google account for calendars. The list is locked and empty; By ID remains authorable without contacting Google.';
const lockedTimezoneNote =
  'n8n normally searches its bundled moment-timezone names. The list is retained as inert local-source metadata; By ID remains authorable.';
const lockedRemoteOptionNote =
  'n8n normally loads these choices from Google Calendar. The list is locked and empty and no request is made.';

const calendarIdRegex =
  '(^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*(?:[ \\t]+)*$)';
const calendarIdExtractRegex =
  '(^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*)';

const sendUpdatesOptions = [
  { label: 'All', value: 'all', description: 'Notifications are sent to all guests' },
  {
    label: 'External Only',
    value: 'externalOnly',
    description: 'Notifications are sent to non-Google Calendar guests only',
  },
  {
    label: 'None',
    value: 'none',
    description: 'No notifications are sent. This value should only be used for migration use case.',
  },
];

const yesNoOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

const repeatFrequencyOptions = [
  { label: 'Daily', value: 'Daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const showMeAsOptions = [
  {
    label: 'Available',
    value: 'transparent',
    description: 'The event does not block time on the calendar',
  },
  { label: 'Busy', value: 'opaque', description: 'The event does block time on the calendar' },
];

const visibilityOptions = [
  {
    label: 'Confidential',
    value: 'confidential',
    description: 'The event is private. This value is provided for compatibility reasons.',
  },
  {
    label: 'Default',
    value: 'default',
    description: 'Uses the default visibility for events on the calendar',
  },
  {
    label: 'Private',
    value: 'private',
    description: 'The event is private and only event attendees may view event details',
  },
  {
    label: 'Public',
    value: 'public',
    description: 'The event is public and event details are visible to all readers of the calendar',
  },
];

const calendarOperations = [
  {
    label: 'Availability',
    value: 'availability',
    description: 'If a time-slot is available in a calendar',
    action: 'Get availability in a calendar',
  },
];

const eventOperations = [
  { label: 'Create', value: 'create', description: 'Add a event to calendar', action: 'Create an event' },
  { label: 'Delete', value: 'delete', description: 'Delete an event', action: 'Delete an event' },
  { label: 'Get', value: 'get', description: 'Retrieve an event', action: 'Get an event' },
  {
    label: 'Get Many',
    value: 'getAll',
    description: 'Retrieve many events from a calendar',
    action: 'Get many events',
  },
  { label: 'Update', value: 'update', description: 'Update an event', action: 'Update an event' },
];

const operationWhen = (resource, operation, uiExtra = {}, n8nExtra = {}) => {
  const operations = Array.isArray(operation) ? operation : [operation];
  return {
    showWhen: { resource: [resource], [`${resource}Operation`]: operations, ...uiExtra },
    n8nShowWhen: { resource: [resource], operation: operations, ...n8nExtra },
  };
};

const makeText = (key, n8nKey, label, value, visibility, extra = {}) => ({
  key,
  n8nKey,
  label,
  kind: 'text',
  value,
  ...visibility,
  ...extra,
});

const makeNumber = (key, n8nKey, label, value, visibility = {}, extra = {}) => ({
  key,
  n8nKey,
  label,
  kind: 'number',
  value,
  ...visibility,
  ...extra,
});

const makeBoolean = (key, n8nKey, label, value, visibility = {}, extra = {}) => ({
  key,
  n8nKey,
  label,
  kind: 'boolean',
  value,
  ...visibility,
  ...extra,
});

const makeSelect = (key, n8nKey, label, value, options, visibility = {}, extra = {}) => ({
  key,
  n8nKey,
  label,
  kind: 'select',
  value,
  options,
  ...visibility,
  ...extra,
});

const makeCollection = (key, n8nKey, label, visibility, fields, addLabel = 'Add option') => ({
  key,
  n8nKey,
  label,
  kind: 'collection',
  sourceKind: 'collection',
  value: {},
  sourceDefault: {},
  addLabel,
  fields,
  ...visibility,
});

const makeDateTime = (key, n8nKey, label, value, visibility, extra = {}) =>
  makeText(key, n8nKey, label, value, visibility, {
    sourceKind: 'dateTime',
    sourceDefault: value,
    expressionCapable: true,
    expressionExecution: false,
    ...extra,
  });

const makeCalendarLocator = (key, visibility) => ({
  key,
  n8nKey: 'calendar',
  label: 'Calendar',
  kind: 'resourceLocator',
  sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' },
  sourceDefault: { mode: 'list', value: '' },
  required: true,
  description: 'Google Calendar to operate on',
  locked: true,
  dynamic: true,
  modes: ['list', 'id'],
  modeOptions: [
    {
      label: 'Calendar',
      value: 'list',
      kind: 'list',
      placeholder: 'Select a Calendar...',
      searchListMethod: 'getCalendars',
      searchable: true,
    },
    {
      label: 'ID',
      value: 'id',
      kind: 'text',
      placeholder: 'name@google.com',
      validation: { type: 'regex', regex: calendarIdRegex, errorMessage: 'Not a valid Google Calendar ID' },
      extractValue: { type: 'regex', regex: calendarIdExtractRegex },
    },
  ],
  options: [],
  dynamicOptions: { source: 'getCalendars', endpoint: '/calendar/v3/users/me/calendarList', inert: true },
  simulationNote: lockedCalendarNote,
  ...visibility,
});

const makeTimezoneLocator = (key, n8nKey, visibility = {}) => ({
  key,
  n8nKey,
  label: 'Timezone',
  kind: 'resourceLocator',
  sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' },
  sourceDefault: { mode: 'list', value: '' },
  description: 'Time zone used in the response. The default is the time zone of the calendar.',
  locked: true,
  dynamic: true,
  modes: ['list', 'id'],
  modeOptions: [
    {
      label: 'Timezone',
      value: 'list',
      kind: 'list',
      placeholder: 'Select a Timezone...',
      searchListMethod: 'getTimezones',
      searchable: true,
    },
    {
      label: 'ID',
      value: 'id',
      kind: 'text',
      placeholder: 'Europe/Berlin',
      validation: {
        type: 'regex',
        source: 'TIMEZONE_VALIDATION_REGEX generated from moment.tz.names()',
        errorMessage: 'Not a valid Timezone',
      },
      extractValue: { type: 'regex', regex: '([-+/_a-zA-Z0-9]*)' },
    },
  ],
  options: [],
  dynamicOptions: { source: 'getTimezones', staticLocal: true, inert: true },
  simulationNote: lockedTimezoneNote,
  ...visibility,
});

const makeColorField = (key) => ({
  key,
  n8nKey: 'color',
  label: 'Color Name or ID',
  kind: 'select',
  sourceKind: 'options',
  value: '',
  options: [],
  locked: true,
  dynamic: true,
  dynamicOptions: { source: 'getColors', endpoint: '/calendar/v3/colors', inert: true },
  description: 'The color of the event. Choose from the list, or specify an ID using an expression.',
  simulationNote: lockedRemoteOptionNote,
});

const makeAttendeesText = (key, n8nKey = 'attendees') => ({
  key,
  n8nKey,
  label: 'Attendees',
  kind: 'text',
  sourceKind: 'string',
  value: '',
  sourceDefault: '',
  multipleValues: true,
  multipleValueButtonText: 'Add Attendee',
  description: 'The attendees of the event. Multiple ones can be separated by comma.',
});

const makeEventMutationFields = (prefix, { includeConference, updateAttendees } = {}) => {
  const fields = [
    makeSelect(`${prefix}AllDay`, 'allday', 'All Day', 'no', yesNoOptions, {}, {
      description: 'Whether the event is all day or not',
    }),
  ];

  if (updateAttendees) {
    fields.push({
      key: `${prefix}AttendeesUi`,
      n8nKey: 'attendeesUi',
      label: 'Attendees',
      kind: 'fixedCollection',
      sourceKind: 'fixedCollection',
      value: { values: { mode: 'add', attendees: [] } },
      sourceDefault: { values: { mode: 'add', attendees: [] } },
      collectionKey: 'values',
      collectionLabel: 'Values',
      multiple: false,
      addLabel: 'Add Attendees',
      fields: [
        makeSelect(`${prefix}AttendeesMode`, 'mode', 'Mode', 'add', [
          { label: 'Add Attendees Below [Default]', value: 'add' },
          { label: 'Replace Attendees with Those Below', value: 'replace' },
        ]),
        makeAttendeesText(`${prefix}Attendees`),
      ],
      sourceVersionCondition: '@version >= 1.2',
    });
  } else {
    fields.push(makeAttendeesText(`${prefix}Attendees`));
  }

  fields.push(makeColorField(`${prefix}Color`));

  if (includeConference) {
    fields.push({
      key: `${prefix}ConferenceDataUi`,
      n8nKey: 'conferenceDataUi',
      label: 'Conference Data',
      kind: 'fixedCollection',
      sourceKind: 'fixedCollection',
      value: {},
      sourceDefault: {},
      collectionKey: 'conferenceDataValues',
      collectionLabel: 'Conference Link',
      multiple: false,
      addLabel: 'Add Conference',
      description: 'Creates a conference link (Hangouts, Meet etc) and attaches it to the event',
      fields: [
        {
          key: `${prefix}ConferenceSolution`,
          n8nKey: 'conferenceSolution',
          label: 'Type Name or ID',
          kind: 'select',
          sourceKind: 'options',
          value: '',
          options: [],
          locked: true,
          dynamic: true,
          dynamicOptions: {
            source: 'getConferenceSolutions',
            dependsOn: ['calendar'],
            endpoint: '/calendar/v3/users/me/calendarList/{calendar}',
            inert: true,
          },
          description: 'Choose from the list, or specify an ID using an expression',
          simulationNote: lockedRemoteOptionNote,
        },
      ],
    });
  }

  fields.push(
    makeText(`${prefix}Description`, 'description', 'Description', '', {}),
    makeBoolean(`${prefix}GuestsCanInviteOthers`, 'guestsCanInviteOthers', 'Guests Can Invite Others', true, {}, {
      description: 'Whether attendees other than the organizer can invite others to the event',
    }),
    makeBoolean(`${prefix}GuestsCanModify`, 'guestsCanModify', 'Guests Can Modify', false, {}, {
      description: 'Whether attendees other than the organizer can modify the event',
    }),
    makeBoolean(
      `${prefix}GuestsCanSeeOtherGuests`,
      'guestsCanSeeOtherGuests',
      'Guests Can See Other Guests',
      true,
      {},
      { description: "Whether attendees other than the organizer can see who the event's attendees are" },
    ),
    makeText(`${prefix}Id`, 'id', 'ID', '', {}, { description: 'Opaque identifier of the event' }),
    makeText(`${prefix}Location`, 'location', 'Location', '', {}, {
      description: 'Geographic location of the event as free-form text',
    }),
    makeNumber(`${prefix}MaxAttendees`, 'maxAttendees', 'Max Attendees', 0, {}, {
      description:
        'The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned.',
    }),
    makeSelect(`${prefix}RepeatFrequency`, 'repeatFrecuency', 'Repeat Frequency', '', repeatFrequencyOptions),
    makeNumber(`${prefix}RepeatHowManyTimes`, 'repeatHowManyTimes', 'Repeat How Many Times?', 1, {}, { min: 1 }),
    makeDateTime(`${prefix}RepeatUntil`, 'repeatUntil', 'Repeat Until', '', {}),
    makeText(`${prefix}Rrule`, 'rrule', 'RRULE', '', {}, {
      description:
        'Recurrence rule. When set, the parameters Repeat Frequency, Repeat How Many Times and Repeat Until are ignored.',
    }),
    makeSelect(`${prefix}SendUpdates`, 'sendUpdates', 'Send Updates', '', sendUpdatesOptions, {}, {
      description: 'Whether to send notifications about the creation of the new event',
    }),
    makeSelect(`${prefix}ShowMeAs`, 'showMeAs', 'Show Me As', 'opaque', showMeAsOptions, {}, {
      description: 'Whether the event blocks time on the calendar',
    }),
  );

  if (updateAttendees) {
    fields.push(makeDateTime(`${prefix}Start`, 'start', 'Start', '', {}, { description: 'Start time of the event' }));
  }

  fields.push(
    makeText(`${prefix}Summary`, 'summary', 'Summary', '', {}, { description: 'Title of the event' }),
    makeSelect(`${prefix}Visibility`, 'visibility', 'Visibility', 'default', visibilityOptions, {}, {
      description: 'Visibility of the event',
    }),
  );

  if (updateAttendees) {
    fields.splice(4, 0, makeDateTime(`${prefix}End`, 'end', 'End', '', {}, { description: 'End time of the event' }));
  }

  return fields;
};

const makeReminders = (prefix, operation, reminderControlKey) => ({
  key: `${prefix}RemindersUi`,
  n8nKey: 'remindersUi',
  label: 'Reminders',
  kind: 'fixedCollection',
  sourceKind: 'fixedCollection',
  value: {},
  sourceDefault: {},
  collectionKey: 'remindersValues',
  collectionLabel: 'Reminder',
  multiple: true,
  addLabel: 'Add Reminder',
  fields: [
    makeSelect(`${prefix}ReminderMethod`, 'method', 'Method', '', [
      { label: 'Email', value: 'email' },
      { label: 'Popup', value: 'popup' },
    ]),
    makeNumber(`${prefix}ReminderMinutes`, 'minutes', 'Minutes Before', 0, {}, { min: 0, max: 40320 }),
  ],
  description:
    "If the event doesn't use the default reminders, this lists the reminders specific to the event",
  ...operationWhen('event', operation, { [reminderControlKey]: [false] }, { useDefaultReminders: [false] }),
});

const googleCalendarScopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

const credentialRequirements = [
  {
    type: 'googleCalendarOAuth2Api',
    name: 'Google Calendar OAuth2 API',
    required: true,
    inert: true,
    documentationUrl: 'google/oauth-single-service',
    extends: ['googleOAuth2Api', 'oAuth2Api'],
    sourcePath: 'packages/nodes-base/credentials/GoogleCalendarOAuth2Api.credentials.ts',
    inheritedSourcePaths: [
      'packages/nodes-base/credentials/GoogleOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/OAuth2Api.credentials.ts',
    ],
    fields: [
      {
        key: 'calendarOauthGrantType',
        n8nKey: 'grantType',
        label: 'Grant Type',
        kind: 'hidden',
        value: 'authorizationCode',
        inheritedFrom: 'googleOAuth2Api',
      },
      {
        key: 'calendarOauthAuthUrl',
        n8nKey: 'authUrl',
        label: 'Authorization URL',
        kind: 'hidden',
        value: 'https://accounts.google.com/o/oauth2/v2/auth',
        inheritedFrom: 'googleOAuth2Api',
      },
      {
        key: 'calendarOauthAccessTokenUrl',
        n8nKey: 'accessTokenUrl',
        label: 'Access Token URL',
        kind: 'hidden',
        value: 'https://oauth2.googleapis.com/token',
        inheritedFrom: 'googleOAuth2Api',
      },
      {
        key: 'calendarOauthQueryParameters',
        n8nKey: 'authQueryParameters',
        label: 'Auth URI Query Parameters',
        kind: 'hidden',
        value: 'access_type=offline&prompt=consent',
        inheritedFrom: 'googleOAuth2Api',
      },
      {
        key: 'calendarOauthAuthentication',
        n8nKey: 'authentication',
        label: 'Authentication',
        kind: 'hidden',
        value: 'body',
        inheritedFrom: 'googleOAuth2Api',
      },
      {
        key: 'calendarOauthCustomScopes',
        n8nKey: 'customScopes',
        label: 'Custom Scopes',
        kind: 'boolean',
        value: false,
        description: 'Define custom scopes',
      },
      {
        key: 'calendarOauthCustomScopesNotice',
        n8nKey: 'customScopesNotice',
        label:
          'The default scopes needed for the node to work are already set, If you change these the node may not function correctly.',
        kind: 'notice',
        value: '',
        showWhen: { calendarOauthCustomScopes: [true] },
        n8nShowWhen: { customScopes: [true] },
      },
      {
        key: 'calendarOauthEnabledScopes',
        n8nKey: 'enabledScopes',
        label: 'Enabled Scopes',
        kind: 'text',
        value: googleCalendarScopes,
        showWhen: { calendarOauthCustomScopes: [true] },
        n8nShowWhen: { customScopes: [true] },
        description: 'Scopes that should be enabled',
      },
      {
        key: 'calendarOauthScope',
        n8nKey: 'scope',
        label: 'Scope',
        kind: 'hidden',
        value:
          '={{$self["customScopes"] ? $self["enabledScopes"] : "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"}}',
      },
    ],
  },
];

const googleCalendar = {
  type: 'google-calendar',
  n8nType: 'n8n-nodes-base.googleCalendar',
  n8nVersion: 1.3,
  defaultVersion: 1.3,
  versionHistory: [1, 1.1, 1.2, 1.3],
  label: 'Google Calendar',
  defaultName: 'Google Calendar',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Consume Google Calendar API',
  details: 'Check calendar availability and create, retrieve, update, or delete Google Calendar events.',
  category: 'action',
  categories: ['Productivity'],
  group: ['input'],
  defaults: { name: 'Google Calendar' },
  inputs: ['main'],
  outputs: ['main'],
  portVariants: [{ inputs: ['main'], outputs: ['main'] }],
  usableAsTool: true,
  toolConnector: 'ai_tool',
  aiConnectorPorts: [],
  builderHint: {
    relatedNodes: [
      { nodeType: 'n8n-nodes-base.googleCalendarTool', relationHint: 'Tool version for AI Agent use' },
    ],
  },
  toolMetadata: { supportsAiParameters: true, staticConnectorPort: false },
  schemaPath: 'Google/Calendar',
  icon: '/node-icons/google-calendar.svg',
  n8nIcon: 'file:googleCalendar.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { viewBox: '0 0 81 82' },
  iconAssetSha256: '871b9e73d0f50aed28063f13ed808dedb048ace1affb3d52b42bd4556edd28a6',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlecalendar/',
  docsMarkdown: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlecalendar.md',
  operationDocs: {
    calendar:
      'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlecalendar/calendar-operations/',
    event:
      'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlecalendar/event-operations/',
  },
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/google/',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Google/Calendar/GoogleCalendar.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Google/Calendar/GoogleCalendar.node.json',
    descriptionPaths: [
      'packages/nodes-base/nodes/Google/Calendar/CalendarDescription.ts',
      'packages/nodes-base/nodes/Google/Calendar/EventDescription.ts',
    ],
    helperPath: 'packages/nodes-base/nodes/Google/Calendar/GenericFunctions.ts',
    interfacePath: 'packages/nodes-base/nodes/Google/Calendar/EventInterface.ts',
    credentialPaths: credentialRequirements[0].inheritedSourcePaths.concat(
      credentialRequirements[0].sourcePath,
    ),
    iconPath: 'packages/nodes-base/nodes/Google/Calendar/googleCalendar.svg',
  },
  credentialRequirements,
  params: [
    {
      key: 'googleCalendarCredential',
      n8nKey: 'credentials.googleCalendarOAuth2Api',
      label: 'Credential to connect with',
      kind: 'select',
      sourceKind: 'credentials',
      value: 'googleCalendarOAuth2Api',
      sourceDefault: '',
      required: true,
      locked: true,
      dynamic: true,
      options: [{ label: 'Google Calendar OAuth2 API', value: 'googleCalendarOAuth2Api' }],
      simulationNote: lockedCredentialNote,
    },
    {
      key: 'resource',
      n8nKey: 'resource',
      label: 'Resource',
      kind: 'select',
      sourceKind: 'options',
      value: 'event',
      noDataExpression: true,
      options: [
        { label: 'Calendar', value: 'calendar' },
        { label: 'Event', value: 'event' },
      ],
    },
    {
      key: 'calendarOperation',
      n8nKey: 'operation',
      label: 'Operation',
      kind: 'select',
      sourceKind: 'options',
      value: 'availability',
      noDataExpression: true,
      options: calendarOperations,
      showWhen: { resource: ['calendar'] },
      n8nShowWhen: { resource: ['calendar'] },
    },
    {
      key: 'eventOperation',
      n8nKey: 'operation',
      label: 'Operation',
      kind: 'select',
      sourceKind: 'options',
      value: 'create',
      noDataExpression: true,
      options: eventOperations,
      showWhen: { resource: ['event'] },
      n8nShowWhen: { resource: ['event'] },
    },

    makeCalendarLocator('calendarAvailabilityCalendar', operationWhen('calendar', 'availability')),
    makeDateTime(
      'calendarAvailabilityStart',
      'timeMin',
      'Start Time',
      '={{ $now }}',
      operationWhen('calendar', 'availability'),
      {
        required: true,
        description:
          'Start of the interval, use an expression to set a date, or switch to fixed mode to choose date from widget',
        sourceVersionCondition: '@version >= 1.3',
      },
    ),
    makeDateTime(
      'calendarAvailabilityEnd',
      'timeMax',
      'End Time',
      "={{ $now.plus(1, 'hour') }}",
      operationWhen('calendar', 'availability'),
      {
        required: true,
        description:
          'End of the interval, use an expression to set a date, or switch to fixed mode to choose date from widget',
        sourceVersionCondition: '@version >= 1.3',
      },
    ),
    makeCollection(
      'calendarAvailabilityOptions',
      'options',
      'Options',
      operationWhen('calendar', 'availability'),
      [
        makeSelect('calendarAvailabilityOutputFormat', 'outputFormat', 'Output Format', 'availability', [
          {
            label: 'Availability',
            value: 'availability',
            description: 'Returns if there are any events in the given time or not',
          },
          { label: 'Booked Slots', value: 'bookedSlots', description: 'Returns the booked slots' },
          { label: 'RAW', value: 'raw', description: 'Returns the RAW data from the API' },
        ], {}, { description: 'The format to return the data in' }),
        makeTimezoneLocator('calendarAvailabilityTimezone', 'timezone', {
          description: 'Time zone used in the response. By default n8n timezone is used.',
        }),
      ],
    ),

    makeCalendarLocator('eventCalendar', { showWhen: { resource: ['event'] }, n8nShowWhen: { resource: ['event'] } }),

    makeDateTime('eventCreateStart', 'start', 'Start', '={{ $now }}', operationWhen('event', 'create'), {
      required: true,
      description:
        'Start time of the event, use an expression to set a date, or switch to fixed mode to choose date from widget',
      sourceVersionCondition: '@version >= 1.3',
    }),
    makeDateTime(
      'eventCreateEnd',
      'end',
      'End',
      "={{ $now.plus(1, 'hour') }}",
      operationWhen('event', 'create'),
      {
        required: true,
        description:
          'End time of the event, use an expression to set a date, or switch to fixed mode to choose date from widget',
        sourceVersionCondition: '@version >= 1.3',
      },
    ),
    makeBoolean(
      'eventCreateUseDefaultReminders',
      'useDefaultReminders',
      'Use Default Reminders',
      true,
      operationWhen('event', 'create'),
    ),
    makeCollection(
      'eventCreateAdditionalFields',
      'additionalFields',
      'Additional Fields',
      operationWhen('event', 'create'),
      makeEventMutationFields('eventCreate', { includeConference: true }),
      'Add Field',
    ),
    makeReminders('eventCreate', 'create', 'eventCreateUseDefaultReminders'),

    makeText('eventDeleteEventId', 'eventId', 'Event ID', '', operationWhen('event', 'delete'), {
      required: true,
    }),
    makeCollection('eventDeleteOptions', 'options', 'Options', operationWhen('event', 'delete'), [
      makeSelect('eventDeleteSendUpdates', 'sendUpdates', 'Send Updates', '', sendUpdatesOptions, {}, {
        description: 'Whether to send notifications about the creation of the new event',
      }),
    ]),

    makeText('eventGetEventId', 'eventId', 'Event ID', '', operationWhen('event', 'get'), { required: true }),
    makeCollection('eventGetOptions', 'options', 'Options', operationWhen('event', 'get'), [
      makeNumber('eventGetMaxAttendees', 'maxAttendees', 'Max Attendees', 0, {}, {
        description:
          'The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned.',
      }),
      makeBoolean(
        'eventGetReturnNextInstance',
        'returnNextInstance',
        'Return Next Instance of Recurring Event',
        false,
        {},
        {
          description: 'Whether to return the next instance of a recurring event instead of the event itself',
          sourceVersionCondition: '@version >= 1.3',
        },
      ),
      makeTimezoneLocator('eventGetTimezone', 'timeZone'),
    ]),

    makeBoolean('eventGetAllReturnAll', 'returnAll', 'Return All', false, operationWhen('event', 'getAll'), {
      description: 'Whether to return all results or only up to a given limit',
    }),
    makeNumber(
      'eventGetAllLimit',
      'limit',
      'Limit',
      50,
      operationWhen('event', 'getAll', { eventGetAllReturnAll: [false] }, { returnAll: [false] }),
      { min: 1, max: 500, description: 'Max number of results to return' },
    ),
    makeDateTime('eventGetAllAfter', 'timeMin', 'After', '={{ $now }}', operationWhen('event', 'getAll'), {
      description:
        'At least some part of the event must be after this time, use an expression to set a date, or switch to fixed mode to choose date from widget',
      sourceVersionCondition: '@version >= 1.3',
    }),
    makeDateTime(
      'eventGetAllBefore',
      'timeMax',
      'Before',
      '={{ $now.plus({ week: 1 }) }}',
      operationWhen('event', 'getAll'),
      {
        description:
          'At least some part of the event must be before this time, use an expression to set a date, or switch to fixed mode to choose date from widget',
        sourceVersionCondition: '@version >= 1.3',
      },
    ),
    makeCollection('eventGetAllOptions', 'options', 'Options', operationWhen('event', 'getAll'), [
      makeText('eventGetAllFields', 'fields', 'Fields', '', {}, {
        placeholder: 'e.g. items(ID,status,summary)',
        description:
          "Specify fields to return; Google returns a predefined common set by default. Use '*' to return all fields.",
      }),
      makeText('eventGetAllICalUid', 'iCalUID', 'iCalUID', '', {}, {
        description: 'Specifies event ID in the iCalendar format to be included in the response',
      }),
      makeNumber('eventGetAllMaxAttendees', 'maxAttendees', 'Max Attendees', 0, {}, {
        description:
          'The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned.',
      }),
      makeSelect('eventGetAllOrderBy', 'orderBy', 'Order By', '', [
        {
          label: 'Start Time',
          value: 'startTime',
          description:
            'Order by the start date/time (ascending). This is only available when querying single events.',
        },
        { label: 'Updated', value: 'updated', description: 'Order by last modification time (ascending)' },
      ], {}, { description: 'The order of the events returned in the result' }),
      makeText('eventGetAllQuery', 'query', 'Query', '', {}, {
        description:
          'Free text search terms to find events that match these terms in any field, except for extended properties',
      }),
      makeSelect('eventGetAllRecurringEventHandling', 'recurringEventHandling', 'Recurring Event Handling', 'expand', [
        {
          label: 'All Occurrences',
          value: 'expand',
          description: 'Return all instances of recurring event for specified time range',
        },
        { label: 'First Occurrence', value: 'first', description: 'Return event with specified recurrence rule' },
        { label: 'Next Occurrence', value: 'next', description: 'Return next instance of recurring event' },
      ], {}, { sourceVersionCondition: '@version >= 1.3' }),
      makeBoolean('eventGetAllShowDeleted', 'showDeleted', 'Show Deleted', false, {}, {
        description: 'Whether to include deleted events (with status equals "cancelled") in the result',
      }),
      makeBoolean('eventGetAllShowHiddenInvitations', 'showHiddenInvitations', 'Show Hidden Invitations', false, {}, {
        description: 'Whether to include hidden invitations in the result',
      }),
      makeTimezoneLocator('eventGetAllTimezone', 'timeZone'),
      makeDateTime('eventGetAllUpdatedMin', 'updatedMin', 'Updated Min', '', {}, {
        description:
          "Lower bound for an event's last modification time (as a RFC3339 timestamp) to filter by. Deleted entries since this time are always included regardless of Show Deleted.",
      }),
    ]),

    makeText('eventUpdateEventId', 'eventId', 'Event ID', '', operationWhen('event', 'update'), {
      required: true,
    }),
    makeSelect(
      'eventUpdateModifyTarget',
      'modifyTarget',
      'Modify',
      'instance',
      [
        { label: 'Recurring Event Instance', value: 'instance' },
        { label: 'Recurring Event', value: 'event' },
      ],
      operationWhen(
        'event',
        'update',
        { eventUpdateEventId: { includes: '_' } },
        { '@tool': [false], '@version': [{ _cnd: { gte: 1.3 } }], eventId: [{ _cnd: { includes: '_' } }] },
      ),
      { sourceVersionCondition: '@version >= 1.3; @tool = false; eventId includes _' },
    ),
    makeBoolean(
      'eventUpdateUseDefaultReminders',
      'useDefaultReminders',
      'Use Default Reminders',
      true,
      operationWhen('event', 'update'),
    ),
    makeCollection(
      'eventUpdateFields',
      'updateFields',
      'Update Fields',
      operationWhen('event', 'update'),
      makeEventMutationFields('eventUpdate', { updateAttendees: true }),
      'Add Field',
    ),
    makeReminders('eventUpdate', 'update', 'eventUpdateUseDefaultReminders'),

    {
      key: 'useN8nTimeZone',
      n8nKey: 'useN8nTimeZone',
      label:
        'This node will use the time zone set in n8n’s settings, but you can override this in the workflow settings',
      kind: 'notice',
      value: '',
    },
  ],
  resources: [
    { value: 'calendar', defaultOperation: 'availability', operations: ['availability'] },
    { value: 'event', defaultOperation: 'create', operations: ['create', 'delete', 'get', 'getAll', 'update'] },
  ],
  resourceOperationParity: {
    calendar: { expected: ['availability'], represented: ['availability'], default: 'availability' },
    event: {
      expected: ['create', 'delete', 'get', 'getAll', 'update'],
      represented: ['create', 'delete', 'get', 'getAll', 'update'],
      default: 'create',
    },
  },
  operationCount: 6,
  lookupMetadata: {
    getCalendars: {
      source: 'Google Calendar calendarList API',
      endpoint: '/calendar/v3/users/me/calendarList',
      parameters: ['calendar'],
      searchable: true,
      networkAccess: false,
    },
    getTimezones: {
      source: 'moment.tz.names()',
      parameters: ['timezone', 'timeZone'],
      searchable: true,
      staticLocal: true,
      executed: false,
      networkAccess: false,
    },
    getColors: {
      source: 'Google Calendar colors API',
      endpoint: '/calendar/v3/colors',
      parameter: 'color',
      networkAccess: false,
    },
    getConferenceSolutions: {
      source: 'selected calendar conferenceProperties.allowedConferenceSolutionTypes',
      endpoint: '/calendar/v3/users/me/calendarList/{calendar}',
      parameter: 'conferenceSolution',
      dependsOn: ['calendar'],
      networkAccess: false,
    },
  },
  docsSummary: {
    operations: {
      calendar: ['availability'],
      event: ['create', 'delete', 'get', 'getAll', 'update'],
    },
    aiToolDocumented: true,
    relatedTrigger: 'n8n-nodes-base.googleCalendarTrigger',
    authenticationMethods: ['googleCalendarOAuth2Api'],
  },
  currentVersionScope: {
    represented: 1.3,
    excludedHistoricalVariants: [
      { versions: '< 1.3', n8nKeys: ['calendar.timeMin', 'calendar.timeMax'], difference: 'Empty date defaults' },
      { versions: '< 1.3', n8nKeys: ['event.create.start', 'event.create.end'], difference: 'Empty date defaults' },
      {
        versions: '< 1.3',
        n8nKeys: ['event.getAll.options.timeMin', 'event.getAll.options.timeMax', 'event.getAll.options.singleEvents'],
        difference: 'Legacy nested time range and Expand Events controls',
      },
      {
        versions: '1 and 1.1',
        n8nKeys: ['event.update.updateFields.attendees'],
        difference: 'Legacy attendees string replaced by attendeesUi in 1.2+',
      },
    ],
  },
  platformGaps: [
    'The native node reuses operation, calendar, eventId, timeMin, timeMax, options, useDefaultReminders, remindersUi, and mutation-field names across conditional branches. Unique UI keys preserve stable branches while n8nKey records the native name.',
    'Calendar, color, and conference-solution lists normally call Google Calendar. Their locked lists remain empty; calendar and timezone resource locators retain authorable By ID modes.',
    'The timezone list is generated locally from moment.tz.names() in n8n. Its provenance and validation source are retained without importing or executing moment-timezone in the catalog.',
    'dateTime fields are normalized to inert text controls. Source defaults, including $now expressions, remain literal authoring strings and are never evaluated, parsed, timezone-adjusted, or scheduled.',
    'Native multipleValues attendee strings remain comma-separated text controls. Their add-attendee metadata is retained without synthesizing dynamic controls.',
    'The update attendeesUi source default contains an empty attendee array inside a single fixedCollection row. That exact source shape is preserved even though edits normalize the row value to text.',
    'Credential fields are metadata-only and the node panel exposes a locked selector. OAuth installation, consent, scope changes, token refresh, and credential access never run.',
    'usableAsTool and the related Google Calendar Tool hint are preserved, but tool conversion is capability metadata rather than a static ai_tool connector port or executable tool runtime.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'credentials.googleCalendarOAuth2Api',
      sourceType: 'credentials',
      normalizedKind: 'locked select',
      reason: 'Credential discovery and editors are unavailable.',
    },
    {
      n8nKey: 'calendar/timezone/timeZone',
      sourceType: 'resourceLocator with listSearch',
      normalizedKind: 'resourceLocator with locked list and authorable ID mode',
      reason: 'The catalog does not execute list searches.',
    },
    {
      n8nKey: 'color/conferenceSolution',
      sourceType: 'options with loadOptionsMethod',
      normalizedKind: 'locked select',
      reason: 'The catalog does not call Google Calendar load-options endpoints.',
    },
    {
      n8nKey: 'timeMin/timeMax/start/end/repeatUntil/updatedMin',
      sourceType: 'dateTime',
      normalizedKind: 'text',
      reason: 'Dates and expressions remain inert authoring text.',
    },
    {
      n8nKey: 'attendees',
      sourceType: 'string with multipleValues',
      normalizedKind: 'text',
      reason: 'Comma-separated attendee authoring remains usable without a dedicated multiple-text renderer.',
    },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    oauthInstallation: false,
    oauthConsent: false,
    oauthRefresh: false,
    authentication: false,
    calendarLookup: false,
    timezoneLookup: false,
    colorLookup: false,
    conferenceSolutionLookup: false,
    apiRequests: false,
    networkAccess: false,
    expressionExecution: false,
    dateParsing: false,
    timezoneConversion: false,
    availabilityChecks: false,
    eventCreation: false,
    eventRetrieval: false,
    eventUpdates: false,
    eventDeletion: false,
    recurrenceExpansion: false,
    recurrenceModification: false,
    reminderChanges: false,
    attendeeInvitations: false,
    notifications: false,
    conferenceCreation: false,
    toolExecution: false,
    voice: false,
  },
  output: {},
};

export default googleCalendar;
