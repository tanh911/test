// 🧱 sidewalk.ts — vỉa hè + bó vỉa (Protocol mục 4.3)
// Mỗi đoạn 4 m: mặt trên PHẲNG tại y=h + mặt curb đứng (0 → h) phía trong.
// Chỗ zebra: hạ mặt (ramp) dài 1.5 m xuống 0.03 m để qua đường cho người đi bộ.
import type { GameMap, MapRoad } from './mapLoader';
import { polylineLength, pointWithNormalAtS, roadHalfWidth, roadSkipZones } from './roadMesh';

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
