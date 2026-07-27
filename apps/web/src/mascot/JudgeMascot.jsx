import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { MascotPlayer } from './MascotPlayer.jsx';

const HOLD_MS = 2600;
const SIZE = 76;
const BUBBLE_W = 268;

// Idles at the bottom-left of its (positioned) parent. When `reaction` changes,
// GSAP slides it next to the attempted node, it plays the reaction clip and shows
// a speech bubble above itself, then it returns home.
export function JudgeMascot({ reaction, onReactionDone, coach }) {
  const wrapperRef = useRef(null);
  const home = useRef({ x: 0, y: 0, parentW: 0, parentH: 0 });
  const [clip, setClip] = useState('idle');
  const [bubble, setBubble] = useState(null);
  const [bubbleLeft, setBubbleLeft] = useState(0);

  const HOME_LEFT = 24;
  const HOME_BOTTOM = 24;

  useLayoutEffect(() => {
    // Fixed to the viewport's bottom-left. Home is a known offset from the corner.
    const measure = () => {
      home.current = {
        vw: window.innerWidth,
        vh: window.innerHeight,
        homeX: HOME_LEFT,
        homeY: window.innerHeight - HOME_BOTTOM - SIZE,
      };
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!reaction) return;
    const el = wrapperRef.current;
    const h = home.current;
    // slide next to the attempted node (viewport coords, since we're fixed), clamped on-screen
    const targetX = clamp(reaction.anchor.x - SIZE / 2, 8, h.vw - SIZE - 8);
    const targetY = clamp(reaction.anchor.y - SIZE / 2, 100, h.vh - SIZE - 24);
    const dx = targetX - h.homeX;
    const dy = targetY - h.homeY;

    // bubble sits above the mascot, horizontally clamped to the viewport
    const mascotLeft = h.homeX + dx;
    setBubbleLeft(clamp(mascotLeft + SIZE / 2 - BUBBLE_W / 2, 8, h.vw - BUBBLE_W - 8) - mascotLeft);

    gsap.killTweensOf(el);
    setBubble(null);
    gsap.to(el, {
      x: dx,
      y: dy,
      duration: 0.5,
      ease: 'power3.out',
      onStart: () => setClip(reaction.clip),
      onComplete: () => setBubble(reaction),
    });

    const timer = setTimeout(() => {
      setBubble(null);
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
          setClip('idle');
          if (onReactionDone) onReactionDone();
        },
      });
    }, HOLD_MS);

    return () => clearTimeout(timer);
  }, [reaction]);

  const wrong = reaction && reaction.tone === 'wrong';
  const bubbleBg = wrong ? '#111827' : 'var(--brand-primary)';

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'fixed', left: HOME_LEFT, bottom: HOME_BOTTOM, width: SIZE, height: SIZE, zIndex: 80, pointerEvents: 'none' }}
    >
      <div style={{ width: SIZE, height: SIZE, filter: 'drop-shadow(0 6px 14px rgba(1,24,69,0.18))' }}>
        <MascotPlayer clip={clip} once={clip !== 'idle'} onceDone={() => {}} />
      </div>
      {bubble ? (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: bubbleLeft,
            marginBottom: 14,
            width: BUBBLE_W,
            background: bubbleBg,
            color: '#fff',
            padding: '12px 14px',
            fontSize: 13,
            lineHeight: 1.45,
            fontFamily: 'var(--font-body)',
            boxShadow: '0 10px 30px rgba(1,24,69,0.22)',
          }}
        >
          {bubble.title ? (
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.75, marginBottom: 4 }}>
              {bubble.title}
            </div>
          ) : null}
          {bubble.message}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: clamp(SIZE / 2 - bubbleLeft, 16, BUBBLE_W - 16),
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: `8px solid ${wrong ? '#111827' : '#0055FF'}`,
            }}
          />
        </div>
      ) : null}

      {/* persistent coaching bubble at home when idle */}
      {!bubble && !reaction && coach ? (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 14,
            width: 250,
            background: 'var(--brand-primary)',
            color: '#fff',
            padding: '11px 13px',
            fontSize: 12.5,
            lineHeight: 1.45,
            fontFamily: 'var(--font-body)',
            boxShadow: '0 10px 30px rgba(1,24,69,0.22)',
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.75, marginBottom: 3 }}>
            Your guide
          </div>
          {coach}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: SIZE / 2,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '8px solid #0055FF',
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
