import { describe, it, expect } from 'vitest';
import { emailTriage } from './emailTriage.js';

describe('emailTriage problem spec', () => {
  it('has 4 test cases and 2 eval questions', () => {
    expect(emailTriage.testCases).toHaveLength(4);
    expect(emailTriage.evalQuestions).toHaveLength(2);
  });

  it('every eval question has a valid correctIndex within its options', () => {
    for (const q of emailTriage.evalQuestions) {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
    }
  });

  it('the palette includes every required node type', () => {
    const requiredTypes = new Set(
      emailTriage.nodePalette.filter((n) => !n.isDistractor).map((n) => n.type)
    );
    for (const type of ['trigger', 'classify', 'parse', 'switch', 'action']) {
      expect(requiredTypes.has(type)).toBe(true);
    }
  });

  it('the palette includes at least one distractor node', () => {
    expect(emailTriage.nodePalette.some((n) => n.isDistractor)).toBe(true);
  });

  it('every reference graph node has a numeric canvas position', () => {
    for (const node of emailTriage.referenceGraph.nodes) {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
    }
  });
});
