# Case brief — Commute Weather Ping

> **RESOLVED AGAINST THE ENGINE — 2026-08-12.** The author's brief is preserved below. Every
> open question it flagged has been answered from the code and rewritten in §10 as a decision.
> **Build what §10 says**; it overrides any earlier reading of §3–§5. Four things changed
> materially:
>
> 1. **`http-request` mid-chain is fine, and precedented** — `trial-signup-desk` already runs
>    `form-trigger → http-request → google-sheets → gmail`. But it comes with one **mandatory**
>    obligation: this case must author `nodeSetup['http-request'].sampleOutput` with the
>    Open-Meteo response shape. `catalogEntry.output` for `http-request` is *another case's* FX
>    API response, so without an authored sample the Edit Fields node's Input pane shows a
>    payload none of its own graded options reference. See §10 Q2.
> 2. **The awkward case is BUILDABLE here, not deferred.** `low-stock-morning-post` had to move
>    its awkward row to Stress Testing because `filter`'s conditions are a `fixedCollection`.
>    This case's fallback lives in an **Edit Fields assignment value**, and `assignmentList` is a
>    gradeable field kind — so the unmapped-weather-code lesson is graded *in the build* and
>    asked again in Stress Testing. See §10 Q3.
> 3. **The decision budget is 20, and `easy` requires it.** `problem:check` reads ≤20 scored
>    decisions as `easy`; 21 reads as `moderate` and the authored label stops matching. §4a is
>    the exact per-node budget. Do not exceed it.
> 4. **Cover art hue changed.** The brief's dusty orange collides with
>    `low-stock-morning-post`'s deep amber / burnt orange. §8 now specifies violet-indigo. The
>    *motif* — a single upward-curving arc — survives, and no existing cover uses one.

---

## 1. Identity — **Required**

| Field | Your answer |
|---|---|
| **Case name** | Commute Weather Ping |
| **Slug** | `weather-commute-ping` |

---

## 2. The scenario — **Required**

**Who is drowning in what, and what should happen instead?**

> Sudhanva commutes across Bangalore to an office in Indiranagar. Every morning, already half
> out the door, he opens a weather app and re-derives the same two-second decision: is this a
> normal commute, or one to plan around — leave earlier for rain, carry water for the heat,
> reroute around the flooded underpass.
>
> What should happen instead: at 9:00 every morning the workflow asks a forecast service for
> today's Bangalore conditions by itself, turns the numbers into one plain line plus a one-line
> commute note, and posts it to the `#commute` Slack channel. He reads it, he does not look it up.

**Why would a human hate doing this by hand?**

> It is not hard, it is relentless — the same lookup, at the same time, every single morning,
> forever, for a decision whose *shape* never changes. And it is done in the worst possible
> conditions for care: standing up, one shoe on, in a hurry.

---

## 3. The shape of the flow — **Required**

**What starts it?**

> A schedule, firing once every day at 9:00 AM. Nothing arrives; nothing is submitted. The clock
> is the only trigger, and noticing that is the first thing the case teaches.

**Does the AI decide or produce anything?**

> **No AI, at all.** The forecast service answers with structured JSON — a temperature as a
> number and a condition as an integer WMO weather code. There is nothing unstructured to read
> and nothing ambiguous to judge. An AI step here would add cost, latency and the ability to
> invent a temperature, in exchange for nothing. Recognising that is a graded skill in this case,
> which is why two chat models and two AI nodes are listed as bait in §4.

**Does the flow split into different paths?**

> **Linear.** Four nodes, one chain, no `if`, no `switch`, no splitter of any kind. Different
> weather changes the *text of the message*, not where it goes — and that distinction is the
> second thing the case teaches.

**Where does it end up?**

> One place: a single Slack message in `#commute`.
>
> The author's original framing said "email **and** Slack". That is the "one exit feeding two
> nodes" shape the simulator cannot build, so it was cut to Slack only — deliberately, and
> recorded here rather than silently. If email is wanted it is a second case, not a second
> ending bolted onto this one.

