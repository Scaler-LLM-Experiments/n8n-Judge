function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
  }
  return value;
}

const atPath = (value, path) => String(path ?? '').split('.').filter(Boolean)
  .reduce((current, key) => current?.[key], value);

/** Seed a fresh simulated node with the same parameter defaults as n8n. */
export function defaultsForParams(params = []) {
  return Object.fromEntries(
    params.filter((field) => Object.hasOwn(field, 'value')).map((field) => [field.key, clone(field.value)])
  );
}

/**
 * The native catalog parameters a node may show ALONGSIDE its authored ones.
 *
 * The invariant is narrow and absolute: **the panel must never show two controls for the
 * same parameter.** Everything else about the native surface is context worth having,
 * because it is what the node really looks like in n8n.
 *
 * ## The bugs this replaces
 *
 * The rule used to be all-or-nothing: show every native param if EVERY authored key was
 * also a native key, otherwise show none.
 *
 * A case authoring one field whose key happened to be native got all 44 of HTTP Request's
 * native params, including a free-text `url` box beside the graded `url` select. A learner
 * typed a URL into the native box, which no select option can ever match, so the case could
 * not be completed and trying a different URL never helped.
 *
 * The other direction was worse to author around: a case wanting the native surface
 * suppressed had to deliberately misname a key (`httpMethod` instead of `method`) purely to
 * fail the all-or-nothing test, which reads as a typo and cost a reviewer's round.
 *
 * ## What counts as a collision
 *
 * Three things claim a parameter, and all three have to, because each has produced a real
 * duplicate on screen:
 *
 * 1. **An authored field's `key`.** The graded control.
 * 2. **A field's `nativeKey`**, when it is authored under a different name. `httpMethod`
 *    does not collide with `method`, and without this the native Method control renders at
 *    its GET default, which on one case is also the answer.
 * 3. **A `locked` row.** These are shown-not-graded context, matched by label against the
 *    native param's key or label. Without this a panel showed "Method 🔒 GET" as a locked
 *    row and a live native Method select directly under it, saying the same thing twice
 *    with one of them editable. Same defect the low-stock aggregate node hit, where a
 *    locked "Put Output in Field" row sat inches from the live control of that name at a
 *    different value.
 */
export function compatibleCatalogParams(params = [], authoredFields = [], lockedRows = []) {
  if (!authoredFields.length && !lockedRows.length) return params;
  const claimed = new Set(
    authoredFields.flatMap((f) => [f?.key, f?.nativeKey]).filter(Boolean)
  );
  // A locked row carries a human label rather than a key, so match on either.
  const lockedLabels = new Set(
    lockedRows.map((l) => String(l?.label ?? '').trim().toLowerCase()).filter(Boolean)
  );
  return params.filter((p) => {
    if (claimed.has(p.key)) return false;
    if (lockedLabels.has(String(p.key ?? '').toLowerCase())) return false;
    if (lockedLabels.has(String(p.label ?? '').trim().toLowerCase())) return false;
    return true;
  });
}

