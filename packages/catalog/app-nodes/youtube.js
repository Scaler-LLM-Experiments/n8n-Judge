// Editor-only descriptor for n8n's YouTube v1 action node.
// OAuth, YouTube lookups and requests, binary reads, uploads, mutations, and
// AI-tool execution remain inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This credential selector is locked. The simulation never creates, reads, tests, refreshes, or applies Google or YouTube credentials.';
const lockedLookupNote =
  'n8n normally loads these choices at authoring time. The list remains empty and no Google or YouTube request is made.';
const staticCountryNote =
  'n8n derives this list from its bundled ISO country-code catalog. The inert catalog records that source without executing the load method.';

const privacyOptions = [
  { label: 'Private', value: 'private' },
  { label: 'Public', value: 'public' },
  { label: 'Unlisted', value: 'unlisted' },
];

const licenseOptions = [
  { label: 'Creative Common', value: 'creativeCommon' },
  { label: 'Youtube', value: 'youtube' },
];

const channelPartOptions = [
  { label: '*', value: '*' },
  { label: 'Branding Settings', value: 'brandingSettings' },
  { label: 'Content Details', value: 'contentDetails' },
  { label: 'Content Owner Details', value: 'contentOwnerDetails' },
  { label: 'ID', value: 'id' },
  { label: 'Localizations', value: 'localizations' },
  { label: 'Snippet', value: 'snippet' },
  { label: 'Statistics', value: 'statistics' },
  { label: 'Status', value: 'status' },
  { label: 'Topic Details', value: 'topicDetails' },
];

const playlistPartOptions = [
  { label: '*', value: '*' },
  { label: 'Content Details', value: 'contentDetails' },
  { label: 'ID', value: 'id' },
  { label: 'Localizations', value: 'localizations' },
  { label: 'Player', value: 'player' },
  { label: 'Snippet', value: 'snippet' },
  { label: 'Status', value: 'status' },
];

const playlistItemPartOptions = [
  { label: '*', value: '*' },
  { label: 'Content Details', value: 'contentDetails' },
  { label: 'ID', value: 'id' },
  { label: 'Snippet', value: 'snippet' },
  { label: 'Status', value: 'status' },
];

const videoPartOptions = [
  { label: '*', value: '*' },
  { label: 'Content Details', value: 'contentDetails' },
  { label: 'ID', value: 'id' },
  { label: 'Live Streaming Details', value: 'liveStreamingDetails' },
  { label: 'Localizations', value: 'localizations' },
  { label: 'Player', value: 'player' },
  { label: 'Recording Details', value: 'recordingDetails' },
  { label: 'Snippet', value: 'snippet' },
  { label: 'Statistics', value: 'statistics' },
  { label: 'Status', value: 'status' },
  { label: 'Topic Details', value: 'topicDetails' },
];

const channelOperations = [
  { label: 'Get', value: 'get', description: 'Retrieve a channel', action: 'Get a channel' },
  { label: 'Get Many', value: 'getAll', description: 'Retrieve many channels', action: 'Get many channels' },
  { label: 'Update', value: 'update', description: 'Update a channel', action: 'Update a channel' },
  { label: 'Upload Banner', value: 'uploadBanner', description: 'Upload a channel banner', action: 'Upload a channel banner' },
];

const playlistOperations = [
  { label: 'Create', value: 'create', description: 'Create a playlist', action: 'Create a playlist' },
  { label: 'Delete', value: 'delete', description: 'Delete a playlist', action: 'Delete a playlist' },
  { label: 'Get', value: 'get', description: 'Get a playlist', action: 'Get a playlist' },
  { label: 'Get Many', value: 'getAll', description: 'Retrieve many playlists', action: 'Get many playlists' },
  { label: 'Update', value: 'update', description: 'Update a playlist', action: 'Update a playlist' },
];

const playlistItemOperations = [
  { label: 'Add', value: 'add', description: 'Add an item to a playlist', action: 'Add a playlist item' },
  { label: 'Delete', value: 'delete', description: 'Delete a item from a playlist', action: 'Delete a playlist item' },
  { label: 'Get', value: 'get', description: "Get a playlist's item", action: 'Get a playlist item' },
  { label: 'Get Many', value: 'getAll', description: 'Retrieve many playlist items', action: 'Get many playlist items' },
];

const videoOperations = [
  { label: 'Delete', value: 'delete', description: 'Delete a video', action: 'Delete a video' },
  { label: 'Get', value: 'get', description: 'Get a video', action: 'Get a video' },
  { label: 'Get Many', value: 'getAll', description: 'Retrieve many videos', action: 'Get many videos' },
  { label: 'Rate', value: 'rate', description: 'Rate a video', action: 'Rate a video' },
  { label: 'Update', value: 'update', description: 'Update a video', action: 'Update a video' },
  { label: 'Upload', value: 'upload', description: 'Upload a video', action: 'Upload a video' },
];

const videoCategoryOperations = [
  { label: 'Get Many', value: 'getAll', description: 'Retrieve many video categories', action: 'Get many video categories' },
];

