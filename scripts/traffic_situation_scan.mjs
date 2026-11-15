// 🚦 traffic_situation_scan.mjs — bot ghé các ngã tư (đèn / priority / rbl), chụp
// tình huống giao thông từ tầm mắt lái xe: đèn GLB + biển GLB + vạch.
// Kết quả: qa-situations/ix_<node>.png + manifest.json
// Chạy: node scripts/traffic_situation_scan.mjs
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'qa-situations');
mkdirSync(outDir, { recursive: true });
const map = JSON.parse(readFileSync(join(root, 'src/data/maps/berlin-mitte-clean.json'), 'utf8'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// nội suy curve như runtime (Catmull-Rom step 2)
const cache = new Map();
function roadCurve(road) {
  let hit = cache.get(road.id);
  if (hit) return hit;
  const THREE_G = null; // cần THREE — dùng bản cài sẵn qua playwright page thay vì node
  void THREE_G;
  throw new Error('use page-side computation');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/sim-dev?map=berlin');
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(6000);

  // chọn ngã tư: 6 đèn + 4 priority + 3 rbl
  const picks = [];
  const byRule = { traffic_light: [], priority_road: [], right_before_left: [] };
  for (const ix of map.intersections) byRule[ix.rule]?.push(ix);
  for (const ix of byRule.traffic_light.slice(0, 6)) picks.push({ ix, kind: 'light' });
  for (const ix of byRule.priority_road.slice(0, 4)) picks.push({ ix, kind: 'priority' });
  for (const ix of byRule.right_before_left.slice(0, 3)) picks.push({ ix, kind: 'rbl' });

  const manifest = [];
  for (const { ix, kind } of picks) {
    const node = map.nodes.find((n) => n.id === ix.nodeId);
    if (!node) continue;
    const touching = map.roads.filter((r) => r.from === ix.nodeId || r.to === ix.nodeId);
    // chọn approach: có đèn/biển 205 thì ưu tiên (situation rõ nhất)
    let road = touching[0];
    const with205 = (map.signs ?? []).filter((sg) => sg.type === '205' && touching.some((t) => t.id === sg.roadId));
    if (with205.length) road = map.roads.find((r) => r.id === with205[0].roadId) ?? road;
    // tính vị trí mắt lái ngay trong page (dùng THREE của app qua window? — không export;
    // thay thế: tính bằng evaluate nội suy Catmull-Rom thủ công bằng TOÁN thuần)
    const cam = await page.evaluate(({ roadId, nodeId }) => {
      const sc = window.__simScene;
      const m = sc.map;
      const road = m.roads.find((r) => r.id === roadId);
      if (!road) return null;
      // nội suy pointAt tương đương roadPointAt: dùng THREE trong bundle qua constructor
      // — dùng luôn THREE từ window.__THREE nếu vite expose? Không — dựng polyline đơn giản:
      const pts = road.points;
      let total = 0;
      for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const atNode = road.from === nodeId ? 0 : total;
      const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
      const s = atNode === 0 ? half + 9 : total - half - 9;
      // đi polyline tới s (xấp xỉ nội suy tuyến tính — đủ đặt camera)
      let rem = s, ax = pts[0][0], az = pts[0][1], px = ax, pz = az, tx = 0, tz = 1;
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
      // làn phải của luồng tới node: pháp tuyến phải flow = (−tz, tx)... 
      // flow về node: nếu atNode=total thì flow hướng tăng s ✓; nếu atNode=0 flow hướng −s → đảo
      const sgn = atNode === 0 ? -1 : 1;
      const fx = tx * sgn, fz = tz * sgn;
      const rx = -fz, rz = fx;
      const laneW = road.laneWidth;
      const laneOff = half >= laneW ? half - laneW / 2 : 0; // tâm làn phải nếu >1 làn
      return { x: px + rx * laneOff, z: pz + rz * laneOff, yaw: Math.atan2(-fx, -fz) };
    }, { roadId: road.id, nodeId: ix.nodeId });
    if (!cam) continue;

    await page.evaluate(({ x, z, yaw }) => {
      const sc = window.__simScene;
      sc.camera.position.set(x, 1.6, z);
      sc.camera.userData._setPose(yaw, -0.04);
    }, cam);
    // đợi chunk + 1 chu kỳ đèn để thấy màu
    await page.waitForFunction(() => {
      const sc = window.__simScene;
      const w = window;
      const s = sc.getStats();
      if (w.__lc === s.cellsLoaded) { w.__ls = (w.__ls ?? 0) + 1; } else { w.__ls = 0; w.__lc = s.cellsLoaded; }
      return w.__ls >= 4;
    }, { timeout: 9000, polling: 300 }).catch(() => {});
    await sleep(700);
    const name = `ix_${ix.nodeId}_${kind}.png`;
    await page.screenshot({ path: join(outDir, name) });
    manifest.push({ file: name, node: ix.nodeId, kind, road: road.id, roadName: road.name ?? '', cam });
    process.stdout.write('.');
  }
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nĐã chụp ${manifest.length} tình huống → ${outDir}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
