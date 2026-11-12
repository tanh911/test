// 🪧 add_signs.mjs — sinh signs[] cho berlin-mitte-clean.json từ intersections/roads
// Quy tắc StVO:
//   • priority_road junction: nhánh KHÔNG main → Z.205 (Vorfahrt gewähren) + shark teeth
//     (vạch do roadMarkings vẽ theo road.priority); nhánh main → Z.306 (Vorfahrtstraße)
//   • đường một chiều: Z.220 (Einbahnstraße) ở đầu vào chiều luật + Z.267 (Verbot der
//     Einfahrt, flip) ở đầu ngược — chỉ khi đầu đó là intersection
//   • Z.274 (value) khi tiến vào đoạn 30 km/h từ giao lộ có nhánh 50 km/h
// Chạy: node scripts/add_signs.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = join(root, 'src/data/maps/berlin-mitte-clean.json');
const map = JSON.parse(readFileSync(mapPath, 'utf8'));

const roadsById = new Map(map.roads.map((r) => [r.id, r]));
const signs = [];
const seen = new Set();
const seen274 = new Set();
const seen267 = new Set(); // (roadId|type|s rounded) chống trùng
function addSign(type, roadId, s, side, value, flip) {
  const road = roadsById.get(roadId);
  if (!road) return;
  const len = roadCurveOf(road).length;
  if (s < 2 || s > len - 2) return;
  // chống trùng: cùng road, cùng type, lệch < 3 m → bỏ
  const key = `${roadId}|${type}|${Math.round(s / 3)}`;
  if (seen.has(key)) return;
  // Biển không được đứng trên lòng đường (của road khác tại ngã tư nhọn):
  // lùi dọc đường 2 m/bước tối đa 12 m tới khi vị trí thoáng
  const sideNum = side === 'right' ? 1 : -1; // signPosClear can so +-1, khong nhan chuoi!
  const stepDir = s < len * 0.5 ? 2 : -2;
  let sTry = s;
  let ok = false;
  for (let k = 0; k < 6; k++) {
    const st = signPosClear(type, roadId, sTry, sideNum);
    if (st.clear) { ok = true; break; }
    sTry += stepDir;
    if (sTry < 2 || sTry > len - 2) break;
  }
  if (!ok) return;
  seen.add(key);
  if (type === '274') seen274.add(roadId);
  if (type === '267') seen267.add(roadId);
  signs.push({ type, roadId, s: Math.round(sTry * 10) / 10, side, ...(value !== undefined ? { value } : {}), ...(flip ? { flip: true } : {}) });
}

