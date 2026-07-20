// The mascot's state machine — a pure, deterministic reducer that decides which of the
// rig clips plays right now. The clips ship as one dotLottie bundle (companion.lottie,
// played by MascotPlayer via @lottiefiles/dotlottie-react); transition LOGIC stays here
// in testable TypeScript rather than inside the bundle's own state-machine format
// (see docs/mascot-animation-playbook.md §1/§11).
//
// Model: five layers resolved by priority. Higher layers mask lower ones; when a layer
// clears, whatever is beneath shows through — no transition table needed between every
// pair of 75 states, because every clip starts/ends rest-compatible by rig contract.
//
//   reaction   one-shot beats (test passed, phase done) — play once, then pop
//   speaking   narration is audible: talking face, or happy/sad talking
//   working    the app is busy: AI thinking, or code executing
//   deep idle  the human left: bored, then asleep
//   ambient    idle, seasoned with an occasional scheduled "flavor" clip
//
// Everything is a pure function of (state, event) — no timers, no randomness inside
// (a seeded LCG picks flavors) — so behavior is unit-testable and replayable.

export const CLIPS = {
  // originals+
  idle: 'loop', speaking: 'loop', thinking: 'loop', correct: 'oneshot', wrong: 'oneshot',
  'speaking-2': 'loop', 'speaking-3': 'loop', 'speaking-4': 'loop',
  // emotions
  excited: 'loop', sad: 'oneshot', angry: 'loop', surprised: 'oneshot', confused: 'loop',
  proud: 'loop', shy: 'loop', sleepy: 'loop', love: 'loop', celebrate: 'loop',
  laughing: 'loop', crying: 'loop', nervous: 'loop', smug: 'loop', scared: 'loop',
  bored: 'loop', 'mind-blown': 'oneshot', bow: 'oneshot', alert: 'oneshot',
  sleeping: 'loop', stargaze: 'loop', hiccup: 'oneshot', sneeze: 'oneshot',
  // icons & gestures
  'icon-clock': 'loop', 'icon-check': 'oneshot', 'icon-cross': 'oneshot',
  'icon-arrow': 'loop', 'icon-loading': 'loop', 'icon-star': 'loop', 'icon-plus': 'loop',
  'icon-heart': 'oneshot', 'gesture-wave': 'loop', 'gesture-point': 'oneshot',
  // activities & entrances
  hello: 'entrance', enter: 'entrance', exit: 'exit',
  writing: 'loop', phone: 'loop', coding: 'loop', searching: 'loop', juggling: 'loop',
  presenting: 'loop', workout: 'loop',
  // motion & dance
  fly: 'loop', swim: 'loop', run: 'loop', ball: 'loop', zoom: 'loop', spring: 'loop',
  'gravity-flip': 'loop', dance: 'loop', disco: 'loop', clap: 'loop', conduct: 'loop',
  'nod-yes': 'loop', 'shake-no': 'loop', bounce: 'loop', spin: 'loop', wobble: 'loop',
  stretch: 'oneshot', peek: 'loop', float: 'loop', dizzy: 'loop', jump: 'oneshot',
  // loading & system
  'loading-dots': 'loop', 'loading-orbit': 'loop', 'loading-pulse': 'loop',
  'loading-bar': 'loop', impatient: 'loop', processing: 'loop',
  // interactivity
  attentive: 'loop', boop: 'oneshot',
} as const

export type ClipName = keyof typeof CLIPS
export type Emotion = 'speaking' | 'correct' | 'wrong'

// Clips that read as a complete beat when played exactly once (loop={false}): all
// one-shots/entrances plus loops whose single cycle starts AND ends on the rest pose.
// Held-pose loops (angry, coding, phone…) would pop if cut after one cycle — they are
// flavors/activities, not reactions.
const ONCE_THROUGH = new Set<ClipName>([
  'correct', 'wrong', 'sad', 'surprised', 'icon-check', 'icon-cross', 'icon-heart',
  'gesture-point', 'stretch', 'jump', 'sneeze', 'mind-blown', 'bow', 'alert', 'hiccup',
  'hello', 'enter',
  'celebrate', 'nod-yes', 'shake-no', 'gesture-wave', 'spin', 'ball', 'zoom', 'bounce',
  'excited', 'gravity-flip', 'clap', 'boop',
])

