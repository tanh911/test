import React from 'react';
import {
  Compass, AlertTriangle, ShieldAlert, Navigation,
  Check, AlertCircle, Info, ChevronRight, Gauge
} from 'lucide-react';

// ── German Driving Exam Professional Theme Tokens ────────────────────────────
// Palette: Opaque dark #0B0B0B, Panel #151515, Border #292929, Accent #2563EB
// Radius: Small (4px - 8px), Font-weight max 700, No emojis, No gradients, No blur

// ── GPS Infotainment Navigation Bar ──────────────────────────────────────────
export const ARNavigationBox = ({ scenario, distanceTraveled }) => {
  const getDirections = () => {
    if (!scenario) return { text: 'STADTFAHRT - GERMAN CITY ROUTE', detail: 'Spur halten und Kreuzungen beachten' };
    if (scenario.type === 'SLALOM') return { text: 'BÀI 1: LÁI ZICZAC (SLALOM)', detail: 'Tốc độ < 18 km/h, đánh lái uốn lượn qua 8 cọc tiêu' };
    if (scenario.type === 'HILL_START') return { text: 'BÀI 2: DỐC 10% (ANFAHREN AM BERG)', detail: 'Dừng trước vạch đỏ, kéo phanh tay (Space/P), không tuột dốc' };
    if (scenario.type === 'PARALLEL_PARKING') return { text: 'BÀI 3: GHÉP XE SONG SONG', detail: 'Xi-nhan phải (E), vào số R lùi ghép xe giữa 2 chướng ngại vật' };
    if (scenario.type === 'PERPENDICULAR_PARKING') return { text: 'BÀI 4: GHÉP XE VUÔNG GÓC 90°', detail: 'Xi-nhan phải (E), vào số R lùi 90 độ vào chuồng đỗ' };
    if (scenario.type === 'S_CURVE') return { text: 'BÀI 5: ĐƯỜNG VÒNG CHỮ S', detail: 'Tốc độ < 18 km/h, bám mép ngoài, không đè vạch/cọc' };
    if (scenario.type === 'EMERGENCY_BRAKE') return { text: 'BÀI 7: PHANH KHẨN CẤP (GEFAHRENBREMSUNG)', detail: 'Tăng tốc 30 km/h -> Đạp phanh kịch sàn (Vollbremsung)' };
    if (scenario.type === 'BACKWARD_TURN') return { text: 'BÀI 8: LÙI PHẢI NGÕ CUA 90°', detail: 'Xi-nhan phải, lùi ôm vỉa hè cách mép 30-50cm' };
    if (scenario.type === 'UMKEHREN') return { text: 'BÀI 9: QUAY ĐẦU 3 ĐIỂM (UMKEHREN)', detail: 'Tiến trái -> Lùi số R -> Tiến thẳng đổi chiều' };
    if (scenario.type === 'ACCELERATION') return { text: 'BÀI 10: TĂNG TỐC & CHUYỂN SỐ', detail: 'Đạp ga tăng tốc 30 -> 50 km/h qua các cấp số' };
    if (scenario.type === 'EXAM_FINISH') return { text: 'BÀI 11: VẠCH ĐÍCH & DỪNG ĐỖ', detail: 'Xi-nhan phải tấp lề, dừng sau vạch đích, về số P, kéo phanh tay' };
    if (scenario.type === 'STOP_SIGN') return { text: 'HALTEGEBOT (STOPP-SCHILD)', detail: 'Fahrzeug für 3 Sekunden vollständig anhalten' };
    if (scenario.type === 'TRAFFIC_LIGHT') return { text: 'LICHTZEICHENANLAGE (AMPEL)', detail: 'Lichtzeichen beachten' };
    if (scenario.type === 'PEDESTRIAN_CROSSING') return { text: 'FUSSGÄNGERÜBERWEG', detail: 'Bremsbereitschaft herstellen' };
    if (scenario.type === 'SPEED_LIMIT') return { text: `ZULÄSSIGE HÖCHSTGESCHWINDIGKEIT: ${scenario.limit} KM/H`, detail: 'Tacho überwachen' };
    return { text: 'AUTOBAHN - HIGHSPEED SECTION', detail: 'Richtgeschwindigkeit einhalten' };
  };

  const nav = getDirections();

  return (
    <div className="sim-arnav-box" style={{
      position: 'absolute', top: 16, left: 68, zIndex: 25,
      background: '#151515', border: '1px solid #292929',
      borderRadius: 6, padding: '8px 14px', width: 290,
      color: '#E5E5E5', fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #252525', paddingBottom: 6, marginBottom: 6 }}>
        <span style={{ color: '#8A8A8A', fontSize: 10, fontWeight: '600', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Navigation size={12} color="#2563EB" /> ROUTE & HINWEIS
        </span>
        <span style={{ fontSize: 10, color: '#8A8A8A', fontFamily: 'monospace' }}>
          {Math.round(distanceTraveled)}m
        </span>
      </div>
      <div style={{ fontSize: 11, fontWeight: '700', color: '#E5E5E5', marginBottom: 2 }}>
        {nav.text}
      </div>
      <div style={{ fontSize: 10, color: '#94A3B8' }}>
        {nav.detail}
      </div>
    </div>
  );
};

// ── Virtual Instrument Cluster (Digital Gauges on Cockpit Screen) ────────────
// ── Virtual Instrument Cluster (German Digital Cockpit - StVO Standard) ────
export const VirtualCockpitCluster = ({
  speed = 0,
  rpm = 800,
  gear = 'P',
  blinkerL = false,
  blinkerR = false,
  headlights = false,
  hazard = false,
  weatherMode = 'day',
  handbrake = false,
  seatBeltFastened = false,
  onToggleSeatBelt,
  laneWarning = false,
  distanceTraveled = 0,
  warning = null,
  speedLimit = 50,
  onSelectGear
}) => {
  const isReverse = gear === 'R';
  const isBlinkerActiveL = blinkerL || hazard;
  const isBlinkerActiveR = blinkerR || hazard;
  const isOverSpeed = speed > speedLimit;

  const activeMode = gear.startsWith('D') ? 'D' : (gear === 'R' ? 'R' : gear === 'N' ? 'N' : 'P');
  const subGearDisplay = activeMode === 'D' ? (gear.startsWith('D') ? gear : 'D1') : activeMode === 'R' ? 'R' : activeMode === 'P' ? 'P' : 'N';

  // Chỉ hiện cảnh báo ngắn khi có sự kiện vi phạm thực tế
  let activeWarning = warning;
  if (!activeWarning) {
    if (isOverSpeed) activeWarning = `⚠️ QUÁ TỐC ĐỘ ${speedLimit}!`;
    else if (laneWarning) activeWarning = '⚠️ CẢNH BÁO LỆCH LÀN';
    else if (hazard) activeWarning = '⚠️ ĐÈN KHẨN CẤP';
  }

  const gears = [
    { id: 'P', label: 'P', activeBg: '#b45309', activeBorder: '#f59e0b', activeGlow: 'rgba(245, 158, 11, 0.35)', desc: 'Đỗ xe (Parken)' },
    { id: 'R', label: 'R', activeBg: '#b91c1c', activeBorder: '#ef4444', activeGlow: 'rgba(239, 68, 68, 0.35)', desc: 'Số lùi (Rückwärts)' },
    { id: 'N', label: 'N', activeBg: '#334155', activeBorder: '#64748b', activeGlow: 'rgba(100, 116, 139, 0.35)', desc: 'Số Mo (Neutral)' },
    { id: 'D', label: 'D', activeBg: '#1d4ed8', activeBorder: '#3b82f6', activeGlow: 'rgba(59, 130, 246, 0.4)', desc: 'Số tiến (Drive)' },
  ];

  const [minimized, setMinimized] = React.useState(false);
  const rpmPct = Math.min(100, Math.max(0, (rpm / 7000) * 100));

  if (minimized) {
    return (
      <div className="sim-cockpit-cluster sim-cluster-minimized" style={{
        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 32,
        background: 'rgba(11, 15, 25, 0.96)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 8, padding: '4px 10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', gap: 8,
        color: '#E5E5E5', userSelect: 'none'
      }}>
        <div style={{
          fontSize: 11, fontWeight: '900', padding: '1px 6px', borderRadius: 4,
          background: activeMode === 'D' ? '#1d4ed8' : activeMode === 'R' ? '#b91c1c' : activeMode === 'P' ? '#b45309' : '#334155',
          color: '#ffffff'
        }}>
          {subGearDisplay}
        </div>
        <div style={{ fontSize: 18, fontWeight: '900', color: isOverSpeed ? '#ef4444' : '#f8fafc', fontFamily: 'monospace', lineHeight: 1 }}>
          {Math.round(speed)} <span style={{ fontSize: 9, color: '#94a3b8' }}>km/h</span>
        </div>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: '#FFFFFF', border: '2px solid #dc2626',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: '900', color: '#000000', fontFamily: "'Inter', sans-serif"
        }}>
          {speedLimit}
        </div>
        <button
          onClick={() => setMinimized(false)}
          title="Mở rộng bảng đồng hồ táp-lô"
          style={{
            background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#94a3b8', borderRadius: 4, padding: '2px 6px', fontSize: 10,
            cursor: 'pointer', fontWeight: '700'
          }}
        >
          ⛶ Mở
        </button>
      </div>
    );
  }

  return (
    <div className="sim-cockpit-cluster" style={{
      position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 32,
      width: 206,
      background: 'linear-gradient(180deg, rgba(13, 19, 33, 0.96) 0%, rgba(9, 13, 23, 0.98) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.11)',
      borderRadius: 12,
      padding: '8px 10px',
      color: '#E5E5E5',
      boxShadow: '0 14px 36px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)',
      backdropFilter: 'blur(14px)',
      userSelect: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* ── 1. Header Row: Turn Signal Arrows & Minimize ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2px'
      }}>
        {/* Blinker Left */}
        <div
          title="Xi-nhan trái (Q)"
          style={{
            fontSize: 14, fontWeight: '900',
            color: isBlinkerActiveL ? '#22c55e' : 'rgba(255, 255, 255, 0.14)',
            textShadow: isBlinkerActiveL ? '0 0 8px #22c55e' : 'none',
            transition: 'color 0.1s', cursor: 'default'
          }}
        >
          ◀
        </div>

        {/* Hazard Indicator if active */}
        {hazard ? (
          <div style={{ color: '#ef4444', fontSize: 11, fontWeight: '900', animation: 'pulse 1s infinite' }}>
            ⚠️ HAZARD
          </div>
        ) : (
          <div style={{ fontSize: 9, fontWeight: '700', color: '#475569', letterSpacing: '0.06em' }}>
            DIGITAL COCKPIT
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Blinker Right */}
          <div
            title="Xi-nhan phải (E)"
            style={{
              fontSize: 14, fontWeight: '900',
              color: isBlinkerActiveR ? '#22c55e' : 'rgba(255, 255, 255, 0.14)',
              textShadow: isBlinkerActiveR ? '0 0 8px #22c55e' : 'none',
              transition: 'color 0.1s', cursor: 'default'
            }}
          >
            ▶
          </div>

          {/* Minimize button */}
          <button
            onClick={() => setMinimized(true)}
            title="Thu gọn táp-lô để quan sát đường rộng hơn"
            style={{
              background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8', borderRadius: 3, padding: '1px 5px', fontSize: 9,
              cursor: 'pointer', fontWeight: '700'
            }}
          >
            _
          </button>
        </div>
      </div>

      {/* ── 2. Speedometer: Big prominent speed in center & StVO 274 speed limit sign ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', padding: '2px 0 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <div className="sim-speed-val" style={{
            fontSize: 46, fontWeight: '900',
            color: isOverSpeed ? '#ef4444' : '#f8fafc',
            lineHeight: 1,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            letterSpacing: '-0.03em',
            transition: 'color 0.15s ease'
          }}>
            {Math.round(speed)}
          </div>
          <div className="sim-speed-unit" style={{
            fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em'
          }}>
            KM/H
          </div>
        </div>

        {/* Authentic German StVO Zeichen 274 Speed Limit Sign */}
        <div
          className="sim-limit-box"
          title={`Biển báo StVO 274: Tốc độ tối đa cho phép ${speedLimit} km/h`}
          style={{
            position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
            width: 33, height: 33,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '3.5px solid #dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isOverSpeed ? '0 0 12px rgba(220, 38, 38, 0.85), 0 0 4px #ef4444' : '0 2px 8px rgba(0,0,0,0.5)',
            color: '#000000', fontSize: 13, fontWeight: '900',
            fontFamily: "'Inter', sans-serif",
            flexShrink: 0,
            transition: 'box-shadow 0.2s ease'
          }}
        >
          <span className="sim-limit-circle">{speedLimit}</span>
        </div>
      </div>

      {/* ── 3. Linear Tachometer Bar (RPM x1000) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 2px' }}>
        {/* RPM Scale Ticks: 0 - 7 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 8, fontWeight: '700', color: '#64748b',
          fontFamily: 'monospace', padding: '0 2px'
        }}>
          <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
          <span style={{ color: '#eab308' }}>6</span>
          <span style={{ color: '#ef4444' }}>7</span>
        </div>
        {/* Bar */}
        <div style={{
          width: '100%', height: 4,
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 2, overflow: 'hidden'
        }}>
          <div style={{
            width: `${rpmPct}%`,
            height: '100%',
            background: rpm > 6000 ? '#ef4444' : rpm > 5000 ? '#eab308' : '#38bdf8',
            borderRadius: 2,
            transition: 'width 0.08s ease-out'
          }} />
        </div>
        {/* RPM Telemetry Readout */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 8, color: '#475569', fontWeight: '700', letterSpacing: '0.03em'
        }}>
          <span>RPM x1000</span>
          <span style={{ color: rpm > 6000 ? '#ef4444' : '#94a3b8', fontFamily: 'monospace' }}>
            {rpm > 0 ? `${rpm} RPM` : 'ENGINE OFF'}
          </span>
        </div>
      </div>

      {/* ── 4. PRND Gear Selector & Current Subgear Indicator ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        background: 'rgba(0, 0, 0, 0.22)', borderRadius: 6, padding: '3px 4px'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'
        }}>
          {gears.map((g) => {
            const isActive = activeMode === g.id;
            return (
              <button
                key={g.id}
                className="sim-gear-btn"
                onClick={() => onSelectGear && onSelectGear(g.id)}
                title={`${g.label} - ${g.desc}. Bấm để chuyển số hoặc dùng phím tắt.`}
                style={{
                  width: 38, height: 23,
                  borderRadius: 4,
                  border: isActive ? `1px solid ${g.activeBorder}` : '1px solid transparent',
                  background: isActive ? g.activeBg : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#ffffff' : '#475569',
                  fontSize: 12, fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isActive ? `0 0 10px ${g.activeGlow}` : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Current Active Subgear (D1, D2, P, R, N) */}
        <div style={{
          fontSize: 11, fontWeight: '900', letterSpacing: '0.06em',
          color: activeMode === 'D' ? '#38bdf8' : activeMode === 'R' ? '#ef4444' : activeMode === 'P' ? '#f59e0b' : '#94a3b8'
        }}>
          {activeMode === 'D' ? subGearDisplay : activeMode === 'R' ? 'R (LÙI)' : activeMode === 'P' ? 'P (ĐỖ)' : 'N (MO)'}
        </div>
      </div>

      {/* ── 5. Authentic Tell-Tale Indicators Row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2px'
      }}>
        {/* 🔴 Seat Belt Icon / Button */}
        <div
          onClick={onToggleSeatBelt}
          title={seatBeltFastened ? 'Dây an toàn: ĐÃ THẮT (Bấm B để tháo)' : 'Dây an toàn: CHƯA THẮT! (Bấm B để thắt)'}
          style={{
            display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer',
            padding: '1px 5px', borderRadius: 3,
            background: !seatBeltFastened ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.12)',
            border: !seatBeltFastened ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(16, 185, 129, 0.3)',
            color: !seatBeltFastened ? '#ef4444' : '#10b981',
            fontSize: 9, fontWeight: '800'
          }}
        >
          <span style={{ fontSize: 8 }}>{!seatBeltFastened ? '🔴' : '🟢'}</span>
          <span>{seatBeltFastened ? 'B OK' : 'B THẮT'}</span>
        </div>

        {/* 🔴 Handbrake Tell-tale (P) */}
        <div
          title={handbrake ? 'Phanh tay đang bật (Space / P)' : 'Phanh tay đã nhả'}
          style={{
            fontSize: 9, fontWeight: '900', padding: '1px 5px', borderRadius: 3,
            color: handbrake ? '#ef4444' : 'rgba(255, 255, 255, 0.18)',
            background: handbrake ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            border: handbrake ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid transparent',
            letterSpacing: '0.04em'
          }}
        >
          (P)
        </div>

        {/* 🟡 Lane Assist Icon */}
        <div
          title={laneWarning ? 'Cảnh báo lệch làn đường / đè vạch!' : 'Hỗ trợ giữ làn đường (Lane Assist)'}
          style={{
            display: 'flex', alignItems: 'center',
            padding: '1px 5px', borderRadius: 3,
            background: laneWarning ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
            border: laneWarning ? '1px solid #f59e0b' : '1px solid transparent',
            color: laneWarning ? '#f59e0b' : 'rgba(255, 255, 255, 0.18)',
            fontSize: 9, fontWeight: '800'
          }}
        >
          <span style={{ marginRight: 2 }}>{laneWarning ? '🟠' : ''}</span>
          <span>LANE</span>
        </div>

        {/* 🔵 High Beam Icon */}
        <div
          title={headlights ? 'Đèn chiếu xa (High Beam) đang bật (Phím L)' : 'Đèn xe đang tắt (Phím L)'}
          style={{
            display: 'flex', alignItems: 'center',
            padding: '1px 5px', borderRadius: 3,
            background: headlights ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            border: headlights ? '1px solid #38bdf8' : '1px solid transparent',
            color: headlights ? '#38bdf8' : 'rgba(255, 255, 255, 0.18)',
            fontSize: 9, fontWeight: '800'
          }}
        >
          <span style={{ marginRight: 2 }}>{headlights ? '🔵' : ''}</span>
          <span>BEAM</span>
        </div>
      </div>

      {/* ── 6. Bottom Information: Trip Distance or Active Violation Alert ── */}
      {activeWarning ? (
        <div className="sim-cluster-warning" style={{
          background: 'rgba(239, 68, 68, 0.22)',
          border: '1px solid rgba(239, 68, 68, 0.55)',
          borderRadius: 4,
          padding: '3px 6px',
          textAlign: 'center',
          fontSize: 9, fontWeight: '800',
          color: '#fca5a5',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {activeWarning}
        </div>
      ) : (
        <div className="sim-cluster-trip" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2px', fontSize: 9, color: '#64748b', fontWeight: '700',
          letterSpacing: '0.04em', fontFamily: 'monospace'
        }}>
          <span>TRIP</span>
          <span>{(distanceTraveled / 1000).toFixed(1)} KM</span>
        </div>
      )}
    </div>
  );
};

// ── Automatic Transmission Gear Shifter Widget (Cần số tự động P - R - N - D) ───────
export const AutomaticTransmissionWidget = ({
  gear = 'P',
  onSelectGear,
  speed = 0
}) => {
  const activeMode = gear.startsWith('D') ? 'D' : (gear === 'R' ? 'R' : gear === 'N' ? 'N' : 'P');
  const subGear = gear.startsWith('D') ? gear : (activeMode === 'D' ? 'D1' : '');

  const gears = [
    { id: 'P', label: 'P', name: 'Đỗ xe', shortcut: 'P / 1', activeColor: '#EF4444', desc: 'Parken' },
    { id: 'R', label: 'R', name: 'Số lùi', shortcut: 'R / 2', activeColor: '#F97316', desc: 'Rückwärts' },
    { id: 'N', label: 'N', name: 'Số Mo', shortcut: 'N / 3', activeColor: '#EAB308', desc: 'Neutral' },
    { id: 'D', label: 'D', name: 'Số tiến', shortcut: 'D / 4', activeColor: '#38BDF8', desc: 'Drive' }
  ];

  return (
    <div style={{
      position: 'absolute', bottom: 154, right: 24, zIndex: 30,
      background: 'rgba(15, 23, 42, 0.94)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: 10, padding: '6px 10px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.2)',
      backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column', gap: 6,
      pointerEvents: 'auto', userSelect: 'none'
    }}>
      {/* Top Header / Mode Title */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 4
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: '0.05em' }}>
          <span>HỘP SỐ TỰ ĐỘNG (AUTOMATIK)</span>
        </div>
        {activeMode === 'D' && (
          <div
            key={subGear}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#FFFFFF',
              fontSize: 10, fontWeight: '900',
              padding: '1px 7px', borderRadius: 4,
              boxShadow: '0 0 10px rgba(56,189,248,0.5)',
              animation: 'shiftPulse 0.35s ease-out'
            }}
          >
            CẤP SỐ {subGear}
          </div>
        )}
      </div>

      {/* PRND Selector Buttons Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {gears.map((g) => {
          const isActive = activeMode === g.id;
          return (
            <button
              key={g.id}
              onClick={() => onSelectGear && onSelectGear(g.id)}
              title={`${g.label} - ${g.name} (${g.desc}). Phím tắt: ${g.shortcut}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: 50, height: 44,
                borderRadius: 7,
                border: isActive ? `1.5px solid ${g.activeColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                background: isActive
                  ? `radial-gradient(circle at center, ${g.activeColor}28 0%, rgba(15,23,42,0.9) 100%)`
                  : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#FFFFFF' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isActive ? `0 0 14px ${g.activeColor}40` : 'none',
                position: 'relative'
              }}
            >
              <div style={{
                fontSize: 16, fontWeight: '900',
                color: isActive ? g.activeColor : '#94A3B8',
                lineHeight: 1
              }}>
                {g.id === 'D' && isActive ? subGear : g.label}
              </div>
              <div style={{ fontSize: 8, fontWeight: '600', color: isActive ? '#E2E8F0' : '#475569', marginTop: 3 }}>
                {g.name}
              </div>
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: 2, width: 14, height: 2,
                  borderRadius: 2, background: g.activeColor,
                  boxShadow: `0 0 6px ${g.activeColor}`
                }} />
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes shiftPulse {
          0% { transform: scale(0.85) translateY(3px); opacity: 0.7; }
          50% { transform: scale(1.15) translateY(-2px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ── Rear Camera Overlay (Rückfahrkamera - Camera lùi căn chuồng) ────────────
export const RearCameraOverlay = () => (
  <div style={{
    position: 'absolute', bottom: 135, right: 24, zIndex: 28,
    width: 200, height: 110, background: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(239, 68, 68, 0.6)', borderRadius: 6,
    overflow: 'hidden', pointerEvents: 'none',
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: 6
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 9, fontWeight: '700', color: '#EF4444', letterSpacing: '0.05em' }}>
        ● REAR CAMERA (R)
      </span>
      <span style={{ fontSize: 8, color: '#94A3B8' }}>PARKTRONIC</span>
    </div>

    {/* Dynamic Parking Guidelines SVG */}
    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none">
        {/* Distance tracks */}
        <path d="M 20 58 L 38 10" stroke="#22c55e" strokeWidth="2" strokeDasharray="3 2" fill="none" />
        <path d="M 80 58 L 62 10" stroke="#22c55e" strokeWidth="2" strokeDasharray="3 2" fill="none" />
        {/* Horizontal guide marks */}
        <line x1="26" y1="44" x2="74" y2="44" stroke="#22c55e" strokeWidth="1.5" />
        <line x1="32" y1="28" x2="68" y2="28" stroke="#eab308" strokeWidth="1.5" />
        <line x1="38" y1="12" x2="62" y2="12" stroke="#ef4444" strokeWidth="2" />
      </svg>
    </div>

    <div style={{ fontSize: 8, color: '#CBD5E1', textAlign: 'center' }}>
      Căn vạch đỏ ≤ 0.5m | Vạch vàng ≤ 1.0m
    </div>
  </div>
);

