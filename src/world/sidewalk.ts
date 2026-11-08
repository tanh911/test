// 🧱 sidewalk.ts — vỉa hè + bó vỉa (Protocol mục 4.3)
import type { GameMap, MapRoad } from './mapLoader';
import { polylineLength, pointWithNormalAtS, roadHalfWidth, roadSkipZones } from './roadMesh';

export interface SidewalkBox {
  /** 4 đỉnh đáy (thứ tự hợp dấu): bên trong road → bên ngoài */
  corners: [number, number, number][];
  height: number;
}

const SIDEWALK_W = 2.5;
const SIDEWALK_H = 0.15;
const RAMP_H = 0.03;
const RAMP_LEN = 1.5;

/**
 * Vỉa hè mỗi bên: hộp kéo dài theo mép đường, cao 0.15, rộng 2.5.
 * Chỗ zebra: hạ vỉa (ramp) dài 1.5 m.
 * Cao độ: hộp từ y=0 (đáy) đến y=0.15 (mặt); ramp chỉ tới y=0.03.
 */
export function sidewalkBoxes(road: MapRoad, map: GameMap): SidewalkBox[] {
  const half = roadHalfWidth(road);
  const len = polylineLength(road.points);
  const skip = roadSkipZones(road, map);
  const boxes: SidewalkBox[] = [];

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
      const inRamp0 = isRamp && s < zebraCenters[0]! + 0;
      void inRamp0;
      const inner0 = pointWithNormalAtS(road.points, s);
      const inner1 = pointWithNormalAtS(road.points, nextS);
      const corners: [number, number, number][] = [
        [inner0.x + inner0.nx * side * half, 0, inner0.z + inner0.nz * side * half],
        [inner0.x + inner0.nx * side * (half + SIDEWALK_W), h, inner0.z + inner0.nz * side * (half + SIDEWALK_W)],
        [inner1.x + inner1.nx * side * (half + SIDEWALK_W), h, inner1.z + inner1.nz * side * (half + SIDEWALK_W)],
        [inner1.x + inner1.nx * side * half, 0, inner1.z + inner1.nz * side * half]
      ];
      boxes.push({ corners, height: h });
      s = nextS;
    }
    void SIDEWALK_W;
  }
  void RAMP_LEN;
  return boxes;
}

/** Vertex color xen kẽ nhẹ cho mặt vỉa hè (giống gạch lát) */
export function sidewalkPavingColor(x: number, z: number): [number, number, number] {
  const base = 0.62;
  const alt = (Math.floor(x / 0.6) + Math.floor(z / 0.6)) % 2 === 0 ? 0.03 : 0;
  const v = base + alt;
  return [v, v, v * 0.98];
}