### ⚠ Five shapes the simulator cannot build — checked

| Shape | Does this case do it? |
|---|---|
| One path that does two things | **No.** One ending: the Slack post. The email destination was cut for exactly this reason. |
| One exit feeding two nodes, or two exits feeding one | **No.** Straight chain of four nodes; each `+` leads to exactly one next node. |
| Catch-all / "everything else" exit | **No.** No splitter exists, so there is no exit to catch. |
| Same node twice, set up differently | **No.** Each of the four types appears exactly once. |
| Paths ending at different kinds of node | **N/A** — single path. |

---

## 4. The nodes — **Required**

**Nodes this case needs**, in the order they run:

> 1. `schedule` — fires once a day at 9:00 AM.
> 2. `http-request` — a plain `GET` to the Open-Meteo forecast API for fixed Bangalore
>    coordinates (`latitude=12.97`, `longitude=77.59`), asking for **current** conditions. No API
>    key, no auth, no body — which is the point: a beginner can call a real API without a
>    credential.
> 3. `edit-fields` — maps the raw response into the two fields the message is built from:
>    `weather_line` (the temperature and the condition in words) and `commute_note` (the one-line
>    advice). **The condition-code lookup lives here, and so does its fallback** — see §5.
> 4. `slack` — posts the two mapped fields to `#commute`.
>
> No AI step, therefore **no `*-chat-model` brain is needed anywhere.** If the canvas asks for
> one, something is wrong with the build, not with this brief.

**Tempting wrong nodes**

> - `webhook` — "weather updates *arrive*, surely." They do not; a forecast has to be pulled, and
>   nothing on the internet is going to POST Bangalore's temperature at you on request. This is
>   the same clock-versus-event confusion `low-stock-morning-post` opens with, met from the other
>   side: there, a learner reaches for the data source as the trigger; here, for a push endpoint.
> - `gmail` — the original framing said "email and Slack", so habit reaches for it. This case has
>   one destination, and adding a second is a shape the simulator cannot build.
> - `send-email` — the same instinct as `gmail`, one row lower in the picker.
> - `if` — "different weather is obviously a yes/no." True as a sentence, wrong as a node. `if`
>   splits the flow, and the "not raining" path would have nowhere to go. What varies here is the
>   *text*, not the destination.
> - `switch` — the same instinct with more branches: "sort the weather into categories." Same
>   answer: sorting into categories is what the code lookup inside `edit-fields` already does,
>   without needing four dead-end exits.
> - `text-classifier` — "an AI has to work out what kind of day it is." The API already answered
>   that, as an integer. Classifying an integer that already means "thunderstorm" is asking a
>   model to re-derive a fact you were handed.
> - `information-extractor` — "pull the temperature and the condition out of the response." It is
>   already JSON with named fields. Extraction is for prose.
> - `code` — "calling an API and parsing the response is programming." It is a URL in a box and
>   two rows in a mapping table. This learner is being shown that point-and-click reaches further
>   than they expect.
> - `filter` — "only send it if the weather actually matters." This case always sends; only the
>   note changes. A silent morning would be indistinguishable from a broken workflow.
> - `openai-chat-model` / `google-gemini-chat-model` — bait with no AI node to attach to. A
>   learner who reaches for a brain has not yet worked out this case has no thinking to do.

> **Note on branching nodes.** N/A — this flow uses no `if`, `switch`, `loop-over-items`,
> `compare-datasets` or `sentiment-analysis`.

---

## 4a. The decision budget — **binding**

> This section is deliberately **outside §4**. `case:spec-check` reads §4 as the node list and
> counts a type named in two list items as reuse, so the per-node config bullets below tripped
> `type-reused` on `slack` while sitting inside it. They are configuration detail, not a second
> node list. Nothing here changes which nodes the case uses.

`problem:check` reads ≤20 scored decisions as `easy`. The brief authors this case as `easy`, so
20 is a ceiling, not a target to beat. Author exactly this shape — it is the same distribution
the other `easy` case already carries, `{understand:4, placement:4, config:9, stress:3}`:

