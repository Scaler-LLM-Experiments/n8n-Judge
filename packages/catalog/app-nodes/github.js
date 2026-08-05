// Editor-only descriptor for n8n's GitHub v1.1 action node.
// Credentials, remote lookups, API calls, binary access, webhooks, waiting, and tool execution stay inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This credential selector is locked. The simulation never creates, reads, tests, refreshes, signs, or applies GitHub credentials.';
const lockedLookupNote =
  'The native list search is preserved as metadata but disabled. List mode remains empty; URL, name, file-name, and ID values remain inert authoring values.';

const resourceOptions = [
  { label: 'File', value: 'file' },
  { label: 'Issue', value: 'issue' },
  { label: 'Organization', value: 'organization' },
  { label: 'Pull Request', value: 'pullRequest' },
  { label: 'Release', value: 'release' },
  { label: 'Repository', value: 'repository' },
  { label: 'Review', value: 'review' },
  { label: 'User', value: 'user' },
  { label: 'Workflow', value: 'workflow' },
];

const organizationOperations = [
  { label: 'Get Repositories', value: 'getRepositories', description: 'Returns all repositories of an organization', action: 'Get repositories for an organization' },
  { label: 'Get Members', value: 'getMembers', description: 'Returns all members of an organization', action: 'Get members for an organization' },
];

const pullRequestOperations = [
  { label: 'Create', value: 'create', description: 'Create a new pull request', action: 'Create a pull request' },
  { label: 'Update', value: 'update', description: 'Update a pull request', action: 'Update a pull request' },
  { label: 'Close', value: 'close', description: 'Close a pull request', action: 'Close a pull request' },
  { label: 'Reopen', value: 'reopen', description: 'Reopen a pull request', action: 'Reopen a pull request' },
  { label: 'Get', value: 'get', description: 'Get the data of a single pull request', action: 'Get a pull request' },
  { label: 'Create Comment', value: 'createComment', description: 'Create a new comment on a pull request', action: 'Create a comment on a pull request' },
  { label: 'Edit Comment', value: 'editComment', description: 'Edit a comment on a pull request', action: 'Edit a comment on a pull request' },
  { label: 'Get Diff', value: 'getDiff', description: 'Get the raw diff of a pull request', action: 'Get a pull request diff' },
  { label: 'Get Patch', value: 'getPatch', description: 'Get the raw patch of a pull request', action: 'Get a pull request patch' },
  { label: 'Merge', value: 'merge', description: 'Merge a pull request', action: 'Merge a pull request' },
];

const issueOperations = [
  { label: 'Create', value: 'create', description: 'Create a new issue', action: 'Create an issue' },
  { label: 'Create Comment', value: 'createComment', description: 'Create a new comment on an issue', action: 'Create a comment on an issue' },
  { label: 'Edit', value: 'edit', description: 'Edit an issue', action: 'Edit an issue' },
  { label: 'Get', value: 'get', description: 'Get the data of a single issue', action: 'Get an issue' },
  { label: 'Lock', value: 'lock', description: 'Lock an issue', action: 'Lock an issue' },
];

const fileOperations = [
  { label: 'Create', value: 'create', description: 'Create a new file in repository', action: 'Create a file' },
  { label: 'Delete', value: 'delete', description: 'Delete a file in repository', action: 'Delete a file' },
  { label: 'Edit', value: 'edit', description: 'Edit a file in repository', action: 'Edit a file' },
  { label: 'Get', value: 'get', description: 'Get the data of a single file', action: 'Get a file' },
  { label: 'List', value: 'list', description: 'List contents of a folder', action: 'List files' },
];

const repositoryOperations = [
  { label: 'Get', value: 'get', description: 'Get the data of a single repository', action: 'Get a repository' },
  { label: 'Get Issues', value: 'getIssues', description: 'Returns issues of a repository', action: 'Get issues of a repository' },
  { label: 'Get License', value: 'getLicense', description: "Returns the contents of the repository's license file, if one is detected", action: 'Get the license of a repository' },
  { label: 'Get Profile', value: 'getProfile', description: 'Get the community profile of a repository with metrics, health score, description, license, etc', action: 'Get the profile of a repository' },
  { label: 'Get Pull Requests', value: 'getPullRequests', description: 'Returns pull requests of a repository', action: 'Get pull requests of a repository' },
  { label: 'List Popular Paths', value: 'listPopularPaths', description: 'Get the top 10 popular content paths over the last 14 days', action: 'List popular paths in a repository' },
  { label: 'List Referrers', value: 'listReferrers', description: 'Get the top 10 referrering domains over the last 14 days', action: 'List the top referrers of a repository' },
];

const userOperations = [
  { label: 'Get Repositories', value: 'getRepositories', description: 'Returns the repositories of a user', action: "Get a user's repositories" },
  { label: 'Get Issues', value: 'getUserIssues', description: 'Returns the issues assigned to the user', action: "Get a user's issues" },
  { label: 'Invite', value: 'invite', description: 'Invites a user to an organization', action: 'Invite a user' },
];

const releaseOperations = [
  { label: 'Create', value: 'create', description: 'Creates a new release', action: 'Create a release' },
  { label: 'Delete', value: 'delete', description: 'Delete a release', action: 'Delete a release' },
  { label: 'Get', value: 'get', description: 'Get a release', action: 'Get a release' },
  { label: 'Get Many', value: 'getAll', description: 'Get many repository releases', action: 'Get many releases' },
  { label: 'Update', value: 'update', description: 'Update a release', action: 'Update a release' },
];

const reviewOperations = [
  { label: 'Create', value: 'create', description: 'Creates a new review', action: 'Create a review' },
  { label: 'Get', value: 'get', description: 'Get a review for a pull request', action: 'Get a review' },
  { label: 'Get Many', value: 'getAll', description: 'Get many reviews for a pull request', action: 'Get many reviews' },
  { label: 'Update', value: 'update', description: 'Update a review', action: 'Update a review' },
];

const workflowOperations = [
  { label: 'Disable', value: 'disable', description: 'Disable a workflow', action: 'Disable a workflow' },
  { label: 'Dispatch', value: 'dispatch', description: 'Dispatch a workflow event', action: 'Dispatch a workflow event' },
  { label: 'Dispatch and Wait for Completion', value: 'dispatchAndWait', description: 'Dispatch a workflow event and wait for a webhook to be called before proceeding', action: 'Dispatch a workflow event and wait for completion' },
  { label: 'Enable', value: 'enable', description: 'Enable a workflow', action: 'Enable a workflow' },
  { label: 'Get', value: 'get', description: 'Get a workflow', action: 'Get a workflow' },
  { label: 'Get Usage', value: 'getUsage', description: 'Get the usage of a workflow', action: 'Get the usage of a workflow' },
  { label: 'List', value: 'list', description: 'List workflows', action: 'List workflows' },
];

const operationWhen = (resource, operationKey, operations, uiExtra = {}, n8nExtra = {}) => ({
  showWhen: { resource: [resource], [operationKey]: Array.isArray(operations) ? operations : [operations], ...uiExtra },
  n8nShowWhen: { resource: [resource], operation: Array.isArray(operations) ? operations : [operations], ...n8nExtra },
});

