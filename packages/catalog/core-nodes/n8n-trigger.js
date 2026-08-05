// Editor-only descriptor for n8n's n8n Trigger v1 core node.
// Instance and workflow subscriptions remain inert authoring metadata.

const n8nTrigger = {
  type: 'n8n-trigger',
  n8nType: 'n8n-nodes-base.n8nTrigger',
  n8nVersion: 1,
  versionHistory: [1],
  label: 'n8n Trigger',
  defaultName: 'n8n Trigger',
  subtitle: '',
  description: 'Handle events and perform actions on your n8n instance',
  eventTriggerDescription: '',
  category: 'trigger',
  categories: ['Core Nodes'],
  subcategory: 'Flow',
  subcategories: ['Flow', 'Other Trigger Nodes', 'Helpers'],
  group: ['trigger'],
  inputs: [],
  outputs: ['main'],
  mockManualExecution: true,
  icon: '/node-icons/n8n-trigger.svg',
  n8nIcon: 'node:n8n-trigger',
  iconMode: 'currentColor',
  iconColor: 'pink-red',
  iconHex: '#EA4B71',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.n8ntrigger/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/N8nTrigger/N8nTrigger.node.ts',
    metadataPath: 'packages/nodes-base/nodes/N8nTrigger/N8nTrigger.node.json',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/n8n-trigger.svg',
  },
  defaults: {
    name: 'n8n Trigger',
  },
  availability: {
    scope: 'own-workflow',
    respondsToOtherWorkflows: false,
    requiresWorkflowActivation: true,
    supportsMockManualExecution: true,
    simulationNote:
      'The official node responds only to its own workflow and instance lifecycle. No event source is subscribed in this simulation.',
  },
  triggerBehavior: {
    activationModes: {
      update: 'Workflow updated',
      init: 'Instance started',
      activate: 'Workflow published',
    },
    mockManualEvent: 'Manual execution',
    sourcePayloadFields: ['event', 'timestamp', 'workflow_id'],
    inert: true,
  },
  credentials: [],
  params: [
    {
      key: 'events',
      label: 'Events',
      kind: 'multiSelect',
      value: [],
      required: true,
      options: [
        {
          label: 'Published Workflow Updated',
          value: 'update',
          description:
            'Triggers when workflow version is published from a published state (workflow was already published)',
        },
        {
          label: 'Instance Started',
          value: 'init',
          description: 'Triggers when this n8n instance is started or re-started',
        },
        {
          label: 'Workflow Published',
          value: 'activate',
          description:
            'Triggers when workflow version is published from an unpublished state (workflow was not published)',
        },
      ],
      description: `Specifies under which conditions an execution should happen:
<ul>
  <li><b>Published Workflow Updated</b>: Triggers when workflow version is published from a published state (workflow was already published)</li>
  <li><b>Instance Started</b>:  Triggers when this n8n instance is started or re-started</li>
  <li><b>Workflow Published</b>: Triggers when workflow version is published from an unpublished state (workflow was unpublished)</li>
</ul>`,
    },
  ],
  surface: {
    filters: [],
    conditions: [],
    notices: [],
  },
  simulation: {
    configurationOnly: true,
    activatesWorkflow: false,
    subscribesToEvents: false,
    startsWorkflow: false,
    emitsItems: false,
    executes: false,
    runtime: false,
    network: false,
    voice: false,
  },
  output: {},
};

export default n8nTrigger;
