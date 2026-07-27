import { chromium } from 'playwright-core';

const out = '/private/tmp/claude-501/-Users-sudhanvaacharya-Desktop-Code-Projects-Scaler--LMS-n8n-Judge/265083a2-3f49-47fa-ac18-e135250826b1/scratchpad';

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});

async function login(page) {
  await page.goto('http://localhost:3000/login');
  await page.evaluate(async () => {
    const { csrfToken } = await (await fetch('/api/auth/csrf')).json();
    await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, email: 'smoke@judge.local', password: 'smoke-test-password' }),
    });
  });
}

// Desktop: a problem journey screen still shows stage pills + avatar.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page);
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  // click first "Try this judge" to enter a problem journey
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Try this judge'));
    btn?.click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${out}/journey-topbar.png` });
  await page.close();
}

// Narrow viewport: home page grid should degrade without horizontal scroll.
{
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
  await login(page);
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const scrollInfo = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  console.log('NARROW scrollInfo:', JSON.stringify(scrollInfo));
  await page.screenshot({ path: `${out}/home-narrow.png`, fullPage: true });
  await page.close();
}

await browser.close();
