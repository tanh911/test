// 🛣️ roadMesh.ts — mặt đường + đa giác ngã tư (Protocol mục 4.1)
// Đầu vào: GameMap; đầu ra: quad dữ liệu đưa vào ChunkBuilder (mục 7).
// Quy ước trục (mục 1): y=0 mặt đường, 1 unit = 1 m.
// Điểm nội suy dùng chung từ mapLoader.roadCurve (getPointAt đều theo cung) —
// ribbon/markings/sidewalk dùng CÙNG điểm + chiều dài → không trôi trên đường cong.
import * as THREE from 'three';
import type { GameMap, MapRoad } from './mapLoader';
import { roadCurve, roadLength, roadPointAt } from './mapLoader';

export interface Quad {
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
  d: [number, number, number];
}

/** half-width của road (một nửa tổng chiều rộng) */
export function roadHalfWidth(road: MapRoad): number {
  const full = (road.lanesForward + road.lanesBackward) * road.laneWidth;
  return full / 2;
}

/** Chiều dài polyline (tổng các đoạn) */
export function polylineLength(points: [number, number][]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

/** Điểm + pháp tuyến trên polyline tại khoảng cách s */
export function pointWithNormalAtS(
  points: [number, number][],
  s: number
): { x: number; z: number; nx: number; nz: number; tx: number; tz: number } {
  let remaining = Math.max(0, s);
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[i + 1];
    const segLen = Math.hypot(x1 - x0, z1 - z0);
    const t = segLen > 0 ? Math.min(1, remaining / segLen) : 0;
    if (remaining <= segLen || i === points.length - 2) {
      const tx = (x1 - x0) / (segLen || 1);
      const tz = (z1 - z0) / (segLen || 1);
      return {
        x: x0 + (x1 - x0) * t,
        z: z0 + (z1 - z0) * t,
        nx: -tz,
        nz: tx,
        tx,
        tz
      };
    }
    remaining -= segLen;
  }
  const [x0, z0] = points[points.length - 2];
  const [x1, z1] = points[points.length - 1];
  const segLen = Math.hypot(x1 - x0, z1 - z0) || 1;
  const tx = (x1 - x0) / segLen;
  const tz = (z1 - z0) / segLen;
  return { x: x1, z: z1, nx: -tz, nz: tx, tx, tz };
}

/**
 * Dải mặt đường cho 1 road — CẮT ĐÚNG tại ranh giới skip zone (G1-2):
 * không bỏ cả quad; quad chạm ranh giới được nội suy điểm biên chính xác.
 */
export function roadRibbonQuads(
  road: MapRoad,
  skipZones: Array<[number, number]> = []
): Quad[] {
  const half = roadHalfWidth(road);
  const curve = roadCurve(road);
  const L = curve.length;
  const quads: Quad[] = [];

  // khoảng nhìn thấy = [0, L] trừ skip zones
  const vis: Array<[number, number]> = [];
  let cur = 0;
  for (const [a, b] of skipZones) {
    if (b <= 0 || a >= L) continue;
    if (a > cur) vis.push([cur, Math.min(a, L)]);
    cur = Math.max(cur, b);
  }
  if (cur < L) vis.push([cur, L]);

  const step = curve.step;
  const emit = (pa: { x: number; z: number; nx: number; nz: number }, pb: { x: number; z: number; nx: number; nz: number }) => {
    quads.push({
      a: [pa.x - pa.nx * half, 0, pa.z - pa.nz * half],
      b: [pa.x + pa.nx * half, 0, pa.z + pa.nz * half],
      c: [pb.x + pb.nx * half, 0, pb.z + pb.nz * half],
      d: [pb.x - pb.nx * half, 0, pb.z - pb.nz * half]
    });
  };

  for (const [va, vb] of vis) {
    let pa = roadPointAt(road, va);
    let lastS = va;
    // đi qua các sample điểm nội tuyến (step đều theo cung)
    for (let s = Math.ceil(va / step) * step; s < vb - 1e-6; s += step) {
      if (s <= lastS + 1e-6) continue;
      const pb = roadPointAt(road, s);
      emit(pa, pb);
      pa = pb;
      lastS = s;
    }
    if (vb - lastS > 1e-4) {
      const pb = roadPointAt(road, vb); // biên cuối chính xác
      emit(pa, pb);
    }
  }
  return quads;
}

