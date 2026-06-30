import React, { useState } from 'react';
import { BookOpen, Award, BarChart3, Settings, ChevronRight, HelpCircle, X, MessageCircle, Sparkles } from 'lucide-react';
import { questions } from '../data/questions';
import { SupportModal } from './SupportModal';
import { AIChat } from './AIChat';

export const LandingPage = ({ user, onNavigate, onShowLogin, languageMode = 'both', onLanguageChange }) => {
  const t = (vi, de) => {
    if (languageMode === 'vi') return vi;
    if (languageMode === 'de') return de;
    return `${vi} / ${de}`;
  };

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAIChatModal, setShowAIChatModal] = useState(false);

  // Calculate real progress
  const totalQuestions = questions.length;
  const progressEntries = user?.progress ? Object.values(user.progress) : [];
  const answeredCount = progressEntries.filter(p => p.answered).length;
  const correctCount = progressEntries.filter(p => p.isCorrect).length;
  const wrongCount = progressEntries.filter(p => p.answered && !p.isCorrect).length;

  const answeredPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const fitPercent = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const wrongPercent = totalQuestions > 0 ? (wrongCount / totalQuestions) * 100 : 0;

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

  React.useEffect(() => {
    if (showAIChatModal || showSupportModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAIChatModal, showSupportModal]);

  return (
    <div className="flex flex-col min-h-full bg-[#f4f7f9]" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} languageMode={languageMode} />

      {/* AI Chat Modal */}
      {showAIChatModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '448px', height: '80vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              position: 'relative', padding: '16px', textAlign: 'center', borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(to bottom right, #eff6ff, #dbeafe)'
            }}>
              <button
                onClick={() => setShowAIChatModal(false)}
                style={{
                  position: 'absolute', top: '12px', right: '12px', padding: '8px', color: '#6b7280',
                  backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '9999px', border: 'none', cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {t('TRỢ LÝ HỌC TẬP', 'KI-Tutor')}
              </h2>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <AIChat user={user} />
            </div>
          </div>
        </div>
      )}

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
        <div className="relative flex justify-center items-center w-[280px] h-[280px] flex-shrink-0">
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
              {t('Sẵn sàng thi', 'Fit für Prüfung')}
            </div>
          </div>
        </div>

        {/* Right Side: Content & Grid */}
        <div className="flex flex-col w-full max-w-sm gap-6 z-10">

          {/* Info Text */}
          <div className="text-center">
            <div style={{ fontSize: 'calc(20px * var(--text-scale, 1))', color: '#7cb342', fontWeight: '400', marginBottom: '8px' }}>Klasse B</div>
            <div style={{ fontSize: 'calc(15px * var(--text-scale, 1))', color: '#2b576b', fontWeight: '500' }}>
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
              <span style={{ fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '400' }}>
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
              <span style={{ fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '400' }}>
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
              <span style={{ fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '400' }}>
                {t('Thống kê', 'Statistik')}
              </span>
            </button>

            {/* Hilfe & Kontakt */}
            <button onClick={() => onNavigate('/help')} style={{
              background: '#2b576b', border: 'none', borderRadius: '4px', padding: '24px 16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
              cursor: 'pointer', transition: 'opacity 0.2s', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <HelpCircle size={28} strokeWidth={1.5} />
              <span style={{ fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '400' }}>
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
                <span style={{ fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '400' }}>
                  {t('Cài đặt', 'Einstellungen')}
                </span>
              </div>
              <ChevronRight size={18} opacity={0.5} />
            </button>

            <button onClick={() => setShowSupportModal(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b'
            }}>
              <div className="flex items-center gap-4">
                <div style={{ width: '20px', height: '20px', background: '#7cb342', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span style={{ fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '400' }}>
                  {t('Ủng hộ', 'Unterstützen')}
                </span>
              </div>
              <ChevronRight size={18} opacity={0.5} />
            </button>

            <button onClick={() => setShowAIChatModal(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b'
            }}>
              <div className="flex items-center gap-4">
                <div style={{ width: '20px', height: '20px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={12} color="white" strokeWidth={3} />
                </div>
                <span style={{ fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '400' }}>
                  {t('TRỢ LÝ HỌC TẬP', 'KI-Tutor')}
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

