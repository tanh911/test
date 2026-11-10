// 🗺️ Map loader — Protocol mục 3: map.json là NGUỒN DỮ LIỆU DUY NHẤT.
// Mọi generator (world/*) và rule engine đọc từ schema này. KHÔNG đổi schema nếu không báo trước.
// Gồm cả curve cache: mỗi road nội suy Catmull-Rom ĐÚNG 1 LẦN (getPointAt đều theo chiều
// dài cung) — roadMesh/markings/sidewalk/buildings/vehicle/NPC dùng chung điểm + chiều dài.
import * as THREE from 'three';

export interface MapNode {
  id: string;
  x: number;
  z: number;
  type: 'intersection' | 'end';
}

export type ParkingType = 'parallel' | 'perpendicular' | 'none';
export type PriorityType = 'main' | 'give_way' | 'stop' | 'equal';
export type SurfaceType = 'asphalt' | 'asphalt_worn' | 'cobble';

export interface RoadSideFlag {
  left: boolean;
  right: boolean;
}

export interface RoadParking {
  left: ParkingType;
  right: ParkingType;
}

export interface MapRoad {
  id: string;
  from: string;
  to: string;
  points: [number, number][];
  lanesForward: number;
  lanesBackward: number;
  laneWidth: number;
  sidewalk: RoadSideFlag;
  bikeLane: RoadSideFlag;
  parking: RoadParking;
  speedLimit: number;
  priority: PriorityType;
  surface: SurfaceType;
}

export type IntersectionRule =
  | 'right_before_left'
  | 'priority_road'
  | 'yield'
  | 'stop'
  | 'traffic_light'
  | 'roundabout';

export interface TrafficLightSpec {
  cycle: 'standard'; // đỏ → đỏ+vàng → xanh → vàng → đỏ
  greenSeconds: number;
  yellowSeconds: number;
  redSeconds: number;
}

export interface MapIntersection {
  nodeId: string;
  rule: IntersectionRule;
  trafficLight: TrafficLightSpec | null;
  crosswalks: string[]; // roadId có zebrastreifen tại node này
}

export interface MapSign {
  type: string; // mã StVO: '205', '206', '306', '102', '274', '274.1', '220', '267', '283', '286', '314', '350', '101', '138', '215'
  roadId: string;
  s: number; // mét dọc đường tính từ node `from`
  side: 'left' | 'right';
  value?: number; // giá trị biển (274: tốc độ)
}

export interface MapBuilding {
  roadId: string;
  side: 'left' | 'right';
  s: number;
  length: number;
  floors: number;
  style: 'altbau' | 'backstein' | 'neubau';
  seed: number;
}

export interface MapProp {
  type: 'street_lamp' | 'tree' | 'bench' | 'bollard' | 'trash_bin' | 'litfasssaeule' | 'parkscheinautomat' | 'bike_rack' | 'parked_car_static';
  roadId: string;
  s: number;
  side: 'left' | 'right';
}

export interface MapSpawn {
  roadId: string;
  s: number;
  lane: number;
}

export interface GameMap {
  version: number;
  nodes: MapNode[];
  roads: MapRoad[];
  intersections: MapIntersection[];
  signs: MapSign[];
  buildings: MapBuilding[];
  props: MapProp[];
  spawns: { player: MapSpawn };
}

export function loadGameMap(json: unknown): GameMap {
  const map = json as GameMap;
  if (map.version !== 1) {
    throw new Error(`[mapLoader] Unsupported map version: ${map.version}`);
  }
  if (!Array.isArray(map.nodes) || !Array.isArray(map.roads)) {
    throw new Error('[mapLoader] map.json thiếu nodes/roads');
  }
  return map;
}

export function nodeById(map: GameMap, id: string): MapNode | undefined {
  return map.nodes.find((n) => n.id === id);
}

export function roadById(map: GameMap, id: string): MapRoad | undefined {
  return map.roads.find((r) => r.id === id);
}

/** Tổng chiều rộng mặt đường: (lanesForward + lanesBackward) × laneWidth */
export function roadFullWidth(road: MapRoad): number {
  return (road.lanesForward + road.lanesBackward) * road.laneWidth;
}

// ── Curve cache dùng chung (mục G1-1) ──────────────────────────────
export interface CurvePoint { x: number; z: number; nx: number; nz: number; }
export interface RoadCurve { pts: CurvePoint[]; length: number; step: number; }

const curveCache = new WeakMap<MapRoad, RoadCurve>();

/** Nội suy Catmull-Rom mỗi `step` m — getPointAt/getTangentAt (đều theo chiều dài cung).
 *  Gọi nhiều lần trả cùng instance → mọi module dùng chung điểm + chiều dài. */
export function roadCurve(road: MapRoad, step = 2): RoadCurve {
  const hit = curveCache.get(road);
  if (hit) return hit;
  const v3 = road.points.map(([x, z]) => new THREE.Vector3(x, 0, z));
  // centripetal: tránh overshoot/loop (hairpin 180°) khi khoảng cách điểm gốc chênh lệch lớn
  const curve = new THREE.CatmullRomCurve3(v3, false, 'centripetal');
  const length = curve.getLength();
  const n = Math.max(2, Math.ceil(length / step));
  const pts: CurvePoint[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    pts.push({ x: p.x, z: p.z, nx: -t.z, nz: t.x });
  }
  const c: RoadCurve = { pts, length, step };
  curveCache.set(road, c);
  return c;
}

/** Chiều dài đường theo curve (không phải polyline gốc) */
export function roadLength(road: MapRoad): number {
  return roadCurve(road).length;
}

export interface RoadPoint {
  x: number; z: number;
  heading: number;       // atan2(tx, tz) — hướng flow từ from→to
  nx: number; nz: number; // pháp tuyến đơn vị (= PHẢI flow)
  tx: number; tz: number; // tangent đơn vị
}

/** Điểm trên tim đường tại s (mét, theo cung) — nội suy tuyến tính giữa 2 sample */
export function roadPointAt(road: MapRoad, s: number): RoadPoint {
  const c = roadCurve(road);
  const clamped = Math.max(0, Math.min(c.length, s));
  const f = (c.pts.length - 1) * (c.length > 0 ? clamped / c.length : 0);
  const i = Math.min(c.pts.length - 2, Math.floor(f));
  const t = Math.max(0, Math.min(1, f - i));
  const a = c.pts[i];
  const b = c.pts[i + 1];
  const x = a.x + (b.x - a.x) * t;
  const z = a.z + (b.z - a.z) * t;
  let nx = a.nx + (b.nx - a.nx) * t;
  let nz = a.nz + (b.nz - a.nz) * t;
  const nl = Math.hypot(nx, nz) || 1;
  nx /= nl;
  nz /= nl;
  const tx = b.x - a.x;
  const tz = b.z - a.z;
  const tl = Math.hypot(tx, tz) || 1;
  return { x, z, nx, nz, tx: tx / tl, tz: tz / tl, heading: Math.atan2(tx / tl, tz / tl) };
}

/** Điểm trên tim đường tại khoảng cách s (mét) tính từ node `from` — wrapper mỏng */
export function pointAtS(road: MapRoad, s: number): { x: number; z: number; heading: number } {
  const p = roadPointAt(road, s);
  return { x: p.x, z: p.z, heading: p.heading };
}
