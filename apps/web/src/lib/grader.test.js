import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSession, fetchResumable } from './grader.js';

afterEach(() => vi.unstubAllGlobals());

describe('session intent', () => {
  it('scopes resume lookups and sends an explicit restart', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ resume: null }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sessionId: 'new' }) });
    vi.stubGlobal('fetch', fetch);

    await fetchResumable('email-triage');
    await createSession('email-triage', { restart: true });

    expect(fetch).toHaveBeenNthCalledWith(1, '/api/sessions?slug=email-triage');
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: 'email-triage', restart: true }),
    });
  });
});
