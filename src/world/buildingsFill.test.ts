// buildingsFill.test.ts — lấp phố: gap dọc đường + hàng courtyard
// Quy tắc: không đè đường, không đè nhau (mức strip), deterministic.
import { describe, expect, it } from 'vitest';
import muenchenCleanMap from '../data/maps/muenchen-altstadt-clean.json';
import type { GameMap, MapRoad } from './mapLoader';
import { roadById, roadFullWidth, roadLength, roadPointAt } from './mapLoader';
import { buildingQuads, buildingStrips, planCityBlockFill } from './buildings';

const map = muenchenCleanMap as unknown as GameMap;

/** Khoảng cách từ điểm tới SWATH hình chữ nhật của road (segment quét rộng half) + bbox precheck */
const roadBBoxes = map.roads.map((r) => {
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const [x, z] of r.points) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  return { minX, minZ, maxX, maxZ };
});
function distToRoadSwath(x: number, z: number, road: MapRoad, roadIdx: number): number {
  const bb = roadBBoxes[roadIdx];
  if (x < bb.minX - 1 || x > bb.maxX + 1 || z < bb.minZ - 1 || z > bb.maxZ + 1) return Infinity;
  let best = Infinity;
  const pts = road.points;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1];
    const [bx, bz] = pts[i];
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz || 1;
    const tRaw = ((x - ax) * dx + (z - az) * dz) / l2;
    const t = Math.max(0, Math.min(1, tRaw));
    const px = ax + t * dx, pz = az + t * dz;
    const perp = Math.hypot(x - px, z - pz);
    // phần lùi trục (sau end-cap) và phần vượt băng ngang — chuẩn point-to-OBB
    const axOverflow = tRaw < 0 ? Math.hypot(x - ax, z - az) - perp : (tRaw > 1 ? Math.hypot(x - bx, z - bz) - perp : 0);
    const d = Math.hypot(Math.max(0, axOverflow), Math.max(0, perp - roadFullWidth(road) / 2));
    if (d < best) best = d;
  }
  return best;
}

describe('planCityBlockFill — lấp gap dọc phố + hàng courtyard', () => {
  const plan = planCityBlockFill(map);

  it('sinh đủ lượng nhà fill trên map München', () => {
    expect(plan.stats.front).toBe(1224);
    expect(plan.stats.gapFilled).toBeGreaterThanOrEqual(20); // gap fillable (block hẹp phần lớn đã kín 2 phía)
    expect(plan.stats.rowsAdded).toBeGreaterThan(500);       // 678 hàng courtyard — nguồn khối lượng chính
    expect(plan.rows.length).toBeGreaterThan(550);
    expect(plan.stats.rejected).toBeGreaterThan(0); // có chặn thật
  });

  it('không nhà fill nào đè mặt asphalt bất kỳ (dist tới swath ≥ 0.3 m)', () => {
    for (const row of plan.rows) {
      const road = roadById(map, row.roadId);
      if (!road) continue;
      const half = roadFullWidth(road) / 2;
      const frontOff = half + 2 + row.depthOff;
      const s0 = Math.max(0, row.s);
      const s1 = Math.min(roadLength(road), row.s + row.length);
      for (const s of [s0, (s0 + s1) / 2, s1]) {
        const p = roadPointAt(road, s);
        const side = row.side === 'right' ? 1 : -1;
        for (const off of [frontOff, frontOff + 9]) {
          const x = p.x + p.nx * side * off;
          const z = p.z + p.nz * side * off;
          for (let ri = 0; ri < map.roads.length; ri++) {
            const d = distToRoadSwath(x, z, map.roads[ri], ri);
            expect(d).toBeGreaterThanOrEqual(0.3 - 1e-6);
          }
        }
      }
    }
  }, 60000);

  it('các nhà fill không đè lên nhau (đối chiếu mức strip, loại cặp cùng nhà)', () => {
    type R = { x0: number; z0: number; x1: number; z1: number; row: number };
    const rects: R[] = [];
    plan.rows.forEach((row, idx) => {
      const strips = buildingStrips(map, row);
      expect(strips).not.toBeNull();
      for (const [x0, z0, x1, z1] of strips!) rects.push({ x0, z0, x1, z1, row: idx });
    });
    rects.sort((a, b) => a.x0 - b.x0);
    let overlaps = 0;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length && rects[j].x0 <= rects[i].x1; j++) {
        const a = rects[i], b = rects[j];
        if (a.row === b.row) continue; // strip liền kề của cùng 1 nhà có thể chạm nhau qua mép
        // cùng semantics với STRIP_TOL của engine: hở < 0.3 m là chấp nhận được
        if (a.x0 < b.x1 - 0.3 && b.x0 < a.x1 - 0.3 && a.z0 < b.z1 - 0.3 && b.z0 < a.z1 - 0.3) overlaps++;
      }
    }
    expect(overlaps).toBe(0);
  });

  it('deterministic: 2 lần chạy cho kế hoạch giống hệt nhau', () => {
    const again = planCityBlockFill(map);
    expect(JSON.stringify(again.rows)).toBe(JSON.stringify(plan.rows));
  });

  it('nhà mặt tiền fill có cửa sổ, hàng courtyard tường trơn', () => {
    const gapRow = plan.rows.find(r => !r.plain);
    const courtRow = plan.rows.find(r => r.plain);
    expect(gapRow).toBeDefined();
    expect(courtRow).toBeDefined();
    const gapQuads = buildingQuads(map, gapRow!);
    const courtQuads = buildingQuads(map, courtRow!);
    // mặt tiền: facade + cửa sổ nhiều tầng + cửa hàng + hông + mái → nhiều quads
    expect(gapQuads.length).toBeGreaterThan(15);
    // courtyard: facade + 2 hông + mặt sau + mái/parapet → ít quads
    expect(courtQuads.length).toBeLessThanOrEqual(14);
    expect(courtQuads.length).toBeGreaterThanOrEqual(5);
  });
});
