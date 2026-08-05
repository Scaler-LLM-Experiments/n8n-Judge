// Editor-only descriptor for n8n's Data table v1.1 core node. Dynamic table
// lookups and every data mutation remain inert in this authoring simulation.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';

const conditionOptions = [
  { label: 'Is Empty', value: 'isEmpty' },
  { label: 'Is Not Empty', value: 'isNotEmpty' },
  { label: 'Equals', value: 'eq' },
  { label: 'Not Equals', value: 'neq' },
  { label: 'Is True', value: 'isTrue' },
  { label: 'Is False', value: 'isFalse' },
  { label: 'Greater Than', value: 'gt' },
  { label: 'Greater Than or Equal', value: 'gte' },
  { label: 'Less Than', value: 'lt' },
  { label: 'Less Than or Equal', value: 'lte' },
  { label: 'Contains (Case-Sensitive)', value: 'like' },
  { label: 'Contains (Case-Insensitive)', value: 'ilike' },
];

const systemColumnOptions = [
  { label: 'id (number)', value: 'id' },
  { label: 'createdAt (date)', value: 'createdAt' },
  { label: 'updatedAt (date)', value: 'updatedAt' },
];

const matchOptions = [
  { label: 'Any Condition', value: 'anyCondition' },
  { label: 'All Conditions', value: 'allConditions' },
];

const rowShowWhen = (operation) => ({ resource: ['row'], rowOperation: [operation] });
const tableShowWhen = (operation) => ({ resource: ['table'], tableOperation: [operation] });

function dataTableSelector({ key, showWhen, allowNewResource = false }) {
  return {
    key,
    n8nKey: 'dataTableId',
    label: 'Data table',
    kind: 'resourceLocator',
    value: { __rl: true, mode: 'list', value: '' },
    sourceDefault: { mode: 'list', value: '' },
    required: true,
    locked: true,
    showWhen,
    modes: ['list', 'name', 'id'],
    modeOptions: [
      {
        label: 'From List',
        value: 'list',
        kind: 'list',
        searchable: true,
        searchListMethod: 'tableSearch',
        ...(allowNewResource
          ? {
              allowNewResource: {
                label: 'resourceLocator.dataTable.createNew',
                url: '/projects/{{$projectId}}/datatables/new',
              },
            }
          : {}),
      },
      { label: 'By Name', value: 'name', kind: 'text', placeholder: 'e.g. My Table' },
      { label: 'ID', value: 'id', kind: 'text' },
    ],
    options: [],
    builderHint: { propertyHint: "Default to mode: 'list' which is easier for users to set up" },
    simulationNote: 'The table list is intentionally inert; this simulation never queries n8n storage.',
  };
}

function filtersFor({ prefix, operation, minRequiredFields, hideOperator = false }) {
  const showWhen = rowShowWhen(operation);
  const fields = [
    {
      key: 'keyName',
      label: 'Column',
      kind: 'select',
      value: 'id',
      required: false,
      options: systemColumnOptions,
      dynamicOptions: true,
      loadOptionsDependsOn: ['dataTableId.value'],
      loadOptionsMethod: 'getDataTableColumns',
      description:
        'Choose from the list, or specify using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
    },
  ];

  if (!hideOperator) {
    fields.push({
      key: 'condition',
      label: 'Condition',
      kind: 'select',
      value: 'eq',
      required: false,
      options: conditionOptions,
      dynamicOptions: true,
      loadOptionsDependsOn: ['&keyName'],
      loadOptionsMethod: 'getConditionsForColumn',
    });
  }

  fields.push({
    key: 'keyValue',
    label: 'Value',
    kind: 'text',
    value: '',
    required: false,
    ...(hideOperator
      ? {}
      : {
          showWhen: {
            condition: ['eq', 'neq', 'like', 'ilike', 'gt', 'gte', 'lt', 'lte'],
          },
        }),
  });

  return [
    {
      key: `${prefix}MatchType`,
      n8nKey: 'matchType',
      label: 'Must Match',
      kind: 'select',
      value: 'anyCondition',
      required: false,
      showWhen,
      options: matchOptions,
    },
    {
      key: `${prefix}Filters`,
      n8nKey: 'filters',
      label: 'Conditions',
      kind: 'fixedCollection',
      value: {},
      required: false,
      multiple: true,
      minRequiredFields,
      collectionKey: 'conditions',
      collectionLabel: 'Condition',
      addLabel: 'Add Condition',
      showWhen,
      fields,
      ...(hideOperator
        ? {
            implicitFields: [
              {
                key: 'condition',
                label: 'Condition',
                kind: 'hidden',
                value: 'eq',
                required: false,
              },
            ],
          }
        : {}),
      description: 'Filter to decide which rows get',
    },
  ];
}