/**
 * Đa giác ngã tư — G1-3: BAO LỒI (convex hull) chỉ từ góc PHÍA TRƯỚC miệng nhánh:
 * mỗi nhánh cho đúng 2 góc d·K + n·K và d·K − n·K với K = roadHalfWidth + 0.75
 * (CHỒNG LẤN 0,75 m lên ribbon — khớp với pad vỉa hè kéo vào 0,5 m: mọi khe
 * cỏ giữa các lớp phủ ≤ 0,05 m; ranh giới skip zone của roadSkipZones khớp K này),
 * cộng thêm điểm node (0,0). KHÔNG thêm góc sau d·(−K) ± n·K: vùng −d thuộc
 * chính ribbon của road đó (skip zone nội suy biên chính xác tại K), góc sau
 * chỉ làm hull phình ra mà không phủ miệng nhánh nào. Nhựa tổng thể LỒI,
 * không phóng ra ngoài: mọi đỉnh là node hoặc cách node ≤ √2 · K_max
 * (K_max = max K của các nhánh).
 * Trả về quads (fan quanh node) + poly TOẠ ĐỘ CỤC BỘ (so với node) cho test.
 */
export interface JunctionResult {
  asphaltQuads: Quad[];
  sidewalkQuads: Quad[];
  curbQuads: Quad[];
  poly: Array<[number, number]>;
}

/**
 * Xây dựng toàn bộ hình học nút giao thống nhất (Unified Junction Architecture):
 * 1. Gom các nhánh theo góc xoay quanh node (CCW).
 * 2. Cắt lùi mỗi nhánh một đoạn d >= 5.5m (dừng ribbon, vỉa hè, vạch tại d).
 * 3. Tạo đa giác nhựa liền khối: nối miệng các nhánh và giao điểm mép đường (miter limit).
 * 4. Tự động sinh vỉa hè bao quanh mép nút giao, nối khít 100% với vỉa hè của từng nhánh.
 */
