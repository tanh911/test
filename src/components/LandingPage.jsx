import React from 'react';
import { BookOpen, Award, BarChart3, Settings, ChevronRight, HelpCircle } from 'lucide-react';
import { questions } from '../data/questions';

export const LandingPage = ({ user, onNavigate, onShowLogin, languageMode = 'both', onLanguageChange }) => {
  const t = (vi, de) => {
    if (languageMode === 'vi') return vi;
    if (languageMode === 'de') return de;
    return `${vi} / ${de}`;
  };

  // Calculate real progress
  const totalQuestions = questions.length;
  const progressEntries = user?.progress ? Object.values(user.progress) : [];
  const answeredCount = progressEntries.filter(p => p.answered).length;
  const correctCount = progressEntries.filter(p => p.isCorrect).length;
  const wrongCount = progressEntries.filter(p => p.answered && !p.isCorrect).length;

  const answeredPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const fitPercent = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const wrongPercent = totalQuestions > 0 ? (wrongCount / totalQuestions) * 100 : 0;

  return (
    <div className="flex flex-col min-h-full bg-[#f4f7f9]" style={{fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"}}>


      {/* Main Responsive Content */}
      <style>{`
        .landing-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 60px;
          padding: 32px 24px;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          flex: 1;
        }

        @media (max-width: 860px) {
          .landing-container {
            flex-direction: column;
            padding: 24px 16px;
            gap: 32px;
            align-items: center;
          }
        }
      `}</style>
      
      <div className="landing-container">

        {/* Left Side: Progress Circle */}
        <div className="relative flex justify-center items-center w-[240px] h-[240px] flex-shrink-0">
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
              {t('Sẵn sàng thi', 'Fit für Prüfung')}
            </div>
          </div>
        </div>

        {/* Right Side: Content & Grid */}
        <div className="flex flex-col w-full max-w-sm gap-6 z-10">
          
          {/* Info Text */}
          <div className="text-center">
            <div style={{fontSize: '20px', color: '#7cb342', fontWeight: '400', marginBottom: '8px'}}>Klasse B</div>
            <div style={{fontSize: '15px', color: '#2b576b', fontWeight: '500'}}>
              {t('Kỳ thi từ 01.04.2025', 'Prüfung ab 01.04.2025')}
            </div>
          </div>

          {/* 2x2 Navigation Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            {/* Training */}
            <button onClick={() => onNavigate('/training')} style={{
                background: '#2b576b', border: 'none', borderRadius: '4px', padding: '24px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: 'pointer', transition: 'opacity 0.2s', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
              <BookOpen size={28} strokeWidth={1.5} />
              <span style={{fontSize: '14px', fontWeight: '400'}}>
                {t('Học tập', 'Training')}
              </span>
            </button>

            {/* Prüfung */}
            <button onClick={() => onNavigate('/pruefung')} style={{
                background: '#2b576b', border: 'none', borderRadius: '4px', padding: '24px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: 'pointer', transition: 'opacity 0.2s', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
              <Award size={28} strokeWidth={1.5} />
              <span style={{fontSize: '14px', fontWeight: '400'}}>
                {t('Thi thử', 'Prüfung')}
              </span>
            </button>

            {/* Statistik */}
            <button onClick={() => onNavigate('/statistik')} style={{
                background: '#2b576b', border: 'none', borderRadius: '4px', padding: '24px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: 'pointer', transition: 'opacity 0.2s', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
              <BarChart3 size={28} strokeWidth={1.5} />
              <span style={{fontSize: '14px', fontWeight: '400'}}>
                {t('Thống kê', 'Statistik')}
              </span>
            </button>

            {/* Hilfe & Kontakt */}
            <button onClick={() => onNavigate('/chat')} style={{
                background: '#2b576b', border: 'none', borderRadius: '4px', padding: '24px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: 'pointer', transition: 'opacity 0.2s', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
              <HelpCircle size={28} strokeWidth={1.5} />
              <span style={{fontSize: '14px', fontWeight: '400'}}>
                {t('Trợ giúp', 'Hilfe & Kontakt')}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button onClick={() => onNavigate('/settings')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b'
            }}>
              <div className="flex items-center gap-4">
                <Settings size={20} strokeWidth={1.5} />
                <span style={{fontSize: '14px', fontWeight: '400'}}>
                  {t('Cài đặt', 'Einstellungen')}
                </span>
              </div>
              <ChevronRight size={18} opacity={0.5} />
            </button>
            
            <button style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b'
            }}>
              <div className="flex items-center gap-4">
                <div style={{width: '20px', height: '20px', background: '#7cb342', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span style={{fontSize: '14px', fontWeight: '400'}}>
                  {t('Mở khóa', 'Freischalten')}
                </span>
              </div>
              <ChevronRight size={18} opacity={0.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
