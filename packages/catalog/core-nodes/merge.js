// Editor-only descriptor for n8n's Merge v3.2 node. It models the complete
// authoring surface and port configuration without combining or querying data.

const inputCountOptions = Array.from({ length: 9 }, (_, index) => ({
  label: String(index + 2),
  value: index + 2,
}));

const defaultClashValue = {
  values: {
    resolveClash: 'preferLast',
    mergeMode: 'deepMerge',
    overrideEmpty: false,
  },
};

const defaultResolveClashOptions = [
  { label: 'Always Add Input Number to Field Names', value: 'addSuffix' },
  { label: 'Prefer Input 1 Version', value: 'preferInput1' },
  { label: 'Prefer Input 2 Version', value: 'preferLast' },
];

const manyInputResolveClashOptions = [
  { label: 'Always Add Input Number to Field Names', value: 'addSuffix' },
  { label: 'Use Earliest Version', value: 'preferInput1' },
];

const inputSelectorOptions = Array.from({ length: 10 }, (_, index) => ({
  label: String(index + 1),
  value: index + 1,
}));

const multipleMatchesOptions = [
  {
    label: 'Include All Matches',
    value: 'all',
    description: 'Output multiple items if there are multiple matches',
  },
  {
    label: 'Include First Match Only',
    value: 'first',
    description: 'Only ever output a single item per match',
  },
];

const fuzzyCompareField = {
  key: 'fuzzyCompare',
  sourceN8nKey: 'fuzzyCompare',
  label: 'Fuzzy Compare',
  kind: 'boolean',
  value: false,
  required: false,
  description:
    "Whether to tolerate small type differences when comparing fields. E.g. the number 3 and the string '3' are treated as the same.",
};

function numberInputsField(key, n8nKey, showWhen) {
  return {
    key,
    n8nKey,
    sourceN8nKey: 'numberInputs',
    label: 'Number of Inputs',
    kind: 'select',
    value: 2,
    required: false,
    noDataExpression: true,
    validateType: 'number',
    showWhen,
    options: inputCountOptions,
    description:
      'The number of data inputs you want to merge. The node waits for all connected inputs to be executed.',
  };
}

function clashHandlingField({ key, n8nKey, value = defaultClashValue, showWhen }) {
  return {
    key,
    n8nKey,
    sourceN8nKey: 'clashHandling',
    label: 'Clash Handling',
    kind: 'fixedCollection',
    value,
    sourceDefault: value,
    required: false,
    collectionKey: 'values',
    collectionLabel: 'Values',
    showWhen,
    fields: [
      {
        key: 'resolveClash',
        n8nKey: `${n8nKey}.values.resolveClash`,
        sourceN8nKey: 'resolveClash',
        label: 'When Field Values Clash',
        kind: 'select',
        value: '',
        required: false,
        options: defaultResolveClashOptions,
        loadOptionsMethod: 'getResolveClashOptions',
        loadOptionsDependsOn: ['numberInputs'],
        dynamicOptionsByInputCount: [
          { min: 2, max: 2, options: defaultResolveClashOptions },
          { min: 3, max: 10, options: manyInputResolveClashOptions },
        ],
      },
      {
        key: 'mergeMode',
        n8nKey: `${n8nKey}.values.mergeMode`,
        sourceN8nKey: 'mergeMode',
        label: 'Merging Nested Fields',
        kind: 'select',
        value: 'deepMerge',
        required: false,
        options: [
          {
            label: 'Deep Merge',
            value: 'deepMerge',
            description: 'Merge at every level of nesting',
          },
          {
            label: 'Shallow Merge',
            value: 'shallowMerge',
            description:
              'Merge at the top level only (all nested fields will come from the same input)',
          },
        ],
        hint: 'How to merge when there are sub-fields below the top-level ones',
        showWhen: { resolveClash: ['', 'preferInput1', 'preferLast'] },
        n8nShowWhen: { resolveClash: [{ _cnd: { not: 'addSuffix' } }] },
      },
      {
        key: 'overrideEmpty',
        n8nKey: `${n8nKey}.values.overrideEmpty`,
        sourceN8nKey: 'overrideEmpty',
        label: 'Minimize Empty Fields',
        kind: 'boolean',
        value: false,
        required: false,
        description:
          "Whether to override the preferred input version for a field if it is empty and the other version isn't. Here 'empty' means undefined, null or an empty string.",
        showWhen: { resolveClash: ['', 'preferInput1', 'preferLast'] },
        n8nShowWhen: { resolveClash: [{ _cnd: { not: 'addSuffix' } }] },
      },
    ],
  };
}

