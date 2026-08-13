# Plain-Language Case Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every word a Judge learner reads obey ASD-STE100 and Zinsser, enforce it in tests so it cannot drift again, and fix the 254 existing violations across all six cases.

**Architecture:** One module (`plainLanguage.ts`) holds the rules as numbers and pure functions. A reporting CLI (`case:copy`) makes the current damage visible per case, so the copy can be fixed case by case with the tree never red. Enforcement flips on **last**, in `validateProblem()`, at which point the three places agents read the authoring rules are updated in the same commit.

**Tech Stack:** TypeScript (erasable syntax only, Node 22+ strips types), vitest, zod, plain `.js` problem data files.

## Global Constraints

Copied verbatim from the standard being adopted, plus the repo rules that bind every task.

- **Em and en dashes are banned outright in learner-facing copy.** Not rationed. Also the typed `--`. A full stop, comma or colon always does the job. `validateProblem.ts:445` already enforces this for **voice** copy; this work extends the same rule to written copy.
- **ASD-STE100 sentence limit: 25 words** for descriptive text (20 for instructions; 25 is the looser limit used here). One idea per sentence. Active voice.
- **`statement`: max 150 words, max 9 sentences.** The hand-written reference case is 43 words. The agent-written ones are 95, 193, 201, 250, 270.
- **Learner-visible option labels: max 90 characters**, so they read on one line in a ~420px control.
- **Zinsser's four principles**: simplicity, brevity, clarity, humanity. Brevity does the most work: strip every sentence to its cleanest components.
- **`explanation`, `why` and probe `response` keep the sentence and dash rules but get NO total-length cap.** They are the teaching, read after a decision, and a paragraph is often right.
- **Never change what an answer IS while fixing how it reads.** These are graded surfaces. A copy edit that changes which option is correct, or that makes a distractor true, is a defect.
- **Editing `packages/problems/*` changes nothing in the app until `npm run db:seed`.**
- **`flowSummary` labels stay 3 words max and must describe the JOB, never the node** (existing test-enforced rule; do not break it while shortening copy).
- **Voice lines can reference the statement.** `weather-commute-ping`'s `verify_fail:schedule` variant 1 points the learner at "the second paragraph" for the time. If a statement rewrite moves that fact, the voice line must move with it.
- **Do not touch `voice.js` unless a task says so.** A clip's filename is a hash of its text, so a voice edit costs a re-render and a re-upload. The shipped voice tables are already dash-clean.
- No linter exists. `npm test` + `npm run typecheck` + `npm run smoke` are the whole gate. Match each file's surrounding style by reading it.

---

## File Structure

| File | Responsibility |
|---|---|
| `packages/problem-schema/plainLanguage.ts` | **Created (already written, uncommitted).** The rules as frozen numbers plus pure functions: `sentencesOf`, `wordsOf`, `longSentences`, `dashIssues`, `statementIssues`, `optionLabelIssues`. |
| `packages/problem-schema/plainLanguage.test.ts` | **Created (already written, uncommitted).** 16 tests, including the 296-character ternary that motivated the option cap. |
| `packages/problem-schema/index.ts` | Add the exports so `@judge/problem-schema` consumers can use them. |
| `scripts/authoring/copy-check.mjs` | **Created.** Reporting CLI over one case or all six. Exit 1 when any violation remains. This is what makes tasks 2 to 7 verifiable. |
| `package.json` | Add `case:copy`. |
| `packages/problems/<slug>/{meta,dissection,build,nodeSetup,probes,cases}.js` | The copy fixes, six cases, one task each (weather-commute-ping takes two). |
| `packages/problem-schema/validateProblem.ts` | **Last task.** Wire the rules as errors. |
| `.claude/skills/authoring-a-problem/SKILL.md` | The procedure agents read. Add the standard. |
| `docs/case-authoring/TEMPLATE.md` | What a human author fills in. Add the standard in author-facing terms. |
| `packages/llm/authoringPrompt.ts` + `.test.ts` | The second copy of the rules that the drafting model reads. CLAUDE.md warns this is the one doc that can rot unnoticed, so its test pins the numbers. |

---

### Task 1: The rules module, exported, with a CLI that measures the damage

`plainLanguage.ts` and `plainLanguage.test.ts` are already written and passing (16 tests) but uncommitted. This task commits them, exports them, and adds the CLI every later task is verified with. **No enforcement yet** — `validateProblem()` is untouched, so nothing goes red.

**Files:**
- Modify: `packages/problem-schema/index.ts`
- Create: `scripts/authoring/copy-check.mjs`
- Modify: `package.json` (scripts block)
- Test: `packages/problem-schema/plainLanguage.test.ts` (already written)

