Use for a message that stays on the page — a form-level error, a plan notice, a heads-up. For transient confirmations use `Toast`.

```jsx
<Alert tone="success" title="Application received" onClose={dismiss}>
  We’ll email your next steps within two days.
</Alert>
<Alert tone="danger" title="Payment failed">Check your card details and try again.</Alert>
```
