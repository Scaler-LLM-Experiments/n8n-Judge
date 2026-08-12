// Smoke test: loads every screen of every problem and fails on any runtime
// error. Catches the class of bug a spot-check misses (e.g. a component
// referencing an undefined prop on a screen you didn't happen to open).
//
//   node scripts/smoke.mjs [outDir]
//
// Env: SMOKE_BASE_URL (default http://localhost:3000), SMOKE_CHROME
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { problemList } from '@judge/problems';

const base = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const exe = process.env.SMOKE_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const out = process.argv[2] ?? null;
if (out) mkdirSync(out, { recursive: true });

// Derived from the registry, not listed here. A hardcoded list goes stale the moment
// the catalogue changes: when three problems were removed on 2026-07-31 this script
// kept driving their screens and reported six failures that were really one edit it
// had not been told about. The registry is the same source `db:seed` publishes from,
// so smoke covers exactly what a learner can reach.
/**
 * Which problems to sweep.
 *
 * The journey is checked per problem, so the run grows by seven checks with every
 * case authored — 36 at five cases, 50 at seven. During an authoring run only the
 * new case can have changed, so `SMOKE_ONLY=<slug>` gates the sweep to it; home and
 * the stateful resume check always run. The full sweep stays the default, and is
 * what `case_finalize` and CI use.
 */
