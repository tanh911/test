import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { MobileFrame } from './components/MobileFrame';
import { LandingPage } from './components/LandingPage';
import { TrainingDashboard } from './components/TrainingDashboard';
import { Auth } from './components/Auth';
import { Lernen } from './components/Lernen';
import { Pruefung } from './components/Pruefung';
import { AIChat } from './components/AIChat';
import { Stats } from './components/Stats';
import { Settings } from './components/Settings';
import { 
  BookOpen, Award, MessageSquare, Bookmark, Settings as SettingsIcon
} from 'lucide-react';

function App() {
  const [user, setUser] = useState(() => {
    const savedSession = localStorage.getItem('fuhrerschein_active_session');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        // Handle parse error
      }
    }
    return {
      username: 'guest',
      displayName: 'Khách Học Thử',
      email: '',
      apiKey: '',
      savedQuestions: [],
      examHistory: [],
      progress: {},
      isGuest: true
    };
  });
  const [languageMode, setLanguageMode] = useState(() => {
    return localStorage.getItem('fuhrerschein_lang_mode') || 'both'; // 'de', 'vi', 'both'
  });
  const navigate = useNavigate();
  const location = useLocation();

  const [showAuthPage, setShowAuthPage] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Update user state and persist both in active session & user account list
  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('fuhrerschein_active_session', JSON.stringify(updatedUser));

    // Update in central accounts database
    if (updatedUser.username !== 'guest') {
      const users = JSON.parse(localStorage.getItem('fuhrerschein_users') || '{}');
      if (users[updatedUser.username.toLowerCase()]) {
        users[updatedUser.username.toLowerCase()] = {
          ...users[updatedUser.username.toLowerCase()],
          displayName: updatedUser.displayName,
          email: updatedUser.email,
          apiKey: updatedUser.apiKey,
          savedQuestions: updatedUser.savedQuestions,
          examHistory: updatedUser.examHistory,
          progress: updatedUser.progress
        };
        localStorage.setItem('fuhrerschein_users', JSON.stringify(users));
      }
    }
  };

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem('fuhrerschein_active_session', JSON.stringify(loggedInUser));
    navigate('/training');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('fuhrerschein_active_session');
  };

  const handleStartLearning = () => {
    const guestUser = {
      username: 'guest',
      displayName: 'Khách Học Thử',
      email: '',
      apiKey: '',
      savedQuestions: [],
      examHistory: [],
      progress: {},
      isGuest: true
    };
    handleLogin(guestUser);
  };

  return (
    <MobileFrame>
      {/* Brand Header - only show if NOT on home page, because home page has its own header */}
      {location.pathname !== '/' && (
        <div className="shrink-0" style={{
          background: 'linear-gradient(135deg, #1a4a5e 0%, #2b6f8a 50%, #1a4a5e 100%)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span style={{fontSize: '18px'}}>🚦</span>
            <span style={{color: 'white', fontSize: '14px', fontWeight: '700', letterSpacing: '0.03em'}}>
              Führerschein <span style={{fontWeight: '300', opacity: 0.85}}>Việt-Đức</span>
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Language Switcher */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              padding: '3px 6px', 
              borderRadius: '20px', 
              border: '1px solid rgba(255,255,255,0.15)' 
            }}>
              <button
                onClick={() => {
                  setLanguageMode('de');
                  localStorage.setItem('fuhrerschein_lang_mode', 'de');
                }}
                style={{
                  fontSize: '15px',
                  opacity: languageMode === 'de' ? 1 : 0.4,
                  transform: languageMode === 'de' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  padding: '2px 4px'
                }}
                title="Only German / Chỉ Tiếng Đức"
              >
                <img src="/german.svg" alt="DE" style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }} />
              </button>
              <button
                onClick={() => {
                  setLanguageMode('both');
                  localStorage.setItem('fuhrerschein_lang_mode', 'both');
                }}
                style={{
                  fontSize: '11px',
                  fontWeight: '900',
                  color: 'white',
                  opacity: languageMode === 'both' ? 1 : 0.4,
                  transform: languageMode === 'both' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  padding: '2px 4px'
                }}
                title="Bilingual / Song ngữ Đức-Việt"
              >
                DE/VI
              </button>
              <button
                onClick={() => {
                  setLanguageMode('vi');
                  localStorage.setItem('fuhrerschein_lang_mode', 'vi');
                }}
                style={{
                  fontSize: '15px',
                  opacity: languageMode === 'vi' ? 1 : 0.4,
                  transform: languageMode === 'vi' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  padding: '2px 4px'
                }}
                title="Only Vietnamese / Chỉ Tiếng Việt"
              >
                <img src="/vn.svg" alt="VN" style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }} />
              </button>
            </div>

            {user.isGuest ? (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                Đăng nhập
              </button>
            ) : (
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.8)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
                title="Đăng xuất"
              >
                Thoát
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full">
        <Routes>
          <Route path="/" element={<LandingPage onNavigate={(path) => navigate(path)} onShowLogin={() => setShowLoginModal(true)} />} />
          <Route path="/training" element={<TrainingDashboard onNavigate={(path) => navigate(path)} onShowLogin={() => setShowLoginModal(true)} />} />
          <Route path="/training/fragen" element={<Lernen user={user} onUpdateUser={handleUpdateUser} onTriggerLogin={() => setShowLoginModal(true)} onNavigate={(path) => navigate(path)} languageMode={languageMode} />} />
          <Route path="/pruefung" element={<Pruefung user={user} onUpdateUser={handleUpdateUser} languageMode={languageMode} />} />
          <Route path="/statistik" element={<Stats user={user} onUpdateUser={handleUpdateUser} />} />
          <Route path="/chat" element={
            user.isGuest ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center space-y-4 bg-gray-50">
                <span className="w-2 h-2 bg-[#15803D] rounded-full animate-pulse"></span>
                <h3 className="text-sm font-extrabold uppercase font-sans tracking-wider text-gray-900">Yêu Cầu Đăng Nhập</h3>
                <p className="text-[13px] font-sans font-bold text-gray-600 leading-relaxed max-w-[280px]">
                  Tính năng Gia sư AI (Gemini Assistant) chỉ khả dụng với tài khoản học viên chính thức.
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-5 py-3 bg-[#15803D] hover:bg-[#166534] text-white font-sans font-extrabold text-xs uppercase tracking-widest transition-colors rounded-xl shadow-xs"
                >
                  Đăng nhập bằng Google / Facebook
                </button>
              </div>
            ) : (
              <AIChat user={user} />
            )
          } />
          <Route path="/settings" element={<Settings user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />} />
          {/* Default fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Floating Auth Modal Overlay */}
        {showLoginModal && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-card border border-border rounded-lg p-2 relative no-scrollbar shadow-lg">
              <Auth 
                onLogin={(u) => {
                  handleLogin(u);
                  setShowLoginModal(false);
                }} 
                onCancel={() => setShowLoginModal(false)} 
                
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="nav-tab-bar shrink-0 z-30 md:hidden">
        <button 
          onClick={() => navigate('/')} 
          className={`nav-tab-btn ${location.pathname === '/' ? 'active' : ''}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span>HOME</span>
        </button>

        <button 
          onClick={() => navigate('/training')} 
          className={`nav-tab-btn ${location.pathname.startsWith('/training') ? 'active' : ''}`}
        >
          <BookOpen />
          <span>HỌC TẬP</span>
        </button>

        <button 
          onClick={() => navigate('/pruefung')} 
          className={`nav-tab-btn ${location.pathname === '/pruefung' ? 'active' : ''}`}
        >
          <Award />
          <span>THI THỬ</span>
        </button>

        <button 
          onClick={() => navigate('/chat')} 
          className={`nav-tab-btn ${location.pathname === '/chat' ? 'active' : ''}`}
        >
          <MessageSquare />
          <span>GIA SƯ AI</span>
        </button>

        <button 
          onClick={() => navigate('/settings')} 
          className={`nav-tab-btn ${location.pathname === '/settings' ? 'active' : ''}`}
        >
          <SettingsIcon />
          <span>CÀI ĐẶT</span>
        </button>
      </div>
    </MobileFrame>
  );
}

export default App;
