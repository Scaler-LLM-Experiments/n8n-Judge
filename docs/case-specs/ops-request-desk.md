# Case brief — filled in

> **Provenance.** This case is an adaptation of the existing agentic question
> *"Q3 (Agentic): OpsBuddy — Autonomous Operations Assistant."* OpsBuddy grades **which tools an
> agent chooses at runtime**; this simulator grades **structural decisions on a canvas**. Those are
> different things, so the scenario, vocabulary and least-privilege lesson were kept and the
> hub-and-spoke agent was replaced with an extract-then-route flow.

> **§10 was resolved against the engine on 2026-08-06, before authoring.** Three of the open
> questions came back *against* the original design, and §3/§4/§5/§7 below have been rewritten to
> match what the engine can actually express. The original four-outcome policy (`log` / `email` /
> `both` / `question`) is now a **three-outcome** policy (`log` / `email` / `needs_human`). The
> reasoning is recorded in §10 — read it before "restoring" anything, because each cut is a
> capability the simulator does not have, not a preference.

---

## 1. Identity — **Required**

| Field | Your answer |
|---|---|
| **Case name** | Fernwood Robotics — Ops Request Desk |
| **Slug** | `ops-request-desk` |

---

## 2. The scenario — **Required**

**Who is drowning in what, and what should happen instead?**

> Fernwood Robotics is a 50-person hardware startup that builds picking robots for warehouses.
> Priya Raghavan is its entire operations function. Everything that isn't engineering or sales
> lands on her: a distributor lead someone met at a trade show, a reminder that needs to go to a
> supplier, a piece of customer feedback worth keeping.
>
> These used to reach her as Slack DMs, hallway asks and sticky notes, so she built an internal
> form called **Ops Desk request**. It has three boxes: your name, your email, and one free-text
> box that just says *"What do you need?"* Anyone at Fernwood can fill it in.
>
> Almost everything that comes back through that box wants one of two things. Some requests want
> something **recorded** in her **Ops Log** spreadsheet. Some want an **email sent** to a named
> person. And a steady trickle is neither — questions about the desk itself, or things the desk
> simply cannot do — which need **a human**, not an automation.
> Right now Priya reads every submission, decides which it is, and then retypes the details into
> either the spreadsheet or Gmail. It is about forty-five minutes of her day.

**Why would a human hate doing this by hand?**

> The deciding takes two seconds; the retyping takes two minutes. It is pure transcription with no
> judgment in it, and by late afternoon Priya is transposing digits in email addresses and pasting
> a supplier's name into the wrong column.

---

## 3. The shape of the flow — **Required**

**What starts it?**

> A person fills in the internal **Ops Desk request** form. Three fields, all required:
> **Your name** (short text), **Your email** (email), and **What do you need?** (long text — this
> is where all the mess lives).

**Does the AI decide or produce anything?**

> Yes — one AI step reads the free-text box and pulls out four things at once:
>
> - **`request_type`** — exactly one of `log`, `email`, `needs_human`
> - **`subject_name`** — the person or thing the request is *about* (blank if none)
> - **`subject_email`** — the email address mentioned *inside the request* (blank if none)
> - **`detail`** — a one-line plain summary of what should be recorded, or what the email should say
>
> Note that it does two jobs in one call: it decides the route **and** produces the fields the
> spreadsheet and the email need. That is deliberate — see §7, misconception 1. It is the whole
> reason this is an **extractor** and not a classifier.

**Does the flow split into different paths?**

Yes — three exits.

| Path name | What lands here |
|---|---|
| **Log only** | `request_type = log`. Requests to save / record / add something to the Ops Log. |
| **Email only** | `request_type = email`. Requests to send / notify / email a named person. |
| **Needs a human** | `request_type = needs_human`. Questions about the desk, greetings, and anything the desk cannot do. No write, no outbound email. |

> **`needs_human` is a category the AI is instructed to return**, not a built-in catch-all port.
> The extractor's prompt must say so explicitly: *"if the request is not clearly a record-this or
> a send-this, return `needs_human`."* See §10 Q1 — the simulator's Switch has no fallback exit,
> so a request that matches no rule is silently dropped rather than routed anywhere.

**Where does it end up?**

> - **Log only** → a row appended to the **Ops Log** sheet. Nothing is emailed.
> - **Email only** → one email sent, **to the address found inside the request**, not to the person
>   who filled in the form. Nothing is written to the sheet.
> - **Needs a human** → a message posted to Fernwood's **`#ops-desk`** Slack channel containing the
>   requester's name and the raw text of their request, so Priya sees it. Nothing is written,
>   nothing is emailed.
>
> The **Ops Log** sheet has exactly six columns, and which source each one comes from is the point of
> the build:
>
> | Column | Comes from |
> |---|---|
> | `Requested By` | the **form** field "Your name" |
> | `Requester Email` | the **form** field "Your email" |
> | `Type` | the **AI**'s `request_type` |
> | `Subject Name` | the **AI**'s `subject_name` |
> | `Subject Email` | the **AI**'s `subject_email` |
> | `Detail` | the **AI**'s `detail` |
>
> Two of six columns come from the form and four from the AI. A learner who does not notice that
> split will map the requester into the subject columns. **This mapping is the case's richest
> config surface — author it as an `assignmentList` so the learner builds all six rows.**

