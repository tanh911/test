// 💥 collisions.ts — va chạm khối tĩnh (AABB nhà) cho player (Protocol Prompt 10)
// Nhà dựng dọc road: mặt tiền half+2.5, sâu 12 m → dựng AABB xấp xỉ (đường thẳng = chính xác).
// GỒM cả nhà gap-fill/courtyard do planCityBlockFill sinh (plan được cache trong buildings.ts
// — allBuildingQuads đã tính rồi, aquí chỉ đọc lại) — xe không thể xuyên qua nhà fill mặt tiền.
import type { GameMap } from './mapLoader';
import { roadById, pointAtS } from './mapLoader';
import { planCityBlockFill } from './buildings';

export interface BuildingRect {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Dựng AABB cho mọi building trong map (nhà gốc + nhà fill) — gọi 1 lần khi init */
export function buildingRects(map: GameMap): BuildingRect[] {
  const out: BuildingRect[] = [];
  const plan = planCityBlockFill(map); // cached — không tính lại
  const all = [...map.buildings, ...plan.rows];
  for (const b of all) {
    const road = roadById(map, b.roadId);
    if (!road) continue;
    const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
    const side = b.side === 'right' ? 1 : -1;
    const depthOff = 'depthOff' in b ? (b as { depthOff?: number }).depthOff ?? 0 : 0;
    const depth = 'depth' in b ? (b as { depth?: number }).depth ?? 12 : 12;
    const front = half + 2.5 + depthOff;
    const back = front + depth;
    const s0 = Math.max(0, b.s);
    const s1 = b.s + b.length;
    const corners: Array<{ x: number; z: number }> = [];
    for (const [s, off] of [[s0, front], [s1, front], [s1, back], [s0, back]] as const) {
      const pt = pointAtS(road, s);
      // phải flow = (−cos h, sin h)
      const rx = -Math.cos(pt.heading);
      const rz = Math.sin(pt.heading);
      corners.push({ x: pt.x + rx * side * off, z: pt.z + rz * side * off });
    }
    out.push({
      id: `${b.roadId}_${b.side}_${b.s}`,
      minX: Math.min(...corners.map(c => c.x)),
      maxX: Math.max(...corners.map(c => c.x)),
      minZ: Math.min(...corners.map(c => c.z)),
      maxZ: Math.max(...corners.map(c => c.z))
    });
  }
  return out;
}
