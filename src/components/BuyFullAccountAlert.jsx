import React, { useState, useEffect } from 'react';
import { CreditCard, ExternalLink, X, Crown, Sparkles, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'fuhrerschein_buy_alert_dismissed';

export const BuyFullAccountAlert = ({ languageMode = 'vi', user }) => {
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  // If user is already premium, no need to show buy prompt
  if (user?.isPremium) {
    return null;
  }

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleReopen = () => {
    setDismissed(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const paypalUrl = 'https://www.paypal.com/paypalme/natra3thai4/5.99';

  const t = (vi, de) => {
    if (languageMode === 'de') return de;
    if (languageMode === 'vi') return vi;
    return `${vi} / ${de}`;
  };

  if (dismissed) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '6px 16px',
        background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button
          onClick={handleReopen}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fbbf24',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Crown size={14} color="#fbbf24" />
          <span>{t('Mua Account Premium (5.99€)', 'Premium-Account kaufen (5.99€)')}</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Top Alert Banner */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)',
        color: '#ffffff',
        padding: '10px 16px',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        fontSize: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
          <span style={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            color: '#1e1b4b',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '900',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}>
            <Crown size={13} /> PREMIUM
          </span>
          <span style={{ fontSize: '13.5px', color: '#f8fafc' }}>
            {t(
              'Sở hữu Account Premium Führerschein trọn đời chỉ 5.99€!',
              'Holen Sie sich den Führerschein Premium-Account für nur 5.99€!'
            )}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href={paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0070ba',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.3)',
              transition: 'transform 0.15s, backgroundColor 0.15s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#005ea6';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#0070ba';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <CreditCard size={15} />
            <span>{t('Mua qua PayPal (5.99€)', 'Mit PayPal kaufen (5.99€)')}</span>
            <ExternalLink size={13} />
          </a>

          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            {t('Chi tiết', 'Details')}
          </button>

          <button
            onClick={handleDismiss}
            title={t('Tắt thông báo', 'Schließen')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'color 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Detailed Modal when user clicks "Chi tiết" */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              position: 'relative',
              padding: '24px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              color: '#ffffff'
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '8px',
                  color: '#ffffff',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <Crown size={34} color="#fbbf24" />
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0' }}>
                {t('Nâng Cấp Tài Khoản Premium', 'Premium-Account Freischalten')}
              </h2>
              <p style={{ fontSize: '14px', color: '#93c5fd', margin: 0 }}>
                {t('Giá ưu đãi chỉ 5.99€ qua PayPal', 'Sonderpreis nur 5.99€ via PayPal')}
              </p>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  t('Truy cập không giới hạn bộ 1200+ câu hỏi thi lý thuyết Führerschein', 'Unbegrenzter Zugriff auf alle 1200+ Führerschein-Prüfungsfragen'),
                  t('Hỗ trợ dịch chuẩn tiếng Việt & giải thích chi tiết đáp án', 'Standard-Übersetzung auf Vietnamesisch & detaillierte Erklärungen'),
                  t('Mô phỏng thi như thật & Lưu tiến trình học cá nhân', 'Echte Prüfungssimulation & Speicherung des Lernfortschritts'),
                  t('Sử dụng bộ mô phỏng lái xe 3D và không quảng cáo', 'Zugriff auf 3D-Fahrsimulator ohne Werbung')
                ].map((feature, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#374151' }}>
                    <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '8px',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: '600', marginBottom: '8px' }}>
                  {t('Thanh toán an toàn qua PayPal (5.99€):', 'Sichere Zahlung über PayPal (5.99€):')}
                </div>
                <a
                  href={paypalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0070ba',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '15px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(0, 112, 186, 0.3)',
                    boxSizing: 'border-box'
                  }}
                >
                  <CreditCard size={20} />
                  <span>{t('MUA NGAY BẰNG PAYPAL (5.99€)', 'JETZT MIT PAYPAL KAUFEN (5.99€)')}</span>
                  <ExternalLink size={16} />
                </a>
                <div style={{ fontSize: '11.5px', color: '#6b7280', marginTop: '8px' }}>
                  Link direct: <code style={{ color: '#2563eb', wordBreak: 'break-all' }}>{paypalUrl}</code>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', backgroundColor: '#f9fafb', borderTop: '1px solid #f3f4f6', textAlign: 'right' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '9px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  fontWeight: '700',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                {t('Đóng', 'Schließen')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
