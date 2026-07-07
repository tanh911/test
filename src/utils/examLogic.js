export const calculateExamResult = (activeQuestions, activeAnswers) => {
  let totalFehlerpunkte = 0;
  let countFivePointFails = 0;
  const details = [];

  activeQuestions.forEach(q => {
    // Strip exam suffix from ID to match options keys if necessary,
    // though activeAnswers usually uses the full dynamic ID
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

  // Autodetect extension exam (20 questions instead of 30)
  const isExtension = activeQuestions.length === 20;
  const maxFehlerpunkte = isExtension ? 6 : 10;

  // Failing conditions:
  // 1. Total Fehlerpunkte > maxFehlerpunkte (10 for first time, 6 for extension)
  // 2. Or if they failed two 5-point questions
  const failedDueToTwoFivePointQuestions = countFivePointFails >= 2;
  const passed = totalFehlerpunkte <= maxFehlerpunkte && !failedDueToTwoFivePointQuestions;

  return {
    fehlerpunkte: totalFehlerpunkte,
    passed,
    failedDueToTwoFivePointQuestions,
    details
  };
};

// Seed-based pseudo-random number generator for reproducibility (e.g. Musterbögen)
const createRandom = (seed) => {
  let s = seed;
  return () => {
    let x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };
};

export const generateExamQuestions = (allQuestions, options = {}) => {
  const { isExtension = false, seed = null } = options;
  const random = seed !== null ? createRandom(seed * 100) : Math.random;

  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const r = random();
      const j = Math.floor(r * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Helper to determine theme: 1: Grundstoff, 2: Zusatzstoff (Class B specific)
  const getQuestionTheme = (q) => {
    return (typeof q.id === 'string' && q.id.startsWith('2.')) ? 2 : 1;
  };

  const isGefahrenlehre = (q) => {
    return typeof q.id === 'string' && q.id.startsWith('1.1');
  };

  const getMediaType = (q) => {
    if (q.video) return 'video';
    if (q.image || q.imageType) return 'image';
    return 'text';
  };

  // Classify questions by Theme and Media type
  const pools = {
    1: {
      gefahrenlehre: { video: [], image: [], text: [] },
      others: { video: [], image: [], text: [] }
    },
    2: { video: [], image: [], text: [] }
  };

  allQuestions.forEach(q => {
    const theme = getQuestionTheme(q);
    const media = getMediaType(q);
    if (theme === 2) {
      pools[2][media].push(q);
    } else {
      if (isGefahrenlehre(q)) {
        pools[1].gefahrenlehre[media].push(q);
      } else {
        pools[1].others[media].push(q);
      }
    }
  });

  // Blueprint target counts
  const grundstoffTarget = isExtension ? 10 : 20;
  const zusatzstoffTarget = 10;

  // Media splits
  const gMediaTargets = isExtension
    ? { video: 1, image: 5, text: 4 }
    : { video: 2, image: 10, text: 8 };
  const zMediaTargets = { video: 1, image: 5, text: 4 };

  // Points splits targets
  const gPointsTargets = isExtension
    ? { 5: 2, 4: 3, other: 5 }
    : { 5: 3, 4: 7, other: 10 };
  const zPointsTargets = { 5: 2, 4: 3, other: 5 };

  // Topic splits targets for Grundstoff
  const gTopicTargets = isExtension
    ? { gefahren: 5, others: 5 }
    : { gefahren: 10, others: 10 };

  const selected = [];
  const usedIds = new Set();

  const currentGPoints = { 2: 0, 3: 0, 4: 0, 5: 0 };
  const currentGTopics = { gefahren: 0, others: 0 };
  const currentZPoints = { 2: 0, 3: 0, 4: 0, 5: 0 };

  // Unified selection function that balances points and topics via deficits
  const pickWeightedCombined = (poolG, poolO, count, pointsTargets, currentPoints, topicTargets = null, currentTopics = null) => {
    const picked = [];
    const available = [];
    poolG.forEach(q => {
      if (!usedIds.has(q.id)) available.push({ q, topic: 'gefahren' });
    });
    poolO.forEach(q => {
      if (!usedIds.has(q.id)) available.push({ q, topic: 'others' });
    });

    for (let i = 0; i < count; i++) {
      if (available.length === 0) break;

      const weights = [];
      available.forEach(item => {
        let p = item.q.points;
        if (p !== 2 && p !== 3 && p !== 4 && p !== 5) {
          p = 3;
        }

        // Points deficit weight
        let wPoints = 1.0;
        if (p === 5) {
          wPoints = Math.max(0.1, pointsTargets[5] - currentPoints[5]);
        } else if (p === 4) {
          wPoints = Math.max(0.1, pointsTargets[4] - currentPoints[4]);
        } else {
          wPoints = Math.max(0.1, pointsTargets['other'] - (currentPoints[2] + currentPoints[3]));
        }

        // Topic deficit weight
        let wTopic = 1.0;
        if (topicTargets && currentTopics) {
          wTopic = Math.max(0.1, topicTargets[item.topic] - currentTopics[item.topic]);
        }

        weights.push(wPoints * wTopic);
      });

      // Weighted random choice
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      let r = random() * totalWeight;
      let chosenIdx = available.length - 1;
      for (let j = 0; j < available.length; j++) {
        r -= weights[j];
        if (r <= 0) {
          chosenIdx = j;
          break;
        }
      }

      const chosenItem = available[chosenIdx];
      picked.push(chosenItem.q);
      usedIds.add(chosenItem.q.id);
      available.splice(chosenIdx, 1);

      let p = chosenItem.q.points;
      if (p !== 2 && p !== 3 && p !== 4 && p !== 5) {
        p = 3;
      }
      currentPoints[p]++;
      if (currentTopics) {
        currentTopics[chosenItem.topic]++;
      }
      selected.push(chosenItem.q);
    }
    return picked.length;
  };

  // 1. Select Grundstoff
  pickWeightedCombined(
    pools[1].gefahrenlehre.video, pools[1].others.video,
    gMediaTargets.video, gPointsTargets, currentGPoints, gTopicTargets, currentGTopics
  );
  pickWeightedCombined(
    pools[1].gefahrenlehre.image, pools[1].others.image,
    gMediaTargets.image, gPointsTargets, currentGPoints, gTopicTargets, currentGTopics
  );
  pickWeightedCombined(
    pools[1].gefahrenlehre.text, pools[1].others.text,
    gMediaTargets.text, gPointsTargets, currentGPoints, gTopicTargets, currentGTopics
  );

  // 2. Select Zusatzstoff
  pickWeightedCombined(
    pools[2].video, [],
    zMediaTargets.video, zPointsTargets, currentZPoints, null, null
  );
  pickWeightedCombined(
    pools[2].image, [],
    zMediaTargets.image, zPointsTargets, currentZPoints, null, null
  );
  pickWeightedCombined(
    pools[2].text, [],
    zMediaTargets.text, zPointsTargets, currentZPoints, null, null
  );

  // Fallback in case of pool depletion (e.g. mock pools in unit tests)
  const getSelectedCountByTheme = (themeId) => {
    return selected.filter(q => getQuestionTheme(q) === themeId).length;
  };

  const currentGCount = getSelectedCountByTheme(1);
  if (currentGCount < grundstoffTarget) {
    const remainingG = allQuestions.filter(q => getQuestionTheme(q) === 1 && !usedIds.has(q.id));
    const needed = grundstoffTarget - currentGCount;
    const shuffledRemaining = shuffle(remainingG);
    const extra = shuffledRemaining.slice(0, needed);
    extra.forEach(q => {
      usedIds.add(q.id);
      selected.push(q);
    });
  }

  const currentZCount = getSelectedCountByTheme(2);
  if (currentZCount < zusatzstoffTarget) {
    const remainingZ = allQuestions.filter(q => getQuestionTheme(q) === 2 && !usedIds.has(q.id));
    const needed = zusatzstoffTarget - currentZCount;
    const shuffledRemaining = shuffle(remainingZ);
    const extra = shuffledRemaining.slice(0, needed);
    extra.forEach(q => {
      usedIds.add(q.id);
      selected.push(q);
    });
  }

  // Format questions with dynamic dynamic ID format
  const formattedQuestions = selected.map((q, idx) => ({
    ...q,
    id: `${q.id}_exam_${getQuestionTheme(q)}_${idx}`
  }));

  // Topic grouping key helper to avoid consecutive topics
  const getTopicGroup = (q) => {
    const idStr = String(q.id);
    if (idStr.length >= 3 && idStr[1] === '.') {
      return idStr.slice(0, 3);
    }
    return idStr;
  };

  // Smart shuffle to minimize consecutive topics
  const smartShuffle = (questionsList) => {
    const shuffled = shuffle(questionsList);
    const result = [];
    while (shuffled.length > 0) {
      let chosenIdx = 0;
      if (result.length > 0) {
        const lastTopic = getTopicGroup(result[result.length - 1]);
        for (let idx = 0; idx < shuffled.length; idx++) {
          if (getTopicGroup(shuffled[idx]) !== lastTopic) {
            chosenIdx = idx;
            break;
          }
        }
      }
      result.push(shuffled.splice(chosenIdx, 1)[0]);
    }
    return result;
  };

  return smartShuffle(formattedQuestions);
};
