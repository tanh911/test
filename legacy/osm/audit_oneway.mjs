// ðŸš§ audit_oneway.mjs â€” PHáº¦N 11.1: nháº¥t quÃ¡n Ä‘Æ°á»ng Má»˜T CHIá»€U (oneway) vs biá»ƒn cáº¥m vÃ o.
// Truy road â†” way OSM (match tÃªn + hÃ¬nh há»c, cÃ¹ng phÆ°Æ¡ng phÃ¡p fix_road_widths.mjs), Ä‘á»‘i chiáº¿u:
// graph lanesForward/Backward â†” tag oneway/lanes â†” váº¡ch giá»¯a â†” biá»ƒn 267/220.
// Lá»—i: O1 graph hai chiá»u nhÆ°ng OSM oneway Â· O2 graph hai chiá»u cÃ³ biá»ƒn 267 Â·
//      O3 267 Ä‘áº·t á»Ÿ Ä‘áº§u VÃ€O cá»§a oneway (Ä‘áº£o hÆ°á»›ng) Â· O4 oneway sá»‘ lÃ n/váº¡ch lá»‡ch tag lanes.
// Cháº¡y: node scripts/audit_oneway.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const map = JSON.parse(readFileSync(join(root, 'src/data/maps/berlin-mitte-clean.json'), 'utf8'));
const osm = JSON.parse(readFileSync(join(root, 'scripts/osm_pbf_extracted_stadt.json'), 'utf8'));

const norm = (s) => (s || '').toLowerCase().replaceAll('ÃŸ', 'ss').replaceAll('â–€', 'ss').replace(/\s+/g, ' ').trim();
const R = 6371000, refLat = 52.5170, refLon = 13.3888;
const toXY = (lat, lon) => [
  ((lon - refLon) * Math.PI) / 180 * R * Math.cos((refLat * Math.PI) / 180),
  ((lat - refLat) * Math.PI) / 180 * R,
];

// ways theo tÃªn + geometry XY
const waysByStreet = new Map();
for (const w of osm.ways || []) {
  const name = norm(w.tags?.name);
  if (!name) continue;
  if (!waysByStreet.has(name)) waysByStreet.set(name, []);
  const pts = (w.refs || w.nodes || []).map(id => osm.nodes[String(id)]).filter(Boolean).map(n => toXY(n.lat, n.lon));
  if (pts.length >= 2) waysByStreet.get(name).push(w);
}
function polyMid(pts) { let L = 0, mx = 0, mz = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); L += d; mx += ((pts[i-1][0]+pts[i][0])/2)*d; mz += ((pts[i-1][1]+pts[i][1])/2)*d; } return L > 0 ? [mx/L, mz/L] : pts[0]; }

/** match road â†” way OSM cÃ¹ng tÃªn, gáº§n nháº¥t theo khoáº£ng cÃ¡ch tÃ¢m */
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

// â”€â”€ Ä‘á»‘i chiáº¿u tá»«ng road â”€â”€
const rows = [];
for (const road of map.roads) {
  const m = matchWay(road);
  const tags = m?.way?.tags ?? {};
  const osmOneway = tags.oneway === 'yes' ? 'yes' : tags.oneway === '-1' ? '-1' : (tags.oneway ?? 'no');
  const graphOneway = road.lanesBackward === 0 ? 'yes(dir=fromâ†’to)' : road.lanesForward === 0 ? 'yes(dir=toâ†’from)' : 'no';
  const marksType = road.lanesBackward > 0 ? (road.lanesForward >= 2 ? 'twoway_dash' : 'twoway_plain') : (road.lanesForward >= 2 ? 'oneway_multilane_dash' : 'oneway_single_noline');
  const len = Math.hypot(road.points.at(-1)[0]-road.points[0][0], road.points.at(-1)[1]-road.points[0][1]) || 1;
  const signs267 = map.signs.filter(s => s.type === '267' && s.roadId === road.id).map(s => ({ ...s, end: s.s < len * 0.25 ? 'from' : s.s > len * 0.75 ? 'to' : 'mid' }));
  const signs220 = map.signs.filter(s => s.type === '220' && s.roadId === road.id).map(s => ({ ...s, end: s.s < len * 0.25 ? 'from' : s.s > len * 0.75 ? 'to' : 'mid' }));
  rows.push({ road, name: road.name || '', osmOneway, osmLanes: tags.lanes ?? null, graphOneway, lanesF: road.lanesForward, lanesB: road.lanesBackward, marksType, signs267, signs220, matchDist: m?.dist ?? null });
}

