// 🛣️ roadMesh.ts — mặt đường + đa giác ngã tư (Protocol mục 4.1)
// Đầu vào: GameMap; đầu ra: quad dữ liệu đưa vào ChunkBuilder (mục 7).
// Quy ước trục (mục 1): y=0 mặt đường, 1 unit = 1 m.
import * as THREE from 'three';
import type { GameMap, MapRoad, MapIntersection } from './mapLoader';
import { roadFullWidth } from './mapLoader';

export interface Quad {
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
  d: [number, number, number];
}

/** Resample polyline mỗi `step` mét (Catmull-Rom mượt qua điểm góc) */
export function resamplePoints(points: [number, number][], step = 2): [number, number][] {
  const v3 = points.map(([x, z]) => new THREE.Vector3(x, 0, z));
  
  const curve = new THREE.CatmullRomCurve3(v3, false, 'catmullrom', 0.5);
  const len = curve.getLength();
  const n = Math.max(2, Math.ceil(len / step));
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const p = curve.getPoint(i / n);
    out.push([p.x, p.z]);
  }
  return out;
}


/** half-width của road (một nửa tổng chiều rộng) */
export function roadHalfWidth(road: MapRoad): number {
  return roadFullWidth(road) / 2;
}

/** Độ dài polyline */
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
 * Dải mặt đường cho 1 road — trả về danh sách quad (2 tam giác/quad) đúng chiều rộng.
 * `skipZones`: khoảng cách s cần bỏ (junction/zebra overlap), dạng [start,end][].
 */
export function roadRibbonQuads(
  road: MapRoad,
  skipZones: Array<[number, number]> = [],
  sampleStep = 2
): Quad[] {
  const half = roadHalfWidth(road);
  const pts = resamplePoints(road.points, sampleStep);
  const quads: Quad[] = [];
  const inSkip = (s: number) => skipZones.some(([a, b]) => s >= a && s <= b);
  let prev: { x: number; z: number; nx: number; nz: number } | null = null;
  let prevS = 0;
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const cur = pointWithNormalAtS(pts, s);
    if (prev && !inSkip(prevS) && !inSkip(s)) {
      quads.push({
        a: [prev.x - prev.nx * half, 0, prev.z - prev.nz * half],
        b: [prev.x + prev.nx * half, 0, prev.z + prev.nz * half],
        c: [cur.x + cur.nx * half, 0, cur.z + cur.nz * half],
        d: [cur.x - cur.nx * half, 0, cur.z - cur.nz * half]
      });
    }
    prev = cur;
    prevS = s;
  }
  void roadRibbonQuads; // giữ hàm tự tham chiếu cho doc
  return quads;
}

/**
 * Đa giác ngã tư tại node: đỉnh = giao điểm các offset line của roads tới,
 * bo góc bán kính 6 m (Protocol mục 4.1).
 */
export function junctionPatchQuads(
  nodeX: number,
  nodeZ: number,
  connectedRoads: Array<{ road: MapRoad; dirX: number; dirZ: number }>,
  cornerRadius = 6,
  arcSegments = 4
): Quad[] {
  // offset line mỗi road: đi qua điểm node + dir*half, hướng dir, lệch pháp tuyến half
  type Line = { px: number; pz: number; dx: number; dz: number };
  const lines: Line[] = connectedRoads.map(({ road, dirX, dirZ }) => {
    const half = roadHalfWidth(road);
    return {
      px: nodeX + dirX * half,
      pz: nodeZ + dirZ * half,
      dx: dirX,
      dz: dirZ
    };
  });
  if (lines.length < 2) return [];

  // sắp theo góc để biết cặp liền kề
  const angled = lines
    .map((l, i) => ({ l, ang: Math.atan2(l.dz, l.dx), i }))
    .sort((a, b) => a.ang - b.ang);

  // giao điểm offset line cặp liền kề → đỉnh đa giác
  const corners: [number, number][] = [];
  const n = angled.length;
  for (let k = 0; k < n; k++) {
    const L1 = angled[k].l;
    const L2 = angled[(k + 1) % n].l;
    const den = L1.dx * L2.dz - L1.dz * L2.dx;
    if (Math.abs(den) < 1e-6) {
      // song song (hiếm) — lấy điểm node + dir*half của L1
      corners.push([L1.px, L1.pz]);
      continue;
    }
    const t = ((L2.px - L1.px) * L2.dz - (L2.pz - L1.pz) * L2.dx) / den;
    corners.push([L1.px + L1.dx * t, L1.pz + L1.dz * t]);
  }

  // tâm đa giác (fan origin cho tam giác)
  const cx = corners.reduce((s, c) => s + c[0], 0) / corners.length;
  const cz = corners.reduce((s, c) => s + c[1], 0) / corners.length;

  // bo góc: mỗi đỉnh cắt bằng arc bán kính `cornerRadius`
  const poly: [number, number][] = [];
  for (let k = 0; k < corners.length; k++) {
    const prevC = corners[(k - 1 + corners.length) % corners.length];
    const curC = corners[k];
    const nextC = corners[(k + 1) % corners.length];
    // điểm cắt arc trên 2 cạnh: lùi từ đỉnh về phía mỗi cạnh 6m
    const cutFrom = (from: [number, number], to: [number, number], dist: number): [number, number] => {
      const dx = to[0] - from[0];
      const dz = to[1] - from[1];
      const l = Math.hypot(dx, dz) || 1;
      return [from[0] + (dx / l) * dist, from[1] + (dz / l) * dist];
    };
    const dist = Math.min(cornerRadius, Math.hypot(curC[0] - prevC[0], curC[1] - prevC[1]) * 0.45);
    const p1 = cutFrom(curC, prevC, dist);
    const p2 = cutFrom(curC, nextC, dist);
    poly.push(p1);
    // arc nội suy quanh đỉnh
    for (let a = 1; a < arcSegments; a++) {
      const t = a / arcSegments;
      const mx = p1[0] + (p2[0] - p1[0]) * t;
      const mz = p1[1] + (p2[1] - p1[1]) * t;
      // đẩy điểm ra xa tâm để arc cong ra ngoài (xấp xỉ vòng tròn)
      const dx = mx - cx;
      const dz = mz - cz;
      const l = Math.hypot(dx, dz) || 1;
      const target = l + (cornerRadius - dist) * 0.35;
      poly.push([cx + (dx / l) * target, cz + (dz / l) * target]);
    }
    poly.push(p2);
  }

  // fan quads: tâm → từng cạnh
  const quads: Quad[] = [];
  for (let k = 0; k < poly.length; k++) {
    const pA = poly[k];
    const pB = poly[(k + 1) % poly.length];
    quads.push({
      a: [cx, 0, cz],
      b: [pA[0], 0, pA[1]],
      c: [pB[0], 0, pB[1]],
      d: [cx, 0, cz]
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

export function intersectionsOf(map: GameMap): MapIntersection[] {
  return map.intersections;
}

/** Skip zones cho 1 road: vùng junction ở 2 đầu (đừng vẽ vạch trong đó) */
export function roadSkipZones(road: MapRoad, map: GameMap): Array<[number, number]> {
  const zones: Array<[number, number]> = [];
  const len = polylineLength(road.points);
  for (const end of ['from', 'to'] as const) {
    const nodeId = road[end];
    const node = map.nodes.find((n) => n.id === nodeId);
    if (!node || node.type !== 'intersection') continue;
    const extent = junctionHalfExtent(map, nodeId) + 1;
    if (end === 'from') zones.push([0, extent]);
    else zones.push([len - extent, len]);
  }
  return zones;
}