**Interfaces:**
- Consumes: nothing.
- Produces: `PLAIN_LANGUAGE` (frozen: `MAX_SENTENCE_WORDS: 25`, `MAX_STATEMENT_SENTENCES: 9`, `MAX_STATEMENT_WORDS: 150`, `MAX_OPTION_LABEL_CHARS: 90`), `sentencesOf(text): string[]`, `wordsOf(text): number`, `longSentences(path, text, max?): PlainLanguageIssue[]`, `dashIssues(path, text): PlainLanguageIssue[]`, `statementIssues(statement): PlainLanguageIssue[]`, `optionLabelIssues(path, label): PlainLanguageIssue[]`, type `PlainLanguageIssue = { path: string; message: string }`.

- [ ] **Step 1: Confirm the existing tests pass**

Run: `npx vitest run packages/problem-schema/plainLanguage.test.ts`
Expected: PASS, 16 tests.

- [ ] **Step 2: Export from the package index**

Append to `packages/problem-schema/index.ts`:

```ts
export {
  PLAIN_LANGUAGE,
  sentencesOf,
  wordsOf,
  longSentences,
  dashIssues,
  statementIssues,
  optionLabelIssues,
} from './plainLanguage.ts';
export type { PlainLanguageIssue } from './plainLanguage.ts';
```

- [ ] **Step 3: Write the CLI**

Create `scripts/authoring/copy-check.mjs`. It walks exactly the surfaces the rules apply to and prints a per-case count. The walk list is the contract: statement, dissection prompts and option labels, eval prompts / options / explanations, nodeSetup field subtitles, every option label, and every `why` string.

```js
#!/usr/bin/env node
// Reports plain-language violations per case: the copy a learner reads while deciding.
//
// Reporting only, on purpose. `validateProblem()` enforces these as errors, but this
// script is what makes a 254-violation backlog fixable case by case: it names every
// offending string with its path, and exits 1 while any remain.
import { problems } from '../../packages/problems/index.js';
import {
  statementIssues,
  longSentences,
  dashIssues,
  optionLabelIssues,
} from '../../packages/problem-schema/plainLanguage.ts';

const only = process.argv.slice(2).find((a) => !a.startsWith('-'));
const verbose = process.argv.includes('--verbose');

/** Every learner-read string in a problem, as [path, text] pairs. */
function* copyOf(p) {
  yield ['statement', p.statement];
  yield ['brief', p.brief];
  yield ['tagline', p.tagline];
  for (const [i, d] of (p.dissection ?? []).entries()) {
    yield [`dissection[${i}].prompt`, d.prompt];
    yield [`dissection[${i}].explanation`, d.explanation];
    yield [`dissection[${i}].wrongHint`, d.wrongHint];
    for (const o of d.options ?? []) yield [`dissection[${i}].option`, o.label];
  }
  for (const [i, q] of (p.evalQuestions ?? []).entries()) {
    yield [`evalQuestions[${i}].prompt`, q.prompt];
    yield [`evalQuestions[${i}].explanation`, q.explanation];
    for (const o of q.options ?? []) yield [`evalQuestions[${i}].option`, String(o)];
  }
  for (const [i, ph] of (p.buildPhases ?? []).entries()) yield [`buildPhases[${i}].coach`, ph.coach];
  for (const [t, s] of Object.entries(p.nodeSetup ?? {})) {
    for (const f of s.fields ?? []) {
      yield [`${t}.${f.key}.subtitle`, f.subtitle];
      yield [`${t}.${f.key}.whyCorrect`, f.whyCorrect];
      yield [`${t}.${f.key}.whyWrong`, f.whyWrong];
      for (const o of [...(f.options ?? []), ...(f.valueOptions ?? []), ...(f.nameOptions ?? [])]) {
        yield [`${t}.${f.key}.why`, o.why];
      }
    }
    for (const st of s.settings ?? []) for (const w of Object.values(st.why ?? {})) yield [`${t}.settings.${st.key}`, w];
  }
  for (const [t, list] of Object.entries(p.nodeProbes ?? {})) {
    yield [`probe.${t}.prompt`, list?.prompt];
    for (const o of list?.options ?? []) {
      yield [`probe.${t}.option`, o.text];
      yield [`probe.${t}.response`, o.response];
    }
  }
}

/** Only the strings a learner picks BETWEEN get the one-line cap. */
function* labelsOf(p) {
  for (const [i, d] of (p.dissection ?? []).entries())
    for (const o of d.options ?? []) yield [`dissection[${i}].option`, o.label];
  for (const [t, s] of Object.entries(p.nodeSetup ?? {})) {
    for (const f of s.fields ?? []) {
      for (const o of [...(f.options ?? []), ...(f.valueOptions ?? []), ...(f.nameOptions ?? [])]) {
        yield [`${t}.${f.key}.option`, String(o.label ?? o.value ?? '')];
      }
    }
  }
}

function issuesFor(p) {
  const out = [...statementIssues(p.statement ?? '')];
  for (const [path, text] of copyOf(p)) {
    if (typeof text !== 'string' || !text) continue;
    if (path !== 'statement') out.push(...longSentences(path, text));
    out.push(...dashIssues(path, text));
  }
  for (const [path, label] of labelsOf(p)) out.push(...optionLabelIssues(path, label));
  // statementIssues already covered the statement's own sentences and dashes.
  return out.filter((v, i, a) => a.findIndex((x) => x.path === v.path && x.message === v.message) === i);
}

const targets = only ? { [only]: problems[only] } : problems;
if (only && !problems[only]) {
  console.error(`unknown case "${only}"`);
  process.exit(2);
}

let total = 0;
for (const [id, p] of Object.entries(targets)) {
  const issues = issuesFor(p);
  total += issues.length;
  const mark = issues.length ? '✗' : '✓';
  console.log(`  ${mark} ${id.padEnd(24)} ${issues.length} violation(s)`);
  if (verbose) for (const i of issues) console.log(`      ${i.path}: ${i.message}`);
}
console.log(total ? `\n${total} violation(s). Run with --verbose to see each one.` : '\nplain language: clean');
process.exit(total ? 1 : 0);
```

