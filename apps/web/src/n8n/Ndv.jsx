import React, { useEffect, useMemo, useRef, useState } from 'react';
import { visibleFields, pruneHidden, isListKind, aspectsFor, aspectLabel, gradeListAspect, listReady } from '@judge/problem-schema';
import gsap from 'gsap';
import { X, LockSimple, CaretDown, CheckCircle, XCircle, Lightning, Sparkle, Lock, CircleNotch, Warning } from '@phosphor-icons/react';
import { NodeIcon, metaOf, typeCategory } from '../nodes/nodeIcons.js';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { SettingsForm } from './SettingsForm.jsx';
import { IrisBubble } from './IrisBubble.jsx';
import { CollectionControl, FieldControl, FixedCollectionControl, isCorrectValue, expressionFor, whyForField, resourceValue } from './FieldControl.jsx';
import { RuleListControl } from './RuleListControl.jsx';
import { defaultSettings, gradeSettings } from './nodeSettings.js';
import { checkAnswer } from '../lib/grader.js';
import { useVoiceActions } from '../lib/VoiceContext.jsx';
import { defaultsForParams, mergeCatalogFields } from './catalogFields.js';

// Shown once per session: the first time a node verifies, Iris spotlights the
// close button so the learner learns that closing a green NDV finishes the node.
let ndvVignetteSeen = false;

// How long after pressing Verify the spoken verdict lands. The visuals settle at
// 2000ms; this is deliberately earlier, so Iris reacts rather than recaps. Not
// zero: firing the instant the request returns would talk over the "running" bar
// that has only just appeared.
const VOICE_LEAD_MS = 1150;

