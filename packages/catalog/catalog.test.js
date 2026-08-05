import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { NODE_CATALOG, AI_SUB_NODE_PORTS, TRIGGER_OPTIONS, NODE_OPTIONS } from './catalog.js';
import {
  CLUSTER_NODE_INVENTORY,
  COMPLETE_CLUSTER_NODE_TYPES,
  CORE_NODE_INVENTORY,
  COMPLETE_CORE_NODE_TYPES,
  SOURCE_COMMIT,
} from './core-nodes/index.js';
import {
  APP_NODE_INVENTORY,
  APP_SOURCE_COMMIT,
  APP_TRIGGER_NODE_INVENTORY,
  COMPLETE_APP_NODE_TYPES,
  COMPLETE_APP_TRIGGER_NODE_TYPES,
} from './app-nodes/index.js';

const supportedFieldKinds = new Set([
  'assignmentList', 'boolean', 'button', 'code', 'collection', 'color', 'expression',
  'fixedCollection', 'hidden', 'notice', 'number', 'resourceLocator',
  'ruleList', 'multiSelect', 'select', 'text', 'textarea',
]);

const inspectFields = (type, fields, path = '', requireInertLocks = false) => {
  const keys = fields.map((field) => field.key);
  expect(new Set(keys).size, `${type}:${path} has duplicate UI keys`).toBe(keys.length);
  for (const field of fields) {
    expect(field.label, `${type}:${path}${field.key} has no label`).toBeTruthy();
    expect(supportedFieldKinds.has(field.kind), `${type}:${path}${field.key} uses unsupported kind ${field.kind}`).toBe(true);
    if (requireInertLocks && field.kind === 'select') {
      expect(Array.isArray(field.value), `${type}:${path}${field.key} is a scalar select with an array default`).toBe(false);
    }
    if (requireInertLocks && (field.dynamicOptions?.inert || field.dynamicSchema || field.dynamic)) {
      expect(field.locked, `${type}:${path}${field.key} exposes a lookup/schema that cannot load in the simulation`).toBe(true);
    }
    if (field.fields) inspectFields(type, field.fields, `${path}${field.key}.`, requireInertLocks);
  }
};

const containsFunction = (value, seen = new Set()) => {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object' || seen.has(value)) return false;
  seen.add(value);
  return Object.values(value).some((child) => containsFunction(child, seen));
};

describe('essential app-node completion inventory', () => {
  it('tracks the deliberately curated app scope without Webex or duplicates', () => {
    expect(APP_NODE_INVENTORY).toHaveLength(24);
    expect(new Set(APP_NODE_INVENTORY.map((node) => node.type)).size).toBe(24);
    expect(new Set(APP_NODE_INVENTORY.map((node) => node.docsSlug)).size).toBe(24);
    expect(APP_NODE_INVENTORY.some((node) => node.type.includes('webex'))).toBe(false);
    expect(APP_NODE_INVENTORY.every((node) => ['pending', 'complete'].includes(node.status))).toBe(true);
  });

  it('publishes only reviewed app descriptors', () => {
    expect(COMPLETE_APP_NODE_TYPES).toEqual(
      APP_NODE_INVENTORY.filter((node) => node.status === 'complete').map((node) => node.type)
    );
    for (const type of COMPLETE_APP_NODE_TYPES) {
      const node = NODE_CATALOG[type];
      expect(node, `${type} is marked complete but missing from the catalog`).toBeTruthy();
      expect(node.source?.commit, `${type} has no reviewed source commit`).toBe(APP_SOURCE_COMMIT);
      expect(node.icon, `${type} has no active editor icon`).toMatch(/^\/node-icons\//);
      expect(existsSync(new URL(`../../apps/web/public${node.icon}`, import.meta.url)), `${type} icon file is missing`).toBe(true);
      expect(node.execute, `${type} must remain an authoring-only simulation`).toBeUndefined();
      expect(node.trigger, `${type} must not implement a trigger runtime`).toBeUndefined();
      expect(node.webhook, `${type} must not implement a webhook runtime`).toBeUndefined();
      expect(node.simulation?.voice, `${type} must not generate voice during node authoring`).toBe(false);
      inspectFields(type, node.params ?? [], '', true);
    }
  });
});

describe('essential app-node batch 1 carries the real operation surface', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models Discord v2 channel, message, member, and webhook operations', () => {
    const node = NODE_CATALOG.discord;
    const p = params('discord');
    expect(node).toMatchObject({ n8nVersion: 2, category: 'action', usableAsTool: true });
    expect(p.channelOperation.options).toHaveLength(5);
    expect(p.messageOperation.options).toHaveLength(6);
    expect(p.memberOperation.options).toHaveLength(3);
    expect(p.webhookOperation.options.map(({ value }) => value)).toEqual(['sendLegacy']);
  });

  it('models all Dropbox v1 file, folder, and search operations', () => {
    const node = NODE_CATALOG.dropbox;
    const p = params('dropbox');
    expect(node).toMatchObject({ n8nVersion: 1, usableAsTool: true });
    expect(p.resource.options.map(({ value }) => value)).toEqual(['file', 'folder', 'search']);
    expect(p.fileOperation.options).toHaveLength(5);
    expect(p.folderOperation.options).toHaveLength(5);
    expect(p.searchOperation.options.map(({ value }) => value)).toEqual(['query']);
  });

  it('models Google Drive v3 files, folders, search, and shared drives', () => {
    const node = NODE_CATALOG['google-drive'];
    const p = params('google-drive');
    expect(node).toMatchObject({ n8nVersion: 3, usableAsTool: true });
    expect(p.resource.options.map(({ value }) => value)).toEqual(['file', 'fileFolder', 'folder', 'drive']);
    expect(p.fileOperation.options).toHaveLength(8);
    expect(p.folderOperation.options).toHaveLength(3);
    expect(p.driveOperation.options).toHaveLength(5);
    expect(p.fileFolderOperation.options.map(({ value }) => value)).toEqual(['search']);
  });
});

describe('essential app-node batch 2 carries the real operation surface', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models all 48 current GitHub v1.1 operations', () => {
    const node = NODE_CATALOG.github;
    const operationParams = node.params.filter(({ n8nKey }) => n8nKey === 'operation');
    expect(node).toMatchObject({ n8nVersion: 1.1, usableAsTool: true });
    expect(params('github').resource.options).toHaveLength(9);
    expect(operationParams.reduce((total, param) => total + param.options.length, 0)).toBe(48);
  });

  it('models Google Docs v2 create, get, and update', () => {
    const node = NODE_CATALOG['google-docs'];
    const p = params('google-docs');
    expect(node).toMatchObject({ n8nVersion: 2, usableAsTool: true });
    expect(p.resource.options.map(({ value }) => value)).toEqual(['document']);
    expect(p.operation.options.map(({ value }) => value)).toEqual(['create', 'get', 'update']);
  });

  it('models all 15 standalone Google Gemini v1.2 operations', () => {
    const node = NODE_CATALOG['google-gemini'];
    const operationParams = node.params.filter(({ n8nKey }) => n8nKey === 'operation');
    expect(node).toMatchObject({ n8nVersion: 1.2, usableAsTool: true });
    expect(params('google-gemini').resource.options).toHaveLength(7);
    expect(operationParams.reduce((total, param) => total + param.options.length, 0)).toBe(15);
  });
});

describe('essential app-node batch 3 carries the real operation surface', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models all ten Google Sheets v4.7 operations', () => {
    const node = NODE_CATALOG['google-sheets'];
    const p = params('google-sheets');
    expect(node).toMatchObject({ n8nVersion: 4.7, usableAsTool: true });
    expect(p.resource.options.map(({ value }) => value)).toEqual(['spreadsheet', 'sheet']);
    expect(p.sheetOperation.options).toHaveLength(8);
    expect(p.spreadsheetOperation.options).toHaveLength(2);
    expect(node.output).toMatchObject({ Email: 'aarav@example.com', updates: { updatedRows: 1 } });
  });

  it('models the Google Translate v2 language operation', () => {
    const node = NODE_CATALOG['google-translate'];
    const p = params('google-translate');
    expect(node).toMatchObject({ n8nVersion: 2, usableAsTool: true });
    expect(p.resource.options.map(({ value }) => value)).toEqual(['language']);
    expect(p.operation.options.map(({ value }) => value)).toEqual(['translate']);
  });

  it('models all 16 Microsoft OneDrive v1.1 operations', () => {
    const node = NODE_CATALOG['microsoft-onedrive'];
    const p = params('microsoft-onedrive');
    expect(node).toMatchObject({ n8nVersion: 1.1, usableAsTool: true });
    expect(p.resource.options.map(({ value }) => value)).toEqual(['file', 'folder']);
    expect(p.fileOperation.options).toHaveLength(9);
    expect(p.folderOperation.options).toHaveLength(7);
  });
});

describe('essential app-node batch 4 carries the real operation surface', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models all 17 Microsoft Excel v2.2 operations', () => {
    const node = NODE_CATALOG['microsoft-excel'];
    const p = params('microsoft-excel');
    expect(node).toMatchObject({ n8nVersion: 2.2, usableAsTool: true });
    expect(p.resource.options.map(({ value }) => value)).toEqual(['table', 'workbook', 'worksheet']);
    expect(p.tableOperation.options.length + p.workbookOperation.options.length + p.worksheetOperation.options.length).toBe(17);
  });

  it('models all 16 Microsoft Teams v2 operations', () => {
    const node = NODE_CATALOG['microsoft-teams'];
    const p = params('microsoft-teams');
    expect(node).toMatchObject({ n8nVersion: 2, usableAsTool: true });
    expect(p.resource.options).toHaveLength(4);
    expect(p.channelOperation.options.length + p.channelMessageOperation.options.length + p.chatMessageOperation.options.length + p.taskOperation.options.length).toBe(16);
  });

  it('models all 16 modern OpenAI v2.3 operations', () => {
    const node = NODE_CATALOG.openai;
    const operationParams = node.params.filter(({ n8nKey }) => n8nKey === 'operation');
    expect(node).toMatchObject({ n8nType: '@n8n/n8n-nodes-langchain.openAi', n8nVersion: 2.3, usableAsTool: false });
    expect(params('openai').resource.options).toHaveLength(6);
    expect(operationParams.reduce((total, param) => total + param.options.length, 0)).toBe(16);
  });
});

describe('essential app-node batch 5 carries the real operation surface', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models all four PayPal v1 payout operations', () => {
    const node = NODE_CATALOG.paypal;
    const p = params('paypal');
    expect(node).toMatchObject({ n8nType: 'n8n-nodes-base.payPal', n8nVersion: 1, usableAsTool: false });
    expect(p.payoutOperation.options.map(({ value }) => value)).toEqual(['create', 'get']);
    expect(p.payoutItemOperation.options.map(({ value }) => value)).toEqual(['cancel', 'get']);
  });

  it('models all six Postgres v2.7 operations', () => {
    const node = NODE_CATALOG.postgres;
    const p = params('postgres');
    expect(node).toMatchObject({ n8nVersion: 2.7, usableAsTool: true });
    expect(p.operation.options.map(({ value }) => value)).toEqual([
      'deleteTable', 'executeQuery', 'insert', 'upsert', 'select', 'update',
    ]);
  });

  it('models Twilio v1 Call Make and SMS Send', () => {
    const node = NODE_CATALOG.twilio;
    const p = params('twilio');
    expect(node).toMatchObject({ n8nVersion: 1, usableAsTool: true });
    expect(p.resource.options.map(({ value }) => value)).toEqual(['call', 'sms']);
    expect(p.callOperation.options.map(({ value }) => value)).toEqual(['make']);
    expect(p.smsOperation.options.map(({ value }) => value)).toEqual(['send']);
  });
});

