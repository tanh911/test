// 📈 launch_chart.mjs — PHẦN 7B.3: biểu đồ tốc độ 3 xe liên tiếp sau đèn xanh (trước/sau sửa).
// Dùng chartSeries trong launch_telemetry_{before,after}.json (queue=3, repeat=0).
// Chạy: node scripts/launch_chart.mjs  → qa-roads/launch-chart-before-after.png
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (tag) => {
  const d = JSON.parse(readFileSync(join(root, 'scripts', `launch_telemetry_${tag}.json`), 'utf8'));
  const sc = d.scenarios.find(s => s.queue === 3 && s.repeat === 0);
  const stats = (arr) => {
    const a = arr.filter(x => x !== null && Number.isFinite(x));
    return { avg: a.reduce((s, x) => s + x, 0) / a.length, max: a.length ? Math.max(...a) : null, min: a.length ? Math.min(...a) : null };
  };
  const cars = sc.recs;
  return {
    series: d.chartSeries,
    stats: {
      t30: stats(cars.map(r => r.t0to30)),
      delay: stats(cars.slice(1).map(r => r.startVsLeader)),
      jerk: stats(cars.map(r => r.maxJerk)),
      accel: stats(cars.map(r => r.maxAccel)),
      gap: stats(cars.slice(1).map(r => r.minStoppedGap)),
    },
  };
};

const before = load('before');
const after = load('after');

const W = 920, H = 620, PAD = { l: 64, r: 24, t: 56, b: 58 };
const X_MAX = 18, Y_MAX = 45; // s, km/h
const px = t => PAD.l + (t / X_MAX) * (W - PAD.l - PAD.r);
const py = v => H - PAD.b - (v / Y_MAX) * (H - PAD.t - PAD.b);

function panel(d, title, tone, accents) {
  const gridX = [];
  for (let t = 0; t <= X_MAX; t += 3) gridX.push(`<line x1="${px(t)}" y1="${py(0)}" x2="${px(t)}" y2="${py(Y_MAX)}" stroke="#cbd5e1" stroke-width="1"/><text x="${px(t)}" y="${py(0) + 20}" font-size="13" text-anchor="middle" fill="#475569">${t}s</text>`);
  const gridY = [];
  for (let v = 0; v <= Y_MAX; v += 5) gridY.push(`<line x1="${px(0)}" y1="${py(v)}" x2="${px(X_MAX)}" y2="${py(v)}" stroke="${v % 15 === 0 ? '#94a3b8' : '#e2e8f0'}" stroke-width="${v % 15 === 0 ? 1 : 0.6}"/><text x="${px(0) - 8}" y="${py(v) + 4}" font-size="13" text-anchor="end" fill="#475569">${v}</text>`);
  // vạch 30 km/h tham chiếu
  const ref30 = `<line x1="${px(0)}" y1="${py(30)}" x2="${px(X_MAX)}" y2="${py(30)}" stroke="${accents.ref}" stroke-width="1.6" stroke-dasharray="7 5"/><text x="${px(X_MAX) - 4}" y="${py(30) - 6}" font-size="12" text-anchor="end" fill="${accents.ref}" font-weight="600">30 km/h</text>`;
  const colors = tone === 'red' ? ['#dc2626', '#f97316', '#a21caf'] : ['#15803d', '#0284c7', '#7c3aed'];
  const dashes = ['', '9 5', '2 5'];
  // 3 đường/panel: mỗi đường = 1 xe (nối các sample theo t)
  const lines = [0, 1, 2].map(i => {
    const pts = d.series.map(s => `${px(s.t).toFixed(1)},${py(Math.min(Y_MAX, (s.v[i] ?? 0) * 3.6)).toFixed(1)}`).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${colors[i]}" stroke-width="${i === 0 ? 2.6 : 2}" ${dashes[i] ? `stroke-dasharray="${dashes[i]}"` : ''}/>`;
  }).join('');
  const st = d.stats;
  const note = `
    <g font-size="13" fill="#334155">
      <rect x="${px(0) + 10}" y="${PAD.t + 8}" width="330" height="108" rx="8" fill="#ffffff" fill-opacity="0.85" stroke="#cbd5e1"/>
      <text x="${px(0) + 24}" y="${PAD.t + 30}">0→30 km/h: <tspan font-weight="700" fill="#0f172a">avg ${st.t30.avg.toFixed(2)}s · max ${st.t30.max.toFixed(2)}s</tspan></text>
      <text x="${px(0) + 24}" y="${PAD.t + 52}">Trễ khởi hành n→n+1: <tspan font-weight="700" fill="#0f172a">avg ${st.delay.avg.toFixed(2)}s · max ${st.delay.max.toFixed(2)}s</tspan></text>
      <text x="${px(0) + 24}" y="${PAD.t + 74}">aMax <tspan font-weight="700" fill="#0f172a">${st.accel.max.toFixed(2)} m/s²</tspan> · jerkMax <tspan font-weight="700" fill="#0f172a">${st.jerk.max.toFixed(0)} m/s³</tspan></text>
      <text x="${px(0) + 24}" y="${PAD.t + 96}">Gap đứng bumper min: <tspan font-weight="700" fill="#0f172a">${st.gap.min !== null ? st.gap.min.toFixed(2) : '—'} m</tspan></text>
    </g>`;
  return `
    <g>
      <text x="${W / 2}" y="30" font-size="19" font-weight="700" text-anchor="middle" fill="#0f172a">${title}</text>
      ${gridX.join('')}${gridY.join('')}${ref30}${lines}${note}
      <text x="${W / 2}" y="${H - 12}" font-size="13" text-anchor="middle" fill="#64748b">Thời gian sau khi đèn xanh (s) — hàng 3 xe, xe đầu (nét liền), xe 2 (gạch), xe 3 (chấm)</text>
      <text x="16" y="${H / 2}" font-size="14" fill="#475569" transform="rotate(-90 16 ${H / 2})" text-anchor="middle">Tốc độ (km/h)</text>
    </g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 2}" height="${H}">
  <rect width="${W * 2}" height="${H}" fill="#f8fafc"/>
  <g transform="translate(0,0)">${panel(before, 'TRƯỚC khi sửa (ACCEL 3.0 · không delay · jerk tự do)', 'red', { ref: '#b91c1c' })}</g>
  <g transform="translate(${W},0)"><line x1="0" y1="0" x2="0" y2="${H}" stroke="#94a3b8" stroke-width="2"/>${panel(after, 'SAU khi sửa (a 1.8 · jerk 2–3 · trễ phản xạ 0.8–1.4s)', 'green', { ref: '#15803d' })}</g>
  <text x="${W}" y="${H - 26}" font-size="15" font-weight="700" text-anchor="middle" fill="#0f172a">Khởi hành sau đèn đỏ — 50 ca headless, hàng 3 xe đại diện</text>
</svg>`;

const outDir = join(root, 'qa-roads');
mkdirSync(outDir, { recursive: true });
const html = `<!doctype html><html><body style="margin:0">${svg}</body></html>`;
const htmlPath = join(outDir, 'launch-chart.html');
writeFileSync(htmlPath, html);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: W * 2, height: H } });
await page.goto('file:///' + htmlPath.replace(/\\/g, '/'));
await page.screenshot({ path: join(outDir, 'launch-chart-before-after.png') });
await browser.close();
console.log('Saved qa-roads/launch-chart-before-after.png');
