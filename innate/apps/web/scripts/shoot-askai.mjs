import { chromium } from 'playwright-core';
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const out = process.argv[2];
const b = await chromium.launch({ executablePath: exe, headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5199/#build?problem=meeting-notes', { waitUntil: 'networkidle' }).catch(()=>{});
await p.reload({ waitUntil: 'networkidle' }).catch(()=>{});
await p.waitForTimeout(3500);
await p.getByText('Ask AI', { exact: true }).first().click().catch(e=>console.log('ask btn:', e.message));
await p.waitForTimeout(1200);
// click a suggestion card to send a message
await p.getByText('Explain the n8n concept here').click().catch(e=>console.log('suggestion:', e.message));
await p.waitForTimeout(2500);
await p.screenshot({ path: `${out}/askai.png` });
console.log('shot askai');
await b.close();
