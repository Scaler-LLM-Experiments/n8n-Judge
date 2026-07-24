Use for a focused task or confirmation that must interrupt — apply, confirm, a short form. Keep it short; for long flows use a full page or `Drawer`.

```jsx
const [open, setOpen] = React.useState(false);
<Button onClick={() => setOpen(true)}>Apply now</Button>
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Start your application"
  footer={<>
    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    <Button variant="primary">Continue</Button>
  </>}
>
  Takes about five minutes. You can save and resume anytime.
</Modal>
```
