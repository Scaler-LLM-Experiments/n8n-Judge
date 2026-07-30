# Adding a problem

The procedure used to live here. It is now a skill, so an agent picks it up automatically
when it touches `packages/problems/**` rather than needing to be told this file exists:

> **[.claude/skills/authoring-a-problem/SKILL.md](../.claude/skills/authoring-a-problem/SKILL.md)**

(Everything this file used to say about `app/src/data/problems/*`, `voiceCatalogue.js` and
Deepgram direction tags was describing a layout and a vendor that are both gone. It was
kept as a pointer rather than deleted because it is linked from CLAUDE.md and STATUS.md.)

The short version, for a human who just wants the commands:

```bash
cp -r packages/problems/_template packages/problems/<slug>
# fill in the TODOs; register it in packages/problems/index.js
npm test && npm run db:seed
```

Two things catch everyone, and are most of why the long version exists:

- **`npm run db:seed` is what makes an edit real.** Problems are served from Postgres, not
  from this repo, so without it your change has no effect at all.
- **A copy edit to a voice line also needs `npm run voice:generate`.** A clip's filename is
  a hash of its text, so new words mean the browser asks for a file nobody rendered.

Narration has its own contract:
[.claude/skills/iris-voice/SKILL.md](../.claude/skills/iris-voice/SKILL.md).
