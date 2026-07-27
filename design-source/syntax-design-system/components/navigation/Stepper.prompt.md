Use for a linear, ordered flow where the user should see where they are and what's left — application, checkout, onboarding. Horizontal for 3–5 short steps; vertical when steps carry descriptions.

```jsx
<Stepper current={1} steps={[
  { label: 'Profile' },
  { label: 'Program', description: 'Pick your track' },
  { label: 'Payment' },
  { label: 'Done' },
]} />
```

For free navigation between views use `Tabs`.