- [ ] **Step 4: Add the npm script**

In `package.json`, beside the other `case:*` entries:

```json
"case:copy": "node scripts/authoring/copy-check.mjs",
```

- [ ] **Step 5: Run it and record the baseline**

Run: `npm run case:copy`
Expected: exit 1, and a table close to this (exact numbers may shift by a few as the walk covers more strings than the throwaway probe did):

```
  ✗ email-triage             19 violation(s)
  ✗ expense-approvals         4 violation(s)
  ✗ trial-signup-desk        36 violation(s)
  ✗ ops-request-desk         48 violation(s)
  ✗ low-stock-morning-post   66 violation(s)
  ✗ weather-commute-ping     81 violation(s)
```

- [ ] **Step 6: Confirm nothing else moved**

Run: `npm test && npm run typecheck`
Expected: 897 tests pass (the 16 new ones bring it to 913), typecheck clean. `validateProblem()` is untouched, so no case has become invalid.

- [ ] **Step 7: Commit**

```bash
npm run case:verify -- on-branch <current-branch>
git add packages/problem-schema/plainLanguage.ts packages/problem-schema/plainLanguage.test.ts \
        packages/problem-schema/index.ts scripts/authoring/copy-check.mjs package.json
git commit -m "Measure the copy a learner reads, before enforcing anything about it"
```

---

### Task 2: weather-commute-ping — replace the JavaScript-blob dropdowns

The worst defect and the one the user hit first: 8 option labels over 90 characters, the longest **296 characters of inline JavaScript ternary**, presented as a dropdown choice to a non-technical learner. This is a **design** fix, not a copy fix.

**Why it cannot be fixed by shortening the text:** a `valueOptions` label must be a real n8n expression, because `exportWorkflow.js` resolves the authored token back through `valueOptions` to that option's **label** and writes it into the workflow file. A prose label exports as a literal string into the message.

**The fix:** move the part that does not vary into a `locked` display row, and grade only the part that does. The learner is then choosing between short, comparable expressions, and the lookup table they need is on screen as context rather than inside every option.

**Files:**
- Modify: `packages/problems/weather-commute-ping/nodeSetup.js` (the `edit-fields` entry, and the `http-request` `url` field)
- Test: `npm run case:copy -- weather-commute-ping`, `npm run problem:check -- weather-commute-ping`, `npx vitest run packages/engine/exportWorkflow.test.js`

**Interfaces:**
- Consumes: `PLAIN_LANGUAGE.MAX_OPTION_LABEL_CHARS` (90) from Task 1.
- Produces: nothing other tasks read.

- [ ] **Step 1: See exactly what is over the cap**

Run: `npm run case:copy -- weather-commute-ping --verbose`
Expected: 8 `option` violations naming `edit-fields.fields.option` and `http-request.url.option`.

- [ ] **Step 2: Add the code table as a locked row**

In `nodeSetup['edit-fields']`, add to `locked` (create the array if absent) so the mapping the learner needs is visible without being inside every option:

