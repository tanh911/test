// ðŸ” diag_berlin_signs.mjs â€” cháº©n Ä‘oÃ¡n khoáº£ng cÃ¡ch snap WFSâ†’road graph theo tá»«ng Ä‘Æ°á»ng
// Cháº¡y: node scripts/diag_berlin_signs.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const mapPath = join(root, 'src/data/maps/berlin-mitte-clean.json');
const cachePath = join(root, 'scripts/berlin_signs_wfs_cache.json');

const R = 6371000, refLat = 52.5170, refLon = 13.3888;
const toXY = (lat, lon) => [
  ((lon - refLon) * Math.PI) / 180 * R * Math.cos((refLat * Math.PI) / 180),
  ((lat - refLat) * Math.PI) / 180 * R,
];

const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const masts = JSON.parse(readFileSync(cachePath, 'utf8'));

// bbox tá»«ng road â†’ lá»c sá»›m
const roads = map.roads.map((r) => {
  const xs = r.points.map((p) => p[0]), zs = r.points.map((p) => p[1]);
  return { r, minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
});

function snap(x, z) {
  let best = null;
  for (const { r, minX, maxX, minZ, maxZ } of roads) {
    if (x < minX - 30 || x > maxX + 30 || z < minZ - 30 || z > maxZ + 30) continue;
    for (let i = 0; i < r.points.length - 1; i++) {
      const [ax, az] = r.points[i], [bx, bz] = r.points[i + 1];
      const dx = bx - ax, dz = bz - az;
      const l = Math.hypot(dx, dz);
      if (l < 1e-9) continue;
      const tx = dx / l, tz = dz / l;
      const t = Math.max(0, Math.min(l, (x - ax) * tx + (z - az) * tz));
      const px = ax + tx * t, pz = az + tz * t;
      const d = Math.hypot(x - px, z - pz);
      if (!best || d < best.d) best = { d, name: r.name || '(khÃ´ng tÃªn)', roadId: r.id };
    }
  }
  return best;
}

// gom theo tÃªn Ä‘Æ°á»ng WFS
const byStreet = new Map();
for (const f of masts) {
  let [lon, lat] = f.geometry.coordinates;
  if (lat < lon) [lon, lat] = [lat, lon];
  const [x, z] = toXY(lat, lon);
  const p = f.properties || {};
  const st = p.strasse || '(none)';
  const hit = snap(x, z);
  if (!byStreet.has(st)) byStreet.set(st, []);
  byStreet.get(st).push(hit ? hit.d : Infinity);
}

const rows = [...byStreet.entries()]
  .map(([st, ds]) => {
    const ok = ds.filter((d) => d !== Infinity);
    const med = ok.length ? ok.sort((a, b) => a - b)[Math.floor(ok.length / 2)] : Infinity;
    const roadNames = {};
    return { st, n: ds.length, med, within12: ok.filter((d) => d <= 12).length };
  })
  .sort((a, b) => b.n - a.n);

console.log('ÄÆ°á»ng (WFS)              | n cá»™t | p50 snap | â‰¤12m');
for (const r of rows.slice(0, 35)) {
  console.log(
    `${r.st.padEnd(24)} | ${String(r.n).padStart(5)} | ${Number.isFinite(r.med) ? r.med.toFixed(1).padStart(8) : '  â€”'.padStart(8)} | ${String(r.within12).padStart(5)}`
  );
}
const all = masts.map((f) => {
  let [lon, lat] = f.geometry.coordinates;
  if (lat < lon) [lon, lat] = [lat, lon];
  const [x, z] = toXY(lat, lon);
  return snap(x, z)?.d ?? Infinity;
});
const okAll = all.filter((d) => d !== Infinity).sort((a, b) => a - b);
console.log(`\nTá»•ng: ${all.length} cá»™t, snap Ä‘Æ°á»£c: ${okAll.length}`);
const pct = (q) => okAll[Math.floor(q * (okAll.length - 1))];
for (const q of [0.1, 0.25, 0.5, 0.75, 0.9]) console.log(`  p${q * 100}: ${pct(q).toFixed(1)} m`);
