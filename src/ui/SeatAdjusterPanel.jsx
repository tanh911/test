import React from 'react';
import { Move, Crosshair, Eye, Sliders, Save, RotateCcw } from 'lucide-react';

export const SeatAdjusterPanel = ({
  showAdjuster,
  setShowAdjuster,
  seatConfig,
  updateConfigField,
  handlePointerDownDrag,
  activeDragTarget,
  saveSeatConfig,
  resetSeatConfig,
  applyPreset,
  isSavedNotice
}) => {
  if (!showAdjuster) return null;

  return (
    <>
      {/* ── Interactive Drag Reticles on Viewport Canvas ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 35, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Reticle Drag Notice */}
        <div style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 23, 42, 0.88)', color: '#38bdf8', padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(56, 189, 248, 0.5)', backdropFilter: 'blur(10px)', fontSize: 12, fontWeight: '800', display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto' }}>
          <Move size={14} className="animate-pulse" color="#10b981" />
          <span>Kéo rê các biểu tượng 🎯 ↕️ 📐 trên màn hình để chỉnh vị trí ngồi trực tiếp!</span>
        </div>

        {/* 2D Seat Reticle Handle (X & Y Dragging) */}
        <div
          onPointerDown={(e) => handlePointerDownDrag('reticleXY', e)}
          title="Kéo rê để chỉnh Trái/Phải (X) và Độ Cao (Y) ghế ngồi"
          style={{
            position: 'absolute',
            left: `${Math.max(12, Math.min(88, 50 + (seatConfig.seatOffsetX / 2.4) * 75))}%`,
            top: `${Math.max(12, Math.min(84, 50 - ((seatConfig.seatOffsetY - 1.16) / 1.5) * 60))}%`,
            transform: 'translate(-50%, -50%)',
            cursor: activeDragTarget === 'reticleXY' ? 'grabbing' : 'grab',
            pointerEvents: 'auto', zIndex: 40,
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: activeDragTarget === 'reticleXY' ? '3px solid #10b981' : '2px dashed #38bdf8', background: activeDragTarget === 'reticleXY' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(56,189,248,0.5)' }}>
            <Crosshair size={22} color={activeDragTarget === 'reticleXY' ? '#fff' : '#38bdf8'} />
          </div>
          <div style={{ background: 'rgba(9, 9, 11, 0.92)', color: '#e2e8f0', fontSize: 10, fontWeight: '800', padding: '3px 8px', borderRadius: 8, marginTop: 4, whiteSpace: 'nowrap', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
            📍 Ghế: X={seatConfig.seatOffsetX}m | Y={seatConfig.seatOffsetY}m
          </div>
        </div>

        {/* Z-Depth Slider Handle */}
        <div
          onPointerDown={(e) => handlePointerDownDrag('reticleZ', e)}
          title="Kéo lên/xuống để chỉnh Tiến/Lùi (Z) ghế ngồi"
          style={{
            position: 'absolute', right: 360,
            top: `${Math.max(15, Math.min(80, 50 - ((seatConfig.seatOffsetZ - (-1.48)) / 2.5) * 50))}%`,
            transform: 'translateY(-50%)',
            cursor: activeDragTarget === 'reticleZ' ? 'grabbing' : 'grab',
            pointerEvents: 'auto', zIndex: 40,
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 12, border: '2px dashed #f59e0b', background: 'rgba(245, 158, 11, 0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Move size={18} color="#fff" style={{ transform: 'rotate(90deg)' }} />
          </div>
          <div style={{ background: 'rgba(9, 9, 11, 0.92)', color: '#fef08a', fontSize: 10, fontWeight: '800', padding: '3px 8px', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.5)' }}>
            ↕️ Tiến/Lùi Z: {seatConfig.seatOffsetZ}m
          </div>
        </div>

        {/* Pitch Tilt Handle */}
        <div
          onPointerDown={(e) => handlePointerDownDrag('reticlePitch', e)}
          title="Kéo lên/xuống để chỉnh Góc Ngẩng/Cúi mắt nhìn"
          style={{
            position: 'absolute', left: 24,
            top: `${Math.max(20, Math.min(80, 50 - (seatConfig.seatPitch / 20) * 40))}%`,
            transform: 'translateY(-50%)',
            cursor: activeDragTarget === 'reticlePitch' ? 'grabbing' : 'grab',
            pointerEvents: 'auto', zIndex: 40,
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 12, border: '2px dashed #a855f7', background: 'rgba(168, 85, 247, 0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={18} color="#fff" />
          </div>
          <div style={{ background: 'rgba(9, 9, 11, 0.92)', color: '#e9d5ff', fontSize: 10, fontWeight: '800', padding: '3px 8px', borderRadius: 8, border: '1px solid rgba(168, 85, 247, 0.5)' }}>
            📐 Cúi/Ngẩng: {seatConfig.seatPitch}°
          </div>
        </div>
      </div>

      {/* ── Floating Fine-Tuning Control Panel ── */}
      <div style={{
        position: 'absolute', top: 68, right: 16, width: 330,
        maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', zIndex: 45,
        background: 'rgba(15, 23, 42, 0.94)', borderRadius: 20,
        border: '1.5px solid rgba(56, 189, 248, 0.4)', color: 'white',
        padding: 16, backdropFilter: 'blur(16px)', boxShadow: '0 20px 50px rgba(0,0,0,0.85)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
          <div style={{ fontWeight: '900', fontSize: 13, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={16} /> 💺 Tùy Chỉnh Vị Trí Ghế & Xe
          </div>
          <button onClick={() => setShowAdjuster(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer', fontWeight: '800' }}>
            ✕
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: '800', marginBottom: 6, textTransform: 'uppercase' }}>
            ⭐ Chế độ ngồi chuẩn định dạng sẵn:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <button onClick={() => applyPreset('german_lhd')} style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.2))', border: '1px solid rgba(56, 189, 248, 0.5)', color: '#7dd3fc', padding: '6px 4px', borderRadius: 10, fontSize: 10, fontWeight: '800', cursor: 'pointer' }}>
              🇩🇪 Chuẩn Đức
            </button>
            <button onClick={() => applyPreset('sports_low')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', padding: '6px 4px', borderRadius: 10, fontSize: 10, fontWeight: '800', cursor: 'pointer' }}>
              🏎️ Ghế Thấp
            </button>
            <button onClick={() => applyPreset('suv_high')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', padding: '6px 4px', borderRadius: 10, fontSize: 10, fontWeight: '800', cursor: 'pointer' }}>
              🚌 Ghế Cao SUV
            </button>
          </div>
        </div>

        {/* Driver Eye Position Sliders */}
        <div style={{ background: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: '800', color: '#f8fafc', marginBottom: 8 }}>
            📍 Vị trí Mắt Tài xế (Driver Seat):
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Ghế Trái/Phải (X):</span>
              <span style={{ color: '#38bdf8', fontWeight: '800' }}>{seatConfig.seatOffsetX}m</span>
            </div>
            <input type="range" min="-1.20" max="1.20" step="0.02" value={seatConfig.seatOffsetX} onChange={(e) => updateConfigField('seatOffsetX', e.target.value)} style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Tầm cao Mắt (Y):</span>
              <span style={{ color: '#38bdf8', fontWeight: '800' }}>{seatConfig.seatOffsetY}m</span>
            </div>
            <input type="range" min="0.90" max="2.30" step="0.02" value={seatConfig.seatOffsetY} onChange={(e) => updateConfigField('seatOffsetY', e.target.value)} style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Độ sâu Tiến/Lùi (Z):</span>
              <span style={{ color: '#f59e0b', fontWeight: '800' }}>{seatConfig.seatOffsetZ}m</span>
            </div>
            <input type="range" min="-3.00" max="-0.50" step="0.02" value={seatConfig.seatOffsetZ} onChange={(e) => updateConfigField('seatOffsetZ', e.target.value)} style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Góc nghiêng mắt (Pitch):</span>
              <span style={{ color: '#a855f7', fontWeight: '800' }}>{seatConfig.seatPitch}°</span>
            </div>
            <input type="range" min="-20.0" max="20.0" step="0.5" value={seatConfig.seatPitch} onChange={(e) => updateConfigField('seatPitch', e.target.value)} style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }} />
          </div>
        </div>

        {/* Steering Wheel Position Sliders */}
        <div style={{ background: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: '800', color: '#f8fafc', marginBottom: 8 }}>
            🎡 Vị trí Vô-lăng (Steering Wheel):
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Độ sâu Vô-lăng (Khoảng cách Z):</span>
              <span style={{ color: '#10b981', fontWeight: '800' }}>{seatConfig.wheelOffsetZ !== undefined ? seatConfig.wheelOffsetZ : -0.72}m</span>
            </div>
            <input type="range" min="-1.40" max="-0.40" step="0.02" value={seatConfig.wheelOffsetZ !== undefined ? seatConfig.wheelOffsetZ : -0.72} onChange={(e) => updateConfigField('wheelOffsetZ', e.target.value)} style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Độ cao Vô-lăng (Y):</span>
              <span style={{ color: '#10b981', fontWeight: '800' }}>{seatConfig.wheelOffsetY !== undefined ? seatConfig.wheelOffsetY : -0.38}m</span>
            </div>
            <input type="range" min="-0.70" max="-0.15" step="0.02" value={seatConfig.wheelOffsetY !== undefined ? seatConfig.wheelOffsetY : -0.38} onChange={(e) => updateConfigField('wheelOffsetY', e.target.value)} style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }} />
          </div>
        </div>

        {/* 3D GLB Model Controls */}
        <div style={{ background: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: '800', color: '#f8fafc', marginBottom: 8 }}>
            🚘 Hiệu Chỉnh Mô Hình 3D (Mercedes GLB):
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#e2e8f0', cursor: 'pointer', marginBottom: 10, background: 'rgba(255,255,255,0.06)', padding: '5px 8px', borderRadius: 8 }}>
            <input type="checkbox" checked={!!seatConfig.showGlbInCockpit} onChange={(e) => updateConfigField('showGlbInCockpit', e.target.checked)} style={{ accentColor: '#38bdf8', cursor: 'pointer' }} />
            <span>Hiện vỏ GLB trong Cabin 1st (Tắt để tránh che mắt)</span>
          </label>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Hướng Xoay Đầu Xe:</span>
              <span style={{ color: '#38bdf8', fontWeight: '800' }}>{seatConfig.glbRotY || 180}°</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4 }}>
              {[{ label: '180° (Tới)', val: 180 }, { label: '0° (Lùi)', val: 0 }, { label: '90° (Trái)', val: 90 }, { label: '-90° (Phải)', val: -90 }].map(b => (
                <button key={b.val} onClick={() => updateConfigField('glbRotY', b.val)} style={{ background: (seatConfig.glbRotY || 180) === b.val ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(255,255,255,0.08)', color: 'white', border: 'none', padding: '4px 2px', borderRadius: 6, fontSize: 9, fontWeight: '800', cursor: 'pointer' }}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Tỷ Lệ Thu Phóng Xe (Scale):</span>
              <span style={{ color: '#38bdf8', fontWeight: '800' }}>{seatConfig.glbScale || 1.0}x</span>
            </div>
            <input type="range" min="0.5" max="2.0" step="0.05" value={seatConfig.glbScale || 1.0} onChange={(e) => updateConfigField('glbScale', e.target.value)} style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Dịch Khung Xe Tiến/Lùi Z:</span>
              <span style={{ color: '#f59e0b', fontWeight: '800' }}>{seatConfig.glbOffsetZ || 0.0}m</span>
            </div>
            <input type="range" min="-2.0" max="2.0" step="0.05" value={seatConfig.glbOffsetZ || 0.0} onChange={(e) => updateConfigField('glbOffsetZ', e.target.value)} style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Dịch Khung Xe Cao/Thấp Y:</span>
              <span style={{ color: '#10b981', fontWeight: '800' }}>{seatConfig.glbOffsetY || 0.0}m</span>
            </div>
            <input type="range" min="-0.8" max="0.8" step="0.02" value={seatConfig.glbOffsetY || 0.0} onChange={(e) => updateConfigField('glbOffsetY', e.target.value)} style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }} />
          </div>

          <div>
            <div style={{ fontSize: 10, color: '#cbd5e1', marginBottom: 4 }}>🎨 Màu Sơn Xe Mercedes:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { name: 'Đen Obsidian', color: '#1e293b' },
                { name: 'Trắng Polar', color: '#f8fafc' },
                { name: 'Bạc AMG', color: '#94a3b8' },
                { name: 'Xanh Emerald', color: '#064e3b' },
                { name: 'Xanh Navy', color: '#1e3a8a' },
                { name: 'Đỏ Crimson', color: '#991b1b' }
              ].map(c => (
                <button key={c.color} onClick={() => updateConfigField('bodyColor', c.color)} title={c.name} style={{ width: 22, height: 22, borderRadius: '50%', background: c.color, border: seatConfig.bodyColor === c.color ? '2.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: '800', color: '#f8fafc', marginBottom: 8 }}>📷 Ống kính & Góc 3rd Person:</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Góc nhìn rộng (FOV):</span>
              <span style={{ color: '#ec4899', fontWeight: '800' }}>{seatConfig.fov}°</span>
            </div>
            <input type="range" min="50" max="90" step="1" value={seatConfig.fov} onChange={(e) => updateConfigField('fov', e.target.value)} style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Chiều cao Camera 3rd (Y):</span>
              <span style={{ color: '#6366f1', fontWeight: '800' }}>{seatConfig.chaseCamY}m</span>
            </div>
            <input type="range" min="1.00" max="4.00" step="0.1" value={seatConfig.chaseCamY} onChange={(e) => updateConfigField('chaseCamY', e.target.value)} style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 2 }}>
              <span>Khoảng cách Camera 3rd (Z):</span>
              <span style={{ color: '#6366f1', fontWeight: '800' }}>{seatConfig.chaseCamZ}m</span>
            </div>
            <input type="range" min="2.00" max="8.00" step="0.1" value={seatConfig.chaseCamZ} onChange={(e) => updateConfigField('chaseCamZ', e.target.value)} style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveSeatConfig} style={{ flex: 1, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: '900', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Save size={14} /> {isSavedNotice ? '✅ Đã Lưu!' : '💾 Lưu Vị Trí'}
          </button>
          <button onClick={resetSeatConfig} style={{ padding: '9px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: '800', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <RotateCcw size={14} /> Đặt lại
          </button>
        </div>
      </div>
    </>
  );
};
