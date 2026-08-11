import { NODE_CATALOG, LEGACY_ALIASES } from '@judge/catalog';

export interface SpecIssue {
  level: 'error' | 'warning';
  rule: string;
  message: string;
}

/**
 * Backticked words in a spec that are prose, not node types. Same list as
 * `authoringTemplate.test.js` keeps, for the same reason: an author writes
 * `moderate` and `linear` in backticks because the template asks them to.
 */
const NOT_NODE_TYPES = new Set(['easy', 'moderate', 'difficult', 'linear', 'no-ai']);

/** Nodes with more than one exit. Every exit must lead somewhere or the learner is stuck. */
const SPLITTERS = ['if', 'switch', 'loop-over-items', 'compare-datasets', 'sentiment-analysis'];

/** AI roots need a model attached over `ai_languageModel`; the picker offers several. */
const AI_ROOTS = [
  'text-classifier',
  'basic-llm-chain',
  'information-extractor',
  'sentiment-analysis',
  'summarization-chain',
  'ai-agent',
];

const isModel = (type: string): boolean =>
  (NODE_CATALOG as Record<string, { category?: string }>)[type]?.category === 'model';

/** Every `backticked-token` shaped like a node id, in order of first appearance. */
export function nodeTokens(md: string): string[] {
  const raw = (md.match(/`[a-z][a-z0-9-]{2,}`/g) ?? []).map((t) => t.slice(1, -1));
  return [...new Set(raw)].filter((t) => !NOT_NODE_TYPES.has(t));
}

/** The body of one `## N.` section, or '' when the spec omits it. */
function section(md: string, heading: string): string {
  const start = md.indexOf(`## ${heading}`);
  if (start === -1) return '';
  const rest = md.slice(start);
  const end = rest.indexOf('\n## ', 3);
  return end === -1 ? rest : rest.slice(0, end);
}

/**
 * Lint one filled-in case spec.
 *
 * Every rule here has already forced a case to be redesigned AFTER it was
 * written, which is the most expensive failure this pipeline has. All of them
 * are decidable from the text, so none of them should ever cost an authoring
 * cycle again.
 */
export function lintSpec(md: string): SpecIssue[] {
  const issues: SpecIssue[] = [];
  const err = (rule: string, message: string) => issues.push({ level: 'error', rule, message });
  const warn = (rule: string, message: string) => issues.push({ level: 'warning', rule, message });

  const tokens = nodeTokens(md);

  for (const t of tokens) {
    if (!(t in NODE_CATALOG)) {
      err('unknown-node', `\`${t}\` is not a registered node type — see docs/node-library-catalog.md`);
      continue;
    }
    const canonical = (LEGACY_ALIASES as Record<string, string>)[t];
    if (canonical) {
      err('legacy-alias', `\`${t}\` is a compatibility alias kept only for existing cases — use \`${canonical}\``);
    }
  }

  // The node list answers §4, so a type appearing twice there means the case wants
  // one node type configured two ways. `nodeSetup` is keyed by TYPE, so both
  // instances share one answer key and one of them gets graded wrong.
  const nodesSection = section(md, '4.');
  const named = (nodesSection.match(/`[a-z][a-z0-9-]{2,}`/g) ?? [])
    .map((t) => t.slice(1, -1))
    .filter((t) => t in NODE_CATALOG && !NOT_NODE_TYPES.has(t));
  const seen = new Set<string>();
  for (const t of named) {
    if (seen.has(t)) {
      err('type-reused', `\`${t}\` is named twice — nodeSetup is keyed by node type, so both copies share one answer key`);
      break;
    }
    seen.add(t);
  }

  // A splitter's exits: §3's path table is where each one is given a destination.
  const flow = section(md, '3.');
  const pathRows = (flow.match(/^\|(?!\s*-)(?!\s*Path name).+\|.+\|\s*$/gm) ?? []).filter((r) =>
    r.split('|').some((cell) => cell.trim().length > 0)
  );
  if (tokens.some((t) => SPLITTERS.includes(t)) && pathRows.length < 2) {
    err(
      'splitter-without-paths',
      'a splitting node is named but §3 lists fewer than two paths — every exit must lead somewhere or a correct flow cannot complete its phase'
    );
  }

  if (tokens.some((t) => AI_ROOTS.includes(t)) && !tokens.some(isModel)) {
    err('ai-without-model', 'an AI step is named with no chat model — pick `google-gemini-chat-model` or `openai-chat-model`');
  }

  // §5's awkward row is what Stress Testing is built from. A blank one produces a
  // case with nothing interesting to ask.
  const examples = section(md, '5.');
  const awkward = examples.slice(examples.indexOf('awkward'));
  const answered = awkward
    .split('\n')
    .filter((l) => l.trimStart().startsWith('>'))
    .some((l) => l.replace(/^\s*>\s*/, '').trim().length > 10);
  if (!answered) {
    err('no-awkward-example', '§5 the awkward one is blank — it is what the Stress Testing questions are built from');
  }

  if (!tokens.length) warn('no-nodes', 'no node types named anywhere in the spec');
  return issues;
}
