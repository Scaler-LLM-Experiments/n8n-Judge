// Editor-only descriptor for n8n's GitHub Trigger v1 node. Credential access,
// remote searches, webhook registration, signature checks, and execution stay inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This selector is locked. The simulation never reads, creates, tests, refreshes, signs, or applies GitHub credentials.';
const lockedLookupNote =
  'List search is locked and empty. URL and name modes remain authorable without contacting GitHub.';

const eventOptions = [
  { label: '*', value: '*', description: 'Any time any event is triggered (Wildcard Event)' },
  { label: 'Check Run', value: 'check_run', description: 'Triggered when a check run is created, rerequested, completed, or has a requested_action' },
  { label: 'Check Suite', value: 'check_suite', description: 'Triggered when a check suite is completed, requested, or rerequested' },
  { label: 'Commit Comment', value: 'commit_comment', description: 'Triggered when a commit comment is created' },
  { label: 'Create', value: 'create', description: 'Represents a created repository, branch, or tag' },
  { label: 'Delete', value: 'delete', description: 'Represents a deleted branch or tag' },
  { label: 'Deploy Key', value: 'deploy_key', description: 'Triggered when a deploy key is added or removed from a repository' },
  { label: 'Deployment', value: 'deployment', description: 'Represents a deployment' },
  { label: 'Deployment Status', value: 'deployment_status', description: 'Represents a deployment status' },
  { label: 'Fork', value: 'fork', description: 'Triggered when a user forks a repository' },
  { label: 'Github App Authorization', value: 'github_app_authorization', description: 'Triggered when someone revokes their authorization of a GitHub App' },
  { label: 'Gollum', value: 'gollum', description: 'Triggered when a Wiki page is created or updated' },
  { label: 'Installation', value: 'installation', description: 'Triggered when someone installs (created), uninstalls (deleted), or accepts new permissions (new_permissions_accepted) for a GitHub App. When a GitHub App owner requests new permissions, the person who installed the GitHub App must accept the new permissions request.' },
  { label: 'Installation Repositories', value: 'installation_repositories', description: 'Triggered when a repository is added or removed from an installation' },
  { label: 'Issue Comment', value: 'issue_comment', description: 'Triggered when an issue comment is created, edited, or deleted' },
  { label: 'Issues', value: 'issues', description: 'Triggered when an issue is opened, edited, deleted, transferred, pinned, unpinned, closed, reopened, assigned, unassigned, labeled, unlabeled, locked, unlocked, milestoned, or demilestoned' },
  { label: 'Label', value: 'label', description: "Triggered when a repository's label is created, edited, or deleted" },
  { label: 'Marketplace Purchase', value: 'marketplace_purchase', description: 'Triggered when someone purchases a GitHub Marketplace plan, cancels their plan, upgrades their plan (effective immediately), downgrades a plan that remains pending until the end of the billing cycle, or cancels a pending plan change' },
  { label: 'Member', value: 'member', description: 'Triggered when a user accepts an invitation or is removed as a collaborator to a repository, or has their permissions changed' },
  { label: 'Membership', value: 'membership', description: 'Triggered when a user is added or removed from a team. Organization hooks only.' },
  { label: 'Meta', value: 'meta', description: 'Triggered when the webhook that this event is configured on is deleted' },
  { label: 'Milestone', value: 'milestone', description: 'Triggered when a milestone is created, closed, opened, edited, or deleted' },
  { label: 'Org Block', value: 'org_block', description: 'Triggered when an organization blocks or unblocks a user. Organization hooks only.' },
  { label: 'Organization', value: 'organization', description: 'Triggered when an organization is deleted and renamed, and when a user is added, removed, or invited to an organization. Organization hooks only.' },
  { label: 'Page Build', value: 'page_build', description: 'Triggered on push to a GitHub Pages enabled branch (gh-pages for project pages, master for user and organization pages)' },
  { label: 'Project', value: 'project', description: 'Triggered when a project is created, updated, closed, reopened, or deleted' },
  { label: 'Project Card', value: 'project_card', description: 'Triggered when a project card is created, edited, moved, converted to an issue, or deleted' },
  { label: 'Project Column', value: 'project_column', description: 'Triggered when a project column is created, updated, moved, or deleted' },
  { label: 'Public', value: 'public', description: 'Triggered when a private repository is open sourced' },
  { label: 'Pull Request', value: 'pull_request', description: 'Triggered when a pull request is assigned, unassigned, labeled, unlabeled, opened, edited, closed, reopened, synchronize, ready_for_review, locked, unlocked, a pull request review is requested, or a review request is removed' },
  { label: 'Pull Request Review', value: 'pull_request_review', description: 'Triggered when a pull request review is submitted into a non-pending state, the body is edited, or the review is dismissed' },
  { label: 'Pull Request Review Comment', value: 'pull_request_review_comment', description: "Triggered when a comment on a pull request's unified diff is created, edited, or deleted (in the Files Changed tab)" },
  { label: 'Push', value: 'push', description: 'Triggered on a push to a repository branch. Branch pushes and repository tag pushes also trigger webhook push events. This is the default event.' },
  { label: 'Release', value: 'release', description: 'Triggered when a release is published, unpublished, created, edited, deleted, or prereleased' },
  { label: 'Repository', value: 'repository', description: 'Triggered when a repository is created, archived, unarchived, renamed, edited, transferred, made public, or made private. Organization hooks are also triggered when a repository is deleted.' },
  { label: 'Repository Import', value: 'repository_import', description: 'Triggered when a successful, cancelled, or failed repository import finishes for a GitHub organization or a personal repository' },
  { label: 'Repository Vulnerability Alert', value: 'repository_vulnerability_alert', description: 'Triggered when a security alert is created, dismissed, or resolved' },
  { label: 'Security Advisory', value: 'security_advisory', description: 'Triggered when a new security advisory is published, updated, or withdrawn' },
  { label: 'Star', value: 'star', description: 'Triggered when a star is added or removed from a repository' },
  { label: 'Status', value: 'status', description: 'Triggered when the status of a Git commit changes' },
  { label: 'Team', value: 'team', description: "Triggered when an organization's team is created, deleted, edited, added_to_repository, or removed_from_repository. Organization hooks only." },
  { label: 'Team Add', value: 'team_add', description: 'Triggered when a repository is added to a team' },
  { label: 'Watch', value: 'watch', description: 'Triggered when someone stars a repository' },
];

