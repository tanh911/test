// 🏙️ cityGenerator.ts — Bộ sinh bản đồ thành phố kiểu Đức từ khai báo (Declarative German City Generator)
// Chuyển đổi CityDefinition (city.json) -> GameMap v1 chuẩn mà KHÔNG sửa đổi renderer, mapLoader.ts hay ruleEngine.ts.
// Mọi biển báo, vạch kẻ, quy tắc nút giao đều sinh từ MỘT nguồn duy nhất (RoadProfile + IntersectionTemplate).

import {
  roadLength,
  roadPointAt,
  type GameMap,
  type IntersectionRule,
  type MapBuilding,
  type MapIntersection,
  type MapNode,
  type MapProp,
  type MapRoad,
  type MapSign,
  type MapSpawn,
  type MapWater,
  type ParkingType,
  type PriorityType,
  type SurfaceType
} from '../../world/mapLoader';
import { buildingStrips } from '../../world/buildings';

export type RoadProfileId =
  | 'wohnstrasse_30'
  | 'altstadt_pflaster_30'
  | 'einbahnstrasse_30'
  | 'sammelstrasse_rad_50'
  | 'gewerbestrasse_bus_50'
  | 'hauptstrasse_2x2_50'
  | 'landstrasse_70';

export type IntersectionTemplateId =
  | 'T1_RVL_4WAY'
  | 'T2_T_JUNCTION_PRIOR'
  | 'T3_STOP_CROSSING'
  | 'T4_AMPEL_4WAY'
  | 'T5_KREISVERKEHR'
  | 'T6_ZEBRA_MIDBLOCK';

export interface RoadProfileDef {
  id: RoadProfileId;
  lanesForward: number;
  lanesBackward: number;
  laneWidth: number;
  speedLimit: number;
  surface: SurfaceType;
  sidewalk: { left: boolean; right: boolean };
  bikeLane: { left: boolean; right: boolean };
  parking: { left: ParkingType; right: ParkingType };
  defaultPriority: PriorityType;
}

/** Bảng 7 mẫu mặt cắt đường phố chuẩn Đức (StVO / RASt 06 thiết kế) */
export const ROAD_PROFILES: Record<RoadProfileId, RoadProfileDef> = {
  wohnstrasse_30: {
    id: 'wohnstrasse_30',
    lanesForward: 1,
    lanesBackward: 1,
    laneWidth: 3.0, // W = 6.0m, half = 3.00m (khớp CITY_DESIGN.md mục 1.1)
    speedLimit: 30,
    surface: 'asphalt',
    sidewalk: { left: true, right: true },
    bikeLane: { left: false, right: false },
    parking: { left: 'none', right: 'parallel' },
    defaultPriority: 'equal'
  },
  altstadt_pflaster_30: {
    id: 'altstadt_pflaster_30',
    lanesForward: 1,
    lanesBackward: 1,
    laneWidth: 3.0, // W = 6.0m, half = 3.00m (khớp CITY_DESIGN.md mục 1.1)
    speedLimit: 30,
    surface: 'cobble',
    sidewalk: { left: true, right: true },
    bikeLane: { left: false, right: false },
    parking: { left: 'none', right: 'none' },
    defaultPriority: 'equal'
  },
  einbahnstrasse_30: {
    id: 'einbahnstrasse_30',
    lanesForward: 1,
    lanesBackward: 0,
    laneWidth: 3.5, // W = 3.5m, half = 1.75m (khớp CITY_DESIGN.md mục 1.1)
    speedLimit: 30,
    surface: 'asphalt',
    sidewalk: { left: true, right: true },
    bikeLane: { left: false, right: false },
    parking: { left: 'parallel', right: 'none' },
    defaultPriority: 'equal'
  },
  sammelstrasse_rad_50: {
    id: 'sammelstrasse_rad_50',
    lanesForward: 1,
    lanesBackward: 1,
    laneWidth: 3.5, // W = 7.0m, half = 3.50m (khớp CITY_DESIGN.md mục 1.1)
    speedLimit: 50,
    surface: 'asphalt',
    sidewalk: { left: true, right: true },
    bikeLane: { left: true, right: true },
    parking: { left: 'none', right: 'none' },
    defaultPriority: 'main'
  },
  gewerbestrasse_bus_50: {
    id: 'gewerbestrasse_bus_50',
    lanesForward: 1,
    lanesBackward: 1,
    laneWidth: 3.5, // W = 7.0m, half = 3.50m (khớp CITY_DESIGN.md mục 1.1)
    speedLimit: 50,
    surface: 'asphalt',
    sidewalk: { left: true, right: true },
    bikeLane: { left: false, right: false },
    parking: { left: 'none', right: 'none' },
    defaultPriority: 'main'
  },
  hauptstrasse_2x2_50: {
    id: 'hauptstrasse_2x2_50',
    lanesForward: 2,
    lanesBackward: 2,
    laneWidth: 3.25, // W = 13.0m, half = 6.50m (khớp CITY_DESIGN.md mục 1.1)
    speedLimit: 50,
    surface: 'asphalt',
    sidewalk: { left: true, right: true },
    bikeLane: { left: true, right: true },
    parking: { left: 'none', right: 'none' },
    defaultPriority: 'main'
  },
  landstrasse_70: {
    id: 'landstrasse_70',
    lanesForward: 1,
    lanesBackward: 1,
    laneWidth: 3.5, // W = 7.0m, half = 3.50m (khớp CITY_DESIGN.md mục 1.1)
    speedLimit: 70,
    surface: 'asphalt',
    sidewalk: { left: false, right: false },
    bikeLane: { left: false, right: false },
    parking: { left: 'none', right: 'none' },
    defaultPriority: 'main'
  }
};

export interface CityNodeDef {
  id: string;
  x: number;
  z: number;
  kind: 'intersection' | 'end';
  template?: IntersectionTemplateId;
  /** Danh sách ID cạnh thuộc trục ưu tiên (Vorfahrtstraße - Z.306) tại nút này */
  priorityEdges?: string[];
  /** Danh sách ID cạnh có vạch qua đường (Zebrastreifen) tại nút này */
  crosswalkEdges?: string[];
}

export interface CityEdgeDef {
  id: string;
  name: string;
  from: string;
  to: string;
  profile: RoadProfileId;
  /** Các điểm uốn giữa đoạn (không bao gồm from và to). Phải cách mỗi đầu >= 20m và giữ thẳng góc tiếp tuyến */
  waypoints?: Array<[number, number]>;
  priorityOverride?: PriorityType;
  parkingOverride?: { left: ParkingType; right: ParkingType };
  bridge?: boolean;
  /** Đánh dấu đoạn chuyển tiếp bề rộng (taper) giữa 2 nút bậc 2 (L >= 20m, ΔW <= 1.0m) */
  isTaper?: boolean;
  /** Biển báo đặc thù theo điểm mốc trên cạnh (VD: 314 đỗ xe đích, 138 làn xe đạp, 283 trạm buýt) */
  poiSigns?: Array<{
    type: string;
    s: number;
    side: 'left' | 'right';
    value?: number;
    flip?: boolean;
  }>;
  /** Vật thể đặc thù theo điểm mốc trên cạnh (VD: parkscheinautomat tại bãi đỗ đích, bench tại trạm buýt) */
  poiProps?: Array<{
    type: MapProp['type'];
    s: number;
    side: 'left' | 'right';
  }>;
}

export interface CityDefinition {
  version: 1;
  name: string;
  seed: number;
  nodes: CityNodeDef[];
  edges: CityEdgeDef[];
  waters?: MapWater[];
  parks?: Array<{ id: string; name?: string; points: [number, number][] }>;
  tramCrossings?: Array<{ id: string; edgeId: string; s: number; points: [number, number][] }>;
  spawns: {
    player: MapSpawn;
  };
}

export function profileFullWidth(profileId: RoadProfileId): number {
  const p = ROAD_PROFILES[profileId];
  return (p.lanesForward + p.lanesBackward) * p.laneWidth;
}

export function profileHalfWidth(profileId: RoadProfileId): number {
  return profileFullWidth(profileId) / 2;
}

/**
 * Hàm ngưỡng góc tối thiểu θ_min(h_A, h_B) (độ) suy từ công thức hình học d_perp trong docs/junction_constraints.md:
 *   s_A = h_A + 0.75 (junctionCutExtent), y_out(h_A) = h_A + 2.50 (SIDEWALK_W)
 *   d_perp(θ; h_A) = s_A * sin(θ) - y_out(h_A) * cos(θ) >= h_B - eps
 *   => θ_min(h_A, h_B) = max( φ(h_A) + arcsin((h_B - eps)/R(h_A)), φ(h_B) + arcsin((h_A - eps)/R(h_B)) )
 */
