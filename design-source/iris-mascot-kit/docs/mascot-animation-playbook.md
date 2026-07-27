# The Companion Animation Playbook

How to author new animation states for the mascot — the rig's geometry, the grammar of
its one living eye, the physics recipes, and every pitfall we hit while building the
first 70 states. Read this before touching `scripts/generate_mascot_animations.py`.

**The one-sentence contract:** every state is the *same 12 layers, shapes, colors and
canvas* as `idle.json` — only keyframes differ — so the app can cross-fade between any
two states without a pop.

---

## 1. How states are played (why the contract exists)

All clips ship as **one dotLottie bundle** — `companion.lottie`, built by
`scripts/build_dotlottie.py` — played by a single `@lottiefiles/dotlottie-react`
(WASM) instance in `MascotPlayer.tsx`. State swaps happen in-memory via
`dotLottie.loadAnimation(id)`; a 260ms soft opacity blink masks mid-clip swaps.
Transition LOGIC lives in `lib/mascotMachine.ts` (§11), not in dotLottie's own
state-machine format. The rig contract still rules, because any clip can be entered
or left at any moment:

- **Loops** must be seamless (first frame == last frame on every track), so a loop can
  run forever without a visible seam.
- **One-shots** must start *and* end on the neutral rest pose, so fading in from idle
  and handing back to idle is invisible.
- Held-pose loops (angry, coding, phone) may sit in a non-rest pose the whole loop —
  the 0.4s cross-fade absorbs the jump into the pose. Use static (non-animated) tracks
  for the held parts; they read as intentional posture.
- The only exceptions: **entrances** (`hello`, `enter`) start hidden, **exits**
  (`exit`) end hidden. Register them in the validator's `ENTRANCES`/`EXITS` sets.

## 2. Rig anatomy and the rest pose

Lottie `v5.7.4`, 60fps, 512×512, character center `[256,250]`.

| ind | layer | parent | rest pose | what you animate |
|---|---|---|---|---|
| 1 | StatusDot | 10 Face | `o:0, p:[256,168], s:100` | accent prop only (§7) |
| 2 | Eyelid | 10 Face | `s:[100,0]` (0 = open) | scaleY = blink/squint |
| 3 | Eye | 10 Face | `p:[256,250]`; Highlight `tr.p:[13,-7]`, Pupil `tr.s:100` | gaze (§4) |
| 4 | Body | 10 Face | 108×108 white round-rect r40 at center | rarely (Face.s does squash) |
| 5 | PulseRing | 10 Face | `o:0`, 150×150 navy stroke | accent prop only (§7) |
| 6–9 | Arm0/90/45/-45 | 11 Root | 84×330 blue rects, r = 0/90/45/-45 | `r`, `s`, `p` (icons) |
| 10 | Face | 11 Root | null at [256,250] | squash & stretch of the whole face |
| 11 | Root | — | null at [256,250] | master translate / rotate / scale |
| 12 | Shadow | — | 184×30 navy ellipse at [256,350], `o:18` | `s`/`o` (react to height), `p.x` (dashes) |
| 13 | Star1 | — | 5-point yellow star (or:32), `o:0` | prop: sparkles/orbits/twinkles (§7) |
| 14 | Star2 | — | 5-point yellow star (or:32), `o:0` | prop (§7) |
| 15 | Prop | 11 Root | 68×116 black round-rect r12, `o:0` | prop: held objects (phone…) (§7) |

Useful arm math: at scale `(sx, sy)` an arm is `84·sx/100` wide and `330·sy/100` long,
centered on its `p`, extending `165·sy/100` each way along its rotated axis.
"Hide" an arm by scaling to `(0,0)` — never delete or fade it.

## 3. THE MAP — render order and where things are visible

Layer order (top → bottom): **Star1, Star2, Prop, StatusDot, Eyelid, Eye, Body,
PulseRing, Arm0, Arm90, Arm45, Arm-45, Shadow.** Consequences you must design around:

