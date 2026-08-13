#!/usr/bin/env node
// Reports plain-language violations per case: every word a learner reads while deciding.
//
// Reporting only, on purpose. `validateProblem()` enforces these as errors once the
// backlog is clear, but this script is what makes the backlog fixable case by case. It
// names every offending string with its path, and exits 1 while any remain.
//
// The walk below IS the contract. A surface missing from it is a surface that can drift,
// which is how five cases grew their Stress Testing explanations from 46 words to 187
// while passing every check in the repo.
import { problems } from '../../packages/problems/index.js';
import {
  PLAIN_LANGUAGE as L,
  statementIssues,
  longSentences,
  dashIssues,
  optionLabelIssues,
  capWords,
} from '../../packages/problem-schema/plainLanguage.ts';

const args = process.argv.slice(2);
const only = args.find((a) => !a.startsWith('-'));
const verbose = args.includes('--verbose');

/**
 * Every learner-read string, as [path, text, cap?, whatItIs?].
 *
 * A cap of 0 means "sentence and dash rules only, no total length" — used where the
 * string is a label whose length is governed by the character cap instead.
 */
function* copyOf(p) {
  yield ['tagline', p.tagline, 0];
  yield ['brief', p.brief, 0];

  for (const [i, d] of (p.dissection ?? []).entries()) {
    yield [`dissection[${i}].prompt`, d.prompt, L.MAX_QUESTION_WORDS, 'an Understand question'];
    yield [`dissection[${i}].explanation`, d.explanation, L.MAX_RESPONSE_WORDS, 'an Understand explanation'];
    yield [`dissection[${i}].wrongHint`, d.wrongHint, L.MAX_RESPONSE_WORDS, 'a wrong-answer hint'];
    for (const o of d.options ?? []) yield [`dissection[${i}].option`, o.label, 0];
  }

  for (const [i, q] of (p.evalQuestions ?? []).entries()) {
    yield [`evalQuestions[${i}].prompt`, q.prompt, L.MAX_QUESTION_WORDS, 'a Stress Testing question'];
    yield [`evalQuestions[${i}].explanation`, q.explanation, L.MAX_EXPLANATION_WORDS, 'a Stress Testing explanation'];
    for (const [j, o] of (q.options ?? []).entries()) {
      yield [`evalQuestions[${i}].option[${j}]`, String(o), L.MAX_ANSWER_WORDS, 'a Stress Testing answer'];
    }
  }

  for (const [i, ph] of (p.buildPhases ?? []).entries()) {
    yield [`buildPhases[${i}].coach`, ph.coach, L.MAX_RESPONSE_WORDS, "Iris's line entering a phase"];
  }

  for (const [t, s] of Object.entries(p.nodeSetup ?? {})) {
    for (const f of s.fields ?? []) {
      yield [`${t}.${f.key}.subtitle`, f.subtitle, L.MAX_RESPONSE_WORDS, 'a field subtitle'];
      yield [`${t}.${f.key}.whyCorrect`, f.whyCorrect, L.MAX_RESPONSE_WORDS, 'a right-answer explanation'];
      yield [`${t}.${f.key}.whyWrong`, f.whyWrong, L.MAX_RESPONSE_WORDS, 'a wrong-answer hint'];
      for (const o of [...(f.options ?? []), ...(f.valueOptions ?? []), ...(f.nameOptions ?? [])]) {
        yield [`${t}.${f.key}.why`, o.why, L.MAX_RESPONSE_WORDS, "an option's explanation"];
      }
      if (f.why && typeof f.why === 'object') {
        for (const [aspect, byVerdict] of Object.entries(f.why)) {
          for (const [verdict, text] of Object.entries(byVerdict ?? {})) {
            yield [`${t}.${f.key}.why.${aspect}.${verdict}`, text, L.MAX_RESPONSE_WORDS, "a list row's explanation"];
          }
        }
      }
    }
    for (const st of s.settings ?? []) {
      for (const [value, text] of Object.entries(st.why ?? {})) {
        yield [`${t}.settings.${st.key}.why[${value}]`, text, L.MAX_RESPONSE_WORDS, "a setting's explanation"];
      }
    }
    for (const l of s.locked ?? []) yield [`${t}.locked[${l.label}]`, String(l.value ?? ''), 0];
  }

  for (const [t, probe] of Object.entries(p.nodeProbes ?? {})) {
    yield [`probe.${t}.prompt`, probe?.prompt, L.MAX_QUESTION_WORDS, 'a probe question'];
    for (const o of probe?.options ?? []) {
      yield [`probe.${t}.option`, o.text, L.MAX_ANSWER_WORDS, 'a probe answer'];
      yield [`probe.${t}.response`, o.response, L.MAX_RESPONSE_WORDS, "Iris's reply to a probe"];
    }
  }
}

/** Only the strings a learner picks BETWEEN get the one-line character cap. */
function* labelsOf(p) {
  for (const [i, d] of (p.dissection ?? []).entries()) {
    for (const o of d.options ?? []) yield [`dissection[${i}].option`, o.label];
  }
  for (const [t, s] of Object.entries(p.nodeSetup ?? {})) {
    for (const f of s.fields ?? []) {
      for (const o of [...(f.options ?? []), ...(f.valueOptions ?? []), ...(f.nameOptions ?? [])]) {
        yield [`${t}.${f.key}.option`, String(o.label ?? o.value ?? '')];
      }
    }
  }
}

function issuesFor(p) {
  const out = [...statementIssues(p.statement ?? '')];
  for (const [path, text, cap, what] of copyOf(p)) {
    if (typeof text !== 'string' || !text) continue;
    out.push(...longSentences(path, text));
    out.push(...dashIssues(path, text));
    if (cap) out.push(...capWords(path, text, cap, what));
  }
  for (const [path, label] of labelsOf(p)) out.push(...optionLabelIssues(path, label));
  return out.filter(
    (v, i, a) => a.findIndex((x) => x.path === v.path && x.message === v.message) === i
  );
}

if (only && !problems[only]) {
  console.error(`unknown case "${only}". Known: ${Object.keys(problems).join(', ')}`);
  process.exit(2);
}
const targets = only ? { [only]: problems[only] } : problems;

let total = 0;
for (const [id, p] of Object.entries(targets)) {
  const issues = issuesFor(p);
  total += issues.length;
  console.log(`  ${issues.length ? '[31m✗[0m' : '[32m✓[0m'} ${id.padEnd(24)} ${issues.length} violation(s)`);
  if (verbose) for (const i of issues) console.log(`      ${i.path}\n        ${i.message}`);
}
console.log(
  total
    ? `\n[31m${total} violation(s)[0m. Run with --verbose to see each one.`
    : '\n[32mplain language: clean[0m'
);
process.exit(total ? 1 : 0);