export function computeMinSafeAngleDeg(halfA: number, halfB: number, eps = 0.05): number {
  const oneWay = (hSelf: number, hOther: number): number => {
    const s = hSelf + 0.75;
    const yOut = hSelf + 2.5;
    const R = Math.hypot(s, yOut);
    const phi = Math.atan2(yOut, s);
    const ratio = Math.max(-1, Math.min(1, (hOther - eps) / R));
    return ((phi + Math.asin(ratio)) * 180) / Math.PI;
  };
  return Math.max(oneWay(halfA, halfB), oneWay(halfB, halfA));
}

function buildEdgePoints(edge: CityEdgeDef, nodeMap: Map<string, CityNodeDef>): [number, number][] {
  const nFrom = nodeMap.get(edge.from);
  const nTo = nodeMap.get(edge.to);
  if (!nFrom || !nTo) return [];
  const pts: [number, number][] = [[nFrom.x, nFrom.z]];
  if (edge.waypoints && edge.waypoints.length > 0) {
    for (const wp of edge.waypoints) pts.push([wp[0], wp[1]]);
  }
  pts.push([nTo.x, nTo.z]);
  return pts;
}

function polylineLen(pts: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return total;
}

/** Tính chiều dài đoạn thẳng liên tục (cùng phương <= 0.5°) tính từ đầu mút của polyline */
function straightLeadInLength(pts: [number, number][], fromEnd: 'from' | 'to'): number {
  if (pts.length < 2) return 0;
  const ordered = fromEnd === 'from' ? pts : pts.slice().reverse();
  const dx0 = ordered[1][0] - ordered[0][0];
  const dz0 = ordered[1][1] - ordered[0][1];
  const len0 = Math.hypot(dx0, dz0);
  if (len0 < 1e-6) return 0;
  const ux0 = dx0 / len0;
  const uz0 = dz0 / len0;
  let totalStraight = len0;
  for (let i = 2; i < ordered.length; i++) {
    const dx = ordered[i][0] - ordered[i - 1][0];
    const dz = ordered[i][1] - ordered[i - 1][1];
    const segLen = Math.hypot(dx, dz);
    if (segLen < 1e-6) continue;
    const dot = (dx / segLen) * ux0 + (dz / segLen) * uz0;
    const angleDeg = (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI;
    if (angleDeg <= 0.5) {
      totalStraight += segLen;
    } else {
      break;
    }
  }
  return totalStraight;
}

export interface CityValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Kiểm tra toàn bộ ràng buộc hình học & cấu trúc của CityDefinition trước khi sinh GameMap:
 * 1. Góc tại nút 4 nhánh: chỉ góc 90° (dung sai theo hàm ngưỡng θ_min(h_A, h_B)); nút 3 nhánh: mọi góc kề >= 90° và >= θ_min(h_A, h_B).
 * 2. Chiều dài cạnh L >= 40m (hoặc >= 20m nếu là đoạn taper tại nút bậc 2).
 * 3. Độ lệch bề rộng ΔW <= 1.0m tại nút (hoặc nhánh hẹp khai báo trong crosswalkEdges).
 * 4. Đoạn chuyển tiếp bề rộng (taper) tại nút bậc 2 có L >= 20m và ΔW <= 1.0m.
 * 5. Mỗi cạnh có >= 20m đoạn thẳng dẫn ở mỗi đầu mút để khóa tiếp tuyến tại nút.
 */
export function validateCity(city: CityDefinition): CityValidationResult {
  const errors: string[] = [];
  const nodeMap = new Map<string, CityNodeDef>();

  for (const n of city.nodes) {
    if (nodeMap.has(n.id)) {
      errors.push(`[DUPLICATE_NODE] Node "${n.id}" is declared multiple times.`);
    }
    nodeMap.set(n.id, n);
  }

  const edgeMap = new Map<string, CityEdgeDef>();
  const edgePtsMap = new Map<string, [number, number][]>();
  const edgeLenMap = new Map<string, number>();

  for (const e of city.edges) {
    if (edgeMap.has(e.id)) {
      errors.push(`[DUPLICATE_EDGE] Edge "${e.id}" is declared multiple times.`);
    }
    edgeMap.set(e.id, e);
    if (!ROAD_PROFILES[e.profile]) {
      errors.push(`[UNKNOWN_PROFILE] Edge "${e.id}" uses unknown profile "${String(e.profile)}".`);
      continue;
    }
    const nFrom = nodeMap.get(e.from);
    const nTo = nodeMap.get(e.to);
    if (!nFrom || !nTo) {
      errors.push(`[MISSING_NODE] Edge "${e.id}" references missing node "${!nFrom ? e.from : e.to}".`);
      continue;
    }
    const pts = buildEdgePoints(e, nodeMap);
    edgePtsMap.set(e.id, pts);
    const L = polylineLen(pts);
    edgeLenMap.set(e.id, L);

    // Kiểm tra chiều dài cạnh: cạnh thường L >= 40m, cạnh taper L >= 20m
    if (e.isTaper) {
      if (L < 20.0 - 1e-6) {
        errors.push(
          `[TAPER_TOO_SHORT] Edge "${e.id}" (${e.from} -> ${e.to}): taper length L = ${L.toFixed(2)}m < minimum 20.00m.`
        );
      }
    } else if (L < 40.0 - 1e-6) {
      errors.push(
        `[EDGE_TOO_SHORT] Edge "${e.id}" (${e.from} -> ${e.to}): length L = ${L.toFixed(2)}m < minimum 40.00m.`
      );
    }

    // Kiểm tra >= 20m thẳng ở mỗi đầu mút để khóa tiếp tuyến tại nút
    const leadFrom = straightLeadInLength(pts, 'from');
    const leadTo = straightLeadInLength(pts, 'to');
    if (leadFrom < 20.0 - 1e-6) {
      errors.push(
        `[CURVED_AT_NODE] Edge "${e.id}" at node "${e.from}": straight lead-in is ${leadFrom.toFixed(2)}m < minimum 20.00m (tangent not locked).`
      );
    }
    if (leadTo < 20.0 - 1e-6) {
      errors.push(
        `[CURVED_AT_NODE] Edge "${e.id}" at node "${e.to}": straight lead-in is ${leadTo.toFixed(2)}m < minimum 20.00m (tangent not locked).`
      );
    }
  }

  // Kiểm tra tại từng nút
  for (const node of city.nodes) {
    interface ArmInfo {
      edge: CityEdgeDef;
      dirX: number;
      dirZ: number;
      angleRad: number;
      widthM: number;
      halfM: number;
      lenM: number;
    }
    const arms: ArmInfo[] = [];
    for (const e of city.edges) {
      const pts = edgePtsMap.get(e.id);
      if (!pts || pts.length < 2) continue;
      if (e.from === node.id) {
        const dx = pts[1][0] - pts[0][0];
        const dz = pts[1][1] - pts[0][1];
        const l = Math.hypot(dx, dz) || 1;
        const w = profileFullWidth(e.profile);
        arms.push({
          edge: e,
          dirX: dx / l,
          dirZ: dz / l,
          angleRad: Math.atan2(dz / l, dx / l),
          widthM: w,
          halfM: w / 2,
          lenM: edgeLenMap.get(e.id) ?? l
        });
      } else if (e.to === node.id) {
        const dx = pts[pts.length - 2][0] - pts[pts.length - 1][0];
        const dz = pts[pts.length - 2][1] - pts[pts.length - 1][1];
        const l = Math.hypot(dx, dz) || 1;
        const w = profileFullWidth(e.profile);
        arms.push({
          edge: e,
          dirX: dx / l,
          dirZ: dz / l,
          angleRad: Math.atan2(dz / l, dx / l),
          widthM: w,
          halfM: w / 2,
          lenM: edgeLenMap.get(e.id) ?? l
        });
      }
    }

    if (arms.length < 2) continue;
    arms.sort((a, b) => a.angleRad - b.angleRad);

    // Nút bậc 2 (chuyển tiếp bề rộng / taper hoặc mid-block zebra)
    if (arms.length === 2) {
      const a0 = arms[0];
      const a1 = arms[1];
      const dot = a0.dirX * a1.dirX + a0.dirZ * a1.dirZ;
      const angleDeg = (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI;
      if (Math.abs(180 - angleDeg) > 1.0) {
        errors.push(
          `[DEGREE2_NOT_STRAIGHT] Node "${node.id}" (2-way) between edges "${a0.edge.id}" and "${a1.edge.id}": angle θ = ${angleDeg.toFixed(2)}° != 180.00°.`
        );
      }
      const dW = Math.abs(a0.widthM - a1.widthM);
      const minLen = Math.min(a0.lenM, a1.lenM);
      if (dW > 1.0 + 1e-6 || (dW > 1e-3 && minLen < 20.0 - 1e-6)) {
        errors.push(
          `[INVALID_TAPER] Node "${node.id}" between edges "${a0.edge.id}" (${a0.widthM.toFixed(2)}m) and "${a1.edge.id}" (${a1.widthM.toFixed(2)}m): width step ΔW = ${dW.toFixed(2)}m (max 1.00m) with segment length L = ${minLen.toFixed(2)}m (min 20.00m).`
        );
      }
      continue;
    }

    // Nút bậc 3 hoặc bậc 4
    const cwSet = new Set(node.crosswalkEdges ?? []);
    for (let i = 0; i < arms.length; i++) {
      const armA = arms[i];
      const armB = arms[(i + 1) % arms.length];
      let diffRad = armB.angleRad - armA.angleRad;
      if (diffRad <= 0) diffRad += Math.PI * 2;
      const thetaDeg = (diffRad * 180) / Math.PI;
      const thetaMinDeg = computeMinSafeAngleDeg(armA.halfM, armB.halfM);
      const dW = Math.abs(armA.widthM - armB.widthM);
      const narrowerId = armA.widthM <= armB.widthM ? armA.edge.id : armB.edge.id;
      const hasCrosswalkOnNarrow = cwSet.has(narrowerId);

      // Kiểm tra ΔW <= 1.0m (trừ khi nhánh hẹp có khai báo trong crosswalkEdges)
      if (dW > 1.0 + 1e-6 && !hasCrosswalkOnNarrow) {
        errors.push(
          `[WIDTH_JUMP_EXCEEDED] Node "${node.id}" between edges "${armA.edge.id}" (${armA.widthM.toFixed(2)}m) and "${armB.edge.id}" (${armB.widthM.toFixed(2)}m): ΔW = ${dW.toFixed(2)}m > maximum 1.00m without crosswalk on narrower edge "${narrowerId}".`
        );
      }

      if (arms.length === 4) {
        // Nút 4 nhánh: chỉ góc 90° (dung sai hình học <= 0.5° và phải >= θ_min(h_A, h_B))
        const devFrom90 = Math.abs(90.0 - thetaDeg);
        if (devFrom90 > 0.5 || (!hasCrosswalkOnNarrow && thetaDeg < thetaMinDeg - 1e-6)) {
          errors.push(
            `[INVALID_4WAY_ANGLE] Node "${node.id}" (4-way) between edges "${armA.edge.id}" and "${armB.edge.id}": angle θ = ${thetaDeg.toFixed(2)}° violates 4-way 90.00° rule (formula θ_min = ${thetaMinDeg.toFixed(2)}°).`
          );
        }
      } else if (arms.length === 3) {
        // Nút 3 nhánh: mọi góc kề >= 90° và >= θ_min(h_A, h_B)
        const reqMin = hasCrosswalkOnNarrow ? 90.0 : Math.max(90.0, thetaMinDeg);
        if (thetaDeg < reqMin - 0.5) {
          errors.push(
            `[ANGLE_TOO_ACUTE] Node "${node.id}" (3-way) between edges "${armA.edge.id}" and "${armB.edge.id}": angle θ = ${thetaDeg.toFixed(2)}° < required minimum ${reqMin.toFixed(2)}° (formula θ_min = ${thetaMinDeg.toFixed(2)}°).`
          );
        }
      } else {
        errors.push(
          `[UNSUPPORTED_DEGREE] Node "${node.id}" has ${arms.length} arms; only 2, 3, or 4 arms are supported.`
        );
      }
    }
  }

  // 6. Ràng buộc Mặt nước (Waters) & Cầu (Bridges)
  for (const w of city.waters ?? []) {
    if (!w.id) errors.push(`[INVALID_WATER] Water body missing id.`);
    if (w.width <= 0) errors.push(`[INVALID_WATER] Water body "${w.id}" has invalid width ${w.width}.`);
    if (w.points.length < 2) errors.push(`[INVALID_WATER] Water body "${w.id}" has fewer than 2 points.`);

    // Không nút giao nào bị ngập trong nước (nút cách tim sông >= width / 2 + 5.0m)
    for (const n of city.nodes) {
      const d = distPointToPolyline2D(n.x, n.z, w.points);
      const safeDist = w.width / 2 + 5.0;
      if (d < safeDist) {
        errors.push(
          `[NODE_IN_WATER] Node "${n.id}" (${n.x}, ${n.z}) is within ${d.toFixed(2)}m of water "${w.id}" (minimum clearance ${safeDist.toFixed(2)}m).`
        );
      }
    }
  }

  // Cạnh đánh dấu bridge: true phải thực sự cắt qua một mặt nước; và ngược lại cạnh cắt qua nước phải khai báo bridge: true
  for (const e of city.edges) {
    const pts = edgePtsMap.get(e.id);
    if (!pts) continue;
    let crossesWater = false;
    let crossedWaterId = '';
    for (const w of city.waters ?? []) {
      if (polylinesIntersect2D(pts, w.points)) {
        crossesWater = true;
        crossedWaterId = w.id;
        break;
      }
    }
    if (e.bridge && !crossesWater) {
      errors.push(`[BRIDGE_WITHOUT_WATER] Edge "${e.id}" is marked bridge: true but does not cross any water polyline.`);
    } else if (!e.bridge && crossesWater) {
      errors.push(`[WATER_CROSSING_NOT_BRIDGE] Edge "${e.id}" crosses water "${crossedWaterId}" but bridge: true is missing.`);
    }
  }

  // 7. Ràng buộc Công viên (Parks)
  for (const p of city.parks ?? []) {
    if (!p.id) errors.push(`[INVALID_PARK] Park missing id.`);
    if (p.points.length < 3) errors.push(`[INVALID_PARK] Park "${p.id}" has fewer than 3 vertices.`);
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidCity(city: CityDefinition): void {
  const res = validateCity(city);
  if (!res.valid) {
    throw new Error(`[cityGenerator] Invalid CityDefinition "${city.name}":\n- ${res.errors.join('\n- ')}`);
  }
}

function deterministicRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distPointToPolyline2D(px: number, pz: number, pts: [number, number][]): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1][0];
    const az = pts[i - 1][1];
    const vx = pts[i][0] - ax;
    const vz = pts[i][1] - az;
    const l2 = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / l2));
    const d = Math.hypot(px - (ax + t * vx), pz - (az + t * vz));
    if (d < best) best = d;
  }
  return best;
}

