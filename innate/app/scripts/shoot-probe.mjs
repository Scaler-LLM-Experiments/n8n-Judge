import { chromium } from 'playwright-core';
const OUT = '/tmp/judge-shots';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/#build', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.getByText('Add first step').click();
await page.waitForTimeout(400);
// pick a plausible-wrong trigger → probe should fire
await page.getByText('On chat message', { exact: false }).first().click();
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/p1-probe.png` });
// answer with a misconception option
await page.getByText('Emails and chats both bring in a message', { exact: false }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/p2-probe-answer.png` });
await browser.close();
console.log('done');
