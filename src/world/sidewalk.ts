// 🧱 sidewalk.ts — vỉa hè + bó vỉa (Protocol mục 4.3)
// Mỗi đoạn 4 m: mặt trên PHẲNG tại y=h + mặt curb đứng (0 → h) phía trong.
// Chỗ zebra: hạ mặt (ramp) dài 1.5 m xuống 0.03 m để qua đường cho người đi bộ.
// Pad góc giao lộ: ô vuông SW×SW nối vỉa hè 2 nhánh quanh góc (cùng màu/y → không z-fight nhìn thấy).
import type { GameMap, MapRoad } from './mapLoader';
import { roadCurve, roadLength, roadPointAt } from './mapLoader';
import type { Quad } from './roadMesh';
import { roadHalfWidth, roadSkipZones, roadsAtNode, junctionHalfExtent } from './roadMesh';

export interface SidewalkPiece {
  /** 4 đỉnh mặt trên (thứ tự: inner0 → outer0 → outer1 → inner1), y = height */
  top: [number, number, number][];
  /** 4 đỉnh mặt curb đứng (inner0@0 → inner0@h → inner1@h → inner1@0) — null nếu ramp */
  curb: [number, number, number][] | null;
  height: number;
}

const SIDEWALK_W = 2.5;
const SIDEWALK_H = 0.15;
const RAMP_H = 0.03;
const RAMP_LEN = 1.5;

/**
 * Vỉa hè mỗi bên: dải rộng 2.5 m dọc mép đường, mặt phẳng cao 0.15 m.
 * Ramp tại zebra: hạ còn 0.03 m (không có curb).
 */

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

interface AcuteSibling {
  other: MapRoad;
  facingSide: -1 | 1;
}