```js
  locked: [
    { label: 'Mode', value: 'Manual Mapping' },
    { label: 'Include Other Input Fields', value: 'On' },
    // The lookup itself is CONTEXT, not a choice. It used to live inside each
    // valueOptions label, which is how one option reached 296 characters of inline
    // JavaScript: a dropdown a non-technical learner cannot read, let alone compare.
    // Shown here, the graded choice shrinks to the part that actually varies.
    { label: 'Words for each code (given)', value: 'codeWords = { 0: clear skies, 1-3: cloud, 61-65: rain }' },
  ],
```

- [ ] **Step 3: Rewrite the four `weather_line` value options against the locked table**

Replace the `valueOptions` entries for `weather_line` so each is under 90 characters. Keep the same four *decisions* (mapped vs bare vs raw), and keep every `correct` flag and misconception code exactly as it is:

```js
        valueOptions: [
          {
            value: 'line.raw',
            label: '{{ $json.current.temperature_2m }}C, code {{ $json.current.weather_code }}',
            correct: false,
            why: 'This leaves the integer in the message. Turning the code into words is this flow\'s job, not his.',
          },
          {
            value: 'line.bare',
            label: '{{ $json.current.temperature_2m }}C, {{ codeWords[$json.current.weather_code] }}',
            correct: false,
            why: 'Right shape, and it reads well on the mornings in the table. On a code the table does not list it says "undefined", and nothing warns you.',
          },
          {
            value: 'line.mapped',
            label: '{{ $json.current.temperature_2m }}C, {{ codeWords[$json.current.weather_code] || "unusual conditions" }}',
            correct: true,
            why: 'This is the one. A lookup table is a list of the cases you thought of, so it needs an answer for the ones you did not.',
          },
        ],
```

Note the `||` arm is what makes `line.mapped` correct, and it is now visible at a glance instead of buried 200 characters into a ternary. `codeWords` is the name shown in the locked row, so the expression reads against something on screen.

- [ ] **Step 4: Rewrite the `commute_note` value options the same way**

```js
        valueOptions: [
          {
            value: 'note.codeOnly',
            label: '{{ noteForCode[$json.current.weather_code] }}',
            correct: false,
            why: 'The code alone cannot decide this. A clear sky at 38C is not the same commute as a clear sky at 24C.',
          },
          {
            value: 'note.bare',
            label: '{{ $json.current.temperature_2m >= 35 ? "Extreme heat. Carry water." : noteForCode[$json.current.weather_code] }}',
            correct: false,
            why: 'The heat is handled, the gap is not. On a code the table does not list, the note comes out empty.',
          },
          {
            value: 'note.mapped',
            label: '{{ $json.current.temperature_2m >= 35 ? "Extreme heat. Carry water." : (noteForCode[$json.current.weather_code] || "Check the forecast.") }}',
            correct: true,
            why: 'Both halves. The temperature can override the code, and an unlisted code still produces a sentence he can act on.',
          },
        ],
```

`note.mapped` is 143 characters, still over the 90 cap. Add a second locked row so the ternary's first arm becomes context too, and shorten to:

```js
    { label: 'Heat rule (given)', value: 'hot = temperature at or above 35C' },
```

```js
            label: '{{ hot ? "Extreme heat. Carry water." : (noteForCode[$json.current.weather_code] || "Check the forecast.") }}',
```

Measure each label with `npm run case:copy -- weather-commute-ping` and keep shortening the *given* parts, never the graded part, until it reports 0 option violations.

- [ ] **Step 5: Shorten the three `url` options**

The graded decision is which endpoint is asked for, and the distinguishing part is the tail. Move the host and coordinates into a locked row:

```js
    { label: 'Base address (given)', value: 'https://api.open-meteo.com/v1/ + latitude=12.97, longitude=77.59' },
```

and reduce each option to the part that differs, for example `forecast?current=temperature_2m,weather_code,precipitation`, `archive?start_date=...`, `forecast` with no parameters. Keep which one is `correct` unchanged.

- [ ] **Step 6: Confirm the answer key did not move**

Run: `npm run problem:check -- weather-commute-ping`
Expected: still `20 scored decisions {"understand":4,"placement":4,"config":9,"stress":3}` reading as easy, and `structure valid`. If the decision count moved, a `valueOptions` entry was added or dropped — undo that.

- [ ] **Step 7: Confirm the workflow still exports something real**

