# Case spec template — moved

The template lives at **[case-authoring/TEMPLATE.md](case-authoring/TEMPLATE.md)**, with the
prompt an author uses to fill it in at
**[case-authoring/STARTER-PROMPT.md](case-authoring/STARTER-PROMPT.md)**.

There is one template rather than two, on purpose. It is written to be **self-contained** — the
complete node menu is inline — because the people filling it in are usually chatting with an AI
that has no access to this repository. A second, repo-flavoured copy would drift from it, and a
stale node list in an authoring template is how a case gets built on a node that does not exist.

Hand an author both files. They come back with `<slug>.md`; save it to `docs/case-specs/` and run:

```
/author-case docs/case-specs/<slug>.md
```

## What the pipeline expects that the template does not say

These are agent-facing and deliberately kept out of an author's handout:

- **Every build phase must declare its own `pickable`.** The picker's fallback offers only a
  fraction of the library, so an omitted `pickable` can make a required node unpickable.
- **Node icons are already committed** under `apps/web/public/node-icons/` and wired through
  `nodeImageIcons`. An authoring run never fetches, generates or hotlinks an asset.
- **The full node library** — all 200 registered types, with the deprecated and deferred lists —
  is [node-library-catalog.md](node-library-catalog.md). The template's inline menu is a curated
  working set drawn from it: every trigger, every action, and the core and AI steps a case
  realistically places.

Both are covered in [.claude/agents/case-author.md](../.claude/agents/case-author.md) and
[.claude/skills/authoring-a-problem/SKILL.md](../.claude/skills/authoring-a-problem/SKILL.md).
