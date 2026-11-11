import React, { useMemo } from 'react';

export interface ModernCockpitProps {
  speedKmh?: number;
  rpm?: number;
  gear?: 'P' | 'R' | 'N' | 'D';
  speedLimit?: number;
  signal?: 'left' | 'right' | null;
  steerAngle?: number; // radians (-0.55 to +0.55)
  camMode?: string;
  headYaw?: number; // góc quay đầu liếc nhìn (-1.45 tới +1.45 rad)
  headPitch?: number; // góc ngẩng/cúi đầu (-0.4 tới +0.4 rad)
  onSelectGear?: (g: 'P' | 'R' | 'N' | 'D') => void;
  onToggleCam?: () => void;
  onToggleMirror?: () => void;
}

/**
 * 🚗 MODERN COCKPIT OVERLAY (Buồng Lái Thể Thao Cao Cấp)
 * - Táp-lô và vô-lăng gắn cố định trên xe. Khi người lái kéo chuột (hoặc phím liếc nhìn),
 *   buồng lái di chuyển đồng bộ với góc quay đầu (headYaw, headPitch), mở ra tầm nhìn
 *   ra cửa sổ hai bên và kính hậu.
 * - 3 GƯƠNG CHIẾU HẬU THẬT:
 *   1. Gương chiếu hậu trái (Left Wing Mirror) gắn trên cột A / cửa lái
 *   2. Gương chiếu hậu phải (Right Wing Mirror) gắn trên cột A / cửa phụ
 *   3. Gương chiếu hậu trung tâm (Center Rearview Mirror) treo trần kính lái
 * - Vô-lăng thể thao xoay mượt mà theo góc lái A/D
 * - Cụm đồng hồ Virtual Cockpit độ nét cao (RPM, Tốc độ StVO Đức 30/50, Cần số P-R-N-D)
 */
