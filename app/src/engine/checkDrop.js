export function currentBuildStepIndex(studentGraph, problem) {
  const placedTypes = new Set(studentGraph.nodes.map((n) => n.type));
  let index = 0;
  for (let i = 0; i < problem.buildSteps.length - 1; i++) {
    const requiredTypes = requiredTypesForStep(problem, problem.buildSteps[i]);
    const satisfied = requiredTypes.every((t) => placedTypes.has(t));
    if (satisfied) index = i + 1;
    else break;
  }
  return index;
}

export function checkDrop(studentGraph, paletteNode, problem) {
  const stepIndex = currentBuildStepIndex(studentGraph, problem);
  const step = problem.buildSteps[stepIndex];

  if (!step.categories.includes(paletteNode.category)) {
    return {
      allowed: false,
      mascotClip: 'shake-no',
      message: `Not yet — right now we're on "${step.label}". Come back to this one later.`,
    };
  }

  if (paletteNode.isDistractor) {
    return {
      allowed: false,
      mascotClip: 'confused',
      message: `Hmm — is "${paletteNode.label}" really the right node here? Think again.`,
    };
  }

  return {
    allowed: true,
    mascotClip: 'correct',
    message: 'Nice — that\'s the right pick.',
  };
}

function requiredTypesForStep(problem, step) {
  return problem.nodePalette
    .filter((n) => !n.isDistractor && step.categories.includes(n.category))
    .map((n) => n.type);
}
