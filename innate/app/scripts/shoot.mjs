import { chromium } from 'playwright-core';

const OUT = '/tmp/judge-shots';
const URL = 'http://localhost:5173/#playground';

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// 1. empty state
await page.screenshot({ path: `${OUT}/1-empty.png` });

// add first step → trigger picker → New Email
await page.getByText('Add first step').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/2-trigger-picker.png` });
await page.getByText('New Email', { exact: false }).first().click();
await page.waitForTimeout(700);

// add next node off the trigger → general picker → Classify with AI
await page.getByTitle('Add next node').first().click();
await page.waitForTimeout(500);
await page.getByText('Classify with AI', { exact: false }).first().click();
await page.waitForTimeout(600);
await page.locator('.react-flow__controls-fitview').click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/3-ai-node.png` });

// open NDV on the AI node
await page.getByText('Classify with AI', { exact: false }).first().click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/4-ndv.png` });

await browser.close();
console.log('done');
