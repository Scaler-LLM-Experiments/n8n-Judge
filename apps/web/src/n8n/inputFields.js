/**
 * The INPUT pane's field list, flattened to the leaves a learner can actually use.
 *
 * ## The bug this exists to fix
 *
 * The pane used to render `Object.entries(data)` and print each value with `String(v)`.
 * A nested object therefore rendered as the literal text `[object Object]`, and an array
 * as `[object Object],[object Object],[object Object]`.
 *
 * That is not cosmetic. On `weather-commute-ping`'s Edit Fields node, the whole graded
 * decision is what to build out of the temperature and the weather code, and both live at
 * `current.temperature_2m` and `current.weather_code`. The learner was shown:
 *
 *     current     [object Object]
 *     latitude    12.97
 *     longitude   77.59
 *
 * so the two facts the decision turns on were invisible, and the two visible numbers were
 * irrelevant. The same defect hides `low_stock` (an array of three rows) on
 * `low-stock-morning-post`, whose Slack answer is `{{ $json.low_stock }}`.
 *
 * Real n8n shows the INPUT panel as an expandable tree for exactly this reason: you cannot
 * map a field you cannot see.
 *
 * ## What this returns
 *
 * One row per line to draw, in reading order, each carrying the `path` an expression would
 * use. `kind` tells the caller how to draw it:
 *
 * - `leaf` is a value, and the only kind that is draggable, because it is the only kind an
 *   expression can reference usefully.
 * - `group` is an object or array header. It names the shape and its size, and is there so
 *   the indentation below it has something to hang from.
 *
 * Arrays are summarised rather than enumerated: a learner needs to know that `low_stock`
 * holds three rows and what a row looks like, not to scroll thirty rows. So the first
 * element's leaves are shown once, pathed with `[0]`.
 */

const MAX_DEPTH = 3;

/** How a value is shown when it is a leaf. Numbers and booleans keep their type. */
export function displayValue(value) {
  if (value === null) return 'null';
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function shapeOf(value) {
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
  const keys = Object.keys(value ?? {});
  return `${keys.length} field${keys.length === 1 ? '' : 's'}`;
}

const isBranch = (v) => v !== null && typeof v === 'object';

/**
 * Flatten one item into the rows the INPUT pane draws.
 *
 * @param {object} data the upstream node's sample output
 * @returns {Array<{path: string, label: string, value: string, kind: 'leaf'|'group', depth: number}>}
 */
export function inputRows(data, depth = 0, prefix = '') {
  if (!isBranch(data)) return [];
  const rows = [];

  for (const [key, value] of Object.entries(data)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (!isBranch(value)) {
      rows.push({ path, label: key, value: displayValue(value), kind: 'leaf', depth });
      continue;
    }

    // Past MAX_DEPTH, stop expanding and show the shape. Deeper than three levels is
    // rare in this data and a wall of indented rows helps nobody.
    if (depth >= MAX_DEPTH) {
      rows.push({ path, label: key, value: shapeOf(value), kind: 'leaf', depth });
      continue;
    }

    rows.push({ path, label: key, value: shapeOf(value), kind: 'group', depth });

    if (Array.isArray(value)) {
      // One element, so the learner sees the shape of a row without scrolling all of
      // them. `{{ $json.low_stock }}` is usually the answer anyway, and that path is on
      // the group row above.
      const [first] = value;
      if (isBranch(first)) rows.push(...inputRows(first, depth + 1, `${path}[0]`));
      else if (first !== undefined) {
        rows.push({ path: `${path}[0]`, label: '0', value: displayValue(first), kind: 'leaf', depth: depth + 1 });
      }
      continue;
    }

    rows.push(...inputRows(value, depth + 1, path));
  }

  return rows;
}

/**
 * Every path an expression could reference, for the drop targets and the field picker.
 *
 * This used to be `Object.keys(inputData)`, which offered `current` and never
 * `current.temperature_2m`. Groups are included as well as leaves, because
 * `{{ $json.low_stock }}` (a whole array) is a legitimate and often correct answer.
 */
export function inputPaths(data) {
  return inputRows(data).map((r) => r.path);
}