describe('essential app-node batch 6 carries the real operation surface', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models all five live Zoom v1 meeting operations', () => {
    const node = NODE_CATALOG.zoom;
    const p = params('zoom');
    expect(node).toMatchObject({ n8nVersion: 1, usableAsTool: true, operationCount: 5 });
    expect(p.resource.options.map(({ value }) => value)).toEqual(['meeting']);
    expect(p.meetingOperation.options.map(({ value }) => value)).toEqual(['create', 'delete', 'get', 'getAll', 'update']);
  });

  it('models all 20 YouTube v1 operations', () => {
    const node = NODE_CATALOG.youtube;
    const operationParams = node.params.filter(({ n8nKey }) => n8nKey === 'operation');
    expect(node).toMatchObject({ n8nVersion: 1, usableAsTool: true, operationCount: 20 });
    expect(params('youtube').resource.options).toHaveLength(5);
    expect(operationParams.reduce((total, param) => total + param.options.length, 0)).toBe(20);
  });

  it('models all 26 Gmail v2.2 operations including Send and Wait', () => {
    const node = NODE_CATALOG.gmail;
    const p = params('gmail');
    const operationParams = node.params.filter(({ n8nKey }) => n8nKey === 'operation');
    expect(node).toMatchObject({ n8nVersion: 2.2, usableAsTool: true, operationCount: 26 });
    expect(p.resource.options).toHaveLength(4);
    expect(operationParams.reduce((total, param) => total + param.options.length, 0)).toBe(26);
    expect(p.messageOperation.options.map(({ value }) => value)).toContain('sendAndWait');
  });
});

describe('essential app-node batch 7 carries the real operation surface', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models all 48 current Slack v2.6 operations', () => {
    const node = NODE_CATALOG.slack;
    const operationParams = node.params.filter(({ n8nKey }) => n8nKey === 'operation');
    expect(node).toMatchObject({ n8nVersion: 2.6, usableAsTool: true, operationCount: 48 });
    expect(params('slack').resource.options).toHaveLength(7);
    expect(operationParams.reduce((total, param) => total + param.options.length, 0)).toBe(48);
    expect(params('slack').messageOperation.options.map(({ value }) => value)).toContain('sendAndWait');
  });

  it('models all six Google Calendar v1.3 operations', () => {
    const node = NODE_CATALOG['google-calendar'];
    const p = params('google-calendar');
    expect(node).toMatchObject({ n8nVersion: 1.3, usableAsTool: true, operationCount: 6 });
    expect(p.resource.options.map(({ value }) => value)).toEqual(['calendar', 'event']);
    expect(p.calendarOperation.options.map(({ value }) => value)).toEqual(['availability']);
    expect(p.eventOperation.options.map(({ value }) => value)).toEqual(['create', 'delete', 'get', 'getAll', 'update']);
  });

  it('models all 38 Microsoft Outlook v2 operations', () => {
    const node = NODE_CATALOG['microsoft-outlook'];
    const operationParams = node.params.filter(({ n8nKey }) => n8nKey === 'operation');
    expect(node).toMatchObject({ n8nType: 'n8n-nodes-base.microsoftOutlook', n8nVersion: 2, usableAsTool: true, operationCount: 38 });
    expect(params('microsoft-outlook').resource.options).toHaveLength(8);
    expect(operationParams.reduce((total, param) => total + param.options.length, 0)).toBe(38);
    expect(params('microsoft-outlook').messageOperation.options.map(({ value }) => value)).toContain('sendAndWait');
  });
});

describe('essential app-node batch 8 carries the real operation surface', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models all 17 current Notion v3 operations', () => {
    const node = NODE_CATALOG.notion;
    const operationParams = node.params.filter(({ n8nKey }) => n8nKey === 'operation');
    expect(node).toMatchObject({ n8nVersion: 3, usableAsTool: true, operationCount: 17 });
    expect(params('notion').resource.options).toHaveLength(6);
    expect(operationParams.reduce((total, param) => total + param.options.length, 0)).toBe(17);
    expect(params('notion').pageOperation.options.map(({ value }) => value)).toContain('updateMarkdown');
  });

  it('models all 27 Telegram v1.2 operations', () => {
    const node = NODE_CATALOG.telegram;
    const operationParams = node.params.filter(({ n8nKey }) => n8nKey === 'operation');
    expect(node).toMatchObject({ n8nVersion: 1.2, usableAsTool: true, operationCount: 27 });
    expect(params('telegram').resource.options.map(({ value }) => value)).toEqual(['chat', 'callback', 'file', 'message']);
    expect(operationParams.reduce((total, param) => total + param.options.length, 0)).toBe(27);
    expect(params('telegram').messageOperation.options.map(({ value }) => value)).toContain('sendAndWait');
  });

  it('models all 20 Stripe v1 operations', () => {
    const node = NODE_CATALOG.stripe;
    const operationParams = node.params.filter(({ n8nKey }) => n8nKey === 'operation');
    expect(node).toMatchObject({ n8nVersion: 1, usableAsTool: true, operationCount: 20 });
    expect(params('stripe').resource.options).toHaveLength(8);
    expect(operationParams.reduce((total, param) => total + param.options.length, 0)).toBe(20);
  });
});

describe('app-trigger library', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('tracks every live matching trigger while publishing only selected complete nodes', () => {
    expect(APP_TRIGGER_NODE_INVENTORY).toHaveLength(15);
    expect(new Set(APP_TRIGGER_NODE_INVENTORY.map((node) => node.type)).size).toBe(15);
    expect(COMPLETE_APP_TRIGGER_NODE_TYPES).toEqual(
      APP_TRIGGER_NODE_INVENTORY.filter((node) => node.status === 'complete').map((node) => node.type)
    );
    for (const type of COMPLETE_APP_TRIGGER_NODE_TYPES) {
      const inventory = APP_TRIGGER_NODE_INVENTORY.find((node) => node.type === type);
      const node = NODE_CATALOG[type];
      expect(NODE_CATALOG[inventory.actionType], `${type} has no matching main node`).toBeTruthy();
      expect(node).toMatchObject({ category: 'trigger', source: { commit: APP_SOURCE_COMMIT }, simulation: { voice: false } });
      expect(TRIGGER_OPTIONS).toContain(type);
      expect(NODE_OPTIONS).not.toContain(type);
      inspectFields(type, node.params, '', true);
      expect(node.execute).toBeUndefined();
      expect(node.trigger).toBeUndefined();
      expect(node.webhook).toBeUndefined();
    }
  });

  it('models the first three source-accurate trigger surfaces', () => {
    expect(params('github-trigger').events.options).toHaveLength(43);
    expect(params('google-calendar-trigger').triggerOn.options).toHaveLength(5);
    expect(params('google-drive-trigger').triggerOn.options.map(({ value }) => value)).toEqual(['specificFile', 'specificFolder']);
    expect(params('google-drive-trigger').specificFolderEvent.options).toHaveLength(5);
  });

  it('models Gmail, Slack, and Google Sheets trigger surfaces', () => {
    expect(NODE_CATALOG['gmail-trigger']).toMatchObject({ n8nVersion: 1.4, polling: true });
    expect(params('gmail-trigger').event.options.map(({ value }) => value)).toEqual(['messageReceived']);
    expect(params('slack-trigger').trigger.options).toHaveLength(9);
    expect(params('google-sheets-trigger').event.options.map(({ value }) => value)).toEqual(['rowAdded', 'rowUpdate', 'anyUpdate']);
    expect(params('google-sheets-trigger').includeInOutput.hideWhen).toEqual({ event: ['rowAdded'] });
  });

  it('models Stripe, Outlook, and Teams trigger surfaces', () => {
    expect(params('stripe-trigger').events.options).toHaveLength(152);
    expect(params('stripe-trigger').events.options[0].value).toBe('*');
    expect(params('microsoft-outlook-trigger').fields.options).toHaveLength(27);
    expect(params('microsoft-teams-trigger').event.options).toHaveLength(5);
    expect(params('microsoft-teams-trigger').teamId.kind).toBe('resourceLocator');
  });

  it('models Telegram, Notion, and Postgres trigger surfaces', () => {
    expect(params('telegram-trigger').updates.options).toHaveLength(10);
    expect(params('telegram-trigger').updates.options[0].value).toBe('*');
    expect(params('notion-trigger').event.options.map(({ value }) => value)).toEqual([
      'pageAddedToDatabase', 'pagedUpdatedInDatabase',
    ]);
    expect(params('postgres-trigger').triggerMode.options.map(({ value }) => value)).toEqual(['createTrigger', 'listenTrigger']);
    expect(params('postgres-trigger').firesOn.options.map(({ value }) => value)).toEqual(['INSERT', 'UPDATE', 'DELETE']);
  });
});

