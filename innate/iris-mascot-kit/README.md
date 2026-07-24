# Iris Mascot Kit — port the living mascot to another product

Everything needed to give another product the same companion: the 80-state animated
character, the speech bubble, hover/press interactivity, and the state machine that
decides what plays when. Built and battle-tested in the Iris (interview rehearsal)
app; this kit is self-contained.

```
iris-mascot-kit/
├── README.md                  ← you are here: the integration guide
├── companion.lottie           ← ALL 80 clips in one dotLottie bundle (~105 KB)
├── animations/                ← the same 80 clips as individual Lottie JSONs
├── src/                       ← portable source (React + zustand + dotlottie-react)
│   ├── mascotMachine.ts       ← pure state machine (no deps, unit-testable)
│   ├── mascotStore.ts         ← zustand wrapper around the machine
│   ├── useMascotMachine.ts    ← signal wiring hook  ★ adapt this file to your app
│   ├── dotlottieSetup.ts      ← serves the renderer WASM locally (no CDN)
│   ├── MascotPlayer.tsx       ← the dotLottie player component
│   ├── AIMascot.tsx           ← reference widget: bubble + hover + press + sizing
│   └── mascotHarness.tsx      ← dev harness page to preview everything
├── tools/                     ← the authoring pipeline (Python 3, stdlib only)
│   ├── generate_mascot_animations.py   ← every clip as code; edit → regenerate
│   ├── validate_mascot_animations.py   ← rig/seam/eye-formula validator
│   └── build_dotlottie.py              ← packages animations/ → companion.lottie
├── docs/
│   ├── mascot-animation-playbook.md    ← HOW TO AUTHOR new states (read first)
│   └── mascot-rig-README.md            ← full state catalog with descriptions
└── preview/
    └── companion-gallery.html          ← open in a browser: all 80 clips, live
```

Open `preview/companion-gallery.html` right now — it's the fastest way to know what
you have.

---

## 1. The architecture in one paragraph

Your app emits **signals** (narration started/ended, a product moment happened, the
app is busy, the user is idle, pointer entered/pressed). A **pure state machine**
(`mascotMachine.ts`) folds those into five priority layers — reaction > speaking >
working > hover > idle ladder > ambient — and resolves to one **clip name**. A single
persistent **dotLottie player** (`MascotPlayer.tsx`) swaps to that clip in-memory
inside `companion.lottie`. The **speech bubble** is plain React living next to the
player, fed by whatever text your narration produces. That's the whole system: no
transition table, because every clip starts/ends rest-compatible by design — any
layer can drop away and reveal the one below without a pop.

## 2. Quick start (~15 minutes)

1. **Dependencies** (React 18/19 assumed):
   ```bash
   npm i @lottiefiles/dotlottie-react zustand
   ```
   (zustand is only used by the thin store wrapper — 30 lines to rewrite if you use
   Redux/Jotai/signals instead.)

2. **Copy the files**: `companion.lottie` into your assets; `src/*` into your app.
   Fix the import paths (`@/…`) to your alias scheme.

3. **Bundler config** (Vite shown; the ideas port to webpack/rspack):
   - `assetsInclude: ['**/*.lottie']` in `vite.config`, and a module declaration:
     ```ts
     declare module '*.lottie?url' { const src: string; export default src }
     ```
   - `dotlottieSetup.ts` must run before any player mounts. It does:
     ```ts
     import { DotLottie } from '@lottiefiles/dotlottie-web'
     import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url'
     DotLottie.setWasmUrl(wasmUrl)
     ```
     Without this, dotlottie-web fetches its WASM from a third-party CDN at runtime —
     breaks offline, CSP-restricted iframes, and air-gapped deploys.

4. **Mount the widget**: use `AIMascot.tsx` as your template (rename freely). It shows
   the full recipe: fixed positioning, the speech bubble, hover-grow, press, and the
   player. Strip the store subscriptions you don't have (see §3).

5. **Verify with the harness**: wire `mascotHarness.tsx` to a dev route and click the
   buttons. If HI plays, the bubble shows, hover perks it up and press boops it,
   you're integrated.

## 3. Wiring YOUR product's signals (the only real work)