Run: `npm run workflows:generate -- weather-commute-ping && npx vitest run packages/engine/exportWorkflow.test.js`
Expected: tests pass. Then **read** `packages/problems/weather-commute-ping/workflow.n8n.json` and confirm the Edit Fields node's two assignment values are the shortened expressions. A clean export is not proof it would run: `codeWords`, `noteForCode` and `hot` are names this case invents, so note in the commit message that the exported file needs the learner to define them in a real n8n Set node before it runs, and that this is the same tradeoff the case already makes by teaching a lookup table.

- [ ] **Step 8: Run the gate and commit**

```bash
npm run case:copy -- weather-commute-ping   # option violations must be 0
npm test && npm run typecheck
npm run case:verify -- on-branch <current-branch>
git add packages/problems/weather-commute-ping
git commit -m "weather-commute-ping: stop asking a learner to compare 296 characters of JavaScript

A valueOptions label has to be a real n8n expression, because the exporter writes
the label into the workflow file. So the lookup table grew inside every option and
the longest reached 296 characters, truncated mid-token in a 420px control. The
table and the heat rule are now locked context rows, and the graded choice is the
part that varies: whether the lookup has an arm for a code it does not list."
```

---

### Task 3: weather-commute-ping — statement, sentences and dashes

73 remaining violations: a 270-word statement (7 statement-level issues), 36 sentences over 25 words, 30 dashes.

**Files:**
- Modify: `packages/problems/weather-commute-ping/meta.js`, `dissection.js`, `build.js`, `probes.js`, `cases.js`, `nodeSetup.js`
- Test: `npm run case:copy -- weather-commute-ping`

**Interfaces:** consumes Task 1's CLI. Produces nothing.

- [ ] **Step 1: Rewrite the statement to under 150 words**

The current one is 270 words in 15 sentences. Cut it to about 90. What must survive: the daily repetition, that the service answers with numbers not sentences, the three code groups **and** that they are only the common ones, that the message has two halves, and that temperature can override the code. What must go: the underpass, the shoe, the restatement of "the decision never changes shape", and every dash.

Target shape (write your own words; this is the register, not the text):

```js
export const statement =
  'Sudhanva checks a weather app every morning before he leaves for work. Same lookup, same decision, every day: is this a normal commute, or one to plan around?\n\n' +
  'At 9:00 each morning the flow should ask a forecast service for Bangalore\'s conditions and post one short message to Slack. He reads it on his way out.\n\n' +
  'The service answers with numbers, not sentences: a temperature, and conditions as a WMO weather code. 0 is a clear sky, 1 to 3 are cloud, 61 to 65 are rain. Those are the codes he sees most mornings.\n\n' +
  'The message needs two halves. One states the conditions in words with the temperature. The other says what today\'s commute needs, and that does not follow from the code alone: a clear sky at 38C is a different commute from a clear sky at 24C.';
```

- [ ] **Step 2: Check the voice line that points into the statement**

`voice.js` `verify_fail:schedule` variant 1 says the time is "in the second paragraph". Confirm 9:00 is still in paragraph two after your rewrite.

Run: `node -e "import('./packages/problems/weather-commute-ping/index.js').then(m=>console.log(Object.values(m).find(v=>v&&v.statement).statement.split('\n\n')[1]))"`
Expected: the paragraph containing "9:00". If your rewrite moved it, either restore the order or fix that one voice line — and if you fix the voice line, say so in the commit, because it changes a clip fingerprint and costs a re-render.

- [ ] **Step 3: Fix the remaining long sentences and every dash**

Run: `npm run case:copy -- weather-commute-ping --verbose`

Work the list top to bottom. For each dash, use a full stop, a comma or a colon. For each long sentence, split it at the conjunction that is doing the joining. **Do not change which option is correct, and do not make a distractor true.** The `why`, `explanation` and `response` strings keep their length; only their sentences and dashes change.

- [ ] **Step 4: Verify the case is clean and the grading did not move**

```bash
npm run case:copy -- weather-commute-ping     # expect: clean
npm run problem:check -- weather-commute-ping  # expect: 20 decisions {4,4,9,3}, structure valid
npm run case:audit -- weather-commute-ping     # expect: no mechanical defects
npm test && npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
npm run case:verify -- on-branch <current-branch>
git add packages/problems/weather-commute-ping
git commit -m "weather-commute-ping: 270 words to under 150, and no dashes anywhere"
```

---

### Task 4: low-stock-morning-post

66 violations: a 250-word statement with a **56-word sentence** (the longest in the repo), 30 long sentences, 29 dashes.

**Files:**
- Modify: `packages/problems/low-stock-morning-post/{meta,dissection,build,probes,cases,nodeSetup}.js`
- Test: `npm run case:copy -- low-stock-morning-post`

