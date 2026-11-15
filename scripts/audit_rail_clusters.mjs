// 🚆 audit_rail_clusters.mjs — P1.1: gom track thành cụm (union-find),
// đo elev/cụm, xác nhận/bác bỏ giả thuyết "một cụm nhiều elev khác nhau".
// Chạy: node scripts/audit_rail_clusters.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(readFileSync(join(root, 'src/data/maps/berlin-mitte-clean.json'), 'utf8'));
const rails = map.rails || [];

// ── Khoảng cách giữa 2 polyline (min dist giữa các sample 5m) ──
function resamplePts(points, step = 5) {
  const out = [];
  for (let i = 1; i < points.length; i++) {
    const ax = points[i - 1][0], az = points[i - 1][1];
    const bx = points[i][0], bz = points[i][1];
    const L = Math.hypot(bx - ax, bz - az) || 1;
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k <= n; k++) {
      const f = k / n;
      out.push([ax + (bx - ax) * f, az + (bz - az) * f]);
    }
  }
  return out;
}
function distPolyPoly(ptsA, ptsB) {
  const a = resamplePts(ptsA, 8), b = resamplePts(ptsB, 8);
  let best = Infinity;
  for (const p of a) {
    for (const q of b) {
      const dd = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (dd < best) best = dd;
    }
  }
  return best;
}

// ── Union-find ──
const parent = rails.map((_, i) => i);
function find(i) { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; }
function union(a, b) { parent[find(a)] = find(b); }

// ── Ghép cặp: 2 rail song song trong < 8m cho > 30% chiều dài ngắn hơn ──
const resampled = rails.map(r => resamplePts(r.points, 8));
for (let i = 0; i < rails.length; i++) {
  for (let j = i + 1; j < rails.length; j++) {
    if (find(i) === find(j)) continue;
    // nhanh: AABB cách xa > 30m skip
    const ai = resampled[i], aj = resampled[j];
    let minD = Infinity;
    // sample thưa hơn cho tốc độ
    const aThin = ai.filter((_, k) => k % 2 === 0);
    const bThin = aj.filter((_, k) => k % 2 === 0);
    for (const p of aThin) {
      for (const q of bThin) {
        const dd = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (dd < minD) minD = dd;
      }
    }
    // chiều dài ngắn hơn
    const lenI = rails[i].points.reduce((s, p, k) => k ? s + Math.hypot(p[0] - rails[i].points[k-1][0], p[1] - rails[i].points[k-1][1]) : 0, 0);
    const lenJ = rails[j].points.reduce((s, p, k) => k ? s + Math.hypot(p[0] - rails[j].points[k-1][0], p[1] - rails[j].points[k-1][1]) : 0, 0);
    const shorter = Math.min(lenI, lenJ);
    // > 30% chiều dài ngắn hơn nằm trong 8m → cùng cụm
    if (minD < 8) {
      // tính % sample của rail ngắn hơn cách rail kia < 8m
      const src = lenI < lenJ ? ai : aj;
      const dst = lenI < lenJ ? aj : ai;
      let near = 0;
      for (const p of src) {
        let bd = Infinity;
        for (const q of dst) { const dd = Math.hypot(p[0]-q[0], p[1]-q[1]); if (dd < bd) bd = dd; }
        if (bd < 8) near++;
      }
      if (near / src.length > 0.3) union(i, j);
    }
  }
}

// ── Gom cụm ──
const clusters = new Map();
for (let i = 0; i < rails.length; i++) {
  const root_ = find(i);
  if (!clusters.has(root_)) clusters.set(root_, []);
  clusters.get(root_).push(i);
}

console.log(`═══ P1.1: ${rails.length} rails → ${clusters.size} cụm ═══\n`);

const clusterData = [];
let ci = 0;
for (const [root_, members] of clusters) {
  ci++;
  const elevs = [...new Set(members.map(i => rails[i].elev))];
  const types = [...new Set(members.map(i => rails[i].railway))];
  const names = [...new Set(members.map(i => rails[i].name).filter(Boolean))];
  const totalLen = members.reduce((s, i) => {
    const pts = rails[i].points;
    return s + pts.reduce((acc, p, k) => k ? acc + Math.hypot(p[0]-pts[k-1][0], p[1]-pts[k-1][1]) : 0, 0);
  }, 0);
  const info = {
    clusterId: ci, tracks: members.length, elevs,
    types, names: names.slice(0, 3),
    totalLen: Math.round(totalLen),
    railIds: members.map(i => rails[i].id),
  };
  clusterData.push(info);
  const elevStr = elevs.length > 1 ? `⚠️ NHIỀU ELEV: [${elevs.join(', ')}]` : `elev=${elevs[0]}`;
  console.log(`Cụm ${ci}: ${members.length} track · ${elevStr} · ${types.join('/')} · ${Math.round(totalLen)}m · ${names.slice(0,2).join(', ') || '(không tên)'}`);
}

// Đếm cụm nhiều elev
const multiElev = clusterData.filter(c => c.elevs.length > 1).length;
console.log(`\nCụm nhiều elev: ${multiElev}/${clusters.size}`);
if (multiElev > 0) {
  console.log('  → GIẢ THUYẾT XÁC NHẬN: có cụm chứa track ở nhiều độ cao khác nhau');
  for (const c of clusterData.filter(c => c.elevs.length > 1)) {
    console.log(`    Cụm ${c.clusterId}: elevs=[${c.elevs.join(',')}] tracks=${c.tracks}`);
  }
} else {
  console.log('  → Mỗi cụm 1 elev duy nhất — không cần tách cụm');
}

// Dump cho P1.2
writeFileSync(join(root, 'scripts', 'rail_clusters.json'), JSON.stringify({
  clusters: clusterData,
  assignments: rails.map((r, i) => ({ railId: r.id, clusterId: find(i) })),
}), 'utf8');
console.log('Dump → scripts/rail_clusters.json');
