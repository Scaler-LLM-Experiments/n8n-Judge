import { chromium } from 'playwright-core';

const OUT = '/tmp/judge-shots';
const URL = 'http://localhost:5173/#build';

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// empty build stage: sub-stage bar + add first step
await page.screenshot({ path: `${OUT}/b1-empty.png` });

// open trigger picker (phase-scoped)
await page.getByText('Add first step').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/b2-trigger-picker.png` });

// pick New Email → phase 1 completes → overlay transition should fire
await page.getByText('New Email', { exact: false }).first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/b3-transition.png` });

await browser.close();
console.log('done');
