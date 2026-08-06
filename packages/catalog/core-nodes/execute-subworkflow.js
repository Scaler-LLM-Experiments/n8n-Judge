// Editor-only simulation of n8n's Execute Sub-workflow node.
// Workflow discovery, schema loading, creation, and execution are intentionally inert.

export const executeSubworkflowNode = {
  type: 'execute-subworkflow',
  n8nType: 'n8n-nodes-base.executeWorkflow',
  label: 'Execute Sub-workflow',
  n8nName: 'executeWorkflow',
  n8nVersion: 1.3,
  versionHistory: [1, 1.1, 1.2, 1.3],
  group: ['transform'],
  category: 'core',
  categories: ['Core Nodes'],
  subcategory: 'Helpers',
  subcategories: ['Helpers', 'Flow'],
  description: 'Execute another workflow',
  details:
    'The Execute Workflow node can be used when you want your workflow to treat another workflow as a step in your flow. It allows you to modularize your workflows and have a single source of truth for series of actions you perform often.',
  icon: '/node-icons/execute-subworkflow.svg',
  iconMode: 'currentColor',
  iconColor: 'orange-red',
  iconHex: '#FF6900',
  defaults: {
    name: 'Execute Workflow',
  },
  subtitle: '={{"Workflow: " + $parameter["workflowId"]}}',
  inputs: ['main'],
  outputs: ['main'],
  aliases: ['n8n', 'call', 'sub', 'workflow', 'sub-workflow', 'subworkflow'],
  docs:
    'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/',
  credentials: [],
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path:
      'packages/nodes-base/nodes/ExecuteWorkflow/ExecuteWorkflow/ExecuteWorkflow.node.ts',
    metadataPath:
      'packages/nodes-base/nodes/ExecuteWorkflow/ExecuteWorkflow/ExecuteWorkflow.node.json',
    resourceMappingPath:
      'packages/nodes-base/nodes/ExecuteWorkflow/ExecuteWorkflow/methods/localResourceMapping.ts',
    workflowSelectorPath:
      'packages/frontend/editor-ui/src/features/ndv/parameters/components/WorkflowSelectorParameterInput/WorkflowSelectorParameterInput.vue',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/execute-sub-workflow.svg',
  },
  params: [
    {
      key: 'operation',
      label: 'Operation',
      kind: 'hidden',
      value: 'call_workflow',
      noDataExpression: true,
      options: [
        {
          label: 'Execute a Sub-Workflow',
          value: 'call_workflow',
        },
      ],
    },
    {
      key: 'source',
      label: 'Source',
      kind: 'select',
      value: 'database',
      description: 'Where to get the workflow to execute from',
      options: [
        {
          label: 'Database',
          value: 'database',
          description: 'Load the workflow from the database by ID',
        },
        {
          label: 'Define Below',
          value: 'parameter',
          description: 'Pass the JSON code of a workflow',
        },
      ],
    },
    {
      key: 'workflowId',
      label: 'Workflow',
      kind: 'resourceLocator',
      sourceKind: 'workflowSelector',
      value: {
        __rl: true,
        mode: 'list',
        value: '',
      },
      sourceDefault: '',
      required: true,
      locked: true,
      showWhen: {
        source: ['database'],
      },
      modes: ['list', 'id'],
      modeOptions: [
        {
          label: 'From List',
          value: 'list',
          type: 'list',
          searchable: true,
          searchListMethod: 'searchWorkflows',
        },
        {
          label: 'By ID',
          value: 'id',
          type: 'string',
          placeholder: 'e.g. 2A6egiUs6Q8TRj5p',
        },
      ],
      options: [],
      dynamicOptions: {
        source: 'workflowSelector',
        inert: true,
        capabilities: ['list', 'search', 'create', 'open'],
      },
      simulationNote:
        'Workflow browsing, searching, creation, linking, and selection are unavailable in this simulation.',
    },
    {
      key: 'workflowJson',
      label: 'Workflow JSON',
      kind: 'textarea',
      sourceKind: 'json',
      editor: 'json',
      rows: 10,
      value: '\n\n\n',
      required: true,
      description: 'The workflow JSON code to execute',
      showWhen: {
        source: ['parameter'],
      },
    },
    {
      key: 'workflowInputs',
      label: 'Workflow Inputs',
      kind: 'collection',
      sourceKind: 'resourceMapper',
      value: {
        mappingMode: 'defineBelow',
        value: null,
      },
      required: true,
      noDataExpression: true,
      showWhen: {
        source: ['database'],
      },
      hideWhen: {
        workflowId: [''],
      },
      loadOptionsDependsOn: ['workflowId.value'],
      fields: [
        {
          key: 'mappingMode',
          label: 'Mapping Mode',
          kind: 'hidden',
          value: 'defineBelow',
        },
        {
          key: 'value',
          label: 'Workflow Inputs',
          kind: 'fixedCollection',
          value: {
            fields: [],
          },
          multiple: true,
          collectionKey: 'fields',
          collectionLabel: 'Input',
          addLabel: 'Add Input',
          dynamicSchema: true,
          fields: [
            {
              key: 'inputName',
              n8nKey: 'name',
              label: 'Input',
              kind: 'text',
              value: '',
              required: true,
              placeholder: 'Defined by the selected sub-workflow',
            },
            {
              key: 'inputValue',
              n8nKey: 'value',
              label: 'Value',
              kind: 'expression',
              value: '',
            },
          ],
        },
      ],
      resourceMapper: {
        localResourceMapperMethod: 'loadSubWorkflowInputs',
        valuesLabel: 'Workflow Inputs',
        mode: 'map',
        fieldWords: {
          singular: 'input',
          plural: 'inputs',
        },
        addAllFields: true,
        multiKeyMatch: false,
        supportAutoMap: false,
        showTypeConversionOptions: true,
        refreshStaleSchemaOnOpen: true,
        inert: true,
      },
      dynamicSchema: {
        source: 'loadSubWorkflowInputs',
        dependsOn: ['workflowId.value'],
        inert: true,
        emptyFieldsNotices: {
          passthrough:
            'This sub-workflow will consume all input data passed to it. You can define specific expected input in the sub-workflow’s trigger.',
          none:
            "The sub-workflow isn't set up to accept any inputs. Change this in the sub-workflow’s trigger.",
        },
      },
      simulationNote:
        'Input fields normally come from the selected sub-workflow trigger. No workflow or schema request is made in this simulation.',
    },
    {
      key: 'mode',
      label: 'Mode',
      kind: 'select',
      value: 'once',
      noDataExpression: true,
      options: [
        {
          label: 'Run once with all items',
          value: 'once',
          description: 'Pass all items into a single execution of the sub-workflow',
        },
        {
          label: 'Run once for each item',
          value: 'each',
          description: 'Call the sub-workflow individually for each item',
        },
      ],
    },
    {
      key: 'eachModeDeprecationNotice',
      label:
        '"Run once for each item" is deprecated and will be removed in a future version. To run the sub-workflow once per item, add a "Loop Over Items" node before this node and use "Run once with all items".',
      kind: 'notice',
      value: '',
      showWhen: {
        mode: ['each'],
      },
    },
    {
      key: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      addLabel: 'Add Option',
      fields: [
        {
          key: 'waitForSubWorkflow',
          label: 'Wait For Sub-Workflow Completion',
          kind: 'boolean',
          value: true,
          description:
            'Whether to wait for the sub-workflow to finish before continuing',
        },
      ],
    },
  ],
  hints: [
    {
      type: 'info',
      message:
        "Note on using an expression for workflow ID: Since this node is set to run once with all items, they will all be sent to the <em>same</em> workflow. That workflow's ID will be calculated by evaluating the expression for the <strong>first input item</strong>.",
      displayCondition:
        '={{ $rawParameter.workflowId.startsWith("=") && $parameter.mode === "once" && $nodeVersion >= 1.2 }}',
      whenToDisplay: 'always',
      location: 'outputPane',
    },
  ],
  unsupportedVisibleTypes: [
    {
      key: 'workflowJson',
      sourceType: 'json',
      normalizedKind: 'textarea',
      reason: 'The catalog has no dedicated JSON parameter control.',
    },
    {
      key: 'workflowInputs',
      sourceType: 'resourceMapper',
      normalizedKind: 'collection',
      reason:
        'The live resource mapper depends on a selected workflow and is represented by an inert dynamic collection.',
    },
  ],
  simulation: {
    configurationOnly: true,
    workflowDiscovery: false,
    workflowCreation: false,
    workflowExecution: false,
    apiCalls: false,
    dynamicSchemaRequests: false,
    voice: false,
  },
  output: {},
};

export default executeSubworkflowNode;
