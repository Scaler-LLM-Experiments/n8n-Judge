import { describe, it, expect, vi } from 'vitest';
import { createTraceQueue } from './traceQueue.js';

// The queue sits between the journey and the network. Its job is that losing a
// connection, or reloading mid-session, never loses what the learner did — and
// never double-reports it either.
//
// `send` is injected so all of this is testable without a server.

const flushAll = async () => {
  // let queued microtasks settle
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

function harness({ fail = 0, size = 3 } = {}) {
  const batches = [];
  let failures = fail;
  const send = vi.fn(async (events) => {
    if (failures > 0) {
      failures -= 1;
      throw new Error('network down');
    }
    batches.push(events);
    return { accepted: events.length };
  });
  const q = createTraceQueue({ send, maxBatch: size, flushDelayMs: 0 });
  return { q, send, batches };
}

describe('numbering', () => {
  it('numbers events from zero, in the order they happened', async () => {
    const { q, batches } = harness();
    q.push('screen_transition', { from: 'a', to: 'b' });
    q.push('ndv_open', { nodeType: 'classify' });
    q.push('session_complete', {});
    await q.flush();
    expect(batches[0].map((e) => e.clientSeq)).toEqual([0, 1, 2]);
    expect(batches[0].map((e) => e.type)).toEqual(['screen_transition', 'ndv_open', 'session_complete']);
  });

  it('stamps every event with a timestamp', async () => {
    const { q, batches } = harness();
    q.push('session_complete', {});
    await q.flush();
    expect(batches[0][0].clientTs).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('keeps counting across flushes, so numbers never repeat', async () => {
    const { q, batches } = harness();
    q.push('ndv_open', { nodeType: 'a' });
    await q.flush();
    q.push('ndv_open', { nodeType: 'b' });
    await q.flush();
    expect(batches[0][0].clientSeq).toBe(0);
    expect(batches[1][0].clientSeq).toBe(1);
  });
});

describe('batching', () => {
  it('sends automatically once the batch is full', async () => {
    const { q, send } = harness({ size: 3 });
    q.push('ndv_open', { nodeType: 'a' });
    q.push('ndv_open', { nodeType: 'b' });
    expect(send).not.toHaveBeenCalled();
    q.push('ndv_open', { nodeType: 'c' });
    await flushAll();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('does nothing when there is nothing to send', async () => {
    const { q, send } = harness();
    await q.flush();
    expect(send).not.toHaveBeenCalled();
  });
});

describe('losing the connection', () => {
  it('keeps events and re-sends them on the next flush', async () => {
    const { q, send, batches } = harness({ fail: 1 });
    q.push('ndv_open', { nodeType: 'a' });
    await q.flush(); // fails
    expect(batches).toHaveLength(0);
    await q.flush(); // succeeds
    expect(batches[0].map((e) => e.type)).toEqual(['ndv_open']);
  });

  it('does not renumber events after a failure — a retry is the same event', async () => {
    const { q, batches } = harness({ fail: 1 });
    q.push('ndv_open', { nodeType: 'a' });
    await q.flush();
    q.push('ndv_open', { nodeType: 'b' });
    await q.flush();
    expect(batches[0].map((e) => e.clientSeq)).toEqual([0, 1]);
  });

  it('reports how many are still waiting', async () => {
    const { q } = harness({ fail: 1 });
    q.push('ndv_open', { nodeType: 'a' });
    expect(q.pending()).toBe(1);
    await q.flush();
    expect(q.pending()).toBe(1); // still unsent
    await q.flush();
    expect(q.pending()).toBe(0);
  });
});

describe('surviving a reload', () => {
  it('hands back unsent events and the counter so a new queue can resume', async () => {
    const { q } = harness({ fail: 1 });
    q.push('ndv_open', { nodeType: 'a' });
    q.push('ndv_open', { nodeType: 'b' });
    await q.flush(); // fails, both still pending

    const saved = q.snapshot();
    expect(saved.pending).toHaveLength(2);
    expect(saved.nextSeq).toBe(2);

    // A fresh queue restored from that snapshot must continue, not restart.
    const batches = [];
    const resumed = createTraceQueue({
      send: async (events) => { batches.push(events); },
      restore: saved,
    });
    resumed.push('session_complete', {});
    await resumed.flush();
    expect(batches[0].map((e) => e.clientSeq)).toEqual([0, 1, 2]);
  });
});

describe('not blocking the journey', () => {
  it('never throws at the caller when the network fails', async () => {
    const { q } = harness({ fail: 99 });
    expect(() => q.push('ndv_open', { nodeType: 'a' })).not.toThrow();
    await expect(q.flush()).resolves.not.toThrow();
  });

  it('drops the OLDEST events rather than growing without limit', async () => {
    // A learner offline for a long session must not fill up their browser. When
    // something has to go it should be the oldest: an admin looking at someone
    // stuck needs what just happened, not the first minute.
    const q = createTraceQueue({
      send: async () => { throw new Error('down'); },
      maxPending: 5,
      maxBatch: 1000,
      flushDelayMs: 10_000,
    });
    for (let i = 0; i < 20; i++) q.push('ndv_open', { nodeType: `n${i}` });

    expect(q.pending()).toBe(5);
    expect(q.snapshot().pending.map((e) => e.payload.nodeType)).toEqual(['n15', 'n16', 'n17', 'n18', 'n19']);
    // Eviction does not renumber: these are still events 15..19.
    expect(q.snapshot().pending.map((e) => e.clientSeq)).toEqual([15, 16, 17, 18, 19]);
    q.stop();
  });
});
