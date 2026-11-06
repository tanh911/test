import { AlertTriangle, Camera, Car, CloudRain, Compass, Eye, Gauge, Lightbulb, Map, Moon, ShieldCheck, Sliders, Sun, Trash2, Volume2, VolumeX } from 'lucide-react';

// tách từ DrivingSimulation.jsx (refactor phase A3)


export const SimOptionsMenu = ({ cameraMode, currentMapId, customMapData, graphicsQuality, handleClearCustomMap, handleFlyToCoords, handleJumpToScenario, hazard, headlights, isAudioMuted, navigate, refs, scenarioIdx, seatBelt, setCameraMode, setFlyX, setFlyZ, setIsAudioMuted, setIsDriving, setShowBerlinOverviewMap, setShowFlyModal, setShowMinimap, setShowOptionsMenu, setShowTouchControls, setWeatherMode, showMinimap, showOptionsMenu, showRearMirror, showTouchControls, toggleGraphicsQuality, toggleHazard, toggleHeadlights, toggleRearMirror, toggleSeatBelt, weatherMode }) => (
showOptionsMenu && (
  <div className="sim-options-overlay" style={{
    position: 'absolute', inset: 0, zIndex: 1500,
    background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
  }}>
    <div className="sim-options-card" style={{
      background: '#0f172a', border: '1.5px solid #334155', borderRadius: 20,
      maxWidth: 620, width: '100%', maxHeight: '90vh', overflowY: 'auto',
      padding: 24, boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
      color: '#f8fafc', fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⚙️</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: '800', color: '#f8fafc' }}>
              Cài Đặt & Tùy Chọn Mô Phỏng
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#94a3b8' }}>
              Tùy chỉnh góc nhìn, thời tiết, thiết bị xe và chọn bài tập
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowOptionsMenu(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.08)', border: 'none',
            borderRadius: 8, width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#cbd5e1',
            cursor: 'pointer', fontSize: 16, fontWeight: '700'
          }}
        >
          ✕
        </button>
      </div>

      {/* Content Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 1. Góc nhìn Camera */}
        <div>
          <label style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Camera size={14} color="#38bdf8" /> Góc Nhìn Lái Xe (Camera)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { id: 'cockpit', label: 'Trong Buồng Lái', icon: <Eye size={18} />, sub: 'Chân thực nhất' },
              { id: 'chase', label: 'Góc Nhìn Sau Xe', icon: <Car size={18} />, sub: 'Bao quát đường' },
              { id: 'hood', label: 'Nắp Capo', icon: <Compass size={18} />, sub: 'Tầm nhìn thoáng' }
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setCameraMode(c.id)}
                style={{
                  background: cameraMode === c.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: cameraMode === c.id ? '2px solid #38bdf8' : '1px solid #334155',
                  borderRadius: 10, padding: '10px 8px', color: '#f8fafc', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</span>
                <span style={{ fontSize: 12, fontWeight: '700' }}>{c.label}</span>
                <span style={{ fontSize: 9, color: cameraMode === c.id ? '#7dd3fc' : '#64748b' }}>{c.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Thời tiết & Môi trường */}
        <div>
          <label style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sun size={14} color="#f59e0b" /> Thời Tiết & Ánh Sáng
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { id: 'day', label: 'Ban Ngày', icon: <Sun size={15} color="#f59e0b" /> },
              { id: 'night', label: 'Ban Đêm', icon: <Moon size={15} color="#38bdf8" /> },
              { id: 'rain', label: 'Trời Mưa', icon: <CloudRain size={15} color="#60a5fa" /> }
            ].map(w => (
              <button
                key={w.id}
                onClick={() => {
                  audioEngine.playLightSwitch();
                  setWeatherMode(w.id);
                  refs.current.weatherMode = w.id;
                }}
                style={{
                  background: weatherMode === w.id ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: weatherMode === w.id ? '2px solid #f59e0b' : '1px solid #334155',
                  borderRadius: 10, padding: '8px 10px', color: '#f8fafc', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontSize: 12, fontWeight: '700'
                }}
              >
                {w.icon}
                <span>{w.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Thiết bị trên xe */}
        <div>
          <label style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sliders size={14} color="#38bdf8" /> Thiết Bị & Tiện Ích Xe
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            <button
              onClick={toggleHeadlights}
              style={{
                background: headlights ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: headlights ? '1.5px solid #38bdf8' : '1px solid #334155',
                borderRadius: 8, padding: '8px', color: '#f8fafc', cursor: 'pointer',
                fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Lightbulb size={13} color={headlights ? '#38bdf8' : '#94a3b8'} /> Đèn xe: {headlights ? 'BẬT' : 'TẮT'}
            </button>

            <button
              onClick={toggleHazard}
              style={{
                background: hazard ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: hazard ? '1.5px solid #ef4444' : '1px solid #334155',
                borderRadius: 8, padding: '8px', color: '#f8fafc', cursor: 'pointer',
                fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <AlertTriangle size={13} color={hazard ? '#ef4444' : '#94a3b8'} /> Khẩn cấp (H): {hazard ? 'BẬT' : 'TẮT'}
            </button>

            <button
              onClick={() => audioEngine.playHorn()}
              style={{
                background: 'rgba(255, 255, 255, 0.04)', border: '1px solid #334155',
                borderRadius: 8, padding: '8px', color: '#f8fafc', cursor: 'pointer',
                fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Volume2 size={13} color="#94a3b8" /> Bấm Còi (K)
            </button>

            <button
              onClick={toggleSeatBelt}
              style={{
                background: seatBelt ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: seatBelt ? '1.5px solid #10b981' : '1.5px solid #ef4444',
                borderRadius: 8, padding: '8px', color: '#f8fafc', cursor: 'pointer',
                fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <ShieldCheck size={13} color={seatBelt ? '#10b981' : '#ef4444'} /> {seatBelt ? 'Dây: ĐÃ THẮT' : 'Dây: CHƯA THẮT'}
            </button>

            <button
              onClick={toggleRearMirror}
              style={{
                background: showRearMirror ? 'rgba(14, 165, 233, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                border: showRearMirror ? '1.5px solid #38bdf8' : '1px solid #334155',
                borderRadius: 8, padding: '8px', color: '#f8fafc', cursor: 'pointer',
                fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Eye size={13} color={showRearMirror ? '#38bdf8' : '#94a3b8'} /> Gương hậu: {showRearMirror ? 'BẬT' : 'TẮT'}
            </button>

            <button
              onClick={() => setShowMinimap(prev => !prev)}
              style={{
                background: showMinimap ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: showMinimap ? '1.5px solid #38bdf8' : '1px solid #334155',
                borderRadius: 8, padding: '8px', color: '#f8fafc', cursor: 'pointer',
                fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Map size={13} color={showMinimap ? '#38bdf8' : '#94a3b8'} /> Bản đồ radar: {showMinimap ? 'BẬT' : 'TẮT'}
            </button>

            <button
              onClick={() => {
                setShowBerlinOverviewMap(true);
                setShowOptionsMenu(false);
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%)',
                border: '1.5px solid #38bdf8',
                borderRadius: 8, padding: '8px', color: '#38bdf8', cursor: 'pointer',
                fontSize: 11, fontWeight: '800', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Compass size={13} color="#38bdf8" /> Bản đồ tổng thể 2D Berlin (M)
            </button>

            <button
              onClick={() => setShowTouchControls(prev => !prev)}
              title="Bật/Tắt các nút bấm ga, phanh và đánh lái ảo trên màn hình"
              style={{
                background: showTouchControls ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: showTouchControls ? '1.5px solid #38bdf8' : '1px solid #334155',
                borderRadius: 8, padding: '8px', color: '#f8fafc', cursor: 'pointer',
                fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Sliders size={13} color={showTouchControls ? '#38bdf8' : '#94a3b8'} /> Phím ảo ga/lái: {showTouchControls ? 'BẬT' : 'TẮT'}
            </button>
          </div>
        </div>

        {/* 4. Chọn bài tập / chặng đường nhanh & Bay tự do */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Compass size={14} color="#38bdf8" /> {(currentMapId === 'stadt_zentrum' || currentMapId === 'STADT' || currentMapId === 'stadt') ? 'Chuyển Nhanh 7 Phân Khu Berlin-Mitte' : (currentMapId || '').toLowerCase().includes('autobahn') ? 'Chuyển Nhanh Tọa Độ Autobahn A2' : 'Chọn Nhanh Bài Thi StVO Đức'}
            </label>
            <button
              onClick={() => {
                setFlyX(Math.round(refs.current?.carX || 0));
                setFlyZ(Math.round(-(refs.current?.carZ || 0)));
                setShowFlyModal(true);
                setShowOptionsMenu(false);
              }}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                border: 'none', borderRadius: 6, padding: '4px 10px', color: '#ffffff',
                fontSize: 11, fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
              }}
            >
              🚀 Bay Đến Tọa Độ Bất Kỳ
            </button>
          </div>

          {(currentMapId === 'stadt_zentrum' || currentMapId === 'STADT' || currentMapId === 'stadt') ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
              {BERLIN_MITTE_ZONES.filter(z => z.number > 0).map(st => (
                <button
                  key={st.id}
                  onClick={() => {
                    if (refs.current && st.teleport) {
                      handleFlyToCoords(st.teleport.x, st.teleport.z);
                      refs.current.heading = st.teleport.rot;
                    }
                    setShowOptionsMenu(false);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${st.color}55`,
                    borderRadius: 8, padding: '8px 10px', color: '#f8fafc',
                    fontSize: 11, fontWeight: '700', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 2
                  }}
                >
                  <span style={{ color: st.color }}>{st.nameVi}</span>
                  <span style={{ fontSize: 9, color: '#94a3b8' }}>{st.nameDe}</span>
                </button>
              ))}
            </div>
          ) : (currentMapId || '').toLowerCase().includes('autobahn') ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
              {[
                { nameVi: '🏁 Spawn Trục Chính A2 (L1)', x: 1457.5, z: -21.3, color: '#38bdf8' },
                { nameVi: '🛣️ Auffahrt Rhynern (Nhập Làn)', x: 488, z: -589, color: '#22c55e' },
                { nameVi: '⛽ Raststätte Rhynern', x: -303, z: -1061, color: '#eab308' },
                { nameVi: '🌉 Kreuz Werl (Nút Giao)', x: -1800, z: -1400, color: '#f97316' },
                { nameVi: '🏎️ Đoạn Tốc Độ Cao', x: 2400, z: 600, color: '#a855f7' },
                { nameVi: '🔚 Ausfahrt Hamm (Xuất Ra)', x: -1918, z: -1560, color: '#ec4899' }
              ].map((pt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleFlyToCoords(pt.x, pt.z);
                    setShowOptionsMenu(false);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${pt.color}55`,
                    borderRadius: 8, padding: '8px 10px', color: '#f8fafc',
                    fontSize: 11, fontWeight: '700', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 2
                  }}
                >
                  <span style={{ color: pt.color }}>{pt.nameVi}</span>
                  <span style={{ fontSize: 9, color: '#94a3b8' }}>X: {pt.x} · Z: {pt.z}m</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 6, maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
              {(refs.current?.currentScenarios || []).map((sc, i) => (
                <button
                  key={sc.id || i}
                  onClick={() => {
                    handleJumpToScenario(i);
                    setShowOptionsMenu(false);
                  }}
                  style={{
                    background: scenarioIdx === i ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    border: scenarioIdx === i ? '1.5px solid #38bdf8' : '1px solid #1e293b',
                    borderRadius: 6, padding: '6px 8px', color: scenarioIdx === i ? '#38bdf8' : '#cbd5e1',
                    fontSize: 11, fontWeight: '700', textAlign: 'left', cursor: 'pointer',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}
                >
                  Bài {i + 1}: {sc.type || sc.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. Hiệu năng, Âm thanh & Bản đồ nâng cao */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 6, borderTop: '1px solid #1e293b' }}>
          <button
            onClick={toggleGraphicsQuality}
            style={{
              background: 'rgba(255, 255, 255, 0.04)', border: '1px solid #334155',
              borderRadius: 8, padding: '8px 12px', color: '#f8fafc', cursor: 'pointer',
              fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <Gauge size={13} color="#38bdf8" /> Đồ họa: {graphicsQuality === 'performance' ? 'Siêu nhẹ (Mobile 60 FPS)' : graphicsQuality === 'ultra' ? 'Cao' : 'Cân bằng'}
          </button>

          <button
            onClick={() => {
              const nextMute = !isAudioMuted;
              audioEngine.setMuted(nextMute);
              setIsAudioMuted(nextMute);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.04)', border: '1px solid #334155',
              borderRadius: 8, padding: '8px 12px', color: '#f8fafc', cursor: 'pointer',
              fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {isAudioMuted ? <VolumeX size={13} color="#ef4444" /> : <Volume2 size={13} color="#22c55e" />}
            Âm thanh: {isAudioMuted ? 'ĐÃ TẮT' : 'BẬT'}
          </button>

          <button
            onClick={() => {
              setShowOptionsMenu(false);
              navigate('/map-editor');
            }}
            style={{
              background: 'rgba(37, 99, 235, 0.15)', border: '1px solid #2563eb',
              borderRadius: 8, padding: '8px 12px', color: '#60a5fa', cursor: 'pointer',
              fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <Map size={13} /> Thiết Kế Map Editor ↗
          </button>

          {customMapData && (
            <button
              onClick={handleClearCustomMap}
              style={{
                background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444',
                borderRadius: 8, padding: '8px 12px', color: '#fca5a5', cursor: 'pointer',
                fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Trash2 size={13} /> Xóa Map Custom
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={() => setShowOptionsMenu(false)}
            style={{
              flex: 1, padding: '12px', borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: 'none', color: '#ffffff', fontSize: 13, fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            ✕ Đóng & Tiếp Tục Lái
          </button>
          <button
            onClick={() => {
              setShowOptionsMenu(false);
              audioEngine.init();
              setIsDriving(false);
            }}
            style={{
              padding: '12px 18px', borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444',
              color: '#fca5a5', fontSize: 13, fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Về Menu
          </button>
        </div>
      </div>
    </div>
  </div>
)
);
