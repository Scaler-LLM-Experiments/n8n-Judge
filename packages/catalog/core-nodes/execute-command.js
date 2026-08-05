// Editor-only descriptor for n8n's Execute Command v1. It reproduces the node
// form but never invokes a shell, process, command, or host API.

const executeCommand = {
  type: 'execute-command',
  n8nType: 'n8n-nodes-base.executeCommand',
  n8nVersion: 1,
  label: 'Execute Command',
  subtitle: '',
  description: 'Executes a command on the host',
  details:
    'Execute command allows you to run terminal commands on the computer/server hosting your n8n instance. Useful for executing a shell script or interacting with your n8n instance programmatically via the CLI.',
  category: 'core',
  categories: ['Development', 'Core Nodes'],
  subcategory: 'Helpers',
  group: ['transform'],
  inputs: ['main'],
  outputs: ['main'],
  usableAsTool: true,
  icon: '/node-icons/execute-command.svg',
  n8nIcon: 'node:execute-command',
  iconColor: 'crimson',
  iconHex: '#772244',
  aliases: ['Shell', 'Command', 'OS', 'Bash'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executecommand/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/ExecuteCommand/ExecuteCommand.node.ts',
    metadataPath: 'packages/nodes-base/nodes/ExecuteCommand/ExecuteCommand.node.json',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/execute-command.svg',
  },
  defaults: { name: 'Execute Command' },
  restrictions: {
    disabledByDefault: true,
    disabledByDefaultSince: '2.0',
    cloudAvailable: false,
    securityWarning:
      'The Execute Command node can introduce significant security risks in environments that operate with untrusted users.',
  },
  params: [
    {
      key: 'executeOnce',
      label: 'Execute Once',
      kind: 'boolean',
      value: true,
      required: false,
      description: 'Whether to execute only once instead of once for each entry',
    },
    {
      key: 'command',
      label: 'Command',
      kind: 'textarea',
      value: '',
      required: true,
      rows: 5,
      placeholder: 'echo "test"',
      description: 'The command to execute',
    },
  ],
  output: {},
};

export default executeCommand;
