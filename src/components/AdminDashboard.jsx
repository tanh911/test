import React, { useState, useEffect, useRef } from 'react';
import { Shield, Users, Trash2, Search, RefreshCw, Ban, CheckCircle, Eye, X, AlertTriangle, BarChart2, BookOpen, Award, Gamepad2, ToggleLeft, ToggleRight, Mail, Send, Loader2, StopCircle } from 'lucide-react';
import { sendCustomEmailToUser, sendWelcomeEmail } from '../services/emailService';

const ADMIN_EMAIL = 'bossfc69@gmail.com';

// ── Feedback Section ────────────────────────────────────────────────────────

const FeedbackSection = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { db } = await import('../lib/firebase');
        const { collection, getDocs, query, limit } = await import('firebase/firestore');
        const q = query(collection(db, 'feedback'), limit(100));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort client-side by timestamp descending
        list.sort((a, b) => {
          const ta = a.timestamp?.toDate?.()?.getTime() ?? 0;
          const tb = b.timestamp?.toDate?.()?.getTime() ?? 0;
          return tb - ta;
        });
        setFeedbacks(list);
      } catch (e) {
        console.warn('feedback fetch:', e);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return null;
  if (feedbacks.length === 0) return (
    <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px 24px', marginBottom: '24px' }}>
      <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>⭐ Đánh giá từ người dùng</div>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Chưa có đánh giá nào.</div>
    </div>
  );

  const avg = (feedbacks.reduce((s, f) => s + (f.stars || 0), 0) / feedbacks.length).toFixed(1);
  const dist = [1, 2, 3, 4, 5].map(s => feedbacks.filter(f => f.stars === s).length);
  const max  = Math.max(...dist, 1);
  const recent = feedbacks.slice(0, 5);
  const starEmoji = s => '⭐'.repeat(s);

  const fmtDate = (ts) => {
    if (!ts) return '';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    } catch { return ''; }
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px 24px', marginBottom: '24px' }}>
      <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
        ⭐ Đánh giá từ người dùng ({feedbacks.length} lượt)
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Average score */}
        <div style={{ textAlign: 'center', minWidth: '80px' }}>
          <div style={{ fontSize: '42px', fontWeight: '800', color: 'white', lineHeight: 1 }}>{avg}</div>
          <div style={{ fontSize: '18px', marginTop: '4px' }}>{'⭐'.repeat(Math.round(avg))}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>trên 5 sao</div>
        </div>

        {/* Distribution bars */}
        <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
          {[5,4,3,2,1].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', width: '20px', textAlign: 'right' }}>{s}★</div>
              <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  width: `${(dist[s-1] / max) * 100}%`,
                  background: s >= 4 ? '#10b981' : s === 3 ? '#f59e0b' : '#ef4444',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', width: '20px' }}>{dist[s-1]}</div>
            </div>
          ))}
        </div>

        {/* Recent reviews */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gần đây</div>
          {recent.map(f => (
            <div key={f.id} style={{ marginBottom: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: f.comment ? '5px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white' }}>
                    {(f.displayName || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{f.displayName || 'Khách'}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{fmtDate(f.timestamp)}</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px' }}>{'⭐'.repeat(f.stars || 0)}</div>
              </div>
              {f.comment && (
                <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', lineHeight: 1.4, paddingLeft: '34px' }}>
                  "{f.comment}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const formatDate = (dateVal) => {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return '—';
  }
};


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

  // State gửi Email qua Resend
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalUser, setEmailModalUser] = useState(null);
  const [customRecipientEmail, setCustomRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Trạng thái chọn hàng loạt và tiến trình gửi email
  const [selectedUids, setSelectedUids] = useState([]);
  const [recipientType, setRecipientType] = useState('list'); // 'single', 'list', 'custom'
  const [emailTemplate, setEmailTemplate] = useState('custom'); // 'custom', 'welcome'
  const [bulkStatus, setBulkStatus] = useState(null); // null hoặc { current, total, success, fail, currentEmail, errors }
  const [modalSelectedUids, setModalSelectedUids] = useState([]);
  const [modalSearch, setModalSearch] = useState('');

  const cancelBulkRef = useRef(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === 'error' ? 8000 : 3500);
  };

  const handleSendWelcomeToAllUsers = () => {
    const validUsers = users.filter(u => u.email && u.email.includes('@'));
    if (validUsers.length === 0) {
      showToast('Không tìm thấy người dùng nào có địa chỉ email hợp lệ!', 'error');
      return;
    }

    setBulkStatus(null);
    cancelBulkRef.current = false;
    setEmailModalUser(null);
    setRecipientType('list');
    setCustomRecipientEmail('');
    setModalSelectedUids(validUsers.map(u => u.id));
    setModalSearch('');
    setEmailTemplate('welcome');
    setEmailSubject('🎉 Cảm ơn bạn đã đăng ký tài khoản tại fuhrerscheinvide.site');
    setEmailBody('');
    setShowEmailModal(true);
  };

  const handleToggleSelectUser = (uid) => {
    setSelectedUids(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleToggleSelectAll = () => {
    const filteredUids = filtered.map(u => u.id);
    const allSelected = filteredUids.length > 0 && filteredUids.every(uid => selectedUids.includes(uid));

    if (allSelected) {
      setSelectedUids(prev => prev.filter(uid => !filteredUids.includes(uid)));
    } else {
      setSelectedUids(prev => {
        const next = [...prev];
        filteredUids.forEach(uid => {
          if (!next.includes(uid)) next.push(uid);
        });
        return next;
      });
    }
  };

  const handleBulkToggleBan = async () => {
    if (selectedUids.length === 0) return;
    const selectedUsers = users.filter(u => selectedUids.includes(u.id));
    const activeCount = selectedUsers.filter(u => !u.banned).length;
    const banAction = activeCount > 0;
    const actionText = banAction ? 'KHOÁ' : 'MỞ KHOÁ';

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của ${selectedUids.length} người dùng đã chọn?`)) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');

      for (const uid of selectedUids) {
        try {
          await updateDoc(doc(db, 'users', uid), { banned: banAction });
          successCount++;
        } catch (err) {
          console.error(`Error banning/unbanning ${uid}:`, err);
        }
      }

      setUsers(prev => prev.map(u => selectedUids.includes(u.id) ? { ...u, banned: banAction } : u));
      setSelectedUids([]);
      showToast(`Đã ${actionText.toLowerCase()} thành công ${successCount}/${selectedUids.length} tài khoản!`);
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const handleBulkResetProgress = async () => {
    if (selectedUids.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn RESET TIẾN ĐỘ học và lịch sử thi của ${selectedUids.length} người dùng đã chọn? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');

      for (const uid of selectedUids) {
        try {
          await updateDoc(doc(db, 'users', uid), { progress: {}, examHistory: [], savedQuestions: [] });
          successCount++;
        } catch (err) {
          console.error(`Error resetting progress for ${uid}:`, err);
        }
      }

      setUsers(prev => prev.map(u => selectedUids.includes(u.id) ? { ...u, progress: {}, examHistory: [], savedQuestions: [] } : u));
      setSelectedUids([]);
      showToast(`Đã reset tiến độ học của ${successCount}/${selectedUids.length} người dùng!`);
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedUids.length === 0) return;
    if (!window.confirm(`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XOÁ VĨNH VIỄN ${selectedUids.length} tài khoản người dùng đã chọn? Hành động này KHÔNG THỂ HOÀN TÁC!`)) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    try {
      const { db } = await import('../lib/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');

      for (const uid of selectedUids) {
        try {
          await deleteDoc(doc(db, 'users', uid));
          successCount++;
        } catch (err) {
          console.error(`Error deleting user ${uid}:`, err);
        }
      }

      setUsers(prev => prev.filter(u => !selectedUids.includes(u.id)));
      setSelectedUids([]);
      showToast(`Đã xoá thành công ${successCount}/${selectedUids.length} người dùng!`);
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const handleOpenEmailModal = (target = null) => {
    setBulkStatus(null);
    cancelBulkRef.current = false;
    setEmailTemplate('custom');
    setModalSearch('');
    if (target === 'bulk') {
      setEmailModalUser(null);
      setRecipientType('list');
      setCustomRecipientEmail('');
      setModalSelectedUids([...selectedUids]);
    } else if (target && typeof target === 'object') {
      setEmailModalUser(target);
      setRecipientType('single');
      setCustomRecipientEmail(target.email || '');
      setModalSelectedUids([target.id]);
    } else {
      setEmailModalUser(null);
      setRecipientType('list');
      setCustomRecipientEmail('');
      if (selectedUids.length > 0) {
        setModalSelectedUids([...selectedUids]);
      } else {
        const allValidUids = users.filter(u => u.email && u.email.includes('@')).map(u => u.id);
        setModalSelectedUids(allValidUids);
      }
    }
    setEmailSubject('');
    setEmailBody('');
    setShowEmailModal(true);
  };

  const runEmailSending = async (targets) => {
    setSendingEmail(true);
    setBulkStatus({
      current: 0,
      total: targets.length,
      success: 0,
      fail: 0,
      errors: []
    });

    cancelBulkRef.current = false;
    let successCount = 0;
    let failCount = 0;
    const errorsList = [];
    let isCancelled = false;

    for (let i = 0; i < targets.length; i++) {
      if (cancelBulkRef.current) {
        errorsList.push({ email: 'Hệ thống', error: 'Đã huỷ bởi admin' });
        isCancelled = true;
        break;
      }

      const target = targets[i];
      setBulkStatus(prev => ({
        ...prev,
        current: i + 1,
        currentEmail: target.email
      }));

      try {
        let result;
        if (emailTemplate === 'welcome') {
          result = await sendWelcomeEmail({
            recipientEmail: target.email,
            displayName: target.name
          });
        } else {
          const bodyContent = emailBody.replace(/\[name\]/g, target.name || 'bạn').replace(/\[email\]/g, target.email);
          const subjContent = emailSubject.replace(/\[name\]/g, target.name || 'bạn').replace(/\[email\]/g, target.email);
          result = await sendCustomEmailToUser({
            recipientEmail: target.email,
            recipientName: target.name,
            subject: subjContent || 'Thông báo từ Ban quản trị Führerschein Việt-Đức',
            messageBody: bodyContent,
          });
        }

        if (result.success) {
          successCount++;
        } else {
          failCount++;
          errorsList.push({ email: target.email, error: result.error || 'Thất bại' });
        }
      } catch (err) {
        failCount++;
        errorsList.push({ email: target.email, error: err.message });
      }

      setBulkStatus(prev => ({
        ...prev,
        success: successCount,
        fail: failCount,
        errors: [...errorsList]
      }));

      await new Promise(resolve => setTimeout(resolve, 250));
    }

    setSendingEmail(false);
    if (isCancelled) {
      showToast(`⚠️ Đã dừng gửi. Thành công: ${successCount}, Thất bại: ${failCount}`, 'warning');
    } else if (failCount === 0) {
      showToast(`🎉 Đã gửi thành công tất cả ${successCount} email!`);
      setTimeout(() => {
        setShowEmailModal(false);
        setBulkStatus(null);
      }, 2500);
    } else {
      showToast(`⚠️ Hoàn thành với một số lỗi. Thành công: ${successCount}, Thất bại: ${failCount}`, 'error');
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();

    let targets = [];
    if (recipientType === 'single') {
      if (!emailModalUser?.email || !emailModalUser.email.includes('@')) {
        showToast('Email người nhận không hợp lệ!', 'error');
        return;
      }
      targets = [{ email: emailModalUser.email.trim(), name: emailModalUser.displayName || '' }];
    } else if (recipientType === 'list') {
      const selectedUsers = users.filter(u => modalSelectedUids.includes(u.id) && u.email && u.email.includes('@'));
      if (selectedUsers.length === 0) {
        showToast('Vui lòng chọn ít nhất một người nhận từ danh sách!', 'error');
        return;
      }
      targets = selectedUsers.map(u => ({ email: u.email.trim(), name: u.displayName || '' }));
    } else if (recipientType === 'custom') {
      if (!customRecipientEmail.trim()) {
        showToast('Vui lòng nhập địa chỉ email người nhận!', 'error');
        return;
      }
      const parts = customRecipientEmail.split(',').map(p => p.trim()).filter(p => p.includes('@'));
      if (parts.length === 0) {
        showToast('Không tìm thấy địa chỉ email hợp lệ nào!', 'error');
        return;
      }
      targets = parts.map(email => ({ email, name: '' }));
    }

    if (targets.length === 0) {
      showToast('Không có người nhận hợp lệ!', 'error');
      return;
    }

    if (targets.length === 1) {
      setSendingEmail(true);
      const target = targets[0];
      try {
        let result;
        if (emailTemplate === 'welcome') {
          result = await sendWelcomeEmail({
            recipientEmail: target.email,
            displayName: target.name
          });
        } else {
          const bodyContent = emailBody.replace(/\[name\]/g, target.name || 'bạn').replace(/\[email\]/g, target.email);
          const subjContent = emailSubject.replace(/\[name\]/g, target.name || 'bạn').replace(/\[email\]/g, target.email);
          result = await sendCustomEmailToUser({
            recipientEmail: target.email,
            recipientName: target.name,
            subject: subjContent || 'Thông báo từ Ban quản trị Führerschein Việt-Đức',
            messageBody: bodyContent,
          });
        }

        if (result.success) {
          showToast(`✅ Đã gửi email tới ${target.email} thành công!`);
          setShowEmailModal(false);
        } else {
          showToast('Lỗi gửi email: ' + (result.error || 'Thất bại'), 'error');
        }
      } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
      } finally {
        setSendingEmail(false);
      }
      return;
    }

    if (!window.confirm(`Xác nhận gửi email tới ${targets.length} địa chỉ đã chọn?`)) {
      return;
    }

    await runEmailSending(targets);
  };

  const handleRetryFailed = async () => {
    if (!bulkStatus || bulkStatus.errors.length === 0) return;
    const failedEmails = bulkStatus.errors.map(e => e.email).filter(e => e !== 'Hệ thống');
    const failedTargets = [];
    failedEmails.forEach(email => {
      const u = users.find(user => user.email === email);
      failedTargets.push({
        email,
        name: u ? u.displayName || '' : ''
      });
    });

    if (failedTargets.length === 0) {
      showToast('Không có người nhận hợp lệ để thử lại!', 'error');
      return;
    }

    if (!window.confirm(`Xác nhận gửi lại email cho ${failedTargets.length} địa chỉ đã thất bại?`)) {
      return;
    }

    await runEmailSending(failedTargets);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
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

  const handleAutoLockInactiveUsers = async () => {
    const confirmLock = window.confirm("Bạn có chắc muốn tự động khóa tất cả tài khoản không hoạt động hơn 1 tuần qua?");
    if (!confirmLock) return;

    setLoading(true);
    try {
      const { db } = await import('../lib/firebase');
      const { doc, writeBatch } = await import('firebase/firestore');
      
      const now = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

      // Find inactive users
      const inactiveUsers = users.filter(u => {
        if (u.banned) return false; // already banned/locked
        
        // Skip admin
        if (u.email && u.email.trim().toLowerCase() === ADMIN_EMAIL) return false;

        // Get last active time
        let lastActiveTime = 0;
        if (u.lastActive) {
          const t = new Date(u.lastActive).getTime();
          if (!isNaN(t)) lastActiveTime = t;
        }
        if (lastActiveTime === 0 && u.progress) {
          const entries = Object.values(u.progress);
          let maxTime = 0;
          entries.forEach(entry => {
            if (entry.timestamp) {
              const t = new Date(entry.timestamp).getTime();
              if (!isNaN(t) && t > maxTime) maxTime = t;
            }
          });
          lastActiveTime = maxTime;
        }
        if (lastActiveTime === 0 && u.createdAt) {
          const t = new Date(u.createdAt).getTime();
          if (!isNaN(t)) lastActiveTime = t;
        }

        if (lastActiveTime === 0) return false; // cannot determine activity time

        return (now - lastActiveTime) > oneWeekMs;
      });

      if (inactiveUsers.length === 0) {
        showToast("Không tìm thấy người dùng nào không hoạt động hơn 1 tuần.");
        setLoading(false);
        return;
      }

      const confirmProcess = window.confirm(`Tìm thấy ${inactiveUsers.length} tài khoản không hoạt động. Bắt đầu quá trình khoá tài khoản trên UI?`);
      if (!confirmProcess) {
        setLoading(false);
        return;
      }

      // Write in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < inactiveUsers.length; i += chunkSize) {
        const chunk = inactiveUsers.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(u => {
          const userRef = doc(db, 'users', u.id);
          batch.update(userRef, { banned: true, bannedReason: 'inactivity' });
        });
        await batch.commit();
      }

      // Update local state
      const lockedIds = inactiveUsers.map(u => u.id);
      setUsers(prev => prev.map(u => lockedIds.includes(u.id) ? { ...u, banned: true, bannedReason: 'inactivity' } : u));
      
      showToast(`Đã khoá thành công ${inactiveUsers.length} tài khoản do không hoạt động.`);
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi tự động khóa tài khoản: " + err.message, "error");
    }
    setLoading(false);
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
    <div className="admin-container" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #1a1a2e 100%)', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
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
          <div className="admin-header-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleSendWelcomeToAllUsers} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 15px rgba(16,185,129,0.4)' }}>
              <Mail size={16} /> Gửi Mail Chào Mừng Tất Cả ({users.filter(u => u.email && u.email.includes('@')).length})
            </button>
            <button onClick={() => handleOpenEmailModal(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 15px rgba(59,130,246,0.4)' }}>
              <Mail size={16} /> Soạn Email
            </button>
            <button onClick={handleAutoLockInactiveUsers} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 15px rgba(239,68,68,0.4)' }}>
              <Ban size={16} /> Khóa TK Không HĐ (&gt;1 tuần)
            </button>
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

        {/* Feedback Ratings */}
        <FeedbackSection />

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
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '14px 18px', width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && filtered.every(u => selectedUids.includes(u.id))}
                        onChange={handleToggleSelectAll}
                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                      />
                    </th>
                    {['Người dùng', 'Email', 'Ngày tham gia', 'Tiến độ', 'Bài thi', 'Trạng thái', 'Hành động'].map(h => (
                      <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, idx) => {
                    const calculateProgressStats = (progressObj) => {
                      if (!progressObj) return { total: 0, today: 0, yesterday: 0, lastDate: null };
                      const entries = Object.values(progressObj);
                      let total = entries.length;
                      let today = 0;
                      let yesterday = 0;
                      let maxTime = 0;

                      const now = new Date();
                      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                      const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

                      entries.forEach(entry => {
                        if (entry.timestamp) {
                          const t = new Date(entry.timestamp).getTime();
                          if (!isNaN(t)) {
                            if (t > maxTime) maxTime = t;
                            if (t >= startOfToday) {
                              today++;
                            } else if (t >= startOfYesterday) {
                              yesterday++;
                            }
                          }
                        }
                      });
                      return { total, today, yesterday, lastDate: maxTime > 0 ? new Date(maxTime) : null };
                    };
                    
                    const progStats = calculateProgressStats(u.progress);
                    const examCount = (u.examHistory || []).length;
                    const isSelected = selectedUids.includes(u.id);
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.2s', backgroundColor: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(99,102,241,0.08)' : 'transparent'}
                      >
                        <td className="col-select" data-label="Chọn" style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectUser(u.id)}
                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                          />
                        </td>
                        <td data-label="Người dùng" style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `hsl(${(idx * 47) % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', color: 'white', flexShrink: 0 }}>
                              {(u.displayName || u.email || '?')[0].toUpperCase()}
                            </div>
                            <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{u.displayName || 'Không tên'}</span>
                          </div>
                        </td>
                        <td data-label="Email" style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{u.email || '—'}</td>
                        <td data-label="Ngày tham gia" style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', whiteSpace: 'nowrap' }}>{formatDate(u.createdAt)}</td>
                        <td data-label="Tiến độ" style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1', fontSize: '13px', fontWeight: '700' }}>
                              <BookOpen size={14} /> {progStats.total} câu
                            </div>
                            {progStats.lastDate && (
                              <>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                                  Hôm nay: <span style={{ color: progStats.today > 0 ? '#10b981' : 'inherit', fontWeight: progStats.today > 0 ? '600' : 'normal' }}>+{progStats.today}</span> | Hqua: +{progStats.yesterday}
                                </div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                  Cuối: {formatDate(progStats.lastDate)}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td data-label="Bài thi" style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '13px', fontWeight: '600' }}>
                            <Award size={14} /> {examCount} lần
                          </div>
                        </td>
                        <td data-label="Trạng thái" style={{ padding: '14px 18px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: u.banned ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: u.banned ? '#ef4444' : '#10b981' }}>
                            {u.banned ? 'Bị khoá' : 'Hoạt động'}
                          </span>
                        </td>
                        <td data-label="Hành động" style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button title="Gửi Email" onClick={() => handleOpenEmailModal(u)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59,130,246,0.2)', border: 'none', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Mail size={15} />
                            </button>
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
          <div className="admin-modal-content" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: '20px', padding: '28px', maxWidth: '500px', width: '100%', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
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
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '2px' }}>Tham gia: {formatDate(selectedUser.createdAt)}</div>
                <div style={{ marginTop: '6px' }}>
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
              <button onClick={() => { const target = selectedUser; setSelectedUser(null); handleOpenEmailModal(target); }} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59,130,246,0.2)', border: '1px solid #3b82f6', color: '#60a5fa', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Mail size={16} /> Gửi Email cho người dùng
              </button>
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

      {/* Floating Bulk Actions Bar */}
      {selectedUids.length > 0 && (
        <div className="floating-bulk-bar" style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(30, 27, 75, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '16px',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          zIndex: 400,
          animation: 'slideUp 0.3s ease',
          flexWrap: 'wrap'
        }}>
          <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>
            Đã chọn {selectedUids.length} người dùng
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleOpenEmailModal('bulk')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', fontWeight: '700', border: 'none',
                cursor: 'pointer', fontSize: '13px'
              }}
            >
              <Mail size={14} /> Gửi Email
            </button>
            
            <button
              onClick={handleBulkToggleBan}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid #f59e0b',
                color: '#f59e0b', fontWeight: '700',
                cursor: 'pointer', fontSize: '13px'
              }}
            >
              <Ban size={14} /> Khoá / Mở khoá
            </button>

            <button
              onClick={handleBulkResetProgress}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid #6366f1',
                color: '#818cf8', fontWeight: '700',
                cursor: 'pointer', fontSize: '13px'
              }}
            >
              <RefreshCw size={14} /> Reset Tiến Độ
            </button>

            <button
              onClick={handleBulkDelete}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#f87171', fontWeight: '700',
                cursor: 'pointer', fontSize: '13px'
              }}
            >
              <Trash2 size={14} /> Xoá
            </button>

            <button
              onClick={() => setSelectedUids([])}
              style={{
                padding: '8px 12px', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none', color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '600', cursor: 'pointer', fontSize: '13px'
              }}
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => !sendingEmail && setShowEmailModal(false)}>
          <div className="admin-modal-content" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%)', borderRadius: '20px', padding: '28px', maxWidth: '520px', width: '100%', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                  <Mail size={22} />
                </div>
                <div>
                  <h3 style={{ color: 'white', fontWeight: '800', fontSize: '18px', margin: 0 }}>Gửi Email Trực Tiếp</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>Qua dịch vụ Resend API</p>
                </div>
              </div>
              <button disabled={sendingEmail} onClick={() => setShowEmailModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '8px', width: '32px', height: '32px', cursor: sendingEmail ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sendingEmail ? 0.5 : 1 }}><X size={16} /></button>
            </div>

            {bulkStatus ? (
              /* Tiến trình gửi email hàng loạt */
              <div>
                <h4 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '16px', fontWeight: '700' }}>
                  {sendingEmail ? '🚀 Đang gửi email hàng loạt...' : '🏁 Hoàn thành gửi email'}
                </h4>
                
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ color: '#6366f1', fontSize: '20px', fontWeight: '800' }}>{bulkStatus.current} / {bulkStatus.total}</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: '2px' }}>Tiến trình</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ color: '#10b981', fontSize: '20px', fontWeight: '800' }}>{bulkStatus.success}</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: '2px' }}>Thành công</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ color: '#ef4444', fontSize: '20px', fontWeight: '800' }}>{bulkStatus.fail}</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: '2px' }}>Thất bại</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1, #10b981)',
                    width: `${(bulkStatus.current / bulkStatus.total) * 100}%`,
                    transition: 'width 0.2s ease'
                  }} />
                </div>

                {/* Current Target */}
                {sendingEmail && bulkStatus.currentEmail && (
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Gửi tới: <strong style={{ color: 'white' }}>{bulkStatus.currentEmail}</strong>...</span>
                  </div>
                )}

                {/* Lỗi chi tiết */}
                {bulkStatus.errors.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Danh sách lỗi ({bulkStatus.errors.length})</div>
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '10px',
                      maxHeight: '150px',
                      overflowY: 'auto',
                      padding: '10px',
                      fontSize: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      {bulkStatus.errors.map((err, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5' }}>
                          <span style={{ fontWeight: '600' }}>{err.email}</span>
                          <span style={{ opacity: 0.85 }}>{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {sendingEmail ? (
                    <button
                      type="button"
                      onClick={() => {
                        cancelBulkRef.current = true;
                        showToast('Đang dừng tiến trình gửi...', 'warning');
                      }}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        color: '#f87171', fontWeight: '700',
                        cursor: 'pointer', fontSize: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                      }}
                    >
                      <StopCircle size={16} /> Dừng gửi
                    </button>
                  ) : (
                    <>
                      {bulkStatus.fail > 0 && (
                        <button
                          type="button"
                          onClick={handleRetryFailed}
                          style={{
                            flex: 1, padding: '12px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            border: 'none', color: 'white', fontWeight: '700',
                            cursor: 'pointer', fontSize: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            boxShadow: '0 4px 15px rgba(245,158,11,0.4)'
                          }}
                        >
                          <RefreshCw size={16} /> Thử lại các lỗi ({bulkStatus.fail})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowEmailModal(false);
                          setBulkStatus(null);
                        }}
                        style={{
                          flex: 1, padding: '12px', borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: 'white', fontWeight: '700',
                          cursor: 'pointer', fontSize: '14px'
                        }}
                      >
                        Đóng
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Composer gửi email */
              <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {!emailModalUser && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Phương thức chọn người nhận</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      {[
                        { type: 'list', label: 'Chọn từ danh sách' },
                        { type: 'custom', label: 'Nhập email thủ công' }
                      ].map(opt => {
                        const isSel = recipientType === opt.type;
                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => setRecipientType(opt.type)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              border: isSel ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                              background: isSel ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                              color: isSel ? '#a5b4fc' : 'rgba(255, 255, 255, 0.7)',
                              fontWeight: '700',
                              fontSize: '13px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!emailModalUser && recipientType === 'list' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Danh sách người nhận ({modalSelectedUids.length})
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setModalSelectedUids(users.filter(u => u.email && u.email.includes('@')).map(u => u.id))}
                          style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                        >
                          Chọn tất cả
                        </button>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>|</span>
                        <button
                          type="button"
                          onClick={() => setModalSelectedUids([])}
                          style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên hoặc email..."
                      value={modalSearch}
                      onChange={e => setModalSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'white',
                        fontSize: '13px',
                        outline: 'none',
                        marginBottom: '8px',
                        boxSizing: 'border-box'
                      }}
                    />

                    <div style={{
                      maxHeight: '160px',
                      overflowY: 'auto',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '6px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      {users
                        .filter(u => u.email && u.email.includes('@'))
                        .filter(u =>
                          (u.displayName || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(modalSearch.toLowerCase())
                        )
                        .map(u => {
                          const isSel = modalSelectedUids.includes(u.id);
                          return (
                            <label
                              key={u.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                background: isSel ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                color: 'white',
                                fontSize: '13px'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = isSel ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.04)'}
                              onMouseLeave={e => e.currentTarget.style.background = isSel ? 'rgba(99, 102, 241, 0.08)' : 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={isSel}
                                onChange={() => {
                                  setModalSelectedUids(prev =>
                                    prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                                  );
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '600' }}>{u.displayName || 'Không tên'}</span>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{u.email}</span>
                              </div>
                            </label>
                          );
                        })}
                      {users.filter(u => u.email && u.email.includes('@')).filter(u =>
                        (u.displayName || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(modalSearch.toLowerCase())
                      ).length === 0 && (
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textAlign: 'center', padding: '12px 0' }}>
                          Không tìm thấy người dùng phù hợp
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hiện khi chọn gửi 1 user */}
                {recipientType === 'single' && emailModalUser && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Người nhận</label>
                    <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#818cf8', fontSize: '14px', fontWeight: '600' }}>
                      {emailModalUser.displayName ? `${emailModalUser.displayName} <${emailModalUser.email}>` : emailModalUser.email}
                    </div>
                  </div>
                )}

                {/* Nhập thủ công */}
                {recipientType === 'custom' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Danh sách Email người nhận</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="email1@example.com, email2@example.com..."
                      value={customRecipientEmail}
                      onChange={e => setCustomRecipientEmail(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', display: 'block' }}>Nhập các email cách nhau bởi dấu phẩy.</span>
                  </div>
                )}

                {/* Chọn mẫu Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Mẫu Email</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setEmailTemplate('custom')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: emailTemplate === 'custom' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: emailTemplate === 'custom' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: emailTemplate === 'custom' ? '#a5b4fc' : 'rgba(255, 255, 255, 0.7)',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Tùy chỉnh nội dung
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailTemplate('welcome')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: emailTemplate === 'welcome' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: emailTemplate === 'welcome' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: emailTemplate === 'welcome' ? '#a5b4fc' : 'rgba(255, 255, 255, 0.7)',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Thư chào mừng hệ thống
                    </button>
                  </div>
                </div>

                {/* Tiêu đề */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Tiêu đề Email</label>
                  <input
                    type="text"
                    required
                    disabled={emailTemplate === 'welcome'}
                    placeholder="Ví dụ: Cập nhật tài khoản / Thông báo quan trọng"
                    value={emailTemplate === 'welcome' ? '🎉 Cảm ơn bạn đã đăng ký tài khoản tại fuhrerscheinvide.site' : emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: emailTemplate === 'welcome' ? 'rgba(255,255,255,0.5)' : 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Nội dung */}
                {emailTemplate === 'custom' ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nội dung Email</label>
                      <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '600' }}>Sử dụng [name], [email] để chèn thông tin</span>
                    </div>
                    <textarea
                      required
                      rows={6}
                      placeholder="Nhập nội dung thư thông báo gửi tới người dùng ở đây..."
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                ) : (
                  <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
                    ℹ️ Hệ thống sẽ tự động gửi thư chào mừng chuẩn HTML cho người nhận, chứa hướng dẫn sử dụng và thông tin tài khoản của họ. Bạn không cần nhập nội dung.
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowEmailModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                    Huỷ
                  </button>
                  <button type="submit" disabled={sendingEmail} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: sendingEmail ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', color: 'white', fontWeight: '700', cursor: sendingEmail ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(59,130,246,0.4)' }}>
                    {sendingEmail ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                    {sendingEmail ? 'Đang gửi...' : recipientType !== 'single' && recipientType !== 'custom' ? 'Bắt đầu gửi hàng loạt' : 'Gửi Email Ngay'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}