export function buildJunctionMesh(
  nodeX: number,
  nodeZ: number,
  connectedRoads: Array<{ road: MapRoad; dirX: number; dirZ: number }>
): JunctionResult {
  const SIDEWALK_W = 2.5;
  const SIDEWALK_H = 0.15;
  const asphaltQuads: Quad[] = [];
  const sidewalkQuads: Quad[] = [];
  const curbQuads: Quad[] = [];

  if (connectedRoads.length < 2) {
    return { asphaltQuads, sidewalkQuads, curbQuads, poly: [] };
  }

  type Arm = {
    road: MapRoad;
    dir: [number, number];
    norm: [number, number];
    ang: number;
    half: number;
    d: number;
    L: [number, number];
    R: [number, number];
    L_out: [number, number];
    R_out: [number, number];
  };

  const maxW = Math.max(...connectedRoads.map(c => roadHalfWidth(c.road)));
  const isMultiArm = connectedRoads.length >= 3;

  // Tính arm cut có tính đến acute gore
  const arms: Arm[] = connectedRoads.map(({ road, dirX, dirZ }) => {
    const half = roadHalfWidth(road);
    // Góc CCW chuẩn Three.js trong mặt phẳng (X, Z) nhìn từ +Y xuống: (Math.atan2(-dz, dx) + 2*PI) % 2*PI
    const ang = ((Math.atan2(-dirZ, dirX) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    // Pháp tuyến bên phải khi đi từ node ra ngoài theo dir: quay 90 độ CW quanh +Y -> [-dirZ, dirX]
    const norm: [number, number] = [-dirZ, dirX];
    const len = roadLength(road);
    let d = isMultiArm ? Math.max(5.5, maxW * 1.5) : half + 0.75;

    // Check acute gore (< 60 độ)
    for (const other of connectedRoads) {
      if (other.road.id === road.id) continue;
      const dot = dirX * other.dirX + dirZ * other.dirZ;
      if (dot > 0.5) {
        const oHalf = roadHalfWidth(other.road);
        const angDiff = Math.acos(Math.max(-1, Math.min(1, dot)));
        const sinHalf = Math.sin(angDiff / 2);
        const goreD = (half + oHalf + 0.2) / (2 * Math.max(0.08, sinHalf));
        d = Math.max(d, goreD);
      }
    }
    d = Math.min(d, len * 0.45);

    const px = nodeX + dirX * d;
    const pz = nodeZ + dirZ * d;
    // Đi từ node ra ngoài: Bên phải là +norm, Bên trái là -norm
    const R: [number, number] = [px + norm[0] * half, pz + norm[1] * half];
    const L: [number, number] = [px - norm[0] * half, pz - norm[1] * half];
    const R_out: [number, number] = [px + norm[0] * (half + SIDEWALK_W), pz + norm[1] * (half + SIDEWALK_W)];
    const L_out: [number, number] = [px - norm[0] * (half + SIDEWALK_W), pz - norm[1] * (half + SIDEWALK_W)];

    return { road, dir: [dirX, dirZ] as [number, number], norm, ang, half, d, L, R, L_out, R_out };
  }).sort((a, b) => a.ang - b.ang);

  const N = arms.length;
  const perimeter: Array<[number, number]> = [];

  // Danh sách các đoạn cạnh viền ngã tư (curb edge) cần làm vỉa hè
  type CurbEdge = {
    p1: [number, number];
    p2: [number, number];
    out1: [number, number];
    out2: [number, number];
  };
  const curbEdges: CurbEdge[] = [];

  for (let i = 0; i < N; i++) {
    const A = arms[i];
    const B = arms[(i + 1) % N];

    // Miệng nhánh A: đi từ R_A sang L_A theo chiều CCW
    perimeter.push(A.R);
    perimeter.push(A.L);

    // Góc bo giữa nhánh A và nhánh B kế tiếp: kết nối từ L_A sang R_B
    const dAx = A.dir[0], dAz = A.dir[1];
    const dBx = B.dir[0], dBz = B.dir[1];
    // Giao điểm 2 tia: L_A - d_A * t = R_B - d_B * u
    const det = dAz * dBx - dAx * dBz;
    let cornerPt: [number, number] | null = null;

    if (Math.abs(det) > 0.05) {
      const rx = A.L[0] - B.R[0];
      const rz = A.L[1] - B.R[1];
      const t = (-rx * dBz + rz * dBx) / det;
      const u = (-rx * dAz + rz * dAx) / det;

      if (t >= 0.0 && u >= 0.0) {
        const cx = A.L[0] - dAx * t;
        const cz = A.L[1] - dAz * t;
        const midX = (A.L[0] + B.R[0]) / 2;
        const midZ = (A.L[1] + B.R[1]) / 2;
        const distToChord = Math.hypot(cx - midX, cz - midZ);

        if (distToChord <= 6.0) {
          cornerPt = [cx, cz];
        }
      }
    }

    if (cornerPt) {
      perimeter.push(cornerPt);

      // 2 cạnh góc bo: L_A -> cornerPt và cornerPt -> R_B
      // Pháp tuyến hướng ra ngoài vỉa hè (bên phải của vector đi E1 -> E2)
      const e1x = cornerPt[0] - A.L[0], e1z = cornerPt[1] - A.L[1];
      const l1 = Math.hypot(e1x, e1z) || 1;
      const n1x = e1z / l1, n1z = -e1x / l1;

      const e2x = B.R[0] - cornerPt[0], e2z = B.R[1] - cornerPt[1];
      const l2 = Math.hypot(e2x, e2z) || 1;
      const n2x = e2z / l2, n2z = -e2x / l2;

      // Điểm miter bên ngoài vỉa hè tại cornerPt
      const bisNx = (n1x + n2x) / 2, bisNz = (n1z + n2z) / 2;
      const bisLen = Math.hypot(bisNx, bisNz) || 1;
      const cOut: [number, number] = [
        cornerPt[0] + (bisNx / bisLen) * SIDEWALK_W,
        cornerPt[1] + (bisNz / bisLen) * SIDEWALK_W
      ];

      curbEdges.push({
        p1: A.L,
        p2: cornerPt,
        out1: A.L_out,
        out2: cOut
      });
      curbEdges.push({
        p1: cornerPt,
        p2: B.R,
        out1: cOut,
        out2: B.R_out
      });
    } else {
      // Chamfer trực tiếp từ L_A sang R_B
      const ex = B.R[0] - A.L[0], ez = B.R[1] - A.L[1];
      const l = Math.hypot(ex, ez) || 1;
      const nx = ez / l, nz = -ex / l;
      curbEdges.push({
        p1: A.L,
        p2: B.R,
        out1: A.L_out,
        out2: B.R_out
      });
    }
  }

  // Triangulate mặt đường ngã tư bằng Earcut (ShapeUtils.triangulateShape)
  const P_Y = 0.002;
  const vec2s = perimeter.map(([x, z]) => new THREE.Vector2(x, z));
  const tris = THREE.ShapeUtils.triangulateShape(vec2s, []);

  for (const [i0, i1, i2] of tris) {
    const p0 = perimeter[i0];
    const p1 = perimeter[i1];
    const p2 = perimeter[i2];
    asphaltQuads.push({
      a: [p0[0], P_Y, p0[1]],
      b: [p1[0], P_Y, p1[1]],
      c: [p2[0], P_Y, p2[1]],
      d: [p2[0], P_Y, p2[1]]
    });
  }

  // Dựng vỉa hè và bó vỉa từ các curbEdges
  for (const edge of curbEdges) {
    const { p1, p2, out1, out2 } = edge;

    // Mặt trên phẳng của vỉa hè
    sidewalkQuads.push({
      a: [p1[0], SIDEWALK_H, p1[1]],
      b: [p2[0], SIDEWALK_H, p2[1]],
      c: [out2[0], SIDEWALK_H, out2[1]],
      d: [out1[0], SIDEWALK_H, out1[1]]
    });

    // Mặt curb đứng
    curbQuads.push({
      a: [p1[0], 0, p1[1]],
      b: [p1[0], SIDEWALK_H, p1[1]],
      c: [p2[0], SIDEWALK_H, p2[1]],
      d: [p2[0], 0, p2[1]]
    });
  }

  const poly: Array<[number, number]> = perimeter.map(([x, z]) => [x - nodeX, z - nodeZ]);
  return { asphaltQuads, sidewalkQuads, curbQuads, poly };
}

export function junctionPatchQuads(
  nodeX: number,
  nodeZ: number,
  connectedRoads: Array<{ road: MapRoad; dirX: number; dirZ: number }>
): { quads: Quad[]; poly: Array<[number, number]> } {
  if (connectedRoads.length < 2) return { quads: [], poly: [] };
  const PATCH_Y = 0.005;

  const arms = connectedRoads.map(({ road, dirX, dirZ }) => ({
    d: [dirX, dirZ] as [number, number],
    n: [-dirZ, dirX] as [number, number],
    K: roadHalfWidth(road) + 0.75
  }));

  const corners: Array<[number, number]> = [];
  for (let i = 0; i < arms.length; i++) {
    const A = arms[i];
    let posN = true;
    let negN = true;
    for (let j = 0; j < arms.length; j++) {
      if (i === j) continue;
      const B = arms[j];
      const dot = A.d[0] * B.d[0] + A.d[1] * B.d[1];
      if (dot > 0.82) {
        const cross = B.d[0] * A.n[0] + B.d[1] * A.n[1];
        if (cross > 0) posN = false;
        else negN = false;
      }
    }
    if (posN) corners.push([A.d[0] * A.K + A.n[0] * A.K, A.d[1] * A.K + A.n[1] * A.K]);
    else corners.push([A.d[0] * A.K, A.d[1] * A.K]);
    if (negN) corners.push([A.d[0] * A.K - A.n[0] * A.K, A.d[1] * A.K - A.n[1] * A.K]);
    else corners.push([A.d[0] * A.K, A.d[1] * A.K]);
  }
  corners.push([0, 0]);
  const hull = convexHull2D(corners);
  if (hull.length < 3) return { quads: [], poly: [] };

  const quads: Quad[] = [];
  for (let k = 0; k < hull.length; k++) {
    const pA = hull[k];
    const pB = hull[(k + 1) % hull.length];
    quads.push({
      a: [nodeX, PATCH_Y, nodeZ],
      b: [nodeX + pB[0], PATCH_Y, nodeZ + pB[1]],
      c: [nodeX + pA[0], PATCH_Y, nodeZ + pA[1]],
      d: [nodeX, PATCH_Y, nodeZ]
    });
  }
  return { quads, poly: hull };
}

/**
 * Bao lồi 2D (monotone chain) trên mặt phẳng (x, z).
 * Trả về CCW theo x·z (cross = x1·z2 − z1·x2 > 0 khi đi vòng hỗ).
 */
export function convexHull2D(points: Array<[number, number]>): Array<[number, number]> {
  if (points.length <= 2) return points.slice();
  const p = points.slice().sort((q, r) => (q[0] === r[0] ? q[1] - r[1] : q[0] - r[0]));
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Array<[number, number]> = [];
  for (const v of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], v) <= 0) {
      lower.pop();
    }
    lower.push(v);
  }
  const upper: Array<[number, number]> = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const v = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], v) <= 0) {
      upper.pop();
    }
    upper.push(v);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  const crossSum = hull.reduce((acc, q, i) => {
    const r = hull[(i + 1) % hull.length];
    return acc + q[0] * r[1] - q[1] * r[0];
  }, 0);
  if (crossSum < 0) hull.reverse();
  return hull;
}

