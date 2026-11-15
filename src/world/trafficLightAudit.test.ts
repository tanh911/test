// trafficLightAudit.test.ts — 🚦 AUDIT ĐÈN GIAO THÔNG toàn bộ map:
// 1. Mọi approach có làn ĐẾN node phải có đèn (pos hoặc sharedPole — cột gộp).
// 2. Vị trí: ngoài mọi corridor road, không trong nhà, cách node hợp lý.
// 3. Nhóm pha: arm KỀ nhau (<90°) KHÁC nhóm (chặn xung đột xanh chéo) — cặp
//    unresolved (odd-cycle bất khả thi 2 pha) được bỏ qua; đối diện khác nhóm
//    chỉ WARN (pha lệch, an toàn).
// 4. Mỗi approach đúng 1 đèn, không trùng vị trí (sharedPole gộp chung cột).
// Chạy: npx vitest run src/world/trafficLightAudit.test.ts
import { describe, expect, it } from 'vitest';
import berlinMitteMap from '../data/maps/berlin-mitte-clean.json';
import type { GameMap, MapIntersection, MapRoad } from './mapLoader';
import { loadGameMap, nodeById } from './mapLoader';
import { planLightsForIntersection, LightPlan } from './trafficLights';
import { buildingStrips } from './buildings';

const map: GameMap = loadGameMap(berlinMitteMap);

function distToPolyline(px: number, pz: number, pts: Array<[number, number]>): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const vx = pts[i][0] - pts[i - 1][0], vz = pts[i][1] - pts[i - 1][1];
    const l2 = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((px - pts[i - 1][0]) * vx + (pz - pts[i - 1][1]) * vz) / l2));
    best = Math.min(best, Math.hypot(px - (pts[i - 1][0] + vx * t), pz - (pts[i - 1][1] + vz * t)));
  }
  return best;
}
function angDiff(a: number, b: number): number {
  let d = Math.abs(a - b);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return d;
}
const isShared = (a: LightPlan) => (a as unknown as { sharedPole?: boolean }).sharedPole === true;
const isUnresolved = (a: LightPlan) => (a as unknown as { unresolved?: boolean }).unresolved === true;

