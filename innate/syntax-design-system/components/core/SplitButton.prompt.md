Use when one action is the obvious default but related actions belong next to it — Save / Save & duplicate, Export / Export as…, Enroll / Add to waitlist.

```jsx
<SplitButton
  onClick={save}
  items={[
    { label: 'Save & duplicate', onClick: dup },
    { label: 'Save as template', onClick: tmpl },
    { divider: true },
    { label: 'Discard', danger: true, onClick: discard },
  ]}
>
  Save
</SplitButton>
```

The main label is the primary action; the caret reveals the rest. For a single action use `Button`; for a menu with no default action use `Menu` with an `IconButton` trigger.
