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

  const getMediaType = (q) => {
    if (q.video) return 'video';
    if (q.image || q.imageType) return 'image';
    return 'text';
  };

  // Classify questions by Theme (1: Grundstoff, 2: Zusatzstoff) and Media type (video, image, text)
  const pools = {
    1: { video: [], image: [], text: [] },
    2: { video: [], image: [], text: [] }
  };

  allQuestions.forEach(q => {
    const theme = getQuestionTheme(q);
    const media = getMediaType(q);
    if (pools[theme]) {
      pools[theme][media].push(q);
    }
  });

  // Distribution targets per official German Class B Driving Exam standards:
  // Total 30 questions:
  // - Grundstoff (20 total): 2 video, 10 image, 8 text
  // - Zusatzstoff (10 total): 1 video, 5 image, 4 text
  // Overall sum: 3 Video (~10%), 15 Image (~50%), 12 Text (~40%)
  const targets = {
    1: { count: 20, video: 2, image: 10, text: 8 },
    2: { count: 10, video: 1, image: 5, text: 4 }
  };

  let selected = [];

  [1, 2].forEach(themeId => {
    const pool = pools[themeId];
    const target = targets[themeId];
    const themeSelected = [];
    const usedIds = new Set();

    const pickFromCategory = (category, count) => {
      const available = pool[category].filter(q => !usedIds.has(q.id));
      const shuffled = [...available].sort(() => 0.5 - Math.random());
      const picked = shuffled.slice(0, count);
      picked.forEach(q => {
        usedIds.add(q.id);
        themeSelected.push(q);
      });
    };

    // Pick target amounts for each media type
    pickFromCategory('video', target.video);
    pickFromCategory('image', target.image);
    pickFromCategory('text', target.text);

    // Fallback if any media category had fewer available questions than target count
    if (themeSelected.length < target.count) {
      const remainingPool = [
        ...pool.video,
        ...pool.image,
        ...pool.text
      ].filter(q => !usedIds.has(q.id));
      const shuffledRemaining = [...remainingPool].sort(() => 0.5 - Math.random());
      const needed = target.count - themeSelected.length;
      const extra = shuffledRemaining.slice(0, needed);
      extra.forEach(q => {
        usedIds.add(q.id);
        themeSelected.push(q);
      });
    }

    themeSelected.forEach((baseQuestion, idx) => {
      selected.push({
        ...baseQuestion,
        id: `${baseQuestion.id}_exam_${themeId}_${idx}`
      });
    });
  });

  // Randomize final exam order
  return selected.sort(() => 0.5 - Math.random());
};
