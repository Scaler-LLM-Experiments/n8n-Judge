# Mascot Lottie Animations

Hand-authored Lottie animations for the AI "interviewer" mascot. All states share one
identical rig, so a player can cross-fade between them without any pop. Emotion is
expressed **through the existing rig** — the four blue arms and a fully-alive single
eye (white box + black pupil + white catch-light highlight). No layers or shapes are
ever added. The `PulseRing` and `StatusDot` layers stay hidden (opacity 0) in almost
every file; accent states fade props in as story beats — big, near-solid, yellow #FFE100 by
default (tears/sweat tinted blue per state), from a tear to orbiting dizzy-stars to a
held black phone — starting AND ending invisible so seams and cross-fades stay clean
(held props like the phone may stay visible for a whole loop).

Three original states (`correct`, `wrong`, `thinking`) remain hand-edited;
`idle`, `speaking`, and all expression states are authored by
`scripts/generate_mascot_animations.py` (edit the script, rerun, then run
`scripts/validate_mascot_animations.py` — never hand-edit the generated JSONs).
**Read `docs/mascot-animation-playbook.md` before authoring new states** — it captures
the rig's geometry, the living-eye grammar, seam rules, and every pitfall we hit.

## Shared rig facts

- **Format:** Lottie `v:5.7.4`, `fr:60` (60 fps), `w:512` × `h:512`.
- **12 layers** — identical `ind`, `parent`, shapes, and colors in every file; only keyframes differ:

  | ind | layer     | type        | parent | role |
  |-----|-----------|-------------|--------|------|
  | 1   | StatusDot | shape       | 10     | small blue dot — **hidden (opacity 0) in all files** |
  | 2   | Eyelid    | shape       | 10     | white 112×112 rect, blinks via scaleY (top-anchored) |
  | 3   | Eye       | shape group | 10     | black **Pupil** (64) + white **Highlight** (16, offset [13,-7]) |
  | 4   | Body      | shape       | 10     | white 108×108 rounded rect (r:40) — the **eye box / face** |
  | 5   | PulseRing | shape       | 10     | 150×150 rounded-rect stroke — **hidden (opacity 0) in all files; never used** |
  | 6   | Arm0      | shape       | 11     | blue 84×330 rect, rot 0° |
  | 7   | Arm90     | shape       | 11     | blue 84×330 rect, rot 90° |
  | 8   | Arm45     | shape       | 11     | blue 84×330 rect, rot 45° |
  | 9   | Arm-45    | shape       | 11     | blue 84×330 rect, rot -45° |
  | 10  | Face      | null        | 11     | face-group transform (squash/stretch) |
  | 11  | Root      | null        | —      | master transform (bob / head tilt) |
  | 12  | Shadow    | shape       | —      | faint ellipse, opacity 18 (does not tilt with Root) |
  | 13  | Star1     | shape       | —      | big yellow 5-point star — hidden prop (sparkles, orbits) |
  | 14  | Star2     | shape       | —      | second yellow star — hidden prop |
  | 15  | Prop      | shape       | 11     | black rounded slab — hidden prop (held objects, e.g. the phone) |

  Arms 6–9 form a starburst behind the white body; their tips poke out and are the mascot's
  "hands". The eye (Pupil+Highlight, ind 3) renders on top of the white Body box (ind 4).

