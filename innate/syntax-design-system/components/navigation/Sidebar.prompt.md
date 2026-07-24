The persistent side navigation for app shells (the LMS dashboard, admin tools). Pair with `Navbar` for the top chrome, or use standalone. Give it a fixed-height parent — it fills the height and scrolls its own item list.

```jsx
<Sidebar
  header={<img src="logo-colour.svg" height="18" alt="Scaler" />}
  items={[
    { label: 'Dashboard', icon: <HomeIcon />, active: true },
    { label: 'Modules', icon: <BookIcon />, badge: 12 },
    { label: 'Assignments', icon: <TaskIcon />, badge: 3 },
    { section: true, label: 'Account' },
    { label: 'Mentors', icon: <UsersIcon /> },
    { label: 'Settings', icon: <GearIcon /> },
  ]}
  footer={<Avatar src={photo} />}
/>
```

Use `collapsed` for an icon-only 68px rail (labels become `title` tooltips). One `active` item at a time. For in-page tabs use `Tabs`; for the top bar use `Navbar`.
