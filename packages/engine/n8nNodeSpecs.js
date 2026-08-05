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
// which was read out of n8n v2.33.0's own source. When you touch a spec, check
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
import { NODE_CATALOG } from '@judge/catalog';

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
    return correct ? { value: correct.value, label: correct.label } : undefined;
  }
  if (field.correct !== undefined) return { value: field.correct, label: String(field.correct) };
  return undefined;
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
  const byToken = new Map((field?.valueOptions ?? []).map((o) => [o.value, o.label]));
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
    parameters: ({ problem }) => ({
      formTitle: problem.title ?? 'Form',
      formDescription: problem.brief ?? '',
      // The four fields a case collects are the vocabulary the rest of the flow
      // maps from, so they have to be real form fields rather than a free-text
      // blob. Read from the catalog entry's authored default and split.
      formFields: {
        values: (NODE_CATALOG['form-trigger'].params.find((p) => p.key === 'fields')?.value ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((label) => ({ fieldLabel: label, fieldType: 'text', requiredField: false })),
      },
      options: {},
    }),
  },

  webhook: {
    parameters: () => ({ httpMethod: 'POST', path: 'judge', options: {} }),
  },

  schedule: {
    parameters: () => ({ rule: { interval: [{ field: 'hours', hoursInterval: 1 }] } }),
  },

  // --- core -----------------------------------------------------------------

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

  parse: {
    // Edit Fields (Set) v3.5. The learner's job in Judge is the assignment list,
    // so the authored `expect.assignments` is exactly the parameter payload.
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
  },

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
      const rows = expectedRows(setup, 'columns');
      return {
        resource: 'sheet',
        operation: 'append',
        documentId: rl('', '', 'url'),
        sheetName: rl('', '', 'url'),
        columns: {
          mappingMode: 'defineBelow',
          matchingColumns: [],
          value: Object.fromEntries(rows.map((r) => [r.name ?? r.key, expr(r.expression ?? r.value ?? '')])),
        },
        options: {},
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
