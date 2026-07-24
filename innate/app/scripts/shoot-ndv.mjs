import { chromium } from 'playwright-core';

const OUT = '/tmp/judge-shots';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/#build', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// phase 1: add the trigger
await page.getByText('Add first step').click();
await page.waitForTimeout(400);
await page.getByText('New Email', { exact: false }).first().click();
await page.waitForTimeout(3300); // overlay → phase 2

// phase 2: add Classify with AI off the trigger's +
await page.getByTitle('Add next node').first().click();
await page.waitForTimeout(400);
await page.getByText('Classify with AI', { exact: false }).first().click();
await page.waitForTimeout(700);

// open its NDV
await page.getByText('Classify with AI', { exact: false }).first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/n1-sections.png` });

// click a wrong candidate → see the "why"
await page.getByRole('button', { name: 'Memory', exact: true }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/n2-wrong.png` });

// click the correct one, then map body in section 2
await page.getByRole('button', { name: 'Chat Model', exact: true }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'body', exact: true }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/n3-passed.png` });

await browser.close();
console.log('done');