export const ModernCockpit: React.FC<ModernCockpitProps> = ({
  speedKmh = 0,
  rpm = 850,
  gear = 'D',
  speedLimit = 50,
  signal = null,
  steerAngle = 0,
  camMode = 'cabin',
  headYaw = 0,
  headPitch = 0,
  onSelectGear,
  onToggleCam,
  onToggleMirror
}) => {
  // Góc quay vô-lăng (độ)
  const steerDeg = useMemo(() => {
    const rawDeg = (steerAngle * 180) / Math.PI;
    return Math.max(-85, Math.min(85, rawDeg * 2.4));
  }, [steerAngle]);

  // Góc kim tốc độ
  const speedNeedleDeg = useMemo(() => {
    const frac = Math.max(0, Math.min(1, speedKmh / 260));
    return -135 + frac * 270;
  }, [speedKmh]);

  // Góc kim tua máy
  const rpmNeedleDeg = useMemo(() => {
    const frac = Math.max(0, Math.min(1, rpm / 8000));
    return -135 + frac * 270;
  }, [rpm]);

  const isOverSpeed = speedKmh > speedLimit + 3;

  // Độ dịch chuyển của buồng lái khi người lái quay đầu (pan theo pixel)
  const panX = headYaw * 320;
  const panY = headPitch * 220;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: 25
      }}
    >
      {/* ── CẢ BUỒNG LÁI XOAY THEO ĐẦU NGƯỜI LÁI (HEAD TRACKING) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${panX}px, ${panY}px)`,
          transition: 'transform 0.03s linear',
          pointerEvents: 'none'
        }}
      >
        {/* ── 1. KHUNG KÍNH LÁI & CỘT CHỮ A (WINDSHIELD & A-PILLARS) ── */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
          viewBox="0 0 1920 1080"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="leftPillarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0b0d11" />
              <stop offset="65%" stopColor="#181c23" />
              <stop offset="92%" stopColor="#252b36" />
              <stop offset="100%" stopColor="#0f1217" />
            </linearGradient>

            <linearGradient id="rightPillarGrad" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0b0d11" />
              <stop offset="65%" stopColor="#181c23" />
              <stop offset="92%" stopColor="#252b36" />
              <stop offset="100%" stopColor="#0f1217" />
            </linearGradient>

            <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#090a0d" />
              <stop offset="70%" stopColor="#15181f" />
              <stop offset="100%" stopColor="rgba(21, 24, 31, 0)" />
            </linearGradient>

            <filter id="pillarShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="8" dy="4" stdDeviation="10" floodColor="#000000" floodOpacity="0.85" />
            </filter>
          </defs>

          {/* Dải chắn nắng trần kính lái (Sunstrip) */}
          <rect x="0" y="0" width="1920" height="70" fill="url(#roofGrad)" opacity="0.95" />
          <rect x="0" y="0" width="1920" height="28" fill="#090b0e" />

          {/* Cột chữ A trái (Left A-Pillar) */}
          <path
            d="M 0,0 L 70,0 L 165,1080 L 0,1080 Z"
            fill="url(#leftPillarGrad)"
            filter="url(#pillarShadow)"
          />
          <path d="M 50,0 L 140,1080" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />

          {/* Cột chữ A phải (Right A-Pillar) */}
          <path
            d="M 1920,0 L 1850,0 L 1755,1080 L 1920,1080 Z"
            fill="url(#rightPillarGrad)"
            filter="url(#pillarShadow)"
          />
          <path d="M 1870,0 L 1780,1080" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />
        </svg>

        {/* ── 2. GƯƠNG CHIẾU HẬU TRUNG TÂM (CENTER REARVIEW MIRROR) ── */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'auto',
            cursor: 'pointer'
          }}
          onClick={onToggleMirror}
          title="Gương chiếu hậu trung tâm [M]"
        >
          <div
            style={{
              width: 14,
              height: 12,
              background: 'linear-gradient(180deg, #111418, #222731)',
              borderRadius: '2px 2px 0 0',
              border: '1px solid #333a46'
            }}
          />

          <div
            style={{
              width: 250,
              height: 58,
              background: 'transparent',
              border: '2.5px solid #3b4252',
              borderRadius: 14,
              padding: 4,
              boxShadow: '0 8px 24px rgba(0,0,0,0.85), inset 0 1px 2px rgba(255,255,255,0.2)',
              display: 'flex',
              position: 'relative'
            }}
          >
            {/* Kính gương trong suốt — để lộ khung hình render Three.js của rearCam bên dưới */}
            <div
              style={{
                flex: 1,
                borderRadius: 9,
                background: 'transparent',
                border: '1.5px solid rgba(56,189,248,0.4)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5)'
              }}
            >
              {/* Vạch căn khoảng cách an toàn StVO */}
              <div style={{ position: 'absolute', left: 45, right: 45, bottom: 5, height: 2, background: 'rgba(239,68,68,0.85)' }} />
              <div style={{ position: 'absolute', left: 65, right: 65, bottom: 15, height: 1.5, background: 'rgba(234,179,8,0.75)' }} />
              <div style={{ position: 'absolute', left: 82, right: 82, bottom: 25, height: 1.5, background: 'rgba(74,222,128,0.7)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 2, marginTop: -20 }}>
                <span style={{ fontSize: 9, color: '#f8fafc', letterSpacing: 1.5, fontWeight: 900, textShadow: '0 1px 4px #000' }}>
                  REARVIEW [M]
                </span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: '#0284c7',
                    color: '#ffffff'
                  }}
                >
                  LIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. GƯƠNG CHIẾU HẬU TRÁI (LEFT WING MIRROR) ── */}
        <div
          style={{
            position: 'absolute',
            left: 20,
            bottom: '40%',
            width: 162,
            height: 105,
            pointerEvents: 'auto',
            zIndex: 20
          }}
          title="Gương chiếu hậu trái (Left Mirror)"
        >
          {/* Cần gắn gương vào cửa xe */}
          <div
            style={{
              position: 'absolute',
              left: -12,
              top: 35,
              width: 18,
              height: 28,
              background: '#0a0d12',
              border: '1.5px solid #2d3440',
              borderRadius: '0 4px 4px 0',
              zIndex: 1
            }}
          />

          {/* Vỏ ốp khí động học ngoài gương (Aerodynamic Mirror Housing) */}
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: '2.5px solid #333c4d',
              borderRadius: '24px 10px 18px 24px',
              padding: 5,
              boxShadow: '0 12px 28px rgba(0,0,0,0.9), inset 0 1px 3px rgba(255,255,255,0.15)',
              display: 'flex',
              position: 'relative'
            }}
          >
            {/* Mặt kính gương (Transparent cutout để Three.js render phía sau) */}
            <div
              style={{
                flex: 1,
                borderRadius: '18px 6px 14px 18px',
                background: 'transparent',
                border: '1.5px solid rgba(148,163,184,0.4)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 14px rgba(0,0,0,0.6)'
              }}
            >
              {/* Vạch chia góc lồi chống điểm mù (Aspherical Blind Spot Divider) */}
              <div
                style={{
                  position: 'absolute',
                  left: 36,
                  top: 0,
                  bottom: 0,
                  width: 1.5,
                  background: 'rgba(255,255,255,0.25)',
                  borderRight: '1px dashed rgba(255,255,255,0.4)'
                }}
              />
              {/* Nhãn gương */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 4,
                  left: 6,
                  fontSize: 8,
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.7)',
                  textShadow: '0 1px 3px #000'
                }}
              >
                LEFT MIRROR
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. GƯƠNG CHIẾU HẬU PHẢI (RIGHT WING MIRROR) ── */}
        <div
          style={{
            position: 'absolute',
            right: 20,
            bottom: '40%',
            width: 162,
            height: 105,
            pointerEvents: 'auto',
            zIndex: 20
          }}
          title="Gương chiếu hậu phải (Right Mirror)"
        >
          {/* Cần gắn gương vào cửa xe bên phụ */}
          <div
            style={{
              position: 'absolute',
              right: -12,
              top: 35,
              width: 18,
              height: 28,
              background: '#0a0d12',
              border: '1.5px solid #2d3440',
              borderRadius: '4px 0 0 4px',
              zIndex: 1
            }}
          />

          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: '2.5px solid #333c4d',
              borderRadius: '10px 24px 24px 18px',
              padding: 5,
              boxShadow: '0 12px 28px rgba(0,0,0,0.9), inset 0 1px 3px rgba(255,255,255,0.15)',
              display: 'flex',
              position: 'relative'
            }}
          >
            <div
              style={{
                flex: 1,
                borderRadius: '6px 18px 18px 14px',
                background: 'transparent',
                border: '1.5px solid rgba(148,163,184,0.4)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 14px rgba(0,0,0,0.6)'
              }}
            >
              {/* Vạch chia góc lồi bên phải */}
              <div
                style={{
                  position: 'absolute',
                  right: 36,
                  top: 0,
                  bottom: 0,
                  width: 1.5,
                  background: 'rgba(255,255,255,0.25)',
                  borderLeft: '1px dashed rgba(255,255,255,0.4)'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 6,
                  fontSize: 8,
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.7)',
                  textShadow: '0 1px 3px #000'
                }}
              >
                RIGHT MIRROR
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. THÂN TÁP-LÔ DƯỚI (LOWER DASHBOARD BINNACLE) ── */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '38%',
            minHeight: 270,
            pointerEvents: 'none'
          }}
        >
          <svg
            style={{ width: '100%', height: '100%', position: 'absolute', bottom: 0, left: 0 }}
            viewBox="0 0 1920 400"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="dashBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#222833" />
                <stop offset="14%" stopColor="#171a22" />
                <stop offset="42%" stopColor="#101319" />
                <stop offset="100%" stopColor="#07080b" />
              </linearGradient>

              <linearGradient id="ambientCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="15%" stopColor="#0284c7" />
                <stop offset="44%" stopColor="#38bdf8" />
                <stop offset="72%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>

              <filter id="dashShadow" x="-5%" y="-20%" width="110%" height="140%">
                <feDropShadow dx="0" dy="-8" stdDeviation="14" floodColor="#000000" floodOpacity="0.85" />
              </filter>
            </defs>

            {/* Vòm táp-lô căn chuẩn tầm nhìn lái xe: Đỉnh vòm quanh X = 845 (44% màn hình) */}
            <path
              d="
                M 0,400 
                L 0,140 
                C 140,135 280,110 420,72 
                C 560,40 1120,40 1260,76 
                C 1400,108 1550,132 1720,148 
                C 1820,156 1880,162 1920,165 
                L 1920,400 
                Z
              "
              fill="url(#dashBodyGrad)"
              filter="url(#dashShadow)"
            />

            {/* Dải LED Ambient Cyan */}
            <path
              d="
                M 0,140 
                C 140,135 280,110 420,72 
                C 560,40 1120,40 1260,76 
                C 1400,108 1550,132 1720,148 
                C 1820,156 1880,162 1920,165
              "
              stroke="url(#ambientCyan)"
              strokeWidth="3.5"
              fill="none"
              opacity="0.9"
            />

            {/* Chỉ thêu da kép sang trọng */}
            <path
              d="
                M 0,148 
                C 140,143 280,118 420,80 
                C 560,48 1120,48 1260,84 
                C 1400,116 1550,140 1720,156 
                C 1820,164 1880,170 1920,173
              "
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="5,4"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Cửa gió điều hòa bên trái */}
            <g transform="translate(130, 160)">
              <rect x="0" y="0" width="70" height="38" rx="6" fill="#0d0f13" stroke="#2e3542" strokeWidth="2" />
              <line x1="8" y1="10" x2="62" y2="10" stroke="#475569" strokeWidth="2.5" />
              <line x1="8" y1="19" x2="62" y2="19" stroke="#475569" strokeWidth="2.5" />
              <line x1="8" y1="28" x2="62" y2="28" stroke="#475569" strokeWidth="2.5" />
              <circle cx="35" cy="19" r="4" fill="#94a3b8" />
            </g>

            {/* Cửa gió điều hòa bên phải */}
            <g transform="translate(1420, 165)">
              <rect x="0" y="0" width="90" height="38" rx="6" fill="#0d0f13" stroke="#2e3542" strokeWidth="2" />
              <line x1="10" y1="10" x2="80" y2="10" stroke="#475569" strokeWidth="2.5" />
              <line x1="10" y1="19" x2="80" y2="19" stroke="#475569" strokeWidth="2.5" />
              <line x1="10" y1="28" x2="80" y2="28" stroke="#475569" strokeWidth="2.5" />
              <circle cx="45" cy="19" r="4" fill="#94a3b8" />
            </g>
          </svg>

          {/* ── 6. BẢNG ĐỒNG HỒ VIRTUAL COCKPIT (INSTRUMENT CLUSTER) ── */}
          <div
            style={{
              position: 'absolute',
              left: '44%',
              bottom: '26%',
              transform: 'translateX(-50%)',
              width: 610,
              height: 195,
              background: 'linear-gradient(180deg, #0e1117 0%, #050608 100%)',
              border: '2px solid #232936',
              borderRadius: 22,
              boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.95), 0 10px 32px rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 18px',
              pointerEvents: 'auto',
              zIndex: 10
            }}
          >
            {/* Vòng tua RPM Analog */}
            <div style={{ width: 175, height: 175, position: 'relative' }}>
              <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%' }}>
                <circle cx="80" cy="80" r="74" fill="#0c0e14" stroke="#1f2533" strokeWidth="3" />
                <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                <path
                  d="M 125,125 A 64 64 0 0 0 144,80"
                  stroke="#ef4444"
                  strokeWidth="6"
                  fill="none"
                  opacity="0.9"
                />

                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((tick) => {
                  const angle = -135 + (tick / 8) * 270;
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 80 + Math.cos(rad) * 66;
                  const y1 = 80 + Math.sin(rad) * 66;
                  const x2 = 80 + Math.cos(rad) * 54;
                  const y2 = 80 + Math.sin(rad) * 54;
                  const tx = 80 + Math.cos(rad) * 44;
                  const ty = 80 + Math.sin(rad) * 44;
                  const isRed = tick >= 7;

                  return (
                    <g key={tick}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isRed ? '#ef4444' : '#f1f5f9'}
                        strokeWidth={tick % 2 === 0 ? '2.5' : '1.5'}
                      />
                      <text
                        x={tx}
                        y={ty + 4}
                        fill={isRed ? '#f87171' : '#e2e8f0'}
                        fontSize="11"
                        fontWeight="800"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

                <text x="80" y="105" fill="#64748b" fontSize="9" fontWeight="700" textAnchor="middle">
                  1/min x1000
                </text>
                <text x="80" y="118" fill="#38bdf8" fontSize="11" fontWeight="900" textAnchor="middle">
                  RPM
                </text>

                <g transform={`rotate(${rpmNeedleDeg} 80 80)`}>
                  <line x1="80" y1="80" x2="80" y2="22" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
                  <line x1="80" y1="80" x2="80" y2="92" stroke="#e11d48" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="80" cy="80" r="7" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
                </g>
              </svg>
            </div>

            {/* Màn hình trung tâm MFD */}
            <div
              style={{
                flex: 1,
                height: 172,
                background: 'linear-gradient(180deg, #090c10 0%, #020305 100%)',
                border: '1.5px solid #1e2636',
                borderRadius: 14,
                padding: '6px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'inset 0 0 18px rgba(0,0,0,0.9)'
              }}
            >
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 22,
                    color: '#22c55e',
                    lineHeight: 1,
                    opacity: signal === 'left' ? 1 : 0.15,
                    textShadow: signal === 'left' ? '0 0 14px #22c55e' : 'none',
                    animation: signal === 'left' ? 'blinkSignal 0.5s steps(1) infinite' : 'none'
                  }}
                >
                  ◀
                </span>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#38bdf8', opacity: 0.9 }}>
                    💡
                  </span>
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 800 }}>
                    AUTO LIGHTS
                  </span>
                </div>

                <span
                  style={{
                    fontSize: 22,
                    color: '#22c55e',
                    lineHeight: 1,
                    opacity: signal === 'right' ? 1 : 0.15,
                    textShadow: signal === 'right' ? '0 0 14px #22c55e' : 'none',
                    animation: signal === 'right' ? 'blinkSignal 0.5s steps(1) infinite' : 'none'
                  }}
                >
                  ▶
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: `4.5px solid ${isOverSpeed ? '#ef4444' : '#dc2626'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isOverSpeed ? '0 0 14px #ef4444' : '0 2px 8px rgba(0,0,0,0.6)',
                    transition: 'all 0.2s ease'
                  }}
                  title="Tốc độ giới hạn StVO hiện tại"
                >
                  <span style={{ color: '#0f172a', fontWeight: 900, fontSize: 18, lineHeight: 1 }}>
                    {speedLimit}
                  </span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 44,
                      fontWeight: 900,
                      lineHeight: 0.9,
                      letterSpacing: -1.5,
                      color: isOverSpeed ? '#f87171' : '#ffffff',
                      textShadow: isOverSpeed ? '0 0 16px rgba(239,68,68,0.7)' : '0 2px 10px rgba(0,0,0,0.6)'
                    }}
                  >
                    {speedKmh}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, marginTop: 2 }}>
                    km/h
                  </div>
                </div>
              </div>

              {/* Hàng nút cần số P R N D */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  padding: '3px 8px',
                  background: 'rgba(15,23,42,0.85)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {(['P', 'R', 'N', 'D'] as const).map((g) => {
                  const isActive = gear === g;
                  return (
                    <button
                      key={g}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGear?.(g);
                      }}
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 5,
                        background: isActive ? '#0284c7' : 'transparent',
                        color: isActive ? '#ffffff' : '#64748b',
                        border: isActive ? '1px solid #38bdf8' : '1px solid transparent',
                        boxShadow: isActive ? '0 0 10px #0284c7' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title={`Phím số ${g === 'P' ? '1' : g === 'R' ? '2' : g === 'N' ? '3' : '4'}`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Công-tơ-mét Tốc độ Analog */}
            <div style={{ width: 175, height: 175, position: 'relative' }}>
              <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%' }}>
                <circle cx="80" cy="80" r="74" fill="#0c0e14" stroke="#1f2533" strokeWidth="3" />
                <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260].map((v) => {
                  const angle = -135 + (v / 260) * 270;
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 80 + Math.cos(rad) * 66;
                  const y1 = 80 + Math.sin(rad) * 66;
                  const x2 = 80 + Math.cos(rad) * 55;
                  const y2 = 80 + Math.sin(rad) * 55;
                  const tx = 80 + Math.cos(rad) * 44;
                  const ty = 80 + Math.sin(rad) * 44;

                  const isStVO = v === 30 || v === 50;

                  return (
                    <g key={v}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isStVO ? '#ef4444' : '#f1f5f9'}
                        strokeWidth={isStVO ? '3.5' : '2'}
                      />
                      <text
                        x={tx}
                        y={ty + 4}
                        fill={isStVO ? '#f87171' : '#e2e8f0'}
                        fontSize={v >= 100 ? '9' : '10'}
                        fontWeight="800"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {v}
                      </text>
                    </g>
                  );
                })}

                <text x="80" y="112" fill="#64748b" fontSize="10" fontWeight="800" textAnchor="middle">
                  km/h
                </text>

                <g transform={`rotate(${speedNeedleDeg} 80 80)`}>
                  <line x1="80" y1="80" x2="80" y2="22" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
                  <line x1="80" y1="80" x2="80" y2="92" stroke="#e11d48" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="80" cy="80" r="7" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
                </g>
              </svg>
            </div>
          </div>

          {/* ── 7. VÔ-LĂNG THỂ THAO 3 CHẤU (ANIMATED SPORTS STEERING WHEEL) ── */}
          <div
            style={{
              position: 'absolute',
              left: '44%',
              bottom: '-62%',
              transform: `translateX(-50%) rotate(${steerDeg}deg)`,
              transformOrigin: '240px 240px',
              width: 480,
              height: 480,
              pointerEvents: 'none',
              zIndex: 15,
              transition: 'transform 0.04s linear'
            }}
          >
            <svg viewBox="0 0 480 480" style={{ width: '100%', height: '100%' }}>
              <defs>
                <radialGradient id="wheelRimGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="78%" stopColor="#2c323d" />
                  <stop offset="90%" stopColor="#181c22" />
                  <stop offset="100%" stopColor="#0a0c10" />
                </radialGradient>

                <linearGradient id="spokeChrome" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>

                <filter id="wheelShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#000000" floodOpacity="0.9" />
                </filter>
              </defs>

              <circle
                cx="240"
                cy="240"
                r="215"
                fill="none"
                stroke="url(#wheelRimGrad)"
                strokeWidth="42"
                filter="url(#wheelShadow)"
              />

              <circle
                cx="240"
                cy="240"
                r="192"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
              />

              <path
                d="M 60,165 C 50,195 50,210 65,230"
                stroke="#13161c"
                strokeWidth="46"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 420,165 C 430,195 430,210 415,230"
                stroke="#13161c"
                strokeWidth="46"
                strokeLinecap="round"
                fill="none"
              />

              <path
                d="M 65,225 L 180,225 C 195,225 200,235 200,245 L 200,265 C 200,275 190,280 175,280 L 75,275 Z"
                fill="#181c23"
                stroke="url(#spokeChrome)"
                strokeWidth="2.5"
              />
              <rect x="100" y="240" width="22" height="18" rx="4" fill="#0d0f13" stroke="#475569" strokeWidth="1" />
              <rect x="130" y="240" width="22" height="18" rx="4" fill="#0d0f13" stroke="#475569" strokeWidth="1" />

              <path
                d="M 415,225 L 300,225 C 285,225 280,235 280,245 L 280,265 C 280,275 290,280 305,280 L 405,275 Z"
                fill="#181c23"
                stroke="url(#spokeChrome)"
                strokeWidth="2.5"
              />
              <rect x="328" y="240" width="22" height="18" rx="4" fill="#0d0f13" stroke="#475569" strokeWidth="1" />
              <rect x="358" y="240" width="22" height="18" rx="4" fill="#0d0f13" stroke="#475569" strokeWidth="1" />

              <path
                d="M 215,310 L 210,430 C 210,440 220,445 240,445 C 260,445 270,440 270,430 L 265,310 Z"
                fill="url(#spokeChrome)"
              />
              <rect x="233" y="340" width="14" height="65" rx="7" fill="#0e1117" />

              <circle
                cx="240"
                cy="255"
                r="76"
                fill="#13161c"
                stroke="#2e3748"
                strokeWidth="3.5"
              />
              <circle
                cx="240"
                cy="255"
                r="70"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1.5"
              />

              <circle cx="240" cy="255" r="28" fill="#0b0e14" stroke="#94a3b8" strokeWidth="2.5" />
              <circle cx="240" cy="255" r="24" fill="none" stroke="#38bdf8" strokeWidth="1" />
              <text
                x="240"
                y="260"
                fill="#f8fafc"
                fontSize="14"
                fontWeight="900"
                textAnchor="middle"
                fontFamily="sans-serif"
                letterSpacing="1"
              >
                FS
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
