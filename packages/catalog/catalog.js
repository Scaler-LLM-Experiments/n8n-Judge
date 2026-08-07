import {
  COMPLETE_CLUSTER_NODE_TYPES,
  COMPLETE_CORE_NODE_TYPES,
  CORE_NODE_CATALOG,
} from './core-nodes/index.js';
import { APP_NODE_CATALOG, COMPLETE_APP_NODE_TYPES, COMPLETE_APP_TRIGGER_NODE_TYPES } from './app-nodes/index.js';

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
// Read from n8n v2.34.0, commit 3d68c29b9281f14097aa9f15e01ac0777e538b11. When you update one of these, check the
// node's real `version` array first:
// docs/n8n-reference/00-how-n8n-actually-works.md §6.

export const BASE_NODE_CATALOG = {
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
  'calendar-event': { type: 'calendar-event', n8nType: 'n8n-nodes-base.googleCalendar', n8nVersion: 1.3, label: 'Google Calendar — Create Event', subtitle: 'Google Calendar', category: 'action', params: [{ key: 'calendar', label: 'Calendar', value: 'Primary', kind: 'select' }], output: { ok: true } },
  'notion-page': { type: 'notion-page', n8nType: 'n8n-nodes-base.notion', n8nVersion: 2.2, label: 'Notion — Create Page', subtitle: 'Notion', category: 'action', params: [{ key: 'database', label: 'Database', value: 'Requests', kind: 'select' }], output: { ok: true } },
  'web-search': { type: 'web-search', n8nType: 'n8n-nodes-base.httpRequest', n8nVersion: 4.2, label: 'Web Search', subtitle: 'Search the web', category: 'core', params: [{ key: 'query', label: 'Query', value: '', kind: 'text', mappable: true }], output: { results: [] } },
  aggregate: {
    type: 'aggregate', n8nType: 'n8n-nodes-base.aggregate', n8nVersion: 1,
    label: 'Aggregate',
    subtitle: '',
    description: 'Combine a field from many items into a list in a single item',
    category: 'core',
    subcategory: 'Data Transformation',
    group: ['transform'],
    inputs: ['main'], outputs: ['main'],
    icon: '/node-icons/aggregate.svg', iconColor: 'orange-red', iconHex: '#FF6D5A',
    aliases: ['Aggregate', 'Combine', 'Flatten', 'Transform', 'Array', 'List', 'Item'],
    docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.aggregate/',
    source: {
      commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
      path: 'packages/nodes-base/nodes/Transform/Aggregate/Aggregate.node.ts',
    },
    builderHint: {
      searchHint: 'Need to combine items from multiple branches? Use merge node. This nodes combines all items from one branch into one item.',
      relatedNodes: [
        { nodeType: 'n8n-nodes-base.merge', relationHint: 'For multiple branches' },
        { nodeType: 'n8n-nodes-base.splitOut', relationHint: 'Reverse operation' },
      ],
    },
    params: [
      {
        key: 'aggregate', label: 'Aggregate', kind: 'select', value: 'aggregateIndividualFields',
        options: [
          { label: 'Individual Fields', value: 'aggregateIndividualFields' },
          { label: 'All Item Data (Into a Single List)', value: 'aggregateAllItemData' },
        ],
      },
      {
        key: 'fieldsToAggregate', label: 'Fields To Aggregate', kind: 'fixedCollection',
        multiple: true, addLabel: 'Add Field To Aggregate',
        value: { fieldToAggregate: [{ fieldToAggregate: '', renameField: false }] },
        showWhen: { aggregate: ['aggregateIndividualFields'] },
        fields: [
          {
            key: 'fieldToAggregate', label: 'Input Field Name', kind: 'text', value: '',
            placeholder: 'e.g. id', hint: 'Enter the field name as text', dataPath: 'single',
            description: 'The name of a field in the input items to aggregate together',
          },
          {
            key: 'renameField', label: 'Rename Field', kind: 'boolean', value: false,
            description: 'Whether to give the field a different name in the output',
          },
          {
            key: 'outputFieldName', label: 'Output Field Name', kind: 'text', value: '',
            showWhen: { renameField: [true] }, dataPath: 'single',
            description: 'The name of the field to put the aggregated data in. Leave blank to use the input field name.',
          },
        ],
      },
      {
        key: 'destinationFieldName', label: 'Put Output in Field', kind: 'text', value: 'data',
        showWhen: { aggregate: ['aggregateAllItemData'] },
        description: 'The name of the output field to put the data in',
      },
      {
        key: 'include', label: 'Include', kind: 'select', value: 'allFields', showWhen: { aggregate: ['aggregateAllItemData'] },
        options: [
          { label: 'All Fields', value: 'allFields' },
          { label: 'Specified Fields', value: 'specifiedFields' },
          { label: 'All Fields Except', value: 'allFieldsExcept' },
        ],
      },
      {
        key: 'fieldsToExclude', label: 'Fields To Exclude', kind: 'text', value: '',
        placeholder: 'e.g. email, name', dataPath: 'multiple',
        showWhen: { aggregate: ['aggregateAllItemData'], include: ['allFieldsExcept'] },
      },
      {
        key: 'fieldsToInclude', label: 'Fields To Include', kind: 'text', value: '',
        placeholder: 'e.g. email, name', dataPath: 'multiple',
        showWhen: { aggregate: ['aggregateAllItemData'], include: ['specifiedFields'] },
      },
      {
        key: 'options', label: 'Options', kind: 'collection', addLabel: 'Add Field', value: {},
        fields: [
          {
            key: 'disableDotNotation', label: 'Disable Dot Notation', kind: 'boolean', value: false,
            showWhen: { aggregate: ['aggregateIndividualFields'] },
            description: 'Whether to disallow referencing child fields using `parent.child` in the field name',
          },
          {
            key: 'mergeLists', label: 'Merge Lists', kind: 'boolean', value: false,
            showWhen: { aggregate: ['aggregateIndividualFields'] },
            description: 'Whether to merge the output into a single flat list (rather than a list of lists), if the field to aggregate is a list',
          },
          {
            key: 'includeBinaries', label: 'Include Binaries', kind: 'boolean', value: false,
            description: 'Whether to include the binary data in the new item',
          },
          {
            key: 'keepOnlyUnique', label: 'Keep Only Unique Binaries', kind: 'boolean', value: false,
            showWhen: { includeBinaries: [true] },
            description: 'Whether to keep only unique binaries by comparing mime types, file types, file sizes and file extensions',
          },
          {
            key: 'keepMissing', label: 'Keep Missing And Null Values', kind: 'boolean', value: false,
            showWhen: { aggregate: ['aggregateIndividualFields'] },
            description: 'Whether to add a null entry to the aggregated list when there is a missing or null value',
          },
        ],
      },
    ],
    output: { customerIds: ['CUS-101', 'CUS-102', 'CUS-103'] },
  },
  limit: {
    type: 'limit', n8nType: 'n8n-nodes-base.limit', n8nVersion: 1,
    label: 'Limit',
    subtitle: '',
    description: 'Restrict the number of items',
    category: 'core',
    subcategory: 'Data Transformation',
    group: ['transform'],
    inputs: ['main'], outputs: ['main'],
    icon: '/node-icons/limit.svg', iconColor: 'emerald', iconHex: '#2FB67C',
    aliases: ['Limit', 'Remove', 'Slice', 'Transform', 'Array', 'List', 'Item'],
    docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.limit/',
    source: {
      commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
      path: 'packages/nodes-base/nodes/Transform/Limit/Limit.node.ts',
    },
    params: [
      {
        key: 'maxItems', label: 'Max Items', kind: 'number', value: 1, min: 1,
        description: 'If there are more items than this number, some are removed',
      },
      {
        key: 'keep', label: 'Keep', kind: 'select', value: 'firstItems',
        options: [
          { label: 'First Items', value: 'firstItems' },
          { label: 'Last Items', value: 'lastItems' },
        ],
        description: 'When removing items, whether to keep the ones at the start or the ending',
      },
    ],
    output: { id: 'ITEM-001' },
  },
  'split-out': {
    type: 'split-out', n8nType: 'n8n-nodes-base.splitOut', n8nVersion: 1,
    label: 'Split Out',
    subtitle: '',
    description: 'Turn a list inside item(s) into separate items',
    category: 'core',
    subcategory: 'Data Transformation',
    group: ['transform'],
    inputs: ['main'], outputs: ['main'],
    icon: '/node-icons/split-out.svg', iconColor: 'violet', iconHex: '#9B6DD5',
    aliases: ['Split', 'Nested', 'Transform', 'Array', 'List', 'Item'],
    docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitout/',
    source: {
      commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
      path: 'packages/nodes-base/nodes/Transform/SplitOut/SplitOut.node.ts',
    },
    builderHint: {
      relatedNodes: [{ nodeType: 'n8n-nodes-base.aggregate', relationHint: 'Reverse operation - combine items back' }],
    },
    params: [
      {
        key: 'fieldToSplitOut', label: 'Fields To Split Out', kind: 'text', value: '', required: true,
        placeholder: 'Drag fields from the left or type their names', dataPath: 'multiple',
        hint: 'Use $binary to split out the input item by binary data',
        description: 'The name of the input fields to break out into separate items. Separate multiple field names by commas. For binary data, use $binary.',
        builderHint: 'Must be a field name (or comma-separated list of field names) as it appears inside $json. Use direct keys such as issues or user.addresses, not $json or $json-prefixed expressions. Use $binary only for binary data.',
      },
      {
        key: 'include', label: 'Include', kind: 'select', value: 'noOtherFields',
        options: [
          { label: 'No Other Fields', value: 'noOtherFields' },
          { label: 'All Other Fields', value: 'allOtherFields' },
          { label: 'Selected Other Fields', value: 'selectedOtherFields' },
        ],
        description: 'Whether to copy any other fields into the new items',
      },
      {
        key: 'fieldsToInclude', label: 'Fields To Include', kind: 'text', value: '',
        placeholder: 'e.g. email, name', dataPath: 'multiple', showWhen: { include: ['selectedOtherFields'] },
        description: 'Fields in the input items to aggregate together',
      },
      {
        key: 'options', label: 'Options', kind: 'collection', addLabel: 'Add Field', value: {},
        fields: [
          {
            key: 'disableDotNotation', label: 'Disable Dot Notation', kind: 'boolean', value: false,
            description: 'Whether to disallow referencing child fields using `parent.child` in the field name',
          },
          {
            key: 'destinationFieldName', label: 'Destination Field Name', kind: 'text', value: '', dataPath: 'multiple',
            description: 'The field in the output under which to put the split field contents',
          },
          {
            key: 'includeBinary', label: 'Include Binary', kind: 'boolean', value: false,
            description: 'Whether to include the binary data in the new items',
          },
        ],
      },
    ],
    output: { id: 'CUS-101', name: 'Aarav Sharma' },
  },
};

