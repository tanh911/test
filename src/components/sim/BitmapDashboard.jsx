import { useEffect, useRef } from 'react';

// 🚗 DASHBOARD BITMAP 2D — phong cách 3D-Fahrschule cổ điển (ảnh tham khảo 2005):
// táp-lô vẽ canvas cố định đáy màn hình + đồng hồ kim động (tốc độ/tua mã lực),
// khoét kính lái trong suốt để thấy scene 3D. Chỉ hiển thị ở camera cockpit.

const drawGauge = (ctx, cx, cy, r, value, max, ticks, step, label, unit, redlineFrom = Infinity) => {
  // Vòng đồng hồ
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const face = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  face.addColorStop(0, '#3a3f47');
  face.addColorStop(1, '#171a1f');
  ctx.fillStyle = face;
  ctx.fill();
  ctx.lineWidth = r * 0.09;
  ctx.strokeStyle = '#0a0c10';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.94, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.stroke();

  // Vạch chia: sweep từ 135° đến 405° (270° cung)
  const a0 = Math.PI * 0.75;
  const a1 = Math.PI * 2.25;
  const toXY = (frac, rr) => {
    const a = a0 + (a1 - a0) * frac;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, a];
  };
  const majorCount = Math.round(ticks / step);
  for (let i = 0; i <= majorCount; i++) {
    const frac = i / majorCount;
    const [tx, ty] = toXY(frac, r * 0.86);
    const [ix, iy] = toXY(frac, r * 0.7);
    const isRed = i * step >= redlineFrom;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(ix, iy);
    ctx.lineWidth = r * 0.045;
    ctx.strokeStyle = isRed ? '#ef4444' : '#e5e7eb';
    ctx.stroke();
    // Số
    const [nx, ny] = toXY(frac, r * 0.55);
    ctx.fillStyle = isRed ? '#f87171' : '#d1d5db';
    ctx.font = `800 ${Math.round(r * 0.155)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i * step), nx, ny);
  }
  // Tên đồng hồ
  ctx.fillStyle = '#9ca3af';
  ctx.font = `700 ${Math.round(r * 0.12)}px Inter, system-ui, sans-serif`;
  ctx.fillText(label, cx, cy + r * 0.42);
  ctx.font = `600 ${Math.round(r * 0.1)}px Inter, system-ui, sans-serif`;
  ctx.fillText(unit, cx, cy + r * 0.58);

  // Kim (đỏ, đuôi đối trọng)
  const v = Math.max(0, Math.min(1, value / max));
  const [, , na] = toXY(v, r * 0.78);
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(na) * r * 0.18, cy - Math.sin(na) * r * 0.18);
  ctx.lineTo(cx + Math.cos(na) * r * 0.8, cy + Math.sin(na) * r * 0.8);
  ctx.lineWidth = r * 0.055;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#e11d48';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = '#111318';
  ctx.fill();
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
};

export const BitmapDashboard = ({
  speed = 0, rpm = 0, gear = 'P', speedLimit = 50,
  blinkerLeft = false, blinkerRight = false, headlights = false,
  handbrake = false, seatBelt = false, laneWarning = null, highBeam = false
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const W = cv.width, H = cv.height;

    ctx.clearRect(0, 0, W, H);

    // ── Thân táp-lô: khối tối cong che đáy, để hốc đồng hồ nhô lên ──
    const dashTop = H * 0.16;
    const grad = ctx.createLinearGradient(0, dashTop, 0, H);
    grad.addColorStop(0, '#1b1e24');
    grad.addColorStop(0.35, '#12151a');
    grad.addColorStop(1, '#07080b');
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, dashTop + 60);
    ctx.bezierCurveTo(W * 0.22, dashTop - 18, W * 0.5, dashTop - 34, W * 0.78, dashTop - 12);
    ctx.bezierCurveTo(W * 0.9, dashTop - 2, W, dashTop + 40, W, dashTop + 90);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Nét sáng mép táp-lô (kỷ vinyl)
    ctx.beginPath();
    ctx.moveTo(0, dashTop + 60);
    ctx.bezierCurveTo(W * 0.22, dashTop - 18, W * 0.5, dashTop - 34, W * 0.78, dashTop - 12);
    ctx.bezierCurveTo(W * 0.9, dashTop - 2, W, dashTop + 40, W, dashTop + 90);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.stroke();

    // ── Cụm đồng hồ (binnacle) giữa lệch trái như xe lái Đức ──
    const bcx = W * 0.46, bcy = H * 0.42, br = Math.min(W, H) * 0.155;
    ctx.beginPath();
    ctx.ellipse(bcx, bcy, br * 2.35, br * 1.28, 0, 0, Math.PI * 2);
    const hood = ctx.createLinearGradient(0, bcy - br * 1.4, 0, bcy + br * 1.4);
    hood.addColorStop(0, '#23272e');
    hood.addColorStop(1, '#0c0e12');
    ctx.fillStyle = hood;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 2 đồng hồ chính: tốc độ (0-260) + tua (0-7 x1000, redline 6.5)
    drawGauge(ctx, bcx - br * 1.02, bcy + br * 0.08, br * 0.86, speed, 260, 260, 20, 'km/h', '', 220);
    drawGauge(ctx, bcx + br * 1.02, bcy + br * 0.08, br * 0.86, rpm, 8000, 8000, 1000, '1/min', 'x1000', 6500);

    // Đồng hồ nhỏ: nhiên liệu + nhiệt độ nước (tĩnh trang trí)
    drawGauge(ctx, bcx - br * 2.02, bcy + br * 0.3, br * 0.38, 0.62, 1, 1, 0.5, 'FUEL', '', Infinity);
    drawGauge(ctx, bcx + br * 2.02, bcy + br * 0.3, br * 0.38, 0.35, 1, 1, 0.5, 'TEMP', '', Infinity);

    // ── Đèn báo trong cụm ──
    const ledY = bcy - br * 0.62;
    const led = (x, on, color, shape = 'arrow', flip = false) => {
      ctx.save();
      ctx.translate(x, ledY);
      if (shape === 'arrow') {
        ctx.beginPath();
        const d = flip ? -1 : 1;
        ctx.moveTo(d * 12, -7); ctx.lineTo(d * 2, -7); ctx.lineTo(d * 2, -11);
        ctx.lineTo(-d * 8, 0); ctx.lineTo(d * 2, 11); ctx.lineTo(d * 2, 7); ctx.lineTo(d * 12, 7);
        ctx.closePath();
        ctx.fillStyle = on && (Math.floor(performance.now() / 400) % 2 === 0) ? color : 'rgba(255,255,255,0.07)';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = on ? color : 'rgba(255,255,255,0.07)';
        ctx.fill();
      }
      ctx.restore();
    };
    led(bcx - br * 1.9, blinkerLeft, '#22c55e', 'arrow', true);
    led(bcx - br * 0.9, headlights && highBeam, '#3b82f6', 'circle');
    led(bcx + br * 0.9, !seatBelt || handbrake, '#ef4444', 'circle');
    led(bcx + br * 1.9, blinkerRight, '#22c55e', 'arrow');

    // Biển giới hạn tốc độ nhỏ trên cụm
    ctx.beginPath();
    ctx.arc(bcx, bcy - br * 1.55, br * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = br * 0.13;
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = `900 ${Math.round(br * 0.34)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(speedLimit || 50), bcx, bcy - br * 1.55 + 1);

    // Cảnh báo làn (Lane assist) — dải đỏ nhấp nháy phía dưới cụm
    if (laneWarning) {
      ctx.fillStyle = Math.floor(performance.now() / 300) % 2 === 0 ? 'rgba(239,68,68,0.85)' : 'rgba(239,68,68,0.4)';
      ctx.fillRect(W * 0.38, bcy + br * 1.5, W * 0.24, 5);
    }

    // ── Vô-lăng: vành tròn tối che đáy giữa (chỉ vành trên hiện) ──
    const wx = W * 0.5, wy = H * 1.28, wr = H * 0.62;
    ctx.beginPath();
    ctx.arc(wx, wy, wr, Math.PI * 1.18, Math.PI * 1.82);
    ctx.lineWidth = H * 0.075;
    ctx.lineCap = 'round';
    const wheelGrad = ctx.createLinearGradient(0, wy - wr, 0, wy - wr * 0.72);
    wheelGrad.addColorStop(0, '#2a2d33');
    wheelGrad.addColorStop(1, '#0b0c0f');
    ctx.strokeStyle = wheelGrad;
    ctx.stroke();
    // Nan hoa giữa
    ctx.beginPath();
    ctx.moveTo(wx - wr * 0.62, wy - wr * 0.52);
    ctx.quadraticCurveTo(wx, wy - wr * 0.86, wx + wr * 0.62, wy - wr * 0.52);
    ctx.lineWidth = H * 0.05;
    ctx.strokeStyle = '#101216';
    ctx.stroke();
  }, [speed, rpm, gear, speedLimit, blinkerLeft, blinkerRight, headlights, handbrake, seatBelt, laneWarning, highBeam]);

  return (
    <div
      className="sim-bitmap-dash"
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: '38%', zIndex: 30,
        pointerEvents: 'none',
        userSelect: 'none'
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        width={1280}
        height={480}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};
