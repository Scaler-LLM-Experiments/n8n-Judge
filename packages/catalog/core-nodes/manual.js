// Editor-only descriptor for n8n's Manual Trigger v1 core node.
// It mirrors the minimal NDV surface without starting or executing a workflow.

const manual = {
  type: 'manual',
  n8nType: 'n8n-nodes-base.manualTrigger',
  n8nVersion: 1,
  versionHistory: [1],
  label: 'Manual Trigger',
  defaultName: 'When clicking ‘Execute workflow’',
  subtitle: '',
  description: 'Runs the flow on clicking a button in n8n',
  eventTriggerDescription: '',
  category: 'trigger',
  categories: ['Core Nodes'],
  group: ['trigger'],
  inputs: [],
  outputs: ['main'],
  maxNodes: 1,
  icon: '/node-icons/manual.svg',
  n8nIcon: 'node:manual-trigger',
  iconMode: 'currentColor',
  iconColor: 'black',
  aliases: [],
  docs:
    'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.manualworkflowtrigger/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/ManualTrigger/ManualTrigger.node.ts',
    metadataPath: 'packages/nodes-base/nodes/ManualTrigger/ManualTrigger.node.json',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/manual-trigger.svg',
  },
  defaults: {
    name: 'When clicking ‘Execute workflow’',
  },
  builderHint: {
    searchHint: 'There can only be one manual trigger node per workflow',
  },
  availability: {
    maxNodesPerWorkflow: 1,
    manualOnly: true,
    automaticTrigger: false,
    intendedForTesting: true,
  },
  triggerBehavior: {
    sourceTriggerMethod: 'trigger',
    sourceEvent: 'manualTriggerFunction',
    sourceOutput: [{}],
    inert: true,
    simulationNote:
      'The official node starts a workflow only after the canvas test action. This simulation records that behavior as metadata and never starts a workflow.',
  },
  credentials: [],
  params: [
    {
      key: 'notice',
      label:
        'This node is where the workflow execution starts (when you click the ‘test’ button on the canvas).<br><br> <a data-action="showNodeCreator">Explore other ways to trigger your workflow</a> (e.g on a schedule, or a webhook)',
      kind: 'notice',
      value: '',
      required: false,
    },
  ],
  simulation: {
    configurationOnly: true,
    startsWorkflow: false,
    emitsItems: false,
    executes: false,
    runtime: false,
    voice: false,
  },
  output: {},
};

export default manual;
