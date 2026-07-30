// Client side of server-authoritative grading.
//
// The browser no longer knows which answer is right — the API stopped shipping
// `correct` flags. Every verdict comes from POST /api/sessions/[id]/check,
// which also RECORDS the attempt, so guessing is allowed and scores like
// guessing rather than being a free oracle.
//
// Local grading is kept only as a fallback for the dev hash routes, which run
// without a session. That fallback is explicitly NOT a security hole to fix
// later: with the public projection in place there are no `correct` flags in
// the payload for it to read, so it simply reports `null` and the caller
// treats the answer as unverified.

/**
 * The attempt this learner already has open, for Home's "Continue where you left
 * off" — or `null` when there is nothing to continue.
 *
 * Never throws: Home renders with or without this, and a failed lookup should cost
 * the learner a shortcut, not the whole screen.
 *
 * @returns {Promise<{sessionId: string, slug: string, title: string, screen: string|null, graph: object|null, lastSeenAt: string}|null>}
 */
export async function fetchResumable() {
  try {
    const res = await fetch('/api/sessions');
    if (!res.ok) return null;
    const body = await res.json();
    return body?.resume ?? null;
  } catch {
    return null;
  }
}

export async function createSession(slug) {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug }),
  });
  if (!res.ok) throw new Error(`Could not start this challenge (${res.status})`);
  return res.json(); // { sessionId, problemVersionId, version }
}

/**
 * The Result screen's data. The score is replayed server-side from this
 * session's recorded decisions — the local grading store is NOT consulted, so a
 * tampered store cannot produce a score.
 *
 * Returns null without a session (dev hash routes), and the caller falls back to
 * the local store so those routes keep working offline.
 *
 * @returns {Promise<{total:number, band:string, definition:string,
 *                    phases:Array<{key:string,label:string,weight:number,earned:number,score:number}>,
 *                    report:object|null, reason?:string} | null>}
 */
/**
 * @param {string} sessionId
 * @param {{ narrative?: boolean }} [opts] `narrative: false` returns the score without
 *   waiting on Claude — the Result screen asks for that first so the marks paint
 *   immediately, then asks again for the words.
 */
export async function fetchReport(sessionId, opts = {}) {
  if (!sessionId) return null;
  const query = opts.narrative === false ? '?narrative=0' : '';
  try {
    const res = await fetch(`/api/sessions/${sessionId}/report${query}`, { method: 'POST' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Ask the server to grade one answer.
 *
 * @returns {Promise<{correct:boolean, why:string|null, unlocks:string[]|null,
 *                    attempt:number, firstTry:boolean} | null>}
 *          null when there is no session (dev routes) — the caller should
 *          treat the answer as unverified rather than guessing a verdict.
 */
export async function checkAnswer(sessionId, kind, id, answer) {
  if (!sessionId) return null;
  try {
    const res = await fetch(`/api/sessions/${sessionId}/check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind, id, answer }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // A dropped connection must not silently mark a right answer wrong.
    return null;
  }
}
