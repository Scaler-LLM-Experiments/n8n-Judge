// Editor-only descriptor for n8n's Microsoft Teams v2 action node.
// Credentials, Graph lookups and requests, messages, tasks, forms, webhooks,
// workflow waiting, and tool execution remain inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const oauthAuthentications = ['microsoftTeamsOAuth2Api', 'microsoftOAuth2Api'];
const allAuthentications = [...oauthAuthentications, 'microsoftEntraServicePrincipalApi'];
const lockedCredentialNote =
  'This credential selector is locked. The simulation never creates, reads, tests, signs with, refreshes, or applies Microsoft credentials.';
const lookupNote =
  'n8n normally loads this list from Microsoft Graph. List mode stays empty; manual URL or ID values remain inert authoring data.';

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
        { "option": "option 1" },
        { "option": "option 2" }
      ]
    },
    "requiredField": true
  },
  {
    "fieldLabel": "Checkboxes",
    "fieldType": "checkbox",
    "fieldOptions": {
      "values": [
        { "option": "option 1" },
        { "option": "option 2" }
      ]
    }
  },
  {
    "fieldLabel": "Radio",
    "fieldType": "radio",
    "fieldOptions": {
      "values": [
        { "option": "option 1" },
        { "option": "option 2" }
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
  { "fieldLabel": "Number", "fieldType": "number" },
  { "fieldLabel": "Password", "fieldType": "password" }
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

const graphCloudOptions = [
  { label: 'Global (https://graph.microsoft.com)', value: 'https://graph.microsoft.com' },
  { label: 'US Government (https://graph.microsoft.us)', value: 'https://graph.microsoft.us' },
  { label: 'US Government DOD (https://dod-graph.microsoft.us)', value: 'https://dod-graph.microsoft.us' },
  { label: 'China (https://microsoftgraph.chinacloudapi.cn)', value: 'https://microsoftgraph.chinacloudapi.cn' },
];

const authenticationOptions = [
  { label: 'Teams OAuth2', value: 'microsoftTeamsOAuth2Api' },
  {
    label: 'Microsoft OAuth2 (Graph)',
    value: 'microsoftOAuth2Api',
    description:
      'Generic Microsoft Graph credential. Add the Teams Graph scopes (e.g. Chat.ReadWrite, ChannelMessage.Read.All, Group.ReadWrite.All) and grant admin consent on the credential. See the docs for the full scope string.',
  },
  {
    label: 'Service Principal (App-Only)',
    value: 'microsoftEntraServicePrincipalApi',
    description:
      'App-only access via a Microsoft Entra app registration. App-only Graph cannot act as a signed-in user, so chat actions and chat triggers are unavailable. Grant the relevant application permissions (e.g. Team.ReadBasic.All, Channel.ReadBasic.All, Tasks.ReadWrite.All) and admin consent on the credential.',
  },
];

const resourceOptions = [
  { label: 'Channel', value: 'channel' },
  { label: 'Channel Message', value: 'channelMessage' },
  { label: 'Chat Message', value: 'chatMessage' },
  { label: 'Task', value: 'task' },
];

const channelOperations = [
  { label: 'Create', value: 'create', description: 'Create a new channel', action: 'Create a channel' },
  { label: 'Delete', value: 'deleteChannel', description: 'Delete a channel', action: 'Delete a channel' },
  { label: 'Get', value: 'get', description: 'Get a channel', action: 'Get a channel' },
  { label: 'Get Many', value: 'getAll', description: 'Retrieve many channels', action: 'Get many channels' },
  { label: 'Update', value: 'update', description: 'Update a channel', action: 'Update a channel' },
];

const channelMessageOperations = [
  { label: 'Create', value: 'create', description: 'Create a channel message', action: 'Create a channel message' },
  { label: 'Get Many', value: 'getAll', description: 'Retrieve many channel messages', action: 'Get many channel messages' },
];

const chatMessageOperations = [
  { label: 'Create', value: 'create', description: 'Create a chat message', action: 'Create a chat message' },
  { label: 'Get', value: 'get', description: 'Get a chat message', action: 'Get a chat message' },
  { label: 'Get Many', value: 'getAll', description: 'Retrieve many chat messages', action: 'Get many chat messages' },
  { label: 'Send and Wait for Response', value: 'sendAndWait', description: 'Send a message and wait for response', action: 'Send message and wait for response' },
];

const taskOperations = [
  { label: 'Create', value: 'create', description: 'Create a task', action: 'Create a task' },
  { label: 'Delete', value: 'deleteTask', description: 'Delete a task', action: 'Delete a task' },
  { label: 'Get', value: 'get', description: 'Get a task', action: 'Get a task' },
  { label: 'Get Many', value: 'getAll', description: 'Retrieve many tasks', action: 'Get many tasks' },
  { label: 'Update', value: 'update', description: 'Update a task', action: 'Update a task' },
];

const makeLocator = ({ key, n8nKey, label, source, showWhen, required = true, modes = ['list', 'id'], dependsOn = [], description = '', listPlaceholder = `e.g. My ${label}`, urlMode, idMode }) => {
  const modeOptions = [];
  if (modes.includes('list')) {
    modeOptions.push({ label: 'From List', value: 'list', kind: 'list', placeholder: listPlaceholder, searchListMethod: source, searchable: true });
  }
  if (urlMode) modeOptions.push(urlMode);
  if (modes.includes('id')) {
    modeOptions.push(idMode ?? { label: 'By ID', value: 'id', kind: 'text', placeholder: 'e.g. 00000000-0000-0000-0000-000000000000' });
  }
  const defaultMode = modes[0];
  return {
    key,
    n8nKey,
    label,
    kind: 'resourceLocator',
    sourceKind: 'resourceLocator',
    value: { __rl: true, mode: defaultMode, value: '' },
    sourceDefault: { mode: defaultMode, value: '' },
    required,
    showWhen,
    modes,
    modeOptions,
    options: [],
    dynamicOptions: { source, dependsOn, inert: true },
    description,
    simulationNote: lookupNote,
  };
};

const teamUrlMode = {
  label: 'From URL',
  value: 'url',
  kind: 'text',
  placeholder: 'e.g. https://teams.microsoft.com/l/team/19%3AP8l9gXd6oqlgq…',
  validation: { regex: 'https:\\/\\/teams.microsoft.com\\/.*groupId=[a-f0-9-]+\\&.*', errorMessage: 'Not a valid Microsoft Teams URL' },
  extractValue: { type: 'regex', regex: 'groupId=([a-f0-9-]+)\\&' },
};

const teamIdMode = {
  label: 'By ID', value: 'id', kind: 'text', placeholder: 'e.g. 61165b04-e4cc-4026-b43f-926b4e2a7182',
  validation: { regex: '^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})[ \\t]*', errorMessage: 'Not a valid Microsoft Teams Team ID' },
  extractValue: { type: 'regex', regex: '^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})' },
};

const groupIdMode = { ...teamIdMode, placeholder: '12f0ca7d-b77f-4c4e-93d2-5cbdb4f464c6' };
const memberIdMode = { ...teamIdMode, placeholder: '7e2f1174-e8ee-4859-b8b1-a8d1cc63d276' };

const teamLocator = (key, showWhen) => makeLocator({
  key, n8nKey: 'teamId', label: 'Team', source: 'getTeams', showWhen,
  modes: ['list', 'url', 'id'], urlMode: teamUrlMode, idMode: teamIdMode,
  listPlaceholder: 'e.g. My Team',
  description: 'Select the team from the list, by URL, or by ID (the ID is the "groupId" parameter in the URL you get from "Get a link to the team")',
});

const channelLocator = (key, showWhen) => makeLocator({
  key, n8nKey: 'channelId', label: 'Channel', source: 'getChannels', showWhen,
  dependsOn: ['teamId.value'], listPlaceholder: 'Select a Channel...',
  idMode: { label: 'By ID', value: 'id', kind: 'text', placeholder: '19:-xlxyqXNSCxpI1SDzgQ_L9ZvzSR26pgphq1BJ9y7QJE1@thread.tacv2' },
  description: 'Select the channel from the list, by URL, or by ID (the ID is the "threadId" in the URL)',
});

const chatLocator = (key, showWhen) => makeLocator({
  key, n8nKey: 'chatId', label: 'Chat', source: 'getChats', showWhen,
  listPlaceholder: 'Select a Chat...',
  idMode: { label: 'By ID', value: 'id', kind: 'text', placeholder: '19:7e2f1174-e8ee-4859-b8b1-a8d1cc63d276_0c5cfdbb-596f-4d39-b557-5d9516c94107@unq.gbl.spaces', url: '=https://teams.microsoft.com/l/chat/{{encodeURIComponent($value)}}/0' },
  description: 'Select the chat from the list, by URL, or by ID (find the chat ID after "conversations/" in the URL)',
});

const groupLocator = (key, showWhen, required = true, dependsOn = ['groupSource']) => makeLocator({
  key, n8nKey: 'groupId', label: 'Team', source: 'getGroups', showWhen, required,
  dependsOn, listPlaceholder: 'Select a Team...', idMode: groupIdMode,
});

const planLocator = (key, showWhen, { required = true, servicePrincipal = false, dependsOn } = {}) => makeLocator({
  key, n8nKey: 'planId', label: 'Plan', source: 'getPlans', showWhen, required,
  modes: servicePrincipal ? ['id'] : ['list', 'id'],
  dependsOn: dependsOn ?? (servicePrincipal ? [] : ['groupId.value']),
  listPlaceholder: 'Select a Plan...',
  idMode: { label: 'By ID', value: 'id', kind: 'text', placeholder: 'rl1HYb0cUEiHPc7zgB_KWWUAA7Of' },
  description: 'The plan for the task to belong to',
});

const bucketLocator = (key, showWhen, { required = true, servicePrincipal = false, dependsOn } = {}) => makeLocator({
  key, n8nKey: 'bucketId', label: 'Bucket', source: 'getBuckets', showWhen, required,
  modes: servicePrincipal ? ['id'] : ['list', 'id'], dependsOn: dependsOn ?? ['planId.value'],
  listPlaceholder: 'Select a Bucket...',
  idMode: { label: 'By ID', value: 'id', kind: 'text', placeholder: 'rl1HYb0cUEiHPc7zgB_KWWUAA7Of' },
  description: 'The bucket for the task to belong to',
});

const memberLocator = (key, showWhen, { required = false, servicePrincipal = false, dependsOn } = {}) => ({
  ...makeLocator({
    key, n8nKey: 'assignedTo', label: 'Assigned To', source: 'getMembers', showWhen, required,
    modes: servicePrincipal ? ['id'] : ['list', 'id'],
    dependsOn: dependsOn ?? (servicePrincipal ? [] : ['groupId.value']),
    listPlaceholder: 'Select a Member...', idMode: memberIdMode,
    description: 'The member to assign the task to',
  }),
  sourceN8nKey: 'memberId',
});

const makeReturnAllFields = (prefix, showWhen) => [
  { key: `${prefix}ReturnAll`, n8nKey: 'returnAll', label: 'Return All', kind: 'boolean', value: false, required: false, showWhen, description: 'Whether to return all results or only up to a given limit' },
  { key: `${prefix}Limit`, n8nKey: 'limit', label: 'Limit', kind: 'number', value: 100, required: false, min: 1, showWhen: { ...showWhen, [`${prefix}ReturnAll`]: [false] }, n8nShowWhen: { returnAll: [false] }, description: 'Max number of results to return' },
];

const makeTaskId = (key, operation) => ({
  key, n8nKey: 'taskId', label: 'Task ID', kind: 'text', value: '', required: true,
  placeholder: 'e.g. h3ufgLvXPkSRzYm-zO5cY5gANtBQ',
  showWhen: { resource: ['task'], taskOperation: [operation] },
});

const responseTypeOptions = [
  { label: 'Approval', value: 'approval', description: 'User can approve/disapprove from within the message' },
  { label: 'Free Text', value: 'freeText', description: 'User can submit a response via a form' },
  { label: 'Custom Form', value: 'customForm', description: 'User can submit a response via a custom form' },
];

const formElementTypes = [
  { label: 'Checkboxes', value: 'checkbox' }, { label: 'Custom HTML', value: 'html' },
  { label: 'Date', value: 'date' }, { label: 'Dropdown', value: 'dropdown' },
  { label: 'Email', value: 'email' }, { label: 'File', value: 'file' },
  { label: 'Hidden Field', value: 'hiddenField' }, { label: 'Number', value: 'number' },
  { label: 'Password', value: 'password' }, { label: 'Radio Buttons', value: 'radio' },
  { label: 'Text Input', value: 'text' }, { label: 'Textarea', value: 'textarea' },
];
const formTypesWithLabels = ['checkbox', 'date', 'dropdown', 'email', 'file', 'number', 'password', 'radio', 'text', 'textarea'];
const formTypesWithPlaceholders = ['email', 'number', 'password', 'text', 'textarea'];

const optionCollection = (key, label, fields, showWhen) => ({
  key, n8nKey: 'options', label, kind: 'collection', value: {}, required: false,
  addLabel: 'Add option', showWhen, fields,
});

const makeLimitWaitTime = (key) => ({
  key, n8nKey: 'limitWaitTime', label: 'Limit Wait Time', kind: 'fixedCollection',
  value: { values: { limitType: 'afterTimeInterval', resumeAmount: 45, resumeUnit: 'minutes' } },
  sourceDefault: { values: { limitType: 'afterTimeInterval', resumeAmount: 45, resumeUnit: 'minutes' } },
  required: false, collectionKey: 'values', collectionLabel: 'Values', multiple: false,
  description: 'Whether to limit the time this node should wait for a user response before execution resumes',
  fields: [
    { key: `${key}Type`, n8nKey: 'limitType', label: 'Limit Type', kind: 'select', value: 'afterTimeInterval', options: [{ label: 'After Time Interval', value: 'afterTimeInterval', description: 'Waits for a certain amount of time' }, { label: 'At Specified Time', value: 'atSpecifiedTime', description: 'Waits until the set date and time to continue' }] },
    { key: `${key}Amount`, n8nKey: 'resumeAmount', label: 'Amount', kind: 'number', value: 1, min: 0, precision: 2, showWhen: { [`${key}Type`]: ['afterTimeInterval'] }, n8nShowWhen: { limitType: ['afterTimeInterval'] }, description: 'The time to wait' },
    { key: `${key}Unit`, n8nKey: 'resumeUnit', label: 'Unit', kind: 'select', value: 'hours', showWhen: { [`${key}Type`]: ['afterTimeInterval'] }, n8nShowWhen: { limitType: ['afterTimeInterval'] }, options: [{ label: 'Minutes', value: 'minutes' }, { label: 'Hours', value: 'hours' }, { label: 'Days', value: 'days' }] },
    { key: `${key}MaxDate`, n8nKey: 'maxDateAndTime', label: 'Max Date and Time', kind: 'text', sourceKind: 'dateTime', value: '', showWhen: { [`${key}Type`]: ['atSpecifiedTime'] }, n8nShowWhen: { limitType: ['atSpecifiedTime'] }, description: 'Continue execution after the specified date and time' },
  ],
  simulationNote: 'This collection records a limit only. It never schedules or resumes an execution.',
});

const makeAppendAttribution = (key) => ({
  key, n8nKey: 'appendAttribution', label: 'Append n8n Attribution', kind: 'boolean', value: true,
  description: 'Whether to include the phrase "This message was sent automatically with n8n" at the end of the message',
});

const waitCustomFormFields = [
  { key: 'teamsWaitFieldLabel', n8nKey: 'fieldLabel', label: 'Field Name', kind: 'text', value: '', required: true, placeholder: 'e.g. What is your name?', showWhen: { teamsWaitFieldType: formTypesWithLabels }, n8nHideWhen: { fieldType: ['hiddenField', 'html'] }, sourceVersionCondition: '@version < 2.4', description: 'Label that appears above the input field' },
  { key: 'teamsWaitHiddenFieldName', n8nKey: 'fieldName', label: 'Field Name', kind: 'text', value: '', showWhen: { teamsWaitFieldType: ['hiddenField'] }, n8nShowWhen: { fieldType: ['hiddenField'] }, sourceVersionCondition: '@version < 2.4', description: 'The name of the field, used in input attributes and referenced by the workflow' },
  { key: 'teamsWaitFieldType', n8nKey: 'fieldType', label: 'Element Type', kind: 'select', value: 'text', required: true, options: formElementTypes, description: 'The type of field to add to the form', builderHint: { propertyHint: "Valid values: text, number, email, textarea, dropdown, date, file, html, hiddenField, radio, checkbox, password. There is NO 'time' type." } },
  { key: 'teamsWaitElementName', n8nKey: 'elementName', label: 'Element Name', kind: 'text', value: '', placeholder: 'e.g. content-section', showWhen: { teamsWaitFieldType: ['html'] }, n8nShowWhen: { fieldType: ['html'] }, description: 'Optional field. It can be used to include the HTML in the output.' },
  { key: 'teamsWaitPlaceholder', n8nKey: 'placeholder', label: 'Placeholder', kind: 'text', value: '', showWhen: { teamsWaitFieldType: formTypesWithPlaceholders }, n8nHideWhen: { fieldType: ['dropdown', 'date', 'file', 'html', 'hiddenField', 'radio', 'checkbox'] }, description: 'Sample text to display inside the field' },
  { key: 'teamsWaitDefaultText', n8nKey: 'defaultValue', label: 'Default Value', kind: 'text', value: '', showWhen: { teamsWaitFieldType: ['text', 'number', 'email', 'textarea'] }, n8nShowWhen: { fieldType: ['text', 'number', 'email', 'textarea'] } },
  { key: 'teamsWaitDefaultDate', n8nKey: 'defaultValue', label: 'Default Value', kind: 'text', sourceKind: 'dateTime', inputType: 'date', dateOnly: true, value: '', showWhen: { teamsWaitFieldType: ['date'] }, n8nShowWhen: { fieldType: ['date'] } },
  { key: 'teamsWaitDefaultChoice', n8nKey: 'defaultValue', label: 'Default Value', kind: 'text', value: '', showWhen: { teamsWaitFieldType: ['dropdown', 'radio'] }, n8nShowWhen: { fieldType: ['dropdown', 'radio'] } },
  { key: 'teamsWaitDefaultCheckboxes', n8nKey: 'defaultValue', label: 'Default Value', kind: 'text', value: '', showWhen: { teamsWaitFieldType: ['checkbox'] }, n8nShowWhen: { fieldType: ['checkbox'] }, description: 'Separate multiple pre-selected options with a comma.' },
  { key: 'teamsWaitFieldValue', n8nKey: 'fieldValue', label: 'Field Value', kind: 'text', value: '', showWhen: { teamsWaitFieldType: ['hiddenField'] }, n8nShowWhen: { fieldType: ['hiddenField'] } },
  { key: 'teamsWaitDropdownOptions', n8nKey: 'fieldOptions', label: 'Field Options', kind: 'fixedCollection', value: { values: [{ option: '' }] }, required: true, collectionKey: 'values', collectionLabel: 'Values', multiple: true, sortable: true, addLabel: 'Add Field Option', showWhen: { teamsWaitFieldType: ['dropdown'] }, n8nShowWhen: { fieldType: ['dropdown'] }, fields: [{ key: 'teamsWaitDropdownOption', n8nKey: 'option', label: 'Option', kind: 'text', value: '' }] },
  { key: 'teamsWaitCheckboxOptions', n8nKey: 'fieldOptions', label: 'Checkboxes', kind: 'fixedCollection', value: { values: [{ option: '' }] }, required: true, collectionKey: 'values', collectionLabel: 'Values', multiple: true, sortable: true, addLabel: 'Add Checkbox', showWhen: { teamsWaitFieldType: ['checkbox'] }, n8nShowWhen: { fieldType: ['checkbox'] }, fields: [{ key: 'teamsWaitCheckboxOption', n8nKey: 'option', label: 'Checkbox Label', kind: 'text', value: '' }] },
  { key: 'teamsWaitRadioOptions', n8nKey: 'fieldOptions', label: 'Radio Buttons', kind: 'fixedCollection', value: { values: [{ option: '' }] }, required: true, collectionKey: 'values', collectionLabel: 'Values', multiple: true, sortable: true, addLabel: 'Add Radio Button', showWhen: { teamsWaitFieldType: ['radio'] }, n8nShowWhen: { fieldType: ['radio'] }, fields: [{ key: 'teamsWaitRadioOption', n8nKey: 'option', label: 'Radio Button Label', kind: 'text', value: '' }] },
  { key: 'teamsWaitMultiselectNotice', n8nKey: 'multiselectLegacyNotice', label: 'Multiple Choice is a legacy option, please use Checkboxes or Radio Buttons field type instead', kind: 'notice', value: '', showWhen: { teamsWaitFieldType: ['dropdown'], teamsWaitMultiselect: [true] }, n8nShowWhen: { fieldType: ['dropdown'], multiselect: [true] }, sourceVersionCondition: '@version < 2.3' },
  { key: 'teamsWaitMultiselect', n8nKey: 'multiselect', label: 'Multiple Choice', kind: 'boolean', value: false, showWhen: { teamsWaitFieldType: ['dropdown'] }, n8nShowWhen: { fieldType: ['dropdown'] }, sourceVersionCondition: '@version < 2.3' },
  { key: 'teamsWaitLimitSelection', n8nKey: 'limitSelection', label: 'Limit Selection', kind: 'select', value: 'unlimited', showWhen: { teamsWaitFieldType: ['checkbox'] }, n8nShowWhen: { fieldType: ['checkbox'] }, options: [{ label: 'Exact Number', value: 'exact' }, { label: 'Range', value: 'range' }, { label: 'Unlimited', value: 'unlimited' }] },
  { key: 'teamsWaitNumberSelections', n8nKey: 'numberOfSelections', label: 'Number of Selections', kind: 'number', value: 1, min: 1, precision: 0, showEvenWhenOptional: true, showWhen: { teamsWaitFieldType: ['checkbox'], teamsWaitLimitSelection: ['exact'] }, n8nShowWhen: { fieldType: ['checkbox'], limitSelection: ['exact'] } },
  { key: 'teamsWaitMinSelections', n8nKey: 'minSelections', label: 'Minimum Selections', kind: 'number', value: 0, min: 0, precision: 0, showEvenWhenOptional: true, showWhen: { teamsWaitFieldType: ['checkbox'], teamsWaitLimitSelection: ['range'] }, n8nShowWhen: { fieldType: ['checkbox'], limitSelection: ['range'] } },
  { key: 'teamsWaitMaxSelections', n8nKey: 'maxSelections', label: 'Maximum Selections', kind: 'number', value: 1, min: 1, precision: 0, showEvenWhenOptional: true, showWhen: { teamsWaitFieldType: ['checkbox'], teamsWaitLimitSelection: ['range'] }, n8nShowWhen: { fieldType: ['checkbox'], limitSelection: ['range'] } },
  { key: 'teamsWaitHtml', n8nKey: 'html', label: 'HTML', kind: 'textarea', sourceKind: 'string', value: DEFAULT_CUSTOM_HTML, editor: 'htmlEditor', noDataExpression: true, showWhen: { teamsWaitFieldType: ['html'] }, n8nShowWhen: { fieldType: ['html'] }, hint: 'Does not accept <code>&lt;script&gt;</code>, <code>&lt;style&gt;</code> or <code>&lt;input&gt;</code> tags', simulationNote: 'HTML remains inert text and is never rendered or executed.' },
  { key: 'teamsWaitMultipleFiles', n8nKey: 'multipleFiles', label: 'Multiple Files', kind: 'boolean', value: true, showWhen: { teamsWaitFieldType: ['file'] }, n8nShowWhen: { fieldType: ['file'] } },
  { key: 'teamsWaitAcceptFileTypes', n8nKey: 'acceptFileTypes', label: 'Accepted File Types', kind: 'text', value: '', placeholder: 'e.g. .jpg, .png', showWhen: { teamsWaitFieldType: ['file'] }, n8nShowWhen: { fieldType: ['file'] }, hint: 'Leave empty to allow all file types' },
  { key: 'teamsWaitDateNotice', n8nKey: 'formatDate', label: "The displayed date is formatted based on the user's browser locale", kind: 'notice', value: '', showWhen: { teamsWaitFieldType: ['date'] }, n8nShowWhen: { fieldType: ['date'] } },
  { key: 'teamsWaitRequired', n8nKey: 'requiredField', label: 'Required Field', kind: 'boolean', value: false, showWhen: { teamsWaitFieldType: formTypesWithLabels }, n8nHideWhen: { fieldType: ['html', 'hiddenField'] } },
];

const microsoftOAuthFields = (prefix) => [
  { key: `${prefix}GrantType`, n8nKey: 'grantType', label: 'Grant Type', kind: 'hidden', value: 'authorizationCode' },
  { key: `${prefix}ClientCredentialType`, n8nKey: 'clientCredentialType', label: 'Authentication', kind: 'select', value: 'clientSecret', options: [{ label: 'Client Secret', value: 'clientSecret' }, { label: 'Certificate', value: 'certificate' }], description: 'How n8n authenticates to Microsoft Entra when exchanging and refreshing tokens.' },
  { key: `${prefix}ClientSecret`, n8nKey: 'clientSecret', label: 'Client Secret', kind: 'text', value: '', required: true, password: true, showWhen: { [`${prefix}ClientCredentialType`]: ['clientSecret'] }, n8nShowWhen: { clientCredentialType: ['clientSecret'] } },
  { key: `${prefix}PrivateKey`, n8nKey: 'privateKey', label: 'Private Key', kind: 'textarea', value: '', required: true, password: true, rows: 4, showWhen: { [`${prefix}ClientCredentialType`]: ['certificate'] }, n8nShowWhen: { clientCredentialType: ['certificate'] }, description: 'PEM-encoded RSA private key paired with the registered certificate' },
  { key: `${prefix}Certificate`, n8nKey: 'certificate', label: 'Certificate', kind: 'textarea', value: '', required: true, password: true, rows: 4, showWhen: { [`${prefix}ClientCredentialType`]: ['certificate'] }, n8nShowWhen: { clientCredentialType: ['certificate'] }, description: 'PEM-encoded public certificate registered on the Entra app' },
  { key: `${prefix}AuthUrl`, n8nKey: 'authUrl', label: 'Authorization URL', kind: 'text', value: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' },
  { key: `${prefix}AccessTokenUrl`, n8nKey: 'accessTokenUrl', label: 'Access Token URL', kind: 'text', value: 'https://login.microsoftonline.com/common/oauth2/v2.0/token' },
  { key: `${prefix}AuthQueryParameters`, n8nKey: 'authQueryParameters', label: 'Auth URI Query Parameters', kind: 'hidden', value: 'response_mode=query&prompt=select_account' },
  { key: `${prefix}Authentication`, n8nKey: 'authentication', label: 'Authentication', kind: 'hidden', value: 'body' },
  { key: `${prefix}GraphApiBaseUrl`, n8nKey: 'graphApiBaseUrl', label: 'Microsoft Graph API Base URL', kind: 'select', value: 'https://graph.microsoft.com', options: graphCloudOptions, description: 'Select the endpoint for your Microsoft cloud environment.' },
];

const teamsDefaultScopes = 'openid offline_access User.Read.All Group.Read.All Chat.ReadWrite ChannelMessage.Read.All';
const credentialRequirements = [
  {
    type: 'microsoftTeamsOAuth2Api', name: 'Microsoft Teams OAuth2 API', required: true,
    showWhen: { authentication: ['microsoftTeamsOAuth2Api'] }, inert: true,
    extends: ['microsoftOAuth2Api', 'oAuth2Api'], documentationUrl: 'microsoft',
    sourcePath: 'packages/nodes-base/credentials/MicrosoftTeamsOAuth2Api.credentials.ts',
    fields: [
      ...microsoftOAuthFields('teamsOauth'),
      { key: 'teamsOauthCustomScopes', n8nKey: 'customScopes', label: 'Custom Scopes', kind: 'boolean', value: false, description: 'Define custom scopes' },
      { key: 'teamsOauthCustomScopesNotice', n8nKey: 'customScopesNotice', label: 'The default scopes needed for the node to work are already set, If you change these the node may not function correctly.', kind: 'notice', value: '', showWhen: { teamsOauthCustomScopes: [true] }, n8nShowWhen: { customScopes: [true] } },
      { key: 'teamsOauthEnabledScopes', n8nKey: 'enabledScopes', label: 'Enabled Scopes', kind: 'text', value: teamsDefaultScopes, showWhen: { teamsOauthCustomScopes: [true] }, n8nShowWhen: { customScopes: [true] }, description: 'Scopes that should be enabled' },
      { key: 'teamsOauthScope', n8nKey: 'scope', label: 'Scope', kind: 'hidden', value: '={{$self["customScopes"] ? $self["enabledScopes"] : "openid offline_access User.Read.All Group.Read.All Chat.ReadWrite ChannelMessage.Read.All"}}' },
      { key: 'teamsOauthTriggerPermissionsNotice', n8nKey: 'notice', label: 'Microsoft Teams Trigger requires ChannelMessage.Read.All, Chat.Read.All, Team.ReadBasic.All, and Subscription.Read.All permissions configured in Microsoft Entra.', kind: 'notice', value: '' },
    ],
  },
  {
    type: 'microsoftOAuth2Api', name: 'Microsoft OAuth2 API', required: true,
    showWhen: { authentication: ['microsoftOAuth2Api'] }, inert: true, extends: ['oAuth2Api'],
    documentationUrl: 'microsoft', sourcePath: 'packages/nodes-base/credentials/MicrosoftOAuth2Api.credentials.ts',
    fields: microsoftOAuthFields('graphOauth'),
  },
  {
    type: 'microsoftEntraServicePrincipalApi', name: 'Microsoft Entra Service Principal', required: true,
    showWhen: { authentication: ['microsoftEntraServicePrincipalApi'] }, inert: true,
    documentationUrl: 'microsoftentra', testedBy: 'GET /v1.0/organization',
    sourcePath: 'packages/nodes-base/credentials/MicrosoftEntraServicePrincipalApi.credentials.ts',
    fields: [
      { key: 'serviceAccessToken', n8nKey: 'accessToken', label: 'Access Token', kind: 'hidden', value: '', expirable: true },
      { key: 'serviceAuthentication', n8nKey: 'authentication', label: 'Authentication', kind: 'select', value: 'clientSecret', options: [{ label: 'Client Secret', value: 'clientSecret' }, { label: 'Certificate', value: 'certificate' }] },
      { key: 'serviceSetupNotice', n8nKey: 'setupNotice', label: 'App-only access uses application permissions that an admin must consent to. The connection test needs Organization.Read.All or Directory.Read.All.', kind: 'notice', value: '' },
      { key: 'serviceTenantId', n8nKey: 'tenantId', label: 'Directory (Tenant) ID', kind: 'text', value: '', required: true },
      { key: 'serviceClientId', n8nKey: 'clientId', label: 'Application (Client) ID', kind: 'text', value: '', required: true },
      { key: 'serviceClientSecret', n8nKey: 'clientSecret', label: 'Client Secret', kind: 'text', value: '', required: true, password: true, showWhen: { serviceAuthentication: ['clientSecret'] }, n8nShowWhen: { authentication: ['clientSecret'] } },
      { key: 'servicePrivateKey', n8nKey: 'privateKey', label: 'Private Key', kind: 'textarea', value: '', required: true, password: true, rows: 4, showWhen: { serviceAuthentication: ['certificate'] }, n8nShowWhen: { authentication: ['certificate'] } },
      { key: 'serviceCertificate', n8nKey: 'certificate', label: 'Certificate', kind: 'textarea', value: '', required: true, rows: 4, showWhen: { serviceAuthentication: ['certificate'] }, n8nShowWhen: { authentication: ['certificate'] } },
      { key: 'serviceGraphApiBaseUrl', n8nKey: 'graphApiBaseUrl', label: 'Microsoft Graph API Base URL', kind: 'select', value: 'https://graph.microsoft.com', options: graphCloudOptions },
    ],
  },
];

const credentialParams = credentialRequirements.map(({ type, name, required, showWhen }) => ({
  key: `${type}Credential`, n8nKey: `credentials.${type}`, label: 'Credential to connect with',
  kind: 'select', sourceKind: 'credentials', value: type, sourceDefault: '', required,
  locked: true, showWhen, options: [{ label: name, value: type }], simulationNote: lockedCredentialNote,
}));

const microsoftTeams = {
  type: 'microsoft-teams',
  n8nType: 'n8n-nodes-base.microsoftTeams',
  n8nVersion: 2,
  defaultVersion: 2,
  versionHistory: [1, 1.1, 2],
  label: 'Microsoft Teams',
  defaultName: 'Microsoft Teams',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Consume Microsoft Teams API',
  details: 'Manage Microsoft Teams channels, messages, chats, Planner tasks, approvals, and response forms.',
  category: 'action',
  categories: ['Communication', 'HITL'],
  subcategory: 'Human in the Loop',
  subcategories: ['Human in the Loop'],
  group: ['input'],
  defaults: { name: 'Microsoft Teams' },
  inputs: ['main'],
  outputs: ['main'],
  portVariants: [{ inputs: ['main'], outputs: ['main'] }],
  usableAsTool: true,
  toolConnector: 'ai_tool',
  aiConnectorPorts: [],
  toolMetadata: { supportsAiParameters: true, humanInTheLoopReviewCapable: true, staticConnectorPort: false },
  icon: '/node-icons/microsoft-teams.svg',
  n8nIcon: 'file:teams.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { viewBox: '0 0 2381.4 2354.5' },
  iconAssetSha256: '0d0ad1d366e4ac407b648002a8c4663c0acd4c56a20e46a25d0aae9a79e16670',
  aliases: ['human', 'form', 'wait', 'hitl', 'approval'],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.microsoftteams/',
  docsMarkdown: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.microsoftteams.md',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/microsoft/',
  credentialDocsByType: {
    microsoftTeamsOAuth2Api: 'https://docs.n8n.io/integrations/builtin/credentials/microsoft/',
    microsoftOAuth2Api: 'https://docs.n8n.io/integrations/builtin/credentials/microsoft/',
    microsoftEntraServicePrincipalApi: 'https://docs.n8n.io/integrations/builtin/credentials/microsoftentra/',
  },
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Microsoft/Teams/MicrosoftTeams.node.ts',
    versionPath: 'packages/nodes-base/nodes/Microsoft/Teams/v2/MicrosoftTeamsV2.node.ts',
    descriptionPath: 'packages/nodes-base/nodes/Microsoft/Teams/v2/actions/versionDescription.ts',
    metadataPath: 'packages/nodes-base/nodes/Microsoft/Teams/MicrosoftTeams.node.json',
    actionRoot: 'packages/nodes-base/nodes/Microsoft/Teams/v2/actions',
    resourceLocatorPath: 'packages/nodes-base/nodes/Microsoft/Teams/v2/descriptions/rlc.description.ts',
    transportPath: 'packages/nodes-base/nodes/Microsoft/Teams/v2/transport/index.ts',
    sharedSendAndWaitPath: 'packages/nodes-base/utils/sendAndWait/utils.ts',
    sharedWaitDescriptionPath: 'packages/nodes-base/utils/sendAndWait/descriptions.ts',
    sharedFormDescriptionPath: 'packages/nodes-base/nodes/Form/common.descriptions.ts',
    formNodePath: 'packages/nodes-base/nodes/Form/Form.node.ts',
    formCssPath: 'packages/nodes-base/nodes/Form/cssVariables.ts',
    credentialPaths: credentialRequirements.map(({ sourcePath }) => sourcePath),
    iconPath: 'packages/nodes-base/nodes/Microsoft/Teams/teams.svg',
  },
  waitingNodeTooltipSource: 'SEND_AND_WAIT_WAITING_TOOLTIP',
  webhooks: [
    { name: 'default', method: 'GET', responseMode: 'onReceived', responseData: '', path: '={{ $nodeId }}', restartWebhook: true, fullPath: true, isFullPath: true, inert: true },
    { name: 'default', method: 'POST', responseMode: 'onReceived', responseData: '', path: '={{ $nodeId }}', restartWebhook: true, fullPath: true, isFullPath: true, inert: true },
  ],
  credentialRequirements,
  params: [
    { key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'select', value: 'microsoftTeamsOAuth2Api', required: false, noDataExpression: true, options: authenticationOptions },
    ...credentialParams,
    { key: 'resource', n8nKey: 'resource', label: 'Resource', kind: 'select', value: 'channel', required: false, noDataExpression: true, options: resourceOptions },
    { key: 'channelOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', value: 'create', required: false, noDataExpression: true, showWhen: { resource: ['channel'] }, options: channelOperations },
    { key: 'channelMessageOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', value: 'create', required: false, noDataExpression: true, showWhen: { resource: ['channelMessage'] }, options: channelMessageOperations },
    { key: 'chatUnavailableNotice', n8nKey: 'chatServicePrincipalNotice', label: 'Chat messages are not available with the Service Principal credential. App-only Microsoft Graph has no signed-in user; use an OAuth2 credential for chat actions.', kind: 'notice', value: '', showWhen: { authentication: ['microsoftEntraServicePrincipalApi'], resource: ['chatMessage'] } },
    { key: 'chatMessageOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', value: 'create', required: false, noDataExpression: true, showWhen: { authentication: oauthAuthentications, resource: ['chatMessage'] }, n8nHideWhen: { authentication: ['microsoftEntraServicePrincipalApi'] }, options: chatMessageOperations },
    { key: 'taskOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', value: 'create', required: false, noDataExpression: true, showWhen: { resource: ['task'] }, options: taskOperations },

    teamLocator('channelCreateTeam', { resource: ['channel'], channelOperation: ['create'] }),
    { key: 'channelCreateName', n8nKey: 'name', label: 'New Channel Name', kind: 'text', value: '', required: true, placeholder: 'e.g. My New Channel', showWhen: { resource: ['channel'], channelOperation: ['create'] } },
    optionCollection('channelCreateOptions', 'Options', [
      { key: 'channelCreateDescription', n8nKey: 'description', label: 'Description', kind: 'textarea', value: '', rows: 2 },
      { key: 'channelCreateType', n8nKey: 'type', label: 'Type', kind: 'select', value: 'standard', options: [{ label: 'Private', value: 'private' }, { label: 'Standard', value: 'standard' }] },
    ], { resource: ['channel'], channelOperation: ['create'] }),
    teamLocator('channelDeleteTeam', { resource: ['channel'], channelOperation: ['deleteChannel'] }),
    channelLocator('channelDeleteChannel', { resource: ['channel'], channelOperation: ['deleteChannel'] }),
    teamLocator('channelGetTeam', { resource: ['channel'], channelOperation: ['get'] }),
    channelLocator('channelGetChannel', { resource: ['channel'], channelOperation: ['get'] }),
    teamLocator('channelGetAllTeam', { resource: ['channel'], channelOperation: ['getAll'] }),
    ...makeReturnAllFields('channelGetAll', { resource: ['channel'], channelOperation: ['getAll'] }),
    teamLocator('channelUpdateTeam', { resource: ['channel'], channelOperation: ['update'] }),
    channelLocator('channelUpdateChannel', { resource: ['channel'], channelOperation: ['update'] }),
    { key: 'channelUpdateName', n8nKey: 'name', label: 'Name', kind: 'text', value: '', placeholder: 'e.g. My New Channel name', showWhen: { resource: ['channel'], channelOperation: ['update'] } },
    optionCollection('channelUpdateOptions', 'Options', [
      { key: 'channelUpdateDescription', n8nKey: 'description', label: 'Description', kind: 'textarea', value: '', rows: 2 },
    ], { resource: ['channel'], channelOperation: ['update'] }),

    { key: 'channelMessageCreateServiceNotice', n8nKey: 'servicePrincipalCreateNotice', label: 'Sending channel messages is not available with the Service Principal credential (app-only Graph supports only migration import). Use an OAuth2 credential to post messages.', kind: 'notice', value: '', showWhen: { authentication: ['microsoftEntraServicePrincipalApi'], resource: ['channelMessage'], channelMessageOperation: ['create'] } },
    teamLocator('channelMessageCreateTeam', { authentication: oauthAuthentications, resource: ['channelMessage'], channelMessageOperation: ['create'] }),
    channelLocator('channelMessageCreateChannel', { authentication: oauthAuthentications, resource: ['channelMessage'], channelMessageOperation: ['create'] }),
    { key: 'channelMessageCreateContentType', n8nKey: 'contentType', label: 'Content Type', kind: 'select', value: 'text', required: true, showWhen: { authentication: oauthAuthentications, resource: ['channelMessage'], channelMessageOperation: ['create'] }, options: [{ label: 'Text', value: 'text' }, { label: 'HTML', value: 'html' }] },
    { key: 'channelMessageCreateMessage', n8nKey: 'message', label: 'Message', kind: 'textarea', value: '', required: true, rows: 2, showWhen: { authentication: oauthAuthentications, resource: ['channelMessage'], channelMessageOperation: ['create'] } },
    optionCollection('channelMessageCreateOptions', 'Options', [
      { key: 'channelMessageCreateIncludeLink', n8nKey: 'includeLinkToWorkflow', label: 'Include Link to Workflow', kind: 'boolean', value: true },
      { key: 'channelMessageCreateReplyId', n8nKey: 'makeReply', label: 'Reply to ID', kind: 'text', value: '', placeholder: 'e.g. 1673348720590' },
    ], { authentication: oauthAuthentications, resource: ['channelMessage'], channelMessageOperation: ['create'] }),
    { key: 'channelMessageGetAllMeteredNotice', n8nKey: 'servicePrincipalMeteredNotice', label: 'Reading channel messages with the Service Principal credential uses the metered Microsoft Teams API, which may require billing/eval-model configuration on the tenant.', kind: 'notice', value: '', showWhen: { authentication: ['microsoftEntraServicePrincipalApi'], resource: ['channelMessage'], channelMessageOperation: ['getAll'] } },
    teamLocator('channelMessageGetAllTeam', { resource: ['channelMessage'], channelMessageOperation: ['getAll'] }),
    channelLocator('channelMessageGetAllChannel', { resource: ['channelMessage'], channelMessageOperation: ['getAll'] }),
    ...makeReturnAllFields('channelMessageGetAll', { resource: ['channelMessage'], channelMessageOperation: ['getAll'] }),

    chatLocator('chatMessageCreateChat', { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['create'] }),
    { key: 'chatMessageCreateContentType', n8nKey: 'contentType', label: 'Content Type', kind: 'select', value: 'text', required: true, showWhen: { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['create'] }, options: [{ label: 'Text', value: 'text' }, { label: 'HTML', value: 'html' }] },
    { key: 'chatMessageCreateMessage', n8nKey: 'message', label: 'Message', kind: 'textarea', value: '', required: true, rows: 2, showWhen: { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['create'] } },
    optionCollection('chatMessageCreateOptions', 'Options', [
      { key: 'chatMessageCreateIncludeLink', n8nKey: 'includeLinkToWorkflow', label: 'Include Link to Workflow', kind: 'boolean', value: true },
    ], { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['create'] }),
    chatLocator('chatMessageGetChat', { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['get'] }),
    { key: 'chatMessageGetId', n8nKey: 'messageId', label: 'Message ID', kind: 'text', value: '', required: true, placeholder: 'e.g. 1673355049064', showWhen: { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['get'] } },
    chatLocator('chatMessageGetAllChat', { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['getAll'] }),
    ...makeReturnAllFields('chatMessageGetAll', { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['getAll'] }),

    chatLocator('chatMessageWaitChat', { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['sendAndWait'] }),
    { key: 'chatMessageWaitMessage', n8nKey: 'message', label: 'Message', kind: 'textarea', value: '', required: true, rows: 4, showWhen: { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['sendAndWait'] } },
    { key: 'chatMessageWaitResponseType', n8nKey: 'responseType', label: 'Response Type', kind: 'select', value: 'approval', showWhen: { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['sendAndWait'] }, options: responseTypeOptions },
    { key: 'teamsWaitDefineForm', n8nKey: 'defineForm', label: 'Define Form', kind: 'select', value: 'fields', noDataExpression: true, showWhen: { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['sendAndWait'], chatMessageWaitResponseType: ['customForm'] }, n8nShowWhen: { resource: ['chatMessage'], operation: ['sendAndWait'], responseType: ['customForm'] }, options: [{ label: 'Using Fields Below', value: 'fields' }, { label: 'Using JSON', value: 'json' }] },
    { key: 'teamsWaitJsonOutput', n8nKey: 'jsonOutput', label: 'Form Fields', kind: 'textarea', sourceKind: 'json', value: DEFAULT_FORM_JSON, rows: 5, validateType: 'form-fields', ignoreValidationDuringExecution: true, showWhen: { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['sendAndWait'], chatMessageWaitResponseType: ['customForm'], teamsWaitDefineForm: ['json'] }, n8nShowWhen: { resource: ['chatMessage'], operation: ['sendAndWait'], responseType: ['customForm'], defineForm: ['json'] }, hint: '<a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.form/" target="_blank">See docs</a> for field syntax', simulationNote: 'JSON remains unparsed authoring text and cannot create or host a form.' },
    { key: 'teamsWaitFormElements', n8nKey: 'formFields', label: 'Form Elements', kind: 'fixedCollection', value: {}, collectionKey: 'values', collectionLabel: 'Values', multiple: true, sortable: true, addLabel: 'Add Form Element', itemTitleExpression: '={{ $collection.item.properties.find(p => p.name === "fieldType").options.find(o => o.value === $collection.item.value.fieldType).name }}', sourceVersionCondition: '@version < 2.5', showWhen: { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['sendAndWait'], chatMessageWaitResponseType: ['customForm'], teamsWaitDefineForm: ['fields'] }, n8nShowWhen: { resource: ['chatMessage'], operation: ['sendAndWait'], responseType: ['customForm'], defineForm: ['fields'] }, fields: waitCustomFormFields, simulationNote: 'Form elements are editable metadata only. No response form is rendered or exposed.' },
    { key: 'teamsWaitApprovalOptions', n8nKey: 'approvalOptions', label: 'Approval Options', kind: 'fixedCollection', value: {}, collectionKey: 'values', collectionLabel: 'Values', multiple: false, addLabel: 'Add option', showWhen: { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['sendAndWait'], chatMessageWaitResponseType: ['approval'] }, n8nShowWhen: { resource: ['chatMessage'], operation: ['sendAndWait'], responseType: ['approval'] }, fields: [
      { key: 'teamsWaitApprovalType', n8nKey: 'approvalType', label: 'Type of Approval', kind: 'select', value: 'single', options: [{ label: 'Approve Only', value: 'single' }, { label: 'Approve and Disapprove', value: 'double' }] },
      { key: 'teamsWaitApproveLabel', n8nKey: 'approveLabel', label: 'Approve Button Label', kind: 'text', value: '✓ Approve', showWhen: { teamsWaitApprovalType: ['single', 'double'] }, n8nShowWhen: { approvalType: ['single', 'double'] } },
      { key: 'teamsWaitDisapproveLabel', n8nKey: 'disapproveLabel', label: 'Disapprove Button Label', kind: 'text', value: '✗ Decline', showWhen: { teamsWaitApprovalType: ['double'] }, n8nShowWhen: { approvalType: ['double'] } },
    ] },
    optionCollection('teamsWaitApprovalResponseOptions', 'Options', [makeLimitWaitTime('teamsWaitApprovalLimit'), makeAppendAttribution('teamsWaitApprovalAttribution')], { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['sendAndWait'], chatMessageWaitResponseType: ['approval'] }),
    optionCollection('teamsWaitFormResponseOptions', 'Options', [
      { key: 'teamsWaitMessageButtonLabel', n8nKey: 'messageButtonLabel', label: 'Message Button Label', kind: 'text', value: 'Respond' },
      { key: 'teamsWaitResponseFormTitle', n8nKey: 'responseFormTitle', label: 'Response Form Title', kind: 'text', value: '' },
      { key: 'teamsWaitResponseFormDescription', n8nKey: 'responseFormDescription', label: 'Response Form Description', kind: 'text', value: '' },
      { key: 'teamsWaitResponseFormButtonLabel', n8nKey: 'responseFormButtonLabel', label: 'Response Form Button Label', kind: 'text', value: 'Submit' },
      { key: 'teamsWaitResponseFormCustomCss', n8nKey: 'responseFormCustomCss', label: 'Response Form Custom Styling', kind: 'textarea', sourceKind: 'string', value: DEFAULT_FORM_CSS, rows: 10, editor: 'cssEditor', simulationNote: 'CSS remains inert authoring text and is never applied to a rendered page.' },
      makeLimitWaitTime('teamsWaitFormLimit'),
      makeAppendAttribution('teamsWaitFormAttribution'),
    ], { authentication: oauthAuthentications, resource: ['chatMessage'], chatMessageOperation: ['sendAndWait'], chatMessageWaitResponseType: ['freeText', 'customForm'] }),

    groupLocator('taskCreateGroup', { authentication: oauthAuthentications, resource: ['task'], taskOperation: ['create'] }),
    planLocator('taskCreatePlanOauth', { authentication: oauthAuthentications, resource: ['task'], taskOperation: ['create'] }),
    bucketLocator('taskCreateBucketOauth', { authentication: oauthAuthentications, resource: ['task'], taskOperation: ['create'] }),
    planLocator('taskCreatePlanService', { authentication: ['microsoftEntraServicePrincipalApi'], resource: ['task'], taskOperation: ['create'] }, { servicePrincipal: true }),
    bucketLocator('taskCreateBucketService', { authentication: ['microsoftEntraServicePrincipalApi'], resource: ['task'], taskOperation: ['create'] }, { servicePrincipal: true }),
    { key: 'taskCreateTitle', n8nKey: 'title', label: 'Title', kind: 'text', value: '', required: true, placeholder: 'e.g. new task', showWhen: { resource: ['task'], taskOperation: ['create'] } },
    optionCollection('taskCreateOptions', 'Options', [
      memberLocator('taskCreateAssignedOauth', { authentication: oauthAuthentications }, { required: false }),
      memberLocator('taskCreateAssignedService', { authentication: ['microsoftEntraServicePrincipalApi'] }, { required: false, servicePrincipal: true }),
      { key: 'taskCreateDueDateTime', n8nKey: 'dueDateTime', label: 'Due Date Time', kind: 'text', sourceKind: 'dateTime', value: '' },
      { key: 'taskCreatePercentComplete', n8nKey: 'percentComplete', label: 'Percent Complete', kind: 'number', value: 0, min: 0, max: 100, placeholder: 'e.g. 75' },
    ], { resource: ['task'], taskOperation: ['create'] }),
    makeTaskId('taskDeleteId', 'deleteTask'),
    makeTaskId('taskGetId', 'get'),
    { key: 'taskGetAllTasksFor', n8nKey: 'tasksFor', label: 'Tasks For', kind: 'select', value: 'member', required: true, showWhen: { authentication: oauthAuthentications, resource: ['task'], taskOperation: ['getAll'] }, n8nHideWhen: { authentication: ['microsoftEntraServicePrincipalApi'] }, description: 'Whether to retrieve the tasks for a user or for a plan', options: [{ label: 'Group Member', value: 'member', description: 'Tasks assigned to group member' }, { label: 'Plan', value: 'plan', description: 'Tasks in group plan' }] },
    groupLocator('taskGetAllGroup', { authentication: oauthAuthentications, resource: ['task'], taskOperation: ['getAll'] }),
    planLocator('taskGetAllPlanOauth', { authentication: oauthAuthentications, resource: ['task'], taskOperation: ['getAll'], taskGetAllTasksFor: ['plan'] }),
    planLocator('taskGetAllPlanService', { authentication: ['microsoftEntraServicePrincipalApi'], resource: ['task'], taskOperation: ['getAll'] }, { servicePrincipal: true }),
    ...makeReturnAllFields('taskGetAll', { resource: ['task'], taskOperation: ['getAll'] }),
    makeTaskId('taskUpdateId', 'update'),
    {
      key: 'taskUpdateFields', n8nKey: 'updateFields', label: 'Update Fields', kind: 'collection', value: {}, addLabel: 'Add Field',
      showWhen: { resource: ['task'], taskOperation: ['update'] },
      fields: [
        memberLocator('taskUpdateAssignedOauth', { authentication: oauthAuthentications }, { required: false, dependsOn: ['updateFields.groupId.value'] }),
        memberLocator('taskUpdateAssignedService', { authentication: ['microsoftEntraServicePrincipalApi'] }, { required: false, servicePrincipal: true }),
        bucketLocator('taskUpdateBucketOauth', { authentication: oauthAuthentications }, { required: false, dependsOn: ['updateFields.planId.value'] }),
        bucketLocator('taskUpdateBucketService', { authentication: ['microsoftEntraServicePrincipalApi'] }, { required: false, servicePrincipal: true }),
        { key: 'taskUpdateDueDateTime', n8nKey: 'dueDateTime', label: 'Due Date Time', kind: 'text', sourceKind: 'dateTime', value: '' },
        groupLocator('taskUpdateGroup', { authentication: oauthAuthentications }, false, ['/groupSource']),
        { key: 'taskUpdatePercentComplete', n8nKey: 'percentComplete', label: 'Percent Complete', kind: 'number', value: 0, min: 0, max: 100 },
        planLocator('taskUpdatePlanOauth', { authentication: oauthAuthentications }, { required: false, dependsOn: ['updateFields.groupId.value'] }),
        planLocator('taskUpdatePlanService', { authentication: ['microsoftEntraServicePrincipalApi'] }, { required: false, servicePrincipal: true }),
        { key: 'taskUpdateTitle', n8nKey: 'title', label: 'Title', kind: 'text', value: '', placeholder: 'e.g. my task' },
      ],
    },
  ],
  resources: [
    { value: 'channel', defaultOperation: 'create', operations: channelOperations.map(({ value }) => value) },
    { value: 'channelMessage', defaultOperation: 'create', operations: channelMessageOperations.map(({ value }) => value) },
    { value: 'chatMessage', defaultOperation: 'create', operations: chatMessageOperations.map(({ value }) => value) },
    { value: 'task', defaultOperation: 'create', operations: taskOperations.map(({ value }) => value) },
  ],
  resourceOperationParity: {
    channel: { expected: ['create', 'deleteChannel', 'get', 'getAll', 'update'], represented: channelOperations.map(({ value }) => value), default: 'create' },
    channelMessage: { expected: ['create', 'getAll'], represented: channelMessageOperations.map(({ value }) => value), default: 'create' },
    chatMessage: { expected: ['create', 'get', 'getAll', 'sendAndWait'], represented: chatMessageOperations.map(({ value }) => value), default: 'create' },
    task: { expected: ['create', 'deleteTask', 'get', 'getAll', 'update'], represented: taskOperations.map(({ value }) => value), default: 'create' },
  },
  lookupMetadata: {
    getTeams: { modes: ['list', 'url', 'id'], networkAccess: false },
    getChannels: { modes: ['list', 'id'], dependsOn: ['teamId.value'], networkAccess: false },
    getChats: { modes: ['list', 'id'], networkAccess: false },
    getGroups: { modes: ['list', 'id'], dependsOn: ['groupSource'], networkAccess: false },
    getPlans: { modes: ['list', 'id'], dependsOn: ['groupId.value'], servicePrincipalModes: ['id'], networkAccess: false },
    getBuckets: { modes: ['list', 'id'], dependsOn: ['planId.value'], servicePrincipalModes: ['id'], networkAccess: false },
    getMembers: { modes: ['list', 'id'], dependsOn: ['groupId.value'], servicePrincipalModes: ['id'], networkAccess: false },
  },
  platformGaps: [
    'The source repeats operation, locator, options, task-update, and message parameter names across conditional branches; unique UI keys keep each branch stable while n8nKey records the real parameter name.',
    'Microsoft Graph list-search methods are disabled. Team URLs and all source-supported IDs remain authorable; app-only task locators intentionally expose ID mode only.',
    'Send and Wait inherits the shared Form surface and webhook descriptions. JSON, HTML, CSS, form hosting, callbacks, timers, workflow waiting, and execution resumption remain inert.',
    'Credential forms are retained as provenance metadata while the panel exposes locked selectors only. OAuth installation, token exchange, certificate signing, refresh, and credential tests never run.',
    'Graph dateTime, JSON, HTML-editor, and CSS-editor controls are normalized to supported text or textarea controls.',
    'usableAsTool is preserved, but n8n exposes it through tool conversion rather than a static ai_tool connector port.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials', sourceType: 'credentials', normalizedKind: 'locked select', reason: 'Credential discovery and editors are unavailable.' },
    { n8nKey: 'teamId/channelId/chatId/groupId/planId/bucketId/memberId', sourceType: 'resourceLocator with remote listSearch', normalizedKind: 'resourceLocator', reason: 'List modes remain empty because Microsoft Graph access is disabled.' },
    { n8nKey: 'dueDateTime/maxDateAndTime', sourceType: 'dateTime', normalizedKind: 'text', reason: 'Dates remain authoring text and never schedule work.' },
    { n8nKey: 'jsonOutput', sourceType: 'json', normalizedKind: 'textarea', reason: 'JSON remains inert authoring text.' },
    { n8nKey: 'formFields.values.html/options.responseFormCustomCss', sourceType: 'HTML/CSS editor', normalizedKind: 'textarea', reason: 'The catalog does not render or execute HTML/CSS.' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    oauthInstallation: false,
    oauthRefresh: false,
    tokenExchange: false,
    certificateSigning: false,
    authentication: false,
    graphLookup: false,
    apiRequests: false,
    networkAccess: false,
    createsChannels: false,
    updatesChannels: false,
    deletesChannels: false,
    sendsMessages: false,
    readsMessages: false,
    createsTasks: false,
    updatesTasks: false,
    deletesTasks: false,
    parsesJson: false,
    rendersHtml: false,
    hostsForms: false,
    acceptsResponses: false,
    createsWaitWebhooks: false,
    createsTimers: false,
    waitsForResponse: false,
    resumesExecutions: false,
    toolExecution: false,
    voice: false,
  },
  output: {},
};

export default microsoftTeams;