const operationKey = (resource) => `${resource}Operation`;
const operationWhen = (resource, operation) => ({ resource: [resource], [operationKey(resource)]: [operation] });
const nativeWhen = (resource, operation) => ({ resource: [resource], operation: [operation] });

const makeOperation = (resource, value, options) => ({
  key: operationKey(resource), n8nKey: 'operation', label: 'Operation', kind: 'select',
  value, required: false, noDataExpression: true, showWhen: { resource: [resource] }, options,
});

const makeText = (key, n8nKey, label, value, showWhen, extra = {}) => ({
  key, n8nKey, label, kind: 'text', value, required: false, showWhen, ...extra,
});

const makeCollection = (key, n8nKey, label, showWhen, fields, addLabel = 'Add option') => ({
  key, n8nKey, label, kind: 'collection', sourceKind: 'collection', value: {}, required: false,
  addLabel, showWhen, fields,
});

const makeParts = (key, resource, operation, options, descriptionResource) => ({
  key, n8nKey: 'part', label: 'Fields', kind: 'multiSelect', value: ['*'], required: true,
  showWhen: operationWhen(resource, operation), n8nShowWhen: nativeWhen(resource, operation), options,
  description: `The fields parameter specifies one or more ${descriptionResource} resource properties that the API response will include`,
});

const makeReturnAll = (prefix, resource, operation) => [
  {
    key: `${prefix}ReturnAll`, n8nKey: 'returnAll', label: 'Return All', kind: 'boolean', value: false,
    showWhen: operationWhen(resource, operation), n8nShowWhen: nativeWhen(resource, operation),
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    key: `${prefix}Limit`, n8nKey: 'limit', label: 'Limit', kind: 'number', value: 25, min: 1, max: 50,
    showWhen: { ...operationWhen(resource, operation), [`${prefix}ReturnAll`]: [false] },
    n8nShowWhen: { ...nativeWhen(resource, operation), returnAll: [false] },
    description: 'Max number of results to return',
  },
];

const dynamicSelect = (key, n8nKey, label, value, showWhen, source, { required = false, dependsOn = [], staticLocal = false, description = '' } = {}) => ({
  key, n8nKey, label, kind: 'select', value, required, showWhen,
  options: [], locked: true, dynamic: true,
  dynamicOptions: { source, dependsOn, staticLocal, inert: true },
  description: description || 'Choose from the list, or specify an ID using an expression',
  simulationNote: staticLocal ? staticCountryNote : lockedLookupNote,
});

const ownerField = (key, n8nKey = 'onBehalfOfContentOwner', label = 'On Behalf Of Content Owner') => ({
  key, n8nKey, label, kind: 'text', value: '',
  description: "The request credentials identify a YouTube CMS user acting on behalf of the specified content owner",
});

const languageField = (key, label = 'Default Language Name or ID') => dynamicSelect(
  key, key.endsWith('LanguageCode') ? 'h1' : 'defaultLanguage', label, '', undefined, 'getLanguages',
  { description: 'Choose a YouTube-supported application language, or specify an ID using an expression' },
);

const makeVideoMutationFields = (prefix) => [
  languageField(`${prefix}DefaultLanguage`),
  { key: `${prefix}Description`, n8nKey: 'description', label: 'Description', kind: 'text', value: '', description: "The playlist's description" },
  { key: `${prefix}Embeddable`, n8nKey: 'embeddable', label: 'Embeddable', kind: 'boolean', value: false, description: 'Whether the video can be embedded on another website' },
  { key: `${prefix}License`, n8nKey: 'license', label: 'License', kind: 'select', value: '', options: licenseOptions, description: "The video's license" },
  { key: `${prefix}NotifySubscribers`, n8nKey: 'notifySubscribers', label: 'Notify Subscribers', kind: 'boolean', value: false, description: 'Whether YouTube should notify subscribers about the video' },
  { key: `${prefix}PrivacyStatus`, n8nKey: 'privacyStatus', label: 'Privacy Status', kind: 'select', value: '', options: privacyOptions, description: "The playlist's privacy status" },
  { key: `${prefix}PublicStatsViewable`, n8nKey: 'publicStatsViewable', label: 'Public Stats Viewable', kind: 'boolean', value: true, description: "Whether extended video statistics are publicly viewable" },
  { key: `${prefix}PublishAt`, n8nKey: 'publishAt', label: 'Publish At', kind: 'text', sourceKind: 'dateTime', value: '', description: 'Requires privacyStatus to be private' },
  { key: `${prefix}RecordingDate`, n8nKey: 'recordingDate', label: 'Recording Date', kind: 'text', sourceKind: 'dateTime', value: '', description: 'The date and time when the video was recorded' },
  { key: `${prefix}MadeForKids`, n8nKey: 'selfDeclaredMadeForKids', label: 'Self Declared Made For Kids', kind: 'boolean', value: false, description: 'Whether the video is designated as child-directed' },
  { key: `${prefix}Tags`, n8nKey: 'tags', label: 'Tags', kind: 'text', value: '', description: 'Comma-separated keyword tags associated with the playlist' },
];

