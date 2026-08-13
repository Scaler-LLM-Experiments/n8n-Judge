/**
 * The value options one row of an assignment list should offer.
 *
 * An assignment list has a single pool of `valueOptions` shared by every row, because
 * the list is one graded field. That is fine when every value could belong to any row,
 * and confusing when it cannot: one case's two-row list offered all seven of its options
 * on both rows, so a row named `weather_line` presented four advice lines that belong to
 * `commute_note`. Those are not wrong answers, they are answers to the other row's
 * question, and a learner cannot tell what is being asked when half the menu is
 * irrelevant to the row they are on.
 *
 * An option may declare `forName`. When it does, it appears only on the row with that
 * name. When it does not, it appears everywhere.
 *
 * Two deliberate behaviours:
 *
 * - **A row with no name yet shows everything.** There is nothing to filter by, and
 *   hiding all the values would read as a broken control.
 * - **If filtering would leave the row empty, show everything.** An author who names a
 *   row that no option claims has made a mistake, and an empty dropdown hides it. Better
 *   to show the full pool and let the verdict explain, than to strand the learner.
 *
 * Presentation only. Grading compares against `expect.assignments` by token, so what is
 * correct never depends on what the menu showed.
 */
export function valuesFor(valueOptions = [], rowName) {
  if (!rowName) return valueOptions;
  const claimed = valueOptions.filter((o) => o.forName === rowName);
  const unclaimed = valueOptions.filter((o) => !o.forName);
  const offered = [...claimed, ...unclaimed];
  return offered.length ? offered : valueOptions;
}
