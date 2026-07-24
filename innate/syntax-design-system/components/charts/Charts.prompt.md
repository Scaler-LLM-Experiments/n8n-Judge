Flat, brand-coloured SVG charts for dashboards and reports. All three scale to their container width, use hairline gridlines, and share `CHART_PALETTE`. They are presentational — compute/aggregate data upstream.

```jsx
<LineChart
  data={[
    { label: 'M', value: 90 }, { label: 'T', value: 75 }, { label: 'W', value: 82 },
    { label: 'T', value: 120 }, { label: 'F', value: 138 }, { label: 'S', value: 160 },
  ]}
/>

<BarChart
  series={[{ name: 'Completed', color: '#0055FF' }, { name: 'In progress', color: '#82B0FF' }]}
  data={[{ label: 'W23', values: [60, 20] }, { label: 'W24', values: [70, 22] }]}
/>

<DonutChart
  centerValue="216" centerLabel="Learners"
  segments={[
    { label: 'On track', value: 60 },
    { label: 'In progress', value: 25 },
    { label: 'Inactive', value: 15, color: '#D1D1D1' },
  ]}
/>
```

Keep palettes to 3–4 series. For a single headline number use `Stat`/`StatTile`; for a tiny inline trend use a short `LineChart` with `showGrid={false}` and `markers={false}`. No drop shadows, no rounded bar caps.
