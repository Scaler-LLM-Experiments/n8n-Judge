Disclosure list — module lists, FAQs, settings groups. The open panel header fills brand blue (the LMS module pattern); `locked` items are disabled + greyed.

```jsx
<Accordion defaultOpenId="m3" items={[
  { id: 'm1', title: 'Module 1: Coding Basics', meta: 'PSP 60%', content: <Lessons/> },
  { id: 'm3', title: 'Module 3: Linked Lists', meta: 'PSP 60%', content: <Lessons/> },
  { id: 'm7', title: 'Module 7', locked: true },
]} />
```

Single-open. Uncontrolled by default; pass `openId` + `onOpenChange` to control.
