import React from 'react';
import { ChevronLeft, ChevronRight, Menu, BarChart3, List, CheckCircle } from 'lucide-react';
import { questions } from '../data/questions';

export const TrainingDashboard = ({ user, onNavigate, onShowLogin, languageMode = 'both' }) => {
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
        <div className="relative flex justify-center items-center w-[240px] h-[240px] flex-shrink-0">
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
              strokeLinecap="butt"
              strokeDasharray={2 * Math.PI * 80}
              strokeDashoffset={2 * Math.PI * 80 - (fitPercent / 100) * (2 * Math.PI * 80)}
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
            
            {/* Middle Yellow Ring: Mind. 1x geübt */}
            <circle 
              cx="100" cy="100" r="66" 
              fill="none" 
              stroke="#fbc02d" 
              strokeWidth="12" 
              strokeLinecap="butt"
              strokeDasharray={2 * Math.PI * 66}
              strokeDashoffset={2 * Math.PI * 66 - (answeredPercent / 100) * (2 * Math.PI * 66)}
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />

            {/* Inner Red Ring: Zuletzt falsch */}
            <circle 
              cx="100" cy="100" r="52" 
              fill="none" 
              stroke="#e53935" 
              strokeWidth="12" 
              strokeLinecap="butt"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 - (wrongPercent / 100) * (2 * Math.PI * 52)}
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
            
            {/* Inner White Center */}
            <circle cx="100" cy="100" r="45" fill="white" />
          </svg>
          
          {/* Center Text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div style={{fontSize: '32px', fontWeight: '600', color: '#7cb342', lineHeight: '1', marginTop: '10px'}}>{fitPercent.toFixed(1)}%</div>
            <div style={{fontSize: '11px', color: '#546e7a', marginTop: '6px', fontWeight: '500'}}>
              {t.fit}
            </div>
            <BarChart3 size={16} color="#546e7a" className="mt-1" />
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
            <div style={{fontSize: '22px', color: '#546e7a', fontWeight: '400'}}>
              {t.training}
            </div>
          </div>

          {/* List Items */}
          <div className="flex flex-col gap-3">
            {[
              { title: t.practice30, icon: <div className="font-bold text-[#2b576b] tracking-wider text-sm flex flex-col leading-none"><span>30</span><span className="text-[8px]">IIII</span></div>, path: '/training/fragen' },
              { title: t.allThemes, icon: <List size={22} className="text-[#2b576b]" />, path: '/training/fragen' },
              { title: t.focusAreas, icon: <CheckCircle size={22} className="text-[#7cb342]" />, path: '/training/fragen' },
              { title: t.searchQuestions, icon: <CheckCircle size={22} className="text-[#7cb342]" />, path: '/training/fragen' },
              { title: `0 ${t.lastErrors}`, icon: <CheckCircle size={22} className="text-[#7cb342]" />, path: '/training/fragen' },
              { title: `0 ${t.markedQuestions}`, icon: <CheckCircle size={22} className="text-[#7cb342]" />, path: '/training/fragen' },
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
                  <span style={{fontSize: '15px', fontWeight: '400'}}>{item.title}</span>
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
