Use when a `Select` would be too long to scan — programs, cities, mentors, tags. Filters as the user types; keyboard-navigable.

```jsx
const [program, setProgram] = React.useState('');
<Combobox
  label="Program"
  value={program}
  onChange={setProgram}
  options={[
    { value: 'aiml', label: 'AI / Machine Learning' },
    { value: 'be', label: 'Backend Development' },
    { value: 'ds', label: 'Data Science' },
    { value: 'devops', label: 'DevOps & Cloud' },
  ]}
/>
```

For a short fixed list use `Select`; for multi-select use `Tag` chips alongside. Pass `error` to show a validation message (mirrors `Input`).
