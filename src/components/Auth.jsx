import React, { useState } from 'react';

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.376 0-6.114-2.738-6.114-6.114s2.738-6.114 6.114-6.114c1.5 0 2.87.544 3.93 1.442l3.056-3.056C19.16 2.373 15.96 1 12.24 1 5.926 1 12 5.926 1 12s4.926 11 11.24 11c6.578 0 11.24-4.633 11.24-11.24 0-.756-.09-1.485-.24-2.475H12.24z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const Auth = ({ onLogin, onCancel }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
      return;
    }

    if (!isLogin && (!email.trim() || !email.includes('@'))) {
      setError('Vui lòng nhập email hợp lệ!');
      return;
    }

    const users = JSON.parse(localStorage.getItem('fuhrerschein_users') || '{}');

    if (isLogin) {
      // Login
      const user = users[username.trim().toLowerCase()];
      if (user && user.password === password) {
        const sessionUser = {
          username: user.username,
          displayName: user.displayName || user.username,
          email: user.email || '',
          apiKey: user.apiKey || '',
          savedQuestions: user.savedQuestions || [],
          examHistory: user.examHistory || [],
          progress: user.progress || {}
        };
        onLogin(sessionUser);
      } else {
        setError('Tài khoản hoặc mật khẩu không chính xác!');
      }
    } else {
      // Register
      if (users[username.trim().toLowerCase()]) {
        setError('Tài khoản này đã tồn tại!');
        return;
      }

      const newUser = {
        username: username.trim(),
        password: password,
        email: email.trim(),
        displayName: username.trim(),
        apiKey: '',
        savedQuestions: [],
        examHistory: [],
        progress: {}
      };

      users[username.trim().toLowerCase()] = newUser;
      localStorage.setItem('fuhrerschein_users', JSON.stringify(users));
      
      // Auto login after register
      onLogin({
        username: newUser.username,
        displayName: newUser.displayName,
        email: newUser.email,
        apiKey: newUser.apiKey,
        savedQuestions: newUser.savedQuestions,
        examHistory: newUser.examHistory,
        progress: newUser.progress
      });
    }
  };

  const handleGoogleLogin = () => {
    const googleUser = {
      username: 'google_user',
      displayName: 'Google Student',
      email: 'student@gmail.com',
      apiKey: '',
      savedQuestions: [],
      examHistory: [],
      progress: {}
    };
    onLogin(googleUser);
  };

  const handleFacebookLogin = () => {
    const facebookUser = {
      username: 'facebook_user',
      displayName: 'Facebook Student',
      email: 'student@facebook.com',
      apiKey: '',
      savedQuestions: [],
      examHistory: [],
      progress: {}
    };
    onLogin(facebookUser);
  };

  const handleGuestLogin = () => {
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
    onLogin(guestUser);
  };

  return (
    <div className="flex flex-col justify-center items-center w-full px-4 py-6 bg-white">
      <div className="w-full max-w-sm space-y-5">
        
        {/* Header Logo & Title */}
        <div className="text-center">
          <div className="inline-flex justify-center items-center mb-2">
            <div className="w-3 h-3 bg-[#15803D] rounded-full animate-pulse"></div>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-wide uppercase">FÜHRERSCHEIN AI</h2>
          <p className="text-xs text-gray-600 font-bold uppercase tracking-wider mt-1">
            Ứng Dụng Học Lý Thuyết Lái Xe Đức
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex border-2 border-gray-200 p-1 bg-gray-50 rounded-lg">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-bold transition-colors rounded-md ${isLogin ? 'bg-[#15803D] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Đăng Nhập
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-bold transition-colors rounded-md ${!isLogin ? 'bg-[#15803D] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Đăng Ký
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border-l-4 border-red-600 text-red-700 rounded text-xs font-bold leading-normal">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">Tên Đăng Nhập</label>
            <input 
              type="text" 
              placeholder="Nhập tên tài khoản" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-[#15803D] focus:bg-white focus:outline-none text-sm text-gray-900 font-semibold"
            />
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">Địa chỉ Email</label>
              <input 
                type="email" 
                placeholder="email@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-[#15803D] focus:bg-white focus:outline-none text-sm text-gray-900 font-semibold"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">Mật Khẩu</label>
            <input 
              type="password" 
              placeholder="Nhập mật khẩu" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-[#15803D] focus:bg-white focus:outline-none text-sm text-gray-900 font-semibold"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3.5 bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm uppercase tracking-wider transition-colors rounded-lg shadow-md mt-2"
          >
            {isLogin ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản Học Viên'}
          </button>
        </form>

        {/* Social login divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold">
            <span className="bg-white px-3 text-gray-500">Hoặc đăng nhập bằng</span>
          </div>
        </div>

        {/* Social login buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="py-3 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 text-xs font-bold text-gray-800 transition-colors flex items-center justify-center gap-2 rounded-lg shadow-xs"
          >
            <GoogleIcon />
            Google
          </button>

          <button 
            type="button"
            onClick={handleFacebookLogin}
            className="py-3 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 text-xs font-bold text-gray-800 transition-colors flex items-center justify-center gap-2 rounded-lg shadow-xs"
          >
            <FacebookIcon />
            Facebook
          </button>
        </div>

        {/* guest & cancel options */}
        <div className="space-y-2 pt-2">
          <button 
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-2.5 bg-transparent border-2 border-gray-200 text-gray-600 hover:border-[#15803D] hover:text-[#15803D] font-bold text-xs uppercase tracking-wider transition-colors rounded-lg"
          >
            Học Thử Miễn Phí (Không cần tài khoản)
          </button>

          {onCancel && (
            <button 
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 bg-transparent border-2 border-gray-200 text-gray-500 hover:text-gray-800 font-bold text-xs uppercase tracking-wider transition-colors rounded-lg"
            >
              Quay Lại Trang Chủ
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
export default Auth;
