// Iris's narration for this problem: per-question, per-node, per-case.
//
// READ .claude/skills/iris-voice/SKILL.md before touching a line. Two rules bite hardest:
// an authored entry REPLACES the generic phrase book for that moment (so a single string
// repeats verbatim every time it fires, which is why `verify_fail` carries several
// wordings and `run_case` carries one), and a copy edit changes the clip's fingerprint,
// so it needs `npm run voice:generate` AND `npm run db:seed` or it looks exactly like a
// broken render.
//
// WHAT THIS CASE'S NARRATION HAS TO GET RIGHT, beyond the shared rules:
//
//   1. THE VOCABULARY IS FIXED, because the sheet's own column names are. "the 07:30
//      sweep", "reorder level" (never "minimum" and never "threshold"), "kg on hand",
//      "the shortlist", "one post, not forty". A synonym here quietly teaches a word the
//      panel does not use.
//   2. THE PER-ITEM RULE IS SAID OUT LOUD, ONCE, AND NOT BEFORE IT IS SAFE. That n8n runs
//      a node once for every item reaching it is the fact this whole case rests on, and
//      withholding it makes a learner guess at mechanics rather than at design. But it is
//      also the correct answer to the `loop-over-items` probe, and `loop-over-items` is
//      pickable in the `shortlist` phase. So it lands on `phase_intro:post` — the first
//      moment that node can no longer be reached for, and the moment the learner needs it.
//      Nothing earlier states it, including `node_placed:filter`, which was rewritten to
//      describe what the filter asks rather than how many times it is asked.
//   3. THREE THINGS ARE NEVER NAMED BEFORE THEY ARE ANSWERED. What the sheet's Operation
//      is set to (it decides whether this node is a step or an ending, so it is the most
//      load-bearing dropdown in the case); the name the gathered list comes out under, and
//      the expression the post reads it back with; and whether the boundary is `<` or `<=`.
//      `verify_fail:google-sheets`, `verify_fail:aggregate` and `verify_fail:filter` point
//      at the marked field and stop, and stay field-agnostic, because the rotation cannot
//      know which of three fields is the red one.
//   4. THE AWKWARD WEDNESDAY IS NEVER PRE-WARNED. Not one line before Stress Testing
//      mentions a blank or a text quantity. That surprise is the best material in the case
//      and a "watch out for empty cells" would spend it.
//   5. THERE IS NO AI STEP, AND SHE DOES NOT SAY SO UNTIL THE END. `basic-llm-chain` is a
//      real pickable distractor with a real probe, so "no AI in this one" up front would
//      be a free placement. `report_ready` is where it is finally said, once everything is
//      graded.
//   6. A WRONG PICK OF `loop-over-items` OR `code` IS TREATED AS A REASONABLE INSTINCT
//      CARRIED OVER FROM ANOTHER LANGUAGE, because it is: both are what you would write in
//      Python. Those are the only two `node_wrong` keys authored; every other wrong node
//      falls back to the shared ten.
//
// LEFT GENERIC ON PURPOSE: `welcome` (saying hello is the same job on every case),
// `idle_nudge`, `phase_complete`, `verify_params` on every node, and both probe verdicts.
// A bespoke version of any of those costs a render and reads no better — and because an
// authored key REPLACES the shared set rather than adding to it, authoring a moment with
// nothing case-specific to say actively reduces the variety a learner hears. `verify_params`
// is the sharpest example: the only two graded settings here are Retry On Fail and Execute
// Once, and anything Iris could add about either tab would be a directional nudge onto an
// unanswered boolean. The shared line names the tab and stops, which is the whole job.
//
// Every line opens with a [tag]. Word caps: 26 on an arrival, 22 elsewhere. No em dashes,
// no `{{ }}`, contractions always, and exclamation marks only on the seven moments that
// have earned one.
export const voice = {
  // ---- arriving, and the quiz -------------------------------------------------
  // The statement is on screen and being read. This is the orientation around it: we're
  // starting, here's the shape of it, here's what to do. It says what the brief is ABOUT
  // rather than what the flow will be, because every step of the flow is a graded question
  // on the next screen.
  problem_intro: [
    "[calm] Okay, let's get started. Forty rows of coffee stock, one spreadsheet, and somebody reading down it every weekday morning. Read it through.",
  ],
  // Does NOT say "there's no AI in this one". That is true, it is one of the things the
  // case teaches, and saying it here hands over the `basic-llm-chain` placement for free.
  understand_start: [
    "[calm] Before we build anything, let's see how you're reading it. Five questions, one for each step of the morning.",
  ],
  // Spoken on ARRIVAL at the summary, which a learner reaches whatever their verdicts were:
  // both quizzes advance on a wrong answer too. So it counts what the morning needs and
  // claims nothing about who got there.
  understand_done: [
    "[excited] Five steps, and you've got the shape of the morning now! [pause] Let's go and build it.",
  ],

  // Per dissection question. `{answer}` is filled from the question's options, and
  // `answer_correct` can only ever be spoken with the CORRECT one, so naming it gives
  // nothing away and makes the verdict about what they actually picked.
  //
  // The wrong-answer lines carry no `{answer}` on purpose. One option in the last question
  // is a sentence ("Nothing, Ritika will check the run"), and a line built around that
  // reads like a broken mail merge. They point at the reasoning instead.

  // Careful here: nothing may say a clock trigger is deaf to what the sheet says. That is
  // half of the `late-correction` Stress Testing answer, three screens early.
  'answer_correct:start': [
    "[warm] Yes, {answer}. Half past seven comes round on its own every weekday, and that's the whole event.",
  ],
  'answer_wrong:start': [
    '[thoughtful] Hmm. Nothing lands in a mailbox here and nobody presses anything. Would that one ever fire?',
    "[calm] Have another look. Ritika does this before the first roast whether or not anybody's asked her to.",
  ],
  'answer_wrong_again:start': [
    "[calm] Let's slow down. Ask what actually happens at half past seven on a morning nobody's touched the sheet.",
  ],

  // Says what the node KNOWS, never what you tell it to do with the tab. The document,
  // the tab and the column names are all locked rows on the panel; the Operation is not.
  'answer_correct:source': [
    "[warm] Right, {answer}. It already knows the document, the tab and the column names, so nobody's writing any of that.",
  ],
  'answer_wrong:source': [
    '[thoughtful] Hmm. Forty rows have to come out of Google and arrive here as items. Would that one manage it?',
    '[calm] Have another look. Whatever you pick has to fetch a table Brightleaf already keeps, and hand it on.',
  ],
  'answer_wrong_again:source': [
    "[calm] Let's slow down. Think about the shape the next step needs: one row at a time, columns intact.",
  ],

  'answer_correct:narrow': [
    '[warm] Exactly, {answer}. Thirty-seven of those rows need nothing at all, and now nothing is what they get.',
  ],
  'answer_wrong:narrow': [
    '[thoughtful] Hmm. Thirty-seven rows are perfectly fine and nobody wants to see them. Where would that one put them?',
    '[calm] Have another look. You want most of these rows to simply stop, not to travel somewhere else.',
  ],
  'answer_wrong_again:narrow': [
    "[calm] Let's slow down. Picture a row that's perfectly stocked arriving at this step. Where does it go from there?",
  ],

  // Says what the RESULT is worth, not how the node does it. "Many items become one" is
  // mechanism, and mechanism is what `fan-out` asks about on the last screen.
  'answer_correct:gather': [
    "[warm] Yes, {answer}. That's the difference between one post and three, and the buyer will notice.",
  ],
  'answer_wrong:gather': [
    '[thoughtful] Hmm. Count what goes into that one and what comes out. You need three in and one out.',
    "[calm] Have another look. There's one stream here, three items on it, and the buyer wants a single message.",
  ],
  'answer_wrong_again:gather': [
    "[calm] Let's slow down. Nothing's being thrown away and nothing's joining from elsewhere. Three items have to become one.",
  ],

  'answer_correct:post': [
    "[warm] Exactly, {answer}. It lands where the buyer already is, before they've thought to go looking.",
  ],
  'answer_wrong:post': [
    '[thoughtful] Hmm. The buyer has until ten to raise the orders. Would they even know that was waiting?',
    "[calm] Have another look. Nobody's opening a document or a database at half past seven in the morning.",
  ],
  'answer_wrong_again:post': [
    "[calm] Let's slow down. Think about where the buyer's already looking at half past seven, and put it there.",
  ],

  // ---- building --------------------------------------------------------------
  build_start: [
    "[calm] Right, five nodes and a straight line. We'll set them up in the order the morning actually runs.",
  ],

  // The phase label and its coach line are both on screen, so these give the thing that is
  // NOT written down.
  //
  // `clock` and `shortlist` are deliberately un-directional: the trigger phase offers four
  // triggers and the interval field is graded, so anything about naming days or about time
  // being an event points straight at an answer. These name the stakes instead.
  'phase_intro:clock': [
    "[calm] This is the 07:30 sweep, and it has to happen whether or not anybody remembers.",
  ],
  'phase_intro:shortlist': [
    '[calm] Two nodes in this part. Forty rows have to get into the flow, and most of them have to leave.',
  ],
  // THE line of the case, and the only place it is safe. `loop-over-items` is pickable in
  // the phase that just closed and its probe's correct answer is this sentence, so saying
  // it any earlier is a freebie. Saying it here is the fact the last phase turns on, and
  // it is not the `fan-out` answer either: that question needs the rule APPLIED to a
  // morning with one row, which is the part left to the learner.
  'phase_intro:post': [
    "[calm] Here's the thing nobody tells you about n8n. Whatever you put next runs once for every item that reaches it.",
  ],

  // Placing a node. They picked it, so naming what it is for reveals nothing. What none of
  // them do is describe a graded field: the sheet's line says "decide what this node does
  // with them" and stops well short of naming the operation.
  'node_placed:schedule': [
    "[calm] That's your way in, and nothing had to arrive for it. Open it up and tell it when.",
  ],
  'node_placed:google-sheets': [
    "[calm] That's Brightleaf's own spreadsheet, all forty rows of it. Open it and decide what this node does with them.",
  ],
  // Rewritten to avoid the per-item rule. "Every row gets asked the same question, one at a
  // time" is the `loop-over-items` probe answer wearing a different hat, and this line fires
  // inside the phase where that node is still pickable.
  'node_placed:filter': [
    '[calm] This is where forty rows become the shortlist. What it asks has to be true of every one of them.',
  ],
  'node_placed:aggregate': [
    "[calm] That's the one that gathers. Whatever's still travelling separately when it gets here comes out together.",
  ],
  'node_placed:slack': [
    "[calm] And that's the post itself. Whatever reaches this node lands in the supply chain channel in front of the buyer.",
  ],

  // The win, once per node. Each names what that node now DOES in this flow, and each is
  // safe to be specific because the learner has just answered every field on it.
  'verify_pass:schedule': [
    "[warm] That's your first node working. The 07:30 sweep starts itself now, and nobody has to remember.",
  ],
  'verify_pass:google-sheets': [
    "[warm] Ah, good. Forty rows of Brightleaf's stock are inside the flow now, one item per line of the tab.",
  ],
  'verify_pass:filter': [
    '[warm] Look at that. Forty rows in, and only the ones under their own reorder level come out.',
  ],
  'verify_pass:aggregate': [
    "[warm] There's your shortlist, all of it inside one item. Whatever comes next only runs once now.",
  ],
  'verify_pass:slack': [
    "[warm] And that's the last piece. One post, not forty, waiting for the buyer before the first roast.",
  ],

  // The most repeated lines in the journey, so they rotate. Every one points at WHICH field
  // to look at and never at what to put in it, and every one stays field-agnostic: the
  // rotation cannot know which of three fields went red, so a line that nudges toward one
  // of them misdirects a learner stuck on another.
  'verify_fail:schedule': [
    "[calm] Ah, not yet. The 07:30 sweep isn't quite what you've described here. Check the marked field.",
    '[thoughtful] Hmm. These fields are read together as one rule, so one wrong one breaks the lot.',
    '[calm] Not right yet. Go back to the brief and read the sentence about when Ritika does this.',
    '[thoughtful] Close. Take the marked field on its own and ask what the roastery actually needs from it.',
    "[calm] Not quite. One of these isn't right for a sweep that has to land before the first roast.",
  ],
  'verify_fail:google-sheets': [
    '[calm] Ah, not yet. Everything after this node only ever sees what this one hands over. Check the marked field.',
    '[thoughtful] Hmm. Read the marked field again, and ask what the next step is meant to be comparing.',
    '[calm] Not right yet. This node decides what the rest of the morning has to work with. Have another look.',
    '[thoughtful] Close. Take the fields on this one from the top, one at a time.',
    '[calm] Not quite. Forty rows have to come out of here for any of the rest to work.',
    '[thoughtful] Hmm. One of these is wrong in a way that still looks fine. Have another look at it.',
  ],
  'verify_fail:filter': [
    "[calm] Ah, not yet. Read the rule in the brief one more time, word by word. It's precise.",
    '[thoughtful] Hmm. Every one of the forty rows gets asked this, so it has to hold on all of them.',
    '[calm] Not right yet. Two of these three are values and one is the comparison. Check the marked one.',
    '[thoughtful] Close. Try the marked field out loud against one real row and hear whether it reads right.',
    '[calm] Not quite. This is the node where the exact wording of the brief matters. Read it again.',
    '[thoughtful] Hmm. One of the three is off. Take them from the top and read each as a sentence.',
  ],
  'verify_fail:aggregate': [
    '[calm] Ah, not yet. Look at the marked field and ask what shape the post needs the shortlist in.',
    '[thoughtful] Hmm. Have another look at the marked field. The two decisions on this node are tied together.',
    "[calm] Not right yet. Fix it, then read this node's Output pane and the next node's Input pane.",
    '[thoughtful] Close. Take the two fields on this node one at a time, starting with the top one.',
    '[calm] Not quite. Three rows go in here and one thing has to come out. Check the marked field.',
  ],
  'verify_fail:slack': [
    '[calm] Ah, not yet. Have a look at the Input pane before you answer this one again.',
    '[thoughtful] Hmm. Ask what actually reaches this node, rather than what was sitting on a row further back.',
    '[calm] Not right yet. Read the marked field again, thinking about who opens this at half past seven.',
    '[thoughtful] Close. This is the only part of the whole flow that anybody ever sees. Have another look.',
  ],

  // The wrong node, on the canvas — keyed, so only the two picks that deserve their own
  // reaction get one. Both are what you would write in Python, and the brief is explicit
  // that they should be met as instincts carried over rather than as silly mistakes. Every
  // other wrong node keeps the shared ten wordings, which say the job better than a
  // paraphrase would.
  //
  // Neither names the right node, and neither says what the wrong one does: the probe that
  // opens a second later is the thing that asks.
  'node_wrong:loop-over-items': [
    "[thoughtful] Ah. That's exactly what you'd write in Python, and it's a fair instinct. Let me ask you something.",
    "[calm] Hold on. Coming from any other language you'd reach for that, and so would I. One question first.",
    "[thoughtful] Hmm. That's not a silly answer at all. But answer me this before you try again.",
  ],
  'node_wrong:code': [
    '[thoughtful] Ah. Writing this out by hand is a completely fair instinct. One question before you try again.',
    "[calm] Hold on. That's what you'd reach for in Python, and you wouldn't be wrong there. Let's think about here.",
    "[thoughtful] Hmm. Nothing silly about that pick. There's something about this flow worth checking first, though.",
  ],

  build_complete: [
    "[excited] That's the whole sweep wired up! [pause] Let's put a couple of real mornings through it.",
  ],

  // ---- running ---------------------------------------------------------------
  run_start: [
    "[calm] Right, let's see if it holds up. Two mornings off the Stock tab, one at a time.",
  ],

  // Both OPEN ON THE TRIGGER, because the clock is the node sitting on their canvas and it
  // is why this morning is entering their flow at all. Neither says where anything lands,
  // and neither repeats the run card's own subject line back at them.
  'run_case:tuesday': [
    "[calm] Okay, here's the first. It's 07:30 on Tuesday, the schedule fires, and the Stock tab comes in.",
  ],
  // The boundary morning. Points at the row and stops: whether it belongs on the shortlist
  // is the argument they already committed to in the filter, and saying which way it goes
  // would grade their own answer back to them before the run does.
  'run_case:boundary': [
    '[calm] Then Thursday. The clock fires again, the same forty rows come in, and one of them is right on the line.',
  ],

  // Says what the number counts, and says it first, because a learner can click past the
  // clip and the meaning has to be in the opening clause. Neither line claims the whole job
  // is done: what happens on a morning with eleven low beans, and on one with none, are
  // both still open questions on the next screen.
  run_pass: [
    "[excited] Both mornings came through your flow! [pause] That's five nodes doing their jobs in order.",
    '[excited] Two sweeps, and both held up! [pause] The straight line you built does what it says.',
  ],
  run_fail: [
    "[calm] Hmm. Some of those didn't come out right. Let's follow one and see where it stopped.",
    "[calm] Ah. Something didn't land the way it should. Walk the flow again from the clock.",
  ],

  // ---- the end ---------------------------------------------------------------
  stress_start: [
    "[excited] Lovely! [pause] Now let's stress test it. What does yours do on a morning that isn't a normal one?",
  ],

  // Per question. These react and point, and never restate the answer: the written verdict
  // beside the options already explains it, and repeating it is reading the screen.
  'stress_correct:fan-out': [
    "[warm] Yes. That's the one worth carrying out of here, and you saw it.",
  ],
  'stress_wrong:fan-out': [
    '[thoughtful] Hmm, not that. Read it through, because this is the one the whole case is built on.',
  ],
  // Points at the habit the explanation ends on, without naming what the channel shows.
  'stress_correct:quiet-friday': [
    "[warm] Right. Read it anyway, there's a habit in there worth stealing.",
  ],
  'stress_wrong:quiet-friday': [
    "[thoughtful] Ah, not quite. Read it through, then ask how you'd ever have noticed.",
  ],
  'stress_correct:uncounted': [
    "[warm] Yes. That's the whole of that Wednesday, and it isn't obvious. Read the rest of it.",
  ],
  'stress_wrong:uncounted': [
    '[thoughtful] Hmm, no. Read it properly. This is the most interesting mistake in the whole case.',
  ],
  'stress_correct:late-correction': [
    "[warm] Right. You held three separate facts together to get there, and that's the hard bit.",
  ],
  'stress_wrong:late-correction': [
    "[calm] Ah, that's the guess most people make. It's a fair one. Read on.",
  ],

  // Finally safe to say there was no model in any of it: everything is graded by now.
  report_ready: [
    "[excited] Alright, here it is! [pause] Five nodes, no AI anywhere, and one post instead of forty. Let's see how you did.",
  ],
};
