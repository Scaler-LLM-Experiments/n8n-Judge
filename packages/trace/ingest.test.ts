import { describe, it, expect } from 'vitest';
import { planIngest } from './ingest.ts';
import { clientTraceBatchSchema } from './events.ts';

// Batch ingest has two jobs that are easy to get subtly wrong, so they live in a
// pure function rather than inline in the route: allocating the server's `seq`,
// and dropping events already stored so a re-send after a dropped connection is
// a no-op instead of a duplicate.

const at = '2026-07-28T09:00:00.000Z';
const ev = (clientSeq: number, type = 'ndv_open', payload: unknown = { nodeType: 'classify' }) => ({
  clientSeq,
  type,
  payload,
  clientTs: at,
});

describe('planIngest — seq allocation', () => {
  it('numbers new rows consecutively after the highest seq already stored', () => {
    const { rows } = planIngest({ events: [ev(1), ev(2), ev(3)], existingClientSeqs: [], maxSeq: 10 });
    expect(rows.map((r) => r.seq)).toEqual([11, 12, 13]);
  });

  it('starts at 1 on an empty session', () => {
    const { rows } = planIngest({ events: [ev(0)], existingClientSeqs: [], maxSeq: 0 });
    expect(rows[0].seq).toBe(1);
  });

  it('keeps each event’s own clientSeq', () => {
    const { rows } = planIngest({ events: [ev(4), ev(5)], existingClientSeqs: [], maxSeq: 0 });
    expect(rows.map((r) => r.clientSeq)).toEqual([4, 5]);
  });

  it('orders by clientSeq, so an out-of-order batch is stored in the order it happened', () => {
    const { rows } = planIngest({ events: [ev(3), ev(1), ev(2)], existingClientSeqs: [], maxSeq: 0 });
    expect(rows.map((r) => r.clientSeq)).toEqual([1, 2, 3]);
    expect(rows.map((r) => r.seq)).toEqual([1, 2, 3]);
  });
});

describe('planIngest — idempotency', () => {
  it('drops events already stored', () => {
    const { rows, skipped } = planIngest({
      events: [ev(1), ev(2), ev(3)],
      existingClientSeqs: [1, 2],
      maxSeq: 7,
    });
    expect(skipped).toEqual([1, 2]);
    expect(rows.map((r) => r.clientSeq)).toEqual([3]);
    expect(rows.map((r) => r.seq)).toEqual([8]);
  });

  it('writes nothing when the whole batch was already received', () => {
    const { rows, skipped } = planIngest({
      events: [ev(1), ev(2)],
      existingClientSeqs: [1, 2],
      maxSeq: 5,
    });
    expect(rows).toEqual([]);
    expect(skipped).toEqual([1, 2]);
  });

  it('de-duplicates a clientSeq repeated inside one batch', () => {
    // A retrying client can append the same event twice before flushing.
    const { rows } = planIngest({ events: [ev(1), ev(1), ev(2)], existingClientSeqs: [], maxSeq: 0 });
    expect(rows.map((r) => r.clientSeq)).toEqual([1, 2]);
  });
});

describe('what a client is allowed to report', () => {
  it('refuses `decision` events', () => {
    // Decisions are recorded by /check, server-side, because the recording is
    // what stops that endpoint being a free answer oracle. Accepting them here
    // would duplicate every graded row and let the client narrate its own
    // grading.
    const parsed = clientTraceBatchSchema.safeParse({
      events: [
        {
          clientSeq: 1,
          type: 'decision',
          payload: { decision: { id: 'x', kind: 'field', label: 'l', correct: true, firstTry: true } },
          clientTs: at,
        },
      ],
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.errors[0].message).toMatch(/decision/i);
  });

  it('accepts the event types the client owns', () => {
    const parsed = clientTraceBatchSchema.safeParse({
      events: [
        ev(1, 'screen_transition', { from: 'statement', to: 'dashboard' }),
        ev(2, 'graph_mutation', { op: 'add_node', nodeType: 'classify', graph: { nodes: [], edges: [] } }),
        ev(3, 'run_result', { graph: { nodes: [], edges: [] }, validation: { allPassed: true } }),
        ev(4, 'session_complete', {}),
      ],
    });
    expect(parsed.success).toBe(true);
  });
});
