// Editor-only descriptor for n8n Form Trigger v2.6. It models the complete
// authoring surface without hosting a form, accepting submissions, or authenticating.

const DEFAULT_CUSTOM_HTML = `<!-- Your custom HTML here --->


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

const authenticationHint =
  "Default to 'none'. n8n exposes inbound trigger URLs publicly by design. Only select an authentication method when the user explicitly asks to authenticate inbound traffic.";

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

const fieldTypesWithLabels = [
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

const fieldTypesWithCustomNames = [
  'checkbox',
  'date',
  'dropdown',
  'email',
  'file',
  'hiddenField',
  'number',
  'password',
  'radio',
  'text',
  'textarea',
];

const fieldTypesWithPlaceholders = ['email', 'number', 'password', 'text', 'textarea'];

const formTrigger = {
  type: 'form-trigger',
  n8nType: 'n8n-nodes-base.formTrigger',
  n8nVersion: 2.6,
  versionHistory: [1, 2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6],
  label: 'n8n Form Trigger',
  subtitle: '',
  description: 'Generate webforms in n8n and pass their responses to the workflow',
  category: 'trigger',
  categories: ['Core Nodes'],
  subcategory: 'Other Trigger Nodes',
  group: ['trigger'],
  inputs: [],
  outputs: ['main'],
  icon: '/node-icons/form-trigger.svg',
  n8nIcon: 'node:form-trigger',
  iconColor: 'teal',
  iconHex: '#00B7BC',
  aliases: ['table', 'submit', 'post'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.formtrigger/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Form/FormTrigger.node.ts',
    versionPath: 'packages/nodes-base/nodes/Form/v2/FormTriggerV2.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Form/FormTrigger.node.json',
    parameterPaths: [
      'packages/nodes-base/nodes/Form/common.descriptions.ts',
      'packages/nodes-base/nodes/Form/cssVariables.ts',
      'packages/nodes-base/nodes/Form/interfaces.ts',
      'packages/nodes-base/utils/descriptions.ts',
    ],
    credentialPath: 'packages/nodes-base/credentials/HttpBasicAuth.credentials.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/form-trigger.svg',
  },
  defaults: { name: 'On form submission' },
  builderHint: {
    relatedNodes: [
      {
        nodeType: 'n8n-nodes-base.form',
        relationHint: 'Add pages and final page to the form',
      },
    ],
  },
  eventTriggerDescription: 'Waiting for you to submit the form',
  activationMessage: 'You can now make calls to your production Form URL.',
  triggerPanel: {
    header: 'Pull in a test form submission',
    executionsHelp: {
      inactive:
        "Form Trigger has two modes: test and production. <br /> <br /> <b>Use test mode while you build your workflow</b>. Click the 'Execute step' button, then fill out the test form that opens in a popup tab. The executions will show up in the editor.<br /> <br /> <b>Use production mode to run your workflow automatically</b>. Publish the workflow, then make requests to the production URL. Then every time there's a form submission via the Production Form URL, the workflow will execute. These executions will show up in the executions list, but not in the editor.",
      active:
        "Form Trigger has two modes: test and production. <br /> <br /> <b>Use test mode while you build your workflow</b>. Click the 'Execute step' button, then fill out the test form that opens in a popup tab. The executions will show up in the editor.<br /> <br /> <b>Use production mode to run your workflow automatically</b>. Publish the workflow, then make requests to the production URL. Then every time there's a form submission via the Production Form URL, the workflow will execute. These executions will show up in the executions list, but not in the editor.",
    },
    activationHint: {
      active:
        "This node will also trigger automatically on new form submissions (but those executions won't show up here).",
      inactive:
        'Publish this workflow to have it also run automatically for new form submissions created via the Production URL.',
    },
  },
  webhooks: [
    {
      name: 'setup',
      method: 'GET',
      responseMode: 'onReceived',
      fullPath: true,
      path: '={{ $parameter["path"] || $parameter["options"]?.path || $webhookId }}',
      hideUrlInNdv: true,
      nodeType: 'form',
    },
    {
      name: 'default',
      method: 'POST',
      responseMode: '={{$parameter["responseMode"]}}',
      responseData:
        '={{$parameter["responseMode"] === "lastNode" ? "noData" : undefined}}',
      fullPath: true,
      path: '={{ $parameter["path"] || $parameter["options"]?.path || $webhookId }}',
      hideMethodInNdv: true,
      nodeType: 'form',
    },
  ],
  sensitiveOutputFields: ['headers.authorization', 'headers.cookie', 'headers.x-auth-token'],
  credentialRequirements: [
    {
      type: 'httpBasicAuth',
      name: 'Basic Auth',
      required: true,
      showWhen: { authentication: ['basicAuth'] },
    },
  ],
  params: [
    {
      key: 'authentication',
      label: 'Authentication',
      kind: 'select',
      value: 'none',
      required: false,
      builderHint: { propertyHint: authenticationHint },
      options: [
        { label: 'Basic Auth', value: 'basicAuth' },
        {
          label: 'n8n User Auth',
          value: 'n8nUserAuth',
          description: 'Require user to be logged in with their n8n account',
        },
        { label: 'None', value: 'none' },
      ],
    },
    {
      key: 'basicAuthCredential',
      n8nKey: 'credentials.httpBasicAuth',
      label: 'Credential to connect with',
      kind: 'select',
      value: 'httpBasicAuth',
      required: true,
      locked: true,
      showWhen: { authentication: ['basicAuth'] },
      options: [{ label: 'Basic Auth', value: 'httpBasicAuth' }],
    },
    {
      key: 'requireExecuteAccess',
      label: 'Require Workflow Execute Permission',
      kind: 'boolean',
      value: false,
      required: false,
      envFeatureFlag: 'FORM_TRIGGER_OAUTH2',
      showWhen: { authentication: ['n8nUserAuth'] },
      description:
        'Whether the triggering user must also have permission to execute the workflow in the project it belongs to',
    },
    {
      key: 'formTitle',
      label: 'Form Title',
      kind: 'text',
      value: '',
      required: true,
      placeholder: 'e.g. Contact us',
      description: 'Shown at the top of the form',
    },
    {
      key: 'formDescription',
      label: 'Form Description',
      kind: 'textarea',
      value: '',
      required: false,
      rows: 2,
      placeholder: "e.g. We'll get back to you soon",
      description:
        'Shown underneath the Form Title. Can be used to prompt the user on how to complete the form. Accepts HTML. Does not accept <code>&lt;script&gt;</code>, <code>&lt;style&gt;</code> or <code>&lt;input&gt;</code> tags.',
    },
    {
      key: 'formFields',
      label: 'Form Elements',
      kind: 'fixedCollection',
      value: {},
      collectionKey: 'values',
      collectionLabel: 'Values',
      multiple: true,
      sortable: true,
      addLabel: 'Add Form Element',
      hideOptionalFields: true,
      addOptionalFieldLabel: 'Add Attributes',
      itemTitleExpression:
        '={{ $collection.item.properties.find(p => p.name === "fieldType").options.find(o => o.value === $collection.item.value.fieldType).name }}',
      required: false,
      fields: [
        {
          key: 'fieldLabel',
          label: 'Label',
          kind: 'text',
          value: '',
          required: true,
          placeholder: 'e.g. What is your name?',
          description: 'Label that appears above the input field',
          showWhen: { fieldType: fieldTypesWithLabels },
          n8nHideWhen: { fieldType: ['hiddenField', 'html'] },
        },
        {
          key: 'fieldType',
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
          key: 'elementName',
          label: 'Element Name',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. content-section',
          showWhen: { fieldType: ['html'] },
          description: 'Optional field. It can be used to include the html in the output.',
        },
        {
          key: 'fieldName',
          label: 'Custom Field Name',
          kind: 'text',
          value: '',
          required: false,
          showWhen: { fieldType: fieldTypesWithCustomNames },
          n8nHideWhen: { fieldType: ['html'] },
          description:
            'The name of the field, used in input attributes and referenced by the workflow',
        },
        {
          key: 'placeholder',
          label: 'Placeholder',
          kind: 'text',
          value: '',
          required: false,
          showWhen: { fieldType: fieldTypesWithPlaceholders },
          n8nHideWhen: {
            fieldType: ['dropdown', 'date', 'file', 'html', 'hiddenField', 'radio', 'checkbox'],
          },
          description: 'Sample text to display inside the field',
        },
        {
          key: 'defaultValueText',
          n8nKey: 'defaultValue',
          label: 'Default Value',
          kind: 'text',
          value: '',
          required: false,
          showWhen: { fieldType: ['text', 'number', 'email', 'textarea'] },
          description: 'Default value that will be pre-filled in the form field',
        },
        {
          key: 'defaultValueDate',
          n8nKey: 'defaultValue',
          label: 'Default Value',
          kind: 'text',
          sourceKind: 'dateTime',
          inputType: 'date',
          dateOnly: true,
          value: '',
          required: false,
          showWhen: { fieldType: ['date'] },
          description:
            'Default date value that will be pre-filled in the form field (format: YYYY-MM-DD)',
        },
        {
          key: 'defaultValueChoice',
          n8nKey: 'defaultValue',
          label: 'Default Value',
          kind: 'text',
          value: '',
          required: false,
          showWhen: { fieldType: ['dropdown', 'radio'] },
          description:
            'Default value that will be pre-selected. Must match one of the option labels.',
        },
        {
          key: 'defaultValueCheckboxes',
          n8nKey: 'defaultValue',
          label: 'Default Value',
          kind: 'text',
          value: '',
          required: false,
          showWhen: { fieldType: ['checkbox'] },
          description:
            'Default value(s) that will be pre-selected. Must match one or multiple of the option labels. Separate multiple pre-selected options with a comma.',
        },
        {
          key: 'fieldValue',
          label: 'Field Value',
          kind: 'text',
          value: '',
          required: false,
          showWhen: { fieldType: ['hiddenField'] },
          description:
            'Input value can be set here or will be passed as a query parameter via Field Name if no value is set',
        },
        {
          key: 'dropdownOptions',
          n8nKey: 'fieldOptions',
          label: 'Field Options',
          kind: 'fixedCollection',
          value: { values: [{ option: '' }] },
          collectionKey: 'values',
          collectionLabel: 'Values',
          multiple: true,
          sortable: true,
          addLabel: 'Add Field Option',
          required: true,
          showWhen: { fieldType: ['dropdown'] },
          description: 'List of options that can be selected from the dropdown',
          fields: [
            { key: 'option', label: 'Option', kind: 'text', value: '', required: false },
          ],
        },
        {
          key: 'checkboxOptions',
          n8nKey: 'fieldOptions',
          label: 'Checkboxes',
          kind: 'fixedCollection',
          value: { values: [{ option: '' }] },
          collectionKey: 'values',
          collectionLabel: 'Values',
          multiple: true,
          sortable: true,
          addLabel: 'Add Checkbox',
          required: true,
          showWhen: { fieldType: ['checkbox'] },
          fields: [
            {
              key: 'option',
              label: 'Checkbox Label',
              kind: 'text',
              value: '',
              required: false,
            },
          ],
        },
        {
          key: 'radioOptions',
          n8nKey: 'fieldOptions',
          label: 'Radio Buttons',
          kind: 'fixedCollection',
          value: { values: [{ option: '' }] },
          collectionKey: 'values',
          collectionLabel: 'Values',
          multiple: true,
          sortable: true,
          addLabel: 'Add Radio Button',
          required: true,
          showWhen: { fieldType: ['radio'] },
          fields: [
            {
              key: 'option',
              label: 'Radio Button Label',
              kind: 'text',
              value: '',
              required: false,
            },
          ],
        },
        {
          key: 'limitSelection',
          label: 'Limit Selection',
          kind: 'select',
          value: 'unlimited',
          required: false,
          showWhen: { fieldType: ['checkbox'] },
          options: [
            { label: 'Exact Number', value: 'exact' },
            { label: 'Range', value: 'range' },
            { label: 'Unlimited', value: 'unlimited' },
          ],
        },
        {
          key: 'numberOfSelections',
          label: 'Number of Selections',
          kind: 'number',
          value: 1,
          required: false,
          min: 1,
          precision: 0,
          showEvenWhenOptional: true,
          showWhen: { fieldType: ['checkbox'], limitSelection: ['exact'] },
        },
        {
          key: 'minSelections',
          label: 'Minimum Selections',
          kind: 'number',
          value: 0,
          required: false,
          min: 0,
          precision: 0,
          showEvenWhenOptional: true,
          showWhen: { fieldType: ['checkbox'], limitSelection: ['range'] },
        },
        {
          key: 'maxSelections',
          label: 'Maximum Selections',
          kind: 'number',
          value: 1,
          required: false,
          min: 1,
          precision: 0,
          showEvenWhenOptional: true,
          showWhen: { fieldType: ['checkbox'], limitSelection: ['range'] },
        },
        {
          key: 'html',
          label: 'HTML',
          kind: 'textarea',
          value: DEFAULT_CUSTOM_HTML,
          required: false,
          editor: 'htmlEditor',
          noDataExpression: true,
          showWhen: { fieldType: ['html'] },
          description: 'HTML elements to display on the form page',
          hint: 'Does not accept <code>&lt;script&gt;</code>, <code>&lt;style&gt;</code> or <code>&lt;input&gt;</code> tags',
        },
        {
          key: 'multipleFiles',
          label: 'Multiple Files',
          kind: 'boolean',
          value: true,
          required: false,
          showWhen: { fieldType: ['file'] },
          description:
            'Whether to allow the user to select multiple files from the file input or just one',
        },
        {
          key: 'acceptFileTypes',
          label: 'Accepted File Types',
          kind: 'text',
          value: '',
          required: false,
          showWhen: { fieldType: ['file'] },
          placeholder: 'e.g. .jpg, .png',
          description: 'Comma-separated list of allowed file extensions',
          hint: 'Leave empty to allow all file types',
        },
        {
          key: 'formatDate',
          label: "The displayed date is formatted based on the locale of the user's browser",
          kind: 'notice',
          value: '',
          required: false,
          showWhen: { fieldType: ['date'] },
        },
        {
          key: 'requiredField',
          label: 'Required Field',
          kind: 'boolean',
          value: false,
          required: false,
          showWhen: { fieldType: fieldTypesWithLabels },
          n8nHideWhen: { fieldType: ['html', 'hiddenField'] },
          description:
            'Whether to require the user to enter a value for this field before submitting the form',
        },
      ],
    },
    {
      key: 'responseMode',
      label: 'Respond When',
      kind: 'select',
      value: 'onReceived',
      required: false,
      description: 'When to respond to the form submission',
      options: [
        {
          label: 'Form Is Submitted',
          value: 'onReceived',
          description: 'As soon as this node receives the form submission',
        },
        {
          label: 'Workflow Finishes',
          value: 'lastNode',
          description: 'When the last node of the workflow is executed',
        },
      ],
    },
    {
      key: 'addFormPage',
      label: 'Build multi-step forms by adding a form page later in your workflow',
      kind: 'notice',
      value: '',
      required: false,
    },
    {
      key: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      addLabel: 'Add option',
      required: false,
      fields: [
        {
          key: 'appendAttribution',
          label: 'Append n8n Attribution',
          kind: 'boolean',
          value: true,
          required: false,
          description:
            'Whether to include the link “Form automated with n8n” at the bottom of the form',
        },
        {
          key: 'ipWhitelist',
          label: 'IP(s) Allowlist',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. 127.0.0.1, 192.168.1.0/24',
          description:
            'Comma-separated list of allowed IP addresses or CIDR ranges. Leave empty to allow all IPs.',
        },
        {
          key: 'buttonLabel',
          label: 'Button Label',
          kind: 'text',
          value: 'Submit',
          required: false,
          description: 'The label of the submit button in the form',
        },
        {
          key: 'path',
          label: 'Form Path',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'webhook',
          description: "The final segment of the form's URL, both for test and production",
        },
        {
          key: 'respondWithOptions',
          label: 'Form Response',
          kind: 'fixedCollection',
          value: { values: { respondWith: 'text' } },
          collectionKey: 'values',
          collectionLabel: 'Values',
          multiple: false,
          addLabel: 'Add option',
          required: false,
          showWhen: { responseMode: ['onReceived', 'lastNode'] },
          n8nHideWhen: { '/responseMode': ['responseNode'] },
          fields: [
            {
              key: 'respondWith',
              label: 'Respond With',
              kind: 'select',
              value: 'text',
              required: false,
              options: [
                {
                  label: 'Form Submitted Text',
                  value: 'text',
                  description: 'Show a response text to the user',
                },
                {
                  label: 'Redirect URL',
                  value: 'redirect',
                  description: 'Redirect the user to a URL',
                },
              ],
            },
            {
              key: 'formSubmittedText',
              label: 'Text to Show',
              kind: 'text',
              value: 'Your response has been recorded',
              required: false,
              showWhen: { respondWith: ['text'] },
              description:
                "The text displayed to users after they fill the form. Leave it empty if don't want to show any additional text.",
            },
            {
              key: 'redirectUrl',
              label: 'URL to Redirect to',
              kind: 'text',
              value: '',
              required: false,
              validateType: 'url',
              placeholder: 'e.g. http://www.n8n.io',
              showWhen: { respondWith: ['redirect'] },
              description:
                'The URL to redirect users to after they fill the form. Must be a valid URL.',
            },
          ],
        },
        {
          key: 'ignoreBots',
          label: 'Ignore Bots',
          kind: 'boolean',
          value: false,
          required: false,
          description: 'Whether to ignore requests from bots like link previewers and web crawlers',
        },
        {
          key: 'includeUserInOutput',
          label: 'Include User in Output',
          kind: 'boolean',
          value: true,
          required: false,
          showWhen: { authentication: ['n8nUserAuth'] },
          n8nShowWhen: { '/authentication': ['n8nUserAuth'] },
          description:
            "Whether to include the logged-in user's ID, email and name in the trigger output",
        },
        {
          key: 'useWorkflowTimezone',
          label: 'Use Workflow Timezone',
          kind: 'boolean',
          value: true,
          required: false,
          description: "Whether to use the workflow timezone in 'submittedAt' field or UTC",
        },
        {
          key: 'customCss',
          label: 'Custom Form Styling',
          kind: 'textarea',
          value: DEFAULT_FORM_CSS,
          required: false,
          rows: 10,
          editor: 'cssEditor',
          description: 'Override default styling of the public form interface with CSS',
        },
        {
          key: 'showHeaders',
          label: 'Show Headers',
          kind: 'boolean',
          value: false,
          required: false,
          description: 'Whether the form submit request headers are shown',
        },
      ],
    },
  ],
  platformGaps: [
    'Date-only defaults use n8n dateTime input; the simulator normalizes this to a text field with inputType=date.',
    'Form preview, webhook URLs, CSS/HTML editors, dynamic optional attributes, credentials, and submissions remain inert.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'formFields.values.defaultValue',
      sourceType: 'dateTime',
      normalizedKind: 'text',
      reason: 'The catalog has no dedicated dateTime control; this date-only value uses a text input.',
    },
  ],
  simulation: {
    configurationOnly: true,
    formHosting: false,
    submissionHandling: false,
    authentication: false,
    workflowExecution: false,
    apiCalls: false,
    voice: false,
  },
  output: {
    'Full Name': 'Aarav Sharma',
    Email: 'aarav@example.com',
    Plan: 'Pro',
    'Referral Source': 'Google search',
  },
};

export default formTrigger;
