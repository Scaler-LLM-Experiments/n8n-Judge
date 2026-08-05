// Editor-only descriptor for n8n's Discord v2 action node.
// Credentials, Discord lookups, API requests, files, webhooks, and waiting stay inert.

const DEFAULT_CUSTOM_HTML = `<!-- Your custom HTML here --->


`;

const DEFAULT_FORM_JSON = `[
  {
    "fieldLabel": "Name",
    "placeholder": "enter your name",
    "requiredField": true
  },
  {
    "fieldLabel": "Age",
    "fieldType": "number",
    "placeholder": "enter your age"
  },
  {
    "fieldLabel": "Email",
    "fieldType": "email",
    "requiredField": true
  },
  {
    "fieldLabel": "Textarea",
    "fieldType": "textarea"
  },
  {
    "fieldLabel": "Dropdown Options",
    "fieldType": "dropdown",
    "fieldOptions": {
      "values": [
        {
          "option": "option 1"
        },
        {
          "option": "option 2"
        }
      ]
    },
    "requiredField": true
  },
  {
    "fieldLabel": "Checkboxes",
    "fieldType": "checkbox",
    "fieldOptions": {
      "values": [
        {
          "option": "option 1"
        },
        {
          "option": "option 2"
        }
      ]
    }
  },
  {
    "fieldLabel": "Radio",
    "fieldType": "radio",
    "fieldOptions": {
      "values": [
        {
          "option": "option 1"
        },
        {
          "option": "option 2"
        }
      ]
    }
  },
  {
    "fieldLabel": "Email",
    "fieldType": "email",
    "placeholder": "me@mail.con"
  },
  {
    "fieldLabel": "File",
    "fieldType": "file",
    "multipleFiles": true,
    "acceptFileTypes": ".jpg, .png"
  },
  {
    "fieldLabel": "Number",
    "fieldType": "number"
  },
  {
    "fieldLabel": "Password",
    "fieldType": "password"
  }
]
`;

const DEFAULT_FORM_CSS = `:root {
	--font-family: 'Open Sans', sans-serif;
	--font-weight-normal: 400;
	--font-weight-bold: 600;
	--font-size-body: 12px;
	--font-size-label: 14px;
	--font-size-test-notice: 12px;
	--font-size-input: 14px;
	--font-size-header: 20px;
	--font-size-paragraph: 14px;
	--font-size-link: 12px;
	--font-size-error: 12px;
	--font-size-html-h1: 28px;
	--font-size-html-h2: 20px;
	--font-size-html-h3: 16px;
	--font-size-html-h4: 14px;
	--font-size-html-h5: 12px;
	--font-size-html-h6: 10px;
	--font-size-subheader: 14px;

	/* Colors */
	--color-background: #fbfcfe;
	--color-test-notice-text: #e6a23d;
	--color-test-notice-bg: #fefaf6;
	--color-test-notice-border: #f6dcb7;
	--color-card-bg: #ffffff;
	--color-card-border: #dbdfe7;
	--color-card-shadow: rgba(99, 77, 255, 0.06);
	--color-link: #7e8186;
	--color-header: #525356;
	--color-label: #555555;
	--color-input-border: #dbdfe7;
	--color-input-text: #71747A;
	--color-focus-border: rgb(90, 76, 194);
	--color-submit-btn-bg: #ff6d5a;
	--color-submit-btn-text: #ffffff;
	--color-error: #ea1f30;
	--color-required: #ff6d5a;
	--color-clear-button-bg: #7e8186;
	--color-html-text: #555;
	--color-html-link: #ff6d5a;
	--color-header-subtext: #7e8186;

	/* Border Radii */
	--border-radius-card: 8px;
	--border-radius-input: 6px;
	--border-radius-clear-btn: 50%;
	--card-border-radius: 8px;

	/* Spacing */
	--padding-container-top: 24px;
	--padding-card: 24px;
	--padding-test-notice-vertical: 12px;
	--padding-test-notice-horizontal: 24px;
	--margin-bottom-card: 16px;
	--padding-form-input: 12px;
	--card-padding: 24px;
	--card-margin-bottom: 16px;

	/* Dimensions */
	--container-width: 448px;
	--submit-btn-height: 48px;
	--checkbox-size: 18px;

	/* Others */
	--box-shadow-card: 0px 4px 16px 0px var(--color-card-shadow);
	--opacity-placeholder: 0.5;
}`;

const activeAuthentications = ['botToken', 'oAuth2'];

const authenticationOptions = [
  {
    label: 'Bot Token',
    value: 'botToken',
    description: 'Manage messages, channels, and members on a server',
  },
  {
    label: 'OAuth2',
    value: 'oAuth2',
    description: "Same features as 'Bot Token' with easier Bot installation",
  },
  {
    label: 'Webhook',
    value: 'webhook',
    description: 'Send messages to a specific channel',
  },
];

const resourceOptions = [
  { label: 'Channel', value: 'channel' },
  { label: 'Message', value: 'message' },
  { label: 'Member', value: 'member' },
];

const channelOperations = [
  { label: 'Create', value: 'create', description: 'Create a new channel', action: 'Create a channel' },
  { label: 'Delete', value: 'deleteChannel', description: 'Delete a channel', action: 'Delete a channel' },
  { label: 'Get', value: 'get', description: 'Get a channel', action: 'Get a channel' },
  { label: 'Get Many', value: 'getAll', description: 'Retrieve the channels of a server', action: 'Get many channels' },
  { label: 'Update', value: 'update', description: 'Update a channel', action: 'Update a channel' },
];

const messageOperations = [
  { label: 'Delete', value: 'deleteMessage', description: 'Delete a message in a channel', action: 'Delete a message' },
  { label: 'Get', value: 'get', description: 'Get a message in a channel', action: 'Get a message' },
  { label: 'Get Many', value: 'getAll', description: 'Retrieve the latest messages in a channel', action: 'Get many messages' },
  { label: 'React with Emoji', value: 'react', description: 'React to a message with an emoji', action: 'React with an emoji to a message' },
  { label: 'Send', value: 'send', description: 'Send a message to a channel, thread, or member', action: 'Send a message' },
  { label: 'Send and Wait for Response', value: 'sendAndWait', description: 'Send a message and wait for response', action: 'Send message and wait for response' },
];

const memberOperations = [
  { label: 'Get Many', value: 'getAll', description: 'Retrieve the members of a server', action: 'Get many members' },
  { label: 'Role Add', value: 'roleAdd', description: 'Add a role to a member', action: 'Add a role to a member' },
  { label: 'Role Remove', value: 'roleRemove', description: 'Remove a role from a member', action: 'Remove a role from a member' },
];

const webhookOperations = [
  { label: 'Send a Message', value: 'sendLegacy', description: 'Send a message to a channel using the webhook', action: 'Send a message' },
];

const responseTypeOptions = [
  { label: 'Approval', value: 'approval', description: 'User can approve/disapprove from within the message' },
  { label: 'Free Text', value: 'freeText', description: 'User can submit a response via a form' },
  { label: 'Custom Form', value: 'customForm', description: 'User can submit a response via a custom form' },
];

const formElementTypes = [
  { label: 'Checkboxes', value: 'checkbox' },
  { label: 'Custom HTML', value: 'html' },
  { label: 'Date', value: 'date' },
  { label: 'Dropdown', value: 'dropdown' },
  { label: 'Email', value: 'email' },
  { label: 'File', value: 'file' },
  { label: 'Hidden Field', value: 'hiddenField' },
  { label: 'Number', value: 'number' },
  { label: 'Password', value: 'password' },
  { label: 'Radio Buttons', value: 'radio' },
  { label: 'Text Input', value: 'text' },
  { label: 'Textarea', value: 'textarea' },
];

const formTypesWithLabels = ['checkbox', 'date', 'dropdown', 'email', 'file', 'number', 'password', 'radio', 'text', 'textarea'];
const formTypesWithPlaceholders = ['email', 'number', 'password', 'text', 'textarea'];

const lookupNote =
  'The live Discord lookup is disabled. List mode remains empty; URL and ID modes remain inert authoring values.';

const lockedCredentialNote =
  'This credential selector is locked. The simulation never creates, reads, tests, refreshes, or applies Discord credentials.';

