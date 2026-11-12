// 📏 roadMarkings.ts — vạch kẻ StVO dạng decal (Protocol mục 4.2)
// Decal mesh: mặt phẳng y = 0.01 + polygonOffset — KHÔNG vẽ texture lên đường.
// Điểm nội suy dùng chung roadCurve/roadPointAt (G1-1) — khớp tuyệt đối với ribbon.
import type { GameMap, MapRoad, MapIntersection } from './mapLoader';
import { roadPointAt, roadLength } from './mapLoader';
import type { Quad } from './roadMesh';
import { junctionHalfExtent } from './roadMesh';

export const MARKING_Y = 0.01;
const DASH_ON = 3;
const DASH_OFF = 6;
const MARK_W = 0.12;
const STOP_LINE_DIST = 2;
const ZEBRA_STRIPE_W = 0.5;
const ZEBRA_LEN = 3;
const SHARK_COUNT = 4;      // số tam giác răng cưa ngang làn
const MIN_MARKING_ROAD_LEN = 25; // đường ngắn hơn → không kẻ vạch dừng/zebra (chật quá)

type Side = 1 | -1;

/** quad dọc đường từ s0→s1, tâm lệch centerOffset theo pháp tuyến, rộng 2×halfW */
function spanQuad(road: MapRoad, s0: number, s1: number, centerOffset: number, halfW: number): Quad {
  const p0 = roadPointAt(road, s0);
  const p1 = roadPointAt(road, s1);
  return {
    a: [p0.x + p0.nx * (centerOffset - halfW), MARKING_Y, p0.z + p0.nz * (centerOffset - halfW)],
    b: [p0.x + p0.nx * (centerOffset + halfW), MARKING_Y, p0.z + p0.nz * (centerOffset + halfW)],
    c: [p1.x + p1.nx * (centerOffset + halfW), MARKING_Y, p1.z + p1.nz * (centerOffset + halfW)],
    d: [p1.x + p1.nx * (centerOffset - halfW), MARKING_Y, p1.z + p1.nz * (centerOffset - halfW)]
  };
}

function inZones(s: number, zones: Array<[number, number]>): boolean {
  return zones.some(([a, b]) => s >= a && s <= b);
}

function distSeg(px: number, pz: number, a: [number, number], b: [number, number]): number {
  const vx = b[0] - a[0], vz = b[1] - a[1];
  const vv = vx * vx + vz * vz;
  const t = vv < 1e-12 ? 0 : Math.max(0, Math.min(1, ((px - a[0]) * vx + (pz - a[1]) * vz) / vv));
  return Math.hypot(px - (a[0] + t * vx), pz - (a[1] + t * vz));
}

function distToRoad(px: number, pz: number, road: MapRoad): number {
  let minD = Infinity;
  for (let i = 0; i < road.points.length - 1; i++) {
    const d = distSeg(px, pz, road.points[i], road.points[i + 1]);
    if (d < minD) minD = d;
  }
  return minD;
}

export interface AcuteSibling {
  other: MapRoad;
  facingSide: -1 | 1;
}

export function findAcuteSiblings(road: MapRoad, map: GameMap): AcuteSibling[] {
  const siblings: AcuteSibling[] = [];
  for (const other of map.roads) {
    if (other.id === road.id) continue;
    for (const end1 of ['from', 'to'] as const) {
      for (const end2 of ['from', 'to'] as const) {
        if (road[end1] === other[end2]) {
          const p1A = end1 === 'from' ? road.points[0] : road.points[road.points.length - 1];
          const p1B = end1 === 'from' ? road.points[1] : road.points[road.points.length - 2];
          const p2A = end2 === 'from' ? other.points[0] : other.points[other.points.length - 1];
          const p2B = end2 === 'from' ? other.points[1] : other.points[other.points.length - 2];
          const d1x = p1B[0] - p1A[0], d1z = p1B[1] - p1A[1];
          const d2x = p2B[0] - p2A[0], d2z = p2B[1] - p2A[1];
          const l1 = Math.hypot(d1x, d1z) || 1, l2 = Math.hypot(d2x, d2z) || 1;
          const dot = (d1x * d2x + d1z * d2z) / (l1 * l2);
          if (dot > 0.5) { // góc < ~60°
            const cross = (d2x * (-d1z) + d2z * d1x) / (l1 * l2);
            const facingSide: -1 | 1 = end1 === 'from' ? (cross > 0 ? 1 : -1) : (cross > 0 ? -1 : 1);
            siblings.push({ other, facingSide });
          }
        }
      }
    }
  }
  return siblings;
}

