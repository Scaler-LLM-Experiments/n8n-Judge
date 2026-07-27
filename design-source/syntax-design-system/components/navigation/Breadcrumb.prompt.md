Use to show where a page sits in a hierarchy and let users step back up. Keep labels short; the last entry is the current page and isn't a link.

```jsx
<Breadcrumb items={[
  { label: 'Academy', href: '/academy' },
  { label: 'Backend', href: '/academy/backend' },
  { label: 'Systems Design' },
]} />
```
