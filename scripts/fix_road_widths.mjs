// 📐 fix_road_widths.mjs — sửa lanes/laneWidth cho berlin-mitte-clean.json từ tag OSM thật
// (scripts/osm_pbf_extracted_stadt.json). Bản đồ hiện có 90 road 3 m (1 làn) kể cả Unter
// den Linden (OSM: oneway=yes, lanes 2-3, width 11-14.5 m) → nhìn như ngõ, xe không vừa.
// Quy tắc (mirror StVO/OSM):
//   • oneway=yes  → lanesForward = lanes (mặc định primary/secondary: 2, residential: 1)
//   • hai chiều   → forward = ceil(lanes/2), backward = floor(lanes/2); mặc định 1/1
//   • laneWidth = width_tag/lanes nếu có width, không thì 3.2 (residential) / 3.4 (tertiary)
//     / 3.5 (primary/secondary); clamp [3.0, 3.75]
//   • Mức tối ưu lái được: one-way ≥ 3.4 m, hai chiều ≥ 6.4 m
// Match road ↔ way: tên (bỏ hoa/token ß→ss) + khoảng cách hình học gần nhất.
// Chạy: node scripts/fix_road_widths.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = join(root, 'src/data/maps/berlin-mitte-clean.json');
const osmPath = join(root, 'scripts/osm_pbf_extracted_stadt.json');
const backupPath = join(root, 'scripts/berlin_map_before_width_fix.json');

const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const osm = JSON.parse(readFileSync(osmPath, 'utf8'));

if (!existsSync(backupPath)) {
  writeFileSync(backupPath, JSON.stringify(map, null, 2), 'utf8');
  console.log('Backup map →', backupPath);
}

const norm = (s) => (s || '').toLowerCase().replaceAll('ß', 'ss').replaceAll('▀', 'ss').replace(/\s+/g, ' ').trim();

// polyline của way trong hệ tọa độ map (nodes là lat/lon → quy đổi CÙNG GỐC như osm_to_roadgraph)
const R = 6371000, refLat = 52.5170, refLon = 13.3888;
const toXY = (lat, lon) => [
  ((lon - refLon) * Math.PI) / 180 * R * Math.cos((refLat * Math.PI) / 180),
  ((lat - refLat) * Math.PI) / 180 * R,
];
const nodeById = new Map(Object.entries(osm.nodes).map(([id, n]) => [String(id), n]));
const waysByStreet = new Map();
for (const w of osm.ways || []) {
  const name = norm(w.tags?.name);
  if (!name) continue;
  const pts = (w.nodes || []).map((id) => nodeById.get(String(id))).filter(Boolean)
    .map((n) => (n.lat !== undefined ? toXY(n.lat, n.lon) : [n.x, n.z]));
  if (pts.length < 2) continue;
  if (!waysByStreet.has(name)) waysByStreet.set(name, []);
  waysByStreet.get(name).push({ tags: w.tags, pts });
}

// khoảng cách điểm→polyline
function distToPoly(x, z, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1];
    const l = Math.hypot(dx, dz);
    if (l < 1e-9) continue;
    const t = Math.max(0, Math.min(l, (x - pts[i][0]) * dx / l + (z - pts[i][1]) * dz / l));
    best = Math.min(best, Math.hypot(x - (pts[i][0] + dx / l * t), z - (pts[i][1] + dz / l * t)));
  }
  return best;
}
function wayDist(roadPts, wayPts) {
  let s = 0, n = 0;
  for (let i = 0; i < roadPts.length; i += Math.max(1, Math.floor(roadPts.length / 6))) {
    s += distToPoly(roadPts[i][0], roadPts[i][1], wayPts); n++;
  }
  return s / Math.max(1, n);
}

