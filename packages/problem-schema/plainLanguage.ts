/**
 * Plain-language rules for the copy a learner reads while deciding.
 *
 * Judge teaches non-technical Scaler learners, and the copy is the teaching. Two
 * standards apply, and both are here as numbers rather than as advice:
 *
 * **ASD-STE100 (Simplified Technical English)** is the aerospace writing standard for
 * documentation read by people working in a second language, under time pressure. The
 * rules that bind here are its sentence-length limits (20 words for an instruction, 25
 * for a description), one idea per sentence, six sentences per paragraph, and the active
 * voice.
 *
 * **Zinsser's four principles** are simplicity, brevity, clarity, humanity. The one that
 * does the most work is brevity: "the secret of good writing is to strip every sentence
 * to its cleanest components." Every qualifier that fills a sentence without adding a
 * fact is one the learner has to read past to reach the decision.
 *
 * ## Why this is enforced and not merely written down
 *
 * The statement of the case a human wrote by hand is **43 words**. The five authored by
 * an agent came out at 95, 193, 201, 250 and 270, each longer than the one before it,
 * because nothing counted. The drift was invisible: every case passed `problem:check`,
 * `npm test` and three independent reviews, because none of them measured length. A
 * reviewer reading a 270-word statement for correctness does not notice that it is
 * 270 words.
 *
 * The same happened one level down. An `assignmentList` option label has to be a real
 * n8n expression, since the exporter writes it into the workflow file, so one case grew
 * a **296-character inline JavaScript ternary** as a dropdown choice. A learner who
 * cannot read JavaScript was asked to pick between four of them.
 *
 * ## Em and en dashes are banned outright
 *
 * Not rationed. A dash is where a sentence goes to avoid ending, and a chain of them is
 * how one reaches 56 words with nobody noticing. Every dash has a full stop, a comma or
 * a colon that does the job in less space. This also makes written copy agree with the
 * voice rules, which already reject dashes because they do not read aloud.
 *
 * ## Every surface is capped, because every surface drifted
 *
 * The first version of this module exempted `explanation` and probe `response` on the
 * argument that they are the teaching, read after a decision, so a paragraph is often
 * right. Measurement killed that argument. Against the hand-written case, the worst
 * agent-authored one had grown its Stress Testing questions from 18 words to 64, its
 * answers from 22 to 52, its explanations from 46 to 187, and its probe responses from
 * 29 to 71. A learner does not become a better reader because the text is labelled
 * teaching.
 *
 * So the caps below are set from the one case a human wrote, plus headroom. Explanations
 * get the most room of anything here, because they are read at the one moment a learner
 * is genuinely willing to read. They still get a limit.
 */

export const PLAIN_LANGUAGE = Object.freeze({
  /** ASD-STE100's descriptive-text limit. Instructions are 20; this is the looser one. */
  MAX_SENTENCE_WORDS: 25,
  /** ASD-STE100 allows six sentences per paragraph. A statement is a few paragraphs. */
  MAX_STATEMENT_SENTENCES: 9,
  /**
   * The statement carries the whole brief. The problem panel, the sticky note and
   * Ask-AI's context all read it, so it cannot be as terse as `brief`. 150 words is
   * roughly three short paragraphs. That is comfortably above the 43-word hand-written
   * case and half of the 270-word one.
   */
  MAX_STATEMENT_WORDS: 150,
  /**
   * A select option renders on one line in a control about 420px wide. Past this it
   * truncates mid-token, which is how a 296-character expression became an unreadable
   * dropdown.
   */
  MAX_OPTION_LABEL_CHARS: 90,

  /**
   * The rest of the caps are set from the one case a human wrote, with headroom. Each
   * pair below is (hand-written actual, cap). The drift they exist to stop was the same
   * on every surface, and monotonic: each agent-authored case was longer than the last.
   *
   * A Stress Testing question a learner has to hold in their head while comparing four
   * answers. 18 words in the reference case, 64 in the worst.
   */
  MAX_QUESTION_WORDS: 35,
  /**
   * An answer they compare against three others. 22 words in the reference case, 52 in
   * the worst.
   *
   * This cap also replaces a fix that went the wrong way. The correct option used to be
   * the longest in every question of one case, so "pick the longest" scored full marks,
   * and the repair was to lengthen the distractors to match. Short options cannot carry
   * a length tell at all, which is why the reference case never had one.
   */
  MAX_ANSWER_WORDS: 28,
  /**
   * The teaching after an answer. Read once, at the moment a learner is most willing to
   * read, so it gets the most room of anything here. 46 words on average in the
   * reference case, 187 in the worst.
   */
  MAX_EXPLANATION_WORDS: 90,
  /**
   * Iris's written reaction to a wrong node, and the Understand screen's explanation.
   * 29 and 34 words in the reference case, 71 and 72 in the worst.
   */
  MAX_RESPONSE_WORDS: 60,
});

