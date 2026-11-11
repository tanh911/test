import { useEffect, useRef, useState } from 'react';
import { createSimScene, type SimSceneHandle, type SimStats, type RuleState } from '../world/simScene';
import { loadDemoAssets } from '../world/demoAssets';
import { MiniMap } from './MiniMap';
import { generateBigMap, generateStadtMap } from '../data/maps/bigMap';
import muenchenCleanMap from '../data/maps/muenchen-altstadt-clean.json';
import testCrossingMap from '../data/maps/test_crossing.json';

// 🧪 Trang dev cho simulator v2 — route /sim-dev (không có trong nav production)
// ?big=1 — map lưới 2km×2km để verify chunk streaming (G5)
// ?map=stadt — map Stadt 3km×3km: vòng xuyến, zona Tempo-30, người đi bộ
// ?map=muenchen — map Munich Altstadt OSM thật
const STADT_NODE_COUNT = 31 * 31; // 961 nodes
export const SimDevPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SimSceneHandle | null>(null);
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const bigMap = params?.get('big') === '1';
  const stadtMap = params?.get('map') === 'stadt';
  const muenchenMap = params?.get('map') === 'muenchen';
  const driveMode = params?.get('drive') === '1';

  useEffect(() => {
    if (!containerRef.current || handleRef.current) return;
    const mapJson = stadtMap ? generateStadtMap()
      : muenchenMap ? muenchenCleanMap
      : bigMap ? generateBigMap()
      : testCrossingMap;
    const handle = createSimScene(containerRef.current, mapJson, { drive: driveMode });
    handleRef.current = handle;
    // Khi bay tự do trên map lớn: đặt camera cao/xa hơn để nhìn toàn bộ bản đồ
    if ((stadtMap || muenchenMap) && !driveMode) {
      handle.camera.position.set(400, 500, 550);
      handle.camera.lookAt(0, 0, 0);
    }
    // MiniMap + HUD mũi tên cần handle để render → keep một copy trong state
    setSceneHandle(handle);
    // dev hook: Playwright/screenshot dùng teleport camera
    (window as unknown as { __simScene?: SimSceneHandle }).__simScene = handle;
    // G4 verify: load GLB assets (map nhỏ, không drive — drive đã có xe player)
    let demo: Awaited<ReturnType<typeof loadDemoAssets>> | null = null;
    if (!bigMap && !stadtMap && !muenchenMap && !driveMode) {
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
  const [stats, setStats] = useState<SimStats | null>(null);
  const [rule, setRule] = useState<RuleState | null>(null);
  const [sceneHandle, setSceneHandle] = useState<SimSceneHandle | null>(null);

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
    }, 500);
    return () => clearInterval(t);
  }, []);

  const nodes = muenchenMap ? 'OSM Munich Altstadt' : stadtMap ? STADT_NODE_COUNT : bigMap ? 441 : (testCrossingMap as { nodes: unknown[] }).nodes.length;
  const roads = muenchenMap ? 'OSM Munich roads' : stadtMap ? 'Stadt grid' : bigMap ? 'grid' : (testCrossingMap as { roads: unknown[] }).roads.length;

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 100, background: '#0b0f19' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: 'rgba(7,11,20,0.85)', color: '#f1f5f9',
        border: '1px solid rgba(148,163,184,0.3)', borderRadius: 10,
        padding: '10px 14px', fontSize: 13, fontFamily: 'monospace',
        pointerEvents: 'none'
      }}>
        <b style={{ color: '#7dd3fc' }}>SIM v2 · {muenchenMap ? 'MÜNCHEN ALTSTADT (OSM thật)' : stadtMap ? 'STADT 3km × 3km (Kreisverkehr + Tempo-30)' : driveMode ? 'LÁI XE (W/A/S/D)' : bigMap ? 'BIG MAP 2km × 2km (G5)' : 'Prompt 1 — khung dự án'}</b><br />
        Nodes: {nodes} · Roads: {roads}<br />
        {driveMode
          ? <>W = Ga (tiến/lùi theo số) · S = Phanh · 1/2/3/4 = Số P/R/N/D · A/D = Lái · Shift = Boost · Q/E = Xi-nhan<br />Kéo chuột / ← → = Liếc nhìn · V = Đổi cam · M = Gương · C = Qua vai</>
          : <>Kéo chuột = quay · WASD = di chuyển · Q/E = xuống/lên · Shift = nhanh</>}<br />
        {debugVisible && stats && (
          <span style={{ color: '#4ade80' }}>
            Draws: {stats.drawCalls} · Tris: {stats.triangles} · Cells: {stats.cellsLoaded}/{stats.cellsTotal} · Quads: {stats.quads}
          </span>
        )}
      </div>

      {driveMode && (
        <>
          {/* keyframes nhấp nháy xi-nhan (sync BLINK_PERIOD 0.55s với vehicle.ts) */}
          <style>{`@keyframes blinkSignal { 50% { opacity: 0.12; } }`}</style>

          {/* Mini-map: góc dưới-trái (Prompt 10) */}
          {sceneHandle && (
            <div style={{ position: 'absolute', bottom: 24, left: 24 }}>
              <MiniMap handle={sceneHandle} />
            </div>
          )}

          {/* Gương chiếu hậu kỹ thuật số Cockpit (Digital Rearview Mirror) */}
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.8) 100%)',
            border: '2px solid rgba(148,163,184,0.4)', borderRadius: 10,
            padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            pointerEvents: 'none', zIndex: 20
          }}>
            <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: 1.5, fontWeight: 700 }}>REARVIEW [M]</div>
            <div style={{
              width: 130, height: 26, background: '#020617', borderRadius: 4,
              border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(56,189,248,0.3)' }} />
              <div style={{ position: 'absolute', left: 25, right: 25, bottom: 4, height: 1, background: 'rgba(239,68,68,0.5)' }} />
              <div style={{ position: 'absolute', left: 40, right: 40, bottom: 10, height: 1, background: 'rgba(234,179,8,0.5)' }} />
              <div style={{ position: 'absolute', left: 52, right: 52, bottom: 16, height: 1, background: 'rgba(74,222,128,0.5)' }} />
              <span style={{ fontSize: 10, color: '#38bdf8', fontWeight: 600, zIndex: 2 }}>
                {rule?.camMode === 'mirror' ? 'ACTIVE MIRROR' : 'WIDE REAR'}
              </span>
            </div>
            <div style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700,
              background: rule?.camMode === 'cabin' ? '#0369a1' : '#334155',
              color: '#f8fafc'
            }}>
              {rule?.camMode ? rule.camMode.toUpperCase() : 'CABIN'}
            </div>
          </div>

          {/* Bảng đồng hồ trung tâm Cockpit Sport Dashboard */}
          <div style={{
            position: 'absolute', bottom: 24, right: 24,
            background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(2,6,23,0.96) 100%)',
            color: '#f1f5f9',
            border: '1px solid rgba(148,163,184,0.35)', borderRadius: 16,
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 18,
            boxShadow: '0 12px 32px rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
            pointerEvents: 'none'
          }}>
            {/* Biển báo tốc độ StVO Đức */}
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: '#f8fafc',
              border: `4px solid ${rule && (rule.speedKmh ?? 0) > (rule.speedLimit ?? 50) + 3 ? '#ef4444' : '#dc2626'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: rule && (rule.speedKmh ?? 0) > (rule.speedLimit ?? 50) + 3 ? '0 0 14px #ef4444' : '0 2px 6px rgba(0,0,0,0.4)'
            }}>
              <span style={{ color: '#0f172a', fontWeight: 900, fontSize: 17, lineHeight: 1 }}>
                {rule?.speedLimit ?? 50}
              </span>
            </div>

            {/* Xi-nhan trái */}
            <span style={{
              fontSize: 26, color: '#fbbf24', lineHeight: 1,
              opacity: rule?.signal === 'left' ? 1 : 0.12,
              animation: rule?.signal === 'left' ? 'blinkSignal 0.55s steps(1) infinite' : undefined,
              textShadow: rule?.signal === 'left' ? '0 0 12px #fbbf24' : undefined
            }}>◀</span>

            {/* Cụm công-tơ-mét & Vòng tua RPM */}
            <div style={{ textAlign: 'center', minWidth: 90 }}>
              {/* Thanh chọn số P R N D */}
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
                      boxShadow: rule?.gear === g ? '0 0 10px #38bdf8' : 'none',
                      border: 'none', cursor: 'pointer', transition: 'all 0.15s ease'
                    }}
                    title={`Phím số ${g === 'P' ? '1' : g === 'R' ? '2' : g === 'N' ? '3' : '4'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Tốc độ số */}
              <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, letterSpacing: -1, color: '#ffffff' }}>
                {rule?.speedKmh ?? 0}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 1 }}>km/h</div>

              {/* Thanh Tachometer RPM Bar */}
              <div style={{ width: '100%', height: 5, background: '#1e293b', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, ((rule?.rpm ?? 800) / 6000) * 100)}%`,
                  height: '100%',
                  background: (rule?.rpm ?? 800) > 5200 ? 'linear-gradient(90deg, #eab308, #ef4444)' : 'linear-gradient(90deg, #38bdf8, #22c55e)',
                  transition: 'width 0.1s ease'
                }} />
              </div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                {rule?.rpm ?? 800} RPM
              </div>
            </div>

            {/* Xi-nhan phải */}
            <span style={{
              fontSize: 26, color: '#fbbf24', lineHeight: 1,
              opacity: rule?.signal === 'right' ? 1 : 0.12,
              animation: rule?.signal === 'right' ? 'blinkSignal 0.55s steps(1) infinite' : undefined,
              textShadow: rule?.signal === 'right' ? '0 0 12px #fbbf24' : undefined
            }}>▶</span>
          </div>
          {/* Kết quả thi */}
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(7,11,20,0.85)', color: '#f1f5f9',
            border: `1px solid ${rule && !rule.bestanden ? 'rgba(239,68,68,0.6)' : 'rgba(74,222,128,0.6)'}`,
            borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: 'monospace',
            minWidth: 300, pointerEvents: 'none'
          }}>
            <b style={{ color: rule && !rule.bestanden ? '#ef4444' : '#4ade80' }}>
              {rule?.summary ?? 'BESTANDEN'}
            </b>
            {rule && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                  <span style={{ color: '#f87171' }}>⛔ Schwerer: {rule.violationsBySeverity.major.length}</span>
                  <span style={{ color: '#fbbf24' }}>⚠ Leichter: {rule.violationsBySeverity.minor.length}</span>
                  <span style={{ color: '#7dd3fc' }}>⏱ {Math.floor(rule.elapsedTime / 60)}:{String(Math.floor(rule.elapsedTime % 60)).padStart(2, '0')}</span>
                </div>
                {rule.violationsBySeverity.major.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 11 }}>
                    <b style={{ color: '#f87171' }}>Schwerer Fehler:</b>
                    {rule.violationsBySeverity.major.slice().reverse().map((v, i) => (
                      <div key={i} style={{ color: '#f87171', marginLeft: 10 }}>
                        ⛔ {v.message}
                      </div>
                    ))}
                  </div>
                )}
                {rule.violationsBySeverity.minor.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 11 }}>
                    <b style={{ color: '#fbbf24' }}>Leichter Fehler:</b>
                    {rule.violationsBySeverity.minor.slice().reverse().map((v, i) => (
                      <div key={i} style={{ color: '#fbbf24', marginLeft: 10 }}>
                        ⚠ {v.message}
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
