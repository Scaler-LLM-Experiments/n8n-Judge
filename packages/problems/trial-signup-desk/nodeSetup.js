// The NDV (node detail view), per node TYPE — not per instance.
//
// Every type is used exactly once in this problem, so there is no shared-panel question
// to reason about here.
//
// A node is configured in two ordered stages: Parameters must verify green before the
// Settings tab unlocks, and setup needs both. Every field is graded server-side by
// `checkAnswer()` — the browser is never told which option is correct.
//
// `settings` is a DIFFERENT SHAPE from `fields`, and it is not covered by
// `nodeSetupSchema` at all — zod strips it, so `validateProblem()` never sees it and
// nothing here can be caught mechanically. The shape is:
//
//   { key, correct: <value>, why: { '<value>': '…', '<other value>': '…' } }
//
// `why` is a MAP keyed by what the learner chose, so they are told why THEIR answer is
// right or wrong. The template's `options: [{ correct: true }]` shape leaves
// `graded.correct` undefined, which marks every learner wrong forever.
//
// There is no router block below: this flow is linear.
export const nodeSetup = {
  // The way in. It publishes the form, so the four questions on the form are the four
  // named values everything downstream maps from.
  'form-trigger': {
    locked: [
      { label: 'Form Title', value: 'TerraTrek Gear. Free Trial' },
      { label: 'Form Description', value: 'Fourteen days, no card needed.' },
      { label: 'Form Fields', value: 'Full Name · Email · Plan · Referral Source' },
      { label: 'Respond When', value: 'Form is submitted' },
    ],
    fields: [
      {
        // The one real decision on this node, and it is the decision the whole degraded
        // path hangs off: which blanks the form refuses, and which it lets through for
        // the rest of the flow to cope with.
        key: 'required',
        label: 'Which answers must be filled in?',
        subtitle: 'A required field stops the form being submitted while it is empty. An optional one arrives blank.',
        options: [
          {
            value: 'all',
            label: 'All four',
            correct: false,
            why: 'This keeps the sheet tidy by turning people away. Somebody who would rather not say where they heard about you now cannot start a trial. The brief is explicit that a blank name and a blank referral both have to get through. You do not fix a blank by refusing the signup.',
          },
          {
            value: 'email-plan',
            label: 'Email and Plan',
            correct: true,
            why: 'Right. Those two are the only answers the flow genuinely cannot work without. No address means the welcome mail has nowhere to go, and no plan means nothing to welcome them to. Name and referral are allowed in blank, and everything after this has to cope with that.',
          },
          {
            value: 'none',
            label: 'None of them',
            correct: false,
            why: 'Now a signup can arrive with no address on it and the welcome mail has nobody to reach. Some blanks are survivable and some are not; this treats them all the same.',
          },
          {
            value: 'name-email',
            label: 'Full Name and Email',
            correct: false,
            why: 'The address, yes. But the brief says a blank name still has to produce a logged row. Making the name compulsory answers that requirement by refusing the trial. And with no plan required, a signup can arrive that you cannot tell the person anything about.',
          },
        ],
      },
    ],
  },

  // The one call out to the world. Everything about this node is about reading somebody
  // else's API carefully: the request you send, and the shape of what comes back.
  'http-request': {
    // Execute Once is graded here because it is the one setting on this flow whose wrong
    // value loses signups silently, and because its NAME suggests the opposite of what it
    // does. See the note in probes/eval: it means "run using only the first input item",
    // not "fetch once and share the answer".
    settings: [
      {
        key: 'executeOnce',
        correct: false,
        why: {
          false:
            'Right, leave it off. The node then runs once for every signup coming through, so every row gets a rate. That is one small call per signup, which for a trial form is nothing at all.',
          // Deliberately does NOT spell out what reaches the sheet. That exact question is
          // asked and scored in Stress Testing (`execute-once`), and only a learner who got
          // this setting wrong would ever read this line — so handing over the answer here
          // would reward the mistake and score one idea twice. It corrects the misreading of
          // the name and leaves the consequence to be worked out.
          true:
            'Execute Once has nothing to do with caching a result, and the name is exactly why people believe it does. It makes a node run a single time however many items arrive at it. On a signup form one item is one person. Ask yourself what a node emits when it has only run once.',
        },
      },
    ],
    locked: [
      { label: 'Method', value: 'GET' },
      { label: 'Authentication', value: 'None' },
      { label: 'Response Format', value: 'JSON' },
    ],
    fields: [
      {
        key: 'url',
        label: 'URL',
        subtitle: 'The rate service takes the two currencies as query parameters. Read the direction carefully.',
        options: [
          {
            value: 'reversed',
            label: 'https://api.frankfurter.app/latest?from=INR&to=USD',
            correct: false,
            // The stated symptom has to be what really happens. This asks INR→USD, so the
            // service answers `rates: { USD: … }` — there is no INR entry at all, and the
            // column is mapped to `rates.INR`. So the cell comes out BLANK, not wrong-by-a-
            // factor-of-eighty. Distinguished from the `INR` value option, which is a
            // right request read at the wrong depth: here the depth is right and the
            // request is not, so the fix is in the URL rather than in the expression.
            why: 'The right service, the wrong way round. This asks what one rupee is worth in dollars, so the `rates` object holds a `USD` entry and no `INR` one. The column is pointed at the rupee rate, finds nothing, and every cell comes out blank. Nothing errors, which is what makes it dangerous. The mapping was never wrong. The request was.',
          },
          {
            value: 'bare',
            label: 'https://api.frankfurter.app/latest',
            correct: false,
            why: 'With no currencies named this returns dozens of rates against the service’s own default base, and USD to INR is not among them. Narrowing the request at the source is what leaves you one obvious value to map.',
          },
          {
            value: 'usd-inr',
            label: 'https://api.frankfurter.app/latest?from=USD&to=INR',
            correct: true,
            why: 'Right. From dollars, to rupees, which is the direction the USD_INR_Rate column is named for. One rate comes back, so there is only one thing in the response that could possibly be the number you want.',
          },
          {
            value: 'path-style',
            label: 'https://api.frankfurter.app/USD/INR',
            correct: false,
            why: 'A fair guess at how the URL might be shaped, and not how this one works. The path says which snapshot you want, and the currencies go in the query string. A request to a path the service does not publish comes back as an error, not as a rate.',
          },
        ],
      },
    ],
  },

  // The sheet. This node carries the decision the whole case exists for: which incoming
  // answer goes under which column heading.
  'google-sheets': {
    credential: 'Google Sheets. TerraTrek Ops',
    locked: [
      { label: 'Document', value: 'TerraTrek Signups' },
      { label: 'Sheet', value: 'Signups' },
      { label: 'Mapping Column Mode', value: 'Map each column manually' },
      { label: 'Columns on the sheet', value: 'Full Name · Email · Plan · Referral Source · USD_INR_Rate' },
    ],
    fields: [
      {
        key: 'operation',
        label: 'Operation',
        subtitle: 'What this node does to the sheet each time it runs.',
        options: [
          {
            value: 'update',
            label: 'Update Row',
            correct: false,
            why: 'Update finds a row that is already there and overwrites it, so every signup lands on the same line. The sheet never grows past one entry and this morning’s trials are gone by lunchtime.',
          },
          {
            value: 'append-or-update',
            label: 'Append or Update Row',
            correct: false,
            why: 'This one needs a column to match on so it can decide whether it has seen a record before. Nothing here is trying to avoid duplicates: every submission of the form is a new signup, even from the same person on the same day.',
          },
          {
            value: 'get',
            label: 'Get Rows',
            correct: false,
            why: 'That reads the sheet rather than writing to it. Nothing in this flow needs to know what is already there; it needs to add what has just come in.',
          },
          {
            value: 'append',
            label: 'Append Row',
            correct: true,
            why: 'Right. One new line per signup, added to the end, leaving everything already on the sheet alone. That is what makes the sheet a growing record rather than a scratchpad.',
          },
        ],
      },
      {
        // An assignment LIST, not a set of dropdowns: n8n's real per-column mapping, where
        // the learner names each heading and says what goes under it. Building it is the
        // skill — recognising a pre-baked correct combination in a list is not.
        //
        // Graded as exactly three items (count / names / values) whatever the learner
        // builds, so a five-column answer and a two-column one are worth the same and the
        // denominator cannot move between attempts.
        key: 'columns',
        label: 'Values to send',
        kind: 'assignmentList',
        addLabel: 'Add Column',
        // The subtitle states the rate service's response shape rather than telling the
        // learner to read it off the Input pane. The pane shows the immediately-upstream
        // node's sample output, and the catalog's sample for HTTP Request is a different
        // API's response — so pointing them at it would point them somewhere misleading.
        // The shape is the thing the question turns on, so it is stated here.
        subtitle:
          'One entry per column you are filling. Name the heading exactly as it appears on the sheet, then say which value belongs under it. The rate step answered with { "amount": 1, "base": "USD", "date": "…", "rates": { "INR": … } }.',
        nameOptions: [
          {
            value: 'Full Name',
            label: 'Full Name',
            correct: true,
            why: 'A heading the Signups sheet really has, and the first of the four answers the form collects.',
          },
          {
            value: 'Email',
            label: 'Email',
            correct: true,
            why: 'A heading on the sheet. Also the one value the welcome mail depends on, so it is worth having recorded.',
          },
          {
            value: 'Plan',
            label: 'Plan',
            correct: true,
            why: 'A heading on the sheet. This is the column the team filters on when they want to know who is on Pro.',
          },
          {
            value: 'Referral Source',
            label: 'Referral Source',
            correct: true,
            why: 'A heading on the sheet, and the one the messy free-text answer belongs under. Give it its own column and a sentence full of commas is just a long value in one cell.',
          },
          {
            value: 'USD_INR_Rate',
            label: 'USD_INR_Rate',
            correct: true,
            why: 'A heading on the sheet, waiting for the rate this run fetched. It is the only column whose value does not come from the form.',
          },
          {
            value: 'Notes',
            label: 'Notes',
            correct: false,
            why: 'There is no Notes column on the Signups sheet. A value sent under a heading that does not exist is simply not written, and nothing warns you. Check the column list on the panel above.',
          },
          {
            value: 'Signup Date',
            label: 'Signup Date',
            correct: false,
            why: 'Genuinely useful, and not a column this sheet has. Adding it here writes nothing. Adding the column to the sheet first would be the real fix, and that is not the job you were given.',
          },
        ],
        valueOptions: [
          {
            value: 'form.name',
            label: '{{ $json["Full Name"] }}',
            correct: true,
            why: 'The name exactly as it was typed into the form, accents and apostrophes and all. Nothing needs cleaning up; they are just characters in a value.',
          },
          {
            value: 'form.email',
            label: '{{ $json.Email }}',
            correct: true,
            why: 'The address the person gave, which is also where the welcome mail is going.',
          },
          {
            value: 'form.plan',
            label: '{{ $json.Plan }}',
            correct: true,
            why: 'Basic, Plus or Pro, straight off the form, spelled the way the form spelled it.',
          },
          {
            value: 'form.referral',
            label: '{{ $json["Referral Source"] }}',
            correct: true,
            why: 'The free-text answer, whole and untouched. Commas, quotes and line breaks only cause trouble if something tries to split the value up. Taken whole, it goes into one cell and stays there.',
          },
          {
            value: 'rates.INR',
            label: '{{ $json.rates.INR }}',
            correct: true,
            why: 'The rate service answers with the amount, the base currency and the date. It also returns a `rates` object, holding one entry per currency you asked for. The number is inside that object, under the currency code.',
          },
          {
            value: 'rates',
            label: '{{ $json.rates }}',
            correct: false,
            why: 'That is the container, not the number. The cell fills with a chunk of JSON or the words [object Object], and nobody can multiply a price by that. You are one level too shallow.',
          },
          {
            value: 'amount',
            label: '{{ $json.amount }}',
            correct: false,
            why: 'The service echoes back how much it was asked to convert, which is 1. A column of ones looks populated and is not a rate.',
          },
          {
            value: 'INR',
            label: '{{ $json.INR }}',
            correct: false,
            why: 'There is no INR at the top of the response. It is nested one level down. This resolves to nothing, so the column comes out blank on every row and no error is raised.',
          },
        ],
        expect: {
          assignments: [
            { name: 'Full Name', value: 'form.name' },
            { name: 'Email', value: 'form.email' },
            { name: 'Plan', value: 'form.plan' },
            { name: 'Referral Source', value: 'form.referral' },
            { name: 'USD_INR_Rate', value: 'rates.INR' },
          ],
        },
        // One explanation per aspect, per verdict. Written as advice about ONE row,
        // because the NDV shows each verdict on the row it came from.
        why: {
          count: {
            correct:
              'Five entries for the five headings on the sheet, so every column has something under it and none is left to guess.',
            wrong:
              'Count the headings on the Signups sheet and give each one an entry. A heading with no entry comes out empty on every row, and an entry naming no real heading writes nowhere at all.',
          },
          names: {
            correct:
              'Each name matches a heading that is really on the sheet, spelled the same way, so each value has somewhere to land.',
            wrong:
              'A name here has to be a heading the Signups sheet actually has, spelled exactly. Read the column list on the locked panel above and check this row against it. A near-miss writes nothing and says nothing.',
          },
          values: {
            correct:
              'Each row puts the answer that belongs under that heading, taken whole rather than chopped up.',
            wrong:
              'Look at what this row is putting under that heading. Two mistakes account for almost all of these: an answer landing under its neighbour’s column, and reaching for the rate at the wrong depth. The response shape is written out in the note above this list. Count the levels rather than guessing at them.',
          },
        },
      },
    ],
  },

  // The half the person signing up actually sees.
  action: {
    credential: 'Gmail. TerraTrek Gear',
    locked: [
      { label: 'Operation', value: 'Send message' },
      { label: 'Subject', value: 'Welcome to your TerraTrek free trial' },
      { label: 'Body', value: '<greeting>\n\nYou’re on the {{ $json.Plan }} plan for the next fourteen days. Here’s where to start.', kind: 'textarea' },
      { label: 'Send as', value: 'HTML' },
    ],
    fields: [
      {
        key: 'to',
        label: 'Send to',
        subtitle: 'Where the welcome email is addressed.',
        options: [
          // Correct at index 0 on this one field, on purpose: the answer sits at every
          // position somewhere across this problem, and an authored set that never uses the
          // top slot is a pattern of its own.
          {
            value: 'email',
            label: '{{ $json.Email }}',
            correct: true,
            why: 'The address the person typed in. Worth noticing that something like dana+trial@example.com is a perfectly ordinary address. The plus sign is part of it and nothing needs stripping out.',
          },
          {
            value: 'name',
            label: '{{ $json["Full Name"] }}',
            correct: false,
            why: 'A name is not an address. Gmail is handed something like "Aarav Sharma" to deliver to and refuses it. And on the signup that arrived with no name, it is handed nothing at all.',
          },
          {
            value: 'ops',
            label: 'trials@terratrek.example',
            correct: false,
            why: 'That sends every welcome to your own team. The one person who should be reading this mail is the one who just filled in the form.',
          },
          {
            value: 'to',
            label: '{{ $json.to }}',
            correct: false,
            why: 'Nothing upstream produces a `to` field, so this resolves to nothing and the send fails. The form collects four answers and none of them is called `to`. Read them back and pick the one that is an address.',
          },
        ],
      },
      {
        // The degraded path, made into a decision. Full Name is optional, so this is
        // where a blank either reads badly, costs the signup, or is handled.
        key: 'greeting',
        label: 'How the greeting reads',
        subtitle: 'Full Name is allowed to arrive blank. This is the first line the person sees.',
        options: [
          {
            value: 'name-always',
            label: 'Hi {{ $json["Full Name"] }},. Every time',
            correct: false,
            why: 'Fine for twelve signups out of thirteen, and embarrassing for the one that arrived without a name: they get a mail opening "Hi ,". A blank value does not error, it renders as nothing, which is exactly why this kind of mistake ships unnoticed.',
          },
          {
            value: 'generic-always',
            label: 'Hi there,. Every time',
            correct: false,
            why: 'Nothing breaks, and nothing is personal either. The brief asks for a welcome that names the person, and twelve of the thirteen signups handed you a name to use. Playing safe for everybody to cover one blank is a poor trade.',
          },
          {
            value: 'skip',
            label: 'Send nothing when the name is blank',
            correct: false,
            why: 'That loses a signup to keep a greeting tidy. Somebody filled in your form and hears nothing back, which is the precise failure this flow exists to remove. A missing name is not a missing person.',
          },
          {
            value: 'fallback',
            label: 'Hi {{ $json["Full Name"] || "there" }},. The name if there is one, "there" if not',
            correct: true,
            why: 'Right. The name when the form gave you one, a plain greeting when it did not, and a mail that goes out either way. A blank optional answer should change how a message reads, never whether it is sent.',
          },
        ],
      },
    ],
  },
};
