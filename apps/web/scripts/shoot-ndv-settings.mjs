// Screenshots of the NDV Settings tab, for eyeballing fidelity against real n8n.
//
//   node apps/web/scripts/shoot-ndv-settings.mjs <outDir>
//
// Env: SMOKE_BASE_URL (default http://localhost:3000), SMOKE_CHROME
//
// Two shots, because the two cases differ in real n8n and used to be identical
// here (see docs/n8n-reference/00-how-n8n-actually-works.md §5):
//   regular node  — the full eight-row tab, dependents hidden until switched on
//   sub-node      — Notes only; no Always Output Data / Execute Once / Retry / On Error
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { signIn } from './signIn.mjs';

const base = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const exe = process.env.SMOKE_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const out = process.argv[2] ?? '/tmp/judge-ndv';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: exe, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 940 } });

// Without this every route redirects to /login and the canvas is simply absent —
// which reads as "no nodes found" rather than "not signed in".
const auth = await signIn(context, base);
if (!auth.ok) {
  console.log(`could not sign in (status ${auth.status}) — the canvas would be empty`);
  process.exit(1);
}

const page = await context.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));

/** Open a node's NDV by its visible label, then switch to Settings. */
async function shoot(name, label) {
  await page.goto(`${base}/#run-story?problem=email-triage`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(4000); // the run story animates before settling

  const node = page.locator('.react-flow__node', { hasText: label }).first();
  if ((await node.count().catch(() => 0)) === 0) {
    console.log(`✗ ${name}: no node matching "${label}"`);
    return;
  }
  await node.dblclick().catch((e) => console.log(`dblclick: ${e.message}`));
  await page.waitForTimeout(1200);

  const tab = page.getByText('Settings', { exact: true }).first();
  if ((await tab.count().catch(() => 0)) === 0) {
    console.log(`✗ ${name}: no Settings tab (NDV did not open?)`);
    await page.screenshot({ path: `${out}/${name}--no-tab.png` });
    return;
  }
  await tab.click().catch((e) => console.log(`tab click: ${e.message}`));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`✓ ${name}`);
}

await shoot('settings-regular', 'Switch');
await shoot('settings-subnode', 'Chat Model');

console.log(errs.length ? `ERRORS:\n${errs.join('\n')}` : 'no page errors');
await browser.close();
