Use for a short, supplementary hint on an icon or truncated label — never for essential information. Keep it to a few words.

```jsx
<Tooltip content="Copy to clipboard">
  <IconButton aria-label="Copy" icon={<Copy size={16} />} />
</Tooltip>
```

Anchors inline to the wrapped element. For interactive content (links, actions) use a `Popover` or `Menu` instead.
