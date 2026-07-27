---
name: syntax-by-scaler-design
description: Use this skill to generate well-branded interfaces and assets for Syntax by Scaler (the Scaler AI-forward learning brand), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available
files. The system is organized as:

- `README.md` — visual + content foundations, content tone, iconography, index
- `styles.css` — the consumer entry; `@import` this one file to get tokens + fonts
- `colors_and_type.css` — every brand token as a CSS var + element defaults + dark mode
- `fonts/` — Clash Grotesk Variable (headlines + poster moments only)
- `assets/` — logos (colour + white), logomark, sample imagery
- `assets/gradients/` — the signature 16-point starburst + organic union SVGs
- `preview/` — small design-system specimen cards (typography, colors, components)
- `components/core/`, `components/forms/` — reusable React primitives
  (Button, Badge, Tag, Avatar, Card, Stat, Eyebrow, Input, Select, Checkbox, Switch)
- `ui_kits/scaler_com/` — marketing site recreation (`index.html` + modular JSX)
- `ui_kits/lms/` — learning platform recreation: dashboard + dark lesson player

## Non-negotiable rules

1. **No rounded corners.** Every surface is a sharp rectangle. `border-radius`
   stays `0`. Load-bearing part of the brand's "premium + futuristic" feel.
2. **Clash Grotesk is for headlines and poster moments ONLY** — H1–H3 and
   wordmark-weight display (80–120px). **Everything else** — body, UI labels,
   eyebrows, buttons, stat numbers, captions — is **Plus Jakarta Sans**.
3. **Primary blue is `#0055FF`.** Darkest is `#011845`. Don't invent new blues;
   reach for the tokens in `colors_and_type.css`.
4. **Gradients are never plain CSS gradients.** Use the signature 16-point
   starburst SVG + radial fill + subtle noise. Never a decorative `linear-gradient`.
5. **Cards use 1px hairline borders, no drop shadow.** Shadows are reserved for
   floating UI (modals, dropdowns, hovered clickable cards).
6. **Voice is quietly confident** — concise, considered, unhurried. Precise
   labels; gentle imperatives. No exclamation marks, no emoji, no hype language.
7. **Icons are Lucide, stroke-2, currentColor.** Never emoji or Unicode glyphs.

## Usage

If creating visual artifacts (slides, mocks, throwaway prototypes, marketing
pages), copy assets out of this skill and produce static HTML files. Link
`styles.css`, reuse the JSX in `ui_kits/`, and follow the rules above. For React
work, the primitives in `components/` are self-contained — copy them in.

If working on production code, read the rules here to become an expert in
designing with this brand — but defer to the team's actual tokens / component
library if one exists in the target codebase.

If the user invokes this skill without other guidance, ask what they want to
build, ask a few focused questions (audience, surface, tone, fidelity, number of
variations), and act as an expert designer who outputs HTML artifacts _or_
production code, depending on the need.
