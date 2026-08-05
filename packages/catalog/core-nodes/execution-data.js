// Editor-only descriptor for n8n's Execution Data v1.1. It models the form and
// warnings without saving or retrieving custom execution metadata.

const executionData = {
  type: 'execution-data',
  n8nType: 'n8n-nodes-base.executionData',
  n8nVersion: 1.1,
  versionHistory: [1, 1.1],
  label: 'Execution Data',
  subtitle: '',
  description: 'Add execution data for search',
  category: 'core',
  categories: ['Development', 'Core Nodes'],
  subcategory: 'Helpers',
  group: ['input'],
  inputs: ['main'],
  outputs: ['main'],
  icon: '/node-icons/execution-data.svg',
  n8nIcon: 'node:execution-data',
  iconColor: 'light-green',
  iconHex: '#31C4AB',
  aliases: ['Filter', '_Set', 'Data'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executiondata/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/ExecutionData/ExecutionData.node.ts',
    metadataPath: 'packages/nodes-base/nodes/ExecutionData/ExecutionData.node.json',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/execution-data.svg',
  },
  defaults: { name: 'Execution Data' },
  hints: [
    {
      type: 'warning',
      message: 'Some keys are longer than 50 characters. They will be truncated.',
      displayCondition: '={{ $parameter.dataToSave.values.some((x) => x.key.length > 50) }}',
      whenToDisplay: 'beforeExecution',
      location: 'outputPane',
    },
    {
      type: 'warning',
      message: 'Some values are longer than 512 characters. They will be truncated.',
      displayCondition:
        '={{ $parameter.dataToSave.values.some((x) => x.value.length > 512) }}',
      whenToDisplay: 'beforeExecution',
      location: 'outputPane',
    },
  ],
  params: [
    {
      key: 'notice',
      label:
        "Save important data using this node. It will be displayed on each execution for easy reference and you can filter by it.<br />Filtering is available on Pro and Enterprise plans. <a href='https://n8n.io/pricing/' target='_blank'>More Info</a>",
      kind: 'notice',
      value: '',
      required: false,
    },
    {
      key: 'operation',
      label: 'Operation',
      kind: 'select',
      value: 'save',
      required: false,
      noDataExpression: true,
      options: [
        {
          label: 'Save Highlight Data (for Search/review)',
          value: 'save',
          action: 'Save Highlight Data (for search/review)',
        },
      ],
    },
    {
      key: 'dataToSave',
      label: 'Data to Save',
      kind: 'fixedCollection',
      value: {},
      collectionKey: 'values',
      collectionLabel: 'Values',
      multiple: true,
      addLabel: 'Add Saved Field',
      required: false,
      showWhen: { operation: ['save'] },
      fields: [
        {
          key: 'key',
          label: 'Key',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. myKey',
          requiresDataPath: 'single',
        },
        {
          key: 'value',
          label: 'Value',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. myValue',
        },
      ],
    },
  ],
  output: {},
};

export default executionData;
