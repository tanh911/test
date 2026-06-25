import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { TrainingDashboard } from './components/TrainingDashboard';
import { Auth } from './components/Auth';
import { Lernen } from './components/Lernen';
import { Pruefung } from './components/Pruefung';
import { AIChat } from './components/AIChat';
import { Stats } from './components/Stats';
import { Settings } from './components/Settings';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { verifyToken, clearToken } from './lib/auth';
import { LogIn, LogOut } from 'lucide-react';

// ── Nav config ──────────────────────────────────────────────────────────────



// ── Language toggle ──────────────────────────────────────────────────────────


const LANG_OPTS = [
  { mode: 'de',   src: '/german.svg',   alt: 'DE',    title: 'Nur Deutsch' },
  { mode: 'both', src: '/germanvn.png', alt: 'DE/VI', title: 'Song ngữ Đức-Việt' },
  { mode: 'vi',   src: '/vn.svg',       alt: 'VN',    title: 'Chỉ Tiếng Việt' },
];

const LangPill = ({ languageMode, onChange }) => (
  <div className="navbar-lang-pill">
    {LANG_OPTS.map((opt) => (
      <button
        key={opt.mode}
        onClick={() => onChange(opt.mode)}
        className={`navbar-lang-btn${languageMode === opt.mode ? ' active' : ''}`}
        title={opt.title}
      >
        {opt.src
          ? <img src={opt.src} alt={opt.alt} style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />
          : <span style={{ fontSize: '11px', fontWeight: '900' }}>{opt.label}</span>
        }
      </button>
    ))}
  </div>
);

// ── Top Navbar ───────────────────────────────────────────────────────────────

const Navbar = ({ location, navigate, languageMode, setLanguageMode, user, onShowLogin, onLogout }) => {
  const menuRef = useRef(null);

  const t = (vi, de) => {
    if (languageMode === 'vi') return vi;
    if (languageMode === 'de') return de;
    return `${vi} / ${de}`;
  };


  const handleLang = (mode) => {
    setLanguageMode(mode);
    localStorage.setItem('fuhrerschein_lang_mode', mode);
  };

  return (
    <nav className="site-navbar" ref={menuRef}>
      <div className="navbar-inner">
        {/* Brand */}
        <button className="navbar-brand" onClick={() => navigate('/')}>
          <span style={{ fontSize: '22px', lineHeight: 1 }}>🚦</span>
          <div>
            <span className="navbar-brand-name">Führerschein</span>
            <span className="navbar-brand-sub"> Việt-Đức</span>
          </div>
        </button>

        {/* Right side: lang + auth */}
        <div className="navbar-right">
          <LangPill languageMode={languageMode} onChange={handleLang} />

          {user?.isGuest ? (
            <button className="navbar-auth-btn primary" onClick={onShowLogin}>
              <LogIn size={15} />
              <span>{t('Đăng nhập', 'Anmelden')}</span>
            </button>
          ) : (
            <div className="navbar-user">
              <div className="navbar-user-avatar">
                {user?.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="navbar-user-name">{user?.displayName}</span>
              <button className="navbar-auth-btn ghost" onClick={onLogout} title={t('Đăng xuất', 'Abmelden')}>
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// ── Main App ────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [languageMode, setLanguageMode] = useState(() =>
    localStorage.getItem('fuhrerschein_lang_mode') || 'both'
  );
  const [showLoginModal, setShowLoginModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Session restore
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('fuhrerschein_token');
      if (token) {
        const claims = await verifyToken(token);
        if (claims) {
          const savedSession = localStorage.getItem('fuhrerschein_active_session');
          if (savedSession) {
            try { setUser(JSON.parse(savedSession)); setUserLoading(false); return; } catch {}
          }
        }
        clearToken();
      }
      setUser({ username: 'guest', displayName: 'Khách Học Thử', email: '', apiKey: '', savedQuestions: [], examHistory: [], progress: {}, isGuest: true });
      setUserLoading(false);
    };
    restore();
  }, []);

  const handleUpdateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('fuhrerschein_active_session', JSON.stringify(updated));
    if (updated.username !== 'guest') {
      const users = JSON.parse(localStorage.getItem('fuhrerschein_users') || '{}');
      if (users[updated.username.toLowerCase()]) {
        users[updated.username.toLowerCase()] = { ...users[updated.username.toLowerCase()], ...updated };
        localStorage.setItem('fuhrerschein_users', JSON.stringify(users));
      }
    }
  };

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('fuhrerschein_active_session', JSON.stringify(u));
    navigate('/training');
  };

  const handleLogout = () => {
    clearToken();
    setUser({ username: 'guest', displayName: 'Khách Học Thử', email: '', apiKey: '', savedQuestions: [], examHistory: [], progress: {}, isGuest: true });
    navigate('/');
  };

  const t = (vi, de) => {
    if (languageMode === 'vi') return vi;
    if (languageMode === 'de') return de;
    return `${vi} / ${de}`;
  };

  if (userLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚦</div>
        <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Đang tải...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
      <Navbar
        location={location}
        navigate={navigate}
        languageMode={languageMode}
        setLanguageMode={setLanguageMode}
        user={user}
        onShowLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      {/* Page content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={
            <LandingPage
              onNavigate={(p) => navigate(p)}
              onShowLogin={() => setShowLoginModal(true)}
              languageMode={languageMode}
              onLanguageChange={(mode) => { setLanguageMode(mode); localStorage.setItem('fuhrerschein_lang_mode', mode); }}
            />
          } />
          <Route path="/training" element={<TrainingDashboard onNavigate={(p) => navigate(p)} onShowLogin={() => setShowLoginModal(true)} languageMode={languageMode} />} />
          <Route path="/training/fragen" element={<Lernen user={user} onUpdateUser={handleUpdateUser} onTriggerLogin={() => setShowLoginModal(true)} onNavigate={(p) => navigate(p)} languageMode={languageMode} />} />
          <Route path="/pruefung" element={<Pruefung user={user} onUpdateUser={handleUpdateUser} languageMode={languageMode} />} />
          <Route path="/statistik" element={<Stats user={user} onUpdateUser={handleUpdateUser} />} />
          <Route path="/chat" element={
            user?.isGuest ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px' }}>🤖</div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  {t('Yêu Cầu Đăng Nhập', 'Anmeldung erforderlich')}
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '360px', lineHeight: '1.6' }}>
                  {languageMode === 'de'
                    ? 'Die Begleiter-Funktion ist nur für registrierte Fahrschüler verfügbar.'
                    : 'Tính năng Bạn Đồng Hành chỉ khả dụng với tài khoản học viên chính thức.'}
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  style={{ padding: '12px 28px', background: '#1a4a5e', color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <LogIn size={16} />
                  {t('Đăng nhập', 'Anmelden')}
                </button>
              </div>
            ) : <AIChat user={user} />
          } />
          <Route path="/settings" element={<Settings user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />} />
          <Route path="/privacy" element={<PrivacyPolicy onNavigate={navigate} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <Auth
              onLogin={(u) => { handleLogin(u); setShowLoginModal(false); }}
              onCancel={() => setShowLoginModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