### The eye rig (how "full eye movement" works)
Gaze is driven by the **whole Eye layer position** `p` (ind 3) so the pupil and the white
highlight travel together as one eyeball — the catch-light is never pinned in one corner of
the screen. The gaze uses real amplitude with fixations: a quick 3–4 frame eased saccade to a
direction, a 20–40 frame hold, then a saccade to the next. Effective pupil-center offset is
kept ≤ 18px from body-center (hard clip limit 20px) so the 64px pupil always stays inside the
108px white box.
- **Eyeball / gaze** = `Eye` layer `p` (ind 4's box may also lean via `Body.p` in thinking).
- **Pupil** `tr.p` and **Highlight** `tr.p` are held **static** (`[0,0]` and `[13,-7]`) so they
  ride the eyeball rather than drifting independently.
- **Secondary life:** Pupil `tr.s` dilates/constricts on emphasis; Highlight `tr.s` can flare
  (a "sparkle", e.g. correct). Box `Body.s` squash/stretch on emphasis.

Only the Eye layer `p` and the Pupil/Highlight groups' `tr.p` / `tr.s` are animated for the eye;
their `tr.a` `[0,0]`, `tr.r` `0`, `tr.o` `100` are untouched. No shapes, colors, sizes, layers,
or parenting change anywhere — **only keyframes**.

## States

| State           | frames (op) | length | playback  | arms | eye |
|-----------------|-------------|--------|-----------|------|-----|
| `idle.json`     | 180         | 3.0 s  | **loop**  | gentle staggered scaleY breathing | gaze: center → right → up-left → down → center (unhurried, ~30f holds), 2 soft blinks, faint box breath |
| `correct.json`  | 60          | 1.0 s  | one-shot  | celebratory raise (scaleY→108, diagonals splay out) | gaze up + eyes widen bright (pupil→112, highlight sparkle→120), quick happy blink, settle to center |
| `wrong.json`    | 60          | 1.0 s  | one-shot  | droop/slump (scaleY→88) then ease back | gaze down (dejected), pupil constricts, lids half-lower; recovers to center |
| `thinking.json` | 120         | 2.0 s  | **loop**  | three arms fold in (scaleY→96); one arm (Arm0) taps | gaze up-left (long hold) → up-right (long hold) → center; slow blink, head tilt |

- **Looping files** (idle, speaking, thinking): every animated track's value at `t:0` equals
  its value at `t:op`, so loops are seamless.
- **One-shot files** (correct, wrong): every animated track ends exactly on the neutral rest
  pose at `t:op`, for a clean hand-off back to idle. (wrong slumps, then eases back to neutral.)

## Expression states (generated)

Loops are seam-perfect (t0 == t_op per track, rotations mod 360); one-shots start AND end
on the neutral rest pose. Accent states are marked †(StatusDot) / ‡(PulseRing).

| State | frames | playback | motion |
|---|---|---|---|
| `speaking` | 540 | loop | 9s "explainer": three measured phrases of arm beat-gestures with breaths between; eye calmly on the listener |
| `speaking-2` | 540 | loop | 9s "enumerator": counts points off with brisk alternating raises, a vertical-arm nod, one wide summary spread |
| `speaking-3` | 540 | loop | 9s "storyteller": flowing sweeps and a continuous gentle sway; dreamy dilated eye |
| `speaking-4` | 540 | loop | 9s "emphatic": both diagonals rise together on the strong points, deeper lean, harder bob |
| `excited` | 96 | loop | two quick hops (second bigger), arms fling up, wide dilated eye, shadow reacts per hop |
| `sad` † | 132 | one-shot | slow slump, drooping arms, downcast half-lid gaze; a blue tear rolls down the face and fades |
| `angry` | 84 | loop | held compression + 3-frame vibrate, stiff low arms, heavy-lid glare with constricted pupil |
| `surprised` ‡ | 72 | one-shot | anticipation dip → stretch-up pop with an expanding shock ring; pupil shrinks, then dilates |
| `confused` | 168 | loop | head tilts left then right, desynced searching saccades, one arm scratches the head |
| `proud` | 132 | loop | chest-out stretch, chin-up tilt, arms planted akimbo, slow bob, sparkling highlight |
| `shy` | 156 | loop | shrunk to 93%, gentle sway, gaze hiding down-left with one brave glance at the viewer |
| `sleepy` † | 264 | loop | heavy breathing, drooping lids, slow nod-off with a rising dream bubble, snap-awake jerk |
| `love` ‡ | 112 | loop | ba-bump double heartbeat squash with a soft pulse ring, dilated dreamy eye, hugging arms |
| `celebrate` ‡ | 120 | loop | big joyful jump, arms thrown wide, happy-squint airtime, ring burst on the squash landing |
| `icon-clock` ‡ | 192 | loop | diagonals fold away; thin minute hand sweeps 360° over a bezel ring; eye sleeps, wakes at seam |
| `icon-check` | 84 | one-shot | two arms swing into a big checkmark (visible vertex), proud pop, eye returns glancing at it |
| `icon-cross` | 66 | one-shot | hard snap into a bold X with impact shake and overshoot, firm hold, composed return |
| `icon-arrow` | 144 | loop | shaft + chevron form a right arrow that nudges "go, go, go"; eye stares along the arrow |
| `icon-loading` | 120 | loop | arm cluster compacts and spins one full mechanical turn; eye stays calm and centered |
| `icon-star` | 144 | loop | arms thin into an eight-point star, rays twinkle alternately, slow sway; highlight sparkles |
| `icon-plus` | 132 | loop | diagonals fold away; bold breathing plus sign, friendly centered eye |
| `icon-heart` ‡ | 108 | one-shot | all four arms curve into a heart silhouette; two warm ring pulses, gentle unfold |
| `gesture-wave` | 120 | loop | one raised arm waves three times, body leans in, eyes on the viewer, beat of rest at seam |
| `gesture-point` | 96 | one-shot | eye darts up-right FIRST, then the arm extends to point with an emphasis nudge; gaze returns last |
| `nod-yes` | 96 | loop | two squash-led nods (first bigger), gaze agreeing, arm follow-through, warm blink after |
| `shake-no` | 108 | loop | three diminishing head shakes; gaze counter-rotates to stay on the viewer; arms drag behind |
| `bounce` | 72 | loop | one metronomic bounce cycle — crouch, stretch, airtime, squash landing; zen face, shadow reacts |
| `spin` | 108 | loop | wind-up the opposite way, full 360 with eyes shut, overshoot stop, dizzy gaze wobble, beat |
| `wobble` | 104 | loop | side-to-side jelly sway; squash flips at the extremes, arms + gaze pendulum with a lag |
| `stretch` | 120 | one-shot | deep squash → tall-and-wide yawn stretch with a muscle tremble at the peak → flop, contented settle |
| `peek` | 168 | loop | face shrinks and ducks behind the arm cluster, wary half-lid peek left/right, pop back up |
| `float` | 192 | loop | weightless uneven hover, staggered arm sway, smooth drifting gaze (no saccades), shadow breathes |
| `dizzy` † | 132 | loop | body orbits a small circle, eye ROLLS a continuous loop, a dot circles overhead like a star |
| `jump` | 104 | one-shot | eye leads up, deep crouch, explosive stretch launch, hang time, heavy squash impact, rebound |

### Wave 2 — activities, entrances, motion, dance, loading, more emotions

| State | frames | playback | motion |
|---|---|---|---|
| `writing` | 168 | loop | head bowed, pen-arm scribbles in bursts, eye writes lines with carriage returns, thinking pause |
| `phone` | 192 | loop | one arm holds a phone slab beside the face; scroll-flick saccades, a chuckle at something funny |
| `coding` | 144 | loop | diagonals become two bracket-bars flanking the face; typing bob, code-scan saccades, build passes |
| `searching` | 156 | loop | leans and scans left, swings right, checks up top — big bright hunting pupil |
| `juggling` † | 144 | loop | a ball arcs in real parabolas over the head; hands pump on toss/catch, the eye tracks the ball |
| `presenting` | 132 | loop | extended arm sweeps over the content; gaze alternates content ↔ viewer |
| `workout` | 132 | loop | curls: left, right, both — effort squash and squint, whew-exhale |
| `sneeze` | 96 | one-shot | tickle build, tip back, AH-CHOO squash burst, recoil, sniffly recovery |
| `hello` | 150 | one-shot | **the arms spell "HI"**, the letters bow, then fold into the starburst as the face blooms in and waves |
| `enter` | 78 | one-shot | spawn: drops in scaling up, big squash landing, looks around (starts hidden) |
| `exit` | 66 | one-shot | quick wave, crouch, leaps up and shrinks away (ends hidden) |
| `fly` | 120 | loop | leaned cruise, trailing fluttering arms, shadow small and far below |
| `swim` † | 144 | loop | breaststroke pull-glide-recover ×2, a bubble rising on the glide |
| `run` | 96 | loop | sprint lean, anti-phase arm pumping, double-step bob |
| `ball` | 112 | loop | arms tuck away, eye closes — a bouncing ball with real fall acceleration, then unfolds |
| `zoom` | 108 | loop | dash right with a horizontal smear, skid stop, glance back, dash home, wobble stop |
| `spring` | 104 | loop | slinky: deep coil, release, anchored diminishing boings |
| `gravity-flip` | 132 | loop | hop + 180° flip, hangs out upside down blinking, flips back |
| `dance` | 128 | loop | two-bar groove: side-steps with alternating arms and a bounce on every beat |
| `disco` | 128 | loop | point up-right to the beat, then swap arms and point up-left; rocking hips |
| `clap` ‡ | 96 | loop | hands-up double clap — diagonal tips converge overhead with a ring ping per impact |
| `conduct` | 144 | loop | a baton arm draws a 3/4 waltz pattern, eye closed in bliss |
| `loading-dots` | 140 | loop | three arms become the classic three pulsing dots below; the eye follows the wave |
| `loading-orbit` † | 144 | loop | a satellite dot orbits the whole mascot; the calm eye tracks the full revolution |
| `loading-pulse` ‡ | 120 | loop | sonar pings; between them the eye sweeps like a scanner |
| `loading-bar` | 138 | loop | a progress bar grows above the head with realistic stalls; annoyed glance, hop at 100% |
| `impatient` | 132 | loop | arm-tap, a full eye-roll, a long deflating sigh |
| `processing` | 140 | loop | the compacted cluster ratchets 45° at a time; the eye ticks like an escapement |
| `laughing` | 108 | loop | three belly-bounce ha-has leaning back, laugh-squint, one residual chuckle |
| `crying` † | 132 | loop | rhythmic sob-hics, heavy lids, quivering drooped arms, a tear each cycle |
| `nervous` † | 126 | loop | trembling, corner-dart glances, a gulp, a sweat drop from the temple |
| `smug` | 120 | loop | half-lid sideways look, slow tilt, one dismissive arm-flick, a gleam across the pupil |
| `scared` | 114 | loop | shrunk and trembling, pin-prick whipping pupil, one flinch-duck |
| `bored` | 168 | loop | slumping by degrees, aimless drift gaze, arm twiddling, two long sighs |
| `mind-blown` ‡ | 108 | one-shot | stare → pupil shrink → ring BLAST with flung arms → woozy dilated reel → shake it off |
| `bow` | 96 | one-shot | dignified bow with lowered lids and swept-back arms, rise, warm look |
| `alert` † | 90 | one-shot | startle hop; an exclamation dot double-blinks above the head; threat scan; stand-down |
| `sleeping` † | 240 | loop | fully asleep: tilted and deflated, huge slow breaths, a Z-bubble per cycle, one dream-twitch |
| `stargaze` † | 216 | loop | leaning back watching stars twinkle at three sky points — pure wonder |
| `hiccup` | 96 | one-shot | three diminishing hic-hops with startled blinks, wary relief |

### Interactivity

| State | frames | playback | motion |
|---|---|---|---|
| `attentive` | 120 | loop | hover response: leans in, arms lifted, big bright pupil locked on the viewer, eager double-blink |
| `boop` | 66 | one-shot | press response: instant poke-squash with eyes squeezed shut, springy rebound, delighted sparkle |

`companion.lottie` bundles every clip for the app's dotLottie player — rebuild it with
`scripts/build_dotlottie.py` whenever clips change (it is a build artifact of the JSONs,
which remain the source of truth).

Entrance/exit exceptions: `hello`/`enter` start hidden, `exit` ends hidden — everything
else obeys the loop-seam / rest-pose rules.

## Colors (normalized RGBA → hex)

| Element | normalized RGBA | hex |
|---------|-----------------|-----|
| Brand blue — arms, status dot | `[0.0627, 0.1216, 0.9569, 1]` | `#1020F4` |
| White — body/box, eyelid, eye highlight | `[1, 1, 1, 1]` | `#FFFFFF` |
| Dark — pupil | `[0.0706, 0.0706, 0.0706, 1]` | `#121212` |
| Navy — pulse-ring stroke (hidden), shadow | `[0.0078, 0.0627, 0.1569, 1]` | `#021028` |

## Easing

Animated keyframes use standard ease-in-out cubic handles (`o:{x:[0.42],y:[0]}`,
`i:{x:[0.58],y:[1]}`); the final keyframe of each track omits the handles and carries only
`t` + `s`, matching the original reference files.
