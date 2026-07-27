Use for resume / document / image uploads. Dashed hairline that turns brand blue on drag-over. It reports files only — manage upload state yourself and show `Progress` while it runs.

```jsx
<FileUpload
  accept=".pdf,image/*"
  hint="PDF or image · up to 10MB"
  onFiles={(files) => upload(files[0])}
/>
```