---

## 4. The nodes — **Required**

### Your answer

**Nodes this case needs**, in the order they run — **seven, one instance each**:

> 1. **`form-trigger`** — the "Ops Desk request" form (Your name · Your email · What do you need?)
> 2. **`information-extractor`** — reads the free text, returns `request_type`, `subject_name`,
>    `subject_email`, `detail`
> 3. **`openai-chat-model`** — the brain attached to the `information-extractor` step
> 4. **`switch`** — routes on `request_type`, three named outputs
> 5. **`google-sheets`** — appends the row to the **Ops Log** sheet. Fed by **Log only**.
> 6. **`gmail`** — "Send the requested email". To = the AI's `subject_email`, body from `detail`.
>    Fed by **Email only**.
> 7. **`slack`** — "Flag for Priya", posting to `#ops-desk`. Fed by **Needs a human**.
>
> **Every branch ends at exactly one action node, and no node type appears twice.** Both of those
> are hard engine constraints, not style — see §10 Q2 and Q5. Do not add a second `gmail`, a second
> `google-sheets` or a second `slack`, and do not chain one action into another.

**Tempting wrong nodes** *(optional)*

> - **`text-classifier`** — the strongest wrong answer in the whole case. See §7.
> - **`filter`** — for the routing step, by a learner who thinks of it as "keep the log ones".
> - **`if`** — used twice in a row to fake three-way routing.
> - **`code`** — to do the field mapping into the sheet.
> - **`ai-agent`** — by anyone who has seen the OpsBuddy version of this scenario.
> - **`edit-fields`** — inserted between the extractor and the sheet, on the belief that fields must
>   be renamed before a Sheets node can accept them.
> - **`respond-to-webhook`** — mistakenly used to answer the requester, because "respond" sounds
>   like its job. There is no webhook in this flow.

---

## 5. Examples to test it with — **Required**

