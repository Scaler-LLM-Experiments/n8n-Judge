// Editor-only descriptor for n8n's Local File Trigger v1. It preserves the
// authoring surface without accessing the filesystem or starting a watcher.

const triggerEvents = [
  {
    label: 'File Added',
    value: 'add',
    description: 'Triggers whenever a new file was added',
  },
  {
    label: 'File Changed',
    value: 'change',
    description: 'Triggers whenever a file was changed',
  },
  {
    label: 'File Deleted',
    value: 'unlink',
    description: 'Triggers whenever a file was deleted',
  },
  {
    label: 'Folder Added',
    value: 'addDir',
    description: 'Triggers whenever a new folder was added',
  },
  {
    label: 'Folder Deleted',
    value: 'unlinkDir',
    description: 'Triggers whenever a folder was deleted',
  },
];

const localFileTrigger = {
  type: 'local-file-trigger',
  n8nType: 'n8n-nodes-base.localFileTrigger',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'Local File Trigger',
  subtitle: '=Path: {{$parameter["path"]}}',
  description: 'Triggers a workflow on file system changes',
  details:
    'The Local File Trigger node starts a workflow when it detects changes on the file system. These changes involve a file or folder getting added, changed, or deleted.',
  eventTriggerDescription: '',
  category: 'trigger',
  categories: ['Core Nodes'],
  subcategory: 'Other Trigger Nodes',
  subcategories: ['Files', 'Other Trigger Nodes'],
  group: ['trigger'],
  inputs: [],
  outputs: ['main'],
  icon: '/node-icons/local-file-trigger.svg',
  n8nIcon: 'node:local-file-trigger',
  iconColor: 'black',
  iconHex: '#000000',
  iconMode: 'currentColor',
  aliases: ['Watch', 'Monitor'],
  docs:
    'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.localfiletrigger/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/LocalFileTrigger/LocalFileTrigger.node.ts',
    metadataPath: 'packages/nodes-base/nodes/LocalFileTrigger/LocalFileTrigger.node.json',
    testPath:
      'packages/nodes-base/nodes/LocalFileTrigger/__test__/LocalFileTrigger.node.test.ts',
    availabilityPath: 'packages/@n8n/config/src/configs/nodes.config.ts',
    breakingChangePath:
      'packages/cli/src/modules/breaking-changes/rules/v2/disabled-nodes.rule.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/local-file-trigger.svg',
    directImports: [
      { module: 'chokidar', names: ['watch'] },
      { module: 'chokidar/handler.js', names: ['EventName'], typeOnly: true },
      {
        module: 'n8n-workflow',
        names: [
          'ITriggerFunctions',
          'IDataObject',
          'INodeType',
          'INodeTypeDescription',
          'ITriggerResponse',
          'NodeConnectionTypes',
        ],
        typeOnlyNames: [
          'ITriggerFunctions',
          'IDataObject',
          'INodeType',
          'INodeTypeDescription',
          'ITriggerResponse',
        ],
      },
    ],
  },
  defaults: { name: 'Local File Trigger' },
  availability: {
    selfHostedOnly: true,
    cloudAvailable: false,
    disabledByDefault: true,
    disabledByDefaultSince: '2.0',
    disabledNodeType: 'n8n-nodes-base.localFileTrigger',
    enablement:
      'Remove n8n-nodes-base.localFileTrigger from NODES_EXCLUDE, or set NODES_EXCLUDE=[] if enabling all excluded nodes is acceptable.',
    securityWarning:
      'This node can introduce significant security risks in environments that operate with untrusted users.',
  },
  triggerPanel: {
    header: '',
    executionsHelp: {
      inactive:
        "<b>While building your workflow</b>, click the 'execute step' button, then make a change to your watched file or folder. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Once you're happy with your workflow</b>, publish it. Then every time a change is detected, the workflow will execute. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
      active:
        "<b>While building your workflow</b>, click the 'execute step' button, then make a change to your watched file or folder. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Your workflow will also execute automatically</b>, since it's activated. Every time a change is detected, this node will trigger an execution. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
    },
    activationHint:
      'Once you’ve finished building your workflow, publish it to have it also listen continuously (you just won’t see those executions here).',
  },
  params: [
    {
      key: 'triggerOn',
      n8nKey: 'triggerOn',
      label: 'Trigger On',
      kind: 'select',
      value: '',
      required: true,
      options: [
        { label: 'Changes to a Specific File', value: 'file' },
        { label: 'Changes Involving a Specific Folder', value: 'folder' },
      ],
    },
    {
      key: 'path',
      n8nKey: 'path',
      label: 'File to Watch',
      kind: 'text',
      value: '',
      required: false,
      showWhen: { triggerOn: ['file', 'folder'] },
      labelByValue: {
        triggerOn: {
          file: 'File to Watch',
          folder: 'Folder to Watch',
        },
      },
      placeholderByValue: {
        triggerOn: {
          file: '/data/invoices/1.pdf',
          folder: '/data/invoices',
        },
      },
      sourceBranches: [
        {
          label: 'File to Watch',
          showWhen: { triggerOn: ['file'] },
          placeholder: '/data/invoices/1.pdf',
        },
        {
          label: 'Folder to Watch',
          showWhen: { triggerOn: ['folder'] },
          placeholder: '/data/invoices',
        },
      ],
      simulationNote:
        'Both mutually exclusive source fields use the same n8n key, so they are normalized into one path control with dynamic copy.',
    },
    {
      key: 'events',
      n8nKey: 'events',
      label: 'Watch for',
      kind: 'multiSelect',
      value: [],
      required: true,
      showWhen: { triggerOn: ['folder'] },
      options: triggerEvents,
      description: 'The events to listen to',
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
          key: 'awaitWriteFinish',
          n8nKey: 'awaitWriteFinish',
          label: 'Await Write Finish',
          kind: 'boolean',
          value: false,
          required: false,
          description: 'Whether to wait until files finished writing to avoid partially read',
          stabilityControl: {
            sourceOption: 'awaitWriteFinish',
            separateThresholdExposed: false,
          },
        },
        {
          key: 'followSymlinks',
          n8nKey: 'followSymlinks',
          label: 'Include Linked Files/Folders',
          kind: 'boolean',
          value: true,
          required: false,
          description:
            'Whether linked files/folders will also be watched (this includes symlinks, aliases on MacOS and shortcuts on Windows). Otherwise only the links themselves will be monitored).',
        },
        {
          key: 'ignored',
          n8nKey: 'ignored',
          label: 'Ignore',
          kind: 'text',
          value: '',
          required: false,
          placeholder: '**/*.txt or ignore-me/subfolder',
          description:
            "Files or paths to ignore. The whole path is tested, not just the filename. Supports <a href=\"https://github.com/micromatch/anymatch\">Anymatch</a>- syntax. Regex patterns may not work on macOS. To ignore files based on substring matching, use the 'Ignore Mode' option with 'Contain'.",
        },
        {
          key: 'ignoreInitial',
          n8nKey: 'ignoreInitial',
          label: 'Ignore Existing Files/Folders',
          kind: 'boolean',
          value: true,
          required: false,
          description: 'Whether to ignore existing files/folders to not trigger an event',
        },
        {
          key: 'depth',
          n8nKey: 'depth',
          label: 'Max Folder Depth',
          kind: 'select',
          value: -1,
          required: false,
          options: [
            { label: '1 Levels Down', value: 1 },
            { label: '2 Levels Down', value: 2 },
            { label: '3 Levels Down', value: 3 },
            { label: '4 Levels Down', value: 4 },
            { label: '5 Levels Down', value: 5 },
            { label: 'Top Folder Only', value: 0 },
            { label: 'Unlimited', value: -1 },
          ],
          description: 'How deep into the folder structure to watch for changes',
        },
        {
          key: 'usePolling',
          n8nKey: 'usePolling',
          label: 'Use Polling',
          kind: 'boolean',
          value: false,
          required: false,
          description:
            'Whether to use polling for watching. Typically necessary to successfully watch files over a network.',
        },
        {
          key: 'ignoreMode',
          n8nKey: 'ignoreMode',
          label: 'Ignore Mode',
          kind: 'select',
          value: 'match',
          required: false,
          options: [
            {
              label: 'Match',
              value: 'match',
              description:
                'Ignore files using regex patterns (e.g., **/*.txt), Not supported on macOS',
            },
            {
              label: 'Contain',
              value: 'contain',
              description: 'Ignore files if their path contains the specified value',
            },
          ],
          description:
            'Whether to ignore files using regex matching (Anymatch patterns) or by checking if the path contains a specified value',
        },
      ],
    },
  ],
  authoringSemantics: {
    fileEvent: 'change',
    folderEventOptions: triggerEvents.map(({ value }) => value),
    ignoreBranches: {
      match: 'Anymatch pattern',
      contain: 'Path substring',
    },
    pollingControl: 'options.usePolling',
    writeStabilityControl: 'options.awaitWriteFinish',
    separateDebounceControl: false,
    emittedFields: ['event', 'path'],
    configurationOnly: true,
  },
  simulation: {
    configurationOnly: true,
    filesystemAccess: false,
    startsWatcher: false,
    readsFiles: false,
    emitsEvents: false,
    polls: false,
  },
  output: {},
};

export default localFileTrigger;
