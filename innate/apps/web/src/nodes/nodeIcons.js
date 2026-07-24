import React from 'react';
import { Sparkle, BracketsCurly, ArrowsSplit, ChatCircle, Lightning, Plug, FlowArrow, Brain, Clock, Code, GitBranch, ArrowsMerge, FunnelSimple, Prohibit, Broadcast } from '@phosphor-icons/react';

// Real, full-color app icons (favicons / product branding), background stripped
// with ImageMagick. Preferred over abstract glyphs for any node that maps to a
// real product — see nodeImageIcons below.
const gmailIcon = '/node-icons/gmail.png';
const geminiIcon = '/node-icons/gemini.png';
const slackIcon = '/node-icons/slack.png';
const notionIcon = '/node-icons/notion.png';
const calendarIcon = '/node-icons/calendar.png';
const docsIcon = '/node-icons/docs.png';
const googleIcon = '/node-icons/google.png';

// Per-category visual identity. Kept deliberately calm: the loud colour in the
// UI comes from the real brand logos, so category accents are muted and the node
// icon chips use one neutral background (CHIP_BG) rather than five tints.
export const CHIP_BG = '#EEF1F6';

export const categoryMeta = {
  trigger: { label: 'Trigger', color: '#0055FF', tint: '#E9F1FF', icon: Lightning },
  ai: { label: 'AI', color: '#6B4EFF', tint: '#EFEBFF', icon: Sparkle },
  model: { label: 'Language Model', color: '#0E9488', tint: '#E4F5F3', icon: Brain },
  core: { label: 'Core Node', color: '#5B6675', tint: '#EEF1F5', icon: FlowArrow },
  action: { label: 'Action', color: '#127A54', tint: '#E7F4EE', icon: Plug },
};

// Palette display order for the categories.
export const categoryOrder = ['trigger', 'ai', 'model', 'core', 'action'];

// Real full-color product icons, keyed by node type. These take priority over
// the abstract glyphs below: any node that represents a real app renders its
// actual icon (see NodeIcon).
export const nodeImageIcons = {
  trigger: gmailIcon, // Gmail Trigger
  action: gmailIcon, // Gmail — Send
  'chat-gemini': geminiIcon,
  'slack-message': slackIcon,
  'calendar-event': calendarIcon,
  'notion-page': notionIcon,
  'web-search': googleIcon,
  'google-docs': docsIcon,
};

// The glyph shown on nodes with no real-app icon — abstract Phosphor glyphs for
// n8n core/AI nodes (mirrors how n8n itself mixes real logos with core glyphs).
export const nodeIcons = {
  'chat-trigger': ChatCircle,
  classify: Sparkle,
  summarize: Sparkle,
  parse: BracketsCurly,
  switch: ArrowsSplit,
  // display-only nodes used as quiz answer options
  schedule: Clock,
  webhook: Broadcast,
  code: Code,
  if: GitBranch,
  merge: ArrowsMerge,
  filter: FunnelSimple,
  noop: Prohibit,
};

// Colour override for a glyph node (falls back to the category colour). Nodes
// backed by a real image icon carry their own colour and are not listed here.
export const nodeIconColor = {};

// Unified node-icon renderer: a real product image when one exists, otherwise
// the category/Phosphor glyph. `size` is the pixel box; images are contained
// within it so their own padding/aspect is preserved. Written with
// createElement (no JSX) so this stays a plain .js module.
export function NodeIcon({ type, size = 24, color, style }) {
  const img = nodeImageIcons[type];
  if (img) {
    return React.createElement('img', {
      src: img,
      alt: '',
      draggable: false,
      style: { width: size, height: size, objectFit: 'contain', display: 'block', ...style },
    });
  }
  const Glyph = nodeIcons[type];
  if (!Glyph) return null;
  return React.createElement(Glyph, {
    size,
    color: color || nodeIconColor[type] || metaOf(type).color,
    style,
  });
}