const youtubeScopes = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtubepartner',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtubepartner-channel-audit',
].join(' ');

const credentialRequirements = [
  {
    type: 'youTubeOAuth2Api', name: 'YouTube OAuth2 API', required: true, inert: true,
    documentationUrl: 'google', extends: ['googleOAuth2Api', 'oAuth2Api'],
    sourcePath: 'packages/nodes-base/credentials/YouTubeOAuth2Api.credentials.ts',
    inheritedSourcePaths: [
      'packages/nodes-base/credentials/GoogleOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/OAuth2Api.credentials.ts',
    ],
    fields: [
      { key: 'youtubeOauthGrantType', n8nKey: 'grantType', label: 'Grant Type', kind: 'hidden', value: 'authorizationCode', inheritedFrom: 'googleOAuth2Api' },
      { key: 'youtubeOauthAuthUrl', n8nKey: 'authUrl', label: 'Authorization URL', kind: 'hidden', value: 'https://accounts.google.com/o/oauth2/v2/auth', inheritedFrom: 'googleOAuth2Api' },
      { key: 'youtubeOauthAccessTokenUrl', n8nKey: 'accessTokenUrl', label: 'Access Token URL', kind: 'hidden', value: 'https://oauth2.googleapis.com/token', inheritedFrom: 'googleOAuth2Api' },
      { key: 'youtubeOauthQueryParameters', n8nKey: 'authQueryParameters', label: 'Auth URI Query Parameters', kind: 'hidden', value: 'access_type=offline&prompt=consent', inheritedFrom: 'googleOAuth2Api' },
      { key: 'youtubeOauthAuthentication', n8nKey: 'authentication', label: 'Authentication', kind: 'hidden', value: 'body', inheritedFrom: 'googleOAuth2Api' },
      { key: 'youtubeOauthCustomScopes', n8nKey: 'customScopes', label: 'Custom Scopes', kind: 'boolean', value: false, description: 'Define custom scopes' },
      { key: 'youtubeOauthCustomScopesNotice', n8nKey: 'customScopesNotice', label: 'The default scopes needed for the node to work are already set, If you change these the node may not function correctly.', kind: 'notice', value: '', showWhen: { youtubeOauthCustomScopes: [true] }, n8nShowWhen: { customScopes: [true] } },
      { key: 'youtubeOauthEnabledScopes', n8nKey: 'enabledScopes', label: 'Enabled Scopes', kind: 'text', value: youtubeScopes, showWhen: { youtubeOauthCustomScopes: [true] }, n8nShowWhen: { customScopes: [true] }, description: 'Scopes that should be enabled' },
      { key: 'youtubeOauthScope', n8nKey: 'scope', label: 'Scope', kind: 'hidden', value: '={{$self["customScopes"] ? $self["enabledScopes"] : "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtubepartner https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtubepartner-channel-audit"}}' },
    ],
  },
];

