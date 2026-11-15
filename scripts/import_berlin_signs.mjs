// 🪧 import_berlin_signs.mjs — đổ biển báo THỰC (WFS GDI-Berlin "Straßenbefahrung") vào
// berlin-mitte-clean.json, thay signs[] sinh giả (add_signs.mjs) + HOÀN THIỆN biển luật thi.
// Nguồn: https://gdi.berlin.de/services/wfs/strassenbefahrung — layer aa_verkehrszeichen,
// license dl-de-zero-2.0 (≈ CC0), khảo sát 2014/2015. Mỗi cột (mast) có vkz_zeiche =
// danh sách mã StVO gộp 1 cột — khớp cơ chế bucket của sim (≤3 bảng/cột, ≤1.6 m).
//
// Chiến lược HYBRID (road graph chỉ phủ ~1/3 đường phố thật):
//   1) Biển THỰC: snap masts vào road gần nhất (≤12 m) — sai vị trí thì bỏ, không đoán.
//   2) Biển HOÀN THIỆN (synthetic): 306/205 tại junction priority_road + 267 tại đường
//      một chiều — CHỈ nơi data thật không có (bảo đảm luật thi, passing roadAudit.test).
// Không có azimuth (lage=99 hết) → side tính hình học, flip theo chiều:
//   flip=false → phục vụ chiều from→to (sim vẽ mặt quay ngược flow), flip=true → chiều ngược.
// Chạy: node scripts/import_berlin_signs.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = join(root, 'src/data/maps/berlin-mitte-clean.json');
const cachePath = join(root, 'scripts/berlin_signs_wfs_cache.json');
const backupPath = join(root, 'scripts/berlin_signs_synthetic_backup.json');

// ── Quy đổi lat/lon → mét local: CÙNG GỐC với osm_to_roadgraph.py / add_water.mjs ──
const R = 6371000, refLat = 52.5170, refLon = 13.3888;
const toXY = (lat, lon) => [
  ((lon - refLon) * Math.PI) / 180 * R * Math.cos((refLat * Math.PI) / 180),
  ((lat - refLat) * Math.PI) / 180 * R,
];

const WFS = 'https://gdi.berlin.de/services/wfs/strassenbefahrung';
const PAGE = 1000;
const MAX_SNAP = 12;   // m — quá xa road coi như biển của con đường không có trong graph
const BUILDING_DEPTH = 9;  // = buildings.ts
const SWEEP_STEP = 3;      // = buildings.ts

// ── Bảng mã StVO → MapSign.type (chỉ import loại sim có SIGN_DEFS) ──
const SIM_TYPES = new Set(['205','206','301','306','102','274','274.1','220','267','283','286','314','350','101','138','215']);
function mapCode(raw) {
  const c = raw.trim();
  if (!c || c === 'SZ') return null;               // SZ = ký hiệu không xác định
  if (/^1\d{3}/.test(c)) return null;              // 10xx = Zusatzzeichen (bảng phụ dưới biển chính)
  if (/^e\d/i.test(c)) return null;                // e600… = mã điện/thiết bị
  const base = c.split('-')[0];
  if (base === '274' && c.includes('.')) {         // 274.1 (Zone-Anfang); 274.2 (Ende) sim không có def
    return c.startsWith('274.1') ? { type: '274.1' } : null;
  }
  if (base === '274') {                            // 274-30 → value 30
    const v = parseInt(c.split('-')[1], 10);
    return Number.isFinite(v) && v >= 3 && v <= 130 ? { type: '274', value: v } : null;
  }
  if (SIM_TYPES.has(base)) return { type: base };  // 283-10 / 314-20 / 220-10 / 286-30… → loại gốc
  return null;
}

