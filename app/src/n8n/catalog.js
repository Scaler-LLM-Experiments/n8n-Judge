// The n8n node catalog for the editor kit: what each node is, its parameters
// (Scaler API credentials shown locked), and the sample Input/Output JSON that
// flows through it. Built from scratch — original data, not n8n's.

export const NODE_CATALOG = {
  trigger: {
    type: 'trigger',
    label: 'New Email',
    subtitle: 'Gmail Trigger',
    category: 'trigger',
    params: [
      { key: 'cred', label: 'Credential', value: 'Scaler API — connected', locked: true },
      { key: 'event', label: 'Event', value: 'Message Received', kind: 'select' },
      { key: 'mailbox', label: 'Mailbox', value: 'INBOX', kind: 'text' },
    ],
    output: {
      from: 'furious@acme.io',
      subject: "I've been charged twice and no one is helping!",
      body: 'This is the third time I am writing. You billed my card twice and support has ghosted me.',
      receivedAt: '2026-07-22T09:14:00Z',
    },
  },
  'chat-trigger': {
    type: 'chat-trigger',
    label: 'Chat Trigger',
    subtitle: 'On chat message',
    category: 'trigger',
    params: [{ key: 'mode', label: 'Mode', value: 'Chat', kind: 'select' }],
    output: { message: 'hello?', sessionId: 'abc123' },
  },
  classify: {
    type: 'classify',
    label: 'Classify with AI',
    subtitle: 'AI Agent',
    category: 'ai',
    needsModel: true,
    params: [
      { key: 'system', label: 'System Message', value: 'Classify the email. Reply with JSON: {"category","urgency"}.', kind: 'textarea' },
      { key: 'text', label: 'Text', value: '', kind: 'text', mappable: true, placeholder: 'Drag a field from Input →' },
    ],
    output: { text: '{"category":"COMPLAINT","urgency":"HIGH"}' },
  },
  'chat-gemini': {
    type: 'chat-gemini',
    label: 'Gemini Chat Model',
    subtitle: 'Language Model',
    category: 'model',
    params: [
      { key: 'cred', label: 'Credential', value: 'Scaler API — connected', locked: true },
      { key: 'model', label: 'Model', value: 'models/gemini-2.5-flash', kind: 'select' },
      { key: 'temp', label: 'Temperature', value: '0', kind: 'text' },
    ],
    output: null,
  },
  parse: {
    type: 'parse',
    label: 'Parse Result',
    subtitle: 'Edit Fields',
    category: 'core',
    params: [
      { key: 'mode', label: 'Mode', value: 'Parse JSON', kind: 'select' },
      { key: 'src', label: 'Source', value: '', kind: 'text', mappable: true, placeholder: 'Drag the AI text field →' },
    ],
    output: { category: 'COMPLAINT', urgency: 'HIGH' },
  },
  switch: {
    type: 'switch',
    label: 'Switch',
    subtitle: 'Route by rules',
    category: 'core',
    branches: ['Bug Report', 'Feature Request', 'Urgent Complaint'],
    params: [
      { key: 'mode', label: 'Mode', value: 'Rules', kind: 'select' },
      { key: 'field', label: 'Value to route on', value: '', kind: 'text', mappable: true, placeholder: 'Drag the category field →' },
    ],
    output: { category: 'COMPLAINT', urgency: 'HIGH' },
  },
  action: {
    type: 'action',
    label: 'Send Reply',
    subtitle: 'Gmail — Send',
    category: 'action',
    params: [
      { key: 'cred', label: 'Credential', value: 'Scaler API — connected', locked: true },
      { key: 'to', label: 'To', value: '', kind: 'text', mappable: true, placeholder: 'Drag the sender field →' },
      { key: 'subject', label: 'Subject', value: 'Re: your request', kind: 'text' },
      { key: 'body', label: 'Message', value: 'Thanks for reaching out — we’re on it.', kind: 'textarea' },
    ],
    output: { sent: true },
  },
  'slack-message': { type: 'slack-message', label: 'Slack — Send Message', subtitle: 'Slack', category: 'action', params: [{ key: 'channel', label: 'Channel', value: '#support', kind: 'select' }], output: { ok: true } },
  'google-docs': { type: 'google-docs', label: 'Google Docs', subtitle: 'Create document', category: 'action', params: [{ key: 'doc', label: 'Document', value: 'Ticket log', kind: 'select' }], output: { ok: true } },
  webhook: { type: 'webhook', label: 'Webhook', subtitle: 'On HTTP request', category: 'trigger', params: [{ key: 'path', label: 'Path', value: '/hook', kind: 'text' }], output: {} },
  schedule: { type: 'schedule', label: 'Schedule', subtitle: 'On a timer', category: 'trigger', params: [{ key: 'every', label: 'Every', value: '1 hour', kind: 'select' }], output: {} },
  code: { type: 'code', label: 'Code', subtitle: 'Run JavaScript', category: 'core', params: [{ key: 'js', label: 'Code', value: 'return items;', kind: 'textarea' }], output: {} },
  if: { type: 'if', label: 'If', subtitle: 'True / false', category: 'core', params: [{ key: 'cond', label: 'Condition', value: '', kind: 'text' }], output: {} },
};

// What the picker offers, grouped, for trigger vs. regular slots.
export const TRIGGER_OPTIONS = ['trigger', 'chat-trigger', 'schedule', 'webhook'];
export const NODE_OPTIONS = ['classify', 'parse', 'switch', 'action', 'code', 'if', 'slack-message', 'google-docs'];

export function catalogEntry(type) {
  return NODE_CATALOG[type];
}
