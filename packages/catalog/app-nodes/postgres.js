// Editor-only descriptor for n8n's Postgres v2.7 action node.
// Credentials, database discovery, schema loading, SQL execution, SSH tunnels,
// transactions, and tool execution remain inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This credential selector is locked. The simulation never creates, reads, tests, opens, tunnels, pools, or applies Postgres credentials.';
const lockedLookupNote =
  'n8n normally loads this list from the connected Postgres database. List mode remains empty; manual names remain inert authoring values.';
const lockedColumnNote =
  'n8n normally loads columns and types from the selected table. The list remains empty and any manually authored mapping metadata is never validated against or sent to a database.';

const operationOptions = [
  { label: 'Delete', value: 'deleteTable', description: 'Delete an entire table or rows in a table', action: 'Delete table or rows' },
  { label: 'Execute Query', value: 'executeQuery', description: 'Execute an SQL query', action: 'Execute a SQL query' },
  { label: 'Insert', value: 'insert', description: 'Insert rows in a table', action: 'Insert rows in a table' },
  { label: 'Insert or Update', value: 'upsert', description: 'Insert or update rows in a table', action: 'Insert or update rows in a table' },
  { label: 'Select', value: 'select', description: 'Select rows from a table', action: 'Select rows from a table' },
  { label: 'Update', value: 'update', description: 'Update rows in a table', action: 'Update rows in a table' },
];

const tableOperations = ['deleteTable', 'insert', 'upsert', 'select', 'update'];

const mappingModeOptions = [
  { label: 'Map Each Column Manually', value: 'defineBelow', description: 'Set the value for each destination column manually' },
  { label: 'Map Automatically', value: 'autoMapInputData', description: 'Use incoming properties whose names match Postgres columns' },
];

const operatorOptions = [
  { label: 'Equal', value: 'equal' },
  { label: 'Not Equal', value: '!=' },
  { label: 'Like', value: 'LIKE' },
  { label: 'Greater Than', value: '>' },
  { label: 'Less Than', value: '<' },
  { label: 'Greater Than Or Equal', value: '>=' },
  { label: 'Less Than Or Equal', value: '<=' },
  { label: 'Is Null', value: 'IS NULL' },
  { label: 'Is Not Null', value: 'IS NOT NULL' },
];

const fieldTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date and Time', value: 'dateTime' },
  { label: 'Time', value: 'time' },
  { label: 'Object', value: 'object' },
  { label: 'Options', value: 'options' },
  { label: 'Array', value: 'array' },
];

const operationWhen = (operation) => ({ resource: ['database'], operation: [operation] });

const makeLocator = ({ key, n8nKey, label, value, source, dependsOn = [], showWhen }) => ({
  key,
  n8nKey,
  label,
  kind: 'resourceLocator',
  sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value },
  sourceDefault: { mode: 'list', value },
  required: true,
  showWhen,
  modes: ['list', 'name'],
  modeOptions: [
    { label: 'From List', value: 'list', kind: 'list', searchListMethod: source },
    { label: 'By Name', value: 'name', kind: 'text' },
  ],
  options: [],
  locked: true,
  dynamicOptions: { source, dependsOn, inert: true },
  description: label === 'Schema' ? 'The schema that contains the table you want to work on' : 'The table you want to work on',
  placeholder: label === 'Schema' ? 'e.g. public' : undefined,
  simulationNote: lockedLookupNote,
});

const makeWhere = (prefix, showWhen) => ({
  key: `${prefix}Where`,
  n8nKey: 'where',
  label: 'Select Rows',
  kind: 'fixedCollection',
  sourceKind: 'fixedCollection',
  value: {},
  sourceDefault: {},
  required: false,
  collectionKey: 'values',
  collectionLabel: 'Values',
  multiple: true,
  addLabel: 'Add Condition',
  showWhen,
  description: 'If not set, all rows will be selected',
  fields: [
    {
      key: `${prefix}WhereColumn`, n8nKey: 'column', label: 'Column', kind: 'select',
      value: '', required: false, placeholder: 'e.g. ID', options: [], locked: true, dynamic: true,
      dynamicOptions: { source: 'getColumns', dependsOn: ['schema.value', 'table.value'], inert: true },
      description: 'Choose from the list, or specify an ID using an expression', simulationNote: lockedColumnNote,
    },
    {
      key: `${prefix}WhereCondition`, n8nKey: 'condition', label: 'Operator', kind: 'select',
      value: 'equal', required: false, options: operatorOptions,
      description: "The operator to check the column against. With LIKE, % matches zero or more characters and _ matches one character.",
    },
    {
      key: `${prefix}WhereValue`, n8nKey: 'value', label: 'Value', kind: 'text', value: '', required: false,
      showWhen: { [`${prefix}WhereCondition`]: ['equal', '!=', 'LIKE', '>', '<', '>=', '<='] },
      n8nHideWhen: { condition: ['IS NULL', 'IS NOT NULL'] },
    },
  ],
});