export function isPointInsidePolygon2D(x: number, z: number, poly: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function segmentsIntersect2D(
  p0x: number,
  p0z: number,
  p1x: number,
  p1z: number,
  p2x: number,
  p2z: number,
  p3x: number,
  p3z: number
): boolean {
  if (Math.max(p0x, p1x) < Math.min(p2x, p3x) - 1e-6 || Math.min(p0x, p1x) > Math.max(p2x, p3x) + 1e-6) return false;
  if (Math.max(p0z, p1z) < Math.min(p2z, p3z) - 1e-6 || Math.min(p0z, p1z) > Math.max(p2z, p3z) + 1e-6) return false;
  const ccw = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number) =>
    (cz - az) * (bx - ax) - (cx - ax) * (bz - az);
  const c1 = ccw(p0x, p0z, p1x, p1z, p2x, p2z);
  const c2 = ccw(p0x, p0z, p1x, p1z, p3x, p3z);
  const c3 = ccw(p2x, p2z, p3x, p3z, p0x, p0z);
  const c4 = ccw(p2x, p2z, p3x, p3z, p1x, p1z);
  return (
    ((c1 >= -1e-6 && c2 <= 1e-6) || (c1 <= 1e-6 && c2 >= -1e-6)) &&
    ((c3 >= -1e-6 && c4 <= 1e-6) || (c3 <= 1e-6 && c4 >= -1e-6))
  );
}

export function polylinesIntersect2D(polyA: Array<[number, number]>, polyB: Array<[number, number]>): boolean {
  for (let i = 1; i < polyA.length; i++) {
    const [a0x, a0z] = polyA[i - 1];
    const [a1x, a1z] = polyA[i];
    for (let j = 1; j < polyB.length; j++) {
      const [b0x, b0z] = polyB[j - 1];
      const [b1x, b1z] = polyB[j];
      if (segmentsIntersect2D(a0x, a0z, a1x, a1z, b0x, b0z, b1x, b1z)) return true;
    }
  }
  return false;
}

function pointAndTangentAtS(
  pts: [number, number][],
  s: number
): { x: number; z: number; heading: number; rx: number; rz: number } {
  let rem = Math.max(0, s);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const seg = Math.hypot(x1 - x0, z1 - z0);
    if (rem <= seg || i === pts.length - 2) {
      const t = seg > 0 ? Math.min(1, rem / seg) : 0;
      const heading = Math.atan2(x1 - x0, z1 - z0);
      const fx = Math.sin(heading);
      const fz = Math.cos(heading);
      return {
        x: x0 + (x1 - x0) * t,
        z: z0 + (z1 - z0) * t,
        heading,
        rx: -fz,
        rz: fx
      };
    }
    rem -= seg;
  }
  const [x0, z0] = pts[pts.length - 2];
  const [x1, z1] = pts[pts.length - 1];
  const heading = Math.atan2(x1 - x0, z1 - z0);
  return { x: x1, z: z1, heading, rx: -Math.cos(heading), rz: Math.sin(heading) };
}

