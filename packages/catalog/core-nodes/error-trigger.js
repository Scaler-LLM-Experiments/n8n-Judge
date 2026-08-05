// Editor-only descriptor for n8n's Error Trigger v1. Error dispatch and manual
// mock execution remain outside this simulated authoring catalog.

const errorTrigger = {
  type: 'error-trigger',
  n8nType: 'n8n-nodes-base.errorTrigger',
  n8nVersion: 1,
  label: 'Error Trigger',
  subtitle: '',
  description: 'Triggers the workflow when another workflow has an error',
  details:
    'In n8n, when a workflow execution fails, it can start another workflow. This second workflow can be any arbitrary workflow on your n8n instance. Use the Error Trigger node as your Trigger in the Error workflow.',
  category: 'trigger',
  categories: ['Development', 'Core Nodes'],
  subcategory: 'Other Trigger Nodes',
  group: ['trigger'],
  inputs: [],
  outputs: ['main'],
  icon: '/node-icons/error-trigger.svg',
  n8nIcon: 'node:error-trigger',
  iconColor: 'blue',
  iconHex: '#3A42E9',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/ErrorTrigger/ErrorTrigger.node.ts',
    metadataPath: 'packages/nodes-base/nodes/ErrorTrigger/ErrorTrigger.node.json',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/error-trigger.svg',
  },
  defaults: { name: 'Error Trigger' },
  eventTriggerDescription: '',
  mockManualExecution: true,
  maxNodes: 1,
  params: [
    {
      key: 'notice',
      label:
        'This node will trigger when there is an error in another workflow, as long as that workflow is set up to do so. <a href="https://docs.n8n.io/integrations/core-nodes/n8n-nodes-base.errortrigger" target="_blank">More info</a>',
      kind: 'notice',
      value: '',
      required: false,
    },
  ],
  output: {},
};

export default errorTrigger;
