import { describe, it, expect } from 'vitest';
import { parseIrisMarkdown, parseInline } from './irisMarkdown.js';

const texts = (spans) => spans.map((s) => s.text).join('');

describe('the reply that started this', () => {
  // Verbatim from the drawer, where it rendered as one paragraph with the hyphens buried
  // mid-sentence: "...wondering about: - What the workflow should do overall? - What a..."
  const reply = [
    "I'd be happy to help you understand the problem. Could you tell me what part of the challenge is unclear to you right now? For example, are you wondering about:",
    '',
    '- What the workflow should do overall?',
    '- What a specific node or feature does?',
    '- How to approach the next step?',
    '',
    'Once I know what\'s confusing, I can explain the concept behind it.',
  ].join('\n');

  const blocks = parseIrisMarkdown(reply);

  it('comes out as paragraph, list, paragraph', () => {
    expect(blocks.map((b) => b.kind)).toEqual(['p', 'ul', 'p']);
  });

  it('keeps the three options as three list items', () => {
    expect(blocks[1].items).toHaveLength(3);
    expect(texts(blocks[1].items[0])).toBe('What the workflow should do overall?');
    expect(texts(blocks[1].items[2])).toBe('How to approach the next step?');
  });

  it('strips the bullet marker, since the list renders its own', () => {
    for (const item of blocks[1].items) expect(texts(item)).not.toMatch(/^[-*•]/);
  });

  it('keeps the closing question as its own paragraph', () => {
    expect(texts(blocks[2].spans)).toMatch(/^Once I know/);
  });
});

describe('block structure', () => {
  it('joins wrapped lines into one paragraph', () => {
    // A model streaming prose emits soft line breaks that are not paragraph breaks.
    const blocks = parseIrisMarkdown('The trigger starts it.\nNothing has to arrive.');
    expect(blocks).toHaveLength(1);
    expect(texts(blocks[0].spans)).toBe('The trigger starts it. Nothing has to arrive.');
  });

  it('treats a blank line as a paragraph break', () => {
    expect(parseIrisMarkdown('One.\n\nTwo.').map((b) => b.kind)).toEqual(['p', 'p']);
  });

  it('groups consecutive bullets into a single list', () => {
    const blocks = parseIrisMarkdown('- a\n- b\n- c');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: 'ul' });
    expect(blocks[0].items).toHaveLength(3);
  });

  it('reads numbered lists, and does not merge them with bullets', () => {
    const blocks = parseIrisMarkdown('- a\n1. first\n2. second');
    expect(blocks.map((b) => b.kind)).toEqual(['ul', 'ol']);
    expect(blocks[1].items).toHaveLength(2);
  });

  it('accepts the three bullet characters a model actually emits', () => {
    for (const mark of ['-', '*', '•']) {
      expect(parseIrisMarkdown(`${mark} one\n${mark} two`)[0].items).toHaveLength(2);
    }
  });

  it('ends a list when prose follows it', () => {
    // Iris usually closes with a question after her options, and that is not an item.
    expect(parseIrisMarkdown('- a\n- b\nWhich of those?').map((b) => b.kind)).toEqual(['ul', 'p']);
  });

  it('returns nothing for empty or absent text', () => {
    expect(parseIrisMarkdown('')).toEqual([]);
    expect(parseIrisMarkdown(undefined)).toEqual([]);
    expect(parseIrisMarkdown('   \n  \n')).toEqual([]);
  });
});

describe('inline spans', () => {
  it('reads bold and inline code', () => {
    const spans = parseInline('Use **Edit Fields**, then read `$json.current`.');
    expect(spans.map((s) => s.kind)).toEqual(['text', 'bold', 'text', 'code', 'text']);
    expect(spans[1].text).toBe('Edit Fields');
    expect(spans[3].text).toBe('$json.current');
  });

  it('does not mistake ** for two single asterisks', () => {
    expect(parseInline('**both**').map((s) => s.kind)).toEqual(['bold']);
  });

  it('leaves a lone asterisk alone', () => {
    // Multiplication, a footnote marker, or a half-typed emphasis. Not a format error.
    expect(texts(parseInline('3 * 4 = 12'))).toBe('3 * 4 = 12');
  });
});

describe('streaming: every partial string must render', () => {
  const full = "Two things matter here. **Read the Input pane** first, then ask what `weather_code` means.\n\n- One\n- Two";

  it('never throws and never loses characters, at any prefix', () => {
    for (let i = 0; i <= full.length; i++) {
      const blocks = parseIrisMarkdown(full.slice(0, i));
      // Everything that arrived is still on screen somewhere, markers aside.
      const rendered = blocks
        .flatMap((b) => (b.kind === 'p' ? [texts(b.spans)] : b.items.map(texts)))
        .join(' ');
      const arrived = full.slice(0, i).replace(/[*`\-\n]/g, '').replace(/\s+/g, ' ').trim();
      const shown = rendered.replace(/\s+/g, ' ').trim();
      // The rendered text contains every word that had arrived.
      for (const word of arrived.split(' ').filter((w) => w.length > 2)) {
        expect(shown, `lost "${word}" at prefix ${i}`).toContain(word);
      }
    }
  });

  it('shows an unterminated bold marker literally rather than hiding the text', () => {
    expect(texts(parseInline('This is **import'))).toBe('This is **import');
  });
});
