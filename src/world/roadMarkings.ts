// 📏 roadMarkings.ts — vạch kẻ StVO dạng decal (Protocol mục 4.2)
// Decal mesh: mặt phẳng y = 0.01 + polygonOffset — KHÔNG vẽ texture lên đường.
import type { GameMap, MapRoad, MapIntersection } from './mapLoader';
import { polylineLength, pointWithNormalAtS } from './roadMesh';

export const MARKING_Y = 0.01;
const DASH_ON = 3;
const DASH_OFF = 6;
const MARK_W = 0.12;
const STOP_LINE_DIST = 2;
const ZEBRA_STRIPE_W = 0.5;
const ZEBRA_LEN = 3;

export interface Quad {
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
  d: [number, number, number];
}

/** quad nối 2 điểm trên tim đường, trải rộng ±w theo pháp tuyến */
function spanQuad(
  pts: [number, number][], s0: number, s1: number, w: number
): Quad {
  const p0 = pointWithNormalAtS(pts, s0);
  const p1 = pointWithNormalAtS(pts, s1);
  return {
    a: [p0.x - p0.nx * w, MARKING_Y, p0.z - p0.nz * w],
    b: [p0.x + p0.nx * w, MARKING_Y, p0.z + p0.nz * w],
    c: [p1.x + p1.nx * w, MARKING_Y, p1.z + p1.nz * w],
    d: [p1.x - p1.nx * w, MARKING_Y, p1.z - p1.nz * w]
  };
}

function inZones(s: number, zones: Array<[number, number]>): boolean {
  return zones.some(([a, b]) => s >= a && s <= b);
}

/** Vạch đứt giữa: đoạn 3 m cách 6 m (nội thành 0.12 m) */
export function centerDashes(road: MapRoad, skip: Array<[number, number]>, stopS: number | null): Quad[] {
  const out: Quad[] = [];
  const len = polylineLength(road.points);
  const hardEnd = stopS !== null ? stopS - 0.5 : len;
  let s = 2;
  while (s + DASH_ON < hardEnd) {
    if (!inZones(s, skip) && !inZones(s + DASH_ON, skip)) {
      out.push(spanQuad(road.points, s, s + DASH_ON, MARK_W));
    }
    s += DASH_ON + DASH_OFF;
  }
  return out;
}

/** Vạch mép liền (Z. 295) 2 bên — cắt tại vùng junction */
export function edgeLines(road: MapRoad, half: number, skip: Array<[number, number]>, stopS: number | null): Quad[] {
  const out: Quad[] = [];
  const len = polylineLength(road.points);
  const step = 2;
  const end = stopS !== null ? stopS : len;
  for (const side of [-1, 1] as const) {
    let prevS: number | null = null;
    for (let s = 0; s <= end; s += step) {
      const blocked = inZones(s, skip) || s > end;
      if (!blocked && prevS === null) prevS = s;
      else if (!blocked && prevS !== null && s + step > end) {
        out.push(spanQuad(road.points, prevS, s, halfW(road, half, side, s)));
        prevS = null;
      } else if (blocked && prevS !== null) {
        out.push(spanQuad(road.points, prevS, s, halfW(road, half, side, s)));
        prevS = null;
      }
    }
    if (prevS !== null) out.push(spanQuad(road.points, prevS, end, halfW(road, half, side, end)));
  }
  return out;
}

function halfW(road: MapRoad, half: number, side: 1 | -1, s: number): number {
  void road; void side; void s;
  return MARK_W; // vạch mép rộng 0.12, đặt tại offset half
}

/** Vạch dừng Haltlinie (Z. 294): cách mép ngã tư 2 m, full chiều tới */
export function stopLine(road: MapRoad, half: number, stopS: number): Quad {
  const p = pointWithNormalAtS(road.points, stopS);
  const w = half - 0.15;
  return {
    a: [p.x - p.nx * w, MARKING_Y, p.z - p.nz * w],
    b: [p.x + p.nx * w, MARKING_Y, p.z + p.nz * w],
    c: [p.x + p.nx * w, MARKING_Y, p.z + p.nz * w],
    d: [p.x - p.nx * w, MARKING_Y, p.z - p.nz * w]
  };
}

/** Răng cưa nhường đường (Vorfahrt gewähren): 4 tam giác hướng về junction */
export function sharkTeeth(road: MapRoad, stopS: number): Quad[] {
  const out: Quad[] = [];
  for (let i = 0; i < 4; i++) {
    const s = stopS - 1.2 + i * 0.6;
    const p = pointWithNormalAtS(road.points, s);
    const tip = pointWithNormalAtS(road.points, s + 1.0);
    out.push({
      a: [p.x - p.nx * 0.22, MARKING_Y, p.z - p.nz * 0.22],
      b: [p.x + p.nx * 0.22, MARKING_Y, p.z + p.nz * 0.22],
      c: [tip.x, MARKING_Y, tip.z],
      d: [tip.x, MARKING_Y, tip.z]
    });
  }
  return out;
}

