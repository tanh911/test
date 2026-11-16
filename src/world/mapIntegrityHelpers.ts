// 🛡️ mapIntegrityAudit.test.ts — Bộ kiểm toán bất biến chung cho MỌI GameMap (nhận map làm tham số).
// Được tách từ fullRoadAudit.test.ts (A1, C, D), onewayAudit.test.ts (O2, O3, O6-width)
// và bổ sung phép kiểm Strict-Visual (SV1: 0 đỉnh vỉa hè nằm trong lòng đường, 0 tam giác suy biến)
// theo Bước 3 & Bước 5A.3.
import { describe, expect, it } from 'vitest';
import { buildingStrips } from './buildings';
import type { GameMap, MapRoad, MapSign } from './mapLoader';
import { roadLength, roadPointAt } from './mapLoader';
import {
  buildJunctionMesh,
  roadHalfWidth,
  roadsAtNode,
  type Quad,
} from './roadMesh';
import { sidewalkBoxes } from './sidewalk';
import { SIGN_DEFS } from './trafficSigns';

export function distToPolyline2D(px: number, pz: number, pts: Array<[number, number]>): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const vx = pts[i][0] - pts[i - 1][0];
    const vz = pts[i][1] - pts[i - 1][1];
    const l2 = vx * vx + vz * vz || 1;
    const t = Math.max(
      0,
      Math.min(1, ((px - pts[i - 1][0]) * vx + (pz - pts[i - 1][1]) * vz) / l2)
    );
    best = Math.min(
      best,
      Math.hypot(px - (pts[i - 1][0] + vx * t), pz - (pts[i - 1][1] + vz * t))
    );
  }
  return best;
}

function signWorldPos(sign: MapSign, road: MapRoad): { x: number; z: number } {
  const pt = roadPointAt(road, sign.s);
  const half = roadHalfWidth(road);
  const side = sign.side === 'right' ? 1 : -1;
  return { x: pt.x + pt.nx * side * (half + 1.2), z: pt.z + pt.nz * side * (half + 1.2) };
}

/** A1 (từ fullRoadAudit): Mỗi biển có roadId/type/value/s/side hợp lệ, không trùng, không đè lòng đường/nhà */
export function auditSignsIntegrity(map: GameMap): string[] {
  const roadsById = new Map(map.roads.map((r) => [r.id, r]));
  const strips: Array<[number, number, number, number]> = [];
  for (const b of map.buildings) {
    const s = buildingStrips(map, { ...b, depthOff: 0 });
    if (s) strips.push(...s);
  }

  const issues: string[] = [];
  const seen = new Set<string>();
  for (const sign of map.signs as MapSign[]) {
    const tag = `${sign.type}${sign.value ? '-' + sign.value : ''}@${sign.roadId}:${sign.s}`;
    const road = roadsById.get(sign.roadId);
    if (!road) {
      issues.push(`${tag}: roadId không tồn tại`);
      continue;
    }
    if (!SIGN_DEFS[sign.type]) {
      issues.push(`${tag}: type ${sign.type} không có SIGN_DEFS`);
      continue;
    }
    if (sign.type === '274' && (sign.value === undefined || sign.value < 3 || sign.value > 130)) {
      issues.push(`${tag}: value tốc độ sai (${sign.value})`);
      continue;
    }
    if (sign.type !== '274' && sign.type !== '274.1' && sign.value !== undefined) {
      issues.push(`${tag}: biển ${sign.type} không cần value=${sign.value}`);
    }
    if (sign.side !== 'left' && sign.side !== 'right') {
      issues.push(`${tag}: side sai`);
      continue;
    }
    const len = roadLength(road);
    if (!Number.isFinite(sign.s) || sign.s < 1.5 || sign.s > len - 1.5) {
      issues.push(`${tag}: s=${sign.s} ngoài [1.5, ${len.toFixed(0)}]`);
      continue;
    }
    const key = `${sign.roadId}|${sign.type}|${sign.value ?? ''}|${sign.side}|${Math.round(sign.s / 2)}`;
    if (seen.has(key)) {
      issues.push(`${tag}: trùng biển liền kề`);
      continue;
    }
    seen.add(key);
    const w = signWorldPos(sign, road);
    let onRoad = '';
    for (const r2 of map.roads) {
      if (distToPolyline2D(w.x, w.z, r2.points) < roadHalfWidth(r2) - 0.3) {
        onRoad = r2.id;
        break;
      }
    }
    if (onRoad) {
      issues.push(`${tag}: cột đứng giữa lòng đường ${onRoad} @(${w.x.toFixed(0)},${w.z.toFixed(0)})`);
      continue;
    }
    for (const [a, b, c, d] of strips) {
      if (w.x > a && w.x < c && w.z > b && w.z < d) {
        issues.push(`${tag}: cột trong nhà @(${w.x.toFixed(0)},${w.z.toFixed(0)})`);
        break;
      }
    }
  }
  return issues;
}

