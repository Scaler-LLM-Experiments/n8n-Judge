# Case brief — fill this in

You are designing one **challenge** for n8n Judge: a workflow a learner builds step by step
while being graded on every decision. Fill in every section marked **Required**. Where it says
*optional*, leave it blank and the pipeline will decide for you.

**Write prose, not code.** You never write JSON, and you never need to open the codebase. Pick
node names from the menu in §4 — that menu is the complete list of what exists.

When you are done, save this file and hand it over. An automated pipeline turns it into a real
graded challenge: the quiz, the canvas, the node settings, the test cases, the narration, the
cover art, and a downloadable n8n workflow file.

> **One thing to know before you start.** Judge *grades* learners, so a wrong answer in this brief
> becomes a learner being marked down for being right. If you are unsure about a detail, say so in
> the section rather than guessing — "I'm not sure whether X or Y is correct here" is genuinely
> more useful than a confident wrong answer.

---

## 0. How to write it — **read this first**

Everything you write here reaches a learner almost as you typed it. They are non-technical,
often reading in a second language, and deciding under a bit of pressure. So the brief is
written to two standards, and the pipeline **checks** them rather than hoping:

**Short sentences. One idea each. Maximum 25 words.** If a sentence has an "and" holding two
thoughts together, make it two sentences.

**No dashes. At all.** Not `—`, not `–`, not `--`. A full stop, a comma or a colon always does
the job. A dash is where a sentence goes to avoid ending, and it does not read aloud, so the
narrator cannot say it either. Write `0 to 23`, never `0 – 23`.

**Say the thing, then stop.** Cut any words that do not help the learner make the decision in
front of them. Detail that only matters later belongs later.

### The difference this makes

Both of these say the same thing. The first is real copy from a case before this rule existed.

> The service does not answer in sentences. It answers with numbers: the temperature in
> degrees, and the conditions as a WMO weather code, which is an integer. 0 is a clear sky,
> 1 to 3 are increasing cloud, and 61 to 65 are rain from light to heavy — those are the
> codes he sees most mornings. Turning those into something a person can read is this
> flow's job, not his.

> The service answers with numbers rather than sentences: a temperature, and the conditions
> as a WMO weather code. 0 is a clear sky, 1 to 3 are cloud, and 61 to 65 are rain. Those
> are the codes he sees most mornings.

Same facts, 40% fewer words, no dashes, nothing over 25 words. The second one a learner
actually reads.

### Why it is checked and not just asked for

One case in the catalogue was written by hand, and five by an AI before these limits existed.
The hand-written scenario is **43 words**. The five came in at 95, 193, 201, 250 and 270,
each longer than the one before, because nothing was counting. Every one of them passed
three rounds of review, because a reviewer checking whether a question is *correct* does not
notice that it is 270 words.

**You do not have to count anything.** Write naturally, keep sentences short, use no dashes,
and the pipeline will tell you if something is over. It is fixing your prose, not rejecting
your thinking.

---

## 1. Identity — **Required**

| Field | Your answer |
|---|---|
| **Case name** | |
| **Slug** | |

The **case name** is what a learner sees on the home page. Keep it concrete: "TerraTrek Gear —
Free-Trial Signup Desk", not "Automation Challenge 3".

The **slug** is the short id: lowercase letters, numbers and hyphens only, e.g.
`trial-signup-desk`. It is **permanent** — it becomes the folder name, the web address, and the
name of every audio file. Renaming it later means regenerating everything, so pick it once.

---

## 2. The scenario — **Required**

**Who is drowning in what, and what should happen instead?** Two or three paragraphs, written the
way you would explain the job to the learner. Name a real-feeling company and a real-feeling
problem — vague scenarios produce vague challenges.

>

**Why would a human hate doing this by hand?** One or two sentences. This is what makes a learner
care.

>

---

## 3. The shape of the flow — **Required**

**What starts it?** An email arriving, a form being submitted, a schedule ticking, a webhook
firing, a message in Slack…

>

**Does the AI decide or produce anything?** Say plainly what the AI step should do — sort things
into categories, pull structured details out of messy text, write a summary — or write **"no AI"**.
A case with no AI step is completely fine and often the better beginner challenge.

>

**Does the flow split into different paths?**

*If yes*, name each path and say what belongs in it:

| Path name | What lands here |
|---|---|
| | |
| | |

*If no*, write **"linear"** and delete the table above.

**Where does it end up?** Every path must finish somewhere real — an email sent, a row added, a
message posted, a page created. A path that leads nowhere will block the learner.

>

### ⚠ Five shapes the simulator cannot build — check your flow against these now

These are not preferences. Each one has forced a case to be redesigned *after* it was written,
because the answer only becomes obvious once someone tries to build it on the canvas.

