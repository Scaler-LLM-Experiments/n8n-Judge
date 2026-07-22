import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1440, height: 980 } });
await p.goto('http://localhost:5173/#report-demo', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.screenshot({ path: '/tmp/judge-shots/rep.png', fullPage: true });
await b.close(); console.log('done');
