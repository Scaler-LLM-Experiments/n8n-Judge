// What each Judge node type becomes in a REAL n8n workflow file.
//
// ---------------------------------------------------------------------------
// Why this file exists, and why it is not the catalog
// ---------------------------------------------------------------------------
// `@judge/catalog` describes a node for TEACHING: a label, a category, and
// parameters shaped for the NDV (`{ key, label, value, kind }`). That shape is
// deliberately not n8n's. Real n8n wants each node's actual parameter schema at
// a specific `typeVersion` — Gmail send wants `sendTo`/`subject`/`message`,
// Switch wants a `rules.values[]` of v2 condition-builder objects, Set wants
// `assignments.assignments[]`.
//
// So this is the translation layer, and it is the difference between "shaped
// like n8n" (which `@judge/workflow` already gives us) and "imports into n8n and
// runs" (which is the point of the download).
//
// Everything here is written against docs/n8n-reference/00-how-n8n-actually-works.md,
// which is pinned to n8n v2.34.0 at commit 3d68c29b9281f14097aa9f15e01ac0777e538b11. When you touch a spec, check
// §2 (the workflow document), §4 (parameters are sparse) and §6 (typeVersion).
//
// ---------------------------------------------------------------------------
// Two rules for anything added here
// ---------------------------------------------------------------------------
// 1. **Emit values that WORK, not values that merely validate.** A learner
//    imports this and presses Execute. A missing `documentId` makes the node
//    open with a red required field, which is honest; a *wrong* expression makes
//    it fail at runtime, which is worse than blank.
// 2. **Sparse beats complete.** n8n stores only what differs from the default
//    and only what is currently displayed (§4), so a real workflow for a
//    correctly-configured node is smaller than the form suggests. Do not pad.
import { NODE_CATALOG, descriptorFieldIsVisible } from '@judge/catalog';

/**
 * A placeholder every credential stub carries.
 *
 * n8n imports a node whose credential id does not resolve perfectly happily — it
 * shows the node needing a credential, which is exactly the state a learner
 * should be in: they have to attach their OWN Gmail, not ours. Omitting
 * `credentials` entirely is worse, because then the node does not even say which
 * kind of credential it wants.
 */
const CRED = (type, name) => ({ [type]: { id: null, name } });

/** A stable-ish id for a repeatable parameter row. n8n uses uuids; it only has
 *  to be unique within the node, and a deterministic one keeps exports diffable. */
const rowId = (prefix, i) => `${prefix}-${i}`;

/**
 * The authored answer for one graded field, if the case made it knowable.
 *
 * Judge stores a select's answer as the `correct: true` option, whose `value` is
 * a Judge token (`'email'`) and whose `label` is often the real thing the learner
 * picked (`'{{ $json.Email }}'`). Neither is reliably an n8n parameter value, so
 * a spec may use this as a HINT and must never depend on it — which is why every
 * spec below also has a working default.
 */
function authored(setup, key) {
  const field = (setup?.fields ?? []).find((f) => f.key === key);
  if (!field) return undefined;
  if (field.options) {
    const correct = field.options.find((o) => o.correct === true);
    // `expression` wins over `label` for the same reason it does in expectedRows: the
    // label is what a learner compares in the picker, and a full URL or expression is
    // often too long to read there. Callers use `label` as the n8n-ready value, so
    // resolving it here keeps every spec unchanged.
    return correct ? { value: correct.value, label: correct.expression ?? correct.label } : undefined;
  }
  if (field.correct !== undefined) return { value: field.correct, label: String(field.correct) };
  return undefined;
}

/**
 * A value from the case's LOCKED panel — the fields a case shows at real n8n
 * defaults but does not grade.
 *
 * Locked rows are the only place some real parameters exist, because they are
 * context rather than decisions: the form's questions, an email subject, a model
 * name, an extractor's attribute list. `form-trigger` already recovered its form
 * fields this way; this is the same trick, named, so the other specs can use it.
 *
 * Takes several labels because cases word the same row differently ("Body" /
 * "Message"), and returns the first that is present and non-empty.
 */
function lockedValue(setup, ...labels) {
  for (const label of labels) {
    const row = (setup?.locked ?? []).find((l) => l.label === label);
    const value = String(row?.value ?? '').trim();
    if (value) return value;
  }
  return '';
}

