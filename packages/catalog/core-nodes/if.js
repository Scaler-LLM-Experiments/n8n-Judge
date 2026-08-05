// Editor-only descriptor for n8n's If v2.3 node. The specialized n8n filter
// widget is decomposed into inert authoring controls; no condition is evaluated.

const OPERATOR_LABELS = {
  exists: 'exists',
  notExists: 'does not exist',
  empty: 'is empty',
  notEmpty: 'is not empty',
  equals: 'is equal to',
  notEquals: 'is not equal to',
  contains: 'contains',
  notContains: 'does not contain',
  startsWith: 'starts with',
  notStartsWith: 'does not start with',
  endsWith: 'ends with',
  notEndsWith: 'does not end with',
  regex: 'matches regex',
  notRegex: 'does not match regex',
  gt: 'is greater than',
  lt: 'is less than',
  gte: 'is greater than or equal to',
  lte: 'is less than or equal to',
  after: 'is after',
  before: 'is before',
  afterOrEquals: 'is after or equal to',
  beforeOrEquals: 'is before or equal to',
  true: 'is true',
  false: 'is false',
  lengthEquals: 'length equal to',
  lengthNotEquals: 'length not equal to',
  lengthGt: 'length greater than',
  lengthLt: 'length less than',
  lengthGte: 'length greater than or equal to',
  lengthLte: 'length less than or equal to',
};

const OPERATOR_NAME_KEYS = Object.fromEntries(
  Object.keys(OPERATOR_LABELS).map((operation) => [operation, `filter.operator.${operation}`]),
);

const SINGLE_VALUE_OPERATIONS = ['exists', 'notExists', 'empty', 'notEmpty'];

function operator(type, operation, extra = {}) {
  return {
    label: OPERATOR_LABELS[operation],
    value: `${type}:${operation}`,
    type,
    operation,
    nameKey: OPERATOR_NAME_KEYS[operation],
    ...extra,
  };
}

function commonSingleValueOperators(type) {
  return SINGLE_VALUE_OPERATIONS.map((operation) =>
    operator(type, operation, { singleValue: true }),
  );
}

const OPERATOR_GROUPS = [
  {
    id: 'string',
    label: 'String',
    nameKey: 'type.string',
    operators: [
      ...commonSingleValueOperators('string'),
      operator('string', 'equals'),
      operator('string', 'notEquals'),
      operator('string', 'contains'),
      operator('string', 'notContains'),
      operator('string', 'startsWith'),
      operator('string', 'notStartsWith'),
      operator('string', 'endsWith'),
      operator('string', 'notEndsWith'),
      operator('string', 'regex'),
      operator('string', 'notRegex'),
    ],
  },
  {
    id: 'number',
    label: 'Number',
    nameKey: 'type.number',
    operators: [
      ...commonSingleValueOperators('number'),
      operator('number', 'equals'),
      operator('number', 'notEquals'),
      operator('number', 'gt'),
      operator('number', 'lt'),
      operator('number', 'gte'),
      operator('number', 'lte'),
    ],
  },
  {
    id: 'dateTime',
    label: 'Date & Time',
    nameKey: 'type.dateTime',
    operators: [
      ...commonSingleValueOperators('dateTime'),
      operator('dateTime', 'equals'),
      operator('dateTime', 'notEquals'),
      operator('dateTime', 'after'),
      operator('dateTime', 'before'),
      operator('dateTime', 'afterOrEquals'),
      operator('dateTime', 'beforeOrEquals'),
    ],
  },
  {
    id: 'boolean',
    label: 'Boolean',
    nameKey: 'type.boolean',
    operators: [
      ...commonSingleValueOperators('boolean'),
      operator('boolean', 'true', { singleValue: true }),
      operator('boolean', 'false', { singleValue: true }),
      operator('boolean', 'equals'),
      operator('boolean', 'notEquals'),
    ],
  },
  {
    id: 'array',
    label: 'Array',
    nameKey: 'type.array',
    operators: [
      ...commonSingleValueOperators('array'),
      operator('array', 'contains', { rightType: 'any' }),
      operator('array', 'notContains', { rightType: 'any' }),
      operator('array', 'lengthEquals', { rightType: 'number' }),
      operator('array', 'lengthNotEquals', { rightType: 'number' }),
      operator('array', 'lengthGt', { rightType: 'number' }),
      operator('array', 'lengthLt', { rightType: 'number' }),
      operator('array', 'lengthGte', { rightType: 'number' }),
      operator('array', 'lengthLte', { rightType: 'number' }),
    ],
  },
  {
    id: 'object',
    label: 'Object',
    nameKey: 'type.object',
    operators: commonSingleValueOperators('object'),
  },
];