/** Đảo giao thông (island) tại nút vòng xuyến: disk đầy màu asphalt_worn khác,
 *  bán kính = junctionHalfExtent + 2, để lane ring đi xung quanh ngoài. */
export function roundaboutIslandQuads(
  nodeX: number,
  nodeZ: number,
  map: GameMap,
  nodeId: string,
  radiusAdd = 2
): Quad[] {
  const ix = map.intersections.find((i) => i.nodeId === nodeId);
  if (!ix || ix.rule !== 'roundabout') return [];
  const half = junctionHalfExtent(map, nodeId);
  const r = half + radiusAdd;
  const PATCH_Y = 0.005;
  const segs = 24;
  const quads: Quad[] = [];
  for (let k = 0; k < segs; k++) {
    const a0 = (k / segs) * Math.PI * 2;
    const a1 = ((k + 1) / segs) * Math.PI * 2;
    quads.push({
      a: [nodeX + Math.cos(a0) * r, PATCH_Y, nodeZ + Math.sin(a0) * r],
      b: [nodeX + Math.cos(a1) * r, PATCH_Y, nodeZ + Math.sin(a1) * r],
      c: [nodeX, PATCH_Y, nodeZ],
      d: [nodeX, PATCH_Y, nodeZ]
    });
  }
  return quads;
}

