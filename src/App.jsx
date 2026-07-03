import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { TrainingDashboard } from './components/TrainingDashboard';
import { Auth } from './components/Auth';
import { Lernen } from './components/Lernen';
import { Pruefung } from './components/Pruefung';
import { Help } from './components/Help';
import { Stats } from './components/Stats';
import { Settings } from './components/Settings';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { DrivingSimulation } from './components/DrivingSimulation';
import { AdminDashboard } from './components/AdminDashboard';
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
          ? <img src={opt.src} alt={opt.alt} style={{ width: '28px', height: '20px', objectFit: 'cover', borderRadius: '3px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
          : <span style={{ fontSize: 'calc(11px * var(--text-scale, 1))', fontWeight: '900' }}>{opt.label}</span>
        }
      </button>
    ))}
  </div>
);

const ZOOM_OPTS = [
  { mode: 'normal', label: 'A', title: 'Cỡ chữ thường / Standard' },
  { mode: 'large', label: 'A⁺', title: 'Cỡ chữ lớn / Groß' },
  { mode: 'xlarge', label: 'A⁺⁺', title: 'Cỡ chữ rất lớn / Sehr groß' }
];

const ZoomPill = ({ fontSizeMode, onChange }) => (
  <div className="navbar-zoom-pill">
    {ZOOM_OPTS.map((opt) => (
      <button
        key={opt.mode}
        onClick={() => onChange(opt.mode)}
        className={`navbar-zoom-btn${fontSizeMode === opt.mode ? ' active' : ''}`}
        title={opt.title}
        style={{
          fontSize: opt.mode === 'normal' ? '12px' : opt.mode === 'large' ? '14px' : '16px'
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// ── Top Navbar ───────────────────────────────────────────────────────────────

const Navbar = ({ location, navigate, languageMode, setLanguageMode, user, onShowLogin, onLogout, fontSizeMode, onZoomChange, isAdmin }) => {
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
          <img src="/newicon.jpg" alt="Logo" style={{ width: 'calc(32px * var(--text-scale, 1))', height: 'calc(32px * var(--text-scale, 1))', borderRadius: '8px', objectFit: 'cover' }} />
          <div>
            <span className="navbar-brand-name">Führerschein</span>
            <span className="navbar-brand-sub"> Việt-Đức</span>
          </div>
        </button>

        {/* Right side: lang + auth */}
        <div className="navbar-right">
          <ZoomPill fontSizeMode={fontSizeMode} onChange={onZoomChange} />
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
              {isAdmin && (
                <button
                  className="navbar-auth-btn ghost"
                  onClick={() => navigate('/admin')}
                  title="Admin Dashboard"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  🛡️ Admin
                </button>
              )}
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [fontSizeMode, setFontSizeMode] = useState(() =>
    localStorage.getItem('fuhrerschein_font_size') || 'normal'
  );

  // Close login modal automatically when user successfully logs in
  useEffect(() => {
    if (user && !user.isGuest) {
      setShowLoginModal(false);
    }
  }, [user]);

  useEffect(() => {
    const scale = fontSizeMode === 'large' ? '1.15' : fontSizeMode === 'xlarge' ? '1.3' : '1';
    
    // Toggle class names on documentElement
    const root = document.documentElement;
    root.classList.remove('zoom-normal', 'zoom-large', 'zoom-xlarge');
    root.classList.add(`zoom-${fontSizeMode}`);
    
    // Set style property as fallback
    root.style.setProperty('--text-scale', scale);
  }, [fontSizeMode]);

  const navigate = useNavigate();
  const location = useLocation();

  // Session restore & Firebase sync
  useEffect(() => {
    const restore = async () => {
      // 1. Check local session first
      const savedSession = localStorage.getItem('fuhrerschein_active_session');
      if (savedSession) {
        try { setUser(JSON.parse(savedSession)); } catch {}
      } else {
        setUser({ username: 'guest', displayName: 'Khách Học Thử', email: '', apiKey: '', savedQuestions: [], examHistory: [], progress: {}, isGuest: true });
      }

      // 2. Listen to Firebase Auth state
      import('./lib/firebase').then(({ auth, db }) => {
        import('firebase/auth').then(({ onAuthStateChanged }) => {
          import('firebase/firestore').then(({ doc, getDoc, setDoc }) => {
            onAuthStateChanged(auth, async (firebaseUser) => {
              if (firebaseUser) {
                try {
                  // User is signed in via Firebase
                  const userRef = doc(db, 'users', firebaseUser.uid);
                  const docSnap = await getDoc(userRef);
                  
                  if (docSnap.exists()) {
                    // Load progress from DB
                    const dbData = docSnap.data();
                    const updatedUser = {
                      username: `firebase_${firebaseUser.uid}`,
                      displayName: firebaseUser.displayName || 'Học viên',
                      email: firebaseUser.email || '',
                      savedQuestions: dbData.savedQuestions || [],
                      examHistory: dbData.examHistory || [],
                      progress: dbData.progress || {},
                      isGuest: false,
                      uid: firebaseUser.uid
                    };
                    setUser(updatedUser);
                    localStorage.setItem('fuhrerschein_active_session', JSON.stringify(updatedUser));
                  } else {
                    // New user, create empty progress in DB
                    const newUser = {
                      username: `firebase_${firebaseUser.uid}`,
                      displayName: firebaseUser.displayName || 'Học viên',
                      email: firebaseUser.email || '',
                      savedQuestions: [],
                      examHistory: [],
                      progress: {},
                      isGuest: false,
                      uid: firebaseUser.uid
                    };
                    await setDoc(userRef, {
                      email: newUser.email,
                      displayName: newUser.displayName,
                      savedQuestions: newUser.savedQuestions,
                      examHistory: newUser.examHistory,
                      progress: newUser.progress,
                      createdAt: new Date().toISOString()
                    });
                    setUser(newUser);
                    localStorage.setItem('fuhrerschein_active_session', JSON.stringify(newUser));
                  }
                } catch (err) {
                  console.error("Firebase DB Error:", err);
                  // Bỏ qua lỗi DB và fallback về local user session nếu không có quyền
                }
              }
            });
          });
        });
      });

      setUserLoading(false);
    };
    restore();
  }, []);

  const handleUpdateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('fuhrerschein_active_session', JSON.stringify(updated));
    
    // Sync to Firestore if logged in
    if (updated.uid) {
      import('./lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, updateDoc }) => {
          const userRef = doc(db, 'users', updated.uid);
          updateDoc(userRef, {
            savedQuestions: updated.savedQuestions,
            examHistory: updated.examHistory,
            progress: updated.progress
          }).catch(console.error);
        });
      });
    }

    if (updated.username !== 'guest' && !updated.uid) {
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
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    clearToken();
    setUser({ username: 'guest', displayName: 'Khách Học Thử', email: '', apiKey: '', savedQuestions: [], examHistory: [], progress: {}, isGuest: true });
    
    // Sign out from Firebase Auth to ensure total logout
    import('./lib/firebase').then(({ auth }) => {
      import('firebase/auth').then(({ signOut }) => {
        signOut(auth).catch(err => console.error("Firebase SignOut Error:", err));
      });
    });

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
        <img src="/newicon.jpg" alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '16px', objectFit: 'cover' }} />
        <div style={{ fontSize: 'calc(14px * var(--text-scale, 1))', color: '#6b7280', fontWeight: '600' }}>Đang tải...</div>
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
        fontSizeMode={fontSizeMode}
        isAdmin={!!(user?.email && user.email.trim().toLowerCase() === 'bossfc69@gmail.com')}
        onZoomChange={(mode) => {
          setFontSizeMode(mode);
          localStorage.setItem('fuhrerschein_font_size', mode);
        }}
      />

      {/* Page content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={
            <LandingPage
              user={user}
              onNavigate={(p, opts) => navigate(p, opts)}
              onShowLogin={() => setShowLoginModal(true)}
              languageMode={languageMode}
              onLanguageChange={(mode) => { setLanguageMode(mode); localStorage.setItem('fuhrerschein_lang_mode', mode); }}
            />
          } />
          <Route path="/training" element={<TrainingDashboard user={user} onUpdateUser={handleUpdateUser} onNavigate={(p, opts) => navigate(p, opts)} onShowLogin={() => setShowLoginModal(true)} languageMode={languageMode} />} />
          <Route path="/training/fragen" element={<Lernen user={user} onUpdateUser={handleUpdateUser} onTriggerLogin={() => setShowLoginModal(true)} onNavigate={(p, opts) => navigate(p, opts)} languageMode={languageMode} />} />
          <Route path="/pruefung/*" element={<Pruefung user={user} onUpdateUser={handleUpdateUser} onTriggerLogin={() => setShowLoginModal(true)} languageMode={languageMode} />} />
          <Route path="/statistik" element={<Stats user={user} onUpdateUser={handleUpdateUser} />} />
          <Route path="/help" element={<Help user={user} languageMode={languageMode} onNavigate={(p, opts) => navigate(p, opts)} />} />
          <Route path="/settings" element={<Settings user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />} />
          <Route path="/privacy" element={<PrivacyPolicy onNavigate={navigate} />} />
          <Route path="/simulation" element={<DrivingSimulation languageMode={languageMode} />} />
          <Route path="/admin" element={<AdminDashboard user={user} onNavigate={navigate} />} />
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
      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '14px', padding: '28px 24px', maxWidth: '360px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: 'calc(36px * var(--text-scale, 1))', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: 'calc(17px * var(--text-scale, 1))', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              {languageMode === 'de' ? 'Abmelden?' : (languageMode === 'vi' ? 'Đăng xuất?' : 'Đăng xuất? / Abmelden?')}
            </h3>
            <p style={{ fontSize: 'calc(13px * var(--text-scale, 1))', color: '#6b7280', lineHeight: '1.5', marginBottom: '24px' }}>
              {languageMode === 'de' 
                ? 'Möchten Sie sich wirklich abmelden?' 
                : (languageMode === 'vi' ? 'Bạn có chắc chắn muốn thoát ra ngoài (đăng xuất) không?' : 'Bạn có chắc chắn muốn thoát ra ngoài không? / Möchten Sie sich wirklich abmelden?')}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: 'white', fontWeight: '700', fontSize: 'calc(14px * var(--text-scale, 1))', cursor: 'pointer', color: '#374151' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                {languageMode === 'de' ? 'Zurück' : (languageMode === 'vi' ? 'Trở lại' : 'Trở lại / Zurück')}
              </button>
              <button
                onClick={confirmLogout}
                style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', background: '#e50000', fontWeight: '700', fontSize: 'calc(14px * var(--text-scale, 1))', cursor: 'pointer', color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {languageMode === 'de' ? 'Ja, abmelden' : (languageMode === 'vi' ? 'Có, đăng xuất' : 'Có / Ja')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
