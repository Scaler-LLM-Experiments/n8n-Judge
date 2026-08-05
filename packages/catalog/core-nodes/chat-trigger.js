// Editor-only descriptor for @n8n/n8n-nodes-langchain Chat Trigger v1.4.
// Endpoints, widgets, sessions, authentication, streaming, and execution stay inert.

const responseModeBuilderHint =
  "'streaming' (preferred for Agent-backed chats): the connected Agent streams its reply to the widget directly — no extra wiring. Place logging or side-effects on a PARALLEL branch off the trigger or Agent, never inline after the Agent. 'lastNode': the last-executed node's output is sent to the widget — that node MUST emit `{ output: '<reply text>' }` (typically the Agent itself, or a Set node re-shaping data). NEVER terminate the chain with a Data Table insert, HTTP Request, or other side-effect node — their output is not a chat reply and the widget will error. 'responseNodes' / 'responseNode': requires explicit response nodes inside the flow (`@n8n/n8n-nodes-langchain.chat` for chat-hub mode, `n8n-nodes-base.respondToWebhook` for webhook mode).";

const lastNodeResponseMode = {
  label: 'When Last Node Finishes',
  value: 'lastNode',
  description: 'Returns data of the last-executed node',
};

const streamingResponseMode = {
  label: 'Streaming',
  value: 'streaming',
  description: 'Streaming response from specified nodes (e.g. Agents)',
};

const responseNodesResponseMode = {
  label: 'Using Response Nodes',
  value: 'responseNodes',
  description: 'Send responses to the chat by using one or more Chat nodes',
};

const respondToWebhookResponseMode = {
  label: "Using 'Respond to Webhook' Node",
  value: 'responseNode',
  description: 'Response defined in that node',
};

