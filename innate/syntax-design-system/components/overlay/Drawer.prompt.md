Use for secondary content that shouldn't take over the page — filters, a detail panel, a cart, mobile nav. Slides from the chosen edge.

```jsx
const [open, setOpen] = React.useState(false);
<Drawer open={open} onClose={() => setOpen(false)} side="right" title="Filters"
  footer={<Button variant="primary">Show results</Button>}>
  {/* filter controls */}
</Drawer>
```

For an interruptive confirmation use `Modal`; for a tiny anchored menu use `Popover` / `Menu`.
