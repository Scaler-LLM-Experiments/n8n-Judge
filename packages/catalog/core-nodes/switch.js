// Editor-only descriptor for n8n's Switch v3.4 node. Typed conditions reuse
// the reviewed If descriptor; no expression is resolved and no item is routed.

import ifNode from './if.js';

const ifCombinator = ifNode.params.find(({ key }) => key === 'conditionCombinator');
const ifConditions = ifNode.params.find(({ key }) => key === 'conditions');
const ifLooseTypeValidation = ifNode.params.find(({ key }) => key === 'looseTypeValidation');
const ifIgnoreCase = ifNode.params
  .find(({ key }) => key === 'options')
  .fields.find(({ key }) => key === 'ignoreCase');

const nativeRuleDefault = {
  values: [
    {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: '',
          typeValidation: 'strict',
        },
        conditions: [
          {
            leftValue: '',
            rightValue: '',
            operator: {
              type: 'string',
              operation: 'equals',
            },
          },
        ],
        combinator: 'and',
      },
    },
  ],
};

const ruleValue = {
  values: [
    {
      conditionCombinator: ifCombinator.value,
      conditions: ifConditions.value,
      renameOutput: false,
      outputKey: '',
    },
  ],
};

const expressionOutputs = Array.from({ length: 4 }, (_, index) => ({
  type: 'main',
  label: String(index),
  name: String(index),
  index,
}));