const makeCombineConditions = (prefix, showWhen) => ({
  key: `${prefix}CombineConditions`, n8nKey: 'combineConditions', label: 'Combine Conditions',
  kind: 'select', value: 'AND', required: false, showWhen,
  description: 'How to combine Select Rows: AND requires all conditions; OR requires at least one',
  options: [
    { label: 'AND', value: 'AND', description: 'Only rows that meet all the conditions are selected' },
    { label: 'OR', value: 'OR', description: 'Rows that meet at least one condition are selected' },
  ],
});

const makeSort = (prefix, showWhen) => ({
  key: `${prefix}Sort`, n8nKey: 'sort', label: 'Sort', kind: 'fixedCollection',
  sourceKind: 'fixedCollection', value: {}, sourceDefault: {}, required: false,
  collectionKey: 'values', collectionLabel: 'Values', multiple: true, addLabel: 'Add Sort Rule', showWhen,
  fields: [
    {
      key: `${prefix}SortColumn`, n8nKey: 'column', label: 'Column', kind: 'select', value: '',
      options: [], locked: true, dynamic: true,
      dynamicOptions: { source: 'getColumns', dependsOn: ['schema.value', 'table.value'], inert: true },
      description: 'Choose from the list, or specify an ID using an expression', simulationNote: lockedColumnNote,
    },
    { key: `${prefix}SortDirection`, n8nKey: 'direction', label: 'Direction', kind: 'select', value: 'ASC', options: [{ label: 'ASC', value: 'ASC' }, { label: 'DESC', value: 'DESC' }] },
  ],
});

