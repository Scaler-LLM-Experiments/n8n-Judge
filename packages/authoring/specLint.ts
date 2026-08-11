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

/**
 * Every `backticked-token` shaped like a node id, anywhere in the document, in order of first
 * appearance. Deliberately document-wide and unscoped by section — Task 3's brief-shrinker
 * consumes this directly and filters by catalog membership itself, so scoping to one section
 * belongs inside `lintSpec`, not here.
 */
export function nodeTokens(md: string): string[] {
  const raw = (md.match(/`[a-z][a-z0-9-]{2,}`/g) ?? []).map((t) => t.slice(1, -1));
  return [...new Set(raw)].filter((t) => !NOT_NODE_TYPES.has(t));
}

/** Node-shaped backticked tokens in a slice of text, in appearance order, NOT deduplicated —
 * callers that care about reuse need every occurrence, not the unique set. */
function tokensIn(text: string): string[] {
  return (text.match(/`[a-z][a-z0-9-]{2,}`/g) ?? [])
    .map((t) => t.slice(1, -1))
    .filter((t) => !NOT_NODE_TYPES.has(t));
}

interface Heading {
  index: number;
  level: number;
}

/** Every markdown heading in `md`, any level, in document order. */
function allHeadings(md: string): Heading[] {
  const re = /^(#{1,6})[ \t]+.*$/gm;
  const list: Heading[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    list.push({ index: m.index, level: m[1].length });
  }
  return list;
}

/**
 * The body of the first heading (any level, anywhere) whose line matches `keywordRe`, running to
 * the next heading of the SAME OR HIGHER level (fewer or equal `#`s) — or to the end of the
 * document. Returns null when nothing matches.
 *
 * This replaces indexing on `TEMPLATE.md`'s pristine `## N.` numbering, because a spec that has
 * already been resolved into a real case rewrites its own headings ("Node vocabulary" instead of
 * "The nodes", a different heading level, extra sections appended after §10) — the numbering is a
 * fill-in-the-blank convention, not something a finished document is obliged to keep.
 */
function findSection(md: string, keywordRe: RegExp, headings: Heading[]): string | null {
  const m = keywordRe.exec(md);
  if (!m) return null;
  const hashes = md.slice(m.index).match(/^#{1,6}/);
  const level = hashes ? hashes[0].length : (headings.find((h) => h.index === m.index)?.level ?? 6);
  const lineEnd = md.indexOf('\n', m.index);
  const bodyStart = lineEnd === -1 ? md.length : lineEnd + 1;
  const next = headings.find((h) => h.index > m.index && h.level <= level);
  const bodyEnd = next ? next.index : md.length;
  return md.slice(bodyStart, bodyEnd);
}

const ALIAS_HEADING = /never use|alias/i;

/**
 * Strip the two regions a nodes section can contain that name node types WITHOUT using them:
 * a "never use these names" / aliases sub-heading (verbatim from `TEMPLATE.md`, or a spec's own
 * pre-send checklist quoting it back), and checklist lines (`- [ ]` / `- [x]`) generally, which
 * attest to a rule rather than declare a node.
 */
function stripQuotedNodeNames(text: string): string {
  const local = allHeadings(text);
  let result = text;
  for (let i = local.length - 1; i >= 0; i--) {
    const h = local[i];
    const lineEnd = text.indexOf('\n', h.index);
    const headingLine = text.slice(h.index, lineEnd === -1 ? text.length : lineEnd);
    if (!ALIAS_HEADING.test(headingLine)) continue;
    const next = local.find((o, j) => j > i && o.level <= h.level);
    const end = next ? next.index : text.length;
    result = result.slice(0, h.index) + result.slice(end);
  }
  return result
    .split('\n')
    .filter((line) => !/^\s*-\s\[[ xX]\]/.test(line))
    .join('\n');
}

const NODES_HEADING = /^#{1,6}.*\b(the nodes|nodes this case needs)\b/im;
const FLOW_HEADING = /^#{1,6}.*\b(shape of the flow|the flow)\b/im;
const EXAMPLES_HEADING = /^#{1,6}.*\b(examples|test it with)\b/im;

/**
 * Lint one filled-in case spec.
 *
 * Every rule here has already forced a case to be redesigned AFTER it was written, which is the
 * most expensive failure this pipeline has. All of them are decidable from the text.
 *
 * Two things this deliberately is NOT:
 *  - A whole-document token scan. A spec's own slug, its schema/column field names, and prose
 *    about OTHER cases' aliases are indistinguishable from a real node id by shape alone, and the
 *    only place node ids are actually placed is the nodes section — so every node-token rule is
 *    scoped to it, and an unrecognised token is a WARNING (`unknown-token`), never an error,
 *    because a field name shaped like a node id is the common case, not the rare one.
 *  - Reliant on `TEMPLATE.md`'s exact `## N.` heading shape. A resolved spec keeps whatever
 *    heading wording and level it ended up with, so each section is found by keyword, and a
 *    section this rule needs but cannot find degrades to a `section-not-found` warning naming
 *    which check it skipped, rather than guessing or erroring on the absence.
 */
export function lintSpec(md: string): SpecIssue[] {
  const issues: SpecIssue[] = [];
  const err = (rule: string, message: string) => issues.push({ level: 'error', rule, message });
  const warn = (rule: string, message: string) => issues.push({ level: 'warning', rule, message });
  const sectionSkipped = (message: string) => warn('section-not-found', message);

  const headings = allHeadings(md);
  let hasSplitterToken = false;

  // --- The nodes section: unknown-token, legacy-alias, type-reused and ai-without-model all
  // read from here, and nowhere else.
  const nodesSectionRaw = findSection(md, NODES_HEADING, headings);
  if (nodesSectionRaw === null) {
    sectionSkipped(
      'could not find the nodes section — skipping unknown-token, legacy-alias, type-reused, ai-without-model'
    );
  } else {
    const nodesSection = stripQuotedNodeNames(nodesSectionRaw);
    const named = tokensIn(nodesSection);

    for (const t of named) {
      if (!(t in NODE_CATALOG)) {
        warn(
          'unknown-token',
          `\`${t}\` is not a registered node type — if it names a node this spec cannot be built; if it is a field or column name, ignore`
        );
        continue;
      }
      const canonical = (LEGACY_ALIASES as Record<string, string>)[t];
      if (canonical) {
        err(
          'legacy-alias',
          `\`${t}\` is a compatibility alias kept only for existing cases — use \`${canonical}\``
        );
      }
    }

    // The node list answers the nodes section, so a type appearing twice there means the case
    // wants one node type configured two ways. `nodeSetup` is keyed by TYPE, so both instances
    // share one answer key and one of them gets graded wrong.
    const knownNamed = named.filter((t) => t in NODE_CATALOG);
    hasSplitterToken = knownNamed.some((t) => SPLITTERS.includes(t));

    const seen = new Set<string>();
    for (const t of knownNamed) {
      if (seen.has(t)) {
        err(
          'type-reused',
          `\`${t}\` is named twice — nodeSetup is keyed by node type, so both copies share one answer key`
        );
        break;
      }
      seen.add(t);
    }

    if (knownNamed.some((t) => AI_ROOTS.includes(t)) && !knownNamed.some(isModel)) {
      err(
        'ai-without-model',
        'an AI step is named with no chat model — pick `google-gemini-chat-model` or `openai-chat-model`'
      );
    }
  }

  // --- The flow section: only consulted when a splitter was actually named in the nodes
  // section, because a linear case has no exits to check.
  if (hasSplitterToken) {
    const flowSection = findSection(md, FLOW_HEADING, headings);
    if (flowSection === null) {
      sectionSkipped('could not find the flow section — skipping splitter-without-paths');
    } else {
      const pathRows = (flowSection.match(/^\|(?!\s*-)(?!\s*Path name).+\|.+\|\s*$/gim) ?? []).filter(
        (r) => r.split('|').some((cell) => cell.trim().length > 0)
      );
      if (pathRows.length < 2) {
        err(
          'splitter-without-paths',
          'a splitting node is named but the flow section lists fewer than two paths — every exit must lead somewhere or a correct flow cannot complete its phase'
        );
      }
    }
  }

  // --- The examples section: the awkward row is what Stress Testing is built from.
  const examplesSection = findSection(md, EXAMPLES_HEADING, headings);
  if (examplesSection === null) {
    sectionSkipped('could not find the examples section — skipping no-awkward-example');
  } else {
    const awkwardAt = examplesSection.toLowerCase().indexOf('awkward');
    if (awkwardAt === -1) {
      sectionSkipped(
        'found the examples section but no "awkward" marker in it — skipping no-awkward-example'
      );
    } else {
      const awkward = examplesSection.slice(awkwardAt);
      const answered = awkward
        .split('\n')
        .filter((l) => l.trimStart().startsWith('>'))
        .some((l) => l.replace(/^\s*>\s*/, '').trim().length > 10);
      if (!answered) {
        err(
          'no-awkward-example',
          'the awkward example is blank — it is what the Stress Testing questions are built from'
        );
      }
    }
  }

  if (!nodeTokens(md).length) warn('no-nodes', 'no node types named anywhere in the spec');
  return issues;
}