const makeGuildLocator = (key, showWhen) => ({
  key,
  n8nKey: 'guildId',
  label: 'Server',
  kind: 'resourceLocator',
  sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' },
  sourceDefault: { mode: 'list', value: '' },
  required: true,
  showWhen,
  description: 'Select the server (guild) that your bot is connected to',
  modes: ['list', 'url', 'id'],
  modeOptions: [
    { label: 'By Name', value: 'list', kind: 'list', placeholder: 'e.g. my-server', searchListMethod: 'guildSearch' },
    {
      label: 'By URL',
      value: 'url',
      kind: 'text',
      placeholder: 'e.g. https://discord.com/channels/[guild-id]',
      validation: { regex: 'https:\\/\\/discord.com\\/channels\\/([0-9]+)', errorMessage: 'Not a valid Discord Server URL' },
      extractValue: { type: 'regex', regex: 'https:\\/\\/discord.com\\/channels\\/([0-9]+)' },
    },
    { label: 'By ID', value: 'id', kind: 'text', placeholder: 'e.g. 896347036838936576', validation: { regex: '[0-9]+', errorMessage: 'Not a valid Discord Server ID' } },
  ],
  options: [],
  locked: true,
  dynamicOptions: { source: 'guildSearch', inert: true },
  simulationNote: lookupNote,
});

const makeChannelLocator = (key, showWhen, { textOnly = false } = {}) => ({
  key,
  n8nKey: 'channelId',
  label: 'Channel',
  kind: 'resourceLocator',
  sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' },
  sourceDefault: { mode: 'list', value: '' },
  required: true,
  showWhen,
  description: 'Select the channel by name, URL, or ID',
  modes: ['list', 'url', 'id'],
  modeOptions: [
    { label: 'By Name', value: 'list', kind: 'list', placeholder: 'e.g. my-channel', searchListMethod: textOnly ? 'textChannelSearch' : 'channelSearch' },
    {
      label: 'By URL',
      value: 'url',
      kind: 'text',
      placeholder: 'e.g. https://discord.com/channels/[guild-id]/[channel-id]',
      validation: { regex: 'https:\\/\\/discord.com\\/channels\\/[0-9]+\\/([0-9]+)', errorMessage: 'Not a valid Discord Channel URL' },
      extractValue: { type: 'regex', regex: 'https:\\/\\/discord.com\\/channels\\/[0-9]+\\/([0-9]+)' },
    },
    { label: 'By ID', value: 'id', kind: 'text', placeholder: 'e.g. 896347036838936576', validation: { regex: '[0-9]+', errorMessage: 'Not a valid Discord Channel ID' } },
  ],
  options: [],
  locked: true,
  dynamicOptions: { source: textOnly ? 'textChannelSearch' : 'channelSearch', dependsOn: ['guildId.value'], inert: true },
  simulationNote: lookupNote,
});

const makeCategoryLocator = (key, showWhen) => ({
  key,
  n8nKey: 'categoryId',
  label: 'Parent Category',
  kind: 'resourceLocator',
  sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' },
  sourceDefault: { mode: 'list', value: '' },
  required: false,
  showWhen,
  description: 'The parent category where you want the channel to appear',
  modes: ['list', 'url', 'id'],
  modeOptions: [
    { label: 'By Name', value: 'list', kind: 'list', placeholder: 'e.g. my-channel', searchListMethod: 'categorySearch' },
    { label: 'By URL', value: 'url', kind: 'text', placeholder: 'e.g. https://discord.com/channels/[guild-id]/[channel-id]', validation: { regex: 'https:\\/\\/discord.com\\/channels\\/[0-9]+\\/([0-9]+)', errorMessage: 'Not a valid Discord Category URL' }, extractValue: { type: 'regex', regex: 'https:\\/\\/discord.com\\/channels\\/[0-9]+\\/([0-9]+)' } },
    { label: 'By ID', value: 'id', kind: 'text', placeholder: 'e.g. 896347036838936576', validation: { regex: '[0-9]+', errorMessage: 'Not a valid Discord Category ID' } },
  ],
  options: [],
  locked: true,
  dynamicOptions: { source: 'categorySearch', dependsOn: ['guildId.value'], inert: true },
  simulationNote: lookupNote,
});

const makeUserLocator = (key, showWhen) => ({
  key,
  n8nKey: 'userId',
  label: 'User',
  kind: 'resourceLocator',
  sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' },
  sourceDefault: { mode: 'list', value: '' },
  required: false,
  showWhen,
  description: 'Select the user you want to assign a role to',
  modes: ['list', 'id'],
  modeOptions: [
    { label: 'By Name', value: 'list', kind: 'list', placeholder: 'e.g. DiscordUser', searchListMethod: 'userSearch', pagination: true },
    { label: 'By ID', value: 'id', kind: 'text', placeholder: 'e.g. 786953432728469534', validation: { regex: '[0-9]+', errorMessage: 'Not a valid User ID' } },
  ],
  options: [],
  locked: true,
  dynamicOptions: { source: 'userSearch', dependsOn: ['guildId.value'], paginated: true, inert: true },
  simulationNote: lookupNote,
});

const makeReturnAllFields = (prefix, showWhen) => [
  {
    key: `${prefix}ReturnAll`,
    n8nKey: 'returnAll',
    label: 'Return All',
    kind: 'boolean',
    value: false,
    required: false,
    showWhen,
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    key: `${prefix}Limit`,
    n8nKey: 'limit',
    label: 'Limit',
    kind: 'number',
    value: 100,
    required: false,
    min: 1,
    showWhen: { ...showWhen, [`${prefix}ReturnAll`]: [false] },
    n8nShowWhen: { returnAll: [false] },
    description: 'Max number of results to return',
  },
];

const makeMessageId = (key, showWhen) => ({
  key,
  n8nKey: 'messageId',
  label: 'Message ID',
  kind: 'text',
  value: '',
  required: true,
  placeholder: 'e.g. 1057576506244726804',
  showWhen,
  description: 'The ID of the message',
});

const embedFields = (prefix) => [
  { key: `${prefix}InputMethod`, n8nKey: 'inputMethod', label: 'Input Method', kind: 'select', value: 'fields', required: false, options: [{ label: 'Enter Fields', value: 'fields' }, { label: 'Raw JSON', value: 'json' }] },
  { key: `${prefix}Json`, n8nKey: 'json', label: 'Value', kind: 'textarea', sourceKind: 'json', value: '={}', required: false, rows: 2, showWhen: { [`${prefix}InputMethod`]: ['json'] }, n8nShowWhen: { inputMethod: ['json'] }, simulationNote: 'Raw embed JSON is stored as inert text and is never parsed.' },
  { key: `${prefix}Description`, n8nKey: 'description', label: 'Description', kind: 'textarea', value: '', required: false, rows: 2, placeholder: 'e.g. My description', showWhen: { [`${prefix}InputMethod`]: ['fields'] }, description: 'The description of embed' },
  { key: `${prefix}Author`, n8nKey: 'author', label: 'Author', kind: 'text', value: '', required: false, placeholder: 'e.g. John Doe', showWhen: { [`${prefix}InputMethod`]: ['fields'] }, description: 'The name of the author' },
  { key: `${prefix}Color`, n8nKey: 'color', label: 'Color', kind: 'color', value: '', required: false, placeholder: 'e.g. 12123432', showWhen: { [`${prefix}InputMethod`]: ['fields'] }, description: 'Color code of the embed' },
  { key: `${prefix}Timestamp`, n8nKey: 'timestamp', label: 'Timestamp', kind: 'text', sourceKind: 'dateTime', value: '', required: false, placeholder: 'e.g. 2023-02-08 09:30:26', showWhen: { [`${prefix}InputMethod`]: ['fields'] }, description: 'The time displayed at the bottom of the embed. Provide in ISO8601 format.' },
  { key: `${prefix}Title`, n8nKey: 'title', label: 'Title', kind: 'text', value: '', required: false, placeholder: "e.g. Embed's title", showWhen: { [`${prefix}InputMethod`]: ['fields'] }, description: 'The title of embed' },
  { key: `${prefix}Url`, n8nKey: 'url', label: 'URL', kind: 'text', value: '', required: false, placeholder: 'e.g. https://discord.com/', showWhen: { [`${prefix}InputMethod`]: ['fields'] }, description: 'The URL where you want to link the embed to' },
  { key: `${prefix}Image`, n8nKey: 'image', label: 'URL Image', kind: 'text', value: '', required: false, placeholder: 'e.g. https://example.com/image.png', showWhen: { [`${prefix}InputMethod`]: ['fields'] }, description: 'Source URL of image (only supports http(s) and attachments)' },
  { key: `${prefix}Thumbnail`, n8nKey: 'thumbnail', label: 'URL Thumbnail', kind: 'text', value: '', required: false, placeholder: 'e.g. https://example.com/image.png', showWhen: { [`${prefix}InputMethod`]: ['fields'] }, description: 'Source URL of thumbnail (only supports http(s) and attachments)' },
  { key: `${prefix}Video`, n8nKey: 'video', label: 'URL Video', kind: 'text', value: '', required: false, placeholder: 'e.g. https://example.com/video.mp4', showWhen: { [`${prefix}InputMethod`]: ['fields'] }, description: 'Source URL of video' },
];

