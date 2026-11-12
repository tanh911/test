import { useEffect, useRef, useState } from 'react';
import { createSimScene, type SimSceneHandle, type SimStats, type RuleState, type PosDebug } from '../world/simScene';
import { loadDemoAssets } from '../world/demoAssets';
import { MiniMap } from './MiniMap';
import { ModernCockpit } from './sim/ModernCockpit';
import { generateBigMap, generateStadtMap } from '../data/maps/bigMap';
import { generateExamParcoursMap, EXAM_STATIONS } from '../data/maps/examParcours';
import berlinMitteMap from '../data/maps/berlin-mitte-clean.json';
import testCrossingMap from '../data/maps/test_crossing.json';

// 🧪 Trang dev cho simulator v2 — route /sim-dev (không có trong nav production)
// ?big=1 — map lưới 2km×2km để verify chunk streaming (G5)
// ?map=stadt — map Stadt 3km×3km: vòng xuyến, zona Tempo-30, người đi bộ
// ?map=berlin&drive=1 — Mặc định nạp Sa hình Phản xạ Tình huống 6 Trạm Berlin-Mitte (thêm &raw=1 nếu muốn xem OSM thô)
export const SimDevPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SimSceneHandle | null>(null);
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const bigMap = params?.get('big') === '1';
  const stadtMap = params?.get('map') === 'stadt';
  const berlinMap = params?.get('map') === 'berlin' || params?.get('map') === 'muenchen';
  const rawOsm = params?.get('raw') === '1';
  const driveMode = params?.get('drive') === '1';
  const isParcoursMode = driveMode && !rawOsm && !stadtMap && !bigMap;

  useEffect(() => {
    if (!containerRef.current || handleRef.current) return;
    const mapJson = isParcoursMode ? generateExamParcoursMap()
      : stadtMap ? generateStadtMap()
      : berlinMap ? berlinMitteMap
      : bigMap ? generateBigMap()
      : testCrossingMap;
    const handle = createSimScene(containerRef.current, mapJson, { drive: driveMode });
    handleRef.current = handle;
    // Khi bay tự do trên map lớn: đặt camera cao/xa hơn để nhìn toàn bộ bản đồ
    if ((stadtMap || berlinMap) && !driveMode) {
      handle.camera.position.set(400, 500, 550);
      handle.camera.lookAt(0, 0, 0);
    }
    // MiniMap + HUD mũi tên cần handle để render → keep một copy trong state
    setSceneHandle(handle);
    // dev hook: Playwright/screenshot dùng teleport camera
    (window as unknown as { __simScene?: SimSceneHandle }).__simScene = handle;
    // G4 verify: load GLB assets (map nhỏ, không drive — drive đã có xe player)
    let demo: Awaited<ReturnType<typeof loadDemoAssets>> | null = null;
    if (!bigMap && !stadtMap && !berlinMap && !driveMode) {
      loadDemoAssets(handle.scene, handle.map).then(d => { demo = d; });
    }
    return () => {
      demo?.dispose();
      handle.dispose();
      handleRef.current = null;
      delete (window as unknown as { __simScene?: SimSceneHandle }).__simScene;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [debugVisible, setDebugVisible] = useState(false);
  const [lang, setLang] = useState<'vi' | 'de'>('vi');
  const [stats, setStats] = useState<SimStats | null>(null);
  const [rule, setRule] = useState<RuleState | null>(null);
  const [pos, setPos] = useState<PosDebug | null>(null);
  const [sceneHandle, setSceneHandle] = useState<SimSceneHandle | null>(null);

  const formatViolationMsg = (type: string, rawMsg: string, l: 'vi' | 'de', severity?: 'minor' | 'major'): string => {
    const mSpeed = rawMsg.match(/(\d+)\s*km\/h.*?(?:limit|giới hạn)\s*(\d+)/i);
    if (l === 'de') {
      if (type === 'speed' && mSpeed) {
        return severity === 'major'
          ? `Erheblich zu schnell: ${mSpeed[1]} km/h (Limit ${mSpeed[2]} km/h)`
          : `Tempo überschritten: ${mSpeed[1]} km/h (Limit ${mSpeed[2]} km/h)`;
      }
      if (type === 'redlight') return 'Rote Ampel überfahren';
      if (type === 'stop' || type === 'stop_sign') return 'Stoppschild (Z.206) nicht angehalten';
      if (type === 'right_of_way') return 'Rechts vor links missachtet (§8 StVO)';
      if (type === 'nosignal') return 'Blinken beim Abbiegen vergessen';
      if (type === 'offroad') return 'Fahrbahn verlassen / Gehweg befahren';
      if (type === 'pedestrian') return 'Fußgänger am Zebrastreifen nicht vorgelassen';
      if (type === 'roundabout') return 'Kreisverkehr: Rechts abbiegen & rechts blinken';
      if (type === 'collision') return 'Kollision mit Hindernis oder Fahrzeug';
      return rawMsg;
    } else {
      if (type === 'speed' && mSpeed) {
        return severity === 'major'
          ? `Vượt tốc độ nghiêm trọng: ${mSpeed[1]} km/h (tối đa ${mSpeed[2]} km/h)`
          : `Vượt tốc độ: ${mSpeed[1]} km/h (tối đa ${mSpeed[2]} km/h)`;
      }
      if (type === 'redlight') return 'Vượt đèn đỏ tại giao lộ';
      if (type === 'stop' || type === 'stop_sign') return 'Không dừng hẳn tại biển STOP';
      if (type === 'right_of_way') return 'Không nhường xe bên phải (Rechts vor links)';
      if (type === 'nosignal') return 'Quên bật xi-nhan khi chuyển hướng';
      if (type === 'offroad') return 'Đi chệch lòng đường / leo vỉa hè';
      if (type === 'pedestrian') return 'Không nhường người đi bộ tại vạch kẻ đường';
      if (type === 'roundabout') return 'Vào vòng xuyến phải rẽ phải và bật xi-nhan phải';
      if (type === 'collision') return rawMsg.replace('Va chạm ', 'Va chạm: ');
      return rawMsg;
    }
  };

  const formatSummary = (r: RuleState | null, l: 'vi' | 'de'): string => {
    if (!r) return l === 'de' ? 'PRÜFUNG LÄUFT — BESTANDEN (0 Fehler)' : 'ĐẠT (0 lỗi)';
    const maj = r.violationsBySeverity.major.length;
    const min = r.violationsBySeverity.minor.length;
    if (l === 'de') {
      if (r.bestanden) {
        return min === 0 ? 'BESTANDEN (0 Fehler)' : `BESTANDEN (${min} leichte Fehler)`;
      }
      return `NICHT BESTANDEN (${maj} schwere, ${min} leichte Fehler)`;
    } else {
      if (r.bestanden) {
        return min === 0 ? 'ĐẠT KỲ THI (0 lỗi)' : `ĐẠT KỲ THI (${min} lỗi nhẹ)`;
      }
      return `KHÔNG ĐẠT (${maj} lỗi nặng, ${min} lỗi nhẹ)`;
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'F3') {
        e.preventDefault();
        setDebugVisible(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const h = handleRef.current;
      if (!h) return;
      setStats(h.getStats());
      setRule(h.getRuleState());
      setPos(h.getPosDebug());
    }, 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 100, background: '#0b0f19' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', top: 28, left: 46, zIndex: 45,
        background: 'rgba(7,11,20,0.88)', color: '#f1f5f9',
        border: '1px solid rgba(148,163,184,0.32)', borderRadius: 10,
        padding: '8px 12px', fontSize: 11, fontFamily: 'monospace',
        maxWidth: 470,
        boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
        pointerEvents: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: debugVisible ? 4 : 0, flexWrap: 'wrap' }}>
          <b style={{ color: '#7dd3fc' }}>
            {isParcoursMode
              ? (lang === 'de' ? 'PRÜFUNGS-PARCOURS (6 STATIONEN)' : 'SA HÌNH PHẢN XẠ (6 TRẠM)')
              : `SIM v2 · ${berlinMap ? 'BERLIN MITTE (OSM)' : stadtMap ? 'STADT 3km' : 'MAP'}`}
          </b>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {driveMode && (
              <>
                <button
                  onClick={() => sceneHandle?.cycleCameraMode?.()}
                  style={{
                    background: 'rgba(16,185,129,0.2)', color: '#6ee7b7',
                    border: '1px solid rgba(16,185,129,0.45)', borderRadius: 5,
                    padding: '1px 7px', fontSize: 10, fontWeight: 800, cursor: 'pointer'
                  }}
                  title="Phím tắt V: Đổi góc nhìn (Buồng lái / Kính lái thoáng / Sau xe)"
                >
                  🎥 {rule?.camMode === 'hood'
                    ? (lang === 'de' ? 'V: Motorhaube' : 'V: Kính lái')
                    : rule?.camMode === 'outside'
                      ? (lang === 'de' ? 'V: Außen' : 'V: Sau xe')
                      : (lang === 'de' ? 'V: Cockpit' : 'V: Buồng lái')}
                </button>
                <button
                  onClick={() => sceneHandle?.resetExam?.()}
                  style={{
                    background: 'rgba(245,158,11,0.18)', color: '#fcd34d',
                    border: '1px solid rgba(245,158,11,0.45)', borderRadius: 5,
                    padding: '1px 7px', fontSize: 10, fontWeight: 800, cursor: 'pointer'
                  }}
                  title="Khởi động lại lộ trình thi"
                >
                  🔄 {lang === 'de' ? 'Neustart' : 'Thi lại'}
                </button>
                <button
                  onClick={() => {
                    const url = new URL(window.location.href);
                    if (rawOsm) url.searchParams.delete('raw');
                    else url.searchParams.set('raw', '1');
                    window.location.href = url.toString();
                  }}
                  style={{
                    background: 'rgba(168,85,247,0.18)', color: '#d8b4fe',
                    border: '1px solid rgba(168,85,247,0.45)', borderRadius: 5,
                    padding: '1px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {rawOsm ? '🎯 Sa hình 6 Trạm' : '🏙️ Map lớn OSM'}
                </button>
              </>
            )}
            <button
              onClick={() => setLang(l => (l === 'vi' ? 'de' : 'vi'))}
              style={{
                background: 'rgba(56,189,248,0.18)', color: '#7dd3fc',
                border: '1px solid rgba(56,189,248,0.45)', borderRadius: 5,
                padding: '1px 7px', fontSize: 10, fontWeight: 800, cursor: 'pointer'
              }}
              title={lang === 'vi' ? 'Đổi ngôn ngữ sang Tiếng Đức (DE)' : 'Sprache auf Vietnamesisch umschalten (VI)'}
            >
              {lang === 'vi' ? '🇻🇳 VI' : '🇩🇪 DE'}
            </button>
            <button
              onClick={() => setDebugVisible(v => !v)}
              style={{
                background: 'rgba(148,163,184,0.15)', color: '#cbd5e1',
                border: '1px solid rgba(148,163,184,0.35)', borderRadius: 5,
                padding: '1px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer'
              }}
              title="Phím tắt F3"
            >
              {debugVisible ? (lang === 'de' ? 'F3 −' : 'F3 Thu gọn') : (lang === 'de' ? 'F3 +' : 'F3 Chi tiết')}
            </button>
          </div>
        </div>
        {debugVisible && (
          <>
            {driveMode
              ? (lang === 'de'
                  ? <>W/S = Gas/Bremse · 1/2/3/4 = P/R/N/D · A/D = Lenken<br />Shift = Boost · Q/E = Blinker · Maus = Umschauen</>
                  : <>W/S = Ga/Phanh · 1/2/3/4 = Số P/R/N/D · A/D = Đánh lái<br />Shift = Tăng tốc · Q/E = Xi-nhan · Kéo chuột = Quan sát</>)
              : (lang === 'de'
                  ? <>Maus = Drehen · WASD = Bewegen · Q/E = Auf/Ab</>
                  : <>Kéo chuột = Xoay · WASD = Di chuyển · Q/E = Xuống/Lên</>)}<br />
            {stats && (
              <span style={{ color: '#4ade80' }}>
                {lang === 'de'
                  ? `Draws: ${stats.drawCalls} · Tris: ${stats.triangles} · Zellen: ${stats.cellsLoaded}/${stats.cellsTotal}`
                  : `Lệnh vẽ: ${stats.drawCalls} · Đa giác: ${stats.triangles} · Ô bản đồ: ${stats.cellsLoaded}/${stats.cellsTotal}`}
              </span>
            )}
            {pos && (
              <div style={{ marginTop: 4, color: '#fbbf24' }}>
                {pos.roadName && <span style={{ color: '#7dd3fc', fontWeight: 700 }}>🛣 {pos.roadName}</span>}
                {' · '}📍 x={pos.x.toFixed(0)} z={pos.z.toFixed(0)} · {lang === 'de' ? `Zelle ${pos.cell} · Kurs ${pos.headingDeg.toFixed(0)}°` : `ô ${pos.cell} · hướng ${pos.headingDeg.toFixed(0)}°`}
                {pos.node && <> · {lang === 'de' ? 'Knoten' : 'nút'} <b>{pos.node}</b></>}
                {pos.road && <> · {lang === 'de' ? 'Str.' : 'đường'} <b>{pos.road}</b></>}
              </div>
            )}
          </>
        )}
      </div>

      {driveMode && (
        <>
          {/* keyframes nhấp nháy xi-nhan (sync BLINK_PERIOD 0.55s với vehicle.ts) */}
          <style>{`@keyframes blinkSignal { 50% { opacity: 0.12; } }`}</style>

          {/* 🧭 BANNER GIÁM KHẢO DẪN ĐƯỜNG & TÌNH HUỐNG SÁT HẠCH (PRÜFER-ANWEISUNG HUD) */}
          {rule?.activeStation && !rule?.examCompleted && (
            <div style={{
              position: 'absolute',
              top: rule.camMode === 'outside' ? 14 : 98,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 44,
              width: 490,
              maxWidth: 'calc(100vw - 640px)',
              background: 'linear-gradient(180deg, rgba(10,16,29,0.92) 0%, rgba(5,9,18,0.95) 100%)',
              border: '1.5px solid rgba(56,189,248,0.45)',
              borderRadius: 14,
              padding: '9px 14px',
              boxShadow: '0 10px 28px rgba(0,0,0,0.75)',
              color: '#f8fafc',
              fontFamily: 'Inter, system-ui, sans-serif',
              pointerEvents: 'none'
            }}>
              {/* Thanh tiến độ 6 trạm */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {EXAM_STATIONS.map((st) => {
                    const done = st.index < rule.activeStation!.index;
                    const active = st.index === rule.activeStation!.index;
                    return (
                      <span
                        key={st.id}
                        style={{
                          width: 20, height: 18, borderRadius: 5,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 900,
                          background: done ? '#10b981' : active ? '#38bdf8' : 'rgba(148,163,184,0.18)',
                          color: done || active ? '#04101c' : '#94a3b8'
                        }}
                      >
                        {done ? '✓' : st.index}
                      </span>
                    );
                  })}
                  <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 800, color: '#7dd3fc' }}>
                    {lang === 'de' ? rule.activeStation.titleDe : rule.activeStation.titleVi}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{
                    background: 'rgba(251,191,36,0.16)', color: '#fcd34d',
                    border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6,
                    padding: '1px 7px', fontSize: 10, fontWeight: 800
                  }}>
                    {rule.activeStation.ruleTag}
                  </span>
                  {rule.stationDist !== undefined && (
                    <span style={{
                      background: 'rgba(56,189,248,0.2)', color: '#38bdf8',
                      borderRadius: 6, padding: '1px 7px', fontSize: 11, fontWeight: 900
                    }}>
                      📍 {rule.stationDist} m
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.38, color: '#e2e8f0', marginBottom: 5 }}>
                🔊 {lang === 'de' ? rule.activeStation.instructionDe : rule.activeStation.instructionVi}
              </div>
              <div style={{
                display: 'inline-block',
                background: 'rgba(16,185,129,0.16)',
                border: '1px solid rgba(16,185,129,0.4)',
                color: '#6ee7b7',
                borderRadius: 6,
                padding: '2px 9px',
                fontSize: 11,
                fontWeight: 800
              }}>
                🎯 {lang === 'de' ? rule.activeStation.actionHintDe : rule.activeStation.actionHintVi}
              </div>
            </div>
          )}

          {/* 🏆 BẢNG TỔNG KẾT SÁT HẠCH KHI HOÀN THÀNH 6 TRẠM (PRÜFUNGSPROTOKOLL MODAL) */}
          {rule?.examCompleted && (
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 80,
              background: 'rgba(2,6,23,0.78)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto'
            }}>
              <div style={{
                width: 480,
                background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
                border: `2px solid ${rule.bestanden ? '#10b981' : '#ef4444'}`,
                borderRadius: 20,
                padding: '24px 28px',
                color: '#f8fafc',
                boxShadow: '0 24px 60px rgba(0,0,0,0.9)',
                textAlign: 'center',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                <div style={{ fontSize: 42, marginBottom: 8 }}>
                  {rule.bestanden ? '🏆' : '⚠️'}
                </div>
                <h2 style={{ margin: '0 0 6px', fontSize: 22, color: rule.bestanden ? '#4ade80' : '#f87171' }}>
                  {formatSummary(rule, lang)}
                </h2>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#94a3b8' }}>
                  {lang === 'de'
                    ? 'Alle 6 Prüfungsstationen im Berliner Übungsparcours abgeschlossen!'
                    : 'Bạn đã hoàn thành toàn bộ 6 trạm tình huống sát hạch thực hành!'}
                </p>
                <div style={{
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 18,
                  textAlign: 'left',
                  fontSize: 12
                }}>
                  <div>⏱ {lang === 'de' ? 'Prüfungszeit' : 'Thời gian hoàn thành'}: <b>{Math.floor(rule.elapsedTime / 60)}:{String(Math.floor(rule.elapsedTime % 60)).padStart(2, '0')}</b></div>
                  <div style={{ color: '#f87171', marginTop: 4 }}>⛔ {lang === 'de' ? 'Schwere Fehler' : 'Lỗi nghiêm trọng'}: <b>{rule.violationsBySeverity.major.length}</b></div>
                  <div style={{ color: '#fbbf24', marginTop: 4 }}>⚠ {lang === 'de' ? 'Leichte Fehler' : 'Lỗi nhẹ'}: <b>{rule.violationsBySeverity.minor.length}</b></div>
                </div>
                <button
                  onClick={() => sceneHandle?.resetExam?.()}
                  style={{
                    background: 'linear-gradient(90deg, #0284c7 0%, #2563eb 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 24px',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(37,99,235,0.5)'
                  }}
                >
                  🔄 {lang === 'de' ? 'Prüfung wiederholen' : 'Thực hành lại từ đầu'}
                </button>
              </div>
            </div>
          )}

          {/* 🚗 MODERN COCKPIT OVERLAY (Tự động thích ứng cho cả Buồng lái, Kính lái thoáng & Góc nhìn thứ 3) */}
          <ModernCockpit
            speedKmh={rule?.speedKmh ?? 0}
            rpm={rule?.rpm ?? 850}
            gear={rule?.gear ?? 'D'}
            speedLimit={rule?.speedLimit ?? 50}
            signal={rule?.signal}
            steerAngle={rule?.steerAngle ?? 0}
            camMode={rule?.camMode ?? 'cabin'}
            throttle={rule?.throttle ?? 0}
            brake={rule?.brake ?? 0}
            headYaw={rule?.headYaw ?? 0}
            headPitch={rule?.headPitch ?? 0}
            streetName={rule?.streetName}
            onSelectGear={(g) => sceneHandle?.setGear?.(g)}
            onToggleCam={() => sceneHandle?.cycleCameraMode?.()}
            onToggleMirror={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' }));
            }}
          />

          {/* Mini-map: góc dưới-trái, thụt vào trong cột chữ A để không bao giờ bị cắt mép */}
          {sceneHandle && (
            <div style={{ position: 'absolute', bottom: 20, left: 46, zIndex: 45 }}>
              <MiniMap handle={sceneHandle} />
            </div>
          )}
          {/* Kết quả thi */}
          <div style={{
            position: 'absolute', top: 28, right: 46, zIndex: 45,
            background: 'rgba(7,11,20,0.88)', color: '#f1f5f9',
            border: `1px solid ${rule && !rule.bestanden ? 'rgba(239,68,68,0.65)' : 'rgba(74,222,128,0.65)'}`,
            borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: 'monospace',
            minWidth: 300, boxShadow: '0 8px 24px rgba(0,0,0,0.65)', pointerEvents: 'none'
          }}>
            <b style={{ color: rule && !rule.bestanden ? '#ef4444' : '#4ade80' }}>
              {formatSummary(rule, lang)}
            </b>
            {rule && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                  <span style={{ color: '#f87171' }}>
                    ⛔ {lang === 'de' ? 'Schwer' : 'Lỗi nặng'}: {rule.violationsBySeverity.major.length}
                  </span>
                  <span style={{ color: '#fbbf24' }}>
                    ⚠ {lang === 'de' ? 'Leicht' : 'Lỗi nhẹ'}: {rule.violationsBySeverity.minor.length}
                  </span>
                  <span style={{ color: '#7dd3fc' }}>
                    ⏱ {Math.floor(rule.elapsedTime / 60)}:{String(Math.floor(rule.elapsedTime % 60)).padStart(2, '0')}
                  </span>
                </div>
                {rule.violationsBySeverity.major.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 11 }}>
                    <b style={{ color: '#f87171' }}>{lang === 'de' ? 'Schwere Fehler:' : 'Lỗi nghiêm trọng:'}</b>
                    {rule.violationsBySeverity.major.slice().reverse().map((v, i) => (
                      <div key={i} style={{ color: '#f87171', marginLeft: 10 }}>
                        ⛔ {formatViolationMsg(v.type, v.message, lang, v.severity)}
                      </div>
                    ))}
                  </div>
                )}
                {rule.violationsBySeverity.minor.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 11 }}>
                    <b style={{ color: '#fbbf24' }}>{lang === 'de' ? 'Leichte Fehler:' : 'Lỗi nhẹ:'}</b>
                    {rule.violationsBySeverity.minor.slice().reverse().map((v, i) => (
                      <div key={i} style={{ color: '#fbbf24', marginLeft: 10 }}>
                        ⚠ {formatViolationMsg(v.type, v.message, lang, v.severity)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