describe('core-node completion inventory', () => {
  it('tracks the complete official docs scope without duplicates', () => {
    expect(CORE_NODE_INVENTORY).toHaveLength(67);
    expect(new Set(CORE_NODE_INVENTORY.map((node) => node.type)).size).toBe(67);
    expect(new Set(CORE_NODE_INVENTORY.map((node) => node.docsSlug)).size).toBe(67);
    expect(CORE_NODE_INVENTORY.filter((node) => node.status === 'excluded-deprecated').map((node) => node.type)).toEqual([
      'activation-trigger',
      'workflow-trigger',
    ]);
    expect(CORE_NODE_INVENTORY.filter((node) => node.status !== 'excluded-deprecated')).toHaveLength(65);
    expect(CORE_NODE_INVENTORY.filter((node) => node.status === 'complete')).toHaveLength(65);
    expect(CORE_NODE_INVENTORY.filter((node) => node.status === 'pending')).toEqual([]);
  });

  it('publishes only reviewed complete nodes', () => {
    expect(COMPLETE_CORE_NODE_TYPES).toEqual(
      CORE_NODE_INVENTORY.filter((node) => node.status === 'complete').map((node) => node.type)
    );
    for (const type of COMPLETE_CORE_NODE_TYPES) {
      const node = NODE_CATALOG[type];
      expect(node, `${type} is marked complete but missing from the catalog`).toBeTruthy();
      expect(node.source?.commit, `${type} has no reviewed source commit`).toBe(SOURCE_COMMIT);
      expect(node.icon, `${type} has no active editor icon`).toMatch(/^\/node-icons\//);
      expect(existsSync(new URL(`../../apps/web/public${node.icon}`, import.meta.url)), `${type} icon file is missing`).toBe(true);
      expect(node.execute, `${type} must remain an authoring-only simulation`).toBeUndefined();
      inspectFields(type, node.params ?? []);
    }
  });
});

describe('cluster-node completion inventory', () => {
  it('tracks the linked root/sub-node scope without duplicates', () => {
    expect(CLUSTER_NODE_INVENTORY).toHaveLength(90);
    expect(CLUSTER_NODE_INVENTORY.filter((node) => node.clusterRole === 'root')).toHaveLength(22);
    expect(CLUSTER_NODE_INVENTORY.filter((node) => node.clusterRole === 'sub')).toHaveLength(68);
    expect(new Set(CLUSTER_NODE_INVENTORY.map((node) => node.type)).size).toBe(90);
    expect(new Set(CLUSTER_NODE_INVENTORY.map((node) => node.docsSlug)).size).toBe(90);
    expect(CLUSTER_NODE_INVENTORY.filter((node) => node.status === 'excluded-deprecated').map((node) => node.type)).toEqual([
      'embeddings-google-palm',
    ]);
  });

  it('publishes only reviewed complete cluster nodes as inert data', () => {
    expect(COMPLETE_CLUSTER_NODE_TYPES).toEqual(
      CLUSTER_NODE_INVENTORY.filter((node) => node.status === 'complete').map((node) => node.type)
    );
    for (const type of COMPLETE_CLUSTER_NODE_TYPES) {
      const node = NODE_CATALOG[type];
      expect(node, `${type} is marked complete but missing from the catalog`).toBeTruthy();
      expect(node.source?.commit, `${type} has no reviewed source commit`).toBe(SOURCE_COMMIT);
      expect(node.icon, `${type} has no active editor icon`).toMatch(/^\/node-icons\//);
      expect(existsSync(new URL(`../../apps/web/public${node.icon}`, import.meta.url)), `${type} icon file is missing`).toBe(true);
      expect(containsFunction(node), `${type} exports executable code`).toBe(false);
      expect(node.execute, `${type} must remain an authoring-only simulation`).toBeUndefined();
      expect(node.trigger, `${type} must not implement a trigger runtime`).toBeUndefined();
      expect(node.webhook, `${type} must not implement a webhook runtime`).toBeUndefined();
      expect(node.simulation?.voice, `${type} must not generate voice`).toBe(false);
      inspectFields(type, node.params ?? [], '', true);
    }
  });
});

describe('cluster-node batch 1 carries the current root-node authoring surface', () => {
  it('models AI Agent v3.1 ports, prompts, options, and dormant exclusions', () => {
    const node = NODE_CATALOG['ai-agent'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 3.1, n8nType: '@n8n/n8n-nodes-langchain.agent' });
    expect(node.fieldParity.recursiveVisibleFieldCount).toBe(27);
    expect(params.promptType.options.map(({ value }) => value)).toEqual(['auto', 'define']);
    expect(params.autoPrompt).toMatchObject({ readOnly: true, showWhen: { promptType: ['auto'] } });
    expect(node.connectorParity.withOutputParserAndFallback).toHaveLength(6);
  });

  it('models Basic LLM Chain v1.9 dynamic inputs and current fields', () => {
    const node = NODE_CATALOG['basic-llm-chain'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.9, n8nType: '@n8n/n8n-nodes-langchain.chainLlm' });
    expect(node.parameterParity).toMatchObject({ recursiveFieldCount: 18, dynamicInputShapeCount: 4 });
    expect(params.promptType.options.map(({ value }) => value)).toEqual(['auto', 'define']);
    expect(params.messages.fields).toHaveLength(6);
    expect(params.batching.fields.map(({ key }) => key)).toEqual(['batchSize', 'delayBetweenBatches']);
  });

  it('models Question and Answer Chain v1.7 prompt, retriever, and batching fields', () => {
    const node = NODE_CATALOG['question-answer-chain'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.7, n8nType: '@n8n/n8n-nodes-langchain.chainRetrievalQa' });
    expect(node.authoringParity.recursiveFieldCount).toBe(9);
    expect(node.portMetadata.requiredInputs).toEqual(['ai_languageModel', 'ai_retriever']);
    expect(params.promptType.options.map(({ value }) => value)).toEqual(['auto', 'define']);
    expect(params.options.fields.map(({ key }) => key)).toEqual(['systemPromptTemplate', 'batching']);
  });
});

describe('cluster-node batch 2 carries the current root-node authoring surface', () => {
  it('models Summarization Chain v2.1 inputs, methods, prompts, and batching', () => {
    const node = NODE_CATALOG['summarization-chain'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 2.1, n8nType: '@n8n/n8n-nodes-langchain.chainSummarization' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 17, dynamicInputShapeCount: 3 });
    expect(params.operationMode.options.map(({ value }) => value)).toEqual(['nodeInputJson', 'nodeInputBinary', 'documentLoader']);
    expect(params.options.fields.map(({ key }) => key)).toEqual(['binaryDataKey', 'summarizationMethodAndPrompts', 'batching']);
  });

  it('models Information Extractor v1.2 schema choices and attributes', () => {
    const node = NODE_CATALOG['information-extractor'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.2, n8nType: '@n8n/n8n-nodes-langchain.informationExtractor' });
    expect(node.authoringParity.recursiveFieldCount).toBe(15);
    expect(params.schemaType.options.map(({ value }) => value)).toEqual(['fromAttributes', 'fromJson', 'manual']);
    expect(params.attributes.fields.map(({ key }) => key)).toEqual(['attributeName', 'attributeType', 'attributeDescription', 'attributeRequired']);
  });

  it('models Text Classifier v1.1 fields and category-named outputs', () => {
    const node = NODE_CATALOG['text-classifier'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.1, n8nType: '@n8n/n8n-nodes-langchain.textClassifier' });
    expect(node.authoringParity.recursiveFieldCount).toBe(12);
    expect(params.categories.fields.map(({ key }) => key)).toEqual(['category', 'description']);
    expect(params.options.fields.map(({ key }) => key)).toEqual(['multiClass', 'fallback', 'systemPromptTemplate', 'enableAutoFixing', 'batching']);
    expect(node.dynamicOutputs).toMatchObject({ strategy: 'fixed-collection-labels', fallbackLabel: 'Other' });
  });
});

describe('cluster-node batch 3 carries the current root-node authoring surface', () => {
  it('models Sentiment Analysis v1.1 fields and comma-separated outputs', () => {
    const node = NODE_CATALOG['sentiment-analysis'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.1, n8nType: '@n8n/n8n-nodes-langchain.sentimentAnalysis' });
    expect(node.authoringParity.recursiveFieldCount).toBe(10);
    expect(params.options.fields.map(({ key }) => key)).toEqual(['categories', 'systemPromptTemplate', 'includeDetailedResults', 'enableAutoFixing', 'batching']);
    expect(node.dynamicOutputs).toMatchObject({ strategy: 'comma-separated-labels', filterEmptyLabels: false });
  });

  it('models hidden LangChain Code v1 fields and typed connection rows as inert data', () => {
    const node = NODE_CATALOG['langchain-code'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.code', hidden: true });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 10, connectorTypeCount: 10 });
    expect(params.inputs.fields.map(({ key }) => key)).toEqual(['inputType', 'maxConnections', 'maxConnectionsRequired']);
    expect(params.outputs.fields.map(({ key }) => key)).toEqual(['outputType']);
    expect(params.code.fields.every(({ value }) => typeof value === 'string')).toBe(true);
  });

  it('models Microsoft Agent 365 Trigger v1.1 without unreachable fallback controls', () => {
    const node = NODE_CATALOG['microsoft-agent-365-trigger'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.1, n8nType: '@n8n/n8n-nodes-langchain.microsoftAgent365Trigger', category: 'trigger' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 11, microsoftMcpServerCount: 20 });
    expect(params.needsFallback).toBeUndefined();
    expect(params.includeTools.options).toHaveLength(20);
    expect(node.credentialUiMetadata[0].fields.every(({ locked }) => locked)).toBe(true);
    expect(node.portVariants[0].inputs.map(({ type }) => type)).toEqual(['ai_languageModel', 'ai_memory', 'ai_tool', 'ai_outputParser']);
  });
});

describe('cluster-node batch 4 carries the current vector-store authoring surface', () => {
  it('models Azure AI Search v1.3 provider fields and all five modes', () => {
    const node = NODE_CATALOG['azure-ai-search-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStoreAzureAISearch' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 23, dynamicPortShapeCount: 8, credentialFieldCount: 2 });
    expect(params.mode.options.map(({ value }) => value)).toEqual(['load', 'insert', 'retrieve', 'retrieve-as-tool', 'update']);
    expect(params.insertOptions.fields.map(({ key }) => key)).toEqual(['clearIndex', 'metadataKeysToInsert']);
  });

  it('models Simple Vector Store v1.3 memory lookup and four supported modes', () => {
    const node = NODE_CATALOG['simple-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStoreInMemory' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 14, operationModeCount: 4, dynamicPortShapeCount: 7 });
    expect(params.memoryKey).toMatchObject({ kind: 'resourceLocator', locked: true });
    expect(params.mode.options.map(({ value }) => value)).toEqual(['load', 'insert', 'retrieve', 'retrieve-as-tool']);
  });

  it('models Milvus Vector Store v1.3 credentials, collection lookup, and ports', () => {
    const node = NODE_CATALOG['milvus-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStoreMilvus' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 13, operationCount: 4, credentialEditorFieldCount: 3 });
    expect(params.milvusCollection).toMatchObject({ kind: 'resourceLocator', locked: true });
    expect(node.portParity.variantCount).toBe(7);
  });
});

describe('cluster-node batch 5 carries the current database vector-store surfaces', () => {
  it('models MongoDB Atlas v1.3 collection, index, namespace, and filters', () => {
    const node = NODE_CATALOG['mongodb-atlas-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStoreMongoDBAtlas' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 32, credentialEditorFieldCount: 12, dynamicPortShapeCount: 8 });
    expect(params.mongoCollection).toMatchObject({ kind: 'resourceLocator', locked: true });
    expect(params.insertOptions.fields.map(({ key }) => key)).toEqual(['clearNamespace', 'namespace']);
  });

  it('models the live Postgres PGVector v1.3 label and nested collection settings', () => {
    const node = NODE_CATALOG['pgvector-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ label: 'Postgres PGVector Store', n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStorePGVector' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 49, credentialEditorFieldCount: 16 });
    expect(params.insertOptions.fields.map(({ key }) => key)).toEqual(['collection', 'columnNames']);
    expect(params.loadToolOptions.fields.map(({ key }) => key)).toEqual(['distanceStrategy', 'collection', 'columnNames', 'metadata']);
  });

  it('models Oracle Database Vector Store v1.3 distances and credential schema', () => {
    const node = NODE_CATALOG['oracle-database-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStoreOracleDBVector' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 22, credentialEditorFieldCount: 20, distanceStrategyCount: 6 });
    expect(params.loadAndToolOptions.fields[0].options.map(({ value }) => value)).toEqual(['COSINE', 'DOT', 'EUCLIDEAN', 'MANHATTAN', 'EUCLIDEAN_SQUARED', 'HAMMING']);
    expect(node.portParity.variantCount).toBe(7);
  });
});

