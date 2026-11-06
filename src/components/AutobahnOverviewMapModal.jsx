import React, { useState } from 'react';
import { 
  X, Navigation, MapPin, Gauge, Shield, Flag, 
  Car, Layers, Info, CheckCircle2, ChevronRight, Zap,
  AlertTriangle, Truck, Compass, Activity, ArrowRight
} from 'lucide-react';

export const AUTOBAHN_MILESTONES = [
  {
    id: 'autobahn_start',
    km: 0.0,
    label: '0.0 km',
    titleVi: '1. Xuất Phát Trục Chính A2',
    titleDe: 'Start (0.0 km) · Hauptfahrbahn',
    icon: '🏁',
    color: '#3b82f6',
    teleport: { x: 1457.5, z: -21.3, rot: 2.12 },
    speedLimit: 'Unbegrenzt',
    descVi: 'Bắt đầu hành trình trên cao tốc A2 Hamm/Rhynern với tốc độ khuyến nghị 130 km/h (Richtgeschwindigkeit).',
    descDe: 'Ein Abschnitt der A2 Hamm/Rhynern mit Richtgeschwindigkeit 130 km/h.'
  },
  {
    id: 'autobahn_auffahrt',
    km: 0.3,
    label: '0.3 km',
    titleVi: '2. Làn Tăng Tốc Nhập Làn (Auffahrt)',
    titleDe: 'Auffahrt (0.3 km) · Beschleunigungsstreifen',
    icon: '🏎️',
    color: '#22c55e',
    teleport: { x: 488, z: -589, rot: 2.134 },
    speedLimit: '130 km/h',
    descVi: 'Làn Beschleunigungsstreifen nhường đường cho xe trên cao tốc, nhấn ga đạt tốc độ cao trước khi bật xi-nhan trái nhập làn.',
    descDe: 'Sicheres Einfädeln auf die rechte Fahrbahn über den Beschleunigungsstreifen.'
  },
  {
    id: 'autobahn_kurve',
    km: 1.5,
    label: '1.5 km',
    titleVi: '3. Khúc Cua Tốc Độ Cao (Weitgezogene Kurve)',
    titleDe: 'Kurve (1.5 km) · Radius R=800m',
    icon: '↪️',
    color: '#06b6d4',
    teleport: { x: 1900, z: 240, rot: 2.13 },
    speedLimit: '130 km/h',
    descVi: 'Đoạn đường uốn lượn bán kính lớn R=800m. Quy tắc StVO § 2: Chỉ vượt xe ở làn bên trái (Rechtsüberholverbot).',
    descDe: 'Weitgezogene Kurve mit gleichmäßigem Radius. Überholen nur links.'
  },
  {
    id: 'autobahn_bruecke',
    km: 2.8,
    label: '2.8 km',
    titleVi: '4. Cầu Vượt Qua Đường Tỉnh (Überführung)',
    titleDe: 'Brücke (2.8 km) · Landstraße Überquerung',
    icon: '🌉',
    color: '#8b5cf6',
    teleport: { x: 2400, z: 600, rot: 2.134 },
    speedLimit: 'Unbegrenzt',
    descVi: 'Cao tốc cắt qua tuyến đường tỉnh Landstraße B2 bên dưới. Hai tầng cao độ giao thông riêng biệt.',
    descDe: 'Autobahn überquert eine Landstraße auf unterschiedlichen Höhenebenen.'
  },
  {
    id: 'autobahn_baustelle',
    km: 3.7,
    label: '3.7 km',
    titleVi: '5. Công Trường Thi Công (Baustelle 80 km/h)',
    titleDe: 'Baustelle (3.7 km) · Tempolimit 80 km/h',
    icon: '🚧',
    color: '#f59e0b',
    teleport: { x: -900, z: -1346, rot: 1.99 },
    speedLimit: '80 km/h',
    descVi: 'Bảo trì đường sắt/hộ lan. Vạch sơn màu cam StVO tạm thời, biển VZ 274 giảm tốc độ xuống 80 km/h và gộp làn.',
    descDe: 'Fahrstreifenreduzierung, Vorwarntafeln, angepasste Geschwindigkeit 80 km/h.'
  },
  {
    id: 'autobahn_ausfahrt',
    km: 4.6,
    label: '4.6 km',
    titleVi: '6. Làn Giảm Tốc Rẽ Ra (Ausfahrt)',
    titleDe: 'Ausfahrt (4.6 km) · Ausfädelungsstreifen',
    icon: '↪️',
    color: '#ec4899',
    teleport: { x: -1918, z: -1560, rot: 2.0 },
    speedLimit: '80 km/h',
    descVi: 'Làn Ausfädelungsstreifen bật xi-nhan rẽ ra cao tốc. Giữ nguyên tốc độ khi ở làn chính và chỉ phanh giảm tốc khi đã vào hẳn làn Ausfahrt.',
    descDe: 'Klares Ausfädeln, rechtzeitiger Spurwechsel und Beschilderung VZ 332.'
  },
  {
    id: 'autobahn_raststaette',
    km: 5.2,
    label: '5.2 km',
    titleVi: '7. Trạm Dừng Chân (Raststätte & Tankstelle)',
    titleDe: 'Raststätte (5.2 km) · Tankstelle & WC',
    icon: '⛽',
    color: '#10b981',
    teleport: { x: -303, z: -1061, rot: 2.09 },
    speedLimit: '30 km/h',
    descVi: 'Khu vực trạm xăng, nhà hàng, bãi đỗ đỗ xe nghỉ ngơi. Quy tắc đỗ xe khép kín StVO.',
    descDe: 'Tankstelle, Restaurant, Parkplatz für eine sichere Pause.'
  },
  {
    id: 'autobahn_ende',
    km: 6.0,
    label: '6.0 km',
    titleVi: '8. Kết Thúc Tuyến Cao Tốc A2 (Ende)',
    titleDe: 'Ende (6.0 km) · Autobahnende VZ 330.2',
    icon: '🏁',
    color: '#ef4444',
    teleport: { x: 2850, z: 915, rot: 2.13 },
    speedLimit: '80 km/h',
    descVi: 'Biển VZ 330.2 kết thúc cao tốc. Giảm tốc độ chuẩn bị vào tuyến đường quốc lộ / đường tỉnh tiếp theo.',
    descDe: 'Ende des 6 km Autobahnabschnitts. Geschwindigkeit anpassen.'
  }
];

