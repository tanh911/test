// ðŸŒ³ add_parks.mjs â€” bake polygon cÃ´ng viÃªn (leisure=park/garden OSM) vÃ o
// berlin-mitte-clean.json (parks: [{id,name,points}]) â€” CÃ™NG Gá»C 52.5170/13.3888
// Cháº¡y: node scripts/add_parks.mjs
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

const parks = [];
for (const pk of osm.parks || []) {
  const pts = (pk.nodes || []).map(id => byId.get(String(id))).filter(Boolean)
    .map(n => {
      const [x, z] = toXY(n.lat, n.lon);
      return [Math.round(x * 100) / 100, Math.round(z * 100) / 100];
    });
  if (pts.length < 3) continue;
  // bá» náº¿u toÃ n bá»™ ngoÃ i map (x/z Â±750)
  const inside = pts.some(([x, z]) => x > -750 && x < 750 && z > -750 && z < 750);
  if (!inside) continue;
  parks.push({ id: String(pk.id), name: pk.tags?.name || '', points: pts });
}
map.parks = parks;
writeFileSync(mapPath, JSON.stringify(map, null, 2), 'utf8');
console.log(`baked ${parks.length} parks:`, parks.map(p => p.name || p.id).join(', '));
