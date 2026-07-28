// The outbound queue for everything the journey observes.
//
// It sits between the screens and the network so that reporting what a learner
// did can never interfere with them doing it. Three rules:
//
//   1. Never throw at the caller. A dropped request must not break the Build
//      stage; the worst outcome of a failed send is a gap in the admin timeline.
//   2. Never renumber. Each event gets a `clientSeq` once, for life. The server
//      treats (session, clientSeq) as the identity of an event, so a re-sent
//      batch is recognised and skipped rather than stored twice.
//   3. Never grow without limit. A learner offline for an hour must not fill
//      their browser's memory.
//
// `send` is injected rather than imported so the whole thing is testable without
// a server, and so the caller owns the URL and the session id.

const DEFAULT_MAX_BATCH = 25;
const DEFAULT_FLUSH_DELAY_MS = 2000;
const DEFAULT_MAX_PENDING = 500;

/**
 * @param {object} opts
 * @param {(events: object[]) => Promise<unknown>} opts.send  delivers one batch
 * @param {number} [opts.maxBatch]      flush automatically at this many events
 * @param {number} [opts.flushDelayMs]  idle delay before an automatic flush
 * @param {number} [opts.maxPending]    hard cap on unsent events
 * @param {{pending: object[], nextSeq: number}} [opts.restore]  resume a snapshot
 */
export function createTraceQueue({
  send,
  maxBatch = DEFAULT_MAX_BATCH,
  flushDelayMs = DEFAULT_FLUSH_DELAY_MS,
  maxPending = DEFAULT_MAX_PENDING,
  restore = null,
} = {}) {
  let pending = restore?.pending ? [...restore.pending] : [];
  let nextSeq = restore?.nextSeq ?? 0;
  let inFlight = false;
  let timer = null;
  // Consecutive failures, for backoff. Without this a batch the server will never
  // accept is retried every couple of seconds forever — and because each attempt
  // opens a transaction that takes a per-session database lock, a failing trace
  // route can starve answer checking on the same session. That is not theoretical:
  // it is how a missing migration turned into learners seeing no verdicts.
  let failures = 0;

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const scheduleFlush = () => {
    if (timer !== null) return;
    // Exponential backoff on consecutive failures, capped at ~2 minutes. Tracing
    // is the least important thing happening on the page; it must never be the
    // reason something that matters is slow.
    const delay = failures === 0 ? flushDelayMs : Math.min(flushDelayMs * 2 ** failures, 120_000);
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, delay);
  };

  function push(type, payload) {
    pending.push({
      clientSeq: nextSeq++,
      type,
      payload,
      clientTs: new Date().toISOString(),
    });

    // Oldest-first eviction: recent activity is what an admin looking at a stuck
    // learner actually needs.
    if (pending.length > maxPending) pending = pending.slice(pending.length - maxPending);

    if (pending.length >= maxBatch) {
      clearTimer();
      void flush();
    } else {
      scheduleFlush();
    }
  }

  async function flush() {
    if (inFlight || pending.length === 0) return;
    inFlight = true;
    clearTimer();

    // Snapshot what we are attempting. Anything pushed while the request is in
    // flight stays queued for the next round.
    const batch = pending.slice(0, maxBatch);
    try {
      await send(batch);
      failures = 0;
      const delivered = new Set(batch.map((e) => e.clientSeq));
      pending = pending.filter((e) => !delivered.has(e.clientSeq));
    } catch {
      failures += 1;
      // Keep everything. The server de-duplicates on (session, clientSeq), so
      // re-sending the same batch is safe.
    } finally {
      inFlight = false;
    }

    if (pending.length > 0) scheduleFlush();
  }

  return {
    push,
    flush,
    /** How many events have not been delivered yet. */
    pending: () => pending.length,
    /** Everything needed to resume this queue after a reload. */
    snapshot: () => ({ pending: [...pending], nextSeq }),
    /** Stop the timer — call on unmount so a dead component stops flushing. */
    stop: clearTimer,
  };
}
