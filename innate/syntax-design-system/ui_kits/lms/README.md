# UI Kit — Learner platform (LMS)

A high-fidelity recreation of the **Scaler AI LMS** learner dashboard, rendered
in the design system's signature **zero-radius** aesthetic. Tokens come from
`../../styles.css`; the LMS-only patterns live in `lms.css`.

This kit was updated to the **calm-scroll** design — the page lands mid-document
on the *current* class, completed work sits above the fold (scroll up to
revisit), and a single expanded module is the blue "hero".

## Files

- `index.html` — runnable kit (calm-scroll dashboard). The bottom floating pill
  switches between **All Modules** and **Daily Plan**; "Go to today" jumps back
  to the current item; "Switch to old view" opens the classic dashboard.
- `lms.css` — all LMS surface styling (top bar, icon rail, collapsing greeting,
  module accordion, lesson rows, certification, Daily Plan timeline + live "Now"
  marker, stat/streak rail, floating pill, rewind divider) plus the full motion
  system. Tokens mapped to `../../styles.css`. Sharp corners enforced globally.
- `lms.js` — data-driven rendering (no framework): module/lesson/task/timeline
  generators, rotating time-of-day salutation, the live "Now" indicator, the
  calm-scroll landing math, the collapsing-greeting observer, GSAP entrance +
  scroll reveals, and the procedurally-generated rewind divider. All motion is
  gated behind `prefers-reduced-motion` / GSAP-present flags with static
  fallbacks.
- `classic-dashboard.html` — the **previous** React kit (dashboard + code
  editor), preserved and reachable via "Switch to old view". Loads the JSX
  modules below.
- `Icons.jsx`, `Chrome.jsx`, `StatRail.jsx`, `DailyPlan.jsx`, `AllModules.jsx`,
  `CodeEditor.jsx`, `kit.css` — the classic React implementation (used only by
  `classic-dashboard.html`). The **code-editor / assignment** screen lives here.

## Motion system (the standout)

- **Hover grows, press shrinks — both from center.** Lesson rows, task cards,
  module headers, buttons all share `scale(1.02)` hover / `scale(0.97)` press.
- **Border, not shadow.** Emphasis is a 1.5px blue outline, never a drop shadow.
- **Sheen sweep** on the one open "current" module header (slow 5s loop).
- **Recurring ring-pulse** on the next-up class (2 pulses / ~10s, stops on click).
- **Live "Now" flag** glides along the Daily Plan timeline with the real clock.
- **Collapsing greeting** condenses to a slim sticky bar once scrolled past.

These are documented as standalone specimens in the Design System tab under
**LMS Patterns** (and **Motion — interaction patterns**).

## Brand notes

- **Zero radius everywhere** (the agreed Visual Direction). The real product is
  rounded; this kit renders the same layout sharp.
- **Companion mascot** — abstract geometric mark (navy/white/blue, single eye).
  Authored in **Rive** (`assets/mascot/mascot.riv`, not committed); the kit shows
  the static SVG mark and degrades gracefully if the `.riv` is absent. Time-of-day
  and feedback states are driven by state-machine inputs, not file swaps.
- Brand blue `#0055FF` is the single accent; gold/orange dots are the only warm
  moments (streak / attendance), used sparingly.

## Shortcuts / fakes

- The code editor (classic view) is a visual recreation — Run/Submit and tabs are
  interactive, but there's no real execution. Photos are royalty-free stand-ins.
- Icons are inline Lucide paths (no runtime dependency); GSAP + (optional) Rive
  load from CDN.