- **Arms render BEHIND the body.** An icon or gesture only reads *outside* the body
  silhouette (the 108×108 box, screen x 202–310, y 196–304). A checkmark vertex hidden
  behind the box still reads — the brain completes it — but put the meaningful strokes
  in the open.
- **The starburst occupies four 84px-wide bands** along the 0°/90°/±45° axes out to
  radius 165. Anything blue placed on those bands is **invisible** (blue-on-blue).
- **StatusDot renders on top of everything** — but it is brand blue, so it only reads
  against the white body or the page background, never over an arm.
- **Clear sky** (safe zones for accent props and icon strokes): above the head beyond
  y≈85 between the vertical and diagonal bands; the four diagonal-gap wedges at
  ~22.5° off each axis; anywhere beyond radius ~250. When in doubt, check:
  distance from the point to each arm's axis line must exceed 42px (half arm width),
  or the point's distance from center must exceed the arm's half-length.
- The full-width band above the head (y < 85, x 91–421) is completely clear — that's
  where `loading-bar` lives and where `alert`'s "!" dot pops.

Learned the hard way: dizzy's orbit dot, sleepy's dream bubble, juggling's ball and
loading-bar's bar all shipped invisible on the first render because they sat on arm
bands. **Render before you believe.**

## 4. The living eye (the soul of the rig)

Gaze is a direction `(dx, dy)` with each component in [-1, 1]:

```
Eye.p        = [256 + dx·17, 250 + dy·14]
Pupil.tr.p   = [0, 0]                      (always — it rides the Eye layer)
m            = min(1, hypot(dx, dy))
Highlight.p  = [13·(1-m) + dx·15,  -7·(1-m) + dy·15]
```

The catchlight sits top-right `[13,-7]` at rest and leans into the gaze as the eye
moves — looking down puts the dot low, looking right puts it right. The generator's
`a.gaze([(t, dx, dy), ...])` writes both tracks together; the validator asserts the
formula at every keyframe. Never animate Highlight.p by hand.

**Timing grammar** (what makes the eye feel alive rather than robotic):

- **Saccade + fixation**: 2–4 frame eased move, then a 20–40 frame hold. Eyes jump and
  rest; they do not glide — *except* in dreamy states (float, bored) where a slow
  continuous drift with no saccades is itself the character.
- **Blinks**: scaleY 0→100→0 over ~4–6 frames. One blink per 2–4 seconds of loop.
  Double-blinks read as surprise or waking up.
- **The eye leads action** (staging): dart the gaze to the target a few frames *before*
  the arm points or the body jumps (`gesture-point`, `jump`), and let the gaze return
  *last* on the way out.
- **Counter-gaze**: when the head rocks (shake-no), counter-rotate the gaze so the eye
  stays locked on the viewer — instant "alive" feel.
- **Pupil scale** is emotion: dilate 106–130 for joy/wonder/love; constrict 70–92 for
  shock, fear, anger, tears. **Highlight scale** flares 115–135 for sparkle moments.
- Keep gaze magnitude ≤ ~1.2 combined (≤20px eye offset) so the 64px pupil stays
  inside the 108px box.

**Two traps discovered in review:**

1. **The pupil-under-lid blank face.** A happy squint (lid 55–80) combined with an *up*
   gaze hides the pupil entirely — the face goes blank white (celebrate's apex, proud's
   first squint). During a squint, keep the gaze near level or slightly **down**
   (dy ≈ 0…0.15) so a pupil arc stays visible — that arc *is* the smile.
2. **The smile-that-should-be-a-glare.** A narrowed eye reads by where the pupil sliver
   sits: sliver low in the box = smile; pupil bisected mid-box under a heavy flat lid =
   glare (angry). Position the sliver deliberately.

**Lid policy: sustained lid values are `0` or `≥35` — nothing between.** The eyelid is
a square-cornered 112px rect over a 40px-radius body: at small sustained values (5–20)
its corners poke past the body's rounded shoulders and float as a white bar on the blue
arms. Transient passes through small values (blinks, flutters) are fine.

