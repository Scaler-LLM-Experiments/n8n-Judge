// Editor-only descriptor for n8n's SSE Trigger v1 node. URL configuration is
// preserved, while EventSource connections, subscriptions, and emissions stay inert.

const sseTrigger = {
  type: 'sse-trigger',
  n8nType: 'n8n-nodes-base.sseTrigger',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'SSE Trigger',
  subtitle: '',
  description: 'Triggers the workflow when Server-Sent Events occur',
  details:
    'Server-Sent Events (SSE) is a server push technology enabling a client to receive automatic updates from a server using HTTP connection. The SSE Trigger node is used to receive server-sent events.',
  eventTriggerDescription: '',
  activationMessage: 'You can now make calls to your SSE URL to trigger executions.',
  category: 'trigger',
  categories: ['Development', 'Core Nodes'],
  subcategory: 'Other Trigger Nodes',
  subcategories: ['Other Trigger Nodes'],
  group: ['trigger'],
  inputs: [],
  outputs: ['main'],
  icon: '/node-icons/sse-trigger.svg',
  n8nIcon: 'node:sse-trigger',
  iconColor: 'dark-blue',
  iconHex: '#353F6E',
  iconColorLight: '#353F6E',
  iconColorDark: '#7BA7FF',
  iconMode: 'currentColor',
  aliases: [],
  docs:
    'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.ssetrigger/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/SseTrigger/SseTrigger.node.ts',
    metadataPath: 'packages/nodes-base/nodes/SseTrigger/SseTrigger.node.json',
    availabilityPath: 'packages/@n8n/config/src/configs/nodes.config.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/sse-trigger.svg',
    directImports: [
      { module: 'eventsource', names: ['default'] },
      {
        module: 'n8n-workflow',
        names: [
          'IDataObject',
          'ITriggerFunctions',
          'INodeType',
          'INodeTypeDescription',
          'ITriggerResponse',
          'NodeConnectionTypes',
          'jsonParse',
        ],
        typeOnlyNames: [
          'IDataObject',
          'ITriggerFunctions',
          'INodeType',
          'INodeTypeDescription',
          'ITriggerResponse',
        ],
      },
    ],
  },
  defaults: { name: 'SSE Trigger' },
  triggerPanel: {
    header: '',
    executionsHelp: {
      inactive:
        "<b>While building your workflow</b>, click the 'execute step' button, then trigger an SSE event. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Once you're happy with your workflow</b>, publish it. Then every time a change is detected, the workflow will execute. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
      active:
        "<b>While building your workflow</b>, click the 'execute step' button, then trigger an SSE event. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Your workflow will also execute automatically</b>, since it's activated. Every time a change is detected, this node will trigger an execution. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
    },
    activationHint:
      'Once you’ve finished building your workflow, publish it to have it also listen continuously (you just won’t see those executions here).',
  },
  credentialRequirements: [],
  credentials: [],
  credentialSurface: {
    locked: true,
    sourceDefinesCredentials: false,
    availableCredentialTypes: [],
    simulationCredentialAccess: false,
    note:
      'The pinned node exposes no authentication or credential selector. The empty credential surface is locked so the simulation cannot invent or access credentials.',
  },
  availability: {
    enabledByDefault: true,
    canBeExcludedWith: 'NODES_EXCLUDE',
    selfHostedAvailable: true,
    cloudRestrictionInSource: false,
    requiresWorkflowActivationForContinuousListening: true,
    supportsManualTestListening: true,
    simulationAvailable: false,
  },
  params: [
    {
      key: 'url',
      n8nKey: 'url',
      label: 'URL',
      kind: 'text',
      value: '',
      required: true,
      placeholder: 'http://example.com',
      description: 'The URL to receive the SSE from',
      simulationNote:
        'The URL remains authoring text. It is never requested and no SSE connection is opened.',
    },
  ],
  surfaceParity: {
    sourceParameterKeys: ['url'],
    representedParameterKeys: ['url'],
    authenticationFields: [],
    optionFields: [],
    namedEventFields: [],
    unnamedMessageHandlerOnly: true,
    sourcePayloadRequirement: 'Event data must be valid JSON',
    sourceParseError: 'Invalid JSON for event data',
  },
  unsupportedVisibleTypes: [],
  simulation: {
    configurationOnly: true,
    networkRequests: false,
    opensEventSource: false,
    subscribesToEvents: false,
    listensForMessages: false,
    parsesEventData: false,
    emitsItems: false,
    triggersWorkflow: false,
    executes: false,
    runtime: false,
    voice: false,
  },
  output: {},
};

export default sseTrigger;
