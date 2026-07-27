Use for a list of actions or navigation links triggered by a button — row "more" menus, account menus, overflow actions.

```jsx
<Menu
  trigger={<IconButton aria-label="More" icon={<MoreVertical size={18} />} />}
  items={[
    { label: 'Edit', icon: <Pencil size={16} />, onClick: edit },
    { label: 'Duplicate', onClick: dup },
    { divider: true },
    { label: 'Delete', icon: <Trash2 size={16} />, danger: true, onClick: remove },
  ]}
/>
```

For interactive form content use `Popover`; for hover hints use `Tooltip`.