/** C (từ fullRoadAudit): Cấu trúc từng road hợp lệ + không chồng lấn lòng đường với road lạ */
export function auditRoadsStructureAndOverlap(map: GameMap): string[] {
  const nodeIds = new Set(map.nodes.map((n) => n.id));
  const roadName = (r: MapRoad) => (r as unknown as { name?: string }).name || '—';
  const issues: string[] = [];

  for (const r of map.roads as MapRoad[]) {
    const tag = `${r.id} (${roadName(r)})`;
    if (!nodeIds.has(r.from) || !nodeIds.has(r.to)) issues.push(`${tag}: node from/to không tồn tại`);
    if (r.points.length < 2) issues.push(`${tag}: ít hơn 2 điểm`);
    for (const [x, z] of r.points) {
      if (!Number.isFinite(x) || !Number.isFinite(z)) {
        issues.push(`${tag}: tọa độ NaN`);
        break;
      }
    }
    const len = roadLength(r);
    if (len < 4) issues.push(`${tag}: dài ${len.toFixed(1)} m < 4 m`);
    const totalLanes = r.lanesForward + r.lanesBackward;
    if (totalLanes < 1) issues.push(`${tag}: 0 làn`);
    const width = totalLanes * r.laneWidth;
    if (r.laneWidth < 2.8 || r.laneWidth > 3.75) {
      issues.push(`${tag}: laneWidth ${r.laneWidth} ngoài [2.8, 3.75]`);
    }
    if (width < 3.3) issues.push(`${tag}: rộng ${width} m — xe không vừa`);
    if (width > 30) issues.push(`${tag}: rộng bất thường ${width} m`);
    if (![5, 10, 20, 30, 40, 50, 60, 70, 80, 100, 120, 130].includes(r.speedLimit)) {
      issues.push(`${tag}: speedLimit ${r.speedLimit} lạ`);
    }
    if (!['main', 'give_way', 'stop', 'equal'].includes(r.priority)) {
      issues.push(`${tag}: priority ${r.priority} lạ`);
    }
    if (!['asphalt', 'asphalt_worn', 'cobble', 'cobblestone'].includes(r.surface)) {
      issues.push(`${tag}: surface ${r.surface} lạ`);
    }
    if (!r.sidewalk || typeof r.sidewalk.left !== 'boolean' || typeof r.sidewalk.right !== 'boolean') {
      issues.push(`${tag}: thiếu flag sidewalk`);
    }
  }

  const roads = map.roads as MapRoad[];
  for (let i = 0; i < roads.length; i++) {
    const A = roads[i];
    for (let j = i + 1; j < roads.length; j++) {
      const B = roads[j];
      if (A.from === B.from || A.from === B.to || A.to === B.from || A.to === B.to) continue;
      const lenA = A.points.reduce(
        (s, p, k) => (k ? s + Math.hypot(p[0] - A.points[k - 1][0], p[1] - A.points[k - 1][1]) : 0),
        0
      );
      let hits = 0;
      for (const f of [0.2, 0.4, 0.6, 0.8]) {
        const target = lenA * f;
        let acc = 0,
          px = A.points[0][0],
          pz = A.points[0][1];
        for (let k = 1; k < A.points.length; k++) {
          const segL = Math.hypot(
            A.points[k][0] - A.points[k - 1][0],
            A.points[k][1] - A.points[k - 1][1]
          );
          if (acc + segL >= target) {
            const t = segL > 0 ? (target - acc) / segL : 0;
            px = A.points[k - 1][0] + (A.points[k][0] - A.points[k - 1][0]) * t;
            pz = A.points[k - 1][1] + (A.points[k][1] - A.points[k - 1][1]) * t;
            break;
          }
          acc += segL;
        }
        const dB = distToPolyline2D(px, pz, B.points);
        if (dB < (roadHalfWidth(A) + roadHalfWidth(B)) * 0.5) hits++;
      }
      if (hits >= 2) issues.push(`${A.id} ↔ ${B.id}: lòng đường chồng lấn (${hits}/4 mẫu)`);
    }
  }
  return issues;
}