function templateToRule(template: IntersectionTemplateId): IntersectionRule {
  switch (template) {
    case 'T1_RVL_4WAY':
      return 'right_before_left';
    case 'T2_T_JUNCTION_PRIOR':
      return 'priority_road';
    case 'T3_STOP_CROSSING':
      return 'stop';
    case 'T4_AMPEL_4WAY':
      return 'traffic_light';
    case 'T5_KREISVERKEHR':
      return 'roundabout';
    case 'T6_ZEBRA_MIDBLOCK':
      return 'priority_road';
  }
}

export interface GenerateCityOptions {
  /** Cờ tính năng (feature flag): Loại bỏ toàn bộ mặt nước, cầu và công viên để chạy chế độ 5C-1 thuần túy */
  excludeWaterParks?: boolean;
}

/**
 * Sinh GameMap v1 tất định (deterministic) từ CityDefinition đã qua kiểm tra validateCity().
 * Thứ tự sinh:
 *   1. Nodes & Roads (từ RoadProfile + ưu tiên của IntersectionTemplate)
 *   2. Intersections & Signs (từ một nguồn duy nhất: IntersectionTemplate + RoadProfile)
 *   3. Buildings theo lot dọc đường SAU khi đường & biển báo đã cố định, kiểm tra va chạm đường + nước
 *   4. Props (street_lamp, tree) trên vỉa hè SAU khi nhà & biển đã cố định, kiểm tra khoảng cách an toàn
 */