export const AutobahnOverviewMapModal = React.memo(({
  isOpen,
  onClose,
  playerX = 6790,
  playerZ = -1320,
  heading = 0,
  speed = 0,
  activeZone = null,
  onTeleport = null
}) => {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('autobahn_start');

  if (!isOpen) return null;

  const currentMilestone = AUTOBAHN_MILESTONES.find(m => m.id === selectedMilestoneId) || AUTOBAHN_MILESTONES[0];

  // Map estimated distance (0 to 6 km) based on z coordinate
  const currentKm = Math.min(6.0, Math.max(0.0, ((Math.abs(playerZ - (-1319.93)) / 3720) * 6.0))).toFixed(1);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      background: 'rgba(2, 6, 23, 0.88)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: '100%', maxWidth: '1080px', maxHeight: '92vh',
        background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* HEADER BAR */}
        <div style={{
          padding: '16px 24px', background: 'linear-gradient(90deg, #0b1329 0%, #111c3a 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>🛣️</span>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                Autobahn Simulator – Map Design A2 Hamm/Rhynern
              </h2>
              <span style={{
                background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.5)',
                color: '#60a5fa', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px'
              }}>
                CHÍNH THỨC DE-STVO § 3
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Tuyến cao tốc Autobahn A2 Hamm/Rhynern (bản đồ OSM thật) với đầy đủ tình huống thực tế: Auffahrt, Baustelle 80 km/h, Brücke & Raststätte.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1', width: '36px', height: '36px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* TOP METRICS DASHBOARD */}
        <div style={{
          padding: '12px 24px', background: 'rgba(15, 23, 42, 0.6)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px'
        }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Chiều Dài Route</span>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#38bdf8' }}>A2 Hamm/Rhynern OSM</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Quy Mô Làn Xe</span>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#4ade80' }}>2 Làn + Làn Dừng Khẩn</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Tốc Độ Đề Xuất</span>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fbbf24' }}>Richtgeschwindigkeit 130</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Vị Trí Xe Hiện Tại</span>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#f43f5e' }}>{currentKm} km · {Math.round(speed * 3.6)} km/h</div>
          </div>
        </div>

        {/* MAIN BODY AREA */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. STRECKENVERLAUF (LINEAR PROGRESSION TIMELINE BAR) */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px', padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#cbd5e1', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🗺️ Streckenverlauf – Sơ Đồ Tuyến Cao Tốc (0.0 km → 6.0 km)
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Bấm chọn mốc để xem chi tiết & Teleport</span>
            </div>

            {/* PROGRESSION TIMELINE */}
            <div style={{ position: 'relative', width: '100%', padding: '20px 0' }}>
              {/* Background Track Line */}
              <div style={{
                position: 'absolute', top: '50%', left: '0', right: '0', height: '8px',
                background: 'linear-gradient(90deg, #3b82f6 0%, #22c55e 15%, #06b6d4 30%, #8b5cf6 45%, #f59e0b 60%, #ec4899 75%, #10b981 85%, #ef4444 100%)',
                borderRadius: '4px', transform: 'translateY(-50%)'
              }} />

              {/* Milestone Dots along timeline */}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
                {AUTOBAHN_MILESTONES.map((m) => {
                  const isSelected = selectedMilestoneId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMilestoneId(m.id)}
                      style={{
                        background: isSelected ? m.color : '#0f172a',
                        border: `3px solid ${m.color}`,
                        color: isSelected ? '#ffffff' : m.color,
                        padding: '6px 12px', borderRadius: '20px',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: isSelected ? `0 0 16px ${m.color}` : 'none',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{m.icon}</span>
                      <span style={{ fontSize: '11px', fontWeight: '900' }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. SELECTED MILESTONE CARD DETAILS */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: `1px solid ${currentMilestone.color}`,
            borderRadius: '16px', padding: '20px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '26px' }}>{currentMilestone.icon}</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#f8fafc', margin: 0 }}>
                    {currentMilestone.titleVi}
                  </h3>
                  <div style={{ fontSize: '12px', color: currentMilestone.color, fontWeight: '700' }}>
                    {currentMilestone.titleDe}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', margin: '12px 0 16px 0' }}>
                {currentMilestone.descVi}
              </p>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                "{currentMilestone.descDe}"
              </p>
            </div>

            {/* ACTION & SPECS BOX */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Tốc độ quy định StVO</span>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#fbbf24', marginTop: '4px' }}>
                  {currentMilestone.speedLimit}
                </div>
              </div>

              <button
                onClick={() => {
                  if (onTeleport) {
                    onTeleport(currentMilestone.teleport);
                    onClose();
                  }
                }}
                style={{
                  marginTop: '16px', width: '100%', padding: '12px',
                  background: currentMilestone.color, border: 'none', borderRadius: '10px',
                  color: '#ffffff', fontWeight: '900', fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: `0 4px 14px ${currentMilestone.color}55`
                }}
              >
                <span>⚡ Teleport Tới Mốc Này</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* 3. TECHNICAL CROSS SECTION (QUERSCHNITT DER AUTOBAHN) */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px', padding: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#cbd5e1', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📐 Querschnitt – Mặt Cắt Kỹ Thuật Autobahn Đạt Chuẩn Đức (~28.5 m)
            </h3>

            <div style={{
              background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center'
            }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Lề Khẩn Cấp (Trái)</span>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc', marginTop: '2px' }}>2.5 m Standstreifen</div>
              </div>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <span style={{ fontSize: '11px', color: '#60a5fa' }}>Mặt Đường (Chiều Đi)</span>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#60a5fa', marginTop: '2px' }}>2x 3.75 m Fahrbahn</div>
              </div>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <span style={{ fontSize: '11px', color: '#c084fc' }}>Dải Phân Cách Giữa</span>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#c084fc', marginTop: '2px' }}>~3.0 m Mittelstreifen</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Lề Khẩn Cấp (Phải)</span>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc', marginTop: '2px' }}>2.5 m Standstreifen</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});