function mappingField(prefix, operation) {
  return {
    key: `${prefix}Columns`,
    n8nKey: 'columns',
    label: 'Columns',
    kind: 'collection',
    sourceKind: 'resourceMapper',
    value: { mappingMode: 'defineBelow', value: null },
    required: true,
    noDataExpression: true,
    showWhen: rowShowWhen(operation),
    addLabel: 'Add Mapping Field',
    fields: [
      {
        key: 'mappingMode',
        label: 'Mapping Column Mode',
        kind: 'select',
        value: 'defineBelow',
        required: false,
        options: [
          {
            label: 'Map Each Column Manually',
            value: 'defineBelow',
            description: 'Set the value for each column',
          },
          {
            label: 'Map Automatically',
            value: 'autoMapInputData',
            description: 'Look for incoming data that matches the columns in Data table',
          },
        ],
      },
      {
        key: 'value',
        label: `Values to ${operation}`,
        kind: 'fixedCollection',
        value: { fields: [] },
        required: false,
        multiple: true,
        dynamicSchema: true,
        collectionKey: 'fields',
        collectionLabel: 'Column',
        addLabel: 'Add Column',
        showWhen: { mappingMode: ['defineBelow'] },
        fields: [
          {
            key: 'column',
            label: 'Column',
            kind: 'text',
            value: '',
            required: true,
            placeholder: 'Select or enter a data table column',
          },
          {
            key: 'value',
            label: 'Value',
            kind: 'expression',
            value: '',
            required: false,
            placeholder: 'Drag an input field or enter a value',
          },
        ],
      },
    ],
    resourceMapper: {
      loadOptionsDependsOn: ['dataTableId.value'],
      valuesLabel: `Values to ${operation}`,
      resourceMapperMethod: 'getDataTables',
      mode: 'add',
      fieldWords: { singular: 'column', plural: 'columns' },
      addAllFields: true,
      multiKeyMatch: true,
      hideNoDataError: true,
      refreshIncompleteSchemaOnOpen: true,
    },
    autoMappingNotice:
      "In this mode, make sure the incoming data fields are named the same as the columns in Data table. (Use an 'Edit Fields' node before this node to change them if required.)",
  };
}

function dryRunOptions(prefix, operation) {
  return {
    key: `${prefix}Options`,
    n8nKey: 'options',
    label: 'Options',
    kind: 'collection',
    value: {},
    required: false,
    addLabel: 'Add option',
    showWhen: rowShowWhen(operation),
    fields: [
      {
        key: 'dryRun',
        label: 'Dry Run',
        kind: 'boolean',
        value: false,
        required: false,
        description:
          'Whether the operation simulates and returns affected rows in their "before" and "after" states',
      },
    ],
  };
}

