import React, { useMemo } from 'react';

export interface ModernCockpitProps {
  speedKmh?: number;
  rpm?: number;
  gear?: 'P' | 'R' | 'N' | 'D';
  speedLimit?: number;
  signal?: 'left' | 'right' | null;
  steerAngle?: number; // radians (-0.55 to +0.55)
  camMode?: string;
  headYaw?: number;
  headPitch?: number;
  /** tên phố hiện tại (road gần nhất từ OSM Berlin) — hiển thị trên MFD */
  streetName?: string;
  onSelectGear?: (g: 'P' | 'R' | 'N' | 'D') => void;
  onToggleCam?: () => void;
  onToggleMirror?: () => void;
}

/**
 * 🚗 MODERN COCKPIT OVERLAY (Buồng Lái Ô Tô Thể Thao Cao Cấp)
 * Thiết kế sang trọng, chân thực theo chuẩn công thái học xe hơi Châu Âu:
 * - Buồng lái CỐ ĐỊNH chắc chắn trên xe (Fixed Cockpit Architecture).
 *   Người chơi kéo chuột để liếc nhìn quan sát thế giới 3D xung quanh tự nhiên.
 * - 3 GƯƠNG CHIẾU HẬU THẬT TÍCH HỢP LIỀN KHỐI:
 *   1. Gương chiếu hậu trong xe tràn viền (Frameless Interior Rearview Mirror) treo trần kính lái
 *   2. Gương chiếu hậu ngoài trái (Left Wing Mirror) gắn liền chân cột chữ A & bệ cửa lái
 *   3. Gương chiếu hậu ngoài phải (Right Wing Mirror) gắn liền chân cột chữ A & bệ cửa phụ
 * - Vô-lăng thể thao 3 chấu bọc da xoay mượt mà theo góc đánh lái A/D
 * - Cụm đồng hồ Virtual Cockpit độ nét cao (RPM Analog, Tốc độ StVO 30/50, Cần số P-R-N-D)
 */
