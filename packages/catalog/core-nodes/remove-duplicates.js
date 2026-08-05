// Editor-only descriptor for n8n's Remove Duplicates v2 node. Item comparison,
// deduplication history, date parsing, and output routing are intentionally inert.

const operationOptions = [
  {
    label: 'Remove Items Repeated Within Current Input',
    value: 'removeDuplicateInputItems',
    description: 'Remove duplicates from incoming items',
    action: 'Remove items repeated within current input',
  },
  {
    label: 'Remove Items Processed in Previous Executions',
    value: 'removeItemsSeenInPreviousExecutions',
    description: 'Deduplicate items already seen in previous executions',
    action: 'Remove items processed in previous executions',
  },
  {
    label: 'Clear Deduplication History',
    value: 'clearDeduplicationHistory',
    description: 'Wipe the store of previous items',
    action: 'Clear deduplication history',
  },
];

const compareOptions = [
  { label: 'All Fields', value: 'allFields' },
  { label: 'All Fields Except', value: 'allFieldsExcept' },
  { label: 'Selected Fields', value: 'selectedFields' },
];

const logicOptions = [
  {
    label: 'Value Is New',
    value: 'removeItemsWithAlreadySeenKeyValues',
    description: 'Remove all input items with values matching those already processed',
  },
  {
    label: 'Value Is Higher than Any Previous Value',
    value: 'removeItemsUpToStoredIncrementalKey',
    description:
      'Works with incremental values, removes all input items with values up to the stored value',
  },
  {
    label: 'Value Is a Date Later than Any Previous Date',
    value: 'removeItemsUpToStoredDate',
    description:
      'Works with date values, removes all input items with values up to the stored date',
  },
];

const historyModeOptions = [
  {
    label: 'Clean Database',
    value: 'cleanDatabase',
    description: 'Clear all values stored for a key in the database',
  },
];