const CSS_VARIABLES = `
:root {
  /* Colors */
  --chat--color--primary: #e74266;
  --chat--color--primary-shade-50: #db4061;
  --chat--color--primary--shade-100: #cf3c5c;
  --chat--color--secondary: #20b69e;
  --chat--color-secondary-shade-50: #1ca08a;
  --chat--color-white: #fff;
  --chat--color-light: #f2f4f8;
  --chat--color-light-shade-50: #e6e9f1;
  --chat--color-light-shade-100: #c2c5cc;
  --chat--color-medium: #d2d4d9;
  --chat--color-dark: #101330;
  --chat--color-disabled: #d2d4d9;
  --chat--color-typing: #404040;

  /* Base Layout */
  --chat--spacing: 1rem;
  --chat--border-radius: 0.25rem;
  --chat--transition-duration: 0.15s;
  --chat--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;

  /* Window Dimensions */
  --chat--window--width: 400px;
  --chat--window--height: 600px;
  --chat--window--bottom: var(--chat--spacing);
  --chat--window--right: var(--chat--spacing);
  --chat--window--z-index: 9999;
  --chat--window--border: 1px solid var(--chat--color-light-shade-50);
  --chat--window--border-radius: var(--chat--border-radius);
  --chat--window--margin-bottom: var(--chat--spacing);

  /* Header Styles */
  --chat--header-height: auto;
  --chat--header--padding: var(--chat--spacing);
  --chat--header--background: var(--chat--color-dark);
  --chat--header--color: var(--chat--color-light);
  --chat--header--border-top: none;
  --chat--header--border-bottom: none;
  --chat--header--border-left: none;
  --chat--header--border-right: none;
  --chat--heading--font-size: 2em;
  --chat--subtitle--font-size: inherit;
  --chat--subtitle--line-height: 1.8;

  /* Message Styles */
  --chat--message--font-size: 1rem;
  --chat--message--padding: var(--chat--spacing);
  --chat--message--border-radius: var(--chat--border-radius);
  --chat--message-line-height: 1.5;
  --chat--message--margin-bottom: calc(var(--chat--spacing) * 1);
  --chat--message--bot--background: var(--chat--color-white);
  --chat--message--bot--color: var(--chat--color-dark);
  --chat--message--bot--border: none;
  --chat--message--user--background: var(--chat--color--secondary);
  --chat--message--user--color: var(--chat--color-white);
  --chat--message--user--border: none;
  --chat--message--pre--background: rgba(0, 0, 0, 0.05);
  --chat--messages-list--padding: var(--chat--spacing);

  /* Toggle Button */
  --chat--toggle--size: 64px;
  --chat--toggle--width: var(--chat--toggle--size);
  --chat--toggle--height: var(--chat--toggle--size);
  --chat--toggle--border-radius: 50%;
  --chat--toggle--background: var(--chat--color--primary);
  --chat--toggle--hover--background: var(--chat--color--primary-shade-50);
  --chat--toggle--active--background: var(--chat--color--primary--shade-100);
  --chat--toggle--color: var(--chat--color-white);

  /* Input Area */
  --chat--textarea--height: 50px;
  --chat--textarea--max-height: 30rem;
  --chat--input--font-size: inherit;
  --chat--input--border: 0;
  --chat--input--border-radius: 0;
  --chat--input--padding: 0.8rem;
  --chat--input--background: var(--chat--color-white);
  --chat--input--text-color: initial;
  --chat--input--line-height: 1.5;
  --chat--input--placeholder--font-size: var(--chat--input--font-size);
  --chat--input--border-active: 0;
  --chat--input--left--panel--width: 2rem;

  /* Button Styles */
  --chat--button--padding: calc(var(--chat--spacing) * 5 / 8) var(--chat--spacing);
  --chat--button--border-radius: var(--chat--border-radius);
  --chat--button--font-size: 1rem;
  --chat--button--line-height: 1;
  --chat--button--color--primary: var(--chat--color-light);
  --chat--button--background--primary: var(--chat--color--secondary);
  --chat--button--border--primary: none;
  --chat--button--color--primary--hover: var(--chat--color-light);
  --chat--button--background--primary--hover: var(--chat--color-secondary-shade-50);
  --chat--button--border--primary--hover: none;
  --chat--button--color--primary--disabled: var(--chat--color-light);
  --chat--button--background--primary--disabled: #81bbb1;
  --chat--button--border--primary--disabled: none;
  --chat--button--color--secondary: var(--chat--color-light);
  --chat--button--background--secondary: hsl(0, 0%, 58%);
  --chat--button--border--secondary: none;
  --chat--button--color--secondary--hover: var(--chat--color-light);
  --chat--button--background--secondary--hover: hsl(0, 0%, 51%);
  --chat--button--border--secondary--hover: none;
  --chat--button--color--secondary--disabled: var(--chat--color-light);
  --chat--button--background--secondary--disabled: hsl(0, 0%, 78%);
  --chat--button--border--secondary--disabled: none;
  --chat--close--button--color-hover: var(--chat--color--primary);

  /* Send and File Buttons */
  --chat--input--send--button--background: var(--chat--color-white);
  --chat--input--send--button--color: var(--chat--color--secondary);
  --chat--input--send--button--background-hover: var(--chat--color--primary-shade-50);
  --chat--input--send--button--color-hover: var(--chat--color-secondary-shade-50);
  --chat--input--file--button--background: var(--chat--color-white);
  --chat--input--file--button--color: var(--chat--color--secondary);
  --chat--input--file--button--background-hover: var(--chat--input--file--button--background);
  --chat--input--file--button--color-hover: var(--chat--color-secondary-shade-50);
  --chat--files-spacing: 0.25rem;

  /* Body and Footer */
  --chat--body--background: var(--chat--color-light);
  --chat--footer--background: var(--chat--color-light);
  --chat--footer--color: var(--chat--color-dark);
}
`;