const ownerLocator = (key, showWhen, n8nShowWhen) => ({
  key,
  n8nKey: 'owner',
  label: 'Repository Owner',
  kind: 'resourceLocator',
  sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' },
  sourceDefault: { mode: 'list', value: '' },
  required: true,
  locked: true,
  dynamic: true,
  modes: ['list', 'url', 'name'],
  modeOptions: [
    { label: 'Repository Owner', value: 'list', kind: 'list', placeholder: 'Select an owner...', searchListMethod: 'getUsers', searchable: true, searchFilterRequired: true },
    {
      label: 'Link', value: 'url', kind: 'text', placeholder: 'e.g. https://github.com/n8n-io',
      extractValue: { type: 'regex', regex: 'https:\\/\\/(?:[^/]+)\\/([-_0-9a-zA-Z]+)' },
      validation: { type: 'regex', regex: 'https:\\/\\/([^/]+)\\/([-_0-9a-zA-Z]+)(?:.*)', errorMessage: 'Not a valid Github URL' },
    },
    {
      label: 'By Name', value: 'name', kind: 'text', placeholder: 'e.g. n8n-io',
      validation: { type: 'regex', regex: '[-_a-zA-Z0-9]+', errorMessage: 'Not a valid Github Owner Name' },
      url: '=https://github.com/{{$value}}',
    },
  ],
  options: [],
  showWhen,
  n8nShowWhen,
  simulationNote: lockedLookupNote,
});

const repositoryLocator = (key, showWhen, n8nShowWhen) => ({
  key,
  n8nKey: 'repository',
  label: 'Repository Name',
  kind: 'resourceLocator',
  sourceKind: 'resourceLocator',
  value: { __rl: true, mode: 'list', value: '' },
  sourceDefault: { mode: 'list', value: '' },
  required: true,
  locked: true,
  dynamic: true,
  modes: ['list', 'url', 'name'],
  modeOptions: [
    { label: 'Repository Name', value: 'list', kind: 'list', placeholder: 'Select an Repository...', searchListMethod: 'getRepositories', searchable: true },
    {
      label: 'Link', value: 'url', kind: 'text', placeholder: 'e.g. https://github.com/n8n-io/n8n',
      extractValue: { type: 'regex', regex: 'https:\\/\\/(?:[^/]+)\\/(?:[-_0-9a-zA-Z]+)\\/([-_.0-9a-zA-Z]+)' },
      validation: { type: 'regex', regex: 'https:\\/\\/([^/]+)\\/(?:[-_0-9a-zA-Z]+)\\/([-_.0-9a-zA-Z]+)(?:.*)', errorMessage: 'Not a valid Github Repository URL' },
    },
    {
      label: 'By Name', value: 'name', kind: 'text', placeholder: 'e.g. n8n',
      validation: { type: 'regex', regex: '[-_.0-9a-zA-Z]+', errorMessage: 'Not a valid Github Repository Name' },
      url: '=https://github.com/{{$parameter["owner"]}}/{{$value}}',
    },
  ],
  options: [],
  showWhen,
  n8nShowWhen,
  simulationNote: lockedLookupNote,
});

const returnAllField = (key, resource, operationKey, operation) => ({
  key, n8nKey: 'returnAll', label: 'Return All', kind: 'boolean', value: false, required: false,
  description: 'Whether to return all results or only up to a given limit',
  ...operationWhen(resource, operationKey, operation),
});

const limitField = (key, returnAllKey, resource, operationKey, operation, description = 'Max number of results to return') => ({
  key, n8nKey: 'limit', label: 'Limit', kind: 'number', value: 50, required: false, min: 1, max: 100,
  description,
  ...operationWhen(resource, operationKey, operation, { [returnAllKey]: [false] }, { returnAll: [false] }),
});

const issueFilterFields = (prefix, includeAssigneeAndCreator) => [
  ...(includeAssigneeAndCreator
    ? [
        { key: `${prefix}Assignee`, n8nKey: 'assignee', label: 'Assignee', kind: 'text', value: '', required: false, description: 'Return only issues which are assigned to a specific user' },
        { key: `${prefix}Creator`, n8nKey: 'creator', label: 'Creator', kind: 'text', value: '', required: false, description: 'Return only issues which were created by a specific user' },
      ]
    : []),
  { key: `${prefix}Mentioned`, n8nKey: 'mentioned', label: 'Mentioned', kind: 'text', value: '', required: false, description: 'Return only issues in which a specific user was mentioned' },
  { key: `${prefix}Labels`, n8nKey: 'labels', label: 'Labels', kind: 'text', value: '', required: false, description: 'Return only issues with the given labels. Multiple labels can be separated by comma.' },
  { key: `${prefix}Since`, n8nKey: 'since', label: 'Updated Since', kind: 'text', sourceKind: 'dateTime', value: '', required: false, description: 'Return only issues updated at or after this time' },
  {
    key: `${prefix}State`, n8nKey: 'state', label: 'State', kind: 'select', sourceKind: 'options', value: 'open', required: false,
    options: [
      { label: 'All', value: 'all', description: 'Returns issues with any state' },
      { label: 'Closed', value: 'closed', description: 'Return issues with "closed" state' },
      { label: 'Open', value: 'open', description: 'Return issues with "open" state' },
    ],
    description: 'The state to set',
  },
  {
    key: `${prefix}Sort`, n8nKey: 'sort', label: 'Sort', kind: 'select', sourceKind: 'options', value: 'created', required: false,
    options: [
      { label: 'Created', value: 'created', description: 'Sort by created date' },
      { label: 'Updated', value: 'updated', description: 'Sort by updated date' },
      { label: 'Comments', value: 'comments', description: 'Sort by comments' },
    ],
    description: 'The order the issues should be returned in',
  },
  {
    key: `${prefix}Direction`, n8nKey: 'direction', label: 'Direction', kind: 'select', sourceKind: 'options', value: 'desc', required: false,
    options: [
      { label: 'Ascending', value: 'asc', description: 'Sort in ascending order' },
      { label: 'Descending', value: 'desc', description: 'Sort in descending order' },
    ],
    description: 'The sort order',
  },
];

