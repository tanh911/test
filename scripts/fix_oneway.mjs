// 🚧 fix_oneway.mjs — PHẦN 11.2: một nguồn sự thật cho hướng = tag oneway OSM.
// O1: 26 road graph hai chiều nhưng OSM oneway=yes → áp oneway (check HƯỚNG way bằng dot-product)
// O4: r208/r280 UdL lanes 3→2 theo OSM
// O2: r149 Universitätsstraße — theo tag OSM (oneway → oneway; hai chiều → bỏ 267)
// O3: r38 Friedrichstraße — 267 chuyển sang đầu CẤM (to-end), thêm 220 ở đầu vào
// Idempotent: chạy lại trên map đã sửa = không đổi gì. Backup trước lần chạy đầu.
// Chạy: node scripts/fix_oneway.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = join(root, 'src/data/maps/berlin-mitte-clean.json');
const backupPath = join(root, 'scripts/berlin_map_before_oneway_fix.json');
const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const osm = JSON.parse(readFileSync(join(root, 'scripts/osm_pbf_extracted_stadt.json'), 'utf8'));
if (!existsSync(backupPath)) writeFileSync(backupPath, JSON.stringify(map, null, 2), 'utf8');

const norm = (s) => (s || '').toLowerCase().replaceAll('ß', 'ss').replaceAll('▀', 'ss').replace(/\s+/g, ' ').trim();
const R = 6371000, refLat = 52.5170, refLon = 13.3888;
const toXY = (lat, lon) => [
  ((lon - refLon) * Math.PI) / 180 * R * Math.cos((refLat * Math.PI) / 180),
  ((lat - refLat) * Math.PI) / 180 * R,
];
const waysByStreet = new Map();
for (const w of osm.ways || []) {
  const name = norm(w.tags?.name);
  if (!name) continue;
  if (!waysByStreet.has(name)) waysByStreet.set(name, []);
  const pts = (w.refs || w.nodes || []).map(id => osm.nodes[String(id)]).filter(Boolean).map(n => toXY(n.lat, n.lon));
  if (pts.length >= 2) waysByStreet.get(name).push(w);
}
function polyMid(pts) { let L = 0, mx = 0, mz = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); L += d; mx += ((pts[i-1][0]+pts[i][0])/2)*d; mz += ((pts[i-1][1]+pts[i][1])/2)*d; } return L > 0 ? [mx/L, mz/L] : pts[0]; }
function matchWay(road) {
  const cands = waysByStreet.get(norm(road.name));
  if (!cands?.length) return null;
  const rm = polyMid(road.points.map(p => [p[0], p[1]]));
  let best = null, bestD = Infinity;
  for (const w of cands) {
    const pts = (w.refs || w.nodes || []).map(id => osm.nodes[String(id)]).filter(Boolean).map(n => toXY(n.lat, n.lon));
    if (pts.length < 2) continue;
    const d = Math.hypot(polyMid(pts)[0] - rm[0], polyMid(pts)[1] - rm[1]);
    if (d < bestD) { bestD = d; best = w; }
  }
  return bestD < 180 ? best : null;
}
/** HƯỚNG way so với road: dot giữa vector đầu-cuối của mỗi polyline (>0 = cùng chiều) */
function wayAligned(road, way) {
  const pts = (way.refs || way.nodes || []).map(id => osm.nodes[String(id)]).filter(Boolean).map(n => toXY(n.lat, n.lon));
  if (pts.length < 2) return true;
  const wx = pts.at(-1)[0] - pts[0][0], wz = pts.at(-1)[1] - pts[0][1];
  const rx = road.points.at(-1)[0] - road.points[0][0], rz = road.points.at(-1)[1] - road.points[0][1];
  return wx * rx + wz * rz > 0;
}
const defaultLanes = (hw) => (['primary', 'secondary', 'primary_link', 'secondary_link'].includes(hw) ? 2 : 1);

let changes = 0;
const log = [];

// ── O1 + O2: road hai chiều trong graph — xét tag OSM ──
for (const road of map.roads) {
  if (road.lanesBackward === 0) continue; // đã oneway
  const way = matchWay(road);
  const oneway = way?.tags?.oneway;
  if (oneway === 'yes') {
    const lanes = Math.max(1, parseInt(way.tags?.lanes ?? defaultLanes(way.tags?.highway), 10));
    const aligned = wayAligned(road, way);
    // đã đúng hướng oneway → skip (idempotency: chạy lại không đếm thay đổi ảo)
    if (aligned && road.lanesForward > 0 && road.lanesBackward === 0) continue;
    if (!aligned && road.lanesBackward > 0 && road.lanesForward === 0) continue;
    if (aligned) { road.lanesForward = lanes; road.lanesBackward = 0; }
    else { road.lanesForward = 0; road.lanesBackward = lanes; }
    changes++;
    log.push(`O1 ${road.id} "${road.name}" → oneway ${aligned ? 'F' : 'B'}${lanes} (OSM oneway=yes lanes=${way.tags?.lanes ?? 'def'})`);
  } else if (oneway === '-1') {
    // oneway=-1: chiều ngược way
    const lanes = Math.max(1, parseInt(way.tags?.lanes ?? defaultLanes(way.tags?.highway), 10));
    const aligned = wayAligned(road, way);
    if (!aligned && road.lanesForward > 0 && road.lanesBackward === 0) continue;
    if (aligned && road.lanesBackward > 0 && road.lanesForward === 0) continue;
    if (aligned) { road.lanesForward = 0; road.lanesBackward = lanes; }
    else { road.lanesForward = lanes; road.lanesBackward = 0; }
    changes++;
    log.push(`O1 ${road.id} "${road.name}" → oneway -1 ${aligned ? 'B' : 'F'}${lanes}`);
  }
}

