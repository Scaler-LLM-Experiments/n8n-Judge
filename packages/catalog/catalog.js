// The n8n node catalog for the editor kit: what each node is, its parameters
// (Scaler API credentials shown locked), and the sample Input/Output JSON that
// flows through it. Built from scratch — original data, not n8n's.
//
// `n8nType` / `n8nVersion` record WHICH real node, at which typeVersion, each of
// these models. Judge deliberately does not implement typeVersion — one shipped
// schema per node type is the right simplification for a teaching tool — but
// without writing the version down, the catalogue drifts from the n8n a learner
// meets afterwards and nobody can tell when or by how much. A node's parameter
// schema really does change between versions (the Chat Model's `model` went from
// a plain string to a resourceLocator at 1.2), so "which version is this?" is a
// real question with a real answer.
//
// Read from n8n v2.33.0, commit eb38e10. When you update one of these, check the
// node's real `version` array first:
// docs/n8n-reference/00-how-n8n-actually-works.md §6.

export const NODE_CATALOG = {
  trigger: {
    type: 'trigger', n8nType: 'n8n-nodes-base.gmailTrigger', n8nVersion: 1.4,
    label: 'New Email',
    subtitle: 'Gmail Trigger',
    description: 'Runs the flow the moment a new email arrives in the inbox',
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
    type: 'chat-trigger', n8nType: '@n8n/n8n-nodes-langchain.chatTrigger', n8nVersion: 1.3,
    label: 'On chat message',
    subtitle: 'Chat Trigger',
    description: 'Runs the flow when a user sends a chat message. For AI chatbots.',
    category: 'trigger',
    params: [{ key: 'mode', label: 'Mode', value: 'Chat', kind: 'select' }],
    output: { message: 'hello?', sessionId: 'abc123' },
  },
  classify: {
    type: 'classify', n8nType: '@n8n/n8n-nodes-langchain.textClassifier', n8nVersion: 1.1,
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
  summarize: {
    type: 'summarize', n8nType: '@n8n/n8n-nodes-langchain.chainLlm', n8nVersion: 1.7,
    label: 'Summarize with AI',
    subtitle: 'Basic LLM Chain',
    category: 'ai',
    needsModel: true,
    params: [
      { key: 'system', label: 'System Message', value: 'Summarize the call transcript into a short paragraph, then a bulleted list of action items with owners.', kind: 'textarea' },
      { key: 'text', label: 'Text', value: '', kind: 'text', mappable: true, placeholder: 'Drag the transcript field →' },
    ],
    output: { text: 'Summary: The customer asked about billing…\nAction items:\n- Refund the duplicate charge (Priya)\n- Follow up in 2 days (Sam)' },
  },
  'chat-gemini': {
    type: 'chat-gemini', n8nType: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini', n8nVersion: 1,
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
    type: 'parse', n8nType: 'n8n-nodes-base.set', n8nVersion: 3.5,
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
    type: 'switch', n8nType: 'n8n-nodes-base.switch', n8nVersion: 3.4,
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
    type: 'action', n8nType: 'n8n-nodes-base.gmail', n8nVersion: 2.1,
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
  'slack-message': { type: 'slack-message', n8nType: 'n8n-nodes-base.slack', n8nVersion: 2.3, label: 'Slack — Send Message', subtitle: 'Slack', category: 'action', params: [{ key: 'channel', label: 'Channel', value: '#support', kind: 'select' }], output: { ok: true } },
  'google-docs': { type: 'google-docs', n8nType: 'n8n-nodes-base.googleDocs', n8nVersion: 2, label: 'Google Docs', subtitle: 'Create document', category: 'action', params: [{ key: 'doc', label: 'Document', value: 'Ticket log', kind: 'select' }], output: { ok: true } },
  'calendar-event': { type: 'calendar-event', n8nType: 'n8n-nodes-base.googleCalendar', n8nVersion: 1.3, label: 'Google Calendar — Create Event', subtitle: 'Google Calendar', category: 'action', params: [{ key: 'calendar', label: 'Calendar', value: 'Primary', kind: 'select' }], output: { ok: true } },
  'notion-page': { type: 'notion-page', n8nType: 'n8n-nodes-base.notion', n8nVersion: 2.2, label: 'Notion — Create Page', subtitle: 'Notion', category: 'action', params: [{ key: 'database', label: 'Database', value: 'Requests', kind: 'select' }], output: { ok: true } },
  'web-search': { type: 'web-search', n8nType: 'n8n-nodes-base.httpRequest', n8nVersion: 4.2, label: 'Web Search', subtitle: 'Search the web', category: 'core', params: [{ key: 'query', label: 'Query', value: '', kind: 'text', mappable: true }], output: { results: [] } },
  webhook: { type: 'webhook', n8nType: 'n8n-nodes-base.webhook', n8nVersion: 2.1, label: 'On webhook call', subtitle: 'Webhook', description: 'Runs the flow when it receives an HTTP request', category: 'trigger', params: [{ key: 'path', label: 'Path', value: '/hook', kind: 'text' }], output: {} },
  schedule: { type: 'schedule', n8nType: 'n8n-nodes-base.scheduleTrigger', n8nVersion: 1.2, label: 'On a schedule', subtitle: 'Schedule Trigger', description: 'Runs the flow every day, hour, or custom interval', category: 'trigger', params: [{ key: 'every', label: 'Every', value: '1 hour', kind: 'select' }], output: {} },
  manual: { type: 'manual', n8nType: 'n8n-nodes-base.manualTrigger', n8nVersion: 1, label: 'Trigger manually', subtitle: 'Manual Trigger', description: 'Runs the flow when you click Execute. Good for testing.', category: 'trigger', params: [], output: {} },
  code: { type: 'code', n8nType: 'n8n-nodes-base.code', n8nVersion: 2, label: 'Code', subtitle: 'Run JavaScript', category: 'core', params: [{ key: 'js', label: 'Code', value: 'return items;', kind: 'textarea' }], output: {} },
  if: { type: 'if', n8nType: 'n8n-nodes-base.if', n8nVersion: 2.3, label: 'If', subtitle: 'True / false', category: 'core', params: [{ key: 'cond', label: 'Condition', value: '', kind: 'text' }], output: {} },
  merge: { type: 'merge', n8nType: 'n8n-nodes-base.merge', n8nVersion: 3.2, label: 'Merge', subtitle: 'Combine two inputs', category: 'core', params: [{ key: 'mode', label: 'Mode', value: 'Append', kind: 'select' }], output: {} },
  filter: { type: 'filter', n8nType: 'n8n-nodes-base.filter', n8nVersion: 2.3, label: 'Filter', subtitle: 'Drop non-matching items', category: 'core', params: [{ key: 'cond', label: 'Condition', value: '', kind: 'text' }], output: {} },
  // Added for `order-desk`, which needs a spine long enough to be genuinely hard.
  // Each of these is a real n8n node a learner will meet, and each carries one
  // decision the existing vocabulary could not express: what makes two items the
  // same, how a flow waits, and calling your own API as opposed to searching the web.
  'remove-duplicates': {
    type: 'remove-duplicates', n8nType: 'n8n-nodes-base.removeDuplicates', n8nVersion: 2,
    label: 'Remove Duplicates',
    subtitle: 'Drop items already seen',
    description: 'Drops items it has seen before, comparing on the field you choose',
    category: 'core',
    params: [{ key: 'compare', label: 'Compare', value: 'Selected fields', kind: 'select' }],
    output: { threadId: 'thr_8891', from: 'priya@acme.io' },
  },
  wait: {
    type: 'wait', n8nType: 'n8n-nodes-base.wait', n8nVersion: 1.1,
    label: 'Wait',
    subtitle: 'Pause the flow',
    description: 'Pauses this item for a time, until a date, or until something calls back',
    category: 'core',
    params: [{ key: 'resume', label: 'Resume', value: 'After time interval', kind: 'select' }],
    output: {},
  },
  'http-request': {
    type: 'http-request', n8nType: 'n8n-nodes-base.httpRequest', n8nVersion: 4.2,
    label: 'HTTP Request',
    subtitle: 'Call an API',
    description: 'Calls a URL and brings the response back into the flow',
    category: 'core',
    params: [{ key: 'url', label: 'URL', value: '', kind: 'text', mappable: true }],
    // An exchange-rate lookup, because `output` is what the NDV Input pane of the NEXT
    // node displays (N8nEditor.jsx:86 → `ndvIn`), so this is read as a claim about what
    // this node really returns. It used to hold `order-desk`'s
    // `{ order: { id, value, trackingId, placedAt } }` — a problem deleted on 2026-07-31 —
    // which meant a case that points this node at a real API showed the learner a payload
    // from a different one entirely, on the very screen teaching them to read the response.
    output: { amount: 1, base: 'USD', date: '2026-08-05', rates: { INR: 83.21 } },
  },
  // Added 2026-08-04 for the Class-6 "log it to a spreadsheet" shape, which the
  // action vocabulary could not express at all.
  //
  // The existing terminals each create ONE thing — a doc, a page, an event, a reply.
  // None of them has cells, so none of them can carry the decision this node exists
  // to teach: which incoming field belongs under which column. That is a different
  // question from "where does this go?", and it is the commonest one in real
  // automation. `google-docs` was the nearest type and is not a substitute: a
  // document has no columns to put a value under, so a mis-mapped field cannot even
  // be wrong there.
  'google-sheets': {
    type: 'google-sheets', n8nType: 'n8n-nodes-base.googleSheets', n8nVersion: 4.7,
    // Just 'Google Sheets', NOT 'Google Sheets — Append Row'. The label is the node's
    // caption on the canvas and in the palette, and Append Row is one of the operations a
    // case may GRADE — naming it here prints the answer on the node the learner is being
    // asked about. The node does several operations; the label should not pick one.
    label: 'Google Sheets',
    subtitle: 'Google Sheets',
    description: 'Adds one row to a sheet, with each value under the column you map it to',
    category: 'action',
    params: [
      { key: 'cred', label: 'Credential', value: 'Scaler API — connected', locked: true },
      { key: 'document', label: 'Document', value: 'Signups', kind: 'select' },
      { key: 'sheet', label: 'Sheet', value: 'Signups', kind: 'select' },
      // Deliberately NOT defaulted to 'Append Row'. Which operation to use is a decision a
      // case may grade, so a default that names one prints the answer. Nothing renders these
      // catalog params today (the NDV reads the problem's `nodeSetup`, and the only consumer
      // of `nodeParams`, components/NodeDetailView.jsx, has no importers) — this keeps it
      // harmless if anything ever does.
      { key: 'operation', label: 'Operation', value: '', kind: 'select' },
    ],
    // Echoes the row it appended, which is both what n8n's Sheets append really returns and
    // what the NEXT node's NDV Input pane needs to show. `{ ok: true }` alone made the
    // downstream email node's Input pane contain none of the fields its graded options
    // reference, so a learner reading the pane could reasonably conclude no `$json.*` option
    // resolves and pick a hardcoded address — a defensible reading of what they were shown,
    // marked wrong.
    output: {
      'Full Name': 'Aarav Sharma',
      Email: 'aarav@example.com',
      Plan: 'Pro',
      'Referral Source': 'Google search',
      USD_INR_Rate: 83.21,
      updates: { updatedRows: 1 },
    },
  },
  // The public-form entry point. Distinct from `webhook`: a webhook is an HTTP call
  // from another system with a body you do not control, whereas a form trigger owns
  // its own fields — so the fields a learner defines here are what the rest of the
  // flow maps from. Judge models the fields as one parameter rather than a repeatable
  // group, because what is being taught downstream is the mapping, not form design.
  'form-trigger': {
    type: 'form-trigger', n8nType: 'n8n-nodes-base.formTrigger', n8nVersion: 2.2,
    label: 'On form submission',
    subtitle: 'n8n Form',
    description: 'Publishes a form and runs the flow when somebody submits it',
    category: 'trigger',
    params: [
      { key: 'title', label: 'Form Title', value: 'Free Trial Signup', kind: 'text' },
      { key: 'fields', label: 'Form Fields', value: 'Full Name, Email, Plan, Referral Source', kind: 'text' },
    ],
    output: { 'Full Name': 'Aarav Sharma', Email: 'aarav@example.com', Plan: 'Pro', 'Referral Source': 'Google search' },
  },
};

/**
 * The sub-node connectors an AI root node exposes, as data rather than a
 * hardcoded list in the canvas component.
 *
 * `maxConnections` is n8n's own rule and it is not uniform: model, memory and
 * output parser are capped at ONE each, while `ai_tool` has no cap at all —
 * which is exactly why you can hang many tools off an Agent but only one Chat
 * Model. Judge enforces the model cap already (the `+` disappears once a model
 * is attached, and there is no drag-to-connect), but it was doing so by
 * accident of the UI rather than by stating the rule, so nothing could explain
 * it and a future problem needing several tools had no way to say so.
 *
 * `connector` is the real n8n connection type. See
 * docs/n8n-reference/00-how-n8n-actually-works.md §10.
 */
export const AI_SUB_NODE_PORTS = [
  {
    id: 'chatModel',
    connector: 'ai_languageModel',
    label: 'Chat Model',
    required: true,
    maxConnections: 1,
    why: 'One model per node — it is the single brain doing the thinking, so there is nothing to choose between.',
  },
  {
    id: 'memory',
    connector: 'ai_memory',
    label: 'Memory',
    required: false,
    maxConnections: 1,
    why: 'Memory lets a node remember earlier messages in a conversation. This flow handles one email at a time, so there is nothing to remember.',
  },
  {
    id: 'tool',
    connector: 'ai_tool',
    label: 'Tool',
    required: false,
    maxConnections: null, // n8n sets no cap: an Agent can hold many tools
    why: 'Tools let a node go and do something — search, look up a record, call an API. This node only has to read and label text.',
  },
];

// What the picker offers, grouped, for trigger vs. regular slots.
//
// These are only the FALLBACK: `NodePickerDrawer` prefers the phase's own `pickable`
// list and reaches for these when a phase does not declare one. That makes them easy
// to under-maintain — a type absent from here is silently unpickable in any phase that
// forgot `pickable` — so a new type that a case is expected to place belongs in the
// matching list.
export const TRIGGER_OPTIONS = ['trigger', 'chat-trigger', 'schedule', 'webhook', 'form-trigger'];
export const NODE_OPTIONS = [
  'classify', 'summarize', 'parse', 'switch', 'action', 'code', 'if',
  'slack-message', 'google-docs', 'google-sheets', 'http-request',
];

export function catalogEntry(type) {
  return NODE_CATALOG[type];
}
