import { chromium } from 'playwright-core';
const base='http://localhost:3000';
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROME,headless:true});
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const page=await ctx.newPage();
const posts=[]; page.on('response',async r=>{ if(r.url().includes('/events')){ try{posts.push({s:r.status(),...(await r.json())});}catch{} } });
page.on('pageerror',e=>console.log('PAGEERROR:',e.message));
page.on('console',m=>{ if(m.type()==='error' && /trace/i.test(m.text())) console.log('CONSOLE:',m.text().slice(0,160)); });
await page.goto(`${base}/login`,{waitUntil:'domcontentloaded'});
await page.evaluate(async()=>{const{csrfToken}=await (await fetch('/api/auth/csrf')).json();
  await fetch('/api/auth/callback/credentials',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({csrfToken,email:'smoke@judge.local',password:'smoke-test-password'}),redirect:'follow'});});
await page.goto(`${base}/#build?problem=email-triage`,{waitUntil:'networkidle'});
await page.reload({waitUntil:'networkidle'});
await page.waitForTimeout(4000);
await page.getByText('Add first step').click({timeout:8000});
await page.waitForTimeout(1200);
for (const n of ['New Email','Gmail']) { const e=page.getByText(n,{exact:false}).first();
  if (await e.count() && await e.isVisible().catch(()=>false)) { await e.click().catch(()=>{}); break; } }
await page.waitForTimeout(4500);   // let the 2s flush timer fire
console.log('POSTs to /events:', posts.length ? JSON.stringify(posts) : 'NONE');
const keys = await page.evaluate(() => Object.keys(sessionStorage).filter(k=>k.startsWith('judge.trace.')));
console.log('sessionStorage mirror:', keys.length ? keys : 'none');
if (keys.length) {
  const snap = await page.evaluate((k)=>JSON.parse(sessionStorage.getItem(k)), keys[0]);
  console.log('  unsent still queued:', snap.pending.length, '| next number:', snap.nextSeq);
}
await b.close();
