export const calculateExamResult = (activeQuestions, activeAnswers) => {
  let totalFehlerpunkte = 0;
  let countFivePointFails = 0;
  const details = [];

  activeQuestions.forEach(q => {
    const selected = activeAnswers[q.id] || [];
    const correct = q.options.filter(opt => opt.isCorrect).map(opt => opt.id);

    const isCorrect =
      selected.length === correct.length &&
      selected.every(val => correct.includes(val));

    const points = q.points;
    const fehler = isCorrect ? 0 : points;
    totalFehlerpunkte += fehler;

    if (!isCorrect && points === 5) {
      countFivePointFails++;
    }

    details.push({
      question: q,
      selected,
      correct,
      isCorrect,
      fehler
    });
  });

  // Failing conditions:
  // 1. Total Fehlerpunkte > 10
  // 2. Or if total Fehlerpunkte === 10 and they failed two 5-point questions
  const failedDueToTwoFivePointQuestions = countFivePointFails >= 2;
  const passed = totalFehlerpunkte <= 10 && !failedDueToTwoFivePointQuestions;

  return {
    fehlerpunkte: totalFehlerpunkte,
    passed,
    failedDueToTwoFivePointQuestions,
    details
  };
};

export const generateExamQuestions = (allQuestions) => {
  const getQuestionTheme = (q) => {
    return (typeof q.id === 'string' && q.id.startsWith('2.')) ? 2 : 1;
  };

  const pools = { 1: [], 2: [] };
  allQuestions.forEach(q => {
    const theme = getQuestionTheme(q);
    pools[theme].push(q);
  });

  const targets = {
    1: 20, // 20 Grundstoff
    2: 10  // 10 Zusatzstoff
  };

  let selected = [];
  Object.keys(targets).forEach(themeId => {
    const pool = pools[themeId];
    const targetCount = targets[themeId];
    if (pool && pool.length > 0) {
      // Trộn ngẫu nhiên câu hỏi gốc của nhóm đó
      const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
      // Lấy đúng số lượng, không bị trùng lặp
      const selectedForTheme = shuffledPool.slice(0, targetCount);
      selectedForTheme.forEach((baseQuestion, idx) => {
        selected.push({
          ...baseQuestion,
          id: `${baseQuestion.id}_exam_${themeId}_${idx}` // ID duy nhất trong kỳ thi
        });
      });
    }
  });

  // Trộn ngẫu nhiên danh sách cuối cùng của kỳ thi
  return selected.sort(() => 0.5 - Math.random());
};
