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

  // --- Round 4 regression coverage. Three of these are the placement extractor being wrong about
  // which token on a line is the node, in both directions; the fourth is `section-not-found`
  // having only ever been asserted ABSENT, so a `findSection` that always returned '' would have
  // kept the suite green.

  it('takes a list item placement from its first CATALOG-KNOWN token, not its first token', () => {
    // The item leads with its own label, so `switch` is the second backticked token on the line.
    // Reading only the first one saw no splitter at all and let a pathless router through.
    const labelFirst = GOOD.replace(
      '> 4. `switch` — routes on the category.',
      '> 4. `category` (aka `switch`) — routes on the category.'
    ).replace('| normal | everything else |\n', '');
    expect(lintSpec(labelFirst)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'splitter-without-paths' })
    );
  });

  it('does not double-count a label-first item, so its own prose is still just prose', () => {
    const labelFirst = GOOD.replace(
      '> 4. `switch` — routes on the category.',
      '> 4. `category` (aka `switch`) — routes on what the `text-classifier` decided.'
    );
    const issues = lintSpec(labelFirst);
    expect(issues.find((i) => i.rule === 'type-reused')).toBeUndefined();
    expect(issues.find((i) => i.rule === 'splitter-without-paths')).toBeUndefined();
  });

  it('takes a table row placement from its type cell, not from a node named in a prose cell', () => {
    // Row 2's description cell quotes `slack`, which row 3 actually places. Reading the row's
    // first catalog-known token anywhere made row 2 a second `slack` placement and produced a
    // bogus type-reused. The `switch` row and the one-path flow section are here so the same
    // fixture also proves the rows ARE being read — an extractor that saw nothing at all would
    // satisfy the type-reused assertion for the wrong reason.
    const proseCell = `
## 3. The shape of the flow
| Path name | What lands here |
|---|---|
| urgent | anything on fire |

## 4. The nodes
| Stage | Node | Type |
|---|---|---|
| 1 | Trigger | \`form-trigger\` |
| 2 | Notify (replaces the old \`slack\` step) | \`gmail\` |
| 3 | Alert | \`slack\` |
| 4 | Router | \`switch\` |

## 5. Examples to test it with
**The awkward one — Required.**
> A submission naming a product nobody stocks, which matches no path.
`;
    const issues = lintSpec(proseCell);
    expect(issues.find((i) => i.rule === 'type-reused')).toBeUndefined();
    expect(issues).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'splitter-without-paths' })
    );
  });

  it('falls back to the LAST catalog-known token in a row that has no single-token type cell', () => {
    // No cell is a bare token, so the row has to guess — and a type column sits to the RIGHT of a
    // label column. Row 2 names `gmail` first and `switch` last, so only a last-token fallback
    // places the router, and only then does the single path row become an error.
    const noTypeCell = `
## 3. The shape of the flow
| Path name | What lands here |
|---|---|
| urgent | anything on fire |

## 4. The nodes
| Stage | What it does |
|---|---|
| 1 | starts with \`form-trigger\` |
| 2 | not a \`gmail\` — route it with \`switch\` |

## 5. Examples to test it with
**The awkward one — Required.**
> A submission naming a product nobody stocks, which matches no path.
`;
    expect(lintSpec(noTypeCell)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'splitter-without-paths' })
    );
  });

  // The next two are one pair: identical inserted text, differing only in indentation. The nested
  // one must be silent and the top-level one must fire, which is what rules out "the extractor
  // simply stopped counting bullets."
  it('does not count a nested sub-bullet as its own placement', () => {
    const nested = GOOD.replace(
      '> 6. `gmail` — replies to everything else.',
      '> 6. `gmail` — replies to everything else.\n>   - `gmail`: also used for the retry path.'
    );
    expect(lintSpec(nested).find((i) => i.rule === 'type-reused')).toBeUndefined();
  });

  it('still counts a top-level bullet in the same list, so a real reuse is caught', () => {
    const topLevel = GOOD.replace(
      '> 6. `gmail` — replies to everything else.',
      '> 6. `gmail` — replies to everything else.\n> - `gmail`: also used for the retry path.'
    );
    expect(lintSpec(topLevel)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'type-reused' })
    );
  });

  it('warns section-not-found, naming the skipped rules, when there is no nodes section', () => {
    const noNodes = GOOD.replace('## 4. The nodes', '## 4. The pieces it needs');
    expect(lintSpec(noNodes)).toContainEqual({
      level: 'warning',
      rule: 'section-not-found',
      message:
        'could not find the nodes section — skipping unknown-token, legacy-alias, type-reused, ai-without-model',
    });
  });

  it('warns section-not-found for the flow section when a splitter is named but no flow section exists', () => {
    const noFlow = GOOD.replace('## 3. The shape of the flow', '## 3. The shape of it');
    expect(lintSpec(noFlow)).toContainEqual({
      level: 'warning',
      rule: 'section-not-found',
      message: 'could not find the flow section — skipping splitter-without-paths',
    });
  });

  it('emits one warning per distinct token, not one per occurrence', () => {
    const twice = GOOD.replace(
      '> 2. `text-classifier` — sorts it into a path.',
      '> 2. `text-classifier` — sorts it into a path, returning `verdict`.\n>    The `verdict` field is what the router reads.'
    );
    const unknown = lintSpec(twice).filter(
      (i) => i.rule === 'unknown-token' && i.message.includes('verdict')
    );
    expect(unknown).toHaveLength(1);
  });
});