`useMascotMachine.ts` is the single impure file — everything else is portable as-is.
It subscribes to the source app's stores; replace those subscriptions with your own
events. The machine's full input vocabulary:

| Event | When to send it | What it does |
|---|---|---|
| `NARRATION_START {emotion}` | your assistant starts speaking (`'speaking'\|'correct'\|'wrong'`) | speaking layer on; picks one of 4 speaking variants, never the same twice in a row |
| `NARRATION_END` | speech ends | speaking layer off |
| `MOMENT {moment}` | a product moment fires (see below) | plays a one-shot reaction beat |
| `THINKING {on}` | your AI is generating | thinking face |
| `EXEC_RUNNING {on}` | any long-running job | `loading-dots` (or remap) |
| `HOVER {on, now}` | pointer enters/leaves the mascot | `attentive`; wakes the idle ladder |
| `PRESS` | pointer down on the mascot | `boop` |
| `USER_ACTIVE {now}` | throttled activity ping (~5s) | feeds the bored→sleeping ladder |
| `TICK {now}` | interval, ~3s | clock: ambient flavors, idle aging |
| `REACT {clip}` / `FLAVOR {clip, seconds}` | scripted beats (e.g. `hello` on first visit) | curated one-shot / temporary loop |
| `REACTION_DONE` | from the player's `complete` (already wired) | pops the reaction |

**Map your product's moments** in `MOMENT_REACTIONS` (mascotMachine.ts) — one line
each. The source app maps e.g. `test_pass → icon-check`, `phase_complete →
celebrate`, `session_complete → bow`, `idle_nudge → gesture-wave`. Rename the keys to
your events; the reaction plays first, then the speaking layer shows through for the
rest of the line. Reactions must be `ONCE_THROUGH` clips (list in the same file —
clips whose single cycle starts and ends at rest).

**You already have a fade that emulates speaking** — two clean ways to compose:

- **Recommended**: keep your fade exactly as-is and treat it as parallel presentation.
  Drive `NARRATION_START/END` from the *same* signal that triggers your fade. The
  machine handles *which clip* plays (speaking variants, reaction beats); your fade
  keeps handling emphasis/transition. They don't conflict — the machine never touches
  opacity of your container.
- If your fade was *simulating* a talking mascot (pulsing a static image), you can
  retire it: the four `speaking` variants are real talking performances (9s each,
  gesture-based, non-repetitive), and `MascotPlayer` already soft-blinks (260ms
  opacity dip) on every clip swap to mask mid-clip cuts. Don't run both a strong
  external fade and the internal blink — pick one owner for opacity.

## 4. The speech bubble (exact recipe)

See `AIMascot.tsx` lines with the `bubble` key — the parts that matter:

1. **Anchor**: a column flex container pinned by its **bottom** edge
   (`fixed left-6 bottom-6; flex flex-col items-start gap-2`) so the bubble sits above
   the mascot and growth pushes *upward*, never off-screen.
2. **Visibility** = `isSpeaking && text` — the bubble exists exactly while narration
   plays. Enter/exit with a small spring (`opacity 0→1, scale .9→1, y 8→0`).
3. **The tail**: a rotated 8×8 square sharing the bubble's background+border, absolutely
   positioned at the bubble's bottom-left — points at the mascot.
4. **Text source**: whatever your narration system says. Two production lessons:
   - Always have a **text fallback**: if audio is missing/blocked, still show the
     bubble and hold it for reading time (`max(2600ms, words × 380ms)`), so the mascot
     "speaks" even silent.
   - Keep lines short (bubble `max-w-[240px]`); one sentence per moment.
5. **Size choreography**: the mascot grows while speaking (83→109px) and a touch on
   hover (83→95px); if you have live audio, scale ±6% with a smoothed amplitude for a
   breathing effect (`scale: 1.12 + amplitude * 0.06`).

## 5. dotLottie integration gotchas (will save you a day)

Verified against `@lottiefiles/dotlottie-web` **0.76** — re-verify on upgrades:

- The WASM core parses the **v1 manifest** (`"version":"1.0"`, `activeAnimationId`,
  full entries). A v2 (`"version":"2"`) manifest loads but **never fires `load`** —
  silently. `tools/build_dotlottie.py` emits v1.
