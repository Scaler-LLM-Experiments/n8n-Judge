// Shared sign-in for the browser-driving scripts.
//
// The journey is behind auth, so any script that drives it must sign in first
// or every screen is just /login — and a suite that screenshots the login page
// twenty times looks perfectly green. That bit us once; extracting it here means
// smoke and the shoot-* scripts cannot drift apart on it.
//
// Signs in through the API rather than by driving the form: these scripts exist
// to exercise the journey, and making them depend on the login form's DOM would
// mean a form tweak fails every check for no real reason. The requests run
// inside the page, so cookies land in the context you pass in.

export const SMOKE_EMAIL = process.env.SMOKE_EMAIL ?? 'smoke@judge.local';
export const SMOKE_PASSWORD = process.env.SMOKE_PASSWORD ?? 'smoke-test-password';
export const SMOKE_INVITE = process.env.SMOKE_INVITE ?? 'AIML-DEMO';

/**
 * @param {import('playwright-core').BrowserContext} context
 * @param {string} base
 * @returns {Promise<{ ok: boolean, status: number, email: string|null }>}
 */
export async function signIn(context, base) {
  const page = await context.newPage();
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(
    async ([email, password, inviteCode]) => {
      // Idempotent: 201 the first run, 409 after — both fine.
      await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, inviteCode }),
      }).catch(() => {});

      const { csrfToken } = await (await fetch('/api/auth/csrf')).json();
      const res = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ csrfToken, email, password }),
        redirect: 'follow',
      });
      const session = await (await fetch('/api/auth/session')).json();
      return { status: res.status, email: session?.user?.email ?? null };
    },
    [SMOKE_EMAIL, SMOKE_PASSWORD, SMOKE_INVITE]
  );
  await page.close();

  return { ok: result.email === SMOKE_EMAIL, status: result.status, email: result.email };
}
