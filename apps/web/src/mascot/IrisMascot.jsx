import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MascotPlayer } from './MascotPlayer.jsx';
import { useVoice } from '../lib/VoiceContext.jsx';
import { ASK_CLICK_CLIP, useAskIris } from '../lib/AskIrisContext.jsx';

// Iris, animated by what she is actually saying.
//
// ---------------------------------------------------------------------------
// Why this exists
// ---------------------------------------------------------------------------
// The mascot's clip used to be local screen state, set by whichever screen owned
// it and never connected to the voice at all. So Iris talked for six seconds while
// standing perfectly still, and the reaction clip the phrase book chose
// (`MOMENT_CLIP` in voiceLines.js) was computed on every line and then thrown away.
// The one thing that makes a mascot read as a character — moving while it speaks —
// was the one thing missing.
//
// Three beats, in order:
//
//   1. A REACTION when the line starts. `celebrate` for finishing a stage,
//      `shake-no` for a wrong answer, `thinking` for a second miss. One-shot, and
//      the rig contract guarantees one-shots start and end on the rest pose, so it
//      hands over cleanly.
//   2. A SPEAKING loop for as long as she is still talking. The bundle ships four
//      (`speaking` … `speaking-4`); which one is chosen varies with the moment, so
//      two lines in a row never animate identically.
//   3. Back to `idle` when the audio ends.
//
// Click: the `surprised` one-shot (caught-off-guard jump) then Ask Iris opens.
//
// It works with the sound off, deliberately. `speaking` is true on the caption-only
// path too, so a learner who has muted narration still sees Iris talk — which is
// rule 2 in voice.js: the visual beat carries the moment, the audio is a bonus.

/** The speaking loops in companion.lottie. All four are seamless. */
export const SPEAKING = ['speaking', 'speaking-2', 'speaking-3', 'speaking-4'];

/** Stable per moment, so one line always animates the same way but neighbours differ. */
function speakingFor(seed) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return SPEAKING[(h >>> 0) % SPEAKING.length];
}

/**
 * @param resting  what to play when she is silent. `idle` everywhere except the
 *                 greeting, which opens on the `hello` entrance.
 */
export function IrisMascot({ resting = 'idle', size = 118 }) {
  const { speaking, clip: moment } = useVoice();
  const { openAskIris } = useAskIris();
  const [clip, setClip] = useState(resting);
  const [once, setOnce] = useState(resting !== 'idle');
  // True while the click reaction is playing so a voice `speaking: false` tick
  // cannot wipe the surprise mid-pop.
  const pokingRef = useRef(false);

  // Read inside callbacks that fire later, where the closed-over value is stale.
  const speakingRef = useRef(speaking);
  speakingRef.current = speaking;
  const momentRef = useRef(moment);
  momentRef.current = moment;

  // A new line: react to it. `idle` is the fallback `clipFor` returns for a moment
  // with no mapping, and looping it as a one-shot would end the animation, so it is
  // treated as "no reaction, go straight to talking".
  useEffect(() => {
    if (!moment) return;
    if (pokingRef.current) return;
    if (moment === 'idle') {
      setClip(speakingRef.current ? speakingFor('idle') : resting);
      setOnce(false);
      return;
    }
    setClip(moment);
    setOnce(true);
  }, [moment, resting]);

  // The reaction has played out. Keep talking if there is still audio to talk over.
  const onReactionDone = useCallback(() => {
    pokingRef.current = false;
    if (speakingRef.current) {
      setClip(speakingFor(momentRef.current ?? 'x'));
      setOnce(false);
    } else {
      setClip('idle');
      setOnce(false);
    }
  }, []);

  // She stopped. Settle back, whatever was playing — unless a click reaction is mid-flight.
  useEffect(() => {
    if (speaking) return;
    if (pokingRef.current) return;
    setClip('idle');
    setOnce(false);
  }, [speaking]);

  const onClick = useCallback(
    (e) => {
      e.stopPropagation();
      pokingRef.current = true;
      setClip(ASK_CLICK_CLIP);
      setOnce(true);
      openAskIris();
    },
    [openAskIris],
  );

  return (
    // overflow visible so the voice-reactive scale can grow past the box —
    // clipping here made the pulse look like it was doing nothing.
    // Click: surprised one-shot, then the Ask Iris panel.
    <div
      role="button"
      tabIndex={0}
      title="Ask Iris"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      }}
      style={{ width: size, height: size, overflow: 'visible', cursor: 'pointer', pointerEvents: 'auto' }}
    >
      <MascotPlayer clip={clip} once={once} onceDone={onReactionDone} />
    </div>
  );
}
