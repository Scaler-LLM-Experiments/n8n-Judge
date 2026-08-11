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

describe('lintSpec', () => {
  it('passes a spec that names real, canonical nodes and gives every path an ending', () => {
    expect(lintSpec(GOOD).filter((i) => i.level === 'error')).toEqual([]);
  });

  it('rejects a node type that does not exist', () => {
    const issues = lintSpec(GOOD.replace('`slack`', '`slack-notifier`'));
    const unknown = issues.find((i) => i.rule === 'unknown-node');
    expect(unknown?.level).toBe('error');
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
});
