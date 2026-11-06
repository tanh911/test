import React from 'react';
import {
  CheckCircle2, AlertOctagon, RotateCcw, Home, Car, Building2,
  Navigation, Compass, Sparkles, ShieldCheck, Gauge, Zap, Play,
  ArrowRight, X, Eye, AlertTriangle
} from 'lucide-react';

export const WelcomeModal = ({ onStart }) => (
  <div style={{
    position: 'absolute', top: '48%', left: '50%', transform: 'translate(-50%,-50%)',
    background: 'rgba(15, 23, 42, 0.95)', color: 'white', padding: '26px 36px', borderRadius: 22,
    textAlign: 'center', border: '1.5px solid rgba(56, 189, 248, 0.5)', zIndex: 20,
    maxWidth: 520, width: '92%', boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
  }}>
    <div style={{
      width: 54, height: 54, borderRadius: 16, background: 'rgba(56, 189, 248, 0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
      border: '1px solid rgba(56, 189, 248, 0.3)'
    }}>
      <Car size={28} color="#38bdf8" />
    </div>
    <div style={{ fontWeight: '900', fontSize: 19, color: '#f8fafc', marginBottom: 4 }}>
      Mercedes-Benz GLS 580 · Mô Phỏng Lái Xe 3D
    </div>
    <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 14, lineHeight: '1.5' }}>
      Mô phỏng buồng lái ô tô 3D chân thực với vật lý quán tính, góc nhìn đa điểm và chấm điểm sát hạch thực hành StVO Đức.
    </div>
    <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: 14, fontSize: 11.5, color: '#cbd5e1', marginBottom: 18, textAlign: 'left', lineHeight: '1.75' }}>
      • <b>W / ↑</b>: Tăng ga &nbsp; | &nbsp; <b>S / ↓</b>: Phanh dừng<br />
      • <b>A / D</b>: Đánh lái &nbsp; | &nbsp; <b>Q / E</b>: Xi-nhan<br />
      • <b>Z / X</b>: Schulterblick &nbsp; | &nbsp; <b>V</b>: Đổi góc nhìn<br />
      • <b>B</b>: Thắt dây an toàn &nbsp; | &nbsp; <b>D / R / P</b>: Cần số
    </div>
    <button onClick={onStart} style={{
      width: '100%', padding: '13px', borderRadius: 12,
      background: 'linear-gradient(135deg, #0284c7, #2563eb)', border: 'none',
      color: 'white', fontWeight: '800', fontSize: 14, cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(2,132,199,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
    }}>
      <Play size={16} fill="currentColor" /> BẮT ĐẦU MÔ PHỎNG LÁI XE
    </button>
  </div>
);

export const CollisionModal = ({ collision, onResume }) => (
  <div style={{
    position: 'absolute', inset: 0, background: 'rgba(220, 38, 38, 0.5)', backdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24
  }}>
    <div style={{
      background: '#0f172a', border: '2px solid #ef4444', borderRadius: 20, padding: 32,
      maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
        border: '1px solid rgba(239, 68, 68, 0.4)'
      }}>
        <AlertOctagon size={32} color="#ef4444" />
      </div>
      <h2 style={{ margin: 0, fontSize: 19, color: '#f87171', fontWeight: '800' }}>{collision.messageVi}</h2>
      <h3 style={{ margin: '6px 0 16px 0', fontSize: 13, color: '#94a3b8', fontStyle: 'italic', fontWeight: 'normal' }}>{collision.messageDe}</h3>
      <p style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: '1.6', marginBottom: 24 }}>
        Trong bài thi thực hành tại Đức, va chạm giao thông hoặc va quẹt rào chắn là lỗi vi phạm nghiêm trọng làm dừng bài thi lập tức.
      </p>
      <button onClick={onResume} style={{
        width: '100%', background: '#ef4444', color: 'white', border: 'none',
        padding: 13, borderRadius: 12, fontSize: 14, fontWeight: '800', cursor: 'pointer'
      }}>
        Tiếp tục bài thi / Fortfahren
      </button>
    </div>
  </div>
);

