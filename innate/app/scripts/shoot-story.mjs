import { chromium } from 'playwright-core';

const OUT = '/tmp/judge-shots';
const URL = 'http://localhost:5173/#build';

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await shot('s1-intro');                                   // spotlight on the + , canvas dimmed

await page.getByText('Add first step').click();           // dismisses spotlight + opens picker
await page.waitForTimeout(600);
await shot('s3-picker');                                  // trigger picker drawer

// WRONG pick → node placed, Iris travels, floating MCQ
await page.getByText('On chat message', { exact: false }).first().click();
await page.waitForTimeout(700);
await shot('s4-probe');                                   // floating draggable MCQ (light)

// answer the "by mistake" option
await page.getByText('Added it by mistake', { exact: false }).first().click();
await page.waitForTimeout(500);
await shot('s5-probe-answered');
await page.getByRole('button', { name: /Got it/i }).click();
await page.waitForTimeout(600);

// CORRECT pick
await page.getByText('Add first step').click();
await page.waitForTimeout(400);
await page.getByText('New Email', { exact: false }).first().click();
await page.waitForTimeout(700);
await shot('s6-correct-node');                            // node placed + "Set me up"

// open NDV
await page.locator('.react-flow__node').first().click();
await page.waitForTimeout(600);
await shot('s7-ndv');                                     // field editing NDV

// set both editable fields, then Verify
await page.locator('select').nth(0).selectOption('inbox');
await page.locator('select').nth(1).selectOption('body');
await page.waitForTimeout(200);
await page.getByRole('button', { name: /Verify setup/i }).click();
await page.waitForTimeout(500);
await shot('s8-verified');                                // both fields green

// ask Iris why (green)
await page.getByText(/ask Iris why/i).first().click();
await page.waitForTimeout(700);
await shot('s9-fieldcoach');                              // Iris explains inside NDV

// close to finish (closing = complete once all green)
await page.getByRole('button', { name: /Close setup/i }).click();
await page.waitForTimeout(900);
await shot('s10-stageclear');                             // opaque stage-clear, Iris in stack

// into phase 2 — the trigger's output + should now pulse toward the next step
await page.getByRole('button', { name: /Keep building/i }).click();
await page.waitForTimeout(900);
await shot('s11-phase2');

await browser.close();
console.log('done');
