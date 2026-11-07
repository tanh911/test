import { Car, Lock, Star } from 'lucide-react';

// 🎓 MENU LỘ TRÌNH FAHRSCHUEN — 4 cấp theo giáo trình lái xe Đức (phase: business menu)
// Cấp 1-2 miễn phí, cấp 3-4 thuộc gói Pro (chỗ để gắn gói kinh doanh sau này).
// Map locked vẫn chọn được qua "Dùng thử beta" để test trong giai đoạn phát triển.

const TIERS = [
  {
    level: 1,
    name: 'SÂN TẬP',
    nameDe: 'Übungsplatz',
    locked: false,
    maps: [
      {
        id: 'training_circuit',
        pbf: 'training.glb',
        name: 'Fahrschule Circuit',
        desc: 'Vòng tập lái compact: phố → nhập cao tốc → A2 → thoát về phố',
        speed: '50→130 km/h',
        image: '/images-sample/autobahn1.jpg',
        icon: '🏫',
        color: '#22d3ee'
      },
      {
        id: 'sa_hinh_fahrschule',
        pbf: 'sa-hinh.glb',
        name: 'Sa Hình Đỗ Xe & Thủ Thuật',
        desc: 'Slalom · Đỗ song song · Đỗ ngang · Đề-pa (Anfahren am Berg)',
        speed: '≤30 km/h',
        image: '/images-sample/stadt1.jpg',
        icon: '🅿️',
        color: '#a78bfa'
      }
    ]
  },
  {
    level: 2,
    name: 'NỘI ĐÔ',
    nameDe: 'Innerorts',
    locked: false,
    maps: [
      {
        id: 'stadt_zentrum',
        pbf: 'stadt.pbf',
        name: 'Berlin-Mitte',
        desc: 'Đèn tín hiệu · vạch người đi bộ · Rechts vor Links · zone 30/50',
        speed: '50 km/h',
        image: '/images-sample/stadt1.jpg',
        icon: '🏙️',
        color: '#38bdf8'
      }
    ]
  },
  {
    level: 3,
    name: 'ĐƯỜNG TỈNH',
    nameDe: 'Landstraße',
    locked: true,
    maps: [
      {
        id: 'landstrasse_b2',
        pbf: 'land.pbf',
        name: 'Landstraße B2',
        desc: 'Vượt xe · cọc tiêu Leitpfosten ·đường quanh co 100 km/h',
        speed: '100 km/h',
        image: '/images-sample/land1.jpg',
        icon: '🌲',
        color: '#22c55e',
        extra: '🌙 Kèm chế độ Nachtfahrt (đêm bắt buộc 1/12 buổi)'
      }
    ]
  },
  {
    level: 4,
    name: 'CAO TỐC',
    nameDe: 'Autobahn',
    locked: true,
    maps: [
      {
        id: 'autobahn_a9',
        pbf: 'autobahn.pbf',
        name: 'A2 Hamm/Rhynern',
        desc: '4 làn · nhập/thoát làn · Rettungsgasse · Richtgeschwindigkeit',
        speed: '130 km/h',
        image: '/images-sample/autobahn1.jpg',
        icon: '🏎️',
        color: '#f59e0b',
        extra: '🎓 Mô phỏng bài thi thực hành — chấm điểm như giám khảo thật'
      }
    ]
  }
];

const ALL_MAPS = TIERS.flatMap(t => t.maps.map(m => ({ ...m, tier: t })));
const MAP_LABEL = (id) => {
  const m = ALL_MAPS.find(x => x.id === id);
  return m ? m.name.toUpperCase() : id.toUpperCase();
};

