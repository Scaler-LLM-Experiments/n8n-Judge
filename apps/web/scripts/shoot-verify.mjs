import { chromium } from 'playwright-core';
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const out = process.argv[2];
const b = await chromium.launch({ executablePath: exe, headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error' && !/wasm|lottie|favicon/i.test(m.text())) errs.push('console: ' + m.text()); });

// Problem statement panel on the NEW problem (its data source changed)
await p.goto('http://localhost:5199/#build?problem=meeting-notes', { waitUntil: 'networkidle' }).catch(()=>{});
await p.reload({ waitUntil: 'networkidle' }).catch(()=>{});
await p.waitForTimeout(3500);
await p.locator('[title="Problem statement"], [data-tour="problem"]').first().click().catch(e=>console.log('panel btn:', e.message));
await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/verify-statement.png` });
console.log('shot verify-statement');

// email-triage still fine after legacy-field removal
await p.goto('http://localhost:5199/#run-story?problem=email-triage', { waitUntil: 'networkidle' }).catch(()=>{});
await p.reload({ waitUntil: 'networkidle' }).catch(()=>{});
await p.waitForTimeout(5000);
await p.screenshot({ path: `${out}/verify-email.png` });
console.log('shot verify-email');
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO PAGE ERRORS');
await b.close();