const makeEmbeds = (key, showWhen) => ({
  key,
  n8nKey: 'embeds',
  label: 'Embeds',
  kind: 'fixedCollection',
  value: [],
  sourceDefault: [],
  required: false,
  collectionKey: 'values',
  collectionLabel: 'Values',
  multiple: true,
  addLabel: 'Add Embeds',
  showWhen,
  fields: embedFields(key),
});

const makeFiles = (key, showWhen) => ({
  key,
  n8nKey: 'files',
  label: 'Files',
  kind: 'fixedCollection',
  value: [],
  sourceDefault: [],
  required: false,
  collectionKey: 'values',
  collectionLabel: 'Values',
  multiple: true,
  addLabel: 'Add Files',
  showWhen,
  fields: [
    {
      key: `${key}InputFieldName`,
      n8nKey: 'inputFieldName',
      label: 'Input Data Field Name',
      kind: 'text',
      value: 'data',
      required: false,
      placeholder: 'e.g. data',
      description: 'The contents of the file being sent with the message',
      hint: 'The name of the input field containing the binary file data to be sent',
    },
  ],
  simulationNote: 'Binary field names are stored only. No input binary data is read or uploaded.',
});

const makeSendToFields = (prefix, showWhen) => [
  {
    key: `${prefix}SendTo`,
    n8nKey: 'sendTo',
    label: 'Send To',
    kind: 'select',
    value: 'channel',
    required: false,
    showWhen,
    options: [{ label: 'User', value: 'user' }, { label: 'Channel', value: 'channel' }],
    description: 'Send message to a channel or DM to a user',
  },
  makeUserLocator(`${prefix}User`, { ...showWhen, [`${prefix}SendTo`]: ['user'] }),
  makeChannelLocator(`${prefix}Channel`, { ...showWhen, [`${prefix}SendTo`]: ['channel'] }, { textOnly: true }),
];

const makeLimitWaitTime = (key) => ({
  key,
  n8nKey: 'limitWaitTime',
  label: 'Limit Wait Time',
  kind: 'fixedCollection',
  value: { values: { limitType: 'afterTimeInterval', resumeAmount: 45, resumeUnit: 'minutes' } },
  required: false,
  collectionKey: 'values',
  collectionLabel: 'Values',
  multiple: false,
  description: 'Whether to limit the time this node should wait for a user response before execution resumes',
  fields: [
    { key: `${key}LimitType`, n8nKey: 'limitType', label: 'Limit Type', kind: 'select', value: 'afterTimeInterval', required: false, description: 'Sets the condition for the execution to resume. Can be a specified date or after some time.', options: [{ label: 'After Time Interval', value: 'afterTimeInterval', description: 'Waits for a certain amount of time' }, { label: 'At Specified Time', value: 'atSpecifiedTime', description: 'Waits until the set date and time to continue' }] },
    { key: `${key}ResumeAmount`, n8nKey: 'resumeAmount', label: 'Amount', kind: 'number', value: 1, required: false, min: 0, precision: 2, showWhen: { [`${key}LimitType`]: ['afterTimeInterval'] }, n8nShowWhen: { limitType: ['afterTimeInterval'] }, description: 'The time to wait' },
    { key: `${key}ResumeUnit`, n8nKey: 'resumeUnit', label: 'Unit', kind: 'select', value: 'hours', required: false, showWhen: { [`${key}LimitType`]: ['afterTimeInterval'] }, n8nShowWhen: { limitType: ['afterTimeInterval'] }, options: [{ label: 'Minutes', value: 'minutes' }, { label: 'Hours', value: 'hours' }, { label: 'Days', value: 'days' }], description: 'Unit of the interval value' },
    { key: `${key}MaxDateAndTime`, n8nKey: 'maxDateAndTime', label: 'Max Date and Time', kind: 'text', sourceKind: 'dateTime', value: '', required: false, showWhen: { [`${key}LimitType`]: ['atSpecifiedTime'] }, n8nShowWhen: { limitType: ['atSpecifiedTime'] }, description: 'Continue execution after the specified date and time' },
  ],
  simulationNote: 'This collection records a limit only. It never schedules or resumes an execution.',
});

const makeAppendAttribution = (key) => ({
  key,
  n8nKey: 'appendAttribution',
  label: 'Append n8n Attribution',
  kind: 'boolean',
  value: true,
  required: false,
  description: 'Whether to include the phrase "This message was sent automatically with n8n" to the end of the message',
});

