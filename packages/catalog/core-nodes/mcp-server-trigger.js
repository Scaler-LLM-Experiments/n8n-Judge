// Editor-only descriptor for @n8n/n8n-nodes-langchain's MCP Server Trigger v2.
// It models the live authoring surface without opening an MCP server, registering
// webhooks, authenticating requests, exposing tools, or executing workflows.

const authenticationHint =
  "Default to 'none'. n8n exposes inbound trigger URLs publicly by design. Only select an authentication method when the user explicitly asks to authenticate inbound traffic.";

const lockedCredentialNote =
  'This selector and its credential schema are authoring metadata only. The simulation never discovers, creates, reads, resolves, tests, or applies credentials.';

const authenticationOptions = [
  { label: 'None', value: 'none' },
  {
    label: 'n8n User Auth (OAuth2)',
    value: 'n8nOAuth2',
    description: 'Require user to give consent to use their n8n account',
    sourceVersionCondition: '@version >= 2',
  },
  { label: 'Bearer Auth', value: 'bearerAuth' },
  { label: 'Header Auth', value: 'headerAuth' },
];

const mcpServerTrigger = {
  type: 'mcp-server-trigger',
  n8nType: '@n8n/n8n-nodes-langchain.mcpTrigger',
  n8nVersion: 2,
  defaultVersion: 2,
  versionHistory: [1, 1.1, 2],
  label: 'MCP Server Trigger',
  defaultName: 'MCP Server Trigger',
  subtitle: '',
  description: 'Expose n8n tools as an MCP Server endpoint',
  details:
    'Configure an authenticated MCP endpoint and attach AI Tool sub-nodes for MCP clients to discover. This catalog entry models authoring metadata only.',
  category: 'trigger',
  categories: ['AI', 'Core Nodes'],
  subcategory: 'Model Context Protocol',
  subcategories: ['Root Nodes', 'Model Context Protocol', 'Other Trigger Nodes'],
  group: ['trigger'],
  inputs: [{ type: 'ai_tool', label: 'Tools', displayName: 'Tools' }],
  outputs: [],
  portMetadata: {
    inputConnector: 'ai_tool',
    displayName: 'Tools',
    maxConnections: null,
    required: false,
    mainInputs: 0,
    mainOutputs: 0,
    exactSourceBehavior:
      'Tool sub-nodes connect into the single AI Tool input; the trigger has no main input and no output port.',
  },
  icon: '/node-icons/mcp-server-trigger.svg',
  n8nIcon: {
    light: 'file:../mcp.svg',
    dark: 'file:../mcp.dark.svg',
  },
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 180, height: 180, viewBoxWidth: 195, viewBoxHeight: 195 },
  iconAssetSha256: 'd88a184cedd5868fe78cd88dd68d6f4b5cd9e0312acb4c0b66bc5ec473e0d53e',
  darkIconAssetSha256:
    '8e01ef004b727b74afdf7814880a08e4f34c0d54dc3769d7ae33c32e7b953948',
  aliases: ['Model Context Protocol', 'MCP Server'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcptrigger/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/httprequest/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/@n8n/nodes-langchain/nodes/mcp/McpTrigger/McpTrigger.node.ts',
    serverPath: 'packages/@n8n/nodes-langchain/nodes/mcp/McpTrigger/McpServer.ts',
    packagePath: 'packages/@n8n/nodes-langchain/package.json',
    bearerCredentialPath: 'packages/nodes-base/credentials/HttpBearerAuth.credentials.ts',
    headerCredentialPath: 'packages/nodes-base/credentials/HttpHeaderAuth.credentials.ts',
    oauthHelperPath: 'packages/workflow/src/n8n-oauth2-auth.ts',
    webhookAuthenticationPath: 'packages/nodes-base/nodes/Webhook/utils.ts',
    workflowNormalizationPath:
      'packages/frontend/editor-ui/src/app/composables/useWorkflowNormalization.ts',
    webhookDisplayPath:
      'packages/frontend/editor-ui/src/features/ndv/settings/components/NodeWebhooks.vue',
    iconPaths: {
      light: 'packages/@n8n/nodes-langchain/nodes/mcp/mcp.svg',
      dark: 'packages/@n8n/nodes-langchain/nodes/mcp/mcp.dark.svg',
    },
    directDescriptionImports: [],
    directImports: [
      {
        module: 'n8n-nodes-base/dist/nodes/Webhook/error',
        names: ['WebhookAuthorizationError'],
      },
      {
        module: 'n8n-nodes-base/dist/nodes/Webhook/utils',
        names: ['validateWebhookAuthentication'],
      },
      {
        module: 'n8n-workflow',
        names: ['NodeConnectionTypes', 'Node', 'nodeNameToToolName', 'n8nOAuth2Auth'],
      },
      { module: '@utils/helpers', names: ['getConnectedTools'] },
      { module: './McpServer', names: ['McpServer', 'MCP_LIST_TOOLS_REQUEST_MARKER'] },
      { module: './protocol/MessageParser', names: ['MessageParser'] },
      { module: './transport', names: ['CompressionResponse'], typeOnly: true },
    ],
  },
  defaults: { name: 'MCP Server Trigger' },
  activationMessage:
    'You can now connect your MCP Clients to the URL, using SSE or Streamable HTTP transports.',
  triggerPanel: {
    header: 'Listen for MCP events',
    executionsHelp: {
      inactive:
        "This trigger has two modes: test and production.<br /><br /><b>Use test mode while you build your workflow</b>. Click the 'execute step' button, then make an MCP request to the test URL. The executions will show up in the editor.<br /><br /><b>Use production mode to run your workflow automatically</b>. Publish the workflow, then make requests to the production URL. These executions will show up in the <a data-key='executions'>executions list</a>, but not the editor.",
      active:
        "This trigger has two modes: test and production.<br /><br /><b>Use test mode while you build your workflow</b>. Click the 'execute step' button, then make an MCP request to the test URL. The executions will show up in the editor.<br /><br /><b>Use production mode to run your workflow automatically</b>. Since your workflow is activated, you can make requests to the production URL. These executions will show up in the <a data-key='executions'>executions list</a>, but not the editor.",
    },
    activationHint:
      "Once you've finished building your workflow, run it without having to click this button by using the production URL.",
  },
  webhookDisplay: {
    title: 'MCP URL',
    modes: ['test', 'production'],
    visibleWebhookName: 'setup',
    methodHidden: true,
    additionalPostAndDeleteUrlsHidden: true,
    pathParameter: 'path',
    generatedPathBehavior:
      'When the source default is empty, the n8n editor replaces it with the node webhookId to produce a random path.',
  },
  webhooks: [
    {
      name: 'setup',
      method: 'GET',
      httpMethod: 'GET',
      responseMode: 'onReceived',
      fullPath: true,
      isFullPath: true,
      path: `={{$parameter["path"]}}{{parseFloat($nodeVersion)<2 ? '/sse' : ''}}`,
      currentVersionPath: '={{$parameter["path"]}}',
      legacyVersionPathSuffix: '/sse',
      nodeType: 'mcp',
      ndvHideMethod: true,
      ndvHideUrl: false,
      inert: true,
    },
    {
      name: 'default',
      method: 'POST',
      httpMethod: 'POST',
      responseMode: 'onReceived',
      fullPath: true,
      isFullPath: true,
      path: `={{$parameter["path"]}}{{parseFloat($nodeVersion)<2 ? '/messages' : ''}}`,
      currentVersionPath: '={{$parameter["path"]}}',
      legacyVersionPathSuffix: '/messages',
      nodeType: 'mcp',
      ndvHideMethod: true,
      ndvHideUrl: true,
      inert: true,
    },
    {
      name: 'default',
      method: 'DELETE',
      httpMethod: 'DELETE',
      responseMode: 'onReceived',
      fullPath: true,
      isFullPath: true,
      path: '={{$parameter["path"]}}',
      currentVersionPath: '={{$parameter["path"]}}',
      nodeType: 'mcp',
      ndvHideMethod: true,
      ndvHideUrl: true,
      inert: true,
    },
  ],
  credentialRequirements: [
    {
      type: 'httpBearerAuth',
      name: 'Bearer Auth',
      required: true,
      showWhen: { authentication: ['bearerAuth'] },
      inert: true,
      fields: [
        {
          key: 'bearerCredentialToken',
          n8nKey: 'token',
          label: 'Bearer Token',
          kind: 'text',
          value: '',
          required: false,
          password: true,
          resolvableField: true,
        },
        {
          key: 'bearerCredentialCustomAuthNotice',
          n8nKey: 'useCustomAuth',
          label:
            'This credential uses the "Authorization" header. To use a custom header, use a "Header Auth" credential instead',
          kind: 'notice',
          value: '',
          required: false,
        },
      ],
    },
    {
      type: 'httpHeaderAuth',
      name: 'Header Auth',
      required: true,
      showWhen: { authentication: ['headerAuth'] },
      inert: true,
      fields: [
        {
          key: 'headerCredentialName',
          n8nKey: 'name',
          label: 'Name',
          kind: 'text',
          value: '',
          required: false,
        },
        {
          key: 'headerCredentialValue',
          n8nKey: 'value',
          label: 'Value',
          kind: 'text',
          value: '',
          required: false,
          password: true,
        },
        {
          key: 'headerCredentialCustomAuthNotice',
          n8nKey: 'useCustomAuth',
          label: 'To send multiple headers, use a "Custom Auth" credential instead',
          kind: 'notice',
          value: '',
          required: false,
        },
      ],
    },
  ],
  params: [
    {
      key: 'authentication',
      n8nKey: 'authentication',
      label: 'Authentication',
      kind: 'select',
      sourceKind: 'options',
      value: 'none',
      required: false,
      options: authenticationOptions,
      description: 'The way to authenticate',
      builderHint: { propertyHint: authenticationHint },
      simulationNote:
        'This choice only reveals credential metadata. No request, identity, consent, token, or permission is authenticated.',
    },
    {
      key: 'bearerAuthCredential',
      n8nKey: 'credentials.httpBearerAuth',
      label: 'Credential to connect with',
      kind: 'select',
      sourceKind: 'credentials',
      value: 'httpBearerAuth',
      required: true,
      locked: true,
      showWhen: { authentication: ['bearerAuth'] },
      options: [{ label: 'Bearer Auth', value: 'httpBearerAuth' }],
      simulationNote: lockedCredentialNote,
    },
    {
      key: 'headerAuthCredential',
      n8nKey: 'credentials.httpHeaderAuth',
      label: 'Credential to connect with',
      kind: 'select',
      sourceKind: 'credentials',
      value: 'httpHeaderAuth',
      required: true,
      locked: true,
      showWhen: { authentication: ['headerAuth'] },
      options: [{ label: 'Header Auth', value: 'httpHeaderAuth' }],
      simulationNote: lockedCredentialNote,
    },
    {
      key: 'requireExecuteAccess',
      n8nKey: 'requireExecuteAccess',
      label: 'Require Workflow Execute Permission',
      kind: 'boolean',
      value: true,
      required: false,
      showWhen: { authentication: ['n8nOAuth2'] },
      n8nShowWhen: { authentication: ['n8nOAuth2'] },
      sourceVersionCondition: '@version >= 2',
      description:
        'Whether the triggering user must also have permission to execute the workflow in the project it belongs to',
      simulationNote:
        'The value is retained, but no user, project, workflow permission, or OAuth identity is checked.',
    },
    {
      key: 'path',
      n8nKey: 'path',
      label: 'Path',
      kind: 'text',
      sourceKind: 'string',
      value: '',
      required: true,
      placeholder: 'webhook',
      description: 'The base path for this MCP server',
      dynamicDefault: 'node.webhookId',
      simulationNote:
        'The raw node property defaults to empty and n8n normally substitutes a generated webhookId. This simulation neither generates a path nor registers a URL.',
    },
  ],
  authenticationParity: {
    expectedForVersion2: ['none', 'n8nOAuth2', 'bearerAuth', 'headerAuth'],
    represented: authenticationOptions.map(({ value }) => value),
    default: 'none',
    n8nOAuth2IntroducedInVersion: 2,
    requireExecuteAccessDefault: true,
  },
  docsSummary: {
    behavior:
      'Allows n8n to act as an MCP server, making attached n8n tools and workflows available to MCP clients.',
    toolTopology:
      'Only tool nodes connect to this trigger; clients can list the attached tools and call them.',
    workflowExposure:
      'A Custom n8n Workflow Tool can expose another n8n workflow to MCP clients.',
    displayedUrls:
      'The node panel displays test and production MCP URLs; the workflow must be published for the production URL.',
    supportedTransports: ['Server-Sent Events (SSE)', 'Streamable HTTP'],
    unsupportedTransport: 'Standard input/output (stdio)',
    publicDocsAuthenticationMethods: ['bearerAuth', 'headerAuth'],
    sourceAuthenticationAddition:
      'Pinned v2 source also exposes n8n User Auth (OAuth2); the current public parameter list has not yet documented it.',
    webhookReplicaLimitation:
      'With multiple webhook replicas, all /mcp* requests must be routed to one dedicated webhook replica so persistent connections remain on one instance.',
    reverseProxyRequirement:
      'Reverse proxies must be configured for SSE or streamable HTTP; the docs specifically call out disabling proxy buffering.',
  },
  historicalSchema: {
    version1: {
      setupPathSuffix: '/sse',
      postPathSuffix: '/messages',
      serverName: 'n8n-mcp-server',
      n8nOAuth2Available: false,
    },
    version1_1: {
      setupPathSuffix: '/sse',
      postPathSuffix: '/messages',
      serverNameDerivedFromNodeName: true,
      n8nOAuth2Available: false,
    },
    version2: {
      setupPathSuffix: '',
      postPathSuffix: '',
      streamableHttpAtBasePath: true,
      n8nOAuth2Available: true,
    },
  },
  platformGaps: [
    'The active n8n icon has separate light and dark files. The catalog copies the exact light asset and records the dark source and checksum because it exposes one icon URL per node.',
    'n8n replaces the empty Path default with the node webhookId. The catalog records that dynamic default but does not generate webhook IDs or endpoint URLs.',
    'The AI Tool input is preserved as ai_tool metadata. It is not converted into a main-flow input or output.',
    'Bearer and Header credential fields are represented with unique UI keys while n8nKey preserves each native credential property name.',
  ],
  simulation: {
    configurationOnly: true,
    serverCreation: false,
    mcpProtocolHandling: false,
    toolDiscovery: false,
    toolInvocation: false,
    workflowExecution: false,
    webhookRegistration: false,
    webhookHandling: false,
    urlGeneration: false,
    authentication: false,
    credentialAccess: false,
    credentialTesting: false,
    identityEstablishment: false,
    permissionChecks: false,
    sessions: false,
    sseTransport: false,
    streamableHttpTransport: false,
    networkAccess: false,
    runtimeHooks: false,
    voice: false,
  },
  output: null,
};

export default mcpServerTrigger;
