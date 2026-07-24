Image-led card for landing pages — course tiles, articles, events, stories. Two layouts via `variant`: `"stacked"` (default — full-bleed photo on top, content beneath) and `"overlay"` (photo fills the whole card, content sits inside over a dark scrim — `ratio` controls the card's shape). Pass `href`/`onClick` to make it interactive (border-darken + soft lift + image zoom on hover). Zero radius.

```jsx
<ImageCard
  image="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800"
  eyebrow="AI / ML"
  title="Build a transformer from scratch"
  excerpt="A hands-on walkthrough of attention, positional encoding and training loops."
  meta="12 min read · By Anshuman Singh"
  cta="Read more →"
  href="#"
/>

{/* Full-bleed image with text inside */}
<ImageCard
  variant="overlay"
  ratio="3 / 4"
  image="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600"
  eyebrow="Live cohort"
  title="System design, taught live"
  meta="Starts Jul 8"
  cta="Reserve a seat →"
  href="#"
/>
```

Use real, cool-leaning, editorial photography. For people-led testimonial/mentor cards, use `ProfileCard`.
