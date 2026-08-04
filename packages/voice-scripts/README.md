# @judge/voice-scripts

**Generated. Do not edit by hand.** Written by `npm run voice:generate`, which builds
these from the phrase book ([voiceLines.js](../../apps/web/src/lib/voiceLines.js)) plus each
problem's `voice` overrides.

One file per problem: every line Iris can say, by id.

```jsonc
"verify-pass--classify--classify-with-ai--v0": {
  "text": "Yes, Classify with AI is set up right.",
  "file": "shared/verify-pass--a1b2c3d4.mp3"
}
```

They are committed because they are a **contract**, read by three places that must agree:
the generator (what to render), the server (which files it is willing to fetch), and the
browser (which file to play). Deriving that agreement independently in each place is what
broke before — the browser asked for names the generator had never written, and the
serving route answered by calling ElevenLabs mid-session.

## The two halves of a clip's name

- **The id** — the object key above. Identifies a *moment*, is unique, and is derived at
  runtime by the browser from the moment, the node and the variant.
- **The `file`** — where the audio lives. Identifies a *sentence*: `--a1b2c3d4` is a
  fingerprint of the exact words plus the voice and model. Never derived at runtime, only
  looked up.

Many ids point at one file, and that is the saving: a generic line reached from a dozen
moments is one recording, and a line no problem authored sits in `shared/` rather than
being rendered once per problem. At the time of writing, 980 ids across 2 problems resolve
to 236 files, 43 of them `shared/`.

Those counts move whenever a problem is added or a line is reworded, so treat them as a
snapshot and not a fact — `npm run voice:generate -- --dry-run` prints the live numbers and
costs nothing.

**The `shared/` files already exist.** They were rendered by whichever problem was
generated first, and every problem after that reuses them. So a NEW problem only pays to
render the lines it authored itself; the generic half of its journey is already recorded.
`voice:generate` decides this from local disk (`fs.existsSync`) and skips whatever is
already there, which is why re-running it is safe and nearly free.

Because the fingerprint is in the name, rewording a line produces a **new file**. That is
what makes it safe to serve clips `immutable` with a one-year cache: a reworded line
reaches learners immediately, and an untouched one is never re-fetched.

## When to regenerate

- After editing any line in `voiceLines.js` or a problem's `voice` block.
- After adding or changing a problem's nodes, questions or build phases.
- **After changing the vendor, voice or model** — all three are part of every fingerprint,
  so any of them renames every file and re-renders the whole library, `shared/` included.
  That means `VOICE_VENDOR`, `ELEVENLABS_VOICE_ID` and `ELEVENLABS_MODEL_ID` (with Deepgram,
  `DEEPGRAM_TTS_MODEL` alone, since an Aura model *is* the voice). That is correct
  behaviour, and it is why `renderedWith` is recorded in each file — check it before
  changing any of them, because it is the one edit that bills for the entire catalogue.

```bash
npm run voice:generate -- --dry-run   # what would change, spends nothing
npm run voice:generate                # write tables, render what is missing, locally
npm run voice:sync                    # upload to the bucket
```

Nothing here talks to S3, and nothing renders at runtime.
