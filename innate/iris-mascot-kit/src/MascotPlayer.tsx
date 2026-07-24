import { useCallback, useEffect, useRef } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import type { DotLottie } from '@lottiefiles/dotlottie-web'
import companionUrl from '@/assets/mascot/companion.lottie?url'
import type { ClipName } from '@/lib/mascotMachine'
import '@/lib/dotlottieSetup'

interface MascotPlayerProps {
  clip: ClipName
  /** play once (loop off) and report completion — reactions/one-shot beats */
  once: boolean
  onceDone: () => void
}

// One persistent dotLottie (WASM) instance playing out of the companion.lottie bundle.
// State changes swap animations in-memory via loadAnimation(id) — no per-clip fetches,
// no player remounts. Quirk handled here (verified against dotlottie-web 0.76): the
// constructor's animationId is ignored and the bundle opens on animations[0], so every
// swap goes through the load event → apply cycle until the active id matches.
export function MascotPlayer({ clip, once, onceDone }: MascotPlayerProps) {
  const dlRef = useRef<DotLottie | null>(null)
  const desired = useRef({ clip, once })
  const onceDoneRef = useRef(onceDone)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onceDoneRef.current = onceDone
  }, [onceDone])

  const apply = useCallback(() => {
    const dl = dlRef.current
    if (!dl || !dl.isLoaded) return
    const want = desired.current
    if (dl.activeAnimationId !== want.clip) {
      dl.loadAnimation(want.clip) // fires 'load' again; apply re-runs with the right id
      return
    }
    dl.setLoop(!want.once)
    dl.play()
  }, [])

  const dotLottieRefCallback = useCallback(
    (dl: DotLottie | null) => {
      dlRef.current = dl
      if (!dl) return
      dl.addEventListener('load', apply)
      dl.addEventListener('complete', () => {
        // completion only matters for once-through beats; loops never emit it
        if (desired.current.once) onceDoneRef.current()
      })
    },
    [apply],
  )

  useEffect(() => {
    desired.current = { clip, once }
    apply()
    // a soft blink masks mid-clip swaps; the rest-seam rig contract keeps even a hard
    // cut subtle, so this is polish rather than load-bearing
    containerRef.current?.animate([{ opacity: 0.45 }, { opacity: 1 }], {
      duration: 260,
      easing: 'ease-out',
    })
  }, [clip, once, apply])

  return (
    <div ref={containerRef} className="h-full w-full">
      <DotLottieReact
        src={companionUrl}
        autoplay={false}
        loop
        dotLottieRefCallback={dotLottieRefCallback}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
