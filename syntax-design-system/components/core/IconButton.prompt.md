Use for toolbar and inline actions where a label would crowd the layout — close, more, edit, navigation chevrons. Always pass `aria-label`.

```jsx
<IconButton aria-label="Close" icon={<X size={18} />} />
<IconButton aria-label="Apply" variant="primary" icon={<ArrowRight size={18} />} />
<IconButton aria-label="More" variant="outline" size="sm" icon={<MoreHorizontal size={16} />} />
```

Default is `ghost`. Don't use for the primary page action — that's a labelled `Button`.
