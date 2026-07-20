import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { MascotPlayer } from './MascotPlayer.jsx';

const HOLD_MS = 2200;

// Sits idle at the bottom-left of its containing (relatively/absolutely positioned)
// parent. When `reaction` changes to a new object, it slides over to `reaction.anchor`
// (screen coordinates), plays `reaction.clip` once, shows the bubble, then returns home.
export function JudgeMascot({ reaction, onReactionDone }) {
  const wrapperRef = useRef(null);
  const homeCenterRef = useRef({ x: 0, y: 0 });
  const [clip, setClip] = useState('idle');
  const [bubble, setBubble] = useState(null);

  useLayoutEffect(() => {
    const rect = wrapperRef.current.getBoundingClientRect();
    homeCenterRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  useEffect(() => {
    if (!reaction) return;
    const el = wrapperRef.current;
    const home = homeCenterRef.current;
    const dx = reaction.anchor.x - home.x - 10;
    const dy = reaction.anchor.y - home.y - 50;

    gsap.killTweensOf(el);
    setBubble(null);

    gsap.to(el, {
      x: dx,
      y: dy,
      duration: 0.45,
      ease: 'power2.out',
      onStart: () => setClip(reaction.clip),
      onComplete: () => setBubble(reaction.message),
    });

    const timer = setTimeout(() => {
      setBubble(null);
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.45,
        ease: 'power2.inOut',
        onComplete: () => {
          setClip('idle');
          if (onReactionDone) onReactionDone();
        },
      });
    }, HOLD_MS);

    return () => clearTimeout(timer);
  }, [reaction]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        left: 20,
        bottom: 20,
        width: 60,
        height: 60,
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      <MascotPlayer clip={clip} once={clip !== 'idle'} onceDone={() => {}} />
      {bubble ? (
        <div
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: 10,
            background: reaction && reaction.tone === 'wrong' ? '#111827' : 'var(--brand-primary)',
            color: '#fff',
            padding: '10px 12px',
            fontSize: 13,
            lineHeight: 1.4,
            maxWidth: 220,
            fontFamily: 'var(--font-body)',
          }}
        >
          {bubble}
        </div>
      ) : null}
    </div>
  );
}
