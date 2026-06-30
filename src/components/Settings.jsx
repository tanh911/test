import React, { useState } from 'react';
import { ShieldCheck, User, Mail, LogOut, Settings as SettingsIcon, AlertTriangle, Save, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings = ({ user, onUpdateUser, onLogout }) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [message, setMessage] = useState({ type: '', text: '' });

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  React.useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Tên hiển thị không được để trống!' });
      return;
    }

    if (user.username !== 'guest' && email.trim() && !email.includes('@')) {
      setMessage({ type: 'error', text: 'Địa chỉ Email không hợp lệ!' });
      return;
    }

    if (email.trim() !== (user.email || '').trim()) {
      setShowVerifyEmail(true);
      return;
    }

    // Save account state in local storage accounts database
    const users = JSON.parse(localStorage.getItem('fuhrerschein_users') || '{}');
    if (user.username !== 'guest' && users[user.username.toLowerCase()]) {
      users[user.username.toLowerCase()].displayName = displayName.trim();
      users[user.username.toLowerCase()].email = email.trim();
      localStorage.setItem('fuhrerschein_users', JSON.stringify(users));
    }

    onUpdateUser({
      ...user,
      displayName: displayName.trim(),
      email: email.trim()
    });

    setMessage({ type: 'success', text: 'Cài đặt đã được lưu thành công!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleVerifyAndChangeEmail = async () => {
    if (!verifyPassword) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu xác thực.' });
      return;
    }
    setIsVerifying(true);
    try {
      let emailUpdatePending = false;

      if (user.uid) {
        const { auth } = await import('../lib/firebase');
        const { EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } = await import('firebase/auth');
        
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.email) {
          const credential = EmailAuthProvider.credential(currentUser.email, verifyPassword);
          await reauthenticateWithCredential(currentUser, credential);
          
          await verifyBeforeUpdateEmail(currentUser, email.trim());
          emailUpdatePending = true;
          setCountdown(300);
          setMessage({ type: 'success', text: 'Thành công! Vui lòng kiểm tra hộp thư của email mới để xác nhận thay đổi.' });
        }
      }
      
      const users = JSON.parse(localStorage.getItem('fuhrerschein_users') || '{}');
      if (user.username !== 'guest' && users[user.username.toLowerCase()]) {
        if (users[user.username.toLowerCase()].password && users[user.username.toLowerCase()].password !== verifyPassword) {
           throw new Error('Mật khẩu không chính xác!');
        }
        users[user.username.toLowerCase()].displayName = displayName.trim();
        // Chỉ cập nhật email local nếu không phải user Firebase
        if (!user.uid) {
          users[user.username.toLowerCase()].email = email.trim();
        }
        localStorage.setItem('fuhrerschein_users', JSON.stringify(users));
      }

      onUpdateUser({
        ...user,
        displayName: displayName.trim(),
        // Nếu là Firebase user, ta KHÔNG cập nhật email ngay lập tức để tránh lỗi bất đồng bộ.
        // Chờ họ xác thực qua mail rồi đăng nhập lại.
        email: user.uid ? user.email : email.trim()
      });

      // Nếu không có bước gửi mail, thông báo lưu bình thường
      if (!emailUpdatePending) {
        setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      } else {
        // Reset trường email hiển thị về lại email gốc để không gây hiểu nhầm
        setEmail(user.email);
      }
      
      setShowVerifyEmail(false);
      setVerifyPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: 'Xác thực thất bại: ' + (err.message || 'Mật khẩu không đúng.') });
    }
    setIsVerifying(false);
  };

  const executeResetProgress = () => {
    const resetUser = {
      ...user,
      savedQuestions: [],
      examHistory: [],
      progress: {}
    };

    // Xóa tất cả các phiên học/thi đang lưu trong cache (sessionStorage & localStorage)
    sessionStorage.removeItem('fuhrerschein_learning_session_v2');
    sessionStorage.removeItem('fuhrerschein_learning_session');
    sessionStorage.removeItem('fuhrerschein_exam_session');
    localStorage.removeItem('fuhrerschein_exam_session');

    // Update Database local object if it's guest
    const users = JSON.parse(localStorage.getItem('fuhrerschein_users') || '{}');
    if (user.username !== 'guest' && users[user.username.toLowerCase()]) {
      users[user.username.toLowerCase()].savedQuestions = [];
      users[user.username.toLowerCase()].examHistory = [];
      users[user.username.toLowerCase()].progress = {};
      localStorage.setItem('fuhrerschein_users', JSON.stringify(users));
    }

    onUpdateUser(resetUser);
    setShowConfirmReset(false);
    setMessage({ type: 'success', text: 'Tiến độ học tập đã được thiết lập lại về ban đầu!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div style={{ flex: 1, backgroundColor: '#f4f7f9', overflowY: 'auto', padding: '32px 16px', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", position: 'relative' }} className="no-scrollbar">
      
      {/* Cửa sổ xác nhận tùy chỉnh (Custom Confirm Modal) */}
      {showConfirmReset && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertTriangle size={24} color="#e11d48" />
            </div>
            <h3 style={{ fontSize: 'calc(18px * var(--text-scale, 1))', fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: '12px' }}>Xác nhận xóa dữ liệu</h3>
            <p style={{ fontSize: 'calc(14px * var(--text-scale, 1))', color: '#475569', textAlign: 'center', lineHeight: '1.6', marginBottom: '32px' }}>
              Hành động này sẽ xóa vĩnh viễn <b style={{color: '#e11d48'}}>toàn bộ tiến trình học tập</b>, lịch sử thi thử và danh sách câu hỏi đã lưu của bạn. Bạn có chắc chắn muốn tiếp tục không?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowConfirmReset(false)}
                style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f1f5f9'}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={executeResetProgress}
                style={{ flex: 1, padding: '12px', backgroundColor: '#e11d48', color: 'white', border: 'none', borderRadius: '12px', fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.2)' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#be123c'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#e11d48'}
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cửa sổ xác thực đổi Email */}
      {showVerifyEmail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ShieldCheck size={24} color="#0284c7" />
            </div>
            <h3 style={{ fontSize: 'calc(18px * var(--text-scale, 1))', fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: '12px' }}>Xác thực bảo mật</h3>
            <p style={{ fontSize: 'calc(14px * var(--text-scale, 1))', color: '#475569', textAlign: 'center', lineHeight: '1.6', marginBottom: '20px' }}>
              Bạn đang yêu cầu thay đổi địa chỉ email thành <b style={{color: '#0284c7'}}>{email}</b>. Vui lòng nhập mật khẩu hiện tại để xác nhận.
            </p>
            <input
              type="password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              placeholder="Nhập mật khẩu của bạn"
              style={{ width: '100%', padding: '12px 16px', backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: 'calc(15px * var(--text-scale, 1))', color: '#0f172a', outline: 'none', marginBottom: '24px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => { setShowVerifyEmail(false); setVerifyPassword(''); }}
                style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f1f5f9'}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleVerifyAndChangeEmail}
                disabled={isVerifying}
                style={{ flex: 1, padding: '12px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '12px', fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '700', cursor: isVerifying ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)', opacity: isVerifying ? 0.7 : 1 }}
              >
                {isVerifying ? 'Đang xác thực...' : 'Xác thực'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{
              width: '40px', height: '40px',
              background: '#e2e8f0',
              color: '#1e293b',
              border: 'none',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              marginRight: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#cbd5e1'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#1a4a5e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(26, 74, 94, 0.2)' }}>
            <SettingsIcon size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 'calc(24px * var(--text-scale, 1))', fontWeight: '800', color: '#1a4a5e', margin: 0, letterSpacing: '-0.02em' }}>Cài đặt ứng dụng</h1>
            <p style={{ fontSize: 'calc(13px * var(--text-scale, 1))', color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' }}>Cấu hình hệ thống & thông tin tài khoản của bạn</p>
          </div>
        </div>

        {message.text && (
          <div style={{ 
            padding: '16px', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: message.type === 'success' ? '#166534' : '#991b1b',
            fontWeight: '600',
            fontSize: 'calc(14px * var(--text-scale, 1))',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {message.type === 'success' ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
            {message.text}
          </div>
        )}

        {/* Profile Form */}
        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 'calc(18px * var(--text-scale, 1))', fontWeight: '700', color: '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color="#2b6f8a" /> Thông tin cá nhân
          </h2>
          
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Display Name */}
            <div>
              <label style={{ display: 'block', fontSize: 'calc(13px * var(--text-scale, 1))', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tên hiển thị học viên
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  style={{ width: '100%', padding: '14px 16px 14px 44px', backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: 'calc(15px * var(--text-scale, 1))', fontWeight: '600', color: '#0f172a', transition: 'all 0.2s', outline: 'none' }}
                  onFocus={(e) => { e.target.style.borderColor = '#2b6f8a'; e.target.style.backgroundColor = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 'calc(13px * var(--text-scale, 1))', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Địa chỉ Email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  disabled={user.username === 'guest'}
                  style={{ width: '100%', padding: '14px 16px 14px 44px', backgroundColor: user.username === 'guest' ? '#f1f5f9' : '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: 'calc(15px * var(--text-scale, 1))', fontWeight: '600', color: '#0f172a', transition: 'all 0.2s', outline: 'none', opacity: user.username === 'guest' ? 0.6 : 1 }}
                  onFocus={(e) => { if (user.username !== 'guest') { e.target.style.borderColor = '#2b6f8a'; e.target.style.backgroundColor = 'white'; } }}
                  onBlur={(e) => { if (user.username !== 'guest') { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; } }}
                />
              </div>

              {countdown > 0 && (
                <div style={{ marginTop: '8px', padding: '12px 14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px', animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{ color: '#d97706', marginTop: '2px', backgroundColor: '#fef3c7', padding: '6px', borderRadius: '50%' }}>
                    <Mail size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 'calc(13px * var(--text-scale, 1))', fontWeight: '700', color: '#92400e' }}>
                      Đang chờ xác nhận đổi Email
                    </div>
                    <div style={{ fontSize: 'calc(13px * var(--text-scale, 1))', color: '#b45309', marginTop: '4px', lineHeight: '1.5' }}>
                      Vui lòng kiểm tra hộp thư của email mới để hoàn tất. Bạn nên xác nhận ngay trong vòng <b style={{ fontFeatureSettings: '"tnum"', color: '#ea580c', fontWeight: '800' }}>{Math.floor(countdown / 60).toString().padStart(2, '0')}:{(countdown % 60).toString().padStart(2, '0')}</b> phút tới.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '16px', backgroundColor: '#1a4a5e', color: 'white', border: 'none', borderRadius: '12px', fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '0 4px 12px rgba(26, 74, 94, 0.2)', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#113240'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#1a4a5e'}
            >
              <Save size={18} /> Lưu cấu hình cài đặt
            </button>
          </form>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Account Info Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: 'calc(16px * var(--text-scale, 1))', fontWeight: '700', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#10b981" /> Trạng thái tài khoản
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 'calc(13px * var(--text-scale, 1))', color: '#64748b', fontWeight: '600' }}>Tên đăng nhập (Username)</span>
                <span style={{ 
                  fontSize: 'calc(14px * var(--text-scale, 1))', 
                  color: '#0f172a', 
                  fontWeight: '700', 
                  backgroundColor: '#f1f5f9', 
                  padding: '4px 10px', 
                  borderRadius: '6px',
                  maxWidth: '160px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }} title={user.username}>{user.username}</span>
              </div>
              
              {user.username !== 'guest' && user.email && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 'calc(13px * var(--text-scale, 1))', color: '#64748b', fontWeight: '600' }}>Email đăng ký</span>
                  <span style={{ 
                    fontSize: 'calc(14px * var(--text-scale, 1))', 
                    color: '#0f172a', 
                    fontWeight: '700',
                    maxWidth: '160px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }} title={user.email}>{user.email}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'calc(13px * var(--text-scale, 1))', color: '#64748b', fontWeight: '600' }}>Vai trò hệ thống</span>
                <span style={{ fontSize: 'calc(12px * var(--text-scale, 1))', color: '#166534', fontWeight: '800', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>Học viên</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{ backgroundColor: '#fff1f2', borderRadius: '24px', padding: '32px', border: '1px solid #fecdd3' }}>
            <h3 style={{ fontSize: 'calc(16px * var(--text-scale, 1))', fontWeight: '700', color: '#be123c', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#e11d48" /> Vùng nguy hiểm
            </h3>
            <p style={{ fontSize: 'calc(13px * var(--text-scale, 1))', color: '#9f1239', lineHeight: '1.6', marginBottom: '24px', fontWeight: '500' }}>
              Các hành động dưới đây sẽ xóa dữ liệu trên trình duyệt này hoặc yêu cầu đăng nhập lại. Vui lòng cân nhắc kỹ trước khi thực hiện.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => setShowConfirmReset(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', backgroundColor: 'white', color: '#e11d48', border: '2px solid #fda4af', borderRadius: '12px', fontSize: 'calc(13px * var(--text-scale, 1))', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.target.style.backgroundColor = '#ffe4e6'; e.target.style.borderColor = '#fb7185'; }}
                onMouseOut={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.borderColor = '#fda4af'; }}
              >
                Xóa toàn bộ lịch sử học tập
              </button>
              
              <button
                onClick={onLogout}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', backgroundColor: '#e11d48', color: 'white', border: 'none', borderRadius: '12px', fontSize: 'calc(13px * var(--text-scale, 1))', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.2)' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#be123c'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#e11d48'}
              >
                <LogOut size={16} /> Đăng xuất khỏi thiết bị
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