const youtube = {
  type: 'youtube',
  n8nType: 'n8n-nodes-base.youTube',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'YouTube',
  defaultName: 'YouTube',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Consume YouTube API',
  details: 'Manage YouTube channels, playlists, playlist items, videos, categories, ratings, and upload metadata.',
  category: 'action',
  categories: ['Marketing'],
  group: ['input'],
  defaults: { name: 'YouTube' },
  inputs: ['main'],
  outputs: ['main'],
  portVariants: [{ inputs: ['main'], outputs: ['main'] }],
  usableAsTool: true,
  toolConnector: 'ai_tool',
  aiConnectorPorts: [],
  toolMetadata: { supportsAiParameters: true, staticConnectorPort: false },
  schemaPath: 'Google/YouTube',
  icon: '/node-icons/youtube.png',
  n8nIcon: 'file:youTube.png',
  iconMode: 'image',
  iconAssetType: 'png',
  iconAssetSize: { width: 70, height: 70 },
  iconAssetSha256: 'c7e53efcb9cb4ad0e529faabf7872f4adc37277790ad21f7a1dc51691628e93d',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.youtube/',
  docsMarkdown: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.youtube.md',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/',
  credentialDocsMarkdown: 'https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service.md',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Google/YouTube/YouTube.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Google/YouTube/YouTube.node.json',
    descriptionPaths: [
      'packages/nodes-base/nodes/Google/YouTube/ChannelDescription.ts',
      'packages/nodes-base/nodes/Google/YouTube/PlaylistDescription.ts',
      'packages/nodes-base/nodes/Google/YouTube/PlaylistItemDescription.ts',
      'packages/nodes-base/nodes/Google/YouTube/VideoDescription.ts',
      'packages/nodes-base/nodes/Google/YouTube/VideoCategoryDescription.ts',
    ],
    helperPath: 'packages/nodes-base/nodes/Google/YouTube/GenericFunctions.ts',
    googleHelperPath: 'packages/nodes-base/nodes/Google/GenericFunctions.ts',
    countryCodesPath: 'packages/nodes-base/utils/ISOCountryCodes.ts',
    credentialPaths: credentialRequirements[0].inheritedSourcePaths.concat(credentialRequirements[0].sourcePath),
    iconPath: 'packages/nodes-base/nodes/Google/YouTube/youTube.png',
  },
  credentialRequirements,
  params: [
    {
      key: 'youtubeCredential', n8nKey: 'credentials.youTubeOAuth2Api', label: 'Credential to connect with',
      kind: 'select', sourceKind: 'credentials', value: 'youTubeOAuth2Api', sourceDefault: '', required: true,
      locked: true, options: [{ label: 'YouTube OAuth2 API', value: 'youTubeOAuth2Api' }], simulationNote: lockedCredentialNote,
    },
    {
      key: 'resource', n8nKey: 'resource', label: 'Resource', kind: 'select', value: 'channel', required: false,
      noDataExpression: true,
      options: [
        { label: 'Channel', value: 'channel' },
        { label: 'Playlist', value: 'playlist' },
        { label: 'Playlist Item', value: 'playlistItem' },
        { label: 'Video', value: 'video' },
        { label: 'Video Category', value: 'videoCategory' },
      ],
    },
    makeOperation('channel', 'getAll', channelOperations),
    makeOperation('playlist', 'getAll', playlistOperations),
    makeOperation('playlistItem', 'add', playlistItemOperations),
    makeOperation('video', 'getAll', videoOperations),
    makeOperation('videoCategory', 'getAll', videoCategoryOperations),

    makeParts('channelGetAllParts', 'channel', 'getAll', channelPartOptions, 'channel'),
    ...makeReturnAll('channelGetAll', 'channel', 'getAll'),
    makeCollection('channelGetAllFilters', 'filters', 'Filters', operationWhen('channel', 'getAll'), [
      { key: 'channelGetAllCategoryId', n8nKey: 'categoryId', label: 'Category ID', kind: 'text', value: '', description: 'A YouTube guide category whose associated channels should be returned' },
      { key: 'channelGetAllUsername', n8nKey: 'forUsername', label: 'For Username', kind: 'text', value: '', description: 'The YouTube username whose channel should be returned' },
      { key: 'channelGetAllIds', n8nKey: 'id', label: 'ID', kind: 'text', value: '', description: 'Comma-separated YouTube channel IDs' },
      { key: 'channelGetAllManagedByMe', n8nKey: 'managedByMe', label: 'Managed By Me', kind: 'boolean', value: false, description: 'Whether to return channels managed by the specified content owner' },
    ]),
    makeCollection('channelGetAllOptions', 'options', 'Options', operationWhen('channel', 'getAll'), [
      languageField('channelGetAllLanguageCode', 'Language Code'),
      ownerField('channelGetAllOwner'),
    ]),
    makeText('channelGetId', 'channelId', 'Channel ID', '', operationWhen('channel', 'get'), { required: true, description: 'ID of the channel' }),
    makeParts('channelGetParts', 'channel', 'get', channelPartOptions, 'channel'),
    makeText('channelUpdateId', 'channelId', 'Channel ID', '', operationWhen('channel', 'update'), { required: true }),
    makeCollection('channelUpdateFields', 'updateFields', 'Update Fields', operationWhen('channel', 'update'), [
      {
        key: 'channelUpdateBrandingSettings', n8nKey: 'brandingSettingsUi', label: 'Branding Settings',
        kind: 'collection', sourceKind: 'fixedCollection', value: {}, addLabel: 'Add Branding Settings',
        description: 'Encapsulates information about the branding of the channel',
        fields: [
          {
            key: 'channelUpdateChannelSettings', n8nKey: 'channelSettingsValues', label: 'Channel Settings',
            kind: 'fixedCollection', value: {}, sourceDefault: {}, collectionKey: 'channel',
            collectionLabel: 'Channel', multiple: false, addLabel: 'Add Channel Settings',
            fields: [
              { key: 'channelUpdateCountry', n8nKey: 'country', label: 'Country', kind: 'text', value: '', description: 'The country associated with the channel' },
              { key: 'channelUpdateDescription', n8nKey: 'description', label: 'Description', kind: 'text', value: '', description: 'Channel description, maximum 1000 characters' },
              { key: 'channelUpdateDefaultLanguage', n8nKey: 'defaultLanguage', label: 'Default Language', kind: 'text', value: '' },
              { key: 'channelUpdateDefaultTab', n8nKey: 'defaultTab', label: 'Default Tab', kind: 'text', value: 'The content tab that users should display by default when viewers arrive at your channel page.' },
              { key: 'channelUpdateFeaturedTitle', n8nKey: 'featuredChannelsTitle', label: 'Featured Channels Title', kind: 'text', value: '', description: 'Title above the featured channels module, maximum 30 characters' },
              { key: 'channelUpdateFeaturedUrls', n8nKey: 'featuredChannelsUrls', label: 'Featured Channels Urls', kind: 'multiSelect', sourceKind: 'string', value: [], options: [], allowCustom: true, description: 'Up to 100 YouTube channel IDs to feature' },
              { key: 'channelUpdateKeywords', n8nKey: 'keywords', label: 'Keywords', kind: 'text', value: '', placeholder: 'tech,news', description: 'Space-separated keywords associated with the channel' },
              { key: 'channelUpdateModerateComments', n8nKey: 'moderateComments', label: 'Moderate Comments', kind: 'boolean', value: false },
              { key: 'channelUpdateProfileColor', n8nKey: 'profileColor', label: 'Profile Color', kind: 'text', value: '' },
              { key: 'channelUpdateShowRelated', n8nKey: 'showRelatedChannels', label: 'Show Related Channels', kind: 'boolean', value: false },
              { key: 'channelUpdateShowBrowse', n8nKey: 'showBrowseView', label: 'Show Browse View', kind: 'boolean', value: false },
              { key: 'channelUpdateAnalyticsId', n8nKey: 'trackingAnalyticsAccountId', label: 'Tracking Analytics AccountId', kind: 'text', value: '' },
              { key: 'channelUpdateTrailer', n8nKey: 'unsubscribedTrailer', label: 'Unsubscribed Trailer', kind: 'text', value: '' },
            ],
          },
          {
            key: 'channelUpdateImageSettings', n8nKey: 'imageSettingsValues', label: 'Image Settings',
            kind: 'fixedCollection', value: {}, sourceDefault: {}, collectionKey: 'image',
            collectionLabel: 'Image', multiple: false, addLabel: 'Add Channel Settings',
            fields: [
              { key: 'channelUpdateBannerUrl', n8nKey: 'bannerExternalUrl', label: 'Banner External Url', kind: 'text', value: '' },
              { key: 'channelUpdateTrackingImageUrl', n8nKey: 'trackingImageUrl', label: 'Tracking Image Url', kind: 'text', value: '' },
              { key: 'channelUpdateWatchIconUrl', n8nKey: 'watchIconImageUrl', label: 'Watch Icon Image Url', kind: 'text', value: '' },
            ],
          },
          {
            key: 'channelUpdateStatusSettings', n8nKey: 'statusValue', label: 'Status',
            kind: 'fixedCollection', value: {}, sourceDefault: {}, collectionKey: 'status',
            collectionLabel: 'Status', multiple: false, addLabel: 'Add Status',
            fields: [
              { key: 'channelUpdateMadeForKids', n8nKey: 'selfDeclaredMadeForKids', label: 'Self Declared Made For Kids', kind: 'boolean', value: false },
            ],
          },
        ],
      },
      ownerField('channelUpdateOwner'),
    ], 'Add Field'),
    makeText('channelBannerId', 'channelId', 'Channel ID', '', operationWhen('channel', 'uploadBanner'), { required: true, description: 'ID of the channel' }),
    makeText('channelBannerBinary', 'binaryProperty', 'Input Binary Field', 'data', operationWhen('channel', 'uploadBanner'), { required: true, hint: 'The name of the input binary field containing the file to be uploaded', simulationNote: 'The field name is stored only. No binary input is read or uploaded.' }),

    makeText('playlistCreateTitle', 'title', 'Title', '', operationWhen('playlist', 'create'), { required: true, description: "The playlist's title" }),
    makeCollection('playlistCreateOptions', 'options', 'Options', operationWhen('playlist', 'create'), [
      { key: 'playlistCreateDescription', n8nKey: 'description', label: 'Description', kind: 'text', value: '', description: "The playlist's description" },
      { key: 'playlistCreatePrivacy', n8nKey: 'privacyStatus', label: 'Privacy Status', kind: 'select', value: '', options: privacyOptions },
      { key: 'playlistCreateTags', n8nKey: 'tags', label: 'Tags', kind: 'text', value: '', description: 'Comma-separated keyword tags' },
      languageField('playlistCreateDefaultLanguage'),
      ownerField('playlistCreateOwnerChannel', 'onBehalfOfContentOwnerChannel', 'On Behalf Of Content Owner Channel'),
      ownerField('playlistCreateOwner'),
    ]),
    makeText('playlistGetId', 'playlistId', 'Playlist ID', '', operationWhen('playlist', 'get'), { required: true }),
    makeParts('playlistGetParts', 'playlist', 'get', playlistPartOptions, 'playlist'),
    makeCollection('playlistGetOptions', 'options', 'Options', operationWhen('playlist', 'get'), [
      ownerField('playlistGetOwner'), ownerField('playlistGetOwnerChannel', 'onBehalfOfContentOwnerChannel', 'On Behalf Of Content Owner Channel'),
    ]),
    makeText('playlistDeleteId', 'playlistId', 'Playlist ID', '', operationWhen('playlist', 'delete'), { required: true }),
    makeCollection('playlistDeleteOptions', 'options', 'Options', operationWhen('playlist', 'delete'), [ownerField('playlistDeleteOwner')]),
    makeParts('playlistGetAllParts', 'playlist', 'getAll', playlistPartOptions, 'playlist'),
    ...makeReturnAll('playlistGetAll', 'playlist', 'getAll'),
    makeCollection('playlistGetAllFilters', 'filters', 'Filters', operationWhen('playlist', 'getAll'), [
      { key: 'playlistGetAllChannelId', n8nKey: 'channelId', label: 'Channel ID', kind: 'text', value: '' },
      { key: 'playlistGetAllId', n8nKey: 'id', label: 'ID', kind: 'text', value: '' },
    ]),
    makeCollection('playlistGetAllOptions', 'options', 'Options', operationWhen('playlist', 'getAll'), [
      ownerField('playlistGetAllOwnerChannel', 'onBehalfOfContentOwnerChannel', 'On Behalf Of Content Owner Channel'), ownerField('playlistGetAllOwner'),
    ]),
    makeText('playlistUpdateId', 'playlistId', 'Playlist ID', '', operationWhen('playlist', 'update'), { required: true }),
    makeText('playlistUpdateTitle', 'title', 'Title', '', operationWhen('playlist', 'update'), { required: true }),
    makeCollection('playlistUpdateFields', 'updateFields', 'Update Fields', operationWhen('playlist', 'update'), [
      languageField('playlistUpdateDefaultLanguage'),
      { key: 'playlistUpdateDescription', n8nKey: 'description', label: 'Description', kind: 'text', value: '' },
      ownerField('playlistUpdateOwner'),
      { key: 'playlistUpdatePrivacy', n8nKey: 'privacyStatus', label: 'Privacy Status', kind: 'select', value: '', options: privacyOptions },
      { key: 'playlistUpdateTags', n8nKey: 'tags', label: 'Tags', kind: 'text', value: '' },
    ], 'Add option'),

    dynamicSelect('playlistItemAddPlaylist', 'playlistId', 'Playlist Name or ID', '', operationWhen('playlistItem', 'add'), 'getPlaylists', { required: true }),
    makeText('playlistItemAddVideo', 'videoId', 'Video ID', '', operationWhen('playlistItem', 'add'), { required: true }),
    makeCollection('playlistItemAddOptions', 'options', 'Options', operationWhen('playlistItem', 'add'), [
      { key: 'playlistItemAddEndAt', n8nKey: 'endAt', label: 'End At', kind: 'text', sourceKind: 'dateTime', value: '', description: 'Time when the video should stop playing' },
      { key: 'playlistItemAddNote', n8nKey: 'note', label: 'Note', kind: 'text', value: '', description: 'A user-generated note, maximum 280 characters' },
      ownerField('playlistItemAddOwner'),
      { key: 'playlistItemAddPosition', n8nKey: 'position', label: 'Position', kind: 'number', value: '', min: 0, description: 'Zero-based position in the playlist' },
      { key: 'playlistItemAddStartAt', n8nKey: 'startAt', label: 'Start At', kind: 'text', sourceKind: 'dateTime', value: '', description: 'Time when the video should start playing' },
    ]),
    makeText('playlistItemGetId', 'playlistItemId', 'Playlist Item ID', '', operationWhen('playlistItem', 'get'), { required: true }),
    makeParts('playlistItemGetParts', 'playlistItem', 'get', playlistItemPartOptions, 'playlistItem'),
    makeCollection('playlistItemGetOptions', 'options', 'Options', operationWhen('playlistItem', 'get'), [ownerField('playlistItemGetOwner')]),
    makeText('playlistItemDeleteId', 'playlistItemId', 'Playlist Item ID', '', operationWhen('playlistItem', 'delete'), { required: true }),
    makeCollection('playlistItemDeleteOptions', 'options', 'Options', operationWhen('playlistItem', 'delete'), [ownerField('playlistItemDeleteOwner')]),
    dynamicSelect('playlistItemGetAllPlaylist', 'playlistId', 'Playlist Name or ID', '', operationWhen('playlistItem', 'getAll'), 'getPlaylists', { required: true }),
    makeParts('playlistItemGetAllParts', 'playlistItem', 'getAll', playlistItemPartOptions, 'playlistItem'),
    ...makeReturnAll('playlistItemGetAll', 'playlistItem', 'getAll'),
    makeCollection('playlistItemGetAllOptions', 'options', 'Options', operationWhen('playlistItem', 'getAll'), [ownerField('playlistItemGetAllOwner')]),

    makeText('videoUploadTitle', 'title', 'Title', '', operationWhen('video', 'upload'), { required: true }),
    dynamicSelect('videoUploadRegion', 'regionCode', 'Region Code', '', operationWhen('video', 'upload'), 'getCountriesCodes', { staticLocal: true }),
    dynamicSelect('videoUploadCategory', 'categoryId', 'Category Name or ID', '', operationWhen('video', 'upload'), 'getVideoCategories', { dependsOn: ['regionCode'] }),
    makeText('videoUploadBinary', 'binaryProperty', 'Input Binary Field', 'data', operationWhen('video', 'upload'), { required: true, hint: 'The name of the input binary field containing the file to be uploaded', simulationNote: 'The binary field name is stored only. No file is read, buffered, chunked, or uploaded.' }),
    makeCollection('videoUploadOptions', 'options', 'Options', operationWhen('video', 'upload'), makeVideoMutationFields('videoUpload')),
    makeText('videoDeleteId', 'videoId', 'Video ID', '', operationWhen('video', 'delete'), { required: true, description: 'ID of the video' }),
    makeCollection('videoDeleteOptions', 'options', 'Options', operationWhen('video', 'delete'), [ownerField('videoDeleteOwner')]),
    makeText('videoGetId', 'videoId', 'Video ID', '', operationWhen('video', 'get'), { required: true }),
    makeParts('videoGetParts', 'video', 'get', videoPartOptions, 'video'),
    makeCollection('videoGetOptions', 'options', 'Options', operationWhen('video', 'get'), [ownerField('videoGetOwner')]),
    ...makeReturnAll('videoGetAll', 'video', 'getAll'),
    makeCollection('videoGetAllFilters', 'filters', 'Filters', operationWhen('video', 'getAll'), [
      { key: 'videoGetAllChannelId', n8nKey: 'channelId', label: 'Channel ID', kind: 'text', value: '' },
      { key: 'videoGetAllForDeveloper', n8nKey: 'forDeveloper', label: 'For Developer', kind: 'boolean', value: false },
      { key: 'videoGetAllPublishedAfter', n8nKey: 'publishedAfter', label: 'Published After', kind: 'text', sourceKind: 'dateTime', value: '' },
      { key: 'videoGetAllPublishedBefore', n8nKey: 'publishedBefore', label: 'Published Before', kind: 'text', sourceKind: 'dateTime', value: '' },
      { key: 'videoGetAllQuery', n8nKey: 'q', label: 'Query', kind: 'text', value: '' },
      dynamicSelect('videoGetAllRegion', 'regionCode', 'Region Code', '', undefined, 'getCountriesCodes', { staticLocal: true }),
      { key: 'videoGetAllRelatedId', n8nKey: 'relatedToVideoId', label: 'Related To Video ID', kind: 'text', value: '' },
      { key: 'videoGetAllCategoryId', n8nKey: 'videoCategoryId', label: 'Video Category ID', kind: 'text', value: '' },
      { key: 'videoGetAllSyndicated', n8nKey: 'videoSyndicated', label: 'Video Syndicated', kind: 'boolean', value: false },
      { key: 'videoGetAllType', n8nKey: 'videoType', label: 'Video Type', kind: 'select', value: '', options: [{ label: 'Any', value: 'any' }, { label: 'Episode', value: 'episode' }, { label: 'Movie', value: 'movie' }] },
    ]),
    makeCollection('videoGetAllOptions', 'options', 'Options', operationWhen('video', 'getAll'), [
      { key: 'videoGetAllOrder', n8nKey: 'order', label: 'Order', kind: 'select', value: 'relevance', options: [{ label: 'Date', value: 'date' }, { label: 'Relevance', value: 'relevance' }] },
      { key: 'videoGetAllSafeSearch', n8nKey: 'safeSearch', label: 'Safe Search', kind: 'select', value: '', options: [{ label: 'Moderate', value: 'moderate', description: 'Filter some restricted content' }, { label: 'None', value: 'none', description: 'Do not filter results' }, { label: 'Strict', value: 'strict', description: 'Try to exclude all restricted content' }] },
    ]),
    makeText('videoRateId', 'videoId', 'Video ID', '', operationWhen('video', 'rate'), { required: true }),
    { key: 'videoRateRating', n8nKey: 'rating', label: 'Rating', kind: 'select', value: '', showWhen: operationWhen('video', 'rate'), options: [{ label: 'Dislike', value: 'dislike', description: 'Record a dislike' }, { label: 'Like', value: 'like', description: 'Record a like' }, { label: 'None', value: 'none', description: 'Remove the previous rating' }] },
    makeText('videoUpdateId', 'videoId', 'Video ID', '', operationWhen('video', 'update'), { required: true }),
    makeText('videoUpdateTitle', 'title', 'Title', '', operationWhen('video', 'update'), { required: true }),
    dynamicSelect('videoUpdateRegion', 'regionCode', 'Region Code', '', operationWhen('video', 'update'), 'getCountriesCodes', { staticLocal: true }),
    dynamicSelect('videoUpdateCategory', 'categoryId', 'Category Name or ID', '', operationWhen('video', 'update'), 'getVideoCategories', { dependsOn: ['regionCode'] }),
    makeCollection('videoUpdateFields', 'updateFields', 'Update Fields', operationWhen('video', 'update'), makeVideoMutationFields('videoUpdate'), 'Add option'),

    dynamicSelect('videoCategoryRegion', 'regionCode', 'Region Code', '', operationWhen('videoCategory', 'getAll'), 'getCountriesCodes', { required: true, staticLocal: true }),
    ...makeReturnAll('videoCategoryGetAll', 'videoCategory', 'getAll'),
  ],
  resources: [
    { value: 'channel', defaultOperation: 'getAll', operations: channelOperations.map(({ value }) => value) },
    { value: 'playlist', defaultOperation: 'getAll', operations: playlistOperations.map(({ value }) => value) },
    { value: 'playlistItem', defaultOperation: 'add', operations: playlistItemOperations.map(({ value }) => value) },
    { value: 'video', defaultOperation: 'getAll', operations: videoOperations.map(({ value }) => value) },
    { value: 'videoCategory', defaultOperation: 'getAll', operations: videoCategoryOperations.map(({ value }) => value) },
  ],
  resourceOperationParity: {
    channel: { expected: ['get', 'getAll', 'update', 'uploadBanner'], represented: channelOperations.map(({ value }) => value), default: 'getAll' },
    playlist: { expected: ['create', 'delete', 'get', 'getAll', 'update'], represented: playlistOperations.map(({ value }) => value), default: 'getAll' },
    playlistItem: { expected: ['add', 'delete', 'get', 'getAll'], represented: playlistItemOperations.map(({ value }) => value), default: 'add' },
    video: { expected: ['delete', 'get', 'getAll', 'rate', 'update', 'upload'], represented: videoOperations.map(({ value }) => value), default: 'getAll' },
    videoCategory: { expected: ['getAll'], represented: videoCategoryOperations.map(({ value }) => value), default: 'getAll' },
  },
  operationCount: 20,
  lookupMetadata: {
    getLanguages: { source: 'YouTube i18nLanguages API', parameters: ['h1', 'defaultLanguage'], networkAccess: false },
    getCountriesCodes: { source: 'bundled ISO country codes', parameters: ['regionCode'], staticLocal: true, networkAccess: false },
    getVideoCategories: { source: 'YouTube videoCategories API', parameter: 'categoryId', dependsOn: ['regionCode'], networkAccess: false },
    getPlaylists: { source: 'authenticated user playlists API', parameter: 'playlistId', networkAccess: false },
  },
  docsSummary: {
    operations: {
      channel: channelOperations.map(({ value }) => value),
      playlist: playlistOperations.map(({ value }) => value),
      playlistItem: playlistItemOperations.map(({ value }) => value),
      video: videoOperations.map(({ value }) => value),
      videoCategory: videoCategoryOperations.map(({ value }) => value),
    },
    aiToolDocumented: true,
    authenticationMethods: ['googleOAuth2SingleService'],
  },
  platformGaps: [
    'The native node reuses operation, part, returnAll, limit, filters, options, IDs, title, regionCode, categoryId, and updateFields across conditional branches. Unique UI keys preserve stable branches while n8nKey records the native parameter name.',
    'Languages, video categories, and playlists normally load through YouTube API requests. Their locked lists remain empty; ISO country-code list provenance is retained without executing the source load method.',
    'Channel branding is a native fixedCollection with three named groups. It is normalized into a supported collection containing three single-value fixedCollections while retaining the exact brandingSettingsUi and group n8nKeys.',
    'The source multiple-value Featured Channels Urls string is normalized to a custom-value multiSelect so its string-array default remains representable.',
    'dateTime fields are normalized to inert text controls. They do not parse dates, schedule publishing, or alter playback.',
    'Binary field names remain authoring text only. Banner/video files are never read, buffered, chunked, uploaded, or attached to requests.',
    'Credential fields are metadata-only and the node panel exposes a locked selector. OAuth installation, consent, scope changes, token refresh, and credential access never run.',
    'usableAsTool is preserved, but tool conversion is capability metadata rather than a static ai_tool connector port or executable tool runtime.',
  ],
  unsupportedVisibleTypes: [
    { n8nKey: 'credentials.youTubeOAuth2Api', sourceType: 'credentials', normalizedKind: 'locked select', reason: 'Credential discovery and editors are unavailable.' },
    { n8nKey: 'h1/defaultLanguage/categoryId/playlistId/regionCode', sourceType: 'options with loadOptionsMethod', normalizedKind: 'locked select', reason: 'The catalog does not execute load methods or call YouTube.' },
    { n8nKey: 'updateFields.brandingSettingsUi', sourceType: 'fixedCollection with named groups', normalizedKind: 'collection containing fixedCollections', reason: 'The renderer supports one collectionKey per fixedCollection.' },
    { n8nKey: 'featuredChannelsUrls', sourceType: 'string with multipleValues', normalizedKind: 'custom multiSelect', reason: 'The renderer has no multiple-value free-text control.' },
    { n8nKey: 'publishAt/recordingDate/publishedAfter/publishedBefore/endAt/startAt', sourceType: 'dateTime', normalizedKind: 'text', reason: 'Dates remain inert authoring text.' },
    { n8nKey: 'binaryProperty', sourceType: 'binary input field name', normalizedKind: 'text', reason: 'Binary data access and upload are disabled.' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    oauthInstallation: false,
    oauthConsent: false,
    oauthRefresh: false,
    authentication: false,
    languageLookup: false,
    countryLookup: false,
    categoryLookup: false,
    playlistLookup: false,
    apiRequests: false,
    networkAccess: false,
    binaryRead: false,
    buffering: false,
    chunking: false,
    uploads: false,
    createsPlaylists: false,
    updatesPlaylists: false,
    deletesPlaylists: false,
    updatesChannels: false,
    uploadsBanners: false,
    readsVideos: false,
    updatesVideos: false,
    deletesVideos: false,
    ratesVideos: false,
    parsesDates: false,
    schedulesPublishing: false,
    toolExecution: false,
    voice: false,
  },
  output: {},
};

export default youtube;
