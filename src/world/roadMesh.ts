// 🛣️ roadMesh.ts — mặt đường + đa giác ngã tư (Protocol mục 4.1)
// Đầu vào: GameMap; đầu ra: quad dữ liệu đưa vào ChunkBuilder (mục 7).
// Quy ước trục (mục 1): y=0 mặt đường, 1 unit = 1 m.
// Điểm nội suy dùng chung từ mapLoader.roadCurve (getPointAt đều theo cung) —
// ribbon/markings/sidewalk dùng CÙNG điểm + chiều dài → không trôi trên đường cong.
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
export function junctionPatchQuads(
  nodeX: number,
  nodeZ: number,
  connectedRoads: Array<{ road: MapRoad; dirX: number; dirZ: number }>
): { quads: Quad[]; poly: Array<[number, number]> } {
  if (connectedRoads.length < 2) return { quads: [], poly: [] };
  const PATCH_Y = 0.005;

  // arm: d = hướng ra ngoài node, n = PHẢI flowout (−dz, dx), K = half-width + 0.75
  const arms = connectedRoads.map(({ road, dirX, dirZ }) => ({
    d: [dirX, dirZ] as [number, number],
    n: [-dirZ, dirX] as [number, number],
    K: roadHalfWidth(road) + 0.75
  }));

  // 2 góc PHÍA TRƯỚC của mỗi miệng nhánh (toạ độ cục bộ so với node) → bao lồi.
  // Không thêm góc sau d·(−K) ± n·K — vùng −d thuộc ribbon của chính road đó.
  const corners: Array<[number, number]> = [];
  for (const A of arms) {
    corners.push([A.d[0] * A.K + A.n[0] * A.K, A.d[1] * A.K + A.n[1] * A.K]);
    corners.push([A.d[0] * A.K - A.n[0] * A.K, A.d[1] * A.K - A.n[1] * A.K]);
  }
  corners.push([0, 0]);
  const hull = convexHull2D(corners); // CCW theo x·z
  if (hull.length < 3) return { quads: [], poly: [] };

  // fan quanh node — winding đảo b↔c để normal hướng LÊN (hull CCW theo x·z)
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
  // poly trả về toạ độ cục bộ (so với node) cho test
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
export function roadSkipZones(road: MapRoad, map: GameMap): Array<[number, number]> {
  const zones: Array<[number, number]> = [];
  const len = roadLength(road);
  const half = roadHalfWidth(road);
  for (const end of ['from', 'to'] as const) {
    const nodeId = road[end];
    const node = map.nodes.find((n) => n.id === nodeId);
    if (!node || node.type !== 'intersection') continue;
    const ix = map.intersections.find((i) => i.nodeId === nodeId);
    const isRoundabout = ix?.rule === 'roundabout';
    const extent = isRoundabout ? junctionHalfExtent(map, nodeId) + 4 : half + 0.75;
    if (end === 'from') zones.push([0, extent]);
    else zones.push([len - extent, len]);
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
