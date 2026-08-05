// Editor-only descriptor for n8n's Send Email v2.1 node. SMTP credentials,
// messages, attachments, response webhooks, and workflow waiting remain inert.

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

const operationOptions = [
  { label: 'Send', value: 'send', action: 'Send an Email' },
  {
    label: 'Send and Wait for Response',
    value: 'sendAndWait',
    action: 'Send message and wait for response',
  },
];

const emailFormatOptions = [
  { label: 'Text', value: 'text', description: 'Send email as plain text' },
  { label: 'HTML', value: 'html', description: 'Send email as HTML' },
  {
    label: 'Both',
    value: 'both',
    description: "Send both formats, recipient's client selects version to display",
  },
];

const responseTypeOptions = [
  {
    label: 'Approval',
    value: 'approval',
    description: 'User can approve/disapprove from within the message',
  },
  {
    label: 'Free Text',
    value: 'freeText',
    description: 'User can submit a response via a form',
  },
  {
    label: 'Custom Form',
    value: 'customForm',
    description: 'User can submit a response via a custom form',
  },
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

const formTypesWithLabels = [
  'checkbox',
  'date',
  'dropdown',
  'email',
  'file',
  'number',
  'password',
  'radio',
  'text',
  'textarea',
];

const formTypesWithPlaceholders = ['email', 'number', 'password', 'text', 'textarea'];

const sendCondition = { resource: ['email'], operation: ['send'] };
const waitCondition = { resource: ['email'], operation: ['sendAndWait'] };

const lockedCredentialNote =
  'This selector is locked. The simulation never reads, creates, tests, or applies SMTP credentials.';

const inertAddressNote =
  'Stored as inert text exactly like the pinned n8n string control. Names and comma-separated addresses are never parsed, validated, or contacted.';

const inertHtmlNote =
  'HTML is retained as authoring text only. The simulation never renders, sanitizes, executes, or sends it.';

const makeLimitWaitTime = (key) => ({
  key,
  n8nKey: 'limitWaitTime',
  label: 'Limit Wait Time',
  kind: 'fixedCollection',
  value: {
    values: { limitType: 'afterTimeInterval', resumeAmount: 45, resumeUnit: 'minutes' },
  },
  required: false,
  collectionKey: 'values',
  collectionLabel: 'Values',
  multiple: false,
  description:
    'Whether to limit the time this node should wait for a user response before execution resumes',
  fields: [
    {
      key: `${key}LimitType`,
      n8nKey: 'limitType',
      label: 'Limit Type',
      kind: 'select',
      value: 'afterTimeInterval',
      required: false,
      description:
        'Sets the condition for the execution to resume. Can be a specified date or after some time.',
      options: [
        {
          label: 'After Time Interval',
          value: 'afterTimeInterval',
          description: 'Waits for a certain amount of time',
        },
        {
          label: 'At Specified Time',
          value: 'atSpecifiedTime',
          description: 'Waits until the set date and time to continue',
        },
      ],
    },
    {
      key: `${key}ResumeAmount`,
      n8nKey: 'resumeAmount',
      label: 'Amount',
      kind: 'number',
      value: 1,
      required: false,
      min: 0,
      precision: 2,
      showWhen: { [`${key}LimitType`]: ['afterTimeInterval'] },
      n8nShowWhen: { limitType: ['afterTimeInterval'] },
      description: 'The time to wait',
    },
    {
      key: `${key}ResumeUnit`,
      n8nKey: 'resumeUnit',
      label: 'Unit',
      kind: 'select',
      value: 'hours',
      required: false,
      showWhen: { [`${key}LimitType`]: ['afterTimeInterval'] },
      n8nShowWhen: { limitType: ['afterTimeInterval'] },
      options: [
        { label: 'Minutes', value: 'minutes' },
        { label: 'Hours', value: 'hours' },
        { label: 'Days', value: 'days' },
      ],
      description: 'Unit of the interval value',
    },
    {
      key: `${key}MaxDateAndTime`,
      n8nKey: 'maxDateAndTime',
      label: 'Max Date and Time',
      kind: 'text',
      sourceKind: 'dateTime',
      format: 'dateTime',
      value: '',
      required: false,
      showWhen: { [`${key}LimitType`]: ['atSpecifiedTime'] },
      n8nShowWhen: { limitType: ['atSpecifiedTime'] },
      description: 'Continue execution after the specified date and time',
    },
  ],
  simulationNote:
    'This collection only records a limit. It never calculates a wake time, creates a timer, or resumes an execution.',
});

const makeAppendAttribution = (key, messageKind = 'message') => ({
  key,
  n8nKey: 'appendAttribution',
  label: 'Append n8n Attribution',
  kind: 'boolean',
  value: true,
  required: false,
  ...(messageKind === 'message'
    ? {
        description:
          'Whether to include the phrase "This message was sent automatically with n8n" to the end of the message',
      }
    : {
        description:
          'Whether to include the phrase “This email was sent automatically with n8n” to the end of the email',
      }),
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
    description:
      'The name of the field, used in input attributes and referenced by the workflow',
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
    n8nHideWhen: {
      fieldType: ['dropdown', 'date', 'file', 'html', 'hiddenField', 'radio', 'checkbox'],
    },
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
    description:
      'Default date value that will be pre-filled in the form field (format: YYYY-MM-DD)',
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
    description:
      'Default value that will be pre-selected. Must match one of the option labels.',
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
    description:
      'Default value(s) that will be pre-selected. Must match one or multiple of the option labels. Separate multiple pre-selected options with a comma.',
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
    description:
      'Input value can be set here or will be passed as a query parameter via Field Name if no value is set',
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
    fields: [
      {
        key: 'waitCustomDropdownOption',
        n8nKey: 'option',
        label: 'Option',
        kind: 'text',
        value: '',
        required: false,
      },
    ],
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
    fields: [
      {
        key: 'waitCustomCheckboxOption',
        n8nKey: 'option',
        label: 'Checkbox Label',
        kind: 'text',
        value: '',
        required: false,
      },
    ],
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
    fields: [
      {
        key: 'waitCustomRadioOption',
        n8nKey: 'option',
        label: 'Radio Button Label',
        kind: 'text',
        value: '',
        required: false,
      },
    ],
  },
  {
    key: 'waitCustomMultiselectLegacyNotice',
    n8nKey: 'multiselectLegacyNotice',
    label:
      'Multiple Choice is a legacy option, please use Checkboxes or Radio Buttons field type instead',
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
    options: [
      { label: 'Exact Number', value: 'exact' },
      { label: 'Range', value: 'range' },
      { label: 'Unlimited', value: 'unlimited' },
    ],
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
    showWhen: {
      waitCustomFieldType: ['checkbox'],
      waitCustomLimitSelection: ['exact'],
    },
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
    showWhen: {
      waitCustomFieldType: ['checkbox'],
      waitCustomLimitSelection: ['range'],
    },
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
    showWhen: {
      waitCustomFieldType: ['checkbox'],
      waitCustomLimitSelection: ['range'],
    },
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
    hint:
      'Does not accept <code>&lt;script&gt;</code>, <code>&lt;style&gt;</code> or <code>&lt;input&gt;</code> tags',
    simulationNote: inertHtmlNote,
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
    description:
      'Whether to allow the user to select multiple files from the file input or just one',
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
    description:
      'Whether to require the user to enter a value for this field before submitting the form',
  },
];

const sendEmail = {
  type: 'send-email',
  n8nType: 'n8n-nodes-base.emailSend',
  n8nVersion: 2.1,
  defaultVersion: 2.1,
  versionHistory: [1, 2, 2.1],
  label: 'Send Email',
  defaultName: 'Send Email',
  subtitle: '',
  description: 'Sends an email using SMTP protocol',
  details:
    'Configure an SMTP email or a human-in-the-loop response request. This catalog entry only models authoring metadata.',
  category: 'core',
  categories: ['Communication', 'HITL', 'Core Nodes'],
  subcategory: 'Human in the Loop',
  subcategories: ['Human in the Loop'],
  group: ['output'],
  inputs: ['main'],
  outputs: ['main'],
  usableAsTool: true,
  icon: '/node-icons/send-email.svg',
  n8nIcon: 'node:send-mail',
  iconMode: 'currentColor',
  iconColor: 'black',
  aliases: ['SMTP', 'email', 'human', 'form', 'wait', 'hitl', 'approval'],
  docs:
    'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sendemail/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/send-email/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/EmailSend/EmailSend.node.ts',
    versionPath: 'packages/nodes-base/nodes/EmailSend/v2/EmailSendV2.node.ts',
    sendDescriptionPath: 'packages/nodes-base/nodes/EmailSend/v2/send.operation.ts',
    sendAndWaitDescriptionPath:
      'packages/nodes-base/nodes/EmailSend/v2/sendAndWait.operation.ts',
    sharedDescriptionPath: 'packages/nodes-base/nodes/EmailSend/v2/descriptions.ts',
    sharedSendAndWaitPath: 'packages/nodes-base/utils/sendAndWait/utils.ts',
    sharedWaitDescriptionPath: 'packages/nodes-base/utils/sendAndWait/descriptions.ts',
    sharedFormDescriptionPath: 'packages/nodes-base/nodes/Form/common.descriptions.ts',
    formNodePath: 'packages/nodes-base/nodes/Form/Form.node.ts',
    formCssPath: 'packages/nodes-base/nodes/Form/cssVariables.ts',
    metadataPath: 'packages/nodes-base/nodes/EmailSend/EmailSend.node.json',
    credentialPath: 'packages/nodes-base/credentials/Smtp.credentials.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/send-mail.svg',
  },
  defaults: { name: 'Send Email' },
  waitingNodeTooltipSource: 'SEND_AND_WAIT_WAITING_TOOLTIP',
  webhooks: [
    {
      name: 'default',
      method: 'GET',
      responseMode: 'onReceived',
      responseData: '',
      path: '={{ $nodeId }}',
      restartWebhook: true,
      fullPath: true,
      inert: true,
    },
    {
      name: 'default',
      method: 'POST',
      responseMode: 'onReceived',
      responseData: '',
      path: '={{ $nodeId }}',
      restartWebhook: true,
      fullPath: true,
      inert: true,
    },
  ],
  credentialRequirements: [
    {
      type: 'smtp',
      name: 'SMTP',
      required: true,
      testedBy: 'smtpConnectionTest',
      inert: true,
      fields: [
        {
          key: 'smtpCredentialUser',
          n8nKey: 'user',
          label: 'User',
          kind: 'text',
          value: '',
          required: false,
        },
        {
          key: 'smtpCredentialPassword',
          n8nKey: 'password',
          label: 'Password',
          kind: 'text',
          value: '',
          required: false,
          password: true,
        },
        {
          key: 'smtpCredentialHost',
          n8nKey: 'host',
          label: 'Host',
          kind: 'text',
          value: '',
          required: false,
        },
        {
          key: 'smtpCredentialPort',
          n8nKey: 'port',
          label: 'Port',
          kind: 'number',
          value: 465,
          required: false,
        },
        {
          key: 'smtpCredentialSecure',
          n8nKey: 'secure',
          label: 'SSL/TLS',
          kind: 'boolean',
          value: true,
          required: false,
        },
        {
          key: 'smtpCredentialDisableStartTls',
          n8nKey: 'disableStartTls',
          label: 'Disable STARTTLS',
          kind: 'boolean',
          value: false,
          required: false,
          showWhen: { smtpCredentialSecure: [false] },
          n8nShowWhen: { secure: [false] },
        },
        {
          key: 'smtpCredentialHostName',
          n8nKey: 'hostName',
          label: 'Client Host Name',
          kind: 'text',
          value: '',
          required: false,
          placeholder: '',
          description: 'The hostname of the client, used for identifying to the server',
        },
      ],
    },
  ],
  params: [
    {
      key: 'smtpCredential',
      n8nKey: 'credentials.smtp',
      label: 'Credential to connect with',
      kind: 'select',
      sourceKind: 'credentials',
      value: 'smtp',
      required: true,
      locked: true,
      options: [{ label: 'SMTP', value: 'smtp' }],
      testedBy: 'smtpConnectionTest',
      simulationNote: lockedCredentialNote,
    },
    {
      key: 'resource',
      label: 'Resource',
      kind: 'hidden',
      value: 'email',
      required: false,
      noDataExpression: true,
      options: [{ label: 'Email', value: 'email' }],
    },
    {
      key: 'operation',
      label: 'Operation',
      kind: 'select',
      value: 'send',
      required: false,
      noDataExpression: true,
      showWhen: { resource: ['email'] },
      options: operationOptions,
    },
    {
      key: 'sendFromEmail',
      n8nKey: 'fromEmail',
      label: 'From Email',
      kind: 'text',
      value: '',
      required: true,
      placeholder: 'admin@example.com',
      showWhen: sendCondition,
      description:
        'Email address of the sender. You can also specify a name: Nathan Doe &lt;nate@n8n.io&gt;.',
      simulationNote: inertAddressNote,
    },
    {
      key: 'sendToEmail',
      n8nKey: 'toEmail',
      label: 'To Email',
      kind: 'text',
      value: '',
      required: true,
      placeholder: 'info@example.com',
      showWhen: sendCondition,
      description:
        'Email address of the recipient. You can also specify a name: Nathan Doe &lt;nate@n8n.io&gt;.',
      simulationNote: inertAddressNote,
    },
    {
      key: 'sendSubject',
      n8nKey: 'subject',
      label: 'Subject',
      kind: 'text',
      value: '',
      required: false,
      placeholder: 'My subject line',
      showWhen: sendCondition,
      description: 'Subject line of the email',
    },
    {
      key: 'sendEmailFormat',
      n8nKey: 'emailFormat',
      label: 'Email Format',
      kind: 'select',
      value: 'html',
      required: false,
      showWhen: sendCondition,
      sourceVersionCondition: '@version != 2',
      options: emailFormatOptions,
    },
    {
      key: 'sendTextBody',
      n8nKey: 'text',
      label: 'Text',
      kind: 'textarea',
      sourceKind: 'string',
      value: '',
      required: false,
      rows: 5,
      showWhen: { ...sendCondition, sendEmailFormat: ['text', 'both'] },
      n8nShowWhen: { resource: ['email'], operation: ['send'], emailFormat: ['text', 'both'] },
      description: 'Plain text message of email',
    },
    {
      key: 'sendHtmlBody',
      n8nKey: 'html',
      label: 'HTML',
      kind: 'textarea',
      sourceKind: 'string',
      value: '',
      required: false,
      rows: 5,
      showWhen: { ...sendCondition, sendEmailFormat: ['html', 'both'] },
      n8nShowWhen: { resource: ['email'], operation: ['send'], emailFormat: ['html', 'both'] },
      description: 'HTML text message of email',
      simulationNote: inertHtmlNote,
    },
    {
      key: 'sendOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: sendCondition,
      fields: [
        makeAppendAttribution('sendAppendAttribution', 'email'),
        {
          key: 'sendInlineAttachments',
          n8nKey: 'attachments',
          label: 'Attachments (Inline)',
          kind: 'text',
          value: '',
          required: false,
          description:
            'Binary properties to embed in the email body. Multiple ones can be comma-separated. Reference them in HTML via <code>cid:propertyName</code>, e.g. &lt;img src="cid:image_1"&gt;. Use \'Attachments (File)\' for regular file attachments.',
          simulationNote:
            'Binary property names remain text. No binary input is read and no MIME attachment is created.',
        },
        {
          key: 'sendFileAttachments',
          n8nKey: 'fileAttachments',
          label: 'Attachments (File)',
          kind: 'text',
          value: '',
          required: false,
          description:
            "Binary properties to attach to the email as regular files. Multiple ones can be comma-separated. They appear in the recipient's attachments list and are not embedded in the body.",
          simulationNote:
            'Binary property names remain text. No binary input is read and no MIME attachment is created.',
        },
        {
          key: 'sendCcEmail',
          n8nKey: 'ccEmail',
          label: 'CC Email',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'cc@example.com',
          description: 'Email address of CC recipient',
          simulationNote: inertAddressNote,
        },
        {
          key: 'sendBccEmail',
          n8nKey: 'bccEmail',
          label: 'BCC Email',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'bcc@example.com',
          description: 'Email address of BCC recipient',
          simulationNote: inertAddressNote,
        },
        {
          key: 'sendAllowUnauthorizedCerts',
          n8nKey: 'allowUnauthorizedCerts',
          label: 'Ignore SSL Issues (Insecure)',
          kind: 'boolean',
          value: false,
          required: false,
          description: 'Whether to connect even if SSL certificate validation is not possible',
        },
        {
          key: 'sendReplyTo',
          n8nKey: 'replyTo',
          label: 'Reply To',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'info@example.com',
          description: 'The email address to send the reply to',
          simulationNote: inertAddressNote,
        },
      ],
    },
    {
      key: 'waitFromEmail',
      n8nKey: 'fromEmail',
      label: 'From Email',
      kind: 'text',
      value: '',
      required: true,
      placeholder: 'admin@example.com',
      showWhen: waitCondition,
      description:
        'Email address of the sender. You can also specify a name: Nathan Doe &lt;nate@n8n.io&gt;.',
      simulationNote: inertAddressNote,
    },
    {
      key: 'waitToEmail',
      n8nKey: 'toEmail',
      label: 'To Email',
      kind: 'text',
      value: '',
      required: true,
      placeholder: 'info@example.com',
      showWhen: waitCondition,
      description:
        'Email address of the recipient. You can also specify a name: Nathan Doe &lt;nate@n8n.io&gt;.',
      simulationNote: inertAddressNote,
    },
    {
      key: 'waitSubject',
      n8nKey: 'subject',
      label: 'Subject',
      kind: 'text',
      value: '',
      required: true,
      placeholder: 'e.g. Approval required',
      showWhen: waitCondition,
    },
    {
      key: 'waitMessage',
      n8nKey: 'message',
      label: 'Message',
      kind: 'textarea',
      sourceKind: 'string',
      value: '',
      required: true,
      rows: 4,
      showWhen: waitCondition,
      simulationNote: inertHtmlNote,
    },
    {
      key: 'waitResponseType',
      n8nKey: 'responseType',
      label: 'Response Type',
      kind: 'select',
      value: 'approval',
      required: false,
      showWhen: waitCondition,
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
      showWhen: { ...waitCondition, waitResponseType: ['customForm'] },
      n8nShowWhen: {
        resource: ['email'],
        operation: ['sendAndWait'],
        responseType: ['customForm'],
      },
      options: [
        { label: 'Using Fields Below', value: 'fields' },
        { label: 'Using JSON', value: 'json' },
      ],
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
      showWhen: {
        ...waitCondition,
        waitResponseType: ['customForm'],
        waitCustomDefineForm: ['json'],
      },
      n8nShowWhen: {
        resource: ['email'],
        operation: ['sendAndWait'],
        responseType: ['customForm'],
        defineForm: ['json'],
      },
      hint:
        '<a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.form/" target="_blank">See docs</a> for field syntax',
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
      itemTitleExpression:
        '={{ $collection.item.properties.find(p => p.name === "fieldType").options.find(o => o.value === $collection.item.value.fieldType).name }}',
      sourceVersionCondition: '@version < 2.5',
      showWhen: {
        ...waitCondition,
        waitResponseType: ['customForm'],
        waitCustomDefineForm: ['fields'],
      },
      n8nShowWhen: {
        resource: ['email'],
        operation: ['sendAndWait'],
        responseType: ['customForm'],
        defineForm: ['fields'],
      },
      fields: waitCustomFormFields,
      simulationNote:
        'Form elements are editable metadata only. No response form is rendered or exposed.',
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
      showWhen: { ...waitCondition, waitResponseType: ['approval'] },
      n8nShowWhen: {
        resource: ['email'],
        operation: ['sendAndWait'],
        responseType: ['approval'],
      },
      fields: [
        {
          key: 'waitApprovalType',
          n8nKey: 'approvalType',
          label: 'Type of Approval',
          kind: 'select',
          value: 'single',
          required: false,
          addLabel: 'Add option',
          options: [
            { label: 'Approve Only', value: 'single' },
            { label: 'Approve and Disapprove', value: 'double' },
          ],
        },
        {
          key: 'waitApproveLabel',
          n8nKey: 'approveLabel',
          label: 'Approve Button Label',
          kind: 'text',
          value: 'Approve',
          required: false,
          showWhen: { waitApprovalType: ['single', 'double'] },
          n8nShowWhen: { approvalType: ['single', 'double'] },
        },
        {
          key: 'waitApproveStyle',
          n8nKey: 'buttonApprovalStyle',
          label: 'Approve Button Style',
          kind: 'select',
          value: 'primary',
          required: false,
          showWhen: { waitApprovalType: ['single', 'double'] },
          n8nShowWhen: { approvalType: ['single', 'double'] },
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
          ],
        },
        {
          key: 'waitDisapproveLabel',
          n8nKey: 'disapproveLabel',
          label: 'Disapprove Button Label',
          kind: 'text',
          value: 'Decline',
          required: false,
          showWhen: { waitApprovalType: ['double'] },
          n8nShowWhen: { approvalType: ['double'] },
        },
        {
          key: 'waitDisapproveStyle',
          n8nKey: 'buttonDisapprovalStyle',
          label: 'Disapprove Button Style',
          kind: 'select',
          value: 'secondary',
          required: false,
          showWhen: { waitApprovalType: ['double'] },
          n8nShowWhen: { approvalType: ['double'] },
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
          ],
        },
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
      showWhen: { ...waitCondition, waitResponseType: ['approval'] },
      n8nShowWhen: {
        resource: ['email'],
        operation: ['sendAndWait'],
        responseType: ['approval'],
      },
      fields: [
        makeLimitWaitTime('waitApprovalLimitWaitTime'),
        makeAppendAttribution('waitApprovalAppendAttribution'),
      ],
    },
    {
      key: 'waitFormResponseOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: {
        ...waitCondition,
        waitResponseType: ['freeText', 'customForm'],
      },
      n8nShowWhen: {
        resource: ['email'],
        operation: ['sendAndWait'],
        responseType: ['freeText', 'customForm'],
      },
      fields: [
        {
          key: 'waitMessageButtonLabel',
          n8nKey: 'messageButtonLabel',
          label: 'Message Button Label',
          kind: 'text',
          value: 'Respond',
          required: false,
        },
        {
          key: 'waitResponseFormTitle',
          n8nKey: 'responseFormTitle',
          label: 'Response Form Title',
          kind: 'text',
          value: '',
          required: false,
          description: 'Title of the form that the user can access to provide their response',
        },
        {
          key: 'waitResponseFormDescription',
          n8nKey: 'responseFormDescription',
          label: 'Response Form Description',
          kind: 'text',
          value: '',
          required: false,
          description:
            'Description of the form that the user can access to provide their response',
        },
        {
          key: 'waitResponseFormButtonLabel',
          n8nKey: 'responseFormButtonLabel',
          label: 'Response Form Button Label',
          kind: 'text',
          value: 'Submit',
          required: false,
        },
        {
          key: 'waitResponseFormCustomCss',
          n8nKey: 'responseFormCustomCss',
          label: 'Response Form Custom Styling',
          kind: 'textarea',
          sourceKind: 'string',
          value: DEFAULT_FORM_CSS,
          required: false,
          rows: 10,
          editor: 'cssEditor',
          description: 'Override default styling of the response form with CSS',
          simulationNote:
            'CSS is stored as inert authoring text and is never applied to a rendered page.',
        },
        makeLimitWaitTime('waitFormLimitWaitTime'),
        makeAppendAttribution('waitFormAppendAttribution'),
      ],
      simulationNote:
        'Response-form options never create a public form, button, callback URL, or waiting execution.',
    },
  ],
  operationParity: {
    expected: ['send', 'sendAndWait'],
    represented: operationOptions.map(({ value }) => value),
    default: 'send',
  },
  formatParity: {
    expected: ['text', 'html', 'both'],
    represented: emailFormatOptions.map(({ value }) => value),
    defaultForVersion2_1: 'html',
    priorVersion2Default: 'text',
  },
  docsSummary: {
    behavior: 'Sends email through an SMTP server.',
    waitingBehavior:
      'Send and Wait for Response normally pauses the workflow until the recipient responds.',
    recipientSyntax:
      'The official docs allow a display name and comma-separated recipient addresses in the string field.',
    threadingLimitation:
      'The node cannot set In-Reply-To or References headers, so each email is a new conversation.',
    attachmentSourceParity:
      'The pinned source separates inline and regular file attachment properties; both are represented.',
  },
  normalizationNotes: {
    addresses:
      'From, To, CC, BCC, and Reply To remain text controls because the pinned node defines strings, not an address collection. No collection normalization is applied.',
    html:
      'The Send HTML body is a five-row string, normalized only to textarea. Custom-form HTML uses n8n\'s htmlEditor but is also retained as an inert textarea.',
  },
  platformGaps: [
    'Repeated source names such as fromEmail, toEmail, subject, options, defaultValue, and fieldOptions use unique UI keys with n8nKey preserving the exact n8n parameter name.',
    'The current v2.1 Email Format control defaults to HTML; the sibling v2-only control defaults to Text and is recorded in formatParity rather than exposed twice.',
    'Shared custom-form controls are guarded by the parent node version. Send Email v2.1 therefore exposes the legacy pre-2.5 Form Elements surface, including the pre-2.3 Multiple Choice control.',
    'HTML, JSON, CSS, date-time, attachment, address, credential, webhook, and wait controls are authoring metadata only.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'text',
      sourceType: 'string with rows: 5',
      normalizedKind: 'textarea',
      reason: 'The catalog represents multiline text with its supported textarea control.',
    },
    {
      n8nKey: 'html',
      sourceType: 'string with rows: 5',
      normalizedKind: 'textarea',
      reason:
        'The Send HTML body is multiline source text; the simulation does not provide or invoke an HTML renderer.',
    },
    {
      n8nKey: 'jsonOutput',
      sourceType: 'json',
      normalizedKind: 'textarea',
      reason: 'The catalog retains the exact JSON default as inert multiline text.',
    },
    {
      n8nKey: 'formFields.values.html',
      sourceType: 'string with htmlEditor',
      normalizedKind: 'textarea',
      reason: 'The HTML editor is normalized to inert multiline text.',
    },
    {
      n8nKey: 'options.responseFormCustomCss',
      sourceType: 'string with cssEditor',
      normalizedKind: 'textarea',
      reason: 'The CSS editor is normalized to inert multiline text.',
    },
    {
      n8nKey: 'options.limitWaitTime.values.maxDateAndTime',
      sourceType: 'dateTime',
      normalizedKind: 'text',
      reason: 'Date-time authoring remains text and is never scheduled.',
    },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialTesting: false,
    authentication: false,
    smtpConnection: false,
    networkAccess: false,
    sendsEmail: false,
    readsAttachments: false,
    createsMimeMessages: false,
    rendersHtml: false,
    hostsForms: false,
    acceptsResponses: false,
    createsWaitWebhooks: false,
    createsTimers: false,
    waitsForResponse: false,
    resumesExecutions: false,
    workflowExecution: false,
    voice: false,
  },
  output: {},
};

export default sendEmail;