const modeOptions = [
  {
    label: 'Append',
    value: 'append',
    description: 'Output items of each input, one after the other',
    builderHint: {
      propertyHint:
        'Append items from multiple branches into a single list sequentially. Waits for all running branches. Supports any number of inputs. @example input1: [{ x }] [{ y }] input2: [{ z }]. Output: [{ x }, { y }, { z }]. Next node will execute 3 times with each item. Set executeOnce on next node to execute once.',
    },
  },
  {
    label: 'Combine',
    value: 'combine',
    description: 'Merge matching items together',
    builderHint: {
      propertyHint:
        'Combines items from 2 branches. Waits for both to have input data. @example **combine by position** input1: [{ x }, { y }] input2: [{ z }] output: [{ x, y }, { x: undefined, y: undefined, z }] @example **combine by key** input1: [{ id: 1, x }, { id: 2, y }] input2: [{ id: 1, z }] output: [{ id: 1, x, z }, { id: 2, y }]',
    },
  },
  {
    label: 'SQL Query',
    value: 'combineBySql',
    description: 'Write a query to do the merge',
    builderHint: {
      propertyHint:
        'Need to combine more than 2 branches? Use SQL Query for advanced operations. Waits for all inputs. @example Results depend on query - can filter, join, aggregate',
    },
  },
  {
    label: 'Choose Branch',
    value: 'chooseBranch',
    description: 'Output data from a specific branch, without modifying it',
    builderHint: {
      propertyHint:
        'Do you need to select data from only ONE specific input and discard the others? Use Choose Branch after conditional nodes to pick which path to continue. Waits for all inputs. @example 3 items from Input A + 2 items from Input B, choose Input A → 3 items',
    },
  },
];

