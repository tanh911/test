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
import { SimDevPage } from './components/SimDevPage.jsx';
import { AdminDashboard } from './components/AdminDashboard';
import { verifyToken, clearToken } from './lib/auth';
import { LogIn, LogOut, Loader2, CheckCircle2 } from 'lucide-react';
import { SupportModal } from './components/SupportModal';
import { WelcomePopup, shouldShowPopup } from './components/WelcomePopup';
import { BuyFullAccountAlert } from './components/BuyFullAccountAlert';

const SUPPORT_POPUP_KEY = 'fuhrerschein_support_popup_dismissed';
const MIN_ACCOUNT_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 ngày

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
              <span className="navbar-user-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {user?.displayName}
                {user?.isPremium && (
                  <span
                    title="Tài khoản Premium VIP"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      lineHeight: '1.2'
                    }}
                  >
                    👑 VIP
                  </span>
                )}
              </span>
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

const GUEST_USER = { username: 'guest', displayName: 'Khách Học Thử', email: '', apiKey: '', savedQuestions: [], examHistory: [], progress: {}, isGuest: true };

function App() {
  const [user, setUser] = useState(null);
  const prevUserRef = React.useRef(null);
  const [userLoading, setUserLoading] = useState(true);
  const [languageMode, setLanguageMode] = useState(() =>
    localStorage.getItem('fuhrerschein_lang_mode') || 'both'
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [fontSizeMode, setFontSizeMode] = useState(() =>
    localStorage.getItem('fuhrerschein_font_size') || 'normal'
  );
  const [simulatorEnabled, setSimulatorEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' ||
             window.location.hostname === '127.0.0.1' ||
             !!import.meta.env?.DEV;
    }
    return false;
  });
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [bannedModal, setBannedModal] = useState(null); // null hoặc { message, email, displayName }
  const [unlockEmail, setUnlockEmail] = useState('');
  const [unlockMessage, setUnlockMessage] = useState('');
  const [unlockSubmitting, setUnlockSubmitting] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  // Close modal & navigate when user transitions from guest → logged-in
  useEffect(() => {
    if (user && !user.isGuest) {
      setShowLoginModal(false);
      // Navigate to /training khi mới đăng nhập Firebase (từ guest → logged-in)
      if (prevUserRef.current?.isGuest && user.uid) {
        navigate('/training');
      }
    }
    prevUserRef.current = user;
  }, [user?.uid]);

  // Auto-show support popup: once per month, only for logged-in users with account >= 3 days old
  useEffect(() => {
    if (!user || user.isGuest) return;
    const accountAge = user.createdAt ? Date.now() - new Date(user.createdAt).getTime() : 0;
    if (accountAge >= MIN_ACCOUNT_AGE_MS && shouldShowPopup()) {
      const timer = setTimeout(() => setShowSupportPopup(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user?.uid, user?.createdAt]);

  useEffect(() => {
    const scale = fontSizeMode === 'large' ? '1.15' : fontSizeMode === 'xlarge' ? '1.3' : '1';
    
    // Toggle class names on documentElement
    const root = document.documentElement;
    root.classList.remove('zoom-normal', 'zoom-large', 'zoom-xlarge');
    root.classList.add(`zoom-${fontSizeMode}`);
    
    // Set style property as fallback
    root.style.setProperty('--text-scale', scale);
  }, [fontSizeMode]);

  // Load simulator flag from Firestore (real-time) - Unlocked automatically in local/DEV environment
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    import.meta.env.DEV;

    if (isLocal) {
      setSimulatorEnabled(true);
      return;
    }

    let unsub = null;
    import('./lib/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ doc, onSnapshot }) => {
        unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
          if (snap.exists()) {
            setSimulatorEnabled(!!snap.data().simulatorEnabled);
          } else {
            setSimulatorEnabled(true);
          }
        }, (err) => {
          setSimulatorEnabled(true);
        });
      });
    });
    return () => { if (unsub) unsub(); };
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // Handle SPA fallback redirect if coming from 404.html
  useEffect(() => {
    const redirectPath = sessionStorage.getItem('spa_redirect_path');
    if (redirectPath) {
      sessionStorage.removeItem('spa_redirect_path');
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);

  // Session restore & Firebase sync
  useEffect(() => {
    let authUnsubscribe = null;
    let docUnsubscribe = null;

    const restore = async () => {
      // 1. Chỉ pre-load session cho tài khoản LOCAL (không có uid).
      // Tài khoản Firebase (có uid) phải đợi onAuthStateChanged xác nhận
      // để đảm bảo luôn kiểm tra trạng thái banned mới nhất từ Firestore.
      const savedSession = localStorage.getItem('fuhrerschein_active_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (!parsed.uid) {
            // Tài khoản local → load ngay
            setUser(parsed);
            setUserLoading(false);
          }
          // Tài khoản Firebase → đợi onAuthStateChanged, giữ loading = true
        } catch {
          setUser(GUEST_USER);
          setUserLoading(false);
        }
      } else {
        setUser(GUEST_USER);
        setUserLoading(false);
      }

      // 2. Listen to Firebase Auth state
      import('./lib/firebase').then(({ auth, db }) => {
        import('firebase/auth').then(({ onAuthStateChanged }) => {
          import('firebase/firestore').then(({ doc, setDoc, onSnapshot }) => {
            // Fallback: nếu Firebase không phản hồi sau 8 giây, hiển thị guest
            const loadingTimeout = setTimeout(() => {
              setUser(prev => prev ?? GUEST_USER);
              setUserLoading(false);
            }, 8000);

            authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
              clearTimeout(loadingTimeout);
              // Unsubscribe from previous doc listener if any
              if (docUnsubscribe) {
                docUnsubscribe();
                docUnsubscribe = null;
              }

              if (!firebaseUser) {
                // Không có Firebase session → reset user Firebase về guest
                setUser(prev => {
                  if (prev?.uid) {
                    localStorage.removeItem('fuhrerschein_active_session');
                    return GUEST_USER;
                  }
                  return prev ?? GUEST_USER;
                });
                setUserLoading(false);
                return;
              }

              if (firebaseUser) {
                try {
                  const userRef = doc(db, 'users', firebaseUser.uid);
                  
                  // Setup real-time listener
                  docUnsubscribe = onSnapshot(userRef, async (docSnap) => {
                    if (docSnap.exists()) {
                      const dbData = docSnap.data();

                      if (dbData.banned) {
                        // Unsubscribe from doc listener to avoid loops
                        if (docUnsubscribe) {
                          docUnsubscribe();
                          docUnsubscribe = null;
                        }
                        import('firebase/auth').then(({ signOut }) => {
                          signOut(auth).catch(err => console.error("Firebase SignOut Error:", err));
                        });
                        clearToken();
                        setUser({ username: 'guest', displayName: 'Khách Học Thử', email: '', apiKey: '', savedQuestions: [], examHistory: [], progress: {}, isGuest: true });
                        localStorage.removeItem('fuhrerschein_active_session');
                        navigate('/');
                        setBannedModal({
                          message: dbData.bannedReason === 'inactivity'
                            ? 'Tài khoản của bạn đã bị tạm khóa do không sử dụng trong hơn 1 tuần. Vui lòng gửi yêu cầu dưới đây để Ban quản trị hỗ trợ mở khóa.'
                            : 'Tài khoản của bạn đã bị khóa. Vui lòng gửi yêu cầu dưới đây để Ban quản trị hỗ trợ mở khóa.',
                          email: dbData.email || firebaseUser.email || '',
                          displayName: dbData.displayName || firebaseUser.displayName || ''
                        });
                        setUnlockEmail(dbData.email || firebaseUser.email || '');
                        setUnlockMessage(dbData.bannedReason === 'inactivity'
                          ? 'Tài khoản của tôi bị tạm khóa do không hoạt động trong hơn 1 tuần. Mong Ban quản trị xem xét mở khóa giúp tôi.'
                          : 'Tài khoản của tôi bị khóa. Mong Ban quản trị xem xét mở khóa giúp tôi.'
                        );
                        setUnlockSuccess(false);
                        setUnlockError('');
                        return;
                      }

                      // Track lastActive if needed
                      const now = new Date();
                      let shouldUpdateLastActive = false;
                      if (!dbData.lastActive) {
                        shouldUpdateLastActive = true;
                      } else {
                        const lastActiveTime = new Date(dbData.lastActive).getTime();
                        if (isNaN(lastActiveTime) || (now.getTime() - lastActiveTime > 4 * 60 * 60 * 1000)) {
                          shouldUpdateLastActive = true;
                        }
                      }
                      if (shouldUpdateLastActive) {
                        setDoc(userRef, { lastActive: now.toISOString() }, { merge: true }).catch(console.error);
                      }

                      const updatedUser = {
                        username: `firebase_${firebaseUser.uid}`,
                        displayName: firebaseUser.displayName || 'Học viên',
                        email: firebaseUser.email || '',
                        savedQuestions: dbData.savedQuestions || [],
                        examHistory: dbData.examHistory || [],
                        progress: dbData.progress || {},
                        isGuest: false,
                        uid: firebaseUser.uid,
                        createdAt: dbData.createdAt || null,
                        lastActive: dbData.lastActive || now.toISOString(),
                        isPremium: !!dbData.isPremium,
                      };
                      setUser(updatedUser);
                      localStorage.setItem('fuhrerschein_active_session', JSON.stringify(updatedUser));
                      setUserLoading(false);
                    } else {
                      // New user creation
                      const newUser = {
                        username: `firebase_${firebaseUser.uid}`,
                        displayName: firebaseUser.displayName || 'Học viên',
                        email: firebaseUser.email || '',
                        savedQuestions: [],
                        examHistory: [],
                        progress: {},
                        isGuest: false,
                        uid: firebaseUser.uid,
                        createdAt: new Date().toISOString(),
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
                      setUserLoading(false);
                    }
                  }, (err) => {
                    console.error("Firestore onSnapshot error:", err);
                  });

                } catch (err) {
                  console.error("Firebase DB Error:", err);
                }
              }
            });
          });
        });
      });

    };
    restore();

    return () => {
      if (authUnsubscribe) authUnsubscribe();
      if (docUnsubscribe) docUnsubscribe();
    };
  }, [navigate]);

  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    if (!unlockEmail.trim() || !unlockMessage.trim()) {
      setUnlockError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    setUnlockSubmitting(true);
    setUnlockError('');
    try {
      const formspreeId = import.meta.env.VITE_FORMSPREE_ID || 'YOUR_FORMSPREE_ID';
      const FORMSPREE_ENDPOINT = `https://formspree.io/f/${formspreeId}`;
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          category: 'Yêu cầu mở khóa tài khoản',
          description: unlockMessage.trim(),
          userName: bannedModal?.displayName || 'Locked User',
          userEmail: unlockEmail.trim(),
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setUnlockSuccess(true);
      } else {
        throw new Error('Không thể gửi yêu cầu. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error(err);
      setUnlockError('Lỗi gửi yêu cầu: ' + err.message);
    } finally {
      setUnlockSubmitting(false);
    }
  };

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

  const isSimOrEditor = location.pathname === '/map-editor';

  return (
    <div style={{
      height: isSimulation ? '100vh' : undefined,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--background)',
      overflow: isSimulation ? 'hidden' : undefined
    }}>
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
      {!isSimOrEditor && <BuyFullAccountAlert languageMode={languageMode} user={user} />}

      {/* Page content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: isSimulation ? 'hidden' : undefined, minHeight: 0 }}>
        <Routes>
          <Route path="/" element={
            <LandingPage
              user={user}
              onNavigate={(p, opts) => navigate(p, opts)}
              onShowLogin={() => setShowLoginModal(true)}
              languageMode={languageMode}
              onLanguageChange={(mode) => { setLanguageMode(mode); localStorage.setItem('fuhrerschein_lang_mode', mode); }}
              simulatorEnabled={simulatorEnabled}
            />
          } />
          <Route path="/training" element={<TrainingDashboard user={user} onUpdateUser={handleUpdateUser} onNavigate={(p, opts) => navigate(p, opts)} onShowLogin={() => setShowLoginModal(true)} languageMode={languageMode} />} />
          <Route path="/training/fragen" element={<Lernen user={user} onUpdateUser={handleUpdateUser} onTriggerLogin={() => setShowLoginModal(true)} onNavigate={(p, opts) => navigate(p, opts)} languageMode={languageMode} />} />
          <Route path="/pruefung/*" element={<Pruefung user={user} onUpdateUser={handleUpdateUser} onTriggerLogin={() => setShowLoginModal(true)} languageMode={languageMode} />} />
          <Route path="/statistik" element={<Stats user={user} onUpdateUser={handleUpdateUser} />} />
          <Route path="/help" element={<Help user={user} languageMode={languageMode} onNavigate={(p, opts) => navigate(p, opts)} />} />
          <Route path="/settings" element={<Settings user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />} />
          <Route path="/privacy" element={<PrivacyPolicy onNavigate={navigate} />} />
          <Route path="/sim-dev" element={<SimDevPage />} />
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

      {/* Welcome Popup - monthly, star rating */}
      <WelcomePopup
        isOpen={showSupportPopup}
        languageMode={languageMode}
        user={user}
        onClose={() => setShowSupportPopup(false)}
        onNeverShow={() => setShowSupportPopup(false)}
        onDonate={() => setShowDonateModal(true)}
      />

      {/* Full Donation Modal - opened when user clicks Donate in welcome popup */}
      <SupportModal
        isOpen={showDonateModal}
        languageMode={languageMode}
        onClose={() => setShowDonateModal(false)}
      />

      {/* Banned Alert Modal */}
      {bannedModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '18px', padding: '32px 24px', maxWidth: '420px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
            {unlockSuccess ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <CheckCircle2 size={56} color="#10b981" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1f2937', marginBottom: '12px', textTransform: 'uppercase' }}>
                  Đã gửi yêu cầu!
                </h3>
                <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6', marginBottom: '28px' }}>
                  Yêu cầu mở khóa của bạn đã được gửi tới Ban quản trị thành công. Chúng tôi sẽ xem xét và mở khóa sớm nhất cho bạn.
                </p>
                <button
                  onClick={() => setBannedModal(null)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #1a4a5e 0%, #2b6f8a 100%)',
                    fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: 'white',
                    boxShadow: '0 4px 12px rgba(26,74,94,0.2)'
                  }}
                >
                  Đóng
                </button>
              </div>
            ) : (
              <div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1f2937', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Tài khoản bị tạm khóa
                  </h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', marginBottom: '20px' }}>
                    {bannedModal.message}
                  </p>
                </div>

                {unlockError && (
                  <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#b91c1c', fontWeight: '600' }}>
                    ⚠️ {unlockError}
                  </div>
                )}

                <form onSubmit={handleUnlockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '6px' }}>Email đăng nhập</label>
                    <input
                      type="email"
                      value={unlockEmail}
                      onChange={(e) => setUnlockEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      style={{
                        width: '100%', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px',
                        border: '1.5px solid #e5e7eb', fontSize: '14px', fontWeight: '500', color: '#111827',
                        outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '6px' }}>Nội dung yêu cầu</label>
                    <textarea
                      value={unlockMessage}
                      onChange={(e) => setUnlockMessage(e.target.value)}
                      placeholder="Nhập lý do cần mở khóa..."
                      required
                      rows={3}
                      style={{
                        width: '100%', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px',
                        border: '1.5px solid #e5e7eb', fontSize: '14px', fontWeight: '500', color: '#111827',
                        outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="submit"
                      disabled={unlockSubmitting}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                        background: unlockSubmitting ? '#93c5fd' : 'linear-gradient(135deg, #1a4a5e 0%, #2b6f8a 100%)',
                        color: 'white', fontWeight: '700', fontSize: '14px', cursor: unlockSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '0 4px 12px rgba(26,74,94,0.2)'
                      }}
                    >
                      {unlockSubmitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                      {unlockSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu mở khóa'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannedModal(null)}
                      style={{
                        width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #e5e7eb',
                        background: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: '#4b5563',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      Trở lại
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
