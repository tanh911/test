import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { hashPassword, verifyPassword, createToken, checkPasswordStrength } from '../lib/auth';
import { registerWithEmail, loginWithEmail, verifyEmail, updateUserProfile } from '../lib/firebase';

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const StrengthBar = ({ password }) => {
  if (!password) return null;
  const { level, label, color } = checkPasswordStrength(password);
  const widths = { weak: '33%', medium: '66%', strong: '100%' };
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: widths[level], background: color,
          borderRadius: '2px', transition: 'all 0.3s ease'
        }} />
      </div>
      <div style={{ fontSize: '11px', color, fontWeight: '600', marginTop: '3px' }}>{label}</div>
    </div>
  );
};

export const Auth = ({ onLogin, onCancel }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLogin) {
      if (!username.trim() || !password.trim()) {
        setError('Vui lòng nhập đầy đủ tài khoản/email và mật khẩu.');
        return;
      }
    } else {
      if (!username.trim() || !email.trim() || !password.trim()) {
        setError('Vui lòng nhập đầy đủ tên hiển thị, email và mật khẩu.');
        return;
      }
      if (!email.trim().includes('@')) {
        setError('Vui lòng nhập email hợp lệ.');
        return;
      }
      if (password.length < 8) {
        setError('Mật khẩu phải có ít nhất 8 ký tự.');
        return;
      }
    }

    setLoading(true);
    try {
      const key = username.trim().toLowerCase();

      if (isLogin) {
        // --- LOGIN FLOW ---
        
        // 1. Firebase Login (nếu nhập Email có chứa @)
        if (key.includes('@')) {
          try {
            const userCredential = await loginWithEmail(key, password);
            const user = userCredential.user;
            
            if (!user.emailVerified) {
              setError('Tài khoản chưa được xác nhận. Vui lòng kiểm tra hộp thư email (hoặc Thư rác) và bấm vào link kích hoạt.');
              setLoading(false);
              return;
            }
            
            setSuccess('Đăng nhập thành công!');
            setTimeout(() => onLogin({
              uid: user.uid,
              username: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              email: user.email,
              apiKey: '', savedQuestions: [], examHistory: [], progress: {}
            }), 500);
            return;
          } catch (firebaseErr) {
            console.error(firebaseErr);
            if (firebaseErr.code === 'auth/invalid-credential' || firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/user-not-found') {
              setError('Email hoặc mật khẩu không chính xác.');
            } else {
              setError('Lỗi đăng nhập: ' + firebaseErr.message);
            }
            setLoading(false);
            return;
          }
        }
        
        // 2. LocalStorage Login (tài khoản cũ không có @)
        const users = JSON.parse(localStorage.getItem('fuhrerschein_users') || '{}');
        const stored = users[key];
        if (!stored) { setError('Tài khoản không tồn tại.'); setLoading(false); return; }

        let valid = false;
        if (stored.passwordHash) {
          valid = await verifyPassword(password, stored.passwordHash);
        } else if (stored.password) {
          valid = stored.password === password;
          if (valid) {
            stored.passwordHash = await hashPassword(password);
            delete stored.password;
            users[key] = stored;
            localStorage.setItem('fuhrerschein_users', JSON.stringify(users));
          }
        }

        if (!valid) { setError('Mật khẩu không chính xác.'); setLoading(false); return; }

        const sessionUser = {
          username: stored.username,
          displayName: stored.displayName || stored.username,
          email: stored.email || '',
          apiKey: stored.apiKey || '',
          savedQuestions: stored.savedQuestions || [],
          examHistory: stored.examHistory || [],
          progress: stored.progress || {},
        };

        const token = await createToken(sessionUser);
        localStorage.setItem('fuhrerschein_token', token);
        setSuccess('Đăng nhập thành công!');
        setTimeout(() => onLogin(sessionUser), 500);

      } else {
        // --- REGISTER FLOW (Firebase Only) ---
        try {
          const userCredential = await registerWithEmail(email.trim(), password);
          const user = userCredential.user;
          
          await updateUserProfile(user, { displayName: username.trim() });
          await verifyEmail(user);
          
          setSuccess('Tạo tài khoản thành công! Vui lòng kiểm tra email của bạn (bao gồm cả mục Thư Rác) và bấm vào link để kích hoạt.');
          
          // Chuyển form về tab Đăng Nhập sau 3 giây
          setTimeout(() => {
            setIsLogin(true);
            setUsername(email.trim()); // Điền sẵn email cho người dùng
            setPassword('');
            setSuccess('');
          }, 3500);
          
        } catch (firebaseErr) {
          console.error(firebaseErr);
          if (firebaseErr.code === 'auth/email-already-in-use') {
            setError('Email này đã được đăng ký. Vui lòng chọn Đăng nhập hoặc dùng email khác.');
          } else if (firebaseErr.code === 'auth/weak-password') {
            setError('Mật khẩu quá yếu, vui lòng chọn mật khẩu khó hơn.');
          } else {
            setError('Lỗi tạo tài khoản: ' + firebaseErr.message);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    onLogin({
      username: 'guest',
      displayName: 'Khách Học Thử',
      email: '', apiKey: '',
      savedQuestions: [], examHistory: [], progress: {}, isGuest: true,
    });
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: '#f9fafb', borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '14px', fontWeight: '500', color: '#111827',
    outline: 'none', transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  };
  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    color: '#6b7280', marginBottom: '6px',
  };

  return (
    <div style={{ padding: '28px 24px', background: 'white', borderRadius: '12px', width: '100%', maxWidth: '380px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚦</div>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          Führerschein Việt-Đức
        </h2>
        <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginTop: '4px', letterSpacing: '0.03em' }}>
          HỌC LÝ THUYẾT LÁI XE ĐỨC
        </p>
      </div>

      {/* Tab Toggle */}
      <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px', marginBottom: '20px', gap: '3px' }}>
        {[{ id: true, label: 'Đăng Nhập' }, { id: false, label: 'Đăng Ký' }].map(({ id, label }) => (
          <button key={String(id)} type="button"
            onClick={() => { setIsLogin(id); setError(''); setSuccess(''); }}
            style={{
              flex: 1, padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: '700',
              transition: 'all 0.15s',
              background: isLogin === id ? 'white' : 'transparent',
              color: isLogin === id ? '#1a4a5e' : '#9ca3af',
              boxShadow: isLogin === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px' }}>
          <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '13px', color: '#b91c1c', fontWeight: '600', lineHeight: '1.4' }}>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '16px' }}>
          <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#15803d', fontWeight: '600' }}>{success}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Username */}
        <div>
          <label style={labelStyle}>{isLogin ? 'Email / Tên Tài Khoản' : 'Tên Hiển Thị'}</label>
          <div style={{ position: 'relative' }}>
            <User size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text" placeholder={isLogin ? "Nhập Email hoặc Tài khoản" : "Ví dụ: Tuan Anh"}
              value={username} onChange={(e) => setUsername(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '36px' }}
              onFocus={(e) => e.target.style.borderColor = '#2b6f8a'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              autoComplete="username"
            />
          </div>
        </div>

        {/* Email (register only) */}
        {!isLogin && (
          <div>
            <label style={labelStyle}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email" placeholder="email@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '36px' }}
                onFocus={(e) => e.target.style.borderColor = '#2b6f8a'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                autoComplete="email"
              />
            </div>
          </div>
        )}

        {/* Password */}
        <div>
          <label style={labelStyle}>Mật Khẩu</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type={showPw ? 'text' : 'password'} placeholder={isLogin ? 'Nhập mật khẩu' : 'Ít nhất 8 ký tự'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '36px', paddingRight: '40px' }}
              onFocus={(e) => e.target.style.borderColor = '#2b6f8a'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {!isLogin && <StrengthBar password={password} />}
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1a4a5e 0%, #2b6f8a 100%)',
            color: 'white', fontWeight: '700', fontSize: '14px',
            letterSpacing: '0.04em', textTransform: 'uppercase',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 2px 8px rgba(26,74,94,0.3)',
            transition: 'opacity 0.15s', marginTop: '4px',
          }}
        >
          {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
          {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản')}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Hoặc</span>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
      </div>

      {/* Social Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        {[
          {
            Icon: GoogleIcon, label: 'Google', onClick: async () => {
              setError('');
              try {
                const { signInWithGoogle } = await import('../lib/firebase');
                const result = await signInWithGoogle();
                const user = result.user;
                onLogin({
                  uid: user.uid,
                  username: `google_${user.uid}`,
                  displayName: user.displayName || 'Google User',
                  email: user.email || '',
                  apiKey: '', savedQuestions: [], examHistory: [], progress: {}
                });
              } catch (err) {
                console.error(err);
                if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                  // Do nothing, just let them cancel silently
                } else {
                  setError(`Lỗi: ${err.message}`);
                }
              }
            }
          },
          {
            Icon: FacebookIcon, label: 'Facebook', onClick: async () => {
              setError('');
              try {
                const { signInWithFacebook } = await import('../lib/firebase');
                const result = await signInWithFacebook();
                const user = result.user;
                onLogin({
                  uid: user.uid,
                  username: `fb_${user.uid}`,
                  displayName: user.displayName || 'Facebook User',
                  email: user.email || '',
                  apiKey: '', savedQuestions: [], examHistory: [], progress: {}
                });
              } catch (err) {
                console.error(err);
                if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                  // Do nothing, just let them cancel silently
                } else {
                  setError(`Lỗi: ${err.message}`);
                }
              }
            }
          },
        ].map(({ Icon, label, onClick }) => (
          <button key={label} type="button" onClick={onClick}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '10px', borderRadius: '8px',
              background: 'white', border: '1.5px solid #e5e7eb',
              fontSize: '13px', fontWeight: '700', color: '#374151',
              cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      {/* Guest & Cancel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button type="button" onClick={handleGuestLogin}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px',
            background: 'transparent', border: '1.5px solid #e5e7eb',
            color: '#6b7280', fontSize: '12px', fontWeight: '700',
            letterSpacing: '0.03em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2b6f8a'; e.currentTarget.style.color = '#1a4a5e'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
        >
          Học Thử Miễn Phí (Không có giải thích)
        </button>

        {onCancel && (
          <button type="button" onClick={onCancel}
            style={{
              width: '100%', padding: '8px', background: 'transparent', border: 'none',
              color: '#9ca3af', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              letterSpacing: '0.02em', transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            ← Quay lại trang chủ
          </button>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
export default Auth;
