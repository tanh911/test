// 🏗️ remove_piercing_buildings.mjs — xóa buildings xuyên qua rail viaduct deck
// Idempotent: chạy nhiều lần không thay đổi kết quả
// Chạy: node scripts/remove_piercing_buildings.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(readFileSync(join(root, 'src/data/maps/berlin-mitte-clean.json'), 'utf8'));
const roads = new Map(map.roads.map(r => [r.id, r]));

function roadPointAt(pts, s) {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i][0] - pts[i-1][0], pts[i][1] - pts[i-1][1]);
    if (acc + L >= s) {
      const f = (s - acc) / L || 0;
      return [pts[i-1][0] + (pts[i][0]-pts[i-1][0])*f, pts[i-1][1] + (pts[i][1]-pts[i-1][1])*f];
    }
    acc += L;
  }
  return pts[pts.length-1];
}

const viaductPts = [];
for (const rail of map.rails || []) {
  if (rail.elev <= 0) continue;
  for (const p of rail.points) viaductPts.push([p[0], p[1], rail.elev]);
}

const removed = [];
const kept = [];
for (const b of map.buildings) {
  const road = roads.get(b.roadId);
  if (!road) { kept.push(b); continue; }
  const midS = b.s + b.length / 2;
  const p2 = roadPointAt(road.points, midS);
  const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
  const sd = b.side === 'right' ? 1 : -1;
  const off = half + 2.0 + 2.25; // building center: half + 2 + depth/2
  // Tính normal từ road points tại midS
  const rp = road.points;
  let nx = 0, nz = 1;
  let acc = 0;
  for (let i = 1; i < rp.length; i++) {
    const L = Math.hypot(rp[i][0]-rp[i-1][0], rp[i][1]-rp[i-1][1]);
    if (acc + L >= midS) {
      nx = -(rp[i][1]-rp[i-1][1]) / L; nz = (rp[i][0]-rp[i-1][0]) / L;
      break;
    }
    acc += L;
  }
  const cx = p2[0] + nx * sd * off;
  const cz = p2[1] + nz * sd * off;
  const height = (b.floors || 3) * 3;
  let pierce = false;
  for (const [vx, vz, velev] of viaductPts) {
    const dd = Math.hypot(cx - vx, cz - vz);
    if (dd < 25 && height >= velev - 0.5) { pierce = true; break; }
  }
  if (pierce) { removed.push(`${b.roadId}@s=${b.s} floors=${b.floors}`); continue; }
  kept.push(b);
}
console.log(`Removed ${removed.length} piercing buildings (kept ${kept.length})`);
if (removed.length) console.log('  ', removed.slice(0, 8).join(' | '));
map.buildings = kept;
writeFileSync(join(root, 'src/data/maps/berlin-mitte-clean.json'), JSON.stringify(map, null, 2), 'utf8');
