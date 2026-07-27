# The AI Mascot System — Complete Porting Guide

Everything about the mascot ("Iris"): the animation rig, the runtime state machine, the
voice narration pipeline, the NUX tours it narrates, the S3 storage layout, and every
delight detail. Written so the whole system can be re-implemented in another product with
the same use case.

**The concept:** a calm AI-interviewer companion pinned to the bottom-left of the session
screen. It reacts to what the learner does (test pass/fail, step complete, phase advance),
speaks short pre-rendered voice lines at key moments, narrates the onboarding tours by
physically traveling to each highlighted element, gets bored and falls asleep when ignored,
perks up on hover, and boops when pressed. Clicking it opens the AI assistant.

---

## 1. File map

### Frontend (React 19 + Zustand + framer-motion)
| File | Role |
|---|---|
| `frontend/src/components/session/AIMascot.tsx` | The mascot component: bubble, tour travel, interactivity, amplitude pulse |
| `frontend/src/components/session/MascotPlayer.tsx` | Single persistent dotLottie WASM player, swaps clips in-memory |
| `frontend/src/components/session/LegacyMascotPlayer.tsx` | Flag-off fallback: 5 lottie-react players cross-faded |
| `frontend/src/lib/mascotMachine.ts` | Pure `(state, event) → state` reducer + `resolveClip` — the brain |
| `frontend/src/stores/mascotStore.ts` | Zustand wrapper: `send(event)`, resolved clip, `focusRect` travel target |
| `frontend/src/hooks/useMascotMachine.ts` | The only impure part: subscribes app stores + TICK clock |
| `frontend/src/lib/dotlottieSetup.ts` | Serves the dotLottie WASM locally (offline/CSP-safe) |
| `frontend/src/assets/mascot/companion.lottie` | The bundle: all ~75 clips in one zip |
| `frontend/src/stores/voiceStore.ts` | Narration playback: Web Audio, captions, prefetch, fallbacks |
| `frontend/src/components/session/VoiceNarrationIndicator.tsx` | Ambient corner glow that breathes with the voice |
| `frontend/src/stores/tourStore.ts` | Tour state: progressive-disclosure queue, server sync |
| `frontend/src/config/tours.ts` | Tour definitions (steps, targets, copy) |
| `frontend/src/hooks/useProductTour.ts` | Context-scoped tour triggers |
| `frontend/src/components/common/ProductTour.tsx` | Spotlight overlay + anchor measurement + step narration |
| `frontend/src/components/common/MascotLoader.tsx` | Mascot-as-spinner replacement |
| `frontend/src/components/common/AudioConsentGate.tsx` | One-time audio consent (autoplay unlock gesture) |
| `frontend/src/hooks/useInactivityNudge.ts` | Idle → "need a hand?" |
| `frontend/src/hooks/usePhaseTimeCues.ts` | Spoken "1 minute left" / "time's up" |
| `frontend/src/config/featureFlags.ts` | Kill switches |
| `frontend/mascot-harness.html` + `src/dev/mascotHarness.tsx` | Standalone dev page: real mascot tree + signal-simulation buttons, no backend |

### Backend (FastAPI + ARQ workers)
| File | Role |
|---|---|
| `app/modules/voice/routes.py` | `GET /api/v1/voice/narration?moment=` + `/diagnostics` |
| `app/modules/voice/service.py` | Clip resolution, manifests, caching, name splicing |
| `app/modules/voice/phrases.py` | PHRASES — all generic narration text (single source of truth) |
| `app/modules/voice/phase_intros.py` | Per-problem per-phase intro scripts |
| `app/modules/voice/tour_narration.py` | Tour step narration text (mirrors tours.ts verbatim) |
| `app/modules/voice/audio_utils.py` | stdlib-`wave` WAV splicing (name personalization) |
| `app/modules/voice/storage_backend.py` | Local-dir vs S3 indirection, dedicated audio bucket |
| `app/modules/voice/tasks.py` | ARQ task: render a learner's name clips at signup |
| `app/modules/transcription/providers/deepgram_tts.py` | Deepgram Aura-2 TTS client |
| `app/modules/tours/{models,routes,service,repository}.py` | Tour completion persistence |
| `scripts/generate_voice_clips.py` | Offline clip generator (Deepgram → local/S3) |
| `scripts/generate_mascot_animations.py` | Programmatic Lottie generator (~2200 lines, all 75 clips) |
| `scripts/validate_mascot_animations.py` | Rig-contract validator (seams, rest poses, eye formula) |
| `scripts/build_dotlottie.py` | Packages clips into `companion.lottie` |
| `docs/mascot-animation-playbook.md` | The rig contract + animation authoring grammar |

