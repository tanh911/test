import React from 'react';
import { Compass } from 'lucide-react';

export const ARNavigationBox = ({ scenario, distanceTraveled }) => {
  const getDirections = () => {
    if (!scenario) return [
      { text: 'THÀNH PHỐ ĐỨC (STADTFAHRT)', active: true, arrow: '🏙️', col: '#10b981' },
      { text: 'GIỮ LÀN & CHÚ Ý NGÃ TƯ', active: false, arrow: '⬆', col: '#64748b' },
    ];
    if (scenario.type === 'STOP_SIGN') return [
      { text: 'NGÃ TƯ: DỪNG HẲN 3 GIÂY (STOP 3s)', active: true, arrow: '🛑', col: '#ef4444' },
      { text: 'SCHULTERBLICK ĐỂ QUAN SÁT', active: true, arrow: '👀', col: '#f59e0b' },
    ];
    if (scenario.type === 'TRAFFIC_LIGHT') return [
      { text: 'ĐÈN GIAO THÔNG ĐÔ THỊ (AMPEL)', active: true, arrow: '🚦', col: '#f59e0b' },
      { text: 'DỪNG TRƯỚC VẠCH VÀNG/ĐỎ', active: false, arrow: '⬆', col: '#64748b' },
    ];
    if (scenario.type === 'PEDESTRIAN_CROSSING') return [
      { text: 'VẠCH ĐI BỘ NGUY HIỂM', active: true, arrow: '🚶', col: '#3b82f6' },
      { text: 'GIẢM TỐC & NHƯỜNG ĐƯỜNG', active: true, arrow: '⚠️', col: '#f59e0b' },
    ];
    if (scenario.type === 'SPEED_LIMIT') return [
      { text: `KHU VỰC ${scenario.limit} KM/H`, active: true, arrow: '📉', col: '#f59e0b' },
      { text: 'CHÚ Ý BIỂN BÁO ĐÔ THỊ', active: true, arrow: '🏙️', col: '#10b981' },
    ];
    return [
      { text: 'ĐƯỜNG CAO TỐC (AUTOBAHN)', active: true, arrow: '🛣️', col: '#10b981' },
      { text: 'GIỮ VẬN TỐC QUY ĐỊNH', active: false, arrow: '⬆', col: '#64748b' },
    ];
  };

  const navList = getDirections();

  return (
    <div style={{
      position: 'absolute', top: 16, left: 68, zIndex: 25,
      display: 'flex', flexDirection: 'column', gap: 6,
      pointerEvents: 'none', userSelect: 'none', filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.8))'
    }}>
      <div style={{
        background: 'rgba(9, 9, 11, 0.92)', border: '1.5px solid rgba(56, 189, 248, 0.6)',
        borderRadius: 14, padding: '8px 14px', width: 250, backdropFilter: 'blur(14px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 4, mb: 6 }}>
          <span style={{ color: '#38bdf8', fontSize: 10, fontWeight: '900', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Compass size={12} color="#38bdf8" /> GPS MERCEDES-BENZ GLS 580
          </span>
          <span style={{ fontSize: 9, color: '#10b981', background: 'rgba(16,185,129,0.2)', padding: '1px 6px', borderRadius: 4, fontWeight: '800' }}>
            ONLINE
          </span>
        </div>
        {navList.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 10px', borderRadius: 6, marginBottom: 4,
              background: item.active ? 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.3))' : 'rgba(255,255,255,0.04)',
              border: item.active ? '1px solid #10b981' : '1px solid transparent',
              color: item.active ? '#34d399' : '#94a3b8',
              fontWeight: '800', fontSize: 11, letterSpacing: '0.04em'
            }}
          >
            <span>{item.arrow} &nbsp; {item.text}</span>
          </div>
        ))}
        <div style={{ color: '#38bdf8', fontSize: 10, fontWeight: '800', fontFamily: 'monospace', textAlign: 'right', marginTop: 2 }}>
          📍 Đã đi: {Math.round(distanceTraveled)}m
        </div>
      </div>
    </div>
  );
};
