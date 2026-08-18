# Reaching Judge from networks that block Railway

Some Indian ISPs — Jio confirmed, some office WiFi too — refuse to resolve
`n8n-judge-production.up.railway.app`. The browser shows
`DNS_PROBE_FINISHED_BAD_CONFIG` / "server IP address could not be found", while the
same host resolves to `69.46.46.109` and answers `/api/health` with 200 from any
other network. **The name is blocked, not the server.**

That rules out the usual fix: a custom domain CNAME'd at Railway still forces the
learner's resolver to follow the chain to the blocked name. It also rules out
"wait for Railway", because nothing on Railway is wrong.

This worker gives learners a hostname Cloudflare serves — `*.workers.dev`, which
those networks resolve — and reaches Railway from Cloudflare's network, where the
name works. **If a real domain ever becomes available, delete this**: a proxied
(orange-cloud) CNAME does the same job with no code to maintain.

## Deploy

```bash
cd infra/cloudflare-worker
npx wrangler login          # opens a browser; needs the Cloudflare account
npx wrangler deploy
```

`deploy` prints the public URL, `https://n8n-judge.<your-subdomain>.workers.dev`.

## Then point the app at that URL — not optional

Auth.js validates the `Origin` of a sign-in POST against the host it believes it
is serving. Behind the worker the browser's origin is workers.dev while the Host
header is still Railway's, so without this the login POST is rejected as an
untrusted host and nobody can sign in.

On the Railway service (`n8n Judge` → `n8n-Judge` → Variables):

```
AUTH_URL=https://n8n-judge.<your-subdomain>.workers.dev
AUTH_TRUST_HOST=true
```

Then redeploy. The old Railway URL keeps working for anyone whose network never
blocked it.

## Verify — on the affected network, not on a laptop that already worked

```bash
SMOKE_BASE_URL=https://n8n-judge.<your-subdomain>.workers.dev \
SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npm run smoke
```

Then by hand, because smoke does not cover them: sign in, open a shared link
(`/?problem=email-triage`) while signed out and check it survives the login
bounce, play a voice clip, and ask Iris something and watch the answer stream in.
Streaming and audio Range requests are what a badly written proxy breaks while
every page still looks fine.

## What it costs

The free plan allows 100,000 worker requests a day. A full journey is a few
hundred requests (page, hashed assets, API calls, one voice clip per narrated
moment), so roughly 200-300 journeys a day before the limit bites. `/_next/static/*`
is cached at the edge to keep that down. The $5/month plan raises it to 10M if a
cohort ever needs it.

## Rollback

`npx wrangler delete`, and remove `AUTH_URL` / `AUTH_TRUST_HOST` from Railway.
Everyone whose network resolves Railway directly is unaffected either way.
