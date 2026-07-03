import React, { useState } from 'react';
import { BookOpen, Award, BarChart3, Settings, ChevronRight, HelpCircle, X, MessageCircle, Sparkles, Video, Lightbulb, Gamepad2 } from 'lucide-react';
import { questions } from '../data/questions';
import { SupportModal } from './SupportModal';
import { AIChat } from './AIChat';
import { PraxisVideos } from './PraxisVideos';
import { TheoryTips } from './TheoryTips';

export const LandingPage = ({ user, onNavigate, onShowLogin, languageMode = 'both', onLanguageChange }) => {
  const t = (vi, de) => {
    if (languageMode === 'vi') return vi;
    if (languageMode === 'de') return de;
    return `${vi} / ${de}`;
  };

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAIChatModal, setShowAIChatModal] = useState(false);
  const [showPraxisModal, setShowPraxisModal] = useState(false);
  const [showTheoryTipsModal, setShowTheoryTipsModal] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);

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
    if (showAIChatModal || showSupportModal || showPraxisModal || showTheoryTipsModal || showSimulatorModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAIChatModal, showSupportModal, showPraxisModal, showTheoryTipsModal]);

  return (
    <div className="flex flex-col min-h-full bg-[#f4f7f9]" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} languageMode={languageMode} />

      {/* AI Chat Modal */}
      {showAIChatModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '80px 16px 16px 16px'
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

      {/* Praxis Videos Modal */}
      {showPraxisModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '80px 16px 16px 16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '500px', height: '85vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              position: 'relative', padding: '16px', textAlign: 'center', borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)'
            }}>
              <button
                onClick={() => setShowPraxisModal(false)}
                style={{
                  position: 'absolute', top: '12px', right: '12px', padding: '8px', color: '#6b7280',
                  backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '9999px', border: 'none', cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#334155', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Video size={20} />
                {t('VIDEO THỰC HÀNH', 'Praxisvideos')}
              </h2>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <PraxisVideos />
            </div>
          </div>
        </div>
      )}

      {/* Theory Tips Modal */}
      {showTheoryTipsModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '80px 16px 16px 16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '500px', height: '85vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0d9488', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={20} style={{ flexShrink: 0 }} />
                <span>{t('MẸO HỌC LÝ THUYẾT', 'Theorie-Tricks')}</span>
              </h2>
              <button
                onClick={() => setShowTheoryTipsModal(false)}
                style={{
                  padding: '8px', color: '#6b7280', backgroundColor: 'rgba(255,255,255,0.8)',
                  borderRadius: '9999px', border: 'none', cursor: 'pointer', flexShrink: 0
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <TheoryTips />
            </div>
          </div>
        </div>
      )}

      {/* Simulator Modal */}
      {showSimulatorModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px', width: '90%', maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', padding: '24px', textAlign: 'center'
          }} className="animate-fade-in">
            <div style={{ width: '60px', height: '60px', background: '#f3e8ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Gamepad2 size={32} color="#9c27b0" strokeWidth={2} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              {t('Tính năng đang phát triển', 'In Entwicklung')}
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
              {t('Module giả lập lái xe 3D và các bài thực hành sa hình đang được đội ngũ xây dựng. Vui lòng quay lại sau nhé!', 'Das 3D-Fahrsimulator-Modul und die praktischen Übungen werden derzeit entwickelt. Bitte kommen Sie später wieder!')}
            </p>
            <button
              onClick={() => setShowSimulatorModal(false)}
              style={{
                width: '100%', padding: '12px', background: '#9c27b0', color: 'white',
                border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              {t('Đóng', 'Schließen')}
            </button>
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
            <div style={{ fontSize: 'calc(20px * var(--text-scale, 1))', color: '#7cb342', fontWeight: '400', marginBottom: '8px' }}>
              {t('Chào mừng bạn đến', 'Willkommen beim')}
            </div>
            <div style={{ fontSize: 'calc(15px * var(--text-scale, 1))', color: '#2b576b', fontWeight: '500' }}>
              {t('Lớp luyện thi lý thuyết online', 'Online-Theorietraining')}
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
            <button onClick={() => setShowTheoryTipsModal(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b'
            }}>
              <div className="flex items-center gap-4">
                <div style={{ width: '20px', height: '20px', background: '#0d9488', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lightbulb size={12} color="white" strokeWidth={3} />
                </div>
                <span style={{ fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '400' }}>
                  {t('MẸO HỌC LÝ THUYẾT', 'Theorie-Tricks')}
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

            <button onClick={() => setShowPraxisModal(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b'
            }}>
              <div className="flex items-center gap-4">
                <div style={{ width: '20px', height: '20px', background: '#eab308', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={12} color="white" strokeWidth={3} />
                </div>
                <span style={{ fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '400' }}>
                  {t('VIDEO THỰC HÀNH THEO CHỦ ĐỀ', 'Praxis-Tipps')}
                </span>
              </div>
              <ChevronRight size={18} opacity={0.5} />
            </button>

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

            <button onClick={() => setShowSimulatorModal(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#f3f4f6', border: '1.5px dashed #d1d5db', borderRadius: '4px', padding: '16px 20px',
              cursor: 'pointer', boxShadow: 'none', color: '#9ca3af', position: 'relative', overflow: 'hidden'
            }}>
              <div className="flex items-center gap-4">
                <Gamepad2 size={20} strokeWidth={1.5} color="#9ca3af" />
                <span style={{ fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '400' }}>
                  {t('Mô phỏng lái xe', 'Fahrsimulator')}
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: '700', background: '#fef3c7', color: '#d97706',
                  padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.05em', textTransform: 'uppercase'
                }}>🔒 {t('Sắp ra mắt', 'Demnächst')}</span>
              </div>
              <ChevronRight size={18} opacity={0.3} />
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
          </div>
        </div>
      </div>
    </div>
  );
};