// Bottom node-detail drawer. INPUT | Parameters/Settings | OUTPUT.
// The Parameters tab is real field configuration: fixed context fields are shown
// disabled, and only the field the learner must set is highlighted (blue, pulsing)
// as an editable select. "Verify setup" marks it green or red; clicking the field
// brings Iris close with a chat bubble explaining it. All green → "Complete setup".
// Settings is the second stage, not a locked tab: it unlocks once Parameters
// verify green, and setup needs BOTH. Only what the problem grades is editable;
// the rest render at real n8n defaults but locked.
export function Ndv({ node, setup, inputData, inputLabel, onDecision, onComplete, onClose, sessionId }) {
  const voice = useVoiceActions();
  const [tab, setTab] = useState('params');
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const runTimer = useRef(null);
  const voiceTimer = useRef(null);
  const meta = metaOf(node.nodeType);
  // Sub-nodes (Chat Model, and later Memory/Tool/Parser) attach to a root node
  // over an ai_* connector. They are never handed items, so the INPUT pane has
  // nothing truthful to show — it was claiming "this node starts the flow".
  const isSubNode = typeCategory[node.nodeType] === 'model';

  const allFields = useMemo(
    () => mergeCatalogFields(node.catalogParams, setup?.fields),
    [node.catalogParams, setup?.fields]
  );
  const resolvedSetup = useMemo(() => ({ ...setup, fields: allFields }), [setup, allFields]);
  // Settings the problem actually grades. The tab always renders the full n8n
  // set; this is just the subset that counts.
  const gradedSettings = setup?.settings || [];
  // Both open on whatever the learner had already entered on this node, and fall
  // back to empty / real n8n defaults when they have not been here before. A
  // resumed node arrives with its values from the trace; a node reopened in the
  // same sitting keeps what was typed into it.
  //
  // The VERDICTS are deliberately not restored: `results` starts null, so Verify
  // has to be pressed again. A green tick is the server's to give, and re-checking
  // an answer that was already right cannot cost marks — `attemptsFromTrace` keeps
  // the lowest attempt that was correct.
  const [settings, setSettings] = useState(() => ({ ...defaultSettings(), ...(node.settings ?? {}) }));
  const [settingsResults, setSettingsResults] = useState(null);
  const [values, setValues] = useState(() => ({ ...defaultsForParams(node.catalogParams), ...(node.values ?? {}) }));
  const [results, setResults] = useState(null); // { [key]: 'correct' | 'wrong' }
  // Per-ROW verdicts for a list field: { '<fieldKey>#<aspect>': { items[], missing } }.
  // Server-only, so a dev route with no session keeps the list-level messages.
  const [rowResults, setRowResults] = useState(null);
  // The explanation text for each field, keyed like `results`. Populated at
  // Verify time from the server's answer (or the local fallback) — the
  // "ask Iris why" button reads from here rather than recomputing locally,
  // because the server no longer ships `option.why`/`whyCorrect`/`whyWrong`
  // for it to recompute from.
  const [fieldWhy, setFieldWhy] = useState(null);
  const [feedback, setFeedback] = useState(null); // { key, verdict, why }
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [inputLoaded, setInputLoaded] = useState(false);
  const [showVignette, setShowVignette] = useState(false);
  const attempts = useRef(0);
  const vigTimer = useRef(null);

  // Warm both outcomes on open, so the verdict is spoken the instant Verify
  // lands rather than a beat later.
  useEffect(() => {
    // WITH the node, because the line names it. Warming without the vars renders
    // "Yes, is set up right" and then plays that.
    const said = { key: node.nodeType, node: node.label };
    voice.setUpcoming([
      { moment: 'verify_pass', vars: said },
      { moment: 'verify_params', vars: said },
      { moment: 'verify_fail', vars: said },
      { moment: 'phase_complete', vars: {} },
    ]);
  }, [voice, node.nodeType, node.label]);

  useEffect(() => {
    gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.24, ease: 'power2.out' });
    gsap.fromTo(panelRef.current, { scale: 0.96, y: 14, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.34, ease: 'power3.out' });
    return () => { clearTimeout(runTimer.current); clearTimeout(voiceTimer.current); clearTimeout(vigTimer.current); };
  }, []);
  const requestClose = () => {
    // Closing the panel ends the subject. A verdict about a node the learner has
    // just walked away from is noise.
    voice.stop();
    clearTimeout(vigTimer.current);
    gsap.to(panelRef.current, { scale: 0.97, y: 10, opacity: 0, duration: 0.22, ease: 'power2.in' });
    gsap.to(rootRef.current, { opacity: 0, duration: 0.24, ease: 'power2.in', onComplete: onClose });
  };

  // Conditional parameters: n8n reveals and hides fields as you configure a
  // node, and a HIDDEN required field is never "missing" (see
  // docs/n8n-reference/00-how-n8n-actually-works.md §5). So every gate below —
  // what renders, what Verify submits, what "all chosen" means, whether the
  // Settings tab unlocks — reads `fields`, the visible subset, never `allFields`.
  const fields = useMemo(() => visibleFields(allFields, values), [allFields, values]);

  // One entry per graded QUESTION on the Parameters tab. Almost every field is
  // one question, but a rule list is three (count / categories / conditions) —
  // see packages/problem-schema/ruleList.ts for why it is scored that way. The
  // verify loop, the results map and the "all green?" gate all read this rather
  // than `fields`, so a field contributing several questions needs no special
  // casing anywhere below.
  const paramChecks = useMemo(
    () =>
      fields.filter((f) => f.graded !== false).flatMap((f) =>
        isListKind(f.kind)
          ? aspectsFor(f.kind).map((aspect) => ({
              field: f,
              key: `${f.key}#${aspect}`,
              id: `${node.nodeType}:${f.key}#${aspect}`,
              aspect,
              label: `${f.label} — ${aspectLabel(f.kind, aspect)}`,
            }))
          : [{ field: f, key: f.key, id: `${node.nodeType}:${f.key}`, aspect: null, label: f.label }]
      ),
    [fields, node.nodeType]
  );

  const noVerify = paramChecks.length === 0 && gradedSettings.length === 0;
  const optionFor = (field, value) => (field.options ?? []).find((o) => o.value === value);

  // A node is configured in two stages, in order: Parameters, then Settings.
  // Settings stays locked until the parameters are green, because a node whose
  // parameters are still wrong has nothing meaningful to say about how it
  // should behave when it fails. Setup is only complete when BOTH are green —
  // clearing the first tab is not finishing the node.
  const paramsOk = paramChecks.length === 0 || (results !== null && paramChecks.every((c) => results[c.key] === 'correct'));
  const hasSettings = gradedSettings.length > 0;
  const settingsOk = !hasSettings || (settingsResults !== null && settingsResults.every((r) => r.correct));
  const settingsUnlocked = paramsOk;
  const stage = !paramsOk ? 'params' : !settingsOk ? 'settings' : 'done';

  // A boolean field's answer may legitimately be `false`, and a number's may
  // be 0 — truthiness is the wrong test now that fields aren't all dropdowns.
  const hasValue = (f) => {
    const v = values[f.key];
    if (f.kind === 'boolean') return v !== undefined;
    if (f.kind === 'number') return v !== undefined && v !== '';
    // A resourceLocator is `{ __rl, mode, value }`: it always has an object as
    // soon as the mode is touched, so String(v) would be "[object Object]" and
    // read as filled in. What matters is whether a resource was actually chosen.
    if (f.kind === 'resourceLocator') return String(resourceValue(v) ?? '').trim() !== '';
    // Every rule filled in, and at least one rule. A half-built rule would be
    // submitted as a wrong answer to a question the learner had not finished.
    if (isListKind(f.kind)) return listReady(f.kind, v);
    return v !== undefined && String(v).trim() !== '';
  };
  const allChosen = stage === 'params' ? fields.filter((field) => field.graded !== false).every(hasValue) : true;
  const allCorrect = paramsOk && settingsOk;
  const running = phase === 'running';
  const isComplete = noVerify || (paramsOk && settingsOk);

  const setValue = (key, value) => {
    // Prune values for fields this change just hid. n8n stores only displayed
    // parameters, so a follow-up filled in for a branch the learner then
    // abandoned must not be submitted — it answers a question no longer asked.
    setValues((v) => pruneHidden(allFields, { ...v, [key]: value }));
    setResults(null);
    setRowResults(null);
    setFieldWhy(null);
    setSettingsResults(null);
    setFeedback(null);
    if (phase !== 'idle') setPhase('idle');
  };

  const setSetting = (key, value) => {
    setSettings((s2) => ({ ...s2, [key]: value }));
    setSettingsResults(null);
    // Deliberately does NOT clear `results`. Parameter verification is stage
    // one and is already banked; clearing it here sent the node back to stage
    // one the moment a setting was touched — which re-locked the Settings tab
    // the learner was standing on and flipped the button back to "Verify
    // setup", so a graded setting could never be submitted at all.
    if (phase !== 'idle') setPhase('idle');
  };

  // dragging an input field chip onto a parameter picks the matching option
  const dropField = (field, droppedKey) => {
    // The single highest-leverage n8n interaction: drop a field from INPUT and
    // n8n writes the expression for you. For select fields it still just picks
    // the matching option.
    if (field.kind === 'expression') {
      setValue(field.key, expressionFor(droppedKey));
      return;
    }
    if (field.dataPath || field.requiresDataPath) {
      const next = field.dataPath === 'multiple' || field.requiresDataPath === 'multiple'
        ? [values[field.key], droppedKey].filter(Boolean).join(', ')
        : droppedKey;
      setValue(field.key, next);
      return;
    }
    const opt = (field.options ?? []).find((o) => o.value === droppedKey);
    if (opt) setValue(field.key, opt.value);
  };

  // pull the node's test input into the Input panel (optional; also happens on Verify)
  const loadInput = () => setInputLoaded(true);

  // "Verify setup" runs the node like a real execution: the parameters strip shows
  // a running bar, then the output loads on the right (all-correct) or stays empty.
  //
  // Grading is server-authoritative: the request is fired the moment Verify is
  // pressed (not inside the timeout), so the round trip overlaps the ~2s
  // "running" animation instead of adding to it. All fields/settings are
  // checked together via Promise.all — never awaited one at a time. If a
  // check comes back null (no session, e.g. the #build/#run-story dev
  // routes, or a dropped request), that one item falls back to the local
  // logic so those routes keep working without a backend.
  /**
   * Speak the verdict as soon as it is known, a beat BEFORE the visuals settle.
   *
   * The results are applied after the ~2s "running" bar, and the line used to be
   * spoken from inside that same callback — so Iris confirmed a result the learner
   * had already read off the screen. Leading it slightly is the difference between
   * a reaction and a recap.
   *
   * Silent when any check did not complete: "could not check" is not a verdict.
   */
  const speakVerdict = (serverResults) => {
    if (!serverResults?.length) return;
    if (serverResults.some((r) => !r || typeof r.correct !== 'boolean')) return;
    const passed = serverResults.every((r) => r.correct);

    // THE ONLY PLACE A VERDICT IS SPOKEN. There used to be a second one, further
    // down in the results handler, and both ran on every verify — so Iris said
    // "that's done" twice, or "not quite" twice, for every single check. Two
    // speakers for one event is the bug; splitting the moments did not fix it,
    // because the duplicate was the other speaker.
    //
    // Which of the three it is depends on what is left to do:
    //   failed                              -> verify_fail
    //   parameters right, Settings to come  -> verify_params, no celebration
    //   nothing left                        -> verify_pass, the node works
    const moreToDo = passed && stage !== 'settings' && gradedSettings.length > 0;
    const moment = !passed ? 'verify_fail' : moreToDo ? 'verify_params' : 'verify_pass';
    voice.play(moment, { key: node.nodeType, node: node.label, scope: `node:${node.id}` });
  };

  const verify = () => {
    if (running) return;
    setInputLoaded(true);
    setPhase('running');
    setFeedback(null);
    const gradingSettings = stage === 'settings';
    if (!gradingSettings) { setResults(null); setRowResults(null); }

    const pending = gradingSettings
      ? Promise.all(gradedSettings.map((g) => checkAnswer(sessionId, 'setting', `${node.nodeType}:${g.key}`, settings[g.key])))
      : Promise.all(paramChecks.map((c) => checkAnswer(sessionId, 'field', c.id, values[c.field.key])));

    // Voice on its own clock, ahead of the visuals.
    voiceTimer.current = setTimeout(() => {
      pending.then(speakVerdict).catch(() => {});
    }, VOICE_LEAD_MS);

    runTimer.current = setTimeout(() => {
      pending.then((serverResults) => {
        const firstTry = attempts.current === 0;
        attempts.current += 1;

        // --- Stage 2: the parameters are already green, grade the Settings tab.
        if (gradingSettings) {
          // Local grading is the fallback baseline (also supplies label et al,
          // which the check response doesn't carry); the server's verdict and
          // explanation win wherever it actually answered.
          const local = gradeSettings(gradedSettings, settings);
          const sres = local.map((l, i) => {
            const server = serverResults[i];
            return server ? { ...l, correct: server.correct, why: server.why ?? l.why } : l;
          });
          sres.forEach((r, i) => {
            const server = serverResults[i];
            if (onDecision) {
              onDecision({
                id: `${node.nodeType}:settings.${r.key}`,
                kind: 'setting',
                label: r.label,
                correct: r.correct,
                firstTry: server ? server.firstTry : firstTry,
              });
            }
          });
          setSettingsResults(sres);
          if (sres.every((r) => r.correct)) {
            setPhase('done');
            if (!ndvVignetteSeen) { ndvVignetteSeen = true; vigTimer.current = setTimeout(() => setShowVignette(true), 2600); }
          } else {
            setPhase('idle');
          }
          return;
        }

        // --- Stage 1: grade the parameters.
        const next = {};
        const why = {};
        // A list field's verdict per ROW the learner built, keyed the same way as
        // `results` (`<fieldKey>#<aspect>`). Only the server can fill this in — the
        // browser has no answer key to compare rows against — so it stays empty on
        // the dev routes, where the list falls back to its three stacked messages.
        const rows = {};
        paramChecks.forEach((c, i) => {
          const f = c.field;
          const server = serverResults[i];
          // `isCorrectValue` returns null when it cannot judge — which is the
          // normal case in the browser, because the payload carries no answers.
          // Three states, not two: treating "could not judge" as "wrong" is what
          // made the same answer read correct on one attempt and wrong on the
          // next, with Iris appearing and having nothing to say.
          const local = c.aspect ? gradeListAspect(f, c.aspect, values[f.key]) : isCorrectValue(f, values[f.key]);
          const ok = server ? server.correct : local;
          const verdict = ok === true ? 'correct' : ok === false ? 'wrong' : 'unverified';
          next[c.key] = verdict;
          why[c.key] = server ? server.why : c.aspect ? undefined : whyForField(f, values[f.key], verdict);
          if (c.aspect && Array.isArray(server?.items)) {
            rows[c.key] = { items: server.items, missing: server.missing ?? 0 };
          }
          // An unverified field is not a decision. Recording it as `correct:
          // false` would put a wrong answer the learner never gave into the
          // grading store.
          if (onDecision && verdict !== 'unverified') {
            onDecision({ id: c.id, kind: 'field', label: c.label, correct: ok, firstTry: server ? server.firstTry : firstTry });
          }
        });
        setResults(next);
        setFieldWhy(why);
        setRowResults(rows);

        const paramsPassed = paramChecks.every((c) => next[c.key] === 'correct');
        // Nothing is said when a check could not complete: `unverified` is not a
        // verdict, and claiming one out loud would be worse than silence.
        const anyUnverified = paramChecks.some((c) => next[c.key] === 'unverified');
        // Nothing spoken here. `speakVerdict` already said it, a beat earlier and on
        // purpose — see the note there. Adding a line here is what made Iris repeat
        // herself on every check.
        if (!paramsPassed) {
          setPhase('idle');
          const firstWrong = paramChecks.find((c) => next[c.key] === 'wrong');
          if (firstWrong) setFeedback({ key: firstWrong.key, verdict: 'wrong', why: why[firstWrong.key] });
          return;
        }

        // Parameters clean. If this node has settings to get right, unlock that
        // tab and move the learner to it rather than letting them close a
        // half-configured node.
        if (gradedSettings.length > 0) {
          setPhase('idle');
          setTab('settings');
          return;
        }

        setPhase('done');
        if (!ndvVignetteSeen) { ndvVignetteSeen = true; vigTimer.current = setTimeout(() => setShowVignette(true), 2600); }
      });
    }, 2000);
  };

  // Settings share the Parameters tab's Iris bubble rather than inventing a
  // second explanation surface — one node, one voice.
  const explainSetting = (key, verdict, why) => {
    setFeedback((f) => (f && f.key === `settings.${key}` ? null : { key: `settings.${key}`, verdict, why }));
  };

  // A rule list's rows are keyed `<fieldKey>#<aspect>`, so they read their
  // explanation from the same banked map under that key.
  const explainAspect = (key, verdict) => {
    // A row-level key carries the row index (`rules#categories@2`) so each row
    // opens its own bubble. The explanation is authored per aspect, not per row,
    // so the lookup drops the suffix.
    const why = fieldWhy?.[key.split('@')[0]];
    setFeedback((f) => (f && f.key === key ? null : { key, verdict, why }));
  };

  const explain = (field, verdict) => {
    // Read the explanation banked at Verify time, not recomputed here — the
    // server doesn't ship `option.why`/`whyCorrect`/`whyWrong` for a fresh
    // local lookup to work against.
    const why = fieldWhy?.[field.key];
    setFeedback((f) => (f && f.key === field.key ? null : { key: field.key, verdict, why }));
  };

  // stream the input in once it's loaded, and the output in on success
  useEffect(() => {
    if (inputLoaded && inputRef.current) gsap.fromTo(inputRef.current, { clipPath: 'inset(0 0 100% 0)', opacity: 0 }, { clipPath: 'inset(0 0 0% 0)', opacity: 1, duration: 0.5, ease: 'power2.out' });
  }, [inputLoaded]);
  useEffect(() => {
    if (phase === 'done' && outputRef.current) gsap.fromTo(outputRef.current, { clipPath: 'inset(0 0 100% 0)', opacity: 0 }, { clipPath: 'inset(0 0 0% 0)', opacity: 1, duration: 0.55, ease: 'power2.out' });
  }, [phase]);

  // Hand back the parameter values too, not just the settings: a Switch's OUTPUTS
  // are derived from the rules the learner built, so the canvas needs them. In
  // n8n the NDV covers the canvas as well, so the new output appears when you
  // close the panel — same beat as the real thing.
  const finishAndClose = () => { if (isComplete && onComplete) onComplete(settings, values); requestClose(); };

  return (
    <div ref={rootRef} onMouseDown={(e) => { if (e.target === e.currentTarget) finishAndClose(); }} style={{ position: 'absolute', inset: 0, zIndex: 45, background: 'rgba(6,20,50,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2vh 1.5vw' }}>
    <div ref={panelRef} style={{ position: 'relative', width: '95%', height: '95%', maxWidth: 1480, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', boxShadow: '0 30px 80px rgba(1,24,69,0.35)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ width: 28, height: 28, background: meta.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <NodeIcon type={node.nodeType} size={16} />
        </span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{node.label}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: showVignette ? 60 : 'auto' }}>
          <button type="button" aria-label="Close setup" onClick={finishAndClose} style={{ background: showVignette ? 'var(--surface-0)' : 'none', border: 'none', cursor: 'pointer', color: showVignette ? 'var(--brand-primary)' : 'var(--fg-2)', display: 'flex', padding: 4 }}><X size={18} /></button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isSubNode ? '1.4fr 1fr' : '1fr 1.25fr 1fr', minHeight: 0 }}>
        {isSubNode ? null : (
        <Pane label="Input">
          {noVerify ? (
            inputData ? (
              <>
                {inputLabel ? <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>from <strong style={{ color: 'var(--fg-2)' }}>{inputLabel}</strong></div> : null}
                <JsonFields data={inputData} />
              </>
            ) : <Empty icon={<Lightning size={22} color="var(--fg-3)" />} title="No input data" text="This node starts the flow." />
          ) : !inputData ? (
            <Empty icon={<Lightning size={22} color="var(--fg-3)" />} title="No input" text="This node starts the flow — it has no upstream data. Verify the setup to see what it produces." />
          ) : !inputLoaded ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', gap: 12, color: 'var(--fg-3)' }}>
              <Lightning size={22} color="var(--fg-3)" />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Test data appears here</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, maxWidth: 210 }}>Load a sample to preview what flows in — or just hit Verify setup and it loads automatically.</div>
              <button type="button" onClick={loadInput} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, background: 'var(--surface-0)', border: '1px solid var(--brand-primary)', color: 'var(--brand-primary)', padding: '7px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <Lightning size={13} weight="fill" /> Load test data
              </button>
            </div>
          ) : (
            <div ref={inputRef}>
              {inputLabel ? <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 6 }}>from <strong style={{ color: 'var(--fg-2)' }}>{inputLabel}</strong></div> : null}
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>Drag a field onto its parameter, or pick it in the dropdown.</div>
              <JsonFields data={inputData} draggable />
            </div>
          )}
        </Pane>
        )}

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', flex: 'none' }}>
            <Tab active={tab === 'params'} onClick={() => setTab('params')}>
              Parameters
              {fields.length > 0 && paramsOk ? (
                <CheckCircle size={12} weight="fill" color="var(--status-success)" style={{ marginLeft: 5, verticalAlign: 'middle' }} />
              ) : null}
            </Tab>
            {settingsUnlocked ? (
              <Tab active={tab === 'settings'} onClick={() => setTab('settings')}>
                Settings
                {hasSettings && !settingsOk ? (
                  <span style={{ marginLeft: 6, display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-primary)', verticalAlign: 'middle' }} />
                ) : null}
                {hasSettings && settingsOk ? (
                  <CheckCircle size={12} weight="fill" color="var(--status-success)" style={{ marginLeft: 5, verticalAlign: 'middle' }} />
                ) : null}
              </Tab>
            ) : (
              <span
                title="Get the parameters right first"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '11px 0', fontSize: 12.5, fontWeight: 600, color: 'var(--fg-3)', opacity: 0.55, cursor: 'not-allowed' }}
              >
                <Lock size={11} weight="fill" /> Settings
              </span>
            )}
            <div style={{ marginLeft: 'auto', margin: '8px 0 8px auto' }}>
              {noVerify ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-success)', fontSize: 12.5, fontWeight: 700 }}>
                  <CheckCircle size={16} weight="fill" /> Nothing to set up — close to finish
                </span>
              ) : stage === 'done' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-success)', fontSize: 12.5, fontWeight: 700 }}>
                  <CheckCircle size={16} weight="fill" /> Setup complete
                </span>
              ) : running ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-primary)', fontSize: 12.5, fontWeight: 700 }}>
                  <CircleNotch size={15} weight="bold" className="spin" /> Running…
                </span>
              ) : (
                // A disabled button with no reason is a dead end, so name the
                // cause — in n8n's own words for the same state.
                <button type="button" disabled={!allChosen} title={allChosen ? undefined : 'Complete required fields first'} onClick={verify} style={ctaStyle(allChosen ? 'var(--brand-primary)' : 'var(--n-200)', !allChosen)}>
                  <Sparkle size={14} weight="fill" />
                  {stage === 'settings' ? 'Verify settings' : 'Verify setup'}
                </button>
              )}
            </div>
          </div>
          {running ? <RunningStrip /> : null}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 32px' }}>
            {tab === 'settings' ? (
              <SettingsForm
                values={settings}
                graded={gradedSettings}
                results={settingsResults}
                onChange={setSetting}
                onExplain={explainSetting}
                feedback={feedback}
                /* A sub-node carries only Notes in real n8n — see nodeSettings.js */
                subNode={isSubNode}
              />
            ) : (
              <FieldForm
                nodeType={node.nodeType}
                /* Field names from the upstream node, so an expression
                   parameter can be filled by picking as well as dragging. */
                inputKeys={Object.keys(inputData ?? {})}
                setup={resolvedSetup}
                fields={fields}
                values={values}
                results={results}
                rowResults={rowResults}
                feedback={feedback}
                optionFor={optionFor}
                onChange={setValue}
                onDrop={dropField}
                onExplain={explain}
                onExplainAspect={explainAspect}
                allCorrect={allCorrect}
              />
            )}
          </div>
        </div>

        <Pane label="Output">
          {running ? (
            <RunOverlay label="Producing output…" inline />
          ) : phase === 'done' && node.output ? (
            <div ref={outputRef}><JsonView data={node.output} /></div>
          ) : noVerify && node.output ? (
            <JsonView data={node.output} />
          ) : results && !allCorrect ? (
            <Empty icon={<XCircle size={22} color="var(--status-danger)" />} title="No output" text="A field isn’t right yet — fix the highlighted one and Verify setup again." />
          ) : isSubNode ? (
            // n8n's own wording for exactly this state. A sub-node produces
            // nothing on its own — it is supplied to the node above it and only
            // does anything when THAT node runs. "Verify the setup to run this
            // node" was quietly wrong here: this node never runs by itself.
            <Empty icon={<Lightning size={22} color="var(--fg-3)" />} title="No output yet" text="Output will appear here once the parent node is run." />
          ) : (
            <Empty icon={<Lightning size={22} color="var(--fg-3)" />} title="No output yet" text="Verify the setup to run this node and see what it produces." />
          )}
        </Pane>
      </div>

      {showVignette && phase === 'done' ? (
        <CloseVignette onDismiss={() => setShowVignette(false)} />
      ) : null}
    </div>
    </div>
  );
}