## 5. Body mechanics — recipes that worked

- **Squash & stretch preserves volume**: pair Face.s x·y ≈ 100·100. Crouch `(108,90)`,
  stretch `(90,113)`, impact `(115,84)`. Squash on *contact*, stretch in *flight*.
- **Anticipation**: every launch buys energy with a 6–20 frame opposite move first —
  crouch before a jump, lean back before a dash, wind-up rotation before a spin.
- **Overshoot / follow-through**: land past the target and ease back (`spin` stops at
  366° then settles to 360°); let arms lag the body by ~4 frames (wobble, shake-no).
- **The jump recipe** (weight you can feel): eye leads up → deep crouch (squash, shadow
  darkens/spreads slightly) → 6–8 frame explosive launch (stretch) → apex float with
  relaxed scale, **shadow small (60–75%) and faint (o 9–12)** → accelerating fall
  (tighten keyframe spacing) → impact squash, **shadow 115%+, o 24–26** → rebound →
  settle. The shadow sells every jump; never leave it static during air time.
- **Vibration/tremble**: alternate ±1–2px keys every 2–4 frames (angry, nervous,
  scared) — spacing does the work; keep the standard ease handles.
- **Rotation seams**: full turns end at 360 (or base+360), which the validator accepts
  mod 360. For a *cluster* spin without rotating the face, rotate each **arm** by
  +360 instead of Root (`icon-loading`, `processing`).
- **Ball/fall physics**: wide keyframe spacing near an apex, tight spacing near the
  ground. Ease handles are always the standard pair; *spacing* creates snap.
- Sines for cyclic motion: sample every 6–30 frames with a period that divides `op`
  (the `sine()` helper guarantees the loop seam).

## 6. Loops, one-shots, and lengths

- Loop lengths: 72–144 frames for rhythmic states; 150–264 for narrative loops
  (sleepy's nod-off, peek's hide-and-pop). Give narrative loops a **rest beat** before
  the seam so the story breathes.
- One-shots: 60–150 frames. Settle fully by ~85% of `op` and hold rest — the app needs
  a clean tail to fade on.
- The **first frame of a loop is also its poster frame** — many samplers/thumbnails
  show t0. Starting at (or near) rest reads best.

## 7. Accent props (rig v2: StatusDot / PulseRing / Star1 / Star2 / Prop)

Five permanently-hidden layers double as story props — the only "extra elements"
allowed. **Brilliant-rule: props are BIG and near-solid.** Small translucent dots
read as dirt; a prop earns its frame or doesn't appear (star ≥ scale 100 ≈ 64px,
dot ≥ scale 120, opacity ≥ 85).

- Default prop color is **yellow #FFE100** (StatusDot fill, PulseRing stroke w:10,
  both stars). States may **tint per use** via `a.tint(layer, rgb)` — tears/sweat are
  soft blue `(0.36,0.62,1)`, bubbles pale blue — safe because accents are invisible at
  every seam/cross-fade. The Prop slab is near-black (a held object, e.g. the phone).
- Animated opacity starts **and** ends at 0 (validator-enforced); a held prop in a
  loop (phone) may instead keep a static non-zero opacity — the cross-fade carries it.
- The validator exempts accent `p/s/r` tracks from seam/rest checks (opacity owns
  visibility); register every use in its `ACCENTS` map.
- Keep it brief and singular — one metaphor per state, the mascot stays the subject.
- **Star1/Star2 and blue-tinted dots live on white or background only** (see THE MAP);
  yellow survives over the blue arms but still reads best in the open. Stars/Prop are
  world-space (Prop parents Root); StatusDot parents Face and inherits face squash.

