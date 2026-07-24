Use for any tabular data — learner rosters, cohort lists, billing, leaderboards. Define `columns` once and feed `data`; use `render` for rich cells (badges, avatars, actions) and `sortAccessor` when a rendered cell still needs to sort by a raw value.

```jsx
const cols = [
  { key: 'name', header: 'Learner', sortable: true,
    render: (r) => <strong>{r.name}</strong> },
  { key: 'program', header: 'Program' },
  { key: 'progress', header: 'Progress', align: 'right', sortable: true,
    render: (r) => `${r.progress}%` },
  { key: 'status', header: 'Status',
    render: (r) => <Badge tone={r.status === 'Active' ? 'success' : 'neutral'}>{r.status}</Badge> },
];

const [picked, setPicked] = React.useState([]);
<Table
  columns={cols}
  data={rows}
  rowKey="id"
  selectable
  selected={picked}
  onSelectChange={setPicked}
/>
```

Sorting and selection work out of the box (uncontrolled). Pass `sort`/`onSortChange` or `selected`/`onSelectChange` only when the parent needs to own that state. For unknown-length loads pair with `Skeleton`; for genuinely empty results pass an `EmptyState` to the `empty` prop. Use `size="sm"` for dense dashboards. Sharp corners and hairline rules — never add radius or drop shadows.
