Surface container. Default is white with a hairline border and no shadow. Use `interactive` for clickable cards, `tone="deep"` for navy poster panels.

```jsx
<Card>
  <h4>Built different</h4>
  <p>Learn to build real-world systems with AI copilots.</p>
</Card>
<Card tone="deep" interactive padding={32}>…</Card>
```

Cards never get drop shadows at rest — elevation is reserved for floating UI.
