Use for vertical rows of comparable items — settings, search results, notifications, file lists, simple nav. For columnar data with sorting use `Table`; for collapsible sections use `Accordion`.

```jsx
<List items={[
  { id: 1, primary: 'System design', secondary: 'Module 4 · 6 lessons',
    leading: <BookIcon />, meta: '92%', trailing: <ChevronRight /> },
  { id: 2, primary: 'Databases', secondary: 'Module 5 · locked',
    leading: <LockIcon />, disabled: true },
  { id: 3, primary: 'AI copilots', selected: true, meta: 'In progress' },
]} />
```

`selected` adds a brand-blue tint + left rule; rows with `onClick`/`href` get hover feedback. Pass `render` on an item for full custom layout. Use `bordered={false}` when the list already sits inside a `Card`.