/** Vạch đứt giữa: đoạn 3 m cách 6 m — né skip zones + đứng trước vạch dừng + cull khi lấn vào lòng đường liền kề */
function centerDashes(road: MapRoad, skip: Array<[number, number]>, stopZones: Array<[number, number]>, siblings: AcuteSibling[] = []): Quad[] {
  const out: Quad[] = [];
  const len = roadLength(road);
  const all = [...skip, ...stopZones];
  let s = 2;
  while (s + DASH_ON < len) {
    if (!inZones(s, all) && !inZones(s + DASH_ON, all)) {
      const midS = s + DASH_ON / 2;
      const pMid = roadPointAt(road, midS);
      let culled = false;
      for (const sib of siblings) {
        const oHalf = (sib.other.lanesForward + sib.other.lanesBackward) * sib.other.laneWidth / 2;
        if (distToRoad(pMid.x, pMid.z, sib.other) < oHalf + 0.1) {
          culled = true;
          break;
        }
      }
      if (!culled) {
        out.push(spanQuad(road, s, s + DASH_ON, 0, MARK_W / 2));
      }
    }
    s += DASH_ON + DASH_OFF;
  }
  return out;
}

/** Vạch mép liền (Z. 295) 2 bên — offset ±(half−0.2), cắt tại vùng junction và chống xoắn chữ X tại chỗ chụm làn */
function edgeLines(road: MapRoad, half: number, skip: Array<[number, number]>, siblings: AcuteSibling[] = []): Quad[] {
  const out: Quad[] = [];
  const len = roadLength(road);
  const step = 2;
  const off = half - 0.2;
  const segs: Array<[number, number]> = [];
  let cur = 0;
  for (const [a, b] of skip) {
    if (b <= 0 || a >= len) continue;
    if (a > cur) segs.push([cur, Math.min(a, len)]);
    cur = Math.max(cur, b);
  }
  if (cur < len) segs.push([cur, len]);
  for (const side of [-1, 1] as const) {
    for (const [a, b] of segs) {
      for (let s = a; s < b; s += step) {
        const sNext = Math.min(s + step, b);
        const midS = (s + sNext) / 2;
        const pMid = roadPointAt(road, midS);
        const midX = pMid.x + pMid.nx * side * off;
        const midZ = pMid.z + pMid.nz * side * off;

        // Chống chữ X: nếu điểm vạch mép lọt vào lòng đường đối diện của nhánh nhọn kẹp sát → cull
        let culled = false;
        for (const sib of siblings) {
          if (sib.facingSide === side) {
            const oHalf = (sib.other.lanesForward + sib.other.lanesBackward) * sib.other.laneWidth / 2;
            const d = distToRoad(midX, midZ, sib.other);
            if (d < oHalf + 0.2) {
              culled = true;
              break;
            }
          }
        }
        if (!culled) {
          out.push(spanQuad(road, s, sNext, side * off, MARK_W / 2));
        }
      }
    }
  }
  return out;
}

/** Vạch dừng Haltlinie (Z. 294): cách mép ngã tư 2 m, CHỈ nửa phải của LUỒNG TỚI.
 *  side = +1: approach ở đầu to (nửa +n) — side = −1: approach ở đầu from (nửa −n, G1-4). */
function stopLine(road: MapRoad, half: number, stopS: number, side: Side): Quad {
  const w0 = 0.1;
  const w1 = half - 0.15;
  const center = side * (w0 + w1) / 2;
  const halfW = (w1 - w0) / 2;
  // dày 0.4 m dọc đường, hướng về junction
  const s0 = side > 0 ? stopS : stopS - 0.4;
  return spanQuad(road, s0, s0 + 0.4, center, halfW);
}

/** Răng cưa nhường đường (Vorfahrt gewähren): HÀNG tam giác NGANG LÀN (G1-4),
 *  mũi hướng VỀ junction, xếp từ 0.3 m tới half−0.3 trên nửa làn approach. */
