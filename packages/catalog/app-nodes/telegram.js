// Editor-only descriptor for n8n's Telegram v1.2 action node.
// Credentials, Bot API calls, downloads, uploads, message mutation, rich-message
// parsing, webhooks, forms, waiting, expression execution, and tool execution stay inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This credential selector is locked. The simulation never creates, reads, tests, or applies Telegram credentials.';

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

const resourceOptions = [
  { label: 'Chat', value: 'chat' },
  { label: 'Callback', value: 'callback' },
  { label: 'File', value: 'file' },
  { label: 'Message', value: 'message' },
];

const chatOperations = [
  { label: 'Get', value: 'get', description: 'Get up to date information about a chat', action: 'Get a chat' },
  { label: 'Get Administrators', value: 'administrators', description: 'Get the Administrators of a chat', action: 'Get all administrators in a chat' },
  { label: 'Get Member', value: 'member', description: 'Get the member of a chat', action: 'Get a member in a chat' },
  { label: 'Leave', value: 'leave', description: 'Leave a group, supergroup or channel', action: 'Leave a chat' },
  { label: 'Set Description', value: 'setDescription', description: 'Set the description of a chat', action: 'Set description on a chat' },
  { label: 'Set Title', value: 'setTitle', description: 'Set the title of a chat', action: 'Set a title on a chat' },
];

const callbackOperations = [
  { label: 'Answer Query', value: 'answerQuery', description: 'Send answer to callback query sent from inline keyboard', action: 'Answer Query a callback' },
  { label: 'Answer Inline Query', value: 'answerInlineQuery', description: 'Send answer to callback query sent from inline bot', action: 'Answer an inline query callback' },
];

const fileOperations = [
  { label: 'Get', value: 'get', description: 'Get a file', action: 'Get a file' },
];

const messageOperations = [
  { label: 'Delete Chat Message', value: 'deleteMessage', description: 'Delete a chat message', action: 'Delete a chat message' },
  { label: 'Edit Message Text', value: 'editMessageText', description: 'Edit a text message', action: 'Edit a text message' },
  { label: 'Pin Chat Message', value: 'pinChatMessage', description: 'Pin a chat message', action: 'Pin a chat message' },
  { label: 'Send Animation', value: 'sendAnimation', description: 'Send an animated file', action: 'Send an animated file' },
  { label: 'Send Audio', value: 'sendAudio', description: 'Send a audio file', action: 'Send an audio file' },
  { label: 'Send Chat Action', value: 'sendChatAction', description: 'Send a chat action', action: 'Send a chat action' },
  { label: 'Send Document', value: 'sendDocument', description: 'Send a document', action: 'Send a document' },
  { label: 'Send Location', value: 'sendLocation', description: 'Send a location', action: 'Send a location' },
  { label: 'Send Media Group', value: 'sendMediaGroup', description: 'Send group of photos or videos to album', action: 'Send a media group message' },
  { label: 'Send Message', value: 'sendMessage', description: 'Send a text message', action: 'Send a text message' },
  { label: 'Send Message Draft', value: 'sendMessageDraft', description: 'Stream a partial message preview while it is being generated', action: 'Send a message draft' },
  { label: 'Send Rich Message', value: 'sendRichMessage', description: 'Send a richly formatted message with headings, lists, tables, media and more', action: 'Send a rich message' },
  { label: 'Send Rich Message Draft', value: 'sendRichMessageDraft', description: 'Stream a partial rich message preview while it is being generated', action: 'Send a rich message draft' },
  { label: 'Send and Wait for Response', value: 'sendAndWait', description: 'Send a message and wait for response', action: 'Send message and wait for response' },
  { label: 'Send Photo', value: 'sendPhoto', description: 'Send a photo', action: 'Send a photo message' },
  { label: 'Send Sticker', value: 'sendSticker', description: 'Send a sticker', action: 'Send a sticker' },
  { label: 'Send Video', value: 'sendVideo', description: 'Send a video', action: 'Send a video' },
  { label: 'Unpin Chat Message', value: 'unpinChatMessage', description: 'Unpin a chat message', action: 'Unpin a chat message' },
];

