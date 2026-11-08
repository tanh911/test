import { useEffect, useRef } from 'react';
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
    return () => {
      handleRef.current?.dispose();
      handleRef.current = null;
    };
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
        Kéo chuột = quay · WASD = di chuyển · Q/E = xuống/lên · Shift = nhanh
      </div>
    </div>
  );
};
