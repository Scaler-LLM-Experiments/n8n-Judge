# Syntax by Scaler — Design System

A design language for **Syntax by Scaler** — Scaler's AI‑forward learning brand.
Built to feel **premium, futuristic, and quietly confident** — a tech‑education
brand that reads like a modern product company, not a MOOC.

## Sources

This system was reverse‑engineered from the provided Figma file **"Scaler v3"**,
which contains both the polished Scaler.com marketing site and a **Visual
Direction** exploration proposing a bolder, more "premium + futuristic" look.
Both were used; Visual Direction is the **North Star** aesthetic for new work,
with the production marketing site providing validated components.

It was then imported and extended into this project from the attached read‑only
codebase mount **`Syntax Scaler Design System/`** (tokens, fonts, assets,
foundation cards, and the scaler.com UI kit). The extensions added here are the
**real React component library** (`components/`) and the **LMS UI kit**
(`ui_kits/lms/`).

- Figma (Scaler v3): `/Visual-Direction/Section-1`, `/Final_Scaler.com/Frame`
- Brand fonts: Clash Grotesk (variable, bundled), Plus Jakarta Sans (Google Fonts)
- Primary color: **`#0055FF`** (Bright) — canonical brand blue
- Darkest color: **`#011845`** (Navy); supporting blues `#004CE5`, `#083CA0`

## Products represented

- **Scaler.com** — flagship marketing site (Academy, School of Business,
  Masterclasses, AI Labs, Alumni, Resources). See `ui_kits/scaler_com/`.
- **Learning platform (LMS)** — the post‑enrolment dashboard + lesson player.
  See `ui_kits/lms/`.
- **Visual Direction** — a future‑facing exploration: stronger type, geometric
  SVG "stars", radial gradient poster panels. This is where the brand is going.

---

## Content Fundamentals

**Voice: elegant, quietly confident.** Every word earns its place. Copy guides
the reader with a steady hand — never declarative, never performative.

- **Tone.** Refined but warm. Clarity over cleverness. No hype words
  ("revolutionary", "game‑changing", "unlock"). Never ALL CAPS in body copy.
- **Person.** Second person ("you", "your") for the reader; third person for the
  program or mentor. Avoid "we" grandstanding.
- **Sentences.** Short, rhythmic, important idea at the front. Prefer periods
  over em‑dashes. Two short sentences beat one long one.
- **Case.** Sentence case for UI labels and body. Title Case for section
  headings only when shouting through display type. Reserve ALL CAPS for short
  eyebrow labels and wordmark‑style display ("SCHOOL OF BUSINESS").
- **Emoji.** Not used. Ever. Substitute with precise Lucide icons or nothing.
- **Instructions** are gentle imperatives: "Apply now", "Talk to an advisor",
  "Know more", "See the curriculum". Never exclamation points. Never "Click here".
- **Empty states** read like thoughtful pauses: "Nothing here yet." not
  "Oops! You haven't added anything."
- **Numbers** carry weight. "13×", "189", "24 years", "100+ engineers" are shown
  large, specifically, and without decoration.

### Canonical copy examples

- Eyebrow + H1: *"The market has already changed"* → **"Become an AI ready
  Software Engineer"**
- Value prop: *"Learn to build real‑world systems, work with AI copilots, and
  stay ahead in a world where coding is no longer enough."*
- Stat block: **13×** Salary jumps · **189** AI projects shipped
- CTA labels: **Apply now** · **Talk to an advisor** · **Know more** · **Login**

---

## Visual Foundations

### Color

- **Primary:** `#0055FF` (Scaler Blue) — CTAs, key accents, hero type on light
  panels. Darker state: `#083CA0`.
- **Deep:** `#011845` (Brand Navy) — large display surfaces, premium dark hero
  panels, footer, the LMS lesson player.
- **Soft blue tints** (`#E9F1FF`, `#E6F0FF`, `#EBF8FF`) carry most hero and panel
  backgrounds — a cool, editorial mood without shouting.
- **Accents** (lime `#C4FF00`, teal, violet `#8000FF`, orange `#ED7700`, gold
  `#E8B017`) appear only inside radial/star gradients or poster moments. Never as
  flat fills.
- **Neutrals** lean very cool and near‑black. Avoid warm grays.

### Type

**Rule:** Clash Grotesk handles all **headline and poster** type — H1–H3, hero
display, wordmark‑weight statements at 80–120px. **Everything else is Plus
Jakarta Sans** — body, UI labels, eyebrows, stat numbers, buttons, captions.

- **Clash Grotesk** (variable, 300–700): 500–600 for headlines (H1–H3), 600–700
  for poster moments. Large, tight, flat tracking. Only when it *is* a headline.