/** D (từ fullRoadAudit): Mọi tham chiếu roadId/nodeId ở intersections/spawns/props/buildings hợp lệ */
export function auditReferencesIntegrity(map: GameMap): string[] {
  const roadsById = new Map(map.roads.map((r) => [r.id, r]));
  const nodeIds = new Set(map.nodes.map((n) => n.id));
  const issues: string[] = [];

  for (const ix of map.intersections) {
    if (!nodeIds.has(ix.nodeId)) issues.push(`intersection ${ix.nodeId}: node không tồn tại`);
    if (
      !['right_before_left', 'priority_road', 'yield', 'stop', 'traffic_light', 'roundabout'].includes(
        ix.rule
      )
    ) {
      issues.push(`intersection ${ix.nodeId}: rule ${ix.rule} lạ`);
    }
    for (const cw of ix.crosswalks) {
      if (!roadsById.has(cw)) issues.push(`intersection ${ix.nodeId}: crosswalk road ${cw} không tồn tại`);
    }
    if (ix.trafficLight) {
      const tl = ix.trafficLight;
      if (tl.greenSeconds <= 0 || tl.yellowSeconds <= 0 || tl.redSeconds <= 0) {
        issues.push(`intersection ${ix.nodeId}: chuỗi thời gian đèn sai`);
      }
    }
  }

  const spawnEntries = Object.entries(
    map.spawns as unknown as Record<string, { roadId: string; lane?: number; s?: number }>
  );
  for (const [key, sp] of spawnEntries) {
    if (!roadsById.has(sp.roadId)) issues.push(`spawn '${key}': road ${sp.roadId} không tồn tại`);
    else {
      const r = roadsById.get(sp.roadId)!;
      const total = r.lanesForward + r.lanesBackward;
      if (sp.lane !== undefined && (sp.lane < 0 || sp.lane >= total)) {
        issues.push(`spawn '${key}': lane ${sp.lane} ngoài [0,${total})`);
      }
      if (sp.s !== undefined && (sp.s < 0 || sp.s > roadLength(r))) {
        issues.push(`spawn '${key}': s ngoài đường`);
      }
    }
  }
  for (const pr of map.props ?? []) {
    if (!roadsById.has(pr.roadId)) issues.push(`prop ${pr.type} road ${pr.roadId} không tồn tại`);
  }
  for (const b of map.buildings) {
    if (!roadsById.has(b.roadId)) issues.push(`building road ${b.roadId} không tồn tại`);
  }
  for (const w of map.waters ?? []) {
    if (w.points.length < 2) issues.push(`water ${w.id}: ít điểm`);
  }
  return issues;
}

/** O2, O3, O6-width (từ onewayAudit): Bất biến đường một chiều & biển 267 */
export function auditOnewayInvariants(map: GameMap, twoWay267Exceptions: string[] = []): {
  twoWayWith267: string[];
  wrongEnd267: string[];
  narrowSingleLane: string[];
} {
  const exc = new Set(twoWay267Exceptions);
  const twoWayWith267: string[] = [];
  const wrongEnd267: string[] = [];
  const narrowSingleLane: string[] = [];

  for (const road of map.roads) {
    const isFoneway = road.lanesBackward === 0 && road.lanesForward > 0;
    const isBoneway = road.lanesForward === 0 && road.lanesBackward > 0;
    const isTwoWay = road.lanesForward > 0 && road.lanesBackward > 0;
    const len = roadLength(road) || 1;

    const signs267 = (map.signs as MapSign[])
      .filter((s) => s.type === '267' && s.roadId === road.id)
      .map((s) => ({
        s: s.s,
        end: (s.s < len * 0.25 ? 'from' : s.s > len * 0.75 ? 'to' : 'mid') as 'from' | 'to' | 'mid',
      }));

    if (isTwoWay && signs267.length > 0 && !exc.has(road.id)) {
      twoWayWith267.push(`${road.id} (${signs267.length} biển 267)`);
    }
    if (
      (isFoneway && signs267.some((s) => s.end === 'from')) ||
      (isBoneway && signs267.some((s) => s.end === 'to'))
    ) {
      wrongEnd267.push(road.id);
    }
    if (road.lanesForward + road.lanesBackward === 1 && road.laneWidth < 3.4) {
      narrowSingleLane.push(`${road.id} (laneWidth=${road.laneWidth}m < 3.4m)`);
    }
  }

  return { twoWayWith267, wrongEnd267, narrowSingleLane };
}

