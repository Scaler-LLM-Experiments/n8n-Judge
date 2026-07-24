// Visual verification: screenshots the main journey + dev routes against a
// running dev server (default http://localhost:5199). Mirrors the old
// app/scripts/shoot-*.mjs approach, re-pointed at the Next.js port.
//
//   node scripts/shoot-preview.mjs [outDir]
//
// Env: SHOOT_BASE_URL, SHOOT_CHROME (chromium executable path)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.SHOOT_BASE_URL ?? 'http://localhost:5199';
const out = process.argv[2] ?? 'shots';
const exe =
  process.env.SHOOT_CHROME ??
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

mkdirSync(out, { recursive: true });

const routes = [
  ['home', `${base}/`],
  ['build', `${base}/#build`],
  ['run-story', `${base}/#run-story`],
  ['report-demo', `${base}/#report-demo`],
  ['eval-demo', `${base}/#eval-demo`],
];

const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

for (const [name, url] of routes) {
  await page.goto(url, { waitUntil: 'networkidle' }).catch((e) => errors.push(`${name}: ${e.message}`));
  // hash-only navigation doesn't remount — reload to pick the dev route up
  await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`shot ${name}`);
}
console.log('ERRORS:', errors.length ? errors.slice(0, 12).join('\n') : 'none');
await browser.close();
