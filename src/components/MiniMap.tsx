// 🗺️ MiniMap.tsx — HUD mini-map top-down quanh người chơi (Protocol Prompt 10)
// Own RAF loop (KHÔNG dùng RAF render của scene) — mỗi frame gọi handle.getMapState().
// Canvas coords = world coords nhìn từ trên: x → phải, z → xuống.
// heading 0 = forward (0,1) = chỉ XUỐNG dưới; mũi tên player xoay góc (π − heading).
import { useEffect, useRef } from 'react';
import type { SimSceneHandle, MapState } from '../world/simScene';

const PX_PER_M = 0.6;   // scale mini-map
const PAD_M = 25;       // viền lớp đường tính bằng mét
const DEFAULT_SIZE = 172; // kích thước canvas (px CSS)

/** màu chấm đèn giao thông theo phase */
const PHASE_COLOR: Record<string, string> = {
  red: '#ef4444',
  red_yellow: '#f59e0b',
  green: '#22c55e',
  yellow: '#eab308'
};

interface MiniMapProps {
  handle: SimSceneHandle;
  size?: number;
}

export function MiniMap({ handle, size = DEFAULT_SIZE }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    // ── lớp đường: vẽ 1 LẦN vào offscreen canvas (~840 roads với ?big=1) rồi blit mỗi frame ──
    const map = handle.map;
    const S = PX_PER_M;
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const n of map.nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.z < minZ) minZ = n.z;
      if (n.z > maxZ) maxZ = n.z;
    }
    const pad = PAD_M * S;
    const layerW = Math.max(1, Math.ceil((maxX - minX) * S) + pad * 2);
    const layerH = Math.max(1, Math.ceil((maxZ - minZ) * S) + pad * 2);
    const layer = document.createElement('canvas');
    layer.width = layerW;
    layer.height = layerH;
    const lctx = layer.getContext('2d');
    // layer px = (world − minWorld) * S + pad
    const nodeMap = new Map(map.nodes.map(n => [n.id, n]));
    if (lctx) {
      lctx.fillStyle = '#3b4149'; // nền đường
      lctx.lineCap = 'round';
      lctx.lineJoin = 'round';
      for (const r of map.roads) {
        if (r.points.length < 2) continue;
        const from = nodeMap.get(r.from);
        const to = nodeMap.get(r.to);
        if (!from || !to) continue;
        lctx.strokeStyle = '#3b4149';
        lctx.lineWidth = (r.lanesForward + r.lanesBackward) * r.laneWidth * S;
        lctx.beginPath();
        lctx.moveTo((r.points[0][0] - minX) * S + pad, (r.points[0][1] - minZ) * S + pad);
        for (let i = 1; i < r.points.length; i++) {
          lctx.lineTo((r.points[i][0] - minX) * S + pad, (r.points[i][1] - minZ) * S + pad);
        }
        lctx.stroke();
      }
    }

    let raf = 0;
    const frame = () => {
      const ms = handle.getMapState();
      drawFrame(ctx, size, ms, layer, { minX, minZ, pad, S });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [handle, size]);

  return (
    <div
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        background: 'rgba(10,12,16,0.78)'
      }}
    >
      <canvas ref={canvasRef} style={{ width: size, height: size, display: 'block' }} />
    </div>
  );
}

/** Blit lớp đường + vẽ đèn/NPC/player mỗi frame */
function drawFrame(
  ctx: CanvasRenderingContext2D,
  view: number,
  ms: MapState,
  layer: HTMLCanvasElement,
  geom: { minX: number; minZ: number; pad: number; S: number }
) {
  const { minX, minZ, pad, S } = geom;
  ctx.clearRect(0, 0, view, view);

  // ── vị trí layer px của player → tính offset viewport ──
  let ox = 0;
  let oy = 0;
  let sx = 0;
  let sy = 0;
  if (ms.player) {
    const plx = (ms.player.x - minX) * S + pad;
    const plz = (ms.player.z - minZ) * S + pad;
    sx = plx - view / 2;
    sy = plz - view / 2;
  }
  if (layer.width > view) sx = Math.min(Math.max(0, sx), layer.width - view);
  else ox = (view - layer.width) / 2; // layer nhỏ hơn viewport → căn giữa
  if (layer.height > view) sy = Math.min(Math.max(0, sy), layer.height - view);
  else oy = (view - layer.height) / 2;

  ctx.fillStyle = 'rgba(10,12,16,0.78)';
  ctx.fillRect(0, 0, view, view);
  ctx.drawImage(layer, sx, sy, Math.min(view, layer.width), Math.min(view, layer.height), ox, oy, Math.min(view, layer.width), Math.min(view, layer.height));

  // world px → screen px (trong trường hợp đã clamp)
  const w2s = (wx: number, wz: number): [number, number] =>
    [(wx - minX) * S + pad - sx + ox, (wz - minZ) * S + pad - sy + oy];

  // ── đèn giao thông: chấm màu theo phase ──
  for (const l of ms.lights) {
    const [p, q] = w2s(l.x, l.z);
    if (p < -6 || p > view + 6 || q < -6 || q > view + 6) continue;
    ctx.fillStyle = PHASE_COLOR[l.phase] ?? '#6b7280';
    ctx.beginPath();
    ctx.arc(p, q, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── NPC: hình vuông theo heading ──
  ctx.fillStyle = '#93c5fd';
  for (const n of ms.npcs) {
    const [p, q] = w2s(n.x, n.z);
    if (p < -10 || p > view + 10 || q < -10 || q > view + 10) continue;
    ctx.save();
    ctx.translate(p, q);
    ctx.rotate(Math.PI - n.heading);
    ctx.fillRect(-2.2, -5, 4.4, 10); // dài ~ theo hướng chạy
    ctx.restore();
  }

  // ── player: tam giác + chấm xi-nhan nhấp nháy (sync BLINK_PERIOD 0.55s) ──
  if (ms.player) {
    const [p, q] = w2s(ms.player.x, ms.player.z);
    const blinkOn = (performance.now() % 550) < 275;
    ctx.save();
    ctx.translate(p, q);
    ctx.rotate(Math.PI - ms.player.heading);
    // viền nổi bật
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(0, -7.5);
    ctx.lineTo(-4.8, 5.5);
    ctx.lineTo(0, 3.2);
    ctx.lineTo(4.8, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // đèn xi-nhan bên cạnh xe (local −x = trái của flow khi quay quanh tâm player)
    if (ms.player.signal && blinkOn) {
      ctx.fillStyle = '#ffb020';
      ctx.beginPath();
      ctx.arc(ms.player.signal === 'left' ? -6 : 6, 0, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
