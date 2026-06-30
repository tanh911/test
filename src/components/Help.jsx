import React, { useState } from 'react';
import { Mail, Send, CheckCircle, HelpCircle, ArrowLeft, Clock } from 'lucide-react';

export const Help = ({ user, onNavigate, languageMode = 'both' }) => {
  const [bugCategory, setBugCategory] = useState('app');
  const [bugDescription, setBugDescription] = useState('');
  const [bugSubmitted, setBugSubmitted] = useState(false);
  const [bugSubmitting, setBugSubmitting] = useState(false);

  const t = (vi, de) => {
    if (languageMode === 'vi') return vi;
    if (languageMode === 'de') return de;
    return `${vi} / ${de}`;
  };

  const handleSubmitBug = async (e) => {
    e.preventDefault();
    if (!bugDescription.trim()) return;
    setBugSubmitting(true);
    
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
          category: bugCategory,
          description: bugDescription,
          userName: user?.displayName || 'Anonymous',
          userEmail: user?.email || 'Not provided',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setBugSubmitted(true);
        setBugDescription('');
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('Bug report error:', error);
      import('../utils/customAlert').then(({ customAlert }) => {
        customAlert(languageMode === 'vi' ? 'Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại.' : 'Fehler beim Senden des Berichts.', 'error');
      });
    } finally {
      setBugSubmitting(false);
    }
  };

  return (
    <div style={{ flex: 1, backgroundColor: '#f4f7f9', overflowY: 'auto', padding: '24px 16px', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          {onNavigate && (
            <button 
              onClick={() => onNavigate('/')}
              style={{
                width: '36px', height: '36px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 style={{ fontSize: 'calc(20px * var(--text-scale, 1))', fontWeight: '800', color: '#1e293b', margin: 0 }}>
              {t('Trợ giúp & Hỗ trợ', 'Hilfe & Support')}
            </h1>
            <p style={{ fontSize: 'calc(13px * var(--text-scale, 1))', color: '#64748b', marginTop: '4px' }}>
              {t('Chúng tôi có thể giúp gì cho bạn?', 'Wie können wir Ihnen helfen?')}
            </p>
          </div>
        </div>

        {/* Contact Info Card */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #eef2f6' }}>
          <h2 style={{ fontSize: 'calc(16px * var(--text-scale, 1))', fontWeight: '700', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} color="#2b576b" /> {t('Liên hệ trực tiếp', 'Direkter Kontakt')}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#e0f2fe', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                <Mail size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'calc(11px * var(--text-scale, 1))', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{t('Email hỗ trợ', 'E-Mail Support')}</div>
                <div style={{ fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>supportsplitvie@gmail.com</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#fef3c7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'calc(11px * var(--text-scale, 1))', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{t('Giờ phản hồi', 'Antwortzeit')}</div>
                <div style={{ fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>{t('Trong vòng 24 giờ', 'Innerhalb von 24 Stunden')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bug Report Form Card */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #eef2f6' }}>
          <h2 style={{ fontSize: 'calc(16px * var(--text-scale, 1))', fontWeight: '700', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={18} color="#2b576b" /> {t('Gửi phản hồi / Báo lỗi', 'Feedback / Fehler melden')}
          </h2>

          {bugSubmitted ? (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
              <CheckCircle size={32} color="#16a34a" />
              <div>
                <div style={{ fontSize: 'calc(15px * var(--text-scale, 1))', fontWeight: '700', color: '#166534' }}>{t('Gửi phản hồi thành công!', 'Erfolgreich gesendet!')}</div>
                <p style={{ fontSize: 'calc(13px * var(--text-scale, 1))', color: '#475569', marginTop: '6px' }}>
                  {t('Cảm ơn đóng góp của bạn. Chúng tôi sẽ kiểm tra và phản hồi sớm nhất có thể.', 'Vielen Dank. Wir werden dies schnellstmöglich prüfen.')}
                </p>
              </div>
              <button
                onClick={() => setBugSubmitted(false)}
                style={{ marginTop: '8px', background: '#2b576b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: 'calc(13px * var(--text-scale, 1))', fontWeight: '600', cursor: 'pointer' }}
              >
                {t('Gửi báo cáo khác', 'Weiterer Bericht')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitBug} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: 'calc(12px * var(--text-scale, 1))', fontWeight: '700', color: '#475569' }}>{t('Chủ đề', 'Thema')}</label>
                <select
                  value={bugCategory}
                  onChange={(e) => setBugCategory(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#1e293b', fontSize: 'calc(14px * var(--text-scale, 1))' }}
                >
                  <option value="app">{t('Lỗi ứng dụng (App Bug)', 'App-Fehler / Bug')}</option>
                  <option value="translation">{t('Góp ý dịch thuật / Câu hỏi', 'Übersetzung / Fragen')}</option>
                  <option value="feature">{t('Đề xuất tính năng mới', 'Verbesserungsvorschlag')}</option>
                  <option value="other">{t('Hỗ trợ khác', 'Sonstiges')}</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: 'calc(12px * var(--text-scale, 1))', fontWeight: '700', color: '#475569' }}>{t('Nội dung chi tiết', 'Beschreibung')}</label>
                <textarea
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  rows={5}
                  placeholder={t('Vui lòng mô tả chi tiết vấn đề bạn gặp phải...', 'Bitte beschreiben Sie das Problem...')}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#1e293b', fontSize: 'calc(14px * var(--text-scale, 1))', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={bugSubmitting}
                style={{
                  width: '100%', padding: '14px', borderRadius: '8px',
                  background: '#2b576b', color: 'white', border: 'none',
                  fontSize: 'calc(14px * var(--text-scale, 1))', fontWeight: '700',
                  cursor: bugSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: bugSubmitting ? 0.7 : 1, transition: 'background 0.2s'
                }}
              >
                <Send size={18} />
                <span>{bugSubmitting ? t('Đang gửi...', 'Wird gesendet...') : t('Gửi yêu cầu hỗ trợ', 'Support-Anfrage senden')}</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