export function generateCityMap(city: CityDefinition, options?: GenerateCityOptions): GameMap {
  const effectiveCity: CityDefinition = options?.excludeWaterParks
    ? {
        ...city,
        waters: [],
        parks: [],
        edges: city.edges.map((e) => ({ ...e, bridge: undefined }))
      }
    : city;

  assertValidCity(effectiveCity);

  const nodeMap = new Map<string, CityNodeDef>();
  for (const n of effectiveCity.nodes) nodeMap.set(n.id, n);

  const nodes: MapNode[] = effectiveCity.nodes.map((n) => ({
    id: n.id,
    x: n.x,
    z: n.z,
    type: n.kind
  }));

  // Xác định priority cho mỗi cạnh từ template của các nút nối với nó + priorityOverride
  const computedPriority = new Map<string, PriorityType>();
  for (const e of effectiveCity.edges) {
    const prof = ROAD_PROFILES[e.profile];
    let prio: PriorityType = e.priorityOverride ?? prof.defaultPriority;
    if (!e.priorityOverride) {
      for (const endNodeId of [e.from, e.to]) {
        const nd = nodeMap.get(endNodeId);
        if (!nd || nd.kind !== 'intersection' || !nd.template) continue;
        const prioSet = new Set(nd.priorityEdges ?? []);
        if (nd.template === 'T1_RVL_4WAY') {
          prio = 'equal';
        } else if (nd.template === 'T2_T_JUNCTION_PRIOR') {
          prio = prioSet.has(e.id) ? 'main' : 'give_way';
        } else if (nd.template === 'T3_STOP_CROSSING') {
          prio = prioSet.has(e.id) ? 'main' : 'stop';
        } else if (nd.template === 'T4_AMPEL_4WAY') {
          prio = prioSet.has(e.id) ? 'main' : prof.defaultPriority;
        } else if (nd.template === 'T5_KREISVERKEHR') {
          prio = 'give_way';
        } else if (nd.template === 'T6_ZEBRA_MIDBLOCK') {
          prio = 'main';
        }
      }
    }
    computedPriority.set(e.id, prio);
  }

  const roads: Array<MapRoad & { name: string; bridge?: boolean }> = effectiveCity.edges.map((e) => {
    const prof = ROAD_PROFILES[e.profile];
    const pts = buildEdgePoints(e, nodeMap);
    return {
      id: e.id,
      name: e.name,
      from: e.from,
      to: e.to,
      points: pts,
      lanesForward: prof.lanesForward,
      lanesBackward: prof.lanesBackward,
      laneWidth: prof.laneWidth,
      sidewalk: { ...prof.sidewalk },
      bikeLane: { ...prof.bikeLane },
      parking: e.parkingOverride ? { ...e.parkingOverride } : { ...prof.parking },
      speedLimit: prof.speedLimit,
      priority: computedPriority.get(e.id) ?? prof.defaultPriority,
      surface: prof.surface,
      ...(e.bridge ? { bridge: true } : {})
    };
  });

  const roadByIdMap = new Map<string, MapRoad>();
  for (const r of roads) roadByIdMap.set(r.id, r);

  // 2. Sinh Intersections & Signs từ cùng một nguồn (Template + Profile)
  const intersections: MapIntersection[] = [];
  const signs: MapSign[] = [];
  const signKeys = new Set<string>();

  const addSignUnique = (sg: MapSign) => {
    const key = `${sg.roadId}|${sg.type}|${sg.side}|${Boolean(sg.flip)}|${Math.round(sg.s)}`;
    if (signKeys.has(key)) return;
    signKeys.add(key);
    signs.push(sg);
  };

  /** Đặt biển cho luồng xe ĐANG TIẾN VÀO nút nodeId ở khoảng cách distFromNode */
  const addApproachSign = (road: MapRoad, nodeId: string, distFromNode: number, type: string, value?: number) => {
    const L = roadLength(road);
    if (L < distFromNode + 8) return;
    if (road.to === nodeId && road.lanesForward > 0) {
      addSignUnique({
        type,
        roadId: road.id,
        s: Number((L - distFromNode).toFixed(2)),
        side: 'right',
        ...(value !== undefined ? { value } : {})
      });
    } else if (road.from === nodeId && road.lanesBackward > 0) {
      addSignUnique({
        type,
        roadId: road.id,
        s: Number(distFromNode.toFixed(2)),
        side: 'left',
        flip: true,
        ...(value !== undefined ? { value } : {})
      });
    }
  };

  /** Đặt biển cho luồng xe VỪA RỜI KHỎI nút nodeId ở khoảng cách distFromNode */
  const addDepartureSign = (road: MapRoad, nodeId: string, distFromNode: number, type: string, value?: number) => {
    const L = roadLength(road);
    if (L < distFromNode + 8) return;
    if (road.from === nodeId && road.lanesForward > 0) {
      addSignUnique({
        type,
        roadId: road.id,
        s: Number(distFromNode.toFixed(2)),
        side: 'right',
        ...(value !== undefined ? { value } : {})
      });
    } else if (road.to === nodeId && road.lanesBackward > 0) {
      addSignUnique({
        type,
        roadId: road.id,
        s: Number((L - distFromNode).toFixed(2)),
        side: 'left',
        flip: true,
        ...(value !== undefined ? { value } : {})
      });
    }
  };

  for (const nd of city.nodes) {
    if (nd.kind !== 'intersection') continue;
    const tpl: IntersectionTemplateId = nd.template ?? 'T1_RVL_4WAY';
    const connectedRoads = roads.filter((r) => r.from === nd.id || r.to === nd.id);
    const prioSet = new Set(nd.priorityEdges ?? []);

    // Quy tắc R-FGÜ 2001 (Sửa nhỏ #3): KHÔNG đặt stop line ở zebra không đèn.
    // Trong roadMarkings.ts, stopLine chỉ sinh khi trafficLight !== null hoặc rule === 'stop'.
    const crosswalks =
      nd.crosswalkEdges !== undefined
        ? [...nd.crosswalkEdges]
        : tpl === 'T6_ZEBRA_MIDBLOCK'
          ? connectedRoads.map((r) => r.id)
          : [];

    const ix: MapIntersection = {
      nodeId: nd.id,
      rule: templateToRule(tpl),
      trafficLight:
        tpl === 'T4_AMPEL_4WAY'
          ? { cycle: 'standard', greenSeconds: 14, yellowSeconds: 3, redSeconds: 12 }
          : null,
      crosswalks
    };
    intersections.push(ix);

    for (const r of connectedRoads) {
      const isMain = prioSet.has(r.id) || r.priority === 'main';
      if (tpl === 'T1_RVL_4WAY') {
        addApproachSign(r, nd.id, 15, '102');
      } else if (tpl === 'T2_T_JUNCTION_PRIOR') {
        if (isMain) {
          addApproachSign(r, nd.id, 16, '306');
        } else {
          addApproachSign(r, nd.id, 13, '205');
        }
      } else if (tpl === 'T3_STOP_CROSSING') {
        if (isMain) {
          addApproachSign(r, nd.id, 16, '306');
        } else {
          addApproachSign(r, nd.id, 13, '206');
        }
      } else if (tpl === 'T4_AMPEL_4WAY') {
        if (isMain) {
          addApproachSign(r, nd.id, 15, '306');
        } else {
          addApproachSign(r, nd.id, 15, '205');
        }
      } else if (tpl === 'T5_KREISVERKEHR') {
        addApproachSign(r, nd.id, 15, '215');
        addApproachSign(r, nd.id, 14, '205');
      } else if (tpl === 'T6_ZEBRA_MIDBLOCK') {
        addApproachSign(r, nd.id, 12, '350');
        addApproachSign(r, nd.id, 18, '306');
      }

      // Biển tốc độ Z.274 khi vào nhánh mới từ nút giao
      addDepartureSign(r, nd.id, 22, '274', r.speedLimit);
    }
  }

  // Biển đường một chiều Z.220 (ở đầu vào from) và Z.267 (cấm đi ngược chiều ở đầu cấm vào to) cho MỌI cạnh một chiều
  for (const r of roads) {
    if (r.lanesBackward === 0 && r.lanesForward > 0) {
      const L = roadLength(r);
      addDepartureSign(r, r.from, 12, '220');
      addSignUnique({
        type: '267',
        roadId: r.id,
        s: Number((L - 10).toFixed(2)),
        side: 'left',
        flip: true
      });
    }
  }

  // Biển đặc thù khai báo trên từng cạnh (poiSigns: VD 314 đỗ xe đích, 138 làn xe đạp, 283 trạm buýt)
  for (const e of city.edges) {
    if (!e.poiSigns) continue;
    for (const ps of e.poiSigns) {
      addSignUnique({
        type: ps.type,
        roadId: e.id,
        s: Number(ps.s.toFixed(2)),
        side: ps.side,
        ...(ps.value !== undefined ? { value: ps.value } : {}),
        ...(ps.flip ? { flip: true } : {})
      });
    }
  }

  // Biển tốc độ ở đầu xuất phát từ các nút cụt (end nodes) để xe đi từ nhánh cụt vào có đủ biển báo
  for (const nd of city.nodes) {
    if (nd.kind !== 'end') continue;
    const connectedRoads = roads.filter((r) => r.from === nd.id || r.to === nd.id);
    for (const r of connectedRoads) {
      addDepartureSign(r, nd.id, 18, '274', r.speedLimit);
      if (r.speedLimit === 30) {
        addDepartureSign(r, nd.id, 19, '274.1');
      }
    }
  }

  // Tính danh sách tọa độ thế giới (x, z) của tất cả các biển đã đặt để nhà & prop tránh đè lên
  const signPositions: Array<{ x: number; z: number }> = signs.map((sg) => {
    const r = roadByIdMap.get(sg.roadId)!;
    const pt = roadPointAt(r, sg.s);
    const half = ((r.lanesForward + r.lanesBackward) * r.laneWidth) / 2;
    const side = sg.side === 'right' ? 1 : -1;
    return {
      x: pt.x + pt.nx * side * (half + 1.2),
      z: pt.z + pt.nz * side * (half + 1.2)
    };
  });

  // 3. Sinh Buildings theo lot dọc đường SAU khi đường đã cố định, kiểm tra va chạm đường + nước
  const buildings: MapBuilding[] = [];
  const placedBuildingStrips: Array<[number, number, number, number]> = [];
  const tempMapForBuildings: GameMap = {
    version: 1,
    nodes,
    roads,
    intersections,
    signs,
    buildings,
    props: [],
    waters: effectiveCity.waters ?? [],
    parks: effectiveCity.parks ?? [],
    spawns: effectiveCity.spawns
  };

  const rand = deterministicRng(city.seed);
  const styles: Array<MapBuilding['style']> = ['altbau', 'backstein', 'neubau'];

  const buildingFootprintClear = (cand: MapBuilding): boolean => {
    const road = roadByIdMap.get(cand.roadId);
    if (!road) return false;
    const side = cand.side === 'right' ? 1 : -1;
    const half = ((road.lanesForward + road.lanesBackward) * road.laneWidth) / 2;
    const frontOff = half + 2.0;
    const backOff = frontOff + 9.0; // BUILDING_DEPTH = 9m
    const s0 = cand.s;
    const s1 = cand.s + cand.length;

    // Kiểm tra lưới điểm trong footprint nhà với mọi cạnh đường khác và mọi sông/kênh
    for (let s = s0; s <= s1 + 1e-6; s += 2.0) {
      const ss = Math.min(s1, s);
      const pt = roadPointAt(road, ss);
      for (let off = frontOff; off <= backOff + 1e-6; off += 2.0) {
        const oo = Math.min(backOff, off);
        const x = pt.x + pt.nx * side * oo;
        const z = pt.z + pt.nz * side * oo;
        for (const other of roads) {
          if (other.id === road.id) continue;
          const otherHalf = ((other.lanesForward + other.lanesBackward) * other.laneWidth) / 2;
          if (distPointToPolyline2D(x, z, other.points) < otherHalf + 3.2) {
            return false;
          }
        }
        for (const w of city.waters ?? []) {
          if (distPointToPolyline2D(x, z, w.points) < w.width / 2 + 2.5) {
            return false;
          }
        }
        for (const p of city.parks ?? []) {
          if (isPointInsidePolygon2D(x, z, p.points)) {
            return false;
          }
        }
      }
    }

    // Kiểm tra chồng lấn strip AABB với các nhà đã đặt và với vị trí biển báo
    const strips = buildingStrips(tempMapForBuildings, { ...cand, depthOff: 0 });
    if (!strips || strips.length === 0) return false;
    for (const [a, b, c, d] of strips) {
      for (const [ea, eb, ec, ed] of placedBuildingStrips) {
        if (a < ec + 0.5 && ea < c + 0.5 && b < ed + 0.5 && eb < d + 0.5) {
          return false;
        }
      }
      for (const sp of signPositions) {
        if (sp.x >= a - 0.8 && sp.x <= c + 0.8 && sp.z >= b - 0.8 && sp.z <= d + 0.8) {
          return false;
        }
      }
    }
    placedBuildingStrips.push(...strips);
    return true;
  };

  let buildingSeedCounter = (city.seed * 100 + 1) >>> 0;
  for (const road of roads) {
    if (!road.sidewalk.left && !road.sidewalk.right) continue;
    const L = roadLength(road);
    const nFrom = nodeMap.get(road.from);
    const nTo = nodeMap.get(road.to);
    const marginFrom = nFrom?.kind === 'intersection' ? 25 : 15;
    const marginTo = nTo?.kind === 'intersection' ? 25 : 15;
    const usableStart = marginFrom;
    const usableEnd = L - marginTo;
    if (usableEnd - usableStart < 26) continue;

    for (const side of ['right', 'left'] as const) {
      if (!road.sidewalk[side]) continue;
      let cursorS = usableStart;
      while (usableEnd - cursorS >= 26) {
        const lotLen = Math.min(34, usableEnd - cursorS);
        const style = styles[Math.floor(rand() * styles.length)];
        const floors = 3 + Math.floor(rand() * 3); // 3..5 tầng
        const cand: MapBuilding = {
          roadId: road.id,
          side,
          s: Number(cursorS.toFixed(2)),
          length: Number(lotLen.toFixed(2)),
          floors,
          style,
          seed: buildingSeedCounter++
        };
        if (buildingFootprintClear(cand)) {
          buildings.push(cand);
        }
        cursorS += lotLen + 6;
      }
    }
  }

  // 4. Sinh Props (street_lamp, tree, và poiProps) dọc vỉa hè SAU khi đường, nhà, biển đã cố định
  const props: MapProp[] = [];
  const propPositions: Array<{ x: number; z: number }> = [];

  const canPlaceProp = (road: MapRoad, s: number, side: 'left' | 'right', type: MapProp['type']): boolean => {
    const pt = roadPointAt(road, s);
    const half = ((road.lanesForward + road.lanesBackward) * road.laneWidth) / 2;
    const off = type === 'street_lamp' ? half + 0.55 : half + 1.2;
    const sideSign = side === 'right' ? 1 : -1;
    const x = pt.x + pt.nx * sideSign * off;
    const z = pt.z + pt.nz * sideSign * off;

    // Không nằm trong lòng đường hoặc sát mép đường của bất kỳ nhánh giao cắt nào
    for (const other of roads) {
      if (other.id === road.id) continue;
      const otherHalf = ((other.lanesForward + other.lanesBackward) * other.laneWidth) / 2;
      if (distPointToPolyline2D(x, z, other.points) < otherHalf + 2.8) {
        return false;
      }
    }
    // Không rơi xuống nước
    for (const w of city.waters ?? []) {
      if (distPointToPolyline2D(x, z, w.points) < w.width / 2 + 1.5) {
        return false;
      }
    }
    // Không nằm trong đa giác công viên (giữ công viên làm mảng xanh thoáng)
    for (const p of city.parks ?? []) {
      if (isPointInsidePolygon2D(x, z, p.points)) {
        return false;
      }
    }
    // Không đè lên biển báo hoặc prop khác
    for (const sp of signPositions) {
      if (Math.hypot(x - sp.x, z - sp.z) < 2.5) return false;
    }
    for (const pp of propPositions) {
      if (Math.hypot(x - pp.x, z - pp.z) < 4.0) return false;
    }
    propPositions.push({ x, z });
    return true;
  };

  // Đặt các prop đặc thù theo POI trước (VD: parkscheinautomat tại bãi đỗ đích, bench tại trạm buýt)
  for (const e of city.edges) {
    if (!e.poiProps) continue;
    const r = roadByIdMap.get(e.id);
    if (!r) continue;
    for (const pp of e.poiProps) {
      if (canPlaceProp(r, pp.s, pp.side, pp.type)) {
        props.push({
          type: pp.type,
          roadId: e.id,
          s: Number(pp.s.toFixed(2)),
          side: pp.side
        });
      }
    }
  }

  for (const road of roads) {
    if (!road.sidewalk.left && !road.sidewalk.right) continue;
    const L = roadLength(road);
    const startS = 22;
    const endS = L - 22;
    if (endS <= startS) continue;

    let stepIdx = 0;
    for (let s = startS; s <= endS; s += 16) {
      const side: 'left' | 'right' = stepIdx % 2 === 0 ? 'right' : 'left';
      const altSide: 'left' | 'right' = side === 'right' ? 'left' : 'right';
      if (road.sidewalk[side] && canPlaceProp(road, s, side, 'street_lamp')) {
        props.push({
          type: 'street_lamp',
          roadId: road.id,
          s: Number(s.toFixed(2)),
          side
        });
      }
      if (road.sidewalk[altSide] && canPlaceProp(road, s, altSide, 'tree')) {
        props.push({
          type: 'tree',
          roadId: road.id,
          s: Number(s.toFixed(2)),
          side: altSide
        });
      }
      stepIdx++;
    }
  }

  return {
    version: 1,
    nodes,
    roads,
    intersections,
    signs,
    buildings,
    props,
    waters: effectiveCity.waters ?? [],
    parks: effectiveCity.parks ?? [],
    spawns: effectiveCity.spawns
  };
}

