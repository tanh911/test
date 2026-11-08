import { useEffect, useRef, useState } from 'react';
import { createSimScene, type SimSceneHandle, type SimStats } from '../world/simScene';
import { loadDemoAssets } from '../world/demoAssets';
import { generateBigMap } from '../data/maps/bigMap';
import testCrossingMap from '../data/maps/test_crossing.json';

// 🧪 Trang dev cho simulator v2 — route /sim-dev (không có trong nav production)
// ?big=1 — map lưới 2km×2km để verify chunk streaming (G5)
export const SimDevPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SimSceneHandle | null>(null);
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const bigMap = params?.get('big') === '1';
  const driveMode = params?.get('drive') === '1';

  useEffect(() => {
    if (!containerRef.current || handleRef.current) return;
    const mapJson = bigMap ? generateBigMap() : testCrossingMap;
    const handle = createSimScene(containerRef.current, mapJson, { drive: driveMode });
    handleRef.current = handle;
    // dev hook: Playwright/screenshot dùng teleport camera
    (window as unknown as { __simScene?: SimSceneHandle }).__simScene = handle;
    // G4 verify: load GLB assets (map nhỏ, không drive — drive đã có xe player)
    let demo: Awaited<ReturnType<typeof loadDemoAssets>> | null = null;
    if (!bigMap && !driveMode) {
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
    }, 500);
    return () => clearInterval(t);
  }, []);

  const nodes = bigMap ? 441 : (testCrossingMap as { nodes: unknown[] }).nodes.length;
  const roads = bigMap ? 'grid' : (testCrossingMap as { roads: unknown[] }).roads.length;

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#0b0f19' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: 'rgba(7,11,20,0.85)', color: '#f1f5f9',
        border: '1px solid rgba(148,163,184,0.3)', borderRadius: 10,
        padding: '10px 14px', fontSize: 13, fontFamily: 'monospace',
        pointerEvents: 'none'
      }}>
        <b style={{ color: '#7dd3fc' }}>SIM v2 · {driveMode ? 'LÁI XE (W/A/S/D)' : bigMap ? 'BIG MAP 2km × 2km (G5)' : 'Prompt 1 — khung dự án'}</b><br />
        Nodes: {nodes} · Roads: {roads}<br />
        {driveMode
          ? <>W = ga · S = phanh/lùi · A/D = lái trái/phải</>
          : <>Kéo chuột = quay · WASD = di chuyển · Q/E = xuống/lên · Shift = nhanh</>}<br />
        {debugVisible && stats && (
          <span style={{ color: '#4ade80' }}>
            Draws: {stats.drawCalls} · Tris: {stats.triangles} · Cells: {stats.cellsLoaded}/{stats.cellsTotal} · Quads: {stats.quads}
          </span>
        )}
      </div>
    </div>
  );
};
