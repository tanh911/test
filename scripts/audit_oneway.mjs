// 🚧 audit_oneway.mjs — PHẦN 11.1: nhất quán đường MỘT CHIỀU (oneway) vs biển cấm vào.
// Truy road ↔ way OSM (match tên + hình học, cùng phương pháp fix_road_widths.mjs), đối chiếu:
// graph lanesForward/Backward ↔ tag oneway/lanes ↔ vạch giữa ↔ biển 267/220.
// Lỗi: O1 graph hai chiều nhưng OSM oneway · O2 graph hai chiều có biển 267 ·
//      O3 267 đặt ở đầu VÀO của oneway (đảo hướng) · O4 oneway số làn/vạch lệch tag lanes.
// Chạy: node scripts/audit_oneway.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(readFileSync(join(root, 'src/data/maps/berlin-mitte-clean.json'), 'utf8'));
const osm = JSON.parse(readFileSync(join(root, 'scripts/osm_pbf_extracted_stadt.json'), 'utf8'));

const norm = (s) => (s || '').toLowerCase().replaceAll('ß', 'ss').replaceAll('▀', 'ss').replace(/\s+/g, ' ').trim();
const R = 6371000, refLat = 52.5170, refLon = 13.3888;
const toXY = (lat, lon) => [
  ((lon - refLon) * Math.PI) / 180 * R * Math.cos((refLat * Math.PI) / 180),
  ((lat - refLat) * Math.PI) / 180 * R,
];

// ways theo tên + geometry XY
const waysByStreet = new Map();
for (const w of osm.ways || []) {
  const name = norm(w.tags?.name);
  if (!name) continue;
  if (!waysByStreet.has(name)) waysByStreet.set(name, []);
  const pts = (w.refs || w.nodes || []).map(id => osm.nodes[String(id)]).filter(Boolean).map(n => toXY(n.lat, n.lon));
  if (pts.length >= 2) waysByStreet.get(name).push(w);
}
function polyMid(pts) { let L = 0, mx = 0, mz = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); L += d; mx += ((pts[i-1][0]+pts[i][0])/2)*d; mz += ((pts[i-1][1]+pts[i][1])/2)*d; } return L > 0 ? [mx/L, mz/L] : pts[0]; }

/** match road ↔ way OSM cùng tên, gần nhất theo khoảng cách tâm */
function matchWay(road) {
  const name = norm(road.name);
  const cands = waysByStreet.get(name);
  if (!cands?.length) return null;
  const rp = road.points.map(p => [p[0], p[1]]);
  const rm = polyMid(rp);
  let best = null, bestD = Infinity;
  for (const w of cands) {
    const pts = (w.refs || w.nodes || []).map(id => osm.nodes[String(id)]).filter(Boolean).map(n => toXY(n.lat, n.lon));
    if (pts.length < 2) continue;
    const d = Math.hypot(polyMid(pts)[0] - rm[0], polyMid(pts)[1] - rm[1]);
    if (d < bestD) { bestD = d; best = w; }
  }
  return bestD < 180 ? { way: best, dist: Math.round(bestD) } : null;
}

// ── đối chiếu từng road ──
const rows = [];
for (const road of map.roads) {
  const m = matchWay(road);
  const tags = m?.way?.tags ?? {};
  const osmOneway = tags.oneway === 'yes' ? 'yes' : tags.oneway === '-1' ? '-1' : (tags.oneway ?? 'no');
  const graphOneway = road.lanesBackward === 0 ? 'yes(dir=from→to)' : road.lanesForward === 0 ? 'yes(dir=to→from)' : 'no';
  const marksType = road.lanesBackward > 0 ? (road.lanesForward >= 2 ? 'twoway_dash' : 'twoway_plain') : (road.lanesForward >= 2 ? 'oneway_multilane_dash' : 'oneway_single_noline');
  const len = Math.hypot(road.points.at(-1)[0]-road.points[0][0], road.points.at(-1)[1]-road.points[0][1]) || 1;
  const signs267 = map.signs.filter(s => s.type === '267' && s.roadId === road.id).map(s => ({ ...s, end: s.s < len * 0.25 ? 'from' : s.s > len * 0.75 ? 'to' : 'mid' }));
  const signs220 = map.signs.filter(s => s.type === '220' && s.roadId === road.id).map(s => ({ ...s, end: s.s < len * 0.25 ? 'from' : s.s > len * 0.75 ? 'to' : 'mid' }));
  rows.push({ road, name: road.name || '', osmOneway, osmLanes: tags.lanes ?? null, graphOneway, lanesF: road.lanesForward, lanesB: road.lanesBackward, marksType, signs267, signs220, matchDist: m?.dist ?? null });
}

