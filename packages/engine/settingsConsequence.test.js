import { describe, it, expect } from 'vitest';
import { emailTriage } from '@judge/problems/email-triage/index.js';
import { simulateCase } from './simulate.js';

// Node-level Settings have to CHANGE THE RUN, or the Settings tab is a quiz:
// the learner reasons about On Error, gets a tick, and never sees a
// consequence. These tests pin the consequence, so a refactor that quietly
// makes settings inert fails here rather than in front of a learner.

const branches = emailTriage.branches;
const bug = emailTriage.sampleCases.find((c) => c.branch === 'bug_report');
const noMatch = emailTriage.sampleCases.find((c) => c.branch === null || c.branch === undefined);

// A flow with the Chat Model deliberately missing, so the AI node fails.
const withoutModel = (settings) => ({
  nodes: [
    { id: 't', type: 'trigger', data: { label: 'New Email' } },
    { id: 'c', type: 'classify', data: { label: 'Classify with AI', settings } },
    { id: 's', type: 'switch', data: { label: 'Switch' } },
    { id: 'a', type: 'action', data: { label: 'Send Reply' } },
  ],
  edges: [
    { source: 't', target: 'c' },
    { source: 'c', target: 's' },
    { source: 's', target: 'a', sourceHandle: 'bug_report' },
  ],
});

const text = (r) => r.steps.map((s) => s.text).join('\n');

describe('On Error changes what a failure does to the run', () => {
  it('Stop Workflow (the default) halts on the failing node', () => {
    const r = simulateCase(withoutModel(undefined), bug, {}, branches);
    expect(r.delivered).toBe(false);
    expect(text(r)).toMatch(/no Chat Model connected/i);
    expect(text(r)).not.toMatch(/carries on/i);
  });

  it('Continue carries on with nothing to work from, and the email goes unanswered', () => {
    const r = simulateCase(withoutModel({ onError: 'continueRegularOutput' }), bug, {}, branches);
    expect(text(r)).toMatch(/carries on with nothing to work from/i);
    // It kept going — but with no category there is no branch to take, so the
    // reply never lands. Continuing did not rescue anything.
    expect(r.delivered).toBe(false);
    expect(text(r)).toMatch(/matches none of the branches|unanswered/i);
  });

  it('Continue using error output fails visibly instead of silently', () => {
    const r = simulateCase(withoutModel({ onError: 'continueErrorOutput' }), bug, {}, branches);
    expect(r.delivered).toBe(false);
    expect(text(r)).toMatch(/error output/i);
  });

  it('the three settings produce three different narrations', () => {
    const outs = ['stopWorkflow', 'continueRegularOutput', 'continueErrorOutput'].map((onError) =>
      text(simulateCase(withoutModel({ onError }), bug, {}, branches))
    );
    expect(new Set(outs).size).toBe(3);
  });
});

describe('Always Output Data on a router', () => {
  const routed = (settings) => ({
    nodes: [
      { id: 't', type: 'trigger', data: { label: 'New Email' } },
      { id: 'c', type: 'classify', data: { label: 'Classify with AI' } },
      { id: 'm', type: 'chat-gemini', data: { label: 'Gemini Chat Model' } },
      { id: 's', type: 'switch', data: { label: 'Switch', settings } },
      { id: 'a', type: 'action', data: { label: 'Send Reply' } },
    ],
    edges: [
      { source: 'm', target: 'c', targetHandle: 'ai_model' },
      { source: 't', target: 'c' },
      { source: 'c', target: 's' },
      { source: 's', target: 'a', sourceHandle: 'bug_report' },
    ],
  });

  it('off (the default): an unmatched email simply goes unanswered', () => {
    const r = simulateCase(routed(undefined), noMatch, {}, branches);
    expect(r.delivered).toBe(false);
    expect(text(r)).toMatch(/matches none of the branches/i);
    expect(text(r)).not.toMatch(/empty item/i);
  });

  it('on: an unmatched email is pushed down the first branch and gets a blank reply', () => {
    const r = simulateCase(routed({ alwaysOutputData: true }), noMatch, {}, branches);
    expect(text(r)).toMatch(/empty item is pushed down the first branch/i);
    expect(text(r)).toMatch(/blank message/i);
    // Worse than silence: something was sent, and it was wrong.
    expect(r.emptyDelivery).toBe(true);
    expect(r.delivered).toBe(false);
  });
});
