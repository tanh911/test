import React, { useMemo } from 'react';

export interface ModernCockpitProps {
  speedKmh?: number;
  rpm?: number;
  gear?: 'P' | 'R' | 'N' | 'D';
  speedLimit?: number;
  signal?: 'left' | 'right' | null;
  steerAngle?: number; // radians (-0.55 to +0.55)
  camMode?: string;
  onSelectGear?: (g: 'P' | 'R' | 'N' | 'D') => void;
  onToggleCam?: () => void;
  onToggleMirror?: () => void;
}

/**
 * 🚗 MODERN COCKPIT OVERLAY (Fahrschule & Sport Virtual Cockpit)
 * Buồng lái thể thao hiện đại, chuẩn tỉ lệ ghế lái xe Đức:
 * - Khung kính chắn gió & Cột chữ A (A-Pillars) bọc da sang trọng
 * - Gương chiếu hậu trung tâm (Digital Rearview Mirror)
 * - Táp-lô vòm cong thể thao (Leather Stitching, Ambient Cyan Strip, Air Vents)
 * - Cụm đồng hồ Virtual Cockpit độ nét cao:
 *   + Đồng hồ vòng tua RPM Analog (0 - 8000 RPM, Redline đỏ 6500)
 *   + Đồng hồ tốc độ Analog (0 - 260 km/h, vạch đỏ StVO 30 / 50 / 100)
 *   + Màn hình kỹ thuật số MFD trung tâm: Tốc độ số, Biển báo StVO Đức, Cần số P-R-N-D
 *   + Đèn xi-nhan LED xanh lá chớp sáng động
 * - Vô-lăng thể thao 3 chấu bọc da khoét rãnh, xoay mượt mà theo góc lái A/D
 */
