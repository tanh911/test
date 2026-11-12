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

  // Góc kim tốc độ (-125° tới +125°, thang đo 0..240 km/h)
  const speedNeedleDeg = useMemo(() => {
    const frac = Math.max(0, Math.min(1, speedKmh / 240));
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
          top: 14,
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
            width: 16,
            height: 10,
            background: 'linear-gradient(180deg, #101318 0%, #1e2430 100%)',
            borderRadius: '2px 2px 0 0',
            border: '1px solid #334155'
          }}
        />

        {/* Khung gương tràn viền cao cấp */}
        <div
          id="sim-mirror-center"
          style={{
            position: 'relative',
            width: 250,
            height: 56,
            borderRadius: '8px 8px 18px 18px',
            border: '2px solid #334155',
            boxShadow: '0 10px 28px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.3)',
            background: 'transparent',
            overflow: 'hidden'
          }}
        >
          {/* Lớp phủ quang học chống chói dịu mắt */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(56,189,248,0.04) 0%, rgba(2,6,23,0.1) 100%)',
              pointerEvents: 'none'
            }}
          />
          {/* Vát viền kính sang trọng */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '6px 6px 16px 16px',
              border: '1px solid rgba(255,255,255,0.16)',
              boxShadow: 'inset 0 0 6px rgba(0,0,0,0.5)',
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
              opacity: 0.7,
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
          left: 42,
          bottom: '38.5%',
          width: 152,
          height: 88,
          borderRadius: '12px',
          background: 'transparent',
          border: '7px solid #161b24',
          outline: '1.5px solid #334155',
          boxShadow: '0 12px 32px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.2)',
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
            borderRadius: '5px',
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.75)',
            background: 'transparent',
            overflow: 'hidden'
          }}
        >
          {/* Lớp phủ quang học xanh mát */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(56,189,248,0.05) 0%, rgba(2,6,23,0.1) 100%)',
              pointerEvents: 'none'
            }}
          />
          {/* Vạch chia góc lồi chống điểm mù StVO (Aspherical Divider) */}
          <div
            style={{
              position: 'absolute',
              left: 28,
              top: 0,
              bottom: 0,
              width: 1,
              borderRight: '1px dashed rgba(255,255,255,0.4)',
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>

      {/* ── 4. GƯƠNG CHIẾU HẬU NGOÀI BÊN PHẢI (RIGHT WING MIRROR) ── */}
      <div
        style={{
          position: 'absolute',
          right: 42,
          bottom: '38.5%',
          width: 146,
          height: 84,
          borderRadius: '12px',
          background: 'transparent',
          border: '7px solid #161b24',
          outline: '1.5px solid #334155',
          boxShadow: '0 12px 32px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.2)',
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
            borderRadius: '5px',
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.75)',
            background: 'transparent',
            overflow: 'hidden'
          }}
        >
          {/* Lớp phủ quang học xanh mát */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(225deg, rgba(56,189,248,0.05) 0%, rgba(2,6,23,0.1) 100%)',
              pointerEvents: 'none'
            }}
          />
          {/* Vạch chia góc lồi chống điểm mù StVO (Aspherical Divider) */}
          <div
            style={{
              position: 'absolute',
              right: 28,
              top: 0,
              bottom: 0,
              width: 1,
              borderLeft: '1px dashed rgba(255,255,255,0.4)',
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
            bottom: '34%',
            transform: 'translateX(-50%)',
            width: 620,
            height: 186,
            background: 'linear-gradient(180deg, #0e1117 0%, #050608 100%)',
            border: '2px solid #232936',
            borderRadius: 22,
            boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.95), 0 10px 32px rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 18px',
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

          {/* Công-tơ-mét Tốc độ Analog */}
          <div style={{ width: 168, height: 168, position: 'relative' }}>
            <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%' }}>
              <circle cx="80" cy="80" r="74" fill="#0c0e14" stroke="#1f2533" strokeWidth="3" />
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

              {/* Vạch đỏ StVO 30 & 50 km/h */}
              {[30, 50].map((limitVal) => {
                const degFromTop = -125 + (limitVal / 240) * 250;
                const rad = ((degFromTop - 90) * Math.PI) / 180;
                return (
                  <line
                    key={`stvo-${limitVal}`}
                    x1={80 + Math.cos(rad) * 67}
                    y1={80 + Math.sin(rad) * 67}
                    x2={80 + Math.cos(rad) * 53}
                    y2={80 + Math.sin(rad) * 53}
                    stroke="#ef4444"
                    strokeWidth="3"
                  />
                );
              })}

              {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240].map((v) => {
                const degFromTop = -125 + (v / 240) * 250;
                const rad = ((degFromTop - 90) * Math.PI) / 180;
                const x1 = 80 + Math.cos(rad) * 66;
                const y1 = 80 + Math.sin(rad) * 66;
                const x2 = 80 + Math.cos(rad) * 56;
                const y2 = 80 + Math.sin(rad) * 56;
                const tx = 80 + Math.cos(rad) * 43.5;
                const ty = 80 + Math.sin(rad) * 43.5;

                return (
                  <g key={v}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#f1f5f9"
                      strokeWidth={v % 40 === 0 ? '2.2' : '1.5'}
                    />
                    <text
                      x={tx}
                      y={ty + 3}
                      fill="#e2e8f0"
                      fontSize={v >= 100 ? '8.2' : '9'}
                      fontWeight="800"
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
            Hạ thấp hợp lý dưới bệ đồng hồ để KHÔNG che bất kỳ con số, chữ RPM/km/h hay dãy số P R N D nào. */}
        <div
          style={{
            position: 'absolute',
            left: '44%',
            bottom: '-96%',
            transform: 'translateX(-50%) perspective(1050px) rotateX(22deg)',
            width: 400,
            height: 400,
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
              filter: 'drop-shadow(0 16px 26px rgba(0,0,0,0.88))'
            }}
          >
          <svg viewBox="0 0 480 480" style={{ width: '100%', height: '100%' }}>
            <defs>
              <radialGradient id="wheelRimGrad" cx="50%" cy="42%" r="52%">
                <stop offset="76%" stopColor="#343b47" />
                <stop offset="88%" stopColor="#181c22" />
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

            {/* Highlight da bọc viền trên — bắt sáng cửa sổ trước */}
            <path
              d="M 117,64 A 215 215 0 0 1 363,64"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="11"
              fill="none"
              strokeLinecap="round"
            />
            {/* Bóng đổ phần viền dưới khuất */}
            <path
              d="M 122,418 A 215 215 0 0 0 358,418"
              stroke="rgba(0,0,0,0.55)"
              strokeWidth="24"
              fill="none"
              strokeLinecap="round"
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
