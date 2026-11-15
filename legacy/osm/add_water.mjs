// ðŸŒŠ add_water.mjs â€” gáº¯n máº·t nÆ°á»›c (Spree + Spreekanal) vÃ o berlin-mitte-clean.json
// Nguá»“n: scripts/osm_pbf_extracted_stadt.json (waterways), quy Ä‘á»•i lat/lon â†’ toáº¡ Ä‘á»™
// map báº±ng cÃ¹ng gá»‘c REF 52.5170/13.3888 nhÆ° scripts/osm_to_roadgraph.py (z dÆ°Æ¡ng = báº¯c).
// Cháº¡y: node scripts/add_water.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const mapPath = join(root, 'src/data/maps/berlin-mitte-clean.json');
const osmPath = join(root, 'scripts/osm_pbf_extracted_stadt.json');

const R = 6371000, refLat = 52.5170, refLon = 13.3888;
const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const osm = JSON.parse(readFileSync(osmPath, 'utf8'));
const byId = new Map(Object.entries(osm.nodes).map(([id, n]) => [String(id), n]));
const toXY = (lat, lon) => [
  (lon - refLon) * Math.PI / 180 * R * Math.cos(refLat * Math.PI / 180),
  (lat - refLat) * Math.PI / 180 * R
];

// Bá» rá»™ng thá»±c Ä‘o táº¡i Mitte: Spree ~58 m, Spreekanal ~30 m (Google Maps Ä‘á»‘i chiáº¿u)
const SPECS = [
  { id: 'spree', name: 'Spree', width: 58 },
  { id: 'spreekanal', name: 'Spreekanal', width: 30 }
];

const mapMinX = -685, mapMaxX = 685, mapMinZ = -644, mapMaxZ = 644;
const MARGIN = 120; // giá»¯ thÃªm ngoÃ i mÃ©p map Ä‘á»ƒ miá»‡ng sÃ´ng khÃ´ng cáº¯t cá»¥t á»Ÿ rÃ¬a

const waters = [];
for (const spec of SPECS) {
  const w = (osm.waterways || []).find((x) => x.tags?.name === spec.name);
  if (!w) { console.error('KhÃ´ng tÃ¬m tháº¥y waterway', spec.name); continue; }
  const pts = (w.nodes || [])
    .map((id) => byId.get(String(id)))
    .filter(Boolean)
    .map((p) => toXY(p.lat, p.lon))
    .filter(([x, z]) => x >= mapMinX - MARGIN && x <= mapMaxX + MARGIN && z >= mapMinZ - MARGIN && z <= mapMaxZ + MARGIN);
  if (pts.length < 2) { console.error(spec.name, 'khÃ´ng cÃ³ Ä‘iá»ƒm trong map'); continue; }
  waters.push({ id: spec.id, name: spec.name, width: spec.width, points: pts.map(([x, z]) => [Math.round(x * 10) / 10, Math.round(z * 10) / 10]) });
  console.log(`${spec.name}: ${pts.length} Ä‘iá»ƒm Â· width ${spec.width} m Â· Ä‘áº§u ${pts[0].map((v) => v.toFixed(0))} â†’ cuá»‘i ${pts[pts.length - 1].map((v) => v.toFixed(0))}`);
}

map.waters = waters;
writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
console.log('ÄÃ£ ghi waters vÃ o', mapPath);
