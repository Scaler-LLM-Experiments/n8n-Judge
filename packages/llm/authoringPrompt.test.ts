import { describe, it, expect } from 'vitest';
import { buildAuthoringPrompt } from './authoringPrompt.ts';
import { PLAIN_LANGUAGE } from '@judge/problem-schema';

// This prompt is a copy of the authoring rules, kept in a second place because the model
// cannot read the skill file. That makes it the one piece of documentation that can be
// wrong in a way nobody notices: a stale rule here produces a draft that validates and
// teaches the wrong thing.
//
// So these tests pin the rules that have ALREADY reversed once, and the ones a drafted
// problem fails validation on if the prompt forgets them.

const prompt = () =>
  buildAuthoringPrompt(
    { statement: 'A flow that triages incoming orders.', program: 'AIML', slug: 'order-desk' },
    { type: 'object' },
    'trigger, classify, switch, action',
    [{ id: 'exemplar' }]
  );

describe('the drafting prompt states the rules as they are now', () => {
  it('carries every plain-language limit, so a draft is not written to be rejected', () => {
    const { system } = prompt();
    // These are validateProblem ERRORS. A prompt that omits one produces drafts that fail
    // validation on copy the model had no way to know was over a cap.
    //
    // The numbers are imported, not restated. This prompt is a second copy of the
    // authoring rules and the one CLAUDE.md records as able to rot unnoticed, so a value
    // written down twice is a value that will disagree with itself.
    for (const [name, limit] of Object.entries(PLAIN_LANGUAGE)) {
      expect(system, `${name} (${limit}) is missing from the drafting prompt`).toContain(String(limit));
    }
    // The ban is absolute, so the prompt has to say so rather than suggest moderation.
    expect(system.toLowerCase()).toMatch(/no em dashes|dashes are banned|banned/);
    // And it has to offer the way out for an answer that must be a real n8n expression,
    // or the option-label cap reads as an impossible instruction.
    expect(system).toMatch(/expression/);
  });

  it('does not demand the retired fixed topology', () => {
    const { system } = prompt();
    // It used to require `trigger → AI → parse → switch → actions` because
    // simulate.js could not walk anything else. It can: roles come from catalog
    // metadata, and linear problems run. Demanding the old shape would refuse most
    // problems worth writing.
    expect(system).not.toMatch(/topology MUST be exactly/i);
    expect(system).toMatch(/Topology is data/);
  });

  it('bans the escape-hatch probe option instead of requiring it', () => {
    const { system } = prompt();
    // The original prompt called "I added it by mistake" the honest correct answer.
    // validateProblem() now rejects it: it lets a learner skip the teaching, and it is
    // never true — they clicked the node because they believed something.
    expect(system).toMatch(/NEVER write an escape hatch/);
    expect(system).toMatch(/never names the right node/i);
  });

  it('carries the copy limits a draft is validated against', () => {
    const { system } = prompt();
    expect(system).toMatch(/THREE WORDS MAXIMUM/);
    expect(system).toMatch(/125 characters/);
  });

  it('requires a misconception code on every wrong probe option', () => {
    expect(prompt().system).toMatch(/misconceptionLabels/);
  });

  it('requires exactly one fall-through case, which Stress Testing needs', () => {
    expect(prompt().system).toMatch(/EXACTLY ONE intentional fall-through/);
  });

  it('asks for the correct option NOT to sit first every time', () => {
    // 25/25 fields and 13/13 dissection items once had it at index 0.
    expect(prompt().system).toMatch(/Vary its position/);
  });

  it('passes the slug through, since clip and cover paths are keyed by it', () => {
    expect(prompt().user).toMatch(/Slug \(use as `id`\): order-desk/);
  });

  it('hands over the catalog and the exemplar, which are the only vocabulary it has', () => {
    const { user } = prompt();
    expect(user).toMatch(/ONLY allowed node types/);
    expect(user).toMatch(/"id": "exemplar"/);
  });
});
