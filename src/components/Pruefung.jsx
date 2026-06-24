import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { questions } from '../data/questions';
import { SVGGraphics } from './SVGGraphics';
import { 
  Timer, AlertTriangle, ShieldCheck, ShieldAlert, 
  Check, RefreshCw, Eye, Info, Volume2, List, CheckCircle, ChevronRight, ChevronLeft, BarChart3
} from 'lucide-react';

export const Pruefung = ({ user, onUpdateUser, languageMode = 'both' }) => {
  const navigate = useNavigate();
  const [examState, setExamState] = useState('idle'); // 'idle', 'musterboegen', 'running', 'submitted'
  const [selectedBogen, setSelectedBogen] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: [selectedOptionIds] }
  
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

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
    setExamState('submitted');

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

    const examResult = {
      fehlerpunkte: totalFehlerpunkte,
      passed,
      failedDueToTwoFivePointQuestions,
      details
    };

    setResults(examResult);

    // Save to user history
    const examHistory = [...(user.examHistory || [])];
    examHistory.unshift({
      id: Date.now(),
      date: new Date().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      fehlerpunkte: totalFehlerpunkte,
      passed,
      questionsCount: activeQuestions.length
    });

    onUpdateUser({
      ...user,
      examHistory
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
      <div className="flex flex-col min-h-full bg-[#f4f7f9]" style={{fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"}}>
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
            <div className="relative flex-shrink-0" style={{width: 'min(100%, 420px)', aspectRatio: '1/1'}}>
              <svg viewBox="0 0 200 200" style={{width: '100%', height: '100%'}}>
                {/* Outer rings */}
                <circle cx="100" cy="100" r="95" fill="#d9dedf" />
                <circle cx="100" cy="100" r="70" fill="none" stroke="#f4f7f9" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="48" fill="none" stroke="#f4f7f9" strokeWidth="1.5" />
                
                {/* Inner White Center */}
                <circle cx="100" cy="100" r="48" fill="white" />
                
                {/* Color Indicators at top */}
                <path d="M 100 5 L 100 28" stroke="#7cb342" strokeWidth="5" strokeLinecap="square" />
                <path d="M 100 30 L 100 48" stroke="#fbc02d" strokeWidth="5" strokeLinecap="square" />
                <path d="M 100 50 L 100 70" stroke="#e53935" strokeWidth="3.5" strokeLinecap="square" />
              </svg>
              
              {/* Center Text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div style={{fontSize: '48px', fontWeight: '500', color: '#7cb342', lineHeight: '1'}}>0.0%</div>
                <div style={{fontSize: '16px', color: '#546e7a', marginTop: '8px'}}>Fit für Prüfung</div>
                <BarChart3 size={20} color="#546e7a" className="mt-2 opacity-80" />
              </div>
            </div>

            {/* Right Side: Training List */}
            <div className="flex flex-col w-full max-w-sm gap-4 z-10">
              
              {/* Header */}
              <div className="flex items-center gap-4 mb-2">
                <button 
                  onClick={() => navigate('/training')}
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
                <div style={{fontSize: '22px', color: '#546e7a', fontWeight: '400'}}>
                  Prüfung
                </div>
              </div>

              {/* List Items */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setExamState('musterboegen')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                    background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b', width: '100%', justifyContent: 'space-between'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <List size={22} className="text-[#2b576b]" />
                    <span style={{fontSize: '15px', fontWeight: '400'}}>Musterbögen</span>
                  </div>
                  <ChevronRight size={18} opacity={0.5} />
                </button>

                <button 
                  onClick={startExam}
                  style={{
                    display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                    background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b', width: '100%', justifyContent: 'space-between'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <ShieldCheck size={22} className="text-[#7cb342]" />
                    <span style={{fontSize: '15px', fontWeight: '400'}}>Prüfungssimulation</span>
                  </div>
                  <ChevronRight size={18} opacity={0.5} />
                </button>

                <button 
                  onClick={() => alert('Chức năng "Lỗi sai gần đây" sẽ sớm ra mắt.')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                    background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b', width: '100%', justifyContent: 'space-between'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <CheckCircle size={22} className="text-[#7cb342]" />
                    <span style={{fontSize: '15px', fontWeight: '400'}}>1 letzte Fehler</span>
                  </div>
                  <ChevronRight size={18} opacity={0.5} />
                </button>

                <button 
                  onClick={() => alert('Chức năng "Câu hỏi đã đánh dấu" sẽ sớm ra mắt.')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                    background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b', width: '100%', justifyContent: 'space-between'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <CheckCircle size={22} className="text-[#7cb342]" />
                    <span style={{fontSize: '15px', fontWeight: '400'}}>0 markierte Fragen</span>
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
    return (
      <div className="flex flex-col h-[calc(100vh-70px)] bg-[#F5F6F8] relative font-sans">
        <div className="text-center py-5 border-b border-gray-200 bg-white">
          <h2 className="text-[22px] text-[#24425A] flex items-center justify-center gap-2">
            Prüfung ab 01.04.2025 <Info className="w-5 h-5 text-gray-400" />
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-6 pb-32 bg-[#F5F6F8]">
          {boegen.map(b => (
            <button 
              key={b} 
              onClick={() => setSelectedBogen(b)} 
              className="flex items-start gap-3 hover:bg-gray-50 p-2 rounded-md transition-colors text-left"
            >
              <div className={`w-[22px] h-[22px] border-[2.5px] rounded-sm shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                selectedBogen === b ? 'bg-[#24425A] border-[#24425A]' : 'border-gray-500 bg-white'
              }`}>
                {selectedBogen === b && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-gray-700 text-[15px] font-medium leading-tight">Bogen {b}</span>
                <div className="flex gap-1 mt-1">
                  <div className="w-4 h-3 bg-gray-200 rounded-[1px]"></div>
                  <div className="w-4 h-3 bg-gray-200 rounded-[1px]"></div>
                  <div className="w-4 h-3 bg-gray-200 rounded-[1px]"></div>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="absolute bottom-0 left-0 w-full bg-[#F5F6F8] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="text-center text-[#24425A] py-4 text-[19px] border-t border-gray-200 bg-white">
            {selectedBogen ? `Sie haben Bogen ${selectedBogen} (Klasse B) ausgewählt` : 'Bitte wählen Sie einen Prüfungsbogen aus...'}
          </div>
          <div className="bg-[#24425A] p-2 md:p-3 flex justify-between items-center overflow-x-auto whitespace-nowrap gap-4">
            <button 
              onClick={() => { setExamState('idle'); setSelectedBogen(null); }} 
              className="bg-[#FF4444] hover:bg-red-600 text-white px-6 md:px-8 py-2 md:py-2.5 rounded font-medium transition-colors shrink-0"
            >
              Zurück
            </button>
            
            {selectedBogen && (
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => alert('Chức năng "Bogen lesen" sẽ sớm ra mắt.')}
                  className="bg-[#F59E0B] hover:bg-yellow-500 text-white px-4 py-2 md:py-2.5 rounded font-medium transition-colors"
                >
                  Bogen lesen
                </button>
                <button 
                  onClick={() => alert('Chức năng "Bogen üben" sẽ sớm ra mắt.')}
                  className="bg-[#F59E0B] hover:bg-yellow-500 text-white px-4 py-2 md:py-2.5 rounded font-medium transition-colors"
                >
                  Bogen üben
                </button>
                <button 
                  onClick={() => startExam()}
                  className="bg-[#F59E0B] hover:bg-yellow-500 text-white px-4 py-2 md:py-2.5 rounded font-medium transition-colors"
                >
                  Prüfungsmodus
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (examState === 'running') {
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
            <span>CÂU {currentIndex + 1} / {examQuestions.length}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-black rounded-md shadow-xs ${
            timeLeft < 300 ? 'bg-[#D71921] text-white animate-pulse' : 'bg-[#1E5E3A] text-white'
          }`}>
            <Timer className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn nộp bài thi ngay bây giờ không?')) {
                submitExam();
              }
            }}
            className="px-3 py-1.5 bg-[#D71921] hover:bg-[#B91C1C] text-white font-black rounded-md text-[11px] uppercase tracking-wider transition-colors shadow-sm"
          >
            Nộp Bài
          </button>
        </div>

        {/* Question Navigator Grid */}
        <div className="grid grid-cols-10 gap-1.5 p-3 bg-white/80 backdrop-blur-xs border-b border-[#BCDDC3] shrink-0">
          {examQuestions.map((q, i) => {
            const hasAnswer = (answers[q.id] || []).length > 0;
            const isActive = i === currentIndex;
            
            let btnClass = "border-[#BCDDC3] text-gray-700 bg-white/50";
            if (hasAnswer) {
              btnClass = "border-[#2C8040] bg-[#2C8040] text-white";
            }
            if (isActive) {
              btnClass = "bg-[#EAB308] text-black border-[#CA8A04] font-black shadow-xs";
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`py-2 rounded-lg text-xs font-black border text-center transition-colors ${btnClass}`}
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
              {currentQ.points} Điểm phạt
            </span>
            <button 
              onClick={() => handleSpeak(currentQ.textDe)}
              className="p-1.5 border bg-white border-[#2C8040]/30 hover:border-[#2C8040] text-[#2C8040] rounded-md transition-colors"
              title="Phát âm"
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
              
              if (isSelected) {
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
                  onClick={() => handleOptionClick(currentQ.id, opt.id)}
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
            {currentQ.points} Punkte
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => currentIndex < examQuestions.length - 1 && setCurrentIndex(currentIndex + 1)}
              disabled={currentIndex === examQuestions.length - 1}
              className="px-5 py-3 bg-white text-[#2C8040] hover:bg-neutral-50 font-black rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-30 border-2 border-gray-300 shadow-sm"
            >
              Weiter
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

      </div>
    );
  }

  if (examState === 'submitted') {
    return (
      <div className="flex flex-col h-full bg-[#E2F5E6] text-gray-900 font-sans overflow-y-auto px-4 py-6 pb-20 space-y-6 no-scrollbar">
        
        {/* Result Header Card */}
        <div className={`p-6 border-2 text-center space-y-4 rounded-2xl shadow-sm ${
          results.passed 
            ? 'bg-green-50 border-green-600 text-green-900' 
            : 'bg-red-50 border-red-650 text-red-950'
        }`}>
          <div className="flex justify-center">
            {results.passed ? (
              <ShieldCheck className="w-14 h-14 text-green-650" />
            ) : (
              <ShieldAlert className="w-14 h-14 text-red-650" />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-extrabold uppercase tracking-wider">
              {results.passed ? 'ĐÃ ĐỖ THI THỬ (BESTANDEN)' : 'TRƯỢT THI THỬ (NICHT BESTANDEN)'}
            </h2>
            <p className="text-sm font-bold text-gray-850">
              Tổng số điểm phạt: <span className="font-mono text-base font-extrabold text-gray-900">{results.fehlerpunkte}</span> / 10 Điểm phạt
            </p>
            {results.failedDueToTwoFivePointQuestions && (
              <p className="text-xs font-bold text-red-600 mt-1">
                * Bạn trượt vì trả lời sai từ 2 câu 5 điểm phạt trở lên!
              </p>
            )}
          </div>

          <button
            onClick={startExam}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider mx-auto border-2 rounded-lg transition-colors shadow-xs ${
              results.passed 
                ? 'bg-green-600 text-white border-green-600 hover:bg-transparent hover:text-green-600' 
                : 'bg-red-600 text-white border-red-600 hover:bg-transparent hover:text-red-600'
            }`}
          >
            LÀM ĐỀ THI KHÁC
          </button>
        </div>

        {/* Detailed Mistake Audit */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#2C8040] flex items-center gap-1.5">
            <Eye className="w-4.5 h-4.5" />
            CHI TIẾT KẾT QUẢ TỪNG CÂU:
          </h3>

          <div className="space-y-4">
            {results.details.map((detail, idx) => {
              return (
                <div key={idx} className={`p-4 rounded-xl bg-white/90 border-2 ${
                  detail.isCorrect ? 'border-green-600/30' : 'border-red-600/40'
                } space-y-3.5 shadow-2xs`}>
                  <div className="flex justify-between items-start border-b border-gray-200 pb-2">
                    <span className={`text-[13px] font-black uppercase ${
                      detail.isCorrect ? 'text-green-650' : 'text-red-650'
                    }`}>
                      Câu {idx + 1}: {detail.isCorrect ? 'ĐÚNG' : `SAI (+${detail.fehler}đ)`}
                    </span>
                    <span className="text-[11px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {detail.question.points} Punkte
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {(languageMode === 'de' || languageMode === 'both') && (
                      <p className="text-[16px] font-black text-gray-900 leading-snug">{detail.question.textDe}</p>
                    )}
                    {(languageMode === 'vi' || languageMode === 'both') && (
                      <p className="text-[14px] font-bold text-gray-700 italic border-l-2 border-[#2C8040] pl-2">{detail.question.textVi}</p>
                    )}
                  </div>

                  {/* Options Comparison */}
                  <div className="space-y-2.5 pt-1">
                    {detail.question.options.map(opt => {
                      const isChosen = detail.selected.includes(opt.id);
                      
                      let cardBg = "bg-white border border-[#BCDDC3]";
                      let checkboxStyle = "border-2 border-gray-300 bg-white text-transparent";
                      let checkIcon = null;

                      if (opt.isCorrect) {
                        cardBg = "bg-green-50 border-2 border-green-600 shadow-sm";
                        checkboxStyle = "border-2 border-green-600 bg-green-600 text-white";
                        checkIcon = (
                          <svg className="w-4.5 h-4.5 stroke-[4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        );
                      } else if (isChosen && !opt.isCorrect) {
                        cardBg = "bg-red-50 border-2 border-red-500 shadow-sm";
                        checkboxStyle = "border-2 border-red-500 bg-red-500 text-white font-extrabold text-xs";
                        checkIcon = <span>✕</span>;
                      } else {
                        cardBg = "bg-white/70 border border-gray-200 opacity-60";
                        checkboxStyle = "border-2 border-gray-300 bg-gray-50 text-transparent";
                        checkIcon = null;
                      }

                      return (
                        <div key={opt.id} className={`p-3 rounded-xl flex gap-3.5 items-center transition-all ${cardBg}`}>
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${checkboxStyle}`}>
                            {checkIcon}
                          </div>
                          <div className="leading-snug flex-1">
                            {(languageMode === 'de' || languageMode === 'both') && (
                              <p className="text-[15px] font-black text-gray-900">{opt.textDe}</p>
                            )}
                            {(languageMode === 'vi' || languageMode === 'both') && (
                              <p className="text-[13px] font-bold text-gray-800 italic border-t border-black/5 pt-1 mt-0.5">{opt.textVi}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Official Explanation for failed questions */}
                  {!detail.isCorrect && (
                    <div className="p-3.5 bg-green-50 border border-green-600 text-green-950 rounded-lg text-sm font-bold leading-relaxed shadow-3xs">
                      <p className="font-black text-green-700 uppercase text-xs tracking-wider mb-1">
                        {languageMode === 'de' ? 'Antwort Erklärung:' : 'Giải thích đáp án:'}
                      </p>
                      {(languageMode === 'de' || languageMode === 'both') && detail.question.explanationDe && (
                        <p>{detail.question.explanationDe}</p>
                      )}
                      {(languageMode === 'vi' || languageMode === 'both') && detail.question.explanationVi && (
                        <p style={{ marginTop: languageMode === 'both' ? '6px' : '0px', fontStyle: languageMode === 'both' ? 'italic' : 'normal' }}>
                          {detail.question.explanationVi}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  }
}

export default Pruefung;