const credentialDefinitions = [
  {
    key: 'githubApiCredential', type: 'githubApi', label: 'GitHub API', authentication: 'accessToken',
    documentationSlug: 'github', sourcePath: 'packages/nodes-base/credentials/GithubApi.credentials.ts',
    testedBy: 'GET {{$credentials.server}}/user',
    fields: [
      { key: 'server', n8nKey: 'server', label: 'Github Server', kind: 'text', sourceKind: 'string', value: 'https://api.github.com', required: false, description: 'The server to connect to. Only has to be set if Github Enterprise is used.' },
      { key: 'user', n8nKey: 'user', label: 'User', kind: 'text', sourceKind: 'string', value: '', required: false },
      { key: 'accessToken', n8nKey: 'accessToken', label: 'Access Token', kind: 'text', sourceKind: 'string', value: '', required: false, password: true },
    ],
  },
  {
    key: 'githubOAuth2Credential', type: 'githubOAuth2Api', label: 'GitHub OAuth2 API', authentication: 'oAuth2',
    documentationSlug: 'github', sourcePath: 'packages/nodes-base/credentials/GithubOAuth2Api.credentials.ts', extends: ['oAuth2Api'],
    fields: [
      { key: 'grantType', n8nKey: 'grantType', label: 'Grant Type', kind: 'hidden', value: 'authorizationCode', required: false },
      { key: 'server', n8nKey: 'server', label: 'Github Server', kind: 'text', sourceKind: 'string', value: 'https://api.github.com', required: false, description: 'The server to connect to. Only has to be set if Github Enterprise is used.' },
      { key: 'authUrl', n8nKey: 'authUrl', label: 'Authorization URL', kind: 'hidden', value: '={{$self["server"] === "https://api.github.com" ? "https://github.com" : $self["server"].split("://")[0] + "://" + $self["server"].split("://")[1].split("/")[0]}}/login/oauth/authorize', required: true },
      { key: 'accessTokenUrl', n8nKey: 'accessTokenUrl', label: 'Access Token URL', kind: 'hidden', value: '={{$self["server"] === "https://api.github.com" ? "https://github.com" : $self["server"].split("://")[0] + "://" + $self["server"].split("://")[1].split("/")[0]}}/login/oauth/access_token', required: true },
      { key: 'scope', n8nKey: 'scope', label: 'Scope', kind: 'hidden', value: 'repo,admin:repo_hook,admin:org,admin:org_hook,gist,notifications,user,write:packages,read:packages,delete:packages,workflow', required: false },
      { key: 'authQueryParameters', n8nKey: 'authQueryParameters', label: 'Auth URI Query Parameters', kind: 'hidden', value: '', required: false },
      { key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'hidden', value: 'header', required: false },
    ],
  },
  {
    key: 'githubAppCredential', type: 'githubAppApi', label: 'GitHub App API', authentication: 'githubAppApi',
    documentationSlug: 'github', sourcePath: 'packages/nodes-base/credentials/GithubAppApi.credentials.ts',
    testedBy: 'GET {{$credentials.server}}/installation/repositories',
    fields: [
      { key: 'server', n8nKey: 'server', label: 'GitHub Server', kind: 'text', sourceKind: 'string', value: 'https://api.github.com', required: false, description: 'The server to connect to. Only has to be set if Github Enterprise is used.' },
      { key: 'appId', n8nKey: 'appId', label: 'App ID or Client ID', kind: 'text', sourceKind: 'string', value: '', required: true },
      { key: 'installationId', n8nKey: 'installationId', label: 'Installation ID', kind: 'text', sourceKind: 'string', value: '', required: true },
      { key: 'privateKey', n8nKey: 'privateKey', label: 'Private Key', kind: 'text', sourceKind: 'string', value: '', required: true, password: true, description: 'PEM private key from the GitHub App' },
      { key: 'accessToken', n8nKey: 'accessToken', label: 'Access Token', kind: 'hidden', value: '', required: false, expirable: true },
    ],
  },
];

