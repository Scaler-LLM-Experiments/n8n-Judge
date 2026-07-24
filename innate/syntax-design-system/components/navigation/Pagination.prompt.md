Use under long, paged lists and tables. 1-based. Collapses with an ellipsis past ~7 pages.

```jsx
const [page, setPage] = React.useState(1);
<Pagination page={page} pageCount={24} onChange={setPage} />
```

For infinite feeds prefer load-more; pagination is for addressable, countable pages.
