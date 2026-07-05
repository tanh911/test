import React, { useState, useEffect } from 'react';
import { Shield, Users, Trash2, Search, RefreshCw, Ban, CheckCircle, Eye, X, AlertTriangle, BarChart2, BookOpen, Award, Gamepad2, ToggleLeft, ToggleRight } from 'lucide-react';

const ADMIN_EMAIL = 'bossfc69@gmail.com';

export function AdminDashboard({ user, onNavigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, guests: 0 });
  const [simulatorEnabled, setSimulatorEnabled] = useState(false);
  const [togglingSimulator, setTogglingSimulator] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(list);
      setStats({ total: list.length, active: list.filter(u => u.lastLogin).length, guests: 0 });
    } catch (e) {
      console.error(e);
      showToast('Lỗi tải dữ liệu: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const { db } = await import('../lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) setSimulatorEnabled(!!snap.data().simulatorEnabled);
    } catch (e) {
      console.warn('fetchSettings info:', e.message);
    }
  };

  useEffect(() => { if (isAdmin) { fetchUsers(); fetchSettings(); } }, [isAdmin]);

  const handleToggleSimulator = async () => {
    setTogglingSimulator(true);
    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      const next = !simulatorEnabled;
      await setDoc(doc(db, 'settings', 'global'), { simulatorEnabled: next }, { merge: true });
      setSimulatorEnabled(next);
      showToast(next ? '✅ Đã bật Simulator cho người dùng!' : '🔒 Đã khoá Simulator!');
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    }
    setTogglingSimulator(false);
  };

  const handleDelete = async (uid) => {
    try {
      const { db } = await import('../lib/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'users', uid));
      setUsers(prev => prev.filter(u => u.id !== uid));
      setDeleteConfirm(null);
      setSelectedUser(null);
      showToast('Đã xoá người dùng thành công!');
    } catch (e) {
      showToast('Lỗi xoá: ' + e.message, 'error');
    }
  };

  const handleToggleBan = async (uid, currentBanned) => {
    try {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', uid), { banned: !currentBanned });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, banned: !currentBanned } : u));
      if (selectedUser?.id === uid) setSelectedUser(prev => ({ ...prev, banned: !currentBanned }));
      showToast(!currentBanned ? 'Đã khoá tài khoản!' : 'Đã mở khoá tài khoản!');
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  };

  const handleResetProgress = async (uid) => {
    try {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', uid), { progress: {}, examHistory: [], savedQuestions: [] });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, progress: {}, examHistory: [], savedQuestions: [] } : u));
      if (selectedUser?.id === uid) setSelectedUser(prev => ({ ...prev, progress: {}, examHistory: [], savedQuestions: [] }));
      showToast('Đã reset tiến độ học!');
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  };

  const filtered = users.filter(u =>
    (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Access Denied ──
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', padding: '24px' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>🚫</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Không có quyền truy cập</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>Trang này chỉ dành cho Admin.</p>
          <button onClick={() => onNavigate('/')} style={{ padding: '12px 28px', borderRadius: '10px', background: '#6366f1', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '15px' }}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: <Users size={22} />, label: 'Tổng người dùng', value: stats.total, color: '#6366f1' },
    { icon: <CheckCircle size={22} />, label: 'Có hoạt động', value: stats.active, color: '#10b981' },
    { icon: <Ban size={22} />, label: 'Bị khoá', value: users.filter(u => u.banned).length, color: '#ef4444' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #1a1a2e 100%)', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white', padding: '12px 20px', borderRadius: '10px',
          fontWeight: '600', fontSize: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99,102,241,0.4)' }}>
              <Shield size={26} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'white', margin: 0 }}>Admin Dashboard</h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Quản lý người dùng hệ thống</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchUsers} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '14px', backdropFilter: 'blur(10px)' }}>
              <RefreshCw size={16} /> Làm mới
            </button>
            <button onClick={() => onNavigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
              <X size={16} /> Đóng
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {statCards.map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'white', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '3px' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Controls */}
        <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px 24px', marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>⚙️ Quản lý Tính năng</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: simulatorEnabled ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: simulatorEnabled ? '#818cf8' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }}>
                <Gamepad2 size={20} />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>Mô phỏng lái xe (Simulator)</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '2px' }}>
                  {simulatorEnabled ? '🟢 Đang mở — người dùng có thể truy cập' : '🔴 Đang khoá — hiện modal "Đang phát triển"'}
                </div>
              </div>
            </div>
            <button
              onClick={handleToggleSimulator}
              disabled={togglingSimulator}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '12px', border: 'none',
                background: simulatorEnabled ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.1)',
                color: simulatorEnabled ? 'white' : 'rgba(255,255,255,0.6)',
                fontWeight: '700', fontSize: '14px', cursor: togglingSimulator ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s', opacity: togglingSimulator ? 0.6 : 1,
                boxShadow: simulatorEnabled ? '0 4px 15px rgba(16,185,129,0.4)' : 'none'
              }}
            >
              {simulatorEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {togglingSimulator ? 'Đang lưu...' : (simulatorEnabled ? 'Bật' : 'Tắt')}
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '14px', outline: 'none', backdropFilter: 'blur(10px)', boxSizing: 'border-box' }}
          />
        </div>

        {/* User Table */}
        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
              <div>Đang tải dữ liệu...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              <Users size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <div>Không tìm thấy người dùng nào</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {['Người dùng', 'Email', 'Tiến độ', 'Bài thi', 'Trạng thái', 'Hành động'].map(h => (
                      <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, idx) => {
                    const progressCount = Object.keys(u.progress || {}).length;
                    const examCount = (u.examHistory || []).length;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `hsl(${(idx * 47) % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', color: 'white', flexShrink: 0 }}>
                              {(u.displayName || u.email || '?')[0].toUpperCase()}
                            </div>
                            <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{u.displayName || 'Không tên'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{u.email || '—'}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1', fontSize: '13px', fontWeight: '600' }}>
                            <BookOpen size={14} /> {progressCount} câu
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '13px', fontWeight: '600' }}>
                            <Award size={14} /> {examCount} lần
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: u.banned ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: u.banned ? '#ef4444' : '#10b981' }}>
                            {u.banned ? 'Bị khoá' : 'Hoạt động'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button title="Xem chi tiết" onClick={() => setSelectedUser(u)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.2)', border: 'none', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Eye size={15} />
                            </button>
                            <button title={u.banned ? 'Mở khoá' : 'Khoá'} onClick={() => handleToggleBan(u.id, u.banned)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: u.banned ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', border: 'none', color: u.banned ? '#10b981' : '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {u.banned ? <CheckCircle size={15} /> : <Ban size={15} />}
                            </button>
                            <button title="Xoá người dùng" onClick={() => setDeleteConfirm(u)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div style={{ marginTop: '12px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'right' }}>
          Hiển thị {filtered.length}/{users.length} người dùng
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setSelectedUser(null)}>
          <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: '20px', padding: '28px', maxWidth: '500px', width: '100%', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <h3 style={{ color: 'white', fontWeight: '800', fontSize: '18px', margin: 0 }}>Chi tiết người dùng</h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: '14px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', color: 'white' }}>
                {(selectedUser.displayName || selectedUser.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>{selectedUser.displayName || 'Không tên'}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>{selectedUser.email}</div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: selectedUser.banned ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)', color: selectedUser.banned ? '#ef4444' : '#10b981' }}>
                    {selectedUser.banned ? 'Bị khoá' : 'Đang hoạt động'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { icon: <BookOpen size={18} />, label: 'Câu đã học', value: Object.keys(selectedUser.progress || {}).length, color: '#6366f1' },
                { icon: <Award size={18} />, label: 'Bài thi', value: (selectedUser.examHistory || []).length, color: '#f59e0b' },
                { icon: <BarChart2 size={18} />, label: 'Câu lưu', value: (selectedUser.savedQuestions || []).length, color: '#10b981' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ color: s.color, marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                  <div style={{ color: 'white', fontWeight: '800', fontSize: '20px' }}>{s.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => handleToggleBan(selectedUser.id, selectedUser.banned)} style={{ padding: '12px', borderRadius: '12px', background: selectedUser.banned ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${selectedUser.banned ? '#10b981' : '#ef4444'}`, color: selectedUser.banned ? '#10b981' : '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {selectedUser.banned ? <><CheckCircle size={16} /> Mở khoá tài khoản</> : <><Ban size={16} /> Khoá tài khoản</>}
              </button>
              <button onClick={() => handleResetProgress(selectedUser.id)} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b', color: '#f59e0b', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <RefreshCw size={16} /> Reset tiến độ học
              </button>
              <button onClick={() => { setSelectedUser(null); setDeleteConfirm(selectedUser); }} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Trash2 size={16} /> Xoá người dùng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1e1b4b', borderRadius: '20px', padding: '32px', maxWidth: '380px', width: '100%', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={28} color="#ef4444" />
            </div>
            <h3 style={{ color: 'white', fontWeight: '800', fontSize: '18px', marginBottom: '8px' }}>Xác nhận xoá?</h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              Bạn sắp xoá tài khoản <strong style={{ color: 'white' }}>{deleteConfirm.displayName || deleteConfirm.email}</strong>. Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                Huỷ
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#ef4444', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                Xoá ngay
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}