/**
 * Cases whose copy predates these rules and has not been rewritten yet.
 *
 * Enforcement is live for every case NOT on this list, which is what stops a new one
 * regressing. The five here carry 308 violations between them, and turning the rules on
 * as errors for all of them at once would put the repo in a red state for as long as the
 * rewriting takes. That is how a rule gets switched off "temporarily" and stays off.
 *
 * **The list only shrinks.** Removing a slug is the definition of that case being done,
 * and `plainLanguage.test.ts` asserts an entry cannot be added back for a case that is
 * already clean. Delete this whole constant when the last one goes, along with the branch
 * in validateProblem that reads it.
 *
 * Count when the rules landed, so progress is legible:
 *   low-stock-morning-post 107 · ops-request-desk 86 · trial-signup-desk 57
 *   email-triage 42 · expense-approvals 16
 */
export const PLAIN_LANGUAGE_DEBT = Object.freeze([
  'email-triage',
  'expense-approvals',
  'trial-signup-desk',
  'ops-request-desk',
  'low-stock-morning-post',
]);

/** Em dash, en dash, and the double hyphen people type when they mean one. */
const DASH = /[—–]|(?<=\s)--(?=\s)/g;

/** Split prose into sentences, tolerating the abbreviations and decimals in this domain. */
export function sentencesOf(text: string): string[] {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    // Do not split inside "9:00 a.m." or "12.97" or "e.g.". A digit DOES start a new
    // sentence though: "...a WMO weather code. 0 is a clear sky" is two sentences, and
    // omitting 0-9 here reported it as one 34-word one.
    .replace(/([a-z])\.([a-z])\./gi, '$1<DOT>$2<DOT>')
    .split(/(?<=[.!?])\s+(?=[A-Z"'(0-9])/)
    .map((s) => s.replace(/<DOT>/g, '.').trim())
    .filter(Boolean);
}

export function wordsOf(text: string): number {
  const t = String(text ?? '').trim();
  return t ? t.split(/\s+/).length : 0;
}

export type PlainLanguageIssue = { path: string; message: string };

/**
 * Sentence-length check, for any prose a learner reads.
 *
 * Skips a sentence that carries an expression or a URL. `{{ ... }}` and `https://...`
 * are single tokens to a reader even when they are long, and splitting them would be
 * worse. The option-label cap is what governs those.
 */
export function longSentences(
  path: string,
  text: string,
  max = PLAIN_LANGUAGE.MAX_SENTENCE_WORDS
): PlainLanguageIssue[] {
  const out: PlainLanguageIssue[] = [];
  for (const sentence of sentencesOf(text)) {
    if (/\{\{|https?:\/\//.test(sentence)) continue;
    const n = wordsOf(sentence);
    if (n > max) {
      out.push({
        path,
        message: `a ${n}-word sentence. ASD-STE100 caps a descriptive sentence at ${max}. Split it, or cut what it does not need: "${sentence.slice(0, 60)}..."`,
      });
    }
  }
  return out;
}

/**
 * No em or en dashes, anywhere a learner reads.
 *
 * Applies to spoken and written copy alike, so the two cannot drift apart.
 */
export function dashIssues(path: string, text: string): PlainLanguageIssue[] {
  const found = (String(text ?? '').match(DASH) ?? []).length;
  if (!found) return [];
  return [
    {
      path,
      message: `${found} em/en dash(es). Dashes are banned in learner-facing copy: a full stop, a comma or a colon always does the job, and a dash does not read aloud.`,
    },
  ];
}

/**
 * A total-length cap on one string, with the reason in the message.
 *
 * `what` names the surface in the learner's terms ("a Stress Testing answer"), not the
 * field's terms, because the person reading the failure has to decide what to cut.
 */
export function capWords(path: string, text: string, max: number, what: string): PlainLanguageIssue[] {
  const n = wordsOf(text);
  if (n <= max) return [];
  return [
    {
      path,
      message: `${n} words in ${what}. Keep it under ${max}. Cut what the learner does not need to make this one decision; the rest is either already on screen or belongs somewhere later.`,
    },
  ];
}

/** Everything the statement has to satisfy. */
export function statementIssues(statement: string): PlainLanguageIssue[] {
  const out: PlainLanguageIssue[] = [
    ...longSentences('statement', statement),
    ...dashIssues('statement', statement),
  ];
  const words = wordsOf(statement);
  const sentences = sentencesOf(statement).length;

  if (words > PLAIN_LANGUAGE.MAX_STATEMENT_WORDS) {
    out.push({
      path: 'statement',
      message: `${words} words. Keep it under ${PLAIN_LANGUAGE.MAX_STATEMENT_WORDS}. The learner reads this to decide what to build, not to be told everything. Detail that only matters once they are building belongs on the node that grades it.`,
    });
  }
  if (sentences > PLAIN_LANGUAGE.MAX_STATEMENT_SENTENCES) {
    out.push({
      path: 'statement',
      message: `${sentences} sentences. Keep it to ${PLAIN_LANGUAGE.MAX_STATEMENT_SENTENCES}.`,
    });
  }
  return out;
}

/**
 * Every plain-language violation in a whole problem.
 *
 * ONE walk, called by all three consumers: `validateProblem()` raises these as errors,
 * `npm run case:copy` reports them per case, and `registry.test.js` uses it to check that
 * a grandfathered case really is still dirty.
 *
 * It exists because there were briefly three copies of this walk, and the test's copy was
 * the weakest: it proxied "not yet rewritten" as "has a dash or a long statement", so a
 * case with 42 long sentences and no dashes read as clean and the debt guard fired on a
 * case that was not done. A surface listed in one walk and not another is a surface that
 * can drift, which is the whole failure this module exists to prevent.
 *
 * Typed loosely on purpose: the callers include a `.mjs` script and a test, and the shape
 * is whatever `problemSchema` produced.
 */
export function plainLanguageIssues(problem: any): PlainLanguageIssue[] {
  const out: PlainLanguageIssue[] = [];
  const prose = (path: string, text: unknown, cap = 0, what = '') => {
    if (typeof text !== 'string' || !text) return;
    out.push(...longSentences(path, text), ...dashIssues(path, text));
    if (cap) out.push(...capWords(path, text, cap, what));
  };

  out.push(...statementIssues(problem?.statement ?? ''));
  prose('tagline', problem?.tagline);
  prose('brief', problem?.brief);

  (problem?.dissection ?? []).forEach((d: any, n: number) => {
    prose(`dissection[${n}].prompt`, d.prompt, PLAIN_LANGUAGE.MAX_QUESTION_WORDS, 'an Understand question');
    prose(`dissection[${n}].explanation`, d.explanation, PLAIN_LANGUAGE.MAX_RESPONSE_WORDS, 'an Understand explanation');
    prose(`dissection[${n}].wrongHint`, d.wrongHint, PLAIN_LANGUAGE.MAX_RESPONSE_WORDS, 'a wrong-answer hint');
    for (const o of d.options ?? []) {
      prose(`dissection[${n}].option`, o.label);
      out.push(...optionLabelIssues(`dissection[${n}].option`, o.label));
    }
  });

  (problem?.evalQuestions ?? []).forEach((q: any, n: number) => {
    prose(`evalQuestions[${n}].prompt`, q.prompt, PLAIN_LANGUAGE.MAX_QUESTION_WORDS, 'a Stress Testing question');
    prose(`evalQuestions[${n}].explanation`, q.explanation, PLAIN_LANGUAGE.MAX_EXPLANATION_WORDS, 'a Stress Testing explanation');
    (q.options ?? []).forEach((o: unknown, j: number) =>
      prose(`evalQuestions[${n}].option[${j}]`, String(o), PLAIN_LANGUAGE.MAX_ANSWER_WORDS, 'a Stress Testing answer')
    );
  });

  (problem?.buildPhases ?? []).forEach((ph: any, n: number) =>
    prose(`buildPhases[${n}].coach`, ph.coach, PLAIN_LANGUAGE.MAX_RESPONSE_WORDS, "Iris's line entering a phase")
  );

  for (const [type, setup] of Object.entries<any>(problem?.nodeSetup ?? {})) {
    for (const l of setup.locked ?? []) prose(`${type}.locked[${l.label}]`, String(l.value ?? ''));
    for (const f of setup.fields ?? []) {
      prose(`${type}.${f.key}.subtitle`, f.subtitle, PLAIN_LANGUAGE.MAX_RESPONSE_WORDS, 'a field subtitle');
      prose(`${type}.${f.key}.whyCorrect`, f.whyCorrect, PLAIN_LANGUAGE.MAX_RESPONSE_WORDS, 'a right-answer explanation');
      prose(`${type}.${f.key}.whyWrong`, f.whyWrong, PLAIN_LANGUAGE.MAX_RESPONSE_WORDS, 'a wrong-answer hint');
      for (const o of [...(f.options ?? []), ...(f.valueOptions ?? []), ...(f.nameOptions ?? [])]) {
        prose(`${type}.${f.key}.why`, o.why, PLAIN_LANGUAGE.MAX_RESPONSE_WORDS, "an option's explanation");
        // `label` is what a learner compares in a picker. An expression too long to read
        // there belongs in `expression`, which is not learner-facing.
        out.push(...optionLabelIssues(`${type}.${f.key}.option`, String(o.label ?? '')));
      }
      if (f.why && typeof f.why === 'object') {
        for (const [aspect, byVerdict] of Object.entries<any>(f.why)) {
          for (const [verdict, text] of Object.entries(byVerdict ?? {})) {
            prose(`${type}.${f.key}.why.${aspect}.${verdict}`, text, PLAIN_LANGUAGE.MAX_RESPONSE_WORDS, "a list row's explanation");
          }
        }
      }
    }
    for (const s of setup.settings ?? []) {
      for (const [value, text] of Object.entries(s.why ?? {})) {
        prose(`${type}.settings.${s.key}.why[${value}]`, text, PLAIN_LANGUAGE.MAX_RESPONSE_WORDS, "a setting's explanation");
      }
    }
  }

  for (const [type, probe] of Object.entries<any>(problem?.nodeProbes ?? {})) {
    prose(`probe.${type}.prompt`, probe?.prompt, PLAIN_LANGUAGE.MAX_QUESTION_WORDS, 'a probe question');
    for (const o of probe?.options ?? []) {
      prose(`probe.${type}.option`, o.text, PLAIN_LANGUAGE.MAX_ANSWER_WORDS, 'a probe answer');
      prose(`probe.${type}.response`, o.response, PLAIN_LANGUAGE.MAX_RESPONSE_WORDS, "Iris's reply to a probe");
    }
  }

  return out.filter((v, i, a) => a.findIndex((x) => x.path === v.path && x.message === v.message) === i);
}

/**
 * A learner-visible choice has to be readable on one line.
 *
 * This is the rule that catches an expression grown past the point of being a choice.
 * When an authored answer must be a real n8n expression, the fix is not a longer
 * control. Move what does not vary into a `locked` row and grade only the part that
 * does, so the option stays something a person can compare at a glance.
 */
export function optionLabelIssues(path: string, label: string): PlainLanguageIssue[] {
  const text = String(label ?? '');
  if (text.length <= PLAIN_LANGUAGE.MAX_OPTION_LABEL_CHARS) return [];
  return [
    {
      path,
      message: `a ${text.length}-character option. Keep it under ${PLAIN_LANGUAGE.MAX_OPTION_LABEL_CHARS} so it reads on one line. If it is an expression, move the part that does not vary into a locked row and grade only the part that does: "${text.slice(0, 50)}..."`,
    },
  ];
}
