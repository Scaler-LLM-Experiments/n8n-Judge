import { describe, it, expect } from 'vitest';
import { NODE_CATALOG, AI_SUB_NODE_PORTS, TRIGGER_OPTIONS, NODE_OPTIONS } from './catalog.js';

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
  });
});