- **Plus Jakarta Sans** 400/500/600/700/800: 14 and 16 dominant body sizes; 12px
  eyebrows + meta; 80px Jakarta 700 for big stat numbers (`13×`, `189`).
- **Eyebrow labels:** Jakarta 14px / 500, `letter-spacing: 0.12em`, brand blue.

### Backgrounds — the gradient system

Gradients are **never** plain linear washes. They are built from **SVG shape
pairs** — organic unions + geometric "starburst" polygons — given a radial
gradient fill with fine noise. The signature motif is a **16‑pointed star /
compass polygon** (`assets/gradients/star-16.svg`) with a diagonal gradient
(Blue→Lime, Blue→Teal, Violet→Violet, Orange→Violet) on dark navy poster panels
with a crisp 8px white outline.

### Spacing

4pt base. Layouts breathe — 64px vertical sections, 24–40px card padding.
Marketing runs on a 1440 canvas with 140–206px gutters.

### Corner radii — **no rounded corners, anywhere.**

The brand's strongest visual rule. **Zero radius on everything** — cards,
buttons, inputs, chips, badges, avatars, modals, tooltips, status dots, the
switch knob. The single radius token is `--radius-0: 0px`.

### Borders

1px hairlines in cool grays: `#E4E4E4` (dividers/cards), `#D1D1D1` (stronger),
`#E5E7EB` (navbar). On dark panels: `rgba(255,255,255,0.1)` or a full 8px white
outline (Visual Direction posters only).

### Shadows

Minimal. CTA carries a hairline `0 1px 2px rgba(26,26,26,0.05)`. Cards use flat
1px borders, **not** drop shadows. Elevation (a wide, cool navy shadow) is
reserved for floating UI — modals, dropdowns, hovered clickable cards.

### Cards

Pure rectangles. `1px solid #E4E4E4` or `#CAC0C0`. White or `#F6F6F6`. 20–24px
padding. Icon top‑left, heading, body — strict vertical rhythm.

### Animation

Subtle and short. Durations 80–600ms (`--dur-1`…`--dur-6`). Easings sit in one
expo.out family (`--ease-standard`, `--ease-entrance`, `--ease-soft`) — slow to
start, long settle. No bounce, elastic, parallax, or scroll‑jacking. Fades +
slight upward translate for reveals. **Entrance animations must keep the visible
end‑state as the base** and animate from hidden (gated on
`prefers-reduced-motion: no-preference`) so static/print frames still show content.

### Hover + press

- **Hover.** Brighter/darker color shift; soft blue tint on ghost buttons; cards
  darken their border to `#D1D1D1`. No link underline outside body prose.
- **Press.** 0.5px nudge. No scale, no ripple.
- **Focus.** 2px `#0055FF` ring, 2px offset. Always visible.

### Imagery

Cool‑leaning, editorial. Mentor portraits desaturated warm on mid‑gray; product
photos cool and slightly flat. Wordmarks appear as monochrome SVG on dark navy.

---

## Iconography

**System: Lucide Icons.** Stroke weight 2, `currentColor`. ~20 distinct glyphs
across the system (`arrow-right`, `chevron-down`, `plus`, `sparkles`, `check`,
`book-open`, `play`, `bell`, `search`, `calendar`, `users`, `flame`, …).

- Default sizes: **16px** in buttons, **18–20px** in menu/nav rows, **32–48px**
  on feature cards.
- The LMS kit ships an inline Lucide set in `ui_kits/lms/Icons.jsx` (real Lucide
  path data, rendered as inline SVG so `currentColor` + sizing work offline).
- Emoji and Unicode symbols are **never** used as icons.
- The **logo** (`assets/logo-*.svg`) is the "SCALER" wordmark; the **logomark**
  (`assets/logomark-*.svg`) is the triangle apex. Never recolor — colour on
  light, white on dark.

---

## Components (React)

Reusable primitives live in `components/`, exported under the bundle namespace.
Each is self‑contained (React + CSS custom properties only) with a `.d.ts`
contract and a `.prompt.md` usage note. In a card/consumer:
`const { Button } = window.<Namespace>` (the namespace is reported by the
compiler). Do **not** `<script src>` the `.jsx` directly.