async function fetchSigns() {
  if (existsSync(cachePath)) {
    console.log('Dùng cache WFS:', cachePath);
    return JSON.parse(readFileSync(cachePath, 'utf8'));
  }
  const dLat = (674 / R) * 180 / Math.PI;
  const dLon = dLat / Math.cos((refLat * Math.PI) / 180);
  const bboxStr = [refLat - dLat - 3e-4, refLon - dLon - 4e-4, refLat + dLat + 3e-4, refLon + dLon + 4e-4].join(',');
  const out = [];
  for (let start = 0; ; start += PAGE) {
    const url = `${WFS}?service=WFS&version=2.0.0&request=GetFeature&typeNames=aa_verkehrszeichen`
      + `&outputFormat=application/json&srsName=urn:ogc:def:crs:EPSG::4326&bbox=${bboxStr},urn:ogc:def:crs:EPSG::4326&count=${PAGE}&startindex=${start}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`WFS HTTP ${res.status}`);
    const d = await res.json();
    out.push(...(d.features || []));
    process.stdout.write(`\r  WFS: ${out.length}/${d.totalFeatures ?? '?'} cột`);
    if (out.length >= (d.totalFeatures ?? 0) || !(d.features || []).length) break;
  }
  process.stdout.write('\n');
  writeFileSync(cachePath, JSON.stringify(out), 'utf8');
  return out;
}

// ── Geometry helpers — đôi xứng với mapLoader.ts / roadAudit.test.ts ──
function prepRoads(map) {
  return map.roads.map((r) => {
    const seg = [];
    let len = 0;
    for (let i = 0; i < r.points.length - 1; i++) {
      const dx = r.points[i + 1][0] - r.points[i][0], dz = r.points[i + 1][1] - r.points[i][1];
      const l = Math.hypot(dx, dz);
      if (l < 1e-9) continue;
      seg.push({ ax: r.points[i][0], az: r.points[i][1], tx: dx / l, tz: dz / l, s0: len, l });
      len += l;
    }
    return { road: r, seg, len };
  });
}
const halfWidth = (r) => ((r.lanesForward + r.lanesBackward) * r.laneWidth) / 2;
const distToRoad = (roads, x, z) => {
  let best = Infinity;
  for (const rr of roads) {
    for (const g of rr.seg) {
      const t = Math.max(0, Math.min(g.l, (x - g.ax) * g.tx + (z - g.az) * g.tz));
      best = Math.min(best, Math.hypot(x - (g.ax + g.tx * t), z - (g.az + g.tz * t)));
    }
  }
  return best;
};
function snap(roads, x, z) {
  let best = null;
  for (const rr of roads) {
    for (const g of rr.seg) {
      const t = Math.max(0, Math.min(g.l, (x - g.ax) * g.tx + (z - g.az) * g.tz));
      const px = g.ax + g.tx * t, pz = g.az + g.tz * t;
      const d = Math.hypot(x - px, z - pz);
      if (!best || d < best.dist) {
        const cross = g.tx * (z - pz) - g.tz * (x - px); // >0: cùng phía right-vector (-tz,tx) của sim
        best = { road: rr.road, len: rr.len, dist: d, s: g.s0 + t, side: cross > 0 ? 'right' : 'left', px, pz, tx: g.tx, tz: g.tz };
      }
    }
  }
  return best;
}
// Building strips: ĐỌC TỪ DUMP RUNTIME (src/world/dumpStrips.test.ts dùng chính
// buildings.ts) — parity tuyệt đối với runtime, hết lệch polyline-vs-curve làm
// skip sai 125 cột hợp lệ (bug coverage 43%).
const stripsRuntime = JSON.parse(readFileSync(join(root, 'scripts/strips_dump.json'), 'utf8'));
const curvesRuntime = JSON.parse(readFileSync(join(root, 'scripts/curves_dump.json'), 'utf8'));
/** roadPointAt đúng như mapLoader (nội suy giữa curve samples đã dump) */
function roadPointAtEq(roadId, s) {
  const c = curvesRuntime[roadId];
  if (!c) return null;
  const cl = Math.max(0, Math.min(c.length, s));
  const f = (c.pts.length - 1) * (c.length > 0 ? cl / c.length : 0);
  const i = Math.min(c.pts.length - 2, Math.floor(f));
  const t = Math.max(0, Math.min(1, f - i));
  const a = c.pts[i], b = c.pts[i + 1];
  return {
    x: a[0] + (b[0] - a[0]) * t,
    z: a[1] + (b[1] - a[1]) * t,
    nx: a[2] + (b[2] - a[2]) * t,
    nz: a[3] + (b[3] - a[3]) * t,
  };
}
function polyLen(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}
function polyPointAt(pts, s) {
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1];
    const l = Math.hypot(dx, dz);
    if (acc + l >= s) {
      const tx = dx / l, tz = dz / l, t = s - acc;
      return { x: pts[i][0] + tx * t, z: pts[i][1] + tz * t, tx, tz, heading: Math.atan2(tx, tz) };
    }
    acc += l;
  }
  const dx = pts[pts.length - 1][0] - pts[pts.length - 2][0], dz = pts[pts.length - 1][1] - pts[pts.length - 2][1];
  const l = Math.hypot(dx, dz) || 1;
  return { x: pts[pts.length - 1][0], z: pts[pts.length - 1][1], tx: dx / l, tz: dz / l, heading: Math.atan2(dx / l, dz / l) };
}
// Kiểm tra vị trí đứng của cột biển (giống audit): không giữa đường (road khác) / trong nhà
function posClear(roads, strips, x, z) {
  for (const rr of roads) {
    if (distToRoad([rr], x, z) < halfWidth(rr.road) - 0.3) return false;
  }
  for (const [a, b, c, d] of strips) {
    if (x > a && x < c && z > b && z < d) return false;
  }
  return true;
}

// ── Main ──
const map = JSON.parse(readFileSync(mapPath, 'utf8'));
console.log(`Map: ${map.roads.length} roads, hiện có ${map.signs.length} signs`);

if (!existsSync(backupPath)) {
  writeFileSync(backupPath, JSON.stringify(map.signs, null, 2), 'utf8');
  console.log('Backup signs cũ →', backupPath);
}

const masts = await fetchSigns();
const roads = prepRoads(map);
const roadsById = new Map(map.roads.map((r) => [r.id, r]));
const strips = stripsRuntime;

// ── 1. Biển THỰC ──
const realSigns = [];
const stats = {
  mastsTotal: masts.length, mastsUsed: 0, mastsNoCode: 0, mastsTooFar: 0,
  skippedClash: 0, signs: 0, byType: new Map(), flipTrue: 0, snapDists: [],
};
const seen = new Set();
const normName = (s) => (s || '').toLowerCase().replaceAll('ß', 'ss').replace(/\s+/g, ' ').trim();
let nameMatch = 0, nameChecked = 0;

for (const f of masts) {
  const p = f.properties || {};
  let [lon, lat] = f.geometry.coordinates; // server trả lon,lat (verify: 13.4 lon < 52.5 lat)
  if (lat < lon) [lon, lat] = [lat, lon];
  const [x, z] = toXY(lat, lon);

  const codes = [...new Set((p.vkz_zeiche || '').split(',').map(mapCode).filter(Boolean))];
  if (!codes.length) { stats.mastsNoCode++; continue; }

  const hit = snap(roads, x, z);
  // Biển thật đứng ở CURB: cột cách tim đường quá xa (quảng trường/pedestrian
  // zone rộng) = snap nhầm road → bỏ (tránh biển đứng giữa sânoplaza)
  if (!hit || hit.dist > MAX_SNAP || hit.dist > halfWidth(hit.road) + 6 || hit.len < 5 || hit.s < 1.5 || hit.s > hit.len - 1.5) { stats.mastsTooFar++; continue; }

  // s theo CHIỀU DÀI CURVE (runtime) — tìm sample curve gần điểm snap, dùng MỘT
  // s duy nhất cho cả posClear lẫn sign.s (tránh check chỗ này render chỗ khác)
  const half = halfWidth(hit.road);
  const cRt = curvesRuntime[hit.road.id];
  let sCurve = hit.s;
  if (cRt) {
    let bd2 = Infinity, bi = 0;
    for (let i = 0; i < cRt.pts.length; i++) {
      const dd = Math.hypot(cRt.pts[i][0] - hit.px, cRt.pts[i][1] - hit.pz);
      if (dd < bd2) { bd2 = dd; bi = i; }
    }
    sCurve = Math.round(((cRt.length * bi) / (cRt.pts.length - 1)) * 10) / 10;
  }
  const ptCurve = roadPointAtEq(hit.road.id, sCurve);
  const sgn = hit.side === 'right' ? 1 : -1;
  const sx = ptCurve.x + ptCurve.nx * sgn * (half + 1.2);
  const sz = ptCurve.z + ptCurve.nz * sgn * (half + 1.2);
  if (!posClear(roads, strips, sx, sz)) { stats.skippedClash++; continue; }
  if (sCurve < 1.5 || sCurve > cRt.length - 1.5) { stats.skippedClash++; continue; }

  // Đường một chiều: mọi biển phục vụ chiều duy nhất; hai chiều: biển bên trái from→to
  // là "bên phải" của chiều ngược → flip
  const fwd = hit.road.lanesForward > 0, bwd = hit.road.lanesBackward > 0;
  const flip = fwd && !bwd ? false : !fwd && bwd ? true : hit.side === 'left';

  stats.mastsUsed++;
  stats.snapDists.push(hit.dist);
  nameChecked++;
  if (normName(p.strasse) && normName(p.strasse) === normName(hit.road.name)) nameMatch++;

  for (const { type, value } of codes) {
    const key = `${hit.road.id}|${type}|${value ?? ''}|${hit.side}|${Math.round(hit.s / 2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    realSigns.push({
      type, roadId: hit.road.id, s: Math.round(sCurve * 10) / 10, side: hit.side,
      ...(value !== undefined ? { value } : {}), ...(flip ? { flip: true } : {}),
    });
    stats.signs++;
    stats.byType.set(type, (stats.byType.get(type) || 0) + 1);
    if (flip) stats.flipTrue++;
  }
}

// ── 2. HOÀN THIỆN biển luật thi (synthetic, chỉ nơi thật không phủ) ──
const hasSignNear = (roadId, type, s, tol = 15) =>
  realSigns.some((sg) => sg.roadId === roadId && sg.type === type && Math.abs(sg.s - s) < tol);
// thử đặt tại s, dịch 2 m/bước (±12 m) tới khi vị trí thoáng
function placeSynthetic(type, roadId, s, side, flip, value) {
  const road = roadsById.get(roadId);
  if (!road) return null;
  const len = polyLen(road.points);
  const offsets = [0, 2, -2, 4, -4, 6, -6, 8, -8, 10, -10, 12, -12];
  for (const o of offsets) {
    const sTry = s + o;
    if (sTry < 2 || sTry > len - 2) continue;
    if (hasSignNear(roadId, type, sTry, 12)) continue;
    const ptC = roadPointAtEq(roadId, sTry);
    const half = halfWidth(road);
    const sgn = side === 'right' ? 1 : -1;
    const sx = ptC.x + ptC.nx * sgn * (half + 1.2);
    const sz = ptC.z + ptC.nz * sgn * (half + 1.2);
    if (posClear(roads, strips, sx, sz)) {
      return { type, roadId, s: Math.round(sTry * 10) / 10, side, ...(value !== undefined ? { value } : {}), ...(flip ? { flip: true } : {}) };
    }
  }
  return null;
}
let synAdded = { '306': 0, '205': 0, '267': 0 };
const nodeIsIx = new Set(map.intersections.map((ix) => ix.nodeId));
const synthetic = [];
for (const ix of map.intersections) {
  if (ix.rule !== 'priority_road') continue;
  const touching = map.roads.filter((r) => r.from === ix.nodeId || r.to === ix.nodeId);
  const already = realSigns.some((sg) => (sg.type === '205' || sg.type === '306') && touching.some((r) => r.id === sg.roadId));
  if (already) continue;
  // 306 trên nhánh main (đầu nối vào junction); thiếu thì 205 trên nhánh nhường đường.
  // Biển chiếu về xe đang tiến tới junction: junction ở `to` → flip=false/side right;
  // junction ở `from` → xe đi ngược flow, side phải của HỌ = trái hình học → flip=true/side left.
  let placed = null;
  for (const r of touching.filter((r) => r.priority === 'main')) {
    const atTo = r.to === ix.nodeId;
    placed = placeSynthetic('306', r.id, atTo ? polyLen(r.points) - 8 : 8, atTo ? 'right' : 'left', !atTo);
    if (placed) break;
  }
  if (!placed) {
    for (const r of touching.filter((r) => r.priority !== 'main')) {
      const atTo = r.to === ix.nodeId;
      placed = placeSynthetic('205', r.id, atTo ? polyLen(r.points) - 8 : 8, atTo ? 'right' : 'left', !atTo);
      if (placed) break;
    }
  }
  if (placed) { synthetic.push(placed); synAdded[placed.type]++; }
}
for (const r of map.roads) {
  const oneWay = r.lanesBackward === 0 || r.lanesForward === 0;
  if (!oneWay) continue;
  const wrongEnd = r.lanesBackward === 0 ? r.to : r.from; // đầu NGƯỢC chiều luật
  if (!nodeIsIx.has(wrongEnd)) continue;
  if (realSigns.some((sg) => sg.roadId === r.id && sg.type === '267')) continue;
  // 267 chiếu về xe đi ngược luật — đứng bên phải CỦA HỌ:
  // one-way forward (ngược chiều = đi -flow) → flip=true, side left; backward → flip=false, side right
  const len = polyLen(r.points);
  const placed = r.lanesBackward === 0
    ? placeSynthetic('267', r.id, len - 6, 'left', true)
    : placeSynthetic('267', r.id, 6, 'right', false);
  if (placed) { synthetic.push(placed); synAdded['267']++; }
}

map.signs = [...realSigns, ...synthetic];
writeFileSync(mapPath, JSON.stringify(map, null, 2), 'utf8');

// ── 3. Báo cáo ──
const pct = (arr, q) => arr.slice().sort((a, b) => a - b)[Math.floor(q * (arr.length - 1))];
console.log(`
────────────────────────────────────────────
Cột biển WFS trong vùng map : ${stats.mastsTotal}
  ├ dùng được               : ${stats.mastsUsed}
  ├ không còn mã hợp lệ     : ${stats.mastsNoCode}  (SZ / chỉ Zusatzzeichen)
  ├ quá xa road (>12 m)     : ${stats.mastsTooFar}  (đường không có trong graph)
  └ vị trí đè road/nhà      : ${stats.skippedClash}
Biển THỰC đã đặt            : ${stats.signs}  (flip=true: ${stats.flipTrue})
  ${[...stats.byType.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}:${n}`).join('  ')}
Biển HOÀN THIỆN (luật thi)  : ${synthetic.length}  { 306:${synAdded['306']}  205:${synAdded['205']}  267:${synAdded['267']} }
TỔNG signs trong map        : ${map.signs.length}
Snap distance p50/p90       : ${pct(stats.snapDists, .5).toFixed(1)} m / ${pct(stats.snapDists, .9).toFixed(1)} m
Tên road khớp strasse WFS   : ${nameMatch}/${nameChecked} = ${((nameMatch / Math.max(1, nameChecked)) * 100).toFixed(0)}%
────────────────────────────────────────────
Tiếp: npx vitest run src/world/roadAudit.test.ts src/world/map-clean.test.ts`);
