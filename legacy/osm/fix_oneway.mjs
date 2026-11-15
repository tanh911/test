// ðŸš§ fix_oneway.mjs â€” PHáº¦N 11.2: má»™t nguá»“n sá»± tháº­t cho hÆ°á»›ng = tag oneway OSM.
// O1: 26 road graph hai chiá»u nhÆ°ng OSM oneway=yes â†’ Ã¡p oneway (check HÆ¯á»šNG way báº±ng dot-product)
// O4: r208/r280 UdL lanes 3â†’2 theo OSM
// O2: r149 UniversitÃ¤tsstraÃŸe â€” theo tag OSM (oneway â†’ oneway; hai chiá»u â†’ bá» 267)
// O3: r38 FriedrichstraÃŸe â€” 267 chuyá»ƒn sang Ä‘áº§u Cáº¤M (to-end), thÃªm 220 á»Ÿ Ä‘áº§u vÃ o
// Idempotent: cháº¡y láº¡i trÃªn map Ä‘Ã£ sá»­a = khÃ´ng Ä‘á»•i gÃ¬. Backup trÆ°á»›c láº§n cháº¡y Ä‘áº§u.
// Cháº¡y: node scripts/fix_oneway.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const mapPath = join(root, 'src/data/maps/berlin-mitte-clean.json');
const backupPath = join(root, 'scripts/berlin_map_before_oneway_fix.json');
const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const osm = JSON.parse(readFileSync(join(root, 'scripts/osm_pbf_extracted_stadt.json'), 'utf8'));
if (!existsSync(backupPath)) writeFileSync(backupPath, JSON.stringify(map, null, 2), 'utf8');

const norm = (s) => (s || '').toLowerCase().replaceAll('ÃŸ', 'ss').replaceAll('â–€', 'ss').replace(/\s+/g, ' ').trim();
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
/** HÆ¯á»šNG way so vá»›i road: dot giá»¯a vector Ä‘áº§u-cuá»‘i cá»§a má»—i polyline (>0 = cÃ¹ng chiá»u) */
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

// â”€â”€ O1 + O2: road hai chiá»u trong graph â€” xÃ©t tag OSM â”€â”€
for (const road of map.roads) {
  if (road.lanesBackward === 0) continue; // Ä‘Ã£ oneway
  const way = matchWay(road);
  const oneway = way?.tags?.oneway;
  if (oneway === 'yes') {
    const lanes = Math.max(1, parseInt(way.tags?.lanes ?? defaultLanes(way.tags?.highway), 10));
    const aligned = wayAligned(road, way);
    // Ä‘Ã£ Ä‘Ãºng hÆ°á»›ng oneway â†’ skip (idempotency: cháº¡y láº¡i khÃ´ng Ä‘áº¿m thay Ä‘á»•i áº£o)
    if (aligned && road.lanesForward > 0 && road.lanesBackward === 0) continue;
    if (!aligned && road.lanesBackward > 0 && road.lanesForward === 0) continue;
    if (aligned) { road.lanesForward = lanes; road.lanesBackward = 0; }
    else { road.lanesForward = 0; road.lanesBackward = lanes; }
    changes++;
    log.push(`O1 ${road.id} "${road.name}" â†’ oneway ${aligned ? 'F' : 'B'}${lanes} (OSM oneway=yes lanes=${way.tags?.lanes ?? 'def'})`);
  } else if (oneway === '-1') {
    // oneway=-1: chiá»u ngÆ°á»£c way
    const lanes = Math.max(1, parseInt(way.tags?.lanes ?? defaultLanes(way.tags?.highway), 10));
    const aligned = wayAligned(road, way);
    if (!aligned && road.lanesForward > 0 && road.lanesBackward === 0) continue;
    if (aligned && road.lanesBackward > 0 && road.lanesForward === 0) continue;
    if (aligned) { road.lanesForward = 0; road.lanesBackward = lanes; }
    else { road.lanesForward = lanes; road.lanesBackward = 0; }
    changes++;
    log.push(`O1 ${road.id} "${road.name}" â†’ oneway -1 ${aligned ? 'B' : 'F'}${lanes}`);
  }
}

// â”€â”€ O1w: oneway 1 lÃ n pháº£i â‰¥ 3.4 m (chuáº©n fix_road_widths "one-way â‰¥ 3.4") â€” laneWidth
// káº¿ thá»«a tá»« thá»i hai chiá»u cÃ³ thá»ƒ 3.0â€“3.2 â†’ xe bot/player khÃ´ng vá»«a (guard C fullRoadAudit) â”€â”€
for (const road of map.roads) {
  if (road.lanesForward + road.lanesBackward === 1 && road.laneWidth < 3.4) {
    log.push(`O1w ${road.id} "${road.name}" laneWidth ${road.laneWidth} â†’ 3.4 (oneway 1 lÃ n)`);
    road.laneWidth = 3.4;
    changes++;
  }
}

// â”€â”€ O4: r208/r280 UdL lanes 3â†’2 â”€â”€
for (const road of map.roads) {
  const way = matchWay(road);
  if (!way) continue;
  const lanes = parseInt(way.tags?.lanes ?? '0', 10);
  if (road.lanesBackward === 0 && lanes > 0 && road.lanesForward !== lanes && road.lanesForward > lanes) {
    log.push(`O4 ${road.id} "${road.name}" lanesF ${road.lanesForward} â†’ ${lanes} (OSM lanes=${lanes})`);
    road.lanesForward = lanes;
    changes++;
  }
}

