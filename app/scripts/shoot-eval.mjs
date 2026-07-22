import { chromium } from 'playwright-core';
const OUT = '/tmp/judge-shots';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:5173/#eval-demo', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/e1-question1.png` });

// Q1 has a matching sample case ('question') — answering it should trigger
// the live NodeReplay panel, ending on the Switch dead-end step.
await page.getByText("It doesn't match any of the 3 defined paths", { exact: false }).click();
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/e2-question1-answered.png` });

await page.getByText('Continue', { exact: false }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/e3-question2.png` });

// Q2 ('why-fixed-path') has no caseId — answering it should show the
// ConceptFlow diagram instead of a replay.
await page.getByText('Because the structure is fixed and predictable', { exact: false }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/e4-question2-answered.png` });

await browser.close();
console.log('done');
