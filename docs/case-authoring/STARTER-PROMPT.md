# Starter prompt — for authors writing a new case

**How this works.** You get two files: this one and `TEMPLATE.md`. Open Claude (or any AI
assistant), paste the prompt below, attach `TEMPLATE.md`, and have a conversation. At the end you
will have a filled-in brief. Send that file back and an automated pipeline builds the challenge.

You do **not** need to know n8n deeply, and you do **not** need access to the codebase. Everything
the AI needs is in the template.

Expect the conversation to take 20–40 minutes. It should feel like being interviewed, not like
filling in a form.

---

## Paste this into the AI, and attach TEMPLATE.md

```
I'm designing a training challenge for "n8n Judge" — a simulator that teaches
non-technical learners to build automation workflows in n8n, and grades every
decision they make along the way.

I've attached TEMPLATE.md. Your job is to interview me and fill it in.

## What the finished thing becomes

A learner walks through four screens:

  1. Understand  — a quiz asking which node does each job in the flow
  2. Build       — they assemble the workflow on a canvas, configuring each node
  3. Stress Test — questions about what happens at the edges
  4. Result      — a score, and if they do well, a downloadable real n8n workflow

Every one of those is generated from the brief you and I produce. So the brief is
the whole design.

## The rules you must hold me to

1. NODE NAMES COME FROM THE TEMPLATE, NOTHING ELSE. Section 4 lists every node
   that exists in this simulator. It is not a sample — it is the complete set.
   Do not suggest a node that isn't listed, even if it exists in real n8n, and do
   not invent plausible-sounding names. If I describe something the list can't do,
   tell me plainly and suggest the closest thing the list CAN do, or say the
   challenge may need a capability that doesn't exist yet. Never quietly
   substitute.

   Never use the aliases in the "Never use these names" table.

2. THE AWKWARD EXAMPLE IS THE MOST IMPORTANT PART. Section 5 asks for an input
   that doesn't fit neatly. Push me on this. A challenge whose examples all
   succeed has nothing interesting to test, and the final quiz is built from this
   row. If I skip it or give something trivial, ask again.

3. IF A NODE SPLITS THE FLOW, EVERY PATH NEEDS AN ENDING. `if`, `switch`,
   `loop-over-items`, `compare-datasets` and `sentiment-analysis` all create
   multiple outputs. If I use one, make me say where each path ends. A path that
   leads nowhere blocks the learner on a correct answer.

4. WRONG ANSWERS NEED REAL MISCONCEPTIONS. Section 7 is where the teaching lives.
   Ask me what someone would *plausibly* get wrong and WHY they'd think that. "A
   learner might pick the wrong node" is useless; "they'd reach for Code because
   they don't yet believe point-and-click mapping is enough" is gold.

5. DON'T LET ME BE VAGUE. This gets graded, so a fuzzy detail becomes a learner
   marked down unfairly. If I say "it sends a notification", ask where. If I say
   "the AI figures out the category", ask which categories exactly. Concrete
   company names, concrete field names, concrete messy inputs.

6. FLAG YOUR OWN UNCERTAINTY. If you're unsure whether something is correct,
   write that into the brief rather than guessing. "Unsure whether X or Y is the
   right node here" is more useful to the engineers than a confident mistake.

## How to run the conversation

Work through the template in order, but conversationally — ask me one or two
things at a time, not a wall of questions. After each section, show me what you'd
write and let me correct it.

Start by asking what real, boring, repetitive task I want to automate. Then help
me shape it into something a beginner could build in 15–30 minutes: usually one
trigger, one or two shaping steps, and one or two things that actually happen at
the end.

Along the way, tell me when a choice makes the challenge better or worse to
learn from. You know more about workflow design than I do — say so when I'm
making it needlessly complicated, or too trivial to be worth grading.

When we're done, output the complete filled-in TEMPLATE.md as one code block I
can copy, with every Required section answered and the optional ones either
filled or clearly left blank.
```

---

## What good looks like

Three challenges already exist. They are useful as a sense of scale:

| Challenge | Shape | Why it works |
|---|---|---|
| **Email triage** | email arrives → AI sorts into 3 categories → routes → 3 different replies | The awkward example is an email matching no category. Learners must predict where it goes. |
| **Expense approvals** | email arrives → AI reads the claim → routes by amount and policy → replies | The interesting decisions are about *thresholds*, not about which node. |
| **Free-trial signup desk** | form submitted → fetch today's exchange rate → log a row → welcome email | No AI at all. The whole lesson is which form field goes under which spreadsheet column. |

Two patterns worth copying from those:

- **Smaller is usually better.** The signup desk has four nodes and is the clearest of the three.
  Fifteen nodes does not make a better challenge, it makes a longer one.
- **The messiness is the lesson.** The signup desk's examples include a referral answer with
  commas and quotes in it, a name with an apostrophe, a blank field, and Japanese text — because
  the real skill is making sure those land in the right column instead of breaking the row.

## Before you send the file back

- [ ] Every **Required** section answered
- [ ] Every node name appears in §4's lists — check each one
- [ ] No name from the "Never use these names" table
- [ ] The **awkward example** in §5 is filled in and is genuinely awkward
- [ ] If you used a splitting node, §3 says where every path ends
- [ ] Anything you were unsure about is written down as a question, not a guess

Save as `<your-slug>.md` — e.g. `trial-signup-desk.md` — and send it over.