export function resolveNodePorts(entry = {}, values = {}) {
  const effectiveValues = { ...defaultsForParams(entry.params), ...values };
  const matches = (actual, allowed) => {
    const comparable = actual && typeof actual === 'object' && '__rl' in actual ? actual.value : actual;
    if (Array.isArray(allowed)) {
      const values = Array.isArray(comparable) ? comparable : [comparable];
      return values.some((value) => allowed.includes(value));
    }
    if (allowed?.not !== undefined) return comparable !== allowed.not;
    if (allowed?.notIn) return !allowed.notIn.includes(comparable);
    if (allowed?.includes !== undefined) return String(comparable ?? '').includes(allowed.includes);
    return comparable === allowed;
  };
  const variant = entry.portVariants?.find(({ showWhen = {} }) =>
    Object.entries(showWhen).every(([key, allowed]) => matches(atPath(effectiveValues, key), allowed))
  );

  let inputs = variant?.inputs ?? entry.inputs;
  const dynamic = entry.dynamicInputs;
  if (dynamic?.enabled) {
    const mode = effectiveValues[dynamic.modeParameter ?? 'mode'];
    const variant = effectiveValues[dynamic.variantParameter ?? 'combineBy'];
    const countParameters = dynamic.countParameterByMode ?? dynamic.normalizedCountParameters;
    const countKey = countParameters?.[mode] ?? countParameters?.[variant] ?? dynamic.countParameter;
    const requested = dynamic.fixedTwoInputModes?.includes(mode) || dynamic.fixedTwoInputModes?.includes(variant)
      ? 2
      : Number(effectiveValues[countKey] ?? dynamic.defaultCount);
    const count = Math.min(dynamic.max, Math.max(dynamic.min, requested));
    inputs = Array.from({ length: count }, (_, index) => ({
      type: dynamic.type ?? 'main',
      label: dynamic.labels?.[index] ?? `Input ${index + 1}`,
    }));
  }
  const dynamicInput = entry.dynamicInputMetadata;
  if (dynamicInput?.enabled && dynamicInput.strategy === 'guardrail-presence') {
    const collection = entry.params?.find(({ key }) => key === dynamicInput.guardrailCollectionParameter);
    const selected = effectiveValues[dynamicInput.guardrailCollectionParameter] ?? {};
    const needsModel = collection?.fields?.some(({ key, sourceN8nKey }) =>
      dynamicInput.requiredWhenAnyGuardrailPresent?.includes(sourceN8nKey) && Object.hasOwn(selected, key)
    );
    inputs = needsModel
      ? [...(dynamicInput.baseInputs ?? inputs ?? []), dynamicInput.appendInput]
      : dynamicInput.baseInputs ?? inputs;
  }
  if (dynamicInput?.enabled && dynamicInput.strategy === 'configured-connection-rows') {
    const rows = atPath(effectiveValues, dynamicInput.parameterPath) ?? [];
    inputs = rows.map((row) => {
      const type = row[dynamicInput.typeParameter];
      const maxConnections = row[dynamicInput.maxConnectionsParameter];
      const label = type === 'main' ? '' : dynamicInput.displayNameByType?.[type] ?? '';
      return {
        type,
        label,
        displayName: label,
        required: Boolean(row[dynamicInput.requiredParameter]),
        ...(maxConnections === dynamicInput.unlimitedValue ? {} : { maxConnections }),
      };
    });
  }

  let outputs = variant?.outputs ?? entry.outputs;
  const dynamicOutputs = entry.dynamicOutputs;
  if (dynamicOutputs?.enabled) {
    if (dynamicOutputs.strategy === 'fixed-collection-labels') {
      const rows = atPath(effectiveValues, dynamicOutputs.collectionPath) ?? [];
      outputs = rows.map((row, index) => ({
        type: dynamicOutputs.outputType ?? 'main',
        label: row?.[dynamicOutputs.labelParameter] ?? '',
        name: String(index),
        index,
      }));
      if (atPath(effectiveValues, dynamicOutputs.fallbackParameter) === dynamicOutputs.fallbackValue) {
        const index = outputs.length;
        outputs.push({
          type: dynamicOutputs.outputType ?? 'main',
          label: dynamicOutputs.fallbackLabel,
          name: String(index),
          index,
        });
      }
    } else if (dynamicOutputs.strategy === 'comma-separated-labels') {
      const labels = String(
        atPath(effectiveValues, dynamicOutputs.parameterPath) ?? dynamicOutputs.defaultValue ?? ''
      ).split(dynamicOutputs.delimiter ?? ',').map((label) => label.trim());
      outputs = labels.map((label, index) => ({
        type: dynamicOutputs.outputType ?? 'main',
        label,
        name: String(index),
        index,
      }));
    } else {
      const mode = effectiveValues[dynamicOutputs.modeParameter ?? 'mode'];
      const spec = dynamicOutputs.modes?.[mode];
      if (spec?.countParameter) {
        const count = Math.max(0, Number(effectiveValues[spec.countParameter] ?? spec.defaultCount));
        outputs = Array.from({ length: count }, (_, index) => ({ type: 'main', label: String(index), name: String(index), index }));
      } else if (spec?.rulesPath) {
        const rules = atPath(effectiveValues, spec.rulesPath) ?? [];
        outputs = rules.map((rule, index) => ({
          type: 'main',
          label: rule[spec.labelParameter] || String(index),
          name: String(index),
          index,
        }));
        const fallback = atPath(effectiveValues, spec.fallbackPath);
        if (fallback === spec.extraFallbackValue) {
          const index = outputs.length;
          outputs.push({
            type: 'main',
            label: atPath(effectiveValues, spec.fallbackLabelPath) || spec.defaultFallbackLabel,
            name: String(index),
            index,
          });
        }
      }
    }
  }
  const selectedOutputs = entry.dynamicOutputMetadata;
  if (selectedOutputs?.enabled && selectedOutputs.strategy === 'configured-connection-rows') {
    const rows = atPath(effectiveValues, selectedOutputs.parameterPath) ?? [];
    outputs = rows.map((row, index) => {
      const type = row[selectedOutputs.typeParameter];
      const label = type === 'main' ? '' : selectedOutputs.displayNameByType?.[type] ?? '';
      return { type, label, displayName: label, name: String(index), index };
    });
  }
  if (selectedOutputs?.settingParameter && selectedOutputs?.methodParameter) {
    const multiple = Boolean(effectiveValues[selectedOutputs.settingParameter]);
    const parameter = multiple
      ? selectedOutputs.multipleMethodParameter ?? selectedOutputs.methodParameter
      : selectedOutputs.singleMethodParameter ?? selectedOutputs.methodParameter;
    const selected = effectiveValues[parameter];
    const names = multiple ? (Array.isArray(selected) ? selected : []) : [selected];
    outputs = names.filter(Boolean).map((name, index) => ({ type: 'main', label: name, name, index }));
  }

  return {
    inputs,
    outputs,
  };
}

