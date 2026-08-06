// Editor-only descriptor for n8n's Filter v2.3 core node.
// It reproduces the authoring surface, but never evaluates conditions or filters data.

const commonPresenceOperators = [
  { operation: 'exists', label: 'exists', singleValue: true },
  { operation: 'notExists', label: 'does not exist', singleValue: true },
  { operation: 'empty', label: 'is empty', singleValue: true },
  { operation: 'notEmpty', label: 'is not empty', singleValue: true },
];

const operatorGroups = [
  {
    type: 'string',
    label: 'String',
    operators: [
      ...commonPresenceOperators,
      { operation: 'equals', label: 'is equal to' },
      { operation: 'notEquals', label: 'is not equal to' },
      { operation: 'contains', label: 'contains' },
      { operation: 'notContains', label: 'does not contain' },
      { operation: 'startsWith', label: 'starts with' },
      { operation: 'notStartsWith', label: 'does not start with' },
      { operation: 'endsWith', label: 'ends with' },
      { operation: 'notEndsWith', label: 'does not end with' },
      { operation: 'regex', label: 'matches regex' },
      { operation: 'notRegex', label: 'does not match regex' },
    ],
  },
  {
    type: 'number',
    label: 'Number',
    operators: [
      ...commonPresenceOperators,
      { operation: 'equals', label: 'is equal to' },
      { operation: 'notEquals', label: 'is not equal to' },
      { operation: 'gt', label: 'is greater than' },
      { operation: 'lt', label: 'is less than' },
      { operation: 'gte', label: 'is greater than or equal to' },
      { operation: 'lte', label: 'is less than or equal to' },
    ],
  },
  {
    type: 'dateTime',
    label: 'Date & Time',
    operators: [
      ...commonPresenceOperators,
      { operation: 'equals', label: 'is equal to' },
      { operation: 'notEquals', label: 'is not equal to' },
      { operation: 'after', label: 'is after' },
      { operation: 'before', label: 'is before' },
      { operation: 'afterOrEquals', label: 'is after or equal to' },
      { operation: 'beforeOrEquals', label: 'is before or equal to' },
    ],
  },
  {
    type: 'boolean',
    label: 'Boolean',
    operators: [
      ...commonPresenceOperators,
      { operation: 'true', label: 'is true', singleValue: true },
      { operation: 'false', label: 'is false', singleValue: true },
      { operation: 'equals', label: 'is equal to' },
      { operation: 'notEquals', label: 'is not equal to' },
    ],
  },
  {
    type: 'array',
    label: 'Array',
    operators: [
      ...commonPresenceOperators,
      { operation: 'contains', label: 'contains', rightType: 'any' },
      { operation: 'notContains', label: 'does not contain', rightType: 'any' },
      { operation: 'lengthEquals', label: 'length equal to', rightType: 'number' },
      { operation: 'lengthNotEquals', label: 'length not equal to', rightType: 'number' },
      { operation: 'lengthGt', label: 'length greater than', rightType: 'number' },
      { operation: 'lengthLt', label: 'length less than', rightType: 'number' },
      {
        operation: 'lengthGte',
        label: 'length greater than or equal to',
        rightType: 'number',
      },
      {
        operation: 'lengthLte',
        label: 'length less than or equal to',
        rightType: 'number',
      },
    ],
  },
  {
    type: 'object',
    label: 'Object',
    operators: commonPresenceOperators,
  },
];

const operatorOptions = operatorGroups.flatMap((group) =>
  group.operators.map((operator) => ({
    label: `${group.label} · ${operator.label}`,
    value: `${group.type}:${operator.operation}`,
    group: group.label,
    sourceValue: {
      type: group.type,
      operation: operator.operation,
      ...(operator.rightType ? { rightType: operator.rightType } : {}),
      ...(operator.singleValue ? { singleValue: true } : {}),
    },
  })),
);

const twoValueOperatorIds = operatorOptions
  .filter((option) => option.sourceValue.singleValue !== true)
  .map((option) => option.value);

