# Scaler.com — UI kit

A pixel‑leaning recreation of the Scaler marketing site: global nav, hero
headline, signature starburst poster row, "Why Scaler" feature strip,
Programs split panel, mentor card, stats strip, apply CTA, footer, and a
two‑step Apply modal.

## Files
- `index.html` — mounts the whole page as a click‑thru
- `kit.css` — scoped layout + component styles (tokens come from `/colors_and_type.css`)
- `Nav.jsx` — 60px sticky top nav with logo, menu, CTAs
- `Hero.jsx` — "Become an AI ready software engineer" hero
- `Posters.jsx` — signature 16‑point starburst gradient row + noise
- `WhyScaler.jsx` — 4‑up feature cards on brand blue
- `Programs.jsx` — left program list + right navy poster panel
- `Mentor.jsx` — mentor card with photo + apex mark
- `Stats.jsx` — 3‑up stat cards (Jakarta 80/700 numbers)
- `ApplyCTA.jsx` — bottom CTA block + footer
- `ApplyModal.jsx` — two‑step Apply modal

## Interactive bits
- Top **Apply** / Hero **Apply now** / Bottom **Apply now** → open the 2‑step
  Apply modal (personal details → program choice → submit)
- The **Programs** list is click‑able — the selected program highlights in blue
- Nav **Login** is a stub (no auth)

## Rules followed
- **No rounded corners** — every surface is a sharp rectangle
- **Clash Grotesk** on hero + programs poster + apply poster **only**;
  everything else (body, eyebrows, stats, buttons) is **Plus Jakarta Sans**
- Primary blue is **#0055FF**; hovers step up to `--brand-primary-strong`
- Cards are 1px hairline borders, no drop shadow
- Gradient posters are always: 16‑point starburst + linear gradient + overlay noise