// â”€â”€ O2 removal: road hai chiá»u (sau O1-fix váº«n hai chiá»u) CÃ“ MATCH OSM hai chiá»u má»›i xÃ³a 267.
// Road match FAIL (vd r149 UniversitÃ¤tsstraÃŸe â€” extract thiáº¿u way) â†’ GIá»® biá»ƒn: cá»™t WFS lÃ 
// sá»± tháº­t biá»ƒn bÃ¡o, xÃ³a mÃ¹ quÃ¡ng lÃ m máº¥t phá»§ WFS (guard B rá»›t 94.65%) â†’ onewayExceptions.
const removed267 = [];
map.signs = map.signs.filter(s => {
  if (s.type !== '267') return true;
  const road = map.roads.find(r => r.id === s.roadId);
  if (road && road.lanesBackward > 0 && matchWay(road)) { removed267.push(`${s.roadId}@s=${s.s?.toFixed?.(0)}`); return false; }
  return true;
});
if (removed267.length) { changes++; log.push(`O2 bá» ${removed267.length} biá»ƒn 267 trÃªn road hai chiá»u cÃ³ match OSM: ${removed267.join(', ')}`); }

// â”€â”€ O2-exception: r149 UniversitÃ¤tsstraÃŸe â€” match OSM FAIL + cá»™t WFS tháº­t cÃ³ 267 â†’
// giá»¯ biá»ƒn trÃªn road hai chiá»u, ghi onewayExceptions chá» Ä‘á»‘i chiáº¿u OSM chi tiáº¿t â”€â”€
{
  const has149 = map.signs.some(s => s.type === '267' && s.roadId === 'r149');
  if (!has149) {
    map.signs.push({ type: '267', roadId: 'r149', s: 103, side: 'left', src: 'wfs-kept-oneway-exception' });
    changes++;
    log.push('O2-exc khÃ´i phá»¥c 267 r149 UniversitÃ¤tsstraÃŸe @s=103 (WFS tháº­t, match OSM fail â†’ exception)');
  }
}

// â”€â”€ O3: 267 trÃªn oneway Ä‘áº·t á»Ÿ Ä‘áº§u VÃ€O (s < 25% len) â†’ chuyá»ƒn sang Ä‘áº§u cáº¥m (to-end cho
// flow fromâ†’to, from-end cho flow toâ†’from), giá»¯ khÃ´ng flip (máº·t quay ngÆ°á»£c flow = nhÃ¬n
// tháº¥y tá»« phÃ­a cáº¥m). ThÃªm 220 á»Ÿ Ä‘áº§u vÃ o há»£p phÃ¡p (s=6, cÃ¹ng side). â”€â”€
const lenOf = (road) => Math.hypot(road.points.at(-1)[0] - road.points[0][0], road.points.at(-1)[1] - road.points[0][1]) || 1;
for (const s of map.signs) {
  if (s.type !== '267') continue;
  const road = map.roads.find(r => r.id === s.roadId);
  if (!road || road.lanesBackward > 0) continue;
  const len = lenOf(road);
  const flowTo = road.lanesForward > 0; // fromâ†’to
  const forbiddenEnd = flowTo ? 'to' : 'from';
  const sEnd = s.s < len * 0.25 ? 'from' : s.s > len * 0.75 ? 'to' : 'mid';
  if (sEnd !== forbiddenEnd && sEnd !== 'mid') {
    const oldS = s.s;
    s.s = flowTo ? len - 14 : 14;
    log.push(`O3 ${s.roadId} 267 s=${oldS.toFixed(0)} (${sEnd}) â†’ s=${s.s.toFixed(0)} (${forbiddenEnd})`);
    changes++;
    // 220 á»Ÿ Ä‘áº§u vÃ o há»£p phÃ¡p náº¿u chÆ°a cÃ³ 220 nÃ o trÃªn road nÃ y
    const has220 = map.signs.some(x => x.type === '220' && x.roadId === s.roadId);
    if (!has220) {
      map.signs.push({ type: '220', roadId: s.roadId, s: flowTo ? 6 : len - 6, side: s.side ?? 'right', src: 'oneway-fix-220' });
      log.push(`O3 +220 ${s.roadId} @s=${flowTo ? 6 : (len - 6).toFixed(0)} (Ä‘áº§u vÃ o)`);
      changes++;
    }
  }
}

if (changes > 0) writeFileSync(mapPath, JSON.stringify(map), 'utf8'); else console.log('(khÃ´ng ghi â€” khÃ´ng cÃ³ thay Ä‘á»•i)');
console.log(`â•â•â• PHáº¦N 11.2 fix_oneway â€” ${changes} thay Ä‘á»•i â•â•â•`);
for (const l of log) console.log('  ' + l);
console.log(changes === 0 ? 'IDEMPOTENT: khÃ´ng cÃ³ thay Ä‘á»•i (map Ä‘Ã£ sá»­a)' : `Map Ä‘Ã£ ghi â†’ ${mapPath}`);
