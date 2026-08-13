/**
 * The small slice of markdown Iris is allowed to use, parsed into blocks.
 *
 * ## Why this exists
 *
 * The Ask-Iris drawer rendered the reply as `{m.text}` — one raw string in a div. The model
 * writes markdown, so a three-item list arrived looking like this:
 *
 *   "...are you wondering about: - What the workflow should do overall? - What a specific
 *   node or feature does? - How to approach the next step? Once I know..."
 *
 * Newlines collapse in HTML, so the list became a paragraph with stray hyphens buried in
 * the middle of sentences. The one surface whose whole job is explaining something to a
 * stuck learner was the least readable thing on screen.
 *
 * ## Why a parser and not `white-space: pre-line`
 *
 * `pre-line` keeps the newlines, which fixes the collapsing, and leaves `-` and `**` on
 * screen as punctuation the learner has to read past. A list should look like a list.
 *
 * ## Why not a markdown library
 *
 * The repo has no markdown dependency and this needs four constructs. A library brings a
 * parser, an HTML serialiser and an XSS surface for that. This returns data, the component
 * renders it as React elements, and no HTML is ever interpreted — so a reply cannot inject
 * markup no matter what the model writes.
 *
 * ## Streaming
 *
 * Text arrives a token at a time, so this is called on every partial string and must never
 * throw or hide content. An unterminated `**bold` renders as literal `**bold` until its
 * closing marker arrives. Half a list item is a list item with half its text.
 */

/** Inline spans within one line: plain text, bold, and inline code. */
export function parseInline(text) {
  const spans = [];
  // One pass, longest marker first, so `**` is never mistaken for two `*`.
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) spans.push({ kind: 'text', text: text.slice(last, m.index) });
    const token = m[0];
    if (token.startsWith('**')) spans.push({ kind: 'bold', text: token.slice(2, -2) });
    else spans.push({ kind: 'code', text: token.slice(1, -1) });
    last = m.index + token.length;
  }
  if (last < text.length) spans.push({ kind: 'text', text: text.slice(last) });
  return spans.length ? spans : [{ kind: 'text', text: '' }];
}

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/;

/**
 * Parse a reply into blocks: `{ kind: 'p' | 'ul' | 'ol', spans? , items? }`.
 *
 * A paragraph carries `spans`; a list carries `items`, each an array of spans. Consecutive
 * bullet lines become one list, which is what makes it render as a list rather than as
 * three one-line paragraphs.
 */
export function parseIrisMarkdown(text) {
  const blocks = [];
  const lines = String(text ?? '').split('\n');
  let para = [];
  let list = null;

  const flushPara = () => {
    const joined = para.join(' ').trim();
    if (joined) blocks.push({ kind: 'p', spans: parseInline(joined) });
    para = [];
  };
  const flushList = () => {
    if (list?.items.length) blocks.push(list);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(BULLET);
    const numbered = line.match(NUMBERED);

    if (bullet || numbered) {
      flushPara();
      const kind = bullet ? 'ul' : 'ol';
      // A numbered list following a bulleted one is a new block, not a continuation.
      if (!list || list.kind !== kind) {
        flushList();
        list = { kind, items: [] };
      }
      list.items.push(parseInline((bullet ? bullet[1] : numbered[2]).trim()));
      continue;
    }

    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }

    // Prose after a list ends it. Iris often closes with a question after her options.
    flushList();
    para.push(line.trim());
  }

  flushPara();
  flushList();
  return blocks;
}
