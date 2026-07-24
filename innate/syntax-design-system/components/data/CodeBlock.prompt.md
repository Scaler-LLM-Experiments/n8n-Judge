Use for any code sample — lesson player, docs, marketing. Dark theme for product surfaces, light for marketing/blog. Highlighting is a lightweight pass (keywords, strings, numbers, comments, calls); for guaranteed-correct colour pre-tokenize upstream and pass `highlight={false}`.

```jsx
<CodeBlock
  language="TypeScript"
  filename="src/lib/auth.ts"
  highlightLines={[4]}
  code={`// Verifies the JWT and returns the user, or null.
export async function getUser(req: Request) {
  const token = req.headers.get("authorization");
  if (!token) return null;
  return db.user.findUnique({ where: { id: claims.sub } });
}`}
/>

<CodeBlock theme="light" language="Bash" copyable code="npm install @scaler/sdk" />
```

Sharp corners, hairline-only on the light theme. The copy button shows a transient "Copied" confirmation. For a single inline token use a `<code>` element (already styled by the system stylesheet).