const nodeById = new Map(map.nodes.map((n) => [n.id, n]));
const roadsAtNode = new Map();
for (const r of map.roads) {
  for (const end of ['from', 'to']) {
    if (!roadsAtNode.has(r[end])) roadsAtNode.set(r[end], []);
    roadsAtNode.get(r[end]).push(r);
  }
}
const polylineLen = (pts) => pts.reduce((acc, p, i) => (i ? acc + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

// Nội suy Catmull-Rom Y HỆT mapLoader.roadCurve (centripetal, step 2 m) — polyline
// lệch vài mét trên road cong làm biển đâm vào lòng đường (bug audit bắt được)
const curveCache = new Map();
function roadCurveOf(road) {
  let c = curveCache.get(road.id);
  if (!c) {
    const v3 = road.points.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(v3, false, 'centripetal');
    let length = curve.getLength();
    const n = Math.max(2, Math.ceil(length / 2));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const p = curve.getPointAt(u);
      const t = curve.getTangentAt(u);
      pts.push({ x: p.x, z: p.z, nx: -t.z, nz: t.x });
    }
    if (!isFinite(length) || pts.length < 2) {
      // fallback tuyến tính — road dị thường (trùng điểm/NaN) vẫn đặt được biển
      console.warn('curve fallback cho road', road.id);
      length = road.points.reduce((acc, p, i) => (i ? acc + Math.hypot(p[0] - road.points[i - 1][0], p[1] - road.points[i - 1][1]) : 0), 0);
      pts.length = 0;
      for (let i = 0; i < road.points.length; i++) {
        const prev = road.points[Math.max(0, i - 1)];
        const next = road.points[Math.min(road.points.length - 1, i + 1)];
        const tx = next[0] - prev[0], tz = next[1] - prev[1];
        const tl = Math.hypot(tx, tz) || 1;
        pts.push({ x: road.points[i][0], z: road.points[i][1], nx: -tz / tl, nz: tx / tl });
      }
    }
    c = { pts, length };
    curveCache.set(road.id, c);
  }
  return c;
}
function roadCurveAt(road, s) {
  const c = roadCurveOf(road);
  const clamped = Math.max(0, Math.min(c.length, isFinite(s) ? s : 0));
  const f = (c.pts.length - 1) * (c.length > 0 ? clamped / c.length : 0);
  const i = Math.max(0, Math.min(c.pts.length - 2, Math.floor(f)));
  const t = Math.max(0, Math.min(1, f - i));
  const a = c.pts[i], b = c.pts[i + 1];
  const x = a.x + (b.x - a.x) * t;
  const z = a.z + (b.z - a.z) * t;
  let nx = a.nx + (b.nx - a.nx) * t, nz = a.nz + (b.nz - a.nz) * t;
  const nl = Math.hypot(nx, nz) || 1;
  return { x, z, nx: nx / nl, nz: nz / nl, tx: nz / nl, tz: -nx / nl };
}

// ── Building strips (bản copy buildingStrips của buildings.ts) — né nhà khi đặt biển ──
const BUILDING_DEPTH = 9;
function buildingStripsLocal(b) {
  const road = roadsById.get(b.roadId);
  if (!road) return null;
  const side = b.side === 'right' ? 1 : -1;
  const half = ((road.lanesForward + road.lanesBackward) * road.laneWidth) / 2;
  const frontOff = half + 2.0 + (b.depthOff ?? 0);
  const backOff = frontOff + (b.depth ?? BUILDING_DEPTH);
  const s0 = Math.max(0, b.s);
  const s1 = Math.min(roadCurveOf(road).length, b.s + b.length);
  if (s1 - s0 < 6) return null;
  const strips = [];
  for (let st = s0; st < s1 - 1e-6; st += 3) {
    const e = Math.min(s1, st + 3);
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    for (const ss of [st, e]) {
      const p = roadCurveAt(road, ss);
      for (const off of [frontOff, backOff]) {
        const x = p.x + p.nx * side * off;
        const z = p.z + p.nz * side * off;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      }
    }
    strips.push([minX, minZ, maxX, maxZ]);
  }
  return strips.length ? strips : null;
}
const allStrips = [];
for (const b of map.buildings) {
  const st = buildingStripsLocal(b);
  if (st) allStrips.push(...st);
}

// Tâm biển (world) có nằm trên lòng đường nào không? — như pointInAnyRoad của trafficLights
function signPosClear(type, roadId, s, side) {
  const road = roadsById.get(roadId);
  if (!road) return { clear: false, x: 0, z: 0 };
  const p = roadCurveAt(road, s);
  const half = ((road.lanesForward + road.lanesBackward) * road.laneWidth) / 2;
  // pháp tuyến flow: (nx,nz) là PHẢI flow (khớp RoadPoint của mapLoader)
  const off = half + 1.2;
  const x = p.x + p.nx * side * off;
  const z = p.z + p.nz * side * off;
  for (const r2 of map.roads) {
    const h2 = ((r2.lanesForward + r2.lanesBackward) * r2.laneWidth) / 2;
    const pts = r2.points;
    for (let k = 1; k < pts.length; k++) {
      const vx = pts[k][0] - pts[k - 1][0], vz = pts[k][1] - pts[k - 1][1];
      const l2 = vx * vx + vz * vz || 1;
      const t2 = Math.max(0, Math.min(1, ((x - pts[k - 1][0]) * vx + (z - pts[k - 1][1]) * vz) / l2));
      if (Math.hypot(x - (pts[k - 1][0] + t2 * vx), z - (pts[k - 1][1] + t2 * vz)) < h2 + 0.5) {
        return { clear: false, x, z };
      }
    }
  }
  // trong nhà?
  for (const [a, b2, c, d] of allStrips) {
    if (x > a - 0.2 && x < c + 0.2 && z > b2 - 0.2 && z < d + 0.2) return { clear: false, x, z };
  }
  return { clear: true, x, z };
}

// Kiểm tra đường đôi có dải phân cách (2 nhánh one-way ngược chiều cùng tuyến phố, vd Dorotheenstraße, Unter den Linden, Friedrichstraße)
function isDividedTwinRoad(road) {
  const c1 = roadCurveAt(road, roadCurveOf(road).length * 0.5);
  for (const r2 of map.roads) {
    if (r2.id === road.id) continue;
    if (r2.from === road.to && r2.to === road.from) return true;
    const c2 = roadCurveAt(r2, roadCurveOf(r2).length * 0.5);
    const dist = Math.hypot(c1.x - c2.x, c1.z - c2.z);
    const dot = c1.tx * c2.tx + c1.tz * c2.tz;
    // Cùng tên phố có nhánh ngược chiều trong bán kính 120 m, hoặc đường đôi song song ngược chiều trong 28 m
    if (road.name && r2.name === road.name && dist < 120 && dot < -0.35) return true;
    if (dist < 28 && dot < -0.7 && r2.lanesBackward === 0 && road.lanesBackward === 0) return true;
  }
  return false;
}

for (const ix of map.intersections) {
  const node = nodeById.get(ix.nodeId);
  if (!node) continue;
  const touching = roadsAtNode.get(ix.nodeId) ?? [];
  const maxLimit = Math.max(...touching.map((r) => r.speedLimit));

  for (const road of touching) {
    const half = ((road.lanesForward + road.lanesBackward) * road.laneWidth) / 2;
    const len = roadCurveOf(road).length;
    const margin = Math.min(len * 0.3, half + 3.2);
    const sEnd = len - margin; // điểm gần nút to (approach chiều xuôi / entrance chiều ngược)
    const sFrom = margin;      // điểm gần nút from (entrance chiều xuôi / approach chiều ngược)

    // ── priority_road: Z.205 / Z.306 theo priority của từng road (đặt cho xe ĐANG TIẾN VÀO nút) ──
    if (ix.rule === 'priority_road') {
      const isMain = road.priority === 'main';
      if (road.to === ix.nodeId && road.lanesForward > 0) {
        addSign(isMain ? '306' : '205', road.id, sEnd, 'right');
      }
      if (road.from === ix.nodeId && road.lanesBackward > 0) {
        addSign(isMain ? '306' : '205', road.id, sFrom, 'left', undefined, true);
      }
    }

    // ── Z.274: đặt tại ĐẦU VÀO đoạn đường giới hạn tốc độ thấp hơn (vd Tempo 30) ──
    if (road.speedLimit < maxLimit && !seen274.has(road.id)) {
      if (road.from === ix.nodeId && road.lanesForward > 0) {
        addSign('274', road.id, sFrom, 'right', road.speedLimit);
      }
      if (road.to === ix.nodeId && road.lanesBackward > 0) {
        addSign('274', road.id, sEnd, 'left', road.speedLimit, true);
      }
    }

    // ── Một chiều thật sự (không phải đường đôi 2 chiều tách làn): Z.220 + Z.267 ──
    if (!isDividedTwinRoad(road)) {
      const oneWayForward = road.lanesBackward === 0 && road.lanesForward > 0;
      const oneWayBackward = road.lanesForward === 0 && road.lanesBackward > 0;
      if (oneWayForward) {
        if (road.from === ix.nodeId) addSign('220', road.id, sFrom, 'right');
        if (road.to === ix.nodeId && !seen267.has(road.id)) addSign('267', road.id, sEnd - 2.2, 'left', undefined, true);
      } else if (oneWayBackward) {
        if (road.to === ix.nodeId) addSign('220', road.id, sEnd, 'left', undefined, true);
        if (road.from === ix.nodeId && !seen267.has(road.id)) addSign('267', road.id, sFrom + 2.2, 'right');
      }
    }
  }
}

map.signs = signs;
writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
const byType = {};
for (const s of signs) byType[s.type] = (byType[s.type] || 0) + 1;
console.log(`Đã sinh ${signs.length} biển →`, JSON.stringify(byType));