function findAcuteSiblings(road: MapRoad, map: GameMap): AcuteSibling[] {
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
          if (dot > 0.65) { // góc < ~49° (đường song song hoặc nhánh chụm)
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

export function sidewalkBoxes(road: MapRoad, map: GameMap): SidewalkPiece[] {
  const half = roadHalfWidth(road);
  // Dùng curve length (Catmull-Rom) — CÙNG lưới s với ribbon. polylineLength gốc
  // lệch trên đường cong → mép trong vỉa hè không ôm khít mép ribbon (răng cưa).
  const len = roadLength(road);
  const skip = roadSkipZones(road, map);
  const pieces: SidewalkPiece[] = [];

  // tìm zebra centers (từ intersection crosswalks)
  const zebraCenters: number[] = [];
  for (const ix of map.intersections) {
    if (!ix.crosswalks.includes(road.id)) continue;
    const atEnd = road.to === ix.nodeId;
    zebraCenters.push(atEnd ? len - half - 2.5 : half + 2.5);
  }

    const siblings = findAcuteSiblings(road, map);
    // Bước 2 m (trước 4 m): chord 4 m trên road cong ăn sâu vào mép ribbon tới
    // 6.7 cm (R=30) — vượt SAW_TOL 5 cm gây "răng cưa". 2 m → sag ≤ 1.7 cm.
    const step = 2;
  for (const side of [-1, 1] as const) {
    if (side === -1 && road.sidewalk?.left === false) continue;
    if (side === 1 && road.sidewalk?.right === false) continue;

    const startS = skip.length && skip[0][0] === 0 ? skip[0][1] : 0;
    const endS = skip.length && skip[skip.length - 1][1] === len ? skip[skip.length - 1][0] : len;

    // Thu thập các mốc s quan trọng: biên zebra và dốc hạ vỉa StVO
    const sampleSet = new Set<number>([startS, endS]);
    for (const zc of zebraCenters) {
      for (const off of [-2.5, -1.5, 1.5, 2.5]) {
        const pt = zc + off;
        if (pt > startS && pt < endS) sampleSet.add(pt);
      }
    }
    // Chèn ĐỈNH ribbon vào lưới piece — piece không được vắt qua góc ribbon
    // (chord cắt góc → sag giữa piece). innerAt phía dưới dùng lại dãy này.
    const ribStep = roadCurve(road).step;
    const ribbonS: number[] = [];
    {
      const vis: Array<[number, number]> = [];
      let cur = 0;
      for (const [a2, b2] of skip) {
        if (b2 <= 0 || a2 >= len) continue;
        if (a2 > cur) vis.push([cur, Math.min(a2, len)]);
        cur = Math.max(cur, b2);
      }
      if (cur < len) vis.push([cur, len]);
      for (const [va, vb] of vis) {
        ribbonS.push(va);
        for (let s2 = Math.ceil(va / ribStep) * ribStep; s2 < vb - 1e-6; s2 += ribStep) {
          if (s2 <= va + 1e-6) continue;
          ribbonS.push(s2);
        }
        ribbonS.push(vb);
      }
      for (const rs of ribbonS) {
        if (rs > startS + 1e-6 && rs < endS - 1e-6) sampleSet.add(rs);
      }
    }
    const samplePoints = Array.from(sampleSet).sort((a, b) => a - b);
    // Bổ sung các bước đều không quá step = 4
    const sList: number[] = [];
    for (let i = 0; i < samplePoints.length - 1; i++) {
      const p0 = samplePoints[i];
      const p1 = samplePoints[i + 1];
      sList.push(p0);
      const span = p1 - p0;
      if (span > step) {
        const div = Math.ceil(span / step);
        for (let k = 1; k < div; k++) {
          sList.push(p0 + (span * k) / div);
        }
      }
    }
    sList.push(endS);

    const hAt = (pos: number) => {
      for (const zc of zebraCenters) {
        if (Math.abs(pos - zc) <= 1.501) return RAMP_H;
      }
      return SIDEWALK_H;
    };

    // effW tính theo ĐIỂM SAMPLE dùng chung (không phải theo piece) — width
    // liên tục giữa các piece liền kề, hết "bậc thang" tạo khe tam giác giữa
    // 2 piece vỉa hè (seam sidewalk↔sidewalk).
    const effWAt = new Map<number, number>();
    const culledAt = new Map<number, boolean>();
    for (const s of sList) {
      const inner = roadPointAt(road, s);
      const ix = inner.x + inner.nx * side * half;
      const iz = inner.z + inner.nz * side * half;
      let effW = SIDEWALK_W;
      let culled = false;
      for (const sib of siblings) {
        if (sib.facingSide !== side) continue;
        const oHalf = roadHalfWidth(sib.other);
        const d = distToRoad(ix, iz, sib.other);
        if (d < oHalf + 0.2) { culled = true; break; }
        const clear = d - oHalf;
        if (clear < 0.5) { culled = true; break; }
        effW = Math.min(effW, Math.max(0.3, clear - 0.15));
      }
      effWAt.set(s, effW);
      culledAt.set(s, culled);
    }

    // ── innerAt: mép trong vỉa hè nằm ĐÚNG TRÊN polyline mép ribbon ──
    // Ribbon (roadRibbonQuads) sample theo dãy s: [va, grid 2m trong khoảng, vb].
    // Điểm offset bằng pháp tuyến nội suy tại s off-grid PHÍNH ra khỏi chord
    // nối 2 đỉnh ribbon (7-15 cm trên đường cong) → răng cưa. Giải pháp: corner
    // vỉa hè = nội suy TUYẾN TÍNH giữa 2 đỉnh ribbon kề (chord) → gap = 0.
    const innerAt = (s: number, sd: number): [number, number] => {
      const cl = Math.max(0, Math.min(len, s));
      let i = 0;
      while (i < ribbonS.length - 2 && ribbonS[i + 1] < cl) i++;
      const s0 = ribbonS[i], s1 = ribbonS[Math.min(i + 1, ribbonS.length - 1)];
      const f = s1 > s0 + 1e-9 ? (cl - s0) / (s1 - s0) : 0;
      const A = roadPointAt(road, s0), B = roadPointAt(road, s1);
      const ax = A.x + A.nx * sd * half, az = A.z + A.nz * sd * half;
      const bx = B.x + B.nx * sd * half, bz = B.z + B.nz * sd * half;
      return [ax + (bx - ax) * f, az + (bz - az) * f];
    };

    for (let i = 0; i < sList.length - 1; i++) {
      const s = sList[i];
      const nextS = sList[i + 1];
      if (nextS - s < 1e-4) continue;

      const h0 = hAt(s);
      const h1 = hAt(nextS);
      const isRamp = h0 === RAMP_H || h1 === RAMP_H;
      const hAvg = (h0 + h1) / 2;

      // Mép trong = điểm TRÊN chord mép ribbon (innerAt) → trùng khít tuyệt đối
      const [ix0, iz0] = innerAt(s, side);
      const [ix1, iz1] = innerAt(nextS, side);

      const culled = culledAt.get(s) === true || culledAt.get(nextS) === true;
      const effW0 = effWAt.get(s) ?? SIDEWALK_W;
      const effW1 = effWAt.get(nextS) ?? SIDEWALK_W;

      if (!culled) {
        // outer: đẩy từ mép trong theo pháp tuyến curve tại s (inner0/inner1 cũ)
        const n0 = roadPointAt(road, s), n1 = roadPointAt(road, nextS);
        const ox0 = ix0 + n0.nx * side * effW0;
        const oz0 = iz0 + n0.nz * side * effW0;
        const ox1 = ix1 + n1.nx * side * effW1;
        const oz1 = iz1 + n1.nz * side * effW1;

        const top: [number, number, number][] = side === 1
          ? [[ix0, h0, iz0], [ox0, h0, oz0], [ox1, h1, oz1], [ix1, h1, iz1]]
          : [[ix0, h0, iz0], [ix1, h1, iz1], [ox1, h1, oz1], [ox0, h0, oz0]];
        const isFullRamp = h0 === RAMP_H && h1 === RAMP_H;
        const curb: [number, number, number][] | null = isFullRamp ? null : (side === 1
          ? [[ix0, 0, iz0], [ix0, h0, iz0], [ix1, h1, iz1], [ix1, 0, iz1]]
          : [[ix0, h0, iz0], [ix0, 0, iz0], [ix1, 0, iz1], [ix1, h1, iz1]]);
        pieces.push({ top, curb, height: hAvg });
      }
    }
  }
  return pieces;
}

/** Vertex color xen kẽ nhẹ cho mặt vỉa hè (giống gạch lát) */
export function sidewalkPavingColor(x: number, z: number): [number, number, number] {
  const base = 0.62;
  const alt = (Math.floor(x / 0.6) + Math.floor(z / 0.6)) % 2 === 0 ? 0.03 : 0;
  const v = base + alt;
  return [v, v, v * 0.98];
}

export interface CornerPad {
  top: Quad;
  /** curb cho 2 cạnh trong (quay về 2 đường) */
  curbs: Quad[];
}

/**
 * Pad vỉa hè 4 góc giao lộ: ô SW×SW từ mép đường A & B ra ngoài,
 * nối liền vỉa hè 2 nhánh quanh góc — không còn khoảng cỏ ở góc giao lộ.
 */
export function sidewalkCornerPads(map: GameMap): CornerPad[] {
  // Toàn bộ vỉa hè và bó vỉa nút giao hiện đã được buildJunctionMesh tích hợp trực tiếp,
  // đảm bảo liền khối mép đường và không còn pad rời cắt xẻ lòng đường.
  return [];
}