Use for filters and multi-select chips. Pass `selected` for active state, `onRemove` to make it removable.

```jsx
<Tag selected onClick={toggle}>AI/ML</Tag>
<Tag onRemove={() => drop('Backend')}>Backend</Tag>
```