- The player **always opens `animations[0]`**, ignoring `activeAnimationId` and the
  `animationId` constructor option. The build script orders `idle` first;
  `MascotPlayer` additionally corrects on the `load` event.
- One-shot protocol: `setLoop(false)` → `play()` → listen for `complete` → tell the
  machine `REACTION_DONE`. Loops never emit `complete`. Already implemented.
- Test in a real browser; headless screenshot tools with "virtual time" do not advance
  WASM instantiation.
- Fallback option: every clip also ships as plain JSON in `animations/`, so any Lottie
  player (`lottie-react`, native iOS/Android Lottie) works — you lose in-memory
  switching and load ~13 KB per state instead.

## 6. What's in the box (state catalog)

80 clips, one rig, all rest-seam compatible. Full table with per-clip descriptions in
`docs/mascot-rig-README.md`; the families:

- **Core**: `idle` (9s, quiet), 4× `speaking` variants (9s gesture personalities),
  `thinking`, `correct`, `wrong`
- **Interactivity**: `attentive` (hover), `boop` (press)
- **Entrances/exits**: `hello` (arms spell "HI"), `enter`, `exit`
- **Emotions** (23): excited, sad, angry, surprised, confused, proud, shy, sleepy,
  love, celebrate, laughing, crying, nervous, smug, scared, bored, mind-blown, bow,
  alert, sleeping, stargaze, hiccup, sneeze
- **Icons & gestures** (10): icon-check/cross/clock/arrow/star/plus/heart/loading,
  gesture-wave, gesture-point
- **Activities** (7): writing, phone, coding, searching, juggling, presenting, workout
- **Motion & dance** (15): fly, swim, run, ball, zoom, spring, gravity-flip, dance,
  disco, clap, conduct, nod-yes, shake-no, bounce, spin, wobble, stretch, peek,
  float, dizzy, jump
- **Loading & system** (6): loading-dots/orbit/pulse/bar, impatient, processing

Prop layers (big yellow stars, a black held slab, dot, ring) are baked into the rig
and only ever appear as brief story beats — nothing to manage at runtime.

## 7. Re-theming for the new product

The rig's colors live in the clip data (arms `#1020F4` blue, body white, accents
`#FFE100` yellow, props near-black). To rebrand:

1. Edit the palette constants at the top of `tools/generate_mascot_animations.py`
   (`YELLOW`, `PROP_BLACK`) and, for the arm/body colors, the fills in
   `animations/idle.json` — the generator uses `idle.json` as the structural template
   and `upgrade_rig()` shows the recolor pattern (walk layers, replace `fl`/`st`
   colors).
2. Regenerate, validate, rebuild:
   ```bash
   python3 tools/generate_mascot_animations.py
   python3 tools/validate_mascot_animations.py     # must end "clean"
   python3 tools/build_dotlottie.py
   ```
   (Run from a directory laid out with `frontend/src/assets/mascot/` or adjust the
   `SRC` constant in each script.)
3. Keep contrast rules from the playbook: props must sit on the body or background,
   never on same-colored limbs; the eye needs a dark pupil on a light box.

## 8. Authoring new states

Read `docs/mascot-animation-playbook.md` — it is the distilled craft: rig anatomy and
the occlusion map, the living-eye formula (the catchlight must track the gaze — the
validator enforces it), squash/stretch and jump recipes, seam rules, the lid policy,
accent-prop rules, and a pitfall gallery of everything that cost a revision. The
workflow is always: add a `@state(...)` function → generate → validate → **render a
contact sheet and look at it** → rebuild the bundle.

## 9. Integration checklist

- [ ] `companion.lottie` served as an asset; WASM served locally via `dotlottieSetup`
- [ ] `MascotPlayer` mounts once and swaps clips (check: no network per state change)
- [ ] Machine wired: narration, moments, thinking, busy, activity, tick
- [ ] Your speaking-fade composed with (or replaced by) the speaking variants — one
      owner for opacity
- [ ] Speech bubble shows during narration with text fallback + reading-time hold
- [ ] Hover → attentive + app-side size grow; press → boop
- [ ] `hello` gated to first-visit (localStorage), not every mount
- [ ] Reduced motion: honor `prefers-reduced-motion` (pause ambient, keep bubble)
- [ ] Harness page reachable in dev; someone clicked every button
