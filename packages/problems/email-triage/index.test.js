import { describe, it, expect } from 'vitest';
import { emailTriage } from './index.js';

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

  it('every node-setup field is answerable and explains itself', () => {
    for (const [type, setup] of Object.entries(emailTriage.nodeSetup)) {
      for (const field of setup.fields || []) {
        const kind = field.kind ?? 'select';
        if (kind === 'select') {
          const correct = field.options.filter((o) => o.correct);
          expect(correct.length, `${type}/${field.key}`).toBe(1);
          for (const o of field.options) {
            expect(typeof o.why).toBe('string');
            expect(typeof o.label).toBe('string');
          }
        } else if (kind === 'ruleList' || kind === 'assignmentList') {
          // A rule list is graded as three aspects, so it carries the answer as a
          // STRUCTURE (`expect.rules`) and one explanation per aspect per verdict.
          const isRules = kind === 'ruleList';
          const entries = isRules ? field.expect?.rules : field.expect?.assignments;
          expect(Array.isArray(entries), `${type}/${field.key} needs its expected entries`).toBe(true);
          for (const aspect of isRules ? ['count', 'categories', 'conditions'] : ['count', 'names', 'values']) {
            expect(typeof field.why?.[aspect]?.correct, `${type}/${field.key} why.${aspect}.correct`).toBe('string');
            expect(typeof field.why?.[aspect]?.wrong, `${type}/${field.key} why.${aspect}.wrong`).toBe('string');
          }
          // Every vocabulary list needs real wrong choices as well as right ones —
          // a picker containing only correct answers is not a question.
          for (const listKey of isRules
            ? ['branchOptions', 'leftOptions', 'operatorOptions', 'rightOptions']
            : ['nameOptions', 'valueOptions']) {
            const list = field[listKey] ?? [];
            expect(list.length, `${type}/${field.key} ${listKey}`).toBeGreaterThan(1);
            expect(list.some((o) => o.correct === false), `${type}/${field.key} ${listKey} needs a wrong option`).toBe(true);
            for (const o of list) expect(typeof o.why, `${type}/${field.key} ${listKey} why`).toBe('string');
          }
          // The answer must be buildable from what is offered.
          const offered = new Set((isRules ? field.branchOptions : field.nameOptions).map((o) => o.value));
          for (const e of entries) expect(offered.has(isRules ? e.outputKey : e.name), isRules ? e.outputKey : e.name).toBe(true);
        } else {
          // Typed fields (number, expression, text, boolean) grade against
          // `correct` and carry one explanation for each outcome, since there
          // are no per-option `why` strings to fall back on.
          expect(field.correct, `${type}/${field.key} needs a correct value`).toBeDefined();
          expect(typeof field.whyCorrect, `${type}/${field.key} whyCorrect`).toBe('string');
          expect(typeof field.whyWrong, `${type}/${field.key} whyWrong`).toBe('string');
        }
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

// Authored voice lines are where a leak would actually sneak in: the phrase book's
// defaults are reviewed once, but per-problem lines get written alongside content
// and are easy to make too helpful.
describe('emailTriage voice lines', () => {
  const voice = emailTriage.voice ?? {};
  const entries = Object.entries(voice);

  it('authors lines for the moments a learner hears most', () => {
    // A verdict without a reason is the generic version, which is what authoring
    // these was for.
    expect(entries.length).toBeGreaterThan(10);
    expect(voice['answer_wrong:trigger']).toBeTruthy();
    expect(voice['node_placed:switch']).toBeTruthy();
  });

  it('never names the node that answers a still-open question', () => {
    // These play while the question is unanswered, so naming any node type in them
    // would hand the answer over unprompted.
    const nodeNames = /\b(gmail|chat trigger|schedule|webhook|text classifier|switch|edit fields|gemini)\b/i;
    for (const [moment, lines] of entries) {
      if (!/^answer_wrong/.test(moment) && !/^(idle_nudge|node_wrong|problem_intro|stress_start)/.test(moment)) continue;
      for (const line of lines) {
        expect(line, `${moment}: "${line}"`).not.toMatch(nodeNames);
      }
    }
  });

  it('holds the same copy rules as the default phrase book', () => {
    for (const [moment, lines] of entries) {
      for (const line of lines) {
        expect(line, `${moment} em dash`).not.toMatch(/[—–]/);
        expect(line, `${moment} exclamation`).not.toMatch(/!/);
        expect(line, `${moment} expression`).not.toMatch(/\{\{/);
        const words = line.replace(/\[[^\]]*\]/g, '').trim().split(/\s+/).length;
        expect(words, `${moment} is ${words} words`).toBeLessThanOrEqual(22);
      }
    }
  });

  it('opens every line with a delivery tag, so v3 reads it in character', () => {
    for (const [moment, lines] of entries) {
      for (const line of lines) expect(line, `${moment}: "${line}"`).toMatch(/^\[[a-z]+\]/);
    }
  });
});
