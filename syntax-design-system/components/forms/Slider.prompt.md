Use for a continuous value where the rough position matters more than a precise number — budget, EMI, difficulty. Wrap in a `Field` for a label.

```jsx
const [n, setN] = React.useState(40);
<Slider value={n} onChange={setN} min={0} max={100} showValue format={(v) => `${v}%`} />
```

Square knob, flat track. For exact numbers prefer a numeric `Input`.
