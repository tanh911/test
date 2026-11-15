// ðŸš† add_rails.mjs â€” 2 viá»‡c:
//   1. XÃ“A cÃ¡c road NHáº¦M = railway (overlap >60% vá»›i railway ways OSM â€” Berliner
//      Stadtbahn viaduct bá»‹ convert thÃ nh Ä‘Æ°á»ng xe: r32/r53/r61/r89/r134/r191/r276)
//      + dá»n má»“ cÃ´i node/intersection/sign/prop/spawn/building
//   2. BAKE railways (rail/light_rail/tram â€” bá» subway ngáº§m) vÃ o map JSON:
//      rails: [{id, name, railway, layer, bridge, elev, points}]
//      elev = 5 náº¿u viaduct/bridge (S-Bahn cháº¡y trÃªn cáº§u gáº¡ch cao), 0 náº¿u máº·t Ä‘áº¥t/tram
// Cháº¡y: node scripts/add_rails.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const mapPath = join(root, 'src/data/maps/berlin-mitte-clean.json');
const osmPath = join(root, 'scripts/osm_pbf_extracted_stadt.json');

const R = 6371000, refLat = 52.5170, refLon = 13.3888;
const toXY = (lat, lon) => [
  ((lon - refLon) * Math.PI) / 180 * R * Math.cos((refLat * Math.PI) / 180),
  ((lat - refLat) * Math.PI) / 180 * R,
];

const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const osm = JSON.parse(readFileSync(osmPath, 'utf8'));
const byId = new Map(Object.entries(osm.nodes).map(([id, n]) => [String(id), n]));

function distPoly(px, pz, pts) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const vx = pts[i][0] - pts[i - 1][0], vz = pts[i][1] - pts[i - 1][1];
    const l2 = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((px - pts[i - 1][0]) * vx + (pz - pts[i - 1][1]) * vz) / l2));
    best = Math.min(best, Math.hypot(px - (pts[i - 1][0] + vx * t), pz - (pts[i - 1][1] + vz * t)));
  }
  return best;
}

// â”€â”€ Railway polylines trong vÃ¹ng map â”€â”€
// B3/B5: elev DOC TU TAG â€” viaduct 8m (Stadtbahn that ~8m, thong thuy
// thong thuy duong bo 4.5m (StVO/VwV); ray/ballast la overlay mong ~10cm), bridge khac 6.5, layer>=1: 4.5,
// embankment 1.5; default 0 khi khong co tag. B2: tunnel/cutting khong render.
const ELEV_VIADUCT = 8, ELEV_BRIDGE = 6.5, ELEV_LAYER = 4.5, ELEV_EMBANK = 1.5;
let skippedTunnel = 0, skippedCutting = 0;
const rails = [];
for (const w of osm.railways || []) {
  const t = w.tags || {};
  const typ = t.railway;
  if (!['rail', 'light_rail', 'tram'].includes(typ)) continue; // subway ngáº§m â€” bá»
  const pts = (w.nodes || []).map(id => byId.get(String(id))).filter(Boolean)
    .map(n => {
      const [x, z] = toXY(n.lat, n.lon);
      return [Math.round(x * 100) / 100, Math.round(z * 100) / 100];
    });
  if (pts.length < 2) continue;
  if (!pts.some(([x, z]) => Math.abs(x) < 780 && Math.abs(z) < 780)) continue;
  // B3: elev DOC TU TAG (khong gan dong loat) â€” B5: viaduct 8m (Stadtbbahn that
  // ~8m; thong thuy duong bo toi thieu 4.5m theo StVO/VwV + ket cau ray ~1m)
  if (t.tunnel === 'yes') { skippedTunnel++; continue; } // B2: ngam â€” khong render
  if (t.cutting === 'yes') { skippedCutting++; continue; } // rang â€” duoi plaza, an
  let elev = 0;
  if (t.bridge === 'viaduct') elev = ELEV_VIADUCT;
  else if (t.bridge === 'yes') elev = ELEV_BRIDGE;
  else if (Number(t.layer || 0) >= 1) elev = ELEV_LAYER;
  else if (t.embankment === 'yes') elev = ELEV_EMBANK;
  rails.push({
    id: String(w.id), name: t.name || '', railway: typ,
    layer: Number(t.layer || 0), bridge: !!t.bridge,
    elev, points: pts,
  });

}

// â”€â”€ 1. (ÄÃƒ Bá»Ž) xÃ³a roads theo overlap 2D â€” SAI NGá»® NGHÄ¨A: Stadtbahn viaduct
//    cháº¡y TRÃŠN CAO Ä‘Ã¨ lÃªn cÃ¡c phá»‘ tháº­t trong phÃ©p chiáº¿u 2D â†’ false-positive
//    (Ä‘Ã£ xÃ³a nháº§m 7 phá»‘ tháº­t: r32/r53/r61/r89/r134/r191/r276 â€” Ä‘Ã£ khÃ´i phá»¥c
//    báº±ng restore_railway_roads.mjs). Roads chá»‰ sinh tá»« highway ways
//    (o['ways'] cÃ³ 496 highway, 0 railway) â†’ khÃ´ng cáº§n lá»c.

