# Iris's copy for email-triage: what to change, and how far

**Status:** proposal, awaiting go-ahead. Nothing here is implemented.
**Revision 2** — copy rewritten to sound spoken rather than printed. See *How it should
sound*.

---

## What I could actually read

`design.duolingo.com` is fully client-rendered, so the page body could not be fetched.
What follows comes from search results quoting the guidelines, **not** from reading the
page. Worth knowing before treating any of it as gospel.

| Quality | Their definition |
|---|---|
| **Expressive** | Simple words and phrases to convey big feelings. |
| **Playful** | Brings creativity to the conversation. |
| **Embracing** | Whoever you are, they are your biggest cheerleader. |
| **Worldly** | Interested, knowledgeable, broad worldview. |

And the tone principle: **voice stays constant, tone reads the room.**

---

## How it should sound

Two rules, and they are the whole reason the current copy feels like a machine.

### 1. Contractions. Always.

**All 99 spoken lines in the product contain zero contractions.** Not one. Iris says
*"It is watching the inbox now"* and *"Let us see"*. Nothing requires this — there is no
rule and no test — it is simply a habit that got copied 99 times.

The screen sitting directly underneath her says *"I'm your mentor"*, *"you've got the
plan"*, *"tools you won't need"*. So the writing already contracts everywhere except in
the one place that is actually **spoken aloud**, which is the one place it matters most.
"Let us see" is not how any person has ever said that sentence.

Three things this fixes at once: it sounds human, it is shorter to say, and it is fewer
characters to render.

### 2. Short sentences, not fragments.

This one is my error in revision 1. Chasing measured delivery, I wrote *"There."*,
*"Second."*, *"One tab left."*, *"Set."* Those slow the audio down, which is what I was
after, and they read like a machine announcing a status, which is not.

A person speaks in short **complete** sentences. `You've got one tab left` is the same
length as `One tab left` and sounds like someone talking.

| Mechanical | Spoken |
|---|---|
| "Set. It reads the email and picks one of your three categories." | "That's what it reads now. It picks one of your three categories." |
| "One tab left." | "You've got one tab left." |
| "There. A paragraph went in and clean fields came out." | "Look at that. A paragraph went in, and clean fields came out." |
| "Four real emails now, one after another." | "Four real emails, one at a time." |

Everything else stays: plain words, no em dashes, under 22 words, no exclamation marks.

---

## The energy ladder (agreed)

| Moment | Times per session | Energy |
|---|---|---|
| A field verifies | ~19 | none — the green tick is the feedback |
| **A node is fully set up** | 6 | **a real win ← the rung missing today** |
| A phase completes | 3 | warm |
| Build done / run passes | 1 each | the payoff |

---

## Gap 1 — "you've got the plan" and the toolkit

That beat had no voice at all: `understand_done` fired from the button that *leaves* the
screen, and `goTo` stops narration on a screen change. Fixed last session, but the line
is still generic, and the screen is doing two jobs at once — you have the plan, *and*
here is your kit with traps in it. One line cannot carry both.

```
understand_done   "That's the hard part done. You worked out every piece of this
                   before touching the canvas."

toolkit_intro     "Here's your kit. Not everything in it belongs to this problem, so
 (new moment)      choose like you just did."
```

---

## Gap 2 — setup says the same sentence twice

A bug, not thin writing. The NDV verifies in two stages, Parameters then Settings, and
**both play `verify_pass` with the same variables**. The identical sentence plays twice
per node, twelve times across the build.

Split it, because they are two different events. `verify_params` acknowledges and moves
on. It does not celebrate, because the node is not finished.

```
verify_params:trigger      "That's the parameters right. You've got one tab left."
verify_params:classify     "Good, that's what it reads. Now tell it what to do when
                            things go wrong."
verify_params:chat-gemini  "That's the model set up. One more tab and it's done."
verify_params:parse        "Those are the right fields. Now the rest of it."
verify_params:switch       "Your rules are right. Now decide what happens to anything
                            that matches none of them."
verify_params:action       "That's right. You've got one tab left on this one."
```

---

## Gap 3 — no win when a node is done

`verify_pass` moves to node-complete, and this is where the warmth goes. Each line names
what the learner just made work, because that is the reward.

```
verify_pass:trigger      "That's your first node working. It's watching the inbox now,
                          and every email that lands starts a run."
verify_pass:classify     "That one's the whole idea. It reads an email like a person
                          would, and it calls it."
verify_pass:chat-gemini  "That's done. That setting is the difference between triage
                          you can trust and a coin toss."
verify_pass:parse        "Look at that. A paragraph went in, and clean fields came
                          out. Now the Switch can read it."
verify_pass:switch       "Three ways out, and you decided every one of them. That's
                          your routing done."
verify_pass:action       "And that's the last piece. Whatever reaches it goes back to
                          a real person."
```

The praise lands on the thinking, never the clicking. No exclamation marks: the lift
comes from the opening beat and from the fact that she is telling you something true.

---

## Gap 4 — the run should be a guided tour

Today `run_start` says four emails are coming and each case gets a bare label. It reads
as a list. It should play as one continuous piece, and it should be framed as checking
*their* build.

```
run_start         "Right, let's see if what you built holds up. Four real emails, one
                   at a time."

run_case:bug      "Here's the first. Their app crashes every time they log in. Watch
                   what your classifier does with it."
run_case:feature  "Next up, and nothing's broken this time. They just want something
                   that doesn't exist yet."
run_case:urgent   "This third one is angry. They've been charged twice and nobody's
                   helping. See where your flow sends it."
run_case:question "Last one, and it's just a question. No bug, no request, no
                   complaint. Keep an eye on this one."

run_pass          "All four of them. Every email went exactly where it should. That
                   flow works."
run_fail          "Some didn't land where they should. That's useful to know. Let's
                   follow one that missed."
```

`run_case:question` says *"keep an eye on this one"* and stops. That is the case matching
no rule, which is also the Stress Testing question — pointing is teaching, naming the
outcome would be answering.

---

## Gap 5 — moving to ElevenLabs

**What changes**

1. The render call swaps to ElevenLabs `eleven_v3` with your voice id.
2. **The `[tags]` become real again.** They are v3 audio tags and are currently
   *stripped* before rendering, because Deepgram reads them aloud. On v3 they shape
   delivery, so `[excited]` and `[thoughtful]` start doing the work punctuation has been
   doing alone.
3. **Everything re-renders.** Voice and model are part of every clip's fingerprint, so
   switching renames every file. By design — this is the case where a full re-render is
   correct — but it is a real cost.

**Cost**

| | Characters |
|---|---|
| email-triage, tags included | ~5,000 |
| all four problems | ~19,400 |
| the rewrites above | ~1,500 |

Contractions pull this down slightly rather than up. Deepgram's clips keep different
filenames, so both libraries coexist and the switch is reversible.

**I need from you:** the voice id, and the key in `.env` as `ELEVENLABS_API_KEY`.

---

## What I would do, in order

1. Fix the duplicate `verify_pass` (gap 2) — a bug regardless of any copy decision.
2. Add the contraction rule to the phrase book, and rewrite **all** of email-triage's
   lines against it, not only the ones quoted here. The 99-lines-zero-contractions
   problem is catalogue-wide, and half-applying it would make the mix worse.
3. Switch to ElevenLabs and re-render email-triage only (~6,500 characters), so you can
   hear the tags working before committing to the other three.
4. On your word, render the rest.