const makeColumnsMapper = (prefix, operation, mode) => {
  const needsMatch = mode === 'update' || mode === 'upsert';
  return {
    key: `${prefix}Columns`,
    n8nKey: 'columns',
    label: 'Columns',
    kind: 'collection',
    sourceKind: 'resourceMapper',
    value: { mappingMode: 'defineBelow', value: null },
    sourceDefault: { mappingMode: 'defineBelow', value: null },
    required: true,
    noDataExpression: true,
    dynamicSchema: true,
    locked: true,
    loadOptionsDependsOn: ['table.value', 'operation'],
    resourceMapperConfig: {
      method: 'getMappingColumns', mode, fieldWords: { singular: 'column', plural: 'columns' },
      addAllFields: true, multiKeyMatch: true,
    },
    sourceVersionCondition: '@version >= 2.2',
    showWhen: operationWhen(operation),
    n8nHideWhen: { table: [''] },
    fields: [
      {
        key: `${prefix}MappingMode`, n8nKey: 'mappingMode', label: 'Mapping Column Mode',
        kind: 'select', value: 'defineBelow', required: false, options: mappingModeOptions,
      },
      ...(needsMatch
        ? [{
            key: `${prefix}MatchingColumns`, n8nKey: 'matchingColumns',
            label: mode === 'upsert' ? 'Columns to Match On' : 'Columns to Match On',
            kind: 'multiSelect', value: [], required: true, options: [], locked: true, dynamic: true,
            uniqueOnly: mode === 'upsert',
            description: mode === 'upsert'
              ? 'Unique or primary-key columns used to decide whether to insert or update'
              : 'Columns used to find the rows to update',
            simulationNote: lockedColumnNote,
          }]
        : []),
      {
        key: `${prefix}Values`, n8nKey: 'value', label: mode === 'update' ? 'Values to Update' : 'Values to Send',
        kind: 'fixedCollection', value: { fields: [] }, required: false, multiple: true,
        dynamicSchema: true, locked: true, collectionKey: 'fields', collectionLabel: 'Column', addLabel: 'Add Column',
        showWhen: { [`${prefix}MappingMode`]: ['defineBelow'] }, n8nShowWhen: { mappingMode: ['defineBelow'] },
        fields: [
          { key: `${prefix}ValueColumn`, n8nKey: 'column', label: 'Column', kind: 'text', value: '', required: true, placeholder: 'Loaded from the selected table' },
          { key: `${prefix}Value`, n8nKey: 'value', label: 'Value', kind: 'text', value: '', required: false, expressionAllowed: true },
        ],
        simulationNote: lockedColumnNote,
      },
      {
        key: `${prefix}Schema`, n8nKey: 'schema', label: 'Column Schema', kind: 'fixedCollection',
        value: { fields: [] }, required: false, multiple: true, dynamicSchema: true, locked: true,
        collectionKey: 'fields', collectionLabel: 'Column', addLabel: 'Add Schema Column',
        fields: [
          { key: `${prefix}SchemaId`, n8nKey: 'id', label: 'ID', kind: 'text', value: '', required: true },
          { key: `${prefix}SchemaDisplayName`, n8nKey: 'displayName', label: 'Display Name', kind: 'text', value: '', required: true },
          { key: `${prefix}SchemaRequired`, n8nKey: 'required', label: 'Required', kind: 'boolean', value: false },
          { key: `${prefix}SchemaDefaultMatch`, n8nKey: 'defaultMatch', label: 'Default Match', kind: 'boolean', value: false },
          { key: `${prefix}SchemaDisplay`, n8nKey: 'display', label: 'Display', kind: 'boolean', value: true },
          { key: `${prefix}SchemaType`, n8nKey: 'type', label: 'Type', kind: 'select', value: 'string', options: fieldTypeOptions },
          { key: `${prefix}SchemaCanMatch`, n8nKey: 'canBeUsedToMatch', label: 'Can Be Used to Match', kind: 'boolean', value: true },
          {
            key: `${prefix}SchemaOptions`, n8nKey: 'options', label: 'Enum Options', kind: 'fixedCollection',
            value: [], required: false, multiple: true, collectionKey: 'values', collectionLabel: 'Option', addLabel: 'Add Option',
            showWhen: { [`${prefix}SchemaType`]: ['options'] }, n8nShowWhen: { type: ['options'] },
            fields: [
              { key: `${prefix}SchemaOptionName`, n8nKey: 'name', label: 'Name', kind: 'text', value: '', required: true },
              { key: `${prefix}SchemaOptionValue`, n8nKey: 'value', label: 'Value', kind: 'text', value: '', required: true },
            ],
          },
        ],
        simulationNote: lockedColumnNote,
      },
    ],
    builderHint: {
      propertyHint: needsMatch
        ? 'Pass the complete resourceMapper object: { mappingMode, value, schema, matchingColumns }. matchingColumns must be a non-empty array of Postgres column names.'
        : 'Pass the complete resourceMapper object: { mappingMode, value, schema }. Do not add matchingColumns for Insert.',
    },
    simulationNote: lockedColumnNote,
  };
};

const commonOptionFields = (prefix) => [
  { key: `${prefix}ConnectionTimeout`, n8nKey: 'connectionTimeout', label: 'Connection Timeout', kind: 'number', value: 30, description: 'Number of seconds reserved for connecting to the database' },
  { key: `${prefix}DelayClosingIdleConnection`, n8nKey: 'delayClosingIdleConnection', label: 'Delay Closing Idle Connection', kind: 'number', value: 0, min: 0, description: 'Number of seconds to wait before an idle connection is eligible for closing' },
  {
    key: `${prefix}QueryBatching`, n8nKey: 'queryBatching', label: 'Query Batching', kind: 'select', value: 'single', noDataExpression: true,
    description: 'The way queries should be sent to the database',
    options: [
      { label: 'Single Query', value: 'single', description: 'A single query for all incoming items' },
      { label: 'Independent', value: 'independently', description: 'Execute one query per incoming item of the run' },
      { label: 'Transaction', value: 'transaction', description: 'Execute all queries in a transaction; on failure all changes are rolled back' },
    ],
  },
];

