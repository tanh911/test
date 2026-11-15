// 🌉 add_bridge_flags.mjs — đánh dấu road có bridge=yes từ OSM ways:
//   road.sample point cách polyline bridge-way ≤ 8m → road.bridge = true
// (ưu tiên tag OSM — feedback: water-crossing detect làm fallback)
// Chạy: node scripts/add_bridge_flags.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
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

const bridgePolys = [];
for (const w of osm.ways || []) {
  const b = w.tags?.bridge;
  if (b === 'yes' || b === 'true' || b === '1' || b === 'viaduct') {
    const pts = (w.nodes || []).map(id => byId.get(String(id))).filter(Boolean)
      .map(n => toXY(n.lat, n.lon));
    if (pts.length >= 2) bridgePolys.push({ name: w.tags?.name || '', pts });
  }
}
console.log('bridge ways:', bridgePolys.map(p => p.name).join(', '));

function distToPolyline(px, pz, pts) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const vx = pts[i][0] - pts[i - 1][0], vz = pts[i][1] - pts[i - 1][1];
    const l2 = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((px - pts[i - 1][0]) * vx + (pz - pts[i - 1][1]) * vz) / l2));
    best = Math.min(best, Math.hypot(px - (pts[i - 1][0] + vx * t), pz - (pts[i - 1][1] + vz * t)));
  }
  return best;
}

let flagged = 0;
// FALLBACK (user đề xuất): road băng qua polygon nước (map.waters, polyline gốc)
// cũng đánh dấu bridge=true — các bridge way OSM đã bị osm_to_roadgraph bỏ mất
function distToWater(px, pz) {
  let best = Infinity;
  for (const w of map.waters || []) {
    const pts = w.points;
    for (let i = 1; i < pts.length; i++) {
      const vx = pts[i][0] - pts[i - 1][0], vz = pts[i][1] - pts[i - 1][1];
      const l2 = vx * vx + vz * vz || 1;
      const t = Math.max(0, Math.min(1, ((px - pts[i - 1][0]) * vx + (pz - pts[i - 1][1]) * vz) / l2));
      best = Math.min(best, Math.hypot(px - (pts[i - 1][0] + vx * t), pz - (pts[i - 1][1] + vz * t)));
    }
  }
  return best;
}
for (const r of map.roads) {
  const inWater = r.points.filter(p => distToWater(p[0], p[1]) < 20).length;
  if (inWater >= 2 && !r.bridge) { r.bridge = true; flagged++; console.log('  🌉 (water fallback)', r.id, r.name || ''); continue; }
}
for (const r of map.roads) {
  const n = r.points.length;
  const samples = [];
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    const fi = Math.min(n - 1, Math.floor(f * (n - 1)));
    samples.push(r.points[fi]);
  }
  const hit = bridgePolys.some(bp => samples.some(s => distToPolyline(s[0], s[1], bp.pts) < 8));
  if (hit) { r.bridge = true; flagged++; console.log('  🌉', r.id, r.name || ''); }
  else if (r.bridge) delete r.bridge;
}
writeFileSync(mapPath, JSON.stringify(map, null, 2), 'utf8');
console.log('flagged:', flagged, 'roads');
