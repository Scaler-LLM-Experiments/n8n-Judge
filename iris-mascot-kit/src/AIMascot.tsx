import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LottieDefault from 'lottie-react'
import idleAnim from '@/assets/mascot/idle.json'
import speakingAnim from '@/assets/mascot/speaking.json'
import correctAnim from '@/assets/mascot/correct.json'
import wrongAnim from '@/assets/mascot/wrong.json'
import thinkingAnim from '@/assets/mascot/thinking.json'
import { useVoiceStore } from '@/stores/voiceStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useTourStore } from '@/stores/tourStore'
import { useChatStore } from '@/stores/chatStore'
import { useMascotStore } from '@/stores/mascotStore'
import { useMascotMachine } from '@/hooks/useMascotMachine'
import { MascotPlayer } from '@/components/session/MascotPlayer'
import { featureFlags } from '@/config/featureFlags'

// lottie-react ships a CJS default export; Vite's dep pre-bundling can hand back the module
// namespace ({ default, useLottie, ... }) instead of the component itself, which React then
// rejects as "element type is object". Unwrap defensively so it works in both dev
// (pre-bundled) and production (rollup) builds.
const Lottie = ((LottieDefault as unknown as { default?: typeof LottieDefault }).default ??
  LottieDefault) as typeof LottieDefault

// A calm AI-interviewer mascot pinned to the bottom-left of the session screen. It plays an
// idle Lottie normally; while voice narration is "speaking" (real audio OR the text-only
// fallback) it grows, swaps to the speaking Lottie, and shows a speech bubble with the
// narrated line. Clicking it opens the AI assistant tab. This coexists with — and does not
// replace — the ambient VoiceNarrationIndicator glow.
export function AIMascot() {
  const isPlaying = useVoiceStore((s) => s.isPlaying)
  const amplitude = useVoiceStore((s) => s.amplitude)
  const currentText = useVoiceStore((s) => s.currentText)
  const currentEmotion = useVoiceStore((s) => s.currentEmotion)
  // The mascot "thinks" while the AI assistant is generating a reply.
  const aiThinking = useChatStore((s) => s.isLoading)
  // Stay out of the way during onboarding: the tour welcome card also lives bottom-left,
  // and the mascot shouldn't distract during an active spotlight tour.
  const tourActive = useTourStore((s) => s.welcomeVisible || s.activeTourKey !== null)

  // The state machine decides what plays (reactions > speaking > working > hover >
  // idle ladder); the hook also wires voice/chat/execution signals and the machine's
  // clock. Behind its own kill-switch — with the flag off, the original ternary below
  // still drives the legacy lottie-react player.
  const machine = useMascotMachine()
  const machineDriven = featureFlags.mascotMachine
  const [hovered, setHovered] = useState(false)
  const sessionId = useSessionStore((s) => s.session?.id)

  // Greet with "HI" only the very first time this session (this attempt at the
  // problem) starts — not on every phase/stage remount within it.
  useEffect(() => {
    if (!featureFlags.mascotMachine || !featureFlags.aiMascot || !sessionId) return
    const key = `mascot_greeted:${sessionId}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
    useMascotStore.getState().send({ type: 'REACT', clip: 'hello' })
  }, [sessionId])

  if (!featureFlags.aiMascot || tourActive) return null

  // Legacy expression pick: AI generating → thinking; narrating → the moment's emotion
  // (correct/wrong/neutral talking); otherwise idle. Only grow while actually narrating.
  const emotionAnim =
    currentEmotion === 'correct' ? correctAnim : currentEmotion === 'wrong' ? wrongAnim : speakingAnim
  const { anim, animKey } = aiThinking
    ? { anim: thinkingAnim, animKey: 'thinking' }
    : isPlaying
      ? { anim: emotionAnim, animKey: currentEmotion ?? 'speaking' }
      : { anim: idleAnim, animKey: 'idle' }
  // Narrating is biggest; hovering grows it a step (app-side, so the container's
  // width/height transition carries it) — the attentive clip does the acting.
  const size = isPlaying ? 109 : hovered ? 95 : 83

  // Direct interactivity: hovering perks the mascot up (attentive) and grows it,
  // pressing boops it. Pointer events feed the machine so these coordinate with
  // reactions/narration instead of fighting them.
  const send = useMascotStore.getState().send
  const interactivity = {
    onPointerEnter: () => {
      setHovered(true)
      if (machineDriven) send({ type: 'HOVER', on: true, now: Date.now() })
    },
    onPointerLeave: () => {
      setHovered(false)
      if (machineDriven) send({ type: 'HOVER', on: false, now: Date.now() })
    },
    onPointerDown: () => {
      if (machineDriven) send({ type: 'PRESS' })
    },
  }

  return (
    // z-[120]: above the full-screen takeovers and modals (z-[100]) and the ambient glow
    // (z-[110]), so the interviewer stays visible/clickable even while an overlay is up (e.g.
    // speaking the skip-phase warning). Column layout keeps the bubble above the mascot; the
    // container is pinned by its bottom edge so growth pushes upward, not off-screen. The
    // whole thing springs up into view on mount (a little "jump in").
    <motion.div
      className="fixed left-6 bottom-6 z-[120] flex flex-col items-start gap-2"
      initial={{ y: 140, opacity: 0, scale: 0.5 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 17, delay: 0.25 }}
    >
      <AnimatePresence>
        {isPlaying && currentText && (
          <motion.div
            key="bubble"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="pointer-events-none relative ml-3 max-w-[240px] rounded-lg border border-border bg-navy-1 px-3 py-2 text-sm leading-snug text-foreground shadow-lg"
          >
            {currentText}
            {/* Little downward tail pointing at the mascot. */}
            <span className="absolute -bottom-1 left-6 h-2 w-2 rotate-45 border-b border-r border-border bg-navy-1" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label="Ask Iris"
        onClick={() => useSessionStore.getState().setActiveRightTab('AI')}
        {...interactivity}
        animate={{ scale: isPlaying ? 1.12 + amplitude * 0.06 : 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        style={{ width: size, height: size }}
        className="origin-bottom cursor-pointer rounded-full outline-none transition-[width,height] duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-navy-0"
      >
        {machineDriven ? (
          // One persistent dotLottie (WASM) player; state changes swap animations
          // inside the companion.lottie bundle in-memory (see MascotPlayer).
          <MascotPlayer clip={machine.clip} once={machine.once} onceDone={machine.onReactionDone} />
        ) : (
          /* Legacy: cross-fade between per-state lottie-react players so the mascot
             changes expression gracefully rather than cutting abruptly. */
          <div className="relative h-full w-full">
            <AnimatePresence>
              <motion.div
                key={animKey}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <Lottie animationData={anim} loop autoplay style={{ width: '100%', height: '100%' }} />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </motion.button>
    </motion.div>
  )
}
