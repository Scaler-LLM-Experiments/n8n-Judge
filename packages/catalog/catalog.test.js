import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { NODE_CATALOG, AI_SUB_NODE_PORTS, TRIGGER_OPTIONS, NODE_OPTIONS } from './catalog.js';
import { CORE_NODE_INVENTORY, COMPLETE_CORE_NODE_TYPES, SOURCE_COMMIT } from './core-nodes/index.js';
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

describe('pinned source metadata and ports', () => {
  it('keeps single-output Filter and Remove Duplicates faithful to n8n', () => {
    expect(NODE_CATALOG.filter.outputs).toHaveLength(1);
    expect(NODE_CATALOG['remove-duplicates'].outputs).toHaveLength(1);
  });

  it('uses the case-sensitive FTP source paths from the pinned checkout', () => {
    expect(NODE_CATALOG.ftp.source.path).toBe('packages/nodes-base/nodes/Ftp/Ftp.node.ts');
    expect(NODE_CATALOG.ftp.source.metadataPath).toBe('packages/nodes-base/nodes/Ftp/Ftp.node.json');
  });

  it('keeps auxiliary source references at their pinned locations', () => {
    expect(NODE_CATALOG['execute-subworkflow'].source.workflowSelectorPath).toContain('/features/ndv/parameters/');
    expect(NODE_CATALOG['microsoft-excel'].source.excludedSiblingPath).toBe('packages/nodes-base/nodes/Microsoft/ExcelSharePoint/MicrosoftExcelSharePoint.node.ts');
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