function deriveWidths(tags) {
  const hw = tags.highway || 'residential';
  const oneWay = ['yes', 'true', '1'].includes(tags.oneway);
  const num = (v) => { const x = parseFloat(v); return Number.isFinite(x) ? x : null; };
  let lanesF = num(tags['lanes:forward']);
  let lanesB = num(tags['lanes:backward']);
  let lanes = num(tags.lanes);
  const widthTag = num(tags.width);
  if (lanes === null && (lanesF !== null || lanesB !== null)) lanes = (lanesF || 0) + (lanesB || 0);

  // mặc định theo class nếu OSM không ghi
  if (lanes === null) {
    if (oneWay) lanes = hw === 'primary' || hw === 'secondary' ? 2 : 1;
    else lanes = hw === 'primary' || hw === 'secondary' ? 4 : 2;
  }
  let laneW = hw === 'primary' || hw === 'secondary' ? 3.5 : hw === 'tertiary' ? 3.4 : 3.2;
  if (widthTag && lanes > 0) laneW = Math.min(3.75, Math.max(3.0, widthTag / lanes));
  if (lanesF === null || lanesB === null) {
    if (oneWay) { lanesF = Math.max(1, Math.round(lanes)); lanesB = 0; }
    else { lanesF = Math.ceil(lanes / 2); lanesB = Math.max(0, Math.floor(lanes / 2)); }
  }
  let total = lanesF + lanesB;
  // mức tối thiểu lái được
  if (oneWay && total * laneW < 3.4) laneW = 3.4 / total;
  if (!oneWay && total * laneW < 6.4) laneW = 6.4 / total;
  laneW = Math.min(3.75, Math.max(3.0, +laneW.toFixed(2)));
  return { lanesForward: lanesF, lanesBackward: lanesB, laneWidth: laneW };
}

let changed = 0, matchedWay = 0, fallback = 0;
const before = new Map(map.roads.map((r) => [r.id, r]));
for (const r of map.roads) {
  const name = norm(r.name);
  let tags = null;
  if (name && waysByStreet.has(name)) {
    let best = null;
    for (const cand of waysByStreet.get(name)) {
      const d = wayDist(r.points, cand.pts);
      if (!best || d < best.d) best = { d, tags: cand.tags };
    }
    // way trong extraction là CHORD thô (chỉ còn node giao lộ) — có thể lệch 40 m+
    // → ngưỡng nới 65 m, chỉ dùng để nhận TAGS cùng tên đường, không dùng hình học
    if (best && best.d < 65) tags = best.tags;
    if (tags) matchedWay++;
  }
  let nw;
  if (tags) nw = deriveWidths(tags);
  else {
    fallback++;
    // không match được: nếu đang 3 m 1 làn → coi như ngõ hai chiều 6.4 m (an toàn để lái)
    const w = (r.lanesForward + r.lanesBackward) * r.laneWidth;
    nw = w <= 3.2 && r.lanesBackward === 0
      ? { lanesForward: 1, lanesBackward: 1, laneWidth: 3.2 }
      : null;
  }
  if (!nw) continue;
  const old = `${r.lanesForward}/${r.lanesBackward}×${r.laneWidth}`;
  const neu = `${nw.lanesForward}/${nw.lanesBackward}×${nw.laneWidth}`;
  if (old !== neu) {
    r.lanesForward = nw.lanesForward;
    r.lanesBackward = nw.lanesBackward;
    r.laneWidth = nw.laneWidth;
    changed++;
  }
}

writeFileSync(mapPath, JSON.stringify(map, null, 2), 'utf8');

// thống kê sau sửa
const dist = {};
for (const r of map.roads) {
  const w = (r.lanesForward + r.lanesBackward) * r.laneWidth;
  dist[w] = (dist[w] || 0) + 1;
}
console.log(`
────────────────────────────────────────
Roads đổi width          : ${changed}/${map.roads.length}
  ├ match được OSM way   : ${matchedWay}
  └ fallback heuristic   : ${fallback}
Phân bố width sau sửa    : ${Object.entries(dist).sort((a, b) => a[0] - b[0]).map(([w, n]) => `${w}m×${n}`).join('  ')}
────────────────────────────────────────
Tiếp: node scripts/import_berlin_signs.mjs && npx vitest run src/world/roadAudit.test.ts
`);
