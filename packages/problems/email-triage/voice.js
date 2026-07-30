// Iris's narration for this problem: per-node, per-question, per-case.
//
// Read .claude/skills/iris-voice/SKILL.md before touching a line. Two rules bite hardest:
// an authored entry REPLACES the generic phrase book for that moment (so a single string
// here means no rotation, and repeats verbatim), and a copy edit changes the clip's
// fingerprint — which means `npm run voice:generate` AND `npm run db:seed`, or it looks
// exactly like a broken render.

// Readable labels for misconception codes recorded during the run.
// What Iris says on THIS problem. Overrides the default phrase book, keyed by
// moment and optionally by node type.
//
// The reason to author these rather than take the defaults: a generic line has
// to say "now open it and set it up", because it does not know what the node is
// for. Here it can say what this particular node is deciding, which is the
// difference between narration and teaching. None of these give an answer away;
// they say what the node is FOR, never which option to pick.
export const voice = {
  // Placing a node, per node type.
  'node_placed:trigger': [
    "[calm] That's the way in. Everything after it runs once per email that arrives.",
  ],
  'node_placed:classify': [
    "[calm] This is what reads the email and decides what kind it is. It needs a model to think with.",
  ],
  'node_placed:chat-gemini': [
    "[calm] That's the brain the classifier borrows. How it's set up decides how steady its answers are.",
  ],
  'node_placed:parse': [
    "[calm] The model replies as text. This turns it into fields the next nodes can actually read.",
  ],
  'node_placed:switch': [
    "[calm] This is where the kinds of email split apart. Each branch you build is one path out.",
  ],
  'node_placed:action': [
    "[calm] This is the reply itself. Whatever reaches it gets an email back.",
  ],

  // Finishing a stage, per phase.
  'phase_complete:trigger': ["[excited] The flow's got a way in now. That's a good start!"],
  'phase_complete:brain': ["[excited] It can read an email and understand it now! [pause] That was the hard part."],
  build_complete: ["[excited] The whole thing's wired up! [pause] Let's throw some real emails at it."],

  // This problem's stress test is about the gap, so point at behaviour.
  stress_start: [
    "[excited] Wonderful! [pause] Now let's stress test it. What does yours do with an email it wasn't expecting?",
  ],

  // ---- reasoning, per question -------------------------------------------
  // The generic verdict says WHICH answer was wrong. These say why it matters,
  // in one short sentence, from a different angle to the explanation on screen.
  // That is the handholding: not the full reason, which they are reading, but the
  // thought that gets them there.
  //
  // Still no answers. Each one describes the shape of the problem, not the node
  // that solves it.
  'answer_correct:trigger': [
    "[warm] Yes. {answer} wakes this up on its own, every time mail arrives.",
  ],
  'answer_wrong:trigger': [
    "[thoughtful] Would {answer} start on its own? Nobody's sitting here pressing anything.",
  ],
  'answer_wrong_again:trigger': [
    "[calm] Think about who or what begins this. The mail arrives without anyone asking.",
  ],

  'answer_correct:classify': [
    "[warm] Right. {answer} reads the words and works out what kind of message it is.",
  ],
  'answer_wrong:classify': [
    "[thoughtful] Could {answer} really judge what the email's about? Have another look.",
  ],
  'answer_wrong_again:classify': [
    "[calm] The email's free text. You need something that understands meaning, not something matching rules.",
  ],

  'answer_correct:parse': [
    "[warm] Yes. {answer} turns that blob of text into separate, usable fields.",
  ],
  'answer_wrong:parse': [
    "[thoughtful] The answer's one lump of text right now. Does {answer} help with that?",
  ],
  'answer_wrong_again:parse': [
    "[calm] Ask what shape the next node needs its input in, then work backwards.",
  ],

  'answer_correct:switch': [
    "[warm] Exactly. {answer} takes one email in and sends it out down one path.",
  ],
  'answer_wrong:switch': [
    "[thoughtful] {answer} gives you one way out. You need one in and three out.",
  ],
  'answer_wrong_again:switch': [
    "[calm] Count the outputs you need. Three categories means three separate exits.",
  ],

  'answer_correct:action': [
    "[warm] Yes. {answer} is what actually reaches the customer at the end.",
  ],
  'answer_wrong:action': [
    "[thoughtful] Would the person who wrote in ever see {answer}? They want a reply.",
  ],

  // ---- reasoning, per node setup -----------------------------------------
  // FIVE variants each, and they rotate (see `spokenCount` in voice.js). These are
  // the lines a learner hears most: one authored line per node meant that failing
  // the same node three times played one identical recording three times, which is
  // what made Iris sound like a machine at exactly the moment she is meant to help.
  //
  // Kept problem-specific rather than falling back to the generic ten, because
  // naming the field that is actually wrong on THIS node is worth far more than
  // variety for its own sake. Each one still points at where to look, never at what
  // to put there.
  'verify_fail:classify': [
    "[calm] Ah, not yet. Check what you pointed it at, because it only reads what you hand it.",
    "[calm] Hmm, not right. It can only work with the text you feed it. Look there.",
    "[thoughtful] Not yet. What did you give it to read?",
    "[calm] Close. Check the field holding what it's meant to classify.",
    "[thoughtful] Hmm. Have another look at what's going into it.",
  ],
  'verify_fail:switch': [
    "[calm] Hmm, not right yet. Look at what each branch is testing, and what the AI actually gave you.",
    "[calm] Not yet. Check the value each rule is matching on.",
    "[thoughtful] Hmm. Do your rules match what the step before produces?",
    "[calm] Close. Look again at what each branch is comparing.",
    "[thoughtful] Not quite. Check the field your rules are reading.",
  ],
  'verify_fail:chat-gemini': [
    "[thoughtful] Hmm. [pause] Not yet. Think about whether the same email should always get the same answer.",
    "[calm] Not right yet. Should this give the same answer twice for the same email?",
    "[thoughtful] Hmm. That setting decides how much it improvises. Have a think.",
    "[calm] Not yet. Triage has to be repeatable. What does that mean here?",
    "[thoughtful] Have another look. Consistency is the whole point of this one.",
  ],
  'verify_pass:chat-gemini': [
    "[warm] That's done. That setting is the difference between triage you can trust and a coin toss.",
  ],

  // ---- how these are made to sound like something -------------------------
  // The `[warm]` and `[calm]` markers are notes to the author. They were audio
  // tags once and are stripped before rendering now, so they change nothing.
  //
  // What DOES change delivery is punctuation, and measurably. The same twenty-five
  // characters, through Deepgram Aura:
  //
  //   "That is right, well done."   1.85s   commas run it together, lightest
  //   "That is right. Well done."   1.97s   the neutral baseline
  //   "That is right... well done." 2.06s   an ellipsis buys a beat
  //   "That is right! Well done!"   2.14s   lifts, about nine percent
  //   "That is right. Well. Done."  2.45s   full stops are the strongest lever
  //
  // So tone is built out of sentence length. A short sentence lands heavier than a
  // long one, and three of them in a row sound deliberate. That is used on purpose
  // below: `verify_fail` is fragmented so it slows down and sounds careful, while
  // `idle_nudge` uses commas so it stays light and does not nag.
  //
  // Note there are no exclamation marks anywhere, and that is a house rule with a
  // test behind it. It costs nothing: a run of short sentences lifts delivery more
  // than a "!" does (24 percent against 9), and it never reads as a cheerleader.
  // `understand_done` and `run_pass` are the two moments a learner has actually
  // finished something, so both are written as three short beats.

  // ---- arriving -----------------------------------------------------------
  // The screen already says who Iris is and what the challenge is called, so these
  // say what is NOT on the page: why this problem is worth doing.
  // No `welcome` override on purpose. The hello screen gets the generic greeting,
  // because a greeting is the same job whichever problem you picked. This problem's
  // hook lives on the next beat, where the statement is actually on screen.
  problem_intro: [
    "[calm] Okay, let's get started. Today's problem statement is simple. Your support inbox gets every kind of message at once. Read it through properly.",
  ],
  understand_start: ["[calm] Before we build anything, I want to see how you're reading this."],
  understand_done: ["[excited] That's the hard part done! [pause] You worked out every piece before touching the canvas."],

  // The canvas has just opened and it is empty. This is the only line that gets to
  // frame the whole build, so it gives the ordering principle and nothing else.
  // Spoken as the canvas opens, straight after the toolkit reveal. Names what the
  // learner now HAS before naming what to do with it — the previous line went
  // straight to "start connecting them", which is the next screen's job.
  build_start: ["[calm] Right, you've got all your nodes. Now let's build your setup, in the order the email travels."],

  // ---- opening a build phase ----------------------------------------------
  // The phase title and its description are both on screen. These give the
  // question to hold in your head while you look at the palette, and never the
  // node that answers it.
  'phase_intro:trigger': ["[calm] Nothing here runs until something starts it, so begin at the top."],
  'phase_intro:brain': ["[calm] This part has to read plain English and decide. Think about what that needs."],
  'phase_intro:route': ["[calm] Now the paths split. Every category needs somewhere of its own to go."],

  // ---- a node is configured correctly -------------------------------------
  // Naming the node is safe here: they just set it up, so nothing is being given
  // away. What each line adds is the thing the screen does not say, which is what
  // this node now DOES inside this particular flow.
  'verify_pass:trigger': ["[warm] That's your first node working. It's watching the inbox now, and every email starts a run."],
  'verify_pass:classify': ["[warm] Ah, that one's the whole idea. It reads an email like a person would, and it calls it."],
  'verify_pass:parse': ["[warmly] Look at that. [pause] A paragraph went in, and clean fields came out. Now the Switch can read it."],
  'verify_pass:switch': ["[warm] Okay. Three ways out, and you decided every one of them. That's your routing done."],
  'verify_pass:action': ["[warm] And that's the last piece. Whatever reaches it goes back to a real person."],

  // ---- parameters right, settings still to do -----------------------------
  // Acknowledges and points at the tab that just unlocked. No praise: the node is
  // not finished, and spending the win here is what left the real completion flat.
  'verify_params:trigger': ["[calm] Okay, that's the parameters right. You've got one tab left."],
  'verify_params:classify': ["[calm] Right, that's what it reads. Now tell it what to do when things go wrong."],
  'verify_params:chat-gemini': ["[calm] Okay, that's the model set up. One more tab and it's done."],
  'verify_params:parse': ["[calm] Good, those are the right fields. Now the rest of it."],
  'verify_params:switch': ["[calm] Okay, your rules are right. Now, what happens to anything matching none of them?"],
  'verify_params:action': ["[calm] Right, that's it. You've got one tab left on this one."],

  // ---- a node is not right yet --------------------------------------------
  // Deliberately clipped: short sentences slow the delivery down and make it sound
  // careful rather than impatient. Each one points at WHICH field to look at
  // without saying what to put in it.
  'verify_fail:trigger': [
    "[thoughtful] Hmm. [pause] Not quite. Check which inbox it's watching, and which part it reads.",
    "[calm] Not yet. Which mailbox is it meant to be watching?",
    "[thoughtful] Hmm. Have another look at what part of the email it takes.",
    "[calm] Close. Check the inbox and the field underneath it.",
    "[thoughtful] Not right yet. Where is it listening, and for what?",
  ],
  'verify_fail:parse': [
    "[calm] Ah, not yet. Look at what it's reading from, and the names you asked it for.",
    "[calm] Not right. Check the field names you typed against what came out of the AI.",
    "[thoughtful] Hmm. Is it reading from the right place?",
    "[calm] Close. The names have to match what the step before produced.",
    "[thoughtful] Not yet. Have another look at what you asked it to pull out.",
  ],
  'verify_fail:action': [
    "[calm] Ah, not right yet. Check who it's replying to, and where the words come from.",
    "[calm] Not yet. Who is this reply actually going to?",
    "[thoughtful] Hmm. Check the address, and then the body underneath.",
    "[calm] Close. Look at where the message text is coming from.",
    "[thoughtful] Not quite. Check the recipient on this one.",
  ],

  // The wrong node, on the canvas. Never names the right one, and never says what
  // the wrong one does either — the probe that opens next is what asks that.
  // Ten variants: a learner can reach for the wrong node many times in one sitting,
  // and this line greeted every one of them identically.
  node_wrong: [
    "[thoughtful] Hmm. [pause] That one won't do this job here. Let me ask you something.",
    "[thoughtful] Ah, not that one. There's something I'd like you to think about.",
    "[calm] Not quite. Before you try again, answer me this.",
    "[thoughtful] Hold on. That can't give this step what it needs.",
    "[calm] That's not the one. Let's work out why together.",
    "[thoughtful] Hmm. Wrong tool for this job. One question first.",
    "[calm] Nearly, but no. Let me check something with you.",
    "[thoughtful] Careful. That node does something else entirely.",
    "[calm] That one can't do it. Let's find out what you're picturing.",
    "[thoughtful] Hmm, no. Here's the question to ask yourself.",
  ],

  // ---- the run ------------------------------------------------------------
  // Says what a run IS, because nothing on screen does: four real emails, sent
  // through the flow one after another, with the whole journey visible.
  run_start: ["[calm] Right, let's see if what you built holds up. Four real emails, one at a time."],

  // One line per email as it enters. Without these the run is a sticky note
  // sliding along a wire and every case looks the same.
  //
  // Each describes the EMAIL and stops there. Where it comes out is the thing
  // worth watching, and on the last one it is also the Stress Testing question, so
  // announcing the destination would answer a question not yet asked.
  // Every run_case OPENS ON THE TRIGGER. "A customer sends an email saying the
  // app crashes" ties the case to the node the learner actually wired up;
  // starting from the symptom ("their app crashes") describes a situation with no
  // visible connection to the trigger sitting on the canvas.
  'run_case:bug': ["[calm] Okay, here's the first. A customer sends an email saying the app crashes when they log in."],
  'run_case:feature': ["[calm] Right, next up. A customer emails asking for something that doesn't exist yet."],
  'run_case:urgent': ["[calm] Ah, this third one. A customer emails, angry, charged twice and nobody's helping."],
  'run_case:question': ["[calm] And the last one. A customer emails just to ask a question. Keep an eye on this one."],
  // "All four of them!" opened on a number with nothing for it to count, and the
  // clip ran on past the celebration it belongs to. Says what passed, in one
  // breath, so nothing is left hanging when the screen moves on.
  run_pass: ["[excited] All four test cases passed! [pause] Every email went exactly where it should."],
  run_fail: [
    "[calm] Hmm. Some didn't land where they should. That's useful to know, so let's follow one.",
    "[calm] Not all of them landed right. Follow one that missed and see where it turned.",
  ],

  // ---- noticing they have gone quiet --------------------------------------
  // Commas, not full stops: this one has to stay light. It is an offer, not a
  // prod, and it is the line most likely to be heard more than once.
  idle_nudge: [
    "[calm] Take your time. If it helps, ask what the last node handed over.",
    "[calm] Still thinking? Tell me what's unclear and I'll help.",
    "[calm] No rush at all. Look at what this step is given, and what it owes the next one.",
  ],

  'answer_wrong_again:action': [
    "[calm] Think about the person who wrote in. What do they actually receive?",
  ],

  report_ready: ["[excited] Alright, here it is! [pause] What stood out, and what I'd practise next."],
};