/**
 * The authored answer for a field, but ONLY when n8n could actually use it.
 *
 * A select's `label` is usually the real thing the learner picked
 * (`{{ $json.subject_email }}`, `#ops-desk`), which is exactly what the parameter
 * wants. But a case may legitimately phrase an option as prose — "The one-line
 * summary the reading step wrote" is a perfectly good thing to ask a learner and a
 * terrible thing to put in an email body. Emitting that label produces a file that
 * imports cleanly and then mails an English sentence to a customer, which is the
 * exact failure mode this whole module exists to prevent.
 *
 * So: take the label when it is an expression, or a single bare token (an address,
 * a channel name, a mode). Prose has spaces and no braces, and gets nothing — a
 * blank required field in n8n is honest, and the learner can see and fill it.
 */
function usableValue(setup, key) {
  const hint = authored(setup, key);
  const raw = hint?.label ?? hint?.value;
  if (typeof raw !== 'string') return '';
  const value = raw.trim();
  if (!value) return '';
  if (value.includes('{{') || value.startsWith('=')) return expr(value);
  return /\s/.test(value) ? '' : value;
}

/**
 * The body of an outgoing message, for Gmail and Slack alike.
 *
 * A case that writes the body as locked copy has already said the real thing; a
 * case that grades WHICH value goes in the body has usually written its options as
 * prose, and `usableValue` correctly refuses those. Falling through to empty is
 * deliberate — see the note on `usableValue`.
 */
function messageBody(setup, key) {
  return expr(lockedValue(setup, 'Body', 'Message', 'Message body', 'Text')) || usableValue(setup, key);
}

/** n8n's Schedule Trigger numbers the week 0=Sunday … 6=Saturday. */
const WEEKDAY_NUMBERS = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

/** "Monday, Tuesday, Wednesday, Thursday, Friday" → [1, 2, 3, 4, 5]. */
function weekdayNumbers(text) {
  const found = String(text ?? '').toLowerCase().split(/[^a-z]+/).filter(Boolean)
    .map((word) => WEEKDAY_NUMBERS[word])
    .filter((n) => n !== undefined);
  return [...new Set(found)];
}

/**
 * A Judge operator token (`'number:lt'`) as n8n's condition operator object.
 *
 * Resolved from the CATALOG's own option list rather than a mapping table here,
 * because the descriptor already carries each option's `sourceValue`
 * (`{ type, operation, singleValue }`) read out of n8n's source. A second table
 * would be a copy that silently drifts from the first.
 */
function conditionOperator(token) {
  const conditions = (NODE_CATALOG.filter?.params ?? []).find((p) => p.key === 'conditions');
  const operators = (conditions?.fields ?? []).find((f) => f.key === 'operatorId');
  const option = (operators?.options ?? []).find((o) => o.value === token);
  return option?.sourceValue ?? { type: 'string', operation: 'equals' };
}

/**
 * An Information Extractor's attributes, parsed out of the case's locked panel.
 *
 * A case writes them as one textarea, one attribute per line, `name — what it
 * means`. Only a line that really looks like `identifier` or `identifier <sep>
 * description` is taken: anything else is prose about the panel, and inventing an
 * attribute called "Extracts" from it would be worse than emitting nothing.
 */
function extractorAttributes(setup) {
  const block = lockedValue(setup, 'Attributes', 'Attribute Descriptions', 'Fields to extract');
  const rows = [];
  for (const line of block.split('\n')) {
    const text = line.trim();
    if (!text) continue;
    const withDescription = text.match(/^([A-Za-z_][\w]*)\s*[—–:-]\s*(.+)$/);
    const bare = text.match(/^([A-Za-z_][\w]*)$/);
    if (withDescription) rows.push({ name: withDescription[1], type: 'string', description: withDescription[2].trim() });
    else if (bare) rows.push({ name: bare[1], type: 'string', description: '' });
  }
  return rows;
}

/** n8n's Gmail `emailType`, from however the case worded its locked row. */
function emailTypeOf(locked) {
  return /html/i.test(locked) ? 'html' : 'text';
}

/** Slack addresses a channel by `#name` in `name` mode; an expression names it at run time. */
function channelName(value) {
  if (!value) return '';
  if (value.startsWith('=') || value.includes('{{')) return value;
  return value.startsWith('#') ? value : `#${value}`;
}

/**
 * The authored rows of an assignmentList/ruleList field, with each row's real n8n
 * expression resolved.
 *
 * This indirection is the whole trick, and getting it wrong produces a file that
 * imports and then writes garbage. `expect.assignments` stores Judge's option
 * TOKENS — `{ name: 'Full Name', value: 'form.name' }` — while the expression the
 * learner actually picked lives in the matching option's LABEL:
 *
 *   valueOptions: [{ value: 'form.name', label: '{{ $json["Full Name"] }}', correct: true }]
 *
 * Emitting the token puts the literal string "form.name" in every spreadsheet
 * cell. So each row is resolved back through `valueOptions` to its label, which
 * is a real expression. Rows whose token has no matching option fall back to the
 * token and are reported by the exporter rather than silently shipped.
 */