const makeLargeNumbersOption = (prefix) => ({
  key: `${prefix}LargeNumbersOutput`, n8nKey: 'largeNumbersOutput', label: 'Output Large-Format Numbers As',
  kind: 'select', value: 'text', hint: 'Applies to NUMERIC and BIGINT columns only',
  options: [
    { label: 'Numbers', value: 'numbers' },
    { label: 'Text', value: 'text', description: 'Use this for numbers longer than 16 digits to avoid precision loss' },
  ],
});

const makeOptions = (prefix, operation) => {
  const fields = [...commonOptionFields(prefix)];
  if (operation === 'deleteTable') {
    fields.unshift({
      key: `${prefix}Cascade`, n8nKey: 'cascade', label: 'Cascade', kind: 'boolean', value: false,
      showWhen: { deleteCommand: ['truncate', 'drop'] }, n8nHideWhen: { '/deleteCommand': ['delete'] },
      description: 'Whether to drop all objects that depend on the table, such as views and sequences',
    });
  }
  if (operation === 'executeQuery') {
    fields.push(
      {
        key: `${prefix}QueryReplacement`, n8nKey: 'queryReplacement', label: 'Query Parameters',
        kind: 'text', value: '', placeholder: 'e.g. value1,value2,value3',
        description: 'Comma-separated list of values to use as query parameters',
        hint: 'Reference the values in your query as $1, $2, $3…',
      },
      {
        key: `${prefix}TreatQuotedParametersAsText`, n8nKey: 'treatQueryParametersInSingleQuotesAsText',
        label: 'Treat query parameters in single quotes as text', kind: 'boolean', value: false,
        showWhen: { [`${prefix}QueryReplacement`]: { exists: true } },
        sourceShowWhenExists: `${prefix}QueryReplacement`, n8nShowWhen: { queryReplacement: [{ _cnd: { exists: true } }] },
        description: "Whether to treat query parameters enclosed in single quotes as text, for example '$1'",
      },
    );
  }
  if (['insert', 'select', 'update', 'upsert'].includes(operation)) {
    fields.push({
      key: `${prefix}OutputColumns`, n8nKey: 'outputColumns', label: 'Output Columns',
      kind: 'multiSelect', value: [], options: [{ label: '*', value: '*', description: 'All columns' }],
      locked: true, dynamic: true,
      dynamicOptions: { source: 'getColumnsMultiOptions', dependsOn: ['table.value'], inert: true },
      description: 'Choose from the list, or specify IDs using an expression', simulationNote: lockedColumnNote,
    });
  }
  fields.push(makeLargeNumbersOption(prefix));
  if (operation === 'insert') {
    fields.push(
      { key: `${prefix}SkipOnConflict`, n8nKey: 'skipOnConflict', label: 'Skip on Conflict', kind: 'boolean', value: false, description: 'Whether to skip the row instead of throwing if a unique or exclusion constraint is violated' },
      { key: `${prefix}ReplaceEmptyStrings`, n8nKey: 'replaceEmptyStrings', label: 'Replace Empty Strings with NULL', kind: 'boolean', value: false, description: 'Whether to replace empty strings with NULL in input' },
    );
  }
  if (['executeQuery', 'update', 'upsert'].includes(operation)) {
    fields.push({ key: `${prefix}ReplaceEmptyStrings`, n8nKey: 'replaceEmptyStrings', label: 'Replace Empty Strings with NULL', kind: 'boolean', value: false, description: 'Whether to replace empty strings with NULL in input' });
  }
  return {
    key: `${prefix}Options`, n8nKey: 'options', label: 'Options', kind: 'collection',
    sourceKind: 'collection', value: {}, required: false, addLabel: 'Add option',
    showWhen: operationWhen(operation), fields,
  };
};