const waitCustomFormFields = [
  {
    key: 'waitCustomFieldLabel',
    n8nKey: 'fieldLabel',
    label: 'Field Name',
    kind: 'text',
    value: '',
    required: true,
    placeholder: 'e.g. What is your name?',
    showWhen: { waitCustomFieldType: formTypesWithLabels },
    n8nHideWhen: { fieldType: ['hiddenField', 'html'] },
    sourceVersionCondition: '@version < 2.4',
    description: 'Label that appears above the input field',
  },
  {
    key: 'waitCustomHiddenFieldName',
    n8nKey: 'fieldName',
    label: 'Field Name',
    kind: 'text',
    value: '',
    required: false,
    showWhen: { waitCustomFieldType: ['hiddenField'] },
    n8nShowWhen: { fieldType: ['hiddenField'] },
    sourceVersionCondition: '@version < 2.4',
    description: 'The name of the field, used in input attributes and referenced by the workflow',
  },
  {
    key: 'waitCustomFieldType',
    n8nKey: 'fieldType',
    label: 'Element Type',
    kind: 'select',
    value: 'text',
    required: true,
    description: 'The type of field to add to the form',
    options: formElementTypes,
    builderHint: {
      propertyHint:
        "Valid values: text, number, email, textarea, dropdown, date, file, html, hiddenField, radio, checkbox, password. There is NO 'time' type — use fieldType: 'text' with placeholder 'e.g. 2:30 PM' for time-of-day inputs.",
    },
  },
  {
    key: 'waitCustomElementName',
    n8nKey: 'elementName',
    label: 'Element Name',
    kind: 'text',
    value: '',
    required: false,
    placeholder: 'e.g. content-section',
    showWhen: { waitCustomFieldType: ['html'] },
    n8nShowWhen: { fieldType: ['html'] },
    description: 'Optional field. It can be used to include the html in the output.',
  },
  {
    key: 'waitCustomPlaceholder',
    n8nKey: 'placeholder',
    label: 'Placeholder',
    kind: 'text',
    value: '',
    required: false,
    showWhen: { waitCustomFieldType: formTypesWithPlaceholders },
    n8nHideWhen: { fieldType: ['dropdown', 'date', 'file', 'html', 'hiddenField', 'radio', 'checkbox'] },
    description: 'Sample text to display inside the field',
  },
  {
    key: 'waitCustomDefaultText',
    n8nKey: 'defaultValue',
    label: 'Default Value',
    kind: 'text',
    value: '',
    required: false,
    showWhen: { waitCustomFieldType: ['text', 'number', 'email', 'textarea'] },
    n8nShowWhen: { fieldType: ['text', 'number', 'email', 'textarea'] },
    description: 'Default value that will be pre-filled in the form field',
  },
  {
    key: 'waitCustomDefaultDate',
    n8nKey: 'defaultValue',
    label: 'Default Value',
    kind: 'text',
    sourceKind: 'dateTime',
    inputType: 'date',
    dateOnly: true,
    value: '',
    required: false,
    showWhen: { waitCustomFieldType: ['date'] },
    n8nShowWhen: { fieldType: ['date'] },
    description: 'Default date value that will be pre-filled in the form field (format: YYYY-MM-DD)',
  },
  {
    key: 'waitCustomDefaultChoice',
    n8nKey: 'defaultValue',
    label: 'Default Value',
    kind: 'text',
    value: '',
    required: false,
    showWhen: { waitCustomFieldType: ['dropdown', 'radio'] },
    n8nShowWhen: { fieldType: ['dropdown', 'radio'] },
    description: 'Default value that will be pre-selected. Must match one of the option labels.',
  },
  {
    key: 'waitCustomDefaultCheckboxes',
    n8nKey: 'defaultValue',
    label: 'Default Value',
    kind: 'text',
    value: '',
    required: false,
    showWhen: { waitCustomFieldType: ['checkbox'] },
    n8nShowWhen: { fieldType: ['checkbox'] },
    description: 'Default value(s) that will be pre-selected. Must match one or multiple of the option labels. Separate multiple pre-selected options with a comma.',
  },
  {
    key: 'waitCustomFieldValue',
    n8nKey: 'fieldValue',
    label: 'Field Value',
    kind: 'text',
    value: '',
    required: false,
    showWhen: { waitCustomFieldType: ['hiddenField'] },
    n8nShowWhen: { fieldType: ['hiddenField'] },
    description: 'Input value can be set here or will be passed as a query parameter via Field Name if no value is set',
  },
  {
    key: 'waitCustomDropdownOptions',
    n8nKey: 'fieldOptions',
    label: 'Field Options',
    kind: 'fixedCollection',
    value: { values: [{ option: '' }] },
    required: true,
    collectionKey: 'values',
    collectionLabel: 'Values',
    multiple: true,
    sortable: true,
    addLabel: 'Add Field Option',
    showWhen: { waitCustomFieldType: ['dropdown'] },
    n8nShowWhen: { fieldType: ['dropdown'] },
    description: 'List of options that can be selected from the dropdown',
    fields: [{ key: 'waitCustomDropdownOption', n8nKey: 'option', label: 'Option', kind: 'text', value: '', required: false }],
  },
  {
    key: 'waitCustomCheckboxOptions',
    n8nKey: 'fieldOptions',
    label: 'Checkboxes',
    kind: 'fixedCollection',
    value: { values: [{ option: '' }] },
    required: true,
    collectionKey: 'values',
    collectionLabel: 'Values',
    multiple: true,
    sortable: true,
    addLabel: 'Add Checkbox',
    showWhen: { waitCustomFieldType: ['checkbox'] },
    n8nShowWhen: { fieldType: ['checkbox'] },
    fields: [{ key: 'waitCustomCheckboxOption', n8nKey: 'option', label: 'Checkbox Label', kind: 'text', value: '', required: false }],
  },
  {
    key: 'waitCustomRadioOptions',
    n8nKey: 'fieldOptions',
    label: 'Radio Buttons',
    kind: 'fixedCollection',
    value: { values: [{ option: '' }] },
    required: true,
    collectionKey: 'values',
    collectionLabel: 'Values',
    multiple: true,
    sortable: true,
    addLabel: 'Add Radio Button',
    showWhen: { waitCustomFieldType: ['radio'] },
    n8nShowWhen: { fieldType: ['radio'] },
    fields: [{ key: 'waitCustomRadioOption', n8nKey: 'option', label: 'Radio Button Label', kind: 'text', value: '', required: false }],
  },
  {
    key: 'waitCustomMultiselectLegacyNotice',
    n8nKey: 'multiselectLegacyNotice',
    label: 'Multiple Choice is a legacy option, please use Checkboxes or Radio Buttons field type instead',
    kind: 'notice',
    value: '',
    required: false,
    showWhen: { waitCustomFieldType: ['dropdown'], waitCustomMultiselect: [true] },
    n8nShowWhen: { fieldType: ['dropdown'], multiselect: [true] },
    sourceVersionCondition: '@version < 2.3',
  },
  {
    key: 'waitCustomMultiselect',
    n8nKey: 'multiselect',
    label: 'Multiple Choice',
    kind: 'boolean',
    value: false,
    required: false,
    showWhen: { waitCustomFieldType: ['dropdown'] },
    n8nShowWhen: { fieldType: ['dropdown'] },
    sourceVersionCondition: '@version < 2.3',
    description: 'Whether to allow the user to select multiple options from the dropdown list',
  },
  {
    key: 'waitCustomLimitSelection',
    n8nKey: 'limitSelection',
    label: 'Limit Selection',
    kind: 'select',
    value: 'unlimited',
    required: false,
    showWhen: { waitCustomFieldType: ['checkbox'] },
    n8nShowWhen: { fieldType: ['checkbox'] },
    options: [{ label: 'Exact Number', value: 'exact' }, { label: 'Range', value: 'range' }, { label: 'Unlimited', value: 'unlimited' }],
  },
  {
    key: 'waitCustomNumberOfSelections',
    n8nKey: 'numberOfSelections',
    label: 'Number of Selections',
    kind: 'number',
    value: 1,
    required: false,
    min: 1,
    precision: 0,
    showEvenWhenOptional: true,
    showWhen: { waitCustomFieldType: ['checkbox'], waitCustomLimitSelection: ['exact'] },
    n8nShowWhen: { fieldType: ['checkbox'], limitSelection: ['exact'] },
  },
  {
    key: 'waitCustomMinSelections',
    n8nKey: 'minSelections',
    label: 'Minimum Selections',
    kind: 'number',
    value: 0,
    required: false,
    min: 0,
    precision: 0,
    showEvenWhenOptional: true,
    showWhen: { waitCustomFieldType: ['checkbox'], waitCustomLimitSelection: ['range'] },
    n8nShowWhen: { fieldType: ['checkbox'], limitSelection: ['range'] },
  },
  {
    key: 'waitCustomMaxSelections',
    n8nKey: 'maxSelections',
    label: 'Maximum Selections',
    kind: 'number',
    value: 1,
    required: false,
    min: 1,
    precision: 0,
    showEvenWhenOptional: true,
    showWhen: { waitCustomFieldType: ['checkbox'], waitCustomLimitSelection: ['range'] },
    n8nShowWhen: { fieldType: ['checkbox'], limitSelection: ['range'] },
  },
  {
    key: 'waitCustomHtml',
    n8nKey: 'html',
    label: 'HTML',
    kind: 'textarea',
    sourceKind: 'string',
    value: DEFAULT_CUSTOM_HTML,
    required: false,
    editor: 'htmlEditor',
    noDataExpression: true,
    showWhen: { waitCustomFieldType: ['html'] },
    n8nShowWhen: { fieldType: ['html'] },
    description: 'HTML elements to display on the form page',
    hint: 'Does not accept <code>&lt;script&gt;</code>, <code>&lt;style&gt;</code> or <code>&lt;input&gt;</code> tags',
    simulationNote: 'HTML is retained as inert text and is never rendered or executed.',
  },
  {
    key: 'waitCustomMultipleFiles',
    n8nKey: 'multipleFiles',
    label: 'Multiple Files',
    kind: 'boolean',
    value: true,
    required: false,
    showWhen: { waitCustomFieldType: ['file'] },
    n8nShowWhen: { fieldType: ['file'] },
    description: 'Whether to allow the user to select multiple files from the file input or just one',
  },
  {
    key: 'waitCustomAcceptFileTypes',
    n8nKey: 'acceptFileTypes',
    label: 'Accepted File Types',
    kind: 'text',
    value: '',
    required: false,
    placeholder: 'e.g. .jpg, .png',
    showWhen: { waitCustomFieldType: ['file'] },
    n8nShowWhen: { fieldType: ['file'] },
    description: 'Comma-separated list of allowed file extensions',
    hint: 'Leave empty to allow all file types',
  },
  {
    key: 'waitCustomFormatDateNotice',
    n8nKey: 'formatDate',
    label: "The displayed date is formatted based on the locale of the user's browser",
    kind: 'notice',
    value: '',
    required: false,
    showWhen: { waitCustomFieldType: ['date'] },
    n8nShowWhen: { fieldType: ['date'] },
  },
  {
    key: 'waitCustomRequiredField',
    n8nKey: 'requiredField',
    label: 'Required Field',
    kind: 'boolean',
    value: false,
    required: false,
    showWhen: { waitCustomFieldType: formTypesWithLabels },
    n8nHideWhen: { fieldType: ['html', 'hiddenField'] },
    description: 'Whether to require the user to enter a value for this field before submitting the form',
  },
];

