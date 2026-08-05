import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// Opens the Ask Iris drawer from anywhere — TopBar's button and a click on the
// journey mascot share one source of truth. State lives above the screens so a
// mascot that is a sibling of TopBar (not a child) can still open the panel.

/** One-shot in companion.lottie: dip → pop with shock ring — "caught off guard". */
export const ASK_CLICK_CLIP = 'surprised';

const AskIrisContext = createContext({
  isOpen: false,
  openAskIris: () => {},
  closeAskIris: () => {},
});

export function AskIrisProvider({ children }) {
  const [isOpen, setOpen] = useState(false);
  const openAskIris = useCallback(() => setOpen(true), []);
  const closeAskIris = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ isOpen, openAskIris, closeAskIris }),
    [isOpen, openAskIris, closeAskIris],
  );
  return <AskIrisContext.Provider value={value}>{children}</AskIrisContext.Provider>;
}

export function useAskIris() {
  return useContext(AskIrisContext);
}

/**
 * Click Iris → play the caught-off-guard one-shot, then open Ask Iris.
 * While that plays, `clip` / `once` drive MascotPlayer; on complete she returns
 * to `baseClip` (usually idle, or whatever the screen was showing).
 */
export function useMascotAskClick(baseClip = 'idle') {
  const { openAskIris } = useAskIris();
  const [clip, setClip] = useState(baseClip);
  const [once, setOnce] = useState(false);
  const reactingRef = useRef(false);
  const baseRef = useRef(baseClip);
  baseRef.current = baseClip;

  useEffect(() => {
    if (reactingRef.current) return;
    setClip(baseClip);
    setOnce(false);
  }, [baseClip]);

  const onMascotClick = useCallback(
    (e) => {
      e?.stopPropagation?.();
      reactingRef.current = true;
      setClip(ASK_CLICK_CLIP);
      setOnce(true);
      openAskIris();
    },
    [openAskIris],
  );

  const onReactDone = useCallback(() => {
    reactingRef.current = false;
    setClip(baseRef.current);
    setOnce(false);
  }, []);

  const onMascotKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onMascotClick(e);
      }
    },
    [onMascotClick],
  );

  return { clip, once, onMascotClick, onMascotKeyDown, onReactDone };
}
