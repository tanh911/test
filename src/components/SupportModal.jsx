import React, { useEffect, useState } from 'react';
import { X, Heart, Coffee, CreditCard, ExternalLink, BellOff } from 'lucide-react';

const STORAGE_KEY = 'fuhrerschein_support_popup_dismissed';

export const SupportModal = ({ isOpen, onClose, onNeverShow, languageMode = 'vi', isAutoPopup = false }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay to trigger CSS entrance animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);
  if (!isOpen) return null;

  const t = (vi, de) => (languageMode === 'de' ? de : vi);

  const supportMethods = [
    {
      id: 'paypal',
      name: 'PayPal (Account Full 5.99€)',
      icon: <CreditCard size={24} color="#2563eb" />,
      desc: t('Mua Account Full trọn đời (5.99€) qua PayPal.', 'Vollversion-Account für 5.99€ über PayPal freischalten.'),
      link: 'https://www.paypal.com/paypalme/natra3thai4/5.99',
      bg: '#eff6ff', border: '#bfdbfe', hover: '#60a5fa'
    },
    {
      id: 'buymeacoffee',
      name: 'Buy Me a Coffee',
      icon: <Coffee size={24} color="#d97706" />,
      desc: t('Mời chúng mình một ly cà phê.', 'Geben Sie uns einen Kaffee aus.'),
      link: 'https://buymeacoffee.com/vanmenh24h',
      bg: '#fffbeb', border: '#fde68a', hover: '#fbbf24'
    }
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
      backdropFilter: 'blur(4px)', padding: '16px',
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{
        backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '448px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease'
      }}>

        {/* Header */}
        <div style={{
          position: 'relative', padding: '24px', textAlign: 'center', borderBottom: '1px solid #f3f4f6',
          background: 'linear-gradient(to bottom right, #f0fdf4, #d1fae5)'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px', padding: '8px', color: '#6b7280',
              backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '9999px', border: 'none', cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>

          <div style={{
            width: '64px', height: '64px', backgroundColor: '#ffffff', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            margin: '0 auto 12px auto'
          }}>
            <Heart size={32} color="#f43f5e" fill="#f43f5e" />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>
            {t('Ủng hộ dự án', 'Projekt unterstützen')}
          </h2>
          <p style={{ fontSize: '14px', color: '#4b5563', margin: 0, padding: '0 16px' }}>
            {t(
              'Sự ủng hộ của bạn giúp chúng mình duy trì máy chủ và phát triển thêm các tính năng mới.',
              'Ihre Unterstützung hilft uns, die Server zu betreiben und neue Funktionen zu entwickeln.'
            )}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', backgroundColor: '#ffffff', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {supportMethods.map((method) => (
            <a
              key={method.id}
              href={method.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', borderRadius: '12px',
                border: `2px solid ${method.border}`, backgroundColor: method.bg, textDecoration: 'none',
                transition: 'all 0.2s', cursor: 'pointer', color: 'inherit'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = method.hover}
              onMouseOut={(e) => e.currentTarget.style.borderColor = method.border}
            >
              <div style={{
                flexShrink: 0, backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid rgba(0,0,0,0.05)'
              }}>
                {method.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontWeight: 'bold', color: '#111827', margin: 0, fontSize: '16px' }}>{method.name}</h3>
                  <ExternalLink size={14} color="#9ca3af" />
                </div>
                <p style={{ fontSize: '14px', color: '#4b5563', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  {method.desc}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: isAutoPopup ? 'space-between' : 'center' }}>
            {isAutoPopup && (
              <button
                onClick={() => { onNeverShow && onNeverShow(); onClose && onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', backgroundColor: 'transparent', color: '#9ca3af',
                  borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px',
                  cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#9ca3af'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <BellOff size={14} />
                {t('Không hiển thị lại', 'Nicht mehr anzeigen')}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px', backgroundColor: '#e5e7eb', color: '#374151', fontWeight: 'bold',
                borderRadius: '8px', border: 'none', fontSize: '14px', cursor: 'pointer'
              }}
            >
              {t('Để sau', 'Später')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