const credentialRequirements = [
  {
    type: 'discordBotApi',
    name: 'Discord Bot API',
    required: true,
    showWhen: { authentication: ['botToken'] },
    testedBy: 'GET /users/@me/guilds',
    inert: true,
    sourcePath: 'packages/nodes-base/credentials/DiscordBotApi.credentials.ts',
    fields: [
      { key: 'discordBotToken', n8nKey: 'botToken', label: 'Bot Token', kind: 'text', value: '', required: true, password: true },
    ],
  },
  {
    type: 'discordOAuth2Api',
    name: 'Discord OAuth2 API',
    required: true,
    showWhen: { authentication: ['oAuth2'] },
    inert: true,
    sourcePath: 'packages/nodes-base/credentials/DiscordOAuth2Api.credentials.ts',
    extends: ['oAuth2Api'],
    fields: [
      { key: 'discordOAuthBotToken', n8nKey: 'botToken', label: 'Bot Token', kind: 'text', value: '', required: false, password: true },
      { key: 'discordOAuthGrantType', n8nKey: 'grantType', label: 'Grant Type', kind: 'hidden', value: 'authorizationCode', required: false },
      { key: 'discordOAuthAuthUrl', n8nKey: 'authUrl', label: 'Authorization URL', kind: 'hidden', value: 'https://discord.com/api/oauth2/authorize', required: true },
      { key: 'discordOAuthAccessTokenUrl', n8nKey: 'accessTokenUrl', label: 'Access Token URL', kind: 'hidden', value: 'https://discord.com/api/oauth2/token', required: true },
      { key: 'discordOAuthAuthQueryParameters', n8nKey: 'authQueryParameters', label: 'Auth URI Query Parameters', kind: 'hidden', value: 'permissions=1642758929655', required: false },
      { key: 'discordOAuthCustomScopes', n8nKey: 'customScopes', label: 'Custom Scopes', kind: 'boolean', value: false, required: false, description: 'Define custom scopes' },
      { key: 'discordOAuthCustomScopesNotice', n8nKey: 'customScopesNotice', label: 'The default scopes needed for the node to work are already set, If you change these the node may not function correctly.', kind: 'notice', value: '', required: false, showWhen: { discordOAuthCustomScopes: [true] }, n8nShowWhen: { customScopes: [true] } },
      { key: 'discordOAuthEnabledScopes', n8nKey: 'enabledScopes', label: 'Enabled Scopes', kind: 'text', value: 'identify guilds guilds.join bot', required: false, showWhen: { discordOAuthCustomScopes: [true] }, n8nShowWhen: { customScopes: [true] }, description: 'Scopes that should be enabled' },
      { key: 'discordOAuthScope', n8nKey: 'scope', label: 'Scope', kind: 'hidden', value: '={{$self["customScopes"] ? $self["enabledScopes"] : "identify guilds guilds.join bot"}}', required: false },
    ],
  },
  {
    type: 'discordWebhookApi',
    name: 'Discord Webhook',
    required: false,
    showWhen: { authentication: ['webhook'] },
    testedBy: 'webhook URL request',
    inert: true,
    sourcePath: 'packages/nodes-base/credentials/DiscordWebhookApi.credentials.ts',
    fields: [
      { key: 'discordWebhookUri', n8nKey: 'webhookUri', label: 'Webhook URL', kind: 'text', value: '', required: true, password: true, placeholder: 'https://discord.com/api/webhooks/ID/TOKEN' },
    ],
  },
];

const credentialParams = credentialRequirements.map(({ type, name, required, showWhen }) => ({
  key: `${type}Credential`,
  n8nKey: `credentials.${type}`,
  label: 'Credential to connect with',
  kind: 'select',
  sourceKind: 'credentials',
  value: type,
  sourceDefault: '',
  required,
  locked: true,
  showWhen,
  options: [{ label: name, value: type }],
  simulationNote: lockedCredentialNote,
}));

