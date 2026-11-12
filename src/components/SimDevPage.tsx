import { useEffect, useRef, useState } from 'react';
import { createSimScene, type SimSceneHandle, type SimStats, type RuleState, type PosDebug } from '../world/simScene';
import { loadDemoAssets } from '../world/demoAssets';
import { MiniMap } from './MiniMap';
import { ModernCockpit } from './sim/ModernCockpit';
import { generateBigMap, generateStadtMap } from '../data/maps/bigMap';
import berlinMitteMap from '../data/maps/berlin-mitte-clean.json';
import testCrossingMap from '../data/maps/test_crossing.json';

// 🧪 Trang dev cho simulator v2 — route /sim-dev (không có trong nav production)
// ?big=1 — map lưới 2km×2km để verify chunk streaming (G5)
// ?map=stadt — map Stadt 3km×3km: vòng xuyến, zona Tempo-30, người đi bộ
// ?map=berlin — map Berlin-Mitte OSM thật (alias cũ: ?map=muenchen)
export const SimDevPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SimSceneHandle | null>(null);
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const bigMap = params?.get('big') === '1';
  const stadtMap = params?.get('map') === 'stadt';
  const berlinMap = params?.get('map') === 'berlin' || params?.get('map') === 'muenchen';
  const driveMode = params?.get('drive') === '1';

  useEffect(() => {
    if (!containerRef.current || handleRef.current) return;
    const mapJson = stadtMap ? generateStadtMap()
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

  const [debugVisible, setDebugVisible] = useState(true);
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
      if (type === 'stop') return 'Stoppschild (Z.206) nicht angehalten';
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
      if (type === 'stop') return 'Không dừng hẳn tại biển STOP';
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: debugVisible ? 4 : 0 }}>
          <b style={{ color: '#7dd3fc' }}>
            SIM v2 · {berlinMap ? 'BERLIN MITTE' : stadtMap ? 'STADT 3km × 3km' : driveMode ? (lang === 'de' ? 'FAHRMODUS' : 'MÔ PHỎNG LÁI XE') : bigMap ? 'BIG MAP' : 'TEST MAP'}
          </b>
          <div style={{ display: 'flex', gap: 6 }}>
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
              {debugVisible ? (lang === 'de' ? 'F3 Ausblenden' : 'F3 Thu gọn') : (lang === 'de' ? 'F3 Info' : 'F3 Chi tiết')}
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

          {/* 🚗 MODERN COCKPIT OVERLAY (Buồng lái xe thể thao + Khung kính lái + Vô-lăng) */}
          {(!rule?.camMode || rule.camMode === 'cabin') && (
            <ModernCockpit
              speedKmh={rule?.speedKmh ?? 0}
              rpm={rule?.rpm ?? 850}
              gear={rule?.gear ?? 'D'}
              speedLimit={rule?.speedLimit ?? 50}
              signal={rule?.signal}
              steerAngle={rule?.steerAngle ?? 0}
              camMode={rule?.camMode ?? 'cabin'}
              headYaw={rule?.headYaw ?? 0}
              headPitch={rule?.headPitch ?? 0}
              streetName={rule?.streetName}
              onSelectGear={(g) => sceneHandle?.setGear?.(g)}
              onToggleCam={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV' }));
              }}
              onToggleMirror={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' }));
              }}
            />
          )}

          {/* Mini-map: góc dưới-trái, thụt vào trong cột chữ A để không bao giờ bị cắt mép */}
          {sceneHandle && (
            <div style={{ position: 'absolute', bottom: 20, left: 46, zIndex: 45 }}>
              <MiniMap handle={sceneHandle} />
            </div>
          )}

          {/* HUD phụ khi ở camera ngoài (outside/shoulder) */}
          {rule?.camMode && rule.camMode !== 'cabin' && (
            <div style={{
              position: 'absolute', bottom: 24, right: 46,
              background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(2,6,23,0.96) 100%)',
              color: '#f1f5f9',
              border: '1px solid rgba(148,163,184,0.35)', borderRadius: 16,
              padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 18,
              boxShadow: '0 12px 32px rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
              pointerEvents: 'none', zIndex: 45
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: '#f8fafc',
                border: `4px solid ${rule && (rule.speedKmh ?? 0) > (rule.speedLimit ?? 50) + 3 ? '#ef4444' : '#dc2626'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ color: '#0f172a', fontWeight: 900, fontSize: 17 }}>
                  {rule?.speedLimit ?? 50}
                </span>
              </div>
              <div style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 4, pointerEvents: 'auto' }}>
                  {(['P', 'R', 'N', 'D'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={(e) => {
                        e.stopPropagation();
                        sceneHandle?.setGear?.(g);
                      }}
                      style={{
                        fontSize: 12, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                        background: rule?.gear === g ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                        color: rule?.gear === g ? '#0f172a' : '#94a3b8',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, color: '#ffffff' }}>
                  {rule?.speedKmh ?? 0}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>km/h</div>
              </div>
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