**Interfaces:** consumes Task 1's CLI.

- [ ] **Step 1: List the violations**

Run: `npm run case:copy -- low-stock-morning-post --verbose`

- [ ] **Step 2: Cut the statement to under 150 words**

Currently 250 words, 9 sentences, average 27.8 words per sentence. What must survive: the daily 07:30 sweep, that stock lives in one sheet with one row per bean per location, that each row has its **own** reorder level so small numbers are not the test, and that the shortlist goes to `#supply-chain` as one post. Cut the café names, the column list, and the two named beans; those are detail the nodes that grade them can carry.

- [ ] **Step 3: Split every sentence over 25 words, remove every dash**

Its `explanation` strings are the case's teaching and its spec asks to keep one paragraph verbatim in substance. Keep the substance; split the sentences.

- [ ] **Step 4: Verify**

```bash
npm run case:copy -- low-stock-morning-post    # expect: clean
npm run problem:check -- low-stock-morning-post # decision count must not move
npm run case:audit -- low-stock-morning-post
npm test && npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
npm run case:verify -- on-branch <current-branch>
git add packages/problems/low-stock-morning-post
git commit -m "low-stock-morning-post: shorter sentences, no dashes, half the statement"
```

---

### Task 5: ops-request-desk

48 violations: 193-word statement, 23 long sentences, 19 dashes.

**Files:**
- Modify: `packages/problems/ops-request-desk/{meta,dissection,build,probes,cases,nodeSetup}.js`
- Test: `npm run case:copy -- ops-request-desk`

- [ ] **Step 1: List the violations**

Run: `npm run case:copy -- ops-request-desk --verbose`

- [ ] **Step 2: Cut the statement to under 150 words, split long sentences, remove dashes**

This case has seven nodes and three ways out, so its statement carries more than the others legitimately. Keep every fact a graded decision depends on. Cut restatement and scene-setting.

- [ ] **Step 3: Verify**

```bash
npm run case:copy -- ops-request-desk
npm run problem:check -- ops-request-desk
npm run case:audit -- ops-request-desk
npm test && npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
npm run case:verify -- on-branch <current-branch>
git add packages/problems/ops-request-desk
git commit -m "ops-request-desk: plain-language pass"
```

---

### Task 6: trial-signup-desk

36 violations: 201-word statement, 13 long sentences, 17 dashes.

**Files:**
- Modify: `packages/problems/trial-signup-desk/{meta,dissection,build,probes,cases,nodeSetup}.js`
- Test: `npm run case:copy -- trial-signup-desk`

- [ ] **Step 1: List the violations**

Run: `npm run case:copy -- trial-signup-desk --verbose`

- [ ] **Step 2: Cut the statement to under 150 words, split long sentences, remove dashes**

This is the catalogue's other `easy` case, so its copy should read easiest of all. One of its option labels is 82 characters (`Hi {{ $json["Full Name"] || "there" }}, ...`) and under the 90 cap, so it needs no change.

- [ ] **Step 3: Verify**

```bash
npm run case:copy -- trial-signup-desk
npm run problem:check -- trial-signup-desk
npm run case:audit -- trial-signup-desk
npm test && npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
npm run case:verify -- on-branch <current-branch>
git add packages/problems/trial-signup-desk
git commit -m "trial-signup-desk: plain-language pass"
```

---

### Task 7: email-triage and expense-approvals

The two mildest: email-triage has 19 violations (17 of them dashes, 0 long sentences, because a human wrote its statement) and expense-approvals has 4. Both in one task because neither needs a statement rewrite: email-triage's is 43 words and expense-approvals' is 95.

**Files:**
- Modify: `packages/problems/email-triage/{dissection,build,probes,cases,nodeSetup}.js`, `packages/problems/expense-approvals/{...}.js`
- Test: `npm run case:copy -- email-triage`, `npm run case:copy -- expense-approvals`

- [ ] **Step 1: List both**

```bash
npm run case:copy -- email-triage --verbose
npm run case:copy -- expense-approvals --verbose
```

- [ ] **Step 2: Remove the dashes and split any long sentence**

email-triage's statement is the reference register for the whole catalogue. Do not rewrite it; only remove its dashes.

- [ ] **Step 3: Watch the snapshot**

email-triage has `assembled.snapshot.json` plus `index.test.js` asserting the assembled object still deep-equals what the single-file version produced. Editing its copy **will** fail that test. That is the snapshot doing its job. Update it:

Run: `npx vitest run packages/problems/email-triage -u`
Then read the snapshot diff and confirm every change is a copy change you intended, and that no `correct`, `correctIndex` or `correctType` moved.