const dataTable = {
  type: 'data-table',
  n8nType: 'n8n-nodes-base.dataTable',
  n8nVersion: 1.1,
  versionHistory: [1, 1.1],
  label: 'Data table',
  subtitle: '={{$parameter["action"]}}',
  description: 'Permanently save data across workflow executions in a table',
  details: 'Data table',
  category: 'core',
  categories: ['Core Nodes', 'Development'],
  subcategory: 'Helpers',
  subcategories: ['Helpers'],
  group: ['input', 'transform'],
  inputs: ['main'],
  outputs: ['main'],
  usableAsTool: true,
  icon: '/node-icons/data-table.svg',
  n8nIcon: 'node:data-table',
  iconColor: 'orange-red',
  iconHex: '#FF6900',
  aliases: [
    'data',
    'table',
    'knowledge',
    'data table',
    'table',
    'sheet',
    'database',
    'data base',
    'mysql',
    'postgres',
    'postgresql',
    'airtable',
    'supabase',
    'noco',
    'notion',
  ],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.datatable/',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/DataTable/DataTable.node.ts',
    metadataPath: 'packages/nodes-base/nodes/DataTable/DataTable.node.json',
    parameterPaths: [
      'packages/nodes-base/nodes/DataTable/actions/row/Row.resource.ts',
      'packages/nodes-base/nodes/DataTable/actions/row/delete.operation.ts',
      'packages/nodes-base/nodes/DataTable/actions/row/get.operation.ts',
      'packages/nodes-base/nodes/DataTable/actions/row/insert.operation.ts',
      'packages/nodes-base/nodes/DataTable/actions/row/rowExists.operation.ts',
      'packages/nodes-base/nodes/DataTable/actions/row/rowNotExists.operation.ts',
      'packages/nodes-base/nodes/DataTable/actions/row/update.operation.ts',
      'packages/nodes-base/nodes/DataTable/actions/row/upsert.operation.ts',
      'packages/nodes-base/nodes/DataTable/actions/table/Table.resource.ts',
      'packages/nodes-base/nodes/DataTable/actions/table/clear.operation.ts',
      'packages/nodes-base/nodes/DataTable/actions/table/create.operation.ts',
      'packages/nodes-base/nodes/DataTable/actions/table/delete.operation.ts',
      'packages/nodes-base/nodes/DataTable/actions/table/list.operation.ts',
      'packages/nodes-base/nodes/DataTable/actions/table/update.operation.ts',
      'packages/nodes-base/nodes/DataTable/common/addRow.ts',
      'packages/nodes-base/nodes/DataTable/common/fields.ts',
      'packages/nodes-base/nodes/DataTable/common/selectMany.ts',
    ],
    iconPath: 'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/data-table.svg',
  },
  defaults: { name: 'Data table' },
  builderHint: {
    extraTypeDefContent: [
      {
        displayOptions: { show: { resource: ['row'], operation: ['insert'] } },
        content: `<patterns>
<pattern title="Insert with explicit schema">
const storeData = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Store Data',
    parameters: {
      resource: 'row',
      operation: 'insert',
      dataTableId: { __rl: true, mode: 'name', value: 'my-table' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          name: expr('{{ $json.name }}'),
          email: expr('{{ $json.email }}')
        },
        schema: [
          { id: 'name', displayName: 'name', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'email', displayName: 'email', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }
        ]
      }
    }
  }
});
</pattern>
</patterns>`,
      },
    ],
  },
  hints: [
    {
      message: 'The selected data table has no columns.',
      displayCondition:
        '={{ $parameter.dataTableId !== "" && $parameter?.columns?.mappingMode === "defineBelow" && !$parameter?.columns?.schema?.length }}',
      whenToDisplay: 'beforeExecution',
      location: 'ndv',
      type: 'info',
    },
  ],
  params: [
    {
      key: 'resource',
      label: 'Resource',
      kind: 'select',
      value: 'row',
      required: false,
      noDataExpression: true,
      options: [
        { label: 'Row', value: 'row' },
        { label: 'Table', value: 'table' },
      ],
    },
    {
      key: 'rowOperation',
      n8nKey: 'operation',
      label: 'Operation',
      kind: 'select',
      value: 'insert',
      required: false,
      noDataExpression: true,
      showWhen: { resource: ['row'] },
      options: [
        {
          label: 'Delete',
          value: 'deleteRows',
          description: 'Delete row(s)',
          action: 'Delete row(s)',
        },
        {
          label: 'Get',
          value: 'get',
          description: 'Get row(s)',
          action: 'Get row(s)',
          builderHint: {
            propertyHint:
              "There is no `getAll` operation. To fetch many rows, use `operation: 'get'` with `returnAll: true`.",
          },
        },
        {
          label: 'If Row Exists',
          value: 'rowExists',
          description: 'Match input items that are in the data table',
          action: 'If row exists',
        },
        {
          label: 'If Row Does Not Exist',
          value: 'rowNotExists',
          description: 'Match input items that are not in the data table',
          action: 'If row does not exist',
        },
        {
          label: 'Insert',
          value: 'insert',
          description: 'Insert a new row',
          action: 'Insert row',
          builderHint: {
            propertyHint:
              'Row IDs are auto-generated. Do NOT define a custom `id` column or seed `id` on insert. The built-in row `id` is valid for filtering update/delete but is not part of the user-defined table schema.',
          },
        },
        {
          label: 'Update',
          value: 'update',
          description: 'Update row(s) matching certain fields',
          action: 'Update row(s)',
        },
        {
          label: 'Upsert',
          value: 'upsert',
          description: 'Update row(s), or insert if there is no match',
          action: 'Upsert row(s)',
        },
      ],
    },
    dataTableSelector({
      key: 'rowDataTableId',
      showWhen: { resource: ['row'] },
      allowNewResource: true,
    }),

    ...filtersFor({
      prefix: 'deleteRows',
      operation: 'deleteRows',
      minRequiredFields: 1,
    }),
    dryRunOptions('deleteRows', 'deleteRows'),

    mappingField('insert', 'insert'),
    {
      key: 'insertOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Option',
      showWhen: rowShowWhen('insert'),
      fields: [
        {
          key: 'optimizeBulk',
          label: 'Optimize Bulk',
          kind: 'boolean',
          value: false,
          required: false,
          noDataExpression: true,
          description: 'Whether to improve bulk insert performance 5x by not returning inserted data',
        },
      ],
    },

    ...filtersFor({ prefix: 'getRows', operation: 'get', minRequiredFields: 0 }),
    {
      key: 'getRowsReturnAll',
      n8nKey: 'returnAll',
      label: 'Return All',
      kind: 'boolean',
      value: false,
      required: false,
      showWhen: rowShowWhen('get'),
      description: 'Whether to return all results or only up to a given limit',
    },
    {
      key: 'getRowsLimit',
      n8nKey: 'limit',
      label: 'Limit Per Input Row',
      kind: 'number',
      value: 50,
      required: false,
      min: 1,
      showWhen: { ...rowShowWhen('get'), getRowsReturnAll: [false] },
      description: 'Max number of results to return',
    },
    {
      key: 'getRowsOrderBy',
      n8nKey: 'orderBy',
      label: 'Order By',
      kind: 'boolean',
      value: false,
      required: false,
      showWhen: rowShowWhen('get'),
      description: 'Whether to sort the results by a column',
    },
    {
      key: 'getRowsOrderByColumn',
      n8nKey: 'orderByColumn',
      label: 'Order By Column',
      kind: 'select',
      value: 'createdAt',
      required: false,
      options: systemColumnOptions,
      dynamicOptions: true,
      loadOptionsDependsOn: ['dataTableId.value'],
      loadOptionsMethod: 'getDataTableColumns',
      showWhen: { ...rowShowWhen('get'), getRowsOrderBy: [true] },
      description:
        'Choose from the list, or specify using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
    },
    {
      key: 'getRowsOrderByDirection',
      n8nKey: 'orderByDirection',
      label: 'Order By Direction',
      kind: 'select',
      value: 'DESC',
      required: false,
      showWhen: { ...rowShowWhen('get'), getRowsOrderBy: [true] },
      options: [
        { label: 'Ascending', value: 'ASC' },
        { label: 'Descending', value: 'DESC' },
      ],
      description: 'Sort direction for the column',
    },

    ...filtersFor({
      prefix: 'rowExists',
      operation: 'rowExists',
      minRequiredFields: 1,
      hideOperator: true,
    }),
    ...filtersFor({
      prefix: 'rowNotExists',
      operation: 'rowNotExists',
      minRequiredFields: 1,
      hideOperator: true,
    }),

    ...filtersFor({ prefix: 'updateRows', operation: 'update', minRequiredFields: 1 }),
    mappingField('updateRows', 'update'),
    dryRunOptions('updateRows', 'update'),

    ...filtersFor({ prefix: 'upsertRows', operation: 'upsert', minRequiredFields: 1 }),
    mappingField('upsertRows', 'upsert'),
    dryRunOptions('upsertRows', 'upsert'),

    {
      key: 'tableOperation',
      n8nKey: 'operation',
      label: 'Operation',
      kind: 'select',
      value: 'list',
      required: false,
      noDataExpression: true,
      showWhen: { resource: ['table'] },
      options: [
        {
          label: 'Clear',
          value: 'clear',
          description: 'Clear all rows from a data table',
          action: 'Clear a data table',
        },
        {
          label: 'Create',
          value: 'create',
          description: 'Create a new data table',
          action: 'Create a data table',
        },
        {
          label: 'Delete',
          value: 'delete',
          description: 'Delete a data table',
          action: 'Delete a data table',
        },
        {
          label: 'List',
          value: 'list',
          description: 'List all data tables',
          action: 'List data tables',
        },
        {
          label: 'Rename',
          value: 'update',
          description: 'Rename a data table',
          action: 'Rename a data table',
        },
      ],
    },
    dataTableSelector({
      key: 'tableDataTableId',
      showWhen: { resource: ['table'], tableOperation: ['clear', 'delete', 'update'] },
    }),
    {
      key: 'clearWarning',
      label:
        'This will permanently delete all rows from the data table. The table structure will be retained. This action cannot be undone.',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: tableShowWhen('clear'),
    },
    {
      key: 'tableName',
      label: 'Name',
      kind: 'text',
      value: '',
      required: true,
      placeholder: 'e.g. My Data Table',
      description: 'The name of the data table to create',
      showWhen: tableShowWhen('create'),
    },
    {
      key: 'tableCreateColumns',
      n8nKey: 'columns',
      label: 'Columns',
      kind: 'fixedCollection',
      value: {},
      required: false,
      multiple: true,
      collectionKey: 'column',
      collectionLabel: 'Column',
      addLabel: 'Add Column',
      description: 'The columns to create in the data table',
      showWhen: tableShowWhen('create'),
      fields: [
        {
          key: 'name',
          label: 'Name',
          kind: 'text',
          value: '',
          required: true,
          description: 'The name of the column',
        },
        {
          key: 'type',
          label: 'Type',
          kind: 'select',
          value: 'string',
          required: false,
          options: [
            { label: 'Boolean', value: 'boolean' },
            { label: 'Date', value: 'date' },
            { label: 'Number', value: 'number' },
            { label: 'String', value: 'string' },
          ],
          description: 'The type of the column',
        },
      ],
    },
    {
      key: 'tableCreateOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Option',
      showWhen: tableShowWhen('create'),
      fields: [
        {
          key: 'createIfNotExists',
          label: 'Reuse Existing Tables',
          kind: 'boolean',
          value: true,
          required: false,
          description:
            'Whether to return existing table if one exists with the same name without throwing an error',
        },
      ],
    },
    {
      key: 'deleteWarning',
      label:
        'This will permanently delete the data table and all its data. This action cannot be undone.',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: tableShowWhen('delete'),
    },
    {
      key: 'tableListReturnAll',
      n8nKey: 'returnAll',
      label: 'Return All',
      kind: 'boolean',
      value: true,
      required: false,
      showWhen: tableShowWhen('list'),
      description: 'Whether to return all results or only up to a given limit',
    },
    {
      key: 'tableListLimit',
      n8nKey: 'limit',
      label: 'Limit Per Input Row',
      kind: 'number',
      value: 50,
      required: false,
      min: 1,
      showWhen: { ...tableShowWhen('list'), tableListReturnAll: [false] },
      description: 'Max number of results to return',
    },
    {
      key: 'tableListOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Option',
      showWhen: tableShowWhen('list'),
      fields: [
        {
          key: 'filterName',
          label: 'Filter by Name',
          kind: 'text',
          value: '',
          required: false,
          description: 'Filter data tables by name (case-insensitive)',
        },
        {
          key: 'sortField',
          label: 'Sort Field',
          kind: 'select',
          value: 'name',
          required: false,
          options: [
            { label: 'Created', value: 'createdAt' },
            { label: 'Name', value: 'name' },
            { label: 'Updated', value: 'updatedAt' },
          ],
          description: 'Field to sort by',
        },
        {
          key: 'sortDirection',
          label: 'Sort Direction',
          kind: 'select',
          value: 'asc',
          required: false,
          options: [
            { label: 'Ascending', value: 'asc' },
            { label: 'Descending', value: 'desc' },
          ],
        },
      ],
    },
    {
      key: 'newName',
      label: 'New Name',
      kind: 'text',
      value: '',
      required: true,
      placeholder: 'e.g. Renamed Data Table',
      description: 'The new name for the data table',
      showWhen: tableShowWhen('update'),
    },
  ],
  output: {},
};

export default dataTable;
