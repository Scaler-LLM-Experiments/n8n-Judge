import { describe, it, expect } from 'vitest';
import { emailTriage } from './emailTriage.js';

describe('emailTriage problem spec', () => {
  it('has 5 test cases and 2 eval questions', () => {
    expect(emailTriage.testCases).toHaveLength(5);
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
    for (const type of ['trigger', 'classify', 'chat-gemini', 'parse', 'switch', 'action']) {
      expect(requiredTypes.has(type)).toBe(true);
    }
  });

  it('the palette includes at least one distractor node', () => {
    expect(emailTriage.nodePalette.some((n) => n.isDistractor)).toBe(true);
  });

  it('has 3 build phases covering every required node type', () => {
    expect(emailTriage.buildPhases).toHaveLength(3);
    const phaseTypes = new Set(emailTriage.buildPhases.flatMap((p) => p.nodeTypes));
    for (const t of ['trigger', 'classify', 'chat-gemini', 'parse', 'switch', 'action']) {
      expect(phaseTypes.has(t)).toBe(true);
    }
    for (const p of emailTriage.buildPhases) expect(typeof p.coach).toBe('string');
  });

  it('every node-setup section has exactly one correct candidate', () => {
    for (const [type, setup] of Object.entries(emailTriage.nodeSetup)) {
      for (const section of setup.sections) {
        const correct = section.candidates.filter((c) => c.correct);
        expect(correct.length, `${type}/${section.id}`).toBe(1);
        for (const c of section.candidates) expect(typeof c.why).toBe('string');
      }
    }
  });

  it('every probe has exactly one correct ("by mistake") option', () => {
    for (const [type, probe] of Object.entries(emailTriage.nodeProbes)) {
      const correct = probe.options.filter((o) => o.correct);
      expect(correct.length, type).toBe(1);
      for (const o of probe.options) expect(typeof o.response).toBe('string');
    }
  });

  it('every reference graph node has a numeric canvas position', () => {
    for (const node of emailTriage.referenceGraph.nodes) {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
    }
  });
});
