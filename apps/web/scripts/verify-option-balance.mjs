// End-to-end check on two properties of GET /api/problems/[slug]:
//
//   1. The correct option is NOT parked in the same slot everywhere. Authored
//      data puts it first in every graded list (13/13 dissection, 24/24 fields,
//      18/18 probes), and `balanceProblemOptions` spreads it server-side while
//      the answer key still exists. If this regresses, "always click the top
//      option" becomes a winning strategy and the build stops measuring anything.
//   2. No correctness marker is in the payload at all.
//
// Needs the dev server and a seeded database:
//   SMOKE_CHROME="..." node apps/web/scripts/verify-option-balance.mjs
import { chromium } from 'playwright-core';
import { signIn } from './signIn.mjs';
import { problems } from '@judge/problems';

const base = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROME, headless: true });
const ctx = await b.newContext();
const auth = await signIn(ctx, base);
if (!auth.ok) { console.log('sign-in failed'); process.exit(1); }
const page = await ctx.newPage();
await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });

for (const slug of Object.keys(problems)) {
  const served = await page.evaluate(async (s) => (await fetch(`/api/problems/${s}`)).json(), slug);
  const p = served.problem ?? served.data ?? served;
  const authored = problems[slug];

  // Map served option order back to authored correctness by value/label.
  const pos = [];
  for (const [type, setup] of Object.entries(p.nodeSetup ?? {})) {
    for (const f of setup.fields ?? []) {
      if (!f.options) continue;
      const key = (authored.nodeSetup[type].fields ?? []).find((x) => x.key === f.key);
      const correctVal = (key?.options ?? []).find((o) => o.correct)?.value;
      pos.push(f.options.findIndex((o) => o.value === correctVal));
    }
  }
  const dis = [];
  for (const q of p.dissection ?? []) {
    const a = authored.dissection.find((x) => x.id === q.id);
    dis.push((q.options ?? []).findIndex((o) => o.type === a?.correctType));
  }
  const spread = (xs) => { const m = {}; for (const x of xs) m[x] = (m[x]??0)+1; return JSON.stringify(m); };
  const leak = JSON.stringify(p).includes('"correct":true') || JSON.stringify(p).includes('correctType');
  console.log(`${slug.padEnd(14)} fields ${spread(pos)}  dissection ${spread(dis)}  answer-key leaked: ${leak}`);
}
await b.close();
