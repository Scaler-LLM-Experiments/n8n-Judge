// Editor-only descriptor for @n8n/n8n-nodes-langchain's Chat v1.3 node.
// Chat delivery, user replies, memory access, webhooks, timers, and workflow
// execution remain inert.

const operationOptions = [
  {
    label: 'Send Message',
    value: 'send',
    action: 'Send a message',
  },
  {
    label: 'Send and Wait for Response',
    value: 'sendAndWait',
    action: 'Send message and wait for response',
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
    value: 'freeTextChat',
    description: 'User can submit a response in the chat',
  },
];

const approvalTypeOptions = [
  { label: 'Approve Only', value: 'single' },
  { label: 'Approve and Disapprove', value: 'double' },
];

const buttonStyleOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
];

const makeLimitWaitTime = (key, showWhen, n8nShowWhen) => ({
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
  showWhen,
  n8nShowWhen,
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
      editor: 'dateTime',
      format: 'dateTime',
      value: '',
      required: false,
      showWhen: { [`${key}LimitType`]: ['atSpecifiedTime'] },
      n8nShowWhen: { limitType: ['atSpecifiedTime'] },
      description: 'Continue execution after the specified date and time',
    },
  ],
  simulationNote:
    'This control records authoring metadata only. It never schedules a timer, pauses, or resumes an execution.',
});

const makeAutoSaveHighlightedData = (key) => ({
  key,
  n8nKey: 'autoSaveHighlightedData',
  label: 'Auto-save highlighted data',
  kind: 'boolean',
  value: true,
  required: false,
  description:
    'Whether to automatically save <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executiondata/" target="_blank">highlighted data</a>. This data can then be used to filter executions in the Executions view. Available on Pro and Enterprise plans in n8n Cloud, and on Enterprise or registered Community Edition for self-hosted. Defaults to true.',
  simulationNote: 'The value is retained, but the simulation never stores highlighted data.',
});