export function branchesForPorts(entry = {}, ports = {}, authoredBranches = []) {
  const outputs = (ports.outputs ?? []).filter((port) =>
    (typeof port === 'string' ? port : port.type) === 'main');
  if (!entry.router && outputs.length < 2) return null;
  return outputs.map((port, index) => ({
    id: authoredBranches[index]?.id ?? port.name ?? String(index),
    label: port.label ?? port.name ?? authoredBranches[index]?.label ?? String(index),
  }));
}

/**
 * The catalog owns the real editor surface; a case owns only grading and voice.
 * Overlay authored fields by key, and leave every other real field interactive
 * but ungraded. Older teaching placeholders pass no catalog fields and retain
 * their existing case-authored screens unchanged.
 */
export function mergeCatalogFields(params = [], authoredFields = []) {
  const authored = new Map(authoredFields.map((field) => [field.key, field]));
  const merged = params.filter((field) => field.kind !== 'hidden').map((field) => {
    const overlay = authored.get(field.key);
    if (!overlay) return { ...field, graded: false };
    authored.delete(field.key);
    return { ...field, ...overlay, graded: true };
  });
  const leftover = [...authored.values()].map((field) => ({ ...field, graded: true }));

  // GRADED FIRST, then the node's real shape as context.
  //
  // Authored fields with no native counterpart used to be concatenated on the end, so on
  // HTTP Request the single control a learner has to answer sat below forty-one native
  // ones: Import cURL, SSL Certificates, Send Body, Options. The panel opened on a wall of
  // things that are not the question, which is a large part of "I could not tell what it
  // wanted". What you must answer belongs at the top; what the node looks like in n8n is
  // worth seeing underneath it.
  //
  // Graded order follows the author's, since that is the order the case reasons in.
  const gradedInAuthoredOrder = authoredFields
    .map((f) => merged.find((m) => m.key === f.key) ?? leftover.find((l) => l.key === f.key))
    .filter(Boolean);
  const seen = new Set(gradedInAuthoredOrder.map((f) => f.key));
  return [
    ...gradedInAuthoredOrder,
    ...leftover.filter((f) => !seen.has(f.key)),
    ...merged.filter((f) => !f.graded),
  ];
}
