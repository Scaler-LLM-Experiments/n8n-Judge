// The NDV (node detail view), per node TYPE — not per instance.
//
// Every type is used exactly once in this problem, so there is no shared-panel trap
// here: one Google Sheets node, one Slack node, one of everything.
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
// `sampleOutput` is authored on every node here because each one's output is the INPUT
// pane of the node after it, and the "Insert field…" dropdown is built from its keys.
// The catalog carries ONE sample per type shared by every case, so without these the
// learner mapping the Slack message would be shown another case's spreadsheet row.
export const nodeSetup = {
  // ---------------------------------------------------------------------------
  // The clock. Nothing arrives; time is the event.
  // ---------------------------------------------------------------------------
  schedule: {
    // What real n8n's Schedule Trigger hands on: no business data at all, just the
    // moment it fired. Worth seeing, because it explains why the next node cannot
    // read anything about beans — it has to go and fetch them.
    sampleOutput: {
      timestamp: '2026-08-11T07:30:00.000+05:30',
      'Readable date': 'August 11, 2026 at 7:30:00 AM',
      'Readable time': '7:30:00 a.m.',
      'Day of week': 'Tuesday',
      Year: 2026,
      Month: 'August',
      'Day of month': 11,
      Hour: 7,
      Minute: 30,
      Timezone: 'Asia/Kolkata (+05:30)',
    },
    // ONE locked row, and it is deliberately the only one that is true whatever the
    // learner picks below.
    //
    // This panel used to carry "Weeks Between Triggers: 1" and "Trigger on weekdays:
    // Monday…Friday" as well, and both had to go: in real n8n neither parameter exists
    // until the Trigger Interval is set to Weeks, so displaying them above an
    // ungraded-yet Trigger Interval answers it. "Weeks Between Triggers" was the worse
    // of the two — the word "Weeks" is the correct option's label, printed verbatim, so
    // it was free to a learner who had never opened n8n.
    //
    // Cost of removing them, stated because it is real: `n8nNodeSpecs.js` reads BOTH
    // labels when it exports the Schedule Trigger. `Weeks Between Triggers` falls back
    // to 1, which is the same file. `Trigger on weekdays` does not — without it the
    // export omits `triggerAtDay`, so the imported workflow runs weekly on n8n's own
    // default day rather than Monday to Friday. That is a wrong day in a convenience
    // file; the alternative was a free answer on a graded field, which is a wrong mark
    // on a learner. Flagged for a human: the fix belongs in the export spec, not here.
    locked: [{ label: 'Timezone', value: 'Asia/Kolkata (workflow default)' }],
    fields: [
      {
        // The interval decides WHICH other fields the node even shows you, which is
        // why it comes first and why it is a real decision rather than trivia: only
        // one of these four lets you say "weekdays only" at all.
        key: 'interval',
        label: 'Trigger Interval',
        subtitle: 'How this rule repeats. It decides which of the fields below the node shows you.',
        options: [
          {
            value: 'hours',
            label: 'Hours',
            correct: false,
            why: 'This repeats through the day — every hour, or every second hour. The buyer would get the same shortlist again at 08:30 and 09:30, and there is no way to say "not on Saturday".',
          },
          {
            value: 'days',
            label: 'Days',
            correct: false,
            why: 'Close, and it does let you set a time. But a daily rule runs on all seven days, and the roastery does not do this at the weekend. Which interval lets you name the days?',
          },
          {
            value: 'cronExpression',
            label: 'Custom (Cron)',
            correct: false,
            why: 'It would work — `30 7 * * 1-5` is exactly right. But it hides the schedule inside a string nobody on the ops team can read or safely edit, and n8n already has a plain-language way to say the same thing.',
          },
          {
            value: 'weeks',
            label: 'Weeks',
            correct: true,
            why: 'Weeks is the only one of the four that lets you name the days at all: pick it in n8n and the node adds a row of weekday checkboxes alongside the hour and the minute. Tick Monday to Friday and that is the whole rule — once a week, on five of its days, at a fixed time.',
          },
        ],
      },
      {
        key: 'triggerAtHour',
        label: 'Trigger at Hour',
        kind: 'number',
        min: 0,
        max: 23,
        step: 1,
        correct: 7,
        placeholder: '0 – 23',
        subtitle: 'On a 24-hour clock, in the workflow timezone.',
        whyCorrect:
          'Right. The sweep has to be finished and read before the first roast, and well before the suppliers stop taking orders at 10.',
        whyWrong:
          'Read the hour back off the brief, and remember this is a 24-hour clock in Asia/Kolkata — 7 in the evening is not the same field value as 7 in the morning. What time does Ritika do this today?',
      },
      {
        key: 'triggerAtMinute',
        label: 'Trigger at Minute',
        kind: 'number',
        min: 0,
        max: 59,
        step: 1,
        correct: 30,
        placeholder: '0 – 59',
        subtitle: 'Minutes past the hour.',
        whyCorrect: 'Right. Half past, so the post lands at 07:30 on the dot.',
        whyWrong:
          'Left at zero this fires on the hour instead. The two fields are read together — hour and minute — so check what the pair of them adds up to.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // The sheet, used as a SOURCE. Which operation you choose is what decides whether
  // this node hands its rows on or ends the flow right here.
  // ---------------------------------------------------------------------------
  'google-sheets': {
    credential: 'Google Sheets — Brightleaf Roastery',
    // One row of the Stock tab, as it arrives. Every expression the next node offers
    // is built from these keys, so they have to be the real column names.
    sampleOutput: {
      bean: 'Ethiopia Guji',
      location: 'Kalyani Nagar',
      kg_on_hand: 1.2,
      reorder_level: 6,
      supplier: 'Kerehaklu Estates',
      last_counted: '2026-08-08',
    },
    locked: [
      { label: 'Authentication', value: 'OAuth2' },
      { label: 'Resource', value: 'Sheet Within Document' },
      { label: 'Document', value: 'Bean Inventory 2026' },
      { label: 'Sheet', value: 'Stock' },
    ],
    settings: [
      {
        // Worth grading here and nowhere else: this is the only node in the flow that
        // depends on somebody else's service answering, and the run happens once a day.
        // A transient failure at 07:30 costs the whole morning.
        key: 'retryOnFail',
        correct: true,
        why: {
          true:
            'Right. Google occasionally answers a request with a temporary error, and this flow only gets one attempt a day — a second and third try a second apart costs nothing and saves the morning.',
          false:
            'Leave it off and a momentary hiccup on Google\'s side ends the run there and then. Off is a sensible default for a node that fires every few minutes and will come round again shortly. How often does this one come round, and what does one lost run cost?',
        },
      },
    ],
    fields: [
      {
        // The most load-bearing dropdown in the case. It is not only "what should this
        // node do" — it is what makes this node a step in the middle of a flow rather
        // than the end of one, so getting it wrong ends the workflow here.
        key: 'sheetOperation',
        label: 'Operation',
        subtitle: 'What this node does to the Stock tab. Everything after it depends on the answer.',
        options: [
          {
            value: 'append',
            label: 'Append Row',
            correct: false,
            why: 'This writes a brand new row onto the bottom of the Stock tab and hands on what it wrote. The counts are already in the sheet; nothing here needs adding to it, and this would quietly grow the tab by a row a day.',
          },
          {
            value: 'appendOrUpdate',
            label: 'Append or Update Row',
            correct: false,
            why: 'A write either way — it looks for a matching row and edits it, or adds one if there is none. This flow must not change the stock counts; the people doing the counting own those.',
          },
          {
            value: 'read',
            label: 'Get Row(s)',
            correct: true,
            why: 'This pulls the rows out of the tab and hands each one on as an item. That is what makes the sheet a source in the middle of the flow instead of the place the flow stops.',
          },
          {
            value: 'update',
            label: 'Update Row',
            correct: false,
            why: 'This edits rows that already exist. You would need to know which row and what to put in it, and neither is the job — nothing about this flow changes the sheet.',
          },
        ],
      },
      {
        key: 'readRangeDefinition',
        label: 'Data Location on Sheet',
        subtitle: 'Which part of the tab counts as the data.',
        options: [
          {
            value: 'detectAutomatically',
            label: 'Detect Automatically',
            correct: true,
            why: 'The node works out where the table starts and reads to the end of it. Brightleaf adds beans and drops beans, and this keeps working when the tab is forty-one rows long instead of forty.',
          },
          {
            value: 'specifyRangeA1',
            label: 'Specify Range (A1 Notation)',
            correct: false,
            why: 'You would type something like A1:F41. It works this morning. The morning somebody adds a new single-lot at row 42, that bean simply never appears in the post and nothing tells you — the run is green either way.',
          },
          {
            value: 'specifyRange',
            label: 'Specify Range (Rows)',
            correct: false,
            why: 'Same problem in a friendlier shape: you name the header row and the first data row, but you are still pinning the table down by hand on a tab whose length changes.',
          },
        ],
      },
      {
        key: 'readReturnFirstMatch',
        label: 'Return only First Matching Row',
        kind: 'boolean',
        correct: false,
        subtitle: 'Whether to stop after one row.',
        whyCorrect:
          'Right, off. Every row of the tab has to be looked at, because any bean at any of the four locations could be the one running low.',
        whyWrong:
          'Switch this on and the node hands back a single row and stops. Ask what the next step is supposed to be comparing, and how many beans it has to compare.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // The comparison. One condition, and the boundary in it is a real argument.
  // ---------------------------------------------------------------------------
  filter: {
    // A row that survived. Filter does not change an item, so what comes out is what
    // went in — which is what makes the next node's Input pane readable.
    sampleOutput: {
      bean: 'Ethiopia Guji',
      location: 'Kalyani Nagar',
      kg_on_hand: 1.2,
      reorder_level: 6,
      supplier: 'Kerehaklu Estates',
      last_counted: '2026-08-08',
    },
    // The combinator row is gone, and it is not cosmetic. It read "Combine Conditions:
    // AND — every condition must be true", which is a claim about a control real n8n
    // does not even show until there are two conditions to combine — and this node has
    // one. Worse, the `uncounted` Stress Testing question's correct answer proposes
    // widening the rule to "below its level OR blank or not a number", so a learner who
    // read this panel literally had been told, on the screen where they configured it,
    // that this node only does AND. That is a graded question argued against by the
    // author's own locked copy. The OR is a redesign of the condition, and nothing in
    // the node forbids it; the panel should not imply otherwise.
    //
    // Nothing in `n8nNodeSpecs.js` reads this row — the exporter takes the combinator
    // from a graded `conditionsCombinator` field, which this case does not author, so
    // it exports n8n's default. Removing the row changes no exported parameter.
    //
    // Nothing replaces it, deliberately. The obvious substitutes — "Type Validation:
    // Strict", "Convert types where required: Off" — are all statements about the
    // mechanism `uncounted` explicitly asks the learner to set aside, and a panel that
    // names it invites exactly the reading ("strict, so it must error, so stop the run")
    // that the question marks wrong. One true row is better than two, one of which
    // argues with a graded answer.
    locked: [{ label: 'Ignore Case', value: 'On' }],
    fields: [
      {
        key: 'leftValue',
        label: 'Condition — left side',
        subtitle: 'The value being tested, taken from the row that just arrived.',
        options: [
          {
            value: 'reorder_level',
            label: '{{ $json.reorder_level }}',
            correct: false,
            why: 'That is the line each bean is measured against, not the thing being measured. Put it on the left and you are asking whether the threshold is below something, which is backwards.',
          },
          {
            value: 'kg_on_hand',
            label: '{{ $json.kg_on_hand }}',
            correct: true,
            why: 'What is actually in the store room for this bean at this location. That is the number that can fall, so it is the one being tested.',
          },
          {
            value: 'bean',
            label: '{{ $json.bean }}',
            correct: false,
            why: 'The name of the coffee. Names do not go up and down; you cannot ask whether "Ethiopia Guji" is less than anything.',
          },
          {
            value: 'last_counted',
            label: '{{ $json.last_counted }}',
            correct: false,
            why: 'When somebody last weighed it. Genuinely useful — a count three weeks old is worth knowing about — but it says nothing about how much is left today.',
          },
        ],
      },
      {
        // The `<` versus `<=` argument. Cheap to get wrong, and worth arguing about —
        // but the argument is about the BRIEF, not about inventory theory. A reorder
        // point is conventionally the level at which you place the order, which makes
        // `<=` the domain-normal rule; the `why` below used to claim the opposite ("a
        // bean sitting on its level has a full reorder's worth of runway"), which told
        // any supply-chain-literate learner something false in order to win an
        // argument the brief had already won. The brief says *below*. That is enough.
        key: 'operatorId',
        label: 'Condition — operator',
        subtitle: 'How the two sides are compared. Read the rule in the brief very carefully.',
        options: [
          {
            value: 'number:lte',
            label: 'is less than or equal to',
            correct: false,
            why: 'This also keeps a bean sitting exactly on its reorder level. It is a defensible rule — plenty of stock systems order the moment you touch the line — so this is not a silly answer. It is just not the one you were given: the brief says the row has to have *dropped below* its reorder level, and a bean sitting exactly on it has not dropped below it. When the rule and your instinct disagree, implement the rule and raise the instinct with Ritika.',
          },
          {
            value: 'number:gt',
            label: 'is greater than',
            correct: false,
            why: 'This keeps everything that is comfortably stocked and drops the shortages. The post would be thirty-seven lines of beans nobody has to think about.',
          },
          {
            value: 'number:lt',
            label: 'is less than',
            correct: true,
            why: 'Strictly below, which is what "has dropped below its reorder level" says. Exactly at the level is not below it, and that bean stays off the shortlist.',
          },
          {
            value: 'number:equals',
            label: 'is equal to',
            correct: false,
            why: 'This keeps only the beans sitting precisely on their level and nothing else — so a bean at 1.2 kg against a level of 6 would be dropped, which is the one you most needed to see.',
          },
        ],
      },
      {
        key: 'rightValue',
        label: 'Condition — right side',
        subtitle: 'What the left side is compared against.',
        options: [
          {
            value: '10',
            label: '10',
            correct: false,
            why: 'One number for every bean. The house Brazil needs reordering at 25 kg and the Ethiopia Guji at 6, so a flat 10 would flood the post with Brazil every single day and never once mention the Guji until it was gone.',
          },
          {
            value: 'kg_on_hand',
            label: '{{ $json.kg_on_hand }}',
            correct: false,
            why: 'The same value that is already on the left. A number is never less than itself, so this condition answers no on every single row of the sheet, every single morning.',
          },
          {
            value: 'supplier',
            label: '{{ $json.supplier }}',
            correct: false,
            why: 'Who Brightleaf buys the bean from. Worth having in the message so the buyer knows who to call, but it is a name and there is nothing to compare a quantity against.',
          },
          {
            value: 'reorder_level',
            label: '{{ $json.reorder_level }}',
            correct: true,
            why: 'Each row carries its own level, and this reads that row\'s. It is the whole reason Ritika cannot just scan for small numbers: the comparison is per bean, and this is what makes it per bean.',
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Many items in, one item out.
  // ---------------------------------------------------------------------------
  aggregate: {
    // One item, holding the whole shortlist. This is what the Slack node's Input pane
    // shows, and the only field its "Insert field…" dropdown can offer.
    sampleOutput: {
      low_stock: [
        { bean: 'Ethiopia Guji', location: 'Kalyani Nagar', kg_on_hand: 1.2, reorder_level: 6, supplier: 'Kerehaklu Estates' },
        { bean: 'Brazil Cerrado Ho.', location: 'Roastery', kg_on_hand: 18, reorder_level: 25, supplier: 'Fazenda Rio Verde' },
        { bean: 'Decaf Colombia', location: 'Baner', kg_on_hand: 0, reorder_level: 4, supplier: 'Cafe Granja' },
      ],
    },
    // THERE IS NO `locked` BLOCK ON THIS NODE, and that is the fix for a real defect
    // rather than a tidy-up. `Ndv.jsx` runs `compatibleCatalogParams()`, which renders
    // the node's full native catalog surface whenever every authored key is also a
    // native catalog key. `aggregate` is the only node in this case where that is true,
    // so the live catalog controls appear alongside the authored ones — and this panel
    // used to carry a locked, disabled row reading "Put Output in Field: low_stock"
    // three inches from the live catalog control of the same name sitting at its n8n
    // default, `data`. Two controls, one label, contradicting each other, on the exact
    // field name the graded Slack answer `{{ $json.low_stock }}` depends on.
    //
    // Authored fields merge over catalog params BY KEY, so grading `destinationFieldName`
    // collapses the pair into one control and the contradiction is gone. It is also a
    // better question than the locked row was: the name typed here is the name the post
    // has to read, which is the one piece of coupling in this flow that a learner can
    // get wrong in a way nothing complains about.
    fields: [
      {
        // Real n8n offers two modes here and no more, so this field has two options
        // and decays 100/0 — the second attempt is forced by elimination and earns
        // nothing. An invented third option would soften that curve, and was tried
        // and rejected: this product's value is that the panel is the real panel, and
        // one fabricated control costs more than a harsh decay on one item.
        //
        // Worth knowing when reading this panel: the live catalog surface means this
        // field opens PRE-FILLED at n8n's own default (`aggregateIndividualFields`,
        // which is wrong here) rather than blank. `destinationFieldName` below opens
        // unanswered and pulsing, so the panel does not read as already complete —
        // which is what makes the pre-fill survivable.
        key: 'aggregate',
        label: 'Aggregate',
        subtitle: 'What shape the collected items come out in.',
        options: [
          {
            value: 'aggregateIndividualFields',
            label: 'Individual Fields',
            correct: false,
            why: 'This gathers each named column into a list of its own — all the bean names in one list, all the quantities in another. Nothing then ties a bean to its own shortfall, and the message would have to line the lists back up by position and hope. It is also what this node is set to before you touch it, so it is the answer you get for not answering.',
          },
          {
            value: 'aggregateAllItemData',
            label: 'All Item Data (Into a Single List)',
            correct: true,
            why: 'Every item that reached this step is handed on inside one item, each row still whole — bean, location, quantity and level together. That is the shape the message needs.',
          },
        ],
      },
      {
        // Graded, not locked, for the reason above — and it earns its place. In real
        // n8n this field defaults to `data`, and whatever goes in it is the name the
        // next node must read. Get it wrong and nothing complains: the run is green,
        // the post is empty, and the expression in the Slack step points at a field
        // that was never created.
        //
        // n8n shows this field only once the mode above is All Item Data (the catalog
        // descriptor carries that `showWhen`), so the two questions arrive in the right
        // order on their own: choose the shape, then name what comes out.
        key: 'destinationFieldName',
        label: 'Put Output in Field',
        // `kind` is REQUIRED here, and it is the whole reason this field works.
        // Aggregate is the one node whose native catalog surface renders live (all
        // its graded keys are native keys), and `mergeCatalogFields` spreads the
        // authored overlay over the catalog param — so without an explicit kind the
        // catalog's `text` wins, the four options below never render, and the field
        // becomes a free-text box demanding an exact string nothing on the panel
        // shows. A learner who typed a perfectly sensible `shortlist` would be
        // marked wrong and get an EMPTY Iris bubble, because there is no matching
        // option to take a `why` from.
        kind: 'select',
        subtitle: 'The name the gathered list arrives under. Whatever you choose here is what the next step has to read.',
        options: [
          {
            value: 'Stock',
            label: 'Stock',
            correct: false,
            why: 'That is the name of the tab the rows came from, and this is not the tab — it is the three rows out of forty that failed the comparison. Naming a value after where it came from rather than what it is reads fine on the day you write it and misleads everybody after that.',
          },
          {
            value: 'data',
            label: 'data',
            correct: false,
            why: 'n8n\'s own default, so this is what you get for leaving the field alone — and it is why the field is worth a question. Every Aggregate node in every workflow calls its output `data`, so the expression in the post would say `data` and tell the next person nothing about what is in it. Name it for what it holds and the message step reads like a sentence.',
          },
          {
            value: 'bean',
            label: 'bean',
            correct: false,
            why: 'Two problems. It holds a list of rows, not one bean — and `bean` is already a column name inside every one of those rows, so the flow would now have two different things reachable by that word and you would have to keep track of which one you meant.',
          },
          {
            value: 'low_stock',
            label: 'low_stock',
            correct: true,
            why: 'Names what is actually in it: the beans that came out under their reorder level. Look at this node\'s Output pane after you verify, and then at the next node\'s Input pane — this is the field name that appears in both, and it is the word the message step has to reach for. That is the coupling worth noticing here: nothing checks that the two agree, so if you change this name you have to change the post with it.',
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // The post. Channel and operation are given; what goes IN the message is the decision.
  // ---------------------------------------------------------------------------
  slack: {
    credential: 'Slack — Brightleaf Roasters',
    // What Slack answers with. Nothing downstream reads it — this is the confirmation
    // the learner gets that their node did the right thing.
    //
    // `message.text` is what the GRADED answer actually posts, which is not the same as
    // what a finished ops flow would post. The correct value here is the whole gathered
    // shortlist in one go, so what lands in the channel is the shortlist raw — every
    // row, every column, unformatted. This pane used to show three hand-formatted lines
    // that no authored answer produces, which quietly told the learner their correct
    // answer did something it does not do. Formatting the lines is explicitly not the
    // skill under test (see the `text` field below); showing the raw dump is honest
    // about where the case stops, and it is the natural opening for "so how would you
    // make that readable?".
    sampleOutput: {
      ok: true,
      channel: 'C08SUPPLYCH',
      ts: '1786501800.000200',
      message: {
        text:
          '[{"bean":"Ethiopia Guji","location":"Kalyani Nagar","kg_on_hand":1.2,"reorder_level":6,"supplier":"Kerehaklu Estates"},' +
          '{"bean":"Brazil Cerrado Ho.","location":"Roastery","kg_on_hand":18,"reorder_level":25,"supplier":"Fazenda Rio Verde"},' +
          '{"bean":"Decaf Colombia","location":"Baner","kg_on_hand":0,"reorder_level":4,"supplier":"Cafe Granja"}]',
        username: 'Brightleaf Ops',
      },
    },
    locked: [
      { label: 'Resource', value: 'Message' },
      { label: 'Operation', value: 'Send' },
      { label: 'Send Message To', value: 'Channel' },
      { label: 'Channel', value: '#supply-chain' },
      { label: 'Message Type', value: 'Simple Text Message' },
    ],
    settings: [
      {
        // The toggle a learner reaches for when they have heard that a node runs once
        // per item. It is the wrong tool here, and knowing WHY it is wrong is the point.
        key: 'executeOnce',
        correct: false,
        why: {
          false:
            'Right, leave it off. Whatever reaches this node has already been brought together into one item upstream, so there is nothing left for this toggle to trim and turning it on would only hide a step that was missing.',
          true:
            'This does make the node run once — by keeping the first item that arrives and throwing away every other one. That is not the same as putting them together, and if the step before this ever stopped doing its job you would get a post naming one bean and never notice the rest had gone.',
        },
      },
    ],
    fields: [
      {
        // Q3 of the brief: grade only that the learner reached for the gathered field
        // rather than one row's column. Formatting the lines is not the skill under test.
        key: 'text',
        label: 'Message Text',
        subtitle: 'What actually goes in the post. Look at what the Input pane is offering.',
        options: [
          {
            value: 'bean',
            label: '{{ $json.bean }}',
            correct: false,
            why: 'A single bean name, and not even reliably one of the low ones — the item arriving here is not a row any more. Look at the Input pane: there is one field on it, and it is not this.',
          },
          {
            value: 'low_stock',
            label: '{{ $json.low_stock }}',
            correct: true,
            why: 'The gathered shortlist, every row of it, in one value — and it is the only thing on the item that reaches this node. Look at what lands in the channel, though: the whole list goes in raw, columns and all. Getting the right value into the message is the decision here; turning it into four tidy lines is a separate job, and one you now know exactly where to do.',
          },
          {
            value: 'kg_on_hand',
            label: '{{ $json.kg_on_hand }}',
            correct: false,
            why: 'A bare number with nothing to say which bean it belongs to. Even if it resolved, "1.2" posted into a channel at half past seven tells the buyer nothing.',
          },
          {
            value: 'reorder_level',
            label: '{{ $json.reorder_level }}',
            correct: false,
            why: 'The threshold, not the shortage — and a threshold on its own is a fact about the sheet, not news. The step before this collected something; post that.',
          },
        ],
      },
    ],
  },
};