// ── O1w: oneway 1 làn phải ≥ 3.4 m (chuẩn fix_road_widths "one-way ≥ 3.4") — laneWidth
// kế thừa từ thời hai chiều có thể 3.0–3.2 → xe bot/player không vừa (guard C fullRoadAudit) ──
for (const road of map.roads) {
  if (road.lanesForward + road.lanesBackward === 1 && road.laneWidth < 3.4) {
    log.push(`O1w ${road.id} "${road.name}" laneWidth ${road.laneWidth} → 3.4 (oneway 1 làn)`);
    road.laneWidth = 3.4;
    changes++;
  }
}

// ── O4: r208/r280 UdL lanes 3→2 ──
for (const road of map.roads) {
  const way = matchWay(road);
  if (!way) continue;
  const lanes = parseInt(way.tags?.lanes ?? '0', 10);
  if (road.lanesBackward === 0 && lanes > 0 && road.lanesForward !== lanes && road.lanesForward > lanes) {
    log.push(`O4 ${road.id} "${road.name}" lanesF ${road.lanesForward} → ${lanes} (OSM lanes=${lanes})`);
    road.lanesForward = lanes;
    changes++;
  }
}

// ── O2 removal: road hai chiều (sau O1-fix vẫn hai chiều) CÓ MATCH OSM hai chiều mới xóa 267.
// Road match FAIL (vd r149 Universitätsstraße — extract thiếu way) → GIỮ biển: cột WFS là
// sự thật biển báo, xóa mù quáng làm mất phủ WFS (guard B rớt 94.65%) → onewayExceptions.
const removed267 = [];
map.signs = map.signs.filter(s => {
  if (s.type !== '267') return true;
  const road = map.roads.find(r => r.id === s.roadId);
  if (road && road.lanesBackward > 0 && matchWay(road)) { removed267.push(`${s.roadId}@s=${s.s?.toFixed?.(0)}`); return false; }
  return true;
});
if (removed267.length) { changes++; log.push(`O2 bỏ ${removed267.length} biển 267 trên road hai chiều có match OSM: ${removed267.join(', ')}`); }

// ── O2-exception: r149 Universitätsstraße — match OSM FAIL + cột WFS thật có 267 →
// giữ biển trên road hai chiều, ghi onewayExceptions chờ đối chiếu OSM chi tiết ──
{
  const has149 = map.signs.some(s => s.type === '267' && s.roadId === 'r149');
  if (!has149) {
    map.signs.push({ type: '267', roadId: 'r149', s: 103, side: 'left', src: 'wfs-kept-oneway-exception' });
    changes++;
    log.push('O2-exc khôi phục 267 r149 Universitätsstraße @s=103 (WFS thật, match OSM fail → exception)');
  }
}

// ── O3: 267 trên oneway đặt ở đầu VÀO (s < 25% len) → chuyển sang đầu cấm (to-end cho
// flow from→to, from-end cho flow to→from), giữ không flip (mặt quay ngược flow = nhìn
// thấy từ phía cấm). Thêm 220 ở đầu vào hợp pháp (s=6, cùng side). ──
const lenOf = (road) => Math.hypot(road.points.at(-1)[0] - road.points[0][0], road.points.at(-1)[1] - road.points[0][1]) || 1;
for (const s of map.signs) {
  if (s.type !== '267') continue;
  const road = map.roads.find(r => r.id === s.roadId);
  if (!road || road.lanesBackward > 0) continue;
  const len = lenOf(road);
  const flowTo = road.lanesForward > 0; // from→to
  const forbiddenEnd = flowTo ? 'to' : 'from';
  const sEnd = s.s < len * 0.25 ? 'from' : s.s > len * 0.75 ? 'to' : 'mid';
  if (sEnd !== forbiddenEnd && sEnd !== 'mid') {
    const oldS = s.s;
    s.s = flowTo ? len - 14 : 14;
    log.push(`O3 ${s.roadId} 267 s=${oldS.toFixed(0)} (${sEnd}) → s=${s.s.toFixed(0)} (${forbiddenEnd})`);
    changes++;
    // 220 ở đầu vào hợp pháp nếu chưa có 220 nào trên road này
    const has220 = map.signs.some(x => x.type === '220' && x.roadId === s.roadId);
    if (!has220) {
      map.signs.push({ type: '220', roadId: s.roadId, s: flowTo ? 6 : len - 6, side: s.side ?? 'right', src: 'oneway-fix-220' });
      log.push(`O3 +220 ${s.roadId} @s=${flowTo ? 6 : (len - 6).toFixed(0)} (đầu vào)`);
      changes++;
    }
  }
}

if (changes > 0) writeFileSync(mapPath, JSON.stringify(map), 'utf8'); else console.log('(không ghi — không có thay đổi)');
console.log(`═══ PHẦN 11.2 fix_oneway — ${changes} thay đổi ═══`);
for (const l of log) console.log('  ' + l);
console.log(changes === 0 ? 'IDEMPOTENT: không có thay đổi (map đã sửa)' : `Map đã ghi → ${mapPath}`);
