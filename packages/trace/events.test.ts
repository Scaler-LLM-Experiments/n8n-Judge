import { describe, it, expect } from 'vitest';
import { traceEventSchema, traceBatchSchema, tracePayloadSchemas } from './events.ts';

// The trace contract is the gate every M2 event passes through. It had no tests,
// and it was already out of step with the app: two of the five graded surfaces
// (`setting` and `placement`) shipped after this enum was written, so their
// events would have been rejected at ingest with nothing to show why.

const at = '2026-07-28T09:00:00.000Z';
// The client numbers its OWN events with clientSeq. `seq` is the server's, and a
// client batch has no business setting it.
const event = (type: string, payload: unknown, clientSeq = 1) => ({ clientSeq, type, payload, clientTs: at });

const decision = (kind: string) => ({
  decision: { id: `${kind}:x`, kind, label: 'A question', correct: true, firstTry: true },
});

describe('decision events', () => {
  // Every kind the app actually records. The client store says `nodePick`, the
  // check API says `placement` for the same choice and `probe` for the follow-up
  // question — the worker replays rows written by both, so both must validate.
  const KINDS = ['dissection', 'nodePick', 'field', 'stress', 'setting', 'placement', 'probe'];

  for (const kind of KINDS) {
    it(`accepts a "${kind}" decision`, () => {
      const parsed = traceEventSchema.safeParse(event('decision', decision(kind)));
      expect(parsed.success).toBe(true);
    });
  }

  it('rejects a kind nobody records', () => {
    expect(traceEventSchema.safeParse(event('decision', decision('vibes'))).success).toBe(false);
  });

  it('carries the retry count the client store dedupes away', () => {
    const parsed = traceEventSchema.safeParse(event('decision', { ...decision('field'), attempt: 3 }));
    expect(parsed.success).toBe(true);
  });
});

describe('the event envelope', () => {
  it('names the offending type when it is unknown', () => {
    const parsed = traceEventSchema.safeParse(event('teleport', {}));
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.errors[0].message).toMatch(/teleport/);
  });

  it('rejects a known type carrying the wrong payload', () => {
    // ndv_open needs a nodeType; an empty object must not slip through.
    expect(traceEventSchema.safeParse(event('ndv_open', {})).success).toBe(false);
  });

  it('requires a client timestamp', () => {
    expect(traceEventSchema.safeParse({ clientSeq: 1, type: 'session_complete', payload: {} }).success).toBe(false);
  });

  it('numbers client events with clientSeq, not the server-owned seq', () => {
    const parsed = traceEventSchema.safeParse(event('session_complete', {}, 7));
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.clientSeq).toBe(7);
  });

  it('ignores a seq the client tries to dictate', () => {
    // Ordering of graded rows is the server's to decide; a client-supplied seq
    // must not survive into what gets written.
    const parsed = traceEventSchema.safeParse({ ...event('session_complete', {}), seq: 999 });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect((parsed.data as Record<string, unknown>).seq).toBeUndefined();
  });
});

describe('every declared payload type is reachable', () => {
  // A type in the map with no valid example is a type nobody can send.
  const samples: Record<string, unknown> = {
    decision: decision('field'),
    screen_transition: { from: 'statement', to: 'dashboard' },
    phase_transition: { phaseId: 'brain' },
    ndv_open: { nodeType: 'classify' },
    graph_mutation: { op: 'add_node', nodeType: 'classify', graph: { nodes: [], edges: [] } },
    probe_shown: { nodeType: 'chat-trigger' },
    run_result: { graph: { nodes: [], edges: [] }, validation: { allPassed: true } },
    ask_ai_turn: { role: 'user', content: 'which node?' },
    session_complete: {},
  };

  it('has a sample for every type in the contract', () => {
    expect(Object.keys(samples).sort()).toEqual(Object.keys(tracePayloadSchemas).sort());
  });

  for (const [type, payload] of Object.entries(samples)) {
    it(`accepts a valid "${type}"`, () => {
      expect(traceEventSchema.safeParse(event(type, payload)).success).toBe(true);
    });
  }
});

describe('batches', () => {
  it('needs at least one event', () => {
    expect(traceBatchSchema.safeParse({ events: [] }).success).toBe(false);
  });

  it('caps a batch so one request cannot dump an unbounded write', () => {
    const many = Array.from({ length: 501 }, (_, i) => event('session_complete', {}, i));
    expect(traceBatchSchema.safeParse({ events: many }).success).toBe(false);
  });

  it('accepts a full-size batch', () => {
    const many = Array.from({ length: 500 }, (_, i) => event('session_complete', {}, i));
    expect(traceBatchSchema.safeParse({ events: many }).success).toBe(true);
  });
});
