import React, { useEffect, useState } from 'react';

const POPUP_LAST_SHOWN_KEY = 'fuhrerschein_popup_last_shown';
const POPUP_DISMISSED_KEY  = 'fuhrerschein_support_popup_dismissed';
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export const WelcomePopup = ({ isOpen, onClose, onNeverShow, onDonate, languageMode = 'vi', user }) => {
  const [visible, setVisible]     = useState(false);
  const [hovered, setHovered]     = useState(0);   // star being hovered
  const [selected, setSelected]   = useState(0);   // star selected
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [comment, setComment]     = useState('');

  const t = (vi, de) => (languageMode === 'de' ? de : vi);

  useEffect(() => {
    if (isOpen) {
      setSelected(0);
      setSubmitted(false);
      setComment('');
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const markShown = () => {
    localStorage.setItem(POPUP_LAST_SHOWN_KEY, Date.now().toString());
  };

  const handleStarSubmit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { db } = await import('../lib/firebase');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'feedback'), {
        stars: selected,
        comment: comment.trim(),
        uid: user?.uid || 'guest',
        displayName: user?.displayName || 'Khách',
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.warn('feedback save error:', e);
    }
    setSaving(false);
    setSubmitted(true);
    markShown();
    setTimeout(() => onClose?.(), 1400);
  };

  const handleDonate = () => {
    markShown();
    onClose?.();
    onDonate?.();
  };

  const handleNeverShow = () => {
    localStorage.setItem(POPUP_DISMISSED_KEY, 'true');
    onNeverShow?.();
    onClose?.();
  };

  const display = hovered || selected;

  const starLabel = [
    '', 
    t('Tệ', 'Schlecht'),
    t('Tạm', 'Okay'),
    t('Tốt', 'Gut'),
    t('Rất tốt', 'Sehr gut'),
    t('Tuyệt vời! 🎉', 'Super! 🎉'),
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
      backdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
      WebkitBackdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
      transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      paddingTop: '80px',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <div style={{
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
          padding: '24px 26px 20px',
          width: '300px',
          textAlign: 'center',
        }}>

          {submitted ? (
            /* ── Thank you state ── */
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
              <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                {t('Cảm ơn bạn!', 'Danke schön!')}
              </p>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#6b7280' }}>
                {t('Phản hồi của bạn giúp team cải thiện hơn.', 'Ihr Feedback hilft uns, besser zu werden.')}
              </p>
            </div>
          ) : (
            <>
              {/* Heading */}
              <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                {t('Bạn thấy ứng dụng thế nào? 🙌', 'Wie findest du die App? 🙌')}
              </p>
              <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#6b7280', lineHeight: 1.5 }}>
                {t(
                  'Đánh giá giúp team biết cần cải thiện gì.',
                  'Deine Bewertung hilft uns zu verbessern.'
                )}
              </p>

              {/* Stars */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setSelected(star)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      fontSize: '28px', lineHeight: 1,
                      filter: star <= display ? 'none' : 'grayscale(1) opacity(0.25)',
                      transform: star <= display ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.15s, filter 0.15s',
                    }}
                  >
                    ⭐
                  </button>
                ))}
              </div>

              {/* Star label */}
              <div style={{
                fontSize: '12px', color: '#6366f1', fontWeight: '600',
                minHeight: '18px', marginBottom: selected ? '12px' : '14px',
                transition: 'opacity 0.15s',
                opacity: display ? 1 : 0,
              }}>
                {starLabel[display]}
              </div>

              {/* Comment textarea – appears after star selected */}
              <div style={{
                maxHeight: selected ? '90px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease',
                marginBottom: selected ? '12px' : '0',
              }}>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={t('Bình luận thêm (không bắt buộc)...', 'Kommentar (optional)...')}
                  maxLength={300}
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '9px 12px', fontSize: '12.5px',
                    border: '1.5px solid #e5e7eb', borderRadius: '8px',
                    resize: 'none', outline: 'none', fontFamily: 'inherit',
                    color: '#374151', lineHeight: 1.5,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Submit star */}
              <button
                onClick={handleStarSubmit}
                disabled={!selected || saving}
                style={{
                  width: '100%', padding: '10px',
                  background: selected ? '#111827' : '#e5e7eb',
                  color: selected ? '#fff' : '#9ca3af',
                  border: 'none', borderRadius: '9px', cursor: selected ? 'pointer' : 'not-allowed',
                  fontSize: '13.5px', fontWeight: '700',
                  transition: 'all 0.2s', marginBottom: '8px',
                }}
                onMouseOver={(e) => { if (selected) e.currentTarget.style.background = '#1f2937'; }}
                onMouseOut={(e) => { if (selected) e.currentTarget.style.background = '#111827'; }}
              >
                {saving ? t('Đang gửi...', 'Wird gesendet...') : t('Gửi đánh giá', 'Bewertung senden')}
              </button>

              {/* Donate */}
              <button
                onClick={handleDonate}
                style={{
                  width: '100%', padding: '9px',
                  background: 'transparent',
                  color: '#059669', border: '1.5px solid #d1fae5',
                  borderRadius: '9px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600',
                  transition: 'all 0.15s', marginBottom: '10px',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f0fdf4'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                ☕ {t('Ủng hộ team', 'Team unterstützen')}
              </button>

              {/* Never show again */}
              <button
                onClick={handleNeverShow}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '11.5px', color: '#d1d5db',
                  transition: 'color 0.15s', padding: '2px',
                  width: '100%',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#9ca3af'}
                onMouseOut={(e) => e.currentTarget.style.color = '#d1d5db'}
              >
                {t('Không hiển thị lại', 'Nicht mehr anzeigen')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/** Helper used in App.jsx to decide whether to show the popup */
export const shouldShowPopup = () => {
  if (localStorage.getItem(POPUP_DISMISSED_KEY)) return false;
  const lastShown = localStorage.getItem(POPUP_LAST_SHOWN_KEY);
  if (!lastShown) return true;
  return Date.now() - parseInt(lastShown, 10) > ONE_MONTH_MS;
};