/** Tất cả roads kết nối tại 1 node + hướng dir XÁC ĐỊNH TỪ node ra ngoài */
export function roadsAtNode(map: GameMap, nodeId: string): Array<{ road: MapRoad; dirX: number; dirZ: number }> {
  const out: Array<{ road: MapRoad; dirX: number; dirZ: number }> = [];
  for (const road of map.roads) {
    const pts = road.points;
    if (road.from === nodeId) {
      const dx = pts[1][0] - pts[0][0];
      const dz = pts[1][1] - pts[0][1];
      const l = Math.hypot(dx, dz) || 1;
      out.push({ road, dirX: dx / l, dirZ: dz / l });
    } else if (road.to === nodeId) {
      const dx = pts[pts.length - 2][0] - pts[pts.length - 1][0];
      const dz = pts[pts.length - 2][1] - pts[pts.length - 1][1];
      const l = Math.hypot(dx, dz) || 1;
      out.push({ road, dirX: dx / l, dirZ: dz / l });
    }
  }
  return out;
}

/** Max half-width các road tại node — dùng giới hạn vạch/zebra */
export function junctionHalfExtent(map: GameMap, nodeId: string): number {
  let max = 0;
  for (const { road } of roadsAtNode(map, nodeId)) {
    max = Math.max(max, roadHalfWidth(road));
  }
  return max;
}

/** Skip zones cho 1 road: vùng junction ở 2 đầu.
 *  extent = roadHalfWidth(road) + 0.75: ribbon kết thúc đúng tại miệng patch
 *  của chính road đó (patch miệng K = half + 0.75, patch ở y=0.005 đè nhẹ lên
 *  ribbon y=0) → không khe, không xương cá, không z-fight.
 *  Với vòng xuyến (Kreisverkehr): extent lớn hơn (junctionHalfExtent + 4) để
 *  để trống lane ring + island. */
