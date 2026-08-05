// Iris's narration for this problem: per-question, per-node, per-case.
//
// READ .claude/skills/iris-voice/SKILL.md before touching a line. Two rules bite hardest:
// an authored entry REPLACES the generic phrase book for that moment (so a single string
// repeats verbatim every time it fires, which is why `verify_fail` and `node_wrong` have
// several variants and `run_case` has one), and a copy edit changes the clip's fingerprint,
// so it needs `npm run voice:generate` AND `npm run db:seed` or it looks exactly like a
// broken render.
//
// WHAT THIS CASE'S NARRATION HAS TO GET RIGHT, beyond the shared rules:
//
//   1. THERE IS NO AI STEP. Not one line may talk as though something is reading,
//      judging or deciding. This is the case that teaches wiring before it teaches
//      intelligence, so the vocabulary is the form, the rate, the row and the mail.
//   2. NOTHING BRANCHES. No phase_intro about routing, no branch names, and `run_pass`
//      cannot say "went where it should" because there is nowhere else to go.
//   3. THE COLUMN MAPPING IS THE GRADED CENTREPIECE. `verify_fail:google-sheets` says
//      WHICH column looks off and stops. It never supplies a heading, never supplies an
//      expression, and never says where the rate sits inside the response.
//   4. THE BLANK NAME IS THE DELIBERATE GAP. `run_case:noname` points at it and leaves
//      it alone: what happens to that signup is the first Stress Testing answer.
//
// LEFT GENERIC ON PURPOSE: `welcome` (saying hello is the same job on every case),
// `idle_nudge`, `phase_complete`, `verify_params` on every node, and both probe verdicts.
// A bespoke version of any of those costs a render and reads no better — and because an
// authored key REPLACES the shared set rather than adding to it, authoring a moment that
// has nothing case-specific to say actively reduces the variety a learner hears. The two
// moments that do fire repeatedly with something of their own to say, `node_wrong` and
// `verify_fail:google-sheets`, carry ten and eight wordings for the same reason.
//
// Every line opens with a [tag]. Word caps: 26 on an arrival, 22 elsewhere. No em dashes,
// no `{{ }}`, contractions always, and exclamation marks only on the seven moments that
// have earned one.
export const voice = {
  // ---- arriving, and the quiz -------------------------------------------------
  // The statement is on screen and being read. This is the orientation around it:
  // we're starting, here's the shape of it, here's what to do.
  problem_intro: [
    "[calm] Okay, let's get started. Somebody signs up for a free trial, and three things have to happen on their own. Read it through.",
  ],
  // Says the thing the hero copy does not: there's no model to lean on here.
  understand_start: ["[calm] No AI in this one, so every decision is yours. Let's see how you're reading it."],
  // Spoken on ARRIVAL at the summary, which a learner reaches whatever their verdicts were:
  // both quizzes advance on a wrong answer too. So this cannot congratulate them for naming
  // anything. It counts what the flow needs and claims nothing about who got there.
  understand_done: [
    "[excited] Four jobs, four nodes, and you've got the shape of it now! [pause] Let's go and build the thing.",
  ],

  // Per dissection question. `{answer}` is filled from the question's options, and
  // `answer_correct` can only ever be spoken with the CORRECT one, so naming it gives
  // nothing away and makes the verdict about what they actually picked.
  //
  // The wrong-answer lines carry no `{answer}` on purpose: three of the four questions
  // offer a "Nothing, do it by hand" option written as a sentence, and a line built
  // around that reads like a broken mail merge. They point at the reasoning instead.
  'answer_correct:form-trigger': [
    '[warm] Yes. {answer} fires the moment somebody presses submit, and it knows all four answers by name.',
  ],
  'answer_wrong:form-trigger': [
    "[thoughtful] Hmm. They're still on the page waiting for a mail. Would that one know they'd pressed submit?",
    '[thoughtful] Have another look. Does that one find out at the moment of the submission, or later?',
  ],
  'answer_wrong_again:form-trigger': [
    "[calm] Ask what starts this. Nobody's watching for signups, and the welcome mail is meant to feel instant.",
  ],

  'answer_correct:rate': ['[warm] Right. {answer} goes and asks for the number, and brings it back as data.'],
  'answer_wrong:rate': [
    "[thoughtful] Hmm. That number lives on somebody else's server and changes daily. Would that one go and ask?",
    "[calm] Have another think. You'll need a value a single spreadsheet cell can hold.",
  ],
  'answer_wrong_again:rate': [
    "[calm] Let's slow down. Something has to call out to the world and bring one number home.",
  ],

  'answer_correct:log': ['[warm] Yes. {answer} thinks in rows and columns, which is exactly what this step needs.'],
  'answer_wrong:log': [
    "[thoughtful] Hmm. The team wants to sort by plan and count last week's trials. Could they, with that?",
    '[calm] Have another look. Each answer has to land under its own heading, in its own cell.',
  ],
  'answer_wrong_again:log': [
    '[calm] Read the options as places to put things. Which one has headings you can point a value at?',
  ],

  'answer_correct:welcome': ['[warm] Exactly. {answer} reaches the person who just filled in your form.'],
  'answer_wrong:welcome': [
    "[thoughtful] Hmm. All you've got is an address they typed into a form. Would they ever see that?",
    '[calm] Think about the person, not your team. Where are they actually looking?',
  ],
  'answer_wrong_again:welcome': [
    "[calm] Go back to the person who filled the form in. They're sitting there waiting to hear something.",
  ],

  // ---- building --------------------------------------------------------------
  build_start: [
    "[calm] Right, you've got your four nodes. Now let's set each one up, in the order a signup travels.",
  ],

  // The phase label and its coach line are both on screen, so these give the question
  // to hold in your head instead, and never the node that answers it.
  'phase_intro:intake': [
    "[calm] Somebody's just pressed submit on your form. What hears that, and what does it know about it?",
  ],
  'phase_intro:rate': [
    "[calm] The rate lives on somebody else's server and changes every day. So who goes and asks?",
  ],
  'phase_intro:log-and-welcome': [
    '[calm] Two nodes in this one, and which runs first matters. Think about what the row has to carry.',
  ],

  // Placing a node. They picked it, so naming what it does reveals nothing, and it is
  // the difference between "now configure it" and teaching.
  'node_placed:form-trigger': [
    "[calm] That's the way in. It publishes the form, so the four answers arrive with names on them.",
  ],
  'node_placed:http-request': [
    '[calm] That one calls out to the world. What comes back is data, and its shape matters.',
  ],
  'node_placed:google-sheets': [
    '[calm] This is the sheet. Open it up and decide what goes under each heading.',
  ],
  'node_placed:action': [
    '[calm] And this is the welcome mail, the only part the person signing up ever sees.',
  ],

  // `verify_params` is left generic everywhere, including on the rate node — the only node
  // here with a graded Settings tab. Anything Iris could add about that tab is about its
  // one graded setting, Execute Once, whose correct value is `false` and whose NAME is the
  // only argument for `true`. So "its name is misleading" would be a directional nudge onto
  // an unanswered boolean. The shared line points at the tab and stops, which is the job.

  // The win, once per node. Each one names what that node now DOES in this flow.
  'verify_pass:form-trigger': [
    "[warm] That's your first node working. Every submitted form starts a run now, with all four answers on it.",
  ],
  'verify_pass:http-request': [
    "[warm] Ah, good. Today's dollar to rupee rate is in the flow now, ready for the row.",
  ],
  'verify_pass:google-sheets': [
    '[warm] Look at that. Every answer under its own heading, so a sentence full of commas stays in one cell.',
  ],
  'verify_pass:action': [
    "[warm] And that's the last piece. Whoever signs up hears back from you straight away now.",
  ],

  // The most repeated lines in the journey, so they rotate. Every one points at WHICH
  // field to look at and never at what to put in it.
  'verify_fail:form-trigger': [
    "[calm] Ah, not yet. Look at which answers you're insisting on before the form can be sent.",
    "[thoughtful] Hmm. Some blanks this flow can live with, and some it can't. Have another look.",
    '[calm] Not quite. Read the brief again on what a blank name still has to produce.',
    "[thoughtful] Close. Ask what the rest of the flow genuinely can't work without.",
  ],
  'verify_fail:http-request': [
    '[calm] Ah, not yet. Read the URL again, and mind which way round the two currencies go.',
    "[thoughtful] Hmm. The column's named for one direction. Does what you asked for match it?",
    "[calm] Not right yet. Have another look at the marked field and what it's really asking.",
    '[thoughtful] Close. Read that setting again, thinking about how many signups arrive at once.',
    "[calm] Not quite. Check what you've asked the rate service for before anything else.",
  ],
  // The centrepiece, and the most-fired moment in the journey: the assignment list is
  // graded on three aspects, so one imperfect mapping can fail this several times over.
  // Eight wordings for that reason.
  //
  // These name which column looks off, or which level to count, and stop there. No heading,
  // no expression, and never where the rate sits. They also stay field-agnostic, because
  // the rotation cannot know whether the operation or the mapping is the red one.
  'verify_fail:google-sheets': [
    '[calm] Ah, not yet. Count your entries against the headings the Signups sheet actually has.',
    '[thoughtful] Hmm. One of those rows has the wrong answer under its heading. Which one looks off?',
    '[calm] Not right yet. Check each heading you typed against the column list on the panel.',
    '[thoughtful] Close. Read the response shape in the note again, and count the levels.',
    '[calm] Not quite. Take the two decisions on this node one at a time, starting at the top.',
    '[thoughtful] Hmm. Take one row at a time. Does that value belong under that heading?',
    "[calm] Not yet. A heading that isn't on the sheet writes nothing, and nothing warns you.",
    '[thoughtful] Close. Read your list back as one row landing on the sheet. Where does it break?',
  ],
  'verify_fail:action': [
    "[calm] Ah, not yet. Ask where this mail is addressed, and whether that's really an address.",
    '[thoughtful] Hmm. Have another look at the first line, and what it does with no name.',
    '[calm] Not right yet. One signup arrives with the name box empty. Does your greeting survive it?',
    "[thoughtful] Close. Check who's actually meant to be reading this mail.",
    '[calm] Not quite. Read the marked field again, as the person receiving it would.',
  ],

  // The wrong node, on the canvas. Never names the right one, and never says what the
  // wrong one does either, because the probe that opens next is what asks.
  //
  // Ten wordings, because this is one of the two moments a learner meets repeatedly in a
  // sitting. Every one of them earns its render on the same case-specific fact: `flow.next`
  // makes ORDER graded here, so a wrong placement is two different mistakes wearing one
  // red pulse. The node may be wrong for the step, or right and too early. The shared set
  // only ever says "wrong tool", so each of these holds both readings open and points at
  // what a signup is carrying by the time it arrives.
  //
  // None of them names a job either. With three pickable nodes in a phase, naming the job
  // names the node.
  node_wrong: [
    "[calm] Not that one. Either it's wrong for this step, or it isn't its turn yet.",
    '[thoughtful] Ah, hold on. A node can only use what the one before it handed over.',
    '[thoughtful] Hmm, no. Think about what this part of the flow has to hand on.',
    '[calm] Careful. The right node in the wrong place breaks this just as thoroughly. One question first.',
    "[thoughtful] Hmm. Follow one signup through in your head, and see where you've got to.",
    '[calm] Not there. Ask what a signup is carrying by the time it reaches this step.',
    '[thoughtful] Hold on. Every step here depends on the one before it. Let me ask you something.',
    '[calm] Nearly. Check the order as well as the node, then answer me this.',
    "[thoughtful] Hmm. Read the board left to right, and ask what's missing between here and there.",
    "[calm] Not that. A step can't use something the flow hasn't produced yet. One question first.",
  ],

  // `probe_correct` and `probe_wrong` are deliberately NOT authored. A probe verdict has
  // no vocabulary of its own to carry: the probe question is already about this node, and
  // every wording that fits here is a wording of "yes, that's the thing to watch for".
  // Overriding replaces the shared set wholesale, so a bespoke five would have cost five
  // renders to give a repeatedly-fired moment LESS variety than the shared eight.

  build_complete: [
    "[excited] The whole thing's wired up! [pause] Let's push some real signups through it and see.",
  ],

  // ---- running ---------------------------------------------------------------
  run_start: ["[calm] Right, let's see if what you built holds up. Six real signups, one at a time."],

  // Every one OPENS ON THE TRIGGER, because that is the node sitting on their canvas.
  // A form is submitted, and then what the submission says. None of them says where it
  // lands: watching that happen is the whole point of the run.
  'run_case:aarav': [
    "[calm] Okay, here's the first. Somebody fills in the form, Pro plan, found you through a Google search.",
  ],
  'run_case:bella': [
    '[calm] Right, next. Somebody submits the form on Plus, and their referral answer has a comma and quotes in it.',
  ],
  'run_case:chen': ['[calm] Now a form comes in on Basic, with the referral box left empty.'],
  'run_case:hiro': ["[calm] Another form arrives on Plus, and the referral answer's written in Japanese."],
  // `ivy` has no name field: the run card shows ivy.obrien@example.com and the referral
  // "O'Brien family discount", so the referral is the only apostrophe a learner can see.
  'run_case:ivy': ["[calm] Then this one submits on Pro, with an apostrophe sitting in the referral answer."],
  // The deliberate gap. Points at it and stops: what happens to this signup is the
  // first Stress Testing answer.
  'run_case:noname': ['[calm] And the last form arrives with the name box empty. Keep an eye on this one.'],

  // Says what the number counts, and says it first, because a learner can click past
  // the clip and the meaning has to be in the opening clause. Nothing here says where
  // anything landed: this flow has one path, and the blank name is still an open
  // question on the next screen.
  //
  // Neither line claims the whole job got done, either. `problem_intro` says three things
  // have to happen on their own, and whether all three happened for the signup with no name
  // is the first Stress Testing question. So these credit the BUILD, not the outcomes.
  run_pass: [
    "[excited] All six signups came through your flow! [pause] That's four nodes doing their jobs in order.",
    '[excited] Six signups, and every one held up! [pause] The order you built pays off there.',
  ],
  run_fail: [
    "[calm] Hmm. Some of those didn't come out right. Let's follow one and see where it stopped.",
    "[calm] Ah. Something didn't land the way it should. Have another look at the order.",
  ],

  // ---- the end ---------------------------------------------------------------
  stress_start: [
    "[excited] Lovely! [pause] Now let's stress test it. What does yours do when an answer arrives blank?",
  ],

  // Per question. These react and point, and never restate the answer: the written
  // verdict beside the options already explains it, and repeating it is reading the
  // screen.
  'stress_correct:blank-name': ["[warm] Yes, exactly. You'd thought about the awkward one before it arrived."],
  'stress_wrong:blank-name': [
    '[thoughtful] Hmm, not that. Read what really happens, because this one is the heart of it.',
  ],
  'stress_correct:execute-once': ["[warm] Right. That name catches a lot of people, and it didn't catch you."],
  'stress_wrong:execute-once': [
    "[thoughtful] Ah, that's the trap. That name promises something it doesn't do. Read on.",
  ],
  'stress_correct:row-before-rate': ["[warm] Yes. That's why the order you built it in mattered."],
  'stress_wrong:row-before-rate': [
    "[calm] No, and it's worth knowing why. Have a read of the reason underneath.",
  ],

  report_ready: [
    "[excited] Alright, here it is! [pause] Four nodes, no AI, and that mapping. Let's see how you did.",
  ],
};