const ONLY = process.env.SMOKE_ONLY?.trim();
const ALL_PROBLEMS = problemList.map((p) => p.id);
const PROBLEMS = ONLY ? ALL_PROBLEMS.filter((id) => id === ONLY) : ALL_PROBLEMS;
if (ONLY && !PROBLEMS.length) {
  console.error(`SMOKE_ONLY="${ONLY}" matches no registered problem — refusing to run an empty sweep`);
  process.exit(1);
}
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
// Measured 2026-08-11: 36 checks take 1m59s at 4 and 1m39s at 8, on a machine
// where the dev server is the shared bottleneck rather than the browser.
const CONCURRENCY = Number(process.env.SMOKE_CONCURRENCY ?? 8);

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
  // Home, NOT `/?problem=<slug>`. That URL is now a deep link that enters the
  // challenge on its own, so this check would find no card to click — the point
  // here is the path a learner actually takes through the grid. The deep link
  // gets its own check below.
  jobs.push({ name: `${p}--journey-start`, url: `${base}/`, extra: async (page, errs) => {
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
    if ((await card.innerText()) === 'Start over') {
      page.once('dialog', (dialog) => dialog.accept());
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

    // Entering from a card must write the slug into the address bar — that is what
    // makes the challenge linkable at all — and it must push a history entry, so
    // Back means "go to Home" rather than "leave Judge".
    if (!page.url().includes(`problem=${p}`)) {
      errs.push(`entering "${p}" left the URL at ${page.url()} — nothing to copy and share`);
    }
    await page.goBack().catch(() => {});
    await page.waitForTimeout(1200);
    try {
      await page.locator(`button[data-problem="${p}"]`).first().waitFor({ state: 'visible', timeout: 8000 });
    } catch {
      errs.push('Back did not return to Home');
    }
    if (page.url().includes('problem=')) {
      errs.push(`Back left the slug in the URL (${page.url()}), so a reload would re-enter the challenge`);
    }
  } });

  // The shareable link. `/?problem=<slug>` must open the challenge rather than
  // Home, and must leave the slug in the address bar so it can be copied out and
  // sent again. Both halves are silent when they break: the link still loads a
  // working app, just not the challenge someone was told to try.
  jobs.push({ name: `${p}--deep-link`, url: `${base}/?problem=${p}`, extra: async (page, errs) => {
    if ((await page.locator(`button[data-problem]`).count()) > 0) {
      errs.push(`deep link landed on Home instead of opening "${p}"`);
    }
    if (!page.url().includes(`problem=${p}`)) {
      errs.push(`deep link dropped the slug from the URL (now ${page.url()}) — nothing left to share`);
    }
    // Deliberately NOT asserting that Back returns to Home here: arriving on a
    // link is the first entry in that tab's history, so Back leaves the site, the
    // same as it would on any other page. The in-app history is checked on the
    // card-click path above, which is where an entry is actually pushed.
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
await resumeCheck();
await browser.close();

/**
 * "Continue where you left off" must land on the point in the trace, not at the
 * top of the screen that point is on.
 *
 * Stateful, so it runs on its own after the page checks rather than as one of
 * them. Progress is synthesised through the real endpoints — /check for answers,
 * /events for navigation — because the browser does not hold the answers needed
 * to complete a Build phase by clicking, and a resume test that cannot set up a
 * mid-Build state cannot test the case that was broken.
 *
 * Every wait here is on a condition. A fixed delay on this check would be worse
 * than no check: resume already looks like it works when it is wrong.
 */
/**
 * Wait for text that is actually VISIBLE, rather than for the first match.
 *
 * `getByText(x).first()` is first in DOM order, and every select in the NDV
 * renders its options in a closed list — so the value a learner picked is on the
 * page twice, hidden in the list and visible in the control. Waiting on `.first()`
 * timed out while the value was plainly on screen, and the check reported a bug
 * that a screenshot disproved.
 */
async function waitForVisibleText(page, text, timeout = 10000) {
  const target = page.getByText(text, { exact: false });
  for (let waited = 0; waited <= timeout; waited += 250) {
    const n = await target.count().catch(() => 0);
    for (let i = 0; i < n; i += 1) {
      if (await target.nth(i).isVisible().catch(() => false)) return true;
    }
    await page.waitForTimeout(250);
  }
  return false;
}

/** Click the VISIBLE match, for the same reason `waitForVisibleText` waits on one. */
async function clickVisibleText(page, text) {
  const target = page.getByText(text, { exact: false });
  const n = await target.count().catch(() => 0);
  for (let i = 0; i < n; i += 1) {
    if (await target.nth(i).isVisible().catch(() => false)) {
      await target.nth(i).click().catch(() => {});
      return true;
    }
  }
  return false;
}

async function resumeCheck() {
  const problem = problemList[0];
  const errs = [];
  const page = await context.newPage();
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });

  const api = (fn, arg) => page.evaluate(fn, arg);

  // Close whatever attempt is open (previous runs included) and start a clean one.
  const freshSession = () =>
    api(async (slug) => {
      const open = await (await fetch('/api/sessions')).json();
      if (open?.resume?.sessionId) {
        await fetch(`/api/sessions/${open.resume.sessionId}/report`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ narrative: false }),
        });
      }
      const made = await (await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, restart: true }),
      })).json();
      return made.sessionId;
    }, problem.id);

  const answer = (sessionId, ids) =>
    api(async ([id, list]) => {
      for (const q of list) {
        await fetch(`/api/sessions/${id}/check`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          // Deliberately wrong: a question counts as answered either way, and a
          // wrong answer is the case that must not be re-asked.
          body: JSON.stringify({ kind: 'dissection', id: q, answer: '__not_a_node_type__' }),
        });
      }
    }, [sessionId, ids]);

  const continueWhereLeftOff = async () => {
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    const button = page.getByRole('button', { name: /^Resume$/ }).first();
    await button.waitFor({ state: 'visible', timeout: 15000 });
    await button.click();
  };

  // ---- mid-quiz: rejoin at the first unanswered question -------------------
  const answeredCount = 2;
  await answer(await freshSession(), problem.dissection.slice(0, answeredCount).map((q) => q.id));
  await continueWhereLeftOff();
  try {
    await page.getByText(new RegExp(`question ${answeredCount + 1} of`, 'i')).first()
      .waitFor({ state: 'visible', timeout: 20000 });
  } catch {
    const seen = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ');
    errs.push(`resumed Understand did not open question ${answeredCount + 1}: ${seen.slice(0, 160)}`);
  }

  // ---- mid-Build: rejoin on the phase they were on ------------------------
  const [firstPhase, secondPhase] = problem.buildPhases;
  if (secondPhase) {
    const sessionId = await freshSession();
    await answer(sessionId, problem.dissection.map((q) => q.id));
    // One node on the canvas, configured, and the phase after the one it belongs
    // to: exactly the state that used to re-clear phase one on arrival.
    const seed = problem.referenceGraph.nodes[0];
    // Its field values too, so the reopened node is checked for them below.
    const seedValues = Object.fromEntries(
      (problem.nodeSetup?.[seed.type]?.fields ?? [])
        .map((f) => [f.key, (f.options ?? []).find((o) => o.correct)?.value])
        .filter(([, v]) => v !== undefined)
    );
    const node = {
      // A LEARNER's id, not the authored one — `nextNodeId` hands out `n<N>`, so
      // that is what a real trace holds, and it is the id space the next node the
      // learner places is drawn from. Seeding `trigger-1` here made the placement
      // below unable to collide, which is how the duplicate-id bug survived: the
      // restored node vanished from the canvas the moment they added another.
      id: 'n1',
      type: seed.type,
      position: seed.position,
      data: { configured: true, values: seedValues, settings: {} },
    };
    const events = [
      { type: 'screen_transition', payload: { from: 'statement', to: 'dashboard' } },
      { type: 'graph_mutation', payload: { op: 'add_node', nodeType: node.type, graph: { nodes: [node], edges: [] } } },
      { type: 'phase_transition', payload: { phaseId: secondPhase.id, label: secondPhase.label } },
    ];
    await api(async ([id, list]) => {
      await fetch(`/api/sessions/${id}/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          events: list.map((e, i) => ({ ...e, clientSeq: i + 1, clientTs: new Date().toISOString() })),
        }),
      });
    }, [sessionId, events]);

    await continueWhereLeftOff();
    try {
      await page.locator('.react-flow__node').first().waitFor({ state: 'visible', timeout: 20000 });
    } catch {
      errs.push('resumed Build did not restore the canvas');
    }

    // The bug this guards: with the phase reset to the first one, the restored
    // canvas satisfies it instantly and the learner is walked through a
    // celebration for work they had already finished.
    const celebrating = (await page.locator('body').innerText().catch(() => '')).match(/Keep building|— done/i);
    if (celebrating) errs.push(`resumed Build replayed the "${firstPhase.label}" celebration`);

    // The node must reopen on the values the learner gave. It used to come back
    // marked configured over blank inputs, which reads as lost work.
    //
    // Checked BEFORE the picker below, on purpose: the picker drawer has no
    // Escape handler and closing it by clicking near its header landed on a node
    // in its own list, which ADDED one — so the NDV then opened on a brand new
    // empty node and this check failed for a reason that had nothing to do with
    // resume. Two interactions, in the order that keeps them independent.
    const wanted = Object.values(seedValues);
    if (wanted.length) {
      await page.locator('.react-flow__node').first().dblclick().catch(() => {});
      let ndvOpen = true;
      try {
        await page.getByText('Parameters', { exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
      } catch {
        ndvOpen = false;
        errs.push('could not open the NDV on a restored node');
      }
      if (ndvOpen) {
        // Read the controls, not the page text. Every field here is a real
        // `<select>`, and Playwright counts an `<option>` as not visible — so
        // matching on the option's label reported the value missing while a
        // screenshot showed it plainly selected.
        let picked = [];
        for (let waited = 0; waited <= 10000; waited += 250) {
          picked = await page.locator('select').evaluateAll((els) => els.map((e) => e.value)).catch(() => []);
          if (wanted.every((v) => picked.includes(v))) break;
          await page.waitForTimeout(250);
        }
        const missing = wanted.filter((v) => !picked.includes(v));
        if (missing.length) {
          errs.push(`a restored configured node lost its saved answers (${missing.join(', ')} not selected; selects hold ${picked.join(', ') || 'nothing'})`);
        }
        await page.locator('button[aria-label="Close setup"]').first().click().catch(() => {});
        await page.getByText('Parameters', { exact: true }).first()
          .waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
      }
    }

    // Which phase is live is not written on screen, so ask the picker: each phase
    // offers its own nodes.
    const expected = problem.nodePalette.find((n) => secondPhase.nodeTypes.includes(n.type))?.label;
    await page.locator('button[title="Add next node"]').first().click().catch(() => {});
    if (!(await waitForVisibleText(page, expected))) {
      errs.push(`resumed Build is not on "${secondPhase.label}" — its picker never offered "${expected}"`);
    } else {
      // ---- placing a node AFTER resuming must not eat the restored one -------
      // The id counter was a module global that a reload reset to zero, while the
      // restored node kept `n1`. The next node placed was therefore a duplicate
      // id: React Flow keys its internals by id and keeps the last, so the count
      // stayed at one — the learner watched their node disappear as they added
      // another, and every wire to it re-routed. Counting is the whole assertion.
      const before = await page.locator('.react-flow__node').count();
      await clickVisibleText(page, expected);
      let after = before;
      for (let waited = 0; waited <= 10000 && after <= before; waited += 250) {
        await page.waitForTimeout(250);
        after = await page.locator('.react-flow__node').count();
      }
      if (after <= before) {
        errs.push(`placing a node after resume did not add one (${before} before, ${after} after) — the new node collided with a restored id`);
      }
    }
  }

  // ---- the tracing itself: a REAL placement must record a position ---------
  // Everything above seeds the trace through the API, so none of it would notice
  // the client recording `position: undefined` — which is exactly what happened,
  // silently, and made resume hand back no canvas at all. So place a node by
  // clicking, then ask the endpoint whether it would give that canvas back.
  await freshSession();
  await page.goto(`${base}/#build?problem=${problem.id}`, { waitUntil: 'networkidle' });
  const addFirst = page.getByText(/add first step/i).first();
  try {
    await addFirst.waitFor({ state: 'visible', timeout: 20000 });
    await addFirst.click();
    const firstNodeLabel = problem.nodePalette.find((n) => problem.buildPhases[0].nodeTypes.includes(n.type))?.label;
    await page.getByText(firstNodeLabel, { exact: false }).first().click();
    await page.locator('.react-flow__node').first().waitFor({ state: 'visible', timeout: 15000 });
  } catch (e) {
    errs.push(`could not place a node to test tracing: ${e.message.split('\n')[0]}`);
  }
  // The trace queue batches, so wait for the server to have the graph rather than
  // for a fixed delay.
  let offered = null;
  for (let tries = 0; tries < 20 && !offered; tries += 1) {
    offered = await api(async () => (await (await fetch('/api/sessions')).json())?.resume?.graph ?? null);
    if (!offered) await page.waitForTimeout(500);
  }
  if (!offered) {
    errs.push('a node placed by clicking was not offered back by resume — positions are missing from the trace again');
  }

  await page.close();
  if (errs.length) {
    failures.push({ name: 'resume', url: `${base}/`, errs });
    console.log('✗ resume');
    for (const e of errs) console.log(`    ${e}`);
  } else {
    console.log('✓ resume');
  }
}

if (failures.length) {
  console.log(`\n${failures.length} screen(s) with errors.`);
  process.exit(1);
}
console.log('\nAll screens clean.');
