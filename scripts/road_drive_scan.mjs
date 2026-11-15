// 🚗 road_drive_scan.mjs — bot "lái" dọc các đoạn đường ngẫu nhiên: đặt camera tầm mắt
// lái trên LÀN ĐÚNG giữa mỗi đoạn, chụp soi lỗi render (hở mép, biển giữa đường, z-fight).
// Kết quả: qa-roads/road_<id>.png + manifest.json
// Chạy: node scripts/road_drive_scan.mjs
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'qa-roads');
mkdirSync(outDir, { recursive: true });
const map = JSON.parse(readFileSync(join(root, 'src/data/maps/berlin-mitte-clean.json'), 'utf8'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/sim-dev?map=berlin');
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(6000);

  // chọn 16 road có tên (quan trọng với gameplay), đủ dài, trải đều theo alphabet
  const roads = map.roads
    .filter((r) => r.name && r.points.length >= 2)
    .filter((r, i, arr) => arr.findIndex((x) => x.name === r.name) === i) // unique theo tên
    .sort((a, b) => a.name.localeCompare(b.name));
  const step = Math.max(1, Math.floor(roads.length / 16));
  const picked = roads.filter((_, i) => i % step === 0).slice(0, 16);

  const manifest = [];
  for (const road of picked) {
    const cam = await page.evaluate(({ roadId }) => {
      const sc = window.__simScene;
      const r = sc.map.roads.find((x) => x.id === roadId);
      if (!r) return null;
      const pts = r.points;
      let total = 0;
      for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      // giữa đoạn, trên làn phải: tâm = (half - laneW/2) về phía phải flow (flow = từ from→to)
      let rem = total / 2, ax = pts[0][0], az = pts[0][1], px = ax, pz = az, tx = 0, tz = 1;
      for (let i = 1; i < pts.length; i++) {
        const bx = pts[i][0], bz = pts[i][1];
        const seg = Math.hypot(bx - ax, bz - az) || 1;
        if (rem <= seg) {
          const t = rem / seg;
          px = ax + (bx - ax) * t; pz = az + (bz - az) * t;
          tx = (bx - ax) / seg; tz = (bz - az) / seg;
          break;
        }
        rem -= seg; ax = bx; az = bz;
      }
      const half = (r.lanesForward + r.lanesBackward) * r.laneWidth / 2;
      const laneW = r.laneWidth;
      const laneOff = half >= laneW ? half - laneW / 2 : 0; // tâm làn phải
      const rx = -tz, rz = tx; // phải flow
      // flow: từ from→to là chiều tăng s → nhìn theo (tx,tz)
      return { x: px + rx * laneOff, z: pz + rz * laneOff, yaw: Math.atan2(-tx, -tz) };
    }, { roadId: road.id });
    if (!cam) continue;

    await page.evaluate(({ x, z, yaw }) => {
      const sc = window.__simScene;
      sc.camera.position.set(x, 1.6, z);
      sc.camera.userData._setPose(yaw, -0.03);
    }, cam);
    await page.waitForFunction(() => {
      const sc = window.__simScene;
      const w = window;
      const s = sc.getStats();
      if (w.__lc === s.cellsLoaded) { w.__ls = (w.__ls ?? 0) + 1; } else { w.__ls = 0; w.__lc = s.cellsLoaded; }
      return w.__ls >= 4;
    }, { timeout: 9000, polling: 300 }).catch(() => {});
    await sleep(600);
    const name = `road_${road.id}.png`;
    await page.screenshot({ path: join(outDir, name) });
    manifest.push({ file: name, road: road.id, name: road.name, cam });
    process.stdout.write('.');
  }
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nĐã chụp ${manifest.length} đoạn đường → ${outDir}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