export const FinishedModal = ({ score, events, onRetry, onHome }) => (
  <div style={{
    position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(16px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24
  }}>
    <div style={{
      background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
      border: `2px solid ${score >= 70 ? '#10b981' : '#ef4444'}`,
      borderRadius: 24, padding: 36, maxWidth: 520, width: '100%', textAlign: 'center',
      boxShadow: '0 30px 80px rgba(0,0,0,0.7)', overflowY: 'auto', maxHeight: '90vh'
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: score >= 70 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
      }}>
        {score >= 70 ? <CheckCircle2 size={36} color="#10b981" /> : <AlertOctagon size={36} color="#ef4444" />}
      </div>
      <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        KẾT QUẢ BÀI THI THỰC HÀNH (PRAKTISCHE PRÜFUNG)
      </div>
      <h2 style={{ fontSize: 24, fontWeight: '900', color: score >= 70 ? '#34d399' : '#f87171', margin: '8px 0 16px 0' }}>
        {score >= 70 ? 'BESTANDEN - ĐÃ ĐẠT BÀI THI!' : 'NICHT BESTANDEN - CHƯA ĐẠT'}
      </h2>
      <div style={{
        background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px 24px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center'
      }}>
        <div>
          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>TỔNG ĐIỂM</div>
          <div style={{ fontSize: 36, fontWeight: '900', color: score >= 70 ? '#10b981' : '#ef4444' }}>
            {score}<span style={{ fontSize: 16, color: '#64748b' }}>/100</span>
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
        <div>
          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>KẾT QUẢ</div>
          <div style={{ fontSize: 15, fontWeight: '800', color: 'white', marginTop: 4 }}>
            {score >= 70 ? 'ĐẠT ĐIỀU KIỆN' : 'CẦN ÔN LẠI'}
          </div>
        </div>
      </div>
      {events.filter(e => !e.passed).length > 0 && (
        <div style={{ textAlign: 'left', marginBottom: 24, background: 'rgba(239,68,68,0.1)', padding: 14, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)' }}>
          <div style={{ color: '#f87171', fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>
            Danh sách lỗi vi phạm (Fehlerpunkte):
          </div>
          {events.filter(e => !e.passed).map((e, i) => (
            <div key={i} style={{ color: '#fca5a5', fontSize: 12, marginBottom: 4 }}>• {e.msg}</div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onRetry} style={{
          flex: 1, padding: 13, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
          border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: '800', fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <RotateCcw size={15} /> Thi lại ngay
        </button>
        <button onClick={onHome} style={{
          flex: 1, padding: 13, background: 'rgba(255,255,255,0.1)', color: 'white',
          border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, cursor: 'pointer',
          fontWeight: '800', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <Home size={15} /> Trang chủ
        </button>
      </div>
    </div>
  </div>
);

export const QuickGuideModal = ({
  onClose,
  onStartDriving,
  initialTab = 'SA_HINH',
  isDriving = false
}) => {
  const [activeTab, setActiveTab] = React.useState(initialTab || 'SA_HINH');
  const [freeDriveMap, setFreeDriveMap] = React.useState('sa_hinh_fahrschule');
  const [dontShowAgain, setDontShowAgain] = React.useState(false);

  const TABS = [
    {
      id: 'SA_HINH',
      label: 'Sa hình',
      sublabel: 'Fahrschule StVO',
      icon: Car,
      color: '#10b981',
      defaultMap: 'sa_hinh_fahrschule',
      badge: '8 bài tập chuẩn',
      bgGradient: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.3), transparent 70%), linear-gradient(180deg, rgba(6, 78, 59, 0.75) 0%, rgba(2, 44, 34, 0.95) 100%)',
      desc: 'Bãi tập sa hình StVO rộng lớn với ziczac, lùi chuồng ghép xe, vòng xuyến & phanh ABS.',
      btnText: 'VÀO SÂN SA HÌNH',
      btnGradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
    },
    {
      id: 'STADT',
      label: 'Nội đô',
      sublabel: 'Stadt (stadt.pbf)',
      icon: Building2,
      color: '#38bdf8',
      defaultMap: 'stadt_zentrum',
      badge: 'Berlin-Mitte StVO',
      bgGradient: 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.3), transparent 70%), linear-gradient(180deg, rgba(12, 74, 110, 0.75) 0%, rgba(8, 47, 73, 0.95) 100%)',
      desc: 'Nội đô thành phố với nút giao ngã 4, đèn giao thông, vạch người đi bộ và quy tắc Rechts vor Links.',
      btnText: 'VÀO LÁI NỘI ĐÔ (STADT)',
      btnGradient: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)'
    },
    {
      id: 'LAND',
      label: 'Đường tỉnh',
      sublabel: 'Land (land.pbf)',
      icon: Compass,
      color: '#22c55e',
      defaultMap: 'landstrasse_b2',
      badge: 'Landstraße 100km/h',
      bgGradient: 'radial-gradient(circle at top right, rgba(34, 197, 94, 0.3), transparent 70%), linear-gradient(180deg, rgba(20, 83, 45, 0.75) 0%, rgba(5, 46, 22, 0.95) 100%)',
      desc: 'Đường liên tỉnh với cảnh quan thiên nhiên, cọc tiêu Leitpfosten, vạch phân làn và tốc độ 100 km/h.',
      btnText: 'VÀO LÁI ĐƯỜNG TỈNH (LAND)',
      btnGradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
    },
    {
      id: 'AUTOBAHN',
      label: 'Cao tốc',
      sublabel: 'Autobahn (autobahn.pbf)',
      icon: Navigation,
      color: '#f59e0b',
      defaultMap: 'autobahn_a9',
      badge: '130 km/h StVO',
      bgGradient: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.3), transparent 70%), linear-gradient(180deg, rgba(120, 53, 15, 0.75) 0%, rgba(69, 26, 3, 0.95) 100%)',
      desc: 'Đường cao tốc nhiều làn xe, trải nghiệm bám làn phải và nhập làn tăng tốc an toàn.',
      btnText: 'VÀO LÁI CAO TỐC (AUTOBAHN)',
      btnGradient: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)'
    },
    {
      id: 'TU_DO',
      label: 'Lái tự do',
      sublabel: 'Freies Fahren',
      icon: Sparkles,
      color: '#a855f7',
      defaultMap: 'sa_hinh_fahrschule',
      badge: 'Khám phá tự do',
      bgGradient: 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.3), transparent 70%), linear-gradient(180deg, rgba(88, 28, 135, 0.75) 0%, rgba(59, 7, 100, 0.95) 100%)',
      desc: 'Dạo chơi tự do trên 1 trong 4 bản đồ, không áp lực thi cử, thoải mái thử buồng lái và chỉnh góc ghế.',
      btnText: 'BẮT ĐẦU LÁI TỰ DO',
      btnGradient: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)'
    }
  ];

  const currentTabInfo = TABS.find(t => t.id === activeTab) || TABS[0];

  const handleCloseOnly = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_driving_guide', 'true');
    }
    onClose();
  };

  const handleConfirmStart = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_driving_guide', 'true');
    }
    const targetMap = activeTab === 'TU_DO' ? freeDriveMap : currentTabInfo.defaultMap;
    if (onStartDriving) {
      onStartDriving(activeTab, targetMap);
    } else {
      onClose();
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirmStart();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseOnly();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, freeDriveMap, dontShowAgain]);

  return (
    <div className="guide-modal-backdrop" style={{
      position: 'absolute', inset: 0,
      background: 'rgba(2, 6, 23, 0.88)',
      backdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2500, padding: 16, fontFamily: "'Inter', sans-serif"
    }}>
      <style>{`
        @media (max-width: 768px) {
          .guide-modal-card {
            max-height: 96vh !important;
            border-radius: 14px !important;
            padding: 14px !important;
          }
          .guide-modal-tabs {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        .key-cap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 2px 0 rgba(0,0,0,0.5);
          border-radius: 6px;
          padding: 2px 7px;
          font-weight: 800;
          font-size: 11px;
          color: #f8fafc;
          min-width: 22px;
          height: 22px;
        }
        .mode-card-tab:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
        }
      `}</style>

      <div className="guide-modal-card" style={{
        background: '#0f172a',
        border: `1.5px solid ${currentTabInfo.color}60`,
        borderRadius: 18,
        maxWidth: 680,
        width: '100%',
        color: '#f8fafc',
        boxShadow: `0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px ${currentTabInfo.color}18`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(2,132,199,0.15) 0%, rgba(15,23,42,0.95) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Car size={20} color="#38bdf8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  CHỌN KHU VỰC THỰC HÀNH LÁI XE
                </h2>
                <span style={{
                  fontSize: 10, fontWeight: '700', padding: '2px 7px', borderRadius: 6,
                  background: `${currentTabInfo.color}25`, border: `1px solid ${currentTabInfo.color}60`, color: currentTabInfo.color
                }}>
                  {currentTabInfo.badge}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Mô phỏng lái xe 3D chân thực theo quy chuẩn StVO Deutschland
              </div>
            </div>
          </div>
          <button
            onClick={handleCloseOnly}
            title="Đóng (Esc)"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: 8,
              color: '#94a3b8',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Selection with Realistic Photography Backgrounds */}
        <div style={{ padding: '14px 20px 8px 20px' }}>
          <div className="guide-modal-tabs" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10
          }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="mode-card-tab"
                  style={{
                    position: 'relative',
                    height: 86,
                    borderRadius: 12,
                    border: isActive ? `2px solid ${tab.color}` : '1px solid rgba(255, 255, 255, 0.12)',
                    background: isActive ? tab.bgGradient : 'rgba(15, 23, 42, 0.75)',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    boxShadow: isActive ? `0 0 20px ${tab.color}45, inset 0 0 20px rgba(0,0,0,0.6)` : 'none',
                    transition: 'all 0.18s ease',
                    textAlign: 'left',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    width: 26, height: 26, borderRadius: 7,
                    background: isActive ? `${tab.color}35` : 'rgba(15, 23, 42, 0.85)',
                    border: `1px solid ${isActive ? tab.color : 'rgba(255,255,255,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <TabIcon size={14} color={isActive ? tab.color : '#e2e8f0'} />
                  </div>

                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{
                      fontWeight: '800',
                      fontSize: 12,
                      color: isActive ? '#ffffff' : '#e2e8f0',
                      textShadow: '0 1px 3px rgba(0,0,0,0.9)'
                    }}>
                      {tab.label}
                    </div>
                    <div style={{
                      fontSize: 9.5,
                      color: isActive ? tab.color : '#94a3b8',
                      fontWeight: '600'
                    }}>
                      {tab.sublabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{
            fontSize: 11.5,
            color: '#cbd5e1',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: '9px 12px',
            marginTop: 10,
            lineHeight: 1.45,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Navigation size={15} color={currentTabInfo.color} style={{ flexShrink: 0 }} />
            <div>
              <b style={{ color: currentTabInfo.color }}>{currentTabInfo.label}:</b> {currentTabInfo.desc}
            </div>
          </div>

          {activeTab === 'TU_DO' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 8,
              padding: '8px 12px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: 8
            }}>
              <span style={{ fontSize: 11, fontWeight: '700', color: '#c084fc', whiteSpace: 'nowrap' }}>
                Chọn bản đồ tự do:
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'sa_hinh_fahrschule', label: '🚗 Sa hình' },
                  { id: 'stadt_zentrum', label: '🏙️ Nội đô (stadt.pbf)' },
                  { id: 'landstrasse_b2', label: '🌲 Đường tỉnh (land.pbf)' },
                  { id: 'autobahn_a9', label: '🏎️ Cao tốc (autobahn.pbf)' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setFreeDriveMap(m.id)}
                    style={{
                      background: freeDriveMap === m.id ? '#a855f7' : 'rgba(255,255,255,0.08)',
                      color: freeDriveMap === m.id ? '#ffffff' : '#cbd5e1',
                      border: freeDriveMap === m.id ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      padding: '3px 9px',
                      fontSize: 11,
                      fontWeight: freeDriveMap === m.id ? '700' : '500',
                      cursor: 'pointer'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Highlight Feature: In-Game Interactive Tutorial */}
        <div style={{ padding: '4px 20px 12px 20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Compass size={20} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: '800', color: '#34d399', letterSpacing: '-0.01em' }}>
                HƯỚNG DẪN TƯƠNG TÁC TỪNG BƯỚC TRONG BUỒNG LÁI
              </div>
              <div style={{ fontSize: 11.5, color: '#e2e8f0', marginTop: 3, lineHeight: 1.45 }}>
                Không cần phải ghi nhớ phím tắt trước. Ngay khi vào xe, hệ thống sẽ đồng hành chỉ dẫn bạn từng thao tác: <b>Thắt dây an toàn ➔ Vào số D ➔ Đạp ga lăn bánh</b> kèm phản hồi nhấp nháy trực tiếp trên táp-lô.
              </div>
            </div>
          </div>

          {/* Quick Key Glance (Visual Chips with SVG icons) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 10,
            padding: '10px 14px',
            marginTop: 10,
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: 11.5
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} color="#38bdf8" />
              <span className="key-cap">W</span><span className="key-cap">S</span>
              <span style={{ color: '#94a3b8' }}>Ga / Phanh</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Navigation size={14} color="#38bdf8" />
              <span className="key-cap">A</span><span className="key-cap">D</span>
              <span style={{ color: '#94a3b8' }}>Bẻ lái</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Gauge size={14} color="#f59e0b" />
              <span className="key-cap" style={{ color: '#38bdf8' }}>D</span><span className="key-cap" style={{ color: '#f87171' }}>R</span><span className="key-cap" style={{ color: '#f59e0b' }}>P</span>
              <span style={{ color: '#94a3b8' }}>Cần số</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#10b981" />
              <span className="key-cap" style={{ color: '#10b981' }}>B</span>
              <span style={{ color: '#94a3b8' }}>Dây an toàn</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15,23,42,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#94a3b8', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Không tự động hiện bảng này (vào thẳng xe)
          </label>

          <button
            onClick={handleConfirmStart}
            style={{
              background: currentTabInfo.btnGradient,
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: 10,
              fontWeight: '800',
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: `0 4px 18px ${currentTabInfo.color}45`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease'
            }}
          >
            <Play size={14} fill="currentColor" />
            <span>{isDriving ? `BẮT ĐẦU LÁI (${currentTabInfo.label.toUpperCase()})` : currentTabInfo.btnText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
