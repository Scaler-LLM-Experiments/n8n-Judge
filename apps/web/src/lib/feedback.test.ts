import { describe, it, expect, vi, afterEach } from 'vitest';
import { saveFeedback } from './feedback';

// The rating transport has one job beyond storing: it must never be able to hurt
// the Result screen. These pin the three ways it could.

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveFeedback', () => {
  it('does not call the server without a session', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await saveFeedback({
      sessionId: null,
      attemptKey: 'email-triage',
      problemId: 'email-triage',
      rating: 5,
      comment: 'great',
      submitted: true,
    });

    // A dev hash route has no session; POSTing would be a guaranteed 404.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('posts the rating to the session that owns it', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);

    await saveFeedback({
      sessionId: 'sess_1',
      attemptKey: 'sess_1',
      problemId: 'email-triage',
      rating: 4,
      comment: '  the verify button confused me  ',
      submitted: true,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/sessions/sess_1/rating');
    expect(init.method).toBe('POST');
    // The problem and the learner are the server's to read off the session row,
    // so the body carries neither.
    expect(JSON.parse(init.body)).toEqual({
      rating: 4,
      comment: '  the verify button confused me  ',
    });
  });

  it('sends a null comment rather than an empty string', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);

    await saveFeedback({
      sessionId: 'sess_2',
      attemptKey: 'sess_2',
      problemId: 'email-triage',
      rating: 3,
      comment: '',
      submitted: false,
    });

    expect(JSON.parse(fetchSpy.mock.calls[0][1].body).comment).toBeNull();
  });

  it('resolves when the network throws, so a caller cannot be broken by it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(
      saveFeedback({
        sessionId: 'sess_3',
        attemptKey: 'sess_3',
        problemId: 'email-triage',
        rating: 1,
        comment: 'broke',
        submitted: true,
      })
    ).resolves.toBeUndefined();
  });
});