function checkQuadsWindingAndDegenerate(quads: Quad[]): {
  badWinding: number;
  degenerate: number;
} {
  let badWinding = 0;
  let degenerate = 0;
  const triCheck = (
    p0: [number, number, number],
    p1: [number, number, number],
    p2: [number, number, number]
  ) => {
    const ux = p1[0] - p0[0];
    const uz = p1[2] - p0[2];
    const vx = p2[0] - p0[0];
    const vz = p2[2] - p0[2];
    const cross = ux * vz - uz * vx;
    const area = Math.abs(cross) * 0.5;
    if (area < 1e-4) degenerate++;
    if (cross >= -1e-7) badWinding++;
  };
  for (const q of quads) {
    triCheck(q.a, q.b, q.c);
    if (Math.hypot(q.c[0] - q.d[0], q.c[2] - q.d[2]) > 1e-5) {
      triCheck(q.a, q.c, q.d);
    }
  }
  return { badWinding, degenerate };
}

/**
 * SV1 (Strict-Visual — Bước 5A.2 & 5A.3):
 * Kiểm tra tại mọi nút giao (map.intersections):
 *  1. 0 đỉnh vỉa hè (sidewalkBoxes & buildJunctionMesh.sidewalkQuads) nằm trong lòng đường cơ giới của nhánh khác.
 *  2. 0 tam giác mặt trên suy biến (area < 1e-4) hoặc sai chiều pháp tuyến (cross >= 0).
 */
export function auditStrictVisualSidewalkAndTriangles(map: GameMap): {
  violatingNodes: Array<{
    nodeId: string;
    intrudingVertexCount: number;
    maxIntrusionM: number;
    worstRoadPair: string;
  }>;
  maxIntrusionM: number;
  badWindingTotal: number;
  degenerateTriTotal: number;
} {
  const boxesByRoad = new Map<string, ReturnType<typeof sidewalkBoxes>>();
  for (const r of map.roads) {
    boxesByRoad.set(r.id, sidewalkBoxes(r, map));
  }

  const violatingNodes: Array<{
    nodeId: string;
    intrudingVertexCount: number;
    maxIntrusionM: number;
    worstRoadPair: string;
  }> = [];
  let globalMaxIntrusionM = 0;
  let badWindingTotal = 0;
  let degenerateTriTotal = 0;

  for (const ix of map.intersections) {
    const node = map.nodes.find((n) => n.id === ix.nodeId);
    if (!node) continue;
    const conn = roadsAtNode(map, node.id);
    if (conn.length < 2) continue;

    const localRoads = conn.map((c) => c.road);
    const jMesh = buildJunctionMesh(node.x, node.z, conn);

    const w1 = checkQuadsWindingAndDegenerate(jMesh.asphaltQuads);
    const w2 = checkQuadsWindingAndDegenerate(jMesh.sidewalkQuads);
    badWindingTotal += w1.badWinding + w2.badWinding;
    degenerateTriTotal += w1.degenerate + w2.degenerate;

    let intrudingVertexCount = 0;
    let maxIntrusionM = 0;
    let worstRoadPair = '';

    for (const road of localRoads) {
      const boxes = boxesByRoad.get(road.id) ?? [];
      for (const box of boxes) {
        for (const [wx, , wz] of box.top) {
          if (Math.hypot(wx - node.x, wz - node.z) > 28) continue;
          for (const other of localRoads) {
            if (other.id === road.id) continue;
            const oHalf = roadHalfWidth(other);
            const d = distToPolyline2D(wx, wz, other.points);
            const intrusion = oHalf - 0.05 - d;
            if (intrusion > 0) {
              intrudingVertexCount++;
              if (intrusion > maxIntrusionM) {
                maxIntrusionM = intrusion;
                worstRoadPair = `${road.id} -> ${other.id}`;
              }
            }
          }
        }
      }
    }

    for (const q of jMesh.sidewalkQuads) {
      for (const v of [q.a, q.b, q.c, q.d]) {
        const wx = v[0],
          wz = v[2];
        for (const road of localRoads) {
          const half = roadHalfWidth(road);
          const d = distToPolyline2D(wx, wz, road.points);
          const intrusion = half - 0.15 - d;
          if (intrusion > 0) {
            intrudingVertexCount++;
            if (intrusion > maxIntrusionM) {
              maxIntrusionM = intrusion;
              worstRoadPair = `junction_wedge -> ${road.id}`;
            }
          }
        }
      }
    }

    if (intrudingVertexCount > 0) {
      const rounded = Number(maxIntrusionM.toFixed(3));
      violatingNodes.push({
        nodeId: node.id,
        intrudingVertexCount,
        maxIntrusionM: rounded,
        worstRoadPair,
      });
      if (rounded > globalMaxIntrusionM) globalMaxIntrusionM = rounded;
    }
  }

  violatingNodes.sort((a, b) => b.maxIntrusionM - a.maxIntrusionM);
  return {
    violatingNodes,
    maxIntrusionM: globalMaxIntrusionM,
    badWindingTotal,
    degenerateTriTotal,
  };
}

