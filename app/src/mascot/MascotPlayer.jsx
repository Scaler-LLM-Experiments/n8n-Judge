import { useCallback, useEffect, useRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import companionUrl from '../assets/mascot/companion.lottie?url';
import './dotlottieSetup.js';

// One persistent dotLottie instance playing clips out of the companion.lottie bundle.
// State changes swap animations in-memory via loadAnimation(id) — no remounts.
export function MascotPlayer({ clip, once, onceDone }) {
  const dlRef = useRef(null);
  const desired = useRef({ clip, once });
  const onceDoneRef = useRef(onceDone);

  useEffect(() => {
    onceDoneRef.current = onceDone;
  }, [onceDone]);

  const apply = useCallback(() => {
    const dl = dlRef.current;
    if (!dl || !dl.isLoaded) return;
    const want = desired.current;
    if (dl.activeAnimationId !== want.clip) {
      dl.loadAnimation(want.clip);
      return;
    }
    dl.setLoop(!want.once);
    dl.play();
  }, []);

  const dotLottieRefCallback = useCallback(
    (dl) => {
      dlRef.current = dl;
      if (!dl) return;
      dl.addEventListener('load', apply);
      dl.addEventListener('complete', () => {
        if (desired.current.once) onceDoneRef.current();
      });
    },
    [apply]
  );

  useEffect(() => {
    desired.current = { clip, once };
    apply();
  }, [clip, once, apply]);

  return (
    <DotLottieReact
      src={companionUrl}
      autoplay={false}
      loop
      dotLottieRefCallback={dotLottieRefCallback}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