describe('cluster-node batch 6 carries the current hosted vector-store surfaces', () => {
  it('models Chroma v1.3 authentication branches and collection lookup', () => {
    const node = NODE_CATALOG['chroma-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStoreChromaDB' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 23, credentialEditorFieldCount: 8, dynamicFieldCount: 3 });
    expect(params.authentication.options.map(({ value }) => value)).toEqual(['chromaSelfHostedApi', 'chromaCloudApi']);
    expect(params.chromaCollection).toMatchObject({ kind: 'resourceLocator', locked: true });
  });

  it('models Pinecone v1.3 namespace, metadata, update, and index lookup', () => {
    const node = NODE_CATALOG['pinecone-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStorePinecone' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldOccurrenceCount: 25, credentialEditorFieldCount: 1, operationCount: 5 });
    expect(params.pineconeIndex).toMatchObject({ kind: 'resourceLocator', locked: true });
    expect(params.insertOptions.fields.map(({ key }) => key)).toEqual(['clearNamespace', 'pineconeNamespace']);
  });

  it('models Qdrant v1.3 JSON options and collection lookup', () => {
    const node = NODE_CATALOG['qdrant-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStoreQdrant' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 23, credentialEditorFieldCount: 2, operationCount: 4 });
    expect(params.qdrantCollection).toMatchObject({ kind: 'resourceLocator', locked: true });
    expect(params.insertOptions.fields.map(({ key }) => key)).toEqual(['collectionConfig', 'contentPayloadKey', 'metadataPayloadKey']);
  });
});

describe('cluster-node batch 7 carries the remaining current hosted vector-store surfaces', () => {
  it('models Redis v1.3 index lookup, native option keys, credentials, and update mode', () => {
    const node = NODE_CATALOG['redis-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStoreRedis' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 31, credentialEditorFieldCount: 7, operationCount: 5 });
    expect(params.redisIndex).toMatchObject({ kind: 'resourceLocator', locked: true });
    expect(params.insertOptions.fields.map(({ key }) => key)).toEqual(['keyPrefix', 'overwriteDocuments', 'metadataKey', 'contentKey', 'vectorKey', 'ttl']);
    expect(node.portVariants).toHaveLength(8);
  });

  it('models Supabase v1.3 table lookup and native query-name collections', () => {
    const node = NODE_CATALOG['supabase-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStoreSupabase' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldOccurrenceCount: 26, credentialEditorFieldCount: 2, operationCount: 5 });
    expect(params.tableName).toMatchObject({ kind: 'resourceLocator', locked: true });
    expect(params.insertOptions.fields.map(({ key }) => key)).toEqual(['queryName']);
    expect(params.loadToolOptions.fields.map(({ key }) => key)).toEqual(['queryName', 'metadata']);
  });

  it('models Weaviate v1.3 hybrid-search fields without the unsupported update mode', () => {
    const node = NODE_CATALOG['weaviate-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStoreWeaviate' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 54, credentialEditorFieldCount: 9, operationCount: 4 });
    expect(params.weaviateCollection).toMatchObject({ kind: 'resourceLocator', locked: true });
    expect(params.insertOptions.fields.map(({ key }) => key)).toEqual(['tenant', 'textKey', 'skip_init_checks', 'timeout_init', 'timeout_insert', 'timeout_query', 'proxy_grpc', 'clearStore']);
    expect(params.loadAndToolOptions.fields.map(({ key }) => key)).toEqual(['searchFilterJson', 'metadataKeys', 'hybridQuery', 'hybridExplainScore', 'fusionType', 'autoCutLimit', 'alpha', 'queryProperties', 'maxVectorDistance', 'tenant', 'textKey', 'skip_init_checks', 'timeout_init', 'timeout_insert', 'timeout_query', 'proxy_grpc']);
    expect(params.mode.options.map(({ value }) => value)).toEqual(['load', 'insert', 'retrieve', 'retrieve-as-tool']);
  });
});

describe('cluster-node batch 8 carries the final root node and current document loaders', () => {
  it('models the hidden deprecated Zep v1.3 factory node without the split legacy nodes', () => {
    const node = NODE_CATALOG['zep-vector-store'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.vectorStoreZep', hidden: true, deprecated: true });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 25, credentialEditorFieldCount: 4, operationCount: 4 });
    expect(params.mode.options.map(({ value }) => value)).toEqual(['load', 'insert', 'retrieve', 'retrieve-as-tool']);
    expect(params.insertOptions.fields.map(({ key }) => key)).toEqual(['embeddingDimensions', 'isAutoEmbedded']);
  });

  it('models Default Data Loader v1.1 format, metadata, and text-splitter branches', () => {
    const node = NODE_CATALOG['default-data-loader'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.1, n8nType: '@n8n/n8n-nodes-langchain.documentDefaultDataLoader' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 16, credentialEditorFieldCount: 0 });
    expect(params.loader.options.map(({ value }) => value)).toEqual(['auto', 'csvLoader', 'docxLoader', 'epubLoader', 'jsonLoader', 'pdfLoader', 'textLoader']);
    expect(params.options.fields.map(({ key }) => key)).toEqual(['pointers', 'separator', 'column', 'splitPages', 'metadata']);
    expect(node.portVariants).toHaveLength(2);
  });

  it('models GitHub Document Loader v1.1 credentials, options, and custom splitter input', () => {
    const node = NODE_CATALOG['github-document-loader'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.1, n8nType: '@n8n/n8n-nodes-langchain.documentGithubLoader', hidden: true });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 8, credentialEditorFieldCount: 3 });
    expect(params.additionalOptions.fields.map(({ key }) => key)).toEqual(['recursive', 'ignorePaths']);
    expect(params.textSplittingMode.options.map(({ value }) => value)).toEqual(['simple', 'custom']);
    expect(node.portVariants[1].inputs).toEqual([expect.objectContaining({ type: 'ai_textSplitter', required: true, maxConnections: 1 })]);
  });
});

describe('cluster-node batch 9 carries the first current embedding-model surfaces', () => {
  it('models AWS Bedrock v1 auth branches, locked model discovery, and request options', () => {
    const node = NODE_CATALOG['embeddings-aws-bedrock'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.embeddingsAwsBedrock' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 9, credentialEditorFieldCount: 33, regionOptionCount: 38 });
    expect(params.authentication.options.map(({ value }) => value)).toEqual(['iam', 'assumeRole']);
    expect(params.model).toMatchObject({ kind: 'select', locked: true, options: [] });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['additionalModelRequestFields', 'maxRetries', 'timeout']);
  });

  it('models Azure OpenAI v1 deployment text and all four native request options', () => {
    const node = NODE_CATALOG['embeddings-azure-openai'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.embeddingsAzureOpenAi' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 8, credentialEditorFieldCount: 4, dynamicModelLookupCount: 0 });
    expect(params.model).toMatchObject({ kind: 'text', dynamic: false });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['batchSize', 'stripNewLines', 'timeout', 'dimensions']);
    expect(params.options.fields[3].options.map(({ value }) => value)).toEqual([256, 512, 1024, 1536, 3072]);
  });

  it('models Cohere v1 with the exact static seven-model list', () => {
    const node = NODE_CATALOG['embeddings-cohere'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.embeddingsCohere' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 4, credentialEditorFieldCount: 2, modelOptionCount: 7 });
    expect(params.modelName.value).toBe('embed-english-v2.0');
    expect(params.modelName.options).toHaveLength(7);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_embedding', label: 'Embeddings' })]);
  });
});

describe('cluster-node batch 10 carries the Google and Hugging Face embedding surfaces', () => {
  it('models Google Gemini v1 with locked routed model discovery', () => {
    const node = NODE_CATALOG['embeddings-google-gemini'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.embeddingsGoogleGemini' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 4, credentialEditorFieldCount: 2, dynamicFieldCount: 2 });
    expect(params.modelName).toMatchObject({ value: 'models/gemini-embedding-001', locked: true, options: [] });
    expect(node.methods.loadOptions.modelName.response).toMatchObject({ rootProperty: 'models', sortBy: 'name' });
  });

  it('models Google Vertex v1 project lookup, model text, and imported location choices', () => {
    const node = NODE_CATALOG['embeddings-google-vertex'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.embeddingsGoogleVertex' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 6, credentialEditorFieldCount: 8, credentialRegionOptionCount: 44 });
    expect(params.projectId).toMatchObject({ kind: 'resourceLocator', locked: true });
    expect(params.modelName).toMatchObject({ kind: 'text', value: 'text-embedding-005', dynamic: false });
    expect(params.location.options.map(({ value }) => value)).toEqual(['', 'global', 'eu', 'us']);
  });

  it('models Hugging Face v1 freeform model and all pinned provider policies', () => {
    const node = NODE_CATALOG['embeddings-huggingface-inference'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.embeddingsHuggingFaceInference' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 7, credentialEditorFieldCount: 1, providerOptionCount: 18 });
    expect(params.modelName.value).toBe('sentence-transformers/distilbert-base-nli-mean-tokens');
    expect(params.options.fields.map(({ key }) => key)).toEqual(['endpointUrl', 'provider']);
    expect(params.options.fields[1].options).toHaveLength(18);
  });
});

describe('cluster-node batch 11 carries the local and cloud routed embedding surfaces', () => {
  it('models Lemonade v1 with the exact required routed model source', () => {
    const node = NODE_CATALOG['embeddings-lemonade'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.embeddingsLemonade' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 3, credentialEditorFieldCount: 2, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ required: true, locked: true, options: [] });
    expect(node.methods.loadOptions.model).toMatchObject({ request: { method: 'GET', url: '/models' } });
  });

  it('models Mistral Cloud v1 routed model discovery and native options', () => {
    const node = NODE_CATALOG['embeddings-mistral-cloud'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.embeddingsMistralCloud' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 6, credentialEditorFieldCount: 1, dynamicModelLookupCount: 1 });
    expect(params.model).toMatchObject({ value: 'mistral-embed', locked: true });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['batchSize', 'stripNewLines']);
  });

  it('models Ollama v1 with the exact required model routing and no dormant options', () => {
    const node = NODE_CATALOG['embeddings-ollama'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.embeddingsOllama' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 3, credentialEditorFieldCount: 2, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ value: 'llama3.2', required: true, locked: true, options: [] });
    expect(node.excludedDormantAuthoring[0].sourceExport).toBe('ollamaOptions');
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_embedding', label: 'Embeddings' })]);
  });
});

describe('cluster-node batch 12 closes embeddings and starts current chat models', () => {
  it('models current OpenAI v1.2 fields without the historical node-level Base URL', () => {
    const node = NODE_CATALOG['embeddings-openai'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.2, n8nType: '@n8n/n8n-nodes-langchain.embeddingsOpenAi' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 9, credentialEditorFieldCount: 6, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ value: 'text-embedding-3-small', locked: true, options: [] });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['dimensions', 'batchSize', 'stripNewLines', 'timeout', 'encodingFormat']);
  });

  it('models Oracle Database v1 credentials and locked searchable ONNX model', () => {
    const node = NODE_CATALOG['embeddings-oracle-database'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.embeddingsOracleDb', defaultName: 'Embeddings ONNX' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 3, credentialEditorFieldCount: 20, dynamicResourceLocatorCount: 1 });
    expect(params.model).toMatchObject({ kind: 'resourceLocator', locked: true, value: { __rl: true, mode: 'list', value: 'ALL_MINILM_L12_V2' } });
    expect(node.credentialUiMetadata[0].fields.find(({ key }) => key === 'privilege').options).toHaveLength(8);
  });

  it('models Qwen Cloud v1 credentials, routed model, and eight native options', () => {
    const node = NODE_CATALOG['qwen-cloud-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatAlibabaCloud' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 13, credentialEditorFieldCount: 4, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ value: 'qwen-plus', locked: true, options: [] });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['frequencyPenalty', 'maxTokens', 'responseFormat', 'presencePenalty', 'temperature', 'timeout', 'maxRetries', 'topP']);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_languageModel', label: 'Model' })]);
  });
});

describe('cluster-node batch 13 carries current Anthropic, Bedrock, and Azure chat models', () => {
  it('models Anthropic v1.5 thinking modes and locked model discovery', () => {
    const node = NODE_CATALOG['anthropic-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.5, n8nType: '@n8n/n8n-nodes-langchain.lmChatAnthropic' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 13, credentialEditorFieldCount: 5, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ kind: 'resourceLocator', locked: true, value: { __rl: true, mode: 'list', value: 'claude-sonnet-4-6' } });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['maxTokensToSample', 'temperature', 'topK', 'topP', 'thinkingMode', 'effortOpus', 'effortNonOpus', 'thinkingBudget', 'streaming']);
  });

  it('models AWS Bedrock v1.2 combined model discovery and guardrails', () => {
    const node = NODE_CATALOG['aws-bedrock-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.2, n8nType: '@n8n/n8n-nodes-langchain.lmChatAwsBedrock' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 17, credentialEditorFieldCount: 33, dynamicFieldCount: 3 });
    expect(params.model).toMatchObject({ value: '', locked: true, options: [] });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['maxTokensToSample', 'temperature', 'topP', 'maxRetries', 'timeout', 'additionalModelRequestFields', 'latency', 'guardrail']);
    expect(params.options.fields.find(({ key }) => key === 'guardrail').fields.map(({ sourceN8nKey }) => sourceN8nKey)).toEqual(['guardrailIdentifier', 'guardrailVersion', 'trace']);
  });

  it('models Azure OpenAI v1 authentication branches and completion controls', () => {
    const node = NODE_CATALOG['azure-openai-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatAzureOpenAi' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 15, credentialEditorFieldCount: 25, credentialSelectorCount: 2 });
    expect(params.authentication.options.map(({ value }) => value)).toEqual(['azureOpenAiApi', 'azureEntraCognitiveServicesOAuth2Api']);
    expect(params.model).toMatchObject({ value: '', required: true, remoteLookup: false });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['frequencyPenalty', 'maxTokens', 'responseFormat', 'presencePenalty', 'temperature', 'timeout', 'maxRetries', 'topP']);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_languageModel', label: 'Model' })]);
  });
});

describe('cluster-node batch 14 carries current Cohere, DeepSeek, and Gemini chat models', () => {
  it('models Cohere v1 credentials, routed model discovery, and two options', () => {
    const node = NODE_CATALOG['cohere-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatCohere' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 6, credentialEditorFieldCount: 2, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ value: 'command-a-03-2025', locked: true, options: [] });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['temperature', 'maxRetries']);
  });

  it('models DeepSeek v1 model routing, JSON notice, and eight options', () => {
    const node = NODE_CATALOG['deepseek-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatDeepSeek' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 13, credentialEditorFieldCount: 2, dynamicFieldCount: 2 });
    expect(params.jsonResponseNotice.showWhen).toEqual({ 'options.responseFormat': ['json_object'] });
    expect(params.model).toMatchObject({ value: 'deepseek-chat', locked: true, options: [] });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['frequencyPenalty', 'maxTokens', 'responseFormat', 'presencePenalty', 'temperature', 'timeout', 'maxRetries', 'topP']);
  });

  it('models Google Gemini v1.1 generation controls and native safety rows', () => {
    const node = NODE_CATALOG['google-gemini-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    const safety = params.options.fields.find(({ key }) => key === 'safetySettings');
    expect(node).toMatchObject({ n8nVersion: 1.1, n8nType: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 11, credentialEditorFieldCount: 2, dynamicFieldCount: 2 });
    expect(params.modelName).toMatchObject({ value: 'models/gemini-3-flash-preview', locked: true, options: [] });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['maxOutputTokens', 'temperature', 'topK', 'topP', 'safetySettings']);
    expect(safety).toMatchObject({ collectionKey: 'values', multiple: true });
    expect(safety.fields.map(({ sourceN8nKey }) => sourceN8nKey)).toEqual(['category', 'threshold']);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_languageModel', label: 'Model' })]);
  });
});