export interface MapIntegrityAuditOptions {
  twoWay267Exceptions?: string[];
  /**
   * Nếu được cung cấp (dành riêng cho map Berlin OSM cũ), bài test SV1 được đánh dấu
   * `it.fails(...)` (expected fail) với lý do cụ thể — KHÔNG nới ngưỡng, KHÔNG xóa test.
   */
  expectStrictVisualFailReason?: string;
}

export function describeMapIntegrityAudit(
  label: string,
  map: GameMap,
  opts: MapIntegrityAuditOptions = {}
) {
  describe(`🛡️ MAP INTEGRITY AUDIT [${label}]`, () => {
    it('A1. Mỗi biển: roadId/type/value/s/side hợp lệ + không trùng + không đè lòng đường/nhà', () => {
      const issues = auditSignsIntegrity(map);
      expect(issues).toEqual([]);
    });

    it('C. Mỗi road: cấu trúc hợp lệ + không chồng lấn lòng đường với road lạ', () => {
      const issues = auditRoadsStructureAndOverlap(map);
      expect(issues).toEqual([]);
    });

    it('D. Mọi tham chiếu roadId/nodeId ở intersections/spawns/props/buildings hợp lệ', () => {
      const issues = auditReferencesIntegrity(map);
      expect(issues).toEqual([]);
    });

    it('O2 & O3 & O6-width. Nhất quán đường một chiều (0 biển 267 sai đầu/trên đường 2 chiều, 1 làn >= 3.4m)', () => {
      const res = auditOnewayInvariants(map, opts.twoWay267Exceptions ?? []);
      expect(res.twoWayWith267).toEqual([]);
      expect(res.wrongEnd267).toEqual([]);
      expect(res.narrowSingleLane).toEqual([]);
    });

    if (opts.expectStrictVisualFailReason) {
      it.fails(
        `SV1 [EXPECTED FAIL trên ${label} — ${opts.expectStrictVisualFailReason}]: 0 đỉnh vỉa hè nằm trong lòng đường & 0 tam giác suy biến`,
        () => {
          const sv = auditStrictVisualSidewalkAndTriangles(map);
          expect(sv.badWindingTotal).toBe(0);
          expect(sv.degenerateTriTotal).toBe(0);
          // Giữ nguyên ngưỡng tuyệt đối 0 nút vi phạm (trên Berlin thực tế có 90/127 nút vi phạm, max 6.127m tại n51)
          expect(sv.violatingNodes).toEqual([]);
        }
      );
    } else {
      it('SV1 (Strict-Visual): 0 đỉnh vỉa hè nằm trong lòng đường & 0 tam giác suy biến', () => {
        const sv = auditStrictVisualSidewalkAndTriangles(map);
        expect(sv.badWindingTotal).toBe(0);
        expect(sv.degenerateTriTotal).toBe(0);
        expect(sv.violatingNodes).toEqual([]);
      });
    }
  });
}