describe('🚦 TRAFFIC LIGHT AUDIT — mọi giao lộ có đèn', () => {
  const strips: Array<[number, number, number, number]> = [];
  for (const b of map.buildings) {
    const st = buildingStrips(map, { ...b, depthOff: 0 });
    if (st) strips.push(...st);
  }
  const nodesWithLight = (map.intersections as MapIntersection[]).filter((ix) => ix.trafficLight);

  it('1. Mọi approach có làn tới node đều có đèn (đặt riêng hoặc cột gộp)', () => {
    const issues: string[] = [];
    let totalApproaches = 0, totalPlaced = 0;
    for (const ix of nodesWithLight) {
      const { arms, approaches } = planLightsForIntersection(ix, map);
      totalApproaches += approaches;
      const node = nodeById(map, ix.nodeId)!;
      for (const arm of arms) {
        if (!arm.pos && !isShared(arm)) {
          issues.push(`${ix.nodeId}/${arm.roadId}:${arm.end}: KHÔNG tìm được vị trí đặt đèn`);
          continue;
        }
        totalPlaced++;
        const posNow = arm.pos;
        if (!posNow) continue; // sharedPole — không có mesh riêng
        const road = map.roads.find((r) => r.id === arm.roadId) as MapRoad;
        const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
        // khoảng cách tới node
        const dNode = Math.hypot(posNow.x - node.x, posNow.z - node.z);
        if (dNode > half + 1 + 26) issues.push(`${ix.nodeId}/${arm.roadId}:${arm.end}: đèn cách node ${dNode.toFixed(1)}m quá xa`);
        // ngoài mọi corridor road?
        for (const r2 of map.roads) {
          const h2 = (r2.lanesForward + r2.lanesBackward) * r2.laneWidth / 2;
          if (distToPolyline(posNow.x, posNow.z, r2.points) < h2 + 0.25) {
            issues.push(`${ix.nodeId}/${arm.roadId}:${arm.end}: đèn đè corridor ${r2.id} @(${posNow.x.toFixed(0)},${posNow.z.toFixed(0)})`);
            break;
          }
        }
        // trong nhà?
        for (const [a, b2, c, dd2] of strips) {
          if (posNow.x > a && posNow.x < c && posNow.z > b2 && posNow.z < dd2) {
            issues.push(`${ix.nodeId}/${arm.roadId}:${arm.end}: đèn trong nhà @(${posNow.x.toFixed(0)},${posNow.z.toFixed(0)})`);
            break;
          }
        }
      }
    }
    console.info(`[TL] node có đèn: ${nodesWithLight.length} · approach: ${totalApproaches} · đèn: ${totalPlaced}`);
    expect(totalPlaced).toBe(totalApproaches);
    expect(issues).toEqual([]);
  });

  it('2. Mặt đèn quay VỀ xe đang tới (forward ≈ −flow)', () => {
    const issues: string[] = [];
    for (const ix of nodesWithLight) {
      const { arms } = planLightsForIntersection(ix, map);
      for (const arm of arms) {
        if (!arm.pos || isShared(arm)) continue;
        const fxw = Math.sin(arm.yaw), fzw = Math.cos(arm.yaw);
        const dot = fxw * -arm.fx + fzw * -arm.fz;
        if (dot < 0.99) issues.push(`${ix.nodeId}/${arm.roadId}:${arm.end}: đèn quay sai (dot=${dot.toFixed(3)})`);
      }
    }
    expect(issues).toEqual([]);
  });

  it('3. Nhóm pha: kề nhau (<90°) KHÁC nhóm — không xanh chéo; đối diện khác nhóm chỉ WARN', () => {
    const issues: string[] = [];
    let warns = 0;
    for (const ix of nodesWithLight) {
      const { arms } = planLightsForIntersection(ix, map);
      for (let i = 0; i < arms.length; i++) {
        for (let j = i + 1; j < arms.length; j++) {
          const gap = angDiff(arms[i].ang, arms[j].ang);
          const opp = Math.abs(gap - Math.PI) < 0.35;
          const adjacent = gap < Math.PI / 2;
          if (opp && arms[i].group !== arms[j].group && !isUnresolved(arms[i]) && !isUnresolved(arms[j])) {
            warns++;
            console.info(`[TL warn] ${ix.nodeId}: ${arms[i].roadId}:${arms[i].end} ↔ ${arms[j].roadId}:${arms[j].end} đối diện khác nhóm (pha lệch, an toàn)`);
          }
          if (adjacent && arms[i].group === arms[j].group && !isUnresolved(arms[i]) && !isUnresolved(arms[j])) {
            issues.push(`${ix.nodeId}: ${arms[i].roadId}:${arms[i].end} ↔ ${arms[j].roadId}:${arms[j].end} KỀ nhau (gap ${(gap * 180 / Math.PI).toFixed(0)}°) CÙNG nhóm ${arms[i].group}`);
          }
        }
      }
    }
    console.info(`[TL-3] đối diện khác nhóm (an toàn): ${warns}`);
    expect(issues).toEqual([]);
  });

  it('4. Mỗi approach đúng 1 đèn (cột gộp không tạo mesh trùng)', () => {
    const issues: string[] = [];
    for (const ix of nodesWithLight) {
      const { arms } = planLightsForIntersection(ix, map);
      const seen = new Set<string>();
      for (const arm of arms) {
        if (!arm.pos || isShared(arm)) continue;
        const key = `${arm.roadId}:${arm.end}`;
        if (seen.has(key)) issues.push(`${ix.nodeId}/${key}: trùng approach`);
        seen.add(key);
      }
      const placed = arms.filter((a) => a.pos && !isShared(a));
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const d = Math.hypot(placed[i].pos!.x - placed[j].pos!.x, placed[i].pos!.z - placed[j].pos!.z);
          if (d < 1.5) issues.push(`${ix.nodeId}: 2 đèn trùng vị trí (${placed[i].roadId}:${placed[i].end} ↔ ${placed[j].roadId}:${placed[j].end}, d=${d.toFixed(1)}m)`);
        }
      }
    }
    expect(issues).toEqual([]);
  });
});
