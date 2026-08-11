import { describe, it, expect } from 'vitest';
import { lintSpec, nodeTokens } from './specLint.ts';

/** A minimal spec that passes every rule, so each test can break exactly one thing. Node items
 * are numbered list entries, like a real filled-in spec, and the AI model gets its OWN item
 * (item 3) rather than being mentioned inline on the classifier's line — that is how the two real
 * specs with an AI step actually write it, and it is what makes the model a PLACEMENT rather than
 * just prose on someone else's line. */
const GOOD = `
## 3. The shape of the flow
| Path name | What lands here |
|---|---|
| urgent | anything on fire |
| normal | everything else |

## 4. The nodes
**Nodes this case needs**, in the order they run:
> 1. \`form-trigger\` — captures the request.
> 2. \`text-classifier\` — sorts it into a path.
> 3. \`google-gemini-chat-model\` — the brain attached to the classifier.
> 4. \`switch\` — routes on the category.
> 5. \`slack\` — flags urgent ones.
> 6. \`gmail\` — replies to everything else.

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
    const twice = GOOD.replace(
      '> 6. `gmail` — replies to everything else.',
      '> 6. `slack` — replies to everything else.'
    );
    expect(lintSpec(twice)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'type-reused' })
    );
  });

  it('rejects an AI step with no model attached', () => {
    const noBrain = GOOD.replace('> 3. `google-gemini-chat-model` — the brain attached to the classifier.\n', '');
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

  // --- Round 1 regression coverage: a document-wide token scan, and a section parser that
  // assumed TEMPLATE.md's pristine `## N.` structure instead of tolerating a resolved spec.

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

  // --- Round 2 regression coverage: `type-reused` was counting a node named again in prose
  // describing an already-placed item (not a second instance), and the nodes/examples heading
  // keywords were too narrow to find either real spec's actual heading wording.

  it('finds a nodes section headed "Node vocabulary" and actually runs its rules', () => {
    const vocab = GOOD.replace('## 4. The nodes', '## 4. Node vocabulary');
    const notFound = lintSpec(vocab).find(
      (i) => i.rule === 'section-not-found' && i.message.includes('nodes section')
    );
    expect(notFound).toBeUndefined();

    // Prove the rules actually run under this heading, not just that lookup succeeds.
    const vocabWithAlias = vocab.replace('`text-classifier`', '`classify`');
    expect(lintSpec(vocabWithAlias).find((i) => i.rule === 'legacy-alias')).toBeDefined();
  });

  it('finds an examples section headed "The cases the flow gets tested on"', () => {
    const cases = GOOD.replace(
      '## 5. Examples to test it with',
      '## 5. The cases the flow gets tested on'
    );
    const notFound = lintSpec(cases).find(
      (i) => i.rule === 'section-not-found' && i.message.includes('examples section')
    );
    expect(notFound).toBeUndefined();
  });

  it('does not flag type-reused when a later item only refers back to an earlier node in prose', () => {
    const backref = GOOD.replace(
      '> 4. `switch` — routes on the category.',
      '> 4. `switch` — routes on the category the `text-classifier` step already decided.'
    );
    expect(lintSpec(backref).find((i) => i.rule === 'type-reused')).toBeUndefined();
  });

  // A genuine reuse — two list items whose first token is the same node type — is covered above
  // by "rejects the same node type used twice, because nodeSetup is keyed by type".

  // --- Round 3 regression coverage: `trial-signup-desk.md` expresses its answer as a markdown
  // TABLE, not list items, so placement extraction found nothing to protect there; and `switch`
  // named only inside "Distractors worth offering" — explicit bait for a flow the spec itself
  // calls linear — was read as a real placement and wrongly demanded a path table for it.

  it('sees a node placed in a table row as a placement (a genuine table-based splitter with no paths still errors)', () => {
    const tableSpec = `
## 3. The shape of the flow
| Path name | What lands here |
|---|---|
| urgent | anything on fire |

## 4. The nodes
| Stage | Node | Type |
|---|---|---|
| 1 | Trigger | \`form-trigger\` |
| 2 | Router | \`switch\` |

## 5. Examples to test it with
**The awkward one — Required.**
> A submission naming a product nobody stocks, which matches no path.
`;
    expect(lintSpec(tableSpec)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'splitter-without-paths' })
    );
  });

  it('rejects the same node type used twice across two table rows', () => {
    const tableReuse = `
## 4. The nodes
| Stage | Node | Type |
|---|---|---|
| 1 | Trigger | \`form-trigger\` |
| 2 | Notify | \`gmail\` |
| 3 | Notify again | \`gmail\` |

## 5. Examples to test it with
**The awkward one — Required.**
> A submission naming a product nobody stocks, which matches no path.
`;
    expect(lintSpec(tableReuse)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'type-reused' })
    );
  });

  it('does not flag splitter-without-paths or type-reused for a node named only inside a distractor list', () => {
    const distractorSpec = `
## 3. The shape of the flow
Linear.

## 4. The nodes
> 1. \`form-trigger\` — captures the request.
> 2. \`gmail\` — replies.

**Distractors worth offering**

> - \`switch\` — reaching for a router in a flow that has nothing to route.
> - \`gmail\` — tempting to add a second reply node here, but one is enough.

## 5. Examples to test it with
**The awkward one — Required.**
> A submission naming a product nobody stocks, which matches no path.
`;
    const issues = lintSpec(distractorSpec);
    expect(issues.find((i) => i.rule === 'splitter-without-paths')).toBeUndefined();
    expect(issues.find((i) => i.rule === 'type-reused')).toBeUndefined();
  });

  it('still flags a legacy alias even when it is only offered as a distractor', () => {
    const aliasDistractor = GOOD.replace(
      '## 5. Examples to test it with',
      '**Distractors worth offering**\n\n> - `classify` — a plausible wrong pick.\n\n## 5. Examples to test it with'
    );
    expect(lintSpec(aliasDistractor).find((i) => i.rule === 'legacy-alias')).toBeDefined();
  });
});
