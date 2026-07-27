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
