# Case brief — Brightleaf Coffee Roasters, Low-Stock Morning Post

> **RESOLVED AGAINST THE ENGINE — 2026-08-07.** Every open question in §10 has been answered
> from the code and rewritten there as a decision. Build what §10 now says; it overrides any
> earlier reading of §3–§5. Three things changed materially:
>
> 1. **Q4 needed a platform fix, and it landed.** `google-sheets` was catalog category `action`,
>    and the Run walk ended at the first action node — so the specified chain narrated 3 of 5
>    nodes. A node's role now follows its configured operation, so a Sheets node set to **read**
>    is a step. The flow in §4 is buildable exactly as written. **The reference graph must carry
>    `values: { sheetOperation: 'read' }` on that node, and the operation must be a graded
>    field** — it is what decides whether the flow continues.
> 2. **The engine has no concept of item counts.** Not "the simulator does not model it" — there
>    is no items/rows/fan-out notion anywhere. So "eleven rows → one post, not eleven" **cannot
>    be a Run case.** It is the best question in the case and it belongs in Stress Testing.
> 3. **A sample case is message-shaped.** `sampleCaseSchema` requires `from`, `subject`,
>    `category` and `urgency` (`LOW|MEDIUM|HIGH`) on every case — the schema is still email-shaped.
>    See §5 for how to fill those honestly for a scheduled sweep.

---

## 1. Identity — **Required**

| Field | Your answer |
|---|---|
| **Case name** | Brightleaf Coffee Roasters — Low-Stock Morning Post |
| **Slug** | `low-stock-morning-post` |

---

## 2. The scenario — **Required**

**Who is drowning in what, and what should happen instead?**

> Brightleaf Coffee Roasters roasts in Pune and runs three cafés — Koregaon Park, Baner and
> Kalyani Nagar — plus the roastery itself. Green bean stock for all four locations lives in one
> Google Sheet, **"Bean Inventory 2026"**, tab **`Stock`**. It has one row per bean per location,
> about 40 rows. The columns are `bean`, `location`, `kg_on_hand`, `reorder_level`, `supplier`,
> `last_counted`.
>
> Every weekday morning Ritika, the roastery's ops coordinator, opens that sheet before the first
> roast and reads down it looking for any row where `kg_on_hand` has dropped below that row's
> `reorder_level`. Different beans have different reorder levels — the house Brazil moves fast and
> sits at 25 kg, a single-lot Ethiopia Guji sits at 6 kg — so she cannot just look for small
> numbers, she has to compare two columns on every line. She then types the shortlist into the
> `#supply-chain` Slack channel so the buyer can raise POs before the suppliers' 10 a.m. cut-off.
>
> What should happen instead: at 07:30 every weekday the workflow reads the whole `Stock` tab by
> itself, keeps only the rows that are below their own reorder level, and posts **one** message to
> `#supply-chain` listing them — bean, location, kg on hand, reorder level. Nobody opens the sheet.

**Why would a human hate doing this by hand?**

> It is 40 rows of two-column arithmetic, every single morning, and getting it *wrong* is invisible
> — nobody notices the line you skipped until a café runs out of Ethiopia Guji mid-service on a
> Saturday.

---

## 3. The shape of the flow — **Required**

**What starts it?**

> A schedule. 07:30 IST, Monday to Friday. Nothing arrives, nothing is submitted — the clock is the
> only trigger. This is deliberately different from a case where an event arrives, and I want the
> learner to have to notice that.

**Does the AI decide or produce anything?**

> **No AI.** Every decision in this flow is a numeric comparison between two columns that already
> exist in the sheet. Bringing a model in would add cost and non-determinism to a job that is
> `kg_on_hand < reorder_level`. Recognising that an AI step is *not* needed is one of the things
> this case is meant to teach, so `basic-llm-chain` is listed as bait in §4.

**Does the flow split into different paths?**

> **Linear.** No `if`, no `switch`, no splitting node anywhere. `filter` is used, and per the
> template's own note `filter` is not a splitter — rows that do not match are dropped, not routed.

**Where does it end up?**

> One place only: a single Slack message posted to the `#supply-chain` channel of the Brightleaf
> workspace. One post per run, not one post per low bean.
>
> I deliberately did **not** add "…and also append the shortlist to a Reorder Log sheet", even
> though a real ops team would want that, because of the "one path that does two things" rule
> below. If the pipeline wants a second destination it needs to be a second case, not a second
> ending here.

