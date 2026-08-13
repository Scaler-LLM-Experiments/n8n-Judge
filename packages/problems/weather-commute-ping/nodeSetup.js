// The NDV (node detail view), per node TYPE — not per instance.
//
// Every type is used exactly once in this problem, so there is no shared-panel trap
// here: one Schedule Trigger, one HTTP Request, one Edit Fields, one Slack.
//
// A node is configured in two ordered stages: Parameters must verify green before the
// Settings tab unlocks, and setup needs both. Every field is graded server-side by
// `checkAnswer()` — the browser is never told which option is correct.
//
// `settings` is a DIFFERENT SHAPE from `fields`, and it IS validated — `nodeSetupSchema`
// has carried a `settings` block since 2026-08-11, and `validateProblem()` checks that the
// key is one the NDV actually renders, that a dependent setting's parent is graded ON so
// the control can be reached at all, and that the correct value is explained. What it
// still cannot tell you is whether the value marked correct is the RIGHT one. The shape is:
//
//   { key, correct: <value>, why: { '<value>': '…', '<other value>': '…' } }
//
// `why` is a MAP keyed by what the learner chose, so they are told why THEIR answer is
// right or wrong. The template's `options: [{ correct: true }]` shape leaves
// `graded.correct` undefined, which marks every learner wrong forever.
//
// `sampleOutput` is authored on all four nodes, and on HTTP Request it is not optional.
// `catalogEntry.output` is ONE sample per type shared by every case, and the one on
// `http-request` is another case's currency-rate response — so without the sample below,
// the Edit Fields node's Input pane (and its "Insert field…" dropdown, which is built
// from those keys) would show an FX payload on the exact screen that teaches the learner
// to read a forecast. Each node's sample is consistent with the one before it, because
// Judge's model is that the item accumulates fields as it travels.
export const nodeSetup = {
  // ---------------------------------------------------------------------------
  // The clock. Nothing arrives; time is the event.
  // ---------------------------------------------------------------------------
  schedule: {
    // What real n8n's Schedule Trigger hands on: no business data at all, just the
    // moment it fired. Worth seeing, because it is the reason the next node cannot
    // read anything about the weather — it has to go and ask.
    sampleOutput: {
      timestamp: '2026-08-12T09:00:00.000+05:30',
      'Readable date': 'August 12, 2026 at 9:00:00 AM',
      'Readable time': '9:00:00 a.m.',
      'Day of week': 'Wednesday',
      Year: 2026,
      Month: 'August',
      'Day of month': 12,
      Hour: 9,
      Minute: 0,
      Timezone: 'Asia/Kolkata (+05:30)',
    },
    // Context, not answers. The interval is shown rather than graded because the
    // decision worth 1 item here is the hour, and a Days interval is what makes the
    // hour and minute rows exist in real n8n at all — hiding it would leave the graded
    // field floating with nothing to explain why it is there. Nothing below depends on
    // it: it repeats every day, weekends included, which is right for a commute that
    // is only worth checking on a day he travels but harmless on one he does not.
    locked: [
      { label: 'Trigger Interval', value: 'Days' },
      { label: 'Days Between Triggers', value: '1' },
      { label: 'Trigger at Minute', value: '0' },
      { label: 'Timezone', value: 'Asia/Kolkata (workflow default)' },
    ],
    fields: [
      {
        key: 'triggerAtHour',
        label: 'Trigger at Hour',
        kind: 'number',
        min: 0,
        max: 23,
        step: 1,
        correct: 9,
        placeholder: '0 – 23',
        subtitle: 'On a 24-hour clock, in the workflow timezone.',
        // Both of these point at the CALL, never at his departure. The earlier wording
        // closed with "What time does he leave?", which — on this case's own prose, where
        // he picks his phone up on the way out — argues for the hour before the one the
        // field grades. On a free-entry number with nothing to eliminate that is a careful
        // learner marked down and then handed a hint agreeing with their wrong answer.
        whyCorrect:
          'Right — that is the hour the brief puts the call at, and he reads the result a few minutes later on his way out. Earlier would not be safer, either: this asks for conditions as of now, so an answer fetched an hour before he leaves is an hour out of date.',
        whyWrong:
          'This is a 24-hour clock, so read the hour back off the brief rather than off the shape of a morning. And earlier is not safer: the call asks for conditions as of the moment it runs, so one made well before he leaves has gone stale by the time he reads it. What time does the brief say the call goes out?',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // The call. An open endpoint, mid-chain: nothing arrived, so this goes and asks.
  // ---------------------------------------------------------------------------
  'http-request': {
    // NO `credential` key on this node, and the absence is deliberate rather than an
    // omission. `Ndv.jsx` renders that field as "<credential> — Connected", so any string
    // put there claims an account is attached — which would be a lie about the one node
    // in the catalogue that needs none. The fact still has to be SAID, because a learner
    // who has been told every API needs a key should meet the one that does not, so it is
    // said on the Authentication row below, where it renders as what it is.
    // MANDATORY, and the reason is in the header above. This is Open-Meteo's real
    // shape for a `current=` request: a couple of facts about the place, and one
    // `current` object holding the numbers. Every graded option on the node after this
    // is written against these keys, and the Input pane is where the learner reads them.
    sampleOutput: {
      latitude: 12.97,
      longitude: 77.59,
      current: {
        time: '2026-08-12T09:00',
        temperature_2m: 24,
        weather_code: 0,
        precipitation: 0,
      },
    },
    locked: [
      { label: 'Authentication', value: 'None — this forecast service is open, no key and no account' },
      { label: 'Send Query Parameters', value: 'Off — they are already in the address' },
      { label: 'Send Headers', value: 'Off' },
      { label: 'Send Body', value: 'Off' },
    ],
    settings: [
      {
        // Worth grading here and nowhere else: this is the only node in the flow that
        // depends on somebody else's service answering, and the flow gets one attempt
        // a day. `maxTries` and `waitBetweenTries` are deliberately NOT graded — both
        // are only editable while this is on, so grading either would need this one
        // graded true anyway (validateProblem enforces that), and it would push the
        // case past the 20 decisions that make its `easy` label true.
        key: 'retryOnFail',
        correct: true,
        why: {
          true:
            'Right. A public forecast service occasionally answers with a temporary error, and this flow gets exactly one attempt a day — two or three tries a second apart cost nothing and save the morning.',
          false:
            'Off is a sensible default for a node that runs every few minutes and will come round again shortly. Ask how often this one comes round, and what he actually sees on a morning the single attempt does not land.',
        },
      },
    ],
    fields: [
      {
        // The key is `httpMethod`, not `method`, and that is deliberate rather than
        // sloppy. `Ndv.jsx` runs `compatibleCatalogParams()`, which renders the node's
        // full native catalog surface whenever EVERY authored key is also a native
        // catalog key — and `method` is native, with a native default of `GET`. So
        // authoring it under its own name would open this panel with the correct answer
        // already selected, which is a graded decision handed over for free. One
        // non-native key keeps the authored panel, and the field still says "Method" to
        // the learner. Nothing in the export depends on the key: `GET` is n8n's default
        // and a real workflow omits it (see n8nNodeSpecs.js, `http-request`).
        key: 'httpMethod',
        label: 'Method',
        kind: 'select',
        subtitle: 'What kind of request this is. Read it off what the flow is trying to do.',
        options: [
          {
            value: 'POST',
            label: 'POST',
            correct: false,
            why: 'POST means "here is some data, do something with it". This flow is not giving the forecast service anything — it has nothing to send and nothing to change on the other side. Most weather endpoints would answer a POST with a 405.',
          },
          {
            value: 'GET',
            label: 'GET',
            correct: true,
            why: 'Right. The whole request is "tell me what it is like in Bangalore" — asking for something and changing nothing, which is exactly what GET means. It is also n8n\'s default here, so a real workflow file does not even store it.',
          },
          {
            value: 'PUT',
            label: 'PUT',
            correct: false,
            why: 'PUT means "make the thing at this address look like what I am sending". You are reading somebody else\'s forecast, not replacing it.',
          },
          {
            value: 'HEAD',
            label: 'HEAD',
            correct: false,
            why: 'HEAD asks for the headers and no body at all. The request would succeed, the node would hand on nothing to read, and every step after it would be mapping fields that are not there.',
          },
        ],
      },
      {
        // Native key, and it has to be: the exporter writes the correct option's LABEL
        // into the workflow file's `url` parameter, so each label here is a real
        // address rather than a description of one.
        //
        // The coordinates are given and are not the decision (guessing a city's
        // latitude is trivia, not a workflow skill). What is graded is whether the
        // address asks for CURRENT conditions, which is the only one of these four that
        // answers with the shape the next node maps.
        key: 'url',
        label: 'URL',
        kind: 'select',
        // Labels show only the part that differs. Every one of these is the same host and
        // the same Bangalore coordinates, so printing them four times cost 60 characters
        // of each option and pushed the longest to 143, where the picker truncates it
        // mid-parameter. The full address goes to the exporter as `expression`.
        subtitle:
          'The address to call. Bangalore is 12.97, 77.59 in all four. The difference is what each one asks for.',
        options: [
          {
            value: 'bare',
            label: '/v1/forecast with the coordinates and nothing else',
            expression: 'https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59',
            correct: false,
            why: 'This is a valid request and it succeeds. It just does not ask for any weather: the answer is the latitude, the longitude, the elevation and the timezone, and nothing else. An endpoint tells you nothing on its own — you have to say which measurements you want.',
          },
          {
            value: 'archive',
            label: '/v1/archive with a start date, an end date and a daily maximum',
            expression:
              'https://archive-api.open-meteo.com/v1/archive?latitude=12.97&longitude=77.59&start_date=2026-08-01&end_date=2026-08-11&daily=temperature_2m_max',
            correct: false,
            why: 'That is the archive: last week, already over. It would post an accurate temperature for a day he has already commuted through. Same service, different question.',
          },
          {
            value: 'daily7',
            label: '/v1/forecast with daily summaries and forecast_days=7',
            expression:
              'https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&daily=temperature_2m_max,weather_code&forecast_days=7',
            correct: false,
            why: 'Seven days of daily summaries, which sounds generous and is the wrong shape: the answer arrives as arrays of seven values, so the next step has to know which position today is at. He is leaving in ten minutes; he needs one reading, not a week.',
          },
          {
            value: 'current',
            label: '/v1/forecast with current=temperature_2m,weather_code,precipitation',
            expression:
              'https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&current=temperature_2m,weather_code,precipitation',
            correct: true,
            why: 'Right. `current=` asks for conditions as of now, and naming the three measurements is what makes them appear in the answer. Look at the Output pane after you verify: one `current` object holding a temperature, a weather code and a precipitation figure. That is the shape everything after this reads.',
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // The mapping. Two values built by hand, and the interesting decision in the case
  // is inside one of them: what the lookup does with a code it has never seen.
  // ---------------------------------------------------------------------------
  'edit-fields': {
    // Judge's model is that the item accumulates, so what leaves here is the forecast
    // response PLUS the two values just built. Both matter downstream: the Slack node's
    // graded options include one that reaches past this node for the raw numbers, and a
    // learner has to be able to see that those are still there and still useless.
    sampleOutput: {
      latitude: 12.97,
      longitude: 77.59,
      current: {
        time: '2026-08-12T09:00',
        temperature_2m: 24,
        weather_code: 0,
        precipitation: 0,
      },
      weather_line: '24°C, clear skies',
      commute_note: 'Easy commute.',
    },
    locked: [
      { label: 'Mode', value: 'Manual Mapping' },
      { label: 'Include Other Input Fields', value: 'On' },
    ],
    fields: [
      {
        // An assignment LIST, not a set of dropdowns: n8n's real Edit Fields mapping,
        // where the learner names each value and says what it holds. Building it is the
        // skill; recognising a pre-baked correct combination in a dropdown is not.
        //
        // Graded as exactly three items (count / names / values) whatever the learner
        // builds, so the denominator cannot move between attempts.
        //
        // The key is `fields` rather than the native `assignments` for the same reason
        // the HTTP Request method is `httpMethod`: a fully-native key set makes the NDV
        // render this node's whole catalog surface alongside the authored one. Here that
        // would mean live Mode / Include Other Input Fields / Options controls sitting
        // beside the locked rows above that state their values.
        key: 'fields',
        label: 'Fields to Set',
        kind: 'assignmentList',
        addLabel: 'Add Field',
        subtitle:
          'One entry per value you are building. Name it, then say what it should hold. The Input pane shows what the service answered on the morning in the sample, so read the shape off that.',
        nameOptions: [
          {
            value: 'weather_code',
            label: 'weather_code',
            correct: false,
            why: 'The code is already in the flow — it arrived inside the response, and everything after this can reach it there. Lifting it to the top level under the same name renames a number rather than turning it into anything a person can read, and the post would still have an integer in it where he needs words.',
          },
          {
            value: 'weather_line',
            label: 'weather_line',
            correct: true,
            why: 'One of the two halves of the message: the conditions in words with the temperature beside them. It is a new value — nothing upstream produced a sentence — so this is where it has to be created.',
          },
          {
            value: 'forecast',
            label: 'forecast',
            correct: false,
            why: 'One field holding the whole message. It works, and it hides the two decisions inside it: the conditions and the advice are worked out differently and change for different reasons, so the day you want to reword the advice you are editing the sentence that also carries the temperature. Keep them apart while they are being built.',
          },
          {
            value: 'commute_note',
            label: 'commute_note',
            correct: true,
            why: 'The other half: one line about what today\'s commute needs. Naming it separately is what lets the message read as "conditions, then advice" rather than as one long string somebody has to parse with their eyes.',
          },
          {
            value: 'umbrella',
            label: 'umbrella',
            correct: false,
            why: 'A yes-or-no flag. Something further along would then have to turn true and false into English, and you would have moved the decision rather than made it — and it has nothing to say about the mornings when the problem is 38°C rather than rain.',
          },
        ],
        // `label` is what the learner compares. `expression` is what the exporter writes
        // into the workflow file.
        //
        // These used to be the same string, and the exporter's requirement won: every
        // label was a full n8n expression, so the seven-entry lookup table appeared
        // inside five of them and the longest reached 296 characters. A dropdown in a
        // 420px control truncates that mid-token. The case was asking learners who
        // cannot read JavaScript to compare four ternaries by eye.
        //
        // What each option MEANS is a short sentence, and the difference that matters is
        // one clause: whether an unrecognised code has anywhere to go. That is what the
        // labels say now. The expressions are unchanged, so the exported workflow is
        // exactly as faithful as it was.
        valueOptions: [
          {
            value: 'line.bare',
            forName: 'weather_line',
            label: 'The temperature, and the weather code written out in words',
            expression:
              '{{ $json.current.temperature_2m }}°C, {{ ({0:"clear skies",1:"mostly clear",2:"partly cloudy",3:"overcast",61:"light rain",63:"rain",65:"heavy rain"})[$json.current.weather_code] }}',
            correct: false,
            why: 'This is right on every morning you have looked at, which is exactly what makes it worth arguing about. A lookup with no second arm has no answer at all for a code that is not in the table — no error, no warning, no failed run, and a message with a hole in it where the words should be. Ask what this table covers, and then ask what the world covers.',
          },
          {
            value: 'note.codeOnly',
            forName: 'commute_note',
            label: 'Advice chosen from the weather code, plus a line for anything else',
            expression:
              '{{ ({0:"Easy commute.",1:"Easy commute.",2:"Easy commute.",3:"Easy commute.",61:"Grab an umbrella.",63:"Grab an umbrella.",65:"Leave early, heavy rain."})[$json.current.weather_code] || "Check the forecast before you leave." }}',
            correct: false,
            why: 'The advice read off the code alone. A clear sky at 38°C comes out as "Easy commute." — and the code is not wrong, it really is clear. What makes that a hard commute is the number sitting next to it. Two independent things arrived in the response and the advice depends on both.',
          },
          {
            value: 'line.mapped',
            forName: 'weather_line',
            label: 'The temperature, and the code in words, or the number when it is one we have not named',
            expression:
              '{{ $json.current.temperature_2m }}°C, {{ ({0:"clear skies",1:"mostly clear",2:"partly cloudy",3:"overcast",61:"light rain",63:"rain",65:"heavy rain"})[$json.current.weather_code] || "unusual conditions (code " + $json.current.weather_code + ")" }}',
            correct: true,
            why: 'The temperature as it came, and the code turned into words. The second arm after `||` is what makes this survivable: when the code is not one of the seven in the table, the message still says something true and still names the number, so whoever reads it knows what to do next. A lookup table is a list of the cases you have thought of.',
          },
          {
            value: 'note.bare',
            forName: 'commute_note',
            label: 'Advice for extreme heat first, otherwise chosen from the weather code',
            expression:
              '{{ $json.current.temperature_2m >= 35 ? "Extreme heat, carry water." : ({0:"Easy commute.",1:"Easy commute.",2:"Easy commute.",3:"Easy commute.",61:"Grab an umbrella.",63:"Grab an umbrella.",65:"Leave early, heavy rain."})[$json.current.weather_code] }}',
            correct: false,
            why: 'The heat is handled and the table is right, and it still has nowhere to go when the code is not one of the seven: the run is green and the message arrives with nothing where the advice should be. What would an expression need on the end of it so that an unrecognised code still produces something he can act on?',
          },
          {
            value: 'note.mapped',
            forName: 'commute_note',
            label: 'Extreme heat first, then the weather code, and a line for anything else',
            expression:
              '{{ $json.current.temperature_2m >= 35 ? "Extreme heat, carry water." : ({0:"Easy commute.",1:"Easy commute.",2:"Easy commute.",3:"Easy commute.",61:"Grab an umbrella.",63:"Grab an umbrella.",65:"Leave early, heavy rain."})[$json.current.weather_code] || "Check the forecast before you leave." }}',
            correct: true,
            why: 'Reads both things the service answered — heat first, because a clear 38°C morning needs water more than it needs telling that it is clear — then the code, and then has an answer for a code it does not recognise. Every arm of it produces a line he can act on, which is the actual requirement.',
          },
          {
            value: 'line.raw',
            forName: 'weather_line',
            label: 'The temperature, and the weather code as the number it arrived as',
            expression: '{{ $json.current.temperature_2m }}°C, code {{ $json.current.weather_code }}',
            correct: false,
            // Deliberately illustrated with a code the mapping DOES cover. Naming an
            // unrecognised one here would tell a learner who made a different mistake
            // entirely that the table has a hole in it, and finding that hole is the
            // one genuinely interesting discovery in the case.
            why: 'Complete, accurate, and useless in a doorway: "24°C, code 0". The number means something to the service that sent it and nothing to a person putting a shoe on. Turning the code into words is the reason this step exists at all.',
          },
          {
            value: 'note.precipitation',
            forName: 'commute_note',
            label: 'Advice based on whether any rain is falling at the moment it runs',
            expression: '{{ $json.current.precipitation > 0 ? "Grab an umbrella." : "Easy commute." }}',
            correct: false,
            why: 'A reasonable instinct — the response really does carry a precipitation figure. But it is how much is falling at 9:00 exactly: rain that starts at half past reads as a clear morning here, and it says nothing at all about the ride home at six, while the code carries the condition rather than the instant. It also has nothing to say about a 38°C morning.',
          },
        ],
        expect: {
          assignments: [
            { name: 'weather_line', value: 'line.mapped' },
            { name: 'commute_note', value: 'note.mapped' },
          ],
        },
        // Written as advice about ONE entry, not as a summary of the list: the NDV shows
        // each verdict on the row it came from.
        why: {
          count: {
            correct: 'Two values, which is exactly what the message is made of. Nothing spare and nothing missing.',
            wrong:
              'Work backwards from the message. How many separate things does it say, and does each one need to be built here — or is it already on the item?',
          },
          names: {
            correct: 'Both names say what the value holds, and the send step can reach either one on its own.',
            wrong:
              'This name is either something the item already carries, or it describes the shape you are storing rather than what the message needs. Read the two halves of the message back off the brief and name one of them.',
          },
          values: {
            correct:
              'This one reads what the service actually answered and produces a line a person can act on — on the ordinary mornings and on the odd one.',
            wrong:
              'Three things to check on this row. Read it back against its own name first — the two lines do different jobs, and it is easy to put the right value under the wrong one. Then: does it read everything the advice depends on, and what does it come out as on a morning the code is not one of the ones you listed? A value that is quietly empty is worse than one that is wrong, because nothing tells you.',
          },
        },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // The post. What goes in the message is the decision; the shape of the send is given.
  // ---------------------------------------------------------------------------
  slack: {
    credential: 'Slack — Sudhanva',
    // What Slack answers with. Nothing downstream reads it: this is the confirmation the
    // learner gets that their node did the right thing, and it is what the graded answer
    // really produces on the ordinary morning in the sample above.
    sampleOutput: {
      ok: true,
      channel: 'C08COMMUTE',
      ts: '1786585200.000300',
      message: {
        text: '24°C, clear skies. Easy commute.',
        username: 'Commute Ping',
      },
    },
    locked: [
      { label: 'Resource', value: 'Message' },
      { label: 'Operation', value: 'Send' },
      { label: 'Send Message To', value: 'Channel' },
      { label: 'Message Type', value: 'Simple Text Message' },
    ],
    fields: [
      {
        // Graded rather than locked, which means the STATEMENT must not name it — it
        // says "somewhere he is already looking on his phone" and stops there. The
        // decision is not really "which of these four strings"; it is "whose room is
        // this?", and every wrong answer here is a flow that works and annoys somebody.
        key: 'channel',
        label: 'Channel',
        kind: 'select',
        subtitle: 'Where the post lands. One of these is the channel he made for this one line; the rest belong to other people.',
        options: [
          {
            value: '#commute',
            label: '#commute',
            correct: true,
            why: 'His own channel, holding one short line a day and nothing else — so the line is the whole content and he reads it without opening anything. A channel that carries one thing is a channel you can trust at a glance.',
          },
          {
            value: '#general',
            label: '#general',
            correct: false,
            why: 'Everyone. Forty people would get his umbrella advice every morning at nine, and within a week they would all have muted the channel that also carries things they need. A message that is useful to one person is noise to everybody else.',
          },
          {
            value: '#weather-club',
            label: '#weather-club',
            correct: false,
            why: 'Sounds exactly right and belongs to somebody else — it is where the office cycling group argues about the monsoon. Posting an automated line into a room you do not own, every day, forever, is how a useful flow becomes a nuisance.',
          },
          {
            value: '#alerts',
            label: '#alerts',
            correct: false,
            why: 'This is where things going wrong are supposed to arrive. Put a message there that turns up every single morning whether or not anything is wrong, and people stop reading the channel that exists for the days something is.',
          },
        ],
      },
      {
        key: 'text',
        label: 'Message Text',
        kind: 'select',
        subtitle: 'What actually goes in the post. Look at what the Input pane is offering.',
        options: [
          {
            value: 'raw',
            label: '{{ $json.current.temperature_2m }}°C, weather code {{ $json.current.weather_code }}',
            correct: false,
            why: 'Both of these are still on the item, so this resolves and posts fine: "24°C, weather code 0". Reaching past the step that turned the code into words means that step may as well not be there. The Input pane has better things on it than this.',
          },
          {
            value: 'note-only',
            label: '{{ $json.commute_note }}',
            correct: false,
            why: 'The advice with nothing behind it. "Grab an umbrella." on its own is fine until the morning it says "Extreme heat — carry water." and he wants to know whether that means 36 or 41. He uses the number too; that is why there are two values.',
          },
          {
            value: 'both',
            label: '{{ $json.weather_line }}. {{ $json.commute_note }}',
            correct: true,
            why: 'Both halves, in the order a person reads them: what it is like, then what to do about it. Look at the Output pane after you verify — "24°C, clear skies. Easy commute." is the whole message, and it is one line because that is all it needs to be.',
          },
          {
            value: 'hardcoded',
            label: 'Good morning. Check the weather before you leave.',
            correct: false,
            why: 'The same sentence every morning, which makes the schedule, the call and the mapping all pointless — you have built an expensive alarm clock. Worse, it is the one message that keeps arriving looking completely normal after the flow above it has stopped working.',
          },
        ],
      },
    ],
  },
};
