Use for 2–4 mutually exclusive view or mode switches that sit inline — list/grid, weekly/monthly, difficulty. For form choices prefer `RadioGroup`; for many options use `Select`.

```jsx
const [view, setView] = React.useState('grid');
<ButtonGroup
  value={view}
  onChange={setView}
  items={[
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
    { value: 'board', label: 'Board' },
  ]}
/>
```
