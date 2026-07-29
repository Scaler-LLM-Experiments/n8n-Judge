import { describe, it, expect } from 'vitest';
import { checkAnswer } from '@judge/problem-schema';
import { isCorrectValue } from './FieldControl.jsx';

// `answerCheck.ts` (server) and `FieldControl.jsx` (client) implement the same
// grading rule twice, on purpose — the client needs it for the dev routes where
// there is no session. When they disagree, the same answer grades differently
// depending on whether the request landed, which is the worst bug this project
// has had. So: assert they agree, for every kind, including the new one.
const field = {
  key: 'mailbox',
  label: 'Mailbox',
  kind: 'resourceLocator',
  modes: ['list', 'id'],
  correct: 'INBOX',
  options: [
    { value: 'INBOX', label: 'Inbox' },
    { value: 'SPAM', label: 'Spam' },
  ],
};

const problem = { nodeSetup: { trigger: { fields: [field] } } };
const server = (answer) => checkAnswer(problem, { kind: 'field', id: 'trigger:mailbox', answer }).correct;

describe('resourceLocator grading, server side', () => {
  it('grades the resource regardless of mode', () => {
    expect(server({ __rl: true, mode: 'list', value: 'INBOX' })).toBe(true);
    expect(server({ __rl: true, mode: 'id', value: 'INBOX' })).toBe(true);
  });

  it('rejects the wrong resource', () => {
    expect(server({ __rl: true, mode: 'list', value: 'SPAM' })).toBe(false);
  });

  it('rejects an empty locator', () => {
    expect(server({ __rl: true, mode: 'list', value: '' })).toBe(false);
  });

  // A tampering client could post the bare string. It must still grade correctly
  // rather than throwing or silently passing.
  it('tolerates an unwrapped value', () => {
    expect(server('INBOX')).toBe(true);
    expect(server('SPAM')).toBe(false);
  });

  it('handles a null answer', () => {
    expect(server(null)).toBe(false);
  });
});

describe('client and server agree', () => {
  const answers = [
    { __rl: true, mode: 'list', value: 'INBOX' },
    { __rl: true, mode: 'id', value: 'INBOX' },
    { __rl: true, mode: 'list', value: 'SPAM' },
    { __rl: true, mode: 'list', value: '' },
    'INBOX',
    'SPAM',
    null,
  ];

  it('reaches the same verdict for every answer shape', () => {
    for (const a of answers) {
      expect(isCorrectValue(field, a), JSON.stringify(a)).toBe(server(a));
    }
  });
});
