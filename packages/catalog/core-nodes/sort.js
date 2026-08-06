// Editor-only descriptor for n8n's Sort v1 core node. Fields and JavaScript
// are authorable, but items are never sorted, shuffled, or evaluated.

const sortTypeOptions = [
  { label: 'Simple', value: 'simple' },
  { label: 'Random', value: 'random' },
  { label: 'Code', value: 'code' },
];

const defaultSortCode = `// The two items to compare are in the variables a and b
	// Access the fields in a.json and b.json
	// Return -1 if a should go before b
	// Return 1 if b should go before a
	// Return 0 if there's no difference

	fieldName = 'myField';

	if (a.json[fieldName] < b.json[fieldName]) {
	return -1;
	}
	if (a.json[fieldName] > b.json[fieldName]) {
	return 1;
	}
	return 0;`;

const sort = {
  type: 'sort',
  n8nType: 'n8n-nodes-base.sort',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'Sort',
  defaultName: 'Sort',
  subtitle: '',
  description: 'Change items order',
  details:
    'Order input items by one or more fields, create a random order, or author a JavaScript comparator. This catalog entry never changes item order.',
  category: 'core',
  categories: ['Core Nodes'],
  subcategory: 'Data Transformation',
  subcategories: ['Data Transformation'],
  group: ['transform'],
  inputs: ['main'],
  outputs: ['main'],
  icon: '/node-icons/sort.svg',
  n8nIcon: 'node:sort',
  iconColor: 'lavender',
  iconHex: '#8287EB',
  iconColorLight: '#8287eb',
  iconColorDark: '#a8acff',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 512, height: 512 },
  iconAssetSha256: '2e6c5f4f5d9152a5f5ec1f3c6a03a3cec6720d2f922739b1e25782a9a097e86a',
  aliases: ['Sort', 'Order', 'Transform', 'Array', 'List', 'Item', 'Random'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sort/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Transform/Sort/Sort.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Transform/Sort/Sort.node.json',
    codeHelperPath: 'packages/nodes-base/nodes/Transform/Sort/utils.ts',
    codeSandboxPath:
      'packages/nodes-base/nodes/Code/JsTaskRunnerSandbox.ts',
    iconPath: 'packages/nodes-base/nodes/Transform/Sort/sort.svg',
    sourceIconSha256: 'd1c756b320b9f4e65a4238a893e7b4880f6aef9a77b3df1d9a6ecddd07f893ef',
    catalogIconNormalization: 'Identical SVG markup with a final newline',
    directDescriptionImports: [],
    descriptionsInline: true,
    directImports: [
      { module: 'lodash/get', defaultImport: 'get' },
      { module: 'lodash/isEqual', defaultImport: 'isEqual' },
      { module: 'lodash/lt', defaultImport: 'lt' },
      {
        module: 'n8n-workflow',
        names: ['NodeOperationError', 'NodeConnectionTypes'],
      },
      { module: '@utils/utilities', names: ['shuffleArray'] },
      { module: './utils', names: ['sortByCode'] },
    ],
  },
  defaults: { name: 'Sort' },
  credentials: [],
  docsSummary: {
    modes: sortTypeOptions.map(({ value }) => value),
    simple: 'Sort ascending or descending using one or more selected fields.',
    random: 'Create a random order in the list.',
    code: 'Use custom JavaScript when a simple field sort is not sufficient.',
    dotNotationEnabledByDefault: true,
    officialDocsArraySortNote:
      'Elements are converted to strings and compared using JavaScript array sort behavior.',
  },
  params: [
    {
      key: 'type',
      label: 'Type',
      kind: 'select',
      sourceKind: 'options',
      value: 'simple',
      required: false,
      options: sortTypeOptions,
      description: 'The type of sorting to perform',
    },
    {
      key: 'sortFieldsUi',
      label: 'Fields To Sort By',
      kind: 'fixedCollection',
      sourceKind: 'fixedCollection',
      value: {},
      required: false,
      collectionKey: 'sortField',
      collectionLabel: '',
      multiple: true,
      addLabel: 'Add Field To Sort By',
      showWhen: { type: ['simple'] },
      description: 'The fields of the input items to sort by',
      fields: [
        {
          key: 'fieldName',
          label: 'Field Name',
          kind: 'text',
          sourceKind: 'string:dataPath',
          value: '',
          required: true,
          placeholder: 'e.g. id',
          hint: ' Enter the field name as text',
          requiresDataPath: 'single',
          description: 'The field to sort by',
          simulationNote:
            'The path is editable text only and is never resolved against input items.',
        },
        {
          key: 'order',
          label: 'Order',
          kind: 'select',
          sourceKind: 'options',
          value: 'ascending',
          required: false,
          options: [
            { label: 'Ascending', value: 'ascending' },
            { label: 'Descending', value: 'descending' },
          ],
          description: 'The order to sort by',
        },
      ],
      simulationNote:
        'Repeatable sort fields are authoring metadata only. Their order never rearranges input items.',
    },
    {
      key: 'code',
      label: 'Code',
      kind: 'textarea',
      sourceKind: 'string:jsEditor',
      value: defaultSortCode,
      required: false,
      rows: 10,
      editor: 'javascript',
      n8nEditor: 'jsEditor',
      alwaysOpenEditWindow: true,
      showWhen: { type: ['code'] },
      description: 'Javascript code to determine the order of any two items',
      simulationNote:
        'JavaScript is editable text only. It is never parsed, checked for return statements, sandboxed, or executed.',
    },
    {
      key: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Field',
      showWhen: { type: ['simple'] },
      fields: [
        {
          key: 'disableDotNotation',
          label: 'Disable Dot Notation',
          kind: 'boolean',
          value: false,
          required: false,
          description:
            'Whether to disallow referencing child fields using `parent.child` in the field name',
        },
      ],
    },
  ],
  sortParity: {
    modes: ['simple', 'random', 'code'],
    manualModeSupported: false,
    simpleIsManualFieldConfiguration: true,
    defaultMode: 'simple',
    defaultSortFields: {},
    defaultOrder: 'ascending',
    defaultDisableDotNotation: false,
    simple: {
      requiresAtLeastOneFieldAtRuntime: true,
      noFieldsError: 'No sorting specified. Please add a field to sort by',
      repeatedFieldPriority: 'First configured field with unequal values wins',
      stringComparison: 'Case-insensitive',
      dotNotationEnabledWhenOptionIsFalse: true,
      missingFieldError: "Couldn't find the field '${fieldName}' in the input data",
      nestedFieldHintWhenDisabled:
        "If you're trying to use a nested field, make sure you turn off 'disable dot notation' in the node options",
    },
    random: {
      sourceHelper: 'shuffleArray',
      mutatesCopiedInputOrder: true,
    },
    code: {
      comparatorVariables: ['a', 'b'],
      expectedReturnValues: [-1, 0, 1],
      requiresReturnStatementAtRuntime: true,
      missingReturnError: "Sort code doesn't return. Please add a 'return' statement to your code",
      sourceSandbox: 'JsTaskRunnerSandbox',
    },
    inert: true,
  },
  specializedSortControls: [
    {
      key: 'fieldName',
      sourceType: 'string:requiresDataPath=single',
      normalizedKind: 'text',
      reason: 'The catalog keeps n8n’s single data-path field as inert text.',
    },
    {
      key: 'code',
      sourceType: 'string:jsEditor',
      normalizedKind: 'textarea',
      reason: 'The catalog has no executable JavaScript editor; code uses an inert multiline field.',
    },
  ],
  unsupportedVisibleTypes: [
    {
      key: 'fieldName',
      sourceType: 'string with requiresDataPath=single',
      normalizedKind: 'text',
      reason: 'The data-path picker behavior is unavailable and represented by text.',
    },
    {
      key: 'code',
      sourceType: 'string with editor=jsEditor',
      normalizedKind: 'textarea',
      reason: 'The JavaScript editor is represented by a multiline inert text control.',
    },
  ],
  simulation: {
    configurationOnly: true,
    readsInputItems: false,
    resolvesDataPaths: false,
    comparesValues: false,
    sortsItems: false,
    shufflesItems: false,
    randomizes: false,
    parsesCode: false,
    checksReturnStatements: false,
    sandboxesCode: false,
    executesCode: false,
    executes: false,
    runtime: false,
    network: false,
    voice: false,
  },
  output: { customerId: 'CUS-101', priority: 1, status: 'open' },
};

export default sort;
