import { NODE_CATALOG, LEGACY_ALIASES, isRouterEntry } from '@judge/catalog';

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

type CatalogEntry = { category?: string; needsModel?: boolean; branches?: unknown[] };
const catalogEntries = Object.entries(NODE_CATALOG as Record<string, CatalogEntry>);

/**
 * Nodes with more than one exit. Every exit must lead somewhere or the learner is stuck.
 *
 * **Derived, not listed.** The catalog is the authority on what branches — `isRouterEntry()`
 * says so from an explicit `router` flag, a `branches` array, or more than one `main` output,
 * and `branchReach.js` and the picker both ask it rather than a list. A hand-kept list here
 * drifted the moment the catalog gained a router: it named five types while the catalog knew
 * six, so `guardrails` could split a flow and `splitter-without-paths` never looked.
 */
const SPLITTERS = new Set(catalogEntries.filter(([, e]) => isRouterEntry(e)).map(([t]) => t));

/**
 * AI roots need a model attached over `ai_languageModel`; the picker offers several.
 *
 * Derived from the same field the app reads (`needsModel`) for the same reason as `SPLITTERS`:
 * the hand-kept list named six types against the catalog's nine, so `question-answer-chain` —
 * a real AI root — could be placed with no model and `ai-without-model` never fired. Legacy
 * aliases are deliberately included: `classify` with no model is two defects, not one, and
 * `legacy-alias` reporting the name does not make the missing model untrue.
 */
const AI_ROOTS = new Set(catalogEntries.filter(([, e]) => e.needsModel).map(([t]) => t));

const isModel = (type: string): boolean =>
  (NODE_CATALOG as Record<string, { category?: string }>)[type]?.category === 'model';

/**
 * Every backticked token in `text` that could name a node type, in appearance order, NOT
 * deduplicated — callers that care about reuse need every occurrence, not the unique set.
 *
 * **Two characters is the floor, not three, and the extra character is `if`.** It is the only
 * catalog type shorter than three characters (checked against all 200), and a three-character
 * floor made it invisible to every rule in this file: `nodeTokens` skipped it, so an If-based
 * spec linted to `no-nodes` and `candidateTypes` never offered it while the briefing pack tells
 * the author to stop rather than pick a node absent from the menu; and `placements` skipped it,
 * so `splitter-without-paths` — one of the five unbuildable shapes this linter exists to catch —
 * could never fire for the most common router in n8n.
 *
 * Two characters also matches ordinary English (`to`, `is`, `of`, `at`, `no`), which is why the
 * floor is only lowered for a token the catalog actually knows. Everything three characters and
 * longer is unchanged, and `NOT_NODE_TYPES` still filters the words the template asks an author
 * to backtick.
 */
function matchTokens(text: string): string[] {
  return (text.match(/`[a-z][a-z0-9-]+`/g) ?? [])
    .map((t) => t.slice(1, -1))
    .filter((t) => t.length >= 3 || t in NODE_CATALOG);
}

/**
 * Every node-shaped token anywhere in the document, in order of first appearance. Deliberately
 * document-wide and unscoped by section — Task 3's brief-shrinker consumes this directly and
 * filters by catalog membership itself, so scoping to one section belongs inside `lintSpec`,
 * not here.
 */
export function nodeTokens(md: string): string[] {
  return [...new Set(matchTokens(md))].filter((t) => !NOT_NODE_TYPES.has(t));
}

/** Node-shaped backticked tokens in a slice of text, in appearance order, NOT deduplicated. */
function tokensIn(text: string): string[] {
  return matchTokens(text).filter((t) => !NOT_NODE_TYPES.has(t));
}

/** A list item: numbered (`1.`, `2.`) or bulleted (`-`, `*`). Group 1 is its indent, group 2 the
 * rest of the line — the item's own text, where its tokens live. */
const LIST_ITEM = /^([ \t]*)(?:\d+\.|[-*])[ \t]+(.*)$/;
/** Leading `>` blockquote markers and one space per marker. A spec writes its answer inside a
 * blockquote, so indentation has to be measured after these come off. */