const github = {
  type: 'github',
  n8nType: 'n8n-nodes-base.github',
  n8nVersion: 1.1,
  defaultVersion: 1.1,
  versionHistory: [1, 1.1],
  label: 'GitHub',
  defaultName: 'GitHub',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Consume GitHub API',
  category: 'action',
  categories: ['Development'],
  group: ['input'],
  defaults: { name: 'GitHub' },
  inputs: ['main'],
  outputs: ['main'],
  aiConnectorPorts: [],
  usableAsTool: true,
  icon: '/node-icons/github.svg',
  darkIcon: '/node-icons/github.dark.svg',
  n8nIcon: { light: 'file:github.svg', dark: 'file:github.dark.svg' },
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 40, height: 40, viewBox: '0 0 40 40' },
  iconAssetSha256: '245f1230d733d995d4eb9ff0ea998bb7414f27395d6e51033a7fd7643d694b65',
  darkIconAssetSha256: '914df9a7ebfb1e33c19612d53ca56933c7358e699fe0f7bf1f14c8151beea72c',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.github/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/github/',
  genericResources: [
    { label: 'Automatically pulling and visualizing data with n8n', icon: '📈', url: 'https://n8n.io/blog/automatically-pulling-and-visualizing-data-with-n8n/' },
    { label: 'How to automatically manage contributions to open-source projects', icon: '🏷️', url: 'https://n8n.io/blog/automation-for-maintainers-of-open-source-projects/' },
    { label: '5 workflow automations for Mattermost that we love at n8n', icon: '🤖', url: 'https://n8n.io/blog/5-workflow-automations-for-mattermost-that-we-love-at-n8n/' },
    { label: 'How to set up a no-code CI/CD pipeline with GitHub and TravisCI', icon: '🎡', url: 'https://n8n.io/blog/how-to-set-up-a-ci-cd-pipeline-with-no-code/' },
  ],
  waitingNodeTooltip: 'Execution will continue when the following webhook URL is called: <runtime resume URL>',
  waitingNodeTooltipCondition: { operation: ['dispatchAndWait'] },
  webhooks: [
    {
      name: 'default', path: '', restartWebhook: true, httpMethod: 'POST', isFullPath: true,
      responseCode: '={{defaultWebhookDescription.responseCode($parameter)}}', responseMode: 'onReceived',
      responseData: '={{defaultWebhookDescription.responseData($parameter)}}',
      responseBinaryPropertyName: '={{$parameter["responseBinaryPropertyName"]}}',
      responseContentType: '={{$parameter["options"]["responseContentType"]}}',
      responsePropertyName: '={{$parameter["options"]["responsePropertyName"]}}',
      responseHeaders: '={{$parameter["options"]["responseHeaders"]}}',
      inert: true,
    },
  ],
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Github/Github.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Github/Github.node.json',
    pullRequestDescriptionPath: 'packages/nodes-base/nodes/Github/descriptions/PullRequestDescription.ts',
    helperPaths: ['packages/nodes-base/nodes/Github/GenericFunctions.ts', 'packages/nodes-base/nodes/Github/SearchFunctions.ts'],
    credentialPaths: credentialDefinitions.map(({ sourcePath }) => sourcePath),
    iconPaths: ['packages/nodes-base/nodes/Github/github.svg', 'packages/nodes-base/nodes/Github/github.dark.svg'],
    directImports: [
      { module: 'change-case', names: ['snakeCase'], typeOnly: false },
      { module: 'n8n-workflow', names: ['IDataObject', 'IExecuteFunctions', 'IHttpRequestMethods', 'INodeExecutionData', 'INodeType', 'INodeTypeDescription', 'IWebhookFunctions', 'IWebhookResponseData', 'JsonObject'], typeOnly: true },
      { module: 'n8n-workflow', names: ['NodeApiError', 'NodeConnectionTypes', 'NodeOperationError', 'WAIT_INDEFINITELY'], typeOnly: false },
      { module: './GenericFunctions', names: ['getFileSha', 'githubApiRequest', 'githubApiRequestAllItems', 'isBase64', 'validateJSON'], typeOnly: false },
      { module: './SearchFunctions', names: ['getRefs', 'getRepositories', 'getUsers', 'getWorkflows'], typeOnly: false },
      { module: '../../utils/utilities', names: ['removeTrailingSlash'], typeOnly: false },
      { module: '../Webhook/description', names: ['defaultWebhookDescription'], typeOnly: false },
      { module: './descriptions/PullRequestDescription', names: ['pullRequestFields'], typeOnly: false },
    ],
  },
  credentialRequirements: credentialDefinitions.map(({ type, label, authentication, testedBy, fields, extends: inheritedTypes }) => ({
    type, name: label, required: true, showWhen: { authentication: [authentication] },
    ...(testedBy ? { testedBy } : {}), ...(inheritedTypes ? { extends: inheritedTypes } : {}), fields, inert: true,
  })),
  credentialUiMetadata: credentialDefinitions.map(({ key, authentication, sourcePath, ...credential }) => ({
    ...credential, key, showWhen: { authentication: [authentication] }, sourcePath,
    renderedInCredentialEditor: false, inert: true,
  })),
  params: [
    {
      key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'select', sourceKind: 'options',
      value: 'accessToken', required: false,
      options: [
        { label: 'Access Token', value: 'accessToken' },
        { label: 'OAuth2', value: 'oAuth2' },
        { label: 'GitHub App', value: 'githubAppApi' },
      ],
    },
    ...credentialDefinitions.map(({ key, type, label, authentication }) => ({
      key, n8nKey: `credentials.${type}`, label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials',
      value: type, required: true, locked: true, dynamic: true, showWhen: { authentication: [authentication] },
      options: [{ label, value: type }], simulationNote: lockedCredentialNote,
    })),
    { key: 'resource', n8nKey: 'resource', label: 'Resource', kind: 'select', sourceKind: 'options', value: 'issue', required: false, noDataExpression: true, options: resourceOptions },
    { key: 'organizationOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'getRepositories', required: false, noDataExpression: true, showWhen: { resource: ['organization'] }, options: organizationOperations },
    { key: 'pullRequestOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'create', required: false, noDataExpression: true, showWhen: { resource: ['pullRequest'] }, options: pullRequestOperations },
    { key: 'issueOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'create', required: false, noDataExpression: true, showWhen: { resource: ['issue'] }, options: issueOperations },
    { key: 'fileOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'create', required: false, noDataExpression: true, showWhen: { resource: ['file'] }, options: fileOperations },
    { key: 'repositoryOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'getIssues', required: false, noDataExpression: true, showWhen: { resource: ['repository'] }, options: repositoryOperations },
    { key: 'userOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'getRepositories', required: false, noDataExpression: true, showWhen: { resource: ['user'] }, options: userOperations },
    { key: 'releaseOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'create', required: false, noDataExpression: true, showWhen: { resource: ['release'] }, options: releaseOperations },
    { key: 'reviewOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'create', required: false, noDataExpression: true, showWhen: { resource: ['review'] }, options: reviewOperations },
    { key: 'workflowOperation', n8nKey: 'operation', label: 'Operation', kind: 'select', sourceKind: 'options', value: 'dispatch', required: false, noDataExpression: true, showWhen: { resource: ['workflow'] }, options: workflowOperations },

    ownerLocator('fileOwner', { resource: ['file'] }, { resource: ['file'] }),
    ownerLocator('issueOwner', { resource: ['issue'] }, { resource: ['issue'] }),
    ownerLocator('organizationOwner', { resource: ['organization'] }, { resource: ['organization'] }),
    ownerLocator('pullRequestOwner', { resource: ['pullRequest'] }, { resource: ['pullRequest'] }),
    ownerLocator('releaseOwner', { resource: ['release'] }, { resource: ['release'] }),
    ownerLocator('repositoryOwner', { resource: ['repository'] }, { resource: ['repository'] }),
    ownerLocator('reviewOwner', { resource: ['review'] }, { resource: ['review'] }),
    ownerLocator('userRepositoriesOwner', { resource: ['user'], userOperation: ['getRepositories'] }, { resource: ['user'], operation: ['getRepositories'] }),
    ownerLocator('workflowOwner', { resource: ['workflow'] }, { resource: ['workflow'] }),
    repositoryLocator('fileRepository', { resource: ['file'] }, { resource: ['file'] }),
    repositoryLocator('issueRepository', { resource: ['issue'] }, { resource: ['issue'] }),
    repositoryLocator('pullRequestRepository', { resource: ['pullRequest'] }, { resource: ['pullRequest'] }),
    repositoryLocator('releaseRepository', { resource: ['release'] }, { resource: ['release'] }),
    repositoryLocator('repositoryRepository', { resource: ['repository'] }, { resource: ['repository'] }),
    repositoryLocator('reviewRepository', { resource: ['review'] }, { resource: ['review'] }),
    repositoryLocator('workflowRepository', { resource: ['workflow'] }, { resource: ['workflow'] }),

    {
      key: 'workflowWaitNotice', n8nKey: 'webhookNotice',
      label: 'Your execution will pause until a webhook is called. This URL will be generated at runtime and passed to your Github workflow as a resumeUrl input.',
      kind: 'notice', value: '', required: false,
      ...operationWhen('workflow', 'workflowOperation', 'dispatchAndWait'),
      simulationNote: 'No resume URL is generated and no execution is paused or resumed.',
    },
    {
      key: 'workflowId', n8nKey: 'workflowId', label: 'Workflow', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
      locked: true, dynamic: true, modes: ['list', 'filename', 'name'], options: [],
      modeOptions: [
        { label: 'Workflow', value: 'list', kind: 'list', placeholder: 'Select a workflow...', searchListMethod: 'getWorkflows', searchable: true },
        { label: 'By File Name', value: 'filename', kind: 'text', placeholder: 'e.g. main.yaml or main.yml', validation: { type: 'regex', regex: '[a-zA-Z0-9_-]+.(yaml|yml)', errorMessage: 'Not a valid Github Workflow File Name' } },
        { label: 'By ID', value: 'name', kind: 'text', placeholder: 'e.g. 12345678', validation: { type: 'regex', regex: '\\d+', errorMessage: 'Not a valid Github Workflow ID' } },
      ],
      ...operationWhen('workflow', 'workflowOperation', ['disable', 'dispatch', 'dispatchAndWait', 'get', 'getUsage', 'enable']),
      description: 'The workflow to dispatch', simulationNote: lockedLookupNote,
    },
    {
      key: 'workflowRef', n8nKey: 'ref', label: 'Ref', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
      locked: true, dynamic: true, modes: ['list', 'name'], options: [], sourceVersionCondition: '@version >= 1.1',
      modeOptions: [
        { label: 'From List', value: 'list', kind: 'list', placeholder: 'Select a branch, tag, or commit...', searchListMethod: 'getRefs', searchable: true },
        { label: 'By Name', value: 'name', kind: 'text', placeholder: 'e.g. main', validation: { type: 'regex', regex: '^[a-zA-Z0-9/._-]+$', errorMessage: 'Not a valid branch, tag' } },
      ],
      ...operationWhen('workflow', 'workflowOperation', ['dispatch', 'dispatchAndWait']),
      description: 'The git reference for the workflow dispatch (branch, tag, or commit SHA)', simulationNote: lockedLookupNote,
    },
    {
      key: 'workflowInputs', n8nKey: 'inputs', label: 'Inputs', kind: 'textarea', sourceKind: 'json', value: '{}',
      required: false, rows: 5, ...operationWhen('workflow', 'workflowOperation', ['dispatch', 'dispatchAndWait']),
      description: 'JSON object with input parameters for the workflow',
      simulationNote: 'JSON remains unparsed authoring text and no workflow is dispatched.',
    },

    { key: 'filePath', n8nKey: 'filePath', label: 'File Path', kind: 'text', value: '', required: true, placeholder: 'docs/README.md', description: 'The file path of the file. Has to contain the full path.', ...operationWhen('file', 'fileOperation', ['create', 'delete', 'edit', 'get']) },
    { key: 'fileListPath', n8nKey: 'filePath', label: 'Path', kind: 'text', value: '', required: false, placeholder: 'docs/', description: 'The path of the folder to list', ...operationWhen('file', 'fileOperation', 'list') },
    { key: 'fileBinaryData', n8nKey: 'binaryData', label: 'Binary File', kind: 'boolean', value: false, required: true, description: 'Whether the data to upload should be taken from binary field', ...operationWhen('file', 'fileOperation', ['create', 'edit']) },
    { key: 'fileContent', n8nKey: 'fileContent', label: 'File Content', kind: 'text', value: '', required: true, placeholder: '', description: 'The text content of the file', ...operationWhen('file', 'fileOperation', ['create', 'edit'], { fileBinaryData: [false] }, { binaryData: [false] }) },
    { key: 'fileInputBinaryField', n8nKey: 'binaryPropertyName', label: 'Input Binary Field', kind: 'text', value: 'data', required: true, placeholder: '', hint: 'The name of the input binary field containing the file to be written', ...operationWhen('file', 'fileOperation', ['create', 'edit'], { fileBinaryData: [true] }, { binaryData: [true] }) },
    { key: 'fileCommitMessage', n8nKey: 'commitMessage', label: 'Commit Message', kind: 'text', value: '', required: true, ...operationWhen('file', 'fileOperation', ['create', 'delete', 'edit']) },
    {
      key: 'fileAdditionalParameters', n8nKey: 'additionalParameters', label: 'Additional Parameters', kind: 'fixedCollection', sourceKind: 'fixedCollection',
      value: {}, required: false, addLabel: 'Add Parameter', description: 'Additional fields to add',
      ...operationWhen('file', 'fileOperation', ['create', 'delete', 'edit']),
      fields: [
        {
          key: 'fileAuthor', n8nKey: 'author', label: 'Author', kind: 'collection', value: {}, required: false, addLabel: 'Add Author',
          fields: [
            { key: 'fileAuthorName', n8nKey: 'name', label: 'Name', kind: 'text', value: '', required: false, description: 'The name of the author of the commit' },
            { key: 'fileAuthorEmail', n8nKey: 'email', label: 'Email', kind: 'text', value: '', required: false, placeholder: 'name@email.com', description: 'The email of the author of the commit' },
          ],
        },
        {
          key: 'fileBranchGroup', n8nKey: 'branch', label: 'Branch', kind: 'collection', value: {}, required: false, addLabel: 'Add Branch',
          fields: [{ key: 'fileBranch', n8nKey: 'branch', label: 'Branch', kind: 'text', value: '', required: false, description: 'The branch to commit to. If not set the repository’s default branch (usually master) is used.' }],
        },
        {
          key: 'fileCommitter', n8nKey: 'committer', label: 'Committer', kind: 'collection', value: {}, required: false, addLabel: 'Add Committer',
          fields: [
            { key: 'fileCommitterName', n8nKey: 'name', label: 'Name', kind: 'text', value: '', required: false, description: 'The name of the committer of the commit' },
            { key: 'fileCommitterEmail', n8nKey: 'email', label: 'Email', kind: 'text', value: '', required: false, placeholder: 'name@email.com', description: 'The email of the committer of the commit' },
          ],
        },
      ],
    },
    { key: 'fileAsBinaryProperty', n8nKey: 'asBinaryProperty', label: 'As Binary Property', kind: 'boolean', value: true, required: false, description: 'Whether to set the data of the file as binary property instead of returning the raw API response', ...operationWhen('file', 'fileOperation', 'get') },
    { key: 'fileOutputBinaryField', n8nKey: 'binaryPropertyName', label: 'Put Output File in Field', kind: 'text', value: 'data', required: true, placeholder: '', hint: 'The name of the output binary field to put the file in', ...operationWhen('file', 'fileOperation', 'get', { fileAsBinaryProperty: [true] }, { asBinaryProperty: [true] }) },
    {
      key: 'fileGetAdditionalParameters', n8nKey: 'additionalParameters', label: 'Additional Parameters', kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Parameter', description: 'Additional fields to add',
      ...operationWhen('file', 'fileOperation', 'get'),
      fields: [{ key: 'fileReference', n8nKey: 'reference', label: 'Reference', kind: 'text', value: '', required: false, placeholder: 'master', description: 'The name of the commit/branch/tag. Default: the repository’s default branch (usually master).' }],
    },

    { key: 'issueCreateTitle', n8nKey: 'title', label: 'Title', kind: 'text', value: '', required: true, description: 'The title of the issue', ...operationWhen('issue', 'issueOperation', 'create') },
    { key: 'issueCreateBody', n8nKey: 'body', label: 'Body', kind: 'textarea', value: '', required: false, rows: 5, description: 'The body of the issue', ...operationWhen('issue', 'issueOperation', 'create') },
    {
      key: 'issueCreateLabels', n8nKey: 'labels', label: 'Labels', kind: 'collection', sourceKind: 'collection', value: { label: '' }, required: false, multiple: true, addLabel: 'Add Label',
      ...operationWhen('issue', 'issueOperation', 'create'),
      fields: [{ key: 'issueCreateLabel', n8nKey: 'label', label: 'Label', kind: 'text', value: '', required: false, description: 'Label to add to issue' }],
    },
    {
      key: 'issueCreateAssignees', n8nKey: 'assignees', label: 'Assignees', kind: 'collection', sourceKind: 'collection', value: { assignee: '' }, required: false, multiple: true, addLabel: 'Add Assignee',
      ...operationWhen('issue', 'issueOperation', 'create'),
      fields: [{ key: 'issueCreateAssignee', n8nKey: 'assignee', label: 'Assignee', kind: 'text', value: '', required: false, description: 'User to assign issue too' }],
    },
    { key: 'issueCommentNumber', n8nKey: 'issueNumber', label: 'Issue Number', kind: 'number', value: 0, required: true, description: 'The number of the issue on which to create the comment on', ...operationWhen('issue', 'issueOperation', 'createComment') },
    { key: 'issueCommentBody', n8nKey: 'body', label: 'Body', kind: 'textarea', value: '', required: false, rows: 5, description: 'The body of the comment', ...operationWhen('issue', 'issueOperation', 'createComment') },
    { key: 'issueEditNumber', n8nKey: 'issueNumber', label: 'Issue Number', kind: 'number', value: 0, required: true, description: 'The number of the issue edit', ...operationWhen('issue', 'issueOperation', 'edit') },
    {
      key: 'issueEditFields', n8nKey: 'editFields', label: 'Edit Fields', kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Field',
      ...operationWhen('issue', 'issueOperation', 'edit'),
      fields: [
        {
          key: 'issueEditAssignees', n8nKey: 'assignees', label: 'Assignees', kind: 'collection', sourceKind: 'collection', value: { assignee: '' }, required: false, multiple: true, addLabel: 'Add Assignee',
          fields: [{ key: 'issueEditAssignee', n8nKey: 'assignee', label: 'Assignees', kind: 'text', value: '', required: false, description: 'User to assign issue to' }],
        },
        { key: 'issueEditBody', n8nKey: 'body', label: 'Body', kind: 'textarea', value: '', required: false, rows: 5, description: 'The body of the issue' },
        {
          key: 'issueEditLabels', n8nKey: 'labels', label: 'Labels', kind: 'collection', sourceKind: 'collection', value: { label: '' }, required: false, multiple: true, addLabel: 'Add Label',
          fields: [{ key: 'issueEditLabel', n8nKey: 'label', label: 'Label', kind: 'text', value: '', required: false, description: 'Label to add to issue' }],
        },
        {
          key: 'issueEditState', n8nKey: 'state', label: 'State', kind: 'select', sourceKind: 'options', value: 'open', required: false,
          options: [
            { label: 'Closed', value: 'closed', description: 'Set the state to "closed"' },
            { label: 'Open', value: 'open', description: 'Set the state to "open"' },
          ],
          description: 'The state to set',
        },
        {
          key: 'issueEditStateReason', n8nKey: 'state_reason', label: 'State Reason', kind: 'select', sourceKind: 'options', value: 'completed', required: false,
          options: [
            { label: 'Completed', value: 'completed', description: 'Issue is completed' },
            { label: 'Not Planned', value: 'not_planned', description: 'Issue is not planned' },
            { label: 'Reopened', value: 'reopened', description: 'Issue is reopened' },
          ],
          description: 'The reason for the state change',
        },
        { key: 'issueEditTitle', n8nKey: 'title', label: 'Title', kind: 'text', value: '', required: false, description: 'The title of the issue' },
      ],
    },
    { key: 'issueGetNumber', n8nKey: 'issueNumber', label: 'Issue Number', kind: 'number', value: 0, required: true, description: 'The issue number to get data for', ...operationWhen('issue', 'issueOperation', 'get') },
    { key: 'issueLockNumber', n8nKey: 'issueNumber', label: 'Issue Number', kind: 'number', value: 0, required: true, description: 'The issue number to lock', ...operationWhen('issue', 'issueOperation', 'lock') },
    {
      key: 'issueLockReason', n8nKey: 'lockReason', label: 'Lock Reason', kind: 'select', sourceKind: 'options', value: 'resolved', required: false,
      ...operationWhen('issue', 'issueOperation', 'lock'),
      options: [
        { label: 'Off-Topic', value: 'off-topic', description: 'The issue is Off-Topic' },
        { label: 'Too Heated', value: 'too heated', description: 'The discussion is too heated' },
        { label: 'Resolved', value: 'resolved', description: 'The issue got resolved' },
        { label: 'Spam', value: 'spam', description: 'The issue is spam' },
      ],
      description: 'The reason for locking the issue',
    },

    { key: 'pullRequestCreateBase', n8nKey: 'base', label: 'Base Branch', kind: 'text', value: '', required: true, placeholder: 'master', description: 'The branch you want to merge into (e.g. master)', ...operationWhen('pullRequest', 'pullRequestOperation', 'create') },
    { key: 'pullRequestCreateHead', n8nKey: 'head', label: 'Head Branch', kind: 'text', value: '', required: true, placeholder: 'feature or johndoe:featurebranch', description: 'The branch containing your changes. For a cross‑fork PR, use the format owner:branchname (e.g. johndoe:featurebranch).', ...operationWhen('pullRequest', 'pullRequestOperation', 'create') },
    { key: 'pullRequestCreateTitle', n8nKey: 'title', label: 'Title', kind: 'text', value: '', required: true, description: 'The title of the pull request', ...operationWhen('pullRequest', 'pullRequestOperation', 'create') },
    { key: 'pullRequestCreateBody', n8nKey: 'body', label: 'Body', kind: 'textarea', value: '', required: false, rows: 5, description: 'The body of the pull request', ...operationWhen('pullRequest', 'pullRequestOperation', 'create') },
    { key: 'pullRequestCreateDraft', n8nKey: 'draft', label: 'Create a Draft Pull Request', kind: 'boolean', value: false, required: false, description: 'Whether to create the pull request as a draft', ...operationWhen('pullRequest', 'pullRequestOperation', 'create') },
    { key: 'pullRequestNumber', n8nKey: 'pullRequestNumber', label: 'PR Number', kind: 'number', value: 0, required: true, description: 'The number of the pull request', ...operationWhen('pullRequest', 'pullRequestOperation', ['update', 'close', 'reopen', 'get', 'createComment', 'getDiff', 'getPatch', 'merge']) },
    {
      key: 'pullRequestEditFields', n8nKey: 'editFields', label: 'Edit Fields', kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Field',
      ...operationWhen('pullRequest', 'pullRequestOperation', 'update'),
      fields: [
        { key: 'pullRequestEditTitle', n8nKey: 'title', label: 'Title', kind: 'text', value: '', required: false, description: 'The new title of the pull request' },
        { key: 'pullRequestEditBody', n8nKey: 'body', label: 'Body', kind: 'textarea', value: '', required: false, rows: 5, description: 'The new body of the pull request' },
        { key: 'pullRequestEditState', n8nKey: 'state', label: 'State', kind: 'select', sourceKind: 'options', value: '', required: false, options: [{ label: 'Open', value: 'open' }, { label: 'Closed', value: 'closed' }], description: 'The state of the pull request' },
        { key: 'pullRequestEditBase', n8nKey: 'base', label: 'Base Branch', kind: 'text', value: '', required: false, description: 'The branch you want to merge into (e.g. master)' },
      ],
    },
    { key: 'pullRequestCommentBody', n8nKey: 'body', label: 'Body', kind: 'textarea', value: '', required: true, rows: 5, description: 'The body of the comment', ...operationWhen('pullRequest', 'pullRequestOperation', 'createComment') },
    { key: 'pullRequestEditCommentId', n8nKey: 'commentId', label: 'Comment ID', kind: 'number', value: 0, required: true, description: 'The ID of the comment to edit', ...operationWhen('pullRequest', 'pullRequestOperation', 'editComment') },
    { key: 'pullRequestEditCommentBody', n8nKey: 'body', label: 'Body', kind: 'textarea', value: '', required: true, rows: 5, description: 'The body of the comment', ...operationWhen('pullRequest', 'pullRequestOperation', 'editComment') },
    { key: 'pullRequestMergeMethod', n8nKey: 'mergeMethod', label: 'Merge Method', kind: 'select', sourceKind: 'options', value: 'merge', required: false, options: [{ label: 'Merge Commit', value: 'merge' }, { label: 'Squash and Merge', value: 'squash' }, { label: 'Rebase and Merge', value: 'rebase' }], ...operationWhen('pullRequest', 'pullRequestOperation', 'merge') },
    { key: 'pullRequestCommitTitle', n8nKey: 'commitTitle', label: 'Commit Title', kind: 'text', value: '', required: false, description: 'Title for the automatic merge commit', ...operationWhen('pullRequest', 'pullRequestOperation', 'merge') },
    { key: 'pullRequestCommitMessage', n8nKey: 'commitMessage', label: 'Commit Message', kind: 'textarea', value: '', required: false, rows: 4, description: 'Extra detail to append to automatic merge commit', ...operationWhen('pullRequest', 'pullRequestOperation', 'merge') },
    { key: 'pullRequestMergeQueueNotice', n8nKey: 'mergeQueueNotice', label: 'If a merge queue is required on the target branch, this request will automatically enqueue the pull request and return 202 Accepted. If no queue is required, the pull request will be merged immediately and return 200 OK.', kind: 'notice', value: '', required: false, ...operationWhen('pullRequest', 'pullRequestOperation', 'merge') },

    { key: 'releaseTag', n8nKey: 'releaseTag', label: 'Tag', kind: 'text', value: '', required: true, description: 'The tag of the release', ...operationWhen('release', 'releaseOperation', 'create') },
    {
      key: 'releaseCreateAdditionalFields', n8nKey: 'additionalFields', label: 'Additional Fields', kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Field',
      ...operationWhen('release', 'releaseOperation', 'create'),
      fields: [
        { key: 'releaseCreateName', n8nKey: 'name', label: 'Name', kind: 'text', value: '', required: false, description: 'The name of the issue' },
        { key: 'releaseCreateBody', n8nKey: 'body', label: 'Body', kind: 'textarea', value: '', required: false, rows: 5, description: 'The body of the release' },
        { key: 'releaseCreateDraft', n8nKey: 'draft', label: 'Draft', kind: 'boolean', value: false, required: false, description: 'Whether to create a draft (unpublished) release, "false" to create a published one' },
        { key: 'releaseCreatePrerelease', n8nKey: 'prerelease', label: 'Prerelease', kind: 'boolean', value: false, required: false, description: 'Whether to point out that the release is non-production ready' },
        { key: 'releaseCreateTargetCommitish', n8nKey: 'target_commitish', label: 'Target Commitish', kind: 'text', value: '', required: false, description: "Specifies the commitish value that determines where the Git tag is created from. Can be any branch or commit SHA. Unused if the Git tag already exists. Default: the repository's default branch(usually master)." },
      ],
    },
    { key: 'releaseId', n8nKey: 'release_id', label: 'Release ID', kind: 'text', value: '', required: true, ...operationWhen('release', 'releaseOperation', ['get', 'delete', 'update']) },
    {
      key: 'releaseUpdateAdditionalFields', n8nKey: 'additionalFields', label: 'Additional Fields', kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Field',
      ...operationWhen('release', 'releaseOperation', 'update'),
      fields: [
        { key: 'releaseUpdateBody', n8nKey: 'body', label: 'Body', kind: 'textarea', value: '', required: false, rows: 5, description: 'The body of the release' },
        { key: 'releaseUpdateDraft', n8nKey: 'draft', label: 'Draft', kind: 'boolean', value: false, required: false, description: 'Whether to create a draft (unpublished) release, "false" to create a published one' },
        { key: 'releaseUpdateName', n8nKey: 'name', label: 'Name', kind: 'text', value: '', required: false, description: 'The name of the release' },
        { key: 'releaseUpdatePrerelease', n8nKey: 'prerelease', label: 'Prerelease', kind: 'boolean', value: false, required: false, description: 'Whether to point out that the release is non-production ready' },
        { key: 'releaseUpdateTagName', n8nKey: 'tag_name', label: 'Tag Name', kind: 'text', value: '', required: false, description: 'The name of the tag' },
        { key: 'releaseUpdateTargetCommitish', n8nKey: 'target_commitish', label: 'Target Commitish', kind: 'text', value: '', required: false, description: "Specifies the commitish value that determines where the Git tag is created from. Can be any branch or commit SHA. Unused if the Git tag already exists. Default: the repository's default branch(usually master)." },
      ],
    },
    returnAllField('releaseReturnAll', 'release', 'releaseOperation', 'getAll'),
    limitField('releaseLimit', 'releaseReturnAll', 'release', 'releaseOperation', 'getAll'),

    returnAllField('repositoryIssuesReturnAll', 'repository', 'repositoryOperation', 'getIssues'),
    limitField('repositoryIssuesLimit', 'repositoryIssuesReturnAll', 'repository', 'repositoryOperation', 'getIssues'),
    {
      key: 'repositoryIssuesFilters', n8nKey: 'getRepositoryIssuesFilters', label: 'Filters', kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Filter',
      fields: issueFilterFields('repositoryIssues', true), ...operationWhen('repository', 'repositoryOperation', 'getIssues'),
    },
    returnAllField('repositoryPullRequestsReturnAll', 'repository', 'repositoryOperation', 'getPullRequests'),
    limitField('repositoryPullRequestsLimit', 'repositoryPullRequestsReturnAll', 'repository', 'repositoryOperation', 'getPullRequests', 'Max number of results to return. Maximum value is <a href="https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests">100</a>.'),
    {
      key: 'repositoryPullRequestsFilters', n8nKey: 'getRepositoryPullRequestsFilters', label: 'Filters', kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Filter',
      ...operationWhen('repository', 'repositoryOperation', 'getPullRequests'),
      fields: [
        {
          key: 'repositoryPullRequestsState', n8nKey: 'state', label: 'State', kind: 'select', sourceKind: 'options', value: 'open', required: false,
          options: [
            { label: 'All', value: 'all', description: 'Returns pull requests with any state' },
            { label: 'Closed', value: 'closed', description: 'Return pull requests with "closed" state' },
            { label: 'Open', value: 'open', description: 'Return pull requests with "open" state' },
          ],
          description: 'The state to set',
        },
        {
          key: 'repositoryPullRequestsSort', n8nKey: 'sort', label: 'Sort', kind: 'select', sourceKind: 'options', value: 'created', required: false,
          options: [
            { label: 'Created', value: 'created', description: 'Sort by created date' },
            { label: 'Updated', value: 'updated', description: 'Sort by updated date' },
            { label: 'Popularity', value: 'popularity', description: 'Sort by number of comments' },
            { label: 'Long-Running', value: 'long-running', description: 'Sort by date created and will limit the results to pull requests that have been open for more than a month and have had activity within the past month' },
          ],
          description: 'The order the pull requests should be returned in',
        },
        {
          key: 'repositoryPullRequestsDirection', n8nKey: 'direction', label: 'Direction', kind: 'select', sourceKind: 'options', value: 'desc', required: false,
          options: [{ label: 'Ascending', value: 'asc', description: 'Sort in ascending order' }, { label: 'Descending', value: 'desc', description: 'Sort in descending order' }],
          description: 'The sort order',
        },
      ],
    },

    { key: 'reviewGetOrUpdatePullRequestNumber', n8nKey: 'pullRequestNumber', label: 'PR Number', kind: 'number', value: 0, required: true, description: 'The number of the pull request', ...operationWhen('review', 'reviewOperation', ['get', 'update']) },
    { key: 'reviewId', n8nKey: 'reviewId', label: 'Review ID', kind: 'text', value: '', required: true, description: 'ID of the review', ...operationWhen('review', 'reviewOperation', ['get', 'update']) },
    { key: 'reviewGetAllPullRequestNumber', n8nKey: 'pullRequestNumber', label: 'PR Number', kind: 'number', value: 0, required: true, description: 'The number of the pull request', ...operationWhen('review', 'reviewOperation', 'getAll') },
    returnAllField('reviewReturnAll', 'review', 'reviewOperation', 'getAll'),
    limitField('reviewLimit', 'reviewReturnAll', 'review', 'reviewOperation', 'getAll'),
    { key: 'reviewCreatePullRequestNumber', n8nKey: 'pullRequestNumber', label: 'PR Number', kind: 'number', value: 0, required: true, description: 'The number of the pull request to review', ...operationWhen('review', 'reviewOperation', 'create') },
    {
      key: 'reviewEvent', n8nKey: 'event', label: 'Event', kind: 'select', sourceKind: 'options', value: 'approve', required: false,
      ...operationWhen('review', 'reviewOperation', 'create'),
      options: [
        { label: 'Approve', value: 'approve', description: 'Approve the pull request' },
        { label: 'Request Change', value: 'requestChanges', description: 'Request code changes' },
        { label: 'Comment', value: 'comment', description: 'Add a comment without approval or change requests' },
        { label: 'Pending', value: 'pending', description: 'You will need to submit the pull request review when you are ready' },
      ],
      description: 'The review action you want to perform',
    },
    { key: 'reviewCreateBody', n8nKey: 'body', label: 'Body', kind: 'text', value: '', required: false, description: 'The body of the review (required for events Request Changes or Comment)', ...operationWhen('review', 'reviewOperation', 'create', { reviewEvent: ['requestChanges', 'comment'] }, { event: ['requestChanges', 'comment'] }) },
    {
      key: 'reviewCreateAdditionalFields', n8nKey: 'additionalFields', label: 'Additional Fields', kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Field',
      ...operationWhen('review', 'reviewOperation', 'create'),
      fields: [{ key: 'reviewCommitId', n8nKey: 'commitId', label: 'Commit ID', kind: 'text', value: '', required: false, description: 'The SHA of the commit that needs a review, if different from the latest' }],
    },
    { key: 'reviewUpdateBody', n8nKey: 'body', label: 'Body', kind: 'text', value: '', required: false, description: 'The body of the review', ...operationWhen('review', 'reviewOperation', 'update') },

    returnAllField('userRepositoriesReturnAll', 'user', 'userOperation', 'getRepositories'),
    limitField('userRepositoriesLimit', 'userRepositoriesReturnAll', 'user', 'userOperation', 'getRepositories'),
    { key: 'userInviteOrganization', n8nKey: 'organization', label: 'Organization', kind: 'text', value: '', required: true, description: 'The GitHub organization that the user is being invited to', ...operationWhen('user', 'userOperation', 'invite') },
    { key: 'userInviteEmail', n8nKey: 'email', label: 'Email', kind: 'text', value: '', required: true, placeholder: 'name@email.com', description: 'The email address of the invited user', ...operationWhen('user', 'userOperation', 'invite') },
    returnAllField('userIssuesReturnAll', 'user', 'userOperation', 'getUserIssues'),
    limitField('userIssuesLimit', 'userIssuesReturnAll', 'user', 'userOperation', 'getUserIssues'),
    {
      key: 'userIssuesFilters', n8nKey: 'getUserIssuesFilters', label: 'Filters', kind: 'collection', sourceKind: 'collection', value: {}, required: false, addLabel: 'Add Filter',
      fields: issueFilterFields('userIssues', false), ...operationWhen('user', 'userOperation', 'getUserIssues'),
    },

    returnAllField('organizationRepositoriesReturnAll', 'organization', 'organizationOperation', 'getRepositories'),
    limitField('organizationRepositoriesLimit', 'organizationRepositoriesReturnAll', 'organization', 'organizationOperation', 'getRepositories'),
    returnAllField('organizationMembersReturnAll', 'organization', 'organizationOperation', 'getMembers'),
    limitField('organizationMembersLimit', 'organizationMembersReturnAll', 'organization', 'organizationOperation', 'getMembers'),
  ],
  resourceOperationParity: {
    file: { expected: ['create', 'delete', 'edit', 'get', 'list'], represented: fileOperations.map(({ value }) => value), default: 'create' },
    issue: { expected: ['create', 'createComment', 'edit', 'get', 'lock'], represented: issueOperations.map(({ value }) => value), default: 'create' },
    organization: { expected: ['getRepositories', 'getMembers'], represented: organizationOperations.map(({ value }) => value), default: 'getRepositories' },
    pullRequest: { expected: ['create', 'update', 'close', 'reopen', 'get', 'createComment', 'editComment', 'getDiff', 'getPatch', 'merge'], represented: pullRequestOperations.map(({ value }) => value), default: 'create' },
    release: { expected: ['create', 'delete', 'get', 'getAll', 'update'], represented: releaseOperations.map(({ value }) => value), default: 'create' },
    repository: { expected: ['get', 'getIssues', 'getLicense', 'getProfile', 'getPullRequests', 'listPopularPaths', 'listReferrers'], represented: repositoryOperations.map(({ value }) => value), default: 'getIssues' },
    review: { expected: ['create', 'get', 'getAll', 'update'], represented: reviewOperations.map(({ value }) => value), default: 'create' },
    user: { expected: ['getRepositories', 'getUserIssues', 'invite'], represented: userOperations.map(({ value }) => value), default: 'getRepositories' },
    workflow: { expected: ['disable', 'dispatch', 'dispatchAndWait', 'enable', 'get', 'getUsage', 'list'], represented: workflowOperations.map(({ value }) => value), default: 'dispatch' },
  },
  operationCount: 48,
  docsSummary: {
    sourceOfTruth: 'Pinned implementation; public documentation is supplementary and currently omits three implemented operations.',
    documentedAuthenticationMethods: ['accessToken', 'oAuth2'],
    implementedAuthenticationMethods: ['accessToken', 'oAuth2', 'githubAppApi'],
    documentedOperationGaps: ['organization.getMembers', 'user.getUserIssues', 'workflow.dispatchAndWait'],
    aiToolDocumented: true,
  },
  lookupMetadata: {
    getUsers: { parameter: 'owner', searchable: true, searchFilterRequired: true, networkAccess: false },
    getRepositories: { parameter: 'repository', dependsOn: ['owner'], searchable: true, networkAccess: false },
    getWorkflows: { parameter: 'workflowId', dependsOn: ['owner', 'repository'], searchable: true, networkAccess: false },
    getRefs: { parameter: 'ref', dependsOn: ['owner', 'repository'], searchable: true, networkAccess: false },
  },
  versionBranches: [
    { versions: '<= 1', n8nKey: 'ref', sourceKind: 'string', default: 'main', representedInCurrentParams: false },
    { versions: '>= 1.1', n8nKey: 'ref', sourceKind: 'resourceLocator', default: { mode: 'list', value: '' }, representedInCurrentParams: true },
  ],
  platformGaps: [
    'The native node reuses operation, owner, repository, filePath, body, pullRequestNumber, returnAll, limit, additionalFields, additionalParameters, and binaryPropertyName across conditional branches. Unique UI keys keep every branch stable while n8nKey records each real parameter name.',
    'The source uses hide conditions for shared owner and repository locators. Resource-scoped UI locator copies preserve the effective current visibility without relying on unsupported hide-condition rendering.',
    'Owner, repository, workflow, and ref list modes normally invoke getUsers, getRepositories, getWorkflows, and getRefs. The method contracts remain metadata-only and every remote list stays locked and empty.',
    'The current v1.1 resourceLocator ref is rendered; the legacy v1 string ref with default main is retained only in versionBranches because the catalog ships one current schema per node.',
    'Native JSON and dateTime controls are normalized to inert textarea and text controls. JSON is not parsed, and dates are not interpreted.',
    'The workflow dispatch-and-wait notice, restart webhook, and waiting tooltip are descriptive only. No URL, listener, timer, pause, or resume capability exists.',
    'Credential forms are retained as metadata while locked selectors are shown in the node panel. OAuth, GitHub App JWT signing, installation-token exchange, tests, and authentication never run.',
    'The source marks GitHub usableAsTool, but tool conversion is represented as capability metadata rather than a static ai_tool connector port or executable tool runtime.',
    'The public node and credential docs currently omit organization getMembers, user getUserIssues, workflow dispatchAndWait, and GitHub App authentication; the pinned implementation remains the parity authority.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials', sourceType: 'credentials', normalizedKind: 'locked select', reason: 'Credential discovery and editors are unavailable.' },
    { n8nKey: 'owner/repository/workflowId/ref', sourceType: 'resourceLocator with remote listSearch', normalizedKind: 'resourceLocator', reason: 'List modes remain empty because GitHub lookups are disabled.' },
    { n8nKey: 'inputs', sourceType: 'json', normalizedKind: 'textarea', reason: 'JSON stays inert authoring text.' },
    { n8nKey: 'getRepositoryIssuesFilters.since/getUserIssuesFilters.since', sourceType: 'dateTime', normalizedKind: 'text', reason: 'Dates remain plain authoring text.' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    credentialRefresh: false,
    authentication: false,
    oauthAuthorization: false,
    oauthRefresh: false,
    githubAppJwtSigning: false,
    githubAppTokenExchange: false,
    ownerLookup: false,
    repositoryLookup: false,
    workflowLookup: false,
    refLookup: false,
    apiRequests: false,
    networkAccess: false,
    fileRead: false,
    fileWrite: false,
    binaryAccess: false,
    binaryTransfer: false,
    jsonParsing: false,
    issueMutation: false,
    pullRequestMutation: false,
    repositoryRead: false,
    releaseMutation: false,
    reviewMutation: false,
    userInvitation: false,
    workflowDispatch: false,
    createsWaitWebhook: false,
    waitsForCompletion: false,
    resumesExecutions: false,
    toolExecution: false,
    voice: false,
  },
  output: {},
};

export default github;
