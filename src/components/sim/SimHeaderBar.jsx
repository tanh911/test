import { ArrowLeft, Camera, Compass, Eye, HelpCircle, Map, Navigation, Power, Sliders } from 'lucide-react';

// tách từ DrivingSimulation.jsx (refactor phase A3)

export const SimHeaderBar = ({ activeScenario, authoritativeSpeedLimit, cameraMode, currentMapId, currentZone, gear, handleToggleEngine, isDriving, isEngineRunning, scenarioIdx, score, setIsDriving, setShowAutobahnOverviewMap, setShowBerlinOverviewMap, setShowGuideModal, setShowInGameTutorial, setShowOptionsMenu, showInGameTutorial, showRearMirror, toggleCameraView, toggleRearMirror }) => (
<div className="sim-unified-header" style={{
  position: 'absolute', top: 10, left: 12, right: 12, zIndex: 55,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  background: 'rgba(15, 23, 42, 0.92)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: 14, padding: '6px 12px',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
  fontFamily: "'Inter', sans-serif"
}}>
  {/* Nút Thoát / Menu */}
  <button
    onClick={() => {
      audioEngine.init();
      setIsDriving(false);
    }}
    className="sim-header-btn-exit"
    title="Thoát khỏi bài lái về Menu chính"
    style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: 'rgba(239, 68, 68, 0.18)', border: '1px solid rgba(239, 68, 68, 0.5)',
      color: '#fca5a5', padding: '5px 12px', borderRadius: 8,
      fontSize: 12, fontWeight: '800', cursor: 'pointer', flexShrink: 0,
      whiteSpace: 'nowrap'
    }}
  >
    <ArrowLeft size={15} /> <span>Menu</span>
  </button>

  {/* Hộp Chỉ Dẫn & Nhiệm Vụ Ngắn Gọn */}
  <div className="sim-header-mission" style={{
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
  }}>
    {(() => {
      const isGermanOpenWorld = (currentMapId === 'stadt_zentrum' || currentMapId === 'STADT' || currentMapId === 'stadt');
      const curMapIdLower = (currentMapId || '').toLowerCase();
      const isAutobahnHeader = curMapIdLower.includes('autobahn');
      const isLandHeader = curMapIdLower.includes('land');
      // 🚦 Badge tốc độ = limit TRỌN GÓI từ khối resolve 15Hz (resolver StVO theo làn →
      // examiner → scenario → Richtgeschwindigkeit 130 trên mainline A2): vào phố Rhynern
      // trong map Autobahn sẽ hiện đúng 50, lên A2 hiện 130 khuyến nghị.
      const currentStVOSpeedLimit = authoritativeSpeedLimit || 50;
      const headerTitle = activeScenario?.type
        ? `Bài ${scenarioIdx + 1}: ${activeScenario.type}`
        : isAutobahnHeader
          ? (currentZone?.nameVi || 'Lái Xe Cao Tốc StVO (Autobahn A2)')
          : isLandHeader
            ? (currentZone?.nameVi || 'Lái Xe Đường Tỉnh StVO (Landstraße B2)')
            : curMapIdLower.includes('training')
              ? (currentZone?.nameVi || 'Lộ Trình Tập Lái (Fahrschule Circuit)')
              : isGermanOpenWorld
                ? (currentZone?.nameVi || 'Lộ trình Đức (Stadt ➔ Landstraße ➔ Autobahn)')
                : 'Lái Xe Sa Hình StVO';

      return (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: '800', color: '#38bdf8',
            maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            <Compass size={13} color="#38bdf8" />
            <span>
              {headerTitle}
            </span>
            <div
              title={isAutobahnHeader
                ? 'Richtgeschwindigkeit 130 km/h — tốc độ KHUYẾN NGHỊ trên Autobahn (StVO § 3 Abs. 3 RTL)'
                : `Tốc độ tối đa StVO Zeichen 274: ${currentStVOSpeedLimit} km/h`}
              style={{
                width: 22, height: 22,
                borderRadius: '50%',
                background: '#FFFFFF',
                border: `2.5px solid ${isAutobahnHeader ? '#0284c7' : '#dc2626'}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
                fontSize: 10,
                fontWeight: '900',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                flexShrink: 0
              }}
            >
              {currentStVOSpeedLimit}
            </div>
          </div>
          <div style={{
            fontSize: 11, color: '#cbd5e1', fontWeight: '500',
            maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1
          }}>
            {activeScenario?.warn || (
              isAutobahnHeader
                ? 'Richtgeschwindigkeit 130 — giữ làn phải khi vắng xe, chỉ vượt bên trái, Rettungsgasse khi ùn tắc'
                : isGermanOpenWorld
                ? (currentZone?.tipVi || 'Đi đúng làn đường bên phải (Rechtsfahrgebot) và tuân thủ luật StVO')
                : 'Đi đúng làn đường và tuân thủ các quy tắc lái xe của Đức (StVO)'
            )}
          </div>
        </>
      );
    })()}
  </div>

  {/* Cụm Điểm Số & Nút Tiện Ích */}
  <div className="sim-header-actions" style={{
    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: 8, padding: '4px 8px', fontSize: 12, fontWeight: '800',
      color: score >= 70 ? '#34d399' : '#f87171', whiteSpace: 'nowrap'
    }}>
      <span>⭐</span>
      <span>{score}</span>
      <span style={{ fontSize: 9, color: '#94a3b8' }}>/100</span>
    </div>

    <button
      onClick={handleToggleEngine}
      className="sim-header-util-btn"
      title={isEngineRunning ? "Tắt máy xe (Phím I hoặc Enter)" : "Nổ máy xe 1 chạm để bắt đầu lái (Phím I hoặc Enter)"}
      style={{
        background: isEngineRunning ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
        border: isEngineRunning ? '1.5px solid #22c55e' : '1.5px solid #ef4444',
        color: isEngineRunning ? '#4ade80' : '#fca5a5',
        padding: '5px 9px', borderRadius: 8, fontSize: 11, fontWeight: '800', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
        boxShadow: isEngineRunning ? '0 0 10px rgba(34, 197, 94, 0.4)' : '0 0 12px rgba(239, 68, 68, 0.6)'
      }}
    >
      <Power size={13} strokeWidth={2.8} />
      <span className="sim-label-full">{isEngineRunning ? 'Đang nổ' : 'Nổ máy'}</span>
    </button>

    <button
      onClick={toggleCameraView}
      className="sim-header-util-btn"
      title={`Góc nhìn camera: ${cameraMode.toUpperCase()}. Bấm để đổi`}
      style={{
        background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)',
        color: '#38bdf8', padding: '5px 9px', borderRadius: 8,
        fontSize: 11, fontWeight: '700', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
      }}
    >
      <Camera size={13} />
      <span className="sim-label-full">{cameraMode === 'cockpit' ? 'Trong xe' : 'Ngoài xe'}</span>
    </button>

    <button
      onClick={toggleRearMirror}
      className="sim-header-util-btn"
      title="Bật/Tắt Gương chiếu hậu"
      style={{
        background: (showRearMirror || gear === 'R') ? 'rgba(14, 165, 233, 0.45)' : 'rgba(255, 255, 255, 0.08)',
        border: (showRearMirror || gear === 'R') ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
        color: (showRearMirror || gear === 'R') ? '#ffffff' : '#94a3b8',
        padding: '5px 9px', borderRadius: 8, fontSize: 11, fontWeight: '700', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
      }}
    >
      <Eye size={13} color={(showRearMirror || gear === 'R') ? '#ffffff' : '#94a3b8'} />
      <span className="sim-label-full">Gương</span>
    </button>

    <button
      onClick={() => {
        if (isDriving) {
          setShowInGameTutorial(prev => !prev);
        } else {
          setShowGuideModal(true);
        }
      }}
      className="sim-header-util-btn"
      title="Xem hướng dẫn lái xe"
      style={{
        background: (showInGameTutorial && isDriving) ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.18)',
        border: '1px solid rgba(16, 185, 129, 0.45)',
        color: '#34d399', padding: '5px 9px', borderRadius: 8,
        fontSize: 11, fontWeight: '700', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
      }}
    >
      <HelpCircle size={13} />
      <span className="sim-label-full">HD</span>
    </button>

    <button
      onClick={() => setShowBerlinOverviewMap(true)}
      className="sim-header-util-btn"
      title="Lộ trình liên hoàn: Berlin-Mitte ➔ Landstraße B2 ➔ Autobahn A2 Hamm/Rhynern ➔ Thị trấn"
      style={{
        background: 'rgba(99, 102, 241, 0.22)', border: '1.5px solid #818cf8',
        color: '#c7d2fe', padding: '5px 10px', borderRadius: 8,
        fontSize: 11, fontWeight: '800', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
      }}
    >
      <Map size={13} color="#a5b4fc" />
      <span className="sim-label-full">Lộ trình</span>
    </button>

    {currentMapId === 'autobahn_a9' && (
      <button
        onClick={() => setShowAutobahnOverviewMap(true)}
        className="sim-header-util-btn"
        title="Sơ đồ 2D Tuyến Cao Tốc A2 & Quy Chuẩn StVO"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
          border: '1.5px solid #10b981',
          color: '#6ee7b7', padding: '5px 10px', borderRadius: 8,
          fontSize: 11, fontWeight: '800', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
        }}
      >
        <Navigation size={13} color="#34d399" />
        <span className="sim-label-full">Bản Đồ 2D Autobahn A2</span>
      </button>
    )}

    <button
      onClick={() => setShowOptionsMenu(true)}
      className="sim-header-util-btn"
      title="Cài đặt mô phỏng (Thời tiết, đèn xe, âm thanh, bài tập...)"
      style={{
        background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.25)',
        color: '#f8fafc', padding: '5px 10px', borderRadius: 8,
        fontSize: 11, fontWeight: '800', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
      }}
    >
      <Sliders size={13} />
      <span className="sim-label-full">Cài đặt</span>
    </button>
  </div>
</div>
);