const discord = {
  type: 'discord',
  n8nType: 'n8n-nodes-base.discord',
  n8nVersion: 2,
  defaultVersion: 2,
  versionHistory: [1, 2],
  label: 'Discord',
  subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
  description: 'Sends data to Discord',
  details: 'Automate Discord messages, channels, members, roles, approvals, and response forms.',
  category: 'action',
  categories: ['Communication', 'HITL'],
  subcategory: 'Human in the Loop',
  subcategories: ['Human in the Loop'],
  group: ['output'],
  defaults: { name: 'Discord' },
  inputs: ['main'],
  outputs: ['main'],
  portVariants: [{ inputs: ['main'], outputs: ['main'] }],
  aiConnectorPorts: [],
  usableAsTool: true,
  toolMetadata: {
    supportsAiParameters: true,
    humanInTheLoopReviewCapable: true,
    staticConnectorPort: false,
  },
  icon: '/node-icons/discord.svg',
  n8nIcon: 'file:discord.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 256, height: 199 },
  iconAssetSha256: 'e5680ae2cb1a79767c9d28bc4876ad6e152f8860b0e28b90fa48034976ebf5e1',
  aliases: ['human', 'form', 'wait', 'hitl', 'approval'],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.discord/',
  docsMarkdown: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.discord.md',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/discord/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Discord/Discord.node.ts',
    versionPath: 'packages/nodes-base/nodes/Discord/v2/DiscordV2.node.ts',
    descriptionPath: 'packages/nodes-base/nodes/Discord/v2/actions/versionDescription.ts',
    commonDescriptionPath: 'packages/nodes-base/nodes/Discord/v2/actions/common.description.ts',
    operationPaths: [
      'packages/nodes-base/nodes/Discord/v2/actions/channel/create.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/channel/deleteChannel.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/channel/get.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/channel/getAll.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/channel/update.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/member/getAll.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/member/roleAdd.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/member/roleRemove.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/message/deleteMessage.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/message/get.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/message/getAll.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/message/react.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/message/send.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/message/sendAndWait.operation.ts',
      'packages/nodes-base/nodes/Discord/v2/actions/webhook/sendLegacy.operation.ts',
    ],
    listSearchPath: 'packages/nodes-base/nodes/Discord/v2/methods/listSearch.ts',
    loadOptionsPath: 'packages/nodes-base/nodes/Discord/v2/methods/loadOptions.ts',
    sharedSendAndWaitPath: 'packages/nodes-base/utils/sendAndWait/utils.ts',
    sharedWaitDescriptionPath: 'packages/nodes-base/utils/sendAndWait/descriptions.ts',
    sharedFormDescriptionPath: 'packages/nodes-base/nodes/Form/common.descriptions.ts',
    formNodePath: 'packages/nodes-base/nodes/Form/Form.node.ts',
    formCssPath: 'packages/nodes-base/nodes/Form/cssVariables.ts',
    metadataPath: 'packages/nodes-base/nodes/Discord/Discord.node.json',
    credentialPaths: credentialRequirements.map(({ sourcePath }) => sourcePath),
    iconPath: 'packages/nodes-base/nodes/Discord/discord.svg',
  },
  waitingNodeTooltipSource: 'SEND_AND_WAIT_WAITING_TOOLTIP',
  webhooks: [
    { name: 'default', method: 'GET', responseMode: 'onReceived', responseData: '', path: '={{ $nodeId }}', restartWebhook: true, fullPath: true, inert: true },
    { name: 'default', method: 'POST', responseMode: 'onReceived', responseData: '', path: '={{ $nodeId }}', restartWebhook: true, fullPath: true, inert: true },
  ],
  credentialRequirements,
  params: [
    {
      key: 'authentication',
      n8nKey: 'authentication',
      label: 'Connection Type',
      kind: 'select',
      value: 'botToken',
      required: false,
      options: authenticationOptions,
    },
    ...credentialParams,
    {
      key: 'resource',
      n8nKey: 'resource',
      label: 'Resource',
      kind: 'select',
      value: 'channel',
      required: false,
      noDataExpression: true,
      showWhen: { authentication: activeAuthentications },
      options: resourceOptions,
    },
    {
      key: 'channelOperation',
      n8nKey: 'operation',
      label: 'Operation',
      kind: 'select',
      value: 'create',
      required: false,
      noDataExpression: true,
      showWhen: { authentication: activeAuthentications, resource: ['channel'] },
      options: channelOperations,
    },
    makeGuildLocator('channelGuild', { authentication: activeAuthentications, resource: ['channel'] }),
    {
      key: 'messageOperation',
      n8nKey: 'operation',
      label: 'Operation',
      kind: 'select',
      value: 'send',
      required: false,
      noDataExpression: true,
      showWhen: { authentication: activeAuthentications, resource: ['message'] },
      options: messageOperations,
    },
    makeGuildLocator('messageGuild', { authentication: activeAuthentications, resource: ['message'] }),
    {
      key: 'memberOperation',
      n8nKey: 'operation',
      label: 'Operation',
      kind: 'select',
      value: 'getAll',
      required: false,
      noDataExpression: true,
      showWhen: { authentication: activeAuthentications, resource: ['member'] },
      options: memberOperations,
    },
    makeGuildLocator('memberGuild', { authentication: activeAuthentications, resource: ['member'] }),
    {
      key: 'webhookOperation',
      n8nKey: 'operation',
      label: 'Operation',
      kind: 'select',
      value: 'sendLegacy',
      required: false,
      noDataExpression: true,
      showWhen: { authentication: ['webhook'] },
      options: webhookOperations,
    },
    {
      key: 'createChannelName',
      n8nKey: 'name',
      label: 'Name',
      kind: 'text',
      value: '',
      required: true,
      placeholder: 'e.g. new-channel',
      showWhen: { authentication: activeAuthentications, resource: ['channel'], channelOperation: ['create'] },
      description: 'The name of the channel',
    },
    {
      key: 'createChannelType',
      n8nKey: 'type',
      label: 'Type',
      kind: 'select',
      value: '0',
      required: true,
      showWhen: { authentication: activeAuthentications, resource: ['channel'], channelOperation: ['create'] },
      description: 'The type of channel to create',
      options: [
        { label: 'Guild Text', value: '0' },
        { label: 'Guild Voice', value: '2' },
        { label: 'Guild Category', value: '4' },
      ],
    },
    {
      key: 'createChannelOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { authentication: activeAuthentications, resource: ['channel'], channelOperation: ['create'] },
      fields: [
        { key: 'createChannelNsfw', n8nKey: 'nsfw', label: 'Age-Restricted (NSFW)', kind: 'boolean', value: false, required: false, showWhen: { createChannelType: ['0', '2'] }, n8nHideWhen: { '/type': ['4'] }, description: 'Whether the content of the channel might be nsfw (not safe for work)' },
        { key: 'createChannelBitrate', n8nKey: 'bitrate', label: 'Bitrate', kind: 'number', value: 8000, required: false, min: 8000, max: 96000, placeholder: 'e.g. 8000', showWhen: { createChannelType: ['2'] }, n8nShowWhen: { '/type': ['2'] }, description: 'The bitrate (in bits) of the voice channel' },
        makeCategoryLocator('createChannelCategory', { createChannelType: ['0', '2'] }),
        { key: 'createChannelPosition', n8nKey: 'position', label: 'Position', kind: 'number', value: 1, required: false },
        { key: 'createChannelRateLimit', n8nKey: 'rate_limit_per_user', label: 'Rate Limit Per User', kind: 'number', value: 0, required: false, showWhen: { createChannelType: ['0', '2'] }, n8nHideWhen: { '/type': ['4'] }, description: 'Amount of seconds a user has to wait before sending another message' },
        { key: 'createChannelTopic', n8nKey: 'topic', label: 'Topic', kind: 'textarea', value: '', required: false, rows: 2, placeholder: 'e.g. This channel is about…', showWhen: { createChannelType: ['0', '2'] }, n8nHideWhen: { '/type': ['4'] }, description: 'The channel topic description (0-1024 characters)' },
        { key: 'createChannelUserLimit', n8nKey: 'user_limit', label: 'User Limit', kind: 'number', value: 0, required: false, min: 0, max: 99, placeholder: 'e.g. 20', showWhen: { createChannelType: ['2'] }, n8nShowWhen: { '/type': ['2'] }, description: 'The limit for the number of members that can be in the channel (0 refers to no limit)' },
      ],
    },
    makeChannelLocator('deleteChannelChannel', { authentication: activeAuthentications, resource: ['channel'], channelOperation: ['deleteChannel'] }),
    makeChannelLocator('getChannelChannel', { authentication: activeAuthentications, resource: ['channel'], channelOperation: ['get'] }),
    ...makeReturnAllFields('channelGetAll', { authentication: activeAuthentications, resource: ['channel'], channelOperation: ['getAll'] }),
    {
      key: 'channelGetAllOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { authentication: activeAuthentications, resource: ['channel'], channelOperation: ['getAll'] },
      fields: [
        {
          key: 'channelGetAllFilter',
          n8nKey: 'filter',
          label: 'Filter by Type',
          kind: 'multiSelect',
          value: [],
          required: false,
          options: [
            { label: 'Guild Text', value: 0 },
            { label: 'Guild Voice', value: 2 },
            { label: 'Guild Category', value: 4 },
          ],
        },
      ],
    },
    makeChannelLocator('updateChannelChannel', { authentication: activeAuthentications, resource: ['channel'], channelOperation: ['update'] }),
    {
      key: 'updateChannelName',
      n8nKey: 'name',
      label: 'Name',
      kind: 'text',
      value: '',
      required: false,
      placeholder: 'e.g. new-channel-name',
      showWhen: { authentication: activeAuthentications, resource: ['channel'], channelOperation: ['update'] },
      description: "The new name of the channel. Fill this field only if you want to change the channel's name.",
    },
    {
      key: 'updateChannelOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { authentication: activeAuthentications, resource: ['channel'], channelOperation: ['update'] },
      fields: [
        { key: 'updateChannelNsfw', n8nKey: 'nsfw', label: 'Age-Restricted (NSFW)', kind: 'boolean', value: false, required: false, description: 'Whether the content of the channel might be nsfw (not safe for work)' },
        { key: 'updateChannelBitrate', n8nKey: 'bitrate', label: 'Bitrate', kind: 'number', value: 8000, required: false, min: 8000, max: 96000, hint: 'Only applicable to voice channels', description: 'The bitrate (in bits) of the voice channel' },
        makeCategoryLocator('updateChannelCategory'),
        { key: 'updateChannelPosition', n8nKey: 'position', label: 'Position', kind: 'number', value: 1, required: false },
        { key: 'updateChannelRateLimit', n8nKey: 'rate_limit_per_user', label: 'Rate Limit Per User', kind: 'number', value: 0, required: false, description: 'Amount of seconds a user has to wait before sending another message' },
        { key: 'updateChannelTopic', n8nKey: 'topic', label: 'Topic', kind: 'textarea', value: '', required: false, rows: 2, placeholder: 'e.g. This channel is about…', description: 'The channel topic description (0-1024 characters)' },
        { key: 'updateChannelUserLimit', n8nKey: 'user_limit', label: 'User Limit', kind: 'number', value: 0, required: false, min: 0, max: 99, placeholder: 'e.g. 20', hint: 'Only applicable to voice channels', description: 'The limit for the number of members that can be in the channel (0 refers to no limit)' },
      ],
    },
    ...makeReturnAllFields('memberGetAll', { authentication: activeAuthentications, resource: ['member'], memberOperation: ['getAll'] }),
    {
      key: 'memberGetAllAfter',
      n8nKey: 'after',
      label: 'After',
      kind: 'text',
      value: '',
      required: false,
      placeholder: 'e.g. 786953432728469534',
      showWhen: { authentication: activeAuthentications, resource: ['member'], memberOperation: ['getAll'] },
      description: 'The ID of the user after which to return the members',
    },
    {
      key: 'memberGetAllOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { authentication: activeAuthentications, resource: ['member'], memberOperation: ['getAll'] },
      fields: [
        { key: 'memberGetAllSimplify', n8nKey: 'simplify', label: 'Simplify', kind: 'boolean', value: true, required: false, description: 'Whether to return a simplified version of the response instead of the raw data' },
      ],
    },
    makeUserLocator('memberRoleAddUser', { authentication: activeAuthentications, resource: ['member'], memberOperation: ['roleAdd'] }),
    {
      key: 'memberRoleAddRole',
      n8nKey: 'role',
      label: 'Role',
      kind: 'multiSelect',
      value: [],
      required: true,
      showWhen: { authentication: activeAuthentications, resource: ['member'], memberOperation: ['roleAdd'] },
      options: [],
      locked: true,
      dynamicOptions: { source: 'getRoles', dependsOn: ['userId.value', 'guildId.value', 'operation'], inert: true },
      description: 'Select the roles you want to add to the user',
      simulationNote: lookupNote,
    },
    makeUserLocator('memberRoleRemoveUser', { authentication: activeAuthentications, resource: ['member'], memberOperation: ['roleRemove'] }),
    {
      key: 'memberRoleRemoveRole',
      n8nKey: 'role',
      label: 'Role',
      kind: 'multiSelect',
      value: [],
      required: true,
      showWhen: { authentication: activeAuthentications, resource: ['member'], memberOperation: ['roleRemove'] },
      options: [],
      locked: true,
      dynamicOptions: { source: 'getRoles', dependsOn: ['userId.value', 'guildId.value', 'operation'], filtersToUserRoles: true, inert: true },
      description: 'Select the roles you want to add to the user',
      simulationNote: lookupNote,
    },
    makeChannelLocator('messageDeleteChannel', { authentication: activeAuthentications, resource: ['message'], messageOperation: ['deleteMessage'] }),
    makeMessageId('messageDeleteId', { authentication: activeAuthentications, resource: ['message'], messageOperation: ['deleteMessage'] }),
    makeChannelLocator('messageGetChannel', { authentication: activeAuthentications, resource: ['message'], messageOperation: ['get'] }),
    makeMessageId('messageGetId', { authentication: activeAuthentications, resource: ['message'], messageOperation: ['get'] }),
    {
      key: 'messageGetOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['get'] },
      fields: [
        { key: 'messageGetSimplify', n8nKey: 'simplify', label: 'Simplify', kind: 'boolean', value: true, required: false, description: 'Whether to return a simplified version of the response instead of the raw data' },
      ],
    },
    makeChannelLocator('messageGetAllChannel', { authentication: activeAuthentications, resource: ['message'], messageOperation: ['getAll'] }),
    ...makeReturnAllFields('messageGetAll', { authentication: activeAuthentications, resource: ['message'], messageOperation: ['getAll'] }),
    {
      key: 'messageGetAllOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['getAll'] },
      fields: [
        { key: 'messageGetAllSimplify', n8nKey: 'simplify', label: 'Simplify', kind: 'boolean', value: true, required: false, description: 'Whether to return a simplified version of the response instead of the raw data' },
      ],
    },
    makeChannelLocator('messageReactChannel', { authentication: activeAuthentications, resource: ['message'], messageOperation: ['react'] }),
    makeMessageId('messageReactId', { authentication: activeAuthentications, resource: ['message'], messageOperation: ['react'] }),
    {
      key: 'messageReactEmoji',
      n8nKey: 'emoji',
      label: 'Emoji',
      kind: 'text',
      value: '',
      required: true,
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['react'] },
      description: 'The emoji you want to react with',
    },
    ...makeSendToFields('messageSend', { authentication: activeAuthentications, resource: ['message'], messageOperation: ['send'] }),
    {
      key: 'messageSendContent',
      n8nKey: 'content',
      label: 'Message',
      kind: 'textarea',
      value: '',
      required: false,
      rows: 2,
      placeholder: 'e.g. My message',
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['send'] },
      description: 'The content of the message (up to 2000 characters)',
    },
    {
      key: 'messageSendOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['send'] },
      fields: [
        {
          key: 'messageSendFlags',
          n8nKey: 'flags',
          label: 'Flags',
          kind: 'multiSelect',
          value: [],
          required: false,
          options: [
            { label: 'Suppress Embeds', value: 'SUPPRESS_EMBEDS' },
            { label: 'Suppress Notifications', value: 'SUPPRESS_NOTIFICATIONS' },
          ],
          description: 'Message flags. <a href="https://discord.com/developers/docs/resources/channel#message-object-message-flags" target="_blank">More info</a>.”.',
        },
        { key: 'messageSendReplyTo', n8nKey: 'message_reference', label: 'Message to Reply to', kind: 'text', value: '', required: false, placeholder: 'e.g. 1059467601836773386', description: 'Fill this to make your message a reply. Add the message ID.' },
        { key: 'messageSendTts', n8nKey: 'tts', label: 'Text-to-Speech (TTS)', kind: 'boolean', value: false, required: false, description: 'Whether to have a bot reading the message directly in the channel' },
      ],
    },
    makeEmbeds('messageSendEmbeds', { authentication: activeAuthentications, resource: ['message'], messageOperation: ['send'] }),
    makeFiles('messageSendFiles', { authentication: activeAuthentications, resource: ['message'], messageOperation: ['send'] }),
    ...makeSendToFields('messageWait', { authentication: activeAuthentications, resource: ['message'], messageOperation: ['sendAndWait'] }),
    {
      key: 'messageWaitMessage',
      n8nKey: 'message',
      label: 'Message',
      kind: 'textarea',
      value: '',
      required: true,
      rows: 4,
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['sendAndWait'] },
    },
    {
      key: 'messageWaitResponseType',
      n8nKey: 'responseType',
      label: 'Response Type',
      kind: 'select',
      value: 'approval',
      required: false,
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['sendAndWait'] },
      options: responseTypeOptions,
    },
    {
      key: 'waitCustomDefineForm',
      n8nKey: 'defineForm',
      label: 'Define Form',
      kind: 'select',
      value: 'fields',
      required: false,
      noDataExpression: true,
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['sendAndWait'], messageWaitResponseType: ['customForm'] },
      n8nShowWhen: { resource: ['message'], operation: ['sendAndWait'], responseType: ['customForm'] },
      options: [{ label: 'Using Fields Below', value: 'fields' }, { label: 'Using JSON', value: 'json' }],
    },
    {
      key: 'waitCustomJsonOutput',
      n8nKey: 'jsonOutput',
      label: 'Form Fields',
      kind: 'textarea',
      sourceKind: 'json',
      value: DEFAULT_FORM_JSON,
      required: false,
      rows: 5,
      validateType: 'form-fields',
      ignoreValidationDuringExecution: true,
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['sendAndWait'], messageWaitResponseType: ['customForm'], waitCustomDefineForm: ['json'] },
      n8nShowWhen: { resource: ['message'], operation: ['sendAndWait'], responseType: ['customForm'], defineForm: ['json'] },
      hint: '<a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.form/" target="_blank">See docs</a> for field syntax',
      simulationNote: 'JSON remains unparsed authoring text and cannot create or host a form.',
    },
    {
      key: 'waitCustomFormElements',
      n8nKey: 'formFields',
      label: 'Form Elements',
      kind: 'fixedCollection',
      value: {},
      required: false,
      collectionKey: 'values',
      collectionLabel: 'Values',
      multiple: true,
      sortable: true,
      addLabel: 'Add Form Element',
      itemTitleExpression: '={{ $collection.item.properties.find(p => p.name === "fieldType").options.find(o => o.value === $collection.item.value.fieldType).name }}',
      sourceVersionCondition: '@version < 2.5',
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['sendAndWait'], messageWaitResponseType: ['customForm'], waitCustomDefineForm: ['fields'] },
      n8nShowWhen: { resource: ['message'], operation: ['sendAndWait'], responseType: ['customForm'], defineForm: ['fields'] },
      fields: waitCustomFormFields,
      simulationNote: 'Form elements are editable metadata only. No response form is rendered or exposed.',
    },
    {
      key: 'waitApprovalOptions',
      n8nKey: 'approvalOptions',
      label: 'Approval Options',
      kind: 'fixedCollection',
      value: {},
      required: false,
      collectionKey: 'values',
      collectionLabel: 'Values',
      multiple: false,
      addLabel: 'Add option',
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['sendAndWait'], messageWaitResponseType: ['approval'] },
      n8nShowWhen: { resource: ['message'], operation: ['sendAndWait'], responseType: ['approval'] },
      fields: [
        {
          key: 'waitApprovalType',
          n8nKey: 'approvalType',
          label: 'Type of Approval',
          kind: 'select',
          value: 'single',
          required: false,
          options: [{ label: 'Approve Only', value: 'single' }, { label: 'Approve and Disapprove', value: 'double' }],
        },
        { key: 'waitApproveLabel', n8nKey: 'approveLabel', label: 'Approve Button Label', kind: 'text', value: '✓ Approve', required: false, showWhen: { waitApprovalType: ['single', 'double'] }, n8nShowWhen: { approvalType: ['single', 'double'] } },
        { key: 'waitDisapproveLabel', n8nKey: 'disapproveLabel', label: 'Disapprove Button Label', kind: 'text', value: '✗ Decline', required: false, showWhen: { waitApprovalType: ['double'] }, n8nShowWhen: { approvalType: ['double'] } },
      ],
    },
    {
      key: 'waitApprovalResponseOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['sendAndWait'], messageWaitResponseType: ['approval'] },
      n8nShowWhen: { resource: ['message'], operation: ['sendAndWait'], responseType: ['approval'] },
      fields: [makeLimitWaitTime('waitApprovalLimitWaitTime'), makeAppendAttribution('waitApprovalAppendAttribution')],
    },
    {
      key: 'waitFormResponseOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { authentication: activeAuthentications, resource: ['message'], messageOperation: ['sendAndWait'], messageWaitResponseType: ['freeText', 'customForm'] },
      n8nShowWhen: { resource: ['message'], operation: ['sendAndWait'], responseType: ['freeText', 'customForm'] },
      fields: [
        { key: 'waitMessageButtonLabel', n8nKey: 'messageButtonLabel', label: 'Message Button Label', kind: 'text', value: 'Respond', required: false },
        { key: 'waitResponseFormTitle', n8nKey: 'responseFormTitle', label: 'Response Form Title', kind: 'text', value: '', required: false, description: 'Title of the form that the user can access to provide their response' },
        { key: 'waitResponseFormDescription', n8nKey: 'responseFormDescription', label: 'Response Form Description', kind: 'text', value: '', required: false, description: 'Description of the form that the user can access to provide their response' },
        { key: 'waitResponseFormButtonLabel', n8nKey: 'responseFormButtonLabel', label: 'Response Form Button Label', kind: 'text', value: 'Submit', required: false },
        { key: 'waitResponseFormCustomCss', n8nKey: 'responseFormCustomCss', label: 'Response Form Custom Styling', kind: 'textarea', sourceKind: 'string', value: DEFAULT_FORM_CSS, required: false, rows: 10, editor: 'cssEditor', description: 'Override default styling of the response form with CSS', simulationNote: 'CSS is stored as inert authoring text and is never applied to a rendered page.' },
        makeLimitWaitTime('waitFormLimitWaitTime'),
        makeAppendAttribution('waitFormAppendAttribution'),
      ],
      simulationNote: 'Response-form options never create a public form, button, callback URL, or waiting execution.',
    },
    {
      key: 'webhookMessageContent',
      n8nKey: 'content',
      label: 'Message',
      kind: 'textarea',
      value: '',
      required: false,
      rows: 2,
      placeholder: 'e.g. My message',
      showWhen: { authentication: ['webhook'], webhookOperation: ['sendLegacy'] },
      description: 'The content of the message (up to 2000 characters)',
    },
    {
      key: 'webhookMessageOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { authentication: ['webhook'], webhookOperation: ['sendLegacy'] },
      fields: [
        { key: 'webhookAvatarUrl', n8nKey: 'avatar_url', label: 'Avatar URL', kind: 'text', value: '', required: false, placeholder: 'e.g. https://example.com/image.png', description: 'Override the default avatar of the webhook' },
        { key: 'webhookFlags', n8nKey: 'flags', label: 'Flags', kind: 'multiSelect', value: [], required: false, options: [{ label: 'Suppress Embeds', value: 'SUPPRESS_EMBEDS' }, { label: 'Suppress Notifications', value: 'SUPPRESS_NOTIFICATIONS' }], description: 'Message flags. <a href="https://discord.com/developers/docs/resources/channel#message-object-message-flags" target="_blank">More info</a>.”.' },
        { key: 'webhookTts', n8nKey: 'tts', label: 'Text-to-Speech (TTS)', kind: 'boolean', value: false, required: false, description: 'Whether to have a bot reading the message directly in the channel' },
        { key: 'webhookUsername', n8nKey: 'username', label: 'Username', kind: 'text', value: '', required: false, placeholder: 'e.g. My Username', description: 'Override the default username of the webhook' },
        { key: 'webhookWait', n8nKey: 'wait', label: 'Wait', kind: 'boolean', value: false, required: false, description: 'Whether wait for the message to be created before returning its response' },
      ],
    },
    makeEmbeds('webhookMessageEmbeds', { authentication: ['webhook'], webhookOperation: ['sendLegacy'] }),
    makeFiles('webhookMessageFiles', { authentication: ['webhook'], webhookOperation: ['sendLegacy'] }),
  ],
  resourceOperationParity: {
    channel: { expected: ['create', 'deleteChannel', 'get', 'getAll', 'update'], represented: channelOperations.map(({ value }) => value), default: 'create' },
    message: { expected: ['deleteMessage', 'get', 'getAll', 'react', 'send', 'sendAndWait'], represented: messageOperations.map(({ value }) => value), default: 'send' },
    member: { expected: ['getAll', 'roleAdd', 'roleRemove'], represented: memberOperations.map(({ value }) => value), default: 'getAll' },
    webhook: { expected: ['sendLegacy'], represented: webhookOperations.map(({ value }) => value), default: 'sendLegacy' },
  },
  lookupMetadata: {
    guildSearch: { modes: ['list', 'url', 'id'], networkAccess: false },
    channelSearch: { modes: ['list', 'url', 'id'], excludesCategories: true, networkAccess: false },
    textChannelSearch: { modes: ['list', 'url', 'id'], excludesVoiceAndCategories: true, networkAccess: false },
    categorySearch: { modes: ['list', 'url', 'id'], categoriesOnly: true, networkAccess: false },
    userSearch: { modes: ['list', 'id'], paginated: true, networkAccess: false },
    getRoles: { dependsOn: ['userId.value', 'guildId.value', 'operation'], networkAccess: false },
  },
  platformGaps: [
    'The source repeats operation, guildId, channelId, userId, options, embeds, files, and message parameter names across conditional branches; unique UI keys keep branches stable while n8nKey records the real names.',
    'Server, channel, category, user, and role lists normally call Discord. Static list modes are empty; URL and ID modes remain authorable where the source provides them.',
    'Discord v2 inherits the shared pre-2.5 Form Elements surface, including its pre-2.3 legacy Multiple Choice control. JSON, HTML, CSS, form hosting, callbacks, and wait scheduling remain inert.',
    'Credential forms are preserved as metadata, while the node panel exposes locked selectors only. OAuth installation, scope changes, webhook tests, and bot-token tests never run.',
    'The source dateTime, JSON, HTML-editor, and CSS-editor controls are normalized to supported text or textarea controls.',
    'usableAsTool is preserved, but n8n exposes it through tool conversion rather than a static ai_tool connector port.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials', sourceType: 'credentials', normalizedKind: 'locked select', reason: 'Credential discovery and editors are unavailable.' },
    { n8nKey: 'guildId/channelId/userId', sourceType: 'resourceLocator with remote listSearch', normalizedKind: 'resourceLocator', reason: 'List modes remain empty because Discord lookups are disabled.' },
    { n8nKey: 'role', sourceType: 'dynamic multiOptions', normalizedKind: 'multiSelect', reason: 'The role list cannot load without Discord API access.' },
    { n8nKey: 'embeds.values.json/jsonOutput', sourceType: 'json', normalizedKind: 'textarea', reason: 'JSON stays inert authoring text.' },
    { n8nKey: 'timestamp/defaultValue/maxDateAndTime', sourceType: 'dateTime', normalizedKind: 'text', reason: 'Dates remain text and never schedule work.' },
    { n8nKey: 'formFields.values.html/options.responseFormCustomCss', sourceType: 'HTML/CSS editor', normalizedKind: 'textarea', reason: 'The catalog does not render or execute HTML/CSS.' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    oauthInstallation: false,
    oauthRefresh: false,
    authentication: false,
    serverLookup: false,
    channelLookup: false,
    categoryLookup: false,
    userLookup: false,
    roleLookup: false,
    apiRequests: false,
    networkAccess: false,
    sendsMessages: false,
    managesChannels: false,
    managesMembers: false,
    uploadsFiles: false,
    parsesJson: false,
    rendersHtml: false,
    hostsForms: false,
    acceptsResponses: false,
    createsWaitWebhooks: false,
    createsTimers: false,
    waitsForResponse: false,
    resumesExecutions: false,
    voice: false,
  },
  output: {},
};

export default discord;