const parseModeOptions = [
  { label: 'Markdown (Legacy)', value: 'Markdown' },
  { label: 'MarkdownV2', value: 'MarkdownV2' },
  { label: 'HTML', value: 'HTML' },
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

const operationWhen = (resource, operation, uiExtra = {}, n8nExtra = {}) => {
  const operations = Array.isArray(operation) ? operation : [operation];
  return {
    showWhen: { resource: [resource], [`${resource}Operation`]: operations, ...uiExtra },
    n8nShowWhen: { resource: [resource], operation: operations, ...n8nExtra },
  };
};

const messageWhen = (operation, uiExtra = {}, n8nExtra = {}) =>
  operationWhen('message', operation, uiExtra, n8nExtra);

const field = (key, n8nKey, label, kind, value, visibility = {}, extra = {}) => ({
  key,
  n8nKey,
  label,
  kind,
  value,
  ...visibility,
  ...extra,
});

const textField = (key, n8nKey, label, value, visibility = {}, extra = {}) =>
  field(key, n8nKey, label, 'text', value, visibility, extra);

const booleanField = (key, n8nKey, label, value, visibility = {}, extra = {}) =>
  field(key, n8nKey, label, 'boolean', value, visibility, extra);

const numberField = (key, n8nKey, label, value, visibility = {}, extra = {}) =>
  field(key, n8nKey, label, 'number', value, visibility, extra);

const selectField = (key, n8nKey, label, value, options, visibility = {}, extra = {}) =>
  field(key, n8nKey, label, 'select', value, visibility, { options, ...extra });

const collection = (key, n8nKey, label, visibility, fields, addLabel = 'Add Field', extra = {}) => ({
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
  ...extra,
});

const fixedCollection = (
  key,
  n8nKey,
  label,
  visibility,
  fields,
  { collectionKey = 'values', collectionLabel = 'Values', multiple = true, addLabel = 'Add Item', value = {}, ...extra } = {},
) => ({
  key,
  n8nKey,
  label,
  kind: 'fixedCollection',
  sourceKind: 'fixedCollection',
  value,
  sourceDefault: value,
  collectionKey,
  collectionLabel,
  multiple,
  addLabel,
  fields,
  ...visibility,
  ...extra,
});

const makeChatId = (key, visibility) =>
  textField(key, 'chatId', 'Chat ID', '', visibility, {
    required: true,
    description: 'Unique identifier for the target chat or username, To find your chat ID ask @get_id_bot',
  });

const makeCallbackAdditionalFields = (prefix, operation) =>
  collection(`${prefix}AdditionalFields`, 'additionalFields', 'Additional Fields', operationWhen('callback', operation), [
    numberField(`${prefix}CacheTime`, 'cache_time', 'Cache Time', 0, {}, {
      min: 0,
      description: 'The maximum amount of time in seconds that the result of the callback query may be cached client-side',
    }),
    booleanField(`${prefix}ShowAlert`, 'show_alert', 'Show Alert', false, {}, {
      description: 'Whether an alert will be shown by the client instead of a notification at the top of the chat screen',
    }),
    textField(`${prefix}Text`, 'text', 'Text', '', {}, {
      description: 'Text of the notification. If not specified, nothing will be shown to the user, 0-200 characters.',
    }),
    textField(`${prefix}Url`, 'url', 'URL', '', {}, {
      description: "URL that will be opened by the user's client",
    }),
  ]);

const makeMediaGroup = () =>
  fixedCollection(
    'messageMediaGroupMedia',
    'media',
    'Media',
    messageWhen('sendMediaGroup'),
    [
      selectField('messageMediaGroupType', 'type', 'Type', 'photo', [
        { label: 'Photo', value: 'photo' },
        { label: 'Video', value: 'video' },
      ], {}, { description: 'The type of the media to add' }),
      textField('messageMediaGroupFile', 'media', 'Media File', '', {}, {
        description: 'Media to send. Pass a file_id or an HTTP URL for Telegram to retrieve.',
      }),
      collection('messageMediaGroupAdditionalFields', 'additionalFields', 'Additional Fields', {}, [
        textField('messageMediaGroupCaption', 'caption', 'Caption', '', {}, {
          description: 'Caption text to set, 0-1024 characters',
        }),
        selectField('messageMediaGroupParseMode', 'parse_mode', 'Parse Mode', 'HTML', parseModeOptions, {}, {
          description: 'How to parse the text',
        }),
      ]),
    ],
    {
      collectionKey: 'media',
      collectionLabel: 'Media',
      multiple: true,
      addLabel: 'Add Media',
      value: {},
      description: 'The media to add',
    },
  );

const makeWebAppCollection = (prefix) =>
  collection(`${prefix}WebApp`, 'web_app', 'Web App', {}, [
    textField(`${prefix}WebAppUrl`, 'url', 'URL', '', {}, {
      description: 'An HTTPS URL of a Web App to be opened',
    }),
  ], 'Set Telegram Web App URL', { multiple: false, description: 'Launch the Telegram Web App' });

const makeInlineKeyboard = (prefix, replyMarkupKey, operations) =>
  fixedCollection(
    `${prefix}InlineKeyboard`,
    'inlineKeyboard',
    'Inline Keyboard',
    messageWhen(operations, { [replyMarkupKey]: ['inlineKeyboard'] }),
    [
      fixedCollection(
        `${prefix}InlineKeyboardRow`,
        'row',
        'Row',
        {},
        [
          textField(`${prefix}InlineButtonText`, 'text', 'Text', '', {}, {
            description: 'Label text on the button',
          }),
          collection(`${prefix}InlineButtonAdditionalFields`, 'additionalFields', 'Additional Fields', {}, [
            textField(`${prefix}InlineCallbackData`, 'callback_data', 'Callback Data', '', {}, {
              description: 'Data to be sent in a callback query to the bot when button is pressed, 1-64 bytes',
            }),
            booleanField(`${prefix}InlinePay`, 'pay', 'Pay', false, {}, {
              description: 'Whether to send a Pay button',
            }),
            textField(`${prefix}InlineSwitchCurrent`, 'switch_inline_query_current_chat', 'Switch Inline Query Current Chat', '', {}, {
              description: "Insert the bot username and query in the current chat's input field",
            }),
            textField(`${prefix}InlineSwitch`, 'switch_inline_query', 'Switch Inline Query', '', {}, {
              description: 'Prompt the user to choose a chat and insert the bot username and query',
            }),
            textField(`${prefix}InlineUrl`, 'url', 'URL', '', {}, {
              description: 'HTTP or tg:// URL to be opened when button is pressed',
            }),
            makeWebAppCollection(`${prefix}Inline`),
          ]),
        ],
        { collectionKey: 'buttons', collectionLabel: 'Buttons', multiple: true, addLabel: 'Add Button', value: {} },
      ),
    ],
    {
      collectionKey: 'rows',
      collectionLabel: 'Rows',
      multiple: true,
      addLabel: 'Add Keyboard Row',
      value: {},
      description: 'Adds an inline keyboard that appears right next to the message it belongs to',
    },
  );

const makeReplyKeyboard = (replyMarkupKey, operations) =>
  fixedCollection(
    'messageReplyKeyboard',
    'replyKeyboard',
    'Reply Keyboard',
    messageWhen(operations, { [replyMarkupKey]: ['replyKeyboard'] }),
    [
      fixedCollection(
        'messageReplyKeyboardRow',
        'row',
        'Row',
        {},
        [
          textField('messageReplyButtonText', 'text', 'Text', '', {}, {
            description: 'Text sent as a message when the button is pressed if no optional field is used',
          }),
          collection('messageReplyButtonAdditionalFields', 'additionalFields', 'Additional Fields', {}, [
            booleanField('messageReplyRequestContact', 'request_contact', 'Request Contact', false, {}, {
              description: "Whether the user's phone number will be sent as a contact when the button is pressed",
            }),
            booleanField('messageReplyRequestLocation', 'request_location', 'Request Location', false, {}, {
              description: "Whether the user's location will be requested",
            }),
            makeWebAppCollection('messageReply'),
          ]),
        ],
        { collectionKey: 'buttons', collectionLabel: 'Buttons', multiple: true, addLabel: 'Add Button', value: {} },
      ),
    ],
    {
      collectionKey: 'rows',
      collectionLabel: 'Rows',
      multiple: true,
      addLabel: 'Add Reply Keyboard Row',
      value: {},
      description: 'Adds a custom keyboard with reply options',
    },
  );

const makeLimitWaitTime = (key) =>
  fixedCollection(
    key,
    'limitWaitTime',
    'Limit Wait Time',
    {},
    [
      selectField(`${key}LimitType`, 'limitType', 'Limit Type', 'afterTimeInterval', [
        { label: 'After Time Interval', value: 'afterTimeInterval', description: 'Waits for a certain amount of time' },
        { label: 'At Specified Time', value: 'atSpecifiedTime', description: 'Waits until the set date and time to continue' },
      ], {}, { description: 'Sets the condition for the execution to resume. Can be a specified date or after some time.' }),
      numberField(`${key}ResumeAmount`, 'resumeAmount', 'Amount', 1, {
        showWhen: { [`${key}LimitType`]: ['afterTimeInterval'] },
        n8nShowWhen: { limitType: ['afterTimeInterval'] },
      }, { min: 0, precision: 2, description: 'The time to wait' }),
      selectField(`${key}ResumeUnit`, 'resumeUnit', 'Unit', 'hours', [
        { label: 'Minutes', value: 'minutes' },
        { label: 'Hours', value: 'hours' },
        { label: 'Days', value: 'days' },
      ], {
        showWhen: { [`${key}LimitType`]: ['afterTimeInterval'] },
        n8nShowWhen: { limitType: ['afterTimeInterval'] },
      }, { description: 'Unit of the interval value' }),
      textField(`${key}MaxDateAndTime`, 'maxDateAndTime', 'Max Date and Time', '', {
        showWhen: { [`${key}LimitType`]: ['atSpecifiedTime'] },
        n8nShowWhen: { limitType: ['atSpecifiedTime'] },
      }, { sourceKind: 'dateTime', description: 'Continue execution after the specified date and time' }),
    ],
    {
      multiple: false,
      addLabel: 'Limit Wait Time',
      value: { values: { limitType: 'afterTimeInterval', resumeAmount: 45, resumeUnit: 'minutes' } },
      description: 'Whether to limit the time this node should wait for a user response before execution resumes',
      simulationNote: 'This collection never schedules or resumes an execution.',
    },
  );

const makeAppendAttribution = (key) =>
  booleanField(key, 'appendAttribution', 'Append n8n Attribution', true, {}, {
    description: 'Whether to include the phrase "This message was sent automatically with n8n" to the end of the message',
  });

const waitCustomFormFields = [
  textField('waitCustomFieldLabel', 'fieldLabel', 'Field Name', '', {
    showWhen: { waitCustomFieldType: formTypesWithLabels },
  }, {
    required: true,
    placeholder: 'e.g. What is your name?',
    n8nHideWhen: { fieldType: ['hiddenField', 'html'] },
    sourceVersionCondition: '@version < 2.4 (current for Telegram v1.2)',
    description: 'Label that appears above the input field',
  }),
  textField('waitCustomHiddenFieldName', 'fieldName', 'Field Name', '', {
    showWhen: { waitCustomFieldType: ['hiddenField'] },
    n8nShowWhen: { fieldType: ['hiddenField'] },
  }, {
    sourceVersionCondition: '@version < 2.4 (current for Telegram v1.2)',
    description: 'The name of the field, used in input attributes and referenced by the workflow',
  }),
  selectField('waitCustomFieldType', 'fieldType', 'Element Type', 'text', formElementTypes, {}, {
    required: true,
    description: 'The type of field to add to the form',
    builderHint: {
      propertyHint:
        "Valid values: text, number, email, textarea, dropdown, date, file, html, hiddenField, radio, checkbox, password. There is no time type.",
    },
  }),
  textField('waitCustomElementName', 'elementName', 'Element Name', '', {
    showWhen: { waitCustomFieldType: ['html'] },
    n8nShowWhen: { fieldType: ['html'] },
  }, {
    placeholder: 'e.g. content-section',
    description: 'Optional field. It can be used to include the html in the output.',
  }),
  textField('waitCustomPlaceholder', 'placeholder', 'Placeholder', '', {
    showWhen: { waitCustomFieldType: formTypesWithPlaceholders },
  }, {
    n8nHideWhen: { fieldType: ['dropdown', 'date', 'file', 'html', 'hiddenField', 'radio', 'checkbox'] },
    description: 'Sample text to display inside the field',
  }),
  textField('waitCustomDefaultText', 'defaultValue', 'Default Value', '', {
    showWhen: { waitCustomFieldType: ['text', 'number', 'email', 'textarea'] },
    n8nShowWhen: { fieldType: ['text', 'number', 'email', 'textarea'] },
  }, { description: 'Default value that will be pre-filled in the form field' }),
  textField('waitCustomDefaultDate', 'defaultValue', 'Default Value', '', {
    showWhen: { waitCustomFieldType: ['date'] },
    n8nShowWhen: { fieldType: ['date'] },
  }, {
    sourceKind: 'dateTime',
    inputType: 'date',
    dateOnly: true,
    description: 'Default date value that will be pre-filled in the form field (format: YYYY-MM-DD)',
  }),
  textField('waitCustomDefaultChoice', 'defaultValue', 'Default Value', '', {
    showWhen: { waitCustomFieldType: ['dropdown', 'radio'] },
    n8nShowWhen: { fieldType: ['dropdown', 'radio'] },
  }, { description: 'Default value that will be pre-selected. Must match one of the option labels.' }),
  textField('waitCustomDefaultCheckboxes', 'defaultValue', 'Default Value', '', {
    showWhen: { waitCustomFieldType: ['checkbox'] },
    n8nShowWhen: { fieldType: ['checkbox'] },
  }, {
    description: 'Default values that will be pre-selected. Separate multiple options with a comma.',
  }),
  textField('waitCustomFieldValue', 'fieldValue', 'Field Value', '', {
    showWhen: { waitCustomFieldType: ['hiddenField'] },
    n8nShowWhen: { fieldType: ['hiddenField'] },
  }, {
    description: 'Input value can be set here or passed as a query parameter via Field Name',
  }),
  fixedCollection(
    'waitCustomDropdownOptions',
    'fieldOptions',
    'Field Options',
    {
      showWhen: { waitCustomFieldType: ['dropdown'] },
      n8nShowWhen: { fieldType: ['dropdown'] },
    },
    [textField('waitCustomDropdownOption', 'option', 'Option', '')],
    {
      value: { values: [{ option: '' }] },
      collectionKey: 'values',
      collectionLabel: 'Values',
      multiple: true,
      sortable: true,
      addLabel: 'Add Field Option',
      required: true,
      description: 'List of options that can be selected from the dropdown',
    },
  ),
  fixedCollection(
    'waitCustomCheckboxOptions',
    'fieldOptions',
    'Checkboxes',
    {
      showWhen: { waitCustomFieldType: ['checkbox'] },
      n8nShowWhen: { fieldType: ['checkbox'] },
    },
    [textField('waitCustomCheckboxOption', 'option', 'Checkbox Label', '')],
    {
      value: { values: [{ option: '' }] },
      collectionKey: 'values',
      collectionLabel: 'Values',
      multiple: true,
      sortable: true,
      addLabel: 'Add Checkbox',
      required: true,
    },
  ),
  fixedCollection(
    'waitCustomRadioOptions',
    'fieldOptions',
    'Radio Buttons',
    {
      showWhen: { waitCustomFieldType: ['radio'] },
      n8nShowWhen: { fieldType: ['radio'] },
    },
    [textField('waitCustomRadioOption', 'option', 'Radio Button Label', '')],
    {
      value: { values: [{ option: '' }] },
      collectionKey: 'values',
      collectionLabel: 'Values',
      multiple: true,
      sortable: true,
      addLabel: 'Add Radio Button',
      required: true,
    },
  ),
  field(
    'waitCustomMultiselectLegacyNotice',
    'multiselectLegacyNotice',
    'Multiple Choice is a legacy option, please use Checkboxes or Radio Buttons field type instead',
    'notice',
    '',
    {
      showWhen: { waitCustomFieldType: ['dropdown'], waitCustomMultiselect: [true] },
      n8nShowWhen: { fieldType: ['dropdown'], multiselect: [true] },
    },
    { sourceVersionCondition: '@version < 2.3 (current for Telegram v1.2)' },
  ),
  booleanField('waitCustomMultiselect', 'multiselect', 'Multiple Choice', false, {
    showWhen: { waitCustomFieldType: ['dropdown'] },
    n8nShowWhen: { fieldType: ['dropdown'] },
  }, {
    sourceVersionCondition: '@version < 2.3 (current for Telegram v1.2)',
    description: 'Whether to allow the user to select multiple options from the dropdown list',
  }),
  selectField('waitCustomLimitSelection', 'limitSelection', 'Limit Selection', 'unlimited', [
    { label: 'Exact Number', value: 'exact' },
    { label: 'Range', value: 'range' },
    { label: 'Unlimited', value: 'unlimited' },
  ], {
    showWhen: { waitCustomFieldType: ['checkbox'] },
    n8nShowWhen: { fieldType: ['checkbox'] },
  }),
  numberField('waitCustomNumberOfSelections', 'numberOfSelections', 'Number of Selections', 1, {
    showWhen: { waitCustomFieldType: ['checkbox'], waitCustomLimitSelection: ['exact'] },
    n8nShowWhen: { fieldType: ['checkbox'], limitSelection: ['exact'] },
  }, { min: 1, precision: 0, showEvenWhenOptional: true }),
  numberField('waitCustomMinSelections', 'minSelections', 'Minimum Selections', 0, {
    showWhen: { waitCustomFieldType: ['checkbox'], waitCustomLimitSelection: ['range'] },
    n8nShowWhen: { fieldType: ['checkbox'], limitSelection: ['range'] },
  }, { min: 0, precision: 0, showEvenWhenOptional: true }),
  numberField('waitCustomMaxSelections', 'maxSelections', 'Maximum Selections', 1, {
    showWhen: { waitCustomFieldType: ['checkbox'], waitCustomLimitSelection: ['range'] },
    n8nShowWhen: { fieldType: ['checkbox'], limitSelection: ['range'] },
  }, { min: 1, precision: 0, showEvenWhenOptional: true }),
  field('waitCustomHtml', 'html', 'HTML', 'textarea', DEFAULT_CUSTOM_HTML, {
    showWhen: { waitCustomFieldType: ['html'] },
    n8nShowWhen: { fieldType: ['html'] },
  }, {
    sourceKind: 'string',
    editor: 'htmlEditor',
    noDataExpression: true,
    description: 'HTML elements to display on the form page',
    hint: 'Does not accept script, style, or input tags',
    simulationNote: 'HTML is retained as inert text and is never rendered or executed.',
  }),
  booleanField('waitCustomMultipleFiles', 'multipleFiles', 'Multiple Files', true, {
    showWhen: { waitCustomFieldType: ['file'] },
    n8nShowWhen: { fieldType: ['file'] },
  }, { description: 'Whether to allow the user to select multiple files from the file input or just one' }),
  textField('waitCustomAcceptFileTypes', 'acceptFileTypes', 'Accepted File Types', '', {
    showWhen: { waitCustomFieldType: ['file'] },
    n8nShowWhen: { fieldType: ['file'] },
  }, {
    placeholder: 'e.g. .jpg, .png',
    description: 'Comma-separated list of allowed file extensions',
    hint: 'Leave empty to allow all file types',
  }),
  field(
    'waitCustomFormatDateNotice',
    'formatDate',
    "The displayed date is formatted based on the locale of the user's browser",
    'notice',
    '',
    {
      showWhen: { waitCustomFieldType: ['date'] },
      n8nShowWhen: { fieldType: ['date'] },
    },
  ),
  booleanField('waitCustomRequiredField', 'requiredField', 'Required Field', false, {
    showWhen: { waitCustomFieldType: formTypesWithLabels },
  }, {
    n8nHideWhen: { fieldType: ['html', 'hiddenField'] },
    description: 'Whether to require the user to enter a value before submitting the form',
  }),
];

const sharedMessageAdditionalOperations = [
  'editMessageText',
  'sendAnimation',
  'sendAudio',
  'sendDocument',
  'sendLocation',
  'sendMessage',
  'sendMediaGroup',
  'sendPhoto',
  'sendSticker',
  'sendVideo',
];

const nonEditAdditionalOperations = sharedMessageAdditionalOperations.filter(
  (operation) => operation !== 'editMessageText',
);

const makeSharedMessageAdditionalFields = () =>
  collection(
    'messageAdditionalFields',
    'additionalFields',
    'Additional Fields',
    messageWhen(sharedMessageAdditionalOperations),
    [
      booleanField('messageAppendAttribution', 'appendAttribution', 'Append n8n Attribution', true, {
        showWhen: { messageOperation: ['sendMessage'] },
        n8nShowWhen: { '/operation': ['sendMessage'] },
      }, {
        description: 'Whether to include the phrase “This message was sent automatically with n8n” at the end',
      }),
      textField('messageCaption', 'caption', 'Caption', '', {
        showWhen: { messageOperation: ['sendAnimation', 'sendAudio', 'sendDocument', 'sendPhoto', 'sendVideo'] },
        n8nShowWhen: { '/operation': ['sendAnimation', 'sendAudio', 'sendDocument', 'sendPhoto', 'sendVideo'] },
      }, { description: 'Caption text to set, 0-1024 characters' }),
      booleanField('messageDisableNotification', 'disable_notification', 'Disable Notification', false, {
        showWhen: { messageOperation: nonEditAdditionalOperations },
        n8nHideWhen: { '/operation': ['editMessageText'] },
      }, { description: 'Whether to send the message silently' }),
      booleanField('messageDisableWebPagePreview', 'disable_web_page_preview', 'Disable WebPage Preview', false, {
        showWhen: { messageOperation: ['editMessageText', 'sendMessage'] },
        n8nShowWhen: { '/operation': ['editMessageText', 'sendMessage'] },
      }, { description: 'Whether to disable link previews for links in this message' }),
      numberField('messageDuration', 'duration', 'Duration', 0, {
        showWhen: { messageOperation: ['sendAnimation', 'sendAudio', 'sendVideo'] },
        n8nShowWhen: { '/operation': ['sendAnimation', 'sendAudio', 'sendVideo'] },
      }, { min: 0, description: 'Duration of clip in seconds' }),
      textField('messageFileName', 'fileName', 'File Name', '', {
        showWhen: {
          messageOperation: ['sendAnimation', 'sendAudio', 'sendDocument', 'sendPhoto', 'sendVideo', 'sendSticker'],
          messageBinaryData: [true],
        },
        n8nShowWhen: {
          '/operation': ['sendAnimation', 'sendAudio', 'sendDocument', 'sendPhoto', 'sendVideo', 'sendSticker'],
          '/resource': ['message'],
          '/binaryData': [true],
        },
      }, { placeholder: 'image.jpeg' }),
      numberField('messageHeight', 'height', 'Height', 0, {
        showWhen: { messageOperation: ['sendAnimation', 'sendVideo'] },
        n8nShowWhen: { '/operation': ['sendAnimation', 'sendVideo'] },
      }, { min: 0, description: 'Height of the video' }),
      selectField('messageParseMode', 'parse_mode', 'Parse Mode', 'HTML', parseModeOptions, {
        showWhen: {
          messageOperation: ['editMessageText', 'sendAnimation', 'sendAudio', 'sendMessage', 'sendPhoto', 'sendVideo', 'sendDocument'],
        },
        n8nShowWhen: {
          '/operation': ['editMessageText', 'sendAnimation', 'sendAudio', 'sendMessage', 'sendPhoto', 'sendVideo', 'sendDocument'],
        },
      }, { description: 'How to parse the text' }),
      textField('messagePerformer', 'performer', 'Performer', '', {
        showWhen: { messageOperation: ['sendAudio'] },
        n8nShowWhen: { '/operation': ['sendAudio'] },
      }, { description: 'Name of the performer' }),
      numberField('messageReplyToMessageId', 'reply_to_message_id', 'Reply To Message ID', 0, {
        showWhen: { messageOperation: nonEditAdditionalOperations },
        n8nHideWhen: { '/operation': ['editMessageText'] },
      }, { description: 'If the message is a reply, ID of the original message' }),
      numberField('messageThreadId', 'message_thread_id', 'Message Thread ID', 0, {
        showWhen: {
          messageOperation: ['sendAnimation', 'sendAudio', 'sendChatAction', 'sendDocument', 'sendLocation', 'sendMediaGroup', 'sendMessage', 'sendPhoto', 'sendSticker', 'sendVideo'],
        },
        n8nShowWhen: {
          '/operation': ['sendAnimation', 'sendAudio', 'sendChatAction', 'sendDocument', 'sendLocation', 'sendMediaGroup', 'sendMessage', 'sendPhoto', 'sendSticker', 'sendVideo'],
        },
      }, { description: 'The unique identifier of the forum topic' }),
      textField('messageAudioTitle', 'title', 'Title', '', {
        showWhen: { messageOperation: ['sendAudio'] },
        n8nShowWhen: { '/operation': ['sendAudio'] },
      }, { description: 'Title of the track' }),
      textField('messageThumbnail', 'thumb', 'Thumbnail', '', {
        showWhen: { messageOperation: ['sendAnimation', 'sendAudio', 'sendDocument', 'sendVideo'] },
        n8nShowWhen: { '/operation': ['sendAnimation', 'sendAudio', 'sendDocument', 'sendVideo'] },
      }, {
        description: 'JPEG thumbnail under 200 kB with width and height no more than 320',
      }),
      numberField('messageWidth', 'width', 'Width', 0, {
        showWhen: { messageOperation: ['sendAnimation', 'sendVideo'] },
        n8nShowWhen: { '/operation': ['sendAnimation', 'sendVideo'] },
      }, { min: 0, description: 'Width of the video' }),
    ],
  );

const messageChatOperations = [
  'deleteMessage',
  'pinChatMessage',
  'sendAnimation',
  'sendAudio',
  'sendChatAction',
  'sendDocument',
  'sendLocation',
  'sendMessage',
  'sendMessageDraft',
  'sendMediaGroup',
  'sendPhoto',
  'sendRichMessage',
  'sendRichMessageDraft',
  'sendSticker',
  'sendVideo',
  'unpinChatMessage',
];

const binaryOperations = [
  'sendAnimation',
  'sendAudio',
  'sendDocument',
  'sendPhoto',
  'sendVideo',
  'sendSticker',
];

const sendReplyMarkupOperations = [
  'sendAnimation',
  'sendDocument',
  'sendMessage',
  'sendPhoto',
  'sendRichMessage',
  'sendSticker',
  'sendVideo',
  'sendAudio',
  'sendLocation',
];

const credentialRequirements = [
  {
    type: 'telegramApi',
    name: 'Telegram API',
    required: true,
    inert: true,
    documentationUrl: 'telegram',
    sourcePath: 'packages/nodes-base/credentials/TelegramApi.credentials.ts',
    testedBy: 'GET /getMe',
    testExecuted: false,
    fields: [
      textField('telegramCredentialAccessToken', 'accessToken', 'Access Token', '', {}, {
        password: true,
        description: 'Chat with the bot father to obtain the access token',
      }),
      textField('telegramCredentialBaseUrl', 'baseUrl', 'Base URL', 'https://api.telegram.org', {}, {
        description: 'Base URL for Telegram Bot API',
      }),
    ],
  },
];

const telegram = {
  type: 'telegram',
  n8nType: 'n8n-nodes-base.telegram',
  n8nVersion: 1.2,
  defaultVersion: 1.2,
  versionHistory: [1, 1.1, 1.2],
  label: 'Telegram',
  defaultName: 'Telegram',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Sends data to Telegram',
  details: 'Manage Telegram chats, callbacks, files, messages, media, keyboards, drafts, rich messages, and human responses.',
  category: 'action',
  categories: ['Communication', 'HITL'],
  subcategory: 'Human in the Loop',
  subcategories: ['Human in the Loop'],
  group: ['output'],
  defaults: { name: 'Telegram' },
  inputs: ['main'],
  outputs: ['main'],
  portVariants: [{ inputs: ['main'], outputs: ['main'] }],
  usableAsTool: true,
  toolConnector: 'ai_tool',
  aiConnectorPorts: [],
  toolMetadata: {
    supportsAiParameters: true,
    humanInTheLoopReviewCapable: true,
    staticConnectorPort: false,
  },
  waitingNodeTooltip:
    '={{ ((parameters) => parameters?.operation === "sendAndWait" ? "Execution will continue after the user\'s response" : "")($parameter) }}',
  webhookMetadata: {
    inert: true,
    source: 'sendAndWaitWebhooksDescription',
    descriptions: [
      { name: 'default', httpMethod: 'GET', responseMode: 'onReceived', responseData: '', path: '={{ $nodeId }}', restartWebhook: true, isFullPath: true },
      { name: 'default', httpMethod: 'POST', responseMode: 'onReceived', responseData: '', path: '={{ $nodeId }}', restartWebhook: true, isFullPath: true },
    ],
  },
  icon: '/node-icons/telegram.svg',
  n8nIcon: 'file:telegram.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { viewBox: '0 0 66 66' },
  iconAssetSha256: '20080e9badcfd9cc37b2813ef9f07992490ae1f7fa5c5575f528d259de162efa',
  aliases: ['human', 'form', 'wait', 'hitl', 'approval'],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/',
  docsMarkdown: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram.md',
  operationDocs: {
    chat: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/chat-operations/',
    callback: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/callback-operations/',
    file: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/file-operations/',
    message: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/message-operations/',
  },
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/telegram/',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Telegram/Telegram.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Telegram/Telegram.node.json',
    helperPath: 'packages/nodes-base/nodes/Telegram/GenericFunctions.ts',
    hitlDescriptionPath: 'packages/nodes-base/nodes/Telegram/hitl/descriptions.ts',
    sendAndWaitPath: 'packages/nodes-base/utils/sendAndWait/utils.ts',
    sendAndWaitDescriptionPath: 'packages/nodes-base/utils/sendAndWait/descriptions.ts',
    formDescriptionPaths: [
      'packages/nodes-base/nodes/Form/Form.node.ts',
      'packages/nodes-base/nodes/Form/common.descriptions.ts',
      'packages/nodes-base/nodes/Form/cssVariables.ts',
    ],
    credentialPath: 'packages/nodes-base/credentials/TelegramApi.credentials.ts',
    iconPath: 'packages/nodes-base/nodes/Telegram/telegram.svg',
  },
  credentialRequirements,
  params: [
    {
      key: 'telegramCredential',
      n8nKey: 'credentials.telegramApi',
      label: 'Credential to connect with',
      kind: 'select',
      sourceKind: 'credentials',
      value: 'telegramApi',
      sourceDefault: '',
      required: true,
      locked: true,
      dynamic: true,
      options: [{ label: 'Telegram API', value: 'telegramApi' }],
      simulationNote: lockedCredentialNote,
    },
    selectField('resource', 'resource', 'Resource', 'message', resourceOptions, {}, { noDataExpression: true }),
    selectField('chatOperation', 'operation', 'Operation', 'get', chatOperations, {
      showWhen: { resource: ['chat'] },
      n8nShowWhen: { resource: ['chat'] },
    }, { noDataExpression: true }),
    selectField('callbackOperation', 'operation', 'Operation', 'answerQuery', callbackOperations, {
      showWhen: { resource: ['callback'] },
      n8nShowWhen: { resource: ['callback'] },
    }, { noDataExpression: true }),
    selectField('fileOperation', 'operation', 'Operation', 'get', fileOperations, {
      showWhen: { resource: ['file'] },
      n8nShowWhen: { resource: ['file'] },
    }, { noDataExpression: true }),
    selectField('messageOperation', 'operation', 'Operation', 'sendMessage', messageOperations, {
      showWhen: { resource: ['message'] },
      n8nShowWhen: { resource: ['message'] },
    }, { noDataExpression: true }),

    makeChatId('chatChatId', operationWhen('chat', chatOperations.map(({ value }) => value))),
    makeChatId('messageChatId', messageWhen(messageChatOperations)),
    textField('messageDeleteMessageId', 'messageId', 'Message ID', '', messageWhen('deleteMessage'), {
      required: true,
      description: 'Unique identifier of the message to delete',
    }),
    textField('messagePinMessageId', 'messageId', 'Message ID', '', messageWhen(['pinChatMessage', 'unpinChatMessage']), {
      required: true,
      description: 'Unique identifier of the message to pin or unpin',
    }),
    collection('messagePinAdditionalFields', 'additionalFields', 'Additional Fields', messageWhen('pinChatMessage'), [
      booleanField('messagePinDisableNotification', 'disable_notification', 'Disable Notification', false, {}, {
        description: 'Whether to send a notification to all chat members about the new pinned message',
      }),
    ]),
    textField('chatMemberUserId', 'userId', 'User ID', '', operationWhen('chat', 'member'), {
      required: true,
      description: 'Unique identifier of the target user',
    }),
    textField('chatSetDescription', 'description', 'Description', '', operationWhen('chat', 'setDescription'), {
      required: true,
      description: 'New chat description, 0-255 characters',
    }),
    textField('chatSetTitle', 'title', 'Title', '', operationWhen('chat', 'setTitle'), {
      required: true,
      description: 'New chat title, 1-255 characters',
    }),

    textField('callbackAnswerQueryId', 'queryId', 'Query ID', '', operationWhen('callback', 'answerQuery'), {
      required: true,
      description: 'Unique identifier for the query to be answered',
    }),
    makeCallbackAdditionalFields('callbackAnswerQuery', 'answerQuery'),
    textField('callbackAnswerInlineQueryId', 'queryId', 'Query ID', '', operationWhen('callback', 'answerInlineQuery'), {
      required: true,
      description: 'Unique identifier for the answered query',
    }),
    textField('callbackAnswerInlineResults', 'results', 'Results', '', operationWhen('callback', 'answerInlineQuery'), {
      required: true,
      sourceKind: 'string:json',
      description: 'A JSON-serialized array of results for the inline query',
      simulationNote: 'JSON remains inert text and is never parsed or submitted.',
    }),
    makeCallbackAdditionalFields('callbackAnswerInline', 'answerInlineQuery'),

    textField('fileGetFileId', 'fileId', 'File ID', '', operationWhen('file', 'get'), {
      required: true,
      description: 'The ID of the file',
    }),
    booleanField('fileGetDownload', 'download', 'Download', true, operationWhen('file', 'get'), {
      description: 'Whether to download the file',
    }),
    collection(
      'fileGetAdditionalFields',
      'additionalFields',
      'Additional Fields',
      operationWhen('file', 'get', { fileGetDownload: [true] }, { download: [true] }),
      [
        textField('fileGetMimeType', 'mimeType', 'MIME Type', '', {}, {
          placeholder: 'image/jpeg',
          description: 'MIME type of the file; otherwise derived from its extension',
        }),
      ],
    ),

    selectField('messageEditType', 'messageType', 'Message Type', 'message', [
      { label: 'Inline Message', value: 'inlineMessage' },
      { label: 'Message', value: 'message' },
    ], messageWhen('editMessageText'), { description: 'The type of the message to edit' }),
    makeChatId('messageEditChatId', messageWhen('editMessageText', { messageEditType: ['message'] }, { messageType: ['message'] })),
    booleanField('messageBinaryData', 'binaryData', 'Binary File', false, messageWhen(binaryOperations), {
      required: true,
      description: 'Whether the data to upload should be taken from binary field',
    }),
    textField(
      'messageBinaryPropertyName',
      'binaryPropertyName',
      'Input Binary Field',
      'data',
      messageWhen(binaryOperations, { messageBinaryData: [true] }, { binaryData: [true] }),
      {
        required: true,
        hint: 'The name of the input binary field containing the file to be written',
        description: 'Name of the binary property that contains the data to upload',
      },
    ),
    textField('messageEditMessageId', 'messageId', 'Message ID', '', messageWhen('editMessageText', { messageEditType: ['message'] }, { messageType: ['message'] }), {
      required: true,
      description: 'Unique identifier of the message to edit',
    }),
    textField('messageEditInlineMessageId', 'inlineMessageId', 'Inline Message ID', '', messageWhen('editMessageText', { messageEditType: ['inlineMessage'] }, { messageType: ['inlineMessage'] }), {
      required: true,
      description: 'Unique identifier of the inline message to edit',
    }),
    selectField('messageEditReplyMarkup', 'replyMarkup', 'Reply Markup', 'none', [
      { label: 'None', value: 'none' },
      { label: 'Inline Keyboard', value: 'inlineKeyboard' },
    ], messageWhen('editMessageText'), { description: 'Additional interface options' }),

    textField('messageSendAnimationFile', 'file', 'Animation', '', messageWhen('sendAnimation', { messageBinaryData: [false] }, { binaryData: [false] }), {
      description: 'Animation file_id or HTTP URL to send',
    }),
    textField('messageSendAudioFile', 'file', 'Audio', '', messageWhen('sendAudio', { messageBinaryData: [false] }, { binaryData: [false] }), {
      description: 'Audio file_id or HTTP URL to send',
    }),
    selectField('messageSendChatAction', 'action', 'Action', 'typing', [
      { label: 'Find Location', value: 'find_location', action: 'Find location' },
      { label: 'Record Audio', value: 'record_audio', action: 'Record audio' },
      { label: 'Record Video', value: 'record_video', action: 'Record video' },
      { label: 'Record Video Note', value: 'record_video_note', action: 'Record video note' },
      { label: 'Typing', value: 'typing', action: 'Typing a message' },
      { label: 'Upload Audio', value: 'upload_audio', action: 'Upload audio' },
      { label: 'Upload Document', value: 'upload_document', action: 'Upload document' },
      { label: 'Upload Photo', value: 'upload_photo', action: 'Upload photo' },
      { label: 'Upload Video', value: 'upload_video', action: 'Upload video' },
      { label: 'Upload Video Note', value: 'upload_video_note', action: 'Upload video note' },
    ], messageWhen('sendChatAction'), {
      description: 'Type of action to broadcast; Telegram displays it for 5 seconds or less',
    }),
    textField('messageSendDocumentFile', 'file', 'Document', '', messageWhen('sendDocument', { messageBinaryData: [false] }, { binaryData: [false] }), {
      description: 'Document file_id or HTTP URL to send',
    }),
    numberField('messageSendLatitude', 'latitude', 'Latitude', 0, messageWhen('sendLocation'), {
      min: -90,
      max: 90,
      precision: 10,
      description: 'Location latitude',
    }),
    numberField('messageSendLongitude', 'longitude', 'Longitude', 0, messageWhen('sendLocation'), {
      min: -180,
      max: 180,
      precision: 10,
      description: 'Location longitude',
    }),
    makeMediaGroup(),
    textField('messageText', 'text', 'Text', '', messageWhen(['editMessageText', 'sendMessage']), {
      required: true,
      description: 'Text of the message to be sent',
    }),
    textField('messageSendPhotoFile', 'file', 'Photo', '', messageWhen('sendPhoto', { messageBinaryData: [false] }, { binaryData: [false] }), {
      description: 'Photo file_id or HTTP URL to send',
    }),
    textField('messageSendStickerFile', 'file', 'Sticker', '', messageWhen('sendSticker', { messageBinaryData: [false] }, { binaryData: [false] }), {
      description: 'Sticker file_id or HTTP URL to send',
    }),
    textField('messageSendVideoFile', 'file', 'Video', '', messageWhen('sendVideo', { messageBinaryData: [false] }, { binaryData: [false] }), {
      description: 'Video file_id or HTTP URL to send',
    }),
    selectField('messageRichFormat', 'richFormat', 'Format', 'html', [
      { label: 'Markdown', value: 'markdown' },
      { label: 'HTML', value: 'html' },
    ], messageWhen(['sendRichMessage', 'sendRichMessageDraft']), {
      description: 'Which formatting syntax the rich message content uses',
    }),
    field('messageRichText', 'richMessageText', 'Rich Message', 'textarea', '', messageWhen(['sendRichMessage', 'sendRichMessageDraft']), {
      required: true,
      rows: 6,
      description: 'Rich Markdown or HTML message content',
      hint: 'Limits: up to 32768 characters, 500 blocks and 50 media attachments',
    }),
    selectField('messageReplyMarkup', 'replyMarkup', 'Reply Markup', 'none', [
      { label: 'Force Reply', value: 'forceReply' },
      { label: 'Inline Keyboard', value: 'inlineKeyboard' },
      { label: 'None', value: 'none' },
      { label: 'Reply Keyboard', value: 'replyKeyboard' },
      { label: 'Reply Keyboard Remove', value: 'replyKeyboardRemove' },
    ], messageWhen(sendReplyMarkupOperations), { description: 'Additional interface options' }),
    collection('messageForceReply', 'forceReply', 'Force Reply', messageWhen(sendReplyMarkupOperations, { messageReplyMarkup: ['forceReply'] }, { replyMarkup: ['forceReply'] }), [
      booleanField('messageForceReplyEnabled', 'force_reply', 'Force Reply', false, {}, {
        description: 'Whether to show the reply interface to the user',
      }),
      booleanField('messageForceReplySelective', 'selective', 'Selective', false, {}, {
        description: 'Whether to force reply from specific users only',
      }),
    ]),
    makeInlineKeyboard('messageEdit', 'messageEditReplyMarkup', ['editMessageText']),
    makeInlineKeyboard('messageSend', 'messageReplyMarkup', sendReplyMarkupOperations),
    makeReplyKeyboard('messageReplyMarkup', sendReplyMarkupOperations),
    collection('messageReplyKeyboardOptions', 'replyKeyboardOptions', 'Reply Keyboard Options', messageWhen(sendReplyMarkupOperations, { messageReplyMarkup: ['replyKeyboard'] }, { replyMarkup: ['replyKeyboard'] }), [
      booleanField('messageReplyKeyboardResize', 'resize_keyboard', 'Resize Keyboard', false, {}, {
        description: 'Whether to request clients to resize the keyboard vertically for optimal fit',
      }),
      booleanField('messageReplyKeyboardOneTime', 'one_time_keyboard', 'One Time Keyboard', false, {}, {
        description: 'Whether to request clients to hide the keyboard after it is used',
      }),
      booleanField('messageReplyKeyboardSelective', 'selective', 'Selective', false, {}, {
        description: 'Whether to show the keyboard to specific users only',
      }),
    ], 'Add option'),
    collection('messageReplyKeyboardRemove', 'replyKeyboardRemove', 'Reply Keyboard Remove', messageWhen(sendReplyMarkupOperations, { messageReplyMarkup: ['replyKeyboardRemove'] }, { replyMarkup: ['replyKeyboardRemove'] }), [
      booleanField('messageReplyKeyboardRemoveEnabled', 'remove_keyboard', 'Remove Keyboard', false, {}, {
        description: 'Whether to request clients to remove the custom keyboard',
      }),
      booleanField('messageReplyKeyboardRemoveSelective', 'selective', 'Selective', false, {}, {
        description: 'Whether to force reply from specific users only',
      }),
    ]),
    makeSharedMessageAdditionalFields(),

    numberField('messageDraftId', 'draftId', 'Draft ID', 1, messageWhen(['sendMessageDraft', 'sendRichMessageDraft']), {
      required: true,
      description: 'Non-zero identifier; updates with the same draft ID are animated',
    }),
    field('messageDraftText', 'text', 'Text', 'textarea', '', messageWhen('sendMessageDraft'), {
      rows: 5,
      description: 'Text of the message draft, 0-4096 characters',
    }),
    collection('messageDraftAdditionalFields', 'additionalFields', 'Additional Fields', messageWhen('sendMessageDraft'), [
      numberField('messageDraftThreadId', 'message_thread_id', 'Message Thread ID', 0, {}, {
        description: 'The unique identifier of the forum topic',
      }),
      selectField('messageDraftParseMode', 'parse_mode', 'Parse Mode', 'HTML', parseModeOptions, {}, {
        description: 'How to parse the text',
      }),
    ]),
    collection('messageRichAdditionalFields', 'additionalFields', 'Additional Fields', messageWhen(['sendRichMessage', 'sendRichMessageDraft']), [
      booleanField('messageRichDisableNotification', 'disable_notification', 'Disable Notification', false, {
        showWhen: { messageOperation: ['sendRichMessage'] },
        n8nShowWhen: { '/operation': ['sendRichMessage'] },
      }, { description: 'Whether to send the message silently' }),
      textField('messageRichEffectId', 'message_effect_id', 'Message Effect ID', '', {
        showWhen: { messageOperation: ['sendRichMessage'] },
        n8nShowWhen: { '/operation': ['sendRichMessage'] },
      }, { description: 'Unique message effect identifier for private chats' }),
      numberField('messageRichThreadId', 'message_thread_id', 'Message Thread ID', 0, {}, {
        description: 'The unique identifier of the forum topic',
      }),
      booleanField('messageRichProtectContent', 'protect_content', 'Protect Content', false, {
        showWhen: { messageOperation: ['sendRichMessage'] },
        n8nShowWhen: { '/operation': ['sendRichMessage'] },
      }, { description: 'Whether to protect the sent message from forwarding and saving' }),
      booleanField('messageRichRtl', 'is_rtl', 'Right-to-Left', false, {}, {
        description: 'Whether the rich message must be shown right-to-left',
      }),
      booleanField('messageRichSkipEntityDetection', 'skip_entity_detection', 'Skip Entity Detection', false, {}, {
        description: 'Whether to skip automatic URL, email, mention, hashtag, and phone detection',
      }),
    ]),

    makeChatId('messageWaitChatId', messageWhen('sendAndWait')),
    field('messageWaitMessage', 'message', 'Message', 'textarea', '', messageWhen('sendAndWait'), {
      required: true,
      rows: 4,
    }),
    selectField('messageWaitResponseType', 'responseType', 'Response Type', 'approval', responseTypeOptions, messageWhen('sendAndWait')),
    selectField('waitCustomDefineForm', 'defineForm', 'Define Form', 'fields', [
      { label: 'Using Fields Below', value: 'fields' },
      { label: 'Using JSON', value: 'json' },
    ], messageWhen('sendAndWait', { messageWaitResponseType: ['customForm'] }, { responseType: ['customForm'] }), {
      noDataExpression: true,
    }),
    field('waitCustomJsonOutput', 'jsonOutput', 'Form Fields', 'textarea', DEFAULT_FORM_JSON, messageWhen('sendAndWait', {
      messageWaitResponseType: ['customForm'],
      waitCustomDefineForm: ['json'],
    }, { responseType: ['customForm'], defineForm: ['json'] }), {
      sourceKind: 'json',
      rows: 5,
      validateType: 'form-fields',
      ignoreValidationDuringExecution: true,
      simulationNote: 'JSON remains unparsed authoring text and cannot create a form.',
    }),
    fixedCollection(
      'waitCustomFormElements',
      'formFields',
      'Form Elements',
      messageWhen('sendAndWait', {
        messageWaitResponseType: ['customForm'],
        waitCustomDefineForm: ['fields'],
      }, { responseType: ['customForm'], defineForm: ['fields'] }),
      waitCustomFormFields,
      {
        collectionKey: 'values',
        collectionLabel: 'Values',
        multiple: true,
        sortable: true,
        addLabel: 'Add Form Element',
        value: {},
        sourceVersionCondition: '@version < 2.5 (current for Telegram v1.2)',
        simulationNote: 'Form elements are editable metadata only; no form is rendered or exposed.',
      },
    ),
    fixedCollection(
      'waitApprovalOptions',
      'approvalOptions',
      'Approval Options',
      messageWhen('sendAndWait', { messageWaitResponseType: ['approval'] }, { responseType: ['approval'] }),
      [
        selectField('waitApprovalType', 'approvalType', 'Type of Approval', 'single', [
          { label: 'Approve Only', value: 'single' },
          { label: 'Approve and Disapprove', value: 'double' },
        ]),
        textField('waitApproveLabel', 'approveLabel', 'Approve Button Label', '✅ Approve', {
          showWhen: { waitApprovalType: ['single', 'double'] },
          n8nShowWhen: { approvalType: ['single', 'double'] },
        }),
        textField('waitDisapproveLabel', 'disapproveLabel', 'Disapprove Button Label', '❌ Decline', {
          showWhen: { waitApprovalType: ['double'] },
          n8nShowWhen: { approvalType: ['double'] },
        }),
      ],
      { multiple: false, addLabel: 'Add option', value: {} },
    ),
    field(
      'waitAdvancedInteractivityNotice',
      'advancedInteractivityNotice',
      'Advanced Interactivity',
      'notice',
      '',
      messageWhen('sendAndWait', { messageWaitResponseType: ['approval'] }, { responseType: ['approval'] }),
      { sectionHeader: true },
    ),
    booleanField('waitChatApproval', 'chatApproval', 'Approve Within Chat', false, messageWhen('sendAndWait', {
      messageWaitResponseType: ['approval'],
    }, { responseType: ['approval'] }), {
      description: 'Whether approvers respond with one tap inside Telegram instead of opening a browser link',
    }),
    textField('waitApproverIds', 'approverIds', 'Restrict Who Can Approve', '', messageWhen('sendAndWait', {
      messageWaitResponseType: ['approval'],
      waitChatApproval: [true],
    }, { responseType: ['approval'], chatApproval: [true] }), {
      description: 'Comma-separated Telegram user IDs allowed to approve or decline',
    }),
    textField('waitUnauthorizedReplyText', 'unauthorizedReplyText', 'Unauthorized Reply', 'You are not authorized to respond to this request.', messageWhen('sendAndWait', {
      messageWaitResponseType: ['approval'],
      waitChatApproval: [true],
    }, { responseType: ['approval'], chatApproval: [true] }), {
      description: 'Popup shown to unauthorized users',
    }),
    selectField('waitPostDecisionBehavior', 'postDecisionBehavior', 'After Decision', 'showOutcome', [
      { label: 'Show Outcome and Remove Buttons', value: 'showOutcome' },
      { label: 'Remove Buttons Only', value: 'removeButtons' },
      { label: 'Keep Message Unchanged', value: 'keepMessage' },
    ], messageWhen('sendAndWait', {
      messageWaitResponseType: ['approval'],
      waitChatApproval: [true],
    }, { responseType: ['approval'], chatApproval: [true] })),
    collection('waitApprovalResponseOptions', 'options', 'Options', messageWhen('sendAndWait', {
      messageWaitResponseType: ['approval'],
    }, { responseType: ['approval'] }), [
      makeLimitWaitTime('waitApprovalLimitWaitTime'),
      makeAppendAttribution('waitApprovalAppendAttribution'),
    ], 'Add option'),
    collection('waitFormResponseOptions', 'options', 'Options', messageWhen('sendAndWait', {
      messageWaitResponseType: ['freeText', 'customForm'],
    }, { responseType: ['freeText', 'customForm'] }), [
      textField('waitMessageButtonLabel', 'messageButtonLabel', 'Message Button Label', 'Respond'),
      textField('waitResponseFormTitle', 'responseFormTitle', 'Response Form Title', '', {}, {
        description: 'Title of the response form',
      }),
      textField('waitResponseFormDescription', 'responseFormDescription', 'Response Form Description', '', {}, {
        description: 'Description of the response form',
      }),
      textField('waitResponseFormButtonLabel', 'responseFormButtonLabel', 'Response Form Button Label', 'Submit'),
      field('waitResponseFormCustomCss', 'responseFormCustomCss', 'Response Form Custom Styling', 'textarea', DEFAULT_FORM_CSS, {}, {
        sourceKind: 'string',
        rows: 10,
        editor: 'cssEditor',
        description: 'Override default styling of the response form with CSS',
        simulationNote: 'CSS remains inert text and is never applied.',
      }),
      makeLimitWaitTime('waitFormLimitWaitTime'),
      makeAppendAttribution('waitFormAppendAttribution'),
    ], 'Add option', {
      simulationNote: 'No public form, callback URL, webhook, or waiting execution is created.',
    }),
  ],
  resources: [
    { value: 'chat', defaultOperation: 'get', operations: chatOperations.map(({ value }) => value) },
    { value: 'callback', defaultOperation: 'answerQuery', operations: callbackOperations.map(({ value }) => value) },
    { value: 'file', defaultOperation: 'get', operations: fileOperations.map(({ value }) => value) },
    { value: 'message', defaultOperation: 'sendMessage', operations: messageOperations.map(({ value }) => value) },
  ],
  resourceOperationParity: {
    chat: { expected: ['get', 'administrators', 'member', 'leave', 'setDescription', 'setTitle'], represented: chatOperations.map(({ value }) => value), default: 'get' },
    callback: { expected: ['answerQuery', 'answerInlineQuery'], represented: callbackOperations.map(({ value }) => value), default: 'answerQuery' },
    file: { expected: ['get'], represented: fileOperations.map(({ value }) => value), default: 'get' },
    message: {
      expected: ['deleteMessage', 'editMessageText', 'pinChatMessage', 'sendAnimation', 'sendAudio', 'sendChatAction', 'sendDocument', 'sendLocation', 'sendMediaGroup', 'sendMessage', 'sendMessageDraft', 'sendRichMessage', 'sendRichMessageDraft', 'sendAndWait', 'sendPhoto', 'sendSticker', 'sendVideo', 'unpinChatMessage'],
      represented: messageOperations.map(({ value }) => value),
      default: 'sendMessage',
    },
  },
  operationCount: 27,
  docsSummary: {
    operations: {
      chat: chatOperations.map(({ value }) => value),
      callback: callbackOperations.map(({ value }) => value),
      file: fileOperations.map(({ value }) => value),
      message: messageOperations.map(({ value }) => value),
    },
    aiToolDocumented: true,
    humanInTheLoopDocumented: true,
    relatedTrigger: 'n8n-nodes-base.telegramTrigger',
  },
  currentVersionScope: {
    represented: 1.2,
    excluded: [
      { resource: 'bot', operation: 'info', reason: 'Commented-out, non-live implementation' },
      { n8nKey: 'subject', operation: 'sendAndWait', reason: 'Explicitly filtered from generated Telegram properties' },
      { n8nKey: 'formFields', versions: '>= 2.5', reason: 'Historical future-version variant is not active for Telegram v1.2' },
      { nodeType: 'n8n-nodes-base.telegramTrigger', reason: 'Trigger is out of action-node scope' },
    ],
  },
  lookupMetadata: {},
  platformGaps: [
    'Repeated native parameter names are assigned unique UI keys while n8nKey preserves the source name. Shared chat and inline-keyboard fields are split by live branch so conditional rendering remains deterministic.',
    'Binary field names, URLs, file IDs, MIME types, captions, and media metadata are authorable, but no file is read, downloaded, buffered, uploaded, or fetched.',
    'JSON, Markdown, HTML, rich-message, and CSS values remain inert text. They are never parsed, rendered, validated against Telegram, or executed.',
    'Reply and inline keyboards preserve their nested fixedCollection shapes, including Web App fields, without creating callbacks, buttons, payment actions, or web apps.',
    'Send and Wait preserves the current Telegram v1.2 approval, chat approval, legacy form-element, response-form, timeout, and attribution settings. No webhook, form, wait state, or execution resume is created.',
    'The credential selector and credential fields are locked metadata. Access-token testing against getMe and all Bot API authentication are disabled.',
    'usableAsTool is preserved as capability metadata; the action node has no static ai_tool connector port and cannot execute as a tool.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'results/jsonOutput', sourceType: 'JSON/string', normalizedKind: 'text or textarea', reason: 'JSON remains unparsed inert text.' },
    { n8nKey: 'formFields.values.html/options.responseFormCustomCss', sourceType: 'HTML/CSS editor', normalizedKind: 'textarea', reason: 'HTML and CSS are never rendered or executed.' },
    { n8nKey: 'limitWaitTime.values.maxDateAndTime/formFields.values.defaultValue', sourceType: 'dateTime', normalizedKind: 'text', reason: 'Date values remain inert authoring text.' },
    { n8nKey: 'binaryPropertyName/file/media/thumb', sourceType: 'binary/remote media input', normalizedKind: 'text', reason: 'Binary and remote media access are disabled.' },
    { n8nKey: 'credentials.telegramApi', sourceType: 'credentials', normalizedKind: 'locked select', reason: 'Credential discovery and testing are unavailable.' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    authentication: false,
    apiRequests: false,
    networkAccess: false,
    downloads: false,
    binaryRead: false,
    buffering: false,
    uploads: false,
    callbackAnswers: false,
    chatMutation: false,
    messageSend: false,
    messageEdit: false,
    messageDelete: false,
    messagePinning: false,
    draftStreaming: false,
    richMessageParsing: false,
    expressionExecution: false,
    jsonParsing: false,
    htmlRendering: false,
    cssApplication: false,
    keyboardCreation: false,
    webAppLaunch: false,
    paymentActions: false,
    webhookRegistration: false,
    webhookHandling: false,
    formHosting: false,
    waiting: false,
    executionResume: false,
    attendeeApproval: false,
    toolExecution: false,
    voice: false,
  },
  output: {},
};

export default telegram;