// Each type has exactly one owner. Keeping the three source catalogs separate
// makes accidental duplicates testable instead of silently relying on spread order.
export const NODE_CATALOG = {
  ...BASE_NODE_CATALOG,
  ...CORE_NODE_CATALOG,
  ...APP_NODE_CATALOG,
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
const completeCoreTriggers = COMPLETE_CORE_NODE_TYPES.filter((type) => NODE_CATALOG[type]?.category === 'trigger');
const completeCoreActions = COMPLETE_CORE_NODE_TYPES.filter((type) => NODE_CATALOG[type]?.category !== 'trigger');
const completeClusterTriggers = COMPLETE_CLUSTER_NODE_TYPES.filter((type) => NODE_CATALOG[type]?.category === 'trigger');
const completeClusterActions = COMPLETE_CLUSTER_NODE_TYPES.filter((type) => NODE_CATALOG[type]?.category !== 'trigger');

export const TRIGGER_OPTIONS = [...new Set([
  'trigger', 'chat-trigger', 'schedule', 'webhook', 'form-trigger',
  ...completeCoreTriggers,
  ...completeClusterTriggers,
  ...COMPLETE_APP_TRIGGER_NODE_TYPES,
])];
export const NODE_OPTIONS = [...new Set([
  'classify', 'summarize', 'parse', 'switch', 'action', 'code', 'if',
  'slack-message', 'google-docs', 'google-sheets', 'http-request',
  ...completeCoreActions,
  ...completeClusterActions,
  ...COMPLETE_APP_NODE_TYPES,
])];

export function catalogEntry(type) {
  return NODE_CATALOG[type];
}

export function isRouterEntry(entry) {
  const mainOutputs = (entry?.outputs ?? []).filter((port) =>
    (typeof port === 'string' ? port : port.type) === 'main');
  return Boolean(entry?.router || entry?.branches?.length || mainOutputs.length > 1);
}

const descriptorValue = (value) => value && typeof value === 'object' && '__rl' in value
  ? value.value
  : value;

const descriptorAtPath = (values, path) => String(path).split('.').filter(Boolean)
  .reduce((current, key) => current && typeof current === 'object' ? current[key] : undefined, values);

const descriptorHasPath = (values, path) => {
  let current = values;
  for (const key of String(path).split('.').filter(Boolean)) {
    if (!current || typeof current !== 'object' || !Object.hasOwn(current, key)) return false;
    current = current[key];
  }
  return true;
};

const descriptorConditionMatches = (actual, accepted, exists) => {
  const same = (candidate) => candidate === descriptorValue(actual)
    || String(candidate) === String(descriptorValue(actual) ?? '');
  if (Array.isArray(accepted)) {
    const values = Array.isArray(actual) ? actual : [actual];
    return values.some((value) => accepted.some((candidate) =>
      candidate === descriptorValue(value) || String(candidate) === String(descriptorValue(value) ?? '')));
  }
  if (accepted?.exists !== undefined) return exists === accepted.exists;
  if (Object.hasOwn(accepted ?? {}, 'not')) return !same(accepted.not);
  if (accepted?.notIn) return !accepted.notIn.some(same);
  if (accepted?.includes !== undefined) return String(descriptorValue(actual) ?? '').includes(accepted.includes);
  return false;
};

export function descriptorFieldIsVisible(field, values = {}) {
  const matchesAll = (conditions) => Object.entries(conditions).every(([key, accepted]) =>
    descriptorConditionMatches(descriptorAtPath(values, key), accepted, descriptorHasPath(values, key)));
  return (!field.showWhen || matchesAll(field.showWhen))
    && (!field.hideWhen || !matchesAll(field.hideWhen));
}

/**
 * Does this node, AS CONFIGURED, hand its data on rather than end the flow?
 *
 * Judge resolves a node's role from `category`, and `action` has always meant
 * "terminal" — the Run walk stops there. That is right for sending a reply and
 * wrong for reading a spreadsheet: an app node can equally be a data SOURCE in
 * the middle of a flow, which is the shape the authoring docs advertise as
 * "Scheduled sync" (`schedule → source app read → … → destination app`).
 *
 * Which it is depends on the node's configured operation, not on its type, so a
 * descriptor declares the condition as `passthroughWhen` — the same map-of-
 * key-to-accepted-values vocabulary as `showWhen`, and evaluated by the same
 * predicate, so there is one condition language in the catalog rather than two.
 *
 * `values` are the learner's ACTUAL answers. Catalog defaults are deliberately
 * not filled in: Google Sheets defaults `sheetOperation` to 'read', so defaulting
 * would silently reclassify every Sheets node nobody has configured — including
 * the ones whose whole job is to end a branch by appending a row.
 */
export function entryIsPassthrough(entry, values) {
  const conditions = entry?.passthroughWhen;
  if (!conditions || !values) return false;
  return Object.entries(conditions).every(([key, accepted]) =>
    descriptorConditionMatches(descriptorAtPath(values, key), accepted, descriptorHasPath(values, key)));
}
