Use to switch between sibling views within one page — dashboard sections, profile panels. Renders the tab bar; you render the active panel.

```jsx
const [tab, setTab] = React.useState('overview');
<Tabs value={tab} onChange={setTab} items={[
  { value: 'overview', label: 'Overview' },
  { value: 'modules', label: 'Modules', count: 7 },
  { value: 'mentors', label: 'Mentors' },
]} />
{tab === 'overview' && <Overview />}
```

For top-level app navigation use a navbar; for steps in a flow use `Stepper`.
