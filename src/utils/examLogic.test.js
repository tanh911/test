import { describe, it, expect } from 'vitest';
import { calculateExamResult, generateExamQuestions } from './examLogic';

describe('examLogic - generateExamQuestions', () => {
  it('should generate 30 questions with 20 Grundstoff and 10 Zusatzstoff', () => {
    // Generate a mock pool of questions
    const mockQuestions = [];
    for (let i = 1; i <= 50; i++) {
      mockQuestions.push({ id: `1.1.01-${i}`, text: 'Grundstoff' }); // pool 1
    }
    for (let i = 1; i <= 20; i++) {
      mockQuestions.push({ id: `2.1.01-${i}`, text: 'Zusatzstoff' }); // pool 2
    }

    const exam = generateExamQuestions(mockQuestions);
    expect(exam).toHaveLength(30);

    const grundstoff = exam.filter(q => q.id.includes('_exam_1_'));
    const zusatzstoff = exam.filter(q => q.id.includes('_exam_2_'));

    expect(grundstoff).toHaveLength(20);
    expect(zusatzstoff).toHaveLength(10);
  });

  it('should distribute media types according to Class B specifications (video, image, text)', () => {
    const mockQuestions = [];
    // Grundstoff pool (theme 1)
    for (let i = 1; i <= 5; i++) mockQuestions.push({ id: `1.1.01-v${i}`, video: `v${i}.mp4` });
    for (let i = 1; i <= 20; i++) mockQuestions.push({ id: `1.1.01-img${i}`, image: `img${i}.png` });
    for (let i = 1; i <= 25; i++) mockQuestions.push({ id: `1.1.01-t${i}` });

    // Zusatzstoff pool (theme 2)
    for (let i = 1; i <= 5; i++) mockQuestions.push({ id: `2.1.01-v${i}`, video: `v${i}.mp4` });
    for (let i = 1; i <= 10; i++) mockQuestions.push({ id: `2.1.01-img${i}`, image: `img${i}.png` });
    for (let i = 1; i <= 10; i++) mockQuestions.push({ id: `2.1.01-t${i}` });

    const exam = generateExamQuestions(mockQuestions);
    expect(exam).toHaveLength(30);

    const videoCount = exam.filter(q => q.video).length;
    const imageCount = exam.filter(q => (q.image || q.imageType) && !q.video).length;
    const textCount = exam.filter(q => !q.video && !q.image && !q.imageType).length;

    // Expected: 3 Videos (2 Grundstoff + 1 Zusatzstoff), 15 Images (10 + 5), 12 Text (8 + 4)
    expect(videoCount).toBe(3);
    expect(imageCount).toBe(15);
    expect(textCount).toBe(12);
  });
});

describe('examLogic - calculateExamResult', () => {
  const mockQuestions = [
    { id: 'q1', points: 4, options: [{ id: 'a', isCorrect: true }, { id: 'b', isCorrect: false }] },
    { id: 'q2', points: 3, options: [{ id: 'c', isCorrect: true }] },
    { id: 'q3', points: 5, options: [{ id: 'd', isCorrect: true }] },
    { id: 'q4', points: 5, options: [{ id: 'e', isCorrect: true }] }
  ];

  it('should pass when all answers are correct', () => {
    const activeAnswers = {
      q1: ['a'],
      q2: ['c'],
      q3: ['d'],
      q4: ['e']
    };
    const result = calculateExamResult(mockQuestions, activeAnswers);
    expect(result.passed).toBe(true);
    expect(result.fehlerpunkte).toBe(0);
    expect(result.failedDueToTwoFivePointQuestions).toBe(false);
  });

  it('should fail when mistakes exceed 10 points', () => {
    const activeAnswers = {
      q1: ['b'], // wrong (4 points)
      q2: [], // wrong (3 points)
      q3: [], // wrong (5 points)
      q4: ['e']
    };
    const result = calculateExamResult(mockQuestions, activeAnswers);
    expect(result.passed).toBe(false);
    expect(result.fehlerpunkte).toBe(12);
  });

  it('should fail when mistakes equal exactly 10 points but include two 5-point questions', () => {
    const activeAnswers = {
      q1: ['a'],
      q2: ['c'],
      q3: [], // wrong (5 points)
      q4: []  // wrong (5 points)
    };
    const result = calculateExamResult(mockQuestions, activeAnswers);
    expect(result.passed).toBe(false);
    expect(result.fehlerpunkte).toBe(10);
    expect(result.failedDueToTwoFivePointQuestions).toBe(true);
  });

  it('should pass when mistakes equal exactly 10 points but NOT two 5-point questions', () => {
    // Modify q1 and q2 to sum up to 10 points total
    const questions = [
      { id: 'q1', points: 4, options: [{ id: 'a', isCorrect: true }] },
      { id: 'q2', points: 3, options: [{ id: 'b', isCorrect: true }] },
      { id: 'q3', points: 3, options: [{ id: 'c', isCorrect: true }] },
      { id: 'q4', points: 5, options: [{ id: 'd', isCorrect: true }] }
    ];
    const activeAnswers = {
      q1: [], // wrong 4
      q2: [], // wrong 3
      q3: [], // wrong 3
      q4: ['d']
    };
    const result = calculateExamResult(questions, activeAnswers);
    expect(result.passed).toBe(true); // <= 10 and not two 5-pointers
    expect(result.fehlerpunkte).toBe(10);
    expect(result.failedDueToTwoFivePointQuestions).toBe(false);
  });
});
