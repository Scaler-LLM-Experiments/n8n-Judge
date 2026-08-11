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

const LIST_ITEM = /^\s*>?\s*(?:\d+\.|[-*])\s+\*{0,2}`([a-z][a-z0-9-]{2,})`/;
const TABLE_ROW = /^\s*\|/;
const TABLE_SEPARATOR_ROW = /^\s*\|[\s|:-]+\|\s*$/;

/**
 * The node each nodes-section PLACEMENT is about — one entry per list item or table row, not one
 * per backtick. Two shapes, because a spec expresses its answer as one or the other:
 *  - A list item — numbered (`1.`, `2.`) or bulleted (`-`, `*`), with or without a leading `>`
 *    blockquote marker and any `**bold**` wrapper — contributes its FIRST backticked token.
 *    Anything after it on the same line, or on a later item's line, is that item's description,
 *    not a second placement: "the brain attached to the `information-extractor` step" does not
 *    count `information-extractor` again.
 *  - A table row (a line starting with `|`, excluding the `|---|---|` separator row) contributes
 *    the first backticked token in the row that is a real `NODE_CATALOG` entry — the Type column
 *    is what a table names the node; other columns can carry their own unrelated backticked text.
 * A continuation line (no list marker, not a table row) contributes nothing, so prose is always
 * free to refer back to an already-placed node without that reading as reuse.
 */
function placements(text: string): string[] {
  const heads: string[] = [];
  for (const line of text.split('\n')) {
    const li = line.match(LIST_ITEM);
    if (li) {
      heads.push(li[1]);
      continue;
    }
    if (TABLE_ROW.test(line) && !TABLE_SEPARATOR_ROW.test(line)) {
      const cellTokens = (line.match(/`[a-z][a-z0-9-]{2,}`/g) ?? []).map((t) => t.slice(1, -1));
      const known = cellTokens.find((t) => t in NODE_CATALOG);
      if (known) heads.push(known);
    }
  }
  return heads.filter((t) => !NOT_NODE_TYPES.has(t));
}

interface Heading {
  index: number;
  level: number;
  text: string;
}

