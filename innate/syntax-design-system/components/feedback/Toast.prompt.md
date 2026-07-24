A single transient notification. You usually don't render this directly — keep an array of toasts in state and pass it to `ToastStack`, which positions and stacks them. Use `Toast` alone only for a one-off inline confirmation.

```jsx
<Toast tone="success" title="Saved" description="Your changes are live." onClose={hide} />
```

Navy card with a status-coloured left edge. Keep copy to one line where possible.