// Small spinner used in the output panel while a node "runs" (right side loads).
function RunOverlay({ label, inline }) {
  return (
    <div style={{ position: inline ? 'relative' : 'absolute', inset: inline ? undefined : 0, height: inline ? '100%' : undefined, background: inline ? 'transparent' : 'rgba(255,255,255,0.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 3, pointerEvents: 'none' }}>
      <CircleNotch size={26} weight="bold" color="var(--brand-primary)" className="spin" />
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>{label}</div>
    </div>
  );
}

// Thin non-blocking strip across the top of the parameters panel while running —
// the fields stay visible underneath; an indeterminate bar sweeps left-to-right.
function RunningStrip() {
  return (
    <div style={{ position: 'relative', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 32, background: 'var(--brand-blue-50, rgba(0,85,255,0.06))', borderBottom: '1px solid var(--brand-blue-100, rgba(0,85,255,0.18))', overflow: 'hidden' }}>
      <style>{`@keyframes ndvsweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(320%); } }`}</style>
      <div style={{ position: 'absolute', top: 0, left: 0, height: 2, width: '30%', background: 'var(--brand-primary)', animation: 'ndvsweep 1.1s ease-in-out infinite' }} />
      <CircleNotch size={14} weight="bold" color="var(--brand-primary)" className="spin" />
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)' }}>Running this step — verifying the setup…</span>
    </div>
  );
}

// First-run guided cue, shown a couple of seconds AFTER the output lands: dim the
// panel and let Iris confirm it's safe to close. No stroke around the ✕ — just
// the message pointing to it.
function CloseVignette({ onDismiss }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }); }, []);
  return (
    <div ref={ref} onClick={onDismiss} style={{ position: 'absolute', inset: 0, zIndex: 55, background: 'rgba(6,20,50,0.5)', cursor: 'pointer' }}>
      <div style={{ position: 'absolute', top: 58, right: 16, width: 300, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 52, height: 52, flex: 'none' }}>
          <MascotPlayer clip="celebrate" once={false} onceDone={() => {}} />
        </div>
        <div style={{ position: 'relative', flex: 1, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', borderTop: '3px solid var(--status-success)', boxShadow: '0 12px 30px rgba(1,24,69,0.22)', padding: '11px 13px' }}>
          <span style={{ position: 'absolute', top: -9, right: 14, width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '8px solid var(--status-success)' }} />
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-success)', marginBottom: 3 }}>This step is verified</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-1)' }}>Its output looks right — you can safely close this with the ✕ up here and keep building.</div>
        </div>
      </div>
    </div>
  );
}