/** Every markdown heading in `md`, any level, in document order, with its own text. */
function allHeadings(md: string): Heading[] {
  const re = /^(#{1,6})[ \t]+(.*)$/gm;
  const list: Heading[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    list.push({ index: m.index, level: m[1].length, text: m[2] });
  }
  return list;
}

/**
 * The body of the first heading (in document order) whose TEXT satisfies `matches`, running to
 * the next heading of the SAME OR HIGHER level (fewer or equal `#`s) — or to the end of the
 * document. Returns null when nothing matches.
 *
 * Only headings at level 2 or deeper are candidates: every case spec carries exactly one level-1
 * heading, the document's own title ("# Case spec — …" / "# Case brief — …"), and that title
 * always contains the word "case" — which the examples-section keyword list below also matches.
 * Without this floor, the title would win every examples-section lookup (it is always the FIRST
 * heading in the document) and "the examples section" would become the entire rest of the file.
 *
 * This replaces indexing on `TEMPLATE.md`'s pristine `## N.` numbering, because a spec that has
 * already been resolved into a real case rewrites its own headings ("Node vocabulary" instead of
 * "The nodes", a different heading level, extra sections appended after §10) — the numbering is a
 * fill-in-the-blank convention, not something a finished document is obliged to keep.
 */
function findSection(md: string, matches: (headingText: string) => boolean, headings: Heading[]): string | null {
  const heading = headings.find((h) => h.level >= 2 && matches(h.text));
  if (!heading) return null;
  const lineEnd = md.indexOf('\n', heading.index);
  const bodyStart = lineEnd === -1 ? md.length : lineEnd + 1;
  const next = headings.find((h) => h.index > heading.index && h.level <= heading.level);
  const bodyEnd = next ? next.index : md.length;
  return md.slice(bodyStart, bodyEnd);
}

/**
 * A markdown heading OR a bold paragraph lead-in ("**Label** …") at the start of a line — the two
 * shapes a spec uses to introduce a labelled block within a section. Sorted by position, so the
 * caller can strip "from this block's start to the next block's start" regardless of which kind
 * either one is — a real spec mixes `### Sub-heading` and bare `**Bold label**` freely.
 */
function blockStarts(text: string): { index: number; text: string }[] {
  const out: { index: number; text: string }[] = allHeadings(text).map((h) => ({ index: h.index, text: h.text }));
  const boldLeadIn = /^\s*\*\*([^*]+)\*\*/;
  let pos = 0;
  for (const line of text.split('\n')) {
    const m = line.match(boldLeadIn);
    if (m) out.push({ index: pos, text: m[1] });
    pos += line.length + 1;
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Strip every block (see `blockStarts`) whose own label text satisfies `matches`, from its start
 * to the next block's start, or to the end of `text`. */
function stripBlocks(text: string, matches: (blockText: string) => boolean): string {
  const blocks = blockStarts(text);
  let result = text;
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (!matches(blocks[i].text)) continue;
    const end = i + 1 < blocks.length ? blocks[i + 1].index : text.length;
    result = result.slice(0, blocks[i].index) + result.slice(end);
  }
  return result;
}

const ALIAS_HEADING = /never use|alias/i;

/**
 * Strip the two regions a nodes section can contain that name node types WITHOUT using them:
 * a "never use these names" / aliases sub-heading (verbatim from `TEMPLATE.md`, or a spec's own
 * pre-send checklist quoting it back), and checklist lines (`- [ ]` / `- [x]`) generally, which
 * attest to a rule rather than declare a node. This feeds `unknown-token` and `legacy-alias`,
 * which stay section-wide: an alias offered anywhere in the nodes section, including as a
 * distractor, is a real defect (see `stripDistractors` below for why that is NOT true of every
 * rule that reads this section).
 */
function stripQuotedNodeNames(text: string): string {
  const headingStripped = stripBlocks(text, (t) => ALIAS_HEADING.test(t));
  return headingStripped
    .split('\n')
    .filter((line) => !/^\s*-\s\[[ xX]\]/.test(line))
    .join('\n');
}

// A distractor block — "Distractors worth offering", "Tempting wrong nodes" — deliberately names
// nodes that must NOT be placed, so it must not feed anything that infers a placement from a
// mention: splitter-without-paths, ai-without-model, type-reused. It stays visible to
// unknown-token/legacy-alias (an alias offered as bait is still a bait node with the wrong name).
const DISTRACTOR_BLOCK = /distractor|tempting wrong|wrong pick|worth offering/i;

/** Strip distractor blocks from an (already alias/checklist-stripped) nodes section, leaving only
 * the text placement-derived rules (`type-reused`, `splitter-without-paths`, `ai-without-model`)
 * should read. A mention inside "Distractors worth offering" is bait, not a placement — the
 * document says so explicitly ("reaching for a router in a flow that has nothing to route"). */
function stripDistractors(text: string): string {
  return stripBlocks(text, (t) => DISTRACTOR_BLOCK.test(t));
}

// A heading counts as the nodes section if it names nodes at all, UNLESS it is the "never use
// these names" warning — that heading also says "names" and would otherwise self-match.
const NEVER_USE_OR_ALIAS = /\b(never use|alias(es)?)\b/i;
const nodesHeadingMatches = (text: string): boolean => /\bnodes?\b/i.test(text) && !NEVER_USE_OR_ALIAS.test(text);
const flowHeadingMatches = (text: string): boolean => /\bflow\b/i.test(text);
const examplesHeadingMatches = (text: string): boolean => /\b(example|examples|case|cases|test|tested)\b/i.test(text);

/**
 * Lint one filled-in case spec.
 *
 * Every rule here has already forced a case to be redesigned AFTER it was written, which is the
 * most expensive failure this pipeline has. All of them are decidable from the text.
 *
 * Three things this deliberately is NOT:
 *  - A whole-document token scan. A spec's own slug, its schema/column field names, and prose
 *    about OTHER cases' aliases are indistinguishable from a real node id by shape alone, and the
 *    only place node ids are actually placed is the nodes section — so every node-token rule is
 *    scoped to it, and an unrecognised token is a WARNING (`unknown-token`), never an error,
 *    because a field name shaped like a node id is the common case, not the rare one.
 *  - Reliant on `TEMPLATE.md`'s exact `## N.` heading shape or wording. A resolved spec keeps
 *    whatever heading wording and level it ended up with ("Node vocabulary", "The cases the flow
 *    gets tested on"), so each section is found by a broad keyword match, and a section this rule
 *    needs but genuinely cannot find degrades to a `section-not-found` warning naming which check
 *    it skipped, rather than guessing or erroring on the absence.
 *  - A per-backtick reuse count. `type-reused`, `splitter-without-paths` and `ai-without-model`
 *    read the PLACEMENT set — one entry per list item or table row (see `placements`), with
 *    distractor blocks excluded (see `stripDistractors`) — because a node named in prose, or
 *    offered only as bait, was never actually put on the canvas. `unknown-token` and
 *    `legacy-alias` read the wider, distractor-INCLUSIVE section text, because a real node
 *    mentioned anywhere in the nodes section — bait or answer — is still that node, correctly or
 *    incorrectly named.
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
  const nodesSectionRaw = findSection(md, nodesHeadingMatches, headings);
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

    // Placement-derived rules read the distractor-excluded text: a node named only as bait was
    // never actually put on the canvas, so it must not look like a splitter, a model-less AI
    // step, or a reused type.
    const placed = placements(stripDistractors(nodesSection)).filter((t) => t in NODE_CATALOG);
    hasSplitterToken = placed.some((t) => SPLITTERS.includes(t));

    const seen = new Set<string>();
    for (const t of placed) {
      if (seen.has(t)) {
        err(
          'type-reused',
          `\`${t}\` is named twice — nodeSetup is keyed by node type, so both copies share one answer key`
        );
        break;
      }
      seen.add(t);
    }

    if (placed.some((t) => AI_ROOTS.includes(t)) && !placed.some(isModel)) {
      err(
        'ai-without-model',
        'an AI step is named with no chat model — pick `google-gemini-chat-model` or `openai-chat-model`'
      );
    }
  }

  // --- The flow section: only consulted when a splitter was actually named in the nodes
  // section, because a linear case has no exits to check.
  if (hasSplitterToken) {
    const flowSection = findSection(md, flowHeadingMatches, headings);
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
  const examplesSection = findSection(md, examplesHeadingMatches, headings);
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