function expectedRows(setup, key) {
  const field = (setup?.fields ?? []).find((f) => f.key === key);
  const rows = field?.expect?.assignments ?? field?.expect?.rules ?? [];
  // `expression` when the author set one, `label` otherwise. The two split because the
  // label is what a learner compares in a dropdown, and requiring it to be a working
  // n8n expression is what grew one option to 296 characters of inline JavaScript.
  const byToken = new Map((field?.valueOptions ?? []).map((o) => [o.value, o.expression ?? o.label]));
  return rows.map((r) => ({
    ...r,
    // `expression` is the n8n-ready form; `value` stays the Judge token so a
    // caller can tell which option was authored.
    expression: byToken.get(r.value) ?? r.value,
    resolved: byToken.has(r.value),
  }));
}

/**
 * Wrap a value as an n8n expression if it is not already one.
 *
 * n8n only evaluates a parameter that begins with `=`. A plain `{{ … }}` string
 * is a literal, which is one of the commonest hand-authoring mistakes and looks
 * like the expression silently not working.
 */
function expr(value) {
  const s = String(value ?? '');
  if (!s) return '';
  if (s.startsWith('=')) return s;
  return s.includes('{{') ? `=${s}` : s;
}

const clone = (value) => {
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
  return value;
};

const setAtPath = (target, path, value) => {
  const keys = String(path).split('.').filter(Boolean);
  let cursor = target;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) cursor[key] = value;
    else cursor = cursor[key] ??= {};
  });
};

const normalizeValue = (value) => {
  if (typeof value === 'string') return expr(value);
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, normalizeValue(child)]));
  return value;
};

function selectedValue(field, value) {
  const option = field.options?.find((candidate) => candidate.value === value);
  if (option?.sourceValue) return normalizeValue(option.sourceValue);
  if (option?.type && option?.operation) {
    return { type: option.type, operation: option.operation, ...(option.nameKey ? { name: option.nameKey } : {}) };
  }
  return normalizeValue(value);
}

function serializeFields(fields, values, rootValues) {
  const out = {};
  for (const field of fields ?? []) {
    if (field.kind === 'notice' || !descriptorFieldIsVisible(field, rootValues)) continue;
    const path = field.n8nKey ?? field.key;
    if (!path || path.startsWith('credentials.') || !Object.hasOwn(values, field.key)) continue;
    const current = values[field.key];
    let value;
    if (field.kind === 'collection') {
      const children = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
      value = serializeFields(field.fields, children, { ...rootValues, ...children });
    } else if (field.kind === 'fixedCollection') {
      const itemKey = field.collectionKey || Object.keys(field.value ?? {})[0] || 'values';
      const rawRows = current?.[itemKey];
      const rows = Array.isArray(rawRows) ? rawRows : rawRows && typeof rawRows === 'object' ? [rawRows] : [];
      const serialized = rows.map((row) => serializeFields(field.fields, row, { ...rootValues, ...row }));
      const nativeRows = field.multiple === false ? (serialized[0] ?? {}) : serialized;
      value = path.split('.').at(-1) === itemKey ? nativeRows : { [itemKey]: nativeRows };
    } else {
      value = selectedValue(field, current);
    }
    setAtPath(out, path, value);
  }
  return out;
}

/** Descriptor-based fallback for catalog nodes without a case-specific export adapter. */
export function genericNodeSpec(judgeType) {
  const entry = NODE_CATALOG[judgeType];
  if (!entry) return null;
  return {
    parameters: ({ node, setup }) => {
      const values = Object.fromEntries((entry.params ?? [])
        .filter((field) => Object.hasOwn(field, 'value'))
        .map((field) => [field.key, clone(field.value)]));
      Object.assign(values, node?.data?.values ?? node?.values ?? {});
      for (const field of setup?.fields ?? []) {
        const answer = field.options?.find((option) => option.correct)?.value ?? field.correct;
        if (answer !== undefined && Object.hasOwn(values, field.key)) values[field.key] = clone(answer);
      }
      return serializeFields(entry.params, values, values);
    },
    credentials: ({ node }) => {
      const values = {
        ...Object.fromEntries((entry.params ?? []).map((field) => [field.key, clone(field.value)])),
        ...(node?.data?.values ?? node?.values ?? {}),
      };
      const requirements = (entry.credentialRequirements ?? []).filter((requirement) =>
        descriptorFieldIsVisible(requirement, values));
      return requirements.length
        ? Object.fromEntries(requirements.map((requirement) => [requirement.type, { id: null, name: requirement.name ?? requirement.type }]))
        : null;
    },
  };
}

