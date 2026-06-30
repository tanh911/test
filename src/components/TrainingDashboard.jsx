import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Menu, BarChart3, List, CheckCircle, Star, Calendar, Clock } from 'lucide-react';
import { questions } from '../data/questions';

export const TrainingDashboard = ({ user, onUpdateUser, onNavigate, onShowLogin, languageMode = 'both' }) => {
  const t = {
    fit: languageMode === 'de' ? 'Fit für Prüfung' : (languageMode === 'vi' ? 'Sẵn sàng thi' : 'Fit für Prüfung / Sẵn sàng thi'),
    training: languageMode === 'de' ? 'Training' : (languageMode === 'vi' ? 'Luyện tập' : 'Training / Luyện tập'),
    practice30: languageMode === 'de' ? '30 Fragen üben' : (languageMode === 'vi' ? 'Luyện 30 câu hỏi' : 'Luyện 30 câu hỏi / 30 Fragen'),
    allThemes: languageMode === 'de' ? 'Alle Fragen & Themen' : (languageMode === 'vi' ? 'Tất cả chủ đề & câu hỏi' : 'Tất cả câu hỏi & chủ đề / Alle'),
    focusAreas: languageMode === 'de' ? 'Schwerpunkte üben' : (languageMode === 'vi' ? 'Luyện câu hỏi trọng tâm' : 'Luyện trọng tâm / Schwerpunkte'),
    searchQuestions: languageMode === 'de' ? 'Fragen suchen' : (languageMode === 'vi' ? 'Tìm kiếm câu hỏi' : 'Tìm kiếm câu hỏi / Suchen'),
    lastErrors: languageMode === 'de' ? 'letzte Fehler' : (languageMode === 'vi' ? 'lỗi sai gần đây' : 'letzte Fehler / lỗi sai gần đây'),
    markedQuestions: languageMode === 'de' ? 'markierte Fragen' : (languageMode === 'vi' ? 'câu hỏi đã đánh dấu' : 'câu hỏi đã đánh dấu / markiert'),
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [examDateStr, setExamDateStr] = useState(user?.examDate || '');

  const handleSaveExamDate = () => {
    if (user && onUpdateUser && examDateStr) {
      onUpdateUser({ ...user, examDate: examDateStr });
    }
    setShowDatePicker(false);
  };

  const getDaysUntilExam = () => {
    if (!user?.examDate) return null;
    const diff = new Date(user.examDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days;
  };

  const daysLeft = getDaysUntilExam();

  // Calculate real progress
  const totalQuestions = questions.length;
  const progressEntries = user?.progress ? Object.values(user.progress) : [];
  const answeredCount = progressEntries.filter(p => p.answered).length;
  const correctCount = progressEntries.filter(p => p.answered && p.isCorrect).length;
  const wrongCount = progressEntries.filter(p => p.answered && !p.isCorrect).length;

  // Tỉ lệ tính trên tổng số câu hỏi thực tế
  const answeredPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const fitPercent     = totalQuestions > 0 ? (correctCount  / totalQuestions) * 100 : 0;
  const wrongPercent   = totalQuestions > 0 ? (wrongCount    / totalQuestions) * 100 : 0;

  const [animatedFit, setAnimatedFit] = React.useState(0);
  const [animatedAnswered, setAnimatedAnswered] = React.useState(0);
  const [animatedWrong, setAnimatedWrong] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedFit(fitPercent);
      setAnimatedAnswered(answeredPercent);
      setAnimatedWrong(wrongPercent);
    }, 100);
    return () => clearTimeout(timer);
  }, [fitPercent, answeredPercent, wrongPercent]);

  return (
    <div className="flex flex-col min-h-full bg-[#f4f7f9]" style={{fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"}}>
      
      {/* Main Responsive Content */}
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
        
        {/* Left Side: Progress Circle */}
        <div className="relative flex justify-center items-center w-[280px] h-[280px] flex-shrink-0">
          <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
            {/* Outer gray base */}
            <circle cx="100" cy="100" r="95" fill="#e5ebf0" />
            
            {/* --- Track Backgrounds --- */}
            <circle cx="100" cy="100" r="80" fill="none" stroke="#d9dedf" strokeWidth="12" />
            <circle cx="100" cy="100" r="66" fill="none" stroke="#d9dedf" strokeWidth="12" />
            <circle cx="100" cy="100" r="52" fill="none" stroke="#d9dedf" strokeWidth="12" />
            
            {/* --- Progress Tracks --- */}
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
            <div style={{fontSize: 'calc(36px * var(--text-scale, 1))', fontWeight: '600', color: '#7cb342', lineHeight: '1', marginTop: '10px'}}>{fitPercent.toFixed(1)}%</div>
            <div style={{fontSize: 'calc(12px * var(--text-scale, 1))', color: '#546e7a', marginTop: '6px', fontWeight: '500'}}>
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
              onClick={() => onNavigate('/')}
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
            <div style={{fontSize: 'calc(22px * var(--text-scale, 1))', color: '#546e7a', fontWeight: '400'}}>
              {t.training}
            </div>
          </div>

          {/* Exam Date Widget */}
          {!user?.isGuest && (
            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '8px', borderLeft: '4px solid #fbc02d' }}>
              {!showDatePicker ? (
                <>
                  {daysLeft !== null && daysLeft >= 0 ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div style={{ background: '#fef9c3', padding: '10px', borderRadius: '50%' }}>
                          <Clock size={24} color="#ca8a04" />
                        </div>
                        <div>
                          <div style={{ fontSize: 'calc(13px * var(--text-scale, 1))', color: '#713f12', fontWeight: 'bold' }}>Ngày thi đang đến gần!</div>
                          <div style={{ fontSize: 'calc(20px * var(--text-scale, 1))', color: '#ca8a04', fontWeight: '800' }}>{daysLeft} <span style={{fontSize:'12px', fontWeight:'600'}}>ngày</span></div>
                        </div>
                      </div>
                      <button onClick={() => setShowDatePicker(true)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}>
                        <Calendar size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '50%' }}>
                          <Calendar size={24} color="#0284c7" />
                        </div>
                        <div>
                          <div style={{ fontSize: 'calc(13px * var(--text-scale, 1))', color: '#0c4a6e', fontWeight: 'bold' }}>Mục tiêu thi lý thuyết</div>
                          <div style={{ fontSize: 'calc(11px * var(--text-scale, 1))', color: '#0284c7', marginTop: '2px' }}>{daysLeft < 0 ? 'Ngày thi đã qua, cập nhật lại?' : 'Đặt ngày dự kiến để đốc thúc học tập'}</div>
                        </div>
                      </div>
                      <button onClick={() => setShowDatePicker(true)} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                        Thiết lập
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <div style={{ fontSize: 'calc(13px * var(--text-scale, 1))', fontWeight: 'bold', color: '#374151' }}>Chọn ngày thi dự kiến:</div>
                  <input type="date" value={examDateStr} onChange={(e) => setExamDateStr(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }} />
                  <div className="flex gap-2 mt-1">
                    <button onClick={handleSaveExamDate} style={{ flex: 1, padding: '8px', background: '#2b576b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Lưu</button>
                    <button onClick={() => setShowDatePicker(false)} style={{ flex: 1, padding: '8px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List Items */}
          <div className="flex flex-col gap-3">
            {[
              { title: t.practice30, icon: <div className="font-bold text-[#2b576b] tracking-wider text-sm flex flex-col leading-none"><span>30</span><span className="text-[8px]">IIII</span></div>, path: '/training/fragen' },
              { title: t.allThemes, icon: <List size={22} className="text-[#2b576b]" />, path: '/training/fragen?filter=all' },
              { title: t.focusAreas, icon: <CheckCircle size={22} className="text-[#7cb342]" />, path: '/training/fragen?filter=focus' },
              { title: t.searchQuestions, icon: <CheckCircle size={22} className="text-[#7cb342]" />, path: '/training/fragen' },
              { title: `${wrongCount} ${t.lastErrors}`, icon: <CheckCircle size={22} className="text-[#e53935]" />, path: '/training/fragen?filter=errors' },
              { title: `${user?.savedQuestions?.length || 0} ${t.markedQuestions}`, icon: <Star size={22} className="text-[#fbc02d]" />, path: '/training/fragen?filter=marked' },
            ].map((item, idx) => (
              <button 
                key={idx}
                onClick={() => onNavigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
                  cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b'
                }}
              >
                <div className="flex items-center gap-4">
                  {item.icon}
                  <span style={{fontSize: 'calc(15px * var(--text-scale, 1))', fontWeight: '400'}}>{item.title}</span>
                </div>
                <ChevronRight size={18} opacity={0.5} />
              </button>
            ))}
          </div>

        </div>
        </div>
      </div>
    </div>
  );
};
