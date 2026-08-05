// Editor-only descriptor for n8n's Summarize v1.1 core node. It intentionally
// uses `summarize-items` so it cannot replace Judge's legacy AI `summarize` type.
// Aggregation, grouping, output formatting, and all data access remain inert.

const aggregationMethods = [
  { label: 'Append', value: 'append' },
  { label: 'Average', value: 'average' },
  { label: 'Concatenate', value: 'concatenate' },
  { label: 'Count', value: 'count' },
  { label: 'Count Unique', value: 'countUnique' },
  { label: 'Max', value: 'max' },
  { label: 'Min', value: 'min' },
  { label: 'Sum', value: 'sum' },
];

const separatorOptions = [
  { label: 'Comma', value: ',' },
  { label: 'Comma and Space', value: ', ' },
  { label: 'New Line', value: '\n' },
  { label: 'None', value: '' },
  { label: 'Space', value: ' ' },
  { label: 'Other', value: 'other' },
];

const summarizeItems = {
  type: 'summarize-items',
  n8nType: 'n8n-nodes-base.summarize',
  n8nVersion: 1.1,
  defaultVersion: 1.1,
  versionHistory: [1, 1.1],
  label: 'Summarize',
  defaultName: 'Summarize',
  subtitle: '',
  description: 'Sum, count, max, etc. across items',
  details:
    'Use the Summarize node to aggregate items together, in a manner similar to Excel pivot tables.',
  category: 'core',
  categories: ['Core Nodes'],
  subcategory: 'Data Transformation',
  subcategories: ['Data Transformation'],
  group: ['transform'],
  inputs: ['main'],
  outputs: ['main'],
  icon: '/node-icons/summarize-items.svg',
  n8nIcon: 'node:summarize',
  iconColor: 'amber',
  iconHex: '#FF9922',
  iconColorLight: '#FF9922',
  iconColorDark: '#FFB966',
  iconMode: 'currentColor',
  aliases: [
    'Append',
    'Array',
    'Average',
    'Concatenate',
    'Count',
    'Group',
    'Item',
    'List',
    'Max',
    'Min',
    'Pivot',
    'Sum',
    'Summarise',
    'Summarize',
    'Transform',
    'Unique',
  ],
  docs:
    'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.summarize/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Transform/Summarize/Summarize.node.ts',
    descriptionPaths: [
      'packages/nodes-base/nodes/Transform/Summarize/Summarize.node.ts',
    ],
    directDescriptionImports: [],
    utilsPath: 'packages/nodes-base/nodes/Transform/Summarize/utils.ts',
    metadataPath: 'packages/nodes-base/nodes/Transform/Summarize/Summarize.node.json',
    legacyIconPath: 'packages/nodes-base/nodes/Transform/Summarize/summarize.svg',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/summarize.svg',
    directImports: [
      {
        module: 'n8n-workflow',
        names: [
          'IExecuteFunctions',
          'INodeExecutionData',
          'INodeType',
          'INodeTypeDescription',
          'NodeConnectionTypes',
          'NodeExecutionHint',
          'NodeOperationError',
        ],
        typeOnlyNames: [
          'IExecuteFunctions',
          'INodeExecutionData',
          'INodeType',
          'INodeTypeDescription',
          'NodeExecutionHint',
        ],
      },
      {
        module: './utils',
        names: [
          'Aggregations',
          'NUMERICAL_AGGREGATIONS',
          'SummarizeOptions',
          'aggregateAndSplitData',
          'checkIfFieldExists',
          'fieldValueGetter',
          'flattenAggregationResultToArray',
          'flattenAggregationResultToObject',
        ],
        typeOnlyNames: ['Aggregations', 'SummarizeOptions'],
      },
    ],
  },
  defaults: { name: 'Summarize' },
  credentials: [],
  params: [
    {
      key: 'fieldsToSummarize',
      n8nKey: 'fieldsToSummarize',
      label: 'Fields to Summarize',
      kind: 'fixedCollection',
      sourceKind: 'fixedCollection',
      value: { values: [{ aggregation: 'count', field: '' }] },
      required: false,
      collectionKey: 'values',
      collectionLabel: 'Field',
      multiple: true,
      addLabel: 'Add Field',
      fields: [
        {
          key: 'aggregation',
          n8nKey: 'fieldsToSummarize.values.aggregation',
          sourceN8nKey: 'aggregation',
          label: 'Aggregation',
          kind: 'select',
          value: 'count',
          required: false,
          options: aggregationMethods,
          description: 'How to combine the values of the field you want to summarize',
        },
        {
          key: 'field',
          n8nKey: 'fieldsToSummarize.values.field',
          sourceN8nKey: 'field',
          label: 'Field',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. cost',
          hint: ' Enter the field name as text',
          requiresDataPath: 'single',
          description: 'The name of an input field that you want to summarize',
          descriptionByAggregation: {
            append: 'The name of an input field that you want to summarize',
            concatenate: 'The name of an input field that you want to summarize',
            average:
              'The name of an input field that you want to summarize. The field should contain numerical values; null, undefined, empty strings would be ignored.',
            sum:
              'The name of an input field that you want to summarize. The field should contain numerical values; null, undefined, empty strings would be ignored.',
            count:
              'The name of an input field that you want to summarize; null, undefined, empty strings would be ignored',
            countUnique:
              'The name of an input field that you want to summarize; null, undefined, empty strings would be ignored',
            max:
              'The name of an input field that you want to summarize; null, undefined, empty strings would be ignored',
            min:
              'The name of an input field that you want to summarize; null, undefined, empty strings would be ignored',
          },
          sourceBranches: [
            {
              description: 'The name of an input field that you want to summarize',
              n8nHideWhen: {
                aggregation: ['average', 'sum', 'countUnique', 'count', 'max', 'min'],
              },
            },
            {
              description:
                'The name of an input field that you want to summarize. The field should contain numerical values; null, undefined, empty strings would be ignored.',
              showWhen: { aggregation: ['average', 'sum'] },
            },
            {
              description:
                'The name of an input field that you want to summarize; null, undefined, empty strings would be ignored',
              showWhen: { aggregation: ['countUnique', 'count', 'max', 'min'] },
            },
          ],
        },
        {
          key: 'includeEmpty',
          n8nKey: 'fieldsToSummarize.values.includeEmpty',
          sourceN8nKey: 'includeEmpty',
          label: 'Include Empty Values',
          kind: 'boolean',
          value: false,
          required: false,
          showWhen: {
            aggregation: ['append', 'concatenate', 'count', 'countUnique'],
          },
        },
        {
          key: 'separateBy',
          n8nKey: 'fieldsToSummarize.values.separateBy',
          sourceN8nKey: 'separateBy',
          label: 'Separator',
          kind: 'select',
          value: ',',
          required: false,
          options: separatorOptions,
          hint: 'What to insert between values',
          showWhen: { aggregation: ['concatenate'] },
        },
        {
          key: 'customSeparator',
          n8nKey: 'fieldsToSummarize.values.customSeparator',
          sourceN8nKey: 'customSeparator',
          label: 'Custom Separator',
          kind: 'text',
          value: '',
          required: false,
          showWhen: { aggregation: ['concatenate'], separateBy: ['other'] },
        },
      ],
      simulationNote:
        'Aggregation rows remain configuration only. No field is read and no summary is calculated.',
    },
    {
      key: 'fieldsToSplitBy',
      n8nKey: 'fieldsToSplitBy',
      label: 'Fields to Split By',
      kind: 'text',
      value: '',
      required: false,
      placeholder: 'e.g. country, city',
      description: 'The name of the input fields that you want to split the summary by',
      hint: 'Enter the name of the fields as text (separated by commas)',
      requiresDataPath: 'multiple',
      labelByOptionPath: {
        'options.outputFormat': {
          singleItem: 'Fields to Group By',
          default: 'Fields to Split By',
        },
      },
      sourceBranches: [
        {
          label: 'Fields to Split By',
          n8nHideWhen: { '/options.outputFormat': ['singleItem'] },
        },
        {
          label: 'Fields to Group By',
          showWhen: { '/options.outputFormat': ['singleItem'] },
        },
      ],
      simulationNote:
        'Comma-separated field names remain text and are never parsed, read, or grouped.',
    },
    {
      key: 'options',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      fields: [
        {
          key: 'disableDotNotation',
          n8nKey: 'options.disableDotNotation',
          sourceN8nKey: 'disableDotNotation',
          label: 'Disable Dot Notation',
          kind: 'boolean',
          value: false,
          required: false,
          description:
            'Whether to disallow referencing child fields using `parent.child` in the field name',
        },
        {
          key: 'outputFormat',
          n8nKey: 'options.outputFormat',
          sourceN8nKey: 'outputFormat',
          label: 'Output Format',
          kind: 'select',
          value: 'separateItems',
          required: false,
          options: [
            { label: 'Each Split in a Separate Item', value: 'separateItems' },
            { label: 'All Splits in a Single Item', value: 'singleItem' },
          ],
        },
        {
          key: 'skipEmptySplitFields',
          n8nKey: 'options.skipEmptySplitFields',
          sourceN8nKey: 'skipEmptySplitFields',
          label: 'Ignore items without valid fields to group by',
          kind: 'boolean',
          value: false,
          required: false,
        },
      ],
    },
  ],
  currentVersionSurface: {
    visibleVersion: 1.1,
    rootParameterKeys: ['fieldsToSummarize', 'fieldsToSplitBy', 'options'],
    optionKeys: ['disableDotNotation', 'outputFormat', 'skipEmptySplitFields'],
    legacyHiddenParameters: [
      {
        n8nKey: 'options.continueIfFieldNotFound',
        versions: [1],
        label: 'Continue if Field Not Found',
        kind: 'boolean',
        value: false,
        description:
          "Whether to continue if field to summarize can't be found in any items and return single empty item, otherwise an error would be thrown",
      },
    ],
  },
  methodParity: {
    numericalAggregations: ['average', 'sum'],
    expected: [
      'append',
      'average',
      'concatenate',
      'count',
      'countUnique',
      'max',
      'min',
      'sum',
    ],
    represented: aggregationMethods.map(({ value }) => value),
  },
  docsDrift: [
    'The official docs still describe Continue if Field Not Found. The pinned v1.1 source hides that v1-only option, so it is retained as legacy metadata rather than exposed in the current editor surface.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'fieldsToSummarize.values.field',
      sourceType: 'three repeated conditional string definitions',
      normalizedKind: 'one text field with branch-specific description metadata',
      reason:
        'The source repeats the same field key to change its help text by aggregation. The catalog requires unique recursive keys, so the branches are collapsed without losing their exact copy or conditions.',
    },
    {
      n8nKey: 'fieldsToSplitBy',
      sourceType: 'two repeated conditional string definitions',
      normalizedKind: 'one text field with conditional label metadata',
      reason:
        'The source changes Fields to Split By to Fields to Group By for single-item output. The catalog retains one unique key and records both source branches.',
    },
  ],
  simulation: {
    configurationOnly: true,
    readsInputData: false,
    aggregatesValues: false,
    parsesFieldPaths: false,
    resolvesDotNotation: false,
    groupsItems: false,
    formatsOutput: false,
    emitsItems: false,
    executes: false,
    runtime: false,
    voice: false,
  },
  output: {},
};

export default summarizeItems;
