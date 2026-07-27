import { chromium } from 'playwright-core';
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const out = process.argv[2];
const base = 'http://localhost:5199';
const routes = [['home2', `${base}/`], ['mn-build', `${base}/#build?problem=meeting-notes`], ['mn-run', `${base}/#run-story?problem=meeting-notes`]];
const b = await chromium.launch({ executablePath: exe, headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
for (const [name, url] of routes) {
  await p.goto(url, { waitUntil: 'networkidle' }).catch(()=>{});
  await p.reload({ waitUntil: 'networkidle' }).catch(()=>{});
  await p.waitForTimeout(4000);
  await p.screenshot({ path: `${out}/${name}.png` });
  console.log('shot', name);
}
await b.close();