Established vocabulary (reuse before inventing):
blue tear (sad, crying) · blue sweat (nervous) · dream-orb (sleepy, sleeping) ·
counter-orbiting star pair (dizzy) · yellow ball (juggling) · bubble (swim) ·
satellite (loading-orbit) · twinkling sky stars (stargaze) · "!" (alert) ·
shock ring (surprised) · heartbeat ring (love) · burst ring + confetti stars
(celebrate) · tip sparkle (icon-check) · press sparkle (boop) · star blast
(mind-blown) · clap ping (clap) · sonar (loading-pulse) · bezel (icon-clock) ·
black phone Prop (phone).

## 8. Icon morphs and arm gestures

- Morph in over 8–16 frames, hold, morph back before the seam. Arms may animate `p`
  for icon geometry but must return to `[256,250]` at rest.
- Tuck the eye during a morph by **closing the lid** (the box goes clean white — "icon
  mode"), and pop it back open once the shape settles. Let the reopened eye *react* to
  the icon (glance at the checkmark, stare along the arrow).
- Work out stroke geometry on paper first: tip = `p ± (sin r, -cos r)·165·sy/100`.
  Make strokes thin (`sx` 15–55) for line-icons; the default 84px width reads as a slab.
- Letters are possible: H = two posts + a crossbar, I = one post — `hello` spells "HI"
  with exactly four rects.
- Two-ended-ness is real: a centered arm pokes out **both** sides. Either embrace it
  (clock hands with counterweights) or offset `p` so one end does the talking.

## 9. Workflow (never ship unrendered)

```bash
# 1. Author: add a @state(...) function in scripts/generate_mascot_animations.py
# 2. Generate all files
python3 scripts/generate_mascot_animations.py
# 3. Validate structure, seams, rest poses, accents, eye formula
python3 scripts/validate_mascot_animations.py
# 4. LOOK at it — render an 8-frame contact sheet with headless chromium + lottie-web
#    (build a render.html that inlines lottie.min.js + the JSONs, then:)
headless_shell --no-sandbox --headless --screenshot=sheet.png \
  --window-size=1760,240 --virtual-time-budget=3000 "file://$PWD/render.html?anim=<name>"
# 5. Fix what the render shows. Repeat.
# 6. Rebuild the dotLottie bundle the app plays (idle stays first in the manifest)
python3 scripts/build_dotlottie.py
# 7. Commit the generator + JSONs + companion.lottie together.
```

New state checklist:

1. Registered with the right `op`, `loop` flag, and (if needed) `accents` / entrance /
   exit sets in **both** generator and validator.
2. Loop seam or rest-pose ends verified (validator), including rotations mod 360.
3. Gaze via `a.gaze()` only; saccade/fixation timing; ≤20px amplitude.
4. Sustained lids 0 or ≥35; squints keep a pupil arc visible.
5. Squash volume-preserving; anticipation before every launch; shadow reacts to height.
6. Accents fade 0→…→0 and sit on white/background per THE MAP.
7. Contact sheet rendered and actually looked at — including t0 (the poster frame).
8. Distinct: name one thing no sibling state does (timing, silhouette, eye behavior).
9. README table row + one-line description added.

## 10. Pitfall gallery (each cost us a revision)

| Pitfall | Where we hit it | Fix |
|---|---|---|
| Blue prop on blue arm = invisible | dizzy orbit, sleepy Z, juggling ball, loading-bar | place per THE MAP (§3) |
| Narrowed eye reads as a smile | angry v1 | pupil bisected mid-box = glare (§4) |
| Squint + up-gaze = blank white face | celebrate apex, proud v1 | gaze level/down during squints |
| Sustained micro-lid = floating white bar | phone, coding, fly v1 | lid 0 or ≥35 (§4) |
| Icon strokes too thick/short to read | icon-clock v1, icon-arrow v1 | thin scaleX, tips must clear the body |
| Chevron strokes merged into a blob | icon-arrow v1 | spread stroke centers, thin them |
| Prop parked off-rest while invisible | alert "!" dot | return `p` home during o:0 |
| Barrier assumption: arms can cover the face | peek concept | arms render behind — shrink the Face instead |
| Loop pulses that should be held poses | angry breathing-rage debate | statics + cross-fade for held poses |

## 11. The state machine (how clips get chosen at runtime)

The **player** is dotLottie (`companion.lottie` + `@lottiefiles/dotlottie-react`), but
transition **logic** stays a pure TypeScript machine rather than dotLottie's embedded
state-machine JSON — the product logic (narration moments, AI thinking, execution,
idle ladder) needs app events anyway, and pure TS is unit-testable and diffable:

- **`frontend/src/lib/mascotMachine.ts`** — the machine itself: typed `ClipName` registry
  for all 75 clips, events, a pure `reduce(state, event)` and `resolveClip(state)`.
  Rather than a transition table between every pair of states, it resolves five
  **priority layers** — `reaction` (once-through beats) > `speaking` (narration ±
  emotion) > `working` (AI thinking, code executing) > `deep idle` (bored → sleeping)
  > `ambient` (idle + a seeded scheduler that occasionally plays a flavor loop like
  float/stargaze/peek). Layer masking works *because of* the rig contract: every clip
  is rest-compatible at its seams, so any layer can drop away and reveal the one below.
- **`frontend/src/stores/mascotStore.ts`** — zustand wrapper: `send(event)`, the resolved
  clip, and lazy per-clip chunk loading (`import.meta.glob`) with a warm cache.
- **`frontend/src/hooks/useMascotMachine.ts`** — the only impure part: subscribes
  voiceStore (narration start/end + emotion), chatStore (thinking), executionStore
  (running), throttled user-activity pings, and a 3s `TICK` clock.
- **`voiceStore.play(moment)`** notifies the machine of every narration moment, and
  `MOMENT_REACTIONS` maps them to beats: test_pass → `icon-check`, phase_complete →
  `celebrate`, session_complete → `bow`, idle_nudge → `gesture-wave`, etc. Reactions
  fire even when audio is muted — the visual beat is feedback in its own right.
- **`MascotPlayer.tsx`** plays the resolved clip out of the bundle; `once` clips run
  with loop off and report `REACTION_DONE` from the player's `complete` event.
  Everything is behind the `mascotMachine` feature flag — off = the original
  lottie-react thinking/speaking/idle ternary.
- **Interactivity**: `AIMascot` feeds pointer events to the machine — hover holds the
  `attentive` layer (above ambient/working, below speaking/reactions; also wakes the
  bored/sleeping ladder), and press fires the `boop` reaction. Both are purpose-built
  clips, so interaction feel is authored in keyframes, not in easing hacks.

### dotLottie integration notes (hard-won, re-verify on dependency upgrades)

- **Manifest**: dotlottie-web 0.76's WASM core parses the **v1** manifest
  (`"version":"1.0"`, `activeAnimationId`, full animation entries). A v2
  (`"version":"2"`) manifest loads but never fires `load` — silently.
- **Initial animation**: the player opens `animations[0]` regardless of
  `activeAnimationId` or the `animationId` constructor option, so the build script
  puts `idle` first; `MascotPlayer` also corrects on `load` if the active id differs.
- **WASM**: served locally via `import wasmUrl from
  '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url'` (note: the package export
  path has no `dist/`) + `DotLottie.setWasmUrl(wasmUrl)` — never the default CDN
  (offline, embed CSP). ~684KB gzipped, fetched lazily when the mascot first renders.
- **Smoke test**: any player/bundle change gets verified against the real player in
  headless Chromium (load events per id, in-bundle `loadAnimation` switching, the
  once→`complete` chain) before shipping — virtual-time screenshots don't advance
  WASM instantiation; drive it with Playwright and real waits.

Adding behavior: new product moment → add one line to `MOMENT_REACTIONS`; new curated
beat → add the clip to `ONCE_THROUGH` (only if its single cycle starts AND ends at
rest); new ambient variety → extend `FLAVOR_POOL` (rest-seamed loops only); and any
new clip must be in the regenerated `companion.lottie` AND the `CLIPS` registry. The
machine is pure — simulate any event sequence in Node to verify behavior first.