- [ ] **Step 4: Verify**

```bash
npm run case:copy -- email-triage
npm run case:copy -- expense-approvals
npm run problem:check -- email-triage
npm run problem:check -- expense-approvals
npm test && npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
npm run case:verify -- on-branch <current-branch>
git add packages/problems
git commit -m "email-triage, expense-approvals: remove the dashes"
```

---

### Task 8: Enforce it, and tell every agent that writes copy

All six cases are clean, so enforcement can flip on without turning anything red. This is also where the rule reaches the three places agents read it, in the same commit, so the documentation cannot lag the check.

**Files:**
- Modify: `packages/problem-schema/validateProblem.ts`
- Modify: `.claude/skills/authoring-a-problem/SKILL.md`
- Modify: `docs/case-authoring/TEMPLATE.md`
- Modify: `packages/llm/authoringPrompt.ts`
- Modify: `packages/llm/authoringPrompt.test.ts`
- Modify: `.claude/agents/case-author.md`
- Test: `packages/problem-schema/validateProblem.test.ts`, `packages/llm/authoringPrompt.test.ts`

**Interfaces:**
- Consumes: everything Task 1 produced.
- Produces: `validateProblem()` issues at `level: 'error'` for statement length, sentence length, dashes and option labels.

- [ ] **Step 1: Write the failing test**

Add to `packages/problem-schema/validateProblem.test.ts`:

```ts
it('rejects a dash in learner-facing copy, not only in narration', () => {
  // validateProblem has warned on dashes in VOICE copy since the beginning. It never
  // looked at written copy, which is how five cases accumulated 114 of them.
  const p = structuredClone(validProblem());
  p.statement = 'A clock starts it — every morning. It posts one line.';
  const { issues, valid } = validateProblem(p);
  expect(valid).toBe(false);
  expect(issues.some((i) => i.level === 'error' && /dash/.test(i.message))).toBe(true);
});

it('rejects a statement past the word cap', () => {
  const p = structuredClone(validProblem());
  p.statement = Array.from({ length: 40 }, () => 'One more short sentence here.').join(' ');
  const { issues } = validateProblem(p);
  expect(issues.some((i) => i.level === 'error' && /keep it under 150/i.test(i.message))).toBe(true);
});

it('rejects an option label too long to read on one line', () => {
  const p = structuredClone(validProblem());
  const node = Object.keys(p.nodeSetup)[0];
  p.nodeSetup[node].fields[0].options[0].label = 'x'.repeat(120);
  const { issues } = validateProblem(p);
  expect(issues.some((i) => i.level === 'error' && /one line/.test(i.message))).toBe(true);
});
```

Use whatever fixture builder that file already uses instead of `validProblem()` if the name differs; read the file first.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run packages/problem-schema/validateProblem.test.ts`
Expected: the three new tests FAIL (no such errors are produced yet).

- [ ] **Step 3: Wire the rules into `validateProblem()`**

Import at the top:

```ts
import { statementIssues, longSentences, dashIssues, optionLabelIssues } from './plainLanguage.ts';
```

Then, after the existing checks and using the file's own `err()` helper (defined near line 68), walk the same surfaces `copy-check.mjs` walks and raise each as an error. Keep the voice dash warning where it is; it is the same rule one level softer, and narration is generated copy that a re-render has to follow.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run packages/problem-schema/validateProblem.test.ts`
Expected: PASS.

- [ ] **Step 5: Confirm all six real cases still validate**

Run: `npm test`
Expected: 913+ tests pass, including `registry.test.js`'s "validates with no errors or warnings" for all six cases. **If any case fails here, the copy tasks are not actually finished** — fix the copy, not the rule.

- [ ] **Step 6: Write the standard into the authoring skill**

In `.claude/skills/authoring-a-problem/SKILL.md`, in the copy-rules section, add the standard with its numbers and its reason. State plainly: ASD-STE100 sentence limits, Zinsser's four principles, dashes banned outright, `statement` under 150 words and 9 sentences, option labels under 90 characters, and that all four are `validateProblem()` errors rather than advice. Include the evidence, because a rule with a number attached is followed and a rule without one is not: the hand-written case is 43 words, the five agent-written ones came in at 95 to 270, and one option label reached 296 characters of JavaScript.

- [ ] **Step 7: Write it into the author-facing template**

In `docs/case-authoring/TEMPLATE.md`, add the same standard in the language a non-technical author needs: short sentences, one idea each, no dashes, and a worked before/after pair drawn from the real 270-word statement so they can see the difference rather than infer it.

