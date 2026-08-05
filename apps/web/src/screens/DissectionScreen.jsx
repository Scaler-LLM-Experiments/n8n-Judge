import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowRight, XCircle, CheckCircle, Microphone, CircleNotch } from '@phosphor-icons/react';
import { Button } from '../design-system/Button.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ConceptFlow } from '../components/ConceptFlow.jsx';
import { ProblemNote } from '../components/ProblemNote.jsx';
import { IrisMascot } from '../mascot/IrisMascot.jsx';
import { N8nNodeView } from '../n8n/N8nNodeView.jsx';
import { NodeIcon } from '../nodes/nodeIcons.js';
import { checkAnswer } from '../lib/grader.js';
import { resolveServerVerdict, UNVERIFIED_MESSAGE } from '../lib/verdict.js';
import { useHideVoiceGlow, useVoiceActions } from '../lib/VoiceContext.jsx';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const LEARNER_NAME = 'Aarav';
const COLUMN = 620;

// Turn a checkAnswer() response into the verdict this screen renders. Falls
// back to the local answer fields only when the server could not be reached
// (no session yet, or a dropped request) — never as a substitute once the
// server has actually answered, since those fields are being stripped from
// the payload the client is served.
function resolveVerdict(q, opt, result) {
  // The server is the only source of a verdict; the browser holds no answers.
  // If it did not answer, `correct` comes back null and the screen says so.
  //
  // This used to fall back to `correct: true`, which meant that whenever a check
  // failed EVERY option a learner clicked went green — unlocking nodes nobody had
  // earned and teaching the wrong thing. Never guess. See lib/verdict.js.
  if (result || q.correctType === undefined) return resolveServerVerdict(result);

  // Authored data present (never true for a learner — only in tests and tooling
  // that work from the unprojected problem).
  const correct = opt.type === q.correctType;
  return {
    correct,
    why: correct ? q.explanation : q.wrongHint,
    unlocks: correct ? (q.unlocks ?? []) : [],
    verified: true,
  };
}

// Where a resumed learner rejoins the quiz: the first question they have no
// answer on record for. Any recorded answer counts, right or wrong, because the
// quiz advances on either — re-asking a question they moved past would offer a
// second attempt at something already graded.
//
// Returns `questions.length` when every question is answered, which reads as "the
// quiz is behind you" at the call site.
export function resumeQuizIndex(questions, answeredIds) {
  if (!answeredIds?.length) return 0;
  const answered = new Set(answeredIds);
  const at = questions.findIndex((q) => !answered.has(q.id));
  return at === -1 ? questions.length : at;
}

/**
 * `resume` is this learner's own progress, replayed from their trace:
 * `{ answered: string[], unlockedTypes: string[] }`. Absent on a fresh start,
 * which is the normal case.
 */
