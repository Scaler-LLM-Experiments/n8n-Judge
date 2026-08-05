// Editor-only descriptor for n8n's No Operation v1 node. The native node has
// no configurable parameters; this catalog entry adds no data behavior.

const noop = {
  type: 'noop',
  n8nType: 'n8n-nodes-base.noOp',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'No Operation, do nothing',
  subtitle: '',
  description: 'No Operation',
  details:
    "Use the No Operation, do nothing node when you don't want to perform any operations. The purpose of this node is to make the workflow easier to read and understand where the flow of data stops. This can help others visually get a better understanding of the workflow.",
  category: 'core',
  categories: ['Core Nodes'],
  subcategory: 'Helpers',
  subcategories: ['Helpers'],
  group: ['organization'],
  inputs: ['main'],
  outputs: ['main'],
  icon: '/node-icons/noop.svg',
  n8nIcon: 'node:no-operation',
  iconColor: 'neutral',
  iconHex: '#C3C9D5',
  iconMode: 'currentColor',
  aliases: ['nothing'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.noop/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/NoOp/NoOp.node.ts',
    metadataPath: 'packages/nodes-base/nodes/NoOp/NoOp.node.json',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/no-operation.svg',
    directImports: [
      {
        module: 'n8n-workflow',
        names: ['IExecuteFunctions', 'INodeExecutionData', 'INodeType', 'INodeTypeDescription'],
        typeOnly: true,
      },
      { module: 'n8n-workflow', names: ['NodeConnectionTypes'], typeOnly: false },
    ],
  },
  defaults: { name: 'No Operation, do nothing' },
  availability: {
    cloud: true,
    selfHosted: true,
    disabledByDefault: false,
    restrictions: [],
  },
  params: [],
  unsupportedVisibleTypes: [],
  simulation: {
    configurationOnly: true,
    passesThroughData: false,
    transformsData: false,
  },
  output: {},
};

export default noop;
