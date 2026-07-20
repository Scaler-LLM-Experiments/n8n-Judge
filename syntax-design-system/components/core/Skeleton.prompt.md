Use to hold the shape of content while it loads — mirror the real layout so nothing jumps when data arrives. Compose several to mock a card.

```jsx
<Skeleton height={140} />                {/* thumbnail */}
<Skeleton variant="text" width="60%" /> {/* title */}
<Skeleton variant="text" />              {/* body line */}
```

Square corners, cool shimmer. Don't animate forever on a screen that has clearly failed — show an `EmptyState` instead.
