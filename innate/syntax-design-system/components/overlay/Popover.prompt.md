Use for small interactive content anchored to a control — a filter form, a date range, info with a link. For a list of actions use `Menu`; for plain hover text use `Tooltip`.

```jsx
<Popover trigger={<Button variant="outline">Filter</Button>}>
  {({ close }) => (
    <div>
      <RadioGroup options={sortOpts} value={sort} onChange={setSort} />
      <Button size="sm" onClick={close} style={{ marginTop: 12 }}>Apply</Button>
    </div>
  )}
</Popover>
```
