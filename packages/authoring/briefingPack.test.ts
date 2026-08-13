import { describe, it, expect } from 'vitest';
import { NODE_CATALOG, LEGACY_ALIASES } from '@judge/catalog';
import { candidateTypes, nodeMenu, briefingPack } from './briefingPack.ts';

const SPEC = `
## 4. The nodes
> \`form-trigger\` then \`text-classifier\` with \`google-gemini-chat-model\`, then \`switch\`, ending at \`slack\`.
`;

describe('candidateTypes', () => {
  it('includes every type the spec names', () => {
    const types = candidateTypes(SPEC);
    for (const named of ['form-trigger', 'text-classifier', 'google-gemini-chat-model', 'switch', 'slack']) {
      expect(types).toContain(named);
    }
  });

  it('offers `if`, which the pack must contain or an If-based case is unbuildable', () => {
    // The pack tells the author to stop and report `blocked: true` rather than pick a node
    // absent from its table. `if` is the only catalog type under three characters, so while
    // the token regex required three it was never in the table — and the correct node for a
    // two-way test could not legally be chosen.
    const IF_SPEC = `
## The nodes
> \`webhook\` then \`if\`, ending at \`slack\`.
`;
    expect(candidateTypes(IF_SPEC)).toContain('if');
  });

  it('adds same-category siblings, so probes still have real distractors', () => {
    expect(candidateTypes(SPEC).length).toBeGreaterThan(5);
  });

  it('never offers a legacy alias', () => {
    const types = candidateTypes(SPEC);
    for (const alias of Object.keys(LEGACY_ALIASES)) expect(types).not.toContain(alias);
  });

  it('stays far smaller than the whole catalog', () => {
    expect(candidateTypes(SPEC).length).toBeLessThan(Object.keys(NODE_CATALOG).length / 2);
  });

  it('reaches siblings far from the start of a large category, not just a fixed prefix', () => {
    // `trigger` is a 28-member category — far bigger than any fixed prefix of
    // SIBLINGS_PER_TYPE could cover from one starting point. A naive
    // `list.slice(0, N + 1)` always reads the same few entries from the front of the
    // category regardless of which type named it, so anything positioned later can
    // never surface as a sibling of *anything* — which is exactly the bug this test
    // guards: it broke on real content (low-stock-morning-post's spec names both
    // `schedule` and `google-sheets-trigger`, and the naive version omitted
    // `webhook` and `gmail-trigger`).
    const triggerTypes = Object.entries(NODE_CATALOG)
      .filter(([, e]) => (e as { category?: string }).category === 'trigger')
      .map(([type]) => type);
    const scheduleIdx = triggerTypes.indexOf('schedule');
    const sheetsTriggerIdx = triggerTypes.indexOf('google-sheets-trigger');
    const webhookIdx = triggerTypes.indexOf('webhook');
    const gmailTriggerIdx = triggerTypes.indexOf('gmail-trigger');

    // Sanity-check the premise against the live catalog, so this test fails loudly
    // (rather than silently passing for the wrong reason) if reordering ever moves
    // these types close enough together that a small fixed prefix would reach both.
    expect(scheduleIdx).toBeGreaterThanOrEqual(0);
    expect(sheetsTriggerIdx).toBeGreaterThan(scheduleIdx);
    expect(webhookIdx).toBeGreaterThan(scheduleIdx);
    expect(gmailTriggerIdx).toBeLessThan(sheetsTriggerIdx);
    expect(gmailTriggerIdx).toBeGreaterThan(6); // past a small fixed-prefix scan from index 0

    const TWO_TRIGGERS_SPEC = `
## The nodes
> \`schedule\` and \`google-sheets-trigger\` both feed the same flow.
`;
    const types = candidateTypes(TWO_TRIGGERS_SPEC);
    expect(types).toContain('webhook');
    expect(types).toContain('gmail-trigger');
  });
});

describe('nodeMenu', () => {
  it('gives one row per type, carrying the facts that decide the choice', () => {
    const md = nodeMenu(['switch', 'text-classifier']);
    const rows = md.split('\n').filter((l) => l.startsWith('| `'));
    expect(rows).toHaveLength(2);
    expect(md).toContain('router');        // switch has more than one exit
    expect(md).toContain('needs a model'); // text-classifier is an AI root
  });
});

describe('briefingPack', () => {
  it('carries the spec verbatim and the narrow menu, and points at the full contract', () => {
    const pack = briefingPack({ slug: 'demo-case', specMd: SPEC });
    expect(pack).toContain('demo-case');
    expect(pack).toContain(SPEC.trim());
    expect(pack).toContain('.claude/skills/authoring-a-problem/SKILL.md');
    expect(pack).toContain('| `switch`');
  });

  it('is a fraction of the size of the node library doc it replaces', () => {
    // docs/node-library-catalog.md is 26.6KB. The pack exists to make that read
    // unnecessary, so it has to actually be small.
    expect(briefingPack({ slug: 'demo-case', specMd: SPEC }).length).toBeLessThan(8000);
  });
});
