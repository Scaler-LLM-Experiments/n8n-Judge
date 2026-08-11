import { describe, it, expect } from 'vitest';
import { lintSpec, nodeTokens } from './specLint.ts';

/** A minimal spec that passes every rule, so each test can break exactly one thing. */
const GOOD = `
## 3. The shape of the flow
| Path name | What lands here |
|---|---|
| urgent | anything on fire |
| normal | everything else |

## 4. The nodes
**Nodes this case needs**, in the order they run:
> \`form-trigger\` then \`text-classifier\` with \`google-gemini-chat-model\`, then \`switch\`, ending at \`slack\` or \`gmail\`.

## 5. Examples to test it with
**The awkward one — Required.**
> A submission naming a product nobody stocks, which matches no path.
`;

/**
 * A "resolved" spec shaped like `trial-signup-desk.md`: no `## 3.`/`## 4.` numbering, no `>`
 * blockquote answer format, and backticked field names sitting right next to real node names —
 * exactly the shape that turned a whole-document, TEMPLATE.md-shaped scan into a false-positive
 * machine on every already-shipped case.
 */
const RESOLVED = `
# Case spec — Ferry Booking Desk

## 1. Identity
| Field | Value |
|---|---|
| **Slug** | \`ferry-booking-desk\` |

## 2. The scenario
Passengers submit \`subject\` and \`urgency\` values; the sheet also carries a \`bean\` column left
over from a copy-pasted template — none of these are nodes.

## 3. Node vocabulary

| Stage | Node | Type | Purpose |
|---|---|---|---|
| 1 | Trigger | \`form-trigger\` | Captures the booking |
| 2 | Notify | \`gmail\` | Confirms the booking |

## 4. The cases the flow gets tested on
Nothing unusual.
`;

describe('lintSpec', () => {
  it('passes a spec that names real, canonical nodes and gives every path an ending', () => {
    expect(lintSpec(GOOD).filter((i) => i.level === 'error')).toEqual([]);
  });

  it('flags a node type that does not exist as a warning, not an error', () => {
    const issues = lintSpec(GOOD.replace('`slack`', '`slack-notifier`'));
    const unknown = issues.find((i) => i.rule === 'unknown-token');
    expect(unknown?.level).toBe('warning');
    expect(unknown?.message).toContain('slack-notifier');
  });

  it('rejects a legacy alias and names the canonical replacement', () => {
    const issues = lintSpec(GOOD.replace('`text-classifier`', '`classify`'));
    const alias = issues.find((i) => i.rule === 'legacy-alias');
    expect(alias?.level).toBe('error');
    expect(alias?.message).toContain('text-classifier');
  });

  it('rejects a splitting node with fewer than two named paths', () => {
    const oneRow = GOOD.replace('| normal | everything else |\n', '');
    expect(lintSpec(oneRow)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'splitter-without-paths' })
    );
  });

  it('rejects the same node type used twice, because nodeSetup is keyed by type', () => {
    const twice = GOOD.replace('ending at `slack` or `gmail`', 'ending at `slack`, then another `slack`');
    expect(lintSpec(twice)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'type-reused' })
    );
  });

  it('rejects an AI step with no model attached', () => {
    const noBrain = GOOD.replace(' with `google-gemini-chat-model`', '');
    expect(lintSpec(noBrain)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'ai-without-model' })
    );
  });

  it('rejects a blank awkward example, because Stress Testing is built from it', () => {
    const blank = GOOD.replace(
      '> A submission naming a product nobody stocks, which matches no path.',
      '>'
    );
    expect(lintSpec(blank)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'no-awkward-example' })
    );
  });

  it('finds node tokens and ignores prose backticks', () => {
    expect(nodeTokens('use `switch` when `moderate` difficulty')).toContain('switch');
    expect(nodeTokens('use `switch` when `moderate` difficulty')).not.toContain('moderate');
  });

  // --- Regression coverage for the two defects the first cut of this linter shipped with:
  // a document-wide token scan, and a section parser that assumed TEMPLATE.md's pristine
  // `## N.` structure instead of tolerating a spec that has already been resolved into a case.

  it('produces zero errors on a resolved-shaped spec whose field names look like node ids', () => {
    expect(lintSpec(RESOLVED).filter((i) => i.level === 'error')).toEqual([]);
  });

  it('does not flag a legacy alias quoted inside a "Never use these names" block', () => {
    const withAliasNote = GOOD.replace(
      '## 5. Examples to test it with',
      '### Never use these names\n\nUsing `classify` instead of `text-classifier` produces a worse challenge.\n\n## 5. Examples to test it with'
    );
    expect(lintSpec(withAliasNote).find((i) => i.rule === 'legacy-alias')).toBeUndefined();
  });
});
