// Editor-only descriptor for n8n's Execute Workflow Trigger v1.2, presented in
// current documentation as Execute Sub-workflow Trigger. It never calls or runs
// another workflow and never infers or loads a remote workflow schema.

const INPUT_SOURCE = {
  FIELDS: 'workflowInputs',
  JSON: 'jsonExample',
  PASSTHROUGH: 'passthrough',
};

const inputTypeOptions = [
  { label: 'Allow Any Type', value: 'any' },
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Array', value: 'array' },
  { label: 'Object', value: 'object' },
];

const jsonExampleDefault = JSON.stringify(
  {
    aField: 'a string',
    aNumber: 123,
    thisFieldAcceptsAnyType: null,
    anArray: [],
  },
  null,
  2,
);

const executeSubworkflowTrigger = {
  type: 'execute-subworkflow-trigger',
  n8nType: 'n8n-nodes-base.executeWorkflowTrigger',
  n8nVersion: 1.2,
  versionHistory: [1, 1.1, 1.2],
  label: 'Execute Sub-workflow Trigger',
  n8nDisplayName: 'Execute Workflow Trigger',
  subtitle: '',
  description:
    'Helpers for calling other n8n workflows. Used for designing modular, microservice-like workflows.',
  eventTriggerDescription: '',
  category: 'trigger',
  categories: ['Core Nodes'],
  subcategory: 'Helpers',
  subcategories: ['Helpers'],
  group: ['trigger'],
  inputs: [],
  outputs: ['main'],
  maxNodes: 1,
  icon: '/node-icons/execute-subworkflow-trigger.svg',
  n8nIcon: 'node:sub-workflow-trigger',
  iconColor: 'black',
  iconMode: 'currentColor',
  aliases: ['Execute Workflow Trigger', 'When Executed by Another Workflow'],
  docs:
    'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflowtrigger/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/nodes-base/nodes/ExecuteWorkflow/ExecuteWorkflowTrigger/ExecuteWorkflowTrigger.node.ts',
    metadataPath:
      'packages/nodes-base/nodes/ExecuteWorkflow/ExecuteWorkflowTrigger/ExecuteWorkflowTrigger.node.json',
    parameterPaths: [
      'packages/nodes-base/utils/workflowInputsResourceMapping/constants.ts',
      'packages/nodes-base/utils/workflowInputsResourceMapping/GenericFunctions.ts',
    ],
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/sub-workflow-trigger.svg',
  },
  defaults: { name: 'When Executed by Another Workflow' },
  hints: [
    {
      message:
        "This workflow isn't set to accept any input data. Fill out the workflow input schema or change the workflow to accept any data passed to it.",
      displayCondition:
        "={{$parameter['inputSource'] === 'workflowInputs' && !$parameter['workflowInputs'].keys().length || $parameter['inputSource'] === 'jsonExample' && $parameter['jsonExample'].toString().replaceAll(' ', '').replaceAll('\\n', '') === '{}' }}",
      whenToDisplay: 'always',
      location: 'ndv',
      simulationNote: 'The hint condition is metadata only and does not inspect another workflow.',
    },
  ],
  params: [
    {
      key: 'events',
      label: 'Events',
      kind: 'hidden',
      value: 'worklfow_call',
      required: false,
      noDataExpression: true,
      options: [
        {
          label: 'Workflow Call',
          value: 'worklfow_call',
          description: 'When executed by another workflow using Execute Workflow Trigger',
          action: 'When executed by Another Workflow',
        },
      ],
    },
    {
      key: 'inputSource',
      label: 'Input data mode',
      kind: 'select',
      value: INPUT_SOURCE.FIELDS,
      required: false,
      noDataExpression: true,
      options: [
        {
          label: 'Define using fields below',
          value: INPUT_SOURCE.FIELDS,
          description: 'Provide input fields via UI',
        },
        {
          label: 'Define using JSON example',
          value: INPUT_SOURCE.JSON,
          description: 'Generate a schema from an example JSON object',
        },
        {
          label: 'Accept all data',
          value: INPUT_SOURCE.PASSTHROUGH,
          description: 'Use all incoming data from the parent workflow',
        },
      ],
    },
    {
      key: 'jsonExampleNotice',
      n8nKey: 'jsonExample_notice',
      label:
        'Provide an example object to infer fields and their types.<br>To allow any type for a given field, set the value to null.',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: { inputSource: [INPUT_SOURCE.JSON] },
    },
    {
      key: 'jsonExample',
      label: 'JSON Example',
      kind: 'textarea',
      sourceKind: 'json',
      value: jsonExampleDefault,
      required: false,
      noDataExpression: true,
      rows: 10,
      editor: 'json',
      showWhen: { inputSource: [INPUT_SOURCE.JSON] },
      dynamicSchema: {
        source: 'exampleObject',
        inferredTypes: inputTypeOptions.map(({ value }) => value),
        inert: true,
      },
      simulationNote:
        'JSON can be authored here, but this simulation does not parse it into a schema or load workflow inputs.',
    },
    {
      key: 'workflowInputs',
      label: 'Workflow Input Schema',
      kind: 'fixedCollection',
      value: {},
      required: false,
      multiple: true,
      sortable: true,
      minRequiredFields: 1,
      collectionKey: 'values',
      collectionLabel: 'Values',
      addLabel: 'Add field',
      showWhen: { inputSource: [INPUT_SOURCE.FIELDS] },
      description:
        'Define expected input fields. If no inputs are provided, all data from the calling workflow will be passed through.',
      dynamicSchema: {
        exposesToCallingWorkflow: true,
        remoteLoading: false,
        inert: true,
      },
      simulationNote:
        'Fields are local authoring data only; the simulation never publishes or loads a workflow schema.',
      fields: [
        {
          key: 'name',
          label: 'Name',
          kind: 'text',
          value: '',
          required: true,
          noDataExpression: true,
          placeholder: 'e.g. fieldName',
          description:
            'A unique name for this workflow input, used to reference it from another workflows',
        },
        {
          key: 'type',
          label: 'Type',
          kind: 'select',
          value: 'string',
          required: true,
          noDataExpression: true,
          options: inputTypeOptions,
          description:
            "Expected data type for this input value. Determines how this field's values are stored, validated, and displayed.",
        },
      ],
    },
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'jsonExample',
      n8nType: 'json',
      normalizedKind: 'textarea',
      reason: 'The catalog supports a multiline editor but has no dedicated json field kind.',
    },
  ],
  output: {},
};

export default executeSubworkflowTrigger;
