// Iris's narration for this problem: per-question, per-node, per-case.
//
// READ .claude/skills/iris-voice/SKILL.md before touching a line. Two rules bite hardest:
// an authored entry REPLACES the generic phrase book for that moment (so a single string
// repeats verbatim every time it fires, which is why `verify_fail` carries several wordings
// and `run_case` carries one), and a copy edit changes the clip's fingerprint, so it needs
// `npm run voice:generate` AND `npm run db:seed` or it looks exactly like a broken render.
//
// WHAT THIS CASE'S NARRATION HAS TO GET RIGHT, beyond the shared rules:
//
//   1. THE AWKWARD WEATHER CODE IS NEVER NAMED, AND NEVER HINTED AT BEFORE THE MAPPING IS
//      BUILT. No line anywhere says "thunderstorm", says a number, or says "watch out for
//      codes you haven't listed". A learner discovering their own lookup table has a hole in
//      it is the only genuinely interesting moment in the case, and one careless line spends
//      it. That includes `verify_fail:edit-fields`, which was written twice: the first pass
//      had "think about a morning that isn't the one in the Input pane", which is the same
//      warning wearing a coat. The field's own `why` already asks that question, at the only
//      moment it is fair to ask it, which is after an answer has been given.
//   2. NOTHING SAYS `if` IS THE WRONG ANSWER. It is pickable in the last phase and it is the
//      strongest wrong instinct in the case, so `node_wrong:if` is deliberately NOT authored:
//      the shared wording marks the moment without diagnosing, and the probe does the
//      teaching. `phase_intro:message` was rewritten for the same reason. "The destination
//      never changes" is the `two-paths` Stress Testing answer in the author's own words.
//   3. NOTHING SAYS WHETHER THE TEMPERATURE OR THE CODE DRIVES THE NOTE. Two of the four
//      mornings share a weather code and differ only in temperature, and noticing that is
//      theirs. `run_case:clear-hot` describes the heat and stops; it does not put the two
//      mornings side by side.
//   4. THE VOCABULARY IS FIXED: "weather code" (never "condition id" or "status"), "the
//      mapping", "the fallback", "9 AM", "#commute", "one line, every morning". Nothing here
//      says "the fallback" out loud yet, because the only safe moment to would be after the
//      mapping verifies, and there the field's own explanation says it better.
//   5. THE ONE FACT SHE SHOULD SAY EARLY, SHE SAYS TWICE, IN THE RIGHT TWO PLACES. That the
//      service answers in numbers and an integer rather than in sentences is what the whole
//      case rests on, and withholding it only makes the learner guess whether there is prose
//      to interpret. It lands on `phase_intro:ask` as an expectation, and on
//      `verify_pass:http-request` as a fact with the Output pane sitting there proving it.
//      Neither is a leak: the graded decision on that node is which question the address
//      asks, not what shape the answer comes back in.
//   6. `code` AND THE AI STEPS ARE MET AS INSTINCTS CARRIED OVER, NOT AS SILLY MISTAKES.
//      Writing a fetch call is exactly what you would do in Python, and reaching for a model
//      is what anyone taught that the model is the interesting part would do. Those are the
//      only `node_wrong` keys authored. The three AI keys deliberately share one wording,
//      because it is one instinct met three ways: identical text collapses onto one rendered
//      file, so three keys cost three clips rather than nine.
//
// LEFT GENERIC ON PURPOSE: `welcome` (saying hello is the same job on every case),
// `idle_nudge`, `phase_complete`, `verify_params` on all four nodes, both probe verdicts, and
// `node_wrong` on every distractor except the four above. An authored key REPLACES the shared
// set rather than adding to it, so authoring a moment with nothing case-specific to say
// actively reduces the variety a learner hears. `verify_params` is the sharpest example: the
// only graded setting in this case is Retry On Fail on the call, and anything Iris could add
// about that tab is a directional nudge onto an unanswered boolean whose honest hint is
// already printed beside it. The shared line names the tab and stops, which is the whole job.
//
// Every line opens with a [tag]. Word caps: 26 on an arrival, 22 elsewhere. No em dashes, no
// `{{ }}`, contractions always, and exclamation marks only on the seven moments that have
// earned one.

// One instinct, three nodes. `text-classifier`, `basic-llm-chain` and `information-extractor`
// are all reached for by the same learner having the same thought, so they share a wording
// rather than getting three paraphrases of it. Neither names the right node and neither says
// what the wrong one does: the probe that opens a second later is the thing that asks.
const REACHED_FOR_A_MODEL = [
  "[thoughtful] Ah. You've been taught the model is the interesting part. Let me ask you something first.",
  "[calm] Hold on. That's a reasonable place to reach, and it's worth knowing why it doesn't fit. One question.",
  "[thoughtful] Hmm. Not a silly pick. But there's a question about this flow I want you to answer.",
];

