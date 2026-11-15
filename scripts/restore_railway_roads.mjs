// ♻️ restore_railway_roads.mjs — KHÔI PHỤC 7 road bị xóa nhầm (r32/r53/r61/r89/
// r134/r191/r276). Nguyên nhân: tiêu chí xóa theo overlap 2D false-positive —
// Stadtbahn viaduct chạy TRÊN CAO đè lên các phố thật trong phép chiếu.
// Bằng chứng nguồn: o['ways'] có 496 highway ways, 0 railway ways → mọi road
// đều sinh từ highway ways = đường xe thật.
// Làm: re-insert roads (từ backup) + normalize width + buildings/props/spawns
// + node types + intersections. Rails viaduct 5m phía trên vẫn giữ (đúng thực tế).
// Chạy: node scripts/restore_railway_roads.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = join(root, 'src/data/maps/berlin-mitte-clean.json');
const backupPath = join(root, 'scripts/berlin_map_before_width_fix.json');

const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const backup = JSON.parse(readFileSync(backupPath, 'utf8'));

const RESTORE = ['r32', 'r53', 'r61', 'r89', 'r134', 'r191', 'r276'];
const restoreSet = new Set(RESTORE);

// ── 1. Roads: re-insert từ backup + normalize width (conservative) ──
const backupRoads = backup.roads.filter(r => restoreSet.has(r.id));
const existIds = new Set(map.roads.map(r => r.id));
let added = 0;
for (const r of backupRoads) {
  if (existIds.has(r.id)) { console.log('  đã có, bỏ qua', r.id); continue; }
  // normalize width: tổng < 3.3m và 1 chiều → hai chiều 1/1×3.2 (conservative như width-fix)
  const total = (r.lanesForward + r.lanesBackward) * r.laneWidth;
  if (total < 3.3 && r.lanesBackward === 0) {
    r.lanesForward = 1; r.lanesBackward = 1; r.laneWidth = 3.2;
  }
  map.roads.push(r);
  added++;
  // node endpoint bị xóa (orphan cleanup) → re-add từ backup
  for (const nid of [r.from, r.to]) {
    if (!map.nodes.some(n2 => n2.id === nid)) {
      const bn = backupNodesGet(nid);
      if (bn) map.nodes.push(JSON.parse(JSON.stringify(bn)));
      else console.log('  ⚠️ node', nid, 'không có trong backup');
    }
  }
}
console.log('roads restored:', added, '→', map.roads.length, 'roads tổng');

// ── 1b. NODE REPAIR: mọi node mà roads tham chiếu phải tồn tại (idempotent)
const backupNodes = new Map(backup.nodes.map(n => [n.id, n]));
let nAdded = 0;
const allRefs = new Set();
for (const r of map.roads) { allRefs.add(r.from); allRefs.add(r.to); }
for (const nid of allRefs) {
  if (map.nodes.some(n2 => n2.id === nid)) continue;
  const bn = backupNodes.get(nid);
  if (bn) { map.nodes.push(JSON.parse(JSON.stringify(bn))); nAdded++; }
  else console.log('  ⚠️ node', nid, 'không có trong backup — bỏ');
}
if (nAdded) console.log('nodes re-added:', nAdded, '→', map.nodes.length);

// ── 2. Buildings/props từ backup cho các road này ──
const curB = new Set(map.buildings.map(b => `${b.roadId}:${b.s}`));
let bAdded = 0;
for (const b of backup.buildings || []) {
  if (!restoreSet.has(b.roadId)) continue;
  const key = `${b.roadId}:${b.s}`;
  if (curB.has(key)) continue;
  map.buildings.push(b); curB.add(key); bAdded++;
}
console.log('buildings restored:', bAdded);
let pAdded = 0;
const curP = new Set((map.props || []).map(pr => `${pr.roadId}:${pr.type}:${pr.s}`));
for (const pr of backup.props || []) {
  if (!restoreSet.has(pr.roadId)) continue;
  const key = `${pr.roadId}:${pr.type}:${pr.s}`;
  if (curP.has(key)) continue;
  map.props.push(pr); curP.add(key); pAdded++;
}
console.log('props restored:', pAdded);

// ── 3. Nodes: khôi phục type + tọa độ (n63/n69/n94/n109 bị downgrade) ──
for (const n of map.nodes) {
  const bn = backupNodes.get(n.id);
  if (bn && n.type !== bn.type) n.type = bn.type;
}
// degree sau restore
const deg = {};
for (const r of map.roads) { deg[r.from] = (deg[r.from] || 0) + 1; deg[r.to] = (deg[r.to] || 0) + 1; }
// node type intersection phải degree ≥3, ngược lại → end
for (const n of map.nodes) {
  if (n.type === 'intersection' && (deg[n.id] || 0) < 3) n.type = 'end';
  if (n.type === 'end' && (deg[n.id] || 0) >= 3) n.type = 'intersection';
}

// ── 4. Intersections: re-add từ backup cho node degree ≥3 ──
const curIx = new Set(map.intersections.map(ix => ix.nodeId));
const liveIx = new Set(map.nodes.filter(n => n.type === 'intersection').map(n => n.id));
let iAdded = 0;
for (const ix of backup.intersections || []) {
  if (!liveIx.has(ix.nodeId) || curIx.has(ix.nodeId)) continue;
  map.intersections.push(ix); curIx.add(ix.nodeId); iAdded++;
}
console.log('intersections re-added:', iAdded, '→', map.intersections.length);

// ── 5. Spawns: khôi phục nếu trỏ road restored ──
if (map.spawns) {
  for (const [k, sp] of Object.entries(map.spawns)) {
    if (!sp.roadId) continue;
    const bn = backup.spawns?.[k];
    if (bn && bn.roadId && !map.roads.some(r => r.id === sp.roadId) && restoreSet.has(bn.roadId)) {
      map.spawns[k] = bn;
    }
  }
}

writeFileSync(mapPath, JSON.stringify(map, null, 2), 'utf8');
console.log('Done. LƯU Ý: chạy lại node scripts/import_berlin_signs.mjs để khôi phục biển WFS trên các road này.');
