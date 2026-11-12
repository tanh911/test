// 🏷️ add_street_names.mjs — gắn tên phố thật (OSM Berlin) vào từng road của
// berlin-mitte-clean.json. Match hình học: mỗi road → named way gần nhất.
// Chạy: node scripts/add_street_names.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = join(root, 'src/data/maps/berlin-mitte-clean.json');
const osmPath = join(root, 'scripts/osm_pbf_extracted_stadt.json');

// ── gốc toạ độ của map (khớp scripts/osm_to_roadgraph.py) ──
const R = 6371000, refLat = 52.5170, refLon = 13.3888;

const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const osm = JSON.parse(readFileSync(osmPath, 'utf8'));
const byId = new Map(Object.entries(osm.nodes).map(([id, n]) => [String(id), n]));
const namedWays = (osm.ways || [])
  .filter((w) => w.tags && w.tags.name)
  .map((w) => ({ name: w.tags.name, pts: (w.nodes || []).map((id) => byId.get(String(id))).filter(Boolean) }))
  .filter((w) => w.pts.length > 1);

function bestMatch(points) {
  let best = null, bestD = Infinity;
  for (const w of namedWays) {
    let d = 0;
    for (const [px, pz] of points) {
      const lat = refLat + (pz / R) * 180 / Math.PI;
      const lon = refLon + (px / (R * Math.cos(refLat * Math.PI / 180))) * 180 / Math.PI;
      let bd = Infinity;
      for (const p of w.pts) {
        const dd = Math.hypot((p.lat - lat) * 111000, (p.lon - lon) * 111000 * Math.cos(refLat * Math.PI / 180));
        if (dd < bd) bd = dd;
      }
      if (bd > d) d = bd;
      if (d > bestD) break;
    }
    if (d < bestD) { bestD = d; best = w.name; }
  }
  return { name: best, err: bestD };
}

let named = 0, weak = 0;
for (const r of map.roads) {
  const { name, err } = bestMatch(r.points);
  if (name) {
    r.name = name;
    if (err > 120) { r.nameConfidence = 'low'; weak++; }
    else named++;
  }
}

writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
console.log(`Đã gắn tên: ${named} road chắc chắn, ${weak} road sai số thấp (nhãn tham khảo) / tổng ${map.roads.length}`);
const uniq = [...new Set(map.roads.map((r) => r.name).filter(Boolean))];
console.log(`Số phố khác nhau: ${uniq.length}`);
