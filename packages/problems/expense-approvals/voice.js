// Iris's narration for this problem: per-question, per-node, per-case.
//
// READ .claude/skills/iris-voice/SKILL.md before touching a line. What bites hardest:
// an authored entry REPLACES the generic phrase book for that moment, so a single string
// repeats verbatim every time it fires — which is why `verify_fail` and `node_wrong` have
// several variants and `run_pass` has one. And a copy edit changes the clip's fingerprint,
// so it needs `npm run voice:generate` AND `npm run db:seed`, or it looks exactly like a
// broken render.
//
// NONE OF THESE ARE RENDERED YET. This problem has no clip table in
// packages/voice-scripts, so every line below currently degrades to a caption.
//
// Rules held to here: every line opens with a delivery tag, 26 words on an arrival and 22
// elsewhere, contractions always, no em dashes, exclamation marks only on the seven
// moments that may celebrate. Word caps and dashes are checked by `validateProblem()`;
// the rest is convention that only email-triage has a test for.
export const voice = {
  // ---- arriving, and the quiz -------------------------------------------------
  problem_intro: [
    "[calm] Right, expense claims. Finance reads every one and decides what happens to it. You're going to build the thing that does that.",
  ],
  understand_start: ["[calm] Before we build anything, I want to see how you're reading this one."],
  understand_done: [
    "[excited] That's the whole plan worked out! [pause] You did it before touching the canvas, which is the right order.",
  ],

  // Per question. The generic verdict says WHICH answer was wrong; these say why it
  // matters, from a different angle to the explanation already on screen. `{answer}` is
  // filled from the question's own options, so the wording has to fit every one of them.
  'answer_correct:trigger': ['[warm] Yes. {answer} hears the claim land, on its own, every single time.'],
  'answer_wrong:trigger': ["[thoughtful] Would {answer} notice a claim arriving? Nobody's sitting here pressing anything."],
  'answer_wrong_again:trigger': ['[calm] Think about what begins this. A claim arrives without anybody asking for it.'],

  'answer_correct:classify': ['[warm] Right. {answer} reads what somebody wrote and makes the call on it.'],
  'answer_wrong:classify': ['[thoughtful] Could {answer} tell a complete claim from a vague one? Have another look.'],
  'answer_wrong_again:classify': [
    '[calm] A claim is free text, written differently every time. You need something that reads meaning.',
  ],

  'answer_correct:parse': ['[warm] Yes. {answer} turns that blob of text into fields anything can read.'],
  'answer_wrong:parse': ['[thoughtful] The answer is one lump of text right now. Does {answer} help with that?'],
  'answer_wrong_again:parse': ['[calm] Ask what shape the next node needs its input in, then work backwards.'],

  'answer_correct:switch': ['[warm] Exactly. {answer} takes one claim in and sends it out one way.'],
  'answer_wrong:switch': ['[thoughtful] {answer} gives you fewer ways out than you need. Count the outcomes again.'],
  'answer_wrong_again:switch': ['[calm] Count the ways out you need. Three outcomes means three separate exits.'],

  // No `{answer}` on these two: one of the options is a sentence rather than a node name,
  // and a line built around it reads like a broken mail merge.
  'answer_correct:action': ['[warm] Yes. That one actually reaches the person who sent the claim in.'],
  'answer_wrong:action': ['[thoughtful] The claimant emailed, and is waiting. Would they ever see the outcome that way?'],
  'answer_wrong_again:action': ["[calm] They wrote in by email, and they're waiting on an answer to it."],

  // ---- building --------------------------------------------------------------
  build_start: ["[calm] Right, you've got your nodes. Now let's set each one up, in the order a claim travels."],

  'phase_intro:intake': ['[calm] Now that you know the exact nodes, lets dive in deeper. Start Building'],
  'phase_intro:judge': ['[calm] This part has to read plain English and make a call. Think about what that needs.'],
  'phase_intro:route': ['[calm] Now the paths split. Every outcome needs somewhere of its own to go.'],

  'node_placed:trigger': ["[calm] That's the way in. Everything after it runs once per claim that arrives."],
  'node_placed:classify': ['[calm] This is what reads a claim and decides. It needs a model to think with.'],
  'node_placed:chat-gemini': ["[calm] That's the brain it borrows. How you set it up decides how steady its answers are."],
  'node_placed:parse': ['[calm] The model answers as text. This turns it into fields the next nodes can read.'],
  'node_placed:switch': ['[calm] This is where the outcomes part company. Each branch you build is one path out.'],
  'node_placed:action': ['[calm] This is the reply itself. Whatever reaches it goes back to the claimant.'],

  // Only the two nodes with graded settings can land on this moment, so only they need it.
  'verify_params:classify': ["[calm] Right, that's what it reads. Now tell it what to do when things break."],
  'verify_params:switch': ['[calm] Okay, your rules are right. Now, what about anything matching none of them?'],

  // The win. Each one names what that node now DOES in this flow.
  'verify_pass:trigger': [
    "[warm] That's your first node working. It's watching the claims label now, and every claim starts a run.",
  ],
  'verify_pass:classify': ["[warm] Ah, that one's the whole idea. It reads a claim and applies the policy itself."],
  'verify_pass:chat-gemini': ["[warm] Good. Same claim, same answer, every time. That's what makes a policy a policy."],
  'verify_pass:parse': ['[warmly] Look at that. A sentence went in, and clean fields came out.'],
  'verify_pass:switch': ["[warm] Okay. Three ways out, and you decided every one of them. That's your routing done."],
  'verify_pass:action': ["[warm] And that's the last piece. Whatever reaches it goes back to a real person."],

  // The most repeated lines in the journey, so they rotate. Each points at WHICH field to
  // look at and never at what to put in it.
  'verify_fail:trigger': [
    "[calm] Not yet. Have another look at where this one's picking mail up from.",
    '[thoughtful] Hmm, not quite. One of those two is about the shape each email arrives in.',
    '[calm] Close. Check which mail it is watching before anything else.',
    '[thoughtful] Not right yet. Read what each option would actually hand to the next node.',
  ],
  'verify_fail:classify': [
    '[calm] Ah, not yet. Check what you pointed it at, because it only reads what you hand it.',
    '[thoughtful] Hmm. Have another look at the shape you asked it to answer in.',
    '[calm] Not quite. What did you give it to read?',
    '[thoughtful] Close. Think about what the nodes after this one have to be able to read.',
  ],
  'verify_fail:chat-gemini': [
    '[calm] Not yet. Think about whether the same claim should get the same answer twice.',
    "[thoughtful] Hmm. That number decides how much it's allowed to wander. Have another go.",
    '[calm] Not quite. Ask what repeatable means here, then pick the value that gives you it.',
  ],
  'verify_fail:parse': [
    "[calm] Not yet. Check what you're parsing before you check what you pulled out of it.",
    '[thoughtful] Hmm. Work backwards from what the split has to read.',
    '[calm] Close. One of those fields is the claim, and one is the answer about the claim.',
    '[thoughtful] Not right yet. Have another look at where each value is coming from.',
  ],
  'verify_fail:switch': [
    '[calm] Not yet. Have another look at what each branch is testing.',
    "[thoughtful] Hmm. Read what the classifier's told to answer with, then read your branch names.",
    '[calm] Close. Count your branches against the answers it can actually give.',
    "[thoughtful] Not quite. Check the value you're splitting on.",
  ],
  'verify_fail:action': [
    "[calm] Not yet. Ask who's actually waiting on this reply.",
    "[thoughtful] Hmm. Have another look at the address you're sending to.",
    '[calm] Close. Think about what a person would want to find in that email.',
  ],

  // Never names the node that would have been right.
  node_wrong: [
    "[calm] Hmm. That one can't do the job this step needs. Have a think about why.",
    '[thoughtful] Ah, not that one. Look at what this step actually has to produce.',
    "[calm] That's not it. What does the next node need handed to it?",
    '[thoughtful] Hmm, no. Read that node’s job again, then read the step’s.',
    '[calm] Not that one. Ask what this step has to decide before anything else can happen.',
  ],

  idle_nudge: [
    "[calm] Take your time. If you'd like a hand, just ask me.",
    "[calm] Still with me? I'm here if you want to talk it through.",
    "[thoughtful] No rush at all. Say the word if you'd like a nudge.",
  ],

  'phase_complete:intake': ["[excited] The flow's got a way in now! That's a good start."],
  'phase_complete:judge': ['[excited] It can read a claim and judge it now! [pause] That was the hard part.'],
  build_complete: ["[excited] The whole thing's wired up! [pause] Let's throw some real claims at it and see."],

  // ---- running ---------------------------------------------------------------
  run_start: ["[calm] Right, let's see if what you built holds up. Four real claims, one at a time."],

  // Every one opens on the trigger, because that is the node sitting on their canvas. None
  // of them says where it lands: watching that happen is the whole point.
  'run_case:cab': ["[calm] Okay, here's the first. Somebody emails in a cab fare, with the receipt underneath."],
  'run_case:laptop': ['[calm] Right, next. Somebody emails a claim for a laptop, ninety two thousand rupees.'],
  'run_case:vague': ['[calm] Ah, this one. Somebody emails asking to be paid back for travel, and says nothing else.'],
  'run_case:payroll': [
    '[calm] And the last one. Somebody emails the claims address with a question. Keep an eye on this.',
  ],

  // "All four" would be a lie: the fourth is meant to match nothing.
  run_pass: ["[excited] Every claim with a decision landed on the right path! [pause] That's your flow working."],
  run_fail: [
    "[calm] Hmm. One of those didn't land where it should have. Let's look at the flow again.",
    "[calm] Ah. Something went somewhere it shouldn't. Have a look at where it stopped.",
  ],

  // ---- the end ---------------------------------------------------------------
  stress_start: [
    "[excited] Lovely! [pause] Now let's stress test it. What does yours do with mail it wasn't expecting?",
  ],
  report_ready: ["[excited] Alright, here it is! [pause] What stood out, and what I'd practise next."],
};
