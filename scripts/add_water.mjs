// 🌊 add_water.mjs — gắn mặt nước (Spree + Spreekanal) vào berlin-mitte-clean.json
// Nguồn: scripts/osm_pbf_extracted_stadt.json (waterways), quy đổi lat/lon → toạ độ
// map bằng cùng gốc REF 52.5170/13.3888 như scripts/osm_to_roadgraph.py (z dương = bắc).
// Chạy: node scripts/add_water.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
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

// Bề rộng thực đo tại Mitte: Spree ~58 m, Spreekanal ~30 m (Google Maps đối chiếu)
const SPECS = [
  { id: 'spree', name: 'Spree', width: 58 },
  { id: 'spreekanal', name: 'Spreekanal', width: 30 }
];

const mapMinX = -685, mapMaxX = 685, mapMinZ = -644, mapMaxZ = 644;
const MARGIN = 120; // giữ thêm ngoài mép map để miệng sông không cắt cụt ở rìa

const waters = [];
for (const spec of SPECS) {
  const w = (osm.waterways || []).find((x) => x.tags?.name === spec.name);
  if (!w) { console.error('Không tìm thấy waterway', spec.name); continue; }
  const pts = (w.nodes || [])
    .map((id) => byId.get(String(id)))
    .filter(Boolean)
    .map((p) => toXY(p.lat, p.lon))
    .filter(([x, z]) => x >= mapMinX - MARGIN && x <= mapMaxX + MARGIN && z >= mapMinZ - MARGIN && z <= mapMaxZ + MARGIN);
  if (pts.length < 2) { console.error(spec.name, 'không có điểm trong map'); continue; }
  waters.push({ id: spec.id, name: spec.name, width: spec.width, points: pts.map(([x, z]) => [Math.round(x * 10) / 10, Math.round(z * 10) / 10]) });
  console.log(`${spec.name}: ${pts.length} điểm · width ${spec.width} m · đầu ${pts[0].map((v) => v.toFixed(0))} → cuối ${pts[pts.length - 1].map((v) => v.toFixed(0))}`);
}

map.waters = waters;
writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
console.log('Đã ghi waters vào', mapPath);
