// â™»ï¸ restore_railway_roads.mjs â€” KHÃ”I PHá»¤C 7 road bá»‹ xÃ³a nháº§m (r32/r53/r61/r89/
// r134/r191/r276). NguyÃªn nhÃ¢n: tiÃªu chÃ­ xÃ³a theo overlap 2D false-positive â€”
// Stadtbahn viaduct cháº¡y TRÃŠN CAO Ä‘Ã¨ lÃªn cÃ¡c phá»‘ tháº­t trong phÃ©p chiáº¿u.
// Báº±ng chá»©ng nguá»“n: o['ways'] cÃ³ 496 highway ways, 0 railway ways â†’ má»i road
// Ä‘á»u sinh tá»« highway ways = Ä‘Æ°á»ng xe tháº­t.
// LÃ m: re-insert roads (tá»« backup) + normalize width + buildings/props/spawns
// + node types + intersections. Rails viaduct 5m phÃ­a trÃªn váº«n giá»¯ (Ä‘Ãºng thá»±c táº¿).
// Cháº¡y: node scripts/restore_railway_roads.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const mapPath = join(root, 'src/data/maps/berlin-mitte-clean.json');
const backupPath = join(root, 'scripts/berlin_map_before_width_fix.json');

const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const backup = JSON.parse(readFileSync(backupPath, 'utf8'));

const RESTORE = ['r32', 'r53', 'r61', 'r89', 'r134', 'r191', 'r276'];
const restoreSet = new Set(RESTORE);

// â”€â”€ 1. Roads: re-insert tá»« backup + normalize width (conservative) â”€â”€
const backupRoads = backup.roads.filter(r => restoreSet.has(r.id));
const existIds = new Set(map.roads.map(r => r.id));
let added = 0;
for (const r of backupRoads) {
  if (existIds.has(r.id)) { console.log('  Ä‘Ã£ cÃ³, bá» qua', r.id); continue; }
  // normalize width: tá»•ng < 3.3m vÃ  1 chiá»u â†’ hai chiá»u 1/1Ã—3.2 (conservative nhÆ° width-fix)
  const total = (r.lanesForward + r.lanesBackward) * r.laneWidth;
  if (total < 3.3 && r.lanesBackward === 0) {
    r.lanesForward = 1; r.lanesBackward = 1; r.laneWidth = 3.2;
  }
  map.roads.push(r);
  added++;
  // node endpoint bá»‹ xÃ³a (orphan cleanup) â†’ re-add tá»« backup
  for (const nid of [r.from, r.to]) {
    if (!map.nodes.some(n2 => n2.id === nid)) {
      const bn = backupNodesGet(nid);
      if (bn) map.nodes.push(JSON.parse(JSON.stringify(bn)));
      else console.log('  âš ï¸ node', nid, 'khÃ´ng cÃ³ trong backup');
    }
  }
}
console.log('roads restored:', added, 'â†’', map.roads.length, 'roads tá»•ng');

// â”€â”€ 1b. NODE REPAIR: má»i node mÃ  roads tham chiáº¿u pháº£i tá»“n táº¡i (idempotent)
const backupNodes = new Map(backup.nodes.map(n => [n.id, n]));
let nAdded = 0;
const allRefs = new Set();
for (const r of map.roads) { allRefs.add(r.from); allRefs.add(r.to); }
for (const nid of allRefs) {
  if (map.nodes.some(n2 => n2.id === nid)) continue;
  const bn = backupNodes.get(nid);
  if (bn) { map.nodes.push(JSON.parse(JSON.stringify(bn))); nAdded++; }
  else console.log('  âš ï¸ node', nid, 'khÃ´ng cÃ³ trong backup â€” bá»');
}
if (nAdded) console.log('nodes re-added:', nAdded, 'â†’', map.nodes.length);

// â”€â”€ 2. Buildings/props tá»« backup cho cÃ¡c road nÃ y â”€â”€
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

// â”€â”€ 3. Nodes: khÃ´i phá»¥c type + tá»a Ä‘á»™ (n63/n69/n94/n109 bá»‹ downgrade) â”€â”€
for (const n of map.nodes) {
  const bn = backupNodes.get(n.id);
  if (bn && n.type !== bn.type) n.type = bn.type;
}
// degree sau restore
const deg = {};
for (const r of map.roads) { deg[r.from] = (deg[r.from] || 0) + 1; deg[r.to] = (deg[r.to] || 0) + 1; }
// node type intersection pháº£i degree â‰¥3, ngÆ°á»£c láº¡i â†’ end
for (const n of map.nodes) {
  if (n.type === 'intersection' && (deg[n.id] || 0) < 3) n.type = 'end';
  if (n.type === 'end' && (deg[n.id] || 0) >= 3) n.type = 'intersection';
}

// â”€â”€ 4. Intersections: re-add tá»« backup cho node degree â‰¥3 â”€â”€
const curIx = new Set(map.intersections.map(ix => ix.nodeId));
const liveIx = new Set(map.nodes.filter(n => n.type === 'intersection').map(n => n.id));
let iAdded = 0;
for (const ix of backup.intersections || []) {
  if (!liveIx.has(ix.nodeId) || curIx.has(ix.nodeId)) continue;
  map.intersections.push(ix); curIx.add(ix.nodeId); iAdded++;
}
console.log('intersections re-added:', iAdded, 'â†’', map.intersections.length);

// â”€â”€ 5. Spawns: khÃ´i phá»¥c náº¿u trá» road restored â”€â”€
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
console.log('Done. LÆ¯U Ã: cháº¡y láº¡i node scripts/import_berlin_signs.mjs Ä‘á»ƒ khÃ´i phá»¥c biá»ƒn WFS trÃªn cÃ¡c road nÃ y.');
