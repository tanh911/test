// Flip trục z (bắc→nam) của road_graph_autobahn.json để world three.js đúng hệ phải tay:
// graph y cũ = BẮC+ nhưng three.js ground-plane đúng phải z = NAM+ (x=Đông).
// Mirror trước đây khiến mọi đường oneway ngược chiều thật (twin đứng bên phải thay vì trái).
// Flip: z → -z trên nodes/roads/ways/junctions/bounds. latlonPolyline giữ nguyên (dữ liệu địa lý gốc).
import fs from 'fs';
const PATH = 'src/simulation/data/road_graph_autobahn.json';
const g = JSON.parse(fs.readFileSync(PATH, 'utf8'));

for (const id of Object.keys(g.nodes)) {
  g.nodes[id].z = -g.nodes[id].z;
}
for (const r of g.roads) {
  for (const p of r.centerline) p[1] = -p[1];
}
for (const w of g.ways) {
  for (const p of w.centerline) p[1] = -p[1];
}
for (const j of g.junctions) {
  j.z = -j.z;
  j.center[1] = -j.center[1];
}
const b = g.metadata.bounds;
const [minZ, maxZ] = [-b.maxZ, -b.minZ];
b.minZ = minZ; b.maxZ = maxZ;

fs.writeFileSync(PATH, JSON.stringify(g));
console.log('flipped z in', PATH);
console.log('new bounds:', JSON.stringify(g.metadata.bounds));

// Invariant check: độ dài đường không đổi, twin giờ bên graph-LEFT của our-forward
const roads = g.roads;
const our = roads.find(r => r.id === 'way_293843563');
const twin = roads.find(r => r.id === 'way_101496470');
const px = 1455.7, pz = 18.3; // spawn world SAU flip (đối xứng qua z=0 của frame cũ)
function nearestOnRoad(r, qx, qz) {
  let best = { d: Infinity };
  const pts = r.centerline;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1];
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
    if (!L2) continue;
    let t = ((qx - ax) * dx + (qz - az) * dz) / L2; t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx, cz = az + t * dz;
    const d = Math.hypot(qx - cx, qz - cz);
    if (d < best.d) best = { d, cx, cz, ux: dx / Math.sqrt(L2), uz: dz / Math.sqrt(L2) };
  }
  return best;
}
const ourN = nearestOnRoad(our, px, pz);
const tN = nearestOnRoad(twin, ourN.cx, ourN.cz);
const lat = { x: -ourN.uz, z: ourN.ux }; // phải chiều chạy graph-forward (3 js chuẩn)
const latOff = (tN.cx - ourN.cx) * lat.x + (tN.cz - ourN.cz) * lat.z;
console.log('twin latOff (our-right+):', latOff.toFixed(1), 'dirDot:', (tN.ux * ourN.ux + tN.uz * ourN.uz).toFixed(2));
console.log(latOff < 0 ? '✅ twin giờ bên TRÁI chiều graph-forward → đi xuôi = đúng Rechtşfahrgebot' : '❌ twin vẫn bên phải!');