### Feature flags (all default-ON kill switches, `VITE_FEATURE_*=false` disables)
- `aiMascot` — the mascot itself (off → nothing renders)
- `mascotMachine` — the state machine + dotLottie player (off → legacy 5-clip ternary)
- `voiceNarration` — all audio + spoken lines
- `productTour` — NUX tours
- `startGate` — tours/timing cues hold behind the "Start phase" gate

---

## 2. The animation rig

### One bundle, one player, ~75 clips
All clips are **procedurally generated Lottie JSON** (no After Effects) by
`scripts/generate_mascot_animations.py`, validated by `validate_mascot_animations.py`,
and zipped into a single **dotLottie bundle** (`companion.lottie`) by `build_dotlottie.py`.
The app plays them with one persistent `@lottiefiles/dotlottie-react` (WASM) instance;
state changes call `dotLottie.loadAnimation(id)` **in-memory** — no per-clip fetches, no
player remounts. A 260ms opacity blink (`element.animate`) masks mid-clip swaps.

### The rig contract (why no transition table is needed)
Every clip is the *same 12 layers, shapes, colors, and 512×512 canvas* as `idle.json` —
only keyframes differ — so any two states can cross-fade without a pop:
- **Loops** are seamless (first frame == last frame on every track).
- **One-shots** start *and* end on the neutral rest pose.
- Held-pose loops (angry, coding, phone) sit in a non-rest pose; the 0.4s cross-fade absorbs the jump.
- Only exceptions: entrances (`hello`, `enter`) start hidden; `exit` ends hidden.

Character anatomy: a white rounded-square body with **one living eye** (gaze + pupil dilation
+ catchlight that leans into the gaze), an eyelid (blink/squint), four blue "starburst" arms
(rotated rects that double as icon strokes — they can spell "HI", draw a checkmark, clock
hands…), a ground shadow that reacts to jump height, and five permanently-hidden accent
layers (StatusDot, PulseRing, Star1/Star2, Prop) used as story props (tears, confetti,
sonar rings, a held phone). The full authoring grammar — eye saccade/fixation timing, squash
& stretch recipes, prop placement zones, pitfalls — is `docs/mascot-animation-playbook.md`.
**Port that document with the rig; it is the design system.**

### The clip registry (`CLIPS` in mascotMachine.ts)
~75 named clips, each typed `loop | oneshot | entrance | exit`:
- **Originals**: idle, speaking (+ speaking-2/3/4 gesture variants), thinking, correct, wrong
- **Emotions**: excited, sad, angry, surprised, confused, proud, shy, sleepy, love, celebrate, laughing, crying, nervous, smug, scared, bored, mind-blown, bow, alert, sleeping, stargaze, hiccup, sneeze
- **Icons/gestures**: icon-clock/check/cross/arrow/loading/star/plus/heart, gesture-wave, gesture-point
- **Activities**: hello, enter, exit, writing, phone, coding, searching, juggling, presenting, workout
- **Motion/dance**: fly, swim, run, ball, zoom, spring, gravity-flip, dance, disco, clap, conduct, nod-yes, shake-no, bounce, spin, wobble, stretch, peek, float, dizzy, jump
- **Loading/system**: loading-dots, loading-orbit, loading-pulse, loading-bar, impatient, processing
- **Interactivity**: attentive (hover), boop (press)

### dotLottie integration gotchas (hard-won, verified against dotlottie-web 0.76)
1. **Manifest must be v1** (`"version":"1.0"`, `activeAnimationId`, full animation entries).
   A v2 manifest loads but **never fires `load`** — silently.
2. The player always opens `animations[0]` regardless of `activeAnimationId`, so the build
   script puts `idle` first; `MascotPlayer` also corrects on `load` if the active id differs.
3. **Serve the WASM yourself**: `import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url'`
   + `DotLottie.setWasmUrl(wasmUrl)` (note: export path has no `dist/`). Never the default
   CDN — breaks offline and inside embed-iframe CSP. ~684KB gzipped, lazily fetched.
4. Every clip swap goes: set `desired` ref → `apply()` → if `activeAnimationId !== want`,
   `loadAnimation(id)` (which re-fires `load` → `apply` re-runs) → `setLoop(!once)` → `play()`.
5. `complete` events only matter for once-through clips (loops never emit it); it reports
   `REACTION_DONE` back to the machine.

---

## 3. The state machine (mascotMachine.ts)

A **pure, deterministic reducer** — no timers or randomness inside (a seeded LCG picks
variety), so it's unit-testable and replayable. `resolveClip(state)` resolves **five
priority layers**; higher layers mask lower ones, and because every clip is rest-compatible
at its seams, a layer can drop away and reveal the one below with no transition table:

```
1. reaction   one-shot beats (test passed, boop, hello) — play once, then pop
2. speaking   narration audible: neutral → one of 4 speaking gesture variants
              (seeded draw per line, never repeats back-to-back);
              happy/sad narration → correct/wrong one-shot, then holds rest = "listening"
3. working    thinking (AI chat generating) → 'thinking'
              feedbackBusy (AI grading a step answer) → cycles thinking/searching/
                processing/writing every 3s (clock-derived, still pure)
              execRunning (Judge0 run in flight) → 'loading-dots'
4. hover      pointer over the mascot → 'attentive' (also wakes the idle ladder)
5. idle ladder  ≥90s inactive → 'bored'; ≥240s → 'sleeping'
   ambient    'idle', seasoned by a seeded scheduler that occasionally (18–40s gaps)
              plays a 7s "flavor" loop: float / stargaze / peek / wobble / juggling
```

### Events
`THINKING(on)` · `FEEDBACK_BUSY(on)` · `NARRATION_START(emotion)` · `NARRATION_END` ·
`MOMENT(moment)` · `EXEC_RUNNING(on)` · `REACT(clip)` (curated beat, validated against a
`ONCE_THROUGH` whitelist — only clips whose single cycle starts AND ends at rest) ·
`FLAVOR(clip, seconds)` · `HOVER(on, now)` · `PRESS` (→ boop reaction) · `REACTION_DONE` ·
`USER_ACTIVE(now)` · `TICK(now)` (3s clock: expires flavors, schedules ambient variety,
ages the idle ladder; while busy it pushes the flavor schedule out so a flavor never fires
the instant the mascot frees up).

### Narration moment → reaction beat (`MOMENT_REACTIONS`)
When `voiceStore.play(moment)` fires, the mascot plays a matching reaction **first**
(a second or two), then the speaking layer shows through for the rest of the line.
**Reactions fire even when audio is muted — the visual beat is feedback in its own right.**

| moment | reaction clip |
|---|---|
| test_pass | icon-check |
| test_fail | wrong |
| step_complete | nod-yes |
| step_complete_next / phase_advance | gesture-point |
| phase_complete | celebrate |
| session_complete | bow |
| phase_skip_warning / system_error / execution_error / time_low | alert |
| idle_nudge | gesture-wave |
| welcome / welcome_back | hello |
| time_up | nod-yes |

### Signal wiring (useMascotMachine.ts — the only impure part)
Mounted once by AIMascot. Subscribes:
- **voiceStore** → `NARRATION_START/END` on `isPlaying` edges, carrying `currentEmotion`
- **chatStore.isLoading** → `THINKING`
- **executionStore.isRunning** → `EXEC_RUNNING`
- **stepStore.feedbackLoadingStepId** → `FEEDBACK_BUSY`
- window `mousemove/mousedown/keydown/scroll/touchstart` → throttled (5s) `USER_ACTIVE`
- a 3s `setInterval` → `TICK`

The store (`mascotStore.ts`) only re-publishes `resolved` when the clip actually changes,
so machine-state churn doesn't re-render the player.

---

## 4. The AIMascot component

Fixed bottom-left (`bottom: 24, left: 24`), `z-[210]` — deliberately above modals
(`z-[100]`), the ambient glow (`z-[110]`), **and the tour spotlight's darkening scrim
(`z-[200]`)** so it never gets dimmed with the page. Column layout, bottom-anchored, so the
speech bubble grows *upward* without shifting the mascot.

- **Entrance**: springs into view on mount (`initial {opacity:0, scale:0.6}` → spring).
- **First-session greeting**: on first mount per session (`localStorage mascot_greeted:{sessionId}`),
  fires `REACT hello` — the rig spells "HI" with its arms. Once per session, not per phase remount.
- **Audio-reactive pulse**: button `scale = isPlaying ? 1.04 + amplitude * 0.11 : 1` through
  an over-damped spring (stiffness 180, damping 30) — breathes ~1.04–1.15 with the voice,
  glides instead of bouncing (raw jitter read as "jumping").
- **Hover**: grows 83 → 95px + sends `HOVER` (→ attentive clip). **Press**: sends `PRESS`
  (→ boop). **Click** (outside a tour): opens the AI assistant panel.
- **Speech bubble**: max-w 240px, tail pointing at the mascot. `voiceStore` chunks the line
  into ≤34-char caption lines and reveals **word-by-word in step with real playback
  position**; the bubble crossfades (150ms) only between lines, grows in place within one.