const DEFAULT_CUSTOM_CSS = `
${CSS_VARIABLES}

/* You can override any class styles, too. Right-click inspect in Chat UI to find class to override. */
.chat-message {
	max-width: 50%;
}
`.trim();

const chatTrigger = {
  type: 'chat-trigger',
  n8nType: '@n8n/n8n-nodes-langchain.chatTrigger',
  n8nVersion: 1.4,
  defaultVersion: 1.4,
  versionHistory: [1, 1.1, 1.2, 1.3, 1.4],
  label: 'Chat Trigger',
  subtitle: '',
  description: 'Runs the workflow when an n8n generated webchat is submitted',
  details:
    "Use the Chat Trigger node when building AI workflows for chatbots and other chat interfaces. You can configure how users access the chat, using one of n8n's provided interfaces, or your own. You can add authentication.",
  eventTriggerDescription: 'Waiting for you to submit the chat',
  activationMessage: 'You can now make calls to your production chat URL.',
  activationMessageByPolicy: {
    publicChatEnabled: 'You can now make calls to your production chat URL.',
    publicChatDisabled: 'Public chat is disabled by instance policy.',
  },
  triggerPanel: false,
  category: 'trigger',
  categories: ['Core Nodes'],
  subcategory: 'Other Trigger Nodes',
  subcategories: ['Other Trigger Nodes', 'AI'],
  group: ['trigger'],
  maxNodes: 1,
  inputs: [],
  outputs: ['main'],
  portVariants: [
    {
      showWhen: {
        mode: ['hostedChat', 'webhook'],
        'options.loadPreviousSession': ['memory'],
      },
      inputs: [
        {
          type: 'ai_memory',
          connector: 'ai_memory',
          label: 'Memory',
          maxConnections: 1,
          required: true,
        },
      ],
      outputs: ['main'],
    },
  ],
  aiConnectorPorts: [
    {
      id: 'memory',
      type: 'ai_memory',
      connector: 'ai_memory',
      label: 'Memory',
      maxConnections: 1,
      required: true,
      showWhen: {
        mode: ['hostedChat', 'webhook'],
        'options.loadPreviousSession': ['memory'],
      },
    },
  ],
  icon: '/node-icons/chat-trigger.svg',
  n8nIcon: 'node:chat-trigger',
  iconColor: 'black',
  iconHex: '#000000',
  iconMode: 'currentColor',
  aliases: [],
  docs:
    'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/@n8n/nodes-langchain/nodes/trigger/ChatTrigger/ChatTrigger.node.ts',
    constantsPath:
      'packages/@n8n/nodes-langchain/nodes/trigger/ChatTrigger/constants.ts',
    authenticationPath:
      'packages/@n8n/nodes-langchain/nodes/trigger/ChatTrigger/GenericFunctions.ts',
    typesPath: 'packages/@n8n/nodes-langchain/nodes/trigger/ChatTrigger/types.ts',
    templatesPath:
      'packages/@n8n/nodes-langchain/nodes/trigger/ChatTrigger/templates.ts',
    utilPath: 'packages/@n8n/nodes-langchain/nodes/trigger/ChatTrigger/util.ts',
    highlightedDataDescriptionPath:
      'packages/nodes-base/utils/highlightedData/descriptions.ts',
    publicChatConfigPath: 'packages/@n8n/config/src/configs/chat-trigger.config.ts',
    credentialPath: 'packages/nodes-base/credentials/HttpBasicAuth.credentials.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/chat-trigger.svg',
    directDescriptionImports: [
      {
        module: 'n8n-nodes-base/dist/utils/highlightedData',
        names: ['autoSaveHighlightedDataProperty'],
      },
      { module: './constants', names: ['cssVariables'] },
    ],
  },
  defaults: { name: 'When chat message received' },
  builderHint: {
    searchHint:
      "Pair with `@n8n/n8n-nodes-langchain.agent` for chatbot workflows. Reply delivery is controlled by `options.responseMode` — `streaming` (Agent streams directly to widget) is simplest and preferred. For `lastNode` mode, the workflow's last-executed node MUST output `{ output: '<reply>' }` — typically the Agent itself or a Set node re-shaping data; ending the chain with a Data Table insert, HTTP Request, or other side-effect node will fail. Put logging or persistence on a parallel branch, not inline after the Agent.",
    relatedNodes: [
      {
        nodeType: '@n8n/n8n-nodes-langchain.agent',
        relationHint:
          "Main reply producer; use `responseMode: 'streaming'` so the Agent streams directly to the widget.",
      },
      {
        nodeType: 'n8n-nodes-base.set',
        relationHint:
          "Append at the end of a `responseMode: 'lastNode'` chain to re-shape the last node's output into `{ output: '<reply text>' }` when the natural last step (e.g. a Data Table insert) doesn't produce chat-shaped data.",
      },
      {
        nodeType: '@n8n/n8n-nodes-langchain.chat',
        relationHint:
          "Required for `responseMode: 'responseNodes'`. Place inside the flow wherever you want to emit a reply chunk.",
      },
    ],
  },
  availability: {
    enabledByDefault: true,
    publicChatEnabledByDefault: true,
    publicChatPolicyEnvironmentVariable: 'N8N_DISABLE_PUBLIC_CHAT_TRIGGER',
    manualChatAvailableWhenPublicDisabled: true,
    simulationAvailable: false,
  },
  webhookMetadata: {
    path: 'chat',
    definitions: [
      {
        name: 'setup',
        httpMethod: 'GET',
        responseMode: 'onReceived',
        ndvHideUrl: true,
      },
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode:
          '={{$parameter.options?.["responseMode"] ?? ($parameter.availableInChat ? "streaming" : "lastNode") }}',
        ndvHideMethod: true,
        ndvHideUrlByPolicy: true,
      },
    ],
    inert: true,
  },
  credentialRequirements: [
    {
      type: 'httpBasicAuth',
      name: 'Basic Auth',
      required: true,
      showWhen: { public: [true], authentication: ['basicAuth'] },
    },
  ],
  params: [
    {
      key: 'public',
      n8nKey: 'public',
      label: 'Make Chat Publicly Available',
      kind: 'boolean',
      value: false,
      required: false,
      description:
        'Whether the chat should be publicly available or only accessible through the manual chat interface',
    },
    {
      key: 'mode',
      n8nKey: 'mode',
      label: 'Mode',
      kind: 'select',
      value: 'hostedChat',
      required: false,
      showWhen: { public: [true] },
      options: [
        {
          label: 'Hosted Chat',
          value: 'hostedChat',
          description: 'Chat on a page served by n8n',
        },
        {
          label: 'Embedded Chat',
          value: 'webhook',
          description:
            'Chat through a widget embedded in another page, or by calling a webhook',
        },
      ],
    },
    {
      key: 'hostedChatNotice',
      n8nKey: 'hostedChatNotice',
      label:
        'Chat will be live at the URL above once this workflow is published. Live executions will show up in the ‘executions’ tab',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: { public: [true], mode: ['hostedChat'] },
    },
    {
      key: 'embeddedChatNotice',
      n8nKey: 'embeddedChatNotice',
      label:
        'Follow the instructions <a href="https://www.npmjs.com/package/@n8n/chat" target="_blank">here</a> to embed chat in a webpage (or just call the webhook URL at the top of this section). Chat will be live once you publish this workflow',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: { public: [true], mode: ['webhook'] },
    },
    {
      key: 'authentication',
      n8nKey: 'authentication',
      label: 'Authentication',
      kind: 'select',
      value: 'none',
      required: false,
      showWhen: { public: [true] },
      options: [
        {
          label: 'Basic Auth',
          value: 'basicAuth',
          description: 'Simple username and password (the same one for all users)',
        },
        {
          label: 'n8n User Auth',
          value: 'n8nUserAuth',
          description: 'Require user to be logged in with their n8n account',
        },
        { label: 'None', value: 'none' },
      ],
      description: 'The way to authenticate',
      builderHint: {
        propertyHint:
          "Default to 'none'. n8n exposes inbound trigger URLs publicly by design. Only select an authentication method when the user explicitly asks to authenticate inbound traffic.",
      },
    },
    {
      key: 'basicAuthCredential',
      n8nKey: 'credentials.httpBasicAuth',
      label: 'Credential to connect with',
      kind: 'select',
      sourceKind: 'credentials',
      value: 'httpBasicAuth',
      required: true,
      locked: true,
      showWhen: { public: [true], authentication: ['basicAuth'] },
      options: [{ label: 'Basic Auth', value: 'httpBasicAuth' }],
      simulationNote:
        'The credential selector is locked. The simulation never reads, creates, tests, or applies a username or password.',
    },
    {
      key: 'initialMessages',
      n8nKey: 'initialMessages',
      label: 'Initial Message(s)',
      kind: 'textarea',
      sourceKind: 'string',
      rows: 3,
      value: 'Hi there! 👋\nMy name is Nathan. How can I assist you today?',
      required: false,
      showWhen: { public: [true], mode: ['hostedChat'] },
      description: 'Default messages shown at the start of the chat, one per line',
    },
    {
      key: 'availableInChat',
      n8nKey: 'availableInChat',
      label: 'Make Available in n8n Chat Hub',
      kind: 'boolean',
      value: false,
      required: false,
      noDataExpression: true,
      description:
        'Whether to make the agent available in n8n Chat Hub for n8n instance users to chat with',
    },
    {
      key: 'availableInChatNotice',
      n8nKey: 'availableInChatNotice',
      label:
        'Your n8n users will be able to use this agent in <a href="/home/chat/" target="_blank">Chat</a> once this workflow is published. Make sure to share this workflow with at least Project Chat User access to all users who should use it.',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: { availableInChat: [true] },
    },
    {
      key: 'agentIcon',
      n8nKey: 'agentIcon',
      label: 'Agent Icon',
      kind: 'text',
      sourceKind: 'icon',
      value: 'bot',
      sourceDefault: { type: 'icon', value: 'bot' },
      required: false,
      noDataExpression: true,
      showWhen: { availableInChat: [true] },
      description: 'The icon of the agent on n8n Chat',
    },
    {
      key: 'agentName',
      n8nKey: 'agentName',
      label: 'Agent Name',
      kind: 'text',
      value: '',
      required: false,
      noDataExpression: true,
      showWhen: { availableInChat: [true] },
      description:
        'The name of the agent on n8n Chat. Name of the workflow is used if left empty.',
    },
    {
      key: 'agentDescription',
      n8nKey: 'agentDescription',
      label: 'Agent Description',
      kind: 'textarea',
      sourceKind: 'string',
      rows: 2,
      value: '',
      required: false,
      noDataExpression: true,
      showWhen: { availableInChat: [true] },
      description: 'The description of the agent on n8n Chat',
    },
    {
      key: 'suggestedPrompts',
      n8nKey: 'suggestedPrompts',
      label: 'Suggestions',
      kind: 'fixedCollection',
      value: {},
      required: false,
      noDataExpression: true,
      showWhen: { availableInChat: [true] },
      collectionKey: 'prompts',
      collectionLabel: 'Prompts',
      multiple: true,
      layout: 'inline',
      addLabel: 'Add Prompt',
      description:
        'Suggested prompts shown to users in n8n Chat Hub to start a conversation with the agent',
      fields: [
        {
          key: 'icon',
          n8nKey: 'suggestedPrompts.prompts.icon',
          sourceN8nKey: 'icon',
          label: 'Icon',
          kind: 'text',
          sourceKind: 'icon',
          value: 'comment',
          sourceDefault: { type: 'icon', value: 'comment' },
          required: false,
          noDataExpression: true,
        },
        {
          key: 'text',
          n8nKey: 'suggestedPrompts.prompts.text',
          sourceN8nKey: 'text',
          label: 'Prompt Text',
          kind: 'text',
          value: '',
          required: true,
          noDataExpression: true,
        },
      ],
    },
    {
      key: 'options',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Field',
      fields: [
        {
          key: 'allowedOrigins',
          n8nKey: 'options.allowedOrigins',
          sourceN8nKey: 'allowedOrigins',
          label: 'Allowed Origins (CORS)',
          kind: 'text',
          value: '*',
          required: false,
          showWhen: { public: [true], mode: ['hostedChat', 'webhook'] },
          description:
            'Comma-separated list of URLs allowed for cross-origin non-preflight requests. Use * (default) to allow all origins.',
          simulationNote: 'Origins remain text and no CORS policy is installed.',
        },
        {
          key: 'allowFileUploads',
          n8nKey: 'options.allowFileUploads',
          sourceN8nKey: 'allowFileUploads',
          label: 'Allow File Uploads',
          kind: 'boolean',
          value: false,
          required: false,
          showWhen: { mode: ['hostedChat'] },
          sourceBranches: [
            { showWhen: { public: [false] } },
            { showWhen: { public: [true], mode: ['hostedChat'] } },
          ],
          description: 'Whether to allow file uploads in the chat',
        },
        {
          key: 'allowedFilesMimeTypes',
          n8nKey: 'options.allowedFilesMimeTypes',
          sourceN8nKey: 'allowedFilesMimeTypes',
          label: 'Allowed File Mime Types',
          kind: 'text',
          value: '*',
          required: false,
          showWhen: { mode: ['hostedChat'] },
          sourceBranches: [
            { showWhen: { public: [false] } },
            { showWhen: { public: [true], mode: ['hostedChat'] } },
          ],
          placeholder: 'e.g. image/*, text/*, application/pdf',
          description:
            'Allowed file types for upload. Comma-separated list of <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types" target="_blank">MIME types</a>.',
        },
        {
          key: 'inputPlaceholder',
          n8nKey: 'options.inputPlaceholder',
          sourceN8nKey: 'inputPlaceholder',
          label: 'Input Placeholder',
          kind: 'text',
          value: 'Type your question..',
          required: false,
          showWhen: { public: [true], mode: ['hostedChat'] },
          placeholder: 'e.g. Type your message here',
          description: 'Shown as placeholder text in the chat input field',
        },
        {
          key: 'loadPreviousSession',
          n8nKey: 'options.loadPreviousSession',
          sourceN8nKey: 'loadPreviousSession',
          label: 'Load Previous Session',
          kind: 'select',
          value: 'notSupported',
          required: false,
          showWhen: { public: [true], mode: ['hostedChat', 'webhook'] },
          options: [
            {
              label: 'Off',
              value: 'notSupported',
              description: 'Loading messages of previous session is turned off',
            },
            {
              label: 'From Memory',
              value: 'memory',
              description: 'Load session messages from memory',
            },
            {
              label: 'Manually',
              value: 'manually',
              description: 'Manually return messages of session',
            },
          ],
          description: 'If loading messages of a previous session should be enabled',
          builderHint: {
            propertyHint:
              "This ONLY rehydrates the chat widget UI when the user reopens it — it does NOT give the Agent memory. The Agent gets memory from its own memory subnode regardless of this setting. Only set to 'memory' if the user wants the widget to restore visible history on reload; if so, you MUST also attach a memory subnode to this trigger (use the same memory node as the Agent so widget history matches what the Agent remembers). Otherwise leave as 'notSupported'.",
          },
        },
        {
          key: 'showWelcomeScreen',
          n8nKey: 'options.showWelcomeScreen',
          sourceN8nKey: 'showWelcomeScreen',
          label: 'Require Button Click to Start Chat',
          kind: 'boolean',
          value: false,
          required: false,
          showWhen: { public: [true], mode: ['hostedChat'] },
          description: 'Whether to show the welcome screen at the start of the chat',
        },
        {
          key: 'getStarted',
          n8nKey: 'options.getStarted',
          sourceN8nKey: 'getStarted',
          label: 'Start Conversation Button Text',
          kind: 'text',
          value: 'New Conversation',
          required: false,
          showWhen: {
            public: [true],
            mode: ['hostedChat'],
            showWelcomeScreen: [true],
          },
          placeholder: 'e.g. New Conversation',
          description:
            'Shown as part of the welcome screen, in the middle of the chat window',
        },
        {
          key: 'subtitle',
          n8nKey: 'options.subtitle',
          sourceN8nKey: 'subtitle',
          label: 'Subtitle',
          kind: 'text',
          value: "Start a chat. We're here to help you 24/7.",
          required: false,
          showWhen: { public: [true], mode: ['hostedChat'] },
          placeholder: "e.g. We're here for you",
          description: 'Shown at the top of the chat, under the title',
        },
        {
          key: 'title',
          n8nKey: 'options.title',
          sourceN8nKey: 'title',
          label: 'Title',
          kind: 'text',
          value: 'Hi there! 👋',
          required: false,
          showWhen: { public: [true], mode: ['hostedChat'] },
          placeholder: 'e.g. Welcome',
          description: 'Shown at the top of the chat',
        },
        {
          key: 'customCss',
          n8nKey: 'options.customCss',
          sourceN8nKey: 'customCss',
          label: 'Custom Chat Styling',
          kind: 'textarea',
          sourceKind: 'string',
          editor: 'cssEditor',
          rows: 10,
          value: DEFAULT_CUSTOM_CSS,
          required: false,
          showWhen: { public: [true], mode: ['hostedChat'] },
          description: 'Override default styling of the public chat interface with CSS',
          simulationNote: 'CSS remains editable text and is never applied to a page or widget.',
        },
        {
          key: 'responseMode',
          n8nKey: 'options.responseMode',
          sourceN8nKey: 'responseMode',
          label: 'Response Mode',
          kind: 'select',
          value: 'lastNode',
          required: false,
          options: [
            lastNodeResponseMode,
            streamingResponseMode,
            responseNodesResponseMode,
            respondToWebhookResponseMode,
          ],
          defaultByContext: [
            { when: { availableInChat: [false] }, value: 'lastNode' },
            { when: { availableInChat: [true] }, value: 'streaming' },
          ],
          sourceBranches: [
            {
              when: { public: [false], availableInChat: [false] },
              value: 'lastNode',
              options: [lastNodeResponseMode, responseNodesResponseMode, streamingResponseMode],
            },
            {
              when: { public: [false], availableInChat: [true] },
              value: 'streaming',
              options: [streamingResponseMode, lastNodeResponseMode, responseNodesResponseMode],
            },
            {
              when: {
                public: [true],
                mode: ['webhook'],
                availableInChat: [false],
              },
              value: 'lastNode',
              options: [lastNodeResponseMode, streamingResponseMode, respondToWebhookResponseMode],
            },
            {
              when: { public: [true], mode: ['webhook'], availableInChat: [true] },
              value: 'streaming',
              options: [streamingResponseMode, lastNodeResponseMode],
            },
            {
              when: {
                public: [true],
                mode: ['hostedChat'],
                availableInChat: [false],
              },
              value: 'lastNode',
              options: [lastNodeResponseMode, streamingResponseMode, responseNodesResponseMode],
            },
            {
              when: {
                public: [true],
                mode: ['hostedChat'],
                availableInChat: [true],
              },
              value: 'streaming',
              options: [streamingResponseMode, lastNodeResponseMode, responseNodesResponseMode],
            },
          ],
          description: 'When and how to respond to the chat',
          builderHint: { propertyHint: responseModeBuilderHint },
        },
        {
          key: 'autoSaveHighlightedData',
          n8nKey: 'options.autoSaveHighlightedData',
          sourceN8nKey: 'autoSaveHighlightedData',
          label: 'Auto-save highlighted data',
          kind: 'boolean',
          value: true,
          required: false,
          description:
            'Whether to automatically save <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executiondata/" target="_blank">highlighted data</a>. This data can then be used to filter executions in the Executions view. Available on Pro and Enterprise plans in n8n Cloud, and on Enterprise or registered Community Edition for self-hosted. Defaults to true.',
        },
      ],
    },
  ],
  currentVersionSurface: {
    visibleVersion: 1.4,
    rootParameterKeys: [
      'public',
      'mode',
      'hostedChatNotice',
      'embeddedChatNotice',
      'authentication',
      'initialMessages',
      'availableInChat',
      'availableInChatNotice',
      'agentIcon',
      'agentName',
      'agentDescription',
      'suggestedPrompts',
      'options',
    ],
    legacyHiddenBranches: [
      'availableInChatNotice (<v1.2)',
      'options (v1-v1.1)',
      'options (v1.2)',
    ],
  },
  responseModeParity: {
    values: ['lastNode', 'streaming', 'responseNodes', 'responseNode'],
    manualDefault: 'lastNode',
    chatHubDefault: 'streaming',
    embeddedPublicModes: ['lastNode', 'streaming', 'responseNode'],
    hostedPublicModes: ['lastNode', 'streaming', 'responseNodes'],
  },
  payloadContract: {
    inputFields: [
      {
        key: 'chatInput',
        type: 'string',
        purpose: 'The user message passed into the workflow',
      },
      {
        key: 'sessionId',
        type: 'string',
        purpose: 'The chat session identifier used by memory and highlighted data',
      },
    ],
    loadPreviousSessionAction: 'loadPreviousSession',
    highlightedDataFields: ['chatInput', 'sessionId'],
    authoringOnly: true,
  },
  responseContract: {
    lastNodePreferredFields: ['output', 'text'],
    fallback: 'Send the whole last-node object when neither output nor text is present',
    streamingRequiresSupportedNodes: true,
    responseNodesMode: 'responseNodes',
    webhookResponseNodeMode: 'responseNode',
    sendsResponses: false,
  },
  unsupportedVisibleTypes: [
    {
      n8nKey: 'agentIcon',
      sourceType: 'icon',
      normalizedKind: 'text with icon sourceDefault metadata',
    },
    {
      n8nKey: 'suggestedPrompts.prompts.icon',
      sourceType: 'icon',
      normalizedKind: 'text with icon sourceDefault metadata',
    },
    {
      n8nKey: 'options.responseMode',
      sourceType: 'six current conditional options definitions',
      normalizedKind: 'one select with exact context branches',
      reason:
        'Available modes and defaults vary by public mode, hosted versus embedded chat, and Chat Hub availability. Every source branch is retained as metadata.',
    },
    {
      n8nKey: 'options',
      sourceType: 'two current conditional collection definitions',
      normalizedKind: 'one collection with child visibility metadata',
    },
    {
      n8nKey: 'options.customCss',
      sourceType: 'string with CSS editor',
      normalizedKind: 'textarea with cssEditor metadata',
    },
  ],
  simulation: {
    configurationOnly: true,
    opensEndpoint: false,
    registersWebhooks: false,
    hostsWidget: false,
    embedsWidget: false,
    loadsSessions: false,
    writesHighlightedData: false,
    acceptsMessages: false,
    handlesUploads: false,
    authenticates: false,
    readsCredentials: false,
    streamsResponses: false,
    sendsResponses: false,
    networkRequests: false,
    triggersWorkflow: false,
    executes: false,
    runtime: false,
    voice: false,
  },
  output: {},
};

export default chatTrigger;