describe('cluster-node batch 15 carries current Vertex, Groq, and Lemonade chat models', () => {
  it('models Google Vertex v1 projects, regions, safety, and thinking budget', () => {
    const node = NODE_CATALOG['google-vertex-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    const safety = params.options.fields.find(({ key }) => key === 'safetySettings');
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatGoogleVertex' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 14, credentialEditorFieldCount: 8, credentialRegionOptionCount: 44, dynamicFieldCount: 2 });
    expect(params.projectId).toMatchObject({ kind: 'resourceLocator', required: true, locked: true });
    expect(params.location.options.map(({ value }) => value)).toEqual(['', 'global', 'eu', 'us']);
    expect(params.options.fields.map(({ key }) => key)).toEqual(['maxOutputTokens', 'temperature', 'topK', 'topP', 'safetySettings', 'thinkingBudget']);
    expect(safety.fields.map(({ sourceN8nKey }) => sourceN8nKey)).toEqual(['category', 'threshold']);
  });

  it('models Groq v1 filtered model discovery and two completion options', () => {
    const node = NODE_CATALOG['groq-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatGroq' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 6, credentialEditorFieldCount: 1, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ value: 'llama3-8b-8192', locked: true, options: [] });
    expect(params.model.dynamicOptions.filterExpression).toContain('$responseItem.active === true');
    expect(params.options.fields.map(({ key }) => key)).toEqual(['maxTokensToSample', 'temperature']);
  });

  it('models Lemonade v1 required model discovery and six native options', () => {
    const node = NODE_CATALOG['lemonade-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatLemonade' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 10, credentialEditorFieldCount: 2, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ value: '', required: true, locked: true, options: [] });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['temperature', 'topP', 'frequencyPenalty', 'presencePenalty', 'maxTokens', 'stop']);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_languageModel', label: 'Model' })]);
  });
});

describe('cluster-node batch 16 carries current MiniMax, Mistral, and Moonshot chat models', () => {
  it('models MiniMax v1 static models, region credentials, and reasoning visibility', () => {
    const node = NODE_CATALOG['minimax-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatMinimax' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 10, credentialEditorFieldCount: 3, dynamicFieldCount: 1, modelOptionCount: 7 });
    expect(params.model).toMatchObject({ value: 'MiniMax-M2.7' });
    expect(params.model.options.map(({ value }) => value)).toContain('MiniMax-M2.7-highspeed');
    expect(params.options.fields.map(({ key }) => key)).toEqual(['hideThinking', 'maxTokens', 'temperature', 'timeout', 'maxRetries', 'topP']);
  });

  it('models Mistral Cloud v1 filtered models and six request options', () => {
    const node = NODE_CATALOG['mistral-cloud-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatMistralCloud' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 10, credentialEditorFieldCount: 1, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ value: 'mistral-small', locked: true, options: [] });
    expect(params.model.dynamicOptions.filterExpression).toContain("!$responseItem.id.includes('embed')");
    expect(params.options.fields.map(({ key }) => key)).toEqual(['maxTokens', 'temperature', 'maxRetries', 'topP', 'safeMode', 'randomSeed']);
  });

  it('models Moonshot Kimi current v1.1 model and eight completion options', () => {
    const node = NODE_CATALOG['moonshot-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.1, n8nType: '@n8n/n8n-nodes-langchain.lmChatMoonshot', label: 'Moonshot Kimi Chat Model' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 13, credentialEditorFieldCount: 3, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ value: 'kimi-k2.6', locked: true, options: [] });
    expect(params.jsonResponseNotice.showWhen).toEqual({ 'options.responseFormat': ['json_object'] });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['frequencyPenalty', 'maxTokens', 'responseFormat', 'presencePenalty', 'temperature', 'timeout', 'maxRetries', 'topP']);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_languageModel', label: 'Model' })]);
  });
});

