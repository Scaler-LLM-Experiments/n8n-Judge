import { chromium } from 'playwright-core';
const OUT = '/tmp/judge-shots';
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1440, height: 980 } });

await p.goto('http://localhost:5173/#report-demo', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.screenshot({ path: `${OUT}/rep1-collapsed.png`, fullPage: true });

// Expand the misconception card ("Treated a chat trigger as an email trigger").
await p.getByText('Treated a chat trigger as an email trigger', { exact: false }).click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/rep2-misconception-open.png`, fullPage: true });

// Expand the correct stress decision row — should show chosen/correct labels
// plus a live NodeReplay panel (this question has a caseId).
await p.getByText("It doesn't match any of the 3 defined paths", { exact: false }).first().click();
await p.waitForTimeout(3000); // let NodeReplay's timed steps reveal
await p.screenshot({ path: `${OUT}/rep3-stress-decision-open.png`, fullPage: true });

await b.close();
console.log('done');