| If your flow… | …it will not work |
|---|---|
| has **one path that does two things** ("save it *and* email them") | A path ends at its **first** action. The second never happens in the story. Split it into two paths that each do one thing, or drop one. |
| has **one exit feeding two nodes**, or **two exits feeding one node** | Impossible to build. Every node is added from a `+` on one specific exit, and there is no way to draw a wire between two nodes that already exist. |
| relies on a **catch-all / "everything else" exit** | There isn't one. Anything that matches no path is silently dropped. Instead: make "needs a human" an **ordinary named path**, and have the AI return it as one of its normal answers. |
| uses **the same node twice, set up differently** (two emails to different people) | Both copies share one set of questions and one answer key, so one of them gets graded wrong. Either give the two jobs different tools, or drop one. |
| has paths ending at **different kinds of node** | Fine — but say so explicitly here, so each exit gets scoped to its own destination. |

If your scenario genuinely needs one of the first four, **say so in your answer rather than
working around it**. A note here is cheap; discovering it after the case is written is not.

>

---

## 4. The nodes — **Required**

Pick from the lists below. **This is everything that exists** — if what you need is not here, say
so in your answer and the pipeline will tell us rather than substituting something wrong.

### Start with one of these (triggers)

| Use it when | Node names |
|---|---|
| A person fills in a form | `form-trigger` |
| Another system calls yours | `webhook` |
| It should run on a timer | `schedule` |
| An email arrives | `gmail-trigger` · `microsoft-outlook-trigger` · `email-trigger-imap` |
| Something happens in an app | `slack-trigger` · `google-sheets-trigger` · `google-drive-trigger` · `google-calendar-trigger` · `notion-trigger` · `github-trigger` · `stripe-trigger` · `telegram-trigger` · `microsoft-teams-trigger` |
| A database row changes | `postgres-trigger` |
| A feed updates | `rss-feed-trigger` |
| A file on disk changes | `local-file-trigger` |
| Someone chats with a bot | `chat-trigger` |
| Another workflow failed | `error-trigger` |
| Testing only | `manual` |

### Then shape the data (core steps)

| To do this | Node name |
|---|---|
| Rename / reshape / set fields | `edit-fields` · `rename-keys` |
| Drop items that don't qualify | `filter` |
| **Split into 2 paths** (yes/no) | `if` |
| **Split into many paths** (by category) | `switch` |
| Call an outside API | `http-request` · `graphql` |
| Combine two streams | `merge` |
| Sort, cap, or de-duplicate | `sort` · `limit` · `remove-duplicates` |
| Group many items into one | `aggregate` |
| Total / count / average a set of items | `summarize-items` |
| Split one item into many | `split-out` |
| Pause before continuing | `wait` |
| Handle dates | `date-time` |
| Read or make a file | `extract-from-file` · `convert-to-file` · `xml` · `read-write-file` · `compression` |
| Pull fields out of a web page | `html` |
| Convert to or from Markdown | `markdown` |
| Read a feed on demand | `rss-read` |
| Hash, sign or generate a value | `crypto` · `jwt` · `totp` |
| Store rows inside n8n itself | `data-table` |
| Loop over items in batches | `loop-over-items` |
| Compare two datasets | `compare-datasets` |
| Reply to the webhook caller | `respond-to-webhook` |
| Show the person a form mid-flow | `form` |
| Deliberately fail the run | `stop-and-error` |
| Do nothing (a deliberate dead end) | `noop` |
| Run another workflow | `execute-subworkflow` |
| Write custom JavaScript | `code` |

### Add AI, if the case needs it

| To do this | Node name |
|---|---|
| Sort text into categories you define | `text-classifier` |
| Send a prompt, get text back | `basic-llm-chain` |
| Pull structured fields out of messy text | `information-extractor` |
| Judge tone (positive / negative) | `sentiment-analysis` |
| Summarise something long | `summarization-chain` |
| Answer a question from supplied text | `question-answer-chain` |
| Check output against a policy | `guardrails` |
| Let the AI choose its own tools | `ai-agent` |

Any AI step also needs a brain attached. `google-gemini-chat-model` and `openai-chat-model` are
the two learners recognise, so make one of them the right answer — but the picker offers more, and
"which brain?" should be a real decision rather than a formality. Also available:
`anthropic-chat-model` · `azure-openai-chat-model` · `mistral-cloud-chat-model` ·
`groq-chat-model` · `deepseek-chat-model` · `ollama-chat-model` · `google-vertex-chat-model` ·
`aws-bedrock-chat-model` · `cohere-chat-model`

> **`guardrails` splits the flow** (pass / fail), so if you name it, §3 must say where both exits
> end up — same rule as `if` and `switch`.

**One AI step can do two jobs, and that is often the better case.** An extractor both *decides*
the route and *produces* the fields the destinations need. If your paths end at nodes that need
details — a spreadsheet row, an email body — say so here, because it changes which AI step is
right: a classifier hands back a label and nothing else, and the learner only discovers that
three nodes later with nothing to map.

### Finish with a real side effect (actions)

`gmail` · `send-email` · `microsoft-outlook` · `slack` · `microsoft-teams` · `discord` ·
`telegram` · `google-sheets` · `microsoft-excel` · `google-docs` · `google-drive` ·
`google-calendar` · `notion` · `dropbox` · `microsoft-onedrive` · `postgres` · `github` ·
`stripe` · `paypal` · `twilio` · `zoom` · `youtube` · `google-translate` · `openai` ·
`google-gemini`

