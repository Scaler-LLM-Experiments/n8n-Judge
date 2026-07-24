import { describe, it, expect } from 'vitest';
import { checkDrop, currentBuildStepIndex } from './checkDrop.js';
import { emailTriage } from '@judge/problems/email-triage/index.js';

const trigger = emailTriage.nodePalette.find((n) => n.type === 'trigger');
const chatTrigger = emailTriage.nodePalette.find((n) => n.type === 'chat-trigger');
const classify = emailTriage.nodePalette.find((n) => n.type === 'classify');
const switchNode = emailTriage.nodePalette.find((n) => n.type === 'switch');
const action = emailTriage.nodePalette.find((n) => n.type === 'action');
const slack = emailTriage.nodePalette.find((n) => n.type === 'slack-message');

describe('currentBuildStepIndex', () => {
  it('starts at step 0 on an empty canvas', () => {
    expect(currentBuildStepIndex({ nodes: [], edges: [] }, emailTriage)).toBe(0);
  });

  it('advances to step 1 once the trigger is placed', () => {
    const graph = { nodes: [{ id: 'n1', type: 'trigger' }], edges: [] };
    expect(currentBuildStepIndex(graph, emailTriage)).toBe(1);
  });

  it('advances to step 2 once trigger, classify, model, parse, and switch are all placed', () => {
    const graph = {
      nodes: [
        { id: 'n1', type: 'trigger' },
        { id: 'n2', type: 'classify' },
        { id: 'nm', type: 'chat-gemini' },
        { id: 'n3', type: 'parse' },
        { id: 'n4', type: 'switch' },
      ],
      edges: [],
    };
    expect(currentBuildStepIndex(graph, emailTriage)).toBe(2);
  });

  it('stays on step 1 if the chat model is not yet placed', () => {
    const graph = {
      nodes: [
        { id: 'n1', type: 'trigger' },
        { id: 'n2', type: 'classify' },
        { id: 'n3', type: 'parse' },
        { id: 'n4', type: 'switch' },
      ],
      edges: [],
    };
    expect(currentBuildStepIndex(graph, emailTriage)).toBe(1);
  });
});

describe('checkDrop', () => {
  it('allows the trigger on an empty canvas', () => {
    const result = checkDrop({ nodes: [], edges: [] }, trigger, emailTriage);
    expect(result.allowed).toBe(true);
  });

  it('blocks the distractor trigger on an empty canvas', () => {
    const result = checkDrop({ nodes: [], edges: [] }, chatTrigger, emailTriage);
    expect(result.allowed).toBe(false);
  });

  it('blocks an Action-step node while still on the trigger step', () => {
    const result = checkDrop({ nodes: [], edges: [] }, action, emailTriage);
    expect(result.allowed).toBe(false);
  });

  it('allows classify once the trigger step is done', () => {
    const graph = { nodes: [{ id: 'n1', type: 'trigger' }], edges: [] };
    const result = checkDrop(graph, classify, emailTriage);
    expect(result.allowed).toBe(true);
  });

  it('allows the action node but blocks action distractors once on the action step', () => {
    const graph = {
      nodes: [
        { id: 'n1', type: 'trigger' },
        { id: 'n2', type: 'classify' },
        { id: 'nm', type: 'chat-gemini' },
        { id: 'n3', type: 'parse' },
        { id: 'n4', type: 'switch' },
      ],
      edges: [],
    };
    expect(checkDrop(graph, action, emailTriage).allowed).toBe(true);
    expect(checkDrop(graph, slack, emailTriage).allowed).toBe(false);
  });
});