const filter = {
  type: 'filter',
  n8nType: 'n8n-nodes-base.filter',
  n8nVersion: 2.3,
  versionHistory: [1, 2, 2.1, 2.2, 2.3],
  label: 'Filter',
  defaultName: 'Filter',
  subtitle: '',
  description: 'Keep only items matching a condition',
  details:
    'The Filter node can be used to filter items based on a condition. If the condition is met, the item will be passed on to the next node. If the condition is not met, the item will be omitted. Conditions can be combined together by AND(meet all conditions), or OR(meet at least one condition).',
  category: 'core',
  categories: ['Core Nodes'],
  subcategory: 'Flow',
  subcategories: ['Flow', 'Data Transformation'],
  group: ['transform'],
  inputs: ['main'],
  outputs: [
    { type: 'main', label: 'Kept' },
  ],
  parameterPane: 'wide',
  icon: '/node-icons/filter.svg',
  n8nIcon: 'node:filter',
  iconMode: 'currentColor',
  iconColor: 'light-blue',
  iconHex: '#5FABF7',
  aliases: ['Router', 'Filter', 'Condition', 'Logic', 'Boolean', 'Branch'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.filter/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Filter/Filter.node.ts',
    versionPath: 'packages/nodes-base/nodes/Filter/V2/FilterV2.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Filter/Filter.node.json',
    filterControlPath:
      'packages/frontend/editor-ui/src/features/ndv/parameters/components/FilterConditions/FilterConditions.vue',
    operatorRegistryPath:
      'packages/frontend/editor-ui/src/features/ndv/parameters/components/FilterConditions/constants.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/filter.svg',
  },
  defaults: {
    name: 'Filter',
    color: '#229eff',
  },
  builderHint: {
    searchHint:
      'Filter emits 0 items when nothing matches and the chain stops cleanly — no IF gate needed before downstream loops.',
  },
  params: [
    {
      key: 'conditionsCombinator',
      n8nKey: 'conditions.combinator',
      label: 'Combine Conditions',
      kind: 'select',
      sourceKind: 'filter',
      value: 'and',
      required: false,
      noDataExpression: true,
      options: [
        { label: 'AND', value: 'and', description: 'Keep items that meet all conditions' },
        { label: 'OR', value: 'or', description: 'Keep items that meet any condition' },
      ],
      simulationNote:
        'The native filter places this selector between conditions. It is separated here so the current combinator remains authorable.',
    },
    {
      key: 'conditions',
      n8nKey: 'conditions.conditions',
      label: 'Conditions',
      kind: 'fixedCollection',
      sourceKind: 'filter',
      value: {
        conditions: [
          {
            leftValue: '',
            operatorId: 'string:equals',
            rightValue: '',
          },
        ],
      },
      sourceDefault: {},
      required: false,
      collectionKey: 'conditions',
      collectionLabel: 'Condition',
      multiple: true,
      sortable: true,
      maxItems: 10,
      addLabel: 'Add condition',
      fields: [
        {
          key: 'leftValue',
          n8nKey: 'leftValue',
          label: 'Value 1',
          kind: 'expression',
          value: '',
          required: false,
          placeholder: 'value1',
        },
        {
          key: 'operatorId',
          n8nKey: 'operator',
          label: 'Operator',
          kind: 'select',
          value: 'string:equals',
          required: true,
          noDataExpression: true,
          options: operatorOptions,
        },
        {
          key: 'rightValue',
          n8nKey: 'rightValue',
          label: 'Value 2',
          kind: 'expression',
          value: '',
          required: false,
          placeholder: 'value2',
          showWhen: {
            operatorId: twoValueOperatorIds,
          },
        },
      ],
      filter: {
        sourceType: 'filter',
        sourceDefault: {},
        allowedCombinators: ['and', 'or'],
        maxConditions: 10,
        defaultOperator: {
          type: 'string',
          operation: 'equals',
        },
        normalizedUiDefault: {
          combinator: 'and',
          conditions: [
            {
              id: 'generated-by-editor',
              leftValue: '',
              rightValue: '',
              operator: {
                type: 'string',
                operation: 'equals',
              },
            },
          ],
          options: {
            caseSensitive: false,
            leftValue: '',
            typeValidation: 'strict',
            version: 3,
          },
        },
        typeOptions: {
          caseSensitive: '={{!$parameter.options.ignoreCase}}',
          typeValidation:
            '={{ ($nodeVersion < 2.1 ? $parameter.options.looseTypeValidation :  $parameter.looseTypeValidation) ? "loose" : "strict" }}',
          version: '={{ $nodeVersion >= 2.3 ? 3 : $nodeVersion >= 2.2 ? 2 : 1 }}',
        },
        operatorGroups,
        inert: true,
      },
      builderHint: {
        propertyHint: `Must always contain these three sibling keys:
- combinator: 'and' or 'or', default to 'and'
- conditions: [ a list of condition objects ]
- options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 1 }
e.g.: { combinator: 'and', options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: expr('{{ $json.field }}'), rightValue: 'value', operator: { type: 'string', operation: 'equals' } }] }`,
      },
      simulationNote:
        'Conditions are editable configuration only. Expressions are not resolved and no item is tested, kept, or discarded.',
    },
    {
      key: 'looseTypeValidation',
      label: 'Convert types where required',
      kind: 'boolean',
      value: false,
      required: false,
      description:
        'If the type of an expression doesn\'t match the type of the comparison, n8n will try to cast the expression to the required type. E.g. for booleans <code>"false"</code> or <code>0</code> will be cast to <code>false</code>',
    },
    {
      key: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      fields: [
        {
          key: 'ignoreCase',
          label: 'Ignore Case',
          kind: 'boolean',
          value: true,
          required: false,
          description: 'Whether to ignore letter case when evaluating conditions',
        },
      ],
    },
  ],
  unsupportedVisibleTypes: [
    {
      key: 'conditions',
      sourceType: 'filter',
      normalizedKind: 'fixedCollection',
      reason:
        'The catalog has no native n8n filter control, so its typed conditions are represented as an authorable repeatable collection.',
    },
  ],
  simulation: {
    configurationOnly: true,
    resolvesExpressions: false,
    evaluatesConditions: false,
    filtersData: false,
    executes: false,
    voice: false,
  },
  output: { customerId: 'CUS-101', status: 'active', score: 92 },
};

export default filter;