export const voice = {
  // ---- arriving, and the quiz -------------------------------------------------
  // The statement is on screen and being read, so this is the orientation around it: we're
  // starting, here's what it's about, here's what to do. It gives the hook rather than the
  // shape of the flow, because every step of the flow is a graded question on the next screen.
  problem_intro: [
    "[calm] Okay, let's get started. The same ten seconds of work every morning, half out the door, forever. Read it through.",
  ],
  understand_start: [
    "[calm] Before we build anything, I want to hear how you're reading this. Four steps, four questions, no canvas yet.",
  ],
  // Spoken on ARRIVAL at the summary, which a learner reaches whatever their verdicts were:
  // the quiz advances on a wrong answer too. So it says where they are and claims nothing
  // about how they did.
  understand_done: [
    "[excited] That's the shape of it, four steps in a straight line! [pause] Now let's go and build the thing.",
  ],

  // Per dissection question. `{answer}` is filled from the question's options, and
  // `answer_correct` can only ever be spoken with the CORRECT one, so naming it gives nothing
  // away and makes the verdict about what they actually picked.
  //
  // The wrong-answer lines carry no `{answer}` on purpose. Each one has to serve three very
  // different wrong picks, and a line built around a node's name reads like a broken mail
  // merge when the name is "RSS Feed Trigger". They point at the reasoning instead.

  // Careful here: nothing may say the clock fires whether or not the service answers. That is
  // half of the `service-down` Stress Testing answer, three screens early.
  'answer_correct:start': [
    "[warm] Yes, {answer}. 9 AM comes round on its own every morning, and that's the whole event.",
  ],
  'answer_wrong:start': [
    "[thoughtful] Hmm. Nobody's asking for this and nothing's being sent to it. What's left to set it off?",
    "[calm] Have another look. He leaves at the same time whether or not anything's happened anywhere.",
  ],
  'answer_wrong_again:start': [
    "[calm] Let's slow down. Ask yourself what actually happens at 9 AM on a morning nobody's touched anything.",
  ],

  // Says nothing about the method or the address, both of which are graded fields on this node
  // minutes later. The angle is pull rather than push, which is the thought the question is
  // actually testing.
  'answer_correct:ask': [
    "[warm] Yes, {answer}. Nothing arrived here, so somebody has to go out and ask. That's this node's whole job.",
  ],
  'answer_wrong:ask': [
    '[thoughtful] Hmm. The service is sitting at a plain web address waiting to be asked. Would that one manage it?',
    "[calm] Have another look. Whatever you pick has to reach out to somebody else's service and bring back JSON.",
  ],
  'answer_wrong_again:ask': [
    "[calm] Let's slow down. There's no login and no n8n app for this. It's just an address on the internet.",
  ],

  // Says what the step is FOR and never what to put in it. No line here mentions routing,
  // because "there's nothing to route" is the `two-paths` answer and the wrongHint on screen
  // has already said it once, which is enough.
  'answer_correct:shape': [
    "[warm] Yes, {answer}. That's where the integer stops being an integer and starts being something he can read.",
  ],
  'answer_wrong:shape': [
    "[thoughtful] Hmm. Two sentences have to exist that don't exist yet. Which of those would write them?",
    "[calm] Have another look. The service already answered exactly, so nothing's left to work out. Something has to be built.",
  ],
  'answer_wrong_again:shape': [
    "[calm] Let's slow down. Picture the finished post in his hand. Where did those two sentences come from?",
  ],

  'answer_correct:send': [
    "[warm] Exactly, {answer}. One line, in a room he's already in, at ten to nine.",
  ],
  'answer_wrong:send': [
    "[thoughtful] Hmm. Anything he has to go and open is a thing he'll stop bothering with. Think again.",
    '[calm] Have another look. If reading it takes more effort than the weather app did, he goes back to the app.',
  ],
  'answer_wrong_again:send': [
    "[calm] Let's slow down. Ask what he's actually holding at ten to nine, and what's already on it.",
  ],

  // ---- building --------------------------------------------------------------
  build_start: [
    "[calm] Right, you've got your nodes. Now we build, in the order the morning actually runs. Four steps, one straight line.",
  ],

  // The phase label and its coach line are both on screen, so these give the thing that is
  // NOT written down.
  //
  // `clock` stays un-directional: four triggers are pickable here and the hour is graded, so
  // anything about time being an event points straight at an answer. It names the stakes.
  'phase_intro:clock': [
    "[calm] This one has to happen every morning whether or not he remembers, and before he's out of the door.",
  ],
  // The fact the case rests on, said as an expectation before the call is even placed. It is
  // not an answer to anything graded on this node, and it heads off a learner wondering
  // whether there's prose in there somewhere to interpret.
  'phase_intro:ask': [
    '[calm] Whatever comes back here is numbers and codes, not sentences. Nobody wrote you a paragraph about the weather.',
  ],
  // Deliberately says nothing about what varies between a rainy morning and a clear one. The
  // phase's own coach line asks that question, and answering it here would be the `two-paths`
  // Stress Testing answer one screen early.
  'phase_intro:message': [
    '[calm] Two nodes left, and everything he ever sees comes out of these two. The rest of it is invisible.',
  ],

  // Placing a node. They picked it, so naming what it is for reveals nothing. None of them
  // describes a graded field: `edit-fields` in particular says "each value you build" rather
  // than how many, because the number of values is one of the three scored items on it.
  'node_placed:schedule': [
    "[calm] There's your starting point. Nothing sends it anything, so open it and tell it what time to wake up.",
  ],
  'node_placed:http-request': [
    '[calm] This is the node that leaves the building. Nothing arrived, remember, so it has to go and fetch.',
  ],
  'node_placed:edit-fields': [
    "[calm] Here's where the numbers turn into English. Open it and decide what each value you build should say.",
  ],
  'node_placed:slack': [
    "[calm] And that's the post itself. Whatever reaches this node is what he reads with one shoe on.",
  ],

  // The win, once per node. Each names what that node now DOES in this flow, and each is safe
  // to be specific because the learner has just answered every field on it.
  'verify_pass:schedule': [
    "[warm] That's your first node working. 9 AM starts the whole thing now, and nobody has to remember.",
  ],
  // The second and better home for the "numbers, not sentences" fact: the Output pane is
  // sitting right there proving it, which is worth more than being told.
  'verify_pass:http-request': [
    "[warm] Ah, good. This morning's forecast is inside the flow now: a temperature, a weather code, and no sentences.",
  ],
  // Says what came out and stops. What makes the winning expression survivable is written in
  // that field's own explanation, and it is also the `blank-note` Stress Testing answer.
  'verify_pass:edit-fields': [
    '[warm] Look at that. An integer went in, and two lines somebody can read on a pavement came out.',
  ],
  'verify_pass:slack': [
    "[warm] And that's the last piece. One line lands in #commute every morning, and he never looks anything up again.",
  ],

  // The most repeated lines in the journey, so they rotate. Every one points at WHICH field to
  // look at and never at what to put in it, and the multi-field nodes stay field-agnostic: the
  // rotation cannot know which field went red, so a line that nudges toward one misdirects a
  // learner stuck on another. That matters most on the call, where Settings is locked until
  // Parameters verify green, so a nudge about a setting is a nudge at a tab they cannot open.
  'verify_fail:schedule': [
    "[calm] Ah, not yet. The time's in the brief, in the second paragraph. Read it back off that.",
    '[thoughtful] Hmm, not right yet. Have another look at the number, and at what a twenty-four hour clock does to it.',
    "[calm] Not quite. Ask when he's still in the house, and work back from that.",
    "[thoughtful] Close. One number, and it's stated outright in the brief. Go and find the sentence.",
  ],
  'verify_fail:http-request': [
    '[calm] Ah, not yet. Check the marked field. Everything after this node only ever sees what this one brings back.',
    "[thoughtful] Hmm. Read the marked field again, and ask what you'd want the answer to contain.",
    "[calm] Not right yet. One of these describes a different question to the one he's asking. Have a look.",
    '[thoughtful] Close. Take the marked field on its own and read it out loud, slowly.',
    "[calm] Not quite. The whole request is a question, so check what this one's actually asking for.",
    '[thoughtful] Hmm. Some of these would succeed and still tell you nothing. Read the marked one again.',
  ],
  'verify_fail:edit-fields': [
    '[calm] Ah, not yet. Look at the Input pane and read the shape of what actually arrived here.',
    '[thoughtful] Hmm. Read the flagged row back as a sentence, and hear whether it says something useful.',
    '[calm] Not right yet. Work backwards from the post he reads. What does it have to say?',
    "[thoughtful] Close. Every row's checked on its own, so take the flagged one by itself.",
    '[calm] Not quite. This is the only step that decides what the message says. Read that row again.',
  ],
  'verify_fail:slack': [
    '[calm] Ah, not yet. Open the Input pane first, and see what the step before actually handed over.',
    "[thoughtful] Hmm. Ask who's reading this, and where they'd be standing when it turns up.",
    '[calm] Not right yet. Read the marked field again, thinking about ten to nine on a Tuesday.',
    '[thoughtful] Close. Everything upstream is invisible. This is the bit with his name on it, so look again.',
  ],

  // The wrong node, on the canvas, keyed so only the picks that deserve their own reaction get
  // one. `if` is NOT here on purpose: it is the strongest wrong instinct in the case, and the
  // shared wording marks the moment without diagnosing it, which leaves the probe to teach.
  'node_wrong:code': [
    "[thoughtful] Ah. Anyone who's written a fetch call would reach for that. One question before you try again.",
    "[calm] Hold on. That's not a silly pick at all, it's just a longer road than this needs.",
    '[thoughtful] Hmm. Fair instinct, wrong place for it. Answer me one thing before you swap it out.',
  ],
  'node_wrong:text-classifier': REACHED_FOR_A_MODEL,
  'node_wrong:basic-llm-chain': REACHED_FOR_A_MODEL,
  'node_wrong:information-extractor': REACHED_FOR_A_MODEL,

  build_complete: [
    "[excited] That's the whole morning wired up! [pause] Let's put a few real mornings through it and watch.",
  ],

  // ---- running ---------------------------------------------------------------
  run_start: [
    "[calm] Right, let's see if it holds up. Four mornings off the forecast service, one at a time.",
  ],

  // All four OPEN ON THE TRIGGER, because the clock is the node sitting on their canvas and it
  // is why this morning is entering their flow at all. None of them says where anything lands,
  // and none reads the run card's own subject line back at them.
  'run_case:clear-mild': [
    "[calm] Okay, here's the first. It's 9 AM, the schedule fires, and the service answers with an ordinary morning.",
  ],
  'run_case:light-rain': [
    "[calm] Then the next morning. Same 9 AM call, and this time there's rain in what comes back.",
  ],
  // Names the heat and stops. Putting this morning beside the first one, which shares its
  // weather code, would answer the question of what the advice actually reads.
  'run_case:clear-hot': [
    "[calm] Third morning. The clock fires, the call goes out, and Bangalore's having a properly hot one.",
  ],
  // The awkward one. "The service answers perfectly well" rules out the failure they might
  // otherwise assume, and "I'd watch this one" points without naming the code, the weather or
  // the reason. Everything else about it belongs to them.
  'run_case:thunderstorm': [
    "[calm] And the last morning. The clock fires, the service answers perfectly well, and I'd watch this one.",
  ],

  // Says what the number counts, and says it first, because a learner can click past the clip
  // and the meaning has to be in the opening clause. Neither line claims more than the run
  // proved: what happens on a morning the service says nothing at all is still an open
  // question on the next screen.
  run_pass: [
    '[excited] All four mornings came through your flow! [pause] Four nodes, in order, and one line out of each.',
    '[excited] Four mornings, four messages, all of them out! [pause] That straight line you built does its job.',
  ],
  run_fail: [
    "[calm] Hmm. Not all of those made it out. Follow one through and see where it stalls.",
    "[calm] Ah. One of those didn't land the way it should. Walk it again from 9 AM.",
  ],

  // ---- the end ---------------------------------------------------------------
  stress_start: [
    "[excited] Lovely! [pause] Now let's stress test it. Three mornings that don't look like the four you just watched.",
  ],

  // Per question. These react and point, and never restate the answer: the written verdict
  // beside the options already explains it, and repeating it is reading the screen.
  'stress_correct:blank-note': [
    "[warm] Yes. That's the whole case in one question, and you got there. Read the rest of it.",
  ],
  'stress_wrong:blank-note': [
    '[thoughtful] Hmm, not that one. Read it properly. This is the one the whole case was built around.',
  ],
  'stress_correct:service-down': [
    "[warm] Right. And there's a second half to that answer that's worth more than the first.",
  ],
  'stress_wrong:service-down': [
    "[calm] Ah, no. That's the guess most people make, and it's a fair one. Read on.",
  ],
  'stress_correct:two-paths': [
    '[warm] Yes. That one takes some honesty, because nothing about it actually looks broken.',
  ],
  'stress_wrong:two-paths': [
    '[thoughtful] Hmm, no. Read it through, then ask yourself what somebody would have to remember every time.',
  ],

  // Finally safe to say there was no model in any of it: everything is graded by now.
  report_ready: [
    "[excited] Alright, here it is! [pause] Four nodes, no model anywhere, and one line every morning. Let's see how you did.",
  ],
};