describe('cluster-node batch 17 carries current NVIDIA, Ollama, and OpenAI chat models', () => {
  it('models NVIDIA Nemotron v1 allow-listed models and eight completion options', () => {
    const node = NODE_CATALOG['nvidia-nemotron-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatNvidia' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 13, credentialEditorFieldCount: 2, dynamicFieldCount: 2, modelOptionCount: 8 });
    expect(params.model).toMatchObject({ value: 'nvidia/llama-3.3-nemotron-super-49b-v1', locked: true });
    expect(params.model.options).toHaveLength(8);
    expect(params.options.fields.map(({ key }) => key)).toEqual(['frequencyPenalty', 'maxTokens', 'responseFormat', 'presencePenalty', 'temperature', 'timeout', 'maxRetries', 'topP']);
  });

  it('models Ollama v1 required model routing and all 20 shared options', () => {
    const node = NODE_CATALOG['ollama-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatOllama' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 24, credentialEditorFieldCount: 2, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ value: 'llama3.2', required: true, locked: true, options: [] });
    expect(params.options.fields.map(({ key }) => key)).toEqual(['think', 'temperature', 'topK', 'topP', 'frequencyPenalty', 'keepAlive', 'lowVram', 'mainGpu', 'numBatch', 'numCtx', 'numGpu', 'numPredict', 'numThread', 'penalizeNewline', 'presencePenalty', 'repeatPenalty', 'useMLock', 'useMMap', 'vocabOnly', 'format']);
    expect(node.dormantExportAudit.dormantExports).toEqual([]);
  });

  it('models OpenAI current v1.3 Responses API, tools, formats, and prompts', () => {
    const node = NODE_CATALOG['openai-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    const options = Object.fromEntries(params.options.fields.map((field) => [field.key, field]));
    expect(node).toMatchObject({ n8nVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.lmChatOpenAi' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 48, credentialEditorFieldCount: 6, dynamicFieldCount: 2, currentDirectOptionFieldCount: 18, builtInToolFieldCount: 11 });
    expect(params.model).toMatchObject({ kind: 'resourceLocator', required: true, locked: true, value: { __rl: true, mode: 'list', value: 'gpt-5-mini' } });
    expect(params.responsesApiEnabled.value).toBe(true);
    expect(params.builtInTools.fields.map(({ key }) => key)).toEqual(['webSearch', 'fileSearch', 'codeInterpreter']);
    expect(options.textFormat).toMatchObject({ kind: 'fixedCollection', collectionKey: 'textOptions' });
    expect(options.textFormat.fields.map(({ key }) => key)).toEqual(['type', 'verbosity', 'name', 'requiredNotice', 'schema', 'description', 'strict']);
    expect(options.promptConfig).toMatchObject({ kind: 'fixedCollection', collectionKey: 'promptOptions' });
    expect(options.promptConfig.fields.map(({ key }) => key)).toEqual(['promptId', 'version', 'variables']);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_languageModel', label: 'Model' })]);
  });
});

describe('cluster-node batch 18 carries current OpenRouter, Vercel, and xAI chat models', () => {
  const optionKeys = (node) => node.params.find(({ key }) => key === 'options').fields.map(({ key }) => key);

  it('models OpenRouter v1 model routing and all eight completion options', () => {
    const node = NODE_CATALOG['openrouter-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatOpenRouter' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 13, credentialEditorFieldCount: 2, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ value: 'openai/gpt-4.1-mini', locked: true, options: [] });
    expect(params.jsonResponseNotice.showWhen).toEqual({ 'options.responseFormat': ['json_object'] });
    expect(optionKeys(node)).toEqual(['frequencyPenalty', 'maxTokens', 'responseFormat', 'presencePenalty', 'temperature', 'timeout', 'maxRetries', 'topP']);
  });

  it('models Vercel AI Gateway v1 credentials, model routing, and eight options', () => {
    const node = NODE_CATALOG['vercel-ai-gateway-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatVercelAiGateway' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 13, credentialEditorFieldCount: 2, dynamicFieldCount: 2 });
    expect(params.model).toMatchObject({ value: 'openai/gpt-4o', locked: true, options: [] });
    expect(node.credentialUiMetadata[0].test.request).toMatchObject({ method: 'POST', url: '/chat/completions' });
    expect(optionKeys(node)).toEqual(['frequencyPenalty', 'maxTokens', 'responseFormat', 'presencePenalty', 'temperature', 'timeout', 'maxRetries', 'topP']);
  });

  it('models xAI Grok v1 priority, reasoning, and eight shared options', () => {
    const node = NODE_CATALOG['xai-grok-chat-model'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    const options = Object.fromEntries(params.options.fields.map((field) => [field.key, field]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmChatXAiGrok' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 15, credentialEditorFieldCount: 2, dynamicFieldCount: 2, currentDirectOptionFieldCount: 10 });
    expect(params.model).toMatchObject({ value: 'grok-2-vision-1212', locked: true, options: [] });
    expect(optionKeys(node)).toEqual(['frequencyPenalty', 'maxTokens', 'responseFormat', 'presencePenalty', 'temperature', 'timeout', 'maxRetries', 'topP', 'priority', 'reasoning']);
    expect(options.priority.value).toBe(false);
    expect(options.reasoning.options.map(({ value }) => value)).toEqual(['none', 'low', 'medium', 'high']);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_languageModel', label: 'Model' })]);
  });
});

describe('cluster-node batch 19 carries current Cohere, Lemonade, and Ollama completion models', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));
  const optionKeys = (type) => params(type).options.fields.map(({ key }) => key);

  it('models Cohere v1 with its native plain-text model option', () => {
    const node = NODE_CATALOG['cohere-model'];
    const options = Object.fromEntries(params('cohere-model').options.fields.map((field) => [field.key, field]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmCohere' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 6, credentialEditorFieldCount: 2, dynamicFieldCount: 1 });
    expect(optionKeys('cohere-model')).toEqual(['maxTokens', 'model', 'temperature']);
    expect(options.maxTokens).toMatchObject({ value: 250, maxValue: 32768 });
    expect(options.model).toMatchObject({ kind: 'text', value: '' });
    expect(options.temperature).toMatchObject({ value: 0, minValue: 0, maxValue: 1 });
  });

  it('models Lemonade v1 with the shared required model and six options', () => {
    const node = NODE_CATALOG['lemonade-model'];
    const p = params('lemonade-model');
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmLemonade' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 10, credentialEditorFieldCount: 2, dynamicFieldCount: 2, directOptionFieldCount: 6 });
    expect(p.model).toMatchObject({ value: '', required: true, locked: true, options: [] });
    expect(optionKeys('lemonade-model')).toEqual(['temperature', 'topP', 'frequencyPenalty', 'presencePenalty', 'maxTokens', 'stop']);
    expect(node.params).toBe(NODE_CATALOG['lemonade-chat-model'].params);
  });

  it('models Ollama v1 with all 20 live shared options and no dormant exports', () => {
    const node = NODE_CATALOG['ollama-model'];
    const p = params('ollama-model');
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmOllama' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 24, credentialEditorFieldCount: 2, dynamicFieldCount: 2, currentDirectOptionFieldCount: 20 });
    expect(p.model).toMatchObject({ value: 'llama3.2', required: true, locked: true, options: [] });
    expect(optionKeys('ollama-model')).toEqual(optionKeys('ollama-chat-model'));
    expect(node.dormantExportAudit.dormantExports).toEqual([]);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_languageModel', label: 'Model' })]);
  });
});

describe('cluster-node batch 20 carries Hugging Face completion and current memory surfaces', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models Hugging Face Inference v1 freeform model and seven options', () => {
    const node = NODE_CATALOG['huggingface-inference-model'];
    const p = params('huggingface-inference-model');
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.lmOpenHuggingFaceInference' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 11, credentialEditorFieldCount: 1, dynamicFieldCount: 1, optionCollectionFieldCount: 7 });
    expect(p.model).toMatchObject({ kind: 'expression', value: 'mistralai/Mistral-Nemo-Base-2407', remoteLookup: false });
    expect(p.options.fields.map(({ key }) => key)).toEqual(['endpointUrl', 'frequencyPenalty', 'maxTokens', 'presencePenalty', 'temperature', 'topK', 'topP']);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_languageModel', label: 'Model' })]);
  });

  it('models Chat Memory Manager v1.1 modes, message rows, and capped memory input', () => {
    const node = NODE_CATALOG['chat-memory-manager'];
    const p = params('chat-memory-manager');
    expect(node).toMatchObject({ n8nVersion: 1.1, n8nType: '@n8n/n8n-nodes-langchain.memoryManager' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 11, credentialEditorFieldCount: 0, dynamicFieldCount: 0, conditionalFieldCount: 6 });
    expect(p.mode.options.map(({ value }) => value)).toEqual(['load', 'insert', 'delete']);
    expect(p.messages).toMatchObject({ kind: 'fixedCollection', collectionKey: 'messageValues', multiple: true, showWhen: { mode: ['insert'] } });
    expect(p.messages.fields.map(({ sourceN8nKey }) => sourceN8nKey)).toEqual(['type', 'message', 'hideFromUI']);
    expect(node.inputs).toEqual([
      expect.objectContaining({ type: 'main' }),
      expect.objectContaining({ type: 'ai_memory', label: 'Memory', required: true, maxConnections: 1 }),
    ]);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'main' })]);
  });

  it('models Simple Memory current v1.4 session variants and historical exclusions', () => {
    const node = NODE_CATALOG['simple-memory'];
    const p = params('simple-memory');
    expect(node).toMatchObject({ n8nVersion: 1.4, n8nType: '@n8n/n8n-nodes-langchain.memoryBufferWindow' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 7, credentialEditorFieldCount: 0, dynamicFieldCount: 0, helperGeneratedFieldCount: 5 });
    expect(p.sessionIdType.options.map(({ value }) => value)).toEqual(['fromInput', 'customKey']);
    expect(p.sessionKeyFromPreviousNode).toMatchObject({ n8nKey: 'sessionKey', kind: 'expression', readOnly: true, showWhen: { sessionIdType: ['fromInput'] } });
    expect(p.definedSessionKey).toMatchObject({ n8nKey: 'sessionKey', showWhen: { sessionIdType: ['customKey'] } });
    expect(node.excludedHistoricalAuthoring.map(({ sourceVersionCondition }) => sourceVersionCondition)).toEqual(['@version = 1', '@version = 1.1']);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_memory', label: 'Memory' })]);
  });
});

describe('cluster-node batch 21 carries current Motorhead, MongoDB, and Redis memory surfaces', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models hidden deprecated Motorhead current v1.4 and its session variants', () => {
    const node = NODE_CATALOG.motorhead;
    const p = params('motorhead');
    expect(node).toMatchObject({ n8nVersion: 1.4, n8nType: '@n8n/n8n-nodes-langchain.memoryMotorhead', hidden: true, deprecated: true });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 7, credentialEditorFieldCount: 3, dynamicFieldCount: 1 });
    expect(p.sessionIdType.options.map(({ value }) => value)).toEqual(['fromInput', 'customKey']);
    expect(p.deprecationNotice.label).toContain('no longer maintained');
    expect(node.excludedHistoricalAuthoring.map(({ sourceVersionCondition }) => sourceVersionCondition)).toEqual(['@version = 1', '@version = 1.1']);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_memory', label: 'Memory' })]);
  });

  it('models MongoDB Chat Memory v1.1 and all 12 credential fields', () => {
    const node = NODE_CATALOG['mongodb-chat-memory'];
    const p = params('mongodb-chat-memory');
    expect(node).toMatchObject({ n8nVersion: 1.1, n8nType: '@n8n/n8n-nodes-langchain.memoryMongoDbChat' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 9, credentialEditorFieldCount: 12, dynamicFieldCount: 1, totalAuthoringFieldCount: 21 });
    expect(node.credentialUiMetadata[0].fields.map(({ key }) => key)).toEqual(['configurationType', 'connectionString', 'host', 'database', 'user', 'password', 'port', 'tls', 'ca', 'cert', 'key', 'passphrase']);
    expect(p.collectionName.value).toBe('n8n_chat_histories');
    expect(p.sessionKeyFromPreviousNode).toMatchObject({ readOnly: true, showWhen: { sessionIdType: ['fromInput'] } });
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_memory', label: 'Memory' })]);
  });

  it('models Redis Chat Memory current v1.6 credentials, TTL, and context window', () => {
    const node = NODE_CATALOG['redis-chat-memory'];
    const p = params('redis-chat-memory');
    expect(node).toMatchObject({ n8nVersion: 1.6, n8nType: '@n8n/n8n-nodes-langchain.memoryRedisChat' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 8, credentialEditorFieldCount: 7, dynamicFieldCount: 1, totalAuthoringFieldCount: 15 });
    expect(node.credentialUiMetadata[0].fields.map(({ key }) => key)).toEqual(['password', 'user', 'host', 'port', 'database', 'ssl', 'disableTlsVerification']);
    expect(p.sessionTTL.value).toBe(0);
    expect(p.contextWindowLength).toMatchObject({ value: 5, sourceVersionCondition: '@version >= 1.3' });
    expect(node.excludedHistoricalAuthoring.map(({ sourceVersionCondition }) => sourceVersionCondition)).toEqual(['@version = 1', '@version = 1.1']);
  });
});