- [ ] **Step 8: Update the drafting prompt and pin it**

`packages/llm/authoringPrompt.ts` is a **second copy of the authoring rules**, because the drafting model cannot read the skill file, and CLAUDE.md records it as the one document that can rot unnoticed. Add the four numbers to its numbered rule list. Then extend the existing `it('carries the copy limits a draft is validated against')` test in `packages/llm/authoringPrompt.test.ts` to assert the prompt mentions the sentence cap, the statement cap, the option cap, and the dash ban, importing the numbers from `PLAIN_LANGUAGE` so the prompt and the checker cannot disagree:

```ts
it('carries the plain-language limits, so a draft is not written to be rejected', () => {
  const prompt = buildAuthoringPrompt(sampleInput);
  expect(prompt).toContain(String(PLAIN_LANGUAGE.MAX_STATEMENT_WORDS));
  expect(prompt).toContain(String(PLAIN_LANGUAGE.MAX_SENTENCE_WORDS));
  expect(prompt).toContain(String(PLAIN_LANGUAGE.MAX_OPTION_LABEL_CHARS));
  expect(prompt.toLowerCase()).toMatch(/dash/);
});
```

- [ ] **Step 9: Point the case-author agent at it**

In `.claude/agents/case-author.md`, add the standard to the agent's own instructions and add `npm run case:copy -- <slug>` to the commands it must get clean before reporting. An agent that only learns the rule from a failing check writes the whole case first and then rewrites it.

- [ ] **Step 10: Re-seed, and prove the app serves the new copy**

```bash
npm run db:seed
npm run case:verify -- seeded weather-commute-ping
npm run case:verify -- servable x
```

Postgres serves the problems, so none of this reaches a learner until the seed runs.

- [ ] **Step 11: Full gate**

```bash
npm run case:copy            # all six clean
npm test && npm run typecheck
SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run smoke
```

Smoke matters here specifically because copy renders: a statement is drawn in the problem panel and on the sticky note, and an option label is drawn in a `<select>`.

- [ ] **Step 12: Commit**

```bash
npm run case:verify -- on-branch <current-branch>
git add packages/problem-schema packages/llm .claude docs
git commit -m "Make plain language a check, in every place that writes copy

Four rules, as validateProblem errors: ASD-STE100's 25-word sentence limit, a
150-word statement, option labels short enough to read on one line, and no em or
en dashes at all. The dash rule already existed for narration and never covered
written copy, which is how five cases accumulated 114 of them.

The numbers go in three places at once because agents read three different
copies of the authoring rules, and authoringPrompt.ts is the one CLAUDE.md warns
can rot unnoticed. Its test now imports the numbers rather than restating them."
```

---

## Self-Review

**1. Spec coverage.** ASD-STE100 sentence limits: Task 1 module, Task 8 enforcement. Zinsser: stated in the module doc, the skill, and the template. Dash ban: module, all six copy tasks, Task 8. Statement cap: module, Tasks 3 to 6, Task 8. Option cap: module, Task 2, Task 8. Three agent-read places: Task 8 steps 6, 7, 8, plus the agent file in step 9. All 254 violations: Tasks 2 to 7, one case per task, each verified to zero by `case:copy`. The dropdown redesign: Task 2. Gap found and closed while reviewing: Task 7 needs the email-triage snapshot update, which is now step 3.

**2. Placeholder scan.** No TBDs. Every code step carries real code. The two places I deliberately did not write final prose are the six statements themselves, because writing them is the task and I gave the register, the word budget, and the list of facts that must survive rather than a text to paste. Task 2 step 4 states that its own first attempt is still 143 characters and shows how to finish the job, rather than pretending one pass lands it.

**3. Type consistency.** `PlainLanguageIssue = { path, message }` is used consistently; the CLI reads `.path` and `.message` only. `validateProblem()`'s own issue shape adds `level`, which Task 8 supplies via `err()`. Function names match between the module, its exports in Task 1 step 2, the CLI, and Task 8 step 3.

**One judgement call worth flagging:** `MAX_STATEMENT_WORDS: 150` is above the 43-word reference case on purpose. 43 words works for email-triage because that case is one sentence of setup and one of instruction; a seven-node case like ops-request-desk cannot carry its graded facts in 43 words. 150 forces every case to less than half of the worst offender while leaving the complex ones room. If you want the catalogue tighter than that, the number is in one place.

---

Plan complete and saved to `docs/superpowers/plans/2026-08-13-plain-language-copy.md`. Two execution options:

**1. Subagent-Driven (recommended)** — a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session with checkpoints for review.

Which approach?