/**
 * Mini-map 3 nút giao chuẩn Đức (Bước 5B):
 *   1. n_rvl   (0, 0)   — T1_RVL_4WAY: Ngã tư đồng cấp Rechts-vor-links 4 nhánh (Tempo 30)
 *   2. n_t     (0, 100) — T2_T_JUNCTION_PRIOR: Ngã ba chữ T Vorfahrtstraße + nhánh phụ nhường đường
 *   3. n_ampel (0, 200) — T4_AMPEL_4WAY: Ngã tư đèn tín hiệu Ampelkreuzung 4 nhánh
 */
export const MINI_CITY_3_NODES: CityDefinition = {
  version: 1,
  name: 'de-mini-3nodes-v1',
  seed: 20261115,
  nodes: [
    // 3 nút giao chính dọc trục Nam -> Bắc (x = 0, z = 0 -> 100 -> 200)
    {
      id: 'n_rvl',
      x: 0,
      z: 0,
      kind: 'intersection',
      template: 'T1_RVL_4WAY'
    },
    {
      id: 'n_t',
      x: 0,
      z: 100,
      kind: 'intersection',
      template: 'T2_T_JUNCTION_PRIOR',
      priorityEdges: ['r_rvl_t', 'r_t_ampel']
    },
    {
      id: 'n_ampel',
      x: 0,
      z: 200,
      kind: 'intersection',
      template: 'T4_AMPEL_4WAY',
      priorityEdges: ['r_t_ampel', 'r_ampel_n'],
      crosswalkEdges: ['r_t_ampel', 'r_ampel_w']
    },

    // Các nút đầu nhánh phụ (chiều dài mỗi nhánh 90m >= 40m, góc đúng 90°)
    { id: 'n_south_end', x: 0, z: -90, kind: 'end' },
    { id: 'n_rvl_west', x: 90, z: 0, kind: 'end' },
    { id: 'n_rvl_east', x: -90, z: 0, kind: 'end' },
    { id: 'n_t_east', x: -90, z: 100, kind: 'end' },
    { id: 'n_ampel_west', x: 90, z: 200, kind: 'end' },
    { id: 'n_ampel_east', x: -90, z: 200, kind: 'end' },
    { id: 'n_north_end', x: 0, z: 290, kind: 'end' }
  ],
  edges: [
    // Trục chính Nam -> Bắc qua cả 3 nút giao
    {
      id: 'r_south_rvl',
      name: 'Goethestraße Süd',
      from: 'n_south_end',
      to: 'n_rvl',
      profile: 'wohnstrasse_30'
    },
    {
      id: 'r_rvl_t',
      name: 'Goethestraße Mitte',
      from: 'n_rvl',
      to: 'n_t',
      profile: 'wohnstrasse_30',
      priorityOverride: 'main'
    },
    {
      id: 'r_t_ampel',
      name: 'Lessingstraße',
      from: 'n_t',
      to: 'n_ampel',
      profile: 'sammelstrasse_rad_50'
    },
    {
      id: 'r_ampel_n',
      name: 'Lessingstraße Nord',
      from: 'n_ampel',
      to: 'n_north_end',
      profile: 'sammelstrasse_rad_50'
    },

    // Nhánh ngang tại n_rvl (T1_RVL_4WAY, tất cả 7.0m, góc 90°)
    {
      id: 'r_rvl_w',
      name: 'Schillerstraße West',
      from: 'n_rvl_west',
      to: 'n_rvl',
      profile: 'wohnstrasse_30'
    },
    {
      id: 'r_rvl_e',
      name: 'Schillerstraße Ost',
      from: 'n_rvl',
      to: 'n_rvl_east',
      profile: 'wohnstrasse_30'
    },

    // Nhánh phụ tại n_t (T2_T_JUNCTION_PRIOR, 7.0m giao trục chính 7.0m/7.5m -> ΔW = 0.5m <= 1.0m)
    {
      id: 'r_t_e',
      name: 'Kantstraße',
      from: 'n_t_east',
      to: 'n_t',
      profile: 'wohnstrasse_30'
    },

    // Nhánh ngang tại n_ampel (T4_AMPEL_4WAY, 8.0m giao trục 7.5m -> ΔW = 0.5m <= 1.0m)
    {
      id: 'r_ampel_w',
      name: 'Bahnhofstraße West',
      from: 'n_ampel_west',
      to: 'n_ampel',
      profile: 'gewerbestrasse_bus_50'
    },
    {
      id: 'r_ampel_e',
      name: 'Bahnhofstraße Ost',
      from: 'n_ampel',
      to: 'n_ampel_east',
      profile: 'gewerbestrasse_bus_50'
    }
  ],
  waters: [
    {
      id: 'w_kanal_sued',
      name: 'Stadtkanal',
      width: 24,
      points: [
        [-140, -140],
        [140, -140]
      ]
    }
  ],
  parks: [
    {
      id: 'p_goethepark',
      name: 'Goethepark',
      points: [
        [25, 25],
        [80, 25],
        [80, 80],
        [25, 80]
      ]
    }
  ],
  spawns: {
    player: {
      roadId: 'r_south_rvl',
      s: 20, // Xuất phát tại (0, -70), đi thẳng hướng Bắc (+Z) qua cả 3 nút n_rvl -> n_t -> n_ampel
      lane: 0
    }
  }
};

/**
 * Khu phố thi sát hạch 18 nút chuẩn Đức (Bước 5C-1 — chưa có nước/cầu/công viên):
 * Phủ kín toàn bộ tình huống CITY_DESIGN.md mục 4E:
 *   - Rechts-vor-links 4 nhánh (n02_rvl — T1_RVL_4WAY)
 *   - Vạch người đi bộ giữa đoạn không đèn, 0 stop line (n03_zebra, n18_uni_park — T6_ZEBRA_MIDBLOCK)
 *   - Trạm xe buýt + làn xe đạp (r03_to_ampel — sammelstrasse_rad_50)
 *   - 3 nút giao có đèn tín hiệu (n04_ampel, n09_ampel_east, n10_land_gate — T4_AMPEL_4WAY)
 *   - Cửa ngõ ngoại ô Landstraße 70 km/h (r19_land_west, r20_land_east — landstrasse_70)
 *   - Đường một chiều 30 km/h với cặp biển 220 / 267 (r14a_oneway_in, r14b_oneway_out — einbahnstrasse_30)
 *   - Giao lộ biển STOP 206 vào trục ưu tiên 306 (n05_stop — T3_STOP_CROSSING)
 *   - Vòng xuyến 215 + 205 (n06_round — T5_KREISVERKEHR)
 *   - Bãi đỗ xe về đích 314 + Parkscheinautomat (r06a_round_to_park / n18_uni_park)
 *   - 3 đoạn đường cong giữa hai nút (r20_land_east, r19_land_west, r12_south_loop) khóa tiếp tuyến >= 26m tại đầu nút
 */
