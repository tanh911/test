import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { questions } from '../data/questions';
import { SVGGraphics } from './SVGGraphics';
import { Lernen } from './Lernen';
import { customAlert } from '../utils/customAlert';
import { SupportModal } from './SupportModal';
import {
  Timer, AlertTriangle, ShieldCheck, ShieldAlert,
  Check, RefreshCw, Eye, Info, Volume2, List, CheckCircle, ChevronRight, ChevronLeft, BarChart3, X
} from 'lucide-react';
import confetti from 'canvas-confetti';

const seedRandom = (seed) => {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const getQuestionTheme = (q) => {
  // Extract base ID to handle random suffix if any
  const baseId = typeof q.id === 'string' && q.id.includes('_') ? parseInt(q.id.split('_')[0]) : parseInt(q.id);
  if ([2, 3, 9, 10].includes(baseId)) return 1; // Verkehrsvorschriften
  if ([11, 12].includes(baseId)) return 2;      // Gefahrenlehre
  if ([7, 14].includes(baseId)) return 3;       // Verhalten im Straßenverkehr
  if ([1, 4, 5, 6, 8].includes(baseId)) return 4; // Vorfahrt & Giao lộ
  if ([13].includes(baseId)) return 5;          // Technik & Umwelt
  if ([15].includes(baseId)) return 6;          // Zusatzstoff
  return 1;
};

const getBogenQuestions = (bogenId) => {
  const pools = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  questions.forEach(q => {
    const theme = getQuestionTheme(q);
    pools[theme].push(q);
  });

  const targets = {
    1: 12, // ~40% (Verkehrsvorschriften)
    2: 6,  // ~20% (Gefahrenlehre)
    3: 5,  // ~17% (Verhalten im Straßenverkehr)
    4: 3,  // ~10% (Vorfahrt & Giao lộ)
    5: 3,  // ~10% (Technik & Umwelt)
    6: 1   // ~3% (Zusatzstoff)
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

      for (let i = 0; i < targetCount; i++) {
        const baseQuestion = shuffledPool[i % shuffledPool.length];
        selected.push({
          ...baseQuestion,
          id: `${baseQuestion.id}_exam_${themeId}_${i}`
        });
      }
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

export const Pruefung = ({ user, onUpdateUser, onTriggerLogin, languageMode = 'both' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSupportModal, setShowSupportModal] = useState(false);
  const t = {
    // idle state
    fit: languageMode === 'de' ? 'Fit für Prüfung' : (languageMode === 'vi' ? 'Sẵn sàng thi' : 'Fit für Prüfung / Sẵn sàng thi'),
    pruefung: languageMode === 'de' ? 'Prüfung' : (languageMode === 'vi' ? 'Thi thử' : 'Prüfung / Thi thử'),
    musterboegen: languageMode === 'de' ? 'Musterbögen' : (languageMode === 'vi' ? 'Bộ đề mẫu' : 'Musterbögen / Bộ đề mẫu'),
    simulation: languageMode === 'de' ? 'Prüfungssimulation' : (languageMode === 'vi' ? 'Mô phỏng thi thật' : 'Prüfungssimulation / Thi thử'),
    letzteFehler: languageMode === 'de' ? 'letzte Fehler' : (languageMode === 'vi' ? 'lỗi sai gần đây' : 'letzte Fehler / lỗi sai gần đây'),
    markierteFragen: languageMode === 'de' ? 'markierte Fragen' : (languageMode === 'vi' ? 'câu hỏi đã đánh dấu' : 'markierte Fragen / câu hỏi đã đánh dấu'),

    // running state
    frage: languageMode === 'de' ? 'FRAGE' : (languageMode === 'vi' ? 'CÂU' : 'FRAGE / CÂU'),
    abgeben: languageMode === 'de' ? 'Abgeben' : (languageMode === 'vi' ? 'Nộp bài' : 'Nộp bài / Abgeben'),
    fehlerpunkte: languageMode === 'de' ? 'Fehlerpunkte' : (languageMode === 'vi' ? 'Điểm phạt' : 'Fehlerpunkte / Điểm phạt'),
    weiter: languageMode === 'de' ? 'Weiter' : (languageMode === 'vi' ? 'Tiếp tục' : 'Weiter / Tiếp'),
    zurueck: languageMode === 'de' ? 'Zurück' : (languageMode === 'vi' ? 'Quay lại' : 'Zurück / Quay lại'),

    // submitted state
    passed: languageMode === 'de' ? 'BESTANDEN' : (languageMode === 'vi' ? 'ĐÃ ĐỖ THI THỬ' : 'ĐÃ ĐỖ THI THỬ (BESTANDEN)'),
    failed: languageMode === 'de' ? 'NICHT BESTANDEN' : (languageMode === 'vi' ? 'TRƯỢT THI THỬ' : 'TRƯỢT THI THỬ (NICHT BESTANDEN)'),
    pointsTotal: languageMode === 'de' ? 'Gesamtfehlerpunkte' : (languageMode === 'vi' ? 'Tổng số điểm phạt' : 'Tổng số điểm phạt / Fehlerpunkte'),
    failedRule5: languageMode === 'de' ? '* Sie haben wegen 2 oder mehr 5-Punkte-Fragen nicht bestanden!' : (languageMode === 'vi' ? '* Bạn trượt vì trả lời sai từ 2 câu 5 điểm phạt trở lên!' : '* Bạn trượt vì trả lời sai từ 2 câu 5 điểm phạt trở lên! (>=2 câu 5 điểm)'),
    anotherExam: languageMode === 'de' ? 'NEUE PRÜFUNG' : (languageMode === 'vi' ? 'LÀM ĐỀ THI KHÁC' : 'LÀM ĐỀ THI KHÁC / NEUE PRÜFUNG'),
    detailsTitle: languageMode === 'de' ? 'PRÜFUNGSDETAILS:' : (languageMode === 'vi' ? 'CHI TIẾT KẾT QUẢ TỪNG CÂU:' : 'CHI TIẾT KẾT QUẢ / PRÜFUNGSDETAILS:'),
    richtig: languageMode === 'de' ? 'RICHTIG' : (languageMode === 'vi' ? 'ĐÚNG' : 'ĐÚNG / RICHTIG'),
    falsch: languageMode === 'de' ? 'FALSCH' : (languageMode === 'vi' ? 'SAI' : 'SAI / FALSCH'),
    explanationTitle: languageMode === 'de' ? 'Antwort-Erklärung:' : (languageMode === 'vi' ? 'Giải thích đáp án:' : 'Giải thích đáp án / Erklärung:'),

    // bogen specific
    bogen: languageMode === 'de' ? 'Bogen' : (languageMode === 'vi' ? 'Bộ đề' : 'Bogen / Bộ đề'),
    selectedBogenText: (b) => languageMode === 'de' ? `Sie haben Bogen ${b} (Klasse B) ausgewählt` : (languageMode === 'vi' ? `Bạn đã chọn bộ đề số ${b} (Hạng B)` : `Bạn đã chọn Bogen ${b} (Klasse B)`),
    pleaseSelectBogen: languageMode === 'de' ? 'Bitte wählen Sie einen Prüfungsbogen aus...' : (languageMode === 'vi' ? 'Vui lòng chọn một bộ đề thi...' : 'Vui lòng chọn bộ đề / Bitte Bogen wählen...'),
    readBogen: languageMode === 'de' ? 'Bogen lesen' : (languageMode === 'vi' ? 'Đọc đề' : 'Đọc đề / Bogen lesen'),
    practiceBogen: languageMode === 'de' ? 'Bogen üben' : (languageMode === 'vi' ? 'Luyện đề' : 'Luyện đề / Bogen üben'),
    examMode: languageMode === 'de' ? 'Prüfungsmodus' : (languageMode === 'vi' ? 'Chế độ thi' : 'Chế độ thi / Prüfungsmodus'),
  };

  const [examState, setExamState] = useState('idle'); // 'idle', 'musterboegen', 'running', 'submitted'
  const [selectedBogen, setSelectedBogen] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: [selectedOptionIds] }
  const [lernenMode, setLernenMode] = useState('practice');
  const [lernenQuestions, setLernenQuestions] = useState([]);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const timerRef = useRef(null);

  // Result state
  const [results, setResults] = useState({
    fehlerpunkte: 0,
    passed: false,
    failedDueToTwoFivePointQuestions: false,
    details: [] // { question, selected, correct, isCorrect, fehler }
  });
  const [examType, setExamType] = useState('simulation');
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Calculate real progress
  const totalQuestions = questions.length;
  const progressEntries = user?.progress ? Object.values(user.progress) : [];
  const answeredCount = progressEntries.filter(p => p.answered).length;
  const correctCount = progressEntries.filter(p => p.isCorrect).length;
  const wrongCount = progressEntries.filter(p => p.answered && !p.isCorrect).length;

  const answeredPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const fitPercent = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const wrongPercent = totalQuestions > 0 ? (wrongCount / totalQuestions) * 100 : 0;

  const [animatedFit, setAnimatedFit] = useState(0);
  const [animatedAnswered, setAnimatedAnswered] = useState(0);
  const [animatedWrong, setAnimatedWrong] = useState(0);

  useEffect(() => {
    if (examState === 'idle') {
      const timer = setTimeout(() => {
        setAnimatedFit(fitPercent);
        setAnimatedAnswered(answeredPercent);
        setAnimatedWrong(wrongPercent);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedFit(0);
      setAnimatedAnswered(0);
      setAnimatedWrong(0);
    }
  }, [fitPercent, answeredPercent, wrongPercent, examState]);

  useEffect(() => {
    if (showResultPopup && results.passed) {
      const duration = 2500;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);

      return () => clearInterval(interval);
    }
  }, [showResultPopup, results.passed]);

  useEffect(() => {
    const path = location.pathname;

    if (path === '/pruefung' || path === '/pruefung/') {
      if (examState !== 'idle' && examState !== 'submitted' && examState !== 'lernen_active') {
        setExamState('idle');
      }
      if (selectedBogen !== null) setSelectedBogen(null);
    } else if (path === '/pruefung/musterboegen') {
      if (examState !== 'musterboegen' && examState !== 'lernen_active') {
        setExamState('musterboegen');
      }
    } else if (path.startsWith('/pruefung/musterbogen-')) {
      const match = path.match(/\/pruefung\/musterbogen-(\d+)/);
      const bId = match ? parseInt(match[1]) : null;
      if (bId !== null && selectedBogen !== bId) {
        setSelectedBogen(bId);
      }
      if (examState === 'idle' || examState === 'musterboegen') {
        setExamType('bogen');
        startExam();
      }
    } else if (path === '/pruefung/simulation') {
      if (examState === 'idle' || examState === 'musterboegen') {
        setExamType('simulation');
        startExam();
      }
    }
  }, [location.pathname, examState, selectedBogen]);

  // Start the Exam
  const startExam = () => {
    const getQuestionTheme = (q) => {
      if ([2, 3, 9, 10].includes(q.id)) return 1; // Verkehrsvorschriften
      if ([11, 12].includes(q.id)) return 2;      // Gefahrenlehre
      if ([7, 14].includes(q.id)) return 3;       // Verhalten im Straßenverkehr
      if ([1, 4, 5, 6, 8].includes(q.id)) return 4; // Vorfahrt & Giao lộ
      if ([13].includes(q.id)) return 5;          // Technik & Umwelt
      if ([15].includes(q.id)) return 6;          // Zusatzstoff
      return 1;
    };

    // Phân nhóm câu hỏi
    const pools = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    questions.forEach(q => {
      const theme = getQuestionTheme(q);
      pools[theme].push(q);
    });

    // Chỉ số lượng mục tiêu cho từng nhóm (tổng = 30 câu)
    const targets = {
      1: 12, // ~40% (Verkehrsvorschriften)
      2: 6,  // ~20% (Gefahrenlehre)
      3: 5,  // ~17% (Verhalten im Straßenverkehr)
      4: 3,  // ~10% (Vorfahrt & Giao lộ)
      5: 3,  // ~10% (Technik & Umwelt)
      6: 1   // ~3% (Zusatzstoff)
    };

    let selected = [];
    Object.keys(targets).forEach(themeId => {
      const pool = pools[themeId];
      const targetCount = targets[themeId];
      if (pool && pool.length > 0) {
        // Trộn ngẫu nhiên câu hỏi gốc của nhóm đó
        const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
        for (let i = 0; i < targetCount; i++) {
          const baseQuestion = shuffledPool[i % shuffledPool.length];
          selected.push({
            ...baseQuestion,
            id: `${baseQuestion.id}_exam_${themeId}_${i}` // ID duy nhất trong kỳ thi
          });
        }
      }
    });

    // Trộn ngẫu nhiên danh sách cuối cùng của kỳ thi
    const shuffled = selected.sort(() => 0.5 - Math.random());

    setExamQuestions(shuffled);
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(1800);
    setExamState('running');

    // Start timer interval
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitExam(shuffled, {}); // Auto submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clear interval on unmount or when state is not running
  useEffect(() => {
    if (examState !== 'running' && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [examState]);

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle option click
  const handleOptionClick = (questionId, optionId) => {
    if (examState !== 'running') return;

    setAnswers(prev => {
      const selected = prev[questionId] || [];
      if (selected.includes(optionId)) {
        return { ...prev, [questionId]: selected.filter(id => id !== optionId) };
      } else {
        return { ...prev, [questionId]: [...selected, optionId] };
      }
    });
  };

  // Submit Exam
  const submitExam = (activeQuestions = examQuestions, activeAnswers = answers) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamQuestions(activeQuestions);
    setAnswers(activeAnswers);
    setExamState(prev => prev === 'lernen_active' ? 'lernen_active' : 'submitted');

    let totalFehlerpunkte = 0;
    let countFivePointFails = 0;
    const details = [];
    const updatedProgress = { ...(user.progress || {}) };
    const now = new Date().toISOString();

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

      // Update progress for statistics ring
      const baseId = typeof q.id === 'string' && q.id.includes('_') ? q.id.split('_')[0] : q.id;
      updatedProgress[baseId] = {
        answered: true,
        isCorrect,
        timestamp: now
      };
    });

    // Failing conditions:
    // 1. Total Fehlerpunkte > 10
    // 2. Or if total Fehlerpunkte === 10 and they failed two 5-point questions
    const failedDueToTwoFivePointQuestions = countFivePointFails >= 2;
    const passed = totalFehlerpunkte <= 10 && !failedDueToTwoFivePointQuestions;

    const examResult = {
      fehlerpunkte: totalFehlerpunkte,
      passed,
      failedDueToTwoFivePointQuestions,
      details
    };

    setResults(examResult);
    setShowResultPopup(true);

    // Save to user history
    const examHistory = [...(user.examHistory || [])];
    examHistory.unshift({
      id: Date.now(),
      date: new Date().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      fehlerpunkte: totalFehlerpunkte,
      passed,
      questionsCount: activeQuestions.length,
      bogenId: examType === 'bogen' ? selectedBogen : null
    });

    onUpdateUser({
      ...user,
      examHistory,
      progress: updatedProgress
    });
  };

  // Text-to-speech for German text
  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (examState === 'idle') {
    return (
      <div className="flex flex-col min-h-full bg-[#f4f7f9]" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
        <style>{`
          .home-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 24px;
            padding: 24px;
            width: 100%;
            max-width: 1100px;
            margin: 0 auto;
          }
          @media (min-width: 768px) {
            .home-container {
              flex-direction: row;
              align-items: center;
              justify-content: center;
              gap: 60px;
              padding: 40px;
            }
          }
        `}</style>
        <div className="flex-1 overflow-y-auto" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M10 90 Q 30 70 50 90 T 90 90\' stroke=\'%23e5ebf0\' stroke-width=\'2\' fill=\'none\' stroke-dasharray=\'4 4\'/%3E%3Ccircle cx=\'20\' cy=\'85\' r=\'4\' fill=\'%23e5ebf0\'/%3E%3Cpath d=\'M70 80 L85 80 L85 70\' stroke=\'%23e5ebf0\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E")',
          backgroundPosition: 'bottom right',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '300px'
        }}>
          <div className="home-container">

            {/* Left Side: Large Progress Circle */}
            <div className="relative flex justify-center items-center w-[280px] h-[280px] flex-shrink-0 animate-fade-in">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {/* Outer gray base */}
                <circle cx="100" cy="100" r="95" fill="#e5ebf0" />

                {/* Track Backgrounds */}
                <circle cx="100" cy="100" r="80" fill="none" stroke="#d9dedf" strokeWidth="12" />
                <circle cx="100" cy="100" r="66" fill="none" stroke="#d9dedf" strokeWidth="12" />
                <circle cx="100" cy="100" r="52" fill="none" stroke="#d9dedf" strokeWidth="12" />

                {/* Outer Green Ring: Fit für Prüfung */}
                <circle
                  cx="100" cy="100" r="80"
                  fill="none"
                  stroke="#7cb342"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 - (animatedFit / 100) * (2 * Math.PI * 80)}
                  style={{
                    transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: animatedFit > 0 ? 1 : 0
                  }}
                />

                {/* Middle Yellow Ring: Mind. 1x geübt */}
                <circle
                  cx="100" cy="100" r="66"
                  fill="none"
                  stroke="#fbc02d"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 66}
                  strokeDashoffset={2 * Math.PI * 66 - (animatedAnswered / 100) * (2 * Math.PI * 66)}
                  style={{
                    transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: animatedAnswered > 0 ? 1 : 0
                  }}
                />

                {/* Inner Red Ring: Zuletzt falsch */}
                <circle
                  cx="100" cy="100" r="52"
                  fill="none"
                  stroke="#e53935"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 - (animatedWrong / 100) * (2 * Math.PI * 52)}
                  style={{
                    transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: animatedWrong > 0 ? 1 : 0
                  }}
                />

                {/* Inner White Center */}
                <circle cx="100" cy="100" r="45" fill="white" />
              </svg>

              {/* Center Text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div style={{ fontSize: 'calc(36px * var(--text-scale, 1))', fontWeight: '600', color: '#7cb342', lineHeight: '1', marginTop: '10px' }}>{fitPercent.toFixed(1)}%</div>
                <div style={{ fontSize: 'calc(12px * var(--text-scale, 1))', color: '#546e7a', marginTop: '6px', fontWeight: '500' }}>
                  {t.fit}
                </div>
                <BarChart3 size={18} color="#546e7a" className="mt-1.5" />
              </div>
            </div>

            {/* Right Side: Training List */}
            <div className="flex flex-col w-full max-w-sm gap-4 z-10">

              {/* Header */}
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={() => navigate('/')}
                  style={{
                    width: '32px', height: '32px',
                    background: '#2b576b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <div style={{ fontSize: 'calc(22px * var(--text-scale, 1))', color: '#546e7a', fontWeight: '400' }}>
                  {t.pruefung}
                </div>
              </div>

              {/* List Items */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/pruefung/musterboegen')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                    background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b', width: '100%', justifyContent: 'space-between'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <List size={22} className="text-[#2b576b]" />
                    <span style={{ fontSize: 'calc(15px * var(--text-scale, 1))', fontWeight: '400' }}>{t.musterboegen}</span>
                  </div>
                  <ChevronRight size={18} opacity={0.5} />
                </button>

                <button
                  onClick={() => navigate('/pruefung/simulation')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                    background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b', width: '100%', justifyContent: 'space-between'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <ShieldCheck size={22} className="text-[#7cb342]" />
                    <span style={{ fontSize: 'calc(15px * var(--text-scale, 1))', fontWeight: '400' }}> {t.simulation}</span>
                  </div>
                  <ChevronRight size={18} opacity={0.5} />
                </button>

                <button
                  onClick={() => customAlert('Chức năng sẽ sớm ra mắt.', 'info')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                    background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b', width: '100%', justifyContent: 'space-between'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <CheckCircle size={22} className="text-[#7cb342]" />
                    <span style={{ fontSize: 'calc(15px * var(--text-scale, 1))', fontWeight: '400' }}>1 {t.letzteFehler}</span>
                  </div>
                  <ChevronRight size={18} opacity={0.5} />
                </button>

                <button
                  onClick={() => customAlert('Chức năng sẽ sớm ra mắt.', 'info')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                    background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b', width: '100%', justifyContent: 'space-between'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <CheckCircle size={22} className="text-[#7cb342]" />
                    <span style={{ fontSize: 'calc(15px * var(--text-scale, 1))', fontWeight: '400' }}>0 {t.markierteFragen}</span>
                  </div>
                  <ChevronRight size={18} opacity={0.5} />
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  if (examState === 'musterboegen') {
    const boegen = Array.from({ length: 66 }, (_, i) => i + 1);

    // Get attempts from user history for a specific bogen
    const getBogenAttempts = (bId) => {
      const history = user?.examHistory || [];
      const bogenHistory = history.filter(h => h.bogenId === bId);
      // limit to 3, oldest first (left-to-right)
      const attempts = bogenHistory.slice(0, 3).reverse();
      while (attempts.length < 3) {
        attempts.push(null);
      }
      return attempts;
    };

    return (
      <div className="flex flex-col h-[calc(100vh-70px)] bg-[#E9EFF4] relative font-sans overflow-hidden">
        <style>{`
          .bogen-responsive-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          @media (min-width: 450px) {
            .bogen-responsive-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          }
          @media (min-width: 768px) {
            .bogen-responsive-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          }
          @media (min-width: 1024px) {
            .bogen-responsive-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
          }
          .pruefung-footer {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 12px;
            width: 100%;
            background-color: #24405E;
            z-index: 20;
            box-sizing: border-box;
          }
          .pruefung-footer-btn-group {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            width: 100%;
          }
          .pruefung-footer-orange-btn {
            background-color: #E57A19;
            color: white;
            padding: 8px 4px;
            border-radius: 3px;
            font-weight: bold;
            font-size: calc(11px * var(--text-scale, 1));
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 40px;
            cursor: pointer;
            border: none;
          }
          .pruefung-footer-red-btn {
            background-color: #E54B4B;
            color: white;
            padding: 10px 24px;
            border-radius: 3px;
            font-weight: bold;
            font-size: calc(12px * var(--text-scale, 1));
            text-transform: uppercase;
            letter-spacing: 0.05em;
            cursor: pointer;
            border: none;
            text-align: center;
            width: 100%;
          }
          @media (min-width: 640px) {
            .pruefung-footer {
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              padding: 10px 16px;
              min-height: 56px;
            }
            .pruefung-footer-btn-group {
              display: flex;
              gap: 8px;
              width: auto;
            }
            .pruefung-footer-orange-btn {
              padding: 6px 20px;
              font-size: calc(12px * var(--text-scale, 1));
              min-height: auto;
            }
            .pruefung-footer-red-btn {
              width: auto;
              padding: 6px 24px;
            }
          }
        `}</style>

        {/* Main Content Area */}
        <div className="flex-1 p-3 md:p-4 flex flex-col justify-start items-center overflow-hidden">
          <div className="w-full max-w-6xl h-full bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">

            {/* Title Header */}

            {/* Grid Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 bogen-responsive-grid gap-x-3 md:gap-x-6 gap-y-1.5 md:gap-y-3.5 align-middle items-center">
              {boegen.map(b => {
                const isLocked = false;
                const attempts = getBogenAttempts(b);

                return (
                  <button
                    key={b}
                    onClick={() => {
                      if (isLocked) {
                        setShowPremiumModal(true);
                      } else {
                        setSelectedBogen(b);
                      }
                    }}
                    className={`flex items-start gap-2.5 p-1 px-2 rounded transition-all text-left ${isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                  >
                    {/* Checkbox */}
                    <div
                      style={{
                        width: '17px',
                        height: '17px',
                        borderStyle: 'solid',
                        borderWidth: '1.5px',
                        borderRadius: '2px',
                        backgroundColor: selectedBogen === b ? '#24425A' : 'white',
                        borderColor: isLocked ? '#e5e7eb' : selectedBogen === b ? '#24425A' : '#6b7280'
                      }}
                      className="shrink-0 mt-0.5 flex items-center justify-center transition-colors"
                    >
                      {selectedBogen === b && <Check style={{ width: '12px', height: '12px' }} className="text-white" strokeWidth={5} />}
                    </div>

                    {/* Bogen Name & Attempt Squares */}
                    <div className="flex flex-col items-start select-none">
                      <span className={`text-xs md:text-sm font-semibold leading-tight ${isLocked ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                        Bogen {b}
                      </span>

                      {/* 3 Progress Squares */}
                      <div className="flex gap-1 mt-0.5">
                        {attempts.map((attempt, index) => {
                          let bgClass = 'bg-gray-200';
                          if (attempt) {
                            bgClass = attempt.passed ? 'bg-green-500' : 'bg-red-500';
                          }
                          return (
                            <div
                              key={index}
                              style={{ width: '10px', height: '6px', borderRadius: '0.5px' }}
                              className={bgClass}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 3. Card Footer Status Message (Inside the Card at the Bottom) */}
            <div
              style={{ backgroundColor: '#EBF0F5' }}
              className="text-center text-[#24425A] py-3.5 text-[15px] md:text-[17px] font-semibold border-t border-gray-200 shrink-0"
            >
              {selectedBogen ? t.selectedBogenText(selectedBogen) : t.pleaseSelectBogen}
            </div>

          </div>
        </div>

        {/* Footer Blue Control Bar (Outside the Card) */}
        <div className="pruefung-footer">
          <button
            onClick={() => navigate('/pruefung')}
            className="pruefung-footer-red-btn"
          >
            {t.zurueck}
          </button>

          {selectedBogen && (
            <div className="pruefung-footer-btn-group">
              <button
                onClick={() => {
                  setLernenQuestions(getBogenQuestions(selectedBogen));
                  setLernenMode('lesen');
                  setExamState('lernen_active');
                }}
                className="pruefung-footer-orange-btn"
              >
                {t.readBogen}
              </button>
              <button
                onClick={() => {
                  setLernenQuestions(getBogenQuestions(selectedBogen));
                  setLernenMode('practice');
                  setExamState('lernen_active');
                }}
                className="pruefung-footer-orange-btn"
              >
                {t.practiceBogen}
              </button>
              <button
                onClick={() => {
                  setLernenQuestions(getBogenQuestions(selectedBogen));
                  setLernenMode('exam');
                  setExamState('lernen_active');
                  setExamType('bogen');
                }}
                className="pruefung-footer-orange-btn"
              >
                {t.examMode}
              </button>
            </div>
          )}
        </div>

        {/* Support Modal */}
        <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} languageMode={languageMode} />

        {/* Premium Overlay Modal */}
        {showPremiumModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl animate-zoom-in">
              <div className="w-16 h-16 bg-[#2B4E68]/10 rounded-full flex items-center justify-center text-[#2B4E68] mx-auto mb-4">
                <Info className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#24425A] mb-2">
                Premium Version
              </h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {languageMode === 'vi'
                  ? 'Vui lòng ủng hộ chúng mình bằng tài khoản Premium để sử dụng toàn bộ 66 bộ đề thi thử mẫu.'
                  : 'Bitte unterstützen Sie uns mit einem Premium-Konto, um alle 66 Musterbögen freizuschalten.'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowPremiumModal(false);
                    setShowSupportModal(true);
                  }}
                  className="w-full py-3 bg-[#F59E0B] hover:bg-yellow-650 text-white font-bold rounded-xl text-sm transition-colors uppercase tracking-wide"
                >
                  {languageMode === 'vi' ? 'Ủng hộ ngay' : 'Jetzt unterstützen'}
                </button>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >
                  {languageMode === 'vi' ? 'Đóng' : 'Schließen'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  if (examState === 'running' || examState === 'submitted') {
    const currentQ = examQuestions[currentIndex];
    const selectedForCurrent = answers[currentQ.id] || [];

    return (
      <div className="flex flex-col h-full bg-[#E2F5E6] text-gray-900 font-sans overflow-hidden relative">

        {/* Header Bar: Progress & Timer */}
        <div className="bg-[#2C8040] text-white flex items-center justify-between px-4 py-3 shrink-0 border-b border-[#1E5E3A] select-none">
          <div className="flex items-center gap-1.5 font-black font-mono text-sm">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#2C8040] shadow-xs">
              <Info className="w-3 h-3" />
            </div>
            <span>{t.frage} {currentIndex + 1} / {examQuestions.length}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-black rounded-md shadow-xs ${timeLeft < 300 ? 'bg-[#D71921] text-white animate-pulse' : 'bg-[#1E5E3A] text-white'
            }`}>
            <Timer className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {examState === 'running' ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-md text-[10px] md:text-[11px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                {languageMode === 'vi' ? 'Hủy' : 'Abbrechen'}
              </button>
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-3 py-1.5 bg-[#D71921] hover:bg-[#B91C1C] text-white font-black rounded-md text-[10px] md:text-[11px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                {t.abgeben}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowResultPopup(false);
                if (examType === 'bogen') {
                  setExamState('musterboegen');
                  navigate('/pruefung/musterboegen');
                } else {
                  setExamState('idle');
                  navigate('/pruefung');
                }
              }}
              className="px-3 py-1.5 bg-[#D71921] hover:bg-[#B91C1C] text-white font-black rounded-md text-[11px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              {t.zurueck}
            </button>
          )}
        </div>

        {/* Question Navigator Grid */}
        <div className="grid gap-1.5 p-3 bg-white/80 backdrop-blur-xs border-b border-[#BCDDC3] shrink-0" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
          {examQuestions.map((q, i) => {
            const hasAnswer = (answers[q.id] || []).length > 0;
            const isActive = i === currentIndex;

            let btnClass = "border-[#BCDDC3] text-gray-700 bg-white/50";
            if (examState === 'submitted') {
              const qCorrect = results.details.find(d => d.question.id === q.id)?.isCorrect;
              if (qCorrect) {
                btnClass = "border-green-600 bg-green-500 text-white";
              } else {
                btnClass = "border-red-600 bg-red-500 text-white";
              }
            } else if (hasAnswer) {
              btnClass = "border-[#2C8040] bg-[#2C8040] text-white";
            }
            if (isActive) {
              btnClass += " ring-2 ring-[#EAB308] ring-offset-1 font-black shadow-xs scale-105";
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`py-2 rounded-lg text-xs font-black border text-center transition-all ${btnClass}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Scrollable Question Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 no-scrollbar space-y-4">

          <div className="flex justify-between items-center bg-white/60 p-3 rounded-xl border border-[#BCDDC3] text-xs shadow-2xs">
            <span className="font-black border-2 border-[#D71921] text-[#D71921] px-2.5 py-1 bg-white rounded-lg text-xs">
              {currentQ.points} {t.fehlerpunkte}
            </span>
            <button
              onClick={() => handleSpeak(currentQ.textDe)}
              className="p-1.5 border bg-white border-[#2C8040]/30 hover:border-[#2C8040] text-[#2C8040] rounded-md transition-colors"
              title={languageMode === 'de' ? 'Aussprache' : (languageMode === 'vi' ? 'Phát âm' : 'Phát âm / Aussprache')}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Question Text */}
          <div className="space-y-1.5">
            {(languageMode === 'de' || languageMode === 'both') && (
              <h2 className="text-[17px] font-black text-gray-900 leading-snug">
                {currentQ.textDe}
              </h2>
            )}
            {(languageMode === 'vi' || languageMode === 'both') && (
              <p className="text-[15px] text-gray-850 font-bold italic border-l-4 border-[#2C8040] pl-2.5 py-0.5 leading-relaxed bg-white/70 rounded-r-md">
                {currentQ.textVi}
              </p>
            )}
          </div>

          {/* Visual Media */}
          {currentQ.video && (
            <div className="flex justify-center border border-[#BCDDC3] bg-black p-0.5 rounded-lg overflow-hidden shadow-2xs max-w-[220px] mx-auto">
              <video
                src={currentQ.video}
                controls
                className="w-full h-auto max-h-[100px] object-contain"
                poster={currentQ.image || undefined}
              />
            </div>
          )}

          {currentQ.image && !currentQ.video && (
            <div className="flex justify-center border border-[#BCDDC3] bg-black p-0.5 rounded-lg overflow-hidden shadow-2xs max-w-[220px] mx-auto">
              <img
                src={currentQ.image}
                alt="Question Visual"
                className="w-full h-auto max-h-[100px] object-contain"
              />
            </div>
          )}

          {currentQ.imageType && !currentQ.image && !currentQ.video && (
            <div className="flex justify-center bg-white/80 p-2 rounded-lg border border-[#BCDDC3] shadow-3xs max-w-[150px] mx-auto">
              <SVGGraphics type={currentQ.imageType} className="w-full max-w-[100px] h-auto aspect-square rounded-lg overflow-hidden border border-gray-200" />
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 pt-1">
            {currentQ.options.map((opt) => {
              const isSelected = selectedForCurrent.includes(opt.id);

              let cardBg = "bg-white border border-[#BCDDC3] hover:bg-gray-50";
              let checkboxStyle = "border-2 border-gray-300 bg-white text-transparent";
              let checkIcon = null;

              if (examState === 'submitted') {
                if (opt.isCorrect) {
                  cardBg = "bg-green-50 border-2 border-green-600 shadow-sm";
                  checkboxStyle = "border-2 border-green-600 bg-green-600 text-white";
                  checkIcon = <Check className="w-5 h-5 text-white" strokeWidth={3} />;
                } else if (isSelected && !opt.isCorrect) {
                  cardBg = "bg-red-50 border-2 border-red-500 shadow-sm";
                  checkboxStyle = "border-2 border-red-500 bg-red-500 text-white font-extrabold";
                  checkIcon = <X className="w-5 h-5 text-white" strokeWidth={3} />;
                } else {
                  cardBg = "bg-white/70 border border-gray-200 opacity-60";
                  checkboxStyle = "border-2 border-gray-300 bg-gray-50 text-transparent";
                }
              } else if (isSelected) {
                cardBg = "bg-[#E2F5E6] border-2 border-[#2C8040] shadow-xs";
                checkboxStyle = "border-2 border-[#2C8040] bg-[#2C8040] text-white";
                checkIcon = (
                  <svg className="w-5 h-5 stroke-[4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                );
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    if (examState === 'running') handleOptionClick(currentQ.id, opt.id);
                  }}
                  className={`w-full text-left py-3.5 px-4 flex gap-4 items-center transition-all rounded-xl shadow-3xs ${cardBg}`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${checkboxStyle}`}>
                    {checkIcon}
                  </div>
                  <div className="space-y-1 flex-1">
                    {(languageMode === 'de' || languageMode === 'both') && (
                      <p className="text-[17px] font-black text-gray-900 leading-snug">{opt.textDe}</p>
                    )}
                    {(languageMode === 'vi' || languageMode === 'both') && (
                      <p className="text-[15px] font-bold text-gray-800 italic border-t border-black/5 pt-1.5 mt-1">{opt.textVi}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {examState === 'submitted' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-green-700" />
                <h4 className="font-bold text-green-800 uppercase tracking-wider text-sm">{t.explanationTitle}</h4>
              </div>
              <div className="space-y-2 text-[14px] font-medium text-green-900">
                {(languageMode === 'de' || languageMode === 'both') && currentQ.explanationDe && (
                  <p>{currentQ.explanationDe}</p>
                )}
                {(languageMode === 'vi' || languageMode === 'both') && currentQ.explanationVi && (
                  <p>{currentQ.explanationVi}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="absolute bottom-0 left-0 w-full bg-[#2C8040] border-t border-[#1E5E3A] px-4 py-4 flex justify-between items-center z-20 shadow-lg">
          <div className="flex gap-2">
            <button
              onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="w-12 h-12 flex items-center justify-center bg-white text-black border-2 border-gray-300 rounded-xl disabled:opacity-30 hover:bg-neutral-100 transition-colors font-black text-xl shadow-sm"
            >
              ←
            </button>
          </div>

          <div className="bg-[#D71921] border-2 border-white text-white font-mono text-[13px] font-black px-4.5 py-2.5 rounded-lg shadow-md uppercase tracking-wider">
            {currentQ.points} {t.fehlerpunkte}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => currentIndex < examQuestions.length - 1 && setCurrentIndex(currentIndex + 1)}
              disabled={currentIndex === examQuestions.length - 1}
              className="px-5 py-3 bg-white text-[#2C8040] hover:bg-neutral-50 font-black rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-30 border-2 border-gray-300 shadow-sm"
            >
              {t.weiter}
            </button>
            <button
              onClick={() => currentIndex < examQuestions.length - 1 && setCurrentIndex(currentIndex + 1)}
              disabled={currentIndex === examQuestions.length - 1}
              className="w-12 h-12 flex items-center justify-center bg-white text-black border-2 border-gray-300 rounded-xl disabled:opacity-30 hover:bg-neutral-100 transition-colors font-black text-xl shadow-sm"
            >
              →
            </button>
          </div>
        </div>
        {/* Result Popup Overlay */}
        {examState === 'submitted' && showResultPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm px-4 animate-in fade-in duration-300" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
            <div className="w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '24px' }}>
              <div className="px-5 pt-8 pb-6 text-center relative" style={{ backgroundColor: results.passed ? '#f0fdf4' : '#fef2f2' }}>
                <div className="flex justify-center mb-5 relative z-10">
                  {results.passed ? (
                    <div className="w-20 h-20 flex items-center justify-center shadow-sm" style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '4px solid white', borderRadius: '50%' }}>
                      <CheckCircle className="w-10 h-10" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center shadow-sm" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '4px solid white', borderRadius: '50%' }}>
                      <X className="w-10 h-10" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                <h2 className="text-[20px] font-black leading-tight mb-3 tracking-tight" style={{ color: results.passed ? '#16a34a' : '#dc2626' }}>
                  {results.passed ? t.passed : t.failed}
                </h2>

                <div className="flex flex-col items-center p-4 mt-2 shadow-sm border border-gray-100 w-full max-w-[280px] mx-auto" style={{ backgroundColor: 'white', borderRadius: '16px' }}>
                  <div className="text-center pb-3 border-b border-gray-100 w-full">
                    <div className="text-[48px] leading-none font-black tracking-tighter" style={{ color: '#111827' }}>
                      {results.fehlerpunkte}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-widest mt-1.5" style={{ color: '#6b7280' }}>
                      {t.fehlerpunkte}
                    </div>
                  </div>
                  <div className="pt-3 flex justify-between items-center w-full px-2">
                    <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: '#6b7280' }}>
                      {languageMode === 'de' ? 'Falsche Fragen:' : (languageMode === 'vi' ? 'Số câu sai:' : 'Số câu sai:')}
                    </span>
                    <span className="text-[16px] font-black" style={{ color: '#dc2626' }}>
                      {results.details?.filter(d => !d.isCorrect).length || 0}
                      <span className="text-[13px] font-bold" style={{ color: '#9ca3af' }}> / {results.details?.length || 30}</span>
                    </span>
                  </div>
                </div>

                {results.failedDueToTwoFivePointQuestions && (
                  <p className="text-[13px] font-bold mt-5 px-2 leading-relaxed" style={{ color: '#ef4444' }}>{t.failedRule5}</p>
                )}
              </div>
              <div className="px-6 py-5 space-y-3" style={{ backgroundColor: 'white' }}>
                <button
                  onClick={() => setShowResultPopup(false)}
                  className="w-full py-4 font-black text-[13px] uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm cursor-pointer"
                  style={{ backgroundColor: '#2C8040', color: 'white', borderRadius: '12px' }}
                >
                  XEM ĐÁP ÁN CHI TIẾT
                </button>
                <button
                  onClick={() => {
                    setShowResultPopup(false);
                    if (examType === 'bogen') {
                      setExamState('musterboegen');
                      navigate('/pruefung/musterboegen');
                    } else {
                      setExamState('idle');
                      navigate('/pruefung');
                    }
                  }}
                  className="w-full py-3.5 font-bold text-[14px] transition-all active:scale-[0.98] cursor-pointer"
                  style={{ backgroundColor: '#f3f4f6', color: '#4b5563', borderRadius: '12px' }}
                >
                  {t.zurueck}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
                <Info className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">
                {languageMode === 'vi' ? 'Hủy kỳ thi thử?' : 'Prüfung abbrechen?'}
              </h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {languageMode === 'vi'
                  ? 'Bạn có chắc chắn muốn hủy bài thi thử này? Tiến trình của bạn sẽ không được lưu.'
                  : 'Möchten Sie die aktuelle Prüfung wirklich abbrechen? Ihr Fortschritt wird nicht gespeichert.'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowCancelConfirm(false);
                    if (timerRef.current) clearInterval(timerRef.current);
                    timerRef.current = null;
                    if (examType === 'bogen') {
                      setExamState('musterboegen');
                      navigate('/pruefung/musterboegen');
                    } else {
                      setExamState('idle');
                      navigate('/pruefung');
                    }
                  }}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm uppercase tracking-wide transition-colors cursor-pointer"
                >
                  {languageMode === 'vi' ? 'Có, Hủy bài' : 'Ja, abbrechen'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  {languageMode === 'vi' ? 'Không, làm tiếp' : 'Nein, weiter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">
                {languageMode === 'vi' ? 'Nộp bài thi thử?' : 'Prüfung abgeben?'}
              </h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {languageMode === 'vi'
                  ? 'Bạn có chắc chắn muốn nộp bài thi ngay bây giờ để kiểm tra kết quả không?'
                  : 'Möchten Sie die Prüfung wirklich abgeben, um das Ergebnis zu sehen?'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    submitExam();
                  }}
                  className="w-full py-3.5 bg-[#2C8040] hover:bg-[#1E5E3A] text-white font-black rounded-xl text-sm uppercase tracking-wide transition-colors cursor-pointer"
                >
                  {languageMode === 'vi' ? 'Có, Nộp bài' : 'Ja, abgeben'}
                </button>
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  {languageMode === 'vi' ? 'Không, làm tiếp' : 'Nein, weiter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (examState === 'lernen_active') {
    return (
      <div className="w-full h-full relative">
        <Lernen
          user={user}
          onUpdateUser={onUpdateUser}
          onTriggerLogin={onTriggerLogin}
          onNavigate={(dest) => {
            setExamState('musterboegen');
          }}
          languageMode={languageMode}
          predefinedQuestions={lernenQuestions}
          mode={lernenMode}
          onExamSubmit={(examAnswers) => {
            submitExam(lernenQuestions, examAnswers);
          }}
        />

        {/* Result Popup Overlay */}
        {showResultPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm px-4 animate-in fade-in duration-300" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
            <div className="w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '24px' }}>
              <div className="px-5 pt-8 pb-6 text-center relative" style={{ backgroundColor: results.passed ? '#f0fdf4' : '#fef2f2' }}>
                <div className="flex justify-center mb-5 relative z-10">
                  {results.passed ? (
                    <div className="w-20 h-20 flex items-center justify-center shadow-sm" style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '4px solid white', borderRadius: '50%' }}>
                      <CheckCircle className="w-10 h-10" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center shadow-sm" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '4px solid white', borderRadius: '50%' }}>
                      <X className="w-10 h-10" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                <h2 className="text-[20px] font-black leading-tight mb-3 tracking-tight" style={{ color: results.passed ? '#16a34a' : '#dc2626' }}>
                  {results.passed ? t.passed : t.failed}
                </h2>

                <div className="flex flex-col items-center p-4 mt-2 shadow-sm border border-gray-100 w-full max-w-[280px] mx-auto" style={{ backgroundColor: 'white', borderRadius: '16px' }}>
                  <div className="text-center pb-3 border-b border-gray-100 w-full">
                    <div className="text-[48px] leading-none font-black tracking-tighter" style={{ color: '#111827' }}>
                      {results.fehlerpunkte}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-widest mt-1.5" style={{ color: '#6b7280' }}>
                      {t.fehlerpunkte}
                    </div>
                  </div>
                  <div className="pt-3 flex justify-between items-center w-full px-2">
                    <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: '#6b7280' }}>
                      {languageMode === 'de' ? 'Falsche Fragen:' : (languageMode === 'vi' ? 'Số câu sai:' : 'Số câu sai:')}
                    </span>
                    <span className="text-[16px] font-black" style={{ color: '#dc2626' }}>
                      {results.details?.filter(d => !d.isCorrect).length || 0}
                      <span className="text-[13px] font-bold" style={{ color: '#9ca3af' }}> / {results.details?.length || 30}</span>
                    </span>
                  </div>
                </div>

                {results.failedDueToTwoFivePointQuestions && (
                  <p className="text-[13px] font-bold mt-5 px-2 leading-relaxed" style={{ color: '#ef4444' }}>{t.failedRule5}</p>
                )}
              </div>
              <div className="px-6 py-5 space-y-3" style={{ backgroundColor: 'white' }}>
                <button
                  onClick={() => {
                    setShowResultPopup(false);
                    setLernenMode('review');
                  }}
                  className="w-full py-4 font-black text-[13px] uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm cursor-pointer"
                  style={{ backgroundColor: '#2C8040', color: 'white', borderRadius: '12px' }}
                >
                  XEM ĐÁP ÁN CHI TIẾT
                </button>
                <button
                  onClick={() => {
                    setShowResultPopup(false);
                    setExamState('musterboegen');
                  }}
                  className="w-full py-3.5 font-bold text-[14px] transition-all active:scale-[0.98] cursor-pointer"
                  style={{ backgroundColor: '#f3f4f6', color: '#4b5563', borderRadius: '12px' }}
                >
                  {t.zurueck}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return null;
};

export default Pruefung;