| Bucket | Count | What |
|---|---|---|
| understand (`dissection`) | **4** | One question per job in `flowSummary`, one per node. |
| placement | **4** | The four nodes in §4. |
| config | **9** | Schedule 1 · HTTP Request 2 + **1 graded setting** · Edit Fields 3 (the `assignmentList` is always exactly three scored items — count, names, values) · Slack 2. |
| stress (`evalQuestions`) | **3** | §7a names them. |

The graded config decisions, exactly:

- **Schedule Trigger** — `triggerAtHour`, correct `9`. Show the interval as a **locked** display
  row reading "Every Day"; nothing in the grading depends on it. (Per the engine note in Q5 of
  the low-stock spec: the schedule's weekday multiSelect sits inside a `fixedCollection` and is
  not gradeable. The hour is a flat field and is.)
- **HTTP Request** — `method` (`GET`, against `POST` / `PUT` bait) and `url` (the `current=`
  forecast endpoint, against a bait that asks for a 7-day archive and one that omits the
  parameters entirely and returns metadata only).
- **HTTP Request settings** — grade exactly one key, `retryOnFail`, correct `true`. A forecast
  service can blip, this runs once a day, and one silent retry costs nothing. **Do not grade
  `maxTries` or `waitBetweenTries`** — `validateProblem()` requires their parent `retryOnFail`
  to be graded at `true`, and adding either pushes the budget past 20.
- **Edit Fields** — one `assignmentList` keyed `fields`, with **two** assignments:
  `weather_line` and `commute_note`. Three scored items whatever the learner builds.
- **Slack** — the channel (`#commute`) and the message text (built from the two **mapped**
  fields, against a bait that reads the raw API field names straight through and one that
  hardcodes a sentence).

---

## 5. Examples to test it with — **Required**

Each input is what Open-Meteo answers at 9:00 AM.

| # | What arrives | Where it should go |
|---|---|---|
| 1 | `temperature_2m: 24`, `weather_code: 0` (clear sky) | One Slack post to `#commute`: **"24°C, clear skies. Easy commute."** |
| 2 | `temperature_2m: 19`, `weather_code: 61` (slight rain) | **"19°C, light rain. Grab an umbrella."** |
| 3 | `temperature_2m: 38`, `weather_code: 0` (clear sky) | **"38°C, clear skies. Extreme heat — carry water."** Same code as case 1, different note: the temperature and the condition are two independent inputs to the message, and a learner who maps only the code loses this. |

**The awkward one — Required.**

> **What arrives:** a perfectly valid response — `temperature_2m: 27`, `weather_code: 95`. A
> thunderstorm. The service did its job. But `95` is not one of the codes the learner's mapping
> covers, because the mapping was built from the three cases above: clear (`0`), cloudy (`1`–`3`),
> rain (`61`–`65`).
>
> **What should happen:** the message must still be a message. Not blank, not `undefined`, not a
> failed run. The mapping needs a fallback of its own — not a new node, a fallback **inside the
> assignment value** — so an unrecognised code still produces something a human can act on:
> **"27°C, unusual conditions (code 95). Check the forecast before you leave."**
>
> **Why this is the whole lesson.** The naive version looks perfect. Three happy-path examples
> pass, the run is green, the Slack message is well-formed — and then one morning it says
> `undefined` and he walks into a thunderstorm. Your mapping table will never be exhaustive,
> because the world has more cases than your examples did. Planning for the gap is not
> defensive-programming pedantry; it is the difference between a workflow you can stop watching
> and one you cannot.
>
> **This is graded in the build**, not only asked about — see §10 Q3. One of the `valueOptions`
> for `commute_note` carries the fallback; another is the bare lookup that yields nothing for an
> unmapped code, and that one gets a misconception code.

### How to write these as `sampleCases` — read before authoring §5

`sampleCaseSchema` still requires `from`, `subject`, `category` and `urgency`
(`LOW | MEDIUM | HIGH`) on every case, and the Run narration renders `{from}` and `{subject}`.
A scheduled pull has no sender, so fill them as **what the run is**, not as a fake person:

```js
{ id: 'clear-mild', from: 'Open-Meteo forecast', subject: 'Bangalore · 9:00 AM check',
  category: 'weather_clear', urgency: 'LOW', branch: null, reply: 'Posted to #commute' }
```

Two rules that follow from the engine, not from taste:

- **`branch: null` on every case.** There is no router, so nothing selects a branch, and
  `simulateAll` falls back to requiring every case to deliver — which is what we want.
  `case:audit` will warn `gap-case-undecidable`; that warning is correct and expected on a linear
  case, and `trial-signup-desk` carries it too. It is not a defect to fix.
- **Author all four cases above as sample cases, including the thunderstorm.** Unlike
  `low-stock-morning-post`'s awkward row, nothing here turns on *how many items* there are — one
  response in, one message out — so the engine can carry it. The thunderstorm case is the one
  whose `reply` proves the fallback fired.

---

## 6. Difficulty — *optional*

> `easy`. Four nodes, no branching, no AI, no credential to configure, and one genuinely
> interesting decision (the fallback). This is a small case on purpose: the catalogue has one
> `easy` entry and four `moderate` ones, and a learner arriving with no automation background
> needs somewhere to start that is not a seven-node router.

---

## 7. What learners get wrong — *optional but very valuable*

> **"Something has to arrive for a workflow to run."** Every automation they have seen begins
> with an event, so a workflow with nothing arriving feels broken, and they reach for `webhook`.
> Time is a legitimate event. Nothing is going to notify you of the weather.
>
> **"Different weather means different paths."** The strongest and most understandable mistake in
> the case. It is genuinely a branching *thought* — rain and heat are different situations — and
> it maps onto the wrong control. The test is: does the *destination* change? It does not. Only
> the sentence changes, and sentences are built in `edit-fields`, not routed by `if`. A learner
> who can say "`if` routes, mapping decides text" in their own words has the whole lesson.
>
> **"Calling an API means writing code."** Anyone with a little scripting background does not
> trust that a GET can be a form field. They reach for `code` and write fetch logic. `http-request`
> is one of the highest-leverage nodes in n8n precisely because it is not code.
>
> **"An AI should read the weather."** They have been taught the AI is the interesting part, so a
> flow with no model in it feels underpowered. Worth naming out loud: the skill being graded is
> knowing when *not* to reach for one. The response is already structured; there is nothing to
> interpret.
>
> **"My three examples worked, so the mapping is done."** The trap in §5, and the reason the case
> exists. Their happy paths all pass. Nothing tells them the table is incomplete — not the run,
> not the message, not Slack. They will discover it on the one morning it matters. Ask them what
> they believed.
>
> **"Blank output is a broken workflow."** The inverse of the above, and worth distinguishing: an
> unmapped code does not error, it produces *nothing*, and nothing is much harder to notice than
> a red run. This is the misconception behind the `filter` bait too — silence looks like success.

### 7a. The three Stress Testing questions — **binding**

The budget in §4a allows exactly three. Use these:

1. **The unmapped code, asked from the other side.** The workflow ran green every morning for
   three weeks, then one morning the Slack post read `27°C, . ` — temperature there, note blank.
   What happened, and where is the fix? (Correct: an unmapped weather code fell through a
   mapping with no fallback, and the fix is in `edit-fields`, not a new node and not the API.)
   Keep §5's "your mapping table will never be exhaustive" paragraph verbatim in the
   `explanation` — it is the lesson.
