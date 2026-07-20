import { create } from 'zustand'
import {
  initialMachine,
  reduce,
  resolveClip,
  type MascotEvent,
  type MachineState,
  type Resolved,
} from '@/lib/mascotMachine'
import { featureFlags } from '@/config/featureFlags'

// Clip data lives in the companion.lottie bundle and is swapped in-player by id
// (see MascotPlayer) — this store only runs the machine and exposes what to play.
interface MascotStore {
  machine: MachineState
  resolved: Resolved
  send: (event: MascotEvent) => void
}

export const useMascotStore = create<MascotStore>((set, get) => {
  const machine = initialMachine(Date.now())
  return {
    machine,
    resolved: resolveClip(machine),
    send: (event) => {
      const next = reduce(get().machine, event)
      const nextResolved = resolveClip(next)
      const prev = get().resolved
      if (nextResolved.clip === prev.clip && nextResolved.once === prev.once) {
        set({ machine: next })
      } else {
        set({ machine: next, resolved: nextResolved })
      }
    },
  }
})

/** Fire the reaction beat for a narration moment (called from voiceStore.play). */
export function notifyMascotMoment(moment: string) {
  if (!featureFlags.aiMascot || !featureFlags.mascotMachine) return
  useMascotStore.getState().send({ type: 'MOMENT', moment })
}