const chat = {
  type: 'chat',
  n8nType: '@n8n/n8n-nodes-langchain.chat',
  n8nVersion: 1.3,
  defaultVersion: 1.3,
  versionHistory: [1, 1.1, 1.2, 1.3],
  label: 'Chat',
  defaultName: 'Chat',
  subtitle: '',
  description: 'Send a message into the chat',
  details:
    'Configure a message to send through a compatible Chat Trigger, optionally pausing for free-text or approval input. This catalog entry models authoring metadata only.',
  category: 'core',
  categories: ['Core Nodes', 'HITL'],
  subcategory: 'Human in the Loop',
  subcategories: ['Human in the Loop'],
  group: ['input'],
  inputs: [{ type: 'main' }],
  outputs: [{ type: 'main' }],
  portVariants: [
    {
      showWhen: { 'options.memoryConnection': [true] },
      inputs: [
        { type: 'main' },
        { type: 'ai_memory', label: 'Memory', maxConnections: 1, required: false },
      ],
      outputs: [{ type: 'main' }],
    },
  ],
  dynamicInputMetadata: {
    sourceTemplate: '={{ (${configureInputs})($parameter) }}',
    parameterPath: 'options.memoryConnection',
    defaultInputs: [{ type: 'main' }],
    enabledInputs: [
      { type: 'main' },
      { type: 'ai_memory', displayName: 'Memory', maxConnections: 1 },
    ],
    exactSourceBehavior:
      'Adds one optional AI Memory input after the main input only when options.memoryConnection is true.',
    rendererGap:
      'The catalog port resolver currently evaluates top-level keys only; this exact nested n8n path is retained for a future resolver update.',
  },
  usableAsTool: true,
  toolConnector: 'ai_tool',
  icon: '/node-icons/chat.svg',
  n8nIcon: 'node:chat-trigger',
  iconMode: 'currentColor',
  iconColor: 'black',
  iconHex: '#000000',
  iconAssetType: 'svg',
  iconAssetSize: { width: 24, height: 24 },
  iconAssetSha256: 'd37550b37ed8514abf861b426ff3ac6b9a7427df5f530f7883459cdbc8284ffb',
  aliases: ['human', 'wait', 'hitl', 'respond', 'approve', 'confirm', 'send', 'message'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chat/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/@n8n/nodes-langchain/nodes/trigger/ChatTrigger/Chat.node.ts',
    utilityPath: 'packages/@n8n/nodes-langchain/nodes/trigger/ChatTrigger/util.ts',
    packagePath: 'packages/@n8n/nodes-langchain/package.json',
    sharedSendAndWaitPath: 'packages/nodes-base/utils/sendAndWait/utils.ts',
    sharedWaitDescriptionPath: 'packages/nodes-base/utils/sendAndWait/descriptions.ts',
    highlightedDataDescriptionPath:
      'packages/nodes-base/utils/highlightedData/descriptions.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/chat-trigger.svg',
    primaryDocumentation:
      'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.respondtochat/',
    directDescriptionImports: [
      {
        module: 'n8n-nodes-base/dist/utils/highlightedData',
        names: ['autoSaveHighlightedDataProperty'],
      },
      {
        module: 'n8n-nodes-base/dist/utils/sendAndWait/descriptions',
        names: ['limitWaitTimeOption', 'sendAndWaitWebhooksDescription'],
      },
      {
        module: './util',
        names: ['configureInputs', 'getSendAndWaitPropertiesForChatNode'],
      },
    ],
    directImports: [
      { module: '@langchain/classic/memory', names: ['BaseChatMemory'], typeOnly: true },
      {
        module: 'n8n-nodes-base/dist/utils/sendAndWait/utils',
        names: ['SEND_AND_WAIT_WAITING_TOOLTIP', 'sendAndWaitWebhook'],
      },
      {
        module: 'n8n-workflow',
        names: [
          'CHAT_TRIGGER_NODE_TYPE',
          'CHAT_WAIT_USER_REPLY',
          'FREE_TEXT_CHAT_RESPONSE_TYPE',
          'NodeConnectionTypes',
          'NodeOperationError',
          'SEND_AND_WAIT_OPERATION',
          'getHighlightedInputKey',
          'getHighlightedResponseKey',
          'isToolType',
        ],
      },
      {
        module: './util',
        names: ['configureWaitTillDate', 'getChatMessage'],
      },
    ],
  },
  defaults: { name: 'Chat' },
  waitingNodeTooltipSource: 'SEND_AND_WAIT_WAITING_TOOLTIP',
  webhooks: [
    {
      name: 'default',
      method: 'GET',
      httpMethod: 'GET',
      responseMode: 'onReceived',
      responseData: '',
      path: '={{ $nodeId }}',
      restartWebhook: true,
      fullPath: true,
      isFullPath: true,
      inert: true,
    },
    {
      name: 'default',
      method: 'POST',
      httpMethod: 'POST',
      responseMode: 'onReceived',
      responseData: '',
      path: '={{ $nodeId }}',
      restartWebhook: true,
      fullPath: true,
      isFullPath: true,
      inert: true,
    },
  ],
  builderHint: {
    relatedNodes: [
      {
        nodeType: '@n8n/n8n-nodes-langchain.chatTrigger',
        relationHint:
          'Required trigger for this node to work - must set responseMode to "responseNodes"',
      },
    ],
  },
  params: [
    {
      key: 'generalNotice',
      n8nKey: 'generalNotice',
      label:
        "Verify you're using a chat trigger with the 'Response Mode' option set to 'Using Response Nodes'",
      kind: 'notice',
      value: '',
      required: false,
    },
    {
      key: 'operation',
      n8nKey: 'operation',
      label: 'Operation',
      kind: 'select',
      sourceKind: 'options',
      value: 'send',
      required: false,
      noDataExpression: true,
      sourceVersionCondition: '@version >= 1.1',
      options: operationOptions,
    },
    {
      key: 'message',
      n8nKey: 'message',
      label: 'Message',
      kind: 'textarea',
      sourceKind: 'string',
      value: '',
      required: true,
      rows: 4,
      simulationNote:
        'Message text is retained as configuration only. It is never delivered to a chat or memory provider.',
    },
    {
      key: 'chatResponseType',
      n8nKey: 'responseType',
      label: 'Response Type',
      kind: 'select',
      sourceKind: 'options',
      value: 'freeTextChat',
      required: false,
      showWhen: { operation: ['sendAndWait'] },
      n8nShowWhen: { operation: ['sendAndWait'] },
      options: responseTypeOptions,
    },
    {
      key: 'blockUserInput',
      n8nKey: 'blockUserInput',
      label: 'Block User Input',
      kind: 'boolean',
      value: false,
      required: false,
      showWhen: { chatResponseType: ['approval'] },
      n8nShowWhen: { responseType: ['approval'] },
      description: 'Whether to block input from the user while waiting for approval',
      simulationNote: 'No chat input is blocked by this authoring-only control.',
    },
    {
      key: 'approvalOptions',
      n8nKey: 'approvalOptions',
      label: 'Approval Options',
      kind: 'fixedCollection',
      value: {},
      required: false,
      collectionKey: 'values',
      collectionLabel: 'Values',
      multiple: false,
      addLabel: 'Add option',
      showWhen: { operation: ['sendAndWait'], chatResponseType: ['approval'] },
      n8nShowWhen: { operation: ['sendAndWait'], responseType: ['approval'] },
      fields: [
        {
          key: 'approvalType',
          n8nKey: 'approvalType',
          label: 'Type of Approval',
          kind: 'select',
          value: 'single',
          required: false,
          addLabel: 'Add option',
          placeholder: 'Add option',
          options: approvalTypeOptions,
        },
        {
          key: 'approveLabel',
          n8nKey: 'approveLabel',
          label: 'Approve Button Label',
          kind: 'text',
          value: 'Approve',
          required: false,
          showWhen: { approvalType: ['single', 'double'] },
          n8nShowWhen: { approvalType: ['single', 'double'] },
        },
        {
          key: 'buttonApprovalStyle',
          n8nKey: 'buttonApprovalStyle',
          label: 'Approve Button Style',
          kind: 'select',
          value: 'primary',
          required: false,
          showWhen: { approvalType: ['single', 'double'] },
          n8nShowWhen: { approvalType: ['single', 'double'] },
          options: buttonStyleOptions,
        },
        {
          key: 'disapproveLabel',
          n8nKey: 'disapproveLabel',
          label: 'Disapprove Button Label',
          kind: 'text',
          value: 'Decline',
          required: false,
          showWhen: { approvalType: ['double'] },
          n8nShowWhen: { approvalType: ['double'] },
        },
        {
          key: 'buttonDisapprovalStyle',
          n8nKey: 'buttonDisapprovalStyle',
          label: 'Disapprove Button Style',
          kind: 'select',
          value: 'secondary',
          required: false,
          showWhen: { approvalType: ['double'] },
          n8nShowWhen: { approvalType: ['double'] },
          options: buttonStyleOptions,
        },
      ],
      simulationNote:
        'Button labels and styles are inert metadata. No approval request or response control is created.',
    },
    {
      key: 'options',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Option',
      n8nHideWhen: { '@tool': [true] },
      fields: [
        {
          key: 'optionsMemoryConnection',
          n8nKey: 'memoryConnection',
          label: 'Add Memory Input Connection',
          kind: 'boolean',
          value: false,
          required: false,
          showWhen: { chatResponseType: ['freeTextChat'] },
          n8nHideWhen: { '/responseType': ['approval'] },
          simulationNote:
            'This toggle only changes the represented input-port shape. No memory is read or written.',
        },
        makeLimitWaitTime(
          'optionsLimitWaitTime',
          { operation: ['sendAndWait'] },
          { '/operation': ['sendAndWait'] },
        ),
        makeAutoSaveHighlightedData('optionsAutoSaveHighlightedData'),
      ],
    },
    {
      key: 'toolOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Option',
      variant: 'tool',
      showWhen: { '@tool': [true], operation: ['sendAndWait'] },
      n8nShowWhen: { '@tool': [true], '/operation': ['sendAndWait'] },
      fields: [
        makeLimitWaitTime('toolOptionsLimitWaitTime'),
        makeAutoSaveHighlightedData('toolOptionsAutoSaveHighlightedData'),
      ],
    },
  ],
  actions: [
    {
      operation: 'send',
      label: 'Send Message',
      action: 'Send a message',
      waitsForResponse: false,
    },
    {
      operation: 'sendAndWait',
      label: 'Send and Wait for Response',
      action: 'Send message and wait for response',
      waitsForResponse: true,
      responseTypes: ['approval', 'freeTextChat'],
    },
  ],
  operationParity: {
    expected: ['send', 'sendAndWait'],
    represented: operationOptions.map(({ value }) => value),
    default: 'send',
  },
  responseTypeParity: {
    expected: ['approval', 'freeTextChat'],
    represented: responseTypeOptions.map(({ value }) => value),
    default: 'freeTextChat',
    approvalTypeDefault: 'single',
  },
  historicalSchema: {
    version1: {
      operationControlAbsent: true,
      waitUserReply: {
        n8nKey: 'waitUserReply',
        label: 'Wait for User Reply',
        kind: 'boolean',
        value: true,
        noDataExpression: true,
        sourceVersionCondition: '@version < 1.1',
      },
      nonToolOptions: {
        n8nKey: 'options',
        fields: [
          {
            n8nKey: 'limitWaitTime',
            condition: { '/waitUserReply': [true] },
            sameShapeAs: 'params.options.fields.optionsLimitWaitTime',
            default: {
              values: {
                limitType: 'afterTimeInterval',
                resumeAmount: 45,
                resumeUnit: 'minutes',
              },
            },
          },
          { n8nKey: 'autoSaveHighlightedData', default: true },
        ],
      },
      toolOptions: {
        n8nKey: 'options',
        condition: { '@tool': [true], '/waitUserReply': [true] },
        fields: ['limitWaitTime', 'autoSaveHighlightedData'],
      },
    },
    version1_1AndLater: {
      operationReplacesWaitUserReply: true,
      waitCondition: { operation: ['sendAndWait'] },
    },
    version1_2: {
      responseDataNoLongerForcedUnderDataKey: true,
    },
    version1_3: {
      sendReturnsOriginalChatMessage: true,
    },
  },
  docsSummary: {
    requiredTrigger:
      "Use Chat Trigger with Response Mode set to 'Using Response Nodes'.",
    embeddedChatUnsupported:
      'The Chat node is not supported with Embedded Chat; use Respond to Webhook there.',
    sendBehavior: 'Send Message continues immediately after authoring a chat message.',
    waitBehavior:
      'Send and Wait for Response normally pauses for either free text or an approval decision.',
    memoryBehavior:
      'Add Memory Input Connection exposes shared memory so the interaction can be added to chat history.',
    subworkflowLimitation: 'The Chat node cannot be used in subworkflows.',
    subagentLimitation: 'The Chat node cannot be used as a tool of an AI Agent Tool sub-node.',
  },
  platformGaps: [
    'Repeated source names for options use unique UI keys with n8nKey preserving the exact n8n parameter name.',
    'The optional ai_memory input is controlled by nested options.memoryConnection; its exact port shapes and path are recorded even though the current catalog port resolver only evaluates top-level keys.',
    'The historical pre-1.1 Wait for User Reply branch is recorded in historicalSchema but is not exposed in the current v1.3 parameter pane.',
    'n8n dateTime authoring is normalized to the catalog text control with date-time editor metadata.',
    'Tool-context Options are retained as a separate unique-keyed variant and contain no memory toggle.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'options.limitWaitTime.values.maxDateAndTime',
      sourceType: 'dateTime',
      normalizedKind: 'text',
      reason: 'The catalog has no dedicated dateTime kind; it retains date-time editor metadata.',
    },
  ],
  simulation: {
    configurationOnly: true,
    chatAccess: false,
    chatSessionAccess: false,
    sendsMessages: false,
    acceptsUserResponses: false,
    blocksUserInput: false,
    memoryAccess: false,
    memoryWrites: false,
    webhookRegistration: false,
    webhookHandling: false,
    networkAccess: false,
    createsTimers: false,
    waitsForResponse: false,
    pausesExecutions: false,
    resumesExecutions: false,
    workflowExecution: false,
    runtimeHooks: false,
    voice: false,
  },
  output: {},
};

export default chat;