export const ModernCockpit: React.FC<ModernCockpitProps> = ({
  speedKmh = 0,
  rpm = 850,
  gear = 'D',
  speedLimit = 50,
  signal = null,
  steerAngle = 0,
  streetName,
  onSelectGear
}) => {
  // Góc quay vô-lăng (độ)
  const steerDeg = useMemo(() => {
    const rawDeg = (steerAngle * 180) / Math.PI;
    return Math.max(-85, Math.min(85, rawDeg * 2.4));
  }, [steerAngle]);

  // Góc kim tốc độ (-125° tới +125°, thang đo đô thị 0..120 km/h giúp vùng 0-60 km/h rộng và cực dễ đọc)
  const speedNeedleDeg = useMemo(() => {
    const frac = Math.max(0, Math.min(1, speedKmh / 120));
    return -125 + frac * 250;
  }, [speedKmh]);

  // Góc kim tua máy (-125° tới +125°, thang đo 0..8000 RPM)
  const rpmNeedleDeg = useMemo(() => {
    const frac = Math.max(0, Math.min(1, rpm / 8000));
    return -125 + frac * 250;
  }, [rpm]);

  const isOverSpeed = speedKmh > speedLimit + 3;

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
            <stop offset="0%" stopColor="#080a0e" />
            <stop offset="65%" stopColor="#141822" />
            <stop offset="100%" stopColor="#1e2430" />
          </linearGradient>

          <linearGradient id="rightPillarGrad" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#080a0e" />
            <stop offset="65%" stopColor="#141822" />
            <stop offset="100%" stopColor="#1e2430" />
          </linearGradient>

          <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#07080b" />
            <stop offset="100%" stopColor="rgba(10, 12, 16, 0)" />
          </linearGradient>

          <linearGradient id="wsReflect" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="55%" stopColor="rgba(200,225,255,0.045)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Dải chắn nắng trần kính lái mỏng nhẹ */}
        <rect x="0" y="0" width="1920" height="22" fill="#07080a" />
        <rect x="0" y="22" width="1920" height="28" fill="url(#roofGrad)" opacity="0.75" />

        {/* Cột chữ A thanh mảnh thể thao (không che góc gương) */}
        <path d="M 0,0 L 32,0 L 48,1080 L 0,1080 Z" fill="url(#leftPillarGrad)" />
        <path d="M 32,0 L 48,1080" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />

        <path d="M 1920,0 L 1888,0 L 1872,1080 L 1920,1080 Z" fill="url(#rightPillarGrad)" />
        <path d="M 1888,0 L 1872,1080" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />

        {/* Phản chiếu táp-lô mờ trên kính lái — chi tiết "bán" cảm giác ngồi trong xe */}
        <polygon
          points="120,190 760,120 900,150 260,260"
          fill="url(#wsReflect)"
          opacity="0.5"
        />
        <polygon
          points="1050,135 1500,160 1420,235 1010,185"
          fill="url(#wsReflect)"
          opacity="0.35"
        />
      </svg>

      {/* ── 2. GƯƠNG CHIẾU HẬU TRUNG TÂM TRÀN VIỀN (FRAMELESS INTERIOR MIRROR) ── */}
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 35
        }}
      >
        {/* Cụm ngàm nhôm treo gương vào kính lái */}
        <div
          style={{
            width: 22,
            height: 12,
            background: 'linear-gradient(180deg, #101318 0%, #262e3d 100%)',
            borderRadius: '3px 3px 0 0',
            border: '1px solid #475569'
          }}
        />

        {/* Khung gương tràn viền cao cấp — kích thước lớn (310x74), sáng rõ không phủ mờ */}
        <div
          id="sim-mirror-center"
          style={{
            position: 'relative',
            width: 310,
            height: 74,
            borderRadius: '10px 10px 20px 20px',
            border: '3px solid #283244',
            boxShadow: '0 10px 28px rgba(0,0,0,0.85), inset 0 1px 2px rgba(255,255,255,0.35)',
            background: 'transparent',
            overflow: 'hidden'
          }}
        >
          {/* Vát viền kính sang trọng */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '7px 7px 17px 17px',
              border: '1px solid rgba(255,255,255,0.22)',
              pointerEvents: 'none'
            }}
          />
          {/* Chấm cảm biến tự động làm tối (auto-dimming sensor) */}
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#38bdf8',
              opacity: 0.75,
              boxShadow: '0 0 4px #38bdf8',
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>

      {/* ── 3. GƯƠNG CHIẾU HẬU NGOÀI BÊN TRÁI (LEFT WING MIRROR) ── */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          bottom: '38.5%',
          width: 188,
          height: 108,
          borderRadius: '14px',
          background: 'transparent',
          border: '7px solid #161b24',
          outline: '1.5px solid #3b4963',
          boxShadow: '0 12px 32px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.22)',
          pointerEvents: 'none',
          zIndex: 32
        }}
      >
        <div
          id="sim-mirror-left"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '7px',
            background: 'transparent',
            overflow: 'hidden'
          }}
        >
          {/* Vạch chia góc lồi chống điểm mù StVO (Aspherical Divider) */}
          <div
            style={{
              position: 'absolute',
              left: 34,
              top: 0,
              bottom: 0,
              width: 1,
              borderRight: '1px dashed rgba(255,255,255,0.45)',
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>

      {/* ── 4. GƯƠNG CHIẾU HẬU NGOÀI BÊN PHẢI (RIGHT WING MIRROR) ── */}
      <div
        style={{
          position: 'absolute',
          right: 40,
          bottom: '38.5%',
          width: 182,
          height: 104,
          borderRadius: '14px',
          background: 'transparent',
          border: '7px solid #161b24',
          outline: '1.5px solid #3b4963',
          boxShadow: '0 12px 32px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.22)',
          pointerEvents: 'none',
          zIndex: 32
        }}
      >
        <div
          id="sim-mirror-right"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '7px',
            background: 'transparent',
            overflow: 'hidden'
          }}
        >
          {/* Vạch chia góc lồi chống điểm mù StVO (Aspherical Divider) */}
          <div
            style={{
              position: 'absolute',
              right: 34,
              top: 0,
              bottom: 0,
              width: 1,
              borderLeft: '1px dashed rgba(255,255,255,0.45)',
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>

      {/* ── 4b. CHÂN GƯƠNG NGOÀI (MIRROR STALKS) — nối gương vào cột chữ A, hết lơ lửng ── */}
      <div
        style={{
          position: 'absolute',
          left: 10,
          bottom: 'calc(38.5% + 14px)',
          width: 52,
          height: 18,
          background: 'linear-gradient(90deg, #10141b 0%, #2a3140 55%, #1a1f29 100%)',
          borderRadius: 8,
          transform: 'rotate(14deg)',
          boxShadow: '0 6px 14px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
          zIndex: 31
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 10,
          bottom: 'calc(38.5% + 12px)',
          width: 52,
          height: 18,
          background: 'linear-gradient(270deg, #10141b 0%, #2a3140 55%, #1a1f29 100%)',
          borderRadius: 8,
          transform: 'rotate(-14deg)',
          boxShadow: '0 6px 14px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
          zIndex: 31
        }}
      />

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

            {/* Vân da táp-lô: turbulence hạt mịn phủ clip theo vòm táp-lô */}
            <filter id="leatherGrain" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.6 0.6 0.6 0 0" />
            </filter>
            <clipPath id="dashClip">
              <path d="
                M 0,400
                L 0,140
                C 140,135 280,110 420,72
                C 560,40 1120,40 1260,76
                C 1400,108 1550,132 1720,148
                C 1820,156 1880,162 1920,165
                L 1920,400
                Z
              " />
            </clipPath>
          </defs>

          {/* Vòm táp-lô căn chuẩn tầm nhìn lái xe */}
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

          {/* Vân da phủ toàn bộ táp-lô (rất mờ) */}
          <rect x="0" y="0" width="1920" height="400" filter="url(#leatherGrain)" opacity="0.05" clipPath="url(#dashClip)" />

          {/* Cánh gà lượn sóng trên mặt táp-lô — vát sáng bắt sáng cửa sổ */}
          <path
            d="
              M 0,150
              C 150,144 300,118 440,80
              C 580,46 1120,46 1270,84
              C 1410,116 1560,140 1730,156
              C 1830,164 1885,170 1920,173
            "
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="9"
            fill="none"
            clipPath="url(#dashClip)"
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
            bottom: '45%',
            transform: 'translateX(-50%)',
            width: 604,
            height: 170,
            background: 'linear-gradient(180deg, #0e1117 0%, #050608 100%)',
            border: '2px solid #232936',
            borderRadius: 22,
            boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.95), 0 10px 32px rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 16px',
            pointerEvents: 'auto',
            zIndex: 12
          }}
        >
          {/* Mũ che cụm đồng hồ (hood) — khối nổi như táp-lô xe thật */}
          <div
            style={{
              position: 'absolute',
              top: -18,
              left: -8,
              right: -8,
              height: 34,
              background: 'linear-gradient(180deg, rgba(6,8,11,0.96) 0%, rgba(12,15,21,0.8) 55%, rgba(12,15,21,0) 100%)',
              borderRadius: '20px 20px 0 0',
              pointerEvents: 'none'
            }}
          />
          {/* Vòng tua RPM Analog */}
          <div style={{ width: 168, height: 168, position: 'relative' }}>
            <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%' }}>
              <circle cx="80" cy="80" r="74" fill="#0c0e14" stroke="#1f2533" strokeWidth="3" />
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

              <path
                d="M 142.6,66.8 A 64 64 0 0 1 132.4,116.7"
                stroke="#ef4444"
                strokeWidth="5"
                fill="none"
                opacity="0.9"
              />

              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((tick) => {
                // Góc 0 ở đỉnh (12h = -90° trong hệ cực chuẩn): quét từ -125° tới +125°
                const degFromTop = -125 + (tick / 8) * 250;
                const rad = ((degFromTop - 90) * Math.PI) / 180;
                const x1 = 80 + Math.cos(rad) * 66;
                const y1 = 80 + Math.sin(rad) * 66;
                const x2 = 80 + Math.cos(rad) * 55;
                const y2 = 80 + Math.sin(rad) * 55;
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
                      y={ty + 3.5}
                      fill={isRed ? '#f87171' : '#e2e8f0'}
                      fontSize="10.5"
                      fontWeight="800"
                      textAnchor="middle"
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              <text x="80" y="114" fill="#64748b" fontSize="8.5" fontWeight="700" textAnchor="middle">
                1/min x1000
              </text>
              <text x="80" y="128" fill="#38bdf8" fontSize="10.5" fontWeight="900" textAnchor="middle">
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
              height: 166,
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
                  AUTO
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
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: `4.5px solid ${isOverSpeed ? '#ef4444' : '#dc2626'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isOverSpeed ? '0 0 14px #ef4444' : '0 2px 8px rgba(0,0,0,0.6)',
                  transition: 'all 0.2s ease'
                }}
                title="StVO Tempo-Limit"
              >
                <span style={{ color: '#0f172a', fontWeight: 900, fontSize: 17, lineHeight: 1 }}>
                  {speedLimit}
                </span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 42,
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

            {/* Tên phố hiện tại — khớp Google Maps để soi chi tiết từng góc */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 800,
                color: '#7dd3fc',
                letterSpacing: 0.4,
                textShadow: '0 0 10px rgba(56,189,248,0.5)',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={streetName ?? 'Berlin-Mitte'}
            >
              <span style={{ fontSize: 11, opacity: 0.8 }}>🛣</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {streetName ?? 'BERLIN MITTE'}
              </span>
            </div>

            {/* Hàng nút cần số P R N D */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '2px 8px',
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
                      fontSize: 11.5,
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

          {/* Công-tơ-mét Tốc độ Analog (Thang đô thị 0..120 km/h — vùng 0-60 rộng gấp đôi, cực dễ đọc) */}
          <div style={{ width: 162, height: 162, position: 'relative' }}>
            <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%' }}>
              <circle cx="80" cy="80" r="74" fill="#0c0e14" stroke="#1f2533" strokeWidth="3" />
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map((v) => {
                const degFromTop = -125 + (v / 120) * 250;
                const rad = ((degFromTop - 90) * Math.PI) / 180;
                const isStVO = v === 30 || v === 50;
                const x1 = 80 + Math.cos(rad) * 66;
                const y1 = 80 + Math.sin(rad) * 66;
                const x2 = 80 + Math.cos(rad) * (isStVO ? 52 : 55);
                const y2 = 80 + Math.sin(rad) * (isStVO ? 52 : 55);
                const tx = 80 + Math.cos(rad) * 43;
                const ty = 80 + Math.sin(rad) * 43;

                return (
                  <g key={v}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isStVO ? '#ef4444' : '#f1f5f9'}
                      strokeWidth={isStVO ? '3.2' : v % 20 === 0 ? '2.2' : '1.5'}
                    />
                    <text
                      x={tx}
                      y={ty + 3.2}
                      fill={isStVO ? '#fca5a5' : '#e2e8f0'}
                      fontSize={v >= 100 ? '8.5' : '9.5'}
                      fontWeight={isStVO ? '900' : '800'}
                      textAnchor="middle"
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      {v}
                    </text>
                  </g>
                );
              })}

              <text x="80" y="126" fill="#38bdf8" fontSize="10" fontWeight="900" textAnchor="middle">
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

        {/* ── 7. VÔ-LĂNG THỂ THAO 3 CHẤU (ANIMATED SPORTS STEERING WHEEL) ──
            Đặt ngay dưới bệ đồng hồ: thấy rõ vành da, 2 chấu điều khiển và logo trung tâm FS,
            xoay mượt theo góc lái A/D mà KHÔNG che bất kỳ con số hay nút P R N D nào. */}
        <div
          style={{
            position: 'absolute',
            left: '44%',
            bottom: '-72%',
            transform: 'translateX(-50%) perspective(950px) rotateX(18deg)',
            width: 390,
            height: 390,
            pointerEvents: 'none',
            zIndex: 15
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `rotate(${steerDeg}deg)`,
              transformOrigin: '50% 50%',
              transition: 'transform 0.04s linear',
              filter: 'drop-shadow(0 14px 24px rgba(0,0,0,0.9))'
            }}
          >
          <svg viewBox="0 0 480 480" style={{ width: '100%', height: '100%' }}>
            <defs>
              <radialGradient id="wheelRimGrad" cx="50%" cy="45%" r="45%">
                <stop offset="72%" stopColor="#384152" />
                <stop offset="86%" stopColor="#1c212b" />
                <stop offset="100%" stopColor="#0b0e14" />
              </radialGradient>

              <linearGradient id="spokeChrome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              <filter id="wheelShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#000000" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* Vành vô-lăng bán kính r=162 xoay quanh tâm (240,240): đỉnh vành ở y=78 nằm gọn dưới dãy P R N D */}
            <circle
              cx="240"
              cy="240"
              r="162"
              fill="none"
              stroke="url(#wheelRimGrad)"
              strokeWidth="34"
              filter="url(#wheelShadow)"
            />

            {/* Vạch đỏ căn tâm đỉnh vô-lăng (12 o'clock sport stripe) */}
            <path
              d="M 233,78 L 247,78"
              stroke="#ef4444"
              strokeWidth="34"
              strokeLinecap="butt"
            />

            {/* Highlight da bọc viền trên */}
            <path
              d="M 135,116 A 162 162 0 0 1 345,116"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />

            <circle
              cx="240"
              cy="240"
              r="144"
              fill="none"
              stroke="rgba(56,189,248,0.22)"
              strokeWidth="1.8"
            />

            {/* Chấu ngang trái + cụm phím điều khiển */}
            <path
              d="M 92,186 L 186,196 C 198,198 204,204 204,212 L 204,228 C 204,236 196,240 182,238 L 96,224 Z"
              fill="#1c222d"
              stroke="url(#spokeChrome)"
              strokeWidth="2.8"
            />
            <rect x="122" y="200" width="20" height="14" rx="3.5" fill="#0d0f13" stroke="#64748b" strokeWidth="1.2" />
            <rect x="148" y="203" width="20" height="14" rx="3.5" fill="#0d0f13" stroke="#64748b" strokeWidth="1.2" />

            {/* Chấu ngang phải + cụm phím điều khiển */}
            <path
              d="M 388,186 L 294,196 C 282,198 276,204 276,212 L 276,228 C 276,236 284,240 298,238 L 384,224 Z"
              fill="#1c222d"
              stroke="url(#spokeChrome)"
              strokeWidth="2.8"
            />
            <rect x="312" y="203" width="20" height="14" rx="3.5" fill="#0d0f13" stroke="#64748b" strokeWidth="1.2" />
            <rect x="338" y="200" width="20" height="14" rx="3.5" fill="#0d0f13" stroke="#64748b" strokeWidth="1.2" />

            {/* Chấu dọc dưới */}
            <path
              d="M 218,255 L 214,395 C 214,402 224,406 240,406 C 256,406 266,402 266,395 L 262,255 Z"
              fill="url(#spokeChrome)"
            />

            {/* Bầu túi khí trung tâm & Logo FS */}
            <circle
              cx="240"
              cy="222"
              r="54"
              fill="#141820"
              stroke="#334155"
              strokeWidth="3.2"
            />
            <circle
              cx="240"
              cy="222"
              r="47"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.5"
            />

            <circle cx="240" cy="218" r="21" fill="#0b0e14" stroke="#94a3b8" strokeWidth="2.2" />
            <circle cx="240" cy="218" r="17" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
            <text
              x="240"
              y="223"
              fill="#f8fafc"
              fontSize="12"
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