/** n8n's resourceLocator shape. `mode: 'list'` needs a cached name to display. */
const rl = (value, name, mode = 'list') => ({
  __rl: true,
  mode,
  value,
  ...(mode === 'list' && name ? { cachedResultName: name } : {}),
});

/**
 * A v2 condition-builder block — Switch, If and Filter all share it (§11).
 *
 * `options.version: 2` is not decoration: the condition builder's shape is keyed
 * off it, and a v1-shaped condition inside a typeVersion 3.4 Switch is the kind
 * of thing that imports and then refuses to evaluate.
 */
function condition(leftValue, rightValue, i) {
  return {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
    conditions: [
      {
        id: rowId('cond', i),
        leftValue: expr(leftValue),
        rightValue,
        operator: { type: 'string', operation: 'equals', name: 'filter.operator.equals' },
      },
    ],
    combinator: 'and',
  };
}

/**
 * Edit Fields (Set) v3.5, shared by the canonical type and its legacy alias.
 *
 * The learner's job in Judge is the assignment list, so the authored
 * `expect.assignments` is exactly the parameter payload. Defined once and registered
 * under both `edit-fields` and `parse` below: two copies would drift, and this node's
 * whole export is the one repeatable group the generic fallback cannot derive.
 */
const EDIT_FIELDS_SPEC = {
  parameters: ({ setup }) => {
    const rows = expectedRows(setup, 'fields');
    return {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: rows.map((r, i) => ({
          id: rowId('assign', i),
          name: r.name ?? r.key ?? `field${i + 1}`,
          value: expr(r.expression ?? r.value ?? ''),
          type: 'string',
        })),
      },
      options: {},
    };
  },
};

/**
 * Per Judge node type: what it becomes in n8n.
 *
 * `parameters(ctx)` receives `{ node, problem, setup, branches }` — the
 * reference-graph node, the whole problem, that type's `nodeSetup` entry, and the
 * problem's branch list. Everything a spec needs to emit real values comes from
 * problem data, so a case gets a working file with nothing extra authored.
 *
 * `n8nType` / `typeVersion` are read from the catalog unless a spec overrides
 * them. An override MUST carry `overrideReason` — see the classify entry, and the
 * test that enforces it.
 */
