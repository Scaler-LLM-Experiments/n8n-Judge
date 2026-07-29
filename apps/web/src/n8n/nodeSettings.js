// The node Settings tab, matching real n8n. Every n8n node carries the same
// settings regardless of type, so this spec is shared rather than per-node.
//
// The tab used to be hard-disabled ("nothing here matters for this task"),
// which meant a whole half of the n8n node model was invisible — and the
// error-handling behaviour that separates a robust workflow from a fragile
// one was unteachable and ungradable.
//
// Which of these a given problem GRADES is data (`nodeSetup[type].settings`).
// Only those are editable. Everything else renders at its real n8n default but
// LOCKED, exactly like the `locked` context fields on the Parameters tab.
//
// That is deliberate: the job here is building the right node structure for a
// problem, not touring every knob n8n has. Showing the full set teaches the
// shape of a node; leaving the irrelevant ones inert keeps attention on the
// two or three that actually decide whether this flow behaves.

export const SETTINGS_SPEC = [
  {
    key: 'alwaysOutputData',
    label: 'Always Output Data',
    kind: 'boolean',
    default: false,
    hint: 'Emit one empty item instead of nothing when this node produces no output.',
    warn: 'Risky on IF/Switch-style nodes — it can create loops that never end.',
  },
  {
    key: 'executeOnce',
    label: 'Execute Once',
    kind: 'boolean',
    default: false,
    // Kept deliberately: n8n runs a node once PER INPUT ITEM by default, and
    // not knowing that is a top-listed misconception ("why did it send five
    // messages?"). This toggle is the switch that makes implicit looping
    // visible, so it teaches the concept rather than merely exposing a knob.
    hint: 'Run once using only the first input item, instead of once per item.',
  },
  {
    key: 'retryOnFail',
    label: 'Retry On Fail',
    kind: 'boolean',
    default: false,
    hint: 'Automatically run this node again if it errors.',
    reveals: ['maxTries', 'waitBetweenTries'],
  },
  {
    key: 'maxTries',
    label: 'Max. Tries',
    kind: 'number',
    default: 3,
    min: 2,
    max: 5,
    dependsOn: 'retryOnFail',
  },
  {
    key: 'waitBetweenTries',
    label: 'Wait Between Tries (ms)',
    kind: 'number',
    default: 1000,
    min: 0,
    max: 5000,
    step: 100,
    dependsOn: 'retryOnFail',
  },
  {
    key: 'onError',
    label: 'On Error',
    kind: 'select',
    default: 'stopWorkflow',
    // Labels are n8n's, verbatim. "Continue" used to read "Continue (using last
    // valid data)", which is the opposite of what n8n does: it passes the ERROR
    // as an item on the regular output, carrying nothing usable forward. The
    // graded explanation always said so, so the dropdown contradicted the
    // feedback on the same question. See docs/n8n-reference/00-how-n8n-actually-works.md §5.
    hint: 'What happens when this node fails. Stop Workflow halts everything; Continue passes the error on as data; Continue (using error output) sends it down a separate error branch.',
    options: [
      { value: 'stopWorkflow', label: 'Stop Workflow' },
      { value: 'continueRegularOutput', label: 'Continue' },
      { value: 'continueErrorOutput', label: 'Continue (using error output)' },
    ],
  },
  {
    key: 'notes',
    label: 'Notes',
    kind: 'text',
    default: '',
    placeholder: 'Why this node is here, gotchas, TODOs…',
  },
  {
    key: 'notesInFlow',
    label: 'Display Note in Flow?',
    kind: 'boolean',
    default: false,
    hint: 'Show the note as a caption under the node on the canvas.',
    dependsOn: 'notes',
  },
];

export const SETTINGS_BY_KEY = Object.fromEntries(SETTINGS_SPEC.map((s) => [s.key, s]));

/** Real n8n defaults for every setting — the starting state of a fresh node. */
export function defaultSettings() {
  const out = {};
  for (const s of SETTINGS_SPEC) out[s.key] = s.default;
  return out;
}

/**
 * Is a setting currently relevant? `maxTries` is meaningless with Retry On Fail
 * off, and n8n hides it — mirror that so the panel doesn't teach a wrong shape.
 */
export function isActive(spec, values) {
  if (!spec.dependsOn) return true;
  const parent = values[spec.dependsOn];
  return spec.dependsOn === 'notes' ? Boolean(String(parent ?? '').trim()) : Boolean(parent);
}

/**
 * Grade the settings a problem actually cares about.
 *
 * `graded` is the problem's list: [{ key, correct, why }]. A setting whose
 * correct value IS the n8n default is a legitimate question — knowing not to
 * touch something is a real skill, and it's what stops "flip every toggle"
 * from being a winning strategy.
 */
export function gradeSettings(graded, values) {
  return (graded ?? []).map((g) => {
    const spec = SETTINGS_BY_KEY[g.key];
    const actual = values[g.key] ?? spec?.default;
    const correct = actual === g.correct;
    return {
      key: g.key,
      label: spec?.label ?? g.key,
      correct,
      expected: g.correct,
      actual,
      // `why` is a map keyed by the chosen value, so a learner is told why
      // THEIR choice is right or wrong — not handed one blanket sentence that
      // reads the same whichever way they went. Parameters already work this
      // way; settings had a single string, which was the inconsistency.
      why: whyFor(g, actual),
    };
  });
}

export function whyFor(graded, value) {
  const why = graded?.why;
  if (!why) return undefined;
  if (typeof why === 'string') return why; // tolerate the older single-string shape
  return why[String(value)];
}
