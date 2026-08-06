import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NODE_CATALOG } from './catalog.js';

// The authoring template hands a node menu to people who cannot check it.
//
// `docs/case-authoring/TEMPLATE.md` is given to authors who fill it in by chatting with
// an AI that has no access to this repository. That is the whole point of it — but it
// means the node list inside it is a COPY of the catalogue, handed to someone with no
// way to verify a name. A node that gets renamed or retired leaves the template quietly
// wrong, and the author's brief comes back naming something that does not exist.
//
// This is not hypothetical: the same class of drift already put "only 14 of 200 types
// can be exported" into five authoring documents after that stopped being true, and put
// a 23-node list in front of authors after the library grew to 200.
//
// So the menu is pinned. If you rename or remove a node type, this test tells you the
// handout needs updating in the same change.
const TEMPLATE = path.join(process.cwd(), 'docs/case-authoring/TEMPLATE.md');

/**
 * Compatibility aliases. They appear in the template ON PURPOSE, inside its "never use
 * these names" table, so they must be allowed here — but see the second test, which
 * asserts they appear ONLY there.
 */
const LEGACY_ALIASES = [
  'trigger', 'parse', 'action', 'classify', 'chat-gemini', 'summarize',
  'slack-message', 'notion-page', 'calendar-event', 'web-search',
];

/** Backticked words in the template that are prose or examples, not node types. */
const NOT_NODE_TYPES = new Set(['easy', 'moderate', 'difficult', 'linear', 'trial-signup-desk']);

const templateText = () => fs.readFileSync(TEMPLATE, 'utf8');

/** Every `backticked-token` that is shaped like a node id. */
function backtickedTokens(md) {
  return [...new Set((md.match(/`[a-z][a-z0-9-]{2,}`/g) ?? []).map((t) => t.slice(1, -1)))];
}

describe('the authoring template menu matches the catalog', () => {
  it('exists where the pipeline and the docs say it does', () => {
    expect(fs.existsSync(TEMPLATE), `${TEMPLATE} is missing — the handout is the pipeline's only input`).toBe(true);
  });

  it('names no node type that does not exist', () => {
    const unknown = backtickedTokens(templateText())
      .filter((t) => !NODE_CATALOG[t] && !NOT_NODE_TYPES.has(t));
    // An author cannot check these, so a wrong name reaches the pipeline as a real request.
    expect(unknown, 'node names in the template with no catalog entry').toEqual([]);
  });

  it('mentions a legacy alias only inside the "never use" warning', () => {
    const md = templateText();
    const warning = md.slice(md.indexOf('Never use these names'));
    for (const alias of LEGACY_ALIASES) {
      const everywhere = (md.match(new RegExp('`' + alias + '`', 'g')) ?? []).length;
      const inWarning = (warning.match(new RegExp('`' + alias + '`', 'g')) ?? []).length;
      // Recommending an alias anywhere else would teach the wrong node, which is the
      // exact mistake the warning table exists to prevent.
      expect(everywhere, `${alias} is recommended outside the warning table`).toBe(inWarning);
    }
  });

  it('offers at least one usable trigger, shaping step and action', () => {
    const tokens = backtickedTokens(templateText()).filter((t) => NODE_CATALOG[t]);
    const byCategory = (c) => tokens.filter((t) => NODE_CATALOG[t].category === c);
    // A menu missing a whole category would send authors to the aliases by default.
    expect(byCategory('trigger').length).toBeGreaterThan(5);
    expect(byCategory('core').length).toBeGreaterThan(10);
    expect(byCategory('action').length).toBeGreaterThan(5);
  });

  it('lists every registered action, since a case has to end somewhere real', () => {
    const tokens = new Set(backtickedTokens(templateText()));
    const missing = Object.entries(NODE_CATALOG)
      .filter(([type, entry]) => entry.category === 'action' && !LEGACY_ALIASES.includes(type))
      .map(([type]) => type)
      .filter((type) => !tokens.has(type));
    // Actions are the small, complete list an author picks an ending from — 24 today.
    // Leaving one out silently narrows what anyone can author.
    expect(missing, 'canonical action nodes absent from the template menu').toEqual([]);
  });

  it('keeps the starter prompt beside it', () => {
    const prompt = path.join(process.cwd(), 'docs/case-authoring/STARTER-PROMPT.md');
    expect(fs.existsSync(prompt)).toBe(true);
    const text = fs.readFileSync(prompt, 'utf8');
    // The prompt's whole job is to stop an AI inventing node names, so that instruction
    // has to survive any future edit of it.
    expect(text).toMatch(/TEMPLATE\.md/);
    expect(text.toLowerCase()).toMatch(/complete set|nothing else|do not suggest a node/);
  });
});