const credentialRequirements = [
  {
    type: 'postgres',
    name: 'Postgres',
    required: true,
    testedBy: 'postgresConnectionTest',
    testBehavior: 'Open a database connection and report Connection successful',
    inert: true,
    documentationUrl: 'postgres',
    sourcePath: 'packages/nodes-base/credentials/Postgres.credentials.ts',
    sharedSshSourcePath: 'packages/nodes-base/utils/sshTunnel.properties.ts',
    fields: [
      { key: 'postgresHost', n8nKey: 'host', label: 'Host', kind: 'text', value: 'localhost' },
      { key: 'postgresDatabase', n8nKey: 'database', label: 'Database', kind: 'text', value: 'postgres' },
      { key: 'postgresUser', n8nKey: 'user', label: 'User', kind: 'text', value: 'postgres' },
      { key: 'postgresPassword', n8nKey: 'password', label: 'Password', kind: 'text', value: '', password: true },
      { key: 'postgresMaxConnections', n8nKey: 'maxConnections', label: 'Maximum Number of Connections', kind: 'number', value: 100, description: 'Keep this times the worker count below the Postgres server maximum' },
      { key: 'postgresAllowUnauthorizedCerts', n8nKey: 'allowUnauthorizedCerts', label: 'Ignore SSL Issues (Insecure)', kind: 'boolean', value: false, description: 'Whether to connect even if SSL certificate validation is not possible' },
      { key: 'postgresSsl', n8nKey: 'ssl', label: 'SSL', kind: 'select', value: 'disable', showWhen: { postgresAllowUnauthorizedCerts: [false] }, n8nShowWhen: { allowUnauthorizedCerts: [false] }, options: [{ label: 'Allow', value: 'allow' }, { label: 'Disable', value: 'disable' }, { label: 'Require', value: 'require' }] },
      { key: 'postgresPort', n8nKey: 'port', label: 'Port', kind: 'number', value: 5432 },
      { key: 'postgresSshTunnel', n8nKey: 'sshTunnel', label: 'SSH Tunnel', kind: 'boolean', value: false },
      { key: 'postgresSshAuthenticateWith', n8nKey: 'sshAuthenticateWith', label: 'SSH Authenticate with', kind: 'select', value: 'password', showWhen: { postgresSshTunnel: [true] }, n8nShowWhen: { sshTunnel: [true] }, options: [{ label: 'Password', value: 'password' }, { label: 'Private Key', value: 'privateKey' }] },
      { key: 'postgresSshHost', n8nKey: 'sshHost', label: 'SSH Host', kind: 'text', value: 'localhost', showWhen: { postgresSshTunnel: [true] }, n8nShowWhen: { sshTunnel: [true] } },
      { key: 'postgresSshPort', n8nKey: 'sshPort', label: 'SSH Port', kind: 'number', value: 22, showWhen: { postgresSshTunnel: [true] }, n8nShowWhen: { sshTunnel: [true] } },
      { key: 'postgresSshUser', n8nKey: 'sshUser', label: 'SSH User', kind: 'text', value: 'root', showWhen: { postgresSshTunnel: [true] }, n8nShowWhen: { sshTunnel: [true] } },
      { key: 'postgresSshPassword', n8nKey: 'sshPassword', label: 'SSH Password', kind: 'text', value: '', password: true, showWhen: { postgresSshTunnel: [true], postgresSshAuthenticateWith: ['password'] }, n8nShowWhen: { sshTunnel: [true], sshAuthenticateWith: ['password'] } },
      { key: 'postgresSshPrivateKey', n8nKey: 'privateKey', label: 'Private Key', kind: 'textarea', value: '', rows: 4, password: true, showWhen: { postgresSshTunnel: [true], postgresSshAuthenticateWith: ['privateKey'] }, n8nShowWhen: { sshTunnel: [true], sshAuthenticateWith: ['privateKey'] } },
      { key: 'postgresSshPassphrase', n8nKey: 'passphrase', label: 'Passphrase', kind: 'text', value: '', showWhen: { postgresSshTunnel: [true], postgresSshAuthenticateWith: ['privateKey'] }, n8nShowWhen: { sshTunnel: [true], sshAuthenticateWith: ['privateKey'] }, description: 'Passphrase used to create the key; leave empty if none was used' },
    ],
  },
];

