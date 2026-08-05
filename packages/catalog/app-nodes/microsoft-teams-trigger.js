// Static authoring descriptor for n8n's Microsoft Teams Trigger v1. Microsoft
// Graph lookups, credentials, subscriptions, webhooks, and execution stay inert.

const teamModes = [
  { label: 'From List', value: 'list', kind: 'list', placeholder: 'Select a team...', searchListMethod: 'getTeams', searchable: true },
  { label: 'By ID', value: 'id', kind: 'text', placeholder: 'e.g., 61165b04-e4cc-4026-b43f-926b4e2a7182' },
  { label: 'By URL', value: 'url', kind: 'text', placeholder: 'e.g., https://teams.microsoft.com/l/team/19%3A...groupId=your-team-id&tenantId=...', extractValue: { type: 'regex', regex: 'groupId=([0-9a-fA-F-]{36})' } },
];

const channelModes = [
  { label: 'From List', value: 'list', kind: 'list', placeholder: 'Select a channel...', searchListMethod: 'getChannels', searchable: true },
  { label: 'By ID', value: 'id', kind: 'text', placeholder: 'e.g., 19:-xlxyqXNSCxpI1SDzgQ_L9ZvzSR26pgphq1BJ9y7QJE1@thread.tacv2' },
  { label: 'By URL', value: 'url', kind: 'text', placeholder: 'e.g., https://teams.microsoft.com/l/channel/19%3A...@thread.tacv2/...', extractValue: { type: 'regex', regex: 'channel\\/([^\\/?]+)' } },
];

const chatModes = [
  { label: 'From List', value: 'list', kind: 'list', placeholder: 'Select a chat...', searchListMethod: 'getChats', searchable: true },
  { label: 'By ID', value: 'id', kind: 'text', placeholder: '19:7e2f1174-e8ee-4859-b8b1-a8d1cc63d276@unq.gbl.spaces' },
  { label: 'By URL', value: 'url', kind: 'text', placeholder: 'https://teams.microsoft.com/_#/conversations/CHAT_ID', extractValue: { type: 'regex', regex: 'conversations\\/([^\\/?]+)', flags: 'i' } },
];