### ⚠ Five shapes the simulator cannot build — checked

| Shape | Does this case do it? |
|---|---|
| One path that does two things | **No.** One ending: the Slack post. The sheet append was cut for exactly this reason. |
| One exit feeding two nodes, or two exits feeding one | **No.** Straight chain of five nodes, each `+` leading to exactly one next node. |
| Catch-all / "everything else" exit | **No.** No splitter exists in this flow, so there is no exit to catch. |
| Same node twice, set up differently | **No.** `google-sheets` appears once (reading the `Stock` tab). `slack` appears once (posting to `#supply-chain`). Nothing is reused. |
| Paths ending at different kinds of node | **N/A** — single path. |

---

## 4. The nodes — **Required**

**Nodes this case needs**, in the order they run:

> 1. `schedule` — fires 07:30, Mon–Fri.
> 2. `google-sheets` — reads every row of the `Stock` tab of "Bean Inventory 2026". Used here as a
>    data source, which matches the template's own "Scheduled sync" shape (`schedule` → source app
>    → … → destination app).
> 3. `filter` — keeps a row when `kg_on_hand` is **strictly less than** that row's
>    `reorder_level`, **or** when `kg_on_hand` is blank / not a number (see §5, the awkward row).
>    Everything else is dropped.
> 4. `aggregate` — collapses the surviving rows into **one** item so the flow posts once. Without
>    it, n8n runs the Slack node once per item and the channel gets eleven messages on a bad
>    Monday. This node existing at all is the central lesson of the case.
> 5. `slack` — posts the aggregated list to `#supply-chain`.
>
> No AI step, therefore **no `*-chat-model` brain is required**. If the generator's canvas insists
> on one, that is a signal something is wrong with the build, not with this brief.

**Tempting wrong nodes**

> - `google-sheets-trigger` — "the sheet is where the data is, so the sheet should start it." It
>   fires when a row *changes*, which means the workflow would run every time a barista updates a
>   count, and never at all on a day nobody touches the sheet. The clock is the trigger; the sheet
>   is a step.
> - `if` — "low stock is a yes/no question, that's obviously an If." True as a sentence, wrong as a
>   node: `if` splits the flow into two paths and the "not low" path would have nowhere to go.
>   They want to *drop* rows, not route them.
> - `loop-over-items` — "there are 40 rows, so I need a loop." The single most common beginner
>   misconception in n8n: nodes already run once per item automatically. The loop node is for
>   batching, not for iteration.
> - `code` — "comparing two columns across forty rows is programming." It is one comparison
>   expressed in a picker. This learner is being taught that point-and-click is enough.
> - `split-out` — read the label "split one item into many" and matched it to the word *split*.
>   They have exactly the opposite problem: many items that need to become one.
> - `merge` — "I need to merge the rows into a single message." Merge combines two *streams* coming
>   from two different branches. There is only one stream here. `aggregate` is the one that
>   collapses many items into one.
> - `basic-llm-chain` — "an AI should write the standup message nicely." The message is a fixed
>   list of four fields. An LLM here buys nothing and can invent a bean.
> - `remove-duplicates` — "so the same bean doesn't get posted twice." Nothing is duplicated
>   within a run, and Ritika *wants* the full list again tomorrow — a bean that is still low on
>   Wednesday is still news on Wednesday. Suppressing it is the bug, not the feature.
> - `stop-and-error` — "if nothing is low, the run should fail." Nothing being low is the good day,
>   not the error case.
> - `openai-chat-model` / `google-gemini-chat-model` — offered as bait even though there is no AI
>   node to attach them to. A learner who reaches for a brain has not yet worked out that this case
>   has no thinking to do.

---

## 5. Examples to test it with — **Required**

Each "input" here is what the `Stock` tab looks like on the morning of the run.