const OPERATORS = OPERATOR_GROUPS.flatMap(({ operators }) => operators);
const RIGHT_VALUE_OPERATORS = OPERATORS.filter(({ singleValue }) => !singleValue).map(
  ({ value }) => value,
);

const DEFAULT_FILTER_OPTIONS = {
  caseSensitive: false,
  leftValue: '',
  typeValidation: 'strict',
  version: 3,
};

const DEFAULT_NATIVE_CONDITION = {
  leftValue: '',
  rightValue: '',
  operator: {
    type: 'string',
    operation: 'equals',
  },
};

const VALUE_CONTROL_BY_TYPE = {
  string: { kind: 'text', sourceKind: 'string' },
  number: { kind: 'number', sourceKind: 'number' },
  dateTime: { kind: 'text', sourceKind: 'dateTime', format: 'dateTime' },
  boolean: {
    kind: 'select',
    sourceKind: 'options',
    options: [
      { label: 'true', value: true },
      { label: 'false', value: false },
    ],
  },
  array: { kind: 'text', sourceKind: 'string' },
  object: { kind: 'text', sourceKind: 'string' },
  any: { kind: 'text', sourceKind: 'string' },
};

const conditionBuilderHint = `Must always contain these three sibling keys:
- combinator: 'and' or 'or', default to 'and'
- conditions: [ a list of condition objects ]
- options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 1 }
e.g.: { combinator: 'and', options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: expr('{{ $json.field }}'), rightValue: 'value', operator: { type: 'string', operation: 'equals' } }] }`;

