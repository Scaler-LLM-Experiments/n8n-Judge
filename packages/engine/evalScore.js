export function scoreEval(answers, evalQuestions) {
  const results = evalQuestions.map((q) => {
    const selectedIndex = answers[q.id];
    const correct = selectedIndex === q.correctIndex;
    return { id: q.id, prompt: q.prompt, selectedIndex, correct };
  });
  const correctCount = results.filter((r) => r.correct).length;
  return { results, correctCount, total: evalQuestions.length };
}