// ── phân loại lỗi ──
const isTwoWay = r => r.graphOneway === 'no';
const isFoneway = r => r.graphOneway === 'yes(dir=from→to)';
const isBoneway = r => r.graphOneway === 'yes(dir=to→from)';
// O1: OSM oneway=yes/-1 nhưng graph hai chiều (bất kể chiều oneway nào)
const O1 = rows.filter(r => (r.osmOneway === 'yes' || r.osmOneway === '-1') && isTwoWay(r));
const O1b = rows.filter(r => r.osmOneway === 'no' && !isTwoWay(r));           // graph oneway nhưng OSM không tag
// O2: graph hai chiều + 267 — CHỈ đếm khi match OSM thành công; match fail → exception
// (r149 Universitätsstraße: cột WFS thật, extract thiếu way → giữ biển, chờ đối chiếu)
const ONEWAY_SIGN_EXCEPTIONS = new Set(['r149']);
const O2 = rows.filter(r => isTwoWay(r) && r.signs267.length > 0 && r.matchDist !== null && !ONEWAY_SIGN_EXCEPTIONS.has(r.roadId));
// O3: 267 ở đầu VÀO hợp pháp của oneway: F-oneway cấm đầu to → 267 phải ở to; B-oneway cấm đầu from
const O3 = rows.filter(r => (isFoneway(r) && r.signs267.some(s => s.end === 'from')) ||
                            (isBoneway(r) && r.signs267.some(s => s.end === 'to')));
const O4 = rows.filter(r => (isFoneway(r) || isBoneway(r)) && r.osmLanes &&
  ((isFoneway(r) && r.lanesF !== parseInt(r.osmLanes, 10)) || (isBoneway(r) && r.lanesB !== parseInt(r.osmLanes, 10))));

console.log(`═══ PHẦN 11.1 ONEWAY vs BIỂN CẤM VÀO — ${rows.length} roads ═══`);
console.log(`Match OSM: ${rows.filter(r => r.matchDist !== null).length} roads`);
console.log(`Graph oneway: ${rows.filter(r => r.lanesB === 0).length} · OSM oneway=yes: ${rows.filter(r => r.osmOneway === 'yes').length} · OSM oneway=no: ${rows.filter(r => r.osmOneway === 'no').length}\n`);
console.log(`O1 graph hai chiều NHƯNG OSM oneway=yes: ${O1.length}`);
for (const r of O1.slice(0, 12)) console.log(`   ${r.road.id} "${r.name}" graph ${r.lanesF}/${r.lanesB} · OSM oneway=yes lanes=${r.osmLanes} (match ${r.matchDist}m)`);
console.log(`O1b graph ONEWAY nhưng OSM không tag oneway: ${O1b.length}`);
for (const r of O1b.slice(0, 20)) console.log(`   ${r.road.id} "${r.name}" graph ${r.lanesF}/${r.lanesB} (match ${r.matchDist}m)`);
console.log(`O2 graph hai chiều + có biển 267: ${O2.length}`);
for (const r of O2.slice(0, 12)) console.log(`   ${r.road.id} "${r.name}" graph ${r.lanesF}/${r.lanesB} · 267 tại s=${r.signs267.map(s => s.s.toFixed(0)).join(',')} side=${r.signs267.map(s => s.side).join(',')}`);
console.log(`O3 oneway + 267 ở đầu VÀO (from — đảo hướng): ${O3.length}`);
for (const r of O3.slice(0, 12)) console.log(`   ${r.road.id} "${r.name}" flow ${r.lanesF}/${r.lanesB} · 267 s=${r.signs267.map(s => s.s.toFixed(0)).join(',')}`);
console.log(`O4 oneway số làn lệch tag lanes: ${O4.length}`);
for (const r of O4.slice(0, 10)) console.log(`   ${r.road.id} "${r.name}" graph lanesF=${r.lanesF} · OSM lanes=${r.osmLanes}`);

// ── candidate khớp ẢNH người dùng: phố hai chiều trong graph + ≥2 biển 267 CÙNG TÊN PHỐ ──
console.log('\n── CANDIDATE khớp ảnh (phố + cặp 267 + graph hai chiều + vạch đứt) ──');
const byStreet = new Map();
for (const r of rows) {
  if (!r.name) continue;
  const k = r.name;
  if (!byStreet.has(k)) byStreet.set(k, []);
  byStreet.get(k).push(r);
}
for (const [name, arr] of byStreet) {
  const n267 = arr.reduce((s, r) => s + r.signs267.length, 0);
  if (n267 < 2) continue;
  const tw = arr.filter(r => r.lanesB > 0);
  if (!tw.length) continue;
  console.log(`  "${name}": ${n267} biển 267 trên ${arr.length} segment · graph hai chiều ở ${tw.length} segment · OSM oneway: ${arr.map(r => r.osmOneway).join(',')}`);
  for (const r of arr.filter(x => x.signs267.length)) {
    console.log(`     ${r.road.id} graph ${r.lanesF}/${r.lanesB} marks=${r.marksType} · 267 s=${r.signs267.map(s => `${s.s.toFixed(0)}(${s.end},${s.side}${s.flip ? ',flip' : ''})`).join(' ')} · OSM=${r.osmOneway}/${r.osmLanes ?? '?'}`);
  }
}
console.log('\n(Đối chiếu ảnh: road hai chiều có vạch đứt + cặp 267 hai bên = candidate. Nếu OSM oneway=yes → lỗi GRAPH (O1); nếu OSM hai chiều → lỗi SIGN (O2).)');