const ownerModes = [
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
];

const repositoryModes = [
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
];

const credentialRequirements = [
  { type: 'githubApi', name: 'GitHub API', required: true, showWhen: { authentication: ['accessToken'] }, inert: true },
  { type: 'githubOAuth2Api', name: 'GitHub OAuth2 API', required: true, showWhen: { authentication: ['oAuth2'] }, extends: ['oAuth2Api'], inert: true },
  { type: 'githubAppApi', name: 'GitHub App API', required: true, showWhen: { authentication: ['githubAppApi'] }, inert: true },
];

const githubTrigger = {
  type: 'github-trigger',
  n8nType: 'n8n-nodes-base.githubTrigger',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'Github Trigger',
  defaultName: 'Github Trigger',
  subtitle: '={{$parameter["owner"] + "/" + $parameter["repository"] + ": " + $parameter["events"].join(", ")}}',
  description: 'Starts the workflow when Github events occur',
  category: 'trigger',
  categories: ['Development'],
  group: ['trigger'],
  defaults: { name: 'Github Trigger' },
  inputs: [],
  outputs: ['main'],
  icon: '/node-icons/github.svg',
  darkIcon: '/node-icons/github.dark.svg',
  n8nIcon: { light: 'file:github.svg', dark: 'file:github.dark.svg' },
  iconMode: 'image',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.githubtrigger/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/github/',
  genericResources: [
    { label: 'How to automatically manage contributions to open-source projects', icon: '🏷️', url: 'https://n8n.io/blog/automation-for-maintainers-of-open-source-projects/' },
    { label: '5 workflow automations for Mattermost that we love at n8n', icon: '🤖', url: 'https://n8n.io/blog/5-workflow-automations-for-mattermost-that-we-love-at-n8n/' },
    { label: 'How to set up a no-code CI/CD pipeline with GitHub and TravisCI', icon: '🎡', url: 'https://n8n.io/blog/how-to-set-up-a-no-code-ci-cd-pipeline-with-github-and-travisci/' },
  ],
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Github/GithubTrigger.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Github/GithubTrigger.node.json',
    helperPaths: [
      'packages/nodes-base/nodes/Github/GenericFunctions.ts',
      'packages/nodes-base/nodes/Github/GithubTriggerHelpers.ts',
      'packages/nodes-base/nodes/Github/SearchFunctions.ts',
    ],
    credentialPaths: [
      'packages/nodes-base/credentials/GithubApi.credentials.ts',
      'packages/nodes-base/credentials/GithubOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/GithubAppApi.credentials.ts',
    ],
    iconPaths: [
      'packages/nodes-base/nodes/Github/github.svg',
      'packages/nodes-base/nodes/Github/github.dark.svg',
    ],
  },
  credentialRequirements,
  webhooks: [
    { name: 'default', httpMethod: 'POST', responseMode: 'onReceived', path: 'webhook', inert: true },
  ],
  params: [
    {
      key: 'notice', n8nKey: 'notice',
      label: 'Only members with owner privileges for an organization or admin privileges for a repository can set up the webhooks this node requires.',
      kind: 'notice', value: '', required: false,
    },
    {
      key: 'authentication', n8nKey: 'authentication', label: 'Authentication', kind: 'select',
      value: 'accessToken', required: false,
      options: [
        { label: 'Access Token', value: 'accessToken' },
        { label: 'OAuth2', value: 'oAuth2' },
        { label: 'GitHub App', value: 'githubAppApi' },
      ],
    },
    ...credentialRequirements.map(({ type, name, showWhen }) => ({
      key: `${type}Credential`, n8nKey: `credentials.${type}`, label: 'Credential to connect with',
      kind: 'select', sourceKind: 'credentials', value: type, required: true, locked: true,
      dynamic: true, options: [{ label: name, value: type }], showWhen,
      simulationNote: lockedCredentialNote,
    })),
    {
      key: 'owner', n8nKey: 'owner', label: 'Repository Owner', kind: 'resourceLocator',
      sourceKind: 'resourceLocator', value: { __rl: true, mode: 'list', value: '' },
      sourceDefault: { mode: 'list', value: '' }, required: true, locked: true, dynamic: true,
      modes: ['list', 'url', 'name'], modeOptions: ownerModes, options: [], simulationNote: lockedLookupNote,
    },
    {
      key: 'repository', n8nKey: 'repository', label: 'Repository Name', kind: 'resourceLocator',
      sourceKind: 'resourceLocator', value: { __rl: true, mode: 'list', value: '' },
      sourceDefault: { mode: 'list', value: '' }, required: true, locked: true, dynamic: true,
      modes: ['list', 'url', 'name'], modeOptions: repositoryModes, options: [], simulationNote: lockedLookupNote,
    },
    {
      key: 'events', n8nKey: 'events', label: 'Events', kind: 'multiSelect', sourceKind: 'multiOptions',
      value: [], required: true, options: eventOptions, description: 'The events to listen to',
    },
    {
      key: 'options', n8nKey: 'options', label: 'Options', kind: 'collection', sourceKind: 'collection',
      value: {}, required: false, addLabel: 'Add option',
      fields: [
        {
          key: 'insecureSSL', n8nKey: 'insecureSSL', label: 'Insecure SSL', kind: 'boolean',
          value: false, required: false,
          description: 'Whether the SSL certificate of the n8n host be verified by GitHub when delivering payloads',
        },
      ],
    },
  ],
  sourceCoverage: {
    liveEvents: eventOptions.map(({ value }) => value),
    liveOptions: ['insecureSSL'],
    credentialTypes: credentialRequirements.map(({ type }) => type),
    locatorSearchMethods: ['getUsers', 'getRepositories'],
  },
  platformGaps: [
    'Resource-locator list searches are retained as locked metadata; URL and name modes remain editable.',
    'The webhook declaration is descriptive only. The simulator does not create, inspect, delete, receive, or verify GitHub webhooks.',
    'Credential editors and credential tests are outside the Judge settings surface.',
  ],
  unsupportedControls: [
    { n8nKey: 'owner', sourceType: 'resourceLocator list search', behavior: 'locked/inert' },
    { n8nKey: 'repository', sourceType: 'resourceLocator list search', behavior: 'locked/inert' },
    { n8nKey: 'credentials.*', sourceType: 'credential selector', behavior: 'locked/inert' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    apiCalls: false,
    polling: false,
    webhookRegistration: false,
    webhookReception: false,
    signatureVerification: false,
    network: false,
    runtime: false,
    expressionExecution: false,
    voice: false,
  },
  output: {},
};

export default githubTrigger;
