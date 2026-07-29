// Smoke test: loads every screen of every problem and fails on any runtime
// error. Catches the class of bug a spot-check misses (e.g. a component
// referencing an undefined prop on a screen you didn't happen to open).
//
//   node scripts/smoke.mjs [outDir]
//
// Env: SMOKE_BASE_URL (default http://localhost:3000), SMOKE_CHROME
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const exe = process.env.SMOKE_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const out = process.argv[2] ?? null;
if (out) mkdirSync(out, { recursive: true });

const PROBLEMS = ['email-triage', 'lead-triage', 'meeting-notes', 'order-desk'];
const ROUTES = ['#build', '#run-story', '#eval-demo', '#report-demo'];

// Ignore noise that isn't an app defect: the mascot wasm/asset fetches, and a
// missing voice clip. The latter is a DESIGNED state — with narration off or
// nothing generated, the clip route 404s and the journey shows captions instead.
// The client also stops asking after the first failure, so this is at most one per
// page. The clip route's own behaviour is covered by its tests.
const IGNORE = /wasm|lottie|favicon|ERR_CONNECTION_RESET|net::ERR_FAILED|status of 404/i;

const browser = await chromium.launch({ executablePath: exe, headless: true });
const failures = [];

// The journey is behind auth now, so the whole run shares one signed-in
// context. Without this every visit lands on /login and the suite is green
// while testing nothing.
const SMOKE_EMAIL = process.env.SMOKE_EMAIL ?? 'smoke@judge.local';
const SMOKE_PASSWORD = process.env.SMOKE_PASSWORD ?? 'smoke-test-password';
const SMOKE_INVITE = process.env.SMOKE_INVITE ?? 'AIML-DEMO';

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

// Sign in through the API rather than by driving the login form. This suite
// exists to catch runtime errors on the journey screens; making it depend on
// the login form's DOM would mean a form tweak fails all 16 checks for no real
// reason. Requests run inside the page so cookies land in the shared context.
async function signIn() {
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

  if (result.email !== SMOKE_EMAIL) {
    console.log(`✗ could not sign in (status ${result.status}) — every screen would just be the login page`);
    process.exit(1);
  }
  console.log(`✓ signed in as ${SMOKE_EMAIL}`);
}

await signIn();

// How long a screen gets to settle after loading, for GSAP intros and the
// run-story animation to finish and throw anything they are going to throw.
// Overridable so a slow machine can buy more time without editing this file.
const SETTLE_MS = Number(process.env.SMOKE_SETTLE_MS ?? 2200);
// How many screens are checked at once. Each gets its own page in the shared
// signed-in context, so they are independent.
const CONCURRENCY = Number(process.env.SMOKE_CONCURRENCY ?? 4);

async function check(name, url, extra) {
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORE.test(m.text())) errs.push(`console: ${m.text()}`);
  });

  // One load, not two. This used to `goto` and then immediately `reload`, both
  // waiting for full network idle — but every check opens a FRESH page, so there
  // was never anything stale to reload. It simply loaded all 20 screens twice.
  await page.goto(url, { waitUntil: 'networkidle' }).catch((e) => errs.push(`goto: ${e.message}`));
  await page.waitForTimeout(SETTLE_MS);
  if (extra) await extra(page, errs);

  // Next.js renders runtime errors into an error overlay — catch that too.
  const overlay = await page.locator('nextjs-portal').count().catch(() => 0);
  if (overlay > 0) {
    const text = await page.locator('nextjs-portal').innerText().catch(() => '');
    if (/error/i.test(text)) errs.push(`error overlay: ${text.split('\n').slice(0, 3).join(' | ')}`);
  }

  if (out) await page.screenshot({ path: `${out}/${name}.png` }).catch(() => {});
  await page.close();
  return { name, url, errs };
}

/**
 * Run the checks with a small concurrency pool, reporting in the order they were
 * queued rather than the order they finish — so the output stays readable and
 * diffable between runs.
 */
async function runAll(jobs) {
  const results = new Array(jobs.length);
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const i = next++;
      const j = jobs[i];
      results[i] = await check(j.name, j.url, j.extra);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));

  for (const r of results) {
    if (r.errs.length) {
      failures.push(r);
      console.log(`✗ ${r.name}`);
      for (const e of r.errs) console.log(`    ${e}`);
    } else {
      console.log(`✓ ${r.name}`);
    }
  }
}

// The home page, and the full journey entry point for each problem (the
// journey starts at the Understand/Dissection screen — the one a
// #build-only spot-check never touches).
const jobs = [{ name: 'home', url: `${base}/` }];

for (const p of PROBLEMS) {
  jobs.push({ name: `${p}--journey-start`, url: `${base}/?problem=${p}`, extra: async (page, errs) => {
    // Enter the journey from THIS problem's card, landing on its Understand screen.
    // Clicking `.first()` used to mean every problem's journey-start check actually
    // opened email-triage, so two of the three Understand screens were never tested.
    // WAIT for each step rather than sleeping and hoping. Fixed delays made this
    // check timing-dependent: it passed at a 3s settle and started failing
    // intermittently at 2.2s with four pages loading at once, because a beat's
    // button simply had not rendered yet. A flaky check on a grading surface is
    // worse than no check — you learn to ignore it.
    const card = page.locator(`button[data-problem="${p}"]`);
    try {
      await card.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      errs.push(`no home card for "${p}" — cannot enter its journey`);
      return;
    }
    await card.click().catch(() => {});

    // Understand opens on two narrated beats (Iris greeting, then the problem
    // statement) before the quiz, and they advance on differently-labelled
    // buttons ("Continue", then "Let's dissect it").
    for (let beat = 0; beat < 2; beat++) {
      const cont = page.getByRole('button', { name: /continue|dissect/i }).first();
      try {
        await cont.waitFor({ state: 'visible', timeout: 10000 });
      } catch {
        break; // already past the beats
      }
      await cont.click().catch(() => {});
    }

    try {
      await page.getByText(/question 1 of \d+/i).first().waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      errs.push('never reached the Understand quiz (still on an intro beat?)');
    }
  } });

  for (const r of ROUTES) {
    jobs.push({ name: `${p}--${r.replace('#', '')}`, url: `${base}/${r}?problem=${p}` });
  }

  // Opening a node's detail view is the one high-traffic interaction that
  // loading a screen never exercises. A crash in there renders nothing until
  // a learner double-clicks a node, so every other check stays green — which
  // is exactly how a `node is not defined` in FieldForm shipped.
  jobs.push({ name: `${p}--ndv`, url: `${base}/#run-story?problem=${p}`, extra: async (page, errs) => {
    const node = page.locator('.react-flow__node').first();
    try {
      await node.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      errs.push('no nodes on the canvas — could not open the NDV');
      return;
    }
    await node.dblclick().catch((e) => errs.push(`dblclick: ${e.message}`));
    // The NDV is the only thing with a Parameters tab. If it isn't there the
    // modal failed to mount, which is the failure we care about.
    try {
      await page.getByText('Parameters', { exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      errs.push('node detail view did not open');
    }
  } });
}

await runAll(jobs);
await browser.close();

if (failures.length) {
  console.log(`\n${failures.length} screen(s) with errors.`);
  process.exit(1);
}
console.log('\nAll screens clean.');