const removeDuplicates = {
  type: 'remove-duplicates',
  n8nType: 'n8n-nodes-base.removeDuplicates',
  n8nVersion: 2,
  defaultVersion: 2,
  versionHistory: [1, 1.1, 2],
  label: 'Remove Duplicates',
  defaultName: 'Remove Duplicates',
  subtitle: '',
  description: 'Delete items with matching field values',
  details:
    'Configure duplicate comparison within the current input, across previous executions, or clear stored history. This catalog entry never compares or stores items.',
  category: 'core',
  categories: ['Core Nodes'],
  subcategory: 'Data Transformation',
  subcategories: ['Data Transformation'],
  group: ['transform'],
  inputs: ['main'],
  outputs: [
    { type: 'main', label: 'Kept', name: 'kept' },
    { type: 'main', label: 'Discarded', name: 'discarded' },
  ],
  outputNames: ['Kept', 'Discarded'],
  icon: '/node-icons/remove-duplicates.svg',
  n8nIcon: 'node:remove-duplicates',
  iconMode: 'currentColor',
  iconColor: 'azure',
  aliases: [
    'Dedupe',
    'Deduplicate',
    'Duplicates',
    'Remove',
    'Unique',
    'Transform',
    'Array',
    'List',
    'Item',
  ],
  docs:
    'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.removeduplicates/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Transform/RemoveDuplicates/RemoveDuplicates.node.ts',
    versionPath:
      'packages/nodes-base/nodes/Transform/RemoveDuplicates/v2/RemoveDuplicatesV2.node.ts',
    descriptionPath:
      'packages/nodes-base/nodes/Transform/RemoveDuplicates/v2/RemoveDuplicatesV2.description.ts',
    utilityPath: 'packages/nodes-base/nodes/Transform/RemoveDuplicates/utils.ts',
    metadataPath:
      'packages/nodes-base/nodes/Transform/RemoveDuplicates/RemoveDuplicates.node.json',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/remove-duplicates.svg',
    legacyIconPath:
      'packages/nodes-base/nodes/Transform/RemoveDuplicates/removeDuplicates.svg',
  },
  defaults: { name: 'Remove Duplicates' },
  credentials: [],
  params: [
    {
      key: 'operation',
      label: 'Operation',
      kind: 'select',
      value: 'removeDuplicateInputItems',
      required: false,
      noDataExpression: true,
      options: operationOptions,
    },
    {
      key: 'compare',
      label: 'Compare',
      kind: 'select',
      value: 'allFields',
      required: false,
      showWhen: { operation: ['removeDuplicateInputItems'] },
      options: compareOptions,
      description: 'The fields of the input items to compare to see if they are the same',
    },
    {
      key: 'fieldsToExclude',
      label: 'Fields To Exclude',
      kind: 'text',
      value: '',
      required: false,
      requiresDataPath: 'multiple',
      placeholder: 'e.g. email, name',
      showWhen: { compare: ['allFieldsExcept'] },
      description: 'Fields in the input to exclude from the comparison',
    },
    {
      key: 'fieldsToCompare',
      label: 'Fields To Compare',
      kind: 'text',
      value: '',
      required: false,
      requiresDataPath: 'multiple',
      placeholder: 'e.g. email, name',
      showWhen: { compare: ['selectedFields'] },
      description: 'Fields in the input to add to the comparison',
    },
    {
      key: 'logic',
      label: 'Keep Items Where',
      kind: 'select',
      value: 'removeItemsWithAlreadySeenKeyValues',
      required: false,
      noDataExpression: true,
      showWhen: { operation: ['removeItemsSeenInPreviousExecutions'] },
      options: logicOptions,
      description:
        'How to select input items to remove by comparing them with key values previously processed',
    },
    {
      key: 'dedupeValue',
      label: 'Value to Dedupe On',
      kind: 'text',
      value: '',
      required: true,
      placeholder: 'e.g. ID',
      showWhen: {
        operation: ['removeItemsSeenInPreviousExecutions'],
        logic: ['removeItemsWithAlreadySeenKeyValues'],
      },
      n8nShowWhen: {
        '/operation': ['removeItemsSeenInPreviousExecutions'],
        logic: ['removeItemsWithAlreadySeenKeyValues'],
      },
      hint: 'The input field value to compare between items',
      description: 'Use an input field (or a combination of fields) that has a unique ID value',
    },
    {
      key: 'incrementalDedupeValue',
      label: 'Value to Dedupe On',
      kind: 'number',
      value: '',
      required: false,
      placeholder: 'e.g. ID',
      showWhen: {
        operation: ['removeItemsSeenInPreviousExecutions'],
        logic: ['removeItemsUpToStoredIncrementalKey'],
      },
      n8nShowWhen: {
        '/operation': ['removeItemsSeenInPreviousExecutions'],
        logic: ['removeItemsUpToStoredIncrementalKey'],
      },
      hint: 'The input field value to compare between items, an incremental value is expected',
      description:
        'Use an input field (or a combination of fields) that has an incremental value',
    },
    {
      key: 'dateDedupeValue',
      label: 'Value to Dedupe On',
      kind: 'text',
      sourceKind: 'dateTime',
      format: 'dateTime',
      value: '',
      required: false,
      placeholder: ' e.g. 2024-08-09T13:44:16Z',
      showWhen: {
        operation: ['removeItemsSeenInPreviousExecutions'],
        logic: ['removeItemsUpToStoredDate'],
      },
      n8nShowWhen: {
        '/operation': ['removeItemsSeenInPreviousExecutions'],
        logic: ['removeItemsUpToStoredDate'],
      },
      hint: 'The input field value to compare between items, a date is expected',
      description: 'Use an input field that has a date value in ISO format',
      simulationNote: 'The date remains text and is never parsed or compared.',
    },
    {
      key: 'mode',
      label: 'Mode',
      kind: 'select',
      value: 'cleanDatabase',
      required: false,
      showWhen: { operation: ['clearDeduplicationHistory'] },
      options: historyModeOptions,
      description:
        'How you want to modify the key values stored on the database. None of these modes removes input items.',
    },
    {
      key: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Field',
      showWhen: {
        operation: [
          'removeDuplicateInputItems',
          'removeItemsSeenInPreviousExecutions',
          'clearDeduplicationHistory',
        ],
      },
      fields: [
        {
          key: 'disableDotNotation',
          label: 'Disable Dot Notation',
          kind: 'boolean',
          value: false,
          required: false,
          showWhen: {
            operation: ['removeDuplicateInputItems'],
            compare: ['allFieldsExcept', 'selectedFields'],
          },
          n8nShowWhen: { '/operation': ['removeDuplicateInputItems'] },
          n8nHideWhen: { '/compare': ['allFields'] },
          description:
            'Whether to disallow referencing child fields using `parent.child` in the field name',
        },
        {
          key: 'removeOtherFields',
          label: 'Remove Other Fields',
          kind: 'boolean',
          value: false,
          required: false,
          showWhen: {
            operation: ['removeDuplicateInputItems'],
            compare: ['allFieldsExcept', 'selectedFields'],
          },
          n8nShowWhen: { '/operation': ['removeDuplicateInputItems'] },
          n8nHideWhen: { '/compare': ['allFields'] },
          description:
            'Whether to remove any fields that are not being compared. If disabled, will keep the values from the first of the duplicates.',
        },
        {
          key: 'scope',
          label: 'Scope',
          kind: 'select',
          value: 'node',
          required: false,
          showWhen: {
            operation: [
              'clearDeduplicationHistory',
              'removeItemsSeenInPreviousExecutions',
            ],
          },
          n8nShowWhen: {
            '/operation': [
              'clearDeduplicationHistory',
              'removeItemsSeenInPreviousExecutions',
            ],
          },
          description:
            'If set to ‘workflow,’ key values will be shared across all nodes in the workflow. If set to ‘node,’ key values will be specific to this node.',
          options: [
            {
              label: 'Workflow',
              value: 'workflow',
              description: 'Deduplication info will be shared by all the nodes in the workflow',
            },
            {
              label: 'Node',
              value: 'node',
              description: 'Deduplication info will be stored only for this node',
            },
          ],
        },
        {
          key: 'historySize',
          label: 'History Size',
          kind: 'number',
          value: 10000,
          required: false,
          showWhen: {
            operation: ['removeItemsSeenInPreviousExecutions'],
            logic: ['removeItemsWithAlreadySeenKeyValues'],
          },
          n8nShowWhen: {
            '/operation': ['removeItemsSeenInPreviousExecutions'],
            '/logic': ['removeItemsWithAlreadySeenKeyValues'],
          },
          hint: 'The max number of past items to store for deduplication',
        },
      ],
    },
  ],
  hints: [
    {
      message: 'The dedupe key set in “Value to Dedupe On” has no value',
      displayCondition:
        '={{ $parameter["operation"] === "removeItemsSeenInPreviousExecutions" && ($parameter["logic"] === "removeItemsWithAlreadySeenKeyValues" && $parameter["dedupeValue"] === undefined) || ($parameter["logic"] === "removeItemsUpToStoredIncrementalKey" && $parameter["incrementalDedupeValue"] === undefined) || ($parameter["logic"] === "removeItemsUpToStoredDate" && $parameter["dateDedupeValue"] === undefined) }}',
      whenToDisplay: 'beforeExecution',
      location: 'outputPane',
      inert: true,
    },
  ],
  operationParity: {
    expected: [
      'removeDuplicateInputItems',
      'removeItemsSeenInPreviousExecutions',
      'clearDeduplicationHistory',
    ],
    represented: operationOptions.map(({ value }) => value),
    default: 'removeDuplicateInputItems',
  },
  modeParity: {
    compare: {
      expected: ['allFields', 'allFieldsExcept', 'selectedFields'],
      represented: compareOptions.map(({ value }) => value),
      default: 'allFields',
    },
    acrossExecutions: {
      expected: [
        'removeItemsWithAlreadySeenKeyValues',
        'removeItemsUpToStoredIncrementalKey',
        'removeItemsUpToStoredDate',
      ],
      represented: logicOptions.map(({ value }) => value),
      default: 'removeItemsWithAlreadySeenKeyValues',
    },
    history: {
      expected: ['cleanDatabase'],
      represented: historyModeOptions.map(({ value }) => value),
      default: 'cleanDatabase',
    },
  },
  portMetadata: {
    sourceDeclaredInputs: ['main'],
    sourceDeclaredOutputs: ['main'],
    sourceOutputNames: ['Kept', 'Discarded'],
    visibleOutputs: ['Kept', 'Discarded'],
    operationBehavior: {
      removeDuplicateInputItems: ['Kept'],
      removeItemsSeenInPreviousExecutions: ['Kept', 'Discarded'],
      clearDeduplicationHistory: ['Kept'],
    },
  },
  platformGaps: [
    'n8n declares one main output type plus two output names; the catalog expands those names into the visible Kept and Discarded ports.',
    'Negative source visibility for the two within-input options is normalized to positive compare-mode conditions while retaining n8nShowWhen and n8nHideWhen.',
    'The dateTime field is represented by an inert text control because the catalog has no native n8n dateTime editor.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'dateDedupeValue',
      sourceType: 'dateTime',
      normalizedKind: 'text',
      reason: 'The ISO date remains authoring text and is never parsed.',
    },
  ],
  simulation: {
    configurationOnly: true,
    comparesItems: false,
    removesDuplicates: false,
    parsesDates: false,
    readsHistory: false,
    storesHistory: false,
    clearsHistory: false,
    routesItems: false,
    networkAccess: false,
    apiCalls: false,
    workflowExecution: false,
    voice: false,
  },
  output: {},
};

export default removeDuplicates;
