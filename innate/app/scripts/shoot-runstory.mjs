import { chromium } from 'playwright-core';

const OUT = '/tmp/judge-shots';
const URL = 'http://localhost:5173/#run-story';

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);   // seed + fitView + first step
await shot('r1-step-early');
await page.waitForTimeout(1600);
await shot('r2-step-mid');
await page.waitForTimeout(1800);
await shot('r3-step-later');
await page.waitForTimeout(2600);
await shot('r4-step-more');
await page.waitForTimeout(3500);
await shot('r5-later-case');
await page.waitForTimeout(4000);
await shot('r6-finished');

await browser.close();
console.log('done');
