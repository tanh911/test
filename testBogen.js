import { generateExamQuestions } from './src/utils/examLogic.js';
import { questions } from './src/data/questions.js';

const getBogenQuestions = (bogenId) => {
  return generateExamQuestions(questions, { seed: bogenId });
};

console.log("Testing getBogenQuestions:");
try {
  const res = getBogenQuestions(1);
  console.log("Length:", res.length);
  console.log("Sample IDs:", res.slice(0, 5).map(q => q.id));
  console.log("Videos:", res.filter(q => q.video).length);
  console.log("Images:", res.filter(q => (q.image || q.imageType) && !q.video).length);
  console.log("Texts:", res.filter(q => !q.video && !q.image && !q.imageType).length);
} catch (e) {
  console.error("Error:", e);
}
