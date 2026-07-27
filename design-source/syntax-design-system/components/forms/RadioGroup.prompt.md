Use for a single choice from 2–6 mutually exclusive options. For on/off use `Switch`; for multi-select use `Checkbox`; for long lists use `Select`.

```jsx
const [plan, setPlan] = React.useState('academy');
<RadioGroup
  value={plan}
  onChange={setPlan}
  options={[
    { value: 'academy', label: 'Academy', hint: 'Full-time, 9 months' },
    { value: 'business', label: 'School of Business' },
    { value: 'labs', label: 'AI Labs', disabled: true },
  ]}
/>
```

Use `direction="row"` only for 2–3 short labels. Square dot, brand-blue inner fill — never round.
