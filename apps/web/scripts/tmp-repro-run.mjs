import { chromium } from 'playwright-core';

const OUT = '/private/tmp/claude-501/-Users-sudhanvaacharya-Desktop-Code-Projects-Scaler--LMS-n8n-Judge/265083a2-3f49-47fa-ac18-e135250826b1/scratchpad/shots';

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text()); });

await page.goto('http://localhost:3000/login');
const { csrfToken } = await page.evaluate(async () => (await (await fetch('/api/auth/csrf')).json()));
await page.evaluate(async (csrfToken) => {
  await fetch('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, email: 'smoke@judge.local', password: 'smoke-test-password' }),
  });
}, csrfToken);

const problem = process.argv[2] || 'email-triage';
await page.goto(`http://localhost:3000/#run-story?problem=${problem}`);
await page.waitForTimeout(1500);

// Track the note element's bounding box + the mascot's bounding box every 400ms.
for (let i = 0; i < 22; i++) {
  const info = await page.evaluate(() => {
    const note = document.querySelector('[class*="fade-in"]');
    const all = Array.from(document.querySelectorAll('div')).filter(d => d.style && d.style.width === '224px');
    const noteDiv = all[0];
    const rect = noteDiv ? noteDiv.getBoundingClientRect() : null;
    const style = noteDiv ? { left: noteDiv.style.left, top: noteDiv.style.top } : null;
    return { rect: rect ? { x: rect.x, y: rect.y } : null, style };
  });
  console.log(`t=${(i * 400)}ms`, JSON.stringify(info));
  await page.screenshot({ path: `${OUT}/${problem}-${String(i).padStart(2, '0')}.png` });
  await page.waitForTimeout(400);
}

await browser.close();
