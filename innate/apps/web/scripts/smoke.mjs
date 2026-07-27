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

const PROBLEMS = ['email-triage', 'lead-triage', 'meeting-notes'];
const ROUTES = ['#build', '#run-story', '#eval-demo', '#report-demo'];

// Ignore noise that isn't an app defect: the mascot wasm/asset fetches.
const IGNORE = /wasm|lottie|favicon|ERR_CONNECTION_RESET|net::ERR_FAILED/i;

const browser = await chromium.launch({ executablePath: exe, headless: true });
const failures = [];

async function visit(name, url, extra) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORE.test(m.text())) errs.push(`console: ${m.text()}`);
  });

  await page.goto(url, { waitUntil: 'networkidle' }).catch((e) => errs.push(`goto: ${e.message}`));
  await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(3000);
  if (extra) await extra(page, errs);

  // Next.js renders runtime errors into an error overlay — catch that too.
  const overlay = await page.locator('nextjs-portal').count().catch(() => 0);
  if (overlay > 0) {
    const text = await page.locator('nextjs-portal').innerText().catch(() => '');
    if (/error/i.test(text)) errs.push(`error overlay: ${text.split('\n').slice(0, 3).join(' | ')}`);
  }

  if (out) await page.screenshot({ path: `${out}/${name}.png` }).catch(() => {});
  await page.close();

  if (errs.length) {
    failures.push({ name, url, errs });
    console.log(`✗ ${name}`);
    for (const e of errs) console.log(`    ${e}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// The home page, and the full journey entry point for each problem (the
// journey starts at the Understand/Dissection screen — the one a
// #build-only spot-check never touches).
await visit('home', `${base}/`);

for (const p of PROBLEMS) {
  await visit(`${p}--journey-start`, `${base}/?problem=${p}`, async (page) => {
    // Enter the journey from the home card, landing on Understand.
    await page.getByRole('button', { name: /try this judge/i }).first().click().catch(() => {});
    await page.waitForTimeout(2500);
  });
  for (const r of ROUTES) {
    await visit(`${p}--${r.replace('#', '')}`, `${base}/${r}?problem=${p}`);
  }
}

await browser.close();

if (failures.length) {
  console.log(`\n${failures.length} screen(s) with errors.`);
  process.exit(1);
}
console.log('\nAll screens clean.');