- `components/core/` — **Button** (primary/black/outline/ghost · xs/sm/md/lg/xl),
  **IconButton** (square icon-only action), **ButtonGroup** (segmented select),
  **SplitButton** (primary action + secondary-actions menu),
  **Badge** (status tones + solid), **Tag** (selectable/removable chip),
  **Avatar** (square; image or initials), **Card** (hairline surface; deep/blue
  tones; interactive), **Stat** (big Jakarta numeral), **Eyebrow** (tracked label),
  **Divider** (hairline rule, optional label), **Tooltip** (hover/focus hint),
  **Progress** (flat bar, determinate/indeterminate), **Spinner** (square ring),
  **Skeleton** (shimmer placeholder).
- `components/forms/` — **Input** (label/hint/error/icon), **Textarea**,
  **Select**, **Checkbox** (square), **RadioGroup** (single choice), **Switch**
  (sliding square knob), **Slider** (range), **DatePicker** (single + range
  calendar), **Combobox** (typeahead select), **FileUpload** (dropzone), and
  **Field** — the label/required/hint/error wrapper for controls that don't
  render their own.
- `components/feedback/` — **Alert** (inline status banner), **Toast** +
  **ToastStack** (transient corner notifications), **EmptyState** (no-data pause).
- `components/navigation/` — **Navbar** (top app chrome), **Sidebar** (persistent
  vertical nav rail, sections + collapse), **Tabs** (active-underline tablist),
  **Breadcrumb** (hierarchy trail), **Stepper** (ordered-flow progress),
  **Pagination** (page-through control).
- `components/charts/` — **LineChart**, **BarChart** (simple + stacked) and
  **DonutChart** — flat, brand-coloured SVG data viz sharing `CHART_PALETTE`.
- `components/data/` — **Table** (sortable, selectable data table with rich
  cells), **List** (item-row list with hairline separators), **CodeBlock**
  (dark / light code surface, line numbers + copy) — all hairline, zero radius.
- `components/overlay/` — **Modal** (interruptive dialog), **Drawer** (edge sheet),
  **Menu** (anchored action list), **Popover** (anchored floating panel). All
  portal-based: backdrop click / Escape / outside-click dismissal.
- `components/cards/` — **ImageCard** (image-led content card) and **ProfileCard**
  (people-led testimonial/mentor card). Photo-forward, for landing pages.
- `components/dashboard/` — **StatTile** (KPI tile) and **Accordion** (module /
  disclosure list), promoted from the LMS kit for reuse.

### Motion

Eight named entrance presets ship as both CSS utility classes
(`motion/presets.css` → `.anim-fade-up`, `.anim-scale-in`, …) and GSAP configs
(`motion/gsap-presets.js` → `ScalerMotion.reveal('.card', 'fadeUp')`), kept in
parity on the same `--dur-*` / `--ease-*` tokens. The visible end-state is always
the base; entrances play only under `prefers-reduced-motion: no-preference`.

### Accessibility

Brand blue (`#0055FF`, 5.6:1) and violet (`#8000FF`, 6.25:1) pass WCAG AA as
coloured text on white. Gold, lime, teal and orange do **not** — use them only as
fills with dark ink (7–17:1) or as decoration. See `preview/colors-accessibility.html`.

Starting points: Button, Card, Input.

---

## Index

Top‑level files in this system:

- `README.md` — you are here.
- `SKILL.md` — invocation guide for downstream agents.
- `styles.css` — **the consumer entry.** `@import`‑only; reaches the tokens,
  the Clash Grotesk `@font-face`, and the motion presets.
- `colors_and_type.css` — every brand token + element defaults + `.btn` classes
  (primary/black/outline/ghost · xs→xl) + dark‑mode scope.
- `motion/` — `presets.css` (8 entrance utility classes) + `gsap-presets.js`
  (GSAP-config parity), both on the system's duration + easing tokens.
- `fonts/ClashGrotesk-Variable.ttf` — bundled display font.
- `assets/` — logos (colour + white), logomark, the **Companion mascot**
  (`companion-mascot.svg`), sample imagery, and `assets/gradients/`.
- `preview/` — foundation + component specimen cards (Type, Colors, Spacing,
  Brand, Motion, Accessibility) shown in the Design System tab.
- `components/core/`, `components/forms/`, `components/feedback/`,
  `components/navigation/`, `components/data/`, `components/charts/`,
  `components/overlay/`, `components/cards/`, `components/dashboard/` — the
  React component library + cards.
- `ui_kits/scaler_com/` — marketing site recreation (`index.html` + modular JSX).
- `ui_kits/lms/` — **learner platform** recreation matching the real product
  handover: Daily Plan + All Modules dashboard and the code-editor / assignment
  screen — rendered in the system's zero-radius aesthetic.

The **Design System** tab renders every `@dsCard`‑tagged file. Open
`ui_kits/scaler_com/index.html` or `ui_kits/lms/index.html` to see the products
in action.
