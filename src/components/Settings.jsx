import React, { useState } from 'react';
import { Key, Eye, EyeOff, Info, ShieldCheck } from 'lucide-react';

export const Settings = ({ user, onUpdateUser, onLogout }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [apiKey, setApiKey] = useState(user.apiKey || localStorage.getItem('fuhrerschein_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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

    // Save key in localStorage and update user object
    localStorage.setItem('fuhrerschein_api_key', apiKey.trim());
    
    // Save account state in local storage accounts database
    const users = JSON.parse(localStorage.getItem('fuhrerschein_users') || '{}');
    if (user.username !== 'guest' && users[user.username.toLowerCase()]) {
      users[user.username.toLowerCase()].displayName = displayName.trim();
      users[user.username.toLowerCase()].email = email.trim();
      users[user.username.toLowerCase()].apiKey = apiKey.trim();
      localStorage.setItem('fuhrerschein_users', JSON.stringify(users));
    }

    onUpdateUser({
      ...user,
      displayName: displayName.trim(),
      email: email.trim(),
      apiKey: apiKey.trim()
    });

    setMessage({ type: 'success', text: 'Cài đặt đã được lưu thành công!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleResetProgress = () => {
    if (window.confirm('CẢNH BÁO: Hành động này sẽ xóa toàn bộ tiến trình học tập, lịch sử thi thử và danh sách các câu hỏi đã lưu của bạn. Bạn có muốn tiếp tục không?')) {
      const resetUser = {
        ...user,
        savedQuestions: [],
        examHistory: [],
        progress: {}
      };

      // Update Database
      const users = JSON.parse(localStorage.getItem('fuhrerschein_users') || '{}');
      if (user.username !== 'guest' && users[user.username.toLowerCase()]) {
        users[user.username.toLowerCase()].savedQuestions = [];
        users[user.username.toLowerCase()].examHistory = [];
        users[user.username.toLowerCase()].progress = {};
        localStorage.setItem('fuhrerschein_users', JSON.stringify(users));
      }

      onUpdateUser(resetUser);
      setMessage({ type: 'success', text: 'Tiến độ học tập đã được thiết lập lại về ban đầu!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-[#F3F4F6] text-gray-900 font-sans overflow-y-auto px-4 py-4 pb-20 space-y-5 no-scrollbar">
      
      <div className="space-y-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#15803D]">CÀI ĐẶT ỨNG DỤNG</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-mono font-bold">Cấu hình hệ thống & thông tin tài khoản</p>
      </div>

      {message.text && (
        <div className={`p-2.5 rounded-lg border-2 text-[11px] font-extrabold uppercase text-center ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-600 text-green-700' 
            : 'bg-red-50 border-red-600 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile & API Form */}
      <form onSubmit={handleSaveSettings} className="bg-white border-2 border-gray-200 p-5 rounded-2xl space-y-4 shadow-sm">
        
        {/* Profile name */}
        <div className="space-y-1.5 text-left">
          <label className="text-[11px] font-sans font-extrabold uppercase tracking-wider text-gray-700">
            Tên hiển thị học viên
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Tên học viên"
            className="w-full px-3.5 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-[#15803D] focus:bg-white focus:outline-none text-sm text-gray-900 font-bold"
          />
        </div>

        {/* Email address */}
        <div className="space-y-1.5 text-left">
          <label className="text-[11px] font-sans font-extrabold uppercase tracking-wider text-gray-700">
            Địa chỉ Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            disabled={user.username === 'guest'}
            className="w-full px-3.5 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-[#15803D] focus:bg-white focus:outline-none text-sm text-gray-900 font-bold disabled:opacity-40"
          />
        </div>

        {/* Gemini API Key */}
        <div className="space-y-1.5 text-left">
          <label className="text-[11px] font-sans font-extrabold uppercase tracking-wider text-gray-700">
            Google Gemini API Key
          </label>
          
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full pl-3.5 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-[#15803D] focus:bg-white focus:outline-none text-sm text-gray-900 font-mono font-bold"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3.5 top-3.5 text-gray-500 hover:text-gray-800"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[10px] text-gray-550 leading-normal mt-1.5 uppercase font-bold">
            Chú ý: API Key của bạn chỉ được lưu nội bộ trên máy cá nhân, đảm bảo an toàn bảo mật thông tin.
          </p>
        </div>

        {/* Help Banner */}
        <div className="p-3.5 bg-green-50 rounded-xl border-2 border-[#15803D]/30 flex items-start gap-2.5 text-left text-xs leading-relaxed">
          <Info className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
          <div className="text-green-950 font-bold">
            <strong className="text-[#15803D] uppercase font-extrabold text-[10px] tracking-wider">Làm sao có Gemini API Key?</strong>
            <p className="mt-1">
              1. Truy cập <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#15803D] font-extrabold hover:underline underline-offset-2">Google AI Studio</a>.<br />
              2. Đăng nhập tài khoản Google của bạn.<br />
              3. Nhấn nút <strong>Create API Key</strong> và sao chép mã khóa.<br />
              4. API Key hoàn toàn miễn phí cho lưu lượng học tập bình thường!
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-[#15803D] hover:bg-[#166534] text-white font-extrabold text-xs uppercase tracking-widest transition-colors rounded-xl shadow-md"
        >
          LƯU CẤU HÌNH CÀI ĐẶT
        </button>
      </form>

      {/* Account Info details */}
      <div className="bg-white border-2 border-gray-200 p-4 rounded-xl text-left text-xs space-y-2 shadow-sm">
        <h4 className="font-sans font-bold text-[10px] uppercase tracking-wider text-[#15803D] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
          Thông tin tài khoản học viên:
        </h4>
        <div className="grid grid-cols-2 gap-2 text-gray-500 text-[10px] font-sans font-bold">
          <span>USERNAME:</span>
          <span className="text-gray-900 text-right">{user.username}</span>
          {user.username !== 'guest' && user.email && (
            <>
              <span>EMAIL:</span>
              <span className="text-gray-900 text-right">{user.email}</span>
            </>
          )}
          <span>VAI TRÒ:</span>
          <span className="text-gray-900 text-right font-extrabold">HỌC VIÊN</span>
          <span>TRẠNG THÁI AI:</span>
          <span className={`text-right font-extrabold ${user.apiKey ? 'text-[#15803D]' : 'text-gray-500'}`}>
            {user.apiKey ? 'ĐANG BẬT (REAL API)' : 'CHẾ ĐỘ OFFLINE'}
          </span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border-2 border-red-600/30 p-5 rounded-xl text-left space-y-3 shadow-sm">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-red-600">VÙNG CẢNH BÁO (DANGER ZONE)</h4>
        <p className="text-[10px] text-gray-500 font-bold leading-normal uppercase">
          Xóa vĩnh viễn dữ liệu học hoặc đăng xuất khỏi hệ thống thiết bị này.
        </p>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleResetProgress}
            className="flex-1 py-2.5 bg-transparent border-2 border-red-600 text-red-650 hover:bg-red-600 hover:text-white font-extrabold text-xs uppercase tracking-wider transition-colors rounded-lg"
          >
            Xóa tiến trình
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex-1 py-2.5 bg-transparent border-2 border-gray-200 text-gray-700 hover:border-red-650 hover:text-red-650 font-extrabold text-xs uppercase tracking-wider transition-colors rounded-lg"
          >
            ĐĂNG XUẤT
          </button>
        </div>
      </div>

    </div>
  );
};
export default Settings;