const switchNode = {
  type: 'switch',
  n8nType: 'n8n-nodes-base.switch',
  n8nVersion: 3.4,
  defaultVersion: 3.4,
  versionHistory: [1, 2, 3, 3.1, 3.2, 3.3, 3.4],
  label: 'Switch',
  defaultName: 'Switch',
  subtitle: '=mode: {{(${capitalize})($parameter["mode"])}}',
  description: 'Route items depending on defined expression or rules',
  details:
    'Use the Switch node to route items to different branches. Build a matching rule for each output, or use an expression that returns a zero-based output index.',
  category: 'core',
  router: true,
  categories: ['Core Nodes'],
  subcategory: 'Flow',
  subcategories: ['Flow'],
  group: ['transform'],
  parameterPane: 'wide',
  defaults: { name: 'Switch', color: '#506000' },
  inputs: ['main'],
  outputs: [{ type: 'main', label: '0', name: '0', index: 0 }],
  portVariants: [
    {
      showWhen: { mode: ['expression'] },
      inputs: ['main'],
      outputs: expressionOutputs,
    },
  ],
  dynamicOutputs: {
    enabled: true,
    modeParameter: 'mode',
    sourceExpression: '={{(${configuredOutputs})($parameter)}}',
    modes: {
      rules: {
        rulesPath: 'rules.values',
        labelParameter: 'outputKey',
        defaultLabel: '{{index}}',
        fallbackPath: 'options.fallbackOutput',
        extraFallbackValue: 'extra',
        fallbackLabelPath: 'options.renameFallbackOutput',
        defaultFallbackLabel: 'Fallback',
      },
      expression: {
        countParameter: 'numberOutputs',
        defaultCount: 4,
        labelTemplate: '{{index}}',
      },
    },
  },
  outputNames: ['0'],
  icon: '/node-icons/switch.svg',
  n8nIcon: 'node:switch',
  iconColor: 'light-blue',
  iconHex: '#5FABF7',
  iconMode: 'currentColor',
  aliases: ['Router', 'If', 'Path', 'Filter', 'Condition', 'Logic', 'Branch', 'Case'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Switch/Switch.node.ts',
    versionPath: 'packages/nodes-base/nodes/Switch/V3/SwitchV3.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Switch/Switch.node.json',
    ifDescriptorPath: 'packages/catalog/core-nodes/if.js',
    ifUtilityPath: 'packages/nodes-base/nodes/If/V2/utils.ts',
    looseValidationPath: 'packages/nodes-base/utils/descriptions.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/switch.svg',
  },
  builderHint: {
    searchHint:
      'In Rules mode, wire outputs by their zero-based rule index. An output name is only its visible label. Set Fallback Output to Extra Output before wiring a catch-all branch.',
  },
  params: [
    {
      key: 'mode',
      n8nKey: 'mode',
      label: 'Mode',
      kind: 'select',
      value: 'rules',
      required: false,
      noDataExpression: true,
      options: [
        {
          label: 'Rules',
          value: 'rules',
          description: 'Build a matching rule for each output',
        },
        {
          label: 'Expression',
          value: 'expression',
          description: 'Write an expression to return the output index',
        },
      ],
      description: 'How data should be routed',
    },
    {
      key: 'numberOutputs',
      n8nKey: 'numberOutputs',
      label: 'Number of Outputs',
      kind: 'number',
      value: 4,
      required: false,
      noDataExpression: true,
      showWhen: { mode: ['expression'] },
      description: 'How many outputs to create',
    },
    {
      key: 'output',
      n8nKey: 'output',
      label: 'Output Index',
      kind: 'expression',
      sourceKind: 'number',
      value: '={{}}',
      required: false,
      validateType: 'number',
      showWhen: { mode: ['expression'] },
      hint: 'The index to route the item to, starts at 0',
      description:
        'The output index to send the input item to. Use an expression to calculate which input item should be routed to which output. The expression must return a number.',
    },
    {
      key: 'rules',
      n8nKey: 'rules',
      label: 'Routing Rules',
      kind: 'fixedCollection',
      sourceKind: 'fixedCollection',
      value: ruleValue,
      sourceDefault: nativeRuleDefault,
      nativeInitialValue: nativeRuleDefault,
      required: false,
      showWhen: { mode: ['rules'] },
      collectionKey: 'values',
      collectionLabel: 'Routing Rule',
      multiple: true,
      sortable: true,
      addLabel: 'Add Routing Rule',
      builderHint: {
        propertyHint:
          "Use `rules.values` (not `rules.rules`). Each rule needs a complete `conditions` object. Wire outputs by zero-based index; `outputKey` is the visible label, not the `.onCase()` argument.",
      },
      fields: [
        {
          ...ifCombinator,
          key: 'conditionCombinator',
          n8nKey: 'conditions.combinator',
        },
        {
          ...ifConditions,
          key: 'conditions',
          n8nKey: 'conditions.conditions',
          label: 'Conditions',
          filterOptions: {
            ...ifConditions.filterOptions,
            typeValidationExpression:
              '={{ $nodeVersion >= 3.1 ? ($parameter.looseTypeValidation ? "loose" : "strict") : ($parameter.options.looseTypeValidation ? "loose" : "strict") }}',
            versionExpression:
              '={{ $nodeVersion >= 3.4 ? 3 : $nodeVersion >= 3.2 ? 2 : 1 }}',
          },
        },
        {
          key: 'renameOutput',
          n8nKey: 'renameOutput',
          label: 'Rename Output',
          kind: 'boolean',
          value: false,
          required: false,
        },
        {
          key: 'outputKey',
          n8nKey: 'outputKey',
          label: 'Output Name',
          kind: 'text',
          value: '',
          required: false,
          showWhen: { renameOutput: [true] },
          description: 'The label of output to which to send data to if rule matches',
        },
      ],
      simulationNote:
        'Rules and typed conditions remain authoring metadata only; they are never evaluated.',
    },
    {
      ...ifLooseTypeValidation,
      key: 'looseTypeValidation',
      n8nKey: 'looseTypeValidation',
      value: false,
    },
    {
      key: 'options',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      showWhen: { mode: ['rules'] },
      fields: [
        {
          key: 'fallbackOutput',
          n8nKey: 'fallbackOutput',
          label: 'Fallback Output',
          kind: 'select',
          value: 'none',
          required: false,
          options: [
            {
              label: 'None (default)',
              value: 'none',
              description: 'Items will be ignored',
            },
            {
              label: 'Extra Output',
              value: 'extra',
              description: 'Items will be sent to the extra, separate, output',
            },
            {
              label: 'Output 0',
              value: 0,
              description: 'Items will be sent to the same output as when matched rule 1',
            },
          ],
          loadOptionsMethod: 'getFallbackOutputOptions',
          loadOptionsDependsOn: ['rules.values', '/rules', '/rules.values'],
          dynamicRuleOptions: {
            rulesPath: 'rules.values',
            labelTemplate: 'Output {{outputKey || index}}',
            valueTemplate: '{{index}}',
            descriptionTemplate:
              'Items will be sent to the same output as when matched rule {{index + 1}}',
          },
          builderHint: {
            propertyHint:
              "Set this to `'extra'` before wiring a catch-all branch. Numeric values reuse an existing rule output and do not create a new port.",
          },
          description:
            'If no rule matches the item will be sent to this output, by default they will be ignored',
        },
        {
          ...ifIgnoreCase,
          key: 'ignoreCase',
          n8nKey: 'ignoreCase',
          value: true,
        },
        {
          key: 'renameFallbackOutput',
          n8nKey: 'renameFallbackOutput',
          label: 'Rename Fallback Output',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. Fallback',
          showWhen: { fallbackOutput: ['extra'] },
          builderHint: {
            propertyHint:
              "Only labels the extra fallback output. Use it together with `fallbackOutput: 'extra'`; it does not create a fallback output by itself.",
          },
        },
        {
          key: 'allMatchingOutputs',
          n8nKey: 'allMatchingOutputs',
          label: 'Send data to all matching outputs',
          kind: 'boolean',
          value: false,
          required: false,
          description:
            'Whether to send data to all outputs meeting conditions (and not just the first one)',
        },
      ],
    },
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'rules.values[].conditions',
      n8nType: 'filter',
      normalizedKind: 'fixedCollection',
      decomposition: ['conditionCombinator', 'conditions'],
      reason: 'The simulator has no specialized typed filter widget.',
    },
    {
      n8nKey: 'output',
      n8nType: 'number with expression default',
      normalizedKind: 'expression',
    },
  ],
  simulationNote:
    'This node never resolves expressions, evaluates rules, validates types, or routes items.',
  output: { category: 'COMPLAINT', urgency: 'HIGH' },
};

export default switchNode;
