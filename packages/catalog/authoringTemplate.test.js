import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NODE_CATALOG, LEGACY_ALIASES } from '@judge/catalog';

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

/** Backticked words in the template that are prose or examples, not node types. */
const NOT_NODE_TYPES = new Set(['easy', 'moderate', 'difficult', 'linear', 'trial-signup-desk']);

const templateText = () => fs.readFileSync(TEMPLATE, 'utf8');

/** Every `backticked-token` that is shaped like a node id. */
function backtickedTokens(md) {
  // Two characters, not three. `if` is the only catalog type shorter than three characters,
  // and a three-character floor made it invisible here exactly as it did in the spec linter:
  // the template offers `if` in its splitter row, and this helper could not see it. Prose
  // two-letter words are filtered by the callers, which all check catalog membership.
  return [...new Set((md.match(/`[a-z][a-z0-9-]{1,}`/g) ?? []).map((t) => t.slice(1, -1)))];
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
    for (const alias of Object.keys(LEGACY_ALIASES)) {
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
      .filter(([type, entry]) => entry.category === 'action' && !Object.keys(LEGACY_ALIASES).includes(type))
      .map(([type]) => type)
      .filter((type) => !tokens.has(type));
    // Actions are the small, complete list an author picks an ending from — 24 today.
    // Leaving one out silently narrows what anyone can author.
    expect(missing, 'canonical action nodes absent from the template menu').toEqual([]);
  });

  /**
   * Types deliberately withheld from authors, each for a stated reason.
   *
   * The template is a curated menu, not a dump of the catalogue — 200 names in front of a
   * non-technical author produces worse briefs, not better ones. But "curated" and "drifted"
   * look identical from the outside, which is how the handout came to offer 74 of 190 usable
   * types with nobody deciding that. So every omission is listed here: a newly registered
   * type fails this test until somebody either adds it to the menu or writes down why not.
   */
  const NOT_OFFERED = {
    // Plug into an AI Agent, meaningless outside a retrieval/agent topology no case teaches
    // and the Build stage cannot assemble. Matched by pattern below rather than named.
    cluster: /vector-store|embeddings|memory|retriever|document|text-splitter|output-parser|reranker|-tool$|tool$|langchain|motorhead|token-splitter|default-data-loader|calculator|model-selector/,
    // Start a workflow from n8n's own plumbing — no story a learner can follow.
    infrastructure: ['n8n-trigger', 'sse-trigger', 'mcp-server-trigger', 'evaluation-trigger', 'execute-subworkflow-trigger', 'error-trigger-internal', 'microsoft-agent-365-trigger', 'mcp-client', 'n8n', 'execution-data', 'evaluation', 'debug-helper'],
    // Shell, filesystem and directory access: real n8n nodes, but nothing a graded browser
    // journey can simulate, and nothing a beginner case should teach.
    operational: ['execute-command', 'ssh', 'ftp', 'git', 'ldap'],
    // Media and model-plumbing surfaces with no graded decision behind them yet.
    unused: ['edit-image', 'ai-transform', 'chat'],
    // Extra chat models beyond the nine the template names: every `*-model` variant exists so
    // the library matches n8n, but a case needs a handful of recognisable ones, not all 26.
    surplusModels: /-model$/,
  };

  it('offers every usable node type, or records why it is withheld', () => {
    const tokens = new Set(backtickedTokens(templateText()));
    const withheld = (type) =>
      NOT_OFFERED.cluster.test(type) ||
      NOT_OFFERED.surplusModels.test(type) ||
      NOT_OFFERED.infrastructure.includes(type) ||
      NOT_OFFERED.operational.includes(type) ||
      NOT_OFFERED.unused.includes(type);

    const undecided = Object.keys(NODE_CATALOG)
      .filter((type) => !Object.keys(LEGACY_ALIASES).includes(type))
      .filter((type) => !tokens.has(type) && !withheld(type));

    // A type here is not necessarily a bug — it is an unmade decision. Add it to the
    // template's menu, or to NOT_OFFERED with the reason.
    expect(undecided, 'catalog types neither offered to authors nor listed as withheld').toEqual([]);
  });

  it('names enough of the catalogue to author from', () => {
    const tokens = new Set(backtickedTokens(templateText()));
    const offered = Object.keys(NODE_CATALOG).filter(
      (type) => !Object.keys(LEGACY_ALIASES).includes(type) && tokens.has(type)
    );
    // 105 of 190 usable types when this was written. A large drop means the menu was
    // trimmed rather than curated.
    expect(offered.length).toBeGreaterThanOrEqual(100);
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