const microsoftTeamsTrigger = {
  type: 'microsoft-teams-trigger',
  n8nType: 'n8n-nodes-base.microsoftTeamsTrigger',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  currentSchemaVersions: [1],
  label: 'Microsoft Teams Trigger',
  defaultName: 'Microsoft Teams Trigger',
  subtitle: 'Microsoft Teams Trigger',
  description: 'Triggers workflows in n8n based on events from Microsoft Teams, such as new messages or team updates, using specified configurations.',
  category: 'trigger',
  categories: ['Communication'],
  subcategories: [],
  group: ['trigger'],
  defaults: { name: 'Microsoft Teams Trigger' },
  inputs: [],
  outputs: ['main'],
  icon: '/node-icons/microsoft-teams.svg',
  n8nIcon: 'file:teams.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.microsoftteamstrigger/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/microsoft/',
  credentialDocsByType: {
    microsoftTeamsOAuth2Api: 'https://docs.n8n.io/integrations/builtin/credentials/microsoft/',
    microsoftOAuth2Api: 'https://docs.n8n.io/integrations/builtin/credentials/microsoft/',
    microsoftEntraServicePrincipalApi: 'https://docs.n8n.io/integrations/builtin/credentials/microsoftentra/',
  },
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Microsoft/Teams/MicrosoftTeamsTrigger.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Microsoft/Teams/MicrosoftTeamsTrigger.node.json',
    helperPath: 'packages/nodes-base/nodes/Microsoft/Teams/v2/helpers/utils-trigger.ts',
    lookupPath: 'packages/nodes-base/nodes/Microsoft/Teams/v2/methods/listSearch.ts',
    transportPath: 'packages/nodes-base/nodes/Microsoft/Teams/v2/transport/index.ts',
    credentialPaths: [
      'packages/nodes-base/credentials/MicrosoftTeamsOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/MicrosoftOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/MicrosoftEntraServicePrincipalApi.credentials.ts',
    ],
    iconPath: 'packages/nodes-base/nodes/Microsoft/Teams/teams.svg',
  },
  credentialRequirements: [
    { type: 'microsoftTeamsOAuth2Api', name: 'Microsoft Teams OAuth2 API', required: true, inert: true, showWhen: { authentication: ['microsoftTeamsOAuth2Api'] }, extends: ['microsoftOAuth2Api'] },
    { type: 'microsoftOAuth2Api', name: 'Microsoft OAuth2 API', required: true, inert: true, showWhen: { authentication: ['microsoftOAuth2Api'] }, extends: ['oAuth2Api'] },
    { type: 'microsoftEntraServicePrincipalApi', name: 'Microsoft Entra Service Principal', required: true, inert: true, showWhen: { authentication: ['microsoftEntraServicePrincipalApi'] } },
  ],
  webhooks: [
    { name: 'default', httpMethod: 'POST', responseMode: 'onReceived', path: 'webhook', inert: true },
  ],
  params: [
    {
      key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'select', sourceKind: 'options',
      value: 'microsoftTeamsOAuth2Api', required: false, noDataExpression: true,
      options: [
        { label: 'Teams OAuth2', value: 'microsoftTeamsOAuth2Api' },
        { label: 'Microsoft OAuth2 (Graph)', value: 'microsoftOAuth2Api', description: 'Generic Microsoft Graph credential. Add the Teams change-notification scopes (e.g. ChannelMessage.Read.All, Chat.Read, Subscription.Read.All) and grant admin consent on the credential. See the docs for the full scope string.' },
        { label: 'Service Principal (App-Only)', value: 'microsoftEntraServicePrincipalApi', description: 'App-only access via a Microsoft Entra app registration. App-only Graph cannot subscribe to the chats of a signed-in user, so chat triggers are unavailable. Grant the relevant application permissions (e.g. ChannelMessage.Read.All) and admin consent on the credential.' },
      ],
    },
    { key: 'microsoftTeamsOAuth2ApiCredential', n8nKey: 'credentials.microsoftTeamsOAuth2Api', label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials', value: 'microsoftTeamsOAuth2Api', required: true, locked: true, dynamic: true, showWhen: { authentication: ['microsoftTeamsOAuth2Api'] }, options: [{ label: 'Microsoft Teams OAuth2 API', value: 'microsoftTeamsOAuth2Api' }], simulationNote: 'Credential discovery and authentication are intentionally disabled.' },
    { key: 'microsoftOAuth2ApiCredential', n8nKey: 'credentials.microsoftOAuth2Api', label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials', value: 'microsoftOAuth2Api', required: true, locked: true, dynamic: true, showWhen: { authentication: ['microsoftOAuth2Api'] }, options: [{ label: 'Microsoft OAuth2 API', value: 'microsoftOAuth2Api' }], simulationNote: 'Credential discovery and authentication are intentionally disabled.' },
    { key: 'microsoftEntraServicePrincipalApiCredential', n8nKey: 'credentials.microsoftEntraServicePrincipalApi', label: 'Credential to connect with', kind: 'select', sourceKind: 'credentials', value: 'microsoftEntraServicePrincipalApi', required: true, locked: true, dynamic: true, showWhen: { authentication: ['microsoftEntraServicePrincipalApi'] }, options: [{ label: 'Microsoft Entra Service Principal', value: 'microsoftEntraServicePrincipalApi' }], simulationNote: 'Credential discovery and authentication are intentionally disabled.' },
    {
      key: 'event', n8nKey: 'event', label: 'Trigger On', kind: 'select', sourceKind: 'options', value: 'newChannelMessage',
      options: [
        { label: 'New Channel', value: 'newChannel', description: 'A new channel is created' },
        { label: 'New Channel Message', value: 'newChannelMessage', description: 'A message is posted to a channel' },
        { label: 'New Chat', value: 'newChat', description: 'A new chat is created' },
        { label: 'New Chat Message', value: 'newChatMessage', description: 'A message is posted to a chat' },
        { label: 'New Team Member', value: 'newTeamMember', description: 'A new member is added to a team' },
      ],
      description: 'Select the event to trigger the workflow',
    },
    { key: 'chatTriggerServicePrincipalNotice', n8nKey: 'chatTriggerServicePrincipalNotice', label: 'Chat triggers (New Chat, New Chat Message) are not available with the Service Principal credential. App-only Microsoft Graph cannot subscribe to the chats of a signed-in user; use an OAuth2 credential for chat triggers.', kind: 'notice', value: '', showWhen: { event: ['newChat', 'newChatMessage'], authentication: ['microsoftEntraServicePrincipalApi'] } },
    { key: 'watchAllTeams', n8nKey: 'watchAllTeams', label: 'Watch All Teams', kind: 'boolean', value: false, showWhen: { event: ['newChannel', 'newChannelMessage', 'newTeamMember'] }, hideWhen: { authentication: ['microsoftEntraServicePrincipalApi'] }, n8nHideWhen: { '/authentication': ['microsoftEntraServicePrincipalApi'] }, description: 'Whether to watch for the event in all the available teams' },
    {
      key: 'teamId', n8nKey: 'teamId', label: 'Team', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
      locked: true, dynamic: true, modes: ['list', 'id', 'url'], modeOptions: teamModes, options: [],
      showWhen: { event: ['newChannel', 'newChannelMessage', 'newTeamMember'] }, hideWhen: { watchAllTeams: [true] },
      n8nShowWhen: { event: ['newChannel', 'newChannelMessage', 'newTeamMember'], watchAllTeams: [{ _cnd: { not: true } }] },
      description: 'Select a team from the list, enter an ID or a URL', simulationNote: 'Team list search is locked and empty. ID and URL modes remain authorable.',
    },
    { key: 'watchAllChannels', n8nKey: 'watchAllChannels', label: 'Watch All Channels', kind: 'boolean', value: false, showWhen: { event: ['newChannelMessage'], watchAllTeams: [false] }, hideWhen: { authentication: ['microsoftEntraServicePrincipalApi'] }, n8nHideWhen: { '/authentication': ['microsoftEntraServicePrincipalApi'] }, description: 'Whether to watch for the event in all the available channels' },
    {
      key: 'channelId', n8nKey: 'channelId', label: 'Channel', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
      locked: true, dynamic: true, modes: ['list', 'id', 'url'], modeOptions: channelModes, options: [],
      showWhen: { event: ['newChannelMessage'], watchAllTeams: [false], watchAllChannels: [false] },
      n8nShowWhen: { event: ['newChannelMessage'], watchAllTeams: [{ _cnd: { not: true } }], watchAllChannels: [{ _cnd: { not: true } }] },
      description: 'Select a channel from the list, enter an ID or a URL', simulationNote: 'Channel list search is locked and empty. ID and URL modes remain authorable.',
    },
    { key: 'watchAllChats', n8nKey: 'watchAllChats', label: 'Watch All Chats', kind: 'boolean', value: false, showWhen: { event: ['newChatMessage'] }, hideWhen: { authentication: ['microsoftEntraServicePrincipalApi'] }, n8nHideWhen: { '/authentication': ['microsoftEntraServicePrincipalApi'] }, description: 'Whether to watch for the event in all the available chats' },
    {
      key: 'chatId', n8nKey: 'chatId', label: 'Chat', kind: 'resourceLocator', sourceKind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' }, sourceDefault: { mode: 'list', value: '' }, required: true,
      locked: true, dynamic: true, modes: ['list', 'id', 'url'], modeOptions: chatModes, options: [],
      showWhen: { event: ['newChatMessage'], watchAllChats: [false] }, hideWhen: { authentication: ['microsoftEntraServicePrincipalApi'] },
      n8nHideWhen: { '/authentication': ['microsoftEntraServicePrincipalApi'] },
      description: 'Select a chat from the list, enter an ID or a URL', simulationNote: 'Chat list search is locked and empty. ID and URL modes remain authorable for OAuth2.',
    },
  ],
  sourceCoverage: {
    liveEvents: ['newChannel', 'newChannelMessage', 'newChat', 'newChatMessage', 'newTeamMember'],
    watchAllParameters: ['watchAllTeams', 'watchAllChannels', 'watchAllChats'],
    resourceLocators: ['teamId', 'channelId', 'chatId'],
    locatorSearchMethods: ['getTeams', 'getChannels', 'getChats'],
    credentialTypes: ['microsoftTeamsOAuth2Api', 'microsoftOAuth2Api', 'microsoftEntraServicePrincipalApi'],
    appOnlyHiddenControls: ['watchAllTeams', 'watchAllChannels', 'watchAllChats', 'chatId'],
    appOnlyUnsupportedEvents: ['newChat', 'newChatMessage'],
  },
  platformGaps: [
    'Team, channel, and chat list searches are retained as locked metadata; ID and URL modes remain editable where n8n exposes them.',
    'Service Principal hides all watch-all controls and the chat locator. Chat events remain selectable only to display n8n\'s app-only restriction notice.',
    'Webhook validation, subscription discovery, creation, renewal, deletion, notification verification, and reception are not simulated.',
    'Watch-all fan-out and app-only permission enforcement are represented by visibility metadata only.',
  ],
  unsupportedControls: [
    { n8nKey: 'teamId/channelId/chatId', sourceType: 'resourceLocator with listSearch', behavior: 'list locked; ID and URL authorable when visible' },
    { n8nKey: 'watchAllTeams/watchAllChannels/watchAllChats', sourceType: 'remote subscription fan-out', behavior: 'editable for OAuth2; hidden for app-only; never executed' },
    { n8nKey: 'credentials.*', sourceType: 'credential selector', behavior: 'locked/inert' },
    { n8nKey: 'webhooks.default', sourceType: 'webhook lifecycle', behavior: 'metadata only' },
  ],
  simulation: {
    configurationOnly: true, credentialAccess: false, credentialCreation: false,
    credentialTesting: false, authentication: false, oauthAuthorization: false,
    apiCalls: false, polling: false, webhookRegistration: false, webhookRenewal: false,
    webhookDeletion: false, webhookReception: false, webhookValidation: false,
    signatureVerification: false, subscriptionFanOut: false, readsWorkflowState: false,
    writesWorkflowState: false, network: false, runtime: false, expressionExecution: false,
    voice: false, sideEffects: false,
  },
  output: {},
};

export default microsoftTeamsTrigger;