// Which category each node type belongs to (canvas nodes only carry their type).
export const typeCategory = {
  trigger: 'trigger',
  'chat-trigger': 'trigger',
  classify: 'ai',
  summarize: 'ai',
  'chat-gemini': 'model',
  parse: 'core',
  switch: 'core',
  'web-search': 'core',
  action: 'action',
  'slack-message': 'action',
  'calendar-event': 'action',
  'notion-page': 'action',
  'google-docs': 'action',
  schedule: 'trigger',
  webhook: 'trigger',
  code: 'core',
  if: 'core',
  merge: 'core',
  filter: 'core',
  noop: 'core',
};

export function categoryOf(type) {
  return typeCategory[type] || 'core';
}

export function metaOf(type) {
  return categoryMeta[categoryOf(type)];
}

// n8n-style Node Detail View parameters, per node type. Read-only in this prototype.
export const nodeParams = {
  trigger: [
    { kind: 'select', label: 'Credential to connect with', value: 'Gmail account' },
    { kind: 'select', label: 'Poll Times', value: 'Every Minute' },
    { kind: 'select', label: 'Event', value: 'Message Received' },
    { kind: 'text', label: 'Mailbox', value: 'INBOX' },
  ],
  'chat-trigger': [
    { kind: 'select', label: 'Mode', value: 'Chat' },
    { kind: 'select', label: 'Public Access', value: 'Off' },
  ],
  classify: [
    { kind: 'connection', label: 'Chat Model', connectionCategory: 'model', hint: 'Required — plug a language model into the bottom port.' },
    {
      kind: 'textarea',
      label: 'System Message',
      value:
        'You are an email classifier. Reply with ONLY JSON: {"category":"…","urgency":"…"}.\nCategories: BUG_REPORT, FEATURE_REQUEST, COMPLAINT. Urgency: LOW, MEDIUM, HIGH.',
    },
    { kind: 'text', label: 'Text', value: '={{ $json.body }}' },
  ],
  'chat-gemini': [
    { kind: 'select', label: 'Credential to connect with', value: 'Google Gemini (PaLM) account' },
    { kind: 'select', label: 'Model', value: 'models/gemini-2.5-flash' },
    { kind: 'text', label: 'Temperature', value: '0' },
    { kind: 'text', label: 'Maximum Output Tokens', value: '1024' },
  ],
  parse: [
    { kind: 'select', label: 'Mode', value: 'Parse JSON' },
    { kind: 'text', label: 'Output Fields', value: 'category, urgency' },
  ],
  switch: [
    { kind: 'select', label: 'Mode', value: 'Rules' },
    {
      kind: 'rules',
      label: 'Routing Rules',
      rules: [
        { out: 'Bug Report', expr: 'category  is equal to  BUG_REPORT' },
        { out: 'Feature Request', expr: 'category  is equal to  FEATURE_REQUEST' },
        { out: 'Urgent Complaint', expr: 'category = COMPLAINT  AND  urgency = HIGH' },
      ],
    },
  ],
  action: [
    { kind: 'select', label: 'Credential to connect with', value: 'Gmail account' },
    { kind: 'select', label: 'Operation', value: 'Send' },
    { kind: 'text', label: 'To', value: '={{ $json.from }}' },
    { kind: 'text', label: 'Subject', value: 'Re: your request' },
    {
      kind: 'textarea',
      label: 'Message',
      value: "Thanks for reaching out — your email has been categorised and routed to the right team.",
    },
  ],
  'slack-message': [
    { kind: 'select', label: 'Channel', value: '#support' },
    { kind: 'textarea', label: 'Message Text', value: 'New ticket received.' },
  ],
  'calendar-event': [
    { kind: 'select', label: 'Calendar', value: 'Primary' },
    { kind: 'text', label: 'Title', value: 'Follow up' },
  ],
  'notion-page': [
    { kind: 'select', label: 'Database', value: 'Tickets' },
    { kind: 'text', label: 'Title', value: 'New ticket' },
  ],
  'web-search': [{ kind: 'text', label: 'Query', value: '={{ $json.subject }}' }],
  'google-docs': [
    { kind: 'select', label: 'Document', value: 'Ticket log' },
    { kind: 'textarea', label: 'Text', value: 'Logged.' },
  ],
};