const ifNode = {
  type: 'if',
  n8nType: 'n8n-nodes-base.if',
  n8nVersion: 2.3,
  defaultVersion: 2.3,
  versionHistory: [1, 2, 2.1, 2.2, 2.3],
  label: 'If',
  subtitle: '',
  description: 'Route items to different branches (true/false)',
  details:
    'The IF node can be used to implement binary conditional logic in your workflow. You can set up one-to-many conditions to evaluate each item of data being inputted into the node. That data will either evaluate to TRUE or FALSE and route out of the node accordingly.\n\nThis node has multiple types of conditions: Bool, String, Number, and Date & Time.',
  category: 'core',
  categories: ['Core Nodes'],
  subcategory: 'Flow',
  subcategories: ['Flow'],
  group: ['transform'],
  parameterPane: 'wide',
  defaults: { name: 'If', color: '#408000' },
  inputs: ['main'],
  outputs: [
    { type: 'main', label: 'True', name: 'true', branchValue: true },
    { type: 'main', label: 'False', name: 'false', branchValue: false },
  ],
  outputNames: ['true', 'false'],
  portLabels: ['True', 'False'],
  icon: '/node-icons/if.svg',
  n8nIcon: 'node:if',
  iconColor: 'green',
  iconHex: '#408000',
  iconMode: 'currentColor',
  aliases: ['Router', 'Filter', 'Condition', 'Logic', 'Boolean', 'Branch'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.if/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/If/If.node.ts',
    versionPath: 'packages/nodes-base/nodes/If/V2/IfV2.node.ts',
    utilityPath: 'packages/nodes-base/nodes/If/V2/utils.ts',
    metadataPath: 'packages/nodes-base/nodes/If/If.node.json',
    filterRegistryPath:
      'packages/frontend/editor-ui/src/features/ndv/parameters/components/FilterConditions/constants.ts',
    filterComponentPath:
      'packages/frontend/editor-ui/src/features/ndv/parameters/components/FilterConditions/FilterConditions.vue',
    conditionComponentPath:
      'packages/frontend/editor-ui/src/features/ndv/parameters/components/FilterConditions/Condition.vue',
    filterLocalePath: 'packages/frontend/@n8n/i18n/src/locales/en.json',
    looseValidationPath: 'packages/nodes-base/utils/descriptions.ts',
    iconPath: 'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/if.svg',
  },
  builderHint: {
    searchHint:
      'After configuring, confirm the workflow wires both `.onTrue()` and `.onFalse()` (or only the relevant one) to the correct downstream node — IF has two named outputs and silently drops items routed to an unwired branch.',
  },
  params: [
    {
      key: 'conditionCombinator',
      n8nKey: 'conditions.combinator',
      label: 'Combine Conditions With',
      kind: 'select',
      sourceKind: 'filter.combinator',
      value: 'and',
      required: false,
      visibleWhenConditionCountAtLeast: 2,
      options: [
        {
          label: 'AND',
          value: 'and',
          nameKey: 'filter.combinator.and',
          description: 'Keep data when it meets all conditions',
        },
        {
          label: 'OR',
          value: 'or',
          nameKey: 'filter.combinator.or',
          description: 'Keep data when it meets any condition',
        },
      ],
      simulationNote:
        'This select represents the combinator embedded in n8n’s specialized filter value.',
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
            operator: 'string:equals',
            rightValue: '',
          },
        ],
      },
      sourceDefault: {},
      nativeInitialValue: {
        options: DEFAULT_FILTER_OPTIONS,
        conditions: [DEFAULT_NATIVE_CONDITION],
        combinator: 'and',
      },
      required: false,
      multiple: true,
      sortable: true,
      maxItems: 10,
      collectionKey: 'conditions',
      collectionLabel: 'Condition',
      addLabel: 'Add Condition',
      builderHint: { propertyHint: conditionBuilderHint },
      operatorGroups: OPERATOR_GROUPS,
      operators: OPERATORS,
      defaultOperator: 'string:equals',
      defaultOperatorByType: {
        string: 'string:equals',
        number: 'number:equals',
        boolean: 'boolean:equals',
        array: 'array:contains',
        object: 'object:notEmpty',
        dateTime: 'dateTime:equals',
      },
      valueControlsByType: VALUE_CONTROL_BY_TYPE,
      filterOptions: {
        caseSensitiveExpression: '={{!$parameter.options.ignoreCase}}',
        typeValidationExpression:
          '={{ ($nodeVersion < 2.1 ? $parameter.options.looseTypeValidation : $parameter.looseTypeValidation) ? "loose" : "strict" }}',
        versionExpression: '={{ $nodeVersion >= 2.3 ? 3 : $nodeVersion >= 2.2 ? 2 : 1 }}',
        resolvedDefaults: DEFAULT_FILTER_OPTIONS,
      },
      fields: [
        {
          key: 'leftValue',
          n8nKey: 'leftValue',
          label: 'Left Value',
          kind: 'expression',
          sourceKind: 'dynamic-filter-value',
          value: '',
          required: false,
          placeholder: 'value1',
          expressionAllowed: true,
          valueControlsByType: VALUE_CONTROL_BY_TYPE,
        },
        {
          key: 'operator',
          n8nKey: 'operator',
          label: 'Operator',
          kind: 'select',
          sourceKind: 'filterOperator',
          value: 'string:equals',
          required: true,
          groupedOptions: OPERATOR_GROUPS,
          options: OPERATORS,
        },
        {
          key: 'rightValue',
          n8nKey: 'rightValue',
          label: 'Right Value',
          kind: 'expression',
          sourceKind: 'dynamic-filter-value',
          value: '',
          required: false,
          placeholder: 'value2',
          expressionAllowed: true,
          showWhen: { operator: RIGHT_VALUE_OPERATORS },
          valueControlsByType: VALUE_CONTROL_BY_TYPE,
        },
      ],
      simulationNote:
        'The filter widget is authorable metadata only; conditions, expressions, and regexes are never resolved or evaluated.',
    },
    {
      key: 'looseTypeValidation',
      n8nKey: 'looseTypeValidation',
      label: 'Convert types where required',
      kind: 'boolean',
      value: false,
      required: false,
      description:
        'If the type of an expression doesn\'t match the type of the comparison, n8n will try to cast the expression to the required type. E.g. for booleans <code>"false"</code> or <code>0</code> will be cast to <code>false</code>',
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
          key: 'ignoreCase',
          n8nKey: 'ignoreCase',
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
      n8nKey: 'conditions',
      n8nType: 'filter',
      normalizedKind: 'fixedCollection',
      decomposition: ['conditionCombinator', 'conditions'],
      reason: 'The simulator has no specialized typed filter widget.',
    },
    {
      n8nKey: 'conditions.conditions[].leftValue',
      n8nType: 'dynamic typed value',
      normalizedKind: 'text',
    },
    {
      n8nKey: 'conditions.conditions[].rightValue',
      n8nType: 'dynamic typed value',
      normalizedKind: 'text',
    },
  ],
  simulationNote: 'This node never resolves expressions, validates types, tests regexes, or routes items.',
  output: {},
};

export default ifNode;
