Use for choosing a date or a date range — enrolment dates, session booking, billing periods. Renders the calendar surface; pair it with an `Input` + `Popover` if you want a text-field trigger.

```jsx
// Single date
const [date, setDate] = React.useState(null);
<DatePicker value={date} onChange={setDate} min={new Date()} />

// Range
const [range, setRange] = React.useState({ start: null, end: null });
<DatePicker mode="range" value={range} onChange={setRange} />
```

Monday-first. `min`/`max` disable out-of-bounds days; today is marked in brand blue. For picking a time slot (mentor sessions) render a grid of slot buttons alongside — the calendar is date-only.
