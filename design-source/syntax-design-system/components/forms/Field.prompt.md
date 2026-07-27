Use to give label / hint / error to controls that don't carry their own — `Select`, `RadioGroup`, `Slider`, `FileUpload`, or any custom control. `Input` and `Textarea` already include this internally, so don't double-wrap them.

```jsx
<Field label="Cohort" hint="You can change this later." htmlFor="cohort">
  <Select id="cohort" options={cohorts} />
</Field>

<Field label="Experience" required error="Please pick one.">
  <RadioGroup options={levels} value={lvl} onChange={setLvl} />
</Field>
```
