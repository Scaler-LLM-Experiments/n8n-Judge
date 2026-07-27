Mount once near your app root. Keep the toast array in state; add with a unique id, and auto-remove on a timer or on dismiss.

```jsx
const [toasts, setToasts] = React.useState([]);
const notify = (t) => {
  const id = Date.now();
  setToasts((xs) => [...xs, { id, ...t }]);
  setTimeout(() => setToasts((xs) => xs.filter((x) => x.id !== id)), 4000);
};

<ToastStack toasts={toasts} onDismiss={(id) => setToasts((xs) => xs.filter((x) => x.id !== id))} />
<Button onClick={() => notify({ tone: 'success', title: 'Saved' })}>Save</Button>
```