const merge = {
  type: 'merge',
  n8nType: 'n8n-nodes-base.merge',
  n8nVersion: 3.2,
  defaultVersion: 3.2,
  versionHistory: [1, 2, 2.1, 3, 3.1, 3.2],
  label: 'Merge',
  subtitle: '={{$parameter["mode"]}}',
  description: 'Merges data of multiple streams once data from both is available',
  category: 'core',
  categories: ['Core Nodes'],
  subcategory: 'Flow',
  subcategories: ['Flow', 'Data Transformation'],
  group: ['transform'],
  inputs: [
    { type: 'main', label: 'Input 1', index: 0 },
    { type: 'main', label: 'Input 2', index: 1 },
  ],
  inputsExpression: '={{(${configuredInputs})($parameter)}}',
  dynamicInputs: {
    enabled: true,
    countParameter: 'numberInputs',
    countSourceN8nKey: 'numberInputs',
    normalizedCountParameters: {
      append: 'appendNumberInputs',
      combineByPosition: 'positionNumberInputs',
      combineBySql: 'sqlNumberInputs',
      chooseBranch: 'chooseBranchNumberInputs',
    },
    defaultCount: 2,
    min: 2,
    max: 10,
    type: 'main',
    labelTemplate: 'Input {{index}}',
    labels: inputSelectorOptions.map(({ label }) => `Input ${label}`),
    modes: ['append', 'combineByPosition', 'combineBySql', 'chooseBranch'],
    fixedTwoInputModes: ['combineByFields', 'combineAll'],
  },
  requiredInputs: 1,
  requiredInputsExpression: '={{ $parameter["mode"] === "chooseBranch" ? [0, 1] : 1 }}',
  requiredInputsByMode: { chooseBranch: [0, 1], default: 1 },
  outputs: ['main'],
  icon: '/node-icons/merge.svg',
  n8nIcon: 'node:merge',
  iconColor: 'azure',
  iconHex: '#54B8C9',
  iconColorLight: '#54B8C9',
  iconColorDark: '#7DD6E3',
  iconMode: 'currentColor',
  aliases: ['Join', 'Concatenate', 'Wait'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.merge/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Merge/Merge.node.ts',
    currentVersionPath: 'packages/nodes-base/nodes/Merge/v3/MergeV3.node.ts',
    versionDescriptionPath:
      'packages/nodes-base/nodes/Merge/v3/actions/versionDescription.ts',
    metadataPath: 'packages/nodes-base/nodes/Merge/Merge.node.json',
    descriptionPaths: [
      'packages/nodes-base/nodes/Merge/v3/actions/mode/index.ts',
      'packages/nodes-base/nodes/Merge/v3/actions/mode/append.ts',
      'packages/nodes-base/nodes/Merge/v3/actions/mode/combineAll.ts',
      'packages/nodes-base/nodes/Merge/v3/actions/mode/combineByFields.ts',
      'packages/nodes-base/nodes/Merge/v3/actions/mode/combineByPosition.ts',
      'packages/nodes-base/nodes/Merge/v3/actions/mode/combineBySql.ts',
      'packages/nodes-base/nodes/Merge/v3/actions/mode/chooseBranch.ts',
      'packages/nodes-base/nodes/Merge/v3/helpers/descriptions.ts',
      'packages/nodes-base/nodes/Merge/v3/helpers/utils.ts',
      'packages/nodes-base/nodes/Merge/v3/methods/loadOptions.ts',
    ],
    currentDescriptionImports: [
      './mode',
      '../helpers/utils',
      './append',
      './chooseBranch',
      './combineAll',
      './combineByFields',
      './combineByPosition',
      './combineBySql',
      '../../helpers/descriptions',
    ],
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/merge.svg',
  },
  defaults: { name: 'Merge' },
  builderHint: {
    searchHint:
      'Mode selection is the single most consequential decision on this node — the wrong mode silently drops or duplicates items rather than erroring. Pick by data shape: `append` to concatenate items from parallel branches; `combineByPosition` only when both branches emit the same number of items in the same order; `combineByFields` to join by a matching key (default; usually correct for "merge by ID"); `combineBySql` for >2 inputs or aggregation; `chooseBranch` to discard all but one input. Read each mode\'s @builderHint before picking.',
  },
  params: [
    {
      key: 'mode',
      n8nKey: 'mode',
      label: 'Mode',
      kind: 'select',
      value: 'append',
      required: false,
      noDataExpression: true,
      options: modeOptions,
      description: 'How input data should be merged',
    },
    {
      key: 'combineBy',
      n8nKey: 'combineBy',
      label: 'Combine By',
      kind: 'select',
      value: 'combineByFields',
      required: false,
      noDataExpression: true,
      showWhen: { mode: ['combine'] },
      options: [
        {
          label: 'Matching Fields',
          value: 'combineByFields',
          description: 'Combine items with the same field values',
        },
        {
          label: 'Position',
          value: 'combineByPosition',
          description: 'Combine items based on their order',
        },
        {
          label: 'All Possible Combinations',
          value: 'combineAll',
          description: 'Every pairing of every two items (cross join)',
        },
      ],
      description: 'How input data should be merged',
    },
    numberInputsField('appendNumberInputs', 'append.numberInputs', { mode: ['append'] }),
    numberInputsField('positionNumberInputs', 'combineByPosition.numberInputs', {
      mode: ['combine'],
      combineBy: ['combineByPosition'],
    }),
    numberInputsField('sqlNumberInputs', 'combineBySql.numberInputs', {
      mode: ['combineBySql'],
    }),
    numberInputsField('chooseBranchNumberInputs', 'chooseBranch.numberInputs', {
      mode: ['chooseBranch'],
    }),
    {
      key: 'advanced',
      n8nKey: 'advanced',
      label: 'Fields To Match Have Different Names',
      kind: 'boolean',
      value: false,
      required: false,
      showWhen: { mode: ['combine'], combineBy: ['combineByFields'] },
      description: 'Whether name(s) of field to match are different in input 1 and input 2',
    },
    {
      key: 'fieldsToMatchString',
      n8nKey: 'fieldsToMatchString',
      label: 'Fields to Match',
      kind: 'text',
      value: '',
      required: false,
      placeholder: 'e.g. id, name',
      hint: 'Drag or type the input field name',
      requiresDataPath: 'multiple',
      showWhen: {
        mode: ['combine'],
        combineBy: ['combineByFields'],
        advanced: [false],
      },
      description: 'Specify the fields to use for matching input items',
    },
    {
      key: 'mergeByFields',
      n8nKey: 'mergeByFields',
      label: 'Fields to Match',
      kind: 'fixedCollection',
      value: { values: [{ field1: '', field2: '' }] },
      required: false,
      multiple: true,
      collectionKey: 'values',
      collectionLabel: 'Values',
      addLabel: 'Add Fields to Match',
      showWhen: {
        mode: ['combine'],
        combineBy: ['combineByFields'],
        advanced: [true],
      },
      description: 'Specify the fields to use for matching input items',
      fields: [
        {
          key: 'field1',
          n8nKey: 'mergeByFields.values.field1',
          sourceN8nKey: 'field1',
          label: 'Input 1 Field',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. id',
          hint: 'Drag or type the input field name',
          requiresDataPath: 'single',
        },
        {
          key: 'field2',
          n8nKey: 'mergeByFields.values.field2',
          sourceN8nKey: 'field2',
          label: 'Input 2 Field',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. id',
          hint: 'Drag or type the input field name',
          requiresDataPath: 'single',
        },
      ],
    },
    {
      key: 'joinMode',
      n8nKey: 'joinMode',
      label: 'Output Type',
      kind: 'select',
      value: 'keepMatches',
      required: false,
      showWhen: { mode: ['combine'], combineBy: ['combineByFields'] },
      description: 'How to select the items to send to output',
      options: [
        {
          label: 'Keep Matches',
          value: 'keepMatches',
          description: 'Items that match, merged together (inner join)',
        },
        {
          label: 'Keep Non-Matches',
          value: 'keepNonMatches',
          description: "Items that don't match",
        },
        {
          label: 'Keep Everything',
          value: 'keepEverything',
          description: "Items that match merged together, plus items that don't match (outer join)",
        },
        {
          label: 'Enrich Input 1',
          value: 'enrichInput1',
          description: 'All of input 1, with data from input 2 added in (left join)',
        },
        {
          label: 'Enrich Input 2',
          value: 'enrichInput2',
          description: 'All of input 2, with data from input 1 added in (right join)',
        },
      ],
    },
    {
      key: 'outputDataFromMatches',
      n8nKey: 'combineByFields.outputDataFrom.keepMatches',
      sourceN8nKey: 'outputDataFrom',
      label: 'Output Data From',
      kind: 'select',
      value: 'both',
      required: false,
      showWhen: {
        mode: ['combine'],
        combineBy: ['combineByFields'],
        joinMode: ['keepMatches'],
      },
      options: [
        { label: 'Both Inputs Merged Together', value: 'both' },
        { label: 'Input 1', value: 'input1' },
        { label: 'Input 2', value: 'input2' },
      ],
    },
    {
      key: 'outputDataFromNonMatches',
      n8nKey: 'combineByFields.outputDataFrom.keepNonMatches',
      sourceN8nKey: 'outputDataFrom',
      label: 'Output Data From',
      kind: 'select',
      value: 'both',
      required: false,
      showWhen: {
        mode: ['combine'],
        combineBy: ['combineByFields'],
        joinMode: ['keepNonMatches'],
      },
      options: [
        { label: 'Both Inputs Appended Together', value: 'both' },
        { label: 'Input 1', value: 'input1' },
        { label: 'Input 2', value: 'input2' },
      ],
    },
    {
      key: 'combineByFieldsOptions',
      n8nKey: 'combineByFields.options',
      sourceN8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { mode: ['combine'], combineBy: ['combineByFields'] },
      fields: [
        clashHandlingField({
          key: 'clashHandlingJoined',
          n8nKey: 'combineByFields.options.clashHandling.joined',
          showWhen: { joinMode: ['keepEverything', 'enrichInput1', 'enrichInput2'] },
        }),
        clashHandlingField({
          key: 'clashHandlingMatches',
          n8nKey: 'combineByFields.options.clashHandling.matches',
          showWhen: { joinMode: ['keepMatches'], outputDataFromMatches: ['both'] },
        }),
        {
          key: 'disableDotNotation',
          n8nKey: 'combineByFields.options.disableDotNotation',
          sourceN8nKey: 'disableDotNotation',
          label: 'Disable Dot Notation',
          kind: 'boolean',
          value: false,
          required: false,
          description:
            'Whether to disallow referencing child fields using `parent.child` in the field name',
        },
        {
          ...fuzzyCompareField,
          n8nKey: 'combineByFields.options.fuzzyCompare',
        },
        {
          key: 'multipleMatchesMatches',
          n8nKey: 'combineByFields.options.multipleMatches.matches',
          sourceN8nKey: 'multipleMatches',
          label: 'Multiple Matches',
          kind: 'select',
          value: 'all',
          required: false,
          options: multipleMatchesOptions,
          showWhen: { joinMode: ['keepMatches'], outputDataFromMatches: ['both'] },
        },
        {
          key: 'multipleMatchesJoined',
          n8nKey: 'combineByFields.options.multipleMatches.joined',
          sourceN8nKey: 'multipleMatches',
          label: 'Multiple Matches',
          kind: 'select',
          value: 'all',
          required: false,
          options: multipleMatchesOptions,
          showWhen: { joinMode: ['enrichInput1', 'enrichInput2', 'keepEverything'] },
        },
      ],
    },
    {
      key: 'combineAllOptions',
      n8nKey: 'combineAll.options',
      sourceN8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { mode: ['combine'], combineBy: ['combineAll'] },
      fields: [
        clashHandlingField({
          key: 'clashHandling',
          n8nKey: 'combineAll.options.clashHandling',
        }),
        { ...fuzzyCompareField, n8nKey: 'combineAll.options.fuzzyCompare' },
      ],
    },
    {
      key: 'combineByPositionOptions',
      n8nKey: 'combineByPosition.options',
      sourceN8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { mode: ['combine'], combineBy: ['combineByPosition'] },
      fields: [
        clashHandlingField({
          key: 'clashHandling',
          n8nKey: 'combineByPosition.options.clashHandling',
          value: { values: { resolveClash: 'addSuffix' } },
        }),
        {
          key: 'includeUnpaired',
          n8nKey: 'combineByPosition.options.includeUnpaired',
          sourceN8nKey: 'includeUnpaired',
          label: 'Include Any Unpaired Items',
          kind: 'boolean',
          value: false,
          required: false,
          description:
            'Whether unpaired items should be included in the result when there are differing numbers of items among the inputs',
        },
      ],
    },
    {
      key: 'query',
      n8nKey: 'query',
      label: 'Query',
      kind: 'textarea',
      sourceKind: 'string',
      editor: 'sqlEditor',
      rows: 5,
      value: 'SELECT * FROM input1 LEFT JOIN input2 ON input1.name = input2.id',
      required: true,
      noDataExpression: true,
      showWhen: { mode: ['combineBySql'] },
      description: 'Input data available as tables with corresponding number, e.g. input1, input2',
      hint: 'Supports <a href="https://github.com/alasql/alasql/wiki/Supported-SQL-statements" target="_blank">most</a> of the SQL-99 language',
      simulationNote: 'SQL text is stored only and is never parsed or run.',
    },
    {
      key: 'queryParametersNotice',
      n8nKey: 'queryParametersNotice',
      label:
        'Use query parameters for dynamic values. Expressions in the query text become part of the SQL. Add values in <b>Options > Query Parameters</b> and reference them with <code>?</code> placeholders.',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: { mode: ['combineBySql'] },
    },
    {
      key: 'sqlOptions',
      n8nKey: 'combineBySql.options',
      sourceN8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { mode: ['combineBySql'] },
      fields: [
        {
          key: 'emptyQueryResult',
          n8nKey: 'combineBySql.options.emptyQueryResult',
          sourceN8nKey: 'emptyQueryResult',
          label: 'Empty Query Result',
          kind: 'select',
          value: 'empty',
          required: false,
          options: [
            { label: 'Success', value: 'success' },
            { label: 'Empty Result', value: 'empty' },
          ],
          description: 'What to return if the query executed successfully but returned no results',
          n8nShowWhen: { '@version': [3.2] },
        },
        {
          key: 'queryParameters',
          n8nKey: 'combineBySql.options.queryParameters',
          sourceN8nKey: 'queryParameters',
          label: 'Query Parameters',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'value1,value2,value3',
          description:
            'Comma-separated list of values to use as query parameters. Reference them in the query with ? placeholders. <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.merge/#use-query-parameters" target="_blank">More info</a>.',
          hint: 'Reference query parameters with ? placeholders',
        },
      ],
    },
    {
      key: 'chooseBranchMode',
      n8nKey: 'chooseBranchMode',
      label: 'Output Type',
      kind: 'select',
      value: 'waitForAll',
      required: false,
      showWhen: { mode: ['chooseBranch'] },
      options: [{ label: 'Wait for All Inputs to Arrive', value: 'waitForAll' }],
    },
    {
      key: 'chooseBranchOutput',
      n8nKey: 'chooseBranch.output',
      sourceN8nKey: 'output',
      label: 'Output',
      kind: 'select',
      value: 'specifiedInput',
      required: false,
      showWhen: { mode: ['chooseBranch'], chooseBranchMode: ['waitForAll'] },
      options: [
        { label: 'Data of Specified Input', value: 'specifiedInput' },
        { label: 'A Single, Empty Item', value: 'empty' },
      ],
    },
    {
      key: 'useDataOfInput',
      n8nKey: 'useDataOfInput',
      label: 'Use Data of Input',
      kind: 'select',
      value: 1,
      required: false,
      showWhen: { mode: ['chooseBranch'], chooseBranchOutput: ['specifiedInput'] },
      options: inputSelectorOptions,
      min: 1,
      validateType: 'number',
      loadOptionsMethod: 'getInputs',
      loadOptionsDependsOn: ['numberInputs'],
      dynamicMaxFrom: 'chooseBranchNumberInputs',
      description: 'The number of the input to use data of',
    },
  ],
  unsupportedVisibleTypes: [
    {
      sourceN8nKey: 'inputs',
      sourceType: 'expression-backed dynamic ports',
      normalizedKind: 'dynamicInputs metadata',
      reason: 'Named Input 1 through Input 10 ports are described without evaluating the source expression.',
    },
    {
      sourceN8nKey: 'numberInputs',
      sourceType: 'branch-reused parameter',
      normalizedKeys: [
        'appendNumberInputs',
        'positionNumberInputs',
        'sqlNumberInputs',
        'chooseBranchNumberInputs',
      ],
    },
    {
      sourceN8nKey: 'options',
      sourceType: 'mode-specific collections',
      normalizedKeys: [
        'combineByFieldsOptions',
        'combineAllOptions',
        'combineByPositionOptions',
        'sqlOptions',
      ],
    },
    {
      sourceN8nKey: 'getResolveClashOptions/getInputs',
      sourceType: 'loadOptions methods',
      normalizedKind: 'bounded select options',
      reason: 'Dynamic options are materialized for the source-supported 2 to 10 input range.',
    },
  ],
  simulation: {
    configurationOnly: true,
    combinesData: false,
    evaluatesExpressions: false,
    executesSql: false,
  },
  output: { customerId: 'CUS-101', email: 'aarav@example.com', plan: 'Pro' },
};

export default merge;
