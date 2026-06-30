import { questions } from './src/data/questions.js';

const seedRandom = (seed) => {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const getQuestionTheme = (q) => {
  return (typeof q.id === 'string' && q.id.startsWith('2.')) ? 2 : 1;
};

const getBogenQuestions = (bogenId) => {
  const pools = { 1: [], 2: [] };
  questions.forEach(q => {
    const theme = getQuestionTheme(q);
    pools[theme].push(q);
  });

  const targets = {
    1: 20, // 20 Grundstoff
    2: 10  // 10 Zusatzstoff (Klasse B)
  };

  let selected = [];
  let seed = bogenId * 100; // unique seed for this Bogen

  Object.keys(targets).forEach(themeId => {
    const pool = pools[themeId];
    const targetCount = targets[themeId];
    if (pool && pool.length > 0) {
      // Deterministic shuffle using seed
      const shuffledPool = [...pool];
      for (let i = shuffledPool.length - 1; i > 0; i--) {
        const r = seedRandom(seed + i);
        seed += 1;
        const j = Math.floor(r * (i + 1));
        [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
      }

      // Avoid duplicates by slicing exactly what we need
      const selectedForTheme = shuffledPool.slice(0, targetCount);
      selectedForTheme.forEach((baseQuestion, idx) => {
        selected.push({
          ...baseQuestion,
          id: `${baseQuestion.id}_exam_${themeId}_${idx}`
        });
      });
    }
  });

  // Deterministic shuffle of the final list
  for (let i = selected.length - 1; i > 0; i--) {
    const r = seedRandom(seed + i);
    seed += 1;
    const j = Math.floor(r * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
};

console.log("Testing getBogenQuestions:");
try {
  const res = getBogenQuestions(1);
  console.log("Length:", res.length);
} catch (e) {
  console.error("Error:", e);
}