/** Zebrastreifen (Z. 293): sọc rộng 0.5 m, cách 0.5 m, dài 3 m (bắc qua đường) */
export function zebraCrossing(road: MapRoad, half: number, centerS: number): Quad[] {
  const out: Quad[] = [];
  const pA = pointWithNormalAtS(road.points, centerS - ZEBRA_LEN / 2);
  const pB = pointWithNormalAtS(road.points, centerS + ZEBRA_LEN / 2);
  const stripes = Math.floor((half * 2) / (ZEBRA_STRIPE_W + ZEBRA_LEN / ZEBRA_LEN)) || 1;
  void stripes;
  for (let off = -half + ZEBRA_STRIPE_W; off < half; off += ZEBRA_STRIPE_W * 2) {
    out.push({
      a: [pA.x + pA.nx * (off - ZEBRA_STRIPE_W), MARKING_Y, pA.z + pA.nz * (off - ZEBRA_STRIPE_W)],
      b: [pA.x + pA.nx * (off + ZEBRA_STRIPE_W), MARKING_Y, pA.z + pA.nz * (off + ZEBRA_STRIPE_W)],
      c: [pB.x + pB.nx * (off + ZEBRA_STRIPE_W), MARKING_Y, pB.z + pB.nz * (off + ZEBRA_STRIPE_W)],
      d: [pB.x + pB.nx * (off - ZEBRA_STRIPE_W), MARKING_Y, pB.z + pB.nz * (off - ZEBRA_STRIPE_W)]
    });
  }
  return out;
}

export interface RoadMarkingResult {
  quads: Quad[];
  stopS: number | null;
}

/** Khoảng cách vạch dừng cho 1 road (null nếu giao lộ RvL không cần dừng) */
export function stopDistanceFor(map: GameMap, road: MapRoad): { stopS: number | null; kind: string } {
  for (const ix of map.intersections) {
    if (road.from !== ix.nodeId && road.to !== ix.nodeId) continue;
    if (!ix.trafficLight && ix.rule !== 'stop' && ix.rule !== 'yield') continue;
    return { stopS: null, kind: ix.trafficLight ? 'light' : ix.rule };
  }
  return { stopS: null, kind: 'none' };
}

/** Tất cả vạch của 1 road */
export function roadMarkingQuads(map: GameMap, road: MapRoad, skip: Array<[number, number]>, half: number): Quad[] {
  const quads: Quad[] = [];
  let stopS: number | null = null;
  let stopKind: 'light' | 'stop' | 'yield' | null = null;
  let zebraCenter: number | null = null;

  for (const ix of map.intersections as MapIntersection[]) {
    if (road.from !== ix.nodeId && road.to !== ix.nodeId) continue;
    void ix;
  }
  const len = polylineLength(road.points);
  const ext = map.intersections
    .filter(ix => road.from === ix.nodeId || road.to === ix.nodeId)
    .map(() => half); // junctionHalfExtent đã tính ngoài — dùng half max truyền vào

  void ext;
  for (const ix of map.intersections) {
    if (road.from !== ix.nodeId && road.to !== ix.nodeId) continue;
    const atEnd = road.to === ix.nodeId;
    const stopAt = atEnd ? len - half - STOP_LINE_DIST : half + STOP_LINE_DIST;
    if (ix.trafficLight) { stopKind = 'light'; stopS = stopAt; }
    else if (ix.rule === 'stop') { stopKind = 'stop'; stopS = stopAt; }
    else if (ix.rule === 'yield') { stopKind = 'yield'; stopS = stopAt; }
    if (ix.crosswalks.includes(road.id)) {
      zebraCenter = atEnd ? len - half - ZEBRA_LEN / 2 - 1 : half + ZEBRA_LEN / 2 + 1;
    }
  }

  quads.push(...centerDashes(road, skip, stopS));
  quads.push(...edgeLines(road, half, skip, stopS));
  if (stopS !== null && stopKind && stopKind !== 'yield') quads.push(stopLine(road, half, stopS));
  if (stopS !== null && stopKind === 'yield') quads.push(...sharkTeeth(road, stopS));
  if (zebraCenter !== null) quads.push(...zebraCrossing(road, half, zebraCenter));
  return quads;
}