### ⚠ Never use these names

They are old aliases kept only so existing challenges keep working. Using one produces a
worse challenge:

~~`trigger`~~ → use `gmail-trigger` · ~~`action`~~ → use `gmail` · ~~`parse`~~ → use
`edit-fields` · ~~`classify`~~ → use `text-classifier` · ~~`summarize`~~ → use
`basic-llm-chain` · ~~`chat-gemini`~~ → use `google-gemini-chat-model` ·
~~`slack-message`~~ → use `slack` · ~~`notion-page`~~ → use `notion` ·
~~`calendar-event`~~ → use `google-calendar` · ~~`web-search`~~ → use `http-request`

### What the simulator has but a case cannot use

The simulator registers 200 node types. The lists above are the ~120 a case can be built from.
The rest exist so the node library matches real n8n, and they are **not available to you**:

- **Everything that plugs into an AI Agent** — vector stores, embeddings, retrievers, document
  loaders, text splitters, memory, output parsers, rerankers and the `*-tool` nodes (about 53
  types). They only mean anything inside a retrieval-or-agent topology, which no case teaches yet
  and the Build stage cannot assemble.
- **Infrastructure triggers** — `n8n-trigger`, `sse-trigger`, `mcp-server-trigger`,
  `evaluation-trigger` and friends. They start a workflow from n8n's own plumbing, so there is no
  story a learner can follow.
- **Five deprecated descriptors and three deferred triggers**, kept for source parity only.

If your idea genuinely needs one of these, **say so in your answer instead of substituting
something close**. "This needs a vector store, which is not available" is a useful sentence; a
case quietly rebuilt on the wrong node teaches the wrong thing while passing every test.

The complete list, with what each node really does, is
[docs/node-library-catalog.md](../node-library-catalog.md) — you should not need it, and the
pipeline reads it for you.

### Common shapes, if you want a starting point

| Case shape | Node set |
|---|---|
| Form intake | `form-trigger` → `edit-fields` → `google-sheets` + `gmail` |
| Email triage | `gmail-trigger` → `text-classifier` → `switch` → `gmail` / `slack` / `notion` |
| Scheduled sync | `schedule` → source app → `remove-duplicates` → destination app |
| Incoming API | `webhook` → `if` → app action → `respond-to-webhook` |
| Messy text → records | `webhook` → `information-extractor` → `google-sheets` |
| File pipeline | `google-drive-trigger` → `extract-from-file` → `slack` |

### Your answer

**Nodes this case needs**, in the order they run:

>

**Tempting wrong nodes** *(strongly recommended — this is where the teaching happens)*

Name **5–10 nodes a beginner would plausibly reach for and be wrong about**, and say in one line
what they'd be thinking. These get added to the picker alongside the right ones, so the choice is
a real decision rather than clicking the only thing on offer. When a learner takes the bait the
node lands with a red pulse, Iris comes over and asks what they believed, and the node is removed.

Cover the AI brain too, if your case has one: several chat models get offered, and "which brain?"
should be a decision, not a formality.

A wrong pick costs an attempt on that step — it does not fail the case, and nobody is punished
for exploring.
 — nodes a learner might reach for by mistake. Each one
becomes a teaching moment, so this is a genuinely useful thing to fill in.

>

> **Note on the branching nodes.** `if`, `switch`, `loop-over-items`, `compare-datasets` and
> `sentiment-analysis` all split the flow into multiple outputs, and **every output must lead
> somewhere** or the learner gets stuck on a correct answer. If you name one of these, make sure
> §3 says where each path ends. `filter` is *not* a splitter — it drops what doesn't match.

---

## 5. Examples to test it with — **Required**

Three to five concrete examples. Write the input in the words it would really arrive in — real
names, real messiness — and say where it should end up.

| # | What arrives | Where it should go |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |

**The awkward one — Required.** Every good challenge has one input that doesn't fit neatly. This
is the most valuable row in the whole brief, because it is what the final quiz asks about.

*If your flow splits into paths:* describe an input that matches **none** of them.

*If your flow is linear:* describe an input that must still get through without breaking — a
blank required field, a missing value, a weird character, an empty result.

> What arrives, and what should happen to it:

---

## 6. Difficulty — *optional*

`easy` · `moderate` · `difficult` — or leave blank and the pipeline sizes it from how many
decisions the challenge actually contains.

>

---

## 7. What learners get wrong — *optional but very valuable*

The mistakes you would expect, and **why** someone would make them. This is the hardest thing for
an AI to invent and the thing that most improves the challenge — every wrong answer a learner can
pick needs a real misconception behind it.

>

---

## 8. Cover art — *optional*

Each challenge gets an abstract poster on its card. Give **a colour and one simple shape** — not a
scene. The existing ones are: electric blue with a soft diagonal chevron; coral with three
sparkles; lime-green with a loose lattice of squares. Pick a colour and motif nobody has used.

>

---

## 9. Anything the narrator should or shouldn't say — *optional*

A mentor character talks the learner through the whole challenge. She should name this case's own
vocabulary. Anything she must avoid giving away, or should be sure to mention?

>