const BLOCKQUOTE = /^(?:[ \t]*>)+[ \t]?/;
const TABLE_ROW = /^[ \t]*\|/;
const TABLE_SEPARATOR_ROW = /^[ \t]*\|[\s|:-]+\|\s*$/;
/** A table cell that is nothing but one backticked token, with or without a `**bold**` wrapper —
 * the shape of a Type column, as opposed to a prose cell that happens to quote a node. */
const TYPE_CELL = /^\*{0,2}`([a-z][a-z0-9-]+)`\*{0,2}$/;

/** Every node-shaped backticked token on one line, in order, NOT deduplicated. */
function lineTokens(line: string): string[] {
  return matchTokens(line);
}

const isPlaceableType = (t: string): boolean => t in NODE_CATALOG && !NOT_NODE_TYPES.has(t);

/**
 * The node one table row places. The Type column is what names the node, so the row's own cells
 * are read first and the FIRST cell whose entire content is a single backticked, catalog-known
 * token wins — a description cell that mentions another node ("Notify (replaces the old `slack`
 * step)") is prose, not a placement, and reading it as one produced a bogus `type-reused`.
 * Only when no cell has that shape does the row fall back to a catalog-known token anywhere in
 * it, and then the LAST one, because a type column sits to the RIGHT of a label column in every
 * spec on disk.
 */
function tableRowPlacement(line: string): string | undefined {
  const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
  for (const cell of cells) {
    const m = cell.trim().match(TYPE_CELL);
    if (m && isPlaceableType(m[1])) return m[1];
  }
  const known = lineTokens(line).filter(isPlaceableType);
  return known.length ? known[known.length - 1] : undefined;
}

/**
 * The node each nodes-section PLACEMENT is about — one entry per list item or table row, not one
 * per backtick. Two shapes, because a spec expresses its answer as one or the other:
 *  - A TOP-LEVEL list item — numbered (`1.`, `2.`) or bulleted (`-`, `*`), with or without a
 *    leading `>` blockquote marker and any `**bold**` wrapper — contributes the first
 *    catalog-known backticked token in its own text. "First token, full stop" was wrong: an item
 *    that leads with its label (`` 2. `category` (aka `switch`) — routes on category. ``)
 *    contributed nothing at all, so a switch with no paths went undetected. A nested sub-item
 *    (indented two or more spaces relative to its list's top level) is elaboration on the item
 *    above it, not a second placement, so it contributes nothing.
 *  - A table row — see `tableRowPlacement`.
 * A continuation line (no list marker, not a table row) contributes nothing either, so prose is
 * always free to refer back to an already-placed node without that reading as reuse.
 */
function placements(text: string): string[] {
  const heads: string[] = [];
  let listBase: number | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.replace(BLOCKQUOTE, '');
    if (TABLE_ROW.test(line)) {
      listBase = null;
      if (!TABLE_SEPARATOR_ROW.test(line)) {
        const placed = tableRowPlacement(line);
        if (placed) heads.push(placed);
      }
      continue;
    }
    const li = line.match(LIST_ITEM);
    if (li) {
      const indent = li[1].replace(/\t/g, '  ').length;
      if (listBase === null || indent < listBase) listBase = indent;
      if (indent >= listBase + 2) continue;
      const placed = lineTokens(li[2]).find(isPlaceableType);
      if (placed) heads.push(placed);
      continue;
    }
    // A blank line separates the items of a loose list; unindented prose or a heading ends it.
    if (line.trim() !== '' && /^[^ \t]/.test(line)) listBase = null;
  }
  return heads;
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
    // One issue per DISTINCT token: a field name mentioned twice in the nodes section is one
    // thing to look at, and printing the identical line twice reads as a bug in the linter.
    const named = new Set(tokensIn(nodesSection));

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
    const placed = placements(stripDistractors(nodesSection));
    hasSplitterToken = placed.some((t) => SPLITTERS.has(t));

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

    if (placed.some((t) => AI_ROOTS.has(t)) && !placed.some(isModel)) {
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
