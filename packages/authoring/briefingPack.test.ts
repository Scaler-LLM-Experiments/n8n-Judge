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