| # | What arrives | Where it should go |
|---|---|---|
| 1 | Tuesday 07:30. Three rows are below their level: `Ethiopia Guji / Kalyani Nagar / 1.2 / 6`, `Brazil Cerrado Ho. / Roastery / 18 / 25`, `Decaf Colombia / Baner / 0 / 4`. The other 37 rows are fine. | **One** Slack post to `#supply-chain` listing those three lines with bean, location, kg on hand and reorder level. `Decaf Colombia` at 0 kg is included — zero is below four, not "missing". |
| 2 | Monday after a busy weekend. **Eleven** rows across all four locations are below their levels. | Still exactly **one** Slack post, with eleven lines in it. Not eleven posts. This is the row that catches a learner who skipped `aggregate`. |
| 3 | Thursday. `Kenya Nyeri AA / Baner` reads `kg_on_hand = 6`, `reorder_level = 6` — exactly at the line. Two other rows are genuinely below. | The Kenya row is **excluded**. The rule is *below* the reorder level, not *at or below* it; at exactly the reorder level you still have a full reorder's worth of runway. The post lists two lines. Whoever configures the filter has to choose `<` and not `<=`, and be able to say why. |
| 4 | Friday. Every one of the 40 rows is comfortably above its reorder level. Nothing qualifies. | See Q1 in §10 — I believe nothing is posted at all, and I want that silence itself to be a Stress Test question rather than a build requirement. |

**The awkward one — Required.**

> **What arrives:** Wednesday 07:30. The Friday stock count was done in a hurry, so the `Stock`
> tab has two rows that are not clean numbers:
>
> - `Ethiopia Guji / Koregaon Park` — `kg_on_hand` is **completely blank**. Nobody weighed it. Its
>   `reorder_level` is `6`.
> - `Sumatra Mandheling / Roastery` — someone typed **`8 kg`** into `kg_on_hand`, with the unit, so
>   the cell holds the text `"8 kg"` rather than the number `8`. Its `reorder_level` is `10`.
>
> Two other rows are ordinary, clearly-below-the-line matches.
>
> **What should happen to it:** both awkward rows must appear in the Slack post. Not because they
> are provably low, but because we cannot prove they are *fine*, and an uncounted bean is the one
> that runs out. So the correct filter is not one condition, it is "below its reorder level **or**
> the quantity is blank or not a number", and the post ends up with four lines — two normal, and
> two that the learner should mark as needing a physical count.
>
> **Why this is the whole lesson.** The naive filter — `kg_on_hand < reorder_level` and nothing
> else — silently swallows both rows. A blank compares as not-less-than; `"8 kg"` is text and
> either fails the comparison or errors depending on type validation. The workflow looks like it
> worked. The post looks right. And the one bean nobody counted is the one that disappears from
> view — which is precisely the failure Ritika was doing this by hand to avoid. A learner who
> builds the naive version gets a green run and a wrong answer, which is exactly the kind of
> mistake worth grading.
>
> **Uncertainty, flagged:** see Q2 in §10 — I do not know whether the simulator's `filter` node can
> express an OR group with an "is empty / is not a number" condition. If it cannot, the fallback is
> written there and the build should not stall on this.
>
> **RESOLVED (Q2): it cannot be graded, so this whole awkward case moves to Stress Testing.** The
> blank cell and the `"8 kg"` cell stay exactly as written — they are the best material in the
> brief — but they are asked about rather than built. Keep the reasoning above verbatim in the
> question's `explanation`; that paragraph is the lesson.

### How to write these as `sampleCases` — read before authoring §5

`sampleCaseSchema` still requires `from`, `subject`, `category` and `urgency`
(`LOW | MEDIUM | HIGH`) on every case, and the Run narration renders `{from}` and `{subject}`.
A scheduled sweep has no sender, so fill them as **what the run is**, not as a fake person:

```js
{ id: 'tuesday', from: 'Bean Inventory 2026', subject: 'Stock tab · Tuesday 07:30 sweep',
  category: 'low_stock', urgency: 'MEDIUM', branch: null, reply: 'Posted to #supply-chain' }
```

Two rules that follow from the engine, not from taste:

- **Only cases 1 and 3 become sample cases.** Case 2 (eleven rows → one post) and case 4 (nothing
  qualifies) both turn on *how many items* there are, and the engine has no item-count concept —
  authored as sample cases they would be indistinguishable from case 1 and would quietly assert
  something the Run never checks. Both are **Stress Testing questions**, and they are the two best
  ones in the case.
- **`branch: null` everywhere.** There is no router, so no case selects a branch; `simulateAll`
  falls back to requiring every case to deliver, which is what we want here.

---

## 6. Difficulty — *optional*

