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

export function resolveNodePorts(entry = {}, values = {}) {
  const effectiveValues = { ...defaultsForParams(entry.params), ...values };
  const variant = entry.portVariants?.find(({ showWhen = {} }) =>
    Object.entries(showWhen).every(([key, allowed]) =>
      (Array.isArray(allowed) ? allowed : [allowed]).includes(effectiveValues[key])
    )
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

  let outputs = variant?.outputs ?? entry.outputs;
  const dynamicOutputs = entry.dynamicOutputs;
  if (dynamicOutputs?.enabled) {
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
  const selectedOutputs = entry.dynamicOutputMetadata;
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
  return merged.concat([...authored.values()].map((field) => ({ ...field, graded: true })));
}
