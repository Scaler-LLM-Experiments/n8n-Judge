import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { AIMascot } from '@/components/session/AIMascot'
import { useVoiceStore } from '@/stores/voiceStore'
import { useChatStore } from '@/stores/chatStore'
import { useExecutionStore } from '@/stores/executionStore'
import { useMascotStore } from '@/stores/mascotStore'
import type { ClipName } from '@/lib/mascotMachine'

// Dev-only harness for the mascot: renders the REAL AIMascot component tree (state
// machine, dotLottie player, speech bubble) with buttons that simulate the app's
// signals — no backend or session needed. Narration moments go through the actual
// voiceStore.play, which in a clip-less env falls back to text-only speech, so the
// bubble behaves exactly like production.
//
//   npm run dev   →   http://localhost:5173/mascot-harness.html
//
// This page is dev-server only: vite build ships index.html exclusively.
export function Harness() {
  const play = (moment: string) => {
    useVoiceStore.getState().setMuted(false)
    useVoiceStore.getState().play(moment)
  }
  const react = (clip: ClipName) => useMascotStore.getState().send({ type: 'REACT', clip })
  const btn =
    'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50'

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <h1 className="mb-1 text-xl font-bold">Mascot harness</h1>
      <p className="mb-6 max-w-xl text-sm text-slate-600">
        The real session mascot (bottom-left). Hover it → attentive; press it → boop; leave
        it alone → ambient flavors, then bored, then asleep. Buttons simulate app signals.
      </p>
      <div className="flex max-w-xl flex-wrap gap-2">
        <button className={btn} data-testid="narrate" onClick={() => play('test_pass')}>
          narrate: test_pass
        </button>
        <button className={btn} onClick={() => play('test_fail')}>narrate: test_fail</button>
        <button className={btn} onClick={() => play('phase_complete')}>narrate: phase_complete</button>
        <button className={btn} onClick={() => play('idle_nudge')}>narrate: idle_nudge</button>
        <button className={btn} onClick={() => useChatStore.getState().setLoading(!useChatStore.getState().isLoading)}>
          toggle AI thinking
        </button>
        <button className={btn} onClick={() => useExecutionStore.getState().setIsRunning(!useExecutionStore.getState().isRunning)}>
          toggle code running
        </button>
        <button className={btn} onClick={() => react('celebrate')}>react: celebrate</button>
        <button className={btn} onClick={() => react('hello')}>react: hello</button>
      </div>
      <AIMascot />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
)
