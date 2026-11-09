// 🧱 sidewalk.ts — vỉa hè + bó vỉa (Protocol mục 4.3)
// Mỗi đoạn 4 m: mặt trên PHẲNG tại y=h + mặt curb đứng (0 → h) phía trong.
// Chỗ zebra: hạ mặt (ramp) dài 1.5 m xuống 0.03 m để qua đường cho người đi bộ.
// Pad góc giao lộ: ô vuông SW×SW nối vỉa hè 2 nhánh quanh góc (cùng màu/y → không z-fight nhìn thấy).
import type { GameMap, MapRoad } from './mapLoader';
import type { Quad } from './roadMesh';
import { polylineLength, pointWithNormalAtS, roadHalfWidth, roadSkipZones, roadsAtNode } from './roadMesh';

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
export function sidewalkBoxes(road: MapRoad, map: GameMap): SidewalkPiece[] {
  const half = roadHalfWidth(road);
  const len = polylineLength(road.points);
  const skip = roadSkipZones(road, map);
  const pieces: SidewalkPiece[] = [];

  // tìm zebra centers (từ intersection crosswalks)
  const zebraCenters: number[] = [];
  for (const ix of map.intersections) {
    if (!ix.crosswalks.includes(road.id)) continue;
    const atEnd = road.to === ix.nodeId;
    zebraCenters.push(atEnd ? len - half - 2.5 : half + 2.5);
  }

  const step = 4;
  for (const side of [-1, 1] as const) {
    let s = skip.length && skip[0][0] === 0 ? skip[0][1] : 0;
    const end = skip.length && skip[skip.length - 1][1] === len ? skip[skip.length - 1][0] : len;
    while (s < end) {
      const nextS = Math.min(s + step, end);
      const isRamp = zebraCenters.some(zc => s < zc + RAMP_LEN / 2 && nextS > zc - RAMP_LEN / 2);
      const h = isRamp ? RAMP_H : SIDEWALK_H;
      const inner0 = pointWithNormalAtS(road.points, s);
      const inner1 = pointWithNormalAtS(road.points, nextS);
      const ix0 = inner0.x + inner0.nx * side * half;
      const iz0 = inner0.z + inner0.nz * side * half;
      const ox0 = inner0.x + inner0.nx * side * (half + SIDEWALK_W);
      const oz0 = inner0.z + inner0.nz * side * (half + SIDEWALK_W);
      const ix1 = inner1.x + inner1.nx * side * half;
      const iz1 = inner1.z + inner1.nz * side * half;
      const ox1 = inner1.x + inner1.nx * side * (half + SIDEWALK_W);
      const oz1 = inner1.z + inner1.nz * side * (half + SIDEWALK_W);
      // winding để normal hướng đúng: top hướng lên, curb hướng về mặt đường
      const top: [number, number, number][] = side === 1
        ? [[ix0, h, iz0], [ox0, h, oz0], [ox1, h, oz1], [ix1, h, iz1]]
        : [[ix0, h, iz0], [ix1, h, iz1], [ox1, h, oz1], [ox0, h, oz0]];
      const curb: [number, number, number][] | null = isRamp ? null : (side === 1
        ? [[ix0, 0, iz0], [ix0, h, iz0], [ix1, h, iz1], [ix1, 0, iz1]]
        : [[ix0, h, iz0], [ix0, 0, iz0], [ix1, 0, iz1], [ix1, h, iz1]]);
      pieces.push({ top, curb, height: h });
      s = nextS;
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
  const pads: CornerPad[] = [];
  for (const ix of map.intersections) {
    const node = map.nodes.find(n => n.id === ix.nodeId);
    if (!node) continue;
    const roads = roadsAtNode(map, ix.nodeId);
    if (roads.length < 2) continue;
    const half = Math.max(...roads.map(r => roadHalfWidth(r.road)));

    // chuẩn hóa pháp tuyến sector cho từng road tại node
    // n(road) = (−dz, dx) — edge dương; sector chọn bằng dot với bisector giữa 2 road liền kề
    type Entry = { road: MapRoad; d: [number, number]; n: [number, number]; ang: number };
    const entries: Entry[] = roads.map(({ road, dirX, dirZ }) => ({
      road,
      d: [dirX, dirZ],
      n: [-dirZ, dirX],
      ang: Math.atan2(dirZ, dirX)
    })).sort((a, b) => a.ang - b.ang);

    const norm2pi = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    for (let k = 0; k < entries.length; k++) {
      const A = entries[k];
      const B = entries[(k + 1) % entries.length];

      // ---- BỎ PAD KHI NHÁNH NHÔN / GÓC HỚP QUÁ NHỎ (pad lơ lửng trên cỏ) ----
      // Góc giữa 2 nhánh (rad). < 35° (≈ 0.61 rad) → hai mép ribbon dính sát, pad sẽ lơ lửng.
      const dotAB = Math.max(-1, Math.min(1, A.d[0] * B.d[0] + A.d[1] * B.d[1]));
      const angleAB = Math.acos(dotAB);
      if (angleAB < 0.61) continue; // < 35°

      // Khoảng cách giữa 2 mép ribbon tại node (cạnh bao lồi của góc). < 1.5 m → pad quá hẹp.
      const edgeLen = Math.hypot(
        (A.n[0] - B.n[0]) * half,
        (A.n[1] - B.n[1]) * half
      );
      if (edgeLen < 1.5) continue;

      const bis = A.ang + (norm2pi(B.ang - A.ang)) / 2;
      const bx = Math.cos(bis);
      const bz = Math.sin(bis);
      // pháp tuyến phía sector của mỗi road
      const nA: [number, number] = (A.n[0] * bx + A.n[1] * bz) >= 0 ? A.n : [-A.n[0], -A.n[1]];
      const nB: [number, number] = (B.n[0] * bx + B.n[1] * bz) >= 0 ? B.n : [-B.n[0], -B.n[1]];
      // C1 = góc pad gần node nhất; u dọc road B (=nA), v dọc road A (=nB)
      const c1x = node.x + nA[0] * half + nB[0] * half;
      const c1z = node.z + nA[1] * half + nB[1] * half;
      const ux = nA[0] * SIDEWALK_W;
      const uz = nA[1] * SIDEWALK_W;
      const vx = nB[0] * SIDEWALK_W;
      const vz = nB[1] * SIDEWALK_W;
      const top: Quad = {
        a: [c1x, SIDEWALK_H, c1z],
        b: [c1x + ux, SIDEWALK_H, c1z + uz],
        c: [c1x + ux + vx, SIDEWALK_H, c1z + uz + vz],
        d: [c1x + vx, SIDEWALK_H, c1z + vz]
      };
      // curb cạnh C1→C1+u (nằm trên mép road B): mặt hướng về road B (−nB) → đảo winding
      const curbB: Quad = {
        a: [c1x + ux, 0, c1z + uz],
        b: [c1x, 0, c1z],
        c: [c1x, SIDEWALK_H, c1z],
        d: [c1x + ux, SIDEWALK_H, c1z + uz]
      };
      // curb cạnh C1→C1+v (nằm trên mép road A): mặt hướng về road A (+nA·(−1)?) — winding as-is
      const curbA: Quad = {
        a: [c1x, 0, c1z],
        b: [c1x + vx, 0, c1z + vz],
        c: [c1x + vx, SIDEWALK_H, c1z + vz],
        d: [c1x, SIDEWALK_H, c1z]
      };
      pads.push({ top, curbs: [curbB, curbA] });
    }
  }
  return pads;
}