// Narration moments (voiceStore.play) → the reaction beat that accompanies the line.
// The reaction plays first (a second or two), then the speaking layer shows through
// for the rest of the narration.
export const MOMENT_REACTIONS: Record<string, ClipName> = {
  test_pass: 'icon-check',
  test_fail: 'wrong',
  step_complete: 'nod-yes',
  phase_advance: 'gesture-point',
  phase_complete: 'celebrate',
  session_complete: 'bow',
  phase_skip_warning: 'alert',
  idle_nudge: 'gesture-wave',
}

// Ambient variety: while truly idle, occasionally play one of these gentle loops for a
// couple of cycles so the mascot never feels frozen. All are rest-seamed loops.
const FLAVOR_POOL: readonly ClipName[] = ['float', 'stargaze', 'peek', 'wobble', 'juggling']
const FLAVOR_MIN_GAP_S = 18
const FLAVOR_MAX_GAP_S = 40
const FLAVOR_PLAY_S = 7

const BORED_AFTER_S = 90
const ASLEEP_AFTER_S = 240

// Four gesture personalities for neutral narration; a new one is drawn (seeded) on
// every NARRATION_START so back-to-back lines never gesture the same way twice.
const SPEAKING_VARIANTS: readonly ClipName[] = ['speaking', 'speaking-2', 'speaking-3', 'speaking-4']

export type MascotEvent =
  | { type: 'THINKING'; on: boolean }
  | { type: 'NARRATION_START'; emotion: Emotion }
  | { type: 'NARRATION_END' }
  | { type: 'MOMENT'; moment: string }
  | { type: 'EXEC_RUNNING'; on: boolean }
  | { type: 'REACT'; clip: ClipName } // curated once-through beat, e.g. from a tour step
  | { type: 'FLAVOR'; clip: ClipName; seconds: number } // showcase a loop for a while
  | { type: 'HOVER'; on: boolean; now: number } // pointer over the mascot -> attentive
  | { type: 'PRESS' } // pointer pressed the mascot -> a boop beat
  | { type: 'REACTION_DONE' } // player's onComplete for the current reaction
  | { type: 'USER_ACTIVE'; now: number }
  | { type: 'TICK'; now: number }

export interface MachineState {
  reaction: ClipName | null
  speaking: Emotion | null
  speakingClip: ClipName
  thinking: boolean
  execRunning: boolean
  hovering: boolean
  flavor: { clip: ClipName; until: number } | null
  nextFlavorAt: number
  lastActiveAt: number
  now: number
  seed: number
}

export function initialMachine(now: number, seed = 1): MachineState {
  return {
    reaction: null,
    speaking: null,
    speakingClip: 'speaking',
    thinking: false,
    execRunning: false,
    hovering: false,
    flavor: null,
    nextFlavorAt: now + FLAVOR_MIN_GAP_S * 1000,
    lastActiveAt: now,
    now,
    seed: seed >>> 0 || 1,
  }
}

function lcg(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0
}