function ctaStyle(bg, disabled) {
  return { display: 'flex', alignItems: 'center', gap: 6, background: bg, color: disabled ? 'var(--fg-3)' : '#fff', border: 'none', padding: '7px 13px', fontSize: 12.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' };
}

// `nodeType` is only used to seed the option shuffle — FieldForm has no other
// reason to know which node it is rendering, so it is passed rather than
// reaching for the parent's `node`, which is not in scope here.
/**
 * Has this field been answered at all? Only ever used to choose copy — never to
 * grade, which is the server's job.
 *
 * `false` and `0` are real answers, so this cannot be a falsy check. The list
 * kinds (Switch rules, Edit Fields assignments) arrive as arrays and a resource
 * locator as `{ __rl, mode, value }`, where only `value` is the answer.
 */
function isEmptyValue(v) {
  if (v === undefined || v === null || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && v.__rl) return isEmptyValue(resourceValue(v));
  return false;
}

function FieldForm({ nodeType, inputKeys, setup, fields, values, results, rowResults, feedback, optionFor, onChange, onDrop, onExplain, onExplainAspect, allCorrect }) {
  const locked = setup?.locked || [];
  const [hoveredKey, setHoveredKey] = useState(null);
  const [dropKey, setDropKey] = useState(null);
  // No client-side shuffle. Option order arrives already balanced from
  // `balanceProblemOptions`, which runs server-side while the answer key still
  // exists — the browser cannot see `correct`, so it could only re-randomise,
  // and independent per-field randomisation is what allowed a session to stack
  // the answers on top. Render what the server sent.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {setup?.credential ? (
        <div>
          <Label>Credential to connect with</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--status-success-border)', background: 'var(--status-success-bg)', padding: '8px 10px', fontSize: 12.5, color: 'var(--status-success)', fontWeight: 600 }}>
            <LockSimple size={13} weight="fill" /> {setup.credential} — Connected
          </div>
        </div>
      ) : null}

      {/* fixed context fields — shown, but disabled (not part of the task) */}
      {locked.map((lf, i) => (
        <div key={`lf-${i}`} style={{ opacity: 0.6 }}>
          <Label>{lf.label} <Lock size={10} weight="fill" style={{ verticalAlign: 'middle', marginLeft: 2 }} /></Label>
          {lf.kind === 'textarea' ? (
            <textarea value={lf.value} disabled rows={2} style={disabledInput} />
          ) : (
            <input value={lf.value} disabled style={disabledInput} />
          )}
        </div>
      ))}

      {/* the field(s) the learner must set */}
      {fields.map((f) => {
        if (f.kind === 'notice') {
          return (
            <div key={f.key} role="note" style={{ borderLeft: '3px solid var(--brand-primary)', background: 'var(--brand-blue-50, rgba(0,85,255,0.05))', padding: '9px 11px', fontSize: 11.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
              {f.label}
            </div>
          );
        }
        const value = values[f.key];
        const isRules = isListKind(f.kind);
        const isCollection = f.kind === 'collection';
        const isFixedCollection = f.kind === 'fixedCollection';
        const graded = f.graded !== false;
        // A rule list has three verdicts, not one. The field's border rolls them
        // up — any wrong is wrong, any unverified is unverified — and the three
        // are then listed individually underneath, because "your Switch is wrong"
        // is useless feedback next to "the branch names are right, what they test
        // is not".
        const aspectVerdicts = isRules ? aspectsFor(f.kind).map((a) => results?.[`${f.key}#${a}`]) : [];
        const verdict = !graded ? undefined : isRules
          ? aspectVerdicts.some((v) => v === undefined)
            ? undefined
            : aspectVerdicts.includes('wrong')
              ? 'wrong'
              : aspectVerdicts.includes('unverified')
                ? 'unverified'
                : 'correct'
          : results?.[f.key];
        const border = !graded ? 'var(--border-strong)' : verdict === 'correct' ? 'var(--status-success)' : verdict === 'wrong' ? 'var(--status-danger)' : 'var(--brand-primary)';
        const bg = !graded ? 'var(--surface-1)' : verdict === 'correct' ? 'var(--status-success-bg)' : verdict === 'wrong' ? 'var(--status-danger-bg)' : 'var(--brand-blue-50, rgba(0,85,255,0.05))';
        const showBubble = feedback?.key === f.key;
        // This list's per-row verdicts, by aspect. Only the server can produce
        // them, so this is null on the dev routes and every aspect falls back to
        // its list-level line below.
        const rowsFor = isRules && rowResults
          ? Object.fromEntries(
              aspectsFor(f.kind)
                .map((aspect) => [aspect, rowResults[`${f.key}#${aspect}`]])
                .filter(([, r]) => Array.isArray(r?.items))
            )
          : null;
        // An aspect stays at LIST level when it has no row to blame: `count` never
        // has one, and a failure whose rows all pass means an entry is absent
        // rather than wrong. Everything else has moved onto its row.
        const listLevelAspects = aspectsFor(f.kind).filter((aspect) => {
          const rows = rowsFor?.[aspect];
          if (!rows) return true;
          return !rows.items.some((ok) => ok === false);
        });
        return (
          <div key={f.key} onMouseEnter={() => setHoveredKey(f.key)} onMouseLeave={() => setHoveredKey((k) => (k === f.key ? null : k))}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <Label style={{ margin: 0 }}>{f.label}{f.required ? ' *' : ''}</Label>
              {/* Always visible, not hover-only: this badge is the signal for
                  WHICH field still needs the learner, and a signal you have to
                  hover to discover is not a signal.
                  It has to name the state it is actually in. A resumed node opens
                  on the values the learner already chose, and telling them to set
                  a field they can see is filled in reads as a bug — what is left
                  to do there is the verify. */}
              {graded && !verdict ? (
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--brand-primary)', border: '1px solid var(--brand-primary)', padding: '1px 6px' }}>
                  {isEmptyValue(values[f.key]) ? 'Set me up' : 'Verify me'}
                </span>
              ) : null}
            </div>
            {f.subtitle ? <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 7, lineHeight: 1.45 }}>{f.subtitle}</div> : null}
            <div
              className={graded && !verdict && dropKey !== f.key ? 'pulse-field' : undefined}
              onDragOver={(e) => { e.preventDefault(); if (dropKey !== f.key) setDropKey(f.key); }}
              onDragLeave={() => setDropKey((k) => (k === f.key ? null : k))}
              onDrop={(e) => { e.preventDefault(); const key = e.dataTransfer.getData('application/x-ndv-field'); setDropKey(null); if (key && onDrop) onDrop(f, key); }}
              style={{ position: 'relative', outline: dropKey === f.key ? '2px dashed var(--brand-primary)' : 'none', outlineOffset: 2 }}
            >
              {isRules ? (
                <RuleListControl
                  field={f}
                  value={value}
                  border={border}
                  onChange={onChange}
                  /* Per-row verdicts, so each branch carries its own message. */
                  rowVerdicts={rowsFor}
                  feedback={feedback}
                  onExplainAspect={onExplainAspect}
                />
              ) : isCollection ? (
                <CollectionControl field={f} value={value} border={border} bg={bg} onChange={onChange} inputKeys={inputKeys} rootValues={values} />
              ) : isFixedCollection ? (
                <FixedCollectionControl field={f} value={value} border={border} bg={bg} onChange={onChange} inputKeys={inputKeys} />
              ) : (
                <FieldControl
                  field={f}
                  value={value}
                  border={border}
                  bg={bg}
                  onChange={onChange}
                  /* Server-balanced order; see the note by `orders` above. */
                  shuffledOptions={f.options ?? []}
                  inputKeys={inputKeys}
                />
              )}
            </div>
            {f.hint || f.description ? (
              <div style={{ fontSize: 10.8, color: 'var(--fg-3)', marginTop: 6, lineHeight: 1.45 }}>{f.hint || f.description}</div>
            ) : null}

            {/* What is left of a rule list's three verdicts once the ones with a
                row to blame have moved onto that row: `count`, and any aspect
                that failed because an entry is MISSING rather than wrong. */}
            {graded && isRules && results ? (
              <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {listLevelAspects.map((aspect) => {
                  const v = results[`${f.key}#${aspect}`];
                  if (!v) return null;
                  const key = `${f.key}#${aspect}`;
                  return (
                    <div key={aspect}>
                      {v === 'unverified' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--fg-3)' }}>
                          <Warning size={14} weight="fill" /> {aspectLabel(f.kind, aspect)} — could not check
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onExplainAspect?.(key, v)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2, color: v === 'correct' ? 'var(--status-success)' : 'var(--status-danger)' }}
                        >
                          {v === 'correct' ? <CheckCircle size={14} weight="fill" /> : <XCircle size={14} weight="fill" />}
                          {aspectLabel(f.kind, aspect)} — {v === 'correct' ? 'right' : 'not right'}
                        </button>
                      )}
                      {feedback?.key === key && feedback.why ? <IrisBubble tone={v}>{feedback.why}</IrisBubble> : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
            {/* Three states. "Could not check" says so plainly instead of
                claiming the answer was wrong — and offers no "ask Iris why",
                because there is nothing to explain and an empty bubble reads as
                a broken app.
                A list has no rolled-up line: it would be a bare "Not right" under
                rows that have already said which branch is wrong and why, and it
                carries no explanation of its own (the `why` is authored per
                aspect). Its aspects and rows are the whole verdict. */}
            {isRules ? null : verdict === 'unverified' ? (
              <div style={{ marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--fg-3)' }}>
                <Warning size={15} weight="fill" />
                Could not check this — your answer was not marked wrong
              </div>
            ) : verdict ? (
              <button type="button" onClick={() => onExplain(f, verdict)} style={{ marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2, color: verdict === 'correct' ? 'var(--status-success)' : 'var(--status-danger)' }}>
                {verdict === 'correct' ? <CheckCircle size={15} weight="fill" /> : <XCircle size={15} weight="fill" />}
                {verdict === 'correct' ? 'Correct — ask Iris why' : 'Not right — ask Iris why'}
              </button>
            ) : null}
            {showBubble ? <IrisBubble tone={feedback.verdict}>{feedback.why}</IrisBubble> : null}
          </div>
        );
      })}

      {!results && fields.length > 0 ? (
        <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>
          {fields.every((f) => !isEmptyValue(values[f.key]))
            ? <>These are the answers you gave. Hit <strong style={{ color: 'var(--fg-2)' }}>Verify setup</strong> to check them.</>
            : <>Set the highlighted field, then hit <strong style={{ color: 'var(--fg-2)' }}>Verify setup</strong>.</>}
        </div>
      ) : null}
    </div>
  );
}

// Iris travels in from the left with a square speech bubble (tail toward Iris).
const disabledInput = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', padding: '8px 10px', fontSize: 12.5, fontFamily: 'var(--font-body)', color: 'var(--fg-3)', resize: 'none', cursor: 'not-allowed' };

// Longhands only, deliberately. This button carries an underline that changes with
// `active`, and mixing the `border` shorthand with `borderBottom` made React warn
// "Updating a style property during rerender (borderBottom) when a conflicting
// property is set (border)" on every tab switch — the browser's resolution order
// between the two is not guaranteed, so one of them was going to lose.
function Tab({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{ padding: '11px 0', fontSize: 12.5, fontWeight: 600, color: active ? 'var(--fg-1)' : 'var(--fg-3)', borderTopWidth: 0, borderRightWidth: 0, borderLeftWidth: 0, borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: active ? 'var(--brand-primary)' : 'transparent', marginBottom: -1, background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
      {children}
    </button>
  );
}

function Pane({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-3)', fontWeight: 700, padding: '12px 14px' }}>{label}</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 14px' }}>{children}</div>
    </div>
  );
}