*(Adapted from the OpsBuddy dataset's ten requests.)*

| # | What arrives | Where it should go |
|---|---|---|
| 1 | **Your name:** Arjun Mehta · **Your email:** arjun@fernwoodrobotics.com · **What do you need?** "Log a new distributor lead — Riya Kapoor at Kapoor Automation, she's interested in the Pro plan. riya@kapoorautomation.in" | **Log only.** One Ops Log row: `Requested By` = Arjun Mehta, `Requester Email` = arjun@fernwoodrobotics.com, `Type` = log, `Subject Name` = Riya Kapoor, `Subject Email` = riya@kapoorautomation.in, `Detail` = distributor lead, interested in the Pro plan. **No email sent to anyone.** The apostrophe in "she's" and the em dash must survive into the `Detail` cell. |
| 2 | **Your name:** Deepa Iyer · **Your email:** deepa@fernwoodrobotics.com · **What do you need?** "Record feedback from Sean O'Brien: onboarding was smooth, the docs were thin, and the packaging was, frankly, excellent." | **Log only.** `Subject Name` = Sean O'Brien, `Subject Email` = blank, and the entire comma-heavy sentence lands inside the single `Detail` cell without splitting the row. The apostrophe in O'Brien must not break the cell. `Subject Email` being blank must not stop the row from being written. |
| 3 | **Your name:** Deepa Iyer · **Your email:** deepa@fernwoodrobotics.com · **What do you need?** "Email Riya Kapoor at riya@kapoorautomation.in and let her know the Pro plan quote is ready." | **Email only.** One email to riya@kapoorautomation.in — *not* to deepa@fernwoodrobotics.com. **This is the row that exposes the requester-versus-subject bug**, because the two addresses are at visibly different domains. Nothing written to the Ops Log. |
| 4 | **Your name:** Neha Bose · **Your email:** neha@fernwoodrobotics.com · **What do you need?** "Email alex@fernwoodrobotics.com and remind him the Q3 parts audit is due this Friday." | **Email only.** One email to alex@fernwoodrobotics.com, body from `Detail`. **Nothing written to the Ops Log.** Note that requester and recipient are both @fernwoodrobotics.com — a learner who wired the wrong one will *not* notice here, which is exactly why row 3 exists. Keep both rows; the contrast is the teaching. |
| 5 | **Your name:** Tom Alvarez · **Your email:** tom@fernwoodrobotics.com · **What do you need?** "What kinds of things can the ops desk actually do for me?" | **Needs a human.** One Slack message to `#ops-desk` naming Tom and quoting his question. **Nothing written to the Ops Log. No email to anyone.** This is the least-privilege row: the desk deliberately does *less* than it could. |

**The awkward one — Required.**

> **What arrives:** **Your name:** Arjun Mehta · **Your email:** arjun@fernwoodrobotics.com ·
> **What do you need?** *"Please delete Riya Kapoor's row from the Ops Log — she emailed this
> morning to say she isn't interested and wants her details removed."*
>
> **Why it is awkward:** every surface signal points the wrong way. It names the Ops Log, so it
> looks like `log`. It contains the word "emailed", so it looks like `email`. A careless read calls
> it one or the other — and calling it `log` would append a *second* Riya Kapoor row, the exact
> opposite of what was asked. It is a **deletion**, and this flow has no ability to delete anything.
>
> **What should happen to it:** the AI returns `needs_human`, the item leaves through that exit, and
> a message is posted to `#ops-desk` naming Arjun and quoting the request verbatim. **No row is
> written and no email is sent.** Priya handles it by hand.
>
> **Where this gets taught:** in **Stress Testing**, not at build time. The build phase cannot
> complete until every declared branch is wired (`allBranchesWired`), so a learner cannot leave the
> `needs_human` exit dangling even if they want to. The quiz is where to ask what happens to this
> request — and what would happen if the AI returned a type the Switch has no rule for.

---

## 6. Difficulty — *optional*

> `moderate`. Seven nodes, three exits, a six-column mapping split across two different sources,
> and one AI step doing two jobs. Harder than a linear trigger→AI→action case, easier than
> anything involving loops or merges.

---

## 7. What learners get wrong — *optional but very valuable*

> **1. Reaching for `text-classifier` instead of `information-extractor`.** The single most likely
> wrong answer, and the case's best decision. The task *sounds* like classification — "sort requests
> into three types" — and any learner who has done the email-triage challenge has "classifier, then
> switch" burned in as the routing pattern. The misconception is believing that **routing is the
> only job**. It isn't: the Ops Log needs `Subject Name`, `Subject Email` and `Detail` pulled out of
> that same sentence, and a classifier hands back a label and nothing else. Learners who pick it
> don't discover the problem at the classifier — they discover it at the Sheets step, with nothing
> to map into four of six columns. The lesson is to look at what the *destination* needs before
> choosing the AI step, not just at what the *decision* needs.
>
> **2. Dropping the `switch` after an `information-extractor`.** Comes from remembering
> "classifier + switch" as a single inseparable unit rather than as two nodes with separate reasons
> to exist. An extractor returns **one item carrying a field**, so a `switch` is genuinely required
> to turn that field into paths.
>
> **3. Putting the requester's address in the "Send the requested email" node's To field.** The most
> common real-world error in any form-to-email flow. The form literally asks for "Your email", so
> it's the most visible address on the canvas, and the learner has *just* mapped it into the
> `Requester Email` column, so it's warm in their hands. The address the email must actually go to
> is buried in free text and only exists *after* the extractor runs. The misconception is
> conflating "the person who asked" with "the person this concerns" — example 3 exposes it,
> example 4 hides it.
>
> **4. Assuming the AI can only ever return the types you listed.** Beginners treat an enum as a
> guarantee rather than an instruction. `needs_human` exists precisely because it isn't one. Worth a
> Stress Testing question: what happens to an item whose `request_type` matches no rule? (It is
> silently dropped — no error, no row, no message, nothing to notice.)
>
> **5. Using `filter` for the routing step.** `filter` is described as "drop items that don't
> qualify", and a learner who thinks of routing as *"keep the log ones, keep the email ones"*
> reaches straight for it. The misconception is that filtering and routing are the same operation
> seen from different angles. They aren't: `filter` has **one** output and deletes what doesn't
> match, so every non-log request would vanish rather than go somewhere else.
>
> **6. Faking three-way routing with two chained `if` nodes.** Comes from genuine unfamiliarity with
> `switch` rather than from a wrong belief, and it half-works — which is worse, because it produces
> a canvas that passes the easy examples.
>
> **7. Wiring the chat model to the `switch`, or to the `google-sheets` node, instead of to the
> `information-extractor`.** The misconception is reading the brain as *"the AI for this workflow"* —
> a global setting — rather than as a sub-node belonging to exactly one step. Learners who think
> this way often can't say which node the model is powering.
>
> **8. Appending a row on the needs-a-human path "so there's a record of the question".** Comes from
> a *virtue*, not an error — logging feels thorough and harmless. It is the least-privilege lesson:
> a step the task did not ask for is not free, it is a wrong row in someone's spreadsheet. Worth
> grading down, and worth the narrator explaining why rather than just marking it.
>
> **9. Reaching for `code` to do the column mapping.** The familiar one: the learner doesn't yet
> believe that point-and-click field mapping is *enough* for something as fiddly as six columns from
> two different sources, so they reach for JavaScript where they feel in control. Nothing here needs
> code.
>
> **10. Using `ai-agent`.** Specific to Fernwood's history: this scenario also exists as an agentic
> exercise where an AI agent picks its own tools. A learner who met that version first will build
> the hub-and-spoke shape here. Worth a narrator line distinguishing *"you decide the routes"* from
> *"the agent decides at runtime"* — they are different skills and this challenge teaches the first.

---

## 8. Cover art — *optional*

> **Amber** (warm mustard-amber on a charcoal ground), with **one simple three-pronged fork** — a
> single line entering from the left that splits into three, slightly off-centre. No arrows, no
> icons, no text. Not blue, not coral, not lime-green; and a fork rather than a chevron, sparkles
> or a lattice.

---

## 9. Anything the narrator should or shouldn't say — *optional*

> **Vocabulary she should use:** Fernwood Robotics · Priya · the **Ops Desk request** form · the
> **Ops Log** sheet · **request type** · the **`#ops-desk`** channel.
>
> **She should be sure to mention:**
> - That the Ops Log's six columns come from **two different places** — two from the form, four from
>   the AI — and that keeping those straight is most of the job.
> - That "the person who asked" and "the person this is about" are different people, and both have
>   email addresses.
> - Why the needs-a-human path deliberately does *less* than it could. Not just that it writes no
>   row, but that restraint is the point.
>
> **She must not give away:**
> - Which node is right in §7's misconception 1. The classifier-versus-extractor choice is the
>   challenge's best decision and she should let the learner walk into it. She can ask *"what does
>   the spreadsheet need that a label alone won't give you?"* once they've chosen wrongly.
> - That the awkward request is a deletion the desk cannot perform. She may say the desk "can't do
>   everything people will ask it for" — she must not say the word "delete" in connection with it.

---

## 10. Open questions — **RESOLVED 2026-08-06** (do not re-open without re-reading the code)

> **1. Does `switch` have a fallback / default output? — NO.**
> `simulateCase` (`packages/engine/simulate.js`) resolves a branch to an output index from
> `problem.branches`; an item matching nothing hits `switchNoMatch` and the walk dead-ends, and
> `simulateAll` excludes `branch: null` cases from the required set. There is no extra port, so an
> unmatched item cannot reach any node. **Resolution:** `needs_human` is a normal declared branch
> and an explicit category the extractor is told to return. The "unmatched items vanish silently"
> lesson moves to Stress Testing, where it can be asked instead of built.
>
> **2. Can the canvas represent one output feeding two nodes, or two outputs feeding one? — NO.**
> The editor has **no `onConnect` handler**. Nodes are only added through the picker
> (`N8nEditor.jsx`), and each add creates exactly one node plus exactly one edge to it, so a learner
> can never wire two existing nodes together. Fan-out and fan-in are unbuildable, not merely
> unnarratable. **Resolution:** the `both` outcome was removed. Chaining (`Sheets → Gmail`) was
> considered and rejected: `flow.next` is keyed by node *type*, so it would put an "add next" cue on
> every Sheets node and let a learner satisfy the same `requiredEdge` by chaining Gmail onto the
> **log** branch — a wrong build that passes.
>
> **3. Is `text-classifier` a splitting node here? — Not relevant to the build.** It is
> `category: 'core'` in the catalog and the intended build does not use it. It stays a palette
> distractor and the subject of misconception 1.
>
> **4. Can `information-extractor` be given a field constrained to a fixed set of values? — Yes,
> as authored data.** `request_type` is authored as a closed set of three values, and the Switch's
> rules are graded against exactly those.
>
> **5. Two `gmail` nodes with different configurations? — NO.**
> `nodeSetup` and `nodeProbes` are keyed by node **type**, not by instance (`answerCheck.ts` looks
> up `nodeSetup[type]`). Two Gmail nodes would share one NDV, one question and one answer key — so
> a "reply to the requester" node and a "email the subject" node would be graded identically, which
> teaches misconception 3 *backwards*. **Resolution:** one Gmail, one job (To = `subject_email`).
> The question path ends at Slack instead of at a second Gmail.
> *Note:* repeating a type is fine when the configuration is genuinely identical everywhere —
> email-triage uses three `action` instances that way. It is only *differing* configs that collide.
>
> **6. `slack` credentials / channel.** Available and used: `#ops-desk` is the `needs_human`
> destination.
>
> **7. Dropped on purpose:** the Ops Log has no `Date` column, to avoid grading a learner on a
> submission timestamp the `form-trigger` may not expose.
