import { Car } from 'lucide-react';

// tách từ DrivingSimulation.jsx (refactor phase A3)


export const StartMenu = ({ finished, handleStartFreeDrive, isDriving, loadingState, selectedPresetMap, setSelectedPresetMap, showGuideModal, speed }) => (
!loadingState.isLoading && !showGuideModal && !isDriving && !finished && (
  <div className="sim-menu-overlay" style={{
    position: 'absolute', inset: 0,
    background: 'rgba(7, 11, 20, 0.88)',
    backdropFilter: 'blur(16px)',
    zIndex: 100, display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '16px',
    fontFamily: "'Inter', system-ui, sans-serif"
  }}>
    <div className="sim-menu-card" style={{
      background: 'linear-gradient(180deg, #111827 0%, #0b0f19 100%)',
      border: '1.5px solid rgba(56, 189, 248, 0.35)',
      borderRadius: 16, padding: '24px 28px',
      maxWidth: 680, width: '100%', color: '#f8fafc',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
      display: 'flex', flexDirection: 'column', gap: 16
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 14 }}>
        <div>
          <div style={{
            color: '#38bdf8', fontSize: 11, fontWeight: '700',
            letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span>🇩🇪</span> FAHRSCHULE SIMULATOR · STVO DEUTSCHLAND
          </div>
          <h1 style={{ fontWeight: '800', fontSize: 19, color: '#f8fafc', margin: '4px 0 0 0' }}>
            Chọn Bản Đồ Thực Hành Lái Xe 3D StVO
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 12, color: '#94a3b8' }}>
            Lựa chọn 1 trong 3 bản đồ PBF Đức: Nội đô, Đường tỉnh hoặc Cao tốc để nạp dữ liệu siêu tốc (&lt; 200ms)
          </p>
        </div>

        <div
          style={{
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            color: '#4ade80',
            padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: '700',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5
          }}
        >
          ⚡ Hiệu năng: 60 FPS Mượt
        </div>
      </div>

      {/* 3 Options: Stadt, Land, Autobahn */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          {
            id: 'stadt_zentrum',
            pbf: 'stadt.pbf',
            name: '🏙️ Nội Đô (Stadt)',
            subname: 'Stadtfahrt Berlin-Mitte',
            speed: '50 km/h',
            image: '/images-sample/stadt1.jpg',
            desc: 'Đèn tín hiệu ngã 4, vạch người đi bộ & Rechts vor Links',
            color: '#38bdf8'
          },
          {
            id: 'landstrasse_b2',
            pbf: 'land.pbf',
            name: '🌲 Đường Tỉnh (Land)',
            subname: 'Landstraße B2',
            speed: '100 km/h',
            image: '/images-sample/land1.jpg',
            desc: 'Đường liên tỉnh 2 làn xe, cọc tiêu Leitpfosten & cảnh quan',
            color: '#22c55e'
          },
          {
            id: 'autobahn_a9',
            pbf: 'autobahn.pbf',
            name: '🏎️ Cao Tốc (Autobahn)',
            subname: 'Autobahn Fernstraße A2 Hamm/Rhynern',
            speed: '130 km/h',
            image: '/images-sample/autobahn1.jpg',
            desc: 'Đường cao tốc 4 làn, dải phân cách thép & nhập làn an toàn',
            color: '#f59e0b'
          },
          {
            id: 'training_circuit',
            pbf: 'training.glb',
            name: '🏫 Fahrschule Circuit',
            subname: 'Lộ trình tập lái: Phố → A2 → Phố',
            speed: '50→130 km/h',
            image: '/images-sample/autobahn1.jpg',
            desc: 'Vòng tập lái compact: phố → nhập cao tốc → chạy A2 → thoát về phố',
            color: '#22d3ee'
          }
        ].map((c) => {
          const isSelected = selectedPresetMap === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setSelectedPresetMap(c.id)}
              onDoubleClick={() => {
                setSelectedPresetMap(c.id);
                handleStartFreeDrive(c.id);
              }}
              title={`Chọn bản đồ: ${c.name} (${c.pbf})`}
              style={{
                background: isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.65)',
                border: isSelected ? `2px solid ${c.color}` : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 14,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? `0 0 25px ${c.color}40, 0 8px 24px rgba(0,0,0,0.5)` : '0 4px 14px rgba(0,0,0,0.35)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = `${c.color}80`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {/* Photo container */}
              <div style={{ position: 'relative', width: '100%', height: 90, overflow: 'hidden' }}>
                <img
                  src={c.image}
                  alt={c.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    filter: isSelected ? 'brightness(1.05)' : 'brightness(0.85)'
                  }}
                  loading="eager"
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15,23,42,0.9) 100%)'
                }} />

                {/* Speed limit badge */}
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(6px)',
                  border: `1px solid ${c.color}80`,
                  color: '#ffffff',
                  padding: '2px 7px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
                  {c.speed}
                </span>

                {/* PBF file badge */}
                <span style={{
                  position: 'absolute', top: 6, left: 6,
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(4px)',
                  color: c.color,
                  border: `1px solid ${c.color}40`,
                  padding: '1px 6px',
                  borderRadius: 5,
                  fontSize: 9.5,
                  fontWeight: '800',
                  letterSpacing: '0.04em'
                }}>
                  {c.pbf}
                </span>

                {isSelected && (
                  <div style={{
                    position: 'absolute', bottom: 6, right: 6,
                    background: c.color, color: '#0f172a',
                    borderRadius: '50%', width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '900', fontSize: 12, boxShadow: `0 0 10px ${c.color}`
                  }}>
                    ✓
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{
                  fontSize: 13, fontWeight: '800', color: isSelected ? '#ffffff' : '#e2e8f0'
                }}>
                  {c.name}
                </div>
                <div style={{
                  fontSize: 10.5, color: isSelected ? c.color : '#94a3b8', fontWeight: '600'
                }}>
                  {c.subname}
                </div>
                <div style={{
                  fontSize: 10, color: '#94a3b8', lineHeight: 1.35, marginTop: 2
                }}>
                  {c.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nút Bắt đầu hành trình lớn với map được chọn */}
      <button
        onClick={() => {
          handleStartFreeDrive(selectedPresetMap);
        }}
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
          border: 'none',
          borderRadius: 12,
          padding: '14px 24px',
          color: '#ffffff',
          fontSize: 15,
          fontWeight: '800',
          letterSpacing: '0.03em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <Car size={20} />
        BẮT ĐẦU HÀNH TRÌNH ({selectedPresetMap === 'stadt_zentrum' ? 'NỘI ĐÔ STADT' : selectedPresetMap === 'landstrasse_b2' ? 'ĐƯỜNG TỈNH LAND' : 'CAO TỐC AUTOBAHN'}) ➔
      </button>

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
        <div><span style={{ color: '#f8fafc', fontWeight: '700' }}>Z / X</span> Liếc vai (Schulterblick)</div>
        <div><span style={{ color: '#f8fafc', fontWeight: '700' }}>V</span> Đổi camera</div>
        <div><span style={{ color: '#f8fafc', fontWeight: '700' }}>M</span> Gương hậu</div>
      </div>
    </div>
  </div>
)
);