function sharkTeeth(road: MapRoad, half: number, stopS: number, side: Side): Quad[] {
  const out: Quad[] = [];
  const tipForward = side > 0; // approach đầu to: junction phía s tăng
  for (let k = 0; k < SHARK_COUNT; k++) {
    const off = side * (0.45 + k * 0.62);
    if (Math.abs(off) > half - 0.3) break;
    const baseS = tipForward ? stopS - 1.1 : stopS + 1.1;
    const tipS = tipForward ? stopS - 0.1 : stopS + 0.1;
    const pa = roadPointAt(road, baseS);
    const pb = roadPointAt(road, tipS);
    const bx = pa.x + pa.nx * off;
    const bz = pa.z + pa.nz * off;
    const tx = pb.x + pb.nx * off;
    const tz = pb.z + pb.nz * off;
    out.push({
      a: [bx - pa.nx * 0.26, MARKING_Y, bz - pa.nz * 0.26],
      b: [bx + pa.nx * 0.26, MARKING_Y, bz + pa.nz * 0.26],
      c: [tx, MARKING_Y, tz],
      d: [tx, MARKING_Y, tz]
    });
  }
  return out;
}

/** Zebrastreifen (Z. 293): sọc 0.5 m cách 0.5 m, ĐỐI XỨNG 2 mép (G1-6), dài 3 m */
function zebraCrossing(road: MapRoad, half: number, centerS: number): Quad[] {
  const out: Quad[] = [];
  const usable = half * 2;
  const period = ZEBRA_STRIPE_W * 2;
  const nStripes = Math.max(1, Math.floor(usable / period));
  const gap = (usable - nStripes * ZEBRA_STRIPE_W) / (nStripes - 1 || 1);
  const margin = (usable - (nStripes * ZEBRA_STRIPE_W + (nStripes - 1) * gap)) / 2;
  const pA = roadPointAt(road, centerS - ZEBRA_LEN / 2);
  const pB = roadPointAt(road, centerS + ZEBRA_LEN / 2);
  for (let k = 0; k < nStripes; k++) {
    const center = -half + margin + ZEBRA_STRIPE_W / 2 + k * (ZEBRA_STRIPE_W + gap);
    const o0 = center - ZEBRA_STRIPE_W / 2;
    const o1 = center + ZEBRA_STRIPE_W / 2;
    out.push({
      a: [pA.x + pA.nx * o0, MARKING_Y, pA.z + pA.nz * o0],
      b: [pA.x + pA.nx * o1, MARKING_Y, pA.z + pA.nz * o1],
      c: [pB.x + pB.nx * o1, MARKING_Y, pB.z + pB.nz * o1],
      d: [pB.x + pB.nx * o0, MARKING_Y, pB.z + pB.nz * o0]
    });
  }
  return out;
}

interface Approach {
  stopS: number;
  side: Side;
  kind: 'light' | 'stop' | 'yield' | 'right_before_left';
}

export interface RoadMarkingResult {
  quads: Quad[];
}

/** Vạch vòng lane ring + viền đảo giữa tại nút Kreisverkehr (roundabout). */
function roundaboutLaneRingQuads(
  _road: MapRoad,
  map: GameMap,
  nodeId: string,
  _half: number
): Quad[] {
  const ix = map.intersections.find((i) => i.nodeId === nodeId);
  if (!ix || ix.rule !== 'roundabout') return [];
  const node = map.nodes.find((n) => n.id === nodeId);
  if (!node) return [];

  const baseExtent = junctionHalfExtent(map, nodeId);
  const rIsland = Math.max(2.6, baseExtent * 0.52);
  const rOuter = baseExtent + 1.4;
  const quads: Quad[] = [];
  const RING_Y = 0.015;

  // 1) Viền liền trắng rõ nét bao quanh đảo giữa (Kreisverkehrsinsel)
  const islandSegs = 32;
  const islandW = 0.2;
  for (let k = 0; k < islandSegs; k++) {
    const a0 = (k / islandSegs) * Math.PI * 2;
    const a1 = ((k + 1) / islandSegs) * Math.PI * 2;
    const nx0 = Math.cos(a0), nz0 = Math.sin(a0);
    const nx1 = Math.cos(a1), nz1 = Math.sin(a1);
    const x0 = node.x + rIsland * nx0, z0 = node.z + rIsland * nz0;
    const x1 = node.x + rIsland * nx1, z1 = node.z + rIsland * nz1;
    quads.push({
      a: [x0 - nx0 * (islandW / 2), RING_Y, z0 - nz0 * (islandW / 2)],
      b: [x0 + nx0 * (islandW / 2), RING_Y, z0 + nz0 * (islandW / 2)],
      c: [x1 + nx1 * (islandW / 2), RING_Y, z1 + nz1 * (islandW / 2)],
      d: [x1 - nx1 * (islandW / 2), RING_Y, z1 - nz1 * (islandW / 2)],
    });
  }

  // 2) Vạch đứt dẫn hướng làn vòng xuyến (24 đoạn đứt rõ nét)
  const dashCount = 24;
  const dashW = 0.16;
  for (let k = 0; k < dashCount; k++) {
    const a0 = (k / dashCount) * Math.PI * 2;
    const a1 = ((k + 0.62) / dashCount) * Math.PI * 2;
    const nx0 = Math.cos(a0), nz0 = Math.sin(a0);
    const nx1 = Math.cos(a1), nz1 = Math.sin(a1);
    const x0 = node.x + rOuter * nx0, z0 = node.z + rOuter * nz0;
    const x1 = node.x + rOuter * nx1, z1 = node.z + rOuter * nz1;
    quads.push({
      a: [x0 - nx0 * (dashW / 2), RING_Y, z0 - nz0 * (dashW / 2)],
      b: [x0 + nx0 * (dashW / 2), RING_Y, z0 + nz0 * (dashW / 2)],
      c: [x1 + nx1 * (dashW / 2), RING_Y, z1 + nz1 * (dashW / 2)],
      d: [x1 - nx1 * (dashW / 2), RING_Y, z1 - nz1 * (dashW / 2)],
    });
  }
  return quads;
}