> `moderate`. Five nodes and no AI keeps the build short, but there are three real decisions in it:
> clock-vs-sheet as the trigger, `aggregate` vs forty Slack messages, and the filter condition that
> has to survive a blank cell. That is more than "easy" and well short of "difficult".

---

## 7. What learners get wrong — *optional but very valuable*

> **"The sheet should be the trigger."** They have internalised "something happens → workflow
> runs" from every other automation they have seen, so a workflow with nothing arriving feels
> broken. They pick `google-sheets-trigger`. What they have not yet grasped is that *time* is a
> legitimate event, and that a row-change trigger would fire dozens of times a day and never at
> 07:30 on a quiet Tuesday.
>
> **"Forty rows means I need a loop."** This is the misconception that costs beginners the most
> time in real n8n. They picture the data as a table sitting in a variable and reach for
> `loop-over-items` to walk it. n8n already runs every downstream node once per item — the loop
> node exists for a narrower job, batching. Nobody discovers this by reading; they discover it by
> being told after they reach for it.
>
> **"Slack posted forty times — what did I break?"** Nothing, and that is the point. This is the
> inverse of the loop mistake and it lands *after* the build runs, which makes it the most
> memorable moment in the case. The per-item default that saved them at the filter step is exactly
> what floods the channel at the Slack step. `aggregate` is the answer, but the learner has to feel
> the problem before the answer means anything.
>
> **"Below or equal is basically below."** They set `<=` because at the reorder level you are
> "getting low, right?" — reasonable instinct, wrong rule. The reorder level *is* the trigger point
> for ordering, so being at it means the system is working, not failing. Cheap to get wrong,
> genuinely worth arguing about.
>
> **"An empty cell counts as zero."** Deeply intuitive and completely wrong, and it is the trap in
> §5. Zero and blank look similar in a spreadsheet and mean opposite things: zero is *I counted and
> there is none*, blank is *I do not know*. A learner who assumes blank means zero will actually
> pass the awkward case by accident — but for the wrong reason — while a learner who assumes blank
> means "fine, skip it" will fail it. Both should be asked to say what they believed.
>
> **"An AI should write the message."** They have been taught that AI is the interesting part of
> automation, so a workflow with no model in it feels underpowered. Worth naming out loud: the
> skill being graded is knowing when *not* to use one.
>
> **"Filter and If are the same node with different names."** Both ask a true/false question, so
> they look interchangeable. The difference only shows up at build time — `if` leaves a second
> output hanging with nowhere to go. Being able to say "filter drops, if routes" in their own words
> is a real checkpoint.

---

## 8. Cover art — *optional*

> Deep amber / burnt orange, on a single motif: **three horizontal bars of decreasing length,
> stacked, the shortest at the bottom.** Flat, abstract, no cups, no beans, no sacks. It reads as a
> stock level draining, and it collides with none of the existing three (electric-blue chevron,
> coral sparkles, lime-green lattice) on either colour or shape.

---

## 9. Anything the narrator should or shouldn't say — *optional*

> **Vocabulary she should use, consistently:** "the 07:30 sweep", "reorder level" (never "minimum"
> or "threshold" — the sheet column is literally `reorder_level`), "kg on hand", "the shortlist",
> "`#supply-chain`", "one post, not forty".
>
> **She should say, early:** that n8n runs a node once for every item that reaches it, without
> being asked. This is not a spoiler — it is the fact the whole case is built on, and withholding
> it just makes the learner guess at mechanics rather than at design.
>
> **She must not give away:**
> - that `aggregate` exists, before the learner has chosen the node after `filter`. If they pick
>   `slack` straight after `filter`, let it run and let the channel flood — the flood *is* the
>   teaching. She comes in after.
> - that some rows have blank or text quantities, before the filter is configured. The awkward
>   Wednesday should surprise them. If she pre-warns "watch out for empty cells", the interesting
>   decision evaporates.
> - whether `<` or `<=` is correct at the boundary. Let them commit, then ask why.
>
> **Tone note:** when a learner reaches for `loop-over-items` or `code`, she should treat it as a
> reasonable instinct from another kind of programming rather than a silly mistake — both are what
> you would do in Python, and that is worth saying out loud.

---

## 10. Open questions — RESOLVED against the engine, 2026-08-07

These were read out of `simulate.js`, `catalog.js`, `types.ts`, `ruleList.ts` and `branchReach.js`
before authoring began. Each is now a decision, not a question. **Build what these say.**