describe('cluster-node batch 22 carries current Postgres, Xata, and Zep memory surfaces', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models Postgres Chat Memory v1.4 with all 16 credential fields', () => {
    const node = NODE_CATALOG['postgres-chat-memory'];
    const p = params('postgres-chat-memory');
    expect(node).toMatchObject({ n8nVersion: 1.4, n8nType: '@n8n/n8n-nodes-langchain.memoryPostgresChat' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 8, credentialEditorFieldCount: 16, importedCredentialFieldCount: 8, dynamicFieldCount: 1, totalAuthoringFieldCount: 24 });
    expect(node.credentialUiMetadata[0].fields.map(({ key }) => key)).toEqual(['host', 'database', 'user', 'password', 'maxConnections', 'allowUnauthorizedCerts', 'ssl', 'port', 'sshTunnel', 'sshAuthenticateWith', 'sshHost', 'sshPort', 'sshUser', 'sshPassword', 'privateKey', 'passphrase']);
    expect(p.tableName.value).toBe('n8n_chat_histories');
    expect(p.contextWindowLength).toMatchObject({ value: 5, sourceVersionCondition: '@version >= 1.1' });
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_memory', label: 'Memory' })]);
  });

  it('models Xata current v1.5 session variants and three credentials', () => {
    const node = NODE_CATALOG['xata-memory'];
    const p = params('xata-memory');
    expect(node).toMatchObject({ n8nVersion: 1.5, n8nType: '@n8n/n8n-nodes-langchain.memoryXata', hidden: false, deprecated: false });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 7, credentialEditorFieldCount: 3, dynamicFieldCount: 1, totalAuthoringFieldCount: 10 });
    expect(node.credentialUiMetadata[0].fields.map(({ key }) => key)).toEqual(['databaseEndpoint', 'branch', 'apiKey']);
    expect(p.sessionKeyFromPreviousNode).toMatchObject({ readOnly: true, sourceVersionCondition: '@version >= 1.4' });
    expect(p.contextWindowLength.value).toBe(5);
    expect(node.excludedHistoricalAuthoring.map(({ sourceVersionCondition }) => sourceVersionCondition)).toEqual(['@version = 1', '@version = 1.1']);
  });

  it('models hidden deprecated Zep current v1.4 and exact credential branches', () => {
    const node = NODE_CATALOG['zep-memory'];
    const p = params('zep-memory');
    expect(node).toMatchObject({ n8nVersion: 1.4, n8nType: '@n8n/n8n-nodes-langchain.memoryZep', hidden: true, deprecated: true, iconAssetType: 'png' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 8, credentialEditorFieldCount: 4, dynamicFieldCount: 1, totalAuthoringFieldCount: 12 });
    expect(node.credentialUiMetadata[0].fields.map(({ key }) => key)).toEqual(['deprecationNotice', 'apiKey', 'cloud', 'apiUrl']);
    expect(p.supportedVersions.label).toContain('Community edition <= v0.27.2');
    expect(p.sessionKeyFromPreviousNode).toMatchObject({ readOnly: true, sourceVersionCondition: '@version >= 1.3' });
    expect(node.excludedHistoricalAuthoring.map(({ sourceVersionCondition }) => sourceVersionCondition)).toEqual(['@version = 1', '@version = 1.1']);
  });
});

describe('cluster-node batch 23 carries current output-parser authoring surfaces', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models deprecated Auto-fixing Output Parser v1 without parser or model execution', () => {
    const node = NODE_CATALOG['auto-fixing-output-parser'];
    const p = params('auto-fixing-output-parser');
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.outputParserAutofixing', deprecated: true });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 4, credentialEditorFieldCount: 0, dynamicFieldCount: 0, totalAuthoringFieldCount: 4 });
    expect(p.options.fields[0]).toMatchObject({ key: 'prompt', kind: 'textarea', rows: 10 });
    expect(p.options.fields[0].value).toContain('{error}');
    expect(node.inputs.map(({ type, maxConnections }) => [type, maxConnections])).toEqual([['ai_languageModel', 1], ['ai_outputParser', 1]]);
    expect(node.simulation).toMatchObject({ parsing: false, modelInvocation: false, retryInvocation: false });
  });

  it('models Item List Output Parser v1 defaults and dormant exclusion', () => {
    const node = NODE_CATALOG['item-list-output-parser'];
    const p = params('item-list-output-parser');
    const options = Object.fromEntries(p.options.fields.map((field) => [field.key, field]));
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.outputParserItemList' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 4, credentialEditorFieldCount: 0, dynamicFieldCount: 0, totalAuthoringFieldCount: 4 });
    expect(options.numberOfItems.value).toBe(-1);
    expect(options.separator.value).toBe('\\n');
    expect(node.excludedDormantAuthoring.map(({ n8nKey }) => n8nKey)).toEqual(['options.parseOutput']);
  });

  it('models Structured Output Parser v1.3 schema branches and declarative Auto-Fix input', () => {
    const node = NODE_CATALOG['structured-output-parser'];
    const p = params('structured-output-parser');
    expect(node).toMatchObject({ n8nVersion: 1.3, defaultVersion: 1.3, n8nType: '@n8n/n8n-nodes-langchain.outputParserStructured', dynamicPorts: true });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 8, helperGeneratedFieldCount: 5, dynamicFieldCount: 0, totalAuthoringFieldCount: 8 });
    expect(p.schemaType.options.map(({ value }) => value)).toEqual(['fromJson', 'manual']);
    expect(p.jsonSchemaExample).toMatchObject({ kind: 'textarea', editor: 'json', showWhen: { schemaType: ['fromJson'] } });
    expect(p.inputSchema).toMatchObject({ kind: 'textarea', editor: 'json', showWhen: { schemaType: ['manual'] } });
    expect(p.prompt.showWhen).toEqual({ autoFix: [true], customizeRetryPrompt: [true] });
    expect(node.portVariants[1].inputs).toEqual([expect.objectContaining({ type: 'ai_languageModel', maxConnections: 1, required: true })]);
    expect(node.excludedHistoricalAuthoring.map(({ n8nKey }) => n8nKey)).toEqual(['jsonSchema']);
  });
});

describe('cluster-node batch 24 carries current retriever authoring surfaces', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((param) => [param.key, param]));

  it('models Contextual Compression Retriever v1 as ports-only inert metadata', () => {
    const node = NODE_CATALOG['contextual-compression-retriever'];
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.retrieverContextualCompression', params: [] });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 0, credentialEditorFieldCount: 0, dynamicFieldCount: 0, totalAuthoringFieldCount: 0 });
    expect(node.inputs.map(({ type, maxConnections, required }) => [type, maxConnections, required])).toEqual([['ai_languageModel', 1, true], ['ai_retriever', 1, true]]);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_retriever', maxConnections: 1 })]);
    expect(node.simulation).toMatchObject({ modelInvocation: false, contextualCompression: false, documentRetrieval: false });
  });

  it('models MultiQuery Retriever v1 Query Count and capped ports', () => {
    const node = NODE_CATALOG['multi-query-retriever'];
    const p = params('multi-query-retriever');
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.retrieverMultiQuery' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 2, credentialEditorFieldCount: 0, dynamicFieldCount: 0, totalAuthoringFieldCount: 2 });
    expect(p.options.fields[0]).toMatchObject({ key: 'queryCount', value: 3, min: 1 });
    expect(node.inputs.map(({ type, maxConnections }) => [type, maxConnections])).toEqual([['ai_languageModel', 1], ['ai_retriever', 1]]);
    expect(node.outputs).toEqual([expect.objectContaining({ type: 'ai_retriever', maxConnections: 1 })]);
  });

  it('models Vector Store Retriever v1 Limit and related-node hint', () => {
    const node = NODE_CATALOG['vector-store-retriever'];
    const p = params('vector-store-retriever');
    expect(node).toMatchObject({ n8nVersion: 1, n8nType: '@n8n/n8n-nodes-langchain.retrieverVectorStore' });
    expect(node.authoringParity).toMatchObject({ recursiveFieldCount: 1, credentialEditorFieldCount: 0, dynamicFieldCount: 0, totalAuthoringFieldCount: 1 });
    expect(p.topK).toMatchObject({ kind: 'number', value: 4 });
    expect(node.inputs).toEqual([expect.objectContaining({ type: 'ai_vectorStore', maxConnections: 1, required: true })]);
    expect(node.builderHint.relatedNodes[0].nodeType).toBe('@n8n/n8n-nodes-langchain.vectorStoreInMemory');
    expect(node.simulation).toMatchObject({ vectorStoreAccess: false, vectorRetrieval: false, retrieverCreation: false });
  });
});

// Judge does not implement typeVersion — one shipped schema per node type is the
// right simplification — but every node must SAY which real node and version it
// models, or the catalogue drifts from the n8n a learner meets next and nobody
// can tell when. See docs/n8n-reference/00-how-n8n-actually-works.md §6.
describe('every node names the real n8n node it models', () => {
  const entries = Object.entries(NODE_CATALOG);

  it('has an n8nType and n8nVersion on all of them', () => {
    for (const [key, e] of entries) {
      expect(e.n8nType, `${key} is missing n8nType`).toBeTruthy();
      expect(typeof e.n8nVersion, `${key} is missing n8nVersion`).toBe('number');
    }
  });

  it('uses a real n8n package prefix', () => {
    for (const [key, e] of entries) {
      expect(e.n8nType, key).toMatch(/^(n8n-nodes-base|@n8n\/n8n-nodes-langchain)\./);
    }
  });

  // A sub-node lives in the langchain package; a core node does not. Getting this
  // backwards would mean the catalogue claims a Gmail node supplies a language model.
  it('puts model/ai nodes in the langchain package', () => {
    for (const [key, e] of entries) {
      if (e.category === 'model' || e.category === 'ai') {
        expect(e.n8nType, `${key} is category ${e.category}`).toMatch(/^@n8n\/n8n-nodes-langchain\./);
      }
    }
  });

  it('records the versions we actually read from the source', () => {
    expect(NODE_CATALOG.switch.n8nVersion).toBe(3.4);
    expect(NODE_CATALOG.if.n8nVersion).toBe(2.3);
    expect(NODE_CATALOG.classify.n8nType).toBe('@n8n/n8n-nodes-langchain.textClassifier');
    // Judge's "Classify with AI" is the Text Classifier: one main input, a required
    // model sub-input, and one output per category. Not the Agent.
    expect(NODE_CATALOG.classify.needsModel).toBe(true);
  });
});

describe('AI sub-node connectors carry n8n’s real caps', () => {
  it('uses the real connector names', () => {
    expect(AI_SUB_NODE_PORTS.map((p) => p.connector)).toEqual([
      'ai_languageModel',
      'ai_memory',
      'ai_tool',
    ]);
  });

  // The caps are NOT uniform in n8n, and that asymmetry is the whole point: one
  // model, one memory, as many tools as you like.
  it('caps model and memory at one, and leaves tools uncapped', () => {
    const by = Object.fromEntries(AI_SUB_NODE_PORTS.map((p) => [p.id, p]));
    expect(by.chatModel.maxConnections).toBe(1);
    expect(by.memory.maxConnections).toBe(1);
    expect(by.tool.maxConnections).toBe(null);
  });

  it('marks only the model required', () => {
    expect(AI_SUB_NODE_PORTS.filter((p) => p.required).map((p) => p.id)).toEqual(['chatModel']);
  });

  // Every inert slot has to be able to explain itself — that copy is the only
  // thing standing between "greyed out" and "greyed out for a reason".
  it('gives every port a plain-language reason', () => {
    for (const p of AI_SUB_NODE_PORTS) {
      expect(p.why, p.id).toBeTruthy();
      expect(p.why.length, p.id).toBeGreaterThan(30);
    }
  });
});