export const ModernCockpit: React.FC<ModernCockpitProps> = ({
  speedKmh = 0,
  rpm = 850,
  gear = 'D',
  speedLimit = 50,
  signal = null,
  steerAngle = 0,
  camMode = 'cabin',
  onSelectGear,
  onToggleCam,
  onToggleMirror
}) => {
  // Góc quay vô-lăng (độ): tỉ lệ lái nhạy bén (~2.4x)
  const steerDeg = useMemo(() => {
    const rawDeg = (steerAngle * 180) / Math.PI;
    return Math.max(-85, Math.min(85, rawDeg * 2.4));
  }, [steerAngle]);

  // Góc kim tốc độ: từ -135° (0 km/h) tới +135° (260 km/h) -> tổng 270°
  const speedNeedleDeg = useMemo(() => {
    const frac = Math.max(0, Math.min(1, speedKmh / 260));
    return -135 + frac * 270;
  }, [speedKmh]);

  // Góc kim vòng tua RPM: từ -135° (0 RPM) tới +135° (8000 RPM)
  const rpmNeedleDeg = useMemo(() => {
    const frac = Math.max(0, Math.min(1, rpm / 8000));
    return -135 + frac * 270;
  }, [rpm]);

  // Cảnh báo quá tốc độ StVO
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
          {/* Gradient Cột chữ A bên trái */}
          <linearGradient id="leftPillarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0b0d11" />
            <stop offset="65%" stopColor="#181c23" />
            <stop offset="92%" stopColor="#252b36" />
            <stop offset="100%" stopColor="#0f1217" />
          </linearGradient>

          {/* Gradient Cột chữ A bên phải */}
          <linearGradient id="rightPillarGrad" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#0b0d11" />
            <stop offset="65%" stopColor="#181c23" />
            <stop offset="92%" stopColor="#252b36" />
            <stop offset="100%" stopColor="#0f1217" />
          </linearGradient>

          {/* Gradient viền mép trần xe */}
          <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#090a0d" />
            <stop offset="70%" stopColor="#15181f" />
            <stop offset="100%" stopColor="rgba(21, 24, 31, 0)" />
          </linearGradient>

          {/* Bóng đổ kính lái */}
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

      {/* ── 2. GƯƠNG CHIẾU HẬU TRUNG TÂM (DIGITAL REARVIEW MIRROR) ── */}
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
        title="Nhấn phím M hoặc bấm để đổi góc nhìn gương"
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
            background: 'linear-gradient(180deg, #181c23 0%, #0c0e12 100%)',
            border: '2.5px solid #3b4252',
            borderRadius: 14,
            padding: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.85), inset 0 1px 2px rgba(255,255,255,0.2)',
            display: 'flex',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              flex: 1,
              borderRadius: 9,
              background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
              border: '1px solid rgba(56,189,248,0.3)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ position: 'absolute', left: 45, right: 45, bottom: 6, height: 1.5, background: 'rgba(239,68,68,0.7)' }} />
            <div style={{ position: 'absolute', left: 65, right: 65, bottom: 16, height: 1.5, background: 'rgba(234,179,8,0.65)' }} />
            <div style={{ position: 'absolute', left: 82, right: 82, bottom: 26, height: 1.5, background: 'rgba(74,222,128,0.6)' }} />
            <div style={{ position: 'absolute', left: '50%', top: 4, bottom: 4, width: 1, background: 'rgba(56,189,248,0.25)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 2 }}>
              <span style={{ fontSize: 10, color: '#94a3b8', letterSpacing: 1.5, fontWeight: 800 }}>
                REARVIEW [M]
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: camMode === 'mirror' ? '#0284c7' : 'rgba(255,255,255,0.1)',
                  color: '#f8fafc'
                }}
              >
                {camMode === 'mirror' ? 'ACTIVE' : 'WIDE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. THÂN TÁP-LÔ DƯỚI (LOWER DASHBOARD BINNACLE) ── */}
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
              <stop offset="12%" stopColor="#0284c7" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            <filter id="dashShadow" x="-5%" y="-20%" width="110%" height="140%">
              <feDropShadow dx="0" dy="-8" stdDeviation="14" floodColor="#000000" floodOpacity="0.85" />
            </filter>
          </defs>

          {/* Khối táp-lô: Đường cong vòm che cụm đồng hồ chuẩn dáng xe Đức */}
          <path
            d="
              M 0,400 
              L 0,130 
              C 120,125 240,100 370,68 
              C 480,42 700,36 880,64 
              C 1020,86 1160,118 1420,135 
              C 1650,148 1800,156 1920,160 
              L 1920,400 
              Z
            "
            fill="url(#dashBodyGrad)"
            filter="url(#dashShadow)"
          />

          {/* Dải LED Ambient Cyan */}
          <path
            d="
              M 0,130 
              C 120,125 240,100 370,68 
              C 480,42 700,36 880,64 
              C 1020,86 1160,118 1420,135 
              C 1650,148 1800,156 1920,160
            "
            stroke="url(#ambientCyan)"
            strokeWidth="3.5"
            fill="none"
            opacity="0.9"
          />

          {/* Chỉ thêu kép da táp-lô */}
          <path
            d="
              M 0,138 
              C 120,133 240,108 370,76 
              C 480,50 700,44 880,72 
              C 1020,94 1160,126 1420,143 
              C 1650,156 1800,164 1920,168
            "
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="5,4"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Cửa gió điều hòa bên trái */}
          <g transform="translate(180, 150)">
            <rect x="0" y="0" width="70" height="38" rx="6" fill="#0d0f13" stroke="#2e3542" strokeWidth="2" />
            <line x1="8" y1="10" x2="62" y2="10" stroke="#475569" strokeWidth="2.5" />
            <line x1="8" y1="19" x2="62" y2="19" stroke="#475569" strokeWidth="2.5" />
            <line x1="8" y1="28" x2="62" y2="28" stroke="#475569" strokeWidth="2.5" />
            <circle cx="35" cy="19" r="4" fill="#94a3b8" />
          </g>

          {/* Cửa gió điều hòa bên phải */}
          <g transform="translate(1120, 160)">
            <rect x="0" y="0" width="90" height="38" rx="6" fill="#0d0f13" stroke="#2e3542" strokeWidth="2" />
            <line x1="10" y1="10" x2="80" y2="10" stroke="#475569" strokeWidth="2.5" />
            <line x1="10" y1="19" x2="80" y2="19" stroke="#475569" strokeWidth="2.5" />
            <line x1="10" y1="28" x2="80" y2="28" stroke="#475569" strokeWidth="2.5" />
            <circle cx="45" cy="19" r="4" fill="#94a3b8" />
          </g>
        </svg>

        {/* ── 4. BẢNG ĐỒNG HỒ VIRTUAL COCKPIT (INSTRUMENT CLUSTER) ── */}
        <div
          style={{
            position: 'absolute',
            left: '34%',
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
          {/* Cụm vòng tua RPM Analog (Bên trái) */}
          <div style={{ width: 175, height: 175, position: 'relative' }}>
            <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%' }}>
              <circle cx="80" cy="80" r="74" fill="#0c0e14" stroke="#1f2533" strokeWidth="3" />
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

              {/* Vùng Redline 6.5 - 8.0 x1000 RPM */}
              <path
                d="M 125,125 A 64 64 0 0 0 144,80"
                stroke="#ef4444"
                strokeWidth="6"
                fill="none"
                opacity="0.9"
              />

              {/* Vạch chia 0 đến 8 */}
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

              {/* Kim đồng hồ RPM */}
              <g transform={`rotate(${rpmNeedleDeg} 80 80)`}>
                <line x1="80" y1="80" x2="80" y2="22" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
                <line x1="80" y1="80" x2="80" y2="92" stroke="#e11d48" strokeWidth="4" strokeLinecap="round" />
                <circle cx="80" cy="80" r="7" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              </g>
            </svg>
          </div>

          {/* Màn hình trung tâm MFD (Digital Screen) */}
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
            {/* Hàng trên: Xi-nhan trái / phải & Đèn pha */}
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

            {/* Giữa: Biển báo StVO + Tốc độ số lớn */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              {/* Biển báo StVO Đức (Zeichen 274) */}
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

              {/* Tốc độ số Digital */}
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

            {/* Hàng dưới: Cần số tự động P - R - N - D */}
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

          {/* Cụm công-tơ-mét Tốc độ Analog (Bên phải) */}
          <div style={{ width: 175, height: 175, position: 'relative' }}>
            <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%' }}>
              <circle cx="80" cy="80" r="74" fill="#0c0e14" stroke="#1f2533" strokeWidth="3" />
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

              {/* Vạch chia tốc độ 0 - 260 km/h */}
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

              {/* Kim đồng hồ Tốc độ */}
              <g transform={`rotate(${speedNeedleDeg} 80 80)`}>
                <line x1="80" y1="80" x2="80" y2="22" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
                <line x1="80" y1="80" x2="80" y2="92" stroke="#e11d48" strokeWidth="4" strokeLinecap="round" />
                <circle cx="80" cy="80" r="7" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
              </g>
            </svg>
          </div>
        </div>

        {/* ── 5. VÔ-LĂNG THỂ THAO 3 CHẤU (ANIMATED SPORTS STEERING WHEEL) ── */}
        <div
          style={{
            position: 'absolute',
            left: '34%',
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

            {/* Vành ngoài vô-lăng (Thick Sports Rim) */}
            <circle
              cx="240"
              cy="240"
              r="215"
              fill="none"
              stroke="url(#wheelRimGrad)"
              strokeWidth="42"
              filter="url(#wheelShadow)"
            />

            {/* Viền kim loại mờ bên trong vành */}
            <circle
              cx="240"
              cy="240"
              r="192"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
            />

            {/* Gờ tì ngón tay cái thể thao (Thumb grips tại hướng 10h và 2h) */}
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

            {/* Chấu ngang bên trái */}
            <path
              d="M 65,225 L 180,225 C 195,225 200,235 200,245 L 200,265 C 200,275 190,280 175,280 L 75,275 Z"
              fill="#181c23"
              stroke="url(#spokeChrome)"
              strokeWidth="2.5"
            />
            <rect x="100" y="240" width="22" height="18" rx="4" fill="#0d0f13" stroke="#475569" strokeWidth="1" />
            <rect x="130" y="240" width="22" height="18" rx="4" fill="#0d0f13" stroke="#475569" strokeWidth="1" />

            {/* Chấu ngang bên phải */}
            <path
              d="M 415,225 L 300,225 C 285,225 280,235 280,245 L 280,265 C 280,275 290,280 305,280 L 405,275 Z"
              fill="#181c23"
              stroke="url(#spokeChrome)"
              strokeWidth="2.5"
            />
            <rect x="328" y="240" width="22" height="18" rx="4" fill="#0d0f13" stroke="#475569" strokeWidth="1" />
            <rect x="358" y="240" width="22" height="18" rx="4" fill="#0d0f13" stroke="#475569" strokeWidth="1" />

            {/* Chấu dọc hướng 6h */}
            <path
              d="M 215,310 L 210,430 C 210,440 220,445 240,445 C 260,445 270,440 270,430 L 265,310 Z"
              fill="url(#spokeChrome)"
            />
            <rect x="233" y="340" width="14" height="65" rx="7" fill="#0e1117" />

            {/* Trung tâm túi khí (Airbag Hub & Horn Pad) */}
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

            {/* Logo trung tâm Fahrschule / Sport Emblem */}
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
  );
};
