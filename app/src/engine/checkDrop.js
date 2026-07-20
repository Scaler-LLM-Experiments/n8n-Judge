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
      title: 'Not yet',
      mascotClip: 'shake-no',
      message: `We're still on "${step.label}". Come back to "${paletteNode.label}" a little later.`,
    };
  }

  if (paletteNode.isDistractor) {
    return {
      allowed: false,
      title: 'Think again',
      mascotClip: 'confused',
      message: `Is "${paletteNode.label}" really the right node for this step? Take another look at the palette.`,
    };
  }

  return {
    allowed: true,
    title: 'Nice',
    mascotClip: 'correct',
    message: `"${paletteNode.label}" is the right pick.`,
  };
}

function requiredTypesForStep(problem, step) {
  return problem.nodePalette
    .filter((n) => !n.isDistractor && step.categories.includes(n.category))
    .map((n) => n.type);
}
