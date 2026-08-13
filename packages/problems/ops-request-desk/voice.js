// Iris's narration for this problem: per-question, per-node, per-case.
//
// READ .claude/skills/iris-voice/SKILL.md before touching a line. Two rules bite hardest:
// an authored entry REPLACES the generic phrase book for that moment (so a single string
// repeats verbatim every time it fires, which is why `verify_fail` carries several
// wordings and `run_case` carries one), and a copy edit changes the clip's fingerprint,
// so it needs `npm run voice:generate` AND `npm run db:seed` or it looks exactly like a
// broken render.
//
// WHAT THIS CASE'S NARRATION MUST NOT GIVE AWAY:
//
//   1. WHICH NODE READS THE REQUEST. Classifier-versus-extractor is the best decision in
//      the case and the learner has to walk into it. No line before that pick may say the
//      reading step returns several values, or that it does two jobs in one call. After a
//      wrong pick she may ask what the spreadsheet needs that a label alone won't give.
//   2. THE CHANNEL. `#ops-desk` is the correct option on a graded four-option dropdown, so
//      the string never appears here at all. "The channel Priya already watches" is the
//      vocabulary, and even the lines that fire AFTER that field is answered avoid it, so
//      no reordering of the journey can turn one of them into a leak.
//   3. THE WORD "DELETE", in connection with the awkward request. `run_case:deletion`
//      describes what Arjun's sentence CONTAINS and stops. What the desk cannot do is a
//      Stress Testing answer.
//   4. ANY STILL-OPEN NODE ANSWER. Node names appear only in `node_placed` and
//      `verify_pass`, where the learner has already placed the thing being named.
//
// WHAT SHE IS HERE TO SAY, and where each one lands:
//
//   * The Ops Log’s six columns come from two places, two typed into the form and four
//     worked out of the sentence: `node_placed:google-sheets`, `verify_pass:google-sheets`,
//     `verify_fail:google-sheets`, `answer_wrong_again:read`, `report_ready`.
//   * "The person who asked" and "the person this is about" are two people, and both have
//     an address: `node_placed:gmail`, `verify_pass:gmail`, `verify_fail:gmail`,
//     `run_case:quote`, `run_case:audit`.
//   * The needs-a-human path does less than it could ON PURPOSE: `answer_correct:escalate`,
//     `node_placed:slack`, `verify_pass:slack`, `phase_intro:route`.
//
// LEFT GENERIC ON PURPOSE: `welcome` (saying hello is the same job on every case),
// `idle_nudge`, `phase_complete`, `verify_params` on every node, `node_wrong`, and both
// probe verdicts. An authored key REPLACES the shared set rather than adding to it, so
// authoring a moment with nothing case-specific to say costs renders AND cuts the variety
// a learner hears. Two are worth spelling out:
//
//   * `verify_params` — the only graded Settings tab in this case is the split's
//     `alwaysOutputData`, whose correct answer is to leave it off and whose NAME is the
//     only argument for turning it on. Anything Iris added here would be a directional
//     nudge on an unanswered boolean. The shared line names the tab and stops.
//   * `node_wrong` — this case grades WHICH node, not the order it goes in, so every
//     wording that fits is a wording of "that one can't do this job", which is what the
//     shared ten already say, better and for free.
//
// Every line opens with a [tag]. Word caps: 26 on an arrival, 22 elsewhere. No em dashes,
// no `{{ }}`, contractions always, and exclamation marks only on the moments that earn one.
export const voice = {
  // ---- arriving, and the quiz -------------------------------------------------
  // The statement is on screen and being read, so this is the orientation around it:
  // we're starting, here's the shape of it, here's what to do with it.
  problem_intro: [
    "[calm] Okay, let's get started. One form at Fernwood, and everything that isn't engineering or sales arrives through it. Read it through once.",
  ],
  // Says how many decisions are coming, and nothing about what any of them needs.
  understand_start: [
    "[calm] Before we build anything, let's see how you're reading it. Four steps, and each one needs something that can actually do it.",
  ],
  // Spoken on ARRIVAL at the summary, which a learner reaches whatever their verdicts
  // were: the quiz advances on a wrong answer too. So it counts what the flow needs and
  // claims nothing at all about who got there.
  understand_done: [
    "[excited] That's the shape of it, four steps and three ways out! [pause] Now let's go and build the thing.",
  ],

  // ---- per dissection question -----------------------------------------------
  // `{answer}` is filled from the question's options, and `answer_correct` can only ever
  // be spoken with the CORRECT one, so naming it there gives nothing away and makes the
  // verdict about what they actually picked.
  //
  // The wrong-answer lines carry no `{answer}` on purpose. The escalate question offers
  // "Nothing, it stops here and Priya will spot it" as an option, and a line built around
  // that label reads like a broken mail merge; the label also contains an em dash, which
  // does not read aloud.
  'answer_correct:intake': [
    '[warm] Yes. {answer} fires the moment somebody presses submit, and it knows all three answers by name.',
  ],
  'answer_wrong:intake': [
    "[thoughtful] Hmm. Somebody's just pressed submit on a form Priya built in here. Would that one notice?",
    '[calm] Have another look. That form lives inside this tool, and nothing outside it knows the form exists.',
  ],
  'answer_wrong_again:intake': [
    '[calm] Ask what begins this. Nobody is watching for requests, and nothing else is going to announce one.',
  ],

  // The case's best decision. Not one of these names the node, and the two wrong-answer
  // lines do the job the spec asks for: point at the destination's needs, not the
  // decision's.
  'answer_correct:read': [
    '[warm] Right. {answer} reads that sentence once and hands back several named values at a time.',
  ],
  'answer_wrong:read': [
    '[thoughtful] Hmm. Deciding which of the three kinds it is only gets you halfway. What fills the rest?',
    "[calm] Read the Ops Log’s six headings again. What would you put under Subject Name with only a label?",
  ],
  'answer_wrong_again:read': [
    '[calm] Look at what the destination needs, not just what the decision needs. Four of those columns come from the sentence.',
  ],

  'answer_correct:route': [
    '[warm] Exactly. {answer} takes one request in and sends it out down one path of three.',
  ],
  'answer_wrong:route': [
    '[thoughtful] Hmm. Count the ways out that one gives you. Three kinds of request need three separate paths.',
    '[calm] Have another look. None of the three may be dropped on the floor, including the awkward ones.',
  ],
  'answer_wrong_again:route': [
    '[calm] One request goes in, and exactly one path takes it out. Count the ways out each option offers.',
  ],

  'answer_correct:record': [
    '[warm] Yes. {answer} adds a line under headings Priya already has, instead of starting somewhere new.',
  ],
  'answer_wrong:record': [
    '[thoughtful] Hmm. The Ops Log already exists, headings in place, rows going back two years. Would that add to it?',
    '[calm] Have another think. Priya works in that file every day, so a second place to keep things helps nobody.',
  ],
  'answer_wrong_again:record': [
    '[calm] Ask what shape the Ops Log is. One line per request, each value under its own heading.',
  ],

  'answer_correct:send': [
    "[warm] Right. {answer} puts a message in somebody's inbox, even somebody who's never heard of Fernwood.",
  ],
  'answer_wrong:send': [
    '[thoughtful] Hmm. The person this message is for might not work at Fernwood at all. Would that reach them?',
    "[calm] Have another look. All you have for them is an address, sitting inside somebody else's sentence.",
  ],
  'answer_wrong_again:send': [
    '[calm] Think about where a stranger actually reads things. An address is the only way you have to them.',
  ],

  // Names the restraint, on the question where the restraint is the answer.
  'answer_correct:escalate': [
    '[warm] Yes. {answer} puts it in front of Priya, and notice this path does nothing else at all.',
  ],
  'answer_wrong:escalate': [
    '[thoughtful] Hmm. Priya spends her whole day in one place. Does that put anything in front of her there?',
    "[calm] Have another think. Filing it somewhere she'd have to remember to go and look isn't reaching her.",
  ],
  'answer_wrong_again:escalate': [
    "[calm] Somebody's waiting on a person here, not on a machine. What lands where that person is already reading?",
  ],

  // ---- building ---------------------------------------------------------------
  build_start: [
    "[calm] Right, you've got your nodes. Now let's set each one up, in the order a request travels.",
  ],

  // The phase label and its coach line are both on screen, so these give the question to
  // hold in your head instead, and never the node that answers it.
  'phase_intro:intake': [
    '[calm] Somebody at Fernwood has just pressed submit. What hears that, and what does it know about them?',
  ],
  'phase_intro:read': [
    '[calm] One box of free text, and four separate things have to come out of it. What can do that?',
  ],
  'phase_intro:route': [
    '[calm] Three ways out from here, and each one does its own single job. Nothing more than that.',
  ],

  // ---- placing a node ---------------------------------------------------------
  // They picked it, so naming what it does reveals nothing, and it is the difference
  // between "now configure it" and teaching.
  'node_placed:form-trigger': [
    "[calm] That's the way in. It publishes the Ops Desk request, so all three answers arrive with names on them.",
  ],
  'node_placed:information-extractor': [
    '[calm] This is the step that reads what they wrote. It borrows a model to think with.',
  ],
  'node_placed:openai-chat-model': [
    "[calm] That's the brain the reading step borrows. How you set it up decides how steady its answers are.",
  ],
  'node_placed:switch': [
    "[calm] Here's where the three kinds of request come apart. Each rule you add is one more way out.",
  ],
  'node_placed:google-sheets': [
    "[calm] This one writes the Ops Log row. Six headings, and they don't all come from the same place.",
  ],
  'node_placed:gmail': [
    '[calm] The message itself. This item carries two addresses, and only one of them belongs in here.',
  ],
  'node_placed:slack': [
    '[calm] The path for a person. Watch how little this one does, because that restraint is the point.',
  ],

  // ---- the win, once per node -------------------------------------------------
  // Each names what that node now DOES in this flow, which is the thing the screen never
  // says. The channel is not named on the Slack one, on purpose: see the header.
  'verify_pass:form-trigger': [
    "[warm] That's your first node working. Every Ops Desk request starts a run now, with all three answers on it.",
  ],
  'verify_pass:information-extractor': [
    "[warm] Ah, that one's the whole idea. One read of the sentence, and four named values come back.",
  ],
  'verify_pass:openai-chat-model': [
    "[warm] That's done. That setting is the difference between an Ops Log Priya trusts and a coin toss.",
  ],
  'verify_pass:switch': [
    "[warm] Okay. Three ways out, and you decided every one of them. That's your routing done.",
  ],
  'verify_pass:google-sheets': [
    '[warm] Look at that. Two answers off the form, four worked out of the sentence, every one in its own column.',
  ],
  'verify_pass:gmail': [
    '[warm] And that lands with the person the request was about, not the one who filled the form in.',
  ],
  'verify_pass:slack': [
    "[warm] There's the last piece. Priya gets the name and their own words, and nothing else happens to that request.",
  ],

  // ---- not right yet ----------------------------------------------------------
  // The most repeated lines in the journey, so they rotate. Every one points at WHICH
  // field to look at and never at what to put there. On a node with more than one graded
  // field the rotation stays field-agnostic, because it cannot know which one is red.
  'verify_fail:form-trigger': [
    "[calm] Ah, not yet. Look again at which answers you're insisting on before the form can be sent.",
    '[thoughtful] Hmm. Ask what the Ops Log row and the message to Priya both need off this form.',
    '[calm] Not right yet. Some blanks this flow could live with, and some empty it out entirely.',
    '[thoughtful] Close. Three short questions on that form. Which of them could this flow do without?',
  ],
  'verify_fail:information-extractor': [
    '[calm] Ah, not yet. Take the two decisions on this node one at a time, starting at the top.',
    '[thoughtful] Hmm. Of the three answers that form collects, only one has anything to work out in it.',
    '[calm] Not right yet. Ask what should come back when a request is neither of the two obvious kinds.',
    "[thoughtful] Close. Every submission has to get read, not only the one you're looking at now.",
    "[calm] Not quite. Read the marked field again, and what it's really asking you for.",
  ],
  'verify_fail:openai-chat-model': [
    '[thoughtful] Hmm. [pause] Not yet. Should the same request be read the same way twice?',
    "[calm] Not right yet. Priya's going to trust rows on the strength of this. What does that need?",
    "[thoughtful] Have another look. That setting decides how much it's allowed to improvise.",
    '[calm] Not quite. Two people sending the same sentence should get the same answer back.',
  ],
  // A rule list is graded on three aspects, so one imperfect list can fail this several
  // times over. Eight wordings for that reason, none of them naming a value.
  'verify_fail:switch': [
    '[calm] Ah, not yet. Count your ways out against the answers the reading step is allowed to give.',
    '[thoughtful] Hmm. One of those rules is testing the wrong thing. Read them one row at a time.',
    '[calm] Not right yet. An output only ever fires if something upstream produces the value it tests for.',
    '[thoughtful] Close. Read your rules back against the values the reading step is asked to produce.',
    '[calm] Not quite. The name on the wire is there for you. Look at what is actually being matched.',
    '[thoughtful] Hmm. Ask how exact each of these tests is, and what else one of them might catch.',
    '[calm] Not yet. Take one rule at a time and follow a single request the whole way through it.',
    '[thoughtful] Have another look. A way out that nothing can ever travel down is worth spotting now.',
  ],
  // The centrepiece. Eight wordings, and two of them carry the thing this case exists to
  // teach: two sources, and two different people.
  'verify_fail:google-sheets': [
    '[calm] Ah, not yet. Count your entries against the headings the Requests sheet actually has.',
    "[thoughtful] Hmm. One row's got the wrong thing under its heading. Read them from the top down.",
    '[calm] Not right yet. Two of these the requester typed in. The other four had to be worked out.',
    "[thoughtful] Close. The person who asked and the person it's about are two different people here.",
    '[calm] Not quite. Check each heading you typed against the column list on the panel above.',
    "[thoughtful] Hmm. A heading this sheet doesn't have writes nothing at all, and nothing warns you.",
    '[calm] Not yet. Read your list back as one row landing on the Ops Log. Where does it break?',
    '[thoughtful] Have another look. Both of those people have a name and an address on this item.',
  ],
  'verify_fail:gmail': [
    "[calm] Ah, not yet. Two addresses on this item. Read the request again and ask who it's for.",
    '[thoughtful] Hmm. This item carries two people. Which of them is this message actually for?',
    '[calm] Not right yet. Take the two decisions on this one at a time, starting with who it reaches.',
    '[thoughtful] Close. Read what you are sending the way the person receiving it would read it.',
    "[calm] Not quite. Have another look at the marked field, and what it's really being asked for.",
  ],
  'verify_fail:slack': [
    '[calm] Ah, not yet. Ask where this lands, and whether anybody would ever act on it there.',
    "[thoughtful] Hmm. Priya's the one making the judgement now. What does she need in order to make it?",
    '[calm] Not right yet. Two decisions on this one: where it goes, and what it says when it gets there.',
    '[thoughtful] Close. A message nobody is reading is very close to no message at all.',
    "[calm] Not quite. Read the marked field again, thinking about what happens to this request next.",
  ],

  build_complete: [
    "[excited] The whole desk is wired up! [pause] Let's push some real requests through it and see.",
  ],

  // ---- running ----------------------------------------------------------------
  run_start: [
    "[calm] Right, let's see if what you built holds up. Seven real Ops Desk requests, one after another.",
  ],

  // Every one OPENS ON THE TRIGGER, because the form is the node sitting on their canvas:
  // somebody submits, and then what they wrote. None of them says where it lands, because
  // watching that happen is the whole point of the run.
  'run_case:lead': [
    "[calm] Okay, here's the first. Arjun submits the form about a distributor lead, with her company and her address inside.",
  ],
  'run_case:feedback': [
    '[calm] Right, next. Deepa submits some customer feedback, one long comma heavy sentence with an apostrophe in the name.',
  ],
  // The pair that teaches the requester-versus-subject bug: one crosses a company
  // boundary and one does not. The lines point at the contrast and stop.
  'run_case:quote': [
    '[calm] Now Deepa submits another, and the address written inside it sits at a completely different company.',
  ],
  'run_case:audit': [
    "[calm] Then Neha submits one, and this time the address inside it is a colleague's at Fernwood.",
  ],
  'run_case:question': [
    '[calm] Next, Tom submits the form just to ask what the desk can actually do for him.',
  ],
  // The awkward one. What it CONTAINS, and not a word about what it asks for.
  'run_case:deletion': [
    '[calm] Then Arjun again, and his request names the Ops Log and mentions a mail in the same sentence.',
  ],
  // The deliberate gap: this one matches no rule. Point at it and leave it there, because
  // where it ends up is the first Stress Testing answer.
  'run_case:both-at-once': [
    '[calm] And the last one. Meera submits a request that asks for two things at once. Keep an eye on this one.',
  ],

  // Says what the number counts and says it first, because a learner can click past the
  // clip. Neither line claims every request ended up somewhere: one of the seven matches
  // no rule, and that is the next screen's question.
  run_pass: [
    "[excited] All your test cases passed! [pause] Three ways out, and each of them did its own job.",
    "[excited] Every test case passed! [pause] That's seven nodes, and not one doing somebody else's work.",
  ],
  run_fail: [
    "[calm] Hmm. Some of those didn't land where they should. Let's follow one and see where it turned.",
    "[calm] Ah. Something's off. Pick one that missed, and watch which way it went at the split.",
  ],

  // ---- the end ----------------------------------------------------------------
  stress_start: [
    "[excited] Lovely! [pause] Now let's stress test it. What does yours do with a request it can't place?",
  ],

  // Per question. These react and point, and never restate the answer: the written verdict
  // beside the options already explains it, and repeating it is reading the screen.
  'stress_correct:unmatched-type': [
    "[warm] Yes, exactly. It's the quiet failures that are worth knowing about.",
  ],
  'stress_wrong:unmatched-type': [
    '[thoughtful] Hmm, not that one. Read what really happens, because none of it is loud.',
  ],
  'stress_correct:deletion-as-log': [
    '[warm] Right. You could see what doing the nearest thing it can do would cost.',
  ],
  'stress_wrong:deletion-as-log': [
    "[calm] No, and it's worth knowing why. Have a read of the reason underneath.",
  ],
  'stress_correct:requester-vs-subject': [
    '[warm] Yes. The bug that works is always the expensive one.',
  ],
  'stress_wrong:requester-vs-subject': [
    "[thoughtful] Ah, that's the trap. Read what would actually arrive, and in whose inbox.",
  ],

  report_ready: [
    "[excited] Alright, here it is! [pause] Seven nodes, three ways out, and that six column mapping. Let's see how you did.",
  ],
};