export function reduce(s: MachineState, e: MascotEvent): MachineState {
  switch (e.type) {
    case 'THINKING':
      return { ...s, thinking: e.on }
    case 'NARRATION_START': {
      const seed = lcg(s.seed)
      const pick = SPEAKING_VARIANTS[seed % SPEAKING_VARIANTS.length]
      // never repeat the previous variant back-to-back
      const clip = pick === s.speakingClip
        ? SPEAKING_VARIANTS[(seed + 1) % SPEAKING_VARIANTS.length]
        : pick
      return { ...s, speaking: e.emotion, speakingClip: clip, seed, lastActiveAt: s.now }
    }
    case 'NARRATION_END':
      return { ...s, speaking: null }
    case 'MOMENT': {
      const clip = MOMENT_REACTIONS[e.moment]
      return clip ? { ...s, reaction: clip, flavor: null } : s
    }
    case 'EXEC_RUNNING':
      return { ...s, execRunning: e.on, lastActiveAt: e.on ? s.now : s.lastActiveAt }
    case 'REACT':
      return ONCE_THROUGH.has(e.clip) ? { ...s, reaction: e.clip, flavor: null } : s
    case 'FLAVOR':
      return CLIPS[e.clip] === 'loop'
        ? { ...s, flavor: { clip: e.clip, until: s.now + e.seconds * 1000 } }
        : s
    case 'HOVER':
      // hovering is user presence too — it wakes the bored/sleeping ladder
      return { ...s, hovering: e.on, lastActiveAt: e.now, now: e.now }
    case 'PRESS':
      return { ...s, reaction: 'boop', flavor: null }
    case 'REACTION_DONE':
      return { ...s, reaction: null }
    case 'USER_ACTIVE':
      return { ...s, lastActiveAt: e.now, now: e.now }
    case 'TICK': {
      const next: MachineState = { ...s, now: e.now }
      // expire a finished flavor
      if (next.flavor && e.now >= next.flavor.until) next.flavor = null
      // schedule ambient flavor only when it would actually be visible
      const busy =
        next.reaction || next.speaking || next.thinking || next.execRunning || next.hovering
      const idleFor = (e.now - next.lastActiveAt) / 1000
      if (!busy && idleFor < BORED_AFTER_S && !next.flavor && e.now >= next.nextFlavorAt) {
        const seed1 = lcg(next.seed)
        const seed2 = lcg(seed1)
        const clip = FLAVOR_POOL[seed1 % FLAVOR_POOL.length]
        const gap = FLAVOR_MIN_GAP_S + (seed2 % (FLAVOR_MAX_GAP_S - FLAVOR_MIN_GAP_S))
        next.flavor = { clip, until: e.now + FLAVOR_PLAY_S * 1000 }
        next.nextFlavorAt = e.now + FLAVOR_PLAY_S * 1000 + gap * 1000
        next.seed = seed2
      }
      // pushing the schedule while busy keeps flavors from firing the instant we free up
      if (busy && next.nextFlavorAt < e.now + FLAVOR_MIN_GAP_S * 1000) {
        next.nextFlavorAt = e.now + FLAVOR_MIN_GAP_S * 1000
      }
      return next
    }
  }
}

export interface Resolved {
  clip: ClipName
  /** true → play with loop={false} and report completion via REACTION_DONE */
  once: boolean
}

const EMOTION_CLIP: Record<Emotion, ClipName> = {
  speaking: 'speaking',
  correct: 'correct',
  wrong: 'wrong',
}

export function resolveClip(s: MachineState): Resolved {
  if (s.reaction) return { clip: s.reaction, once: true }
  if (s.speaking) {
    // neutral narration loops one of the four gesture variants (drawn per line);
    // happy/sad narration faces are one-shots — after they play once the player holds
    // the final rest frame, which reads as attentive listening.
    if (s.speaking === 'speaking') return { clip: s.speakingClip, once: false }
    return { clip: EMOTION_CLIP[s.speaking], once: true }
  }
  if (s.thinking) return { clip: 'thinking', once: false }
  if (s.execRunning) return { clip: 'loading-dots', once: false }
  // direct engagement outranks ambient life: the mascot perks up under the pointer
  if (s.hovering) return { clip: 'attentive', once: false }
  const idleFor = (s.now - s.lastActiveAt) / 1000
  if (idleFor >= ASLEEP_AFTER_S) return { clip: 'sleeping', once: false }
  if (idleFor >= BORED_AFTER_S) return { clip: 'bored', once: false }
  if (s.flavor) return { clip: s.flavor.clip, once: false }
  return { clip: 'idle', once: false }
}