> **Q1 — What happens when the filter passes zero rows? RESOLVED: not modellable, so ask it.**
> The engine has no item-count concept at all — `simulateCase` walks one abstract case and there
> is no items/rows/fan-out notion anywhere in it. So an empty result cannot be built, narrated or
> checked. Do exactly what the brief proposed: make it a **Stress Testing question**, worded as
> §10's original draft had it, with the intended answer "nothing lands, and she can't tell —
> silence is ambiguous". Do **not** author a sample case for it.
>
> **Q2 — Can `filter` express "A < B OR A is blank/not a number"? RESOLVED: no, so take the
> brief's own fallback.** The catalog models the real node faithfully — a `conditionsCombinator`
> (AND/OR) and a repeatable `conditions` group with `string:empty` / `string:notEmpty` operators —
> but that group is a `fixedCollection`, and **`fixedCollection` is not a gradeable field kind**.
> The eight kinds are `select · text · number · boolean · expression · resourceLocator · ruleList ·
> assignmentList`, and `ruleList` does not fit: every entry needs an `outputKey`, which a filter
> has no equivalent of. So build the filter as the **single** condition `kg_on_hand <
> reorder_level`, grade the operator (that is the `<` vs `<=` lesson, and it is a real decision),
> and move the **entire blank-cell story to Stress Testing**, as the brief instructed. Do **not**
> substitute a `code` node; the brief is explicit and it is right.
>
> **Q3 — Can a Slack body render an aggregated array? RESOLVED: as proposed.** Grade only that the
> learner mapped **the aggregated field** into the message rather than a single row's field.
> Formatting is not the skill under test.
>
> **Q4 — Is `google-sheets` usable as a mid-flow read? RESOLVED: yes, now.** It was not — it is
> category `action` and the Run walk returned `delivered` at the first action node, so the
> five-node chain narrated three nodes and reported success without ever reaching Slack. That is
> fixed at the platform level: a descriptor can declare `passthroughWhen`, and `google-sheets`
> declares `{ sheetOperation: ['read'] }`. Consequences for this case, all required:
> - the reference graph node carries **`values: { sheetOperation: 'read' }`** — the role follows
>   the *configured* operation and never a catalog default, so without this the reference build
>   truncates while the learner's own graph works;
> - **grade the operation as a real field** (Get Row(s) vs Append Row vs Update Row). It decides
>   whether the flow continues, so it is the most load-bearing dropdown in the case;
> - do **not** swap in `http-request`. It would walk, but Judge's expressions accumulate while
>   real n8n's HTTP Request replaces the item, and the authoring skill forbids it mid-chain.
>
> **Q5 — Which weekdays must `schedule` express? RESOLVED: grade the time, lock the weekdays.**
> The catalog does model weekdays (`rule.triggerAtDay`, a multiSelect), but like the filter's
> conditions it sits inside a `fixedCollection` and cannot be graded directly. Grade the hour and
> minute as flat fields; show "Monday to Friday" as a `locked` display row. Nothing in the grading
> depends on the weekday restriction, exactly as the brief allowed.


---

## Pre-send checklist

- [x] Every **Required** section answered — §1, §2, §3, §4, §5 all filled.
- [x] Every node name checked against §4's lists: `schedule`, `google-sheets`, `filter`,
      `aggregate`, `slack` (build set); `google-sheets-trigger`, `if`, `loop-over-items`, `code`,
      `split-out`, `merge`, `basic-llm-chain`, `remove-duplicates`, `stop-and-error`,
      `openai-chat-model`, `google-gemini-chat-model` (bait). All present in the menu.
- [x] No name from the "Never use these names" table — no `trigger`, `action`, `parse`, `classify`,
      `summarize`, `chat-gemini`, `slack-message`, `notion-page`, `calendar-event`, `web-search`.
- [x] The awkward example is filled in and is genuinely awkward — a blank cell and a `"8 kg"` text
      cell that a naive filter silently swallows.
- [x] No splitting node used, so no path needs an ending beyond the single Slack post.
- [x] Checked against all five impossible shapes in §3 — the "save it *and* email them" temptation
      was cut deliberately, and the cut is documented.
- [x] Everything I was unsure about is written as a question with a default (§10), not as a guess.
