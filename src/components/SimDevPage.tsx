import { useEffect, useRef, useState } from 'react';
import { createSimScene, type SimSceneHandle } from '../world/simScene';
import testCrossingMap from '../data/maps/test_crossing.json';

// 🧪 Trang dev cho simulator v2 (Prompt 1) — camera bay tự do xem map.json
// Route: /sim-dev — không có trong nav production
export const SimDevPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SimSceneHandle | null>(null);

  useEffect(() => {
    if (!containerRef.current || handleRef.current) return;
    handleRef.current = createSimScene(containerRef.current, testCrossingMap);
    // dev hook: Playwright/screenshot dùng teleport camera
    (window as unknown as { __simScene?: SimSceneHandle }).__simScene = handleRef.current;
    return () => {
      handleRef.current?.dispose();
      handleRef.current = null;
      delete (window as unknown as { __simScene?: SimSceneHandle }).__simScene;
    };
  }, []);

  const [debugVisible, setDebugVisible] = useState(true);
  const [stats, setStats] = useState<{ drawCalls: number; triangles: number; chunks: number } | null>(null);

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
      setStats({
        drawCalls: h.renderer.info.render.calls,
        triangles: h.renderer.info.render.triangles,
        chunks: h.stats?.chunks ?? 0
      });
    }, 500);
    return () => clearInterval(t);
  }, []);

  const nodes = (testCrossingMap as { nodes: unknown[] }).nodes.length;
  const roads = (testCrossingMap as { roads: unknown[] }).roads.length;

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
        <b style={{ color: '#7dd3fc' }}>SIM v2 · Prompt 1 — khung dự án</b><br />
        Nodes: {nodes} · Roads: {roads}<br />
        Kéo chuột = quay · WASD = di chuyển · Q/E = xuống/lên · Shift = nhanh<br />
        {debugVisible && stats && (
          <span style={{ color: '#4ade80' }}>
            Draws: {stats.drawCalls} · Tris: {stats.triangles} · Chunks: {stats.chunks}
          </span>
        )}
      </div>
    </div>
  );
};