// â”€â”€ Dá»n má»“ cÃ´i â”€â”€
const liveRoadIds = new Set(map.roads.map(r => r.id));
const liveNodeIds = new Set();
for (const r of map.roads) { liveNodeIds.add(r.from); liveNodeIds.add(r.to); }
const beforeNodes = map.nodes.length;
map.nodes = map.nodes.filter(n => liveNodeIds.has(n.id));
console.log(`Nodes: ${beforeNodes} â†’ ${map.nodes.length} (bá» ${beforeNodes - map.nodes.length} má»“ cÃ´i)`);
const ixBefore = map.intersections.length;
map.intersections = map.intersections.filter(ix => liveNodeIds.has(ix.nodeId));
console.log(`Intersections: ${ixBefore} â†’ ${map.intersections.length}`);
// crosswalks trá» road Ä‘Ã£ xÃ³a â†’ lá»c
for (const ix of map.intersections) {
  ix.crosswalks = (ix.crosswalks || []).filter(cw => liveRoadIds.has(cw));
}
const sBefore = map.signs.length;
map.signs = map.signs.filter(sg => liveRoadIds.has(sg.roadId));
console.log(`Signs: ${sBefore} â†’ ${map.signs.length} (bá» biá»ƒn gáº¯n road Ä‘Ã£ xÃ³a â€” chÃºng snap nháº§m railway sáºµn)`);
map.props = (map.props || []).filter(p => liveRoadIds.has(p.roadId));
map.buildings = map.buildings.filter(b => liveRoadIds.has(b.roadId));
if (map.spawns) {
  for (const k of Object.keys(map.spawns)) {
    if (map.spawns[k]?.roadId && !liveRoadIds.has(map.spawns[k].roadId)) delete map.spawns[k];
  }
}

// â”€â”€ 2. BAKE rails â”€â”€
map.rails = rails;
// Bake cluster assignments cho worldBuilder (P1: gom track thÃ nh cá»¥m)
// Union-find: rails song song < 8m cho > 30% chiá»u dÃ i ngáº¯n hÆ¡n â†’ cÃ¹ng cá»¥m
const parent = rails.map((_, i) => i);
function find2(i) { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; }
function union2(a, b) { parent[find2(a)] = find2(b); }
// resample 8m
function resamp(points, step) {
  const out = [];
  for (let i = 1; i < points.length; i++) {
    const ax = points[i-1][0], az = points[i-1][1], bx = points[i][0], bz = points[i][1];
    const L = Math.hypot(bx-ax, bz-az) || 1;
    const n = Math.max(1, Math.ceil(L/step));
    for (let k = 0; k <= n; k++) {
      const f = k/n;
      out.push([ax+(bx-ax)*f, az+(bz-az)*f]);
    }
  }
  return out;
}
for (let i = 0; i < rails.length; i++) {
  for (let j = i+1; j < rails.length; j++) {
    if (find2(i) === find2(j)) continue;
    const ri = resamp(rails[i].points, 8), rj = resamp(rails[j].points, 8);
    let minD = Infinity;
    for (const p of ri.filter((_,k) => k%2===0)) {
      for (const q of rj.filter((_,k) => k%2===0)) {
        const dd = Math.hypot(p[0]-q[0], p[1]-q[1]);
        if (dd < minD) minD = dd;
      }
    }
    if (minD >= 8) continue;
    const li = rails[i].points.reduce((s,p,k) => k ? s + Math.hypot(p[0]-rails[i].points[k-1][0], p[1]-rails[i].points[k-1][1]) : 0, 0);
    const lj = rails[j].points.reduce((s,p,k) => k ? s + Math.hypot(p[0]-rails[j].points[k-1][0], p[1]-rails[j].points[k-1][1]) : 0, 0);
    const src = li < lj ? ri : rj, dst = li < lj ? rj : ri;
    let near = 0;
    for (const p of src) {
      let bd = Infinity;
      for (const q of dst) { const dd = Math.hypot(p[0]-q[0], p[1]-q[1]); if (dd<bd) bd=dd; }
      if (bd < 8) near++;
    }
    if (near / src.length > 0.3) union2(i, j);
  }
}
const railClusters = rails.map((r, i) => ({ railId: r.id, clusterId: find2(i) }));
map.railClusters = railClusters;
console.log('Baked railClusters:', new Set(railClusters.map(c => c.clusterId)).size, 'clusters');
console.log(`Baked ${rails.length} railways (${rails.filter(r => r.elev > 0).length} viaduct elev=5m, ${rails.filter(r => r.railway === 'tram').length} tram máº·t Ä‘Æ°á»ng)`);

writeFileSync(mapPath, JSON.stringify(map, null, 2), 'utf8');
console.log('Done.');