function Empty({ icon, title, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', gap: 6, color: 'var(--fg-3)' }}>
      {icon}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>{title}</div>
      <div style={{ fontSize: 12, lineHeight: 1.5, maxWidth: 200 }}>{text}</div>
    </div>
  );
}

function JsonFields({ data, draggable }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Object.entries(data).map(([k, v]) => (
        <div
          key={k}
          draggable={draggable || undefined}
          onDragStart={draggable ? (e) => { e.dataTransfer.setData('application/x-ndv-field', k); e.dataTransfer.effectAllowed = 'copy'; } : undefined}
          title={draggable ? 'Drag onto its parameter' : undefined}
          style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '7px 9px', border: `1px solid ${draggable ? 'var(--brand-blue-100, rgba(0,85,255,0.25))' : 'var(--border-subtle)'}`, background: 'var(--surface-0)', cursor: draggable ? 'grab' : 'default' }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono, monospace)' }}>{k}</span>
          <span style={{ fontSize: 11.5, color: 'var(--fg-3)', fontFamily: 'var(--font-mono, monospace)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

function JsonView({ data }) {
  return <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.5, fontFamily: 'var(--font-mono, monospace)', color: 'var(--fg-1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(data, null, 2)}</pre>;
}

function Label({ children, style }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg-1)', marginBottom: 5, ...style }}>{children}</label>;
}