2. **The API is down.** Open-Meteo returns a `503` at 9:00 AM. With `retryOnFail` off, what does
   he see? (Correct: nothing at all — no post, no warning, and silence is indistinguishable from
   a clear day. This is what the graded setting buys, and it is also why "only send when the
   weather matters" is a bad instinct.)
3. **The `if` question.** A learner adds an `if` after `edit-fields` to separate rainy days from
   clear ones. Both paths post to `#commute`. What is wrong with it? (Correct: nothing *breaks* —
   which is the trap. It is two configurations of the same node to maintain, doubling the work
   every time the wording changes, in exchange for a distinction the message text already makes.
   A branch that ends in the same place as its sibling was never a branch.)

---

## 8. Cover art — *optional*

> **Cool violet-indigo into soft lilac colour field** — saturated indigo through periwinkle to a
> pale lilac, cool and high-key, not navy and not purple-black. Soft spray-paint grain. A single
> large soft-edged pale arc curving upward across the lower half, like a horizon line lifting —
> lightly soft-focus, one continuous sweep, nothing rising above it. Empty cool violet atmosphere
> filling the upper half. No sun, no rays, no clouds, no droplets, no chevrons, no sparkles, no
> bars, no text, no other symbols.
>
> **Why not the brief's dusty orange:** `low-stock-morning-post` is already deep amber into burnt
> orange, and `expense-approvals` is coral into peach. A third warm card makes the row look like
> a gradient rather than a set. The *motif* is kept exactly as the brief asked — an upward arc —
> and no existing cover uses one (taken: diagonal chevron, sparkles, lattice, fanning line,
> stacked bars).

---

## 9. Anything the narrator should or shouldn't say — *optional*

> **Vocabulary she should use, consistently:** "weather code" (never "condition id" or "status"),
> "the mapping", "the fallback", "9 AM", "`#commute`", "one line, every morning".
>
> **She should say, early:** that the forecast service answers with numbers and codes rather than
> sentences. That is not a spoiler — it is the fact the whole case rests on, and withholding it
> just makes the learner guess whether there is prose to interpret.
>
> **She must not give away:**
> - **which code is the awkward one.** Never say "thunderstorm", never say `95`, never say "watch
>   out for codes you have not mapped" before the mapping is configured. The learner has to
>   discover that the table has a hole. If she pre-warns them, the only interesting decision in
>   the case evaporates.
> - that `if` is the wrong answer, before they have chosen the node after `edit-fields`. Let them
>   reach for it and let the probe do the teaching.
> - whether the temperature or the code drives the note. Cases 1 and 3 share a code and differ in
>   temperature; that is theirs to notice.
>
> **Tone note:** when a learner reaches for `code` or an AI step, treat it as a reasonable
> instinct carried over from another kind of work rather than a silly mistake. Writing a fetch
> call *is* what you would do in Python, and saying so out loud is what makes the alternative
> land.

---

## 10. Open questions — RESOLVED against the engine, 2026-08-12

Read out of `simulate.js`, `catalog.js`, `types.ts`, `answerCheck.ts`, `ruleList.ts`,
`settingKeys.ts` and `problem-check.mjs` before authoring began. Each is now a decision.
**Build what these say.**

> **Q1 — Location. RESOLVED: fixed Bangalore, and do not grade the coordinates.**
> `latitude=12.97`, `longitude=77.59`, hardcoded in the `url`. Show them; do not make guessing a
> city's latitude a scored decision — it is trivia, not a workflow skill. The graded part of the
> `url` is whether it asks for **current conditions** rather than an archive or nothing at all.
>
> **Q2 — Is `http-request` safe mid-chain? RESOLVED: yes, precedented, with one obligation.**
> `trial-signup-desk` already places it mid-chain, and the exporter handles the real-n8n lineage
> problem for us — it rewrites any field the immediate predecessor does not produce into
> `$('That Node').item.json[...]`, which is the fix for the accumulate-versus-replace divergence.
> So author expressions in Judge's accumulating model, as every shipped case does, and do **not**
> hand-write `$('…')` anywhere.
>
> **The obligation, and it is not optional:** author
> **`nodeSetup['http-request'].sampleOutput`** with the Open-Meteo shape —
> `{ latitude, longitude, current: { time, temperature_2m, weather_code, precipitation } }`.
> `catalogEntry.output` is **one sample per type, shared by every case**, and the one on
> `http-request` today is `trial-signup-desk`'s currency-rate response. Leave it and the Edit
> Fields node's Input pane will show an FX payload on the exact screen teaching the learner to
> read the forecast — a documented, grading-relevant bug from a previous case, not a
> hypothetical. Walk the Input pane of **every node after** `http-request` and confirm each one
> shows fields its own graded options reference.
>
> **Q3 — Can the fallback be built and graded, or must it move to Stress Testing?**
> **RESOLVED: built AND asked.** This is the one place this case is luckier than
> `low-stock-morning-post`, whose awkward row had to move because `filter`'s conditions are a
> `fixedCollection` and `fixedCollection` is not a gradeable field kind. Here the fallback lives
> in an **Edit Fields assignment value**, and `assignmentList` *is* one of the eight gradeable
> kinds. So:
> - the `commute_note` assignment's `valueOptions` include the fallback-bearing expression
>   (`correct: true`) and a bare lookup that resolves to nothing for an unmapped code
>   (`correct: false`, **with a misconception code** — `validateProblem()` now rejects a wrong
>   option without one);
> - **and** it is Stress Testing question 1 in §7a, worded from the symptom rather than the
>   cause, so a learner who got the build right still has to explain *why*.
>
> A `valueOptions` **label must be a real n8n expression**, not prose: the exporter resolves each
> `expect.assignments` token back through `valueOptions` to that option's label and writes it into
> the workflow file. A prose label exports as a literal string.
>
> **Q4 — Which weather codes does the mapping cover? RESOLVED: three groups, and `95` is
> deliberately outside all of them.** Clear `0`; cloudy `1`–`3`; rain `61`–`65`. Thunderstorm
> `95`–`99` is **excluded on purpose** — it is the gap. If any later change widens the mapping,
> the awkward example needs a different unmapped code substituted in, but the *mechanism*
> (unmapped code → fallback text) is the case and must not change.
>
> **Q5 — Does the case need an API key? RESOLVED: no, and that is a feature.** Open-Meteo's
> forecast endpoint is open. `nodeSetup['http-request'].credential` should say so rather than
> being omitted silently — a learner who has been told every API needs a key should see the one
> that does not, named. It keeps the config surface small enough for `easy` and removes the one
> setup step most likely to strand a beginner.
>
> **Q6 — Does anything about this case duplicate `low-stock-morning-post`?**
> **RESOLVED: no, and the overlap is worth keeping.** Both are `schedule` → … → `slack` with no
> AI, and that is where it ends. That case reads a spreadsheet, filters rows and collapses many
> items into one — its lesson is per-item execution. This one calls an open API and maps a code
> to text — its lesson is that a mapping table has a hole in it. The shared skeleton is a feature
> at this point in the catalogue: the second time a learner meets a schedule it should feel
> familiar, and the *hard* part should be somewhere new.

---

## Pre-send checklist

- [x] Every **Required** section answered — §1, §2, §3, §4, §5 all filled.
- [x] Every node name checked against the catalog: `schedule`, `http-request`, `edit-fields`,
      `slack` (build set); `webhook`, `gmail`, `send-email`, `if`, `switch`, `text-classifier`,
      `information-extractor`, `code`, `filter`, `openai-chat-model`,
      `google-gemini-chat-model` (bait). All present and all canonical.
- [x] No name from the "Never use these names" table — no `trigger`, `action`, `parse`,
      `classify`, `summarize`, `chat-gemini`, `slack-message`, `notion-page`, `calendar-event`,
      `web-search`.
- [x] The awkward example is filled in and genuinely awkward — a valid response carrying a code
      the mapping does not cover, which fails silently rather than loudly.
- [x] No splitting node used, so no path needs an ending beyond the single Slack post.
- [x] Checked against all five impossible shapes in §3 — the "email *and* Slack" temptation was
      cut deliberately, and the cut is documented.
- [x] Everything the author was unsure about is written as a resolved decision in §10, not left
      as a guess.
- [x] Decision budget stated and binding (§4a): 20 total, `{understand:4, placement:4, config:9,
      stress:3}`, which is what makes the authored `easy` label true.