describe('picker options exist in the catalog', () => {
  it('offers only real types', () => {
    for (const t of [...TRIGGER_OPTIONS, ...NODE_OPTIONS]) {
      expect(NODE_CATALOG[t], `${t} is offered but not in the catalog`).toBeTruthy();
    }
  });
});

describe('final MCP core-node batch preserves the inert editor surface', () => {
  it('models MCP Client v1.1 without a client runtime', () => {
    const node = NODE_CATALOG['mcp-client'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 1.1, inputs: ['main'], outputs: ['main'] });
    expect(params.serverTransport.value).toBe('httpStreamable');
    expect(params.authentication.options.map(({ value }) => value)).toEqual([
      'bearerAuth', 'headerAuth', 'mcpOAuth2Api', 'multipleHeadersAuth', 'none',
    ]);
    expect(params.tool).toMatchObject({ kind: 'resourceLocator', required: true });
    expect(params.inputMode.options.map(({ value }) => value)).toEqual(['manual', 'json']);
    expect(node.execute).toBeUndefined();
  });

  it('models MCP Server Trigger v2 without a server or webhook runtime', () => {
    const node = NODE_CATALOG['mcp-server-trigger'];
    const params = Object.fromEntries(node.params.map((param) => [param.key, param]));
    expect(node).toMatchObject({ n8nVersion: 2, inputs: [{ type: 'ai_tool', label: 'Tools' }], outputs: [] });
    expect(params.authentication.options.map(({ value }) => value)).toEqual([
      'none', 'n8nOAuth2', 'bearerAuth', 'headerAuth',
    ]);
    expect(params.path).toMatchObject({ value: '', required: true });
    expect(node.webhooks.map(({ httpMethod }) => httpMethod)).toEqual(['GET', 'POST', 'DELETE']);
    expect(node.webhook).toBeUndefined();
  });
});

describe('core node batch 1 carries the real configurable surface', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((p) => [p.key, p]));
  const fields = (param) => Object.fromEntries(param.fields.map((f) => [f.key, f]));

  it('records the exact official source snapshot used for the batch', () => {
    for (const type of ['aggregate', 'limit', 'split-out']) {
      expect(NODE_CATALOG[type].source.commit).toBe('3d68c29b9281f14097aa9f15e01ac0777e538b11');
      expect(NODE_CATALOG[type].source.path).toMatch(/^packages\/nodes-base\/nodes\/Transform\//);
      expect(NODE_CATALOG[type]).toMatchObject({ group: ['transform'], inputs: ['main'], outputs: ['main'] });
    }
  });

  it('models Aggregate v1, including its repeatable fields and Options collection', () => {
    const node = NODE_CATALOG.aggregate;
    const p = params('aggregate');
    const aggregateFields = fields(p.fieldsToAggregate);
    const options = fields(p.options);
    expect(node.n8nType).toBe('n8n-nodes-base.aggregate');
    expect(node.n8nVersion).toBe(1);
    expect(p.aggregate.options.map((o) => o.value)).toEqual(['aggregateIndividualFields', 'aggregateAllItemData']);
    expect(p.fieldsToAggregate).toMatchObject({ kind: 'fixedCollection', multiple: true, addLabel: 'Add Field To Aggregate' });
    expect(p.fieldsToAggregate.value.fieldToAggregate).toEqual([{ fieldToAggregate: '', renameField: false }]);
    expect(aggregateFields.outputFieldName.showWhen).toEqual({ renameField: [true] });
    expect(p.fieldsToInclude.showWhen.include).toEqual(['specifiedFields']);
    expect(p.fieldsToExclude.showWhen.include).toEqual(['allFieldsExcept']);
    expect(p.options).toMatchObject({ kind: 'collection', addLabel: 'Add Field', value: {} });
    expect(options.keepOnlyUnique.showWhen).toEqual({ includeBinaries: [true] });
    expect(options.disableDotNotation.showWhen).toEqual({ aggregate: ['aggregateIndividualFields'] });
  });

  it('models Limit v1 defaults and bounds', () => {
    const node = NODE_CATALOG.limit;
    const p = params('limit');
    expect(node.n8nType).toBe('n8n-nodes-base.limit');
    expect(node.n8nVersion).toBe(1);
    expect(p.maxItems).toMatchObject({ kind: 'number', value: 1, min: 1 });
    expect(p.keep.options.map((o) => o.value)).toEqual(['firstItems', 'lastItems']);
  });

  it('models Split Out v1, including field retention and binary options', () => {
    const node = NODE_CATALOG['split-out'];
    const p = params('split-out');
    const options = fields(p.options);
    expect(node.n8nType).toBe('n8n-nodes-base.splitOut');
    expect(node.n8nVersion).toBe(1);
    expect(p.fieldToSplitOut).toMatchObject({ required: true, dataPath: 'multiple' });
    expect(p.include.options.map((o) => o.value)).toEqual(['noOtherFields', 'allOtherFields', 'selectedOtherFields']);
    expect(p.fieldsToInclude.showWhen).toEqual({ include: ['selectedOtherFields'] });
    expect(p.options).toMatchObject({ kind: 'collection', addLabel: 'Add Field', value: {} });
    expect(options.disableDotNotation.value).toBe(false);
    expect(options.destinationFieldName).toMatchObject({ value: '', dataPath: 'multiple' });
    expect(options.includeBinary.value).toBe(false);
  });
});

describe('core node batch 2 carries the real configurable surface', () => {
  const params = (type) => Object.fromEntries(NODE_CATALOG[type].params.map((p) => [p.key, p]));

  it('models AI Transform as the cloud-only wide editor surface', () => {
    const node = NODE_CATALOG['ai-transform'];
    const p = params('ai-transform');
    expect(node).toMatchObject({ n8nType: 'n8n-nodes-base.aiTransform', n8nVersion: 1, cloudOnly: true, parameterPane: 'wide' });
    expect(p.instructions).toMatchObject({ kind: 'button', buttonConfig: { label: 'Generate code', hasInputField: true } });
    expect(p.codeGeneratedForPrompt.kind).toBe('hidden');
    expect(p.jsCode).toMatchObject({ editor: 'jsEditor', readOnly: true });
  });

  it('models Code v2 language and execution-mode branches without a runtime', () => {
    const node = NODE_CATALOG.code;
    const p = params('code');
    expect(node).toMatchObject({ n8nType: 'n8n-nodes-base.code', n8nVersion: 2, parameterPane: 'wide' });
    expect(p.mode.options.map((o) => o.value)).toEqual(['runOnceForAllItems', 'runOnceForEachItem']);
    expect(p.language.options.map((o) => o.value)).toEqual(['javaScript', 'pythonNative']);
    expect(p.jsCode).toMatchObject({ kind: 'textarea', editor: 'codeNodeEditor', showWhen: { language: ['javaScript'] } });
    expect(p.pythonCode.showWhen.language).toEqual(['python', 'pythonNative']);
    expect(node.execute).toBeUndefined();
  });

  it('models Compare Datasets v2.3 inputs, outputs, matching, resolution, and options', () => {
    const node = NODE_CATALOG['compare-datasets'];
    const p = params('compare-datasets');
    expect(node.n8nVersion).toBe(2.3);
    expect(node.inputs.map((input) => input.label)).toEqual(['Input A', 'Input B']);
    expect(node.outputs.map((output) => output.label)).toEqual(['In A only', 'Same', 'Different', 'In B only']);
    expect(p.mergeByFields).toMatchObject({ kind: 'fixedCollection', multiple: true, addLabel: 'Add Fields to Match' });
    expect(p.resolve.value).toBe('includeBoth');
    expect(p.preferWhenMix.showWhen).toEqual({ resolve: ['mix'] });
    expect(p.options.fields.map((field) => field.key)).toEqual(['skipFields', 'disableDotNotation', 'multipleMatches']);
  });

  it('marks Switch as a router independently of case-specific branch names', () => {
    expect(NODE_CATALOG.switch.router).toBe(true);
  });
});

describe('reviewed descriptors preserve existing case sample data', () => {
  it('keeps the fields used by current case previews and workflow relinking', () => {
    expect(NODE_CATALOG['form-trigger'].output).toHaveProperty('Full Name');
    expect(NODE_CATALOG['http-request'].output).toHaveProperty('rates.INR');
    expect(NODE_CATALOG['remove-duplicates'].output).toHaveProperty('threadId');
    expect(NODE_CATALOG.switch.output).toHaveProperty('category');
    expect(NODE_CATALOG['chat-trigger'].output).toHaveProperty('sessionId');
    expect(NODE_CATALOG['google-docs'].output).toHaveProperty('ok', true);
  });
});

/**
 * The one coupling a new node type still has outside this package.
 *
 * `NodePickerDrawer` groups its list with `typeCategory[n.type] === cat`, so a type
 * absent from that map matches no category and is **dropped from the drawer entirely** —
 * offered by the options list above and impossible to click. `nodeIcons` is the same
 * kind of silent failure one step milder: a missing entry renders a blank chip.
 *
 * Three types (`remove-duplicates`, `wait`, `http-request`) were in this state until
 * 2026-08-04 and nothing caught it, which is why this test exists rather than a comment.
 */
describe('every catalog type is renderable by the web app', () => {
  it('has a category and an icon in nodeIcons.js', async () => {
    const { typeCategory, nodeIcons, nodeImageIcons } = await import('../../apps/web/src/nodes/nodeIcons.js');
    for (const type of Object.keys(NODE_CATALOG)) {
      expect(typeCategory[type], `${type} has no typeCategory entry — it would be invisible in the node picker`).toBeTruthy();
      const hasIcon = type in nodeIcons || type in nodeImageIcons;
      // `manual` is deliberately glyph-less: it is a rare distractor, never a flow node,
      // and NodeIcon falls back to its category glyph. Its category entry is what makes
      // that fallback work, which the assertion above already covers.
      if (type !== 'manual') {
        expect(hasIcon, `${type} has no icon in nodeIcons or nodeImageIcons — it would render a blank chip`).toBe(true);
      }
    }
    expect(nodeImageIcons).toMatchObject({
      aggregate: '/node-icons/aggregate.svg',
      limit: '/node-icons/limit.svg',
      'split-out': '/node-icons/split-out.svg',
    });
  });

  it('uses a canvas category with visual metadata', () => {
    const categories = new Set(['trigger', 'ai', 'model', 'core', 'action']);
    for (const type of COMPLETE_CORE_NODE_TYPES) expect(categories.has(NODE_CATALOG[type].category), type).toBe(true);
    for (const type of COMPLETE_CLUSTER_NODE_TYPES) expect(categories.has(NODE_CATALOG[type].category), type).toBe(true);
    for (const type of COMPLETE_APP_NODE_TYPES) expect(categories.has(NODE_CATALOG[type].category), type).toBe(true);
  });
});

describe('agent-facing node library catalog', () => {
  it('lists every available catalog type and its function', () => {
    const guide = readFileSync(new URL('../../docs/node-library-catalog.md', import.meta.url), 'utf8');
    for (const type of Object.keys(NODE_CATALOG)) {
      expect(guide, `${type} is missing from docs/node-library-catalog.md`).toContain(`| \`${type}\` |`);
    }
  });
});
