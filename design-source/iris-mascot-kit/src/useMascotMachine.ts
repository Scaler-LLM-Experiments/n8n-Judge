import { useEffect } from 'react'
import { useMascotStore } from '@/stores/mascotStore'
import { useVoiceStore } from '@/stores/voiceStore'
import { useChatStore } from '@/stores/chatStore'
import { useExecutionStore } from '@/stores/executionStore'

const TICK_MS = 3_000
const ACTIVITY_THROTTLE_MS = 5_000

// Wires the app's live signals into the mascot state machine and keeps its clock
// ticking. Mount once (AIMascot does). The machine itself is pure — this hook is the
// only place where timers, listeners and store subscriptions exist.
export function useMascotMachine() {
  const resolved = useMascotStore((s) => s.resolved)

  useEffect(() => {
    const send = useMascotStore.getState().send

    // narration: speaking layer follows the voice store's playing state + emotion
    let wasPlaying = useVoiceStore.getState().isPlaying
    const unsubVoice = useVoiceStore.subscribe((vs) => {
      if (vs.isPlaying && !wasPlaying) {
        send({ type: 'NARRATION_START', emotion: vs.currentEmotion ?? 'speaking' })
      } else if (!vs.isPlaying && wasPlaying) {
        send({ type: 'NARRATION_END' })
      }
      wasPlaying = vs.isPlaying
    })

    // AI assistant generating → thinking layer
    let wasThinking = useChatStore.getState().isLoading
    if (wasThinking) send({ type: 'THINKING', on: true })
    const unsubChat = useChatStore.subscribe((cs) => {
      if (cs.isLoading !== wasThinking) {
        wasThinking = cs.isLoading
        send({ type: 'THINKING', on: cs.isLoading })
      }
    })

    // code executing on Judge0 → working layer
    let wasRunning = useExecutionStore.getState().isRunning
    if (wasRunning) send({ type: 'EXEC_RUNNING', on: true })
    const unsubExec = useExecutionStore.subscribe((es) => {
      if (es.isRunning !== wasRunning) {
        wasRunning = es.isRunning
        send({ type: 'EXEC_RUNNING', on: es.isRunning })
      }
    })

    // human presence: throttled activity pings feed the bored/sleeping ladder
    let lastPing = 0
    const onActivity = () => {
      const now = Date.now()
      if (now - lastPing < ACTIVITY_THROTTLE_MS) return
      lastPing = now
      send({ type: 'USER_ACTIVE', now })
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))

    // the clock: expires flavors, schedules ambient variety, ages the idle ladder
    const timer = setInterval(() => send({ type: 'TICK', now: Date.now() }), TICK_MS)

    return () => {
      unsubVoice()
      unsubChat()
      unsubExec()
      events.forEach((e) => window.removeEventListener(e, onActivity))
      clearInterval(timer)
    }
  }, [])

  return {
    clip: resolved.clip,
    once: resolved.once,
    onReactionDone: () => useMascotStore.getState().send({ type: 'REACTION_DONE' }),
  }
}