export const StartMenu = ({ finished, handleStartFreeDrive, isDriving, loadingState, selectedPresetMap, setSelectedPresetMap, showGuideModal, speed }) => {
  if (loadingState.isLoading || showGuideModal || isDriving || finished) return null;

  const sel = ALL_MAPS.find(m => m.id === selectedPresetMap) || ALL_MAPS[0];
  const selLocked = sel?.tier?.locked;
  const unlockedCount = TIERS.filter(t => !t.locked).length;

  return (
    <div className="sim-menu-overlay" style={{
      position: 'absolute', inset: 0,
      background: 'rgba(7, 11, 20, 0.9)',
      backdropFilter: 'blur(16px)',
      zIndex: 100, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '14px',
      fontFamily: "'Inter', system-ui, sans-serif",
      overflowY: 'auto'
    }}>
      <div className="sim-menu-card" style={{
        background: 'linear-gradient(180deg, #111827 0%, #0b0f19 100%)',
        border: '1.5px solid rgba(56, 189, 248, 0.35)',
        borderRadius: 16, padding: '20px 22px',
        maxWidth: 640, width: '100%', color: '#f8fafc',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
        display: 'flex', flexDirection: 'column', gap: 12,
        maxHeight: '96vh', overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 12 }}>
          <div>
            <div style={{
              color: '#38bdf8', fontSize: 11, fontWeight: '700',
              letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span>🇩🇪</span> FAHRSCHULE SIMULATOR · LỘ TRÌNH FAHRPLAN
            </div>
            <h1 style={{ fontWeight: '800', fontSize: 18, color: '#f8fafc', margin: '4px 0 0 0' }}>
              Học Lái Xe Theo Giáo Trình Đức — 4 Cấp
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 11.5, color: '#94a3b8' }}>
              Từ sân tập đến Autobahn — đúng thứ tự giáo trình Fahrschule
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <div style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#4ade80',
              padding: '5px 9px', borderRadius: 8, fontSize: 10.5, fontWeight: '700',
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5
            }}>
              ⚡ 60 FPS Mượt
            </div>
            <div style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#7dd3fc',
              padding: '5px 9px', borderRadius: 8, fontSize: 10.5, fontWeight: '700',
              whiteSpace: 'nowrap'
            }}>
              🔓 Đã mở: {unlockedCount}/4 cấp
            </div>
          </div>
        </div>

        {/* 4 Cấp lộ trình */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIERS.map((tier) => {
            const isTierSel = tier.maps.some(m => m.id === selectedPresetMap);
            return (
              <div key={tier.level} style={{
                border: isTierSel ? `1.5px solid ${tier.locked ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.45)'}` : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                background: isTierSel ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.5)',
                padding: '8px 10px',
                opacity: tier.locked ? 0.92 : 1
              }}>
                {/* Tier header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: tier.maps.length > 1 ? 8 : 6 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 7,
                    background: tier.locked ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    border: `1.5px solid ${tier.locked ? 'rgba(245, 158, 11, 0.5)' : 'rgba(56, 189, 248, 0.5)'}`,
                    color: tier.locked ? '#fbbf24' : '#7dd3fc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: '900', flexShrink: 0
                  }}>
                    {tier.level}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: '800', color: '#f1f5f9', flex: 1 }}>
                    {tier.name} <span style={{ color: '#64748b', fontWeight: '600', fontSize: 10.5 }}>({tier.nameDe})</span>
                  </div>
                  {tier.locked ? (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.08))',
                      border: '1px solid rgba(245, 158, 11, 0.55)',
                      color: '#fbbf24', padding: '2.5px 9px', borderRadius: 7,
                      fontSize: 10, fontWeight: '800', letterSpacing: '0.04em'
                    }}>
                      <Lock size={10} /> PRO
                    </span>
                  ) : (
                    <span style={{
                      color: '#4ade80', fontSize: 10, fontWeight: '800',
                      border: '1px solid rgba(74, 222, 128, 0.35)',
                      background: 'rgba(74, 222, 128, 0.08)',
                      padding: '2.5px 9px', borderRadius: 7
                    }}>
                      MIỄN PHÍ
                    </span>
                  )}
                </div>

                {/* Map cards trong tier — hàng ngang compact */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tier.maps.length}, 1fr)`, gap: 8 }}>
                  {tier.maps.map((c) => {
                    const isSelected = selectedPresetMap === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedPresetMap(c.id)}
                        onDoubleClick={() => {
                          setSelectedPresetMap(c.id);
                          handleStartFreeDrive(c.id);
                        }}
                        title={`Chọn: ${c.name} (${c.pbf})${tier.locked ? ' — Gói Pro' : ''}`}
                        style={{
                          background: isSelected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.65)',
                          border: isSelected ? `2px solid ${c.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 11,
                          overflow: 'hidden',
                          display: 'flex',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? `0 0 18px ${c.color}35` : 'none',
                          position: 'relative',
                          minHeight: 64
                        }}
                      >
                        {/* Thumbnail */}
                        <div style={{ position: 'relative', width: 74, flexShrink: 0, overflow: 'hidden' }}>
                          <img src={c.image} alt={c.name} loading="eager" style={{
                            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                            filter: isSelected ? 'brightness(1.0)' : 'brightness(0.72) saturate(0.9)'
                          }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(15,23,42,0.05) 40%, rgba(15,23,42,0.75) 100%)' }} />
                          <span style={{
                            position: 'absolute', top: 4, left: 4,
                            fontSize: 15,
                            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))'
                          }}>{c.icon}</span>
                          {isSelected && (
                            <div style={{
                              position: 'absolute', bottom: 4, right: 4,
                              background: c.color, color: '#0f172a',
                              borderRadius: '50%', width: 18, height: 18,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: '900', fontSize: 10
                            }}>✓</div>
                          )}
                        </div>

                        {/* Text */}
                        <div style={{ padding: '7px 10px 7px 10px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1, justifyContent: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12.5, fontWeight: '800', color: isSelected ? '#ffffff' : '#e2e8f0' }}>{c.name}</span>
                            <span style={{
                              fontSize: 9, fontWeight: '800', color: c.color,
                              border: `1px solid ${c.color}55`, borderRadius: 5, padding: '0.5px 5px'
                            }}>{c.speed}</span>
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.35 }}>
                            {c.desc}
                          </div>
                          {c.extra && (
                            <div style={{ fontSize: 9.5, color: '#fbbf24', fontWeight: '700' }}>{c.extra}</div>
                          )}
                          {tier.locked && isSelected && (
                            <div style={{ fontSize: 9.5, color: '#fbbf24', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Lock size={9} /> Thuộc gói Pro — dùng thử beta bên dưới
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Nút bắt đầu */}
        <button
          onClick={() => handleStartFreeDrive(selectedPresetMap)}
          style={{
            background: selLocked
              ? 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)'
              : 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
            border: 'none',
            borderRadius: 12,
            padding: '13px 22px',
            color: '#ffffff',
            fontSize: 14.5,
            fontWeight: '800',
            letterSpacing: '0.03em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: selLocked ? '0 8px 24px rgba(217, 119, 6, 0.4)' : '0 8px 24px rgba(37, 99, 235, 0.45)'
          }}
        >
          {selLocked ? <Star size={18} /> : <Car size={20} />}
          {selLocked ? `🧪 DÙNG THỬ BETA — ${MAP_LABEL(selectedPresetMap)} (Gói Pro sắp mở bán) ➔` : `BẮT ĐẦU HÀNH TRÌNH (${MAP_LABEL(selectedPresetMap)}) ➔`}
        </button>

        {selLocked && (
          <div style={{
            fontSize: 10.5, color: '#94a3b8', textAlign: 'center', marginTop: -4
          }}>
            🔒 Bản beta đang mở miễn phí thời gian giới hạn — theo dõi Fanpage để nhận thông báo gói Pro
          </div>
        )}

        {/* Bảng phím tắt điều khiển StVO */}
        <div className="sim-shortcuts-footer" style={{
          background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 8, padding: '8px 12px',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
          color: '#94a3b8', fontSize: 11
        }}>
          <div><span style={{ color: '#f8fafc', fontWeight: '700' }}>W / S</span> Ga / Phanh</div>
          <div><span style={{ color: '#f8fafc', fontWeight: '700' }}>A / D</span> Lái</div>
          <div><span style={{ color: '#f8fafc', fontWeight: '700' }}>Space</span> Phanh tay</div>
          <div><span style={{ color: '#38bdf8', fontWeight: '700' }}>B</span> Thắt dây an toàn</div>
          <div><span style={{ color: '#f8fafc', fontWeight: '700' }}>P / R / N / D</span> Cần số</div>
          <div><span style={{ color: '#f8fafc', fontWeight: '700' }}>Q / E</span> Xi-nhan</div>
          <div><span style={{ color: '#f8fafc', fontWeight: '700' }}>Z / X</span> Liếc vai</div>
          <div><span style={{ color: '#f8fafc', fontWeight: '700' }}>V</span> Đổi camera</div>
          <div><span style={{ color: '#f8fafc', fontWeight: '700' }}>M</span> Gương hậu</div>
        </div>
      </div>
    </div>
  );
};
