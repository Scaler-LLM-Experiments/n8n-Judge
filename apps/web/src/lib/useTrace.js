import { useCallback, useEffect, useRef } from 'react';
import { createTraceQueue } from './traceQueue.js';

// Wires the outbound queue to the app: gives it the network, keeps it alive
// across a reload, and hands the screens one `trace(type, payload)` call.
//
// Two details that matter more than they look:
//
// The queue is created IMMEDIATELY, before the session exists. Starting a session
// is a round trip, and the learner is already on screen — anything they do in
// that window would otherwise be lost. Instead `send` refuses while there is no
// session, the events stay queued, and the first successful flush delivers them.
//
// Unsent events are mirrored into sessionStorage. A reload mid-session would
// otherwise silently drop whatever had not been delivered, and the gap would
// appear in the admin timeline as the learner having done nothing.

const storageKey = (sessionId) => `judge.trace.${sessionId}`;

function readSnapshot(sessionId) {
  if (!sessionId || typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.pending) || typeof parsed?.nextSeq !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSnapshot(sessionId, snapshot) {
  if (!sessionId || typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(storageKey(sessionId), JSON.stringify(snapshot));
  } catch {
    // A full or blocked storage must not break the journey.
  }
}

async function postBatch(sessionId, events) {
  const res = await fetch(`/api/sessions/${sessionId}/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ events }),
  });
  if (!res.ok) {
    // 4xx means this batch will never be accepted — a contract bug, not a
    // network blip. Surface it loudly in dev and drop it, or the queue would
    // retry a rejected batch forever and block everything behind it.
    if (res.status >= 400 && res.status < 500) {
      const detail = await res.text().catch(() => '');
      console.error(`[trace] batch rejected (${res.status}) — dropping it: ${detail}`);
      return; // resolve: treat as delivered so the queue moves on
    }
    throw new Error(`trace batch failed (${res.status})`);
  }
}

/**
 * @param {string|null} sessionId
 * @returns {(type: string, payload?: object) => void}
 */
export function useTrace(sessionId) {
  const sessionRef = useRef(sessionId);
  const queueRef = useRef(null);
  const restoredFor = useRef(null);

  sessionRef.current = sessionId;

  if (!queueRef.current) {
    queueRef.current = createTraceQueue({
      send: async (events) => {
        const id = sessionRef.current;
        // No session yet: keep the events queued rather than losing them.
        if (!id) throw new Error('no session yet');
        await postBatch(id, events);
      },
    });
  }

  // Once the session id arrives, adopt anything a previous page load left unsent.
  useEffect(() => {
    if (!sessionId || restoredFor.current === sessionId) return;
    restoredFor.current = sessionId;

    const saved = readSnapshot(sessionId);
    const queue = queueRef.current;
    if (saved?.pending?.length) {
      // Re-push through the existing queue would renumber them, so rebuild the
      // queue from the snapshot instead and keep their original numbers.
      const carried = queue.snapshot();
      queue.stop();
      queueRef.current = createTraceQueue({
        send: async (events) => {
          const id = sessionRef.current;
          if (!id) throw new Error('no session yet');
          await postBatch(id, events);
        },
        restore: {
          pending: [...saved.pending, ...carried.pending],
          nextSeq: Math.max(saved.nextSeq, carried.nextSeq),
        },
      });
    }
    void queueRef.current.flush();
  }, [sessionId]);

  // Flush when the tab is hidden or closed. This is the last chance to deliver,
  // and it is the common case: learners navigate away mid-session.
  useEffect(() => {
    const onHide = () => {
      const queue = queueRef.current;
      writeSnapshot(sessionRef.current, queue.snapshot());
      void queue.flush();
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide();
    });
    return () => {
      window.removeEventListener('pagehide', onHide);
      queueRef.current?.stop();
    };
  }, []);

  return useCallback((type, payload = {}) => {
    const queue = queueRef.current;
    queue.push(type, payload);
    // Mirror after every push: the events most likely to be lost are the ones
    // right before a reload, and this is cheap for a few hundred small objects.
    writeSnapshot(sessionRef.current, queue.snapshot());
  }, []);
}
