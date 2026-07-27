The product's top navigation bar. Provide `links` for the primary nav and an `actions` node for the right side (search, notifications, login, CTA). Use real components in `actions` for consistency.

```jsx
<Navbar
  links={[
    { label: 'Programs', caret: true },
    { label: 'Masterclass' },
    { label: 'AI Labs', active: true },
    { label: 'Alumni' },
  ]}
  actions={
    <>
      <IconButton icon={<SearchIcon />} variant="ghost" aria-label="Search" />
      <Button variant="outline" size="sm">Login</Button>
      <Button variant="primary" size="sm">Talk to an advisor</Button>
    </>
  }
/>
```

Pass a custom `logo` node (e.g. an `<img>` of `assets/logo-colour.svg`) to override the default wordmark. Use `sticky` for app shells. For in-page view switching use `Tabs`; for hierarchy use `Breadcrumb`.