// ── Exam Score & Event Log HUD ──────────────────────────────────────────────
export const ScoreHUD = ({ score, events, scenarioIdx, totalScenarios }) => (
  <div className="sim-score-hud" style={{
    position: 'absolute', top: 16, right: 24, zIndex: 20,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
    pointerEvents: 'none', fontFamily: "'Inter', sans-serif"
  }}>
    <div className="sim-score-box" style={{
      background: '#151515', border: '1px solid #292929',
      borderRadius: 6, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 14
    }}>
      <div className="sim-score-scenario">
        <div style={{ color: '#8A8A8A', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          SZENARIO
        </div>
        <div style={{ color: '#E5E5E5', fontSize: 12, fontWeight: '600' }}>
          {Math.min(scenarioIdx + 1, totalScenarios)} / {totalScenarios}
        </div>
      </div>
      <div className="sim-score-divider" style={{ width: 1, height: 24, background: '#292929' }} />
      <div className="sim-score-points">
        <div className="sim-score-points-label" style={{ color: '#8A8A8A', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          PUNKTE
        </div>
        <div className="sim-score-points-val" style={{
          color: score >= 70 ? '#22C55E' : score >= 40 ? '#CA8A04' : '#DC2626',
          fontSize: 16, fontWeight: '700', fontFamily: 'monospace'
        }}>
          {score} / 100
        </div>
      </div>
    </div>

    {/* Clean Event Log */}
    <div className="sim-score-events" style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 280 }}>
      {events.slice(-2).map((ev, i) => (
        <div key={i} style={{
          background: '#151515',
          borderLeft: `3px solid ${ev.passed ? '#22C55E' : '#DC2626'}`,
          borderTop: '1px solid #292929', borderRight: '1px solid #292929', borderBottom: '1px solid #292929',
          borderRadius: 4, padding: '4px 8px', fontSize: 11,
          color: ev.passed ? '#E5E5E5' : '#FCA5A5'
        }}>
          {ev.msg.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')}
        </div>
      ))}
    </div>
  </div>
);

// ── Fahrprüfer Examiner Dialog Panel ───────────────────────────────────────
export const ExaminerPanel = ({ scenario }) => {
  return (
    <div className="sim-examiner-panel" style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 25,
      background: '#151515', border: '1px solid #292929',
      borderRadius: 6, padding: '8px 16px', maxWidth: 460, width: '85%',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="sim-examiner-badge" style={{
          width: 28, height: 28, borderRadius: 4, background: '#2563EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: '700', fontSize: 12, flexShrink: 0
        }}>
          DE
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sim-examiner-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#8A8A8A', fontWeight: '600', fontSize: 10, textTransform: 'uppercase' }}>
              FAHRPRÜFER ANWEISUNG
            </span>
          </div>
          <div className="sim-examiner-text" style={{ color: '#E5E5E5', fontWeight: '500', fontSize: 12, marginTop: 2 }}>
            {scenario ? scenario.warn : 'Stadtfahrt: Verkehrsregeln und Vorfahrtsregeln beachten.'}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Smart Panoramic Rearview Mirror (Gương Chiếu Hậu Điện Tử Toàn Cảnh) ────────
export const SmartRearviewMirror = ({
  onClose,
  isReverse = false,
  steer = 0,
  speed = 0,
  trafficBehind = null,
  mirrorConfig = { yaw: 0, pitch: 0, target: 'center' },
  onAdjustMirror,
  onSelectMirror,
  onResetMirror
}) => {
  const [showAdjuster, setShowAdjuster] = React.useState(false);
  const yaw = mirrorConfig?.yaw || 0;
  const pitch = mirrorConfig?.pitch || 0;
  const target = mirrorConfig?.target || 'center';

  return (
    <div className="sim-rear-mirror" style={{
      position: 'absolute', top: 76, left: '50%', transform: 'translateX(-50%)', zIndex: 32,
      width: 320,
      background: 'transparent',
      borderRadius: '12px 12px 18px 18px',
      border: isReverse ? '2px solid rgba(239, 68, 68, 0.8)' : '2px solid rgba(56, 189, 248, 0.6)',
      boxShadow: isReverse ? '0 12px 36px rgba(0,0,0,0.85), 0 0 16px rgba(239,68,68,0.3)' : '0 12px 36px rgba(0,0,0,0.85), 0 0 16px rgba(56,189,248,0.25)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column'
    }}>
      {/* Top Mirror Header */}
      <div style={{
        height: 22, background: isReverse ? 'rgba(30,10,10,0.96)' : 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px',
        fontSize: 10, fontWeight: '800', letterSpacing: '0.04em'
      }}>
        <div style={{ color: isReverse ? '#f87171' : '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: isReverse ? '#ef4444' : '#10b981', display: 'inline-block' }} />
          <span>
            {isReverse ? 'CAMERA LÙI (RÜCKFAHRKAMERA)' : (target === 'left' ? 'GƯƠNG TRÁI (LINKS)' : target === 'right' ? 'GƯƠNG PHẢI (RECHTS)' : 'GƯƠNG TRONG (INNENSPIEGEL)')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowAdjuster(!showAdjuster)}
            title="Bật/Tắt bảng chỉnh góc gương chiếu hậu"
            style={{
              background: showAdjuster ? '#0284c7' : 'rgba(56,189,248,0.15)',
              border: '1px solid rgba(56,189,248,0.4)',
              color: showAdjuster ? '#ffffff' : '#38bdf8',
              borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: '700',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3
            }}
          >
            Chỉnh Gương
          </button>
          {onClose && (
            <button onClick={onClose} title="Ẩn gương (Phím M)" style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 11, padding: 0 }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Mirror Viewport Canvas / Display (kết nối khung hình 3D camera sau) */}
      <div style={{
        width: '100%', height: 78, position: 'relative', overflow: 'hidden',
        background: 'transparent'
      }}>
        {/* Distance Safety Guidelines & Markings (vẽ đè trực tiếp lên camera 3D) */}
        <svg width="100%" height="100%" viewBox="0 0 320 78" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          {/* Đường chân trời */}
          <line x1="0" y1="36" x2="320" y2="36" stroke="rgba(125,211,252,0.3)" strokeWidth="0.8" strokeDasharray="4 4" />

          {/* Vạch khoảng cách an toàn 5m, 15m, 30m */}
          <line x1="110" y1="68" x2="210" y2="68" stroke="#ef4444" strokeWidth="1.5" opacity="0.85" />
          <text x="214" y="70" fill="#ef4444" fontSize="7" fontWeight="bold">5m</text>

          <line x1="125" y1="54" x2="195" y2="54" stroke="#eab308" strokeWidth="1.5" opacity="0.85" />
          <text x="199" y="56" fill="#eab308" fontSize="7" fontWeight="bold">15m</text>

          <line x1="140" y1="42" x2="180" y2="42" stroke="#22c55e" strokeWidth="1.5" opacity="0.85" />
          <text x="184" y="44" fill="#22c55e" fontSize="7" fontWeight="bold">30m</text>

          {/* Vạch dẫn hướng thân xe */}
          <line x1="145" y1="36" x2="35" y2="78" stroke="rgba(245,158,11,0.6)" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1="175" y1="36" x2="285" y2="78" stroke="rgba(245,158,11,0.6)" strokeWidth="1.5" strokeDasharray="4 3" />
        </svg>

        {/* Cảnh báo xe bám đuôi gần */}
        {trafficBehind && (
          <div style={{
            position: 'absolute', bottom: 4, left: 6, background: 'rgba(239, 68, 68, 0.92)',
            color: 'white', fontSize: 8, fontWeight: '800', padding: '1px 5px', borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 3
          }}>
            ⚠️ XE SAU: {trafficBehind}m
          </div>
        )}

        {/* Góc chỉnh gương hiện tại */}
        <div style={{
          position: 'absolute', top: 4, right: 6, background: 'rgba(15, 23, 42, 0.75)',
          color: '#94a3b8', fontSize: 8, fontWeight: '700', padding: '1px 5px', borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {yaw !== 0 || pitch !== 0 ? `Y: ${yaw > 0 ? '+' : ''}${yaw}° | P: ${pitch > 0 ? '+' : ''}${pitch}°` : 'Góc Chuẩn'}
        </div>

        {/* Optical Glass Sheen Reflection */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.01) 35%, rgba(56,189,248,0.04) 100%)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Bảng nút bấm chỉnh gương (Interactive D-Pad & Selector) */}
      {showAdjuster && (
        <div style={{
          background: 'rgba(15,23,42,0.98)', borderTop: '1px solid rgba(56,189,248,0.35)',
          padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8
        }}>
          {/* Tabs chọn gương: Trái, Giữa, Phải */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'left', label: '◀️ Gương Trái' },
              { id: 'center', label: '🪞 Gương Trong' },
              { id: 'right', label: 'Gương Phải ▶️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => onSelectMirror && onSelectMirror(tab.id)}
                style={{
                  flex: 1, padding: '3px 0', fontSize: 9, fontWeight: '800', borderRadius: 6,
                  background: target === tab.id ? '#0284c7' : 'rgba(255,255,255,0.06)',
                  color: target === tab.id ? '#ffffff' : '#94a3b8',
                  border: target === tab.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cụm nút điều hướng D-Pad */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <button
                onClick={() => onAdjustMirror && onAdjustMirror('pitch', 2)}
                title="Nghiêng gương lên (Tilt Up)"
                style={dPadBtnStyle}
              >
                ▲
              </button>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => onAdjustMirror && onAdjustMirror('yaw', -2)}
                  title="Quay gương sang trái (Pan Left)"
                  style={dPadBtnStyle}
                >
                  ◀
                </button>
                <button
                  onClick={() => onResetMirror && onResetMirror()}
                  title="Đặt lại góc gương chuẩn (Reset 0°)"
                  style={{ ...dPadBtnStyle, background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}
                >
                  ↺
                </button>
                <button
                  onClick={() => onAdjustMirror && onAdjustMirror('yaw', 2)}
                  title="Quay gương sang phải (Pan Right)"
                  style={dPadBtnStyle}
                >
                  ▶
                </button>
              </div>
              <button
                onClick={() => onAdjustMirror && onAdjustMirror('pitch', -2)}
                title="Nghiêng gương xuống (Tilt Down)"
                style={dPadBtnStyle}
              >
                ▼
              </button>
            </div>

            {/* Thông số góc và Preset nhanh */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: '800' }}>
                Độ nghiêng: {pitch > 0 ? `+${pitch}°` : `${pitch}°`}
              </div>
              <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: '800' }}>
                Góc xoay: {yaw > 0 ? `+${yaw}°` : `${yaw}°`}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                <button
                  onClick={() => onResetMirror && onResetMirror()}
                  style={presetBtnStyle}
                >
                  Góc Chuẩn
                </button>
                <button
                  onClick={() => {
                    onAdjustMirror && onAdjustMirror('set', { yaw: 0, pitch: -6 });
                  }}
                  title="Hạ thấp góc gương nhìn rõ vệt bánh xe khi lùi"
                  style={presetBtnStyle}
                >
                  Lùi vỉa hè (-6°)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const dPadBtnStyle = {
  width: 24, height: 24, borderRadius: 5,
  background: 'rgba(56,189,248,0.15)',
  border: '1px solid rgba(56,189,248,0.4)',
  color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', fontSize: 10, fontWeight: '900'
};

const presetBtnStyle = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#cbd5e1', fontSize: 9, fontWeight: '700',
  borderRadius: 4, padding: '2px 6px', cursor: 'pointer'
};
