// Editor-only descriptor for n8n's Email Trigger (IMAP) v2.2 node. IMAP
// authentication, connections, polling, and trigger execution stay out of scope.

const emailTriggerImap = {
  type: 'email-trigger-imap',
  n8nType: 'n8n-nodes-base.emailReadImap',
  n8nVersion: 2.2,
  versionHistory: [1, 2, 2.1, 2.2],
  label: 'Email Trigger (IMAP)',
  subtitle: '',
  description: 'Triggers the workflow when a new email is received',
  eventTriggerDescription: 'Waiting for you to receive an email',
  category: 'trigger',
  categories: ['Communication', 'Core Nodes'],
  subcategory: 'Other Trigger Nodes',
  subcategories: ['Other Trigger Nodes'],
  group: ['trigger'],
  defaults: { name: 'Email Trigger (IMAP)', color: '#44AA22' },
  inputs: [],
  outputs: ['main'],
  icon: '/node-icons/email-trigger-imap.svg',
  n8nIcon: 'node:email-trigger',
  iconColor: 'green',
  iconHex: '#00786F',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.emailimap/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/imap/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/EmailReadImap/EmailReadImap.node.ts',
    versionPath: 'packages/nodes-base/nodes/EmailReadImap/v2/EmailReadImapV2.node.ts',
    metadataPath: 'packages/nodes-base/nodes/EmailReadImap/EmailReadImap.node.json',
    credentialPath: 'packages/nodes-base/credentials/Imap.credentials.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/email-trigger.svg',
  },
  triggerPanel: {
    header: '',
    executionsHelp: {
      inactive:
        "<b>While building your workflow</b>, click the 'execute step' button, then send an email to make an event happen. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Once you're happy with your workflow</b>, publish it. Then every time an email is received, the workflow will execute. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
      active:
        "<b>While building your workflow</b>, click the 'execute step' button, then send an email to make an event happen. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Your workflow will also execute automatically</b>, since it's activated. Every time an email is received, this node will trigger an execution. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
    },
    activationHint:
      'Once you’ve finished building your workflow, publish it to have it also listen continuously (you just won’t see those executions here).',
  },
  credentialRequirements: [
    {
      type: 'imap',
      name: 'IMAP',
      required: true,
      testedBy: 'imapConnectionTest',
    },
  ],
  params: [
    {
      key: 'credential',
      n8nKey: 'credentials.imap',
      label: 'Credential to connect with',
      kind: 'select',
      value: 'imap',
      required: true,
      locked: true,
      options: [{ label: 'IMAP', value: 'imap' }],
      simulationNote:
        'The credential selector is intentionally locked; this simulation never authenticates or opens an IMAP connection.',
    },
    {
      key: 'mailbox',
      label: 'Mailbox Name',
      kind: 'text',
      value: 'INBOX',
      required: false,
    },
    {
      key: 'postProcessAction',
      label: 'Action',
      kind: 'select',
      value: 'read',
      required: false,
      options: [
        { label: 'Mark as Read', value: 'read' },
        { label: 'Nothing', value: 'nothing' },
      ],
      description:
        'What to do after the email has been received. If "nothing" gets selected it will be processed multiple times.',
    },
    {
      key: 'downloadAttachments',
      label: 'Download Attachments',
      kind: 'boolean',
      value: false,
      required: false,
      showWhen: { format: ['simple'] },
      description:
        'Whether attachments of emails should be downloaded. Only set if needed as it increases processing.',
    },
    {
      key: 'format',
      label: 'Format',
      kind: 'select',
      value: 'simple',
      required: false,
      options: [
        {
          label: 'RAW',
          value: 'raw',
          description:
            'Returns the full email message data with body content in the raw field as a base64url encoded string; the payload field is not used',
        },
        {
          label: 'Resolved',
          value: 'resolved',
          description:
            'Returns the full email with all data resolved and attachments saved as binary data',
        },
        {
          label: 'Simple',
          value: 'simple',
          description:
            'Returns the full email; do not use if you wish to gather inline attachments',
        },
      ],
      description: 'The format to return the message in',
    },
    {
      key: 'resolvedAttachmentPrefix',
      n8nKey: 'dataPropertyAttachmentsPrefixName',
      label: 'Property Prefix Name',
      kind: 'text',
      value: 'attachment_',
      required: false,
      showWhen: { format: ['resolved'] },
      description:
        'Prefix for name of the binary property to which to write the attachments. An index starting with 0 will be added. So if name is "attachment_" the first attachment is saved to "attachment_0"',
    },
    {
      key: 'simpleAttachmentPrefix',
      n8nKey: 'dataPropertyAttachmentsPrefixName',
      label: 'Property Prefix Name',
      kind: 'text',
      value: 'attachment_',
      required: false,
      showWhen: { format: ['simple'], downloadAttachments: [true] },
      description:
        'Prefix for name of the binary property to which to write the attachments. An index starting with 0 will be added. So if name is "attachment_" the first attachment is saved to "attachment_0"',
    },
    {
      key: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      fields: [
        {
          key: 'customEmailConfig',
          label: 'Custom Email Rules',
          kind: 'text',
          value: '["UNSEEN"]',
          required: false,
          description:
            'Custom email fetching rules. See <a href="https://github.com/mscdex/node-imap">node-imap</a>\'s search function for more details.',
        },
        {
          key: 'forceReconnect',
          label: 'Force Reconnect Every Minutes',
          kind: 'number',
          value: 60,
          required: false,
          description: 'Sets an interval (in minutes) to force a reconnection',
        },
        {
          key: 'trackLastMessageId',
          label: 'Fetch Only New Emails',
          kind: 'boolean',
          value: true,
          required: false,
          description:
            'Whether to fetch only new emails since the last run, or all emails that match the "Custom Email Rules" (["UNSEEN"] by default)',
        },
      ],
    },
  ],
  output: {},
};

export default emailTriggerImap;