export const N8N_NODE_SPECS = {
  // --- triggers -------------------------------------------------------------

  trigger: {
    // Gmail Trigger is a polling trigger (`polling: true`, §6 table), so it needs
    // a poll schedule. n8n's own default is every minute.
    parameters: () => ({
      pollTimes: { item: [{ mode: 'everyMinute' }] },
      simple: false,
      filters: {},
    }),
    credentials: () => CRED('gmailOAuth2', 'Gmail account'),
  },

  'form-trigger': {
    parameters: ({ problem, setup }) => {
      const locked = Object.fromEntries((setup?.locked ?? []).map(({ label, value }) => [label, value]));
      const fields = String(locked['Form Fields'] ?? '')
        .split(/[,·]/)
        .map((label) => label.trim())
        .filter(Boolean);
      return {
        formTitle: locked['Form Title'] ?? problem.title ?? 'Form',
        formDescription: locked['Form Description'] ?? problem.brief ?? '',
        formFields: {
          values: fields.map((label) => ({ fieldLabel: label, fieldType: 'text', requiredField: false })),
        },
        options: {},
      };
    },
  },

  webhook: {
    parameters: () => ({ httpMethod: 'POST', path: 'judge', options: {} }),
  },

  schedule: {
    /**
     * Hourly is only the fallback. A case that grades *when* the sweep runs has
     * said something the export has to carry: "every weekday at 07:30" exported
     * as "every hour" is a workflow that does a different job from the one the
     * learner was graded on.
     *
     * Weekdays are the one part a case can only state as locked prose, and a case
     * may legitimately not state them at all: `triggerAtDay` only appears under a
     * Weeks interval in real n8n, so a case that GRADES the interval cannot show
     * the weekday row without handing over its own answer. When it is absent the
     * day is simply omitted — the import then runs weekly at the right time on
     * n8n's default day, which the learner can see and change. A wrong day in a
     * convenience file is a smaller cost than a free answer on a graded field.
     */
    parameters: ({ setup }) => {
      // The interval may be GRADED or merely SHOWN. A case that grades the hour has no
      // reason to grade the interval as well — the Days interval is what makes the hour
      // row exist in real n8n at all, so it is shown as a locked row instead. Reading
      // only the graded field made that case export `{ field: 'hours', hoursInterval: 1,
      // triggerAtHour: 9 }`, and n8n ignores `triggerAtHour` under an Hours interval: the
      // convenience file fired hourly while the learner was graded on 9 a.m.
      const shown = lockedValue(setup, 'Trigger Interval', 'Trigger interval').toLowerCase();
      const stem = shown.replace(/s$/, '');
      // `stem &&` is load-bearing: without it an absent row is the empty string, every
      // candidate starts with it, and `find` returns 'seconds'.
      const fromLocked = stem
        ? ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'cronExpression'].find((f) => f.startsWith(stem))
        : undefined;
      const field = authored(setup, 'interval')?.value ?? fromLocked ?? 'hours';
      const at = (key, ...lockedLabels) => {
        const graded = Number(authored(setup, key)?.value);
        if (Number.isFinite(graded)) return graded;
        // Same reasoning one level down: a case that grades the hour usually SHOWS the
        // minute, and dropping it exports "some time in the 9 o'clock hour".
        const locked = Number(lockedValue(setup, ...lockedLabels));
        return lockedLabels.length && Number.isFinite(locked) && lockedValue(setup, ...lockedLabels) !== '' ? locked : undefined;
      };
      const hour = at('triggerAtHour', 'Trigger at Hour');
      const minute = at('triggerAtMinute', 'Trigger at Minute');
      if (field === 'hours' && hour === undefined && minute === undefined) {
        return { rule: { interval: [{ field: 'hours', hoursInterval: 1 }] } };
      }
      const entry = { field };
      const countKey = { weeks: 'weeksInterval', days: 'daysInterval', months: 'monthsInterval', hours: 'hoursInterval' }[field];
      if (countKey) entry[countKey] = Number(lockedValue(setup, 'Weeks Between Triggers', 'Days Between Triggers', 'Months Between Triggers')) || 1;
      if (field === 'weeks') {
        const days = weekdayNumbers(lockedValue(setup, 'Trigger on weekdays', 'Trigger on Weekdays'));
        if (days.length) entry.triggerAtDay = days;
      }
      if (hour !== undefined) entry.triggerAtHour = hour;
      if (minute !== undefined) entry.triggerAtMinute = minute;
      return { rule: { interval: [entry] } };
    },
  },

  // --- core -----------------------------------------------------------------

  filter: {
    /**
     * Filter v2.2 — one condition, in n8n's v2 condition-builder shape.
     *
     * A case grades the three parts separately (`leftValue` / `operatorId` /
     * `rightValue`) because n8n's real control is a `fixedCollection`, which is
     * not a gradeable field kind. Reassembling them here is what turns those
     * three answers back into the parameter n8n actually stores.
     *
     * `looseTypeValidation: false` is emitted rather than left to default,
     * because n8n's default for it is version-dependent (§ the If/Filter notes in
     * docs/n8n-reference) and a comparison a case grades should not change
     * meaning with the typeVersion.
     *
     * What strict validation then DOES with a value it cannot parse — raise a
     * type error, or evaluate false and drop the row — is not settled here, and
     * no case should be authored as though it were. It could not be verified
     * against n8n's source from this repo.
     */
    parameters: ({ setup }) => {
      const left = usableValue(setup, 'leftValue');
      const right = usableValue(setup, 'rightValue');
      const operator = conditionOperator(authored(setup, 'operatorId')?.value);
      return {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
          combinator: (authored(setup, 'conditionsCombinator')?.value) ?? 'and',
          conditions: [{ id: rowId('condition', 0), leftValue: left, rightValue: right, operator }],
        },
        looseTypeValidation: false,
        options: {},
      };
    },
  },

  aggregate: {
    /**
     * Aggregate v1 — many items into one, which is the node this whole shape of
     * case exists to teach.
     *
     * `destinationFieldName` is the field every downstream expression then reads,
     * so a default of `data` against a case that says `low_stock` exports a Slack
     * message referring to a field that does not exist. It is stated as a locked
     * row rather than graded (the learner is asked to choose the MODE, not to name
     * the field), which is exactly what `lockedValue` is for.
     */
    parameters: ({ setup }) => {
      const mode = authored(setup, 'aggregate')?.value ?? 'aggregateAllItemData';
      if (mode !== 'aggregateAllItemData') {
        const rows = expectedRows(setup, 'fieldsToAggregate');
        return {
          aggregate: mode,
          fieldsToAggregate: {
            fieldToAggregate: rows.map((r) => ({ fieldToAggregate: r.name ?? r.key ?? '' })),
          },
          options: {},
        };
      }
      // Graded answer first, locked row second. A case may either grade the field
      // name (it is the name every downstream expression then has to read, which
      // is worth teaching) or state it as context — but it must not do both: the
      // catalog surface renders `destinationFieldName` live whenever every graded
      // key on this node is a native one, so a locked row saying `low_stock`
      // beside a live control defaulting to `data` contradicts itself on the panel.
      const destination = authored(setup, 'destinationFieldName')?.value
        ?? lockedValue(setup, 'Put Output in Field', 'Output Field', 'Destination Field Name');
      return {
        aggregate: 'aggregateAllItemData',
        ...(destination ? { destinationFieldName: destination } : {}),
        options: {},
      };
    },
  },

  'http-request': {
    // Sparse on purpose: GET is the default method, so omitting it is what a real
    // workflow looks like (§4). The URL is the one thing that must be present.
    parameters: ({ setup }) => {
      const hint = authored(setup, 'url');
      return { url: hint?.label ?? hint?.value ?? '', options: {} };
    },
  },

  code: {
    parameters: ({ node }) => ({
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: node.jsCode ?? 'return $input.item;',
    }),
  },

  parse: EDIT_FIELDS_SPEC,

  // The SAME spec under the canonical type name, because `parse` is one of the ten
  // compatibility aliases and a new case must not pick it. Without this entry the
  // generic fallback runs, and it cannot emit a repeatable group: the Edit Fields node
  // exports `assignments: []` and the workflow posts an empty message. Worse, the
  // "covers every type any reference graph places" test in exportWorkflow.test.js is a
  // deliberate hard failure — so the first case to place `edit-fields` under its real
  // name turned the suite red at the moment it was registered, which is where
  // `weather-commute-ping` found this.
  'edit-fields': EDIT_FIELDS_SPEC,

  switch: {
    /**
     * Switch v3.4. Two things that are easy to get wrong and both break the flow:
     *
     * 1. **The branch NAME lives here, not in `connections`** (§2, consequence 1).
     *    A connection records only an output index, so without `outputKey` the
     *    imported Switch has anonymous outputs and the learner cannot tell which
     *    is which.
     * 2. **`renameOutput: true` is required for `outputKey` to be used at all.**
     *    Set the key without it and n8n shows "0, 1, 2".
     */
    parameters: ({ problem, setup }) => {
      const branches = problem.branches ?? [];
      const rows = expectedRows(setup, 'rules');
      // The field the router tests. A rule row's authored expression names it, so
      // prefer that over guessing at `$json.category`.
      const left = rows[0]?.expression ?? '{{ $json.category }}';
      return {
        rules: {
          values: branches.map((b, i) => ({
            conditions: condition(left, rows[i]?.value ?? b.id, i),
            renameOutput: true,
            outputKey: b.label ?? b.id,
          })),
        },
        // A case's deliberate fall-through case is the point of its Stress Testing
        // question, so the exported Switch must have somewhere for an unmatched
        // item to go rather than dropping it silently.
        options: { fallbackOutput: 'extra' },
      };
    },
  },

  // --- AI -------------------------------------------------------------------

  classify: {
    /**
     * OVERRIDE, and the most consequential decision in this file.
     *
     * The catalog declares `@n8n/n8n-nodes-langchain.textClassifier`. Exported as
     * that, the workflow imports and then silently drops most items — because a
     * Text Classifier classifies *and routes*: it has one main output per
     * configured category and there is no separate Switch
     * (docs/n8n-reference/00-how-n8n-actually-works.md:831). Judge puts a Parse
     * and a Switch after this node, so wiring output 0 onward would send only the
     * first category downstream and discard the rest.
     *
     * Judge's own catalog parameters say what this node really is: a System
     * Message, a text input, and a `text` output holding JSON
     * (`{"category":"COMPLAINT"}`). That is a Basic LLM Chain — the same node
     * `summarize` already declares — and it is what makes the exported flow
     * (chain → parse the JSON → switch on the field) actually run.
     *
     * The catalog is NOT changed here: `catalog.test.js` pins textClassifier
     * deliberately, and which node Judge should teach is a curriculum decision,
     * not an export one. This override is reported by the exporter so the
     * divergence is visible rather than buried.
     */
    n8nType: '@n8n/n8n-nodes-langchain.chainLlm',
    typeVersion: 1.7,
    overrideReason:
      "Judge's classify emits a JSON text blob and is followed by Parse + Switch. A real Text " +
      'Classifier routes on its own outputs and has no downstream Switch, so exporting it as one ' +
      'would drop every category but the first. Basic LLM Chain is what this node actually models.',
    parameters: ({ setup, problem }) => {
      const system = NODE_CATALOG.classify.params.find((p) => p.key === 'system')?.value ?? '';
      const textHint = authored(setup, 'text');
      const categories = (problem.branches ?? []).map((b) => b.id).join(', ');
      return {
        promptType: 'define',
        text: expr(textHint?.label ?? '{{ $json.text }}'),
        messages: {
          messageValues: [
            {
              message: categories
                ? `${system}\nReply with JSON only. The category must be exactly one of: ${categories}.`
                : system,
            },
          ],
        },
      };
    },
  },

  summarize: {
    parameters: () => ({
      promptType: 'define',
      text: '={{ $json.text }}',
      messages: {
        messageValues: [
          { message: NODE_CATALOG.summarize.params.find((p) => p.key === 'system')?.value ?? '' },
        ],
      },
    }),
  },

  'chat-gemini': {
    // A sub-node: it supplies capability over ai_languageModel and never sits on
    // the main wire. Temperature is a graded field in both AI cases.
    parameters: ({ setup }) => {
      const temp = authored(setup, 'temperature');
      const value = Number(temp?.value);
      return {
        modelName: NODE_CATALOG['chat-gemini'].params.find((p) => p.key === 'model')?.value ?? 'models/gemini-2.5-flash',
        options: { temperature: Number.isFinite(value) ? value : 0 },
      };
    },
    credentials: () => CRED('googlePalmApi', 'Google Gemini account'),
  },

  'information-extractor': {
    /**
     * Information Extractor v1.2, in `fromAttributes` mode.
     *
     * The schema is the whole node, and it lives in the case's LOCKED panel rather
     * than in a graded field — a case grades which text to read and what the model
     * should do with a request that fits nothing, not the list of attributes, which
     * is context. So the attribute list has to be parsed back out of that panel, the
     * same way `form-trigger` recovers its form fields from `Form Fields`.
     *
     * Without this the node exports as `attributes: []`, which imports as an
     * extractor that extracts nothing and hands an empty item to everything
     * downstream — a whole workflow that runs and produces blanks.
     *
     * n8n's real shape is a fixedCollection: `attributes.attributes[]`, each row
     * `{ name, type, description }`. `required` is left off because false is n8n's
     * own default and this file stays sparse.
     */
    parameters: ({ setup }) => ({
      text: usableValue(setup, 'text'),
      schemaType: 'fromAttributes',
      attributes: { attributes: extractorAttributes(setup) },
      options: {},
    }),
  },

  'openai-chat-model': {
    // A sub-node: it supplies capability over ai_languageModel and never sits on
    // the main wire.
    //
    // `model` is a resourceLocator, not a string. The catalog's default is whatever
    // n8n ships as the current default, which is not necessarily the model the case
    // put in front of the learner — so the locked panel wins when it names one.
    // Temperature is carried across because a case that grades it grades it for a
    // reason: at anything above 0 the same input can be read two ways, and a flow
    // that writes to a spreadsheet on the strength of that is a different flow.
    parameters: ({ setup }) => {
      const fallback = NODE_CATALOG['openai-chat-model'].params.find((p) => p.key === 'model')?.value?.value;
      const model = lockedValue(setup, 'Model') || fallback || 'gpt-4.1-mini';
      const temperature = Number(authored(setup, 'temperature')?.value);
      return {
        model: rl(model, model, 'list'),
        options: Number.isFinite(temperature) ? { temperature } : {},
      };
    },
    credentials: () => CRED('openAiApi', 'OpenAI account'),
  },

  // --- actions --------------------------------------------------------------

  action: {
    // Gmail v2.1 send. `resource`/`operation` are emitted explicitly rather than
    // relying on defaults, because which one is the default has changed between
    // versions and a wrong guess here opens the node on the wrong operation.
    parameters: ({ setup }) => {
      const to = authored(setup, 'to');
      return {
        resource: 'message',
        operation: 'send',
        sendTo: expr(to?.label ?? '{{ $json.from }}'),
        subject: NODE_CATALOG.action.params.find((p) => p.key === 'subject')?.value ?? 'Re: your request',
        message: NODE_CATALOG.action.params.find((p) => p.key === 'body')?.value ?? '',
        emailType: 'text',
        options: {},
      };
    },
    credentials: () => CRED('gmailOAuth2', 'Gmail account'),
  },

  'google-sheets': {
    /**
     * Sheets v4.7 append. `documentId` and `sheetName` are resourceLocators and
     * are deliberately left EMPTY: they name a spreadsheet in the learner's own
     * Drive, which we cannot know. An empty resourceLocator imports as a red
     * required field — the correct state — whereas inventing an id produces a
     * node that looks configured and fails on execute.
     */
    parameters: ({ setup }) => {
      // The OPERATION is the graded answer wherever a case asks for it, and
      // getting it from the case matters more here than anywhere else in this
      // file: hardcoding `append` on a case whose answer is `read` exports a
      // workflow that writes blank rows into the learner's own spreadsheet the
      // first time they press Execute. Rule 1 of this module, in its worst form.
      const operation = authored(setup, 'sheetOperation')?.value ?? 'append';
      const base = {
        resource: 'sheet',
        operation,
        documentId: rl('', '', 'url'),
        sheetName: rl('', '', 'url'),
        options: {},
      };
      // A read has no column mapper — n8n does not display those parameters for
      // it, so storing them would be both wrong (§4) and a claim to write.
      if (operation === 'read' || operation === 'clear' || operation === 'remove' || operation === 'delete') return base;
      const rows = expectedRows(setup, 'columns');
      return {
        ...base,
        columns: {
          mappingMode: 'defineBelow',
          matchingColumns: [],
          value: Object.fromEntries(rows.map((r) => [r.name ?? r.key, expr(r.expression ?? r.value ?? '')])),
        },
      };
    },
    credentials: () => CRED('googleSheetsOAuth2Api', 'Google Sheets account'),
  },

  'slack-message': {
    parameters: () => ({
      resource: 'message',
      operation: 'post',
      select: 'channel',
      channelId: rl('', '', 'name'),
      text: '={{ $json.text }}',
      otherOptions: {},
    }),
    credentials: () => CRED('slackApi', 'Slack account'),
  },

  gmail: {
    /**
     * Gmail v2.2 send — the canonical node, where `action` is the legacy alias.
     *
     * The translation this exists to do: a case authors TEACHING keys (`sendTo`,
     * `message`) while the descriptor's own keys are `messageSendSendTo` and
     * `messageReplyOrsendMessage`, both scoped by `showWhen`. The generic fallback
     * only applies an authored answer when its key is already a descriptor key, so
     * without this spec every graded answer on the node is dropped and the node
     * exports with an empty recipient — the one field that makes the difference
     * between the reference solution and the mistake the case is about.
     *
     * `resource`/`operation` are emitted explicitly rather than relying on defaults,
     * because which one is the default has changed between versions and a wrong
     * guess opens the node on the wrong operation.
     */
    parameters: ({ setup }) => ({
      resource: 'message',
      operation: 'send',
      sendTo: usableValue(setup, 'sendTo'),
      subject: expr(lockedValue(setup, 'Subject')),
      emailType: emailTypeOf(lockedValue(setup, 'Email Type', 'Send as')),
      message: messageBody(setup, 'message'),
      options: {},
    }),
    credentials: () => CRED('gmailOAuth2', 'Gmail account'),
  },

  slack: {
    /**
     * Slack v2.6 message:post — the canonical node, where `slack-message` is the
     * legacy alias that hardcodes an empty channel.
     *
     * Here the channel is a graded answer, so it can actually be emitted. It goes in
     * as `name` mode (`#ops-desk`) rather than `list` mode, because a list-mode
     * locator stores an internal channel ID belonging to one workspace and we are
     * exporting into the learner's own.
     */
    parameters: ({ setup }) => ({
      resource: 'message',
      operation: 'post',
      select: 'channel',
      // Graded first, then locked. A case whose STATEMENT names the channel has
      // to lock it rather than grade it — asking would hand over an answer the
      // learner just read — but the channel is still known, and an export with an
      // empty destination is a workflow that cannot run.
      channelId: rl(
        channelName(usableValue(setup, 'channelId') || usableValue(setup, 'channel') || lockedValue(setup, 'Channel', 'Send Message To Channel')),
        '',
        'name'
      ),
      messageType: 'text',
      text: messageBody(setup, 'text'),
      otherOptions: {},
    }),
    credentials: () => CRED('slackApi', 'Slack account'),
  },
};

/** Which Judge types can be exported today. */
export const EXPORTABLE_TYPES = Object.keys(N8N_NODE_SPECS);

/**
 * The n8n type string and version for a Judge type.
 *
 * Falls back to the catalog, which is the normal case — an override is the
 * exception and has to explain itself.
 */
export function n8nIdentity(judgeType) {
  const spec = N8N_NODE_SPECS[judgeType];
  const entry = NODE_CATALOG[judgeType];
  return {
    type: spec?.n8nType ?? entry?.n8nType,
    typeVersion: spec?.typeVersion ?? entry?.n8nVersion,
    overrideReason: spec?.overrideReason ?? null,
  };
}