// â”€â”€ phÃ¢n loáº¡i lá»—i â”€â”€
const isTwoWay = r => r.graphOneway === 'no';
const isFoneway = r => r.graphOneway === 'yes(dir=fromâ†’to)';
const isBoneway = r => r.graphOneway === 'yes(dir=toâ†’from)';
// O1: OSM oneway=yes/-1 nhÆ°ng graph hai chiá»u (báº¥t ká»ƒ chiá»u oneway nÃ o)
const O1 = rows.filter(r => (r.osmOneway === 'yes' || r.osmOneway === '-1') && isTwoWay(r));
const O1b = rows.filter(r => r.osmOneway === 'no' && !isTwoWay(r));           // graph oneway nhÆ°ng OSM khÃ´ng tag
// O2: graph hai chiá»u + 267 â€” CHá»ˆ Ä‘áº¿m khi match OSM thÃ nh cÃ´ng; match fail â†’ exception
// (r149 UniversitÃ¤tsstraÃŸe: cá»™t WFS tháº­t, extract thiáº¿u way â†’ giá»¯ biá»ƒn, chá» Ä‘á»‘i chiáº¿u)
const ONEWAY_SIGN_EXCEPTIONS = new Set(['r149']);
const O2 = rows.filter(r => isTwoWay(r) && r.signs267.length > 0 && r.matchDist !== null && !ONEWAY_SIGN_EXCEPTIONS.has(r.roadId));
// O3: 267 á»Ÿ Ä‘áº§u VÃ€O há»£p phÃ¡p cá»§a oneway: F-oneway cáº¥m Ä‘áº§u to â†’ 267 pháº£i á»Ÿ to; B-oneway cáº¥m Ä‘áº§u from
const O3 = rows.filter(r => (isFoneway(r) && r.signs267.some(s => s.end === 'from')) ||
                            (isBoneway(r) && r.signs267.some(s => s.end === 'to')));
const O4 = rows.filter(r => (isFoneway(r) || isBoneway(r)) && r.osmLanes &&
  ((isFoneway(r) && r.lanesF !== parseInt(r.osmLanes, 10)) || (isBoneway(r) && r.lanesB !== parseInt(r.osmLanes, 10))));

console.log(`â•â•â• PHáº¦N 11.1 ONEWAY vs BIá»‚N Cáº¤M VÃ€O â€” ${rows.length} roads â•â•â•`);
console.log(`Match OSM: ${rows.filter(r => r.matchDist !== null).length} roads`);
console.log(`Graph oneway: ${rows.filter(r => r.lanesB === 0).length} Â· OSM oneway=yes: ${rows.filter(r => r.osmOneway === 'yes').length} Â· OSM oneway=no: ${rows.filter(r => r.osmOneway === 'no').length}\n`);
console.log(`O1 graph hai chiá»u NHÆ¯NG OSM oneway=yes: ${O1.length}`);
for (const r of O1.slice(0, 12)) console.log(`   ${r.road.id} "${r.name}" graph ${r.lanesF}/${r.lanesB} Â· OSM oneway=yes lanes=${r.osmLanes} (match ${r.matchDist}m)`);
console.log(`O1b graph ONEWAY nhÆ°ng OSM khÃ´ng tag oneway: ${O1b.length}`);
for (const r of O1b.slice(0, 20)) console.log(`   ${r.road.id} "${r.name}" graph ${r.lanesF}/${r.lanesB} (match ${r.matchDist}m)`);
console.log(`O2 graph hai chiá»u + cÃ³ biá»ƒn 267: ${O2.length}`);
for (const r of O2.slice(0, 12)) console.log(`   ${r.road.id} "${r.name}" graph ${r.lanesF}/${r.lanesB} Â· 267 táº¡i s=${r.signs267.map(s => s.s.toFixed(0)).join(',')} side=${r.signs267.map(s => s.side).join(',')}`);
console.log(`O3 oneway + 267 á»Ÿ Ä‘áº§u VÃ€O (from â€” Ä‘áº£o hÆ°á»›ng): ${O3.length}`);
for (const r of O3.slice(0, 12)) console.log(`   ${r.road.id} "${r.name}" flow ${r.lanesF}/${r.lanesB} Â· 267 s=${r.signs267.map(s => s.s.toFixed(0)).join(',')}`);
console.log(`O4 oneway sá»‘ lÃ n lá»‡ch tag lanes: ${O4.length}`);
for (const r of O4.slice(0, 10)) console.log(`   ${r.road.id} "${r.name}" graph lanesF=${r.lanesF} Â· OSM lanes=${r.osmLanes}`);

// â”€â”€ candidate khá»›p áº¢NH ngÆ°á»i dÃ¹ng: phá»‘ hai chiá»u trong graph + â‰¥2 biá»ƒn 267 CÃ™NG TÃŠN PHá» â”€â”€
console.log('\nâ”€â”€ CANDIDATE khá»›p áº£nh (phá»‘ + cáº·p 267 + graph hai chiá»u + váº¡ch Ä‘á»©t) â”€â”€');
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
  console.log(`  "${name}": ${n267} biá»ƒn 267 trÃªn ${arr.length} segment Â· graph hai chiá»u á»Ÿ ${tw.length} segment Â· OSM oneway: ${arr.map(r => r.osmOneway).join(',')}`);
  for (const r of arr.filter(x => x.signs267.length)) {
    console.log(`     ${r.road.id} graph ${r.lanesF}/${r.lanesB} marks=${r.marksType} Â· 267 s=${r.signs267.map(s => `${s.s.toFixed(0)}(${s.end},${s.side}${s.flip ? ',flip' : ''})`).join(' ')} Â· OSM=${r.osmOneway}/${r.osmLanes ?? '?'}`);
  }
}
console.log('\n(Äá»‘i chiáº¿u áº£nh: road hai chiá»u cÃ³ váº¡ch Ä‘á»©t + cáº·p 267 hai bÃªn = candidate. Náº¿u OSM oneway=yes â†’ lá»—i GRAPH (O1); náº¿u OSM hai chiá»u â†’ lá»—i SIGN (O2).)');