/** Tất cả vạch của 1 road — approach CẢ HAI ĐẦU (G1-4):
 *  luồng tới ở đầu to (side +1) và luồng ngược tới ở đầu from (side −1). */
export function roadMarkingQuads(map: GameMap, road: MapRoad, skip: Array<[number, number]>, half: number): Quad[] {
  const quads: Quad[] = [];
  const len = roadLength(road);
  const approaches: Approach[] = [];
  let zebraCenter: number | null = null;
  // đường ngắn < 25 m: không đủ chỗ dừng + vạch dừng/zebra sẽ chồng nhau → bỏ
  const longEnough = len >= MIN_MARKING_ROAD_LEN;

  for (const ix of map.intersections as MapIntersection[]) {
    if (road.from !== ix.nodeId && road.to !== ix.nodeId) continue;
    let kind: Approach['kind'] | null =
      ix.trafficLight ? 'light' : ix.rule === 'stop' ? 'stop' : ix.rule === 'yield' ? 'yield' : ix.rule === 'roundabout' ? 'yield' : ix.rule === 'right_before_left' ? 'right_before_left' : null;
    // priority_road: nhánh KHÔNG main → Vorfahrt gewähren (shark teeth, khớp Z.205)
    if (!kind && ix.rule === 'priority_road' && road.priority !== 'main') kind = 'yield';
    if (kind && longEnough) {
      if (road.to === ix.nodeId) {
        approaches.push({ stopS: len - half - STOP_LINE_DIST, side: 1, kind });
      } else if (road.from === ix.nodeId && road.lanesBackward > 0) {
        approaches.push({ stopS: half + STOP_LINE_DIST, side: -1, kind });
      }
    }
    if (ix.crosswalks.includes(road.id) && longEnough) {
      // CHỈ vẽ zebra cho hướng ĐẦU TO — tránh zebra trùng lặp.
      zebraCenter = len - half - ZEBRA_LEN / 2 - 1;
    }
  }

  // vùng né vạch đứt: quanh mỗi vạch dừng (dừng đứt TRƯỚC Haltlinie)
  const stopZones: Array<[number, number]> = approaches.map(a => [a.stopS - 1.2, a.stopS + 1.2] as [number, number]);

  const siblings = findAcuteSiblings(road, map);
  quads.push(...edgeLines(road, half, skip, siblings));
  // vạch giữa đứt CHỈ khi đường 2 chiều (lanesBackward > 0)
  if (road.lanesBackward > 0) {
    quads.push(...centerDashes(road, skip, stopZones, siblings));
  }
  for (const a of approaches) {
    if (a.kind === 'yield' || a.kind === 'right_before_left') quads.push(...sharkTeeth(road, half, a.stopS, a.side));
    else quads.push(stopLine(road, half, a.stopS, a.side));
  }
  if (zebraCenter !== null) quads.push(...zebraCrossing(road, half, zebraCenter));

  // ── lane ring vòng quanh island tại nút Kreisverkehr ──
  for (const ix of map.intersections as MapIntersection[]) {
    if (road.from !== ix.nodeId && road.to !== ix.nodeId) continue;
    if (ix.rule !== 'roundabout') continue;
    quads.push(...roundaboutLaneRingQuads(road, map, ix.nodeId, half));
  }

  return quads;
}