export function DissectionScreen({ problem, sessionId, onComplete, onDecision, resume }) {
  const questions = problem.dissection;
  const voice = useVoiceActions();
  // Read once, at mount: this is a starting position, not a live input.
  const [resumeAt] = useState(() => resumeQuizIndex(questions, resume?.answered));
  const [phase, setPhase] = useState(() => {
    // A learner who has answered nothing gets the two intro beats. One who is
    // part way through has already heard them, and replaying Iris's greeting is
    // how "continue where you left off" stops feeling like starting over.
    if (resumeAt === 0) return 'greet';
    return resumeAt >= questions.length ? 'done' : 'quiz';
  }); // greet | problem | quiz | done
  const [index, setIndex] = useState(() => Math.min(resumeAt, Math.max(questions.length - 1, 0)));
  const [picked, setPicked] = useState(null); // option index
  const [checking, setChecking] = useState(false); // request for `picked` in flight
  const [verdict, setVerdict] = useState(null); // settled { correct, why, unlocks } for `picked`
  const [attempts, setAttempts] = useState(() => questions.map(() => 0));
  const [firstTryByQuestion, setFirstTryByQuestion] = useState(() => questions.map(() => null));
  // Accumulates from correct answers as they land, seeded with what the learner
  // had already unlocked before they left — the summary beat draws the toolkit
  // from this, so starting it empty would show a resumed learner no tools.
  const [unlockedTypes, setUnlockedTypes] = useState(() => resume?.unlockedTypes ?? []);
  const [showNote, setShowNote] = useState(true);
  // 'hello' belongs to the greeting beat. A resumed learner skips it, so Iris
  // should not be waving at someone she is mid-conversation with.
  const [mascotClip, setMascotClip] = useState(resumeAt === 0 ? 'hello' : 'idle');
  const advanceTimer = useRef(null);
  const quizRef = useRef(null);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  // One line per narrated beat. Keyed on `phase` and guarded by a ref so React's
  // development double-render does not say the same sentence twice.
  const spoken = useRef({});
  useEffect(() => {
    const moment =
      phase === 'greet' ? 'welcome'
      : phase === 'problem' ? 'problem_intro'
      : phase === 'quiz' ? 'understand_start'
      // Spoken when this screen APPEARS. It used to fire from the button that
      // leaves it, and `goTo` stops narration on a screen change, so the line for
      // "you've got the plan" was started and cut in the same instant.
      : phase === 'done' ? 'understand_done'
      : null;
    if (!moment || spoken.current[moment]) return;
    spoken.current[moment] = true;
    // Each beat is its own scope, so clicking through the intro fast cuts the
    // previous line rather than making the learner wait it out.
    voice.play(moment, { scope: `beat:${phase}` });
  }, [phase, voice]);

  // Warm BOTH verdicts while the learner is still reading the question. Without
  // this, the line is rendered only after they click, so Iris answers a second or
  // two late — by which time they have already read the explanation themselves.
  // ease the whole quiz screen in when arriving from the problem beat
  useEffect(() => {
    if (phase === 'quiz' && quizRef.current) {
      gsap.fromTo(quizRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
    }
  }, [phase]);

  // Option order arrives already balanced from the server
  // (`balanceProblemOptions`, run inside `toPublicProblem` while the answer key
  // still exists). We used to shuffle here per tab session, which could not
  // work: `correctType` is stripped before the browser sees the problem, so this
  // was randomising blind — and independent per-question randomisation is what
  // let one session put the answer on top of nearly every question at once.
  // Correctness is by `type`, never by position, so rendering as-sent is safe.
  const q = questions[index];

  // Warm a clip per possible verdict, AFTER `q` exists: this effect used to sit
  // above the declaration and threw "Cannot access 'q' before initialization",
  // which took the whole Understand screen down. Every option is on screen, so
  // every wording the verdict can use is known before they click.
  useEffect(() => {
    if (phase !== 'quiz') return;
    // Everything that can be said next, in likelihood order. The store pulls the
    // first few down now and tops up while each line plays, so by the time a
    // learner clicks, the clip is already in memory.
    voice.setUpcoming([
      ...(q.options ?? []).map((opt) => ({ moment: 'answer_wrong', vars: { key: q.id, answer: opt.label } })),
      ...(q.options ?? []).map((opt) => ({ moment: 'answer_correct', vars: { key: q.id, answer: opt.label } })),
      { moment: 'understand_done', vars: {} },
    ]);
  }, [phase, index, voice, q]);
  const pickedOption = picked !== null ? q.options[picked] : null;
  // "answered" = settled (verdict landed); "pending" = picked but awaiting the
  // server. Only `answered` unlocks Continue / shows the explanation.
  const answered = picked !== null && !checking && verdict !== null;
  const pending = picked !== null && checking;
  const isCorrect = verdict?.correct === true;
  // The check did not complete. Not correct, not wrong — and the learner can retry.
  const unverified = verdict !== null && verdict.correct === null;

  // advance to the next question (or finish) — driven by the per-question
  // Continue button, so the learner reads the explanation at their own pace
  const advance = () => {
    // They have read the explanation and moved on, so stop talking about it.
    voice.stop();
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      setVerdict(null);
      setMascotClip('idle');
    } else {
      setPhase('done');
    }
  };

  const pick = async (i) => {
    if (checking) return; // one in-flight check at a time
    if (picked !== null && verdict?.correct === true) return; // locked only after a verified correct answer
    const opt = q.options[i];
    setPicked(i); // select immediately — the verdict settles asynchronously
    setVerdict(null);
    setChecking(true);
    const result = await checkAnswer(sessionId, 'dissection', q.id, opt.type);
    const resolved = resolveVerdict(q, opt, result);
    setChecking(false);
    setVerdict(resolved);
    // Only react to a verdict we actually have. `correct === null` means the
    // check did not complete: no celebration, no shake, and crucially no attempt
    // counted against the learner for a request that failed.
    setMascotClip(resolved.correct === true ? 'correct' : resolved.correct === false ? 'shake-no' : 'idle');
    // Silent on `null`: "could not check" is not a verdict, so Iris has nothing
    // truthful to say about it.
    // The option's own label, so the verdict is about their actual choice rather
    // than a generic yes or no. `key` lets a problem author a line for this
    // specific question.
    const said = { key: q.id, answer: opt.label, scope: `q:${q.id}` };
    if (resolved.correct === true) voice.play('answer_correct', said);
    else if (resolved.correct === false) {
      // Second miss on the same question gets a stronger pointer. An instructor
      // does not repeat themselves at the same volume: the first "are you sure?"
      // becomes "here is where to look". `attempts[index]` is the count BEFORE
      // this one, so a value of 1 or more means they have already missed once.
      voice.play(attempts[index] >= 1 ? 'answer_wrong_again' : 'answer_wrong', said);
    }
    if (resolved.correct === true) {
      setUnlockedTypes((prev) => [...new Set([...prev, ...resolved.unlocks])]);
      // Prefer the server's firstTry; `attempts[index] === 0` (no prior wrong
      // pick recorded locally) is the fallback for the no-session path.
      setFirstTryByQuestion((f) => f.map((v, k) => (k === index ? (result?.firstTry ?? (attempts[index] === 0)) : v)));
    } else if (resolved.correct === false) {
      setAttempts((a) => a.map((v, k) => (k === index ? v + 1 : v)));
    }
  };

  // Iris is centred and large on both of these beats, so the corner glow is a
  // second light saying the same thing. Held here rather than inside `Greet` and
  // `Done`, because `phase` is the thing that decides it.
  useHideVoiceGlow(phase === 'greet' || phase === 'done');

  if (phase === 'greet') {
    return <Greet problem={problem} onContinue={() => { setPhase('problem'); }} />;
  }
  if (phase === 'problem') {
    return <ProblemBeat problem={problem} onContinue={() => { setPhase('quiz'); setMascotClip('idle'); }} />;
  }
  if (phase === 'done') {
    const finishDissection = () => {
      // No line here: `understand_done` is spoken on arrival, above.
      questions.forEach((x, i) => onDecision && onDecision({ id: `dissection:${x.id}`, kind: 'dissection', label: x.prompt, correct: true, firstTry: firstTryByQuestion[i] ?? (attempts[i] === 0) }));
      onComplete({ attempts, unlockedTypes });
    };
    return <Done problem={problem} unlockedTypes={unlockedTypes} onFinish={finishDissection} />;
  }

  // ---------- QUIZ ----------
  return (
    <div ref={quizRef} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-0)' }}>
      {/* spinner for the "checking your answer" state while awaiting the server */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }
      `}</style>
      <TopBar activeStage="statement" problem={problem} />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '72px 24px 72px' }}>
        <QuizBody
          key={index}
          q={q}
          index={index}
          total={questions.length}
          picked={picked}
          pending={pending}
          answered={answered}
          verdict={verdict}
          isCorrect={isCorrect}
          unverified={unverified}
          onPick={pick}
          onContinue={advance}
        />
      </div>

      {/* Iris stays parked bottom-left. She reacts to the verdict, then talks
          through the line she is actually saying — see IrisMascot. */}
      <div style={{ position: 'fixed', left: 28, bottom: 24, zIndex: 50, pointerEvents: 'none' }}>
        <IrisMascot resting={mascotClip} size={118} />
      </div>

      {showNote ? (
        <ProblemNote problem={problem} onHide={() => setShowNote(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 70, display: 'flex', alignItems: 'center', gap: 6, background: '#FEFAE7', border: '1px solid #E8DFA8', boxShadow: '0 6px 18px rgba(1,24,69,0.14)', padding: '8px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', color: '#8A7B2E' }}
        >
          Show the problem
        </button>
      )}
    </div>
  );
}

function QuizBody({ q, index, total, picked, pending, answered, verdict, isCorrect, unverified, onPick, onContinue }) {
  const rootRef = useRef(null);
  const nodeRef = useRef(null);
  const pickedOption = picked !== null ? q.options[picked] : null;
  const isLast = index + 1 >= total;

  // staggered entrance — runs on mount (QuizBody is keyed by index, so this
  // fires for the first question arriving from the problem beat AND on every
  // question change).
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-q="head"]', { y: 22, opacity: 0, duration: 0.5, ease: 'power3.out' });
      gsap.from('[data-q="opt"]', { y: 16, opacity: 0, duration: 0.45, stagger: 0.07, delay: 0.12, ease: 'power2.out' });
      gsap.from('[data-q="canvas"]', { y: 18, opacity: 0, duration: 0.5, delay: 0.24, ease: 'power2.out' });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (picked !== null && nodeRef.current) gsap.fromTo(nodeRef.current, { scale: 0.82, y: 8 }, { scale: 1, y: 0, duration: 0.5, ease: 'back.out(2)' });
  }, [picked]);

  return (
    <div ref={rootRef} style={{ width: '100%', maxWidth: COLUMN, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div data-q="head">
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 10 }}>
          Question {index + 1} of {total}
        </div>
        <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 22, lineHeight: 1.35, maxWidth: 560 }}>{q.prompt}</div>
      </div>

      {/* option boxes: letter + node icon + label */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
        {q.options.map((opt, i) => {
          const state = picked === i ? (pending ? 'pending' : unverified ? 'idle' : isCorrect ? 'correct' : 'wrong') : 'idle';
          const dim = answered && isCorrect && picked !== i;
          return (
            <div key={i} data-q="opt" style={{ display: 'flex' }}>
              <OptionBox letter={LETTERS[i]} option={opt} state={state} dim={dim} disabled={pending || (answered && isCorrect)} onClick={() => onPick(i)} />
            </div>
          );
        })}
      </div>

      {/* awaiting the server's verdict — the pick already reads as selected
          above, this just says why nothing else has happened yet */}
      {pending ? (
        <div style={{ width: '100%', marginTop: 32, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '13px 15px', border: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
          <CircleNotch size={18} weight="bold" color="var(--fg-3)" className="spin" />
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Checking your answer…</div>
        </div>
      ) : null}

      {/* nudge on wrong, explanation on correct */}
      {answered ? (
        <div style={{ width: '100%', marginTop: 32, display: 'flex', gap: 10, textAlign: 'left', padding: '13px 15px', border: `1px solid ${isCorrect ? 'var(--brand-blue-100)' : 'var(--status-danger-border)'}`, background: isCorrect ? 'var(--brand-blue-50)' : 'var(--status-danger-bg)' }}>
          {isCorrect ? <CheckCircle size={18} weight="fill" color="var(--brand-primary)" style={{ flex: 'none', marginTop: 1 }} /> : <XCircle size={18} weight="fill" color="var(--status-danger)" style={{ flex: 'none', marginTop: 1 }} />}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? 'var(--brand-primary)' : 'var(--status-danger)', marginBottom: 3 }}>
              {isCorrect ? `Right — ${pickedOption.label} it is` : `Not ${pickedOption.label} — try again`}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>{verdict?.why ?? (isCorrect ? 'Nice — that’s the right node.' : 'Give it another look.')}</div>
          </div>
        </div>
      ) : null}

      {/* center node canvas — ghost outline of the node until picked */}
      <div data-q="canvas" style={{ width: '100%', marginTop: 22, border: '1px solid var(--border-strong)', background: '#E9ECF2', backgroundImage: 'radial-gradient(#C4CAD4 1px, transparent 1px)', backgroundSize: '16px 16px', padding: '32px 18px 36px', display: 'flex', justifyContent: 'center', minHeight: 168, alignItems: 'center' }}>
        <div ref={nodeRef}>
          {answered ? (
            <N8nNodeView type={pickedOption.type} label={pickedOption.label} tag={isCorrect ? 'correct' : 'wrong'} />
          ) : pending ? (
            <N8nNodeView type={pickedOption.type} label={pickedOption.label} />
          ) : (
            <N8nNodeView label="Which node?" placeholder />
          )}
        </div>
      </div>

      {/* per-question Continue — below the node box, once the pick is correct */}
      {answered && isCorrect ? (
        <div style={{ marginTop: 22 }}>
          {/* Primary, not outline: once the answer is right this is the only
              thing left to do on the screen, so it should not read as
              secondary. */}
          <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={onContinue}>
            {isLast ? 'Finish — see my toolkit' : 'Continue'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function OptionBox({ letter, option, state, dim, disabled, onClick }) {
  const [hover, setHover] = useState(false);
  // 'pending' = picked, awaiting the server — neutral (not yet green/red), but
  // visibly selected so the click doesn't feel dropped.
  const border = state === 'correct' ? 'var(--brand-primary)' : state === 'wrong' ? 'var(--status-danger)' : state === 'pending' ? 'var(--fg-3)' : hover ? 'var(--fg-3)' : 'var(--border-subtle)';
  const bg = state === 'correct' ? 'var(--brand-blue-50)' : state === 'wrong' ? 'var(--status-danger-bg)' : state === 'pending' ? 'var(--surface-1)' : 'var(--surface-0)';
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 15px',
        border: `1px solid ${border}`,
        background: bg,
        cursor: disabled ? 'default' : 'pointer',
        opacity: dim ? 0.45 : 1,
        width: '100%',
        textAlign: 'left',
        fontFamily: 'var(--font-body)',
        transition: 'border-color 120ms ease, background 120ms ease, opacity 120ms ease',
      }}
    >
      <span style={{ width: 24, height: 24, flex: 'none', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--fg-2)' }}>
        {letter}
      </span>
      <span style={{ width: 28, height: 28, flex: 'none', borderRadius: 7, background: 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <NodeIcon type={option.type} size={16} />
      </span>
      <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--fg-1)', flex: 1 }}>{option.label}</span>
      {state === 'pending' ? <CircleNotch size={15} weight="bold" color="var(--fg-3)" className="spin" /> : null}
    </button>
  );
}

function Greet({ problem, onContinue }) {
  const root = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-a="m"]', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out' });
      gsap.from('[data-a="r"]', { y: 16, opacity: 0, duration: 0.6, stagger: 0.14, delay: 0.3, ease: 'power2.out' });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar activeStage="statement" problem={problem} />
      <div ref={root} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div data-a="m" style={{ position: 'relative', marginBottom: 14 }}>
          <IrisMascot resting="hello" size={151} />
        </div>
        {/* Generic on purpose. This screen is Iris introducing herself, and it reads
            the same whichever challenge you picked. What is specific to the problem
            is the line she SPEAKS over it (`welcome` in the problem's voice block),
            which is also why neither repeats the other. */}
        <h1 data-a="r" style={{ fontFamily: 'var(--font-headline)', fontSize: 40, fontWeight: 600, margin: '0 0 14px' }}>
          Hi, I’m Iris.
        </h1>
        <p data-a="r" style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--fg-2)', maxWidth: 560, margin: '0 0 10px' }}>
          I’m your mentor for this one. I’ll hand-hold you the whole way through, one step at a time,
          until you’ve built it yourself.
        </p>
        <div data-a="r" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', fontSize: 12.5, color: 'var(--fg-2)', marginBottom: 30 }}>
          <Microphone size={15} color="var(--brand-primary)" weight="fill" /> I will talk you through it. Use the speaker button up top to mute me.
        </div>
        <div data-a="r">
          <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={onContinue}>Continue</Button>
        </div>
      </div>
    </div>
  );
}

function ProblemBeat({ problem, onContinue }) {
  const root = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      // mascot swoops down to the bottom-left corner
      gsap.from('[data-a="mascot"]', { x: () => window.innerWidth / 2 - 90, y: () => -(window.innerHeight - 320), opacity: 0.4, duration: 0.9, ease: 'power3.inOut' });
      gsap.from('[data-a="r"]', { y: 20, opacity: 0, duration: 0.6, stagger: 0.12, delay: 0.35, ease: 'power2.out' });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={root} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar activeStage="statement" problem={problem} />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', textAlign: 'center' }}>
        <div data-a="r" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 14 }}>
          Today’s problem
        </div>
        <h1 data-a="r" style={{ fontFamily: 'var(--font-headline)', fontSize: 52, fontWeight: 600, margin: '0 0 20px', lineHeight: 1.05, maxWidth: 820 }}>
          {problem.title}
        </h1>
        {/* The two-line `brief`, not the full `statement`. A learner opening this
            screen needs the situation, not the spec; the complete brief is one
            click away in the problem panel (and is what Ask-AI is grounded in).
            Falls back to the statement only for problems authored before `brief`. */}
        <p data-a="r" style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: 640, margin: '0 0 30px' }}>{problem.brief || problem.statement}</p>

        <div data-a="r" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', padding: '26px 28px', marginBottom: 32, maxWidth: '100%', overflowX: 'auto' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 16 }}>The shape of it</div>
          <ConceptFlow direction="row" problem={problem} />
        </div>

        <div data-a="r">
          <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={onContinue}>Let’s dissect it</Button>
        </div>
      </div>

      {/* mascot resting bottom-left */}
      <div data-a="mascot" style={{ position: 'fixed', left: 28, bottom: 24, zIndex: 50 }}>
        <IrisMascot resting="presenting" size={118} />
      </div>
    </div>
  );
}

function Done({ problem, unlockedTypes, onFinish }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar activeStage="statement" problem={problem} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <IrisMascot resting="celebrate" size={134} />
        </div>
        {/* No em dashes: the house rule bans them in anything Iris says, and this
            screen is the written half of a line she speaks. The title names what the
            learner just did instead of opening on "Nice". */}
        <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-headline)', fontWeight: 600 }}>You know what to build.</h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: 560, marginBottom: 26 }}>
          You worked out every node this workflow needs, and here is your toolkit. You’ll wire it up next. One heads up: the builder also stocks a few tools you <em>won’t</em> need.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', marginBottom: 30 }}>
          {unlockedTypes.map((t) => (
            <N8nNodeView key={t} type={t} label={labelForType(problem, t)} size={64} />
          ))}
        </div>
        <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} onClick={onFinish}>Start building</Button>
      </div>
    </div>
  );
}

function labelForType(problem, type) {
  return problem.nodePalette.find((n) => n.type === type)?.label || type;
}