- **Travel** — the same springed x/y motion values carry the container:
  - **Tour travel**: during a tour it becomes the narrator: moves next to the highlighted
    element (position from `tourStore.anchorRect`, measured by ProductTour — one source of
    truth), shows the step body in its bubble, and grows a `1/5 · Back · Next · ✕ Skip-all`
    control row under itself. Returns home when the tour ends — same reactive style
    computation, no special-case animation. Key trick: translate via springed motion values
    on a bottom-anchored container; never swap `bottom` ↔ `top` (can't interpolate → jump).
  - **Focus travel**: `mascotStore.setFocusRect(rect)` sends it to sit beside any element —
    used by ComprehensionStep to have it "think" next to the Get-Feedback button while AI
    feedback is prepared, then `setFocusRect(null)` sends it home. Tour travel wins.
- **Tour bubble typewriter**: during a tour the step body fills in word-by-word from
  `narrationProgress`; once spoken, the full text stays on screen to read (tracked per step
  so it doesn't snap back to a mid-sentence caption). Muted/narration-off shows full text
  immediately; a not-yet-started step holds the bubble a beat to avoid flash-then-reset.

**Legacy fallback** (mascotMachine flag off): dynamic-imported `LegacyMascotPlayer` —
AnimatePresence cross-fade (0.4s) between five separate `lottie-react` JSON players
(idle/speaking/correct/wrong/thinking), chosen by a simple ternary
(thinking > speaking-with-emotion > idle). lottie-react + the 5 JSONs never ship in the
main bundle.

---

## 5. Voice narration — frontend (voiceStore.ts)

### The "moment" abstraction
Everything speakable is a **moment string**. Callers just do
`useVoiceStore.getState().play('test_pass')` — fire-and-forget; **every failure mode
(missing clip, autoplay block, network error) degrades silently** and never blocks UI.

`play(moment)`:
1. **Always** calls `notifyMascotMoment(moment)` first (visual reaction even when muted).
2. Bails if narration flag off or muted.
3. **Busy latch**: if a clip is already fetching/playing, the new moment parks in a
   single-slot `pendingMoment` (latest wins) and plays right after — back-to-back moments
   (test_pass → step_complete) don't cut each other off.
4. Fetches `GET /voice/narration?moment=` as a blob (or consumes a **prefetched** blob —
   see below). The spoken text rides on the **`X-Voice-Text` response header**
   (URL-encoded; decoded with `decodeURIComponent`; falls back to a canned
   `FALLBACK_TEXT[moment]` line).
5. Plays through an `HTMLAudioElement` routed into a shared Web Audio graph:
   `MediaElementSource → AnalyserNode(fftSize 256, smoothing 0.8) → destination`.
   One rAF loop derives:
   - **amplitude**: time-domain **RMS** (not frequency-bin averaging — tracks the speech
     envelope far more reactively), boosted ×3.2, then low-pass smoothed 0.6/0.4 → drives
     the glow + mascot pulse.
   - **narrationProgress** = `audio.currentTime / audio.duration`, read fresh every frame —
     so a mid-line playback-rate change is reflected next frame with nothing to reschedule.
   - **word-by-word captions** from progress × total word count.
6. On `ended`/error → teardown (disconnect graph nodes — they leak otherwise), release the
   latch, play any parked moment.

### Autoplay unlock (critical UX correctness)
Browsers only let an AudioContext leave `suspended` from a real user gesture — and once an
element is routed through a suspended graph, playback "succeeds" **silently**. So:
- `unlockAudio()` (resume + a 1-sample silent buffer blip, for Safari) is called from the
  two guaranteed gestures: the **AudioConsentGate** buttons and the **mute toggle**.
- `play()` still awaits `resume()` defensively; if the context won't run, it skips Web Audio
  entirely and plays the bare element — no glow, but reliably audible.

### Text-only fallback ("the mascot still speaks")
If the clip fetch fails (env without generated clips, or a brand-new moment with no audio
yet): show the `FALLBACK_TEXT` line in the bubble, estimate duration
(`max(2600, words × 380)`ms), and drive a **synthetic amplitude** — two summed slow sines
(`0.42 + 0.26·sin(t/220) + 0.1·sin(t/95)`) low-pass filtered exactly like the real path —
so the mascot and glow keep breathing. Same latch/pending semantics.

### Prefetch
`prefetch(moment)` warms a clip (bounded Map, max 4, FIFO evict) so `play()` starts with
zero network wait. One-shot — consumed on play so the random variant still rotates. Fired at
natural lead points: while the Start-phase gate is up (the big phase-intro clip), and when a
test run kicks off (`test_pass` + `test_fail` both, before results exist).

### User controls (TopBar)
Mute toggle (persisted `localStorage voice_muted`; muting invalidates in-flight tokens,
clears pending + prefetched) and playback rate 1/1.25/1.5/2 (persisted; applied live to the
current element).

### Every moment and where it fires
| moment | trigger (file) |
|---|---|
| welcome / welcome_back | first session entry per tab (`sessionStorage welcomed:{id}`); "back" if ≥1 phase completed (CodingSessionPage) |
| phase_intro:{slug}:{phase_type} | phase start, after Start-gate click; prefetched while gated; once per phase type per session via sessionStorage (StepPanel) |
| nux_{phase_type} | fallback intro when the problem has no per-problem intro (StepPanel) |
| test_pass / test_fail | test run completes (CodingStep) |
| exec_timeout / execution_error | run infra failures (CodingStep) |
| step_complete / step_complete_next | completing a step — "next" variant when more steps remain (CodingStep, ComprehensionStep) |
| phase_complete | PhaseTransitionOverlay mount (not on last phase) |
| phase_advance / session_complete | after phase-advance reload, via a sessionStorage flag set before reload (CodingSessionPage) |
| phase_skip_warning | skip-phase confirm dialog (CodingSessionPage) |
| idle_nudge | 60s inactivity, re-arms at 180s (useInactivityNudge) |
| time_low / time_up | ≤60s left / 0s, once per phase, mirrors server-authoritative timer math (usePhaseTimeCues) |
| system_error | our-side API failures, played as the Help panel auto-opens (CodingStep, StepPanel, CodingSessionPage) |
| tour:{tour_key}:{step_index} | each tour step activation (ProductTour) |

---

## 6. Voice narration — backend

### API
`GET /api/v1/voice/narration?moment=` (JWT-authed) → raw audio bytes
(`audio/mpeg` for generic clips, `audio/wav` for spliced/phase-intro), headers:
- `Cache-Control: no-store` (variants must rotate)
- `X-Voice-Text: <urlencoded phrase>` + `Access-Control-Expose-Headers` (so cross-origin
  embed iframe JS may read it). Header values must be latin-1 safe — hence the URL-encoding.

`GET /api/v1/voice/diagnostics` → is the manifest present, does THIS user have name clips,
is splicing live — the "why is it silent/generic" debug endpoint.

### No DB — S3 is the database
The manifest lives entirely in S3, so the whole feature is removable behind its flag.
**S3 key layout** (dedicated audio bucket, optional `audio_s3_prefix` for shared buckets):
```
voice-clips/manifest.json                              {moment: [clip keys...]}
voice-clips/{moment}/{NN}.mp3                          generic variants (NN = 1-based index into PHRASES[moment])
voice-clips/{moment}/name_segments/{NN}_prefix.wav     name-splice pairs (WAV/linear16)
voice-clips/{moment}/name_segments/{NN}_suffix.wav
voice-clips/nux_segments_manifest.json                 {moment: [{prefix, suffix}...]}
voice-clips/phase_intro/{slug}/{phase_type}.wav        per-problem phase intros (WAV, so a greeting can be spliced on)
voice-clips/phase_intro_greeting/{NN}_{prefix,suffix}.wav
voice-clips/phase_intro_greeting_segments.json         [{prefix, suffix}...]
voice-clips/tour/{tour_key}/{step_index}.mp3           tour narration
voice-clips/names/{user_id}/{i}.wav                    the learner's name, rendered 2×
voice-clips/names/{user_id}/manifest.json              {"keys": [...]}
```
The clip-key ↔ text contract: `voice-clips/{moment}/{NN}.mp3` maps back to
`PHRASES[moment][NN-1]`, so the caption always matches the rendered audio.

### Service resolution order (per request)
1. `nux_*` or ALWAYS_PERSONALIZED (`welcome`, `welcome_back`, `session_complete`):
   try the **name splice** (cached per user+moment, 15min TTL).
2. OCCASIONALLY_PERSONALIZED (`step_complete_next`, 40% chance): splice fresh (uncached —
   the point is name-sometimes variety; building blocks are byte-cached anyway).
3. `phase_intro:*`: splice `"Hi " + <name> + ". " + <intro clip>` from a generic greeting pool.
4. Otherwise: `random.choice(manifest[moment])` → download → serve.
5. Any miss → 404 → the client's text-only fallback. Logged (`voice.clip_not_found`) so a
   missing clip in prod is greppable.

**In-process caches** (plain dicts/OrderedDicts, TTL + LRU-bounded): manifests 300s;
immutable clip bytes 3600s/256 entries; spliced results 900s/512. These removed the repeated
S3 round-trips that made narration start late.

### Name personalization (zero live TTS at playback) — the splicing deep-dive

**The problem it solves:** "Hi Kishan. In this phase, a test is failing…" makes narration
feel personal, but you can't pre-render every learner's name into every sentence, and live
TTS at request time is slow, expensive, and adds a hard dependency to a hot path. The
answer: pre-render the *name* once per user, pre-render every sentence as *segments around
a name-shaped hole*, and join raw audio at playback.

**Step 1 — name clips at signup** (`voice/tasks.py`, enqueued fire-and-forget from the
register endpoint): an ARQ task renders the learner's **first name** via Deepgram as
WAV/linear16, **twice** (`NAME_CLIP_COUNT = 2`). Deepgram TTS is non-deterministic —
repeated calls with the same text produce genuinely different renderings (verified by byte
hashes), so multiple clips add real prosodic variety rather than being wasted duplicate
calls. Uploaded as `voice-clips/names/{user_id}/{i}.wav` + a per-user manifest. Best-effort:
a failure just means that learner gets generic narration.

**Step 2 — segment authoring for natural seams** (`generate_voice_clips.py`
NUX_NAME_SEGMENTS). Each personalized moment has several `(prefix, suffix)` text pairs,
e.g. `("Hi ", " In this phase, a test is failing. Please find the bug and fix it.")`.
The seam quality is engineered in the *text*, not with DSP:
- Each half is a **clean, independently-sensible fragment** — the suffix never starts with
  stray punctuation — so each sounds natural when synthesized on its own (the TTS gives it
  a complete, non-clipped intonation contour).
- Prefixes carry a trailing space and suffixes a leading space, which nudges the TTS to
  leave a natural micro-pause at each edge — that pause *is* the splice point, so the name
  drops into a gap that already sounds like a breath.
- Some pairs have an **empty prefix** (`("", " please trace the code…")`) so the line
  *opens* with the name — variety in where the name lands.
- An empty prefix is synthesized as `" "` (a single space) — Deepgram rejects/degenerates
  on empty text, so a near-silent stub keeps the 3-part splice shape uniform.
- For phase intros (56 different sentences), per-moment pairs don't scale, so a small
  generic greeting pool is used instead: `("Hi ", ". ")` etc. — the suffix is just a
  **sentence break**, whose full stop + pause absorbs any capitalization/flow awkwardness
  before the intro clip starts. The splice becomes 4 parts:
  `"Hi" + <name> + ". " + <phase-intro clip>`.

**Step 3 — why WAV/linear16 everywhere on this path.** Concatenating compressed audio
(mp3) at arbitrary boundaries produces clicks/artifacts — frames don't align and each file
carries encoder padding. So every splice ingredient (name clips, prefix/suffix segments,
phase-intro clips) is rendered with Deepgram `encoding=linear16`, which returns a **full
RIFF WAV per request** (header included, not headerless PCM). Standalone clips that are
never spliced stay mp3 (smaller).

**Step 4 — the splice itself** (`audio_utils.splice_wav`, stdlib `wave` only, no ffmpeg):
1. Unwrap each WAV to raw PCM frames + its params (sample rate, channels, sample width).
2. Assert all segments share identical params — writing mismatched frames under one header
   wouldn't fail, it would *silently* play garbled/mis-pitched, so it raises instead
   (same voice + encoding in generation guarantees a match in practice).
3. Concatenate the PCM frames and wrap them in a single new WAV header.
Because it's uncompressed PCM cut at segment boundaries that already end in silence-ish
pauses, the joins are click-free with zero signal processing.

**Step 5 — serving policy** (`voice/service.py`): which moments get a name, and how often:
- `ALWAYS_PERSONALIZED` = welcome, welcome_back, session_complete — a greeting/closing
  carries a name naturally every time. Plus all `nux_*` phase-first-entry moments.
- `OCCASIONALLY_PERSONALIZED` = step_complete_next at **40% chance** — a name on every
  step nudge would grate; "now and then" keeps it warm. Deliberately *uncached* so the
  coin flips fresh per play (the ingredient clips are byte-cached, so re-splicing is cheap).
- Random name clip × random segment pair per assembly, so even the personalized line
  varies. Always-personalized results are cached per (user, moment) for 15min so repeat
  plays skip re-download + re-splice, while the TTL still lets variants rotate.
- **Every step falls back** to the generic name-free clip: no name clips yet (generation
  pending, or account predates the feature), missing segments manifest, download failure,
  malformed WAV (splice raises → caught) — all logged, never a 500.
- The `X-Voice-Text` caption shows the generic name-free line — the exact spliced text
  can't be reconstructed server-side; accepted trade-off.
- Spliced responses are served as `audio/wav` (bigger than mp3, but only for these moments).

### Clip generation (offline, `scripts/generate_voice_clips.py`)
- TTS: **Deepgram Aura-2** (`aura-2-thalia-en`), plain httpx POST to `/v1/speak`;
  `encoding=mp3` for standalone clips, `linear16` (WAV) for anything spliced.
- Writes to a **local dir by default** so you can *listen to everything* before `--s3`
  uploads for real — same key structure either way.
- `--dry-run` previews counts; `--only phrases|intros|segments|tours` re-renders one
  category and **merges** into the existing manifest (partial re-render doesn't drop
  other moments' entries).
- Rotation is a backend concern (random variant per play), so the script just needs enough
  natural variants that repeats aren't noticeable (~8 per feedback moment, 3–6 elsewhere).

### The writing style (the actual delight ingredient)
Enforced tone rules for every line: *calm professional interviewer — not a cheerleader, not
harsh*; super simple conversational English, short sentences, no idioms or fancy words
(non-native-speaker friendly); 5–7 seconds. Phase intros: ~30–45 words, and **interviewer
not teacher** — frame the task, never leak the answer (for bug-fix: point at the area, never
name the defect; for optimization: describe the slow symptom, never name the target
algorithm — that's what's being assessed).

### Storage backend split
`voice/storage_backend.py` deliberately does **not** reuse the app's main S3 layer: voice
clips live in their own bucket on their own credentials (`audio_s3_*` settings), so a
misconfiguration can never touch execution-snapshot data. A single
`settings.voice_clips_local_dir` toggle switches every read/write to local disk (dev without
creds) with identical calling code. Config: `deepgram_api_key`, `audio_s3_access_key_id`,
`audio_s3_secret_access_key`, `audio_s3_bucket`, `audio_s3_region`, `audio_s3_prefix`,
`voice_clips_local_dir`.

---

## 7. NUX tours (progressive disclosure, mascot-narrated)

### Philosophy
Not one long linear walkthrough. Each tour is a **tiny 1–2 step hint** surfaced only when
its screen/state is actually relevant, shown **one at a time** — extra hints queue and
surface as the active one finishes.

### The seven tours (`config/tours.ts` — key, target `[data-tour]`, trigger)
| key | steps → targets | when disclosed |
|---|---|---|
| intro | phase-tabs, phase-timer | first session entry (orientation: your path + your clock) |
| comprehension | answer-textarea, feedback-actions | landing on a comprehension step |
| coding_run | run-tests | landing on a coding step |
| coding_results | test-results | first test results actually appear |
| finish_step | complete-step | the Complete button unlocks (delayed 900ms on comprehension so the feedback panel renders and the mascot returns home first) |
| ask_for_help | companion-button | first idle stall (from useInactivityNudge) |
| report_bug | report-bug | queued last on session entry |

Three things must stay in sync by hand: `ALL_TOURS` keys (frontend), `KNOWN_TOUR_KEYS`
(backend validation), and `TOUR_NARRATION` (spoken text, duplicating each step's `body`
verbatim so it can be rendered to audio).

### tourStore mechanics
- `hydrate()` — `GET /api/v1/tours` → `completedTours` set.
- `disclose(key)` — "this hint is relevant now": no-op if seen/active/queued/flag-off;
  queues if something's active; else activates at step 0. All triggers compose through this.
- `complete()` — marks seen locally + best-effort `POST /tours/{key}/complete` (failure =
  harmless re-show later), then **pumps** the queue.
- `cancel()` — anchor never resolved (target not shipped/mounted): bail **without** marking
  complete so it can still show when the anchor exists; pump the queue.
- `dismissAll()` — the ✕ on the mascot's tour controls: one click marks *every* tour
  complete locally + on the server. Nothing auto-appears again, ever.
- `startForced(key)` — the TopBar "Replay tour" dropdown, ignores completion.

Backend: `user_tour_progress` table (user_id + tour_key unique, idempotent completes,
validates against KNOWN_TOUR_KEYS so junk keys can't accumulate rows).

### How a tour renders (two cooperating components)
**ProductTour.tsx** owns lifecycle + the spotlight:
- Resolves `[data-tour="<target>"]`, retrying every 100ms up to 20× (panels mount async);
  never-resolves → `cancel()`. Scrolls the target into view, measures after 300ms.
- Publishes the measured rect to `tourStore.anchorRect` — **one measurement shared** with
  the mascot instead of both querying the DOM.
- Spotlight = one portal div at `z-[200]`: a 2px primary-color border around the target +
  `box-shadow: 0 0 0 9999px rgba(0,0,0,0.8)` painting the dimmed scrim over everything else.
- Re-measures on scroll/resize; Escape skips; **narrates each step** by playing
  `tour:{key}:{index}` (a ref guards React StrictMode's double-effect from double-playing —
  the duplicate used to park in pendingMoment and replay, restarting the typewriter).

**AIMascot** is the narrator UI: travels to the anchor, speaks the step, types the body
word-by-word in sync with audio, and carries the step counter + Back/Next/Skip-all controls
(section 4). The corner glow suppresses itself during tours since the mascot has left home.

---

## 8. Delight inventory (the little things that make it feel alive)

1. **The reaction-then-speak choreography** — a moment plays a physical beat first
   (checkmark, celebrate, bow), then the talking face takes over mid-narration.
2. **Visual beats even when muted** — mascot reactions are decoupled from audio.
3. **Four speaking gesture variants**, seeded-drawn per line, never the same twice in a row.
4. **The idle ladder** — 90s → bored, 240s → asleep; any activity (or hovering the mascot)
   wakes it.
5. **Ambient flavors** — every 18–40s of true idleness, a 7s gentle loop (float, stargaze,
   peek, wobble, juggling) so it never feels frozen; suppressed while anything else is on,
   and the schedule pushes out while busy so a flavor never fires the instant it frees up.
6. **Hover = attentive, press = boop** — both are *authored clips*, so interaction feel
   lives in keyframes, not easing hacks.
7. **"HI" greeting** — arms literally spell HI, once per session.
8. **Focus travel** — walks over to sit beside the Get-Feedback button while the AI grades,
   then walks home.
9. **The working cycle** — while feedback is prepared it cycles thinking → searching →
   processing → writing every 3s instead of holding one loop.
10. **Audio-reactive everything** — the mascot's scale and the corner glow
    (`radial-gradient` from bottom-left, radius 300→560px, opacity 0.4→0.95) both breathe
    with true RMS loudness; the glow reads as light *coming from the mascot*.
11. **Word-by-word captions** locked to actual playback position (rate-change-proof).
12. **MascotLoader** — every spinner becomes the mascot cycling its six loading clips every
    4s; falls back to a plain spinner when the flag is off.
13. **Name personalization** — "Hi Kishan. In this phase…" with zero live TTS, always
    occasionally (40%) on step nudges so it never grates.
14. **Inactivity nudge escalation** — first stall points at the Companion (tour spotlight);
    after that's seen, a recurring gentle spoken "need a hand?" (60s arm, 180s re-arm),
    never interrupting narration or an active tour.
15. **Time cues** — a calm "about a minute left", then a reassuring "time's up — you can
    still finish"; behind the Start gate they stay silent, matching the visible timer.
16. **Tone discipline** — every line an interviewer would say; failure lines never blame.
17. **Silent-no-op posture everywhere** — narration/tours can never block or break a flow.

---

## 9. Porting checklist

1. **Rig + bundle**: port the generator/validator/build scripts and the playbook, or reuse
   `companion.lottie` as-is. Keep the rig contract (rest-compatible seams) — it's what makes
   the layered machine work without a transition table.
2. **Machine**: `mascotMachine.ts` is dependency-free pure TS — port verbatim; adapt only
   `MOMENT_REACTIONS` to your product's moments. Simulate event sequences in Node to verify.
3. **Wiring**: re-point `useMascotMachine`'s five subscriptions at your app's equivalents
   (narration playing, AI busy, long tasks running, user activity).
4. **Voice**: port voiceStore (it only needs an endpoint returning audio + `X-Voice-Text`);
   define your PHRASES; run the generator against your Deepgram key; keep the
   local-dir-first → `--s3` review workflow.
5. **Personalization**: signup-time name-clip task + WAV/linear16 for anything spliced.
6. **Tours**: tours.ts + tourStore + ProductTour port cleanly; you need `[data-tour]`
   attributes on your targets, a completed-tours GET/POST, and TOUR_NARRATION kept verbatim
   with step bodies.
7. **Gates**: an explicit audio-consent click (or any guaranteed gesture) must call
   `unlockAudio()` before narration can be heard after a reload.
8. **Flags**: keep each subsystem behind its own kill switch (mascot, machine, narration,
   tours) — they're independently disableable and the fallbacks are already written.
9. **Dev harness**: port `mascotHarness.tsx` — a dev-only page rendering the real mascot
   tree with buttons simulating every signal, no backend needed. It's how you iterate on
   clips and transitions.
10. **Mind the gotchas**: dotLottie v1 manifest + idle-first + local WASM; suspended
    AudioContext silently swallowing routed audio; StrictMode double-effects double-playing
    narration; Web Audio node leaks without disconnect; latin-1-only response headers;
    `bottom`↔`top` CSS being non-interpolable (translate a bottom-anchored container
    instead); mismatched WAV params splicing into garbled audio.