export const CITY_18_NODES: CityDefinition = {
  version: 1,
  name: 'de-pruefungsstadt-18nodes-v1',
  seed: 20260501,
  nodes: [
    // 1. n01_start (0, -20) — Ngã ba xuất phát / khép vòng phía Nam (90°/90°/180°)
    {
      id: 'n01_start',
      x: 0,
      z: -20,
      kind: 'intersection',
      template: 'T2_T_JUNCTION_PRIOR',
      priorityEdges: ['r01_start', 'r17_south_stub']
    },
    // 2. n02_rvl (0, 100) — Ngã tư đồng cấp Rechts-vor-links 4 nhánh 90°
    {
      id: 'n02_rvl',
      x: 0,
      z: 100,
      kind: 'intersection',
      template: 'T1_RVL_4WAY'
    },
    // 3. n03_zebra (0, 190) — Vạch qua đường người đi bộ giữa đoạn (FGÜ, 0 stop line)
    {
      id: 'n03_zebra',
      x: 0,
      z: 190,
      kind: 'intersection',
      template: 'T6_ZEBRA_MIDBLOCK',
      crosswalkEdges: ['r02_to_zebra', 'r03_to_ampel']
    },
    // 4. n04_ampel (0, 280) — Ngã tư Đèn tín hiệu trung tâm 4 nhánh 90° (Ampel #1)
    {
      id: 'n04_ampel',
      x: 0,
      z: 280,
      kind: 'intersection',
      template: 'T4_AMPEL_4WAY',
      priorityEdges: ['r03_to_ampel', 'r10_to_land'],
      crosswalkEdges: ['r03_to_ampel', 'r04_to_stop', 'r09_ampel_east', 'r10_to_land']
    },
    // 5. n05_stop (-130, 280) — Ngã tư STOP (206) cắt trục ưu tiên Friedrichstraße (306) 4 nhánh 90°
    {
      id: 'n05_stop',
      x: -130,
      z: 280,
      kind: 'intersection',
      template: 'T3_STOP_CROSSING',
      priorityEdges: ['r11_fried_north', 'r05_fried_main'],
      crosswalkEdges: ['r04_to_stop', 'r13_to_oneway']
    },
    // 6. n06_round (-130, 100) — Vòng xuyến 4 nhánh 90° (Kreisverkehr 215 + 205)
    {
      id: 'n06_round',
      x: -130,
      z: 100,
      kind: 'intersection',
      template: 'T5_KREISVERKEHR',
      crosswalkEdges: ['r05_fried_main', 'r06a_round_to_park']
    },
    // 7. n07_west_end (-220, 100) — Ngã ba cuối đường một chiều (90°/135°/135°, đầu cấm vào 267)
    {
      id: 'n07_west_end',
      x: -220,
      z: 100,
      kind: 'intersection',
      template: 'T2_T_JUNCTION_PRIOR',
      priorityEdges: ['r15_west_chord', 'r07_west_stub'],
      crosswalkEdges: ['r14b_oneway_out']
    },
    // 8. n08_east_end (-100, 100) — Đầu nhánh Tây/Đông tạo dòng xe cắt ngang tại n02_rvl
    {
      id: 'n08_east_end',
      x: 100,
      z: 100,
      kind: 'end'
    },
    // 9. n09_ampel_east (140, 280) — Nút giao Đèn tín hiệu phía Đông (Ampel #2, 90°/90°/180°)
    {
      id: 'n09_ampel_east',
      x: 140,
      z: 280,
      kind: 'intersection',
      template: 'T4_AMPEL_4WAY',
      priorityEdges: ['r09_ampel_east', 'r16_east_stub'],
      crosswalkEdges: ['r09_ampel_east', 'r18_land_east_conn']
    },
    // 10. n10_land_gate (0, 420) — Cửa ngõ Landstraße 70 km/h có Đèn tín hiệu (Ampel #3, 90°/90°/180°)
    {
      id: 'n10_land_gate',
      x: 0,
      z: 420,
      kind: 'intersection',
      template: 'T4_AMPEL_4WAY',
      priorityEdges: ['r20_land_east', 'r19_land_west'],
      crosswalkEdges: ['r10_to_land']
    },
    // 11. n11_oneway_in (-220, 280) — Ngã ba đầu vào đường một chiều Einbahnstraße 220 (90°/135°/135°)
    {
      id: 'n11_oneway_in',
      x: -220,
      z: 280,
      kind: 'intersection',
      template: 'T2_T_JUNCTION_PRIOR',
      priorityEdges: ['r13_to_oneway', 'r15_west_chord'],
      crosswalkEdges: ['r14a_oneway_in']
    },
    // 12. n12_oneway_mid (-265, 190) — Nút giữa hành lang đường một chiều (bậc 2 thẳng 180°)
    {
      id: 'n12_oneway_mid',
      x: -265,
      z: 190,
      kind: 'end'
    },
    // 13. n13_south_west (-65, -20) — Nút nối vòng phía Nam (bậc 2 thẳng 180°)
    {
      id: 'n13_south_west',
      x: -65,
      z: -20,
      kind: 'end'
    },
    // 14. n14_east_stub (230, 280) — Đầu cụt phía Đông ngã ba đèn n09_ampel_east
    {
      id: 'n14_east_stub',
      x: 230,
      z: 280,
      kind: 'end'
    },
    // 15. n15_land_west (-130, 370) — Nút chuyển tiếp đường cong Landstraße Tây vào Friedrichstraße (bậc 2 thẳng 180°)
    {
      id: 'n15_land_west',
      x: -130,
      z: 370,
      kind: 'end'
    },
    // 16. n16_land_east (140, 370) — Nút chuyển tiếp lên đường cong Landstraße Đông (bậc 2 thẳng 180°)
    {
      id: 'n16_land_east',
      x: 140,
      z: 370,
      kind: 'end'
    },
    // 17. n17_south_stub (0, -100) — Đầu cụt phía Nam điểm xuất phát
    {
      id: 'n17_south_stub',
      x: 0,
      z: -100,
      kind: 'end'
    },
    // 18. n18_uni_park (-65, 100) — Trạm đỗ xe về đích (Z.314) + vạch đi bộ giữa đoạn (bậc 2 thẳng 180°)
    {
      id: 'n18_uni_park',
      x: -65,
      z: 100,
      kind: 'intersection',
      template: 'T6_ZEBRA_MIDBLOCK',
      crosswalkEdges: ['r06a_round_to_park', 'r06b_park_to_rvl']
    }
  ],
  edges: [
    // 1. Đoạn xuất phát Nam -> Ngã tư Rechts-vor-links (L = 120m, Tempo 30)
    {
      id: 'r01_start',
      name: 'Georgenstraße Süd',
      from: 'n01_start',
      to: 'n02_rvl',
      profile: 'wohnstrasse_30'
    },
    // 2. Ngã tư RvL -> Vạch người đi bộ giữa đoạn n03_zebra (L = 90m, 7.0m để đồng bộ bề rộng qua n03_zebra)
    {
      id: 'r02_to_zebra',
      name: 'Georgenstraße Mitte',
      from: 'n02_rvl',
      to: 'n03_zebra',
      profile: 'sammelstrasse_rad_50'
    },
    // 3. Vạch Zebra -> Ngã tư Đèn trung tâm n04_ampel (L = 90m, Làn xe đạp + Trạm xe buýt)
    {
      id: 'r03_to_ampel',
      name: 'Georgenstraße Nord',
      from: 'n03_zebra',
      to: 'n04_ampel',
      profile: 'sammelstrasse_rad_50',
      poiSigns: [
        { type: '138', s: 28, side: 'right' },
        { type: '283', s: 46, side: 'right' }
      ],
      poiProps: [{ type: 'bench', s: 48, side: 'right' }]
    },
    // 4. Ngã tư Đèn n04_ampel -> Giao lộ STOP n05_stop (L = 130m)
    {
      id: 'r04_to_stop',
      name: 'Dorotheenstraße West',
      from: 'n04_ampel',
      to: 'n05_stop',
      profile: 'sammelstrasse_rad_50',
      priorityOverride: 'stop'
    },
    // 5. Trục ưu tiên Friedrichstraße: n05_stop -> Vòng xuyến n06_round (L = 180m)
    {
      id: 'r05_fried_main',
      name: 'Friedrichstraße Mitte',
      from: 'n05_stop',
      to: 'n06_round',
      profile: 'sammelstrasse_rad_50',
      priorityOverride: 'main'
    },
    // 6a. Vòng xuyến n06_round -> Trạm đỗ xe đích n18_uni_park (L = 65m, Bãi đỗ xe Z.314 + Parkscheinautomat)
    {
      id: 'r06a_round_to_park',
      name: 'Universitätsstraße West',
      from: 'n06_round',
      to: 'n18_uni_park',
      profile: 'wohnstrasse_30',
      poiSigns: [{ type: '314', s: 38, side: 'right' }],
      poiProps: [{ type: 'parkscheinautomat', s: 40, side: 'right' }]
    },
    // 6b. Trạm đỗ xe đích n18_uni_park -> Ngã tư RvL n02_rvl (L = 65m)
    {
      id: 'r06b_park_to_rvl',
      name: 'Universitätsstraße Ost',
      from: 'n18_uni_park',
      to: 'n02_rvl',
      profile: 'wohnstrasse_30'
    },
    // 7. Nhánh thoát cuối đường một chiều n07_west_end -> Vòng xuyến n06_round (khóa tiếp tuyến >= 26m)
    {
      id: 'r07_west_stub',
      name: 'Clara-Zetkin-Straße',
      from: 'n07_west_end',
      to: 'n06_round',
      profile: 'wohnstrasse_30',
      waypoints: [
        [-210, 90],
        [-200, 80],
        [-180, 82],
        [-156, 100],
        [-143, 100]
      ]
    },
    // 8. Nhánh Đông tại ngã tư Rechts-vor-links n02_rvl (L = 100m)
    {
      id: 'r08_rvl_east',
      name: 'Am Kupfergraben',
      from: 'n08_east_end',
      to: 'n02_rvl',
      profile: 'wohnstrasse_30'
    },
    // 9. Trục ngang ngã tư Đèn n04_ampel -> Ngã ba Đèn Đông n09_ampel_east (L = 140m, Trạm buýt 50 km/h)
    {
      id: 'r09_ampel_east',
      name: 'Dorotheenstraße Ost',
      from: 'n04_ampel',
      to: 'n09_ampel_east',
      profile: 'gewerbestrasse_bus_50'
    },
    // 10. Trục Bắc từ n04_ampel -> Cửa ngõ ngoại ô n10_land_gate (L = 140m, Chausseebrücke qua sông Spree)
    {
      id: 'r10_to_land',
      name: 'Chausseestraße',
      from: 'n04_ampel',
      to: 'n10_land_gate',
      profile: 'gewerbestrasse_bus_50',
      bridge: true
    },
    // 11. Trục ưu tiên Friedrichstraße Bắc: n15_land_west -> n05_stop (L = 90m, Friedrichstraßenbrücke qua sông Spree)
    {
      id: 'r11_fried_north',
      name: 'Friedrichstraße Nord',
      from: 'n15_land_west',
      to: 'n05_stop',
      profile: 'sammelstrasse_rad_50',
      priorityOverride: 'main',
      bridge: true
    },
    // 12. [ĐƯỜNG CONG GIỮA NÚT #1] Vòng phía Nam n06_round -> n13_south_west (Đá cuội Altstadt 30 km/h, khóa tiếp tuyến 26m)
    {
      id: 'r12_south_loop',
      name: 'Französische Straße West',
      from: 'n06_round',
      to: 'n13_south_west',
      profile: 'altstadt_pflaster_30',
      waypoints: [
        [-130, 87],
        [-130, 74],
        [-122, 10],
        [-91, -20],
        [-78, -20]
      ]
    },
    // 13. Nhánh nối từ n05_stop -> Đầu đường một chiều n11_oneway_in (khóa tiếp tuyến >= 26m)
    {
      id: 'r13_to_oneway',
      name: 'Reinhardtstraße',
      from: 'n05_stop',
      to: 'n11_oneway_in',
      profile: 'wohnstrasse_30',
      priorityOverride: 'stop',
      waypoints: [
        [-143, 280],
        [-156, 280],
        [-180, 298],
        [-200, 300],
        [-210, 290]
      ]
    },
    // 14a. Đường một chiều chặng Bắc: n11_oneway_in -> n12_oneway_mid (Einbahnstraße 30 km/h, Z.220 / Z.267)
    {
      id: 'r14a_oneway_in',
      name: 'Luisenstraße Nord (Einbahn)',
      from: 'n11_oneway_in',
      to: 'n12_oneway_mid',
      profile: 'einbahnstrasse_30',
      waypoints: [
        [-233, 280],
        [-246, 280],
        [-265, 250],
        [-265, 216],
        [-265, 203]
      ]
    },
    // 14b. Đường một chiều chặng Nam: n12_oneway_mid -> n07_west_end (Einbahnstraße 30 km/h, Z.220 / Z.267)
    {
      id: 'r14b_oneway_out',
      name: 'Luisenstraße Süd (Einbahn)',
      from: 'n12_oneway_mid',
      to: 'n07_west_end',
      profile: 'einbahnstrasse_30',
      waypoints: [
        [-265, 177],
        [-265, 164],
        [-265, 130],
        [-246, 100],
        [-233, 100]
      ]
    },
    // 15. Nhánh nối hai nút bậc 3 phía Tây n11_oneway_in -> n07_west_end (khóa tiếp tuyến 28.28m)
    {
      id: 'r15_west_chord',
      name: 'Wilhelmstraße',
      from: 'n11_oneway_in',
      to: 'n07_west_end',
      profile: 'wohnstrasse_30',
      waypoints: [
        [-210, 270],
        [-200, 260],
        [-192, 190],
        [-200, 120],
        [-210, 110]
      ]
    },
    // 16. Nhánh cụt phía Đông ngã ba Đèn n09_ampel_east -> n14_east_stub (L = 90m)
    {
      id: 'r16_east_stub',
      name: 'Torstraße Ost',
      from: 'n09_ampel_east',
      to: 'n14_east_stub',
      profile: 'gewerbestrasse_bus_50'
    },
    // 17. Nhánh cụt phía Nam điểm xuất phát n17_south_stub -> n01_start (L = 80m)
    {
      id: 'r17_south_stub',
      name: 'Georgenstraße Südende',
      from: 'n17_south_stub',
      to: 'n01_start',
      profile: 'wohnstrasse_30'
    },
    // 18. Trục nối phía Đông từ n09_ampel_east -> n16_land_east (L = 90m, Invalidenbrücke qua sông Spree)
    {
      id: 'r18_land_east_conn',
      name: 'Invalidenstraße Ost',
      from: 'n09_ampel_east',
      to: 'n16_land_east',
      profile: 'sammelstrasse_rad_50',
      bridge: true
    },
    // 19. [ĐƯỜNG CONG GIỮA NÚT #2] Landstraße 70 km/h phía Tây: n10_land_gate -> n15_land_west (khóa tiếp tuyến 26m)
    {
      id: 'r19_land_west',
      name: 'Oranienburger Landstraße West',
      from: 'n10_land_gate',
      to: 'n15_land_west',
      profile: 'landstrasse_70',
      waypoints: [
        [-13, 420],
        [-26, 420],
        [-85, 435],
        [-130, 396],
        [-130, 383]
      ]
    },
    // 20. [ĐƯỜNG CONG GIỮA NÚT #3] Landstraße 70 km/h phía Đông: n16_land_east -> n10_land_gate (khóa tiếp tuyến 26m)
    {
      id: 'r20_land_east',
      name: 'Oranienburger Landstraße Ost',
      from: 'n16_land_east',
      to: 'n10_land_gate',
      profile: 'landstrasse_70',
      waypoints: [
        [140, 383],
        [140, 396],
        [95, 435],
        [26, 420],
        [13, 420]
      ]
    },
    // 21. Đoạn thẳng khép vòng phía Nam n13_south_west -> n01_start (L = 65m)
    {
      id: 'r21_south_conn',
      name: 'Französische Straße Ost',
      from: 'n13_south_west',
      to: 'n01_start',
      profile: 'wohnstrasse_30'
    }
  ],
  waters: [
    {
      id: 'w_spree',
      name: 'Spree',
      width: 26,
      points: [
        [-280, 335],
        [-130, 335],
        [0, 335],
        [140, 335],
        [260, 335]
      ]
    }
  ],
  parks: [
    {
      id: 'p01_lustgarten',
      name: 'Lustgarten am Spreeufer',
      points: [
        [20, 296],
        [120, 296],
        [120, 318],
        [20, 318]
      ]
    },
    {
      id: 'p02_stadtpark',
      name: 'Großer Stadtpark',
      points: [
        [25, 130],
        [85, 130],
        [85, 240],
        [25, 240]
      ]
    }
  ],
  spawns: {
    player: {
      roadId: 'r01_start',
      s: 20, // Xuất phát tại (0, 0), đi hướng Bắc (+Z) vào chu trình sát hạch 18 nút
      lane: 0
    }
  }
};
