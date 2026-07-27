Use for any clickable action. Solid `primary` for the main action, `black` for high-contrast / brand-neutral CTAs (pricing, app shells, dark-on-light moments), `outline` for secondary, `ghost` for tertiary/inline.

```jsx
<Button variant="primary" onClick={apply}>Apply now</Button>
<Button variant="black" iconRight={<ArrowRight size={16} />}>Get started</Button>
<Button variant="outline">Login</Button>
<Button variant="ghost" size="sm">Learn more</Button>
<Button variant="primary" size="lg">Talk to an advisor</Button>
```

**Variants:** `primary | black | outline | ghost`.
**Sizes (full scale):** `xs` 28 · `sm` 32 · `md` 36 (default) · `lg` 56 · `xl` 80. Use `xs`/`sm`/`md` for dashboards and dense UI; `lg`/`xl` for landing-page hero CTAs.

Never round the corners. Pair an outline + primary in the top-right CTA cluster.
