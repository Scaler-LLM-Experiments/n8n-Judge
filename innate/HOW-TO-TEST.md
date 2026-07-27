# How to test n8n Judge

Two ways: **run it locally** (fastest, works today) or **deploy to Railway** (a URL you
can share). Everything below assumes the branch `claude/init-jniws3`.

---

## Option A — run it locally (5 minutes)

```bash
git fetch origin claude/init-jniws3
git checkout claude/init-jniws3
cd innate
npm install          # installs the whole monorepo
cd apps/web
npm run dev          # → http://localhost:3000
```

Open **http://localhost:3000**. You should see **three challenges** on the home page.

### What to click through

1. **Home** — pick a challenge ("Try this judge").
2. **Understand** — Iris asks which node fits each part of the problem. Pick a *wrong*
   option on purpose: you should get a hint, not the answer.
3. **Build** — click the glowing `+`, place nodes, open a node to configure it (the NDV),
   hit **Verify setup**. Drop a *wrong* node on purpose to see the misconception probe.
4. **Run** — watch the sticky note travel the flow, case by case.
5. **Stress Testing** → **Result** — answer the edge-case questions, see the score,
   the per-area breakdown, and any misconceptions you triggered.

### The three challenges, and what each is for

| Challenge | Shape | Why it exists |
|---|---|---|
| **Email Triage Automation** | trigger → AI → parse → **switch** → 3 replies | The original routing problem |
| **Inbound Sales Lead Triage** | same shape, sales framing | Second routing problem |
| **Meeting Notes Summarizer** | webhook → AI summarize → Google Docs (**linear, no switch**) | New. Proves topology is data — this shape could not run before |

### Faster ways in (dev routes)

Append these to the URL to jump straight to a screen. All accept `?problem=<id>`
(`email-triage`, `lead-triage`, `meeting-notes`):

- `#build` — straight to the Build canvas
- `#run-story` — a finished flow that auto-runs (best way to see the Run animation)
- `#eval-demo` — Stress Testing
- `#report-demo` — the Result screen

Example: `http://localhost:3000/#run-story?problem=meeting-notes`

### Turning on live Ask-AI

The **Ask AI** button (top right) opens Iris. Without an API key it shows a polite
"not switched on in this environment" message. To get real streaming answers:

```bash
cd innate
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY="sk-ant-..."
cd apps/web && npm run dev
```

Then ask Iris something mid-challenge. Note it is deliberately built **not to give
answers away** — ask "which node should I pick?" and it should teach the concept and
ask you a guiding question instead. That is the intended behavior, not a bug.

---

## Option B — deploy to Railway (a shareable URL)

The repo is already configured; the only manual step is connecting it.

1. Railway → **New Project** → **Deploy from GitHub repo** → pick this repo.
2. **Settings → Root Directory: `innate`** ← the important one. This makes Railway use
   the Dockerfile that builds the Next.js app.
3. **Variables** → add:
   - `ANTHROPIC_API_KEY` — enables live Ask-AI (optional; without it Ask-AI shows the
     fallback message and everything else works)
   - `DATABASE_URL` — not needed yet; required once auth/persistence lands
4. Deploy. Railway injects `PORT`; the container serves on it automatically.

Health check is `/`. If the build fails, the usual cause is Root Directory not being
set to `innate`.

---

## Checking the code is sound (no browser)

```bash
cd innate
npm test                          # 63 unit tests — engine, schema, all 3 problems
npm run build --workspace @judge/web   # production build
```

`npm test` is the fast signal: it validates every shipped problem against the authoring
validator (zero errors *and* zero warnings), replays the simulation engine over each
problem's reference wiring, and guards the grading-store invariants.

To run one file: `npx vitest run packages/engine/simulate.test.js`

---

## What is NOT testable yet

These are built but not yet wired to a running database, so they can't be clicked:

- **Accounts / login** (Prisma schema exists; Auth.js not wired) — M1
- **Session persistence & resume-on-reload** — M2
- **LLM grading worker + the real AI report** (the Result screen currently shows the
  client-side score only) — M3
- **Admin analytics / session map / rubric editor** — M4
- **Problem authoring pipeline** — M5
- **Voice (Iris speaking)** — M6

The next milestone that becomes clickable is **auth + persistence**: create an account,
log in, refresh mid-challenge, and pick up exactly where you left off.

---

## If something looks wrong

Worth reporting with a screenshot:

- A node that renders as a grey placeholder instead of its real icon
- Iris giving away an answer in Ask-AI
- A flow diagram or narration line that mentions emails on the Meeting Notes challenge
  (that class of bug was just fixed, but shout if any remain)
- The Run animation dead-ending on a flow you believe is wired correctly