export function junctionCutExtent(road: MapRoad, end: 'from' | 'to', map: GameMap): number {
  const nodeId = road[end];
  const node = map.nodes.find((n) => n.id === nodeId);
  if (!node || node.type !== 'intersection') return 0;
  const ix = map.intersections.find((i) => i.nodeId === nodeId);
  if (ix?.rule === 'roundabout') return junctionHalfExtent(map, nodeId) + 4;
  const connected = roadsAtNode(map, nodeId);
  if (connected.length < 2) return 0;
  const half = roadHalfWidth(road);
  const maxW = Math.max(...connected.map(c => roadHalfWidth(c.road)));
  const isMultiArm = connected.length >= 3;
  let d = isMultiArm ? Math.max(5.5, maxW * 1.5) : half + 0.75;

  // Kiểm tra nếu nhánh này nằm trong cặp góc nhọn (< 36 độ) -> mở rộng d tới điểm gore
  const pts = road.points;
  const myDirX = end === 'from' ? (pts[1][0] - pts[0][0]) : (pts[pts.length - 2][0] - pts[pts.length - 1][0]);
  const myDirZ = end === 'from' ? (pts[1][1] - pts[0][1]) : (pts[pts.length - 2][1] - pts[pts.length - 1][1]);
  const myLen = Math.hypot(myDirX, myDirZ) || 1;
  const ndx = myDirX / myLen, ndz = myDirZ / myLen;

  for (const other of connected) {
    if (other.road.id === road.id) continue;
    const dot = ndx * other.dirX + ndz * other.dirZ;
    if (dot > 0.5) { // góc < ~60 độ
      const otherHalf = roadHalfWidth(other.road);
      const ang = Math.acos(Math.max(-1, Math.min(1, dot)));
      const sinHalf = Math.sin(ang / 2);
      const goreD = (half + otherHalf + 0.2) / (2 * Math.max(0.08, sinHalf));
      d = Math.max(d, goreD);
    }
  }

  const len = roadLength(road);
  return Math.min(d, len * 0.45);
}

export function roadSkipZones(road: MapRoad, map: GameMap): Array<[number, number]> {
  const zones: Array<[number, number]> = [];
  const len = roadLength(road);
  for (const end of ['from', 'to'] as const) {
    const extent = junctionCutExtent(road, end, map);
    if (extent > 0) {
      if (end === 'from') zones.push([0, extent]);
      else zones.push([len - extent, len]);
    }
  }
  return zones;
}

/** Nen duong (asphalt_worn) day duoi moi nut intersection, ban kinh 1.25 x K_max.
 * To mau road_worn, y = -0.005 (gan mat duong, khong tao hamm toi) de che tat ca
 * khe con sot giua cac lop phu (ribbon, patch, voi he). */
export function junctionBackgroundQuads(
  nodeX: number,
  nodeZ: number,
  connectedRoads: Array<{ road: MapRoad; dirX: number; dirZ: number }>
): Quad[] {
  if (connectedRoads.length < 2) return [];
  let kMax = 0;
  for (const { road } of connectedRoads) {
    kMax = Math.max(kMax, roadHalfWidth(road));
  }
  const r = kMax * 1.25; // 1.25 x K_max: che het khe o goc giua cac nhanh
  const PATCH_Y = -0.005; // gan mat duong (ribbon y=0), khong tao hamm toi
  const segs = 32;
  const quads: Quad[] = [];
  for (let k = 0; k < segs; k++) {
    const a0 = (k / segs) * Math.PI * 2;
    const a1 = ((k + 1) / segs) * Math.PI * 2;
    quads.push({
      a: [nodeX + Math.cos(a0) * r, PATCH_Y, nodeZ + Math.sin(a0) * r],
      b: [nodeX + Math.cos(a1) * r, PATCH_Y, nodeZ + Math.sin(a1) * r],
      c: [nodeX, PATCH_Y, nodeZ],
      d: [nodeX, PATCH_Y, nodeZ]
    });
  }
  return quads;
}