const postgres = {
  type: 'postgres',
  n8nType: 'n8n-nodes-base.postgres',
  n8nVersion: 2.7,
  defaultVersion: 2.7,
  versionHistory: [1, 2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7],
  label: 'Postgres',
  defaultName: 'Postgres',
  subtitle: '={{ $parameter["operation"] }}',
  description: 'Get, add and update data in Postgres',
  details: 'Select, insert, update, upsert, delete, or author parameterized SQL for a Postgres database.',
  category: 'action',
  categories: ['Development', 'Data & Storage'],
  group: ['input'],
  defaults: { name: 'Postgres' },
  inputs: ['main'],
  outputs: ['main'],
  portVariants: [{ inputs: ['main'], outputs: ['main'] }],
  parameterPane: 'wide',
  usableAsTool: true,
  toolConnector: 'ai_tool',
  aiConnectorPorts: [],
  toolMetadata: { supportsAiParameters: true, staticConnectorPort: false },
  icon: '/node-icons/postgres.svg',
  n8nIcon: 'file:postgres.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { viewBox: '0 0 79 81' },
  iconAssetSha256: 'f533f1d2709857fbc024c1dc60165dda8c27719c28074df7fb0188ba09138d70',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.postgres/',
  docsMarkdown: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.postgres.md',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/postgres/',
  credentialDocsMarkdown: 'https://docs.n8n.io/integrations/builtin/credentials/postgres.md',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Postgres/Postgres.node.ts',
    implementationPath: 'packages/nodes-base/nodes/Postgres/v2/PostgresV2.node.ts',
    descriptionPath: 'packages/nodes-base/nodes/Postgres/v2/actions/versionDescription.ts',
    resourcePath: 'packages/nodes-base/nodes/Postgres/v2/actions/database/Database.resource.ts',
    commonDescriptionPath: 'packages/nodes-base/nodes/Postgres/v2/actions/common.descriptions.ts',
    operationPaths: [
      'packages/nodes-base/nodes/Postgres/v2/actions/database/deleteTable.operation.ts',
      'packages/nodes-base/nodes/Postgres/v2/actions/database/executeQuery.operation.ts',
      'packages/nodes-base/nodes/Postgres/v2/actions/database/insert.operation.ts',
      'packages/nodes-base/nodes/Postgres/v2/actions/database/upsert.operation.ts',
      'packages/nodes-base/nodes/Postgres/v2/actions/database/select.operation.ts',
      'packages/nodes-base/nodes/Postgres/v2/actions/database/update.operation.ts',
    ],
    routerPath: 'packages/nodes-base/nodes/Postgres/v2/actions/router.ts',
    listSearchPath: 'packages/nodes-base/nodes/Postgres/v2/methods/listSearch.ts',
    loadOptionsPath: 'packages/nodes-base/nodes/Postgres/v2/methods/loadOptions.ts',
    resourceMappingPath: 'packages/nodes-base/nodes/Postgres/v2/methods/resourceMapping.ts',
    credentialTestPath: 'packages/nodes-base/nodes/Postgres/v2/methods/credentialTest.ts',
    transportPath: 'packages/nodes-base/nodes/Postgres/transport/index.ts',
    metadataPath: 'packages/nodes-base/nodes/Postgres/Postgres.node.json',
    credentialPaths: ['packages/nodes-base/credentials/Postgres.credentials.ts', 'packages/nodes-base/utils/sshTunnel.properties.ts'],
    iconPath: 'packages/nodes-base/nodes/Postgres/postgres.svg',
  },
  credentialRequirements,
  params: [
    {
      key: 'postgresCredential', n8nKey: 'credentials.postgres', label: 'Credential to connect with',
      kind: 'select', sourceKind: 'credentials', value: 'postgres', sourceDefault: '', required: true,
      locked: true, options: [{ label: 'Postgres', value: 'postgres' }], simulationNote: lockedCredentialNote,
    },
    {
      key: 'resource', n8nKey: 'resource', label: 'Resource', kind: 'hidden', value: 'database',
      required: false, noDataExpression: true, options: [{ label: 'Database', value: 'database' }],
    },
    {
      key: 'operation', n8nKey: 'operation', label: 'Operation', kind: 'select', value: 'insert',
      required: false, noDataExpression: true, showWhen: { resource: ['database'] }, options: operationOptions,
    },
    makeLocator({ key: 'schema', n8nKey: 'schema', label: 'Schema', value: 'public', source: 'schemaSearch', showWhen: { resource: ['database'], operation: tableOperations } }),
    makeLocator({ key: 'table', n8nKey: 'table', label: 'Table', value: '', source: 'tableSearch', dependsOn: ['schema.value'], showWhen: { resource: ['database'], operation: tableOperations } }),

    { key: 'deleteCommand', n8nKey: 'deleteCommand', label: 'Command', kind: 'select', value: 'truncate', showWhen: operationWhen('deleteTable'), options: [
      { label: 'Truncate', value: 'truncate', description: "Only removes the table's data and preserves its structure" },
      { label: 'Delete', value: 'delete', description: "Delete rows matching Select Rows; without conditions all rows are deleted" },
      { label: 'Drop', value: 'drop', description: "Deletes the table's data and structure permanently" },
    ] },
    { key: 'deleteRestartSequences', n8nKey: 'restartSequences', label: 'Restart Sequences', kind: 'boolean', value: false, showWhen: { ...operationWhen('deleteTable'), deleteCommand: ['truncate'] }, n8nShowWhen: { deleteCommand: ['truncate'] }, description: 'Whether to reset identity (auto-increment) columns to their initial values' },
    makeWhere('delete', { ...operationWhen('deleteTable'), deleteCommand: ['delete'] }),
    makeCombineConditions('delete', { ...operationWhen('deleteTable'), deleteCommand: ['delete'] }),
    makeOptions('delete', 'deleteTable'),

    {
      key: 'executeQuery', n8nKey: 'query', label: 'Query', kind: 'textarea', sourceKind: 'string',
      value: '', required: true, noDataExpression: true, rows: 8, editor: 'sqlEditor', sqlDialect: 'PostgreSQL',
      placeholder: 'e.g. SELECT id, name FROM product WHERE quantity > $1 AND price <= $2',
      description: 'The SQL query to execute. Use n8n expressions and $1, $2, $3, etc. for Query Parameters.',
      hint: 'Consider query parameters to prevent SQL injection attacks. Add them in Options.',
      showWhen: operationWhen('executeQuery'),
      simulationNote: 'SQL remains inert authoring text and is never parsed, prepared, or executed.',
    },
    makeOptions('execute', 'executeQuery'),

    makeColumnsMapper('insert', 'insert', 'add'),
    makeOptions('insert', 'insert'),
    makeColumnsMapper('upsert', 'upsert', 'upsert'),
    makeOptions('upsert', 'upsert'),

    { key: 'selectReturnAll', n8nKey: 'returnAll', label: 'Return All', kind: 'boolean', value: false, showWhen: operationWhen('select'), description: 'Whether to return all results or only up to a given limit' },
    { key: 'selectLimit', n8nKey: 'limit', label: 'Limit', kind: 'number', value: 50, min: 1, showWhen: { ...operationWhen('select'), selectReturnAll: [false] }, n8nShowWhen: { returnAll: [false] }, description: 'Max number of results to return' },
    makeWhere('select', operationWhen('select')),
    makeCombineConditions('select', operationWhen('select')),
    makeSort('select', operationWhen('select')),
    makeOptions('select', 'select'),

    makeColumnsMapper('update', 'update', 'update'),
    makeOptions('update', 'update'),
  ],
  resources: [{ value: 'database', defaultOperation: 'insert', operations: operationOptions.map(({ value }) => value) }],
  resourceOperationParity: {
    database: {
      expected: ['deleteTable', 'executeQuery', 'insert', 'upsert', 'select', 'update'],
      represented: operationOptions.map(({ value }) => value),
      default: 'insert',
    },
  },
  operationCount: 6,
  lookupMetadata: {
    schemaSearch: { parameter: 'schema', query: 'information_schema.schemata ordered by schema_name', networkAccess: false },
    tableSearch: { parameter: 'table', dependsOn: ['schema.value'], query: 'information_schema.tables ordered by table_name', networkAccess: false },
    getColumns: { parameters: ['where.values.column', 'sort.values.column'], dependsOn: ['schema.value', 'table.value'], networkAccess: false },
    getColumnsMultiOptions: { parameter: 'options.outputColumns', includesStaticAllColumns: true, dependsOn: ['table.value'], networkAccess: false },
    getMappingColumns: {
      parameter: 'columns', dependsOn: ['table.value', 'operation'], networkAccess: false,
      supportedFieldTypes: fieldTypeOptions.map(({ value }) => value),
      upsertMatchingColumnsRestrictedToUniqueOrPrimaryKeys: true,
    },
  },
  versionBranches: [
    { versions: 1, implementation: 'PostgresV1', representedInCurrentParams: false },
    { versions: [2, 2.1], implementation: 'PostgresV2 legacy dataMode, valuesToSend, and single columnToMatchOn fields', representedInCurrentParams: false },
    { versions: '2.2–2.7', implementation: 'PostgresV2 resourceMapper columns', representedInCurrentParams: true },
    { versions: '>=2.3', behavior: 'Updated query result and error pairing behavior; no authoring field change' },
    { versions: '>=2.4', behavior: 'Converts array inputs using Postgres table schema; no authoring field change' },
    { versions: '>=2.5', behavior: 'Query parameter expression evaluation update; no authoring field change' },
    { versions: '>=2.6', behavior: 'Insert supports empty mapped items through DEFAULT VALUES; no authoring field change' },
    { versions: '>=2.7', behavior: 'DATE and date/time array outputs use string parsers; current default' },
  ],
  docsSummary: {
    operations: operationOptions.map(({ value }) => value),
    aiToolDocumented: true,
    authenticationMethods: ['databaseConnection'],
    currentDocsDrift: [
      'Credential docs mention a separate SSH Postgres Port, but the pinned credential source uses the main Postgres port as the remote tunnel destination and has no separate authoring field.',
    ],
  },
  platformGaps: [
    'The source reuses options, columns, where, combineConditions, sort, and column names across operation branches. Unique UI keys preserve stable branches while n8nKey records the native parameter names.',
    'Schema, table, column, enum, matching-column, and output-column discovery normally open a Postgres connection. Lists remain empty and all manual locator or mapping values are inert.',
    'Native resourceMapper controls are normalized to supported collection, fixedCollection, select, multiSelect, text, number, and boolean controls. Mapping mode, value, schema, matchingColumns, field types, and enum options remain represented, but no table schema is loaded.',
    'Only current v2.7 authoring controls are rendered. Legacy v1 and v2–2.1 manual mapping controls remain documented in versionBranches.',
    'Credential fields are metadata-only and the node panel exposes a locked selector. Database connections, SSL negotiation, SSH authentication/tunneling, pooling, tests, and credential access never run.',
    'The SQL editor is normalized to an inert textarea; SQL parsing, parameter substitution, batching, transactions, and execution are disabled.',
    'usableAsTool is preserved, but tool conversion is capability metadata rather than a static ai_tool connector port or executable tool runtime.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials.postgres', sourceType: 'credentials', normalizedKind: 'locked select', reason: 'Credential discovery and editors are unavailable.' },
    { n8nKey: 'schema/table', sourceType: 'resourceLocator with database listSearch', normalizedKind: 'resourceLocator', reason: 'List modes remain empty because database access is disabled.' },
    { n8nKey: 'columns', sourceType: 'resourceMapper', normalizedKind: 'collection with mapping, value, schema, and matching-column controls', reason: 'The catalog has no native resourceMapper renderer and cannot load Postgres table schemas.' },
    { n8nKey: 'where.values.column/sort.values.column/options.outputColumns', sourceType: 'dynamic options', normalizedKind: 'locked select or multiSelect', reason: 'Column discovery requires a live Postgres connection.' },
    { n8nKey: 'query', sourceType: 'SQL editor', normalizedKind: 'textarea', reason: 'SQL remains inert authoring text.' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    authentication: false,
    sslNegotiation: false,
    sshAuthentication: false,
    sshTunnel: false,
    databaseConnection: false,
    connectionPooling: false,
    schemaLookup: false,
    tableLookup: false,
    columnLookup: false,
    enumLookup: false,
    apiRequests: false,
    networkAccess: false,
    parsesSql: false,
    queryParameters: false,
    executesQueries: false,
    transactions: false,
    selectsRows: false,
    insertsRows: false,
    updatesRows: false,
    upsertsRows: false,
    deletesRows: false,
    truncatesTables: false,
    dropsTables: false,
    toolExecution: false,
    voice: false,
  },
  output: {},
};

export default postgres;
